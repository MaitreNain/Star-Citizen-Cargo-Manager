import type { Vector3 } from "../types/Vector3";
import type { CompoundSection } from "../types/CompoundBay";
import type { AnchorFace } from "../types/CargoBay";
import { checkSupport } from "./checkSupport";
import { checkSupportInCompound } from "./placeCratesInCompoundBay";
import { resolveStackPosition } from "./resolveStackPosition";
import { transformPosToFloor, transformDimToFloor } from "./anchorTransform";

type PlacedCrateLike = {
  id: string;
  bayId: string;
  gridPosition: Vector3;
  dimensions: Vector3;
};

type CargoBayLike = {
  id: string;
  size: Vector3;
  sections?: CompoundSection[];
  anchorFace?: AnchorFace;
};

function isSupportedInBay(crate: PlacedCrateLike, state: PlacedCrateLike[], bay: CargoBayLike): boolean {
  if (bay.sections) return checkSupportInCompound(crate, crate.gridPosition, state, crate.bayId);

  const anchor = bay.anchorFace ?? "floor";
  const floorPos = transformPosToFloor(crate.gridPosition, crate.dimensions, anchor, bay.size);
  const floorDim = transformDimToFloor(crate.dimensions, anchor);
  const floorOthers = state
    .filter((c) => c.bayId === crate.bayId)
    .map((c) => ({
      ...c,
      gridPosition: transformPosToFloor(c.gridPosition, c.dimensions, anchor, bay.size),
      dimensions: transformDimToFloor(c.dimensions, anchor),
    }));

  return checkSupport({ id: crate.id, dimensions: floorDim }, floorPos, floorOthers, crate.bayId);
}

function floorZ(crate: PlacedCrateLike, bay: CargoBayLike): number {
  if (bay.sections) return crate.gridPosition.z;
  const anchor = bay.anchorFace ?? "floor";
  return transformPosToFloor(crate.gridPosition, crate.dimensions, anchor, bay.size).z;
}

export function applyGravity<T extends PlacedCrateLike>(
  crates: T[],
  bays: CargoBayLike[]
): T[] {
  const bayMap = new Map(bays.map((b) => [b.id, b]));
  let state = [...crates];

  while (true) {
    const unsupported = state
      .filter((c) => {
        const bay = bayMap.get(c.bayId);
        if (!bay) return false;
        return !isSupportedInBay(c, state, bay);
      })
      .sort((a, b) => {
        const bayA = bayMap.get(a.bayId);
        const bayB = bayMap.get(b.bayId);
        return floorZ(a, bayA!) - floorZ(b, bayB!);
      });

    if (unsupported.length === 0) break;

    let anyMoved = false;

    for (const crate of unsupported) {
      const bay = bayMap.get(crate.bayId);
      if (!bay) continue;
      if (isSupportedInBay(crate, state, bay)) continue;

      const others = state.filter((c) => c.id !== crate.id);
      const pos = resolveStackPosition(crate, crate.gridPosition, bay, others);

      if (pos) {
        state = state.map((c) =>
          c.id === crate.id
            ? { ...c, bayId: pos.bayId, gridPosition: { x: pos.x, y: pos.y, z: pos.z } }
            : c
        );
        anyMoved = true;
      }
    }

    if (!anyMoved) break;
  }

  return state;
}
