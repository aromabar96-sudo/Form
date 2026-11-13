import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';

import { getPhase } from '../usePhase';
import { getBlendingProps } from '../../utils/blending';

const RIBBON_CP = 14;
const RIBBON_SEG = 80;
const RIBBON_SIDES = 5;

// Builds a BufferGeometry with the same vertex/index layout THREE.TubeGeometry
// produces (RIBBON_SEG segments x RIBBON_SIDES radial segments, closed), but
// with attribute arrays we own and can rewrite in place every frame. This
// replaces the old approach of calling `new THREE.TubeGeometry(...)` every
// frame, which allocates a brand-new geometry + position/normal/uv/index
// buffers each time — the perf bottleneck flagged in FORM-Studio-Plan.md.
// Reusing one geometry per ribbon and only touching its typed arrays cuts
// per-frame GC pressure dramatically for the same visual result.
function createTubeGeometry() {
  const segments = RIBBON_SEG;
  const radialSegments = RIBBON_SIDES;
  const vertexCount = (segments + 1) * (radialSegments + 1);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(vertexCount * 2), 2));
  geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3));

  const indices = [];
  for (let j = 1; j <= segments; j++) {
    for (let i = 1; i <= radialSegments; i++) {
      const a = (radialSegments + 1) * (j - 1) + (i - 1);
      const b = (radialSegments + 1) * j + (i - 1);
      const c = (radialSegments + 1) * j + i;
      const d = (radialSegments + 1) * (j - 1) + i;
      indices.push(a, b, d, b, c, d);
    }
  }
  geometry.setIndex(indices);
  return geometry;
}

// Reusable scratch objects so updateTubeGeometry allocates nothing per call.
const _P = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _color = new THREE.Color();

function updateTubeGeometry(geometry, curve, radius, ca, cb) {
  const segments = RIBBON_SEG;
  const radialSegments = RIBBON_SIDES;
  const frames = curve.computeFrenetFrames(segments, true);
  const { normals, binormals } = frames;

  const posArr = geometry.attributes.position.array;
  const normArr = geometry.attributes.normal.array;
  const uvArr = geometry.attributes.uv.array;
  const colorArr = geometry.attributes.color.array;

  let vIdx = 0;
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    curve.getPointAt(u, _P);
    const N = normals[i];
    const B = binormals[i];
    const f = (Math.sin(u * Math.PI * 2) + 1) * 0.5;
    _color.copy(ca).lerp(cb, f);

    for (let j = 0; j <= radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2;
      const sin = Math.sin(v);
      const cos = -Math.cos(v);

      _normal.x = cos * N.x + sin * B.x;
      _normal.y = cos * N.y + sin * B.y;
      _normal.z = cos * N.z + sin * B.z;
      _normal.normalize();

      const idx3 = vIdx * 3;
      posArr[idx3] = _P.x + radius * _normal.x;
      posArr[idx3 + 1] = _P.y + radius * _normal.y;
      posArr[idx3 + 2] = _P.z + radius * _normal.z;

      normArr[idx3] = _normal.x;
      normArr[idx3 + 1] = _normal.y;
      normArr[idx3 + 2] = _normal.z;

      colorArr[idx3] = _color.r;
      colorArr[idx3 + 1] = _color.g;
      colorArr[idx3 + 2] = _color.b;

      uvArr[vIdx * 2] = u;
      uvArr[vIdx * 2 + 1] = j / radialSegments;

      vIdx++;
    }
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.normal.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;
  geometry.attributes.uv.needsUpdate = true;
  geometry.computeBoundingSphere();
}

