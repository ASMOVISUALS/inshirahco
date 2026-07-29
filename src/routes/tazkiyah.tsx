import { createFileRoute } from "@tanstack/react-router";
import { PillarArchive } from "@/components/PillarArchive";
import { pageContentQuery, pageStatusQuery } from "@/lib/queries";

export const Route = createFileRoute("/tazkiyah")({
  loader: async ({ context }) => {
    const status = await context.queryClient.fetchQuery(pageStatusQuery("pillar:tazkiyah"));
    if (status.status === "published") {
      await context.queryClient.ensureQueryData(pageContentQuery("pillar:tazkiyah"));
    }
  },
  head: () => ({
    meta: [
      { title: "Tazkiyah — Inshirah" },
      { name: "description", content: "Practical, printable exercises and gentle daily practices for the slow polishing of the heart." },
      { property: "og:title", content: "Tazkiyah — Inshirah" },
      { property: "og:description", content: "Practices and printables for the slow polishing of the heart." },
      { property: "og:url", content: "/tazkiyah" },
    ],
    links: [{ rel: "canonical", href: "/tazkiyah" }],
  }),
  component: () => (
    <PillarArchive
      pillar="tazkiyah"
      tint="tazkiyah"
    />
  ),
});
