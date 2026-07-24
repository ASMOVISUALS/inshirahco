import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { articlesQuery, reflectionsQuery, testimonialsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/_admin/")({
  head: () => ({ meta: [{ title: "Admin — Inshirah" }, { name: "robots", content: "noindex" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: articles = [] } = useQuery(articlesQuery());
  const { data: reflections = [] } = useQuery(reflectionsQuery());
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
    { label: "Reflections", value: reflections.length },
    { label: "Testimonials", value: testimonials.length },
    { label: "Newsletter signups", value: newsletter },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-3xl border border-border bg-card p-6">
          <p className="text-sm font-semibold text-muted-foreground">{s.label}</p>
          <p className="mt-3 font-display text-5xl">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
