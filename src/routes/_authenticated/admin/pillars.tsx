import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/admin/pillars")({
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

function PillarsAdmin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gateSlug, setGateSlug] = useState<string | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "pillars"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pillars").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Pillars</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Read-only overview. Click the pencil beside a row to edit it (password required).
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-3">
          {/* edit column outside the table */}
          <div className="flex flex-col gap-0 pt-[52px]">
            {data.map((r) => (
              <div key={r.slug} className="flex h-[57px] items-center">
                <button
                  onClick={() => setGateSlug(r.slug)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-heart hover:text-heart"
                  aria-label={`Edit ${r.label}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex-1 rounded-2xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
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
        </div>
      </div>

      <AdminPasswordGate
        open={!!gateSlug}
        onOpenChange={(o) => !o && setGateSlug(null)}
        email={user?.email ?? ""}
        onVerified={() => {
          if (!gateSlug) return;
          setPillarEditFlag(gateSlug);
          const slug = gateSlug;
          setGateSlug(null);
          navigate({ to: "/admin/pillars/$slug/edit", params: { slug } });
        }}
      />
    </div>
  );
}
