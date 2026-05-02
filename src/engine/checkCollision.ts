import type { Vector3 } from "../types/Vector3";

type PlacedCrateLike = {
  id: string;
  bayId: string;
  gridPosition: Vector3;
  dimensions: Vector3;
};

export function checkCollision(
  movingCrate: { id: string; dimensions: Vector3 },
  newPosition: { bayId?: string; x: number; y: number; z: number },
  placedCrates: PlacedCrateLike[]
) {
  for (const crate of placedCrates) {
    if (crate.id === movingCrate.id) continue;
    if (newPosition.bayId && crate.bayId !== newPosition.bayId) continue;

    const overlapX =
      newPosition.x < crate.gridPosition.x + crate.dimensions.x &&
      newPosition.x + movingCrate.dimensions.x > crate.gridPosition.x;
    const overlapY =
      newPosition.y < crate.gridPosition.y + crate.dimensions.y &&
      newPosition.y + movingCrate.dimensions.y > crate.gridPosition.y;
    const overlapZ =
      newPosition.z < crate.gridPosition.z + crate.dimensions.z &&
      newPosition.z + movingCrate.dimensions.z > crate.gridPosition.z;

    if (overlapX && overlapY && overlapZ) return true;
  }
  return false;
}
