-- 1. Organisations -----------------------------------------------------------
CREATE TABLE public.organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text,
  slug text NOT NULL UNIQUE,
  logo_url text,
  website_url text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.organisations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organisations TO authenticated;
GRANT ALL ON public.organisations TO service_role;

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organisations are publicly readable"
  ON public.organisations FOR SELECT USING (true);

CREATE POLICY "Admins manage organisations"
  ON public.organisations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_organisations_updated_at
  BEFORE UPDATE ON public.organisations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.organisations (name, short_name, slug) VALUES
  ('Nottingham Islamic Society', 'Nottingham ISOC', 'nottingham-isoc'),
  ('Birmingham Islamic Society', 'Birmingham ISOC', 'birmingham-isoc'),
  ('Manchester Islamic Society', 'Manchester ISOC', 'manchester-isoc'),
  ('Inshirah Community', 'Inshirah', 'inshirah-community');

-- 2. Profiles: username + affiliation -----------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL;

UPDATE public.profiles
SET username = 'member_' || substr(replace(user_id::text, '-', ''), 1, 8)
WHERE username IS NULL OR btrim(username) = '';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key
  ON public.profiles (lower(username));

ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;

-- 3. Public, privacy-safe mirror of member identity ---------------------------
CREATE OR REPLACE FUNCTION public.mask_email(_email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _email IS NULL OR position('@' in _email) = 0 THEN NULL
    ELSE lower(left(_email, 1)) || '****@*****.' ||
         coalesce(nullif(split_part(_email, '.', array_length(string_to_array(_email, '.'), 1)), ''), 'com')
  END
$$;

CREATE TABLE public.public_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  organisation_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL,
  email_mask text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT ALL ON public.public_profiles TO service_role;

ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public member identity is readable"
  ON public.public_profiles FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.public_profiles (user_id, username, organisation_id, email_mask, updated_at)
  VALUES (NEW.user_id, NEW.username, NEW.organisation_id, public.mask_email(NEW.email), now())
  ON CONFLICT (user_id) DO UPDATE
    SET username = EXCLUDED.username,
        organisation_id = EXCLUDED.organisation_id,
        email_mask = EXCLUDED.email_mask,
        updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_public_profile() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER profiles_sync_public_profile
  AFTER INSERT OR UPDATE OF username, organisation_id, email ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_public_profile();

INSERT INTO public.public_profiles (user_id, username, organisation_id, email_mask)
SELECT p.user_id, p.username, p.organisation_id, public.mask_email(p.email)
FROM public.profiles p
ON CONFLICT (user_id) DO NOTHING;

-- 4. Verse of the Week in the Pages panel -------------------------------------
INSERT INTO public.pages (key, slug, title, template, status, is_published, in_nav, nav_label, nav_order, content)
VALUES ('verse', 'verse', 'Verse of the Week', 'system', 'published', true, false, 'Verse of the Week', 50, '{"blocks":[]}'::jsonb)
ON CONFLICT (key) DO NOTHING;