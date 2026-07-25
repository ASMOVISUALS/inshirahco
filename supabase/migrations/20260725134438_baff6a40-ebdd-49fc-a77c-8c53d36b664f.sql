ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS archived_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS pages_slug_active_unique ON public.pages (slug) WHERE archived_at IS NULL;