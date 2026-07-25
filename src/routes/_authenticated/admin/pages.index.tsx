import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, LayoutTemplate, Plus, Eye, EyeOff, Clock, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
}

function PagesAdmin() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "pages"],
    queryFn: async (): Promise<PageRow[]> => {
      const { data, error } = await supabase
        .from("pages")
        .select("key,slug,title,is_published,status")
        .order("key");
      if (error) throw error;
      return (data ?? []) as PageRow[];
    },
  });

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Password-gated actions
  const [gateOpen, setGateOpen] = useState(false);
  const [pending, setPending] = useState<
    | { kind: "status"; key: string; next: PageStatus }
    | { kind: "delete"; key: string }
    | null
  >(null);

  const [statusOverlay, setStatusOverlay] = useState<{ key: string; current: PageStatus } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ key: string; title: string } | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const setStatusMutation = useMutation({
    mutationFn: async (p: { key: string; next: PageStatus }) => {
      const { error } = await supabase.from("pages").update({ status: p.next } as never).eq("key", p.key);
      if (error) throw error;
      return p.next;
    },
    onSuccess: (next) => {
      setToast({
        kind: "ok",
        msg:
          next === "published" ? "Page is now published." :
          next === "hidden" ? "Page hidden." :
          "Page set to coming soon.",
      });
      qc.invalidateQueries({ queryKey: ["admin", "pages"] });
    },
    onError: (e: Error) => setToast({ kind: "err", msg: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      const { error } = await supabase.from("pages").delete().eq("key", key);
      if (error) throw error;
      return key;
    },
    onSuccess: (key) => {
      setToast({ kind: "ok", msg: "Page deleted." });
      if (activeKey === key) setActiveKey(null);
      qc.invalidateQueries({ queryKey: ["admin", "pages"] });
    },
    onError: (e: Error) => setToast({ kind: "err", msg: e.message }),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  const core = data.filter((r) => !r.key.startsWith("pillar:") && !r.key.startsWith("custom:") && !r.key.startsWith("system:"));
  const pillars = data.filter((r) => r.key.startsWith("pillar:"));
  const custom = data.filter((r) => r.key.startsWith("custom:"));
  const system = data.filter((r) => r.key.startsWith("system:"));

  const runStatus = (key: string, next: PageStatus) => {
    setStatusOverlay(null);
    setPending({ kind: "status", key, next });
    setGateOpen(true);
  };
  const runDelete = (key: string) => {
    setDeleteConfirm(null);
    setPending({ kind: "delete", key });
    setGateOpen(true);
  };
  const onVerified = () => {
    setGateOpen(false);
    if (!pending) return;
    if (pending.kind === "status") setStatusMutation.mutate({ key: pending.key, next: pending.next });
    if (pending.kind === "delete") deleteMutation.mutate(pending.key);
    setPending(null);
  };

  return (
    <div className="flex flex-col gap-6" onClick={() => setActiveKey(null)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pages</h1>
          <p className="text-sm text-muted-foreground">Click a page to reveal actions. Use the builder to edit content.</p>
        </div>
        <button className="btn-primary text-sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New page
        </button>
      </div>

      {toast && (
        <p className={`text-xs font-semibold ${toast.kind === "ok" ? "text-emerald-600" : "text-destructive"}`}>
          {toast.msg}
        </p>
      )}

      <Section
        label="Core"
        rows={core}
        activeKey={activeKey}
        onSelect={setActiveKey}
        onStatus={(row) => setStatusOverlay({ key: row.key, current: row.status })}
        onDelete={null}
      />
      {pillars.length > 0 && (
        <Section
          label="Pillars"
          rows={pillars}
          activeKey={activeKey}
          onSelect={setActiveKey}
          onStatus={(row) => setStatusOverlay({ key: row.key, current: row.status })}
          onDelete={null}
        />
      )}
      {custom.length > 0 && (
        <Section
          label="Custom"
          rows={custom}
          activeKey={activeKey}
          onSelect={setActiveKey}
          onStatus={(row) => setStatusOverlay({ key: row.key, current: row.status })}
          onDelete={(row) => setDeleteConfirm({ key: row.key, title: row.title || row.slug })}
        />
      )}
      {system.length > 0 && (
        <Section
          label="System templates"
          rows={system}
          activeKey={activeKey}
          onSelect={setActiveKey}
          onStatus={null}
          onDelete={null}
          note="Rendered when a page is hidden or coming soon. Edit via builder to customise."
        />
      )}

      {creating && (
        <CreateDialog
          existing={data}
          onClose={() => setCreating(false)}
          onCreated={(key) => {
            setCreating(false);
            setActiveKey(key);
            qc.invalidateQueries({ queryKey: ["admin", "pages"] });
          }}
        />
      )}

      {statusOverlay && (
        <StatusOverlay
          open
          current={statusOverlay.current}
          onOpenChange={(o) => { if (!o) setStatusOverlay(null); }}
          onPick={(next) => runStatus(statusOverlay.key, next)}
        />
      )}

      {deleteConfirm && (
        <Dialog open onOpenChange={(o) => { if (!o) setDeleteConfirm(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete "{deleteConfirm.title}"?</DialogTitle>
              <DialogDescription>
                This permanently removes the page and its blocks. You'll be asked to confirm your password.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => runDelete(deleteConfirm.key)}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AdminPasswordGate
        open={gateOpen}
        onOpenChange={(o) => { setGateOpen(o); if (!o) setPending(null); }}
        email={user?.email ?? ""}
        onVerified={onVerified}
      />
    </div>
  );
}

function Section({
  label, rows, activeKey, onSelect, onStatus, onDelete, note,
}: {
  label: string;
  rows: PageRow[];
  activeKey: string | null;
  onSelect: (k: string) => void;
  onStatus: ((row: PageRow) => void) | null;
  onDelete: ((row: PageRow) => void) | null;
  note?: string;
}) {
  return (
    <section>
      <div className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
      </div>
      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rows.map((r) => (
          <PageTile
            key={r.key}
            row={r}
            active={activeKey === r.key}
            onSelect={() => onSelect(r.key)}
            onStatus={onStatus ? () => onStatus(r) : null}
            onDelete={onDelete ? () => onDelete(r) : null}
          />
        ))}
      </div>
    </section>
  );
}

function PageTile({
  row, active, onSelect, onStatus, onDelete,
}: {
  row: PageRow;
  active: boolean;
  onSelect: () => void;
  onStatus: (() => void) | null;
  onDelete: (() => void) | null;
}) {
  const statusMeta =
    row.status === "published" ? { label: "Published", icon: Eye, color: "var(--ink)" } :
    row.status === "hidden" ? { label: "Hidden", icon: EyeOff, color: "var(--heart)" } :
    { label: "Coming soon", icon: Clock, color: "var(--gold)" };
  const StatusIcon = statusMeta.icon;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={`flex cursor-pointer flex-col self-start rounded-2xl border bg-card p-4 transition-all ${
        active ? "border-heart shadow-md ring-1 ring-heart/30" : "border-border hover:border-heart/60 hover:shadow-sm"
      }`}
    >
      <div className="flex min-h-[88px] flex-col gap-1.5">
        <h3 className="text-base font-bold leading-tight">{row.title || row.slug}</h3>
        <p className="font-mono text-[11px] text-muted-foreground">/{row.slug}</p>
        <span
          className="mt-auto inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
          style={{ borderColor: statusMeta.color, color: statusMeta.color }}
        >
          <StatusIcon className="h-3 w-3" /> {statusMeta.label}
        </span>
      </div>

      {active && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3" onClick={(e) => e.stopPropagation()}>
          {onStatus && (
            <button
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold hover:bg-secondary"
              onClick={onStatus}
              title="Change status"
            >
              <StatusIcon className="h-3 w-3" /> Status
            </button>
          )}
          <Link
            to="/admin/pages/$key/builder"
            params={{ key: row.key }}
            className="inline-flex items-center gap-1 rounded-md bg-heart px-2 py-1 text-[11px] font-semibold text-white hover:opacity-90"
          >
            <LayoutTemplate className="h-3 w-3" /> Builder
          </Link>
          <a
            href={`/${row.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold hover:bg-secondary"
          >
            <ExternalLink className="h-3 w-3" /> Live
          </a>
          {onDelete && (
            <button
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/10"
              onClick={onDelete}
              title="Delete page"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CreateDialog({
  existing, onClose, onCreated,
}: {
  existing: PageRow[];
  onClose: () => void;
  onCreated: (key: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      const t = title.trim();
      const s = slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
      if (!t || !s) throw new Error("Title and slug are required.");
      if (existing.some((r) => r.slug === s || r.key === s)) throw new Error("Slug already exists.");
      const key = `custom:${s}`;
      const { error } = await supabase
        .from("pages")
        .insert({ key, slug: s, title: t, is_published: true, template: "blank", content: { blocks: [] } as never });
      if (error) throw error;
      return key;
    },
    onSuccess: (key) => onCreated(key),
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New page</DialogTitle>
          <DialogDescription>Create a blank page — you'll edit its content in the builder.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Title</label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">URL slug</label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-new-page"
            />
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
                <span style={{ color: o.color }}><Icon className="h-6 w-6" /></span>
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
