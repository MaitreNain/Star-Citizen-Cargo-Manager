import { useLanguage } from "../i18n/LanguageContext";

type Props = {
  totalPlacedScu: number;
  shipCapacityScu: number;
  maxCrateCapacity: { scu: number; count: number }[];
  totalDeliveredScu: number;
  maxCrateScu: number;
};

export default function CapacityPanel({
  totalPlacedScu,
  shipCapacityScu,
  maxCrateCapacity,
  totalDeliveredScu,
  maxCrateScu,
}: Props) {
  const { t } = useLanguage();
  const available = Math.max(0, shipCapacityScu - totalPlacedScu);
  const fillPct = Math.min(100, (totalPlacedScu / shipCapacityScu) * 100);
  const remainingPct = 100 - fillPct;
  const fillColor =
    totalPlacedScu > shipCapacityScu
      ? "var(--danger)"
      : totalPlacedScu > shipCapacityScu * 0.9
      ? "var(--accent)"
      : "var(--success)";
  const availableColor =
    available === 0
      ? "var(--danger)"
      : `hsl(${Math.round(remainingPct * 1.2)}, 75%, 58%)`;

  return (
    <div className="scifi-panel" style={{ marginBottom: "10px" }}>
      <div className="corner-tl" /><div className="corner-br" />

      <div style={{ height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden", marginBottom: "10px" }}>
        <div style={{ height: "100%", width: `${fillPct}%`, background: fillColor, borderRadius: "3px", transition: "width 0.3s" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {t("capacity.inBay")}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
          {totalPlacedScu}
          <span style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: 400 }}> / {shipCapacityScu} SCU</span>
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {t("capacity.available")}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, color: availableColor }}>
          {available} SCU
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {t("capacity.maxCrate")}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, color: "var(--accent)" }}>
          {maxCrateScu} SCU
        </span>
      </div>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", paddingTop: "2px", marginBottom: "4px" }}>
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

      <div style={{ visibility: totalDeliveredScu > 0 ? "visible" : "hidden" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)" }}>
          ✓ {totalDeliveredScu} {t("capacity.delivered")}
        </span>
      </div>

    </div>
  );
}
