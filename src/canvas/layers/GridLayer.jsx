import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';

import { getPhase } from '../usePhase';
import { getBlendingProps } from '../../utils/blending';

const SIZE = 700;

// Wireframe plane with 4-octave-style wave displacement.
// Ported from makeGrid()/tickGrid().
export default function GridLayer() {
  const { on, color, den, wh, speed, compOpacity, blendMode } = useStore((s) => s.grid);
  const meshRef = useRef();
  const baseRef = useRef(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, den, den);
    geo.rotateX(-Math.PI / 2);
    baseRef.current = Float32Array.from(geo.attributes.position.array);
    return geo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [den]);

  useFrame((state) => {
    if (!on || !meshRef.current) return;
    const phase = getPhase(state.clock.elapsedTime);
    const t = phase * Math.PI * 2;
    const spd = speed / 100;
    const h = (wh / 100) * 70;
    const pos = meshRef.current.geometry.attributes.position;
    const base = baseRef.current;
    for (let v = 0; v < pos.count; v++) {
      const ix = v * 3;
      const x = base[ix], z = base[ix + 2];
      pos.array[ix + 1] = base[ix + 1] + Math.sin(x * 0.025 + t * 2 * spd) * Math.cos(z * 0.025 + t * 1.5 * spd) * h;
    }
    pos.needsUpdate = true;
    meshRef.current.material.opacity = 0.5 * (compOpacity / 100);
    meshRef.current.material.color.set(color);
  });

  if (!on) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, -130, 0]}>
      <meshBasicMaterial color={color} wireframe transparent opacity={0.5 * (compOpacity / 100)} {...getBlendingProps(blendMode)} />
    </mesh>
  );
}
