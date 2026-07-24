import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ContentBlock } from "@/lib/content";

/* ---------------- helpers ---------------- */

export function wordsIn(blocks: ContentBlock[]): number {
  const text = blocks.map(textOfBlock).join(" ");
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function textOfBlock(b: ContentBlock): string {
  switch (b.kind) {
    case "p":
    case "h2":
    case "h3":
    case "callout":
      return b.text;
    case "plain_quote":
      return `${b.text} ${b.source ?? ""}`;
    case "quote":
      return `${b.text} ${b.arabic ?? ""} ${b.source ?? ""}`;
    case "list":
      return b.items.join(" ");
    case "image":
      return `${b.alt ?? ""} ${b.caption ?? ""}`;
    case "video":
    case "audio":
      return b.caption ?? "";
    case "hyperlink":
      return `${b.label} ${b.description ?? ""}`;
    case "recommended":
      return b.slug;
    case "arabic_large":
      return `${b.arabic} ${b.english ?? ""}`;
    case "columns":
      return b.items.map(textOfBlock).join(" ");
    default:
      return "";
  }
}

export function readTimeFrom(blocks: ContentBlock[]): string {
  const mins = Math.max(1, Math.round(wordsIn(blocks) / 200));
  return `${mins} min`;
}

/* ---------------- YouTube/Vimeo embed helper ---------------- */

function toEmbedUrl(url: string): { embed: string | null; type: "youtube" | "vimeo" | "file" | null } {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return { embed: `https://www.youtube.com/embed/${id}`, type: "youtube" };
    }
    if (u.hostname === "youtu.be") {
      return { embed: `https://www.youtube.com/embed${u.pathname}`, type: "youtube" };
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.replace("/", "");
      if (id) return { embed: `https://player.vimeo.com/video/${id}`, type: "vimeo" };
    }
    return { embed: url, type: "file" };
  } catch {
    return { embed: null, type: null };
  }
}

/* ---------------- Recommended article card ---------------- */

