import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { currentVerseQuery } from "@/lib/queries";

/** Verse of the week — set every Friday; tapping it opens the verse dashboard. */
export function VerseOfTheWeek() {
  const { data: verse } = useQuery(currentVerseQuery());

  if (!verse) return null;

  return (
    <Link
      to="/verse"
      aria-label="Verse of the week — open the reflection space"
      className="block w-full cursor-pointer rounded-3xl border p-8 text-center transition-transform hover:-translate-y-0.5 md:p-10"
      style={{
        background: "color-mix(in oklab, var(--tazkiyah-soft) 40%, var(--paper-warm))",
        borderColor: "color-mix(in oklab, var(--tazkiyah) 25%, transparent)",
      }}
    >
      <p className="eyebrow" style={{ color: "var(--tazkiyah)" }}>Verse of the week</p>
      <p className="font-arabic mx-auto mt-6 max-w-2xl text-3xl leading-loose md:text-4xl" style={{ color: "var(--ink)" }} dir="rtl">
        {verse.arabic}
      </p>
      <p className="mx-auto mt-6 max-w-lg font-display text-xl italic" style={{ fontVariationSettings: '"SOFT" 80, "WONK" 1' }}>
        "{verse.translation}"
      </p>
      <p className="mt-3 text-sm font-semibold text-muted-foreground">— {verse.reference}</p>
      <p className="mt-6 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--heart)" }}>
        Tap to read and share reflections
      </p>
    </Link>
  );
}
