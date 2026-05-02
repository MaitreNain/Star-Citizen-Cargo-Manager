import { useMemo } from "react";
import * as THREE from "three";

export function useLabelTexture(text: string, color: string): { texture: THREE.CanvasTexture; ratio: number } {
  return useMemo(() => {
    const fontSize = 26;
    const paddingH = 28;
    const paddingV = 16;
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

    ctx.fillStyle = "rgba(6,12,18,0.88)";
    ctx.roundRect(2, 2, canvasW - 4, canvasH - 4, 6);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.roundRect(2, 2, canvasW - 4, canvasH - 4, 6);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvasW / 2, canvasH / 2);

    const texture = new THREE.CanvasTexture(canvas);
    return { texture, ratio: canvasW / canvasH };
  }, [text, color]);
}
