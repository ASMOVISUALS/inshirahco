import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Trash2, Archive as ArchiveIcon, Eye, EyeOff, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PILLARS, RESOURCE_TYPES, type Pillar, type ResourceType } from "@/lib/content";
import { AdminPasswordGate } from "@/components/AdminPasswordGate";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/archive")({
  head: () => ({ meta: [{ title: "Archive — Admin" }, { name: "robots", content: "noindex" }] }),
  component: ArchivePage,
});

type Category = "articles" | "reflections" | "testimonials" | "pages";
const CATEGORIES: { id: Category; label: string }[] = [
  { id: "articles", label: "Articles" },
  { id: "reflections", label: "Reflections" },
  { id: "testimonials", label: "Testimonials" },
  { id: "pages", label: "Pages" },
];

function ArchivePage() {
  const [active, setActive] = useState<Category | null>(null);

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-bold">Archive</h1>
        <p className="text-sm text-muted-foreground">
          Deleted items land here. They stay hidden from the live site until you restore them.
        </p>
      </div>

      <nav className="flex flex-wrap items-end gap-x-8 gap-y-4 border-b border-border pb-4">
        {CATEGORIES.map((c) => {
          const isActive = c.id === active;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActive(isActive ? null : c.id)}
              className={
                "font-display leading-none text-3xl md:text-4xl transition-all duration-200 " +
                (isActive
                  ? "text-heart [text-shadow:0_0_24px_color-mix(in_oklab,var(--heart)_60%,transparent),0_0_48px_color-mix(in_oklab,var(--heart)_35%,transparent)]"
                  : "text-muted-foreground hover:text-foreground")
              }
              aria-pressed={isActive}
            >
              {c.label}
            </button>
          );
        })}
      </nav>

      {active === null && (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border p-16 text-center text-sm text-muted-foreground">
          Pick a category above to see its archive.
        </div>
      )}
      {active === "articles" && <ArticlesArchive />}
      {active === "reflections" && <ReflectionsArchive />}
      {active === "testimonials" && <TestimonialsArchive />}
      {active === "pages" && <PagesArchive />}
    </div>
  );
}

/* --------------------------- Articles --------------------------- */

type ArticleRow = {
  id: string; slug: string; title: string; pillar: string; type: string;
  published: boolean; archived_at: string;
};

