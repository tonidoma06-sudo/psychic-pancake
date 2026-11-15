// "What If Everyone Had Ratings Above Their Heads?" · part 2 · "The Ranking" · 3D vertical Short (1080×1920), v4 toon style.
// Kai (94, EQ 19, one line hidden — the rich can pay to hide a stat); The Ranking, a live city competition in a stadium: Kai
// wins the race, Theo comes last; Theo's IQ climbs live in the puzzle; the final pairs Theo with Kai and switches every filter
// off… Kai's hidden line lights up: mental health 12.
// Every shot, action, telop and caption is placed from timing.json (the voice). render(t) is pure in t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { makePost } from '/core/three/post.js';
import { makeToon, apply, TP, mix, walk, TM, G } from './toon.js';
import { city, coffee, stadium, ST, SD } from './sets_ratings.js';
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

// ---------------- cast (each with a card) ----------------
const mk = (o, card = 'mini', v = {}) => { const p = makeToon({ shoe: '#2A2A30', ...o }); scene.add(p.P); p.kind = card; p.H = o.H ?? 1; p.card = card === 'full' ? fullCard() : miniCard(); scene.add(p.card); p.v = v; return p; };
const THEO = mk({ name: 'theo', outfit: 'hoodie', top: '#7A9A86', pants: '#3C4A6A', hair: 'messy', hairC: '#3A2A20', shoe: '#E8E2D6' }, 'full', { ovr: 52, str: 41, ath: 47, hp: 72, iq: 104, eq: 93, mh: 61, pot: 99 });
const MIA = mk({ name: 'mia', outfit: 'tee', top: '#F2B33A', pants: '#2A3A5A', hair: 'bob', hairC: '#7A3A22', blush: 1, shoe: '#C8283A', seed: 4 }, 'full', { ovr: 88, str: 62, ath: 85, hp: 90, iq: 131, eq: 96, mh: 88, pot: 95 });
const KAI = mk({ name: 'kai', outfit: 'tee', top: '#1C1C22', pants: '#2A2A30', logo: 'K', logoCol: '#FFC83A', hair: 'slick', hairC: '#E8C870', glasses: 'shades', H: 1.1, shoe: '#F4F1EA', seed: 6 }, 'full', { ovr: 94, str: 97, ath: 98, hp: 95, iq: 118, eq: 19, mh: 12, pot: 94 });
const HOST = mk({ name: 'host', outfit: 'suit', top: '#7A2E8E', pants: '#2A1E38', tie: '#FFD23F', pocketSq: '#FFD23F', hair: 'slick', hairC: '#1A1210', seed: 30 }, 'mini', { ovr: 81 });
const SHAKE = mk({ name: 'shake', outfit: 'polo', top: '#6AB8E8', pants: '#3A3A40', hair: 'messy', hairC: '#8A4A20', seed: 31 }, 'mini', { ovr: 72 });
const CLERK = mk({ name: 'clerk', outfit: 'suit', top: '#2E5AA8', pants: '#2A2E3A', tie: '#C8283A', hair: 'bob', hairC: '#2A1A14', glasses: 'round', seed: 32 }, 'mini', { ovr: 77 });
const RUN = [0, 1, 2, 3].map(i => mk({ name: 'run' + i, outfit: 'tee', top: ['#E8423A', '#3EB2E8', '#F2B33A', '#9A6AC8'][i], pants: '#2A2A30', hair: ['beanie', 'messy', 'slick', 'bob'][i], hairC: ['#2A2018', '#6A3A1A', '#1A1A1E', '#C88A3A'][i], hatC: '#2E9A4A', seed: 40 + i }, 'mini', { ovr: [88, 83, 79, 86][i] }));
const FAN = [0, 1, 2].map(i => mk({ name: 'fan' + i, outfit: ['hoodie', 'tee', 'polo'][i], top: ['#E89A4A', '#4AC88A', '#C84A6A'][i], hair: ['beanie', 'bob', 'messy'][i], hatC: '#2E7FE0', hairC: ['#2A2018', '#6A3A1A', '#1A1A1E'][i], seed: 50 + i }, 'mini', { ovr: [71, 84, 66][i] }));
const CAST = [THEO, MIA, KAI, HOST, SHAKE, CLERK, ...RUN, ...FAN];
// props
const CUP = coffee(); scene.add(CUP);
const BAG = G(); TM(new THREE.BoxGeometry(.3, .32, .12), '#16131A', BAG, 0, -.18, 0, .004); TM(new THREE.TorusGeometry(.08, .012, 6, 14, Math.PI), '#FFD24A', BAG, 0, 0, 0, .003); scene.add(BAG);
const PEN = G(); TM(new THREE.CylinderGeometry(.007, .007, .14, 8), '#1A1A1E', PEN, 0, 0, 0, .002); scene.add(PEN);
const MIC = G(); TM(new THREE.CylinderGeometry(.015, .012, .16, 8), '#2A2A30', MIC, 0, 0, 0, .002); TM(new THREE.SphereGeometry(.028, 10, 8), '#5A5E68', MIC, 0, .09, 0, .002); scene.add(MIC);
const TAPE = new THREE.Mesh(new THREE.BoxGeometry(.02, .02, 7.2), new THREE.MeshStandardMaterial({ color: '#F4F1EA' })); scene.add(TAPE);
const HEART = heart(); scene.add(HEART);
const PROPS = [CUP, BAG, PEN, MIC, TAPE];

