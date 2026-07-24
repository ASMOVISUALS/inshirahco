import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing you in — Inshirah" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const errDesc = url.searchParams.get("error_description") ?? url.hash.match(/error_description=([^&]+)/)?.[1];

      if (errDesc) {
        setError(decodeURIComponent(errDesc.replace(/\+/g, " ")));
        return;
      }

      // PKCE flow: exchange ?code for a session.
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (cancelled) return;
        if (error) return setError(error.message);
      }
      // Implicit flow (#access_token=...) is auto-consumed by supabase-js
      // via detectSessionInUrl. Poll briefly for the session.
      for (let i = 0; i < 20; i++) {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          navigate({ to: "/", replace: true });
          return;
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      setError("This sign-in link is invalid or has expired.");
    };

    void finish();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <section className="hero-radial min-h-[calc(100vh-80px)] grid place-items-center">
      <div className="text-center px-6">
        {error ? (
          <>
            <p className="eyebrow">Sign-in link</p>
            <h1 className="mt-2 text-3xl md:text-4xl">Couldn't sign you in</h1>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">{error}</p>
            <a href="/auth" className="btn-primary mt-6 inline-flex">Back to sign in</a>
          </>
        ) : (
          <>
            <p className="eyebrow">One moment</p>
            <h1 className="mt-2 text-3xl md:text-4xl">Signing you in…</h1>
          </>
        )}
      </div>
    </section>
  );
}
