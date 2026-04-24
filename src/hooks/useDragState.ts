import { useState } from "react";
import type { HoveredCell } from "../types/planner";

export function useDragState() {
  const [selectedCrateId, setSelectedCrateId] = useState<string | null>(null);
  const [draggedCrateId, setDraggedCrateId] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HoveredCell>(null);
  const [dragRotation, setDragRotation] = useState(0);

  function clear() {
    setSelectedCrateId(null);
    setDraggedCrateId(null);
    setHoveredCell(null);
    setDragRotation(0);
  }

  function startDrag(crateId: string) {
    setSelectedCrateId(crateId);
    setDraggedCrateId(crateId);
    setDragRotation(0);
  }

  function rotate() {
    setDragRotation((prev) => prev + 1);
  }

  return {
    selectedCrateId, setSelectedCrateId,
    draggedCrateId, setDraggedCrateId,
    hoveredCell, setHoveredCell,
    dragRotation,
    clear, startDrag, rotate,
  };
}
