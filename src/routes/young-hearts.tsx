import { createFileRoute } from "@tanstack/react-router";
import { PillarArchive } from "@/components/PillarArchive";

export const Route = createFileRoute("/young-hearts")({
  head: () => ({
    meta: [
      { title: "Young Hearts — Inshirah" },
      { name: "description", content: "Honest, warm writing for teens and young adults finding their footing in faith, identity, and the noise of the world." },
      { property: "og:title", content: "Young Hearts — Inshirah" },
      { property: "og:description", content: "Warm, honest writing for younger readers." },
      { property: "og:url", content: "/young-hearts" },
    ],
    links: [{ rel: "canonical", href: "/young-hearts" }],
  }),
  component: () => (
    <PillarArchive
      pillar="young-hearts"
      tint="heart-soft"
      eyebrow="Pillar 03 · Youth"
      intro="For the young heart in between: between cultures, between certainties, between what the world expects and what the soul quietly asks for."
    />
  ),
});
