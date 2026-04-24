import React, { useEffect, useRef, useState } from "react";
import type { Contract, ContractDelivery } from "../types/Contract";
import SearchableSelect from "./SearchableSelect";
import { DESTINATION_OPTIONS, COMMODITY_OPTIONS } from "../data/contractOptions";

type Props = {
  onAdd: (contract: Contract) => void;
  onUpdate: (contract: Contract) => void;
  contracts: Contract[];
  editingContract: Contract | null;
  onCancelEdit: () => void;
};

const ALLOWED_CONTAINER_SIZES = [1, 2, 4, 8, 16, 24, 32];

const CONTRACT_COLORS = [
  "#ef4444","#f97316","#f59e0b","#eab308","#84cc16","#22c55e",
  "#10b981","#06b6d4","#3b82f6","#6366f1","#8b5cf6","#d946ef","#ec4899",
];

function getNextContractColor(usedColors: string[]) {
  const free = CONTRACT_COLORS.find((c) => !usedColors.includes(c));
  if (free) return free;
  return `hsl(${Math.floor(Math.random() * 360)}, 70%, 55%)`;
}

function createEmptyDelivery(): ContractDelivery {
  return { id: crypto.randomUUID(), commodity: "", destination: "", scu: 0, pickupLocation: "" };
}

