import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "./i18n/LanguageContext";

import AppLayout, { type TabId } from "./ui/AppLayout";
import TutorialOverlay, { TUTORIAL_DEMO_CONTRACT } from "./ui/TutorialOverlay";
import ShipSelector from "./ui/ShipSelector";
import ContractList from "./ui/ContractList";
import ContractForm from "./ui/ContractForm";
import PendingDeliveriesPanel from "./ui/PendingDeliveriesPanel";
import ManualCargoForm from "./ui/ManualCargoForm";
import CapacityPanel from "./ui/CapacityPanel";
import CargoScene from "./scene/CargoScene";

import { ships } from "./data/ships";
import { contracts as initialContracts } from "./data/contracts";

import type { Contract } from "./types/Contract";
import type { DeliveryFragment } from "./types/DeliveryFragment";
import type { ArchivedDelivery } from "./types/ArchivedDelivery";
import type { PlacedCrateWithMeta, PlannerSnapshot } from "./types/planner";
import type { PlannedCrate } from "./engine/createCratesFromContracts";

import { useHistory } from "./hooks/useHistory";
import { useDragState } from "./hooks/useDragState";

import { createCratesFromContracts } from "./engine/createCratesFromContracts";
import { placeCratesInBay } from "./engine/placeCratesInBay";
import { placeCratesInCompoundBay } from "./engine/placeCratesInCompoundBay";
import { placeCratesInShip } from "./engine/placeCratesInShip";
import { resolveStackPosition } from "./engine/resolveStackPosition";
import { applyGravity } from "./engine/applyGravity";
import { getRotatedDimensions } from "./engine/getRotatedDimensions";
import { sortCrates, type SortMode } from "./engine/sortCrates";
import { buildCompoundBays, buildSingleCompoundBay, isValidCellInCompound } from "./engine/buildCompoundBays";

const STORAGE_KEY = "cargo-planner-v1";

function buildFragmentsFromCrates(
  crates: PlacedCrateWithMeta[],
  deliveryScuMap: Map<string, number>
): DeliveryFragment[] {
  const map = new Map<string, DeliveryFragment>();
  for (const crate of crates) {
    if (!crate.deliveryId) continue;
    const key = `${crate.deliveryId}::${crate.bayId}`;
    if (!map.has(key))
      map.set(key, { id: key, contractId: crate.contractId ?? "", deliveryId: crate.deliveryId, bayId: crate.bayId, placedScu: 0, totalScu: deliveryScuMap.get(crate.deliveryId) ?? 0 });
    map.get(key)!.placedScu += crate.size;
  }
  return Array.from(map.values());
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveToStorage(data: object) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage plein ou indisponible
  }
}

