-- Contest claims table
CREATE TABLE IF NOT EXISTS public.contest_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contest_period TEXT NOT NULL,
  rank INTEGER NOT NULL,
  prize_tier TEXT NOT NULL,
  prize_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'claimed',
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, contest_period)
);

ALTER TABLE public.contest_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own claims" ON public.contest_claims
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own claims" ON public.contest_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage claims" ON public.contest_claims
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Realtime
ALTER TABLE public.contest_claims REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_claims;

-- Leaderboard aggregation function (SECURITY DEFINER bypasses RLS to read all activities)
CREATE OR REPLACE FUNCTION public.get_contest_leaderboard(p_since TIMESTAMPTZ DEFAULT (now() - INTERVAL '7 days'))
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  total_pnl NUMERIC,
  trade_count BIGINT,
  win_count BIGINT,
  rank BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH agg AS (
    SELECT
      a.user_id,
      COALESCE(SUM((a.metadata->>'pnl')::numeric), 0) AS total_pnl,
      COUNT(*) FILTER (WHERE a.activity_type IN ('trade_executed','trade_closed')) AS trade_count,
      COUNT(*) FILTER (WHERE (a.metadata->>'pnl')::numeric > 0) AS win_count
    FROM public.user_activities a
    WHERE a.created_at >= p_since
      AND a.activity_type IN ('trade_executed','trade_closed')
    GROUP BY a.user_id
  )
  SELECT
    p.id AS user_id,
    p.full_name,
    p.email,
    p.avatar_url,
    COALESCE(agg.total_pnl, 0) AS total_pnl,
    COALESCE(agg.trade_count, 0) AS trade_count,
    COALESCE(agg.win_count, 0) AS win_count,
    RANK() OVER (ORDER BY COALESCE(agg.total_pnl, 0) DESC) AS rank
  FROM public.profiles p
  LEFT JOIN agg ON agg.user_id = p.id
  WHERE COALESCE(agg.trade_count, 0) > 0
  ORDER BY total_pnl DESC
  LIMIT 100;
$$;

-- Claim prize function
CREATE OR REPLACE FUNCTION public.claim_contest_prize(p_contest_period TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_rank INTEGER;
  v_tier TEXT;
  v_amount NUMERIC;
  v_existing UUID;
  v_token UUID;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO v_existing FROM contest_claims
   WHERE user_id = v_user AND contest_period = p_contest_period;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already claimed');
  END IF;

  SELECT rank::int INTO v_rank
  FROM get_contest_leaderboard(now() - INTERVAL '7 days')
  WHERE user_id = v_user;

  IF v_rank IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not eligible — no qualifying trades');
  END IF;

  IF v_rank = 1 THEN v_tier := 'GOLD'; v_amount := 5000;
  ELSIF v_rank = 2 THEN v_tier := 'SILVER'; v_amount := 2500;
  ELSIF v_rank = 3 THEN v_tier := 'BRONZE'; v_amount := 1000;
  ELSIF v_rank <= 10 THEN v_tier := 'TOP_10'; v_amount := 500;
  ELSIF v_rank <= 50 THEN v_tier := 'TOP_50'; v_amount := 100;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Rank ' || v_rank || ' not in prize tier');
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

  RETURN jsonb_build_object('success', true, 'rank', v_rank, 'tier', v_tier, 'amount', v_amount);
END;
$$;