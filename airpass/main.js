// "The Unlimited Flight Pass" · 3D vertical Short (1080×1920), v4 toon style.
// In 1987 Steven Rothstein paid about $250,000 for a lifetime pass: unlimited first-class flights, forever; two years later
// $150,000 more for a companion seat. He flew more than 10,000 flights, to London over and over, and gave the extra seat to
// strangers. The airline did the math; in 2008, at the gate for London, his pass was cancelled. They accused him of booking
// thousands of seats that went empty; he sued for $7 million. On-screen branding is generic ("SKYLINE"); the narration says
// "the airline". Every shot, action, telop and caption is placed from timing.json (the voice). render(t) is pure in t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makePost } from '/core/three/post.js';
import { makeToon, apply, TP, mix, walk, TM, G } from './toon.js';
import { counter, terminal, boardroom, court, passCard } from './sets_pass.js';
import { cabin, calculator } from './sets_pud.js';
import { bench, seal, gavel, folder, cashStack } from './sets_pep.js';
import { airliner, sky as skySet } from './sets_lawn.js';
import { skyDome } from './sky.js';

const W = 1080, H = 1920;
await document.fonts.load('900 80px Montserrat'); await document.fonts.load('800 80px Montserrat'); await document.fonts.load('700 80px Fredoka');
const TMJ = await (await fetch('timing.json')).json();
const B = 60 / TMJ.bpm, DUR = TMJ.dur, LOOP = DUR - B;
const LN = Object.fromEntries(TMJ.lines.map(l => [l.id, l]));
const nrm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const w = (lid, word, k = 0) => { const ws = LN[lid].words.filter(x => nrm(x.w).startsWith(nrm(word))); return (ws[k] || ws[ws.length - 1] || { t0: LN[lid].t0 }).t0; };
const cut = id => { const i = TMJ.lines.findIndex(l => l.id === id), pv = TMJ.lines[i - 1], l = LN[id];
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
const camera = new THREE.PerspectiveCamera(45, W / H, .03, 3000);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, ao: false });
post.bloom.strength = .2; post.bloom.threshold = .95; post.bloom.radius = .5;
const vg = post.vig.uniforms; vg.amt.value = .22; vg.sat.value = 1.2; vg.contrast.value = .12;
const sun = new THREE.DirectionalLight('#FFF4E0', 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
scene.add(sun, sun.target); const hemi = new THREE.HemisphereLight('#BFDFFF', '#4A6A2A', 1); scene.add(hemi);
const sky = skyDome('#2A78E0', '#E8E2D6', V(-.4, .5, .6), '#FFF6D8'); scene.add(sky);
const SUNNY = { pos: [-18, 30, 26], col: '#FFF1DA', int: 2.6, hs: '#C8E0FF', hg: '#A89A80', hemi: 1.15, fog: ['#CFE4F2', 90, 520], sky: ['#2A78E0', '#E4EEF2', [-.4, .5, .6], '#FFF6D8'], env: .45, r: 14, warm: .12 };
const HIGH = { pos: [-20, 30, 24], col: '#FFFFFF', int: 3.2, hs: '#D8ECFF', hg: '#E8F0F8', hemi: 1.2, fog: ['#BFD8F0', 120, 900], sky: ['#0E4AB8', '#9CC8F0', [-.4, .45, .6], '#FFFFFF'], env: .4, r: 14, warm: 0 };
const INSIDE = { pos: [-4, 9, 7], col: '#FFF4E0', int: 2.0, hs: '#FFF8EC', hg: '#B8A890', hemi: 1.15, env: .55, r: 9, bg: '#DCD8D0', warm: .1 };
const CABIN = { pos: [6, 4, 6], col: '#FFFFFF', int: 2.2, hs: '#E8F4FF', hg: '#9AA0B0', hemi: 1.1, env: .5, r: 6, bg: '#E8F0F8', warm: .06 };
const BOARD = { pos: [-4, 9, 7], col: '#F4F8FF', int: 1.6, hs: '#DCE4F0', hg: '#5A5E6A', hemi: 1.0, env: .5, r: 8, bg: '#2A2C34', warm: 0 };
const COURT = { pos: [-4, 9, 7], col: '#FFE2B8', int: 1.8, hs: '#FFE8C8', hg: '#6A4A30', hemi: .9, env: .4, r: 8, bg: '#3A2818', warm: .2 };
function light(o, at) {
  sun.color.set(o.col); sun.intensity = o.int; sun.position.set(at.x + o.pos[0], at.y + o.pos[1], at.z + o.pos[2]); sun.target.position.copy(at);
  const c = sun.shadow.camera, r = o.r ?? 10; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 1; c.far = 200; c.updateProjectionMatrix();
  hemi.color.set(o.hs); hemi.groundColor.set(o.hg); hemi.intensity = o.hemi;
  scene.fog = o.fog ? new THREE.Fog(o.fog[0], o.fog[1], o.fog[2]) : null;
  if (o.sky) { sky.visible = true; scene.background = null; const u = sky.material.uniforms; u.top.value.set(o.sky[0]); u.hor.value.set(o.sky[1]); u.sd.value.set(...o.sky[2]).normalize(); u.sc.value.set(o.sky[3]); }
  else { sky.visible = false; scene.background = new THREE.Color(o.bg ?? '#2A2A30'); }
  scene.environmentIntensity = o.env ?? .35; vg.warm.value = o.warm ?? .1;
}

// ---------------- the sets (each far from the others) ----------------
const CNT = counter(); scene.add(CNT);
const TRO = V(900, 0, 0), TRM = terminal(); TRM.position.copy(TRO); scene.add(TRM);
const CBO = V(-900, 0, 0), CAB = cabin(); CAB.position.copy(CBO); scene.add(CAB);
const BRO = V(0, 0, 900), BRD = boardroom(); BRD.position.copy(BRO); scene.add(BRD);
const CRO = V(0, 0, -900), CRT = court(); CRT.position.copy(CRO); scene.add(CRT);
const SKO = V(0, 1200, 0), SKY = skySet(); SKY.position.copy(SKO); scene.add(SKY);
{ const b = bench(); b.position.set(0, 0, -2.4); CRT.add(b); const sl = seal(); sl.position.set(0, 3.0, -3.28); sl.scale.setScalar(1.1); CRT.add(sl); const gv = gavel(); gv.position.set(.6, 1.5, -2.2); gv.rotation.z = Math.PI / 2; CRT.add(gv); }
{ const wl = new THREE.Mesh(new THREE.BoxGeometry(20, 6, .2), new THREE.MeshStandardMaterial({ color: '#E4E8EE', roughness: 1 })); wl.position.set(0, 3, 5.2); wl.receiveShadow = true; CNT.add(wl);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(16, 2.4), new THREE.MeshBasicMaterial({ color: '#BFE0F8' })); gl.position.set(0, 2.5, 5.08); gl.rotation.y = Math.PI; CNT.add(gl);
  for (let i = 0; i <= 8; i++) TM(new THREE.BoxGeometry(.12, 2.5, .12), '#5A6270', CNT, -8 + i * 2, 2.5, 5.05, .004);
  for (const y of [1.28, 3.72]) TM(new THREE.BoxGeometry(16.2, .14, .14), '#5A6270', CNT, 0, y, 5.05, .004);
  for (const x of [-4.5, 4.5]) { TM(new THREE.CylinderGeometry(.28, .22, .5, 14), '#C8643C', CNT, x, .25, 4.5, .006); TM(new THREE.IcosahedronGeometry(.55, 1), '#4FA236', CNT, x, 1.0, 4.5, .008); }
  const cw = new THREE.Mesh(new THREE.BoxGeometry(14, 4.5, .2), new THREE.MeshStandardMaterial({ color: '#7A4A2A', roughness: 1 })); cw.position.set(0, 2.25, 5.6); CRT.add(cw);
  for (const z of [3.2, 4.4]) for (const s of [-1, 1]) { TM(new THREE.BoxGeometry(2.6, .1, .5), '#6A4024', CRT, s * 1.9, .48, z, .006); TM(new THREE.BoxGeometry(2.6, .6, .08), '#6A4024', CRT, s * 1.9, .8, z + .25, .006); }
  TM(new THREE.BoxGeometry(5, .9, .08), '#5A3418', CRT, 0, .45, 2.6, .006); }
