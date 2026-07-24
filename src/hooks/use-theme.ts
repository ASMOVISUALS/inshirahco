import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { bookmarksQuery } from "@/lib/queries";

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
// When signed in: source of truth is Supabase. When signed out: localStorage.
// On first sign-in, any local bookmarks are migrated up to the server.

const BM_KEY = "inshirah.bookmarks";

function readLocal(): string[] {
  try {
    const raw = localStorage.getItem(BM_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(slugs: string[]) {
  try {
    localStorage.setItem(BM_KEY, JSON.stringify(slugs));
    window.dispatchEvent(new Event("inshirah:bookmarks"));
  } catch { /* ignore */ }
}

export function useBookmarks() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [localSlugs, setLocalSlugs] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setLocalSlugs(readLocal());
    const listener = () => setLocalSlugs(readLocal());
    window.addEventListener("inshirah:bookmarks", listener);
    window.addEventListener("storage", listener);
    return () => {
      window.removeEventListener("inshirah:bookmarks", listener);
      window.removeEventListener("storage", listener);
    };
  }, []);

  const { data: remoteSlugs } = useQuery(bookmarksQuery(user?.id ?? null));

  // Migrate localStorage bookmarks up on first sign-in.
  useEffect(() => {
    if (!user) return;
    const local = readLocal();
    if (local.length === 0) return;
    (async () => {
      const rows = local.map((slug) => ({ user_id: user.id, article_slug: slug }));
      await supabase.from("bookmarks").upsert(rows, { onConflict: "user_id,article_slug" });
      writeLocal([]);
      qc.invalidateQueries({ queryKey: ["bookmarks", user.id] });
    })();
  }, [user, qc]);

  const slugs = user ? (remoteSlugs ?? []) : localSlugs;

  const toggle = async (slug: string) => {
    if (user) {
      const isSaved = slugs.includes(slug);
      // optimistic
      qc.setQueryData<string[]>(["bookmarks", user.id], (prev = []) =>
        isSaved ? prev.filter((s) => s !== slug) : [...prev, slug],
      );
      if (isSaved) {
        await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("article_slug", slug);
      } else {
        await supabase.from("bookmarks").insert({ user_id: user.id, article_slug: slug });
      }
      qc.invalidateQueries({ queryKey: ["bookmarks", user.id] });
    } else {
      const next = localSlugs.includes(slug)
        ? localSlugs.filter((s) => s !== slug)
        : [...localSlugs, slug];
      setLocalSlugs(next);
      writeLocal(next);
    }
  };

  const has = (slug: string) => slugs.includes(slug);
  return { slugs, toggle, has };
}
