import { useEffect } from "react";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { hasAdminRoleQuery } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/_admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = useAuth();
  const { data: isAdmin, isLoading } = useQuery(hasAdminRoleQuery(user?.id ?? null));
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user && isAdmin === false) navigate({ to: "/" });
  }, [isLoading, isAdmin, user, navigate]);

  if (isLoading || !user) {
    return <div className="container-wide py-24 text-center text-muted-foreground">Checking access…</div>;
  }
  if (!isAdmin) {
    return <div className="container-wide py-24 text-center text-muted-foreground">Not authorized.</div>;
  }

  return (
    <div className="container-wide py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-2 text-4xl md:text-5xl">Inshirah control room</h1>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm font-semibold">
          <AdminLink to="/admin">Dashboard</AdminLink>
          <AdminLink to="/admin/articles">Articles</AdminLink>
          <AdminLink to="/admin/reflections">Reflections</AdminLink>
          <AdminLink to="/admin/testimonials">Testimonials</AdminLink>
          <AdminLink to="/admin/newsletter">Newsletter</AdminLink>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}

function AdminLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-pill border border-border px-4 py-2 hover:bg-secondary"
      activeProps={{ style: { background: "var(--heart)", color: "var(--primary-foreground)", borderColor: "var(--heart)" } }}
      activeOptions={{ exact: true }}
    >
      {children}
    </Link>
  );
}
