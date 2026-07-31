import { motion, useReducedMotion } from "motion/react";
import { Heart, Flag } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { PublicReflection, PublicProfileRow } from "@/lib/queries";

/** Deterministic pseudo-random in [0,1) from a string seed. */
function seeded(id: string, salt: number) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

type Props = {
  reflections: PublicReflection[];
  authors: Record<string, PublicProfileRow>;
  likedIds: Set<string>;
  canAct: boolean;
  onLike: (id: string) => void;
  onReport: (id: string) => void;
};

/** Reflections drifting slowly around the verse, like leaves on still water. */
export function FloatingReflections({ reflections, authors, likedIds, canAct, onLike, onReport }: Props) {
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();

  if (isMobile) {
    return (
      <div className="mt-8 grid gap-4">
        {reflections.map((r) => (
          <Tile key={r.id} r={r} author={authors[r.user_id]} liked={likedIds.has(r.id)} canAct={canAct} onLike={onLike} onReport={onReport} />
        ))}
      </div>
    );
  }

  const cols = reflections.length > 6 ? 3 : Math.max(reflections.length, 1);
  const rows = Math.ceil(reflections.length / cols);
  const rowHeight = 210;

  return (
    <div className="relative mt-8" style={{ height: rows * rowHeight + 80 }}>
      {reflections.map((r, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const jitterX = (seeded(r.id, 1) - 0.5) * 8;
        const jitterY = (seeded(r.id, 2) - 0.5) * 40;
        const driftX = 14 + seeded(r.id, 3) * 22;
        const driftY = 12 + seeded(r.id, 4) * 20;
        const duration = 22 + seeded(r.id, 5) * 18;
        const tilt = (seeded(r.id, 6) - 0.5) * 4;

        return (
          <motion.div
            key={r.id}
            className="absolute w-[min(320px,30%)]"
            style={{
              left: `${(col * 100) / cols + 50 / cols + jitterX}%`,
              top: row * rowHeight + 20 + jitterY,
              translateX: "-50%",
            }}
            animate={
              reduceMotion
                ? undefined
                : {
                    x: [-driftX, driftX, -driftX],
                    y: [driftY, -driftY, driftY],
                    rotate: [-tilt, tilt, -tilt],
                  }
            }
            transition={{ duration, repeat: Infinity, ease: "easeInOut", times: [0, 0.5, 1] }}
          >
            <Tile r={r} author={authors[r.user_id]} liked={likedIds.has(r.id)} canAct={canAct} onLike={onLike} onReport={onReport} />
          </motion.div>
        );
      })}
    </div>
  );
}

function Tile({
  r, author, liked, canAct, onLike, onReport,
}: {
  r: PublicReflection;
  author?: PublicProfileRow;
  liked: boolean;
  canAct: boolean;
  onLike: (id: string) => void;
  onReport: (id: string) => void;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="mb-3 text-xs font-bold tracking-wide" style={{ color: "var(--heart)" }}>
        @{author?.username ?? "member"}
      </p>
      <p className="line-clamp-6 whitespace-pre-wrap text-sm leading-relaxed">{r.body}</p>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
        <div className="min-w-0">
          {author?.organisation && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {author.organisation.logo_url ? (
                <img
                  src={author.organisation.logo_url}
                  alt=""
                  className="h-4 w-4 shrink-0 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span
                  className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-[8px] font-bold"
                  style={{ background: "var(--tazkiyah-soft)", color: "var(--tazkiyah)" }}
                >
                  {author.organisation.name.charAt(0)}
                </span>
              )}
              <span className="truncate">{author.organisation.name}</span>
            </span>
          )}
          <span className="block text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onLike(r.id)}
            disabled={!canAct}
            aria-label={liked ? "Unlike this reflection" : "Like this reflection"}
            title={canAct ? "Like" : "Sign in to like"}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold transition-colors hover:border-heart disabled:opacity-50"
            style={liked ? { color: "var(--heart)", borderColor: "var(--heart)" } : undefined}
          >
            <Heart className="h-3.5 w-3.5" fill={liked ? "currentColor" : "none"} />
            {r.likes_count}
          </button>
          <button
            type="button"
            onClick={() => onReport(r.id)}
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
