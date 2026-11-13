import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import passthroughVert from '../../shaders/passthrough.vert.glsl?raw';
import voronoiFrag from '../../shaders/voronoi.frag.glsl?raw';

import { getPhase } from '../usePhase';
import { getBlendingProps } from '../../utils/blending';

// Full GLSL fragment shader on a horizontal plane, grid-based Voronoi with
// animated seed points, seamless loop. Ported from makeVoronoi()/tickVoronoi().
export default function VoronoiCells() {
  const { on, c1, c2, cells, edge, bright, speed, compOpacity, blendMode } = useStore((s) => s.voronoi);
  const matRef = useRef();

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      c1: { value: new THREE.Color(c1) },
      c2: { value: new THREE.Color(c2) },
      cells: { value: cells },
      edge: { value: edge / 100 },
      bright: { value: bright / 100 },
      opacity: { value: compOpacity / 100 },
    },
    vertexShader: passthroughVert,
    fragmentShader: voronoiFrag,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    ...getBlendingProps(blendMode),
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state) => {
    if (!on) return;
    const phase = getPhase(state.clock.elapsedTime);
    const u = material.uniforms;
    u.time.value = phase * Math.PI * 2 * (speed / 100);
    u.cells.value = cells;
    u.edge.value = edge / 100;
    u.bright.value = bright / 100;
    u.c1.value.set(c1);
    u.c2.value.set(c2);
    u.opacity.value = compOpacity / 100;
    Object.assign(material, getBlendingProps(blendMode));
  });

  if (!on) return null;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -140, 0]}>
      <planeGeometry args={[1000, 1000]} />
      <primitive ref={matRef} object={material} attach="material" />
    </mesh>
  );
}
