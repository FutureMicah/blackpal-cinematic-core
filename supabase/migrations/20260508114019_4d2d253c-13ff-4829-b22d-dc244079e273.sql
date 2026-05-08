-- 1. admin_ui_settings: restrict reads to authenticated users
DROP POLICY IF EXISTS "Everyone can view UI settings" ON public.admin_ui_settings;
CREATE POLICY "Authenticated users can view UI settings"
  ON public.admin_ui_settings FOR SELECT
  TO authenticated
  USING (true);

-- 2. feature_flags: restrict reads to authenticated users (hides cohort_filter from public)
DROP POLICY IF EXISTS "Everyone can view flags" ON public.feature_flags;
CREATE POLICY "Authenticated users can view flags"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- 3. user_roles: hard-guard against privilege escalation via any insert path
--    (catches SECURITY DEFINER functions, triggers, or service-role misuse).
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins (or the database superuser running migrations) may grant 'admin' role.
  IF NEW.role = 'admin'::public.app_role THEN
    IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
      RAISE EXCEPTION 'Only existing admins may assign the admin role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.user_roles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- 4. storage.objects: explicit owner-scoped UPDATE / DELETE for payment-screenshots
DROP POLICY IF EXISTS "Users can update their own payment screenshots" ON storage.objects;
CREATE POLICY "Users can update their own payment screenshots"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own payment screenshots" ON storage.objects;
CREATE POLICY "Users can delete their own payment screenshots"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can manage all payment screenshots (review/cleanup workflows)
DROP POLICY IF EXISTS "Admins can manage payment screenshots" ON storage.objects;
CREATE POLICY "Admins can manage payment screenshots"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'payment-screenshots' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'payment-screenshots' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- 5. realtime.messages: scope channel subscriptions to authenticated users only.
--    (Topic-level authorization is enforced in client code by namespacing channels per user_id;
--     this policy at minimum blocks unauthenticated subscribers.)
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can receive realtime messages" ON realtime.messages;
CREATE POLICY "Authenticated users can receive realtime messages"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (true);
