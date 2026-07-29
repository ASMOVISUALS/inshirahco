import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapArticleRow, type ContentItem } from "@/lib/content";

export const articlesQuery = () =>
  queryOptions({
    queryKey: ["articles"],
    queryFn: async (): Promise<ContentItem[]> => {
      const { data, error } = await supabase
        .from("articles")
        .select("slug,title,description,pillar,read_time,author_name,author_role,tags,downloadable,body,published_at")
        .eq("published", true)
        .is("archived_at", null)
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
        .select("slug,title,description,pillar,read_time,author_name,author_role,tags,downloadable,body,published_at")
        .eq("slug", slug)
        .eq("published", true)
        .is("archived_at", null)
        .maybeSingle();
      if (error) throw error;
      return data ? mapArticleRow(data) : null;
    },
  });

export type AyahRow = {
  id: string;
  arabic: string;
  translation: string;
  reference: string;
  sort_order: number;
  surah_id: string | null;
  ayah_number: number | null;
};

/** Verses in the pool available for the "Verse of the week" rotation. */
export const ayahsQuery = () =>
  queryOptions({
    queryKey: ["ayahs"],
    queryFn: async (): Promise<AyahRow[]> => {
      const { data, error } = await supabase
        .from("ayahs")
        .select("id,arabic,translation,reference,sort_order,surah_id,ayah_number")
        .in("status", ["pool", "current", "used"])
        .is("archived_at", null)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AyahRow[];
    },
    staleTime: 5 * 60_000,
  });

/**
 * The verse chosen for the current week. The database picks a random pool verse
 * every Friday, marks it `current`, and retires the previous one to `used`.
 */
export const currentVerseQuery = () =>
  queryOptions({
    queryKey: ["votw"],
    queryFn: async (): Promise<AyahRow | null> => {
      const { data, error } = await supabase
        .from("ayahs")
        .select("*")
        .eq("status", "current")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as AyahRow | null) ?? null;
    },

    staleTime: 5 * 60_000,
  });

export type PublicReflection = {
  id: string;
  body: string;
  created_at: string;
  likes_count: number;
  user_id: string;
};

/** Every reflection written on a given verse — publicly readable. */
export const verseReflectionsQuery = (ayahId: string | null) =>
  queryOptions({
    queryKey: ["verse-reflections", ayahId],
    enabled: !!ayahId,
    queryFn: async (): Promise<PublicReflection[]> => {
      const { data, error } = await supabase
        .from("reflections")
        .select("id,body,created_at,likes_count,user_id")
        .eq("ayah_id", ayahId!)
        .order("likes_count", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as PublicReflection[];
    },
  });

/** Reflection ids the signed-in member has already liked. */
export const myLikesQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["my-likes", userId],
    enabled: !!userId,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("reflection_likes")
        .select("reflection_id")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.reflection_id);
    },
  });


