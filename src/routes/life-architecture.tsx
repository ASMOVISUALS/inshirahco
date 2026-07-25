import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Compass, Users, Mountain, Sparkles, BookOpen, Calendar } from "lucide-react";
import { LetterMark } from "@/components/LetterMark";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { pageQuery } from "@/lib/queries";
import { PageRenderer, isBlockArray, type Block } from "@/lib/page-blocks";
import { HiddenPage } from "@/components/HiddenPage";

interface Preview { icon?: string; title: string; description: string; tag?: string }

const ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  compass: Compass,
  users: Users,
  mountain: Mountain,
  sparkles: Sparkles,
  book: BookOpen,
  calendar: Calendar,
};

const DEFAULT_PREVIEWS: Preview[] = [
  { icon: "users", tag: "Cohorts", title: "Mentor-led courses", description: "Small cohorts walking through purpose, work, and long-term direction with a mentor who knows your name." },
  { icon: "mountain", tag: "Retreats", title: "In-person retreats", description: "A few days away from the noise — reflection, halaqas, and quiet planning in landscapes that let the chest expand." },
  { icon: "calendar", tag: "Gatherings", title: "Exclusive events", description: "Intimate salons and dinners with scholars, founders, and practitioners exploring the architecture of a life well-lived." },
];

const DEFAULT_MENTORS: Mentor[] = [
  { name: "Mentor 1", title: "Scholar & Educator", role: "Lead Mentor", qualification: "PhD, Islamic Studies" },
  { name: "Mentor 2", title: "Psychologist & Coach", role: "Advisor", qualification: "MSc, Clinical Psychology" },
  { name: "Mentor 3", title: "Founder & Strategist", role: "Advisor", qualification: "MBA, Strategy" },
];

export const Route = createFileRoute("/life-architecture")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(pageQuery("life-architecture"));
  },
  head: () => ({
    meta: [
      { title: "Life Architecture — Coming soon | Inshirah" },
      { name: "description", content: "A mentor-led course on building an intentional life — career, purpose, and long-term direction, rooted in Islamic principles. Currently in development." },
      { property: "og:title", content: "Life Architecture — Coming soon" },
      { property: "og:description", content: "Mentor-led course on the intentional life. Join the waitlist." },
      { property: "og:url", content: "/life-architecture" },
    ],
    links: [{ rel: "canonical", href: "/life-architecture" }],
  }),
  component: LifeArchitecture,
});

interface Mentor { name: string; title?: string; role?: string; qualification?: string; bio?: string; image?: string }

function LifeArchitecture() {
  const { data: page = {} } = useQuery(pageQuery("life-architecture"));
  const s = (k: string, fallback = "") => (page[k] as string) ?? fallback;
  const mentorsRaw = (Array.isArray(page.mentors) ? page.mentors : []) as Mentor[];
  const mentors = mentorsRaw.length > 0 ? mentorsRaw : DEFAULT_MENTORS;
  const previews = (Array.isArray(page.previews) && page.previews.length > 0 ? page.previews : DEFAULT_PREVIEWS) as Preview[];

  const rawBlocks = (page as { blocks?: unknown }).blocks;
  if (isBlockArray(rawBlocks) && (rawBlocks as Block[]).length > 0) {
    return <PageRenderer blocks={rawBlocks as Block[]} />;
  }

  return (
    <>
      <section className="hero-radial">
        <div className="container-wide py-24 md:py-32">
          <div className="flex flex-col items-start gap-6">
            <span className="rounded-pill px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ background: "color-mix(in oklab, var(--gold-decorative) 22%, transparent)", color: "var(--gold)" }}>
              {s("badge", "Coming soon")}
            </span>
            <div className="flex items-start gap-5">
              <LetterMark letter="ح" tint="gold" size={72} />
              <div>
                <p className="eyebrow">{s("eyebrow", "Pillar 04 · Architecture")}</p>
                <h1 className="mt-2 text-5xl leading-tight md:text-7xl">{s("title", "Life Architecture")}</h1>
              </div>
            </div>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              {s("description", "")}
            </p>
          </div>
        </div>
      </section>

      <section className="container-wide -mt-8 pb-16">
        <NewsletterSignup
          heading={s("waitlist_heading", "Be first when the door opens")}
          description={s("waitlist_description", "")}
          cta={s("waitlist_cta", "Join the waitlist")}
        />
      </section>

      <section className="container-wide py-16 md:py-24">
        <div className="mb-12 max-w-2xl">
          <p className="eyebrow">{s("previews_eyebrow", "What to look forward to")}</p>
          <h2 className="mt-3 text-4xl md:text-5xl">{s("previews_title", "The shape of what's coming")}</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {s("previews_description", "Life Architecture is a slow, deliberate programme. Here's a glimpse of the rooms we're building.")}
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {previews.map((p, i) => {
            const Icon = ICONS[p.icon ?? "sparkles"] ?? Sparkles;
            return (
              <div key={i} className="group relative flex flex-col gap-4 rounded-3xl border border-border bg-card p-7 transition-transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className="grid h-12 w-12 place-items-center rounded-2xl"
                    style={{ background: "color-mix(in oklab, var(--gold-decorative) 22%, transparent)", color: "var(--gold)" }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  {p.tag && (
                    <span className="eyebrow" style={{ color: "var(--gold)" }}>{p.tag}</span>
                  )}
                </div>
                <h3 className="text-xl leading-snug md:text-2xl">{p.title}</h3>
                <p className="text-[0.95rem] leading-relaxed text-muted-foreground">{p.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container-wide pb-24 md:pb-32">
        <div className="mb-12 max-w-xl">
          <h2 className="text-4xl md:text-5xl">{s("mentors_title", "The Mentors")}</h2>
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
            {s("mentors_description", "Meet your mentors and advisors!")}
          </p>
        </div>
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
          {mentors.map((m, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div
                className="grid h-40 w-40 place-items-center overflow-hidden rounded-full ring-4 ring-[color:var(--paper-warm)]"
                style={{ background: "color-mix(in oklab, var(--gold-decorative) 22%, transparent)", color: "var(--gold)" }}
              >
                {m.image ? (
                  <img src={m.image} alt={m.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-arabic text-6xl">م</span>
                )}
              </div>
              <h3 className="mt-6 text-2xl">{m.name}</h3>
              {m.title && (
                <p className="mt-1.5 text-sm font-semibold uppercase tracking-widest text-muted-foreground">{m.title}</p>
              )}
              {m.role && (
                <p className="mt-1 text-sm text-muted-foreground">{m.role}</p>
              )}
              {m.qualification && (
                <p className="mt-1 text-sm italic text-muted-foreground">{m.qualification}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
