import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import passthroughVert from '../../shaders/passthrough.vert.glsl?raw';
import wormholeFrag from '../../shaders/wormhole.frag.glsl?raw';

import { getPhase } from '../usePhase';
import { getBlendingProps } from '../../utils/blending';

// CircleGeometry disc with custom vortex fragment shader (swirling rings
// pulling inward), outer + inner TorusGeometry frame rings.
// Ported from makeWormhole()/tickWormhole().
export default function Wormhole() {
  const { on, c1, c2, c3, size, rings, distort, speed, compOpacity, blendMode } = useStore((s) => s.wormhole);
  const groupRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();

  const discMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      c1: { value: new THREE.Color(c1) },
      c2: { value: new THREE.Color(c2) },
      c3: { value: new THREE.Color(c3) },
      rings: { value: rings },
      distort: { value: distort / 100 },
      opacity: { value: compOpacity / 100 },
    },
    vertexShader: passthroughVert,
    fragmentShader: wormholeFrag,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    ...getBlendingProps(blendMode),
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state) => {
    if (!on || !groupRef.current) return;
    const phase = getPhase(state.clock.elapsedTime);
    const t = phase * Math.PI * 2 * (speed / 100);
    const u = discMaterial.uniforms;
    const opacityVal = compOpacity / 100;
    u.time.value = t;
    u.rings.value = rings;
    u.distort.value = distort / 100;
    u.c1.value.set(c1);
    u.c2.value.set(c2);
    u.c3.value.set(c3);
    u.opacity.value = opacityVal;
    Object.assign(discMaterial, getBlendingProps(blendMode));
    groupRef.current.rotation.y = Math.sin(phase * Math.PI * 2 * 0.3) * 0.25;
    groupRef.current.rotation.x = Math.cos(phase * Math.PI * 2 * 0.2) * 0.15;

    if (ring1Ref.current) {
      ring1Ref.current.material.opacity = 0.7 * opacityVal;
      ring1Ref.current.material.color.set(c1);
      ring1Ref.current.material.emissive.set(c1).multiplyScalar(0.5);
    }
    if (ring2Ref.current) {
      ring2Ref.current.material.opacity = 0.7 * opacityVal;
      ring2Ref.current.material.color.set(c2);
      ring2Ref.current.material.emissive.set(c2).multiplyScalar(0.4);
    }
  });

  if (!on) return null;

  return (
    <group ref={groupRef}>
      <mesh>
        <circleGeometry args={[size, 128]} />
        <primitive object={discMaterial} attach="material" />
      </mesh>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[size, size * 0.04, 16, 80]} />
        <meshPhysicalMaterial
          color={c1}
          emissive={new THREE.Color(c1).multiplyScalar(0.5)}
          roughness={0.15}
          metalness={0.8}
          transparent
          opacity={0.7 * (compOpacity / 100)}
        />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[size * 0.55, size * 0.02, 12, 60]} />
        <meshPhysicalMaterial
          color={c2}
          emissive={new THREE.Color(c2).multiplyScalar(0.4)}
          roughness={0.15}
          metalness={0.8}
          transparent
          opacity={0.7 * (compOpacity / 100)}
        />
      </mesh>
    </group>
  );
}
