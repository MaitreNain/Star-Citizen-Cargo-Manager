import { checkCollision } from "./checkCollision";
import { checkSupport } from "./checkSupport";
import { isValidCellInCompound } from "./buildCompoundBays";
import { checkSupportInCompound } from "./placeCratesInCompoundBay";
import type { CompoundSection } from "../types/CompoundBay";

type Vector3 = {
  x: number;
  y: number;
  z: number;
};

type CargoBayLike = {
  id: string;
  size: Vector3;
  sections?: CompoundSection[];
};

type PlacedCrateLike = {
  id: string;
  bayId: string;
  gridPosition: Vector3;
  dimensions: Vector3;
};

export function resolveStackPosition(
  movingCrate: PlacedCrateLike,
  targetXY: { x: number; y: number },
  bay: CargoBayLike,
  placedCrates: PlacedCrateLike[]
) {
  const maxZ = bay.size.z - movingCrate.dimensions.z;

  for (let z = 0; z <= maxZ; z++) {
    const candidate = {
      bayId: bay.id,
      x: targetXY.x,
      y: targetXY.y,
      z,
    };

    const fitsBox =
      candidate.x + movingCrate.dimensions.x <= bay.size.x &&
      candidate.y + movingCrate.dimensions.y <= bay.size.y &&
      candidate.z + movingCrate.dimensions.z <= bay.size.z;

    if (!fitsBox) continue;

    // Pour les soutes composées, vérifier que tous les voxels sont dans l'union
    if (bay.sections) {
      let allValid = true;
      outer:
      for (let cx = candidate.x; cx < candidate.x + movingCrate.dimensions.x; cx++)
        for (let cy = candidate.y; cy < candidate.y + movingCrate.dimensions.y; cy++)
          for (let cz = z; cz < z + movingCrate.dimensions.z; cz++)
            if (!isValidCellInCompound(cx, cy, cz, bay.sections)) { allValid = false; break outer; }
      if (!allValid) continue;
    }

    const collides = checkCollision(movingCrate, candidate, placedCrates);
    if (collides) continue;

    const supported = bay.sections
      ? checkSupportInCompound(movingCrate, candidate, placedCrates, bay.id, bay.sections)
      : checkSupport(movingCrate, candidate, placedCrates, bay.id);
    if (!supported) continue;

    return candidate;
  }

  return null;
}