const SETS = { counter: [CNT], terminal: [TRM], cabin: [CAB], boardroom: [BRD], court: [CRT], sky: [SKY] };

// ---------------- cast ----------------
const mk = o => { const p = makeToon({ shoe: '#2A2A30', ...o }); scene.add(p.P); return p; };
const STEVE = mk({ name: 'steven', outfit: 'suit', top: '#2A3048', pants: '#2A3048', tie: '#C8283A', pocketSq: '#F4F1EA', hair: 'slick', hairC: '#4A3A2E', shoe: '#16131A' });
const AGENT = mk({ name: 'agent', outfit: 'suit', top: '#1E3A6E', pants: '#1E3A6E', tie: '#F2C230', pocketSq: '#F2C230', hair: 'bob', hairC: '#3A2418', blush: 1, seed: 30 });
const EXEC = [mk({ name: 'exec0', outfit: 'suit', top: '#4A4E58', pants: '#3A3E48', tie: '#2E5AA8', hair: 'bald', hairC: '#7A6A5A', seed: 31 }), mk({ name: 'exec1', outfit: 'suit', top: '#3A3E48', pants: '#2A2E38', tie: '#C8283A', hair: 'slick', hairC: '#9A958E', glasses: 'round', seed: 32 }), mk({ name: 'exec2', outfit: 'suit', top: '#5A4A3A', pants: '#3A3028', tie: '#F2C230', hair: 'bob', hairC: '#C88A3A', blush: 1, seed: 33 })];
const STR = [mk({ name: 'backpacker', outfit: 'hoodie', top: '#4AC88A', pants: '#3A4A6A', hair: 'beanie', hatC: '#E8423A', seed: 34 }), mk({ name: 'granny', outfit: 'tee', top: '#C84A7A', pants: '#4A4E58', hair: 'bob', hairC: '#E8E6E0', glasses: 'round', blush: 1, seed: 35 }), mk({ name: 'surfer', outfit: 'tee', top: '#F2B33A', pants: '#2A6AB0', hair: 'messy', hairC: '#E8C870', seed: 36 })];
const CAST = [STEVE, AGENT, ...EXEC, ...STR];

// ---------------- props ----------------
const PASS = passCard(), PASS2 = passCard({ silver: 1 }); scene.add(PASS, PASS2);
const CASH = [0, 1, 2, 3, 4, 5].map(() => { const c = cashStack(); scene.add(c); return c; });
const CALC = calculator(); scene.add(CALC);
const BP = new THREE.Group(); { const bt = document.createElement('canvas'); bt.width = 320; bt.height = 140; const g = bt.getContext('2d'); g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, 320, 140); g.fillStyle = '#1E3A6E'; g.fillRect(0, 0, 320, 34); g.fillStyle = '#FFFFFF'; g.font = '800 22px Montserrat'; g.fillText('BOARDING PASS', 12, 24); g.fillStyle = '#16131A'; g.font = '900 40px Montserrat'; g.fillText('LONDON', 12, 86); g.font = '700 22px Montserrat'; g.fillText('SEAT 1B · FIRST', 12, 122);
  const t = new THREE.CanvasTexture(bt); t.colorSpace = THREE.SRGBColorSpace; TM(new THREE.BoxGeometry(.2, .088, .004), new THREE.MeshToonMaterial({ map: t }), BP, 0, 0, 0, .002); } scene.add(BP);
