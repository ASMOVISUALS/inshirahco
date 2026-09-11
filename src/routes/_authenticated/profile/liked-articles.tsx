import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/ContentCard";
import { useAuth } from "@/hooks/use-auth";
import { articlesQuery, articleLikesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/profile/liked-articles")({
  head: () => ({
    meta: [
      { title: "Liked Articles — Inshirah" },
      { name: "description", content: "Revisit the Inshirah articles and publications you have saved." },
      { property: "og:title", content: "Liked Articles — Inshirah" },
      { property: "og:description", content: "Your saved Inshirah articles and publications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LikedArticlesPage,
});

function LikedArticlesPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { data: articles = [], isLoading: articlesLoading } = useQuery(articlesQuery());
  const { data: slugs = [], isLoading: likesLoading } = useQuery(articleLikesQuery(userId));
  const order = new Map(slugs.map((slug, i) => [slug, i]));
  const likedArticles = articles
    .filter((article) => order.has(article.slug))
    .sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
  const isLoading = articlesLoading || likesLoading;

  return (
    <div className="mx-auto max-w-6xl">
      <p className="eyebrow mb-4">Your library</p>
      <h1 className="font-display text-4xl leading-tight md:text-5xl">Liked Articles</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Articles and publications you have liked, gathered together for an easy return.
      </p>

      {isLoading && <p className="mt-10 text-sm text-muted-foreground">Loading liked articles…</p>}

      {!isLoading && likedArticles.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <Heart className="mx-auto h-7 w-7 text-heart" strokeWidth={1.5} />
          <h2 className="mt-4 font-display text-2xl">No liked articles yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Tap the heart on an article and it will appear here.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Browse articles</Link>
          </Button>
        </div>
      )}


      {likedArticles.length > 0 && (
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {likedArticles.map((article) => <ContentCard key={article.slug} item={article} />)}
        </div>
      )}
    </div>
  );
}