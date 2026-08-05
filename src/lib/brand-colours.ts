/**
 * Brand text colours. Colour settings may only pick from these tokens —
 * never arbitrary hex — so everything stays on the design system and themes
 * correctly in dark mode.
 */
export const BRAND_TEXT_COLOURS = [
  { value: "ink", label: "Ink", hex: "#2E2118" },
  { value: "heart", label: "Heart (red)", hex: "#A63C33" },
  { value: "heart-soft", label: "Heart soft", hex: "#D98A80" },
  { value: "tazkiyah", label: "Tazkiyah (green)", hex: "#4F7F62" },
  { value: "tazkiyah-soft", label: "Tazkiyah soft", hex: "#B7D4C0" },
  { value: "gold", label: "Gold", hex: "#A47C2D" },
  { value: "gold-decorative", label: "Gold decorative", hex: "#C99A44" },
] as const;

export type BrandColourToken = (typeof BRAND_TEXT_COLOURS)[number]["value"];

/** Legacy hex values stored before tokens existed map back onto a token. */
const HEX_TO_TOKEN: Record<string, string> = Object.fromEntries(
  BRAND_TEXT_COLOURS.map((c) => [c.hex.toLowerCase(), c.value]),
);

export function normaliseBrandToken(value: unknown, fallback: string): string {
  const v = String(value ?? "").trim();
  if (BRAND_TEXT_COLOURS.some((c) => c.value === v)) return v;
  const mapped = HEX_TO_TOKEN[v.toLowerCase()];
  return mapped ?? fallback;
}

/** CSS value for a brand token, usable in a `style={{ color }}`. */
export function brandColourVar(value: unknown, fallback: string): string {
  return `var(--${normaliseBrandToken(value, fallback)})`;
}

export function brandColourHex(value: unknown, fallback: string): string {
  const token = normaliseBrandToken(value, fallback);
  return BRAND_TEXT_COLOURS.find((c) => c.value === token)?.hex ?? "#000000";
}