export default function ContractForm({ onAdd, onUpdate, contracts, editingContract, onCancelEdit }: Props) {
  const [name, setName] = useState("");
  const [maxSize, setMaxSize] = useState<number | "">("")
  const [deliveries, setDeliveries] = useState<ContractDelivery[]>([createEmptyDelivery()]);

  // Ref vers le premier champ quantité — pour le focus automatique
  const firstScuRef = useRef<HTMLInputElement>(null);
  // Refs vers les SearchableSelect pour la navigation TAB
  const commodityRefs = useRef<React.RefObject<HTMLInputElement | null>[]>([]);
  const destinationRefs = useRef<React.RefObject<HTMLInputElement | null>[]>([]);

  useEffect(() => {
    if (editingContract) {
      setName(editingContract.name);
      setMaxSize(editingContract.maxContainerSize);
      setDeliveries(editingContract.deliveries.length > 0 ? editingContract.deliveries : [createEmptyDelivery()]);
    } else {
      resetForm();
    }
  }, [editingContract]);

  // S'assure qu'on a assez de refs pour chaque livraison
  useEffect(() => {
    commodityRefs.current = deliveries.map((_, i) =>
      commodityRefs.current[i] ?? { current: null }
    );
    destinationRefs.current = deliveries.map((_, i) =>
      destinationRefs.current[i] ?? { current: null }
    );
  }, [deliveries.length]);

  function resetForm() {
    setName("");
    setMaxSize("");
    setDeliveries([createEmptyDelivery()]);
  }

  function focusFirstScu() {
    setTimeout(() => firstScuRef.current?.focus(), 50);
  }

  function updateDelivery(id: string, updates: Partial<ContractDelivery>) {
    setDeliveries((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  }

  function addDeliveryRow() {
    setDeliveries((prev) => [...prev, createEmptyDelivery()]);
    // Focus la quantité de la nouvelle livraison après render
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>(".scu-input");
      inputs[inputs.length - 1]?.focus();
    }, 50);
  }

  function removeDeliveryRow(id: string) {
    setDeliveries((prev) => (prev.length === 1 ? prev : prev.filter((d) => d.id !== id)));
  }

  function submit() {
    if (maxSize === "") return;

    const cleaned = deliveries
      .map((d) => ({ ...d, commodity: d.commodity.trim(), destination: d.destination.trim(), scu: Number(d.scu), pickupLocation: (d.pickupLocation ?? "").trim() }))
      .filter((d) => d.commodity && d.destination && d.scu > 0 && d.pickupLocation);

    if (cleaned.length === 0) return;

    const finalName = name.trim() || `Contrat #${contracts.length + 1}`;

    if (editingContract) {
      onUpdate({ ...editingContract, name: finalName, maxContainerSize: Number(maxSize), deliveries: cleaned });
      return;
    }

    const color = getNextContractColor(contracts.map((c) => c.color));
    onAdd({
      id: crypto.randomUUID(),
      name: finalName,
      maxContainerSize: Number(maxSize),
      color,
      deliveryOrder: 0,
      deliveries: cleaned,
    });
    resetForm();
    // Focus automatique sur la quantité du prochain contrat
    focusFirstScu();
  }

  return (
    <div className="scifi-panel">
      <div className="corner-tl" />
      <div className="corner-br" />

      <div className="section-header">
        {editingContract ? "Modifier contrat" : "Nouveau contrat"}
      </div>

      {/* Nom */}
      <div style={{ marginBottom: "12px" }}>
        <label className="scifi-label">Nom du contrat</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Contrat #${contracts.length + 1}`}
          className="scifi-input"
        />
      </div>

      {/* Taille max */}
      <div style={{ marginBottom: "14px" }}>
        <label className="scifi-label">Taille max des caisses</label>
        <select
          value={maxSize}
          onChange={(e) => setMaxSize(e.target.value === "" ? "" : Number(e.target.value))}
          className="scifi-input"
        >
          <option value="">— Choisir —</option>
          {ALLOWED_CONTAINER_SIZES.map((size) => (
            <option key={size} value={size}>{size} SCU</option>
          ))}
        </select>
      </div>

      {/* Livraisons */}
      <div style={{ marginBottom: "8px" }}>
        <label className="scifi-label">Livraisons</label>

        {deliveries.map((delivery, index) => {
          const isFirst = index === 0;

          // Refs pour TAB : scu → commodity → destination → scu suivant
          const commodityRef = (commodityRefs.current[index] ??= React.createRef<HTMLInputElement>());
          const destinationRef = (destinationRefs.current[index] ??= React.createRef<HTMLInputElement>());
          const nextScuSelector = `.scu-input-${index + 1}`;

          return (
            <div key={delivery.id} className="delivery-row">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.1em" }}>
                  LIVRAISON_{String(index + 1).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => removeDeliveryRow(delivery.id)}
                  disabled={deliveries.length === 1}
                  style={{
                    background: "none", border: "none",
                    cursor: deliveries.length === 1 ? "default" : "pointer",
                    color: deliveries.length === 1 ? "var(--text-muted)" : "var(--danger)",
                    fontSize: "16px", lineHeight: 1, padding: "0 2px",
                  }}
                >✕</button>
              </div>

              {/* 1. Quantité SCU */}
              <div style={{ marginBottom: "10px" }}>
                <label className="scifi-label">Quantité (SCU)</label>
                <input
                  ref={isFirst ? firstScuRef : undefined}
                  type="number"
                  min={1}
                  step={1}
                  value={delivery.scu === 0 ? "" : delivery.scu}
                  placeholder="0"
                  onChange={(e) => updateDelivery(delivery.id, { scu: e.target.value === "" ? 0 : Number(e.target.value) })}
                  className={`scifi-input scu-input scu-input-${index}`}
                  onKeyDown={(e) => {
                    if (e.key === "Tab") {
                      e.preventDefault();
                      commodityRef.current?.focus();
                    }
                  }}
                />
              </div>

              {/* 2. Ressource */}
              <SearchableSelect
                label="Ressource"
                placeholder="Tape quelques lettres..."
                value={delivery.commodity}
                options={COMMODITY_OPTIONS}
                onChange={(value) => updateDelivery(delivery.id, { commodity: value })}
                inputRef={commodityRef as React.RefObject<HTMLInputElement>}
                onTabNext={() => destinationRef.current?.focus()}
              />

              {/* 3. Destination */}
              <SearchableSelect
                label="Destination"
                placeholder="Tape quelques lettres..."
                value={delivery.destination}
                options={DESTINATION_OPTIONS}
                onChange={(value) => updateDelivery(delivery.id, { destination: value })}
                inputRef={destinationRef as React.RefObject<HTMLInputElement>}
                onTabNext={
                  index < deliveries.length - 1
                    ? () => {
                        const nextScu = document.querySelector<HTMLInputElement>(nextScuSelector);
                        nextScu?.focus();
                      }
                    : undefined
                }
              />

              {/* 4. Lieu de chargement (obligatoire) */}
              <div style={{ marginBottom: "6px" }}>
                <label className="scifi-label">Lieu de chargement</label>
                <SearchableSelect
                  placeholder="Où charger cette livraison..."
                  value={delivery.pickupLocation ?? ""}
                  options={DESTINATION_OPTIONS}
                  onChange={(value) => updateDelivery(delivery.id, { pickupLocation: value })}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button type="button" onClick={addDeliveryRow} className="btn-secondary" style={{ width: "100%", marginBottom: "12px" }}>
        + Ajouter une livraison
      </button>

      <div style={{ display: "flex", gap: "8px" }}>
        <button type="button" onClick={submit} className="btn-primary" style={{ flex: 1 }}>
          {editingContract ? "Enregistrer" : "Ajouter"}
        </button>
        {editingContract && (
          <button type="button" onClick={() => { onCancelEdit(); resetForm(); }} className="btn-secondary" style={{ flex: 1 }}>
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
