// FORM Studio native shell entry point. Tauri wraps the existing Vite
// build (dist/) in a system WebKit view — see tauri.conf.json's
// build.frontendDist. No custom Rust commands are wired up yet; the app
// runs entirely on the same React/R3F codebase as the web version. This
// file is intentionally minimal — native-only features (direct-to-disk
// export via a bundled ffmpeg sidecar, native preset persistence to
// ~/Library/Application Support/FORM/) are tracked as Phase 7 follow-ups
// in docs/FORM-Studio-Plan.md, not implemented here yet.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    form_studio_lib::run();
}
