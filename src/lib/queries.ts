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

// ============ CMS ============

export interface PillarRow {
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

export interface FormatRow {
  slug: string;
  label: string;
  plural: string;
  arabic_letter: string;
  tint: string;
  sort_order: number;
}

export const pillarsQuery = () =>
  queryOptions({
    queryKey: ["cms", "pillars"],
    queryFn: async (): Promise<PillarRow[]> => {
      const { data, error } = await supabase
        .from("pillars")
        .select("slug,label,short_label,arabic_letter,tint,description,href,sort_order,coming_soon")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PillarRow[];
    },
    staleTime: 5 * 60_000,
  });

export const formatsQuery = () =>
  queryOptions({
    queryKey: ["cms", "formats"],
    queryFn: async (): Promise<FormatRow[]> => {
      const { data, error } = await supabase
        .from("resource_formats")
        .select("slug,label,plural,arabic_letter,tint,sort_order")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as FormatRow[];
    },
    staleTime: 5 * 60_000,
  });

export type PageContent = Record<string, unknown>;

export interface PageBundle {
  content: PageContent;
  is_locked: boolean;
  title: string | null;
}

export const pageQuery = (key: string) =>
  queryOptions({
    queryKey: ["cms", "page", key],
    queryFn: async (): Promise<PageBundle> => {
      const { data, error } = await supabase
        .from("pages")
        .select("content,is_locked,title")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return {
        content: (data?.content ?? {}) as PageContent,
        is_locked: Boolean(data?.is_locked),
        title: data?.title ?? null,
      };
    },
    staleTime: 60_000,
  });

export interface PageMetaRow {
  key: string;
  slug: string;
  title: string;
  is_published: boolean;
  is_locked: boolean;
  template: string;
}

export const pageBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["cms", "page-by-slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("key,slug,title,is_published,is_locked,content")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });


export interface FaqRow {
  id: string;
  page_key: string;
  question: string;
  answer: string;
  sort_order: number;
}

export const faqsQuery = (pageKey: string) =>
  queryOptions({
    queryKey: ["cms", "faqs", pageKey],
    queryFn: async (): Promise<FaqRow[]> => {
      const { data, error } = await supabase
        .from("faqs")
        .select("id,page_key,question,answer,sort_order")
        .eq("page_key", pageKey)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as FaqRow[];
    },
    staleTime: 60_000,
  });

export const siteSettingQuery = (key: string) =>
  queryOptions({
    queryKey: ["cms", "settings", key],
    queryFn: async (): Promise<Record<string, unknown>> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return (data?.value ?? {}) as Record<string, unknown>;
    },
    staleTime: 5 * 60_000,
  });
