import { createFileRoute } from "@tanstack/react-router";
import { PillarArchive } from "@/components/PillarArchive";
import { pageContentQuery, pageStatusQuery } from "@/lib/queries";

export const Route = createFileRoute("/tazkiyah-toolkit")({
  loader: async ({ context }) => {
    const status = await context.queryClient.fetchQuery(pageStatusQuery("pillar:tazkiyah-toolkit"));
    if (status.status === "published") {
      await context.queryClient.ensureQueryData(pageContentQuery("pillar:tazkiyah-toolkit"));
    }
  },
  head: () => ({
    meta: [
      { title: "Tazkiyah Toolkit — Inshirah" },
      { name: "description", content: "Practical, printable exercises and gentle daily practices for the slow polishing of the heart." },
      { property: "og:title", content: "Tazkiyah Toolkit — Inshirah" },
      { property: "og:description", content: "Practices and printables for the slow polishing of the heart." },
      { property: "og:url", content: "/tazkiyah-toolkit" },
    ],
    links: [{ rel: "canonical", href: "/tazkiyah-toolkit" }],
  }),
  component: () => (
    <PillarArchive
      pillar="tazkiyah-toolkit"
      tint="tazkiyah"
    />
  ),
});