// ---------------- key times (from the voice) ----------------
const C2 = cut('L2'), C3 = cut('L3'), C4 = cut('L4'), C5 = cut('L5'), C6 = cut('L6'), C7 = cut('L7'), C8 = cut('L8'), C9 = cut('L9');
const t52 = w('L1', '52'), tMia1 = w('L1', 'mia'), t88 = w('L1', '88'), tTheir = w('L1', 'their'), tZero = w('L1', 'zero'), tAnd1 = w('L1', 'and'), t97a = w('L1', '97');
const t94 = w('L2', '94'), tStr = w('L2', 'strength'), tAth = w('L2', 'athleticism'), tHe2 = w('L2', 'he'), tShake = w('L2', 'shake'), t80 = w('L2', '80');
const tEQ = w('L3', 'eq'), t19 = w('L3', '19'), tLine = w('L3', 'line'), tBlank = w('L3', 'blank'), tIf = w('L3', 'if'), tRich = w('L3', 'rich'), tHide = w('L3', 'hide');
const tRanking = w('L4', 'ranking'), tThree = w('L4', 'three'), tLiveTV = w('L4', 'live'), tWinner = w('L4', 'winners'), tGold = w('L4', 'gold'), tOutranks = w('L4', 'outranks');
const tTwice = w('L5', 'twice'), tTheo5 = w('L5', 'theo'), tSigns = w('L5', 'signs'), tCrowd = w('L5', 'crowd'), tLaughs = w('L5', 'laughs');
const tRace = w('L6', 'race'), tFirst = w('L6', 'first'), tTheo6 = w('L6', 'theo'), tLast = w('L6', 'last');
const tPuzzle = w('L7', 'puzzle'), tClimbs = w('L7', 'climbs'), t104 = w('L7', '104'), t105 = w('L7', '105'), t106 = w('L7', '106'), tSecond = w('L7', 'second');
const tFinal = w('L8', 'final'), tPartners = w('L8', 'partners'), tRandom = w('L8', 'random'), tEvery8 = w('L8', 'every'), tSwitched = w('L8', 'switched');
const tPartner9 = w('L9', 'partner'), tKai9 = w('L9', 'kai'), tFilters = w('L9', 'filters'), tDrop = w('L9', 'drop'), tBlank9 = w('L9', 'blank'), tLights = w('L9', 'lights'), tMental9 = w('L9', 'mental'), t12 = w('L9', '12');
const S1b = tMia1 - .1, S1c = tTheir - .1, S1d = tAnd1 - .1, S2b = tHe2 - .1, S3b = tIf - .1, S4b = tThree - .1, S4c = tWinner - .1, S5b = tTheo5 - .1, S5c = tCrowd - .1;
const S6b = tTheo6 - .1, S7b = tClimbs - .1, S7c = tSecond - .1, S8b = tPartners - .1, S9b = tFilters - .1, S9c = tBlank9 - .1;

// ---------------- helpers ----------------
const put = (p, v, ry = 0) => { p.P.visible = true; p.P.position.copy(v); p.P.rotation.set(0, ry, 0); p.P.updateMatrixWorld(true); };
const show = (...ps) => PROPS.forEach(o => o.visible = ps.includes(o));
const CAMP = new THREE.Vector3(0, 1.4, 6);
const headOf = p => { p.P.updateMatrixWorld(true); return p.head.getWorldPosition(V(0, 0, 0)); };
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
function onHand(p, o, left = 0, pos = [0, 0, 0], rot = [0, 0, 0]) { o.visible = true; (left ? p.aL : p.aR).props.add(o); o.position.set(...pos); o.rotation.set(...rot); }
function card(p, o = {}) { p.cs = { v: { ...p.v }, ...o }; }
let GLITCH = 0;
function reset() {
  CAST.forEach(p => { p.P.visible = false; p.cs = null; p.card.visible = false; });
  show(); for (const o of PROPS) { scene.add(o); o.rotation.set(0, 0, 0); }
  HEART.visible = false; HEART.userData.cs = null; GLITCH = 0;
}
function stepper(t, base, steps) { let v = base; const pop = []; for (const [t0, nv] of steps) { if (t >= t0) { const d = nv - v; v = nv; if (t - t0 < 1) pop.push({ d, a: (t - t0) / .9 }); } } return { v, pop }; }
const camAt = (pos, look, fov = 45, focus, aper = 4, roll = 0) => ({ pos, look, fov, focus: focus ?? pos.distanceTo(look), aper, roll });
const hand = (c, t, a = 1) => { c.pos.x += noise(t, 1) * .012 * a; c.pos.y += noise(t, 2) * .01 * a; c.look.x += noise(t, 3) * .02 * a; c.look.y += noise(t, 4) * .016 * a; return c; };
const kaiCard = (o = {}) => card(KAI, { hide: ['mh'], gold: 1, ...o });

// ---------------- places ----------------
const BEN = V(ST.bench, SW, -6.4), THB = BEN.clone().add(V(.36, 0, 0)), MIB = BEN.clone().add(V(-.36, 0, 0));
const KAIX = BEN.clone().add(V(-1.55, 0, .75)), MIAS = BEN.clone().add(V(-.75, 0, .62));
const KW = t => P3(lerp(-6, -2.2, seg(t, C2 - .2, C3 + .2)), -5.3);              // Kai's slow-motion strut down the sidewalk
const PRV = P3(ST.privacy + .9, -6.4);                                            // the privacy boutique's door
const STG = SP(SD.stage[0], SD.stage[1], 1.2), DESK = SP(SD.desk[0], SD.desk[1]);
const RX = t => lerp(-26, 6, seg(t, C6 - .4, S6b + .4));                         // the leaders down the home straight

