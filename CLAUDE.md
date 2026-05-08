# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Type-check + production build (tsc -b && vite build)
npm run lint      # ESLint
npm run preview   # Preview production build locally
npx tsc --noEmit  # Type-check only, no output
```

No test suite exists in this project.

## Analytics

Vercel Analytics (`@vercel/analytics`) is installed. The `<Analytics />` component is mounted in `src/main.tsx` (outside the app tree). It is a no-op in local dev — data only flows in production on Vercel.

## Architecture

Single-page React + TypeScript app rendered with Vite. The 3D viewport uses **React Three Fiber** (`@react-three/fiber`) and **Drei** (`@react-three/drei`).

### State and persistence

All application state lives in **`CargoPlanner.tsx`** (the root component). It is the only stateful layer — UI components and scene components are pure/presentational. State is persisted to `localStorage` under the key `cargo-planner-v1` on every change.

Undo history is handled by `useHistory` (a simple stack of `PlannerSnapshot` objects). Every mutating action must call `pushHistorySnapshot()` before applying the change.

### Data layer (`src/data/`)

- **`ships.ts`** — master list of all ships. Each `Ship` has `cargoBays: CargoBay[]`. Each bay has a `size: Vector3` (interior dimensions in SCU grid units) and an `offset: Vector3` (position of the bay's origin in 3D world space, used by the renderer to place bays side-by-side). To add a ship, append an entry following the existing pattern; `offset` controls relative bay placement on screen.
- **`containerDimensions.ts`** — maps SCU size (1/2/4/8/16/24/32) to `{x,y,z}` voxel dimensions.
- **`contracts.ts`** — default demo contracts loaded on first launch.
- **`contractOptions.ts`** — `DESTINATION_OPTIONS` and `COMMODITY_OPTIONS` string arrays used by `SearchableSelect` in forms.

### Coordinate convention

`x` = width (left/right), `y` = depth (front/back along the ship's length), `z` = height. For multi-bay ships, bays are positioned relative to each other via their `offset`. The ship's length axis is **y**.

Three.js mapping: game `(gx, gy, gz)` → Three.js `(gx, gz, gy)`.

### Compound bays

Bays can be merged into a single contiguous loading space via the optional `group` field on `CargoBay`. Bays sharing the same `group` string are treated as one compound bay.

- `buildCompoundBays(bays)` — splits `CargoBay[]` into `{ compoundBays, individualBays }`. A compound bay has a `worldOffset`, `boundingBox`, and `sections[]`.
- `isValidCellInCompound(x, y, z, sections)` — returns true if the voxel is inside at least one section. Used for crate fitting, support checks, and wireframe generation.
- The floor is always at `z = 0`. `checkSupportInCompound` mirrors `checkSupport`: `position.z === 0` → supported (floor), otherwise all cells below must have a crate.
- Elevated sections (`localOffset.z > 0`) do not render a `BayGrid` floor (the floor belongs to z=0 only).
- Compound bays are assigned a single bay number in the display (not "BAY 2+3" but "BAY 2").
- Backward compat: saved `assignedBayId` pointing to a section are auto-remapped to the group ID in `placeCratesInShip`.

### Placement engine (`src/engine/`)

Pure functions, no React dependency.

| File | Role |
|---|---|
| `createCratesFromContracts.ts` | Converts contracts → list of `PlannedCrate`. If `delivery.explicitCrates` is set, expands them directly; otherwise calls `generateCrates`. |
| `generateCrates.ts` | Splits an SCU total into individual crate sizes (greedy, largest first, capped by `maxContainerSize`) |
| `sortCrates.ts` | Orders crates before placement (by destination or delivery order) |
| `placeCratesInShip.ts` | Iterates bays and delegates to `placeCratesInBay` or `placeCratesInCompoundBay` |
| `placeCratesInBay.ts` | 3D bin-packing: scans positions from back (max Y) to front, tries two orientations (rotate on x/y plane only), checks collision and floor support |
| `placeCratesInCompoundBay.ts` | Same bin-packing logic for compound bays; validity uses `isValidCellInCompound` |
| `buildCompoundBays.ts` | Builds `CompoundBay[]` from `CargoBay[]`; exports `isValidCellInCompound`, `buildCompoundBays`, `buildSingleCompoundBay` |
| `checkCollision.ts` / `checkSupport.ts` | Voxel-level overlap and gravity helpers |
| `resolveStackPosition.ts` | Used during drag: finds the stack height at a given (x,y) cell; supports compound bays via `sections?` |
| `applyGravity.ts` | Re-stacks all crates after a drag move; supports compound bays via `sections?` |
| `getRotatedDimensions.ts` | Applies 90° rotation steps to crate dimensions; accepts optional `anchorFace?: AnchorFace` to swap the correct axis pair: `left`/`right` → y↔z, `front`/`rear` → x↔z, `floor`/`ceiling`/default → x↔y. Also exports `getRotations(dims)` used by both placement files. |

#### Gravity behaviour (`applyGravity.ts`)

When a crate becomes unsupported after a drag, gravity tries `resolveStackPosition` at the crate's original (x, y) column. If no valid z exists in that column (e.g. a wide crate lost partial support), the crate stays in place (floating) rather than being teleported. `findElsewhere` was deliberately removed to prevent random placement.

### 3D scene (`src/scene/`)

- **`CargoScene.tsx`** — R3F `<Canvas>` in `frameloop="demand"` mode. Splits `ship.cargoBays` into `individualBays` and `compoundBays`. Renders `CargoBayMesh` for individual bays and `CompoundBayMesh` for compound bays. Contains `centerCell()` which offsets the hovered cell so the drag preview is centered on the cursor (subtracts `Math.floor(dim/2)` on the two free axes for each anchor type, clamped to bay bounds). `resolveBayForStack()` returns `anchorFace: undefined` for compound bays so callers always get the field without a second lookup. **Drag escape handling**: a `window.pointerup` listener (active only while `draggedCrateId` is set) cancels the drag if the pointer is released outside the canvas — prevents `OrbitControls` from staying locked. A `dragHandledRef` boolean guard prevents double-firing when the drop lands on a bay mesh (R3F synthetic event + DOM window event fire in the same synchronous tick before React re-renders); bay meshes receive `wrappedOnEndDrag` which sets the flag before calling `onEndDrag`.
- **`CargoBayMesh.tsx`** — renders a single bay wireframe, grid, and floating label (sprite). The anchor face is rendered as a fully opaque filled panel (`#0c2840`). Two-mesh strategy for lateral faces (`left`, `right`, `front`, `rear`): a `BackSide` visual mesh (no event handlers → excluded from R3F raycast) makes the face opaque from both sides without breaking pointer event routing; the interaction plane keeps `FrontSide` so only the exterior direction receives clicks/hover. `floor`/`ceiling` use `DoubleSide` on the single interaction plane (visible from below, no directionality issue since floor planes don't face each other). In assign+hover mode the face blends to orange (`#e07828`, 35 % opacity) on both meshes.
- **`CompoundBayMesh.tsx`** — renders the merged wireframe + fill highlight (single geometry each, no internal seams), per-section grids (only for sections at z=0), and a single shared label. Floor sections (`localOffset.z === 0`) use an opaque `DoubleSide` interaction plane (`#0c2840`); elevated sections keep `opacity={0}` to avoid a floating panel inside the compound volume.
- **`CrateMesh.tsx`** — renders a placed crate; memoised, uses stable callback refs to avoid re-renders.
- **`CratePreviewMesh.tsx`** — semi-transparent ghost shown during drag.
- **`OrientationMarkers.tsx`** — shows axis labels computed from all bay bounding boxes.
- **`useLabelTexture.ts`** — shared hook that generates a canvas-based `THREE.CanvasTexture` for bay labels (used by both `CargoBayMesh` and `CompoundBayMesh`).

