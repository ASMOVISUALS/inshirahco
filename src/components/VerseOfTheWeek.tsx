import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { ayahsQuery, myReflectionsQuery } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

/** Verse of the week — rotates weekly and invites signed-in members to reflect. */
export function VerseOfTheWeek() {
  const { data = [] } = useQuery(ayahsQuery());
  const [open, setOpen] = useState(false);

  const verse = useMemo(() => {
    if (data.length === 0) return null;
    const week = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));
    return data[week % data.length];
  }, [data]);

  if (!verse) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Verse of the week — write a reflection"
        className="block w-full cursor-pointer rounded-3xl border p-8 text-center transition-transform hover:-translate-y-0.5 md:p-10"
        style={{
          background: "color-mix(in oklab, var(--tazkiyah-soft) 40%, var(--paper-warm))",
          borderColor: "color-mix(in oklab, var(--tazkiyah) 25%, transparent)",
        }}
      >
        <p className="eyebrow" style={{ color: "var(--tazkiyah)" }}>Verse of the week</p>
        <p className="font-arabic mx-auto mt-6 max-w-2xl text-3xl leading-loose md:text-4xl" style={{ color: "var(--ink)" }} dir="rtl">
          {verse.arabic}
        </p>
        <p className="mx-auto mt-6 max-w-lg font-display text-xl italic" style={{ fontVariationSettings: '"SOFT" 80, "WONK" 1' }}>
          "{verse.translation}"
        </p>
        <p className="mt-3 text-sm font-semibold text-muted-foreground">— {verse.reference}</p>
        <p className="mt-6 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--heart)" }}>
          Tap to write your reflection
        </p>
      </button>

      {open && <ReflectionDialog ayahId={verse.id} reference={verse.reference} arabic={verse.arabic} onClose={() => setOpen(false)} />}
    </>
  );
}

function ReflectionDialog({
  ayahId, reference, arabic, onClose,
}: { ayahId: string; reference: string; arabic: string; onClose: () => void }) {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const { data: mine = [] } = useQuery(myReflectionsQuery(user?.id ?? null, ayahId));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in required.");
      const { error } = await supabase.from("reflections").insert({ user_id: user.id, ayah_id: ayahId, body: body.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["my-reflections"] });
    },
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label="Write a reflection">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-xl md:p-8"
      >
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full hover:bg-secondary">
          <X className="h-4 w-4" />
        </button>

        <p className="eyebrow" style={{ color: "var(--tazkiyah)" }}>Your reflection</p>
        <p className="font-arabic mt-4 text-2xl leading-loose" dir="rtl">{arabic}</p>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">— {reference}</p>

        {loading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
        ) : !user ? (
          <div className="mt-6 rounded-2xl border border-border p-5 text-sm">
            <p>Sign in to write and save your reflection on this verse.</p>
            <Link to="/auth" className="btn-primary mt-4 inline-flex">Sign in</Link>
          </div>
        ) : (
          <>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              maxLength={5000}
              placeholder="What does this ayah open up for you?"
              className="mt-6 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-heart"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">{body.trim().length}/5000</span>
              <button
                type="button"
                disabled={!body.trim() || submit.isPending}
                onClick={() => submit.mutate()}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {submit.isPending ? "Saving…" : "Save reflection"}
              </button>
            </div>
            {submit.isError && <p className="mt-2 text-xs text-destructive">Could not save your reflection. Please try again.</p>}

            {mine.length > 0 && (
              <div className="mt-8 border-t border-border pt-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your past reflections</p>
                <ul className="mt-4 grid gap-3">
                  {mine.map((r) => (
                    <li key={r.id} className="rounded-2xl border border-border p-4">
                      <p className="whitespace-pre-wrap text-sm">{r.body}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
