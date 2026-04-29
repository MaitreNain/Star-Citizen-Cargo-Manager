import { useEffect, useMemo, useState } from "react";

import AppLayout, { type TabId } from "./ui/AppLayout";
import ShipSelector from "./ui/ShipSelector";
import ContractList from "./ui/ContractList";
import ContractForm from "./ui/ContractForm";
import PendingDeliveriesPanel from "./ui/PendingDeliveriesPanel";
import CapacityPanel from "./ui/CapacityPanel";
import CargoScene from "./scene/CargoScene";

import { ships } from "./data/ships";
import { contracts as initialContracts } from "./data/contracts";

import type { Contract } from "./types/Contract";
import type { DeliveryFragment } from "./types/DeliveryFragment";
import type { ArchivedDelivery } from "./types/ArchivedDelivery";
import type { PlacedCrateWithMeta, SelectedDelivery, PlannerSnapshot } from "./types/planner";

import { useHistory } from "./hooks/useHistory";
import { useDragState } from "./hooks/useDragState";

import { createCratesFromContracts } from "./engine/createCratesFromContracts";
import { placeCratesInBay } from "./engine/placeCratesInBay";
import { placeCratesInShip } from "./engine/placeCratesInShip";
import { resolveStackPosition } from "./engine/resolveStackPosition";
import { applyGravity } from "./engine/applyGravity";
import { getRotatedDimensions } from "./engine/getRotatedDimensions";
import { sortCrates, type SortMode } from "./engine/sortCrates";

