ALTER TABLE public.ayahs ADD COLUMN IF NOT EXISTS queue_order integer;

WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY sort_order, created_at) AS rn
  FROM public.ayahs
)
UPDATE public.ayahs a SET queue_order = o.rn FROM ordered o WHERE a.id = o.id AND a.queue_order IS NULL;

CREATE OR REPLACE FUNCTION public.rotate_verse_of_the_week()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v uuid;
BEGIN
  SELECT id INTO v FROM ayahs WHERE status = 'pool' ORDER BY queue_order NULLS LAST, created_at LIMIT 1;
  IF v IS NULL THEN
    RETURN;
  END IF;
  UPDATE ayahs SET status = 'used' WHERE status = 'current';
  UPDATE ayahs SET status = 'current', active = true WHERE id = v;
END;
$$;