import { useMemo, useState } from "react";
import type { Pillar } from "@/lib/content";
import { PILLARS, getContentByPillar } from "@/lib/content";
import { ContentCard } from "@/components/ContentCard";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { LetterMark } from "@/components/LetterMark";

interface Props {
  pillar: Pillar;
  eyebrow?: string;
  intro?: string;
  tint?: "heart" | "tazkiyah" | "heart-soft" | "gold";
}

export function PillarArchive({ pillar, eyebrow, intro, tint = "heart" }: Props) {
  const meta = PILLARS[pillar];
  const items = getContentByPillar(pillar);
  const allTags = useMemo(() => Array.from(new Set(items.flatMap((i) => i.tags))), [items]);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = activeTag ? items.filter((i) => i.tags.includes(activeTag)) : items;

  return (
    <>
      <section className="hero-radial">
        <div className="container-wide py-20 md:py-28">
          <div className="flex items-start gap-6">
            <LetterMark letter={meta.letter} tint={tint} size={72} />
            <div className="max-w-3xl">
              <p className="eyebrow">{eyebrow ?? "Pillar"}</p>
              <h1 className="mt-3 text-5xl leading-tight md:text-6xl">{meta.label}</h1>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground md:text-xl">{intro ?? meta.description}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-wide py-14">
        {allTags.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm font-semibold text-muted-foreground">Filter:</span>
            <button
              onClick={() => setActiveTag(null)}
              className={`rounded-pill border px-4 py-1.5 text-sm font-semibold transition-colors ${activeTag === null ? "border-heart bg-heart text-primary-foreground" : "border-border hover:bg-secondary"}`}
              style={activeTag === null ? { background: "var(--heart)", color: "var(--primary-foreground)", borderColor: "var(--heart)" } : undefined}
            >
              All
            </button>
            {allTags.map((tag) => {
              const active = activeTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(active ? null : tag)}
                  className="rounded-pill border px-4 py-1.5 text-sm font-semibold transition-colors"
                  style={active ? { background: "var(--heart)", color: "var(--primary-foreground)", borderColor: "var(--heart)" } : { borderColor: "var(--border)" }}
                >
                  {tag}
                </button>
              );
            })}
            {activeTag && (
              <button onClick={() => setActiveTag(null)} className="ml-2 text-sm font-semibold underline underline-offset-4" style={{ color: "var(--heart)" }}>
                Reset
              </button>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground">
            No writing here just yet. Try a different filter, or come back soon.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <ContentCard key={item.slug} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="container-wide pb-24">
        <NewsletterSignup variant="inline" />
      </section>
    </>
  );
}
