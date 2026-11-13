uniform vec3 cA;
uniform vec3 cB;
uniform float axisX; // 0 = vertical gradient, 1 = horizontal
uniform float flip;  // 0 = cA at start, 1 = cA at end
varying vec2 vUv;
void main(){
  float comp = mix(vUv.y, vUv.x, axisX);
  float t = mix(comp, 1.0 - comp, flip);
  gl_FragColor = vec4(mix(cA, cB, t), 1.0);
}
