import { EffectComposer, Noise, Vignette, ChromaticAberration, Scanline } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';
import useStore from '../../store/useStore';

// Real WebGL postprocessing via @react-three/postprocessing (pmndrs) —
// replaces the legacy CSS drop-shadow/brightness bloom hack and the
// per-frame canvas grain overlay. See FORM-Studio-Plan.md:
// "Why CSS filters instead of EffectComposer for bloom?" — the r128
// UnrealBloomPass incompatibility that forced the CSS workaround doesn't
// exist here; this is a maintained library built for this exact purpose.
export default function Effects() {
  const grain = useStore((s) => s.grain);
  const vignette = useStore((s) => s.vignette);
  const chroma = useStore((s) => s.chroma);
  const scanlines = useStore((s) => s.scanlines);
  // Bloom removed — @react-three/postprocessing's Bloom pass (mipmapBlur
  // render-target chain) was measurably hindering export: the offscreen
  // draw-into-target loop in ExportPanel.jsx re-reads the composited
  // frame every tick, and Bloom's extra render passes were slow enough to
  // drop frames / stall recording, especially at higher resolutions. The
  // audio 'high' band no longer has a visual effect as a result — see
  // fieldConfig.js and useStore.js for the rest of the removal.
  //
  // BUGFIX: this used to `return null` (unmounting <EffectComposer>
  // entirely) whenever every individual effect was off, then remount a
  // fresh composer the moment any effect was switched back on. Each mount
  // allocates its own WebGL render-target chain, and each unmount has to
  // tear it down — repeatedly cycling that by toggling effects on/off is
  // exactly the kind of churn that leaks/corrupts GPU render targets on
  // some drivers, which is consistent with the garbage-pixel artifacts and
  // eventual freeze reported when flipping effect switches in combination
  // with layers. Fix: keep the composer permanently mounted once the
  // canvas exists, and only vary which effects are children — this way
  // the render-target chain is created once and reused, not repeatedly
  // torn down and rebuilt.
  // FOLLOW-UP BUGFIX: with the composer always mounted, the moment every
  // individual effect toggle is off, <EffectComposer> ends up with zero
  // <Effect> children -- just its own internal RenderPass and nothing else.
  // @react-three/postprocessing's pass-collection effect only ever calls
  // composer.addPass() for actual Effect/Pass children; with none present,
  // no EffectPass is added at all, an edge case some driver/library
  // combinations don't handle cleanly (stale or improperly-blitted render
  // targets -- consistent with corruption reported even in the browser,
  // not just the Mac app, ruling out a WebKit-specific cause). Fix: keep a
  // permanent, fully-invisible Vignette mounted at all times (darkness/
  // offset both 0 has no visible effect) so the pipeline always has at
  // least one real Effect pass and never hits the zero-pass edge case.
  return (
    <EffectComposer multisampling={0}>
      <Vignette darkness={0} offset={0} blendFunction={BlendFunction.NORMAL} />
      {grain.on ? (
        // 0.9 (was 0.4) — grain was too faint to register at most slider values.
        <Noise opacity={(grain.strength / 100) * 0.9} blendFunction={BlendFunction.OVERLAY} />
      ) : null}
      {chroma.on ? (
        // 0.015 (was 0.004) — max offset at 100% strength was only 0.004,
        // well under the ~0.01 UV-space threshold where chromatic
        // aberration actually becomes visible on screen.
        <ChromaticAberration
          offset={new Vector2((chroma.strength / 100) * 0.015, (chroma.strength / 100) * 0.015)}
        />
      ) : null}
      {scanlines.on ? (
        <Scanline density={Math.min(2, scanlines.count / 600)} opacity={scanlines.opacity / 100} />
      ) : null}
      {vignette.on ? (
        // Rescaled from the raw strength/100, softness/100 mapping — the
        // store's slider ranges (strength 1-40, softness 1-20) produced
        // darkness up to only 0.4 and offset up to only 0.2, which reads as
        // a thin dark ring hugging the very edge of the frame rather than a
        // smooth vignette falloff. Postprocessing's own defaults are
        // darkness=0.5, offset=0.5; these mappings land in a comparable,
        // clearly visible range across the full slider.
        <Vignette
          darkness={0.1 + (vignette.strength / 40) * 0.8}
          offset={0.1 + (vignette.softness / 20) * 0.5}
          blendFunction={BlendFunction.NORMAL}
        />
      ) : null}
    </EffectComposer>
  );
}
