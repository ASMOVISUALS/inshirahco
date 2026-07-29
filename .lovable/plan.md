## Goal

When sign-in is locked, keep the locked screen for everyone but give admins a discreet way in: a small "Admin" link bottom-right that opens a sign-in dialog. Credentials are verified by Supabase; if the account is real but not an admin, the session is immediately discarded and the login is refused.

## What gets built

**1. Admin login dialog (`src/components/AdminSignInDialog.tsx`)**

- Email + password fields, brand-styled, same visual language as the existing password gate dialog.
- On submit: `supabase.auth.signInWithPassword`.
  - Invalid credentials → "Those details don't match an account."
  - Valid → query `user_roles` for `role = 'admin'` for that user id.
    - Admin → close dialog, navigate to `/admin`.
    - Not admin → immediately sign the session out again and show "This account doesn't have admin access." (no session is left behind).

**2. Locked screen affordance (`src/components/AccessLocked.tsx`)**

- Add an optional `adminEntry` flag. When set, render a small, low-contrast "Admin" text button pinned bottom-right of the section that opens the dialog. Used on `/auth` (and `/reset-password`, which shares the locked template) — not on the `/join` locked screen.

**3. Don't sign the admin back out (`src/routes/__root.tsx`)**

- Today `AuthAccess`loading`Enforcer` signs out *any* signed-in user while sign-in is disabled, which would instantly kick the admin out after a successful admin login. Change it to check the admin role first (via the existing `hasAdminRoleQuery`) and only sign out non-admins. While the role check is still , do nothing.

## Technical notes

- Role check reuses `hasAdminRoleQuery` in `src/lib/queries.ts`; no schema changes and no new RLS policies are needed.
- The refusal path calls `signOutCompletely` so no partial session or cached data survives a rejected non-admin login.
- Existing admin route protection (`_authenticated/admin`) is unchanged — this only adds an entry point.

USER NOTES ADDED TO LOVABLES PLAN

- By the way right now when I set sign in to locked, the admin thatis currently logged in is not immediately kicked out, nor when he navigates to different pages. Why is this? Is there a global sign out event that is being missed. is this something for supabase functionality. what do you think
- &nbsp;