import type { Vector3 } from "../types/Vector3";
import type { CompoundSection } from "../types/CompoundBay";
import { checkSupport } from "./checkSupport";
import { checkSupportInCompound } from "./placeCratesInCompoundBay";
import { resolveStackPosition } from "./resolveStackPosition";

type PlacedCrateLike = {
  id: string;
  bayId: string;
  gridPosition: Vector3;
  dimensions: Vector3;
};

type CargoBayLike = {
  id: string;
  size: Vector3;
  sections?: CompoundSection[];
  anchorFace?: "floor" | "ceiling";
};

export function applyGravity<T extends PlacedCrateLike>(
  crates: T[],
  bays: CargoBayLike[]
): T[] {
  const bayMap = new Map(bays.map((b) => [b.id, b]));
  let state = [...crates];

  while (true) {
    const unsupported = state
      .filter((c) => {
        const bay = bayMap.get(c.bayId);
        if (!bay) return false;
        return bay.sections
          ? !checkSupportInCompound(c, c.gridPosition, state, c.bayId)
          : !checkSupport(c, c.gridPosition, state, c.bayId, bay.anchorFace ?? "floor", bay.size.z);
      })
      .sort((a, b) => {
        const anchor = bayMap.get(a.bayId)?.anchorFace ?? "floor";
        return anchor === "ceiling"
          ? b.gridPosition.z - a.gridPosition.z
          : a.gridPosition.z - b.gridPosition.z;
      });

    if (unsupported.length === 0) break;

    let anyMoved = false;

    for (const crate of unsupported) {
      const bay = bayMap.get(crate.bayId);
      if (!bay) continue;

      const supported = bay.sections
        ? checkSupportInCompound(crate, crate.gridPosition, state, crate.bayId)
        : checkSupport(crate, crate.gridPosition, state, crate.bayId, bay.anchorFace ?? "floor", bay.size.z);
      if (supported) continue;

      const others = state.filter((c) => c.id !== crate.id);
      const pos = resolveStackPosition(
        crate,
        { x: crate.gridPosition.x, y: crate.gridPosition.y },
        bay,
        others
      );

      if (pos) {
        state = state.map((c) =>
          c.id === crate.id
            ? { ...c, bayId: pos.bayId, gridPosition: { x: pos.x, y: pos.y, z: pos.z } }
            : c
        );
        anyMoved = true;
      }
    }

    if (!anyMoved) break;
  }

  return state;
}
