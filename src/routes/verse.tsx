import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Flag } from "lucide-react";
import { currentVerseQuery, myLikesQuery, myReflectionsQuery, verseReflectionsQuery, type PublicReflection } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ReportDialog } from "@/components/ReportDialog";

export const Route = createFileRoute("/verse")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Verse of the Week — Inshirah" },
      { name: "description", content: "This week's ayah, and the reflections our community has shared on it." },
      { property: "og:title", content: "Verse of the Week — Inshirah" },
      { property: "og:description", content: "This week's ayah, and the reflections our community has shared on it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/verse" }],
  }),
  component: VersePage,
});

function VersePage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const { data: verse, isLoading } = useQuery(currentVerseQuery());
  const { data: reflections = [] } = useQuery(verseReflectionsQuery(verse?.id ?? null));
  const { data: liked = [] } = useQuery(myLikesQuery(user?.id ?? null));
  const { data: mine = [] } = useQuery(myReflectionsQuery(user?.id ?? null, verse?.id ?? null));
  const hasReflected = mine.length > 0;

  const [body, setBody] = useState("");
  const [reportId, setReportId] = useState<string | null>(null);

  const likedSet = useMemo(() => new Set(liked), [liked]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["verse-reflections"] });
    qc.invalidateQueries({ queryKey: ["my-likes"] });
    qc.invalidateQueries({ queryKey: ["my-reflections"] });
  };

  const share = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in required.");
      const { error } = await supabase.from("reflections").insert({
        user_id: user.id,
        ayah_id: verse!.id,
        body: body.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => { setBody(""); refresh(); },
  });

  const like = useMutation({
    mutationFn: async (reflectionId: string) => {
      if (!user) throw new Error("Sign in required.");
      if (likedSet.has(reflectionId)) {
        const { error } = await supabase
          .from("reflection_likes")
          .delete()
          .eq("reflection_id", reflectionId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("reflection_likes")
          .insert({ reflection_id: reflectionId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: refresh,
  });

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-6 py-24 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!verse) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl">Verse of the Week</h1>
        <p className="mt-4 text-muted-foreground">No verse has been set yet. Please check back on Friday.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <header className="text-center">
        <p className="eyebrow" style={{ color: "var(--tazkiyah)" }}>Verse of the week</p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl" style={{ fontVariationSettings: '"SOFT" 60, "WONK" 1' }}>
          Sit with it a while
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          A new ayah is chosen every Friday. Read it slowly, then share what it opened up for you.
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

      {/* Share */}
      <section className="mt-10 rounded-3xl border border-border bg-card p-6 md:p-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !user ? (
          <div className="text-center">
            <p className="text-sm">Sign in to share your reflection on this verse.</p>
            <Link to="/auth" className="btn-primary mt-4 inline-flex">Sign in</Link>
          </div>
        ) : hasReflected ? (
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your reflection</p>
            <p className="mx-auto mt-3 max-w-xl whitespace-pre-wrap text-sm leading-relaxed">{mine[0].body}</p>
            <p className="mt-4 text-xs text-muted-foreground">You've shared your reflection for this week's verse.</p>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your reflection</p>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="What does this ayah open up for you?"
              className="mt-3 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-heart"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">{body.trim().length}/5000</span>
              <button
                type="button"
                disabled={!body.trim() || share.isPending}
                onClick={() => share.mutate()}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {share.isPending ? "Sharing…" : "Share reflection"}
              </button>
            </div>
            {share.isError && <p className="mt-2 text-xs text-destructive">Could not share your reflection. Please try again.</p>}
          </>
        )}
      </section>

      {/* Orbiting reflections */}
      <section className="mt-14">
        <h2 className="text-center font-display text-2xl">Reflections orbiting this verse</h2>
        {reflections.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">No reflections yet — be the first.</p>
        ) : (
          <div className="relative mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reflections.map((r, i) => (
              <ReflectionTile
                key={r.id}
                reflection={r}
                index={i}
                liked={likedSet.has(r.id)}
                canAct={!!user}
                onLike={() => like.mutate(r.id)}
                onReport={() => setReportId(r.id)}
              />
            ))}
          </div>
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

function ReflectionTile({
  reflection, index, liked, canAct, onLike, onReport,
}: {
  reflection: PublicReflection;
  index: number;
  liked: boolean;
  canAct: boolean;
  onLike: () => void;
  onReport: () => void;
}) {
  return (
    <article
      className="orbit-tile flex flex-col self-start rounded-2xl border border-border bg-card p-5 shadow-sm"
      style={{
        animationDelay: `${(index % 6) * -2.6}s`,
        animationDuration: `${16 + (index % 5) * 3}s`,
      }}
    >
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{reflection.body}</p>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">
          {new Date(reflection.created_at).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLike}
            disabled={!canAct}
            aria-label={liked ? "Unlike this reflection" : "Like this reflection"}
            title={canAct ? "Like" : "Sign in to like"}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold transition-colors hover:border-heart disabled:opacity-50"
            style={liked ? { color: "var(--heart)", borderColor: "var(--heart)" } : undefined}
          >
            <Heart className="h-3.5 w-3.5" fill={liked ? "currentColor" : "none"} />
            {reflection.likes_count}
          </button>
          <button
            type="button"
            onClick={onReport}
            disabled={!canAct}
            aria-label="Report this reflection"
            title={canAct ? "Report" : "Sign in to report"}
            className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground/40 transition-colors hover:text-muted-foreground disabled:opacity-40"
          >
            <Flag className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
