-- 1) One-off sync: pull pages.title/slug from pillars for every pillar:* page
UPDATE public.pages p
SET title = pl.label,
    slug  = pl.slug
FROM public.pillars pl
WHERE p.key = 'pillar:' || pl.slug
  AND (p.title IS DISTINCT FROM pl.label OR p.slug IS DISTINCT FROM pl.slug);

-- 2) Extend the existing sync trigger so future edits to pillar slug/label propagate
CREATE OR REPLACE FUNCTION public.sync_pillar_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.slug IS DISTINCT FROM OLD.slug THEN
    UPDATE public.articles SET pillar = NEW.slug WHERE pillar = OLD.slug;
    UPDATE public.series   SET pillar = NEW.slug WHERE pillar = OLD.slug;
    UPDATE public.pages
      SET key = 'pillar:' || NEW.slug,
          slug = NEW.slug
      WHERE key = 'pillar:' || OLD.slug;
    UPDATE public.faqs SET page_key = 'pillar:' || NEW.slug WHERE page_key = 'pillar:' || OLD.slug;
  END IF;

  IF NEW.label IS DISTINCT FROM OLD.label THEN
    UPDATE public.pages
      SET title = NEW.label
      WHERE key = 'pillar:' || NEW.slug;
  END IF;

  RETURN NEW;
END;
$function$;