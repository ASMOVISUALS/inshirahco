import { createFileRoute, Link } from "@tanstack/react-router";
import { Palette } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { articlesQuery, ayahsQuery, testimonialsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin — Inshirah" }, { name: "robots", content: "noindex" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: articles = [] } = useQuery(articlesQuery());
  const { data: ayahs = [] } = useQuery(ayahsQuery());
  const { data: testimonials = [] } = useQuery(testimonialsQuery());
  const { data: newsletter = 0 } = useQuery({
    queryKey: ["newsletter-count"],
    queryFn: async () => {
      const { count } = await supabase.from("newsletter_signups").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const stats = [
    { label: "Published articles", value: articles.length },
    { label: "Verses", value: ayahs.length },
    { label: "Testimonials", value: testimonials.length },
    { label: "Newsletter signups", value: newsletter },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl border border-border bg-card p-6">
            <p className="text-sm font-semibold text-muted-foreground">{s.label}</p>
            <p className="mt-3 font-display text-5xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/admin/branding"
          className="group rounded-3xl border border-border bg-card p-6 transition hover:-translate-y-0.5"
        >
          <span className="inline-flex items-center gap-3">
            <Palette className="h-5 w-5" style={{ color: "var(--heart)" }} />
            <span className="font-display text-2xl">Brand guidelines</span>
          </span>
          <p className="mt-2 text-sm text-muted-foreground">
            Colours, fonts, logos, pattern assets, pairings and tone of voice.
          </p>
          <span className="mt-4 flex gap-1.5" aria-hidden>
            {["heart", "gold-decorative", "tazkiyah", "paper-warm", "ink"].map((t) => (
              <span key={t} className="size-5 rounded-full border border-border" style={{ background: `var(--${t})` }} />
            ))}
          </span>
        </Link>
      </div>
    </div>
  );
}
