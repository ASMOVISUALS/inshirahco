
-- 1) Formats: menu / site toggles
ALTER TABLE public.resource_formats
  ADD COLUMN IF NOT EXISTS show_in_menu BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_on_site BOOLEAN NOT NULL DEFAULT TRUE;

-- 2) Series table
CREATE TABLE IF NOT EXISTS public.series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  pillar TEXT,
  cover_image TEXT,
  arabic_letter TEXT NOT NULL DEFAULT '',
  tint TEXT NOT NULL DEFAULT 'heart',
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','hidden','coming_soon')),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS series_slug_active_unique
  ON public.series (slug) WHERE archived_at IS NULL;

GRANT SELECT ON public.series TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.series TO authenticated;
GRANT ALL ON public.series TO service_role;

ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "series public read"
  ON public.series FOR SELECT
  USING (archived_at IS NULL AND status = 'published');

CREATE POLICY "series admin read"
  ON public.series FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "series admin insert"
  ON public.series FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "series admin update"
  ON public.series FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "series admin delete"
  ON public.series FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER series_set_updated_at
  BEFORE UPDATE ON public.series
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Article <-> Series link table
CREATE TABLE IF NOT EXISTS public.article_series (
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (article_id, series_id)
);

CREATE INDEX IF NOT EXISTS article_series_series_idx ON public.article_series(series_id);

GRANT SELECT ON public.article_series TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_series TO authenticated;
GRANT ALL ON public.article_series TO service_role;

ALTER TABLE public.article_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "article_series public read"
  ON public.article_series FOR SELECT
  USING (TRUE);

CREATE POLICY "article_series admin insert"
  ON public.article_series FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "article_series admin update"
  ON public.article_series FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "article_series admin delete"
  ON public.article_series FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
