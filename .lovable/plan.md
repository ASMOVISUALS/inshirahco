# Id-based Pillar Refactor + Slug Rename

Move `articles` and `series` off text-based FKs pointing at `pillars.slug` and onto proper uuid FKs pointing at `pillars.id`. Once done, renaming a slug is a one-line update with no ripple effects. Then rename the four slugs.

## Why

Today `articles.pillar` and `series.pillar` are `text` columns FK-linked to `pillars.slug`. Renaming a slug requires updating every child row and touching every hardcoded reference in code. After this refactor, `slug` becomes a pure URL handle — safe to rename anytime.

## Stage 1 — Schema migration (one call)

1. `pillars`
   - Add `id uuid not null default gen_random_uuid()`, backfill, add `UNIQUE(id)` (keep `slug` as PK for now to avoid breaking existing FKs mid-migration).
2. `articles`
   - Add `pillar_id uuid`.
   - Backfill: `UPDATE articles SET pillar_id = p.id FROM pillars p WHERE articles.pillar = p.slug`.
   - Add FK `articles.pillar_id → pillars.id ON UPDATE CASCADE ON DELETE RESTRICT`.
   - Make `pillar_id` `NOT NULL`.
3. `series` — same treatment as articles.
4. Swap PK: drop old text FKs (`articles.pillar`, `series.pillar` FK constraints), drop PK on `pillars.slug`, add PK on `pillars.id`, add `UNIQUE(slug)`.
5. Keep the legacy `articles.pillar` / `series.pillar` text columns for now (backfilled, no FK) so nothing in the app breaks the moment the migration lands. They become derived/redundant and get dropped in Stage 3.

## Stage 2 — Code migration

Update everything that reads/writes the pillar link to use `pillar_id`:

- `src/lib/queries.ts` — article & series fetchers select `pillar_id`, join on pillars for slug/label when needed.
- `src/hooks/use-cms.ts` — expose pillar lookup by id.
- Admin editors: article editor (`_authenticated/admin/articles/$id.tsx`), series editor — pillar picker writes `pillar_id`.
- Public routes filtering by pillar (`/tadabbur`, etc.): resolve slug → id once, then query by id.
- Types: regenerate Supabase types after migration; update `Article`/`Series` interfaces.

Keep writing `pillar` (slug) too during a short transition if useful, or stop writing it immediately since it's about to be dropped.

## Stage 3 — Slug rename (trivial after Stage 2)

Single `UPDATE pillars SET slug = ... WHERE slug = ...` per row:
- `quranic-reflections` → `tadabbur`
- `tazkiyah-toolkit` → `tazkiyah`
- `young-hearts` → `youth`
- `life-architecture` → `suhbah`

Then:
- Rename route files: `quranic-reflections.tsx` → `tadabbur.tsx`, `tazkiyah-toolkit.tsx` → `tazkiyah.tsx`, `young-hearts.tsx` → `youth.tsx`, `life-architecture.tsx` → `suhbah.tsx`.
- Update `pillars.href` values to match.
- Update hardcoded slug fallbacks in `src/lib/content.ts` and `src/hooks/use-cms.ts`.
- Update sitemap, nav links, any `Link to="/quranic-reflections"` etc.
- Drop the redundant `articles.pillar` and `series.pillar` text columns.

## Out of scope (for now)

- `resource_formats.slug`, `pages.key`, `faqs.page_key` — same pattern applies but no rename is pending. Can be done later if you want.

## Confirm before I start

I'll do Stage 1 as one migration (you'll approve the SQL), then Stage 2 code changes, then Stage 3 (rename migration + file renames + code updates + column drop) as a second migration. Sound good?
