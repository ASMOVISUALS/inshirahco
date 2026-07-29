import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { articlesQuery } from "@/lib/queries";
import { ContentCard } from "@/components/ContentCard";
import { useBookmarks } from "@/hooks/use-theme";

export const Route = createFileRoute("/saved")({
  ssr: false,
  loader: ({ context }) => { context.queryClient.ensureQueryData(articlesQuery()); },
  head: () => ({
    meta: [
      { title: "Saved — Inshirah" },
      { name: "description", content: "Your bookmarked articles, reflections, and resources from Inshirah — synced to your account when signed in." },
      { property: "og:title", content: "Saved — Inshirah" },
      { property: "og:description", content: "Your bookmarks, waiting for you." },
      { property: "og:url", content: "/saved" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/saved" }],
  }),
  component: Saved,
});

function Saved() {
  const { data: content } = useSuspenseQuery(articlesQuery());
  const { slugs } = useBookmarks();
  const items = content.filter((c) => slugs.includes(c.slug));

  return (
    <section className="container-wide py-16 md:py-24">
      <p className="eyebrow">Yours to return to</p>
      <h1 className="mt-3 text-5xl leading-tight md:text-6xl">Saved for later</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Everything you've bookmarked lives here. Sign in and they sync across devices.
      </p>

      {items.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-border bg-card p-12 text-center">
          <p className="font-arabic text-5xl" style={{ color: "var(--heart)" }}>·</p>
          <h2 className="mt-4 text-2xl">No bookmarks yet</h2>
          <p className="mt-2 text-muted-foreground">Tap the bookmark icon on any article to keep it here.</p>
          <Link to="/" className="btn-primary mt-6">Back home</Link>
        </div>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => <ContentCard key={item.slug} item={item} />)}
        </div>
      )}
    </section>
  );
}
