import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pencil, Trash2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PILLARS, RESOURCE_TYPES, type Pillar, type ResourceType } from "@/lib/content";
import { ArchiveTabs, type ArchiveTab } from "@/components/admin/ArchiveTabs";

export const Route = createFileRoute("/_authenticated/admin/articles/")({
  head: () => ({ meta: [{ title: "Articles — Admin", }, { name: "robots", content: "noindex" }] }),
  component: ArticlesList,
});

type Row = {
  id: string; slug: string; title: string; pillar: string; type: string;
  published: boolean; published_at: string | null; archived_at: string | null;
};

function ArticlesList() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("articles")
        .select("id,slug,title,pillar,type,published,published_at,archived_at")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const [tab, setTab] = useState<ArchiveTab>("active");
  const { active, archived } = useMemo(() => ({
    active: data.filter((r) => !r.archived_at),
    archived: data.filter((r) => r.archived_at),
  }), [data]);
  const rows = tab === "active" ? active : archived;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-articles"] });
    qc.invalidateQueries({ queryKey: ["articles"] });
  };

  const createNew = useMutation({
    mutationFn: async () => {
      const slug = `new-article-${Date.now().toString(36)}`;
      const { data, error } = await supabase
        .from("articles")
        .insert({
          slug, title: "Untitled article", description: "",
          pillar: "quranic-reflections", type: "article",
          read_time: "1 min", author_name: "Inshirah", tags: [],
          body: [], published: false,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => { invalidate(); if (d?.id) navigate({ to: "/admin/articles/$id", params: { id: d.id } }); },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const patch: { published: boolean; published_at?: string } = { published };
      if (published) patch.published_at = new Date().toISOString();
      const { error } = await supabase.from("articles").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").update({ archived_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const restore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").update({ archived_at: null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const purge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-display">Articles</h2>
          <ArchiveTabs tab={tab} onChange={setTab} activeCount={active.length} archiveCount={archived.length} />
        </div>
        {tab === "active" && (
          <button onClick={() => createNew.mutate()} className="btn-primary">Add an article</button>
        )}
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
                <th className="px-4 py-3 font-semibold">Format</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    {tab === "active" ? (
                      <Link to="/admin/articles/$id" params={{ id: a.id }} className="font-semibold hover:underline">{a.title}</Link>
                    ) : (
                      <span className="font-semibold">{a.title}</span>
                    )}
                    <p className="text-xs text-muted-foreground">/{a.slug}</p>
                  </td>
                  <td className="px-4 py-3">{PILLARS[a.pillar as Pillar]?.short ?? a.pillar}</td>
                  <td className="px-4 py-3">{RESOURCE_TYPES[a.type as ResourceType]?.label ?? a.type}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-pill px-3 py-1 text-xs font-bold"
                      style={a.published
                        ? { background: "color-mix(in oklab, var(--tazkiyah) 20%, transparent)", color: "var(--tazkiyah)" }
                        : { background: "var(--secondary)", color: "var(--muted-foreground)" }}
                    >
                      {a.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {tab === "active" ? (
                      <>
                        <Link
                          to="/admin/articles/$id"
                          params={{ id: a.id }}
                          aria-label="Edit article"
                          className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-secondary"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => togglePublish.mutate({ id: a.id, published: !a.published })}
                          className="mr-2 text-sm font-semibold hover:underline"
                          style={{ color: "var(--heart)" }}
                        >
                          {a.published ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          onClick={() => archive.mutate(a.id)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:underline"
                          aria-label="Move to archive"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => restore.mutate(a.id)}
                          className="mr-3 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
                          style={{ color: "var(--heart)" }}
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Restore
                        </button>
                        <button
                          onClick={() => { if (confirm("Permanently delete this article? This cannot be undone.")) purge.mutate(a.id); }}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-destructive hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete forever
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {tab === "active" ? "No articles yet." : "Archive is empty."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
