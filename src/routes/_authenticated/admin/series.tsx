import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Eye, EyeOff, Clock, Archive as ArchiveIcon, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ArabicLetterPicker, TintSelect, TINT_OPTIONS } from "@/components/ArabicLetterPicker";
import { usePillars } from "@/hooks/use-cms";
import type { SeriesRow, SeriesStatus } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin/series")({
  head: () => ({ meta: [{ title: "Series — Admin" }, { name: "robots", content: "noindex" }] }),
  component: SeriesAdmin,
});

function tintColor(tint: string): string {
  return TINT_OPTIONS.find((o) => o.value === tint)?.color ?? "var(--heart)";
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

function SeriesAdmin() {
  const qc = useQueryClient();
  const pillars = usePillars();
  const [tab, setTab] = useState<"active" | "archive">("active");

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "series", tab],
    queryFn: async (): Promise<SeriesRow[]> => {
      const base = supabase.from("series" as never).select("*");
      const q = tab === "active" ? base.is("archived_at", null) : base.not("archived_at", "is", null);
      const { data, error } = await q.order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SeriesRow[];
    },
  });

  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<SeriesRow | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "series"] });
    qc.invalidateQueries({ queryKey: ["cms", "series"] });
  };

  const create = useMutation({
    mutationFn: async () => {
      const nextSort = (data.reduce((m, r) => Math.max(m, r.sort_order), 0) || 0) + 1;
      const base = "new-series";
      const existing = new Set(data.map((r) => r.slug));
      let slug = base;
      let n = 1;
      while (existing.has(slug)) slug = `${base}-${++n}`;
      const { data: row, error } = await supabase
        .from("series" as never)
        .insert({ slug, title: "Untitled series", tint: "heart", sort_order: nextSort, status: "hidden" } as never)
        .select("*")
        .single();
      if (error) throw error;
      return row as unknown as SeriesRow;
    },
    onSuccess: (row) => { invalidate(); setEditing(row); },
  });

  const save = useMutation({
    mutationFn: async (row: SeriesRow) => {
      // Resolve pillar_id from slug (nullable — series may have no pillar).
      let pillarId: string | null = null;
      if (row.pillar) {
        const { data: p, error: pErr } = await supabase
          .from("pillars").select("id").eq("slug", row.pillar).maybeSingle();
        if (pErr) throw pErr;
        if (!p) throw new Error(`Pillar "${row.pillar}" not found.`);
        pillarId = p.id;
      }
      const { error } = await supabase.from("series" as never).update({
        slug: row.slug,
        title: row.title,
        description: row.description,
        pillar: row.pillar,
        pillar_id: pillarId,
        cover_image: row.cover_image,
        arabic_letter: row.arabic_letter,
        tint: row.tint,
        sort_order: row.sort_order,
        status: row.status,
      } as never).eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setEditing(null); setSelected(null); },
  });

  const setStatus = useMutation({
    mutationFn: async (p: { id: string; status: SeriesStatus }) => {
      const { error } = await supabase.from("series" as never).update({ status: p.status } as never).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("series" as never).update({ archived_at: new Date().toISOString() } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const restore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("series" as never).update({ archived_at: null } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-6" onClick={() => setSelected(null)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display">Series</h2>
          <p className="text-xs text-muted-foreground">Ongoing collections of articles. Click a tile to edit.</p>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="inline-flex rounded-full border border-border p-0.5 text-xs font-semibold">
            <button
              onClick={() => setTab("active")}
              className={`rounded-full px-3 py-1 ${tab === "active" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
            >Active</button>
            <button
              onClick={() => setTab("archive")}
              className={`rounded-full px-3 py-1 ${tab === "archive" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
            >Archive</button>
          </div>
          {tab === "active" && (
            <button
              type="button"
              onClick={() => create.mutate()}
              disabled={create.isPending}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--heart)" }}
            >
              <Plus className="h-3.5 w-3.5" /> New series
            </button>
          )}
        </div>
      </div>

      {data.length === 0 && (
        <p className="rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground">
          {tab === "active" ? "No series yet. Create your first one." : "Nothing archived."}
        </p>
      )}

      <div className="grid items-start gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((r) => {
          const isEditing = editing?.id === r.id;
          if (isEditing) {
            return (
              <SeriesEditor
                key={r.id}
                value={editing}
                pillars={pillars}
                onChange={setEditing}
                onCancel={() => setEditing(null)}
                onSave={() => save.mutate(editing)}
                saving={save.isPending}
              />
            );
          }
          const isSelected = selected === r.id;
          const color = tintColor(r.tint);
          return (
            <div
              key={r.id}
              onClick={(e) => { e.stopPropagation(); setSelected(isSelected ? null : r.id); }}
              className={
                "group relative flex flex-col self-start cursor-pointer rounded-2xl border p-5 transition-all " +
                (isSelected ? "shadow-lg" : "hover:shadow-md")
              }
              style={{
                background: `color-mix(in oklab, ${color} 10%, var(--card))`,
                borderColor: isSelected ? color : `color-mix(in oklab, ${color} 30%, transparent)`,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-full"
                  style={{ background: `color-mix(in oklab, ${color} 22%, var(--paper))`, color }}
                >
                  <span className="font-arabic text-2xl leading-none">{r.arabic_letter || "—"}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-xl font-semibold leading-tight">{r.title}</h3>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    <span className="font-mono">{r.slug}</span>
                    {r.pillar && <> · {r.pillar}</>}
                  </p>
                </div>
                <StatusPill status={r.status} color={color} />
              </div>

              {r.description && (
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
              )}

              {isSelected && (
                <div
                  className="mt-4 flex flex-wrap justify-end gap-2 border-t pt-3"
                  style={{ borderColor: `color-mix(in oklab, ${color} 25%, transparent)` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {tab === "active" ? (
                    <>
                      <StatusButton current={r.status} target="published" icon={Eye} label="Publish" onClick={() => setStatus.mutate({ id: r.id, status: "published" })} color={color} />
                      <StatusButton current={r.status} target="coming_soon" icon={Clock} label="Coming soon" onClick={() => setStatus.mutate({ id: r.id, status: "coming_soon" })} color={color} />
                      <StatusButton current={r.status} target="hidden" icon={EyeOff} label="Hide" onClick={() => setStatus.mutate({ id: r.id, status: "hidden" })} color={color} />
                      <button
                        type="button"
                        onClick={() => { setEditing(r); setSelected(null); }}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ background: `color-mix(in oklab, ${color} 78%, var(--ink))` }}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => archive.mutate(r.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                      >
                        <ArchiveIcon className="h-3.5 w-3.5" /> Archive
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => restore.mutate(r.id)}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                      style={{ background: "var(--tazkiyah)" }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Restore
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusPill({ status, color }: { status: SeriesStatus; color: string }) {
  const label = status === "published" ? "Live" : status === "coming_soon" ? "Soon" : "Hidden";
  const bg = status === "published"
    ? `color-mix(in oklab, ${color} 22%, transparent)`
    : status === "coming_soon"
    ? "color-mix(in oklab, var(--gold-decorative) 25%, transparent)"
    : "color-mix(in oklab, var(--muted-foreground) 20%, transparent)";
  return (
    <span
      className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
      style={{ background: bg, color: "var(--ink)" }}
    >
      {label}
    </span>
  );
}

function StatusButton({
  current, target, icon: Icon, label, onClick, color,
}: {
  current: SeriesStatus;
  target: SeriesStatus;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  color: string;
}) {
  const active = current === target;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={active}
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-opacity disabled:cursor-default"
      style={
        active
          ? { background: `color-mix(in oklab, ${color} 25%, transparent)`, borderColor: `color-mix(in oklab, ${color} 55%, transparent)`, color: `color-mix(in oklab, ${color} 70%, var(--ink))` }
          : { background: "transparent", borderColor: "var(--border)", color: "var(--muted-foreground)" }
      }
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function SeriesEditor({
  value, onChange, onCancel, onSave, saving, pillars,
}: {
  value: SeriesRow;
  onChange: (r: SeriesRow) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  pillars: { slug: string; label: string }[];
}) {
  const color = tintColor(value.tint);
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex flex-col self-start rounded-2xl border p-5 shadow-md"
      style={{ background: `color-mix(in oklab, ${color} 10%, var(--card))`, borderColor: color }}
    >
      <div className="mb-3 flex items-center gap-3">
        <div
          className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full"
          style={{ background: `color-mix(in oklab, ${color} 22%, var(--paper))`, color }}
        >
          <span className="font-arabic text-2xl leading-none">{value.arabic_letter || "—"}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-xs text-muted-foreground">{value.slug}</p>
          <p className="truncate text-sm font-semibold" style={{ color }}>{value.title || "Untitled"}</p>
        </div>
      </div>

      <div className="grid gap-3">
        <F label="Title">
          <input
            className={cls}
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            onBlur={(e) => { if (!value.slug || value.slug.startsWith("new-series")) onChange({ ...value, slug: slugify(e.target.value) || value.slug }); }}
          />
        </F>
        <F label="Slug">
          <input className={cls} value={value.slug} onChange={(e) => onChange({ ...value, slug: slugify(e.target.value) })} />
        </F>
        <F label="Description">
          <textarea className={cls + " min-h-[80px]"} value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })} />
        </F>
        <F label="Pillar">
          <select
            className={cls}
            value={value.pillar ?? ""}
            onChange={(e) => onChange({ ...value, pillar: e.target.value || null })}
          >
            <option value="">— None —</option>
            {pillars.map((p) => (
              <option key={p.slug} value={p.slug}>{p.label}</option>
            ))}
          </select>
        </F>
        <F label="Cover image URL">
          <input className={cls} value={value.cover_image ?? ""} onChange={(e) => onChange({ ...value, cover_image: e.target.value || null })} />
        </F>
        <F label="Arabic letter">
          <ArabicLetterPicker value={value.arabic_letter} onChange={(v) => onChange({ ...value, arabic_letter: v })} />
        </F>
        <F label="Tint">
          <TintSelect value={value.tint} onChange={(v) => onChange({ ...value, tint: v })} />
        </F>
        <F label="Sort order">
          <input
            type="number"
            className={cls}
            value={value.sort_order}
            onChange={(e) => onChange({ ...value, sort_order: Number(e.target.value) })}
          />
        </F>
        <F label="Status">
          <select
            className={cls}
            value={value.status}
            onChange={(e) => onChange({ ...value, status: e.target.value as SeriesStatus })}
          >
            <option value="published">Published</option>
            <option value="coming_soon">Coming soon</option>
            <option value="hidden">Hidden</option>
          </select>
        </F>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary">
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !value.title || !value.slug}
          className="rounded-md px-3 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: color }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

const cls = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-heart";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
