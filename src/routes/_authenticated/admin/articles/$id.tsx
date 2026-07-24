import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PILLARS, RESOURCE_TYPES, type Pillar, type ResourceType, type ContentBlock } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/admin/articles/$id")({
  head: () => ({ meta: [{ title: "Edit article — Admin" }, { name: "robots", content: "noindex" }] }),
  component: EditArticle,
});

function EditArticle() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-article", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("articles").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState<{
    slug: string; title: string; description: string; pillar: Pillar; type: ResourceType;
    read_time: string; author_name: string; author_role: string; tags: string;
    body: string; published: boolean; downloadable: boolean;
  } | null>(null);

  useEffect(() => {
    if (!data) return;
    setForm({
      slug: data.slug,
      title: data.title,
      description: data.description,
      pillar: data.pillar as Pillar,
      type: data.type as ResourceType,
      read_time: data.read_time,
      author_name: data.author_name,
      author_role: data.author_role ?? "",
      read_time: data.read_time ?? "",
      tags: (data.tags ?? []).join(", "),
      body: JSON.stringify(data.body ?? [], null, 2),
      published: data.published,
      downloadable: data.downloadable,
    });
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form) return;
      let body: ContentBlock[] = [];
      try { body = JSON.parse(form.body); } catch { throw new Error("Body must be valid JSON."); }
      const { error } = await supabase.from("articles").update({
        slug: form.slug,
        title: form.title,
        description: form.description,
        pillar: form.pillar,
        type: form.type,
        read_time: form.read_time,
        author_name: form.author_name,
        author_role: form.author_role || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        body: body as unknown as never,
        published: form.published,
        downloadable: form.downloadable,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.invalidateQueries({ queryKey: ["admin-article", id] });
      navigate({ to: "/admin/articles" });
    },
  });

  if (isLoading || !form) return <p className="text-muted-foreground">Loading…</p>;

  const setF = <K extends keyof NonNullable<typeof form>>(k: K, v: NonNullable<typeof form>[K]) =>
    setForm((p) => (p ? { ...p, [k]: v } : p));

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/admin/articles" className="text-sm font-semibold hover:underline" style={{ color: "var(--heart)" }}>← Articles</Link>
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
        className="grid gap-4 rounded-3xl border border-border bg-card p-6"
      >
        <Row label="Title"><input className={inputCls} value={form.title} onChange={(e) => setF("title", e.target.value)} /></Row>
        <Row label="Slug"><input className={inputCls} value={form.slug} onChange={(e) => setF("slug", e.target.value)} /></Row>
        <Row label="Description"><textarea className={inputCls} rows={3} value={form.description} onChange={(e) => setF("description", e.target.value)} /></Row>
        <div className="grid gap-4 sm:grid-cols-2">
          <Row label="Pillar">
            <select className={inputCls} value={form.pillar} onChange={(e) => setF("pillar", e.target.value as Pillar)}>
              {Object.entries(PILLARS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
            </select>
          </Row>
          <Row label="Type">
            <select className={inputCls} value={form.type} onChange={(e) => setF("type", e.target.value as ResourceType)}>
              {Object.entries(RESOURCE_TYPES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
            </select>
          </Row>
          <Row label="Read time"><input className={inputCls} value={form.read_time} onChange={(e) => setF("read_time", e.target.value)} /></Row>
          <Row label="Author name"><input className={inputCls} value={form.author_name} onChange={(e) => setF("author_name", e.target.value)} /></Row>
          <Row label="Author role"><input className={inputCls} value={form.author_role} onChange={(e) => setF("author_role", e.target.value)} /></Row>
          <Row label="Tags (comma-separated)"><input className={inputCls} value={form.tags} onChange={(e) => setF("tags", e.target.value)} /></Row>
        </div>
        <Row label='Body (JSON: [{"kind":"p","text":"…"},{"kind":"h2","text":"…"},{"kind":"quote","text":"…","arabic":"…","source":"…"}])'>
          <textarea className={`${inputCls} font-mono text-xs`} rows={16} value={form.body} onChange={(e) => setF("body", e.target.value)} />
        </Row>
        <div className="flex flex-wrap gap-6">
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={form.published} onChange={(e) => setF("published", e.target.checked)} /> Published
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={form.downloadable} onChange={(e) => setF("downloadable", e.target.checked)} /> Downloadable
          </label>
        </div>
        {save.error && <p className="text-sm" style={{ color: "var(--heart)" }}>{(save.error as Error).message}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={save.isPending} className="btn-primary">{save.isPending ? "Saving…" : "Save"}</button>
          <Link to="/admin/articles" className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full rounded-2xl border border-input bg-background px-4 py-2.5 outline-none focus:border-heart";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
