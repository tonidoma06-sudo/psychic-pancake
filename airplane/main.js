// "The Man Who Ate an Airplane" · 3D vertical Short (1080×1920), v4 toon style.
// Michel Lotito ("Monsieur Mangetout") ate metal: tiny pieces, mineral oil, water, up to two pounds a day; 18 bicycles, 15
// shopping carts, 7 TVs, a coffin (handles and all); then a Cessna 150, piece by piece, over two years. His stomach walls were
// twice as thick as normal; he was given a brass plaque for the strangest diet (legend says he ate it); bananas and
// hard-boiled eggs made him sick. Every shot, action, telop and caption is placed from timing.json (the voice). render(t) is pure.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makePost } from '/core/three/post.js';
import { makeToon, apply, TP, mix, walk, TM, G } from './toon.js';
import { cessna, field, table, stage, shop, studio, clinic, hall, bicycle, cart, tv, coffin, fork, bottle, glassW, scale, wrench, plaque, banana, egg } from './sets_air.js';
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
const camera = new THREE.PerspectiveCamera(45, W / H, .03, 2000);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, ao: false });
post.bloom.strength = .2; post.bloom.threshold = .95; post.bloom.radius = .5;
const vg = post.vig.uniforms; vg.amt.value = .22; vg.sat.value = 1.2; vg.contrast.value = .12;
const sun = new THREE.DirectionalLight('#FFF4E0', 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
scene.add(sun, sun.target); const hemi = new THREE.HemisphereLight('#BFDFFF', '#4A6A2A', 1); scene.add(hemi);
const sky = skyDome('#2A78E0', '#E8E2D6', V(-.4, .5, .6), '#FFF6D8'); scene.add(sky);
const spot = new THREE.SpotLight('#FFF4D0', 0, 30, .32, .5, 1.2); spot.castShadow = false; scene.add(spot, spot.target);
const SUNNY = { pos: [-18, 30, 26], col: '#FFF1DA', int: 3.0, hs: '#C8E0FF', hg: '#A89A80', hemi: 1.05, fog: ['#CFE4F2', 80, 480], sky: ['#2A78E0', '#E4EEF2', [-.4, .5, .6], '#FFF6D8'], env: .35, r: 14, warm: .14 };
const NIGHTF = { pos: [-14, 26, 20], col: '#7A90D8', int: .6, hs: '#3A4A80', hg: '#18161E', hemi: .45, fog: ['#121A30', 40, 300], sky: ['#050A1E', '#1E2850', [-.5, .35, .6], '#FFF2C8'], env: .08, r: 14, warm: 0 };
const THEATRE = { pos: [-4, 12, 10], col: '#FFE8C8', int: .5, hs: '#3A2A40', hg: '#1A1418', hemi: .45, env: .15, r: 10, bg: '#140E14', warm: .25, spot: 140 };
const INSIDE = { pos: [-4, 9, 7], col: '#FFF4E0', int: 2.0, hs: '#FFF8EC', hg: '#B8A890', hemi: 1.1, env: .5, r: 8, bg: '#DCD8D0', warm: .1 };
const STUDIO = { pos: [-6, 12, 10], col: '#FFFFFF', int: 2.2, hs: '#FFFFFF', hg: '#D8D0C0', hemi: 1.2, env: .5, r: 12, bg: '#EDE8DE', warm: .06 };
const HALLL = { pos: [-4, 10, 8], col: '#FFE8C8', int: 1.6, hs: '#8A9AC8', hg: '#2A2430', hemi: .8, env: .3, r: 9, bg: '#1A1C28', warm: .15 };
const _ca = new THREE.Color(), _cb = new THREE.Color(); const lc = (a, b, k) => '#' + _ca.set(a).lerp(_cb.set(b), k).getHexString();
const mixLT = (a, b, k) => ({ pos: a.pos.map((v, i) => lerp(v, b.pos[i], k)), col: lc(a.col, b.col, k), int: lerp(a.int, b.int, k), hs: lc(a.hs, b.hs, k), hg: lc(a.hg, b.hg, k), hemi: lerp(a.hemi, b.hemi, k),
  fog: [lc(a.fog[0], b.fog[0], k), lerp(a.fog[1], b.fog[1], k), lerp(a.fog[2], b.fog[2], k)], sky: [lc(a.sky[0], b.sky[0], k), lc(a.sky[1], b.sky[1], k), a.sky[2], lc(a.sky[3], b.sky[3], k)], env: lerp(a.env, b.env, k), r: a.r, warm: lerp(a.warm, b.warm, k) });
function light(o, at) {
  sun.color.set(o.col); sun.intensity = o.int; sun.position.set(at.x + o.pos[0], at.y + o.pos[1], at.z + o.pos[2]); sun.target.position.copy(at);
  const c = sun.shadow.camera, r = o.r ?? 10; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 1; c.far = 200; c.updateProjectionMatrix();
  hemi.color.set(o.hs); hemi.groundColor.set(o.hg); hemi.intensity = o.hemi;
  scene.fog = o.fog ? new THREE.Fog(o.fog[0], o.fog[1], o.fog[2]) : null;
  if (o.sky) { sky.visible = true; scene.background = null; const u = sky.material.uniforms; u.top.value.set(o.sky[0]); u.hor.value.set(o.sky[1]); u.sd.value.set(...o.sky[2]).normalize(); u.sc.value.set(o.sky[3]); }
  else { sky.visible = false; scene.background = new THREE.Color(o.bg ?? '#2A2A30'); }
  scene.environmentIntensity = o.env ?? .35; vg.warm.value = o.warm ?? .1; spot.intensity = o.spot ?? 0;
}

// ---------------- the sets (each far from the others) ----------------
const FIELD = field(); scene.add(FIELD);
const STO = V(900, 0, 0), STG = stage(); STG.position.copy(STO); scene.add(STG);
const SHO = V(-900, 0, 0), SHOP = shop(); SHOP.position.copy(SHO); scene.add(SHOP);
const SDO = V(0, 0, 900), STU = studio(); STU.position.copy(SDO); scene.add(STU);
const CLO = V(0, 0, -900), CLI = clinic(); CLI.position.copy(CLO); scene.add(CLI);
const HAO = V(900, 0, 900), HALL = hall(); HALL.position.copy(HAO); scene.add(HALL);
const SETS = { field: FIELD, stage: STG, shop: SHOP, studio: STU, clinic: CLI, hall: HALL };

// ---------------- cast ----------------
const mk = o => { const p = makeToon({ shoe: '#2A2A30', ...o }); scene.add(p.P); return p; };
const MICHEL = mk({ name: 'michel', outfit: 'suit', top: '#1E1E26', pants: '#2A2A30', tie: '#C8283A', pocketSq: '#C8283A', hair: 'messy', hairC: '#1A1210', mustache: '#1A1210', shoe: '#16131A' });
const DOC = mk({ name: 'doctor', outfit: 'suit', top: '#F4F4F6', pants: '#3A4A6A', tie: '#2E7FE0', hair: 'bald', hairC: '#7A6A5A', glasses: 'round', seed: 30 });
const HOST = mk({ name: 'host', outfit: 'suit', top: '#2A3A6A', pants: '#1E2238', tie: '#FFD23F', pocketSq: '#FFD23F', hair: 'bob', hairC: '#C88A3A', blush: 1, seed: 31 });
const CAST = [MICHEL, DOC, HOST];

// ---------------- props ----------------
const PLANE = cessna(); scene.add(PLANE);
const TABLE = table(); scene.add(TABLE);
const FORK = fork(), FORK2 = fork(); const KNIFE = new THREE.Group(); TM(new THREE.BoxGeometry(.02, .22, .006), '#D8DCE2', KNIFE, 0, -.11, 0, .002); scene.add(FORK, FORK2, KNIFE);
const OIL = bottle('OIL', '#E8C040'), GLASS = glassW(), SCALE = scale(), WRENCH = wrench(), PLAQ = plaque(), BAN = banana(), EGG = egg(); scene.add(OIL, GLASS, SCALE, WRENCH, PLAQ, BAN, EGG);
const SAW = new THREE.Group(); TM(new THREE.BoxGeometry(.04, .1, .06), '#C8283A', SAW, 0, 0, 0, .003); TM(new THREE.BoxGeometry(.012, .02, .42), '#2A2A30', SAW, 0, .06, .24, .002); TM(new THREE.BoxGeometry(.004, .05, .4), '#D8DCE2', SAW, 0, .02, .24, .001); scene.add(SAW);
const MORSEL = new THREE.Mesh(new THREE.BoxGeometry(.05, .03, .04), new THREE.MeshToonMaterial({ color: '#B8BCC4' })); scene.add(MORSEL);
// the tally: 18 bicycles, 15 shopping carts, 7 TVs, 1 coffin, laid out on the cyclorama
const BIKES = Array.from({ length: 18 }, (_, i) => { const b = bicycle(['#2E7FE0', '#C8283A', '#F2C230', '#4AC88A', '#9A6AC8'][i % 5]); scene.add(b); return b; });
const CARTS = Array.from({ length: 15 }, () => { const c = cart(); scene.add(c); return c; });
const TVS = Array.from({ length: 7 }, () => { const t2 = tv(); scene.add(t2); return t2; });
const COF = coffin(); scene.add(COF);
const PROPS = [PLANE, TABLE, FORK, FORK2, KNIFE, OIL, GLASS, SCALE, WRENCH, PLAQ, BAN, EGG, SAW, MORSEL, ...BIKES, ...CARTS, ...TVS, COF];

// ---------------- key times (from the voice) ----------------
const C2 = cut('L2'), C3 = cut('L3'), C4 = cut('L4'), C5 = cut('L5'), C6 = cut('L6'), C7 = cut('L7'), C8 = cut('L8'), C9 = cut('L9');
const tAirplane = w('L1', 'airplane'), tNot1 = w('L1', 'not'), tWhole = w('L1', 'whole');
const tMichel = w('L2', 'michel'), tFrench = w('L2', 'french'), tEat2 = w('L2', 'eat'), tMetal = w('L2', 'metal');
const tCut = w('L3', 'cut'), tTiny = w('L3', 'tiny'), tDrank = w('L3', 'drank'), tOil = w('L3', 'oil'), tWashed = w('L3', 'washed'), tWater = w('L3', 'water'), tUp3 = w('L3', 'up'), tTwo3 = w('L3', 'two');
const t18 = w('L4', '18'), t15 = w('L4', '15'), t7 = w('L4', '7'), tCoffin = w('L4', 'coffin'), tHandles = w('L4', 'handles');
const tCessna = w('L5', 'cessna'), tReal = w('L5', 'real'), tPiece = w('L5', 'piece'), tTook = w('L5', 'it'), tYears = w('L5', 'years');
const tDoctors = w('L6', 'doctors'), tTwice = w('L6', 'twice');
const tGuinness = w('L7', 'guinness'), tPlaque = w('L7', 'plaque'), tStrangest = w('L7', 'strangest'), tLegend = w('L7', 'legend'), tAte7 = w('L7', 'ate');
const tOnly = w('L8', 'only'), tSick = w('L8', 'sick'), tBananas = w('L8', 'bananas'), tEggs = w('L8', 'hard');
const tWhats = w('L9', 'whats');

// ---------------- helpers ----------------
const put = (p, v, ry = 0) => { p.P.visible = true; p.P.position.copy(v); p.P.rotation.set(0, ry, 0); p.P.updateMatrixWorld(true); };
const CAMP = new THREE.Vector3(0, 1.4, 6);
const headOf = p => { p.P.updateMatrixWorld(true); return p.head.getWorldPosition(V(0, 0, 0)); };
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
function onHand(p, o, left = 0, pos = [0, 0, 0], rot = [0, 0, 0], s = 1) { o.visible = true; (left ? p.aL : p.aR).props.add(o); o.position.set(...pos); o.rotation.set(...rot); o.scale.setScalar(s); }
function place(o, v, rot = [0, 0, 0], s = 1) { scene.add(o); o.visible = true; o.position.copy(v); o.rotation.set(...rot); o.scale.setScalar(s); }
function reset() {
  CAST.forEach(p => { p.P.visible = false; });
  for (const o of PROPS) { scene.add(o); o.visible = false; o.rotation.set(0, 0, 0); o.scale.setScalar(1); }
  PLANE.userData.eat(0); SHOP.userData.pieces.forEach(p => p.visible = true); SHOP.userData.bar.scale.x = 1; COF.userData.handles.forEach(h => h.visible = true);
}
const camAt = (pos, look, fov = 45, focus, aper = 4, roll = 0) => ({ pos, look, fov, focus: focus ?? pos.distanceTo(look), aper, roll });
const hand = (c, t, a = 1) => { c.pos.x += noise(t, 1) * .012 * a; c.pos.y += noise(t, 2) * .01 * a; c.look.x += noise(t, 3) * .02 * a; c.look.y += noise(t, 4) * .016 * a; return c; };
const chew = (t, on = 1) => on ? clamp(.5 + .5 * Math.sin(t * 22)) : 0;
const EAT = { aR: [-128, 22, 0, 128], hd: [4, 0, 0] };   // hand to the mouth

// ---------------- places ----------------
const TB = V(0, 0, 4.0), SEAT = V(0, 0, 3.15);                 // the table on the apron; Michel faces +z, the plane behind him
const PL = V(0, 0, -4.2);                                      // the Cessna (nose to +x)
const STP = STO.clone().add(V(0, .8, .6));                      // on stage
const BEN = SHO.clone().add(V(0, 0, .45));                      // at the bench (facing -z)
const ROW = [-4.2, -1.4, 1.2, 3.6];                            // the tally piles along x (studio)
const XR = CLO.clone().add(V(-.6, 1.95, -2.2));                 // the X-ray
const HST = HAO.clone().add(V(0, .5, .6));                      // on the records stage

const SHOTS = [];
const sh = o => SHOTS.push(o);
// 1a · This man ate an entire airplane.: at his dinner table on the apron, the plane parked behind him
sh({ t0: 0, set: 'field', lt: SUNNY, at: TB, act: t => actDinner(t, 0),
  cam: (t, u) => { const k = eio(u); return hand(camAt(TB.clone().add(V(lerp(1.8, .7, k), lerp(2.5, 1.75, k), lerp(4.2, 2.2, k))), TB.clone().add(V(lerp(-.6, 0, k), lerp(1.5, 1.25, k), lerp(-3.4, -.9, k))), 50, 3.4, 2), t); } });
// 1b · Not a bite. The whole plane.: wide; the plane goes, part by part
sh({ t0: tNot1 - .1, set: 'field', lt: SUNNY, at: PL, act: t => actDinner(t, eio(seg(t, tNot1, tWhole + .5))),
  cam: (t, u) => hand(camAt(TB.clone().add(V(lerp(4.2, 4.6, u), 2.4, lerp(6.4, 7.0, u))), PL.clone().add(V(.6, 1.2, 2.6)), 50, 9, 1), t, .6) });
// 2a · Michel Lotito was a French entertainer: on stage, in the spotlight
sh({ t0: C2, set: 'stage', lt: THEATRE, at: STP, act: t => actStage(t),
  cam: (t, u) => hand(camAt(STP.clone().add(V(lerp(1.2, .8, u), lerp(.6, .55, u), lerp(6.5, 5.4, eo(u)))), STP.clone().add(V(0, 1.15, 0)), 40, 5.8, 2), t) });
// 2b · who could eat metal.: close, the fork going in
sh({ t0: tEat2 - .25, set: 'stage', lt: THEATRE, at: STP, act: t => actStage(t), after: 1,
  cam: (t, u) => { const h = headOf(MICHEL); return hand(camAt(h.clone().add(V(lerp(.45, .35, u), -.05, lerp(1.45, 1.25, u))), h.clone().add(V(.02, -.05, 0)), 38, 1.4, 6), t, .5); } });
// 3a · He cut it into tiny pieces,: the hacksaw at the vise
sh({ t0: C3, set: 'shop', lt: INSIDE, at: SHO, act: t => actShop(t),
  cam: (t, u) => hand(camAt(SHO.clone().add(V(lerp(1.7, 1.5, u), lerp(1.45, 1.4, u), lerp(.5, .35, u))), SHO.clone().add(V(-.45, 1.12, -.25)), 46, 2.0, 4), t) });
// 3b · drank mineral oil, and washed it down with water.: Michel drinking
sh({ t0: tDrank - .15, set: 'shop', lt: INSIDE, at: SHO, act: t => actShop(t), after: 1,
  cam: (t, u) => { const h = headOf(MICHEL); return hand(camAt(h.clone().add(V(lerp(.7, .6, u), -.15, lerp(1.6, 1.4, u))), h.clone().add(V(.05, -.15, 0)), 40, 1.7, 5), t, .5); } });
// 3c · Up to two pounds a day.: the scale
sh({ t0: tUp3 - .15, set: 'shop', lt: INSIDE, at: SHO, act: t => actShop(t),
  cam: (t, u) => hand(camAt(SHO.clone().add(V(lerp(.75, .65, u), lerp(1.35, 1.3, u), lerp(.55, .45, u))), SHO.clone().add(V(.55, .98, -.45)), 40, .75, 7), t, .5) });
// 4a · He ate 18 bicycles. 15 shopping carts. 7 TVs.: trucking along the tally
sh({ t0: C4, set: 'studio', lt: STUDIO, at: SDO, act: t => actTally(t),
  cam: (t, u) => { const x = lerp(ROW[0] - .3, ROW[2] + .6, eio(seg(t, C4 + .1, tCoffin - .2))); return hand(camAt(SDO.clone().add(V(x + .4, 2.2, 5.6)), SDO.clone().add(V(x, 1.0, 0)), 46, 5.8, 2), t, .6); } });
// 4b · And a coffin… handles and all.: Michel with the coffin, a handle in his teeth
sh({ t0: tCoffin - .15, set: 'studio', lt: STUDIO, at: SDO, act: t => actTally(t),
  cam: (t, u) => hand(camAt(SDO.clone().add(V(ROW[3] + lerp(.4, .2, u), lerp(1.6, 1.5, u), lerp(3.6, 3.0, eo(u)))), SDO.clone().add(V(ROW[3] + .3, 1.1, 0)), 44, 3.2, 3), t) });
// 5a · Then he started on a Cessna 150.: the plane, a slow orbit
sh({ t0: C5, set: 'field', lt: SUNNY, at: PL, act: t => actPlane(t),
  cam: (t, u) => { const a = lerp(.4, .9, u); return hand(camAt(PL.clone().add(V(Math.cos(a) * 9, 2.2, Math.sin(a) * 9)), PL.clone().add(V(.4, 1.3, 0)), 48, 9, 1), t, .6); } });
// 5b · A real airplane. Piece by piece.: Michel at the propeller with a wrench
sh({ t0: tReal - .1, set: 'field', lt: SUNNY, at: PL, act: t => actPlane(t),
  cam: (t, u) => hand(camAt(PL.clone().add(V(lerp(3.3, 3.4, u), 1.55, lerp(2.7, 2.4, u))), PL.clone().add(V(4.0, 1.3, .3)), 46, 2.3, 4), t) });
// 5c · It took him two years.: time-lapse; days and nights; the plane disappearing
sh({ t0: tTook - .1, set: 'field', lt: 'lapse', at: PL, act: t => actPlane(t),
  cam: (t, u) => camAt(PL.clone().add(V(4.2, 3.4, 10.5)), PL.clone().add(V(.2, 1.1, 0)), 50, 11, .8) });
// 6 · Doctors found his stomach walls were twice as thick as normal.: the X-ray
sh({ t0: C6, set: 'clinic', lt: INSIDE, at: CLO, act: t => actClinic(t),
  cam: (t, u) => hand(camAt(CLO.clone().add(V(lerp(1.2, .9, u), 1.75, lerp(1.6, 1.2, eo(u)))), CLO.clone().add(V(-.35, 1.6, -1.6)), 44, 2.6, 4), t) });
// 7a · Guinness gave him a brass plaque for the strangest diet in the world.: the ceremony
sh({ t0: C7, set: 'hall', lt: HALLL, at: HST, act: t => actHall(t),
  cam: (t, u) => hand(camAt(HST.clone().add(V(lerp(.8, .5, u), lerp(1.4, 1.35, u), lerp(4.4, 3.6, eo(u)))), HST.clone().add(V(0, 1.25, 0)), 44, 4, 3), t) });
// 7b · Legend says he ate that too.: the bite
sh({ t0: tLegend - .1, set: 'hall', lt: HALLL, at: HST, act: t => actHall(t), after: 1,
  cam: (t, u) => { const h = headOf(MICHEL); return hand(camAt(h.clone().add(V(lerp(.4, .3, u), -.08, lerp(1.4, 1.2, u))), h.clone().add(V(0, -.08, 0)), 38, 1.35, 6), t, .5); } });
// 8 · And the only foods that made him sick? Bananas… and hard-boiled eggs.: back at the table
sh({ t0: C8, set: 'field', lt: SUNNY, at: TB, act: t => actSick(t),
  cam: (t, u) => hand(camAt(TB.clone().add(V(lerp(.5, .35, u), lerp(1.6, 1.55, u), lerp(1.9, 1.6, eo(u)))), TB.clone().add(V(0, 1.18, -.75)), 40, 1.9, 5), t, .5) });
// 9 · What's the weirdest thing you've ever eaten?: fork and knife up, looking at us; the empty apron behind
sh({ t0: C9, set: 'field', lt: SUNNY, at: TB, act: t => actAsk(t),
  cam: (t, u) => hand(camAt(TB.clone().add(V(lerp(.25, .35, u), lerp(1.6, 1.65, u), lerp(1.7, 2.0, u))), TB.clone().add(V(0, 1.25, -.85)), 42, 2.3, 4), t, .5) });
SHOTS.forEach((s, i) => { s.t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : LOOP; });
SHOTS.push({ ...SHOTS[0], t0: LOOP, t1: DUR + 1, loop: 1 });

// ---------------- acting ----------------
function diner(t, o = {}) {
  place(TABLE, TB, [0, Math.PI, 0]);
  put(MICHEL, SEAT, 0);
  apply(MICHEL, { ...TP.sit, y: -.06, ...(o.pose ?? { aL: [-60, 20, 0, 70], aR: [-60, 20, 0, 70] }) }, { t, seed: 1, face: o.face ?? 'happy', look: o.look ?? CAMP, talk: o.talk ?? 0 });
  if (o.cutlery !== false) { onHand(MICHEL, FORK, 1, [0, -.02, .05], [-2.6, 0, 0], 1.2); onHand(MICHEL, KNIFE, 0, [0, -.02, .05], [-2.6, 0, 0], 1.2); }
}
function actDinner(t, eaten) {
  reset(); place(PLANE, PL); PLANE.userData.eat(eaten); PLANE.userData.blades.rotation.x = 0;
  const full = eaten >= 1;
  diner(t, { face: full ? 'proud' : eaten > 0 ? 'laugh' : 'happy', talk: eaten > 0 && !full ? chew(t) : 0, pose: full ? { aL: [-20, 30, 0, 100], aR: [-20, 30, 0, 100] } : undefined, cutlery: !full });
}
function actStage(t) {
  reset(); spot.position.copy(STO.clone().add(V(0, 10, 6))); spot.target.position.copy(STP);
  put(MICHEL, STP, 0);
  const biting = t > tEat2 - .2;
  apply(MICHEL, biting ? { ...TP.stand, ...EAT } : TP.present, { t, seed: 1, face: biting ? 'laugh' : 'proud', look: CAMP, talk: biting ? chew(t) : 0 });
  onHand(MICHEL, FORK2, 0, [0, -.02, .06], biting ? [-1.4, 0, 0] : [0, 0, 0], 1.6);
}
function actShop(t) {
  reset();
  put(MICHEL, BEN, Math.PI);
  const sawing = t < tDrank - .15, drinkingOil = t >= tDrank - .15 && t < tWashed - .1, drinkingWater = t >= tWashed - .1 && t < tUp3 - .15;
  const k = seg(t, C3 + .1, tDrank - .2), pcs = SHOP.userData.pieces; SHOP.userData.bar.scale.x = 1 - .7 * k; pcs.forEach((p, i) => p.visible = i < 12 + 28 * k);
  if (sawing) { const s = Math.sin(t * 16) * .06; apply(MICHEL, { ...TP.stand, sp: [18, 0, 0], hd: [20, 0, 0], aR: [-62, 4, 0, 40], aL: [-60, -10, 0, 70] }, { t, seed: 1, face: 'proud', look: SHO.clone().add(V(-.4, 1.1, -.5)), eyes: [0, -.6] }); onHand(MICHEL, SAW, 0, [0, -.02, .04 + s], [-1.2, 0, 0]); }
  else { MICHEL.P.rotation.y = Math.PI + 2.6; MICHEL.P.updateMatrixWorld(true);
    apply(MICHEL, { ...TP.stand, aR: [-140, 20, 0, 120], hd: [-14, 0, 0] }, { t, seed: 1, face: drinkingOil ? 'deadpan' : 'happy', look: CAMP, talk: 0 });
    if (drinkingOil) onHand(MICHEL, OIL, 0, [0, -.02, .05], [-2.2, 0, 0], 1.4); else if (drinkingWater) onHand(MICHEL, GLASS, 0, [0, -.02, .05], [-2.2, 0, 0], 1.5);
    else { apply(MICHEL, { ...TP.hips }, { t, seed: 1, face: 'proud', look: CAMP }); } }
  place(SCALE, SHO.clone().add(V(.55, .96, -.45)), [0, -.3, 0], 1.6);
  SCALE.userData.show(t >= tUp3 - .15 ? `${(lerp(0, .9, eo(seg(t, tUp3 - .1, tTwo3 + .4)))).toFixed(1)} KG` : '0.0 KG');
}
function actTally(t) {
  reset();
  // the piles pop in on their words; each stacks a little
  const pop = (t0, i, n) => back(seg(t, t0 - .05 + i / n * .5, t0 + .2 + i / n * .5), 2.2);
  BIKES.forEach((b, i) => { const k = pop(t18, i, 18); if (k <= 0) return; const r = Math.floor(i / 6), c = i % 6; place(b, SDO.clone().add(V(ROW[0] - 1.2 + c * .45, r * .55, -.4 + r * .25)), [0, Math.PI / 2 + (hash(i) - .5) * .4, (hash(i * 3) - .5) * .25], k * .95); });
  CARTS.forEach((c2, i) => { const k = pop(t15, i, 15); if (k <= 0) return; const r = Math.floor(i / 5), c = i % 5; place(c2, SDO.clone().add(V(ROW[1] - 1.0 + c * .5, r * .9, -.5 + r * .2)), [0, .1 * (c - 2), 0], k); });
  TVS.forEach((v, i) => { const k = pop(t7, i, 7); if (k <= 0) return; const r = i < 4 ? 0 : 1, c = r ? i - 4 : i; place(v, SDO.clone().add(V(ROW[2] - .9 + c * .62 + r * .3, r * .5, 0)), [0, (hash(i) - .5) * .3, 0], k); });
  const kc = back(seg(t, tCoffin - .1, tCoffin + .2), 2.2); if (kc > 0) place(COF, SDO.clone().add(V(ROW[3] + .85, 1.0 * kc, -.2)), [Math.PI / 2, 0, -.15], kc);
  const mp = SDO.clone().add(V(ROW[3] - .1, 0, .7)); put(MICHEL, mp, -.3);
  const biting = t > tHandles - .15;
  apply(MICHEL, biting ? { ...TP.stand, ...EAT } : TP.present, { t, seed: 1, face: biting ? 'laugh' : 'proud', look: CAMP, talk: biting ? chew(t) : 0 });
  if (biting) COF.userData.handles[0].visible = false;
}
function actPlane(t) {
  reset(); place(PLANE, PL);
  const lapse = seg(t, tTook - .1, LN.L5.t1 + .3);
  PLANE.userData.eat(t < tPiece ? 0 : t < tTook - .1 ? 1 / 12 : lerp(1 / 12, 1, lapse));
  PLANE.userData.blades.rotation.x = t > tReal ? Math.min(t - tReal, .6) * 3 : 0;
  if (t >= tReal - .1 && t < tTook - .1) {   // at the prop with a wrench
    const mp = PL.clone().add(V(4.3, 0, -.85)); put(MICHEL, mp, face(mp, PL.clone().add(V(3.7, 0, .1))));
    apply(MICHEL, { ...TP.stand, aR: [-100, 10, 0, 60] }, { t, seed: 1, face: 'proud', look: PL.clone().add(V(3.6, 1.25, 0)) }); onHand(MICHEL, WRENCH, 0, [0, -.02, .04], [-1.4 + Math.sin(t * 9) * .3, 0, 0], 1.6);
  } else if (t >= tTook - .1) {   // the lapse: Michel jittering about the plane
    const k = Math.floor(lapse * 14), mp = PL.clone().add(V(-3 + (k % 7), 0, 1.8 + (k % 2) * .6)); put(MICHEL, mp, face(mp, PL));
    apply(MICHEL, { ...TP.stand, ...EAT }, { t, seed: 1, face: 'laugh', look: PL, talk: chew(t) });
  }
}
function actClinic(t) {
  reset();
  const dp = CLO.clone().add(V(.25, 0, -1.5)); put(DOC, dp, face(dp, XR) + .4);
  apply(DOC, t > tTwice - .2 ? { ...TP.stand, aR: [-100, 10, 0, 4] } : TP.stand, { t, seed: 30, face: t > tTwice ? 'shock' : 'calm', look: t > tTwice + .4 ? CAMP : XR });
  const mp = CLO.clone().add(V(-1.6, 0, -1.0)); put(MICHEL, mp, face(mp, XR) + .5);
  apply(MICHEL, t > tTwice ? TP.hips : TP.stand, { t, seed: 1, face: t > tTwice ? 'proud' : 'happy', look: XR });
}
function actHall(t) {
  reset();
  const mp = HST.clone().add(V(-.45, 0, 0)), hp = HST.clone().add(V(.75, 0, -.2)); put(MICHEL, mp, .25); put(HOST, hp, -.6);
  const handed = t > tPlaque - .1, biting = t > tAte7 - .25;
  apply(HOST, handed ? { ...TP.stand, aR: [-20, 30, 0, 20] } : { ...TP.stand, aR: [-80, 10, 0, 40], aL: [-80, -10, 0, 40] }, { t, seed: 31, face: biting ? 'shock' : 'happy', look: headOf(MICHEL) });
  const plq = (p, off, roll = 0) => { p.P.updateMatrixWorld(true); place(PLAQ, p.aR.hand.getWorldPosition(V()).add(off), [0, 0, 0], .9); PLAQ.lookAt(CAMP); PLAQ.rotateZ(roll); };
  if (!handed) { apply(HOST, { ...TP.stand, aR: [-80, 10, 0, 40], aL: [-80, -10, 0, 40] }, { t, seed: 31, face: 'happy', look: headOf(MICHEL) }); plq(HOST, V(0, .12, .1)); }
  else { apply(MICHEL, biting ? { ...TP.stand, ...EAT } : TP.holdUp, { t, seed: 1, face: biting ? 'laugh' : 'proud', look: CAMP, talk: biting ? chew(t) : 0 }); if (biting) { place(PLAQ, headOf(MICHEL).add(V(.2, -.14, .16)), [0, 0, 0], .8); PLAQ.lookAt(CAMP); PLAQ.rotateZ(.55); } else plq(MICHEL, V(0, .2, .05)); return; }
  apply(MICHEL, TP.stand, { t, seed: 1, face: 'happy', look: headOf(HOST) });
}
function actSick(t) {
  reset(); place(PLANE, PL); PLANE.userData.eat(1);
  const banana = t >= tBananas - .1 && t < tEggs - .1, eggT = t >= tEggs - .1;
  diner(t, { cutlery: false, face: banana ? 'worried' : eggT ? 'shock' : 'calm', look: CAMP, pose: { aR: banana || eggT ? [-90, 20, 0, 100] : [-60, 20, 0, 70], aL: [-60, 20, 0, 70] } });
  if (banana) onHand(MICHEL, BAN, 0, [0, -.02, .05], [0, 0, .4], 2.0); if (eggT) onHand(MICHEL, EGG, 0, [0, -.02, .05], [0, 0, 0], 2.0);
}
function actAsk(t) {
  reset(); place(PLANE, PL); PLANE.userData.eat(1);
  diner(t, { face: 'smug', look: CAMP, pose: { aL: [-110, 30, 0, 60], aR: [-110, 30, 0, 60] } });
}

// ---------------- sound events (the score reads these) ----------------
ev(0, 'wind', { d: C2 }); ev(.05, 'boom'); ev(tAirplane, 'hit'); ev(tNot1, 'crunch', { d: tWhole + .6 - tNot1 }); ev(tWhole + .55, 'burp');
ev(C2, 'applause', { d: tEat2 - C2 }); ev(tEat2, 'crunch', { d: 1.2 }); ev(tMetal, 'gasp');
ev(C3, 'saw', { d: tDrank - C3 }); ev(tOil, 'glug', { d: .7 }); ev(tWater, 'glug', { d: .6 }); ev(tTwo3, 'ding');
ev(t18, 'pop'); ev(t15, 'pop'); ev(t7, 'pop'); ev(tCoffin, 'thud'); ev(tHandles, 'crunch', { d: .8 });
ev(C5, 'birds', { d: tTook - C5 }); ev(tCessna, 'hit'); ev(tPiece, 'ratchet'); ev(tTook, 'lapse', { d: C6 - tTook }); ev(tYears, 'crunch', { d: .8 });
ev(C6, 'hum', { d: C7 - C6 }); ev(tTwice, 'ding');
ev(C7, 'applause', { d: tLegend - C7 }); ev(tPlaque, 'sparkle'); ev(tAte7, 'crunch', { d: .9 });
ev(C8, 'birds', { d: DUR - C8 }); ev(tBananas, 'boing'); ev(tEggs + .2, 'boing'); ev(LOOP - 1.0, 'sting');

// ---------------- the overlay: telops, the tally, captions ----------------
const ov = document.getElementById('ov').getContext('2d');
const TEL = [
  { t0: tAirplane - .05, t1: tNot1 - .1, text: 'HE ATE THIS ✈', y: 300, size: 120, col: '#FFFFFF', rot: -4, plate: '#C8283A' },
  { t0: tWhole - .05, t1: C2, text: '100% OF IT', y: 300, size: 140, col: '#FFD23F', rot: -5, plate: '#16131A' },
  { t0: tMichel - .05, t1: tEat2 - .25, text: 'MICHEL LOTITO', y: 1500, size: 90, col: '#FFFFFF', rot: -2, plate: '#2A3A7A', sub: '"MONSIEUR MANGETOUT" · FRANCE' },
  { t0: tMetal - .05, t1: C3, text: 'EATS METAL', y: 300, size: 140, col: '#FFFFFF', rot: -4, plate: '#C8283A' },
  { t0: tTiny - .05, t1: tDrank - .15, text: 'STEP 1: TINY PIECES', y: 300, size: 84, col: '#FFFFFF', rot: -3, plate: '#2E7FE0' },
  { t0: tOil - .1, t1: tWashed - .1, text: 'STEP 2: MINERAL OIL', y: 300, size: 84, col: '#16131A', rot: 3, plate: '#F2C230' },
  { t0: tWater - .1, t1: tUp3 - .15, text: 'STEP 3: WATER', y: 300, size: 96, col: '#FFFFFF', rot: -3, plate: '#2E9A9A' },
  { t0: tTwo3 - .05, t1: C4, text: '≈ 2 LB A DAY', y: 300, size: 130, col: '#FFFFFF', rot: -4, plate: '#16131A' },
  { t0: tCessna - .05, t1: tReal - .1, text: 'CESSNA 150', y: 300, size: 130, col: '#FFFFFF', rot: -4, plate: '#2E5AA8' },
  { t0: tPiece - .05, t1: tTook - .1, text: 'PIECE BY PIECE', y: 300, size: 110, col: '#16131A', rot: 3, plate: '#F2C230' },
  { t0: tTook - .05, t1: C6, text: t => String(Math.min(1980, 1978 + Math.floor(seg(t, tTook, LN.L5.t1 + .2) * 2.999))), y: 300, size: 170, col: '#FFFFFF', rot: -4, plate: '#16131A', sub: '2 YEARS' },
  { t0: tTwice - .05, t1: C7, text: '2× THICKER', y: 300, size: 140, col: '#FFFFFF', rot: -4, plate: '#C8283A' },
  { t0: tStrangest - .05, t1: tLegend - .1, text: 'STRANGEST DIET 🏆', y: 300, size: 100, col: '#FFD24A', rot: -3, plate: '#16131A' },
  { t0: tLegend - .05, t1: C8, text: 'LEGEND SAYS…', y: 300, size: 120, col: '#FFFFFF', rot: -4, plate: '#7A2E8E' },
  { t0: tBananas - .05, t1: tEggs - .1, text: '🍌 = 🤢', y: 300, size: 150, col: '#FFFFFF', rot: -4, plate: '#3E9A3A' },
  { t0: tEggs - .05, t1: C9, text: '🥚 = 🤢', y: 300, size: 150, col: '#FFFFFF', rot: 4, plate: '#3E9A3A' },
  { t0: tWhats - .05, t1: LOOP, text: 'COMMENT 👇', y: 300, size: 140, col: '#FFD23F', rot: -5, plate: '#16131A' },
];
function drawTelop(x, t) {
  const p = seg(t, x.t0, x.t0 + .25), sc = x.stamp ? lerp(2.2, 1, eo(p)) : back(p, 2.6), wob = 1 + .02 * Math.sin((t - x.t0) * 8);
  const text = typeof x.text === 'function' ? x.text(t) : x.text;
  ov.save(); ov.translate(x.x ?? 540, x.y); ov.rotate(x.rot * Math.PI / 180); ov.scale(sc * wob, sc * wob);
  ov.font = `900 ${x.size}px Montserrat`; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  const tw = Math.min(1000, ov.measureText(text).width + 70), th = x.size * 1.4;
  if (x.plate) { ov.fillStyle = 'rgba(0,0,0,.85)'; ov.beginPath(); ov.roundRect(-tw / 2 + 10, -th / 2 + 12, tw, th, 28); ov.fill(); ov.fillStyle = x.plate; ov.beginPath(); ov.roundRect(-tw / 2, -th / 2, tw, th, 28); ov.fill(); }
  ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 20; ov.shadowOffsetY = 8; ov.lineWidth = x.size * .2; ov.strokeStyle = x.plate === '#F2C230' ? '#FFFFFF' : '#000'; if (x.plate !== '#F2C230') ov.strokeText(text, 0, 4, 960); ov.shadowColor = 'transparent'; ov.fillStyle = x.col; ov.fillText(text, 0, 4, 960);
  if (x.sub) { ov.font = '900 44px Montserrat'; const sw = ov.measureText(x.sub).width + 44; ov.fillStyle = '#FFD23F'; ov.beginPath(); ov.roundRect(-sw / 2, x.size * .7 + 4, sw, 62, 16); ov.fill(); ov.fillStyle = '#1B1213'; ov.fillText(x.sub, 0, x.size * .7 + 37); }
  ov.restore();
}
// the tally: counters for each pile as it lands
function drawTally(t) {
  if (t < C4 || t >= C5) return;
  [['🚲', 18, t18], ['🛒', 15, t15], ['📺', 7, t7], ['⚰️', 1, tCoffin]].forEach(([e, n, x], i) => { const k = back(seg(t, x - .05, x + .2), 2.2); if (k <= 0) return; const cnt = Math.round(lerp(1, n, eo(seg(t, x, x + .45))));
    ov.save(); ov.translate(270 + (i % 2) * 540, 230 + Math.floor(i / 2) * 150); ov.scale(k, k); ov.fillStyle = 'rgba(0,0,0,.8)'; ov.beginPath(); ov.roundRect(-210, -52, 430, 112, 30); ov.fill(); ov.fillStyle = '#FBF6E6'; ov.beginPath(); ov.roundRect(-220, -60, 430, 112, 30); ov.fill();
    ov.font = '900 76px Montserrat'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.fillStyle = '#16131A'; ov.fillText(`${e} × ${cnt}`, -5, 2, 400); ov.restore(); });
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
  let lt = sh.lt;
  if (lt === 'lapse') { const k = seg(tt, tTook, LN.L5.t1 + .3), d = .5 + .5 * Math.cos(k * Math.PI * 2 * 5); lt = mixLT(NIGHTF, SUNNY, d); }
  light(lt, sh.at);
  for (const s of Object.values(SETS)) s.visible = false; SETS[sh.set].visible = true;
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
  if (QS.get('poster')) { ov.clearRect(0, 0, W, H); [['HE ATE A', 200, -4, '#FFFFFF', 140, '#C8283A'], ['WHOLE PLANE ✈', 380, -4, '#FFD23F', 120, '#16131A']].forEach(([text, y, rot, col, size, plate]) => drawTelop({ t0: -9, text, y, size, col, rot, plate }, t)); return; }
  if (QS.get('clean')) return;
  if (t < LOOP) { TEL.forEach(x => { if (t >= x.t0 && t < x.t1) drawTelop(x, t); }); drawTally(t); drawCaption(t); }
}
function texts(t) { if (t >= LOOP) return []; return TEL.filter(x => typeof x.text === 'string' && t >= x.t0 + .3 && t < x.t1).map(x => ({ id: x.text, text: x.text, x0: 60, y0: x.y - x.size * .7, x1: 1020, y1: x.y + x.size * .7 })); }
EV.sort((a, b) => a.t - b.t);
window.SHOTLIST = SHOTS.map(s => [+s.t0.toFixed(3), +s.t1.toFixed(3), null]);
window.DUR = +(B0 - A0).toFixed(3); window.EV = EV; window.render = t => render(t + A0); window.TEXTS = t => texts(t + A0);
render(A0);
window.READY = true;
