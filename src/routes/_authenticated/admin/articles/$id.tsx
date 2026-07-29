import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
  Undo2,
  Redo2,
  Video as VideoIcon,
  AudioLines,
  Link as LinkIcon,
  BookOpen,
  Languages,
  ExternalLink,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PILLARS, RESOURCE_TYPES, type Pillar, type ResourceType, type ContentBlock } from "@/lib/content";
import { LetterMark } from "@/components/LetterMark";
import { RenderBlock, wordsIn, readTimeFrom } from "@/lib/article-blocks";
import { QuranFetcher } from "@/components/QuranFetcher";
import { quoteTintStyle, QUOTE_TINT_OPTIONS } from "@/lib/quote-tint";

export const Route = createFileRoute("/_authenticated/admin/articles/$id")({
  head: () => ({ meta: [{ title: "Edit article — Admin" }, { name: "robots", content: "noindex" }] }),
  component: EditArticle,
});

/* ---------------- Block palette (categorized) ---------------- */

type BlockKind = ContentBlock["kind"];

interface PaletteItem {
  kind: BlockKind;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  make: () => ContentBlock;
}

const P_PARAGRAPH: PaletteItem = { kind: "p", label: "Paragraph", icon: TypeIcon, make: () => ({ kind: "p", text: "" }) };
const P_H2: PaletteItem = { kind: "h2", label: "Heading", icon: Heading1, make: () => ({ kind: "h2", text: "" }) };
const P_H3: PaletteItem = { kind: "h3", label: "Subheading", icon: Heading2, make: () => ({ kind: "h3", text: "" }) };
const P_QURAN: PaletteItem = { kind: "quote", label: "Qur'an quote", icon: Quote, make: () => ({ kind: "quote", text: "", arabic: "", source: "" }) };
const P_QUOTE: PaletteItem = { kind: "plain_quote", label: "Quote", icon: Quote, make: () => ({ kind: "plain_quote", text: "", source: "" }) };
const P_ARABIC: PaletteItem = { kind: "arabic_large", label: "Large Arabic", icon: Languages, make: () => ({ kind: "arabic_large", arabic: "", english: "" }) };
const P_CALLOUT: PaletteItem = { kind: "callout", label: "Callout", icon: Lightbulb, make: () => ({ kind: "callout", text: "" }) };
const P_DIVIDER: PaletteItem = { kind: "divider", label: "Divider", icon: Minus, make: () => ({ kind: "divider" }) };
const P_BULLETS: PaletteItem = { kind: "list", label: "Bullet list", icon: ListIcon, make: () => ({ kind: "list", items: [], ordered: false }) };
const P_NUMBERED: PaletteItem = { kind: "list", label: "Numbered list", icon: ListOrdered, make: () => ({ kind: "list", items: [], ordered: true }) };

const P_IMAGE: PaletteItem = { kind: "image", label: "Image", icon: ImageIcon, make: () => ({ kind: "image", src: "", alt: "", caption: "", width: 1 }) };
const P_VIDEO: PaletteItem = { kind: "video", label: "Video", icon: VideoIcon, make: () => ({ kind: "video", src: "", caption: "", width: 1 }) };
const P_AUDIO: PaletteItem = { kind: "audio", label: "Audio", icon: AudioLines, make: () => ({ kind: "audio", src: "", caption: "" }) };
const P_LINK: PaletteItem = { kind: "hyperlink", label: "Link card", icon: LinkIcon, make: () => ({ kind: "hyperlink", url: "", label: "", description: "" }) };
const P_RECOMMENDED: PaletteItem = { kind: "recommended", label: "Recommended", icon: BookOpen, make: () => ({ kind: "recommended", slug: "" }) };

const ALL_PALETTE: PaletteItem[] = [
  P_PARAGRAPH, P_H2, P_H3, P_QURAN, P_QUOTE, P_ARABIC, P_CALLOUT, P_DIVIDER,
  P_BULLETS, P_NUMBERED, P_IMAGE, P_VIDEO, P_AUDIO, P_LINK, P_RECOMMENDED,
];

interface Category {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: PaletteItem[];
}

const CATEGORIES: Category[] = [
  { label: "Text", icon: TypeIcon, items: [P_PARAGRAPH, P_H2, P_H3] },
  { label: "Blocks", icon: Quote, items: [P_QURAN, P_QUOTE, P_ARABIC, P_CALLOUT, P_DIVIDER] },
  { label: "Lists", icon: ListIcon, items: [P_BULLETS, P_NUMBERED] },
  { label: "Media", icon: ImageIcon, items: [P_IMAGE, P_VIDEO, P_AUDIO] },
  { label: "Links", icon: LinkIcon, items: [P_LINK, P_RECOMMENDED] },
];

function makeByLabel(label: string): ContentBlock | null {
  const p = ALL_PALETTE.find((b) => b.label === label);
  return p ? p.make() : null;
}

/* ---------------- root ---------------- */

type Form = {
  slug: string; title: string; description: string; pillar: Pillar; type: ResourceType;
  author_name: string; author_role: string; tags: string;
  blocks: ContentBlock[]; published: boolean; downloadable: boolean;
};

