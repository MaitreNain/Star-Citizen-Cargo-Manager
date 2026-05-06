import type { Vector3 } from "./Vector3";

export type AnchorFace = "floor" | "ceiling";

export type CargoBay = {
  id: string;
  name: string;
  size: Vector3;
  offset: Vector3;
  group?: string;
  anchorFace?: AnchorFace;
};
