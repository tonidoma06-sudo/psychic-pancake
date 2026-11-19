// "The Man in the Box" · 3D vertical Short (1080×1920), reference style: flat 2D characters in physically lit 3D sets.
// 1964: Reg Spiers, an Australian javelin thrower stuck and broke in London, wanted to be home for his daughter's birthday.
// A friend nailed him into a crate shipped as air cargo, cash on delivery; inside: a pillow, a flashlight, canned food, a bottle.
// 63 hours later the crate landed in Perth; he climbed out, walked out of the airport and made it home.
// Everything is placed from timing.json (the voice). Single-word captions, few plates, hard cuts, gentle pushes.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makePost } from '/core/three/post.js';
import { makeToon, apply, TP, walk, CHAR_TINT } from './toon.js';
import { crate, bedsit, londonStreet, field, warehouse, airliner, clouds, perth, home } from './sets_box.js';
import { skyDome } from './sky.js';

const W = 1080, H = 1920;
await document.fonts.load('900 80px Montserrat'); await document.fonts.load('800 80px Montserrat'); await document.fonts.load('700 80px Fredoka');
const TMJ = await (await fetch('timing.json')).json();
const DUR = TMJ.dur, LOOP = DUR;
const LN = Object.fromEntries(TMJ.lines.map(l => [l.id, l]));
const nrm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const w = (lid, word, k = 0) => { const ws = LN[lid].words.filter(x => nrm(x.w) === nrm(word) || nrm(x.w).startsWith(nrm(word)) && nrm(word).length > 2); return (ws[k] || ws[ws.length - 1] || { t0: LN[lid].t0 }).t0; };
const cut = id => { const i = TMJ.lines.findIndex(l => l.id === id), pv = TMJ.lines[i - 1], l = LN[id]; return pv ? Math.max(l.cut, Math.min(pv.t1 + .06, l.t0 - .02)) : l.cut; };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), lerp = (a, b, u) => a + (b - a) * u;
const eo = u => 1 - Math.pow(1 - u, 3), eio = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2, back = (u, s = 1.7) => { u = clamp(u) - 1; return 1 + u * u * ((s + 1) * u + s); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const noise = (t, k) => Math.sin(t * 1.7 + k) * .6 + Math.sin(t * 3.1 + k * 2.3) * .3 + Math.sin(t * 5.3 + k * .7) * .1;
const EV = []; const ev = (t, s, o = {}) => EV.push({ t: +t.toFixed(3), s, ...o });
const QS = new URLSearchParams(location.search);

// ---------------- renderer / post ----------------
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
const camera = new THREE.PerspectiveCamera(45, W / H, .02, 3000);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, ao: false });
post.bloom.strength = .3; post.bloom.threshold = .97; post.bloom.radius = .55;
const vg = post.vig.uniforms; vg.amt.value = .26; vg.sat.value = 1.28; vg.contrast.value = .14;
const sun = new THREE.DirectionalLight('#FFF4E0', 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
scene.add(sun, sun.target); const hemi = new THREE.HemisphereLight('#BFDFFF', '#4A6A2A', 1); scene.add(hemi);
const sky = skyDome('#2A78E0', '#E8E2D6', V(-.4, .5, .6), '#FFF6D8'); scene.add(sky);
// lighting presets (+ tint: the colour the flat characters are multiplied by, to sit in each mood)
const CRATE_DARK = { pos: [2, 4, 3], col: '#5A6AB0', int: .25, hs: '#3A4A8A', hg: '#1A1420', hemi: .35, env: .05, r: 4, bg: '#06070C', warm: .1, sat: 1.25, tint: '#F2D2AE' };
const RAIN = { pos: [-10, 14, 12], col: '#C8D4E8', int: 1.0, hs: '#9AA8C8', hg: '#3A3E48', hemi: .9, fog: ['#7A8498', 18, 70], sky: ['#4A5468', '#8A94A8', [-.4, .3, .6], '#C8D0E0'], env: .3, r: 14, warm: 0, sat: 1.18, tint: '#E2E6EE' };
const FIELD = { pos: [-18, 30, 20], col: '#FFF1DA', int: 2.6, hs: '#C8E0FF', hg: '#7A9A4A', hemi: 1.1, fog: ['#CFE4F2', 80, 300], sky: ['#2A78E0', '#E4EEF2', [-.4, .5, .6], '#FFF6D8'], env: .4, r: 12, warm: .1, sat: 1.3, tint: '#F6F2EA' };
const BEDSIT = { pos: [1.5, 3, 2.5], col: '#B8C4D8', int: .9, hs: '#8A98B8', hg: '#6A4A3A', hemi: .8, env: .25, r: 4, bg: '#2A2E38', warm: .05, sat: 1.15, tint: '#E8E4E0' };
const DUSKIN = { pos: [1, 3, -6], col: '#FFB070', int: 1.6, hs: '#8A80C8', hg: '#6A5A4A', hemi: .8, env: .25, r: 7, bg: '#2A2430', warm: .18, sat: 1.3, tint: '#F4DCC4' };
const NIGHTIN = { pos: [-2, 5, 2], col: '#8A98E0', int: .5, hs: '#4A5AA8', hg: '#2A2430', hemi: .55, env: .1, r: 7, bg: '#0C0E18', warm: 0, sat: 1.2, tint: '#C8CCE8' };
const HIGH = { pos: [-20, 30, 24], col: '#FFFFFF', int: 3.0, hs: '#D8ECFF', hg: '#E8F0F8', hemi: 1.2, fog: ['#BFD8F0', 120, 900], sky: ['#0E4AB8', '#9CC8F0', [-.4, .45, .6], '#FFFFFF'], env: .4, r: 14, warm: 0, sat: 1.25, tint: '#F4F4F4' };
const PERTHD = { pos: [-20, 34, 18], col: '#FFF0D0', int: 3.0, hs: '#BFE0FF', hg: '#B8A888', hemi: 1.15, fog: ['#D8E8F4', 70, 260], sky: ['#1E70D8', '#D8EEFA', [-.4, .55, .5], '#FFF8E0'], env: .4, r: 16, warm: .14, sat: 1.32, tint: '#F6EEE2' };
const PERTHN = { pos: [-20, 14, 18], col: '#FF9A5A', int: 1.6, hs: '#9A88C8', hg: '#5A4A6A', hemi: .8, fog: ['#B88AB0', 40, 200], sky: ['#2A2A6A', '#F2905A', [-.7, .12, -.6], '#FFD08A'], env: .3, r: 16, warm: .16, sat: 1.3, tint: '#F2D8C4' };
const HOME = { pos: [-2, 4, 2], col: '#FFE8C0', int: 1.6, hs: '#FFE8D0', hg: '#C8A06A', hemi: 1.0, env: .4, r: 5, bg: '#F4E4B8', warm: .12, sat: 1.3, tint: '#F6EEE4' };
function light(o, at) {
  sun.color.set(o.col); sun.intensity = o.int; sun.position.set(at.x + o.pos[0], at.y + o.pos[1], at.z + o.pos[2]); sun.target.position.copy(at);
  const c = sun.shadow.camera, r = o.r ?? 8; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = .5; c.far = 150; c.updateProjectionMatrix();
  hemi.color.set(o.hs); hemi.groundColor.set(o.hg); hemi.intensity = o.hemi;
  scene.fog = o.fog ? new THREE.Fog(o.fog[0], o.fog[1], o.fog[2]) : null;
  if (o.sky) { sky.visible = true; scene.background = null; const u = sky.material.uniforms; u.top.value.set(o.sky[0]); u.hor.value.set(o.sky[1]); u.sd.value.set(...o.sky[2]).normalize(); u.sc.value.set(o.sky[3]); }
  else { sky.visible = false; scene.background = new THREE.Color(o.bg ?? '#2A2A30'); }
  CHAR_TINT.value.set(o.tint ?? '#F4F4F4'); scene.environmentIntensity = o.env ?? .35; vg.warm.value = o.warm ?? .1; vg.sat.value = o.sat ?? 1.28;
}

// ---------------- sets (far apart) ----------------
const BO = V(0, 0, 0), BED = bedsit(); scene.add(BED);
const LO = V(300, 0, 0), LON = londonStreet(); LON.position.copy(LO); scene.add(LON);
const FO = V(-300, 0, 0), FLD = field(); FLD.position.copy(FO); scene.add(FLD);
const WO = V(0, 0, 300), WH = warehouse(); WH.position.copy(WO); scene.add(WH);
const PO = V(0, 0, -300), PER = perth(); PER.position.copy(PO); scene.add(PER);
const HO = V(300, 0, 300), HOM = home(); HOM.position.copy(HO); scene.add(HOM);
const SKO = V(0, 1200, 0), CLD = clouds(); CLD.position.copy(SKO); scene.add(CLD);
const SETS = { bedsit: [BED], london: [LON], field: [FLD], ware: [WH], perth: [PER], home: [HOM], sky: [CLD] };
const BUS = LON.userData.bus, FORK = WH.userData.forklift, FORKS = WH.userData.forks, TUG = PER.userData.tug;

// ---------------- cast (flat 2D characters) ----------------
const mk = o => { const p = makeToon({ shoe: '#3A2A1E', ...o }); scene.add(p.P); return p; };
const REG = mk({ name: 'reg', outfit: 'polo', top: '#1E7A3A', pants: '#1E5A2E', hair: 'messy', hairC: '#6A4A2E', shoe: '#F4F1EA', belt: '#F2C230', seed: 3 });
const JOHN = mk({ name: 'john', outfit: 'suit', top: '#8A7A64', pants: '#5A4E40', tie: '#2E5A3A', hair: 'flatcap', hatC: '#5A4A3A', hairC: '#C8743A', mustache: '#C8743A', seed: 5 });
const GIRL = mk({ name: 'girl', H: .62, outfit: 'tee', top: '#F2799A', pants: '#F2799A', hair: 'buns', hairC: '#6A4A2E', bowC: '#E8423A', lashes: 1, blush: 1, shoe: '#E8423A', seed: 6 });
const DRIVER = mk({ name: 'driver', outfit: 'overalls', top: '#2E6FB5', pants: '#2E6FB5', hair: 'peak', hatC: '#1E3A6E', bandC: '#F2C230', seed: 7 });
const CAST = [REG, JOHN, GIRL, DRIVER];

// ---------------- props ----------------
const CR = crate(); scene.add(CR); const CRS = 1.3; CR.scale.setScalar(CRS);   // the crate, a bit bigger than life (for him to fit)
const PLANE = airliner('#C8283A'); scene.add(PLANE);
const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: .6 });
const HAMMER = new THREE.Group(); { const h = new THREE.Mesh(new THREE.CylinderGeometry(.012, .014, .3, 8), mat('#8A5A34')); h.position.y = -.1; HAMMER.add(h); const hd = new THREE.Mesh(new THREE.BoxGeometry(.11, .04, .04), mat('#4A4E58')); hd.position.y = .06; HAMMER.add(hd); } scene.add(HAMMER);
const JAV = new THREE.Group(); { const s = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, 2.4, 8), mat('#F2C230')); s.rotation.z = Math.PI / 2; JAV.add(s); const tip = new THREE.Mesh(new THREE.ConeGeometry(.014, .14, 8), mat('#C8CCD4')); tip.rotation.z = -Math.PI / 2; tip.position.x = 1.27; JAV.add(tip); const gr = new THREE.Mesh(new THREE.CylinderGeometry(.013, .013, .2, 8), mat('#2A2A30')); gr.rotation.z = Math.PI / 2; JAV.add(gr); } scene.add(JAV);
const WALLET = new THREE.Group(); { const a = new THREE.Mesh(new THREE.BoxGeometry(.1, .08, .008), mat('#6A3A1E')); a.position.x = -.05; a.rotation.y = .5; WALLET.add(a); const b = new THREE.Mesh(new THREE.BoxGeometry(.1, .08, .008), mat('#6A3A1E')); b.position.x = .05; b.rotation.y = -.5; WALLET.add(b); } scene.add(WALLET);
const PHOTO = BED.userData.photo;
const CAN = new THREE.Group(); { const c = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .08, 16), mat('#C8CCD4')); CAN.add(c); const l = new THREE.Mesh(new THREE.CylinderGeometry(.036, .036, .05, 16), mat('#E8423A')); CAN.add(l); const sp = new THREE.Mesh(new THREE.CylinderGeometry(.004, .004, .12, 6), mat('#C8CCD4')); sp.position.set(.01, .07, 0); sp.rotation.z = .3; CAN.add(sp); } scene.add(CAN);
const HTORCH = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .16, 12), mat('#2A2A30')); b.rotation.x = Math.PI / 2; HTORCH.add(b); const l = new THREE.Mesh(new THREE.CircleGeometry(.024, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFF2C8').multiplyScalar(2), toneMapped: false })); l.position.z = .081; HTORCH.add(l); } scene.add(HTORCH);
const BOTTLE = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, .16, 16), new THREE.MeshStandardMaterial({ color: '#D8E8B8', roughness: .2, transparent: true, opacity: .85 })); BOTTLE.add(b); const n = new THREE.Mesh(new THREE.CylinderGeometry(.016, .03, .05, 12), mat('#D8E8B8')); n.position.y = .1; BOTTLE.add(n); } scene.add(BOTTLE);
const TORCHL = new THREE.SpotLight('#FFE8B8', 0, 4, .55, .5, 1.4); TORCHL.castShadow = false; scene.add(TORCHL, TORCHL.target);
const PROPS = [CR, PLANE, HAMMER, JAV, WALLET, CAN, HTORCH, BOTTLE];

