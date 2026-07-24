
-- =========================
-- Enums
-- =========================
CREATE TYPE public.app_role AS ENUM ('admin', 'member');
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'prefer_not_to_say');

-- =========================
-- Shared functions
-- =========================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================
-- profiles
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  dob DATE,
  gender public.gender_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- user_roles
-- =========================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Users can see their own roles; admins can see all
CREATE POLICY "Users read own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Profiles policies (defined after has_role so admins can be granted read access)
CREATE POLICY "Users read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- =========================
-- Auth trigger: create profile + auto-admin for founder email
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_name TEXT;
  meta_dob TEXT;
  meta_gender TEXT;
  dob_val DATE;
  gender_val public.gender_type;
BEGIN
  meta_name := NEW.raw_user_meta_data ->> 'name';
  meta_dob := NEW.raw_user_meta_data ->> 'dob';
  meta_gender := NEW.raw_user_meta_data ->> 'gender';

  BEGIN
    dob_val := meta_dob::DATE;
  EXCEPTION WHEN OTHERS THEN
    dob_val := NULL;
  END;

  BEGIN
    gender_val := meta_gender::public.gender_type;
  EXCEPTION WHEN OTHERS THEN
    gender_val := NULL;
  END;

  INSERT INTO public.profiles (user_id, email, name, dob, gender)
  VALUES (NEW.id, NEW.email, meta_name, dob_val, gender_val)
  ON CONFLICT (user_id) DO NOTHING;

  IF LOWER(NEW.email) = 'inshirahco@proton.me' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'member')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- articles
-- =========================
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  pillar TEXT NOT NULL,
  type TEXT NOT NULL,
  read_time TEXT,
  author_name TEXT NOT NULL,
  author_role TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  downloadable BOOLEAN NOT NULL DEFAULT false,
  body JSONB NOT NULL DEFAULT '[]'::jsonb,
  published BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles TO authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads published articles"
ON public.articles FOR SELECT TO anon, authenticated
USING (published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert articles"
ON public.articles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update articles"
ON public.articles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete articles"
ON public.articles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER articles_set_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- reflections
-- =========================
CREATE TABLE public.reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arabic TEXT NOT NULL,
  translation TEXT NOT NULL,
  reference TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.reflections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reflections TO authenticated;
GRANT ALL ON public.reflections TO service_role;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active reflections"
ON public.reflections FOR SELECT TO anon, authenticated
USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert reflections"
ON public.reflections FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update reflections"
ON public.reflections FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete reflections"
ON public.reflections FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER reflections_set_updated_at
BEFORE UPDATE ON public.reflections
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- testimonials
-- =========================
CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  featured BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads featured testimonials"
ON public.testimonials FOR SELECT TO anon, authenticated
USING (featured = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert testimonials"
ON public.testimonials FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update testimonials"
ON public.testimonials FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete testimonials"
ON public.testimonials FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER testimonials_set_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- newsletter_signups
-- =========================
CREATE TABLE public.newsletter_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.newsletter_signups TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.newsletter_signups TO authenticated;
GRANT ALL ON public.newsletter_signups TO service_role;
ALTER TABLE public.newsletter_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
ON public.newsletter_signups FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins read newsletter"
ON public.newsletter_signups FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete newsletter"
ON public.newsletter_signups FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================
-- bookmarks
-- =========================
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_slug)
);

GRANT SELECT, INSERT, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own bookmarks"
ON public.bookmarks FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users insert own bookmarks"
ON public.bookmarks FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own bookmarks"
ON public.bookmarks FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- =========================
-- Seed content
-- =========================
INSERT INTO public.reflections (arabic, translation, reference, sort_order) VALUES
('أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ', 'Did We not expand for you your chest?', 'Ash-Sharh 94:1', 1),
('فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', 'So verily, with hardship comes ease.', 'Ash-Sharh 94:5', 2),
('أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', 'Truly, in the remembrance of Allah do hearts find rest.', 'Ar-Ra''d 13:28', 3),
('وَقُل رَّبِّ زِدْنِي عِلْمًا', 'And say: My Lord, increase me in knowledge.', 'Ta-Ha 20:114', 4),
('إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', 'Indeed, Allah is with the patient.', 'Al-Baqarah 2:153', 5),
('وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ', 'And Allah loves those who do good.', 'Aal-Imran 3:134', 6),
('وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ', 'It may be that you dislike a thing which is good for you.', 'Al-Baqarah 2:216', 7);

INSERT INTO public.testimonials (quote, name, sort_order) VALUES
('The kind of writing you save for the days when your chest feels tight. Rare, and steady, and needed.', 'Reader, London', 1),
('It doesn''t try to fix me. It just sits next to me. That, honestly, is what I''ve been looking for.', 'Reader, Toronto', 2),
('I sent the muhasabah worksheet to my sister and to my halaqa. It''s the first thing that actually made muhasabah feel possible.', 'Reader, Kuala Lumpur', 3);

-- Reusable seed body for sample articles
INSERT INTO public.articles (slug, title, description, pillar, type, read_time, author_name, author_role, tags, downloadable, body, published, published_at) VALUES
('the-chest-that-opens', 'The chest that opens', 'On Surah Ash-Sharh, and the ease that arrives inside the hardship — not after it.', 'quranic-reflections', 'reflection', '6 min read', 'The Inshirah team', NULL, ARRAY['surah ash-sharh','sabr','ease'], false,
 '[{"kind":"p","text":"There is a difference between reading a verse and letting it read you. The Qur''an, in its own words, was sent down thiqalan — heavy — not because it burdens us, but because it settles in a place inside us that nothing lighter can reach."},{"kind":"quote","text":"Did We not expand for you your chest?","arabic":"أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ","source":"Surah Ash-Sharh, 94:1"},{"kind":"h2","text":"Sitting with the word"},{"kind":"p","text":"Tadabbur is not analysis. It is not exegesis. It is the quiet, unhurried sitting-with a verse until something in you shifts — a knot loosens, a resistance softens, a small door in the chest opens."},{"kind":"p","text":"Try this: pick one ayah this week. Not a whole surah. One verse. Return to it before sleep and on waking. Let it be the last thing your tongue tastes at night and the first thing it reaches for at dawn."},{"kind":"h2","text":"The expansion that follows"},{"kind":"p","text":"Notice the sequence in the surah. First, the chest opens. Only then does the mention of the burden come — and it is spoken of in the past tense, as something already lifted. Ease does not come after you fix yourself. It comes as the fixing."}]'::jsonb,
 true, '2026-07-18'),

