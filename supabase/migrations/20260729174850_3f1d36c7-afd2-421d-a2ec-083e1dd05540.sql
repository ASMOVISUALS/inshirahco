DELETE FROM public.reflections r
USING public.reflections keep
WHERE r.user_id = keep.user_id
  AND r.ayah_id = keep.ayah_id
  AND (keep.created_at < r.created_at OR (keep.created_at = r.created_at AND keep.id < r.id));

ALTER TABLE public.reflections
  ADD CONSTRAINT reflections_one_per_user_per_ayah UNIQUE (user_id, ayah_id);