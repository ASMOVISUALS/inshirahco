## Problem

Pages set to Hidden or Coming Soon flash their real content for a split second before the system template replaces it.

Cause: the affected routes (`about`, `contact`, `life-architecture`, and the pillar routes via `PillarArchive`) fetch the page bundle with `useQuery` (non-suspending). While the bundle is loading, `bundle?.status` is `undefined`, so the status guard falls through and the real page markup renders. When the query resolves as `hidden`/`coming_soon`, React swaps to `SystemTemplate` — hence the flash.

`$pageSlug.tsx` already does this correctly (loader ensures data, component uses `useSuspenseQuery`, status is known on first paint), so no changes there.

## Fix

For every route that gates on page status, know the status before the first render and never mount the real page (or its sibling data queries) when locked.

### Files to change

1. `src/routes/about.tsx`
   - Loader already calls `ensureQueryData(pageQuery("about"))`; swap the component's `useQuery` for `useSuspenseQuery`.
   - Do the `hidden` / `coming_soon` status check first, before reading any other content fields.

2. `src/routes/contact.tsx`
   - Add `loader: ({ context }) => { context.queryClient.ensureQueryData(pageQuery("contact")); }` if missing.
   - Switch the bundle read to `useSuspenseQuery`.
   - Status check runs before any other rendering.

3. `src/routes/life-architecture.tsx`
   - Same treatment: ensure the page bundle in the loader, read it via `useSuspenseQuery`, status-check first.

4. `src/components/PillarArchive.tsx`
   - Switch `pageQuery(\`pillar:${pillar}\`)` from `useQuery` to `useSuspenseQuery`.
   - Move the `hidden` / `coming_soon` check to the top of the component, **before** `useSuspenseQuery(articlesQuery())` and any `useMemo`/state that touches article data, so locked pillars never trigger the articles fetch.
   - Update the three pillar route files (`quranic-reflections.tsx`, `tazkiyah-toolkit.tsx`, `young-hearts.tsx`) to add a loader that calls `context.queryClient.ensureQueryData(pageQuery(\`pillar:${pillar}\`))` so the suspense read has data on first paint (avoiding a suspense fallback where none existed before).

### Notes

- No schema, RLS, or admin changes; purely a client-side fetch-order fix.
- The `SystemTemplate` itself already blocks content until its own template query resolves, so no additional flash there.
- Behavior for `published` pages is unchanged.