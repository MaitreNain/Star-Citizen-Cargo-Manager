import { useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { CompoundBay, CompoundSection } from "../types/CompoundBay";
import { isValidCellInCompound } from "../engine/buildCompoundBays";
import BayGrid from "./BayGrid";

type CellPosition = { bayId: string; x: number; y: number; z: number };

type Props = {
  compound: CompoundBay;
  bayNumbers: number[];
  isAssignTarget?: boolean;
  onHoverCell?: (cell: CellPosition | null) => void;
  onPointerUpCell?: () => void;
  onBayClick?: (bayId: string) => void;
};

function useLabelTexture(text: string, color: string): { texture: THREE.CanvasTexture; ratio: number } {
  return useMemo(() => {
    const fontSize = 26;
    const paddingH = 28;
    const paddingV = 16;
    const canvasH = fontSize + paddingV * 2;

    const measure = document.createElement("canvas");
    const mctx = measure.getContext("2d")!;
    mctx.font = `bold ${fontSize}px Arial, sans-serif`;
    const textWidth = mctx.measureText(text).width;
    const canvasW = Math.ceil(textWidth + paddingH * 2);

    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "rgba(6,12,18,0.88)";
    ctx.roundRect(2, 2, canvasW - 4, canvasH - 4, 6);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.roundRect(2, 2, canvasW - 4, canvasH - 4, 6);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvasW / 2, canvasH / 2);

    const texture = new THREE.CanvasTexture(canvas);
    return { texture, ratio: canvasW / canvasH };
  }, [text, color]);
}

/**
 * Calcule les arêtes de la silhouette extérieure de l'union des sections.
 *
 * Principe : regrouper d'abord toutes les cellules extérieures par PLAN DE FACE
 * (axe + direction + position fixe) en combinant TOUTES les sections. Ce n'est
 * qu'après cette fusion qu'on calcule les arêtes — ainsi la bordure entre deux
 * sections adjacentes n'est jamais dessinée car leurs cellules appartiennent au
 * même ensemble continu.
 *
 * Mapping game (gx,gy,gz) → THREE local : pts.push(gx, gz, gy)
 */
