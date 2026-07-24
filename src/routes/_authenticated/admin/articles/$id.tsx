import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Type as TypeIcon,
  Heading1,
  Heading2,
  Quote,
  Minus,
  List as ListIcon,
  ListOrdered,
  Image as ImageIcon,
  Lightbulb,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PILLARS, RESOURCE_TYPES, type Pillar, type ResourceType, type ContentBlock } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/admin/articles/$id")({
  head: () => ({ meta: [{ title: "Edit article — Admin" }, { name: "robots", content: "noindex" }] }),
  component: EditArticle,
});

type BlockKind = ContentBlock["kind"];

const BLOCK_PALETTE: { kind: BlockKind; label: string; icon: React.ComponentType<{ className?: string }>; make: () => ContentBlock }[] = [
  { kind: "p", label: "Paragraph", icon: TypeIcon, make: () => ({ kind: "p", text: "" }) },
  { kind: "h2", label: "Heading", icon: Heading1, make: () => ({ kind: "h2", text: "" }) },
  { kind: "h3", label: "Subheading", icon: Heading2, make: () => ({ kind: "h3", text: "" }) },
  { kind: "quote", label: "Qur'an / quote", icon: Quote, make: () => ({ kind: "quote", text: "", arabic: "", source: "" }) },
  { kind: "callout", label: "Callout", icon: Lightbulb, make: () => ({ kind: "callout", text: "" }) },
  { kind: "list", label: "Bullet list", icon: ListIcon, make: () => ({ kind: "list", items: [""], ordered: false }) },
  { kind: "list", label: "Numbered list", icon: ListOrdered, make: () => ({ kind: "list", items: [""], ordered: true }) },
  { kind: "image", label: "Image", icon: ImageIcon, make: () => ({ kind: "image", src: "", alt: "", caption: "" }) },
  { kind: "divider", label: "Divider", icon: Minus, make: () => ({ kind: "divider" }) },
];

function wordsIn(blocks: ContentBlock[]): number {
  const text = blocks.map((b) => {
    if (b.kind === "list") return b.items.join(" ");
    if (b.kind === "image") return `${b.alt ?? ""} ${b.caption ?? ""}`;
    if (b.kind === "divider") return "";
    if (b.kind === "quote") return `${b.text} ${b.arabic ?? ""} ${b.source ?? ""}`;
    return b.text;
  }).join(" ");
  const w = text.trim().split(/\s+/).filter(Boolean).length;
  return w;
}