// ---------------- key times ----------------
const C2 = cut('L2'), C3 = cut('L3'), C4 = cut('L4'), C5 = cut('L5');
const tMailed = w('L1', 'mailed'), tWorld = w('L1', 'world'), tWooden = w('L1', 'wooden'), tBox = w('L1', 'box');
const t1964 = w('L2', '1964'), tReg = w('L2', 'reg'), tJavelin = w('L2', 'javelin'), tThrower = w('L2', 'thrower'), tStuck = w('L2', 'stuck'), tLondon = w('L2', 'london'), tBroke = w('L2', 'broke'), tAnd2 = w('L2', 'and'), tDaughter = w('L2', 'daughters'), tBirthday = w('L2', 'birthday'), tComing = w('L2', 'coming');
const tFriend = w('L3', 'friend'), tNailed = w('L3', 'nailed'), tCrate3 = w('L3', 'crate'), tShipped = w('L3', 'shipped'), tAir = w('L3', 'air'), tCargo = w('L3', 'cargo'), tCash = w('L3', 'cash'), tDelivery = w('L3', 'delivery');
const tInside = w('L4', 'inside'), tPillow = w('L4', 'pillow'), tFlash = w('L4', 'flashlight'), tCanned = w('L4', 'canned'), tFood = w('L4', 'food'), tAnd4 = w('L4', 'and'), tBottle = w('L4', 'bottle'), tPee = w('L4', 'pee');
const t63 = w('L5', 'sixty'), tHours = w('L5', 'hours'), tThe5 = w('L5', 'the'), tLanded = w('L5', 'landed'), tPerth = w('L5', 'perth'), tHe5 = w('L5', 'he'), tClimbed = w('L5', 'climbed'), tWalked = w('L5', 'walked'), tAirport = w('L5', 'airport'), tAnd5 = w('L5', 'and'), tMade = w('L5', 'made'), tHome = w('L5', 'home');

