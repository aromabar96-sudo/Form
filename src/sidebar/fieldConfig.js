import {
  Droplet, Grid3x3, Share2, Sparkles, Flame, Waves, Gem, Hexagon, Dna,
  CircleDot, CloudFog, Grip, Zap, Circle, AlignJustify, MousePointer2,
  AudioLines, RefreshCw,
} from 'lucide-react';

// Metadata-driven sidebar config — one entry per store layer/effect key.
// Ranges (min/max) are copied verbatim from the legacy <input type="range">
// attributes in legacy/form-studio-3.html so the ported sliders behave
// identically to the original build.

export const LAYER_FIELDS = [
  {
    key: 'blobs', title: 'Blobs', icon: Droplet, iconColor: '#ff2ef7',
    colors: [{ key: 'cA', label: 'Color A' }, { key: 'cB', label: 'Color B' }, { key: 'cC', label: 'Color C' }],
    composite: true,
    ranges: [
      { key: 'count', label: 'Count', min: 1, max: 12 },
      { key: 'size', label: 'Size', min: 30, max: 200 },
      { key: 'noise', label: 'Wobble', min: 0, max: 100 },
      { key: 'speed', label: 'Speed', min: 10, max: 300 },
    ],
  },
  {
    key: 'grid', title: 'Grid', icon: Grid3x3, iconColor: '#5fc8e8',
    colors: [{ key: 'color', label: 'Color' }],
    composite: true,
    ranges: [
      { key: 'den', label: 'Density', min: 6, max: 48 },
      { key: 'wh', label: 'Wave Height', min: 0, max: 100 },
      { key: 'speed', label: 'Speed', min: 10, max: 300 },
    ],
  },
  {
    key: 'nodes', title: 'Nodes', icon: Share2, iconColor: '#5fe8a3',
    colors: [{ key: 'nc', label: 'Node Color' }, { key: 'lc', label: 'Link Color' }],
    composite: true,
    ranges: [
      { key: 'count', label: 'Count', min: 10, max: 150 },
      { key: 'link', label: 'Link Distance', min: 20, max: 250 },
      { key: 'speed', label: 'Speed', min: 10, max: 300 },
    ],
  },
  {
    key: 'particles', title: 'Particles', icon: Sparkles, iconColor: '#a78bfa',
    colors: [{ key: 'c1', label: 'Color A' }, { key: 'c2', label: 'Color B' }],
    composite: true,
    ranges: [
      { key: 'count', label: 'Count', min: 100, max: 8000 },
      { key: 'size', label: 'Size', min: 5, max: 80 },
      { key: 'spread', label: 'Spread', min: 100, max: 900 },
      { key: 'speed', label: 'Speed', min: 10, max: 300 },
    ],
  },
  {
    key: 'noise', title: 'Lava Surface', icon: Flame, iconColor: '#f472b6',
    colors: [{ key: 'c1', label: 'Color A' }, { key: 'c2', label: 'Color B' }],
    composite: true,
    ranges: [
      { key: 'scale', label: 'Scale', min: 10, max: 100 },
      { key: 'height', label: 'Displacement', min: 5, max: 200 },
      { key: 'opacity', label: 'Brightness', min: 10, max: 100 },
      { key: 'speed', label: 'Speed', min: 10, max: 300 },
    ],
  },
  {
    key: 'ribbons', title: 'Silk Ribbons', icon: Waves, iconColor: '#34d399',
    colors: [{ key: 'c1', label: 'Color A' }, { key: 'c2', label: 'Color B' }, { key: 'c3', label: 'Color C' }],
    composite: true,
    ranges: [
      { key: 'count', label: 'Count', min: 1, max: 16 },
      { key: 'turb', label: 'Turbulence', min: 0, max: 100 },
      { key: 'speed', label: 'Speed', min: 10, max: 300 },
    ],
  },
  {
    key: 'floatgeo', title: 'Crystal Shards', icon: Gem, iconColor: '#fbbf24',
    colors: [{ key: 'c1', label: 'Color A' }, { key: 'c2', label: 'Color B' }],
    composite: true,
    ranges: [
      { key: 'count', label: 'Count', min: 2, max: 30 },
      { key: 'mix', label: 'Solid → Wire', min: 0, max: 100 },
      { key: 'speed', label: 'Speed', min: 10, max: 300 },
    ],
  },
  {
    key: 'voronoi', title: 'Voronoi Cells', icon: Hexagon, iconColor: '#00f5d4',
    colors: [{ key: 'c1', label: 'Color A' }, { key: 'c2', label: 'Color B' }],
    composite: true,
    ranges: [
      { key: 'cells', label: 'Cell Count', min: 4, max: 60 },
      { key: 'edge', label: 'Edge Width', min: 5, max: 80 },
      { key: 'bright', label: 'Brightness', min: 10, max: 100 },
      { key: 'speed', label: 'Speed', min: 10, max: 300 },
    ],
  },
  {
    key: 'dna', title: 'DNA Helix', icon: Dna, iconColor: '#c084fc',
    colors: [{ key: 'cA', label: 'Color A' }, { key: 'cB', label: 'Color B' }],
    composite: true,
    ranges: [
      { key: 'pairs', label: 'Base Pairs', min: 6, max: 60 },
      { key: 'radius', label: 'Radius', min: 20, max: 200 },
      { key: 'twist', label: 'Twist', min: 10, max: 60 },
      { key: 'speed', label: 'Speed', min: 10, max: 300 },
    ],
  },
  {
    key: 'wormhole', title: 'Wormhole', icon: CircleDot, iconColor: '#818cf8',
    colors: [{ key: 'c1', label: 'Color A' }, { key: 'c2', label: 'Color B' }, { key: 'c3', label: 'Color C' }],
    composite: true,
    ranges: [
      { key: 'size', label: 'Size', min: 40, max: 300 },
      { key: 'rings', label: 'Ring Density', min: 2, max: 24 },
      { key: 'distort', label: 'Distortion', min: 0, max: 100 },
      { key: 'speed', label: 'Speed', min: 10, max: 300 },
    ],
  },
  {
    key: 'smoke', title: 'Volumetric Smoke', icon: CloudFog, iconColor: '#94a3b8',
    colors: [{ key: 'color', label: 'Color' }],
    composite: true,
    ranges: [
      { key: 'layers', label: 'Layers', min: 3, max: 24 },
      { key: 'density', label: 'Density', min: 5, max: 100 },
      { key: 'scale', label: 'Scale', min: 10, max: 120 },
      { key: 'speed', label: 'Speed', min: 10, max: 300 },
    ],
  },
];

