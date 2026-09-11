import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { myReflectionTimelineQuery, type MyTimelineReflection } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/profile/reflections")({
  head: () => ({
    meta: [{ title: "My Reflections — Inshirah" }, { name: "robots", content: "noindex" }],
  }),
  component: MyReflectionsPage,
});

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function MyReflectionsPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery(myReflectionTimelineQuery(user?.id ?? null));
  const items = useMemo(() => data ?? [], [data]);

  const [year, setYear] = useState<string>("");
  const refs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    if (items.length === 0) return;
    setYear(new Date(items[0].created_at).getFullYear().toString());

    const onScroll = () => {
      let topMost: { y: string; top: number } | null = null;
      for (const [y, el] of refs.current) {
        const top = el.getBoundingClientRect().top;
        if (top <= 160 && (!topMost || top > topMost.top)) topMost = { y, top };
      }
      if (topMost) setYear(topMost.y);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="eyebrow mb-4">Your journal</p>
      <h1 className="font-display text-4xl md:text-5xl leading-tight">My Reflections</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Everything you have written, newest first. Scroll back through your own words.
      </p>

      {isLoading && <p className="mt-10 text-sm text-muted-foreground">Loading your reflections…</p>}

      {!isLoading && items.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          You haven’t written a reflection yet. Visit the verse of the week to share your first one.
        </div>
      )}

      {items.length > 0 && (
        <div className="relative mt-10 flex gap-4 md:gap-6">
          {/* Sticky sideways year rail */}
          <div className="hidden w-8 shrink-0 sm:block">
            <div className="sticky top-24 flex justify-center">
              <span
                className="font-display text-sm tracking-[0.35em] text-heart"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                {year}
              </span>
            </div>
          </div>

          <ol className="min-w-0 flex-1 space-y-8">
            {items.map((r, i) => {
              const y = new Date(r.created_at).getFullYear().toString();
              const firstOfYear = i === 0 || new Date(items[i - 1].created_at).getFullYear().toString() !== y;
              return (
                <li
                  key={r.id}
                  ref={(el) => {
                    if (firstOfYear && el) refs.current.set(y, el);
                  }}
                >
                  <TimelineRow r={r} />
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

function TimelineRow({ r }: { r: MyTimelineReflection }) {
  const d = new Date(r.created_at);
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const full = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

  return (
    <div className="flex items-start gap-4 md:gap-6">
      <div
        className="grid h-20 w-20 shrink-0 place-items-center rounded-full border border-border bg-card text-center shadow-sm"
        aria-hidden
      >
        <div className="leading-none">
          <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
            {DAYS[d.getDay()]}
          </span>
          <span className="block font-display text-2xl leading-tight">{d.getDate()}</span>
          <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
            {MONTHS[d.getMonth()]}
          </span>
        </div>
      </div>

      <article className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
        {r.campaign && (
          <span
            className="absolute right-0 top-0 rounded-bl-2xl px-3 py-1 text-[10px] font-bold uppercase tracking-wide"
            style={{ background: "var(--gold)", color: "#1b1206" }}
          >
            {r.campaign}
          </span>
        )}

        {r.ayah && (
          <div className="mb-4 border-b border-border pb-4">
            <p className="font-arabic text-right text-2xl leading-loose">{r.ayah.arabic}</p>
            <p className="mt-2 text-sm italic text-muted-foreground">“{r.ayah.translation}”</p>
            <p className="mt-1 text-xs font-semibold" style={{ color: "var(--heart)" }}>
              {r.ayah.reference}
            </p>
          </div>
        )}

        <p className="whitespace-pre-wrap text-sm leading-relaxed">{r.body}</p>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground/80">
          <span>
            {full} · {time}
          </span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3 w-3" /> {r.likes_count}
          </span>
          {r.campaign && (
            <>
              <span aria-hidden>·</span>
              <span>{r.campaign}</span>
            </>
          )}
        </div>
      </article>
    </div>
  );
}
