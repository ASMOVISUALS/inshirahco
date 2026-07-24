import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "Site settings — Admin" }, { name: "robots", content: "noindex" }] }),
  component: SettingsAdmin,
});

interface Row { key: string; value: unknown }

function SettingsAdmin() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("key,value").order("key");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (!selected && data.length > 0) setSelected(data[0].key); }, [data, selected]);
  useEffect(() => {
    const r = data.find((x) => x.key === selected);
    if (r) { setDraft(JSON.stringify(r.value ?? {}, null, 2)); setErr(null); }
  }, [selected, data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      let parsed: unknown;
      try { parsed = JSON.parse(draft); } catch { throw new Error("Invalid JSON"); }
      const { error } = await supabase.from("site_settings").update({ value: parsed as never }).eq("key", selected);
      if (error) throw error;
    },
    onSuccess: () => {
      setErr(null);
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      qc.invalidateQueries({ queryKey: ["cms", "settings"] });
    },
    onError: (e: Error) => setErr(e.message),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-3xl border border-border bg-card p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Settings</p>
        <ul className="flex flex-col gap-1">
          {data.map((r) => (
            <li key={r.key}>
              <button onClick={() => setSelected(r.key)} className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold ${selected === r.key ? "bg-secondary" : "hover:bg-secondary"}`}>
                {r.key}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div className="rounded-3xl border border-border bg-card p-6">
        {selected ? (
          <>
            <p className="mb-3 font-mono text-xs text-muted-foreground">{selected}</p>
            <textarea rows={26} className="w-full rounded-2xl border border-input bg-background px-4 py-3 font-mono text-xs outline-none focus:border-heart" value={draft} onChange={(e) => setDraft(e.target.value)} />
            {err && <p className="mt-3 text-sm" style={{ color: "var(--heart)" }}>{err}</p>}
            <button className="btn-primary mt-4" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</button>
          </>
        ) : (
          <p className="text-muted-foreground">Pick a setting.</p>
        )}
      </div>
    </div>
  );
}
