
CREATE OR REPLACE FUNCTION public.claim_contest_prize(p_contest_period text, p_user_id uuid DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user UUID := COALESCE(p_user_id, auth.uid());
  v_rank INTEGER;
  v_pnl NUMERIC;
  v_tier TEXT;
  v_amount NUMERIC;
  v_existing UUID;
  v_token UUID;
  v_period_end TIMESTAMPTZ;
  v_period_start TIMESTAMPTZ;
  v_year INT;
  v_month INT;
  v_week INT;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'code', 'unauthenticated', 'error', 'Not authenticated');
  END IF;

  BEGIN
    v_week  := NULLIF(split_part(substring(p_contest_period from 2), '-', 1), '')::int;
    v_year  := split_part(p_contest_period, '-', 2)::int;
    v_month := split_part(p_contest_period, '-', 3)::int;
    v_period_start := date_trunc('week', make_date(v_year, v_month, LEAST(v_week * 7, 28))::timestamptz);
    v_period_end   := v_period_start + INTERVAL '7 days';
  EXCEPTION WHEN OTHERS THEN
    v_period_end := date_trunc('week', now()) + INTERVAL '7 days';
    v_period_start := date_trunc('week', now());
  END;

  IF now() < v_period_end THEN
    RETURN jsonb_build_object('success', false, 'code', 'contest_active', 'error', 'Contest still active — claims open after period ends', 'ends_at', v_period_end);
  END IF;

  SELECT id INTO v_existing FROM contest_claims WHERE user_id = v_user AND contest_period = p_contest_period;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'code', 'already_claimed', 'error', 'Already claimed for this period');
  END IF;

  SELECT rank::int, total_pnl INTO v_rank, v_pnl
  FROM get_contest_leaderboard(v_period_start)
  WHERE user_id = v_user;

  IF v_rank IS NULL THEN
    RETURN jsonb_build_object('success', false, 'code', 'no_trades', 'error', 'No qualifying trades in this period');
  END IF;

  IF v_rank = 1 THEN v_tier := 'GOLD'; v_amount := 5000;
  ELSIF v_rank = 2 THEN v_tier := 'SILVER'; v_amount := 2500;
  ELSIF v_rank = 3 THEN v_tier := 'BRONZE'; v_amount := 1000;
  ELSIF v_rank <= 10 THEN v_tier := 'TOP_10'; v_amount := 500;
  ELSIF v_rank <= 50 THEN v_tier := 'TOP_50'; v_amount := 100;
  ELSE
    RETURN jsonb_build_object('success', false, 'code', 'rank_too_low', 'error', 'Rank #' || v_rank || ' is outside the prize tiers', 'rank', v_rank);
  END IF;

  INSERT INTO contest_claims (user_id, contest_period, rank, prize_tier, prize_amount)
  VALUES (v_user, p_contest_period, v_rank, v_tier, v_amount);

  SELECT id INTO v_token FROM tokens WHERE symbol = 'BTK' LIMIT 1;
  IF v_token IS NOT NULL THEN
    INSERT INTO user_wallets (user_id, token_id, balance)
    VALUES (v_user, v_token, v_amount)
    ON CONFLICT (user_id, token_id) DO UPDATE
      SET balance = user_wallets.balance + v_amount, updated_at = now();
    INSERT INTO transactions (user_id, token_id, amount, transaction_type, description)
    VALUES (v_user, v_token, v_amount, 'contest_prize', 'Contest ' || p_contest_period || ' — ' || v_tier);
  END IF;

  RETURN jsonb_build_object('success', true, 'rank', v_rank, 'tier', v_tier, 'amount', v_amount, 'pnl', COALESCE(v_pnl, 0), 'period', p_contest_period, 'claimed_at', now());
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.claim_contest_prize(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_contest_prize(text, uuid) TO service_role;
