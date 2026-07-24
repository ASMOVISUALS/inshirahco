import { useState } from "react";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email." }).max(255),
});

interface Props {
  heading?: string;
  description?: string;
  cta?: string;
  variant?: "default" | "inline" | "dark";
}

export function NewsletterSignup({
  heading = "Something quiet in your inbox",
  description = "A short letter every so often — a reflection, a resource, and nothing else. No noise.",
  cta = "Join the letter",
  variant = "default",
}: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success">("idle");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid email.");
      return;
    }
    setError(null);
    // TODO: wire to real backend later.
    setStatus("success");
    setEmail("");
  };

  const dark = variant === "dark";
  const container =
    variant === "inline"
      ? "surface-warm rounded-3xl p-6 md:p-8"
      : dark
      ? "rounded-3xl p-8 md:p-10"
      : "rounded-3xl bg-card border border-border p-8 md:p-10 shadow-[0_20px_50px_-30px_rgba(46,33,24,0.35)]";

  return (
    <section className={container} style={dark ? { background: "color-mix(in oklab, var(--ink) 92%, black)", color: "var(--paper)" } : undefined}>
      <div className="max-w-xl">
        <p className="eyebrow mb-3" style={dark ? { color: "var(--gold-decorative)" } : undefined}>Newsletter</p>
        <h3 className="text-3xl md:text-4xl leading-tight" style={dark ? { color: "var(--paper)" } : undefined}>{heading}</h3>
        <p className={`mt-3 text-[1.02rem] leading-relaxed ${dark ? "" : "text-muted-foreground"}`} style={dark ? { color: "color-mix(in oklab, var(--paper) 78%, transparent)" } : undefined}>
          {description}
        </p>

        {status === "success" ? (
          <p className="mt-6 rounded-2xl border border-tazkiyah/40 bg-tazkiyah-soft/40 px-5 py-4 text-tazkiyah" style={{ color: "var(--tazkiyah)" }}>
            You're on the list. Look for a gentle note from us, insha'Allah.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row" noValidate>
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@thoughtful.email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-0 flex-1 rounded-pill border border-input bg-background px-5 py-3.5 text-[0.98rem] outline-none placeholder:text-muted-foreground focus:border-heart"
              style={dark ? { background: "color-mix(in oklab, var(--paper) 10%, transparent)", color: "var(--paper)", borderColor: "color-mix(in oklab, var(--paper) 22%, transparent)" } : undefined}
              aria-invalid={!!error}
              aria-describedby={error ? "newsletter-error" : undefined}
            />
            <button type="submit" className="btn-primary whitespace-nowrap">
              {cta}
            </button>
          </form>
        )}
        {error && (
          <p id="newsletter-error" role="alert" className="mt-3 text-sm" style={{ color: dark ? "var(--heart-soft)" : "var(--heart)" }}>
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
