import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import useStore from '../store/useStore';
import { audioBridge } from './audioBridge';

// Mic-driven audio reactivity — ported from the legacy comment:
// "Bass -> blob scale, Mid -> ribbon turbulence, High -> bloom strength".
// Requests getUserMedia({audio:true}) once when audio.on flips true, feeds
// the stream into an AnalyserNode, and writes normalized 0-1 band energies
// into the store (audio.bass/mid/high) every frame for BlobLayer,
// SilkRibbons, and Effects (Bloom) to read reactively via useStore selectors.
//
// Mic access is requested lazily (not on mount) so the app doesn't prompt
// for microphone permission unless the user actually turns Audio Reactive
// on. Denial/unsupported-browser cases fail closed: bands stay at 0 and the
// effect simply has no visible influence, rather than throwing.
const FFT_SIZE = 256; // 128 frequency bins

export default function AudioController() {
  const on = useStore((s) => s.audio.on);
  const sens = useStore((s) => s.audio.sens);
  const setLayer = useStore((s) => s.setLayer);

  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const dataRef = useRef(null);
  const streamRef = useRef(null);
  const frameCountRef = useRef(0);

  useEffect(() => {
    if (!on) {
      audioBridge.status = 'idle';
      return undefined;
    }

    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia || !(window.AudioContext || window.webkitAudioContext)) {
      audioBridge.status = 'unsupported';
      return undefined;
    }

    audioBridge.status = 'requesting';

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const AC = window.AudioContext || window.webkitAudioContext;
        const ctx = new AC();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        ctxRef.current = ctx;
        analyserRef.current = analyser;
        dataRef.current = new Uint8Array(analyser.frequencyBinCount);
        audioBridge.status = 'active';
      })
      .catch((err) => {
        // Most commonly NotAllowedError (permission denied) or
        // NotFoundError (no mic device) — either way, fail closed.
        console.warn('[FORM] Audio Reactive: microphone access unavailable —', err.message);
        audioBridge.status = 'denied';
      });

    return () => {
      cancelled = true;
      analyserRef.current = null;
      dataRef.current = null;
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      audioBridge.status = 'idle';
      setLayer('audio', { bass: 0, mid: 0, high: 0 });
    };
  }, [on, setLayer]);

  useFrame(() => {
    const analyser = analyserRef.current;
    const data = dataRef.current;
    if (!on || !analyser || !data) return;

    // Reading + averaging 128 bins every frame is cheap, but the store
    // write triggers React re-renders in every subscribed layer — throttle
    // to every 3rd frame (~20Hz), which is already faster than perceptible
    // audio-visual lag while cutting re-render churn by 2/3.
    frameCountRef.current++;
    if (frameCountRef.current % 3 !== 0) return;

    analyser.getByteFrequencyData(data);
    const bins = data.length;
    // Rough log-ish split of the spectrum into bass/mid/high thirds-ish —
    // bass gets the narrowest low-frequency slice since that's where kick/
    // bass energy concentrates, mid and high split the remainder.
    const bassEnd = Math.floor(bins * 0.12);
    const midEnd = Math.floor(bins * 0.5);

    let bassSum = 0, midSum = 0, highSum = 0;
    for (let i = 0; i < bassEnd; i++) bassSum += data[i];
    for (let i = bassEnd; i < midEnd; i++) midSum += data[i];
    for (let i = midEnd; i < bins; i++) highSum += data[i];

    const bassAvg = bassEnd > 0 ? bassSum / bassEnd / 255 : 0;
    const midAvg = midEnd > bassEnd ? midSum / (midEnd - bassEnd) / 255 : 0;
    const highAvg = bins > midEnd ? highSum / (bins - midEnd) / 255 : 0;

    const gain = sens / 100;
    setLayer('audio', {
      bass: Math.min(1, bassAvg * gain),
      mid: Math.min(1, midAvg * gain),
      high: Math.min(1, highAvg * gain),
    });
  });

  return null;
}
