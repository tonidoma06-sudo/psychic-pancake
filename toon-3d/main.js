// toon-3d · style kit v4 look test (1080×1920, ~7 s). render(t) is a pure function of t.
// Techniques taken from the reference Short: outlined toon cast with big 2D faces that snap expressions on beats,
// a rich saturated world, a camera that never sits still (low wide-lens close-ups, FPV rushes with speed blur, push-ins
// to an extreme close-up, double-exposure dissolves, a day→night lighting change), 1–3 word centred captions.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { makePost } from '/core/three/post.js';
import { makeToon, apply, TP, mix, walk } from './toon.js';
import { park, mallet, stake, wallet, moth, easel } from './world.js';
import { skyDome } from './sky.js';

const W = 1080, H = 1920, DUR = 7.0;
await document.fonts.load('900 80px Montserrat'); await document.fonts.load('800 80px Montserrat');
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), lerp = (a, b, u) => a + (b - a) * u;
const eo = u => 1 - Math.pow(1 - u, 3), eio = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2, back = (u, s = 1.7) => { u = clamp(u) - 1; return 1 + u * u * ((s + 1) * u + s); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const noise = (t, k) => Math.sin(t * 1.7 + k) * .6 + Math.sin(t * 3.1 + k * 2.3) * .3 + Math.sin(t * 5.3 + k * .7) * .1;
const EV = []; const ev = (t, s, o = {}) => EV.push({ t: +t.toFixed(3), s, ...o });

// ---------------- renderer / post ----------------
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .35;
const camera = new THREE.PerspectiveCamera(45, W / H, .03, 1200);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, ao: true, aoRadius: .5, aoThickness: 1, aoScale: 1.4, aoAmt: .55 });
post.bloom.strength = .2; post.bloom.threshold = .95; post.bloom.radius = .5;
const vg = post.vig.uniforms; vg.amt.value = .22; vg.sat.value = 1.22; vg.contrast.value = .12;
// speed blur for FPV rushes: a radial zoom blur toward the centre
const zb = new ShaderPass({ uniforms: { tDiffuse: { value: null }, amt: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: 'uniform sampler2D tDiffuse; uniform float amt; varying vec2 vUv; void main(){ vec2 d = vUv - .5; vec4 s = vec4(0.); for (int i = 0; i < 14; i++) { float k = 1. - amt * float(i) / 13. * length(d) * 2.; s += texture2D(tDiffuse, .5 + d * k); } gl_FragColor = s / 14.; }' });
post.composer.insertPass(zb, 1);
const sun = new THREE.DirectionalLight('#FFF4E0', 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
scene.add(sun, sun.target); const hemi = new THREE.HemisphereLight('#BFDFFF', '#6AA040', 1); scene.add(hemi);
const skyD = skyDome('#2F7FE0', '#BFE3FA', V(-.4, .5, .6), '#FFF6D8'), skyN = skyDome('#08122C', '#25386E', V(.4, .4, -1), '#C8D8FF'); scene.add(skyD, skyN);
const lamp = new THREE.PointLight('#FFD9A8', 0, 9, 1.6); scene.add(lamp);
const DAY = { env: .35, pos: [-18, 30, 16], col: '#FFF4E0', int: 3.1, hs: '#BFDFFF', hg: '#6AA040', hemi: 1.0, fog: ['#CFE8F7', 45, 230], night: 0, exp: 1.0 };
const NIGHT = { pos: [16, 22, -8], col: '#8FA8FF', int: .8, hs: '#33457E', hg: '#0B140C', hemi: .4, fog: ['#13203F', 16, 100], night: 1, exp: .95, lamp: 1.6, env: .05 };
function light(o, at) {
  sun.color.set(o.col); sun.intensity = o.int; sun.position.set(at.x + o.pos[0], o.pos[1], at.z + o.pos[2]); sun.target.position.copy(at);
  const c = sun.shadow.camera, r = 9; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 1; c.far = 120; c.updateProjectionMatrix();
  hemi.color.set(o.hs); hemi.groundColor.set(o.hg); hemi.intensity = o.hemi;
  scene.fog = new THREE.Fog(o.fog[0], o.fog[1], o.fog[2]); skyD.visible = !o.night; skyN.visible = !!o.night; scene.background = null;
  WORLD.userData.bulbs.visible = !!o.night; renderer.toneMappingExposure = o.exp;
  post.bloom.threshold = o.night ? .82 : .95; post.bloom.strength = o.night ? .45 : .2; vg.warm.value = o.night ? -.05 : .1;
  lamp.intensity = o.lamp ?? 0; scene.environmentIntensity = o.env ?? .35;
}

// ---------------- world + cast ----------------
const A = V(0, 0, 0), B = V(4, 0, -8), C = V(-5, 0, -14);
const WORLD = park({ clear: [[0, 0, 5], [4, -8, 4.5], [-5, -14, 4.5], [1.6, -4, 3.2], [2.8, -6, 3]], cx: 0, cz: -7, tuftR: 17,
  bunting: [[[-5.5, -2.6], [7.5, -5.2]], [[-11, -10], [-1, -17]], [[7.5, -5.2], [12, -14]]], pathX: -6, pathZ: -12, pathRot: .15 });
scene.add(WORLD);
const HERO = { name: 'hero', top: '#2FA35A', pants: '#3C5E9A', outfit: 'hoodie', hair: 'beanie', hatC: '#F2A62A', pomC: '#F4F1EA', patch: '#E8423A', blush: 1 };
const RIVAL = { name: 'rival', top: '#5B2A86', outfit: 'suit', hair: 'slick', hairC: '#17141C', tie: '#E8B030', pocketSq: '#FFD23F', shoe: '#1A1A1E' };
const heroA = makeToon(HERO), heroB = makeToon(HERO), rival = makeToon(RIVAL);
for (const p of [heroA, heroB, rival]) scene.add(p.P);
const mal = mallet(); heroA.props.add(mal);
const stk = stake(); stk.userData.sign.visible = false; stk.scale.set(.6, .62, .6); scene.add(stk);
const wal = wallet(); wal.scale.setScalar(1.5); heroB.props.add(wal);
const mo = moth(); scene.add(mo);
const eas = easel(); scene.add(eas); eas.position.set(C.x - 1.05, 0, C.z + .05); eas.rotation.y = .35;
const put = (p, v, ry = 0) => { p.P.position.copy(v); p.P.rotation.y = ry; p.P.updateMatrixWorld(true); };
put(heroA, A, 0); put(heroB, B, 0); put(rival, C, -.15);
// dust puffs on impact
const puffs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.06, 1), new THREE.MeshStandardMaterial({ color: '#D8C0A0', roughness: 1, transparent: true, opacity: .85 }), 24); scene.add(puffs);
const sparks = new THREE.InstancedMesh(new THREE.SphereGeometry(.012, 6, 4), new THREE.MeshBasicMaterial({ color: '#FFD86A' }), 30); scene.add(sparks);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion();

