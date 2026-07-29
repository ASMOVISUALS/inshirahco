import { createFileRoute } from "@tanstack/react-router";
import { PillarArchive } from "@/components/PillarArchive";
import { pageContentQuery, pageStatusQuery } from "@/lib/queries";

export const Route = createFileRoute("/tadabbur")({
  loader: async ({ context }) => {
    const status = await context.queryClient.fetchQuery(pageStatusQuery("pillar:tadabbur"));
    if (status.status === "published") {
      await context.queryClient.ensureQueryData(pageContentQuery("pillar:tadabbur"));
    }
  },
  head: () => ({
    meta: [
      { title: "Tadabbur — Inshirah" },
      { name: "description", content: "Slow, tadabbur-first readings of the Qur'an — verse by verse, ayah by ayah." },
      { property: "og:title", content: "Tadabbur — Inshirah" },
      { property: "og:description", content: "Slow, tadabbur-first readings of the Qur'an." },
      { property: "og:url", content: "/tadabbur" },
    ],
    links: [{ rel: "canonical", href: "/tadabbur" }],
  }),
  component: () => (
    <PillarArchive
      pillar="tadabbur"
      tint="heart"
    />
  ),
});
