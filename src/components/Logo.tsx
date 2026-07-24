import { Link } from "@tanstack/react-router";

export function Logo({ variant = "default" }: { variant?: "default" | "footer" }) {
  const inkClass = variant === "footer" ? "text-paper" : "text-ink";
  const arabicColor = variant === "footer" ? "var(--gold)" : "var(--heart)";
  return (
    <Link to="/" className="inline-flex items-baseline gap-3 group" aria-label="Inshirah home">
      <span
        className={`font-display text-[1.65rem] leading-none ${inkClass}`}
        style={{ fontVariationSettings: '"SOFT" 80, "WONK" 1, "opsz" 144', color: variant === "footer" ? "var(--paper)" : undefined }}
      >
        inshirah
      </span>
      <span
        className="font-arabic text-[1.55rem] leading-none transition-transform group-hover:-translate-y-0.5"
        style={{ color: arabicColor }}
        aria-hidden
      >
        انشراح
      </span>
    </Link>
  );
}
