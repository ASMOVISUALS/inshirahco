import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PILLARS, RESOURCE_TYPES, type Pillar, type ResourceType } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/admin/articles/")({
  head: () => ({ meta: [{ title: "Articles — Admin", }, { name: "robots", content: "noindex" }] }),
  component: ArticlesList,
});

function ArticlesList() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id,slug,title,pillar,type,published,published_at")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const createNew = useMutation({
    mutationFn: async () => {
      const slug = `new-article-${Date.now().toString(36)}`;
      const { data, error } = await supabase
        .from("articles")
        .insert({
          slug,
          title: "Untitled article",
          description: "",
          pillar: "quranic-reflections",
          type: "article",
          read_time: "1 min",
          author_name: "Inshirah",
          tags: [],
          body: [],
          published: false,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      if (data?.id) navigate({ to: "/admin/articles/$id", params: { id: data.id } });
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const patch: { published: boolean; published_at?: string } = { published };
      if (published) patch.published_at = new Date().toISOString();
      const { error } = await supabase.from("articles").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-display">Articles</h2>
        <button onClick={() => createNew.mutate()} className="btn-primary">New article</button>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Pillar</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link to="/admin/articles/$id" params={{ id: a.id }} className="font-semibold hover:underline">{a.title}</Link>
                    <p className="text-xs text-muted-foreground">/{a.slug}</p>
                  </td>
                  <td className="px-4 py-3">{PILLARS[a.pillar as Pillar]?.short ?? a.pillar}</td>
                  <td className="px-4 py-3">{RESOURCE_TYPES[a.type as ResourceType]?.label ?? a.type}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-pill px-3 py-1 text-xs font-bold" style={a.published ? { background: "color-mix(in oklab, var(--tazkiyah) 20%, transparent)", color: "var(--tazkiyah)" } : { background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                      {a.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => togglePublish.mutate({ id: a.id, published: !a.published })} className="mr-2 text-sm font-semibold hover:underline" style={{ color: "var(--heart)" }}>
                      {a.published ? "Unpublish" : "Publish"}
                    </button>
                    <button onClick={() => { if (confirm("Delete this article?")) del.mutate(a.id); }} className="text-sm font-semibold text-muted-foreground hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No articles yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
