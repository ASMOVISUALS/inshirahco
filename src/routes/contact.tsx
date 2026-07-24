import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Heart } from "lucide-react";
import { pageQuery } from "@/lib/queries";
import { PageRenderer, isBlockArray, type Block } from "@/lib/page-blocks";

export const Route = createFileRoute("/contact")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(pageQuery("contact")); },
  head: () => ({
    meta: [
      { title: "Contact & support — Inshirah" },
      { name: "description", content: "Send Inshirah a note, or read about how to support this small, freely-offered project." },
      { property: "og:title", content: "Contact & support — Inshirah" },
      { property: "og:description", content: "Get in touch, or support the project." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(1, "Please share your name.").max(100),
  email: z.string().trim().email("Please enter a valid email.").max(255),
  message: z.string().trim().min(5, "A little more, please.").max(1000, "A little shorter, please."),
});

function Contact() {
  const { data: page = {} } = useQuery(pageQuery("contact"));
  const s = (k: string, fallback = "") => (page[k] as string) ?? fallback;
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[String(i.path[0])] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSent(true);
  };

  return (
    <>
      <section className="hero-radial">
        <div className="container-wide py-20 md:py-28 text-center">
          <p className="eyebrow">{s("eyebrow", "Say salaam")}</p>
          <h1 className="mt-3 text-5xl leading-tight md:text-6xl">{s("title", "We'd love to hear from you")}</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {s("description", "")}
          </p>
        </div>
      </section>

      <section className="container-wide grid gap-8 py-14 md:grid-cols-[1.3fr_1fr]">
        <div className="rounded-3xl border border-border bg-card p-8 md:p-10">
          {sent ? (
            <div className="text-center">
              <p className="font-arabic text-5xl" style={{ color: "var(--heart)" }}>{s("success_arabic", "شكرًا")}</p>
              <h2 className="mt-4 text-3xl">{s("success_title", "Your note reached us.")}</h2>
              <p className="mt-3 text-muted-foreground">{s("success_description", "")}</p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="flex flex-col gap-5">
              <Field label="Your name" error={errors.name}>
                <input
                  value={values.name}
                  onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-heart"
                  required
                />
              </Field>
              <Field label="Email" error={errors.email}>
                <input
                  type="email"
                  value={values.email}
                  onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-heart"
                  required
                />
              </Field>
              <Field label="Message" error={errors.message}>
                <textarea
                  value={values.message}
                  onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
                  rows={6}
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-heart"
                  required
                />
              </Field>
              <button type="submit" className="btn-primary self-start">Send message</button>
            </form>
          )}
        </div>

        <aside className="rounded-3xl p-8 md:p-10" style={{ background: "color-mix(in oklab, var(--heart-soft) 30%, var(--paper-warm))" }}>
          <Heart className="h-8 w-8" strokeWidth={1.6} style={{ color: "var(--heart)" }} />
          <h2 className="mt-4 text-3xl leading-tight">{s("support_title", "Support this project")}</h2>
          <p className="mt-3 text-[1rem] leading-relaxed" style={{ color: "var(--ink)" }}>
            {s("support_body", "")}
          </p>
          <p className="mt-4 text-sm font-semibold text-muted-foreground">{s("support_footnote", "")}</p>
        </aside>
      </section>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-bold">{label}</span>
      {children}
      {error && <span className="text-sm" style={{ color: "var(--heart)" }}>{error}</span>}
    </label>
  );
}
