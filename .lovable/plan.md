# Move everything to Supabase — full CMS-style admin

Right now, the content types (`article`, `podcast`, `video`, `tadabbur`, `book`, `worksheet`, etc.) already live in the `articles` table — you can add any of them from `/admin/articles` today. What's actually still hardcoded is:

- The four **pillars** and nine **formats** (their labels, descriptions, Arabic letters, colours)
- **Page copy** on Home, About, Life Architecture, Join, Contact
- The Life Architecture **FAQ**

This plan puts every one of those into Supabase and gives you an admin page to edit each without touching SQL.

## New database tables

- `pillars` — slug, label, short_label, arabic_letter, tint, description, sort_order, coming_soon
- `resource_formats` — slug, label, plural, arabic_letter, sort_order (the "article / podcast / video…" list)
- `pages` — key (`home`, `about`, `life-architecture`, `join`, `contact`), then a `content` JSONB of named copy blocks (hero eyebrow, hero title, body paragraphs, CTA labels, section titles, SEO title/description)
- `faqs` — page_key, question, answer, sort_order (used by Life Architecture; reusable elsewhere)
- `site_settings` — single-row key/value JSONB for nav labels, footer text, brand tagline

Existing `articles` / `reflections` / `testimonials` / `newsletter_signups` stay as they are.

RLS: public `SELECT` on all content tables; admin-only `INSERT/UPDATE/DELETE` via `has_role(auth.uid(), 'admin')`. `articles.pillar` and `articles.type` become foreign keys to the new `pillars.slug` / `resource_formats.slug` so admin dropdowns stay in sync.

## Frontend changes

- Delete the hardcoded `PILLARS` and `RESOURCE_TYPES` constants in `src/lib/content.ts`; replace with `pillarsQuery()` and `formatsQuery()` in `src/lib/queries.ts`.
- Every component that currently imports `PILLARS`/`RESOURCE_TYPES` (`ContentCard`, `PillarArchive`, `SearchOverlay`, `resources.tsx`, `SiteNav`, admin editors, home) reads from those queries instead.
- Each page (`index`, `about`, `life-architecture`, `join`, `contact`) fetches its `pages` row in the loader and renders every heading/paragraph/CTA from it. `head()` meta pulls its title & description from the same row.
- Pillar routes (`/quranic-reflections`, etc.) remain as fixed route files but their labels, hero eyebrow and intro come from the `pillars` row — no editorial text left in the JSX.

## New admin section — "Website content"

Added to the `/admin` nav alongside the existing tabs:

- `/admin/pillars` — list, create, edit, reorder, toggle "coming soon"
- `/admin/formats` — list, create, edit, reorder resource types
- `/admin/pages` — pick a page, edit each named copy block in a form (title, description, hero copy, body paragraphs, CTAs, SEO)
- `/admin/faqs` — grouped by page, add/edit/reorder Q&A pairs
- `/admin/settings` — nav labels, footer text, brand tagline

Existing `/admin/articles`, `/admin/reflections`, `/admin/testimonials`, `/admin/newsletter` stay.

## Seed data

Migration seeds the new tables with everything currently in the codebase word-for-word so the site looks identical after the switch — you then edit freely from `/admin`.

## Out of scope (intentional)

- **Route slugs stay fixed in code** (`/quranic-reflections`, `/tazkiyah-toolkit`, `/young-hearts`, `/life-architecture`). Renaming a pillar's URL would break shared links; you can rename the *label* freely, and mark any pillar "coming soon" from admin. If you later want fully dynamic `/pillar/$slug` routes so admins can add new pillars end-to-end, that's a follow-up.
- Auth pages (`/auth`, `/reset-password`) stay hardcoded — pure auth flow, no editorial copy.

## Technical notes

- All new tables follow the standard `id`, `created_at`, `updated_at`, RLS + `has_role` policy pattern already used in the project.
- Public reads use the browser Supabase client with TanStack Query (`ensureQueryData` in loader + `useSuspenseQuery` in component), matching the existing `articlesQuery` / `testimonialsQuery` pattern.
- Admin mutations use the browser client under the `_authenticated/admin` layout, which already gates on `has_role`.
- Loaders that were `ssr: false` stay that way; new content routes render at request time, so edits show up instantly with a page refresh.
