import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ChevronUp, ChevronDown, Undo2, Redo2, ExternalLink, Monitor, Tablet, Smartphone, LayoutGrid, FileJson } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  BLOCK_CATEGORIES,
  BLOCK_LABEL,
  PageRenderer,
  newBlock,
  type Block,
  type BlockType,
  isBlockArray,
} from "@/lib/page-blocks";

export const Route = createFileRoute("/_authenticated/admin/pages")({
  head: () => ({ meta: [{ title: "Pages — Admin" }, { name: "robots", content: "noindex" }] }),
  component: PagesAdmin,
});

interface PageRow {
  key: string;
  slug: string;
  title: string;
  is_published: boolean;
  content: Record<string, unknown>;
}

function PagesAdmin() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "pages"],
    queryFn: async (): Promise<PageRow[]> => {
      const { data, error } = await supabase
        .from("pages")
        .select("key,slug,title,is_published,content")
        .order("key");
      if (error) throw error;
      return (data ?? []) as PageRow[];
    },
  });

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  useEffect(() => { if (!selectedKey && data.length > 0) setSelectedKey(data[0].key); }, [data, selectedKey]);

  const selected = data.find((r) => r.key === selectedKey) ?? null;

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <PageList rows={data} selectedKey={selectedKey} onSelect={setSelectedKey} onCreated={(k) => setSelectedKey(k)} />
      {selected ? (
        <PageBuilder key={selected.key} row={selected} onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "pages"] })} />
      ) : (
        <p className="text-muted-foreground">Pick a page.</p>
      )}
    </div>
  );
}

