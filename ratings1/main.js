// "What If Everyone Had Ratings Above Their Heads?" · part 1 · 3D vertical Short (1080×1920) in the v4 toon style.
// A city where everyone's stats float above their heads and update live. Theo (52, potential 99) loves Mia (88); the day his
// mental health sinks she's the one who stops; their compatibility is 0%… and hers with the city's highest-rated guy is 97.
// Every shot, action, telop and caption is placed from timing.json (the voice). render(t) is pure in t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { makePost } from '/core/three/post.js';
import { makeToon, apply, TP, mix, walk, TM, G } from './toon.js';
import { city, coffee, ST } from './sets_ratings.js';
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

// ---------------- the set ----------------
const CITY = city(); scene.add(CITY);
const SW = .12;                                             // the sidewalk's height
const P3 = (x, z) => V(x, SW, z);

// ---------------- cast (each with a card) ----------------
const mk = (o, card = 'mini', v = {}) => { const p = makeToon({ shoe: '#2A2A30', ...o }); scene.add(p.P); p.kind = card; p.H = o.H ?? 1; p.card = card === 'full' ? fullCard() : miniCard(); scene.add(p.card); p.v = v; return p; };
const THEO = mk({ name: 'theo', outfit: 'hoodie', top: '#7A9A86', pants: '#3C4A6A', hair: 'messy', hairC: '#3A2A20', shoe: '#E8E2D6' }, 'full', { ovr: 52, str: 41, ath: 47, hp: 72, iq: 104, eq: 93, mh: 61, pot: 99 });
const MIA = mk({ name: 'mia', outfit: 'tee', top: '#F2B33A', pants: '#2A3A5A', hair: 'bob', hairC: '#7A3A22', blush: 1, shoe: '#C8283A', seed: 4 }, 'full', { ovr: 88, str: 62, ath: 85, hp: 90, iq: 131, eq: 96, mh: 88, pot: 95 });
const KAI = mk({ name: 'kai', outfit: 'tee', top: '#1C1C22', pants: '#2A2A30', logo: 'K', logoCol: '#FFC83A', hair: 'slick', hairC: '#E8C870', glasses: 'shades', H: 1.1, shoe: '#F4F1EA', seed: 6 }, 'full', { ovr: 94, str: 97, ath: 98, hp: 95, iq: 118, eq: 19, mh: 12, pot: 94 });
const EXA = mk({ name: 'exa', outfit: 'tee', top: '#4A8AD8', pants: '#E8E2D6', hair: 'bob', hairC: '#2A1A14', seed: 8 }, 'full', { ovr: 67, str: 58, ath: 63, hp: 81, iq: 112, eq: 74, mh: 70, pot: 72 });
const JOG = mk({ name: 'jogger', outfit: 'tee', top: '#3EC8B0', pants: '#2A2A30', hair: 'beanie', hatC: '#E8423A', pomC: '#E8423A', seed: 9 }, 'full', { ovr: 74, str: 66, ath: 71, hp: 88, iq: 97, eq: 70, mh: 78, pot: 80 });
const TIRED = mk({ name: 'tired', outfit: 'suit', top: '#6A6E78', pants: '#4A4E58', tie: '#2E5AA8', hair: 'messy', hairC: '#5A4030', seed: 10 }, 'full', { ovr: 61, str: 50, ath: 44, hp: 64, iq: 118, eq: 60, mh: 49, pot: 66 });
const CP = [mk({ name: 'cp0', outfit: 'tee', top: '#E86A7A', hair: 'slick', hairC: '#2A2018', seed: 11 }, 'mini', { ovr: 71 }), mk({ name: 'cp1', outfit: 'polo', top: '#6AB8E8', hair: 'bob', hairC: '#C88A3A', seed: 12 }, 'mini', { ovr: 74 })];
const LOW = mk({ name: 'low', outfit: 'hoodie', top: '#8A6A9A', hair: 'messy', hairC: '#1E1612', seed: 13 }, 'mini', { ovr: 45 });
const HIGH = mk({ name: 'high', outfit: 'tee', top: '#F4F1EA', pants: '#1E2238', hair: 'bob', hairC: '#1A1210', seed: 14 }, 'mini', { ovr: 80 });
const LAU = [mk({ name: 'lau0', outfit: 'hoodie', top: '#E8A030', hair: 'beanie', hatC: '#2E7FE0', seed: 15 }, 'mini', { ovr: 76 }), mk({ name: 'lau1', outfit: 'tee', top: '#9ACB55', hair: 'messy', hairC: '#8A4A20', seed: 16 }, 'mini', { ovr: 73 })];
const CROWD = Array.from({ length: 12 }, (_, i) => mk({ name: 'crowd' + i, outfit: ['hoodie', 'tee', 'suit', 'polo'][i % 4], top: ['#D86A4A', '#4AA8D8', '#5A5E68', '#E8C84A', '#9A6AC8', '#4AC88A', '#C84A6A', '#8AA8C8', '#E89A4A', '#6A8A4A', '#B8B4AC', '#3A6AC8'][i],
  pants: ['#2A3A5A', '#3A3A40', '#5A4A3A'][i % 3], hair: ['messy', 'bob', 'slick', 'beanie', 'bob', 'messy', 'slick', 'bob', 'beanie', 'slick', 'bob', 'messy'][i], hairC: ['#2A2018', '#6A3A1A', '#1A1A1E', '#C88A3A'][i % 4], hatC: ['#2E9A4A', '#C8283A', '#2E7FE0'][i % 3], tie: '#C8283A', seed: 20 + i }, 'mini',
  { ovr: [58, 83, 71, 39, 66, 91, 47, 77, 62, 85, 54, 69][i] }));
