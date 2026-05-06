import type { Vector3 } from "../types/Vector3";
import type { AnchorFace } from "../types/CargoBay";

export function getFloorBaySize(anchor: AnchorFace, size: Vector3): Vector3 {
  switch (anchor) {
    case "floor":
    case "ceiling":
      return { ...size };
    case "left":
    case "right":
      return { x: size.y, y: size.z, z: size.x };
    case "front":
    case "rear":
      return { x: size.x, y: size.z, z: size.y };
  }
}

// Transforms a game-space position+dimension so the anchor face maps to floor (z'=0).
export function transformPosToFloor(
  pos: Vector3,
  dim: Vector3,
  anchor: AnchorFace,
  baySize: Vector3
): Vector3 {
  switch (anchor) {
    case "floor":  return { ...pos };
    case "ceiling": return { x: pos.x, y: pos.y, z: baySize.z - pos.z - dim.z };
    case "left":    return { x: pos.y, y: pos.z, z: pos.x };
    case "right":   return { x: pos.y, y: pos.z, z: baySize.x - pos.x - dim.x };
    case "front":   return { x: pos.x, y: pos.z, z: pos.y };
    case "rear":    return { x: pos.x, y: pos.z, z: baySize.y - pos.y - dim.y };
  }
}

// Permutes dimensions to floor space (same permutation as the position, but no offset).
export function transformDimToFloor(dim: Vector3, anchor: AnchorFace): Vector3 {
  switch (anchor) {
    case "floor":
    case "ceiling": return { ...dim };
    case "left":
    case "right":   return { x: dim.y, y: dim.z, z: dim.x };
    case "front":
    case "rear":    return { x: dim.x, y: dim.z, z: dim.y };
  }
}

// Inverse of transformPosToFloor + transformDimToFloor.
export function untransformFromFloor(
  floorPos: Vector3,
  floorDim: Vector3,
  anchor: AnchorFace,
  baySize: Vector3
): { pos: Vector3; dim: Vector3 } {
  switch (anchor) {
    case "floor":
      return { pos: { ...floorPos }, dim: { ...floorDim } };
    case "ceiling":
      return {
        pos: { x: floorPos.x, y: floorPos.y, z: baySize.z - floorPos.z - floorDim.z },
        dim: { ...floorDim },
      };
    case "left":
      return {
        pos: { x: floorPos.z, y: floorPos.x, z: floorPos.y },
        dim: { x: floorDim.z, y: floorDim.x, z: floorDim.y },
      };
    case "right":
      return {
        pos: { x: baySize.x - floorPos.z - floorDim.z, y: floorPos.x, z: floorPos.y },
        dim: { x: floorDim.z, y: floorDim.x, z: floorDim.y },
      };
    case "front":
      return {
        pos: { x: floorPos.x, y: floorPos.z, z: floorPos.y },
        dim: { x: floorDim.x, y: floorDim.z, z: floorDim.y },
      };
    case "rear":
      return {
        pos: { x: floorPos.x, y: baySize.y - floorPos.z - floorDim.z, z: floorPos.y },
        dim: { x: floorDim.x, y: floorDim.z, z: floorDim.y },
      };
  }
}
