import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Hand, Repeat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPasswordGate } from "@/components/AdminPasswordGate";
import { useAuth } from "@/hooks/use-auth";

export type VotwMode = "weekly" | "date" | "manual";

type Schedule = { id: string; mode: VotwMode; next_change_at: string | null };

/** Next Friday 00:00 UTC, strictly in the future. */
export function nextFridayUtc(from = new Date()): Date {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const delta = (5 - d.getUTCDay() + 7) % 7;
  d.setUTCDate(d.getUTCDate() + (delta === 0 ? 7 : delta));
  return d;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    weekday: "long", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  }) + " UTC";

/** "in 2 days, 4 hrs" style countdown. */
function countdown(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "due now";
  const mins = Math.floor(ms / 60000);
  const days = Math.floor(mins / 1440);
  const hrs = Math.floor((mins % 1440) / 60);
  if (days > 0) return `in ${days}d ${hrs}h`;
  if (hrs > 0) return `in ${hrs}h ${mins % 60}m`;
  return `in ${mins}m`;
}

/** Convert an ISO timestamp to the value a datetime-local input expects (UTC wall clock). */
const toLocalInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

const chip = (on: boolean) =>
  `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
    on ? "border-heart bg-heart/10 text-heart" : "border-border text-muted-foreground hover:border-heart/40"
  }`;

export function VotwSchedule({ poolEmpty }: { poolEmpty: boolean }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [pending, setPending] = useState<{ mode: VotwMode; next_change_at: string | null } | null>(null);
  const [dateInput, setDateInput] = useState("");
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const { data: schedule } = useQuery({
    queryKey: ["votw-schedule"],
    queryFn: async (): Promise<Schedule | null> => {
      const { data, error } = await supabase
        .from("votw_schedule")
        .select("id,mode,next_change_at")
        .maybeSingle();
      if (error) throw error;
      return (data as Schedule) ?? null;
    },
  });

  useEffect(() => {
    if (schedule?.mode === "date") setDateInput(toLocalInput(schedule.next_change_at));
  }, [schedule?.mode, schedule?.next_change_at]);

  const save = useMutation({
    mutationFn: async (next: { mode: VotwMode; next_change_at: string | null }) => {
      if (!schedule) throw new Error("Schedule row is missing.");
      const { error } = await supabase
        .from("votw_schedule")
        .update({ mode: next.mode, next_change_at: next.next_change_at })
        .eq("id", schedule.id);
      if (error) throw error;
    },
    onError: (e: Error) => setError(e.message),
    onSuccess: () => { setError(null); qc.invalidateQueries({ queryKey: ["votw-schedule"] }); },
  });

  const request = (next: { mode: VotwMode; next_change_at: string | null }) => {
    setError(null);
    setPending(next);
    setGateOpen(true);
  };

  const mode = schedule?.mode ?? "weekly";

  const summary = useMemo(() => {
    if (!schedule) return "Loading…";
    if (schedule.mode === "manual") return "Manual — the verse only changes when you click Set next verse.";
    if (!schedule.next_change_at) return "No change scheduled yet.";
    return `${fmt(schedule.next_change_at)} · ${countdown(schedule.next_change_at)}`;
  }, [schedule]);

  return (
    <section className="rounded-3xl border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-muted-foreground">Next change</p>
          <p className="mt-1 font-display text-lg">{summary}</p>
          {mode === "date" && schedule?.next_change_at && (
            <p className="mt-1 text-xs text-muted-foreground">
              After this one-off change the schedule falls back to Manual.
            </p>
          )}
          {mode !== "manual" && poolEmpty && (
            <p className="mt-2 text-xs font-semibold text-destructive">
              The pool is empty — nothing will rotate until you add a verse.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={chip(mode === "weekly")}
            onClick={() => request({ mode: "weekly", next_change_at: nextFridayUtc().toISOString() })}
          >
            <Repeat className="h-3.5 w-3.5" /> Every Friday
          </button>
          <button
            type="button"
            className={chip(mode === "date")}
            onClick={() => {
              if (mode !== "date") { setDateInput(toLocalInput(nextFridayUtc().toISOString())); }
              setError(null);
              qc.setQueryData(["votw-schedule"], (s: Schedule | null) => (s ? { ...s, mode: "date" as VotwMode } : s));
            }}
          >
            <CalendarClock className="h-3.5 w-3.5" /> Set your own date
          </button>
          <button
            type="button"
            className={chip(mode === "manual")}
            onClick={() => request({ mode: "manual", next_change_at: null })}
          >
            <Hand className="h-3.5 w-3.5" /> Manual
          </button>
        </div>
      </div>

      {mode === "date" && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="datetime-local"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <span className="text-xs text-muted-foreground">Times are UTC</span>
          <button
            type="button"
            disabled={!dateInput || save.isPending}
            className="btn-primary text-sm disabled:opacity-50"
            onClick={() => request({ mode: "date", next_change_at: new Date(`${dateInput}:00Z`).toISOString() })}
          >
            {save.isPending ? "Saving…" : "Save date"}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
      )}

      <AdminPasswordGate
        open={gateOpen}
        onOpenChange={setGateOpen}
        email={user?.email ?? ""}
        onVerified={() => {
          setGateOpen(false);
          if (pending) save.mutate(pending);
          setPending(null);
        }}
      />
    </section>
  );
}
