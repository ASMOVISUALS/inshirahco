import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Admin" }, { name: "robots", content: "noindex" }] }),
  component: ReportsAdmin,
});

type Row = {
  id: string;
  created_at: string;
  reporter_email: string | null;
  message: string;
  is_article: boolean;
  is_reflection: boolean;
  is_votw: boolean;
};

const subjectOf = (r: Row) => (r.is_article ? "Article" : r.is_reflection ? "Reflection" : "VOTW");

function ReportsAdmin() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("reports")
        .select("id,created_at,reporter_email,message,is_article,is_reflection,is_votw")
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-xl font-display">Reports</h2>
        <p className="text-sm text-muted-foreground">Issues raised by members, oldest first.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reports have been raised.</p>
      ) : (
        <div className="max-w-3xl overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Raised</th>
                <th className="px-4 py-3 font-semibold">Member</th>
                <th className="px-4 py-3 font-semibold">Subject</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{r.reporter_email ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold">{subjectOf(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
