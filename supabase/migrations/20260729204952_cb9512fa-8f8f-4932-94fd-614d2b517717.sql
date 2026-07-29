ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS articles_type_fkey;
ALTER TABLE public.articles DROP COLUMN IF EXISTS type;
DROP TABLE IF EXISTS public.resource_formats;
DELETE FROM public.pages WHERE key = 'resources';