function buildCompoundWireframe(sections: CompoundSection[]): THREE.BufferGeometry {
  const pts: number[] = [];

  function addEdge(gx1:number,gy1:number,gz1:number, gx2:number,gy2:number,gz2:number) {
    pts.push(gx1,gz1,gy1, gx2,gz2,gy2);
  }

  // Clé de plan de face : "axe:dir:valeur_fixe"
  // axe "x" → cellules (u=gy, v=gz), toGame=(f,u,v)→[f,u,v]
  // axe "y" → cellules (u=gx, v=gz), toGame=(f,u,v)→[u,f,v]
  // axe "z" → cellules (u=gx, v=gy), toGame=(f,u,v)→[u,v,f]
  const byFacePlane = new Map<string, Set<string>>();

  function getPlane(key: string) {
    if (!byFacePlane.has(key)) byFacePlane.set(key, new Set());
    return byFacePlane.get(key)!;
  }

  // Passe 1 : collecter les cellules extérieures, TOUTES SECTIONS CONFONDUES par plan
  for (const s of sections) {
    const { localOffset: o, size: sz } = s;

    // ±x
    for (let gy = o.y; gy < o.y + sz.y; gy++)
      for (let gz = o.z; gz < o.z + sz.z; gz++) {
        if (!isValidCellInCompound(o.x + sz.x, gy, gz, sections))
          getPlane(`x:+:${o.x + sz.x}`).add(`${gy},${gz}`);
        if (!isValidCellInCompound(o.x - 1, gy, gz, sections))
          getPlane(`x:-:${o.x}`).add(`${gy},${gz}`);
      }

    // ±y
    for (let gx = o.x; gx < o.x + sz.x; gx++)
      for (let gz = o.z; gz < o.z + sz.z; gz++) {
        if (!isValidCellInCompound(gx, o.y + sz.y, gz, sections))
          getPlane(`y:+:${o.y + sz.y}`).add(`${gx},${gz}`);
        if (!isValidCellInCompound(gx, o.y - 1, gz, sections))
          getPlane(`y:-:${o.y}`).add(`${gx},${gz}`);
      }

    // ±z
    for (let gx = o.x; gx < o.x + sz.x; gx++)
      for (let gy = o.y; gy < o.y + sz.y; gy++) {
        if (!isValidCellInCompound(gx, gy, o.z + sz.z, sections))
          getPlane(`z:+:${o.z + sz.z}`).add(`${gx},${gy}`);
        if (!isValidCellInCompound(gx, gy, o.z - 1, sections))
          getPlane(`z:-:${o.z}`).add(`${gx},${gy}`);
      }
  }

  // Passe 2 : pour chaque plan, tracer les arêtes frontière de l'ensemble fusionné
  for (const [key, cells] of byFacePlane) {
    const [axisStr, , fvalStr] = key.split(":");
    const f = parseInt(fvalStr);

    const toGame: (u: number, v: number) => [number, number, number] =
      axisStr === "x" ? (u, v) => [f, u, v]
      : axisStr === "y" ? (u, v) => [u, f, v]
      : (u, v) => [u, v, f];

    for (const cellKey of cells) {
      const [u, v] = cellKey.split(",").map(Number);
      const has = (du: number, dv: number) => cells.has(`${u + du},${v + dv}`);

      if (!has(-1, 0)) { const [a,b,c]=toGame(u,v);   const [d,e,g]=toGame(u,v+1);   addEdge(a,b,c,d,e,g); }
      if (!has(+1, 0)) { const [a,b,c]=toGame(u+1,v); const [d,e,g]=toGame(u+1,v+1); addEdge(a,b,c,d,e,g); }
      if (!has(0, -1)) { const [a,b,c]=toGame(u,v);   const [d,e,g]=toGame(u+1,v);   addEdge(a,b,c,d,e,g); }
      if (!has(0, +1)) { const [a,b,c]=toGame(u,v+1); const [d,e,g]=toGame(u+1,v+1); addEdge(a,b,c,d,e,g); }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return geo;
}

export default function CompoundBayMesh({
  compound, bayNumbers, isAssignTarget = false,
  onHoverCell, onPointerUpCell, onBayClick,
}: Props) {
  const { worldOffset, sections, id: groupId } = compound;
  const { invalidate } = useThree();
  const [hovered, setHovered] = useState(false);
  const highlight = isAssignTarget && hovered;

  function setHoveredAndInvalidate(val: boolean) {
    setHovered(val);
    invalidate();
  }

  const wireGeo = useMemo(() => buildCompoundWireframe(sections), [sections]);

  const bayLabel = `SOUTE ${bayNumbers[0]}`;
  const labelText = isAssignTarget ? `> ${bayLabel}` : bayLabel;
  const labelColor = highlight ? "#e07828" : isAssignTarget ? "#f8a060" : "#38bdf8";
  const spriteH = 0.5;
  const labelTex = useLabelTexture(labelText, labelColor);

  const bbMaxZ = Math.max(...sections.map((s) => s.localOffset.z + s.size.z));
  const bbCenterX = compound.boundingBox.x / 2;
  const bbCenterY = compound.boundingBox.y / 2;

  function getCellFromEventPoint(pt: THREE.Vector3): CellPosition {
    return {
      bayId: groupId,
      x: Math.floor(pt.x - worldOffset.x),
      y: Math.floor(pt.z - worldOffset.y),
      z: 0,
    };
  }

  return (
    <group>
      {/* Wireframe fusionné — une seule géométrie pour l'union des sections */}
      <group position={[worldOffset.x, worldOffset.z, worldOffset.y]}>
        <lineSegments geometry={wireGeo}>
          <lineBasicMaterial color={highlight ? "#e07828" : "#1e4a6e"} />
        </lineSegments>
      </group>

      {/* Par section : grille + plan de détection souris */}
      {sections.map((section) => {
        const wx = worldOffset.x + section.localOffset.x;
        const wy = worldOffset.y + section.localOffset.y;
        const wz = worldOffset.z + section.localOffset.z;
        const { x: sw, y: sd, z: sh } = section.size;

        return (
          <group key={section.id} position={[wx, wz, wy]}>
            {section.localOffset.z === 0 && <BayGrid width={sw} depth={sd} />}

            {isAssignTarget && (
              <mesh position={[sw / 2, sh / 2, sd / 2]}>
                <boxGeometry args={[sw, sh, sd]} />
                <meshBasicMaterial
                  color={hovered ? "#e07828" : "#38bdf8"}
                  transparent
                  opacity={hovered ? 0.08 : 0.03}
                />
              </mesh>
            )}

            <mesh
              position={[sw / 2, 0.01, sd / 2]}
              rotation={[-Math.PI / 2, 0, 0]}
              onPointerEnter={() => isAssignTarget && setHoveredAndInvalidate(true)}
              onPointerLeave={() => { setHoveredAndInvalidate(false); onHoverCell?.(null); }}
              onClick={(e) => {
                e.stopPropagation();
                if (isAssignTarget) onBayClick?.(groupId);
              }}
              onPointerMove={(e) => {
                if (!isAssignTarget) onHoverCell?.(getCellFromEventPoint(e.point));
              }}
              onPointerUp={(e) => {
                if (!isAssignTarget) {
                  onHoverCell?.(getCellFromEventPoint(e.point));
                  onPointerUpCell?.();
                }
              }}
              onPointerOut={() => { setHoveredAndInvalidate(false); onHoverCell?.(null); }}
            >
              <planeGeometry args={[sw, sd]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
          </group>
        );
      })}

      {/* Label centré sur le bounding box */}
      <sprite
        position={[worldOffset.x + bbCenterX, worldOffset.z + bbMaxZ + 0.55, worldOffset.y + bbCenterY]}
        scale={[labelTex.ratio * spriteH, spriteH, 1]}
        onClick={(e) => { e.stopPropagation(); if (isAssignTarget) onBayClick?.(groupId); }}
      >
        <spriteMaterial map={labelTex.texture} transparent depthTest={false} />
      </sprite>
    </group>
  );
}
