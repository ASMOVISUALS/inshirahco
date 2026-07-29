import { createFileRoute } from "@tanstack/react-router";
import { PillarArchive } from "@/components/PillarArchive";
import { pageContentQuery, pageStatusQuery } from "@/lib/queries";

export const Route = createFileRoute("/youth")({
  loader: async ({ context }) => {
    const status = await context.queryClient.fetchQuery(pageStatusQuery("pillar:youth"));
    if (status.status === "published") {
      await context.queryClient.ensureQueryData(pageContentQuery("pillar:youth"));
    }
  },
  head: () => ({
    meta: [
      { title: "Youth — Inshirah" },
      { name: "description", content: "Honest, warm writing for teens and young adults finding their footing in faith, identity, and the noise of the world." },
      { property: "og:title", content: "Youth — Inshirah" },
      { property: "og:description", content: "Warm, honest writing for younger readers." },
      { property: "og:url", content: "/youth" },
    ],
    links: [{ rel: "canonical", href: "/youth" }],
  }),
  component: () => (
    <PillarArchive
      pillar="youth"
      tint="heart-soft"
    />
  ),
});
