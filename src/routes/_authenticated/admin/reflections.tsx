import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("reflections").insert({ arabic, translation, reference, active: true, sort_order: data.length });
      if (error) throw error;
    },
    onSuccess: () => {
      setArabic(""); setTranslation(""); setReference("");
      qc.invalidateQueries({ queryKey: ["admin-reflections"] });
      qc.invalidateQueries({ queryKey: ["reflections"] });
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("reflections").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reflections"] });
      qc.invalidateQueries({ queryKey: ["reflections"] });
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reflections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reflections"] });
      qc.invalidateQueries({ queryKey: ["reflections"] });
    },
  });

  return (
    <div className="grid gap-8">
      <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="grid gap-3 rounded-3xl border border-border bg-card p-6">
        <h2 className="text-xl font-display">Add reflection</h2>
        <input placeholder="Arabic" value={arabic} onChange={(e) => setArabic(e.target.value)} required className={cls + " font-arabic text-lg"} dir="rtl" />
        <input placeholder="Translation" value={translation} onChange={(e) => setTranslation(e.target.value)} required className={cls} />
        <input placeholder="Reference (e.g. Qur'an 94:5)" value={reference} onChange={(e) => setReference(e.target.value)} required className={cls} />
        <button type="submit" disabled={add.isPending} className="btn-primary self-start">{add.isPending ? "Adding…" : "Add"}</button>
      </form>

      <div className="grid gap-3">
        {data.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
            <p className="font-arabic text-xl" dir="rtl">{r.arabic}</p>
            <p className="mt-2 italic">"{r.translation}"</p>
            <p className="mt-1 text-sm text-muted-foreground">— {r.reference}</p>
            <div className="mt-3 flex gap-3">
              <button onClick={() => toggle.mutate({ id: r.id, active: !r.active })} className="text-sm font-semibold hover:underline" style={{ color: "var(--heart)" }}>
                {r.active ? "Deactivate" : "Activate"}
              </button>
              <button onClick={() => { if (confirm("Delete this reflection?")) del.mutate(r.id); }} className="text-sm font-semibold text-muted-foreground hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const cls = "w-full rounded-2xl border border-input bg-background px-4 py-2.5 outline-none focus:border-heart";
