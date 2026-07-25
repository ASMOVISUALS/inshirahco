import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  Link,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

function NotFoundComponent() {
  return (
    <div className="hero-radial flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <span className="font-arabic text-[8rem] leading-none" style={{ color: "color-mix(in oklab, var(--heart) 65%, transparent)" }} aria-hidden>
        ٤٠٤
      </span>
      <h1 className="mt-4 text-5xl md:text-6xl">This page has gone quiet.</h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        Maybe it was moved, maybe it never quite was. Either way — the door back home is open.
      </p>
      <Link to="/" className="btn-primary mt-8">Return home</Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl">Something didn't settle right.</h1>
        <p className="mt-3 text-muted-foreground">Try again gently, or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="btn-primary">Try again</button>
          <a href="/" className="btn-ghost">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "Inshirah" },
      { name: "theme-color", content: "#FBF2E4" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Inshirah" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,300..700,0..100,0..1&family=Nunito:wght@400;500;600;700;800&family=Amiri:wght@400;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isBuilder = /^\/admin\/pages\/[^/]+\/builder$/.test(pathname);
  const isAdmin = !isBuilder && (pathname === "/admin" || pathname.startsWith("/admin/"));
  const isProfile = pathname === "/profile" || pathname.startsWith("/profile/");
  const minimal = isAdmin || isProfile;
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      if (cancelled) return;
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      });
      return () => data.subscription.unsubscribe();
    })();
    return () => { cancelled = true; };
  }, [router, queryClient]);
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        {!isBuilder && <SiteNav minimal={minimal} title={isProfile ? "My Profile" : "Control Room"} eyebrow={isProfile ? "Account" : "Admin"} />}
        <main className="flex-1">
          <Outlet />
        </main>
        {!minimal && !isBuilder && <SiteFooter />}
      </div>
    </QueryClientProvider>
  );
}

