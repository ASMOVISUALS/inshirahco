import { useEffect, useMemo, useRef, useState } from "react";
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
  GripVertical,
  Pencil,
  X,
  Check,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PILLARS, RESOURCE_TYPES, type Pillar, type ResourceType, type ContentBlock } from "@/lib/content";
import { LetterMark } from "@/components/LetterMark";

export const Route = createFileRoute("/_authenticated/admin/articles/$id")({
  head: () => ({ meta: [{ title: "Edit article — Admin" }, { name: "robots", content: "noindex" }] }),
  component: EditArticle,
});

/* ---------------- utils ---------------- */

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
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function readTimeFrom(blocks: ContentBlock[]): string {
  const mins = Math.max(1, Math.round(wordsIn(blocks) / 200));
  return `${mins} min`;
}

/* ---------------- root component ---------------- */

type Form = {
  slug: string; title: string; description: string; pillar: Pillar; type: ResourceType;
  author_name: string; author_role: string; tags: string;
  blocks: ContentBlock[]; published: boolean; downloadable: boolean;
};

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

  const [form, setForm] = useState<Form | null>(null);
  const [mode, setMode] = useState<"preview" | "meta" | "body">("preview");

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

  // Author avatar lookup (from profiles.name → avatar_url)
  const { data: authorProfile } = useQuery({
    queryKey: ["profile-by-name", form?.author_name],
    enabled: !!form?.author_name,
    queryFn: async () => {
      if (!form?.author_name) return null;
      const { data } = await supabase
        .from("profiles")
        .select("name,avatar_url,bio")
        .ilike("name", form.author_name)
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (patch: Partial<Form>) => {
      if (!form) return;
      const next = { ...form, ...patch };
      const { error } = await supabase.from("articles").update({
        slug: next.slug,
        title: next.title,
        description: next.description,
        pillar: next.pillar,
        type: next.type,
        read_time: readTimeFrom(next.blocks),
        author_name: next.author_name,
        author_role: next.author_role || null,
        tags: next.tags.split(",").map((t) => t.trim()).filter(Boolean),
        body: next.blocks as unknown as never,
        published: next.published,
        downloadable: next.downloadable,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.invalidateQueries({ queryKey: ["admin-article", id] });
    },
  });

  if (isLoading || !form) return <p className="text-muted-foreground">Loading…</p>;

  const pillar = PILLARS[form.pillar];
  const type = RESOURCE_TYPES[form.type];

  /* Full-screen body editing suite */
  if (mode === "body") {
    return (
      <BodyEditor
        blocks={form.blocks}
        onCancel={() => setMode("preview")}
        onSave={(blocks) => {
          setForm({ ...form, blocks });
          save.mutate({ blocks }, { onSuccess: () => setMode("preview") });
        }}
        saving={save.isPending}
      />
    );
  }

  return (
    <div>
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link to="/admin/articles" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline" style={{ color: "var(--heart)" }}>
          <ArrowLeft className="h-4 w-4" /> Articles
        </Link>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{wordsIn(form.blocks)} words · {readTimeFrom(form.blocks)}</span>
          <label className="inline-flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => {
                const published = e.target.checked;
                setForm({ ...form, published });
                save.mutate({ published });
              }}
            /> Published
          </label>
          {save.isPending && <span>Saving…</span>}
          {save.isSuccess && !save.isPending && <span className="text-tazkiyah">Saved</span>}
        </div>
      </div>

      {/* META SECTION */}
      <section className="relative mb-8 rounded-3xl border border-border bg-card">
        <SectionEditBar
          label="Details"
          isEditing={mode === "meta"}
          onEdit={() => setMode("meta")}
          onCancel={() => { setMode("preview"); if (data) setForm({ ...form, /* reset */ ...formFromRow(data) }); }}
          onSave={() => save.mutate({}, { onSuccess: () => setMode("preview") })}
          saving={save.isPending}
        />
        <div className="p-8 md:p-10">
          <MetaBlock
            form={form}
            setForm={setForm}
            editing={mode === "meta"}
            pillar={pillar}
            type={type}
            authorAvatar={authorProfile?.avatar_url ?? null}
          />
        </div>
      </section>

      {/* BODY SECTION */}
      <section className="relative rounded-3xl border border-border bg-card">
        <SectionEditBar
          label="Body"
          isEditing={false}
          onEdit={() => setMode("body")}
          editLabel="Open editor"
        />
        <div className="p-8 md:p-10">
          {form.blocks.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Empty. Click <span className="font-semibold">Open editor</span> to add blocks.
            </p>
          ) : (
            <ArticleBodyView blocks={form.blocks} />
          )}
        </div>
      </section>
    </div>
  );
}

