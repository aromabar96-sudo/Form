import * as THREE from 'three';

// Mutable singleton — the current unprojected mouse position in world space
// (or inactive when the pointer isn't over the canvas / repulsion is
// disabled/recording), written by MouseController and read imperatively by
// any layer's useFrame.
export const mouseBridge = {
  point: new THREE.Vector3(),
  active: false,
};
