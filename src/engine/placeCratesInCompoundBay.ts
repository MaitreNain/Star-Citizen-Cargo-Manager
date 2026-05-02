import type { Vector3 } from "../types/Vector3";
import type { PlacedCrate } from "../types/PlacedCrate";
import type { CompoundBay } from "../types/CompoundBay";
import { checkCollision } from "./checkCollision";
import { isValidCellInCompound } from "./buildCompoundBays";
import { getRotations } from "./getRotatedDimensions";

type CrateLike = { id: string; bayId: string; gridPosition: Vector3; dimensions: Vector3 };

type CrateToPlace = {
  id: string;
  size: number;
  dimensions: Vector3;
  contractId?: string;
  contractName?: string;
  destination?: string;
  commodity?: string;
  color?: string;
};

export function checkSupportInCompound(
  movingCrate: { dimensions: Vector3; id: string },
  position: Vector3,
  placedCrates: Array<CrateLike>,
  bayId: string
): boolean {
  if (position.z === 0) return true;

  const belowZ = position.z - 1;
  const cratesBelow = placedCrates.filter((c) => c.id !== movingCrate.id && c.bayId === bayId);

  for (let x = position.x; x < position.x + movingCrate.dimensions.x; x++) {
    for (let y = position.y; y < position.y + movingCrate.dimensions.y; y++) {
      const hasSupport = cratesBelow.some(
        (c) =>
          x >= c.gridPosition.x && x < c.gridPosition.x + c.dimensions.x &&
          y >= c.gridPosition.y && y < c.gridPosition.y + c.dimensions.y &&
          belowZ >= c.gridPosition.z && belowZ < c.gridPosition.z + c.dimensions.z
      );
      if (!hasSupport) return false;
    }
  }
  return true;
}

function findBestPosition(
  crate: CrateToPlace,
  compound: CompoundBay,
  alreadyPlaced: Array<PlacedCrate>
): { position: Vector3; dimensions: Vector3 } | null {
  const { sections, boundingBox, id: bayId } = compound;
  const rotations = getRotations(crate.dimensions);

  for (const dims of rotations) {
    const maxX = boundingBox.x - dims.x;
    const maxY = boundingBox.y - dims.y;
    const maxZ = boundingBox.z - dims.z;
    if (maxX < 0 || maxY < 0 || maxZ < 0) continue;

    for (let y = maxY; y >= 0; y--) {
      for (let x = 0; x <= maxX; x++) {
        for (let z = 0; z <= maxZ; z++) {
          const position = { x, y, z };

          let allValid = true;
          outer:
          for (let cx = x; cx < x + dims.x; cx++)
            for (let cy = y; cy < y + dims.y; cy++)
              for (let cz = z; cz < z + dims.z; cz++)
                if (!isValidCellInCompound(cx, cy, cz, sections)) { allValid = false; break outer; }
          if (!allValid) continue;

          if (checkCollision({ id: crate.id, dimensions: dims }, { ...position, bayId }, alreadyPlaced)) continue;
          if (!checkSupportInCompound({ id: crate.id, dimensions: dims }, position, alreadyPlaced, bayId)) continue;

          return { position, dimensions: dims };
        }
      }
    }
  }
  return null;
}

export function placeCratesInCompoundBay(
  crates: CrateToPlace[],
  compound: CompoundBay,
  alreadyPlaced: Array<PlacedCrate> = []
): Array<PlacedCrate & CrateToPlace> {
  const placed: Array<PlacedCrate & CrateToPlace> = [];
  for (const crate of crates) {
    const result = findBestPosition(crate, compound, [...alreadyPlaced, ...placed]);
    if (!result) continue;
    placed.push({
      ...crate,
      dimensions: result.dimensions,
      sizeScu: crate.size,
      bayId: compound.id,
      gridPosition: result.position,
    });
  }
  return placed;
}