const BRIEF = new THREE.Group(); TM(new THREE.BoxGeometry(.42, .3, .1), '#5A3A22', BRIEF, 0, -.17, 0, .005); TM(new THREE.TorusGeometry(.05, .012, 6, 12, Math.PI), '#2A2A30', BRIEF, 0, 0, 0, .003); scene.add(BRIEF);
const FLUTE = new THREE.Group(); TM(new THREE.CylinderGeometry(.025, .012, .12, 12), new THREE.MeshToonMaterial({ color: '#F2E6A0', transparent: true, opacity: .85 }), FLUTE, 0, .06, 0, .002); TM(new THREE.CylinderGeometry(.004, .004, .08, 6), '#E8EAF0', FLUTE, 0, -.04, 0, 0); scene.add(FLUTE);
const FOLD = folder('LAWSUIT'); scene.add(FOLD);
const SCISS = new THREE.Group(); for (const s of [-1, 1]) { const b = TM(new THREE.BoxGeometry(.02, .16, .006), '#D8DCE2', SCISS, 0, .08, 0, .002); b.rotation.z = s * .2; TM(new THREE.TorusGeometry(.025, .008, 6, 12), '#C8283A', SCISS, s * .025, -.02, 0, .002); } scene.add(SCISS);
const PL1 = airliner('#C8283A'), PL2 = airliner('#2E6FB5'), PLG = airliner('#1E3A6E'); scene.add(PL1, PL2, PLG);
const TAGS = Array.from({ length: 18 }, () => { const c = document.createElement('canvas'); c.width = 256; c.height = 96; const g = c.getContext('2d'); g.fillStyle = '#C8283A'; g.fillRect(0, 0, 256, 96); g.fillStyle = '#FFFFFF'; g.font = '900 44px Montserrat'; g.textAlign = 'center'; g.fillText('RESERVED', 128, 62);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(.36, .135), new THREE.MeshToonMaterial({ map: t })); scene.add(m); return m; });
const PROPS = [PASS, PASS2, ...CASH, CALC, BP, BRIEF, FLUTE, FOLD, SCISS, PL1, PL2, PLG, ...TAGS];

// ---------------- key times (from the voice) ----------------
const C2 = cut('L2'), C3 = cut('L3'), C4 = cut('L4'), C5 = cut('L5'), C6 = cut('L6'), C7 = cut('L7'), C8 = cut('L8'), C9 = cut('L9');
const t250 = w('L1', '250'), tFly1 = w('L1', 'fly'), tAnd1 = w('L1', 'and'), tRegret = w('L1', 'regretted');
const t1987 = w('L2', '1987'), tSteven = w('L2', 'steven'), tBought = w('L2', 'bought'), tUnl = w('L2', 'unlimited'), tFirst = w('L2', 'first'), tAny2 = w('L2', 'anywhere'), tForever2 = w('L2', 'forever');
const t150 = w('L3', '150'), tBring = w('L3', 'bring'), tAny3 = w('L3', 'any'), tEvery3 = w('L3', 'every');
const tFlew1 = w('L4', 'flew', 0), tFlew2 = w('L4', 'flew', 1), tOver4 = w('L4', 'over'), t10k = w('L4', '10');
const tLondon5 = w('L5', 'london'), tJust5 = w('L5', 'just'), tGave = w('L5', 'gave'), tStrangers = w('L5', 'strangers');
const tMath = w('L6', 'math'), tBy6 = w('L6', 'by'), tMillions = w('L6', 'millions');
const t2008 = w('L7', '2008'), tWaited = w('L7', 'waited'), tLondon7 = w('L7', 'london'), tTold = w('L7', 'they'), tCancelled = w('L7', 'cancelled'), tForever7 = w('L7', 'forever');
const tAccused = w('L8', 'accused'), tThousands = w('L8', 'thousands'), tEmpty = w('L8', 'empty'), tSued = w('L8', 'he'), t7m = w('L8', '7');
const tWould = w('L9', 'would');

// ---------------- helpers ----------------
const put = (p, v, ry = 0) => { p.P.visible = true; p.P.position.copy(v); p.P.rotation.set(0, ry, 0); p.P.updateMatrixWorld(true); };
const CAMP = new THREE.Vector3(0, 1.4, 6);
const headOf = p => { p.P.updateMatrixWorld(true); return p.head.getWorldPosition(V(0, 0, 0)); };
const handOf = (p, left = 0) => { p.P.updateMatrixWorld(true); return (left ? p.aL : p.aR).hand.getWorldPosition(V(0, 0, 0)); };
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
function onHand(p, o, left = 0, pos = [0, 0, 0], rot = [0, 0, 0], s = 1) { o.visible = true; (left ? p.aL : p.aR).props.add(o); o.position.set(...pos); o.rotation.set(...rot); o.scale.setScalar(s); }
function place(o, v, rot = [0, 0, 0], s = 1) { scene.add(o); o.visible = true; o.position.copy(v); o.rotation.set(...rot); o.scale.setScalar(s); }
// a card held in a hand, facing a point (the shot's camera)
function hold(o, p, at, s = 1, off = V(0, .1, .06), left = 0) { place(o, handOf(p, left).add(off), [0, 0, 0], s); o.lookAt(at); }
function reset() {
  CAST.forEach(p => { p.P.visible = false; });
  for (const o of PROPS) { scene.add(o); o.visible = false; o.rotation.set(0, 0, 0); o.scale.setScalar(1); }
  PASS.userData.split(0);
}
const camAt = (pos, look, fov = 45, focus, aper = 4, roll = 0) => ({ pos, look, fov, focus: focus ?? pos.distanceTo(look), aper, roll });
const hand = (c, t, a = 1) => { c.pos.x += noise(t, 1) * .012 * a; c.pos.y += noise(t, 2) * .01 * a; c.look.x += noise(t, 3) * .02 * a; c.look.y += noise(t, 4) * .016 * a; return c; };

// ---------------- places ----------------
const DESK = V(0, 0, -1.4);                                         // the ticket counter (agent behind at z -2.1, customer at -.6)
const SP0 = V(.35, 0, -.55), AG0 = V(0, 0, -2.15);
const SG = TRO.clone().add(V(-.85, 0, -2.6)), AGG = TRO.clone().add(V(-1.0, 0, -4.25));
const S1 = CBO.clone().add(V(.85, 0, 0)), S2 = CBO.clone().add(V(.13, 0, 0));   // first class, row 1 (facing +z)
const BT = BRO.clone().add(V(0, 0, -.4));
const CT = CRO.clone().add(V(0, 0, 1.2));
const WIN = TRO.clone().add(V(-6, 0, -5.2));

const SHOTS = [];
const sh = o => SHOTS.push(o);
const REV = (x, u) => V(lerp(x, x * .85, u), 1.66, -2.95);   // the reverse angle at the counter: from behind the agent, onto Steven's face
// 1a · He paid $250,000: the cash goes down on the counter
sh({ t0: 0, set: 'counter', lt: INSIDE, at: DESK, act: t => actBuy(t, 0),
  cam: (t, u) => hand(camAt(REV(1.05, u), V(.3, 1.3, -.55), 48, 2.5, 4), t) });
