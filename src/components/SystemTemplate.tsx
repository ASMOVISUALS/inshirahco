import { useQuery } from "@tanstack/react-query";
import { pageQuery } from "@/lib/queries";
import { PageRenderer, readBlocks } from "@/lib/page-blocks";

/**
 * Renders the site-wide "hidden" or "coming soon" template stored as a
 * regular page in Supabase (`system:hidden` / `system:coming-soon`), so
 * admins can edit it in the page builder. Substitutes {{page_name}}.
 */
export function SystemTemplate({ mode, pageName }: { mode: "hidden" | "coming_soon"; pageName?: string }) {
  const key = mode === "hidden" ? "system:hidden" : "system:coming-soon";
  const { data } = useQuery(pageQuery(key));
  const blocks = readBlocks(data?.content);
  const vars = { page_name: pageName ?? "" };
  if (blocks.length === 0) {
    return (
      <div className="container-wide grid min-h-[60svh] place-items-center py-24 text-center">
        <div>
          <h1 className="text-6xl md:text-8xl">{mode === "hidden" ? "This page is hidden." : "Coming soon."}</h1>
          <p className="mt-6 text-lg text-muted-foreground">Come back soon.</p>
        </div>
      </div>
    );
  }
  return <PageRenderer blocks={blocks} vars={vars} />;
}