const SHOTS = [
  // 1a · Theo is a 52.
  { t0: 0, t1: S1b, set: 'city', lt: SUNNY, at: BEN, act: t => act1(t),
    cam: (t, u) => hand(camAt(BEN.clone().add(V(lerp(.75, .6, u), lerp(1.4, 1.42, u), lerp(2.6, 2.2, eo(u)))), BEN.clone().add(V(.36, 1.62, 0)), 40, 2.4, 6), t) },
  // 1b · Mia is an 88.
  { t0: S1b, t1: S1c, set: 'city', lt: SUNNY, at: BEN, act: t => act1(t),
    cam: (t, u) => hand(camAt(BEN.clone().add(V(lerp(-.75, -.6, u), lerp(1.4, 1.42, u), lerp(2.6, 2.2, eo(u)))), BEN.clone().add(V(-.36, 1.62, 0)), 40, 2.4, 6), t) },
  // 1c · Their compatibility is zero.
  { t0: S1c, t1: S1d, set: 'city', lt: SUNNY, at: BEN, act: t => act1(t),
    cam: (t, u) => hand(camAt(BEN.clone().add(V(0, 1.36, lerp(2.2, 1.95, u))), BEN.clone().add(V(0, 1.55, 0)), 40, 2.0, 6), t, .6) },
  // 1d · And this is the guy she's 97% compatible with.
  { t0: S1d, t1: C2, set: 'city', lt: SUNNY, at: BEN, act: t => act1(t),
    cam: (t, u) => hand(camAt(V(lerp(3.4, 3.6, u), lerp(1.75, 1.8, u), lerp(-2.3, -2.6, eo(u))), V(5.2, 1.85, -6.0), 46, 3.7, 4), t) },
  // 2a · Kai. Overall 94. Strength 97. Athleticism 98.: the slow-motion strut, card glowing
  { t0: C2, t1: S2b, set: 'city', lt: SUNNY, at: P3(-4, -5.3), act: t => act2(t),
    after: 1, cam: (t, u) => { const p = KW(t); return hand(camAt(p.clone().add(V(lerp(2.9, 2.5, u), lerp(.95, 1.05, u), lerp(.5, .35, u))), p.clone().add(V(0, 2.0, 0)), 44, 2.9, 5), t, .6); } },
  // 2b · He won't shake hands with anyone under 80.: a 72 offers his hand… left hanging
  { t0: S2b, t1: C3, set: 'city', lt: SUNNY, at: P3(-2, -5.3), act: t => act2(t),
    after: 1, cam: (t, u) => { const p = KW(t); return hand(camAt(p.clone().add(V(.4, 1.65, 2.9)), p.clone().add(V(.55, 1.5, 0)), 44, 3.0, 4), t); } },
  // 3a · His EQ is 19. And one line on his card is blank.: close on his card
  { t0: C3, t1: S3b, set: 'city', lt: SUNNY, at: P3(-2, -5.3), act: t => act3(t),
    after: 1, cam: (t, u) => { const c0 = headOf(KAI).add(V(0, .231 + .07 + .465, 0)), k = eio(seg(t, C3, tBlank)); return hand(camAt(c0.clone().add(V(.05, lerp(.08, -.08, k), 1.75)), c0.clone().add(V(0, lerp(.05, -.22, k), 0)), 32, 1.75, 6), t, .5); } },
  // 3b · If you're rich enough, you can pay to hide one number.: the PRIVACY+ boutique; Kai strolls out with a bag
  { t0: S3b, t1: C4, set: 'city', lt: SUNNY, at: PRV, act: t => act3(t),
    cam: (t, u) => hand(camAt(PRV.clone().add(V(lerp(-1.2, -.9, u), lerp(1.75, 1.8, u), lerp(4.6, 4.0, eo(u)))), PRV.clone().add(V(-.5, 2.2, -.4)), 46, 4.3, 3), t) },
  // 4a · Every year the city holds The Ranking.: over the stands to the giant screen
  { t0: C4, t1: S4b, set: 'stadium', lt: STADIUM, at: SO, act: t => act4(t), fpv: .25,
    cam: (t, u) => { const k = eio(u); return camAt(SP(lerp(30, 18, k), lerp(-14, -6, k), lerp(26, 12, k)), SP(lerp(-20, -38, k), 0, lerp(10, 12, k)), 50, 40, .5, lerp(.04, 0, k)); } },
  // 4b · Three rounds, live on TV.: the TV camera, its red light on
  { t0: S4b, t1: S4c, set: 'stadium', lt: STADIUM, at: STG, act: t => act4(t),
    cam: (t, u) => { const c = STAD.userData.tvcam.getWorldPosition(V()); return hand(camAt(c.clone().add(V(lerp(1.6, 1.3, u), 1.75, lerp(-1.6, -1.2, u))), c.clone().add(V(-.2, 1.65, .2)), 40, 2.0, 6), t); } },
  // 4c · The winner's card turns gold, and gold outranks every number.: the gold card trophy
  { t0: S4c, t1: C5, set: 'stadium', lt: STADIUM, at: STG, act: t => act4(t),
    cam: (t, u) => { const c = STAD.userData.trophy.getWorldPosition(V()).add(V(0, 1.8, 0)); return hand(camAt(c.clone().add(V(lerp(4.0, 2.8, eo(u)), lerp(-.6, -.3, u), lerp(1.4, .9, u))), c, 40, 3.4, 5), t, .6); } },
  // 5a · Kai has won twice.: Kai on stage, arms up; the screen: 2× CHAMPION
  { t0: C5, t1: S5b, set: 'stadium', lt: STADIUM, at: STG, act: t => act5(t),
    cam: (t, u) => hand(camAt(STG.clone().add(V(lerp(7.5, 6.8, u), lerp(.8, .9, u), lerp(-2.5, -2.0, u))), STG.clone().add(V(0, 3.0, 1.0)), 48, 7, 2), t) },
  // 5b · Theo signs up to close the gap.
  { t0: S5b, t1: S5c, set: 'stadium', lt: STADIUM, at: DESK, act: t => act5(t),
    cam: (t, u) => hand(camAt(DESK.clone().add(V(lerp(1.6, 1.3, u), lerp(1.55, 1.58, u), lerp(2.6, 2.2, eo(u)))), DESK.clone().add(V(.2, 1.45, .5)), 42, 2.5, 5), t) },
  // 5c · The crowd laughs at his number.: the stands crack up; the screen shows THEO · 52
  { t0: S5c, t1: C6, set: 'stadium', lt: STADIUM, at: SP(0, 24), act: t => act5(t),
    cam: (t, u) => hand(camAt(SP(lerp(4, 2, u), lerp(2.2, 2.4, u), 25.2), SP(-6, 4.5, 33), 46, 9, 1.2), t, 1.2) },
  // 6a · Round one, the race. Kai first.: tracking alongside the leaders; he breaks the tape
  { t0: C6, t1: S6b, set: 'stadium', lt: STADIUM, at: SP(0, 21), act: t => act6(t),
    cam: (t, u) => { const x = Math.min(RX(t), 3); return hand(camAt(SP(x + 2.6, 15.6, 1.5), SP(x - .3, 20.8, 1.3), 44, 5.5, 3), t, 1.4); } },
  // 6b · Theo dead last.: he staggers in, way behind
  { t0: S6b, t1: C7, set: 'stadium', lt: STADIUM, at: SP(0, 21), act: t => act6(t),
    cam: (t, u) => hand(camAt(SP(lerp(-6.5, -5.5, u), 16.2, 1.45), SP(lerp(-10.5, -9, u), 22.2, 1.35), 42, 5.8, 4), t, 1.1) },
  // 7a · Round two, the puzzle.: the desks on the infield
  { t0: C7, t1: S7b, set: 'stadium', lt: STADIUM, at: SP(-1, -2), act: t => act7(t),
    cam: (t, u) => hand(camAt(SP(lerp(-12, -9, u), 3.2, lerp(5, 4.5, u)), SP(-1, .9, -2), 44, 10, 1.5), t) },
  // 7b · Theo's IQ climbs live on screen. 104. 105. 106.
  { t0: S7b, t1: S7c, set: 'stadium', lt: STADIUM, at: SP(-1, -2), act: t => act7(t),
    cam: (t, u) => hand(camAt(SP(SD.desks[2][0] + lerp(.3, .2, u), SD.desks[2][1] + lerp(2.3, 1.9, eo(u)), 1.78), SP(SD.desks[2][0], SD.desks[2][1] - .6, 1.75), 42, 2.3, 5), t) },
  // 7c · Second place.: the screen
  { t0: S7c, t1: C8, set: 'stadium', lt: STADIUM, at: STG, act: t => act7(t),
    cam: (t, u) => hand(camAt(SP(-22 + u * 1.5, 6, 0), SP(-44, 13, 0), 46, 22, .5), t, .5) },
  // 8a · Then the final is announced.: the host at the podium
  { t0: C8, t1: S8b, set: 'stadium', lt: STADIUM, at: STG, act: t => act8(t),
    cam: (t, u) => { const p = STAD.userData.podium.getWorldPosition(V()); return hand(camAt(p.clone().add(V(lerp(3.2, 2.7, u), 1.4, lerp(1.2, 1.0, u))), p.clone().add(V(-.1, 1.7, .5)), 42, 3.1, 4), t); } },
  // 8b · Partners are random, and every hidden number gets switched off.: the wall, the screen
  { t0: S8b, t1: C9, set: 'stadium', lt: STADIUM, at: SP(0, 0), act: t => act8(t),
    cam: (t, u) => hand(camAt(SP(lerp(-2, -6, eo(u)), lerp(2.5, 3.5, u), lerp(14, 16, u)), SP(lerp(10, -30, eio(seg(t, tEvery8 - .6, tSwitched))), lerp(5, 9, u), lerp(-6, 0, u)), 52, 20, .5), t) },
  // 9a · Theo's partner? Kai.: the screen spins the names… THEO + KAI
  { t0: C9, t1: S9b, set: 'stadium', lt: STADIUM, at: SP(0, 0), act: t => act9(t),
    cam: (t, u) => t < tKai9 + .25 ? hand(camAt(SP(-26, 5.5, 0), SP(-44, 12.5, 0), 40, 18, .5), t, .5) : hand(camAt(SP(1.2, 1.55, 3.4), SP(.15, 1.6, 0), 44, 3.3, 4), t) },
  // 9b · The filters drop.: every card in the place glitches
  { t0: S9b, t1: S9c, set: 'stadium', lt: STADIUM, at: SP(0, 0), act: t => act9(t),
    cam: (t, u) => hand(camAt(SP(lerp(1.6, 1.3, u), 1.75, lerp(4.2, 3.8, u)), SP(.2, 1.95, 0), 46, 4.0, 3), t) },
  // 9c · Kai's blank line lights up. Mental health: 12.: push into his card
  { t0: S9c, t1: LOOP, set: 'stadium', lt: STADIUM, at: SP(0, 0), act: t => act9(t),
    after: 1, cam: (t, u) => { const c0 = headOf(KAI).add(V(0, .231 + .07 + .465, 0)), k = eio(seg(t, S9c, t12)); return hand(camAt(c0.clone().add(V(lerp(.5, .04, k), lerp(-.5, -.2, k), lerp(3.0, 1.55, k))), c0.clone().add(V(0, lerp(-.35, -.25, k), 0)), lerp(42, 32, k), lerp(3.0, 1.55, k), 6), t, .5); } },
];
SHOTS.push({ ...SHOTS[0], t0: LOOP, t1: DUR + 1, loop: 1 });

