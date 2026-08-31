# Roll back Verse of the Week to Ash-Sharh 94:5

Two rotations happened after the well-populated verse. Current state:

| Verse | Status | Reflections |
|---|---|---|
| Ta-Ha 20:114 | current | 1 (test: "noman") |
| Ash-Sharh 94:1 | used | 1 (test: "Noman made this one with me...") |
| Ash-Sharh 94:5 | used | 11 (the demo set) |

## What the rollback does

- Delete the two test reflections (one on Ta-Ha 20:114, one on Ash-Sharh 94:1) — and their likes.
- Send Ta-Ha 20:114 and Ash-Sharh 94:1 back into the pool, clearing their start/end dates, and place them at the front of the queue so they are next up.
- Reinstate Ash-Sharh 94:5 as the current Verse of the Week, restoring its original start date (7 Aug 2026) and clearing its end date, so its 11 reflections show on the VOTW page again.

## Technical notes

- One data-change statement: delete the two `reflections` rows (likes cascade / cleared), update `ayahs` rows to set `status`, `day_start`, `day_end`, and `queue_order`.
- No schema or code changes; the `/verse` page reads `status = 'current'`, so the page updates as soon as the data changes.
- The rotation schedule (`votw_schedule`) is left as-is — if it is on Friday/date mode it will rotate again at the next due time. Say the word if you also want it switched to manual so nothing auto-rotates while testing.
