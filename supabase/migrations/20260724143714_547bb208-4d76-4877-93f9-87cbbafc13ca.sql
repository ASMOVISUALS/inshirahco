
-- Convert has_role to SECURITY INVOKER; it relies on the authenticated user's
-- own read-own-role RLS policy on user_roles. Anon has no SELECT on user_roles
-- so has_role returns false for unauthenticated calls, which is what we want.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Replace overly permissive WITH CHECK (true) on public newsletter signups
-- with a minimal shape check on the email column.
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_signups;
CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND char_length(email) BETWEEN 3 AND 254
    AND position('@' in email) > 1
  );
