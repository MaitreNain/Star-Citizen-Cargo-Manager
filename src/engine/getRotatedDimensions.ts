import type { Vector3 } from "../types/Vector3";

export function getRotations(dimensions: Vector3): Vector3[] {
  const { x, y, z } = dimensions;
  if (x === y) return [{ x, y, z }];
  return [{ x, y, z }, { x: y, y: x, z }];
}

// dragRotation: 0 = normal, odd = pivot 90° on X/Y plane
export function getRotatedDimensions(dimensions: Vector3, dragRotation: number): Vector3 {
  if (dragRotation % 2 === 0) return dimensions;
  return { x: dimensions.y, y: dimensions.x, z: dimensions.z };
}
