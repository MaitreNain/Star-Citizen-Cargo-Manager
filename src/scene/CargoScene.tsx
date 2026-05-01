import { useCallback, useEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import CargoBayMesh from "./CargoBayMesh";
import CompoundBayMesh from "./CompoundBayMesh";
import CrateMesh from "./CrateMesh";
import CratePreviewMesh from "./CratePreviewMesh";
import OrientationMarkers from "./OrientationMarkers";

import { checkCollision } from "../engine/checkCollision";
import { resolveStackPosition } from "../engine/resolveStackPosition";
import { getRotatedDimensions } from "../engine/getRotatedDimensions";
import { buildCompoundBays } from "../engine/buildCompoundBays";

import type { Ship } from "../types/Ship";
import type { HoveredCell, PlacedCrateWithMeta } from "../types/planner";

type Props = {
  ship: Ship;
  placedCrates?: PlacedCrateWithMeta[];
  selectedCrateId?: string | null;
  onSelectCrate?: (id: string | null) => void;
  hoveredCell?: HoveredCell;
  onHoverCell?: (cell: HoveredCell) => void;
  draggedCrateId?: string | null;
  onStartDrag?: (crateId: string) => void;
  onEndDrag?: () => void;
  dragRotation?: number;
  onRotate?: () => void;
  markedDeliveryIds?: string[];
  isAssigningDelivery?: boolean;
  onBayClick?: (bayId: string) => void;
};

// Composant interne qui invalide la scène quand les données changent
function SceneInvalidator({ deps }: { deps: unknown[] }) {
  const { invalidate } = useThree();
  useEffect(() => { invalidate(); }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function CargoScene({
  ship,
  placedCrates = [],
  selectedCrateId = null,
  onSelectCrate = () => {},
  hoveredCell = null,
  onHoverCell = () => {},
  draggedCrateId = null,
  onStartDrag = () => {},
  onEndDrag = () => {},
  dragRotation = 0,
  onRotate = () => {},
  markedDeliveryIds = [],
  isAssigningDelivery = false,
  onBayClick = () => {},
}: Props) {
  const draggedCrate = placedCrates.find((c) => c.id === draggedCrateId);

  const { compoundBays, individualBays } = useMemo(
    () => buildCompoundBays(ship.cargoBays),
    [ship.cargoBays]
  );

  // Calcule les numéros d'affichage de chaque soute (individuelles et composées)
  const bayDisplayInfo = useMemo(() => {
    const individual = new Map<string, number>();
    const compound = new Map<string, number[]>();
    const processedGroups = new Set<string>();
    let num = 1;
    for (const bay of ship.cargoBays) {
      if (!bay.group) {
        individual.set(bay.id, num++);
      } else if (!processedGroups.has(bay.group)) {
        processedGroups.add(bay.group);
        compound.set(bay.group, [num++]);
      }
    }
    return { individual, compound };
  }, [ship.cargoBays]);

  // Résout l'offset world d'une caisse (soute individuelle ou composée)
  function resolveBayOffset(bayId: string) {
    const bay = ship.cargoBays.find((b) => b.id === bayId);
    if (bay) return bay.offset;
    const cb = compoundBays.find((c) => c.id === bayId);
    return cb?.worldOffset ?? { x: 0, y: 0, z: 0 };
  }

  // Résout une soute (individuelle ou virtuelle composée) pour resolveStackPosition
  function resolveBayForStack(bayId: string) {
    const bay = ship.cargoBays.find((b) => b.id === bayId);
    if (bay) return bay;
    const cb = compoundBays.find((c) => c.id === bayId);
    if (cb) return { id: cb.id, size: cb.boundingBox, sections: cb.sections };
    return null;
  }

  // Touche R pour pivoter pendant le drag de caisse
  const onRotateRef = useRef(onRotate);
  onRotateRef.current = onRotate;
  const draggedCrateIdRef = useRef(draggedCrateId);
  draggedCrateIdRef.current = draggedCrateId;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.key === "r" || e.key === "R") && draggedCrateIdRef.current) {
        e.preventDefault();
        onRotateRef.current();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Callbacks stables : les refs garantissent l'accès aux valeurs les plus récentes
  // sans recréer les fonctions à chaque render (compatibilité React.memo sur CrateMesh)
  const onSelectCrateRef = useRef(onSelectCrate);
  onSelectCrateRef.current = onSelectCrate;
  const onStartDragRef = useRef(onStartDrag);
  onStartDragRef.current = onStartDrag;
  const isAssigningRef = useRef(isAssigningDelivery);
  isAssigningRef.current = isAssigningDelivery;

  const stableOnSelect = useCallback((id: string) => {
    if (!isAssigningRef.current) onSelectCrateRef.current?.(id);
  }, []);

  const stableOnDragStart = useCallback((id: string) => {
    if (!isAssigningRef.current) onStartDragRef.current?.(id);
  }, []);

  let preview: React.ReactNode = null;

  if (draggedCrate && hoveredCell) {
    const bayForStack = resolveBayForStack(hoveredCell.bayId);
    if (bayForStack) {
      const bayOffset = resolveBayOffset(hoveredCell.bayId);
      const rotatedDimensions = getRotatedDimensions(draggedCrate.dimensions, dragRotation);
      const rotatedCrate = { ...draggedCrate, dimensions: rotatedDimensions };
      const resolvedPosition = resolveStackPosition(
        rotatedCrate, { x: hoveredCell.x, y: hoveredCell.y }, bayForStack, placedCrates
      );

      if (resolvedPosition) {
        preview = (
          <CratePreviewMesh
            size={rotatedDimensions}
            gridPosition={resolvedPosition}
            bayOffset={bayOffset}
            valid={true}
          />
        );
      } else {
        const collides = checkCollision(
          rotatedCrate,
          { bayId: bayForStack.id, x: hoveredCell.x, y: hoveredCell.y, z: 0 },
          placedCrates
        );
        preview = (
          <CratePreviewMesh
            size={rotatedDimensions}
            gridPosition={{ x: hoveredCell.x, y: hoveredCell.y, z: 0 }}
            bayOffset={bayOffset}
            valid={!collides}
          />
        );
      }
    }
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas
        camera={{ position: [20, 12, 20], fov: 50 }}
        frameloop="demand"
        onPointerMissed={() => {
          if (!draggedCrateId) {
            onSelectCrate(null);
          }
        }}
      >
        <color attach="background" args={["#060c12"]} />
        <SceneInvalidator deps={[placedCrates, selectedCrateId, hoveredCell, draggedCrateId, isAssigningDelivery, markedDeliveryIds]} />
        <ambientLight intensity={0.8} color="#a0c0d8" />
        <directionalLight position={[10, 20, 8]} intensity={0.9} color="#ffffff" />

        {/* Soutes individuelles */}
        {individualBays.map((bay) => (
          <CargoBayMesh
            key={bay.id}
            bay={bay}
            bayNumber={bayDisplayInfo.individual.get(bay.id) ?? 1}
            isAssignTarget={isAssigningDelivery}
            onHoverCell={isAssigningDelivery ? undefined : onHoverCell}
            onPointerUpCell={isAssigningDelivery ? undefined : onEndDrag}
            onBayClick={onBayClick}
          />
        ))}

        {/* Soutes composées */}
        {compoundBays.map((compound) => (
          <CompoundBayMesh
            key={compound.id}
            compound={compound}
            bayNumbers={bayDisplayInfo.compound.get(compound.id) ?? []}
            isAssignTarget={isAssigningDelivery}
            onHoverCell={isAssigningDelivery ? undefined : onHoverCell}
            onPointerUpCell={isAssigningDelivery ? undefined : onEndDrag}
            onBayClick={onBayClick}
          />
        ))}

        <OrientationMarkers cargoBays={ship.cargoBays} />

        {placedCrates.map((crate) => {
          const bayOffset = resolveBayOffset(crate.bayId);
          const isDimmed = markedDeliveryIds.length > 0 && !markedDeliveryIds.includes(crate.deliveryId ?? "");
          return (
            <CrateMesh
              key={crate.id}
              crateId={crate.id}
              size={crate.dimensions}
              gridPosition={crate.gridPosition}
              bayOffset={bayOffset}
              color={crate.color}
              label={crate.destination}
              selected={crate.id === selectedCrateId}
              dimmed={isDimmed}
              onSelect={stableOnSelect}
              onDragStart={stableOnDragStart}
            />
          );
        })}

        {preview}

        <OrbitControls enabled={!draggedCrateId} />
      </Canvas>

      {/* Bouton rotation mobile */}
      {draggedCrateId && (
        <button
          onPointerDown={(e) => { e.stopPropagation(); onRotate(); }}
          style={{
            position: "absolute", bottom: "24px", right: "24px", zIndex: 10,
            width: "56px", height: "56px", borderRadius: "50%",
            background: "#e07828", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)", fontSize: "22px",
          }}
          title="Pivoter (R)"
        >↻</button>
      )}

      {/* Indicateur R — desktop */}
      {draggedCrateId && (
        <div style={{
          position: "absolute", bottom: "24px", left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.65)", color: "#d7e1ea",
          padding: "6px 14px", borderRadius: "6px",
          fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase", pointerEvents: "none", userSelect: "none",
        }}>
          R — Pivoter
        </div>
      )}

      {/* Indicateur mode assignation */}
      {isAssigningDelivery && (
        <div style={{
          position: "absolute", bottom: "24px", left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(224,120,40,0.9)",
          color: "#060c12",
          padding: "8px 18px", borderRadius: "6px",
          fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase", pointerEvents: "none", userSelect: "none",
          boxShadow: "0 4px 16px rgba(224,120,40,0.4)",
        }}>
          Cliquez sur une soute pour assigner
        </div>
      )}
    </div>
  );
}
