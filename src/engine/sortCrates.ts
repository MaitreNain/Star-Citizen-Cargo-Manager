type Crate = {
  id: string;
  contractId?: string;
  contractName?: string;
  destination?: string;
  size: number;
  dimensions: { x: number; y: number; z: number };
  color?: string;
  commodity?: string;
};

export type SortMode = "destination" | "contract" | "size";

export function sortCrates(crates: Crate[], mode: SortMode): Crate[] {
  const sorted = [...crates];

  if (mode === "destination") {
    sorted.sort((a, b) => {
      const destA = a.destination ?? "";
      const destB = b.destination ?? "";
      if (destA < destB) return -1;
      if (destA > destB) return 1;
      return b.size - a.size;
    });
  }

  if (mode === "contract") {
    sorted.sort((a, b) => {
      const contractA = a.contractName ?? "";
      const contractB = b.contractName ?? "";
      if (contractA < contractB) return -1;
      if (contractA > contractB) return 1;
      return b.size - a.size;
    });
  }

  if (mode === "size") {
    sorted.sort((a, b) => b.size - a.size);
  }

  return sorted;
}
