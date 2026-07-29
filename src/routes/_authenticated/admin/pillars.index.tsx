import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AdminPasswordGate, setPillarEditFlag } from "@/components/AdminPasswordGate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArabicLetterPicker, TintSelect } from "@/components/ArabicLetterPicker";

export const Route = createFileRoute("/_authenticated/admin/pillars/")({
  head: () => ({ meta: [{ title: "Pillars — Admin" }, { name: "robots", content: "noindex" }] }),
  component: PillarsAdmin,
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

type GateIntent = { kind: "edit"; slug: string } | { kind: "create" };

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

function PillarsAdmin() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [gateIntent, setGateIntent] = useState<GateIntent | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const emptyForm: Row = {
    slug: "",
    label: "",
    short_label: "",
    arabic_letter: "ا",
    tint: "heart",
    description: "",
    href: "",
    sort_order: 0,
    coming_soon: false,
  };
  const [form, setForm] = useState<Row>(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);


  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "pillars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pillars")
        .select("*")
        .is("archived_at", null)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const create = useMutation({
    mutationFn: async (row: Row) => {
      const { error } = await supabase.from("pillars").insert(row);
      if (error) throw error;
    },
    onSuccess: (_d, row) => {
      qc.invalidateQueries({ queryKey: ["admin", "pillars"] });
      qc.invalidateQueries({ queryKey: ["cms", "pillars"] });
      setCreateOpen(false);
      setPillarEditFlag(row.slug);
      navigate({ to: "/admin/pillars/$slug/edit", params: { slug: row.slug } });
    },
    onError: (e: unknown) => {
      setCreateError(e instanceof Error ? e.message : "Could not create pillar.");
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  const nextSort = (data.reduce((m, r) => Math.max(m, r.sort_order), 0) || 0) + 10;

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pillars</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only overview. Click the pencil beside a row to edit it (password required).
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({ ...emptyForm, sort_order: nextSort });
            setCreateError(null);
            setGateIntent({ kind: "create" });
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> New pillar
        </Button>

      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 border-0 bg-transparent p-0" />
              <TableHead>Label</TableHead>
              <TableHead>Short Label</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Arabic Letter</TableHead>
              <TableHead>Tint</TableHead>
              <TableHead>Href</TableHead>
              <TableHead className="text-right">Sort Order</TableHead>
              <TableHead className="min-w-[280px]">Description</TableHead>
              <TableHead className="text-center">Coming soon</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((r) => (
              <TableRow key={r.slug}>
                <TableCell className="w-12 border-0 bg-transparent p-0 pr-3 align-middle">
                  <button
                    onClick={() => setGateIntent({ kind: "edit", slug: r.slug })}
                    className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-heart hover:text-heart"
                    aria-label={`Edit ${r.label}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </TableCell>
                <TableCell className="font-semibold">{r.label}</TableCell>
                <TableCell>{r.short_label}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{r.slug}</TableCell>
                <TableCell className="text-lg">{r.arabic_letter}</TableCell>
                <TableCell>{r.tint}</TableCell>
                <TableCell className="font-mono text-xs">{r.href}</TableCell>
                <TableCell className="text-right">{r.sort_order}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.description}</TableCell>
                <TableCell className="text-center">
                  <Checkbox checked={r.coming_soon} disabled aria-label="Coming soon" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AdminPasswordGate
        open={!!gateIntent}
        onOpenChange={(o) => !o && setGateIntent(null)}
        email={user?.email ?? ""}
        onVerified={() => {
          const intent = gateIntent;
          setGateIntent(null);
          if (!intent) return;
          if (intent.kind === "edit") {
            setPillarEditFlag(intent.slug);
            navigate({ to: "/admin/pillars/$slug/edit", params: { slug: intent.slug } });
          } else {
            setCreateError(null);
            setCreateOpen(true);
          }
        }}
      />

      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) {
            setCreateError(null);
            setForm(emptyForm);
          }
        }}

      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New pillar</DialogTitle>
            <DialogDescription>
              Create a new pillar. A matching page tile will be created automatically and you'll be taken to the editor.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Label">
              <Input
                value={form.label}
                onChange={(e) => {
                  const label = e.target.value;
                  setForm((f) => ({
                    ...f,
                    label,
                    short_label: f.short_label || label,
                    slug: f.slug || slugify(label),
                    href: f.href || (f.slug ? `/${f.slug}` : `/${slugify(label)}`),
                  }));
                }}
              />
            </Field>
            <Field label="Short label">
              <Input
                value={form.short_label}
                onChange={(e) => setForm((f) => ({ ...f, short_label: e.target.value }))}
              />
            </Field>
            <Field label="Slug">
              <Input
                value={form.slug}
                onChange={(e) => {
                  const slug = slugify(e.target.value);
                  setForm((f) => ({ ...f, slug, href: `/${slug}` }));
                }}
                className="font-mono"
              />
            </Field>
            <Field label="Href">
              <Input
                value={form.href}
                onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
                className="font-mono"
              />
            </Field>
            <Field label="Arabic letter">
              <ArabicLetterPicker
                value={form.arabic_letter}
                onChange={(v) => setForm((f) => ({ ...f, arabic_letter: v }))}
              />
            </Field>
            <Field label="Tint">
              <TintSelect value={form.tint} onChange={(v) => setForm((f) => ({ ...f, tint: v }))} />
            </Field>
            <Field label="Sort order">
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
              />
            </Field>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm font-semibold">
                <Checkbox
                  checked={form.coming_soon}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, coming_soon: v === true }))}
                />
                Coming soon
              </label>
            </div>
            <div className="md:col-span-2">
              <Field label="Description">
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </Field>
            </div>
          </div>
          {createError && (
            <p className="text-sm font-semibold text-destructive">{createError}</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                setCreateError(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </Button>

            <Button
              disabled={!form.slug || !form.label || create.isPending}
              onClick={() => {
                setCreateError(null);
                create.mutate({ ...form, slug: slugify(form.slug), href: form.href || `/${slugify(form.slug)}` });
              }}
            >
              {create.isPending ? "Creating…" : "Create pillar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
