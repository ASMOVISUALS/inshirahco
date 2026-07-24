import type { CSSProperties } from "react";

type Tint = "heart" | "heart-soft" | "tazkiyah" | "tazkiyah-soft" | "gold" | "ink";

const TINTS: Record<Tint, { bg: string; fg: string }> = {
  heart: { bg: "color-mix(in oklab, var(--heart) 14%, transparent)", fg: "var(--heart)" },
  "heart-soft": { bg: "color-mix(in oklab, var(--heart-soft) 24%, transparent)", fg: "var(--heart)" },
  tazkiyah: { bg: "color-mix(in oklab, var(--tazkiyah) 14%, transparent)", fg: "var(--tazkiyah)" },
  "tazkiyah-soft": { bg: "color-mix(in oklab, var(--tazkiyah-soft) 45%, transparent)", fg: "var(--tazkiyah)" },
  gold: { bg: "color-mix(in oklab, var(--gold-decorative) 22%, transparent)", fg: "var(--gold)" },
  ink: { bg: "color-mix(in oklab, var(--ink) 8%, transparent)", fg: "var(--ink)" },
};

interface Props {
  letter: string;
  tint?: Tint;
  size?: number;
  className?: string;
}

export function LetterMark({ letter, tint = "heart", size = 44, className }: Props) {
  const t = TINTS[tint];
  const style: CSSProperties = {
    width: size,
    height: size,
    backgroundColor: t.bg,
    color: t.fg,
    fontSize: size * 0.5,
  };
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-full font-arabic leading-none ${className ?? ""}`}
      style={style}
    >
      {letter}
    </span>
  );
}
