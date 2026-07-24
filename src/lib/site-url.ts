// Canonical production site URL used for auth redirect links (magic link,
// email confirmation, password reset). This ensures Supabase emails always
// send users back to the real domain, not a Lovable preview/staging URL.
export const SITE_URL = "https://inshirah.co";

export const siteUrl = (path: string = "/") =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
