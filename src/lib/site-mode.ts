import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteMode = "live" | "coming_soon" | "maintenance";

export interface SiteModeSettings {
  mode: SiteMode;
  headline: string;
  message: string;
  newsletter: boolean;
  note: string;
}

const DEFAULT: SiteModeSettings = {
  mode: "live",
  headline: "",
  message: "",
  newsletter: true,
  note: "",
};

export const siteModeQuery = () =>
  queryOptions({
    queryKey: ["cms", "settings", "site_mode"],
    queryFn: async (): Promise<SiteModeSettings> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "site_mode")
        .maybeSingle();
      if (error) throw error;
      const v = (data?.value ?? {}) as Partial<SiteModeSettings>;
      const mode = v.mode === "coming_soon" || v.mode === "maintenance" ? v.mode : "live";
      return {
        mode,
        headline: v.headline ?? "",
        message: v.message ?? "",
        newsletter: v.newsletter ?? true,
        note: v.note ?? "",
      };
    },
    staleTime: 15_000,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

export function useSiteMode(): SiteModeSettings {
  const { data } = useQuery({ ...siteModeQuery(), placeholderData: DEFAULT });
  return data ?? DEFAULT;
}
