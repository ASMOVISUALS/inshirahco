import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Moon, Search, Sun, X, ChevronDown, Bookmark } from "lucide-react";
import { Logo } from "./Logo";
import { LetterMark } from "./LetterMark";
import { PILLARS, RESOURCE_TYPES } from "@/lib/content";
import { useTheme, useBookmarks } from "@/hooks/use-theme";
import { SearchOverlay } from "./SearchOverlay";

const NAV_PILLARS = [
  PILLARS["quranic-reflections"],
  PILLARS["tazkiyah-toolkit"],
  PILLARS["young-hearts"],
  PILLARS["life-architecture"],
];

const RESOURCE_LINKS: Array<{ label: string; type: keyof typeof RESOURCE_TYPES; letter: string; tint: "heart" | "tazkiyah" | "heart-soft" | "gold" | "ink" }> = [
  { label: "Videos", type: "video", letter: "ف", tint: "heart" },
  { label: "Podcasts", type: "podcast", letter: "ص", tint: "tazkiyah" },
  { label: "Blog posts", type: "blog", letter: "و", tint: "heart-soft" },
  { label: "Articles", type: "article", letter: "م", tint: "ink" },
  { label: "Books", type: "book", letter: "ك", tint: "gold" },
  { label: "Courses", type: "course", letter: "د", tint: "heart" },
  { label: "Tadabbur", type: "tadabbur", letter: "ن", tint: "tazkiyah" },
  { label: "Worksheets", type: "worksheet", letter: "ع", tint: "heart-soft" },
];

export function SiteNav() {
  const [openMega, setOpenMega] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);
  const [openMobileResources, setOpenMobileResources] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();
  const { slugs } = useBookmarks();
  const megaRef = useRef<HTMLDivElement>(null);

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
        <div className="container-wide flex h-[72px] items-center justify-between gap-6">
          <Logo />

          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {NAV_PILLARS.slice(0, 4).map((p) => (
              <Link
                key={p.href}
                to={p.href}
                className="rounded-pill px-4 py-2 text-[0.94rem] font-semibold text-foreground/85 transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ style: { color: "var(--heart)" } }}
              >
                {p.short}
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
                Resources <ChevronDown className={`h-4 w-4 transition-transform ${openMega ? "rotate-180" : ""}`} strokeWidth={2} />
              </button>
              {openMega && (
                <div
                  role="menu"
                  className="fade-up absolute right-0 top-[calc(100%+10px)] w-[640px] rounded-3xl border border-border bg-popover p-6 shadow-2xl"
                >
                  <p className="eyebrow mb-4">Every resource, one library</p>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {RESOURCE_LINKS.map((r) => (
                      <Link
                        key={r.type}
                        to="/resources"
                        search={{ type: r.type }}
                        onClick={() => setOpenMega(false)}
                        className="group flex flex-col items-start gap-2 rounded-2xl p-3 hover:bg-secondary"
                        role="menuitem"
                      >
                        <LetterMark letter={r.letter} tint={r.tint} size={38} />
                        <span className="text-sm font-bold text-foreground">{r.label}</span>
                      </Link>
                    ))}
                  </div>
                  <Link
                    to="/resources"
                    onClick={() => setOpenMega(false)}
                    className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-heart hover:underline"
                    style={{ color: "var(--heart)" }}
                  >
                    Browse all resources →
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/about"
              className="rounded-pill px-4 py-2 text-[0.94rem] font-semibold text-foreground/85 transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ style: { color: "var(--heart)" } }}
            >
              About
            </Link>
          </nav>

          <div className="flex items-center gap-1">
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
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-secondary"
            >
              {theme === "dark" ? <Sun className="h-4.5 w-4.5" strokeWidth={1.8} /> : <Moon className="h-4.5 w-4.5" strokeWidth={1.8} />}
            </button>

            <Link
              to="/life-architecture"
              className="ml-2 hidden md:inline-flex btn-primary !py-2.5 !px-5 !text-sm"
            >
              Join
            </Link>

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

      {/* Mobile sheet */}
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
              {NAV_PILLARS.map((p) => (
                <Link key={p.href} to={p.href} onClick={() => setOpenMobile(false)} className="rounded-2xl px-4 py-3 text-lg font-semibold hover:bg-secondary">
                  {p.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => setOpenMobileResources((v) => !v)}
                className="flex items-center justify-between rounded-2xl px-4 py-3 text-left text-lg font-semibold hover:bg-secondary"
                aria-expanded={openMobileResources}
              >
                Resources <ChevronDown className={`h-4 w-4 transition-transform ${openMobileResources ? "rotate-180" : ""}`} />
              </button>
              {openMobileResources && (
                <div className="mb-2 grid grid-cols-2 gap-1 px-2">
                  {RESOURCE_LINKS.map((r) => (
                    <Link key={r.type} to="/resources" search={{ type: r.type }} onClick={() => setOpenMobile(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-secondary">
                      <LetterMark letter={r.letter} tint={r.tint} size={28} />
                      {r.label}
                    </Link>
                  ))}
                </div>
              )}
              <Link to="/about" onClick={() => setOpenMobile(false)} className="rounded-2xl px-4 py-3 text-lg font-semibold hover:bg-secondary">About</Link>
              <Link to="/contact" onClick={() => setOpenMobile(false)} className="rounded-2xl px-4 py-3 text-lg font-semibold hover:bg-secondary">Contact</Link>
              <Link to="/saved" onClick={() => setOpenMobile(false)} className="rounded-2xl px-4 py-3 text-lg font-semibold hover:bg-secondary">Saved ({slugs.length})</Link>
            </nav>
            <Link to="/life-architecture" onClick={() => setOpenMobile(false)} className="btn-primary mt-6 justify-center">Join the letter</Link>
          </div>
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
