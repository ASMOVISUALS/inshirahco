import { Link } from "@tanstack/react-router";
import { Bookmark, Download, Heart } from "lucide-react";
import type { ContentItem } from "@/lib/content";
import { useBookmarks } from "@/hooks/use-theme";
import { useArticleLikes } from "@/hooks/use-article-likes";
import { usePillarMap, pillarLabel } from "@/hooks/use-cms";

const TINT_STYLES: Record<string, { grad: string }> = {
  "tadabbur": { grad: "linear-gradient(135deg, color-mix(in oklab, var(--heart) 22%, var(--paper-warm)), color-mix(in oklab, var(--heart-soft) 40%, var(--paper-warm)))" },
  "tazkiyah": { grad: "linear-gradient(135deg, color-mix(in oklab, var(--tazkiyah) 22%, var(--paper-warm)), color-mix(in oklab, var(--tazkiyah-soft) 60%, var(--paper-warm)))" },
  "youth": { grad: "linear-gradient(135deg, color-mix(in oklab, var(--heart-soft) 40%, var(--paper-warm)), color-mix(in oklab, var(--gold-decorative) 24%, var(--paper-warm)))" },
  "suhbah": { grad: "linear-gradient(135deg, color-mix(in oklab, var(--gold-decorative) 30%, var(--paper-warm)), color-mix(in oklab, var(--ink) 12%, var(--paper-warm)))" },
};

interface Props {
  item: ContentItem;
  compact?: boolean;
}

export function ContentCard({ item, compact }: Props) {
  const pillars = usePillarMap();
  const pillar = pillarLabel(pillars, item.pillar);
  const grad = TINT_STYLES[item.pillar]?.grad;
  const { has, toggle } = useBookmarks();
  const saved = has(item.slug);
  const likes = useArticleLikes();
  const liked = likes.has(item.slug);
  const likeCount = Math.max(0, (item.likesCount ?? 0) + (liked && !(item.likesCount ?? 0) ? 0 : 0));
  const cover = item.coverImage;

  return (
    <article className="group card-soft flex h-full flex-col overflow-hidden !p-0">
      <Link
        to="/read/$slug"
        params={{ slug: item.slug }}
        className="block"
        aria-label={item.title}
      >
        <div
          className="relative aspect-[16/10] w-full overflow-hidden"
          style={cover ? undefined : { background: grad }}
        >
          {cover ? (
            <img
              src={cover}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <span
              aria-hidden
              className="absolute -right-4 -bottom-6 font-arabic text-[9rem] leading-none opacity-25"
              style={{ color: "var(--ink)" }}
            >
              {pillar.arabic_letter}
            </span>
          )}
          {item.downloadable && (
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-pill bg-white/85 px-2.5 py-1 text-xs font-bold text-ink">
              <Download className="h-3.5 w-3.5" /> Downloadable
            </span>
          )}
        </div>
      </Link>

      <div className={`flex flex-1 flex-col gap-3 p-6 ${compact ? "" : ""}`}>
        <div className="flex items-center justify-between">
          <span className="eyebrow">{pillar.short_label}</span>
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className={`h-4 w-4 ${liked ? "fill-heart text-heart" : ""}`} strokeWidth={1.6} />
              {likeCount}
            </span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); toggle(item.slug); }}
              aria-label={saved ? "Remove bookmark" : "Save for later"}
              aria-pressed={saved}
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-heart"
            >
              <Bookmark className={`h-4.5 w-4.5 ${saved ? "fill-heart text-heart" : ""}`} strokeWidth={1.6} />
            </button>
          </div>
        </div>
        <Link to="/read/$slug" params={{ slug: item.slug }}>
          <h3 className="text-[1.35rem] leading-snug">{item.title}</h3>
        </Link>
        <p className="text-[0.95rem] leading-relaxed text-muted-foreground">{item.description}</p>
        {item.readTime && (
          <p className="mt-auto pt-1 text-xs text-muted-foreground">{item.readTime}</p>
        )}
      </div>
    </article>
  );
}

