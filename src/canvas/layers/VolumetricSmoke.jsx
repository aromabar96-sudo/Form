import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import passthroughVert from '../../shaders/passthrough.vert.glsl?raw';
import smokeFrag from '../../shaders/smoke.frag.glsl?raw';

import { getPhase } from '../usePhase';
import { getBlendingProps } from '../../utils/blending';

// N stacked PlaneGeometry layers, each with a 5-octave FBM noise shader,
// spread in X/Y/Z with rotational variation. Ported from makeSmoke()/tickSmoke().
export default function VolumetricSmoke() {
  const { on, color, layers, density, scale, speed, compOpacity, blendMode } = useStore((s) => s.smoke);

  const layerData = useMemo(() => {
    return Array.from({ length: layers }, (_, i) => {
      const f = i / layers;
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          offset: { value: f * 37.3 },
          color: { value: new THREE.Color(color) },
          density: { value: density / 100 },
          scale: { value: scale / 100 },
          opacity: { value: compOpacity / 100 },
        },
        vertexShader: passthroughVert,
        fragmentShader: smokeFrag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        ...getBlendingProps(blendMode),
      });
      const sz = 700 + f * 400;
      return {
        material, sz, f,
        position: [(f - 0.5) * 60, (f - 0.5) * 30, (f - 0.5) * 120],
        rotation: [-0.3 + f * 0.2, 0, f * 0.15],
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers]);

  useFrame((state) => {
    if (!on) return;
    const phase = getPhase(state.clock.elapsedTime);
    const t = phase * Math.PI * 2 * (speed / 100);
    layerData.forEach(({ material }) => {
      material.uniforms.time.value = t;
      material.uniforms.density.value = density / 100;
      material.uniforms.scale.value = scale / 100;
      material.uniforms.color.value.set(color);
      material.uniforms.opacity.value = compOpacity / 100;
      Object.assign(material, getBlendingProps(blendMode));
    });
  });

  if (!on) return null;

  return (
    <group>
      {layerData.map((d, i) => (
        <mesh key={i} position={d.position} rotation={d.rotation}>
          <planeGeometry args={[d.sz, d.sz]} />
          <primitive object={d.material} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