#### Compound geometry (two-pass algorithm in `CompoundBayMesh.tsx`)

`buildCompoundGeometry(sections)` runs a single two-pass algorithm and returns **both** `wireGeo` and `fillGeo` from one computation:

1. **Pass 1** — for each face plane (keyed `"axis:dir:fval"`), collect outer cells from ALL sections combined. A cell is outer if its neighbour in the normal direction is not in any section.
2. **Pass 2** — for each merged cell set, draw edges where the neighbour is absent (wireframe) and triangulate every face cell with CCW winding matching the outward normal (fill). The winding flip rule is: `flip = (axis=x && dir=+) || (axis=y && dir=-) || (axis=z && dir=+)`.

The fill mesh uses `side={THREE.FrontSide}` with correct winding so only exterior faces facing the camera render. This avoids transparency overdraw (the `DoubleSide` artefact where the bottom face stacks on the top face when looking from above).

### Internationalisation (`src/i18n/`)

The app supports FR and EN. The active locale is stored in `localStorage` under the key `"locale"` and restored on load (defaults to `"fr"`).

- **`translations.ts`** — all UI strings keyed by `TranslationKey` (derived via `keyof typeof translations.fr`). Sections: HUD, CapacityPanel, ContractForm, ManualCargoForm, CargoPlanner, ContractList, PendingDeliveriesPanel, SearchableSelect, Scene 3D. Both locales must stay in sync — add keys to both blocks together.
- **`LanguageContext.tsx`** — `LanguageProvider` (wraps the whole app in `main.tsx`), `useLanguage()` hook returning `{ locale, setLocale, t }`. `setLocale` also writes to `localStorage`. All UI components call `t(key)` instead of hardcoding strings. On first load (no saved locale), the default is derived from `navigator.language`: `"fr"` if it starts with `"fr"`, `"en"` otherwise.
- **Scene components** (`CargoBayMesh`, `CompoundBayMesh`, `OrientationMarkers`) are pure/presentational — they receive translated strings as props (`bayWord`, `rearLabel`, `frontLabel`) from `CargoScene`, which is the only scene file that calls `useLanguage()`.

### UI (`src/ui/`)

