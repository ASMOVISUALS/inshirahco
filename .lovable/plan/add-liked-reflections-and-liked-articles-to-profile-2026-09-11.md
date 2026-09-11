# Add liked reflections and liked articles to Profile

## What will be built

- Add **Liked Reflections** directly beneath **My Reflections** in the profile sidebar.
- Show a responsive tile grid of reflections the signed-in member has liked.
- Each reflection tile will include the author’s username with the configured role colour, the reflection text, posted date, liked-on date, and like count.
- Add **Liked Articles** beneath Liked Reflections in the profile sidebar.
- Treat the existing saved/bookmarked articles as liked articles, preserving the current account sync and un-save behavior.
- Render liked articles with the same `ContentCard` design used across the public website, so imagery/cover styling, pillar details, titles, and bookmark controls stay consistent.
- Include polished empty and loading states for both pages.

## Technical details

- Add profile routes for `/profile/liked-reflections` and `/profile/liked-articles`, each with private-page metadata.
- Add account-scoped TanStack Query definitions for reflection likes and article bookmarks, including their `created_at` timestamps.
- Join liked reflections to reflection and public profile data through existing Supabase relationships and RLS-protected browser queries.
- Match author colouring through the existing member-colour settings.
- Reuse the existing article query and `ContentCard` rather than creating a second article-card design.
- Keep all data access within the existing Supabase schema; no database migration is required.
- Verify route generation, build output, and both pages in the running preview.