function EditArticle() {
  const { id } = Route.useParams();
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
    setForm(formFromRow(data));
  }, [data]);

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
      // Resolve pillar_id from slug so the FK stays in sync when pillar is changed.
      const { data: p, error: pErr } = await supabase
        .from("pillars").select("id").eq("slug", next.pillar).maybeSingle();
      if (pErr) throw pErr;
      if (!p) throw new Error(`Pillar "${next.pillar}" not found.`);
      const { error } = await supabase.from("articles").update({
        slug: next.slug,
        title: next.title,
        description: next.description,
        pillar: next.pillar,
        pillar_id: p.id,
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

      <section className="relative mb-8 rounded-3xl border border-border bg-card">
        <SectionEditBar
          label="Details"
          isEditing={mode === "meta"}
          onEdit={() => setMode("meta")}
          onCancel={() => { setMode("preview"); if (data) setForm(formFromRow(data)); }}
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
            <div className="prose-body mx-auto max-w-3xl space-y-6 text-[1.14rem] leading-[1.75] md:text-[1.18rem]">
              {form.blocks.map((b, i) => <RenderBlock key={i} block={b} />)}
            </div>
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

/* ---------------- Meta block ---------------- */

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
      <EditableInline editing={editing}>
        {editing ? (
          <select className="eyebrow rounded-md border border-input bg-background px-2 py-1" value={form.pillar} onChange={(e) => setForm({ ...form, pillar: e.target.value as Pillar })}>
            {Object.entries(PILLARS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
          </select>
        ) : (
          <span className="eyebrow">{pillar.label}</span>
        )}
      </EditableInline>

      <div className="mt-5">
        <EditableInline editing={editing} block>
          {editing ? (
            <textarea rows={2} className="w-full resize-none bg-transparent font-display text-4xl leading-[1.05] outline-none md:text-6xl" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          ) : (
            <h1 className="text-4xl leading-[1.05] md:text-6xl">{form.title}</h1>
          )}
        </EditableInline>
      </div>

      <div className="mt-5">
        <EditableInline editing={editing} block>
          {editing ? (
            <textarea rows={3} className="w-full resize-none bg-transparent text-xl leading-relaxed text-muted-foreground outline-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          ) : (
            <p className="text-xl leading-relaxed text-muted-foreground">{form.description}</p>
          )}
        </EditableInline>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-3">
          <AuthorAvatar avatar={authorAvatar} pillarLetter={pillar.letter} />
          <div>
            <EditableInline editing={editing}>
              {editing ? (
                <input className="w-48 bg-transparent font-bold outline-none" value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
              ) : (
                <p className="font-bold">{form.author_name}</p>
              )}
            </EditableInline>
            <EditableInline editing={editing}>
              {editing ? (
                <input className="w-56 bg-transparent text-xs text-muted-foreground outline-none" placeholder="Author role" value={form.author_role} onChange={(e) => setForm({ ...form, author_role: e.target.value })} />
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
            <select className="rounded-pill border border-input bg-background px-3 py-1 font-semibold" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ResourceType })}>
              {Object.entries(RESOURCE_TYPES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
            </select>
          ) : (
            <span className="rounded-pill border border-border px-3 py-1 font-semibold">{type.label}</span>
          )}
        </EditableInline>
      </div>

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
  if (avatar) return <img src={avatar} alt="" className="h-10 w-10 rounded-full object-cover" />;
  return <LetterMark letter={pillarLetter} tint="heart" size={40} />;
}

function EditableInline({ children, editing, block }: { children: React.ReactNode; editing: boolean; block?: boolean }) {
  const Tag: React.ElementType = block ? "div" : "span";
  return (
    <Tag className={editing ? "relative rounded-md ring-1 ring-dashed ring-border/60 transition hover:ring-heart focus-within:ring-2 focus-within:ring-heart -mx-1 px-1" : ""}>
      {children}
    </Tag>
  );
}

const inputCls = "w-full rounded-2xl border border-input bg-background px-4 py-2.5 outline-none focus:border-heart";

/* ---------------- History hook ---------------- */

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

function useHistory<T>(initial: T) {
  const [state, setState] = useState<HistoryState<T>>({ past: [], present: initial, future: [] });

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setState((s) => {
      const value = typeof next === "function" ? (next as (p: T) => T)(s.present) : next;
      return { ...s, present: value };
    });
  }, []);

  const commit = useCallback((next: T | ((prev: T) => T)) => {
    setState((s) => {
      const value = typeof next === "function" ? (next as (p: T) => T)(s.present) : next;
      if (JSON.stringify(value) === JSON.stringify(s.present)) return s;
      return { past: [...s.past, s.present], present: value, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    setState((s) => {
      if (s.past.length === 0) return s;
      const prev = s.past[s.past.length - 1];
      return { past: s.past.slice(0, -1), present: prev, future: [s.present, ...s.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setState((s) => {
      if (s.future.length === 0) return s;
      const [next, ...rest] = s.future;
      return { past: [...s.past, s.present], present: next, future: rest };
    });
  }, []);

  return {
    value: state.present,
    set,
    commit,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}

/* ---------------- Editor settings ---------------- */

interface EditorSettings {
  max_columns: number;
  columnable_kinds: BlockKind[];
}

const DEFAULT_SETTINGS: EditorSettings = {
  max_columns: 3,
  columnable_kinds: ["arabic_large", "image", "p"],
};

function useEditorSettings(): EditorSettings {
  const { data } = useQuery({
    queryKey: ["cms", "settings", "article_editor"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "article_editor").maybeSingle();
      return (data?.value as Partial<EditorSettings> | undefined) ?? null;
    },
  });
  return {
    max_columns: Math.min(3, data?.max_columns ?? DEFAULT_SETTINGS.max_columns),
    columnable_kinds: data?.columnable_kinds ?? DEFAULT_SETTINGS.columnable_kinds,
  };
}

/* ---------------- Drag payload types ---------------- */

// Drop target types:
//  - "before": insert new/moved block before index i (vertical, top-level)
//  - "after": after last block (vertical, top-level)
//  - "col-left" / "col-right": columnize with block at index i (or insert into existing columns)

type DropTarget =
  | { kind: "before"; index: number }
  | { kind: "col-left"; index: number }
  | { kind: "col-right"; index: number }
  | { kind: "col-inside"; index: number; at: number }; // insert as column at position `at` within columns block

/* ---------------- Body editor ---------------- */

function BodyEditor({
  blocks: initial, onCancel, onSave, saving,
}: {
  blocks: ContentBlock[];
  onCancel: () => void;
  onSave: (blocks: ContentBlock[]) => void;
  saving: boolean;
}) {
  const settings = useEditorSettings();
  const history = useHistory<ContentBlock[]>(initial);
  const blocks = history.value;
  const [focused, setFocused] = useState<string | null>(null);
  const dragSource = useRef<{ kind: "palette"; label: string } | { kind: "reorder"; path: number[] } | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  const insertAtTop = (b: ContentBlock, at?: number) => {
    history.commit((prev) => {
      const idx = typeof at === "number" ? at : prev.length;
      const next = [...prev];
      next.splice(idx, 0, b);
      return next;
    });
  };

  const removeAtPath = (path: number[]) => {
    history.commit((prev) => removePath(prev, path));
    setFocused(null);
  };

  const updateAt = (path: number[], patch: Partial<ContentBlock>, opts?: { commit?: boolean }) => {
    const fn = opts?.commit ? history.commit : history.set;
    fn((prev) => applyUpdate(prev, path, patch));
  };

  // Handles drop-target actions
  const handleDrop = (target: DropTarget) => {
    const src = dragSource.current;
    dragSource.current = null;
    setDropTarget(null);
    if (!src) return;

    // Get the block being placed (either new or a move)
    let placingBlock: ContentBlock | null = null;
    let removeFrom: number[] | null = null;
    if (src.kind === "palette") {
      placingBlock = makeByLabel(src.label);
    } else {
      placingBlock = getAtPath(blocks, src.path);
      removeFrom = src.path;
    }
    if (!placingBlock) return;

    history.commit((prev) => {
      let next = prev;
      // Remove first (if moving)
      if (removeFrom) next = removePath(next, removeFrom);

      // Recompute target index if removal was above
      const adjustIdx = (idx: number) => {
        if (!removeFrom || removeFrom.length !== 1) return idx;
        return removeFrom[0] < idx ? idx - 1 : idx;
      };

      if (target.kind === "before") {
        const at = adjustIdx(target.index);
        const copy = [...next];
        copy.splice(at, 0, placingBlock!);
        return copy;
      }
      if (target.kind === "col-left" || target.kind === "col-right") {
        const at = adjustIdx(target.index);
        const existing = next[at];
        if (!existing) return next;
        // Can we columnize?
        if (!isColumnable(placingBlock!, settings) || !canJoin(existing, placingBlock!, settings)) {
          // Fallback: just insert before/after vertically
          const copy = [...next];
          copy.splice(target.kind === "col-left" ? at : at + 1, 0, placingBlock!);
          return copy;
        }
        if (existing.kind === "columns") {
          if (existing.items.length >= settings.max_columns) return next;
          const insertAt = target.kind === "col-left" ? 0 : existing.items.length;
          const items = [...existing.items];
          items.splice(insertAt, 0, placingBlock!);
          const copy = [...next];
          copy[at] = { ...existing, items };
          return copy;
        }
        const items: ContentBlock[] = target.kind === "col-left"
          ? [placingBlock!, existing]
          : [existing, placingBlock!];
        const copy = [...next];
        copy[at] = { kind: "columns", items };
        return copy;
      }
      if (target.kind === "col-inside") {
        const at = adjustIdx(target.index);
        const existing = next[at];
        if (!existing || existing.kind !== "columns") return next;
        if (!isColumnable(placingBlock!, settings)) return next;
        if (existing.items.length >= settings.max_columns) return next;
        const items = [...existing.items];
        items.splice(target.at, 0, placingBlock!);
        const copy = [...next];
        copy[at] = { ...existing, items };
        return copy;
      }
      return next;
    });
  };

  // Keyboard undo/redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); history.undo(); }
      else if ((e.key === "z" && e.shiftKey) || e.key === "y") { e.preventDefault(); history.redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [history]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest("[data-block]") && !el.closest("[data-palette]") && !el.closest("[data-keep-focus]")) {
        setFocused(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button onClick={onCancel} className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline" style={{ color: "var(--heart)" }}>
          <ArrowLeft className="h-4 w-4" /> Back to article
        </button>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Body editor</span>
        <div className="flex items-center gap-2">
          <HistoryButton icon={Undo2} label="Undo" disabled={!history.canUndo} onClick={history.undo} />
          <HistoryButton icon={Redo2} label="Redo" disabled={!history.canRedo} onClick={history.redo} />
          <span className="ml-2 text-xs text-muted-foreground">{wordsIn(blocks)} words · {readTimeFrom(blocks)}</span>
          <button onClick={onCancel} className="rounded-pill border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Cancel</button>
          <button onClick={() => onSave(blocks)} disabled={saving} className="rounded-pill px-4 py-1.5 text-xs font-semibold text-white" style={{ background: "var(--heart)" }}>
            {saving ? "Saving…" : "Save & close"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <CategoryToolbar
          onInsert={(item) => insertAtTop(item.make())}
          onPaletteDragStart={(label) => { dragSource.current = { kind: "palette", label }; }}
          onPaletteDragEnd={() => { dragSource.current = null; setDropTarget(null); }}
        />

        <div className="flex-1 overflow-auto">
          <div className="prose-body mx-auto max-w-3xl space-y-1 px-6 py-10 text-[1.14rem] leading-[1.75] md:text-[1.18rem]">
            {blocks.length === 0 && (
              <EmptyDrop onDrop={(label) => { const b = makeByLabel(label); if (b) insertAtTop(b, 0); }} />
            )}

            {blocks.map((block, i) => (
              <div key={i}>
                <VDropZone
                  active={dropTarget?.kind === "before" && dropTarget.index === i}
                  onEnter={() => setDropTarget({ kind: "before", index: i })}
                  onLeave={() => setDropTarget(null)}
                  onDrop={() => handleDrop({ kind: "before", index: i })}
                />
                <BlockRow
                  block={block}
                  path={[i]}
                  focused={focused}
                  setFocused={setFocused}
                  onUpdate={updateAt}
                  onRemove={() => removeAtPath([i])}
                  onDragStart={() => { dragSource.current = { kind: "reorder", path: [i] }; }}
                  onDragEnd={() => { dragSource.current = null; setDropTarget(null); }}
                  settings={settings}
                  dropTarget={dropTarget}
                  setDropTarget={setDropTarget}
                  onDrop={handleDrop}
                  dragSource={dragSource}
                />
              </div>
            ))}

            {blocks.length > 0 && (
              <VDropZone
                active={dropTarget?.kind === "before" && dropTarget.index === blocks.length}
                onEnter={() => setDropTarget({ kind: "before", index: blocks.length })}
                onLeave={() => setDropTarget(null)}
                onDrop={() => handleDrop({ kind: "before", index: blocks.length })}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function isColumnable(b: ContentBlock, s: EditorSettings): boolean {
  if (b.kind === "columns") return false;
  return s.columnable_kinds.includes(b.kind);
}

function canJoin(existing: ContentBlock, incoming: ContentBlock, s: EditorSettings): boolean {
  if (existing.kind === "columns") {
    return existing.items.length < s.max_columns && isColumnable(incoming, s);
  }
  return isColumnable(existing, s) && isColumnable(incoming, s);
}

function getAtPath(blocks: ContentBlock[], path: number[]): ContentBlock | null {
  if (path.length === 0) return null;
  const [i, ...rest] = path;
  const b = blocks[i];
  if (!b) return null;
  if (rest.length === 0) return b;
  if (b.kind === "columns") return getAtPath(b.items, rest);
  return null;
}

function removePath(blocks: ContentBlock[], path: number[]): ContentBlock[] {
  if (path.length === 0) return blocks;
  const [i, ...rest] = path;
  if (rest.length === 0) return blocks.filter((_, idx) => idx !== i);
  return blocks.map((b, idx) => {
    if (idx !== i) return b;
    if (b.kind === "columns") {
      const items = removePath(b.items, rest);
      // Collapse columns of length <= 1
      if (items.length === 0) return b; // shouldn't happen; keep
      if (items.length === 1) return items[0];
      return { ...b, items };
    }
    return b;
  });
}

/* ---------------- Category toolbar with hover flyouts ---------------- */

function CategoryToolbar({
  onInsert, onPaletteDragStart, onPaletteDragEnd,
}: {
  onInsert: (item: PaletteItem) => void;
  onPaletteDragStart: (label: string) => void;
  onPaletteDragEnd: () => void;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenIdx(null), 150);
  };
  const cancelClose = () => {
    if (closeTimer.current) { window.clearTimeout(closeTimer.current); closeTimer.current = null; }
  };

  return (
    <aside data-palette className="relative w-20 shrink-0 overflow-visible border-r border-border bg-card py-3">
      <div className="flex flex-col items-center gap-1">
        {CATEGORIES.map((cat, i) => (
          <div
            key={cat.label}
            className="relative"
            onMouseEnter={() => { cancelClose(); setOpenIdx(i); }}
            onMouseLeave={scheduleClose}
          >
            <button
              className={`group flex h-14 w-16 flex-col items-center justify-center rounded-xl transition ${openIdx === i ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
            >
              <cat.icon className="h-4 w-4" />
              <span className="mt-1 text-[10px] font-semibold leading-tight">{cat.label}</span>
            </button>

            {openIdx === i && (
              <div
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
                className="absolute left-full top-0 z-50 ml-2 flex w-44 flex-col gap-1 rounded-md border border-border bg-card p-2 shadow-lg"
              >
                {cat.items.map((it) => (
                  <button
                    key={it.label}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/x-palette", it.label);
                      e.dataTransfer.effectAllowed = "copy";
                      onPaletteDragStart(it.label);
                    }}
                    onDragEnd={onPaletteDragEnd}
                    onClick={() => { onInsert(it); }}
                    className="flex items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-foreground transition hover:bg-secondary"
                  >
                    <it.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{it.label}</span>
                  </button>
                ))}
              </div>

            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

function HistoryButton({ icon: Icon, label, disabled, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition disabled:opacity-40 hover:text-foreground hover:shadow-[0_0_0_3px_color-mix(in_oklab,var(--heart)_25%,transparent)]"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/* ---------------- Path helpers ---------------- */

function applyUpdate(blocks: ContentBlock[], path: number[], patch: Partial<ContentBlock>): ContentBlock[] {
  if (path.length === 0) return blocks;
  const [i, ...rest] = path;
  return blocks.map((b, idx) => {
    if (idx !== i) return b;
    if (rest.length === 0) return { ...b, ...patch } as ContentBlock;
    if (b.kind === "columns") {
      return { ...b, items: applyUpdate(b.items, rest, patch) };
    }
    return b;
  });
}

/* ---------------- Vertical drop zone ---------------- */

function VDropZone({
  active, onEnter, onLeave, onDrop,
}: {
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onDrop: () => void;
}) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onEnter(); }}
      onDragLeave={onLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
      className={`my-1 h-2 rounded-full transition ${active ? "bg-heart" : "bg-transparent"}`}
    />
  );
}

/* ---------------- Empty drop ---------------- */

function EmptyDrop({ onDrop }: { onDrop: (label: string) => void }) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
      onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.getData("application/x-palette")); }}
      className="rounded-2xl border border-dashed border-border p-16 text-center text-sm text-muted-foreground"
    >
      Click or drag a block from the left to begin.
    </div>
  );
}

/* ---------------- Block row (with side drop targets for auto-columning) ---------------- */

function BlockRow({
  block, path, focused, setFocused, onUpdate, onRemove, onDragStart, onDragEnd, settings,
  dropTarget, setDropTarget, onDrop, dragSource,
}: {
  block: ContentBlock;
  path: number[];
  focused: string | null;
  setFocused: (v: string | null) => void;
  onUpdate: (path: number[], patch: Partial<ContentBlock>, opts?: { commit?: boolean }) => void;
  onRemove: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  settings: EditorSettings;
  dropTarget: DropTarget | null;
  setDropTarget: (t: DropTarget | null) => void;
  onDrop: (t: DropTarget) => void;
  dragSource: React.MutableRefObject<{ kind: "palette"; label: string } | { kind: "reorder"; path: number[] } | null>;
}) {
  const key = path.join(".");
  const isFocused = focused === key;
  const index = path[0];
  const isTopLevel = path.length === 1;

  const showColZones = isTopLevel && (
    block.kind === "columns"
      ? block.items.length < settings.max_columns
      : isColumnable(block, settings)
  );

  return (
    <div
      data-block
      onClick={(e) => { e.stopPropagation(); setFocused(key); }}
      className={`group relative rounded-xl px-4 py-2 transition ${isFocused ? "ring-2 ring-heart bg-heart/5" : "hover:ring-1 hover:ring-border"}`}
    >
      {/* Left column drop zone */}
      {showColZones && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            const src = dragSource.current;
            if (!src) return;
            setDropTarget({ kind: "col-left", index });
          }}
          onDragLeave={() => { if (dropTarget?.kind === "col-left" && dropTarget.index === index) setDropTarget(null); }}
          onDrop={(e) => { e.preventDefault(); onDrop({ kind: "col-left", index }); }}
          className={`absolute left-0 top-0 h-full w-3 rounded-l-xl transition ${dropTarget?.kind === "col-left" && dropTarget.index === index ? "bg-heart/70" : ""}`}
        />
      )}
      {showColZones && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            const src = dragSource.current;
            if (!src) return;
            setDropTarget({ kind: "col-right", index });
          }}
          onDragLeave={() => { if (dropTarget?.kind === "col-right" && dropTarget.index === index) setDropTarget(null); }}
          onDrop={(e) => { e.preventDefault(); onDrop({ kind: "col-right", index }); }}
          className={`absolute right-0 top-0 h-full w-3 rounded-r-xl transition ${dropTarget?.kind === "col-right" && dropTarget.index === index ? "bg-heart/70" : ""}`}
        />
      )}

      {/* Drag grip */}
      {path.length === 1 && (
        <button
          draggable
          onDragStart={(e) => {
            onDragStart?.();
            e.dataTransfer.setData("application/x-reorder", "1");
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragEnd={() => onDragEnd?.()}
          className="absolute -left-8 top-1/2 -translate-y-1/2 cursor-grab text-muted-foreground opacity-0 transition group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
          title="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </button>
      )}

      {/* Trash */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute -right-10 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full border text-white opacity-0 shadow-sm transition group-hover:opacity-100 hover:!bg-heart hover:!border-heart"
        style={{ background: "var(--tazkiyah)", borderColor: "var(--tazkiyah)" }}
        aria-label="Remove block"
        title="Remove block"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {block.kind === "columns" ? (
        <ColumnsView
          block={block}
          path={path}
          focused={focused}
          setFocused={setFocused}
          onUpdate={onUpdate}
          settings={settings}
        />
      ) : isFocused ? (
        <EditableBlock block={block} path={path} onUpdate={onUpdate} />
      ) : (
        <RenderBlock block={block} />
      )}
    </div>
  );
}

/* ---------------- Columns view (no add-column UI; wraps children) ---------------- */

function ColumnsView({
  block, path, focused, setFocused, onUpdate, settings,
}: {
  block: Extract<ContentBlock, { kind: "columns" }>;
  path: number[];
  focused: string | null;
  setFocused: (v: string | null) => void;
  onUpdate: (path: number[], patch: Partial<ContentBlock>, opts?: { commit?: boolean }) => void;
  settings: EditorSettings;
}) {
  const count = Math.max(1, Math.min(settings.max_columns, block.items.length));
  const gridCls = count === 1 ? "grid-cols-1" : count === 2 ? "md:grid-cols-2" : "md:grid-cols-3";

  return (
    <div className={`grid gap-4 ${gridCls}`}>
      {block.items.map((child, i) => {
        const childPath = [...path, i];
        const childKey = childPath.join(".");
        const isChildFocused = focused === childKey;
        return (
          <div
            key={i}
            onClick={(e) => { e.stopPropagation(); setFocused(childKey); }}
            className={`min-w-0 rounded-lg p-1 [&_img]:!my-0 [&>*]:!my-0 ${isChildFocused ? "ring-2 ring-heart bg-heart/5" : "hover:ring-1 hover:ring-border/60"}`}
          >
            {isChildFocused ? (
              <EditableBlock block={child} path={childPath} onUpdate={onUpdate} />
            ) : (
              <RenderBlock block={child} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Editable block ---------------- */

function EditableBlock({
  block, path, onUpdate,
}: {
  block: ContentBlock;
  path: number[];
  onUpdate: (path: number[], patch: Partial<ContentBlock>, opts?: { commit?: boolean }) => void;
}) {
  const base = "w-full bg-transparent outline-none";
  const set = (patch: Partial<ContentBlock>) => onUpdate(path, patch);
  const commitPatch = (patch: Partial<ContentBlock>) => onUpdate(path, patch, { commit: true });

  if (block.kind === "p") {
    return <AutoTextarea className={base} placeholder="Write a paragraph…" value={block.text} onChange={(v) => set({ text: v } as Partial<ContentBlock>)} onCommit={(v) => commitPatch({ text: v } as Partial<ContentBlock>)} />;
  }
  if (block.kind === "h2") {
    return <AutoTextarea className={`${base} font-display text-3xl md:text-4xl`} placeholder="Heading" value={block.text} onChange={(v) => set({ text: v } as Partial<ContentBlock>)} onCommit={(v) => commitPatch({ text: v } as Partial<ContentBlock>)} rows={1} />;
  }
  if (block.kind === "h3") {
    return <AutoTextarea className={`${base} font-display text-2xl md:text-3xl`} placeholder="Subheading" value={block.text} onChange={(v) => set({ text: v } as Partial<ContentBlock>)} onCommit={(v) => commitPatch({ text: v } as Partial<ContentBlock>)} rows={1} />;
  }
  if (block.kind === "callout") {
    return (
      <aside className="rounded-3xl border p-6" style={{ background: "color-mix(in oklab, var(--gold) 12%, var(--paper-warm))", borderColor: "color-mix(in oklab, var(--gold) 45%, transparent)" }}>
        <AutoTextarea className={`${base} font-display text-lg italic md:text-xl`} placeholder="Callout" value={block.text} onChange={(v) => set({ text: v } as Partial<ContentBlock>)} onCommit={(v) => commitPatch({ text: v } as Partial<ContentBlock>)} />
      </aside>
    );
  }
  if (block.kind === "quote") {
    const tint = block.tint ?? "tazkiyah";
    return (
      <blockquote className="rounded-3xl border-l-4 p-8" style={quoteTintStyle(tint)}>
        <div className="mb-3 flex items-center justify-end gap-1.5">
          {QUOTE_TINT_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => commitPatch({ tint: o.value } as Partial<ContentBlock>)}
              title={o.label}
              aria-label={`Tint: ${o.label}`}
              className={`h-5 w-5 rounded-full border-2 transition ${tint === o.value ? "border-foreground" : "border-transparent hover:border-border"}`}
              style={{ background: o.swatch }}
            />
          ))}
        </div>
        <AutoTextarea dir="rtl" className={`${base} font-arabic text-3xl leading-loose md:text-4xl`} placeholder="النص العربي (اختياري)" value={block.arabic ?? ""} onChange={(v) => set({ arabic: v } as Partial<ContentBlock>)} onCommit={(v) => commitPatch({ arabic: v } as Partial<ContentBlock>)} />
        <AutoTextarea className={`${base} mt-4 font-display text-xl italic md:text-2xl`} placeholder="Translation / quote" value={block.text} onChange={(v) => set({ text: v } as Partial<ContentBlock>)} onCommit={(v) => commitPatch({ text: v } as Partial<ContentBlock>)} />
        <input className={`${base} mt-3 text-sm text-muted-foreground`} placeholder="Source (e.g. Qur'an 94:5–6)" value={block.source ?? ""} onChange={(e) => set({ source: e.target.value } as Partial<ContentBlock>)} onBlur={(e) => commitPatch({ source: e.target.value } as Partial<ContentBlock>)} />
        <QuranFetcher onFetched={(a) => commitPatch({ arabic: a.arabic, text: a.translation, source: a.reference } as Partial<ContentBlock>)} />
      </blockquote>
    );
  }
  if (block.kind === "plain_quote") {
    return (
      <blockquote className="rounded-2xl border-l-4 border-border bg-secondary/40 p-6">
        <AutoTextarea className={`${base} font-display text-xl italic md:text-2xl`} placeholder="Quote text" value={block.text} onChange={(v) => set({ text: v } as Partial<ContentBlock>)} onCommit={(v) => commitPatch({ text: v } as Partial<ContentBlock>)} />
        <input className={`${base} mt-3 text-sm text-muted-foreground`} placeholder="Attribution (optional)" value={block.source ?? ""} onChange={(e) => set({ source: e.target.value } as Partial<ContentBlock>)} onBlur={(e) => commitPatch({ source: e.target.value } as Partial<ContentBlock>)} />
      </blockquote>
    );
  }
  if (block.kind === "arabic_large") {
    return (
      <div className="text-center">
        <AutoTextarea dir="rtl" className={`${base} font-arabic text-center leading-none`} placeholder="الله" value={block.arabic} onChange={(v) => set({ arabic: v } as Partial<ContentBlock>)} onCommit={(v) => commitPatch({ arabic: v } as Partial<ContentBlock>)} rows={1} style={{ fontSize: "clamp(3rem, 10vw, 7rem)" }} />
        <AutoTextarea className={`${base} mt-4 text-center font-display text-lg italic text-muted-foreground md:text-xl`} placeholder="Meaning / short English" value={block.english ?? ""} onChange={(v) => set({ english: v } as Partial<ContentBlock>)} onCommit={(v) => commitPatch({ english: v } as Partial<ContentBlock>)} rows={1} />
      </div>
    );
  }
  if (block.kind === "list") {
    return <ListEditor block={block} onSet={set} onCommit={commitPatch} />;
  }
  if (block.kind === "image") {
    return <ImageEditor block={block} onSet={set} onCommit={commitPatch} />;
  }
  if (block.kind === "video") {
    return <VideoEditor block={block} onSet={set} onCommit={commitPatch} />;
  }
  if (block.kind === "audio") {
    return (
      <figure className="space-y-2 rounded-2xl border border-border bg-card p-4">
        {block.src && <audio src={block.src} controls className="w-full" />}
        <input className={`${base} rounded-md border border-dashed border-border px-2 py-1 text-sm`} placeholder="Audio MP3 / OGG URL" value={block.src} onChange={(e) => set({ src: e.target.value } as Partial<ContentBlock>)} onBlur={(e) => commitPatch({ src: e.target.value } as Partial<ContentBlock>)} />
        <input className={`${base} rounded-md border border-dashed border-border px-2 py-1 text-sm text-muted-foreground`} placeholder="Caption (optional)" value={block.caption ?? ""} onChange={(e) => set({ caption: e.target.value } as Partial<ContentBlock>)} onBlur={(e) => commitPatch({ caption: e.target.value } as Partial<ContentBlock>)} />
      </figure>
    );
  }
  if (block.kind === "hyperlink") {
    return <LinkCardEditor block={block} onSet={set} onCommit={commitPatch} />;
  }
  if (block.kind === "recommended") {
    return <RecommendedEditor block={block} onCommit={commitPatch} />;
  }
  if (block.kind === "divider") {
    return <hr className="border-t border-border" />;
  }
  return null;
}

/* ---------------- List editor (per-item inputs, Enter/Backspace flow) ---------------- */

function ListEditor({
  block, onSet, onCommit,
}: {
  block: Extract<ContentBlock, { kind: "list" }>;
  onSet: (patch: Partial<ContentBlock>) => void;
  onCommit: (patch: Partial<ContentBlock>) => void;
}) {
  const items = block.items;
  const Tag = block.ordered ? "ol" : "ul";
  const markerCls = block.ordered ? "list-decimal" : "list-disc";


  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const focusReq = useRef<{ i: number; caret?: number } | null>(null);

  useEffect(() => {
    const req = focusReq.current;
    if (!req) return;
    const el = refs.current[req.i];
    if (el) {
      el.focus();
      const pos = req.caret ?? el.value.length;
      try { el.setSelectionRange(pos, pos); } catch {}
    }
    focusReq.current = null;
  });

  const update = (next: string[], persist = true) => {
    (persist ? onCommit : onSet)({ items: next } as Partial<ContentBlock>);
  };


  const changeAt = (i: number, v: string) => {
    const next = [...items];
    next[i] = v;
    onSet({ items: next } as Partial<ContentBlock>);
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const next = [...items];
      next.splice(i + 1, 0, "");
      focusReq.current = { i: i + 1, caret: 0 };
      update(next);
    } else if (e.key === "Backspace" && items[i] === "") {
      e.preventDefault();
      const next = items.filter((_, idx) => idx !== i);
      const target = i - 1;
      if (target >= 0) focusReq.current = { i: target };
      update(next);
    }
  };

  const activateGhost = (v: string) => {
    const next = [...items, v];
    focusReq.current = { i: items.length };
    update(next);
  };

  return (
    <Tag className={`${markerCls} space-y-2 pl-6`}>
      {items.map((it, i) => (
        <li key={i}>
          <input
            ref={(el) => { refs.current[i] = el; }}
            className="w-full bg-transparent outline-none"
            value={it}
            onChange={(e) => changeAt(i, e.target.value)}
            onBlur={() => onCommit({ items } as Partial<ContentBlock>)}
            onKeyDown={(e) => handleKey(i, e)}
          />
        </li>
      ))}
      <li>
        <input
          className="w-full bg-transparent outline-none placeholder:text-muted-foreground/60"
          value=""
          placeholder={items.length === 0 ? "Type a list item…" : "empty"}
          onChange={(e) => activateGhost(e.target.value)}
        />
      </li>
    </Tag>
  );
}



/* ---------------- Image editor with resize handles ---------------- */

function ImageEditor({
  block, onSet, onCommit,
}: {
  block: Extract<ContentBlock, { kind: "image" }>;
  onSet: (patch: Partial<ContentBlock>) => void;
  onCommit: (patch: Partial<ContentBlock>) => void;
}) {
  const width = typeof block.width === "number" ? block.width : 1;
  return (
    <figure className="space-y-2">
      {block.src ? (
        <ResizableMedia
          width={width}
          onChange={(w) => onSet({ width: w } as Partial<ContentBlock>)}
          onCommit={(w) => onCommit({ width: w } as Partial<ContentBlock>)}
        >
          <img src={block.src} alt={block.alt ?? ""} className="w-full rounded-2xl" />
        </ResizableMedia>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">No image URL</div>
      )}
      <input className="w-full rounded-md border border-dashed border-border bg-transparent px-2 py-1 text-sm outline-none" placeholder="Image URL" value={block.src} onChange={(e) => onSet({ src: e.target.value } as Partial<ContentBlock>)} onBlur={(e) => onCommit({ src: e.target.value } as Partial<ContentBlock>)} />
      <input className="w-full rounded-md border border-dashed border-border bg-transparent px-2 py-1 text-sm outline-none" placeholder="Alt text" value={block.alt ?? ""} onChange={(e) => onSet({ alt: e.target.value } as Partial<ContentBlock>)} onBlur={(e) => onCommit({ alt: e.target.value } as Partial<ContentBlock>)} />
      <input className="w-full rounded-md border border-dashed border-border bg-transparent px-2 py-1 text-center text-sm text-muted-foreground outline-none" placeholder="Caption (optional)" value={block.caption ?? ""} onChange={(e) => onSet({ caption: e.target.value } as Partial<ContentBlock>)} onBlur={(e) => onCommit({ caption: e.target.value } as Partial<ContentBlock>)} />
    </figure>
  );
}

/* ---------------- Video editor with resize handles ---------------- */

function VideoEditor({
  block, onSet, onCommit,
}: {
  block: Extract<ContentBlock, { kind: "video" }>;
  onSet: (patch: Partial<ContentBlock>) => void;
  onCommit: (patch: Partial<ContentBlock>) => void;
}) {
  const width = typeof block.width === "number" ? block.width : 1;
  return (
    <figure className="space-y-2">
      {block.src ? (
        <ResizableMedia
          width={width}
          onChange={(w) => onSet({ width: w } as Partial<ContentBlock>)}
          onCommit={(w) => onCommit({ width: w } as Partial<ContentBlock>)}
        >
          <div className="pointer-events-none">
            <RenderBlock block={{ ...block, width: 1 }} />
          </div>
        </ResizableMedia>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">No video URL</div>
      )}
      <input className="w-full rounded-md border border-dashed border-border bg-transparent px-2 py-1 text-sm outline-none" placeholder="YouTube / Vimeo / MP4 URL" value={block.src} onChange={(e) => onSet({ src: e.target.value } as Partial<ContentBlock>)} onBlur={(e) => onCommit({ src: e.target.value } as Partial<ContentBlock>)} />
      <input className="w-full rounded-md border border-dashed border-border bg-transparent px-2 py-1 text-center text-sm text-muted-foreground outline-none" placeholder="Caption (optional)" value={block.caption ?? ""} onChange={(e) => onSet({ caption: e.target.value } as Partial<ContentBlock>)} onBlur={(e) => onCommit({ caption: e.target.value } as Partial<ContentBlock>)} />
    </figure>
  );
}

/* ---------------- Resizable wrapper (corner handles) ---------------- */

function ResizableMedia({
  width, onChange, onCommit, children,
}: {
  width: number;
  onChange: (w: number) => void;
  onCommit: (w: number) => void;
  children: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<{ startX: number; startWidth: number; parentWidth: number; anchor: "l" | "r" } | null>(null);

  const onDown = (anchor: "tl" | "tr" | "bl" | "br") => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const parent = wrapRef.current?.parentElement;
    if (!parent) return;
    dragging.current = {
      startX: e.clientX,
      startWidth: width,
      parentWidth: parent.getBoundingClientRect().width,
      anchor: anchor === "tl" || anchor === "bl" ? "l" : "r",
    };
    const move = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const d = ev.clientX - dragging.current.startX;
      const delta = (dragging.current.anchor === "r" ? d : -d) / dragging.current.parentWidth;
      const next = Math.max(0.33, Math.min(1, dragging.current.startWidth + delta * 2));
      onChange(next);
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      if (dragging.current) {
        const parent2 = wrapRef.current?.parentElement;
        if (parent2) {
          // Commit current width
          const style = wrapRef.current?.style.width;
          const pct = style ? parseFloat(style) / 100 : width;
          onCommit(isFinite(pct) ? pct : width);
        }
      }
      dragging.current = null;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const pct = Math.round(width * 100);

  return (
    <div className="flex justify-center">
      <div ref={wrapRef} className="relative" style={{ width: `${pct}%` }}>
        {children}
        <Handle pos="tl" onMouseDown={onDown("tl")} />
        <Handle pos="tr" onMouseDown={onDown("tr")} />
        <Handle pos="bl" onMouseDown={onDown("bl")} />
        <Handle pos="br" onMouseDown={onDown("br")} />
      </div>
    </div>
  );
}

function Handle({ pos, onMouseDown }: { pos: "tl" | "tr" | "bl" | "br"; onMouseDown: (e: React.MouseEvent) => void }) {
  const posCls = {
    tl: "-top-2 -left-2 cursor-nwse-resize",
    tr: "-top-2 -right-2 cursor-nesw-resize",
    bl: "-bottom-2 -left-2 cursor-nesw-resize",
    br: "-bottom-2 -right-2 cursor-nwse-resize",
  }[pos];
  return (
    <div
      data-keep-focus
      onMouseDown={onMouseDown}
      className={`absolute z-10 h-4 w-4 rounded-full border-2 border-white shadow ${posCls}`}
      style={{ background: "var(--heart)" }}
    />
  );
}

/* ---------------- Link card editor (no navigation on click) ---------------- */

function LinkCardEditor({
  block, onSet, onCommit,
}: {
  block: Extract<ContentBlock, { kind: "hyperlink" }>;
  onSet: (patch: Partial<ContentBlock>) => void;
  onCommit: (patch: Partial<ContentBlock>) => void;
}) {
  const testLink = () => {
    const url = block.url && block.url.trim() ? block.url : "#";
    window.open(url, "_blank", "noopener,noreferrer");
  };
  return (
    <div className="relative space-y-2 rounded-2xl border border-border bg-card p-5">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); testLink(); }}
        className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-pill border border-border px-2.5 py-1 text-xs font-semibold hover:bg-secondary"
      >
        <ExternalLink className="h-3 w-3" /> Test link
      </button>
      <input className="w-full bg-transparent font-display text-lg font-semibold outline-none" style={{ color: "var(--heart)" }} placeholder="Link title" value={block.label} onChange={(e) => onSet({ label: e.target.value } as Partial<ContentBlock>)} onBlur={(e) => onCommit({ label: e.target.value } as Partial<ContentBlock>)} />
      <AutoTextarea className="w-full bg-transparent text-sm text-muted-foreground outline-none" placeholder="Description (optional)" value={block.description ?? ""} onChange={(v) => onSet({ description: v } as Partial<ContentBlock>)} onCommit={(v) => onCommit({ description: v } as Partial<ContentBlock>)} rows={1} />
      <input className="w-full rounded-md border border-dashed border-border bg-transparent px-2 py-1 text-xs text-muted-foreground outline-none" placeholder="https://…" value={block.url} onChange={(e) => onSet({ url: e.target.value } as Partial<ContentBlock>)} onBlur={(e) => onCommit({ url: e.target.value } as Partial<ContentBlock>)} />
    </div>
  );
}

/* ---------------- Recommended editor (search dropdown) ---------------- */

const MAX_SEARCH_RESULTS = 8;

function RecommendedEditor({
  block, onCommit,
}: {
  block: Extract<ContentBlock, { kind: "recommended" }>;
  onCommit: (patch: Partial<ContentBlock>) => void;
}) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const { data: results = [] } = useQuery({
    queryKey: ["admin-article-search", trimmed],
    enabled: trimmed.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("slug,title,pillar")
        .ilike("title", `%${trimmed}%`)
        .eq("published", true)
        .limit(MAX_SEARCH_RESULTS);
      return data ?? [];
    },
  });

  const { data: selected } = useQuery({
    queryKey: ["admin-article-selected", block.slug],
    enabled: !!block.slug,
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("slug,title,pillar,description")
        .eq("slug", block.slug)
        .maybeSingle();
      return data;
    },
  });

  return (
    <div className="space-y-3">
      {selected ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="eyebrow">Recommended · {selected.pillar.replace(/-/g, " ")}</p>
          <h4 className="mt-2 font-display text-xl">{selected.title}</h4>
          {selected.description && <p className="mt-1 text-sm text-muted-foreground">{selected.description}</p>}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
          No article selected
        </div>
      )}
      <div className="relative" data-keep-focus>
        <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-transparent px-2 py-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Search articles by title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {trimmed.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-border bg-card shadow-lg">
            {results.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">No matches</li>
            ) : results.map((r) => (
              <li key={r.slug}>
                <button
                  type="button"
                  onClick={() => { onCommit({ slug: r.slug } as Partial<ContentBlock>); setQuery(""); }}
                  className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-secondary"
                >
                  <span className="font-semibold">{r.title}</span>
                  <span className="text-xs text-muted-foreground">{r.pillar.replace(/-/g, " ")} · {r.slug}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------------- AutoTextarea ---------------- */

function AutoTextarea({
  value, onChange, onCommit, className, placeholder, rows = 2, dir, style,
}: {
  value: string;
  onChange: (v: string) => void;
  onCommit?: (v: string) => void;
  className?: string;
  placeholder?: string;
  rows?: number;
  dir?: "rtl" | "ltr";
  style?: React.CSSProperties;
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
      style={style}
      className={`${className ?? ""} resize-none overflow-hidden`}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onCommit?.(e.target.value)}
    />
  );
}
