import { ships } from "../data/ships";

type Props = {
  value: string;
  onChange: (shipId: string) => void;
};

export default function ShipSelector({ value, onChange }: Props) {
  return (
    <div className="scifi-panel" style={{ marginBottom: "10px" }}>
      <div className="corner-tl" />
      <div className="corner-br" />

      <div className="section-header">Vaisseau actif</div>

      <label className="scifi-label">Sélection</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="scifi-input"
      >
        {ships.map((ship) => (
          <option key={ship.id} value={ship.id}>
            {ship.name}
          </option>
        ))}
      </select>
    </div>
  );
}