// 1b · to fly free for the rest of his life…: he holds up the gold card
sh({ t0: tFly1 - .1, set: 'counter', lt: INSIDE, at: DESK, act: t => actBuy(t, 1), after: 1,
  cam: (t, u) => hand(camAt(V(lerp(.8, .72, u), 1.62, lerp(-2.9, -2.8, u)), headOf(STEVE).lerp(PASS.position, .5), 38, 2.3, 5), t, .5) });
// 1c · and the airline regretted it.: the boardroom, hands over faces
sh({ t0: tAnd1 - .1, set: 'boardroom', lt: BOARD, at: BRO, act: t => actBoard(t, 1),
  cam: (t, u) => hand(camAt(BRO.clone().add(V(0, 1.6, lerp(4.0, 3.7, u))), BRO.clone().add(V(0, 1.2, -1.8)), 54, 5.4, 3), t) });
// 2a · In 1987, Steven Rothstein: across the terminal with his briefcase
sh({ t0: C2, set: 'terminal', lt: SUNNY, at: TRO, act: t => actWalk(t),
  after: 1, cam: (t, u) => { const p = STEVE.P.position.clone(); return hand(camAt(p.clone().add(V(-1.4, 1.5, 3.0)), p.clone().add(V(.2, 1.25, 0)), 44, 3.3, 3), t, .6); } });
// 2b · bought a lifetime pass: unlimited first-class flights, anywhere, forever.: the card, turning in the light
sh({ t0: tBought - .1, set: 'counter', lt: INSIDE, at: DESK, act: t => actCard(t),
  cam: (t, u) => hand(camAt(V(0, 1.47, lerp(1.15, .95, u)), V(0, 1.45, -.55), 34, 1.6, 6), t, .3) });
// 3a · Two years later, he paid another $150,000: the second card, silver
sh({ t0: C3, set: 'counter', lt: INSIDE, at: DESK, act: t => actBuy(t, 2),
  cam: (t, u) => { const c = camAt(REV(-.95, u), V(.3, 1.3, -.55), 48, 2.6, 4); c.pos.y = 1.78; return hand(c, t); } });
// 3b · to bring a friend. Any friend. Every time.: first class, the seat beside him changing
sh({ t0: tBring - .1, set: 'cabin', lt: CABIN, at: CBO, act: t => actCabin(t, 'friends'),
  cam: (t, u) => hand(camAt(CBO.clone().add(V(.49, lerp(1.5, 1.45, u), lerp(2.45, 2.2, u))), CBO.clone().add(V(.49, 1.0, 0)), 50, 2.3, 3), t, .5) });
// 4a · So he flew. And flew.: airliners through the sky
sh({ t0: C4, set: 'sky', lt: HIGH, at: SKO, act: t => actFly(t),
  cam: (t, u) => hand(camAt(SKO.clone().add(V(0, 2, 95)), SKO.clone().add(V(0, -5, 0)), 46, 95, .3), t, .4) });
// 4b · Over 10,000 flights.: the departure board, flipping
sh({ t0: tOver4 - .1, set: 'terminal', lt: SUNNY, at: TRO, act: t => actBoardFlip(t),
  cam: (t, u) => hand(camAt(TRO.clone().add(V(lerp(2.2, 2.3, u), lerp(2.9, 3.0, u), lerp(-2.6, -2.9, u))), TRO.clone().add(V(2.4, 3.1, -5.7)), 50, 3.0, 3), t, .4) });
// 5a · He flew to London over and over, just because he could.: in seat 1A, glass in hand
sh({ t0: C5, set: 'cabin', lt: CABIN, at: CBO, act: t => actCabin(t, 'solo'), after: 1,
  cam: (t, u) => { const h = headOf(STEVE); return hand(camAt(h.clone().add(V(lerp(-.4, -.3, u), .05, lerp(2.6, 2.35, u))), h.clone().add(V(-.05, -.22, 0)), 38, 2.5, 5), t, .5); } });
// 5b · He gave the extra seat to strangers.: at the gate, a boarding pass to a stranger
sh({ t0: tGave - .1, set: 'terminal', lt: SUNNY, at: TRO, act: t => actGive(t),
  cam: (t, u) => hand(camAt(TRO.clone().add(V(lerp(1.0, 1.15, u), 1.5, lerp(5.05, 4.8, u))), TRO.clone().add(V(3.075, 1.2, 1.9)), 46, 3.7, 4), t) });
// 6a · The airline did the math.: the calculator
sh({ t0: C6, set: 'boardroom', lt: BOARD, at: BRO, act: t => actBoard(t, 0),
  cam: (t, u) => hand(camAt(BRO.clone().add(V(lerp(.75, .65, u), 1.5, lerp(-.35, -.5, u))), BRO.clone().add(V(-1.0, 1.05, -1.3)), 44, 2.0, 5), t) });
// 6b · By some estimates, he was costing them millions.: the line going up
sh({ t0: tBy6 - .1, set: 'boardroom', lt: BOARD, at: BRO, act: t => actBoard(t, 0),
  cam: (t, u) => hand(camAt(BRO.clone().add(V(0, 1.6, lerp(3.6, 4.0, u))), BRO.clone().add(V(0, 1.2, -1.8)), 54, 5.4, 3), t) });
// 7a · In 2008, as he waited to board a flight to London,: in line at the gate
sh({ t0: C7, set: 'terminal', lt: SUNNY, at: TRO, act: t => actGate(t),
  cam: (t, u) => hand(camAt(TRO.clone().add(V(lerp(.05, -.05, u), 1.7, lerp(-.85, -1.15, u))), TRO.clone().add(V(-1.0, 1.35, -3.9)), 50, 2.0, 3), t) });
// 7b · they told him his pass was cancelled. Forever.: the card, the scissors
sh({ t0: tTold - .1, set: 'terminal', lt: SUNNY, at: TRO, act: t => actGate(t),
  cam: (t, u) => hand(camAt(TRO.clone().add(V(-.3, 1.42, lerp(-2.3, -2.45, u))), TRO.clone().add(V(-.92, 1.3, -3.8)), 42, 1.5, 6), t, .4) });
