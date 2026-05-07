import { memo, useCallback, useMemo, useRef } from "react";
import * as THREE from "three";

type GridVector3 = { x: number; y: number; z: number };

type Props = {
  crateId: string;
  size: GridVector3;
  gridPosition: GridVector3;
  bayOffset: GridVector3;
  color?: string;
  label?: string;
  selected?: boolean;
  dimmed?: boolean;
  onSelect?: (id: string) => void;
  onDragStart?: (id: string) => void;
};

function useEdgesGeometry(x: number, y: number, z: number) {
  return useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(x, z, y)), [x, y, z]);
}

function useLabelTexture(label: string, bgColor: string, textColor: string): THREE.CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 56;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = bgColor;
    ctx.roundRect(2, 4, 252, 48, 5);
    ctx.fill();
    ctx.strokeStyle = textColor + "88";
    ctx.lineWidth = 1.5;
    ctx.roundRect(2, 4, 252, 48, 5);
    ctx.stroke();
    ctx.fillStyle = textColor;
    ctx.font = "bold 20px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 128, 28);
    return new THREE.CanvasTexture(canvas);
  }, [label, bgColor, textColor]);
}

export default memo(function CrateMesh({
  crateId,
  size, gridPosition, bayOffset,
  color = "orange", label,
  selected = false, dimmed = false,
  onSelect, onDragStart,
}: Props) {
  // Callback refs: handlers stay stable across renders, always read latest values
  const ctxRef = useRef({ crateId, onSelect, onDragStart });
  ctxRef.current = { crateId, onSelect, onDragStart };

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    const { crateId, onSelect } = ctxRef.current;
    onSelect?.(crateId);
  }, []);

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation();
    const { crateId, onDragStart } = ctxRef.current;
    onDragStart?.(crateId);
  }, []);

  const cx = bayOffset.x + gridPosition.x + size.x / 2;
  const cy = bayOffset.z + gridPosition.z + size.z / 2;
  const cz = bayOffset.y + gridPosition.y + size.y / 2;
  const pos: [number, number, number] = [cx, cy, cz];

  const edgesGeo = useEdgesGeometry(size.x, size.y, size.z);

  const spriteTex = useLabelTexture(
    label ?? "",
    selected ? "#1a1200" : "#0a1520",
    selected ? "#facc15" : "#8ab4d4"
  );

  if (dimmed) {
    return (
      <mesh position={pos}>
        <boxGeometry args={[size.x, size.z, size.y]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} />
      </mesh>
    );
  }

  if (selected) {
    return (
      <group position={pos}>
        <mesh onClick={handleClick} onPointerDown={handlePointerDown}>
          <boxGeometry args={[size.x, size.z, size.y]} />
          <meshLambertMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.15} />
        </mesh>
        <lineSegments geometry={edgesGeo}><lineBasicMaterial color="#ffffff" /></lineSegments>
        {!!label && (
          <sprite position={[0, size.z / 2 + 0.35, 0]} scale={[1.5, 0.38, 1]}>
            <spriteMaterial map={spriteTex} transparent depthTest={false} />
          </sprite>
        )}
      </group>
    );
  }

  return (
    <group position={pos}>
      <mesh onClick={handleClick} onPointerDown={handlePointerDown}>
        <boxGeometry args={[size.x, size.z, size.y]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <lineSegments geometry={edgesGeo}><lineBasicMaterial color="#000000" transparent opacity={0.33} /></lineSegments>
    </group>
  );
});
