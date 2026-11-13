# FORM Studio (React + R3F rewrite)

Migration of the single-file `legacy/form-studio-3.html` prototype into a
proper Vite + React + React Three Fiber app. See `docs/FORM-Studio-Plan.md`
for the full migration plan and roadmap (Phases 1–7, including the planned
Tauri-based Mac app).

## Setup

```
npm install
npm run dev
```

## Status

- [x] Phase 1 — Project scaffold, dependencies, Cobalt Sky CSS ported, Zustand store, blank R3F scene renders
- [x] Phase 2 — Core layers (Blobs, Grid, Nodes, Particles) ported to R3F; real WebGL postprocessing (Bloom, Grain, Chromatic Aberration, Vignette) via @react-three/postprocessing; devicePixelRatio fixed (was hardcoded to 1 in the legacy build — capped at 2 now for sharper HiDPI rendering without over-spending GPU)
- [x] Phase 3 — All 7 remaining layers ported: LavaSurface, SilkRibbons, CrystalShards (dual-mesh, CPU-side, matching legacy), VoronoiCells, Wormhole, VolumetricSmoke (GLSL shaders, split into .glsl files imported via Vite ?raw), DNAHelix (static geometry + rotation). All 11 layers now render.
- [x] Phase 4 — Sidebar UI built: reusable Toggle/RangeSlider/ColorSwatch, generic accordion + metadata-driven panels for all 11 layers + 9 effects (bloom, fog, grain, chroma, vignette, scanlines, mouse, audio, cycle), slider ranges copied verbatim from legacy input attrs, Lucide icons per layer. Live active-layer count in the group label. (Preset/scene/background panels deferred to Phase 5.)
- [x] Phase 5 — Complete. Undo/redo (zundo, Cmd+Z/Cmd+Shift+Z), preset system (save/load/delete/export/import JSON, localStorage), per-layer randomize (dice button), layer opacity + 4 blend modes (normal/additive/multiply/screen) on all 11 geometry layers via `compOpacity`/`blendMode` store fields and `utils/blending.js`, timeline scrubber (drag to preview any moment in the loop, Space to play/pause, `scrubOverride` in the store overrides the live clock for every layer's `getPhase()` call), Export panel with WebM (captureStream+MediaRecorder) AND in-browser MP4 (WebCodecs VideoEncoder + mp4-muxer, Chrome/Edge only — falls back to a status message elsewhere), loop-synced record start (waits for phase<0.03), PNG screenshot.
- [x] Phase 6 — Deploy readiness: vite.config.js splits the three.js/R3F vendor bundle into its own chunk for better caching, vercel.json added (framework: vite, outputDirectory: dist). Not yet actually deployed to a live URL — run `vercel --prod` from this folder, or connect the repo in the Vercel dashboard, when ready to go live.
- [~] Phase 7 — Mac app (Tauri). Scaffolded and configured (see "Mac App" below), but **not built** — that step has to happen on an actual Mac, see why below.

`node_modules/` is intentionally not included here — run `npm install` after
pulling this folder onto another machine.

## Deploy

```
npm install -g vercel   # if not already installed
vercel --prod
```

Or connect this folder as a project in the Vercel dashboard — `vercel.json`
already points it at `npm run build` / `dist`.

## Mac App (Tauri)

The native macOS shell is fully scaffolded and configured — `src-tauri/`
contains the Rust project, `tauri.conf.json`, and a generated icon set
(including `icon.icns`). **It could not be built or tested from this
environment**: producing a `.app`/`.dmg` requires Xcode's toolchain
(WebKit headers, code signing tools, `lipo` for merging the two
architectures into a universal binary), which only exists on macOS — the
sandbox this was built in is Linux. Everything below has to be run on your
own Mac.

### One-time setup (on your Mac)

```
# 1. Install Rust, if you don't already have it
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. Add both Apple architectures — required for a universal binary
rustup target add aarch64-apple-darwin x86_64-apple-darwin

# 3. Install Xcode Command Line Tools, if you don't already have them
xcode-select --install
```

### Run it as a native window (dev mode, no build)

```
npm install
npm run mac:dev
```

This opens FORM in an actual native macOS window (system WebKit, not a
browser tab) while still hot-reloading from the Vite dev server —
useful for checking things like window sizing and native menu behavior
before doing a full build.

### Build the universal .app / .dmg

```
npm run mac:build
```

This runs `tauri build --target universal-apple-darwin`, which builds
both the Apple Silicon and Intel binaries and merges them with `lipo`
into a single universal binary — the same app runs natively on both chip
architectures without Rosetta. Output lands in
`src-tauri/target/universal-apple-darwin/release/bundle/` — both `macos/`
(the raw `.app`) and `dmg/` (the installer disk image).

### Code signing + notarization (needed before sharing outside your own Mac)

The build above produces a working, launchable `.app`, but macOS
Gatekeeper will flag it as from an "unidentified developer" if you try to
open it on another Mac (or even your own, downloaded from elsewhere)
without this step:

```
# Requires an active Apple Developer Program membership ($99/yr)
# 1. Set your signing identity in tauri.conf.json's bundle.macOS.signingIdentity,
#    or export it as an env var before building:
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"

npm run mac:build

# 2. Notarize the signed .dmg with Apple
xcrun notarytool submit src-tauri/target/universal-apple-darwin/release/bundle/dmg/FORM_0.1.0_universal.dmg \
  --apple-id you@example.com --team-id TEAMID --password APP_SPECIFIC_PASSWORD --wait

# 3. Staple the notarization ticket to the .dmg
xcrun stapler staple src-tauri/target/universal-apple-darwin/release/bundle/dmg/FORM_0.1.0_universal.dmg
```

Without this, the app still runs fine on your own machine — Gatekeeper's
warning is a one-time right-click → Open bypass, not a hard block — but
notarization is worth doing before sending the `.dmg` to anyone else.

### What's NOT done yet

The native shell wraps the exact same web app — every layer, effect,
undo/redo, and the export panel work identically to the browser version.
Per the original Phase 7 plan (`docs/FORM-Studio-Plan.md`), these
native-only upgrades are still open, and are meaningful follow-up work,
not quick additions:

- **Native export path** — currently export still goes through the
  browser's WebM/MP4 pipeline (Phase 5) even inside the native shell.
  Wiring up Tauri's `dialog.save()` + direct filesystem write, and
  bundling `ffmpeg` as a sidecar binary for real local MP4 encoding
  (removing the WebCodecs browser-support dependency entirely), hasn't
  been started.
- **Native preset persistence** — presets still save to `localStorage`
  even in the native app; saving to
  `~/Library/Application Support/FORM/` instead hasn't been wired up.
- A `useIsTauri()` hook (`src/hooks/useIsTauri.js`) exists and is
  already wired into the info bar (shows "· Mac App" when running
  natively) — it's the capability check both of the above would branch
  on when implemented.

## Known gaps (as of this pass)

- **[UNVERIFIED — needs testing]** Reported in the native Mac app only
  (never in Brave/Chrome): white speckled static visible on the canvas.
  Isolated via testing — persisted even with all 11 layers and all
  effects turned off (fully blank canvas), which rules out any
  layer/effect code and points at the base WebGL context config. Set
  `antialias: false` in `Scene.jsx`'s Canvas `gl` prop (`alpha` and
  `preserveDrawingBuffer` stay `true` — both are required by
  `ExportPanel.jsx`'s `drawImage()`-based capture). This targets a known
  class of WebKit/WKWebView bug where `antialias:true` combined with
  those two flags causes incorrect MSAA resolve on some Mac GPUs,
  producing exactly this kind of static — a driver-level quirk specific
  to Safari's engine, not something Chromium hits. **This could not be
  tested from the build environment** (no macOS/WebKit available) — it's
  the leading, most likely explanation based on known WebKit behavior,
  not a confirmed fix. Needs a real test in `npm run mac:dev` before
  treating this as resolved.

- Fixed Square and Story/Reels not fitting the frame at all — screenshot
  showed the canvas just filling the ENTIRE viewport rectangle regardless
  of the selected aspect ratio, ignoring the resolution picker completely.
  Root cause: the previous fix (`position:absolute` + `inset` on all four
  sides + `margin:auto` + `aspect-ratio`) was expected to behave like
  `object-fit:contain` on an `<img>`, but that trick only works for
  replaced elements or specific auto-sizing cases — for a plain
  (non-replaced) absolutely positioned box with ALL FOUR insets set,
  browsers just stretch it to fill the inset box and use `aspect-ratio`
  only to derive a missing dimension, not to "contain" both. It happened
  to look correct for landscape resolutions purely because the browser
  window itself is landscape-shaped (coincidence, not a real fit) — Square
  and Story/Reels exposed the bug immediately since there's no such
  coincidence for those ratios.
  FIX: stopped relying on CSS auto-sizing for this entirely. `App.jsx` now
  computes the fit in JS — a `ResizeObserver` on `#viewport` re-runs the
  same width/height "contain" arithmetic `object-fit: contain` does
  internally (`availRatio > targetRatio` → height-constrained,
  else → width-constrained) and sets `#canvas-wrap`'s width/height as
  definite pixel values. No CSS ambiguity left to get wrong, and it
  re-fits automatically on window resize or resolution changes.

- Fixed the canvas rendering way too small. The previous fit-to-frame fix
  (width/height: 'auto' + maxWidth/maxHeight) actually caused this: for a
  flex item with align-items:center (not stretch), width:auto sizes from
  CONTENT (fit-content), and `#canvas-wrap`'s only child (the R3F canvas)
  is itself sized as 100%/100% of ITS parent — a circular reference with
  no real intrinsic size to measure from, so the browser fell back to a
  near-minimal box that never grew toward the max-width/max-height
  ceiling. Switched to `position: absolute; inset: 20px; margin: auto;`
  instead — this gives the box a definite containing block (the viewport
  area minus a 20px margin) to size against, and combined with
  `aspect-ratio`, modern browsers resolve width/height:auto the same way
  `object-fit: contain` works on an `<img>`: the largest box that fits
  inside the bounds while preserving the exact ratio, centered
  automatically. No content-size circularity, no arbitrary resolution-px
  cap — the frame now genuinely fills the available viewport space.

- Removed the preview zoom feature entirely (state, +/-/Fit controls,
  CSS transform, and the defensive wheel listener that existed only to
  guard it) — `App.jsx` and `cobalt-sky.css`'s `#zoom-controls` block.
  `#canvas-wrap` still fits the selected export resolution to the
  viewport on both axes (that fix stands on its own, unrelated to zoom).

- Found the ACTUAL cause of "the canvas zooms in/out while scrolling the
  sidebar" — took three passes to land on it:
  1. First hypothesis: trackpad pinch fires wheel events with
     `ctrlKey: true`; unintercepted, that triggers the browser's own page
     zoom. Added a wheel listener routing `ctrlKey` events into our zoom
     state. Didn't fix it.
  2. Second hypothesis: `ctrlKey` was arriving `true` on plain scroll (an
     OS/trackpad-driver quirk), so our handler was calling `zoomOut()` on
     ordinary scrolling. Stopped wheel events from touching our zoom state
     at all — button-only zoom now. Still didn't fix it, which was the
     tell that the bug was never in our zoom feature to begin with.
  3. Actual cause: Chromium (Chrome/Brave/Edge) silently changes a hovered
     `<input type="range">`'s value on mouse-wheel scroll — a known browser
     quirk, unrelated to focus. Every slider in the sidebar (FOV, Camera
     Drift, etc.) is a plain `<input type="range">` sitting inside the
     scrollable sidebar list, so scrolling the list naturally drags the
     cursor across sliders as content passes underneath it, nudging
     whichever one it's over. The Camera FOV slider getting nudged is
     literally a camera zoom change — which is exactly what looked like
     "the canvas zooming," completely independent of our own zoom control
     (explaining why passes 1 and 2 had no effect).
  Fix: `onWheel={(e) => e.preventDefault()}` on both range inputs
  (`RangeSlider.jsx` and `TimelinePanel.jsx`'s scrubber) — this is the
  standard workaround for this Chromium behavior. Trade-off: the sidebar
  list won't scroll for the specific wheel tick where the cursor is
  directly over a slider (same default action is being suppressed), but
  resumes scrolling normally as soon as the cursor passes off it — a minor
  hitch versus every slider you scroll past silently drifting.

- Removed Bloom entirely (was hindering export). `@react-three/postprocessing`'s
  Bloom pass (mipmapBlur render-target chain, multiple downsample/upsample
  passes) was slow enough to drop frames / stall recording — ExportPanel's
  draw-into-offscreen-target loop re-reads the composited frame every tick,
  so any extra composited-render cost there hits export directly, more than
  it hits the live preview. Deleted from `Effects.jsx`, the sidebar
  (`fieldConfig.js`'s `EFFECT_FIELDS`), and the store defaults
  (`useStore.js`) rather than just hiding the toggle, since the store field
  was default-`on: true` — leaving it in would have silently kept costing
  render time for anyone who hadn't touched the panel. The Audio Reactive
  "High → bloom strength" mapping no longer has a visual effect as a
  result (bass→blob scale and mid→ribbon turbulence are unaffected).

- Renamed export resolution labels to say what they're for:
  "1920×1080 (Landscape)", "1080×1080 (Square)", "1080×1920 (Story/Reels)" —
  previously just raw pixel dimensions with no context.

- Fixed the canvas not fitting portrait frame dimensions: `#canvas-wrap`
  had a definite `width: '100%'` in its inline style, which forced the
  browser to resolve height purely from `aspect-ratio` and ignore
  `maxHeight` — fine for landscape frames but a 1080×1920 (Story/Reels)
  frame could compute a height taller than the viewport and get cut off.
  Switched to `width/height: auto` with both `maxWidth` and `maxHeight`
  set (via CSS `min()`), which lets the browser's aspect-ratio sizing
  algorithm fit the box within both axes at once, on any orientation.

- Added preview zoom: a floating control (bottom-right... top-right of the
  viewport) with -/+ buttons, a percentage readout, and a Fit button.
  Scales the already-frame-fitted `#canvas-wrap` via CSS `transform: scale()`
  — this is a preview-only zoom (doesn't change actual render/export
  resolution), same idea as zooming a canvas in a design tool. Range
  25%–200%; click the percentage or the Fit icon to reset to 100% (the
  frame fitted to the viewport). Known limitation: zooming past 100% can
  visually overflow `#canvas-wrap`'s container since there's no pan/scroll
  wired up yet — fine for a quick zoom-in glance, not yet a full pan-and-zoom
  canvas.

- Vignette's `darkness`/`offset` were scaled by raw `/100` against store
  ranges that only go up to 40 (strength) and 20 (softness), producing max
  values of 0.4/0.2 — below the postprocessing library's own defaults
  (0.5/0.5) — so the edge darkening read as a thin ring instead of a smooth
  falloff. Rescaled to `darkness={0.1 + (strength/40)*0.8}`,
  `offset={0.1 + (softness/20)*0.5}`.

- Implemented Mouse Repulsion (was a placeholder toggle with no effect):
  `MouseController.jsx` (mounted inside `<Canvas>`) raycasts the pointer
  each frame onto a plane that faces the camera and passes through the
  world origin (recomputed every frame from the camera's forward vector,
  since the camera orbits via Camera Drift — a fixed-plane approach would
  make the mapping feel wrong depending on drift angle), and writes the
  world-space hit into `mouseBridge` (same mutable-singleton bridge pattern
  as `exportBridge`). `BlobLayer` and `ParticleLayer` read `mouseBridge`
  in their existing `useFrame` loops and add a linear-falloff push away
  from the pointer, scaled by the Force/Radius sliders. Auto-disabled
  during export recording (checks `useExportStore.getState().recording`)
  so a moving pointer can't break the seamless loop.

- Implemented Audio Reactive (was a placeholder toggle with no effect):
  `AudioController.jsx` requests `getUserMedia({audio:true})` lazily (only
  when the toggle is switched on, not on app load) and feeds the stream
  into a Web Audio `AnalyserNode`, averaging the frequency spectrum into
  three bands (bass/mid/high) written to the store at ~20Hz. Wired per the
  legacy mapping: Bass → blob scale pulse (`BlobLayer`), Mid → ribbon
  turbulence (`SilkRibbons`), High → bloom intensity (`Effects`) — each
  additive on top of its existing manual slider value. Mic permission
  denial or an unsupported browser fails closed (bands stay 0, logged via
  `console.warn`) rather than throwing. The `audio` store key is excluded
  from the undo/redo history (`useStore.js` `partialize`) — without this,
  the ~20Hz band writes would have flooded the 100-entry undo stack and
  pushed out real edits within a few seconds.

- Fog, Chromatic Aberration, and Grain were rendering but effectively
  invisible at typical slider values — undersized coefficients, not wiring
  bugs. Fog's `FogExp2` falloff is exp(-(density*dist)^2), extremely
  non-linear; the legacy `density/10000` scaling gave ~2% fog at default at
  this scene's camera distance. Rescaled to `density/3000`. Chromatic
  Aberration's max UV-space offset was 0.004 (visible threshold is roughly
  0.01+) — rescaled to 0.015 max. Grain's opacity was damped to 40% of an
  already-modest range — bumped to 90%.


- Rebuilt the Background system properly: it was CSS on `#canvas-wrap`
  behind a transparent canvas, which is fragile once postprocessing effects
  are active — @react-three/postprocessing's EffectComposer render targets
  don't reliably round-trip alpha through effects like Bloom, so the
  "transparent canvas revealing CSS behind it" trick can silently break.
  Replaced with `BackgroundController.jsx` — a real plane in the THREE scene
  (position z=-1000, renderOrder=-1, depthWrite=false) with a small GLSL
  gradient shader (`shaders/background.frag.glsl`), matching the legacy
  `makeBG()` approach instead of approximating it in CSS. Solid mode uses
  the same shader with both colors set equal. Direction (to top/bottom/
  left/right) is computed via `axisX`/`flip` uniforms rather than CSS
  `linear-gradient()` syntax.


- Fixed the Blobs Size slider actually doing nothing: `bs` (derived from
  `size`) was computed inside a `useMemo` whose dependency array was
  `[count, cA, cB, cC]` — `size` wasn't listed, so the memo never
  recomputed when the slider moved; it stayed frozen at whatever value it
  had on first render. Added `size` to the deps array. Also increased the
  per-vertex noise displacement coefficient (0.32 → 0.6) since it was hard
  to perceive even at high `noise` values, especially now that blobs are
  visually larger (BASE_SCALE).


- Blobs were rendering as barely-visible dots: the legacy build scales a
  unit-radius icosahedron by only ~0.5-1.3x, genuinely tiny relative to this
  scene's other proportions (orbit radius 55-193, grid spans 700 units).
  Added a `BASE_SCALE = 26` multiplier in `BlobLayer.jsx` — a deliberate
  visual fix/deviation from the legacy constant, documented inline, not a
  1:1 port of a value that didn't actually work well even in the original.


- Fixed "H264 only supports even sized frames": the live WebGL canvas's
  actual pixel dimensions come from CSS layout size × devicePixelRatio,
  which is not guaranteed to land on an even number. Export now draws each
  frame into a persistent offscreen canvas locked to the exact selected
  resolution (all four presets are even) and encodes/captures from that —
  this also makes exports finally match the resolution you actually picked,
  rather than whatever the live preview happened to measure at record time.


- Fixed a real MP4 export bug: the WebCodecs codec string was hardcoded to
  AVC level 3.1 (max ~921,600px, roughly 720p) but the resolution picker
  offers up to 1920x1080/1080x1920 (~2M px) — any resolution above 720p threw
  an encode error. Bumped to level 5.1 (`avc1.420033`), which covers all four
  offered resolutions.
- The canvas preview was a hardcoded 960x540 regardless of the selected
  Export resolution — both visually wrong (didn't reflect your choice) and
  the reason export dimensions never matched what was selected. `#canvas-wrap`
  now sizes to the selected resolution's aspect ratio, capped to fit the
  viewport via `max-width`/`max-height` + CSS `aspect-ratio`.
- Fixed FOV slider doing nothing: R3F's `<Canvas camera={{...}}>` prop
  updates `camera.fov` on change but only calls `camera.updateProjectionMatrix()`
  for aspect/left/right/top/bottom changes, not fov alone — so the value
  updated internally but never took visual effect. `CameraController.jsx` now
  sets it explicitly.


- Added the missing **Scene panel** (Background: None/Solid/Gradient + direction,
  Camera Drift, FOV). This was a real gap, not a deferred nice-to-have: Camera
  Drift existed in the store but the camera was completely static — no
  component ever read `scene.drift`. Added `CameraController.jsx` (ports
  legacy `tickCam()`) and `ScenePanel.jsx`. Background is implemented as CSS
  on `#canvas-wrap` (solid color / CSS gradient) rather than a 3D background
  plane, since the canvas is already alpha:true for this purpose.


- **Mouse Repulsion** and **Audio Reactive** effect panels exist in the sidebar
  and their toggle state persists/exports fine, but neither is wired to
  anything in the scene yet — Mouse Repulsion needs raycasting from pointer
  position to push Blobs/Particles, Audio Reactive needs a getUserMedia +
  AnalyserNode pipeline feeding frequency bands into bloom/blob scale. Both
  are real remaining work, not silently-broken UI — flagging directly so
  toggling them isn't mistaken for a bug.
- Fixed a real perf bug this pass: Lava Surface, Silk Ribbons, and Blobs were
  each doing expensive per-vertex CPU work (TubeGeometry rebuilds, vertex
  normal recomputation) every single frame, which could visibly stall/hang
  the tab with several heavy layers on simultaneously. Throttled to every
  other frame — smooth at the scale this renders, and this was very likely
  the cause of "toggling layers off, but it still hangs/shows old content"
  since a hung frame doesn't get to redraw when React state changes.
- Fog, Scanlines, and Color Cycling effects are now wired (previously
  present in the sidebar but had zero effect on the scene).

## Notes

- All layer animation is phase-based (`elapsed % 10 / 10`) for seamless loop
  export — see FORM-Studio-Plan.md.
- `src/canvas/layers/` — one component per geometry layer, ported 1:1 from
  the legacy `make*()`/`tick*()` function pairs.
- `src/canvas/effects/Effects.jsx` — real EffectComposer-based postprocessing,
  replacing the legacy CSS-filter bloom/grain/vignette hack.
