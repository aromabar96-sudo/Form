import { Canvas } from '@react-three/fiber';
import useStore from '../store/useStore';
import BlobLayer from './layers/BlobLayer';
import GridLayer from './layers/GridLayer';
import NodeLayer from './layers/NodeLayer';
import ParticleLayer from './layers/ParticleLayer';
import LavaSurface from './layers/LavaSurface';
import SilkRibbons from './layers/SilkRibbons';
import CrystalShards from './layers/CrystalShards';
import VoronoiCells from './layers/VoronoiCells';
import DNAHelix from './layers/DNAHelix';
import Wormhole from './layers/Wormhole';
import VolumetricSmoke from './layers/VolumetricSmoke';
import Effects from './effects/Effects';
import ExportController from './ExportController';
import FogController from './FogController';
import CameraController from './CameraController';
import BackgroundController from './BackgroundController';
import MouseController from './MouseController';
import AudioController from './AudioController';

// R3F Canvas wrapper — camera, lights, all 11 layers, and postprocessing.
// Mirrors the legacy init(): PerspectiveCamera at (0,60,450), fov from S.scene.fov,
// ambient + two directional lights (warm key + cool rim).
export default function Scene() {
  const fov = useStore((s) => s.scene.fov);

  return (
    <Canvas
      // antialias: false — this is a targeted fix for a bug reported ONLY
      // in the native Mac app (Tauri's WKWebView/system WebKit), never in
      // Chrome/Brave: with everything (all 11 layers, all effects) turned
      // off, leaving a fully blank canvas, white speckled static was still
      // visible. That rules out any layer or effect code — it points at
      // the base WebGL context config itself. antialias:true combined with
      // alpha:true + preserveDrawingBuffer:true (the latter two are
      // required for the export/screenshot pipeline's drawImage() capture
      // in ExportPanel.jsx, so those stay) is a known trigger for
      // incorrect MSAA resolve on some Mac GPUs specifically under Safari/
      // WebKit's WebGL2 implementation — this exact class of "snow" static
      // on an otherwise-empty WebGL canvas is a documented WebKit driver
      // quirk, not something that shows up under Chromium. dpr={[1,2]}
      // below already supersamples for sharpness, so disabling MSAA here
      // shouldn't cost visible quality in the browser build either.
      // UNVERIFIED: I can't run WebKit from this environment — this is
      // the leading, most likely explanation, not a confirmed root cause.
      // If static persists after this change, the cause is something else
      // and this should be reverted.
      gl={{ antialias: false, preserveDrawingBuffer: true, alpha: true }}
      camera={{ position: [0, 60, 450], fov, near: 0.1, far: 3000 }}
      // Cap at 2x — full native devicePixelRatio (often 2 on Retina, but can
      // be higher) burns GPU for export/animation with no visible benefit
      // beyond 2x. The legacy build hardcoded 1, which renders visibly soft
      // on any HiDPI display.
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        // TEMP DIAGNOSTIC — remove once the static/glitch corruption bug is
        // root-caused. If the canvas.domElement ever fires
        // 'webglcontextlost', that's a hard WebGL context loss (GPU driver
        // reset, out-of-memory, or a context-lost event from too many
        // active contexts) — a fundamentally different class of bug than a
        // JS-side resource leak, and would point at effect/render-target
        // churn rather than un-disposed geometries/textures. If it never
        // fires while the corruption is visible, we can rule this out.
        const canvas = gl.domElement;
        const onLost = (e) => {
          e.preventDefault();
          // eslint-disable-next-line no-console
          console.error('[FORM diagnostic] WebGL context LOST', e);
        };
        const onRestored = () => {
          // eslint-disable-next-line no-console
          console.warn('[FORM diagnostic] WebGL context RESTORED');
        };
        canvas.addEventListener('webglcontextlost', onLost, false);
        canvas.addEventListener('webglcontextrestored', onRestored, false);
      }}
    >
      <BackgroundController />

      <ambientLight intensity={0.6} />
      <directionalLight position={[200, 300, 200]} intensity={1.2} />
      <directionalLight position={[-200, -100, -300]} intensity={0.5} color="#5fc8e8" />

      {/* Tier 1 — Core Geometry */}
      <BlobLayer />
      <GridLayer />
      <NodeLayer />

      {/* Tier 2 — Particle & styled */}
      <ParticleLayer />
      <LavaSurface />
      <SilkRibbons />
      <CrystalShards />

      {/* Tier 3 — Shader-driven */}
      <VoronoiCells />
      <DNAHelix />
      <Wormhole />
      <VolumetricSmoke />

      <FogController />
      <CameraController />
      <MouseController />
      <AudioController />
      <Effects />
      <ExportController />
    </Canvas>
  );
}
