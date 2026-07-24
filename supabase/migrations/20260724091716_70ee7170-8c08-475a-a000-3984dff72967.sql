
-- 1) Hide quizzes.correct_answer via column-level privileges
REVOKE SELECT ON public.quizzes FROM anon, authenticated;
GRANT SELECT (id, lesson_id, question, options, explanation, xp_reward, order_index, created_at) ON public.quizzes TO anon, authenticated;
GRANT ALL ON public.quizzes TO service_role;

-- 2) Scope realtime.messages by topic = auth.uid()
DROP POLICY IF EXISTS "Authenticated users can receive realtime messages" ON realtime.messages;
CREATE POLICY "Users receive only their own topic"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING ( (SELECT realtime.topic()) = auth.uid()::text );

-- 3) has_role → SECURITY INVOKER (users can read their own user_roles row via RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- 4) Revoke EXECUTE from authenticated/anon on the remaining DEFINER RPCs; keep service_role
REVOKE EXECUTE ON FUNCTION public.claim_contest_prize(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.complete_mission(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_contest_leaderboard(timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_contest_prize(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_mission(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_contest_leaderboard(timestamptz) TO service_role;
