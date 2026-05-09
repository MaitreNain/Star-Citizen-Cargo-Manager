import type { CargoBay } from "../types/CargoBay";
import type { Vector3 } from "../types/Vector3";
import { buildCompoundBays, isValidCellInCompound } from "./buildCompoundBays";

type CrateLike = { bayId: string; gridPosition: Vector3; dimensions: Vector3 };

const SCU_SIZES = [32, 24, 16, 8, 4, 2, 1];

const SCU_DIMS: Record<number, [number, number, number]> = {
  1:  [1, 1, 1], 2:  [2, 1, 1], 4:  [2, 2, 1],
  8:  [2, 2, 2], 16: [4, 2, 2], 24: [6, 2, 2], 32: [8, 2, 2],
};

function orientations([a, b, c]: [number, number, number]): [number, number, number][] {
  return [[a, b, c], [b, a, c]];
}

function buildOccupied(bayId: string, W: number, D: number, placedCrates: CrateLike[]): Set<number> {
  const s = new Set<number>();
  for (const c of placedCrates) {
    if (c.bayId !== bayId) continue;
    const { x, y, z } = c.gridPosition;
    const { x: dx, y: dy, z: dz } = c.dimensions;
    for (let cx = x; cx < x + dx; cx++)
      for (let cy = y; cy < y + dy; cy++)
        for (let cz = z; cz < z + dz; cz++)
          s.add(cx + cy * W + cz * W * D);
  }
  return s;
}

function countFittingCrates(
  W: number, D: number, H: number,
  occupied: Set<number>,
  scu: number,
  validCell?: (x: number, y: number, z: number) => boolean
): number {
  let count = 0;
  let found = true;
  while (found) {
    found = false;
    outer:
    for (const [dx, dy, dz] of orientations(SCU_DIMS[scu])) {
      if (dx > W || dy > D || dz > H) continue;
      for (let z = 0; z <= H - dz && !found; z++)
        for (let y = 0; y <= D - dy && !found; y++)
          for (let x = 0; x <= W - dx && !found; x++) {
            if (validCell) {
              let allValid = true;
              vcheck:
              for (let cx = x; cx < x + dx; cx++)
                for (let cy = y; cy < y + dy; cy++)
                  for (let cz = z; cz < z + dz; cz++)
                    if (!validCell(cx, cy, cz)) { allValid = false; break vcheck; }
              if (!allValid) continue;
            }
            let ok = true;
            check:
            for (let cx = x; cx < x + dx; cx++)
              for (let cy = y; cy < y + dy; cy++)
                for (let cz = z; cz < z + dz; cz++)
                  if (occupied.has(cx + cy * W + cz * W * D)) { ok = false; break check; }
            if (ok) {
              for (let cx = x; cx < x + dx; cx++)
                for (let cy = y; cy < y + dy; cy++)
                  for (let cz = z; cz < z + dz; cz++)
                    occupied.add(cx + cy * W + cz * W * D);
              count++;
              found = true;
            }
          }
      if (found) break outer;
    }
  }
  return count;
}

export function computeRemainingCapacity(
  cargoBays: CargoBay[],
  placedCrates: CrateLike[]
): { scu: number; count: number }[] {
  const { compoundBays, individualBays } = buildCompoundBays(cargoBays);
  const countsByScu = new Map<number, number>();

  for (const bay of individualBays) {
    const { x: W, y: D, z: H } = bay.size;
    const occupied = buildOccupied(bay.id, W, D, placedCrates);
    for (const scu of SCU_SIZES) {
      const count = countFittingCrates(W, D, H, occupied, scu);
      if (count > 0) countsByScu.set(scu, (countsByScu.get(scu) ?? 0) + count);
    }
  }

  for (const compound of compoundBays) {
    const { x: W, y: D, z: H } = compound.boundingBox;
    const occupied = buildOccupied(compound.id, W, D, placedCrates);
    for (const scu of SCU_SIZES) {
      const count = countFittingCrates(W, D, H, occupied, scu,
        (cx, cy, cz) => isValidCellInCompound(cx, cy, cz, compound.sections));
      if (count > 0) countsByScu.set(scu, (countsByScu.get(scu) ?? 0) + count);
    }
  }

  const result: { scu: number; count: number }[] = [];
  for (const scu of SCU_SIZES) {
    const count = countsByScu.get(scu) ?? 0;
    if (count > 0) {
      result.push({ scu, count });
      if (result.length >= 3) break;
    }
  }
  return result;
}
