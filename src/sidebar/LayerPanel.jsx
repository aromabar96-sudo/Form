import useStore from '../store/useStore';
import LayerAccordion from './LayerAccordion';
import RangeSlider from '../components/RangeSlider';
import ColorSwatch from '../components/ColorSwatch';
import { BLEND_MODES } from '../utils/blending';

function randomHex() {
  return `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
}

function randomInt(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

// Generic panel — renders one accordion item from a fieldConfig entry,
// reading/writing directly to the matching Zustand store slice. Randomize
// (dice button) rolls new values for every color + range field in this
// layer only — per FORM-Studio-Plan.md Phase 5 "Randomize per layer".
// `composite: true` layers additionally get an Opacity slider and Blend
// Mode picker (Phase 5 "Layer opacity" + "Layer blend modes").
export default function LayerPanel({ field }) {
  const state = useStore((s) => s[field.key]);
  const setLayer = useStore((s) => s.setLayer);

  if (!state) return null;

  const randomize = () => {
    const patch = {};
    field.colors.forEach((c) => { patch[c.key] = randomHex(); });
    field.ranges.forEach((r) => { patch[r.key] = randomInt(r.min, r.max); });
    setLayer(field.key, patch);
  };

  return (
    <LayerAccordion
      icon={field.icon}
      iconColor={field.iconColor}
      title={field.title}
      on={state.on}
      onToggle={(v) => setLayer(field.key, { on: v })}
      onRandomize={field.colors.length + field.ranges.length > 0 ? randomize : null}
    >
      {field.colors.length > 0 ? (
        <div className="ctrl">
          <div className="swatches">
            {field.colors.map((c) => (
              <ColorSwatch
                key={c.key}
                value={state[c.key]}
                onChange={(v) => setLayer(field.key, { [c.key]: v })}
              />
            ))}
          </div>
        </div>
      ) : null}
      {field.ranges.map((r) => (
        <RangeSlider
          key={r.key}
          label={r.label}
          value={state[r.key]}
          min={r.min}
          max={r.max}
          onChange={(v) => setLayer(field.key, { [r.key]: v })}
        />
      ))}
      {field.composite ? (
        <>
          <RangeSlider
            label="Opacity"
            value={state.compOpacity}
            min={0}
            max={100}
            onChange={(v) => setLayer(field.key, { compOpacity: v })}
          />
          <div className="ctrl">
            <div className="clabel"><span>Blend Mode</span></div>
            <div className="btn-row" style={{ flexWrap: 'wrap', gap: 5 }}>
              {BLEND_MODES.map((mode) => (
                <button
                  key={mode}
                  className={`bg-mode-btn${state.blendMode === mode ? ' on' : ''}`}
                  style={{ width: 'auto', textTransform: 'capitalize' }}
                  onClick={() => setLayer(field.key, { blendMode: mode })}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </LayerAccordion>
  );
}
