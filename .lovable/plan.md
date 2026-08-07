## Why the tile is missing on your GitHub deploy

The two girih SVGs aren't in the repo. They live on Lovable's asset CDN, and the repo only holds pointer files (`src/assets/girih-tile-*.svg.asset.json`) whose URL is `/__l5e/assets-v1/...`. That path is served by Lovable's hosting only. On your own deployment the browser requests it, gets a 404, and the pattern never paints — everything else on the page looks fine because the pattern is purely decorative.

## Fix — commit the SVGs

1. Download both tiles from the CDN and save them in the repo as:
   - `public/patterns/girih-tile-light.svg`
   - `public/patterns/girih-tile-dark.svg`
2. Point the code at plain public paths instead of the pointer files:
   - `src/components/VerseOfTheWeek.tsx` — drop the two `.asset.json` imports; set `--votw-tile-light: url(/patterns/girih-tile-light.svg)` and the dark equivalent.
   - `src/routes/verse.tsx` — same change for the full-page backdrop.
3. Delete the now-unused `src/assets/girih-tile-light.svg.asset.json` and `src/assets/girih-tile-dark.svg.asset.json`.

`src/styles.css` needs no change — it already reads the `--votw-tile-light` / `--votw-tile-dark` variables.

## Notes

- Adds roughly 300 KB across the two SVGs to the repo; they're served straight from your host with normal caching.
- Works identically on the Lovable preview and any external host.
- Verification: build, then confirm both `/patterns/girih-tile-light.svg` and `/patterns/girih-tile-dark.svg` return 200 and the hover pattern still renders on the home tile and the `/verse` backdrop.
