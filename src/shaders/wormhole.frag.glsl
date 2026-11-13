uniform float time, rings, distort, opacity;
uniform vec3 c1, c2, c3;
varying vec2 vUv;
void main(){
  vec2 uv = (vUv - 0.5) * 2.0;
  float dist = length(uv);
  float angle = atan(uv.y, uv.x);
  float swirl = angle + dist * distort * 6.28 - time * 3.0;
  float r = fract((dist * rings - time * 1.5) * 0.5);
  float band = pow(smoothstep(0.0,0.35,r) * smoothstep(1.0,0.65,r), 1.5);
  float a2 = fract(swirl / (3.14159 * 2.0));
  vec3 col = mix(c1, c2, a2);
  col = mix(col, c3, band * 0.6);
  float core = smoothstep(0.12, 0.0, dist);
  float rim = smoothstep(0.0, 0.15, dist) * smoothstep(1.0, 0.7, dist);
  col = mix(col * rim, vec3(0.0), core * 0.9);
  float alpha = rim * (band * 0.7 + 0.25) * (1.0 - core * 0.8);
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0) * opacity);
}
