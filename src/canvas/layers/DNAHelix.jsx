import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';

import { getPhase } from '../usePhase';

function makeHelixPath(offsetAngle, pairs, radius, height, twist) {
  const pts = [];
  const steps = pairs * 4;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = (t * Math.PI * 2 * twist) / 10 + offsetAngle;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, (t - 0.5) * height, Math.sin(a) * radius));
  }
  return new THREE.CatmullRomCurve3(pts);
}

// Two TubeGeometry backbone helixes + SphereGeometry nucleotides +
// CylinderGeometry rungs aligned via quaternion.setFromUnitVectors.
// Ported from makeDNA()/tickDNA(). Geometry is static per param set — only
// the group rotates per frame, matching the legacy build.
export default function DNAHelix() {
  const { on, cA, cB, pairs, radius, twist, speed, compOpacity } = useStore((s) => s.dna);
  const groupRef = useRef();

  const built = useMemo(() => {
    const height = pairs * 14;
    const c1 = new THREE.Color(cA);
    const c2 = new THREE.Color(cB);

    const backbones = [0, Math.PI].map((offset, si) => {
      const curve = makeHelixPath(offset, pairs, radius, height, twist);
      const geo = new THREE.TubeGeometry(curve, pairs * 4, 2.5, 7, false);
      return { geo, color: si === 0 ? c1 : c2 };
    });

    const spheres = [];
    const rungs = [];
    for (let i = 0; i < pairs; i++) {
      const t = i / pairs;
      const a = (t * Math.PI * 2 * twist) / 10;
      const y = (t - 0.5) * height;
      const pA = new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius);
      const pB = new THREE.Vector3(Math.cos(a + Math.PI) * radius, y, Math.sin(a + Math.PI) * radius);

      spheres.push({ pos: pA, color: c1 }, { pos: pB, color: c2 });

      const dir = pB.clone().sub(pA);
      const len = dir.length();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      rungs.push({ pos: pA.clone().add(pB).multiplyScalar(0.5), len, quat });
    }

    const rungColor = c1.clone().lerp(c2, 0.5);
    return { backbones, spheres, rungs, rungColor };
  }, [cA, cB, pairs, radius, twist]);

  useFrame((state) => {
    if (!on || !groupRef.current) return;
    const phase = getPhase(state.clock.elapsedTime);
    groupRef.current.rotation.y = phase * Math.PI * 2 * (speed / 100) * 0.5;
  });

  if (!on) return null;

  return (
    <group ref={groupRef}>
      {built.backbones.map((b, i) => (
        <mesh key={`bb-${i}`} geometry={b.geo}>
          <meshPhysicalMaterial
            color={b.color}
            emissive={b.color.clone().multiplyScalar(0.3)}
            roughness={0.2}
            metalness={0.5}
            transparent
            opacity={0.85 * (compOpacity / 100)}
          />
        </mesh>
      ))}
      {built.spheres.map((s, i) => (
        <mesh key={`sp-${i}`} position={s.pos}>
          <sphereGeometry args={[4, 8, 8]} />
          <meshPhysicalMaterial
            color={s.color}
            emissive={s.color.clone().multiplyScalar(0.4)}
            roughness={0.15}
            metalness={0.6}
            transparent
            opacity={compOpacity / 100}
          />
        </mesh>
      ))}
      {built.rungs.map((r, i) => (
        <mesh key={`rg-${i}`} position={r.pos} quaternion={r.quat}>
          <cylinderGeometry args={[1.2, 1.2, r.len, 6]} />
          <meshBasicMaterial color={built.rungColor} transparent opacity={0.35 * (compOpacity / 100)} />
        </mesh>
      ))}
    </group>
  );
}
