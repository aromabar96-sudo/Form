import { Camera, Circle, Square, Video } from 'lucide-react';
import useExportStore, { RESOLUTIONS } from '../store/useExportStore';
import { exportBridge } from '../canvas/exportBridge';

const RECORD_SECONDS = 10; // matches LOOP_DURATION in every layer
const LOOP_DURATION = 10;
const PHASE_SYNC_THRESHOLD = 0.03; // matches legacy "Export waits for phase < 0.03"
const FPS = 30;

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function dataURLtoBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// Waits until the shared animation clock crosses back near phase 0 before
// invoking cb() — guarantees recording starts at loop-start so the export
// loops seamlessly, same guarantee as the legacy build's "Export waits for
// phase < 0.03 before recording" (see FORM-Studio-Plan.md "Loop sync").
function waitForLoopStart(cb) {
  const clock = exportBridge.clock;
  if (!clock) { cb(); return; }
  const check = () => {
    const phase = (clock.elapsedTime % LOOP_DURATION) / LOOP_DURATION;
    if (phase < PHASE_SYNC_THRESHOLD) cb();
    else requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
}

// The live WebGL canvas's actual pixel size comes from CSS layout (container
// size × devicePixelRatio) and is NOT guaranteed to be an exact or even
// number — it just happens to be whatever fits the current window. H.264
// requires even width/height, and export dimensions should match what the
// user picked, not an incidental layout size. Fix: draw each frame into a
// persistent offscreen canvas locked to the exact selected resolution (all
// four presets are even), and capture/encode from that instead.
function makeTargetCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function drawFrameInto(targetCanvas, sourceCanvas) {
  const ctx = targetCanvas.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
}

// Resolution picker, WebM record (canvas.captureStream + MediaRecorder),
// in-browser MP4 (WebCodecs VideoEncoder + mp4-muxer, Chrome-native, no
// ffmpeg needed — FORM-Studio-Plan.md Phase 5 Priority 2), and PNG screenshot.
// MP4 export requires a WebCodecs-capable browser (Chrome/Edge) — falls back
// to a status message elsewhere.
export default function ExportPanel() {
  const resolution = useExportStore((s) => s.resolution);
  const setResolution = useExportStore((s) => s.setResolution);
  const recording = useExportStore((s) => s.recording);
  const setRecording = useExportStore((s) => s.setRecording);
  const status = useExportStore((s) => s.status);
  const setStatus = useExportStore((s) => s.setStatus);

  const recordWebM = () => {
    const sourceCanvas = exportBridge.gl?.domElement;
    if (!sourceCanvas || recording) return;

    const target = makeTargetCanvas(resolution.w, resolution.h);
    if (typeof target.captureStream !== 'function') {
      setStatus('captureStream unsupported in this browser');
      return;
    }

    setRecording(true);
    setStatus('Waiting for loop start...');

    waitForLoopStart(() => {
      const stream = target.captureStream(FPS);
      let recorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 8_000_000 });
      } catch {
        recorder = new MediaRecorder(stream, { videoBitsPerSecond: 8_000_000 });
      }
      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        exportBridge.captureActive = false;
        exportBridge.targetCanvas = null;
        const blob = new Blob(chunks, { type: 'video/webm' });
        downloadBlob(blob, `form-export-${Date.now()}.webm`);
        setRecording(false);
        setStatus('Exported .webm');
      };

      // Hand target off to ExportController (inside the Canvas), which
      // copies the fully-rendered frame into it every tick, timed to run
      // strictly after rendering/postprocessing completes — this is what
      // captureStream() actually samples from. Previously this file drove
      // its own independent rAF loop reading gl.domElement directly, which
      // could race with the render pipeline and grab a partially-rendered
      // frame — the cause of the pixel/static corruption seen during
      // export. See ExportController.jsx.
      exportBridge.targetCanvas = target;
      exportBridge.captureActive = true;

      recorder.start();
      setStatus(`Recording ${RECORD_SECONDS}s loop...`);
      setTimeout(() => recorder.stop(), RECORD_SECONDS * 1000);
    });
  };

  const recordMP4 = () => {
    const sourceCanvas = exportBridge.gl?.domElement;
    if (!sourceCanvas || recording) return;
    if (typeof VideoEncoder === 'undefined') {
      setStatus('WebCodecs MP4 unsupported in this browser — try Chrome/Edge, or use WebM');
      return;
    }

    setRecording(true);
    setStatus('Waiting for loop start...');

    waitForLoopStart(async () => {
      setStatus('Encoding MP4...');
      const { Muxer, ArrayBufferTarget } = await import('mp4-muxer');
      const target = makeTargetCanvas(resolution.w, resolution.h);
      const totalFrames = RECORD_SECONDS * FPS;
      const frameDurationUs = 1e6 / FPS;

      const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: { codec: 'avc', width: resolution.w, height: resolution.h },
        fastStart: 'in-memory',
      });

      const encoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => { setStatus(`Encode error: ${e.message}`); setRecording(false); },
      });
      // H.264 baseline profile, level 5.1 ('avc1.420033') — comfortably covers
      // all four export resolutions up to 1920x1080/1080x1920 (2,073,600px).
      // Level 3.1 ('avc1.42001f') caps out at ~720p and threw "coded area
      // exceeds maximum" on anything larger.
      encoder.configure({
        codec: 'avc1.420033',
        width: resolution.w,
        height: resolution.h,
        bitrate: 8_000_000,
        framerate: FPS,
      });

      // Same fix as recordWebM — target is kept in sync by ExportController
      // (inside the Canvas, timed to run after rendering completes) instead
      // of this loop reading gl.domElement directly and racing the render
      // pipeline. Encoded frame *timestamps* are still perfectly evenly
      // spaced regardless of real wall-clock speed (frameIndex *
      // frameDurationUs below), only the *source pixels* being captured
      // needed this fix.
      exportBridge.targetCanvas = target;
      exportBridge.captureActive = true;

      let frameIndex = 0;
      const captureFrame = () => {
        if (frameIndex >= totalFrames) {
          exportBridge.captureActive = false;
          exportBridge.targetCanvas = null;
          encoder.flush().then(() => {
            muxer.finalize();
            const blob = new Blob([muxer.target.buffer], { type: 'video/mp4' });
            downloadBlob(blob, `form-export-${Date.now()}.mp4`);
            setRecording(false);
            setStatus('Exported .mp4');
          });
          return;
        }
        const frame = new VideoFrame(target, { timestamp: frameIndex * frameDurationUs });
        encoder.encode(frame, { keyFrame: frameIndex % (FPS * 2) === 0 });
        frame.close();
        frameIndex++;
        setStatus(`Encoding MP4... ${Math.round((frameIndex / totalFrames) * 100)}%`);
        requestAnimationFrame(captureFrame);
      };
      requestAnimationFrame(captureFrame);
    });
  };

  const screenshot = () => {
    const sourceCanvas = exportBridge.gl?.domElement;
    if (!sourceCanvas) return;
    const target = makeTargetCanvas(resolution.w, resolution.h);
    drawFrameInto(target, sourceCanvas);
    downloadBlob(dataURLtoBlob(target.toDataURL('image/png')), `form-screenshot-${Date.now()}.png`);
    setStatus('Saved screenshot');
  };

  return (
    <div className="sec">
      <div className="group-label" style={{ padding: '0 0 8px' }}>Export</div>
      <div className="res-grid">
        {RESOLUTIONS.map((r) => (
          <button
            key={r.label}
            className={`rbtn${resolution.label === r.label ? ' on' : ''}`}
            onClick={() => setResolution(r)}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="btn-row" style={{ marginBottom: 8 }}>
        <button className="btn btn-p" onClick={recordWebM} disabled={recording}>
          {recording ? <Square size={14} /> : <Circle size={14} />}
          WebM
        </button>
        <button className="btn btn-p" onClick={recordMP4} disabled={recording}>
          <Video size={14} /> MP4
        </button>
      </div>
      <button className="btn btn-s" onClick={screenshot} disabled={recording} style={{ marginBottom: 8 }}>
        <Camera size={14} /> Screenshot PNG
      </button>
      {status ? <div id="status">{status}</div> : null}
    </div>
  );
}
