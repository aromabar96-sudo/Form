import { useState } from 'react';
import { Info } from 'lucide-react';
import useStore from '../store/useStore';
import { LAYER_FIELDS, EFFECT_FIELDS } from './fieldConfig';
import LayerPanel from './LayerPanel';
import PresetPanel from './PresetPanel';
import ExportPanel from './ExportPanel';
import TimelinePanel from './TimelinePanel';
import ScenePanel from './ScenePanel';
import HelpModal from './HelpModal';
import logo from '../assets/logo.svg';
import { version as appVersion } from '../../package.json';

export default function Sidebar({ collapsed = false }) {
  const activeCount = useStore((s) => LAYER_FIELDS.filter((f) => s[f.key]?.on).length);
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div id="sidebar" className={collapsed ? 'collapsed' : ''}>
      <div className="brand">
        <div className="brand-lockup">
          <img src={logo} alt="" className="brand-logo" />
          <h1>FORM</h1>
          <span className="brand-version">v{appVersion}</span>
          <button
            className="brand-help"
            onClick={() => setHelpOpen(true)}
            aria-label="About FORM"
            title="About FORM"
          >
            <Info size={14} />
          </button>
        </div>
        <p>ABSTRACT MOTION STUDIO</p>
      </div>
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      <div id="sidebar-scroll">
        <TimelinePanel />
        <ExportPanel />
        <PresetPanel />

        <div className="group-label">Layers ({activeCount}/{LAYER_FIELDS.length} active)</div>
        {LAYER_FIELDS.map((field) => (
          <LayerPanel key={field.key} field={field} />
        ))}

        <div className="group-label">Effects</div>
        {EFFECT_FIELDS.map((field) => (
          <LayerPanel key={field.key} field={field} />
        ))}

        <div className="group-label">Scene</div>
        <ScenePanel />
      </div>
    </div>
  );
}
