
DO $$
BEGIN
  UPDATE public.pages
  SET content = jsonb_build_object('blocks', (
    SELECT jsonb_agg(jsonb_build_object('id', gen_random_uuid()::text, 'type', t.type, 'props', t.props))
    FROM (VALUES
      ('pillar_hero'::text, '{}'::jsonb),
      ('pillar_articles', jsonb_build_object('eyebrow','Latest writing','title','From this pillar','count',24)),
      ('pillar_series', jsonb_build_object('title','Series in this pillar','count',12)),
      ('newsletter', '{}'::jsonb)
    ) AS t(type, props)
  ))
  WHERE key IN ('pillar:tadabbur','pillar:tazkiyah','pillar:youth')
    AND NOT (content ? 'blocks' AND jsonb_array_length(content->'blocks') > 0);

  UPDATE public.pages
  SET content = jsonb_build_object('blocks', (
    SELECT jsonb_agg(jsonb_build_object('id', gen_random_uuid()::text, 'type', t.type, 'props', t.props))
    FROM (VALUES
      ('pillar_hero'::text, '{}'::jsonb),
      ('newsletter', jsonb_build_object('heading','Be first when the door opens','cta','Join the waitlist')),
      ('previews_grid', jsonb_build_object(
         'eyebrow','What to look forward to',
         'title','The shape of what''s coming',
         'description','Life Architecture is a slow, deliberate programme. Here''s a glimpse of the rooms we''re building.',
         'items', jsonb_build_array(
           jsonb_build_object('icon','users','tag','Cohorts','title','Mentor-led courses','description','Small cohorts walking through purpose, work, and long-term direction with a mentor who knows your name.'),
           jsonb_build_object('icon','mountain','tag','Retreats','title','In-person retreats','description','A few days away from the noise — reflection, halaqas, and quiet planning in landscapes that let the chest expand.'),
           jsonb_build_object('icon','calendar','tag','Gatherings','title','Exclusive events','description','Intimate salons and dinners with scholars, founders, and practitioners exploring the architecture of a life well-lived.')
         )
      )),
      ('mentors_row', jsonb_build_object(
         'title','The Mentors',
         'description','Meet your mentors and advisors!',
         'items', jsonb_build_array(
           jsonb_build_object('name','Mentor 1','title','Scholar & Educator','role','Lead Mentor','qualification','PhD, Islamic Studies'),
           jsonb_build_object('name','Mentor 2','title','Psychologist & Coach','role','Advisor','qualification','MSc, Clinical Psychology'),
           jsonb_build_object('name','Mentor 3','title','Founder & Strategist','role','Advisor','qualification','MBA, Strategy')
         )
      ))
    ) AS t(type, props)
  ))
  WHERE key = 'pillar:suhbah'
    AND NOT (content ? 'blocks' AND jsonb_array_length(content->'blocks') > 0);

  UPDATE public.pages
  SET content = jsonb_build_object('blocks', (
    SELECT jsonb_agg(jsonb_build_object('id', gen_random_uuid()::text, 'type', t.type, 'props', t.props))
    FROM (VALUES
      ('hero'::text, jsonb_build_object(
         'eyebrow','Say salaam',
         'arabic','',
         'title_line1','We''d love',
         'title_line2','to hear from you.',
         'description','',
         'background','radial',
         'cta_primary_label','','cta_secondary_label','')),
      ('contact_form', jsonb_build_object(
         'success_arabic','شكرًا',
         'success_title','Your note reached us.',
         'success_description','',
         'support_title','Support this project',
         'support_body','',
         'support_footnote',''))
    ) AS t(type, props)
  ))
  WHERE key = 'contact'
    AND NOT (content ? 'blocks' AND jsonb_array_length(content->'blocks') > 0);

  UPDATE public.pages
  SET content = jsonb_build_object('blocks', (
    SELECT jsonb_agg(jsonb_build_object('id', gen_random_uuid()::text, 'type', t.type, 'props', t.props))
    FROM (VALUES
      ('hero'::text, jsonb_build_object(
         'eyebrow','The whole library',
         'arabic','',
         'title_line1','Every resource,',
         'title_line2','one open shelf.',
         'description','Filter by pillar or format, or search by word. Everything here is free to read, listen, and download.',
         'background','radial',
         'cta_primary_label','','cta_secondary_label','')),
      ('resources_library', '{}'::jsonb)
    ) AS t(type, props)
  ))
  WHERE key = 'resources'
    AND NOT (content ? 'blocks' AND jsonb_array_length(content->'blocks') > 0);
END $$;

CREATE OR REPLACE FUNCTION public.create_page_for_pillar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.pages (key, slug, title, status, is_published, content)
  VALUES (
    'pillar:' || NEW.slug,
    NEW.slug,
    NEW.label,
    'published',
    true,
    jsonb_build_object('blocks', jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid()::text, 'type', 'pillar_hero', 'props', '{}'::jsonb),
      jsonb_build_object('id', gen_random_uuid()::text, 'type', 'pillar_articles', 'props', jsonb_build_object('eyebrow','Latest writing','title','From this pillar','count',24)),
      jsonb_build_object('id', gen_random_uuid()::text, 'type', 'pillar_series', 'props', jsonb_build_object('title','Series in this pillar','count',12)),
      jsonb_build_object('id', gen_random_uuid()::text, 'type', 'newsletter', 'props', '{}'::jsonb)
    ))
  )
  ON CONFLICT (key) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_page_for_pillar ON public.pillars;
CREATE TRIGGER trg_create_page_for_pillar
AFTER INSERT ON public.pillars
FOR EACH ROW EXECUTE FUNCTION public.create_page_for_pillar();
