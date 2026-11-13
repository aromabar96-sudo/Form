import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Scene from './canvas/Scene';
import Sidebar from './sidebar/Sidebar';
import useStore from './store/useStore';
import { exportBridge } from './canvas/exportBridge';
import { useColorCycle } from './hooks/useColorCycle';
import useExportStore from './store/useExportStore';
import { isTauri } from './hooks/useIsTauri';

const FRAME_PADDING = 20; // breathing room from the viewport edges, px

export default function App() {
  const canvasWrapRef = useRef();
  const viewportRef = useRef();
  useColorCycle(canvasWrapRef);
  const resolution = useExportStore((s) => s.resolution);

  // Computed pixel size of #canvas-wrap, fit ("contain") to whatever space
  // #viewport actually has available, preserving the exact export aspect
  // ratio on both axes.
  //
  // HISTORY: two CSS-only approaches were tried and both failed.
  // (1) A definite width:'100%' made the browser resolve height purely
  // from aspect-ratio, ignoring maxHeight — fine for landscape frames but
  // portrait ones (1080x1920) overflowed vertically.
  // (2) width/height:'auto' + maxWidth/maxHeight + position:absolute +
  // inset + margin:auto — this was expected to behave like
  // object-fit:contain (the same trick works for <img>), but for a
  // plain (non-replaced) absolutely positioned element with ALL FOUR
  // insets set, browsers resolve width/height:auto by stretching to fill
  // the inset box and only use aspect-ratio to derive a missing
  // dimension — not to "contain" both. It looked correct for landscape
  // resolutions purely by coincidence, because the browser window itself
  // is landscape-shaped; Square and Story/Reels exposed the real bug
  // immediately (the canvas just filled the whole rectangle, ignoring
  // the aspect ratio entirely).
  //
  // FIX: compute the fit ourselves in JS via ResizeObserver, the same
  // arithmetic `object-fit: contain` uses internally, and set width/
  // height as definite pixel values. No CSS auto-sizing ambiguity left
  // to get wrong.
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;

    const recompute = () => {
      const availW = el.clientWidth - FRAME_PADDING * 2;
      const availH = el.clientHeight - FRAME_PADDING * 2;
      if (availW <= 0 || availH <= 0) return;
      const targetRatio = resolution.w / resolution.h;
      const availRatio = availW / availH;
      const fitted = availRatio > targetRatio
        ? { w: availH * targetRatio, h: availH } // available space is relatively wider than target -> height-constrained
        : { w: availW, h: availW / targetRatio }; // available space is relatively taller than target -> width-constrained
      setSize(fitted);
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [resolution]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        const { undo, redo } = useStore.temporal.getState();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      // Space = play/pause the timeline scrubber, unless focus is on a form
      // control (so typing a preset name doesn't accidentally toggle it).
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        const { scrubOverride, setScrubOverride } = useStore.getState();
        if (scrubOverride === null) {
          const phase = exportBridge.clock ? (exportBridge.clock.elapsedTime % 10) / 10 : 0;
          setScrubOverride(phase);
        } else {
          setScrubOverride(null);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div id="app">
      <div id="viewport" ref={viewportRef}>
        <div
          id="canvas-wrap"
          ref={canvasWrapRef}
          style={{
            width: size.w ? `${size.w}px` : '100%',
            height: size.h ? `${size.h}px` : '100%',
          }}
        >
          <Scene />
        </div>
        <div id="info-bar">
          FORM — Space play/pause · Cmd+Z undo · Cmd+Shift+Z redo{isTauri() ? ' · Mac App' : ''}
        </div>
        <button
          id="sidebar-toggle"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          {sidebarOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
      <Sidebar collapsed={!sidebarOpen} />
    </div>
  );
}
