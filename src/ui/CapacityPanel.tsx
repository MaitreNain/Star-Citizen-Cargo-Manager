type Props = {
  totalPlacedScu: number;
  shipCapacityScu: number;
  maxCrateCapacity: { scu: number; count: number }[];
  totalDeliveredScu: number;
  pendingCount: number;
  onNavigateToPlacement: () => void;
};

export default function CapacityPanel({
  totalPlacedScu,
  shipCapacityScu,
  maxCrateCapacity,
  totalDeliveredScu,
  pendingCount,
  onNavigateToPlacement,
}: Props) {
  const available = Math.max(0, shipCapacityScu - totalPlacedScu);
  const fillPct = Math.min(100, (totalPlacedScu / shipCapacityScu) * 100);
  const fillColor =
    totalPlacedScu > shipCapacityScu
      ? "var(--danger)"
      : totalPlacedScu > shipCapacityScu * 0.9
      ? "var(--accent)"
      : "var(--success)";

  return (
    <div className="scifi-panel" style={{ marginBottom: "10px" }}>
      <div className="corner-tl" /><div className="corner-br" />

      <div style={{ height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden", marginBottom: "10px" }}>
        <div style={{ height: "100%", width: `${fillPct}%`, background: fillColor, borderRadius: "3px", transition: "width 0.3s" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Disponible
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700, color: available <= 0 ? "var(--danger)" : "var(--text)" }}>
          {available}
          <span style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: 400 }}> / {shipCapacityScu} SCU</span>
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          En soute
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-dim)" }}>
          {totalPlacedScu} SCU
        </span>
      </div>

      <div style={{
        display: "flex", gap: "6px", flexWrap: "wrap",
        marginBottom: totalDeliveredScu > 0 ? "6px" : "0",
        paddingTop: "2px",
      }}>
        {maxCrateCapacity.map(({ scu, count }) => (
          <div key={scu} style={{
            display: "flex", alignItems: "center", gap: "4px",
            background: "rgba(56,189,248,0.06)",
            border: "1px solid var(--cyan-dim)",
            borderRadius: "3px",
            padding: "2px 7px",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
          }}>
            <span style={{ color: "var(--text-dim)" }}>{count}×</span>
            <span style={{ color: "var(--cyan)" }}>{scu} SCU</span>
          </div>
        ))}
      </div>

      {totalDeliveredScu > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            ✓ Livrés
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--success)" }}>
            {totalDeliveredScu} SCU
          </span>
        </div>
      )}

      {pendingCount > 0 && (
        <div style={{ marginTop: "8px", borderTop: "1px solid var(--border)", paddingTop: "6px", textAlign: "right" }}>
          <span
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent)", cursor: "pointer" }}
            onClick={onNavigateToPlacement}
          >
            {pendingCount} en attente →
          </span>
        </div>
      )}
    </div>
  );
}
