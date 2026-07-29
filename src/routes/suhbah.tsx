import { createFileRoute } from "@tanstack/react-router";
import { pageContentQuery, pageStatusQuery } from "@/lib/queries";
import { CmsPage } from "@/components/CmsPage";

const KEY = "pillar:suhbah";

export const Route = createFileRoute("/suhbah")({
  loader: async ({ context }) => {
    const status = await context.queryClient.fetchQuery(pageStatusQuery(KEY));
    if (status.status === "published") await context.queryClient.ensureQueryData(pageContentQuery(KEY));
  },
  head: () => ({
    meta: [
      { title: "Suhbah — Inshirah" },
      { name: "description", content: "Suhbah — companionship and the architecture of an intentional life." },
      { property: "og:title", content: "Suhbah — Inshirah" },
      { property: "og:description", content: "Companionship and the architecture of an intentional life." },
    ],
    links: [{ rel: "canonical", href: "/suhbah" }],
  }),
  component: () => <CmsPage pageKey={KEY} fallbackName="Suhbah" />,
});
