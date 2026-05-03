import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import type { Contract } from "../types/Contract";
import type { DeliveryFragment } from "../types/DeliveryFragment";
import type { ArchivedDelivery } from "../types/ArchivedDelivery";

// États d'une livraison
// "waiting"  : en attente d'arriver au lieu de chargement
// "loaded"   : chargée dans la soute, prête à être livrée
// "delivered": archivée

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
};

type Props = {
  contracts: Contract[];
  placedScuByDelivery: Map<string, number>;
  fragments: DeliveryFragment[];
  bays: { id: string; name: string; group?: string }[];
  deliveryColors: Map<string, string>;
  selectedDeliveryId: string | null;
  highlightedDeliveryId: string | null;
  markedDeliveryIds: string[];
  onMarkDelivery: (id: string) => void;
  onClearMarked: () => void;
  onClearPlacement: () => void;
  activatedDeliveries: string[];
  onActivateDelivery: (id: string) => void;
  onDeactivateDelivery: (id: string) => void;
  onSelectDelivery: (deliveryId: string, contractId: string, scu: number) => void;
  onCancelSelection: () => void;
  onRetractFragment: (fragment: DeliveryFragment) => void;
  archivedDeliveries: ArchivedDelivery[];
  onArchiveDelivery: (deliveryId: string) => void;
  demoContract?: Contract;
};

