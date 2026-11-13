import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../store/useStore';
import useExportStore from '../store/useExportStore';
import { mouseBridge } from './mouseBridge';

// Unprojects the pointer to world space each frame and writes it into
// mouseBridge for layers (Blobs, Particles) to read imperatively — ported
// from the legacy "Mouse Repulsion" effect. Auto-disabled during export
// recording, matching the legacy comment ("Auto-disabled during export to
// preserve loop") since a moving pointer would break the seamless loop.
//
// The intersection plane faces the camera and passes through the world
// origin (recomputed every frame from the camera's forward vector) rather
// than a fixed world plane — the camera orbits via CameraController, so a
// fixed plane would make the mouse-to-world mapping feel wrong depending on
// drift angle.
export default function MouseController() {
  const { camera, pointer, mouse } = useThree();
  const on = useStore((s) => s.mouse.on);
  const raycasterRef = useRef(new THREE.Raycaster());
  const planeRef = useRef(new THREE.Plane());
  const forwardRef = useRef(new THREE.Vector3());

  useFrame(() => {
    const recording = useExportStore.getState().recording;
    if (!on || recording) {
      mouseBridge.active = false;
      return;
    }
    camera.getWorldDirection(forwardRef.current);
    planeRef.current.setFromNormalAndCoplanarPoint(forwardRef.current, new THREE.Vector3(0, 0, 0));

    const p = pointer ?? mouse;
    raycasterRef.current.setFromCamera(p, camera);
    const hit = raycasterRef.current.ray.intersectPlane(planeRef.current, mouseBridge.point);
    mouseBridge.active = hit !== null;
  });

  return null;
}
