CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  meta_name TEXT;
  meta_dob TEXT;
  meta_gender TEXT;
  dob_val DATE;
  gender_val public.gender_type;
  uname TEXT;
BEGIN
  meta_name := NEW.raw_user_meta_data ->> 'name';
  meta_dob := NEW.raw_user_meta_data ->> 'dob';
  meta_gender := NEW.raw_user_meta_data ->> 'gender';

  BEGIN
    dob_val := meta_dob::DATE;
  EXCEPTION WHEN OTHERS THEN
    dob_val := NULL;
  END;

  BEGIN
    gender_val := meta_gender::public.gender_type;
  EXCEPTION WHEN OTHERS THEN
    gender_val := NULL;
  END;

  uname := nullif(btrim(coalesce(NEW.raw_user_meta_data ->> 'username', '')), '');
  IF uname IS NULL OR EXISTS (SELECT 1 FROM public.profiles p WHERE lower(p.username) = lower(uname)) THEN
    uname := 'member_' || substr(replace(NEW.id::text, '-', ''), 1, 8);
  END IF;

  INSERT INTO public.profiles (user_id, email, name, dob, gender, username)
  VALUES (NEW.id, NEW.email, meta_name, dob_val, gender_val, uname)
  ON CONFLICT (user_id) DO NOTHING;

  IF LOWER(NEW.email) = 'inshirahco@proton.me' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'member')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;