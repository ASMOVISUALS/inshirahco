import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FieldType = "toggle" | "text" | "textarea" | "number" | "select" | "multiselect" | "color";
export type OptionsSource = "static" | "block_kinds" | "pillars" | "formats" | "newsletters" | "pages";

export interface SettingField {
  id: string;
  group_id: string;
  field_key: string;
  label: string;
  help: string;
  field_type: FieldType;
  required: boolean;
  default_value: unknown;
  options: Array<{ value: string; label: string }>;
  options_source: OptionsSource;
  min_value: number | null;
  max_value: number | null;
  sort_order: number;
}

export interface SettingGroup {
  id: string;
  settings_key: string;
  label: string;
  description: string;
  icon: string | null;
  sort_order: number;
  fields: SettingField[];
}

/** All known article body block kinds — mirrors `ContentBlock["kind"]` in src/lib/content.ts. */
export const BLOCK_KIND_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "p", label: "Paragraph" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "quote", label: "Quran quote" },
  { value: "plain_quote", label: "Plain quote" },
  { value: "callout", label: "Callout" },
  { value: "list", label: "List" },
  { value: "image", label: "Image" },
  { value: "divider", label: "Divider" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "hyperlink", label: "Hyperlink card" },
  { value: "recommended", label: "Recommended article" },
  { value: "arabic_large", label: "Large Arabic" },
];

export const settingGroupsQuery = () =>
  queryOptions({
    queryKey: ["cms", "setting-groups"],
    queryFn: async (): Promise<SettingGroup[]> => {
      const [gRes, fRes] = await Promise.all([
        supabase.from("setting_groups").select("*").order("sort_order"),
        supabase.from("setting_fields").select("*").order("sort_order"),
      ]);
      if (gRes.error) throw gRes.error;
      if (fRes.error) throw fRes.error;
      const fields = (fRes.data ?? []) as unknown as SettingField[];
      return ((gRes.data ?? []) as unknown as Omit<SettingGroup, "fields">[]).map((g) => ({
        ...g,
        fields: fields
          .filter((f) => f.group_id === g.id)
          .map((f) => ({ ...f, options: Array.isArray(f.options) ? f.options : [] })),
      }));
    },
    staleTime: 60_000,
  });

export const settingValueQuery = (key: string) =>
  queryOptions({
    queryKey: ["cms", "setting-value", key],
    queryFn: async (): Promise<Record<string, unknown>> => {
      const { data, error } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
      if (error) throw error;
      return (data?.value ?? {}) as Record<string, unknown>;
    },
  });

/** Options for dynamic sources (block_kinds, pillars, formats, newsletters, pages). */
export async function resolveDynamicOptions(source: OptionsSource): Promise<Array<{ value: string; label: string }>> {
  if (source === "block_kinds") return BLOCK_KIND_OPTIONS;
  if (source === "pillars") {
    const { data } = await supabase.from("pillars").select("slug,label").is("archived_at", null).order("sort_order");
    return (data ?? []).map((r) => ({ value: r.slug, label: r.label }));
  }
  if (source === "formats") {
    const { data } = await supabase.from("resource_formats").select("slug,label").order("sort_order");
    return (data ?? []).map((r) => ({ value: r.slug, label: r.label }));
  }
  if (source === "newsletters") {
    const { data } = await supabase.from("newsletters").select("slug,name").order("name");
    return (data ?? []).map((r) => ({ value: r.slug, label: r.name }));
  }
  if (source === "pages") {
    const { data } = await supabase.from("pages").select("key,title").is("archived_at", null).order("key");
    return (data ?? []).map((r) => ({ value: r.key, label: r.title ?? r.key }));
  }
  return [];
}

export const dynamicOptionsQuery = (source: OptionsSource) =>
  queryOptions({
    queryKey: ["cms", "setting-options", source],
    queryFn: () => resolveDynamicOptions(source),
    enabled: source !== "static",
    staleTime: 5 * 60_000,
  });
