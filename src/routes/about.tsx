import { createFileRoute } from "@tanstack/react-router";
import { LetterMark } from "@/components/LetterMark";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Inshirah" },
      { name: "description", content: "The story behind Inshirah — a passion project publishing Islamic psychology writing on tazkiyah, tadabbur, and the intentional life." },
      { property: "og:title", content: "About — Inshirah" },
      { property: "og:description", content: "The story behind Inshirah, and what we hope it becomes." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  return (
    <>
      <section className="hero-radial">
        <div className="container-wide py-24 md:py-32 text-center">
          <p className="font-arabic text-3xl" style={{ color: "var(--heart)" }} dir="rtl">انشراح</p>
          <h1 className="mt-4 text-5xl leading-tight md:text-7xl">
            Islamic psychology,<br /> for the world of good.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Inshirah is a small, unhurried publication. A place to sit with the Book, with the heart, and with the quieter questions of a life lived in remembrance.
          </p>
        </div>
      </section>

      <section className="container-wide py-16 md:py-24">
        <div className="mx-auto max-w-3xl space-y-8 font-display text-xl leading-relaxed md:text-2xl" style={{ fontVariationSettings: '"SOFT" 60, "WONK" 1', color: "var(--ink)" }}>
          <p>
            <span className="font-arabic text-2xl" style={{ color: "var(--heart)" }}>انشراح</span> — <em>inshirah</em> — is the Qur'anic word for the opening or expansion of the chest. It's the sense of ease that arrives in the middle of hardship. Not after it. In the middle of it.
          </p>
          <p>
            This project began as a folder of notes. Reflections we couldn't stop writing, resources we kept sending to friends, conversations that felt too important to lose. Somewhere along the way, it became a home for that work.
          </p>
          <p>
            We are not a clinic. We are not a coaching program. We're a slowly growing group of writers, students, and readers making space for what Islamic psychology has always offered — a way to know the heart, and a way to keep polishing it.
          </p>
        </div>
      </section>

      <section className="container-wide py-8 md:py-16">
        <div className="mb-10 max-w-xl">
          <p className="eyebrow">Behind the words</p>
          <h2 className="mt-3 text-4xl md:text-5xl">The founder</h2>
        </div>
        <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-3xl border border-border bg-card p-8 md:flex-row md:items-start">
          <LetterMark letter="ف" tint="heart" size={80} />
          <div>
            <h3 className="text-2xl">Founder placeholder</h3>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Writer, editor, student of the tradition</p>
            <p className="mt-4 text-[1.02rem] leading-relaxed text-muted-foreground">
              A short bio, to be filled in properly. For now: a person who reads slowly, writes even more slowly, and believes the heart is worth the long conversation.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
