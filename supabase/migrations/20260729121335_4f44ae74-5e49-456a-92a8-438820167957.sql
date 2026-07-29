
-- Seed auth_access row if missing
INSERT INTO public.site_settings (key, value)
VALUES ('auth_access', '{"signin_enabled": true, "signup_enabled": true, "signin_locked_message": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Allow anonymous + authenticated public read of ONLY the auth_access row
GRANT SELECT ON public.site_settings TO anon;

DROP POLICY IF EXISTS "public can read auth_access" ON public.site_settings;
CREATE POLICY "public can read auth_access"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (key = 'auth_access');
