ALTER TABLE public.pillars ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE OR REPLACE FUNCTION public.cascade_pillar_archive()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.archived_at IS DISTINCT FROM OLD.archived_at THEN
    UPDATE public.pages
      SET archived_at = NEW.archived_at
      WHERE key = 'pillar:' || NEW.slug;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cascade_pillar_archive ON public.pillars;
CREATE TRIGGER trg_cascade_pillar_archive
AFTER UPDATE OF archived_at ON public.pillars
FOR EACH ROW EXECUTE FUNCTION public.cascade_pillar_archive();