export const surahsQuery = () =>
  queryOptions({
    queryKey: ["surahs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surahs")
        .select("id,number,name_en,name_ar,verse_count")
        .order("number", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: Infinity,
  });

/** A signed-in member's own reflections on a given ayah. */
export const myReflectionsQuery = (userId: string | null, ayahId: string | null) =>
  queryOptions({
    queryKey: ["my-reflections", userId, ayahId],
    enabled: !!userId && !!ayahId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reflections")
        .select("id,body,created_at")
        .eq("user_id", userId!)
        .eq("ayah_id", ayahId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });


export const testimonialsQuery = () =>
  queryOptions({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("id,quote,name,role,sort_order")
        .eq("featured", true)
        .is("archived_at", null)
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
  show_in_menu: boolean;
  show_on_site: boolean;
}

export const pillarsQuery = () =>
  queryOptions({
    queryKey: ["cms", "pillars"],
    queryFn: async (): Promise<PillarRow[]> => {
      const { data, error } = await supabase
        .from("pillars")
        .select("slug,label,short_label,arabic_letter,tint,description,href,sort_order,coming_soon")
        .is("archived_at", null)
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
        .select("slug,label,plural,arabic_letter,tint,sort_order,show_in_menu,show_on_site")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as unknown as Array<Partial<FormatRow>>).map((r) => ({
        slug: r.slug ?? "",
        label: r.label ?? "",
        plural: r.plural ?? "",
        arabic_letter: r.arabic_letter ?? "",
        tint: r.tint ?? "heart",
        sort_order: r.sort_order ?? 0,
        show_in_menu: r.show_in_menu ?? true,
        show_on_site: r.show_on_site ?? true,
      }));
    },
    staleTime: 5 * 60_000,
  });

// ============ Series ============

export type SeriesStatus = "published" | "hidden" | "coming_soon";

export interface SeriesRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  pillar: string | null;
  cover_image: string | null;
  arabic_letter: string;
  tint: string;
  sort_order: number;
  status: SeriesStatus;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export const seriesQuery = (opts: { includeArchived?: boolean } = {}) =>
  queryOptions({
    queryKey: ["cms", "series", opts.includeArchived ? "all" : "active"],
    queryFn: async (): Promise<SeriesRow[]> => {
      const base = supabase.from("series" as never).select("*");
      const q = opts.includeArchived ? base : base.is("archived_at", null);
      const { data, error } = await q.order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SeriesRow[];
    },
    staleTime: 60_000,
  });

export const publicSeriesQuery = () =>
  queryOptions({
    queryKey: ["cms", "series", "public"],
    queryFn: async (): Promise<SeriesRow[]> => {
      const { data, error } = await supabase
        .from("series" as never)
        .select("*")
        .eq("status", "published")
        .is("archived_at", null)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SeriesRow[];
    },
    staleTime: 60_000,
  });

export type PageContent = Record<string, unknown>;
export type PageStatus = "published" | "hidden" | "coming_soon";

export interface PageStatusBundle {
  status: PageStatus;
  title: string | null;
  archived_at: string | null;
}

export interface PageBundle {
  content: PageContent;
  status: PageStatus;
  title: string | null;
}

export const pageStatusQuery = (key: string) =>
  queryOptions({
    queryKey: ["cms", "page-status", key],
    queryFn: async (): Promise<PageStatusBundle> => {
      const { data, error } = await supabase
        .from("pages")
        .select("status,title,archived_at")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      const archivedAt = typeof data?.archived_at === "string" ? data.archived_at : null;
      return {
        status: archivedAt ? "hidden" : ((data?.status as PageStatus) ?? "published"),
        title: data?.title ?? null,
        archived_at: archivedAt,
      };
    },
  });

export const pageContentQuery = (key: string) =>
  queryOptions({
    queryKey: ["cms", "page-content", key],
    queryFn: async (): Promise<{ content: PageContent; title: string | null }> => {
      const { data, error } = await supabase
        .from("pages")
        .select("content,title")
        .eq("key", key)
        .eq("status", "published")
        .is("archived_at", null)
        .maybeSingle();
      if (error) throw error;
      return {
        content: (data?.content ?? {}) as PageContent,
        title: data?.title ?? null,
      };
    },
    staleTime: 60_000,
  });

export const pageQuery = (key: string) =>
  queryOptions({
    queryKey: ["cms", "page", key],
    queryFn: async (): Promise<PageBundle> => {
      const { data, error } = await supabase
        .from("pages")
        .select("content,status,title")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return {
        content: (data?.content ?? {}) as PageContent,
        status: (data?.status as PageStatus) ?? "published",
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
  status: PageStatus;
  template: string;
}

export interface PageSlugStatusRow {
  key: string;
  slug: string;
  title: string;
  is_published: boolean;
  status: PageStatus;
}

export const pageBySlugStatusQuery = (slug: string) =>
  queryOptions({
    queryKey: ["cms", "page-by-slug-status", slug],
    queryFn: async (): Promise<PageSlugStatusRow | null> => {
      const { data, error } = await supabase
        .from("pages")
        .select("key,slug,title,is_published,status")
        .eq("slug", slug)
        .eq("is_published", true)
        .is("archived_at", null)
        .maybeSingle();
      if (error) throw error;
      return data as PageSlugStatusRow | null;
    },
  });

export const pageBySlugContentQuery = (slug: string) =>
  queryOptions({
    queryKey: ["cms", "page-by-slug-content", slug],
    queryFn: async (): Promise<{ content: PageContent } | null> => {
      const { data, error } = await supabase
        .from("pages")
        .select("content")
        .eq("slug", slug)
        .eq("is_published", true)
        .eq("status", "published")
        .is("archived_at", null)
        .maybeSingle();
      if (error) throw error;
      return data ? { content: (data.content ?? {}) as PageContent } : null;
    },
    staleTime: 60_000,
  });

export const pageBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["cms", "page-by-slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("key,slug,title,is_published,status,content")
        .eq("slug", slug)
        .eq("is_published", true)
        .is("archived_at", null)
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

// ============ Newsletters ============

export interface NewsletterRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const newslettersQuery = () =>
  queryOptions({
    queryKey: ["cms", "newsletters"],
    queryFn: async (): Promise<NewsletterRow[]> => {
      const { data, error } = await supabase
        .from("newsletters")
        .select("id,slug,name,description,is_default,created_at,updated_at")
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as NewsletterRow[];
    },
    staleTime: 5 * 60_000,
  });

export const newsletterSubscribersQuery = (newsletterId: string | null) =>
  queryOptions({
    queryKey: ["cms", "newsletter-subs", newsletterId ?? "none"],
    queryFn: async () => {
      if (!newsletterId) return [];
      const { data, error } = await supabase
        .from("newsletter_signups")
        .select("id,email,source,created_at")
        .eq("newsletter_id", newsletterId)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!newsletterId,
  });
