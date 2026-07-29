## My recommendation

Yes — remove it entirely for now. Don't build empty Videos/Courses pages.

Reasons, based on what's actually in the code:
- `resource_formats` currently drives the nav mega-menu, the Resources library block filters, the format labels on every content card, the search overlay, and a settings option source. That's a lot of moving parts maintaining a concept you have exactly one value for.
- `articles.type` is a foreign key to `resource_formats.slug`. Keeping a one-value FK is pure overhead.
- When videos/podcasts/courses genuinely arrive, they won't share the articles schema anyway (duration, embed URL, transcript, modules/lessons). A separate `videos` / `courses` table created then will be cleaner than a format flag bolted on now. Adding an empty table today locks in guesses.

So: one `articles` table, no formats, no Resources hub. Add new tables when the content actually exists.

## What changes

**Database (one migration)**
- Drop the `articles_type_fkey` constraint and the `articles.type` column.
- Drop the `resource_formats` table.

**Public site**
- Delete the `/resources` route and its `resources` page record; remove the Resources item from the nav mega-menu (`SiteNav.tsx`, desktop + mobile), the "All resources" footer link, and `/resources` from the sitemap.
- Remove the `ResourcesLibraryBlock` page block (and its entry in the block-kind registry) from `page-blocks.tsx`.
- Content cards, the article page, and the search overlay stop showing a format label — the eyebrow becomes pillar-only.
- Homepage "media" strip currently filters by `type === video | podcast | tadabbur`; that filter goes, and the carousel is either dropped or fed by the same article list. I'll confirm with you visually once it's built if it looks thin.

**Admin**
- Delete `/admin/formats` and its sidebar entry.
- Remove the Format column from the articles list and the format picker from the article editor; new articles no longer set `type`.
- Remove the `formats` dynamic option source from the settings schema (and any setting field pointing at it).

**Shared code**
- Remove `ResourceType`, `RESOURCE_TYPES`, `FormatRow`, `formatsQuery`, `useFormats`, `useFormatMap`, `useOnSiteFormatSlugs`, `formatLabel`, and `type` from `ContentItem`.

## Ordering
Migration first (it needs your approval and regenerates types), then the code cleanup in one pass.

## Note on existing data
Any articles currently stored with a non-article type (video, podcast, etc.) stay as normal articles — only the label disappears. If you'd rather archive those rows instead, say so and I'll add it.
