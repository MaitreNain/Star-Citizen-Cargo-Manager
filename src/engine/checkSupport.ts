import type { Vector3 } from "../types/Vector3";

type PlacedCrateLike = {
  id: string;
  bayId: string;
  gridPosition: Vector3;
  dimensions: Vector3;
};

function occupiesCell(crate: PlacedCrateLike, x: number, y: number, z: number) {
  return (
    x >= crate.gridPosition.x && x < crate.gridPosition.x + crate.dimensions.x &&
    y >= crate.gridPosition.y && y < crate.gridPosition.y + crate.dimensions.y &&
    z >= crate.gridPosition.z && z < crate.gridPosition.z + crate.dimensions.z
  );
}

export function checkSupport(
  movingCrate: { dimensions: Vector3; id: string },
  newPosition: Vector3,
  placedCrates: PlacedCrateLike[],
  bayId: string
) {
  if (newPosition.z === 0) return true;

  const supportZ = newPosition.z - 1;
  const cratesBelow = placedCrates.filter(
    (crate) => crate.id !== movingCrate.id && crate.bayId === bayId
  );

  for (let x = newPosition.x; x < newPosition.x + movingCrate.dimensions.x; x++) {
    for (let y = newPosition.y; y < newPosition.y + movingCrate.dimensions.y; y++) {
      if (!cratesBelow.some((crate) => occupiesCell(crate, x, y, supportZ))) return false;
    }
  }
  return true;
}
