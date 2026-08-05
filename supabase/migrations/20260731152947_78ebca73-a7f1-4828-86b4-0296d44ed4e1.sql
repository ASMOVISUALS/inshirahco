ALTER TABLE public.public_profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

UPDATE public.public_profiles pp
SET is_admin = EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = pp.user_id AND ur.role = 'admin'
);

CREATE OR REPLACE FUNCTION public.sync_public_profile_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target uuid := COALESCE(NEW.user_id, OLD.user_id);
BEGIN
  UPDATE public.public_profiles
  SET is_admin = EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = target AND ur.role = 'admin'
  )
  WHERE user_id = target;
  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.sync_public_profile_admin() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS user_roles_sync_public_profile ON public.user_roles;
CREATE TRIGGER user_roles_sync_public_profile
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.sync_public_profile_admin();