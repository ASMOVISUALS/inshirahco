import { createFileRoute } from "@tanstack/react-router";
import { PillarArchive } from "@/components/PillarArchive";
import { pageQuery } from "@/lib/queries";

export const Route = createFileRoute("/tazkiyah-toolkit")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(pageQuery("pillar:tazkiyah-toolkit")); },
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
