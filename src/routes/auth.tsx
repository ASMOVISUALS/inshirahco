import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { LetterMark } from "@/components/LetterMark";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Inshirah" },
      { name: "description", content: "Sign in to your Inshirah account to sync your bookmarks and continue reading." },
      { property: "og:title", content: "Sign in — Inshirah" },
      { property: "og:description", content: "Sign in to your Inshirah account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const signInSchema = z.object({
  email: z.string().trim().email("Please enter a valid email.").max(255),
  password: z.string().min(1, "Please enter your password.").max(128),
});

const resetSchema = z.object({
  email: z.string().trim().email("Please enter a valid email.").max(255),
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setNotice(null);
    if (mode === "signin") {
      const parsed = signInSchema.safeParse({ email, password });
      if (!parsed.success) return setError(parsed.error.issues[0].message);
      setSubmitting(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setSubmitting(false);
      if (error) return setError(error.message);
      navigate({ to: "/" });
    } else {
      const parsed = resetSchema.safeParse({ email });
      if (!parsed.success) return setError(parsed.error.issues[0].message);
      setSubmitting(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setSubmitting(false);
      if (error) return setError(error.message);
      setNotice("If an account exists for that email, a reset link is on its way.");
    }
  };

  return (
    <section className="hero-radial min-h-[calc(100vh-80px)]">
      <div className="container-wide py-16 md:py-24">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-4">
            <LetterMark letter="ش" tint="heart" size={56} />
            <div>
              <p className="eyebrow">{mode === "signin" ? "Welcome back" : "Reset password"}</p>
              <h1 className="mt-1 text-4xl leading-tight md:text-5xl">
                {mode === "signin" ? "Sign in" : "Forgot password"}
              </h1>
            </div>
          </div>

          <form onSubmit={onSubmit} noValidate className="mt-8 rounded-3xl border border-border bg-card p-7 md:p-10 shadow-[0_20px_50px_-30px_rgba(46,33,24,0.35)] flex flex-col gap-5">
            <div>
              <label htmlFor="auth-email" className="mb-2 block text-sm font-semibold">Email address</label>
              <input
                id="auth-email" type="email" autoComplete="email" autoFocus
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-input bg-background px-5 py-3.5 outline-none focus:border-heart"
              />
            </div>

            {mode === "signin" && (
              <div>
                <label htmlFor="auth-password" className="mb-2 block text-sm font-semibold">Password</label>
                <input
                  id="auth-password" type="password" autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-input bg-background px-5 py-3.5 outline-none focus:border-heart"
                />
              </div>
            )}

            {error && <p role="alert" className="text-sm" style={{ color: "var(--heart)" }}>{error}</p>}
            {notice && <p className="text-sm" style={{ color: "var(--tazkiyah)" }}>{notice}</p>}

            <button type="submit" disabled={submitting} className="btn-primary justify-center">
              {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Send reset link"}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => { setMode(mode === "signin" ? "forgot" : "signin"); setError(null); setNotice(null); }}
                className="font-semibold underline underline-offset-4"
                style={{ color: "var(--heart)" }}
              >
                {mode === "signin" ? "Forgot password?" : "Back to sign in"}
              </button>
              <Link to="/join" className="font-semibold text-muted-foreground hover:text-foreground">
                Create an account →
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
