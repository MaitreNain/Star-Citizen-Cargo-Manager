type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export function getRotatedDimensions(
  dimensions: Vector3,
  dragRotation: number
): Vector3 {
  // V1 : rotation horizontale uniquement
  // 0 = normal
  // 1 = pivot 90° sur le plan X/Y
  if (dragRotation % 2 === 0) {
    return dimensions;
  }

  return {
    x: dimensions.y,
    y: dimensions.x,
    z: dimensions.z,
  };
}