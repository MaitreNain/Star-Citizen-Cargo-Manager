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
| `getRotatedDimensions.ts` | Applies 90° rotation steps to crate dimensions; also exports `getRotations(dims)` used by both placement files |

#### Gravity behaviour (`applyGravity.ts`)

When a crate becomes unsupported after a drag, gravity tries `resolveStackPosition` at the crate's original (x, y) column. If no valid z exists in that column (e.g. a wide crate lost partial support), the crate stays in place (floating) rather than being teleported. `findElsewhere` was deliberately removed to prevent random placement.

### 3D scene (`src/scene/`)

- **`CargoScene.tsx`** — R3F `<Canvas>` in `frameloop="demand"` mode. Splits `ship.cargoBays` into `individualBays` and `compoundBays`. Renders `CargoBayMesh` for individual bays and `CompoundBayMesh` for compound bays.
- **`CargoBayMesh.tsx`** — renders a single bay wireframe, grid, and floating label (sprite).
- **`CompoundBayMesh.tsx`** — renders the merged wireframe + fill highlight (single geometry each, no internal seams), per-section grids (only for sections at z=0), and a single shared label.
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
- **`PendingDeliveriesPanel.tsx`** — activate deliveries, select one to assign to a bay, archive/restore delivered shipments.
- **`ManualCargoForm.tsx`** — collapsible form in the **Contracts tab** (below `ContractForm`) to add or edit explicit-crate cargos without creating a full hauling contract. Name and pickup location are optional. Destination uses `SearchableSelect`. Creates a `Contract` with `explicitCrates` on the delivery so crate sizes are preserved exactly. Supports editing via `editingContract` / `onUpdate` / `onCancelEdit` props — `CargoPlanner` routes edits here (instead of `ContractForm`) when `deliveries[0].explicitCrates` is present.
- **`SearchableSelect.tsx`** — filterable autocomplete input backed by a string options array.
- **`CapacityPanel.tsx`** — live SCU usage ("En soute x / xxx SCU") and remaining capacity ("Disponible x SCU") with an adaptive HSL color: `hsl(remainingPct * 1.2, 75%, 58%)` from red (0 %) to green (100 %); forced red at 0 SCU remaining.
- **`TutorialOverlay.tsx`** — step-by-step guided tutorial triggered by the `?` button in the HUD.

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
