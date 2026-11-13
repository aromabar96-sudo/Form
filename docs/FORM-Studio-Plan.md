# FORM — Abstract Motion Studio
### Project Documentation · Build Log · Migration Roadmap

---

## What Is FORM?

FORM is a browser-based generative art studio for creating abstract 10-second seamless animation loops. The primary output is WebM video (convertible to MP4 via ffmpeg) intended for use as **website background textures** — dark, atmospheric, looping visuals that sit behind site content without distracting from it.

The tool runs entirely in the browser with no backend, no account, no install. Open the file, compose a scene, export.

---

## What We Built

### Core Architecture

- Single self-contained HTML file (~719KB including inlined Three.js r128)
- All Three.js dependencies inlined — no CDN, no server required
- WebGL rendering via Three.js with `preserveDrawingBuffer: true` for video capture
- Seamless loop system: all animation driven by `phase = (elapsed % 10) / 10`, ensuring every motion is strictly periodic over exactly 10 seconds
- Export via `canvas.captureStream(30)` + `MediaRecorder` at 8Mbps → WebM download
- Fallback: `ffmpeg -i input.webm -c:v libx264 -pix_fmt yuv420p -crf 23 -an -movflags +faststart output.mp4`

### Layer System

Nine independent layer types, each with its own toggle, color controls, and parameters. All can be active simultaneously and compose on top of each other.

#### Tier 1 — Core Geometry
| Layer | Description | Key Controls |
|---|---|---|
| **Blobs** | Icosahedra with per-vertex noise displacement, `MeshPhysical` material | Count, size, wobble, speed, 3 colors |
| **Grid** | Wireframe plane with 4-octave wave displacement | Density, wave height, speed |
| **Nodes** | Orbiting point cloud with proximity-linked lines | Count, link distance, speed, 2 colors |

#### Tier 2 — Particle & Motion
| Layer | Description | Key Controls |
|---|---|---|
| **Particles** | BufferGeometry point field with dual-color vertex coloring, additive blending | Count (up to 8000), size, spread, speed |

#### Tier 2 — Distinct Visual Styles
| Layer | Description | Key Controls |
|---|---|---|
| **Lava Surface** | Dual-mesh system (solid MeshPhong + wireframe overlay), 4-octave wave stack, height-driven vertex color interpolation with hot-peak blowout | Scale, displacement, brightness, speed, 2 colors |
| **Silk Ribbons** | Proper `TubeGeometry` on closed `CatmullRomCurve3` paths, vertex color gradient, rebuilt per frame | Count (up to 16), turbulence, speed, 3 colors |
| **Crystal Shards** | Dual-mesh per shard (solid MeshPhysical + wireframe shell at 1.04× scale), 6 geometry types (icosahedron, octahedron, tetrahedron, dodecahedron, torus, ring), dramatic scale variation | Count, solid→wire ratio, speed, 2 colors |

#### Tier 3 — Shader-Driven Layers
| Layer | Description | Key Controls |
|---|---|---|
| **Voronoi Cells** | Full GLSL fragment shader on a horizontal plane, grid-based Voronoi with animated seed points (`sin(hash × 2π + time)`), seamless loop | Cell count (4–60), edge width, brightness, speed |
| **Lava Surface** | (see above) | — |
| **DNA Helix** | Two `TubeGeometry` backbone helixes + `SphereGeometry` nucleotides + `CylinderGeometry` rungs aligned via `quaternion.setFromUnitVectors` | Base pairs, radius, twist, speed, 2 colors |
| **Wormhole** | `CircleGeometry` disc with custom vortex fragment shader (swirling rings pulling inward), outer + inner `TorusGeometry` frame rings | Size, ring density, distortion, speed, 3 colors |
| **Volumetric Smoke** | N stacked `PlaneGeometry` layers each with a 5-octave FBM noise shader, spread in X/Y/Z with rotational variation | Layers (3–24), density, scale, speed |

### Effects System

#### Post-Processing (CSS + Canvas overlay approach)
| Effect | Implementation | Controls |
|---|---|---|
| **Bloom** | CSS `drop-shadow` + `brightness` + `contrast` filters on canvas element | Strength, radius |
| **Film Grain** | 2D canvas overlay drawn per-frame with `createImageData`, `mix-blend-mode: overlay` | Strength, animated/static |
| **Vignette** | Absolute-positioned div with `radial-gradient` | Strength, softness |
| **Fog** | `THREE.FogExp2` on scene | Color, density |

