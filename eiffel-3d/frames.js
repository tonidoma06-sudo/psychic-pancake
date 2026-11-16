// frames.js · look test for the Eiffel Short: ?f=street | salon | close
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makePost } from '/core/three/post.js';
import { makeCast, CAST, POSES, apply, cane, briefcase } from './person2.js';
import { boulevard, salon } from './sets3.js';
import { skyDome } from './sets.js';
const W = 1080, H = 1920, f = new URLSearchParams(location.search).get('f') || 'street';
await document.fonts.load('700 60px Fredoka');
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene(); const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .5;
const camera = new THREE.PerspectiveCamera(40, W / H, .05, 1200);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, ao: true, aoRadius: .5, aoThickness: 1, aoScale: 1.6, aoAmt: .75 });
post.bloom.strength = .3; post.bloom.threshold = .95; post.bloom.radius = .6; const vg = post.vig.uniforms; vg.amt.value = .3; vg.sat.value = 1.1; vg.contrast.value = .15; vg.warm.value = .25;
const sun = new THREE.DirectionalLight('#FFE9C8', 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0003; sun.shadow.normalBias = .02; scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight('#CFE0FF', '#B89A7A', .7); scene.add(hemi);
const shadowBox = r => { const c = sun.shadow.camera; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 1; c.far = 120; c.updateProjectionMatrix(); };
const lu = makeCast(CAST.lustig), po = makeCast(CAST.poisson);
const cn = cane(); lu.props.add(cn);
const Q = new URLSearchParams(location.search);
if (f === 'heads') {
  scene.background = new THREE.Color('#3A3F4A'); sun.position.set(-3, 4, 6); sun.target.position.set(0, 1.6, 0); sun.intensity = 2.4; shadowBox(3);
  const fill = new THREE.DirectionalLight('#CFE0FF', .8); fill.position.set(4, 2, 3); scene.add(fill);
  const rim = new THREE.DirectionalLight('#FFE0B0', 1.5); rim.position.set(2, 3, -4); scene.add(rim);
  const who = (Q.get('who') || 'lustig,poisson,dealerB').split(','), yaw = +(Q.get('yaw') || 0), sp = .62;
  const ps = who.map((w, i) => { const c = makeCast(CAST[w]); c.P.position.set((i - (who.length - 1) / 2) * sp, 0, 0); c.P.rotation.y = yaw; scene.add(c.P); if (Q.get('nohat')) c.hat.visible = false; return c; });
  ps.forEach((c, i) => apply(c, POSES.stand, { t: i * .7 + .4, face: Q.get('face') || (i === 1 ? 'greedy' : i === 2 ? 'calm' : 'smug'), lx: +(Q.get('lx') || 0) }));
  const cy = +(Q.get('cy') || 1.68), d = +(Q.get('d') || (who.length === 1 ? .9 : 2.1));
  camera.position.set(0, cy + .02, d); camera.lookAt(0, cy, 0); camera.fov = 30; camera.updateProjectionMatrix(); post.dof.focus = d; post.dof.aper = 1; post.dof.maxCoc = 2;
} else if (f === 'street') {
  const set = boulevard(); scene.add(set); scene.add(skyDome('#6FA8E8', '#F6D9B0', new THREE.Vector3(.3, .25, -1), '#FFF0C8'));
  sun.position.set(-18, 22, 14); sun.target.position.set(0, 0, -6); shadowBox(26);
  lu.P.position.set(-.9, 0, 3.4); lu.P.rotation.y = .55; set.add(lu.P); po.P.position.set(.55, 0, 3.7); po.P.rotation.y = -.6; set.add(po.P);
  const bc = briefcase(); po.propsL.add(bc);
  camera.position.set(.2, 1.45, 7.2); camera.lookAt(-.3, 1.95, 0); camera.fov = 44; camera.updateProjectionMatrix();
  apply(lu, POSES.tipHat, { t: .3, look: new THREE.Vector3(.6, 1.6, 3.6) }); apply(po, POSES.rubHands, { t: .5, look: new THREE.Vector3(-.9, 1.7, 3.4) }); po.aL.sh.rotation.set(.1, 0, -.12); po.aL.el.rotation.set(-.15, 0, 0);
  post.dof.focus = 4.6; post.dof.aper = 8; post.dof.maxCoc = 9;
} else {
  const set = salon(); scene.add(set); scene.background = new THREE.Color('#2A1A12');
  sun.position.set(14, 9, -2); sun.target.position.set(0, 0, -2); sun.intensity = 2.2; shadowBox(10); vg.warm.value = .35;
  const tbl = set.userData.table;
  lu.P.position.set(0, 0, -2.85); set.add(lu.P); lu.P.rotation.y = 0; po.P.position.set(-1.0, 0, -.25); po.P.rotation.y = Math.PI; set.add(po.P);
  const dA = makeCast(CAST.dealerA), dB = makeCast(CAST.dealerB); dA.P.position.set(1.0, 0, -.25); dA.P.rotation.y = Math.PI; dB.P.position.set(2.4, 0, -1.5); dB.P.rotation.y = -Math.PI / 2; set.add(dA.P, dB.P);
  apply(lu, POSES.present, { t: .2, talk: .6, look: new THREE.Vector3(-1, 1.3, -.2) }); apply(po, POSES.sitLean, { t: .5, look: new THREE.Vector3(0, 1.7, -2.85) }); apply(dA, POSES.sit, { t: .9, face: 'calm', look: new THREE.Vector3(0, 1.7, -2.85) }); apply(dB, POSES.sit, { t: 1.3, face: 'worried', look: new THREE.Vector3(0, 1.7, -2.85) });
  if (f === 'close') { camera.position.set(.5, 1.74, -1.6); camera.lookAt(0, 1.72, -2.85); camera.fov = 30; post.dof.focus = 1.6; post.dof.aper = 6; }
  else { camera.position.set(-1.8, 2.4, 3.6); camera.lookAt(.2, 1.3, -2.2); camera.fov = 44; post.dof.focus = 6.2; post.dof.aper = 6; }
  camera.updateProjectionMatrix(); post.dof.maxCoc = 9;
}
scene.updateMatrixWorld(true); post.composer.render();
window.DUR = 1; window.render = () => post.composer.render(); window.READY = true;
