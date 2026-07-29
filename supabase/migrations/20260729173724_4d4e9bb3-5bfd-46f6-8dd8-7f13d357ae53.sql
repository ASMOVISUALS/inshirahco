-- 1. Verse status
ALTER TABLE public.ayahs ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pool';
UPDATE public.ayahs SET status = CASE WHEN active THEN 'pool' ELSE 'paused' END;
ALTER TABLE public.ayahs ADD CONSTRAINT ayahs_status_check CHECK (status IN ('pool','current','used','paused'));

-- 2. Weekly verse record
CREATE TABLE IF NOT EXISTS public.verse_of_the_week (
  week_start date PRIMARY KEY,
  ayah_id uuid NOT NULL REFERENCES public.ayahs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.verse_of_the_week TO anon, authenticated;
GRANT ALL ON public.verse_of_the_week TO service_role;
ALTER TABLE public.verse_of_the_week ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read the weekly verse" ON public.verse_of_the_week FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.current_verse_of_the_week()
RETURNS SETOF public.ayahs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE ws date; v uuid;
BEGIN
  ws := current_date - ((EXTRACT(dow FROM current_date)::int - 5 + 7) % 7);
  SELECT ayah_id INTO v FROM verse_of_the_week WHERE week_start = ws;
  IF v IS NULL THEN
    UPDATE ayahs SET status = 'used' WHERE status = 'current';
    SELECT id INTO v FROM ayahs WHERE status = 'pool' AND archived_at IS NULL ORDER BY random() LIMIT 1;
    IF v IS NULL THEN
      UPDATE ayahs SET status = 'pool' WHERE status = 'used' AND archived_at IS NULL;
      SELECT id INTO v FROM ayahs WHERE status = 'pool' AND archived_at IS NULL ORDER BY random() LIMIT 1;
    END IF;
    IF v IS NULL THEN RETURN; END IF;
    INSERT INTO verse_of_the_week(week_start, ayah_id) VALUES (ws, v) ON CONFLICT (week_start) DO NOTHING;
    SELECT ayah_id INTO v FROM verse_of_the_week WHERE week_start = ws;
    UPDATE ayahs SET status = 'current' WHERE id = v;
  END IF;
  RETURN QUERY SELECT * FROM ayahs WHERE id = v;
END;
$$;
GRANT EXECUTE ON FUNCTION public.current_verse_of_the_week() TO anon, authenticated, service_role;

-- 3. Reflections: likes + public read
ALTER TABLE public.reflections ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;
DROP POLICY IF EXISTS "Anyone can read reflections" ON public.reflections;
CREATE POLICY "Anyone can read reflections" ON public.reflections FOR SELECT USING (true);
GRANT SELECT ON public.reflections TO anon;

CREATE TABLE IF NOT EXISTS public.reflection_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reflection_id uuid NOT NULL REFERENCES public.reflections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reflection_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.reflection_likes TO authenticated;
GRANT SELECT ON public.reflection_likes TO anon;
GRANT ALL ON public.reflection_likes TO service_role;
ALTER TABLE public.reflection_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read likes" ON public.reflection_likes FOR SELECT USING (true);
CREATE POLICY "Members can like" ON public.reflection_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can unlike" ON public.reflection_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sync_reflection_likes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reflections SET likes_count = likes_count + 1 WHERE id = NEW.reflection_id;
    RETURN NEW;
  ELSE
    UPDATE reflections SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.reflection_id;
    RETURN OLD;
  END IF;
END;
$$;
DROP TRIGGER IF EXISTS reflection_likes_sync ON public.reflection_likes;
CREATE TRIGGER reflection_likes_sync AFTER INSERT OR DELETE ON public.reflection_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_reflection_likes();

-- 4. Reports
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_email text,
  message text NOT NULL CHECK (char_length(message) <= 500),
  is_article boolean NOT NULL DEFAULT false,
  is_reflection boolean NOT NULL DEFAULT false,
  is_votw boolean NOT NULL DEFAULT false,
  target_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reports_single_subject CHECK (
    (is_article::int + is_reflection::int + is_votw::int) = 1
  )
);
GRANT INSERT ON public.reports TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can file reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can read reports" ON public.reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage reports" ON public.reports FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Articles: last published date
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS last_published_at timestamptz;
UPDATE public.articles SET last_published_at = published_at WHERE published AND last_published_at IS NULL;