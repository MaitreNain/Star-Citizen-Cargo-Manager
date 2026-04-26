import { useEffect, useMemo, useRef, useState } from "react";
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
};

type Props = {
  contracts: Contract[];
  placedScuByDelivery: Map<string, number>;
  fragments: DeliveryFragment[];
  bays: { id: string; name: string }[];
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
  onRestoreDelivery: (archived: ArchivedDelivery) => void;
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
  onRestoreDelivery,
}: Props) {
  const highlightedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedDeliveryId && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [highlightedDeliveryId]);

  const items = useMemo(() => {
    const archivedIds = new Set(archivedDeliveries.map((a) => a.deliveryId));
    const result: DeliveryItem[] = [];
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
  }, [contracts, placedScuByDelivery, activatedDeliveries, archivedDeliveries]);

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

  if (items.length === 0 && archivedDeliveries.length === 0) return null;

  const isSelecting = selectedDeliveryId !== null;
  const [viderConfirm, setViderConfirm] = useState(false);
  const deliveredCount = archivedDeliveries.length;

  function getBayLabel(bayId: string): string {
    const index = bays.findIndex((b) => b.id === bayId);
    return index >= 0 ? `Soute ${index + 1}` : bayId;
  }

  function renderItem(item: DeliveryItem) {
    const isSelected = selectedDeliveryId === item.deliveryId;
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

    return (
      <div
        key={item.deliveryId}
        style={{ marginBottom: "6px" }}
        ref={isHighlighted ? highlightedRef : undefined}
      >
        {/* Carte livraison */}
        <div
          onClick={() => {
            if (isWaiting) return;
            if (isSelected) onCancelSelection();
            else onSelectDelivery(item.deliveryId, item.contractId, item.pendingScu);
          }}
          style={{
            padding: "0",
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
            overflow: "hidden",
          }}
        >
          {/* Zone principale : infos + SCU + boutons */}
          <div style={{ padding: "10px 12px" }}>

            {/* Ligne 1 : point coloré + ressource + SCU */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <div style={{
                width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0,
                background: isComplete ? "var(--success)" : isWaiting ? "transparent" : deliveryColor,
                border: isWaiting ? `1.5px solid ${deliveryColor}` : "none",
                boxShadow: isComplete ? "0 0 5px var(--success)" : isWaiting ? "none" : `0 0 6px ${deliveryColor}`,
              }} />
              <span style={{
                flex: 1, minWidth: 0,
                fontSize: "13px", fontWeight: 700, color: "var(--text)",
                letterSpacing: "0.03em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {item.commodity}
              </span>
              <span style={{
                fontFamily: "var(--font-mono)", flexShrink: 0,
                fontSize: isComplete ? "12px" : "13px",
                fontWeight: 700,
                color: isComplete ? "var(--success)" : isWaiting ? "var(--text)" : "var(--accent)",
              }}>
                {isComplete ? "✓ " : ""}{item.pendingScu > 0 ? item.pendingScu : item.totalScu}
                <span style={{ fontSize: "10px", fontWeight: 400, marginLeft: "2px" }}>
                  {item.pendingScu < item.totalScu && item.pendingScu > 0 ? `/ ${item.totalScu} ` : ""}SCU
                </span>
              </span>
              {isHighlighted && <span style={{ color: "#facc15", fontSize: "13px", flexShrink: 0 }}>◀</span>}
            </div>

            {/* Ligne 2 : contrat */}
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "11px",
              color: "var(--text-muted)", marginBottom: "5px", paddingLeft: "15px",
              letterSpacing: "0.04em",
            }}>
              {item.contractName}
            </div>

            {/* Lignes 3-4 : chargement et livraison — pleine largeur */}
            <div style={{ paddingLeft: "15px", display: "flex", flexDirection: "column", gap: "3px", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--success)", flexShrink: 0 }}>↑</span>
                <span style={{ fontSize: "12px", color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.pickupLocation}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent)", flexShrink: 0 }}>↓</span>
                <span style={{ fontSize: "12px", color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.destination}
                </span>
              </div>
            </div>

            {/* Ligne 5 : boutons alignés à droite */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "4px" }}>
              {isWaiting ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onActivateDelivery(item.deliveryId); }}
                  style={{
                    background: "rgba(34,211,160,0.08)", border: "1px solid rgba(34,211,160,0.35)",
                    color: "var(--success)", cursor: "pointer", fontSize: "11px",
                    fontFamily: "var(--font-mono)", padding: "3px 8px", borderRadius: "2px", whiteSpace: "nowrap",
                  }}
                >Activer</button>
              ) : (
                <>
                  {isComplete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onArchiveDelivery(item.deliveryId); }}
                      style={{
                        background: "rgba(34,211,160,0.1)", border: "1px solid rgba(34,211,160,0.4)",
                        color: "var(--success)", cursor: "pointer", fontSize: "11px",
                        fontFamily: "var(--font-mono)", fontWeight: 700, padding: "3px 8px", borderRadius: "2px", whiteSpace: "nowrap",
                      }}
                    >✓ Livré</button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onMarkDelivery(item.deliveryId); }}
                    style={{
                      background: isMarked ? "rgba(56,189,248,0.15)" : "none",
                      border: `1px solid ${isMarked ? "rgba(56,189,248,0.5)" : "var(--border-glow)"}`,
                      color: isMarked ? "var(--cyan)" : "var(--text-muted)",
                      cursor: "pointer", fontSize: "11px", padding: "3px 8px", borderRadius: "2px",
                    }}
                  >{isMarked ? "◉ Marqué" : "◎ Marquer"}</button>
                </>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); if (item.state === "loaded") onDeactivateDelivery(item.deliveryId); }}
                disabled={item.state === "waiting"}
                style={{
                  background: "none",
                  border: `1px solid ${item.state === "waiting" ? "var(--border)" : "rgba(224,80,80,0.3)"}`,
                  color: item.state === "waiting" ? "var(--border-glow)" : "var(--danger)",
                  cursor: item.state === "waiting" ? "default" : "pointer",
                  fontSize: "12px", padding: "3px 8px", borderRadius: "2px",
                }}
              >↩ Annuler</button>
            </div>
          </div>
        </div>

        {/* Détail des fragments (état loaded, sélectionné) */}
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
                padding: "4px 10px 4px 18px", gap: "8px",
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--cyan)", flexShrink: 0 }}>
                  {getBayLabel(frag.bayId)}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-dim)", flex: 1 }}>
                  {frag.placedScu} SCU
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onRetractFragment(frag); }}
                  style={{
                    background: "none", border: "1px solid rgba(224,80,80,0.25)",
                    color: "var(--danger)", cursor: "pointer", fontSize: "11px",
                    fontFamily: "var(--font-mono)", padding: "1px 6px",
                    borderRadius: "2px", flexShrink: 0,
                  }}
                >
                  ↩ Retirer
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

      <div className="section-header">Livraisons</div>

      {/* Résumé */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px", fontFamily: "var(--font-mono)", fontSize: "11px", flexWrap: "wrap" }}>
        {waitingCount > 0 && <span style={{ color: "var(--text-dim)" }}>⏳ {waitingCount} en attente</span>}
        {loadedCount > 0 && <span style={{ color: "var(--accent)" }}>↑ {loadedCount} chargée{loadedCount > 1 ? "s" : ""}</span>}
        {deliveredCount > 0 && <span style={{ color: "var(--success)" }}>✓ {deliveredCount} livrée{deliveredCount > 1 ? "s" : ""}</span>}
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
            <span style={{ opacity: active ? 0 : 1 }}>▶ Cliquez sur une livraison pour la placer dans la soute</span>
            {/* Texte court — superposé pour ne pas changer la hauteur */}
            <span style={{ position: "absolute", inset: 0, padding: "6px 8px", opacity: active ? 1 : 0 }}>▶ Cliquez sur une soute dans la vue 3D</span>
          </div>
        );
      })()}

      {/* Chargées */}
      <div style={{ display: "flex", alignItems: "center", marginTop: "12px", marginBottom: loadedCount > 0 ? "10px" : "6px" }}>
        <div className="section-header" style={{ color: "var(--accent)", marginBottom: 0, flex: 1 }}>En soute</div>
        {viderConfirm ? (
          <>
            <button onClick={() => { onClearPlacement(); setViderConfirm(false); }} style={{
              background: "none", border: "1px solid rgba(224,80,80,0.35)",
              color: "var(--danger)", cursor: "pointer",
              fontSize: "11px", fontFamily: "var(--font-mono)", padding: "1px 8px", borderRadius: "2px", marginRight: "4px",
            }}>✓ Confirmer</button>
            <button onClick={() => setViderConfirm(false)} style={{
              background: "none", border: "1px solid var(--border-glow)",
              color: "var(--text-muted)", cursor: "pointer",
              fontSize: "11px", fontFamily: "var(--font-mono)", padding: "1px 8px", borderRadius: "2px",
            }}>✕ Annuler</button>
          </>
        ) : (
          <button onClick={() => setViderConfirm(true)} style={{
            background: "none", border: "1px solid rgba(224,80,80,0.35)",
            color: "var(--danger)", cursor: "pointer",
            fontSize: "11px", fontFamily: "var(--font-mono)", padding: "1px 8px", borderRadius: "2px",
          }}>✕ Vider la soute</button>
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
        >✕ Annuler sélection</button>
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
        >✕ Annuler marquage</button>
      </div>

      {/* En attente */}
      {waitingCount > 0 && (
        <>
          <div className="section-header" style={{ color: "var(--text-dim)", marginTop: "12px" }}>
            En attente
          </div>
          {sortedItems.filter((i) => i.state === "waiting").map((item) => renderItem(item))}
        </>
      )}

      {/* Livrées */}
      {archivedDeliveries.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <div className="section-header" style={{ color: "var(--success)" }}>Livrées</div>
          {archivedDeliveries.map((archived) => (
            <div key={archived.deliveryId} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 10px 8px 14px", marginBottom: "6px",
              background: "rgba(34,211,160,0.04)",
              borderTop: "1px solid rgba(34,211,160,0.2)",
              borderRight: "1px solid rgba(34,211,160,0.2)",
              borderBottom: "1px solid rgba(34,211,160,0.2)",
              borderLeft: `4px solid ${archived.color}`,
              borderRadius: "2px", opacity: 0.8,
            }}>
              <div style={{ width: "12px", flexShrink: 0, color: "var(--success)", fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-ui)", textAlign: "center" }}>✓</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {archived.commodity}
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)", marginLeft: "6px", fontWeight: 400 }}>
                    {archived.contractName}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px", display: "flex", gap: "5px", alignItems: "baseline" }}>
                  <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: "10px" }}>↓</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{archived.destination}</span>
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--success)", fontWeight: 700, flexShrink: 0, marginRight: "4px" }}>
                ✓ {archived.totalScu} SCU
              </div>
              <button
                onClick={() => onRestoreDelivery(archived)}
                title="Annuler la livraison"
                style={{
                  background: "none", border: "1px solid rgba(224,80,80,0.3)",
                  color: "var(--danger)", cursor: "pointer", fontSize: "12px",
                  padding: "3px 6px", borderRadius: "2px", flexShrink: 0,
                }}
              >
                ↩
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