('muraqabah-in-five-breaths', 'Muraqabah in five breaths', 'A short daily practice for remembering that you are seen — and softening because of it.', 'tazkiyah-toolkit', 'worksheet', '3 min practice', 'The Inshirah team', NULL, ARRAY['muraqabah','practice','morning'], true,
 '[{"kind":"p","text":"There is a difference between reading a verse and letting it read you."},{"kind":"h2","text":"Sitting with the word"},{"kind":"p","text":"Tadabbur is not analysis. It is not exegesis."}]'::jsonb,
 true, '2026-07-14'),

('when-nothing-feels-like-yours', 'When nothing feels like yours', 'A letter to the young heart caught between what the world wants and what Allah asks.', 'young-hearts', 'article', '8 min read', 'Yasmeen H.', 'Contributor', ARRAY['identity','youth','belonging'], false,
 '[{"kind":"p","text":"A letter to the young heart caught between what the world wants and what Allah asks."},{"kind":"h2","text":"Belonging"},{"kind":"p","text":"You are not late. You are becoming."}]'::jsonb,
 true, '2026-07-10'),

('what-life-architecture-is', 'What Life Architecture is (and isn''t)', 'A first glimpse at the mentor-led course we are building — and why we are taking our time.', 'life-architecture', 'blog', '5 min read', 'The Inshirah team', NULL, ARRAY['course','intentional life'], false,
 '[{"kind":"p","text":"A first glimpse at the mentor-led course we are building."}]'::jsonb,
 true, '2026-07-02'),

('tadabbur-on-al-fatiha', 'Sitting with Al-Fatiha', 'A slow tadabbur session on the surah we recite most, and hear least.', 'quranic-reflections', 'tadabbur', '24 min listen', 'The Inshirah team', NULL, ARRAY['al-fatiha','tadabbur'], false,
 '[{"kind":"p","text":"A slow tadabbur session on the surah we recite most, and hear least."}]'::jsonb,
 true, '2026-06-28'),

('the-heart-is-a-mirror', 'The heart is a mirror', 'A short reflection on why polishing the qalb matters more than performing it.', 'tazkiyah-toolkit', 'article', '4 min read', 'The Inshirah team', NULL, ARRAY['qalb','tazkiyah'], false,
 '[{"kind":"p","text":"The heart is a mirror; polish it, and it reflects the light it was made for."}]'::jsonb,
 true, '2026-06-22'),

('a-book-for-quiet-nights', 'A book for quiet nights', 'Notes on Al-Ghazali''s Ihya, and why it still speaks to a phone-lit generation.', 'young-hearts', 'book', '10 min read', 'The Inshirah team', NULL, ARRAY['ghazali','reading'], false,
 '[{"kind":"p","text":"Notes on Al-Ghazali''s Ihya, and why it still speaks to a phone-lit generation."}]'::jsonb,
 true, '2026-06-18'),

('podcast-01-what-is-inshirah', 'Ep 01 — What is Inshirah?', 'The story behind the name, and what we''re trying to build together.', 'quranic-reflections', 'podcast', '38 min listen', 'The Inshirah team', NULL, ARRAY['intro','podcast'], false,
 '[{"kind":"p","text":"The story behind the name, and what we''re trying to build together."}]'::jsonb,
 true, '2026-06-12'),

('video-morning-dhikr', 'A morning dhikr you''ll actually keep', 'Short video: three phrases, sixty seconds, every morning.', 'tazkiyah-toolkit', 'video', '6 min watch', 'The Inshirah team', NULL, ARRAY['dhikr','morning'], false,
 '[{"kind":"p","text":"Three phrases, sixty seconds, every morning."}]'::jsonb,
 true, '2026-06-05'),

('letter-to-a-tired-friend', 'Letter to a tired friend', 'For the reader who is doing more than anyone knows, and still feels behind.', 'young-hearts', 'blog', '5 min read', 'The Inshirah team', NULL, ARRAY['burnout','hope'], false,
 '[{"kind":"p","text":"For the reader who is doing more than anyone knows, and still feels behind."}]'::jsonb,
 true, '2026-05-28'),

('worksheet-a-week-of-muhasabah', 'A week of muhasabah', 'A printable seven-day self-accounting worksheet — gentle, honest, unhurried.', 'tazkiyah-toolkit', 'worksheet', 'Printable', 'The Inshirah team', NULL, ARRAY['muhasabah','printable'], true,
 '[{"kind":"p","text":"A printable seven-day self-accounting worksheet — gentle, honest, unhurried."}]'::jsonb,
 true, '2026-05-20'),

('on-choosing-a-path', 'On choosing a path (without knowing the ending)', 'A meditation on tawakkul and career decisions for the honestly uncertain.', 'life-architecture', 'article', '7 min read', 'The Inshirah team', NULL, ARRAY['tawakkul','career'], false,
 '[{"kind":"p","text":"A meditation on tawakkul and career decisions for the honestly uncertain."}]'::jsonb,
 true, '2026-05-12');
