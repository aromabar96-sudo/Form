import { useRef, useState } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import usePresetsStore from '../store/usePresetsStore';

// Save/load named scene snapshots to localStorage, plus JSON export/import
// for moving presets between machines. See FORM-Studio-Plan.md Phase 5.
export default function PresetPanel() {
  const presets = usePresetsStore((s) => s.presets);
  const savePreset = usePresetsStore((s) => s.savePreset);
  const loadPreset = usePresetsStore((s) => s.loadPreset);
  const deletePreset = usePresetsStore((s) => s.deletePreset);
  const exportPreset = usePresetsStore((s) => s.exportPreset);
  const importPresetFile = usePresetsStore((s) => s.importPresetFile);
  const [name, setName] = useState('');
  const fileInputRef = useRef();

  return (
    <div className="sec">
      <div className="group-label" style={{ padding: '0 0 8px' }}>Presets</div>
      <div className="ctrl" style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          placeholder="Preset name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)', color: 'var(--text)', fontSize: 12, padding: '6px 8px',
          }}
        />
        <button
          className="btn btn-p"
          style={{ width: 'auto', padding: '6px 12px' }}
          onClick={() => { savePreset(name); setName(''); }}
        >
          Save
        </button>
      </div>

      {presets.length === 0 ? (
        <div style={{ color: 'var(--muted)', fontFamily: "'JetBrains Mono',monospace", fontSize: 9, marginTop: 8 }}>
          No presets saved yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
          {presets.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                className="btn-s"
                style={{
                  flex: 1, textAlign: 'left', padding: '6px 10px', border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', color: 'var(--text-2)',
                  fontSize: 11, cursor: 'pointer',
                }}
                onClick={() => loadPreset(p.id)}
              >
                {p.name}
              </button>
              <button
                title="Export JSON"
                onClick={() => exportPreset(p.id)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}
              >
                <Download size={13} />
              </button>
              <button
                title="Delete"
                onClick={() => deletePreset(p.id)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importPresetFile(file);
          e.target.value = '';
        }}
      />
      <button
        className="btn btn-s"
        style={{ marginTop: 10, gap: 6 }}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={13} /> Import Preset JSON
      </button>
    </div>
  );
}
