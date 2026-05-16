import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import type { Contract } from "../types/Contract";
import type { DeliveryFragment } from "../types/DeliveryFragment";
import type { ArchivedDelivery } from "../types/ArchivedDelivery";

const SCU_SIZES = [1, 2, 4, 8, 16, 24, 32];
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
type CrateRow = { id: string; count: number; sizeScu: number };

type DeliveryItem = {
  contractId: string;
  contractName: string;
  contractColor: string;
  deliveryId: string;
  destination: string;
  commodity: string;
  pickupLocation: string;
  totalScu: number;
  pendingScu: number;
  state: "waiting" | "loaded";
  isDemo?: boolean;
  hasExplicitCrates: boolean;
  explicitCrates?: { sizeScu: number; count: number }[];
};

type Props = {
  contracts: Contract[];
  placedScuByDelivery: Map<string, number>;
  fragments: DeliveryFragment[];
  bays: { id: string; name: string; group?: string }[];
  deliveryColors: Map<string, string>;
  crateSelection: Map<string, number>;
  pendingCratesByDelivery: Map<string, { sizeScu: number; count: number }[]>;
  totalSelectedCrates: number;
  onUpdateCrateSelection: (key: string, delta: number) => void;
  onClearCrateSelection: () => void;
  highlightedDeliveryId: string | null;
  markedDeliveryIds: string[];
  onMarkDelivery: (id: string) => void;
  onClearMarked: () => void;
  onClearPlacement: () => void;
  activatedDeliveries: string[];
  onActivateDelivery: (id: string) => void;
  onDeactivateDelivery: (id: string) => void;
  onRetractFragment: (fragment: DeliveryFragment) => void;
  archivedDeliveries: ArchivedDelivery[];
  onArchiveDelivery: (deliveryId: string) => void;
  demoContract?: Contract;
  onDefineDeliveryCrates: (contractId: string, deliveryId: string, crates: { sizeScu: number; count: number }[]) => void;
};