// ---------------- helpers ----------------
const put = (p, v, ry = 0) => { p.P.visible = true; p.P.position.copy(v); p.P.rotation.set(0, ry, 0); p.P.updateMatrixWorld(true); };
const CAMP = new THREE.Vector3(0, 1.4, 6);
const headOf = p => { p.P.updateMatrixWorld(true); return p.head.getWorldPosition(V(0, 0, 0)); };
const handOf = (p, left = 0) => { p.P.updateMatrixWorld(true); return (left ? p.aL : p.aR).hand.getWorldPosition(V(0, 0, 0)); };
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
function onHand(p, o, left = 0, pos = [0, 0, 0], rot = [0, 0, 0], s = 1) { o.visible = true; (left ? p.aL : p.aR).props.add(o); o.position.set(...pos); o.rotation.set(...rot); o.scale.setScalar(s); }
function place(o, v, rot = [0, 0, 0], s = 1) { scene.add(o); o.visible = true; o.position.copy(v); o.rotation.set(...rot); o.scale.setScalar(s); }
function reset() {
  CAST.forEach(p => { p.P.visible = false; p.P.scale.setScalar(1); });
  for (const o of PROPS) { scene.add(o); o.visible = false; o.rotation.set(0, 0, 0); o.scale.setScalar(1); }
  CR.scale.setScalar(CRS); CR.userData.front.visible = true; CR.userData.label.visible = true; CR.userData.lid.position.set(0, .9, 0); CR.userData.lid.rotation.set(0, 0, 0); CR.userData.inside.visible = true; CR.userData.bulb.intensity = 0; CR.userData.sides.visible = true;
  TORCHL.intensity = 0; FORKS.position.y = .1; FORK.position.set(3.4, 0, .4); FORK.rotation.y = -1.2;
}
const camAt = (pos, look, fov = 45, focus, aper = 4, roll = 0) => ({ pos, look, fov, focus: focus ?? pos.distanceTo(look), aper, roll });
const hand = (c, t, a = 1) => { c.pos.x += noise(t, 1) * .012 * a; c.pos.y += noise(t, 2) * .01 * a; c.look.x += noise(t, 3) * .02 * a; c.look.y += noise(t, 4) * .016 * a; return c; };
// the crate's inside, in world space: x along its length; he sits at the -x end facing +x
const IN = (o, x, y, z) => o.clone().add(V(x * CRS, y * CRS, z * CRS));
const CW = WO.clone().add(V(-1.0, 0, 1.4));   // where the crate sits in the shed
// Reg sitting hunched in the crate (knees up), at crate origin c
function regInCrate(t, c, o = {}) {
  put(REG, IN(c, -.44, .06, 0), Math.PI / 2); REG.P.scale.setScalar(.88);
  apply(REG, { ...TP.sit, y: -.4, sp: [16, 0, 0], hd: [-10, 0, 0], lL: [100, 10, 120], lR: [100, 10, 120], aL: o.aL ?? [-40, 14, 0, 100], aR: o.aR ?? [-40, 14, 0, 100] }, { t, seed: 3, face: o.face ?? 'happy', look: o.look ?? CAMP, sweat: o.sweat, eyes: o.eyes });
}

