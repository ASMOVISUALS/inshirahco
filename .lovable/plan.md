## Pillars admin: table view + password-gated edit

### 1. Rework `/admin/pillars` as a read-only table

Replace the stacked card list in `src/routes/_authenticated/admin/pillars.tsx` with a horizontally scrollable table (wraps in an `overflow-x-auto` container so it fits at full desktop but scrolls on narrower widths).

Columns, in order:
1. Label
2. Short Label
3. Slug
4. Arabic Letter
5. Tint
6. Href
7. Sort Order
8. Description
9. Coming soon (checkbox, disabled — display only)

To the left of each row, **outside** the table, sits a pencil edit button (circular icon button matching the existing admin style). Clicking it opens a password confirmation modal (see step 2). No inline editing anywhere on this page.

### 2. Password re-auth modal

A small modal component (new file `src/components/AdminPasswordGate.tsx`) that:
- Shows the current admin's email (read-only) and a single password field.
- On submit, calls `supabase.auth.signInWithPassword({ email, password })` to verify — no session change of consequence since it's the same user.
- On success, navigates to `/admin/pillars/$slug/edit` with a short-lived in-memory flag (React state / `sessionStorage` key like `pillar-edit-verified:<slug>` with a timestamp bounded to ~60s just to survive the redirect) that the edit route checks on mount.
- On failure, shows an inline error and stays open.
- Re-auth is required **every** time the pencil is clicked (per your answer).

### 3. New edit route `/admin/pillars/$slug/edit`

New file `src/routes/_authenticated/admin/pillars.$slug.edit.tsx`.

On mount:
- Reads the sessionStorage verification flag. If missing/expired, redirects back to `/admin/pillars` (so the URL can't be visited directly without going through the password gate).
- Clears the flag immediately after reading it (single-use).
- Loads the pillar row by slug from Supabase.

Renders an editable form with the same fields shown in the table (Label, Short Label, Slug read-only, Arabic Letter, Tint, Href, Sort Order, Description textarea, Coming soon checkbox) plus:
- **Back** button (top-left) → returns to `/admin/pillars` table view. If the form is dirty, confirm before leaving.
- **Cancel** button → resets the form to the loaded values (does not navigate).
- **Save** button → updates the row via Supabase, invalidates `["admin","pillars"]` and `["cms","pillars"]` queries, and shows a success toast/confirmation banner. Stays on the edit page after save (per your requirement); shows an error toast on failure.

### Technical notes

- The password check does not grant any elevated DB permission — RLS already restricts updates to admins. It's a UX-level "confirm it's really you" gate. Making it a real security boundary would require a server function; call this out only if you want that instead.
- Verification flag survives the redirect via `sessionStorage` (a single React state can't cross a navigation). It's single-use and time-bounded so a stale tab can't reuse it.
- Table styling uses existing tokens (`border-border`, `bg-card`, etc.) and shadcn table primitives already present in the project.

### Files

- Edit: `src/routes/_authenticated/admin/pillars.tsx` (table + pencil buttons + password modal trigger)
- New: `src/components/AdminPasswordGate.tsx` (modal)
- New: `src/routes/_authenticated/admin/pillars.$slug.edit.tsx` (edit form route)
