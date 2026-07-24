## Goal

Turn `/admin/pages` into a mini web builder (in the spirit of the article editor, but with its own block library tuned for marketing pages). Every existing page must render **identically** after the migration — no visual regressions allowed.

## 1. New page-block model

Introduce a page-block schema separate from article blocks, stored on `pages.content.blocks` (JSONB array). Each block: `{ id, type, props }`.

Initial block library (built from scratch for pages):

**Layout / structure**
- `hero` (eyebrow, arabic watermark, two title lines, description, up to 2 CTAs)
- `section_header` (eyebrow + title + optional description)
- `two_column` / `three_column` container (holds child blocks)
- `divider`, `spacer`

**Marketing / content**
- `rich_text` (paragraphs, headings, lists — for About body etc.)
- `feature_grid` (icon + title + description cards)
- `pillar_cards` (pulls live pillars from Supabase)
- `cta_banner` (title, description, button)
- `stat_row`, `logo_row`, `image` / `image_text_split`
- `testimonials_row` (pulls from testimonials table)
- `reflection_spotlight` (pulls reflection_of_the_day)
- `latest_articles` (auto list, filter by pillar)
- `faq_accordion` (pulls from faqs, filterable)
- `newsletter_block`
- `arabic_verse` (reuses `QuranFetcher`)
- `founder_letter` (arabic sigil + role + letter body)
- `success_state` (arabic + title + description — used by /join, /contact)
- `raw_html` (escape hatch)

The library is data-driven (`src/lib/page-blocks.ts`) so blocks can be added later without touching pages.

## 2. Zero-regression migration

For every existing row in `pages`, deterministically convert the current key/value JSON into the new `blocks` array so the rendered output is byte-identical.

- Each existing page route (`index`, `about`, `join`, `contact`, four pillar pages, `life-architecture`, etc.) gets a small mapper: existing keys → an ordered list of blocks with the same copy.
- Mapping happens in a one-shot script executed via `supabase--insert` after the schema migration; the resulting `blocks` array is written back into `content.blocks` while the legacy keys are kept in `content.legacy` as a safety net.
- Each page route is refactored to render from `content.blocks` via a `<PageRenderer />` component. If `blocks` is missing it falls back to the legacy renderer, so nothing can go dark mid-migration.
- Acceptance: every existing route diffed visually before/after — hero copy, order, CTAs, arabic sigils, founder letter, success states, SEO tags all unchanged.

## 3. Create brand-new pages

- Add `pages.slug`, `pages.title`, `pages.is_published`, `pages.template` columns (keep `key` for legacy fixed pages).
- Add a catch-all route `src/routes/$pageSlug.tsx` that loads the page by slug and renders it through `<PageRenderer />`. Fixed routes (index, about, …) keep their own files and simply mount `<PageRenderer blocks={…} />`.
- Admin: "New page" button → prompts for title + slug + starting template (Blank, Pillar page, Landing) → creates row → opens the builder.

## 4. Admin builder UI (`/admin/pages`)

Replaces the current key/value table. Layout mirrors the article editor:

```text
┌─────────────────────────────────────────────────────────────┐
│  Pages list (left rail)   │   Builder canvas                │
│  • home                    │  ┌─ Toolbar: undo/redo, view ─┐│
│  • about                   │  │                            ││
│  • join                    │  │  [Blocks column]  [Preview]││
│  • + New page              │  │                            ││
└─────────────────────────────────────────────────────────────┘
```

- Left rail: list of pages (grouped: Core, Pillars, Custom), search, "+ New page".
- Middle: block list — drag to reorder, hover-trash, click a block to edit its props in an inline form (same interaction language as the article editor). Left-side flyout palette grouped: Layout, Content, Marketing, Data, Media, Advanced.
- Right: **live preview pane** rendering the real `<PageRenderer />` against draft state at the target viewport (desktop/tablet/mobile toggle). Updates on every edit.
- Undo/redo history per session, save button, unsaved-changes warning on nav away, "View live" link.
- Password gate reused from Pillars for destructive actions (delete page, change slug).

## 5. Technical notes

- New files: `src/lib/page-blocks.ts` (registry), `src/components/page-renderer/*` (one component per block, plus `<PageRenderer />`), `src/routes/_authenticated/admin/pages.$key.edit.tsx` (builder), `src/routes/$pageSlug.tsx` (dynamic).
- Schema migration adds `slug`, `title`, `is_published`, `template`, and a `blocks` field on content — no destructive changes. GRANTs + RLS follow the same pattern as existing pages table.
- Data-pulling blocks (pillars, testimonials, faqs, articles) use existing TanStack Query hooks so they stay live.
- Reused primitives: `QuranFetcher`, `NewsletterSignup`, `ReflectionOfTheDay`, `MediaCarousel`, `ContentCard`.
- Article editor is untouched.

## 6. Rollout order

1. Migration: add columns; keep everything running on legacy JSON.
2. Ship `<PageRenderer />` + full block library.
3. Backfill `content.blocks` for every existing page via a mapper; refactor each route to render from blocks with legacy fallback.
4. Ship the new admin builder UI + create-page flow + dynamic route.
5. Remove the old key/value table.

Deliverable is complete only when every existing page still renders identically and a brand-new page can be created and published entirely from the admin.
