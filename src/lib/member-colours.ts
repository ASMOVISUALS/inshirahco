import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { brandColourVar } from "@/lib/brand-colours";

/** Stored as brand colour tokens (see `BRAND_TEXT_COLOURS`), not raw hex. */
export const DEFAULT_MEMBER_COLOURS = { admin_color: "heart", special_color: "tazkiyah" };

export type MemberColours = typeof DEFAULT_MEMBER_COLOURS;

/** Username colours, set by admins in Settings → Member colours. */
export const memberColoursQuery = () =>
  queryOptions({
    queryKey: ["cms", "settings", "member_colours"],
    queryFn: async (): Promise<MemberColours> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "member_colours")
        .maybeSingle();
      if (error) throw error;
      const v = (data?.value ?? {}) as Partial<MemberColours>;
      return { ...DEFAULT_MEMBER_COLOURS, ...v };
    },
    staleTime: 5 * 60_000,
  });

/**
 * Returns a colour for a member's role tag. Ordinary members get `undefined`,
 * meaning "inherit the normal body colour".
 */
export function useUsernameColour() {
  const { data: colours = DEFAULT_MEMBER_COLOURS } = useQuery(memberColoursQuery());
  return (roleTag: string | undefined): string | undefined => {
    if (roleTag === "admin") return brandColourVar(colours.admin_color, DEFAULT_MEMBER_COLOURS.admin_color);
    if (roleTag === "special") return brandColourVar(colours.special_color, DEFAULT_MEMBER_COLOURS.special_color);
    return undefined;
  };
}
