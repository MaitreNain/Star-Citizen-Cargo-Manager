import type { Vector3 } from "../types/Vector3";
import type { CompoundSection } from "../types/CompoundBay";
import type { AnchorFace } from "../types/CargoBay";
import { checkCollision } from "./checkCollision";
import { checkSupport } from "./checkSupport";
import { isValidCellInCompound } from "./buildCompoundBays";
import { checkSupportInCompound } from "./placeCratesInCompoundBay";
import {
  getFloorBaySize,
  transformPosToFloor,
  transformDimToFloor,
  untransformFromFloor,
} from "./anchorTransform";

type CargoBayLike = {
  id: string;
  size: Vector3;
  sections?: CompoundSection[];
  anchorFace?: AnchorFace;
};

type PlacedCrateLike = {
  id: string;
  bayId: string;
  gridPosition: Vector3;
  dimensions: Vector3;
};

export function resolveStackPosition(
  movingCrate: PlacedCrateLike,
  targetPos: Vector3,
  bay: CargoBayLike,
  placedCrates: PlacedCrateLike[]
) {
  // Compound bays: no anchor transform (sections define validity in game space).
  if (bay.sections) {
    const maxZ = bay.size.z - movingCrate.dimensions.z;
    for (let z = 0; z <= maxZ; z++) {
      const candidate = { bayId: bay.id, x: targetPos.x, y: targetPos.y, z };
      const fitsBox =
        candidate.x + movingCrate.dimensions.x <= bay.size.x &&
        candidate.y + movingCrate.dimensions.y <= bay.size.y &&
        candidate.z + movingCrate.dimensions.z <= bay.size.z;
      if (!fitsBox) continue;

      let allValid = true;
      outer:
      for (let cx = candidate.x; cx < candidate.x + movingCrate.dimensions.x; cx++)
        for (let cy = candidate.y; cy < candidate.y + movingCrate.dimensions.y; cy++)
          for (let cz = z; cz < z + movingCrate.dimensions.z; cz++)
            if (!isValidCellInCompound(cx, cy, cz, bay.sections!)) { allValid = false; break outer; }
      if (!allValid) continue;

      if (checkCollision(movingCrate, candidate, placedCrates)) continue;
      if (!checkSupportInCompound(movingCrate, candidate, placedCrates, bay.id)) continue;
      return candidate;
    }
    return null;
  }

  const anchor = bay.anchorFace ?? "floor";
  const floorSize = getFloorBaySize(anchor, bay.size);
  const floorDim = transformDimToFloor(movingCrate.dimensions, anchor);

  // Derive floor-space column (x, y) from the full game-space target position.
  const floorTarget = transformPosToFloor(targetPos, movingCrate.dimensions, anchor, bay.size);
  const colX = floorTarget.x;
  const colY = floorTarget.y;

  const floorPlaced = placedCrates.map((c) => ({
    ...c,
    gridPosition: transformPosToFloor(c.gridPosition, c.dimensions, anchor, bay.size),
    dimensions: transformDimToFloor(c.dimensions, anchor),
  }));

  const maxZ = floorSize.z - floorDim.z;

  for (let z = 0; z <= maxZ; z++) {
    const fc = { bayId: bay.id, x: colX, y: colY, z };

    const fitsBox =
      fc.x + floorDim.x <= floorSize.x &&
      fc.y + floorDim.y <= floorSize.y &&
      fc.z + floorDim.z <= floorSize.z;
    if (!fitsBox) continue;

    if (checkCollision({ ...movingCrate, dimensions: floorDim }, fc, floorPlaced)) continue;
    if (!checkSupport({ id: movingCrate.id, dimensions: floorDim }, fc, floorPlaced, bay.id)) continue;

    const { pos } = untransformFromFloor(fc, floorDim, anchor, bay.size);
    return { bayId: bay.id, x: pos.x, y: pos.y, z: pos.z };
  }

  return null;
}
