import { useEffect, useState, memo } from "react";
import { useLanguage } from "../i18n/LanguageContext";

// Inject Google Fonts once
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap";
if (!document.head.querySelector("[data-scifi-fonts]")) {
  fontLink.setAttribute("data-scifi-fonts", "1");
  document.head.appendChild(fontLink);
}

const style = document.createElement("style");
style.textContent = `
  :root {
    --bg: #060c12;
    --panel: #08111a;
    --panel-alt: #0a1622;
    --border: #0f2236;
    --border-glow: #163348;
    --accent: #e07828;
    --accent-dim: #6b3a10;
    --accent-glow: rgba(224,120,40,0.13);
    --accent-glow-strong: rgba(224,120,40,0.22);
    --cyan: #38bdf8;
    --cyan-dim: #0a3248;
    --cyan-glow: rgba(56,189,248,0.10);
    --text: #bdd0e2;
    --text-dim: #8ab4cc;
    --text-muted: #5c82a0;
    --danger: #e05050;
    --danger-glow: rgba(224,80,80,0.12);
    --success: #22d3a0;
    --font-ui: 'Rajdhani', sans-serif;
    --font-mono: 'Share Tech Mono', monospace;
    --radius: 3px;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-ui);
    font-size: 14px;
  }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-glow); border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--accent-dim); }

  select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23e07828'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px !important;
    cursor: pointer;
  }

  .scifi-sidebar {
    position: relative;
    border-right: 1px solid var(--border-glow);
    box-shadow: inset -1px 0 0 var(--border), 4px 0 24px rgba(0,0,0,0.5);
  }

  .scifi-sidebar::before {
    content: '';
    position: absolute;
    top: 0; left: 0; bottom: 0;
    width: 2px;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      var(--accent) 15%,
      var(--accent-dim) 60%,
      transparent 100%
    );
    opacity: 0.6;
    pointer-events: none;
    z-index: 2;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 14px;
  }
  .section-header::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, var(--accent-dim) 0%, transparent 80%);
    opacity: 0.7;
  }
  .section-header .toggle-arrow {
    order: 1;
  }

  .scifi-input {
    width: 100%;
    background: rgba(4, 10, 18, 0.9);
    color: var(--text);
    border: 1px solid var(--border-glow);
    border-radius: var(--radius);
    padding: 9px 12px;
    font-family: var(--font-ui);
    font-size: 14px;
    font-weight: 500;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .scifi-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-glow);
  }

  .scifi-label {
    display: block;
    font-family: var(--font-mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.11em;
    color: var(--text-dim);
    margin-bottom: 5px;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px 16px;
    background: linear-gradient(160deg, var(--accent) 0%, #b05a18 100%);
    color: #08111a;
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    box-shadow: 0 2px 12px var(--accent-glow-strong), inset 0 1px 0 rgba(255,255,255,0.1);
    transition: filter 0.18s, box-shadow 0.18s;
  }
  .btn-primary:hover { filter: brightness(1.1); }
  .btn-primary:active { filter: brightness(0.92); }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px 16px;
    background: rgba(255,255,255,0.03);
    color: var(--text-dim);
    border: 1px solid var(--border-glow);
    border-radius: var(--radius);
    cursor: pointer;
    font-family: var(--font-ui);
    font-weight: 600;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    transition: border-color 0.18s, color 0.18s, background 0.18s;
  }
  .btn-secondary:hover:not(:disabled) {
    border-color: var(--accent-dim);
    color: var(--text);
    background: var(--accent-glow);
  }
  .btn-secondary:active:not(:disabled) { background: rgba(255,255,255,0.06); }
  .btn-secondary:disabled { opacity: 0.3; cursor: default; }

  .btn-danger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px 16px;
    background: var(--danger-glow);
    color: var(--danger);
    border: 1px solid rgba(224,80,80,0.35);
    border-radius: var(--radius);
    cursor: pointer;
    font-family: var(--font-ui);
    font-weight: 600;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    transition: background 0.18s, border-color 0.18s;
  }
  .btn-danger:hover:not(:disabled) {
    background: rgba(224,80,80,0.2);
    border-color: var(--danger);
  }
  .btn-danger:disabled {
    color: var(--text-muted);
    border-color: var(--border);
    background: transparent;
    opacity: 0.4;
    cursor: default;
  }

  .btn-cyan {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px 16px;
    background: var(--cyan-glow);
    color: var(--cyan);
    border: 1px solid var(--cyan-dim);
    border-radius: var(--radius);
    cursor: pointer;
    font-family: var(--font-ui);
    font-weight: 600;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    transition: background 0.18s, border-color 0.18s;
  }
  .btn-cyan:hover { border-color: var(--cyan); background: rgba(56,189,248,0.15); }
  .btn-cyan.inactive {
    color: var(--text-muted);
    border-color: var(--border);
    background: transparent;
  }
  .btn-cyan.inactive:hover {
    color: var(--text-dim);
    border-color: var(--border-glow);
    background: rgba(255,255,255,0.02);
  }

  .scifi-panel {
    background: linear-gradient(160deg, var(--panel-alt) 0%, var(--panel) 100%);
    border: 1px solid var(--border-glow);
    border-radius: 4px;
    position: relative;
    padding: 16px;
    margin-bottom: 10px;
    box-shadow: 0 1px 0 0 var(--accent-dim) inset, 0 4px 16px rgba(0,0,0,0.3);
  }

  .corner-tl {
    position: absolute;
    top: -1px; left: -1px;
    width: 8px; height: 8px;
    border-top: 1px solid var(--accent);
    border-left: 1px solid var(--accent);
    border-radius: 3px 0 0 0;
  }
  .corner-br {
    position: absolute;
    bottom: -1px; right: -1px;
    width: 8px; height: 8px;
    border-bottom: 1px solid var(--border-glow);
    border-right: 1px solid var(--border-glow);
    border-radius: 0 0 3px 0;
  }

  .delivery-row {
    background: rgba(4,10,18,0.7);
    border: 1px solid var(--border-glow);
    border-left: 2px solid var(--accent-dim);
    border-radius: var(--radius);
    padding: 10px 12px;
    margin-bottom: 8px;
  }

  .contract-card {
    background: linear-gradient(150deg, var(--panel-alt) 0%, var(--panel) 100%);
    border: 1px solid var(--border-glow);
    border-radius: 4px;
    padding: 12px 12px 12px 16px;
    margin-bottom: 8px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .contract-card:hover {
    border-color: var(--border-glow);
    box-shadow: 0 2px 16px rgba(0,0,0,0.25);
  }

  .load-step {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 6px 0;
    border-bottom: 1px solid rgba(15,34,54,0.8);
  }
  .load-step:last-child { border-bottom: none; }
  .load-step-num {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--accent);
    min-width: 20px;
    flex-shrink: 0;
    padding-top: 2px;
  }

  /* ── Tabs ── */
  .tab-bar {
    display: flex;
    border-bottom: 1px solid var(--border-glow);
    margin-bottom: 14px;
    gap: 2px;
  }
  .tab-btn {
    flex: 1;
    padding: 8px 4px;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-dim);
    transition: color 0.15s, border-color 0.15s;
    position: relative;
  }
  .tab-btn:hover { color: var(--text); }
  .tab-btn.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }
  .tab-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    background: var(--accent);
    color: #08111a;
    border-radius: 8px;
    font-size: 9px;
    font-weight: 700;
    padding: 0 4px;
    margin-left: 5px;
    vertical-align: middle;
  }

  /* HUD top bar */
  .hud-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 0 12px;
    border-bottom: 1px solid var(--border-glow);
    margin-bottom: 12px;
  }
  .hud-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 5px var(--accent), 0 0 10px var(--accent-glow);
    flex-shrink: 0;
    animation: hud-pulse 2.4s ease-in-out infinite;
  }
  @keyframes hud-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.45; }
  }
  .hud-title {
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--text);
  }
  .hud-status {
    margin-left: auto;
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.08em;
    color: var(--success);
    opacity: 0.7;
  }
`;
if (!document.head.querySelector("[data-scifi-styles]")) {
  style.setAttribute("data-scifi-styles", "1");
  document.head.appendChild(style);
}