function RecommendedCard({ slug }: { slug: string }) {
  const { data } = useQuery({
    queryKey: ["recommended-article", slug],
    enabled: !!slug,
    queryFn: async () => {
      if (!slug) return null;
      const { data } = await supabase
        .from("articles")
        .select("slug,title,description,pillar,type")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      return data;
    },
  });

  if (!slug) {
    return (
      <div className="my-6 flex h-40 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
        No article selected
      </div>
    );
  }
  if (!data) {
    return (
      <div className="my-6 flex h-40 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
        Article "{slug}" not found
      </div>
    );
  }
  return (
    <Link
      to="/read/$slug"
      params={{ slug: data.slug }}
      className="my-6 block rounded-2xl border border-border bg-card p-5 no-underline transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="eyebrow">Recommended · {data.pillar.replace(/-/g, " ")}</p>
      <h4 className="mt-2 font-display text-xl">{data.title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{data.description}</p>
    </Link>
  );
}

/* ---------------- Individual block renderers ---------------- */

export function RenderBlock({ block }: { block: ContentBlock }) {
  switch (block.kind) {
    case "h2":
      return <h2 className="mt-12 text-3xl md:text-4xl">{block.text || <span className="text-muted-foreground">Heading</span>}</h2>;
    case "h3":
      return <h3 className="mt-8 text-2xl md:text-3xl">{block.text || <span className="text-muted-foreground">Subheading</span>}</h3>;
    case "p":
      return <p>{block.text || <span className="text-muted-foreground">Empty paragraph</span>}</p>;
    case "divider":
      return <hr className="my-10 border-t border-border" />;
    case "callout":
      return (
        <aside className="my-8 rounded-3xl border p-6" style={{ background: "color-mix(in oklab, var(--gold) 12%, var(--paper-warm))", borderColor: "color-mix(in oklab, var(--gold) 45%, transparent)" }}>
          <p className="font-display text-lg italic md:text-xl">{block.text || "Callout text"}</p>
        </aside>
      );
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag className={`my-4 ${block.ordered ? "list-decimal" : "list-disc"} space-y-2 pl-6`}>
          {block.items.map((it, j) => <li key={j}>{it || <span className="text-muted-foreground">Item</span>}</li>)}
        </Tag>
      );
    }
    case "image":
      return (
        <figure className="my-8">
          {block.src ? (
            <img src={block.src} alt={block.alt ?? ""} className="w-full rounded-2xl" />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
              No image URL
            </div>
          )}
          {block.caption && <figcaption className="mt-2 text-center text-sm text-muted-foreground">{block.caption}</figcaption>}
        </figure>
      );
    case "quote":
      return (
        <blockquote className="my-10 rounded-3xl border-l-4 p-8" style={{ background: "color-mix(in oklab, var(--tazkiyah-soft) 35%, var(--paper-warm))", borderColor: "var(--tazkiyah)" }}>
          {block.arabic && (
            <p className="font-arabic text-3xl leading-loose md:text-4xl" dir="rtl" style={{ color: "var(--ink)" }}>
              {block.arabic}
            </p>
          )}
          {block.text && (
            <p className="mt-4 font-display text-xl italic md:text-2xl" style={{ fontVariationSettings: '"SOFT" 80, "WONK" 1' }}>
              "{block.text}"
            </p>
          )}
          {block.source && <footer className="mt-3 text-sm text-muted-foreground">— {block.source}</footer>}
        </blockquote>
      );
    case "plain_quote":
      return (
        <blockquote className="my-8 rounded-2xl border-l-4 border-border bg-secondary/40 p-6">
          <p className="font-display text-xl italic md:text-2xl" style={{ fontVariationSettings: '"SOFT" 80, "WONK" 1' }}>
            "{block.text || "Quote"}"
          </p>
          {block.source && <footer className="mt-3 text-sm text-muted-foreground">— {block.source}</footer>}
        </blockquote>
      );
    case "video": {
      const { embed, type } = toEmbedUrl(block.src);
      return (
        <figure className="my-8">
          {!block.src ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">No video URL</div>
          ) : type === "youtube" || type === "vimeo" ? (
            <div className="aspect-video overflow-hidden rounded-2xl">
              <iframe src={embed!} className="h-full w-full" allowFullScreen title={block.caption ?? "video"} />
            </div>
          ) : (
            <video src={block.src} controls className="w-full rounded-2xl" />
          )}
          {block.caption && <figcaption className="mt-2 text-center text-sm text-muted-foreground">{block.caption}</figcaption>}
        </figure>
      );
    }
    case "audio":
      return (
        <figure className="my-6 rounded-2xl border border-border bg-card p-4">
          {block.src ? (
            <audio src={block.src} controls className="w-full" />
          ) : (
            <p className="text-sm text-muted-foreground">No audio URL</p>
          )}
          {block.caption && <figcaption className="mt-2 text-sm text-muted-foreground">{block.caption}</figcaption>}
        </figure>
      );
    case "hyperlink":
      return (
        <a
          href={block.url || "#"}
          target="_blank"
          rel="noreferrer"
          className="my-6 flex items-start gap-4 rounded-2xl border border-border bg-card p-5 no-underline transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex-1">
            <p className="font-display text-lg font-semibold" style={{ color: "var(--heart)" }}>
              {block.label || block.url || "Untitled link"}
            </p>
            {block.description && <p className="mt-1 text-sm text-muted-foreground">{block.description}</p>}
            {block.url && <p className="mt-1 truncate text-xs text-muted-foreground">{block.url}</p>}
          </div>
          <span aria-hidden className="text-xl" style={{ color: "var(--heart)" }}>↗</span>
        </a>
      );
    case "recommended":
      return <RecommendedCard slug={block.slug} />;
    case "arabic_large":
      return (
        <div className="my-10 text-center">
          <p
            className="font-arabic leading-none"
            dir="rtl"
            style={{ color: "var(--ink)", fontSize: "clamp(3rem, 10vw, 7rem)" }}
          >
            {block.arabic || "الله"}
          </p>
          {block.english && (
            <p className="mt-4 font-display text-lg italic text-muted-foreground md:text-xl">
              {block.english}
            </p>
          )}
        </div>
      );
    case "columns": {
      const count = Math.max(1, Math.min(4, block.items.length));
      const gridCls = count === 1 ? "grid-cols-1" : count === 2 ? "md:grid-cols-2" : count === 3 ? "md:grid-cols-3" : "md:grid-cols-4";
      return (
        <div className={`my-8 grid gap-6 ${gridCls}`}>
          {block.items.map((child, i) => (
            <div key={i} className="min-w-0 [&_img]:!my-0 [&>*]:!my-0">
              <RenderBlock block={child} />
            </div>
          ))}
        </div>
      );
    }
    default:
      return null;
  }
}

export function ArticleBodyView({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="prose-body mx-auto max-w-3xl space-y-6 text-[1.14rem] leading-[1.75] md:text-[1.18rem]">
      {blocks.map((block, i) => <RenderBlock key={i} block={block} />)}
    </div>
  );
}