const CAST = [THEO, MIA, KAI, EXA, JOG, TIRED, ...CP, LOW, HIGH, ...LAU, ...CROWD];
// props
const CUP = coffee(), CUP2 = coffee(); scene.add(CUP, CUP2);
const HEART = heart(); scene.add(HEART);
const LINK = [0, 1].map(() => { const c = document.createElement('canvas'); c.width = 512; c.height = 160; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.6, .19), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, fog: false, toneMapped: false })); m.renderOrder = 11; m.frustumCulled = false; scene.add(m);
  let key = ''; m.userData.draw = (txt, ok, k) => { const kk = txt + ok + Math.round(k * 20); if (kk === key) return; key = kk; const g = c.getContext('2d'); g.clearRect(0, 0, 512, 160); g.save(); g.globalAlpha = clamp(k * 2); g.translate(256, 80); g.scale(back(k, 2.4), back(k, 2.4)); g.translate(-256, -80);
    g.fillStyle = ok ? '#2E9A4A' : '#C8283A'; g.beginPath(); g.roundRect(20, 20, 472, 120, 60); g.fill(); g.lineWidth = 8; g.strokeStyle = '#FFFFFF'; g.stroke();
    g.fillStyle = '#FFFFFF'; g.font = '900 76px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText((ok ? '✓ ' : '✗ ') + txt, 256, 84); g.restore(); t.needsUpdate = true; }; return m; });
const PROPS = [CUP, CUP2];

// ---------------- key times (from the voice) ----------------
const C2 = cut('L2'), C3 = cut('L3'), C4 = cut('L4'), C5 = cut('L5'), C6 = cut('L6'), C7 = cut('L7'), C8 = cut('L8'), C9 = cut('L9'), C10 = cut('L10'), C11 = cut('L11');
const tRatings = w('L1', 'ratings'), tHeads = w('L1', 'heads');
const T2 = ['strength', 'athleticism', 'health', 'iq', 'eq', 'mental', 'potential'].map(x => w('L2', x));
const tLive = w('L3', 'live'), tRun = w('L3', 'run'), tUp3 = w('L3', 'up'), tSkip = w('L3', 'skip'), tDown = w('L3', 'down');
const tNobody = w('L4', 'nobody'), tTen = w('L4', 'ten'), tAway = w('L4', 'away'), tOwn = w('L4', 'own');
const tTheo5 = w('L5', 'theo'), t52 = w('L5', '52'), tAvg = w('L5', 'painfully');
const tBottom = w('L6', 'bottom'), tGrey = w('L6', 'grey'), t99 = w('L6', '99'), tNobody6 = w('L6', 'nobody');
const tLove = w('L7', 'love'), tMia7 = w('L7', 'mia'), t88 = w('L7', '88'), t36 = w('L7', '36'), tCity = w('L7', 'in', 1), tCrush = w('L7', 'crush'), tJoke = w('L7', 'joke');
const tSinking = w('L8', 'sinking'), t61 = w('L8', '61'), t52b = w('L8', '52'), t44 = w('L8', '44'), tThousands = w('L8', 'thousands');
const tStops = w('L9', 'stops'), tOkay = w('L9', 'okay'), tAnd9 = w('L9', 'and', 1), tLaughs = w('L9', 'laughs'), tJokes = w('L9', 'jokes'), tUp9 = w('L9', 'up'), tOne9 = w('L9', 'one', 1);
const tLook = w('L10', 'look'), tAppears = w('L10', 'appears'), tCompat = w('L10', 'compatibility');
const tZero = w('L11', 'zero'), tPercent = w('L11', 'percent'), tMia11 = w('L11', 'mia', 1), tHighest = w('L11', 'highest'), t97 = w('L11', '97'), tFollow = w('L11', 'follow'), tPart = w('L11', 'part');
const S3b = tRun - .1, S3c = tSkip - .1, S7b = t36 - .25, S7c = tCity - .1, S9b = tAnd9 - .08, S11b = tMia11 - .1, S11c = tFollow - .1;

// ---------------- helpers ----------------
const put = (p, v, ry = 0) => { p.P.visible = true; p.P.position.copy(v); p.P.rotation.set(0, ry, 0); p.P.updateMatrixWorld(true); };
const show = (...ps) => PROPS.forEach(o => o.visible = ps.includes(o));
const CAMP = new THREE.Vector3(0, 1.4, 6);
const headOf = p => { p.P.updateMatrixWorld(true); return p.head.getWorldPosition(V(0, 0, 0)); };
const handOf = (p, left = 0) => { p.P.updateMatrixWorld(true); return (left ? p.aL : p.aR).hand.getWorldPosition(V(0, 0, 0)); };
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
function onHand(p, o, left = 0, pos = [0, 0, 0], rot = [0, 0, 0]) { o.visible = true; (left ? p.aL : p.aR).props.add(o); o.position.set(...pos); o.rotation.set(...rot); }
// card state: cs = { v, show, hide, pop, hl, gold, s (scale), up (extra height) } — set in the acting, drawn after the camera
function card(p, o = {}) { p.cs = { v: { ...p.v }, ...o }; }
function reset() {
  CAST.forEach(p => { p.P.visible = false; p.cs = null; p.card.visible = false; });
  show(); for (const o of PROPS) { scene.add(o); o.rotation.set(0, 0, 0); }
  HEART.visible = false; HEART.userData.cs = null; LINK.forEach(l => { l.visible = false; l.userData.cs = null; });
}
// a stat that steps through values on given times, with a ±1 bubble each step: returns { v, pop }
function stepper(t, base, steps) { let v = base; const pop = []; for (const [t0, nv] of steps) { if (t >= t0) { const d = nv - v; v = nv; if (t - t0 < 1) pop.push({ d, a: (t - t0) / .9 }); } } return { v, pop }; }
// the walking crowd: lanes along the sidewalk, each person looping at their own pace
function crowd(t, n = 12, speed = 1, x0 = 0, glance = null, pillS = 1.3) {
  CROWD.slice(0, n).forEach((p, i) => { const dir = i % 2 ? 1 : -1, lane = [-6.7, -5.9, -4.6][i % 3], sp = (1.1 + hash(i) * .5) * speed, span = 34;
    const x = x0 - span / 2 + (((hash(i + 3) * span + dir * t * sp) % span) + span) % span; put(p, P3(x, lane), dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    const lk = glance && Math.abs(x - glance.x) < 2.2 ? glance.clone().add(V(0, 1.2, 0)) : CAMP;
    apply(p, walk(TP.stand, t * 7 * sp + i, .9), { t, seed: 20 + i, face: ['happy', 'calm', 'smile', 'deadpan'][i % 4], look: lk }); card(p, { s: pillS }); });
}

// ---------------- camera language ----------------
const camAt = (pos, look, fov = 45, focus, aper = 4, roll = 0) => ({ pos, look, fov, focus: focus ?? pos.distanceTo(look), aper, roll });
const hand = (c, t, a = 1) => { c.pos.x += noise(t, 1) * .012 * a; c.pos.y += noise(t, 2) * .01 * a; c.look.x += noise(t, 3) * .02 * a; c.look.y += noise(t, 4) * .016 * a; return c; };
const EXP = P3(-2, -5.1), JX = t => P3(lerp(-9, 3, seg(t, S3b - .3, S3c + .3)), -5.7), TIP = P3(9.2, -5.4);
const THX = P3(ST.cross - 1.3, -3.6), MIAX = t => P3(lerp(13.2, 11.0, seg(t, C7 - .3, C8)), 5.0);
const BEN = V(ST.bench, SW, -6.4), THB = BEN.clone().add(V(.36, 0, 0)), MIB = BEN.clone().add(V(-.36, 0, 0));
const KAIX = BEN.clone().add(V(-1.55, 0, .75)), MIAS = BEN.clone().add(V(-.75, 0, .62));
const CAFE = ST.cafe;

const SHOTS = [
  // 1 · What if everyone had ratings above their heads?: rise up out of a busy sidewalk into a sea of floating ratings
  { t0: 0, t1: C2, lt: SUNNY, at: V(0, 0, -5), act: t => act1(t),
    cam: (t, u) => { const k = eio(seg(t, .1, C2)); return hand(camAt(V(lerp(-7, -6, k), lerp(1.05, 3.6, k), lerp(-5.4, -5.0, k)), V(lerp(3, 4, k), lerp(1.75, 1.3, k), lerp(-5.4, -5.6, k)), lerp(52, 50, k), 8, 1.5), t); } },
  // 2 · Strength. Athleticism. …: one stranger's card fills in, row by row
  { t0: C2, t1: C3, lt: SUNNY, at: EXP, act: t => act2(t),
    cam: (t, u) => hand(camAt(EXP.clone().add(V(lerp(.25, .15, u), lerp(1.72, 1.78, u), lerp(3.4, 3.0, eo(u)))), EXP.clone().add(V(0, 1.78, 0)), 42, 3.1, 5), t) },
  // 3a · They update live
  { t0: C3, t1: S3b, lt: SUNNY, at: EXP, act: t => act2(t),
    cam: (t, u) => hand(camAt(EXP.clone().add(V(lerp(.15, .1, u), lerp(1.78, 1.8, u), lerp(3.0, 2.8, u))), EXP.clone().add(V(0, 1.8, 0)), 42, 2.9, 5), t) },
  // 3b · Go for a run, athleticism goes up: a jogger runs at us, +1
  { t0: S3b, t1: S3c, lt: SUNNY, at: V(0, 0, -4.6), act: t => act3(t),
    after: 1, cam: (t, u) => { const p = JX(t); return hand(camAt(p.clone().add(V(3.6, 1.6, .9)), p.clone().add(V(0, 1.55, 0)), 44, 3.7, 5), t, 1.3); } },
  // 3c · Skip sleep, health goes down: a yawning office worker, −1
  { t0: S3c, t1: C4, lt: SUNNY, at: TIP, act: t => act3(t),
    cam: (t, u) => hand(camAt(TIP.clone().add(V(lerp(.4, .25, u), lerp(1.72, 1.76, u), lerp(2.9, 2.6, eo(u)))), TIP.clone().add(V(0, 1.75, 0)), 42, 2.7, 5), t) },
  // 4 · nobody dates more than ten points away: the café terrace, a ✓ and a ✗
  { t0: C4, t1: C5, lt: SUNNY, at: P3(CAFE, -5.4), act: t => act4(t),
    cam: (t, u) => { const k = eio(seg(t, tTen - .5, tTen + .15)); return hand(camAt(P3(CAFE + lerp(-2.4, .05, k), -2.3).add(V(0, 1.7, 0)), P3(CAFE + lerp(-2.6, -.05, k), -5.0).add(V(0, 1.38, 0)), 50, 2.8, 4), t); } },
  // 5 · This is Theo. Overall 52. Painfully average.: at the crosswalk
  { t0: C5, t1: C6, lt: SUNNY, at: THX, act: t => act5(t),
    cam: (t, u) => hand(camAt(THX.clone().add(V(lerp(.5, .3, u), lerp(1.55, 1.72, u), lerp(3.6, 2.9, eo(u)))), THX.clone().add(V(0, lerp(1.45, 1.7, u), 0)), 42, 3.2, 5), t) },
  // 6 · …a small grey number. Potential: 99.: push into the bottom of his card; then the crowd walks past, eyes on the big numbers
  { t0: C6, t1: C7, lt: SUNNY, at: THX, act: t => act5(t),
    after: 1, cam: (t, u) => { const k = eio(seg(t, C6, t99)), o = eio(seg(t, tNobody6 - .2, C7)); const c0 = headOf(THEO).add(V(0, .28 + .465, 0));
      return hand(camAt(c0.clone().add(V(lerp(.25, .04, k) + o * .4, lerp(.1, -.3, k) + o * -.3, lerp(3.4, 1.85, k) + o * 1.8)), c0.clone().add(V(0, lerp(.05, -.33, k) * (1 - o) - o * .55, 0)), lerp(40, 30, k), lerp(3.4, 1.85, k) + o * 1.8, lerp(4, 6, k)), t, .7); } },
  // 7a · Theo is in love with Mia: over his shoulder, across the road
  { t0: C7, t1: tMia7 - .08, lt: SUNNY, at: THX, act: t => act7(t),
    cam: (t, u) => hand(camAt(THX.clone().add(V(lerp(-.55, -.45, u), lerp(1.35, 1.38, u), lerp(1.35, 1.1, eo(u)))), THX.clone().add(V(0, 1.42, 0)), 40, 1.3, 6), t) },
  { t0: tMia7 - .08, t1: S7c, lt: SUNNY, at: V(ST.cross, 0, 3), act: t => act7(t),
    cam: (t, u) => { const m = MIAX(t); return hand(camAt(m.clone().add(V(lerp(.7, .5, u), lerp(1.65, 1.7, u), lerp(-3.6, -3.1, eo(u)))), m.clone().add(V(0, 1.72, 0)), 42, 3.4, 4), t); } },
  // 7c · …that's not a crush. That's a joke.: two passers-by crack up
  { t0: S7c, t1: C8, lt: SUNNY, at: P3(ST.cross - 4, -5), act: t => act7(t),
    cam: (t, u) => hand(camAt(P3(ST.cross - 3.6 + lerp(.3, 0, u), -2.0).add(V(0, 1.7, 0)), P3(ST.cross - 4.2, -5.4).add(V(0, 1.45, 0)), 42, 3.4, 4), t) },
  // 8 · The day they meet…: overcast; Theo alone on the bench, his mental health sinking; the crowd streams past
  { t0: C8, t1: C9, lt: GREY, at: BEN, act: t => act8(t),
    cam: (t, u) => hand(camAt(BEN.clone().add(V(lerp(.75, .55, u), lerp(1.2, 1.25, u), lerp(3.4, 2.7, eo(u)))), BEN.clone().add(V(.3, 1.5, 0)), 44, 2.9, 5), t, .6) },
  // 9a · Mia is the first one who stops and asks, "Are you okay?"
  { t0: C9, t1: S9b, lt: GREY, at: BEN, act: t => act9(t),
    cam: (t, u) => hand(camAt(BEN.clone().add(V(lerp(1.6, 1.45, u), lerp(1.4, 1.38, u), lerp(2.2, 1.9, eo(u)))), BEN.clone().add(V(-.05, 1.42, .3)), 40, 2.3, 5), t) },
  // 9b · And every time she laughs at his jokes, his mental health goes up by one: the sun comes back out
  { t0: S9b, t1: C10, lt: 'warm', at: BEN, act: t => act9(t),
    cam: (t, u) => hand(camAt(BEN.clone().add(V(lerp(.3, .2, u), lerp(1.5, 1.52, u), lerp(3.2, 2.7, eo(u)))), BEN.clone().add(V(.05, 1.5, 0)), 42, 2.8, 5), t) },
  // 10 · When two people look at each other… Compatibility.: the heart rises between them
  { t0: C10, t1: C11, lt: SUNNY, at: BEN, act: t => act10(t),
    cam: (t, u) => hand(camAt(BEN.clone().add(V(0, lerp(1.3, 1.36, u), lerp(2.6, 2.1, eo(u)))), BEN.clone().add(V(0, 1.5, 0)), 40, 2.2, 6), t, .6) },
  // 11a · Theo and Mia: zero percent.: it fills to… nothing; it cracks; they both crack up
  { t0: C11, t1: S11b, lt: SUNNY, at: BEN, act: t => act10(t),
    cam: (t, u) => hand(camAt(BEN.clone().add(V(0, 1.36, lerp(2.1, 1.85, u))), BEN.clone().add(V(0, 1.55, 0)), 40, 1.9, 6), t, .6) },
  // 11b · Mia and the highest-rated guy in the city: 97.: Kai walks up; Mia stands; their heart fills and glows
  { t0: S11b, t1: S11c, lt: SUNNY, at: BEN, act: t => act11(t),
    cam: (t, u) => hand(camAt(V(lerp(3.4, 3.6, u), lerp(1.75, 1.8, u), lerp(-2.3, -2.6, eo(u))), V(5.2, 1.85, -6.0), 46, 3.7, 4), t) },
  // 11c · Follow for part 2.: push into Kai's card, to the one line that's hidden
  { t0: S11c, t1: LOOP, lt: SUNNY, at: BEN, act: t => act11(t),
    after: 1, cam: (t, u) => { const c = headOf(KAI).add(V(0, .21 * 1.1 + .07 + .465 * .7 + .1, 0)), k = eio(u); return hand(camAt(c.clone().add(V(lerp(.4, .08, k), lerp(-.3, .02, k) - .05, lerp(2.4, 1.0, k))), c.clone().add(V(0, lerp(-.2, -.28, k), 0)), 40, lerp(2.4, 1.0, k), 5), t, .5); } },
];
SHOTS.push({ ...SHOTS[0], t0: LOOP, t1: DUR + 1, loop: 1 });

// ---------------- acting ----------------
function act1(t) {
  reset(); crowd(t, 12, 1, 0);
  put(EXA, EXP.clone().add(V(-.6, 0, .4)), .3); apply(EXA, walk(TP.stand, t * 7, .9), { t, seed: 8, face: 'happy', look: CAMP }); card(EXA, { s: .5 });
}
function act2(t) {
  reset(); crowd(t, 8, 1, -2);
  CROWD.slice(0, 8).forEach(p => { if (Math.abs(p.P.position.x - EXP.x) < 1.3 && p.P.position.z > -5.5) p.P.position.y = -9; });   // keep the path to her clear
  put(EXA, EXP, 0); apply(EXA, t > tLive ? TP.hips : TP.stand, { t, seed: 8, face: t > tLive + .1 ? 'smile' : 'happy', look: CAMP });
  // the rows pop in on their words; then the card goes live: EQ +1 as she smiles
  const done = T2.filter(x => t >= x - .05).length, last = T2[Math.max(0, done - 1)];
  const sh = t >= T2[6] + .3 ? 1 : (Math.max(0, done - 1) + seg(t, last - .05, last + .15)) / 7;
  const eq = stepper(t, 74, [[tLive + .05, 75]]);
  card(EXA, { show: sh, v: { ...EXA.v, eq: eq.v }, pop: eq.pop.map(p => ({ k: 'eq', ...p })) });
  onHand(EXA, CUP, 1, [0, -.02, .05]);
}
function act3(t) {
  reset();
  if (t < S3c) {   // the jogger: +1 athleticism on "up"
    const p = JX(t); put(JOG, p, Math.PI / 2 - .35); apply(JOG, walk({ ...TP.stand, sp: [10, 0, 0], aL: [-30, 12, 0, 90], aR: [-30, 12, 0, 90] }, t * 13, 1.5), { t, seed: 9, face: t > tUp3 ? 'proud' : 'happy', look: CAMP });
    JOG.P.position.y = SW + Math.abs(Math.sin(t * 13)) * .06;
    const a = stepper(t, 71, [[tUp3, 72]]); card(JOG, { v: { ...JOG.v, ath: a.v }, pop: a.pop.map(x => ({ k: 'ath', ...x })), hl: 'ath' });
    crowd(t, 6, 1, -3); return;
  }
  // the yawner: −1 health on "down"
  put(TIRED, TIP, -.15); const yawn = Math.max(0, Math.sin(seg(t, S3c + .1, tDown) * Math.PI));
  apply(TIRED, { ...TP.stand, hd: [-14 * yawn, 0, 6], aR: [-60, 12, 0, 110], aL: [-40 * yawn - 5, 30 * yawn, 0, 120 * yawn] }, { t, seed: 10, face: yawn > .3 ? 'shock' : 'deadpan', eyes: [0, -.5], look: CAMP });
  onHand(TIRED, CUP2, 0, [0, -.02, .05]);
  const h = stepper(t, 64, [[tDown, 63]]); card(TIRED, { v: { ...TIRED.v, hp: h.v }, pop: h.pop.map(x => ({ k: 'hp', ...x })), hl: 'hp' });
}
function act4(t) {
  reset();
  // a matched couple at the first table: 71 + 74 → ✓ 3; at "ten": a 45 tries his luck at an 80 → ✗ 35, she turns away
  const T0 = CITY.userData.tables[0].position, T1 = CITY.userData.tables[1].position;
  const a = T0.clone().add(V(-.62, 0, .22)), b = T0.clone().add(V(.62, 0, .22));
  put(CP[0], a, face(a, b)); put(CP[1], b, face(b, a));
  for (const [p, s] of [[CP[0], 11], [CP[1], 12]]) { apply(p, { ...TP.sit, y: -.05 }, { t, seed: s, face: 'laugh', look: headOf(p === CP[0] ? CP[1] : CP[0]) }); card(p); }
  const hp = T1.clone().add(V(.62, 0, .22)); put(HIGH, hp, -Math.PI / 2);
  const lowIn = eo(seg(t, tTen - .9, tTen - .2)), lp = T1.clone().add(V(lerp(-1.3, -.62, lowIn), 0, lerp(-1.5, .3, lowIn)));
  put(LOW, lp, face(lp, hp)); apply(LOW, lowIn < 1 ? walk(TP.stand, t * 7, .9) : (t > tAway - .1 ? TP.shrug : TP.wave), { t, seed: 13, face: t > tAway ? 'worried' : 'happy', look: headOf(HIGH) });
  const turned = t > tAway - .15; HIGH.P.rotation.y = turned ? .4 : -Math.PI / 2 - .4; HIGH.P.updateMatrixWorld(true);
  apply(HIGH, { ...TP.sit, y: -.05, aR: turned ? [-80, 30, 0, 20] : TP.sit.aR }, { t, seed: 14, face: turned ? 'deadpan' : 'calm', look: turned ? CAMP : headOf(LOW) });
  card(HIGH); card(LOW);
  linkAt(0, CP[0], CP[1], '3', 1, seg(t, C4 + .3, C4 + .6)); linkAt(1, LOW, HIGH, '35', 0, seg(t, tTen - .05, tTen + .25));
}
function linkAt(i, a, b, txt, ok, k) { if (k <= 0) return; const L = LINK[i]; L.visible = true; L.userData.cs = { txt, ok, k, at: headOf(a).lerp(headOf(b), .5).add(V(0, .62, 0)) }; }
function act5(t) {
  reset(); crowd(t, 8, 1, ST.cross - 4, THX);
  CROWD.slice(0, 8).forEach(p => { if (Math.abs(p.P.position.x - THX.x) < 1.2 && Math.abs(p.P.position.z - THX.z) < 1.4) p.P.position.y = -9; });
  put(THEO, THX, 0);
  const shrug = seg(t, tAvg - .15, tAvg + .2) * (1 - seg(t, tAvg + .8, tAvg + 1.1));
  apply(THEO, mix(TP.stand, TP.shrug, eo(shrug)), { t, seed: 1, face: shrug > .3 ? 'deadpan' : t > t52 ? 'smile' : 'happy', look: CAMP });
  const pot = t >= C6 && t < C7;
  card(THEO, { hl: pot && t > tGrey - .3 ? 'pot' : null, show: t < t52 - .1 ? 0 : 1 });
}
function act7(t) {
  reset();
  // Theo at the curb gazing across; Mia strolling on the far side with her coffee
  put(THEO, THX, 0); apply(THEO, TP.stand, { t, seed: 1, face: 'happy', look: MIAX(t).add(V(0, 1.3, 0)), noBlink: 1 }); card(THEO, { s: t < S7c ? .8 : .6 });
  const m = MIAX(t); put(MIA, m, 3.4); apply(MIA, walk(TP.stand, t * 6.5, .8), { t, seed: 4, face: 'smile', look: CAMP.clone().add(V(-.9, 0, 0)) }); onHand(MIA, CUP, 1, [0, -.02, .05]);
  card(MIA, { s: t < S7c ? .8 : .6 });
  if (t >= S7c) {   // two passers-by read the numbers and crack up
    LAU.forEach((p, i) => { const v = P3(ST.cross - 4.4 + i * .7, -5.5 + i * .2); put(p, v, face(v, THX) - (i ? .3 : -.3)); apply(p, t > tCrush ? (i ? TP.cheer : TP.point) : TP.stand, { t, seed: 15 + i, face: t > tJoke - .25 ? 'laugh' : 'smug', look: THX.clone().add(V(0, 1.3, 0)) }); card(p); });
  }
}
function act8(t) {
  reset();
  put(THEO, THB, 0); apply(THEO, { ...TP.slump, sp: [12, 0, 0], y: -.06, hd: [-2, 0, 0] }, { t, seed: 1, face: 'worried', eyes: [0, -.7], look: BEN.clone().add(V(.4, .3, 1.2)) });
  const m = stepper(t, 61, [[t61, 61], [t52b, 52], [t44, 44]]);
  card(THEO, { v: { ...THEO.v, mh: m.v, ovr: t >= t44 ? 49 : t >= t52b ? 50 : 52 }, hl: 'mh', pop: m.pop.filter(p => p.d).map(x => ({ k: 'mh', ...x })) });
  // thousands walked past: the crowd streams by fast, glancing at his number
  crowd(t * (t > tThousands - .2 ? 2.6 : 1), 12, 1, ST.bench, THB);
}
function act9(t) {
  reset();
  const sitting = t >= S9b;
  put(THEO, THB, 0); const laughs = [tLaughs, tJokes, tUp9, tOne9];
  const laughing = laughs.some(x => t > x - .1 && t < x + .45);
  apply(THEO, sitting ? { ...TP.sit, y: -.06 } : { ...TP.slump, sp: [12, 0, 0], y: -.06, hd: [-2 - 14 * seg(t, tOkay - .3, tOkay), 0, 0] }, { t, seed: 1, face: sitting ? (laughing ? 'laugh' : 'happy') : t > tOkay - .2 ? 'shock' : 'worried', look: headOf(MIA), talk: sitting && !laughing ? .3 + .3 * Math.sin(t * 17) : 0 });
  if (!sitting) { const k = eo(seg(t, C9 - .3, tStops)), p = BEN.clone().add(V(lerp(-2.6, -.25, k), 0, lerp(.9, .72, k))); put(MIA, p, face(p, THB)); apply(MIA, k < 1 ? walk(TP.stand, t * 6.5, .8) : { ...TP.stand, sp: [18, 0, 0], hd: [12, 0, 0], aL: [-30, 10, 0, 20] }, { t, seed: 4, face: 'worried', look: headOf(THEO), talk: t > tOkay - .5 && t < tOkay + .2 ? .5 : 0 }); }
  else { put(MIA, MIB, 0.25); apply(MIA, laughing ? { ...TP.sitLaugh, y: -.06 } : { ...TP.sit, y: -.06 }, { t, seed: 4, face: laughing ? 'laugh' : 'smile', look: headOf(THEO) }); }
  const m = stepper(t, 44, laughs.map((x, i) => [x + .05, 45 + i]));
  card(THEO, { v: { ...THEO.v, mh: m.v, ovr: 49 }, hl: 'mh', pop: m.pop.map(x => ({ k: 'mh', ...x })), s: .78 }); card(MIA, { s: .5, mini: 1 });
}
function act10(t) {
  reset();
  put(THEO, THB, -.35); put(MIA, MIB, .35);
  const lookin = t > tLook - .2, burst = t > tPercent + .25;
  apply(THEO, burst ? { ...TP.sitLaugh, y: -.06 } : { ...TP.sit, y: -.06 }, { t, seed: 1, face: burst ? 'laugh' : t > tZero ? 'shock' : 'smile', look: lookin ? headOf(MIA) : CAMP });
  apply(MIA, burst ? { ...TP.sitLaugh, y: -.06 } : { ...TP.sit, y: -.06 }, { t, seed: 4, face: burst ? 'laugh' : t > tZero ? 'shock' : 'smile', look: lookin ? headOf(THEO) : CAMP });
  const hs = seg(t, tAppears - .1, tAppears + .3);
  // the number spins like a slot machine… and lands on 0 on "zero"
  const spin = t < tZero - .02 ? (Math.floor(hash(Math.floor(t * 14)) * 99) + 1) + '%' : '0%';
  if (hs > 0) { HEART.visible = true; HEART.userData.cs = { st: { pct: t < tZero ? 60 : 0, fill: t < tZero ? .5 + .5 * Math.sin(t * 9) ** 2 : 1, crack: seg(t, tZero + .05, tZero + .35), show: hs, txt: spin }, at: headOf(THEO).lerp(headOf(MIA), .5).add(V(0, .42, .1)), s: 1 }; }
  card(THEO, { s: .45, mini: 1 }); card(MIA, { s: .45, mini: 1 });
}
function act11(t) {
  reset();
  // Kai strides in; Mia stands; Theo sinks on the bench behind them
  const k = eo(seg(t, S11b - .5, tHighest)), kp = KAIX.clone().add(V(lerp(-2.2, 0, k), 0, 0));
  put(KAI, kp, face(kp, MIAS)); apply(KAI, k < 1 ? walk(TP.stand, t * 6, .8) : TP.hips, { t, seed: 6, face: 'smug', look: t > t97 ? CAMP : headOf(MIA) });
  const up = eo(seg(t, S11b, S11b + .45)); put(MIA, MIB.clone().lerp(MIAS, up), lerp(.35, face(MIAS, KAIX), up));
  apply(MIA, up < 1 ? mix({ ...TP.sit, y: -.06 }, TP.stand, up) : TP.stand, { t, seed: 4, face: 'calm', look: headOf(KAI) });
  put(THEO, THB, -.2); apply(THEO, { ...TP.slump, y: -.06 }, { t, seed: 1, face: 'worried', look: headOf(MIA), eyes: [-.3, -.4] });
  const hs = seg(t, t97 - .7, t97 - .45), fill = seg(t, t97 - .45, t97 + .05);
  if (hs > 0 && t < S11c) { HEART.visible = true; HEART.userData.cs = { st: { pct: 97, fill, glow: fill, show: hs }, at: headOf(KAI).lerp(headOf(MIA), .5).add(V(0, .5, .2)), s: 1.1 }; }
  card(KAI, { hide: ['mh'], gold: 1, hl: t >= S11c ? 'mh' : null, s: t >= S11c ? 1 : .7 }); card(MIA, { s: .45, mini: 1 }); card(THEO, { s: .45, mini: 1 });
}

// ---------------- sound events (the score reads these) ----------------
ev(0, 'street', { d: C8 }); ev(.05, 'boom'); ev(tRatings, 'pop'); ev(tHeads, 'blip');
T2.forEach((x, i) => ev(x, 'tick', { n: i })); ev(tLive, 'up');
ev(S3b, 'steps', { d: S3c - S3b }); ev(tUp3, 'up'); ev(tSkip, 'yawn'); ev(tDown, 'down');
ev(C4, 'cafe', { d: C5 - C4 }); ev(C4 + .35, 'ok'); ev(tTen, 'error');
ev(C5 - .05, 'whoosh'); ev(t52, 'pop'); ev(tAvg, 'shrug');
ev(C6, 'whoosh'); ev(t99, 'shine');
ev(C7 - .05, 'whoosh'); ev(t88, 'pop'); ev(t36, 'ruler'); ev(tJoke, 'laugh');
ev(C8, 'rain', { d: C9 - C8 + .5 }); ev(t61, 'down'); ev(t52b, 'down'); ev(t44, 'down'); ev(tThousands, 'rush', { d: 1.4 });
ev(tStops, 'steps1'); [tLaughs, tJokes, tUp9, tOne9].forEach(x => ev(x + .05, 'up'));
ev(C10, 'heart', { d: C11 - C10 }); ev(tAppears, 'pop'); ev(tAppears + .15, 'spin', { d: tZero - tAppears - .15 });
ev(tZero, 'crack'); ev(tPercent + .25, 'laugh'); ev(S11b, 'whoosh'); ev(t97, 'sparkle'); ev(S11c, 'hit'); ev(tPart, 'sting');

// ---------------- the overlay: telops + 1–3 word captions ----------------
const ov = document.getElementById('ov').getContext('2d');
const TEL = [
  { t0: tTen - .05, t1: C5, text: '±10 RULE', y: 300, size: 140, col: '#FFFFFF', rot: -4, plate: '#C8283A' },
  { t0: t99 - .05, t1: tNobody6 + .3, text: 'POTENTIAL: 99', y: 300, size: 110, col: '#C8CCD8', rot: -3, plate: '#2A2E40' },
  { t0: t36 - .05, t1: S7c + .1, text: '36-POINT GAP', y: 300, size: 110, col: '#FFFFFF', rot: -4, plate: '#C8283A', vs: 1 },
  { t0: tCompat - .05, t1: C11 + .2, text: 'COMPATIBILITY', y: 300, size: 100, col: '#FFFFFF', rot: -3, plate: '#C83A6A' },
  { t0: tPart - .05, t1: LOOP, text: 'PART 2 →', y: 1500, size: 150, col: '#FFD23F', rot: -5 },
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
  if (x.vs) {   // 52 ⟷ 88 under the plate
    const k = back(seg(t, x.t0 + .1, x.t0 + .4), 2.4); ov.save(); ov.translate(540, x.y + 190); ov.scale(k, k);
    [[-260, 52], [260, 88]].forEach(([dx, n]) => { ov.fillStyle = tier(n); ov.beginPath(); ov.arc(dx, 0, 95, 0, 7); ov.fill(); ov.lineWidth = 10; ov.strokeStyle = '#16131A'; ov.stroke(); ov.fillStyle = '#16131A'; ov.font = '900 100px Montserrat'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.fillText(String(n), dx, 6); });
    ov.strokeStyle = '#FFFFFF'; ov.lineWidth = 12; ov.lineCap = 'round'; ov.beginPath(); ov.moveTo(-140, 0); ov.lineTo(140, 0); ov.stroke(); for (const s of [-1, 1]) { ov.beginPath(); ov.moveTo(s * 140, 0); ov.lineTo(s * 105, -26); ov.moveTo(s * 140, 0); ov.lineTo(s * 105, 26); ov.stroke(); }
    ov.restore(); }
}
const chunks = [];
TMJ.lines.forEach((l, li) => { let cur = []; const flush = () => { if (cur.length) chunks.push({ li, words: cur }); cur = []; };
  l.words.forEach(x => { const len = cur.reduce((a, y) => a + y.w.length + 1, 0) + x.w.length; if (cur.length && (len > 14 || cur.length >= 3)) flush(); cur.push(x); if (/[,.…!?:"]$/.test(x.w)) flush(); }); flush(); });
chunks.forEach((c, i) => { const n = chunks[i + 1]; c.text = c.words.map(x => x.w).join(' ').replace(/"/g, ''); c.a = c.words[0].t0 - .04; c.b = n ? Math.min(n.words[0].t0 - .04, c.words[c.words.length - 1].t1 + .6) : c.words[c.words.length - 1].t1 + .6; });
const CAPY = 1260;
function drawCaption(t) {
  const c = chunks.find(c => t >= c.a && t < c.b); if (!c) return;
  const pop = back(seg(t, c.a, c.a + .12), 2.2), s = lerp(.6, 1, pop);
  ov.save(); ov.translate(W / 2, CAPY); ov.scale(s, s); ov.font = '900 104px Montserrat'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 22; ov.shadowOffsetY = 8; ov.lineWidth = 26; ov.strokeStyle = '#000'; ov.strokeText(c.text, 0, 0, 1000);
  ov.shadowColor = 'transparent'; ov.fillStyle = '#FFFFFF'; ov.fillText(c.text, 0, 0, 1000); ov.restore();
}

// ---------------- render ----------------
const _q = new THREE.Quaternion();
const SPARE = [miniCard(), miniCard(), miniCard()]; SPARE.forEach(m => { m.visible = false; scene.add(m); });
function placeCards() {
  _q.copy(camera.quaternion); let si = 0;
  for (const p of CAST) {
    if (!p.P.visible || !p.cs || p.cs.show === 0) continue;
    const pill = p.kind === 'mini' || p.cs.mini, mesh = p.kind === 'full' && p.cs.mini ? SPARE[si++] : p.card; if (!mesh) continue;
    mesh.userData.draw(pill ? { v: p.cs.v } : { v: p.cs.v, show: p.cs.show, hide: p.cs.hide, pop: p.cs.pop, hl: p.cs.hl, gold: p.cs.gold });
    const s = p.cs.s ?? 1, hh = (pill ? .21 : .93) * s;
    mesh.visible = true; mesh.scale.setScalar(s); mesh.quaternion.copy(_q);
    mesh.position.copy(headOf(p)).add(V(0, .21 * p.H + .07 + hh / 2, 0));
  }
  if (HEART.visible && HEART.userData.cs) { const c = HEART.userData.cs; HEART.userData.draw(c.st); HEART.position.copy(c.at); HEART.quaternion.copy(_q); HEART.scale.setScalar(c.s ?? 1); }
  LINK.forEach(L => { if (!L.visible || !L.userData.cs) return; const c = L.userData.cs; L.userData.draw(c.txt, c.ok, c.k); L.position.copy(c.at); L.quaternion.copy(_q); });
}
function frame(sh, t) {
  const tt = sh.loop ? 0 : t, u = sh.loop ? 0 : seg(t, sh.t0, sh.t1);
  const lt = sh.lt === 'warm' ? mixLT(GREY, SUNNY, eo(seg(tt, tLaughs - .2, tOne9 + .3))) : sh.lt;
  light(lt, sh.at);
  SPARE.forEach(m => m.visible = false);
  let c = sh.after ? null : sh.cam(tt, u); if (c) CAMP.copy(c.pos);
  sh.act(tt);
  if (!c) { c = sh.cam(tt, u); CAMP.copy(c.pos); }
  camera.position.copy(c.pos); sky.position.copy(c.pos); camera.up.set(0, 1, 0); camera.lookAt(c.look); camera.rotateZ(c.roll ?? 0); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  placeCards();
  post.dof.focus = c.focus; post.dof.aper = c.aper; post.dof.maxCoc = 8;
  const f = sh.fpv ? Math.sin(seg(tt, sh.t0, sh.t1) * Math.PI) * sh.fpv : 0; zb.uniforms.amt.value = f * .09; zb.enabled = f > .02;
  scene.updateMatrixWorld(true); post.composer.render();
}
const A0 = +(QS.get('a') ?? 0), B0 = +(QS.get('b') ?? DUR);
const shotAt = t => { const i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1); return SHOTS[i < 0 ? SHOTS.length - 1 : i]; };
function render(t) {
  const sh = shotAt(t);
  ov.clearRect(0, 0, W, H);
  frame(sh, t);
  if (QS.get('poster')) { ov.clearRect(0, 0, W, H); [['WHAT IF EVERYONE HAD', 170, -4, '#FFFFFF', 92], ['RATINGS ABOVE THEIR HEADS?', 300, -4, '#FFD23F', 84]].forEach(([text, y, rot, col, size]) => drawTelop({ t0: -9, text, y, size, col, rot }, t)); return; }
  if (QS.get('clean')) return;
  if (t < LOOP) { TEL.forEach(x => { if (t >= x.t0 && t < x.t1) drawTelop(x, t); }); drawCaption(t); }
}
function texts(t) { if (t >= LOOP) return []; return TEL.filter(x => typeof x.text === 'string' && t >= x.t0 + .3 && t < x.t1).map(x => ({ id: x.text, text: x.text, x0: 60, y0: x.y - x.size * .7, x1: 1020, y1: x.y + x.size * .7 })); }
EV.sort((a, b) => a.t - b.t);
window.DUR = +(B0 - A0).toFixed(3); window.EV = EV; window.render = t => render(t + A0); window.TEXTS = t => texts(t + A0);
render(A0);
window.READY = true;
