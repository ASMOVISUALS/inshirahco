import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuthAccess {
  signinEnabled: boolean;
  signupEnabled: boolean;
  signinLockedMessage: string;
}

const DEFAULT: AuthAccess = {
  signinEnabled: true,
  signupEnabled: true,
  signinLockedMessage: "",
};

export const authAccessQuery = () =>
  queryOptions({
    queryKey: ["cms", "settings", "auth_access"],
    queryFn: async (): Promise<AuthAccess> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "auth_access")
        .maybeSingle();
      if (error) throw error;
      const v = (data?.value ?? {}) as Partial<AuthAccess> & Record<string, unknown>;
      return {
        signinEnabled: v.signinEnabled ?? (v as { signin_enabled?: boolean }).signin_enabled ?? true,
        signupEnabled: v.signupEnabled ?? (v as { signup_enabled?: boolean }).signup_enabled ?? true,
        signinLockedMessage:
          v.signinLockedMessage ??
          (v as { signin_locked_message?: string }).signin_locked_message ??
          "",
      };
    },
    staleTime: 30_000,
  });

export function useAuthAccess(): AuthAccess {
  const { data } = useQuery({ ...authAccessQuery(), placeholderData: DEFAULT });
  return data ?? DEFAULT;
}
