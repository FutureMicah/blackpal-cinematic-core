
-- Lock down EXECUTE on SECURITY DEFINER functions to least privilege.
REVOKE ALL ON FUNCTION public.claim_contest_prize(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.claim_contest_prize(text) TO authenticated;

REVOKE ALL ON FUNCTION public.complete_mission(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.complete_mission(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.update_wallet_balance(uuid, text, numeric, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.update_wallet_balance(uuid, text, numeric, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_contest_leaderboard(timestamptz) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_contest_leaderboard(timestamptz) TO authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Internal-only helpers: never callable from client roles
REVOKE ALL ON FUNCTION public.award_xp(uuid, integer, xp_source, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.award_xp(uuid, integer, xp_source, uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
