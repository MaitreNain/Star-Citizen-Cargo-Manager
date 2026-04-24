import { Edges } from "@react-three/drei";

type GridVector3 = { x: number; y: number; z: number };

type Props = {
  size: GridVector3;
  gridPosition: GridVector3;
  bayOffset: GridVector3;
  valid: boolean;
};

export default function CratePreviewMesh({ size, gridPosition, bayOffset, valid }: Props) {
  const centerX = bayOffset.x + gridPosition.x + size.x / 2;
  const centerY = bayOffset.z + gridPosition.z + size.z / 2;
  const centerZ = bayOffset.y + gridPosition.y + size.y / 2;

  return (
    <mesh position={[centerX, centerY, centerZ]}>
      <boxGeometry args={[size.x, size.z, size.y]} />
      <meshStandardMaterial
        color={valid ? "#22d3a0" : "#ef4444"}
        transparent
        opacity={valid ? 0.22 : 0.18}
        roughness={0.8}
      />
      <Edges
        scale={1.002}
        color={valid ? "#22d3a0" : "#ef4444"}
        lineWidth={1.2}
      />
    </mesh>
  );
}
