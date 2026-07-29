
CREATE TABLE public.setting_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  settings_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.setting_groups TO anon, authenticated;
GRANT ALL ON public.setting_groups TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.setting_groups TO authenticated;
ALTER TABLE public.setting_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Setting groups public read" ON public.setting_groups FOR SELECT USING (true);
CREATE POLICY "Admins manage setting groups" ON public.setting_groups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER setting_groups_set_updated_at BEFORE UPDATE ON public.setting_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.setting_fields (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.setting_groups(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  label text NOT NULL,
  help text NOT NULL DEFAULT '',
  field_type text NOT NULL CHECK (field_type IN ('toggle','text','textarea','number','select','multiselect','color')),
  required boolean NOT NULL DEFAULT false,
  default_value jsonb,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  options_source text NOT NULL DEFAULT 'static' CHECK (options_source IN ('static','block_kinds','pillars','formats','newsletters','pages')),
  min_value numeric,
  max_value numeric,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, field_key)
);
GRANT SELECT ON public.setting_fields TO anon, authenticated;
GRANT ALL ON public.setting_fields TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.setting_fields TO authenticated;
ALTER TABLE public.setting_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Setting fields public read" ON public.setting_fields FOR SELECT USING (true);
CREATE POLICY "Admins manage setting fields" ON public.setting_fields FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER setting_fields_set_updated_at BEFORE UPDATE ON public.setting_fields
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed: Account access
WITH g AS (
  INSERT INTO public.setting_groups (settings_key, label, description, icon, sort_order)
  VALUES ('auth_access', 'Account access', 'Control whether users can sign in or create new accounts.', 'UserCog', 10)
  RETURNING id
)
INSERT INTO public.setting_fields (group_id, field_key, label, help, field_type, default_value, sort_order)
SELECT g.id, x.field_key, x.label, x.help, x.field_type, x.default_value, x.sort_order FROM g,
(VALUES
  ('signinEnabled', 'Users can sign in', 'When off, the sign-in page is locked and any signed-in user is signed out.', 'toggle', 'true'::jsonb, 1),
  ('signupEnabled', 'Users can create accounts', 'When off, the Join page hides the signup form.', 'toggle', 'true'::jsonb, 2),
  ('signinLockedMessage', 'Sign-in locked message', 'Shown on the sign-in page when sign-in is disabled.', 'textarea', '""'::jsonb, 3)
) AS x(field_key, label, help, field_type, default_value, sort_order);

-- Seed: Article editor
WITH g AS (
  INSERT INTO public.setting_groups (settings_key, label, description, icon, sort_order)
  VALUES ('article_editor', 'Article editor', 'Behaviour of the article builder.', 'FileText', 20)
  RETURNING id
)
INSERT INTO public.setting_fields (group_id, field_key, label, help, field_type, default_value, options_source, min_value, max_value, sort_order)
SELECT g.id, x.field_key, x.label, x.help, x.field_type, x.default_value, x.options_source, x.min_value, x.max_value, x.sort_order FROM g,
(VALUES
  ('max_columns', 'Maximum columns', 'Maximum number of side-by-side columns allowed in a block.', 'number', '3'::jsonb, 'static', 1::numeric, 3::numeric, 1),
  ('columnable_kinds', 'Column-eligible blocks', 'Block types that can be placed inside a columns layout.', 'multiselect', '["arabic_large","image","p"]'::jsonb, 'block_kinds', NULL, NULL, 2)
) AS x(field_key, label, help, field_type, default_value, options_source, min_value, max_value, sort_order);
