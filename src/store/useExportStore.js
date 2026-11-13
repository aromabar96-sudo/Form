import { create } from 'zustand';

// Resolutions ported from the legacy Export panel's four buttons.
export const RESOLUTIONS = [
  { label: '1280×720', w: 1280, h: 720 },
  { label: '1920×1080 (Landscape)', w: 1920, h: 1080 },
  { label: '1080×1080 (Square)', w: 1080, h: 1080 },
  { label: '1080×1920 (Story/Reels)', w: 1080, h: 1920 },
];

const useExportStore = create((set) => ({
  resolution: RESOLUTIONS[1],
  recording: false,
  status: '',
  setResolution: (resolution) => set({ resolution }),
  setRecording: (recording) => set({ recording }),
  setStatus: (status) => set({ status }),
}));

export default useExportStore;
