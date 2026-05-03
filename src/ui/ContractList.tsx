import { useState, useMemo } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import type { Contract } from "../types/Contract";
import type { DeliveryFragment } from "../types/DeliveryFragment";

type Props = {
  contracts: Contract[];
  bays: { id: string; name: string }[];
  fragments: DeliveryFragment[];
  archivedDeliveryIds: Set<string>;
  shipCapacityScu: number;
  onDelete: (id: string) => void;
  onEdit: (contract: Contract) => void;
  onReorder: (reordered: Contract[]) => void;
  onRetractFragment: (fragment: DeliveryFragment) => void;
  demoContract?: Contract;
};


export default function ContractList({
  contracts,
  bays,
  fragments,
  archivedDeliveryIds,
  shipCapacityScu,
  onDelete,
  onEdit,
  onReorder,
  onRetractFragment,
  demoContract,
}: Props) {
  const { t } = useLanguage();
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
    return index >= 0 ? `${t("contractList.bay")} ${index + 1}` : bayId;
  }

  function moveContract(from: number, to: number) {
    const reordered = [...contracts];
    const [item] = reordered.splice(from, 1);
    reordered.splice(to, 0, item);
    onReorder(reordered.map((c, i) => ({ ...c, deliveryOrder: i + 1 })));
  }

  if (contracts.length === 0 && !demoContract) return null;

  const allContracts = demoContract ? [demoContract, ...contracts] : contracts;

  return (
    <div className="scifi-panel" style={{ marginBottom: "10px" }}>
      <div className="corner-tl" />
      <div className="corner-br" />
      <div className="section-header">{t("contractList.title")}</div>

      {allContracts.map((contract, index) => {
        const isDemo = contract.id === "__tutorial_demo__";
        const { totalScu } = contractStats.get(contract.id) ?? { totalScu: 0 };
        const isOverflow = totalScu > shipCapacityScu;

        return (
          <div
            key={contract.id}
            draggable={!isDemo}
            onDragStart={() => { if (!isDemo) setDragIndex(index); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (!isDemo && dragIndex !== null && dragIndex !== index) moveContract(dragIndex, index);
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
              <div style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "4px" }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "1px", background: contract.color, boxShadow: `0 0 6px ${contract.color}`, flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text)", letterSpacing: "0.03em" }}>
                    {contract.name}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingLeft: "14px" }}>
                  {isDemo && <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--accent)", border: "1px solid var(--accent)", padding: "1px 4px", borderRadius: "2px", opacity: 0.7 }}>EXEMPLE</span>}
                  {isOverflow && <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--danger)", border: "1px solid var(--danger)", padding: "1px 4px", borderRadius: "2px" }}>{t("contractList.overflow")}</span>}
                  <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                    max&nbsp;{contract.maxContainerSize}&nbsp;SCU
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--cyan)" }}>
                    {totalScu}&nbsp;SCU
                  </span>
                </div>
              </div>

              {/* Livraisons */}
              <div style={{ marginBottom: "8px", display: "flex", flexDirection: "column", gap: "3px" }}>
                {contract.deliveries.map((delivery) => {
                  const deliveryFragments = fragmentsByDelivery.get(delivery.id) ?? [];
                  const placed = deliveryFragments.reduce((sum, f) => sum + f.placedScu, 0);
                  const remaining = delivery.scu - placed;
                  const isArchived = archivedDeliveryIds.has(delivery.id);

                  return (
                    <div key={delivery.id}>
                      <div style={{
                        padding: "4px 8px",
                        background: isArchived ? "rgba(34,211,160,0.07)" : "#040a10",
                        border: `1px solid ${isArchived ? "rgba(34,211,160,0.25)" : "var(--border)"}`,
                        borderRadius: "2px",
                      }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                          <span style={{ fontSize: "11px", color: isArchived ? "var(--success)" : "var(--text-dim)", flexShrink: 0 }}>
                            {isArchived ? "✓" : "◦"}
                          </span>
                          <span style={{ fontSize: "12px", color: isArchived ? "var(--success)" : "var(--text)" }}>
                            {delivery.destination}
                          </span>
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: isArchived ? "rgba(34,211,160,0.5)" : "var(--text-muted)", paddingLeft: "17px", marginTop: "1px" }}>
                          {delivery.commodity}&nbsp;·&nbsp;{delivery.scu}&nbsp;SCU
                        </div>
                      </div>

                      {deliveryFragments.map((frag) => (
                        <div key={frag.id} style={{
                          display: "flex", alignItems: "center", gap: "6px",
                          padding: "2px 8px 2px 20px",
                          borderLeft: "1px solid var(--border)",
                          borderRight: "1px solid var(--border)",
                          borderBottom: "1px solid var(--border)",
                        }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--cyan)", flex: 1 }}>
                            {getBayLabel(frag.bayId)}&nbsp;·&nbsp;{frag.placedScu}&nbsp;SCU
                          </span>
                          <button
                            onClick={() => onRetractFragment(frag)}
                            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "11px", fontFamily: "var(--font-mono)", padding: "0 2px" }}
                          >
                            {t("contractList.retract")}
                          </button>
                        </div>
                      ))}

                      {remaining > 0 && placed > 0 && (
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--danger)", padding: "2px 8px 2px 20px", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
                          ⚠ {remaining} {t("contractList.remaining")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              {!isDemo && (
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                  <button onClick={() => onEdit(contract)} style={{ background: "none", border: "1px solid var(--border-glow)", color: "var(--text-muted)", cursor: "pointer", fontSize: "11px", fontFamily: "var(--font-mono)", padding: "3px 10px", borderRadius: "2px" }}>
                    {t("contractList.edit")}
                  </button>
                  <button onClick={() => onDelete(contract.id)} style={{ background: "none", border: "1px solid rgba(224,80,80,0.25)", color: "var(--danger)", cursor: "pointer", fontSize: "11px", fontFamily: "var(--font-mono)", padding: "3px 10px", borderRadius: "2px" }}>
                    {t("contractList.delete")}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
