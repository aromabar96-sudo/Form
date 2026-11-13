// Mutable singleton bridging the R3F-managed WebGL canvas + animation clock
// out to the sidebar's Export panel, which lives outside the <Canvas> tree
// and has no direct access to useThree(). Registered by ExportController.
export const exportBridge = {
  gl: null,
  clock: null,
  // When true, ExportController copies the freshly-rendered canvas into
  // targetCanvas every frame, timed to run strictly after rendering
  // completes (see ExportController.jsx). ExportPanel.jsx toggles this on
  // while recording/encoding and reads targetCanvas's contents — it never
  // reads gl.domElement directly anymore, since doing that from an
  // independent, uncoordinated rAF loop could race with the render/
  // postprocessing pipeline and capture a partially-composited frame.
  captureActive: false,
  targetCanvas: null,
};
