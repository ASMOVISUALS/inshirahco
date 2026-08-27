INSERT INTO public.setting_groups (settings_key, label, description, icon, sort_order)
VALUES ('site_mode', 'Site mode', 'Take the whole public site offline behind a landing page. Admins keep full access.', 'Power', 5)
ON CONFLICT (settings_key) DO NOTHING;

INSERT INTO public.setting_fields (group_id, field_key, label, help, field_type, required, default_value, options, options_source, sort_order)
SELECT g.id, v.field_key, v.label, v.help, v.field_type, v.required, v.default_value, v.options, 'static', v.sort_order
FROM public.setting_groups g,
(VALUES
  ('mode', 'Mode', 'Live shows the real site. Coming soon and Maintenance replace every public page with a landing screen.', 'select', true, '"live"'::jsonb, '[{"value":"live","label":"Live"},{"value":"coming_soon","label":"Coming soon"},{"value":"maintenance","label":"Maintenance"}]'::jsonb, 1),
  ('headline', 'Headline', 'Optional. Overrides the default landing headline.', 'text', false, '""'::jsonb, '[]'::jsonb, 2),
  ('message', 'Message', 'Optional. Short paragraph shown under the headline.', 'textarea', false, '""'::jsonb, '[]'::jsonb, 3),
  ('newsletter', 'Show newsletter form', 'Show the newsletter signup on the Coming soon landing page.', 'toggle', false, 'true'::jsonb, '[]'::jsonb, 4),
  ('note', 'Small note', 'Optional. Small line at the bottom, e.g. an expected return or launch date.', 'text', false, '""'::jsonb, '[]'::jsonb, 5)
) AS v(field_key, label, help, field_type, required, default_value, options, sort_order)
WHERE g.settings_key = 'site_mode'
ON CONFLICT DO NOTHING;

INSERT INTO public.site_settings (key, value)
VALUES ('site_mode', '{"mode":"live","newsletter":true}'::jsonb)
ON CONFLICT (key) DO NOTHING;