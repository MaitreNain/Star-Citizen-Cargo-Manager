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
  const anchor = bay.anchorFace ?? "floor";
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

  // Grid position (Three.js Y axis = game Z / height)
  const gridY = anchor === "ceiling" ? size.z - 0.015 : 0.015;

  // Lateral grid geometry (left/right: YZ plane; front/rear: XY plane)
  const lateralGrid = useMemo(() => {
    const pts: number[] = [];
    if (anchor === "left" || anchor === "right") {
      const gx = anchor === "left" ? 0.015 : size.x - 0.015;
      for (let y = 0; y <= size.z; y++) pts.push(gx, y, 0, gx, y, size.y);
      for (let z = 0; z <= size.y; z++) pts.push(gx, 0, z, gx, size.z, z);
    } else if (anchor === "front" || anchor === "rear") {
      const gz = anchor === "front" ? 0.015 : size.y - 0.015;
      for (let x = 0; x <= size.x; x++) pts.push(x, 0, gz, x, size.z, gz);
      for (let y = 0; y <= size.z; y++) pts.push(0, y, gz, size.x, y, gz);
    }
    if (pts.length === 0) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, [anchor, size.x, size.y, size.z]);

  // Interaction plane: position, rotation, geometry args
  type PlaneConfig = { pos: [number, number, number]; rot: [number, number, number]; args: [number, number] };
  const plane: PlaneConfig = (() => {
    switch (anchor) {
      case "ceiling":
        return { pos: [size.x / 2, size.z - 0.01, size.y / 2], rot: [-Math.PI / 2, 0, 0], args: [size.x, size.y] };
      case "left":
        return { pos: [0.01, size.z / 2, size.y / 2], rot: [0, Math.PI / 2, 0], args: [size.y, size.z] };
      case "right":
        return { pos: [size.x - 0.01, size.z / 2, size.y / 2], rot: [0, -Math.PI / 2, 0], args: [size.y, size.z] };
      case "front":
        return { pos: [size.x / 2, size.z / 2, 0.01], rot: [0, 0, 0], args: [size.x, size.z] };
      case "rear":
        return { pos: [size.x / 2, size.z / 2, size.y - 0.01], rot: [0, Math.PI, 0], args: [size.x, size.z] };
      default: // floor
        return { pos: [size.x / 2, 0.01, size.y / 2], rot: [-Math.PI / 2, 0, 0], args: [size.x, size.y] };
    }
  })();

  function getCellFromEventPoint(pt: THREE.Vector3): CellPosition {
    const lx = pt.x - offset.x;        // local Three.js x = game x
    const ly = pt.y - offset.z;        // local Three.js y = game z (height)
    const lz = pt.z - offset.y;        // local Three.js z = game y (depth)
    const cx = (v: number, max: number) => Math.max(0, Math.min(max - 1, Math.floor(v)));
    switch (anchor) {
      case "left":   return { bayId: bay.id, x: 0,           y: cx(lz, size.y), z: cx(ly, size.z) };
      case "right":  return { bayId: bay.id, x: size.x - 1,  y: cx(lz, size.y), z: cx(ly, size.z) };
      case "front":  return { bayId: bay.id, x: cx(lx, size.x), y: 0,           z: cx(ly, size.z) };
      case "rear":   return { bayId: bay.id, x: cx(lx, size.x), y: size.y - 1,  z: cx(ly, size.z) };
      case "ceiling":return { bayId: bay.id, x: cx(lx, size.x), y: cx(lz, size.y), z: size.z - 1 };
      default:       return { bayId: bay.id, x: cx(lx, size.x), y: cx(lz, size.y), z: 0 };
    }
  }

  return (
    <group position={[offset.x, offset.z, offset.y]}>
      <BayWireframe w={size.x} h={size.z} d={size.y} highlight={highlight} />

      {(anchor === "floor" || anchor === "ceiling") && (
        <BayGrid width={size.x} depth={size.y} gridY={gridY} />
      )}
      {lateralGrid && (
        <lineSegments geometry={lateralGrid}>
          <lineBasicMaterial color="#1a3a5c" transparent opacity={0.6} />
        </lineSegments>
      )}

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
        position={plane.pos}
        rotation={plane.rot}
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
        <planeGeometry args={plane.args} />
        <meshBasicMaterial transparent opacity={0} side={anchor === "floor" || anchor === "ceiling" ? THREE.DoubleSide : THREE.FrontSide} />
      </mesh>
    </group>
  );
}
