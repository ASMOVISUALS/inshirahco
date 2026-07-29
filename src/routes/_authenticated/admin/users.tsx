import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { authAccessQuery, type AuthAccess } from "@/lib/auth-access";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [{ title: "Users — Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: UsersAdmin,
});

function UsersAdmin() {
  const qc = useQueryClient();
  const { data: access, isLoading } = useQuery(authAccessQuery());
  const [messageOpen, setMessageOpen] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  // "pendingSigninOff" means the modal was opened as part of turning sign-in OFF
  const [pendingSigninOff, setPendingSigninOff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (access) setDraftMessage(access.signinLockedMessage ?? "");
  }, [access?.signinLockedMessage]);

  const save = useMutation({
    mutationFn: async (next: Partial<AuthAccess>) => {
      const merged: AuthAccess = { ...(access ?? { signinEnabled: true, signupEnabled: true, signinLockedMessage: "" }), ...next };
      const payload = {
        signin_enabled: merged.signinEnabled,
        signup_enabled: merged.signupEnabled,
        signin_locked_message: merged.signinLockedMessage ?? "",
      };
      const { error } = await supabase
        .from("site_settings")
        .update({ value: payload as never })
        .eq("key", "auth_access");
      if (error) throw error;
      return merged;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms", "settings", "auth_access"] });
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const onToggleSignin = (checked: boolean) => {
    if (!checked) {
      // opening the message modal; save happens on modal confirm
      setDraftMessage(access?.signinLockedMessage ?? "");
      setPendingSigninOff(true);
      setMessageOpen(true);
      return;
    }
    save.mutate({ signinEnabled: true });
  };

  const onToggleSignup = (checked: boolean) => {
    save.mutate({ signupEnabled: checked });
  };

  const saveMessage = async () => {
    await save.mutateAsync({
      signinEnabled: pendingSigninOff ? false : (access?.signinEnabled ?? true),
      signinLockedMessage: draftMessage.trim(),
    });
    setMessageOpen(false);
    setPendingSigninOff(false);
  };

  const cancelMessage = () => {
    setMessageOpen(false);
    setPendingSigninOff(false);
    setDraftMessage(access?.signinLockedMessage ?? "");
  };

  if (isLoading || !access) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header className="flex items-start gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-border bg-card">
          <UserCog className="h-6 w-6" strokeWidth={1.6} />
        </div>
        <div>
          <p className="eyebrow">Settings</p>
          <h1 className="mt-1 text-4xl">Users</h1>
          <p className="mt-2 text-muted-foreground">
            Control who can sign in and who can create new accounts. Existing sessions are signed out when sign-in is turned off.
          </p>
        </div>
      </header>

      {/* Sign-in toggle */}
      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold">Users can sign in to their accounts</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              When off, /auth shows a locked template and any signed-in visitor is signed out on their next page load.
            </p>
          </div>
          <Switch
            checked={access.signinEnabled}
            onCheckedChange={onToggleSignin}
            aria-label="Sign in enabled"
          />
        </div>

        {!access.signinEnabled && (
          <button
            type="button"
            onClick={() => {
              setDraftMessage(access.signinLockedMessage ?? "");
              setPendingSigninOff(false);
              setMessageOpen(true);
            }}
            className="mt-5 flex w-full items-start gap-3 rounded-2xl border border-border bg-background p-4 text-left transition-colors hover:border-heart/40"
          >
            <Pencil className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              {access.signinLockedMessage ? (
                <p className="whitespace-pre-line text-sm text-foreground/90">{access.signinLockedMessage}</p>
              ) : (
                <p className="text-sm italic text-muted-foreground">No message set — click to add one</p>
              )}
            </div>
          </button>
        )}
      </section>

      {/* Sign-up toggle */}
      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold">Users can create new accounts</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              When off, /join shows an "exclusive access" template with a newsletter signup. Existing users can still sign in.
            </p>
          </div>
          <Switch
            checked={access.signupEnabled}
            onCheckedChange={onToggleSignup}
            aria-label="Sign up enabled"
          />
        </div>
      </section>

      {error && (
        <p className="text-sm" style={{ color: "var(--heart)" }}>
          {error}
        </p>
      )}

      <Dialog open={messageOpen} onOpenChange={(o) => (!o ? cancelMessage() : setMessageOpen(true))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingSigninOff ? "Turn sign-in off" : "Edit locked-page message"}
            </DialogTitle>
            <DialogDescription>
              Add an optional message that will appear on the sign-in page under the heading. Leave empty for a default message.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={draftMessage}
            onChange={(e) => setDraftMessage(e.target.value)}
            rows={5}
            placeholder="e.g. We're making some quiet updates. Sign-in returns tomorrow morning insha'Allah."
            className="rounded-xl"
          />
          <DialogFooter className="gap-2">
            <button type="button" onClick={cancelMessage} className="btn-ghost">
              Cancel
            </button>
            <button
              type="button"
              onClick={saveMessage}
              disabled={save.isPending}
              className="btn-primary"
            >
              {save.isPending ? "Saving…" : pendingSigninOff ? "Turn off & save" : "Save message"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
