import type { PlacedCrate } from "../types/PlacedCrate";
import type { DeliveryFragment } from "../types/DeliveryFragment";
import { placeCratesInBay } from "./placeCratesInBay";
import { placeCratesInCompoundBay } from "./placeCratesInCompoundBay";
import { buildCompoundBays } from "./buildCompoundBays";

type Crate = {
  id: string;
  size: number;
  dimensions: { x: number; y: number; z: number };
  contractId?: string;
  contractName?: string;
  deliveryId?: string;
  destination?: string;
  commodity?: string;
  color?: string;
  assignedBayId?: string;
};

type Bay = {
  id: string;
  name: string;
  size: { x: number; y: number; z: number };
  offset: { x: number; y: number; z: number };
  group?: string;
  anchorFace?: "floor" | "ceiling" | "left" | "right" | "front" | "rear";
  maxCrateScu?: number;
};

type Ship = {
  cargoBays: Bay[];
  maxCrateScu?: number;
};

type PlacedCrateWithSource = PlacedCrate & Crate;

type PlacementResult = {
  placed: PlacedCrateWithSource[];
  fragments: DeliveryFragment[];
};

export function placeCratesInShip(crates: Crate[], ship: Ship): PlacementResult {
  const placed: PlacedCrateWithSource[] = [];
  const fragmentMap = new Map<string, DeliveryFragment>();

  const { compoundBays, individualBays } = buildCompoundBays(ship.cargoBays);

  const sectionToGroup = new Map<string, string>();
  for (const bay of ship.cargoBays) {
    if (bay.group) sectionToGroup.set(bay.id, bay.group);
  }

  const byBay = new Map<string, Map<string, Crate[]>>();

  for (const crate of crates) {
    if (!crate.assignedBayId) continue;

    // Rétro-compatibilité : si l'assignedBayId est une section appartenant à un groupe,
    // on reporte vers le groupId
    const bayId = sectionToGroup.get(crate.assignedBayId) ?? crate.assignedBayId;
    const deliveryId = crate.deliveryId ?? crate.id;

    if (!byBay.has(bayId)) byBay.set(bayId, new Map());
    const deliveryMap = byBay.get(bayId)!;
    if (!deliveryMap.has(deliveryId)) deliveryMap.set(deliveryId, []);
    deliveryMap.get(deliveryId)!.push(crate);
  }

  for (const bay of individualBays) {
    const deliveryMap = byBay.get(bay.id);
    if (!deliveryMap || deliveryMap.size === 0) continue;

    const inBay = () => placed.filter((p) => p.bayId === bay.id);

    for (const [deliveryId, deliveryCrates] of deliveryMap) {
      const effectiveBay = { ...bay, maxCrateScu: bay.maxCrateScu ?? ship.maxCrateScu };
      const result = placeCratesInBay(deliveryCrates, effectiveBay, inBay(), 0).map((placedCrate) => {
        const source = deliveryCrates.find((c) => c.id === placedCrate.id)!;
        return { ...source, ...placedCrate };
      });

      placed.push(...result);

      const placedScu = result.reduce((sum, c) => sum + c.size, 0);
      const totalScu = deliveryCrates.reduce((sum, c) => sum + c.size, 0);
      if (placedScu > 0) {
        const fragmentKey = `${deliveryId}::${bay.id}`;
        fragmentMap.set(fragmentKey, {
          id: fragmentKey,
          contractId: deliveryCrates[0].contractId ?? "",
          deliveryId,
          bayId: bay.id,
          placedScu,
          totalScu,
        });
      }
    }
  }

  for (const compound of compoundBays) {
    const deliveryMap = byBay.get(compound.id);
    if (!deliveryMap || deliveryMap.size === 0) continue;

    const inCompound = () => placed.filter((p) => p.bayId === compound.id);

    for (const [deliveryId, deliveryCrates] of deliveryMap) {
      const effectiveCompound = { ...compound, maxCrateScu: compound.maxCrateScu ?? ship.maxCrateScu };
      const result = placeCratesInCompoundBay(deliveryCrates, effectiveCompound, inCompound()).map((placedCrate) => {
        const source = deliveryCrates.find((c) => c.id === placedCrate.id)!;
        return { ...source, ...placedCrate };
      });

      placed.push(...result);

      const placedScu = result.reduce((sum, c) => sum + c.size, 0);
      const totalScu = deliveryCrates.reduce((sum, c) => sum + c.size, 0);
      if (placedScu > 0) {
        const fragmentKey = `${deliveryId}::${compound.id}`;
        fragmentMap.set(fragmentKey, {
          id: fragmentKey,
          contractId: deliveryCrates[0].contractId ?? "",
          deliveryId,
          bayId: compound.id,
          placedScu,
          totalScu,
        });
      }
    }
  }

  return {
    placed,
    fragments: Array.from(fragmentMap.values()),
  };
}
