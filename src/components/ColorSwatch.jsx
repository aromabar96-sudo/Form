// Cobalt Sky color swatch — matches .swatches / .swatch
export default function ColorSwatch({ value, onChange }) {
  return (
    <span className="swatch" style={{ background: value }}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    </span>
  );
}
