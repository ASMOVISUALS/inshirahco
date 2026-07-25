import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArabicLetterPicker, TintSelect } from "@/components/ArabicLetterPicker";

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
}

function FormatsAdmin() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "formats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("resource_formats").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => { setRows(data); }, [data]);

  const save = useMutation({
    mutationFn: async (row: Row) => {
      const { error } = await supabase.from("resource_formats").update({
        label: row.label, plural: row.plural, arabic_letter: row.arabic_letter, tint: row.tint, sort_order: row.sort_order,
      }).eq("slug", row.slug);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "formats"] });
      qc.invalidateQueries({ queryKey: ["cms", "formats"] });
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const set = (i: number, k: keyof Row, v: string | number) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));

  return (
    <div className="grid gap-4">
      {rows.map((r, i) => (
        <div key={r.slug} className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground">{r.slug}</p>
            <button className="btn-primary !py-2 !px-4 !text-sm" disabled={save.isPending} onClick={() => save.mutate(rows[i])}>Save</button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <F label="Label"><input className={cls} value={r.label} onChange={(e) => set(i, "label", e.target.value)} /></F>
            <F label="Plural"><input className={cls} value={r.plural} onChange={(e) => set(i, "plural", e.target.value)} /></F>
            <F label="Arabic letter"><ArabicLetterPicker value={r.arabic_letter} onChange={(v) => set(i, "arabic_letter", v)} /></F>
            <F label="Tint"><TintSelect value={r.tint} onChange={(v) => set(i, "tint", v)} /></F>
            <F label="Sort order"><input type="number" className={cls} value={r.sort_order} onChange={(e) => set(i, "sort_order", Number(e.target.value))} /></F>
          </div>
        </div>
      ))}
    </div>
  );
}

const cls = "w-full rounded-2xl border border-input bg-background px-4 py-2.5 outline-none focus:border-heart";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-semibold">{label}</span>{children}</label>;
}
