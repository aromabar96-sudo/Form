import { useMemo } from 'react';
import * as THREE from 'three';
import useStore from '../store/useStore';
import passthroughVert from '../shaders/passthrough.vert.glsl?raw';
import backgroundFrag from '../shaders/background.frag.glsl?raw';

const DIR_PARAMS = {
  'to bottom': { axisX: 0, flip: 1 },
  'to top': { axisX: 0, flip: 0 },
  'to right': { axisX: 1, flip: 0 },
  'to left': { axisX: 1, flip: 1 },
};

// Scene background — ported from legacy makeBG(): a large plane at z=-1000,
// renderOrder=-1, depthWrite=false, so it always draws behind every other
// layer regardless of camera drift or fog.
//
// DEVIATION FROM PREVIOUS PASS: this used to be plain CSS on #canvas-wrap,
// sitting behind the transparent WebGL canvas. That's fragile once
// postprocessing is involved — @react-three/postprocessing's EffectComposer
// render targets don't reliably round-trip alpha through effects like Bloom,
// so the "transparent canvas showing CSS behind it" trick can silently
// break (canvas renders opaque black instead of transparent) depending on
// effect configuration. Rendering the background as part of the actual
// THREE scene sidesteps that entirely and matches the legacy approach.
export default function BackgroundController() {
  const bg = useStore((s) => s.bg);

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      cA: { value: new THREE.Color(bg.solid) },
      cB: { value: new THREE.Color(bg.g2) },
      axisX: { value: 0 },
      flip: { value: 0 },
    },
    vertexShader: passthroughVert,
    fragmentShader: backgroundFrag,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  if (bg.mode === 'none') return null;

  if (bg.mode === 'solid') {
    material.uniforms.cA.value.set(bg.solid);
    material.uniforms.cB.value.set(bg.solid);
  } else {
    const { axisX, flip } = DIR_PARAMS[bg.dir] ?? DIR_PARAMS['to bottom'];
    material.uniforms.cA.value.set(bg.g1);
    material.uniforms.cB.value.set(bg.g2);
    material.uniforms.axisX.value = axisX;
    material.uniforms.flip.value = flip;
  }

  return (
    <mesh position={[0, 0, -1000]} renderOrder={-1}>
      <planeGeometry args={[5000, 5000]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
