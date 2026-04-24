import type { Vector3 } from "./Vector3";

export type PlacedCrate = {
  id: string;
  sizeScu: number;
  dimensions: Vector3;
  bayId: string;
  gridPosition: Vector3;
  deliveryId?: string;
};
