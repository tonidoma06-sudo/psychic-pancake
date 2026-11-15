// "What If Everyone Had Ratings Above Their Heads?" · part 3 · "The Final" · 3D vertical Short (1080×1920), v4 toon style.
// Live on TV, Kai's hidden number (mental health 12) is out. Halfway up the final wall it drops to 4 and he freezes; Theo climbs
// back down and talks him through it (10, 25, 40); they finish dead last… but the final was scored by how much you changed: Kai's
// EQ +40, every one of Theo's stats up, his card turns gold, and the crowd reads his potential, 99. That night Mia walks past the
// 97 to stand next to the zero. Fifty years later: still 0%, mental health 100 and 100.
// Every shot, action, telop and caption is placed from timing.json (the voice). render(t) is pure in t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { makePost } from '/core/three/post.js';
import { makeToon, apply, TP, mix, walk, TM, G } from './toon.js';
import { city, stadium, ST, SD } from './sets_ratings.js';
import { fullCard, miniCard, heart, tier } from './cards.js';
import { skyDome } from './sky.js';

const W = 1080, H = 1920;
await document.fonts.load('900 80px Montserrat'); await document.fonts.load('800 80px Montserrat'); await document.fonts.load('700 80px Fredoka'); await document.fonts.load('600 80px Fredoka');
const TMJ = await (await fetch('timing.json')).json();
const B = 60 / TMJ.bpm, DUR = TMJ.dur, LOOP = DUR - B;
const LN = Object.fromEntries(TMJ.lines.map(l => [l.id, l]));
const nrm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const w = (lid, word, k = 0) => { const ws = LN[lid].words.filter(x => nrm(x.w).startsWith(nrm(word))); return (ws[k] || ws[ws.length - 1] || { t0: LN[lid].t0 }).t0; };
const cut = id => { const i = TMJ.lines.findIndex(l => l.id === id), pv = TMJ.lines[i - 1], l = LN[id];   // never cut away while the last line is still being said
  return pv ? Math.max(l.cut, Math.min(pv.t1 + .06, l.t0 - .02)) : l.cut; };
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
const camera = new THREE.PerspectiveCamera(45, W / H, .03, 2000);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, ao: false });
post.bloom.strength = .2; post.bloom.threshold = .95; post.bloom.radius = .5;
const vg = post.vig.uniforms; vg.amt.value = .22; vg.sat.value = 1.2; vg.contrast.value = .12;
const zb = new ShaderPass({ uniforms: { tDiffuse: { value: null }, amt: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: 'uniform sampler2D tDiffuse; uniform float amt; varying vec2 vUv; void main(){ vec2 d = vUv - .5; vec4 s = vec4(0.); for (int i = 0; i < 14; i++) { float k = 1. - amt * float(i) / 13. * length(d) * 2.; s += texture2D(tDiffuse, .5 + d * k); } gl_FragColor = s / 14.; }' });
post.composer.insertPass(zb, 1);
const sun = new THREE.DirectionalLight('#FFF4E0', 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
scene.add(sun, sun.target); const hemi = new THREE.HemisphereLight('#BFDFFF', '#4A6A2A', 1); scene.add(hemi);
const sky = skyDome('#2A78E0', '#E8E2D6', V(-.4, .5, .6), '#FFF6D8'); scene.add(sky);
const SUNNY = { pos: [-22, 38, 30], col: '#FFF1DA', int: 3.0, hs: '#C8E0FF', hg: '#A89A80', hemi: 1.05, fog: ['#C8DCEC', 70, 420], sky: ['#2A78E0', '#E4EEF2', [-.4, .5, .6], '#FFF6D8'], env: .35, r: 14, warm: .12 };
const GREY = { pos: [-10, 40, 22], col: '#C4CCD8', int: 1.1, hs: '#B4BFCE', hg: '#6A6A70', hemi: 1.3, fog: ['#98A2AE', 28, 220], sky: ['#727C8C', '#AEB6C0', [0, .5, .6], '#D0D4DA'], env: .3, r: 12, warm: 0 };
const _ca = new THREE.Color(), _cb = new THREE.Color();
const lc = (a, b, k) => '#' + _ca.set(a).lerp(_cb.set(b), k).getHexString();
const mixLT = (a, b, k) => ({ pos: a.pos.map((v, i) => lerp(v, b.pos[i], k)), col: lc(a.col, b.col, k), int: lerp(a.int, b.int, k), hs: lc(a.hs, b.hs, k), hg: lc(a.hg, b.hg, k), hemi: lerp(a.hemi, b.hemi, k),
  fog: [lc(a.fog[0], b.fog[0], k), lerp(a.fog[1], b.fog[1], k), lerp(a.fog[2], b.fog[2], k)], sky: [lc(a.sky[0], b.sky[0], k), lc(a.sky[1], b.sky[1], k), a.sky[2].map((v, i) => lerp(v, b.sky[2][i], k)), lc(a.sky[3], b.sky[3], k)], env: lerp(a.env, b.env, k), r: a.r, warm: lerp(a.warm, b.warm, k) });
function light(o, at) {
  sun.color.set(o.col); sun.intensity = o.int; sun.position.set(at.x + o.pos[0], at.y + o.pos[1], at.z + o.pos[2]); sun.target.position.copy(at);
  const c = sun.shadow.camera, r = o.r ?? 10; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 1; c.far = 200; c.updateProjectionMatrix();
  hemi.color.set(o.hs); hemi.groundColor.set(o.hg); hemi.intensity = o.hemi;
  scene.fog = new THREE.Fog(o.fog[0], o.fog[1], o.fog[2]); sky.visible = true;
  const u = sky.material.uniforms; u.top.value.set(o.sky[0]); u.hor.value.set(o.sky[1]); u.sd.value.set(...o.sky[2]).normalize(); u.sc.value.set(o.sky[3]);
  scene.environmentIntensity = o.env ?? .35; vg.warm.value = o.warm ?? .1;
}


// ---------------- the sets ----------------
const CITY = city(); scene.add(CITY);
const STAD = stadium(); scene.add(STAD); const SO = V(0, 0, 400); STAD.position.copy(SO);   // the stadium, far from the street
const SW = .12;
const P3 = (x, z) => V(x, SW, z), SP = (x, z, y = 0) => SO.clone().add(V(x, y, z));
const STADIUM = { pos: [-25, 45, 30], col: '#FFF4E0', int: 3.0, hs: '#CFE4FF', hg: '#8A9A70', hemi: 1.1, fog: ['#C8DCEC', 90, 520], sky: ['#2A78E0', '#E4EEF2', [-.4, .5, .6], '#FFF6D8'], env: .4, r: 16, warm: .1 };
const NIGHT = { pos: [-14, 26, 20], col: '#7A90D8', int: .45, hs: '#3A4A80', hg: '#18161E', hemi: .32, fog: ['#121A30', 18, 120], sky: ['#050A1E', '#1E2850', [-.5, .35, .6], '#FFF2C8'], env: .06, r: 12, warm: 0, lamps: 1 };
const GOLDEN = { pos: [-30, 14, 22], col: '#FFCB96', int: 2.5, hs: '#FFE8D2', hg: '#8A7460', hemi: 1.15, fog: ['#F2C9A2', 50, 360], sky: ['#4E70C4', '#FFC48A', [-.65, .14, .5], '#FFE4A8'], env: .3, r: 12, warm: .2 };
// warm street-lamp light for the night scene (the bench sits between two lamps)
const LAMPS = [V(-.5, 4.3, -2.65), V(12, 4.3, -2.65), V(4.4, 3.4, -3.6)].map(p => { const l = new THREE.PointLight('#FFC27A', 0, 0, 1.7); l.position.copy(p); scene.add(l); return l; });
const _light = light;
function lightP3(o, at) { _light(o, at); const n = o.lamps ? 1 : 0; LAMPS.forEach((l, i) => l.intensity = n * [7, 7, 3.5][i]); vg.amt.value = n ? .4 : .22; CITY.userData.bulbs.forEach(b => b.material.emissiveIntensity = n ? 4 : .5); }

// ---------------- cast (each with a card) ----------------
const mk = (o, card = 'mini', v = {}) => { const p = makeToon({ shoe: '#2A2A30', ...o }); scene.add(p.P); p.kind = card; p.H = o.H ?? 1; p.card = card === 'full' ? fullCard() : miniCard(); scene.add(p.card); p.v = v; return p; };
const THEO = mk({ name: 'theo', outfit: 'hoodie', top: '#7A9A86', pants: '#3C4A6A', hair: 'messy', hairC: '#3A2A20', shoe: '#E8E2D6' }, 'full', { ovr: 52, str: 41, ath: 47, hp: 72, iq: 106, eq: 93, mh: 61, pot: 99 });
const MIA = mk({ name: 'mia', outfit: 'tee', top: '#F2B33A', pants: '#2A3A5A', hair: 'bob', hairC: '#7A3A22', blush: 1, shoe: '#C8283A', seed: 4 }, 'full', { ovr: 88, str: 62, ath: 85, hp: 90, iq: 131, eq: 96, mh: 88, pot: 95 });
const KAI = mk({ name: 'kai', outfit: 'tee', top: '#1C1C22', pants: '#2A2A30', logo: 'K', logoCol: '#FFC83A', hair: 'slick', hairC: '#E8C870', glasses: 'shades', H: 1.1, shoe: '#F4F1EA', seed: 6 }, 'full', { ovr: 94, str: 97, ath: 98, hp: 95, iq: 118, eq: 19, mh: 12, pot: 94 });
const HOST = mk({ name: 'host', outfit: 'suit', top: '#7A2E8E', pants: '#2A1E38', tie: '#FFD23F', pocketSq: '#FFD23F', hair: 'slick', hairC: '#1A1210', seed: 30 }, 'mini', { ovr: 81 });
const JUD = [0, 1, 2].map(i => mk({ name: 'judge' + i, outfit: 'suit', top: ['#2A2C34', '#3A2A4A', '#2A3A4A'][i], pants: '#1E1E24', tie: ['#C8283A', '#FFD23F', '#2E7FE0'][i], hair: ['bob', 'slick', 'none'][i], hairC: ['#C8C4BC', '#1A1210', '#3A2A20'][i], glasses: i === 1 ? 'round' : undefined, seed: 60 + i }, 'mini', { ovr: [90, 86, 92][i] }));
const RUN = [0, 1, 2, 3].map(i => mk({ name: 'run' + i, outfit: 'tee', top: ['#E8423A', '#3EB2E8', '#F2B33A', '#9A6AC8'][i], pants: '#2A2A30', hair: ['beanie', 'messy', 'slick', 'bob'][i], hairC: ['#2A2018', '#6A3A1A', '#1A1A1E', '#C88A3A'][i], hatC: '#2E9A4A', seed: 40 + i }, 'mini', { ovr: [88, 83, 79, 86][i] }));
const FAN = [0, 1, 2].map(i => mk({ name: 'fan' + i, outfit: ['hoodie', 'tee', 'polo'][i], top: ['#E89A4A', '#4AC88A', '#C84A6A'][i], hair: ['beanie', 'bob', 'messy'][i], hatC: '#2E7FE0', hairC: ['#2A2018', '#6A3A1A', '#1A1A1E'][i], seed: 50 + i }, 'mini', { ovr: [71, 84, 66][i] }));
// fifty years on: same hoodie, same yellow tee
const OLDT = mk({ name: 'theo_old', outfit: 'hoodie', top: '#7A9A86', pants: '#3C4A6A', hair: 'messy', hairC: '#F6F6F6', glasses: 'round', shoe: '#E8E2D6' }, 'full', { ovr: 81, str: 30, ath: 28, hp: 66, iq: 112, eq: 99, mh: 100, pot: 99 });
const OLDM = mk({ name: 'mia_old', outfit: 'tee', top: '#F2B33A', pants: '#2A3A5A', hair: 'bob', hairC: '#FAFAFA', blush: 1, shoe: '#C8283A', seed: 4 }, 'full', { ovr: 86, str: 38, ath: 41, hp: 72, iq: 129, eq: 99, mh: 100, pot: 95 });
const CAST = [THEO, MIA, KAI, HOST, ...JUD, ...RUN, ...FAN, OLDT, OLDM];
[OLDT, OLDM].forEach(p => p.head.traverse(o => { const m = o.material; if (m && m.color && ['f6f6f6', 'fafafa'].includes(m.color.getHexString()) && m.emissive) m.emissive.set('#7A7A7A'); }));
// props
const ENV = G(); TM(new THREE.BoxGeometry(.34, .24, .012), '#FFD23F', ENV, 0, 0, 0, .004); TM(new THREE.BoxGeometry(.26, .02, .014), '#C8283A', ENV, 0, .03, 0, .002); scene.add(ENV);   // the judges' envelope
const HEART = heart(); scene.add(HEART);
const CANE = G(); TM(new THREE.CylinderGeometry(.018, .018, .86, 8), '#5A3A22', CANE, 0, .43, 0, .003); const hook = TM(new THREE.TorusGeometry(.06, .018, 6, 12, Math.PI), '#5A3A22', CANE, -.06, .86, 0, .003); scene.add(CANE);
const PROPS = [ENV, CANE];

// ---------------- key times (from the voice) ----------------
const C2 = cut('L2'), C3 = cut('L3'), C4 = cut('L4'), C5 = cut('L5'), C6 = cut('L6'), C7 = cut('L7'), C8 = cut('L8'), C9 = cut('L9');
const tThe1 = w('L1', 'the'), tHidden1 = w('L1', 'hidden'), tMental1 = w('L1', 'mental'), t12a = w('L1', '12'), tIts = w('L1', 'its'), tYears = w('L1', 'years');
const tHe2 = w('L2', 'he'), t50k = w('L2', '50'), t9 = w('L2', '9'), t6 = w('L2', '6'), t4 = w('L2', '4'), tFreezes = w('L2', 'freezes');
const tWin = w('L3', 'win'), tInstead = w('L3', 'instead'), tBack3 = w('L3', 'back'), tDoesnt = w('L3', 'doesnt'), tPull = w('L3', 'pull'), tTalks = w('L3', 'talks');
const tStadium = w('L4', 'stadium'), tBack4 = w('L4', 'back'), t10 = w('L4', '10'), t25 = w('L4', '25'), t40 = w('L4', '40'), tThey4 = w('L4', 'they'), tCross = w('L4', 'cross'), tLast4 = w('L4', 'last');
const tJudges = w('L5', 'judges'), tReveal = w('L5', 'reveal'), tNot = w('L5', 'not'), tTime = w('L5', 'time'), tBy = w('L5', 'by', 1), tChanged = w('L5', 'changed');
const tEQ6 = w('L6', 'eq'), t40b = w('L6', '40'), tAfternoon = w('L6', 'afternoon'), tTheos6 = w('L6', 'theos'), tEvery6 = w('L6', 'every'), tUp6 = w('L6', 'up'), tHis6 = w('L6', 'his'), tGold6 = w('L6', 'gold'), tAnd6 = w('L6', 'and'), tSmall6 = w('L6', 'small'), tNumber6 = w('L6', 'number');
const tNight = w('L7', 'night'), tMia7 = w('L7', 'mia'), t97 = w('L7', '97'), tStands7 = w('L7', 'stands'), tZero7 = w('L7', 'zero'), tComp7 = w('L7', 'compatibility'), tThey7 = w('L7', 'they'), tNothing7 = w('L7', 'nothing'), tPoint7 = w('L7', 'point');
const tYears8 = w('L8', 'years'), tHolding = w('L8', 'holding'), tComp8 = w('L8', 'compatibility'), tZero8 = w('L8', 'zero'), tMental8 = w('L8', 'mental'), t100 = w('L8', '100');
const tIf9 = w('L9', 'if'), tHide9 = w('L9', 'hide'), tWhich9 = w('L9', 'which');
const S1b = tThe1 - .08, S1c = tMental1 - .1, S2b = tHe2 - .1, S2c = t9 - .1, S3b = tInstead - .1, S3c = tDoesnt - .1, S4b = t10 - .1, S4c = tThey4 - .1, S5b = tNot - .1;
const S6b = tTheos6 - .1, S6c = tHis6 - .1, S6d = tAnd6 - .1, S7b = tComp7 - .1, S7c = tThey7 - .1, S8b = tComp8 - .1, S8c = tMental8 - .1;

// ---------------- helpers ----------------
const put = (p, v, ry = 0) => { p.P.visible = true; p.P.position.copy(v); p.P.rotation.set(0, ry, 0); p.P.updateMatrixWorld(true); };
const show = (...ps) => PROPS.forEach(o => o.visible = ps.includes(o));
const CAMP = new THREE.Vector3(0, 1.4, 6);
const headOf = p => { p.P.updateMatrixWorld(true); return p.head.getWorldPosition(V(0, 0, 0)); };
const cardOf = (p, s = 1) => headOf(p).add(V(0, .21 * p.H + .07 + .93 * s / 2, 0));
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
function onHand(p, o, left = 0, pos = [0, 0, 0], rot = [0, 0, 0]) { o.visible = true; (left ? p.aL : p.aR).props.add(o); o.position.set(...pos); o.rotation.set(...rot); }
function card(p, o = {}) { p.cs = { v: { ...p.v }, ...o }; }
function reset() {
  CAST.forEach(p => { p.P.visible = false; p.cs = null; p.card.visible = false; });
  show(); for (const o of PROPS) { scene.add(o); o.rotation.set(0, 0, 0); }
  HEART.visible = false; HEART.userData.cs = null; KAI.face.glasses = 'shades';
}
function stepper(t, base, steps) { let v = base; const pop = []; for (const [t0, nv] of steps) { if (t >= t0) { const d = nv - v; v = nv; if (t - t0 < 1) pop.push({ d, a: (t - t0) / .9 }); } } return { v, pop }; }
const camAt = (pos, look, fov = 45, focus, aper = 4, roll = 0) => ({ pos, look, fov, focus: focus ?? pos.distanceTo(look), aper, roll });
const hand = (c, t, a = 1) => { c.pos.x += noise(t, 1) * .012 * a; c.pos.y += noise(t, 2) * .01 * a; c.look.x += noise(t, 3) * .02 * a; c.look.y += noise(t, 4) * .016 * a; return c; };
const shake = (c, t, a) => { if (a > 0) { c.pos.x += Math.sin(t * 61) * .012 * a; c.pos.y += Math.sin(t * 53 + 1) * .01 * a; } return c; };

// Kai's mental health, live: 12 → 9 → 6 → 4 on the wall, then 10 → 25 → 40 as Theo talks to him
const MH = t => stepper(t, 12, [[t9, 9], [t6, 6], [t4, 4], [t10, 10], [t25, 25], [t40, 40]]);
const KEQ = t => stepper(t, 19, [[t40b, 59]]);
const kaiV = t => ({ ...KAI.v, mh: MH(t).v, eq: KEQ(t).v });
// Theo's card after the final: every stat up, one after another; then gold
const TUP = [['str', 46], ['ath', 55], ['hp', 78], ['iq', 109], ['eq', 98], ['mh', 86]];
function theoV(t) {
  const v = { ...THEO.v }, pop = [];
  TUP.forEach(([k, nv], i) => { const t0 = tEvery6 + i * (tUp6 - tEvery6) / 5; if (t >= t0) { const d = nv - v[k]; v[k] = nv; if (t - t0 < 1) pop.push({ k, d, a: (t - t0) / .9 }); } });
  if (t >= tUp6) v.ovr = 71;
  return { v, pop, gold: t >= tGold6 ? 1 : 0 };
}

// the wall: climbers face it (ry = π); WP(x, y) = feet at height y, x along the wall
const WALLX = SD.wall[0], WALLZ = SD.wall[1];
const WP = (x, y) => SP(WALLX + x, WALLZ + .3 + .34, y);
const KX = -.6, TX = .6;
// heights (feet) over time
const KY = t => t < C4 ? lerp(3.3, 3.9, seg(t, C2, S2b)) : lerp(3.9, 7.9, eio(seg(t, t40 - .3, tLast4 - .25)));
const TY = t => t < C3 ? lerp(1.5, 2.3, seg(t, C2, C3)) : t < S3b + .2 ? lerp(2.3, 4.9, eio(seg(t, C3, tWin + .05))) : t < C4 ? lerp(4.9, 3.95, eio(seg(t, tInstead + .25, tBack3 + .35))) : lerp(3.95, 7.95, eio(seg(t, t40 - .3, tLast4 - .25)));
function climbPose(ph, moving, o = {}) {
  const s = Math.sin(ph), c = Math.cos(ph), m = moving ? 1 : 0;
  return { sp: [10, 0, 0], hd: [-18, 0, 0], aL: [-150 - 18 * s * m, 26, 0, 40 + 25 * c * m], aR: [-150 + 18 * s * m, 26, 0, 40 - 25 * c * m], lL: [38 + 22 * s * m, 14, 62 + 30 * Math.max(0, s) * m], lR: [38 - 22 * s * m, 14, 62 + 30 * Math.max(0, -s) * m], ...o };
}
function climbers(t, kFace, tFace, opt = {}) {
  const ky = KY(t), ty = TY(t), kMov = Math.abs(KY(t + .05) - ky) > .004, tMov = Math.abs(TY(t + .05) - ty) > .004;
  const kp = WP(KX, ky); if (opt.tremble) { kp.x += Math.sin(t * 47) * .012 * opt.tremble; kp.y += Math.sin(t * 39) * .008 * opt.tremble; }
  put(KAI, kp, opt.kRy ?? Math.PI); put(THEO, WP(TX, ty), Math.PI);
  apply(KAI, climbPose(t * 7, kMov), { t, seed: 6, face: kFace, look: opt.kLook ?? CAMP, eyes: opt.kEyes });
  apply(THEO, climbPose(t * 7 + 1.3, tMov), { t, seed: 1, face: tFace, look: opt.tLook ?? CAMP, talk: opt.talk ?? 0 });
}
// the finished pairs sit on top of the wall, legs over the edge
function finishers(t, mood = 'cheer') {
  RUN.forEach((p, i) => { const x = [-2.6, -1.9, 1.9, 2.6][i]; put(p, SP(WALLX + x, WALLZ + .05, 8.55), 0);
    const q = mood === 'cheer' ? { ...TP.sit, y: -.06, aL: [-15, 140, 0, 20], aR: [-15, 140, 0, 20] } : { ...TP.sit, y: -.06, sp: [14, 0, 0], hd: [20, 0, 0] };
    apply(p, mood === 'cheer' ? mix(q, { ...q, aL: [-30, 120, 0, 50], aR: [-30, 120, 0, 50] }, .5 + .5 * Math.sin(t * 9 + i)) : q, { t, seed: 40 + i, face: mood === 'cheer' ? 'laugh' : 'worried', look: mood === 'cheer' ? CAMP : WP(KX, KY(t) + 1.5) }); card(p, { s: .8 }); });
}

// ---------------- shots (camera + who's where), all from the voice ----------------
const TVC = () => STAD.userData.tvcam.getWorldPosition(V());
const STG = SP(SD.stage[0], SD.stage[1], 1.2), JT = () => STAD.userData.judges.getWorldPosition(V());
const SCR = SP(-44, 0, 12);
const BEN = V(ST.bench, SW, -6.4), THB = BEN.clone().add(V(.36, 0, 0)), MIB = BEN.clone().add(V(-.36, 0, 0));
const KN = P3(3.0, -5.05), TN = P3(5.75, -5.65), MN = P3(5.0, -5.5);   // that night, on the sidewalk by the bench
const MW = t => P3(lerp(-1.2, MN.x, seg(t, C7 + .1, tStands7 + .15)), lerp(-5.45, MN.z, seg(t, C7 + .1, tStands7 + .15)));

const SHOTS = [
  // 1a · Live on TV,: the TV camera's red light
  { t0: 0, t1: S1b, set: 'stadium', lt: STADIUM, at: SP(-28, 6), act: t => act1(t),
    cam: (t, u) => { const c = TVC(); return hand(camAt(c.clone().add(V(lerp(-1.75, -1.55, u), lerp(1.95, 1.9, u), lerp(-.75, -.6, u))), c.clone().add(V(-.15, 1.68, -.05)), 40, 1.8, 4), t, .5); } },
  // 1b · the highest-rated guy in the city just lost the filter on his hidden number.: behind Theo and Kai, the giant screen
  { t0: S1b, t1: S1c, set: 'stadium', lt: STADIUM, at: SP(0, 0), act: t => act1(t),
    cam: (t, u) => hand(camAt(SP(lerp(3.9, 3.2, eo(u)), lerp(-.02, -.12, u), 2.0), SP(-44, -.6, 8.6), 40, 40, .5), t, .5) },
  // 1c · Mental health: 12. It's been 12 for years.: his card, then his face
  { t0: S1c, t1: C2, set: 'stadium', lt: STADIUM, at: SP(0, 0), act: t => act1(t),
    after: 1, cam: (t, u) => { const h = headOf(KAI), c0 = cardOf(KAI), k = eio(seg(t, tIts - .2, tYears - .2));
      return hand(camAt(h.clone().add(V(lerp(-1.75, -1.3, k), lerp(.78, .08, k), lerp(.06, .1, k))), c0.clone().add(V(0, -.22, 0)).lerp(h.clone().add(V(0, .05, 0)), k), lerp(32, 34, k), lerp(1.75, 1.3, k), 6), t, .5); } },
  // 2a · Halfway up the final wall,: the wall from the infield
  { t0: C2, t1: S2b, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => act2(t),
    cam: (t, u) => hand(camAt(SP(WALLX + lerp(2.6, 2.1, u), WALLZ + lerp(10.8, 10.2, u), lerp(1.8, 2.1, u)), SP(WALLX + .2, WALLZ + .3, lerp(5.3, 5.5, u)), 50, 10.5, 1), t) },
  // 2b · he looks down at 50,000 people reading it.: over his shoulder, down at the stadium
  { t0: S2b, t1: S2c, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => act2(t),
    after: 1, cam: (t, u) => { const h = headOf(KAI); return hand(camAt(h.clone().add(V(lerp(.75, .6, u), lerp(.75, .85, u), lerp(.85, 1.0, u))), SP(lerp(10, 9, u), 15, lerp(1.5, 1.0, u)), 52, 14, 2), t, .8); } },
  // 2c · 9. 6. 4. He freezes.: close on him, clinging; his number falls
  { t0: S2c, t1: C3, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => act2(t),
    after: 1, cam: (t, u) => { const h = headOf(KAI); return shake(hand(camAt(h.clone().add(V(lerp(-1.35, -1.25, u), .14, lerp(.05, .02, u))), h.clone().add(V(-.04, .36, 0)), 44, 1.4, 5), t, .6), t, t > tFreezes ? 1 : 0); } },
  // 3a · Theo could climb past him and win.: from the side, the top of the wall above them
  { t0: C3, t1: S3b, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => act3(t),
    cam: (t, u) => hand(camAt(SP(WALLX + lerp(4.6, 4.3, u), WALLZ + 3.6, lerp(5.0, 5.4, u)), SP(WALLX + .2, WALLZ + .4, lerp(6.0, 6.4, u)), 50, 6, 2), t) },
  // 3b · Instead, he climbs back down.: from the top, looking down at them
  { t0: S3b, t1: S3c, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => act3(t),
    cam: (t, u) => hand(camAt(SP(WALLX + lerp(1.2, 1.0, u), WALLZ + 2.0, 8.9), SP(WALLX + .1, WALLZ + .5, lerp(5.1, 4.8, u)), 46, 4.4, 4), t) },
  // 3c · He doesn't pull him. He talks to him.: side by side on the wall
  { t0: S3c, t1: C4, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => act3(t),
    after: 1, cam: (t, u) => { const k = headOf(KAI), th = headOf(THEO), m = k.clone().lerp(th, .5); return hand(camAt(k.clone().add(V(lerp(-1.25, -1.1, u), .25, lerp(1.35, 1.25, u))), m.clone().add(V(.15, .12, 0)), 42, 1.9, 5), t, .6); } },
  // 4a · And the whole stadium watches the number come back.: the front row, the giant screen
  { t0: C4, t1: S4b, set: 'stadium', lt: STADIUM, at: SP(-16, 6), act: t => act4(t),
    cam: (t, u) => hand(camAt(SP(lerp(-14, -14.6, u), 6.4, lerp(1.45, 1.55, u)), SP(-44, 0, 10), 50, 3, 1.0), t, 1.0) },
  // 4b · 10. 25. 40.: Kai's card on the wall, Theo beside him
  { t0: S4b, t1: S4c, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => act4(t),
    after: 1, cam: (t, u) => { const h = headOf(KAI); return hand(camAt(h.clone().add(V(lerp(-1.35, -1.25, u), .14, lerp(.05, .02, u))), h.clone().add(V(-.04, .36, 0)), 44, 1.4, 5), t, .6); } },
  // 4c · They cross the line dead last.: the top of the wall, everyone else already up
  { t0: S4c, t1: C5, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => act4(t),
    cam: (t, u) => hand(camAt(SP(WALLX + lerp(1.0, .8, u), WALLZ + lerp(5.2, 4.9, u), lerp(10.6, 10.8, u)), SP(WALLX, WALLZ + .3, lerp(8.6, 8.9, u)), 50, 5.2, 2), t) },
  // 5a · Then the judges reveal how the final was scored.: the judges' table on the stage
  { t0: C5, t1: S5b, set: 'stadium', lt: STADIUM, at: STG, act: t => act5(t),
    cam: (t, u) => { const j = JT(); return hand(camAt(j.clone().add(V(lerp(4.6, 4.1, eo(u)), lerp(1.15, 1.25, u), lerp(-1.4, -1.2, u))), j.clone().add(V(-.7, 1.05, 0)), 44, 4.4, 3), t); } },
  // 5b · Not by time. By how much your ratings changed.: the giant screen
  { t0: S5b, t1: C6, set: 'stadium', lt: STADIUM, at: STG, act: t => act5(t),
    cam: (t, u) => hand(camAt(SP(-16 + u * 1.5, 0, 5.5), SP(-44, 0, 13), 46, 28, .5), t, .5) },
  // 6a · Kai's EQ jumped 40 points in one afternoon.: his card, then the shades come off
  { t0: C6, t1: S6b, set: 'stadium', lt: STADIUM, at: STG, act: t => act6(t),
    after: 1, cam: (t, u) => { const h = headOf(KAI), c0 = cardOf(KAI), k = eio(seg(t, tAfternoon - .45, tAfternoon + .25));
      return hand(camAt(h.clone().add(V(lerp(1.75, 1.3, k), lerp(.78, .1, k), lerp(-.05, -.1, k))), c0.clone().add(V(0, -.2, 0)).lerp(h.clone().add(V(0, .06, 0)), k), lerp(32, 34, k), lerp(1.75, 1.3, k), 6), t, .5); } },
  // 6b · Theo's? Every single stat went up.: his card, every row climbing
  { t0: S6b, t1: S6c, set: 'stadium', lt: STADIUM, at: STG, act: t => act6(t),
    after: 1, cam: (t, u) => { const c0 = cardOf(THEO); return hand(camAt(c0.clone().add(V(lerp(1.7, 1.55, u), -.12, .04)), c0.clone().add(V(0, -.05, 0)), 34, 1.6, 6), t, .5); } },
  // 6c · His card turns gold.: pull back to his face as it turns
  { t0: S6c, t1: S6d, set: 'stadium', lt: STADIUM, at: STG, act: t => act6(t),
    after: 1, cam: (t, u) => { const h = headOf(THEO), c0 = cardOf(THEO, .8), k = eio(u); return hand(camAt(h.clone().add(V(lerp(1.8, 2.3, k), lerp(.7, .5, k), lerp(.05, .3, k))), c0.clone().add(V(0, -.2, 0)).lerp(h.clone().add(V(0, .45, 0)), k), 36, 2.0, 5), t, .5); } },
  // 6d · And for the first time, people read the small grey number.: the front row, the screen: POTENTIAL 99
  { t0: S6d, t1: C7, set: 'stadium', lt: STADIUM, at: SP(-16, 6), act: t => act6(t),
    cam: (t, u) => hand(camAt(SP(lerp(-14, -14.8, u), 6.4, lerp(1.45, 1.6, u)), SP(-44, 0, 10.5), 50, 3, 1.0), t, 1.0) },
  // 7a · That night, Mia walks right past the 97 and stands next to the zero.
  { t0: C7, t1: S7b, set: 'city', lt: NIGHT, at: P3(4, -5.4), act: t => act7(t),
    cam: (t, u) => { const mx = Math.min(MW(t).x + .45, 5.38), lx = lerp(mx, 5.38, seg(t, tStands7 - .3, tZero7)); return hand(camAt(P3(lx - .15, -1.3).add(V(0, 1.7, 0)), P3(lx, -5.4).add(V(0, 1.55, 0)), 46, 4.2, 3), t); } },
  // 7b · Compatibility only measures how alike two people are.
  { t0: S7b, t1: S7c, set: 'city', lt: NIGHT, at: P3(5.4, -5.6), act: t => act7(t),
    cam: (t, u) => hand(camAt(P3(lerp(5.25, 5.45, u), lerp(-1.9, -2.1, u)).add(V(0, 1.6, 0)), P3(5.38, -5.58).add(V(0, 1.78, 0)), 40, 3.6, 4), t) },
  // 7c · They were nothing alike. That was the point.
  { t0: S7c, t1: C8, set: 'city', lt: NIGHT, at: P3(5.4, -5.6), act: t => act7(t),
    cam: (t, u) => hand(camAt(P3(lerp(5.0, 5.15, u), lerp(-2.55, -2.75, u)).add(V(0, 1.35, 0)), P3(5.38, -5.58).add(V(0, 1.82, 0)), 42, 3.0, 5), t) },
  // 8a · 50 years later, they're still holding hands.: the same bench
  { t0: C8, t1: S8b, set: 'city', lt: GOLDEN, at: BEN, act: t => act8(t),
    cam: (t, u) => hand(camAt(BEN.clone().add(V(lerp(.4, .2, u), 1.2, lerp(3.4, 2.9, eo(u)))), BEN.clone().add(V(0, 1.05, 0)), 44, 3.1, 4), t) },
  // 8b · Compatibility: still zero.
  { t0: S8b, t1: S8c, set: 'city', lt: GOLDEN, at: BEN, act: t => act8(t),
    cam: (t, u) => hand(camAt(BEN.clone().add(V(0, 1.45, lerp(2.5, 2.3, u))), BEN.clone().add(V(0, 1.6, 0)), 40, 2.4, 5), t) },
  // 8c · Mental health: both 100.: their two cards
  { t0: S8c, t1: C9, set: 'city', lt: GOLDEN, at: BEN, act: t => act8(t),
    cam: (t, u) => hand(camAt(BEN.clone().add(V(0, 1.9, lerp(3.5, 3.3, u))), BEN.clone().add(V(0, 1.95, 0)), 46, 3.4, 4), t) },
  // 9 · If you could hide one rating, which one would it be?: up and away from the bench
  { t0: C9, t1: LOOP, set: 'city', lt: GOLDEN, at: BEN, act: t => act8(t),
    cam: (t, u) => { const k = eio(u); return camAt(BEN.clone().add(V(lerp(.2, 1.6, k), lerp(1.6, 5.2, k), lerp(3.4, 9.5, k))), BEN.clone().add(V(0, lerp(1.4, .9, k), 0)), 44, 6, 2); } },
];
SHOTS.push({ ...SHOTS[0], t0: LOOP, t1: DUR + 1, loop: 1 });

// ---------------- acting ----------------
function act1(t) {
  reset(); STAD.userData.cheer(t, .15);
  const red = STAD.userData.tally; red.scale.setScalar(2.4); red.material.color.set(t < S1b || Math.sin(t * 6) > 0 ? '#FF2A2A' : '#5A1010');
  const tp = SP(.65, 0), kp = SP(-.45, -.2);
  put(THEO, tp, -Math.PI / 2 - .4); put(KAI, kp, t >= S1c ? -Math.PI / 2 : -Math.PI / 2 + .3);
  apply(THEO, TP.stand, { t, seed: 1, face: 'worried', look: t < S1c ? SCR : headOf(KAI) });
  apply(KAI, TP.stand, { t, seed: 6, face: t > tIts ? 'worried' : 'shock', look: t < S1c ? SCR : t > tIts ? SP(-3, -.3, .6) : CAMP, eyes: t > tIts ? [0, -.5] : undefined });
  const close = t >= S1c;
  card(THEO, { s: close ? .45 : .7, mini: !close });
  card(KAI, { v: kaiV(t), hl: 'mh', flash: Math.sin(t * 12) > 0 ? 1 : 0, s: close ? 1 : .7 });
}
function act2(t) {
  reset(); STAD.userData.cheer(t, .1);
  const fr = t > tFreezes - .05;
  const kc = WP(KX, KY(t)).add(V(-1.3, 2.2, .05));
  climbers(t, fr ? 'shock' : t > S2b ? 'worried' : 'deadpan', 'worried', { tremble: fr ? 1 : 0, kLook: t < S2b ? WP(KX, 9) : t < S2c ? SP(8, 16, 1) : kc, kEyes: t >= S2c ? [.2, -.5] : undefined, kRy: t >= S2c ? Math.PI + .55 : undefined, tLook: headOf(KAI) });
  finishers(t, 'still');
  const m = MH(t);
  if (t < S2b) card(KAI, { v: kaiV(t), s: .8, mini: 1 });
  else if (t < S2c) card(KAI, { show: 0 });
  else card(KAI, { v: kaiV(t), hl: 'mh', flash: Math.sin(t * 12) > 0 ? 1 : 0, pop: m.pop.map(x => ({ k: 'mh', ...x })), s: .7 });
  card(THEO, { s: .8, mini: 1 });
}
function act3(t) {
  reset(); STAD.userData.cheer(t, .1);
  const talk = t > tTalks - .1 ? clamp(.5 + .5 * Math.sin(t * 19)) : 0;
  climbers(t, t > tTalks ? 'calm' : 'worried', t < tInstead ? 'proud' : t < S3c ? 'worried' : 'happy', { tremble: t < tInstead ? .6 : 0, kLook: t > tTalks ? headOf(THEO) : SP(8, 16, 1), kEyes: t > tTalks ? undefined : [0, -.5],
    tLook: t < tWin ? WP(TX, 10) : headOf(KAI), talk });
  finishers(t, 'still');
  card(KAI, { v: kaiV(t), s: .8, mini: 1 }); card(THEO, { s: t >= S3c ? .45 : .8, mini: 1 });
}
function act4(t) {
  reset(); STAD.userData.cheer(t, t > tCross ? 1 : t > t40 ? .5 : .05);
  if (t < S4b) {   // the front row (Mia among them), watching the screen
    [FAN[0], MIA, FAN[2]].forEach((p, i) => { const v = SP(-16.4 - i * .55, 5.55 + (i - 1) * .75); put(p, v, face(v, SP(-44, 0, 0)) + (i - 1) * .35);
      apply(p, i === 1 ? { ...TP.stand, aL: [-60, -10, 0, 120], aR: [-60, -10, 0, 120] } : TP.stand, { t, seed: 50 + i, face: 'worried', look: SP(-44, 0, 12) }); card(p, { mini: 1 }); });
    return;
  }
  const up = t > t25;
  climbers(t, t > t40 ? 'smile' : t > t10 ? 'calm' : 'worried', t > t40 ? 'happy' : 'smile', { kRy: t < S4c ? Math.PI + .55 : undefined, kLook: t < S4c ? WP(KX, KY(t)).add(V(-1.3, 2.2, .05)) : WP(KX, 10), tLook: t < S4c ? headOf(KAI) : WP(TX, 10), talk: t < t25 ? clamp(.5 + .5 * Math.sin(t * 19)) : 0 });
  finishers(t, t > tCross - .2 ? 'cheer' : 'still');
  const m = MH(t);
  card(KAI, { v: kaiV(t), hl: 'mh', pop: m.pop.map(x => ({ k: 'mh', ...x })), s: t >= S4c ? .8 : .7, mini: t >= S4c });
  card(THEO, { s: .8, mini: 1 }); void up;
}
function act5(t) {
  reset(); STAD.userData.cheer(t, .3);
  const j = JT();
  JUD.forEach((p, i) => { put(p, j.clone().add(V(-.85, .04, i - 1)), Math.PI / 2); const lift = i === 1 && t > tReveal - .3;
    apply(p, lift ? { ...TP.sit, y: -.06, aR: [-150, 10, 0, 30] } : { ...TP.sit, y: -.06, aL: [-62, 8, 0, 70], aR: [-62, 8, 0, 70] }, { t, seed: 60 + i, face: lift ? 'smile' : 'deadpan', look: CAMP });
    if (lift) onHand(p, ENV, 0, [0, -.12, .06], [0, Math.PI / 2, 0]); card(p, { s: .9 }); });
  const p = STAD.userData.podium.getWorldPosition(V()); put(HOST, p.clone().add(V(-.15, 0, .55)), Math.PI / 2 + .3);
  apply(HOST, TP.speech, { t, seed: 30, face: 'happy', look: CAMP }); card(HOST);
}
function act6(t) {
  reset(); STAD.userData.cheer(t, 1);
  if (t >= S6d) {   // the front row reads the small grey number
    [FAN[0], MIA, FAN[2]].forEach((p, i) => { const v = SP(-16.4 - i * .55, 5.55 + (i - 1) * .75); put(p, v, face(v, SP(-44, 0, 0)) + (i - 1) * .35);
      apply(p, i === 0 ? TP.point : i === 1 ? TP.cheer : TP.cheer, { t, seed: 50 + i, face: i === 1 ? 'laugh' : 'shock', look: SP(-44, 0, 12) }); card(p, { mini: 1 }); });
    return;
  }
  // on the stage: Kai and Theo side by side, facing the infield
  const kp = STG.clone().add(V(1.7, 0, -1.0)), tp = STG.clone().add(V(1.7, 0, .9));
  put(KAI, kp, Math.PI / 2); put(THEO, tp, Math.PI / 2);
  const off = t > tAfternoon - .05; KAI.face.glasses = off ? null : 'shades';
  apply(KAI, off ? TP.stand : TP.cross, { t, seed: 6, face: t > tAfternoon ? 'smile' : 'calm', look: CAMP });
  const k = KEQ(t); card(KAI, { v: kaiV(t), hl: t < S6b ? 'eq' : null, pop: k.pop.map(x => ({ k: 'eq', ...x })), s: t < S6b ? 1 : .5, mini: t >= S6b });
  const th = theoV(t);
  apply(THEO, t > tGold6 ? TP.cheer : TP.stand, { t, seed: 1, face: t > tGold6 + .2 ? 'laugh' : t > tGold6 - .1 ? 'shock' : 'happy', look: CAMP });
  card(THEO, { v: th.v, pop: th.pop, gold: th.gold, s: t < S6c ? 1 : .8, show: 1 });
}
function act7(t) {
  reset();
  // that night: Kai by the café, Theo by the bench; Mia walks past the 97 and stands next to the zero
  KAI.face.glasses = null;
  const mp = MW(t), arrived = t > tStands7;
  put(KAI, KN, face(KN, mp)); apply(KAI, TP.stand, { t, seed: 6, face: t > t97 + .5 ? 'smile' : 'calm', look: headOf(MIA) });
  put(THEO, TN, face(TN, mp) + (arrived ? .9 : 0)); apply(THEO, t > tPoint7 - .1 ? { ...TP.stand, aR: [-35, 10, 0, 20] } : TP.stand, { t, seed: 1, face: t > tNothing7 ? 'laugh' : arrived ? 'happy' : 'worried', look: headOf(MIA) });
  const walking = !arrived; put(MIA, mp, walking ? face(mp, TN) : face(mp, TN) - .9);
  apply(MIA, walking ? walk(TP.stand, t * 7.5, .9) : t > tPoint7 - .1 ? { ...TP.stand, aL: [-35, 10, 0, 20] } : TP.stand, { t, seed: 4, face: t > tNothing7 ? 'laugh' : arrived ? 'smile' : 'calm', look: arrived ? headOf(THEO) : t > t97 - .6 && t < t97 + .2 ? headOf(KAI) : headOf(THEO) });
  // 97%: flashes up between Mia and Kai as she passes, and goes
  const hs = seg(t, t97 - .45, t97 - .25) * (1 - seg(t, t97 + .35, t97 + .6));
  if (hs > 0 && t < tStands7) { HEART.visible = true; HEART.userData.cs = { st: { pct: 97, fill: seg(t, t97 - .3, t97 + .05), glow: .6, show: hs }, at: headOf(KAI).lerp(headOf(MIA), .5).add(V(0, .55, .1)), s: .9 }; }
  if (t > tZero7 - .2) { const glow = seg(t, tThey7, tPoint7); HEART.visible = true; HEART.userData.cs = { st: { pct: 0, fill: 1, glow, show: seg(t, tZero7 - .2, tZero7 + .05) }, at: headOf(THEO).lerp(headOf(MIA), .5).add(V(0, .5, .05)), s: t >= S7b ? .5 : .75 }; }
  const tv = theoV(99); const mhp = t > tNothing7 && t < tNothing7 + 1 ? [{ k: 'mh', d: 1, a: (t - tNothing7) / .9 }] : [];
  card(THEO, { v: { ...tv.v, mh: t > tNothing7 ? 87 : 86 }, gold: 1, pop: mhp, s: t < S7b ? .7 : .42, mini: t < S7b });
  card(MIA, { s: t < S7b ? .7 : .42, mini: t < S7b });
  card(KAI, { v: kaiV(99), s: .7, mini: 1 });
}
function act8(t) {
  reset();
  put(OLDT, THB, -.3); put(OLDM, MIB, .3); show(CANE); CANE.position.copy(THB).add(V(.62, 0, .18)); CANE.rotation.set(0, 0, .22);
  const lean = { sp: [-2, 0, 0] };
  apply(OLDT, { ...TP.sit, ...lean, y: -.06, aR: [-28, 38, 0, 16], aL: [-30, 20, 0, 60] }, { t, seed: 1, face: t > tZero8 ? 'laugh' : 'smile', look: headOf(OLDM) });
  apply(OLDM, { ...TP.sit, ...lean, y: -.06, aL: [-28, 38, 0, 16], aR: [-30, 20, 0, 60] }, { t, seed: 4, face: t > tZero8 - .2 ? 'laugh' : 'smile', look: headOf(OLDT) });
  const full = t >= S8c && t < C9 + .5;
  card(OLDT, { gold: 1, hl: full ? 'mh' : null, s: full ? .55 : .5, mini: !full });
  card(OLDM, { hl: full ? 'mh' : null, s: full ? .55 : .5, mini: !full });
  if (t >= S8b && t < S8c) { HEART.visible = true; HEART.userData.cs = { st: { pct: 0, fill: 1, glow: 1, show: seg(t, S8b, S8b + .25) }, at: headOf(OLDT).lerp(headOf(OLDM), .5).add(V(0, .42, .1)), s: .55 }; }
}

// ---------------- the giant screen ----------------
function screenState(t) {
  if (t < C2) return { mode: 'exposed', f: Math.sin(t * 12) > 0 ? 1 : 0 };
  if (t < C5) return { mode: 'mh', v: MH(t).v };
  if (t < C6) return { mode: 'scoring', a: t > tNot - .1, b: t > tBy - .1 };
  if (t < S6b) return { mode: 'kaieq', v: KEQ(t).v };
  return { mode: 'potential' };
}
function drawScreen(st) {
  const S = STAD.userData.screen, key = JSON.stringify(st); if (key === S.key) return; S.key = key; const g = S.ctx, w = 1280, h = 720;
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#1E2238'); bg.addColorStop(1, '#0E1018'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const T = (txt, y, size, col = '#FFFFFF', x = w / 2) => { g.font = `900 ${size}px Montserrat`; g.fillStyle = col; g.fillText(txt, x, y); };
  const pill = (x, y, n, r = 80, col) => { g.fillStyle = col ?? tier(n); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = '#16131A'; g.font = `900 ${r}px Montserrat`; g.fillText(String(n), x, y + 6); };
  const live = () => { g.fillStyle = '#E8423A'; g.beginPath(); g.arc(548, 66, 22, 0, 7); g.fill(); T('LIVE', 70, 58, '#E8423A', 664); };
  const mhCol = v => v >= 65 ? '#C8E04A' : v >= 45 ? '#FF9A2A' : '#E8423A';
  if (st.mode === 'exposed') { live(); pill(640, 225, 94, 100); T('KAI', 395, 100, '#FFC83A'); g.fillStyle = st.f ? '#E8423A' : '#8A1E1E'; g.beginPath(); g.roundRect(330, 480, 620, 150, 30); g.fill(); T('MENTAL HEALTH', 525, 46, '#FFFFFF'); T('12', 590, 70, '#FFFFFF'); }
  else if (st.mode === 'mh') { live(); T('KAI · MENTAL HEALTH', 170, 56, '#C8CCE0'); T(String(st.v), 400, 300, mhCol(st.v)); }
  else if (st.mode === 'scoring') { T('THE FINAL WAS SCORED', 80, 50, '#FFC83A');
    if (st.a) { T('NOT BY TIME', 175, 70, '#C8CCE0'); g.strokeStyle = '#E8423A'; g.lineWidth = 14; g.beginPath(); g.moveTo(420, 175); g.lineTo(860, 175); g.stroke(); }
    if (st.b) { g.fillStyle = '#3EB24A'; g.beginPath(); g.roundRect(340, 245, 600, 250, 36); g.fill(); T('BY HOW MUCH', 310, 58, '#FFFFFF'); T('YOUR RATINGS', 375, 58, '#FFFFFF'); T('CHANGED', 440, 58, '#FFFFFF'); } }
  else if (st.mode === 'kaieq') { T('KAI · EQ', 150, 70, '#C8CCE0'); T(String(st.v), 380, 260, st.v > 40 ? '#4ADB6A' : '#E8423A'); if (st.v > 40) T('+40', 600, 90, '#4ADB6A'); }
  else if (st.mode === 'potential') { pill(640, 150, 71, 95, '#FFC83A'); T('THEO', 320, 92, '#FFFFFF'); T('POTENTIAL', 425, 64, '#C8CCE0'); T('99', 585, 230, '#FFC83A'); }
  S.tex.needsUpdate = true;
}

// ---------------- sound events (the score reads these) ----------------
ev(0, 'stadium', { d: C7 + 1 }); ev(.02, 'alarm'); ev(t12a, 'hit2');
ev(C2 - .05, 'whoosh'); [t9, t6, t4].forEach(x => ev(x, 'down')); ev(tFreezes, 'heart', { d: 2.6 });
ev(tWin, 'sparkle'); ev(tInstead, 'whoosh');
[t10, t25, t40].forEach((x, i) => ev(x, 'up', { n: i })); ev(tCross, 'cheer'); ev(tLast4, 'shrug');
ev(C5, 'hit'); ev(tReveal, 'pop'); ev(tNot, 'error'); ev(tBy, 'ok');
ev(t40b, 'up', { n: 3 }); ev(tAfternoon, 'shine');
TUP.forEach((_, i) => ev(tEvery6 + i * (tUp6 - tEvery6) / 5, 'tick', { n: i })); ev(tGold6, 'sparkle'); ev(tGold6 + .05, 'cheer'); ev(tSmall6, 'hit');
ev(C7 - .05, 'whoosh'); ev(C7, 'night', { d: C8 - C7 + .3 }); ev(C7 + .1, 'steps1', { d: tStands7 - C7 }); ev(t97, 'sparkle'); ev(tZero7, 'pop'); ev(tNothing7, 'laugh');
ev(C8 - .05, 'whoosh'); ev(C8, 'birds', { d: DUR - C8 }); ev(t100, 'sparkle'); ev(LOOP - 1.2, 'sting');

// ---------------- the overlay: telops + 1–3 word captions ----------------
const ov = document.getElementById('ov').getContext('2d');
const TEL = [
  { t0: .02, t1: S1b, text: '● LIVE', y: 300, size: 120, col: '#FFFFFF', rot: -4, plate: '#C8283A' },
  { t0: t12a - .05, t1: C2, text: 'MENTAL HEALTH: 12', y: 300, size: 96, col: '#FFFFFF', rot: -4, plate: '#C8283A' },
  { t0: t50k - .05, t1: S2c, text: '50,000 WATCHING', y: 300, size: 100, col: '#FFFFFF', rot: -4, plate: '#16131A' },
  { t0: tLast4 - .05, t1: C5, text: 'DEAD LAST', y: 300, size: 140, col: '#E8423A', rot: -6, stamp: 1 },
  { t0: t40b - .05, t1: S6b, text: 'EQ +40', y: 300, size: 150, col: '#4ADB6A', rot: -5, plate: '#16131A' },
  { t0: tSmall6 - .05, t1: C7, text: 'POTENTIAL: 99', y: 300, size: 120, col: '#FFC83A', rot: -5, plate: '#16131A' },
  { t0: tComp7 - .05, t1: S7c, text: 'COMPATIBILITY = HOW ALIKE', y: 300, size: 70, col: '#FFFFFF', rot: -3, plate: '#C84A7A' },
  { t0: C8 + .05, t1: S8b, text: '50 YEARS LATER', y: 300, size: 110, col: '#FFFFFF', rot: -3, plate: '#16131A' },
  { t0: t100 - .05, t1: C9, text: 'BOTH: 100', y: 300, size: 130, col: '#4ADB6A', rot: -5, plate: '#16131A' },
];
function drawTelop(x, t) {
  const p = seg(t, x.t0, x.t0 + .25), sc = x.stamp ? lerp(2.2, 1, eo(p)) : back(p, 2.6), wob = 1 + .02 * Math.sin((t - x.t0) * 8);
  const text = typeof x.text === 'function' ? x.text(t) : x.text;
  ov.save(); ov.translate(x.x ?? 540, x.y); ov.rotate(x.rot * Math.PI / 180); ov.scale(sc * wob, sc * wob); if (x.stamp) ov.globalAlpha = clamp(p * 3);
  ov.font = `900 ${x.size}px Montserrat`; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  const tw = Math.min(1000, ov.measureText(text).width + 70), th = x.size * 1.4;
  if (x.plate) { ov.fillStyle = 'rgba(0,0,0,.85)'; ov.beginPath(); ov.roundRect(-tw / 2 + 10, -th / 2 + 12, tw, th, 28); ov.fill(); ov.fillStyle = x.plate; ov.beginPath(); ov.roundRect(-tw / 2, -th / 2, tw, th, 28); ov.fill(); }
  ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 20; ov.shadowOffsetY = 8; ov.lineWidth = x.size * .2; ov.strokeStyle = '#000'; ov.strokeText(text, 0, 4, 960); ov.shadowColor = 'transparent'; ov.fillStyle = x.col; ov.fillText(text, 0, 4, 960);
  ov.restore();
}
// the end card: which one would you hide? (a stat list, a highlight scanning down it)
const ROWS = ['STRENGTH', 'ATHLETICISM', 'HEALTH', 'IQ', 'EQ', 'MENTAL HEALTH', 'POTENTIAL'];
function drawEnd(t) {
  const a = back(seg(t, tIf9 - .05, tIf9 + .3), 2.0); if (a <= 0) return;
  ov.save(); ov.translate(540, 820); ov.scale(a, a); ov.globalAlpha = clamp(a * 1.5);
  ov.fillStyle = 'rgba(0,0,0,.4)'; ov.beginPath(); ov.roundRect(-392, -428, 800, 870, 50); ov.fill();
  const grd = ov.createLinearGradient(0, -440, 0, 440); grd.addColorStop(0, '#1E2238'); grd.addColorStop(1, '#12141F'); ov.fillStyle = grd; ov.beginPath(); ov.roundRect(-400, -440, 800, 870, 50); ov.fill();
  ov.lineWidth = 10; ov.strokeStyle = '#FFC83A'; ov.beginPath(); ov.roundRect(-395, -435, 790, 860, 46); ov.stroke();
  ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.font = '900 64px Montserrat'; ov.fillStyle = '#FFC83A'; ov.fillText('HIDE ONE:', 0, -360);
  const sel = Math.floor(Math.max(0, t - tWhich9 + .2) * 6) % ROWS.length, scanning = t > tWhich9 - .2;
  ROWS.forEach((r, i) => { const y = -250 + i * 100, on = scanning && i === sel;
    if (on) { ov.fillStyle = 'rgba(255,200,58,.22)'; ov.beginPath(); ov.roundRect(-360, y - 42, 720, 84, 20); ov.fill(); }
    ov.textAlign = 'left'; ov.font = '800 46px Montserrat'; ov.fillStyle = on ? '#FFFFFF' : '#C8CCE0'; ov.fillText(r, -320, y + 2);
    ov.lineWidth = 6; ov.strokeStyle = on ? '#FFC83A' : '#5A5E78'; ov.beginPath(); ov.roundRect(250, y - 26, 52, 52, 12); ov.stroke();
    if (on) { ov.strokeStyle = '#FFC83A'; ov.lineWidth = 9; ov.lineCap = 'round'; ov.beginPath(); ov.moveTo(262, y); ov.lineTo(274, y + 13); ov.lineTo(292, y - 14); ov.stroke(); } });
  ov.restore();
}
const chunks = [];
TMJ.lines.forEach((l, li) => { let cur = []; const flush = () => { if (cur.length) chunks.push({ li, words: cur }); cur = []; };
  l.words.forEach(x => { const len = cur.reduce((a, y) => a + y.w.length + 1, 0) + x.w.length; if (cur.length && (len > 14 || cur.length >= 3)) flush(); cur.push(x); if (/[,.…!?:"]$/.test(x.w)) flush(); }); flush(); });
chunks.forEach((c, i) => { const n = chunks[i + 1]; c.text = c.words.map(x => x.w).join(' ').replace(/"/g, ''); c.a = c.words[0].t0 - .04; c.b = n ? Math.min(n.words[0].t0 - .04, c.words[c.words.length - 1].t1 + .6) : c.words[c.words.length - 1].t1 + .6; });
const CAPY = 1260;
function drawCaption(t, y = CAPY) {
  const c = chunks.find(c => t >= c.a && t < c.b); if (!c) return;
  const pop = back(seg(t, c.a, c.a + .12), 2.2), s = lerp(.6, 1, pop);
  ov.save(); ov.translate(W / 2, y); ov.scale(s, s); ov.font = '900 104px Montserrat'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 22; ov.shadowOffsetY = 8; ov.lineWidth = 26; ov.strokeStyle = '#000'; ov.strokeText(c.text, 0, 0, 1000);
  ov.shadowColor = 'transparent'; ov.fillStyle = '#FFFFFF'; ov.fillText(c.text, 0, 0, 1000); ov.restore();
}

// ---------------- render ----------------
const _q = new THREE.Quaternion();
const SPARE = [miniCard(), miniCard(), miniCard(), miniCard()]; SPARE.forEach(m => { m.visible = false; scene.add(m); });
function placeCards() {
  _q.copy(camera.quaternion); let si = 0;
  for (const p of CAST) {
    if (!p.P.visible || !p.cs || p.cs.show === 0) continue;
    const pill = p.kind === 'mini' || p.cs.mini, mesh = p.kind === 'full' && p.cs.mini ? SPARE[si++] : p.card; if (!mesh) continue;
    mesh.userData.draw(pill ? { v: p.cs.v } : { v: p.cs.v, show: p.cs.show, hide: p.cs.hide, pop: p.cs.pop, hl: p.cs.hl, gold: p.cs.gold, flash: p.cs.flash });
    const s = p.cs.s ?? 1, hh = (pill ? .21 : .93) * s;
    mesh.visible = true; mesh.scale.setScalar(s); mesh.quaternion.copy(_q);
    mesh.position.copy(headOf(p)).add(V(0, .21 * p.H + .07 + hh / 2, 0));
  }
  if (HEART.visible && HEART.userData.cs) { const c = HEART.userData.cs; HEART.userData.draw(c.st); HEART.position.copy(c.at); HEART.quaternion.copy(_q); HEART.scale.setScalar(c.s ?? 1); }
}
function frame(sh, t) {
  const tt = sh.loop ? 0 : t, u = sh.loop ? 0 : seg(t, sh.t0, sh.t1);
  lightP3(sh.lt, sh.at); CITY.visible = sh.set === 'city'; STAD.visible = sh.set === 'stadium';
  if (sh.set === 'stadium') drawScreen(screenState(tt));
  SPARE.forEach(m => m.visible = false);
  let c = sh.after ? null : sh.cam(tt, u); if (c) CAMP.copy(c.pos);
  sh.act(tt);
  if (!c) { c = sh.cam(tt, u); CAMP.copy(c.pos); }
  camera.position.copy(c.pos); sky.position.copy(c.pos); camera.up.set(0, 1, 0); camera.lookAt(c.look); camera.rotateZ(c.roll ?? 0); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  placeCards();
  post.dof.focus = c.focus; post.dof.aper = c.aper; post.dof.maxCoc = 8;
  zb.enabled = false;
  scene.updateMatrixWorld(true); post.composer.render();
}
const A0 = +(QS.get('a') ?? 0), B0 = +(QS.get('b') ?? DUR);
const shotAt = t => { const i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1); return SHOTS[i < 0 ? SHOTS.length - 1 : i]; };
function render(t) {
  const sh = shotAt(t);
  ov.clearRect(0, 0, W, H);
  frame(sh, t);
  if (QS.get('poster')) { ov.clearRect(0, 0, W, H); [['SHE CHOSE THE', 170, -4, '#FFFFFF', 110], ['0%', 330, -4, '#FF8AAE', 190]].forEach(([text, y, rot, col, size]) => drawTelop({ t0: -9, text, y, size, col, rot }, t)); return; }
  if (QS.get('clean')) return;
  if (t < LOOP) { TEL.forEach(x => { if (t >= x.t0 && t < x.t1) drawTelop(x, t); });
    if (t >= C9) { drawEnd(t); drawCaption(t, 1520); } else drawCaption(t); }
}
function texts(t) { if (t >= LOOP) return []; return TEL.filter(x => typeof x.text === 'string' && t >= x.t0 + .3 && t < x.t1).map(x => ({ id: x.text, text: x.text, x0: 60, y0: x.y - x.size * .7, x1: 1020, y1: x.y + x.size * .7 })); }
EV.sort((a, b) => a.t - b.t);
window.DUR = +(B0 - A0).toFixed(3); window.EV = EV; window.render = t => render(t + A0); window.TEXTS = t => texts(t + A0);
render(A0);
window.READY = true;
