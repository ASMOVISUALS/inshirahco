import { createFileRoute } from "@tanstack/react-router";
import { pageContentQuery, pageStatusQuery } from "@/lib/queries";
import { CmsPage } from "@/components/CmsPage";

const KEY = "pillar:tazkiyah";

export const Route = createFileRoute("/tazkiyah")({
  loader: async ({ context }) => {
    const status = await context.queryClient.fetchQuery(pageStatusQuery(KEY));
    if (status.status === "published") await context.queryClient.ensureQueryData(pageContentQuery(KEY));
  },
  head: () => ({
    meta: [
      { title: "Tazkiyah — Inshirah" },
      { name: "description", content: "The Tazkiyah toolkit — practices for purification of the soul." },
      { property: "og:title", content: "Tazkiyah — Inshirah" },
      { property: "og:description", content: "Practices for purification of the soul." },
    ],
    links: [{ rel: "canonical", href: "/tazkiyah" }],
  }),
  component: () => <CmsPage pageKey={KEY} fallbackName="Tazkiyah" />,
});
