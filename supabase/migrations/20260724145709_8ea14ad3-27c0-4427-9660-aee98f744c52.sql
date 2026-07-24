
-- ============ PILLARS ============
CREATE TABLE public.pillars (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  short_label TEXT NOT NULL,
  arabic_letter TEXT NOT NULL,
  tint TEXT NOT NULL DEFAULT 'heart',
  description TEXT NOT NULL DEFAULT '',
  href TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  coming_soon BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pillars TO anon, authenticated;
GRANT ALL ON public.pillars TO service_role, authenticated;
ALTER TABLE public.pillars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pillars are viewable by everyone" ON public.pillars FOR SELECT USING (true);
CREATE POLICY "Admins manage pillars" ON public.pillars FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER pillars_set_updated_at BEFORE UPDATE ON public.pillars
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ RESOURCE FORMATS ============
CREATE TABLE public.resource_formats (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  plural TEXT NOT NULL,
  arabic_letter TEXT NOT NULL,
  tint TEXT NOT NULL DEFAULT 'heart',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resource_formats TO anon, authenticated;
GRANT ALL ON public.resource_formats TO service_role, authenticated;
ALTER TABLE public.resource_formats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Formats are viewable by everyone" ON public.resource_formats FOR SELECT USING (true);
CREATE POLICY "Admins manage formats" ON public.resource_formats FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER formats_set_updated_at BEFORE UPDATE ON public.resource_formats
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PAGES ============
CREATE TABLE public.pages (
  key TEXT PRIMARY KEY,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pages TO anon, authenticated;
GRANT ALL ON public.pages TO service_role, authenticated;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pages are viewable by everyone" ON public.pages FOR SELECT USING (true);
CREATE POLICY "Admins manage pages" ON public.pages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER pages_set_updated_at BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ FAQS ============
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX faqs_page_idx ON public.faqs(page_key, sort_order);
GRANT SELECT ON public.faqs TO anon, authenticated;
GRANT ALL ON public.faqs TO service_role, authenticated;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FAQs are viewable by everyone" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "Admins manage faqs" ON public.faqs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER faqs_set_updated_at BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SITE SETTINGS ============
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role, authenticated;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings are viewable by everyone" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER site_settings_set_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SEED PILLARS ============
INSERT INTO public.pillars (slug,label,short_label,arabic_letter,tint,description,href,sort_order,coming_soon) VALUES
('quranic-reflections','Qur''anic Reflections','Reflections','ق','heart','Slow, tadabbur-first readings of the Book — verse by verse, ayah by ayah.','/quranic-reflections',1,false),
('tazkiyah-toolkit','Tazkiyah Toolkit','Toolkit','ت','tazkiyah','Practices, printables, and gentle exercises to soften and steady the heart.','/tazkiyah-toolkit',2,false),
('young-hearts','Young Hearts','Youth','ي','heart-soft','Honest, warm writing for teens and young adults finding their footing.','/young-hearts',3,false),
('life-architecture','Life Architecture','Architecture','ح','gold','A mentor-led course, coming soon — building a life with intention.','/life-architecture',4,true);

-- ============ SEED RESOURCE FORMATS ============
INSERT INTO public.resource_formats (slug,label,plural,arabic_letter,tint,sort_order) VALUES
('article','Article','Articles','م','ink',1),
('reflection','Reflection','Reflections','ت','tazkiyah',2),
('blog','Blog post','Blog posts','و','heart-soft',3),
('video','Video','Videos','ف','heart',4),
('podcast','Podcast','Podcasts','ص','tazkiyah',5),
('book','Book','Books','ك','gold',6),
('course','Course','Courses','د','heart',7),
('tadabbur','Tadabbur','Tadabbur','ن','tazkiyah',8),
('worksheet','Worksheet','Worksheets','ع','heart-soft',9);

-- ============ SEED PAGES ============
INSERT INTO public.pages (key, content) VALUES
('home', jsonb_build_object(
  'seo_title','Inshirah — Islamic psychology, for the world of good',
  'seo_description','A quiet publication of Qur''anic reflections, tazkiyah practices, and youth-facing writing on the slow work of the heart.',
  'hero_arabic','انشراح',
  'hero_title_line1','an expansion',
  'hero_title_line2','of the chest.',
  'hero_description','Slow writing on Qur''anic reflection, tazkiyah, and the quiet architecture of a life lived in remembrance.',
  'hero_cta_primary_label','Start reading',
  'hero_cta_primary_href','/quranic-reflections',
  'hero_cta_secondary_label','Our story',
  'hero_cta_secondary_href','/about',
  'pillars_eyebrow','Four rooms in one house',
  'pillars_title','Where to begin',
  'pillars_description','Inshirah is organized around four quiet pillars. Wander freely — there is no wrong door to enter through.',
  'latest_eyebrow','Latest writing',
  'latest_title','Recently, from us to you',
  'media_eyebrow','Listen & watch',
  'media_title','Voices from the project',
  'testimonials_eyebrow','Community voices',
  'testimonials_title','Notes from readers'
)),
('about', jsonb_build_object(
  'seo_title','About — Inshirah',
  'seo_description','The story behind Inshirah — a passion project publishing Islamic psychology writing on tazkiyah, tadabbur, and the intentional life.',
  'hero_arabic','انشراح',
  'hero_title','Islamic psychology, for the world of good.',
  'hero_description','Inshirah is a small, unhurried publication. A place to sit with the Book, with the heart, and with the quieter questions of a life lived in remembrance.',
  'body_paragraphs', jsonb_build_array(
    'انشراح — inshirah — is the Qur''anic word for the opening or expansion of the chest. It''s the sense of ease that arrives in the middle of hardship. Not after it. In the middle of it.',
    'This project began as a folder of notes. Reflections we couldn''t stop writing, resources we kept sending to friends, conversations that felt too important to lose. Somewhere along the way, it became a home for that work.',
    'We are not a clinic. We are not a coaching program. We''re a slowly growing group of writers, students, and readers making space for what Islamic psychology has always offered — a way to know the heart, and a way to keep polishing it.'
  ),
  'founder_eyebrow','Behind the words',
  'founder_title','The founder',
  'founder_name','Founder placeholder',
  'founder_role','Writer, editor, student of the tradition',
  'founder_bio','A short bio, to be filled in properly. For now: a person who reads slowly, writes even more slowly, and believes the heart is worth the long conversation.',
  'founder_letter','ف'
)),
('life-architecture', jsonb_build_object(
  'seo_title','Life Architecture — Coming soon | Inshirah',
  'seo_description','A mentor-led course on building an intentional life — career, purpose, and long-term direction, rooted in Islamic principles. Currently in development.',
  'badge','Coming soon',
  'eyebrow','Pillar 04 · Architecture',
  'title','Life Architecture',
  'description','A mentor-led course on building a life with intention — vocation, direction, and the long, slow work of aligning what you do with who you''re becoming. In development. Join the waitlist for the first cohort.',
  'waitlist_heading','Be first when the door opens',
  'waitlist_description','A single email when the first cohort is announced. No marketing sequences, no upsells.',
  'waitlist_cta','Join the waitlist',
  'mentors_eyebrow','The mentors',
  'mentors_title','Small circle. Long conversations.',
  'mentors_description','Mentor profiles are placeholders — the confirmed circle will be introduced with the waitlist announcement.',
  'mentors', jsonb_build_array(
    jsonb_build_object('name','Mentor 1','bio','Placeholder bio. A short paragraph on the mentor''s background, the kind of questions they hold well, and what they bring to the circle.'),
    jsonb_build_object('name','Mentor 2','bio','Placeholder bio. A short paragraph on the mentor''s background, the kind of questions they hold well, and what they bring to the circle.'),
    jsonb_build_object('name','Mentor 3','bio','Placeholder bio. A short paragraph on the mentor''s background, the kind of questions they hold well, and what they bring to the circle.')
  ),
  'faq_eyebrow','Questions we''re asked most',
  'faq_title','A few honest answers'
)),
('join', jsonb_build_object(
  'seo_title','Join Inshirah — Create your account',
  'seo_description','Create your Inshirah account in three quiet steps — email, password, and a little about you.',
  'eyebrow','Join Inshirah',
  'title','Create your account',
  'success_arabic','شكرًا',
  'success_title','Ahlan wa sahlan',
  'success_description','Your account is ready. A gentle welcome note is on its way to your inbox.'
)),
('contact', jsonb_build_object(
  'seo_title','Contact & support — Inshirah',
  'seo_description','Send Inshirah a note, or read about how to support this small, freely-offered project.',
  'eyebrow','Say salaam',
  'title','We''d love to hear from you',
  'description','Questions, ideas, corrections, quiet notes — everything welcome. We read every message.',
  'success_arabic','شكرًا',
  'success_title','Your note reached us.',
  'success_description','We''ll write back, insha''Allah — when the reply can be a real one, not a template one.',
  'support_title','Support this project',
  'support_body','Inshirah is a passion project, offered freely and read by more people than we ever expected. If it has meant something to you — a du''a for the team, sharing an article with a friend, or (in time) supporting the work materially — all of it matters.',
  'support_footnote','Live giving options are coming soon. For now, thank you for being here.'
));

-- Pillar page copy
INSERT INTO public.pages (key, content) VALUES
('pillar:quranic-reflections', jsonb_build_object(
  'seo_title','Qur''anic Reflections — Inshirah',
  'seo_description','Slow, tadabbur-first readings of the Qur''an — verse by verse, ayah by ayah.',
  'eyebrow','Pillar 01 · Reflections',
  'intro','A slow, unhurried sitting-with the Book. Tadabbur, not tafsir. One verse at a time, until something in the chest quietly opens.'
)),
('pillar:tazkiyah-toolkit', jsonb_build_object(
  'seo_title','Tazkiyah Toolkit — Inshirah',
  'seo_description','Practical, printable exercises and gentle daily practices for the slow polishing of the heart.',
  'eyebrow','Pillar 02 · Toolkit',
  'intro','Short practices, printable worksheets, and gentle exercises — small tools for the everyday work of softening and steadying the heart.'
)),
('pillar:young-hearts', jsonb_build_object(
  'seo_title','Young Hearts — Inshirah',
  'seo_description','Honest, warm writing for teens and young adults finding their footing in faith, identity, and the noise of the world.',
  'eyebrow','Pillar 03 · Youth',
  'intro','For the young heart in between: between cultures, between certainties, between what the world expects and what the soul quietly asks for.'
));

-- ============ SEED FAQs (Life Architecture) ============
INSERT INTO public.faqs (page_key, question, answer, sort_order) VALUES
('life-architecture','What will the course actually cover?','Placeholder. We''re shaping a curriculum around vocation, long-term decision-making, spiritual grounding, and the practical scaffolding of a life you can sustain. Expect readings, mentor conversations, and reflective work — not lectures alone.',1),
('life-architecture','Who is it for?','Placeholder. Adults — early-to-mid career, or in a season of transition — who want to build with intention rather than react to circumstance. No prior background required, just a willingness to sit with hard questions.',2),
('life-architecture','Will it cost money?','Placeholder. Yes, eventually — sustainably priced, with a portion of seats reserved on a means-adjusted basis. Details will land with the waitlist announcement.',3),
('life-architecture','When does it launch?','Placeholder. When it''s ready and not before. Join the waitlist to be the first to hear when a cohort opens.',4);

-- ============ SEED SITE SETTINGS ============
INSERT INTO public.site_settings (key, value) VALUES
('brand', jsonb_build_object(
  'wordmark','inshirah',
  'wordmark_arabic','انشراح',
  'tagline','an expansion of the chest'
)),
('footer', jsonb_build_object(
  'tagline','Islamic psychology, for the world of good. A quiet corner for reflection, tazkiyah, and the slow work of the heart.',
  'copyright','A passion project, offered freely.',
  'domain','inshirah.co',
  'newsletter_heading','A gentle letter, now and then',
  'newsletter_description','Slow writing, occasional resources, and the reflection of the week — sent when it''s ready, never on a schedule.',
  'newsletter_cta','Subscribe',
  'social', jsonb_build_array(
    jsonb_build_object('label','Instagram','href','#','icon','instagram'),
    jsonb_build_object('label','YouTube','href','#','icon','youtube'),
    jsonb_build_object('label','Twitter','href','#','icon','twitter')
  )
)),
('nav', jsonb_build_object(
  'about_label','About',
  'contact_label','Contact',
  'resources_label','Resources',
  'resources_eyebrow','Every resource, one library',
  'browse_all_label','Browse all resources →'
));

-- ============ FOREIGN KEYS on articles ============
ALTER TABLE public.articles ADD CONSTRAINT articles_pillar_fkey
  FOREIGN KEY (pillar) REFERENCES public.pillars(slug) ON UPDATE CASCADE;
ALTER TABLE public.articles ADD CONSTRAINT articles_type_fkey
  FOREIGN KEY (type) REFERENCES public.resource_formats(slug) ON UPDATE CASCADE;
