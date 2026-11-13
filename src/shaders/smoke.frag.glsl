uniform float time, offset, density, scale, opacity;
uniform vec3 color;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.1 + vec2(1.7,9.2); a *= 0.5; }
  return v;
}
void main(){
  vec2 uv = (vUv - 0.5) / scale + 0.5;
  float t = time + offset;
  float n = fbm(uv * 3.0 + vec2(t * 0.4, -t * 0.25));
  n = fbm(vec2(n + t * 0.1, n - 0.1 * t) + uv * 2.0);
  float edge = 1.0 - length(vUv - 0.5) * 2.0;
  float alpha = clamp(n * density * edge, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha * opacity);
}
