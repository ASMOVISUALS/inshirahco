import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { articlesQuery, pageContentQuery, pageStatusQuery } from "@/lib/queries";
import { CmsPage } from "@/components/CmsPage";

const KEY = "resources";

const searchSchema = z.object({
  type: z.string().optional(),
  pillar: z.string().optional(),
});

export const Route = createFileRoute("/resources")({
  ssr: false,
  validateSearch: (s) => searchSchema.parse(s),
  loader: async ({ context }) => {
    context.queryClient.ensureQueryData(articlesQuery());
    const status = await context.queryClient.fetchQuery(pageStatusQuery(KEY));
    if (status.status === "published") await context.queryClient.ensureQueryData(pageContentQuery(KEY));
  },
  head: () => ({
    meta: [
      { title: "Resources — Inshirah" },
      { name: "description", content: "The full Inshirah library — reflections, articles, videos, podcasts, books, worksheets, and more, filterable by type and pillar." },
      { property: "og:title", content: "Resources — Inshirah" },
      { property: "og:description", content: "The full Inshirah library, filterable by type and pillar." },
    ],
    links: [{ rel: "canonical", href: "/resources" }],
  }),
  component: () => <CmsPage pageKey={KEY} fallbackName="Resources" />,
});
