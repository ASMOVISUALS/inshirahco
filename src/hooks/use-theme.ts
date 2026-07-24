import { useEffect, useState } from "react";

const KEY = "inshirah.theme";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem(KEY) as "light" | "dark" | null) : null;
    const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
      return next;
    });
  };

  return { theme, toggle };
}

// -------- bookmarks --------

const BM_KEY = "inshirah.bookmarks";

export function useBookmarks() {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BM_KEY);
      if (raw) setSlugs(JSON.parse(raw));
    } catch { /* ignore */ }
    const listener = () => {
      try {
        const raw = localStorage.getItem(BM_KEY);
        setSlugs(raw ? JSON.parse(raw) : []);
      } catch { /* ignore */ }
    };
    window.addEventListener("inshirah:bookmarks", listener);
    window.addEventListener("storage", listener);
    return () => {
      window.removeEventListener("inshirah:bookmarks", listener);
      window.removeEventListener("storage", listener);
    };
  }, []);

  const toggle = (slug: string) => {
    setSlugs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      try {
        localStorage.setItem(BM_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event("inshirah:bookmarks"));
      } catch { /* ignore */ }
      return next;
    });
  };

  const has = (slug: string) => slugs.includes(slug);

  return { slugs, toggle, has };
}
