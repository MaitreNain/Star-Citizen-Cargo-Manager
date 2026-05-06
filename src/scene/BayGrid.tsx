import { useMemo } from "react";
import * as THREE from "three";

type BayGridProps = {
  width: number;
  depth: number;
  gridY?: number;
};

export default function BayGrid({ width, depth, gridY = 0.015 }: BayGridProps) {
  const geometry = useMemo(() => {
    const points: number[] = [];

    for (let x = 0; x <= width; x++) {
      points.push(x, gridY, 0, x, gridY, depth);
    }
    for (let z = 0; z <= depth; z++) {
      points.push(0, gridY, z, width, gridY, z);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return geo;
  }, [width, depth, gridY]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#1a3a5c" transparent opacity={0.6} />
    </lineSegments>
  );
}
