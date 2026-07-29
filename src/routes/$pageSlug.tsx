import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { pageBySlugContentQuery, pageBySlugStatusQuery } from "@/lib/queries";
import { PageRenderer, readBlocks } from "@/lib/page-blocks";
import { SystemTemplate } from "@/components/SystemTemplate";

// Reserved slugs that have their own route files
const RESERVED = new Set([
  "", "about", "auth", "auth.callback", "contact", "join", "suhbah",
  "tadabbur", "read", "reset-password", "resources", "saved",
  "sitemap.xml", "tazkiyah", "youth", "admin",
]);

export const Route = createFileRoute("/$pageSlug")({
  loader: async ({ context, params }) => {
    if (RESERVED.has(params.pageSlug)) throw notFound();
    const status = await context.queryClient.fetchQuery(pageBySlugStatusQuery(params.pageSlug));
    if (!status) throw notFound();
    if (status.status === "published") {
      const content = await context.queryClient.fetchQuery(pageBySlugContentQuery(params.pageSlug));
      return { ...status, content: content?.content ?? {} };
    }
    return status;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Not found" }, { name: "robots", content: "noindex" }] };
    const content = ("content" in loaderData ? loaderData.content : {}) as Record<string, unknown>;
    const seoTitle = (content.seo_title as string) || loaderData.title || "Inshirah";
    const seoDesc = (content.seo_description as string) || "";
    return {
      meta: [
        { title: `${seoTitle} — Inshirah` },
        { name: "description", content: seoDesc },
        { property: "og:title", content: seoTitle },
        { property: "og:description", content: seoDesc },
      ],
    };
  },
  component: DynamicPage,
  errorComponent: ({ error }) => <div className="container-wide py-24 text-center text-muted-foreground">{error.message}</div>,
  notFoundComponent: () => <div className="container-wide py-24 text-center text-muted-foreground">Page not found.</div>,
});

function DynamicPage() {
  const { pageSlug } = Route.useParams();
  const { data: status } = useSuspenseQuery(pageBySlugStatusQuery(pageSlug));
  if (status?.status === "hidden") return <SystemTemplate mode="hidden" pageName={status.title ?? undefined} />;
  if (status?.status === "coming_soon") return <SystemTemplate mode="coming_soon" pageName={status.title ?? undefined} />;
  return <DynamicPageContent pageSlug={pageSlug} />;
}

function DynamicPageContent({ pageSlug }: { pageSlug: string }) {
  const { data } = useSuspenseQuery(pageBySlugContentQuery(pageSlug));
  const blocks = readBlocks((data?.content ?? {}) as Record<string, unknown>);
  if (blocks.length === 0) {
    return (
      <div className="container-wide py-24 text-center text-muted-foreground">
        This page has no content yet.
      </div>
    );
  }
  return <PageRenderer blocks={blocks} />;
}