// ---------------- the beats (seconds) ----------------
const HITS = [.62, 1.3], S2 = 1.55, S3 = 2.4, SNAP = 3.15, S4 = 4.0, S5 = 5.6;
const CAP = [['This guy', .12], ['had one', .52], ['crazy idea.', .92], ['It cost him', 2.42], ['everything.', 3.12], ['And his rival?', 4.12], ['Copied it', 4.95], ['overnight.', 5.72]];
ev(0, 'stab'); HITS.forEach(h => ev(h, 'thud')); ev(S2 - .05, 'whoosh'); ev(SNAP, 'snap'); ev(SNAP + .12, 'flutter'); ev(S4 - .1, 'swish'); ev(4.95, 'sting'); ev(S5 - .1, 'swish'); ev(S5, 'crickets');

// ---------------- camera language ----------------
const camAt = (pos, look, fov = 45, focus, aper = 4, roll = 0) => ({ pos, look, fov, focus: focus ?? pos.distanceTo(look), aper, roll });
const hand = (c, t, a = 1) => { c.pos.x += noise(t, 1) * .012 * a; c.pos.y += noise(t, 2) * .01 * a; c.look.x += noise(t, 3) * .02 * a; c.look.y += noise(t, 4) * .016 * a; return c; };
const S1cam = t => { const u = seg(t, 0, S2); const c = camAt(V(lerp(1.45, 1.15, eo(u)), lerp(.92, 1.0, u), lerp(2.0, 1.65, eo(u))), V(.08, lerp(.95, .92, u), .2), 50, 2.0, 4); const k = HITS.reduce((a, h) => a + (t > h ? Math.exp(-(t - h) * 14) : 0), 0); c.pos.y += Math.sin(t * 90) * .012 * k; c.look.y += Math.sin(t * 77) * .02 * k; return hand(c, t, 1.2); };
const S3pose = u => camAt(V(B.x + lerp(.18, .05, u), lerp(1.08, 1.17, u), B.z + lerp(1.75, .82, eio(u))), V(B.x, lerp(1.0, 1.13, u), B.z), lerp(48, 44, u), lerp(1.75, .82, eio(u)), 5);
// the FPV rush: a Catmull-Rom path from shot 1's last frame over the hero, low over the grass, under the bunting, into shot 3's first frame
const FP = new THREE.CatmullRomCurve3([S1cam(S2 - .001).pos, V(-.4, 1.9, -.6), V(1.0, 1.35, -3.2), V(2.6, 1.05, -5.4), S3pose(0).pos], false, 'centripetal', .5);
const fpvCam = t => {
  const u = eio(seg(t, S2, S3)), p = FP.getPointAt(u), ahead = FP.getPointAt(Math.min(1, u + .04)), d = ahead.clone().sub(p);
  const L0 = S1cam(S2 - .001).look, L1 = S3pose(0).look, lk = p.clone().add(d.normalize().multiplyScalar(3));
  const look = u < .2 ? L0.clone().lerp(lk, u / .2) : u > .8 ? lk.clone().lerp(L1, (u - .8) / .2) : lk;
  const sp = Math.sin(u * Math.PI); return camAt(p, look, lerp(54, 48, u) + sp * 10, 4, 0, sp * .12);
};
const S3cam = t => hand(S3pose(eio(seg(t, S3, S4 + .2)) * .92 + seg(t, S3, S4 + .2) * .08), t, .7);
const S4cam = t => { const u = seg(t, S4 - .3, S5), a = lerp(.55, .05, eio(u)), r = lerp(2.1, 1.6, u); return hand(camAt(V(C.x + Math.sin(a) * r - .3, lerp(.82, .9, u), C.z + Math.cos(a) * r), V(C.x - .35, 1.12, C.z), 50, r, 4), t, .8); };
const S5cam = t => { const u = seg(t, S5 - .3, DUR), r = lerp(1.8, 1.25, eo(u)); return hand(camAt(V(C.x - .1 + .4, lerp(.75, .95, u), C.z + r), V(C.x - .15, 1.1, C.z), 48, r, 4), t, .6); };

