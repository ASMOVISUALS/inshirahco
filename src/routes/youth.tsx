import { createFileRoute } from "@tanstack/react-router";
import { pageContentQuery, pageStatusQuery } from "@/lib/queries";
import { CmsPage } from "@/components/CmsPage";

const KEY = "pillar:youth";

export const Route = createFileRoute("/youth")({
  loader: async ({ context }) => {
    const status = await context.queryClient.fetchQuery(pageStatusQuery(KEY));
    if (status.status === "published") await context.queryClient.ensureQueryData(pageContentQuery(KEY));
  },
  head: () => ({
    meta: [
      { title: "Youth — Inshirah" },
      { name: "description", content: "Young Hearts — writing and resources for young Muslims." },
      { property: "og:title", content: "Youth — Inshirah" },
      { property: "og:description", content: "Writing and resources for young Muslims." },
    ],
    links: [{ rel: "canonical", href: "/youth" }],
  }),
  component: () => <CmsPage pageKey={KEY} fallbackName="Youth" />,
});
