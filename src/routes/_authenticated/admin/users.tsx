import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminMembersQuery, organisationsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Members — Admin" }, { name: "robots", content: "noindex" }] }),
  component: MembersAdmin,
});

function MembersAdmin() {
  const { data: members = [], isLoading } = useQuery(adminMembersQuery());
  const { data: orgs = [] } = useQuery(organisationsQuery());
  const [org, setOrg] = useState<string>("all");
  const [q, setQ] = useState("");

  const rows = useMemo(
    () =>
      members.filter((m) => {
        const orgName = m.organisation?.name ?? "";
        if (org !== "all" && orgName !== org) return false;
        if (q && !`${m.username} ${orgName}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [members, org, q],
  );

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="font-display text-xl">Members</h2>
        <p className="text-sm text-muted-foreground">
          Grouped by affiliation. Email addresses are never fetched — only a masked initial is stored for reference.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search username or organisation…"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-heart"
        />
        <select
          value={org}
          onChange={(e) => setOrg(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All organisations</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.name}>{o.name}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">{rows.length} members</span>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members match this filter.</p>
      ) : (
        <div className="max-w-3xl overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Username</th>
                <th className="px-4 py-3 font-semibold">Affiliation</th>
                <th className="px-4 py-3 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.user_id} className="border-t border-border">
                  <td className="px-4 py-3 font-semibold">@{m.username}</td>
                  <td className="px-4 py-3">
                    {m.organisation ? (
                      <span className="flex items-center gap-2">
                        {m.organisation.logo_url ? (
                          <img src={m.organisation.logo_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                        ) : (
                          <span
                            className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold"
                            style={{ background: "var(--tazkiyah-soft)", color: "var(--tazkiyah)" }}
                          >
                            {m.organisation.name.charAt(0)}
                          </span>
                        )}
                        {m.organisation.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Unaffiliated</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{m.email_mask ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
