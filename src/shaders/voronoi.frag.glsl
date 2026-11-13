uniform float time, cells, edge, bright, opacity;
uniform vec3 c1, c2;
varying vec2 vUv;
vec2 hash2(vec2 p){
  p = vec2(dot(p, vec2(127.1,311.7)), dot(p, vec2(269.5,183.3)));
  return fract(sin(p) * 43758.5453);
}
void main(){
  vec2 uv = vUv * cells;
  vec2 cell = floor(uv), local = fract(uv);
  float minD = 10.0, sec = 10.0;
  vec2 minCell = vec2(0.0);
  for(int y = -1; y <= 1; y++) for(int x = -1; x <= 1; x++){
    vec2 nb = vec2(float(x), float(y));
    vec2 h = hash2(cell + nb);
    vec2 anim = vec2(
      sin(h.x * 6.2832 + time) * 0.45 + 0.5,
      sin(h.y * 6.2832 + time * 0.73) * 0.45 + 0.5
    );
    vec2 diff = nb + anim - local;
    float d = length(diff);
    if(d < minD){ sec = minD; minD = d; minCell = cell + nb; }
    else if(d < sec) sec = d;
  }
  float e = sec - minD;
  float mask = smoothstep(0.0, edge, e);
  vec2 id = hash2(minCell);
  vec3 cellCol = mix(c1, c2, id.x);
  vec3 col = mix(c1, cellCol, mask) * bright;
  float alpha = (1.0 - mask) * 0.9 + mask * 0.15;
  gl_FragColor = vec4(col, alpha * opacity);
}
