
# Everything is a page — real edition

Turn the page builder into the single way content pages are shaped. Code holds only app functionality (auth, join wizard, article reader, admin, profile).

## The endgame

- Admin creates a new pillar in the pillars table → the URL exists → its page appears in the builder gallery → admin drops blocks → live.
- Every content page renders 100% from `pages.content.blocks`. No hardcoded JSX for hero copy, feature grids, mentor rows, etc.
- The admin only sees builder tiles for pages they can actually edit.

## Audit — what's here today

| Route file | Status | Notes |
|---|---|---|
| `index.tsx` (Home) | Builder-driven ✅ | 6 blocks in DB. Keep. |
| `about.tsx` | Builder-driven ✅ | 3 blocks. Keep. |
| `tadabbur.tsx` / `tazkiyah.tsx` / `youth.tsx` | Thin wrappers around `<PillarArchive>` component | 28 lines each. Pillar page has 0 blocks — the component ignores the page row and renders a hardcoded article/series grid. |
| `suhbah.tsx` | Bespoke (174 lines) | Hero + "what to look forward to" grid + mentors row + waitlist. All hardcoded. |
| `contact.tsx` | Bespoke (144 lines) | Hero + contact form + FAQ. |
| `resources.tsx` | Bespoke (142 lines) | Format tiles, series tiles. |
| `saved.tsx` | App page (bookmarks list) | Stays code. |
| `join.tsx`, `auth*.tsx`, `reset-password.tsx`, `read.$slug.tsx` | App pages | Stay code. |

## Plan

### 1. New block types

Add to `src/lib/page-blocks.tsx`:

- `pillar_hero` — pillar arabic letter + label + description, tint-aware. Auto-populates from the current pillar context, no fields.
- `pillar_articles` — articles grid filtered by current pillar (or explicit `pillar` field on non-pillar pages). Fields: `title`, `count`, `layout: grid|list`.
- `pillar_series` — series row filtered by current pillar. Fields: `title`, `count`.
- `previews_grid` — the "what to look forward to" cards. Fields: array of `{ icon?, tag?, title, description }`.
- `mentors_row` — circular photo + name + role. Fields: array of `{ avatar_url, name, role }`.
- `contact_form` — the contact form UI, submits to existing handler. Fields: `heading`, `description`, `success_message`.
- `format_gallery` — the resources page format tiles (auto-fetched, respects `show_on_site`). Fields: `title`, `description`.
- `series_gallery` — all series tiles. Fields: `title`, `description`.

Each gets a renderer in `page-blocks.tsx` and an inspector schema.

### 2. Dynamic pillar route

- Create `src/routes/$pillarSlug.tsx`. Loader fetches pillar by slug (404 if missing/archived) + page row keyed `pillar:<slug>`. Passes `pillarContext` to block renderer so pillar-scoped blocks know which pillar they're in.
- Add `$pillarSlug` to the excluded list in `$pageSlug.tsx` so the two catch-alls don't collide (pillars take precedence: check pillars table first, else fall through to pages).
- Delete `tadabbur.tsx`, `tazkiyah.tsx`, `youth.tsx`, `suhbah.tsx`.
- Delete `PillarArchive.tsx` (its logic moves into the `pillar_articles` + `pillar_series` block renderers).

### 3. Convert Contact and Resources to builder pages

- Delete `contact.tsx`, `resources.tsx`.
- Add `contact` and `resources` to the excluded list flip — they now resolve through `$pageSlug.tsx` reading the `pages` table.
- Seed their `pages` rows with blocks matching today's UI (see Seed section).

### 4. Seed every content page

Migration writes `pages.content.blocks` for:

- `pillar:tadabbur` → `[pillar_hero, pillar_articles, pillar_series, newsletter]`
- `pillar:tazkiyah` → same shape
- `pillar:youth` → same shape
- `pillar:suhbah` → `[pillar_hero, previews_grid (with current 4 cards), mentors_row (with current mentors), newsletter (waitlist copy)]`
- `contact` → `[hero, contact_form, faq_accordion(page_key='contact')]`
- `resources` → `[hero, format_gallery, series_gallery]`

Seed values are pulled verbatim from the current hardcoded JSX so nothing regresses visually.

### 5. Auto-create page row on pillar create

Update the Pillars admin "create" mutation: after inserting the pillar row, insert a `pages` row `pillar:<slug>` with a default template `[pillar_hero, pillar_articles, pillar_series, newsletter]`. Also extend the existing `sync_pillar_slug` DB trigger — it already renames the `pages.key` from `pillar:<old>` to `pillar:<new>`, so nothing extra needed for renames.

### 6. Clean up admin builder gallery

In `src/routes/_authenticated/admin/pages.index.tsx`, filter out app-page keys (`join`, anything under `auth`, `read`, `saved`, `reset-password`, `admin`, `profile`). Delete their orphaned `pages` rows (Join is the only one). Group tiles by section: Core (home, about, contact, resources), Pillars (dynamic list from pillars table), System (coming-soon, hidden templates).

### 7. Verify

- Playwright pass: load `/`, `/about`, `/contact`, `/resources`, `/tadabbur`, `/tazkiyah`, `/youth`, `/suhbah`. Screenshot each. Compare to current. Nothing regresses.
- Create a test pillar `sabr` in admin → visit `/sabr` → confirm default template renders → edit blocks → confirm changes appear → archive → confirm 404.

## Technical notes

- `pillar_hero`, `pillar_articles`, `pillar_series` read pillar context via a React context provided by `$pillarSlug.tsx`. On non-pillar pages they either hide themselves or require an explicit `pillar` field in the inspector (leaning toward hide — keeps the inspector clean).
- Sync trigger already handles slug renames across `articles.pillar`, `series.pillar`, `pages.key`, `faqs.page_key` — no change needed.
- Tints stay as enum dropdown (`heart | tazkiyah | gold | ink`) in the pillar inspector; new tints are still a code change (design token additions).
- The dynamic `$pillarSlug.tsx` loader uses the existing two-stage `pageStatusQuery` / `pageContentQuery` pattern so hidden/coming-soon pillars never leak content in the flash.

## What's explicitly out of scope

- App pages (join, auth, article reader, admin, profile, saved bookmarks) stay as code. These are functionality, not content.
- No design changes. Blocks reproduce current UI 1:1.
- Adding new tint tokens or Arabic letter options.
