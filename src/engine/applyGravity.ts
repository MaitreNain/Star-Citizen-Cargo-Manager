import { checkSupport } from "./checkSupport";
import { resolveStackPosition } from "./resolveStackPosition";

type Vector3 = { x: number; y: number; z: number };

type PlacedCrateLike = {
  id: string;
  bayId: string;
  gridPosition: Vector3;
  dimensions: Vector3;
};

type CargoBayLike = {
  id: string;
  size: Vector3;
};

function findElsewhere(
  crate: PlacedCrateLike,
  bay: CargoBayLike,
  others: PlacedCrateLike[]
): { bayId: string; x: number; y: number; z: number } | null {
  for (let y = 0; y <= bay.size.y - crate.dimensions.y; y++) {
    for (let x = 0; x <= bay.size.x - crate.dimensions.x; x++) {
      if (x === crate.gridPosition.x && y === crate.gridPosition.y) continue;
      const pos = resolveStackPosition(crate, { x, y }, bay, others);
      if (pos) return pos;
    }
  }
  return null;
}

export function applyGravity<T extends PlacedCrateLike>(
  crates: T[],
  bays: CargoBayLike[]
): T[] {
  const bayMap = new Map(bays.map(b => [b.id, b]));
  let state = [...crates];

  while (true) {
    const unsupported = state
      .filter(c => !checkSupport(c, c.gridPosition, state, c.bayId))
      .sort((a, b) => a.gridPosition.z - b.gridPosition.z);

    if (unsupported.length === 0) break;

    let anyMoved = false;

    for (const crate of unsupported) {
      if (checkSupport(crate, crate.gridPosition, state, crate.bayId)) continue;

      const bay = bayMap.get(crate.bayId);
      if (!bay) continue;

      const others = state.filter(c => c.id !== crate.id);

      const pos =
        resolveStackPosition(crate, { x: crate.gridPosition.x, y: crate.gridPosition.y }, bay, others) ??
        findElsewhere(crate, bay, others);

      if (pos) {
        state = state.map(c =>
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
