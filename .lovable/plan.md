## Goal
Enhance the Quran quote block in the article editor so authors can enter a Surah number and Ayah number, and have the Arabic + English translation auto-populate from a public Quran API.

## Feasibility
Yes — this is straightforward. Quran.com's public API (`api.quran.com/api/v4`) is free, requires no auth, supports CORS, and returns both Arabic (Uthmani script) and English translations by chapter:verse key.

Endpoints we'll use:
- `GET https://api.quran.com/api/v4/verses/by_key/{surah}:{ayah}?language=en&fields=text_uthmani&translations=131`
  - `translations=131` = Dr. Mustafa Khattab, The Clear Quran (widely used default; configurable later)
- Response gives `text_uthmani` (Arabic) and `translations[0].text` (English, may contain footnote HTML — we'll strip tags).

## UX in the editor
Current Quran block has: Arabic text, translation, reference (e.g. "Qur'an 94:5–6").

Add to the block's edit UI (only visible while the block is empty or via a small "Fetch" affordance):
1. Two small numeric inputs at the bottom: **Surah** (1–114) and **Ayah** (1–286).
2. A **Fetch** button.
3. On click:
   - Validate ranges (basic bounds; ayah upper-bound looked up from a static surah→verse-count map so we can show inline errors without a second API call).
   - Call the API, populate Arabic + translation, auto-set reference to `Qur'an {surah}:{ayah}`.
   - Show a loading state; on error show inline message and keep manual fields editable.
4. After population, all three text fields remain editable (author can tweak translation or reference format).
5. A small "Re-fetch" link stays available in case they change the numbers.

Ranged ayahs (e.g. 94:5–6) are out of scope for v1 — single ayah only. We can extend later with a second "to ayah" field that concatenates.

## Technical changes

**1. New helper: `src/lib/quran.ts`**
- `SURAH_VERSE_COUNTS: number[]` (length 114) for client-side validation.
- `async function fetchAyah(surah: number, ayah: number): Promise<{ arabic: string; translation: string; reference: string }>`
  - Fetches from `api.quran.com/api/v4/verses/by_key/...`.
  - Strips `<sup>…</sup>` footnote markers from translation text.
  - Throws typed error on network/validation failure.

**2. Edit `src/lib/article-blocks.tsx`**
- No schema change needed — `QuranBlock` already has `arabic`, `translation`, `reference`.

**3. Edit `src/routes/_authenticated/admin/articles/$id.tsx`**
- In the Quran block editor UI, add the Surah/Ayah inputs + Fetch button at the bottom of the block panel.
- Wire to `fetchAyah`, update block state via existing update path (so undo/redo captures it as one edit).
- Loading spinner on the button; inline error text below on failure.

**4. No DB migration, no new dependencies.** Uses native `fetch`.

## Out of scope
- Verse ranges (5–6).
- Choosing a different English translator (hard-code Clear Quran for now; can expose in site settings later).
- Caching / offline.

## Open question
Confirm Clear Quran (Khattab, translation id 131) as the default English translation, or prefer Sahih International (id 20)?
