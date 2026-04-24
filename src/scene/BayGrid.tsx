import { useMemo } from "react";
import * as THREE from "three";

type BayGridProps = {
  width: number;
  depth: number;
};

export default function BayGrid({ width, depth }: BayGridProps) {
  const geometry = useMemo(() => {
    const points: number[] = [];

    for (let x = 0; x <= width; x++) {
      points.push(x, 0.015, 0, x, 0.015, depth);
    }
    for (let z = 0; z <= depth; z++) {
      points.push(0, 0.015, z, width, 0.015, z);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return geo;
  }, [width, depth]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#1a3a5c" transparent opacity={0.6} />
    </lineSegments>
  );
}
