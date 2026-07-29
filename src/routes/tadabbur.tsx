import { createFileRoute } from "@tanstack/react-router";
import { pageContentQuery, pageStatusQuery } from "@/lib/queries";
import { CmsPage } from "@/components/CmsPage";

const KEY = "pillar:tadabbur";

export const Route = createFileRoute("/tadabbur")({
  loader: async ({ context }) => {
    const status = await context.queryClient.fetchQuery(pageStatusQuery(KEY));
    if (status.status === "published") await context.queryClient.ensureQueryData(pageContentQuery(KEY));
  },
  head: () => ({
    meta: [
      { title: "Tadabbur — Inshirah" },
      { name: "description", content: "Quranic reflections — slow meditations on the Book." },
      { property: "og:title", content: "Tadabbur — Inshirah" },
      { property: "og:description", content: "Slow meditations on the Quran." },
    ],
    links: [{ rel: "canonical", href: "/tadabbur" }],
  }),
  component: () => <CmsPage pageKey={KEY} fallbackName="Tadabbur" />,
});
