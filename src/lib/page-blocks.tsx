import { useMemo, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Compass, Users, Mountain, Sparkles, BookOpen, Calendar, Heart, Star, Quote, Feather, Search } from "lucide-react";
import { articlesQuery, testimonialsQuery, faqsQuery, publicSeriesQuery } from "@/lib/queries";
import { usePillars, useFormats, useOnSiteFormatSlugs } from "@/hooks/use-cms";
import { LetterMark } from "@/components/LetterMark";
import { ContentCard } from "@/components/ContentCard";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { ReflectionOfTheDay } from "@/components/ReflectionOfTheDay";
import { TemplateVarsProvider, substituteVars, useTemplateVars, type TemplateVars } from "@/lib/template-vars";


export type BlockType =
  | "hero"
  | "hero_fullscreen"
  | "hidden_frame"
  | "explore_pages"
  | "section_header"
  | "heading"
  | "paragraph"
  | "rich_text"
  | "image"
  | "image_text_split"
  | "feature_grid"
  | "pillar_cards"
  | "cta_banner"
  | "stat_row"
  | "testimonials_row"
  | "latest_articles"
  | "reflection_spotlight"
  | "newsletter"
  | "faq_accordion"
  | "founder_letter"
  | "arabic_verse"
  | "divider"
  | "spacer";


export interface Block<TProps = Record<string, unknown>> {
  id: string;
  type: BlockType;
  props: TProps;
}

export interface BlockCategory {
  key: string;
  label: string;
  items: { type: BlockType; label: string; description?: string }[];
}

export const BLOCK_CATEGORIES: BlockCategory[] = [
  {
    key: "layout",
    label: "Layout",
    items: [
      { type: "hero", label: "Hero", description: "Big arabic mark + title + CTAs" },
      { type: "hero_fullscreen", label: "Full-screen header", description: "Layered pattern + watermark" },
      { type: "hidden_frame", label: "Hidden / Coming soon frame", description: "System template body" },
      { type: "explore_pages", label: "Explore pages row", description: "Chip navigation" },
      { type: "section_header", label: "Section header", description: "Eyebrow + title + description" },
      { type: "divider", label: "Divider" },
      { type: "spacer", label: "Spacer" },
    ],
  },

  {
    key: "content",
    label: "Content",
    items: [
      { type: "heading", label: "Heading" },
      { type: "paragraph", label: "Paragraph" },
      { type: "rich_text", label: "Rich text", description: "Multi-paragraph column" },
      { type: "founder_letter", label: "Founder / letter card" },
      { type: "arabic_verse", label: "Arabic verse (Quran)" },
    ],
  },
  {
    key: "marketing",
    label: "Marketing",
    items: [
      { type: "feature_grid", label: "Feature grid" },
      { type: "stat_row", label: "Stat row" },
      { type: "cta_banner", label: "CTA banner" },
      { type: "image_text_split", label: "Image + text" },
    ],
  },
  {
    key: "data",
    label: "Data",
    items: [
      { type: "pillar_cards", label: "Pillar cards (auto)" },
      { type: "latest_articles", label: "Latest articles (auto)" },
      { type: "testimonials_row", label: "Testimonials (auto)" },
      { type: "reflection_spotlight", label: "Reflection of the day" },
      { type: "faq_accordion", label: "FAQ list" },
      { type: "newsletter", label: "Newsletter signup" },
    ],
  },
  { key: "media", label: "Media", items: [{ type: "image", label: "Image" }] },
];

export const BLOCK_LABEL: Record<BlockType, string> = Object.fromEntries(
  BLOCK_CATEGORIES.flatMap((c) => c.items.map((i) => [i.type, i.label] as const))
) as Record<BlockType, string>;

const ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  compass: Compass, users: Users, mountain: Mountain, sparkles: Sparkles,
  book: BookOpen, calendar: Calendar, heart: Heart, star: Star, quote: Quote, feather: Feather,
};

