import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile/edit")({
  head: () => ({ meta: [{ title: "Profile — Inshirah" }, { name: "robots", content: "noindex" }] }),
  component: ProfileEdit,
});

function ProfileEdit() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("name,email").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [name, setName] = useState("");
  const [nameStatus, setNameStatus] = useState<string | null>(null);
  useEffect(() => { setName(profile?.name ?? ""); }, [profile?.name]);

  const saveName = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("profiles").update({ name: name.trim() || null }).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setNameStatus("Saved.");
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (e: Error) => setNameStatus(e.message),
  });

  const [currentPw, setCurrentPw] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwStatus, setPwStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const changePassword = useMutation({
    mutationFn: async () => {
      if (!currentPw) throw new Error("Enter your current password.");
      if (pw.length < 8) throw new Error("Password must be at least 8 characters.");
      if (pw !== pw2) throw new Error("Passwords do not match.");
      const email = profile?.email ?? user?.email;
      if (!email) throw new Error("Missing account email.");
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPw });
      if (signInError) throw new Error("Current password is incorrect.");
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
    },
    onSuccess: () => {
      setCurrentPw(""); setPw(""); setPw2("");
      setPwStatus({ ok: true, msg: "Password updated." });
    },
    onError: (e: Error) => setPwStatus({ ok: false, msg: e.message }),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <p className="eyebrow mb-3">Account</p>
      <h1 className="font-display text-4xl md:text-5xl leading-tight">Profile</h1>

      <section className="mt-10 rounded-3xl border border-border bg-card p-6 md:p-8">
        <h2 className="font-display text-2xl">Your name</h2>
        <p className="mt-1 text-sm text-muted-foreground">This is how we'll greet you across Inshirah.</p>
        <div className="mt-5 flex flex-col gap-3">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground" htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameStatus(null); }}
            className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-heart"
            placeholder="Your name"
          />
          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={() => saveName.mutate()}
              disabled={saveName.isPending || name.trim() === (profile?.name ?? "").trim()}
            >
              {saveName.isPending ? "Saving…" : "Save name"}
            </button>
            {nameStatus && <span className="text-sm text-muted-foreground">{nameStatus}</span>}
          </div>
        </div>
        <div className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
          Signed in as <span className="font-semibold text-foreground">{profile?.email ?? user?.email}</span>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
        <h2 className="font-display text-2xl">Change password</h2>
        <p className="mt-1 text-sm text-muted-foreground">Use at least 8 characters. You'll stay signed in on this device.</p>
        <div className="mt-5 grid gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground" htmlFor="pw">New password</label>
            <input
              id="pw"
              type="password"
              autoComplete="new-password"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setPwStatus(null); }}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-heart"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground" htmlFor="pw2">Confirm new password</label>
            <input
              id="pw2"
              type="password"
              autoComplete="new-password"
              value={pw2}
              onChange={(e) => { setPw2(e.target.value); setPwStatus(null); }}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:border-heart"
            />
          </div>
          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={() => changePassword.mutate()}
              disabled={changePassword.isPending || !pw || !pw2}
            >
              {changePassword.isPending ? "Updating…" : "Update password"}
            </button>
            {pwStatus && (
              <span className="text-sm" style={{ color: pwStatus.ok ? "var(--tazkiyah, #3f7d5b)" : "var(--heart)" }}>
                {pwStatus.msg}
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
