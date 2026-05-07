import type { Vector3 } from "../types/Vector3";
import type { AnchorFace } from "../types/CargoBay";

export function getRotations(dimensions: Vector3): Vector3[] {
  const { x, y, z } = dimensions;
  if (x === y) return [{ x, y, z }];
  return [{ x, y, z }, { x: y, y: x, z }];
}

// For lateral anchor faces: only rotations around the axis perpendicular to the anchor face.
// In floor space, floor_z = depth from wall, so we keep floor_z at its minimum (crate lies flat)
// and only vary floor_x/floor_y (rotation around the perpendicular axis).
export function getRotationsLateral(dimensions: Vector3): Vector3[] {
  const { x, y, z } = dimensions;
  const seen = new Set<string>();
  const all: Vector3[] = [];
  for (const [a, b, c] of [
    [x, y, z], [x, z, y], [y, x, z], [y, z, x], [z, x, y], [z, y, x],
  ] as [number, number, number][]) {
    const key = `${a},${b},${c}`;
    if (!seen.has(key)) { seen.add(key); all.push({ x: a, y: b, z: c }); }
  }
  const minZ = Math.min(...all.map(p => p.z));
  return all.filter(p => p.z === minZ).sort((a, b) => a.y - b.y);
}

// dragRotation: 0 = normal, odd = pivot 90° around the axis perpendicular to the anchor face.
// floor/ceiling → rotate around Z (swap x↔y)
// right/left    → rotate around X (swap y↔z)
// front/rear    → rotate around Y (swap x↔z)
export function getRotatedDimensions(dimensions: Vector3, dragRotation: number, anchorFace?: AnchorFace): Vector3 {
  if (dragRotation % 2 === 0) return dimensions;
  switch (anchorFace) {
    case "left":
    case "right":
      return { x: dimensions.x, y: dimensions.z, z: dimensions.y };
    case "front":
    case "rear":
      return { x: dimensions.z, y: dimensions.y, z: dimensions.x };
    default:
      return { x: dimensions.y, y: dimensions.x, z: dimensions.z };
  }
}