function formFromRow(data: {
  slug: string; title: string; description: string; pillar: string; type: string;
  author_name: string; author_role: string | null; tags: string[]; body: unknown;
  published: boolean; downloadable: boolean;
}): Form {
  return {
    slug: data.slug,
    title: data.title,
    description: data.description,
    pillar: data.pillar as Pillar,
    type: data.type as ResourceType,
    author_name: data.author_name,
    author_role: data.author_role ?? "",
    tags: (data.tags ?? []).join(", "),
    blocks: Array.isArray(data.body) ? (data.body as ContentBlock[]) : [],
    published: data.published,
    downloadable: data.downloadable,
  };
}

/* ---------------- Section edit bar ---------------- */

function SectionEditBar({
  label, isEditing, onEdit, onCancel, onSave, saving, editLabel = "Edit",
}: {
  label: string;
  isEditing: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  saving?: boolean;
  editLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border px-6 py-3">
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      {isEditing ? (
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="inline-flex items-center gap-1.5 rounded-pill border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
          <button onClick={onSave} disabled={saving} className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "var(--heart)" }}>
            <Check className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      ) : (
        <button onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-pill border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">
          <Pencil className="h-3.5 w-3.5" /> {editLabel}
        </button>
      )}
    </div>
  );
}

/* ---------------- Meta block (inline editable) ---------------- */

