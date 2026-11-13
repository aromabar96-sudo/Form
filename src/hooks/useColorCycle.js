import { useEffect, useRef } from 'react';
import useStore from '../store/useStore';

// Hue rotation via animated CSS filter — ported from the legacy build's
// "Color Cycling" effect (hsl2rgb GLSL utility applied as a CSS filter
// animation). Runs outside the R3F render loop since it targets a DOM
// element (#canvas-wrap), not the WebGL canvas contents.
export function useColorCycle(elementRef) {
  const rafRef = useRef();

  useEffect(() => {
    const start = performance.now();
    const tick = (now) => {
      const { on, speed, amount } = useStore.getState().cycle;
      const el = elementRef.current;
      if (el) {
        if (on) {
          const elapsed = (now - start) / 1000;
          const deg = (elapsed * (speed / 10) * 36) % 360;
          el.style.filter = `hue-rotate(${deg * (amount / 100)}deg)`;
        } else if (el.style.filter) {
          el.style.filter = '';
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [elementRef]);
}
