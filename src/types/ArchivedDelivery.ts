import type { DeliveryFragment } from "./DeliveryFragment";

type PlacedCrateSnapshot = {
  id: string;
  bayId: string;
  gridPosition: { x: number; y: number; z: number };
  dimensions: { x: number; y: number; z: number };
  size: number;
  contractId?: string;
  contractName?: string;
  deliveryId?: string;
  destination?: string;
  commodity?: string;
  color?: string;
};

export type ArchivedDelivery = {
  deliveryId: string;
  contractId: string;
  contractName: string;
  destination: string;
  commodity: string;
  totalScu: number;
  color: string;
  fragments: DeliveryFragment[];
  // Snapshot exact des caisses placées pour restauration fidèle
  placedCratesSnapshot: PlacedCrateSnapshot[];
};