function PageList({
  rows, selectedKey, onSelect, onCreated,
}: {
  rows: PageRow[]; selectedKey: string | null;
  onSelect: (k: string) => void; onCreated: (k: string) => void;
}) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      const t = title.trim();
      const s = slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
      if (!t || !s) throw new Error("Title and slug are required.");
      if (rows.some((r) => r.slug === s || r.key === s)) throw new Error("Slug already exists.");
      const key = `custom:${s}`;
      const { error } = await supabase
        .from("pages")
        .insert({ key, slug: s, title: t, is_published: true, template: "blank", content: { blocks: [] } as never });
      if (error) throw error;
      return key;
    },
    onSuccess: (key) => {
      setCreating(false); setTitle(""); setSlug(""); setErr(null);
      qc.invalidateQueries({ queryKey: ["admin", "pages"] });
      onCreated(key);
    },
    onError: (e: Error) => setErr(e.message),
  });

  const core = rows.filter((r) => !r.key.startsWith("pillar:") && !r.key.startsWith("custom:"));
  const pillars = rows.filter((r) => r.key.startsWith("pillar:"));
  const custom = rows.filter((r) => r.key.startsWith("custom:"));

  return (
    <aside className="rounded-3xl border border-border bg-card p-4 h-fit">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pages</p>
        <button className="btn-ghost text-xs" onClick={() => setCreating((c) => !c)}>
          <Plus className="h-3.5 w-3.5" /> New
        </button>
      </div>

      {creating && (
        <div className="mb-4 rounded-2xl border border-border bg-background p-3">
          <input className="mb-2 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm" placeholder="Page title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="mb-2 w-full rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs" placeholder="url-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          {err && <p className="mb-2 text-xs text-destructive">{err}</p>}
          <div className="flex gap-2">
            <button className="btn-primary text-xs" disabled={create.isPending} onClick={() => create.mutate()}>Create</button>
            <button className="btn-ghost text-xs" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      <Group label="Core" rows={core} selectedKey={selectedKey} onSelect={onSelect} />
      {pillars.length > 0 && <Group label="Pillars" rows={pillars} selectedKey={selectedKey} onSelect={onSelect} />}
      {custom.length > 0 && <Group label="Custom" rows={custom} selectedKey={selectedKey} onSelect={onSelect} />}
    </aside>
  );
}

function Group({ label, rows, selectedKey, onSelect }: { label: string; rows: PageRow[]; selectedKey: string | null; onSelect: (k: string) => void }) {
  return (
    <div className="mb-4">
      <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{label}</p>
      <ul className="flex flex-col gap-1">
        {rows.map((r) => (
          <li key={r.key}>
            <button
              onClick={() => onSelect(r.key)}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm ${selectedKey === r.key ? "bg-secondary" : "hover:bg-secondary"}`}
            >
              <div className="font-semibold">{r.title || r.slug}</div>
              <div className="font-mono text-[10px] text-muted-foreground">/{r.slug}</div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// -------- Builder --------

function PageBuilder({ row, onSaved }: { row: PageRow; onSaved: () => void }) {
  const initialBlocks = useMemo(() => {
    const b = row.content?.blocks;
    return isBlockArray(b) ? (b as Block[]) : [];
  }, [row]);

  const legacyKeys = useMemo(() => {
    return Object.keys(row.content ?? {}).filter((k) => k !== "blocks");
  }, [row]);

  const [tab, setTab] = useState<"layout" | "fields">(legacyKeys.length > 0 && initialBlocks.length === 0 ? "fields" : "layout");

  return (
    <div className="rounded-3xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-xl font-bold">{row.title || row.slug}</h2>
          <p className="font-mono text-xs text-muted-foreground">key: {row.key} · slug: /{row.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/${row.slug}`} target="_blank" rel="noreferrer" className="btn-ghost text-xs">
            <ExternalLink className="h-3.5 w-3.5" /> View live
          </a>
          {legacyKeys.length > 0 && (
            <div className="flex overflow-hidden rounded-lg border border-border text-xs">
              <button className={`px-3 py-1.5 ${tab === "layout" ? "bg-secondary font-semibold" : ""}`} onClick={() => setTab("layout")}>
                <LayoutGrid className="mr-1 inline h-3 w-3" /> Layout
              </button>
              <button className={`px-3 py-1.5 ${tab === "fields" ? "bg-secondary font-semibold" : ""}`} onClick={() => setTab("fields")}>
                <FileJson className="mr-1 inline h-3 w-3" /> Fields (legacy)
              </button>
            </div>
          )}
        </div>
      </div>

      {tab === "layout" ? (
        <LayoutBuilder row={row} initialBlocks={initialBlocks} onSaved={onSaved} legacyPresent={legacyKeys.length > 0} />
      ) : (
        <LegacyFieldsEditor row={row} onSaved={onSaved} />
      )}
    </div>
  );
}

// -------- Layout builder --------

function LayoutBuilder({
  row, initialBlocks, onSaved, legacyPresent,
}: {
  row: PageRow; initialBlocks: Block[]; onSaved: () => void; legacyPresent: boolean;
}) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [history, setHistory] = useState<Block[][]>([initialBlocks]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const commit = (next: Block[]) => {
    setBlocks(next);
    const trimmed = history.slice(0, historyIdx + 1);
    trimmed.push(next);
    setHistory(trimmed);
    setHistoryIdx(trimmed.length - 1);
  };

  const undo = () => { if (historyIdx > 0) { setHistoryIdx(historyIdx - 1); setBlocks(history[historyIdx - 1]); } };
  const redo = () => { if (historyIdx < history.length - 1) { setHistoryIdx(historyIdx + 1); setBlocks(history[historyIdx + 1]); } };

  const addBlock = (type: BlockType) => {
    const b = newBlock(type);
    commit([...blocks, b]);
    setSelectedId(b.id);
  };
  const removeBlock = (id: string) => { commit(blocks.filter((b) => b.id !== id)); if (selectedId === id) setSelectedId(null); };
  const moveBlock = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const j = idx + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[j]] = [next[j], next[idx]];
    commit(next);
  };
  const updateBlock = (id: string, props: Record<string, unknown>) => {
    commit(blocks.map((b) => (b.id === id ? { ...b, props } : b)));
  };

  const save = useMutation({
    mutationFn: async () => {
      const nextContent = { ...(row.content ?? {}), blocks };
      const { error } = await supabase.from("pages").update({ content: nextContent as never }).eq("key", row.key);
      if (error) throw error;
    },
    onSuccess: () => {
      setStatus({ kind: "ok", msg: "Saved." });
      onSaved();
    },
    onError: (e: Error) => setStatus({ kind: "err", msg: e.message }),
  });

  const selected = blocks.find((b) => b.id === selectedId) ?? null;
  const vpWidth = viewport === "desktop" ? "100%" : viewport === "tablet" ? "820px" : "390px";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_360px]">
      {/* Palette */}
      <div className="border-r border-border p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Blocks</p>
        <div className="flex flex-col gap-4">
          {BLOCK_CATEGORIES.map((cat) => (
            <div key={cat.key}>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">{cat.label}</p>
              <div className="flex flex-col gap-1">
                {cat.items.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => addBlock(item.type)}
                    className="rounded-md px-2 py-1.5 text-left text-xs font-semibold hover:bg-secondary"
                    title={item.description}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Block list + preview */}
      <div className="flex flex-col border-r border-border">
        <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs">
          <div className="flex items-center gap-1">
            <button className="btn-ghost !p-1" onClick={undo} disabled={historyIdx === 0} title="Undo"><Undo2 className="h-3.5 w-3.5" /></button>
            <button className="btn-ghost !p-1" onClick={redo} disabled={historyIdx >= history.length - 1} title="Redo"><Redo2 className="h-3.5 w-3.5" /></button>
          </div>
          <div className="flex items-center gap-1">
            <button className={`btn-ghost !p-1 ${viewport === "desktop" ? "bg-secondary" : ""}`} onClick={() => setViewport("desktop")} title="Desktop"><Monitor className="h-3.5 w-3.5" /></button>
            <button className={`btn-ghost !p-1 ${viewport === "tablet" ? "bg-secondary" : ""}`} onClick={() => setViewport("tablet")} title="Tablet"><Tablet className="h-3.5 w-3.5" /></button>
            <button className={`btn-ghost !p-1 ${viewport === "mobile" ? "bg-secondary" : ""}`} onClick={() => setViewport("mobile")} title="Mobile"><Smartphone className="h-3.5 w-3.5" /></button>
          </div>
          <div className="flex items-center gap-2">
            {status && (
              <span className={`text-[11px] font-semibold ${status.kind === "ok" ? "text-emerald-600" : "text-destructive"}`}>{status.msg}</span>
            )}
            <button className="btn-primary text-xs" onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {/* Block list */}
        <div className="border-b border-border p-3">
          {blocks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No blocks yet. Add one from the left.
            </div>
          )}
          <ul className="flex flex-col gap-1">
            {blocks.map((b, i) => (
              <li key={b.id}>
                <div className={`group flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${selectedId === b.id ? "border-heart bg-secondary" : "border-border hover:bg-secondary"}`}>
                  <button className="flex-1 text-left font-semibold" onClick={() => setSelectedId(b.id)}>
                    {i + 1}. {BLOCK_LABEL[b.type] ?? b.type}
                  </button>
                  <button className="opacity-0 transition group-hover:opacity-100" onClick={() => moveBlock(b.id, -1)} title="Move up"><ChevronUp className="h-3.5 w-3.5" /></button>
                  <button className="opacity-0 transition group-hover:opacity-100" onClick={() => moveBlock(b.id, 1)} title="Move down"><ChevronDown className="h-3.5 w-3.5" /></button>
                  <button className="opacity-0 transition group-hover:opacity-100 text-destructive" onClick={() => removeBlock(b.id)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </li>
            ))}
          </ul>
          {legacyPresent && blocks.length > 0 && (
            <p className="mt-3 rounded-md bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-200">
              This page has legacy fixed layout that still powers the live route. Blocks save here but only take effect on live once the page is refactored to render blocks (or via the /{row.slug} route if unused).
            </p>
          )}
        </div>

        {/* Live preview */}
        <div className="flex-1 overflow-auto bg-background p-4">
          <div className="mx-auto rounded-2xl border border-border bg-[color:var(--paper)] shadow-sm" style={{ width: vpWidth, maxWidth: "100%", transition: "width 200ms" }}>
            <div className="pointer-events-auto">
              <PageRenderer blocks={blocks} />
            </div>
          </div>
        </div>
      </div>

      {/* Inspector */}
      <div className="p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Inspector</p>
        {selected ? (
          <BlockInspector key={selected.id} block={selected} onChange={(props) => updateBlock(selected.id, props)} />
        ) : (
          <p className="text-xs text-muted-foreground">Select a block to edit its properties.</p>
        )}
      </div>
    </div>
  );
}

// -------- Inspector (generic) --------

function BlockInspector({ block, onChange }: { block: Block; onChange: (props: Record<string, unknown>) => void }) {
  const props = block.props as Record<string, unknown>;
  const set = (k: string, v: unknown) => onChange({ ...props, [k]: v });

  const fields = FIELDS[block.type];

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md bg-secondary px-3 py-1.5 text-xs font-semibold">{BLOCK_LABEL[block.type]}</div>
      {fields.map((f) => (
        <Field key={f.key} field={f} value={props[f.key]} onChange={(v) => set(f.key, v)} />
      ))}
    </div>
  );
}

