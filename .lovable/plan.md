## Goal

Replace the raw-JSON settings editor with a safe, typed, form-driven UI. Non-technical admins get proper controls (toggles, text, numbers, selects, multi-selects) — no way to break the site with a stray comma.

## Architecture

Schema-driven UI backed by two new tables that describe each setting and its fields. Values still live in `site_settings.value` (JSONB) so existing consumers (`auth_access`, `article_editor`, `nav`, `footer`) keep working unchanged.

```text
setting_groups (parent)          setting_fields (child)
─────────────────────            ─────────────────────
id, key, label, description,     id, group_id, key, label, help,
icon, sort_order                 field_type, required, default_value,
                                 options (jsonb), options_source,
                                 sort_order
```

`field_type`: `toggle | text | textarea | number | select | multiselect | color`
`options_source` (for select/multiselect, optional): `static` (use `options` array) | `block_kinds` | `pillars` | `formats` | `newsletters` | `pages`. Dynamic sources are resolved client-side from the existing hooks/queries so the article-editor "columnable kinds" select is always in sync with the real block palette.

Each setting's saved shape stays a flat JSON object keyed by field `key` → matches today's `EditorSettings`, `AuthAccess`, etc.

## Migrations

1. Create `setting_groups` and `setting_fields` (+ grants + RLS: public read, admin write via `has_role`).
2. Seed groups + fields for the three real settings in use:
   - **Account access** (`auth_access`): toggle `signinEnabled`, toggle `signupEnabled`, textarea `signinLockedMessage`.
   - **Article editor** (`article_editor`): number `max_columns` (min 1, max 3), multiselect `columnable_kinds` (source: `block_kinds`).
   - **Navigation** (`nav`) and **Footer** (`footer`): keep as-is for now with a "raw" fallback view (see below) — we don't yet know every consumer field, so we won't fake a schema.

## Admin UI (`/admin/settings`)

- Left rail: list from `setting_groups` (label + description).
- Right pane: form auto-rendered from `setting_fields`:
  - toggle → Switch
  - text → Input
  - textarea → Textarea
  - number → number Input with min/max
  - select → shadcn Select
  - multiselect → checkbox list (values from static `options` or resolved source)
- Save writes the assembled object to `site_settings.value` via upsert on `key`; validates required fields client-side; single "Save changes" button per group; dirty indicator.
- For groups without a schema yet (`nav`, `footer`), show a collapsed "Advanced (raw JSON)" panel so nothing is lost — clearly marked as advanced. Once we schema those too, the raw panel disappears.

## Users settings

The existing `/admin/users` page keeps its bespoke UI (it has the password-gated modal). No change to consumers.

## Out of scope

- No changes to how settings are read anywhere else. `auth-access.ts`, `SiteNav`, `SiteFooter`, and the article editor keep their current queries and shapes.
- No new admin-only tables of business content; this is strictly settings scaffolding.

## Rollout

1. Migration: create tables, RLS, seed rows for the three schemas above.
2. Rewrite `src/routes/_authenticated/admin/settings.tsx` as the schema renderer.
3. Add `src/lib/settings-schema.ts` with the dynamic option-source resolvers.
4. Verify: toggle `auth_access` from the new UI and confirm `/auth` gate still updates; change `article_editor.max_columns` and confirm the article builder honors it.
