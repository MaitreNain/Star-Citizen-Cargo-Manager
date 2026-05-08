import { useEffect, useRef, useState } from "react";
import type { Contract } from "../types/Contract";
import { useLanguage } from "../i18n/LanguageContext";
import type { TranslationKey } from "../i18n/translations";

type TabId = "contracts" | "placement";

type Step = {
  title: string;
  body: string;
  target?: string;
  tab?: TabId;
  interactive?: boolean;
};

type StepMeta = Omit<Step, "title" | "body">;

const STEP_META: StepMeta[] = [
  {},
  { target: "#tuto-ship", tab: "contracts" },
  { target: "#tuto-form", tab: "contracts" },
  { target: "#tuto-manual-form", tab: "contracts" },
  { target: "#tuto-list", tab: "contracts" },
  { target: "#tuto-tab-placement" },
  { target: "#tuto-deliveries", tab: "placement" },
  { target: "#tuto-deliveries", tab: "placement" },
  { target: "#tuto-scene", interactive: true },
];

export const TUTORIAL_DEMO_CONTRACT: Contract = {
  id: "__tutorial_demo__",
  name: "Contrat Démo",
  maxContainerSize: 32,
  color: "#4a9eff",
  deliveryOrder: 0,
  deliveries: [
    {
      id: "__demo_d1__",
      commodity: "Laranite",
      destination: "Lorville - Hurston",
      scu: 15,
      pickupLocation: "Port Tressler",
    },
    {
      id: "__demo_d2__",
      commodity: "Agricium",
      destination: "Area 18 - ArcCorp",
      scu: 23,
      pickupLocation: "Port Tressler",
    },
  ],
};

type Props = {
  onClose: () => void;
  onChangeTab: (tab: TabId) => void;
  onExpandContractForm?: () => void;
  onCollapseContractForm?: () => void;
  onExpandManualForm?: () => void;
};

const FADE_MS = 140;
const SETTLE_MS = 80;

type SpotRect = { top: number; left: number; width: number; height: number };

function resolveSpotRect(stepData: Step): SpotRect | null {
  if (!stepData.target) return null;
  const el = document.querySelector<HTMLElement>(stepData.target);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? { top: r.top, left: r.left, width: r.width, height: r.height } : null;
}

