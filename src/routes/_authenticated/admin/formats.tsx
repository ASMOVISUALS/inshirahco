import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Eye, EyeOff, Menu as MenuIcon, MenuSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ArabicLetterPicker, TintSelect, TINT_OPTIONS } from "@/components/ArabicLetterPicker";

export const Route = createFileRoute("/_authenticated/admin/formats")({
  head: () => ({ meta: [{ title: "Formats — Admin" }, { name: "robots", content: "noindex" }] }),
  component: FormatsAdmin,
});

interface Row {
  slug: string;
  label: string;
  plural: string;
  arabic_letter: string;
  tint: string;
  sort_order: number;
  show_in_menu: boolean;
  show_on_site: boolean;
}

function tintColor(tint: string): string {
  return TINT_OPTIONS.find((o) => o.value === tint)?.color ?? "var(--heart)";
}

function FormatsAdmin() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "formats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resource_formats")
        .select("*").order("sort_order");
      if (error) throw error;
      return ((data ?? []) as unknown as Row[]).map((r) => ({
        ...r,
        show_in_menu: r.show_in_menu ?? true,
        show_on_site: r.show_on_site ?? true,
      }));
    },
  });

  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);

  const save = useMutation({
    mutationFn: async (row: Row) => {
      const { error } = await supabase.from("resource_formats").update({
        label: row.label, plural: row.plural,
        arabic_letter: row.arabic_letter, tint: row.tint,
        sort_order: row.sort_order,
        show_in_menu: row.show_in_menu,
        show_on_site: row.show_on_site,
      } as never).eq("slug", row.slug);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "formats"] });
      qc.invalidateQueries({ queryKey: ["cms", "formats"] });
      setEditing(null);
      setSelected(null);
    },
  });

  const toggle = useMutation({
    mutationFn: async (p: { slug: string; field: "show_in_menu" | "show_on_site"; value: boolean }) => {
      const { error } = await supabase.from("resource_formats").update({ [p.field]: p.value } as never).eq("slug", p.slug);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "formats"] });
      qc.invalidateQueries({ queryKey: ["cms", "formats"] });
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-6" onClick={() => { setSelected(null); }}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display">Resource formats</h2>
        <p className="text-xs text-muted-foreground">Ordered by sort order · click a tile to edit</p>
      </div>

      <div className="grid items-start gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((r) => {
          const isEditing = editing?.slug === r.slug;
          if (isEditing) {
            return (
              <FormatEditor
                key={r.slug}
                value={editing}
                onChange={setEditing}
                onCancel={() => setEditing(null)}
                onSave={() => save.mutate(editing)}
                saving={save.isPending}
              />
            );
          }
          const isSelected = selected === r.slug;
          const color = tintColor(r.tint);
          return (
            <div
              key={r.slug}
              onClick={(e) => { e.stopPropagation(); setSelected(isSelected ? null : r.slug); }}
              className={
                "group relative flex flex-col self-start cursor-pointer rounded-2xl border p-5 transition-all " +
                (isSelected ? "shadow-lg" : "hover:shadow-md")
              }
              style={{
                background: `color-mix(in oklab, ${color} 12%, var(--card))`,
                borderColor: isSelected
                  ? color
                  : `color-mix(in oklab, ${color} 35%, transparent)`,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-full"
                  style={{
                    background: `color-mix(in oklab, ${color} 22%, var(--paper))`,
                    color,
                  }}
                >
                  <span className="font-arabic text-2xl leading-none">{r.arabic_letter || "—"}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-xl font-semibold leading-tight" style={{ color: "var(--ink)" }}>
                    {r.label}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {r.plural} · <span className="font-mono">{r.slug}</span>
                  </p>
                </div>
                <span
                  className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{
                    background: `color-mix(in oklab, ${color} 20%, transparent)`,
                    color: `color-mix(in oklab, ${color} 65%, var(--ink))`,
                  }}
                >
                  #{r.sort_order}
                </span>
              </div>

              {isSelected && (
                <div
                  className="mt-4 flex flex-wrap justify-end gap-2 border-t pt-3"
                  style={{ borderColor: `color-mix(in oklab, ${color} 25%, transparent)` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ToggleChip
                    active={r.show_in_menu}
                    color={color}
                    onIcon={MenuSquare}
                    offIcon={MenuIcon}
                    label={r.show_in_menu ? "In menu" : "Not in menu"}
                    disabled={!r.show_on_site || toggle.isPending}
                    onClick={() => toggle.mutate({ slug: r.slug, field: "show_in_menu", value: !r.show_in_menu })}
                  />
                  <ToggleChip
                    active={r.show_on_site}
                    color={color}
                    onIcon={Eye}
                    offIcon={EyeOff}
                    label={r.show_on_site ? "On site" : "Off site"}
                    disabled={toggle.isPending}
                    onClick={() => toggle.mutate({ slug: r.slug, field: "show_on_site", value: !r.show_on_site })}
                  />
                  <button
                    type="button"
                    onClick={() => { setEditing(r); setSelected(null); }}
                    aria-label={`Edit ${r.label}`}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: `color-mix(in oklab, ${color} 78%, var(--ink))` }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FormatEditor({
  value, onChange, onCancel, onSave, saving,
}: {
  value: Row;
  onChange: (r: Row) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const color = tintColor(value.tint);
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex flex-col self-start rounded-2xl border p-5 shadow-md"
      style={{
        background: `color-mix(in oklab, ${color} 10%, var(--card))`,
        borderColor: color,
      }}
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
          <p className="truncate text-sm font-semibold" style={{ color }}>{value.label || "Untitled"}</p>
        </div>
      </div>

      <div className="grid gap-3">
        <F label="Label">
          <input className={cls} value={value.label} onChange={(e) => onChange({ ...value, label: e.target.value })} />
        </F>
        <F label="Plural">
          <input className={cls} value={value.plural} onChange={(e) => onChange({ ...value, plural: e.target.value })} />
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
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !value.label || !value.plural}
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