#### Dynamic Effects
| Effect | Description |
|---|---|
| **Mouse Repulsion** | Unprojected mouse position to world space, pushes blobs and particles. Auto-disabled during export to preserve loop |
| **Audio Reactive** | Web Audio API microphone → 3 frequency bands. Bass → blob scale, Mid → ribbon turbulence, High → bloom strength |
| **Color Cycling** | Hue rotation via `hsl2rgb` GLSL utility applied as CSS filter animation |
| **Environment IBL** | `PMREMGenerator` + procedural canvas equirectangular texture, applies to all `MeshPhysical` / `MeshStandard` materials |
| **Normal Maps** | Procedural `DataTexture` (4-octave sine field) applied to blob surfaces |

### Scene Controls
- **Background**: None (transparent) / Solid color / Gradient with 4 direction options
- **Camera Drift**: Orbital camera with configurable speed and FOV
- **Camera FOV**: 25–90°

### Export
- **Resolutions**: 1280×720, 1920×1080, 1080×1080 (square), 1080×1920 (vertical)
- **Format**: WebM (VP9/VP8 fallback), 8Mbps, 30fps, 10 seconds
- **Loop sync**: Export waits for `phase < 0.03` before recording to guarantee loop start alignment
- **Screenshot**: PNG snapshot via `canvas.toDataURL`
- **Shuffle**: Randomizes blob colors, count, wobble, and speed

### UI
- **Design system**: Cobalt Sky theme (deep navy `#07111f`, sky blue `#38bdf8`, JetBrains Mono labels)
- **Sidebar**: Accordion-based layer panels with smooth `max-height` transitions
- **Icons**: Lucide icons (inlined SVG paths from npm package) — one icon per layer type
- **ON/OFF pills**: Live toggle state reflected on each accordion header
- **Fonts**: Bebas Neue (brand), Inter (UI), JetBrains Mono (labels/values)

---

## Technical Decisions & Tradeoffs

### Why single HTML?
Built as a local tool in the same style as Raoul's existing workflow (password manager, invoice generator, Midjourney prompt library). Zero install, zero server, portable.

### Why Three.js inlined vs CDN?
Chrome blocks external scripts from `file://` pages. All Three.js dependencies (three.min.js, EffectComposer, postprocessing passes) are inlined from the npm package to remove this constraint.

### Why CSS filters instead of EffectComposer for bloom?
Three.js r128's `UnrealBloomPass` from the npm examples package has a runtime incompatibility — `compositeMaterial.uniforms['bloomStrength']` fails at construction. Rather than fight the dependency chain, bloom, grain, and vignette were reimplemented as CSS/canvas overlays that capture correctly in `captureStream`.

### Why phase-based animation?
All animation uses `phase = (elapsed % LOOP_DURATION) / LOOP_DURATION` as its time axis. Every `sin()` and `cos()` call multiplies phase by `2π`, making every motion exactly periodic over 10 seconds. This is what makes exports seamlessly loop without cross-fades.

---

## Known Limitations (Current Build)

- **No EffectComposer** — proper WebGL bloom, DoF, chromatic aberration, and motion blur are not running. These were removed after runtime crashes with the npm-inlined postprocessing shaders.
- **No preset system** — compositions are lost on tab close.
- **No undo/redo** — any slider change is final.
- **No layer opacity** — layers are fully visible or hidden, no blending.
- **No layer reordering** — draw order is fixed.
- **File size** — 719KB is large for a "local tool"; Three.js core alone is 600KB.
- **File:// restriction** — must open via `python3 -m http.server 8080` or equivalent; direct double-click in Chrome fails due to CORS/security origin rules.
- **Ribbon performance** — `TubeGeometry` is rebuilt every frame per ribbon. At 16 ribbons this is expensive. Needs vertex shader animation instead.
- **Lava Surface performance** — 120×120 vertex mesh displaced CPU-side every frame. High blob count + lava surface simultaneously will drop framerate.
- **No timeline scrubber** — can't preview a specific moment in the loop without watching it play.
- **Export format** — WebM only natively; MP4 requires external ffmpeg conversion.

---

## Migration Plan: Vite + React + Three.js (R3F)

### Why Migrate?

The current single-file architecture has reached its limit. At 2800 lines of unstructured imperative code, every new feature requires careful string surgery with real risk of breaking existing functionality (as demonstrated repeatedly during this build). The following problems become unsolvable without a proper framework:

