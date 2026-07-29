## Account access settings

New admin page `Settings → Users` with two independent toggles that control the sign-in and sign-up surfaces. State lives in `site_settings` (already used for global config) under a single key `auth_access`.

```json
{
  "signin_enabled": true,
  "signup_enabled": true,
  "signin_locked_message": ""
}
```

### 1. Migration

Seed one `site_settings` row with key `auth_access` and the default value above. Add narrow public `TO anon` SELECT policy for this key only (so the public join/sign-in pages can read the flags without auth); writes stay admin-only via existing policies.

### 2. Admin UI — `src/routes/_authenticated/admin/settings/users.tsx`

- **Toggle 1: "Users can sign in to their accounts"**
  - When switched OFF, opens a modal: "Add an optional message to display on the sign-in page" with a textarea (empty allowed) and Save.
  - On save: writes `signin_enabled=false` and `signin_locked_message=<text>`.
  - Below the toggle, when locked, show the current message in muted text with a pencil edit icon → reopens the same modal to edit any time. If no message, show "No message set — click to add".
  - Editing the message does not require flipping the toggle.
  - **Side effect on save-off:** invoke a `signOutAllUsers` server function (admin-only, uses `supabaseAdmin.auth.admin.signOut` per user, or bumps a `signed_out_after` timestamp — see technical note) so currently-signed-in users are forced out on their next request/tab focus.

- **Toggle 2: "Users can create new accounts"**
  - Simple switch. No message. Writes `signup_enabled`.

Register the page in the admin sidebar under `Structure` (or `Dev`, per your existing section grouping) — placed in the same section that already holds `Settings`. Access remains gated by the `_authenticated/admin` layout.

### 3. Public gating

New tiny hook `useAuthAccess()` → reads `site_settings` for `auth_access` via a public query (cached, staletime 30s). Returns `{ signinEnabled, signupEnabled, signinLockedMessage }`.

- **`src/routes/auth.tsx`**: when `!signinEnabled`, render a locked template — keeps the current hero layout, heading "Sign-in paused", subheading = `signinLockedMessage` (fallback: "Account access is temporarily closed. Please check back soon."), no form. Magic link and password reset paths are also hidden (they're all account access).
- **`src/routes/join.tsx`**: when `!signupEnabled`, render a locked template — heading "Exclusive access", body copy "Sign up for the newsletter to find out when we open new accounts.", followed by the existing `NewsletterSignup` component (default newsletter). No wizard steps rendered.
- **`src/routes/reset-password.tsx`**: gated together with sign-in (`!signinEnabled` → locked template). Password reset is meaningless if the user can't sign in.
- Nav/footer: hide "Sign in" / "Join" links when their respective flag is off. Small addition to `SiteNav` and `SiteFooter`.

### 4. Force-logout on sign-in lockdown

Preferred: when the admin flips `signin_enabled` to false, call a new server fn `revokeAllUserSessions` (uses `supabaseAdmin.auth.admin.signOut` iterating over users) so existing sessions are invalidated server-side. On the client, the existing root `onAuthStateChange` catches the resulting 401 and routes to `/auth` (which now shows the locked template).

Fallback (belt-and-braces client-side): `useAuthAccess()` in `__root.tsx` watches the flag; when it flips to disabled and a user session exists, run `signOutCompletely` (already implemented in `src/lib/auth.ts`) and navigate home.

### 5. Verify

- Toggle sign-in off with a custom message → `/auth` shows the locked template with the message; existing session is signed out and lands on `/`.
- Edit the message from the settings page → `/auth` updates without a redeploy.
- Toggle sign-up off → `/join` shows the exclusive-access template with the newsletter form; nav "Join" hidden. Existing users can still sign in.
- Toggle both back on → both routes return to normal instantly.

### Technical notes

- Message editing UI uses the same `AdminPasswordGate` pattern already in place, so toggle changes stay password-protected in line with other admin destructive actions.
- No new tables — reuses `site_settings`. No schema churn to page rows or hardcoded route files besides adding a gate wrapper at the top of each affected component.
- Bulk sign-out iterates via `auth.admin.listUsers()` paginated. If that ever becomes too heavy, swap to the "epoch" pattern (store `signed_out_after` timestamp; a lightweight middleware compares `iat` and forces sign-out) — noted for later, not needed now.
