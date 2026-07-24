import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { LetterMark } from "@/components/LetterMark";
import { NewsletterSignup } from "@/components/NewsletterSignup";

export const Route = createFileRoute("/life-architecture")({
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

const FAQ = [
  { q: "What will the course actually cover?", a: "Placeholder. We're shaping a curriculum around vocation, long-term decision-making, spiritual grounding, and the practical scaffolding of a life you can sustain. Expect readings, mentor conversations, and reflective work — not lectures alone." },
  { q: "Who is it for?", a: "Placeholder. Adults — early-to-mid career, or in a season of transition — who want to build with intention rather than react to circumstance. No prior background required, just a willingness to sit with hard questions." },
  { q: "Will it cost money?", a: "Placeholder. Yes, eventually — sustainably priced, with a portion of seats reserved on a means-adjusted basis. Details will land with the waitlist announcement." },
  { q: "When does it launch?", a: "Placeholder. When it's ready and not before. Join the waitlist to be the first to hear when a cohort opens." },
];

function LifeArchitecture() {
  return (
    <>
      <section className="hero-radial">
        <div className="container-wide py-24 md:py-32">
          <div className="flex flex-col items-start gap-6">
            <span className="rounded-pill px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ background: "color-mix(in oklab, var(--gold-decorative) 22%, transparent)", color: "var(--gold)" }}>
              Coming soon
            </span>
            <div className="flex items-start gap-5">
              <LetterMark letter="ح" tint="gold" size={72} />
              <div>
                <p className="eyebrow">Pillar 04 · Architecture</p>
                <h1 className="mt-2 text-5xl leading-tight md:text-7xl">Life Architecture</h1>
              </div>
            </div>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              A mentor-led course on building a life with intention — vocation, direction, and the long, slow work of aligning what you do with who you're becoming. In development. Join the waitlist for the first cohort.
            </p>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section className="container-wide -mt-8 pb-16">
        <NewsletterSignup
          heading="Be first when the door opens"
          description="A single email when the first cohort is announced. No marketing sequences, no upsells."
          cta="Join the waitlist"
        />
      </section>

      {/* Mentors */}
      <section className="container-wide py-16 md:py-24">
        <div className="mb-10 max-w-xl">
          <p className="eyebrow">The mentors</p>
          <h2 className="mt-3 text-4xl md:text-5xl">Small circle. Long conversations.</h2>
          <p className="mt-3 text-sm text-muted-foreground">Mentor profiles are placeholders — the confirmed circle will be introduced with the waitlist announcement.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl border border-border bg-card p-7">
              <div className="grid h-16 w-16 place-items-center rounded-full font-arabic text-3xl" style={{ background: "color-mix(in oklab, var(--gold-decorative) 22%, transparent)", color: "var(--gold)" }}>م</div>
              <h3 className="mt-5 text-xl">Mentor {i}</h3>
              <p className="mt-2 text-sm text-muted-foreground">Placeholder bio. A short paragraph on the mentor's background, the kind of questions they hold well, and what they bring to the circle.</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container-wide py-8 md:py-16">
        <div className="mb-10 max-w-xl">
          <p className="eyebrow">Questions we're asked most</p>
          <h2 className="mt-3 text-4xl md:text-5xl">A few honest answers</h2>
        </div>
        <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border bg-card">
          {FAQ.map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} last={i === FAQ.length - 1} />
          ))}
        </div>
      </section>
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
