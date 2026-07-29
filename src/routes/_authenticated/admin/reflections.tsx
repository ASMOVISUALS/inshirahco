import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/reflections")({
  head: () => ({ meta: [{ title: "Reflections — Admin" }, { name: "robots", content: "noindex" }] }),
  component: ReflectionsAdmin,
});

type Row = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  ayahs: { id: string; reference: string; arabic: string } | null;
};

function ReflectionsAdmin() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-reflections"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("reflections")
        .select("id,body,created_at,user_id,ayahs(id,reference,arabic)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reflections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reflections"] }),
  });

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return data;
    return data.filter((r) => r.body.toLowerCase().includes(q) || (r.ayahs?.reference ?? "").toLowerCase().includes(q));
  }, [data, filter]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display">Reflections</h2>
          <p className="text-sm text-muted-foreground">Reflections members have written on the verse of the week.</p>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search reflections…"
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-heart"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reflections submitted yet.</p>
      ) : (
        <div className="grid items-start gap-4 grid-cols-1 md:grid-cols-2">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-col self-start rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground">{r.ayahs?.reference ?? "Unknown verse"}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{r.body}</p>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                <button
                  type="button"
                  aria-label="Delete reflection"
                  title="Delete reflection"
                  onClick={() => { if (confirm("Delete this reflection?")) remove.mutate(r.id); }}
                  className="grid h-8 w-8 place-items-center rounded-full bg-destructive text-background transition-colors hover:bg-destructive/80"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
