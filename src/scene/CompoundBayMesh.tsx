import { useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { CompoundBay, CompoundSection } from "../types/CompoundBay";
import { isValidCellInCompound } from "../engine/buildCompoundBays";
import BayGrid from "./BayGrid";
import { useLabelTexture } from "./useLabelTexture";

type CellPosition = { bayId: string; x: number; y: number; z: number };

type Props = {
  compound: CompoundBay;
  bayNumbers: number[];
  bayWord?: string;
  isAssignTarget?: boolean;
  onHoverCell?: (cell: CellPosition | null) => void;
  onPointerUpCell?: () => void;
  onBayClick?: (bayId: string) => void;
};

/**
 * Calcule les arêtes (wireframe) ET les triangles (fill) de la silhouette extérieure
 * de l'union des sections en un seul passage.
 *
 * Passe 1 : pour chaque plan de face (axe + direction + valeur fixe), collecter
 * les cellules extérieures de TOUTES les sections combinées.
 * Passe 2 : générer les arêtes et les triangles depuis l'ensemble fusionné —
 * les bordures internes entre sections adjacentes ne sont jamais dessinées.
 *
 * Mapping game (gx,gy,gz) → THREE local : (gx, gz, gy)
 */
function buildCompoundGeometry(sections: CompoundSection[]): {
  wireGeo: THREE.BufferGeometry;
  fillGeo: THREE.BufferGeometry;
} {
  const edgePts: number[] = [];
  const fillPts: number[] = [];

  // Passe 1 — cellules extérieures par plan de face
  const byFacePlane = new Map<string, Set<string>>();
  function getPlane(key: string) {
    if (!byFacePlane.has(key)) byFacePlane.set(key, new Set());
    return byFacePlane.get(key)!;
  }

  for (const s of sections) {
    const { localOffset: o, size: sz } = s;

    for (let gy = o.y; gy < o.y + sz.y; gy++)
      for (let gz = o.z; gz < o.z + sz.z; gz++) {
        if (!isValidCellInCompound(o.x + sz.x, gy, gz, sections))
          getPlane(`x:+:${o.x + sz.x}`).add(`${gy},${gz}`);
        if (!isValidCellInCompound(o.x - 1, gy, gz, sections))
          getPlane(`x:-:${o.x}`).add(`${gy},${gz}`);
      }

    for (let gx = o.x; gx < o.x + sz.x; gx++)
      for (let gz = o.z; gz < o.z + sz.z; gz++) {
        if (!isValidCellInCompound(gx, o.y + sz.y, gz, sections))
          getPlane(`y:+:${o.y + sz.y}`).add(`${gx},${gz}`);
        if (!isValidCellInCompound(gx, o.y - 1, gz, sections))
          getPlane(`y:-:${o.y}`).add(`${gx},${gz}`);
      }

    for (let gx = o.x; gx < o.x + sz.x; gx++)
      for (let gy = o.y; gy < o.y + sz.y; gy++) {
        if (!isValidCellInCompound(gx, gy, o.z + sz.z, sections))
          getPlane(`z:+:${o.z + sz.z}`).add(`${gx},${gy}`);
        if (!isValidCellInCompound(gx, gy, o.z - 1, sections))
          getPlane(`z:-:${o.z}`).add(`${gx},${gy}`);
      }
  }

  // Passe 2 — arêtes et triangles depuis l'ensemble fusionné par plan
  for (const [key, cells] of byFacePlane) {
    const [axisStr, dir, fvalStr] = key.split(":");
    const f = parseInt(fvalStr);

    // Mapping (f, u, v) → THREE local (gx, gz, gy) selon l'axe :
    //   x: u=gy, v=gz  →  (f, v, u)
    //   y: u=gx, v=gz  →  (u, v, f)
    //   z: u=gx, v=gy  →  (u, f, v)
    const corner: (u: number, v: number) => [number, number, number] =
      axisStr === "x" ? (u, v) => [f, v, u]
      : axisStr === "y" ? (u, v) => [u, v, f]
      : (u, v) => [u, f, v];

    // Winding CCW pour normale sortante (FrontSide) :
    //   x:+ → flip, x:- → normal
    //   y:+ → normal, y:- → flip
    //   z:+ → flip, z:- → normal
    const flip =
      (axisStr === "x" && dir === "+") ||
      (axisStr === "y" && dir === "-") ||
      (axisStr === "z" && dir === "+");

    for (const cellKey of cells) {
      const [u, v] = cellKey.split(",").map(Number);
      const has = (du: number, dv: number) => cells.has(`${u + du},${v + dv}`);

      const [a0,b0,c0] = corner(u,   v  );
      const [a1,b1,c1] = corner(u,   v+1);
      const [a2,b2,c2] = corner(u+1, v+1);
      const [a3,b3,c3] = corner(u+1, v  );

      // Arêtes : bords sans voisin uniquement
      if (!has(-1, 0)) edgePts.push(a0,b0,c0, a1,b1,c1);
      if (!has(+1, 0)) edgePts.push(a3,b3,c3, a2,b2,c2);
      if (!has(0, -1)) edgePts.push(a0,b0,c0, a3,b3,c3);
      if (!has(0, +1)) edgePts.push(a1,b1,c1, a2,b2,c2);

      // Triangles : winding selon la normale sortante
      if (!flip) {
        fillPts.push(a0,b0,c0, a3,b3,c3, a2,b2,c2);
        fillPts.push(a0,b0,c0, a2,b2,c2, a1,b1,c1);
      } else {
        fillPts.push(a0,b0,c0, a1,b1,c1, a2,b2,c2);
        fillPts.push(a0,b0,c0, a2,b2,c2, a3,b3,c3);
      }
    }
  }

  const wireGeo = new THREE.BufferGeometry();
  wireGeo.setAttribute("position", new THREE.Float32BufferAttribute(edgePts, 3));

  const fillGeo = new THREE.BufferGeometry();
  fillGeo.setAttribute("position", new THREE.Float32BufferAttribute(fillPts, 3));

  return { wireGeo, fillGeo };
}

export default function CompoundBayMesh({
  compound, bayNumbers, bayWord = "SOUTE", isAssignTarget = false,
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

  const { wireGeo, fillGeo } = useMemo(() => buildCompoundGeometry(sections), [sections]);

  const bayLabel = `${bayWord} ${bayNumbers[0]}`;
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
      <group position={[worldOffset.x, worldOffset.z, worldOffset.y]}>
        <lineSegments geometry={wireGeo}>
          <lineBasicMaterial color={highlight ? "#e07828" : "#1e4a6e"} />
        </lineSegments>

        {isAssignTarget && (
          <mesh geometry={fillGeo}>
            <meshBasicMaterial
              color={hovered ? "#e07828" : "#38bdf8"}
              transparent
              opacity={hovered ? 0.08 : 0.03}
              side={THREE.FrontSide}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>

      {sections.map((section) => {
        const wx = worldOffset.x + section.localOffset.x;
        const wy = worldOffset.y + section.localOffset.y;
        const wz = worldOffset.z + section.localOffset.z;
        const { x: sw, y: sd } = section.size;

        return (
          <group key={section.id} position={[wx, wz, wy]}>
            {section.localOffset.z === 0 && <BayGrid width={sw} depth={sd} />}

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
              <meshBasicMaterial
                color={highlight ? "#e07828" : "#0c2840"}
                transparent={section.localOffset.z !== 0 || highlight}
                opacity={section.localOffset.z !== 0 ? 0 : highlight ? 0.35 : 1}
                depthWrite={section.localOffset.z === 0}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}

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
