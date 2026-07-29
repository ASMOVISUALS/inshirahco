import { useSuspenseQuery } from "@tanstack/react-query";
import { pageContentQuery, pageStatusQuery } from "@/lib/queries";
import { PageRenderer, readBlocks } from "@/lib/page-blocks";
import { SystemTemplate } from "@/components/SystemTemplate";

export function CmsPage({ pageKey, fallbackName }: { pageKey: string; fallbackName: string }) {
  const { data: status } = useSuspenseQuery(pageStatusQuery(pageKey));
  if (status.status === "hidden") return <SystemTemplate mode="hidden" pageName={status.title ?? fallbackName} />;
  if (status.status === "coming_soon") return <SystemTemplate mode="coming_soon" pageName={status.title ?? fallbackName} />;
  return <CmsPageContent pageKey={pageKey} />;
}

function CmsPageContent({ pageKey }: { pageKey: string }) {
  const { data } = useSuspenseQuery(pageContentQuery(pageKey));
  const blocks = readBlocks(data.content);
  if (blocks.length === 0) {
    return <div className="container-wide py-24 text-center text-muted-foreground">This page has no content yet.</div>;
  }
  return <PageRenderer blocks={blocks} />;
}
