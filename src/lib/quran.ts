// Verse counts for each surah (index 0 = surah 1)
export const SURAH_VERSE_COUNTS: number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111,
  110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45,
  83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55,
  78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20,
  56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
  11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

export type FetchedAyah = {
  arabic: string;
  translation: string;
  reference: string;
};

function stripHtml(input: string): string {
  return input
    .replace(/<sup[^>]*>.*?<\/sup>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchAyah(
  surah: number,
  ayah: number,
  translationId = 131,
): Promise<FetchedAyah> {
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    throw new Error("Surah must be between 1 and 114.");
  }
  const maxAyah = SURAH_VERSE_COUNTS[surah - 1];
  if (!Number.isInteger(ayah) || ayah < 1 || ayah > maxAyah) {
    throw new Error(`Ayah must be between 1 and ${maxAyah} for this surah.`);
  }

  const url = `https://api.quran.com/api/v4/verses/by_key/${surah}:${ayah}?language=en&fields=text_uthmani&translations=${translationId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Quran.com API error (${res.status}).`);
  const json = (await res.json()) as {
    verse?: {
      text_uthmani?: string;
      translations?: Array<{ text?: string }>;
    };
  };
  const verse = json.verse;
  const arabic = verse?.text_uthmani?.trim();
  const translationRaw = verse?.translations?.[0]?.text ?? "";
  if (!arabic) throw new Error("No Arabic text returned.");

  return {
    arabic,
    translation: stripHtml(translationRaw),
    reference: `Qur'an ${surah}:${ayah}`,
  };
}
