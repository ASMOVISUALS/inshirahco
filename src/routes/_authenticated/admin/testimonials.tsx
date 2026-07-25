import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Trash2, Plus, Pencil, RotateCcw, Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ArchiveTabs, type ArchiveTab } from "@/components/admin/ArchiveTabs";

export const Route = createFileRoute("/_authenticated/admin/testimonials")({
  head: () => ({ meta: [{ title: "Testimonials — Admin" }, { name: "robots", content: "noindex" }] }),
  component: TestimonialsAdmin,
});

type Draft = { quote: string; name: string; role: string };
type Row = { id: string; quote: string; name: string; role: string | null; sort_order: number; featured: boolean; archived_at: string | null };

function TestimonialsAdmin() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase.from("testimonials").select("id,quote,name,role,sort_order,featured,archived_at").order("sort_order");
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
    qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
    qc.invalidateQueries({ queryKey: ["testimonials"] });
  };

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const { error } = await supabase.from("testimonials").insert({
        quote: d.quote, name: d.name, role: d.role || null,
        featured: true, sort_order: active.length,
      });
      if (error) throw error;
    },
    onSuccess: () => { setDraft(null); invalidate(); },
  });

  const update = useMutation({
    mutationFn: async ({ id, d }: { id: string; d: Draft }) => {
      const { error } = await supabase.from("testimonials").update({
        quote: d.quote, name: d.name, role: d.role || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { setEditingId(null); setEditDraft(null); invalidate(); },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { error } = await supabase.from("testimonials").update({ featured }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonials").update({ archived_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { setSelectedId(null); invalidate(); },
  });

  const restore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonials").update({ archived_at: null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { setSelectedId(null); invalidate(); },
  });

  const purge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { setSelectedId(null); invalidate(); },
  });

  const beginEdit = (t: Row) => {
    setEditingId(t.id);
    setEditDraft({ quote: t.quote, name: t.name, role: t.role ?? "" });
    setSelectedId(null);
  };

  return (
    <div className="grid gap-6" onClick={() => setSelectedId(null)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-display">Testimonials</h2>
          <div onClick={(e) => e.stopPropagation()}>
            <ArchiveTabs tab={tab} onChange={setTab} activeCount={active.length} archiveCount={archived.length} />
          </div>
        </div>
        {tab === "active" && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (!draft) setDraft({ quote: "", name: "", role: "" }); }}
            disabled={!!draft}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add testimonial
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

        {rows.map((t) => {
          if (editingId === t.id && editDraft) {
            return (
              <EditorCard
                key={t.id}
                value={editDraft}
                onChange={setEditDraft}
                onCancel={() => { setEditingId(null); setEditDraft(null); }}
                onSave={() => update.mutate({ id: t.id, d: editDraft })}
                saving={update.isPending}
                saveLabel={update.isPending ? "Saving…" : "Save changes"}
              />
            );
          }
          const selected = selectedId === t.id;
          const dimmed = tab === "active" && !t.featured && !selected;
          const isArchived = tab === "archive";
          return (
            <div
              key={t.id}
              onClick={(e) => { e.stopPropagation(); setSelectedId(selected ? null : t.id); }}
              className={
                "group relative flex flex-col self-start rounded-2xl border p-4 cursor-pointer transition-all " +
                (selected ? "border-heart bg-heart/10 shadow-md" : "border-border bg-card hover:border-heart/40 ") +
                (dimmed ? " opacity-40 grayscale" : "") +
                (isArchived ? " opacity-80" : "")
              }
            >
              <p className="text-sm italic line-clamp-6">"{t.quote}"</p>
              <p className="mt-3 text-sm font-semibold">{t.name}</p>
              {t.role ? <p className="text-xs text-muted-foreground">{t.role}</p> : null}

              {selected && (
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-heart/20 pt-3">
                  {isArchived ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Archive className="h-3.5 w-3.5" /> Archived
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggle.mutate({ id: t.id, featured: !t.featured }); }}
                      className="flex items-center gap-2 text-xs font-semibold"
                    >
                      <span className={"relative inline-flex h-5 w-9 items-center rounded-full transition-colors " + (t.featured ? "bg-heart" : "bg-muted")}>
                        <span className={"h-4 w-4 rounded-full bg-background transition-transform " + (t.featured ? "translate-x-[18px]" : "translate-x-0.5")} />
                      </span>
                      <span>{t.featured ? "Featured" : "Hidden"}</span>
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    {!isArchived && (
                      <>
                        <IconBtn label="Edit testimonial" onClick={(e) => { e.stopPropagation(); beginEdit(t); }}>
                          <Pencil className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn label="Move to archive" onClick={(e) => { e.stopPropagation(); archive.mutate(t.id); }}>
                          <Trash2 className="h-4 w-4" />
                        </IconBtn>
                      </>
                    )}
                    {isArchived && (
                      <>
                        <IconBtn label="Restore testimonial" onClick={(e) => { e.stopPropagation(); restore.mutate(t.id); }}>
                          <RotateCcw className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn label="Delete permanently" danger onClick={(e) => { e.stopPropagation(); if (confirm("Permanently delete this testimonial?")) purge.mutate(t.id); }}>
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
            {tab === "active" ? "No testimonials yet." : "Archive is empty."}
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
        placeholder="Quote"
        value={value.quote}
        onChange={(e) => onChange({ ...value, quote: e.target.value })}
        className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm italic outline-none focus:border-heart"
        rows={4}
      />
      <input
        placeholder="Name"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold outline-none focus:border-heart"
      />
      <input
        placeholder="Role (optional)"
        value={value.role}
        onChange={(e) => onChange({ ...value, role: e.target.value })}
        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground outline-none focus:border-heart"
      />

      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary">Cancel</button>
        <button type="button" disabled={saving || !value.quote || !value.name} onClick={onSave} className="btn-primary text-sm disabled:opacity-50">{saveLabel}</button>
      </div>
    </div>
  );
}
