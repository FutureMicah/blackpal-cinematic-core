
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_lesson_completion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.progress_percent >= 90 AND NOT NEW.completed THEN
    NEW.completed = TRUE;
    NEW.completed_at = NOW();
    PERFORM award_xp(
      NEW.user_id,
      (SELECT xp_reward FROM lessons WHERE id = NEW.lesson_id),
      'lesson_completion',
      NEW.lesson_id,
      'Completed lesson'
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  days_diff INTEGER;
BEGIN
  SELECT EXTRACT(DAY FROM (CURRENT_DATE - last_activity_date))::INTEGER
  INTO days_diff
  FROM profiles
  WHERE id = NEW.user_id;

  IF days_diff IS NULL OR days_diff > 1 THEN
    UPDATE profiles
    SET current_streak = 1,
        last_activity_date = CURRENT_DATE
    WHERE id = NEW.user_id;
  ELSIF days_diff = 1 THEN
    UPDATE profiles
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_activity_date = CURRENT_DATE
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_amount integer, p_source xp_source, p_reference_id uuid DEFAULT NULL::uuid, p_description text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO xp_transactions (user_id, amount, source, reference_id, description)
  VALUES (p_user_id, p_amount, p_source, p_reference_id, p_description);

  UPDATE profiles
  SET total_xp = total_xp + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$function$;
