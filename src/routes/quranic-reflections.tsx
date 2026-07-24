import { createFileRoute } from "@tanstack/react-router";
import { PillarArchive } from "@/components/PillarArchive";

export const Route = createFileRoute("/quranic-reflections")({
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