export default function CargoPlanner() {
  const saved = useMemo(() => loadFromStorage(), []);

  const [shipId, setShipId] = useState<string>(saved?.shipId ?? "constellation-taurus");
  const [contracts, setContracts] = useState<Contract[]>(saved?.contracts ?? initialContracts);
  const [fragments, setFragments] = useState<DeliveryFragment[]>(saved?.fragments ?? []);
  const [placedCrates, setPlacedCrates] = useState<PlacedCrateWithMeta[]>(saved?.placedCrates ?? []);
  const [sortMode, setSortMode] = useState<SortMode>(saved?.sortMode ?? "destination");
  const [archivedDeliveries, setArchivedDeliveries] = useState<ArchivedDelivery[]>(saved?.archivedDeliveries ?? []);
  const [activatedDeliveries, setActivatedDeliveries] = useState<string[]>(saved?.activatedDeliveries ?? []);

  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [editingManualCargo, setEditingManualCargo] = useState<Contract | null>(null);
  const [crateSelection, setCrateSelection] = useState<Map<string, number>>(new Map());
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("contracts");
  const [markedDeliveryIds, setMarkedDeliveryIds] = useState<string[]>([]);

  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [contractFormForceOpen, setContractFormForceOpen] = useState(0);
  const [contractFormForceClose, setContractFormForceClose] = useState(0);
  const [manualFormForceOpen, setManualFormForceOpen] = useState(0);

  const { t } = useLanguage();
  const { canUndo, push: pushToHistory, pop: popHistory } = useHistory();
  const drag = useDragState();

  useEffect(() => {
    saveToStorage({ shipId, contracts, fragments, placedCrates, sortMode, archivedDeliveries, activatedDeliveries });
  }, [shipId, contracts, fragments, placedCrates, sortMode, archivedDeliveries, activatedDeliveries]);

  const ship = useMemo(() => ships.find((s) => s.id === shipId)!, [shipId]);
  const shipCapacityScu = useMemo(() => ship.cargoBays.reduce((sum, bay) => sum + bay.size.x * bay.size.y * bay.size.z, 0), [ship]);
  const allBaysForGravity = useMemo(() => {
    const { compoundBays } = buildCompoundBays(ship.cargoBays);
    return [
      ...ship.cargoBays,
      ...compoundBays.map((c) => ({ id: c.id, size: c.boundingBox, sections: c.sections })),
    ];
  }, [ship]);

  const [demoPlacedCrates, setDemoPlacedCrates] = useState<PlacedCrateWithMeta[]>([]);

  useEffect(() => {
    if (!tutorialOpen || ship.cargoBays.length === 0) { setDemoPlacedCrates([]); return; }
    const crates = createCratesFromContracts([TUTORIAL_DEMO_CONTRACT]);
    const withBay = crates.map((c) => ({
      ...c,
      assignedBayId: c.deliveryId === "__demo_d1__"
        ? ship.cargoBays[0].id
        : (ship.cargoBays[1]?.id ?? ship.cargoBays[0].id),
    }));
    const sorted = sortCrates(withBay, "destination");
    const result = placeCratesInShip(sorted, ship);
    setDemoPlacedCrates(result.placed as PlacedCrateWithMeta[]);
  }, [tutorialOpen, ship]);

  const allPlacedCrates = useMemo(
    () => tutorialOpen ? [...placedCrates, ...demoPlacedCrates] : placedCrates,
    [tutorialOpen, placedCrates, demoPlacedCrates]
  );

  const maxCrateCapacity = useMemo(() => {
    const sizes = [32, 24, 16, 8, 4, 2, 1];
    const dims: Record<number, [number, number, number]> = {
      1:  [1, 1, 1], 2:  [2, 1, 1], 4:  [2, 2, 1],
      8:  [2, 2, 2], 16: [4, 2, 2], 24: [6, 2, 2], 32: [8, 2, 2],
    };

    function perms([a, b, c]: [number, number, number]): [number, number, number][] {
      return [[a, b, c], [b, a, c]];
    }

    const { compoundBays: compBays, individualBays: indivBays } = buildCompoundBays(ship.cargoBays);

    function buildOccupied(bayId: string, W: number, D: number): Set<number> {
      const s = new Set<number>();
      for (const c of placedCrates) {
        if (c.bayId !== bayId) continue;
        const { x, y, z } = c.gridPosition;
        const { x: dx, y: dy, z: dz } = c.dimensions;
        for (let cx = x; cx < x + dx; cx++)
          for (let cy = y; cy < y + dy; cy++)
            for (let cz = z; cz < z + dz; cz++)
              s.add(cx + cy * W + cz * W * D);
      }
      return s;
    }

    const countsByScu = new Map<number, number>();

    // Soutes individuelles
    for (const bay of indivBays) {
      const W = bay.size.x, D = bay.size.y, H = bay.size.z;
      const occupied = buildOccupied(bay.id, W, D);

      for (const scu of sizes) {
        let count = 0;
        let found = true;

        while (found) {
          found = false;
          outer:
          for (const [dx, dy, dz] of perms(dims[scu])) {
            if (dx > W || dy > D || dz > H) continue;
            for (let z = 0; z <= H - dz && !found; z++)
              for (let y = 0; y <= D - dy && !found; y++)
                for (let x = 0; x <= W - dx && !found; x++) {
                  let ok = true;
                  check:
                  for (let cx = x; cx < x + dx; cx++)
                    for (let cy = y; cy < y + dy; cy++)
                      for (let cz = z; cz < z + dz; cz++)
                        if (occupied.has(cx + cy * W + cz * W * D)) { ok = false; break check; }
                  if (ok) {
                    for (let cx = x; cx < x + dx; cx++)
                      for (let cy = y; cy < y + dy; cy++)
                        for (let cz = z; cz < z + dz; cz++)
                          occupied.add(cx + cy * W + cz * W * D);
                    count++;
                    found = true;
                  }
                }
            if (found) break outer;
          }
        }

        if (count > 0) countsByScu.set(scu, (countsByScu.get(scu) ?? 0) + count);
      }
    }

    // Soutes composées
    for (const compound of compBays) {
      const W = compound.boundingBox.x, D = compound.boundingBox.y, H = compound.boundingBox.z;
      const occupied = buildOccupied(compound.id, W, D);

      for (const scu of sizes) {
        let count = 0;
        let found = true;

        while (found) {
          found = false;
          outer:
          for (const [dx, dy, dz] of perms(dims[scu])) {
            if (dx > W || dy > D || dz > H) continue;
            for (let z = 0; z <= H - dz && !found; z++)
              for (let y = 0; y <= D - dy && !found; y++)
                for (let x = 0; x <= W - dx && !found; x++) {
                  // Vérifier que tous les voxels sont dans l'union des sections
                  let allValid = true;
                  vcheck:
                  for (let cx = x; cx < x + dx; cx++)
                    for (let cy = y; cy < y + dy; cy++)
                      for (let cz = z; cz < z + dz; cz++)
                        if (!isValidCellInCompound(cx, cy, cz, compound.sections)) { allValid = false; break vcheck; }
                  if (!allValid) continue;

                  let ok = true;
                  check:
                  for (let cx = x; cx < x + dx; cx++)
                    for (let cy = y; cy < y + dy; cy++)
                      for (let cz = z; cz < z + dz; cz++)
                        if (occupied.has(cx + cy * W + cz * W * D)) { ok = false; break check; }
                  if (ok) {
                    for (let cx = x; cx < x + dx; cx++)
                      for (let cy = y; cy < y + dy; cy++)
                        for (let cz = z; cz < z + dz; cz++)
                          occupied.add(cx + cy * W + cz * W * D);
                    count++;
                    found = true;
                  }
                }
            if (found) break outer;
          }
        }

        if (count > 0) countsByScu.set(scu, (countsByScu.get(scu) ?? 0) + count);
      }
    }

    const result: { scu: number; count: number }[] = [];
    for (const scu of sizes) {
      const count = countsByScu.get(scu) ?? 0;
      if (count > 0) {
        result.push({ scu, count });
        if (result.length >= 3) break;
      }
    }
    return result;
  }, [ship, placedCrates]);

  const placedScuByDelivery = useMemo(() => {
    const map = new Map<string, number>();
    for (const frag of fragments) map.set(frag.deliveryId, (map.get(frag.deliveryId) ?? 0) + frag.placedScu);
    return map;
  }, [fragments]);

  const allCrates = useMemo(() => createCratesFromContracts(contracts), [contracts]);

  const deliveryScuMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const contract of contracts)
      for (const delivery of contract.deliveries)
        map.set(delivery.id, delivery.scu);
    return map;
  }, [contracts]);

  const deliveryColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const crate of allCrates) {
      if (!map.has(crate.deliveryId)) map.set(crate.deliveryId, crate.deliveryColor);
    }
    return map;
  }, [allCrates]);

  const pendingCratesByDelivery = useMemo(() => {
    const placedIds = new Set(placedCrates.map((c) => c.id));
    const sizesByDelivery = new Map<string, Map<number, number>>();
    for (const crate of allCrates) {
      if (placedIds.has(crate.id)) continue;
      if (!sizesByDelivery.has(crate.deliveryId)) sizesByDelivery.set(crate.deliveryId, new Map());
      const sizeMap = sizesByDelivery.get(crate.deliveryId)!;
      sizeMap.set(crate.size, (sizeMap.get(crate.size) ?? 0) + 1);
    }
    const result = new Map<string, { sizeScu: number; count: number }[]>();
    for (const [deliveryId, sizeMap] of sizesByDelivery) {
      result.set(deliveryId, Array.from(sizeMap.entries())
        .map(([sizeScu, count]) => ({ sizeScu, count }))
        .sort((a, b) => b.sizeScu - a.sizeScu));
    }
    return result;
  }, [allCrates, placedCrates]);

  const totalSelectedCrates = useMemo(() => {
    let total = 0;
    for (const count of crateSelection.values()) total += count;
    return total;
  }, [crateSelection]);

  const totalPlacedScu = useMemo(() => placedCrates.reduce((sum, c) => sum + c.size, 0), [placedCrates]);
  const totalDeliveredScu = useMemo(() => archivedDeliveries.reduce((sum, a) => sum + a.totalScu, 0), [archivedDeliveries]);
  const archivedDeliveryIds = useMemo(() => new Set(archivedDeliveries.map((a) => a.deliveryId)), [archivedDeliveries]);
  const pendingCount = useMemo(() => {
    const activatedSet = new Set(activatedDeliveries);
    let count = 0;
    for (const contract of contracts) {
      for (const delivery of contract.deliveries) {
        if (delivery.scu <= 0) continue;
        if (archivedDeliveryIds.has(delivery.id)) continue;
        if (!activatedSet.has(delivery.id)) continue;
        const placed = placedScuByDelivery.get(delivery.id) ?? 0;
        if (delivery.scu - placed > 0) count++;
      }
    }
    return count;
  }, [contracts, placedScuByDelivery, archivedDeliveryIds, activatedDeliveries]);

  function getSnapshot(): PlannerSnapshot {
    return { shipId, contracts, placedCrates, fragments, archivedDeliveries, activatedDeliveries, sortMode };
  }

  function pushHistorySnapshot() {
    pushToHistory(getSnapshot());
  }

  function undoLastAction() {
    popHistory((last) => {
      setShipId(last.shipId);
      setContracts(last.contracts);
      setPlacedCrates(last.placedCrates);
      setFragments(last.fragments);
      setArchivedDeliveries(last.archivedDeliveries);
      setActivatedDeliveries(last.activatedDeliveries);
      setSortMode(last.sortMode);
      setEditingContract(null);
      setCrateSelection(new Map());
      drag.clear();
    });
  }

  function buildFromFragments(
    nextContracts: Contract[],
    nextFragments: DeliveryFragment[],
    nextShipId: string,
    nextSortMode: SortMode
  ): PlacedCrateWithMeta[] {
    const nextShip = ships.find((s) => s.id === nextShipId)!;
    const allCrates = createCratesFromContracts(nextContracts);

    const deliveryFragments = new Map<string, DeliveryFragment[]>();
    for (const f of nextFragments) {
      if (!deliveryFragments.has(f.deliveryId)) deliveryFragments.set(f.deliveryId, []);
      deliveryFragments.get(f.deliveryId)!.push(f);
    }

    const assignedCrates = allCrates.map((crate) => {
      const frags = deliveryFragments.get(crate.deliveryId ?? "") ?? [];
      if (frags.length === 0) return crate;
      return { ...crate, assignedBayId: frags[0].bayId };
    });

    for (const [deliveryId, frags] of deliveryFragments) {
      if (frags.length <= 1) continue;
      const deliveryCrates = assignedCrates.filter((c) => c.deliveryId === deliveryId);
      let crateIndex = 0;
      for (const frag of frags) {
        let scuBudget = frag.placedScu;
        while (crateIndex < deliveryCrates.length && scuBudget > 0) {
          const crate = deliveryCrates[crateIndex];
          const globalIndex = assignedCrates.findIndex((c) => c.id === crate.id);
          if (globalIndex >= 0) assignedCrates[globalIndex] = { ...assignedCrates[globalIndex], assignedBayId: frag.bayId };
          scuBudget -= crate.size;
          crateIndex++;
        }
      }
    }

    const sorted = sortCrates(assignedCrates, nextSortMode);
    const result = placeCratesInShip(sorted, nextShip);
    return result.placed as PlacedCrateWithMeta[];
  }

  function clearPlacement() {
    pushHistorySnapshot();
    setPlacedCrates([]);
    setFragments([]);
    setCrateSelection(new Map());
    drag.clear();
  }

  function deleteAllContracts() {
    pushHistorySnapshot();
    setContracts([]);
    setPlacedCrates([]);
    setFragments([]);
    setArchivedDeliveries([]);
    setActivatedDeliveries([]);
    setEditingContract(null);
    setCrateSelection(new Map());
    setDeleteAllConfirm(false);
    drag.clear();
  }

  function handleShipChange(nextShipId: string) {
    pushHistorySnapshot();
    setShipId(nextShipId);
    setFragments([]);
    setPlacedCrates([]);
    setCrateSelection(new Map());
    setEditingContract(null);
    drag.clear();
  }

  function addContract(contract: Contract) {
    pushHistorySnapshot();
    const nextContracts = [...contracts, { ...contract, deliveryOrder: contracts.length + 1 }];
    setContracts(nextContracts);
    setEditingContract(null);
    drag.clear();
  }

  function updateContract(updatedContract: Contract) {
    pushHistorySnapshot();
    const nextContracts = contracts.map((c) => c.id === updatedContract.id ? updatedContract : c);

    // New crate definitions for the updated contract (colours derived from all contracts)
    const newCratesForContract = createCratesFromContracts(nextContracts)
      .filter((c) => c.contractId === updatedContract.id);
    const newCrateIds = new Set(newCratesForContract.map((c) => c.id));
    const newCrateById = new Map(newCratesForContract.map((c) => [c.id, c]));

    // Keep placed crates from other contracts unchanged.
    // For this contract: keep only crates whose ID AND size still match the new definition.
    // If the SCU total changed, the greedy split may reassign different sizes to the same index
    // (e.g. crate-2 goes from 8SCU to 4SCU) — those must be removed so the new size appears unplaced.
    const retained = placedCrates
      .filter((c) => {
        if (c.contractId !== updatedContract.id) return true;
        const m = newCrateById.get(c.id);
        return m !== undefined && m.size === c.size;
      })
      .map((c) => {
        if (c.contractId !== updatedContract.id) return c;
        const m = newCrateById.get(c.id)!;
        return { ...c, contractName: m.contractName, color: m.color, destination: m.destination, commodity: m.commodity };
      });

    const afterGravity = applyGravity(retained, allBaysForGravity);

    const nextDeliveryScuMap = new Map<string, number>();
    for (const contract of nextContracts)
      for (const delivery of contract.deliveries)
        nextDeliveryScuMap.set(delivery.id, delivery.scu);

    const nextFragments = buildFragmentsFromCrates(afterGravity, nextDeliveryScuMap);

    const updatedDeliveryIds = new Set(updatedContract.deliveries.map((d) => d.id));
    const oldContract = contracts.find((c) => c.id === updatedContract.id);
    const removedDeliveryIds = new Set(
      (oldContract?.deliveries ?? []).filter((d) => !updatedDeliveryIds.has(d.id)).map((d) => d.id)
    );

    setContracts(nextContracts);
    setPlacedCrates(afterGravity);
    setFragments(nextFragments);
    setEditingContract(null);
    setActivatedDeliveries((prev) =>
      removedDeliveryIds.size === 0 ? prev : prev.filter((id) => !removedDeliveryIds.has(id))
    );
    setCrateSelection((prev) => {
      if (removedDeliveryIds.size === 0) return prev;
      const next = new Map(prev);
      for (const key of next.keys()) {
        if (removedDeliveryIds.has(key.split("::")[0])) next.delete(key);
      }
      return next;
    });
    drag.clear();
  }

  function deleteContract(id: string) {
    pushHistorySnapshot();
    const nextContracts = contracts.filter((c) => c.id !== id).map((c, i) => ({ ...c, deliveryOrder: i + 1 }));
    const remaining = placedCrates.filter((c) => c.contractId !== id);
    const afterGravity = applyGravity(remaining, allBaysForGravity);
    const deletedDeliveryIds = new Set(
      contracts.find((c) => c.id === id)?.deliveries.map((d) => d.id) ?? []
    );
    setContracts(nextContracts);
    setPlacedCrates(afterGravity);
    setFragments(buildFragmentsFromCrates(afterGravity, deliveryScuMap));
    setArchivedDeliveries((prev) => prev.filter((a) => a.contractId !== id));
    setActivatedDeliveries((prev) => prev.filter((did) => !deletedDeliveryIds.has(did)));
    setCrateSelection((prev) => {
      const next = new Map(prev);
      for (const key of next.keys()) {
        if (deletedDeliveryIds.has(key.split("::")[0])) next.delete(key);
      }
      return next;
    });
    if (editingContract?.id === id) setEditingContract(null);
    if (editingManualCargo?.id === id) setEditingManualCargo(null);
    drag.clear();
  }

  function reorderContracts(reordered: Contract[]) {
    pushHistorySnapshot();
    setContracts(reordered);
    setPlacedCrates(buildFromFragments(reordered, fragments, shipId, sortMode));
    drag.clear();
  }

  function handleBayClick(bayId: string) {
    if (totalSelectedCrates === 0) return;
    pushHistorySnapshot();

    const individualBay = ship.cargoBays.find((b) => b.id === bayId && !b.group);
    const compoundBay = !individualBay ? buildSingleCompoundBay(ship.cargoBays, bayId) : null;
    if (!individualBay && !compoundBay) return;

    const alreadyInBay = placedCrates.filter((c) => c.bayId === bayId);
    const placedCrateIds = new Set(placedCrates.map((c) => c.id));

    // Collect pending crates matching the selection
    const remaining = new Map(crateSelection);
    const cratesToPlace: PlannedCrate[] = [];
    for (const crate of allCrates) {
      if (placedCrateIds.has(crate.id)) continue;
      const key = `${crate.deliveryId}::${crate.size}`;
      const wanted = remaining.get(key) ?? 0;
      if (wanted > 0) {
        cratesToPlace.push(crate);
        remaining.set(key, wanted - 1);
      }
    }
    if (cratesToPlace.length === 0) return;

    const newlyPlaced = (
      individualBay
        ? placeCratesInBay(cratesToPlace, individualBay, alreadyInBay, 0)
        : placeCratesInCompoundBay(cratesToPlace, compoundBay!, alreadyInBay)
    ).map((p) => {
      const source = cratesToPlace.find((c) => c.id === p.id)!;
      return { ...source, ...p } as PlacedCrateWithMeta;
    });

    if (newlyPlaced.length === 0) return;

    const nextPlacedCrates = [...placedCrates, ...newlyPlaced];
    setPlacedCrates(nextPlacedCrates);
    setFragments(buildFragmentsFromCrates(nextPlacedCrates, deliveryScuMap));

    // Remove placed crates from selection (keep unplaced if bay was full)
    const placedByKey = new Map<string, number>();
    for (const c of newlyPlaced) {
      const key = `${c.deliveryId}::${c.sizeScu}`;
      placedByKey.set(key, (placedByKey.get(key) ?? 0) + 1);
    }
    setCrateSelection((prev) => {
      const next = new Map(prev);
      for (const [key, count] of placedByKey) {
        const current = next.get(key) ?? 0;
        const newCount = current - count;
        if (newCount <= 0) next.delete(key);
        else next.set(key, newCount);
      }
      return next;
    });
  }

  function handleRetractFragment(fragment: DeliveryFragment) {
    pushHistorySnapshot();
    setPlacedCrates(placedCrates.filter((c) => !(c.deliveryId === fragment.deliveryId && c.bayId === fragment.bayId)));
    setFragments(fragments.filter((f) => f.id !== fragment.id));
  }

  function archiveDelivery(deliveryId: string) {
    pushHistorySnapshot();

    const deliveryCrates: PlacedCrateWithMeta[] = [];
    const remaining: PlacedCrateWithMeta[] = [];
    for (const c of placedCrates) {
      (c.deliveryId === deliveryId ? deliveryCrates : remaining).push(c);
    }
    if (deliveryCrates.length === 0) return;

    let destination = "", pickupLocation = "", commodity = "", contractName = "", contractId = "", color = "";
    let totalScu = 0;
    for (const contract of contracts) {
      const delivery = contract.deliveries.find((d) => d.id === deliveryId);
      if (delivery) {
        destination = delivery.destination;
        pickupLocation = delivery.pickupLocation;
        commodity = delivery.commodity;
        totalScu = delivery.scu;
        contractName = contract.name;
        contractId = contract.id;
        color = deliveryColors.get(deliveryId) ?? contract.color;
        break;
      }
    }

    const archived: ArchivedDelivery = {
      deliveryId, contractId, contractName, destination, pickupLocation, commodity, totalScu, color,
    };

    setArchivedDeliveries((prev) => [...prev, archived]);

    const afterGravity = applyGravity(remaining, allBaysForGravity);
    setPlacedCrates(afterGravity);
    setFragments(buildFragmentsFromCrates(afterGravity, deliveryScuMap));
    setCrateSelection((prev) => {
      const next = new Map(prev);
      for (const key of next.keys()) {
        if (key.startsWith(`${deliveryId}::`)) next.delete(key);
      }
      return next;
    });
  }

  function deactivateDelivery(id: string) {
    pushHistorySnapshot();
    setActivatedDeliveries((prev) => prev.filter((d) => d !== id));
    const remaining = placedCrates.filter((c) => c.deliveryId !== id);
    const afterGravity = applyGravity(remaining, allBaysForGravity);
    setPlacedCrates(afterGravity);
    setFragments(buildFragmentsFromCrates(afterGravity, deliveryScuMap));
    setCrateSelection((prev) => {
      const next = new Map(prev);
      for (const key of next.keys()) {
        if (key.startsWith(`${id}::`)) next.delete(key);
      }
      return next;
    });
  }

  function moveCrate(crateId: string, newPosition: { bayId: string; x: number; y: number; z: number }, rotatedDimensions?: { x: number; y: number; z: number }) {
    setPlacedCrates((prev) => {
      const next = applyGravity(
        prev.map((crate) =>
          crate.id === crateId
            ? { ...crate, bayId: newPosition.bayId, gridPosition: { x: newPosition.x, y: newPosition.y, z: newPosition.z }, dimensions: rotatedDimensions ?? crate.dimensions }
            : crate
        ),
        allBaysForGravity
      );
      setFragments(buildFragmentsFromCrates(next, deliveryScuMap));
      return next;
    });
  }

  function handleSelectCrate(id: string | null) {
    drag.setSelectedCrateId(id);
    if (id !== null) setActiveTab("placement");
  }

  function handleStartDrag(crateId: string) {
    if (totalSelectedCrates > 0) return;
    drag.startDrag(crateId);
  }

  function handleEndDrag() {
    if (!drag.draggedCrateId || !drag.hoveredCell) {
      drag.clear(); return;
    }
    const movingCrate = allPlacedCrates.find((c) => c.id === drag.draggedCrateId);
    const hoveredBayId = drag.hoveredCell!.bayId;
    const individualBay = ship.cargoBays.find((b) => b.id === hoveredBayId && !b.group);
    const compoundBay = !individualBay ? buildSingleCompoundBay(ship.cargoBays, hoveredBayId) : null;
    const bayForStack = individualBay
      ?? (compoundBay ? { id: compoundBay.id, size: compoundBay.boundingBox, sections: compoundBay.sections } : null);

    if (!movingCrate || !bayForStack) {
      drag.clear(); return;
    }
    const rotatedDimensions = getRotatedDimensions(movingCrate.dimensions, drag.dragRotation, individualBay?.anchorFace);
    const rotatedCrate = { ...movingCrate, dimensions: rotatedDimensions };
    const resolvedPosition = resolveStackPosition(rotatedCrate, drag.hoveredCell, bayForStack, allPlacedCrates);
    if (resolvedPosition) {
      const isDemo = movingCrate.contractId === TUTORIAL_DEMO_CONTRACT.id;
      if (isDemo) {
        setDemoPlacedCrates((prevDemo) => {
          const combined = [...placedCrates, ...prevDemo].map((c) =>
            c.id === drag.draggedCrateId
              ? { ...c, bayId: resolvedPosition.bayId, gridPosition: { x: resolvedPosition.x, y: resolvedPosition.y, z: resolvedPosition.z }, dimensions: rotatedDimensions }
              : c
          );
          const afterGravity = applyGravity(combined, allBaysForGravity);
          return afterGravity.filter((c) => c.contractId === TUTORIAL_DEMO_CONTRACT.id);
        });
      } else {
        pushHistorySnapshot();
        moveCrate(drag.draggedCrateId, resolvedPosition, rotatedDimensions);
      }
    }
    drag.clear();
  }

  const headerContent = (
    <>
      <div id="tuto-ship">
        <ShipSelector value={shipId} onChange={handleShipChange} />
      </div>
      <CapacityPanel
        totalPlacedScu={totalPlacedScu}
        shipCapacityScu={shipCapacityScu}
        maxCrateCapacity={maxCrateCapacity}
        totalDeliveredScu={totalDeliveredScu}
      />
      <button onClick={undoLastAction} disabled={!canUndo} className="btn-secondary" style={{ width: "100%", marginBottom: "4px" }}>
        {t("planner.undo")}
      </button>
    </>
  );

  const contractsTabContent = (
    <>
      <div id="tuto-form" style={{ marginTop: "20px" }}>
        <ContractForm
          onAdd={addContract}
          onUpdate={updateContract}
          contracts={contracts}
          editingContract={editingContract}
          onCancelEdit={() => setEditingContract(null)}
          forceOpen={contractFormForceOpen}
          forceClose={contractFormForceClose}
        />
      </div>
      <div id="tuto-manual-form">
        <ManualCargoForm
          onAdd={addContract}
          onUpdate={updateContract}
          contractsCount={contracts.length}
          editingContract={editingManualCargo}
          onCancelEdit={() => setEditingManualCargo(null)}
          forceOpen={manualFormForceOpen}
        />
      </div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
        {deleteAllConfirm ? (
          <>
            <button onClick={deleteAllContracts} className="btn-danger" style={{ flex: 1 }}>{t("planner.deleteConfirm")}</button>
            <button onClick={() => setDeleteAllConfirm(false)} className="btn-secondary" style={{ flex: 1, fontSize: "11px" }}>{t("planner.deleteCancel")}</button>
          </>
        ) : (
          <button onClick={() => setDeleteAllConfirm(true)} disabled={contracts.length === 0} className="btn-danger" style={{ flex: 1 }}>
            {t("planner.deleteAll")}
          </button>
        )}
      </div>
      <div id="tuto-list">
        <ContractList
          contracts={contracts}
          bays={ship.cargoBays}
          fragments={fragments}
          archivedDeliveryIds={archivedDeliveryIds}
          shipCapacityScu={shipCapacityScu}
          onDelete={deleteContract}
          onEdit={(c) => {
            if (c.deliveries[0]?.explicitCrates) {
              setEditingManualCargo(c);
              setEditingContract(null);
            } else {
              setEditingContract(c);
              setEditingManualCargo(null);
            }
          }}
          onReorder={reorderContracts}
          onRetractFragment={handleRetractFragment}
          demoContract={tutorialOpen ? TUTORIAL_DEMO_CONTRACT : undefined}
        />
      </div>
    </>
  );

  const placementTabContent = (
    <>
      <div id="tuto-deliveries">
        <PendingDeliveriesPanel
          contracts={contracts}
          placedScuByDelivery={placedScuByDelivery}
          fragments={fragments}
          bays={ship.cargoBays}
          deliveryColors={deliveryColors}
          crateSelection={crateSelection}
          pendingCratesByDelivery={pendingCratesByDelivery}
          totalSelectedCrates={totalSelectedCrates}
          onUpdateCrateSelection={(key, delta) => {
            setCrateSelection((prev) => {
              const next = new Map(prev);
              const current = next.get(key) ?? 0;
              const newVal = current + delta;
              if (newVal <= 0) next.delete(key);
              else next.set(key, newVal);
              return next;
            });
            drag.setSelectedCrateId(null);
          }}
          onClearCrateSelection={() => setCrateSelection(new Map())}
          highlightedDeliveryId={placedCrates.find((c) => c.id === drag.selectedCrateId)?.deliveryId ?? null}
          markedDeliveryIds={markedDeliveryIds}
          onMarkDelivery={(id) => setMarkedDeliveryIds((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id])}
          onClearMarked={() => setMarkedDeliveryIds([])}
          onClearPlacement={clearPlacement}
          activatedDeliveries={activatedDeliveries}
          onActivateDelivery={(id) => { pushHistorySnapshot(); setActivatedDeliveries((prev) => [...prev, id]); }}
          onDeactivateDelivery={deactivateDelivery}
          onRetractFragment={handleRetractFragment}
          archivedDeliveries={archivedDeliveries}
          onArchiveDelivery={archiveDelivery}
          demoContract={tutorialOpen ? TUTORIAL_DEMO_CONTRACT : undefined}
        />
      </div>
    </>
  );

  return (
    <>
    <AppLayout
      header={headerContent}
      contractsTab={contractsTabContent}
      placementTab={placementTabContent}
      pendingCount={pendingCount}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onStartTutorial={() => setTutorialOpen(true)}
      content={
        <CargoScene
          ship={ship}
          placedCrates={allPlacedCrates}
          selectedCrateId={drag.selectedCrateId}
          onSelectCrate={handleSelectCrate}
          hoveredCell={drag.hoveredCell}
          onHoverCell={drag.setHoveredCell}
          draggedCrateId={drag.draggedCrateId}
          onStartDrag={handleStartDrag}
          onEndDrag={handleEndDrag}
          dragRotation={drag.dragRotation}
          onRotate={drag.rotate}
          markedDeliveryIds={markedDeliveryIds}
          isAssigningDelivery={totalSelectedCrates > 0}
          onBayClick={handleBayClick}
        />
      }
    />
    {tutorialOpen && (
      <TutorialOverlay
        onClose={() => { setTutorialOpen(false); setContractFormForceOpen(0); setContractFormForceClose(0); setManualFormForceOpen(0); }}
        onChangeTab={setActiveTab}
        onExpandContractForm={() => setContractFormForceOpen((n) => n + 1)}
        onCollapseContractForm={() => setContractFormForceClose((n) => n + 1)}
        onExpandManualForm={() => setManualFormForceOpen((n) => n + 1)}
      />
    )}
    </>
  );
}
