# Supabase Backend Integration Plan

Admin seed: **inshirahco@proton.me** (auto-promoted to `admin` in `user_roles` on first signup via trigger).

## 1. Database schema (single migration)

Tables (all with `id uuid`, `created_at`, `updated_at` where relevant, RLS enabled, GRANTs, `updated_at` trigger):

- `pillars` — slug, name, tagline, description, accent_token, sort_order
- `resource_types` — slug, label, icon
- `articles` — slug, title, subtitle, body (markdown), excerpt, hero_image, pillar_id, resource_type_id, author, reading_minutes, published, published_at, tags[]
- `reflections_of_the_day` — arabic, translation, source, reflection, active_date
- `testimonials` — name, role, quote, avatar_url, featured
- `newsletter_signups` — email (unique), source, consented_at
- `profiles` — user_id (FK auth.users, cascade), name, dob, gender, email
- `app_role` enum (`admin`, `member`) + `user_roles` (user_id, role)
- `bookmarks` — user_id, article_id, unique(user_id, article_id)

Helpers:
- `has_role(_user_id, _role)` SECURITY DEFINER
- `handle_new_user()` trigger on `auth.users` insert → creates `profiles` row from `raw_user_meta_data` and, if email = `inshirahco@proton.me`, inserts admin `user_roles` row
- `set_updated_at()` trigger fn

### RLS policies (summary)

- **Public read (anon + authenticated):** `pillars`, `resource_types`, `articles` (only `published = true`), `reflections_of_the_day`, `testimonials`
- **Admin write** (via `has_role(auth.uid(), 'admin')`) on all content tables
- **profiles:** user reads/updates own; admin reads all
- **newsletter_signups:** anon+authenticated INSERT; admin SELECT
- **bookmarks:** user manages own
- **user_roles:** user reads own; admin manages all

## 2. Seed content

Migration inserts current mock content from `src/lib/content.ts` (4 pillars, resource types, ~sample articles, sample reflections, testimonials) so the site keeps rendering after cutover.

## 3. Server functions (`src/lib/*.functions.ts`)

Public reads (publishable-key server client):
- `listPillars`, `listResourceTypes`, `listArticles({ pillar?, type?, q? })`, `getArticleBySlug`, `getTodayReflection`, `listTestimonials`, `subscribeNewsletter`

Auth-scoped (`requireSupabaseAuth`):
- `listMyBookmarks`, `toggleBookmark`, `getMyProfile`, `updateMyProfile`

Admin (checks `has_role` via `context.supabase`, then dynamic-imports `supabaseAdmin` only where needed):
- `adminListArticles/Upsert/Delete`, `adminListReflections/Upsert/Delete`, `adminListTestimonials/Upsert/Delete`, `adminListNewsletter`

## 4. Frontend wiring

- Replace mock imports across `index.tsx`, `quranic-reflections.tsx`, `tazkiyah-toolkit.tsx`, `young-hearts.tsx`, `resources.tsx`, `read.$slug.tsx`, `ReflectionOfTheDay`, `PillarArchive` with TanStack Query (`ensureQueryData` in loaders, `useSuspenseQuery` in components). Add `errorComponent` + `notFoundComponent` to loader routes.
- `NewsletterSignup` calls `subscribeNewsletter` server fn.
- `/join` wizard → real `supabase.auth.signUp` with `emailRedirectTo: window.location.origin`, passing `name/dob/gender` via `options.data` so the trigger seeds `profiles`.
- New `/auth` route: sign-in + password reset request. New `/reset-password` public route.
- Root: `onAuthStateChange` filtered subscriber → `router.invalidate()` + query invalidate; SiteNav swaps Join/Sign-in for account menu + sign-out when session exists.
- `useBookmarks`: if signed in, source of truth = server; localStorage becomes fallback + one-time migration on first authenticated load.

## 5. Admin UI (under `_authenticated/`)

New pathless layout `src/routes/_authenticated/_admin/route.tsx` calls `requireAdmin` server fn in `beforeLoad`; redirects non-admins to `/`.

Pages:
- `/admin` — dashboard (counts)
- `/admin/articles` — list + create/edit form (markdown textarea, pillar/type selects, publish toggle)
- `/admin/reflections` — CRUD
- `/admin/testimonials` — CRUD
- `/admin/newsletter` — read-only list + CSV export

## 6. Post-migration checks

Run `supabase--linter`, verify build, sign up with `inshirahco@proton.me`, confirm admin gate + a CRUD round-trip on articles.

## Notes / caveats

- Managed Cloud Supabase is already enabled and healthy. Since you say you also linked your own Supabase via connectors: I'll build against the project whose env vars are in `.env` (currently the managed one, ref `mxozodtilpebntzpotva`). If you want me to point at a different project instead, say the word before I run the migration.
- No image upload/storage bucket in this pass — hero images stay as URLs. Easy add-on later.
