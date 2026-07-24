import { useRef, useState } from "react";
import { fetchAyah, SURAH_VERSE_COUNTS, type FetchedAyah } from "@/lib/quran";

type Props = {
  onFetched: (ayah: FetchedAyah) => void;
  /** Optional layout tweaks */
  compact?: boolean;
};

/**
 * Shared Surah/Ayah fetch controls used by the article Quran quote block
 * and the reflections admin. Emits a raw FetchedAyah — consumers map fields.
 */
export function QuranFetcher({ onFetched, compact = false }: Props) {
  const [surah, setSurah] = useState("");
  const [ayah, setAyah] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [surahGlow, setSurahGlow] = useState<"" | "glow-invalid" | "glow-valid">("");
  const [ayahGlow, setAyahGlow] = useState<"" | "glow-invalid" | "glow-valid">("");
  const glowKey = useRef(0);
  const digitsOnly = (v: string) => v.replace(/\D+/g, "");

  const run = async () => {
    setError(null);
    setSurahGlow("");
    setAyahGlow("");
    const s = parseInt(surah, 10);
    const a = parseInt(ayah, 10);
    const surahOk = Number.isInteger(s) && s >= 1 && s <= 114;
    const maxA = surahOk ? SURAH_VERSE_COUNTS[s - 1] : null;
    const ayahOk = surahOk && Number.isInteger(a) && a >= 1 && a <= (maxA as number);
    glowKey.current += 1;
    if (!surahOk) {
      setSurahGlow("glow-invalid");
      setAyahGlow("glow-invalid");
      return;
    }
    if (!ayahOk) {
      setSurahGlow("glow-valid");
      setAyahGlow("glow-invalid");
      return;
    }
    setLoading(true);
    try {
      const res = await fetchAyah(s, a);
      onFetched(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch verse.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "rounded-md border border-border bg-background px-2 py-1 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div className={compact ? "flex flex-col gap-2 text-sm" : "mt-4 flex flex-wrap items-end gap-2 border-t pt-3 text-sm"}
      style={compact ? undefined : { borderColor: "color-mix(in oklab, var(--tazkiyah) 30%, transparent)" }}
    >
      <div className={compact ? "grid grid-cols-2 gap-2" : "contents"}>
        <div className="flex flex-col">
          <label className="text-xs text-muted-foreground">Surah</label>
          <input
            key={`s-${glowKey.current}-${surahGlow}`}
            type="text"
            inputMode="numeric"
            value={surah}
            onChange={(e) => { setSurah(digitsOnly(e.target.value)); setSurahGlow(""); }}
            placeholder="1–114"
            className={`${inputCls} ${compact ? "w-full" : "w-24"} ${surahGlow}`}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-muted-foreground">Ayah</label>
          <input
            key={`a-${glowKey.current}-${ayahGlow}`}
            type="text"
            inputMode="numeric"
            value={ayah}
            onChange={(e) => { setAyah(digitsOnly(e.target.value)); setAyahGlow(""); }}
            placeholder="verse #"
            className={`${inputCls} ${compact ? "w-full" : "w-24"} ${ayahGlow}`}
          />
        </div>
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={run}
        className={`rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary disabled:opacity-50 ${compact ? "w-full" : ""}`}
      >
        {loading ? "Fetching…" : "Fetch from Quran.com"}
      </button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
