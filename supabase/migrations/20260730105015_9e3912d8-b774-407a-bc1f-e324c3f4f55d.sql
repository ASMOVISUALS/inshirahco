ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS in_nav boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nav_label text,
  ADD COLUMN IF NOT EXISTS nav_order integer NOT NULL DEFAULT 0;

UPDATE public.pages p
SET in_nav = true,
    nav_order = COALESCE(pl.sort_order, 1),
    nav_label = COALESCE(p.nav_label, pl.short_label)
FROM public.pillars pl
WHERE p.key = 'pillar:' || pl.slug
  AND p.archived_at IS NULL
  AND pl.archived_at IS NULL;

UPDATE public.pages
SET in_nav = true, nav_order = 90
WHERE key = 'about' AND archived_at IS NULL;