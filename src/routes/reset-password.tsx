import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { LetterMark } from "@/components/LetterMark";
import { supabase } from "@/integrations/supabase/client";
import { useAuthAccess } from "@/lib/auth-access";
import { AccessLocked } from "@/components/AccessLocked";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — Inshirah" },
      { name: "description", content: "Choose a new password for your Inshirah account." },
      { property: "og:title", content: "Reset password — Inshirah" },
      { property: "og:description", content: "Choose a new password for your Inshirah account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z.object({
  password: z.string().min(8, "Use at least 8 characters.").max(128),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match." });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const access = useAuthAccess();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash on load;
    // by the time we get here, either a session exists or nothing to do.
    supabase.auth.getSession().then(({ data }) => {
      setReady(true);
      if (!data.session) setError("This reset link is invalid or has expired. Request a new one.");
    });
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const r = schema.safeParse({ password, confirm });
    if (!r.success) {
      const e: Record<string, string> = {};
      r.error.issues.forEach((i) => { e[i.path[0] as string] = i.message; });
      return setErrors(e);
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) return setError(error.message);
    setDone(true);
    setTimeout(() => navigate({ to: "/" }), 1500);
  };

  if (!access.signinEnabled) {
    return (
      <AccessLocked
        eyebrow="Sign in paused"
        title="Come back soon"
        message={access.signinLockedMessage || "Account access is temporarily closed. Please check back soon."}
        adminEntry
      />
    );
  }

  return (
    <section className="hero-radial min-h-[calc(100vh-80px)]">
      <div className="container-wide py-16 md:py-24">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-4">
            <LetterMark letter="ش" tint="heart" size={56} />
            <div>
              <p className="eyebrow">Reset password</p>
              <h1 className="mt-1 text-4xl leading-tight md:text-5xl">Set a new password</h1>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-border bg-card p-7 md:p-10 shadow-[0_20px_50px_-30px_rgba(46,33,24,0.35)]">
            {!ready ? (
              <p className="text-muted-foreground">One moment…</p>
            ) : done ? (
              <p style={{ color: "var(--tazkiyah)" }}>Your password is updated. Redirecting…</p>
            ) : (
              <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
                <div>
                  <label htmlFor="new-password" className="mb-2 block text-sm font-semibold">New password</label>
                  <input
                    id="new-password" type="password" autoComplete="new-password" autoFocus
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-input bg-background px-5 py-3.5 outline-none focus:border-heart"
                  />
                  {errors.password && <p role="alert" className="mt-2 text-sm" style={{ color: "var(--heart)" }}>{errors.password}</p>}
                </div>
                <div>
                  <label htmlFor="new-confirm" className="mb-2 block text-sm font-semibold">Confirm new password</label>
                  <input
                    id="new-confirm" type="password" autoComplete="new-password"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    className="w-full rounded-2xl border border-input bg-background px-5 py-3.5 outline-none focus:border-heart"
                  />
                  {errors.confirm && <p role="alert" className="mt-2 text-sm" style={{ color: "var(--heart)" }}>{errors.confirm}</p>}
                </div>
                {error && <p role="alert" className="text-sm" style={{ color: "var(--heart)" }}>{error}</p>}
                <button type="submit" disabled={submitting} className="btn-primary justify-center">
                  {submitting ? "Updating…" : "Update password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