- **State management at scale** — adding presets, undo/redo, and layer reordering requires a proper reactive state system, not a plain JS object
- **Component isolation** — new layer types currently mean ~200 lines of make/tick/bind code spread across the file; in R3F they're self-contained components
- **Postprocessing** — `@react-three/postprocessing` (pmndrs) is a properly maintained library that solves all the EffectComposer crashes we hit
- **Maintainability** — the file cannot be split; a change to the blob layer risks breaking the DNA helix

### Target Stack

| Concern | Technology | Reason |
|---|---|---|
| Build tool | **Vite** | Instant HMR, zero config, builds to single deployable dist |
| UI framework | **React 18** | Component model maps perfectly to layer system |
| 3D rendering | **React Three Fiber (R3F)** | Declarative Three.js, full access to underlying renderer |
| State | **Zustand** | Minimal, no boilerplate, supports undo/redo via `temporal` middleware |
| Postprocessing | **@react-three/postprocessing** | Properly maintained pmndrs library, all effects work |
| UI components | **Custom** (keep Cobalt Sky sidebar) | Design is already good; no need for a component library |
| Icons | **lucide-react** | Already using Lucide; import only what's needed |
| Deployment | **Vercel / Netlify** | Free tier, instant deploys from git |
| Native shell (Mac) | **Tauri** | System WebKit view (not bundled Chromium) — small binary, strong WebGL/Three.js support, native fs/dialog/menu APIs |

### Project Structure

```
form-studio/
├── src/
│   ├── main.jsx                  # Vite entry
│   ├── App.jsx                   # Root: Canvas + Sidebar
│   ├── store/
│   │   ├── useStore.js           # Zustand store (all layer state)
│   │   ├── usePresetsStore.js    # Preset system
│   │   └── useHistoryStore.js    # Undo/redo via temporal middleware
│   ├── canvas/
│   │   ├── Scene.jsx             # R3F Canvas wrapper, camera, lights
│   │   ├── ExportController.jsx  # captureStream + MediaRecorder logic
│   │   ├── layers/
│   │   │   ├── BlobLayer.jsx
│   │   │   ├── GridLayer.jsx
│   │   │   ├── NodeLayer.jsx
│   │   │   ├── ParticleLayer.jsx
│   │   │   ├── LavaSurface.jsx
│   │   │   ├── SilkRibbons.jsx
│   │   │   ├── CrystalShards.jsx
│   │   │   ├── VoronoiCells.jsx
│   │   │   ├── DNAHelix.jsx
│   │   │   ├── Wormhole.jsx
│   │   │   └── VolumetricSmoke.jsx
│   │   └── effects/
│   │       ├── Effects.jsx       # @react-three/postprocessing wrapper
│   │       ├── BloomEffect.jsx
│   │       ├── ChromaEffect.jsx
│   │       ├── GrainEffect.jsx
│   │       └── VignetteEffect.jsx
│   ├── sidebar/
│   │   ├── Sidebar.jsx           # Sidebar root
│   │   ├── LayerAccordion.jsx    # Reusable accordion wrapper
│   │   ├── panels/
│   │   │   ├── BlobPanel.jsx
│   │   │   ├── GridPanel.jsx
│   │   │   └── ...              # One panel per layer
│   │   ├── ScenePanel.jsx
│   │   └── ExportPanel.jsx
│   ├── components/
│   │   ├── ColorSwatch.jsx
│   │   ├── RangeSlider.jsx
│   │   ├── Toggle.jsx
│   │   └── PresetGallery.jsx
│   └── shaders/
│       ├── voronoi.glsl
│       ├── wormhole.glsl
│       ├── smoke.glsl
│       └── lava.glsl
├── public/
├── index.html
├── vite.config.js
└── package.json
```

### State Architecture (Zustand)

```js
// useStore.js — replaces the S object
const useStore = create(
  temporal(  // ← gives us undo/redo for free
    (set) => ({
      blobs:    { on: true,  count: 5, size: 100, ... },
      grid:     { on: false, den: 24, ... },
      // ... all layer state
      bloom:    { on: true,  strength: 1.2, ... },

      // Actions
      setLayer: (layer, patch) => set(s => ({
        [layer]: { ...s[layer], ...patch }
      })),
      resetLayer: (layer) => set({ [layer]: defaults[layer] }),
    })
  )
);

// Undo/redo
const { undo, redo } = useTemporalStore(s => s);
```

### Missing Features to Build in R3F

