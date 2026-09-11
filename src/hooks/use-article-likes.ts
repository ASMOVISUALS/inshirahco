import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { articleLikesQuery } from "@/lib/queries";

/**
 * Article likes for the signed-in member. Likes require an account — the
 * `article_likes` table is what populates the profile "Liked Articles" page.
 */
export function useArticleLikes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? null;
  const { data: slugs = [], isLoading } = useQuery(articleLikesQuery(userId));

  const has = (slug: string) => slugs.includes(slug);

  /** Returns true when the like state changed, false when sign-in is needed. */
  const toggle = async (slug: string): Promise<boolean> => {
    if (!userId) return false;
    const liked = slugs.includes(slug);
    qc.setQueryData<string[]>(["article-likes", userId], (prev = []) =>
      liked ? prev.filter((s) => s !== slug) : [slug, ...prev],
    );
    if (liked) {
      await supabase.from("article_likes").delete().eq("user_id", userId).eq("article_slug", slug);
    } else {
      await supabase.from("article_likes").insert({ user_id: userId, article_slug: slug });
    }
    qc.invalidateQueries({ queryKey: ["article-likes", userId] });
    qc.invalidateQueries({ queryKey: ["articles"] });
    qc.invalidateQueries({ queryKey: ["article", slug] });
    return true;
  };

  return { slugs, has, toggle, isLoading, signedIn: !!userId };
}
