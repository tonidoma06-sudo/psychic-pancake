// frames.js · style frames (look test) before the film: ?f=forum | ?f=palace
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makePost } from '/core/three/post.js';
import { C, mat } from './kit.js';
import { makePerson, LOOK, POSE, setPose, mixPose, spear, shield, paddle, gavel, faceLabels } from './person.js';
import { palace, forum, crowd, skyDome } from './sets.js';
const W = 1080, H = 1920, QS = new URLSearchParams(location.search);
await document.fonts.load('700 60px Fredoka');
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .45;
const camera = new THREE.PerspectiveCamera(42, W / H, .1, 900);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, ao: true, aoRadius: .6, aoThickness: 1, aoScale: 1.6, aoAmt: .7 });
post.bloom.strength = .35; post.bloom.threshold = .95; post.bloom.radius = .6; post.vig.uniforms.amt.value = .3; post.vig.uniforms.sat.value = 1.15; post.vig.uniforms.contrast.value = .15;
const sun = new THREE.DirectionalLight('#FFF1D6', 3.2); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .02;
const sc = sun.shadow.camera; sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14; sc.near = 1; sc.far = 80;
scene.add(sun, sun.target); const hemi = new THREE.HemisphereLight('#BFD9FF', '#C9A27A', .7); scene.add(hemi);
const f = QS.get('f') || 'forum';
if (f === 'forum' || f === 'close') {
  const set = forum(); scene.add(set); scene.add(skyDome('#3E4C8F', '#F7A26B', new THREE.Vector3(.4, .12, -1), '#FFD08A'));
  sun.color.set('#FFB877'); sun.intensity = 3.0; sun.position.set(12, 9, -14); sun.target.position.set(0, 0, 0); hemi.intensity = .9; hemi.color.set('#9DB0FF');
  const auc = makePerson(LOOK.guard); auc.P.position.set(-1.4, .9, .3); auc.P.rotation.y = .5; set.add(auc.P);
  const gv = gavel(); auc.props.add(gv);
  setPose(auc, POSE.hammerUp);
  const crd = crowd(46, (i, R) => [(R() - .5) * 13, 3.4 + R() * 5.0], [C.terracotta, C.teal, C.blue, '#E8C547', C.pink, C.wool, C.green], 4);
  set.add(crd); crd.userData.update(.3, { paddles: .55, hop: .4 });
  const b1 = makePerson(LOOK.julianus); b1.P.position.set(1.5, 0, 6.6); b1.P.rotation.y = Math.PI * .9; set.add(b1.P);
  const pd = paddle('25,000'); b1.props.add(pd); setPose(b1, POSE.raiseR);
  camera.position.set(2.6, 2.1, 9.2); camera.lookAt(-.2, 2.1, 0); camera.fov = 38; camera.updateProjectionMatrix();
  post.dof.focus = 10.3; post.dof.aper = 26; post.dof.maxCoc = 8;
  if (f === 'close') { b1.P.rotation.y = .35; setPose(b1, POSE.raiseR, 'smug'); camera.position.set(2.05, 1.62, 8.0); camera.lookAt(1.4, 1.75, 6.6); camera.fov = 30; camera.updateProjectionMatrix(); post.dof.focus = 1.55; post.dof.aper = 4; post.dof.maxCoc = 10; }
  set.userData.anim?.(0);
} else {
  const set = palace(); scene.add(set); scene.background = new THREE.Color('#2B1A14');
  sun.position.set(-6, 12, 4); sun.target.position.set(0, 0, -4); sun.intensity = 2.4; sun.color.set('#FFE6BE');
  const em = makePerson(LOOK.emperor); const th = set.userData.throne; em.P.position.set(0, .75 + .55, -6.15); set.add(em.P); setPose(em, POSE.sit, 'happy');
  for (const [x, z, r] of [[-1.5, -1.2, .35], [1.5, -.6, -.4]]) {
    const gd = makePerson(LOOK.guard); gd.P.position.set(x, 0, z); gd.P.rotation.y = Math.PI + r; set.add(gd.P);
    const sp = spear(); gd.props.add(sp); sp.rotation.x = -Math.PI / 2 + .1; const sh = shield(); gd.propsL.add(sh); sh.rotation.set(0, Math.PI / 2, 0); sh.position.set(-.08, -.05, 0);
    setPose(gd, POSE.hold, 'angry');
  }
  camera.position.set(.6, 1.5, 5.4); camera.lookAt(0, 2.6, -6); camera.fov = 52; camera.updateProjectionMatrix();
  post.dof.focus = 11.5; post.dof.aper = 16; post.dof.maxCoc = 6;
  set.userData.anim(.4);
}
faceLabels(scene, camera);
post.composer.render();
window.DUR = 1; window.render = () => post.composer.render(); window.READY = true;
