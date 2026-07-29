CREATE TABLE IF NOT EXISTS public.votw_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  mode text NOT NULL DEFAULT 'weekly' CHECK (mode IN ('weekly','date','manual')),
  next_change_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.votw_schedule TO authenticated;
GRANT ALL ON public.votw_schedule TO service_role;

ALTER TABLE public.votw_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage votw schedule" ON public.votw_schedule;
CREATE POLICY "Admins manage votw schedule"
  ON public.votw_schedule FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS set_votw_schedule_updated_at ON public.votw_schedule;
CREATE TRIGGER set_votw_schedule_updated_at
  BEFORE UPDATE ON public.votw_schedule
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.votw_next_friday(_from timestamptz DEFAULT now())
RETURNS timestamptz
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT (date_trunc('day', _from AT TIME ZONE 'UTC')
          + make_interval(days => (((5 - EXTRACT(dow FROM _from AT TIME ZONE 'UTC')::int) + 7) % 7)))
         AT TIME ZONE 'UTC'
         + CASE WHEN (((5 - EXTRACT(dow FROM _from AT TIME ZONE 'UTC')::int) + 7) % 7) = 0
                THEN interval '7 days' ELSE interval '0' END
$$;

INSERT INTO public.votw_schedule (singleton, mode, next_change_at)
VALUES (true, 'weekly', public.votw_next_friday(now()))
ON CONFLICT (singleton) DO NOTHING;

CREATE OR REPLACE FUNCTION public.rotate_verse_of_the_week_if_due()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE s public.votw_schedule%ROWTYPE;
BEGIN
  SELECT * INTO s FROM public.votw_schedule WHERE singleton = true;
  IF NOT FOUND OR s.mode = 'manual' THEN RETURN; END IF;
  IF s.next_change_at IS NULL OR s.next_change_at > now() THEN RETURN; END IF;

  PERFORM public.rotate_verse_of_the_week();

  IF s.mode = 'weekly' THEN
    UPDATE public.votw_schedule
      SET next_change_at = public.votw_next_friday(now())
      WHERE singleton = true;
  ELSE
    UPDATE public.votw_schedule
      SET mode = 'manual', next_change_at = NULL
      WHERE singleton = true;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rotate_verse_of_the_week_if_due() FROM anon, authenticated, public;

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('votw-rotate-check')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'votw-rotate-check');

SELECT cron.schedule(
  'votw-rotate-check',
  '*/10 * * * *',
  $$SELECT public.rotate_verse_of_the_week_if_due();$$
);