// 8a · They accused him of booking thousands of seats that went empty.: the empty cabin, reserved
sh({ t0: C8, set: 'cabin', lt: CABIN, at: CBO, act: t => actEmpty(t),
  cam: (t, u) => hand(camAt(CBO.clone().add(V(0, lerp(2.05, 1.95, u), lerp(1.9, 1.3, u))), CBO.clone().add(V(0, .55, -6)), 55, 5, 2), t, .4) });
// 8b · He sued for $7 million.: the courtroom, from the bench
sh({ t0: tSued - .1, set: 'court', lt: COURT, at: CT, act: t => actCourt(t),
  cam: (t, u) => hand(camAt(CT.clone().add(V(lerp(.55, .45, u), 1.6, lerp(-1.3, -1.1, u))), CT.clone().add(V(-.2, 1.3, .5)), 44, 2.0, 4), t) });
// 9 · Would you buy a lifetime pass?: at the terminal window, the two halves, a plane outside
sh({ t0: C9, set: 'terminal', lt: SUNNY, at: TRO, act: t => actEnd(t),
  cam: (t, u) => hand(camAt(WIN.clone().add(V(lerp(.45, .6, u), 1.55, lerp(2.7, 3.0, u))), WIN.clone().add(V(0, 1.3, .4)), 46, 2.4, 4), t) });
SHOTS.forEach((s, i) => { s.t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : LOOP; });
SHOTS.push({ ...SHOTS[0], t0: LOOP, t1: DUR + 1, loop: 1 });