// ---------------- the shots ----------------
const SHOTS = [
  { t0: 0, t1: S2, lt: DAY, at: A, cam: S1cam, act: t => act1(t) },
  { t0: S2, t1: S3, lt: DAY, at: V(2, 0, -4), cam: fpvCam, act: t => { act1(t); act3(t); } },
  { t0: S3, t1: S4, lt: DAY, at: B, cam: S3cam, act: t => act3(t), dissolveOut: .3 },
  { t0: S4, t1: S5, lt: DAY, at: C, cam: S4cam, act: t => act4(t, 0), dissolveOut: .3 },
  { t0: S5, t1: DUR + 1, lt: NIGHT, at: C, cam: S5cam, act: t => act4(t, 1) },
];
function swingPose(t) {
  for (let i = 0; i < HITS.length; i++) {
    const h = HITS[i], a = h - .42;
    if (t < a) return i === 0 ? mix(TP.swingDn, TP.swingUp, .15 + .08 * Math.sin(t * 6)) : mix(TP.swingDn, TP.swingUp, seg(t, HITS[i - 1] + .08, a) * .3);
    if (t < h - .12) return mix(TP.swingDn, TP.swingUp, eo(seg(t, a, h - .12)));
    if (t < h) { const d = seg(t, h - .12, h); return mix(TP.swingUp, TP.swingDn, d * d); }
  }
  const h = HITS[HITS.length - 1]; return mix(TP.swingDn, TP.swingUp, seg(t, h + .08, h + .5) * .3);
}
function act1(t) {
  // the hero hammers a stake: swing up, slam down on each hit, laughing
  const q = swingPose(t);
  const k = HITS.reduce((a, h) => a + (t > h ? Math.exp(-(t - h) * 12) : 0), 0);
  apply(heroA, { ...q, sq: -.06 * k }, { t, face: 'laugh', talk: 0, seed: 1 });
  const sink = HITS.filter(h => t >= h).length * .05; stk.position.set(-.1, -sink, .8);
  // dust and sparks at the impacts
  let pi = 0, si = 0;
  for (const h of HITS) { const k2 = t - h; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r = k2 > 0 && k2 < .6 ? eo(k2 / .6) * .3 : 0, s = k2 > 0 && k2 < .6 ? (1 - k2 / .6) * (.45 + (i % 3) * .15) : 0; _m.compose(V(-.1 + Math.cos(a) * r, .05 + k2 * .25, .8 + Math.sin(a) * r * .6), _q.identity(), V(s, s, s)); puffs.setMatrixAt(pi++, _m); }
    for (let i = 0; i < 15; i++) { const a = i * 2.4, sp = 1.2 + (i % 5) * .3, x = k2 > 0 && k2 < .35 ? k2 : -1; const s = x > 0 ? 1 - x / .35 : 0; _m.compose(V(-.1 + Math.cos(a) * sp * x, .44 - sink + sp * x - 4.9 * x * x, .8 + Math.sin(a) * sp * x * .6), _q.identity(), V(s, s, s)); sparks.setMatrixAt(si++, _m); } }
  puffs.instanceMatrix.needsUpdate = true; sparks.instanceMatrix.needsUpdate = true;
}
function act3(t) {
  // the hero presents his open wallet: proud grin → deadpan on "everything.", a moth flutters out
  const after = t >= SNAP;
  const HOLD = { sp: [4, 0, 0], hd: [-2, 0, 0], aL: [-58, -14, 0, 62], aR: [-58, -14, 0, 62], lL: [0, 4, 0], lR: [0, 4, 0] };
  apply(heroB, HOLD, { t, face: after ? 'deadpan' : 'happy', talk: 0, seed: 3, noBlink: after });
  wal.rotation.set(-1.15, 0, 0); wal.position.set(.16, .0, .03);
  const k = seg(t, SNAP + .1, SNAP + .9); mo.visible = t > SNAP + .08 && t < S4 + .3;
  heroB.props.updateMatrixWorld(true); const w0 = wal.getWorldPosition(V(0, 0, 0));
  mo.position.set(w0.x + Math.sin(k * 7) * .12 * k + k * .15, w0.y + .03 + k * .55, w0.z + .05 + Math.sin(k * 5) * .05); mo.rotation.set(.3, Math.sin(k * 6) * .6, Math.sin(k * 9) * .3); mo.userData.flap(Math.sin(t * 60) * .9);
}
function act4(t, night) {
  const u = seg(t, S4, S5);
  if (!night) apply(rival, t < 4.95 ? mix(TP.cross, TP.rub, eo(seg(t, S4, 4.4))) : TP.rub, { t, face: t < 4.95 ? 'smug' : 'evil', seed: 5, look: t < 4.95 ? null : camera.position });
  else { const ph = t * 5.5; apply(rival, { ...walk(TP.sneak, ph, .5), sp: [20, 0, 0] }, { t, face: 'evil', seed: 5, look: camera.position }); }
  if (!night) { const rb = Math.sin(t * 16) * 8 * seg(t, 4.2, 4.5); rival.aL.el.rotation.y = rb * Math.PI / 180; rival.aR.el.rotation.y = -rb * Math.PI / 180; }
  lamp.position.set(C.x + .6, 2.2, C.z + 1.2);
}

