## Goal

Rename all four pillar slugs (and route files) to short, single-word identifiers, and update every reference across the DB, code, and content so nothing breaks.

## Slug mapping

| Old slug | New slug | Label |
| --- | --- | --- |
| `quranic-reflections` | `tadabbur` | Tadabbur |
| `tazkiyah-toolkit` | `tazkiyah` | Tazkiyah |
| `young-hearts` | `youth` | Youth |
| `life-architecture` | `suhbah` | Suhbah |

Labels are also shortened for consistency. If you'd rather keep the old display labels (e.g. "Qur'anic Reflections", "Life Architecture") and only rename the slug/URL, tell me and I'll skip the label update.

## Changes

### 1. Data update (insert tool, not migration — data only)

Update in dependency-safe order inside a single transaction:

```sql
BEGIN;
-- articles + series reference pillar slug as text (no FK cascade)
UPDATE articles SET pillar = 'tadabbur' WHERE pillar = 'quranic-reflections';
UPDATE articles SET pillar = 'tazkiyah' WHERE pillar = 'tazkiyah-toolkit';
UPDATE articles SET pillar = 'youth'    WHERE pillar = 'young-hearts';
UPDATE articles SET pillar = 'suhbah'   WHERE pillar = 'life-architecture';

UPDATE series   SET pillar = 'tadabbur' WHERE pillar = 'quranic-reflections';
UPDATE series   SET pillar = 'tazkiyah' WHERE pillar = 'tazkiyah-toolkit';
UPDATE series   SET pillar = 'youth'    WHERE pillar = 'young-hearts';
UPDATE series   SET pillar = 'suhbah'   WHERE pillar = 'life-architecture';

-- pillars table itself + href + label
UPDATE pillars SET slug='tadabbur', href='/tadabbur', label='Tadabbur' WHERE slug='quranic-reflections';
UPDATE pillars SET slug='tazkiyah', href='/tazkiyah', label='Tazkiyah' WHERE slug='tazkiyah-toolkit';
UPDATE pillars SET slug='youth',    href='/youth',    label='Youth'    WHERE slug='young-hearts';
UPDATE pillars SET slug='suhbah',   href='/suhbah',   label='Suhbah'   WHERE slug='life-architecture';

-- pages keyed by "pillar:<slug>" for locked/coming-soon status
UPDATE pages SET key = replace(key, 'pillar:quranic-reflections', 'pillar:tadabbur') WHERE key LIKE 'pillar:quranic-reflections%';
UPDATE pages SET key = replace(key, 'pillar:tazkiyah-toolkit',    'pillar:tazkiyah') WHERE key LIKE 'pillar:tazkiyah-toolkit%';
UPDATE pages SET key = replace(key, 'pillar:young-hearts',        'pillar:youth')    WHERE key LIKE 'pillar:young-hearts%';
UPDATE pages SET key = replace(key, 'pillar:life-architecture',   'pillar:suhbah')   WHERE key LIKE 'pillar:life-architecture%';
COMMIT;
```

Pre-check with a read query for any other tables that store the old slug (link tables, settings JSON) so nothing is missed before the transaction runs.

### 2. Route files (rename)

```
src/routes/quranic-reflections.tsx  → src/routes/tadabbur.tsx
src/routes/tazkiyah-toolkit.tsx     → src/routes/tazkiyah.tsx
src/routes/young-hearts.tsx         → src/routes/youth.tsx
src/routes/life-architecture.tsx    → src/routes/suhbah.tsx
```

Inside each, update `createFileRoute("/<new-slug>")`, the `pageStatusQuery`/`pageContentQuery` keys (`pillar:<new-slug>`), the `PillarArchive pillar=` prop, the canonical `og:url` + `<link rel=canonical>`, and the head title/description if labels change.

### 3. Hardcoded fallbacks and references

- `src/lib/content.ts` — `PILLARS` map keys and `href` values.
- `src/hooks/use-cms.ts` — fallback special-case `slug === "life-architecture"` for `coming_soon` becomes `"suhbah"`.
- `src/routes/sitemap[.]xml.ts` — `staticPaths` array.
- `src/routes/_authenticated/admin/pages.index.tsx` — the special-case grouping that puts `life-architecture` under Pillars becomes `suhbah`.
- Grep sweep for any remaining string literal of the four old slugs (SiteNav, SiteFooter, PillarArchive, admin editors, page-seed, template-vars, LinkCard defaults, etc.) and update.

### 4. Verify

- `tsgo` for type errors.
- Load `/tadabbur`, `/tazkiyah`, `/youth`, `/suhbah` and confirm each renders with the right archive + status.
- Confirm existing articles still list under the correct pillar in the admin and public archives.
- Old URLs (`/quranic-reflections` etc.) will 404 — acceptable per the rename request. If you want redirects from the old paths, say so and I'll add splat routes that `redirect` to the new ones.

## Rollback note

Because the pillar slug is stored as plain text across `articles`, `series`, and `pages.key` (no FK cascade), the data update is the risky step. It runs in a single transaction so a partial failure rolls back cleanly.