type FieldDef =
  | { key: string; label: string; kind: "text" | "url" | "arabic" }
  | { key: string; label: string; kind: "textarea"; rows?: number }
  | { key: string; label: string; kind: "number"; min?: number; max?: number }
  | { key: string; label: string; kind: "select"; options: { value: string; label: string }[] }
  | { key: string; label: string; kind: "list_string" }
  | { key: string; label: string; kind: "list_object"; shape: { key: string; label: string; kind: "text" | "textarea" | "select"; options?: { value: string; label: string }[] }[] };

const CTA_HREF_OPTS = [
  { value: "", label: "None" },
  { value: "/", label: "Home" }, { value: "/about", label: "About" }, { value: "/contact", label: "Contact" },
  { value: "/join", label: "Join" }, { value: "/resources", label: "Resources" },
  { value: "/quranic-reflections", label: "Reflections" }, { value: "/tazkiyah-toolkit", label: "Toolkit" },
  { value: "/young-hearts", label: "Young Hearts" }, { value: "/life-architecture", label: "Life Architecture" },
];

const FIELDS: Record<BlockType, FieldDef[]> = {
  hero: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "arabic", label: "Arabic watermark", kind: "arabic" },
    { key: "title_line1", label: "Title line 1", kind: "text" },
    { key: "title_line2", label: "Title line 2", kind: "text" },
    { key: "description", label: "Description", kind: "textarea", rows: 3 },
    { key: "cta_primary_label", label: "Primary CTA label", kind: "text" },
    { key: "cta_primary_href", label: "Primary CTA link", kind: "text" },
    { key: "cta_secondary_label", label: "Secondary CTA label", kind: "text" },
    { key: "cta_secondary_href", label: "Secondary CTA link", kind: "text" },
    { key: "background", label: "Background", kind: "select", options: [{ value: "radial", label: "Radial glow" }, { value: "plain", label: "Plain" }] },
  ],
  section_header: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "title", label: "Title", kind: "text" },
    { key: "description", label: "Description", kind: "textarea" },
    { key: "align", label: "Align", kind: "select", options: [{ value: "left", label: "Left" }, { value: "center", label: "Center" }] },
  ],
  heading: [
    { key: "text", label: "Text", kind: "text" },
    { key: "level", label: "Level", kind: "number", min: 1, max: 4 },
  ],
  paragraph: [{ key: "text", label: "Text", kind: "textarea", rows: 4 }],
  rich_text: [{ key: "paragraphs", label: "Paragraphs", kind: "list_string" }],
  image: [
    { key: "url", label: "Image URL", kind: "url" },
    { key: "alt", label: "Alt text", kind: "text" },
    { key: "caption", label: "Caption", kind: "text" },
    { key: "max_width", label: "Max width (px)", kind: "number", min: 320, max: 1600 },
  ],
  image_text_split: [
    { key: "image_url", label: "Image URL", kind: "url" },
    { key: "alt", label: "Alt text", kind: "text" },
    { key: "image_side", label: "Image side", kind: "select", options: [{ value: "left", label: "Left" }, { value: "right", label: "Right" }] },
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "title", label: "Title", kind: "text" },
    { key: "body", label: "Body", kind: "textarea", rows: 4 },
    { key: "cta_label", label: "CTA label", kind: "text" },
    { key: "cta_href", label: "CTA link", kind: "text" },
  ],
  feature_grid: [
    { key: "columns", label: "Columns", kind: "number", min: 1, max: 4 },
    { key: "items", label: "Features", kind: "list_object", shape: [
      { key: "icon", label: "Icon", kind: "select", options: [
        { value: "sparkles", label: "Sparkles" }, { value: "compass", label: "Compass" }, { value: "users", label: "Users" },
        { value: "mountain", label: "Mountain" }, { value: "book", label: "Book" }, { value: "calendar", label: "Calendar" },
        { value: "heart", label: "Heart" }, { value: "star", label: "Star" }, { value: "quote", label: "Quote" }, { value: "feather", label: "Feather" },
      ] },
      { key: "tag", label: "Tag", kind: "text" },
      { key: "title", label: "Title", kind: "text" },
      { key: "description", label: "Description", kind: "textarea" },
    ]},
  ],
  pillar_cards: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "title", label: "Title", kind: "text" },
    { key: "description", label: "Description", kind: "textarea" },
  ],
  cta_banner: [
    { key: "title", label: "Title", kind: "text" },
    { key: "description", label: "Description", kind: "textarea" },
    { key: "cta_label", label: "CTA label", kind: "text" },
    { key: "cta_href", label: "CTA link", kind: "text" },
    { key: "tint", label: "Tint", kind: "select", options: [{ value: "heart", label: "Heart" }, { value: "gold", label: "Gold" }] },
  ],
  stat_row: [
    { key: "items", label: "Stats", kind: "list_object", shape: [
      { key: "value", label: "Value", kind: "text" },
      { key: "label", label: "Label", kind: "text" },
    ]},
  ],
  testimonials_row: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "title", label: "Title", kind: "text" },
  ],
  latest_articles: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "title", label: "Title", kind: "text" },
    { key: "pillar", label: "Filter pillar (slug or blank)", kind: "text" },
    { key: "count", label: "How many", kind: "number", min: 1, max: 12 },
  ],
  reflection_spotlight: [],
  newsletter: [
    { key: "heading", label: "Heading", kind: "text" },
    { key: "description", label: "Description", kind: "textarea" },
    { key: "cta", label: "CTA label", kind: "text" },
  ],
  faq_accordion: [
    { key: "page_key", label: "Auto-load FAQs page_key (or blank)", kind: "text" },
    { key: "items", label: "Manual items", kind: "list_object", shape: [
      { key: "question", label: "Question", kind: "text" },
      { key: "answer", label: "Answer", kind: "textarea" },
    ]},
  ],
  founder_letter: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "title", label: "Title", kind: "text" },
    { key: "letter", label: "Arabic letter", kind: "arabic" },
    { key: "name", label: "Name", kind: "text" },
    { key: "role", label: "Role", kind: "text" },
    { key: "bio", label: "Bio", kind: "textarea", rows: 4 },
    { key: "tint", label: "Tint", kind: "select", options: [
      { value: "heart", label: "Heart" }, { value: "tazkiyah", label: "Tazkiyah" }, { value: "heart-soft", label: "Heart soft" }, { value: "gold", label: "Gold" },
    ]},
  ],
  arabic_verse: [
    { key: "arabic", label: "Arabic", kind: "arabic" },
    { key: "translation", label: "Translation", kind: "textarea", rows: 3 },
    { key: "reference", label: "Reference", kind: "text" },
  ],
  divider: [],
  spacer: [{ key: "size", label: "Size", kind: "select", options: [{ value: "sm", label: "Small" }, { value: "md", label: "Medium" }, { value: "lg", label: "Large" }] }],
};

