import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/testimonials")({
  head: () => ({ meta: [{ title: "Testimonials — Admin" }, { name: "robots", content: "noindex" }] }),
  component: TestimonialsAdmin,
});

function TestimonialsAdmin() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonials").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [quote, setQuote] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("testimonials").insert({ quote, name, role: role || null, featured: true, sort_order: data.length });
      if (error) throw error;
    },
    onSuccess: () => {
      setQuote(""); setName(""); setRole("");
      qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
      qc.invalidateQueries({ queryKey: ["testimonials"] });
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { error } = await supabase.from("testimonials").update({ featured }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
      qc.invalidateQueries({ queryKey: ["testimonials"] });
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
      qc.invalidateQueries({ queryKey: ["testimonials"] });
    },
  });

  return (
    <div className="grid gap-8">
      <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="grid gap-3 rounded-3xl border border-border bg-card p-6">
        <h2 className="text-xl font-display">Add testimonial</h2>
        <textarea placeholder="Quote" value={quote} onChange={(e) => setQuote(e.target.value)} required rows={3} className={cls} />
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required className={cls} />
        <input placeholder="Role (optional)" value={role} onChange={(e) => setRole(e.target.value)} className={cls} />
        <button type="submit" disabled={add.isPending} className="btn-primary self-start">{add.isPending ? "Adding…" : "Add"}</button>
      </form>

      <div className="grid gap-3">
        {data.map((t) => (
          <div key={t.id} className="rounded-2xl border border-border bg-card p-5">
            <p className="italic">"{t.quote}"</p>
            <p className="mt-2 text-sm font-semibold">{t.name}{t.role ? <span className="text-muted-foreground"> · {t.role}</span> : null}</p>
            <div className="mt-3 flex gap-3">
              <button onClick={() => toggle.mutate({ id: t.id, featured: !t.featured })} className="text-sm font-semibold hover:underline" style={{ color: "var(--heart)" }}>
                {t.featured ? "Unfeature" : "Feature"}
              </button>
              <button onClick={() => { if (confirm("Delete this testimonial?")) del.mutate(t.id); }} className="text-sm font-semibold text-muted-foreground hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const cls = "w-full rounded-2xl border border-input bg-background px-4 py-2.5 outline-none focus:border-heart";
