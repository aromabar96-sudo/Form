import useStore from '../store/useStore';

// Scene fog — ported from legacy: `scene.fog = new THREE.FogExp2(color, density/10000)`.
// A plain declarative <fogExp2> attached to the R3F scene; toggling fog.on
// unmounts it, which clears scene.fog automatically.
//
// DEVIATION FROM LEGACY: FogExp2's falloff is exp(-(density*dist)^2), which
// is extremely non-linear. At the legacy's density/10000 scaling, the
// default value (3) produced only ~2% fog at this scene's typical camera
// distance (~450 units) — effectively invisible until the slider was
// pushed close to its max. Rescaled to density/3000 so the default value
// is clearly visible and the full slider range (1-30) sweeps from subtle
// haze to fully obscured, instead of "nothing" for 90% of the range.
export default function FogController() {
  const { on, color, density } = useStore((s) => s.fog);
  if (!on) return null;
  return <fogExp2 attach="fog" args={[color, density / 3000]} />;
}
