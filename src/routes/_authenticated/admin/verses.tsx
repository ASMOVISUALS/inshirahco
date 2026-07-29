import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Trash2, Plus, Pencil, RotateCcw, Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { QuranFetcher } from "@/components/QuranFetcher";
import { ArchiveTabs, type ArchiveTab } from "@/components/admin/ArchiveTabs";

export const Route = createFileRoute("/_authenticated/admin/verses")({
  head: () => ({ meta: [{ title: "Reflections — Admin" }, { name: "robots", content: "noindex" }] }),
  component: ReflectionsAdmin,
});

type Draft = { arabic: string; translation: string; reference: string };
type Row = { id: string; arabic: string; translation: string; reference: string; sort_order: number; active: boolean; archived_at: string | null };

function ReflectionsAdmin() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-reflections"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase.from("reflections").select("id,arabic,translation,reference,sort_order,active,archived_at").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const [tab, setTab] = useState<ArchiveTab>("active");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft | null>(null);

  const { active, archived } = useMemo(() => ({
    active: data.filter((r) => !r.archived_at),
    archived: data.filter((r) => r.archived_at),
  }), [data]);
  const rows = tab === "active" ? active : archived;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-reflections"] });
    qc.invalidateQueries({ queryKey: ["reflections"] });
  };

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const { error } = await supabase.from("reflections").insert({
        arabic: d.arabic, translation: d.translation, reference: d.reference,
        active: true, sort_order: active.length,
      });
      if (error) throw error;
    },
    onSuccess: () => { setDraft(null); invalidate(); },
  });

  const update = useMutation({
    mutationFn: async ({ id, d }: { id: string; d: Draft }) => {
      const { error } = await supabase.from("reflections").update({
        arabic: d.arabic, translation: d.translation, reference: d.reference,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { setEditingId(null); setEditDraft(null); invalidate(); },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("reflections").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reflections").update({ archived_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { setSelectedId(null); invalidate(); },
  });

  const restore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reflections").update({ archived_at: null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { setSelectedId(null); invalidate(); },
  });

  const purge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reflections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { setSelectedId(null); invalidate(); },
  });

  const beginEdit = (r: Row) => {
    setEditingId(r.id);
    setEditDraft({ arabic: r.arabic, translation: r.translation, reference: r.reference });
    setSelectedId(null);
  };

  return (
    <div className="grid gap-6" onClick={() => setSelectedId(null)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-display">Reflections</h2>
          <div onClick={(e) => e.stopPropagation()}>
            <ArchiveTabs tab={tab} onChange={setTab} activeCount={active.length} archiveCount={archived.length} />
          </div>
        </div>
        {tab === "active" && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (!draft) setDraft({ arabic: "", translation: "", reference: "" }); }}
            disabled={!!draft}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add reflection
          </button>
        )}
      </div>

      <div className="grid items-start gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {tab === "active" && draft && (
          <EditorCard
            value={draft}
            onChange={setDraft}
            onCancel={() => setDraft(null)}
            onSave={() => save.mutate(draft)}
            saving={save.isPending}
            saveLabel={save.isPending ? "Saving…" : "Save"}
          />
        )}

        {rows.map((r) => {
          if (editingId === r.id && editDraft) {
            return (
              <EditorCard
                key={r.id}
                value={editDraft}
                onChange={setEditDraft}
                onCancel={() => { setEditingId(null); setEditDraft(null); }}
                onSave={() => update.mutate({ id: r.id, d: editDraft })}
                saving={update.isPending}
                saveLabel={update.isPending ? "Saving…" : "Save changes"}
              />
            );
          }
          const selected = selectedId === r.id;
          const dimmed = tab === "active" && !r.active && !selected;
          const isArchived = tab === "archive";
          return (
            <div
              key={r.id}
              onClick={(e) => { e.stopPropagation(); setSelectedId(selected ? null : r.id); }}
              className={
                "group relative flex flex-col self-start rounded-2xl border p-4 cursor-pointer transition-all " +
                (selected ? "border-heart bg-heart/10 shadow-md" : "border-border bg-card hover:border-heart/40 ") +
                (dimmed ? " opacity-40 grayscale" : "") +
                (isArchived ? " opacity-80" : "")
              }
            >
              <p className="font-arabic text-lg leading-relaxed" dir="rtl">{r.arabic}</p>
              <p className="mt-2 text-sm italic line-clamp-4">"{r.translation}"</p>
              <p className="mt-2 text-xs text-muted-foreground">— {r.reference}</p>

              {selected && (
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-heart/20 pt-3">
                  {isArchived ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Archive className="h-3.5 w-3.5" /> Archived
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggle.mutate({ id: r.id, active: !r.active }); }}
                      className="flex items-center gap-2 text-xs font-semibold"
                    >
                      <span className={"relative inline-flex h-5 w-9 items-center rounded-full transition-colors " + (r.active ? "bg-heart" : "bg-muted")}>
                        <span className={"h-4 w-4 rounded-full bg-background transition-transform " + (r.active ? "translate-x-[18px]" : "translate-x-0.5")} />
                      </span>
                      <span>{r.active ? "Active" : "Inactive"}</span>
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    {!isArchived && (
                      <>
                        <IconBtn label="Edit reflection" onClick={(e) => { e.stopPropagation(); beginEdit(r); }}>
                          <Pencil className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn label="Move to archive" onClick={(e) => { e.stopPropagation(); archive.mutate(r.id); }}>
                          <Trash2 className="h-4 w-4" />
                        </IconBtn>
                      </>
                    )}
                    {isArchived && (
                      <>
                        <IconBtn label="Restore reflection" onClick={(e) => { e.stopPropagation(); restore.mutate(r.id); }}>
                          <RotateCcw className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn label="Delete permanently" danger onClick={(e) => { e.stopPropagation(); if (confirm("Permanently delete this reflection?")) purge.mutate(r.id); }}>
                          <Trash2 className="h-4 w-4" />
                        </IconBtn>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {rows.length === 0 && !(tab === "active" && draft) && (
          <p className="col-span-full text-sm text-muted-foreground">
            {tab === "active" ? "No reflections yet." : "Archive is empty."}
          </p>
        )}
      </div>
    </div>
  );
}

function IconBtn({ children, label, onClick, danger }: { children: React.ReactNode; label: string; onClick: (e: React.MouseEvent) => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-full text-background transition-colors ${
        danger ? "bg-destructive hover:bg-destructive/80" : "bg-heart hover:bg-heart/80"
      }`}
    >
      {children}
    </button>
  );
}

function EditorCard({
  value, onChange, onCancel, onSave, saving, saveLabel,
}: {
  value: Draft;
  onChange: (d: Draft) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  saveLabel: string;
}) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex flex-col self-start rounded-2xl border border-heart bg-heart/5 p-4 shadow-md"
    >
      <textarea
        dir="rtl"
        placeholder="العربية"
        value={value.arabic}
        onChange={(e) => onChange({ ...value, arabic: e.target.value })}
        className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 font-arabic text-lg outline-none focus:border-heart"
        rows={3}
      />
      <textarea
        placeholder="Translation"
        value={value.translation}
        onChange={(e) => onChange({ ...value, translation: e.target.value })}
        className="mt-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm italic outline-none focus:border-heart"
        rows={3}
      />
      <input
        placeholder="Reference"
        value={value.reference}
        onChange={(e) => onChange({ ...value, reference: e.target.value })}
        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground outline-none focus:border-heart"
      />

      <div className="mt-3 border-t border-heart/20 pt-3">
        <QuranFetcher
          compact
          onFetched={(a) => onChange({ arabic: a.arabic, translation: a.translation, reference: a.reference })}
        />
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary">Cancel</button>
        <button type="button" disabled={saving || !value.arabic || !value.translation || !value.reference} onClick={onSave} className="btn-primary text-sm disabled:opacity-50">{saveLabel}</button>
      </div>
    </div>
  );
}