export type TabId = "contracts" | "placement";


const SESSION_KEY = "cargo-planner-session-start";

function getSessionStart(): number {
  if (!sessionStorage.getItem(SESSION_KEY)) {
    sessionStorage.setItem(SESSION_KEY, Date.now().toString());
  }
  return parseInt(sessionStorage.getItem(SESSION_KEY)!);
}

function formatElapsed(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}m${String(s).padStart(2, "0")}s`;
  if (m > 0) return `${m}m${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

const SessionTimer = memo(function SessionTimer() {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - getSessionStart()) / 1000)
  );
  useEffect(() => {
    const start = getSessionStart();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.06em" }}>
      {formatElapsed(elapsed)}
    </span>
  );
});

type Props = {
  // Contenu fixe (toujours visible en haut)
  header: React.ReactNode;
  // Contenu par onglet
  contractsTab: React.ReactNode;
  placementTab: React.ReactNode;
  // Badges
  pendingCount?: number;
  // Onglet actif contrôlé de l'extérieur (optionnel)
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  // Vue 3D
  content: React.ReactNode;
  // Tutoriel
  onStartTutorial?: () => void;
};

export default function AppLayout({
  header,
  contractsTab,
  placementTab,
  pendingCount = 0,
  activeTab: controlledTab,
  onTabChange,
  content,
  onStartTutorial,
}: Props) {
  const { locale, setLocale, t } = useLanguage();
  const [isNarrow, setIsNarrow] = useState(window.innerWidth < 1100);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1100);
  const [internalTab, setInternalTab] = useState<TabId>("contracts");

  const activeTab = controlledTab ?? internalTab;
  function setTab(tab: TabId) {
    setInternalTab(tab);
    onTabChange?.(tab);
  }

  useEffect(() => {
    function handleResize() {
      const narrow = window.innerWidth < 1100;
      setIsNarrow(narrow);
      if (!narrow) setSidebarOpen(true);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidebarContent = (
    <>
      {/* HUD */}
      <div className="hud-bar">
        <div className="hud-dot" />
        <span className="hud-title">Cargo Manager</span>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <SessionTimer />
          <span className="hud-status">{t("hud.status")}</span>
          <button
            onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
            style={{
              background: "none", border: "1px solid var(--border-glow)",
              color: "var(--text-dim)", cursor: "pointer",
              fontFamily: "var(--font-mono)", fontSize: "9px",
              padding: "2px 6px", borderRadius: "2px", letterSpacing: "0.08em",
            }}
          >{locale === "fr" ? "EN" : "FR"}</button>
        </span>
      </div>

      {/* Bouton tutoriel */}
      {onStartTutorial && (
        <button
          onClick={onStartTutorial}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
            marginBottom: "12px",
            padding: "8px 12px",
            background: "rgba(56,189,248,0.07)",
            border: "1px solid var(--cyan)",
            borderRadius: "3px",
            color: "var(--cyan)",
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            boxShadow: "0 0 12px rgba(56,189,248,0.15), inset 0 0 12px rgba(56,189,248,0.04)",
          }}
        >
          <span style={{ fontSize: "13px" }}>▶</span>
          {t("hud.tutorial")}
        </button>
      )}

      {/* Header fixe (vaisseau + SCU) */}
      {header}

      {/* Onglets */}
      <div className="tab-bar">
        <button
          className={`tab-btn${activeTab === "contracts" ? " active" : ""}`}
          onClick={() => setTab("contracts")}
        >
          {t("tab.contracts")}
        </button>
        <button
          id="tuto-tab-placement"
          className={`tab-btn${activeTab === "placement" ? " active" : ""}`}
          onClick={() => setTab("placement")}
        >
          {t("tab.placement")}
          {pendingCount > 0 && (
            <span className="tab-badge">{pendingCount}</span>
          )}
        </button>
      </div>

      {/* Contenu de l'onglet actif */}
      <div style={{ display: activeTab === "contracts" ? "block" : "none" }}>
        {contractsTab}
      </div>
      <div style={{ display: activeTab === "placement" ? "block" : "none" }}>
        {placementTab}
      </div>
    </>
  );

  const sidebarStyles: React.CSSProperties = {
    background: "linear-gradient(180deg, #09131e 0%, var(--bg) 100%)",
    padding: "16px 14px",
    overflowY: "auto",
    position: "relative",
  };

  if (isNarrow) {
    return (
      <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "var(--bg)", position: "relative" }}>
        <div id="tuto-scene" style={{ width: "100%", height: "100%" }}>{content}</div>

        <button
          onClick={() => setSidebarOpen((p) => !p)}
          className="btn-secondary"
          style={{ position: "absolute", top: 12, left: 12, zIndex: 40, padding: "7px 12px" }}
        >
          {sidebarOpen ? "✕" : "☰"}
        </button>

        {sidebarOpen && (
          <>
            <div
              onClick={() => setSidebarOpen(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 30 }}
            />
            <div
              className="scifi-sidebar"
              style={{
                ...sidebarStyles,
                position: "absolute", top: 0, left: 0, bottom: 0,
                width: "min(360px, 88vw)",
                zIndex: 35,
                paddingTop: "52px",
              }}
            >
              {sidebarContent}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden", background: "var(--bg)", fontFamily: "var(--font-ui)" }}>
      <div
        className="scifi-sidebar"
        style={{ ...sidebarStyles, flex: "0 0 350px", minWidth: 300, maxWidth: 370 }}
      >
        {sidebarContent}
      </div>

      <div id="tuto-scene" style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
        {content}
      </div>
    </div>
  );
}