#### Priority 1 — Core Workflow
- [ ] **Preset system** — save/load named configurations with thumbnail snapshot, export/import as JSON file
- [ ] **Undo / Redo** — Cmd+Z / Cmd+Shift+Z via Zustand `temporal` middleware (1 line to enable)
- [ ] **Layer opacity** — per-layer `opacity` uniform passed to all materials
- [ ] **Layer blend modes** — additive, multiply, screen, overlay per layer via Three.js material `blending`
- [ ] **Randomize per layer** — dice button on each layer header, randomizes only that layer

#### Priority 2 — Export
- [ ] **In-browser MP4** — WebCodecs API (`VideoEncoder` + `mp4-muxer`), Chrome-native, no ffmpeg needed
- [ ] **GIF export** — frame capture + pure-JS GIF encoder (gif.js or similar)
- [ ] **PNG sequence** — capture N frames and zip for After Effects
- [ ] **Export quality slider** — bitrate control 2–20Mbps
- [ ] **Loop duration selector** — 5s / 10s / 15s / 30s

#### Priority 3 — Visual Quality
- [ ] **Proper WebGL bloom** — `@react-three/postprocessing` `Bloom` effect, replaces CSS hack
- [ ] **Depth of Field** — `DepthOfField` from postprocessing library, real bokeh
- [ ] **Motion Blur** — `MotionBlur` from postprocessing library, velocity-buffer based
- [ ] **Chromatic Aberration** — `ChromaticAberration` from postprocessing, proper RGB split
- [ ] **SSAO** — ambient occlusion for Crystal Shards and DNA Helix
- [ ] **Environment map refresh** — dynamic env map that updates as scene changes

#### Priority 4 — New Layers
- [ ] **Text / Logo** — upload SVG or type text, extrude as `ExtrudeGeometry`, floats through scene
- [ ] **Metaballs** — raymarched SDF in a full-screen shader quad, proper organic merging
- [ ] **Terrain** — large displaced plane using `SimplexNoise`, abstract landscape look
- [ ] **Constellation** — star field with randomly connecting lines, slower and more sparse than Nodes

#### Priority 5 — UX
- [ ] **Timeline scrubber** — drag to preview any moment in the loop before export
- [ ] **Keyboard shortcuts** — Space (play/pause), R (record), S (screenshot), 1–9 (toggle layers), Cmd+Z (undo)
- [ ] **Drag to reorder layers** — layer stacking order control via drag handle
- [ ] **Copy CSS** — for gradient backgrounds, generate equivalent CSS `@keyframes` + `background`
- [ ] **Performance monitor** — FPS counter + GPU memory indicator, warns before export if frame rate is low
- [ ] **Dark/light viewport** — toggle canvas background independently from export background

#### Priority 6 — Performance
- [ ] **Ribbon GPU animation** — move `TubeGeometry` control point animation into a vertex shader; eliminate per-frame geometry rebuild
- [ ] **Lava Surface GPU** — move vertex displacement into a vertex shader; eliminate CPU-side mesh mutation
- [ ] **Level of detail** — reduce geometry complexity for layers that are far from camera
- [ ] **Worker-based export** — offload `MediaRecorder` processing to a Web Worker to prevent UI jank during capture

---

## Migration Steps

### Phase 1 — Project Setup (Day 1)
1. `npm create vite@latest form-studio -- --template react`
2. Install: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `zustand`, `lucide-react`
3. Port Cobalt Sky CSS to a global stylesheet
4. Set up Zustand store with current `S` object structure
5. Scaffold `Scene.jsx` with R3F `Canvas`, camera, and lights
6. Confirm blank scene renders

### Phase 2 — Core Layers (Days 2–3)
7. Port `BlobLayer` — most complex, validates the R3F pattern
8. Port `GridLayer`, `NodeLayer`, `ParticleLayer`
9. Add postprocessing: Bloom, Grain, Vignette, Chromatic Aberration
10. Confirm all 4 layers + effects match current build visually

### Phase 3 — Styled Layers (Days 3–4)
11. Port `LavaSurface`, `SilkRibbons`, `CrystalShards`
12. Port `VoronoiCells`, `DNAHelix`, `Wormhole`, `VolumetricSmoke`
13. GLSL shaders copied verbatim into `.glsl` files, imported via Vite

### Phase 4 — Sidebar UI (Day 4)
14. Build `Sidebar.jsx` with accordion system
15. Build reusable `RangeSlider`, `ColorSwatch`, `Toggle` components
16. Wire all panels to Zustand store
17. Add Lucide icons via `lucide-react`

