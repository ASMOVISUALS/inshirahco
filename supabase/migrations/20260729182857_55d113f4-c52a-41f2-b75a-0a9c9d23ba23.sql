REVOKE EXECUTE ON FUNCTION public.rotate_verse_of_the_week() FROM anon, authenticated, public;

CREATE OR REPLACE FUNCTION public.current_verse_of_the_week()
 RETURNS SETOF ayahs
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE ws date; v uuid;
BEGIN
  ws := current_date - ((EXTRACT(dow FROM current_date)::int - 5 + 7) % 7);
  SELECT ayah_id INTO v FROM verse_of_the_week WHERE week_start = ws;
  IF v IS NULL THEN
    UPDATE ayahs SET status = 'used' WHERE status = 'current';
    SELECT id INTO v FROM ayahs WHERE status = 'pool' ORDER BY queue_order NULLS LAST, created_at LIMIT 1;
    IF v IS NULL THEN
      UPDATE ayahs SET status = 'pool' WHERE status = 'used';
      SELECT id INTO v FROM ayahs WHERE status = 'pool' ORDER BY queue_order NULLS LAST, created_at LIMIT 1;
    END IF;
    IF v IS NULL THEN RETURN; END IF;
    INSERT INTO verse_of_the_week(week_start, ayah_id) VALUES (ws, v) ON CONFLICT (week_start) DO NOTHING;
    SELECT ayah_id INTO v FROM verse_of_the_week WHERE week_start = ws;
    UPDATE ayahs SET status = 'current' WHERE id = v;
  END IF;
  RETURN QUERY SELECT * FROM ayahs WHERE id = v;
END;
$function$;