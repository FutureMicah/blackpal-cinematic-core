CREATE TABLE public.trading_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'Challenge',
  account_type text NOT NULL DEFAULT 'challenge',
  locked_amount numeric NOT NULL DEFAULT 0,
  starting_balance numeric NOT NULL,
  balance numeric NOT NULL,
  peak_balance numeric NOT NULL,
  day_start_balance numeric NOT NULL,
  day_anchor_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  max_leverage integer NOT NULL DEFAULT 20,
  daily_loss_limit_pct numeric NOT NULL DEFAULT 5,
  max_drawdown_pct numeric NOT NULL DEFAULT 10,
  profit_target_pct numeric NOT NULL DEFAULT 10,
  profit_split_pct numeric NOT NULL DEFAULT 80,
  status text NOT NULL DEFAULT 'active',
  breach_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.trading_accounts TO authenticated;
GRANT ALL ON public.trading_accounts TO service_role;
ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own trading accounts"
  ON public.trading_accounts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_trading_accounts_user ON public.trading_accounts(user_id, status);

CREATE TRIGGER trg_trading_accounts_updated_at
  BEFORE UPDATE ON public.trading_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.account_payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  gross_profit numeric NOT NULL,
  profit_split_pct numeric NOT NULL,
  net_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.account_payouts TO authenticated;
