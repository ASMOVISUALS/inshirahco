import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { QuranFetcher } from "@/components/QuranFetcher";

export const Route = createFileRoute("/_authenticated/admin/reflections")({
  head: () => ({ meta: [{ title: "Reflections — Admin" }, { name: "robots", content: "noindex" }] }),
  component: ReflectionsAdmin,
});

type Draft = { arabic: string; translation: string; reference: string };

function ReflectionsAdmin() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-reflections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reflections").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-reflections"] });
    qc.invalidateQueries({ queryKey: ["reflections"] });
  };

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const { error } = await supabase.from("reflections").insert({
        arabic: d.arabic,
        translation: d.translation,
        reference: d.reference,
        active: true,
        sort_order: data.length,
      });
      if (error) throw error;
    },
    onSuccess: () => { setDraft(null); invalidate(); },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("reflections").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reflections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { setSelectedId(null); invalidate(); },
  });

  return (
    <div className="grid gap-6" onClick={() => setSelectedId(null)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display">Reflections</h2>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (!draft) setDraft({ arabic: "", translation: "", reference: "" }); }}
          disabled={!!draft}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add reflection
        </button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {draft && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col rounded-2xl border border-heart bg-heart/5 p-4 shadow-md"
          >
            <textarea
              dir="rtl"
              placeholder="العربية"
              value={draft.arabic}
              onChange={(e) => setDraft({ ...draft, arabic: e.target.value })}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 font-arabic text-lg outline-none focus:border-heart"
              rows={3}
            />
            <textarea
              placeholder="Translation"
              value={draft.translation}
              onChange={(e) => setDraft({ ...draft, translation: e.target.value })}
              className="mt-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm italic outline-none focus:border-heart"
              rows={3}
            />
            <input
              placeholder="Reference"
              value={draft.reference}
              onChange={(e) => setDraft({ ...draft, reference: e.target.value })}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground outline-none focus:border-heart"
            />

            <div className="mt-3 border-t border-heart/20 pt-3">
              <QuranFetcher
                compact
                onFetched={(a) => setDraft({ arabic: a.arabic, translation: a.translation, reference: a.reference })}
              />
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={save.isPending || !draft.arabic || !draft.translation || !draft.reference}
                onClick={() => save.mutate(draft)}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {save.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}

        {data.map((r) => {
          const selected = selectedId === r.id;
          const dimmed = !r.active && !selected;
          return (
            <div
              key={r.id}
              onClick={(e) => { e.stopPropagation(); setSelectedId(selected ? null : r.id); }}
              className={
                "group relative flex flex-col rounded-2xl border p-4 cursor-pointer transition-all " +
                (selected
                  ? "border-heart bg-heart/10 shadow-md"
                  : "border-border bg-card hover:border-heart/40 ") +
                (dimmed ? " opacity-40 grayscale" : "")
              }
            >
              <p className="font-arabic text-lg leading-relaxed" dir="rtl">{r.arabic}</p>
              <p className="mt-2 text-sm italic line-clamp-4">"{r.translation}"</p>
              <p className="mt-2 text-xs text-muted-foreground">— {r.reference}</p>

              {selected && (
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-heart/20 pt-3">
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
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm("Delete this reflection?")) del.mutate(r.id); }}
                    aria-label="Delete reflection"
                    className="grid h-8 w-8 place-items-center rounded-full bg-heart text-background hover:bg-heart/80 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
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
