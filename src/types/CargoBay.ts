import type { Vector3 } from "./Vector3";

export type CargoBay = {
  id: string;
  name: string;
  size: Vector3;
  offset: Vector3;
};