GRANT ALL ON public.account_payouts TO service_role;
ALTER TABLE public.account_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payouts"
  ON public.account_payouts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_account_payouts_updated_at
  BEFORE UPDATE ON public.account_payouts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.open_trading_account(
  p_user_id uuid,
  p_amount numeric,
  p_label text DEFAULT 'Challenge',
  p_max_leverage integer DEFAULT 20,
  p_daily_loss_limit_pct numeric DEFAULT 5,
  p_max_drawdown_pct numeric DEFAULT 10,
  p_profit_target_pct numeric DEFAULT 10,
  p_profit_split_pct numeric DEFAULT 80
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_account public.trading_accounts;
  v_wallet_result jsonb;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_AMOUNT', 'message', 'Lock amount must be greater than zero');
  END IF;

  IF EXISTS (SELECT 1 FROM public.trading_accounts WHERE user_id = p_user_id AND status = 'active') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'ACCOUNT_EXISTS', 'message', 'You already have an active locked account');
  END IF;

  v_wallet_result := public.update_wallet_balance(
    p_user_id, 'BTK', -p_amount, 'capital_lock',
    'Locked ' || p_amount || ' BTK into trading account'
  );

  IF COALESCE((v_wallet_result->>'success')::boolean, false) IS NOT TRUE THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INSUFFICIENT_FUNDS', 'message', COALESCE(v_wallet_result->>'error', 'Not enough BTK to lock'));
  END IF;

  INSERT INTO public.trading_accounts (
    user_id, label, locked_amount, starting_balance, balance, peak_balance, day_start_balance,
    max_leverage, daily_loss_limit_pct, max_drawdown_pct, profit_target_pct, profit_split_pct
  ) VALUES (
    p_user_id, p_label, p_amount, p_amount, p_amount, p_amount, p_amount,
    p_max_leverage, p_daily_loss_limit_pct, p_max_drawdown_pct, p_profit_target_pct, p_profit_split_pct
  ) RETURNING * INTO v_account;

  RETURN jsonb_build_object('ok', true, 'account', to_jsonb(v_account));
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_trade_result(
  p_user_id uuid,
  p_pnl numeric
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a public.trading_accounts;
  v_today date := (now() AT TIME ZONE 'utc')::date;
  v_new_balance numeric;
  v_daily_loss_pct numeric;
  v_drawdown_pct numeric;
  v_status text;
  v_reason text;
BEGIN
  SELECT * INTO a FROM public.trading_accounts
   WHERE user_id = p_user_id AND status = 'active'
   ORDER BY created_at DESC LIMIT 1;

  IF a.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NO_ACTIVE_ACCOUNT', 'message', 'No active locked account');
  END IF;

  IF a.day_anchor_date <> v_today THEN
    a.day_anchor_date := v_today;
    a.day_start_balance := a.balance;
  END IF;

  v_new_balance := a.balance + COALESCE(p_pnl, 0);
  v_daily_loss_pct := CASE WHEN a.day_start_balance > 0
    THEN GREATEST(0, (a.day_start_balance - v_new_balance) / a.day_start_balance * 100) ELSE 0 END;
  v_drawdown_pct := CASE WHEN a.peak_balance > 0
    THEN GREATEST(0, (a.peak_balance - v_new_balance) / a.peak_balance * 100) ELSE 0 END;

  v_status := 'active';
  IF v_daily_loss_pct >= a.daily_loss_limit_pct THEN
    v_status := 'breached';
    v_reason := 'Daily loss limit of ' || a.daily_loss_limit_pct || '% exceeded';
  ELSIF v_drawdown_pct >= a.max_drawdown_pct THEN
    v_status := 'breached';
    v_reason := 'Max drawdown of ' || a.max_drawdown_pct || '% exceeded';
  ELSIF a.starting_balance > 0
    AND (v_new_balance - a.starting_balance) / a.starting_balance * 100 >= a.profit_target_pct THEN
    v_status := 'passed';
    v_reason := 'Profit target reached';
  END IF;

  UPDATE public.trading_accounts SET
    balance = v_new_balance,
    peak_balance = GREATEST(a.peak_balance, v_new_balance),
    day_anchor_date = a.day_anchor_date,
    day_start_balance = a.day_start_balance,
    status = v_status,
    breach_reason = v_reason
  WHERE id = a.id
  RETURNING * INTO a;

  IF v_status <> 'active' THEN
    INSERT INTO public.user_activities (user_id, activity_type, title, description, metadata)
    VALUES (p_user_id,
      CASE WHEN v_status = 'breached' THEN 'account_breached' ELSE 'account_passed' END,
      CASE WHEN v_status = 'breached' THEN 'Account breached' ELSE 'Challenge passed' END,
      v_reason,
      jsonb_build_object('account_id', a.id, 'balance', v_new_balance));
  END IF;

  RETURN jsonb_build_object('ok', true, 'account', to_jsonb(a),
    'daily_loss_pct', v_daily_loss_pct, 'drawdown_pct', v_drawdown_pct);
END;
$$;

CREATE OR REPLACE FUNCTION public.request_account_payout(
  p_user_id uuid,
  p_account_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a public.trading_accounts;
  v_profit numeric;
  v_net numeric;
  v_payout public.account_payouts;
BEGIN
  SELECT * INTO a FROM public.trading_accounts WHERE id = p_account_id AND user_id = p_user_id;
  IF a.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND', 'message', 'Account not found');
  END IF;
  IF a.status <> 'passed' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_ELIGIBLE', 'message', 'Payouts unlock only after the profit target is reached');
  END IF;

  v_profit := a.balance - a.starting_balance;
  IF v_profit <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NO_PROFIT', 'message', 'No profit available to pay out');
  END IF;

  IF EXISTS (SELECT 1 FROM public.account_payouts WHERE account_id = a.id AND status = 'pending') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PAYOUT_PENDING', 'message', 'A payout request is already pending');
  END IF;

  v_net := round(v_profit * a.profit_split_pct / 100.0, 2);

  INSERT INTO public.account_payouts (user_id, account_id, gross_profit, profit_split_pct, net_amount)
  VALUES (p_user_id, a.id, v_profit, a.profit_split_pct, v_net)
  RETURNING * INTO v_payout;

  PERFORM public.update_wallet_balance(
    p_user_id, 'BTK', a.starting_balance + v_net, 'payout',
    'Payout: capital ' || a.starting_balance || ' + profit share ' || v_net || ' BTK'
  );

  UPDATE public.trading_accounts SET status = 'closed', breach_reason = 'Paid out' WHERE id = a.id;
  UPDATE public.account_payouts SET status = 'paid' WHERE id = v_payout.id RETURNING * INTO v_payout;

  RETURN jsonb_build_object('ok', true, 'payout', to_jsonb(v_payout));
END;
$$;

REVOKE ALL ON FUNCTION public.open_trading_account(uuid, numeric, text, integer, numeric, numeric, numeric, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_trade_result(uuid, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.request_account_payout(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.open_trading_account(uuid, numeric, text, integer, numeric, numeric, numeric, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_trade_result(uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.request_account_payout(uuid, uuid) TO service_role;