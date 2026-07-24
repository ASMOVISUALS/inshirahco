import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { PILLARS, RESOURCE_TYPES, type Pillar, type ResourceType } from "@/lib/content";
import { articlesQuery } from "@/lib/queries";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: Props) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { data: content = [] } = useQuery(articlesQuery());

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return content.slice(0, 6);
    return content.filter((c) => {
      return (
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.tags.some((t) => t.toLowerCase().includes(query)) ||
        PILLARS[c.pillar as Pillar].label.toLowerCase().includes(query) ||
        RESOURCE_TYPES[c.type as ResourceType].label.toLowerCase().includes(query)
      );
    }).slice(0, 10);
  }, [q, content]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search Inshirah"
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[10vh]"
    >
      <button
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        style={{ background: "color-mix(in oklab, var(--ink) 55%, transparent)" }}
      />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search className="h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reflections, practices, articles…"
            className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
            aria-label="Search"
          />
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
          >
            <X className="h-4.5 w-4.5" strokeWidth={1.6} />
          </button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-4 py-8 text-center text-muted-foreground">
              Nothing quite matches. Try a shorter word.
            </li>
          )}
          {results.map((c) => (
            <li key={c.slug}>
              <Link
                to="/read/$slug"
                params={{ slug: c.slug }}
                onClick={() => { onClose(); navigate({ to: "/read/$slug", params: { slug: c.slug } }); }}
                className="flex flex-col gap-1 rounded-2xl px-4 py-3 hover:bg-secondary"
              >
                <span className="eyebrow">{PILLARS[c.pillar as Pillar].short} · {RESOURCE_TYPES[c.type as ResourceType].label}</span>
                <span className="font-display text-lg">{c.title}</span>
                <span className="text-sm text-muted-foreground">{c.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
