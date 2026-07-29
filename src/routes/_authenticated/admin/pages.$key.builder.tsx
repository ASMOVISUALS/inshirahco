import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Undo2, Redo2,
  Monitor, Tablet, Smartphone, ExternalLink, Layers, Type, Palette, Image as ImageIcon,
  Layout as LayoutIcon, BarChart3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  BLOCK_CATEGORIES, BLOCK_LABEL, PageRenderer,
  newBlock, isBlockArray, type Block, type BlockType,
} from "@/lib/page-blocks";
import { newslettersQuery } from "@/lib/queries";
import { seedBlocksFor } from "@/lib/page-seed";

export const Route = createFileRoute("/_authenticated/admin/pages/$key/builder")({
  head: () => ({ meta: [{ title: "Page builder — Admin" }, { name: "robots", content: "noindex" }] }),
  component: PageBuilderRoute,
});

interface PageRow {
  key: string; slug: string; title: string; is_published: boolean;
  content: Record<string, unknown>;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  layout: LayoutIcon, content: Type, marketing: Palette, data: BarChart3, media: ImageIcon,
};

function PageBuilderRoute() {
  const { key } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: row, isLoading } = useQuery({
    queryKey: ["admin", "page", key],
    queryFn: async (): Promise<PageRow | null> => {
      const { data, error } = await supabase.from("pages")
        .select("key,slug,title,is_published,content").eq("key", key).maybeSingle();
      if (error) throw error;
      return (data ?? null) as PageRow | null;
    },
  });

  const initialBlocks = useMemo<Block[]>(() => {
    if (!row) return [];
    const raw = row.content?.blocks;
    if (isBlockArray(raw)) return raw as Block[];
    return seedBlocksFor(row.key, row.content ?? {});
  }, [row]);

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [history, setHistory] = useState<Block[][]>([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(BLOCK_CATEGORIES[0]?.key ?? null);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");

  useEffect(() => {
    if (row && !seeded) {
      setBlocks(initialBlocks);
      setHistory([initialBlocks]);
      setHistoryIdx(0);
      const content = (row.content ?? {}) as Record<string, unknown>;
      setSeoTitle(typeof content.seo_title === "string" ? content.seo_title : "");
      setSeoDesc(typeof content.seo_description === "string" ? content.seo_description : "");
      // If blocks were seeded (not already saved), mark dirty so user knows to save
      const saved = isBlockArray(row.content?.blocks) && (row.content?.blocks as Block[]).length > 0;
      setDirty(!saved && initialBlocks.length > 0);
      setSeeded(true);
    }
  }, [row, seeded, initialBlocks]);

  const commit = (next: Block[]) => {
    setBlocks(next);
    const trimmed = history.slice(0, historyIdx + 1);
    trimmed.push(next);
    setHistory(trimmed);
    setHistoryIdx(trimmed.length - 1);
    setDirty(true);
  };
  const undo = () => { if (historyIdx > 0) { setHistoryIdx(historyIdx - 1); setBlocks(history[historyIdx - 1]); setDirty(true); } };
  const redo = () => { if (historyIdx < history.length - 1) { setHistoryIdx(historyIdx + 1); setBlocks(history[historyIdx + 1]); setDirty(true); } };

  const addBlock = (type: BlockType) => { const b = newBlock(type); commit([...blocks, b]); setSelectedId(b.id); };
  const removeBlock = (id: string) => { commit(blocks.filter((b) => b.id !== id)); if (selectedId === id) setSelectedId(null); };
  const moveBlock = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex((b) => b.id === id); if (idx < 0) return;
    const j = idx + dir; if (j < 0 || j >= blocks.length) return;
    const next = [...blocks]; [next[idx], next[j]] = [next[j], next[idx]]; commit(next);
  };
  const updateBlock = (id: string, props: Record<string, unknown>) => {
    commit(blocks.map((b) => (b.id === id ? { ...b, props } : b)));
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!row) throw new Error("No page");
      const nextContent = { ...(row.content ?? {}), seo_title: seoTitle, seo_description: seoDesc, blocks };
      const { error } = await supabase.from("pages").update({ content: nextContent as never }).eq("key", row.key);
      if (error) throw error;
    },
    onSuccess: () => {
      setStatus({ kind: "ok", msg: "Saved." }); setDirty(false);
      qc.invalidateQueries({ queryKey: ["admin", "pages"] });
      qc.invalidateQueries({ queryKey: ["admin", "page", key] });
      qc.invalidateQueries({ queryKey: ["cms", "page"] });
    },
    onError: (e: Error) => setStatus({ kind: "err", msg: e.message }),
  });

  if (isLoading || !row) {
    return <div className="p-12 text-center text-muted-foreground">Loading builder…</div>;
  }

  const selected = blocks.find((b) => b.id === selectedId) ?? null;
  const vpWidth = viewport === "desktop" ? "100%" : viewport === "tablet" ? "820px" : "390px";

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/admin/pages" })}
            className="grid h-9 w-9 place-items-center rounded-full border border-border hover:border-heart hover:text-heart"
            title="Back to pages"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Page builder</p>
            <h1 className="text-sm font-bold leading-tight">{row.title || row.slug}</h1>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="btn-ghost !p-2" onClick={undo} disabled={historyIdx === 0} title="Undo"><Undo2 className="h-4 w-4" /></button>
          <button className="btn-ghost !p-2" onClick={redo} disabled={historyIdx >= history.length - 1} title="Redo"><Redo2 className="h-4 w-4" /></button>
          <div className="mx-2 h-6 w-px bg-border" />
          <button className={`btn-ghost !p-2 ${viewport === "desktop" ? "bg-secondary" : ""}`} onClick={() => setViewport("desktop")} title="Desktop"><Monitor className="h-4 w-4" /></button>
          <button className={`btn-ghost !p-2 ${viewport === "tablet" ? "bg-secondary" : ""}`} onClick={() => setViewport("tablet")} title="Tablet"><Tablet className="h-4 w-4" /></button>
          <button className={`btn-ghost !p-2 ${viewport === "mobile" ? "bg-secondary" : ""}`} onClick={() => setViewport("mobile")} title="Mobile"><Smartphone className="h-4 w-4" /></button>
        </div>

        <div className="flex items-center gap-2">
          {status && <span className={`text-[11px] font-semibold ${status.kind === "ok" ? "text-emerald-600" : "text-destructive"}`}>{status.msg}</span>}
          {dirty && <span className="text-[11px] text-muted-foreground">Unsaved</span>}
          <a href={`/${row.slug}`} target="_blank" rel="noreferrer" className="btn-ghost text-xs"><ExternalLink className="h-3.5 w-3.5" /> Live</a>
          <button className="btn-primary text-sm" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Left rail: categories */}
        <div className="flex w-14 flex-col items-center gap-1 border-r border-border bg-card py-3">
          {BLOCK_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.key] ?? Layers;
            const active = activeCat === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCat(active ? null : cat.key)}
                className={`grid h-11 w-11 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground ${active ? "bg-secondary text-foreground" : ""}`}
                title={cat.label}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        {/* Category flyout */}
        {activeCat && (
          <div className="w-56 border-r border-border bg-card p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {BLOCK_CATEGORIES.find((c) => c.key === activeCat)?.label}
            </p>
            <div className="flex flex-col gap-1">
              {BLOCK_CATEGORIES.find((c) => c.key === activeCat)?.items.map((item) => (
                <button
                  key={item.type}
                  onClick={() => addBlock(item.type)}
                  className="rounded-md border border-transparent px-2 py-2 text-left text-xs font-semibold hover:border-border hover:bg-secondary"
                  title={item.description}
                >
                  <div>{item.label}</div>
                  {item.description && <div className="mt-0.5 text-[10px] font-normal text-muted-foreground">{item.description}</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Canvas: block list + preview */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Block list strip */}
          <div className="max-h-40 shrink-0 overflow-auto border-b border-border bg-card px-3 py-2">
            {blocks.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                No blocks yet. Add one from the left toolbar.
              </div>
            ) : (
              <ol className="flex flex-wrap gap-1.5">
                {blocks.map((b, i) => (
                  <li key={b.id}>
                    <div className={`group flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] ${selectedId === b.id ? "border-heart bg-secondary" : "border-border hover:bg-secondary"}`}>
                      <button className="font-semibold" onClick={() => setSelectedId(b.id)}>
                        {i + 1}. {BLOCK_LABEL[b.type] ?? b.type}
                      </button>
                      <button className="opacity-0 group-hover:opacity-100" onClick={() => moveBlock(b.id, -1)} title="Up"><ChevronUp className="h-3 w-3" /></button>
                      <button className="opacity-0 group-hover:opacity-100" onClick={() => moveBlock(b.id, 1)} title="Down"><ChevronDown className="h-3 w-3" /></button>
                      <button className="opacity-0 text-destructive group-hover:opacity-100" onClick={() => removeBlock(b.id)} title="Delete"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Preview */}
          <div className="flex-1 overflow-auto bg-background p-6">
            <div
              className="mx-auto rounded-2xl border border-border bg-[color:var(--paper)] shadow-sm"
              style={{ width: vpWidth, maxWidth: "100%", transition: "width 200ms" }}
            >
              <PageRenderer blocks={blocks} />
            </div>
          </div>
        </div>

        {/* Inspector */}
        <div className="w-80 shrink-0 overflow-auto border-l border-border bg-card p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Inspector</p>
          {selected ? (
            <BlockInspector key={selected.id} block={selected} onChange={(props) => updateBlock(selected.id, props)} />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-md bg-secondary px-3 py-1.5 text-xs font-semibold">Page settings</div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold">SEO title</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  value={seoTitle}
                  onChange={(e) => { setSeoTitle(e.target.value); setDirty(true); }}
                  placeholder={row.title}
                />
                <p className="mt-1 text-[10px] text-muted-foreground">Shown in browser tab and search results. Falls back to page title.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold">SEO description</label>
                <textarea
                  rows={4}
                  className="w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  value={seoDesc}
                  onChange={(e) => { setSeoDesc(e.target.value); setDirty(true); }}
                />
                <p className="mt-1 text-[10px] text-muted-foreground">One or two sentences describing the page for search & social previews.</p>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Select a block above to edit its properties.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -------- Inspector (generic) --------

function BlockInspector({ block, onChange }: { block: Block; onChange: (props: Record<string, unknown>) => void }) {
  const props = block.props as Record<string, unknown>;
  const set = (k: string, v: unknown) => onChange({ ...props, [k]: v });
  const fields = FIELDS[block.type] ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md bg-secondary px-3 py-1.5 text-xs font-semibold">{BLOCK_LABEL[block.type]}</div>
      {fields.length === 0 && <p className="text-xs text-muted-foreground">This block has no editable fields.</p>}
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
  | { key: string; label: string; kind: "newsletter_select" }
  | { key: string; label: string; kind: "list_object"; shape: { key: string; label: string; kind: "text" | "textarea" | "select"; options?: { value: string; label: string }[] }[] };


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
    { key: "heading", label: "Heading (supports {{page_name}})", kind: "text" },
    { key: "description", label: "Description (supports {{page_name}})", kind: "textarea" },
    { key: "cta", label: "CTA label", kind: "text" },
    { key: "newsletterId", label: "Send signups to", kind: "newsletter_select" },
  ],
  hero_fullscreen: [
    { key: "eyebrow", label: "Eyebrow (supports {{page_name}})", kind: "text" },
    { key: "title", label: "Title", kind: "text" },
    { key: "subtitle", label: "Subtitle", kind: "textarea", rows: 3 },
    { key: "arabic_watermark", label: "Arabic watermark", kind: "arabic" },
    { key: "arabic_verse", label: "Arabic verse", kind: "arabic" },
  ],
  hidden_frame: [
    { key: "eyebrow", label: "Eyebrow (supports {{page_name}})", kind: "text" },
    { key: "title", label: "Title", kind: "text" },
    { key: "subtitle", label: "Subtitle (supports {{page_name}})", kind: "textarea", rows: 3 },
    { key: "arabic_watermark", label: "Arabic watermark", kind: "arabic" },
    { key: "arabic_verse", label: "Arabic verse", kind: "arabic" },
  ],
  explore_pages: [
    { key: "items", label: "Links", kind: "list_object", shape: [
      { key: "label", label: "Label", kind: "text" },
      { key: "href", label: "Link", kind: "text" },
    ]},
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
    { key: "tint", label: "Tint", kind: "select", options: [
      { value: "tazkiyah", label: "Green" }, { value: "heart", label: "Red" },
      { value: "heart-soft", label: "Soft red" }, { value: "gold", label: "Gold" },
    ]},
    { key: "__quran_fetch", label: "Fetch from Quran.com", kind: "quran_fetch" },
  ],
  divider: [],
  spacer: [{ key: "size", label: "Size", kind: "select", options: [{ value: "sm", label: "Small" }, { value: "md", label: "Medium" }, { value: "lg", label: "Large" }] }],
  pillar_hero: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "badge", label: "Badge (e.g. Coming soon)", kind: "text" },
  ],
  pillar_articles: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "title", label: "Title", kind: "text" },
    { key: "count", label: "How many", kind: "number", min: 1, max: 60 },
  ],
  pillar_series: [
    { key: "title", label: "Title", kind: "text" },
    { key: "count", label: "How many", kind: "number", min: 1, max: 30 },
  ],
  previews_grid: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "title", label: "Title", kind: "text" },
    { key: "description", label: "Description", kind: "textarea", rows: 3 },
    { key: "items", label: "Items", kind: "list_object", shape: [
      { key: "icon", label: "Icon", kind: "select", options: [
        { value: "sparkles", label: "Sparkles" }, { value: "users", label: "Users" }, { value: "mountain", label: "Mountain" },
        { value: "compass", label: "Compass" }, { value: "book", label: "Book" }, { value: "calendar", label: "Calendar" },
        { value: "heart", label: "Heart" }, { value: "star", label: "Star" }, { value: "quote", label: "Quote" }, { value: "feather", label: "Feather" },
      ]},
      { key: "tag", label: "Tag", kind: "text" },
      { key: "title", label: "Title", kind: "text" },
      { key: "description", label: "Description", kind: "textarea" },
    ]},
  ],
  mentors_row: [
    { key: "title", label: "Title", kind: "text" },
    { key: "description", label: "Description", kind: "textarea", rows: 2 },
    { key: "items", label: "Mentors", kind: "list_object", shape: [
      { key: "name", label: "Name", kind: "text" },
      { key: "title", label: "Title / caption", kind: "text" },
      { key: "role", label: "Role", kind: "text" },
      { key: "qualification", label: "Qualification", kind: "text" },
      { key: "image", label: "Photo URL", kind: "text" },
    ]},
  ],
  contact_form: [
    { key: "success_arabic", label: "Success Arabic", kind: "arabic" },
    { key: "success_title", label: "Success title", kind: "text" },
    { key: "success_description", label: "Success description", kind: "textarea", rows: 2 },
    { key: "support_title", label: "Support panel title", kind: "text" },
    { key: "support_body", label: "Support panel body", kind: "textarea", rows: 4 },
    { key: "support_footnote", label: "Support panel footnote", kind: "text" },
  ],
  resources_library: [],
};

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
  if (field.kind === "newsletter_select") {
    return <NewsletterSelectField label={field.label} value={value as string | undefined} onChange={(v) => onChange(v)} />;
  }
  return null;
}

void Link;

function NewsletterSelectField({ label, value, onChange }: { label: string; value: string | undefined; onChange: (v: string) => void }) {
  const base = "w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-heart";
  const { data = [] } = useQuery(newslettersQuery());
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <select className={base} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">Default newsletter</option>
        {data.map((n) => (
          <option key={n.id} value={n.id}>{n.name}{n.is_default ? " (default)" : ""}</option>
        ))}
      </select>
    </label>
  );
}

