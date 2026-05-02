import { useState, Fragment } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import type { Contract } from "../types/Contract";
import SearchableSelect from "./SearchableSelect";
import { DESTINATION_OPTIONS } from "../data/contractOptions";

const SCU_SIZES = [1, 2, 4, 8, 16, 24, 32];

const COLOR_PALETTE = [
  "#e07828", "#38bdf8", "#22d3a0", "#a78bfa", "#f472b6",
  "#facc15", "#fb923c", "#34d399", "#60a5fa", "#f87171", "#c084fc", "#4ade80",
];

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

type CrateRow = { id: string; count: number; sizeScu: number };

type Props = {
  onAdd: (contract: Contract) => void;
  contractsCount: number;
};

export default function ManualCargoForm({ onAdd, contractsCount }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [commodity, setCommodity] = useState("");
  const [rows, setRows] = useState<CrateRow[]>([{ id: genId(), count: 1, sizeScu: 0 }]);

  const { t } = useLanguage();
  const totalScu = rows.reduce((sum, r) => sum + Math.max(0, r.count) * r.sizeScu, 0);
  const canSubmit = name.trim().length > 0 && destination.trim().length > 0 && totalScu > 0;

  function addRow() {
    setRows((prev) => [...prev, { id: genId(), count: 1, sizeScu: 0 }]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRow(id: string, key: "count" | "sizeScu", value: number) {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [key]: value } : r));
  }

  function handleSubmit() {
    if (!canSubmit) return;
    const contractId = genId();
    const deliveryId = genId();
    const color = COLOR_PALETTE[contractsCount % COLOR_PALETTE.length];
    const validRows = rows.filter((r) => r.count > 0 && r.sizeScu > 0);
    const finalName = name.trim();

    const contract: Contract = {
      id: contractId,
      name: finalName,
      color,
      maxContainerSize: Math.max(...validRows.map((r) => r.sizeScu)),
      deliveryOrder: 0,
      deliveries: [{
        id: deliveryId,
        commodity: commodity.trim() || "Cargo",
        destination: destination.trim(),
        pickupLocation: pickupLocation.trim(),
        scu: totalScu,
        explicitCrates: validRows.map((r) => ({ sizeScu: r.sizeScu, count: r.count })),
      }],
    };

    onAdd(contract);
    setName("");
    setDestination("");
    setPickupLocation("");
    setCommodity("");
    setRows([{ id: genId(), count: 1, sizeScu: 0 }]);
  }

  return (
    <div
      className="scifi-panel"
      style={{ marginBottom: "10px", cursor: "pointer" }}
      onClick={() => setOpen((o) => !o)}
    >
      <div className="corner-tl" />
      <div className="corner-br" />

      <div
        className="section-header"
        style={{ marginBottom: open ? "14px" : 0, userSelect: "none" }}
      >
        {t("manualForm.title")}
        <span className="toggle-arrow" style={{ fontSize: "12px", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
          {open ? "▲" : "▼"}
        </span>
      </div>

      {open && (
        <div onClick={(e) => e.stopPropagation()} style={{ cursor: "default" }}>
          {/* Nom */}
          <div style={{ marginBottom: "8px" }}>
            <label className="scifi-label">{t("manualForm.name")}</label>
            <input
              className="scifi-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("manualForm.namePlaceholder")}
            />
          </div>

          <div style={{ marginBottom: "2px" }}>
            <SearchableSelect
              label={t("manualForm.pickupLocation")}
              placeholder={t("manualForm.pickupPlaceholder")}
              value={pickupLocation}
              options={DESTINATION_OPTIONS}
              onChange={setPickupLocation}
            />
          </div>

          <div style={{ marginBottom: "4px" }}>
            <SearchableSelect
              label={t("manualForm.destination")}
              placeholder={t("manualForm.destinationPlaceholder")}
              value={destination}
              options={DESTINATION_OPTIONS}
              onChange={setDestination}
            />
          </div>

          {/* Caisses */}
          <div style={{ border: "1px solid var(--border-glow)", borderRadius: "2px", marginBottom: "10px", overflow: "hidden" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 10px", background: "rgba(30,74,110,0.2)", borderBottom: "1px solid var(--border-glow)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.12em", color: "var(--text-dim)", textTransform: "uppercase" }}>{t("manualForm.crates")}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, color: totalScu > 0 ? "var(--accent)" : "var(--text-muted)" }}>
                {totalScu > 0 ? `${totalScu} SCU` : "—"}
              </span>
            </div>

            <div style={{ padding: "8px 10px 4px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto", gap: "4px 8px", alignItems: "center" }}>

                <label className="scifi-label" style={{ margin: 0 }}>{t("manualForm.quantity")}</label>
                <span />
                <label className="scifi-label" style={{ margin: 0 }}>{t("manualForm.size")}</label>
                <span />

                {rows.map((row) => (
                  <Fragment key={row.id}>
                    <div style={{ display: "flex", alignItems: "stretch", border: "1px solid var(--border-glow)", borderRadius: "2px", overflow: "hidden" }}>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={row.count}
                        onChange={(e) => updateRow(row.id, "count", Math.max(1, parseInt(e.target.value) || 1))}
                        style={{
                          flex: 1, width: 0, textAlign: "center", border: "none", outline: "none",
                          fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-bright)",
                          background: "rgba(0,0,0,0.3)", padding: "7px 4px",
                          MozAppearance: "textfield",
                        } as React.CSSProperties}
                      />
                      <div style={{ display: "flex", flexDirection: "column", borderLeft: "1px solid var(--border-glow)" }}>
                        <button
                          onClick={() => updateRow(row.id, "count", Math.min(99, row.count + 1))}
                          style={{ background: "none", border: "none", borderBottom: "1px solid var(--border-glow)", color: "var(--text-dim)", cursor: "pointer", padding: "0 6px", flex: 1, fontSize: "8px", lineHeight: 1 }}
                        >▲</button>
                        <button
                          onClick={() => updateRow(row.id, "count", Math.max(1, row.count - 1))}
                          style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", padding: "0 6px", flex: 1, fontSize: "8px", lineHeight: 1 }}
                        >▼</button>
                      </div>
                    </div>

                    <span style={{ color: "var(--text-dim)", fontSize: "30px", lineHeight: 1, textAlign: "center" }}>×</span>

                    <select
                      value={row.sizeScu}
                      onChange={(e) => updateRow(row.id, "sizeScu", parseInt(e.target.value))}
                      className="scifi-input"
                    >
                      <option value={0} disabled>{t("manualForm.choosePlaceholder")}</option>
                      {SCU_SIZES.map((s) => (
                        <option key={s} value={s}>{s} SCU</option>
                      ))}
                    </select>

                    <button
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length <= 1}
                      style={{
                        background: "none", border: "none",
                        color: "var(--danger)", cursor: "pointer",
                        fontSize: "14px", padding: "2px 4px",
                        visibility: rows.length > 1 ? "visible" : "hidden",
                        opacity: 0.8,
                      }}
                    >✕</button>
                  </Fragment>
                ))}
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border-glow)", padding: "6px 10px" }}>
              <button
                onClick={addRow}
                style={{
                  background: "none", border: "1px solid var(--border-glow)",
                  color: "var(--text-dim)", cursor: "pointer",
                  fontSize: "11px", fontFamily: "var(--font-mono)", padding: "3px 10px", borderRadius: "2px",
                }}
              >{t("manualForm.addRow")}</button>
            </div>

          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="btn-primary"
            style={{ width: "100%" }}
          >
            {t("manualForm.submit")}
          </button>
        </div>
      )}
    </div>
  );
}
