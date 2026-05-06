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
  bayId: string,
  anchorFace: "floor" | "ceiling" = "floor",
  bayDepthZ: number = 0
) {
  const others = placedCrates.filter(
    (crate) => crate.id !== movingCrate.id && crate.bayId === bayId
  );

  if (anchorFace === "ceiling") {
    if (newPosition.z + movingCrate.dimensions.z === bayDepthZ) return true;
    const supportZ = newPosition.z + movingCrate.dimensions.z;
    for (let x = newPosition.x; x < newPosition.x + movingCrate.dimensions.x; x++)
      for (let y = newPosition.y; y < newPosition.y + movingCrate.dimensions.y; y++)
        if (!others.some((crate) => occupiesCell(crate, x, y, supportZ))) return false;
    return true;
  }

  if (newPosition.z === 0) return true;
  const supportZ = newPosition.z - 1;
  for (let x = newPosition.x; x < newPosition.x + movingCrate.dimensions.x; x++)
    for (let y = newPosition.y; y < newPosition.y + movingCrate.dimensions.y; y++)
      if (!others.some((crate) => occupiesCell(crate, x, y, supportZ))) return false;
  return true;
}
