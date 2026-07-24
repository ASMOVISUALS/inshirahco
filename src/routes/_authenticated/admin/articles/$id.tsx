import { useCallback, useEffect, useRef, useState } from "react";
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
  Columns as ColumnsIcon,
  Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PILLARS, RESOURCE_TYPES, type Pillar, type ResourceType, type ContentBlock } from "@/lib/content";
import { LetterMark } from "@/components/LetterMark";
import { RenderBlock, wordsIn, readTimeFrom } from "@/lib/article-blocks";

export const Route = createFileRoute("/_authenticated/admin/articles/$id")({
  head: () => ({ meta: [{ title: "Edit article — Admin" }, { name: "robots", content: "noindex" }] }),
  component: EditArticle,
});

/* ---------------- Block palette ---------------- */

type BlockKind = ContentBlock["kind"];

interface PaletteItem {
  kind: BlockKind;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  make: () => ContentBlock;
}

const BLOCK_PALETTE: PaletteItem[] = [
  { kind: "p", label: "Paragraph", icon: TypeIcon, make: () => ({ kind: "p", text: "" }) },
  { kind: "h2", label: "Heading", icon: Heading1, make: () => ({ kind: "h2", text: "" }) },
  { kind: "h3", label: "Subheading", icon: Heading2, make: () => ({ kind: "h3", text: "" }) },
  { kind: "quote", label: "Qur'an quote", icon: Quote, make: () => ({ kind: "quote", text: "", arabic: "", source: "" }) },
  { kind: "plain_quote", label: "Quote", icon: Quote, make: () => ({ kind: "plain_quote", text: "", source: "" }) },
  { kind: "arabic_large", label: "Large Arabic", icon: Languages, make: () => ({ kind: "arabic_large", arabic: "", english: "" }) },
  { kind: "callout", label: "Callout", icon: Lightbulb, make: () => ({ kind: "callout", text: "" }) },
  { kind: "list", label: "Bullet list", icon: ListIcon, make: () => ({ kind: "list", items: [""], ordered: false }) },
  { kind: "list", label: "Numbered list", icon: ListOrdered, make: () => ({ kind: "list", items: [""], ordered: true }) },
  { kind: "image", label: "Image", icon: ImageIcon, make: () => ({ kind: "image", src: "", alt: "", caption: "" }) },
  { kind: "video", label: "Video", icon: VideoIcon, make: () => ({ kind: "video", src: "", caption: "" }) },
  { kind: "audio", label: "Audio", icon: AudioLines, make: () => ({ kind: "audio", src: "", caption: "" }) },
  { kind: "hyperlink", label: "Link card", icon: LinkIcon, make: () => ({ kind: "hyperlink", url: "", label: "", description: "" }) },
  { kind: "recommended", label: "Recommended", icon: BookOpen, make: () => ({ kind: "recommended", slug: "" }) },
  { kind: "columns", label: "Columns", icon: ColumnsIcon, make: () => ({ kind: "columns", items: [{ kind: "p", text: "" }, { kind: "p", text: "" }] }) },
  { kind: "divider", label: "Divider", icon: Minus, make: () => ({ kind: "divider" }) },
];

