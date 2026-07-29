
-- 1. Sync trigger: propagate slug rename to denormalized columns on children
CREATE OR REPLACE FUNCTION public.sync_pillar_slug()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.slug IS DISTINCT FROM OLD.slug THEN
    UPDATE public.articles SET pillar = NEW.slug WHERE pillar = OLD.slug;
    UPDATE public.series   SET pillar = NEW.slug WHERE pillar = OLD.slug;
    UPDATE public.pages    SET key = 'pillar:' || NEW.slug WHERE key = 'pillar:' || OLD.slug;
    UPDATE public.faqs     SET page_key = 'pillar:' || NEW.slug WHERE page_key = 'pillar:' || OLD.slug;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pillars_sync_slug ON public.pillars;
CREATE TRIGGER pillars_sync_slug
AFTER UPDATE OF slug ON public.pillars
FOR EACH ROW EXECUTE FUNCTION public.sync_pillar_slug();

-- 2. Normalize "life-architecture" page/faq keys to use pillar: prefix (only if not already)
UPDATE public.pages SET key = 'pillar:life-architecture' WHERE key = 'life-architecture';
UPDATE public.faqs  SET page_key = 'pillar:life-architecture' WHERE page_key = 'life-architecture';

-- 3. Perform the renames (trigger cascades to children)
UPDATE public.pillars SET slug = 'tadabbur', href = '/tadabbur' WHERE slug = 'quranic-reflections';
UPDATE public.pillars SET slug = 'tazkiyah', href = '/tazkiyah' WHERE slug = 'tazkiyah-toolkit';
UPDATE public.pillars SET slug = 'youth',    href = '/youth'    WHERE slug = 'young-hearts';
UPDATE public.pillars SET slug = 'suhbah',   href = '/suhbah'   WHERE slug = 'life-architecture';