export default function TutorialOverlay({ onClose, onChangeTab, onExpandContractForm, onCollapseContractForm, onExpandManualForm }: Props) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [cardVisible, setCardVisible] = useState(false);
  const [spotRect, setSpotRect] = useState<SpotRect | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const STEPS: Step[] = STEP_META.map((meta, i) => ({
    ...meta,
    title: t(`tuto.step${i}.title` as TranslationKey),
    body: t(`tuto.step${i}.body` as TranslationKey),
  }));

  const current = STEPS[step];

  function clearTimer() {
    if (timerRef.current !== null) { clearTimeout(timerRef.current); timerRef.current = null; }
  }

  // Initial mount: calculate spotRect then fade in
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setSpotRect(resolveSpotRect(STEPS[0]));
      setCardVisible(true);
    }, 50);
    return () => { clearTimer(); };
  }, []);

  function navigateTo(newStep: number) {
    if (newStep === step) return;
    clearTimer();
    setCardVisible(false);

    // Phase 1 — wait for fade-out
    timerRef.current = setTimeout(() => {
      const next = STEPS[newStep];
      setStep(newStep);
      if (next.tab) onChangeTab(next.tab);
      if (newStep === 2) onExpandContractForm?.();
      if (newStep === 3) { onCollapseContractForm?.(); onExpandManualForm?.(); }

      // Phase 2 — wait for DOM to settle (tab switch, re-render, form expansion)
      timerRef.current = setTimeout(() => {
        if (next.target)
          document.querySelector(next.target)?.scrollIntoView({ behavior: "smooth", block: "center" });
        setSpotRect(resolveSpotRect(next));
        setCardVisible(true);
        timerRef.current = null;
      }, SETTLE_MS);
    }, FADE_MS);
  }

  // Resize handler — keep spotlight in sync
  useEffect(() => {
    function update() { setSpotRect(resolveSpotRect(current)); }
    window.addEventListener("resize", update);
    const sidebar = document.querySelector(".scifi-sidebar");
    sidebar?.addEventListener("scroll", update);
    return () => {
      window.removeEventListener("resize", update);
      sidebar?.removeEventListener("scroll", update);
    };
  }, [step]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && step < STEPS.length - 1) navigateTo(step + 1);
      if (e.key === "ArrowLeft" && step > 0) navigateTo(step - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, onClose]);

  const PAD = 8;
  const CARD_W = 320;
  const CARD_H_EST = 300;
  const GAP = 14;

  function cardPosition(): React.CSSProperties {
    if (!spotRect) {
      return { position: "fixed", top: "50%", left: "50%", width: CARD_W };
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
  const isCentered = !spotRect;

  const cardStyle: React.CSSProperties = {
    ...pos,
    zIndex: 9992,
    background: "linear-gradient(160deg, #0d1e2e 0%, #08111a 100%)",
    border: "1px solid var(--accent-dim)",
    borderRadius: "4px",
    padding: "18px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px var(--border)",
    opacity: cardVisible ? 1 : 0,
    transform: isCentered
      ? `translate(-50%, -50%) translateY(${cardVisible ? "0" : "8px"})`
      : `translateY(${cardVisible ? "0" : "8px"})`,
    transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
  };

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

  const isInteractive = current.interactive && !!spotRect;

  return (
    <>
      {/* Backdrop — full screen when normal, 4 panels around spotlight when interactive */}
      {isInteractive && spotRect ? (() => {
        const t = spotRect.top - PAD, l = spotRect.left - PAD;
        const r = spotRect.left + spotRect.width + PAD, b = spotRect.top + spotRect.height + PAD;
        const h = b - t;
        const p: React.CSSProperties = { position: "fixed", zIndex: 9990, background: "transparent" };
        return <>
          <div onClick={onClose} style={{ ...p, top: 0, left: 0, right: 0, height: t }} />
          <div onClick={onClose} style={{ ...p, top: b, left: 0, right: 0, bottom: 0 }} />
          <div onClick={onClose} style={{ ...p, top: t, left: 0, width: l, height: h }} />
          <div onClick={onClose} style={{ ...p, top: t, left: r, right: 0, height: h }} />
        </>;
      })() : (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9990, background: "transparent" }} />
      )}

      {/* Spotlight */}
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

      {/* Full backdrop when no spotlight target */}
      {!spotRect && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9991, background: "rgba(4,10,18,0.82)", pointerEvents: "none" }} />
      )}

      {/* Tooltip card */}
      <div onClick={(e) => e.stopPropagation()} style={cardStyle}>
        <div className="corner-tl" />
        <div className="corner-br" />

        <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--accent)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "8px" }}>
          {t("tuto.stepLabel")} {step + 1} / {STEPS.length}
        </div>

        <div style={{ fontFamily: "var(--font-ui)", fontSize: "15px", fontWeight: 700, color: "var(--text)", lineHeight: 1.3, marginBottom: "10px" }}>
          {current.title}
        </div>

        <div style={{ fontFamily: "var(--font-ui)", fontSize: "13px", color: "var(--text-dim)", lineHeight: 1.65, marginBottom: "18px", whiteSpace: "pre-line" }}>
          {current.body}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={onClose} style={{ ...btnBase, fontSize: "10px", opacity: 0.55 }}>{t("tuto.close")}</button>
          <div style={{ display: "flex", gap: "6px" }}>
            {step > 0 && (
              <button onClick={() => navigateTo(step - 1)} style={btnBase}>{t("tuto.prev")}</button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => navigateTo(step + 1)} style={btnPrimary}>{t("tuto.next")}</button>
            ) : (
              <button onClick={onClose} style={btnPrimary}>{t("tuto.finish")}</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
