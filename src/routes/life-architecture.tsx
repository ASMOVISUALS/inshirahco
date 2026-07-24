import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { LetterMark } from "@/components/LetterMark";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { pageQuery, faqsQuery } from "@/lib/queries";

export const Route = createFileRoute("/life-architecture")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(pageQuery("life-architecture"));
    context.queryClient.ensureQueryData(faqsQuery("life-architecture"));
  },
  head: () => ({
    meta: [
      { title: "Life Architecture — Coming soon | Inshirah" },
      { name: "description", content: "A mentor-led course on building an intentional life — career, purpose, and long-term direction, rooted in Islamic principles. Currently in development." },
      { property: "og:title", content: "Life Architecture — Coming soon" },
      { property: "og:description", content: "Mentor-led course on the intentional life. Join the waitlist." },
      { property: "og:url", content: "/life-architecture" },
    ],
    links: [{ rel: "canonical", href: "/life-architecture" }],
  }),
  component: LifeArchitecture,
});

interface Mentor { name: string; bio: string }

function LifeArchitecture() {
  const { data: page = {} } = useQuery(pageQuery("life-architecture"));
  const { data: faqs = [] } = useQuery(faqsQuery("life-architecture"));
  const s = (k: string, fallback = "") => (page[k] as string) ?? fallback;
  const mentors = (Array.isArray(page.mentors) ? page.mentors : []) as Mentor[];

  return (
    <>
      <section className="hero-radial">
        <div className="container-wide py-24 md:py-32">
          <div className="flex flex-col items-start gap-6">
            <span className="rounded-pill px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ background: "color-mix(in oklab, var(--gold-decorative) 22%, transparent)", color: "var(--gold)" }}>
              {s("badge", "Coming soon")}
            </span>
            <div className="flex items-start gap-5">
              <LetterMark letter="ح" tint="gold" size={72} />
              <div>
                <p className="eyebrow">{s("eyebrow", "Pillar 04 · Architecture")}</p>
                <h1 className="mt-2 text-5xl leading-tight md:text-7xl">{s("title", "Life Architecture")}</h1>
              </div>
            </div>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              {s("description", "")}
            </p>
          </div>
        </div>
      </section>

      <section className="container-wide -mt-8 pb-16">
        <NewsletterSignup
          heading={s("waitlist_heading", "Be first when the door opens")}
          description={s("waitlist_description", "")}
          cta={s("waitlist_cta", "Join the waitlist")}
        />
      </section>

      {mentors.length > 0 && (
        <section className="container-wide py-16 md:py-24">
          <div className="mb-10 max-w-xl">
            <p className="eyebrow">{s("mentors_eyebrow", "The mentors")}</p>
            <h2 className="mt-3 text-4xl md:text-5xl">{s("mentors_title", "Small circle. Long conversations.")}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{s("mentors_description", "")}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {mentors.map((m, i) => (
              <div key={i} className="rounded-3xl border border-border bg-card p-7">
                <div className="grid h-16 w-16 place-items-center rounded-full font-arabic text-3xl" style={{ background: "color-mix(in oklab, var(--gold-decorative) 22%, transparent)", color: "var(--gold)" }}>م</div>
                <h3 className="mt-5 text-xl">{m.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{m.bio}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="container-wide py-8 md:py-16">
          <div className="mb-10 max-w-xl">
            <p className="eyebrow">{s("faq_eyebrow", "Questions we're asked most")}</p>
            <h2 className="mt-3 text-4xl md:text-5xl">{s("faq_title", "A few honest answers")}</h2>
          </div>
          <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border bg-card">
            {faqs.map((f, i) => (
              <FaqItem key={f.id} q={f.question} a={f.answer} last={i === faqs.length - 1} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function FaqItem({ q, a, last }: { q: string; a: string; last?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={last ? "" : "border-b border-border"}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left hover:bg-secondary/60"
      >
        <span className="font-display text-lg md:text-xl" style={{ fontVariationSettings: '"SOFT" 80, "WONK" 1' }}>{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.8} />
      </button>
      {open && <div className="px-6 pb-6 text-[1rem] leading-relaxed text-muted-foreground">{a}</div>}
    </div>
  );
}
