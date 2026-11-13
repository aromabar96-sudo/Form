import { X } from 'lucide-react';
import { isTauri } from '../hooks/useIsTauri';

// Quick-overview help modal, opened from the (i) icon next to the logo.
// Deliberately short — a few scannable sections, not an exhaustive manual
// per-layer/effect (see fieldConfig.js if that ever needs writing out).
export default function HelpModal({ onClose }) {
  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-modal-header">
          <h2>About FORM</h2>
          <button className="help-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="help-modal-body">
          <section>
            <h3>What this is</h3>
            <p>
              FORM is a generative motion studio — a real-time 3D canvas of animated
              layers (blobs, ribbons, particles, voronoi cells, and more) that you
              shape with sliders and colors, then export as looping video or a
              still image.
            </p>
          </section>

          <section>
            <h3>Layers &amp; Effects</h3>
            <p>
              Each layer in the sidebar is an independent generative element —
              toggle it on/off, tweak its colors, and adjust its motion with the
              sliders underneath. Effects (fog, grain, chromatic aberration,
              vignette, scanlines, mouse repulsion, audio reactivity, color
              cycling) apply on top of every layer at once.
            </p>
          </section>

          <section>
            <h3>Scene &amp; Presets</h3>
            <p>
              The Scene panel controls camera drift, field of view, background,
              and fog. Presets let you save a full configuration and reload it
              later, or share it as a file.
            </p>
          </section>

          <section>
            <h3>Export</h3>
            <p>
              The Export panel renders your composition to a looping video or a
              PNG still at your chosen resolution. Animation is phase-based, so
              exported video loops seamlessly with no visible seam.
            </p>
          </section>

          <section>
            <h3>Keyboard shortcuts</h3>
            <ul>
              <li><kbd>Space</kbd> — play / pause the timeline</li>
              <li><kbd>{isTauri() ? 'Cmd' : 'Ctrl'}+Z</kbd> — undo</li>
              <li><kbd>{isTauri() ? 'Cmd' : 'Ctrl'}+Shift+Z</kbd> — redo</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
