import { useEffect, useMemo, useRef } from "react";
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
  focusedDeliveryId: string | null;
  onFocusDelivery: (id: string) => void;
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
  focusedDeliveryId,
  onFocusDelivery,
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
    const isFocused = focusedDeliveryId === item.deliveryId;
    const isWaiting = item.state === "waiting";

    const borderColor = isSelected && !isWaiting
      ? "var(--accent)"
      : isComplete
        ? "rgba(34,211,160,0.4)"
        : isHighlighted
          ? "#facc15"
          : isFocused
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
          : isFocused
            ? "rgba(56,189,248,0.08)"
            : "#040a10";

    return (
      <div
        key={item.deliveryId}
        style={{ marginBottom: "6px" }}
        ref={isHighlighted ? highlightedRef : undefined}
      >
        {/* Ligne principale */}
        <div
          onClick={() => {
            if (isWaiting) return;
            if (isSelected) onCancelSelection();
            else onSelectDelivery(item.deliveryId, item.contractId, item.pendingScu);
          }}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 10px",
            background: bgColor,
            borderTop: `1px solid ${borderColor}`,
            borderRight: `1px solid ${borderColor}`,
            borderBottom: `1px solid ${borderColor}`,
            borderLeft: `4px solid ${deliveryColor}`,
            borderRadius: isSelected || showDetails ? "2px 2px 0 0" : "2px",
            cursor: isWaiting ? "default" : "pointer",
            userSelect: "none",
            opacity: isWaiting ? 0.8 : 1,
            transition: "background 0.15s, border-color 0.15s",
            boxShadow: isHighlighted ? "0 0 0 1px #facc1544, 0 2px 12px rgba(250,204,21,0.15)" : "none",
          }}
        >
        {/* Point couleur */}
          <div style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: isComplete ? "var(--success)" : isWaiting ? "transparent" : deliveryColor,
            border: isWaiting ? `1.5px solid ${deliveryColor}` : "none",
            boxShadow: isComplete ? "0 0 5px var(--success)" : isWaiting ? "none" : `0 0 5px ${deliveryColor}`,
            flexShrink: 0,
            alignSelf: "flex-start",
            marginTop: "4px",
          }} />

          {/* Infos — colonne gauche */}
          <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
            <div style={{
              fontSize: "13px", fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "0.03em",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {item.commodity}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginLeft: "6px", fontWeight: 400 }}>
                {item.contractName}
              </span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", marginTop: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ display: "flex", gap: "4px", alignItems: "center", minWidth: 0 }}>
                <span style={{ color: "var(--success)", flexShrink: 0 }}>↑</span>
                <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>Chgt :</span>
                <span style={{ color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.pickupLocation}</span>
              </div>
              <div style={{ display: "flex", gap: "4px", alignItems: "center", minWidth: 0 }}>
                <span style={{ color: "var(--accent)", flexShrink: 0 }}>↓</span>
                <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>Livr :</span>
                <span style={{ color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.destination}</span>
              </div>
            </div>
          </div>

          {/* Colonne droite : SCU + boutons */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
            {/* SCU */}
            <div style={{ textAlign: "right" }}>
              {isComplete ? (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--success)", fontWeight: 700 }}>
                  ✓ {item.totalScu} SCU
                </div>
              ) : (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: isWaiting ? "var(--text)" : "var(--accent)", fontWeight: 700 }}>
                  {item.pendingScu > 0 ? item.pendingScu : item.totalScu} SCU
                  {item.pendingScu < item.totalScu && item.pendingScu > 0 && (
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "3px" }}>/ {item.totalScu}</span>
                  )}
                </div>
              )}
            </div>

            {/* Boutons action + retour */}
            <div style={{ display: "flex", gap: "4px" }}>
              {isWaiting ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onActivateDelivery(item.deliveryId); }}
                  style={{
                    background: "rgba(34,211,160,0.08)", border: "1px solid rgba(34,211,160,0.35)",
                    color: "var(--success)", cursor: "pointer", fontSize: "10px",
                    fontFamily: "var(--font-mono)", padding: "2px 6px", borderRadius: "2px", whiteSpace: "nowrap",
                  }}
                >↑ Chargé</button>
              ) : (
                <>
                  {isComplete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onArchiveDelivery(item.deliveryId); }}
                      style={{
                        background: "rgba(34,211,160,0.1)", border: "1px solid rgba(34,211,160,0.4)",
                        color: "var(--success)", cursor: "pointer", fontSize: "10px",
                        fontFamily: "var(--font-mono)", fontWeight: 700, padding: "2px 6px", borderRadius: "2px", whiteSpace: "nowrap",
                      }}
                    >↓ Livré</button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onFocusDelivery(item.deliveryId); }}
                    style={{
                      background: isFocused ? "rgba(56,189,248,0.15)" : "none",
                      border: `1px solid ${isFocused ? "rgba(56,189,248,0.5)" : "var(--border-glow)"}`,
                      color: isFocused ? "var(--cyan)" : "var(--text-muted)",
                      cursor: "pointer", fontSize: "11px", padding: "2px 6px", borderRadius: "2px",
                    }}
                  >{isFocused ? "◉" : "◎"}</button>
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
                  fontSize: "12px", padding: "2px 6px", borderRadius: "2px",
                }}
              >↩</button>
            </div>
          </div>

          {isHighlighted && <div style={{ color: "#facc15", fontSize: "14px", flexShrink: 0, alignSelf: "flex-start" }}>◀</div>}
        </div>

        {/* Détail des fragments (état loaded, sélectionné) */}
        {showDetails && deliveryFragments.length > 0 && (
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

      {/* Instruction contextuelle */}
      {(() => {
        if (isSelecting) {
          const sel = items.find((i) => i.deliveryId === selectedDeliveryId);
          if (!sel || sel.state === "waiting" || sel.pendingScu <= 0) return null;
          return (
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.06em",
              padding: "6px 8px", marginBottom: "10px", borderRadius: "3px",
              background: "var(--accent-glow)", border: "1px solid var(--accent-dim)",
              color: "var(--accent)", userSelect: "none",
            }}>
              Cliquez sur une soute dans la vue 3D
            </div>
          );
        }
        const hasPlaceable = sortedItems.some((i) => i.state === "loaded" && i.pendingScu > 0);
        if (!hasPlaceable) return null;
        return (
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.06em",
            padding: "6px 8px", marginBottom: "10px", borderRadius: "3px",
            background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-glow)",
            color: "var(--text-dim)", userSelect: "none",
          }}>
            Cliquez sur une livraison pour la placer dans la soute
          </div>
        );
      })()}

      {/* Chargées */}
      {loadedCount > 0 && (
        <>
          <div className="section-header" style={{ color: "var(--accent)" }}>En soute</div>
          {sortedItems.filter((i) => i.state === "loaded").map((item) => renderItem(item))}
        </>
      )}

      {/* En attente */}
      {waitingCount > 0 && (
        <>
          <div className="section-header" style={{ color: "var(--text-dim)", marginTop: loadedCount > 0 ? "12px" : "0" }}>
            En attente
          </div>
          {sortedItems.filter((i) => i.state === "waiting").map((item) => renderItem(item))}
        </>
      )}

      {isSelecting && (
        <button onClick={onCancelSelection} className="btn-secondary" style={{ width: "100%", fontSize: "12px", marginTop: "4px" }}>
          ✕ Annuler la sélection
        </button>
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
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginLeft: "6px", fontWeight: 400 }}>
                    {archived.contractName}
                  </span>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  ↓ {archived.destination}
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