// ---------------- shots ----------------
const SHOTS = []; const sh = o => SHOTS.push(o);
// 1a · He mailed himself across the world…: INSIDE the crate, his grin in the flashlight
sh({ t0: 0, set: 'ware', lt: CRATE_DARK, at: CW, act: t => actInside(t, 'hook'), after: 1,
  cam: (t, u) => { const h = headOf(REG); return hand(camAt(IN(CW, lerp(.7, .6, u), .42, .08), h.clone().add(V(0, -.16, 0)), lerp(66, 60, u), h.distanceTo(IN(CW, .65, .42, .08)), 3), t, .5); } });
// 1b · in a wooden box.: the crate in the dark shed, the stencils, a knock from inside
sh({ t0: tWooden - .1, set: 'ware', lt: NIGHTIN, at: CW, act: t => actCrateOutside(t),
  cam: (t, u) => hand(camAt(CW.clone().add(V(lerp(1.1, .8, u), lerp(1.25, 1.15, u), lerp(3.6, 3.1, eo(u)))), CW.clone().add(V(0, .6, 0)), 48, 3.3, 4), t) });
// 2a · 1964.: London in the rain, a red bus going by
sh({ t0: C2, set: 'london', lt: RAIN, at: LO, act: t => actLondon(t),
  cam: (t, u) => hand(camAt(LO.clone().add(V(lerp(-1.5, -.8, u), lerp(1.5, 1.6, u), 7.5)), LO.clone().add(V(lerp(-.5, .2, u), 2.4, -2)), 52, 9, 2), t, .5) });
// 2b · Reg Spiers, an Australian javelin thrower,: the throw
sh({ t0: tReg - .1, set: 'field', lt: FIELD, at: FO, act: t => actThrow(t), after: 1,
  cam: (t, u) => { const p = REG.P.position.clone(); p.z = Math.max(p.z, FO.z - .9); return hand(camAt(p.clone().add(V(2.2, 1.1, -1.5)), p.clone().add(V(.35, 1.3, -.15)), 52, 2.6, 3), t, .5); } });
// 2c · was stuck in London. Broke.: the bedsit, the rain, an empty wallet
sh({ t0: tStuck - .1, set: 'bedsit', lt: BEDSIT, at: BO, act: t => actBedsit(t, 0),
  cam: (t, u) => hand(camAt(V(lerp(.4, .3, u), lerp(1.3, 1.25, u), lerp(1.4, 1.1, u)), V(-.85, .95, -.5), 52, 1.8, 4), t) });
// 2d · And his daughter's birthday was coming.: the photo in his hands, the circled date behind
sh({ t0: tAnd2 - .1, set: 'bedsit', lt: BEDSIT, at: BO, act: t => actBedsit(t, 1), after: 1,
  cam: (t, u) => { const p = PHOTO.getWorldPosition(V(0, 0, 0)).add(V(0, .14, 0)); return hand(camAt(p.clone().add(V(lerp(.2, .12, u), .08, lerp(.62, .5, u))), p, 40, .6, 6), t, .4); } });
// 3a · So a friend nailed him into a crate: the shed at dusk, the hammer, his head ducking in
sh({ t0: C3, set: 'ware', lt: DUSKIN, at: CW, act: t => actNail(t),
  cam: (t, u) => hand(camAt(CW.clone().add(V(lerp(1.9, 1.7, u), lerp(1.5, 1.45, u), lerp(3.5, 3.1, u))), CW.clone().add(V(.75, 1.1, 0)), 54, 3.4, 4), t) });
// 3b · and shipped it as air cargo.: the forklift lifts the crate and heads for the plane
sh({ t0: tShipped - .1, set: 'ware', lt: DUSKIN, at: WO, act: t => actShip(t), after: 1,
  cam: (t, u) => { const c = CR.position.clone(); return hand(camAt(c.clone().add(V(-2.4, .6, 3.4)), c.clone().add(V(.3, .4, -.6)), 52, 4.2, 2), t); } });
// 3c · Cash on delivery.: the stencil, close
sh({ t0: tCash - .1, set: 'ware', lt: DUSKIN, at: CW, act: t => actCrateOutside(t, 1),
  cam: (t, u) => hand(camAt(CW.clone().add(V(lerp(.25, .15, u), .62, lerp(1.95, 1.75, u))), CW.clone().add(V(0, .66, .55)), 40, 1.3, 5), t, .4) });
// 4a · Inside: a pillow,: dark; in the crate; the pillow behind his head
sh({ t0: C4, set: 'ware', lt: CRATE_DARK, at: CW, act: t => actInside(t, 'pillow'),
  after: 1, cam: (t, u) => { const h = headOf(REG); return hand(camAt(IN(CW, .7, .4, -.14), h.clone().add(V(0, -.2, 0)), 64, 1.2, 3), t, .4); } });
// 4b · a flashlight, some canned food…: click: light; a can, a spoon
sh({ t0: tFlash - .1, set: 'ware', lt: CRATE_DARK, at: CW, act: t => actInside(t, 'food'),
  after: 1, cam: (t, u) => { const h = headOf(REG); return hand(camAt(IN(CW, lerp(.68, .6, u), .4, .14), h.clone().add(V(0, -.2, 0)), 62, 1.1, 3), t, .4); } });
