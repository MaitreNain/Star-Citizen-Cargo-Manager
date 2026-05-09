import * as THREE from "three";
import { useLabelTexture } from "./useLabelTexture";

type Vector3 = { x: number; y: number; z: number };
type CargoBay = { id: string; name: string; size: Vector3; offset: Vector3 };
type Props = { cargoBays: CargoBay[]; rearLabel?: string; frontLabel?: string };

function EndLabel({ text, x, y, z, rotY }: { text: string; x: number; y: number; z: number; rotY: number }) {
  const { texture, ratio } = useLabelTexture(text, "#38bdf8");
  const h = 0.7;
  return (
    <mesh position={[x, y, z]} rotation={[0, rotY, 0]} raycast={() => {}}>
      <planeGeometry args={[ratio * h, h]} />
      <meshBasicMaterial map={texture} transparent depthTest={false} side={THREE.FrontSide} />
    </mesh>
  );
}

export default function OrientationMarkers({ cargoBays, rearLabel = "ARRIÈRE", frontLabel = "AVANT" }: Props) {
  if (cargoBays.length === 0) return null;

  const minX = Math.min(...cargoBays.map((b) => b.offset.x));
  const maxX = Math.max(...cargoBays.map((b) => b.offset.x + b.size.x));
  const minY = Math.min(...cargoBays.map((b) => b.offset.y));
  const maxY = Math.max(...cargoBays.map((b) => b.offset.y + b.size.y));
  const floorZ = Math.min(...cargoBays.map((b) => b.offset.z));
  const ceilZ = Math.max(...cargoBays.map((b) => b.offset.z + b.size.z));

  const cx = (minX + maxX) / 2;
  const cy = (floorZ + ceilZ) / 2;

  return (
    <group>
      {/* "AVANT" : face +Z, visible depuis l'avant uniquement */}
      <EndLabel text={frontLabel} x={cx} y={cy} z={maxY + 0.04} rotY={0} />
      {/* "ARRIÈRE" : face -Z, visible depuis l'arrière uniquement */}
      <EndLabel text={rearLabel} x={cx} y={cy} z={minY - 0.04} rotY={Math.PI} />
    </group>
  );
}
