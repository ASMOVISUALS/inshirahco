import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type ReportSubject = "article" | "reflection" | "votw";

/** Lightweight report form — stores the subject as a single checked column. */
export function ReportDialog({
  subject,
  targetId,
  userId,
  userEmail,
  onClose,
}: {
  subject: ReportSubject;
  targetId: string;
  userId: string;
  userEmail: string | null;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("reports").insert({
        reporter_id: userId,
        reporter_email: userEmail,
        message: message.trim().slice(0, 500),
        is_article: subject === "article",
        is_reflection: subject === "reflection",
        is_votw: subject === "votw",
        target_id: targetId,
      });
      if (error) throw error;
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Report this reflection"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="eyebrow" style={{ color: "var(--heart)" }}>Report</p>
        <h2 className="mt-2 font-display text-xl">Tell us what's wrong</h2>

        {submit.isSuccess ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Thank you — your report has been sent to the Inshirah team.
          </p>
        ) : (
          <>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              rows={5}
              placeholder="Describe the issue…"
              className="mt-4 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-heart"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">{message.trim().length}/500</span>
              <button
                type="button"
                disabled={!message.trim() || submit.isPending}
                onClick={() => submit.mutate()}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {submit.isPending ? "Sending…" : "Submit report"}
              </button>
            </div>
            {submit.isError && (
              <p className="mt-2 text-xs text-destructive">Could not send your report. Please try again.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
