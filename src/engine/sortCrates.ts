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
      const cmp = (a.destination ?? "").localeCompare(b.destination ?? "");
      return cmp !== 0 ? cmp : b.size - a.size;
    });
  } else if (mode === "contract") {
    sorted.sort((a, b) => {
      const cmp = (a.contractName ?? "").localeCompare(b.contractName ?? "");
      return cmp !== 0 ? cmp : b.size - a.size;
    });
  } else {
    sorted.sort((a, b) => b.size - a.size);
  }

  return sorted;
}