### Phase 5 — New Features (Days 5–7)
18. Preset system with localStorage persistence and JSON export
19. Undo/redo via Zustand temporal middleware
20. Layer opacity and blend mode controls
21. Per-layer randomize buttons
22. In-browser MP4 export via WebCodecs API
23. Timeline scrubber

### Phase 6 — Deploy (Day 7)
24. Build: `npm run build`
25. Deploy to Vercel: `vercel --prod`
26. Custom domain if needed
27. Share URL — no file download required, opens in any browser

### Phase 7 — Mac App via Tauri (Days 8–9)

**Goal**: same codebase, wrapped as a native macOS app — no separate rewrite, no bundled Chromium.

28. ~~`cargo install create-tauri-app` (requires Rust toolchain: `rustup`)~~ — n/a, scaffolded manually instead (see next item)
29. **[DONE]** Scaffolded Tauri (v2) by hand around the existing Vite build: `src-tauri/` (Cargo.toml, tauri.conf.json, main.rs/lib.rs, capabilities/default.json), `tauri.conf.json`'s `build.frontendDist` points at `../dist`, `devUrl` at the Vite dev server. `package.json` scripts added: `mac:dev` (`tauri dev`), `mac:build` (`tauri build --target universal-apple-darwin`). Generated the full icon set including `icon.icns` (via `tauri icon`, which is pure Rust and doesn't need macOS to run — this actually worked in the Linux build environment). **NOT built or tested** — see README.md "Mac App" section for why (needs Xcode, which only exists on macOS) and the exact commands to finish this on an actual Mac.
30. **[DONE]** Added `isTauri()` capability check (`src/hooks/useIsTauri.js`, checks `'__TAURI__' in window`) — already wired into the info bar (shows "· Mac App" when running natively) as a working example of the check being live, not just declared.
31. **[NOT STARTED]** Native export path: replace browser `MediaRecorder` → download with Tauri's `dialog.save()` + `fs.writeBinaryFile()` for direct-to-disk export
32. **[NOT STARTED]** Bundle ffmpeg as a Tauri sidecar binary — enables real MP4 export locally (no WebCodecs dependency, no manual `ffmpeg` step for the user)
33. **[NOT STARTED]** Native preset persistence — save/load presets to `~/Library/Application Support/FORM/` via Tauri `fs` APIs instead of localStorage (presets sync between web and Mac app isn't in scope yet, but the JSON preset format from Phase 5 is shared)
34. **[PARTIAL]** Native window chrome: window title/size/min-size configured in `tauri.conf.json` (standard macOS traffic lights, no custom titlebar). App icon done (item 29). Native menu bar (File → Export, Edit → Undo/Redo wired to existing Zustand actions) not done — currently uses Tauri's default menu.
35. **[NOT STARTED]** Code signing + notarization: requires Apple Developer ID ($99/yr) — `tauri build` → sign → `xcrun notarytool submit`. Exact commands documented in README.md, but this has to be run on a Mac with a Developer ID.
36. **[BLOCKED ON ABOVE]** Output: signed `.dmg` for direct download, distributed from the same site as the web app

**What's shared vs. native-only:**

| Feature | Web | Mac App |
|---|---|---|
| Layers, shaders, UI, state | Identical | Identical |
| Export | WebM (MediaRecorder), MP4 via WebCodecs (Phase 5) | Direct MP4/PNG-sequence via bundled ffmpeg, native save dialog |
| Presets | localStorage / JSON download | Native file save to Application Support |
| Distribution | URL, any browser | Signed `.dmg`, optional Mac App Store later |

**Sequencing note**: Phase 7 is additive, not parallel — it wraps whatever Phases 1–6 produce. Don't start the Tauri shell until the web app is stable through Phase 6; the native shell should add roughly 1–2 days on top, not fork the timeline.

---

## Summary

FORM went from a concept to a functional 11-layer generative art studio with a full effects pipeline, audio reactivity, 4 export resolutions, and a polished Cobalt Sky UI — all in a single self-contained HTML file. The architecture proved the concept completely. The Vite + R3F migration takes everything built here and puts it on a foundation that can scale indefinitely without the constraints of a single file, with undo/redo, presets, proper postprocessing, and deployability as immediate gains — as one codebase deployed two ways: a web app (Vercel) and a native Mac app (Tauri), sharing all layer/shader/UI code and diverging only on export and persistence.

---

*Built by Raoul — DACP Studio AI · June 2026*
