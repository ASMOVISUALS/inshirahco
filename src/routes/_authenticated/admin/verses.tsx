import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Trash2, Plus, Pencil, Shuffle, LayoutGrid, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { QuranFetcher } from "@/components/QuranFetcher";
import { AdminPasswordGate } from "@/components/AdminPasswordGate";
import { useAuth } from "@/hooks/use-auth";


const chipCls = (on: boolean) =>
  `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
    on ? "border-heart bg-heart/10 text-heart" : "border-border text-muted-foreground hover:border-heart/40"
  }`;
import { SortBar } from "@/components/admin/SortBar";
import { surahsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin/verses")({
  head: () => ({ meta: [{ title: "Verse of the Week — Admin" }, { name: "robots", content: "noindex" }] }),
  component: VersesAdmin,
});

type Draft = { arabic: string; translation: string; reference: string; surah_number: number | null; ayah_number: number | null };
type Row = {
  id: string; arabic: string; translation: string; reference: string;
  sort_order: number; active: boolean; archived_at: string | null;
  surah_id: string | null; ayah_number: number | null;
  status: VerseStatus; created_at: string; queue_order: number | null;
};

export type VerseStatus = "pool" | "current" | "used";

const STATUSES: { value: VerseStatus; label: string; hint: string }[] = [
  { value: "pool", label: "In pool", hint: "Can be picked for a coming week" },
  { value: "current", label: "This week", hint: "Currently the verse of the week" },
  { value: "used", label: "Used", hint: "Already had its week" },
];

type SortKey = "release" | "chronology" | "added";

const emptyDraft: Draft = { arabic: "", translation: "", reference: "", surah_number: null, ayah_number: null };


