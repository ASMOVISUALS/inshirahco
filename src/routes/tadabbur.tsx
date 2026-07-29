import { createFileRoute } from "@tanstack/react-router";
import { PillarArchive } from "@/components/PillarArchive";
import { pageContentQuery, pageStatusQuery } from "@/lib/queries";

export const Route = createFileRoute("/quranic-reflections")({
  loader: async ({ context }) => {
    const status = await context.queryClient.fetchQuery(pageStatusQuery("pillar:quranic-reflections"));
    if (status.status === "published") {
      await context.queryClient.ensureQueryData(pageContentQuery("pillar:quranic-reflections"));
    }
  },
  head: () => ({
    meta: [
      { title: "Qur'anic Reflections — Inshirah" },
      { name: "description", content: "Slow, tadabbur-first readings of the Qur'an — verse by verse, ayah by ayah." },
      { property: "og:title", content: "Qur'anic Reflections — Inshirah" },
      { property: "og:description", content: "Slow, tadabbur-first readings of the Qur'an." },
      { property: "og:url", content: "/quranic-reflections" },
    ],
    links: [{ rel: "canonical", href: "/quranic-reflections" }],
  }),
  component: () => (
    <PillarArchive
      pillar="quranic-reflections"
      tint="heart"
    />
  ),
});
