// "The Great Emu War" · 3D vertical Short (1080×1920) in the v4 toon style: outlined toon cast with big 2D faces, emus with
// googly eyes, a rich sunburnt outback; a camera that never sits still (FPV rushes, push-ins, follow moves, dissolves),
// 1–3 word captions. Every shot, action, telop and caption is placed from timing.json (the voice). render(t) is pure in t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { makePost } from '/core/three/post.js';
import { makeToon, apply, TP, mix, walk, slouchHat, toon } from './toon.js';
import { makeEmu, poseEmu, emuFlock } from './emu.js';
import { outback, office, truck, lewisGun, crate, scoreboard, binoculars, microphone, letter, rubberStamp, LAY, WIND } from './sets_emu.js';
import { skyDome } from './sky.js';

const W = 1080, H = 1920;
await document.fonts.load('900 80px Montserrat'); await document.fonts.load('800 80px Montserrat'); await document.fonts.load('700 80px Fredoka'); await document.fonts.load('600 80px Fredoka');
const TMJ = await (await fetch('timing.json')).json();
const B = 60 / TMJ.bpm, DUR = TMJ.dur, LOOP = DUR - B;
const LN = Object.fromEntries(TMJ.lines.map(l => [l.id, l]));
const nrm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const w = (lid, word, k = 0) => { const ws = LN[lid].words.filter(x => nrm(x.w).startsWith(nrm(word))); return (ws[k] || ws[ws.length - 1] || { t0: LN[lid].t0 }).t0; };
const cut = id => LN[id].cut;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), lerp = (a, b, u) => a + (b - a) * u;
const eo = u => 1 - Math.pow(1 - u, 3), eio = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2, back = (u, s = 1.7) => { u = clamp(u) - 1; return 1 + u * u * ((s + 1) * u + s); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const noise = (t, k) => Math.sin(t * 1.7 + k) * .6 + Math.sin(t * 3.1 + k * 2.3) * .3 + Math.sin(t * 5.3 + k * .7) * .1;
const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
const EV = []; const ev = (t, s, o = {}) => EV.push({ t: +t.toFixed(3), s, ...o });
const QS = new URLSearchParams(location.search);

// ---------------- renderer / post ----------------
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
const camera = new THREE.PerspectiveCamera(45, W / H, .03, 1500);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, ao: false });
post.bloom.strength = .2; post.bloom.threshold = .95; post.bloom.radius = .5;
const vg = post.vig.uniforms; vg.amt.value = .22; vg.sat.value = 1.2; vg.contrast.value = .12;
const zb = new ShaderPass({ uniforms: { tDiffuse: { value: null }, amt: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: 'uniform sampler2D tDiffuse; uniform float amt; varying vec2 vUv; void main(){ vec2 d = vUv - .5; vec4 s = vec4(0.); for (int i = 0; i < 14; i++) { float k = 1. - amt * float(i) / 13. * length(d) * 2.; s += texture2D(tDiffuse, .5 + d * k); } gl_FragColor = s / 14.; }' });
post.composer.insertPass(zb, 1);
const sun = new THREE.DirectionalLight('#FFF4E0', 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
scene.add(sun, sun.target); const hemi = new THREE.HemisphereLight('#BFDFFF', '#B0703A', 1); scene.add(hemi);
const sky = skyDome('#2A78E0', '#E8E2D6', V(-.4, .5, .6), '#FFF6D8'); scene.add(sky);
const bulb = new THREE.PointLight('#FFF4E0', 0, 12, 1.5); scene.add(bulb);
const DAY = { pos: [-30, 40, 26], col: '#FFF1DA', int: 3.3, hs: '#C8E0FF', hg: '#C07848', hemi: 1.0, fog: ['#E9DCC8', 70, 420], sky: ['#2A78E0', '#EDE6D6', [-.4, .5, .6], '#FFF6D8'], env: .35, r: 16, warm: .14 };
const SUNSET = { pos: [-40, 7, 6], col: '#FFB06A', int: 3.1, hs: '#8E9ED8', hg: '#A0583A', hemi: .8, fog: ['#F0B088', 50, 330], sky: ['#3E54A8', '#F6A464', [-.95, .12, .15], '#FFD08A'], env: .3, r: 18, warm: .3 };
const DREAM = { pos: [8, 6, -30], col: '#FFC27A', int: 3.4, hs: '#F0B080', hg: '#8A4A2A', hemi: .9, fog: ['#F2B47C', 25, 210], sky: ['#D8783A', '#FFD48E', [.2, .15, -1], '#FFF0C0'], env: .35, r: 14, warm: .35 };
const OFFICE = { pos: [4, 7, 6], col: '#FFF0D8', int: 2.4, hs: '#FFF6E8', hg: '#8A6A4A', hemi: 1.0, env: .5, r: 6, bg: '#EFE6CC', warm: .16, bulb: 2.2, bulbPos: [-.5, 1.6, -.3] };
function light(o, at) {
  sun.color.set(o.col); sun.intensity = o.int; sun.position.set(at.x + o.pos[0], at.y + o.pos[1], at.z + o.pos[2]); sun.target.position.copy(at);
  const c = sun.shadow.camera, r = o.r ?? 10; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 1; c.far = 160; c.updateProjectionMatrix();
  hemi.color.set(o.hs); hemi.groundColor.set(o.hg); hemi.intensity = o.hemi;
  scene.fog = o.fog ? new THREE.Fog(o.fog[0], o.fog[1], o.fog[2]) : null; sky.visible = !!o.sky; scene.background = o.sky ? null : new THREE.Color(o.bg ?? '#2A2A30');
  if (o.sky) { const u = sky.material.uniforms; u.top.value.set(o.sky[0]); u.hor.value.set(o.sky[1]); u.sd.value.set(...o.sky[2]).normalize(); u.sc.value.set(o.sky[3]); }
  scene.environmentIntensity = o.env ?? .35; vg.warm.value = o.warm ?? .1;
  bulb.intensity = o.bulb ?? 0; if (o.bulbPos) bulb.position.set(...o.bulbPos);
}

// ---------------- sets ----------------
const SET = { out: outback(), office: office() };
for (const s of Object.values(SET)) { s.visible = false; scene.add(s); }
SET.office.position.set(400, 0, 400);
const OFF = SET.office.position;

// ---------------- cast ----------------
const MER = makeToon({ name: 'meredith', outfit: 'army', top: '#9A8A5A', pants: '#86764C', hair: 'slouch', hatC: '#8C7A4E', mustache: '#7A5232', sam: 1, ribbons: 1, shoe: '#3A2A1A', blush: 1 });
const SG1 = makeToon({ name: 'sgt', outfit: 'army', top: '#A49260', pants: '#86764C', hair: 'slouch', hatC: '#7E6C44', glasses: 'round', shoe: '#3A2A1A' });
const SG2 = makeToon({ name: 'gunner', outfit: 'army', top: '#968558', pants: '#7E6E46', hair: 'slouch', hatC: '#968352', shoe: '#3A2A1A', blush: 1 });
const FARM = makeToon({ name: 'farmer', outfit: 'overalls', top: '#C8283A', pants: '#3C5E9A', hair: 'straw', shoe: '#5A3A20', blush: 1 });
const GEN = makeToon({ name: 'general', outfit: 'army', top: '#7E6E48', pants: '#6E5E3E', hair: 'peak', hatC: '#7A6A44', hairC: '#D8D4CC', mustache: '#ECE8E0', sam: 1, ribbons: 1, shoe: '#2A1A10' });
const CAST = [MER, SG1, SG2, FARM, GEN]; CAST.forEach(p => scene.add(p.P));
const HAT = MER.head.userData.hat;
// under the hat: a three-hair comb-over
const comb = new THREE.Group(); MER.head.add(comb);
for (let k = 0; k < 3; k++) { const hc = new THREE.Mesh(new THREE.TorusGeometry(.214, .007, 6, 24, 1.5), toon('#3A2A1A')); hc.position.set(-.035 + k * .035, 0, 0); hc.rotation.set(0, Math.PI / 2, Math.PI / 2 - .75 + (k - 1) * .1); comb.add(hc); }
const EMU = Array.from({ length: 12 }, (_, i) => { const e = makeEmu({ scale: .96 + hash(i + 3) * .1, face: 'derp' }); scene.add(e.P); return e; });
const THIEF = EMU[0];
const armyHats = EMU.slice(1).map((e, i) => { const h = slouchHat(['#8C7A4E', '#857248', '#968352'][i % 3]); h.scale.setScalar(.5); h.position.y = .01; e.hatPin.add(h); h.visible = false; return h; });
const FLOCK = emuFlock(1500); scene.add(FLOCK.g);
// props
const TRK = truck(); scene.add(TRK);
const gunT = lewisGun(); { const post_ = new THREE.Mesh(new THREE.CylinderGeometry(.04, .06, .7, 10), toon('#2E3134')); post_.position.y = .35; TRK.userData.mount.add(post_); TRK.userData.mount.add(gunT); gunT.position.y = .78; gunT.userData.bipod.visible = false; }
const gunA = lewisGun(), gunB = lewisGun(); scene.add(gunA, gunB);
const crates = Array.from({ length: 8 }, (_, i) => { const c = crate(i < 2 ? 'TABLE' : '.303 AMMO'); scene.add(c); return c; });
const BOARD = scoreboard(); scene.add(BOARD);
const BINO = binoculars(); MER.props.add(BINO); BINO.position.set(-.04, .02, .06);
const MIC = microphone(); scene.add(MIC);
const LET = letter(); FARM.props.add(LET); LET.position.set(0, .2, .03); LET.rotation.set(0, 0, 0);
const LET2 = letter(); SET.office.add(LET2); LET2.rotation.x = -Math.PI / 2; LET2.position.set(.05, .835, -.32); LET2.scale.setScalar(.9);
const STAMP = rubberStamp(); GEN.props.add(STAMP); STAMP.rotation.x = Math.PI; STAMP.position.set(0, -.02, .02);
const PROPS = [gunA, gunB, BOARD, BINO, MIC, LET, STAMP, ...crates];

// ---------------- key times (from the voice) ----------------
const C2 = cut('L2'), C3 = cut('L3'), C4 = cut('L4'), C5 = cut('L5'), C6 = cut('L6'), C7 = cut('L7'), C8 = cut('L8'), C9 = cut('L9');
const tWar = w('L1', 'war'), tBirds = w('L1', 'birds'), tLost = w('L1', 'lost');
const t1932 = w('L2', '1932'), t20k = w('L2', '20000'), tFarms = w('L2', 'farms');
const tMajor = w('L3', 'major'), tMer = w('L3', 'meredith'), tTwo = w('L3', 'two'), tGuns = w('L3', 'guns'), t10k = w('L3', '10000');
const tPlan = w('L4', 'plan'), tAmbush = w('L4', 'ambush'), tBut = w('L4', 'but'), tSplit = w('L4', 'split'), tRan = w('L4', 'ran');
const tPut = w('L5', 'put'), tTruck5 = w('L5', 'truck'), tThe5 = w('L5', 'the', 1), tOutran = w('L5', 'outran');
const tWeek = w('L6', 'week'), tRetreat = w('L6', 'retreated');
const tSaid = w('L7', 'said'), tHe = w('L7', 'he'), tBeat = w('L7', 'beat'), tWorld = w('L7', 'world');
const tFarmers = w('L8', 'farmers'), tAgain = w('L8', 'again'), tNo = w('L8', 'no');
const tFinal = w('L9', 'final'), tOne = w('L9', '1'), tZero = w('L9', '0');
const S1b = tWar - .05, S2b = t20k - .25, S3b = tTwo - .25, S4b = tBut - .15, S4c = tRan - .3, S5b = tThe5 - .1, S7b = tHe - .15, S8b = tAgain + .42, S9b = tZero + .35;
const tGrab = tBirds + .06;

// ---------------- helpers ----------------
const put = (p, v, ry = 0) => { p.P.visible = true; p.P.position.copy(v); p.P.rotation.set(0, ry, 0); p.P.updateMatrixWorld(true); };
const show = (...ps) => PROPS.forEach(o => o.visible = ps.includes(o));
const CAMP = new THREE.Vector3(0, 1.4, 6);
function reset() {
  CAST.forEach(p => p.P.visible = false); EMU.forEach(e => { e.P.visible = false; e.root.position.set(0, 0, 0); }); armyHats.forEach(h => h.visible = false); show(); TRK.visible = false;
  MER.head.add(HAT); HAT.position.set(0, 0, 0); HAT.rotation.set(0, 0, 0); HAT.scale.setScalar(1); HAT.visible = true; comb.visible = false;
  for (let i = 0; i < FLOCK.n; i++) FLOCK.hide(i);
  gunT.userData.flash.visible = false; flashK = 0;
}
let flashK = 0;
const headOf = p => { p.P.updateMatrixWorld(true); return p.head.getWorldPosition(V(0, 0, 0)); };
const emuHead = e => { e.P.updateMatrixWorld(true); return e.hd.getWorldPosition(V(0, 0, 0)); };
const putE = (e, v, ry = 0) => { e.P.visible = true; e.P.position.copy(v); e.P.rotation.set(0, ry, 0); e.P.updateMatrixWorld(true); };
const PH = .9;   // stride phase per metre (cartoon: a little quicker than real)
// a run along a curve: returns position, heading, distance
function along(curve, u, len) { const p = curve.getPointAt(clamp(u)), q = curve.getPointAt(clamp(u + .01)); return { p, yaw: Math.atan2(q.x - p.x, q.z - p.z), d: u * len }; }

// ---------------- the flock, per scene ----------------
function flockStampede(t) {   // the hook: hundreds of emus thunder past either side of the Major, toward the lens
  for (let i = 0; i < 300; i++) {
    const side = i % 2 ? 1 : -1, x = 12 + side * (2.2 + Math.pow(hash(i), .7) * 16);
    const sp = 6.5 + hash(i + 9) * 2.2, z = -30 + ((hash(i + 4) * 38 + sp * t) % 38);
    if (Math.abs(x - 12.9) < 1.3 && z > 5) { FLOCK.hide(i); continue; }
    FLOCK.set(i, { x: x + Math.sin(t * 2 + i) * .2, z, yaw: (hash(i + 2) - .5) * .25, ph: z * PH * 3 + i, run: 1, s: .92 + hash(i + 5) * .14 });
  }
}
function flockGraze(t, x0 = -50, x1 = -1, z0 = -80, z1 = 3.5, clear = []) {   // the wheat field: grazing, pecking
  for (let i = 0; i < 1300; i++) {
    const x = x0 + hash(i + 31) * (x1 - x0), z = z0 + Math.pow(hash(i + 17), .8) * (z1 - z0);
    if (clear.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r)) { FLOCK.hide(i); continue; }
    const pk = Math.sin(t * (2.2 + hash(i) * 1.5) + i * 1.3) > .1 ? 1 : 0;
    FLOCK.set(i, { x, z, yaw: hash(i + 7) * 6.28, peck: pk, s: .9 + hash(i + 5) * .16, y: -.08 });
  }
}
const [DX, DZ, DR] = LAY.dam;
function flockDam(t) {   // round the dam; at "split" they scatter in small groups and run
  for (let i = 0; i < 420; i++) {
    const g = i % 46, ga = (g / 46) * Math.PI * 2 + hash(g) * .4, r0 = DR + 1.2 + hash(i + 3) * 6;
    const a0 = ga + (hash(i + 11) - .5) * .35, bx = DX + Math.sin(a0) * r0, bz = DZ + Math.cos(a0) * r0;
    if (bz > -9 && Math.abs(bx - 34) < 5) { FLOCK.hide(i); continue; }
    const k = Math.max(0, t - tSplit - hash(g + 5) * .25), d = 9 * k + 4 * k * k, ang = ga + (hash(g + 7) - .5) * .5;
    const run = k > 0 ? 1 : 0, x = bx + Math.sin(ang) * d, z = bz + Math.cos(ang) * d;
    FLOCK.set(i, { x, z, yaw: run ? ang : a0 + Math.PI + (hash(i) - .5), ph: d * PH * 3 + i, run, peck: run ? 0 : (Math.sin(t * 3 + i) > .3 ? 1 : 0), s: .92 + hash(i + 5) * .14 });
  }
}
function flockChase(t, xe) {   // running alongside the hero emus
  for (let i = 0; i < 140; i++) {
    const x = xe - 2 - hash(i) * 22 + Math.sin(t * 1.3 + i) * .4, z = -8.5 - hash(i + 3) * 14;
    FLOCK.set(i, { x, z, yaw: Math.PI / 2 + (hash(i + 1) - .5) * .2, ph: (x + t * 9) * PH * 3 + i, run: 1, s: .92 + hash(i + 5) * .14 });
  }
}
function flockArmy(t, zl) {   // the emu army: ranks marching toward the lens
  let i = 0;
  for (let r = 0; r < 24; r++) for (let c = 0; c < 13; c++) {
    const x = 60 + (c - 6) * 1.25, z = zl - 6 - r * 1.7;
    if (r < 1 && Math.abs(c - 6) < 3) { FLOCK.hide(i++); continue; }
    FLOCK.set(i++, { x, z, yaw: 0, ph: (z + t * 1.2) * PH * 4 + (r % 2) * Math.PI, run: .45, s: .95 });
  }
}
function flockParty(t) {   // celebrating round the scoreboard
  for (let i = 0; i < 260; i++) {
    const a = hash(i) * Math.PI * 2, r = 5 + hash(i + 3) * 22, x = 8 + Math.sin(a) * r * 1.3, z = -6 - Math.abs(Math.cos(a)) * r;
    const hop = Math.abs(Math.sin(t * 7 + i * 1.7)) * .35;
    FLOCK.set(i, { x, z, y: hop, yaw: Math.atan2(8 - x, 4 - z) + Math.sin(t * 3 + i) * .4, ph: t * 9 + i, run: .4, s: .92 + hash(i + 5) * .14 });
  }
}

// ---------------- camera language ----------------
const camAt = (pos, look, fov = 45, focus, aper = 4, roll = 0) => ({ pos, look, fov, focus: focus ?? pos.distanceTo(look), aper, roll });
const hand = (c, t, a = 1) => { c.pos.x += noise(t, 1) * .012 * a; c.pos.y += noise(t, 2) * .01 * a; c.look.x += noise(t, 3) * .02 * a; c.look.y += noise(t, 4) * .016 * a; return c; };
const MP = V(12, 0, 4);   // the Major in the hook
// the thief's run: behind the Major (grabbing the hat off his head) and away past the lens
const THIEF_PATH = new THREE.CatmullRomCurve3([V(19, 0, -4), V(14.6, 0, 1.6), V(12.7, 0, 3.0), V(10.6, 0, 3.2), V(5.5, 0, 1.5)], false, 'centripetal', .5);
const THIEF_LEN = THIEF_PATH.getLength();
const UG = (() => { let b = 0, bd = 1e9; for (let i = 0; i <= 600; i++) { const p = THIEF_PATH.getPointAt(i / 600), d = Math.hypot(p.x - 12.6, p.z - 3.05); if (d < bd) { bd = d; b = i / 600; } } return b; })();
const thiefU = t => UG + (t - tGrab) * 9 / THIEF_LEN;
// FPV dive into the wheat (1932)
const FP2 = new THREE.CatmullRomCurve3([V(6, 24, 22), V(1, 12, 12), V(-3, 3.2, 4), V(-6.5, 1.5, .6)], false, 'centripetal', .5);
const fpv2 = (t, u) => { const k = eio(seg(t, C2, S2b + .05)), p = FP2.getPointAt(k), a = FP2.getPointAt(Math.min(1, k + .06)); const lk = p.clone().add(a.sub(p).normalize().multiplyScalar(4)); return camAt(p, lk.lerp(V(-9.5, 1.0, -2.5), eio(seg(k, .5, 1))), lerp(62, 50, k), 4, 0, Math.sin(k * Math.PI) * .1); };
// FPV rush across the paddock to the camp (the army sent…)
const CP = V(...[LAY.camp[0], 0, LAY.camp[1]]);
const FP3 = new THREE.CatmullRomCurve3([V(6, 1.2, -4), V(10, .9, 6), V(15, 1.1, 13.5), V(17.2, 1.3, 17.6)], false, 'centripetal', .5);
const fpv3 = (t, u) => { const k = eio(seg(t, C3, tMajor + .1)), p = FP3.getPointAt(k), a = FP3.getPointAt(Math.min(1, k + .06)); const lk = p.clone().add(a.sub(p).normalize().multiplyScalar(3)); return camAt(p, lk.lerp(V(17.4, 1.3, 21.4), eio(seg(k, .45, 1))), lerp(58, 46, k), 3, 0, Math.sin(k * Math.PI) * .08); };
const MER3 = V(17.4, 0, 21.4);
const GUNZ = V(17.3, 0, 20.3);
// chase geometry
const XE = t => 70 + 9 * (t - S5b), XT = t => 63.5 + 6.2 * (t - S5b);
const truckBump = (t, k = 1) => ({ y: Math.abs(Math.sin(t * 11)) * .08 * k, rx: Math.sin(t * 9.3) * .05 * k, rz: Math.sin(t * 7.1 + 1) * .05 * k });
const ROADX = t => 10 - 7.5 * (t - C6);
const ZA = t => -42 + 1.25 * (t - S7b);   // the emu army front rank
const SB = V(8, 0, -2);   // the scoreboard
const THIEF9 = V(9.7, 0, .7);

const SHOTS = [
  // 1a · the hook: the Major poses for the camera, smug; behind him a stampede of emus fills the paddock
  { t0: 0, t1: S1b, set: 'out', lt: DAY, at: V(12, 0, 0), act: t => act1(t),
    cam: (t, u) => hand(camAt(V(lerp(12.55, 12.35, eo(u)), lerp(.55, .7, u), lerp(7.5, 6.5, eo(u))), V(lerp(12.0, 11.95, u), lerp(1.35, 1.25, u), 2.5), 52, 3.3, 4), t, 1.3) },
  // 1b · …on birds: an emu snatches his hat; …and LOST!: push in to his face
  { t0: S1b, t1: C2, set: 'out', lt: DAY, at: V(12, 0, 0), act: t => act1(t),
    cam: (t, u) => { const k = eio(seg(t, tBirds + .2, tLost + .05)), h = MP.clone().add(V(0, 1.3, 0)); return hand(camAt(V(lerp(13.3, 12.25, k), lerp(1.05, 1.3, k), lerp(7.6, 5.15, k)), h.clone().add(V(lerp(.2, 0, k), lerp(-.05, .03, k), 0)), lerp(50, 42, k), lerp(4.0, 1.2, k), lerp(4, 6, k)), t, 1 + k); } },
  // 2a · 1932: FPV dive out of the sky into the wheat
  { t0: C2, t1: S2b, set: 'out', lt: DAY, at: V(-8, 0, -4), act: t => act2(t), cam: fpv2, fpv: 1 },
  // 2b · 20,000 emus were eating the wheat farms: among the peckers, then crane up and back to the horizon
  { t0: S2b, t1: C3, set: 'out', lt: DAY, at: V(-8, 0, -4), act: t => act2(t),
    cam: (t, u) => { const k = eio(seg(t, S2b + .5, C3)); return hand(camAt(V(lerp(-6.9, -2.2, k), lerp(1.85, 7.5, k), lerp(1.2, 9.5, k)), V(lerp(-9.3, -14, k), lerp(1.15, .2, k), lerp(-2.3, -24, k)), lerp(46, 56, k), lerp(3.5, 16, k), 3), t, .8); } },
  // 3a · So the army sent Major Meredith…: FPV rush over the paddock into the camp; he salutes
  { t0: C3, t1: S3b, set: 'out', lt: DAY, at: CP, act: t => act3(t),
    cam: (t, u) => { const f = fpv3(t, u), k = eio(seg(t, tMajor + .1, S3b)); if (k > 0) { f.pos.lerp(V(17.15, 1.32, 18.8), k); f.look.lerp(V(17.4, 1.3, 21.4), k); f.fov = lerp(46, 42, k); f.focus = f.pos.distanceTo(f.look); f.aper = 5; f.roll *= 1 - k; } return hand(f, t, .5); }, fpv: .8 },
  // 3b · two machine guns… and 10,000 bullets: the guns slam down, the crates pile up
  { t0: S3b, t1: C4, set: 'out', lt: DAY, at: CP, act: t => act3(t),
    cam: (t, u) => { const k = eio(seg(t, t10k - .1, t10k + .6)); return hand(camAt(V(lerp(16.85, 17.0, k), lerp(1.05, 1.5, k), lerp(18.7, 17.6, k)), V(lerp(17.25, 17.7, k), lerp(.72, 1.2, k), lerp(20.3, 20.6, k)), lerp(46, 50, k), lerp(1.7, 3.1, k), 5), t, .7); } },
  // 4a · The plan: ambush the flock: over the shoulder at the dam, then round to his evil grin
  { t0: C4, t1: S4b, set: 'out', lt: DAY, at: V(DX, 0, DZ + 8), act: t => act4(t),
    after: 1, cam: (t, u) => { const k = eio(seg(t, tAmbush - .35, tAmbush + .25)), hd = headOf(MER), A = camAt(V(lerp(36.6, 36.3, u), 1.05, lerp(-2.2, -2.8, u)), V(lerp(35.4, 35.6, u), .8, -18), 44, 13, 3), Bc = camAt(hd.clone().add(V(.22, .1, -1.55)), hd.clone().add(V(0, -.04, 0)), 40, 1.57, 6);
      return hand(camAt(A.pos.lerp(Bc.pos, k), A.look.lerp(Bc.look, k), lerp(44, 40, k), lerp(13, 1.57, k), lerp(3, 6, k)), t); } },
  // 4b · But the emus split up…: straight down from a drone over the dam
  { t0: S4b, t1: S4c, set: 'out', lt: DAY, at: V(DX, 0, DZ), act: t => act4(t),
    cam: (t, u) => { const h = lerp(30, 40, eo(u)); return camAt(V(DX + .01, h, DZ + 2.5), V(DX, 0, DZ + 2.5), 50, h, 0, lerp(.2, .5, u)); } },
  // 4c · …and ran!: back on his face, shocked
  { t0: S4c, t1: C5, set: 'out', lt: DAY, at: V(DX, 0, DZ + 8), act: t => act4(t),
    after: 1, cam: (t, u) => { const hd = headOf(MER); return hand(camAt(hd.clone().add(V(lerp(.2, .14, u), .08, lerp(-1.45, -1.15, eo(u)))), hd.clone().add(V(0, -.04, 0)), 40, lerp(1.47, 1.16, u), 6), t, 1.4); } },
  // 5a · So they put a gun on a truck: the truck charges past the lens
  { t0: C5, t1: S5b, set: 'out', lt: DAY, at: V(50, 0, -5), act: t => act5(t),
    cam: (t, u) => { const x = truckX5(t); return hand(camAt(V(lerp(52.6, 53.2, u), .45, lerp(-1.9, -2.3, u)), V(lerp(x + 1, x - 2, seg(t, tTruck5 - .2, S5b)), 1.6, -5.2), lerp(52, 60, u), 6, 3), t, 1.3); } },
  // 5b · The emus outran the truck: racing with the flock; the truck falls behind
  { t0: S5b, t1: C6, set: 'out', lt: DAY, at: V(75, 0, -10), act: t => act5(t), fpv: .3, dissolveOut: .3,
    cam: (t, u) => { const xe = XE(t); return hand(camAt(V(xe + 4.6, lerp(1.0, 1.2, u), -6.4), V(xe - 2.5, 1.05, -11.2), 48, 6.2, 3), t, 1.6); } },
  // 6 · Within a week, the army retreated: sunset, the truck limps away down the road; emus watch it go
  { t0: C6, t1: C7, set: 'out', lt: SUNSET, at: V(4, 0, 36), act: t => act6(t), dissolveOut: .3,
    cam: (t, u) => { const x = ROADX(t); return hand(camAt(V(lerp(15.2, 14.2, u), lerp(1.25, 1.7, u), lerp(31.2, 30.6, u)), V(lerp(x + 2.5, x + .5, u), 1.25, 37.8), 50, 6, 2), t, .7); } },
  // 7a · The Major said: at the microphone, flash bulbs popping
  { t0: C7, t1: S7b, set: 'out', lt: DAY, at: CP, act: t => act7(t), dissolveOut: .3,
    cam: (t, u) => hand(camAt(V(lerp(16.75, 17.15, eio(u)), lerp(1.3, 1.36, u), lerp(17.4, 18.85, eio(u))), V(17.35, lerp(1.28, 1.33, u), 20.6), lerp(46, 40, u), lerp(3.2, 1.75, eio(u)), 5), t) },
  // 7b · …he could beat any army in the world: the emu army marches out of the dust, in slouch hats
  { t0: S7b, t1: C8, set: 'out', lt: DREAM, at: V(60, 0, -42), act: t => act7(t),
    cam: (t, u) => { const z = ZA(t), k = eio(seg(t, tWorld - .45, tWorld + .1)); return hand(camAt(V(lerp(60.6, 60.18, k), lerp(.62, 1.62, k), lerp(z + 4.4, z + 1.25, k)), V(60, lerp(1.25, 1.66, k), z + lerp(-1, .5, k)), lerp(54, 42, k), lerp(4.6, .8, k), 4), t, 1.2); } },
  // 8a · Farmers asked for the army again…: the farmer holds up his letter; an emu reads over his shoulder
  { t0: C8, t1: S8b, set: 'out', lt: DAY, at: V(-3, 0, 4), act: t => act8(t),
    cam: (t, u) => hand(camAt(V(lerp(-2.4, -2.9, eio(u)), lerp(1.25, 1.42, u), lerp(8.9, 7.55, eio(u))), V(-3.1, 1.32, 5.4), lerp(48, 44, u), lerp(3.6, 2.2, u), 4), t) },
  // 8b · …the army said no: the office; the stamp comes down on DENIED
  { t0: S8b, t1: C9, set: 'office', lt: OFFICE, at: OFF, act: t => act8(t),
    cam: (t, u) => { const c = hand(camAt(V(OFF.x + lerp(.45, .32, u), lerp(1.36, 1.3, u), OFF.z + lerp(1.15, .9, u)), V(OFF.x + .02, lerp(1.04, 1.0, u), OFF.z - .7), 44, 1.5, 6), t, .6); const sh = Math.exp(-Math.pow((t - tNo - .05) / .08, 2)) * .02; c.pos.y += Math.sin(t * 80) * sh; return c; } },
  // 9a · Final score: emus 1… Australia 0: the scoreboard; the emus party
  { t0: C9, t1: S9b, set: 'out', lt: DAY, at: SB, act: t => act9(t),
    cam: (t, u) => hand(camAt(V(lerp(10.2, 8.9, eio(u)), lerp(1.1, 1.75, u), lerp(9.8, 4.9, eio(u))), V(lerp(8.4, 8.1, u), lerp(2.0, 2.25, u), -2), lerp(52, 46, u), lerp(11, 6.9, u), 3), t) },
  // 9b · the thief in the Major's hat: a wink
  { t0: S9b, t1: LOOP, set: 'out', lt: DAY, at: SB, act: t => act9(t),
    after: 1, cam: (t, u) => { const h = emuHead(THIEF); return hand(camAt(h.clone().add(V(lerp(.32, .2, u), lerp(-.06, .0, u), lerp(1.45, 1.0, eo(u)))), h.clone().add(V(0, -.06, 0)), 40, lerp(1.48, 1.02, eo(u)), 6), t, .7); } },
];
SHOTS.push({ ...SHOTS[0], t0: LOOP, t1: DUR + 1, loop: 1 });

// ---------------- acting ----------------
function act1(t) {
  reset(); flockStampede(t); FLOCK.commit();
  const stolen = t >= tGrab;
  put(MER, MP, 0);
  const face = t < tGrab + .1 ? 'smug' : t < tLost - .08 ? 'deadpan' : 'shock';
  apply(MER, t < tGrab + .2 ? TP.hips : t < tLost - .1 ? mix(TP.hips, TP.shrug, seg(t, tGrab + .2, tGrab + .5)) : TP.shrug, { t, seed: 1, face, look: t > tGrab + .25 && t < tLost - .1 ? MP.clone().add(V(0, 3, 0)) : CAMP, eyes: t > tGrab + .25 && t < tLost - .1 ? [0, -1] : [0, 0], noBlink: 1 });
  comb.visible = stolen;
  // the thief
  const u = thiefU(t);
  if (u > 0 && u < 1) {
    const a = along(THIEF_PATH, u, THIEF_LEN);
    putE(THIEF, a.p, a.yaw); poseEmu(THIEF, { t, run: 1, ph: a.d * PH * 3, seed: 1, face: stolen ? 'smug' : 'derp', peck: Math.exp(-Math.pow((t - tGrab) / .1, 2)) * .25 });
    if (stolen) {   // the hat flips off his head and lands on the emu's
      const k = seg(t, tGrab, tGrab + .16);
      if (k < 1) { const a = headOf(MER).add(V(0, .12, 0)), b = THIEF.hatPin.getWorldPosition(V(0, 0, 0)); scene.add(HAT); HAT.position.copy(a.lerp(b, eo(k))).add(V(0, Math.sin(k * Math.PI) * .35, 0)); HAT.rotation.set(0, THIEF.P.rotation.y * k, k * 6.28 * .5); HAT.scale.setScalar(lerp(1, .52, k)); }
      else { THIEF.hatPin.add(HAT); HAT.position.set(0, -.02, 0); HAT.rotation.set(-.1, 0, -.15); HAT.scale.setScalar(.52); }
    }
  } else if (stolen) HAT.visible = false;
  // the gun on its bipod at his side, pointing off left
  show(gunA); gunA.position.set(MP.x - .9, .38, MP.z - .1); gunA.rotation.set(0, -Math.PI / 2 - .4, 0);
}
function act2(t) {
  reset(); WIND.value = t;
  flockGraze(t, -50, -1, -80, 3.5, [[-9, -2, 4.5]]); FLOCK.commit();
  const spots = [V(-9.6, 0, -2.6), V(-8.2, 0, -1.4), V(-10.8, 0, -.8), V(-7.6, 0, -3.8), V(-11.4, 0, -3.4)];
  spots.forEach((p, i) => { const e = EMU[i + 1]; putE(e, p.clone().add(V(0, -.06, 0)), [.6, -.5, 1.9, -2.6, 2.2][i]); poseEmu(e, { t, seed: i + 2, peck: (Math.sin(t * (2.6 + i * .3) + i * 2) > .45 && !(i === 1 && t > tFarms - .6)) ? 1 : 0, squawk: Math.max(0, Math.sin(t * 14 + i)) * .5, face: i === 1 ? 'derp' : ['derp', 'happy', 'derp', 'normal', 'derp'][i], look: i === 1 && t > tFarms - .6 ? CAMP : null }); });
}
function act3(t) {
  reset();
  put(MER, MER3, Math.PI); const sal = seg(t, tMajor - .15, tMajor + .15);
  apply(MER, t < tMajor - .15 ? TP.stand : mix(TP.stand, TP.salute, eo(sal)), { t, seed: 1, face: t < tTwo ? 'proud' : 'smug', look: CAMP });
  put(SG1, V(16.3, 0, 21.0), Math.PI - .3); apply(SG1, t < tTwo ? TP.stand : TP.present, { t, seed: 2, face: 'happy', look: CAMP });
  put(SG2, V(18.5, 0, 21.0), Math.PI + .3); apply(SG2, t < tGuns ? TP.stand : TP.present, { t, seed: 3, face: 'happy', look: CAMP });
  show(gunA, gunB, ...crates);
  // two table crates; the guns drop onto them
  crates[0].position.set(GUNZ.x - .45, 0, GUNZ.z); crates[1].position.set(GUNZ.x + .45, 0, GUNZ.z); crates[0].rotation.set(0, 0, 0); crates[1].rotation.set(0, 0, 0);
  const drop = (g, t0, x) => { const k = clamp((t - t0) / .16), y = .5 + .06 + (1 - k * k) * 1.4 + (k >= 1 ? Math.max(0, Math.sin((t - t0 - .16) * 30) * .04 * Math.exp(-(t - t0) * 8)) : 0); g.visible = t > t0 - .05; g.position.set(x, y, GUNZ.z - .02); g.rotation.set(0, Math.PI / 2 + (x > GUNZ.x ? .1 : -.1), 0); };
  drop(gunA, tTwo - .12, GUNZ.x - .45); drop(gunB, tGuns - .12, GUNZ.x + .45);
  // the ammo: six crates rain down into a stack beside them
  for (let i = 2; i < 8; i++) {
    const j = i - 2, row = j < 3 ? 0 : j < 5 ? 1 : 2, col = j < 3 ? j : j < 5 ? j - 3 + .5 : 1;
    const t0 = t10k - .08 + j * .07, k = clamp((t - t0) / .18), x = GUNZ.x + 1.35 + (col - 1) * .82, y = row * .5 + (1 - k * k) * 2.2;
    crates[i].visible = t > t0 - .02; crates[i].position.set(x, y, GUNZ.z + .3); crates[i].rotation.set(0, (hash(i) - .5) * .2, k < 1 ? (1 - k) * .4 : 0);
  }
  if (t > S3b) { CAMP.set(17.2, 1.2, 18.4); }
}
function act4(t) {
  reset(); flockDam(t); FLOCK.commit();
  const MP4 = V(33.85, 0, -5.5), GP = V(35.2, 0, -5.9);
  put(MER, MP4, Math.PI + .1);
  const evil = t > tAmbush - .15 && t < S4c, shock = t >= tRan - .08;
  const lowered = t > tAmbush - .5;
  apply(MER, lowered ? mix(TP.binoc, TP.crouch, eo(seg(t, tAmbush - .5, tAmbush - .2))) : TP.binoc, { t, seed: 1, face: shock ? 'shock' : evil ? 'evil' : 'calm', look: lowered ? CAMP : V(DX, 1, DZ), noBlink: 1 });
  show(BINO);
  put(SG2, GP, Math.PI - .15); apply(SG2, TP.gunner, { t, seed: 3, face: t > tSplit ? 'shock' : 'calm', look: V(DX, 1, DZ) });
  show(BINO, gunA); gunA.position.set(GP.x - .05, .32, GP.z - .62); gunA.rotation.set(-.04, Math.PI - .15, 0);
  // hero emu in the over-the-shoulder: one curious bird near the bank
  const e = EMU[1]; const k = Math.max(0, t - tSplit - .1);
  putE(e, V(33.2 - 9 * k, 0, -12.5 + 3 * k), k > 0 ? -1.9 : .2); poseEmu(e, { t, run: k > 0 ? 1 : 0, ph: k * 9 * PH * 3, seed: 7, face: k > 0 ? 'shock' : 'derp', look: k > 0 ? null : CAMP });
}
const truckX5 = t => 39 + 11 * (t - C5);
function placeTruck(p, yaw, t, k = 1) {
  TRK.visible = true; TRK.position.copy(p); TRK.rotation.set(0, yaw, 0);
  const b = truckBump(t, k); TRK.userData.body.position.y = b.y; TRK.userData.body.rotation.set(b.rx, 0, b.rz);
  TRK.userData.wheels.forEach(wh => wh.rotation.x = t * 14 * k);
  TRK.updateMatrixWorld(true);
  return b;
}
const onTruck = (p, local, ry = 0) => { const v = TRK.userData.body.localToWorld(local.clone()); put(p, v, TRK.rotation.y + ry); };
function crewOnTruck(t, mood) {
  // driver in the cab, the gunner behind the mounted gun, the Major standing in the tray
  onTruck(SG1, V(.42, .62, .45)); apply(SG1, TP.sit, { t, seed: 2, face: mood === 'sad' ? 'worried' : 'calm' }); SG1.aL.sh.rotation.x = -1.2; SG1.aR.sh.rotation.x = -1.2;
  if (mood === 'sad') { onTruck(SG2, V(-.55, .7, -2.4), Math.PI / 2); apply(SG2, TP.slump, { t, seed: 3, face: 'worried' }); onTruck(MER, V(.5, .7, -2.5), -Math.PI / 2); apply(MER, TP.slump, { t, seed: 1, face: 'deadpan' }); }
  else {
    const bb = Math.abs(Math.sin(t * 11)) * .1;
    onTruck(SG2, V(0, 1.05 + bb, -2.3)); apply(SG2, TP.hold, { t, seed: 3, face: t > tOutran ? 'worried' : 'angry' });
    onTruck(MER, V(.62, 1.05 + bb * .6, -1.0)); apply(MER, TP.pointFwd, { t, seed: 1, face: t > tOutran ? 'shock' : 'angry', look: CAMP });
  }
}
function act5(t) {
  reset();
  if (t < S5b) {
    const x = truckX5(t); placeTruck(V(x, 0, -5.2), Math.PI / 2, t, 1); crewOnTruck(t, 'go');
  } else {
    const xe = XE(t), xt = XT(t);
    flockChase(t, xe); FLOCK.commit();
    placeTruck(V(xt, 0, -10.6), Math.PI / 2, t, 1.6); crewOnTruck(t, 'go');
    // hero emus sprinting in front of the lens
    [[0, -9.4], [-1.6, -11.8], [-3.0, -9.9], [-.9, -13.6], [-4.4, -12.6]].forEach(([dx, z], i) => {
      const e = EMU[i + 1], x = xe + dx + Math.sin(t * 2 + i) * .15;
      putE(e, V(x, 0, z), Math.PI / 2 + (i === 0 && t > tOutran - .1 ? 0 : 0));
      const smug = i === 0 && t > tOutran - .05;
      poseEmu(e, { t, run: 1, ph: (x + t * 2) * PH * 3 + i * 1.3, seed: i + 2, face: smug ? 'smug' : ['derp', 'normal', 'derp', 'happy', 'derp'][i], look: smug ? CAMP : null });
    });
  }
}
function act6(t) {
  reset();
  const x = ROADX(t); placeTruck(V(x, 0, 38.6), -Math.PI / 2, t, .5); crewOnTruck(t, 'sad');
  gunT.rotation.x = .35;   // the gun droops
  [[9.6, 34.4, -1.2], [11.4, 35.4, -1.4], [7.9, 33.8, -.9]].forEach(([ex, ez, ry], i) => { const e = EMU[i + 1]; putE(e, V(ex, 0, ez), ry); poseEmu(e, { t, seed: i + 4, face: i === 0 ? 'smug' : 'derp', look: TRK.position.clone().add(V(0, 1.4, 0)) }); });
}
function act7(t) {
  reset();
  if (t < S7b) {
    put(MER, MER3.clone().add(V(0, 0, -.6)), Math.PI); show(MIC); MIC.position.set(MER3.x - .3, 0, MER3.z - .95); MIC.scale.setScalar(.78);
    const talking = t > LN.L7.t0 - .05 && t < S7b + .2;
    apply(MER, TP.speech, { t, seed: 1, face: t < tSaid + .2 ? 'proud' : 'smug', look: CAMP, talk: talking ? .45 + .45 * Math.sin(t * 26) : 0 });
    MER.aR.sh.rotation.x += Math.sin(t * 5) * .15;
    // flash bulbs
    const fl = [C7 + .15, C7 + .7, C7 + 1.25, C7 + 1.6].reduce((a, tf) => a + Math.exp(-Math.pow((t - tf) / .05, 2)), 0); bulb.intensity = fl * 30; bulb.position.set(17.0, 1.8, 18.5); flashK = fl;
  } else {
    const zl = ZA(t);
    flockArmy(t, zl); FLOCK.commit();
    const ranks = [[0, 0], [-1.25, -.4], [1.25, -.4], [-2.5, -1.9], [-.65, -1.9], [.65, -1.9], [2.5, -1.9], [-1.9, -3.6], [0, -3.6], [1.9, -3.6], [3.4, -3.6]];
    ranks.forEach(([dx, dz], i) => {
      const e = EMU[i + 1], z = zl + dz; putE(e, V(60 + dx, 0, z), 0); armyHats[i].visible = true;
      const lead = i === 0;
      poseEmu(e, { t, run: .42, ph: (z + t * 1.25) * PH * 4 + (i % 2) * Math.PI, seed: i + 2, face: lead ? (t > tWorld - .1 ? 'evil' : 'angry') : 'angry', look: lead ? CAMP : null });
    });
  }
}
function act8(t) {
  reset();
  if (t < S8b) {
    WIND.value = t;
    flockGraze(t, -40, -1, -60, 3.6, [[-3, 4, 3]]); FLOCK.commit();
    put(FARM, V(-3.1, 0, 5.75), .12); apply(FARM, TP.holdUp, { t, seed: 4, face: t > tAgain - .2 ? 'worried' : 'angry', look: CAMP, talk: 0 });
    show(LET); LET.position.set(.02, .16, .04); LET.scale.setScalar(.62); FARM.P.updateMatrixWorld(true); LET.lookAt(CAMP);
    const e = EMU[1]; putE(e, V(-2.45, 0, 4.25), -.35); poseEmu(e, { t, seed: 3, face: 'derp', lean: .25, look: headOf(FARM).add(V(.2, .25, 0)) });
  } else {
    put(GEN, V(OFF.x, .02, OFF.z - 1.12), 0);
    const k = seg(t, tNo - .16, tNo);
    apply(GEN, t < tNo - .16 ? TP.stampUp : mix(TP.stampUp, TP.stampDn, k * k), { t, seed: 6, face: 'deadpan', look: V(OFF.x, .8, OFF.z - .3) });
    show(STAMP); LET2.userData.stamp(t >= tNo ? 1 : 0);
  }
}
function act9(t) {
  reset(); flockParty(t); FLOCK.commit();
  show(BOARD); BOARD.position.copy(SB); BOARD.rotation.set(0, 0, 0); BOARD.userData.set(t >= tOne ? '1' : '–', t >= tZero ? '0' : '–');
  [[5.2, .2], [6.6, -.9], [10.6, -.6], [11.9, .4], [4.4, 1.6], [7.4, 1.2]].forEach(([x, z], i) => {
    const e = EMU[i + 1], hop = Math.abs(Math.sin(t * 6.5 + i * 1.9)) * .3;
    putE(e, V(x, hop, z), Math.atan2(9 - x, 8 - z) + Math.sin(t * 2 + i) * .3);
    poseEmu(e, { t, run: .35, ph: t * 10 + i, seed: i + 2, face: ['happy', 'derp', 'happy', 'normal', 'derp', 'happy'][i], squawk: Math.max(0, Math.sin(t * 7 + i)) });
  });
  putE(THIEF, THIEF9, -.15); THIEF.hatPin.add(HAT); HAT.position.set(0, -.02, 0); HAT.rotation.set(-.1, 0, -.12); HAT.scale.setScalar(.46);
  const wink = t > S9b + .45 && t < S9b + .95;
  poseEmu(THIEF, { t, seed: 1, face: t > S9b ? 'smug' : 'happy', wink, look: CAMP, squawk: t < S9b ? Math.max(0, Math.sin(t * 7)) * .6 : 0 });
}

// ---------------- sound events (the score reads these) ----------------
ev(0, 'stampede', { d: S1b + 1.2 }); ev(.12, 'pop'); ev(tGrab - .25, 'swish'); ev(tGrab, 'snatch'); ev(tLost - .02, 'sting'); ev(tLost, 'stamp');
ev(C2 - .05, 'whoosh'); ev(t1932, 'pop'); ev(t20k - .05, 'counter', { d: .7 }); ev(S2b + .1, 'pecks', { d: C3 - S2b - .1 });
ev(C3 - .05, 'whoosh'); ev(tMajor, 'snap'); ev(tTwo - .02, 'clang'); ev(tGuns - .02, 'clang'); for (let j = 0; j < 6; j++) ev(t10k + .1 + j * .07, 'thud'); ev(t10k, 'counter', { d: .6 });
ev(C4, 'cut'); ev(tAmbush - .1, 'evil'); ev(S4b, 'whoosh'); ev(tSplit, 'scatter'); ev(tRan - .05, 'pop');
ev(C5, 'engine', { d: C6 - C5 + .2 }); ev(tTruck5 - .3, 'whoosh'); ev(S5b - .05, 'stampede', { d: C6 - S5b + .2 }); ev(tOutran, 'boing');
ev(C6 - .1, 'whoosh'); ev(tRetreat - .02, 'stamp'); ev(tRetreat, 'trombone');
ev(C7 - .1, 'whoosh'); for (const tf of [C7 + .15, C7 + .7, C7 + 1.25, C7 + 1.6]) ev(tf, 'flash'); ev(S7b - .1, 'whoosh'); ev(S7b, 'march', { d: C8 - S7b }); ev(tWorld - .02, 'sting');
ev(C8, 'cut'); ev(tFarmers + .05, 'pop'); ev(tFarmers + .4, 'pop'); ev(tFarmers + .75, 'pop'); ev(S8b, 'cut'); ev(tNo - .02, 'slam');
ev(C9 - .05, 'whoosh'); ev(tOne, 'flip'); ev(tZero, 'flip'); ev(tOne + .1, 'squawk'); ev(tZero + .2, 'squawk'); ev(S9b + .45, 'ding');

// ---------------- the overlay: telops + counters + 1–3 word captions ----------------
const ov = document.getElementById('ov').getContext('2d');
const snap = document.createElement('canvas'); snap.width = W; snap.height = H; const sctx = snap.getContext('2d');
const num = n => Math.round(n).toLocaleString('en-US');
const TEL = [
  { t0: -1, t1: tLost - .05, text: 'AUSTRALIA vs EMUS', y: 300, size: 100, col: '#FFD23F', rot: -4, plate: '#2E5A34' },
  { t0: tLost - .05, t1: C2, text: 'LOST!', y: 560, size: 170, col: '#E8423A', rot: -9, stamp: 1 },
  { t0: t1932 - .05, t1: S2b + .3, text: '1932', y: 300, size: 170, col: '#FFD23F', rot: -5 },
  { t0: t20k - .05, t1: C3, text: t => num(20000 * eo(seg(t, t20k - .05, t20k + .7))), y: 300, size: 170, col: '#FFD23F', rot: -4, sub: 'EMUS' },
  { t0: tMer - .1, t1: S3b + .3, text: 'MAJOR MEREDITH', y: 1440, size: 80, col: '#FFFFFF', rot: -3, plate: '#5E6A34', sub: 'ROYAL AUSTRALIAN ARTILLERY' },
  { t0: tTwo - .05, t1: t10k - .1, text: '2 MACHINE GUNS', y: 300, size: 96, col: '#FFFFFF', rot: 3, plate: '#3A3D40' },
  { t0: t10k - .05, t1: C4, text: t => num(10000 * eo(seg(t, t10k - .05, t10k + .6))), y: 300, size: 170, col: '#FFD23F', rot: -4, sub: 'BULLETS' },
  { t0: tPlan - .05, t1: S4b, text: 'THE PLAN: AMBUSH', y: 300, size: 92, col: '#FFFFFF', rot: -3, plate: '#2E5A34' },
  { t0: tPut - .1, t1: S5b, text: 'PLAN B', y: 300, size: 130, col: '#FFFFFF', rot: 4, plate: '#C8283A' },
  { t0: S5b, t1: C6, text: 'EMUS: 50 KM/H', y: 300, size: 100, col: '#FFD23F', rot: -4, plate: '#1B1213' },
  { t0: tWeek - .1, t1: C7, text: 'DAY 6', y: 300, size: 120, col: '#FFFFFF', rot: 3, plate: '#5A3A6A' },
  { t0: tRetreat - .05, t1: C7, text: 'RETREAT!', y: 560, size: 150, col: '#FFFFFF', rot: -8, stamp: 1 },
  { t0: S7b + .15, t1: C8, text: 'EMU ARMY', y: 300, size: 140, col: '#FFD23F', rot: -5, stamp: 1 },
  { t0: tFarmers, t1: S8b, text: '1934', y: 250, size: 110, col: '#FFFFFF', rot: -6, plate: '#8A4A2A' },
  { t0: tFarmers + .35, t1: S8b, text: '1943', y: 400, size: 110, col: '#FFFFFF', rot: 4, plate: '#8A4A2A' },
  { t0: tFarmers + .7, t1: S8b, text: '1948', y: 550, size: 110, col: '#FFFFFF', rot: -3, plate: '#8A4A2A' },
];
function drawTelop(x, t) {
  const p = seg(t, x.t0, x.t0 + .25), sc = x.stamp ? lerp(2.2, 1, eo(p)) : back(p, 2.6), wob = 1 + .02 * Math.sin((t - x.t0) * 8);
  const text = typeof x.text === 'function' ? x.text(t) : x.text;
  ov.save(); ov.translate(540, x.y); ov.rotate(x.rot * Math.PI / 180); ov.scale(sc * wob, sc * wob); if (x.stamp) ov.globalAlpha = clamp(p * 3);
  ov.font = `900 ${x.size}px Montserrat`; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  const tw = Math.min(1000, ov.measureText(text).width + 70), th = x.size * 1.4;
  if (x.plate) { ov.fillStyle = 'rgba(0,0,0,.85)'; ov.beginPath(); ov.roundRect(-tw / 2 + 10, -th / 2 + 12, tw, th, 28); ov.fill(); ov.fillStyle = x.plate; ov.beginPath(); ov.roundRect(-tw / 2, -th / 2, tw, th, 28); ov.fill(); }
  if (x.stamp) { ov.strokeStyle = x.col; ov.lineWidth = 14; ov.beginPath(); ov.roundRect(-tw / 2 + 5, -th / 2 + 8, tw - 10, th - 16, 18); ov.stroke(); }
  ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 20; ov.shadowOffsetY = 8; ov.lineWidth = x.size * .2; ov.strokeStyle = '#000'; ov.strokeText(text, 0, 4, 960); ov.shadowColor = 'transparent'; ov.fillStyle = x.col; ov.fillText(text, 0, 4, 960);
  if (x.sub) { ov.font = '900 46px Montserrat'; const sw = ov.measureText(x.sub).width + 44; ov.fillStyle = '#FFD23F'; ov.beginPath(); ov.roundRect(-sw / 2, x.size * .7 + 4, sw, 66, 18); ov.fill(); ov.fillStyle = '#1B1213'; ov.fillText(x.sub, 0, x.size * .7 + 39); }
  ov.restore();
}
const chunks = [];
TMJ.lines.forEach((l, li) => { let cur = []; const flush = () => { if (cur.length) chunks.push({ li, words: cur }); cur = []; };
  l.words.forEach(x => { const len = cur.reduce((a, y) => a + y.w.length + 1, 0) + x.w.length; if (cur.length && (len > 14 || cur.length >= 3)) flush(); cur.push(x); if (/[,.…!?:]$/.test(x.w)) flush(); }); flush(); });
chunks.forEach((c, i) => { const n = chunks[i + 1]; c.text = c.words.map(x => x.w).join(' '); c.a = c.words[0].t0 - .04; c.b = n ? Math.min(n.words[0].t0 - .04, c.words[c.words.length - 1].t1 + .6) : c.words[c.words.length - 1].t1 + .6; });
const CAPY = 1180;
function drawCaption(t) {
  const c = chunks.find(c => t >= c.a && t < c.b); if (!c) return;
  const pop = back(seg(t, c.a, c.a + .12), 2.2), s = lerp(.6, 1, pop);
  ov.save(); ov.translate(W / 2, CAPY); ov.scale(s, s); ov.font = '900 104px Montserrat'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 22; ov.shadowOffsetY = 8; ov.lineWidth = 26; ov.strokeStyle = '#000'; ov.strokeText(c.text, 0, 0, 1000);
  ov.shadowColor = 'transparent'; ov.fillStyle = '#FFFFFF'; ov.fillText(c.text, 0, 0, 1000); ov.restore();
}

// ---------------- render ----------------
function frame(sh, t) {
  const tt = sh.loop ? 0 : t, u = sh.loop ? 0 : seg(t, sh.t0, sh.t1);
  for (const [k, s] of Object.entries(SET)) s.visible = k === sh.set;
  light(sh.lt, sh.at);
  WIND.value = tt; SET.out.userData.fan.rotation.z = -tt * 2.2;
  let c = sh.after ? null : sh.cam(tt, u); if (c) CAMP.copy(c.pos);
  sh.act(tt);
  if (!c) { c = sh.cam(tt, u); CAMP.copy(c.pos); }
  camera.position.copy(c.pos); camera.up.set(0, 1, 0); camera.lookAt(c.look); camera.rotateZ(c.roll ?? 0); camera.fov = c.fov; camera.updateProjectionMatrix();
  SET.out.updateMatrixWorld();
  post.dof.focus = c.focus; post.dof.aper = c.aper; post.dof.maxCoc = 8;
  const f = sh.fpv ? Math.sin(seg(tt, sh.t0, sh.t1) * Math.PI) * sh.fpv : 0; zb.uniforms.amt.value = f * .09; zb.enabled = f > .02;
  scene.updateMatrixWorld(true); post.composer.render();
}
const A0 = +(QS.get('a') ?? 0), B0 = +(QS.get('b') ?? DUR);
function render(t) {
  const i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1), sh = SHOTS[i < 0 ? SHOTS.length - 1 : i];
  const prev = SHOTS[i - 1], dis = prev?.dissolveOut && !sh.loop && t < sh.t0 + prev.dissolveOut ? 1 - (t - sh.t0) / prev.dissolveOut : 0;
  ov.clearRect(0, 0, W, H);
  if (dis > 0) { frame(prev, t); sctx.clearRect(0, 0, W, H); sctx.drawImage(renderer.domElement, 0, 0); }
  frame(sh, t);
  if (dis > 0) { ov.globalAlpha = eio(dis) * .85; ov.drawImage(snap, 0, 0); ov.globalAlpha = 1; }
  if (flashK > .02) { ov.fillStyle = `rgba(255,255,255,${Math.min(.7, flashK * .7)})`; ov.fillRect(0, 0, W, H); }
  if (QS.get('poster')) { ov.clearRect(0, 0, W, H); [['AUSTRALIA WENT TO WAR', 170, -4, '#FFFFFF', 104], ['WITH EMUS… AND LOST', 320, -4, '#FFD23F', 112]].forEach(([text, y, rot, col, size]) => drawTelop({ t0: -9, text, y, size, col, rot }, t)); return; }
  if (QS.get('clean')) return;
  if (t < LOOP) { TEL.forEach(x => { if (t >= x.t0 && t < x.t1) drawTelop(x, t); }); drawCaption(t); }
}
function texts(t) { if (t >= LOOP) return []; return TEL.filter(x => typeof x.text === 'string' && t >= x.t0 + .3 && t < x.t1).map(x => ({ id: x.text, text: x.text, x0: 60, y0: x.y - x.size * .7, x1: 1020, y1: x.y + x.size * .7 })); }
EV.sort((a, b) => a.t - b.t);
window.DUR = +(B0 - A0).toFixed(3); window.EV = EV; window.render = t => render(t + A0); window.TEXTS = t => texts(t + A0);
render(A0);
window.READY = true;
