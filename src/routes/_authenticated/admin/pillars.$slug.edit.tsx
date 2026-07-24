import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { consumePillarEditFlag } from "@/components/AdminPasswordGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/admin/pillars/$slug/edit")({
  head: () => ({ meta: [{ title: "Edit pillar — Admin" }, { name: "robots", content: "noindex" }] }),
  component: PillarEdit,
});

interface Row {
  slug: string;
  label: string;
  short_label: string;
  arabic_letter: string;
  tint: string;
  description: string;
  href: string;
  sort_order: number;
  coming_soon: boolean;
}

function PillarEdit() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const verifiedRef = useRef<boolean | null>(null);
  if (verifiedRef.current === null) {
    verifiedRef.current = consumePillarEditFlag(slug);
  }

  useEffect(() => {
    if (verifiedRef.current === false) {
      navigate({ to: "/admin/pillars", replace: true });
    }
  }, [navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pillar", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("pillars").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data as Row | null;
    },
    enabled: verifiedRef.current === true,
  });

  const [form, setForm] = useState<Row | null>(null);
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const dirty = useMemo(() => {
    if (!data || !form) return false;
    return JSON.stringify(data) !== JSON.stringify(form);
  }, [data, form]);

  const save = useMutation({
    mutationFn: async (row: Row) => {
      const { error } = await supabase
        .from("pillars")
        .update({
          label: row.label,
          short_label: row.short_label,
          arabic_letter: row.arabic_letter,
          tint: row.tint,
          description: row.description,
          href: row.href,
          sort_order: row.sort_order,
          coming_soon: row.coming_soon,
        })
        .eq("slug", row.slug);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "pillars"] });
      qc.invalidateQueries({ queryKey: ["admin", "pillar", slug] });
      qc.invalidateQueries({ queryKey: ["cms", "pillars"] });
      setStatus({ kind: "success", text: "Saved successfully." });
    },
    onError: (e: unknown) => {
      setStatus({ kind: "error", text: e instanceof Error ? e.message : "Save failed." });
    },
  });

  function handleBack() {
    if (dirty && !confirm("Discard unsaved changes?")) return;
    navigate({ to: "/admin/pillars" });
  }

  if (verifiedRef.current === false) return null;
  if (isLoading || !form) return <p className="text-muted-foreground">Loading…</p>;

  const set = <K extends keyof Row>(k: K, v: Row[K]) => {
    setForm((f) => (f ? { ...f, [k]: v } : f));
    setStatus(null);
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:border-heart hover:text-heart"
        >
          <ArrowLeft className="h-4 w-4" /> Back to pillars
        </button>
        <div className="flex gap-2">
          <Button variant="outline" disabled={!dirty || save.isPending} onClick={() => data && setForm(data)}>
            Cancel
          </Button>
          <Button disabled={!dirty || save.isPending} onClick={() => form && save.mutate(form)}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">Edit pillar</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{form.slug}</p>
      </div>

      {status && (
        <div
          className={
            status.kind === "success"
              ? "rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300"
              : "rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
          }
        >
          {status.text}
        </div>
      )}

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Label">
            <Input value={form.label} onChange={(e) => set("label", e.target.value)} />
          </Field>
          <Field label="Short label">
            <Input value={form.short_label} onChange={(e) => set("short_label", e.target.value)} />
          </Field>
          <Field label="Slug (read-only)">
            <Input value={form.slug} readOnly disabled />
          </Field>
          <Field label="Arabic letter">
            <Input value={form.arabic_letter} onChange={(e) => set("arabic_letter", e.target.value)} />
          </Field>
          <Field label="Tint (heart, tazkiyah, heart-soft, gold, ink)">
            <Input value={form.tint} onChange={(e) => set("tint", e.target.value)} />
          </Field>
          <Field label="Href">
            <Input value={form.href} onChange={(e) => set("href", e.target.value)} />
          </Field>
          <Field label="Sort order">
            <Input
              type="number"
              value={form.sort_order}
              onChange={(e) => set("sort_order", Number(e.target.value))}
            />
          </Field>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <Checkbox
                checked={form.coming_soon}
                onCheckedChange={(v) => set("coming_soon", v === true)}
              />
              Coming soon
            </label>
          </div>
        </div>
        <div className="mt-4">
          <Field label="Description">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