// Proper tube geometry on closed CatmullRomCurve3 paths, vertex color
// gradient along length. Ported from makeRibbons()/tickRibbons(). Geometry
// buffers are now persistent per ribbon (see createTubeGeometry/
// updateTubeGeometry above) instead of rebuilt from scratch every frame.
export default function SilkRibbons() {
  const { on, c1, c2, c3, count, turb, speed, compOpacity, blendMode } = useStore((s) => s.ribbons);
  const audioOn = useStore((s) => s.audio.on);
  const mid = useStore((s) => s.audio.mid);
  const groupRef = useRef();
  const frameCountRef = useRef(0);
  const geometriesRef = useRef([]);

  const _colA = useMemo(() => new THREE.Color(), []);
  const _colB = useMemo(() => new THREE.Color(), []);

  // Colors deliberately excluded from this memo's deps — palette is
  // re-blended every frame from the live store values (see useFrame below)
  // instead of baked in once, so geometry doesn't need to reset just
  // because a color slider changes.
  const ribbonData = useMemo(() => {
    // BUGFIX: mesh.geometry is assigned imperatively in the ref callback
    // below (needed so the geometry buffer persists across frames instead
    // of being rebuilt — see createTubeGeometry/updateTubeGeometry above).
    // React Three Fiber only auto-disposes a geometry when the <mesh>
    // element itself unmounts; when only `count` changes, indices that
    // persist keep the same React key and the same underlying mesh, so it
    // never unmounts — meaning the old geometry object was silently
    // dropped here with no .dispose() call, leaking its GPU buffers every
    // single time the ribbon count changed. Explicitly disposing before
    // clearing the array fixes that.
    geometriesRef.current.forEach((geo) => geo?.dispose());
    geometriesRef.current = [];
    return Array.from({ length: count }, (_, i) => {
      const s = i * 73.19;
      const cp = Array.from({ length: RIBBON_CP }, (_, p) => new THREE.Vector3(
        Math.sin(s + p * 0.71) * 220,
        Math.cos(s * 0.53 + p * 0.49) * 110,
        Math.sin(s * 1.17 + p * 0.63) * 190,
      ));
      return { s, cp, i, radius: 1.5 + (i % 3) * 1.2 };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  useFrame((state) => {
    if (!on || !groupRef.current) return;
    // Updating at 30fps (vs 60fps) is visually indistinguishable for this
    // motion and roughly halves CPU cost of the curve/frame-frame math below.
    frameCountRef.current++;
    if (frameCountRef.current % 2 !== 0) return;
    const phase = getPhase(state.clock.elapsedTime);
    const t = phase * Math.PI * 2;
    const spd = speed / 100;
    // Mid -> ribbon turbulence (legacy audio-reactive mapping) — additive
    // on top of the manual Turbulence slider value.
    const turbAmt = turb / 100 + (audioOn ? mid * 0.8 : 0);
    const opacityVal = 0.45 * (compOpacity / 100);
    const palette = [c1, c2, c3];

    groupRef.current.children.forEach((mesh, i) => {
      const d = ribbonData[i];
      const geometry = geometriesRef.current[i];
      if (!d || !geometry) return;
      mesh.material.opacity = opacityVal;
      const tt = t * spd + d.s;
      const newCp = d.cp.map((_, p) => new THREE.Vector3(
        Math.sin(d.s + p * 0.71 + tt * 0.7) * 220 + Math.sin(tt * 1.1 + p) * turbAmt * 55,
        Math.cos(d.s * 0.53 + p * 0.49 + tt * 0.55) * 110 + Math.cos(tt * 0.8 + d.s) * turbAmt * 28,
        Math.sin(d.s * 1.17 + p * 0.63 + tt * 0.5) * 190 + Math.sin(tt * 0.9 + p * 0.4) * turbAmt * 40,
      ));
      const curve = new THREE.CatmullRomCurve3(newCp, true);
      _colA.set(palette[d.i % palette.length]);
      _colB.set(palette[(d.i + 1) % palette.length]);
      updateTubeGeometry(geometry, curve, d.radius, _colA, _colB);
    });
  });

  if (!on) return null;

  return (
    <group ref={groupRef}>
      {ribbonData.map((d, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            if (mesh && !geometriesRef.current[i]) {
              const geometry = createTubeGeometry();
              const curve = new THREE.CatmullRomCurve3(d.cp, true);
              const palette = [c1, c2, c3];
              const ca = new THREE.Color(palette[d.i % palette.length]);
              const cb = new THREE.Color(palette[(d.i + 1) % palette.length]);
              updateTubeGeometry(geometry, curve, d.radius, ca, cb);
              geometriesRef.current[i] = geometry;
              mesh.geometry = geometry;
            }
          }}
        >
          <meshBasicMaterial
            vertexColors
            transparent
            opacity={0.45 * (compOpacity / 100)}
            depthWrite={false}
            side={THREE.DoubleSide}
            {...getBlendingProps(blendMode)}
          />
        </mesh>
      ))}
    </group>
  );
}
