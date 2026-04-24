import type { CargoBay } from "./CargoBay";

export type Ship = {
  id: string;
  name: string;
  cargoBays: CargoBay[];
};