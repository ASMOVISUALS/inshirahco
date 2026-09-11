import { useMemo, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Compass, Users, Mountain, Sparkles, BookOpen, Calendar, Heart, Star, Quote, Feather, Instagram, Youtube, Twitter, Mail, Linkedin, Facebook } from "lucide-react";
import { articlesQuery, testimonialsQuery, faqsQuery, publicSeriesQuery } from "@/lib/queries";
import { usePillars } from "@/hooks/use-cms";
import { LetterMark } from "@/components/LetterMark";
import { ContentCard } from "@/components/ContentCard";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { VerseOfTheWeek } from "@/components/VerseOfTheWeek";
import { TemplateVarsProvider, substituteVars, useTemplateVars, type TemplateVars } from "@/lib/template-vars";
import { quoteTintStyle } from "@/lib/quote-tint";


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
  | "spacer"
  | "pillar_hero"
  | "pillar_articles"
  | "pillar_series"
  | "previews_grid"
  | "mentors_row"
  | "contact_form"
  | "footer_brand"
  | "footer_description"
  | "footer_heading"
  | "footer_link"
  | "footer_text"
  | "footer_copyright"
  | "footer_newsletter"
  | "footer_socials"
  | "footer_columns"
  | "footer_row";


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
      { type: "reflection_spotlight", label: "Verse of the week" },
      { type: "faq_accordion", label: "FAQ list" },
      { type: "newsletter", label: "Newsletter signup" },
    ],
  },
  { key: "media", label: "Media", items: [{ type: "image", label: "Image" }] },
  {
    key: "pillar",
    label: "Pillar",
    items: [
      { type: "pillar_hero", label: "Pillar hero (auto)", description: "Reads the current pillar" },
      { type: "pillar_articles", label: "Pillar articles (auto)" },
      { type: "pillar_series", label: "Pillar series (auto)" },
      { type: "previews_grid", label: "Previews / what's coming" },
      { type: "mentors_row", label: "Mentors row" },
    ],
  },
  {
    key: "utility",
    label: "Utility",
    items: [
      { type: "contact_form", label: "Contact form" },
    ],
  },
  {
    key: "footer",
    label: "Footer",
    items: [
      { type: "footer_columns", label: "Columns maker", description: "Split into columns" },
      { type: "footer_row", label: "Rows maker", description: "Lay blocks side by side" },
      { type: "footer_brand", label: "Inshirah title", description: "Wordmark + Arabic" },
      { type: "footer_description", label: "Description box" },
      { type: "footer_heading", label: "Yellow title" },
      { type: "footer_link", label: "Text hyperlink" },
      { type: "footer_text", label: "Normal text" },
      { type: "footer_copyright", label: "Copyright block" },
      { type: "footer_newsletter", label: "Email / newsletter block" },
      { type: "footer_socials", label: "Social media icons" },
    ],
  },
];

/** Blocks that hold other blocks in props.children. */
export const CONTAINER_TYPES: BlockType[] = ["footer_columns", "footer_row"];

export const BLOCK_LABEL: Record<BlockType, string> = Object.fromEntries(
  BLOCK_CATEGORIES.flatMap((c) => c.items.map((i) => [i.type, i.label] as const))
) as Record<BlockType, string>;

export function blockChildren(b: Block): Block[] {
  const raw = (b.props as Record<string, unknown>).children;
  return isBlockArray(raw) ? (raw as Block[]) : [];
}

const ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  compass: Compass, users: Users, mountain: Mountain, sparkles: Sparkles,
  book: BookOpen, calendar: Calendar, heart: Heart, star: Star, quote: Quote, feather: Feather,
};

const FOOT_SOFT = "color-mix(in oklab, var(--paper) 78%, transparent)";
const FOOT_FAINT = "color-mix(in oklab, var(--paper) 60%, transparent)";

function themeAwareOpacity(base: number): { light: number; dark: number } {
  const dark = Math.max(0, Math.min(100, base)) / 100;
  const light = Math.min(dark * 1.6, 0.22);
  return { light, dark };
}

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>> = {
  instagram: Instagram, youtube: Youtube, twitter: Twitter, mail: Mail, linkedin: Linkedin, facebook: Facebook,
};


