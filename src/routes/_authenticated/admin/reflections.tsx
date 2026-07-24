import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/reflections")({
  head: () => ({ meta: [{ title: "Reflections — Admin" }, { name: "robots", content: "noindex" }] }),
  component: ReflectionsAdmin,
});

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

  const [arabic, setArabic] = useState("");
  const [translation, setTranslation] = useState("");
  const [reference, setReference] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-reflections"] });
    qc.invalidateQueries({ queryKey: ["reflections"] });
  };

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("reflections").insert({ arabic, translation, reference, active: true, sort_order: data.length });
      if (error) throw error;
    },
    onSuccess: () => {
      setArabic(""); setTranslation(""); setReference("");
      invalidate();
    },
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
    <div className="grid gap-8" onClick={() => setSelectedId(null)}>
      <form
        onSubmit={(e) => { e.preventDefault(); add.mutate(); }}
        onClick={(e) => e.stopPropagation()}
        className="grid gap-3 rounded-3xl border border-border bg-card p-6"
      >
        <h2 className="text-xl font-display">Add reflection</h2>
        <input placeholder="Arabic" value={arabic} onChange={(e) => setArabic(e.target.value)} required className={cls + " font-arabic text-lg"} dir="rtl" />
        <input placeholder="Translation" value={translation} onChange={(e) => setTranslation(e.target.value)} required className={cls} />
        <input placeholder="Reference (e.g. Qur'an 94:5)" value={reference} onChange={(e) => setReference(e.target.value)} required className={cls} />
        <button type="submit" disabled={add.isPending} className="btn-primary self-start">{add.isPending ? "Adding…" : "Add"}</button>
      </form>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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

const cls = "w-full rounded-2xl border border-input bg-background px-4 py-2.5 outline-none focus:border-heart";