// ---------------- acting ----------------
function counterPeople(t, o = {}) {
  put(STEVE, SP0, Math.PI); put(AGENT, AG0, 0);
  apply(STEVE, o.steve ?? TP.stand, { t, seed: 1, face: o.sface ?? 'proud', look: o.slook ?? headOf(AGENT), talk: o.stalk ?? 0 });
  apply(AGENT, o.agent ?? TP.stand, { t, seed: 30, face: o.aface ?? 'shock', look: headOf(STEVE) });
}
function actBuy(t, phase) {
  reset();
  if (phase === 2) {   // the silver companion card, $150,000 more
    counterPeople(t, { steve: { ...TP.stand, aR: [-150, 10, 0, 40] }, sface: 'laugh', slook: CAMP, aface: t > t150 ? 'shock' : 'happy' });
    const n = Math.round(lerp(0, 3, seg(t, t150 - .3, t150 + .4))); for (let i = 0; i < n; i++) place(CASH[i], DESK.clone().add(V(.5 - i * .32, 1.18, .05)), [0, .2 * i, 0], 1);
    hold(PASS2, STEVE, CAMP, 1.5, V(.12, .14, .02)); return;
  }
  const n = Math.round(lerp(0, 6, seg(t, .15, t250 + .5)));
  counterPeople(t, { steve: phase === 1 ? { ...TP.stand, aR: [-150, 10, 0, 40] } : { ...TP.stand, aR: [-70, 10, 0, 60], aL: [-70, -10, 0, 60] }, sface: phase === 1 ? 'laugh' : 'proud', slook: phase === 1 ? CAMP : undefined, aface: 'shock' });
  for (let i = 0; i < n; i++) place(CASH[i], DESK.clone().add(V(.55 - (i % 3) * .32, 1.18 + Math.floor(i / 3) * .1, .05 - Math.floor(i / 3) * .2)), [0, .2 * i, 0], 1);
  if (phase === 1) hold(PASS, STEVE, CAMP, 1.5, V(.12, .14, .02));
}
const EXP = [V(-1.0, 0, -1.3), V(1.0, 0, -1.3), V(2.05, 0, -2.6)];   // two at the table, one presenting by the screen
function actBoard(t, regret) {
  reset();
  BRD.userData.chart(regret ? 1 : eio(seg(t, tBy6, tMillions + .3)), 'COST OF ONE PASSENGER');
  const scr = BRO.clone().add(V(0, 2.3, -3.3));
  if (!regret) { place(CALC, BRO.clone().add(V(-.6, .87, -1.22)), [0, 0, 0], 1.8); CALC.lookAt(CAMP); CALC.rotateX(-.7); }
  EXEC.forEach((p, i) => { const v = BRO.clone().add(EXP[i]); put(p, v, i === 2 ? -.6 : i === 1 ? -Math.PI / 2 : Math.PI / 2);
    const facepalm = regret && t > tRegret - .2, shocked = !regret && t > tMillions - .1;
    const base = i === 2 ? (facepalm ? { ...TP.stand, aR: [-140, 20, 0, 140], hd: [14, 0, 0] } : { ...TP.point }) : facepalm ? { ...TP.sit, y: -.06, aR: [-140, 20, 0, 140], hd: [14, 0, 0] } : { ...TP.sit, y: -.06, aL: [-50, 10, 0, 70], aR: [-50, 10, 0, 70] };
    apply(p, base, { t, seed: 31 + i, face: facepalm ? 'worried' : regret ? 'shock' : shocked ? 'shock' : i === 0 ? 'deadpan' : 'worried', look: i === 0 && !regret && t < tBy6 ? CALC.position : i === 2 ? CAMP : scr, eyes: facepalm ? [0, -.6] : undefined }); });
}
function actWalk(t) {
  reset();
  const k = seg(t, C2 - .2, tBought), v = TRO.clone().add(V(lerp(-5, 1, k), 0, lerp(2.5, 1.5, k))); put(STEVE, v, Math.PI / 2 - .3);
  apply(STEVE, walk(TP.stand, t * 6.5, .9), { t, seed: 1, face: 'proud', look: CAMP }); onHand(STEVE, BRIEF, 0, [0, -.02, .02], [0, Math.PI / 2, 0], 1);
  STR.forEach((p, i) => { const x = lerp(4 + i * 2, -6 + i * 2, seg(t, C2 - 1, tBought + 2)); const pv = TRO.clone().add(V(x, 0, 4.2 + i * .7)); put(p, pv, -Math.PI / 2); apply(p, walk(TP.stand, t * 6.5 + i, .8), { t, seed: 34 + i, face: 'happy', look: CAMP }); });
  place(PLG, TRO.clone().add(V(4, 4.2, -30)), [0, Math.PI, 0], 1);
}
function actCard(t) {
  reset(); place(PASS, V(0, 1.45, -.55), [0, Math.sin(t * .8) * .25, Math.sin(t * .6) * .06], 1.4);
}
function seatsFirst(pair) { const s = CAB.userData.seats; if (s) s[0].position.x = pair ? .13 : -.85; }
function actCabin(t, mode) {
  reset(); seatsFirst(1);
  put(STEVE, S1, 0); apply(STEVE, { ...TP.sit, y: -.04, aR: [-80, 20, 0, 110] }, { t, seed: 1, face: 'laugh', look: mode === 'solo' ? CAMP : headOf(STR[0]) });
  onHand(STEVE, FLUTE, 0, [0, -.02, .05], [0, 0, 0], 1.6);
  if (mode === 'friends') { const k = t < tAny3 - .1 ? 0 : t < tEvery3 - .1 ? 1 : 2; const p = STR[k]; put(p, S2, 0); apply(p, k === 2 ? { ...TP.sit, y: -.04, aL: [-15, 140, 0, 20], aR: [-15, 140, 0, 20] } : { ...TP.sit, y: -.04 }, { t, seed: 34 + k, face: 'laugh', look: headOf(STEVE) }); }
}
function actFly(t) {
  reset();
  const pass = (pl, t0, z, y, dir) => { const k = seg(t, t0 - .6, t0 + 1.6); if (k <= 0 || k >= 1) return; place(pl, SKO.clone().add(V(lerp(-48, 48, k) * dir, y + lerp(-2, 3, k), z)), [0, dir > 0 ? 0 : Math.PI, .12 * dir], 1); };
  pass(PL1, tFlew1, -12, -3, 1); pass(PL2, tFlew2, -34, 7, -1);
}
function actBoardFlip(t) {
  reset();
  const cities = ['LONDON', 'NEW YORK', 'PARIS', 'TOKYO', 'MIAMI', 'LONDON', 'DALLAS', 'LONDON', 'HONOLULU', 'LONDON'];
  const n = Math.floor(t * 12), rows = [0, 1, 2, 3, 4, 5].map(i => [cities[(n + i * 3) % cities.length], `${String(6 + ((n + i) % 18)).padStart(2, '0')}:${(i * 13 + n * 7) % 6}0`, i % 3 ? 'ON TIME' : 'BOARDING']);
  TRM.userData.board(rows, 0);
}
function actGive(t) {
  reset();
  const sv = TRO.clone().add(V(2.75, 0, 1.7)), bv = TRO.clone().add(V(3.4, 0, 2.1)); put(STEVE, sv, face(sv, bv) - .5); put(STR[0], bv, face(bv, sv) + .5);
  const handed = t > tStrangers - .2;
  apply(STEVE, { ...TP.stand, aR: [-80, 10, 0, 40] }, { t, seed: 1, face: 'happy', look: headOf(STR[0]) });
  apply(STR[0], handed ? TP.cheer : { ...TP.stand, aR: [-70, -10, 0, 40] }, { t, seed: 34, face: handed ? 'laugh' : 'shock', look: handed ? CAMP : headOf(STEVE) });
  place(BP, (handed ? handOf(STR[0]).add(V(0, .08, .02)) : handOf(STEVE).add(V(0, .05, .05))), [0, 0, 0], 1.6); BP.lookAt(CAMP);
  TRM.userData.board([['LONDON', '18:05', 'BOARDING']], 0);
}
function actGate(t) {
  reset();
  TRM.userData.board([['LONDON', '18:05', t > tCancelled - .1 ? 'CANCELLED' : 'BOARDING'], ['NEW YORK', '18:40', 'ON TIME'], ['PARIS', '19:10', 'ON TIME']], 0);
  put(STEVE, SG, Math.PI - .15); put(AGENT, AGG, .1);
  const told = t > tTold - .1, cutting = t > tCancelled - .25;
  const card = AGG.clone().add(V(.08, 1.2, .45));
  apply(STEVE, told ? { ...TP.stand, aL: [-30, -20, 0, 120], aR: [-30, 20, 0, 120] } : { ...TP.stand, aR: [-90, 10, 0, 40] }, { t, seed: 1, face: cutting ? 'shock' : told ? 'worried' : 'happy', look: told ? card : headOf(AGENT) });
  apply(AGENT, told ? { ...TP.stand, aR: [-75, 10, 0, 30], aL: [-75, -10, 0, 30] } : TP.stand, { t, seed: 30, face: told ? 'deadpan' : 'happy', look: told ? card : headOf(STEVE) });
  if (!told) { place(PASS, handOf(STEVE).add(V(0, .08, -.05)), [0, 0, 0], 1.2); PASS.lookAt(CAMP); }
  else { place(PASS, card, [0, 0, 0], 1.25); PASS.lookAt(CAMP); PASS.userData.split(eo(seg(t, tCancelled - .05, tCancelled + .35)));
    place(SCISS, card.clone().add(V(0, .14 - .06 * seg(t, tCancelled - .3, tCancelled), .05)), [0, 0, Math.sin(t * 18) * .15 * (t < tCancelled ? 1 : 0)], 1.1); SCISS.lookAt(CAMP); }
}
function actEmpty(t) {
  reset(); seatsFirst(0);
  TAGS.forEach((m, i) => { const r = Math.floor(i / 4) + 1, k = i % 4, x = [-1.17, -.65, .65, 1.17][k]; const v = CBO.clone().add(V(x, 1.42, -r * 1.0 - .3 - .2)); const kk = back(seg(t, C8 + .1 + i * .07, C8 + .35 + i * .07), 2.2); if (kk <= 0) return; place(m, v, [0, 0, 0], kk * 1.3); m.lookAt(CAMP); });
}
function actCourt(t) {
  reset();
  const sv = CT.clone().add(V(-.25, 0, .55)); put(STEVE, sv, Math.PI - .25);
  const slam = seg(t, tSued, tSued + .2);
  apply(STEVE, { ...TP.stand, aR: [-60 - 40 * (1 - slam), 10, 0, 40] }, { t, seed: 1, face: 'angry', look: CAMP, talk: t > t7m - .3 ? .4 + .4 * Math.sin(t * 16) : 0 });
  place(FOLD, CT.clone().add(V(-.2, .83, .05)), [-Math.PI / 2, 0, Math.PI + .1], 1.4);
  for (let i = 0; i < 3; i++) { const k = back(seg(t, t7m - .1 + i * .1, t7m + .15 + i * .1), 2.2); if (k > 0) place(CASH[i], CT.clone().add(V(.35 + i * .2, .83, -.05)), [0, .3 * i, 0], k); }
}
function actEnd(t) {
  reset();
  const sv = WIN.clone().add(V(0, 0, .5)); put(STEVE, sv, face(sv, CAMP));
  apply(STEVE, { ...TP.stand, aL: [-60, -20, 0, 80], aR: [-60, 20, 0, 80] }, { t, seed: 1, face: 'smug', look: CAMP });
  PASS.userData.split(1); place(PASS, handOf(STEVE).lerp(handOf(STEVE, 1), .5).add(V(0, .1, 0)), [0, 0, 0], 1.3); PASS.lookAt(CAMP);
  place(PLG, TRO.clone().add(V(lerp(-40, 30, seg(t, C9 - 1, C9 + 6)), 5 + lerp(0, 9, seg(t, C9, C9 + 6)), -45)), [0, 0, .12], 1);
}

