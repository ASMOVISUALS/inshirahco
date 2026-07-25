# Plan

## 1. Page status model

**DB migration on `pages`:**
- Add `status text not null default 'published' check (status in ('published','hidden','coming_soon'))`.
- Backfill: rows with `is_locked = true` → `status = 'hidden'`.
- Keep `is_locked` for one migration cycle (drop later) so nothing breaks mid-deploy.

**Admin UI (`pages.index.tsx`):**
- Replace the single lock/unlock button with a **"Change status"** button.
- Clicking opens a full-screen overlay with three side-by-side cards: **Published / Hidden / Coming soon**. Each shows an icon, name, and description between the header and body. Selecting highlights (brand ring + tint).
- A **Confirm** button below opens the existing `AdminPasswordGate`. On verify, mutation writes the new status.
- Sidebar list keeps a small status pill (green/red/gold) next to each page title instead of just a padlock.

**Public rendering (`queries.ts` + all public routes + `$pageSlug.tsx`):**
- `getPageContent` returns `status` alongside content.
- `published` → normal render (unchanged).
- `hidden` → render `HiddenTemplate` (from the two shared system pages, see §2).
- `coming_soon` → render `ComingSoonTemplate`.
- Both are rendered via the standard `PageRenderer` so they inherit any edits made in the builder.

## 2. Shared Hidden / Coming Soon templates

Two new system pages seeded in the `pages` table:
- `system:hidden` (slug `_hidden`, not routable publicly)
- `system:coming-soon` (slug `_coming-soon`, not routable publicly)

They appear in the admin Pages list under a new **System** group (below Core/Pillars/Custom). Editing opens the same builder — no special UI needed.

**Variables in blocks:**
- Extend `PageRenderer` / builder to support `{{page_name}}` (and `{{page_slug}}`) tokens in any text field.
- When rendering a template because another page is hidden/coming-soon, the renderer substitutes `{{page_name}}` with that host page's `title`.
- Inspector fields that support variables show a small hint chip: *"Insert {{page_name}}"*.

**Default seed content:**
- Hidden template mirrors the current `HiddenPage.tsx` design as builder blocks (eyebrow using `{{page_name}}`, Fraunces headline, subtitle, explore-nav chip row, Arabic verse). `HiddenPage.tsx` is retired.
- Coming Soon template = same layout, different copy, plus a `NewsletterSignup` block at the bottom (bound to a "General waitlist" newsletter by default).

**New/updated block library entries** (all editable in builder):
- `hero_fullscreen` — full-viewport headline with eyebrow (variable-aware), watermark, Arabic pattern background.
- `explore_pages` — the chip row of links to other pages (auto-pulled from published pages, or manual list).
- `arabic_verse` — Arabic + optional translation, centered.
- Existing `newsletter` block extended (see §3).

## 3. Newsletters system

**DB migrations:**
- New `newsletters` table: `id`, `slug` (unique), `name`, `description`, `is_default bool`, timestamps. Owner-only writes; public read for active lists so the block can render a name.
- Add `newsletter_id uuid` FK to `newsletter_signups` (nullable during backfill).
- Backfill: create a "General" newsletter, set all existing signups to it, then set column NOT NULL.
- Unique index `(newsletter_id, lower(email))` — dedupes per list, allows the same email on multiple lists.
- GRANTs per project rules; RLS: anon can INSERT into `newsletter_signups` (existing behaviour) but must supply a valid `newsletter_id`; admins can read all.

**Signup logic:**
- `NewsletterSignup` component takes a `newsletterId` prop. Insert becomes `{ email, newsletter_id, source }`. On unique-violation, treat as success (idempotent).

**Newsletter block inspector:**
- Add a "Newsletter" dropdown listing all newsletters (label = name, value = id). Default to the `is_default` list. Stored on the block as `newsletterId`.
- Preserves existing heading/description/CTA fields.

**Admin `/admin/newsletter` rework:**
- Left column: list of newsletters with "New newsletter" button (name + auto slug + description; one can be marked default).
- Right column: selected newsletter's subscribers table (email, source, signed-up date) + count + CSV export button.
- Deleting a newsletter is blocked if it has subscribers (or requires typing the slug to confirm) — safer default: block + offer "move subscribers to…".
- Sending campaigns is explicitly out of scope for v1.

## 4. Cleanup / follow-ups
- Remove `HiddenPage.tsx` after templates render correctly.
- Drop `is_locked` in a follow-up migration once no code reads it.
- Update `src/lib/queries.ts`, `use-cms.ts`, and every route currently checking `is_locked` to use `status` instead.

## Technical notes
- Overlay uses the existing `Dialog` primitive with a custom full-screen content class; radio-group semantics for a11y.
- Variable substitution is a small pure helper (`substituteVars(text, { page_name })`) applied inside each block's text render path — no runtime template engine.
- Password gate reused verbatim; the confirm button in the status overlay just opens it and passes the chosen status into the mutation on verify.
- All new tables follow the required GRANT + RLS + updated_at trigger structure.