// ---------------- acting ----------------
function benchPair(t, theoFace = 'happy', miaFace = 'smile') {
  put(THEO, THB, -.35); put(MIA, MIB, .35);
  apply(THEO, { ...TP.sit, y: -.06 }, { t, seed: 1, face: theoFace, look: headOf(MIA) }); apply(MIA, { ...TP.sit, y: -.06 }, { t, seed: 4, face: miaFace, look: headOf(THEO) });
}
function act1(t) {
  reset();
  if (t < S1d) {
    benchPair(t, t < S1b ? 'smile' : 'happy', 'smile');
    card(THEO, { s: t < S1b ? .78 : .45, mini: t >= S1b }); card(MIA, { s: t >= S1b && t < S1c ? .78 : .45, mini: !(t >= S1b && t < S1c) });
    if (t >= S1c) { HEART.visible = true; HEART.userData.cs = { st: { pct: 0, fill: 1, crack: 1, show: seg(t, S1c, S1c + .25) }, at: headOf(THEO).lerp(headOf(MIA), .5).add(V(0, .42, .1)), s: 1 }; }
    return;
  }
  // Kai strides in; the heart between him and Mia fills to 97 and glows
  const k = eo(seg(t, S1d - .4, t97a - .4)), kp = KAIX.clone().add(V(lerp(-2.2, 0, k), 0, 0));
  put(KAI, kp, face(kp, MIAS)); apply(KAI, k < 1 ? walk(TP.stand, t * 6, .8) : TP.hips, { t, seed: 6, face: 'smug', look: headOf(MIA) });
  put(MIA, MIAS, face(MIAS, KAIX)); apply(MIA, TP.stand, { t, seed: 4, face: 'calm', look: headOf(KAI) });
  put(THEO, THB, -.2); apply(THEO, { ...TP.slump, y: -.06 }, { t, seed: 1, face: 'worried', look: headOf(MIA), eyes: [-.3, -.4] });
  const hs = seg(t, t97a - .7, t97a - .45), fill = seg(t, t97a - .45, t97a + .05);
  if (hs > 0) { HEART.visible = true; HEART.userData.cs = { st: { pct: 97, fill, glow: fill, show: hs }, at: headOf(KAI).lerp(headOf(MIA), .5).add(V(0, .5, .2)), s: 1.1 }; }
  kaiCard({ s: .7 }); card(MIA, { s: .45, mini: 1 }); card(THEO, { s: .45, mini: 1 });
}
function act2(t) {
  reset();
  // the strut, in slow motion; his card lights the stats as they're read
  const p = KW(t); put(KAI, p, Math.PI / 2 + .25); apply(KAI, walk({ ...TP.stand, sp: [-6, 0, 0], hd: [-6, 0, 0] }, t * 3.2, .9), { t, seed: 6, face: 'smug', look: CAMP });
  const hl = t > tAth - .1 ? 'ath' : t > tStr - .1 ? 'str' : null;
  kaiCard({ hl, s: t < S2b ? .9 : .75 });
  if (t >= S2b) {   // a 72 holds out his hand; Kai sails past it
    const sp = P3(-1.3, -6.2); put(SHAKE, sp, face(sp, p)); const offered = t > tShake - .4;
    apply(SHAKE, offered ? { ...TP.offer, aR: [-82, 6, 0, 12] } : TP.stand, { t, seed: 31, face: t > t80 ? 'worried' : 'happy', look: headOf(KAI) }); card(SHAKE, { s: 1.2 });
    KAI.P.rotation.y = Math.PI / 2 + .1; apply(KAI, walk({ ...TP.stand, sp: [-6, 0, 0], hd: [-6, -25, 0], aL: [-40, 50, 0, 60] }, t * 3.2, .9), { t, seed: 6, face: 'smug', look: CAMP });
  }
}
function act3(t) {
  reset();
  if (t < S3b) {   // close on the card: EQ 19, then the blank line
    const p = KW(C3 + .2); put(KAI, p, .2); apply(KAI, TP.hips, { t, seed: 6, face: 'smug', look: CAMP });
    kaiCard({ hl: t > tLine - .2 ? 'mh' : t > tEQ - .1 ? 'eq' : null, s: 1 }); return;
  }
  // out of the PRIVACY+ door with a shopping bag
  const k = eo(seg(t, S3b, S3b + 1.4)), p = PRV.clone().add(V(lerp(0, -.9, k), 0, lerp(-.3, 1.0, k)));
  put(KAI, p, lerp(.3, -.4, k)); apply(KAI, walk(TP.stand, t * 6, .8), { t, seed: 6, face: 'smug', look: CAMP }); onHand(KAI, BAG, 0, [0, -.05, .04]);
  kaiCard({ s: .62, hl: 'mh' });
}
function act4(t) {
  reset(); STAD.userData.cheer(t, .4);
  const red = STAD.userData.tally; red.material.color.set(Math.sin(t * 6) > 0 ? '#FF2A2A' : '#5A1010');
  const gc = STAD.userData.trophy.children[1]; gc.rotation.y = Math.PI / 2 + Math.sin(t * .8) * .25;
}
function act5(t) {
  reset(); STAD.userData.cheer(t, t >= S5c ? 1 : .5);
  if (t < S5b) { put(KAI, STG.clone().add(V(1.2, 0, 1.0)), Math.PI / 2); apply(KAI, TP.cheer, { t, seed: 6, face: 'smug', look: CAMP }); kaiCard({ s: .8 }); return; }
  if (t < S5c) {   // Theo signs; the clerk reads his 52
    put(THEO, DESK.clone().add(V(0, 0, .75)), Math.PI); apply(THEO, { ...TP.stand, sp: [18, 0, 0], hd: [14, 0, 0], aR: [-60, 6, 0, 56] }, { t, seed: 1, face: 'proud', look: DESK.clone().add(V(.3, .8, 0)), eyes: [0, -.6] }); onHand(THEO, PEN, 0, [0, -.04, .05], [.5, 0, 0]);
    put(CLERK, DESK.clone().add(V(-.4, 0, -.55)), 0); apply(CLERK, TP.stand, { t, seed: 32, face: t > tSigns + .2 ? 'smug' : 'calm', look: headOf(THEO).add(V(0, .6, 0)) });
    card(THEO, { s: .7 }); card(CLERK); return;
  }
  // front-row fans laughing and pointing at the screen
  FAN.forEach((p, i) => { const v = SP(-3.5 - i * 1.1, 33.2 + (i % 2) * .5, 3.2 + (i % 2) * .5); put(p, v, face(v, SP(-44, 0, 0)) + .5); apply(p, i === 1 ? TP.point : TP.cheer, { t, seed: 50 + i, face: 'laugh', look: SP(-44, 12, 0) }); card(p); });
}
function act6(t) {
  reset(); STAD.userData.cheer(t, 1);
  const x = RX(t), lanes = SD.lanes;
  // Kai leads, the pack behind; Theo way back in the last lane
  put(KAI, SP(x, lanes[2]), Math.PI / 2); apply(KAI, walk({ ...TP.stand, sp: [12, 0, 0], aL: [-30, 12, 0, 90], aR: [-30, 12, 0, 90] }, t * 14, 1.6), { t, seed: 6, face: t > tFirst ? 'laugh' : 'smug', look: CAMP }); KAI.P.position.y = SO.y + Math.abs(Math.sin(t * 14)) * .07;
  kaiCard({ s: .6 });
  RUN.forEach((p, i) => { const rx = x - 1.4 - i * .9 - Math.sin(t * 3 + i) * .2; put(p, SP(rx, lanes[[0, 1, 3, 4][i]]), Math.PI / 2); apply(p, walk({ ...TP.stand, sp: [12, 0, 0], aL: [-30, 12, 0, 90], aR: [-30, 12, 0, 90] }, t * 14 + i, 1.5), { t, seed: 40 + i, face: 'angry', look: CAMP }); card(p, { s: .9 }); });
  const tx = Math.min(-9 + (t - C6) * 2.4, -2), tp = SP(tx, lanes[4] + .2);
  put(THEO, tp, Math.PI / 2 - .1); apply(THEO, walk({ ...TP.stand, sp: [24, 0, 0], hd: [8, 0, 0], aL: [-10, 18, 0, 30], aR: [-10, 18, 0, 30] }, t * 9, 1.0), { t, seed: 1, face: 'worried', look: CAMP }); card(THEO, { s: .7, mini: t < S6b });
  // the tape: across the finish until Kai breaks it
  TAPE.visible = true; TAPE.position.copy(SP(SD.finish, 21, 1.15)); TAPE.rotation.set(0, 0, 0);
  if (x > SD.finish - .3) { TAPE.position.x = SO.x + SD.finish + Math.min(.8, (x - SD.finish) * .3); TAPE.scale.z = .4; } else TAPE.scale.z = 1;
}
function act7(t) {
  reset(); STAD.userData.cheer(t, .5);
  // five contestants stacking blocks; Theo at the middle desk, his IQ ticking up live
  const order = [RUN[0], RUN[1], THEO, KAI, RUN[2]];
  order.forEach((p, i) => { const [dx, dz] = SD.desks[i], v = SP(dx, dz + .65); put(p, v, Math.PI); const k = Math.sin(t * (5 + i)) * .5 + .5;
    apply(p, { ...TP.stand, sp: [16, 0, 0], hd: [18, 0, 0], aL: [-62 - 10 * k, 12, 0, 70], aR: [-62 - 10 * (1 - k), 12, 0, 70] }, { t, seed: 40 + i, face: p === THEO ? (t > t106 ? 'proud' : 'deadpan') : 'angry', look: SP(dx, .9, dz), eyes: [0, -.6] });
    STAD.userData.desks[i].userData.blocks.forEach((b, j) => { const up = seg(t, C7 + .2 + j * .5 + i * .13, C7 + .5 + j * .5 + i * .13); b.position.set(-.4 + (j % 3) * .18 + up * (.4 - (j % 3) * .18), .83 + up * (j * .14), -.15 + Math.floor(j / 3) * .2 - up * (Math.floor(j / 3) * .2 - .15)); });
    if (p !== THEO && p !== KAI) card(p, { s: .8 }); });
  const iq = stepper(t, 104, [[t104, 104], [t105, 105], [t106, 106]]);
  card(THEO, { v: { ...THEO.v, iq: iq.v }, hl: t > tClimbs - .2 ? 'iq' : null, pop: iq.pop.filter(p => p.d).map(x => ({ k: 'iq', ...x })), s: t >= S7b && t < S7c ? .75 : .6 });
  kaiCard({ s: .6 });
}
function act8(t) {
  reset(); STAD.userData.cheer(t, .6);
  const p = STAD.userData.podium.getWorldPosition(V()); put(HOST, p.clone().add(V(-.15, 0, .55)), Math.PI / 2 + .3);
  apply(HOST, TP.speech ?? TP.wave, { t, seed: 30, face: 'happy', look: CAMP, talk: .5 + .5 * Math.sin(t * 20) }); onHand(HOST, MIC, 0, [0, .02, .06], [-.4, 0, 0]); card(HOST);
}
function act9(t) {
  reset(); STAD.userData.cheer(t, t < tDrop ? .8 : .2);
  // the two partners on the infield, side by side, staring at the screen; then at each other
  const tp = SP(.65, 0), kp = SP(-.45, -.2); put(THEO, tp, -Math.PI / 2 - .4); put(KAI, kp, -Math.PI / 2 + .3);
  const look2 = t > tKai9 + .3;
  apply(THEO, TP.stand, { t, seed: 1, face: t > tKai9 ? 'shock' : 'worried', look: look2 ? headOf(KAI) : SP(-44, 13, 0) });
  apply(KAI, t > tLights ? TP.stand : TP.cross, { t, seed: 6, face: t > t12 - .1 ? 'shock' : t > tKai9 ? 'angry' : 'smug', look: look2 ? (t > tLights ? CAMP : headOf(THEO)) : SP(-44, 13, 0) });
  GLITCH = t >= tDrop - .05 && t < tDrop + .5 ? 1 - (t - tDrop + .05) / .55 : 0;
  const rev = t >= tLights - .05;
  card(THEO, { s: t < S9c ? .6 : .45 });
  kaiCard({ hide: rev ? [] : ['mh'], hl: rev ? 'mh' : null, v: { ...KAI.v, mh: 12 }, s: t < S9c ? .6 : 1, flash: rev ? (Math.sin(t * 14) > 0 ? 1 : 0) : 0 });
}

