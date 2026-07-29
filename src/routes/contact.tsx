import { createFileRoute } from "@tanstack/react-router";
import { pageContentQuery, pageStatusQuery } from "@/lib/queries";
import { CmsPage } from "@/components/CmsPage";

const KEY = "contact";

export const Route = createFileRoute("/contact")({
  loader: async ({ context }) => {
    const status = await context.queryClient.fetchQuery(pageStatusQuery(KEY));
    if (status.status === "published") await context.queryClient.ensureQueryData(pageContentQuery(KEY));
  },
  head: () => ({
    meta: [
      { title: "Contact & support — Inshirah" },
      { name: "description", content: "Send Inshirah a note, or read about how to support this small, freely-offered project." },
      { property: "og:title", content: "Contact & support — Inshirah" },
      { property: "og:description", content: "Get in touch, or support the project." },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: () => <CmsPage pageKey={KEY} fallbackName="Contact" />,
});
