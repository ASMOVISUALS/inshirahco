import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapArticleRow, type ContentItem } from "@/lib/content";

export const articlesQuery = () =>
  queryOptions({
    queryKey: ["articles"],
    queryFn: async (): Promise<ContentItem[]> => {
      const { data, error } = await supabase
        .from("articles")
        .select("slug,title,description,pillar,type,read_time,author_name,author_role,tags,downloadable,body,published_at")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []).map(mapArticleRow);
    },
    staleTime: 60_000,
  });

export const articleBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["article", slug],
    queryFn: async (): Promise<ContentItem | null> => {
      const { data, error } = await supabase
        .from("articles")
        .select("slug,title,description,pillar,type,read_time,author_name,author_role,tags,downloadable,body,published_at")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return data ? mapArticleRow(data) : null;
    },
  });

export const reflectionsQuery = () =>
  queryOptions({
    queryKey: ["reflections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reflections")
        .select("id,arabic,translation,reference,sort_order")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

export const testimonialsQuery = () =>
  queryOptions({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("id,quote,name,role,sort_order")
        .eq("featured", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

export const bookmarksQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["bookmarks", userId ?? "anon"],
    queryFn: async (): Promise<string[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("bookmarks")
        .select("article_slug")
        .eq("user_id", userId);
      if (error) throw error;
      return (data ?? []).map((r) => r.article_slug);
    },
    enabled: !!userId,
  });

export const hasAdminRoleQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["has-admin", userId ?? "anon"],
    queryFn: async (): Promise<boolean> => {
      if (!userId) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
