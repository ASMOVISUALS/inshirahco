import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { z } from "zod";
import { PILLARS, RESOURCE_TYPES } from "@/lib/content";
import type { Pillar, ResourceType } from "@/lib/content";
import { articlesQuery } from "@/lib/queries";
import { ContentCard } from "@/components/ContentCard";

const searchSchema = z.object({
  type: z.string().optional(),
  pillar: z.string().optional(),
});

export const Route = createFileRoute("/resources")({
  ssr: false,
  validateSearch: (s) => searchSchema.parse(s),
  loader: ({ context }) => { context.queryClient.ensureQueryData(articlesQuery()); },
  head: () => ({
    meta: [
      { title: "Resources — Inshirah" },
      { name: "description", content: "The full Inshirah library — reflections, articles, videos, podcasts, books, worksheets, and more, filterable by type and pillar." },
      { property: "og:title", content: "Resources — Inshirah" },
      { property: "og:description", content: "The full Inshirah library, filterable by type and pillar." },
      { property: "og:url", content: "/resources" },
    ],
    links: [{ rel: "canonical", href: "/resources" }],
  }),
  component: Resources,
});

function Resources() {
  const { data: content } = useSuspenseQuery(articlesQuery());
  const search = Route.useSearch();
  const [type, setType] = useState<ResourceType | "all">((search.type as ResourceType) || "all");
  const [pillar, setPillar] = useState<Pillar | "all">((search.pillar as Pillar) || "all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return content.filter((c) => {
      if (type !== "all" && c.type !== type) return false;
      if (pillar !== "all" && c.pillar !== pillar) return false;
      if (q) {
        const query = q.toLowerCase();
        if (!c.title.toLowerCase().includes(query) && !c.description.toLowerCase().includes(query) && !c.tags.some((t) => t.includes(query))) return false;
      }
      return true;
    });
  }, [content, type, pillar, q]);

  const anyFilter = type !== "all" || pillar !== "all" || q.length > 0;

  return (
    <>
      <section className="hero-radial">
        <div className="container-wide py-20 md:py-24">
          <p className="eyebrow">The whole library</p>
          <h1 className="mt-3 text-5xl leading-tight md:text-6xl">Every resource, one open shelf</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Filter by pillar or format, or search by word. Everything here is free to read, listen, and download.
          </p>
        </div>
      </section>

      <section className="container-wide py-10">
        <div className="rounded-3xl border border-border bg-card p-5 md:p-6">
          <label className="flex items-center gap-3 rounded-pill border border-border bg-background px-4 py-2.5">
            <Search className="h-4.5 w-4.5 text-muted-foreground" strokeWidth={1.8} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search resources…"
              className="w-full bg-transparent outline-none"
              aria-label="Search resources"
            />
          </label>

          <div className="mt-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Pillar</p>
            <div className="flex flex-wrap gap-2">
              <FilterChip active={pillar === "all"} onClick={() => setPillar("all")}>All</FilterChip>
              {Object.entries(PILLARS).map(([key, p]) => (
                <FilterChip key={key} active={pillar === key} onClick={() => setPillar(key as Pillar)}>
                  {p.short}
                </FilterChip>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Format</p>
            <div className="flex flex-wrap gap-2">
              <FilterChip active={type === "all"} onClick={() => setType("all")}>All</FilterChip>
              {Object.entries(RESOURCE_TYPES).map(([key, t]) => (
                <FilterChip key={key} active={type === key} onClick={() => setType(key as ResourceType)}>
                  {t.plural}
                </FilterChip>
              ))}
            </div>
          </div>

          {anyFilter && (
            <button
              onClick={() => { setType("all"); setPillar("all"); setQ(""); }}
              className="mt-5 text-sm font-bold underline underline-offset-4"
              style={{ color: "var(--heart)" }}
            >
              Reset filters
            </button>
          )}
        </div>
      </section>

      <section className="container-wide pb-24">
        <p className="mb-6 text-sm font-semibold text-muted-foreground">{filtered.length} {filtered.length === 1 ? "resource" : "resources"}</p>
        {filtered.length === 0 ? (
          <p className="rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground">Nothing matches that combination just yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => <ContentCard key={item.slug} item={item} />)}
          </div>
        )}
      </section>
    </>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-pill border px-4 py-1.5 text-sm font-semibold transition-colors"
      style={active ? { background: "var(--heart)", color: "var(--primary-foreground)", borderColor: "var(--heart)" } : { borderColor: "var(--border)" }}
    >
      {children}
    </button>
  );
}
