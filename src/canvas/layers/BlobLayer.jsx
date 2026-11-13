import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import { getPhase } from '../usePhase';
import { getBlendingProps } from '../../utils/blending';
import { mouseBridge } from '../mouseBridge';

// Icosahedra with per-vertex noise displacement, orbiting the scene origin.
// Ported from makeBlobs()/tickBlobs() in legacy/form-studio-3.html.
// All animation is phase-based (elapsed % LOOP_DURATION / LOOP_DURATION) so
// exports loop seamlessly — see FORM-Studio-Plan.md "Why phase-based animation?"
//
// DEVIATION FROM LEGACY: the legacy build scales a unit-radius (1) icosahedron
// by only ~0.5-1.3x (`bs`), which is a genuinely tiny sphere (~1-2.6 units
// across) relative to this scene's other proportions — orbit radius is
// 55-193 units and the grid spans 700 units. That produced barely-visible
// "dots" rather than blobs. BASE_SCALE brings them up to a size that reads
// clearly as the intended hero layer without dominating the composition;
// this is a deliberate visual fix, not a 1:1 port of that constant.
const BASE_SCALE = 26;

// REVERTED: this used to displace vertices via a custom onBeforeCompile
// vertex shader injection on the GPU instead of the CPU loop below, to cut
// the CPU cost of walking 2562 vertices x blob count every other frame.
// Reverted back to plain CPU displacement as a diagnostic step: raw shader
// chunk injection is the one place in this codebase hand-writing GLSL, and
// malformed/incompatible shader injection can silently corrupt rendering on
// some GPU/driver combinations with no catchable JS or WebGL error — which
// matches a static/corruption bug reported with no console errors at all.
// If the corruption is confirmed gone after this revert, that confirms the
// shader was the cause and a corrected version can be re-introduced
// carefully; if it persists, the cause is elsewhere and this can be
// re-optimized back to the GPU version.
export default function BlobLayer() {
  const { on, cA, cB, cC, count, size, noise, speed, compOpacity, blendMode } = useStore((s) => s.blobs);
  const mouseOn = useStore((s) => s.mouse.on);
  const mouseForce = useStore((s) => s.mouse.force);
  const mouseRadius = useStore((s) => s.mouse.radius);
  const audioOn = useStore((s) => s.audio.on);
  const bass = useStore((s) => s.audio.bass);
  const groupRef = useRef();

  // Per-blob static params (orbit radius/speed/phase, axis, base scale ratio,
  // blend fraction) — regenerated only when count changes, matching legacy
  // makeBlobs(). Colors are deliberately excluded so they can be re-blended
  // every frame from the live eased spring values instead of a stale memo.
  const blobs = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const s = i * 97.31;
      return {
        s,
        orR: 55 + (i % 5) * 28,
        orS: 0.8 + (i % 4) * 0.4,
        orP: s,
        bsRatio: 0.5 + (i % 5) * 0.2,
        colorFrac: i / count,
        colorIdx: i % 3,
      };
    });
  }, [count]);

  // Geometry base positions cached per-mesh for noise displacement (avoids
  // rebuilding IcosahedronGeometry every frame).
  const basesRef = useRef([]);
  const frameCountRef = useRef(0);
  const _colA = useMemo(() => new THREE.Color(), []);
  const _colB = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    if (!on || !groupRef.current) return;
    // Noise displacement + computeVertexNormals over 2562-vertex icosahedra
    // (x count blobs) every frame is the main CPU cost here — throttle the
    // expensive per-vertex work to every other frame; position/rotation/scale
    // (cheap) still update every frame so orbit motion stays smooth.
    frameCountRef.current++;
    const doNoise = frameCountRef.current % 2 === 0;
    const phase = getPhase(state.clock.elapsedTime);
    const t = phase * Math.PI * 2;
    const spd = speed / 100;
    const nAmt = noise / 100;
    const sizeRatio = size / 100;
    const opacityVal = 0.88 * (compOpacity / 100);
    const cols = [cA, cB, cC];

    groupRef.current.children.forEach((mesh, i) => {
      const u = blobs[i];
      if (!u) return;

      mesh.material.opacity = opacityVal;
      Object.assign(mesh.material, getBlendingProps(blendMode));
      // Re-blend this blob's color every frame from the live eased palette
      // (was baked once from cA/cB/cC at mount) so color slider changes
      // ease in smoothly like every other parameter.
      _colA.set(cols[u.colorIdx]);
      _colB.set(cols[(u.colorIdx + 1) % 3]);
      _colA.lerp(_colB, u.colorFrac);
      mesh.material.color.copy(_colA);
      mesh.material.emissive.copy(_colA).multiplyScalar(0.12);

      const ot = t * u.orS * spd + u.orP;
      mesh.position.set(
        Math.cos(ot) * u.orR,
        Math.sin(ot * 1.3) * u.orR * 0.5,
        Math.sin(ot) * u.orR * 0.7,
      );
      mesh.rotation.x = t * 0.5 * spd + u.s;
      mesh.rotation.y = t * 0.35 * spd + u.s * 0.5;
      // Bass -> blob scale (legacy: "Bass -> blob scale, Mid -> ribbon
      // turbulence, High -> bloom strength"). Additive on top of the
      // existing idle pulse so blobs still breathe gently with audio off.
      const bassPulse = audioOn ? 1 + bass * 0.5 : 1;
      const pulse = (1 + Math.sin(t * 1.5 * spd + u.s) * 0.07) * bassPulse;
      mesh.scale.setScalar(u.bsRatio * sizeRatio * pulse * BASE_SCALE);

      // Mouse repulsion — pushes blobs away from the unprojected pointer
      // position within `mouseRadius`, falling off linearly to the edge.
      // Applied as a position offset on top of the orbit path rather than
      // mutating the orbit itself, so the loop-safe orbit is unaffected
      // once the pointer leaves (and during export, since mouseBridge.active
      // is forced false while recording — see MouseController.jsx).
      if (mouseOn && mouseBridge.active) {
        const dx = mesh.position.x - mouseBridge.point.x;
        const dy = mesh.position.y - mouseBridge.point.y;
        const dz = mesh.position.z - mouseBridge.point.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;
        if (dist < mouseRadius) {
          const falloff = 1 - dist / mouseRadius;
          const push = (mouseForce / 100) * falloff * 40;
          mesh.position.x += (dx / dist) * push;
          mesh.position.y += (dy / dist) * push;
          mesh.position.z += (dz / dist) * push;
        }
      }

      if (nAmt > 0 && doNoise) {
        const geo = mesh.geometry;
        const base = basesRef.current[i];
        if (!base) return;
        const pos = geo.attributes.position;
        for (let v = 0; v < pos.count; v++) {
          const ix = v * 3;
          const bx = base[ix], by = base[ix + 1], bz = base[ix + 2];
          const ln = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
          const nx = bx / ln, ny = by / ln, nz = bz / ln;
          const d = (nAmt * 0.6 *
            (Math.sin(nx * 4 + t * 2 + u.s) +
             Math.sin(ny * 5 - t * 1.7 + u.s * 1.1) +
             Math.sin(nz * 3.5 + t * 2.3))) / 3;
          pos.array[ix] = bx * (1 + d);
          pos.array[ix + 1] = by * (1 + d);
          pos.array[ix + 2] = bz * (1 + d);
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
      }
    });
  });

  if (!on) return null;

  return (
    <group ref={groupRef}>
      {blobs.map((b, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            if (mesh && !basesRef.current[i]) {
              basesRef.current[i] = Float32Array.from(mesh.geometry.attributes.position.array);
            }
          }}
        >
          <icosahedronGeometry args={[1, 4]} />
          <meshPhysicalMaterial
            roughness={0.3}
            metalness={0.1}
            clearcoat={0.5}
            transparent
            opacity={0.88 * (compOpacity / 100)}
            {...getBlendingProps(blendMode)}
          />
        </mesh>
      ))}
    </group>
  );
}