// Silence unused warning
void CTA_HREF_OPTS;

function Field({ field, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const base = "w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-heart";
  if (field.kind === "text" || field.kind === "url") {
    return (
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{field.label}</span>
        <input className={base} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />
      </label>
    );
  }
  if (field.kind === "arabic") {
    return (
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{field.label}</span>
        <input dir="rtl" className={`${base} font-arabic text-lg`} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />
      </label>
    );
  }
  if (field.kind === "textarea") {
    return (
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{field.label}</span>
        <textarea rows={field.rows ?? 3} className={base} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />
      </label>
    );
  }
  if (field.kind === "number") {
    return (
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{field.label}</span>
        <input type="number" min={field.min} max={field.max} className={base} value={(value as number) ?? 0} onChange={(e) => onChange(Number(e.target.value))} />
      </label>
    );
  }
  if (field.kind === "select") {
    return (
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{field.label}</span>
        <select className={base} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
          {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
    );
  }
  if (field.kind === "list_string") {
    const list = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{field.label}</span>
        {list.map((item, i) => (
          <div key={i} className="flex gap-1">
            <textarea rows={2} className={base} value={item} onChange={(e) => {
              const next = [...list]; next[i] = e.target.value; onChange(next);
            }} />
            <button className="rounded-md p-1 text-destructive hover:bg-destructive/10" onClick={() => onChange(list.filter((_, j) => j !== i))} title="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <button className="btn-ghost self-start text-xs" onClick={() => onChange([...list, ""])}><Plus className="h-3.5 w-3.5" /> Add</button>
      </div>
    );
  }
  if (field.kind === "list_object") {
    const list = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
    return (
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{field.label}</span>
        {list.map((item, i) => (
          <div key={i} className="rounded-md border border-border bg-background p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground">Item {i + 1}</span>
              <button className="text-destructive hover:opacity-80" onClick={() => onChange(list.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></button>
            </div>
            <div className="flex flex-col gap-1.5">
              {field.shape.map((s) => (
                <div key={s.key}>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  {s.kind === "textarea" ? (
                    <textarea rows={2} className={base} value={(item[s.key] as string) ?? ""} onChange={(e) => {
                      const next = [...list]; next[i] = { ...item, [s.key]: e.target.value }; onChange(next);
                    }} />
                  ) : s.kind === "select" ? (
                    <select className={base} value={(item[s.key] as string) ?? ""} onChange={(e) => {
                      const next = [...list]; next[i] = { ...item, [s.key]: e.target.value }; onChange(next);
                    }}>
                      {(s.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input className={base} value={(item[s.key] as string) ?? ""} onChange={(e) => {
                      const next = [...list]; next[i] = { ...item, [s.key]: e.target.value }; onChange(next);
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <button className="btn-ghost self-start text-xs" onClick={() => onChange([...list, {}])}><Plus className="h-3.5 w-3.5" /> Add item</button>
      </div>
    );
  }
  return null;
}

// -------- Legacy key/value fields editor (kept for backward compat) --------

function LegacyFieldsEditor({ row, onSaved }: { row: PageRow; onSaved: () => void }) {
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...(row.content ?? {}) });
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const initialRef = useRef(row.key);
  useEffect(() => { if (initialRef.current !== row.key) { setDraft({ ...(row.content ?? {}) }); setDirty(false); initialRef.current = row.key; } }, [row]);

  const entries = Object.entries(draft).filter(([k]) => k !== "blocks").sort(([a], [b]) => a.localeCompare(b));

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pages").update({ content: draft as never }).eq("key", row.key);
      if (error) throw error;
    },
    onSuccess: () => { setStatus({ kind: "ok", msg: "Saved." }); setDirty(false); onSaved(); },
    onError: (e: Error) => setStatus({ kind: "err", msg: e.message }),
  });

  return (
    <div className="p-6">
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="w-[240px] px-4 py-2 text-left font-semibold">Key</th><th className="px-4 py-2 text-left font-semibold">Value</th></tr>
          </thead>
          <tbody>
            {entries.map(([key, value]) => (
              <tr key={key} className="border-t border-border align-top">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{key}</td>
                <td className="px-4 py-3">
                  {Array.isArray(value) ? (
                    <pre className="overflow-x-auto rounded-md border border-dashed border-border bg-background/50 px-3 py-2 font-mono text-[11px] text-muted-foreground">{JSON.stringify(value, null, 2)}</pre>
                  ) : typeof value === "object" && value !== null ? (
                    <pre className="overflow-x-auto rounded-md border border-dashed border-border bg-background/50 px-3 py-2 font-mono text-[11px] text-muted-foreground">{JSON.stringify(value, null, 2)}</pre>
                  ) : (
                    <textarea
                      rows={Math.min(6, Math.max(1, String(value ?? "").split("\n").length))}
                      className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-heart"
                      value={String(value ?? "")}
                      onChange={(e) => { setDraft((d) => ({ ...d, [key]: e.target.value })); setDirty(true); }}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {status && <p className={`mt-3 text-sm font-semibold ${status.kind === "ok" ? "text-emerald-600" : "text-destructive"}`}>{status.msg}</p>}
      <div className="mt-4 flex items-center gap-3">
        <button className="btn-primary" onClick={() => save.mutate()} disabled={save.isPending || !dirty}>{save.isPending ? "Saving…" : "Save changes"}</button>
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
      </div>
    </div>
  );
}
