import { useState } from "react";
import type { PlannerSnapshot } from "../types/planner";

export function useHistory() {
  const [history, setHistory] = useState<PlannerSnapshot[]>([]);

  function push(snapshot: PlannerSnapshot) {
    setHistory((prev) => [...prev, snapshot]);
  }

  function pop(onRestore: (snapshot: PlannerSnapshot) => void) {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      onRestore(prev[prev.length - 1]);
      return prev.slice(0, -1);
    });
  }

  return { canUndo: history.length > 0, push, pop };
}