// 4c · and a bottle to pee in.: he holds it up, looks at us
sh({ t0: tAnd4 - .1, set: 'ware', lt: CRATE_DARK, at: CW, act: t => actInside(t, 'bottle'),
  after: 1, cam: (t, u) => { const h = headOf(REG); return hand(camAt(IN(CW, lerp(.62, .52, u), .44, .03), h.clone().add(V(0, -.14, 0)), 54, .95, 4), t, .4); } });
// 5a · Sixty-three hours later,: the jet over the clouds, the sun racing round
sh({ t0: C5, set: 'sky', lt: HIGH, at: SKO, act: t => actFly(t),
  cam: (t, u) => hand(camAt(SKO.clone().add(V(-30, 6, 70)), SKO.clone().add(V(lerp(-6, 4, u), 0, 0)), 46, 70, .3), t, .4) });
// 5b · the crate landed in Perth.: the sunny apron, the crate rolling by on a baggage cart
sh({ t0: tThe5 - .1, set: 'perth', lt: PERTHD, at: PO, act: t => actPerth(t), after: 1,
  cam: (t, u) => { const c = CR.position.clone(); return hand(camAt(PO.clone().add(V(c.x - PO.x - 2.5, 1.0, 10.5)), c.clone().add(V(-.5, 1.6, -2)), 50, 7, 2), t, .5); } });
// 5c · He climbed out,: night in the Perth shed: the lid pops up, out he comes
sh({ t0: tHe5 - .1, set: 'ware', lt: NIGHTIN, at: CW, act: t => actClimb(t),
  cam: (t, u) => hand(camAt(CW.clone().add(V(lerp(1.2, 1.0, u), lerp(1.3, 1.35, u), lerp(2.7, 2.4, u))), CW.clone().add(V(0, 1.15, 0)), 50, 2.8, 4), t) });
// 5d · walked out of the airport…: hands in pockets, strolling past the terminal at dusk
sh({ t0: tWalked - .1, set: 'perth', lt: PERTHN, at: PO, act: t => actStroll(t), after: 1,
  cam: (t, u) => { const p = REG.P.position.clone(); return hand(camAt(p.clone().add(V(-1.6, 1.25, 3.4)), p.clone().add(V(.3, 1.1, 0)), 46, 3.6, 3), t, .5); } });
// 5e · and made it home.: the birthday room: she runs into his arms
sh({ t0: tAnd5 - .1, set: 'home', lt: HOME, at: HO, act: t => actHome(t),
  cam: (t, u) => hand(camAt(HO.clone().add(V(lerp(1.2, 1.0, u), lerp(1.25, 1.2, u), lerp(2.9, 2.5, u))), HO.clone().add(V(-.3, .9, .1)), 52, 2.6, 4), t) });
SHOTS.forEach((s, i) => { s.t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : LOOP + 1; });

