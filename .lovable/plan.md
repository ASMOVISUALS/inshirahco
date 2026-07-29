## Goal

Today the Verse of the Week only changes when you press **Set next verse** — there is no scheduler at all (pg_cron/pg_net are not enabled, and no job calls `rotate_verse_of_the_week()`).

This adds a real schedule, controlled from the **Active** tab.

## Behaviour

On the Active tab, under the "This week" panel, a **Next change** control with three modes:

1. **Weekly (default)** — rotates every Friday at 00:00. Shows e.g. "Next change: Friday 31 Jul, 00:00".
2. **Set your own date** — date/time picker. Rotates once at that moment, then falls back to Manual (with a note saying so).
3. **Manual** — never rotates on its own; only the Set next verse button. Shows "Manual — changes only when you click Set next verse".

Changing the mode is password-gated like the other verse actions. Pressing **Set next verse** manually while in Weekly mode simply advances the next scheduled change to the following Friday.

If the pool is empty when the schedule fires, nothing rotates (current verse stays), and the panel shows a warning that the pool is empty.

## Technical

**Database**
- New singleton table `votw_schedule`: `mode` ('weekly' | 'date' | 'manual'), `next_change_at timestamptz`, timestamps. Grants: select/update to `authenticated`, all to `service_role`; RLS so only admins (`has_role`) can read/write.
- `public.votw_next_friday(from ts)` helper returning the next Friday 00:00 UTC.
- `public.rotate_verse_of_the_week_if_due()` (SECURITY DEFINER): returns early if mode = manual or `next_change_at` is in the future; otherwise calls the existing `rotate_verse_of_the_week()`, then sets `next_change_at` to the next Friday (weekly) or switches to manual (date mode).
- Keep the manual rotate path as-is, but have it also bump `next_change_at` when mode = weekly.
- Enable `pg_cron` and schedule `votw-rotate-check` every 10 minutes running `SELECT public.rotate_verse_of_the_week_if_due();` — SQL-only, no HTTP endpoint or extra secret needed.

**Frontend**
- `src/routes/_authenticated/admin/verses.tsx`: query + mutation for `votw_schedule`, new "Next change" card in the Active tab (mode selector, date picker for date mode, live countdown/next-run text), wrapped in the existing `AdminPasswordGate`.
- Regenerate Supabase types after the migration.

## Notes

- Times are UTC; the panel will label them as such to avoid confusion.
- The 10-minute cron cadence means rotation lands within 10 minutes of the target time.
