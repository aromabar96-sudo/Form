import { SlidersHorizontal } from 'lucide-react';
import useStore from '../store/useStore';
import RangeSlider from '../components/RangeSlider';
import ColorSwatch from '../components/ColorSwatch';
import LayerAccordion from './LayerAccordion';

const BG_MODES = ['none', 'solid', 'gradient'];
const DIRECTIONS = [
  { value: 'to bottom', label: '↓' },
  { value: 'to top', label: '↑' },
  { value: 'to right', label: '→' },
  { value: 'to left', label: '←' },
];

// Scene panel — Background mode/color/direction + Camera Drift/FOV. Ported
// from the legacy "Background & Camera" section (previously missing from
// this rewrite — scene.drift/scene.fov existed in the store but nothing
// consumed them, and bg was never rendered at all).
export default function ScenePanel() {
  const scene = useStore((s) => s.scene);
  const bg = useStore((s) => s.bg);
  const setLayer = useStore((s) => s.setLayer);

  return (
    <LayerAccordion
      icon={SlidersHorizontal}
      iconColor="#38bdf8"
      title="Background & Camera"
      hideToggle
      defaultOpen
    >
      <div className="ctrl">
        <div className="clabel"><span>Background</span></div>
        <div className="btn-row">
          {BG_MODES.map((mode) => (
            <button
              key={mode}
              className={`bg-mode-btn${bg.mode === mode ? ' on' : ''}`}
              style={{ textTransform: 'capitalize' }}
              onClick={() => setLayer('bg', { mode })}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {bg.mode === 'solid' ? (
        <div className="ctrl">
          <div className="swatches">
            <ColorSwatch value={bg.solid} onChange={(v) => setLayer('bg', { solid: v })} />
          </div>
        </div>
      ) : null}

      {bg.mode === 'gradient' ? (
        <>
          <div className="ctrl">
            <div className="swatches">
              <ColorSwatch value={bg.g1} onChange={(v) => setLayer('bg', { g1: v })} />
              <ColorSwatch value={bg.g2} onChange={(v) => setLayer('bg', { g2: v })} />
            </div>
          </div>
          <div className="ctrl">
            <div className="clabel"><span>Direction</span></div>
            <div className="btn-row">
              {DIRECTIONS.map((d) => (
                <button
                  key={d.value}
                  className={`dir-btn${bg.dir === d.value ? ' on' : ''}`}
                  onClick={() => setLayer('bg', { dir: d.value })}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}

      <RangeSlider
        label="Camera Drift"
        value={scene.drift}
        min={0}
        max={200}
        onChange={(v) => setLayer('scene', { drift: v })}
      />
      <RangeSlider
        label="FOV"
        value={scene.fov}
        min={25}
        max={90}
        onChange={(v) => setLayer('scene', { fov: v })}
      />
    </LayerAccordion>
  );
}
