import useStore from '../store/useStore';

export const LOOP_DURATION = 10;

// Shared phase calculation used by every layer's useFrame callback. Reads
// scrubOverride imperatively (not via the useStore() hook) since this runs
// inside useFrame, not React render — imperative getState() avoids
// subscribing every layer to re-render on every scrub tick.
// When scrubOverride is set (timeline scrubber active), it wins over the
// live clock so the sidebar can preview any moment in the loop.
export function getPhase(elapsedTime) {
  const override = useStore.getState().scrubOverride;
  if (override !== null && override !== undefined) return override;
  return (elapsedTime % LOOP_DURATION) / LOOP_DURATION;
}
