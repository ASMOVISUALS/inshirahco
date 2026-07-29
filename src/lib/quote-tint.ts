export type QuoteTint = "tazkiyah" | "heart" | "heart-soft" | "gold";

export const QUOTE_TINT_OPTIONS: { value: QuoteTint; label: string; swatch: string }[] = [
  { value: "tazkiyah", label: "Green", swatch: "var(--tazkiyah)" },
  { value: "heart", label: "Red", swatch: "var(--heart)" },
  { value: "heart-soft", label: "Soft red", swatch: "var(--heart-soft)" },
  { value: "gold", label: "Gold", swatch: "var(--gold)" },
];

const SOFT: Record<QuoteTint, string> = {
  tazkiyah: "--tazkiyah-soft",
  heart: "--heart-soft",
  "heart-soft": "--heart-soft",
  gold: "--gold-decorative",
};
const SOLID: Record<QuoteTint, string> = {
  tazkiyah: "--tazkiyah",
  heart: "--heart",
  "heart-soft": "--heart",
  gold: "--gold",
};

export function quoteTintStyle(tint?: string): { background: string; borderColor: string } {
  const t = (QUOTE_TINT_OPTIONS.find((o) => o.value === tint)?.value ?? "tazkiyah") as QuoteTint;
  const mix = t === "gold" ? 22 : 35;
  return {
    background: `color-mix(in oklab, var(${SOFT[t]}) ${mix}%, var(--paper-warm))`,
    borderColor: `var(${SOLID[t]})`,
  };
}
