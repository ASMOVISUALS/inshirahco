UPDATE public.ayahs SET archived_at = NULL, active = true WHERE archived_at IS NOT NULL OR active = false;
UPDATE public.ayahs SET status = 'pool' WHERE status = 'paused';