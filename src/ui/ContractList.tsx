import { useState, useMemo } from "react";
import type { Contract } from "../types/Contract";
import type { DeliveryFragment } from "../types/DeliveryFragment";

type Props = {
  contracts: Contract[];
  bays: { id: string; name: string }[];
  fragments: DeliveryFragment[];
  onDelete: (id: string) => void;
  onEdit: (contract: Contract) => void;
  onReorder: (reordered: Contract[]) => void;
  onRetractFragment: (fragment: DeliveryFragment) => void;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {label}
      </div>
      <div style={{ fontSize: "13px", color: "var(--text)", fontWeight: 600 }}>
        {value}
      </div>
    </div>
  );
}

export default function ContractList({
  contracts,
  bays,
  fragments,
  onDelete,
  onEdit,
  onReorder,
  onRetractFragment,
}: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const fragmentsByDelivery = useMemo(() => {
    const map = new Map<string, DeliveryFragment[]>();
    for (const frag of fragments) {
      const list = map.get(frag.deliveryId);
      if (list) list.push(frag);
      else map.set(frag.deliveryId, [frag]);
    }
    return map;
  }, [fragments]);

  const contractStats = useMemo(() => {
    const map = new Map<string, { totalScu: number; placedScu: number }>();
    for (const contract of contracts) {
      const totalScu = contract.deliveries.reduce((s, d) => s + d.scu, 0);
      const placedScu = contract.deliveries.reduce((s, d) => {
        const frags = fragmentsByDelivery.get(d.id) ?? [];
        return s + frags.reduce((fs, f) => fs + f.placedScu, 0);
      }, 0);
      map.set(contract.id, { totalScu, placedScu });
    }
    return map;
  }, [contracts, fragmentsByDelivery]);

  function getBayLabel(bayId: string): string {
    const index = bays.findIndex((b) => b.id === bayId);
    return index >= 0 ? `Soute ${index + 1}` : bayId;
  }

  function moveContract(from: number, to: number) {
    const reordered = [...contracts];
    const [item] = reordered.splice(from, 1);
    reordered.splice(to, 0, item);
    onReorder(reordered.map((c, i) => ({ ...c, deliveryOrder: i + 1 })));
  }

  if (contracts.length === 0) return null;

  return (
    <div className="scifi-panel" style={{ marginBottom: "10px" }}>
      <div className="corner-tl" />
      <div className="corner-br" />
      <div className="section-header">Contrats</div>

      {contracts.map((contract, index) => {
        const { totalScu, placedScu } = contractStats.get(contract.id) ?? { totalScu: 0, placedScu: 0 };
        const hasFragments = contract.deliveries.some((d) => (fragmentsByDelivery.get(d.id)?.length ?? 0) > 0);
        const isOverflow = placedScu < totalScu && hasFragments;

        return (
          <div
            key={contract.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null && dragIndex !== index) moveContract(dragIndex, index);
              setDragIndex(null);
            }}
            onDragEnd={() => setDragIndex(null)}
            className="contract-card"
            style={{ opacity: dragIndex === index ? 0.5 : 1 }}
          >
            {/* Barre couleur gauche */}
            <div style={{
              position: "absolute", top: 0, left: 0, bottom: 0,
              width: "3px", background: contract.color,
              boxShadow: `0 0 8px ${contract.color}80`,
            }} />

            <div style={{ paddingLeft: "10px" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <div style={{
                  width: "8px", height: "8px",
                  background: contract.color,
                  boxShadow: `0 0 6px ${contract.color}`,
                  flexShrink: 0,
                }} />
                <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--text)", letterSpacing: "0.04em" }}>
                  {contract.name}
                </span>
                {isOverflow && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--danger)", border: "1px solid var(--danger)", padding: "1px 5px", borderRadius: "2px" }}>
                    ⚠ DÉBORDEMENT
                  </span>
                )}
                <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--cyan)" }}>
                  {totalScu} SCU
                </span>
              </div>

              {/* Meta */}
              <div style={{ display: "flex", gap: "16px", marginBottom: "10px" }}>
                <Stat label="Max caisse" value={`${contract.maxContainerSize} SCU`} />
              </div>

              {/* Destinations */}
              <div style={{ marginBottom: "10px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>
                  Destinations
                </div>
                {contract.deliveries.map((delivery) => {
                  const deliveryFragments = fragmentsByDelivery.get(delivery.id) ?? [];
                  const placed = deliveryFragments.reduce((sum, f) => sum + f.placedScu, 0);
                  const remaining = delivery.scu - placed;

                  return (
                    <div key={delivery.id} style={{ marginBottom: "4px" }}>
                      {/* Ligne livraison */}
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        padding: "5px 8px",
                        background: "#040a10",
                        border: "1px solid var(--border)",
                        fontSize: "13px",
                      }}>
                        <span style={{ color: "var(--text)" }}>{delivery.destination}</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-dim)" }}>
                          {delivery.commodity} · {delivery.scu} SCU
                        </span>
                      </div>

                      {/* Fragments */}
                      {deliveryFragments.map((frag) => (
                        <div key={frag.id} style={{
                          display: "flex", alignItems: "center", gap: "8px",
                          padding: "3px 8px 3px 16px",
                          background: "rgba(4,10,18,0.6)",
                          borderLeft: "1px solid var(--border)",
                          borderRight: "1px solid var(--border)",
                          borderBottom: "1px solid var(--border)",
                        }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--cyan)", flex: 1 }}>
                            {getBayLabel(frag.bayId)} · {frag.placedScu} SCU
                          </span>
                          <button
                            onClick={() => onRetractFragment(frag)}
                            style={{
                              background: "none", border: "1px solid rgba(224,80,80,0.25)",
                              color: "var(--danger)", cursor: "pointer", fontSize: "10px",
                              fontFamily: "var(--font-mono)", padding: "1px 5px", borderRadius: "2px",
                            }}
                          >
                            ↩ Retirer
                          </button>
                        </div>
                      ))}

                      {remaining > 0 && placed > 0 && (
                        <div style={{
                          fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--danger)",
                          padding: "3px 8px",
                          borderLeft: "1px solid var(--border)",
                          borderRight: "1px solid var(--border)",
                          borderBottom: "1px solid var(--border)",
                        }}>
                          ⚠ {remaining} SCU restants à placer
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => onEdit(contract)} className="btn-secondary" style={{ flex: 1, fontSize: "12px", padding: "8px" }}>
                  Modifier
                </button>
                <button onClick={() => onDelete(contract.id)} className="btn-danger" style={{ flex: 1, fontSize: "12px", padding: "8px" }}>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
