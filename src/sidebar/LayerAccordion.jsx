import { useState } from 'react';
import { ChevronRight, Dices } from 'lucide-react';
import Toggle from '../components/Toggle';

// Reusable accordion item — matches .acc-item / .acc-header / .acc-body /
// .acc-tag pill / .acc-arrow chevron in cobalt-sky.css. Ported from the
// legacy sidebar's per-layer accordion markup. Adds a randomize (dice)
// button per FORM-Studio-Plan.md Phase 5 Priority 1.
export default function LayerAccordion({ icon: Icon, iconColor, title, on, onToggle, onRandomize, defaultOpen = false, hideToggle = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="acc-item">
      <div className="acc-header" onClick={() => setOpen((o) => !o)}>
        <div className="acc-left">
          {Icon ? (
            <span className="licon" style={{ color: iconColor }}>
              <Icon size={15} strokeWidth={2} />
            </span>
          ) : null}
          <span className="acc-title">{title}</span>
        </div>
        <div className="acc-right">
          {onRandomize ? (
            <button
              title="Randomize this layer"
              onClick={(e) => { e.stopPropagation(); onRandomize(); }}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 2, display: 'flex' }}
            >
              <Dices size={14} />
            </button>
          ) : null}
          {!hideToggle ? (
            <>
              <span className={`acc-tag${on ? '' : ' off'}`}>{on ? 'ON' : 'OFF'}</span>
              <Toggle checked={on} onChange={onToggle} />
            </>
          ) : null}
          <span className={`acc-arrow${open ? ' open' : ''}`}>
            <ChevronRight />
          </span>
        </div>
      </div>
      <div className={`acc-body${open ? '' : ' closed'}`}>
        <div className="acc-inner">{children}</div>
      </div>
    </div>
  );
}
