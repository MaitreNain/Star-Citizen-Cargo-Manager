import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLanguage } from "../i18n/LanguageContext";
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
  const { t } = useLanguage();
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

  function resolveBayForStack(bayId: string) {
    const bay = ship.cargoBays.find((b) => b.id === bayId);
    if (bay) return bay;
    const cb = compoundBays.find((c) => c.id === bayId);
    if (cb) return { id: cb.id, size: cb.boundingBox, sections: cb.sections, anchorFace: undefined };
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

  // Annule le drag si le pointeur est relâché hors du canvas (pointerup jamais reçu par les bays).
  // Le ref guard empêche le double-déclenchement quand pointerup atterrit sur une bay
  // (mesh handler + window handler se déclenchent dans le même tick synchrone).
  const onEndDragRef = useRef(onEndDrag);
  onEndDragRef.current = onEndDrag;
  const dragHandledRef = useRef(false);
  useEffect(() => { dragHandledRef.current = false; }, [draggedCrateId]);

  useEffect(() => {
    if (!draggedCrateId) return;
    function handleWindowPointerUp() {
      if (!dragHandledRef.current) onEndDragRef.current();
      dragHandledRef.current = false;
    }
    window.addEventListener("pointerup", handleWindowPointerUp);
    return () => window.removeEventListener("pointerup", handleWindowPointerUp);
  }, [draggedCrateId]);

  const wrappedOnEndDrag = useCallback(() => {
    dragHandledRef.current = true;
    onEndDrag();
  }, [onEndDrag]);

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

  // Centers the hovered cell so the dragged crate is centered on the cursor.
  // Only the two free axes are shifted (the fixed axis depends on the anchor face).
  function centerCell(rawCell: HoveredCell): HoveredCell {
    if (!rawCell || !draggedCrate) return rawCell;
    const info = resolveBayForStack(rawCell.bayId);
    if (!info) return rawCell;
    const anchor = info.anchorFace ?? "floor";
    const { size } = info;
    const dims = getRotatedDimensions(draggedCrate.dimensions, dragRotation, anchor);
    const cl = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    let { x, y, z } = rawCell;
    switch (anchor) {
      case "right": case "left":
        y = cl(y - Math.floor(dims.y / 2), 0, size.y - dims.y);
        z = cl(z - Math.floor(dims.z / 2), 0, size.z - dims.z);
        break;
      case "front": case "rear":
        x = cl(x - Math.floor(dims.x / 2), 0, size.x - dims.x);
        z = cl(z - Math.floor(dims.z / 2), 0, size.z - dims.z);
        break;
      default: // floor, ceiling
        x = cl(x - Math.floor(dims.x / 2), 0, size.x - dims.x);
        y = cl(y - Math.floor(dims.y / 2), 0, size.y - dims.y);
    }
    return { ...rawCell, x, y, z };
  }

  let preview: React.ReactNode = null;

  if (draggedCrate && hoveredCell) {
    const bayForStack = resolveBayForStack(hoveredCell.bayId);
    if (bayForStack) {
      const bayOffset = resolveBayOffset(hoveredCell.bayId);
      const rotatedDimensions = getRotatedDimensions(draggedCrate.dimensions, dragRotation, bayForStack.anchorFace);
      const rotatedCrate = { ...draggedCrate, dimensions: rotatedDimensions };
      const resolvedPosition = resolveStackPosition(
        rotatedCrate, hoveredCell, bayForStack, placedCrates
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
            bayWord={t("scene.bay")}
            isAssignTarget={isAssigningDelivery}
            onHoverCell={isAssigningDelivery ? undefined : (cell) => onHoverCell(centerCell(cell))}
            onPointerUpCell={isAssigningDelivery ? undefined : wrappedOnEndDrag}
            onBayClick={onBayClick}
          />
        ))}

        {/* Soutes composées */}
        {compoundBays.map((compound) => (
          <CompoundBayMesh
            key={compound.id}
            compound={compound}
            bayNumbers={bayDisplayInfo.compound.get(compound.id) ?? []}
            bayWord={t("scene.bay")}
            isAssignTarget={isAssigningDelivery}
            onHoverCell={isAssigningDelivery ? undefined : (cell) => onHoverCell(centerCell(cell))}
            onPointerUpCell={isAssigningDelivery ? undefined : wrappedOnEndDrag}
            onBayClick={onBayClick}
          />
        ))}

        <OrientationMarkers cargoBays={ship.cargoBays} rearLabel={t("scene.ramp")} frontLabel={t("scene.front")} />

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
          {t("scene.clickBay")}
        </div>
      )}
    </div>
  );
}
