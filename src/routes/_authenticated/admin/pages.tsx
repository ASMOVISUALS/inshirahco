import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/pages")({
  head: () => ({ meta: [{ title: "Pages — Admin" }, { name: "robots", content: "noindex" }] }),
  component: PagesAdmin,
});

interface PageRow { key: string; content: unknown }

function PagesAdmin() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "pages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pages").select("key,content").order("key");
      if (error) throw error;
      return (data ?? []) as PageRow[];
    },
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!selected && data.length > 0) setSelected(data[0].key);
  }, [data, selected]);

  useEffect(() => {
    const row = data.find((r) => r.key === selected);
    if (row) {
      setDraft(JSON.stringify(row.content ?? {}, null, 2));
      setErr(null);
    }
  }, [selected, data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      let parsed: unknown;
      try { parsed = JSON.parse(draft); } catch { throw new Error("Invalid JSON"); }
      const { error } = await supabase.from("pages").update({ content: parsed as never }).eq("key", selected);
      if (error) throw error;
    },
    onSuccess: () => {
      setErr(null);
      qc.invalidateQueries({ queryKey: ["admin", "pages"] });
      qc.invalidateQueries({ queryKey: ["cms", "page"] });
    },
    onError: (e: Error) => setErr(e.message),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-3xl border border-border bg-card p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Pages</p>
        <ul className="flex flex-col gap-1">
          {data.map((r) => (
            <li key={r.key}>
              <button
                onClick={() => setSelected(r.key)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold ${selected === r.key ? "bg-secondary" : "hover:bg-secondary"}`}
              >
                <span className="font-mono text-[11px]">{r.key}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="rounded-3xl border border-border bg-card p-6">
        {selected ? (
          <>
            <p className="mb-3 font-mono text-xs text-muted-foreground">{selected}</p>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Content (JSON)</span>
              <textarea rows={26} className="w-full rounded-2xl border border-input bg-background px-4 py-3 font-mono text-xs outline-none focus:border-heart" value={draft} onChange={(e) => setDraft(e.target.value)} />
            </label>
            <p className="mt-2 text-xs text-muted-foreground">
              Edit any field's value here. Keep the same JSON keys so the page can find them.
            </p>
            {err && <p className="mt-3 text-sm" style={{ color: "var(--heart)" }}>{err}</p>}
            <button className="btn-primary mt-4" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</button>
          </>
        ) : (
          <p className="text-muted-foreground">Pick a page.</p>
        )}
      </div>
    </div>
  );
}
