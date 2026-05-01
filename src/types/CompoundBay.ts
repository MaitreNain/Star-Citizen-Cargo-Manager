import type { Vector3 } from "./Vector3";

export type CompoundSection = {
  id: string;
  name: string;
  localOffset: Vector3;
  size: Vector3;
};

export type CompoundBay = {
  id: string;
  worldOffset: Vector3;
  boundingBox: Vector3;
  sections: CompoundSection[];
};