function MetaBlock({
  form, setForm, editing, pillar, type, authorAvatar,
}: {
  form: Form;
  setForm: (f: Form) => void;
  editing: boolean;
  pillar: (typeof PILLARS)[Pillar];
  type: (typeof RESOURCE_TYPES)[ResourceType];
  authorAvatar: string | null;
}) {
  return (
    <header className="mx-auto max-w-3xl">
      {/* Pillar eyebrow */}
      <EditableInline editing={editing}>
        {editing ? (
          <select
            className="eyebrow rounded-md border border-input bg-background px-2 py-1"
            value={form.pillar}
            onChange={(e) => setForm({ ...form, pillar: e.target.value as Pillar })}
          >
            {Object.entries(PILLARS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
          </select>
        ) : (
          <span className="eyebrow">{pillar.label}</span>
        )}
      </EditableInline>

      {/* Title */}
      <div className="mt-5">
        <EditableInline editing={editing} block>
          {editing ? (
            <textarea
              rows={2}
              className="w-full resize-none bg-transparent font-display text-4xl leading-[1.05] outline-none md:text-6xl"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          ) : (
            <h1 className="text-4xl leading-[1.05] md:text-6xl">{form.title}</h1>
          )}
        </EditableInline>
      </div>

      {/* Description */}
      <div className="mt-5">
        <EditableInline editing={editing} block>
          {editing ? (
            <textarea
              rows={3}
              className="w-full resize-none bg-transparent text-xl leading-relaxed text-muted-foreground outline-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          ) : (
            <p className="text-xl leading-relaxed text-muted-foreground">{form.description}</p>
          )}
        </EditableInline>
      </div>

      {/* Author + meta row */}
      <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-3">
          <AuthorAvatar avatar={authorAvatar} pillarLetter={pillar.letter} />
          <div>
            <EditableInline editing={editing}>
              {editing ? (
                <input
                  className="w-48 bg-transparent font-bold outline-none"
                  value={form.author_name}
                  onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                />
              ) : (
                <p className="font-bold">{form.author_name}</p>
              )}
            </EditableInline>
            <EditableInline editing={editing}>
              {editing ? (
                <input
                  className="w-56 bg-transparent text-xs text-muted-foreground outline-none"
                  placeholder="Author role"
                  value={form.author_role}
                  onChange={(e) => setForm({ ...form, author_role: e.target.value })}
                />
              ) : (
                form.author_role && <p className="text-xs text-muted-foreground">{form.author_role}</p>
              )}
            </EditableInline>
          </div>
        </div>

        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{readTimeFrom(form.blocks)}</span>
        <span className="text-muted-foreground">·</span>

        <EditableInline editing={editing}>
          {editing ? (
            <select
              className="rounded-pill border border-input bg-background px-3 py-1 font-semibold"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as ResourceType })}
            >
              {Object.entries(RESOURCE_TYPES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
            </select>
          ) : (
            <span className="rounded-pill border border-border px-3 py-1 font-semibold">{type.label}</span>
          )}
        </EditableInline>
      </div>

      {/* Slug + tags (only visible when editing) */}
      {editing && (
        <div className="mt-6 grid gap-3 rounded-2xl border border-dashed border-border p-4 sm:grid-cols-2">
          <label className="block text-xs">
            <span className="mb-1 block font-bold uppercase tracking-widest text-muted-foreground">Slug</span>
            <input className={inputCls} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block font-bold uppercase tracking-widest text-muted-foreground">Tags (comma-separated)</span>
            <input className={inputCls} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-semibold sm:col-span-2">
            <input type="checkbox" checked={form.downloadable} onChange={(e) => setForm({ ...form, downloadable: e.target.checked })} /> Downloadable
          </label>
        </div>
      )}
    </header>
  );
}

function AuthorAvatar({ avatar, pillarLetter }: { avatar: string | null; pillarLetter: string }) {
  if (avatar) {
    return <img src={avatar} alt="" className="h-10 w-10 rounded-full object-cover" />;
  }
  return <LetterMark letter={pillarLetter} tint="heart" size={40} />;
}

function EditableInline({ children, editing, block }: { children: React.ReactNode; editing: boolean; block?: boolean }) {
  const Tag: React.ElementType = block ? "div" : "span";
  return (
    <Tag
      className={
        editing
          ? "relative rounded-md ring-1 ring-dashed ring-border/60 transition hover:ring-heart focus-within:ring-2 focus-within:ring-heart -mx-1 px-1"
          : ""
      }
    >
      {children}
    </Tag>
  );
}

const inputCls = "w-full rounded-2xl border border-input bg-background px-4 py-2.5 outline-none focus:border-heart";

/* ---------------- Article body (published-style view) ---------------- */

function ArticleBodyView({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="prose-body mx-auto max-w-3xl space-y-6 text-[1.14rem] leading-[1.75] md:text-[1.18rem]">
      {blocks.map((block, i) => <RenderBlock key={i} block={block} />)}
    </div>
  );
}

function RenderBlock({ block }: { block: ContentBlock }) {
  if (block.kind === "h2") return <h2 className="mt-12 text-3xl md:text-4xl">{block.text || <span className="text-muted-foreground">Heading</span>}</h2>;
  if (block.kind === "h3") return <h3 className="mt-8 text-2xl md:text-3xl">{block.text || <span className="text-muted-foreground">Subheading</span>}</h3>;
  if (block.kind === "p") return <p>{block.text || <span className="text-muted-foreground">Empty paragraph</span>}</p>;
  if (block.kind === "divider") return <hr className="my-10 border-t border-border" />;
  if (block.kind === "callout") {
    return (
      <aside className="my-8 rounded-3xl border p-6" style={{ background: "color-mix(in oklab, var(--gold) 12%, var(--paper-warm))", borderColor: "color-mix(in oklab, var(--gold) 45%, transparent)" }}>
        <p className="font-display text-lg italic md:text-xl">{block.text || "Callout text"}</p>
      </aside>
    );
  }
  if (block.kind === "list") {
    const Tag = block.ordered ? "ol" : "ul";
    return (
      <Tag className={`my-4 ${block.ordered ? "list-decimal" : "list-disc"} space-y-2 pl-6`}>
        {block.items.map((it, j) => <li key={j}>{it || <span className="text-muted-foreground">Item</span>}</li>)}
      </Tag>
    );
  }
  if (block.kind === "image") {
    return (
      <figure className="my-8">
        {block.src ? (
          <img src={block.src} alt={block.alt ?? ""} className="w-full rounded-2xl" />
        ) : (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
            No image URL
          </div>
        )}
        {block.caption && <figcaption className="mt-2 text-center text-sm text-muted-foreground">{block.caption}</figcaption>}
      </figure>
    );
  }
  if (block.kind === "quote") {
    return (
      <blockquote className="my-10 rounded-3xl border-l-4 p-8" style={{ background: "color-mix(in oklab, var(--tazkiyah-soft) 35%, var(--paper-warm))", borderColor: "var(--tazkiyah)" }}>
        {block.arabic && (
          <p className="font-arabic text-3xl leading-loose md:text-4xl" dir="rtl" style={{ color: "var(--ink)" }}>
            {block.arabic}
          </p>
        )}
        {block.text && (
          <p className="mt-4 font-display text-xl italic md:text-2xl" style={{ fontVariationSettings: '"SOFT" 80, "WONK" 1' }}>
            "{block.text}"
          </p>
        )}
        {block.source && <footer className="mt-3 text-sm text-muted-foreground">— {block.source}</footer>}
      </blockquote>
    );
  }
  return null;
}

/* ---------------- Body editing suite (full page) ---------------- */

function BodyEditor({
  blocks: initial, onCancel, onSave, saving,
}: {
  blocks: ContentBlock[];
  onCancel: () => void;
  onSave: (blocks: ContentBlock[]) => void;
  saving: boolean;
}) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initial);
  const [focused, setFocused] = useState<number | null>(null);
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const insert = (b: ContentBlock, at?: number) => {
    setBlocks((prev) => {
      const idx = typeof at === "number" ? at : prev.length;
      const next = [...prev];
      next.splice(idx, 0, b);
      return next;
    });
  };

  const update = (i: number, patch: Partial<ContentBlock>) =>
    setBlocks((prev) => prev.map((b, idx) => idx === i ? ({ ...b, ...patch } as ContentBlock) : b));

  const remove = (i: number) => {
    setBlocks((prev) => prev.filter((_, idx) => idx !== i));
    setFocused(null);
  };

  const move = (from: number, to: number) => {
    if (from === to) return;
    setBlocks((prev) => {
      const next = [...prev];
      const [x] = next.splice(from, 1);
      next.splice(to > from ? to - 1 : to, 0, x);
      return next;
    });
  };

  // Click-off to blur
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest("[data-block]") && !el.closest("[data-palette]")) setFocused(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button onClick={onCancel} className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline" style={{ color: "var(--heart)" }}>
          <ArrowLeft className="h-4 w-4" /> Back to article
        </button>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Body editor</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{wordsIn(blocks)} words · {readTimeFrom(blocks)}</span>
          <button onClick={onCancel} className="rounded-pill border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Cancel</button>
          <button onClick={() => onSave(blocks)} disabled={saving} className="rounded-pill px-4 py-1.5 text-xs font-semibold text-white" style={{ background: "var(--heart)" }}>
            {saving ? "Saving…" : "Save & close"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left palette */}
        <aside data-palette className="w-16 shrink-0 border-r border-border bg-card py-3">
          <div className="flex flex-col items-center gap-1">
            {BLOCK_PALETTE.map((p) => (
              <button
                key={p.label}
                title={p.label}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-palette", p.label);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => insert(p.make())}
                className="group flex h-12 w-12 flex-col items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <p.icon className="h-4 w-4" />
                <span className="mt-0.5 text-[8px] font-semibold leading-none">{p.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <div className="flex-1 overflow-auto">
          <div className="prose-body mx-auto max-w-3xl space-y-4 px-6 py-10 text-[1.14rem] leading-[1.75] md:text-[1.18rem]">
            {blocks.length === 0 && (
              <div
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
                onDrop={(e) => {
                  e.preventDefault();
                  const label = e.dataTransfer.getData("application/x-palette");
                  const p = BLOCK_PALETTE.find((b) => b.label === label);
                  if (p) insert(p.make(), 0);
                }}
                className="rounded-2xl border border-dashed border-border p-16 text-center text-sm text-muted-foreground"
              >
                Click or drag a block from the left to begin.
              </div>
            )}

            {blocks.map((block, i) => (
              <div key={i}>
                {/* Drop zone above */}
                <DropZone
                  active={dragOver === i}
                  onEnter={() => setDragOver(i)}
                  onLeave={() => setDragOver(null)}
                  onDropPalette={(label) => {
                    const p = BLOCK_PALETTE.find((b) => b.label === label);
                    if (p) insert(p.make(), i);
                    setDragOver(null);
                  }}
                  onDropReorder={() => {
                    if (dragFrom.current !== null) move(dragFrom.current, i);
                    dragFrom.current = null;
                    setDragOver(null);
                  }}
                />

                <div
                  data-block
                  onClick={() => setFocused(i)}
                  className={`group relative rounded-xl px-4 py-2 transition ${
                    focused === i
                      ? "ring-2 ring-heart bg-heart/5"
                      : "hover:ring-1 hover:ring-border"
                  }`}
                >
                  {/* Drag grip */}
                  <button
                    draggable
                    onDragStart={(e) => {
                      dragFrom.current = i;
                      e.dataTransfer.setData("application/x-reorder", String(i));
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => { dragFrom.current = null; setDragOver(null); }}
                    className="absolute -left-8 top-1/2 -translate-y-1/2 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100 active:cursor-grabbing"
                    aria-label="Drag to reorder"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="h-5 w-5" />
                  </button>

                  {/* Delete button when focused */}
                  {focused === i && (
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(i); }}
                      className="absolute -right-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-heart"
                      aria-label="Remove block"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {focused === i ? (
                    <EditableBlock block={block} onChange={(patch) => update(i, patch)} />
                  ) : (
                    <RenderBlock block={block} />
                  )}
                </div>
              </div>
            ))}

            {/* Bottom drop zone */}
            {blocks.length > 0 && (
              <DropZone
                active={dragOver === blocks.length}
                onEnter={() => setDragOver(blocks.length)}
                onLeave={() => setDragOver(null)}
                onDropPalette={(label) => {
                  const p = BLOCK_PALETTE.find((b) => b.label === label);
                  if (p) insert(p.make());
                  setDragOver(null);
                }}
                onDropReorder={() => {
                  if (dragFrom.current !== null) move(dragFrom.current, blocks.length);
                  dragFrom.current = null;
                  setDragOver(null);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DropZone({
  active, onEnter, onLeave, onDropPalette, onDropReorder,
}: {
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onDropPalette: (label: string) => void;
  onDropReorder: () => void;
}) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onEnter(); }}
      onDragLeave={onLeave}
      onDrop={(e) => {
        e.preventDefault();
        const paletteLabel = e.dataTransfer.getData("application/x-palette");
        if (paletteLabel) { onDropPalette(paletteLabel); return; }
        onDropReorder();
      }}
      className={`my-1 h-2 rounded-full transition ${active ? "bg-heart" : "bg-transparent"}`}
    />
  );
}

/* Inline editable variant of each block (matches published look) */
function EditableBlock({ block, onChange }: { block: ContentBlock; onChange: (patch: Partial<ContentBlock>) => void }) {
  const base = "w-full bg-transparent outline-none";
  if (block.kind === "p") {
    return <AutoTextarea className={base} placeholder="Write a paragraph…" value={block.text} onChange={(v) => onChange({ text: v } as Partial<ContentBlock>)} />;
  }
  if (block.kind === "h2") {
    return <AutoTextarea className={`${base} font-display text-3xl md:text-4xl`} placeholder="Heading" value={block.text} onChange={(v) => onChange({ text: v } as Partial<ContentBlock>)} rows={1} />;
  }
  if (block.kind === "h3") {
    return <AutoTextarea className={`${base} font-display text-2xl md:text-3xl`} placeholder="Subheading" value={block.text} onChange={(v) => onChange({ text: v } as Partial<ContentBlock>)} rows={1} />;
  }
  if (block.kind === "callout") {
    return (
      <aside className="rounded-3xl border p-6" style={{ background: "color-mix(in oklab, var(--gold) 12%, var(--paper-warm))", borderColor: "color-mix(in oklab, var(--gold) 45%, transparent)" }}>
        <AutoTextarea className={`${base} font-display text-lg italic md:text-xl`} placeholder="Callout" value={block.text} onChange={(v) => onChange({ text: v } as Partial<ContentBlock>)} />
      </aside>
    );
  }
  if (block.kind === "quote") {
    return (
      <blockquote className="rounded-3xl border-l-4 p-8" style={{ background: "color-mix(in oklab, var(--tazkiyah-soft) 35%, var(--paper-warm))", borderColor: "var(--tazkiyah)" }}>
        <AutoTextarea
          dir="rtl"
          className={`${base} font-arabic text-3xl leading-loose md:text-4xl`}
          placeholder="النص العربي (اختياري)"
          value={block.arabic ?? ""}
          onChange={(v) => onChange({ arabic: v } as Partial<ContentBlock>)}
        />
        <AutoTextarea
          className={`${base} mt-4 font-display text-xl italic md:text-2xl`}
          placeholder="Translation / quote"
          value={block.text}
          onChange={(v) => onChange({ text: v } as Partial<ContentBlock>)}
        />
        <input
          className={`${base} mt-3 text-sm text-muted-foreground`}
          placeholder="Source (e.g. Qur'an 94:5–6)"
          value={block.source ?? ""}
          onChange={(e) => onChange({ source: e.target.value } as Partial<ContentBlock>)}
        />
      </blockquote>
    );
  }
  if (block.kind === "list") {
    const Tag = block.ordered ? "ol" : "ul";
    return (
      <Tag className={`${block.ordered ? "list-decimal" : "list-disc"} space-y-2 pl-6`}>
        {block.items.map((it, i) => (
          <li key={i} className="flex items-start gap-2">
            <input
              className={`${base} flex-1`}
              placeholder="Item"
              value={it}
              onChange={(e) => {
                const items = block.items.slice();
                items[i] = e.target.value;
                onChange({ items } as Partial<ContentBlock>);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const items = [...block.items];
                  items.splice(i + 1, 0, "");
                  onChange({ items } as Partial<ContentBlock>);
                }
              }}
            />
            <button
              type="button"
              onClick={() => onChange({ items: block.items.filter((_, j) => j !== i) } as Partial<ContentBlock>)}
              className="text-xs text-muted-foreground hover:text-heart"
              aria-label="Remove item"
            >×</button>
          </li>
        ))}
        <li className="list-none">
          <button
            type="button"
            onClick={() => onChange({ items: [...block.items, ""] } as Partial<ContentBlock>)}
            className="text-xs font-semibold hover:underline"
            style={{ color: "var(--heart)" }}
          >+ Add item</button>
        </li>
      </Tag>
    );
  }
  if (block.kind === "image") {
    return (
      <figure className="space-y-2">
        {block.src && <img src={block.src} alt={block.alt ?? ""} className="w-full rounded-2xl" />}
        <input className={`${base} rounded-md border border-dashed border-border px-2 py-1 text-sm`} placeholder="Image URL" value={block.src} onChange={(e) => onChange({ src: e.target.value } as Partial<ContentBlock>)} />
        <input className={`${base} rounded-md border border-dashed border-border px-2 py-1 text-sm`} placeholder="Alt text" value={block.alt ?? ""} onChange={(e) => onChange({ alt: e.target.value } as Partial<ContentBlock>)} />
        <input className={`${base} rounded-md border border-dashed border-border px-2 py-1 text-center text-sm text-muted-foreground`} placeholder="Caption (optional)" value={block.caption ?? ""} onChange={(e) => onChange({ caption: e.target.value } as Partial<ContentBlock>)} />
      </figure>
    );
  }
  if (block.kind === "divider") {
    return <hr className="border-t border-border" />;
  }
  return null;
}

function AutoTextarea({
  value, onChange, className, placeholder, rows = 2, dir,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  rows?: number;
  dir?: "rtl" | "ltr";
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };
  useEffect(() => { resize(); }, [value]);
  return (
    <textarea
      ref={ref}
      dir={dir}
      autoFocus
      rows={rows}
      className={`${className ?? ""} resize-none overflow-hidden`}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// silence unused-import (kept for potential future use)
void useMemo;