// Bloom removed from the sidebar — see Effects.jsx for why (it was
// hindering export performance). Panel entry deliberately deleted rather
// than left greyed out, since the store field is gone too (useStore.js).
export const EFFECT_FIELDS = [
  {
    key: 'fog', title: 'Fog', icon: CloudFog, iconColor: '#94a3b8',
    colors: [{ key: 'color', label: 'Color' }],
    ranges: [{ key: 'density', label: 'Density', min: 1, max: 30 }],
  },
  {
    key: 'grain', title: 'Film Grain', icon: Grip, iconColor: '#d4b483',
    colors: [],
    ranges: [{ key: 'strength', label: 'Strength', min: 0, max: 100 }],
  },
  {
    key: 'chroma', title: 'Chromatic Aberration', icon: Zap, iconColor: '#f87171',
    colors: [],
    ranges: [{ key: 'strength', label: 'Strength', min: 1, max: 100 }],
  },
  {
    key: 'vignette', title: 'Vignette', icon: Circle, iconColor: '#6b7280',
    colors: [],
    ranges: [
      { key: 'strength', label: 'Strength', min: 1, max: 40 },
      { key: 'softness', label: 'Softness', min: 1, max: 20 },
    ],
  },
  {
    key: 'scanlines', title: 'Scanlines', icon: AlignJustify, iconColor: '#818cf8',
    colors: [],
    ranges: [
      { key: 'count', label: 'Count', min: 50, max: 1200 },
      { key: 'opacity', label: 'Opacity', min: 1, max: 80 },
    ],
  },
  {
    key: 'mouse', title: 'Mouse Repulsion', icon: MousePointer2, iconColor: '#fde68a',
    colors: [],
    ranges: [
      { key: 'force', label: 'Force', min: 10, max: 300 },
      { key: 'radius', label: 'Radius', min: 30, max: 400 },
    ],
  },
  {
    key: 'audio', title: 'Audio Reactive', icon: AudioLines, iconColor: '#6ee7b7',
    colors: [],
    ranges: [{ key: 'sens', label: 'Sensitivity', min: 10, max: 300 }],
  },
  {
    key: 'cycle', title: 'Color Cycling', icon: RefreshCw, iconColor: '#a3e635',
    colors: [],
    ranges: [
      { key: 'speed', label: 'Speed', min: 1, max: 100 },
      { key: 'amount', label: 'Amount', min: 0, max: 100 },
    ],
  },
];
