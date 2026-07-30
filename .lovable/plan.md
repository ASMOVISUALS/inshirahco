## Goal

The navbar currently hardcodes: pillars (from the `pillars` table) + an "About" link. Instead, admins choose which pages appear in the navbar, in what order, and with what label — all from the Pages panel.

## Approach

Make the `pages` table the single source of truth for navigation. Pillar pages already exist there as rows keyed `pillar:<slug>`, so pillars and normal pages get the same on/off control.

### 1. Database

Add three columns to `public.pages`:
- `in_nav` (boolean, default false)
- `nav_label` (text, nullable — falls back to the page title / pillar short label)
- `nav_order` (integer, default 0)

Seed: set `in_nav = true` for the four pillar pages (order 1–4) and the About page (order 5), so the navbar looks exactly as it does today after the change.

### 2. Pages panel UI

In the Active tab of `/admin/pages`, each page card gets a "Nav" control:
- A toggle "Show in navbar" (same click-to-reveal actions pattern as existing status controls).
- When on, an inline label field (placeholder = page title) so the nav can show a short name.
- A dedicated "Navbar" section at the top of the page listing only the pages currently in the nav, drag-to-reorder (same HTML5 drag pattern used for the verse queue) to set `nav_order`.

Rules:
- Only non-archived, non-hidden pages can be added to the nav; archiving or hiding a page automatically drops it from the navbar.
- No password gate on nav toggles (it's presentation only, not access control) — say the word if you want it gated.

### 3. Frontend nav

- New `navItemsQuery` in `src/lib/queries.ts` fetching pages where `in_nav` is true, not archived, status not hidden, ordered by `nav_order`.
- `SiteNav.tsx` (desktop + mobile menus) renders that list instead of `usePillars()` + hardcoded About. Contact / Saved / auth buttons in the mobile drawer stay as-is.
- Falls back to the current pillar-based list if the query returns nothing, so the nav is never empty.

## Technical notes

- Public read of the new columns is covered by the existing pages select policy; admin update by the existing admin policy.
- Coming-soon pillar pages keep rendering their coming-soon state; they just appear in the nav if toggled on.
- `SiteFooter` links are left untouched.