// ---------------- acting ----------------
function crateAt(v, ry = 0) { place(CR, v, [0, ry, 0], CRS); }
function actInside(t, mode) {
  reset(); crateAt(CW); CR.userData.front.visible = false; CR.userData.label.visible = false;   // the camera sits where the front wall was
  CR.userData.bulb.intensity = mode === 'pillow' && t < tFlash - .15 ? .25 : 1.8;
  if (mode === 'hook') {
    regInCrate(t, CW, { face: t > tWorld ? 'laugh' : 'happy', sweat: 1, aR: [-100, -10, 0, 120], aL: [-40, 14, 0, 100] });
    place(HTORCH, handOf(REG).add(V(.02, -.02, 0)), [0, 0, 0], 1); HTORCH.lookAt(headOf(REG).add(V(0, .1, 0))); CR.userData.bulb.intensity = 2.2;
    TORCHL.position.copy(HTORCH.position); TORCHL.target.position.copy(headOf(REG)); TORCHL.intensity = 3;
  } else if (mode === 'pillow') {
    regInCrate(t, CW, { face: t > tPillow ? 'smug' : 'calm', aL: [-150, 30, 0, 140], aR: [-40, 14, 0, 100] });
  } else if (mode === 'food') {
    const on = t > tFlash; regInCrate(t, CW, { face: t > tCanned ? 'happy' : 'proud', aR: [-80, 10, 0, 110], aL: [-60, 10, 0, 100], look: on ? IN(CW, .2, .45, 0) : CAMP });
    if (t < tCanned - .1) { place(HTORCH, handOf(REG).add(V(.02, 0, 0))); HTORCH.lookAt(IN(CW, .6, .4, 0)); TORCHL.position.copy(HTORCH.position); TORCHL.target.position.copy(IN(CW, .6, .4, 0)); TORCHL.intensity = on ? 3 : 0; }
    else { place(CAN, handOf(REG).add(V(0, .04, 0)), [0, 0, 0], 1.3); CR.userData.bulb.intensity = 1.6; }
  } else {
    regInCrate(t, CW, { face: t > tPee - .1 ? 'deadpan' : 'smile', sweat: t > tPee - .1, aR: [-115, 10, 0, 70], aL: [-40, 14, 0, 100], eyes: t > tPee ? [.2, 0] : undefined });
    place(BOTTLE, handOf(REG).add(V(0, .08, 0)), [0, 0, 0], 1.3); CR.userData.bottle.visible = false;
  }
}
function actCrateOutside(t, close) {
  reset(); crateAt(CW);
  const knock = !close && t > tBox ? Math.sin((t - tBox) * 30) * Math.exp(-(t - tBox) * 5) * .02 : 0; CR.position.x += knock;
  CR.userData.inside.visible = false;
}
function actLondon(t) { reset(); BUS.position.x = lerp(14, -10, seg(t, C2, tReg + .3)); }
function actThrow(t) {
  reset();
  const k = seg(t, tReg - .1, tThrower + .2), v = FO.clone().add(V(-.2, 0, lerp(.6, -.9, Math.min(1, k * 1.2))));
  put(REG, v, Math.PI);
  const thrown = t > tThrower - .05;
  apply(REG, thrown ? { ...TP.point, sp: [12, 0, 0], aR: [-150, 20, 0, 10], lL: [30, 4, 10], lR: [-20, 4, 30] } : walk({ ...TP.stand, aR: [-150, 30, 0, 90] }, t * 9, 1.1), { t, seed: 3, face: thrown ? 'proud' : 'angry', look: v.clone().add(V(0, 2, -5)) });
  if (!thrown) { place(JAV, handOf(REG).add(V(0, .02, .3)), [0, Math.PI / 2, .22], 1); }
  else { const kk = seg(t, tThrower - .05, tThrower + 1.2); place(JAV, v.clone().add(V(0, 1.9 + kk * 4 - kk * kk * 2.5, -1 - kk * 14)), [0, Math.PI / 2, -.5 + kk * .8], 1); }
}
function actBedsit(t, phase) {
  reset();
  put(REG, V(-.85, 0, -.35), .4);
  if (!phase) {
    const broke = t > tBroke - .1;
    apply(REG, { ...TP.sit, y: -.08, sp: [10, 0, 0], aR: [-60, 10, 0, 70], aL: [-60, 10, 0, 70] }, { t, seed: 3, face: broke ? 'worried' : 'deadpan', look: broke ? CAMP : handOf(REG), sweat: broke });
    onHand(REG, WALLET, 0, [0, .02, .06], [-.5, 0, 0], 1.2);
  } else {
    apply(REG, { ...TP.sit, y: -.08, sp: [12, 0, 0], hd: [16, 0, 0], aR: [-75, 4, 0, 70], aL: [-75, 4, 0, 70] }, { t, seed: 3, face: 'worried', look: handOf(REG) });
    const hp = handOf(REG).lerp(handOf(REG, 1), .5); scene.attach(PHOTO); PHOTO.position.copy(hp.add(V(0, .02, .06))); PHOTO.rotation.set(0, .4, 0); PHOTO.visible = true;
  }
  if (phase === 0) { BED.userData.table.attach(PHOTO); PHOTO.position.set(.2, .74, -.15); PHOTO.rotation.set(0, 0, 0); }
}
function actNail(t) {
  reset(); crateAt(CW);
  const shut = seg(t, tNailed - .1, tNailed + .25);
  CR.userData.lid.position.set(0, .9 + .5 * (1 - eo(shut)), -.3 * (1 - eo(shut))); CR.userData.lid.rotation.x = -.6 * (1 - eo(shut));
  // Reg's head and a thumbs-up over the rim before the lid comes down
  if (shut < .7) { put(REG, IN(CW, -.1, .06 - .5 * eo(shut), 0), Math.PI * .1); apply(REG, { ...TP.sit, y: -.06, aR: [-150, 20, 0, 40], aL: [-40, 14, 0, 100] }, { t, seed: 3, face: 'laugh', look: CAMP }); }
  const jv = CW.clone().add(V(1.25, 0, .35)); put(JOHN, jv, -Math.PI / 2 + 1.05);
  const swing = Math.max(0, Math.sin((t - tNailed) * 14)); const hitting = t > tNailed;
  apply(JOHN, { ...TP.stand, sp: [10, 0, 0], aR: hitting ? [-60 - 90 * swing, 10, 0, 40] : [-40, 20, 0, 60], aL: [-50, 10, 0, 60] }, { t, seed: 5, face: hitting ? 'angry' : 'happy', look: CW.clone().add(V(0, 1.17, 0)), sweat: hitting });
  onHand(JOHN, HAMMER, 0, [0, 0, .02], [Math.PI / 2, 0, 0], 1.3);
}
function actShip(t) {
  reset(); const k = seg(t, tShipped - .1, tCash);
  FORK.position.set(lerp(1.0, 1.6, k), 0, lerp(1.4, -2.0, eio(k))); FORK.rotation.y = Math.PI; FORKS.position.y = lerp(.1, 1.1, seg(t, tShipped, tAir));
  FORK.updateMatrixWorld(true); const fp = FORKS.getWorldPosition(V(0, 0, 0)); place(CR, fp.clone().add(V(0, .03, -.5)), [0, Math.PI / 2, 0], CRS);
  CR.userData.inside.visible = false;
  put(DRIVER, FORK.getWorldPosition(V(0, 0, 0)).add(V(0, .55, .2)), Math.PI); apply(DRIVER, { ...TP.sit, y: -.06, aL: [-60, 10, 0, 60], aR: [-60, 10, 0, 60] }, { t, seed: 7, face: 'calm', look: fp.clone().add(V(0, 1, -2)) });
  const jv = WO.clone().add(V(-1.4, 0, 1.6)); put(JOHN, jv, Math.PI - .4); apply(JOHN, TP.wave, { t, seed: 5, face: 'laugh', look: fp });
}
function actFly(t) {
  reset(); const k = seg(t, C5, tThe5); place(PLANE, SKO.clone().add(V(lerp(-38, 40, k), lerp(-2, 3, k), -12)), [0, 0, .06], 1);
  // the sun races round (day → night → day) while he flies
  const ph = k * Math.PI * 2; sun.position.set(SKO.x + Math.cos(ph) * 30, SKO.y + Math.sin(ph + 1.2) * 30, SKO.z + 20); const night = clamp(-Math.sin(ph + 1.2) * 1.4);
  sun.intensity = 3 * (1 - night); hemi.intensity = 1.2 - .8 * night; const u2 = sky.material.uniforms; u2.top.value.set('#0E4AB8').lerp(new THREE.Color('#0A0E2A'), night); u2.hor.value.set('#9CC8F0').lerp(new THREE.Color('#3A3A6A'), night);
}
function actPerth(t) {
  reset(); TUG.position.set(lerp(-9, 1, seg(t, tThe5 - .2, tHe5 + .3)), 0, 4); TUG.updateMatrixWorld(true);
  const cart = PER.userData.cart, cp = cart.getWorldPosition(V(0, 0, 0)); place(CR, cp.clone().add(V(0, .52, 0)), [0, 0, 0], CRS * .9); CR.userData.inside.visible = false;
  put(DRIVER, TUG.getWorldPosition(V(0, 0, 0)).add(V(-.2, .55, 0)), Math.PI / 2); apply(DRIVER, { ...TP.sit, y: -.06, aL: [-60, 10, 0, 60], aR: [-60, 10, 0, 60] }, { t, seed: 7, face: 'calm', look: CAMP });
  place(PLANE, PO.clone().add(V(-4, 4.2, -38)), [0, .3, 0], 1);
}
function actClimb(t) {
  reset(); crateAt(CW); const k = seg(t, tHe5, tClimbed + .3);
  CR.userData.lid.position.set(.5 * eo(k), .9 + .25 * Math.sin(Math.min(1, k * 1.5) * Math.PI), .4 * eo(k)); CR.userData.lid.rotation.set(0, 0, -.9 * eo(k));
  const up = eo(seg(t, tHe5 + .1, tClimbed + .4)); put(REG, IN(CW, -.1, .06, 0).add(V(0, -.5 + up * .6, 0)), Math.PI * .1);
  apply(REG, up > .8 ? { ...TP.cheer, sp: [-10, 0, 0] } : { ...TP.stand, aR: [-150, 30, 0, 60], aL: [-150, -30, 0, 60] }, { t, seed: 3, face: up > .8 ? 'laugh' : 'happy', look: CAMP });
}
function actStroll(t) {
  reset(); TUG.position.set(60, 0, 4); const k = seg(t, tWalked - .1, tAnd5), v = PO.clone().add(V(lerp(-4, -1, k), 0, 6.5)); put(REG, v, Math.PI / 2 - .25);
  apply(REG, walk({ ...TP.stand, aL: [-15, -10, 0, 120], aR: [-15, -10, 0, 120] }, t * 6.5, .8), { t, seed: 3, face: 'smug', look: CAMP, eyes: [.5, 0] });
  place(PLANE, PO.clone().add(V(4, 4.2, -14)), [0, -.3, 0], 1);
}
function actHome(t) {
  reset(); const k = seg(t, tAnd5 - .1, tHome - .05);
  const rv = HO.clone().add(V(-.5, 0, .3)); put(REG, rv, .5);
  const gv = HO.clone().add(V(lerp(.9, -.18, eo(k)), 0, lerp(-.4, .42, eo(k)))); put(GIRL, gv, face(gv, rv));
  const hug = k > .85;
  apply(REG, hug ? { ...TP.stand, sp: [14, 0, 0], aL: [-70, 10, 0, 100], aR: [-70, 10, 0, 100] } : { ...TP.stand, aL: [-30, 60, 0, 40], aR: [-30, 60, 0, 40] }, { t, seed: 3, face: 'laugh', look: headOf(GIRL) });
  apply(GIRL, hug ? { ...TP.cheer } : walk({ ...TP.cheer }, t * 9, 1), { t, seed: 6, face: 'laugh', look: headOf(REG) });
}

