import { Pause, Play } from 'lucide-react';
import useStore from '../store/useStore';
import { exportBridge } from '../canvas/exportBridge';

// Timeline scrubber — drag to preview any moment in the 10s loop before
// export, without waiting for the live clock to cycle back around.
// Ported from FORM-Studio-Plan.md Phase 5 Priority 5 "Timeline scrubber".
// Space bar also toggles play/pause (wired in App.jsx).
export default function TimelinePanel() {
  const scrubOverride = useStore((s) => s.scrubOverride);
  const setScrubOverride = useStore((s) => s.setScrubOverride);
  const playing = scrubOverride === null;

  const togglePlay = () => {
    if (playing) {
      const phase = exportBridge.clock
        ? (exportBridge.clock.elapsedTime % 10) / 10
        : 0;
      setScrubOverride(phase);
    } else {
      setScrubOverride(null);
    }
  };

  return (
    <div className="sec">
      <div className="group-label" style={{ padding: '0 0 8px' }}>Timeline</div>
      <div className="ctrl" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          className="btn btn-s"
          style={{ width: 34, height: 34, padding: 0, flexShrink: 0 }}
          onClick={togglePlay}
          title={playing ? 'Pause (Space)' : 'Play (Space)'}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round((scrubOverride ?? 0) * 100)}
          onChange={(e) => setScrubOverride(Number(e.target.value) / 100)}
          // Same Chromium hover-scroll-adjusts-range-value fix as
          // RangeSlider.jsx — this scrubber sits at the top of the
          // sidebar's scroll list too.
          onWheel={(e) => e.preventDefault()}
          style={{ flex: 1 }}
        />
      </div>
    </div>
  );
}
