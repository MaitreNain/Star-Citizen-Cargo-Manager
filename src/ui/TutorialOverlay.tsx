import { useEffect, useState } from "react";

type TabId = "contracts" | "placement";

type Step = {
  title: string;
  body: string;
  target?: string;
  tab?: TabId;
};

const STEPS: Step[] = [
  {
    title: "Bienvenue dans Cargo Planner",
    body: "Ce guide rapide te présente les étapes essentielles pour planifier ton cargo dans Star Citizen. Utilise les flèches pour naviguer, ou appuie sur Échap pour fermer.",
  },
  {
    title: "① Choisir son vaisseau",
    body: "Commence par sélectionner le vaisseau que tu vas piloter. La capacité totale et la disposition des soutes seront calculées automatiquement.",
    target: "#tuto-ship",
    tab: "contracts",
  },
  {
    title: "② Créer un contrat",
    body: "Renseigne le nom du contrat et la taille max des caisses (imposée dans le jeu). Ajoute ensuite tes livraisons : ressource, quantité en SCU, lieu de chargement et destination.",
    target: "#tuto-form",
    tab: "contracts",
  },
  {
    title: "③ Gérer ses contrats",
    body: "Tes contrats apparaissent ici. Glisse-dépose les cartes pour les réordonner, clique sur le crayon pour modifier ou sur la corbeille pour supprimer.",
    target: "#tuto-list",
    tab: "contracts",
  },
  {
    title: "④ Onglet Placement",
    body: "Une fois tes contrats créés, passe à l'onglet Placement pour charger tes caisses dans les soutes.",
    target: "#tuto-tab-placement",
  },
  {
    title: "⑤ Activer & placer les livraisons",
    body: "Clique sur « Activer » pour indiquer qu'une livraison est prête à charger. Sélectionne ensuite la carte de livraison, puis clique sur une soute dans la vue 3D pour y affecter les caisses.",
    target: "#tuto-deliveries",
    tab: "placement",
  },
  {
    title: "⑥ Vue 3D — les soutes",
    body: "La vue 3D représente les soutes de ton vaisseau. Clique sur une soute pour y placer les caisses sélectionnées. Tu peux aussi déplacer les caisses par glisser-déposer et les faire pivoter avec R.",
    target: "#tuto-scene",
  },
];

type Props = {
  onClose: () => void;
  onChangeTab: (tab: TabId) => void;
};

export default function TutorialOverlay({ onClose, onChangeTab }: Props) {
  const [step, setStep] = useState(0);
  const [spotRect, setSpotRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const current = STEPS[step];

  useEffect(() => {
    setSpotRect(null);
    if (current.tab) onChangeTab(current.tab);

    const timer = setTimeout(() => {
      if (!current.target) return;
      const el = document.querySelector<HTMLElement>(current.target);
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      setSpotRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }, 80);

    function onResize() {
      if (!current.target) return;
      const el = document.querySelector<HTMLElement>(current.target);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setSpotRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }
    window.addEventListener("resize", onResize);
    return () => { clearTimeout(timer); window.removeEventListener("resize", onResize); };
  }, [step]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && step < STEPS.length - 1) setStep((s) => s + 1);
      if (e.key === "ArrowLeft" && step > 0) setStep((s) => s - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, onClose]);

  const PAD = 8;
  const CARD_W = 320;
  const CARD_H_EST = 230;
  const GAP = 14;

  function cardPosition(): React.CSSProperties {
    if (!spotRect) {
      return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: CARD_W };
    }
    const { top, left, width, height } = spotRect;
    const safeTop = (t: number) => Math.max(10, Math.min(t, window.innerHeight - CARD_H_EST - 10));

    if (left + width + GAP + CARD_W + 10 <= window.innerWidth) {
      return { position: "fixed", top: safeTop(top), left: left + width + GAP, width: CARD_W };
    }
    if (left - GAP - CARD_W >= 10) {
      return { position: "fixed", top: safeTop(top), left: left - GAP - CARD_W, width: CARD_W };
    }
    return {
      position: "fixed",
      top: top + height + GAP,
      left: Math.max(10, Math.min(left, window.innerWidth - CARD_W - 10)),
      width: CARD_W,
    };
  }

  const pos = cardPosition();

  const btnBase: React.CSSProperties = {
    background: "none",
    border: "1px solid var(--border-glow)",
    color: "var(--text-dim)",
    cursor: "pointer",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    padding: "5px 12px",
    borderRadius: "2px",
    letterSpacing: "0.06em",
  };

  const btnPrimary: React.CSSProperties = {
    background: "linear-gradient(160deg, var(--accent) 0%, #b05a18 100%)",
    border: "none",
    color: "#08111a",
    cursor: "pointer",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    fontWeight: 700,
    padding: "5px 14px",
    borderRadius: "2px",
    letterSpacing: "0.06em",
  };

  return (
    <>
      {/* Clickable backdrop — clicking it closes the overlay */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 9990, background: "transparent" }}
      />

      {/* Spotlight — box-shadow creates the darkening around the target */}
      {spotRect && (
        <div
          style={{
            position: "fixed",
            top: spotRect.top - PAD,
            left: spotRect.left - PAD,
            width: spotRect.width + PAD * 2,
            height: spotRect.height + PAD * 2,
            borderRadius: "4px",
            border: "1px solid var(--accent)",
            boxShadow: "0 0 0 9999px rgba(4,10,18,0.82), 0 0 24px var(--accent-glow-strong)",
            zIndex: 9991,
            pointerEvents: "none",
            transition: "top 0.22s ease, left 0.22s ease, width 0.22s ease, height 0.22s ease",
          }}
        />
      )}

      {/* No-target backdrop dimming */}
      {!spotRect && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9991, background: "rgba(4,10,18,0.82)", pointerEvents: "none" }} />
      )}

      {/* Tooltip card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...pos,
          zIndex: 9992,
          background: "linear-gradient(160deg, #0d1e2e 0%, #08111a 100%)",
          border: "1px solid var(--accent-dim)",
          borderRadius: "4px",
          padding: "18px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px var(--border)",
          position: pos.position as React.CSSProperties["position"],
        }}
      >
        <div className="corner-tl" />
        <div className="corner-br" />

        <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--accent)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "8px" }}>
          Étape {step + 1} / {STEPS.length}
        </div>

        <div style={{ fontFamily: "var(--font-ui)", fontSize: "15px", fontWeight: 700, color: "var(--text)", lineHeight: 1.3, marginBottom: "10px" }}>
          {current.title}
        </div>

        <div style={{ fontFamily: "var(--font-ui)", fontSize: "13px", color: "var(--text-dim)", lineHeight: 1.65, marginBottom: "18px" }}>
          {current.body}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={onClose} style={{ ...btnBase, fontSize: "10px", opacity: 0.55 }}>✕ Fermer</button>
          <div style={{ display: "flex", gap: "6px" }}>
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)} style={btnBase}>← Préc.</button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep((s) => s + 1)} style={btnPrimary}>Suivant →</button>
            ) : (
              <button onClick={onClose} style={btnPrimary}>✓ Terminer</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
