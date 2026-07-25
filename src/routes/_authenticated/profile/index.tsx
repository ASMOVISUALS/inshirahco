import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile/")({
  head: () => ({ meta: [{ title: "My Profile — Inshirah" }, { name: "robots", content: "noindex" }] }),
  component: ProfileDashboard,
});

function ProfileDashboard() {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("name,email").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const displayName = profile?.name?.trim() || user?.email?.split("@")[0] || "friend";

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow mb-4">Welcome back</p>
      <h1 className="font-display text-5xl md:text-6xl leading-tight">
        Welcome, <span style={{ color: "var(--heart)" }}>{displayName}</span>
      </h1>
      <p className="mt-6 max-w-xl text-lg text-muted-foreground">
        This is your quiet corner. Update your details, keep your account settled, and return whenever you need to.
      </p>
    </div>
  );
}
