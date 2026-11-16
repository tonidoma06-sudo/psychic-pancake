// sky.js · a gradient sky dome with a sun glow
import * as THREE from 'three';
export function skyDome(top, horizon, sunDir = new THREE.Vector3(0, .2, -1), sunCol = '#FFE2A8') {
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { top: { value: new THREE.Color(top) }, hor: { value: new THREE.Color(horizon) }, sd: { value: sunDir.clone().normalize() }, sc: { value: new THREE.Color(sunCol) } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'varying vec3 vD; uniform vec3 top, hor, sc, sd; void main(){ float h = clamp(vD.y * 1.6 + .05, 0., 1.); vec3 c = mix(hor, top, pow(h, .7)); float s = max(dot(normalize(vD), sd), 0.); c += sc * (pow(s, 60.) * 1.2 + pow(s, 6.) * .25); gl_FragColor = vec4(c, 1.); }' });
  const s = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), m); s.frustumCulled = false; return s;
}