function VersesAdmin() {
  const qc = useQueryClient();
  const { data: surahs = [] } = useQuery(surahsQuery());

  const { data = [] } = useQuery({
    queryKey: ["admin-ayahs"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("ayahs")
        .select("id,arabic,translation,reference,sort_order,active,archived_at,surah_id,ayah_number,status,created_at,queue_order")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const [statusFilter, setStatusFilter] = useState<VerseStatus>("current");
  const [sort, setSort] = useState<SortKey>("release");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [localIds, setLocalIds] = useState<string[] | null>(null);
  const { user } = useAuth();

  const currentVerse = useMemo(
    () => data.find((r) => r.status === "current") ?? null,
    [data],
  );

  const surahIdByNumber = useMemo(
    () => new Map(surahs.map((s) => [s.number, s.id] as const)),
    [surahs],
  );
  const surahNumberById = useMemo(
    () => new Map(surahs.map((s) => [s.id, s.number] as const)),
    [surahs],
  );

  const counts = useMemo(() => ({
    current: data.filter((r) => r.status === "current").length,
    pool: data.filter((r) => r.status === "pool").length,
    used: data.filter((r) => r.status === "used").length,
  }), [data]);

  const byRelease = (a: Row, b: Row) =>
    (a.queue_order ?? 1e9) - (b.queue_order ?? 1e9) || a.created_at.localeCompare(b.created_at);

  const rows = useMemo(() => {
    if (statusFilter === "current") return [];
    const list = data.filter((r) => r.status === statusFilter);
    if (sort === "added") {
      list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else if (sort === "chronology") {
      list.sort((a, b) => {
        const sa = a.surah_id ? surahNumberById.get(a.surah_id) ?? 999 : 999;
        const sb = b.surah_id ? surahNumberById.get(b.surah_id) ?? 999 : 999;
        return sa - sb || (a.ayah_number ?? 0) - (b.ayah_number ?? 0);
      });
    } else {
      list.sort(byRelease);
    }
    return list;
  }, [data, sort, surahNumberById, statusFilter]);

  const reorderable = statusFilter === "pool" && sort === "release";

  /** Rows actually rendered — during a drag we show the optimistic local order. */
  const displayRows = useMemo(() => {
    if (!reorderable || !localIds) return rows;
    const map = new Map(rows.map((r) => [r.id, r] as const));
    const ordered = localIds.map((id) => map.get(id)).filter(Boolean) as Row[];
    const extras = rows.filter((r) => !localIds.includes(r.id));
    return [...ordered, ...extras];
  }, [rows, localIds, reorderable]);

  const saveOrder = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id, i) => supabase.from("ayahs").update({ queue_order: i + 1 }).eq("id", id)),
      );
    },
    onError: (e: Error) => setError(e.message),
    onSuccess: () => { setError(null); invalidate(); },
  });

  const moveTo = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const ids = displayRows.map((r) => r.id);
    const from = ids.indexOf(fromId);
    const to = ids.indexOf(toId);
    if (from < 0 || to < 0) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    setLocalIds(ids);
    saveOrder.mutate(ids);
  };

  const nudge = (id: string, delta: number) => {
    const ids = displayRows.map((r) => r.id);
    const from = ids.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= ids.length) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    setLocalIds(ids);
    saveOrder.mutate(ids);
  };

  const rollVerse = useMutation({
    mutationFn: async () => {
      const pool = data.filter((r) => r.status === "pool").sort(byRelease);
      if (pool.length === 0) throw new Error("No verses left in the pool. Add or reset some verses first.");
      const pick = pool[0];
      const { error: retire } = await supabase
        .from("ayahs").update({ status: "used" }).eq("status", "current");
      if (retire) throw retire;
      const { error } = await supabase
        .from("ayahs").update({ status: "current", active: true }).eq("id", pick.id);
      if (error) throw error;
    },
    onError: (e: Error) => setError(e.message),
    onSuccess: () => { setError(null); setLocalIds(null); invalidate(); },
  });



  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-ayahs"] });
    qc.invalidateQueries({ queryKey: ["ayahs"] });
    qc.invalidateQueries({ queryKey: ["votw"] });
  };

  /** Duplicate guard — the same surah/ayah may only ever exist once. */



  const resolve = (d: Draft) => {
    if (!d.surah_number || !d.ayah_number) throw new Error("Pick a surah and ayah number first.");
    const surah_id = surahIdByNumber.get(d.surah_number);
    if (!surah_id) throw new Error("Unknown surah.");
    const surah = surahs.find((s) => s.id === surah_id)!;
    if (d.ayah_number < 1 || d.ayah_number > surah.verse_count)
      throw new Error(`${surah.name_en} has ${surah.verse_count} ayahs.`);
    return { surah_id, surah };
  };

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      // Duplicates are allowed — a past verse can be added again as a fresh pool item.

      const { surah_id, surah } = resolve(d);
      const { error } = await supabase.from("ayahs").insert({
        arabic: d.arabic,
        translation: d.translation,
        reference: d.reference || `${surah.name_en} ${surah.number}:${d.ayah_number}`,
        surah_id,
        ayah_number: d.ayah_number,
        active: true,
        status: "pool",
        sort_order: data.length,
        queue_order: Math.max(0, ...data.map((r) => r.queue_order ?? 0)) + 1,
      });
      if (error) throw new Error(error.code === "23505" ? "This ayah already exists." : error.message);
    },
    onMutate: () => setError(null),
    onError: (e: Error) => setError(e.message),
    onSuccess: () => { setDraft(null); invalidate(); },
  });

  const update = useMutation({
    mutationFn: async ({ id, d }: { id: string; d: Draft }) => {
      const dup = null;

      const { surah_id, surah } = resolve(d);
      const { error } = await supabase.from("ayahs").update({
        arabic: d.arabic,
        translation: d.translation,
        reference: d.reference || `${surah.name_en} ${surah.number}:${d.ayah_number}`,
        surah_id,
        ayah_number: d.ayah_number,
      }).eq("id", id);
      if (error) throw new Error(error.code === "23505" ? "This ayah already exists." : error.message);
    },
    onMutate: () => setError(null),
    onError: (e: Error) => setError(e.message),
    onSuccess: () => { setEditingId(null); setEditDraft(null); invalidate(); },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: VerseStatus }) => {
      // Only one verse can hold "this week" at a time.
      if (status === "current") {
        const { error: clearErr } = await supabase
          .from("ayahs").update({ status: "used" }).eq("status", "current").neq("id", id);
        if (clearErr) throw clearErr;
      }
      const { error } = await supabase
        .from("ayahs")
        .update({ status, active: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });


  const purge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ayahs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { setSelectedId(null); invalidate(); },
  });

  const beginEdit = (r: Row) => {
    setEditingId(r.id);
    setEditDraft({
      arabic: r.arabic,
      translation: r.translation,
      reference: r.reference,
      surah_number: r.surah_id ? surahNumberById.get(r.surah_id) ?? null : null,
      ayah_number: r.ayah_number,
    });
    setSelectedId(null);
  };

  return (
    <div className="grid gap-6" onClick={() => setSelectedId(null)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-display">Verse of the Week</h2>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setStatusFilter("current")}
              className={chipCls(statusFilter === "current")}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Active
              <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px]">{counts.current}</span>
            </button>
            <button
              type="button"
              onClick={() => { setStatusFilter("pool"); setSort("release"); setLocalIds(null); }}
              className={chipCls(statusFilter === "pool")}
            >
              In pool
              <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px]">{counts.pool}</span>
            </button>
            <button
              type="button"
              onClick={() => { setStatusFilter("used"); setSort("added"); setLocalIds(null); }}
              className={chipCls(statusFilter === "used")}
            >
              Used
              <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px]">{counts.used}</span>
            </button>
          </div>
          {statusFilter !== "current" && (
            <div onClick={(e) => e.stopPropagation()}>
              <SortBar
                value={sort}
                onChange={(v) => { setSort(v); setLocalIds(null); }}
                options={
                  statusFilter === "pool"
                    ? [
                        { value: "release" as SortKey, label: "Order of release" },
                        { value: "chronology" as SortKey, label: "Order in the Qur'an" },
                        { value: "added" as SortKey, label: "Date added (newest)" },
                      ]
                    : [
                        { value: "added" as SortKey, label: "Date added (newest)" },
                        { value: "chronology" as SortKey, label: "Order in the Qur'an" },
                      ]
                }
              />
            </div>
          )}

        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => { setError(null); if (!draft) setDraft(emptyDraft); }}
            disabled={!!draft}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add verse
          </button>
          <button
            type="button"
            onClick={() => { setError(null); setGateOpen(true); }}
            disabled={rollVerse.isPending}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            style={{
              background: "color-mix(in oklab, var(--tazkiyah) 80%, black)",
              boxShadow: "0 6px 20px -8px color-mix(in oklab, var(--tazkiyah) 60%, transparent)",
            }}
          >
            <Shuffle className="h-4 w-4" /> {rollVerse.isPending ? "Setting…" : "Set next verse"}
          </button>
        </div>

      </div>

      {statusFilter === "current" && currentVerse && (
        <section
          className="rounded-3xl border p-8 text-center md:p-10"
          style={{
            background: "color-mix(in oklab, var(--heart) 8%, var(--paper-warm, transparent))",
            borderColor: "color-mix(in oklab, var(--heart) 30%, transparent)",
          }}
        >
          <p className="eyebrow" style={{ color: "var(--heart)" }}>This week's verse</p>
          <p className="font-arabic mx-auto mt-5 max-w-2xl text-3xl leading-loose md:text-4xl" dir="rtl" style={{ color: "var(--ink)" }}>
            {currentVerse.arabic}
          </p>
          <p className="mx-auto mt-5 max-w-lg font-display text-xl italic" style={{ fontVariationSettings: '"SOFT" 80, "WONK" 1' }}>
            "{currentVerse.translation}"
          </p>
          <p className="mt-3 text-sm font-semibold text-muted-foreground">— {currentVerse.reference}</p>
        </section>
      )}

      <AdminPasswordGate
        open={gateOpen}
        onOpenChange={setGateOpen}
        email={user?.email ?? ""}
        onVerified={() => { setGateOpen(false); rollVerse.mutate(); }}
      />

      {error && <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>}

      {statusFilter === "pool" && (
        <p className="text-xs text-muted-foreground">
          {reorderable
            ? "Drag a tile by its handle to set the release order — position 1 goes out next. Focus a handle and use ↑ / ↓ to move it."
            : "Switch “Sort by” to “Order of release” to drag tiles into the order they'll be released."}
        </p>
      )}

      <div className="grid items-start gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {draft && (
          <EditorCard
            value={draft}
            surahs={surahs}
            onChange={setDraft}
            onCancel={() => { setDraft(null); setError(null); }}
            onSave={() => save.mutate(draft)}
            saving={save.isPending}
            saveLabel={save.isPending ? "Saving…" : "Save"}
          />
        )}

        {displayRows.map((r, i) => {
          if (editingId === r.id && editDraft) {
            return (
              <EditorCard
                key={r.id}
                value={editDraft}
                surahs={surahs}
                onChange={setEditDraft}
                onCancel={() => { setEditingId(null); setEditDraft(null); setError(null); }}
                onSave={() => update.mutate({ id: r.id, d: editDraft })}
                saving={update.isPending}
                saveLabel={update.isPending ? "Saving…" : "Save changes"}
              />
            );
          }
          const selected = selectedId === r.id;
          return (
            <div
              key={r.id}
              onClick={(e) => { e.stopPropagation(); setSelectedId(selected ? null : r.id); }}
              onDragOver={reorderable ? (e) => { e.preventDefault(); } : undefined}
              onDrop={reorderable ? (e) => { e.preventDefault(); if (dragId) moveTo(dragId, r.id); setDragId(null); } : undefined}
              className={
                "group relative flex flex-col self-start rounded-2xl border p-4 cursor-pointer transition-all " +
                (selected ? "border-heart bg-heart/10 shadow-md" : "border-border bg-card hover:border-heart/40") +
                (dragId === r.id ? " opacity-50" : "")
              }
            >
              {reorderable && (
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                    style={{
                      borderColor: "color-mix(in oklab, var(--heart) 35%, transparent)",
                      color: "var(--heart)",
                      background: "color-mix(in oklab, var(--heart) 8%, transparent)",
                    }}
                  >
                    {i + 1}{i === 0 ? " · Next up" : ""}
                  </span>
                  <button
                    type="button"
                    aria-label={`Reorder ${r.reference}. Use arrow up and arrow down to move.`}
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); setDragId(r.id); }}
                    onDragEnd={() => setDragId(null)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowUp") { e.preventDefault(); nudge(r.id, -1); }
                      if (e.key === "ArrowDown") { e.preventDefault(); nudge(r.id, 1); }
                    }}
                    className="cursor-grab rounded-md p-1 text-muted-foreground transition-colors hover:text-heart focus:outline-none focus-visible:ring-2 focus-visible:ring-heart active:cursor-grabbing"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                </div>
              )}
              <p className="font-arabic text-lg leading-relaxed" dir="rtl">{r.arabic}</p>
              <p className="mt-2 text-sm italic line-clamp-4">"{r.translation}"</p>
              <p className="mt-2 text-xs text-muted-foreground">— {r.reference}</p>
              <span className="mt-2 inline-flex w-fit rounded-full border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {STATUSES.find((s) => s.value === r.status)?.label ?? r.status}
              </span>
              {!r.surah_id && <p className="mt-1 text-xs text-destructive">Not linked to a surah — edit to fix.</p>}

              {selected && (
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-heart/20 pt-3">
                  <StatusSlider
                    value={r.status}
                    onChange={(status) => setStatus.mutate({ id: r.id, status })}
                  />
                  <div className="flex items-center gap-2">
                    <IconBtn label="Edit verse" onClick={(e) => { e.stopPropagation(); beginEdit(r); }}>
                      <Pencil className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Delete verse" danger onClick={(e) => { e.stopPropagation(); if (confirm("Permanently delete this verse?")) purge.mutate(r.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {displayRows.length === 0 && !draft && (
          <p className="col-span-full text-sm text-muted-foreground">
            {statusFilter === "current" ? "No verse is set for this week yet." : statusFilter === "pool" ? "No verses in the pool." : "No used verses yet."}
          </p>
        )}
      </div>

    </div>
  );
}

