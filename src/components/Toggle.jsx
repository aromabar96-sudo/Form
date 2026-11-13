// Cobalt Sky toggle switch — matches .sw / .sw-track / .sw-track:before in cobalt-sky.css
export default function Toggle({ checked, onChange }) {
  return (
    <label className="sw" onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="sw-track" />
    </label>
  );
}
