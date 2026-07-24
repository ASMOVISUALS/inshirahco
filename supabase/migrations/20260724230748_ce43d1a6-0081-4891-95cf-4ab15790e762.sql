
-- Add builder columns to pages
ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS template text NOT NULL DEFAULT 'blank';

-- Seed slug/title for existing rows (idempotent)
UPDATE public.pages SET slug = key WHERE slug IS NULL;
UPDATE public.pages SET title = initcap(replace(replace(key, ':', ' — '), '-', ' ')) WHERE title IS NULL;

-- Ensure slug is unique for dynamic routing
CREATE UNIQUE INDEX IF NOT EXISTS pages_slug_unique ON public.pages(slug);

-- Public read of published pages (already exists as select policy for pages; add slug lookup safety)
-- Grants unchanged; existing policies apply.
