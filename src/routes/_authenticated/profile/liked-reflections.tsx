import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { likedReflectionsQuery, type LikedReflection } from "@/lib/queries";
import { useUsernameColour } from "@/lib/member-colours";
import { fullDate } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile/liked-reflections")({
  head: () => ({
    meta: [
      { title: "Liked Reflections — Inshirah" },
      { name: "description", content: "Revisit the reflections you have liked on Inshirah." },
      { property: "og:title", content: "Liked Reflections — Inshirah" },
      { property: "og:description", content: "Your collection of liked reflections on Inshirah." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LikedReflectionsPage,
});

function LikedReflectionsPage() {
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery(likedReflectionsQuery(user?.id ?? null));

  return (
    <div className="mx-auto max-w-6xl">
      <p className="eyebrow mb-4">Your collection</p>
      <h1 className="font-display text-4xl leading-tight md:text-5xl">Liked Reflections</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Words from the community that stayed with you, ordered by when you liked them.
      </p>

      {isLoading && <p className="mt-10 text-sm text-muted-foreground">Loading liked reflections…</p>}

      {!isLoading && data.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <Heart className="mx-auto h-7 w-7 text-heart" strokeWidth={1.5} />
          <h2 className="mt-4 font-display text-2xl">No liked reflections yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Like a community reflection on the Verse of the Week and it will appear here.
          </p>
          <Button asChild className="mt-6">
            <Link to="/verse">Visit Verse of the Week</Link>
          </Button>
        </div>
      )}

      {data.length > 0 && (
        <div className="mt-10 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.map((reflection) => (
            <LikedReflectionCard key={reflection.id} reflection={reflection} />
          ))}
        </div>
      )}
    </div>
  );
}

function LikedReflectionCard({ reflection }: { reflection: LikedReflection }) {
  const colourFor = useUsernameColour();
  const posted = fullDate(reflection.created_at);
  const liked = fullDate(reflection.liked_at);

  return (
    <article className="flex min-h-56 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold" style={{ color: colourFor(reflection.author?.role_tag) }}>
          @{reflection.author?.username ?? "member"}
        </p>
        <span className="inline-flex items-center gap-1 text-xs text-heart">
          <Heart className="h-3.5 w-3.5 fill-current" /> {reflection.likes_count}
        </span>
      </div>

      <p className="mt-4 flex-1 whitespace-pre-wrap text-sm leading-relaxed">{reflection.body}</p>

      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
        <div>
          <dt className="text-muted-foreground">Posted</dt>
          <dd className="mt-1 font-semibold">{posted}</dd>
        </div>
        <div className="text-right">
          <dt className="text-muted-foreground">Liked on</dt>
          <dd className="mt-1 font-semibold text-heart">{liked}</dd>
        </div>
      </dl>
    </article>
  );
}