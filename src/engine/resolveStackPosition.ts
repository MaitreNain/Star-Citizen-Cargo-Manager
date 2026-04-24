import { checkCollision } from "./checkCollision";
import { checkSupport } from "./checkSupport";

type Vector3 = {
  x: number;
  y: number;
  z: number;
};

type CargoBayLike = {
  id: string;
  size: Vector3;
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

    const fits =
      candidate.x + movingCrate.dimensions.x <= bay.size.x &&
      candidate.y + movingCrate.dimensions.y <= bay.size.y &&
      candidate.z + movingCrate.dimensions.z <= bay.size.z;

    if (!fits) continue;

    const collides = checkCollision(movingCrate, candidate, placedCrates);
    if (collides) continue;

    const supported = checkSupport(movingCrate, candidate, placedCrates, bay.id);
    if (!supported) continue;

    // Première position valide = la plus basse possible
    return candidate;
  }

  return null;
}
