## Goal
Let you decide exactly which pooled verse goes next, by dragging pool tiles into a release order — instead of the current random pick.

## 1. Database
- Add a `queue_order` (integer) column to `ayahs`, backfilled so existing pool verses get a stable starting sequence.
- Update the weekly rotation routine (currently `ORDER BY random()`) to pick the pooled verse with the **lowest `queue_order`** instead. When a verse leaves the pool, the rest keep their relative order.
- Keep the existing `day_start` / `day_end` tracking trigger untouched.

## 2. Verses admin — sort control
- Show the "Sort by" dropdown only on the **In pool** and **Used** tabs (hidden on Active).
- Pool tab options: `Order of release` (default), `Qur'anic order`, `Date added`.
- Used tab options stay as they are today.

## 3. Drag to reorder
- Dragging is enabled **only** on the In pool tab while sort is set to `Order of release`. On the other sort modes tiles are static, with a small hint line explaining how to enable reordering.
- Each pool tile gets a drag handle plus a position badge (1, 2, 3…) showing its place in the release queue. Position 1 is labelled "Next up".
- Dropping persists the new `queue_order` values for the whole pool list, with an optimistic UI update so tiles don't jump.
- Keyboard-accessible: handle is focusable, arrow up/down moves a tile in the order.

## 4. Set new verse
- The green "Set new verse" button now promotes the **next-up** verse (position 1) rather than a random one, retiring the current verse to Used. It keeps the existing admin-password gate.

## Technical notes
- Reordering uses the already-installed `motion` package for the drag/reorder animation (Reorder group), so no new dependency.
- Persistence is a single batched upsert of `{id, queue_order}` pairs on drop.
- `queries.ts`/`admin-ayahs` query gains `queue_order` in its select and orders pool rows by it.
