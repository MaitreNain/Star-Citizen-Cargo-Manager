import type { Contract } from "./Contract";
import type { DeliveryFragment } from "./DeliveryFragment";
import type { ArchivedDelivery } from "./ArchivedDelivery";
import type { SortMode } from "../engine/sortCrates";

export type HoveredCell = { bayId: string; x: number; y: number; z: number } | null;

export type PlacedCrateWithMeta = {
  id: string;
  bayId: string;
  gridPosition: { x: number; y: number; z: number };
  dimensions: { x: number; y: number; z: number };
  sizeScu: number;
  size: number;
  contractId?: string;
  contractName?: string;
  deliveryId?: string;
  destination?: string;
  commodity?: string;
  color?: string;
  assignedBayId?: string;
};

export type PlannerSnapshot = {
  shipId: string;
  contracts: Contract[];
  placedCrates: PlacedCrateWithMeta[];
  fragments: DeliveryFragment[];
  archivedDeliveries: ArchivedDelivery[];
  activatedDeliveries: string[];
  sortMode: SortMode;
};
