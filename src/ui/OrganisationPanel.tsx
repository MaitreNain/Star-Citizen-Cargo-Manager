import type { SortMode } from "../engine/sortCrates";

type Props = {
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  canUndo: boolean;
  onUndo: () => void;
  onOrganize: () => void;
  resetConfirm: boolean;
  onRequestReset: () => void;
  onCancelReset: () => void;
  onConfirmReset: () => void;
};

export default function OrganisationPanel({
  sortMode,
  onSortModeChange,
  canUndo,
  onUndo,
  onOrganize,
  resetConfirm,
  onRequestReset,
  onCancelReset,
  onConfirmReset,
}: Props) {
  return (
    <div className="scifi-panel" style={{ marginBottom: "10px" }}>
      <div className="corner-tl" /><div className="corner-br" />
      <div className="section-header">Organisation</div>
      <label className="scifi-label">Mode</label>
      <select
        value={sortMode}
        onChange={(e) => onSortModeChange(e.target.value as SortMode)}
        className="scifi-input"
        style={{ marginBottom: "10px" }}
      >
        <option value="destination">Par destination</option>
        <option value="contract">Par contrat</option>
        <option value="size">Par taille de caisse</option>
      </select>
      <button onClick={onOrganize} className="btn-primary" style={{ width: "100%", marginBottom: "8px" }}>
        ⟳ Réorganiser
      </button>
      <div style={{ display: "flex", gap: "6px" }}>
        <button onClick={onUndo} disabled={!canUndo} className="btn-secondary" style={{ flex: 1 }}>
          ↩ Annuler
        </button>
        {resetConfirm ? (
          <>
            <button onClick={onConfirmReset} className="btn-danger" style={{ flex: 1, fontSize: "12px" }}>Confirmer</button>
            <button onClick={onCancelReset} className="btn-secondary" style={{ flex: 1, fontSize: "12px" }}>✕</button>
          </>
        ) : (
          <button onClick={onRequestReset} className="btn-secondary" style={{ flex: 1 }}>✕ Vider</button>
        )}
      </div>
      {resetConfirm && (
        <div style={{ marginTop: "8px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--danger)", textAlign: "center" }}>
          Les caisses seront retirées des soutes.
        </div>
      )}
    </div>
  );
}
