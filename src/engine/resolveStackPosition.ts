import type { Vector3 } from "../types/Vector3";
import type { CompoundSection } from "../types/CompoundBay";
import { checkCollision } from "./checkCollision";
import { checkSupport } from "./checkSupport";
import { isValidCellInCompound } from "./buildCompoundBays";
import { checkSupportInCompound } from "./placeCratesInCompoundBay";

type CargoBayLike = {
  id: string;
  size: Vector3;
  sections?: CompoundSection[];
  anchorFace?: "floor" | "ceiling";
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
  const anchor = bay.anchorFace ?? "floor";
  const maxZ = bay.size.z - movingCrate.dimensions.z;

  for (let zi = 0; zi <= maxZ; zi++) {
    const z = anchor === "ceiling" ? maxZ - zi : zi;
    const candidate = { bayId: bay.id, x: targetXY.x, y: targetXY.y, z };

    const fitsBox =
      candidate.x + movingCrate.dimensions.x <= bay.size.x &&
      candidate.y + movingCrate.dimensions.y <= bay.size.y &&
      candidate.z + movingCrate.dimensions.z <= bay.size.z;
    if (!fitsBox) continue;

    if (bay.sections) {
      let allValid = true;
      outer:
      for (let cx = candidate.x; cx < candidate.x + movingCrate.dimensions.x; cx++)
        for (let cy = candidate.y; cy < candidate.y + movingCrate.dimensions.y; cy++)
          for (let cz = z; cz < z + movingCrate.dimensions.z; cz++)
            if (!isValidCellInCompound(cx, cy, cz, bay.sections)) { allValid = false; break outer; }
      if (!allValid) continue;
    }

    if (checkCollision(movingCrate, candidate, placedCrates)) continue;

    const supported = bay.sections
      ? checkSupportInCompound(movingCrate, candidate, placedCrates, bay.id)
      : checkSupport(movingCrate, candidate, placedCrates, bay.id, anchor, bay.size.z);
    if (!supported) continue;

    return candidate;
  }

  return null;
}