export default function PendingDeliveriesPanel({
  contracts,
  placedScuByDelivery,
  fragments,
  bays,
  deliveryColors,
  selectedDeliveryId,
  highlightedDeliveryId,
  markedDeliveryIds,
  onMarkDelivery,
  onClearMarked,
  onClearPlacement,
  activatedDeliveries,
  onActivateDelivery,
  onDeactivateDelivery,
  onSelectDelivery,
  onCancelSelection,
  onRetractFragment,
  archivedDeliveries,
  onArchiveDelivery,
  demoContract,
}: Props) {
  const { t, locale } = useLanguage();
  const highlightedRef = useRef<HTMLDivElement>(null);
  const [confirmingDeliveryId, setConfirmingDeliveryId] = useState<string | null>(null);

  useEffect(() => {
    if (highlightedDeliveryId && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [highlightedDeliveryId]);

  const items = useMemo(() => {
    const archivedIds = new Set(archivedDeliveries.map((a) => a.deliveryId));
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
        });
      }
    }

    for (const contract of contracts) {
      for (const delivery of contract.deliveries) {
        if (delivery.scu <= 0) continue;
        if (archivedIds.has(delivery.id)) continue;
        const placed = placedScuByDelivery.get(delivery.id) ?? 0;
        const isActivated = activatedDeliveries.includes(delivery.id);
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
          state: isActivated ? "loaded" : "waiting",
        });
      }
    }
    return result;
  }, [contracts, placedScuByDelivery, activatedDeliveries, archivedDeliveries, demoContract]);

  const { sortedItems, loadedCount, waitingCount } = useMemo(() => {
    let loaded = 0, waiting = 0;
    const sorted: DeliveryItem[] = [];
    const waitingItems: DeliveryItem[] = [];
    for (const item of items) {
      if (item.state === "loaded") { sorted.push(item); loaded++; }
      else { waitingItems.push(item); waiting++; }
    }
    return { sortedItems: [...sorted, ...waitingItems], loadedCount: loaded, waitingCount: waiting };
  }, [items]);

  const [viderConfirm, setViderConfirm] = useState(false);

  if (items.length === 0 && archivedDeliveries.length === 0) return null;

  const isSelecting = selectedDeliveryId !== null;
  const deliveredCount = archivedDeliveries.length;

  function getBayLabel(bayId: string): string {
    const index = bays.findIndex((b) => b.id === bayId);
    if (index >= 0) return `${t("contractList.bay")} ${index + 1}`;
    // Groupe composé : trouver toutes les sections membres
    const sectionIndices = bays
      .map((b, i) => ({ b, i }))
      .filter(({ b }) => b.group === bayId)
      .map(({ i }) => i + 1);
    if (sectionIndices.length > 0) return `${t("contractList.bay")} ${sectionIndices.join("+")}`;
    return bayId;
  }

  function renderItem(item: DeliveryItem) {
    const isDemo = item.isDemo === true;
    const isSelected = !isDemo && selectedDeliveryId === item.deliveryId;
    const isComplete = item.pendingScu <= 0 && item.state === "loaded";
    const deliveryFragments = fragments.filter((f) => f.deliveryId === item.deliveryId);
    const showDetails = isSelected && deliveryFragments.length > 0;
    const deliveryColor = deliveryColors.get(item.deliveryId) ?? item.contractColor;
    const isHighlighted = highlightedDeliveryId === item.deliveryId && !isSelected;
    const isMarked = markedDeliveryIds.includes(item.deliveryId);
    const isWaiting = item.state === "waiting";

    const borderColor = isSelected && !isWaiting
      ? "var(--accent)"
      : isComplete
        ? "rgba(34,211,160,0.4)"
        : isHighlighted
          ? "#facc15"
          : isMarked
            ? "rgba(56,189,248,0.6)"
            : isWaiting
              ? "var(--border)"
              : "var(--border-glow)";

    const bgColor = isSelected && !isWaiting
      ? "var(--accent-glow)"
      : isComplete
        ? "rgba(34,211,160,0.06)"
        : isHighlighted
          ? "rgba(250,204,21,0.12)"
          : isMarked
            ? "rgba(56,189,248,0.08)"
            : "#040a10";

    const scuColor = isComplete ? "var(--success)" : isWaiting ? "var(--text)" : "var(--accent)";

    return (
      <div
        key={item.deliveryId}
        style={{ marginBottom: "6px" }}
        ref={isHighlighted ? highlightedRef : undefined}
      >
        <div
          onClick={() => {
            if (isDemo || isWaiting) return;
            if (isSelected) onCancelSelection();
            else onSelectDelivery(item.deliveryId, item.contractId, item.pendingScu);
          }}
          style={{
            background: bgColor,
            borderTop: `1px solid ${borderColor}`,
            borderRight: `1px solid ${borderColor}`,
            borderBottom: `1px solid ${borderColor}`,
            borderLeft: `4px solid ${deliveryColor}`,
            borderRadius: deliveryFragments.length > 0 ? "3px 3px 0 0" : "3px",
            cursor: isWaiting ? "default" : "pointer",
            userSelect: "none",
            opacity: isWaiting ? 0.8 : 1,
            transition: "background 0.15s, border-color 0.15s",
            boxShadow: isHighlighted ? "0 0 0 1px #facc1544, 0 2px 12px rgba(250,204,21,0.15)" : "none",
          }}
        >
          <div style={{ padding: "8px 10px", paddingLeft: "10px" }}>

            {/* Header */}
            <div style={{ marginBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "3px" }}>
                <div style={{
                  width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0,
                  background: isComplete ? "var(--success)" : isWaiting ? "transparent" : deliveryColor,
                  border: isWaiting ? `1.5px solid ${deliveryColor}` : "none",
                  boxShadow: isComplete ? "0 0 5px var(--success)" : isWaiting ? "none" : `0 0 6px ${deliveryColor}`,
                }} />
                <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text)", letterSpacing: "0.03em", flex: 1 }}>
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
              <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingLeft: "14px" }}>
                {isDemo && <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--accent)", border: "1px solid var(--accent)", padding: "1px 4px", borderRadius: "2px", opacity: 0.7 }}>{t("pending.example")}</span>}
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
                  {item.contractName}
                </span>
              </div>
            </div>

            {/* Locations */}
            <div style={{ paddingLeft: "14px", display: "flex", flexDirection: "column", gap: "2px", marginBottom: "7px" }}>
              {item.pickupLocation && (
                <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--success)", flexShrink: 0 }}>↑</span>
                  <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{item.pickupLocation}</span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--accent)", flexShrink: 0 }}>↓</span>
                <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{item.destination}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "4px" }}>
              {isWaiting ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onActivateDelivery(item.deliveryId); }}
                  style={{
                    background: "rgba(34,211,160,0.08)", border: "1px solid rgba(34,211,160,0.35)",
                    color: "var(--success)", cursor: "pointer", fontSize: "11px",
                    fontFamily: "var(--font-mono)", padding: "2px 8px", borderRadius: "2px", whiteSpace: "nowrap",
                  }}
                >{t("pending.activate")}</button>
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
                    !isDemo && isComplete && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmingDeliveryId(item.deliveryId); }}
                        style={{
                          background: "rgba(34,211,160,0.1)", border: "1px solid rgba(34,211,160,0.4)",
                          color: "var(--success)", cursor: "pointer", fontSize: "11px",
                          fontFamily: "var(--font-mono)", fontWeight: 700, padding: "2px 8px", borderRadius: "2px", whiteSpace: "nowrap",
                        }}
                      >{t("pending.markDone")}</button>
                    )
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
                </>
              )}
              {!isDemo && (
                <button
                  onClick={(e) => { e.stopPropagation(); if (item.state === "loaded") onDeactivateDelivery(item.deliveryId); }}
                  disabled={item.state === "waiting"}
                  style={{
                    background: "none",
                    border: `1px solid ${item.state === "waiting" ? "var(--border)" : "rgba(224,80,80,0.3)"}`,
                    color: item.state === "waiting" ? "var(--border-glow)" : "var(--danger)",
                    cursor: item.state === "waiting" ? "default" : "pointer",
                    fontSize: "11px", fontFamily: "var(--font-mono)", padding: "2px 8px", borderRadius: "2px",
                  }}
                >{t("pending.deactivate")}</button>
              )}
            </div>
          </div>
        </div>

        {/* Fragment details (selected, loaded) */}
        {showDetails && (
          <div style={{
            background: "rgba(4,10,18,0.8)",
            border: `1px solid ${borderColor}`,
            borderTop: "none",
            borderRadius: "0 0 2px 2px",
            padding: "4px 0",
          }}>
            {deliveryFragments.map((frag) => (
              <div key={frag.id} style={{
                display: "flex", alignItems: "center",
                padding: "3px 10px 3px 18px", gap: "8px",
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--cyan)", flex: 1 }}>
                  {getBayLabel(frag.bayId)}&nbsp;·&nbsp;{frag.placedScu}&nbsp;SCU
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onRetractFragment(frag); }}
                  style={{
                    background: "none", border: "none",
                    color: "var(--text-muted)", cursor: "pointer", fontSize: "11px",
                    fontFamily: "var(--font-mono)", padding: "0 2px", flexShrink: 0,
                  }}
                >
                  {t("pending.retract")}
                </button>
              </div>
            ))}
          </div>
        )}
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
        {waitingCount > 0 && <span style={{ color: "var(--text-dim)" }}>⏳ {waitingCount} {t("pending.waiting")}</span>}
        {loadedCount > 0 && <span style={{ color: "var(--accent)" }}>↑ {loadedCount} {t("pending.loaded")}{locale === "fr" && loadedCount > 1 ? "s" : ""}</span>}
        {deliveredCount > 0 && <span style={{ color: "var(--success)" }}>✓ {deliveredCount} {t("pending.delivered")}{locale === "fr" && deliveredCount > 1 ? "s" : ""}</span>}
      </div>

      {/* Instruction contextuelle — toujours présent pour éviter les décalages */}
      {(() => {
        const hasPlaceable = sortedItems.some((i) => i.state === "loaded" && i.pendingScu > 0);
        const selValid = isSelecting && (() => {
          const sel = items.find((i) => i.deliveryId === selectedDeliveryId);
          return sel && sel.state !== "waiting" && sel.pendingScu > 0;
        })();
        const visible = hasPlaceable || !!selValid;
        const active = !!selValid;
        return (
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.06em",
            padding: "6px 8px", marginBottom: "10px", borderRadius: "3px",
            background: "var(--accent-glow)",
            border: "1px solid var(--accent-dim)",
            color: "var(--accent)",
            userSelect: "none",
            visibility: visible ? "visible" : "hidden",
            position: "relative",
          }}>
            {/* Texte long — toujours en flux pour fixer la hauteur */}
            <span style={{ opacity: active ? 0 : 1 }}>{t("pending.instructionClick")}</span>
            {/* Texte court — superposé pour ne pas changer la hauteur */}
            <span style={{ position: "absolute", inset: 0, padding: "6px 8px", opacity: active ? 1 : 0 }}>{t("pending.instructionBay")}</span>
          </div>
        );
      })()}

      {/* Chargées */}
      <div style={{ display: "flex", alignItems: "center", marginTop: "12px", marginBottom: loadedCount > 0 ? "10px" : "6px" }}>
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
      {loadedCount > 0 && sortedItems.filter((i) => i.state === "loaded").map((item) => renderItem(item))}

      <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
        <button
          onClick={onCancelSelection}
          disabled={!isSelecting}
          style={{
            flex: 1, background: "none",
            border: `1px solid ${isSelecting ? "rgba(180,200,220,0.5)" : "var(--border)"}`,
            color: isSelecting ? "var(--text)" : "var(--text-dim)",
            cursor: isSelecting ? "pointer" : "default",
            fontSize: "11px", fontFamily: "var(--font-mono)", padding: "3px 8px", borderRadius: "2px",
            opacity: isSelecting ? 1 : 0.35,
          }}
        >{t("pending.cancelSelection")}</button>
        <button
          onClick={onClearMarked}
          disabled={markedDeliveryIds.length === 0}
          style={{
            flex: 1, background: "none",
            border: `1px solid ${markedDeliveryIds.length > 0 ? "rgba(180,200,220,0.5)" : "var(--border)"}`,
            color: markedDeliveryIds.length > 0 ? "var(--text)" : "var(--text-dim)",
            cursor: markedDeliveryIds.length > 0 ? "pointer" : "default",
            fontSize: "11px", fontFamily: "var(--font-mono)", padding: "3px 8px", borderRadius: "2px",
            opacity: markedDeliveryIds.length > 0 ? 1 : 0.35,
          }}
        >{t("pending.cancelMark")}</button>
      </div>

      {/* En attente */}
      {waitingCount > 0 && (
        <>
          <div className="section-header" style={{ color: "var(--text-dim)", marginTop: "12px" }}>
            {t("pending.waitingSection")}
          </div>
          {sortedItems.filter((i) => i.state === "waiting").map((item) => renderItem(item))}
        </>
      )}

      {/* Livrées */}
      {archivedDeliveries.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <div className="section-header" style={{ color: "var(--success)" }}>{t("pending.deliveredSection")}</div>
          {archivedDeliveries.map((archived) => (
            <div key={archived.deliveryId} style={{
              marginBottom: "6px",
              background: "rgba(34,211,160,0.04)",
              borderTop: "1px solid rgba(34,211,160,0.2)",
              borderRight: "1px solid rgba(34,211,160,0.2)",
              borderBottom: "1px solid rgba(34,211,160,0.2)",
              borderLeft: `4px solid ${archived.color}`,
              borderRadius: "3px", opacity: 0.85,
            }}>
              <div style={{ padding: "8px 10px" }}>
                <div style={{ marginBottom: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "3px" }}>
                    <div style={{ width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0, background: "var(--success)", boxShadow: "0 0 5px var(--success)" }} />
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-dim)", letterSpacing: "0.03em", flex: 1 }}>
                      {archived.commodity}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--success)", fontWeight: 700, flexShrink: 0 }}>
                      ✓&nbsp;{archived.totalScu}&nbsp;SCU
                    </span>
                  </div>
                  <div style={{ paddingLeft: "14px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
                      {archived.contractName}
                    </span>
                  </div>
                </div>
                <div style={{ paddingLeft: "14px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--accent)", flexShrink: 0 }}>↓</span>
                    <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{archived.destination}</span>
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