// ---------------- sound events (the score reads these) ----------------
ev(0, 'room', { d: tAnd1 }); ev(.05, 'boom'); ev(t250, 'register'); ev(tFly1, 'sparkle'); ev(tRegret, 'shrug');
ev(C2, 'terminal', { d: tBought - C2 }); ev(tUnl, 'tick', { n: 0 }); ev(tFirst, 'tick', { n: 1 }); ev(tAny2, 'tick', { n: 2 }); ev(tForever2, 'sparkle');
ev(t150, 'register'); ev(tAny3, 'pop'); ev(tEvery3, 'pop');
ev(tFlew1 - .3, 'jetby', { d: 2 }); ev(tFlew2 - .3, 'jetby', { d: 2 }); ev(tOver4, 'flap', { d: C5 - tOver4 });
ev(C5, 'cabin', { d: tGave - C5 }); ev(tLondon5, 'ding'); ev(tStrangers, 'cheer');
ev(C6, 'room', { d: C7 - C6 }); ev(tMath, 'click'); ev(tMillions, 'down');
ev(C7, 'terminal', { d: C8 - C7 }); ev(tCancelled, 'snip'); ev(tCancelled + .1, 'error'); ev(tForever7, 'hit');
ev(tThousands, 'pop'); ev(tSued, 'thud'); ev(t7m, 'register'); ev(LOOP - 1.0, 'sting');

