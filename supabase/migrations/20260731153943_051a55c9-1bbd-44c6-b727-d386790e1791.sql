GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;

DROP POLICY IF EXISTS "Admins can grant non-admin roles" ON public.user_roles;
CREATE POLICY "Admins can grant non-admin roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND role::text <> 'admin');

DROP POLICY IF EXISTS "Admins can remove non-admin roles" ON public.user_roles;
CREATE POLICY "Admins can remove non-admin roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') AND role::text <> 'admin');