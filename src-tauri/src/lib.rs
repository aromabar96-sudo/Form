// Minimal Tauri v2 app entry — no custom plugins yet. Kept deliberately
// small: FORM Studio's actual functionality is 100% the existing React/R3F
// app rendered in the native WebKit view; this file only exists to
// initialize that view. Native-only Rust commands (ffmpeg sidecar export,
// native preset save/load) are a follow-up, not implemented yet — see
// docs/FORM-Studio-Plan.md Phase 7.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running FORM Studio");
}
