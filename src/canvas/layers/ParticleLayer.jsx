import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';

import { getPhase } from '../usePhase';
import { getBlendingProps } from '../../utils/blending';
import { mouseBridge } from '../mouseBridge';

// BufferGeometry point field with dual-color vertex coloring, additive blending.
// Ported from makeParticles()/tickParticles().
export default function ParticleLayer() {
  const { on, c1, c2, count, size, spread, speed, compOpacity, blendMode } = useStore((s) => s.particles);
  const mouseOn = useStore((s) => s.mouse.on);
  const mouseForce = useStore((s) => s.mouse.force);
  const mouseRadius = useStore((s) => s.mouse.radius);
  const pointsRef = useRef();
  const baseRef = useRef(null);

  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const col1 = new THREE.Color(c1);
    const col2 = new THREE.Color(c2);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread * 2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread * 1.5;
      const c = col1.clone().lerp(col2, Math.random());
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    baseRef.current = pos.slice();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return geo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, spread, c1, c2]);

  useFrame((state) => {
    if (!on || !pointsRef.current) return;
    const phase = getPhase(state.clock.elapsedTime);
    const t = phase * Math.PI * 2;
    const spd = speed / 100;
    const pos = pointsRef.current.geometry.attributes.position;
    const base = baseRef.current;
    for (let i = 0; i < count; i++) {
      const s = i * 0.37;
      const drift = Math.sin(t * spd + s) * 8 + Math.cos(t * spd * 0.7 + s * 1.3) * 5;
      pos.array[i * 3] = base[i * 3] + Math.sin(t * spd * 0.5 + s) * 15;
      pos.array[i * 3 + 1] = base[i * 3 + 1] + drift;
      pos.array[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * spd * 0.4 + s * 0.8) * 10;

      // Mouse repulsion — same linear-falloff push as BlobLayer, applied
      // per-particle on top of the drift offset already computed above.
      if (mouseOn && mouseBridge.active) {
        const dx = pos.array[i * 3] - mouseBridge.point.x;
        const dy = pos.array[i * 3 + 1] - mouseBridge.point.y;
        const dz = pos.array[i * 3 + 2] - mouseBridge.point.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;
        if (dist < mouseRadius) {
          const falloff = 1 - dist / mouseRadius;
          const push = (mouseForce / 100) * falloff * 25;
          pos.array[i * 3] += (dx / dist) * push;
          pos.array[i * 3 + 1] += (dy / dist) * push;
          pos.array[i * 3 + 2] += (dz / dist) * push;
        }
      }
    }
    pos.needsUpdate = true;
  });

  if (!on) return null;

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={size / 10}
        vertexColors
        transparent
        opacity={0.7 * (compOpacity / 100)}
        sizeAttenuation
        depthWrite={false}
        {...getBlendingProps(blendMode)}
      />
    </points>
  );
}
