import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { reflectionsQuery } from "@/lib/queries";

export function ReflectionOfTheDay() {
  const { data = [] } = useQuery(reflectionsQuery());

  const r = useMemo(() => {
    if (data.length === 0) return null;
    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return data[day % data.length];
  }, [data]);

  if (!r) return null;

  return (
    <aside
      aria-label="Reflection of the day"
      className="rounded-3xl border p-8 text-center md:p-10"
      style={{ background: "color-mix(in oklab, var(--tazkiyah-soft) 40%, var(--paper-warm))", borderColor: "color-mix(in oklab, var(--tazkiyah) 25%, transparent)" }}
    >
      <p className="eyebrow" style={{ color: "var(--tazkiyah)" }}>Reflection of the day</p>
      <p className="font-arabic mx-auto mt-6 max-w-2xl text-3xl leading-loose md:text-4xl" style={{ color: "var(--ink)" }} dir="rtl">
        {r.arabic}
      </p>
      <p className="mx-auto mt-6 max-w-lg font-display text-xl italic" style={{ fontVariationSettings: '"SOFT" 80, "WONK" 1' }}>
        "{r.translation}"
      </p>
      <p className="mt-3 text-sm font-semibold text-muted-foreground">— {r.reference}</p>
    </aside>
  );
}
