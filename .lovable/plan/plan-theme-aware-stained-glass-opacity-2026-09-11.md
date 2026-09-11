# Plan: Theme-aware stained-glass opacity

## Problem
The stained-glass girih graphic is bold and visible in dark mode but nearly disappears in light mode at the same opacity setting. A single opacity slider does not work well across both themes.

## Goal
Keep one admin-facing opacity slider, but make the rendered pattern clearly visible in light mode while preserving the current strong effect in dark mode.

## Approach
1. Make the hero / full-screen / hidden-frame renderers compute two effective opacity values from the single `graphic_opacity` prop:
   - **Dark mode**: render at the exact slider value.
   - **Light mode**: render at `slider value × 1.6`, capped at 22%.
2. Pass both values to the block as CSS custom properties:
   - `--girih-opacity` used by default (light mode)
   - `--girih-opacity-dark` used inside `.dark .girih-backdrop::before`
3. Update `src/styles.css` so `.girih-backdrop::before` reads the light value, and `.dark .girih-backdrop::before` reads the dark value.
4. Apply the same treatment to the VOTW page parallax background if it uses the same girih asset, so the site feels consistent.

## Files to change
- `src/lib/page-blocks.tsx` — compute and apply light/dark opacity values for `hero`, `hero_fullscreen`, and `hidden_frame`.
- `src/styles.css` — split `.girih-backdrop::before` opacity into light and dark custom properties.
- `src/routes/verse.tsx` and `src/routes/verse-archive.$id.tsx` — update the VOTW parallax girih layer to use the same theme-aware opacity if applicable.

## Out of scope
- No new admin controls or UI panels.
- No changes to the SVG assets themselves.
- No changes to the page builder field definitions.
