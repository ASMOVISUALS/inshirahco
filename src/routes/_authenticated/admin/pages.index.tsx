import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, LayoutTemplate, Lock, Plus, Eye, EyeOff, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isBlockArray } from "@/lib/page-blocks";
import { AdminPasswordGate } from "@/components/AdminPasswordGate";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type PageStatus = "published" | "hidden" | "coming_soon";



export const Route = createFileRoute("/_authenticated/admin/pages/")({
  head: () => ({ meta: [{ title: "Pages — Admin" }, { name: "robots", content: "noindex" }] }),
  component: PagesAdmin,
});

interface PageRow {
  key: string;
  slug: string;
  title: string;
  is_published: boolean;
  status: PageStatus;
  content: Record<string, unknown>;
}

function PagesAdmin() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "pages"],
    queryFn: async (): Promise<PageRow[]> => {
      const { data, error } = await supabase
        .from("pages")
        .select("key,slug,title,is_published,status,content")
        .order("key");
      if (error) throw error;

      return (data ?? []) as PageRow[];
    },
  });

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  useEffect(() => { if (!selectedKey && data.length > 0) setSelectedKey(data[0].key); }, [data, selectedKey]);
  const selected = data.find((r) => r.key === selectedKey) ?? null;

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <PageList rows={data} selectedKey={selectedKey} onSelect={setSelectedKey} onCreated={setSelectedKey} />
      {selected ? (
        <div className="min-w-0 max-w-4xl w-full">
          <PageEditor key={selected.key} row={selected} onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "pages"] })} />
        </div>
      ) : (
        <p className="text-muted-foreground">Pick a page.</p>
      )}
    </div>

  );
}

