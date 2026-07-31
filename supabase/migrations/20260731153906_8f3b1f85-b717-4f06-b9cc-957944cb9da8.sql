ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'special';

ALTER TABLE public.public_profiles ADD COLUMN IF NOT EXISTS role_tag text NOT NULL DEFAULT 'member';

CREATE OR REPLACE FUNCTION public.highest_role_tag(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT ur.role::text FROM public.user_roles ur
      WHERE ur.user_id = _user_id
      ORDER BY CASE ur.role::text WHEN 'admin' THEN 1 WHEN 'special' THEN 2 ELSE 3 END
      LIMIT 1),
    'member')
$$;

REVOKE ALL ON FUNCTION public.highest_role_tag(uuid) FROM PUBLIC, anon, authenticated;

UPDATE public.public_profiles pp SET role_tag = public.highest_role_tag(pp.user_id);

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
  SET is_admin = (public.highest_role_tag(target) = 'admin'),
      role_tag = public.highest_role_tag(target)
  WHERE user_id = target;
  RETURN COALESCE(NEW, OLD);
END;
$$;

INSERT INTO public.setting_groups (settings_key, label, description, icon, sort_order)
VALUES ('member_colours', 'Member colours', 'Choose the username colour shown for each kind of member across the site.', 'Palette', 30)
ON CONFLICT (settings_key) DO NOTHING;

INSERT INTO public.setting_fields (group_id, field_key, label, help, field_type, required, default_value, options, options_source, sort_order)
SELECT g.id, v.field_key, v.label, v.help, 'color', false, v.dflt, '[]'::jsonb, 'static', v.sort_order
FROM public.setting_groups g
CROSS JOIN (VALUES
  ('admin_color', 'Admin username colour', 'Shown for administrators.', '"#A63C33"'::jsonb, 10),
  ('special_color', 'Special member colour', 'Shown for members with the special role.', '"#4F7F62"'::jsonb, 20)
) AS v(field_key, label, help, dflt, sort_order)
WHERE g.settings_key = 'member_colours'
ON CONFLICT DO NOTHING;

INSERT INTO public.site_settings (key, value)
VALUES ('member_colours', jsonb_build_object('admin_color', '#A63C33', 'special_color', '#4F7F62'))
ON CONFLICT (key) DO NOTHING;