export function newBlock(type: BlockType): Block {
  const id = crypto.randomUUID();
  const defaults: Record<BlockType, Record<string, unknown>> = {
    hero: {
      eyebrow: "", arabic: "انشراح",
      title_line1: "A new page",
      title_line2: "written slowly.",
      description: "A short line that sets the mood, no more.",
      cta_primary_label: "Start reading", cta_primary_href: "/resources",
      cta_secondary_label: "Our story", cta_secondary_href: "/about",
      background: "radial",
    },
    section_header: { eyebrow: "New section", title: "A quiet heading", description: "", align: "left" },
    heading: { level: 2, text: "A heading" },
    paragraph: { text: "Write something slow and considered." },
    rich_text: { paragraphs: ["First paragraph.", "Second paragraph."] },
    image: { url: "", alt: "", caption: "", max_width: 960 },
    image_text_split: { image_url: "", alt: "", eyebrow: "", title: "A title", body: "A short paragraph.", image_side: "left", cta_label: "", cta_href: "" },
    feature_grid: {
      columns: 3,
      items: [
        { icon: "sparkles", tag: "", title: "First feature", description: "A short line about it." },
        { icon: "compass", tag: "", title: "Second feature", description: "A short line about it." },
        { icon: "users", tag: "", title: "Third feature", description: "A short line about it." },
      ],
    },
    pillar_cards: { eyebrow: "Four rooms in one house", title: "Where to begin", description: "" },
    cta_banner: { title: "Come sit with us.", description: "", cta_label: "Join Inshirah", cta_href: "/join", tint: "heart" },
    stat_row: { items: [{ value: "01", label: "Slow" }, { value: "04", label: "Pillars" }, { value: "∞", label: "Rooms" }] },
    testimonials_row: { eyebrow: "Community voices", title: "Notes from readers" },
    latest_articles: { eyebrow: "Latest writing", title: "Recently, from us to you", pillar: "", count: 3 },
    reflection_spotlight: {},
    newsletter: { heading: "", description: "", cta: "", newsletterId: "" },
    hero_fullscreen: {
      eyebrow: "",
      title: "A quiet page",
      subtitle: "",
      arabic_watermark: "انشراح",
      arabic_verse: "",
      align: "center",
    },
    hidden_frame: {
      eyebrow: "{{page_name}}",
      title: "This page is hidden.",
      subtitle: "Come back soon — but feel free to explore other pages below.",
      arabic_watermark: "سِرّ",
      arabic_verse: "إن مع العسر يسرا",
    },
    explore_pages: {
      items: [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Resources", href: "/resources" },
        { label: "Contact", href: "/contact" },
      ],
    },
    faq_accordion: { page_key: "", items: [] },
    founder_letter: { eyebrow: "Behind the words", title: "The founder", letter: "ف", name: "Founder", role: "", bio: "", tint: "heart" },
    arabic_verse: { arabic: "", translation: "", reference: "" },
    divider: {},
    spacer: { size: "md" },


  };
  return { id, type, props: defaults[type] };
}

// -------- Renderer --------

export function PageRenderer({ blocks, vars }: { blocks: Block[]; vars?: TemplateVars }) {
  const inherited = useTemplateVars();
  const merged = vars ? { ...inherited, ...vars } : inherited;
  return (
    <TemplateVarsProvider value={merged}>
      {blocks.map((b) => (
        <RenderBlock key={b.id} block={b} />
      ))}
    </TemplateVarsProvider>
  );
}