// ---------------- sound events ----------------
ev(0, 'room', { d: tWooden }); ev(.04, 'boom'); ev(tWorld, 'whoosh'); ev(tBox, 'knock');
ev(C2, 'rain', { d: tStuck - C2 + 2.6 }); ev(C2 + .2, 'bus', { d: 2.2 }); ev(t1964, 'hit');
ev(tReg - .1, 'stadium', { d: tStuck - tReg }); ev(tThrower, 'whoosh');
ev(tBroke, 'coins'); ev(tBirthday, 'chime');
ev(C3, 'shed', { d: tCash - C3 }); for (let k = 0; k < 4; k++) ev(tNailed + .05 + k * .225, 'nail'); ev(tShipped, 'motor', { d: tCash - tShipped }); ev(tCash, 'stamp');
ev(C4, 'hum', { d: C5 - C4 }); ev(tPillow, 'pop'); ev(tFlash, 'click'); ev(tCanned, 'slurp'); ev(tPee, 'boing');
ev(C5 - .1, 'jetby', { d: 2.5 }); ev(t63, 'lapse', { d: tThe5 - t63 }); ev(tPerth, 'birds', { d: tHe5 - tPerth + .3 });
ev(tHe5, 'creak'); ev(tClimbed, 'pop'); ev(tWalked, 'whistle', { d: tAnd5 - tWalked }); ev(tHome, 'cheer');

