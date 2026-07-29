CREATE OR REPLACE FUNCTION public.cascade_pillar_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.pages WHERE key = 'pillar:' || OLD.slug;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cascade_pillar_delete ON public.pillars;
CREATE TRIGGER trg_cascade_pillar_delete
BEFORE DELETE ON public.pillars
FOR EACH ROW EXECUTE FUNCTION public.cascade_pillar_delete();