const STORAGE_KEY = "cargo-planner-v1";

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

  const [shipId, setShipId] = useState<string>(saved?.shipId ?? ships[0].id);
  const [contracts, setContracts] = useState<Contract[]>(saved?.contracts ?? initialContracts);
  const [fragments, setFragments] = useState<DeliveryFragment[]>(saved?.fragments ?? []);
  const [placedCrates, setPlacedCrates] = useState<PlacedCrateWithMeta[]>(saved?.placedCrates ?? []);
  const [sortMode, setSortMode] = useState<SortMode>(saved?.sortMode ?? "destination");
  const [archivedDeliveries, setArchivedDeliveries] = useState<ArchivedDelivery[]>(saved?.archivedDeliveries ?? []);
  const [activatedDeliveries, setActivatedDeliveries] = useState<string[]>(saved?.activatedDeliveries ?? []);

  // États UI non persistés
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<SelectedDelivery>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("contracts");
  const [markedDeliveryIds, setMarkedDeliveryIds] = useState<string[]>([]);
  const [contractFormKey, setContractFormKey] = useState(0);

  const { canUndo, push: pushToHistory, pop: popHistory } = useHistory();
  const drag = useDragState();

  useEffect(() => {
    saveToStorage({ shipId, contracts, fragments, placedCrates, sortMode, archivedDeliveries, activatedDeliveries });
  }, [shipId, contracts, fragments, placedCrates, sortMode, archivedDeliveries, activatedDeliveries]);

  const ship = useMemo(() => ships.find((s) => s.id === shipId)!, [shipId]);
  const shipCapacityScu = useMemo(() => ship.cargoBays.reduce((sum, bay) => sum + bay.size.x * bay.size.y * bay.size.z, 0), [ship]);

  const maxCrateCapacity = useMemo(() => {
    const sizes = [32, 24, 16, 8, 4, 2, 1];
    const dims: Record<number, [number, number, number]> = {
      1:  [1, 1, 1], 2:  [2, 1, 1], 4:  [2, 2, 1],
      8:  [2, 2, 2], 16: [4, 2, 2], 24: [6, 2, 2], 32: [8, 2, 2],
    };

    function perms([a, b, c]: [number, number, number]): [number, number, number][] {
      return [[a, b, c], [b, a, c]];
    }

    function buildOccupied(bayId: string): Set<number> {
      const bay = ship.cargoBays.find(b => b.id === bayId)!;
      const W = bay.size.x, D = bay.size.y;
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

    for (const bay of ship.cargoBays) {
      const W = bay.size.x, D = bay.size.y, H = bay.size.z;
      const occupied = buildOccupied(bay.id);

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


  const totalPlacedScu = useMemo(() => placedCrates.reduce((sum, c) => sum + c.size, 0), [placedCrates]);
  const totalDeliveredScu = useMemo(() => archivedDeliveries.reduce((sum, a) => sum + a.totalScu, 0), [archivedDeliveries]);
  const pendingCount = useMemo(() => {
    const archivedIds = new Set(archivedDeliveries.map((a) => a.deliveryId));
    let count = 0;
    for (const contract of contracts) {
      for (const delivery of contract.deliveries) {
        if (delivery.scu <= 0) continue;
        if (archivedIds.has(delivery.id)) continue;
        if (!activatedDeliveries.includes(delivery.id)) continue;
        const placed = placedScuByDelivery.get(delivery.id) ?? 0;
        if (delivery.scu - placed > 0) count++;
      }
    }
    return count;
  }, [contracts, placedScuByDelivery, archivedDeliveries, activatedDeliveries]);

  // ── Snapshot helpers ──────────────────────────────────────────────────────

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
      setSelectedDelivery(null);
      drag.clear();
    });
  }

  // ── Placement ─────────────────────────────────────────────────────────────

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
    setSelectedDelivery(null);
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
    setSelectedDelivery(null);
    setDeleteAllConfirm(false);
    drag.clear();
  }

  // ── Contrats ──────────────────────────────────────────────────────────────

  function handleShipChange(nextShipId: string) {
    pushHistorySnapshot();
    setShipId(nextShipId);
    setFragments([]);
    setPlacedCrates([]);
    setSelectedDelivery(null);
    setEditingContract(null);
    drag.clear();
  }

  function addContract(contract: Contract) {
    pushHistorySnapshot();
    const nextContracts = [...contracts, { ...contract, deliveryOrder: contracts.length + 1 }];
    setContracts(nextContracts);
    setEditingContract(null);
    drag.clear();
    setContractFormKey((k) => k + 1);
  }

  function updateContract(updatedContract: Contract) {
    pushHistorySnapshot();
    const nextContracts = contracts.map((c) => c.id === updatedContract.id ? updatedContract : c);
    const nextFragments = fragments.filter((f) => f.contractId !== updatedContract.id);
    setContracts(nextContracts);
    setFragments(nextFragments);
    setPlacedCrates(buildFromFragments(nextContracts, nextFragments, shipId, sortMode));
    setEditingContract(null);
    setSelectedDelivery(null);
    drag.clear();
  }

  function deleteContract(id: string) {
    pushHistorySnapshot();
    const nextContracts = contracts.filter((c) => c.id !== id).map((c, i) => ({ ...c, deliveryOrder: i + 1 }));
    const nextFragments = fragments.filter((f) => f.contractId !== id);
    setContracts(nextContracts);
    setFragments(nextFragments);
    setPlacedCrates(buildFromFragments(nextContracts, nextFragments, shipId, sortMode));
    setArchivedDeliveries((prev) => prev.filter((a) => a.contractId !== id));
    setActivatedDeliveries((prev) => {
      const deletedDeliveryIds = new Set(
        contracts.find((c) => c.id === id)?.deliveries.map((d) => d.id) ?? []
      );
      return prev.filter((did) => !deletedDeliveryIds.has(did));
    });
    if (editingContract?.id === id) setEditingContract(null);
    if (selectedDelivery?.contractId === id) setSelectedDelivery(null);
    drag.clear();
  }

  function reorderContracts(reordered: Contract[]) {
    pushHistorySnapshot();
    setContracts(reordered);
    setPlacedCrates(buildFromFragments(reordered, fragments, shipId, sortMode));
    drag.clear();
  }

  // ── Livraisons ────────────────────────────────────────────────────────────

  function handleBayClick(bayId: string) {
    if (!selectedDelivery) return;
    pushHistorySnapshot();

    const { deliveryId, contractId } = selectedDelivery;
    const contract = contracts.find((c) => c.id === contractId);
    const delivery = contract?.deliveries.find((d) => d.id === deliveryId);
    if (!delivery) return;

    const bay = ship.cargoBays.find((b) => b.id === bayId);
    if (!bay) return;

    const alreadyInBay = placedCrates.filter((c) => c.bayId === bayId);
    const deliveryCrates = allCrates.filter((c) => c.deliveryId === deliveryId);
    const scuAlreadyPlaced = fragments.filter((f) => f.deliveryId === deliveryId).reduce((sum, f) => sum + f.placedScu, 0);
    const placedCrateIds = new Set(placedCrates.map((c) => c.id));
    const pendingCrates = deliveryCrates.filter((c) => !placedCrateIds.has(c.id));

    if (pendingCrates.length === 0) { setSelectedDelivery(null); return; }

    const newlyPlaced = placeCratesInBay(pendingCrates, bay, alreadyInBay, 0).map((p) => {
      const source = pendingCrates.find((c) => c.id === p.id)!;
      return { ...source, ...p } as PlacedCrateWithMeta;
    });

    const placedScu = newlyPlaced.reduce((sum, c) => sum + c.size, 0);
    if (placedScu === 0) { setSelectedDelivery({ ...selectedDelivery }); return; }

    const nextPlacedCrates = [...placedCrates, ...newlyPlaced];
    const fragmentKey = `${deliveryId}::${bayId}`;
    const existingFragment = fragments.find((f) => f.id === fragmentKey);
    const updatedFragment: DeliveryFragment = {
      id: fragmentKey, contractId, deliveryId, bayId,
      placedScu: (existingFragment?.placedScu ?? 0) + placedScu,
      totalScu: delivery.scu,
    };
    const nextFragments = [...fragments.filter((f) => f.id !== fragmentKey), updatedFragment];

    setPlacedCrates(nextPlacedCrates);
    setFragments(nextFragments);

    const remaining = delivery.scu - (scuAlreadyPlaced + placedScu);
    setSelectedDelivery(remaining > 0 ? { deliveryId, contractId, pendingScu: remaining } : null);
  }

  function handleRetractFragment(fragment: DeliveryFragment) {
    pushHistorySnapshot();
    setPlacedCrates(placedCrates.filter((c) => !(c.deliveryId === fragment.deliveryId && c.bayId === fragment.bayId)));
    setFragments(fragments.filter((f) => f.id !== fragment.id));
  }

  function archiveDelivery(deliveryId: string) {
    pushHistorySnapshot();
    const deliveryFragments = fragments.filter((f) => f.deliveryId === deliveryId);
    const deliveryCrates = placedCrates.filter((c) => c.deliveryId === deliveryId);
    if (deliveryCrates.length === 0) return;

    let destination = "", commodity = "", contractName = "", contractId = "", color = "";
    let totalScu = 0;
    for (const contract of contracts) {
      const delivery = contract.deliveries.find((d) => d.id === deliveryId);
      if (delivery) {
        destination = delivery.destination;
        commodity = delivery.commodity;
        totalScu = delivery.scu;
        contractName = contract.name;
        contractId = contract.id;
        color = deliveryColors.get(deliveryId) ?? contract.color;
        break;
      }
    }

    const archived: ArchivedDelivery = {
      deliveryId, contractId, contractName, destination, commodity, totalScu, color,
      fragments: deliveryFragments,
      placedCratesSnapshot: deliveryCrates.map((c) => ({
        id: c.id, bayId: c.bayId,
        gridPosition: { ...c.gridPosition },
        dimensions: { ...c.dimensions },
        size: c.size,
        contractId: c.contractId, contractName: c.contractName,
        deliveryId: c.deliveryId, destination: c.destination,
        commodity: c.commodity, color: c.color,
      })),
    };

    setArchivedDeliveries((prev) => [...prev, archived]);
    setPlacedCrates((prev) => prev.filter((c) => c.deliveryId !== deliveryId));
    setFragments((prev) => prev.filter((f) => f.deliveryId !== deliveryId));
    if (selectedDelivery?.deliveryId === deliveryId) setSelectedDelivery(null);
  }

  function restoreDelivery(archived: ArchivedDelivery) {
    pushHistorySnapshot();
    setPlacedCrates((prev) => [...prev, ...archived.placedCratesSnapshot as PlacedCrateWithMeta[]]);
    setFragments((prev) => [...prev, ...archived.fragments]);
    setArchivedDeliveries((prev) => prev.filter((a) => a.deliveryId !== archived.deliveryId));
  }

  // ── Drag ──────────────────────────────────────────────────────────────────

  function moveCrate(crateId: string, newPosition: { bayId: string; x: number; y: number; z: number }, rotatedDimensions?: { x: number; y: number; z: number }) {
    setPlacedCrates((prev) => {
      const afterMove = prev.map((crate) =>
        crate.id === crateId
          ? { ...crate, bayId: newPosition.bayId, gridPosition: { x: newPosition.x, y: newPosition.y, z: newPosition.z }, dimensions: rotatedDimensions ?? crate.dimensions }
          : crate
      );

      const next = applyGravity(afterMove, ship.cargoBays);

      const fragmentMap = new Map<string, DeliveryFragment>();
      for (const crate of next) {
        if (!crate.deliveryId) continue;
        const key = `${crate.deliveryId}::${crate.bayId}`;
        if (!fragmentMap.has(key)) {
          fragmentMap.set(key, { id: key, contractId: crate.contractId ?? "", deliveryId: crate.deliveryId, bayId: crate.bayId, placedScu: 0, totalScu: deliveryScuMap.get(crate.deliveryId) ?? 0 });
        }
        fragmentMap.get(key)!.placedScu += crate.size;
      }

      setFragments(Array.from(fragmentMap.values()));
      return next;
    });
  }

  function handleSelectCrate(id: string | null) {
    drag.setSelectedCrateId(id);
    if (id !== null) setActiveTab("placement");
  }

  function handleStartDrag(crateId: string) {
    if (selectedDelivery) return;
    drag.startDrag(crateId);
  }

  function handleEndDrag() {
    if (!drag.draggedCrateId || !drag.hoveredCell) {
      drag.clear(); return;
    }
    const movingCrate = placedCrates.find((c) => c.id === drag.draggedCrateId);
    const bay = ship.cargoBays.find((b) => b.id === drag.hoveredCell!.bayId);
    if (!movingCrate || !bay) {
      drag.clear(); return;
    }
    const rotatedDimensions = getRotatedDimensions(movingCrate.dimensions, drag.dragRotation);
    const rotatedCrate = { ...movingCrate, dimensions: rotatedDimensions };
    const resolvedPosition = resolveStackPosition(rotatedCrate, { x: drag.hoveredCell.x, y: drag.hoveredCell.y }, bay, placedCrates);
    if (resolvedPosition) { pushHistorySnapshot(); moveCrate(drag.draggedCrateId, resolvedPosition, rotatedDimensions); }
    drag.clear();
  }

  // ── Onglets ───────────────────────────────────────────────────────────────

  const headerContent = (
    <>
      <ShipSelector value={shipId} onChange={handleShipChange} />
      <CapacityPanel
        totalPlacedScu={totalPlacedScu}
        shipCapacityScu={shipCapacityScu}
        maxCrateCapacity={maxCrateCapacity}
        totalDeliveredScu={totalDeliveredScu}
      />
    </>
  );

  const contractsTabContent = (
    <>
      <ContractForm
        key={contractFormKey}
        onAdd={addContract}
        onUpdate={updateContract}
        contracts={contracts}
        editingContract={editingContract}
        onCancelEdit={() => setEditingContract(null)}
      />
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
        {deleteAllConfirm ? (
          <>
            <button onClick={deleteAllContracts} className="btn-danger" style={{ flex: 1 }}>Confirmer</button>
            <button onClick={() => setDeleteAllConfirm(false)} className="btn-secondary" style={{ flex: 1, fontSize: "11px" }}>Annuler suppression</button>
          </>
        ) : (
          <button onClick={() => setDeleteAllConfirm(true)} disabled={contracts.length === 0} className="btn-danger" style={{ flex: 1 }}>
            ✕ Supprimer tous les contrats
          </button>
        )}
      </div>
      <ContractList
        contracts={contracts}
        bays={ship.cargoBays}
        fragments={fragments}
        onDelete={deleteContract}
        onEdit={(c) => setEditingContract(c)}
        onReorder={reorderContracts}
        onRetractFragment={handleRetractFragment}
      />
    </>
  );

  const placementTabContent = (
    <>
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
        <button onClick={undoLastAction} disabled={!canUndo} className="btn-secondary" style={{ flex: 1 }}>
          ↩ Annuler
        </button>
      </div>
      <PendingDeliveriesPanel
        contracts={contracts}
        placedScuByDelivery={placedScuByDelivery}
        fragments={fragments}
        bays={ship.cargoBays}
        deliveryColors={deliveryColors}
        selectedDeliveryId={selectedDelivery?.deliveryId ?? null}
        highlightedDeliveryId={placedCrates.find((c) => c.id === drag.selectedCrateId)?.deliveryId ?? null}
        markedDeliveryIds={markedDeliveryIds}
        onMarkDelivery={(id) => setMarkedDeliveryIds((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id])}
        onClearMarked={() => setMarkedDeliveryIds([])}
        onClearPlacement={clearPlacement}
        activatedDeliveries={activatedDeliveries}
        onActivateDelivery={(id) => { pushHistorySnapshot(); setActivatedDeliveries((prev) => [...prev, id]); }}
        onDeactivateDelivery={(id) => {
          pushHistorySnapshot();
          setActivatedDeliveries((prev) => prev.filter((d) => d !== id));
          setPlacedCrates((prev) => prev.filter((c) => c.deliveryId !== id));
          setFragments((prev) => prev.filter((f) => f.deliveryId !== id));
          if (selectedDelivery?.deliveryId === id) setSelectedDelivery(null);
        }}
        onSelectDelivery={(deliveryId, contractId, scu) => {
          if (!activatedDeliveries.includes(deliveryId)) return;
          setSelectedDelivery({ deliveryId, contractId, pendingScu: scu });
          drag.setSelectedCrateId(null);
        }}
        onCancelSelection={() => setSelectedDelivery(null)}
        onRetractFragment={handleRetractFragment}
        archivedDeliveries={archivedDeliveries}
        onArchiveDelivery={archiveDelivery}
        onRestoreDelivery={restoreDelivery}
      />
    </>
  );

  return (
    <AppLayout
      header={headerContent}
      contractsTab={contractsTabContent}
      placementTab={placementTabContent}
      pendingCount={pendingCount}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      content={
        <CargoScene
          ship={ship}
          placedCrates={placedCrates}
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
          isAssigningDelivery={selectedDelivery !== null && selectedDelivery.pendingScu > 0}
          onBayClick={handleBayClick}
        />
      }
    />
  );
}
