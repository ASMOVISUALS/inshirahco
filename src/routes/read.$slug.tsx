import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { Bookmark, Copy, Check, Download } from "lucide-react";
import { PILLARS, type ContentItem } from "@/lib/content";
import { articleBySlugQuery, articlesQuery } from "@/lib/queries";
import { ContentCard } from "@/components/ContentCard";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { LetterMark } from "@/components/LetterMark";
import { useBookmarks } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { ArticleBodyView } from "@/lib/article-blocks";

export const Route = createFileRoute("/read/$slug")({
  ssr: false,
  loader: async ({ params, context }) => {
    const item = await context.queryClient.ensureQueryData(articleBySlugQuery(params.slug));
    if (!item) throw notFound();
    return { item };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Not found — Inshirah" }, { name: "robots", content: "noindex" }] };
    }
    const item = loaderData.item;
    const title = `${item.title} — Inshirah`;
    return {
      meta: [
        { title },
        { name: "description", content: item.description },
        { property: "og:title", content: title },
        { property: "og:description", content: item.description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/read/${item.slug}` },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: item.description },
      ],
      links: [{ rel: "canonical", href: `/read/${item.slug}` }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: item.title,
          description: item.description,
          datePublished: item.date,
          author: { "@type": "Person", name: item.author.name },
        }),
      }],
    };
  },
  component: Detail,
  notFoundComponent: () => (
    <div className="container-wide py-24 text-center">
      <h1 className="text-4xl">This piece isn't here</h1>
      <p className="mt-3 text-muted-foreground">It may have moved, or never quite existed.</p>
      <Link to="/" className="btn-primary mt-6">Back home</Link>
    </div>
  ),
  errorComponent: () => (
    <div className="container-wide py-24 text-center">
      <h1 className="text-4xl">Something went sideways</h1>
      <Link to="/" className="btn-primary mt-6">Back home</Link>
    </div>
  ),
});

function Detail() {
  const { item } = Route.useLoaderData() as { item: ContentItem };
  const pillar = PILLARS[item.pillar];
  const { data: all = [] } = useQuery(articlesQuery());
  const related = all.filter((c) => c.pillar === item.pillar && c.slug !== item.slug).slice(0, 3);
  const { data: authorProfile } = useQuery({
    queryKey: ["profile-by-name", item.author.name],
    enabled: !!item.author.name,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name,avatar_url")
        .ilike("name", item.author.name)
        .limit(1)
        .maybeSingle();
      return data;
    },
  });
  const { has, toggle } = useBookmarks();
  const saved = has(item.slug);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const pct = total > 0 ? (h.scrollTop / total) * 100 : 0;
      setProgress(pct);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const shareUrl = typeof window !== "undefined" ? window.location.href : `/read/${item.slug}`;
  const shareText = `${item.title} — Inshirah`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <>
      <div
        className="fixed left-0 top-0 z-[80] h-[3px] transition-all"
        style={{ width: `${progress}%`, background: "var(--heart)" }}
        aria-hidden
      />

      <article>
        <header className="container-wide max-w-3xl pt-16 pb-10 md:pt-24">
          <Link to={pillar.href} className="eyebrow inline-block hover:underline">
            ← {pillar.label}
          </Link>
          <h1 className="mt-5 text-4xl leading-[1.05] md:text-6xl">{item.title}</h1>
          <p className="mt-5 text-xl leading-relaxed text-muted-foreground">{item.description}</p>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-3">
              {authorProfile?.avatar_url ? (
                <img src={authorProfile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <LetterMark letter={pillar.letter} tint="heart" size={40} />
              )}
              <div>
                <p className="font-bold">{item.author.name}</p>
                {item.author.role && <p className="text-xs text-muted-foreground">{item.author.role}</p>}
              </div>
            </div>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              {new Date(item.date).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{item.readTime}</span>
            <span className="text-muted-foreground">·</span>

            <button
              onClick={() => toggle(item.slug)}
              aria-pressed={saved}
              aria-label={saved ? "Remove bookmark" : "Save for later"}
              className="ml-auto inline-flex items-center gap-1.5 rounded-pill border border-border px-3 py-1.5 font-semibold hover:bg-secondary"
            >
              <Bookmark className={`h-4 w-4 ${saved ? "fill-heart" : ""}`} style={saved ? { color: "var(--heart)" } : undefined} />
              {saved ? "Saved" : "Save"}
            </button>
          </div>

          {item.downloadable && (
            <a href="#" className="btn-ghost mt-6 inline-flex" onClick={(e) => e.preventDefault()}>
              <Download className="h-4 w-4" /> Download the printable
            </a>
          )}
        </header>

        <div className="container-wide max-w-3xl pb-16">
          <ArticleBodyView blocks={item.body ?? []} />


          <div className="mt-12 flex flex-wrap items-center gap-3 rounded-3xl border border-border bg-card p-5">
            <span className="text-sm font-bold">Share</span>
            <button onClick={copyLink} className="btn-ghost !py-2 !px-4 !text-sm">
              {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy link</>}
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank" rel="noreferrer"
              className="btn-ghost !py-2 !px-4 !text-sm"
            >
              Share to X
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${shareText} — ${shareUrl}`)}`}
              target="_blank" rel="noreferrer"
              className="btn-ghost !py-2 !px-4 !text-sm"
            >
              Share to WhatsApp
            </a>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="container-wide py-16 md:py-20">
          <div className="mb-10">
            <p className="eyebrow">Read next</p>
            <h2 className="mt-3 text-4xl md:text-5xl">More from {pillar.label}</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((r) => <ContentCard key={r.slug} item={r} />)}
          </div>
        </section>
      )}

      <section className="container-wide pb-24">
        <NewsletterSignup
          heading="If this reached you"
          description="A short letter, when we have something worth sending. Nothing more."
          cta="Subscribe"
        />
      </section>
    </>
  );
}