// ---------------- overlay: the few plates, captions (one word at a time) ----------------
const ov = document.getElementById('ov').getContext('2d');
const TEL = [
  { t0: -9, t1: tWooden - .1, text: 'HE MAILED HIMSELF', y: 250, size: 100, col: '#FFFFFF', rot: -4, plate: '#16131A', hook: 1 },
  { t0: -9, t1: tWooden - .1, text: 'ACROSS THE WORLD 📦', y: 410, size: 96, col: '#FFD23F', rot: -4, plate: '#C8283A', hook: 1 },
  { t0: t1964 - .05, t1: tReg - .1, text: 'LONDON · 1964', y: 300, size: 120, col: '#FFFFFF', rot: -4, plate: '#16131A' },
  { t0: tCash - .03, t1: C4, text: 'C.O.D.', y: 330, size: 190, col: '#E8423A', rot: -8, stamp: 1 },
  { t0: t63 - .03, t1: tThe5 - .1, text: '63 HOURS', y: 330, size: 170, col: '#FFD23F', rot: -6, stamp: 1 },
];
function drawTelop(x, t) {
  const p = seg(t, x.t0, x.t0 + .25), sc = x.stamp ? lerp(2.2, 1, eo(p)) : back(p, 2.6), wob = 1 + .02 * Math.sin((x.hook ? t : t - x.t0) * 8);
  const text = typeof x.text === 'function' ? x.text(t) : x.text;
  ov.save(); ov.translate(x.x ?? 540, x.y); ov.rotate(x.rot * Math.PI / 180); ov.scale(sc * wob, sc * wob); if (x.stamp) ov.globalAlpha = clamp(p * 3);
  ov.font = `900 ${x.size}px Montserrat`; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  const tw = Math.min(1000, ov.measureText(x.mono ?? text).width + 70), th = x.size * 1.4;
  if (x.plate) { ov.fillStyle = 'rgba(0,0,0,.85)'; ov.beginPath(); ov.roundRect(-tw / 2 + 10, -th / 2 + 12, tw, th, 28); ov.fill(); ov.fillStyle = x.plate; ov.beginPath(); ov.roundRect(-tw / 2, -th / 2, tw, th, 28); ov.fill(); }
  if (x.stamp) { ov.strokeStyle = x.col; ov.lineWidth = 16; ov.beginPath(); ov.roundRect(-tw / 2 + 5, -th / 2 + 8, tw - 10, th - 16, 20); ov.stroke(); }
  ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 20; ov.shadowOffsetY = 8; ov.lineWidth = x.size * .2; ov.strokeStyle = '#000'; ov.strokeText(text, 0, 4, 960); ov.shadowColor = 'transparent'; ov.fillStyle = x.col; ov.fillText(text, 0, 4, 960);
  ov.restore();
}
const WORDS = TMJ.lines.flatMap(l => l.words);
const CAPY = 1250;
function drawCaption(t, y = CAPY) {
  const i = WORDS.findIndex((x, k) => t >= x.t0 - .03 && t < Math.min(WORDS[k + 1] ? WORDS[k + 1].t0 - .03 : 1e9, x.t1 + .5)); if (i < 0) return;
  const x = WORDS[i], word = x.w.replace(/["…]/g, ''), pop = back(seg(t, x.t0 - .03, x.t0 + .09), 2.0), s = lerp(.7, 1, pop);
  ov.save(); ov.translate(W / 2, y); ov.scale(s, s); ov.font = '900 118px Montserrat'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  ov.shadowColor = 'rgba(0,0,0,.5)'; ov.shadowBlur = 18; ov.shadowOffsetY = 8; ov.lineWidth = 28; ov.strokeStyle = '#000'; ov.strokeText(word, 0, 0, 980);
  ov.shadowColor = 'transparent'; ov.fillStyle = '#FFFFFF'; ov.fillText(word, 0, 0, 980); ov.restore();
}
function drawRain(t) {
  ov.save(); ov.strokeStyle = 'rgba(210,225,255,.38)'; ov.lineWidth = 3; ov.lineCap = 'round';
  for (let i = 0; i < 160; i++) { const x0 = (i * 97.3) % W, sp = 2400 + (i % 7) * 200, y = ((i * 211.7 + t * sp) % (H + 200)) - 100; ov.beginPath(); ov.moveTo(x0 - .08 * y * .1, y); ov.lineTo(x0 - 8, y + 46); ov.stroke(); }
  ov.restore();
}
const PUNCH = [tMailed, t1964, tBroke, tNailed, tCash, tFlash, tPee, t63, tPerth, tHome];
const punch = t => PUNCH.reduce((a, tk) => { const d = t - tk; return a + (d < 0 ? 0 : d < .07 ? d / .07 : Math.exp(-(d - .07) * 6)) * .045; }, 0);

// ---------------- render ----------------
function frame(sh, t) {
  const u = seg(t, sh.t0, sh.t1);
  light(sh.lt, sh.at); if (sh.tint) CHAR_TINT.value.set(sh.tint);
  for (const arr of Object.values(SETS)) arr.forEach(s => s.visible = false); SETS[sh.set].forEach(s => s.visible = true);
  let c = sh.after ? null : sh.cam(t, u); if (c) CAMP.copy(c.pos);
  sh.act(t);
  if (!c) { c = sh.cam(t, u); CAMP.copy(c.pos); }
  if (QS.get('dbg')) { const d = QS.get('dbg').split(',').map(Number); c = camAt(V(d[0], d[1], d[2]), V(d[3], d[4], d[5]), d[6] ?? 50, 3, 0); }
  camera.position.copy(c.pos); sky.position.copy(c.pos); camera.up.set(0, 1, 0); camera.lookAt(c.look); camera.rotateZ(c.roll ?? 0);
  camera.fov = c.fov * (1 - punch(t)); camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  post.dof.focus = c.focus; post.dof.aper = c.aper; post.dof.maxCoc = 8;
  scene.updateMatrixWorld(true); post.composer.render();
}
const A0 = +(QS.get('a') ?? 0), B0 = +(QS.get('b') ?? DUR);
const shotAt = t => { const i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1); return SHOTS[i < 0 ? SHOTS.length - 1 : i]; };
function render(t) {
  const sh = shotAt(t);
  ov.clearRect(0, 0, W, H);
  frame(sh, t);
  if (QS.get('poster')) { ov.clearRect(0, 0, W, H); [['HE MAILED HIMSELF', 230, -4, '#FFFFFF', 104, '#16131A'], ['ACROSS THE WORLD 📦', 395, -4, '#FFD23F', 100, '#C8283A']].forEach(([text, y, rot, col, size, plate]) => drawTelop({ t0: -9, text, y, size, col, rot, plate }, t)); return; }
  if (QS.get('clean')) return;
  if (sh.set === 'london') drawRain(t);
  TEL.forEach(x => { if (t >= x.t0 && t < x.t1) drawTelop(x, t); }); drawCaption(t);
}
function texts(t) { return TEL.filter(x => typeof x.text === 'string' && t >= x.t0 + .3 && t < x.t1).map(x => ({ id: x.text, text: x.text, x0: 60, y0: x.y - x.size * .7, x1: 1020, y1: x.y + x.size * .7 })); }
EV.sort((a, b) => a.t - b.t);
window.SHOTLIST = SHOTS.map(s => [+s.t0.toFixed(3), +s.t1.toFixed(3), null]);
window.DUR = +(B0 - A0).toFixed(3); window.EV = EV; window.render = t => render(t + A0); window.TEXTS = t => texts(t + A0);
render(A0);
window.READY = true;
