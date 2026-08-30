import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { hasAdminRoleQuery } from "@/lib/queries";
import { useSiteMode } from "@/lib/site-mode";
import { SiteLanding } from "@/components/SiteLanding";

/** Paths that stay reachable while the site is locked, so admins can get back in. */
const ALLOW_PREFIXES = ["/auth", "/reset-password", "/admin", "/profile"];

function isAllowedPath(pathname: string) {
  return ALLOW_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** True when the whole public site is currently replaced by a landing screen. */
export function useSiteGateClosed(): boolean {
  const settings = useSiteMode();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user } = useAuth();
  const { data: isAdmin } = useQuery(hasAdminRoleQuery(user?.id ?? null));
  if (settings.mode === "live") return false;
  if (isAdmin) return false;
  return !isAllowedPath(pathname);
}

export function SiteGate({ children }: { children: ReactNode }) {
  const settings = useSiteMode();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user, loading } = useAuth();
  const { data: isAdmin, isPending } = useQuery(hasAdminRoleQuery(user?.id ?? null));

  if (settings.mode === "live") return <>{children}</>;
  if (isAllowedPath(pathname)) return <>{children}</>;
  // Avoid flashing the landing screen at an admin while we resolve their role.
  if (loading || (user && isPending)) return null;
  if (isAdmin) return <>{children}</>;
  return <SiteLanding settings={settings} />;
}

/** Small strip reminding signed-in admins that the public site is locked. */
export function SiteModeBanner() {
  const settings = useSiteMode();
  const { user } = useAuth();
  const { data: isAdmin } = useQuery(hasAdminRoleQuery(user?.id ?? null));
  if (settings.mode === "live" || !isAdmin) return null;
  const label = settings.mode === "maintenance" ? "Maintenance" : "Coming soon";
  return (
    <div
      className="w-full px-4 py-2 text-center text-xs font-semibold tracking-wide"
      style={{ background: "color-mix(in oklab, var(--gold-decorative) 30%, transparent)", color: "var(--ink)" }}
    >
      Public site is in <strong>{label}</strong> mode — visitors see the landing page. You're viewing it as an admin.
    </div>
  );
}
