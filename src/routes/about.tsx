import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LetterMark } from "@/components/LetterMark";
import { pageQuery } from "@/lib/queries";
import { PageRenderer, isBlockArray, type Block } from "@/lib/page-blocks";
import { SystemTemplate } from "@/components/SystemTemplate";

export const Route = createFileRoute("/about")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(pageQuery("about")); },
  head: () => ({
    meta: [
      { title: "About — Inshirah" },
      { name: "description", content: "The story behind Inshirah — a passion project publishing Islamic psychology writing on tazkiyah, tadabbur, and the intentional life." },
      { property: "og:title", content: "About — Inshirah" },
      { property: "og:description", content: "The story behind Inshirah, and what we hope it becomes." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  const { data: bundle } = useQuery(pageQuery("about"));
  const page = bundle?.content ?? {};
  if (bundle?.status === "hidden") return <SystemTemplate mode="hidden" pageName="About" />;
  if (bundle?.status === "coming_soon") return <SystemTemplate mode="coming_soon" pageName="About" />;
  const s = (k: string, fallback = "") => (page[k] as string) ?? fallback;
  const paragraphs = (Array.isArray(page.body_paragraphs) ? page.body_paragraphs : []) as string[];

  const rawBlocks = (page as { blocks?: unknown }).blocks;
  if (isBlockArray(rawBlocks) && (rawBlocks as Block[]).length > 0) {
    return <PageRenderer blocks={rawBlocks as Block[]} />;
  }


  return (
    <>
      <section className="hero-radial">
        <div className="container-wide py-24 md:py-32 text-center">
          <p className="font-arabic text-3xl" style={{ color: "var(--heart)" }} dir="rtl">{s("hero_arabic", "انشراح")}</p>
          <h1 className="mt-4 text-5xl leading-tight md:text-7xl">
            {s("hero_title", "Islamic psychology, for the world of good.")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            {s("hero_description", "")}
          </p>
        </div>
      </section>

      <section className="container-wide py-16 md:py-24">
        <div className="mx-auto max-w-3xl space-y-8 font-display text-xl leading-relaxed md:text-2xl" style={{ fontVariationSettings: '"SOFT" 60, "WONK" 1', color: "var(--ink)" }}>
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      <section className="container-wide py-8 md:py-16">
        <div className="mb-10 max-w-xl">
          <p className="eyebrow">{s("founder_eyebrow", "Behind the words")}</p>
          <h2 className="mt-3 text-4xl md:text-5xl">{s("founder_title", "The founder")}</h2>
        </div>
        <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-3xl border border-border bg-card p-8 md:flex-row md:items-start">
          <LetterMark letter={s("founder_letter", "ف")} tint="heart" size={80} />
          <div>
            <h3 className="text-2xl">{s("founder_name", "Founder")}</h3>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">{s("founder_role", "")}</p>
            <p className="mt-4 text-[1.02rem] leading-relaxed text-muted-foreground">
              {s("founder_bio", "")}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