function StatusSlider({ value, onChange }: { value: VerseStatus; onChange: (v: VerseStatus) => void }) {
  const index = Math.max(0, STATUSES.findIndex((s) => s.value === value));
  return (
    <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
      <input
        type="range"
        min={0}
        max={STATUSES.length - 1}
        step={1}
        value={index}
        aria-label="Verse status"
        onChange={(e) => onChange(STATUSES[Number(e.target.value)].value)}
        className="h-1.5 w-28 cursor-pointer appearance-none rounded-full bg-muted accent-heart"
      />
      <span className="text-[11px] font-semibold" title={STATUSES[index].hint}>{STATUSES[index].label}</span>
    </div>
  );
}

function IconBtn({ children, label, onClick, danger }: { children: React.ReactNode; label: string; onClick: (e: React.MouseEvent) => void; danger?: boolean }) {
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

type Surah = { id: string; number: number; name_en: string; name_ar: string; verse_count: number };

function EditorCard({
  value, surahs, onChange, onCancel, onSave, saving, saveLabel,
}: {
  value: Draft;
  surahs: Surah[];
  onChange: (d: Draft) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  saveLabel: string;
}) {
  const surah = surahs.find((s) => s.number === value.surah_number);
  const complete = !!value.arabic && !!value.translation && !!value.surah_number && !!value.ayah_number;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex flex-col self-start rounded-2xl border border-heart bg-heart/5 p-4 shadow-md"
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col text-xs text-muted-foreground">
          Surah
          <select
            value={value.surah_number ?? ""}
            onChange={(e) => onChange({ ...value, surah_number: e.target.value ? Number(e.target.value) : null })}
            className="mt-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-heart"
          >
            <option value="">Select…</option>
            {surahs.map((s) => (
              <option key={s.id} value={s.number}>{s.number}. {s.name_en} — {s.name_ar}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs text-muted-foreground">
          Ayah {surah ? `(1–${surah.verse_count})` : ""}
          <input
            inputMode="numeric"
            value={value.ayah_number ?? ""}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D+/g, "");
              onChange({ ...value, ayah_number: digits ? Number(digits) : null });
            }}
            className="mt-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-heart"
          />
        </label>
      </div>

      <textarea
        dir="rtl"
        placeholder="العربية"
        value={value.arabic}
        onChange={(e) => onChange({ ...value, arabic: e.target.value })}
        className="mt-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 font-arabic text-lg outline-none focus:border-heart"
        rows={3}
      />
      <textarea
        placeholder="Translation"
        value={value.translation}
        onChange={(e) => onChange({ ...value, translation: e.target.value })}
        className="mt-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm italic outline-none focus:border-heart"
        rows={3}
      />
      <input
        placeholder="Reference (auto if left blank)"
        value={value.reference}
        onChange={(e) => onChange({ ...value, reference: e.target.value })}
        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground outline-none focus:border-heart"
      />

      <div className="mt-3 border-t border-heart/20 pt-3">
        <QuranFetcher
          compact
          onFetched={(a, meta) =>
            onChange({
              arabic: a.arabic,
              translation: a.translation,
              reference: a.reference,
              surah_number: meta.surah,
              ayah_number: meta.ayah,
            })
          }
        />
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary">Cancel</button>
        <button type="button" disabled={saving || !complete} onClick={onSave} className="btn-primary text-sm disabled:opacity-50">{saveLabel}</button>
      </div>
    </div>
  );
}