// ---------------- the overlay: captions (1–3 words, centre, white with a heavy black outline) ----------------
const ov = document.getElementById('ov').getContext('2d');
const snap = document.createElement('canvas'); snap.width = W; snap.height = H; const sctx = snap.getContext('2d');
const CAPY = 1080;
function drawCaption(t) {
  let c = null; for (let i = 0; i < CAP.length; i++) { const end = CAP[i + 1]?.[1] ?? DUR; if (t >= CAP[i][1] && t < end) { c = CAP[i]; break; } } if (!c) return;
  const pop = back(seg(t, c[1], c[1] + .12), 2.2), s = lerp(.6, 1, pop);
  ov.save(); ov.translate(W / 2, CAPY); ov.scale(s, s); ov.font = '900 108px Montserrat'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 22; ov.shadowOffsetY = 8; ov.lineWidth = 26; ov.strokeStyle = '#000'; ov.strokeText(c[0], 0, 0, 1000);
  ov.shadowColor = 'transparent'; ov.fillStyle = '#FFFFFF'; ov.fillText(c[0], 0, 0, 1000); ov.restore();
}

// ---------------- render ----------------
function frame(sh, t) {
  light(sh.lt, sh.at);
  heroA.P.visible = t < S3; heroB.P.visible = t >= S2 && t < S4 + .35; rival.P.visible = t >= S4 - .35;
  puffs.visible = sparks.visible = t < S2 + .5; mo.visible = mo.visible && t >= SNAP;
  WORLD.userData.wheel.rotation.z = -t * .12; WORLD.userData.wheel.children.forEach(o => { if (o.userData.a !== undefined) o.rotation.z = t * .12; });
  sh.act(t);
  const c = sh.cam(t);
  camera.position.copy(c.pos); camera.up.set(0, 1, 0); camera.lookAt(c.look); camera.rotateZ(c.roll ?? 0); camera.fov = c.fov; camera.updateProjectionMatrix();
  WORLD.userData.clouds.position.x = camera.position.x; WORLD.userData.clouds.position.z = camera.position.z;
  post.dof.focus = c.focus; post.dof.aper = c.aper; post.dof.maxCoc = 8;
  const fpv = sh.cam === fpvCam ? Math.sin(seg(t, S2, S3) * Math.PI) : 0; zb.uniforms.amt.value = fpv * .09; zb.enabled = fpv > .02;
  scene.updateMatrixWorld(true); post.composer.render();
}
const QS = new URLSearchParams(location.search), A0 = +(QS.get('a') ?? 0), B0 = +(QS.get('b') ?? DUR);
const SHEET = QS.get('sheet') ? (() => { const fs = [['happy', HERO], ['laugh', HERO], ['deadpan', HERO], ['shock', HERO], ['smug', RIVAL], ['evil', RIVAL]].map(([f, L], i) => { const p = makeToon(L); scene.add(p.P); p.P.position.set(((i % 2) - .5) * .95, -Math.floor(i / 2) * 1.0 + 30, 0); return [p, f]; }); return fs; })() : null;
function render(t) {
  if (SHEET) { light(DAY, V(0, 30, 0)); [heroA, heroB, rival].forEach(p => p.P.visible = false); SHEET.forEach(([p, f], i) => apply(p, TP.stand, { t: 0, face: f, noBlink: 1, seed: i }));
    camera.position.set(0, 30.23, 5.0); camera.up.set(0, 1, 0); camera.lookAt(0, 30.23, 0); camera.fov = 32; camera.updateProjectionMatrix(); post.dof.aper = 0; zb.enabled = false; scene.updateMatrixWorld(true); post.composer.render(); ov.clearRect(0, 0, W, H); return; }
  const i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1), sh = SHOTS[i < 0 ? SHOTS.length - 1 : i];
  // double-exposure dissolve: the outgoing shot (continuing its own motion) fades over the incoming one
  const prev = SHOTS[i - 1], dis = prev?.dissolveOut && t < sh.t0 + prev.dissolveOut ? 1 - (t - sh.t0) / prev.dissolveOut : 0;
  ov.clearRect(0, 0, W, H);
  if (dis > 0) { frame(prev, t); sctx.clearRect(0, 0, W, H); sctx.drawImage(renderer.domElement, 0, 0); }
  frame(sh, t);
  if (dis > 0) { ov.globalAlpha = eio(dis) * .85; ov.drawImage(snap, 0, 0); ov.globalAlpha = 1; }
  if (!QS.get('clean')) drawCaption(t);
}
EV.sort((a, b) => a.t - b.t);
window.DUR = +(B0 - A0).toFixed(3); window.EV = EV; window.render = t => render(t + A0); window.TEXTS = () => [];
render(A0);
window.READY = true;
