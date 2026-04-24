import { useMemo } from "react";
import * as THREE from "three";

type Vector3 = { x: number; y: number; z: number };
type CargoBay = { id: string; name: string; size: Vector3; offset: Vector3 };
type Props = { cargoBays: CargoBay[] };

const FONT_SIZE = 26;
const PADDING_H = 28; // padding horizontal total
const PADDING_V = 16; // padding vertical total
const CANVAS_H = FONT_SIZE + PADDING_V * 2; // hauteur fixe

/**
 * Crée une texture canvas dont la largeur s'adapte au texte.
 * Retourne la texture + le ratio largeur/hauteur pour dimensionner le sprite.
 */
function useMarkerTexture(text: string): { texture: THREE.CanvasTexture; ratio: number } {
  return useMemo(() => {
    // Mesure la largeur du texte sur un canvas temporaire
    const measure = document.createElement("canvas");
    const mctx = measure.getContext("2d")!;
    mctx.font = `600 ${FONT_SIZE}px Arial, sans-serif`;
    const textWidth = mctx.measureText(text).width;

    const canvasW = Math.ceil(textWidth + PADDING_H * 2);
    const canvasH = CANVAS_H;

    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d")!;

    // Fond
    ctx.fillStyle = "rgba(6,12,18,0.85)";
    ctx.roundRect(2, 2, canvasW - 4, canvasH - 4, 6);
    ctx.fill();

    // Bordure
    ctx.strokeStyle = "rgba(56,189,248,0.65)";
    ctx.lineWidth = 2;
    ctx.roundRect(2, 2, canvasW - 4, canvasH - 4, 6);
    ctx.stroke();

    // Texte
    ctx.fillStyle = "#c8e8ff";
    ctx.font = `600 ${FONT_SIZE}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvasW / 2, canvasH / 2);

    const texture = new THREE.CanvasTexture(canvas);
    return { texture, ratio: canvasW / canvasH };
  }, [text]);
}

export default function OrientationMarkers({ cargoBays }: Props) {
  if (cargoBays.length === 0) return null;

  const minX = Math.min(...cargoBays.map((b) => b.offset.x));
  const maxX = Math.max(...cargoBays.map((b) => b.offset.x + b.size.x));
  const minY = Math.min(...cargoBays.map((b) => b.offset.y));
  const maxY = Math.max(...cargoBays.map((b) => b.offset.y + b.size.y));
  const markerY = Math.min(...cargoBays.map((b) => b.offset.z)) + 0.02;

  const centerX = (minX + maxX) / 2;
  const rearZ = minY - 0.5;
  const frontZ = maxY + 0.5;

  const arrowGeo = useMemo(() => {
    const pts = [
      centerX, markerY, rearZ + 0.15,
      centerX, markerY, frontZ - 0.15,
      centerX, markerY, frontZ - 0.15,
      centerX - 0.2, markerY, frontZ - 0.4,
      centerX, markerY, frontZ - 0.15,
      centerX + 0.2, markerY, frontZ - 0.4,
    ];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, [centerX, markerY, rearZ, frontZ]);

  const spriteH = 0.5; // hauteur fixe des sprites en unités monde

  const rear = useMarkerTexture("RAMPE / ARRIÈRE");
  const front = useMarkerTexture("AVANT");

  return (
    <group>
      <lineSegments geometry={arrowGeo}>
        <lineBasicMaterial color="#4a6880" />
      </lineSegments>

      <sprite
        position={[centerX, markerY + 0.35, rearZ]}
        scale={[rear.ratio * spriteH, spriteH, 1]}
      >
        <spriteMaterial map={rear.texture} transparent depthTest={false} />
      </sprite>

      <sprite
        position={[centerX, markerY + 0.35, frontZ]}
        scale={[front.ratio * spriteH, spriteH, 1]}
      >
        <spriteMaterial map={front.texture} transparent depthTest={false} />
      </sprite>
    </group>
  );
}
