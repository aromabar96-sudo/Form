import { create } from 'zustand';
import useStore, { defaults } from './useStore';

const STORAGE_KEY = 'form-studio-presets';
const STATE_KEYS = Object.keys(defaults);

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(presets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — presets
    // just won't survive a reload; not fatal.
  }
}

function snapshotCurrentState() {
  const s = useStore.getState();
  const data = {};
  STATE_KEYS.forEach((k) => { data[k] = structuredClone(s[k]); });
  return data;
}

// Preset system — save/load named snapshots of the full layer/effect/scene
// state, persisted to localStorage, with JSON export/import for sharing
// presets between machines. See FORM-Studio-Plan.md Phase 5 Priority 1.
const usePresetsStore = create((set, get) => ({
  presets: loadFromStorage(),

  savePreset: (name) => {
    const preset = {
      id: crypto.randomUUID(),
      name: name?.trim() || `Preset ${get().presets.length + 1}`,
      createdAt: Date.now(),
      data: snapshotCurrentState(),
    };
    const presets = [...get().presets, preset];
    persist(presets);
    set({ presets });
    return preset;
  },

  loadPreset: (id) => {
    const preset = get().presets.find((p) => p.id === id);
    if (!preset) return;
    useStore.getState().loadState(structuredClone(preset.data));
  },

  deletePreset: (id) => {
    const presets = get().presets.filter((p) => p.id !== id);
    persist(presets);
    set({ presets });
  },

  exportPreset: (id) => {
    const preset = get().presets.find((p) => p.id === id);
    if (!preset) return;
    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${preset.name.replace(/\s+/g, '-').toLowerCase()}.form-preset.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importPresetFile: async (file) => {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const preset = {
      id: crypto.randomUUID(),
      name: parsed.name || file.name.replace(/\.json$/, ''),
      createdAt: Date.now(),
      data: parsed.data || parsed, // tolerate raw state dumps too
    };
    const presets = [...get().presets, preset];
    persist(presets);
    set({ presets });
    return preset;
  },
}));

export default usePresetsStore;
