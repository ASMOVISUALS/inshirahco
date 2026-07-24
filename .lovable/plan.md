## Diagnosis

The mentors section reads from the `pages` row `life-architecture` in Supabase. That row still has the old copy and old mentor entries:

- `mentors_title`: "Small circle. Long conversations."
- `mentors_description`: "Mentor profiles are placeholders…"
- `mentors_eyebrow`: "The mentors" (still rendered by the old code before your last edit; already removed in code)
- `mentors[]`: only `name` + `bio`, no `title`/`role`/`qualification`

The frontend fallbacks I added only apply when the field is missing. Because the DB has values, they override the new defaults on every load — which is why the update appears briefly (before hydration), then reverts once the query resolves.

## Fix

One migration that updates the `pages.content` JSON for `key = 'life-architecture'`:

1. Set `mentors_title` → `"The Mentors"`
2. Set `mentors_description` → `"Meet your mentors and advisors!"`
3. Remove `mentors_eyebrow` (no longer used)
4. Replace `mentors` array with three entries carrying `name`, `title`, `role`, `qualification` (matching the new defaults)

No code changes needed — the component already renders these fields.

## Technical

```sql
UPDATE public.pages
SET content = content
  - 'mentors_eyebrow'
  || jsonb_build_object(
    'mentors_title', 'The Mentors',
    'mentors_description', 'Meet your mentors and advisors!',
    'mentors', jsonb_build_array(
      jsonb_build_object('name','Mentor 1','title','Scholar & Educator','role','Lead Mentor','qualification','PhD, Islamic Studies'),
      jsonb_build_object('name','Mentor 2','title','Psychologist & Coach','role','Advisor','qualification','MSc, Clinical Psychology'),
      jsonb_build_object('name','Mentor 3','title','Founder & Strategist','role','Advisor','qualification','MBA, Strategy')
    )
  )
WHERE key = 'life-architecture';
```

After this runs, refreshing the page will keep the new layout because the DB now matches. You can further edit mentor names/titles from `/admin` at any time.