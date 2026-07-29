import type { QueryClient } from "@tanstack/react-query";
import type { NavigateOptions } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type Navigate = (opts: NavigateOptions) => void | Promise<unknown>;

/**
 * Proper sign-out teardown:
 * - cancel in-flight queries so post-signout 401s don't flash
 * - clear the React Query cache so no protected data lingers in memory
 * - wipe user-scoped localStorage (bookmarks + any inshirah:user:* keys)
 * - sign out of Supabase (clears sb-* auth token)
 * - navigate home with history REPLACE so Back can't restore a protected view
 */
export async function signOutCompletely({
  queryClient,
  navigate,
}: {
  queryClient: QueryClient;
  navigate: Navigate;
}) {
  try {
    await queryClient.cancelQueries();
  } catch {
    /* ignore */
  }
  queryClient.clear();

  try {
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (
        k === "inshirah.bookmarks" ||
        k.startsWith("inshirah:user:") ||
        k.startsWith("inshirah.user:")
      ) {
        localStorage.removeItem(k);
      }
    }
    window.dispatchEvent(new Event("inshirah:bookmarks"));
  } catch {
    /* ignore */
  }

  try {
    await supabase.auth.signOut();
  } catch {
    /* ignore */
  }

  await navigate({ to: "/", replace: true });
}
