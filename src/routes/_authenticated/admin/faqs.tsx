import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/faqs")({
  head: () => ({ meta: [{ title: "FAQs — Admin" }, { name: "robots", content: "noindex" }] }),
  component: FaqsAdmin,
});

interface Row { id: string; page_key: string; question: string; answer: string; sort_order: number }

function FaqsAdmin() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "faqs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("faqs").select("*").order("page_key").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const [newFaq, setNewFaq] = useState({ page_key: "pillar:suhbah", question: "", answer: "", sort_order: 100 });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("faqs").insert(newFaq);
      if (error) throw error;
    },
    onSuccess: () => {
      setNewFaq({ page_key: newFaq.page_key, question: "", answer: "", sort_order: 100 });
      qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
      qc.invalidateQueries({ queryKey: ["cms", "faqs"] });
    },
  });

  const update = useMutation({
    mutationFn: async (r: Row) => {
      const { error } = await supabase.from("faqs").update({
        page_key: r.page_key, question: r.question, answer: r.answer, sort_order: r.sort_order,
      }).eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
      qc.invalidateQueries({ queryKey: ["cms", "faqs"] });
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faqs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
      qc.invalidateQueries({ queryKey: ["cms", "faqs"] });
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <h3 className="mb-4 text-xl">Add new FAQ</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <F label="Page key"><input className={cls} value={newFaq.page_key} onChange={(e) => setNewFaq({ ...newFaq, page_key: e.target.value })} /></F>
          <F label="Sort order"><input type="number" className={cls} value={newFaq.sort_order} onChange={(e) => setNewFaq({ ...newFaq, sort_order: Number(e.target.value) })} /></F>
        </div>
        <F label="Question"><input className={cls} value={newFaq.question} onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })} /></F>
        <F label="Answer"><textarea rows={3} className={cls} value={newFaq.answer} onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })} /></F>
        <button className="btn-primary mt-4" onClick={() => create.mutate()} disabled={!newFaq.question || create.isPending}>Add</button>
      </div>

      {data.map((r) => (
        <FaqRow key={r.id} row={r} onSave={(x) => update.mutate(x)} onDelete={() => del.mutate(r.id)} />
      ))}
    </div>
  );
}

function FaqRow({ row, onSave, onDelete }: { row: Row; onSave: (r: Row) => void; onDelete: () => void }) {
  const [r, setR] = useState<Row>(row);
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-xs text-muted-foreground">{r.page_key}</p>
        <div className="flex gap-2">
          <button className="btn-primary !py-2 !px-4 !text-sm" onClick={() => onSave(r)}>Save</button>
          <button className="btn-ghost !py-2 !px-4 !text-sm" onClick={onDelete}>Delete</button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_140px]">
        <F label="Page key"><input className={cls} value={r.page_key} onChange={(e) => setR({ ...r, page_key: e.target.value })} /></F>
        <F label="Sort order"><input type="number" className={cls} value={r.sort_order} onChange={(e) => setR({ ...r, sort_order: Number(e.target.value) })} /></F>
      </div>
      <F label="Question"><input className={cls} value={r.question} onChange={(e) => setR({ ...r, question: e.target.value })} /></F>
      <F label="Answer"><textarea rows={3} className={cls} value={r.answer} onChange={(e) => setR({ ...r, answer: e.target.value })} /></F>
    </div>
  );
}

const cls = "w-full rounded-2xl border border-input bg-background px-4 py-2.5 outline-none focus:border-heart";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 mt-3 block text-sm font-semibold">{label}</span>{children}</label>;
}
