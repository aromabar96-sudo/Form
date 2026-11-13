import { create } from 'zustand';
import { temporal } from 'zundo';

// Default layer/effect/scene state — ported 1:1 from the legacy `S` object
// in form-studio-3.html (see /docs/FORM-Studio-Plan.md), plus `compOpacity`
// and `blendMode` added to every geometry layer for Phase 5 "Layer opacity"
// and "Layer blend modes". Named compOpacity (not `opacity`) to avoid
// colliding with the Lava Surface layer's pre-existing `opacity` (brightness)
// param, and blendMode (not `blend`) for the same reason on other layers.
export const defaults = {
  blobs:     { on: true,  cA: '#ff2ef7', cB: '#3b2ef5', cC: '#5fc8e8', count: 5, size: 100, noise: 50, speed: 100, compOpacity: 100, blendMode: 'normal' },
  grid:      { on: false, color: '#5fc8e8', den: 24, wh: 50, speed: 100, compOpacity: 100, blendMode: 'normal' },
  nodes:     { on: false, nc: '#5fe8a3', lc: '#ff2ef7', count: 50, link: 90, speed: 100, compOpacity: 100, blendMode: 'normal' },
  particles: { on: false, c1: '#a78bfa', c2: '#38bdf8', count: 2000, size: 20, spread: 500, speed: 100, compOpacity: 100, blendMode: 'additive' },
  noise:     { on: false, c1: '#f472b6', c2: '#7c3aed', scale: 40, height: 60, opacity: 70, speed: 100, compOpacity: 100, blendMode: 'normal' },
  ribbons:   { on: false, c1: '#34d399', c2: '#38bdf8', c3: '#a78bfa', count: 6, turb: 50, speed: 100, compOpacity: 100, blendMode: 'additive' },
  floatgeo:  { on: false, c1: '#fbbf24', c2: '#38bdf8', count: 12, mix: 50, speed: 100, compOpacity: 100, blendMode: 'normal' },
  voronoi:   { on: false, c1: '#00f5d4', c2: '#0a1929', cells: 20, edge: 30, bright: 70, speed: 100, compOpacity: 100, blendMode: 'additive' },
  dna:       { on: false, cA: '#c084fc', cB: '#38bdf8', pairs: 24, radius: 70, twist: 20, speed: 100, compOpacity: 100, blendMode: 'normal' },
  wormhole:  { on: false, c1: '#818cf8', c2: '#f472b6', c3: '#38bdf8', size: 140, rings: 8, distort: 50, speed: 100, compOpacity: 100, blendMode: 'additive' },
  smoke:     { on: false, color: '#94a3b8', layers: 10, density: 50, scale: 60, speed: 100, compOpacity: 100, blendMode: 'additive' },
  normalmap: { on: false, scale: 15 },
  env:       { on: false, top: '#1a3a5c', mid: '#0d1a26', bottom: '#000814', intensity: 10 },
  dof:       { on: false, focus: 400, aperture: 25, maxBlur: 20 },
  motionblur:{ on: false, damp: 85 },
  // bloom removed — see Effects.jsx for why (hindered export perf).
  fog:       { on: false, color: '#07111f', density: 3 },
  grain:     { on: false, strength: 25, animated: true },
  chroma:    { on: false, strength: 20 },
  vignette:  { on: false, strength: 15, softness: 6 },
  scanlines: { on: false, count: 400, opacity: 15 },
  mouse:     { on: false, force: 80, radius: 150 },
  audio:     { on: false, sens: 100, bass: 0, mid: 0, high: 0 },
  cycle:     { on: false, speed: 20, amount: 50, hue: 0 },
  scene:     { drift: 40, fov: 55 },
  bg:        { mode: 'none', solid: '#0a0b14', g1: '#0a0b14', g2: '#1a1230', dir: 'to bottom' },
};

// Layer keys that render actual geometry in the scene (used to drive the
// sidebar accordion list and layer components).
export const LAYER_KEYS = [
  'blobs', 'grid', 'nodes', 'particles', 'noise', 'ribbons',
  'floatgeo', 'voronoi', 'dna', 'wormhole', 'smoke',
];

// Non-layer keys (UI/meta) excluded from undo/redo history diffing and from
// preset save/load payloads — currently none, but kept as a hook point.
const EXCLUDED_FROM_HISTORY = [];

const useStore = create(
  temporal(
    (set) => ({
      ...structuredClone(defaults),

      // Timeline scrubber state — when scrubOverride is not null, layers use
      // it instead of the live clock for their phase, letting the sidebar
      // preview any moment in the loop. See sidebar/TimelinePanel.jsx.
      scrubOverride: null,
      setScrubOverride: (phase) => set({ scrubOverride: phase }),

      // Patch a layer/effect/scene's params, e.g. setLayer('blobs', { count: 8 })
      setLayer: (key, patch) => set((s) => ({
        [key]: { ...s[key], ...patch },
      })),

      // Reset a single layer/effect back to its default params
      resetLayer: (key) => set({ [key]: structuredClone(defaults[key]) }),

      // Reset everything
      resetAll: () => set(structuredClone(defaults)),

      // Toggle a layer/effect on/off
      toggleLayer: (key) => set((s) => ({
        [key]: { ...s[key], on: !s[key].on },
      })),

      // Replace the whole layer/effect/scene state (used by preset load)
      loadState: (patch) => set(patch),
    }),
    {
      // Don't record action functions (or the scrub scrubber, which is a
      // live UI/preview control, not an authored value) in undo history.
      partialize: (s) => Object.fromEntries(
        // 'audio' is excluded too — AudioController writes bass/mid/high at
        // ~20Hz while Audio Reactive is on, which would otherwise flood the
        // undo stack with dozens of history entries per second and push out
        // real user edits within a few seconds (limit: 100 below).
        Object.entries(s).filter(([k]) => typeof s[k] !== 'function' && k !== 'scrubOverride' && k !== 'audio' && !EXCLUDED_FROM_HISTORY.includes(k)),
      ),
      limit: 100,
    },
  ),
);

export default useStore;
