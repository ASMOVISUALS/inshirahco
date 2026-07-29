ALTER TABLE public.ayahs
  ADD COLUMN IF NOT EXISTS day_start timestamptz,
  ADD COLUMN IF NOT EXISTS day_end timestamptz;

CREATE OR REPLACE FUNCTION public.track_ayah_days()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'current' AND COALESCE(OLD.status, '') <> 'current' THEN
    NEW.day_start := now();
    NEW.day_end := NULL;
  ELSIF OLD.status = 'current' AND NEW.status <> 'current' THEN
    NEW.day_end := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_ayah_days ON public.ayahs;
CREATE TRIGGER trg_track_ayah_days
BEFORE UPDATE ON public.ayahs
FOR EACH ROW EXECUTE FUNCTION public.track_ayah_days();