// ---------------- the giant screen ----------------
function screenState(t) {
  if (t < C4) return null;
  if (t < C5) return t > tLiveTV - .2 ? { mode: 'rounds' } : { mode: 'logo' };
  if (t < S5c) return { mode: 'champ' };
  if (t < C6) return { mode: 'laugh' };
  if (t < C7) return { mode: 'race', k: seg(t, tFirst - .1, tLast + .3) };
  if (t < C8) return { mode: 'puzzle', iq: t >= t106 ? 106 : t >= t105 ? 105 : 104, second: t >= tSecond - .1 };
  if (t < C9) return { mode: 'final', a: t > tPartners - .2, b: t > tSwitched - .2 };
  return { mode: 'slot', land: t >= tKai9 - .05, n: Math.floor(t * 12), off: t >= tDrop - .05 };
}
function drawScreen(st) {
  const S = STAD.userData.screen, key = JSON.stringify(st); if (key === S.key) return; S.key = key; const g = S.ctx, w = 1280, h = 720;
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#1E2238'); bg.addColorStop(1, '#0E1018'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const T = (txt, y, size, col = '#FFFFFF', x = w / 2) => { g.font = `900 ${size}px Montserrat`; g.fillStyle = col; g.fillText(txt, x, y); };
  const pill = (x, y, n, r = 80) => { g.fillStyle = tier(n); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = '#16131A'; g.font = `900 ${r}px Montserrat`; g.fillText(String(n), x, y + 6); };
  if (!st || st.mode === 'logo') { g.fillStyle = '#FFC83A'; g.beginPath(); g.roundRect(240, 160, 800, 400, 60); g.fill(); g.fillStyle = '#16131A'; g.beginPath(); g.roundRect(260, 180, 760, 360, 50); g.fill(); T('THE', 280, 90, '#FFC83A'); T('RANKING', 420, 170, '#FFFFFF'); }
  else if (st.mode === 'rounds') { T('3 ROUNDS', 170, 120, '#FFC83A'); ['RACE', 'PUZZLE', 'FINAL'].forEach((r, i) => { const x = 260 + i * 380; g.fillStyle = '#2E3248'; g.beginPath(); g.roundRect(x - 160, 300, 320, 220, 30); g.fill(); T(String(i + 1), 370, 90, '#FFC83A', x); T(r, 470, 56, '#FFFFFF', x); }); g.fillStyle = '#E8423A'; g.beginPath(); g.arc(1150, 80, 22, 0, 7); g.fill(); T('LIVE', 80, 44, '#E8423A', 1060); }
  else if (st.mode === 'champ') { pill(330, 360, 94, 150); T('KAI', 280, 150, '#FFC83A', 840); T('2× CHAMPION', 440, 80, '#FFFFFF', 840); }
  else if (st.mode === 'laugh') { pill(380, 360, 52, 150); T('THEO', 290, 150, '#FFFFFF', 860); T('JOINED', 450, 80, '#FF9A2A', 860); T('HA HA HA', 640, 60, '#C8CCE0'); }
  else if (st.mode === 'race') { T('ROUND 1 · RACE', 90, 70, '#FFC83A'); [['KAI', 94], ['RUNNER', 88], ['RUNNER', 86], ['RUNNER', 83], ['RUNNER', 79], ['THEO', 52]].forEach(([n, v], i) => { const y = 190 + i * 88, a = st.k * 6 - i; if (a <= 0) return; g.globalAlpha = Math.min(1, a); T(`${i + 1}.`, y, 60, '#C8CCE0', 260); g.textAlign = 'left'; g.font = '900 60px Montserrat'; g.fillStyle = n === 'THEO' ? '#FF9A2A' : n === 'KAI' ? '#FFC83A' : '#FFFFFF'; g.fillText(n, 340, y); g.textAlign = 'center'; g.globalAlpha = 1; }); }
  else if (st.mode === 'puzzle') { T('ROUND 2 · PUZZLE', 90, 70, '#FFC83A'); T('THEO · IQ', 260, 80, '#FFFFFF'); T(String(st.iq), 430, 220, '#4ADB6A'); if (st.second) { g.fillStyle = '#C8CCE0'; g.beginPath(); g.roundRect(390, 560, 500, 110, 30); g.fill(); T('2ND PLACE', 617, 70, '#16131A'); } }
  else if (st.mode === 'final') { T('THE FINAL', 150, 130, '#FFC83A'); if (st.a) T('PARTNERS: RANDOM', 340, 80, '#FFFFFF'); if (st.b) { g.fillStyle = '#E8423A'; g.beginPath(); g.roundRect(240, 450, 800, 130, 30); g.fill(); T('ALL FILTERS: OFF', 517, 76, '#FFFFFF'); } }
  else if (st.mode === 'slot') { T('PARTNERS', 110, 80, '#FFC83A'); const names = ['MIA', 'RUNNER', 'KAI', 'THEO', 'HOST', 'ZOE', 'MAX'];
    const a = st.land ? 'THEO' : names[st.n % names.length], b = st.land ? 'KAI' : names[(st.n * 3 + 2) % names.length];
    T(a, 340, 140, '#FFFFFF', 340); T('+', 340, 140, '#FFC83A'); T(b, 340, 140, '#FFFFFF', 940); if (st.land) { g.strokeStyle = '#FFC83A'; g.lineWidth = 12; g.beginPath(); g.roundRect(120, 240, 1040, 200, 40); g.stroke(); }
    if (st.off) { g.fillStyle = '#E8423A'; g.beginPath(); g.roundRect(240, 520, 800, 120, 30); g.fill(); T('FILTERS OFF', 582, 76, '#FFFFFF'); } }
  S.tex.needsUpdate = true;
}