function makeByLabel(label: string): ContentBlock | null {
  const p = BLOCK_PALETTE.find((b) => b.label === label);
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
  const stateRef = useRef(state);
  stateRef.current = state;

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

  const commitCurrent = useCallback(() => {
    setState((s) => {
      // snapshot current present if it differs from the last past entry
      const last = s.past[s.past.length - 1];
      if (last !== undefined && JSON.stringify(last) === JSON.stringify(s.present)) return s;
      return { ...s, past: [...s.past, s.present], future: [] };
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
    commitCurrent,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}

/* ---------------- Body editing suite ---------------- */

interface EditorSettings {
  max_columns: number;
  columnable_kinds: BlockKind[];
}

const DEFAULT_SETTINGS: EditorSettings = {
  max_columns: 4,
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
    max_columns: data?.max_columns ?? DEFAULT_SETTINGS.max_columns,
    columnable_kinds: data?.columnable_kinds ?? DEFAULT_SETTINGS.columnable_kinds,
  };
}

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
  const [focused, setFocused] = useState<string | null>(null); // path key like "2" or "2.1"
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Structural ops always commit
  const insertTop = (b: ContentBlock, at?: number) => {
    history.commit((prev) => {
      const idx = typeof at === "number" ? at : prev.length;
      const next = [...prev];
      next.splice(idx, 0, b);
      return next;
    });
  };

  const removeTop = (i: number) => {
    history.commit((prev) => prev.filter((_, idx) => idx !== i));
    setFocused(null);
  };

  const moveTop = (from: number, to: number) => {
    if (from === to) return;
    history.commit((prev) => {
      const next = [...prev];
      const [x] = next.splice(from, 1);
      next.splice(to > from ? to - 1 : to, 0, x);
      return next;
    });
  };

  // Update at path — used by inline text edits (uses `set`, not `commit`)
  const updateAt = (path: number[], patch: Partial<ContentBlock>, opts?: { commit?: boolean }) => {
    const fn = opts?.commit ? history.commit : history.set;
    fn((prev) => applyUpdate(prev, path, patch));
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
        <aside data-palette className="w-20 shrink-0 overflow-y-auto border-r border-border bg-card py-3">
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
                onClick={() => insertTop(p.make())}
                className="group flex h-14 w-16 flex-col items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <p.icon className="h-4 w-4" />
                <span className="mt-1 text-[9px] font-semibold leading-tight text-center px-1">{p.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1 overflow-auto">
          <div className="prose-body mx-auto max-w-3xl space-y-1 px-6 py-10 text-[1.14rem] leading-[1.75] md:text-[1.18rem]">
            {blocks.length === 0 && (
              <EmptyDrop onDrop={(label) => { const b = makeByLabel(label); if (b) insertTop(b, 0); }} />
            )}

            {blocks.map((block, i) => (
              <div key={i}>
                <DropZone
                  active={dragOver === i}
                  onEnter={() => setDragOver(i)}
                  onLeave={() => setDragOver(null)}
                  onDropPalette={(label) => { const b = makeByLabel(label); if (b) insertTop(b, i); setDragOver(null); }}
                  onDropReorder={() => { if (dragFrom.current !== null) moveTop(dragFrom.current, i); dragFrom.current = null; setDragOver(null); }}
                />
                <BlockRow
                  block={block}
                  path={[i]}
                  focused={focused}
                  setFocused={setFocused}
                  onUpdate={updateAt}
                  onRemove={() => removeTop(i)}
                  onDragStart={() => { dragFrom.current = i; }}
                  onDragEnd={() => { dragFrom.current = null; setDragOver(null); }}
                  settings={settings}
                  commit={history.commit}
                />
              </div>
            ))}

            {blocks.length > 0 && (
              <DropZone
                active={dragOver === blocks.length}
                onEnter={() => setDragOver(blocks.length)}
                onLeave={() => setDragOver(null)}
                onDropPalette={(label) => { const b = makeByLabel(label); if (b) insertTop(b); setDragOver(null); }}
                onDropReorder={() => { if (dragFrom.current !== null) moveTop(dragFrom.current, blocks.length); dragFrom.current = null; setDragOver(null); }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
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

/* ---------------- Recursive path update ---------------- */

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

/* ---------------- Block row wrapper (with grip + trash) ---------------- */

function BlockRow({
  block, path, focused, setFocused, onUpdate, onRemove, onDragStart, onDragEnd, settings, commit,
}: {
  block: ContentBlock;
  path: number[];
  focused: string | null;
  setFocused: (v: string | null) => void;
  onUpdate: (path: number[], patch: Partial<ContentBlock>, opts?: { commit?: boolean }) => void;
  onRemove: () => void;
  onDragStart?: (path: number[]) => void;
  onDragEnd?: () => void;
  settings: EditorSettings;
  commit: (next: ContentBlock[] | ((prev: ContentBlock[]) => ContentBlock[])) => void;
}) {
  const key = path.join(".");
  const isFocused = focused === key;

  return (
    <div
      data-block
      onClick={(e) => { e.stopPropagation(); setFocused(key); }}
      className={`group relative rounded-xl px-4 py-2 transition ${isFocused ? "ring-2 ring-heart bg-heart/5" : "hover:ring-1 hover:ring-border"}`}
    >
      {/* Drag grip */}
      {path.length === 1 && (
        <button
          draggable
          onDragStart={(e) => {
            onDragStart?.(path);
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

      {/* Trash (always on hover) */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute -right-10 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full border text-white opacity-0 shadow-sm transition group-hover:opacity-100 hover:!bg-heart hover:!border-heart"
        style={{ background: "var(--tazkiyah)", borderColor: "var(--tazkiyah)" }}
        aria-label="Remove block"
        title="Remove block"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {isFocused ? (
        <EditableBlock
          block={block}
          path={path}
          onUpdate={onUpdate}
          settings={settings}
          focused={focused}
          setFocused={setFocused}
          commit={commit}
        />
      ) : (
        <RenderBlock block={block} />
      )}
    </div>
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
        const label = e.dataTransfer.getData("application/x-palette");
        if (label) { onDropPalette(label); return; }
        onDropReorder();
      }}
      className={`my-1 h-2 rounded-full transition ${active ? "bg-heart" : "bg-transparent"}`}
    />
  );
}

/* ---------------- Editable block (matches published look) ---------------- */

function EditableBlock({
  block, path, onUpdate, settings, focused, setFocused, commit,
}: {
  block: ContentBlock;
  path: number[];
  onUpdate: (path: number[], patch: Partial<ContentBlock>, opts?: { commit?: boolean }) => void;
  settings: EditorSettings;
  focused: string | null;
  setFocused: (v: string | null) => void;
  commit: (next: ContentBlock[] | ((prev: ContentBlock[]) => ContentBlock[])) => void;
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
    return (
      <blockquote className="rounded-3xl border-l-4 p-8" style={{ background: "color-mix(in oklab, var(--tazkiyah-soft) 35%, var(--paper-warm))", borderColor: "var(--tazkiyah)" }}>
        <AutoTextarea dir="rtl" className={`${base} font-arabic text-3xl leading-loose md:text-4xl`} placeholder="النص العربي (اختياري)" value={block.arabic ?? ""} onChange={(v) => set({ arabic: v } as Partial<ContentBlock>)} onCommit={(v) => commitPatch({ arabic: v } as Partial<ContentBlock>)} />
        <AutoTextarea className={`${base} mt-4 font-display text-xl italic md:text-2xl`} placeholder="Translation / quote" value={block.text} onChange={(v) => set({ text: v } as Partial<ContentBlock>)} onCommit={(v) => commitPatch({ text: v } as Partial<ContentBlock>)} />
        <input className={`${base} mt-3 text-sm text-muted-foreground`} placeholder="Source (e.g. Qur'an 94:5–6)" value={block.source ?? ""} onChange={(e) => set({ source: e.target.value } as Partial<ContentBlock>)} onBlur={(e) => commitPatch({ source: e.target.value } as Partial<ContentBlock>)} />
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
                const items = block.items.slice(); items[i] = e.target.value;
                set({ items } as Partial<ContentBlock>);
              }}
              onBlur={(e) => {
                const items = block.items.slice(); items[i] = e.target.value;
                commitPatch({ items } as Partial<ContentBlock>);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const items = [...block.items]; items.splice(i + 1, 0, "");
                  commitPatch({ items } as Partial<ContentBlock>);
                }
              }}
            />
            <button type="button" onClick={() => commitPatch({ items: block.items.filter((_, j) => j !== i) } as Partial<ContentBlock>)} className="text-xs text-muted-foreground hover:text-heart" aria-label="Remove item">×</button>
          </li>
        ))}
        <li className="list-none">
          <button type="button" onClick={() => commitPatch({ items: [...block.items, ""] } as Partial<ContentBlock>)} className="text-xs font-semibold hover:underline" style={{ color: "var(--heart)" }}>+ Add item</button>
        </li>
      </Tag>
    );
  }
  if (block.kind === "image") {
    return (
      <figure className="space-y-2">
        {block.src && <img src={block.src} alt={block.alt ?? ""} className="w-full rounded-2xl" />}
        <input className={`${base} rounded-md border border-dashed border-border px-2 py-1 text-sm`} placeholder="Image URL" value={block.src} onChange={(e) => set({ src: e.target.value } as Partial<ContentBlock>)} onBlur={(e) => commitPatch({ src: e.target.value } as Partial<ContentBlock>)} />
        <input className={`${base} rounded-md border border-dashed border-border px-2 py-1 text-sm`} placeholder="Alt text" value={block.alt ?? ""} onChange={(e) => set({ alt: e.target.value } as Partial<ContentBlock>)} onBlur={(e) => commitPatch({ alt: e.target.value } as Partial<ContentBlock>)} />
        <input className={`${base} rounded-md border border-dashed border-border px-2 py-1 text-center text-sm text-muted-foreground`} placeholder="Caption (optional)" value={block.caption ?? ""} onChange={(e) => set({ caption: e.target.value } as Partial<ContentBlock>)} onBlur={(e) => commitPatch({ caption: e.target.value } as Partial<ContentBlock>)} />
      </figure>
    );
  }
  if (block.kind === "video") {
    return (
      <figure className="space-y-2">
        <RenderBlock block={block} />
        <input className={`${base} rounded-md border border-dashed border-border px-2 py-1 text-sm`} placeholder="YouTube / Vimeo / MP4 URL" value={block.src} onChange={(e) => set({ src: e.target.value } as Partial<ContentBlock>)} onBlur={(e) => commitPatch({ src: e.target.value } as Partial<ContentBlock>)} />
        <input className={`${base} rounded-md border border-dashed border-border px-2 py-1 text-center text-sm text-muted-foreground`} placeholder="Caption (optional)" value={block.caption ?? ""} onChange={(e) => set({ caption: e.target.value } as Partial<ContentBlock>)} onBlur={(e) => commitPatch({ caption: e.target.value } as Partial<ContentBlock>)} />
      </figure>
    );
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
    return (
      <div className="space-y-2 rounded-2xl border border-border bg-card p-5">
        <input className={`${base} font-display text-lg font-semibold`} style={{ color: "var(--heart)" }} placeholder="Link title" value={block.label} onChange={(e) => set({ label: e.target.value } as Partial<ContentBlock>)} onBlur={(e) => commitPatch({ label: e.target.value } as Partial<ContentBlock>)} />
        <AutoTextarea className={`${base} text-sm text-muted-foreground`} placeholder="Description (optional)" value={block.description ?? ""} onChange={(v) => set({ description: v } as Partial<ContentBlock>)} onCommit={(v) => commitPatch({ description: v } as Partial<ContentBlock>)} rows={1} />
        <input className={`${base} rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground`} placeholder="https://…" value={block.url} onChange={(e) => set({ url: e.target.value } as Partial<ContentBlock>)} onBlur={(e) => commitPatch({ url: e.target.value } as Partial<ContentBlock>)} />
      </div>
    );
  }
  if (block.kind === "recommended") {
    return (
      <div className="space-y-2">
        <RenderBlock block={block} />
        <input className={`${base} rounded-md border border-dashed border-border px-2 py-1 text-sm`} placeholder="Article slug (e.g. finding-quiet)" value={block.slug} onChange={(e) => set({ slug: e.target.value } as Partial<ContentBlock>)} onBlur={(e) => commitPatch({ slug: e.target.value } as Partial<ContentBlock>)} />
      </div>
    );
  }
  if (block.kind === "divider") {
    return <hr className="border-t border-border" />;
  }
  if (block.kind === "columns") {
    return (
      <ColumnEditor
        block={block}
        path={path}
        onUpdate={onUpdate}
        settings={settings}
        focused={focused}
        setFocused={setFocused}
        commit={commit}
      />
    );
  }
  return null;
}

/* ---------------- Column editor ---------------- */

function ColumnEditor({
  block, path, onUpdate, settings, focused, setFocused, commit,
}: {
  block: Extract<ContentBlock, { kind: "columns" }>;
  path: number[];
  onUpdate: (path: number[], patch: Partial<ContentBlock>, opts?: { commit?: boolean }) => void;
  settings: EditorSettings;
  focused: string | null;
  setFocused: (v: string | null) => void;
  commit: (next: ContentBlock[] | ((prev: ContentBlock[]) => ContentBlock[])) => void;
}) {
  const count = block.items.length;
  const gridCls = count === 1 ? "grid-cols-1" : count === 2 ? "md:grid-cols-2" : count === 3 ? "md:grid-cols-3" : "md:grid-cols-4";

  const addCol = () => {
    if (count >= settings.max_columns) return;
    onUpdate(path, { items: [...block.items, { kind: "p", text: "" }] } as Partial<ContentBlock>, { commit: true });
  };
  const removeCol = (i: number) => {
    if (count <= 1) return;
    onUpdate(path, { items: block.items.filter((_, j) => j !== i) } as Partial<ContentBlock>, { commit: true });
  };
  const changeKind = (i: number, kindLabel: string) => {
    const made = makeByLabel(kindLabel);
    if (!made) return;
    const items = block.items.slice();
    items[i] = made;
    onUpdate(path, { items } as Partial<ContentBlock>, { commit: true });
  };

  const columnable = BLOCK_PALETTE.filter((p) => settings.columnable_kinds.includes(p.kind));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-bold uppercase tracking-widest">{count} column{count > 1 ? "s" : ""}</span>
        <button
          type="button"
          onClick={addCol}
          disabled={count >= settings.max_columns}
          className="inline-flex items-center gap-1 rounded-pill border border-border px-2 py-1 hover:bg-secondary disabled:opacity-40"
        >
          <Plus className="h-3 w-3" /> Add column
        </button>
      </div>
      <div className={`grid gap-4 ${gridCls}`}>
        {block.items.map((child, i) => {
          const childPath = [...path, i];
          const childKey = childPath.join(".");
          const isChildFocused = focused === childKey;
          return (
            <div key={i} className={`group/col relative min-w-0 rounded-xl border border-dashed p-3 transition ${isChildFocused ? "border-heart" : "border-border/60"}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <select
                  className="rounded-md border border-input bg-background px-2 py-0.5 text-xs"
                  value={paletteLabelFor(child)}
                  onChange={(e) => changeKind(i, e.target.value)}
                >
                  {columnable.map((p) => <option key={p.label} value={p.label}>{p.label}</option>)}
                </select>
                {count > 1 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeCol(i); }}
                    className="text-xs text-muted-foreground hover:text-heart"
                    aria-label="Remove column"
                    title="Remove column"
                  >
                    ×
                  </button>
                )}
              </div>
              <div
                onClick={(e) => { e.stopPropagation(); setFocused(childKey); }}
                className={`min-w-0 rounded-lg p-1 [&_img]:!my-0 [&>*]:!my-0 ${isChildFocused ? "ring-2 ring-heart bg-heart/5" : ""}`}
              >
                {isChildFocused ? (
                  <EditableBlock
                    block={child}
                    path={childPath}
                    onUpdate={onUpdate}
                    settings={settings}
                    focused={focused}
                    setFocused={setFocused}
                    commit={commit}
                  />
                ) : (
                  <RenderBlock block={child} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function paletteLabelFor(block: ContentBlock): string {
  // pick the first palette entry whose kind matches
  const match = BLOCK_PALETTE.find((p) => p.kind === block.kind);
  return match?.label ?? "Paragraph";
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
