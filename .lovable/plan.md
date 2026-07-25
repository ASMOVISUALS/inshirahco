## Replace Pages admin JSON editor with a tiled gallery

Drop the legacy JSON field table entirely. The Pages admin becomes a gallery of tiles — one per page — with actions surfacing only on the selected tile. SEO fields move into the block builder's inspector so nothing regresses.

### New Pages admin (`/admin/pages`)

- Layout: responsive tiled gallery (same grid feel as the Reflections / Testimonials pages), grouped by **Core**, **Pillars**, **Custom**, with a **+ New page** button at the top.
- Tile (default state) shows only:
  - Title
  - `/slug` (monospace, muted)
  - Status badge (Published / Hidden / Coming soon, colored per current tokens)
- Tile (selected/active state) reveals action buttons at the bottom:
  - **Status** button → opens the existing 3-option overlay + `AdminPasswordGate`
  - **Open builder** (primary) → `/admin/pages/$key/builder`
  - **View live** → opens `/{slug}` in a new tab
  - **Delete** → only for `custom:` keys, password-gated; core and pillar pages have no delete button
- Clicking a tile toggles it as active; clicking elsewhere/another tile deselects. Keyboard: Enter opens the builder on the active tile.
- No editor pane, no JSON table, no "Add field" — that whole right-hand column is removed.

### SEO fields move into the builder

- In `/admin/pages/$key/builder`, add a small **Page settings** panel in the inspector sidebar (visible when no block is selected, or via a "Page" tab at the top of the inspector).
- Fields: `seo_title`, `seo_description`. Saved back into `pages.content` alongside `blocks` so `$pageSlug.tsx`'s existing head() logic keeps working unchanged.
- No migration needed — existing legacy keys stay in the DB untouched; they simply stop being editable through the UI. `PageRenderer` already ignores non-block keys.

### Delete flow (custom pages)

- Confirmation dialog → `AdminPasswordGate` → `DELETE FROM pages WHERE key = ...` (client-side via supabase client, RLS already restricts to admins).
- After delete, gallery invalidates and the tile disappears. If the deleted tile was active, selection clears.

### Files touched

- `src/routes/_authenticated/admin/pages.index.tsx` — rewrite: remove `PageEditor`, `PageList` sidebar, JSON table, add-field, save-fields logic. Build gallery + tile component. Keep the existing `StatusOverlay` + `AdminPasswordGate` wiring; move it to fire from the active tile.
- `src/routes/_authenticated/admin/pages.$key.builder.tsx` — add a "Page settings" section to the inspector for `seo_title` / `seo_description`, persisted into the same `content` object on save.

### Out of scope

- No DB schema changes.
- No changes to public routes, `SystemTemplate`, or `$pageSlug.tsx`.
- Legacy JSON keys other than SEO are left in the DB as-is (harmless; renderer ignores them).