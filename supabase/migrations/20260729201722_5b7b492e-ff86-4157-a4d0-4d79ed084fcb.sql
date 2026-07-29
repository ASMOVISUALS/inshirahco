REVOKE EXECUTE ON FUNCTION public.rotate_verse_of_the_week() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rotate_verse_of_the_week_if_due() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_verse_of_the_week() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_reflection_likes() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;