export function newBlock(type: BlockType): Block {
  const id = crypto.randomUUID();
  const defaults: Record<BlockType, Record<string, unknown>> = {
    hero: {
      eyebrow: "", arabic: "انشراح",
      title_line1: "A new page",
      title_line2: "written slowly.",
      description: "A short line that sets the mood, no more.",
      cta_primary_label: "Start reading", cta_primary_href: "/",
      cta_secondary_label: "Our story", cta_secondary_href: "/about",
      background: "radial",
      graphic: "none",
      graphic_opacity: 8,
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
      background: "radial",
      graphic: "girih",
      graphic_opacity: 8,
      height: "full",
      show_newsletter: "no",
      newsletter_heading: "Be there when it opens",
      newsletter_description: "Leave your email and we'll write to you the day it goes live.",
      newsletter_cta: "Keep me posted",
      newsletterId: "",
    },
    hidden_frame: {
      eyebrow: "{{page_name}}",
      title: "This page is hidden.",
      subtitle: "Come back soon — but feel free to explore other pages below.",
      arabic_watermark: "سِرّ",
      arabic_verse: "إن مع العسر يسرا",
      background: "radial",
      graphic: "girih",
      graphic_opacity: 8,
      height: "full",
      show_newsletter: "no",
      newsletter_heading: "Be there when it opens",
      newsletter_description: "Leave your email and we'll write to you the day it goes live.",
      newsletter_cta: "Keep me posted",
      newsletterId: "",
    },
    explore_pages: {
      items: [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
      ],
    },
    faq_accordion: { page_key: "", items: [] },
    founder_letter: { eyebrow: "Behind the words", title: "The founder", letter: "ف", name: "Founder", role: "", bio: "", tint: "heart" },
    arabic_verse: { arabic: "", translation: "", reference: "", tint: "tazkiyah" },
    divider: {},
    spacer: { size: "md" },
    pillar_hero: { eyebrow: "", badge: "" },
    pillar_articles: { eyebrow: "Latest writing", title: "From this pillar", count: 24 },
    pillar_series: { title: "Series in this pillar", count: 12 },
    previews_grid: {
      eyebrow: "What to look forward to",
      title: "The shape of what's coming",
      description: "",
      items: [
        { icon: "users", tag: "Cohorts", title: "Mentor-led courses", description: "Small cohorts walking through purpose and direction." },
        { icon: "mountain", tag: "Retreats", title: "In-person retreats", description: "Days away from the noise — reflection and quiet planning." },
        { icon: "calendar", tag: "Gatherings", title: "Exclusive events", description: "Intimate salons and dinners with scholars and practitioners." },
      ],
    },
    mentors_row: {
      title: "The Mentors",
      description: "Meet your mentors and advisors.",
      items: [
        { name: "Mentor 1", title: "Scholar & Educator", role: "Lead Mentor", qualification: "PhD, Islamic Studies", image: "" },
      ],
    },
    contact_form: {
      success_arabic: "شكرًا",
      success_title: "Your note reached us.",
      success_description: "We read every message. Please be patient — we reply as we can.",
      support_title: "Support this project",
      support_body: "Inshirah is freely offered. If it has served you, consider supporting the work.",
      support_footnote: "",
    },
    footer_brand: { title: "inshirah", arabic: "انشراح" },
    footer_description: { text: "Islamic psychology, for the world of good." },
    footer_heading: { text: "Read" },
    footer_link: { label: "About", href: "/about" },
    footer_text: { text: "A line of small print.", size: "sm" },
    footer_copyright: { owner: "Inshirah", note: "A passion project, offered freely.", lines: ["Built by ASMO Visuals", "inshirah.co"] },
    footer_newsletter: { heading: "A gentle letter, now and then", description: "", cta: "Subscribe", newsletterId: "" },
    footer_socials: {
      items: [
        { label: "Instagram", href: "#", icon: "instagram" },
        { label: "YouTube", href: "#", icon: "youtube" },
      ],
    },
    footer_columns: { columns: 4, gap: "lg", children: [] },
    footer_row: { direction: "row", align: "start", gap: "md", children: [] },
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
      const bgMode = s("background", "radial");
      const bg = bgMode === "plain" ? "" : bgMode === "soft" ? "hero-soft" : "hero-radial";
      const heroGraphic = s("graphic", "none") === "girih" ? "girih-backdrop" : "";
      const { light: lightOpacity, dark: darkOpacity } = themeAwareOpacity(n("graphic_opacity", 8));
      return (
        <section
          className={`${bg} ${heroGraphic} relative isolate overflow-hidden`}
          style={{ ["--girih-opacity" as string]: String(lightOpacity), ["--girih-opacity-dark" as string]: String(darkOpacity) }}
        >
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
          <VerseOfTheWeek />
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
    case "hidden_frame":
      return (
        <HiddenFrameBlock
          eyebrow={s("eyebrow")}
          title={s("title")}
          subtitle={s("subtitle")}
          watermark={s("arabic_watermark")}
          verse={s("arabic_verse")}
          background={s("background", "radial")}
          graphic={s("graphic", "girih")}
          graphicOpacity={n("graphic_opacity", 8)}
          height={s("height", "full")}
          newsletter={s("show_newsletter", "no") === "yes"}
          newsletterHeading={s("newsletter_heading")}
          newsletterDescription={s("newsletter_description")}
          newsletterCta={s("newsletter_cta")}
          newsletterId={(p.newsletterId as string) || undefined}
        />
      );

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
          <figure className="mx-auto max-w-3xl rounded-3xl border-l-4 p-8 text-center" style={quoteTintStyle(s("tint", "tazkiyah"))}>
            <p className="font-arabic text-3xl leading-[1.9] md:text-4xl" dir="rtl" style={{ color: "var(--ink)" }}>{s("arabic")}</p>
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

    case "pillar_hero":
      return <PillarHeroBlock eyebrow={s("eyebrow")} badge={s("badge")} />;

    case "pillar_articles":
      return <PillarArticlesBlock eyebrow={s("eyebrow")} title={s("title")} count={n("count", 24)} />;

    case "pillar_series":
      return <PillarSeriesBlock title={s("title")} count={n("count", 12)} />;

    case "previews_grid":
      return <PreviewsGridBlock eyebrow={s("eyebrow")} title={s("title")} description={s("description")} items={(Array.isArray(p.items) ? p.items : []) as { icon?: string; tag?: string; title: string; description: string }[]} />;

    case "mentors_row":
      return <MentorsRowBlock title={s("title")} description={s("description")} items={(Array.isArray(p.items) ? p.items : []) as { name: string; title?: string; role?: string; qualification?: string; image?: string }[]} />;

    case "contact_form":
      return <ContactFormBlock successArabic={s("success_arabic")} successTitle={s("success_title")} successDescription={s("success_description")} supportTitle={s("support_title")} supportBody={s("support_body")} supportFootnote={s("support_footnote")} />;

    // ---- Footer blocks ----

    case "footer_brand":
      return (
        <div className="flex items-baseline gap-3">
          <span className="font-display text-3xl" style={{ color: "var(--paper)", fontVariationSettings: '"SOFT" 80, "WONK" 1' }}>{s("title")}</span>
          {s("arabic") && <span className="font-arabic text-3xl" style={{ color: "var(--gold-decorative)" }} dir="rtl">{s("arabic")}</span>}
        </div>
      );

    case "footer_description":
      return <p className="mt-4 max-w-md text-[1.05rem] leading-relaxed" style={{ color: FOOT_SOFT }}>{s("text")}</p>;

    case "footer_heading":
      return (
        <h4
          className="mb-4 text-sm font-bold uppercase"
          style={{ color: "var(--gold-decorative)", fontFamily: "var(--font-sans)", letterSpacing: "0.16em" }}
        >
          {s("text")}
        </h4>
      );

    case "footer_link":
      return (
        <a href={s("href", "#")} className="block py-1 text-[0.95rem] transition-colors hover:text-white" style={{ color: FOOT_SOFT }}>
          {s("label")}
        </a>
      );

    case "footer_text": {
      const size = s("size", "sm") === "base" ? "text-[0.95rem]" : "text-sm";
      return <p className={`${size} leading-relaxed`} style={{ color: FOOT_FAINT }}>{s("text")}</p>;
    }

    case "footer_copyright": {
      const lines = (Array.isArray(p.lines) ? p.lines : []) as string[];
      return (
        <div>
          <p className="text-sm" style={{ color: FOOT_FAINT }}>
            © {new Date().getFullYear()} {s("owner")}{s("note") ? `. ${s("note")}` : ""}
          </p>
          {lines.map((l, i) => (
            <p key={i} className="mt-2 text-sm" style={{ color: FOOT_FAINT }}>{l}</p>
          ))}
        </div>
      );
    }

    case "footer_newsletter":
      return (
        <NewsletterSignup
          variant="dark"
          heading={s("heading") || undefined}
          description={s("description") || undefined}
          cta={s("cta") || undefined}
          newsletterId={(p.newsletterId as string) || undefined}
        />
      );

    case "footer_socials": {
      const items = (Array.isArray(p.items) ? p.items : []) as { label?: string; href?: string; icon?: string }[];
      return (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {items.map((it, i) => {
            const Icon = SOCIAL_ICONS[(it.icon ?? "instagram").toLowerCase()] ?? Instagram;
            return (
              <a
                key={i}
                href={it.href || "#"}
                aria-label={it.label || "Social link"}
                className="grid h-11 w-11 place-items-center rounded-full border transition-colors hover:bg-white/10"
                style={{ borderColor: "color-mix(in oklab, var(--paper) 25%, transparent)" }}
              >
                <Icon className="h-4 w-4" strokeWidth={1.6} style={{ color: "var(--paper)" }} />
              </a>
            );
          })}
        </div>
      );
    }

    case "footer_columns": {
      const cols = Math.min(6, Math.max(1, n("columns", 4)));
      const gap = s("gap", "lg") === "sm" ? "1rem" : s("gap", "lg") === "md" ? "2rem" : "3rem";
      const kids = blockChildren(block);
      if (kids.length === 0) return <PlaceholderBlock label="Columns (empty — add blocks inside)" />;
      return (
        <div
          className="grid"
          style={{ gap, gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${Math.floor(1100 / cols)}px), 1fr))` }}
        >
          {kids.map((c) => (
            <div key={c.id}><RenderBlock block={c} /></div>
          ))}
        </div>
      );
    }

    case "footer_row": {
      const gap = s("gap", "md") === "sm" ? "0.5rem" : s("gap", "md") === "lg" ? "2rem" : "1rem";
      const align = s("align", "start");
      const column = s("direction", "row") === "column";
      const kids = blockChildren(block);
      if (kids.length === 0) return <PlaceholderBlock label="Stack (empty — add blocks inside)" />;
      return (
        <div
          className={column ? "flex flex-col" : "flex flex-wrap"}
          style={{
            gap,
            alignItems: column
              ? (align === "center" ? "center" : align === "end" ? "flex-end" : "flex-start")
              : (align === "center" ? "center" : align === "end" ? "flex-end" : "flex-start"),
            justifyContent: align === "between" ? "space-between" : undefined,
          }}
        >
          {kids.map((c) => (
            <div key={c.id}><RenderBlock block={c} /></div>
          ))}
        </div>
      );
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

function HiddenFrameBlock({
  eyebrow, title, subtitle, watermark, verse,
  background = "radial", graphic = "girih", graphicOpacity = 15, height = "full",
  newsletter, newsletterHeading, newsletterDescription, newsletterCta, newsletterId,
}: {
  eyebrow?: string; title?: string; subtitle?: string; watermark?: string; verse?: string;
  background?: string; graphic?: string; graphicOpacity?: number; height?: string;
  newsletter?: boolean; newsletterHeading?: string; newsletterDescription?: string; newsletterCta?: string; newsletterId?: string;
}) {
  const minH = height === "screen" ? "min-h-screen" : height === "full" ? "min-h-[92svh]" : height === "short" ? "min-h-[52svh]" : "min-h-[70svh]";
  const bgClass = background === "plain" ? "" : background === "soft" ? "hero-soft" : "hero-radial";
  const { light: lightOpacity, dark: darkOpacity } = themeAwareOpacity(graphicOpacity ?? 8);
  return (
    <section
      className={`relative isolate overflow-hidden ${bgClass} ${graphic === "girih" ? "girih-backdrop" : ""}`}
      style={{ ["--girih-opacity" as string]: String(lightOpacity), ["--girih-opacity-dark" as string]: String(darkOpacity) }}
    >
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
      <div className={`container-wide relative z-10 flex ${minH} flex-col items-center justify-center py-24 text-center`}>
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
        {newsletter && (
          <div className="mt-12 w-full max-w-2xl text-left">
            <NewsletterSignup
              heading={newsletterHeading || undefined}
              description={newsletterDescription || undefined}
              cta={newsletterCta || undefined}
              newsletterId={newsletterId}
            />
          </div>
        )}
      </div>
    </section>
  );
}

// -------- Pillar-aware blocks --------

function useCurrentPillar() {
  const location = useLocation();
  const pillars = usePillars();
  const slug = location.pathname.split("/").filter(Boolean)[0] ?? "";
  return pillars.find((p) => p.slug === slug) ?? null;
}

function PillarHeroBlock({ eyebrow, badge }: { eyebrow?: string; badge?: string }) {
  const pillar = useCurrentPillar();
  if (!pillar) return <PlaceholderBlock label="Pillar hero (only renders on a pillar page)" />;
  const tint = (pillar.tint || "heart") as "heart" | "tazkiyah" | "heart-soft" | "gold";
  return (
    <section className="hero-radial">
      <div className="container-wide py-24 md:py-32">
        <div className="flex flex-col items-start gap-6">
          {(badge || pillar.coming_soon) && (
            <span className="rounded-pill px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ background: "color-mix(in oklab, var(--gold-decorative) 22%, transparent)", color: "var(--gold)" }}>
              {badge || "Coming soon"}
            </span>
          )}
          <div className="flex items-start gap-5">
            <LetterMark letter={pillar.arabic_letter} tint={tint} size={72} />
            <div>
              {eyebrow && <p className="eyebrow">{eyebrow}</p>}
              <h1 className="mt-2 text-5xl leading-tight md:text-7xl">{pillar.label}</h1>
            </div>
          </div>
          {pillar.description && (
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">{pillar.description}</p>
          )}
        </div>
      </div>
    </section>
  );
}

function PillarArticlesBlock({ eyebrow, title, count }: { eyebrow?: string; title?: string; count: number }) {
  const pillar = useCurrentPillar();
  const { data = [] } = useSuspenseQuery(articlesQuery());
  const [tag, setTag] = useState<string>("all");
  const filtered = useMemo(() => {
    const scoped = pillar ? data.filter((c) => c.pillar === pillar.slug) : data;
    const tags = Array.from(new Set(scoped.flatMap((c) => c.tags))).sort();
    return { tags, items: tag === "all" ? scoped.slice(0, count) : scoped.filter((c) => c.tags.includes(tag)).slice(0, count) };
  }, [data, pillar, tag, count]);
  return (
    <section className="container-wide py-14 md:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          {title && <h2 className="mt-3 text-4xl md:text-5xl">{title}</h2>}
        </div>
      </div>
      {filtered.tags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button onClick={() => setTag("all")} className="rounded-pill border px-4 py-1.5 text-sm font-semibold" style={tag === "all" ? { background: "var(--heart)", color: "var(--primary-foreground)", borderColor: "var(--heart)" } : { borderColor: "var(--border)" }}>All</button>
          {filtered.tags.map((t) => (
            <button key={t} onClick={() => setTag(t)} className="rounded-pill border px-4 py-1.5 text-sm font-semibold" style={tag === t ? { background: "var(--heart)", color: "var(--primary-foreground)", borderColor: "var(--heart)" } : { borderColor: "var(--border)" }}>{t}</button>
          ))}
        </div>
      )}
      {filtered.items.length === 0 ? (
        <p className="rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground">Nothing here yet.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.items.map((it) => <ContentCard key={it.slug} item={it} />)}
        </div>
      )}
    </section>
  );
}

function PillarSeriesBlock({ title, count }: { title?: string; count: number }) {
  const pillar = useCurrentPillar();
  const { data = [] } = useQuery(publicSeriesQuery());
  const items = (pillar ? data.filter((s) => s.pillar === pillar.slug) : data).slice(0, Math.max(1, count));
  if (items.length === 0) return null;
  return (
    <section className="container-wide py-14 md:py-20">
      {title && <h2 className="mb-8 text-4xl md:text-5xl">{title}</h2>}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <article key={s.id} className="card-soft flex flex-col !p-7">
            <div className="flex items-center gap-3">
              <LetterMark letter={s.arabic_letter || "س"} tint={(s.tint || "heart") as "heart" | "tazkiyah" | "heart-soft" | "gold"} size={44} />
              <h3 className="text-2xl leading-tight">{s.title}</h3>
            </div>
            {s.description && <p className="mt-4 text-[0.98rem] leading-relaxed text-muted-foreground">{s.description}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}

function PreviewsGridBlock({ eyebrow, title, description, items }: { eyebrow?: string; title?: string; description?: string; items: { icon?: string; tag?: string; title: string; description: string }[] }) {
  return (
    <section className="container-wide py-16 md:py-24">
      <div className="mb-12 max-w-2xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        {title && <h2 className="mt-3 text-4xl md:text-5xl">{title}</h2>}
        {description && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((p, i) => {
          const Icon = ICONS[p.icon ?? "sparkles"] ?? Sparkles;
          return (
            <div key={i} className="group relative flex flex-col gap-4 rounded-3xl border border-border bg-card p-7 transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: "color-mix(in oklab, var(--gold-decorative) 22%, transparent)", color: "var(--gold)" }}>
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                {p.tag && <span className="eyebrow" style={{ color: "var(--gold)" }}>{p.tag}</span>}
              </div>
              <h3 className="text-xl leading-snug md:text-2xl">{p.title}</h3>
              <p className="text-[0.95rem] leading-relaxed text-muted-foreground">{p.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MentorsRowBlock({ title, description, items }: { title?: string; description?: string; items: { name: string; title?: string; role?: string; qualification?: string; image?: string }[] }) {
  if (items.length === 0) return null;
  return (
    <section className="container-wide pb-24 md:pb-32">
      <div className="mb-12 max-w-xl">
        {title && <h2 className="text-4xl md:text-5xl">{title}</h2>}
        {description && <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
        {items.map((m, i) => (
          <div key={i} className="flex flex-col items-center text-center">
            <div className="grid h-40 w-40 place-items-center overflow-hidden rounded-full ring-4 ring-[color:var(--paper-warm)]" style={{ background: "color-mix(in oklab, var(--gold-decorative) 22%, transparent)", color: "var(--gold)" }}>
              {m.image ? <img src={m.image} alt={m.name} className="h-full w-full object-cover" /> : <span className="font-arabic text-6xl">م</span>}
            </div>
            <h3 className="mt-6 text-2xl">{m.name}</h3>
            {m.title && <p className="mt-1.5 text-sm font-semibold uppercase tracking-widest text-muted-foreground">{m.title}</p>}
            {m.role && <p className="mt-1 text-sm text-muted-foreground">{m.role}</p>}
            {m.qualification && <p className="mt-1 text-sm italic text-muted-foreground">{m.qualification}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function ContactFormBlock({ successArabic, successTitle, successDescription, supportTitle, supportBody, supportFootnote }: { successArabic?: string; successTitle?: string; successDescription?: string; supportTitle?: string; supportBody?: string; supportFootnote?: string }) {
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!values.name.trim()) errs.name = "Please share your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errs.email = "Please enter a valid email.";
    if (values.message.trim().length < 5) errs.message = "A little more, please.";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setSent(true);
  };
  return (
    <section className="container-wide grid gap-8 py-14 md:grid-cols-[1.3fr_1fr]">
      <div className="rounded-3xl border border-border bg-card p-8 md:p-10">
        {sent ? (
          <div className="text-center">
            {successArabic && <p className="font-arabic text-5xl" style={{ color: "var(--heart)" }}>{successArabic}</p>}
            {successTitle && <h2 className="mt-4 text-3xl">{successTitle}</h2>}
            {successDescription && <p className="mt-3 text-muted-foreground">{successDescription}</p>}
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-5">
            <ContactField label="Your name" error={errors.name}>
              <input value={values.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-heart" required />
            </ContactField>
            <ContactField label="Email" error={errors.email}>
              <input type="email" value={values.email} onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))} className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-heart" required />
            </ContactField>
            <ContactField label="Message" error={errors.message}>
              <textarea value={values.message} onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))} rows={6} className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-heart" required />
            </ContactField>
            <button type="submit" className="btn-primary self-start">Send message</button>
          </form>
        )}
      </div>
      <aside className="rounded-3xl p-8 md:p-10" style={{ background: "color-mix(in oklab, var(--heart-soft) 30%, var(--paper-warm))" }}>
        <Heart className="h-8 w-8" strokeWidth={1.6} style={{ color: "var(--heart)" }} />
        {supportTitle && <h2 className="mt-4 text-3xl leading-tight">{supportTitle}</h2>}
        {supportBody && <p className="mt-3 text-[1rem] leading-relaxed" style={{ color: "var(--ink)" }}>{supportBody}</p>}
        {supportFootnote && <p className="mt-4 text-sm font-semibold text-muted-foreground">{supportFootnote}</p>}
      </aside>
    </section>
  );
}

function ContactField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-bold">{label}</span>
      {children}
      {error && <span className="text-sm" style={{ color: "var(--heart)" }}>{error}</span>}
    </label>
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