function PageList({
  rows, selectedKey, onSelect, onCreated,
}: {
  rows: PageRow[]; selectedKey: string | null;
  onSelect: (k: string) => void; onCreated: (k: string) => void;
}) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      const t = title.trim();
      const s = slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
      if (!t || !s) throw new Error("Title and slug are required.");
      if (rows.some((r) => r.slug === s || r.key === s)) throw new Error("Slug already exists.");
      const key = `custom:${s}`;
      const { error } = await supabase
        .from("pages")
        .insert({ key, slug: s, title: t, is_published: true, template: "blank", content: { blocks: [] } as never });
      if (error) throw error;
      return key;
    },
    onSuccess: (key) => {
      setCreating(false); setTitle(""); setSlug(""); setErr(null);
      qc.invalidateQueries({ queryKey: ["admin", "pages"] });
      onCreated(key);
    },
    onError: (e: Error) => setErr(e.message),
  });

  const core = rows.filter((r) => !r.key.startsWith("pillar:") && !r.key.startsWith("custom:"));
  const pillars = rows.filter((r) => r.key.startsWith("pillar:"));
  const custom = rows.filter((r) => r.key.startsWith("custom:"));

  return (
    <aside className="rounded-3xl border border-border bg-card p-4 h-fit">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pages</p>
        <button className="btn-ghost text-xs" onClick={() => setCreating((c) => !c)}>
          <Plus className="h-3.5 w-3.5" /> New
        </button>
      </div>

      {creating && (
        <div className="mb-4 rounded-2xl border border-border bg-background p-3">
          <input className="mb-2 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm" placeholder="Page title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="mb-2 w-full rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs" placeholder="url-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          {err && <p className="mb-2 text-xs text-destructive">{err}</p>}
          <div className="flex gap-2">
            <button className="btn-primary text-xs" disabled={create.isPending} onClick={() => create.mutate()}>Create</button>
            <button className="btn-ghost text-xs" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      <Group label="Core" rows={core} selectedKey={selectedKey} onSelect={onSelect} />
      {pillars.length > 0 && <Group label="Pillars" rows={pillars} selectedKey={selectedKey} onSelect={onSelect} />}
      {custom.length > 0 && <Group label="Custom" rows={custom} selectedKey={selectedKey} onSelect={onSelect} />}
    </aside>
  );
}

function Group({ label, rows, selectedKey, onSelect }: { label: string; rows: PageRow[]; selectedKey: string | null; onSelect: (k: string) => void }) {
  return (
    <div className="mb-4">
      <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{label}</p>
      <ul className="flex flex-col gap-1">
        {rows.map((r) => (
          <li key={r.key}>
            <button
              onClick={() => onSelect(r.key)}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${selectedKey === r.key ? "bg-secondary" : "hover:bg-secondary"}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  {r.status === "hidden" && <Lock className="h-3 w-3 shrink-0" style={{ color: "var(--heart)" }} />}
                  {r.status === "coming_soon" && <Clock className="h-3 w-3 shrink-0" style={{ color: "var(--gold)" }} />}
                  <span className="truncate">{r.title || r.slug}</span>
                </div>
                <div className="font-mono text-[10px] text-muted-foreground">/{r.slug}</div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// -------- JSON table editor (with Builder launch button) --------

function PageEditor({ row, onSaved }: { row: PageRow; onSaved: () => void }) {
  const { user } = useAuth();
  const [gateOpen, setGateOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...(row.content ?? {}) });
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const initialRef = useRef(row.key);
  useEffect(() => {
    if (initialRef.current !== row.key) {
      setDraft({ ...(row.content ?? {}) }); setDirty(false); setStatus(null);
      initialRef.current = row.key;
    }
  }, [row]);


  const blocks = draft.blocks;
  const hasBlocks = isBlockArray(blocks) && blocks.length > 0;

  const entries = useMemo(
    () => Object.entries(draft).filter(([k]) => k !== "blocks").sort(([a], [b]) => a.localeCompare(b)),
    [draft],
  );

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pages").update({ content: draft as never }).eq("key", row.key);
      if (error) throw error;
    },
    onSuccess: () => { setStatus({ kind: "ok", msg: "Saved." }); setDirty(false); onSaved(); },
    onError: (e: Error) => setStatus({ kind: "err", msg: e.message }),
  });

  const [statusOverlayOpen, setStatusOverlayOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PageStatus | null>(null);

  const setStatusMutation = useMutation({
    mutationFn: async (next: PageStatus) => {
      const { error } = await supabase.from("pages").update({ status: next } as never).eq("key", row.key);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      const msg =
        next === "published" ? "Page is now published." :
        next === "hidden" ? "Page is hidden — visitors see the hidden template." :
        "Page is set to coming soon — visitors see the coming-soon template.";
      setStatus({ kind: "ok", msg });
      onSaved();
    },
    onError: (e: Error) => setStatus({ kind: "err", msg: e.message }),
  });


  const update = (key: string, value: string) => { setDraft((d) => ({ ...d, [key]: value })); setDirty(true); };
  const addKey = () => {
    const k = window.prompt("New field key (letters, numbers, underscore):");
    if (!k) return;
    if (k in draft) return;
    setDraft((d) => ({ ...d, [k]: "" })); setDirty(true);
  };
  const removeKey = (k: string) => {
    if (!window.confirm(`Delete field "${k}"?`)) return;
    setDraft((d) => { const { [k]: _drop, ...rest } = d; void _drop; return rest; });
    setDirty(true);
  };

  return (
    <div className="rounded-3xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            {row.status === "hidden" && <Lock className="h-4 w-4" style={{ color: "var(--heart)" }} />}
            {row.status === "coming_soon" && <Clock className="h-4 w-4" style={{ color: "var(--gold)" }} />}
            {row.title || row.slug}
          </h2>
          <p className="font-mono text-xs text-muted-foreground">
            key: {row.key} · slug: /{row.slug} · {hasBlocks ? "using builder blocks" : "using legacy fields"}
            {row.status !== "published" && (
              <> · <span style={{ color: row.status === "hidden" ? "var(--heart)" : "var(--gold)" }}>{row.status === "hidden" ? "hidden" : "coming soon"}</span></>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusOverlayOpen(true)}
            disabled={setStatusMutation.isPending}
            className="btn-ghost text-xs"
            title="Change page status — password required."
          >
            {row.status === "published" ? <><Eye className="h-3.5 w-3.5" /> Published</> :
             row.status === "hidden" ? <><EyeOff className="h-3.5 w-3.5" /> Hidden</> :
             <><Clock className="h-3.5 w-3.5" /> Coming soon</>}
          </button>


          <a href={`/${row.slug}`} target="_blank" rel="noreferrer" className="btn-ghost text-xs">
            <ExternalLink className="h-3.5 w-3.5" /> View live
          </a>
          <Link
            to="/admin/pages/$key/builder"
            params={{ key: row.key }}
            className="btn-primary text-sm"
          >
            <LayoutTemplate className="h-4 w-4" /> Open builder
          </Link>
        </div>
      </div>

      <div className="p-6">
        {hasBlocks && (
          <p className="mb-4 rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200">
            This page is rendered from builder blocks. Use <strong>Open builder</strong> above to visually edit layout.
            The fields below still power any legacy references and are used to seed the builder for the first time.
          </p>
        )}

        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-[240px] px-4 py-2 text-left font-semibold">Key</th>
                <th className="px-4 py-2 text-left font-semibold">Value</th>
                <th className="w-[60px] px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No fields yet. Add one below, or open the builder to work with blocks.
                </td></tr>
              )}
              {entries.map(([key, value]) => (
                <tr key={key} className="border-t border-border align-top">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{key}</td>
                  <td className="px-4 py-3">
                    {Array.isArray(value) || (typeof value === "object" && value !== null) ? (
                      <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-dashed border-border bg-background/50 px-3 py-2 font-mono text-[11px] text-muted-foreground">
                        {JSON.stringify(value, null, 2)}
                      </pre>

                    ) : (
                      <textarea
                        rows={Math.min(6, Math.max(1, String(value ?? "").split("\n").length))}
                        className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-heart"
                        value={String(value ?? "")}
                        onChange={(e) => update(key, e.target.value)}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-xs text-muted-foreground hover:text-destructive" onClick={() => removeKey(key)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="btn-primary" onClick={() => save.mutate()} disabled={save.isPending || !dirty}>
            {save.isPending ? "Saving…" : "Save fields"}
          </button>
          <button className="btn-ghost text-sm" onClick={addKey}><Plus className="h-3.5 w-3.5" /> Add field</button>
          {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
          {status && <span className={`text-xs font-semibold ${status.kind === "ok" ? "text-emerald-600" : "text-destructive"}`}>{status.msg}</span>}
        </div>
      </div>

      <StatusOverlay
        open={statusOverlayOpen}
        current={row.status}
        onOpenChange={setStatusOverlayOpen}
        onPick={(next) => {
          setStatusOverlayOpen(false);
          setPendingStatus(next);
          setGateOpen(true);
        }}
      />

      <AdminPasswordGate
        open={gateOpen}
        onOpenChange={(o) => { setGateOpen(o); if (!o) setPendingStatus(null); }}
        email={user?.email ?? ""}
        onVerified={() => {
          setGateOpen(false);
          if (pendingStatus) {
            setStatusMutation.mutate(pendingStatus);
            setPendingStatus(null);
          }
        }}
      />


    </div>
  );
}

function StatusOverlay({
  open, current, onOpenChange, onPick,
}: {
  open: boolean;
  current: PageStatus;
  onOpenChange: (o: boolean) => void;
  onPick: (next: PageStatus) => void;
}) {
  const options: { value: PageStatus; label: string; icon: React.ComponentType<{ className?: string }>; description: string; color: string }[] = [
    { value: "published", label: "Published", icon: Eye, description: "Live for all visitors.", color: "var(--ink)" },
    { value: "hidden", label: "Hidden", icon: EyeOff, description: "Visitors see the hidden template.", color: "var(--heart)" },
    { value: "coming_soon", label: "Coming soon", icon: Clock, description: "Visitors see a coming-soon page with newsletter sign-up.", color: "var(--gold)" },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Set page status</DialogTitle>
          <DialogDescription>Pick a state. You'll be asked to confirm your password.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-3">
          {options.map((o) => {
            const Icon = o.icon;
            const isCurrent = o.value === current;
            return (
              <button
                key={o.value}
                onClick={() => onPick(o.value)}
                className={`group flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all ${isCurrent ? "border-heart bg-heart/5" : "border-border bg-card hover:border-heart hover:shadow-md"}`}
              >
                <Icon className="h-6 w-6" />
                <div>
                  <p className="text-base font-bold">{o.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{o.description}</p>
                </div>
                {isCurrent && <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--heart)" }}>Current</span>}
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

