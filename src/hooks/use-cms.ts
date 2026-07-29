import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { pillarsQuery, formatsQuery, type PillarRow, type FormatRow } from "@/lib/queries";
import { PILLARS as FALLBACK_PILLARS, RESOURCE_TYPES as FALLBACK_FORMATS, type Pillar, type ResourceType } from "@/lib/content";

const fallbackPillarRows: PillarRow[] = Object.entries(FALLBACK_PILLARS).map(([slug, p], i) => ({
  slug,
  label: p.label,
  short_label: p.short,
  arabic_letter: p.letter,
  tint: p.tint,
  description: p.description,
  href: p.href,
  sort_order: i + 1,
  coming_soon: slug === "suhbah",
}));

const fallbackFormatRows: FormatRow[] = Object.entries(FALLBACK_FORMATS).map(([slug, f], i) => ({
  slug,
  label: f.label,
  plural: f.plural,
  arabic_letter: f.letter,
  tint: "heart",
  sort_order: i + 1,
  show_in_menu: true,
  show_on_site: true,
}));

export function usePillars(): PillarRow[] {
  const { data } = useQuery({ ...pillarsQuery(), placeholderData: fallbackPillarRows });
  return data && data.length > 0 ? data : fallbackPillarRows;
}

export function usePillarMap(): Record<string, PillarRow> {
  const rows = usePillars();
  return Object.fromEntries(rows.map((r) => [r.slug, r]));
}

/** All formats (including hidden). Used for label lookup so legacy items still resolve names. */
export function useAllFormats(): FormatRow[] {
  const { data } = useQuery({ ...formatsQuery(), placeholderData: fallbackFormatRows });
  return data && data.length > 0 ? data : fallbackFormatRows;
}

/** Formats visible on the site (used for public listings/filters). */
export function useFormats(): FormatRow[] {
  const all = useAllFormats();
  return useMemo(() => all.filter((f) => f.show_on_site), [all]);
}

/** Formats visible in menus (nav dropdown, mobile menu). */
export function useMenuFormats(): FormatRow[] {
  const all = useAllFormats();
  return useMemo(() => all.filter((f) => f.show_on_site && f.show_in_menu), [all]);
}

export function useFormatMap(): Record<string, FormatRow> {
  const rows = useAllFormats();
  return Object.fromEntries(rows.map((r) => [r.slug, r]));
}

/** Set of slugs allowed to appear on the site. Used to filter article lists. */
export function useOnSiteFormatSlugs(): Set<string> {
  const rows = useAllFormats();
  return useMemo(() => new Set(rows.filter((r) => r.show_on_site).map((r) => r.slug)), [rows]);
}

export function pillarLabel(map: Record<string, PillarRow>, slug: string | Pillar): PillarRow {
  return map[slug as string] ?? fallbackPillarRows.find((r) => r.slug === slug) ?? fallbackPillarRows[0];
}

export function formatLabel(map: Record<string, FormatRow>, slug: string | ResourceType): FormatRow {
  return map[slug as string] ?? fallbackFormatRows.find((r) => r.slug === slug) ?? fallbackFormatRows[0];
}
