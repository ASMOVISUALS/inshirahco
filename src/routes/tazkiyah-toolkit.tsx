import { createFileRoute } from "@tanstack/react-router";
import { PillarArchive } from "@/components/PillarArchive";

export const Route = createFileRoute("/tazkiyah-toolkit")({
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
      eyebrow="Pillar 02 · Toolkit"
      intro="Short practices, printable worksheets, and gentle exercises — small tools for the everyday work of softening and steadying the heart."
    />
  ),
});
