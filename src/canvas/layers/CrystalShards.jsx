import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';

import { getPhase } from '../usePhase';
import { getBlendingProps } from '../../utils/blending';

const SHARD_GEOS = [
  () => new THREE.IcosahedronGeometry(1, 0),
  () => new THREE.OctahedronGeometry(1, 0),
  () => new THREE.TetrahedronGeometry(1, 0),
  () => new THREE.DodecahedronGeometry(1, 0),
  () => new THREE.IcosahedronGeometry(1, 1),
  () => new THREE.TorusGeometry(1, 0.32, 6, 8),
];

// Dual-mesh per shard (solid + wireframe shell at 1.04x), 6 geometry types,
// dramatic scale variation (a few huge bg anchors, many small fg pieces).
// Ported from makeFloatGeo()/tickFloatGeo().
export default function CrystalShards() {
  const { on, c1, c2, count, mix, speed, compOpacity, blendMode } = useStore((s) => s.floatgeo);
  const groupRef = useRef();

  const shards = useMemo(() => {
    const col1 = new THREE.Color(c1);
    const col2 = new THREE.Color(c2);
    const wireRatio = mix / 100;
    return Array.from({ length: count }, (_, i) => {
      const s = i * 53.71;
      const f = i / Math.max(1, count - 1);
      const color = col1.clone().lerp(col2, f);
      const geoFn = SHARD_GEOS[i % SHARD_GEOS.length];
      const isWire = f > 1 - wireRatio;
      const scl = i < 3 ? 50 + i * 25 : 6 + ((s * 7.3) % 1) * 32;
      const orR = 80 + ((s * 3.7) % 1) * 180;
      return {
        s, color, geoFn, isWire, scl, orR,
        showWire: i % 3 !== 0 || isWire,
        orS: 0.3 + (i % 5) * 0.18,
        orP: s,
        spinX: Math.sin(s) * 0.008,
        spinY: Math.cos(s * 1.3) * 0.006,
        spinZ: Math.sin(s * 0.7) * 0.004,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, c1, c2, mix]);

  useFrame((state) => {
    if (!on || !groupRef.current) return;
    const phase = getPhase(state.clock.elapsedTime);
    const t = phase * Math.PI * 2;
    const spd = speed / 100;
    const opacityVal = compOpacity / 100;

    groupRef.current.children.forEach((group, i) => {
      const u = shards[i];
      if (!u) return;
      const ot = t * u.orS * spd + u.orP;
      group.position.set(
        Math.sin(ot) * u.orR,
        Math.cos(ot * 0.67) * u.orR * 0.45,
        Math.sin(ot * 1.21) * u.orR * 0.78,
      );
      group.rotation.x += u.spinX * spd;
      group.rotation.y += u.spinY * spd;
      group.rotation.z += u.spinZ * spd;

      const [solidMesh, wireMesh] = group.children;
      if (solidMesh) solidMesh.material.opacity = u.isWire ? 0 : 0.8 * opacityVal;
      if (wireMesh) wireMesh.material.opacity = 0.55 * opacityVal;
    });
  });

  if (!on) return null;

  return (
    <group ref={groupRef}>
      {shards.map((u, i) => (
        <group key={i} scale={u.scl}>
          <mesh geometry={u.geoFn()}>
            <meshPhysicalMaterial
              color={u.color}
              emissive={u.color.clone().multiplyScalar(0.35)}
              roughness={0.15}
              metalness={0.7}
              clearcoat={0.8}
              transparent
              opacity={u.isWire ? 0 : 0.8 * (compOpacity / 100)}
              depthWrite={false}
            />
          </mesh>
          {u.showWire ? (
            <mesh geometry={u.geoFn()} scale={1.04}>
              <meshBasicMaterial
                color={u.color}
                wireframe
                transparent
                opacity={0.55 * (compOpacity / 100)}
                depthWrite={false}
                {...getBlendingProps(blendMode)}
              />
            </mesh>
          ) : null}
        </group>
      ))}
    </group>
  );
}
