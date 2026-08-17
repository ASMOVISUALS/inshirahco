import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Check, ArrowLeft } from "lucide-react";
import { myLikesQuery, myPublicProfileQuery, publicProfilesQuery, verseByIdQuery, verseReflectionsQuery } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import { FloatingReflections } from "@/components/FloatingReflections";
import { ReportDialog } from "@/components/ReportDialog";

export const Route = createFileRoute("/verse-archive/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Archived Verse of the Week — Inshirah" },
      { name: "description", content: "An earlier verse of the week and the reflections the community shared on it." },
      { property: "og:title", content: "Archived Verse of the Week — Inshirah" },
      { property: "og:description", content: "An earlier verse of the week and the reflections the community shared on it." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ArchivedVersePage,
});

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

function ArchivedVersePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: verse, isLoading } = useQuery(verseByIdQuery(id));
  const { data: reflections = [] } = useQuery(verseReflectionsQuery(verse?.id ?? null));
  const { data: liked = [] } = useQuery(myLikesQuery(user?.id ?? null));
  const authorIds = useMemo(() => [...new Set(reflections.map((r) => r.user_id))], [reflections]);
  const { data: authors = {} } = useQuery(publicProfilesQuery(authorIds));
  const { data: myProfile } = useQuery(myPublicProfileQuery(user?.id ?? null));
  const myOrg = myProfile?.organisation ?? null;

  const [orgOnly, setOrgOnly] = useState(false);
  const [sort, setSort] = useState<"popular" | "recent">("popular");
  const [refreshing, setRefreshing] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  const likedSet = useMemo(() => new Set(liked), [liked]);

  const visibleReflections = useMemo(() => {
    const list = orgOnly && myProfile?.organisation_id
      ? reflections.filter((r) => authors[r.user_id]?.organisation_id === myProfile.organisation_id)
      : reflections;
    return [...list].sort((a, b) =>
      sort === "recent"
        ? b.created_at.localeCompare(a.created_at)
        : b.likes_count - a.likes_count || b.created_at.localeCompare(a.created_at),
    );
  }, [reflections, orgOnly, myProfile, authors, sort]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await qc.refetchQueries({ queryKey: ["verse-reflections"] });
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-6 py-24 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!verse) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl">Verse not found</h1>
        <Link to="/verse" className="btn-primary mt-6 inline-flex">Back to this week's verse</Link>
      </div>
    );
  }

  return (
    <div
      className="verse-page mx-auto max-w-5xl px-6 py-16 md:py-24"
      style={
        {
          "--votw-tile-light": "url(/patterns/girih-tile-light.svg)",
          "--votw-tile-dark": "url(/patterns/girih-tile-dark.svg)",
        } as React.CSSProperties
      }
    >
      {/* Thin archive header */}
      <div
        className="mb-10 flex flex-wrap items-center justify-between gap-3 rounded-full border px-5 py-2 text-[11px] font-bold uppercase tracking-[0.18em]"
        style={{
          borderColor: "color-mix(in oklab, var(--heart) 25%, transparent)",
          background: "color-mix(in oklab, var(--heart) 7%, transparent)",
          color: "var(--heart)",
        }}
      >
        <span>Archived verse: {fmt(verse.day_start)} to {fmt(verse.day_end)}</span>
        <Link to="/verse" className="inline-flex items-center gap-1.5 hover:underline">
          <ArrowLeft className="h-3 w-3" />
          This week
        </Link>
      </div>

      <header className="text-center">
        <p className="eyebrow" style={{ color: "var(--tazkiyah)" }}>Verse of the week</p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl" style={{ fontVariationSettings: '"SOFT" 60, "WONK" 1' }}>
          {verse.reference}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          What our community reflected on while this ayah was the verse of the week.
        </p>
      </header>

      <section
        className="mt-12 rounded-3xl border p-8 text-center md:p-12"
        style={{
          background: "color-mix(in oklab, var(--tazkiyah-soft) 40%, var(--paper-warm))",
          borderColor: "color-mix(in oklab, var(--tazkiyah) 25%, transparent)",
        }}
      >
        <p className="font-arabic mx-auto max-w-2xl text-3xl leading-loose md:text-4xl" dir="rtl" style={{ color: "var(--ink)" }}>
          {verse.arabic}
        </p>
        <p className="mx-auto mt-6 max-w-lg font-display text-xl italic" style={{ fontVariationSettings: '"SOFT" 80, "WONK" 1' }}>
          "{verse.translation}"
        </p>
        <p className="mt-3 text-sm font-semibold text-muted-foreground">— {verse.reference}</p>
      </section>

      <section className="mt-14">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="inline-flex items-center gap-1 rounded-full border border-border p-1" role="group" aria-label="Sort reflections">
            {(["popular", "recent"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSort(key)}
                aria-pressed={sort === key}
                className="rounded-full px-3.5 py-1.5 font-semibold capitalize transition-colors"
                style={sort === key ? { background: "var(--tazkiyah)", color: "var(--paper)" } : { color: "var(--muted-foreground)" }}
              >
                {key}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            {myOrg && (
              <button
                type="button"
                onClick={() => setOrgOnly((v) => !v)}
                aria-pressed={orgOnly}
                className="inline-flex items-center gap-1.5 font-semibold transition-colors"
                style={{ color: orgOnly ? "var(--tazkiyah)" : "var(--muted-foreground)" }}
              >
                <span
                  className="grid h-3.5 w-3.5 place-items-center rounded-[4px] border"
                  style={{
                    borderColor: orgOnly ? "var(--tazkiyah)" : "var(--border)",
                    background: orgOnly ? "var(--tazkiyah)" : "transparent",
                  }}
                >
                  {orgOnly && <Check className="h-2.5 w-2.5" style={{ color: "var(--paper)" }} />}
                </span>
                My {myOrg.short_name ?? myOrg.name}
              </button>
            )}
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {visibleReflections.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {orgOnly ? "No reflections from your organisation on this verse." : "No reflections were shared on this verse."}
          </p>
        ) : (
          <FloatingReflections
            reflections={visibleReflections}
            authors={authors}
            likedIds={likedSet}
            canAct={false}
            onLike={() => {}}
            onReport={(id) => setReportId(id)}
          />
        )}
      </section>

      {reportId && user && (
        <ReportDialog
          subject="reflection"
          targetId={reportId}
          userId={user.id}
          userEmail={user.email ?? null}
          onClose={() => setReportId(null)}
        />
      )}
    </div>
  );
}