- **`AppLayout.tsx`** — two-panel layout: left sidebar (tabs: Contracts / Placement) + right 3D viewport. Global CSS variables and sci-fi classes (`.scifi-panel`, `.btn-primary`, etc.) are injected here. Includes the FR/EN toggle button in the HUD.
- **`ContractForm.tsx`** — collapsible panel (starts closed); expands automatically when editing a contract. Add/edit a contract: name, color auto-assigned, deliveries with destination/commodity/SCU via `SearchableSelect`, max container size, required pickup location.
- **`ContractList.tsx`** — list of contracts with drag-to-reorder, per-delivery fragment progress.
- **`PendingDeliveriesPanel.tsx`** — activate deliveries, build a crate pool selection, archive delivered shipments. Each loaded delivery card shows:
  - Fragment placement summary (which bays hold SCU from that delivery) — always visible inline, with a "↩ Retirer" button per fragment.
  - Pending crates grouped by SCU size with −/+ controls, a "select all" button, and a segmented counter+clear widget (SCU label | Vider button) that is always rendered but grayed when the delivery has no selection.
  - Cards are not clickable/expandable.
  - A global selection bar above "En Soute" is always visible: shows `0 SCU` dimmed when empty, switches to accent styling with gradient when a selection is active. `totalSelectedScu` is derived from `crateSelection` by parsing the `"deliveryId::sizeScu"` key format.
- **`ManualCargoForm.tsx`** — collapsible form in the **Contracts tab** (below `ContractForm`) to add or edit explicit-crate cargos without creating a full hauling contract. Name and pickup location are optional. Destination uses `SearchableSelect`. Creates a `Contract` with `explicitCrates` on the delivery so crate sizes are preserved exactly. Supports editing via `editingContract` / `onUpdate` / `onCancelEdit` props — `CargoPlanner` routes edits here (instead of `ContractForm`) when `deliveries[0].explicitCrates` is present.
- **`SearchableSelect.tsx`** — filterable autocomplete input backed by a string options array.
- **`CapacityPanel.tsx`** — live SCU usage ("En soute x / xxx SCU") and remaining capacity ("Disponible x SCU") with an adaptive HSL color: `hsl(remainingPct * 1.2, 75%, 58%)` from red (0 %) to green (100 %); forced red at 0 SCU remaining.
- **`TutorialOverlay.tsx`** — step-by-step guided tutorial triggered by the `?` button in the HUD.

### Crate pool placement flow

The placement tab uses an explicit pool model rather than selecting a whole delivery at once:

1. User activates a delivery (moves it from "waiting" to "loaded").
2. Each loaded card shows pending crates by size with −/+ controls, plus a "select all" button → builds `crateSelection: Map<string, number>` in `CargoPlanner`. Key format: `"${deliveryId}::${sizeScu}"`.
3. `pendingCratesByDelivery: Map<string, {sizeScu, count}[]>` (useMemo) lists unplaced crates grouped by size, largest first. Derived from `allCrates` minus `placedCrates`.
4. User clicks a bay in the 3D view → `handleBayClick` collects the matching pending `PlannedCrate` objects, calls `placeCratesInBay` / `placeCratesInCompoundBay`, then subtracts placed counts from `crateSelection` (unplaced ones stay selected for the next bay).
5. `isAssigningDelivery={totalSelectedCrates > 0}` highlights clickable bays in the scene and disables drag while a selection is active.
6. The drag preview (ghost crate) is centered on the cursor via `centerCell()` in `CargoScene`, which intercepts `onHoverCell` before it propagates to state.

`crateSelection` is cleared on: ship change, contract update/delete, delivery deactivate/archive, undo, clear placement.

### Key data flow

```
contracts + fragments
       ↓
createCratesFromContracts → sortCrates → placeCratesInShip
                                                ↓
                                         placedCrates (state)
                                                ↓
                                         CargoScene (3D render)
```

`DeliveryFragment` records how many SCU of a delivery landed in a specific bay — it is the bridge between the contract model and the placed-crate model.

### `ContractDelivery` type

```ts
type ContractDelivery = {
  id: string;
  commodity: string;
  destination: string;
  scu: number;
  pickupLocation: string;
  explicitCrates?: { sizeScu: number; count: number }[];
};
```

When `explicitCrates` is present (set by `ManualCargoForm`), `createCratesFromContracts` expands each entry directly instead of calling `generateCrates`. `scu` must equal the sum of all explicit crate SCU values.

### Type notes

- `checkSupportInCompound` (in `placeCratesInCompoundBay.ts`) accepts `placedCrates: Array<CrateLike>` (minimal: `id, bayId, gridPosition, dimensions`) to be compatible with generic `T extends PlacedCrateLike` call sites in `applyGravity` and `resolveStackPosition`. It takes **no** `sections` parameter (removed as unused).
- `Vector3` is defined once in `src/types/Vector3.ts` and imported everywhere — never redefine it locally.
- The local `Bay` type in `placeCratesInShip.ts` must include `offset` to satisfy `buildCompoundBays(CargoBay[])`.
- Vercel uses a stricter TypeScript build than local `tsc --noEmit`; always verify with `npm run build` before pushing.
