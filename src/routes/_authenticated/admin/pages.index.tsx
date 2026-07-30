import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, LayoutTemplate, Plus, Eye, EyeOff, Clock, Trash2, Archive, RotateCcw } from "lucide-react";
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
  archived_at: string | null;
  in_nav: boolean;
  nav_label: string | null;
  nav_order: number;
}


type PendingAction =
  | { kind: "status"; key: string; next: PageStatus }
  | { kind: "archive"; key: string }
  | { kind: "restore"; key: string }
  | { kind: "purge"; key: string };

function PagesAdmin() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "pages"],
    queryFn: async (): Promise<PageRow[]> => {
      const { data, error } = await supabase
        .from("pages")
        .select("key,slug,title,is_published,status,archived_at,in_nav,nav_label,nav_order")
        .order("key");
      if (error) throw error;
      // "join" visibility is controlled by the account-access setting toggle,
      // so it is not managed here.
      return ((data ?? []) as PageRow[]).filter((p) => p.slug !== "join" && p.key !== "join");
    },
  });

  const { data: activePillarSlugs = new Set<string>() } = useQuery({
    queryKey: ["admin", "pillars", "active-slugs"],
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from("pillars")
        .select("slug,archived_at");
      if (error) throw error;
      return new Set(
        (data ?? [])
          .filter((r: { archived_at: string | null }) => !r.archived_at)
          .map((r: { slug: string }) => r.slug),
      );
    },
  });


  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<"active" | "archive">("active");

  // Password-gated actions
  const [gateOpen, setGateOpen] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const [statusOverlay, setStatusOverlay] = useState<{ key: string; current: PageStatus } | null>(null);
  const [confirm, setConfirm] = useState<
    | { kind: "archive" | "restore" | "purge"; key: string; title: string }
    | null
  >(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [pillarLocked, setPillarLocked] = useState<{ title: string; slug: string } | null>(null);


  // ---- Navbar controls -------------------------------------------------
  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["admin", "pages"] });
    qc.invalidateQueries({ queryKey: ["cms"] });
  };

  const navToggleMutation = useMutation({
    mutationFn: async (p: { key: string; next: boolean; order: number }) => {
      const { error } = await supabase
        .from("pages")
        .update({ in_nav: p.next, nav_order: p.next ? p.order : 0 } as never)
        .eq("key", p.key);
      if (error) throw error;
      return p.next;
    },
    onSuccess: (next) => {
      setToast({ kind: "ok", msg: next ? "Added to the navbar." : "Removed from the navbar." });
      invalidateAll();
    },
    onError: (e: Error) => setToast({ kind: "err", msg: e.message }),
  });

  const navLabelMutation = useMutation({
    mutationFn: async (p: { key: string; label: string }) => {
      const { error } = await supabase
        .from("pages")
        .update({ nav_label: p.label.trim() || null } as never)
        .eq("key", p.key);
      if (error) throw error;
    },
    onSuccess: () => {
      setToast({ kind: "ok", msg: "Navbar label saved." });
      invalidateAll();
    },
    onError: (e: Error) => setToast({ kind: "err", msg: e.message }),
  });

  const navReorderMutation = useMutation({
    mutationFn: async (keys: string[]) => {
      await Promise.all(
        keys.map((key, i) =>
          supabase.from("pages").update({ nav_order: i + 1 } as never).eq("key", key),
        ),
      );
    },
    onSuccess: invalidateAll,
    onError: (e: Error) => setToast({ kind: "err", msg: e.message }),
  });

  const setStatusMutation = useMutation({
    mutationFn: async (p: { key: string; next: PageStatus }) => {
      // Hidden pages can never sit in the navbar.
      const patch = p.next === "hidden" ? { status: p.next, in_nav: false } : { status: p.next };
      const { error } = await supabase.from("pages").update(patch as never).eq("key", p.key);
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
      qc.invalidateQueries({ queryKey: ["cms"] });
    },
    onError: (e: Error) => setToast({ kind: "err", msg: e.message }),
  });

  const archiveMutation = useMutation({
    mutationFn: async (key: string) => {
      const { error } = await supabase
        .from("pages")
        .update({ archived_at: new Date().toISOString(), in_nav: false } as never)
        .eq("key", key);
      if (error) throw error;
      return key;
    },

    onSuccess: (key) => {
      setToast({ kind: "ok", msg: "Page moved to archive." });
      if (activeKey === key) setActiveKey(null);
      qc.invalidateQueries({ queryKey: ["admin", "pages"] });
      qc.invalidateQueries({ queryKey: ["cms"] });
    },
    onError: (e: Error) => setToast({ kind: "err", msg: e.message }),
  });

  const restoreMutation = useMutation({
    mutationFn: async (key: string) => {
      const row = data.find((r) => r.key === key);
      if (!row) throw new Error("Page not found.");
      const conflict = data.find((r) => r.key !== key && !r.archived_at && r.slug === row.slug);
      if (conflict) throw new Error(`Slug "/${row.slug}" is already in use by "${conflict.title || conflict.slug}". Change that page's slug first.`);
      const { error } = await supabase.from("pages").update({ archived_at: null } as never).eq("key", key);
      if (error) throw error;
      return key;
    },
    onSuccess: () => {
      setToast({ kind: "ok", msg: "Page restored." });
      qc.invalidateQueries({ queryKey: ["admin", "pages"] });
      qc.invalidateQueries({ queryKey: ["cms"] });
    },
    onError: (e: Error) => setToast({ kind: "err", msg: e.message }),
  });

  const purgeMutation = useMutation({
    mutationFn: async (key: string) => {
      const { error } = await supabase.from("pages").delete().eq("key", key);
      if (error) throw error;
      return key;
    },
    onSuccess: (key) => {
      setToast({ kind: "ok", msg: "Page permanently deleted." });
      if (activeKey === key) setActiveKey(null);
      qc.invalidateQueries({ queryKey: ["admin", "pages"] });
      qc.invalidateQueries({ queryKey: ["cms"] });
    },
    onError: (e: Error) => setToast({ kind: "err", msg: e.message }),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  const active = data.filter((r) => !r.archived_at);
  const archived = data.filter((r) => !!r.archived_at);
  const core = active.filter((r) => !r.key.startsWith("pillar:") && !r.key.startsWith("custom:") && !r.key.startsWith("system:"));
  const pillars = active.filter((r) => r.key.startsWith("pillar:"));
  const custom = active.filter((r) => r.key.startsWith("custom:"));
  const system = active.filter((r) => r.key.startsWith("system:"));
  const navRows = active
    .filter((r) => r.in_nav && r.status !== "hidden")
    .sort((a, b) => a.nav_order - b.nav_order);
  const nextNavOrder = navRows.length > 0 ? Math.max(...navRows.map((r) => r.nav_order)) + 1 : 1;
  const canBeInNav = (r: PageRow) =>
    !r.archived_at && r.status !== "hidden" && !r.key.startsWith("system:") && !!r.slug;
  const toggleNav = (r: PageRow) =>
    navToggleMutation.mutate({ key: r.key, next: !r.in_nav, order: nextNavOrder });


  const runGated = (action: PendingAction) => {
    setConfirm(null);
    setStatusOverlay(null);
    setPending(action);
    setGateOpen(true);
  };
  const onVerified = () => {
    setGateOpen(false);
    if (!pending) return;
    if (pending.kind === "status") setStatusMutation.mutate({ key: pending.key, next: pending.next });
    if (pending.kind === "archive") archiveMutation.mutate(pending.key);
    if (pending.kind === "restore") restoreMutation.mutate(pending.key);
    if (pending.kind === "purge") purgeMutation.mutate(pending.key);
    setPending(null);
  };

  return (
    <div className="flex flex-col gap-6" onClick={() => setActiveKey(null)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pages</h1>
          <p className="text-sm text-muted-foreground">Click a page to reveal actions. Use the builder to edit content.</p>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="inline-flex rounded-md border border-border p-0.5">
            <button
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold ${tab === "active" ? "bg-secondary" : "hover:bg-secondary/60"}`}
              onClick={() => setTab("active")}
            >
              Active
            </button>
            <button
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold ${tab === "archive" ? "bg-secondary" : "hover:bg-secondary/60"}`}
              onClick={() => setTab("archive")}
            >
              <Archive className="h-3 w-3" /> Archive
              {archived.length > 0 && <span className="ml-1 rounded-full bg-heart/10 px-1.5 text-[10px] text-heart">{archived.length}</span>}
            </button>
          </div>
          {tab === "active" && (
            <button className="btn-primary text-sm" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> New page
            </button>
          )}
        </div>
      </div>

      {toast && (
        <p className={`text-xs font-semibold ${toast.kind === "ok" ? "text-emerald-600" : "text-destructive"}`}>
          {toast.msg}
        </p>
      )}

      {tab === "active" ? (
        <>
          <NavbarSection
            rows={navRows}
            onReorder={(keys) => navReorderMutation.mutate(keys)}
            onRemove={(row) => navToggleMutation.mutate({ key: row.key, next: false, order: 0 })}
            onLabel={(key, label) => navLabelMutation.mutate({ key, label })}
          />

          <Section
            label="Core"
            rows={core}
            activeKey={activeKey}
            onSelect={setActiveKey}
            onStatus={(row) => setStatusOverlay({ key: row.key, current: row.status })}
            onDelete={(row) => setConfirm({ kind: "archive", key: row.key, title: row.title || row.slug })}
            onRestore={null}
            onPurge={null}
            onNav={(row) => toggleNav(row)}
            canNav={canBeInNav}
          />
          {pillars.length > 0 && (
            <Section
              label="Pillars"
              rows={pillars}
              activeKey={activeKey}
              onSelect={setActiveKey}
              onStatus={(row) => setStatusOverlay({ key: row.key, current: row.status })}
              onDelete={null}
              onRestore={null}
              onPurge={null}
              onNav={(row) => toggleNav(row)}
              canNav={canBeInNav}
            />
          )}
          {custom.length > 0 && (
            <Section
              label="Custom"
              rows={custom}
              activeKey={activeKey}
              onSelect={setActiveKey}
              onStatus={(row) => setStatusOverlay({ key: row.key, current: row.status })}
              onDelete={(row) => setConfirm({ kind: "archive", key: row.key, title: row.title || row.slug })}
              onRestore={null}
              onPurge={null}
              onNav={(row) => toggleNav(row)}
              canNav={canBeInNav}
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
              onRestore={null}
              onPurge={null}
              note="Rendered when a page is hidden or coming soon. Edit via builder to customise."
            />
          )}
        </>
      ) : (
        <Section
          label="Archive"
          rows={archived}
          activeKey={activeKey}
          onSelect={setActiveKey}
          onStatus={null}
          onDelete={null}
          onRestore={(row) => setConfirm({ kind: "restore", key: row.key, title: row.title || row.slug })}
          onPurge={(row) => setConfirm({ kind: "purge", key: row.key, title: row.title || row.slug })}
          isRestoreLocked={(row) => {
            if (!row.key.startsWith("pillar:")) return false;
            const pillarSlug = row.key.slice("pillar:".length);
            return !activePillarSlugs.has(pillarSlug);
          }}
          onRestoreLocked={(row) => setPillarLocked({ title: row.title || row.slug, slug: row.key.slice("pillar:".length) })}
          note={archived.length === 0 ? "No archived pages. Deleted pages land here so you can restore them." : "Deleted pages live here. Restore or permanently delete."}
        />
      )}

      {pillarLocked && (
        <Dialog open onOpenChange={(o) => { if (!o) setPillarLocked(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>This page belongs to a pillar</DialogTitle>
              <DialogDescription>
                "{pillarLocked.title}" is the page for the archived pillar <span className="font-mono">{pillarLocked.slug}</span>. It can't be restored on its own — restore the pillar itself first, and this page will come back with it.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setPillarLocked(null)}>Got it</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
          onPick={(next) => runGated({ kind: "status", key: statusOverlay.key, next })}
        />
      )}

      {confirm && (
        <Dialog open onOpenChange={(o) => { if (!o) setConfirm(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {confirm.kind === "archive" && `Move "${confirm.title}" to archive?`}
                {confirm.kind === "restore" && `Restore "${confirm.title}"?`}
                {confirm.kind === "purge" && `Permanently delete "${confirm.title}"?`}
              </DialogTitle>
              <DialogDescription>
                {confirm.kind === "archive" && "The page will be hidden from the site and can be restored later from the archive. You'll be asked to confirm your password."}
                {confirm.kind === "restore" && "The page will return to Active with its previous status. If another page has taken its slug, restore will fail. You'll be asked to confirm your password."}
                {confirm.kind === "purge" && "This cannot be undone. The page and its blocks are removed forever. You'll be asked to confirm your password."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
              <Button
                variant={confirm.kind === "purge" ? "destructive" : "default"}
                onClick={() => runGated({ kind: confirm.kind, key: confirm.key })}
              >
                {confirm.kind === "archive" && "Move to archive"}
                {confirm.kind === "restore" && "Restore"}
                {confirm.kind === "purge" && "Delete forever"}
              </Button>
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


/** Ordered list of pages currently shown in the site navbar. Drag to reorder. */
function NavbarSection({
  rows, onReorder, onRemove, onLabel,
}: {
  rows: PageRow[];
  onReorder: (keys: string[]) => void;
  onRemove: (row: PageRow) => void;
  onLabel: (key: string, label: string) => void;
}) {
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [order, setOrder] = useState<string[] | null>(null);
  const keys = order ?? rows.map((r) => r.key);
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const items = keys.map((k) => byKey.get(k)).filter(Boolean) as PageRow[];

  const onDrop = (targetKey: string) => {
    if (!dragKey || dragKey === targetKey) return;
    const next = keys.filter((k) => k !== dragKey);
    next.splice(next.indexOf(targetKey), 0, dragKey);
    setOrder(next);
    setDragKey(null);
    onReorder(next);
  };

  return (
    <section onClick={(e) => e.stopPropagation()}>
      <div className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Navbar</p>
        <p className="mt-1 text-xs text-muted-foreground">
          These pages appear in the site navigation, in this order. Drag to reorder, rename the label, or remove.
          Add a page with the “Navbar” button on its tile below.
        </p>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-4 text-xs text-muted-foreground">
          No pages in the navbar yet — the site falls back to pillars + About until you add some.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((r) => (
            <div
              key={r.key}
              draggable
              onDragStart={() => setDragKey(r.key)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(r.key)}
              className={`flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 ${
                dragKey === r.key ? "border-heart opacity-60" : "border-border"
              }`}
            >
              <GripVertical className="h-3.5 w-3.5 cursor-grab text-muted-foreground" />
              <input
                defaultValue={r.nav_label ?? r.title ?? r.slug}
                placeholder={r.title || r.slug}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (v !== (r.nav_label ?? r.title ?? r.slug)) onLabel(r.key, v);
                }}
                className="w-28 bg-transparent text-sm font-semibold outline-none"
              />
              <span className="font-mono text-[10px] text-muted-foreground">/{r.slug}</span>
              <button
                type="button"
                aria-label={`Remove ${r.title || r.slug} from navbar`}
                onClick={() => { setOrder(null); onRemove(r); }}
                className="text-muted-foreground hover:text-heart"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Section({
  label, rows, activeKey, onSelect, onStatus, onDelete, onRestore, onPurge, onNav, canNav, isRestoreLocked, onRestoreLocked, note,
}: {
  label: string;
  rows: PageRow[];
  activeKey: string | null;
  onSelect: (k: string | null) => void;
  onStatus: ((row: PageRow) => void) | null;
  onDelete: ((row: PageRow) => void) | null;
  onRestore: ((row: PageRow) => void) | null;
  onPurge: ((row: PageRow) => void) | null;
  onNav?: (row: PageRow) => void;
  canNav?: (row: PageRow) => boolean;
  isRestoreLocked?: (row: PageRow) => boolean;
  onRestoreLocked?: (row: PageRow) => void;
  note?: string;
}) {

  return (
    <section>
      <div className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
      </div>
      {rows.length > 0 && (
        <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((r) => {
            const locked = onRestore && isRestoreLocked ? isRestoreLocked(r) : false;
            return (
              <PageTile
                key={r.key}
                row={r}
                active={activeKey === r.key}
                onSelect={() => onSelect(activeKey === r.key ? null : r.key)}
                onStatus={onStatus ? () => onStatus(r) : null}
                onDelete={onDelete ? () => onDelete(r) : null}
                onRestore={onRestore ? () => onRestore(r) : null}
                onPurge={onPurge ? () => onPurge(r) : null}
                restoreLocked={locked}
                onRestoreLocked={onRestoreLocked ? () => onRestoreLocked(r) : null}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function PageTile({
  row, active, onSelect, onStatus, onDelete, onRestore, onPurge, restoreLocked, onRestoreLocked,
}: {
  row: PageRow;
  active: boolean;
  onSelect: () => void;
  onStatus: (() => void) | null;
  onDelete: (() => void) | null;
  onRestore: (() => void) | null;
  onPurge: (() => void) | null;
  restoreLocked?: boolean;
  onRestoreLocked?: (() => void) | null;
}) {

  const statusMeta =
    row.archived_at ? { label: "Archived", icon: Archive, color: "var(--muted-foreground)" } :
    row.status === "published" ? { label: "Published", icon: Eye, color: "var(--ink)" } :
    row.status === "hidden" ? { label: "Hidden", icon: EyeOff, color: "var(--heart)" } :
    { label: "Coming soon", icon: Clock, color: "var(--gold)" };
  const StatusIcon = statusMeta.icon;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={`flex cursor-pointer flex-col self-start rounded-2xl border bg-card p-4 transition-all ${
        active ? "border-heart shadow-md ring-1 ring-heart/30" : "border-border hover:border-heart/60 hover:shadow-sm"
      } ${row.archived_at ? "opacity-80" : ""}`}
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
          {!row.archived_at && (
            <>
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
            </>
          )}
          {onDelete && (
            <button
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/10"
              onClick={onDelete}
              title="Move to archive"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          )}
          {onRestore && (
            restoreLocked ? (
              <button
                className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px] font-semibold text-muted-foreground opacity-60"
                onClick={onRestoreLocked ?? undefined}
                title="This page is a pillar — restore the pillar first"
              >
                <RotateCcw className="h-3 w-3" /> Restore
              </button>
            ) : (
              <button
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold hover:bg-secondary"
                onClick={onRestore}
                title="Restore page"
              >
                <RotateCcw className="h-3 w-3" /> Restore
              </button>
            )
          )}

          {onPurge && (
            <button
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/10"
              onClick={onPurge}
              title="Permanently delete"
            >
              <Trash2 className="h-3 w-3" /> Delete forever
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
      const key = `custom:${s}`;
      const conflict = existing.find((r) => r.slug === s || r.key === s || r.key === key);
      if (conflict) {
        const where = conflict.archived_at ? "the archive" : "an active page";
        throw new Error(`Slug "/${s}" is already used by ${where} ("${conflict.title || conflict.slug}"). Pick a different slug.`);
      }
      const { error } = await supabase
        .from("pages")
        .insert({ key, slug: s, title: t, is_published: true, template: "blank", content: { blocks: [] } as never });
      if (error) throw new Error(error.message.includes("pages_slug_active_unique") ? `Slug "/${s}" is already in use.` : error.message);
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