function RenderBlock({ block }: { block: Block }) {
  const p = block.props as Record<string, unknown>;
  const vars = useTemplateVars();
  const s = (k: string, f = "") => substituteVars((p[k] as string) ?? f, vars);
  const n = (k: string, f = 0) => (typeof p[k] === "number" ? (p[k] as number) : f);


  switch (block.type) {
    case "hero": {
      const bg = s("background", "radial") === "plain" ? "" : "hero-radial";
      return (
        <section className={`${bg} relative overflow-hidden`}>
          {s("arabic") && (
            <span
              aria-hidden
              className="watermark-breathe pointer-events-none absolute left-1/2 top-[52%] font-arabic select-none"
              style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: "min(48vw,640px)", lineHeight: 1, color: "var(--heart)", opacity: 0.07, whiteSpace: "nowrap" }}
            >
              {s("arabic")}
            </span>
          )}
          <div className="container-wide relative z-10 flex flex-col items-center justify-center py-28 text-center md:py-40">
            {s("eyebrow") && <p className="eyebrow mb-4">{s("eyebrow")}</p>}
            {s("arabic") && (
              <p className="font-arabic text-2xl md:text-3xl" style={{ color: "var(--heart)" }} dir="rtl">{s("arabic")}</p>
            )}
            <h1 className="mt-4 font-display text-[3rem] leading-[1.02] tracking-tight md:text-[5.5rem] md:leading-[0.98]">
              {s("title_line1")}
              {s("title_line2") && <><br className="hidden md:block" /> {s("title_line2")}</>}
            </h1>
            {s("description") && (
              <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">{s("description")}</p>
            )}
            {(s("cta_primary_label") || s("cta_secondary_label")) && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                {s("cta_primary_label") && (
                  <a href={s("cta_primary_href", "#")} className="btn-primary">
                    {s("cta_primary_label")} <ArrowRight className="h-4 w-4" />
                  </a>
                )}
                {s("cta_secondary_label") && (
                  <a href={s("cta_secondary_href", "#")} className="btn-ghost">{s("cta_secondary_label")}</a>
                )}
              </div>
            )}
          </div>
        </section>
      );
    }

    case "section_header": {
      const align = s("align", "left");
      return (
        <section className="container-wide py-10 md:py-16">
          <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
            {s("eyebrow") && <p className="eyebrow">{s("eyebrow")}</p>}
            <h2 className="mt-3 text-4xl md:text-5xl">{s("title")}</h2>
            {s("description") && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{s("description")}</p>}
          </div>
        </section>
      );
    }

    case "heading": {
      const level = Math.min(4, Math.max(1, n("level", 2)));
      const size = level === 1 ? "text-5xl md:text-6xl" : level === 2 ? "text-4xl md:text-5xl" : level === 3 ? "text-2xl md:text-3xl" : "text-xl";
      const text = s("text");
      return (
        <section className="container-wide py-4">
          {level === 1 ? <h1 className={size}>{text}</h1>
            : level === 2 ? <h2 className={size}>{text}</h2>
            : level === 3 ? <h3 className={size}>{text}</h3>
            : <h4 className={size}>{text}</h4>}
        </section>
      );
    }

    case "paragraph":
      return (
        <section className="container-wide py-3">
          <p className="mx-auto max-w-3xl text-[1.05rem] leading-relaxed text-muted-foreground md:text-lg">{s("text")}</p>
        </section>
      );

    case "rich_text": {
      const paras = Array.isArray(p.paragraphs) ? (p.paragraphs as string[]) : [];
      return (
        <section className="container-wide py-10 md:py-16">
          <div className="mx-auto max-w-3xl space-y-8 font-display text-xl leading-relaxed md:text-2xl" style={{ fontVariationSettings: '"SOFT" 60, "WONK" 1', color: "var(--ink)" }}>
            {paras.map((para, i) => <p key={i}>{para}</p>)}
          </div>
        </section>
      );
    }

    case "image": {
      if (!s("url")) return <PlaceholderBlock label="Image (no URL set)" />;
      return (
        <section className="container-wide py-8">
          <figure className="mx-auto" style={{ maxWidth: `${n("max_width", 960)}px` }}>
            <img src={s("url")} alt={s("alt")} className="w-full rounded-2xl border border-border" />
            {s("caption") && <figcaption className="mt-3 text-center text-sm text-muted-foreground">{s("caption")}</figcaption>}
          </figure>
        </section>
      );
    }

    case "image_text_split": {
      const side = s("image_side", "left");
      const imageEl = (
        <div className="overflow-hidden rounded-3xl border border-border bg-secondary">
          {s("image_url") ? (
            <img src={s("image_url")} alt={s("alt")} className="h-full w-full object-cover" />
          ) : (
            <div className="grid aspect-video place-items-center text-sm text-muted-foreground">Image</div>
          )}
        </div>
      );
      const textEl = (
        <div>
          {s("eyebrow") && <p className="eyebrow">{s("eyebrow")}</p>}
          <h3 className="mt-3 text-3xl md:text-4xl">{s("title")}</h3>
          {s("body") && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{s("body")}</p>}
          {s("cta_label") && (
            <a href={s("cta_href", "#")} className="btn-primary mt-6 inline-flex">{s("cta_label")} <ArrowRight className="h-4 w-4" /></a>
          )}
        </div>
      );
      return (
        <section className="container-wide py-16 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            {side === "right" ? <>{textEl}{imageEl}</> : <>{imageEl}{textEl}</>}
          </div>
        </section>
      );
    }

    case "feature_grid": {
      const cols = Math.min(4, Math.max(1, n("columns", 3)));
      const items = (Array.isArray(p.items) ? p.items : []) as { icon?: string; tag?: string; title: string; description: string }[];
      const gridCls = cols === 4 ? "md:grid-cols-2 lg:grid-cols-4" : cols === 3 ? "md:grid-cols-2 lg:grid-cols-3" : cols === 2 ? "md:grid-cols-2" : "";
      return (
        <section className="container-wide py-12 md:py-20">
          <div className={`grid gap-5 ${gridCls}`}>
            {items.map((it, i) => {
              const Icon = ICONS[it.icon ?? "sparkles"] ?? Sparkles;
              return (
                <div key={i} className="group relative flex flex-col gap-4 rounded-3xl border border-border bg-card p-7 transition-transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: "color-mix(in oklab, var(--gold-decorative) 22%, transparent)", color: "var(--gold)" }}>
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    {it.tag && <span className="eyebrow" style={{ color: "var(--gold)" }}>{it.tag}</span>}
                  </div>
                  <h3 className="text-xl leading-snug md:text-2xl">{it.title}</h3>
                  <p className="text-[0.95rem] leading-relaxed text-muted-foreground">{it.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    case "pillar_cards":
      return <PillarCardsBlock eyebrow={s("eyebrow")} title={s("title")} description={s("description")} />;

    case "cta_banner": {
      const tint = s("tint", "heart");
      const bg = tint === "gold" ? "color-mix(in oklab, var(--gold-decorative) 22%, var(--paper-warm))" : "color-mix(in oklab, var(--heart-soft) 30%, var(--paper-warm))";
      return (
        <section className="container-wide py-10">
          <div className="rounded-3xl p-10 md:p-14" style={{ background: bg }}>
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="max-w-xl">
                <h3 className="text-3xl md:text-4xl">{s("title")}</h3>
                {s("description") && <p className="mt-3 text-muted-foreground">{s("description")}</p>}
              </div>
              {s("cta_label") && (
                <a href={s("cta_href", "#")} className="btn-primary">{s("cta_label")} <ArrowRight className="h-4 w-4" /></a>
              )}
            </div>
          </div>
        </section>
      );
    }

    case "stat_row": {
      const items = (Array.isArray(p.items) ? p.items : []) as { value: string; label: string }[];
      return (
        <section className="container-wide py-14">
          <div className="grid gap-6 rounded-3xl border border-border bg-card p-8 md:grid-cols-4">
            {items.map((it, i) => (
              <div key={i} className="text-center">
                <p className="font-display text-4xl md:text-5xl" style={{ color: "var(--heart)" }}>{it.value}</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">{it.label}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "testimonials_row":
      return <TestimonialsBlock eyebrow={s("eyebrow")} title={s("title")} />;

    case "latest_articles":
      return <LatestArticlesBlock eyebrow={s("eyebrow")} title={s("title")} pillar={s("pillar")} count={n("count", 3)} />;

    case "reflection_spotlight":
      return (
        <section className="container-wide py-16 md:py-24">
          <ReflectionOfTheDay />
        </section>
      );

    case "newsletter": {
      const nlId = (p.newsletterId as string) || undefined;
      return (
        <section className="container-wide py-14">
          <NewsletterSignup
            heading={s("heading") || undefined}
            description={s("description") || undefined}
            cta={s("cta") || undefined}
            newsletterId={nlId}
          />
        </section>
      );
    }

    case "hero_fullscreen":
      return <HiddenFrameBlock eyebrow={s("eyebrow")} title={s("title")} subtitle={s("subtitle")} watermark={s("arabic_watermark")} verse={s("arabic_verse")} />;

    case "hidden_frame":
      return <HiddenFrameBlock eyebrow={s("eyebrow")} title={s("title")} subtitle={s("subtitle")} watermark={s("arabic_watermark")} verse={s("arabic_verse")} />;

    case "explore_pages": {
      const items = (Array.isArray(p.items) ? p.items : []) as { label: string; href: string }[];
      return (
        <section className="container-wide pb-16">
          <nav aria-label="Explore" className="flex flex-wrap items-center justify-center gap-2">
            {items.map((l, i) => (
              <Link key={i} to={l.href} className="rounded-full border border-border bg-card/70 px-5 py-2 text-sm backdrop-blur transition-colors hover:border-heart hover:text-heart">
                {l.label}
              </Link>
            ))}
          </nav>
        </section>
      );
    }


    case "faq_accordion":
      return <FaqBlock pageKey={s("page_key")} items={(Array.isArray(p.items) ? p.items : []) as { question: string; answer: string }[]} />;

    case "founder_letter": {
      const tint = (s("tint", "heart")) as "heart" | "tazkiyah" | "heart-soft" | "gold";
      return (
        <section className="container-wide py-12 md:py-20">
          <div className="mb-10 max-w-xl">
            {s("eyebrow") && <p className="eyebrow">{s("eyebrow")}</p>}
            {s("title") && <h2 className="mt-3 text-4xl md:text-5xl">{s("title")}</h2>}
          </div>
          <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-3xl border border-border bg-card p-8 md:flex-row md:items-start">
            <LetterMark letter={s("letter", "ف")} tint={tint} size={80} />
            <div>
              <h3 className="text-2xl">{s("name")}</h3>
              {s("role") && <p className="mt-1 text-sm font-semibold text-muted-foreground">{s("role")}</p>}
              {s("bio") && <p className="mt-4 text-[1.02rem] leading-relaxed text-muted-foreground">{s("bio")}</p>}
            </div>
          </div>
        </section>
      );
    }

    case "arabic_verse":
      return (
        <section className="container-wide py-14">
          <figure className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-8 text-center">
            <p className="font-arabic text-3xl leading-[1.9] md:text-4xl" dir="rtl" style={{ color: "var(--heart)" }}>{s("arabic")}</p>
            {s("translation") && (
              <blockquote className="mt-6 font-display text-lg italic leading-relaxed text-muted-foreground md:text-xl">"{s("translation")}"</blockquote>
            )}
            {s("reference") && <figcaption className="mt-4 text-sm font-semibold text-muted-foreground">— {s("reference")}</figcaption>}
          </figure>
        </section>
      );

    case "divider":
      return (
        <section className="container-wide py-8">
          <div className="h-px w-full" style={{ background: "var(--border)" }} />
        </section>
      );

    case "spacer": {
      const size = s("size", "md");
      const h = size === "sm" ? "h-8" : size === "lg" ? "h-32" : "h-16";
      return <div className={h} aria-hidden />;
    }

    default:
      return <PlaceholderBlock label={`Unknown block: ${block.type}`} />;
  }
}

function PlaceholderBlock({ label }: { label: string }) {
  return (
    <section className="container-wide py-8">
      <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center text-sm text-muted-foreground">{label}</div>
    </section>
  );
}

const TINTS = ["heart", "tazkiyah", "heart-soft", "gold"] as const;

function PillarCardsBlock({ eyebrow, title, description }: { eyebrow?: string; title?: string; description?: string }) {
  const pillars = usePillars();
  return (
    <section className="container-wide py-20 md:py-28">
      <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div className="max-w-xl">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          {title && <h2 className="mt-3 text-4xl md:text-5xl">{title}</h2>}
        </div>
        {description && <p className="max-w-md text-muted-foreground">{description}</p>}
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {pillars.map((p, idx) => {
          const tint = TINTS[idx % TINTS.length];
          return (
            <Link key={p.slug} to={p.href} className="card-soft group flex h-full flex-col justify-between !p-7">
              <div>
                <div className="flex items-center justify-between">
                  <LetterMark letter={p.arabic_letter} tint={tint} size={54} />
                  {p.coming_soon && (
                    <span className="rounded-pill px-3 py-1 text-[0.7rem] font-bold uppercase tracking-widest" style={{ background: "color-mix(in oklab, var(--gold-decorative) 20%, transparent)", color: "var(--gold)" }}>Coming soon</span>
                  )}
                </div>
                <h3 className="mt-6 text-2xl leading-tight">{p.label}</h3>
                <p className="mt-3 text-[0.98rem] leading-relaxed text-muted-foreground">{p.description}</p>
              </div>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold" style={{ color: "var(--heart)" }}>Explore <ArrowRight className="h-3.5 w-3.5" /></span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function TestimonialsBlock({ eyebrow, title }: { eyebrow?: string; title?: string }) {
  const { data = [] } = useQuery(testimonialsQuery());
  if (data.length === 0) return null;
  return (
    <section className="container-wide py-16 md:py-24">
      <div className="mb-10 max-w-xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        {title && <h2 className="mt-3 text-4xl md:text-5xl">{title}</h2>}
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {data.map((t) => (
          <figure key={t.id} className="rounded-3xl border border-border bg-card p-7">
            <blockquote className="font-display text-xl leading-snug" style={{ fontVariationSettings: '"SOFT" 80, "WONK" 1' }}>"{t.quote}"</blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full font-arabic" style={{ background: "color-mix(in oklab, var(--tazkiyah-soft) 60%, transparent)", color: "var(--tazkiyah)" }}>ق</span>
              <span className="text-sm font-semibold">{t.name}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function LatestArticlesBlock({ eyebrow, title, pillar, count }: { eyebrow?: string; title?: string; pillar?: string; count: number }) {
  const { data = [] } = useSuspenseQuery(articlesQuery());
  const items = (pillar ? data.filter((c) => c.pillar === pillar) : data).slice(0, Math.max(1, count));
  if (items.length === 0) return null;
  return (
    <section className="container-wide py-14 md:py-20">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          {title && <h2 className="mt-3 text-4xl md:text-5xl">{title}</h2>}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((it) => <ContentCard key={it.slug} item={it} />)}
      </div>
    </section>
  );
}

function FaqBlock({ pageKey, items }: { pageKey?: string; items: { question: string; answer: string }[] }) {
  const { data = [] } = useQuery({ ...faqsQuery(pageKey || "__none__"), enabled: !!pageKey });
  const list = pageKey ? data.map((r) => ({ question: r.question, answer: r.answer })) : items;
  if (list.length === 0) return null;
  return (
    <section className="container-wide py-14">
      <div className="mx-auto max-w-3xl space-y-4">
        {list.map((f, i) => (
          <details key={i} className="group rounded-2xl border border-border bg-card p-6">
            <summary className="cursor-pointer list-none text-lg font-bold">{f.question}</summary>
            <p className="mt-3 text-muted-foreground">{f.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function HiddenFrameBlock({ eyebrow, title, subtitle, watermark, verse }: { eyebrow?: string; title?: string; subtitle?: string; watermark?: string; verse?: string }) {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, color-mix(in oklab, var(--heart) 55%, transparent) 0, transparent 42%),
            radial-gradient(circle at 82% 68%, color-mix(in oklab, var(--gold) 45%, transparent) 0, transparent 45%),
            url("data:image/svg+xml;utf8,${encodeURIComponent(
              `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g fill='none' stroke='#B4463D' stroke-width='0.9' opacity='0.9'><circle cx='80' cy='80' r='40'/><circle cx='80' cy='80' r='28' stroke='#D4AF37'/><polygon points='80,32 116,64 116,96 80,128 44,96 44,64'/><polygon points='80,44 106,68 106,92 80,116 54,92 54,68' stroke='#D4AF37'/><polygon points='80,56 96,72 96,88 80,104 64,88 64,72'/><path d='M0 80 L160 80 M80 0 L80 160 M20 20 L140 140 M140 20 L20 140' stroke-opacity='0.35'/></g></svg>`,
            )}")`,
          backgroundRepeat: "no-repeat, no-repeat, repeat",
          backgroundSize: "auto, auto, 200px 200px",
          backgroundPosition: "center, center, center",
        }}
      />
      {watermark && (
        <span
          aria-hidden
          className="watermark-breathe pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-arabic text-[24vw] leading-none"
          style={{ color: "color-mix(in oklab, var(--heart) 12%, transparent)" }}
          dir="rtl"
        >
          {watermark}
        </span>
      )}
      <div className="container-wide relative z-10 flex min-h-[70svh] flex-col items-center justify-center py-24 text-center">
        {eyebrow && <p className="eyebrow mb-6" style={{ color: "var(--heart)" }}>{eyebrow}</p>}
        {title && (
          <h1 className="mx-auto max-w-3xl text-6xl leading-[1.02] md:text-8xl" style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1', color: "var(--ink)" }}>
            {title}
          </h1>
        )}
        {subtitle && <p className="mx-auto mt-8 max-w-xl text-lg text-muted-foreground md:text-xl">{subtitle}</p>}
        {verse && (
          <p className="mt-10 font-arabic text-2xl" dir="rtl" style={{ color: "color-mix(in oklab, var(--heart) 70%, transparent)" }}>{verse}</p>
        )}
      </div>
    </section>
  );
}

// -------- Helpers --------

export function isBlockArray(v: unknown): v is Block[] {
  return Array.isArray(v) && v.every((x) => x && typeof x === "object" && "type" in (x as object) && "id" in (x as object));
}

export function readBlocks(content: Record<string, unknown> | null | undefined): Block[] {
  const raw = content?.blocks;
  return isBlockArray(raw) ? raw : [];
}
