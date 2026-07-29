
-- 1. Add id to pillars
ALTER TABLE public.pillars ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.pillars ADD CONSTRAINT pillars_id_unique UNIQUE (id);

-- 2. Add pillar_id to articles + backfill
ALTER TABLE public.articles ADD COLUMN pillar_id uuid;
UPDATE public.articles a SET pillar_id = p.id FROM public.pillars p WHERE a.pillar = p.slug;

-- 3. Add pillar_id to series + backfill
ALTER TABLE public.series ADD COLUMN pillar_id uuid;
UPDATE public.series s SET pillar_id = p.id FROM public.pillars p WHERE s.pillar = p.slug;

-- 4. Drop existing text FKs from articles/series -> pillars.slug (if present)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname, conrelid::regclass::text AS tbl
    FROM pg_constraint
    WHERE contype = 'f'
      AND conrelid IN ('public.articles'::regclass, 'public.series'::regclass)
      AND confrelid = 'public.pillars'::regclass
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
  END LOOP;
END $$;

-- 5. Swap primary key on pillars: slug -> id (keep slug unique)
ALTER TABLE public.pillars DROP CONSTRAINT IF EXISTS pillars_pkey;
ALTER TABLE public.pillars ADD PRIMARY KEY (id);
ALTER TABLE public.pillars ADD CONSTRAINT pillars_slug_unique UNIQUE (slug);

-- 6. Add id-based FKs on articles/series
ALTER TABLE public.articles
  ADD CONSTRAINT articles_pillar_id_fkey
  FOREIGN KEY (pillar_id) REFERENCES public.pillars(id)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE public.series
  ADD CONSTRAINT series_pillar_id_fkey
  FOREIGN KEY (pillar_id) REFERENCES public.pillars(id)
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- 7. Enforce NOT NULL on pillar_id where every row was backfilled
ALTER TABLE public.articles ALTER COLUMN pillar_id SET NOT NULL;
-- series.pillar is nullable in the source schema, so leave series.pillar_id nullable to match.

-- 8. Helpful indexes
CREATE INDEX IF NOT EXISTS articles_pillar_id_idx ON public.articles(pillar_id);
CREATE INDEX IF NOT EXISTS series_pillar_id_idx ON public.series(pillar_id);
