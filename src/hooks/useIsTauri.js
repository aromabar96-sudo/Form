// Detects whether the app is running inside the Tauri native shell vs a
// regular browser tab. `window.__TAURI__` only exists inside a Tauri
// webview — this lets components branch native-only code paths (direct-
// to-disk export via a bundled ffmpeg sidecar, native preset save/load to
// ~/Library/Application Support/FORM/) without forking the app into two
// codebases. Neither of those native paths is implemented yet — this hook
// is the capability check they'll gate on when they are (see
// docs/FORM-Studio-Plan.md Phase 7). In the browser build, this always
// returns false and every existing feature (WebM/MP4 export, localStorage
// presets) behaves exactly as it does today.
export function isTauri() {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}
