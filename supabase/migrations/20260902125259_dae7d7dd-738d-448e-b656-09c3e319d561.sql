CREATE TABLE public.user_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  read_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.user_notifications TO authenticated;
GRANT ALL ON public.user_notifications TO service_role;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.user_notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users mark own notifications read"
  ON public.user_notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_notifications_user_created
  ON public.user_notifications(user_id, created_at DESC);

CREATE TABLE public.notification_preferences (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  in_app_enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT false,
  risk_alerts_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification preferences"
  ON public.notification_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.create_risk_notification(
  p_user_id uuid,
  p_kind text,
  p_title text,
  p_message text,
  p_severity text DEFAULT 'info',
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.notification_preferences
    WHERE user_id = p_user_id AND (in_app_enabled = false OR risk_alerts_enabled = false)
  ) THEN
    RETURN;
  END IF;

  IF p_metadata ? 'alert_key' AND EXISTS (
    SELECT 1 FROM public.user_notifications
    WHERE user_id = p_user_id
      AND metadata->>'alert_key' = p_metadata->>'alert_key'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.user_notifications (user_id, kind, title, message, severity, metadata)
  VALUES (p_user_id, p_kind, p_title, p_message, p_severity, COALESCE(p_metadata, '{}'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.create_risk_notification(uuid, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_risk_notification(uuid, text, text, text, text, jsonb) TO service_role;

DROP FUNCTION IF EXISTS public.open_trading_account(uuid, numeric, text, integer, numeric, numeric, numeric, numeric);
CREATE OR REPLACE FUNCTION public.open_trading_account(
  p_user_id uuid,
  p_amount numeric,
  p_label text DEFAULT 'Challenge',
  p_max_leverage integer DEFAULT 20,
  p_daily_loss_limit_pct numeric DEFAULT 5,
  p_max_drawdown_pct numeric DEFAULT 10,
  p_profit_target_pct numeric DEFAULT 10,
  p_profit_split_pct numeric DEFAULT 80,
  p_request_id uuid DEFAULT gen_random_uuid()
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_account public.trading_accounts;
  v_wallet_result jsonb;
  v_request_id uuid := COALESCE(p_request_id, gen_random_uuid());
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_AMOUNT', 'message', 'Lock amount must be greater than zero');
  END IF;
  IF EXISTS (SELECT 1 FROM public.trading_accounts WHERE user_id = p_user_id AND status = 'active') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'ACCOUNT_EXISTS', 'message', 'You already have an active locked account');
  END IF;

  v_wallet_result := public.update_wallet_balance(p_user_id, 'BTK', -p_amount, 'capital_lock', 'Locked ' || p_amount || ' BTK into trading account');
  IF COALESCE((v_wallet_result->>'success')::boolean, false) IS NOT TRUE THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INSUFFICIENT_FUNDS', 'message', COALESCE(v_wallet_result->>'error', 'Not enough BTK to lock'));
  END IF;

  INSERT INTO public.trading_accounts (user_id, label, locked_amount, starting_balance, balance, peak_balance, day_start_balance, max_leverage, daily_loss_limit_pct, max_drawdown_pct, profit_target_pct, profit_split_pct)
  VALUES (p_user_id, p_label, p_amount, p_amount, p_amount, p_amount, p_amount, p_max_leverage, p_daily_loss_limit_pct, p_max_drawdown_pct, p_profit_target_pct, p_profit_split_pct)
  RETURNING * INTO v_account;

  INSERT INTO public.user_activities (user_id, activity_type, title, description, metadata)
  VALUES (p_user_id, 'account_locked', 'Capital locked', p_amount || ' BTK locked into ' || p_label, jsonb_build_object('account_id', v_account.id, 'amount', p_amount, 'request_id', v_request_id));
  PERFORM public.create_risk_notification(p_user_id, 'account_locked', 'Trading account live', p_amount || ' BTK is locked. Your risk rules are now active.', 'success', jsonb_build_object('account_id', v_account.id, 'request_id', v_request_id, 'alert_key', 'account_locked:' || v_account.id));

  RETURN jsonb_build_object('ok', true, 'request_id', v_request_id, 'account', to_jsonb(v_account));
END;
$$;

DROP FUNCTION IF EXISTS public.apply_trade_result(uuid, numeric);
CREATE OR REPLACE FUNCTION public.apply_trade_result(
  p_user_id uuid,
  p_pnl numeric,
  p_request_id uuid DEFAULT gen_random_uuid()
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a public.trading_accounts;
  v_today date := (now() AT TIME ZONE 'utc')::date;
  v_new_balance numeric;
  v_daily_loss_pct numeric;
  v_drawdown_pct numeric;
  v_status text := 'active';
  v_reason text;
  v_request_id uuid := COALESCE(p_request_id, gen_random_uuid());
  v_daily_used numeric;
  v_dd_used numeric;
BEGIN
  SELECT * INTO a FROM public.trading_accounts WHERE user_id = p_user_id AND status = 'active' ORDER BY created_at DESC LIMIT 1;
  IF a.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NO_ACTIVE_ACCOUNT', 'message', 'No active locked account');
  END IF;
  IF a.day_anchor_date <> v_today THEN
    a.day_anchor_date := v_today;
    a.day_start_balance := a.balance;
  END IF;

  v_new_balance := a.balance + COALESCE(p_pnl, 0);
  v_daily_loss_pct := CASE WHEN a.day_start_balance > 0 THEN GREATEST(0, (a.day_start_balance - v_new_balance) / a.day_start_balance * 100) ELSE 0 END;
  v_drawdown_pct := CASE WHEN a.peak_balance > 0 THEN GREATEST(0, (a.peak_balance - v_new_balance) / a.peak_balance * 100) ELSE 0 END;
  v_daily_used := CASE WHEN a.daily_loss_limit_pct > 0 THEN v_daily_loss_pct / a.daily_loss_limit_pct * 100 ELSE 0 END;
  v_dd_used := CASE WHEN a.max_drawdown_pct > 0 THEN v_drawdown_pct / a.max_drawdown_pct * 100 ELSE 0 END;

  IF v_daily_loss_pct >= a.daily_loss_limit_pct THEN
    v_status := 'breached'; v_reason := 'Daily loss limit of ' || a.daily_loss_limit_pct || '% exceeded';
  ELSIF v_drawdown_pct >= a.max_drawdown_pct THEN
    v_status := 'breached'; v_reason := 'Max drawdown of ' || a.max_drawdown_pct || '% exceeded';
  ELSIF a.starting_balance > 0 AND (v_new_balance - a.starting_balance) / a.starting_balance * 100 >= a.profit_target_pct THEN
    v_status := 'passed'; v_reason := 'Profit target reached';
  END IF;

  UPDATE public.trading_accounts SET balance = v_new_balance, peak_balance = GREATEST(a.peak_balance, v_new_balance), day_anchor_date = a.day_anchor_date, day_start_balance = a.day_start_balance, status = v_status, breach_reason = v_reason WHERE id = a.id RETURNING * INTO a;

  IF v_daily_used >= 70 AND v_status = 'active' THEN
    PERFORM public.create_risk_notification(p_user_id, 'risk_warning', 'Daily loss limit warning', 'Daily loss usage is at ' || round(v_daily_used, 1) || '%. Reduce exposure before the limit is reached.', CASE WHEN v_daily_used >= 90 THEN 'critical' ELSE 'warning' END, jsonb_build_object('account_id', a.id, 'usage_pct', v_daily_used, 'request_id', v_request_id, 'alert_key', 'daily:' || a.id || ':' || CASE WHEN v_daily_used >= 90 THEN '90' ELSE '70' END));
  END IF;
  IF v_dd_used >= 70 AND v_status = 'active' THEN
    PERFORM public.create_risk_notification(p_user_id, 'risk_warning', 'Drawdown limit warning', 'Drawdown usage is at ' || round(v_dd_used, 1) || '%. Protect your locked account.', CASE WHEN v_dd_used >= 90 THEN 'critical' ELSE 'warning' END, jsonb_build_object('account_id', a.id, 'usage_pct', v_dd_used, 'request_id', v_request_id, 'alert_key', 'drawdown:' || a.id || ':' || CASE WHEN v_dd_used >= 90 THEN '90' ELSE '70' END));
  END IF;
  IF v_status = 'breached' THEN
    INSERT INTO public.user_activities (user_id, activity_type, title, description, metadata) VALUES (p_user_id, 'account_breached', 'Account auto-blocked', v_reason, jsonb_build_object('account_id', a.id, 'balance', v_new_balance, 'request_id', v_request_id));
    PERFORM public.create_risk_notification(p_user_id, 'account_breached', 'Trading auto-blocked', v_reason || '. New trades are disabled.', 'critical', jsonb_build_object('account_id', a.id, 'request_id', v_request_id, 'alert_key', 'breached:' || a.id));
  ELSIF v_status = 'passed' THEN
    INSERT INTO public.user_activities (user_id, activity_type, title, description, metadata) VALUES (p_user_id, 'account_passed', 'Challenge passed', v_reason, jsonb_build_object('account_id', a.id, 'balance', v_new_balance, 'request_id', v_request_id));
    PERFORM public.create_risk_notification(p_user_id, 'cashout_available', 'Cashout is available', 'Your profit target is reached. Request your capital and profit share from the risk panel.', 'success', jsonb_build_object('account_id', a.id, 'request_id', v_request_id, 'alert_key', 'cashout:' || a.id));
  END IF;

  RETURN jsonb_build_object('ok', true, 'request_id', v_request_id, 'account', to_jsonb(a), 'daily_loss_pct', v_daily_loss_pct, 'drawdown_pct', v_drawdown_pct);
END;
$$;

DROP FUNCTION IF EXISTS public.request_account_payout(uuid, uuid);
CREATE OR REPLACE FUNCTION public.request_account_payout(
  p_user_id uuid,
  p_account_id uuid,
  p_request_id uuid DEFAULT gen_random_uuid()
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a public.trading_accounts;
  v_profit numeric;
  v_net numeric;
  v_payout public.account_payouts;
  v_request_id uuid := COALESCE(p_request_id, gen_random_uuid());
BEGIN
  SELECT * INTO a FROM public.trading_accounts WHERE id = p_account_id AND user_id = p_user_id;
  IF a.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND', 'message', 'Account not found'); END IF;
  IF a.status <> 'passed' THEN RETURN jsonb_build_object('ok', false, 'code', 'NOT_ELIGIBLE', 'message', 'Payouts unlock only after the profit target is reached'); END IF;
  v_profit := a.balance - a.starting_balance;
  IF v_profit <= 0 THEN RETURN jsonb_build_object('ok', false, 'code', 'NO_PROFIT', 'message', 'No profit available to pay out'); END IF;
  IF EXISTS (SELECT 1 FROM public.account_payouts WHERE account_id = a.id AND status = 'pending') THEN RETURN jsonb_build_object('ok', false, 'code', 'PAYOUT_PENDING', 'message', 'A payout request is already pending'); END IF;

  v_net := round(v_profit * a.profit_split_pct / 100.0, 2);
  INSERT INTO public.account_payouts (user_id, account_id, gross_profit, profit_split_pct, net_amount) VALUES (p_user_id, a.id, v_profit, a.profit_split_pct, v_net) RETURNING * INTO v_payout;
  PERFORM public.update_wallet_balance(p_user_id, 'BTK', a.starting_balance + v_net, 'payout', 'Payout: capital ' || a.starting_balance || ' + profit share ' || v_net || ' BTK');
  UPDATE public.trading_accounts SET status = 'closed', breach_reason = 'Paid out' WHERE id = a.id;
  UPDATE public.account_payouts SET status = 'paid' WHERE id = v_payout.id RETURNING * INTO v_payout;

  INSERT INTO public.user_activities (user_id, activity_type, title, description, metadata) VALUES (p_user_id, 'account_unlocked', 'Trading capital unlocked', 'Account closed after successful cashout', jsonb_build_object('account_id', a.id, 'request_id', v_request_id));
  INSERT INTO public.user_activities (user_id, activity_type, title, description, metadata) VALUES (p_user_id, 'account_cashout', 'Cashout completed', 'Capital and profit share credited to wallet', jsonb_build_object('account_id', a.id, 'payout_id', v_payout.id, 'amount', a.starting_balance + v_net, 'request_id', v_request_id));
  PERFORM public.create_risk_notification(p_user_id, 'cashout_completed', 'Cashout completed', (a.starting_balance + v_net) || ' BTK has been credited to your wallet.', 'success', jsonb_build_object('account_id', a.id, 'payout_id', v_payout.id, 'request_id', v_request_id, 'alert_key', 'cashout-completed:' || v_payout.id));

  RETURN jsonb_build_object('ok', true, 'request_id', v_request_id, 'payout', to_jsonb(v_payout));
END;
$$;

REVOKE ALL ON FUNCTION public.open_trading_account(uuid, numeric, text, integer, numeric, numeric, numeric, numeric, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_trade_result(uuid, numeric, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.request_account_payout(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.open_trading_account(uuid, numeric, text, integer, numeric, numeric, numeric, numeric, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_trade_result(uuid, numeric, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.request_account_payout(uuid, uuid, uuid) TO service_role;

ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;