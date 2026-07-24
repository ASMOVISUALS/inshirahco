import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { articlesQuery, testimonialsQuery, pageQuery } from "@/lib/queries";
import { ContentCard } from "@/components/ContentCard";
import { LetterMark } from "@/components/LetterMark";
import { MediaCarousel } from "@/components/MediaCarousel";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { ReflectionOfTheDay } from "@/components/ReflectionOfTheDay";
import { usePillars } from "@/hooks/use-cms";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Inshirah — Islamic psychology, for the world of good" },
      { name: "description", content: "A quiet publication of Qur'anic reflections, tazkiyah practices, and youth-facing writing on the slow work of the heart." },
      { property: "og:title", content: "Inshirah — Islamic psychology, for the world of good" },
      { property: "og:description", content: "Qur'anic reflections, tazkiyah practices, and honest writing on the slow work of the heart." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(articlesQuery());
    context.queryClient.ensureQueryData(testimonialsQuery());
    context.queryClient.ensureQueryData(pageQuery("home"));
  },
  component: Home,
});

const TINTS = ["heart", "tazkiyah", "heart-soft", "gold"] as const;

function Home() {
  const { data: content } = useSuspenseQuery(articlesQuery());
  const { data: testimonials } = useSuspenseQuery(testimonialsQuery());
  const { data: page = {} } = useQuery(pageQuery("home"));
  const pillars = usePillars();
  const latest = content.slice(0, 3);
  const media = content.filter((c) => c.type === "video" || c.type === "podcast" || c.type === "tadabbur");

  const s = (k: string, fallback = "") => (page[k] as string) ?? fallback;

  return (
    <>
      <section className="hero-radial relative overflow-hidden">
        <span
          aria-hidden
          className="watermark-breathe pointer-events-none absolute left-1/2 top-[52%] font-arabic select-none"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "min(48vw, 640px)",
            lineHeight: 1,
            color: "var(--heart)",
            opacity: 0.07,
            whiteSpace: "nowrap",
          }}
        >
          {s("hero_arabic", "انشراح")}
        </span>

        <div className="container-wide relative z-10 flex flex-col items-center justify-center py-28 text-center md:py-40">
          <p className="font-arabic text-2xl md:text-3xl" style={{ color: "var(--heart)" }} dir="rtl">
            {s("hero_arabic", "انشراح")}
          </p>
          <h1 className="mt-4 font-display text-[3rem] leading-[1.02] tracking-tight md:text-[5.5rem] md:leading-[0.98]">
            {s("hero_title_line1", "an expansion")}<br className="hidden md:block" /> {s("hero_title_line2", "of the chest.")}
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            {s("hero_description", "Slow writing on Qur'anic reflection, tazkiyah, and the quiet architecture of a life lived in remembrance.")}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a href={s("hero_cta_primary_href", "/quranic-reflections")} className="btn-primary">
              {s("hero_cta_primary_label", "Start reading")} <ArrowRight className="h-4 w-4" />
            </a>
            <a href={s("hero_cta_secondary_href", "/about")} className="btn-ghost">{s("hero_cta_secondary_label", "Our story")}</a>
          </div>
        </div>
      </section>

      <section className="container-wide py-20 md:py-28">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="eyebrow">{s("pillars_eyebrow", "Four rooms in one house")}</p>
            <h2 className="mt-3 text-4xl md:text-5xl">{s("pillars_title", "Where to begin")}</h2>
          </div>
          <p className="max-w-md text-muted-foreground">
            {s("pillars_description", "Inshirah is organized around four quiet pillars. Wander freely — there is no wrong door to enter through.")}
          </p>
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
                      <span className="rounded-pill px-3 py-1 text-[0.7rem] font-bold uppercase tracking-widest" style={{ background: "color-mix(in oklab, var(--gold-decorative) 20%, transparent)", color: "var(--gold)" }}>
                        Coming soon
                      </span>
                    )}
                  </div>
                  <h3 className="mt-6 text-2xl leading-tight">{p.label}</h3>
                  <p className="mt-3 text-[0.98rem] leading-relaxed text-muted-foreground">{p.description}</p>
                </div>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold transition-colors group-hover:text-heart" style={{ color: "var(--heart)" }}>
                  Explore <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container-wide py-8 md:py-16">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{s("latest_eyebrow", "Latest writing")}</p>
            <h2 className="mt-3 text-4xl md:text-5xl">{s("latest_title", "Recently, from us to you")}</h2>
          </div>
          <Link to="/resources" className="hidden text-sm font-bold hover:underline md:inline-flex items-center gap-1" style={{ color: "var(--heart)" }}>
            All writing <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {latest.map((item) => (
            <ContentCard key={item.slug} item={item} />
          ))}
        </div>
      </section>

      <section className="container-wide py-16 md:py-24">
        <ReflectionOfTheDay />
      </section>

      {media.length > 0 && (
        <section className="container-wide py-8 md:py-16">
          <div className="mb-8">
            <p className="eyebrow">{s("media_eyebrow", "Listen & watch")}</p>
            <h2 className="mt-3 text-4xl md:text-5xl">{s("media_title", "Voices from the project")}</h2>
          </div>
          <MediaCarousel items={media} />
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="container-wide py-16 md:py-24">
          <div className="mb-10 max-w-xl">
            <p className="eyebrow">{s("testimonials_eyebrow", "Community voices")}</p>
            <h2 className="mt-3 text-4xl md:text-5xl">{s("testimonials_title", "Notes from readers")}</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.id} className="rounded-3xl border border-border bg-card p-7">
                <blockquote className="font-display text-xl leading-snug" style={{ fontVariationSettings: '"SOFT" 80, "WONK" 1' }}>
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full font-arabic" style={{ background: "color-mix(in oklab, var(--tazkiyah-soft) 60%, transparent)", color: "var(--tazkiyah)" }}>ق</span>
                  <span className="text-sm font-semibold">{t.name}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="container-wide pb-24">
        <NewsletterSignup />
      </section>
    </>
  );
}
