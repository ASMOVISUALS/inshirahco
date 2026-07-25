
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.reflections ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS archived_at timestamptz;
CREATE INDEX IF NOT EXISTS articles_archived_at_idx ON public.articles (archived_at);
CREATE INDEX IF NOT EXISTS reflections_archived_at_idx ON public.reflections (archived_at);
CREATE INDEX IF NOT EXISTS testimonials_archived_at_idx ON public.testimonials (archived_at);
