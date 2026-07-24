# Inshirah — Supabase Auth Email Templates

Paste each `.html` file in this folder into **Supabase Dashboard → Authentication → Emails → Templates**.

| Template file | Supabase template | Subject suggestion |
|---|---|---|
| `confirm-signup.html` | Confirm signup | Welcome to Inshirah — confirm your email |
| `magic-link.html` | Magic Link | Your Inshirah sign-in link |
| `recovery.html` | Reset password | Reset your Inshirah password |
| `invite.html` | Invite user | You're invited to Inshirah |
| `email-change.html` | Change email address | Confirm your new email for Inshirah |
| `reauthentication.html` | Reauthentication | Your Inshirah verification code |

## Design tokens used (mirrors the site)
- Paper: `#FBF2E4`  · Ink: `#2B221C`  · Heart: `#B4463D`  · Muted: `#6B5B4F`
- Headings: Fraunces (falls back to Georgia/serif in email clients)
- Body: Nunito (falls back to system sans)
- Arabic watermark: بِسْمِ ٱللَّٰهِ, Amiri fallback → serif

## Supabase merge variables
Each template uses only the variables Supabase provides for that template type:
`{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .SiteURL }}`, `{{ .Email }}`, `{{ .NewEmail }}`.

## Notes
- Web fonts are linked via Google Fonts `<link>`; Gmail/Outlook will fall back gracefully.
- Emails use inline styles + a single `<style>` block for MSO/Outlook compatibility.
- Body background is `#FBF2E4` (paper) with a white card, matching the site's warm editorial feel.
