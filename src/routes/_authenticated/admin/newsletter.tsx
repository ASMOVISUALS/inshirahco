import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Star, Users, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { newslettersQuery, newsletterSubscribersQuery, type NewsletterRow } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin/newsletter")({
  head: () => ({ meta: [{ title: "Newsletters — Admin" }, { name: "robots", content: "noindex" }] }),
  component: NewsletterAdmin,
});

function NewsletterAdmin() {
  const qc = useQueryClient();
  const { data: newsletters = [], isLoading } = useQuery(newslettersQuery());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && newsletters.length > 0) setSelectedId(newsletters[0].id);
  }, [newsletters, selectedId]);

  const selected = newsletters.find((n) => n.id === selectedId) ?? null;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cms", "newsletters"] });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <NewsletterList
        rows={newsletters}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onChanged={invalidate}
      />
      {selected ? (
        <NewsletterDetail row={selected} onChanged={invalidate} />
      ) : (
        <div className="rounded-3xl border border-border bg-card p-8 text-center text-muted-foreground">
          No newsletter yet. Create one to start collecting sign-ups.
        </div>
      )}
    </div>
  );
}

function NewsletterList({
  rows, selectedId, onSelect, onChanged,
}: {
  rows: NewsletterRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChanged: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      const n = name.trim();
      const s = slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
      if (!n || !s) throw new Error("Name and slug are required.");
      if (rows.some((r) => r.slug === s)) throw new Error("Slug already exists.");
      const { data, error } = await supabase
        .from("newsletters")
        .insert({ name: n, slug: s, description: description.trim() || null, is_default: rows.length === 0 })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      setCreating(false); setName(""); setSlug(""); setDescription(""); setErr(null);
      onChanged();
      onSelect(id);
    },
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <aside className="h-fit rounded-3xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Newsletters</p>
        <button className="btn-ghost text-xs" onClick={() => setCreating((c) => !c)}>
          <Plus className="h-3.5 w-3.5" /> New
        </button>
      </div>

      {creating && (
        <div className="mb-4 rounded-2xl border border-border bg-background p-3">
          <input
            className="mb-2 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            placeholder="Newsletter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="mb-2 w-full rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs"
            placeholder="url-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <textarea
            rows={2}
            className="mb-2 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
            placeholder="Short description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {err && <p className="mb-2 text-xs text-destructive">{err}</p>}
          <div className="flex gap-2">
            <button className="btn-primary text-xs" disabled={create.isPending} onClick={() => create.mutate()}>
              Create
            </button>
            <button className="btn-ghost text-xs" onClick={() => { setCreating(false); setErr(null); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <ul className="flex flex-col gap-1">
        {rows.map((r) => (
          <li key={r.id}>
            <button
              onClick={() => onSelect(r.id)}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${selectedId === r.id ? "bg-secondary" : "hover:bg-secondary"}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  {r.is_default && <Star className="h-3 w-3 shrink-0" style={{ color: "var(--gold)" }} />}
                  <span className="truncate">{r.name}</span>
                </div>
                <div className="font-mono text-[10px] text-muted-foreground">/{r.slug}</div>
              </div>
            </button>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="px-3 py-6 text-center text-xs text-muted-foreground">No newsletters yet.</li>
        )}
      </ul>
    </aside>
  );
}

function NewsletterDetail({ row, onChanged }: { row: NewsletterRow; onChanged: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(row.name);
  const [description, setDescription] = useState(row.description ?? "");
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    setName(row.name);
    setDescription(row.description ?? "");
    setStatus(null);
  }, [row.id, row.name, row.description]);

  const { data: subscribers = [], isLoading } = useQuery(newsletterSubscribersQuery(row.id));

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("newsletters")
        .update({ name: name.trim(), description: description.trim() || null })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => { setStatus({ kind: "ok", msg: "Saved." }); onChanged(); },
    onError: (e: Error) => setStatus({ kind: "err", msg: e.message }),
  });

  const makeDefault = useMutation({
    mutationFn: async () => {
      const { error: clearErr } = await supabase.from("newsletters").update({ is_default: false }).neq("id", row.id);
      if (clearErr) throw clearErr;
      const { error } = await supabase.from("newsletters").update({ is_default: true }).eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => { setStatus({ kind: "ok", msg: "Set as default." }); onChanged(); },
    onError: (e: Error) => setStatus({ kind: "err", msg: e.message }),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("newsletters").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => { onChanged(); },
    onError: (e: Error) => setStatus({ kind: "err", msg: e.message }),
  });

  const exportCsv = () => {
    const header = "email,source,signed_up\n";
    const body = subscribers.map((s) => `${s.email},${s.source ?? ""},${s.created_at}`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${row.slug}-subscribers.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-w-0 rounded-3xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Mail className="h-4 w-4" style={{ color: "var(--heart)" }} />
            {row.name}
            {row.is_default && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ background: "color-mix(in oklab, var(--gold) 20%, transparent)", color: "var(--gold)" }}>
                Default
              </span>
            )}
          </h2>
          <p className="font-mono text-xs text-muted-foreground">/{row.slug}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!row.is_default && (
            <button className="btn-ghost text-xs" disabled={makeDefault.isPending} onClick={() => makeDefault.mutate()}>
              <Star className="h-3.5 w-3.5" /> Make default
            </button>
          )}
          <button
            className="btn-ghost text-xs text-destructive"
            disabled={remove.isPending}
            onClick={() => {
              if (row.is_default) { setStatus({ kind: "err", msg: "Set another newsletter as default before deleting." }); return; }
              if (window.confirm(`Delete "${row.name}"? Subscribers on this list will lose their assignment.`)) remove.mutate();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Details</p>
          <label className="mb-3 block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Name</span>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-heart"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="mb-3 block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</span>
            <textarea
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-heart"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <div className="flex items-center gap-3">
            <button className="btn-primary" disabled={save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? "Saving…" : "Save"}
            </button>
            {status && (
              <span className={`text-xs font-semibold ${status.kind === "ok" ? "text-emerald-600" : "text-destructive"}`}>
                {status.msg}
              </span>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Subscribers · {subscribers.length}
            </p>
            {subscribers.length > 0 && (
              <button className="btn-ghost text-xs" onClick={exportCsv}>Export CSV</button>
            )}
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="max-h-[420px] overflow-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-secondary text-left">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Email</th>
                    <th className="px-3 py-2 font-semibold">Source</th>
                    <th className="px-3 py-2 font-semibold">Signed up</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-3 py-2 font-semibold">{s.email}</td>
                      <td className="px-3 py-2 text-muted-foreground">{s.source ?? "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {subscribers.length === 0 && (
                    <tr><td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">No sign-ups yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
