# Site mode: Live / Coming soon / Maintenance

Add a single site-wide switch in Admin → Settings that can take the whole public site offline behind a pleasant landing page, whatever URL a visitor types.

This is entirely inside the app — nothing to change on Vercel or your domain. The switch lives in Supabase, so flipping it takes effect within seconds without a redeploy.

## What you get

A new "Site mode" settings group with:

- **Mode**: `Live`, `Coming soon`, or `Maintenance`
- **Headline** and **message** (optional overrides for the landing copy)
- **Show newsletter form** toggle (on by default for Coming soon)
- **Expected return / launch note** (small free-text line, optional)

Behaviour when the mode is not Live:

- Every public URL — home, pillars, articles, custom slugs, 404s — renders the landing screen instead of the page.
- Admins signed in are exempt, so you can keep working on the real site while visitors see the landing page.
- `/auth` still works but only accepts admins (same pattern as the existing locked sign-in door), plus the discreet "Admin" link bottom-right so you can always get in.
- `/admin/*` and `/profile/*` stay reachable for signed-in admins.
- Coming soon page includes the newsletter signup form (writes to the existing `newsletter_signups` table); maintenance page does not.

## Landing page design

Reuses the site's visual language: hero radial background, the `ش` letter mark, faint girih pattern backdrop, Fraunces headline. Coming soon leans warm/inviting; maintenance leans calm/brief. Both are centred, single-screen, no nav links, footer reduced to the small print line.

## Technical approach

1. **Migration** — insert a `site_mode` row into `setting_groups` with `setting_fields`: `mode` (select: live / coming_soon / maintenance), `headline` (text), `message` (textarea), `newsletter` (toggle), `note` (text). Uses the existing schema-driven settings UI, so no new admin screen is needed. Also seed a `site_settings` row with `{ mode: "live" }` so the default is unchanged.

2. **`src/lib/site-mode.ts`** — `siteModeQuery()` + `useSiteMode()` hook, mirroring `src/lib/auth-access.ts` (15s `staleTime` and `refetchInterval`, so a mode change propagates fast without a reload).

3. **`src/components/SiteGate.tsx`** — reads the mode, the current user, and `hasAdminRoleQuery`. Returns `children` when mode is `live`, when the visitor is an admin, or when the path is `/auth`, `/auth/callback`, `/reset-password`, `/admin/*`, `/profile/*`. Otherwise renders the landing screen. While the admin check is pending it renders nothing (avoids flashing the landing page at admins).

4. **`src/routes/__root.tsx`** — wrap the `<main><Outlet /></main>` region in `<SiteGate>`, and hide `SiteNav`/`SiteFooter` when the gate is closed. A small banner strip shows admins "Site is in Coming soon mode" so it's never a surprise.

5. **`src/components/SiteLanding.tsx`** — the landing screen itself, driven by the settings values with sensible built-in defaults, reusing `NewsletterSignup` for the coming-soon variant.

## Notes and limits

- This is a client-side gate: the pages still exist and someone reading network traffic could see published content served by Supabase. It's the right level for "we're still building", not for secrets. If you later need a hard block, the follow-up is tightening RLS on the content tables — worth doing separately.
- The existing per-page `hidden` / `coming_soon` statuses stay as they are; the site mode sits above them.
