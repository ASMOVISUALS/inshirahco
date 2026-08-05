## Goal

Fix the messy overlapping reflection tiles on `/verse`, add a Popular / Recent selector, and make Refresh update only the tiles.

## 1. Stop the overlap — measured masonry layout

Today `FloatingReflections.tsx` positions every tile with `position: absolute` on a fixed row height (210px) and then animates each one by up to ±36px. Tiles are different heights (1-line vs 6-line reflections), so tall ones spill into the row below and the drift pushes them into each other.

Replace the hand-rolled grid with **`masonic`** (the standard React masonry package: it measures each child's real height with a resize observer and packs columns with no gaps and no overlap; it also virtualises long lists, which matters as reflections grow).

- Install `masonic`.
- `FloatingReflections` renders `<Masonry>` with responsive column count (1 on mobile, 2 on tablet, 3 on desktop) and a gutter of ~24px.
- Keep the "floating" feel without breaking the packing: each tile keeps a slow motion loop, but limited to a small transform-only drift (±4px translate, ±0.6deg rotate) plus a staggered fade/rise on mount. Because the amplitude stays well inside the gutter, tiles never touch. `prefers-reduced-motion` disables the drift as it does now.
- Mobile keeps the single-column stack.

## 2. Popular / Recent selector

A small horizontal segmented bar sits above the tiles, styled like the existing chip filters in the admin panel (rounded pill, tazkiyah green when active, muted otherwise):

```text
[ Popular ][ Recent ]              My Nottingham ISOC   ⟳ Refresh
```

- `sort` state in `verse.tsx`: `"popular"` (likes desc, then newest) — the current behaviour and the default — or `"recent"` (created_at desc).
- The existing "My org" checkbox and Refresh stay on the right of the same row.
- Sorting happens client-side in the existing `visibleReflections` memo, so switching is instant with no refetch.

## 3. Refresh refetches only the tiles

Today Refresh calls `invalidateQueries` on three keys, which puts the reflections query into a loading state and re-renders the section. Change it to:

- Call `refetch()` on the reflections / likes / my-reflections queries directly, so React Query keeps showing the current data while the new data loads (no blank flash, no layout jump, verse panel untouched).
- Spin the refresh icon (`animate-spin`) and disable the button while fetching, then stop.

## Technical notes

- New dependency: `masonic`.
- Files touched: `src/components/FloatingReflections.tsx` (masonry + toned-down drift), `src/routes/verse.tsx` (sort state, segmented control, refresh handler). No database or query-shape changes.
- `masonic` renders client-side only; the `/verse` route is already `ssr: false`, so there is no hydration concern.
