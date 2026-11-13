import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../store/useStore';
import { getPhase } from './usePhase';

const FIXED_POS = new THREE.Vector3(0, 60, 450);
const _target = new THREE.Vector3();

// Orbital camera drift — ported from legacy tickCam(). Speed 0 (or near it)
// holds the camera at its default framing; otherwise it orbits the origin
// with a slight vertical bob.
//
// Also owns FOV reactivity: R3F's <Canvas camera={{...}}> prop re-applies
// changed props to the live camera object, but only calls
// camera.updateProjectionMatrix() when aspect/left/right/top/bottom change
// — NOT for fov alone (see @react-three/fiber's createCanvasStore). So
// passing a fresh `fov` value via the camera prop updates camera.fov but
// never recalculates the projection matrix, meaning the slider silently did
// nothing. Setting it here with an explicit updateProjectionMatrix() call
// fixes that.
export default function CameraController() {
  const { camera } = useThree();
  const drift = useStore((s) => s.scene.drift);
  const fov = useStore((s) => s.scene.fov);

  useEffect(() => {
    if ('fov' in camera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, fov]);

  useFrame((state, delta) => {
    const spd = drift / 100;
    if (spd < 0.01) {
      _target.copy(FIXED_POS);
    } else {
      const phase = getPhase(state.clock.elapsedTime);
      const t = phase * Math.PI * 2;
      _target.set(
        Math.sin(t * spd) * 420,
        60 + Math.sin(t * spd * 0.7) * 70,
        Math.cos(t * spd) * 420,
      );
    }
    // Damped approach rather than an instant set — this is what actually
    // fixes the visible jump when drift crosses from "orbiting" to "at rest"
    // (the two target positions aren't the same point, so a hard set was a
    // teleport every time the slider crossed that boundary).
    camera.position.lerp(_target, Math.min(1, delta * 4));
    camera.lookAt(0, 0, 0);
  });

  return null;
}
