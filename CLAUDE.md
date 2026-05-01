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

## Architecture

Single-page React + TypeScript app rendered with Vite. The 3D viewport uses **React Three Fiber** (`@react-three/fiber`) and **Drei** (`@react-three/drei`).

### State and persistence

All application state lives in **`CargoPlanner.tsx`** (the root component). It is the only stateful layer — UI components and scene components are pure/presentational. State is persisted to `localStorage` under the key `cargo-planner-v1` on every change.

Undo history is handled by `useHistory` (a simple stack of `PlannerSnapshot` objects). Every mutating action must call `pushHistorySnapshot()` before applying the change.

### Data layer (`src/data/`)

- **`ships.ts`** — master list of all ships. Each `Ship` has `cargoBays: CargoBay[]`. Each bay has a `size: Vector3` (interior dimensions in SCU grid units) and an `offset: Vector3` (position of the bay's origin in 3D world space, used by the renderer to place bays side-by-side). To add a ship, append an entry following the existing pattern; `offset` controls relative bay placement on screen.
- **`containerDimensions.ts`** — maps SCU size (1/2/4/8/16/24/32) to `{x,y,z}` voxel dimensions.
- **`contracts.ts`** — default demo contracts loaded on first launch.

### Coordinate convention

`x` = width (left/right), `y` = depth (front/back along the ship's length), `z` = height. For multi-bay ships, bays are positioned relative to each other via their `offset`. The ship's length axis is **y**.

### Placement engine (`src/engine/`)

Pure functions, no React dependency.

| File | Role |
|---|---|
| `createCratesFromContracts.ts` | Converts contracts → list of `PlannedCrate` with SCU sizes and voxel dimensions |
| `generateCrates.ts` | Splits an SCU total into individual crate sizes (greedy, largest first, capped by `maxContainerSize`) |
| `sortCrates.ts` | Orders crates before placement (by destination or delivery order) |
| `placeCratesInShip.ts` | Iterates bays and delegates to `placeCratesInBay` |
| `placeCratesInBay.ts` | 3D bin-packing: scans positions from back (max Y) to front, tries two orientations (rotate on x/y plane only), checks collision and floor support |
| `checkCollision.ts` / `checkSupport.ts` | Voxel-level overlap and gravity helpers |
| `resolveStackPosition.ts` | Used during drag: finds the stack height at a given (x,y) cell |
| `applyGravity.ts` | Re-stacks all crates after a drag move |
| `getRotatedDimensions.ts` | Applies 90° rotation steps to crate dimensions |

### 3D scene (`src/scene/`)

- **`CargoScene.tsx`** — R3F `<Canvas>` in `frameloop="demand"` mode (only renders on invalidation). Handles keyboard (`R` to rotate during drag) and pointer events. Delegates cell hover/drop to `CargoBayMesh`.
- **`CargoBayMesh.tsx`** — renders the bay wireframe grid and forwards pointer events.
- **`CrateMesh.tsx`** — renders a placed crate; memoised, uses stable callback refs to avoid re-renders.
- **`CratePreviewMesh.tsx`** — semi-transparent ghost shown during drag.
- **`OrientationMarkers.tsx`** — shows axis labels computed from all bay bounding boxes.

### UI (`src/ui/`)

- **`AppLayout.tsx`** — two-panel layout: left sidebar (tabs: Contrats / Placement) + right 3D viewport.
- **`ContractForm.tsx`** — add/edit a contract (name, color, deliveries with destination/commodity/SCU, max container size).
- **`ContractList.tsx`** — list of contracts with drag-to-reorder, per-delivery fragment progress.
- **`PendingDeliveriesPanel.tsx`** — activate deliveries, select one to assign to a bay, archive/restore delivered shipments.
- **`CapacityPanel.tsx`** — live SCU usage and remaining capacity breakdown by container size.
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
