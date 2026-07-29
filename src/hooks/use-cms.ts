import { useQuery } from "@tanstack/react-query";
import { pillarsQuery, type PillarRow } from "@/lib/queries";
import { PILLARS as FALLBACK_PILLARS, type Pillar } from "@/lib/content";

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

export function usePillars(): PillarRow[] {
  const { data } = useQuery({ ...pillarsQuery(), placeholderData: fallbackPillarRows });
  return data && data.length > 0 ? data : fallbackPillarRows;
}

export function usePillarMap(): Record<string, PillarRow> {
  const rows = usePillars();
  return Object.fromEntries(rows.map((r) => [r.slug, r]));
}

export function pillarLabel(map: Record<string, PillarRow>, slug: string | Pillar): PillarRow {
  return map[slug as string] ?? fallbackPillarRows.find((r) => r.slug === slug) ?? fallbackPillarRows[0];
}
