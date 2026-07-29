import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Trash2, Archive as ArchiveIcon, Eye, EyeOff, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PILLARS, type Pillar } from "@/lib/content";
import { AdminPasswordGate } from "@/components/AdminPasswordGate";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/archive")({
  head: () => ({ meta: [{ title: "Archive — Admin" }, { name: "robots", content: "noindex" }] }),
  component: ArchivePage,
});

type Category = "articles" | "testimonials" | "pages" | "pillars" | "votw";
const CATEGORIES: { id: Category; label: string }[] = [
  { id: "articles", label: "Articles" },
  { id: "testimonials", label: "Testimonials" },
  { id: "pages", label: "Pages" },
  { id: "pillars", label: "Pillars" },
  { id: "votw", label: "Verse of the Week" },
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
      {active === "testimonials" && <TestimonialsArchive />}
      {active === "pages" && <PagesArchive />}
      {active === "pillars" && <PillarsArchive />}
      {active === "votw" && <VotwArchive />}
    </div>
  );
}

/* ---------------------------- Pillars ---------------------------- */

type PillarArchiveRow = {
  slug: string; label: string; short_label: string; arabic_letter: string;
  tint: string; description: string; archived_at: string;
};

function PillarsArchive() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery({
    queryKey: ["archive-pillars"],
    queryFn: async (): Promise<PillarArchiveRow[]> => {
      const { data, error } = await supabase
        .from("pillars")
        .select("slug,label,short_label,arabic_letter,tint,description,archived_at")
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PillarArchiveRow[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["archive-pillars"] });
    qc.invalidateQueries({ queryKey: ["admin", "pillars"] });
    qc.invalidateQueries({ queryKey: ["admin", "pillars", "archived"] });
    qc.invalidateQueries({ queryKey: ["cms"] });
    qc.invalidateQueries({ queryKey: ["cms", "pillars"] });
    qc.invalidateQueries({ queryKey: ["archive-pages"] });
    qc.invalidateQueries({ queryKey: ["archive-pages-active-pillars"] });
  };
  const restore = useMutation({
    mutationFn: async (slug: string) => {
      const { error } = await supabase.from("pillars").update({ archived_at: null }).eq("slug", slug);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const purge = useMutation({
    mutationFn: async (slug: string) => {
      const { error } = await supabase.from("pillars").delete().eq("slug", slug);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const [gateOpen, setGateOpen] = useState(false);
  const [pending, setPending] = useState<{ kind: "restore" | "purge"; slug: string } | null>(null);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (data.length === 0) return <EmptyArchive label="pillars" />;

  return (
    <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((p) => (
        <div key={p.slug} className="flex flex-col self-start rounded-2xl border border-border bg-card p-4 opacity-90">
          <div className="flex items-start gap-3">
            <span
              className="grid h-10 w-10 flex-none place-items-center rounded-full font-arabic text-lg"
              style={{ background: `color-mix(in oklab, var(--${p.tint}) 18%, transparent)`, color: `var(--${p.tint})` }}
            >
              {p.arabic_letter}
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-bold leading-tight">{p.label}</h3>
              <p className="font-mono text-[11px] text-muted-foreground">/{p.slug}</p>
            </div>
          </div>
          <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <ArchiveIcon className="h-3.5 w-3.5" /> Archived
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setPending({ kind: "restore", slug: p.slug }); setGateOpen(true); }}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold hover:bg-secondary"
              >
                <RotateCcw className="h-3 w-3" /> Restore
              </button>
              <button
                onClick={() => { if (confirm(`Permanently delete pillar "${p.label}"? This cannot be undone and will also delete its page.`)) { setPending({ kind: "purge", slug: p.slug }); setGateOpen(true); } }}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" /> Delete forever
              </button>
            </div>
          </div>
        </div>
      ))}
      <AdminPasswordGate
        open={gateOpen}
        onOpenChange={(o) => { setGateOpen(o); if (!o) setPending(null); }}
        email={user?.email ?? ""}
        onVerified={() => {
          setGateOpen(false);
          if (!pending) return;
          if (pending.kind === "restore") restore.mutate(pending.slug);
          if (pending.kind === "purge") purge.mutate(pending.slug);
          setPending(null);
        }}
      />
    </div>
  );
}

/* --------------------------- Articles --------------------------- */

type ArticleRow = {
  id: string; slug: string; title: string; pillar: string;
  published: boolean; archived_at: string;
};

function ArticlesArchive() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["archive-articles"],
    queryFn: async (): Promise<ArticleRow[]> => {
      const { data, error } = await supabase
        .from("articles")
        .select("id,slug,title,pillar,published,archived_at")
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

/* -------------------------- Verse of the Week (read-only log) -------------------------- */

type PastVerse = {
  id: string; arabic: string; translation: string; reference: string;
  day_start: string | null; day_end: string | null;
};

const fmtDay = (v: string | null) =>
  v ? new Date(v).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

function VotwArchive() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["archive-votw"],
    queryFn: async (): Promise<PastVerse[]> => {
      const { data, error } = await supabase
        .from("ayahs")
        .select("id,arabic,translation,reference,day_start,day_end")
        .eq("status", "used")
        .order("day_end", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as PastVerse[];
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (data.length === 0)
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        No verses have finished their week yet.
      </div>
    );

  return (
    <div className="grid items-start gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((r) => (
        <div key={r.id} className="flex flex-col self-start rounded-2xl border border-border bg-card p-4">
          <p className="font-arabic text-lg leading-relaxed" dir="rtl">{r.arabic}</p>
          <p className="mt-2 text-sm italic line-clamp-4">"{r.translation}"</p>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">— {r.reference}</p>
          <p className="mt-3 inline-flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {fmtDay(r.day_start)} → {fmtDay(r.day_end)}
          </p>
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
  // Active (non-archived) pillar slugs — used to lock restore of pillar pages
  const { data: activePillarSlugs = new Set<string>() } = useQuery({
    queryKey: ["archive-pages-active-pillars"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pillars").select("slug").is("archived_at", null);
      if (error) throw error;
      return new Set<string>(((data ?? []) as { slug: string }[]).map((r) => r.slug));
    },
  });

  const [gateOpen, setGateOpen] = useState(false);
  const [pending, setPending] = useState<{ kind: "restore" | "purge"; key: string; title: string } | null>(null);
  const [pillarLocked, setPillarLocked] = useState<{ title: string; slug: string } | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["archive-pages"] });
    qc.invalidateQueries({ queryKey: ["archive-pages-active-slugs"] });
    qc.invalidateQueries({ queryKey: ["archive-pages-active-pillars"] });
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
          {data.map((r) => {
            const pillarSlug = r.key.startsWith("pillar:") ? r.key.slice("pillar:".length) : null;
            const locked = pillarSlug !== null && !activePillarSlugs.has(pillarSlug);
            return (
              <PageArchiveTile
                key={r.key}
                row={r}
                restoreLocked={locked}
                onRestore={() => {
                  if (locked) {
                    setPillarLocked({ title: r.title || r.slug, slug: pillarSlug! });
                    return;
                  }
                  setPending({ kind: "restore", key: r.key, title: r.title || r.slug });
                  setGateOpen(true);
                }}
                onPurge={() => { if (confirm(`Permanently delete "${r.title || r.slug}"? This cannot be undone.`)) { setPending({ kind: "purge", key: r.key, title: r.title || r.slug }); setGateOpen(true); } }}
              />
            );
          })}
        </div>
      )}
      <AdminPasswordGate
        open={gateOpen}
        onOpenChange={(o) => { setGateOpen(o); if (!o) setPending(null); }}
        email={user?.email ?? ""}
        onVerified={onVerified}
      />
      {pillarLocked && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setPillarLocked(null)}>
          <div className="max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Pillar is archived</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{pillarLocked.title}</span> is linked to
              the pillar <span className="font-mono">/{pillarLocked.slug}</span>, which is currently
              archived. Restore the pillar from the Pillars admin — its page will come back automatically.
            </p>
            <div className="mt-4 flex justify-end">
              <button className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold hover:bg-secondary" onClick={() => setPillarLocked(null)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PageArchiveTile({ row, onRestore, onPurge, restoreLocked }: { row: PageRow; onRestore: () => void; onPurge: () => void; restoreLocked?: boolean }) {
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
          title={restoreLocked ? "Linked pillar is archived — restore the pillar first" : "Restore"}
          className={`inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold ${
            restoreLocked ? "cursor-not-allowed opacity-50" : "hover:bg-secondary"
          }`}
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
