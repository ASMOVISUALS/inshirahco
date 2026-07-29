import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { signOutCompletely } from "@/lib/auth";
import { Menu, Moon, Search, Sun, X, ChevronDown, Bookmark, LogOut, Shield, ArrowLeft, User } from "lucide-react";
import { Logo } from "./Logo";
import { LetterMark } from "./LetterMark";
import { useTheme, useBookmarks } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { hasAdminRoleQuery, siteSettingQuery } from "@/lib/queries";
import { usePillars, useMenuFormats } from "@/hooks/use-cms";
import { useAuthAccess } from "@/lib/auth-access";

import { SearchOverlay } from "./SearchOverlay";

export function SiteNav({ minimal = false, title = "Control Room", eyebrow = "Admin" }: { minimal?: boolean; title?: string; eyebrow?: string } = {}) {
  const [openMega, setOpenMega] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);
  const [openMobileResources, setOpenMobileResources] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();
  const { slugs } = useBookmarks();
  const { user } = useAuth();
  const { data: isAdmin } = useQuery(hasAdminRoleQuery(user?.id ?? null));
  const access = useAuthAccess();
  const { data: nav = {} } = useQuery(siteSettingQuery("nav"));
  const pillars = usePillars();
  const formats = useMenuFormats();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const megaRef = useRef<HTMLDivElement>(null);

  const aboutLabel = (nav.about_label as string) ?? "About";
  const contactLabel = (nav.contact_label as string) ?? "Contact";
  const resourcesLabel = (nav.resources_label as string) ?? "Resources";
  const resourcesEyebrow = (nav.resources_eyebrow as string) ?? "Every resource, one library";
  const browseAllLabel = (nav.browse_all_label as string) ?? "Browse all resources →";

  const signOut = () => signOutCompletely({ queryClient, navigate });

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setOpenMega(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/60 backdrop-blur-md" style={{ background: "color-mix(in oklab, var(--background) 88%, transparent)" }}>
        <div className={`${minimal ? "px-4" : "container-wide"} relative flex h-[72px] items-center justify-between gap-6`}>
          <div className="flex items-center gap-3">
            {minimal && (
              <button
                type="button"
                onClick={() => window.history.back()}
                aria-label="Go back"
                className="group grid h-10 w-10 place-items-center rounded-full border border-border text-foreground/80 transition-all hover:border-transparent hover:text-[var(--heart)]"
                style={{ transition: "box-shadow 200ms, border-color 200ms, color 200ms" }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 14px 2px color-mix(in oklab, var(--heart) 55%, transparent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ""; }}
              >
                <ArrowLeft className="h-4.5 w-4.5" strokeWidth={1.8} />
              </button>
            )}
            <Logo />
          </div>

          {minimal && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center leading-tight">
              <p className="eyebrow text-[10px]" style={{ color: "var(--tazkiyah, #3f7d5b)" }}>{eyebrow}</p>
              <h1 className="font-display text-base sm:text-lg md:text-xl leading-none whitespace-nowrap">{title}</h1>
            </div>
          )}

          {!minimal && (
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {pillars.map((p) => (
              <Link
                key={p.slug}
                to={p.href}
                className="rounded-pill px-4 py-2 text-[0.94rem] font-semibold text-foreground/85 transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ style: { color: "var(--heart)" } }}
              >
                {p.short_label}
              </Link>
            ))}

            <div ref={megaRef} className="relative">
              <button
                type="button"
                aria-expanded={openMega}
                aria-haspopup="true"
                onClick={() => setOpenMega((v) => !v)}
                className="inline-flex items-center gap-1 rounded-pill px-4 py-2 text-[0.94rem] font-semibold text-foreground/85 transition-colors hover:bg-secondary hover:text-foreground"
              >
                {resourcesLabel} <ChevronDown className={`h-4 w-4 transition-transform ${openMega ? "rotate-180" : ""}`} strokeWidth={2} />
              </button>
              {openMega && (
                <div
                  role="menu"
                  className="fade-up absolute right-0 top-[calc(100%+10px)] w-[640px] rounded-3xl border border-border bg-popover p-6 shadow-2xl"
                >
                  <p className="eyebrow mb-4">{resourcesEyebrow}</p>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {formats.map((r) => (
                      <Link
                        key={r.slug}
                        to="/resources"
                        search={{ type: r.slug }}
                        onClick={() => setOpenMega(false)}
                        className="group flex flex-col items-start gap-2 rounded-2xl p-3 hover:bg-secondary"
                        role="menuitem"
                      >
                        <LetterMark letter={r.arabic_letter} tint={r.tint as "heart" | "tazkiyah" | "heart-soft" | "gold" | "ink"} size={38} />
                        <span className="text-sm font-bold text-foreground">{r.plural}</span>
                      </Link>
                    ))}
                  </div>
                  <Link
                    to="/resources"
                    onClick={() => setOpenMega(false)}
                    className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-heart hover:underline"
                    style={{ color: "var(--heart)" }}
                  >
                    {browseAllLabel}
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/about"
              className="rounded-pill px-4 py-2 text-[0.94rem] font-semibold text-foreground/85 transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ style: { color: "var(--heart)" } }}
            >
              {aboutLabel}
            </Link>
          </nav>
          )}

          <div className="flex items-center gap-1">
            {!minimal && (
              <>
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                  className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-secondary"
                >
                  <Search className="h-4.5 w-4.5" strokeWidth={1.8} />
                </button>
                <Link
                  to="/saved"
                  aria-label={`Saved (${slugs.length})`}
                  className="relative hidden h-10 w-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-secondary md:grid"
                >
                  <Bookmark className="h-4.5 w-4.5" strokeWidth={1.8} />
                  {slugs.length > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-heart px-1 text-[10px] font-bold text-primary-foreground" style={{ background: "var(--heart)" }}>
                      {slugs.length}
                    </span>
                  )}
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-secondary"
            >
              {theme === "dark" ? <Sun className="h-4.5 w-4.5" strokeWidth={1.8} /> : <Moon className="h-4.5 w-4.5" strokeWidth={1.8} />}
            </button>

            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" aria-label="Admin" className="hidden md:grid h-10 w-10 place-items-center rounded-full text-foreground/80 hover:bg-secondary">
                    <Shield className="h-4.5 w-4.5" strokeWidth={1.8} />
                  </Link>
                )}
                <Link to="/profile" aria-label="My profile" className="hidden md:grid h-10 w-10 place-items-center rounded-full text-foreground/80 hover:bg-secondary">
                  <User className="h-4.5 w-4.5" strokeWidth={1.8} />
                </Link>
                <button type="button" onClick={signOut} aria-label="Sign out" className="hidden md:inline-flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-semibold text-foreground/85 hover:bg-secondary">
                  <LogOut className="h-4 w-4" strokeWidth={1.8} /> Sign out
                </button>
              </>
            ) : (
              <>
                {access.signinEnabled && (
                  <Link to="/auth" className="hidden md:inline-flex rounded-pill px-4 py-2 text-sm font-semibold text-foreground/85 hover:bg-secondary">
                    Sign in
                  </Link>
                )}
                <Link to="/join" className="ml-1 hidden md:inline-flex btn-primary !py-2.5 !px-5 !text-sm">
                  Join
                </Link>

              </>
            )}

            <button
              type="button"
              onClick={() => setOpenMobile(true)}
              aria-label="Open menu"
              className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 hover:bg-secondary lg:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </header>

      {openMobile && (
        <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true">
          <button aria-label="Close menu" className="absolute inset-0" style={{ background: "color-mix(in oklab, var(--ink) 55%, transparent)" }} onClick={() => setOpenMobile(false)} />
          <div className="relative ml-auto flex h-full w-[88%] max-w-sm flex-col bg-background p-6">
            <div className="flex items-center justify-between">
              <Logo />
              <button aria-label="Close" onClick={() => setOpenMobile(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary">
                <X className="h-5 w-5" strokeWidth={1.8} />
              </button>
            </div>
            <nav className="mt-8 flex flex-col gap-1" aria-label="Mobile primary">
              {pillars.map((p) => (
                <Link key={p.slug} to={p.href} onClick={() => setOpenMobile(false)} className="rounded-2xl px-4 py-3 text-lg font-semibold hover:bg-secondary">
                  {p.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => setOpenMobileResources((v) => !v)}
                className="flex items-center justify-between rounded-2xl px-4 py-3 text-left text-lg font-semibold hover:bg-secondary"
                aria-expanded={openMobileResources}
              >
                {resourcesLabel} <ChevronDown className={`h-4 w-4 transition-transform ${openMobileResources ? "rotate-180" : ""}`} />
              </button>
              {openMobileResources && (
                <div className="mb-2 grid grid-cols-2 gap-1 px-2">
                  {formats.map((r) => (
                    <Link key={r.slug} to="/resources" search={{ type: r.slug }} onClick={() => setOpenMobile(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-secondary">
                      <LetterMark letter={r.arabic_letter} tint={r.tint as "heart" | "tazkiyah" | "heart-soft" | "gold" | "ink"} size={28} />
                      {r.plural}
                    </Link>
                  ))}
                </div>
              )}
              <Link to="/about" onClick={() => setOpenMobile(false)} className="rounded-2xl px-4 py-3 text-lg font-semibold hover:bg-secondary">{aboutLabel}</Link>
              <Link to="/contact" onClick={() => setOpenMobile(false)} className="rounded-2xl px-4 py-3 text-lg font-semibold hover:bg-secondary">{contactLabel}</Link>
              <Link to="/saved" onClick={() => setOpenMobile(false)} className="rounded-2xl px-4 py-3 text-lg font-semibold hover:bg-secondary">Saved ({slugs.length})</Link>
            </nav>
            {user ? (
              <div className="mt-6 flex flex-col gap-2">
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpenMobile(false)} className="btn-ghost justify-center">Admin</Link>
                )}
                <button type="button" onClick={() => { setOpenMobile(false); signOut(); }} className="btn-primary justify-center">Sign out</button>
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-2">
                {access.signinEnabled && (
                  <Link to="/auth" onClick={() => setOpenMobile(false)} className="btn-ghost justify-center">Sign in</Link>
                )}
                <Link to="/join" onClick={() => setOpenMobile(false)} className="btn-primary justify-center">Join</Link>

              </div>
            )}
          </div>
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
