## Goal

Make "Sign out" a real teardown: no cached protected data, no in-flight query flashes, no back-button restore, and clear any user-scoped local storage.

## Current state (verified)

`src/components/SiteNav.tsx` does only:
```ts
await supabase.auth.signOut();
navigate({ to: "/" });
```
- React Query cache (profile, bookmarks, admin data fetched during the session) stays in memory.
- In-flight queries can resolve after `signOut()` and log 401s / flash errors.
- `navigate` pushes history, so Back can re-render the previous protected shell against a cleared session.
- Bookmarks and any other per-user data stored in `localStorage` are not cleared.

The root `onAuthStateChange` in `__root.tsx` handles `SIGNED_OUT` with `router.invalidate()` — good, but doesn't touch the query cache or history.

## Changes

### 1. Centralize sign-out — `src/lib/auth.ts` (new)

Single helper used by every sign-out entry point:

```ts
export async function signOutCompletely({ queryClient, navigate }) {
  await queryClient.cancelQueries();      // stop in-flight before 401s land
  queryClient.clear();                    // drop all cached protected data
  // clear user-scoped local storage (bookmarks, any "inshirah:*" per-user keys)
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith("inshirah:bookmarks") || k.startsWith("inshirah:user:")) {
        localStorage.removeItem(k);
      }
    }
  } catch {}
  await supabase.auth.signOut();          // clears sb-* auth token
  navigate({ to: "/", replace: true });   // history REPLACE, not push
}
```

Exact `localStorage` key prefixes will be confirmed by grepping `localStorage.setItem` before writing the helper (bookmarks + any user-scoped keys).

### 2. Wire it into `SiteNav.tsx`

Replace the inline `signOut` with `signOutCompletely`, passing `useQueryClient()` and `useNavigate()`. Applies to both desktop and mobile buttons.

### 3. Leave `__root.tsx` `onAuthStateChange` as-is

It already calls `router.invalidate()` on `SIGNED_OUT` and (correctly) does NOT `invalidateQueries` on sign-out. The new helper owns cache teardown; the listener owns route re-evaluation → protected routes bounce to `/auth`.

## What this does and does NOT do

Does:
- Clears Supabase session token from `localStorage`.
- Clears the entire React Query cache (profile, admin lists, bookmarks queries, etc.).
- Cancels in-flight queries so no 401 flashes.
- Removes user-scoped `localStorage` entries (bookmarks).
- Uses history REPLACE so Back can't restore a protected page shell.

Does NOT (and can't, by design):
- Purge JS module state from other tabs — those get signed out via Supabase's cross-tab `onAuthStateChange`, but their in-memory React state only fully resets on next navigation/refresh. If you want a hard guarantee, we can add `location.reload()` after `navigate` — trade-off is a visible full reload. Tell me if you want that.
- Revoke the refresh token server-side beyond what `supabase.auth.signOut()` already does (it revokes the current session by default).