export default function PendingDeliveriesPanel({
  contracts,
  placedScuByDelivery,
  fragments,
  bays,
  deliveryColors,
  crateSelection,
  pendingCratesByDelivery,
  totalSelectedCrates,
  onUpdateCrateSelection,
  onClearCrateSelection,
  highlightedDeliveryId,
  markedDeliveryIds,
  onMarkDelivery,
  onClearMarked,
  onClearPlacement,
  activatedDeliveries,
  onActivateDelivery,
  onDeactivateDelivery,
  onRetractFragment,
  archivedDeliveries,
  onArchiveDelivery,
  demoContract,
  onDefineDeliveryCrates,
}: Props) {
  const { t, locale } = useLanguage();
  const highlightedRef = useRef<HTMLDivElement>(null);
  const [confirmingDeliveryId, setConfirmingDeliveryId] = useState<string | null>(null);
  const [definingDeliveryId, setDefiningDeliveryId] = useState<string | null>(null);
  const [draftRows, setDraftRows] = useState<CrateRow[]>([]);

  useEffect(() => {
    if (highlightedDeliveryId && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [highlightedDeliveryId]);

  const items = useMemo(() => {
    const archivedIds = new Set(archivedDeliveries.map((a) => a.deliveryId));
    const activatedSet = new Set(activatedDeliveries);
    const result: DeliveryItem[] = [];

    if (demoContract) {
      for (const delivery of demoContract.deliveries) {
        result.push({
          contractId: demoContract.id,
          contractName: demoContract.name,
          contractColor: demoContract.color,
          deliveryId: delivery.id,
          destination: delivery.destination,
          commodity: delivery.commodity,
          pickupLocation: delivery.pickupLocation,
          totalScu: delivery.scu,
          pendingScu: 0,
          state: "loaded",
          isDemo: true,
          hasExplicitCrates: true,
          explicitCrates: delivery.explicitCrates,
        });
      }
    }

    for (const contract of contracts) {
      for (const delivery of contract.deliveries) {
        if (delivery.scu <= 0) continue;
        if (archivedIds.has(delivery.id)) continue;
        const placed = placedScuByDelivery.get(delivery.id) ?? 0;
        result.push({
          contractId: contract.id,
          contractName: contract.name,
          contractColor: contract.color,
          deliveryId: delivery.id,
          destination: delivery.destination,
          commodity: delivery.commodity,
          pickupLocation: delivery.pickupLocation,
          totalScu: delivery.scu,
          pendingScu: Math.max(0, delivery.scu - placed),
          state: activatedSet.has(delivery.id) ? "loaded" : "waiting",
          hasExplicitCrates: !!delivery.explicitCrates,
          explicitCrates: delivery.explicitCrates,
        });
      }
    }
    return result;
  }, [contracts, placedScuByDelivery, activatedDeliveries, archivedDeliveries, demoContract]);

  const { loadedItems, waitingItems } = useMemo(() => {
    const loaded: DeliveryItem[] = [];
    const waiting: DeliveryItem[] = [];
    for (const item of items) {
      if (item.state === "loaded") loaded.push(item);
      else waiting.push(item);
    }
    return { loadedItems: loaded, waitingItems: waiting };
  }, [items]);

  const fragmentsByDelivery = useMemo(() => {
    const map = new Map<string, DeliveryFragment[]>();
    for (const frag of fragments) {
      const list = map.get(frag.deliveryId);
      if (list) list.push(frag);
      else map.set(frag.deliveryId, [frag]);
    }
    return map;
  }, [fragments]);

  const markedSet = useMemo(() => new Set(markedDeliveryIds), [markedDeliveryIds]);

  const totalSelectedScu = useMemo(() => {
    let total = 0;
    for (const [key, count] of crateSelection) {
      const sizeScu = parseInt(key.split("::")[1], 10);
      if (!isNaN(sizeScu)) total += sizeScu * count;
    }
    return total;
  }, [crateSelection]);

  const [viderConfirm, setViderConfirm] = useState(false);

  if (items.length === 0 && archivedDeliveries.length === 0) return null;

  const instructionActive = totalSelectedCrates > 0;
  const instructionVisible = instructionActive || loadedItems.some((i) => i.pendingScu > 0);
  const deliveredCount = archivedDeliveries.length;

  function getBayLabel(bayId: string): string {
    const index = bays.findIndex((b) => b.id === bayId);
    if (index >= 0) return `${t("contractList.bay")} ${index + 1}`;
    const sectionIndices = bays
      .map((b, i) => ({ b, i }))
      .filter(({ b }) => b.group === bayId)
      .map(({ i }) => i + 1);
    if (sectionIndices.length > 0) return `${t("contractList.bay")} ${sectionIndices.join("+")}`;
    return bayId;
  }

  function renderItem(item: DeliveryItem) {
    const isDemo = item.isDemo === true;
    const isComplete = item.pendingScu <= 0 && item.state === "loaded";
    const deliveryFragments = fragmentsByDelivery.get(item.deliveryId) ?? [];
    const deliveryColor = deliveryColors.get(item.deliveryId) ?? item.contractColor;
    const isHighlighted = highlightedDeliveryId === item.deliveryId;
    const isMarked = markedSet.has(item.deliveryId);
    const isWaiting = item.state === "waiting";
    const isDefining = definingDeliveryId === item.deliveryId;
    const pendingGroups = (!isWaiting && !isDemo) ? (pendingCratesByDelivery.get(item.deliveryId) ?? []) : [];
    const draftTotal = isDefining
      ? draftRows.reduce((sum, r) => sum + Math.max(0, r.count) * (r.sizeScu || 0), 0)
      : 0;
    const canConfirm = draftTotal === item.totalScu && draftRows.every((r) => r.sizeScu > 0 && r.count > 0);

    const borderColor = isComplete
      ? "rgba(34,211,160,0.4)"
      : isHighlighted
        ? "#facc15"
        : isMarked
          ? "rgba(56,189,248,0.6)"
          : isWaiting
            ? "var(--border)"
            : "var(--border-glow)";

    const bgColor = isComplete
      ? "rgba(34,211,160,0.08)"
      : isHighlighted
        ? "rgba(250,204,21,0.12)"
        : isMarked
          ? "rgba(56,189,248,0.08)"
          : isWaiting
            ? "var(--panel)"
            : "linear-gradient(150deg, var(--panel-alt) 0%, var(--panel) 100%)";

    const scuColor = isComplete ? "var(--success)" : isWaiting ? "var(--text)" : "var(--accent)";

    return (
      <div
        key={item.deliveryId}
        className="delivery-card"
        style={{ marginBottom: "6px" }}
        ref={isHighlighted ? highlightedRef : undefined}
      >
        <div
          style={{
            background: bgColor,
            borderTop: `1px solid ${borderColor}`,
            borderRight: `1px solid ${borderColor}`,
            borderBottom: `1px solid ${borderColor}`,
            borderLeft: `4px solid ${deliveryColor}`,
            borderRadius: "3px",
            opacity: isWaiting ? 0.8 : 1,
            transition: "background 0.15s, border-color 0.15s",
            boxShadow: isHighlighted
              ? "0 0 0 1px #facc1544, 0 2px 12px rgba(250,204,21,0.15)"
              : "0 1px 8px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ padding: "10px 12px" }}>

            {/* Info principale */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0, marginTop: "4px",
                background: isComplete ? "var(--success)" : isWaiting ? "transparent" : deliveryColor,
                border: isWaiting ? `1.5px solid ${deliveryColor}` : "none",
                boxShadow: isComplete ? "0 0 6px var(--success)" : isWaiting ? "none" : `0 0 8px ${deliveryColor}`,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Titre : ressource + SCU */}
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "3px" }}>
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text)", letterSpacing: "0.02em", flex: 1 }}>
                    {item.commodity}
                  </span>
                  {isHighlighted && <span style={{ color: "#facc15", fontSize: "12px", flexShrink: 0 }}>◀</span>}
                  <span style={{ fontFamily: "var(--font-mono)", flexShrink: 0, fontSize: "12px", fontWeight: 700, color: scuColor }}>
                    {isComplete ? "✓ " : ""}{item.pendingScu > 0 ? item.pendingScu : item.totalScu}
                    <span style={{ fontSize: "10px", fontWeight: 400, marginLeft: "2px" }}>
                      {item.pendingScu < item.totalScu && item.pendingScu > 0 ? `/ ${item.totalScu} ` : ""}SCU
                    </span>
                  </span>
                </div>
                {/* Contrat */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  {isDemo && <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--accent)", border: "1px solid var(--accent)", padding: "1px 4px", borderRadius: "2px", opacity: 0.7 }}>{t("pending.example")}</span>}
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>{item.contractName}</span>
                </div>
                {/* Route */}
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", padding: "5px 8px", background: "rgba(0,0,0,0.25)", border: "1px solid var(--border)", borderRadius: "2px" }}>
                  {item.pickupLocation && (
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--success)", flexShrink: 0, minWidth: "32px", textAlign: "right", letterSpacing: "0.05em" }}>{t("pending.from")}</span>
                      <span style={{ fontSize: "11px", color: "rgba(34,211,160,0.85)" }}>{item.pickupLocation}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--accent)", flexShrink: 0, minWidth: "32px", textAlign: "right", letterSpacing: "0.05em" }}>{t("pending.to")}</span>
                    <span style={{ fontSize: "11px", color: "var(--cyan)" }}>{item.destination}</span>
                  </div>
                </div>

                {/* Définition des caisses (livraisons en attente uniquement) */}
                {isWaiting && (
                  isDefining ? (
                    <div style={{ marginTop: "8px", border: "1px solid var(--border-glow)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", background: "rgba(30,74,110,0.2)", borderBottom: "1px solid var(--border-glow)" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em", color: "var(--text-dim)", textTransform: "uppercase" }}>{t("pending.defineTitle")}</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, color: draftTotal === item.totalScu ? "var(--success)" : draftTotal > item.totalScu ? "var(--danger)" : "var(--text-muted)" }}>
                          {draftTotal}&thinsp;/&thinsp;{item.totalScu}&thinsp;SCU
                        </span>
                      </div>
                      <div style={{ padding: "8px 10px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto", gap: "6px 8px", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Quantité</span>
                          <span />
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Taille</span>
                          <span />
                          {draftRows.map((row) => (
                            <Fragment key={row.id}>
                              <div style={{ display: "flex", alignItems: "stretch", border: "1px solid var(--border-glow)", borderRadius: "2px", overflow: "hidden" }}>
                                <input
                                  type="number"
                                  min={1}
                                  max={99}
                                  className="crate-count-input"
                                  value={row.count}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                    setDraftRows((prev) => prev.map((r) => r.id === row.id ? { ...r, count: val } : r));
                                  }}
                                  style={{
                                    flex: 1, width: 0, textAlign: "center", border: "none", outline: "none",
                                    fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-bright)",
                                    background: "rgba(0,0,0,0.3)", padding: "7px 4px",
                                  }}
                                />
                                <div style={{ display: "flex", flexDirection: "column", borderLeft: "1px solid var(--border-glow)" }}>
                                  <button
                                    onClick={() => setDraftRows((prev) => prev.map((r) => r.id === row.id ? { ...r, count: Math.min(99, r.count + 1) } : r))}
                                    style={{ background: "none", border: "none", borderBottom: "1px solid var(--border-glow)", color: "var(--text-dim)", cursor: "pointer", padding: "0 7px", flex: 1, fontSize: "8px", lineHeight: 1 }}
                                  >▲</button>
                                  <button
                                    onClick={() => setDraftRows((prev) => prev.map((r) => r.id === row.id ? { ...r, count: Math.max(1, r.count - 1) } : r))}
                                    style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", padding: "0 7px", flex: 1, fontSize: "8px", lineHeight: 1 }}
                                  >▼</button>
                                </div>
                              </div>
                              <span style={{ color: "var(--text-dim)", fontSize: "18px", lineHeight: 1, textAlign: "center" }}>×</span>
                              <select
                                value={row.sizeScu}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  setDraftRows((prev) => prev.map((r) => r.id === row.id ? { ...r, sizeScu: val } : r));
                                }}
                                className="scifi-input"
                                style={{ padding: "7px 8px", fontSize: "13px" }}
                              >
                                <option value={0} disabled>{t("pending.defineChooseSize")}</option>
                                {SCU_SIZES.map((s) => <option key={s} value={s}>{s} SCU</option>)}
                              </select>
                              <button
                                onClick={() => setDraftRows((prev) => prev.filter((r) => r.id !== row.id))}
                                style={{
                                  background: "none", border: "none",
                                  color: "var(--danger)", cursor: "pointer",
                                  fontSize: "14px", padding: "2px 2px",
                                  visibility: draftRows.length > 1 ? "visible" : "hidden",
                                }}
                              >✕</button>
                            </Fragment>
                          ))}
                        </div>
                        <button
                          onClick={() => setDraftRows((prev) => [...prev, { id: genId(), count: 1, sizeScu: 0 }])}
                          style={{
                            background: "none", border: "1px solid var(--border-glow)",
                            color: "var(--text-dim)", cursor: "pointer",
                            fontSize: "10px", fontFamily: "var(--font-mono)",
                            padding: "2px 8px", borderRadius: "2px", marginTop: "2px",
                          }}
                        >{t("manualForm.addRow")}</button>
                      </div>
                    </div>
                  ) : item.hasExplicitCrates ? (
                    <div style={{ marginTop: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "3px" }}>
                        {item.explicitCrates!.map((c, i) => (
                          <span key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                            {c.count}&thinsp;×&thinsp;{c.sizeScu}&thinsp;SCU
                          </span>
                        ))}
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        {deliveryFragments.length > 0 ? (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", fontStyle: "italic" }}>
                            {t("pending.defineBlocked")}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDraftRows(item.explicitCrates!.map((c) => ({ id: genId(), count: c.count, sizeScu: c.sizeScu }))); setDefiningDeliveryId(item.deliveryId); }}
                            style={{
                              background: "none", border: "1px solid var(--border-glow)",
                              color: "var(--text-muted)", cursor: "pointer",
                              fontSize: "10px", fontFamily: "var(--font-mono)", padding: "1px 6px", borderRadius: "2px",
                            }}
                          >{t("pending.redefine")}</button>
                        )}
                      </div>
                    </div>
                  ) : null
                )}

                {/* Crate pool */}
                {pendingGroups.length > 0 && (
                  <div style={{ marginTop: "8px", padding: "6px 8px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: "2px" }}>
                    {(() => {
                      const allSelected = pendingGroups.every(
                        (g) => (crateSelection.get(`${item.deliveryId}::${g.sizeScu}`) ?? 0) >= g.count
                      );
                      const deliverySelectedScu = pendingGroups.reduce(
                        (sum, g) => sum + (crateSelection.get(`${item.deliveryId}::${g.sizeScu}`) ?? 0) * g.sizeScu, 0
                      );
                      return (
                        <div style={{ display: "flex", gap: "4px", alignItems: "center", marginBottom: "6px" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              for (const group of pendingGroups) {
                                const key = `${item.deliveryId}::${group.sizeScu}`;
                                const delta = group.count - (crateSelection.get(key) ?? 0);
                                if (delta > 0) onUpdateCrateSelection(key, delta);
                              }
                            }}
                            disabled={allSelected}
                            style={{
                              flexShrink: 0,
                              background: allSelected ? "none" : "rgba(224,120,40,0.08)",
                              border: `1px solid ${allSelected ? "var(--border)" : "var(--accent-dim)"}`,
                              color: allSelected ? "var(--text-dim)" : "var(--accent)",
                              cursor: allSelected ? "default" : "pointer",
                              fontSize: "10px", fontFamily: "var(--font-mono)",
                              padding: "3px 8px", borderRadius: "2px",
                              opacity: allSelected ? 0.45 : 1,
                            }}
                          >{t("pending.selectAll")}</button>
                          <div style={{
                            marginLeft: "auto", display: "flex", alignItems: "center",
                            border: `1px solid ${deliverySelectedScu > 0 ? "var(--accent-dim)" : "var(--border)"}`,
                            borderRadius: "2px", overflow: "hidden",
                            opacity: deliverySelectedScu > 0 ? 1 : 0.45,
                          }}>
                            <span style={{
                              padding: "2px 7px",
                              fontFamily: "var(--font-mono)", fontSize: "10px",
                              color: deliverySelectedScu > 0 ? "var(--accent)" : "var(--text-dim)",
                            }}>
                              {deliverySelectedScu} SCU
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (deliverySelectedScu === 0) return;
                                for (const group of pendingGroups) {
                                  const key = `${item.deliveryId}::${group.sizeScu}`;
                                  const selected = crateSelection.get(key) ?? 0;
                                  if (selected > 0) onUpdateCrateSelection(key, -selected);
                                }
                              }}
                              disabled={deliverySelectedScu === 0}
                              style={{
                                background: deliverySelectedScu > 0 ? "rgba(224,120,40,0.08)" : "none",
                                borderLeft: `1px solid ${deliverySelectedScu > 0 ? "var(--accent-dim)" : "var(--border)"}`,
                                border: "none",
                                color: deliverySelectedScu > 0 ? "var(--accent)" : "var(--text-dim)",
                                cursor: deliverySelectedScu > 0 ? "pointer" : "default",
                                fontSize: "10px", fontFamily: "var(--font-mono)",
                                padding: "2px 8px",
                              }}
                            >{t("pending.clearSelection")}</button>
                          </div>
                        </div>
                      );
                    })()}
                    {pendingGroups.map((group, idx) => {
                      const key = `${item.deliveryId}::${group.sizeScu}`;
                      const selected = crateSelection.get(key) ?? 0;
                      const isLast = idx === pendingGroups.length - 1;
                      return (
                        <div key={group.sizeScu} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: isLast ? 0 : "4px" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)", width: "38px", flexShrink: 0 }}>
                            {group.sizeScu} SCU
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); if (selected > 0) onUpdateCrateSelection(key, -1); }}
                            style={{
                              background: "none",
                              border: `1px solid ${selected > 0 ? "var(--border-glow)" : "var(--border)"}`,
                              color: selected > 0 ? "var(--text-dim)" : "var(--border-glow)",
                              cursor: selected > 0 ? "pointer" : "default",
                              width: "22px", height: "20px", fontSize: "14px", lineHeight: 1,
                              borderRadius: "2px", flexShrink: 0, padding: 0,
                            }}
                          >−</button>
                          <span style={{
                            fontFamily: "var(--font-mono)", fontSize: "12px", textAlign: "center",
                            color: selected > 0 ? "var(--accent)" : "var(--text-muted)",
                            width: "50px", flexShrink: 0,
                          }}>
                            {selected}&nbsp;/&nbsp;{group.count}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); if (selected < group.count) onUpdateCrateSelection(key, 1); }}
                            style={{
                              background: selected < group.count ? "rgba(224,120,40,0.1)" : "none",
                              border: `1px solid ${selected < group.count ? "var(--accent-dim)" : "var(--border)"}`,
                              color: selected < group.count ? "var(--accent)" : "var(--border-glow)",
                              cursor: selected < group.count ? "pointer" : "default",
                              width: "22px", height: "20px", fontSize: "14px", lineHeight: 1,
                              borderRadius: "2px", flexShrink: 0, padding: 0,
                            }}
                          >+</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Fragments : emplacement des caisses */}
            {deliveryFragments.length > 0 && (
              <div style={{
                marginTop: "8px",
                background: "rgba(0,0,0,0.22)",
                border: "1px solid var(--border)",
                borderRadius: "2px",
                overflow: "hidden",
              }}>
                {deliveryFragments.map((frag, idx) => (
                  <div key={frag.id} style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "4px 8px",
                    borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)", opacity: 0.6 }}>◈</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--cyan)", flex: 1 }}>
                      {getBayLabel(frag.bayId)}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                      {frag.placedScu}&thinsp;SCU
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRetractFragment(frag); }}
                      style={{
                        background: "none",
                        border: "1px solid rgba(180,200,220,0.2)",
                        color: "var(--text-muted)", cursor: "pointer",
                        fontSize: "10px", fontFamily: "var(--font-mono)",
                        padding: "1px 6px", borderRadius: "2px", flexShrink: 0,
                      }}
                    >{t("pending.retract")}</button>
                  </div>
                ))}
              </div>
            )}

            {/* Séparateur */}
            <div style={{ borderTop: "1px solid var(--border)", margin: "0 -12px 8px", opacity: 0.6 }} />

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "4px" }}>
              {isWaiting ? (
                isDefining ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDefineDeliveryCrates(item.contractId, item.deliveryId, draftRows.map((r) => ({ sizeScu: r.sizeScu, count: r.count })));
                        setDefiningDeliveryId(null);
                        setDraftRows([]);
                      }}
                      disabled={!canConfirm}
                      style={{
                        background: canConfirm ? "rgba(34,211,160,0.1)" : "none",
                        border: `1px solid ${canConfirm ? "rgba(34,211,160,0.5)" : "var(--border)"}`,
                        color: canConfirm ? "var(--success)" : "var(--border-glow)",
                        cursor: canConfirm ? "pointer" : "default",
                        fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 700,
                        padding: "2px 8px", borderRadius: "2px",
                      }}
                    >{t("pending.defineConfirm")}</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDefiningDeliveryId(null); setDraftRows([]); }}
                      style={{
                        background: "none", border: "1px solid var(--border-glow)",
                        color: "var(--text-muted)", cursor: "pointer",
                        fontSize: "11px", fontFamily: "var(--font-mono)", padding: "2px 8px", borderRadius: "2px",
                      }}
                    >{t("pending.defineCancel")}</button>
                  </>
                ) : (
                  <>
                    {item.hasExplicitCrates ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onActivateDelivery(item.deliveryId); }}
                        style={{
                          background: "rgba(34,211,160,0.08)", border: "1px solid rgba(34,211,160,0.35)",
                          color: "var(--success)", cursor: "pointer", fontSize: "11px",
                          fontFamily: "var(--font-mono)", padding: "2px 8px", borderRadius: "2px", whiteSpace: "nowrap",
                        }}
                      >{t("pending.activate")}</button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const defaultGroups = pendingCratesByDelivery.get(item.deliveryId) ?? [];
                          setDraftRows(
                            defaultGroups.length > 0
                              ? defaultGroups.map((g) => ({ id: genId(), count: g.count, sizeScu: g.sizeScu }))
                              : [{ id: genId(), count: 1, sizeScu: 0 }]
                          );
                          setDefiningDeliveryId(item.deliveryId);
                        }}
                        style={{
                          background: "rgba(56,189,248,0.08)", border: "1px solid var(--cyan-dim)",
                          color: "var(--cyan)", cursor: "pointer", fontSize: "11px",
                          fontFamily: "var(--font-mono)", padding: "2px 8px", borderRadius: "2px", whiteSpace: "nowrap",
                        }}
                      >{t("pending.defineCrates")}</button>
                    )}
                    {!isDemo && (
                      <button
                        disabled
                        style={{
                          background: "none", border: "1px solid var(--border)",
                          color: "var(--border-glow)", cursor: "default",
                          fontSize: "11px", fontFamily: "var(--font-mono)", padding: "2px 8px", borderRadius: "2px",
                        }}
                      >{t("pending.deactivate")}</button>
                    )}
                  </>
                )
              ) : (
                <>
                  {!isDemo && isComplete && (confirmingDeliveryId === item.deliveryId ? (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); onArchiveDelivery(item.deliveryId); setConfirmingDeliveryId(null); }}
                        style={{
                          background: "rgba(34,211,160,0.15)", border: "1px solid rgba(34,211,160,0.6)",
                          color: "var(--success)", cursor: "pointer", fontSize: "11px",
                          fontFamily: "var(--font-mono)", fontWeight: 700, padding: "2px 8px", borderRadius: "2px", whiteSpace: "nowrap",
                        }}
                      >{t("pending.confirmDelivery")}</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmingDeliveryId(null); }}
                        style={{
                          background: "none", border: "1px solid var(--border-glow)",
                          color: "var(--text-muted)", cursor: "pointer", fontSize: "11px",
                          fontFamily: "var(--font-mono)", padding: "2px 8px", borderRadius: "2px",
                        }}
                      >✕</button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmingDeliveryId(item.deliveryId); }}
                      style={{
                        background: "rgba(34,211,160,0.1)", border: "1px solid rgba(34,211,160,0.4)",
                        color: "var(--success)", cursor: "pointer", fontSize: "11px",
                        fontFamily: "var(--font-mono)", fontWeight: 700, padding: "2px 8px", borderRadius: "2px", whiteSpace: "nowrap",
                      }}
                    >{t("pending.markDone")}</button>
                  ))}
                  {!isDemo && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onMarkDelivery(item.deliveryId); }}
                      style={{
                        background: isMarked ? "rgba(56,189,248,0.15)" : "none",
                        border: `1px solid ${isMarked ? "rgba(56,189,248,0.5)" : "var(--border-glow)"}`,
                        color: isMarked ? "var(--cyan)" : "var(--text-muted)",
                        cursor: "pointer", fontSize: "11px", fontFamily: "var(--font-mono)", padding: "2px 8px", borderRadius: "2px",
                      }}
                    >{isMarked ? t("pending.marked") : t("pending.mark")}</button>
                  )}
                  {!isDemo && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeactivateDelivery(item.deliveryId); }}
                      style={{
                        background: "none", border: "1px solid rgba(224,80,80,0.3)",
                        color: "var(--danger)", cursor: "pointer",
                        fontSize: "11px", fontFamily: "var(--font-mono)", padding: "2px 8px", borderRadius: "2px",
                      }}
                    >{t("pending.deactivate")}</button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="scifi-panel" style={{ marginBottom: "10px" }}>
      <div className="corner-tl" />
      <div className="corner-br" />

      <div className="section-header">{t("pending.title")}</div>

      {/* Résumé */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px", fontFamily: "var(--font-mono)", fontSize: "11px", flexWrap: "wrap" }}>
        {waitingItems.length > 0 && <span style={{ color: "var(--text-dim)" }}>⏳ {waitingItems.length} {t("pending.waiting")}</span>}
        {loadedItems.length > 0 && <span style={{ color: "var(--accent)" }}>↑ {loadedItems.length} {t("pending.loaded")}{locale === "fr" && loadedItems.length > 1 ? "s" : ""}</span>}
        {deliveredCount > 0 && <span style={{ color: "var(--success)" }}>✓ {deliveredCount} {t("pending.delivered")}{locale === "fr" && deliveredCount > 1 ? "s" : ""}</span>}
      </div>

      {/* Instruction contextuelle */}
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.06em",
        padding: "6px 8px", marginBottom: "10px", borderRadius: "3px",
        background: "var(--accent-glow)",
        border: "1px solid var(--accent-dim)",
        color: "var(--accent)",
        userSelect: "none",
        visibility: instructionVisible ? "visible" : "hidden",
        position: "relative",
      }}>
        <span style={{ opacity: instructionActive ? 0 : 1 }}>{t("pending.instructionPool")}</span>
        <span style={{ position: "absolute", inset: 0, padding: "6px 8px", opacity: instructionActive ? 1 : 0 }}>{t("pending.instructionBay")}</span>
      </div>

      {/* Sélection active */}
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        marginBottom: "10px", padding: "8px 10px",
        background: totalSelectedCrates > 0
          ? "linear-gradient(90deg, rgba(224,120,40,0.14) 0%, rgba(224,120,40,0.04) 100%)"
          : "none",
        borderTop: "1px solid var(--accent-dim)",
        borderRight: "1px solid var(--accent-dim)",
        borderBottom: "1px solid var(--accent-dim)",
        borderLeft: `3px solid ${totalSelectedCrates > 0 ? "var(--accent)" : "var(--accent-dim)"}`,
        borderRadius: "2px",
        transition: "background 0.2s, border-left-color 0.2s",
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "2px" }}>
            {t("pending.selectionLabel")}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700, lineHeight: 1, color: totalSelectedCrates > 0 ? "var(--accent)" : "var(--text-dim)" }}>
            {totalSelectedScu}&thinsp;SCU
          </div>
        </div>
        {totalSelectedCrates > 0 && (
          <button
            onClick={onClearCrateSelection}
            style={{
              flexShrink: 0,
              background: "none",
              border: "1px solid var(--accent-dim)",
              color: "var(--accent)", cursor: "pointer",
              fontSize: "10px", fontFamily: "var(--font-mono)",
              padding: "4px 10px", borderRadius: "2px",
              letterSpacing: "0.04em",
            }}
          >{t("pending.clearSelection")}</button>
        )}
      </div>

      {/* Effacer marquages */}
      <button
        onClick={onClearMarked}
        disabled={markedDeliveryIds.length === 0}
        style={{
          width: "100%", marginBottom: "10px",
          background: "none",
          border: `1px solid ${markedDeliveryIds.length > 0 ? "rgba(180,200,220,0.45)" : "var(--border)"}`,
          color: markedDeliveryIds.length > 0 ? "var(--text)" : "var(--text-dim)",
          cursor: markedDeliveryIds.length > 0 ? "pointer" : "default",
          fontSize: "11px", fontFamily: "var(--font-mono)", padding: "4px 8px", borderRadius: "2px",
          opacity: markedDeliveryIds.length > 0 ? 1 : 0.35,
        }}
      >{t("pending.cancelMark")}</button>

      {/* Chargées */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: loadedItems.length > 0 ? "10px" : "6px" }}>
        <div className="section-header" style={{ color: "var(--accent)", marginBottom: 0, flex: 1 }}>{t("pending.inBay")}</div>
        {viderConfirm ? (
          <>
            <button onClick={() => { onClearPlacement(); setViderConfirm(false); }} style={{
              background: "none", border: "1px solid rgba(224,80,80,0.35)",
              color: "var(--danger)", cursor: "pointer",
              fontSize: "11px", fontFamily: "var(--font-mono)", padding: "1px 8px", borderRadius: "2px", marginRight: "4px",
            }}>{t("pending.clearConfirm")}</button>
            <button onClick={() => setViderConfirm(false)} style={{
              background: "none", border: "1px solid var(--border-glow)",
              color: "var(--text-muted)", cursor: "pointer",
              fontSize: "11px", fontFamily: "var(--font-mono)", padding: "1px 8px", borderRadius: "2px",
            }}>{t("pending.clearCancel")}</button>
          </>
        ) : (
          <button onClick={() => setViderConfirm(true)} style={{
            background: "none", border: "1px solid rgba(224,80,80,0.35)",
            color: "var(--danger)", cursor: "pointer",
            fontSize: "11px", fontFamily: "var(--font-mono)", padding: "1px 8px", borderRadius: "2px",
          }}>{t("pending.clearBay")}</button>
        )}
      </div>
      {loadedItems.length > 0 && loadedItems.map((item) => renderItem(item))}

      {/* En attente */}
      {waitingItems.length > 0 && (
        <>
          <div className="section-header" style={{ color: "var(--text-dim)", marginTop: "12px" }}>
            {t("pending.waitingSection")}
          </div>
          {waitingItems.map((item) => renderItem(item))}
        </>
      )}

      {/* Livrées */}
      {archivedDeliveries.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <div className="section-header" style={{ color: "var(--success)" }}>{t("pending.deliveredSection")}</div>
          {archivedDeliveries.map((archived) => (
            <div key={archived.deliveryId} style={{
              marginBottom: "6px",
              background: "linear-gradient(150deg, rgba(34,211,160,0.06) 0%, rgba(34,211,160,0.03) 100%)",
              borderTop: "1px solid rgba(34,211,160,0.2)",
              borderRight: "1px solid rgba(34,211,160,0.2)",
              borderBottom: "1px solid rgba(34,211,160,0.2)",
              borderLeft: `4px solid ${archived.color}`,
              borderRadius: "3px", opacity: 0.85,
              boxShadow: "0 1px 8px rgba(0,0,0,0.25)",
            }}>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0, marginTop: "4px", background: "var(--success)", boxShadow: "0 0 6px var(--success)" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "3px" }}>
                      <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-dim)", flex: 1 }}>
                        {archived.commodity}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--success)", fontWeight: 700, flexShrink: 0 }}>
                        ✓&nbsp;{archived.totalScu}&nbsp;SCU
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>{archived.contractName}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", padding: "4px 8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(34,211,160,0.15)", borderRadius: "2px" }}>
                      {archived.pickupLocation && (
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--success)", flexShrink: 0, minWidth: "32px", textAlign: "right", letterSpacing: "0.05em" }}>{t("pending.from")}</span>
                          <span style={{ fontSize: "11px", color: "rgba(34,211,160,0.85)" }}>{archived.pickupLocation}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--accent)", flexShrink: 0, minWidth: "32px", textAlign: "right", letterSpacing: "0.05em" }}>{t("pending.to")}</span>
                        <span style={{ fontSize: "11px", color: "var(--cyan)" }}>{archived.destination}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