function ArticlesArchive() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["archive-articles"],
    queryFn: async (): Promise<ArticleRow[]> => {
      const { data, error } = await supabase
        .from("articles")
        .select("id,slug,title,pillar,type,published,archived_at")
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ArticleRow[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["archive-articles"] });
    qc.invalidateQueries({ queryKey: ["admin-articles"] });
    qc.invalidateQueries({ queryKey: ["articles"] });
  };
  const restore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").update({ archived_at: null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const purge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (data.length === 0) return <EmptyArchive label="articles" />;

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary text-left">
          <tr>
            <th className="px-4 py-3 font-semibold">Title</th>
            <th className="px-4 py-3 font-semibold">Pillar</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((a) => (
            <tr key={a.id} className="border-t border-border opacity-90">
              <td className="px-4 py-3">
                <span className="font-semibold">{a.title}</span>
                <p className="text-xs text-muted-foreground">/{a.slug}</p>
              </td>
              <td className="px-4 py-3">{PILLARS[a.pillar as Pillar]?.short ?? a.pillar}</td>
              <td className="px-4 py-3">{RESOURCE_TYPES[a.type as ResourceType]?.label ?? a.type}</td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => restore.mutate(a.id)}
                  className="mr-3 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
                  style={{ color: "var(--heart)" }}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Restore
                </button>
                <button
                  onClick={() => { if (confirm("Permanently delete this article? This cannot be undone.")) purge.mutate(a.id); }}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-destructive hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete forever
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------- Reflections -------------------------- */

type ReflectionRow = { id: string; arabic: string; translation: string; reference: string };

function ReflectionsArchive() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["archive-reflections"],
    queryFn: async (): Promise<ReflectionRow[]> => {
      const { data, error } = await supabase
        .from("reflections")
        .select("id,arabic,translation,reference,archived_at")
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReflectionRow[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["archive-reflections"] });
    qc.invalidateQueries({ queryKey: ["admin-reflections"] });
    qc.invalidateQueries({ queryKey: ["reflections"] });
  };
  const restore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reflections").update({ archived_at: null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const purge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reflections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (data.length === 0) return <EmptyArchive label="reflections" />;

  return (
    <div className="grid items-start gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((r) => (
        <div key={r.id} className="flex flex-col self-start rounded-2xl border border-border bg-card p-4 opacity-90">
          <p className="font-arabic text-lg leading-relaxed" dir="rtl">{r.arabic}</p>
          <p className="mt-2 text-sm italic line-clamp-4">"{r.translation}"</p>
          <p className="mt-2 text-xs text-muted-foreground">— {r.reference}</p>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <ArchiveIcon className="h-3.5 w-3.5" /> Archived
            </span>
            <div className="flex items-center gap-2">
              <IconBtn label="Restore reflection" onClick={() => restore.mutate(r.id)}>
                <RotateCcw className="h-4 w-4" />
              </IconBtn>
              <IconBtn label="Delete permanently" danger onClick={() => { if (confirm("Permanently delete this reflection?")) purge.mutate(r.id); }}>
                <Trash2 className="h-4 w-4" />
              </IconBtn>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------- Testimonials -------------------------- */

type TestimonialRow = { id: string; quote: string; name: string; role: string | null };

function TestimonialsArchive() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["archive-testimonials"],
    queryFn: async (): Promise<TestimonialRow[]> => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("id,quote,name,role,archived_at")
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TestimonialRow[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["archive-testimonials"] });
    qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
    qc.invalidateQueries({ queryKey: ["testimonials"] });
  };
  const restore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonials").update({ archived_at: null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const purge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (data.length === 0) return <EmptyArchive label="testimonials" />;

  return (
    <div className="grid items-start gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((t) => (
        <div key={t.id} className="flex flex-col self-start rounded-2xl border border-border bg-card p-4 opacity-90">
          <p className="text-sm italic line-clamp-6">"{t.quote}"</p>
          <p className="mt-3 text-sm font-semibold">{t.name}</p>
          {t.role ? <p className="text-xs text-muted-foreground">{t.role}</p> : null}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <ArchiveIcon className="h-3.5 w-3.5" /> Archived
            </span>
            <div className="flex items-center gap-2">
              <IconBtn label="Restore testimonial" onClick={() => restore.mutate(t.id)}>
                <RotateCcw className="h-4 w-4" />
              </IconBtn>
              <IconBtn label="Delete permanently" danger onClick={() => { if (confirm("Permanently delete this testimonial?")) purge.mutate(t.id); }}>
                <Trash2 className="h-4 w-4" />
              </IconBtn>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------- Pages ----------------------------- */

type PageStatus = "published" | "hidden" | "coming_soon";
type PageRow = { key: string; slug: string; title: string; status: PageStatus; archived_at: string };

function PagesArchive() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery({
    queryKey: ["archive-pages"],
    queryFn: async (): Promise<PageRow[]> => {
      const { data, error } = await supabase
        .from("pages")
        .select("key,slug,title,status,archived_at")
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PageRow[];
    },
  });
  // fetch active rows to check slug conflicts on restore
  const { data: activeRows = [] } = useQuery({
    queryKey: ["archive-pages-active-slugs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pages").select("key,slug,title,archived_at").is("archived_at", null);
      if (error) throw error;
      return (data ?? []) as { key: string; slug: string; title: string; archived_at: null }[];
    },
  });

  const [gateOpen, setGateOpen] = useState(false);
  const [pending, setPending] = useState<{ kind: "restore" | "purge"; key: string; title: string } | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["archive-pages"] });
    qc.invalidateQueries({ queryKey: ["archive-pages-active-slugs"] });
    qc.invalidateQueries({ queryKey: ["admin", "pages"] });
    qc.invalidateQueries({ queryKey: ["cms"] });
  };
  const restore = useMutation({
    mutationFn: async (key: string) => {
      const row = data.find((r) => r.key === key);
      if (!row) throw new Error("Page not found.");
      const conflict = activeRows.find((r) => r.slug === row.slug);
      if (conflict) throw new Error(`Slug "/${row.slug}" is already in use by "${conflict.title || conflict.slug}". Change that page's slug first.`);
      const { error } = await supabase.from("pages").update({ archived_at: null }).eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => { setToast({ kind: "ok", msg: "Page restored." }); invalidate(); },
    onError: (e: Error) => setToast({ kind: "err", msg: e.message }),
  });
  const purge = useMutation({
    mutationFn: async (key: string) => {
      const { error } = await supabase.from("pages").delete().eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => { setToast({ kind: "ok", msg: "Page permanently deleted." }); invalidate(); },
    onError: (e: Error) => setToast({ kind: "err", msg: e.message }),
  });

  const onVerified = () => {
    setGateOpen(false);
    if (!pending) return;
    if (pending.kind === "restore") restore.mutate(pending.key);
    if (pending.kind === "purge") purge.mutate(pending.key);
    setPending(null);
  };

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-4">
      {toast && (
        <p className={`text-xs font-semibold ${toast.kind === "ok" ? "text-emerald-600" : "text-destructive"}`}>
          {toast.msg}
        </p>
      )}
      {data.length === 0 ? (
        <EmptyArchive label="pages" />
      ) : (
        <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((r) => (
            <PageArchiveTile
              key={r.key}
              row={r}
              onRestore={() => { setPending({ kind: "restore", key: r.key, title: r.title || r.slug }); setGateOpen(true); }}
              onPurge={() => { if (confirm(`Permanently delete "${r.title || r.slug}"? This cannot be undone.`)) { setPending({ kind: "purge", key: r.key, title: r.title || r.slug }); setGateOpen(true); } }}
            />
          ))}
        </div>
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

function PageArchiveTile({ row, onRestore, onPurge }: { row: PageRow; onRestore: () => void; onPurge: () => void }) {
  const statusMeta =
    row.status === "published" ? { label: "Was published", icon: Eye, color: "var(--ink)" } :
    row.status === "hidden" ? { label: "Was hidden", icon: EyeOff, color: "var(--heart)" } :
    { label: "Was coming soon", icon: Clock, color: "var(--gold)" };
  const StatusIcon = statusMeta.icon;
  return (
    <div className="flex flex-col self-start rounded-2xl border border-border bg-card p-4 opacity-90">
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
      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
        <button
          onClick={onRestore}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold hover:bg-secondary"
        >
          <RotateCcw className="h-3 w-3" /> Restore
        </button>
        <button
          onClick={onPurge}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3 w-3" /> Delete forever
        </button>
      </div>
    </div>
  );
}

/* ----------------------------- Shared ----------------------------- */

function IconBtn({ children, label, onClick, danger }: { children: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-full text-background transition-colors ${
        danger ? "bg-destructive hover:bg-destructive/80" : "bg-heart hover:bg-heart/80"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyArchive({ label }: { label: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
      No archived {label}. Deleted {label} land here so you can restore them.
    </div>
  );
}
