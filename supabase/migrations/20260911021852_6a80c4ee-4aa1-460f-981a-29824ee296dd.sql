ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS cover_image text,
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.article_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_slug)
);

GRANT SELECT, INSERT, DELETE ON public.article_likes TO authenticated;
GRANT SELECT ON public.article_likes TO anon;
GRANT ALL ON public.article_likes TO service_role;

ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Article likes are viewable by everyone"
  ON public.article_likes FOR SELECT USING (true);

CREATE POLICY "Members can like articles"
  ON public.article_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can remove their own likes"
  ON public.article_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sync_article_likes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.articles SET likes_count = likes_count + 1 WHERE slug = NEW.article_slug;
    RETURN NEW;
  ELSE
    UPDATE public.articles SET likes_count = GREATEST(likes_count - 1, 0) WHERE slug = OLD.article_slug;
    RETURN OLD;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_article_likes() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS article_likes_sync ON public.article_likes;
CREATE TRIGGER article_likes_sync
AFTER INSERT OR DELETE ON public.article_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_article_likes();