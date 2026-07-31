## Goal

Replace the hand-coded CSS girih mask on the Verse of the Week tile with your uploaded Islamic geometric tile, recoloured to the Inshirah palette and settled at a low opacity so the verse text stays readable.

## What the uploaded file is

`Islamic-Geometric-Tile-2.svg` — a 1600×1600 vector panel with flat fills in four source colours:

| Source colour | Role in the artwork | Maps to |
|---|---|---|
| `#002C7C` navy (dominant) | main star / strapwork lattice | `--tazkiyah` green |
| `#007EA1` teal (secondary) | interlacing bands | mid-green (tazkiyah blended toward soft) |
| `#BF5700` burnt orange | accent shapes | `--heart` red |
| `#FFAB00` amber | small highlight nodes | `--gold-decorative` |
| `#FFFFFF` | background plate | made transparent so the tile's own warm background shows through |

## Approach

1. **Create the brand asset.** Recolour the SVG by swapping those five fills for brand values, and produce two variants:
   - `girih-tile-light.svg` — light-mode tokens (`#4F7F62`, `#A63C33`, `#C99A44`)
   - `girih-tile-dark.svg` — warm-dark tokens (`#A8CFB5`, `#E29A91`, `#E0B458`)

   Two static files rather than one CSS-variable-driven inline SVG, because a 148 KB inlined SVG in the JS bundle would be heavy and background-image data URIs can't read CSS variables. Both go through the Lovable asset CDN, so nothing large lands in the repo.

2. **Check tileability.** Render the artwork repeated 2×2 and inspect for seams. If it tiles cleanly it becomes a `repeat` background at roughly 320–400 px; if the edges don't meet, it is used as a single centred motif scaled to cover the card instead. Either way the geometry is your artwork, unchanged.

3. **Wire it into the tile.** In `src/styles.css`, `.votw-pattern` drops the two hand-built mask layers (`::before` star lattice, `::after` gold rosettes) and instead paints the asset as a `background-image`. The `.dark` variant points at the dark file.

4. **Keep the existing motion, adjust the settle.** The reveal stays exactly as it is now — `clip-path: circle(0% → 85%)` easing outward from the centre, with the `.votw-ring` glow expanding ahead of it. The change is the end state: the pattern animates in bright (around `0.42` opacity) as the wave passes, then eases down over ~600 ms to a resting `0.13` in light mode and `0.16` in dark, so the verse, translation and reference stay comfortably readable. On mouse-out it fades back to zero.

5. **Motion safety.** Keep the existing `prefers-reduced-motion` handling — no wave, just a straight fade to the resting opacity.

## Technical notes

- Files touched: `src/styles.css` (pattern layers and the settle keyframes), plus the two new asset pointers under `src/assets/`. `VerseOfTheWeek.tsx` keeps its existing `.votw-pattern` / `.votw-ring` spans, so no component change is expected.
- Resting opacity values are a starting point — easy to nudge once you see it live.
- Contrast is checked against the Arabic and the italic translation at the resting opacity before finishing.
