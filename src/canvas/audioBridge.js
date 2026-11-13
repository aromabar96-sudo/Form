// Mutable singleton exposing mic-permission/support status to the sidebar
// (outside the Canvas) — same bridge pattern as exportBridge/mouseBridge.
// AudioController writes it; AudioReactive's Toggle (via the generic
// LayerAccordion) doesn't need it, but it's here in case a future status
// readout is added — for now the denial is surfaced via console.warn and
// audio.on is left true (the panel just shows no visible reaction).
export const audioBridge = {
  status: 'idle', // 'idle' | 'requesting' | 'active' | 'denied' | 'unsupported'
};