// ---------------- sound events (the score reads these) ----------------
ev(0, 'street', { d: C4 }); ev(.05, 'boom'); ev(t52, 'pop'); ev(t88, 'pop'); ev(tZero, 'crack'); ev(t97a, 'sparkle');
ev(C2, 'whoosh'); ev(t94, 'pop'); ev(tStr, 'tick', { n: 0 }); ev(tAth, 'tick', { n: 2 }); ev(t80, 'error');
ev(tEQ, 'down'); ev(tBlank, 'blip'); ev(S3b, 'whoosh'); ev(tHide, 'ok');
ev(C4 - .05, 'whoosh'); ev(C4, 'stadium', { d: C9 - C4 + 4 }); ev(tRanking, 'hit'); ev(tGold, 'sparkle');
ev(tTwice, 'ok'); ev(tSigns, 'scribble'); ev(tLaughs - .1, 'laughter', { d: 1.6 });
ev(tRace - .1, 'gun'); ev(C6, 'steps', { d: S6b - C6 }); ev(tFirst, 'cheer'); ev(tLast, 'shrug');
ev(C7, 'whoosh'); [t104, t105, t106].forEach(x => ev(x, 'up')); ev(tSecond, 'ok');
ev(C8, 'hit'); ev(tPartners, 'pop'); ev(tSwitched, 'error');
ev(C9, 'spin', { d: tKai9 - C9 }); ev(tKai9, 'hit'); ev(tDrop - .05, 'glitch'); ev(tLights, 'alarm'); ev(t12, 'hit2'); ev(LOOP - 1.2, 'sting');
// ---------------- the overlay: telops + 1–3 word captions ----------------
const ov = document.getElementById('ov').getContext('2d');
const TEL = [
  { t0: t80 - .05, t1: C3, text: 'HANDSHAKES: 80+ ONLY', y: 300, size: 84, col: '#FFFFFF', rot: -4, plate: '#C8283A' },
  { t0: tHide - .3, t1: C4, text: 'HIDE 1 STAT: $9,999/MO', y: 300, size: 78, col: '#FFD24A', rot: -3, plate: '#16131A' },
  { t0: tOutranks - .05, t1: C5, text: 'GOLD > 99', y: 300, size: 150, col: '#FFC83A', rot: -5, plate: '#16131A' },
  { t0: tRace - .1, t1: S6b, text: 'ROUND 1: THE RACE', y: 300, size: 92, col: '#FFFFFF', rot: -3, plate: '#2E7FE0' },
  { t0: tLast - .05, t1: C7, text: 'DEAD LAST', y: 300, size: 140, col: '#E8423A', rot: -6, stamp: 1 },
  { t0: tPuzzle - .1, t1: S7b, text: 'ROUND 2: THE PUZZLE', y: 300, size: 88, col: '#FFFFFF', rot: -3, plate: '#9A6AC8' },
  { t0: tKai9 - .05, t1: S9b, text: 'THEO + KAI', y: 300, size: 140, col: '#FFD23F', rot: -5, plate: '#16131A' },
  { t0: t12 - .05, t1: LOOP, text: 'MENTAL HEALTH: 12', y: 1500, size: 100, col: '#FFFFFF', rot: -4, plate: '#C8283A' },
  { t0: LOOP - 1.0, t1: LOOP, text: 'PART 3 →', y: 300, size: 150, col: '#FFD23F', rot: -5 },
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
    mesh.userData.draw(pill ? { v: p.cs.v } : { v: p.cs.v, show: p.cs.show, hide: p.cs.hide, pop: p.cs.pop, hl: p.cs.hl, gold: p.cs.gold, flash: p.cs.flash });
    const s = p.cs.s ?? 1, hh = (pill ? .21 : .93) * s;
    mesh.visible = true; mesh.scale.setScalar(s); mesh.quaternion.copy(_q);
    mesh.position.copy(headOf(p)).add(V(0, .21 * p.H + .07 + hh / 2, 0));
    if (GLITCH > 0) { const j = GLITCH * .06; mesh.position.x += (hash(p.P.id + Math.floor(GLITCH * 40)) - .5) * j; mesh.position.y += (hash(p.P.id * 3 + Math.floor(GLITCH * 40)) - .5) * j; mesh.visible = hash(p.P.id + Math.floor(GLITCH * 30)) > GLITCH * .5; }
  }
  if (HEART.visible && HEART.userData.cs) { const c = HEART.userData.cs; HEART.userData.draw(c.st); HEART.position.copy(c.at); HEART.quaternion.copy(_q); HEART.scale.setScalar(c.s ?? 1); }
}
function frame(sh, t) {
  const tt = sh.loop ? 0 : t, u = sh.loop ? 0 : seg(t, sh.t0, sh.t1);
  light(sh.lt, sh.at); CITY.visible = sh.set === 'city'; STAD.visible = sh.set === 'stadium';
  const sst = screenState(tt); if (sh.set === 'stadium') drawScreen(sst);
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
  if (QS.get('poster')) { ov.clearRect(0, 0, W, H); [['HIS HIDDEN STAT', 170, -4, '#FFFFFF', 110], ['MENTAL HEALTH: 12', 300, -4, '#E8423A', 96]].forEach(([text, y, rot, col, size]) => drawTelop({ t0: -9, text, y, size, col, rot }, t)); return; }
  if (QS.get('clean')) return;
  if (t < LOOP) { if (GLITCH > 0) { ov.fillStyle = 'rgba(255,255,255,' + (GLITCH * .5) + ')'; ov.fillRect(0, 0, W, H); for (let i = 0; i < 14; i++) { ov.fillStyle = i % 2 ? 'rgba(255,40,80,.35)' : 'rgba(40,220,255,.35)'; ov.fillRect(0, hash(i + Math.floor(t * 30)) * H, W, 6 + hash(i * 7) * 30 * GLITCH); } }
    TEL.forEach(x => { if (t >= x.t0 && t < x.t1) drawTelop(x, t); }); drawCaption(t); }
}
function texts(t) { if (t >= LOOP) return []; return TEL.filter(x => typeof x.text === 'string' && t >= x.t0 + .3 && t < x.t1).map(x => ({ id: x.text, text: x.text, x0: 60, y0: x.y - x.size * .7, x1: 1020, y1: x.y + x.size * .7 })); }
EV.sort((a, b) => a.t - b.t);
window.DUR = +(B0 - A0).toFixed(3); window.EV = EV; window.render = t => render(t + A0); window.TEXTS = t => texts(t + A0);
render(A0);
window.READY = true;
