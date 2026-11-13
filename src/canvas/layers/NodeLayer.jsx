import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';

import { getPhase } from '../usePhase';
import { getBlendingProps } from '../../utils/blending';

const R = 200;

// Orbiting point cloud with proximity-linked lines.
// Ported from makeNodes()/tickNodes().
export default function NodeLayer() {
  const { on, nc, lc, count, link, speed, compOpacity, blendMode } = useStore((s) => s.nodes);
  const pointsRef = useRef();
  const linesRef = useRef();

  const nodeData = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const s = i * 53.71;
        return {
          s,
          th: ((s % 360) * Math.PI) / 180,
          ph: (((s * 1.7) % 180) * Math.PI) / 180,
          r: R * (0.25 + (i % 7) / 7 * 0.75),
          sm: 0.4 + (i % 5) * 0.2,
        };
      }),
    [count],
  );

  const pointsGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return geo;
  }, [count]);

  const linesGeo = useMemo(() => new THREE.BufferGeometry(), []);

  useFrame((state) => {
    if (!on || !pointsRef.current || !linesRef.current) return;
    const phase = getPhase(state.clock.elapsedTime);
    const t = phase * Math.PI * 2;
    const spd = speed / 100;
    const linkDist = link;
    const opacityVal = compOpacity;

    const pa = pointsGeo.attributes.position.array;
    const pts = [];
    nodeData.forEach((d, i) => {
      const ot = t * d.sm * spd + d.s;
      const th = d.th + ot * 0.35;
      const ph = d.ph + Math.sin(ot) * 0.25;
      const x = d.r * Math.sin(ph) * Math.cos(th);
      const y = d.r * Math.cos(ph) * 0.65;
      const z = d.r * Math.sin(ph) * Math.sin(th);
      pa[i * 3] = x;
      pa[i * 3 + 1] = y;
      pa[i * 3 + 2] = z;
      pts.push(new THREE.Vector3(x, y, z));
    });
    pointsGeo.attributes.position.needsUpdate = true;

    const lp = [];
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        if (pts[i].distanceTo(pts[j]) < linkDist) {
          lp.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
        }
      }
    }
    linesGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lp), 3));

    pointsRef.current.material.opacity = 0.85 * (opacityVal / 100);
    pointsRef.current.material.color.set(nc);
    linesRef.current.material.opacity = 0.22 * (opacityVal / 100);
    linesRef.current.material.color.set(lc);
  });

  if (!on) return null;

  return (
    <group>
      <points ref={pointsRef} geometry={pointsGeo}>
        <pointsMaterial color={nc} size={5} transparent opacity={0.85 * (compOpacity / 100)} {...getBlendingProps(blendMode)} />
      </points>
      <lineSegments ref={linesRef} geometry={linesGeo}>
        <lineBasicMaterial color={lc} transparent opacity={0.22 * (compOpacity / 100)} {...getBlendingProps(blendMode)} />
      </lineSegments>
    </group>
  );
}
