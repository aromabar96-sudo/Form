// Cobalt Sky labeled range slider — matches .ctrl / .clabel / input[type=range]
//
// BUG FIX: Chromium (Chrome/Brave/Edge) silently changes a hovered
// <input type="range">'s value on mouse-wheel scroll, even when the
// input isn't focused and the scroll is really meant for the page/sidebar
// around it. Since every slider in this sidebar sits inside a scrollable
// list, scrolling the list naturally moves the cursor across sliders as
// content passes underneath it — each one it passes over silently nudges
// its own value. This was the real cause of "the canvas zooms in/out when
// I scroll the sidebar": it was the Camera FOV / Drift sliders being
// nudged by the scroll gesture, not our own zoom control, which is why
// fixes targeting the zoom feature itself didn't help. onWheel here
// calls preventDefault() on the input's own wheel event, suppressing the
// browser's built-in scroll-to-adjust action — the standard fix for this
// Chromium quirk.
// While the cursor is directly over a slider, that specific wheel tick
// won't scroll the list either (same default action), but scrolling
// resumes normally as soon as the cursor passes off the slider — a minor
// trade-off versus sliders silently drifting as you scroll past them.
export default function RangeSlider({ label, value, min, max, step = 1, onChange, suffix = '' }) {
  return (
    <div className="ctrl">
      <div className="clabel">
        <span>{label}</span>
        <span className="v">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onWheel={(e) => e.preventDefault()}
      />
    </div>
  );
}
