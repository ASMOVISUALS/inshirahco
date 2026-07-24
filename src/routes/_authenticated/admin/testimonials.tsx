import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Plus, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/testimonials")({
  head: () => ({ meta: [{ title: "Testimonials — Admin" }, { name: "robots", content: "noindex" }] }),
  component: TestimonialsAdmin,
});

type Draft = { quote: string; name: string; role: string };

function TestimonialsAdmin() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonials").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
    qc.invalidateQueries({ queryKey: ["testimonials"] });
  };

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const { error } = await supabase.from("testimonials").insert({
        quote: d.quote,
        name: d.name,
        role: d.role || null,
        featured: true,
        sort_order: data.length,
      });
      if (error) throw error;
    },
    onSuccess: () => { setDraft(null); invalidate(); },
  });

  const update = useMutation({
    mutationFn: async ({ id, d }: { id: string; d: Draft }) => {
      const { error } = await supabase.from("testimonials").update({
        quote: d.quote,
        name: d.name,
        role: d.role || null,
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

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { setSelectedId(null); invalidate(); },
  });

  const beginEdit = (t: { id: string; quote: string; name: string; role: string | null }) => {
    setEditingId(t.id);
    setEditDraft({ quote: t.quote, name: t.name, role: t.role ?? "" });
    setSelectedId(null);
  };

  return (
    <div className="grid gap-6" onClick={() => setSelectedId(null)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display">Testimonials</h2>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (!draft) setDraft({ quote: "", name: "", role: "" }); }}
          disabled={!!draft}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add testimonial
        </button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {draft && (
          <EditorCard
            value={draft}
            onChange={setDraft}
            onCancel={() => setDraft(null)}
            onSave={() => save.mutate(draft)}
            saving={save.isPending}
            saveLabel={save.isPending ? "Saving…" : "Save"}
          />
        )}

        {data.map((t) => {
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
          const dimmed = !t.featured && !selected;
          return (
            <div
              key={t.id}
              onClick={(e) => { e.stopPropagation(); setSelectedId(selected ? null : t.id); }}
              className={
                "group relative flex flex-col rounded-2xl border p-4 cursor-pointer transition-all " +
                (selected
                  ? "border-heart bg-heart/10 shadow-md"
                  : "border-border bg-card hover:border-heart/40 ") +
                (dimmed ? " opacity-40 grayscale" : "")
              }
            >
              <p className="text-sm italic line-clamp-6">"{t.quote}"</p>
              <p className="mt-3 text-sm font-semibold">{t.name}</p>
              {t.role ? <p className="text-xs text-muted-foreground">{t.role}</p> : null}

              {selected && (
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-heart/20 pt-3">
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); beginEdit(t); }}
                      aria-label="Edit testimonial"
                      className="grid h-8 w-8 place-items-center rounded-full bg-heart text-background hover:bg-heart/80 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (confirm("Delete this testimonial?")) del.mutate(t.id); }}
                      aria-label="Delete testimonial"
                      className="grid h-8 w-8 place-items-center rounded-full bg-heart text-background hover:bg-heart/80 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
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
      className="flex flex-col rounded-2xl border border-heart bg-heart/5 p-4 shadow-md"
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
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving || !value.quote || !value.name}
          onClick={onSave}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
}
