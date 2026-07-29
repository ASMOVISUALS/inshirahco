import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SortBar } from "@/components/admin/SortBar";
import { currentVerseQuery } from "@/lib/queries";

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
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [thisWeekOnly, setThisWeekOnly] = useState(false);
  const { data: currentVerse } = useQuery(currentVerseQuery());

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
    let list = data;
    if (q) {
      list = list.filter((r) => r.body.toLowerCase().includes(q) || (r.ayahs?.reference ?? "").toLowerCase().includes(q));
    }
    if (thisWeekOnly && currentVerse) {
      list = list.filter((r) => r.ayahs?.id === currentVerse.id);
    }
    return [...list].sort((a, b) =>
      sort === "newest"
        ? b.created_at.localeCompare(a.created_at)
        : a.created_at.localeCompare(b.created_at),
    );
  }, [data, filter, sort, thisWeekOnly, currentVerse]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display">Reflections</h2>
          <p className="text-sm text-muted-foreground">Reflections members have written on the verse of the week.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SortBar
            value={sort}
            onChange={setSort}
            options={[
              { value: "newest", label: "Newest to oldest" },
              { value: "oldest", label: "Oldest to newest" },
            ]}
          />
          <button
            type="button"
            onClick={() => setThisWeekOnly((v) => !v)}
            aria-pressed={thisWeekOnly}
            className={
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors " +
              (thisWeekOnly ? "border-heart bg-heart/10 text-heart" : "border-border text-muted-foreground hover:border-heart/40")
            }
          >
            <span className={"relative inline-flex h-4 w-7 items-center rounded-full transition-colors " + (thisWeekOnly ? "bg-heart" : "bg-muted")}>
              <span className={"h-3 w-3 rounded-full bg-background transition-transform " + (thisWeekOnly ? "translate-x-[15px]" : "translate-x-0.5")} />
            </span>
            This week's verse
          </button>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search reflections…"
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-heart"
        />
        </div>
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
