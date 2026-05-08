import { useMemo } from "react";
import * as THREE from "three";

export function useLabelTexture(text: string, color: string): { texture: THREE.CanvasTexture; ratio: number } {
  return useMemo(() => {
    const fontSize = 72;
    const paddingH = 10;
    const paddingV = 6;
    const canvasH = fontSize + paddingV * 2;

    const measure = document.createElement("canvas");
    const mctx = measure.getContext("2d")!;
    mctx.font = `bold ${fontSize}px Arial, sans-serif`;
    const textWidth = mctx.measureText(text).width;
    const canvasW = Math.ceil(textWidth + paddingH * 2);

    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d")!;

    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Ombre portée (effet de profondeur gravé)
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#000000";
    ctx.fillText(text, canvasW / 2 + 2, canvasH / 2 + 2);

    // Texte principal
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = color;
    ctx.fillText(text, canvasW / 2, canvasH / 2);

    const texture = new THREE.CanvasTexture(canvas);
    return { texture, ratio: canvasW / canvasH };
  }, [text, color]);
}
