import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';

import { getPhase } from '../usePhase';
import { getBlendingProps } from '../../utils/blending';

const SEG = 120;
const SIZE = 900;
const HOT = new THREE.Color(1, 1, 0.6);
// Reusable scratch colors — the per-vertex loop used to call `.clone()`
// twice per vertex (col1.clone().lerp(...), then .lerp(HOT, ...)), which for
// a 120x120 mesh x 2 meshes allocated ~29,000 throwaway Color objects every
// single frame. Reusing fixed scratch instances removes that GC churn
// entirely with no visual difference.
const _midC = new THREE.Color();

// Dual-mesh (solid + wireframe overlay) with 4-octave wave stack and
// height-driven vertex color interpolation, hot-peak blowout at crests.
// Ported from makeNoisePlane()/tickNoisePlane().
// NOTE: this is CPU-side vertex mutation every frame, same as the legacy
// build — flagged as a perf item for Phase 6 (GPU vertex-shader migration).
function makeGeo() {
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const base = Float32Array.from(geo.attributes.position.array);
  const cnt = geo.attributes.position.count;
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cnt * 3).fill(1), 3));
  return { geo, base };
}

export default function LavaSurface() {
  const { on, c1, c2, scale, height, opacity, speed, compOpacity, blendMode } = useStore((s) => s.noise);
  const solidRef = useRef();
  const wireRef = useRef();
  const frameCountRef = useRef(0);

  const { solidGeo, solidBase, wireGeo, wireBase } = useMemo(() => {
    const a = makeGeo();
    const b = makeGeo();
    return { solidGeo: a.geo, solidBase: a.base, wireGeo: b.geo, wireBase: b.base };
  }, []);

  useFrame((state) => {
    if (!on || !solidRef.current || !wireRef.current) return;
    const phase = getPhase(state.clock.elapsedTime);
    const t = phase * Math.PI * 2;
    const spd = speed / 100;
    const h = height;
    const sc = scale / 1200;
    const col1 = new THREE.Color(c1);
    const col2 = new THREE.Color(c2);

    // computeVertexNormals() over a 120x120 mesh is the expensive part here.
    // The wireframe overlay is unlit (MeshBasicMaterial) so its normals are
    // never used for shading — skip computing them entirely. The solid mesh
    // still needs them for MeshPhongMaterial lighting, but recomputed every
    // other frame is visually indistinguishable for this wave motion.
    frameCountRef.current++;
    const recomputeNormals = frameCountRef.current % 2 === 0;

    [
      { mesh: solidRef.current, base: solidBase, needsNormals: recomputeNormals },
      { mesh: wireRef.current, base: wireBase, needsNormals: false },
    ].forEach(({ mesh, base, needsNormals }) => {
      const pos = mesh.geometry.attributes.position;
      const col = mesh.geometry.attributes.color;
      for (let v = 0; v < pos.count; v++) {
        const ix = v * 3;
        const x = base[ix], z = base[ix + 2];
        const w =
          Math.sin(x * sc * 2.1 + t * 1.1 * spd) * Math.cos(z * sc * 1.7 - t * 0.8 * spd) * 0.42 +
          Math.sin(x * sc * 4.3 - t * 0.6 * spd + z * sc * 3.9) * 0.28 +
          Math.sin(x * sc * 1.1 + z * sc * 1.4 + t * 0.35 * spd) * 0.18 +
          Math.cos(x * sc * 7.0 + z * sc * 6.5 - t * 0.9 * spd) * 0.12;
        const y = w * h;
        pos.array[ix + 1] = y;

        const f = Math.max(0, Math.min(1, (w + 1) * 0.5));
        _midC.copy(col1).lerp(col2, f);
        if (f > 0.75) _midC.lerp(HOT, (f - 0.75) * 4);
        col.array[ix] = _midC.r;
        col.array[ix + 1] = _midC.g;
        col.array[ix + 2] = _midC.b;
      }
      pos.needsUpdate = true;
      col.needsUpdate = true;
      if (needsNormals) mesh.geometry.computeVertexNormals();
    });

    const opacityVal = opacity;
    const compOpacityVal = compOpacity;
    solidRef.current.material.opacity = (opacityVal / 100) * 0.85 * (compOpacityVal / 100);
    wireRef.current.material.opacity = (opacityVal / 100) * 0.25 * (compOpacityVal / 100);
  });

  if (!on) return null;

  return (
    <group position={[0, -160, 0]}>
      <mesh ref={solidRef} geometry={solidGeo}>
        <meshPhongMaterial
          vertexColors
          shininess={80}
          transparent
          opacity={(opacity / 100) * 0.85 * (compOpacity / 100)}
          depthWrite={false}
          side={THREE.DoubleSide}
          {...getBlendingProps(blendMode)}
        />
      </mesh>
      <mesh ref={wireRef} geometry={wireGeo}>
        <meshBasicMaterial
          vertexColors
          wireframe
          transparent
          opacity={(opacity / 100) * 0.25 * (compOpacity / 100)}
          depthWrite={false}
          {...getBlendingProps(blendMode)}
        />
      </mesh>
    </group>
  );
}
