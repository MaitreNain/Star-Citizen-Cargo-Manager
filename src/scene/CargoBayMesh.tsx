import { useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { CargoBay } from "../types/CargoBay";
import BayGrid from "./BayGrid";
import { useLabelTexture } from "./useLabelTexture";

type CellPosition = { bayId: string; x: number; y: number; z: number };

type Props = {
  bay: CargoBay;
  bayNumber: number;
  bayWord?: string;
  isAssignTarget?: boolean;
  onHoverCell?: (cell: CellPosition | null) => void;
  onPointerUpCell?: () => void;
  onBayClick?: (bayId: string) => void;
};

function BayWireframe({ w, h, d, highlight }: { w: number; h: number; d: number; highlight: boolean }) {
  const geometry = useMemo(() => {
    const pts = [
      0,0,0, w,0,0,  w,0,0, w,0,d,  w,0,d, 0,0,d,  0,0,d, 0,0,0,
      0,0,0, 0,h,0,  w,0,0, w,h,0,  w,0,d, w,h,d,  0,0,d, 0,h,d,
      0,h,0, w,h,0,  w,h,0, w,h,d,  w,h,d, 0,h,d,  0,h,d, 0,h,0,
    ];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, [w, h, d]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={highlight ? "#e07828" : "#1e4a6e"} />
    </lineSegments>
  );
}

export default function CargoBayMesh({
  bay, bayNumber, bayWord = "SOUTE", isAssignTarget = false,
  onHoverCell, onPointerUpCell, onBayClick,
}: Props) {
  const { size, offset } = bay;
  const { invalidate } = useThree();
  const [hovered, setHovered] = useState(false);
  const highlight = isAssignTarget && hovered;

  function setHoveredAndInvalidate(val: boolean) {
    setHovered(val);
    invalidate();
  }

  const labelText = isAssignTarget ? `> ${bayWord} ${bayNumber}` : `${bayWord} ${bayNumber}`;
  const labelColor = highlight ? "#e07828" : isAssignTarget ? "#f8a060" : "#38bdf8";
  const spriteH = 0.5;
  const labelTex = useLabelTexture(labelText, labelColor);

  const isCeiling = bay.anchorFace === "ceiling";
  const gridY = isCeiling ? size.z - 0.015 : 0.015;
  const planeY = isCeiling ? size.z - 0.01 : 0.01;
  const hoverZ = isCeiling ? size.z - 1 : 0;

  function getCellFromEventPoint(pt: { x: number; z: number }): CellPosition {
    return {
      bayId: bay.id,
      x: Math.max(0, Math.min(size.x - 1, Math.floor(pt.x - offset.x))),
      y: Math.max(0, Math.min(size.y - 1, Math.floor(pt.z - offset.y))),
      z: hoverZ,
    };
  }

  return (
    <group position={[offset.x, offset.z, offset.y]}>
      <BayWireframe w={size.x} h={size.z} d={size.y} highlight={highlight} />
      <BayGrid width={size.x} depth={size.y} gridY={gridY} />

      {isAssignTarget && (
        <mesh position={[size.x / 2, size.z / 2, size.y / 2]}>
          <boxGeometry args={[size.x, size.z, size.y]} />
          <meshBasicMaterial color={hovered ? "#e07828" : "#38bdf8"} transparent opacity={hovered ? 0.08 : 0.03} />
        </mesh>
      )}

      <sprite
        position={[size.x / 2, size.z + 0.55, size.y / 2]}
        scale={[labelTex.ratio * spriteH, spriteH, 1]}
        onClick={(e) => { e.stopPropagation(); if (isAssignTarget) onBayClick?.(bay.id); }}
      >
        <spriteMaterial map={labelTex.texture} transparent depthTest={false} />
      </sprite>

      <mesh
        position={[size.x / 2, planeY, size.y / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerEnter={() => isAssignTarget && setHoveredAndInvalidate(true)}
        onPointerLeave={() => { setHoveredAndInvalidate(false); onHoverCell?.(null); }}
        onClick={(e) => {
          e.stopPropagation();
          if (isAssignTarget) onBayClick?.(bay.id);
        }}
        onPointerMove={(e) => { if (!isAssignTarget) onHoverCell?.(getCellFromEventPoint(e.point)); }}
        onPointerUp={(e) => {
          if (!isAssignTarget) { onHoverCell?.(getCellFromEventPoint(e.point)); onPointerUpCell?.(); }
        }}
        onPointerOut={() => { setHoveredAndInvalidate(false); onHoverCell?.(null); }}
      >
        <planeGeometry args={[size.x, size.y]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}
