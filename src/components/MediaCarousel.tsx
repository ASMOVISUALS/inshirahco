import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Headphones } from "lucide-react";
import type { ContentItem } from "@/lib/content";
import { useFormatMap, formatLabel, useOnSiteFormatSlugs } from "@/hooks/use-cms";

interface Props {
  items: ContentItem[];
}

export function MediaCarousel({ items }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const formats = useFormatMap();
  const onSiteSlugs = useOnSiteFormatSlugs();
  const visibleItems = items.filter((i) => onSiteSlugs.has(i.type));

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf: number;
    const step = () => {
      if (!paused.current && el) {
        el.scrollLeft += 0.4;
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
          el.scrollLeft = 0;
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section aria-label="Videos and podcasts" className="relative">
      <div
        ref={trackRef}
        className="flex gap-5 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
        onTouchStart={() => (paused.current = true)}
        onTouchEnd={() => (paused.current = false)}
      >
        {visibleItems.map((item) => {
          const type = formatLabel(formats, item.type);
          const isVideo = item.type === "video";
          return (
            <a
              key={item.slug}
              href={`/read/${item.slug}`}
              className="group relative flex w-[320px] shrink-0 flex-col overflow-hidden rounded-3xl border border-border bg-card transition-transform hover:-translate-y-1 sm:w-[380px]"
            >
              <div
                className="relative aspect-video w-full"
                style={{
                  background: isVideo
                    ? "linear-gradient(135deg, color-mix(in oklab, var(--heart) 35%, var(--ink)), color-mix(in oklab, var(--heart-soft) 40%, var(--ink)))"
                    : "linear-gradient(135deg, color-mix(in oklab, var(--tazkiyah) 45%, var(--ink)), color-mix(in oklab, var(--gold-decorative) 30%, var(--ink)))",
                }}
              >
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-ink shadow-lg transition-transform group-hover:scale-105">
                    {isVideo ? <Play className="ml-1 h-6 w-6 fill-ink" /> : <Headphones className="h-6 w-6" />}
                  </span>
                </span>
                <span className="absolute left-4 top-4 rounded-pill bg-black/40 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                  {type.label}
                </span>
              </div>
              <div className="flex flex-col gap-2 p-5">
                <h4 className="text-lg leading-snug">{item.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                <p className="text-xs text-muted-foreground">{item.readTime}</p>
              </div>
            </a>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={() => scrollBy(-1)}
          aria-label="Previous"
          className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card transition-colors hover:bg-secondary"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
        </button>
        <button
          onClick={() => scrollBy(1)}
          aria-label="Next"
          className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card transition-colors hover:bg-secondary"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </div>
    </section>
  );
}
