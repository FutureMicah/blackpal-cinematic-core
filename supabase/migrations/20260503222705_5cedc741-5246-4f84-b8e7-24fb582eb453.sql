REVOKE EXECUTE ON FUNCTION public.get_contest_leaderboard(TIMESTAMPTZ) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.claim_contest_prize(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_contest_leaderboard(TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_contest_prize(TEXT) TO authenticated;