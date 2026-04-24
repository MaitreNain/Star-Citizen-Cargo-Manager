import type { Contract } from "../types/Contract";
import { CONTAINER_DIMENSIONS } from "../data/containerDimensions";
import { generateCrates } from "./generateCrates";

export type PlannedCrate = {
  id: string;
  contractId: string;
  contractName: string;
  deliveryId: string;
  destination: string;
  commodity: string;
  color: string;
  deliveryColor: string;
  size: number;
  dimensions: {
    x: number;
    y: number;
    z: number;
  };
};

// Palette de couleurs bien distinctes et lisibles sur fond sombre
const DELIVERY_PALETTE = [
  "#e07828", // orange
  "#38bdf8", // cyan
  "#22d3a0", // vert menthe
  "#a78bfa", // violet
  "#f472b6", // rose
  "#facc15", // jaune
  "#fb923c", // orange clair
  "#34d399", // vert émeraude
  "#60a5fa", // bleu clair
  "#f87171", // rouge doux
  "#c084fc", // mauve
  "#4ade80", // vert lime
];

export function createCratesFromContracts(contracts: Contract[]): PlannedCrate[] {
  const sortedContracts = [...contracts].sort(
    (a, b) => a.deliveryOrder - b.deliveryOrder
  );

  // Construit la map destination → couleur en parcourant les livraisons dans l'ordre
  const destinationColors = new Map<string, string>();
  let colorIndex = 0;
  for (const contract of sortedContracts) {
    for (const delivery of contract.deliveries) {
      if (delivery.scu <= 0) continue;
      if (!destinationColors.has(delivery.destination)) {
        destinationColors.set(delivery.destination, DELIVERY_PALETTE[colorIndex % DELIVERY_PALETTE.length]);
        colorIndex++;
      }
    }
  }

  const crates: PlannedCrate[] = [];

  for (const contract of sortedContracts) {
    for (const delivery of contract.deliveries) {
      if (delivery.scu <= 0) continue;

      const deliveryColor = destinationColors.get(delivery.destination) ?? "#e07828";
      const sizes = generateCrates(delivery.scu, contract.maxContainerSize);

      sizes.forEach((size, index) => {
        crates.push({
          id: `${contract.id}-${delivery.id}-crate-${index}`,
          contractId: contract.id,
          contractName: contract.name,
          deliveryId: delivery.id,
          destination: delivery.destination,
          commodity: delivery.commodity,
          color: deliveryColor,
          deliveryColor,
          size,
          dimensions: CONTAINER_DIMENSIONS[size],
        });
      });
    }
  }

  return crates;
}
