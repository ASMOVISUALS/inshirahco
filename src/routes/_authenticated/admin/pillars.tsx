import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/pillars")({
  head: () => ({ meta: [{ title: "Pillars — Admin" }, { name: "robots", content: "noindex" }] }),
  component: PillarsAdmin,
});

interface Row {
  slug: string;
  label: string;
  short_label: string;
  arabic_letter: string;
  tint: string;
  description: string;
  href: string;
  sort_order: number;
  coming_soon: boolean;
}

function PillarsAdmin() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "pillars"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pillars").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => { setRows(data); }, [data]);

  const save = useMutation({
    mutationFn: async (row: Row) => {
      const { error } = await supabase.from("pillars").update({
        label: row.label,
        short_label: row.short_label,
        arabic_letter: row.arabic_letter,
        tint: row.tint,
        description: row.description,
        href: row.href,
        sort_order: row.sort_order,
        coming_soon: row.coming_soon,
      }).eq("slug", row.slug);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "pillars"] });
      qc.invalidateQueries({ queryKey: ["cms", "pillars"] });
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  const set = (i: number, k: keyof Row, v: string | number | boolean) => {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  };

  return (
    <div className="grid gap-6">
      {rows.map((r, i) => (
        <div key={r.slug} className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground">{r.slug}</p>
            <button className="btn-primary !py-2 !px-4 !text-sm" disabled={save.isPending} onClick={() => save.mutate(rows[i])}>Save</button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <F label="Label"><input className={cls} value={r.label} onChange={(e) => set(i, "label", e.target.value)} /></F>
            <F label="Short label"><input className={cls} value={r.short_label} onChange={(e) => set(i, "short_label", e.target.value)} /></F>
            <F label="Arabic letter"><input className={cls} value={r.arabic_letter} onChange={(e) => set(i, "arabic_letter", e.target.value)} /></F>
            <F label="Tint (heart, tazkiyah, heart-soft, gold, ink)"><input className={cls} value={r.tint} onChange={(e) => set(i, "tint", e.target.value)} /></F>
            <F label="Href"><input className={cls} value={r.href} onChange={(e) => set(i, "href", e.target.value)} /></F>
            <F label="Sort order"><input type="number" className={cls} value={r.sort_order} onChange={(e) => set(i, "sort_order", Number(e.target.value))} /></F>
          </div>
          <F label="Description"><textarea rows={2} className={cls} value={r.description} onChange={(e) => set(i, "description", e.target.value)} /></F>
          <label className="mt-2 inline-flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={r.coming_soon} onChange={(e) => set(i, "coming_soon", e.target.checked)} /> Coming soon
          </label>
        </div>
      ))}
    </div>
  );
}

const cls = "w-full rounded-2xl border border-input bg-background px-4 py-2.5 outline-none focus:border-heart";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 mt-3 block text-sm font-semibold">{label}</span>{children}</label>;
}
