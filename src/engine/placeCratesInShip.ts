import type { PlacedCrate } from "../types/PlacedCrate";
import type { DeliveryFragment } from "../types/DeliveryFragment";
import { placeCratesInBay } from "./placeCratesInBay";

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
};

type Ship = {
  cargoBays: Bay[];
};

type PlacedCrateWithSource = PlacedCrate & Crate;

type PlacementResult = {
  placed: PlacedCrateWithSource[];
  fragments: DeliveryFragment[];
};

export function placeCratesInShip(crates: Crate[], ship: Ship): PlacementResult {
  const placed: PlacedCrateWithSource[] = [];
  const fragmentMap = new Map<string, DeliveryFragment>();

  // Groupe les caisses par baie assignée,
  // en préservant l'ordre d'apparition des livraisons dans le tableau d'entrée.
  const byBay = new Map<string, Map<string, Crate[]>>();

  for (const crate of crates) {
    if (!crate.assignedBayId) continue;

    const bayId = crate.assignedBayId;
    const deliveryId = crate.deliveryId ?? crate.id;

    if (!byBay.has(bayId)) byBay.set(bayId, new Map());
    const deliveryMap = byBay.get(bayId)!;

    if (!deliveryMap.has(deliveryId)) deliveryMap.set(deliveryId, []);
    deliveryMap.get(deliveryId)!.push(crate);
  }

  for (const bay of ship.cargoBays) {
    const deliveryMap = byBay.get(bay.id);
    if (!deliveryMap || deliveryMap.size === 0) continue;

    const inBay = () => placed.filter((p) => p.bayId === bay.id);

    // Les livraisons sont dans l'ordre d'insertion de la Map,
    // qui correspond à l'ordre d'apparition dans le tableau crates
    // (lui-même ordonné par deliveryOrder via createCratesFromContracts + sortCrates)
    for (const [deliveryId, deliveryCrates] of deliveryMap) {
      const result = placeCratesInBay(deliveryCrates, bay, inBay(), 0).map((placedCrate) => {
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

  return {
    placed,
    fragments: Array.from(fragmentMap.values()),
  };
}
