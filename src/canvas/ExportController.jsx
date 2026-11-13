import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { exportBridge } from './exportBridge';

// Registers the live WebGL renderer + animation clock into exportBridge so
// the sidebar's Export panel (outside the Canvas) can call
// captureStream()/toDataURL() on the real canvas, and read the current
// loop phase to sync recording start.
export default function ExportController() {
  const { gl, clock } = useThree();
  useEffect(() => {
    exportBridge.gl = gl;
    exportBridge.clock = clock;
    return () => { exportBridge.gl = null; exportBridge.clock = null; };
  }, [gl, clock]);

  // Priority 2 — @react-three/postprocessing's <EffectComposer> (see
  // Effects.jsx) renders the scene itself via a useFrame at priority 1,
  // taking over R3F's default auto-render entirely whenever it's mounted.
  // R3F runs useFrame subscribers in ascending priority order, so a
  // priority of 2 here guarantees this callback fires strictly after the
  // composer has finished rendering + compositing every effect pass for
  // that frame — never mid-render.
  //
  // BUGFIX: previously, ExportPanel.jsx drove its own independent rAF loop
  // (outside the Canvas, with no knowledge of R3F's render timing) that
  // read gl.domElement directly via drawImage(). That loop could fire
  // before the composer had finished compositing a given frame, capturing
  // a partially-rendered/garbage intermediate buffer — this was the root
  // cause of the pixel/static corruption seen specifically during video
  // export (never in live preview, since preview never reads the canvas
  // back). Centralizing the capture here, timed relative to the actual
  // render, fixes it at the source.
  useFrame(() => {
    if (!exportBridge.captureActive || !exportBridge.targetCanvas) return;
    const target = exportBridge.targetCanvas;
    const ctx = target.getContext('2d');
    ctx.drawImage(gl.domElement, 0, 0, target.width, target.height);
  }, 2);

  return null;
}
