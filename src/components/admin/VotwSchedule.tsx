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

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";

const isoDatePart = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");
const isoTimePart = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(11, 16) : "");

const chip = (on: boolean) =>
  `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
    on ? "border-heart bg-heart/10 text-heart" : "border-border text-muted-foreground hover:border-heart/40"
  }`;

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function Countdown({ target, now }: { target: string | null; now: number }) {
  if (!target) {
    return <p className="font-display text-2xl text-muted-foreground">No change scheduled</p>;
  }
  const ms = Math.max(0, new Date(target).getTime() - now);
  const total = Math.floor(ms / 1000);
  const parts = [
    { v: Math.floor(total / 86400), l: "Days" },
    { v: Math.floor((total % 86400) / 3600), l: "Hours" },
    { v: Math.floor((total % 3600) / 60), l: "Minutes" },
    { v: total % 60, l: "Seconds" },
  ];
  return (
    <div className="flex flex-wrap items-end gap-6">
      {parts.map((p) => (
        <div key={p.l} className="text-center">
          <div
            className="font-display text-4xl leading-none tabular-nums md:text-5xl"
            style={{ color: "var(--heart)" }}
          >
            {String(p.v).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{p.l}</div>
        </div>
      ))}
    </div>
  );
}

export function VotwSchedule({ poolEmpty }: { poolEmpty: boolean }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const now = useNow();
  const [error, setError] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [pending, setPending] = useState<{ mode: VotwMode; next_change_at: string | null } | null>(null);
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");

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
    if (schedule?.mode === "date") {
      setDateInput(isoDatePart(schedule.next_change_at));
      setTimeInput(isoTimePart(schedule.next_change_at));
    }
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
  const editingDate = mode === "date";

  const saveDate = () => {
    if (!dateInput || !timeInput) return;
    request({ mode: "date", next_change_at: new Date(`${dateInput}T${timeInput}:00Z`).toISOString() });
  };

  const target = useMemo(() => {
    if (!schedule) return null;
    if (schedule.mode === "manual") return null;
    return schedule.next_change_at;
  }, [schedule]);

  return (
    <section className="rounded-3xl border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="eyebrow text-muted-foreground">Next change</p>
          {mode === "manual" ? (
            <p className="font-display text-lg">Manual — only changes when you click Set next verse.</p>
          ) : editingDate ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm"
              />
              <input
                type="time"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm"
              />
              <span className="text-xs text-muted-foreground">UTC</span>
              <button
                type="button"
                disabled={!dateInput || !timeInput || save.isPending}
                className="btn-primary text-xs disabled:opacity-50"
                onClick={saveDate}
              >
                {save.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          ) : schedule?.next_change_at ? (
            <div className="flex flex-wrap items-baseline gap-4">
              <span className="font-display text-lg">{fmtDate(schedule.next_change_at)}</span>
              <span className="font-display text-lg text-muted-foreground">{fmtTime(schedule.next_change_at)}</span>
            </div>
          ) : (
            <span className="font-display text-lg text-muted-foreground">Not scheduled</span>
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
              if (mode !== "date") {
                const base = schedule?.next_change_at ?? nextFridayUtc().toISOString();
                setDateInput(isoDatePart(base));
                setTimeInput(isoTimePart(base));
              }
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

      {mode === "date" && schedule?.next_change_at && (
        <p className="mt-2 text-xs text-muted-foreground">
          After this one-off change the schedule falls back to Manual.
        </p>
      )}
      {mode !== "manual" && poolEmpty && (
        <p className="mt-2 text-xs font-semibold text-destructive">
          The pool is empty — nothing will rotate until you add a verse.
        </p>
      )}

      <hr className="my-6 border-border" />

      <Countdown target={target} now={now} />

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
