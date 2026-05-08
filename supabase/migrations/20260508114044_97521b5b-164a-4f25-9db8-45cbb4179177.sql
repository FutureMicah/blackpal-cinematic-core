-- Revoke EXECUTE on SECURITY DEFINER functions that are not meant to be called from the API.

-- Trigger-only functions
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_lesson_completion() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_user_streak() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_role_escalation() FROM PUBLIC, anon, authenticated;

-- Internal helpers (called by other definer functions, not by clients)
REVOKE ALL ON FUNCTION public.award_xp(uuid, integer, xp_source, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_wallet_balance(uuid, text, numeric, text, text) FROM PUBLIC, anon, authenticated;

-- Functions intentionally exposed via PostgREST: keep EXECUTE for the appropriate roles only.
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.claim_contest_prize(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_contest_prize(text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_contest_leaderboard(timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_contest_leaderboard(timestamptz) TO authenticated;

REVOKE ALL ON FUNCTION public.complete_mission(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_mission(uuid, uuid) TO authenticated;
