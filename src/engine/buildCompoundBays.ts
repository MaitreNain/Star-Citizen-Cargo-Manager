import type { CargoBay } from "../types/CargoBay";
import type { CompoundBay, CompoundSection } from "../types/CompoundBay";
import type { Vector3 } from "../types/Vector3";

export function isValidCellInCompound(x: number, y: number, z: number, sections: CompoundSection[]): boolean {
  return sections.some(
    (s) =>
      x >= s.localOffset.x && x < s.localOffset.x + s.size.x &&
      y >= s.localOffset.y && y < s.localOffset.y + s.size.y &&
      z >= s.localOffset.z && z < s.localOffset.z + s.size.z
  );
}

export function buildCompoundBays(bays: CargoBay[]): {
  compoundBays: CompoundBay[];
  individualBays: CargoBay[];
} {
  const grouped = new Map<string, CargoBay[]>();
  const individualBays: CargoBay[] = [];

  for (const bay of bays) {
    if (bay.group) {
      if (!grouped.has(bay.group)) grouped.set(bay.group, []);
      grouped.get(bay.group)!.push(bay);
    } else {
      individualBays.push(bay);
    }
  }

  const compoundBays: CompoundBay[] = [];
  for (const [groupId, groupBays] of grouped) {
    const worldOffset: Vector3 = {
      x: Math.min(...groupBays.map((b) => b.offset.x)),
      y: Math.min(...groupBays.map((b) => b.offset.y)),
      z: Math.min(...groupBays.map((b) => b.offset.z)),
    };
    const sections: CompoundSection[] = groupBays.map((b) => ({
      id: b.id,
      name: b.name,
      localOffset: {
        x: b.offset.x - worldOffset.x,
        y: b.offset.y - worldOffset.y,
        z: b.offset.z - worldOffset.z,
      },
      size: b.size,
    }));
    const boundingBox: Vector3 = {
      x: Math.max(...sections.map((s) => s.localOffset.x + s.size.x)),
      y: Math.max(...sections.map((s) => s.localOffset.y + s.size.y)),
      z: Math.max(...sections.map((s) => s.localOffset.z + s.size.z)),
    };
    compoundBays.push({ id: groupId, worldOffset, boundingBox, sections });
  }

  return { compoundBays, individualBays };
}

export function buildSingleCompoundBay(bays: CargoBay[], groupId: string): CompoundBay | null {
  const { compoundBays } = buildCompoundBays(bays);
  return compoundBays.find((c) => c.id === groupId) ?? null;
}
