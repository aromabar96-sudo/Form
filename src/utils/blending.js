import * as THREE from 'three';

// Maps a friendly blend-mode name to the THREE material props needed to
// achieve it. Screen blend has no built-in THREE constant, so it's done via
// CustomBlending with explicit factors.
export function getBlendingProps(mode) {
  switch (mode) {
    case 'additive':
      return { blending: THREE.AdditiveBlending };
    case 'multiply':
      return { blending: THREE.MultiplyBlending };
    case 'screen':
      return {
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneMinusDstColorFactor,
        blendDst: THREE.OneFactor,
        blendEquation: THREE.AddEquation,
      };
    case 'normal':
    default:
      return { blending: THREE.NormalBlending };
  }
}

export const BLEND_MODES = ['normal', 'additive', 'multiply', 'screen'];