function readTimeFrom(blocks: ContentBlock[]): string {
  const w = wordsIn(blocks);
  const mins = Math.max(1, Math.round(w / 200));
  return `${mins} min`;
}

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

  const { data: authorSuggestions = [] } = useQuery({
    queryKey: ["admin-article-authors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("articles").select("author_name,author_role").limit(500);
      if (error) throw error;
      const map = new Map<string, string>();
      (data ?? []).forEach((r) => { if (r.author_name && !map.has(r.author_name)) map.set(r.author_name, r.author_role ?? ""); });
      return Array.from(map, ([name, role]) => ({ name, role }));
    },
  });

  const [form, setForm] = useState<{
    slug: string; title: string; description: string; pillar: Pillar; type: ResourceType;
    author_name: string; author_role: string; tags: string;
    blocks: ContentBlock[]; published: boolean; downloadable: boolean;
  } | null>(null);

  useEffect(() => {
    if (!data) return;
    setForm({
      slug: data.slug,
      title: data.title,
      description: data.description,
      pillar: data.pillar as Pillar,
      type: data.type as ResourceType,
      author_name: data.author_name,
      author_role: data.author_role ?? "",
      tags: (data.tags ?? []).join(", "),
      blocks: Array.isArray(data.body) ? (data.body as unknown as ContentBlock[]) : [],
      published: data.published,
      downloadable: data.downloadable,
    });
  }, [data]);

  const readTime = useMemo(() => (form ? readTimeFrom(form.blocks) : "1 min"), [form]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const { error } = await supabase.from("articles").update({
        slug: form.slug,
        title: form.title,
        description: form.description,
        pillar: form.pillar,
        type: form.type,
        read_time: readTimeFrom(form.blocks),
        author_name: form.author_name,
        author_role: form.author_role || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        body: form.blocks as unknown as never,
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

  const updateBlock = (i: number, patch: Partial<ContentBlock>) =>
    setForm((p) => p ? { ...p, blocks: p.blocks.map((b, idx) => idx === i ? ({ ...b, ...patch } as ContentBlock) : b) } : p);

  const insertBlock = (block: ContentBlock, at?: number) =>
    setForm((p) => {
      if (!p) return p;
      const idx = typeof at === "number" ? at : p.blocks.length;
      const next = [...p.blocks];
      next.splice(idx, 0, block);
      return { ...p, blocks: next };
    });

  const moveBlock = (i: number, dir: -1 | 1) =>
    setForm((p) => {
      if (!p) return p;
      const j = i + dir;
      if (j < 0 || j >= p.blocks.length) return p;
      const next = [...p.blocks];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...p, blocks: next };
    });

  const removeBlock = (i: number) =>
    setForm((p) => p ? { ...p, blocks: p.blocks.filter((_, idx) => idx !== i) } : p);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link to="/admin/articles" className="text-sm font-semibold hover:underline" style={{ color: "var(--heart)" }}>← Articles</Link>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{wordsIn(form.blocks)} words · {readTime}</span>
          <label className="inline-flex items-center gap-2 font-semibold">
            <input type="checkbox" checked={form.published} onChange={(e) => setF("published", e.target.checked)} /> Published
          </label>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="btn-primary !py-2 !px-4 !text-sm"
          >
            {save.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        {/* Editor */}
        <div className="space-y-5 rounded-3xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Row label="Title" full>
              <input className={inputCls} value={form.title} onChange={(e) => setF("title", e.target.value)} />
            </Row>
            <Row label="Slug">
              <input className={inputCls} value={form.slug} onChange={(e) => setF("slug", e.target.value)} />
            </Row>
            <Row label="Tags (comma-separated)">
              <input className={inputCls} value={form.tags} onChange={(e) => setF("tags", e.target.value)} />
            </Row>
            <Row label="Pillar (category)">
              <select className={inputCls} value={form.pillar} onChange={(e) => setF("pillar", e.target.value as Pillar)}>
                {Object.entries(PILLARS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
              </select>
            </Row>
            <Row label="Format (type)">
              <select className={inputCls} value={form.type} onChange={(e) => setF("type", e.target.value as ResourceType)}>
                {Object.entries(RESOURCE_TYPES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
              </select>
            </Row>
            <Row label="Author">
              <input list="author-list" className={inputCls} value={form.author_name} onChange={(e) => {
                const name = e.target.value;
                const match = authorSuggestions.find((a) => a.name === name);
                setForm((p) => p ? { ...p, author_name: name, author_role: match?.role ?? p.author_role } : p);
              }} />
              <datalist id="author-list">
                {authorSuggestions.map((a) => <option key={a.name} value={a.name} />)}
              </datalist>
            </Row>
            <Row label="Author role">
              <input className={inputCls} value={form.author_role} onChange={(e) => setF("author_role", e.target.value)} />
            </Row>
            <Row label="Description" full>
              <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setF("description", e.target.value)} />
            </Row>
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">Body</p>
            <div className="space-y-3">
              {form.blocks.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Empty. Add a block from the side menu →
                </p>
              )}
              {form.blocks.map((block, i) => (
                <BlockEditor
                  key={i}
                  block={block}
                  onChange={(patch) => updateBlock(i, patch)}
                  onRemove={() => removeBlock(i)}
                  onMove={(d) => moveBlock(i, d)}
                  canUp={i > 0}
                  canDown={i < form.blocks.length - 1}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-6 border-t border-border pt-4">
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={form.downloadable} onChange={(e) => setF("downloadable", e.target.checked)} /> Downloadable
            </label>
          </div>

          {save.error && <p className="text-sm" style={{ color: "var(--heart)" }}>{(save.error as Error).message}</p>}
        </div>

        {/* Sidebar palette */}
        <aside className="h-fit rounded-3xl border border-border bg-card p-4 lg:sticky lg:top-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Insert block</p>
          <div className="grid grid-cols-2 gap-2">
            {BLOCK_PALETTE.map((p) => (
              <button
                key={p.label}
                onClick={() => insertBlock(p.make())}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-border px-2 py-3 text-xs font-semibold hover:bg-secondary"
              >
                <p.icon className="h-4 w-4" />
                {p.label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Reading time updates automatically.
          </p>
        </aside>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-2xl border border-input bg-background px-4 py-2.5 outline-none focus:border-heart";

function Row({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

function BlockEditor({
  block, onChange, onRemove, onMove, canUp, canDown,
}: {
  block: ContentBlock;
  onChange: (patch: Partial<ContentBlock>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  canUp: boolean;
  canDown: boolean;
}) {
  return (
    <div className="group relative rounded-2xl border border-border bg-background p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{labelFor(block)}</span>
        <div className="flex items-center gap-1">
          <IconBtn onClick={() => onMove(-1)} disabled={!canUp} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn onClick={() => onMove(1)} disabled={!canDown} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn onClick={onRemove} aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></IconBtn>
        </div>
      </div>
      <BlockBody block={block} onChange={onChange} />
    </div>
  );
}

function labelFor(b: ContentBlock): string {
  switch (b.kind) {
    case "p": return "Paragraph";
    case "h2": return "Heading";
    case "h3": return "Subheading";
    case "quote": return "Qur'an / quote";
    case "callout": return "Callout";
    case "list": return b.ordered ? "Numbered list" : "Bullet list";
    case "image": return "Image";
    case "divider": return "Divider";
  }
}

function BlockBody({ block, onChange }: { block: ContentBlock; onChange: (patch: Partial<ContentBlock>) => void }) {
  if (block.kind === "divider") {
    return <hr className="my-2 border-t border-border" />;
  }
  if (block.kind === "p") {
    return <textarea rows={3} className={inputCls} placeholder="Write a paragraph…" value={block.text} onChange={(e) => onChange({ text: e.target.value } as Partial<ContentBlock>)} />;
  }
  if (block.kind === "h2") {
    return <input className={`${inputCls} font-display text-xl`} placeholder="Heading" value={block.text} onChange={(e) => onChange({ text: e.target.value } as Partial<ContentBlock>)} />;
  }
  if (block.kind === "h3") {
    return <input className={`${inputCls} font-display text-lg`} placeholder="Subheading" value={block.text} onChange={(e) => onChange({ text: e.target.value } as Partial<ContentBlock>)} />;
  }
  if (block.kind === "callout") {
    return <textarea rows={2} className={inputCls} placeholder="Callout text" value={block.text} onChange={(e) => onChange({ text: e.target.value } as Partial<ContentBlock>)} />;
  }
  if (block.kind === "quote") {
    return (
      <div className="grid gap-2">
        <input dir="rtl" className={`${inputCls} font-arabic text-xl`} placeholder="النص العربي (اختياري)" value={block.arabic ?? ""} onChange={(e) => onChange({ arabic: e.target.value } as Partial<ContentBlock>)} />
        <textarea rows={2} className={inputCls} placeholder="Translation / quote" value={block.text} onChange={(e) => onChange({ text: e.target.value } as Partial<ContentBlock>)} />
        <input className={inputCls} placeholder="Source (e.g. Qur'an 94:5–6)" value={block.source ?? ""} onChange={(e) => onChange({ source: e.target.value } as Partial<ContentBlock>)} />
      </div>
    );
  }
  if (block.kind === "list") {
    return (
      <div className="space-y-2">
        {block.items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <span className="pt-2 text-xs text-muted-foreground">{block.ordered ? `${i + 1}.` : "•"}</span>
            <input className={inputCls} placeholder="List item" value={it} onChange={(e) => {
              const items = block.items.slice();
              items[i] = e.target.value;
              onChange({ items } as Partial<ContentBlock>);
            }} />
            <button
              type="button"
              onClick={() => onChange({ items: block.items.filter((_, j) => j !== i) } as Partial<ContentBlock>)}
              className="rounded-full border border-border px-2 text-xs hover:bg-secondary"
              aria-label="Remove item"
            >×</button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ items: [...block.items, ""] } as Partial<ContentBlock>)}
          className="text-xs font-semibold hover:underline"
          style={{ color: "var(--heart)" }}
        >+ Add item</button>
      </div>
    );
  }
  if (block.kind === "image") {
    return (
      <div className="grid gap-2">
        <input className={inputCls} placeholder="Image URL" value={block.src} onChange={(e) => onChange({ src: e.target.value } as Partial<ContentBlock>)} />
        <input className={inputCls} placeholder="Alt text" value={block.alt ?? ""} onChange={(e) => onChange({ alt: e.target.value } as Partial<ContentBlock>)} />
        <input className={inputCls} placeholder="Caption (optional)" value={block.caption ?? ""} onChange={(e) => onChange({ caption: e.target.value } as Partial<ContentBlock>)} />
        {block.src && <img src={block.src} alt={block.alt ?? ""} className="mt-1 max-h-48 rounded-xl object-cover" />}
      </div>
    );
  }
  return null;
}

function IconBtn({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40"
    >
      {children}
    </button>
  );
}
