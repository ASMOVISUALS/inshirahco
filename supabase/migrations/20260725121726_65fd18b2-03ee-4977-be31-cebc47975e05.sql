
-- ============================================================
-- 1. Pages: add status enum
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.page_status AS ENUM ('published','hidden','coming_soon');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS status public.page_status NOT NULL DEFAULT 'published';

-- Backfill from is_locked
UPDATE public.pages SET status = 'hidden' WHERE is_locked = true AND status = 'published';

-- ============================================================
-- 2. Newsletters table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.newsletters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.newsletters TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletters TO authenticated;
GRANT ALL ON public.newsletters TO service_role;

ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Newsletters are viewable by everyone" ON public.newsletters;
CREATE POLICY "Newsletters are viewable by everyone"
  ON public.newsletters FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage newsletters" ON public.newsletters;
CREATE POLICY "Admins manage newsletters"
  ON public.newsletters FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_newsletters_updated_at ON public.newsletters;
CREATE TRIGGER trg_newsletters_updated_at
  BEFORE UPDATE ON public.newsletters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Ensure exactly one default
CREATE UNIQUE INDEX IF NOT EXISTS newsletters_one_default_idx
  ON public.newsletters ((true)) WHERE is_default = true;

-- Seed default "General" list
INSERT INTO public.newsletters (slug, name, description, is_default)
VALUES ('general', 'General', 'Occasional letters from Inshirah.', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Newsletter signups: attach newsletter_id
-- ============================================================
ALTER TABLE public.newsletter_signups
  ADD COLUMN IF NOT EXISTS newsletter_id UUID REFERENCES public.newsletters(id) ON DELETE RESTRICT;

-- Backfill existing rows to the default newsletter
UPDATE public.newsletter_signups s
   SET newsletter_id = (SELECT id FROM public.newsletters WHERE is_default LIMIT 1)
 WHERE newsletter_id IS NULL;

ALTER TABLE public.newsletter_signups
  ALTER COLUMN newsletter_id SET NOT NULL;

-- Dedupe per (newsletter_id, lower(email))
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_signups_list_email_idx
  ON public.newsletter_signups (newsletter_id, lower(email));

-- Update anonymous INSERT policy to require a valid newsletter_id
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_signups;
CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_signups FOR INSERT
  WITH CHECK (
    email IS NOT NULL
    AND char_length(email) BETWEEN 3 AND 254
    AND position('@' IN email) > 1
    AND newsletter_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.newsletters n WHERE n.id = newsletter_signups.newsletter_id)
  );

-- ============================================================
-- 4. Seed system pages (Hidden + Coming Soon templates)
-- ============================================================
-- These are edited via the same page builder; they aren't publicly routable.
-- Their `blocks` arrays support {{page_name}} substitution at render time.

INSERT INTO public.pages (key, slug, title, is_published, is_locked, status, template, content)
VALUES (
  'system:hidden',
  '_hidden',
  'Hidden page template',
  false,
  false,
  'published',
  'system',
  jsonb_build_object(
    'blocks', jsonb_build_array(
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'type', 'hidden_frame',
        'props', jsonb_build_object(
          'eyebrow', '{{page_name}}',
          'title', 'This page is hidden.',
          'subtitle', 'Come back soon — but feel free to explore other pages below.',
          'arabic_watermark', 'سِرّ',
          'arabic_verse', 'إن مع العسر يسرا'
        )
      ),
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'type', 'explore_pages',
        'props', jsonb_build_object(
          'items', jsonb_build_array(
            jsonb_build_object('label', 'Home', 'href', '/'),
            jsonb_build_object('label', 'About', 'href', '/about'),
            jsonb_build_object('label', 'Resources', 'href', '/resources'),
            jsonb_build_object('label', 'Life Architecture', 'href', '/life-architecture'),
            jsonb_build_object('label', 'Contact', 'href', '/contact')
          )
        )
      )
    )
  )::jsonb
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.pages (key, slug, title, is_published, is_locked, status, template, content)
VALUES (
  'system:coming-soon',
  '_coming-soon',
  'Coming soon template',
  false,
  false,
  'published',
  'system',
  jsonb_build_object(
    'blocks', jsonb_build_array(
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'type', 'hidden_frame',
        'props', jsonb_build_object(
          'eyebrow', '{{page_name}}',
          'title', 'Coming soon.',
          'subtitle', 'We''re quietly putting {{page_name}} together. Leave your email below to be the first to know when it opens.',
          'arabic_watermark', 'قريبًا',
          'arabic_verse', 'إن مع العسر يسرا'
        )
      ),
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'type', 'newsletter',
        'props', jsonb_build_object(
          'heading', 'Be the first to know',
          'description', 'A single quiet note when {{page_name}} opens. Nothing else.',
          'cta', 'Notify me',
          'newsletterId', (SELECT id FROM public.newsletters WHERE is_default LIMIT 1)
        )
      ),
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'type', 'explore_pages',
        'props', jsonb_build_object(
          'items', jsonb_build_array(
            jsonb_build_object('label', 'Home', 'href', '/'),
            jsonb_build_object('label', 'About', 'href', '/about'),
            jsonb_build_object('label', 'Resources', 'href', '/resources'),
            jsonb_build_object('label', 'Contact', 'href', '/contact')
          )
        )
      )
    )
  )::jsonb
)
ON CONFLICT (key) DO NOTHING;