// ---------------- the overlay: telops, the checklist, captions ----------------
const ov = document.getElementById('ov').getContext('2d');
const TEL = [
  { t0: t250 - .05, t1: tFly1 - .1, text: '$250,000', y: 300, size: 170, col: '#7AF09A', rot: -4, plate: '#16131A' },
  { t0: tRegret - .05, t1: C2, text: 'REGRET', y: 300, size: 150, col: '#E8423A', rot: -6, stamp: 1 },
  { t0: t1987 - .05, t1: tBought - .1, text: '1987', y: 300, size: 170, col: '#FFFFFF', rot: -4, plate: '#16131A' },
  { t0: tSteven - .05, t1: tBought - .1, text: 'STEVEN ROTHSTEIN', y: 1500, size: 84, col: '#FFFFFF', rot: -2, plate: '#2A3A7A', sub: 'CHICAGO · BUSINESSMAN' },
  { t0: t150 - .05, t1: tBring - .1, text: '+$150,000', y: 300, size: 150, col: '#7AF09A', rot: -4, plate: '#16131A', sub: '+1 COMPANION, ANY FRIEND' },
  { t0: tAny3 - .05, t1: C4, text: t => t < tEvery3 - .1 ? 'ANY FRIEND' : 'EVERY TIME', y: 300, size: 120, col: '#16131A', rot: 3, plate: '#F2C230' },
  { t0: tOver4 - .05, t1: C5, text: t => `${Math.round(lerp(0, 10000, eo(seg(t, tOver4, t10k + .5)))).toLocaleString('en-US')}+ FLIGHTS`, y: 300, size: 110, col: '#FFFFFF', rot: -3, plate: '#1E3A6E', mono: '10,000+ FLIGHTS' },
  { t0: tLondon5 - .05, t1: tGave - .1, text: '✈ LONDON. AGAIN.', y: 300, size: 100, col: '#FFFFFF', rot: -3, plate: '#C8283A' },
  { t0: tStrangers - .05, t1: C6, text: 'FREE SEAT 🎟', y: 300, size: 120, col: '#16131A', rot: 4, plate: '#7AF09A' },
  { t0: tMillions - .05, t1: C7, text: 'COST: $ MILLIONS', y: 300, size: 110, col: '#FFFFFF', rot: -4, plate: '#E8423A' },
  { t0: t2008 - .05, t1: tTold - .1, text: '2008', y: 300, size: 170, col: '#FFFFFF', rot: -4, plate: '#16131A' },
  { t0: tCancelled - .03, t1: C8, text: 'CANCELLED', y: 320, size: 150, col: '#E8423A', rot: -8, stamp: 1 },
  { t0: tEmpty - .05, t1: tSued - .1, text: 'BOOKED. EMPTY.', y: 300, size: 110, col: '#FFFFFF', rot: -3, plate: '#C8283A' },
  { t0: t7m - .05, t1: C9, text: '$7,000,000', y: 300, size: 160, col: '#7AF09A', rot: -4, plate: '#16131A', sub: 'THE LAWSUIT' },
  { t0: tWould - .05, t1: LOOP, text: 'WOULD YOU BUY IT?', y: 300, size: 100, col: '#FFD23F', rot: -5, plate: '#16131A', yn: 1 },
];
function drawTelop(x, t) {
  const p = seg(t, x.t0, x.t0 + .25), sc = x.stamp ? lerp(2.2, 1, eo(p)) : back(p, 2.6), wob = 1 + .02 * Math.sin((t - x.t0) * 8);
  const text = typeof x.text === 'function' ? x.text(t) : x.text;
  ov.save(); ov.translate(x.x ?? 540, x.y); ov.rotate(x.rot * Math.PI / 180); ov.scale(sc * wob, sc * wob); if (x.stamp) ov.globalAlpha = clamp(p * 3);
  ov.font = `900 ${x.size}px Montserrat`; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  const tw = Math.min(1000, ov.measureText(x.mono ?? text).width + 70), th = x.size * 1.4;
  if (x.plate) { ov.fillStyle = 'rgba(0,0,0,.85)'; ov.beginPath(); ov.roundRect(-tw / 2 + 10, -th / 2 + 12, tw, th, 28); ov.fill(); ov.fillStyle = x.plate; ov.beginPath(); ov.roundRect(-tw / 2, -th / 2, tw, th, 28); ov.fill(); }
  if (x.stamp) { ov.strokeStyle = x.col; ov.lineWidth = 16; ov.beginPath(); ov.roundRect(-tw / 2 + 5, -th / 2 + 8, tw - 10, th - 16, 20); ov.stroke(); }
  const light = ['#F2C230', '#7AF09A'].includes(x.plate);
  ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 20; ov.shadowOffsetY = 8; ov.lineWidth = x.size * .2; ov.strokeStyle = '#000'; if (!light) ov.strokeText(text, 0, 4, 960); ov.shadowColor = 'transparent'; ov.fillStyle = x.col; ov.fillText(text, 0, 4, 960);
  if (x.sub) { ov.font = '900 44px Montserrat'; const sw = ov.measureText(x.sub).width + 44; ov.fillStyle = '#FFD23F'; ov.beginPath(); ov.roundRect(-sw / 2, x.size * .7 + 4, sw, 62, 16); ov.fill(); ov.fillStyle = '#1B1213'; ov.fillText(x.sub, 0, x.size * .7 + 37); }
  ov.restore();
  if (x.yn) [['✓ YES', '#2E9A4A', -230], ['✗ NO', '#C8283A', 230]].forEach(([s, col, dx], i) => { const k = back(seg(t, x.t0 + .2 + i * .12, x.t0 + .45 + i * .12), 2.4); if (k <= 0) return; ov.save(); ov.translate(540 + dx, 500); ov.scale(k, k); ov.fillStyle = col; ov.beginPath(); ov.roundRect(-190, -70, 380, 140, 70); ov.fill(); ov.lineWidth = 10; ov.strokeStyle = '#FFFFFF'; ov.stroke(); ov.fillStyle = '#FFFFFF'; ov.font = '900 80px Montserrat'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.fillText(s, 0, 6); ov.restore(); });
}
// what the pass bought: four ticks, one per word
function drawPerks(t) {
  if (t < tBought - .1 || t >= C3) return;
  [['UNLIMITED', tUnl], ['FIRST CLASS', tFirst], ['ANYWHERE', tAny2], ['FOREVER', tForever2]].forEach(([s, x], i) => { const k = back(seg(t, x - .05, x + .2), 2.2); if (k <= 0) return;
    ov.save(); ov.translate(540, 360 + i * 112); ov.scale(k, k); ov.fillStyle = 'rgba(0,0,0,.8)'; ov.beginPath(); ov.roundRect(-300, -46, 610, 96, 26); ov.fill(); ov.fillStyle = '#FBF6E6'; ov.beginPath(); ov.roundRect(-310, -52, 610, 96, 26); ov.fill();
    ov.fillStyle = '#16131A'; ov.font = '900 60px Montserrat'; ov.textAlign = 'left'; ov.textBaseline = 'middle'; ov.fillText(s, -270, 0, 440); ov.fillStyle = '#2E9A4A'; ov.font = '900 72px Montserrat'; ov.fillText('✓', 200, 4); ov.restore(); });
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
function frame(sh, t) {
  const tt = sh.loop ? .4 : t, u = sh.loop ? 0 : seg(t, sh.t0, sh.t1);
  light(sh.lt, sh.at);
  for (const arr of Object.values(SETS)) arr.forEach(s => s.visible = false); SETS[sh.set].forEach(s => s.visible = true);
  let c = sh.after ? null : sh.cam(tt, u); if (c) CAMP.copy(c.pos);
  sh.act(tt);
  if (!c) { c = sh.cam(tt, u); CAMP.copy(c.pos); }
  camera.position.copy(c.pos); sky.position.copy(c.pos); camera.up.set(0, 1, 0); camera.lookAt(c.look); camera.rotateZ(c.roll ?? 0); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  post.dof.focus = c.focus; post.dof.aper = c.aper; post.dof.maxCoc = 8;
  scene.updateMatrixWorld(true); post.composer.render();
}
const A0 = +(QS.get('a') ?? 0), B0 = +(QS.get('b') ?? DUR);
const shotAt = t => { const i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1); return SHOTS[i < 0 ? SHOTS.length - 1 : i]; };
function render(t) {
  const sh = shotAt(t);
  ov.clearRect(0, 0, W, H);
  frame(sh, t);
  if (QS.get('poster')) { ov.clearRect(0, 0, W, H); [['$250,000 FOR', 200, -4, '#FFFFFF', 120, '#16131A'], ['FREE FLIGHTS', 360, -4, '#FFD23F', 130, '#C8283A'], ['FOREVER', 520, -4, '#FFFFFF', 140, '#1E3A6E']].forEach(([text, y, rot, col, size, plate]) => drawTelop({ t0: -9, text, y, size, col, rot, plate }, t)); return; }
  if (QS.get('clean')) return;
  if (t < LOOP) { TEL.forEach(x => { if (t >= x.t0 && t < x.t1) drawTelop(x, t); }); drawPerks(t); drawCaption(t); }
}
function texts(t) { if (t >= LOOP) return []; return TEL.filter(x => typeof x.text === 'string' && t >= x.t0 + .3 && t < x.t1).map(x => ({ id: x.text, text: x.text, x0: 60, y0: x.y - x.size * .7, x1: 1020, y1: x.y + x.size * .7 })); }
EV.sort((a, b) => a.t - b.t);
window.SHOTLIST = SHOTS.map(s => [+s.t0.toFixed(3), +s.t1.toFixed(3), null]);
window.DUR = +(B0 - A0).toFixed(3); window.EV = EV; window.render = t => render(t + A0); window.TEXTS = t => texts(t + A0);
render(A0);
window.READY = true;
