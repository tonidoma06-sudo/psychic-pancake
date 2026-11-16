// "Lawn Chair Larry" · 3D vertical Short (1080×1920), v4 toon style.
// He tied 42 weather balloons to a lawn chair and flew to 16,000 feet: the dream, the Air Force eye test, the balloons, the
// plan, the rope that snapped, three miles up and freezing, the planes landing at LAX, pop pop pop, the gun he dropped, the
// power lines, the blackout, the police… and "A man can't just sit around."
// Every shot, action, telop and caption is placed from timing.json (the voice). render(t) is pure in t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { makePost } from '/core/three/post.js';
import { makeToon, apply, TP, mix, walk, TM, G } from './toon.js';
import { backyard, craft, lawnChair, sky as skySet, airliner, cockpit, office, street, room, policeCar, sandwich, radio, pelletGun, rope, mic, tvCam } from './sets_lawn.js';
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
const eo = u => 1 - Math.pow(1 - u, 3), ei = u => u * u * u, eio = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2, back = (u, s = 1.7) => { u = clamp(u) - 1; return 1 + u * u * ((s + 1) * u + s); };
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
const lampL = new THREE.PointLight('#FFD9A0', 0, 9, 1.6); scene.add(lampL);
const SUNNY = { pos: [-18, 34, 26], col: '#FFF1DA', int: 3.0, hs: '#C8E0FF', hg: '#A89A80', hemi: 1.05, fog: ['#CFE4F2', 70, 420], sky: ['#2A78E0', '#E4EEF2', [-.4, .5, .6], '#FFF6D8'], env: .35, r: 16, warm: .14 };
const HIGH = { pos: [-20, 30, 24], col: '#FFFFFF', int: 3.2, hs: '#D8ECFF', hg: '#E8F0F8', hemi: 1.2, fog: ['#BFD8F0', 120, 900], sky: ['#0E4AB8', '#9CC8F0', [-.4, .45, .6], '#FFFFFF'], env: .4, r: 14, warm: 0 };
const INSIDE = { pos: [-4, 9, 7], col: '#FFF4E0', int: 2.0, hs: '#FFF8EC', hg: '#B8A890', hemi: 1.1, env: .5, r: 8, bg: '#DCD8D0', warm: .08 };
const ROOM = { pos: [-4, 8, 6], col: '#FFE2B8', int: 1.4, hs: '#FFE8C8', hg: '#8A6A4A', hemi: .7, env: .35, r: 7, bg: '#2A2420', warm: .22, lamp: 6 };
const DARK = { pos: [-4, 8, 6], col: '#8090B8', int: .5, hs: '#5A6890', hg: '#2A2830', hemi: .55, env: .1, r: 7, bg: '#14141C', warm: 0, lamp: 0 };
function light(o, at) {
  sun.color.set(o.col); sun.intensity = o.int; sun.position.set(at.x + o.pos[0], at.y + o.pos[1], at.z + o.pos[2]); sun.target.position.copy(at);
  const c = sun.shadow.camera, r = o.r ?? 10; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 1; c.far = 200; c.updateProjectionMatrix();
  hemi.color.set(o.hs); hemi.groundColor.set(o.hg); hemi.intensity = o.hemi;
  scene.fog = o.fog ? new THREE.Fog(o.fog[0], o.fog[1], o.fog[2]) : null;
  if (o.sky) { sky.visible = true; scene.background = null; const u = sky.material.uniforms; u.top.value.set(o.sky[0]); u.hor.value.set(o.sky[1]); u.sd.value.set(...o.sky[2]).normalize(); u.sc.value.set(o.sky[3]); }
  else { sky.visible = false; scene.background = new THREE.Color(o.bg ?? '#2A2A30'); }
  scene.environmentIntensity = o.env ?? .35; vg.warm.value = o.warm ?? .1; lampL.intensity = o.lamp ?? 0;
}

// ---------------- the sets (each far from the others) ----------------
const YARD = backyard(); scene.add(YARD);
const SKYO = V(0, 1200, 0), SKY = skySet(); SKY.position.copy(SKYO); scene.add(SKY);
const STO = V(0, 0, 900), STR = street(); STR.position.copy(STO); scene.add(STR);
const OFO = V(900, 0, 0), OFF = office(); OFF.position.copy(OFO); scene.add(OFF);
const RMO = V(-900, 0, 0), RM = room(); RM.position.copy(RMO); scene.add(RM);
const CPO = SKYO.clone().add(V(-46, -3, 40)), CPIT = cockpit(); CPIT.position.copy(CPO); scene.add(CPIT);
const SETS = { yard: [YARD], sky: [SKY], street: [STR], office: [OFF], room: [RM], cockpit: [SKY, CPIT] };

// ---------------- cast ----------------
const mk = o => { const p = makeToon({ shoe: '#2A2A30', ...o }); scene.add(p.P); return p; };
const LARRY = mk({ name: 'larry', outfit: 'tee', top: '#E8602A', pants: '#3C4A6A', hair: 'messy', hairC: '#3A2A1E', mustache: '#3A2A1E', glasses: 'round', shoe: '#6A4A2E' });
const FR = [mk({ name: 'friend0', outfit: 'tee', top: '#3EB2E8', pants: '#2A3A5A', hair: 'bob', hairC: '#7A3A22', blush: 1, seed: 4 }), mk({ name: 'friend1', outfit: 'hoodie', top: '#9ACB55', pants: '#3A3A40', hair: 'beanie', hatC: '#E8423A', seed: 9 })];
const OFFICER = mk({ name: 'officer', outfit: 'suit', top: '#3A5A8A', pants: '#2A3A5A', tie: '#1E2A44', hair: 'peak', hatC: '#2A3A6A', bandC: '#1E2A44', hairC: '#2A2018', seed: 30 });
const PIL = [mk({ name: 'pilot0', outfit: 'suit', top: '#1E2A44', pants: '#1E2A44', tie: '#1E2A44', hair: 'peak', hatC: '#1E2A44', bandC: '#E2B848', hairC: '#9A958E', mustache: '#9A958E', seed: 31 }), mk({ name: 'pilot1', outfit: 'suit', top: '#1E2A44', pants: '#1E2A44', tie: '#1E2A44', hair: 'peak', hatC: '#1E2A44', bandC: '#E2B848', hairC: '#3A2418', seed: 32 })];
const COP = [mk({ name: 'cop0', outfit: 'suit', top: '#22325E', pants: '#22325E', tie: '#16131A', hair: 'peak', hatC: '#16131A', bandC: '#16131A', hairC: '#2A2018', seed: 33 }), mk({ name: 'cop1', outfit: 'suit', top: '#22325E', pants: '#22325E', tie: '#16131A', hair: 'peak', hatC: '#16131A', bandC: '#16131A', hairC: '#6A3A1A', seed: 34 })];
const REP = [mk({ name: 'rep0', outfit: 'suit', top: '#C8283A', pants: '#2A2A30', tie: '#F2C230', hair: 'bob', hairC: '#C88A3A', blush: 1, seed: 35 }), mk({ name: 'rep1', outfit: 'polo', top: '#4AA8D8', pants: '#3A3A40', hair: 'slick', hairC: '#1A1A1E', seed: 36 }), mk({ name: 'rep2', outfit: 'tee', top: '#F2B33A', pants: '#2A3A5A', hair: 'beanie', hatC: '#2E7FE0', seed: 37 })];
const FAM = [mk({ name: 'dad', outfit: 'polo', top: '#6A8A4A', pants: '#5A4A3A', hair: 'bald', hairC: '#5A4030', seed: 38 }), mk({ name: 'kid', outfit: 'tee', top: '#F27AA0', pants: '#2A3A5A', hair: 'bob', hairC: '#3A2418', blush: 1, H: .75, seed: 39 })];
const CAST = [LARRY, ...FR, OFFICER, ...PIL, ...COP, ...REP, ...FAM];

// ---------------- props ----------------
const CRAFT = craft(); scene.add(CRAFT); const CL = CRAFT.userData.cluster;
const CHAIR2 = lawnChair(); scene.add(CHAIR2);                          // the plain lawn chair (no balloons)
const PLANE = airliner('#C8283A'); scene.add(PLANE);
const PLANE2 = airliner('#2E6FB5'); scene.add(PLANE2);
const SAND = sandwich(), RAD = radio(), GUN = pelletGun(), GUN2 = pelletGun(); scene.add(SAND, RAD, GUN, GUN2);
const COPCAR = policeCar(); scene.add(COPCAR);
const MICS = [mic('#2A2A30'), mic('#C8283A')]; MICS.forEach(m => scene.add(m)); const TVC = tvCam(); scene.add(TVC);
const BLOON = new THREE.Mesh(new THREE.SphereGeometry(.82, 22, 16), CL.userData.balls[0].material); BLOON.castShadow = true; scene.add(BLOON);   // the one being filled
let ROPE = null; const ROPEM = [];   // the tether (rebuilt per frame)
const SPARK = Array.from({ length: 14 }, () => { const s = new THREE.Mesh(new THREE.SphereGeometry(.06, 6, 4), new THREE.MeshBasicMaterial({ color: '#FFE070', toneMapped: false })); scene.add(s); return s; });
const PUFF = Array.from({ length: 4 }, () => { const s = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .6 })); scene.add(s); return s; });
const POPS = Array.from({ length: 3 }, () => { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(.9, 0), new THREE.MeshBasicMaterial({ color: '#FFF6D8', transparent: true, opacity: .9, toneMapped: false })); scene.add(s); return s; });
const PROPS = [CRAFT, CHAIR2, PLANE, PLANE2, SAND, RAD, GUN, GUN2, COPCAR, ...MICS, TVC, BLOON, ...SPARK, ...PUFF, ...POPS];

// ---------------- key times (all from the voice) ----------------
const C2 = cut('L2'), C3 = cut('L3'), C4 = cut('L4'), C5 = cut('L5'), C6 = cut('L6'), C7 = cut('L7'), C8 = cut('L8'), C9 = cut('L9'), C10 = cut('L10'), C11 = cut('L11');
const t42 = w('L1', '42'), tLawn1 = w('L1', 'lawn'), tFlew = w('L1', 'and'), t16k = w('L1', '16'), tFeet = w('L1', 'feet');
const tLarry2 = w('L2', 'larry'), tFly2 = w('L2', 'fly'), tBut2 = w('L2', 'but'), tRejected = w('L2', 'rejected'), tBad = w('L2', 'bad');
const tBuilt = w('L3', 'built'), tAircraft = w('L3', 'aircraft'), t42b = w('L3', '42'), tHelium = w('L3', 'helium'), tLawn3 = w('L3', 'and');
const tSand = w('L4', 'sandwiches'), tRadio = w('L4', 'radio'), tPellet = w('L4', 'pellet'), tPlan = w('L4', 'the'), tFloat = w('L4', 'float'), tShoot = w('L4', 'then'), tDown4 = w('L4', 'down');
const tTied = w('L5', 'tied'), tJeep = w('L5', 'jeep'), tThen5 = w('L5', 'then'), tSnapped = w('L5', 'snapped');
const tShot = w('L6', 'shot'), tThree = w('L6', 'three'), tFreezing = w('L6', 'freezing'), tLawn6 = w('L6', 'in');
const tDrifted = w('L7', 'drifted'), tPlanes = w('L7', 'planes'), tLAX = w('L7', 'lax'), tTwo = w('L7', 'two'), tTower = w('L7', 'tower'), tTheres = w('L7', 'theres');
const tPulled = w('L8', 'pulled'), tPop = [w('L8', 'pop', 0), w('L8', 'pop', 1), w('L8', 'pop', 2)], tThen8 = w('L8', 'then'), tDropped = w('L8', 'dropped');
const tCame = w('L9', 'came'), tRight9 = w('L9', 'right'), tPower = w('L9', 'power'), tBlacked = w('L9', 'blacked'), tOut9 = w('L9', 'out');
const tPolice = w('L10', 'police'), tAsked = w('L10', 'asked'), tSaid = w('L10', 'larry'), tMan = w('L10', 'man');
const tWould = w('L11', 'would');

// ---------------- helpers ----------------
const put = (p, v, ry = 0) => { p.P.visible = true; p.P.position.copy(v); p.P.rotation.set(0, ry, 0); p.P.updateMatrixWorld(true); };
const CAMP = new THREE.Vector3(0, 1.4, 6);
const headOf = p => { p.P.updateMatrixWorld(true); return p.head.getWorldPosition(V(0, 0, 0)); };
const handOf = (p, left = 0) => { p.P.updateMatrixWorld(true); return (left ? p.aL : p.aR).hand.getWorldPosition(V(0, 0, 0)); };
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
function onHand(p, o, left = 0, pos = [0, 0, 0], rot = [0, 0, 0]) { o.visible = true; (left ? p.aL : p.aR).props.add(o); o.position.set(...pos); o.rotation.set(...rot); }
function place(o, v, rot = [0, 0, 0], s = 1) { scene.add(o); o.visible = true; o.position.copy(v); o.rotation.set(...rot); o.scale.setScalar(s); }
function reset() {
  CAST.forEach(p => { p.P.visible = false; });
  for (const o of PROPS) { scene.add(o); o.visible = false; o.rotation.set(0, 0, 0); o.scale.setScalar(1); }
  if (ROPE) { scene.remove(ROPE); ROPE.geometry.dispose(); ROPE = null; } ROPEM.forEach(m => { scene.remove(m); m.geometry.dispose(); }); ROPEM.length = 0;
  CL.userData.pop(0); CL.scale.setScalar(1); CL.position.set(0, 0, 0); CL.rotation.set(0, 0, 0);
  const cl = COPCAR.userData.lights; cl[0].visible = cl[1].visible = true;
  RM.userData.screen.visible = true; RM.userData.bulb.visible = true;
}
const camAt = (pos, look, fov = 45, focus, aper = 4, roll = 0) => ({ pos, look, fov, focus: focus ?? pos.distanceTo(look), aper, roll });
const hand = (c, t, a = 1) => { c.pos.x += noise(t, 1) * .012 * a; c.pos.y += noise(t, 2) * .01 * a; c.look.x += noise(t, 3) * .02 * a; c.look.y += noise(t, 4) * .016 * a; return c; };
const shake = (c, t, a) => { if (a > 0) { c.pos.x += Math.sin(t * 61) * .02 * a; c.pos.y += Math.sin(t * 53 + 1) * .016 * a; } return c; };
const sway = t => ({ x: Math.sin(t * .9) * .04, z: Math.sin(t * .7 + 1) * .05 });

// Larry in the craft at v: seated, the cluster above; o = { face, look, pose, ry, k (balloons popped), shiver }
function flyer(t, v, o = {}) {
  const sw = sway(t); place(CRAFT, v, [sw.x, o.ry ?? 0, sw.z]);
  CL.userData.pop(o.k ?? 0);
  put(LARRY, v.clone().add(V(0, .02, .06).applyAxisAngle(V(0, 1, 0), o.ry ?? 0)), o.ry ?? 0);
  LARRY.P.rotation.x = sw.x; LARRY.P.rotation.z = sw.z;
  const sh = o.shiver ? Math.sin(t * 40) * 3 * o.shiver : 0;
  apply(LARRY, { ...TP.sit, y: -.06, hd: [sh, 0, 0], ...(o.pose ?? {}) }, { t, seed: 1, face: o.face ?? 'happy', look: o.look ?? CAMP, eyes: o.eyes });
}

// ---------------- places ----------------
const CH0 = V(0, 0, 0);                                          // where the craft sits in the yard (faces +z, the house behind)
const JEEP = YARD.userData.jeep, HITCH = () => JEEP.localToWorld(JEEP.userData.hitch.clone());
const HOVER = V(0, 1.7, 0);
const RISE = t => CH0.clone().add(V(0, 1.7 + 120 * Math.pow(seg(t, tSnapped - .02, C7 + .5), 1.6), 0));
const SKYP = SKYO.clone();                                       // the craft three miles up
const DESC = t => STO.clone().add(V(6, lerp(26, 9.6, eo(seg(t, C9 - .2, tPower))), -6.2 + lerp(3, 0, eo(seg(t, C9 - .2, tPower)))));
const SNAG = STO.clone().add(V(6, 7.35, -6.2));                  // tangled in the lines (the chair hangs under the wires)

const SHOTS = [];
const sh = o => SHOTS.push(o);
// 1a · He tied 42 weather balloons to a lawn chair…: below him, looking up at the column of balloons, rising
sh({ t0: 0, set: 'sky', lt: HIGH, at: SKYP, act: t => actHook(t),
  cam: (t, u) => hand(camAt(SKYP.clone().add(V(lerp(2.6, 2.2, u), lerp(-2.4, -1.6, u), lerp(3.4, 3.0, u))), SKYP.clone().add(V(0, lerp(3.4, 4.6, u), 0)), 54, 4.5, 2), t, .6) });
// 1b · and flew to 16,000 feet.: pull back and up; he's a speck over the cloud sea, an airliner far below
sh({ t0: tFlew - .1, set: 'sky', lt: HIGH, at: SKYP, act: t => actHook(t),
  cam: (t, u) => { const k = eio(u); return camAt(SKYP.clone().add(V(lerp(3, 16, k), lerp(1.5, 4, k), lerp(5, 34, k))), SKYP.clone().add(V(0, lerp(2.6, 1.5, k), 0)), lerp(48, 46, k), 30, .6); } });
// 2a · Larry Walters always wanted to fly.: in his backyard lawn chair, watching a plane go over
sh({ t0: C2, set: 'yard', lt: SUNNY, at: CH0, act: t => actDream(t),
  cam: (t, u) => { const k = eio(seg(t, tFly2 - .6, tBut2)); return hand(camAt(CH0.clone().add(V(lerp(.9, .6, k), lerp(.75, .55, k), lerp(2.1, 1.7, k))), CH0.clone().add(V(0, lerp(1.0, 2.8, k), lerp(0, -2, k))), 54, 2.0, 3), t); } });
// 2b · But the Air Force rejected him.: the recruiting office, the stamp
sh({ t0: tBut2 - .1, set: 'office', lt: INSIDE, at: OFO, act: t => actOffice(t),
  cam: (t, u) => hand(camAt(OFO.clone().add(V(lerp(1.7, 1.5, u), 1.6, lerp(2.9, 2.6, u))), OFO.clone().add(V(-.8, 1.4, -1.0)), 50, 3.6, 3), t) });
// 2c · Bad eyesight.: his view of the eye chart, a blur
sh({ t0: tBad - .1, set: 'office', lt: INSIDE, at: OFO, act: t => actOffice(t),
  cam: (t, u) => camAt(OFO.clone().add(V(-1.6, 1.85, lerp(.6, .3, u))), OFO.clone().add(V(-1.6, 1.88, -2.88)), 36, .6, 60) });
// 3a · So he built his own aircraft:: filling balloons in the yard
sh({ t0: C3, set: 'yard', lt: SUNNY, at: CH0, act: t => actBuild(t),
  cam: (t, u) => hand(camAt(CH0.clone().add(V(lerp(-.6, -.9, u), lerp(1.4, 1.5, u), lerp(5.6, 5.0, eo(u)))), CH0.clone().add(V(-1.6, 3.0, -1.0)), 56, 5.4, 2), t) });
// 3b · 42 helium balloons and a lawn chair.: from the chair, tilt up the column of balloons
sh({ t0: t42b - .15, set: 'yard', lt: SUNNY, at: CH0, act: t => actBuild(t),
  cam: (t, u) => { const k = eio(u); return hand(camAt(CH0.clone().add(V(lerp(1.4, 2.2, k), lerp(.9, 1.4, k), lerp(2.4, 5.6, k))), CH0.clone().add(V(0, lerp(1.0, 5.6, k), 0)), lerp(44, 52, k), 5, 2), t); } });
// 4a · He packed sandwiches, a radio… and a pellet gun.: in the chair, each thing arriving
sh({ t0: C4, set: 'yard', lt: SUNNY, at: CH0, act: t => actPack(t),
  cam: (t, u) => hand(camAt(CH0.clone().add(V(lerp(.5, .35, u), lerp(1.15, 1.1, u), lerp(2.1, 1.75, eo(u)))), CH0.clone().add(V(0, .82, 0)), 42, 1.9, 5), t) });
// 4b · The plan: …: wide on the yard (the plan is drawn over it)
sh({ t0: tPlan - .1, set: 'yard', lt: SUNNY, at: CH0, act: t => actPack(t),
  cam: (t, u) => hand(camAt(CH0.clone().add(V(lerp(5, 4.4, u), lerp(3.4, 3.2, u), lerp(9, 8.2, u))), CH0.clone().add(V(0, 3.2, 0)), 50, 10, 1), t, .5) });
// 5a · The chair was tied to his Jeep.: hovering on its rope
sh({ t0: C5, set: 'yard', lt: SUNNY, at: CH0, act: t => actTether(t),
  cam: (t, u) => hand(camAt(CH0.clone().add(V(lerp(-1.6, -1.2, u), lerp(1.5, 1.6, u), lerp(8.4, 7.6, u))), CH0.clone().add(V(1.5, 2.4, 1.0)), 54, 7.5, 2), t) });
// 5b · Then the rope snapped.: the rope at the Jeep's bumper
sh({ t0: tThen5 - .1, set: 'yard', lt: SUNNY, at: CH0, act: t => actTether(t),
  cam: (t, u) => { const hp = HITCH(); return shake(hand(camAt(hp.clone().add(V(-.4, .55, 2.0)), hp.clone().add(V(-1.3, .95, -.4)), 46, 2.2, 5), t, .6), t, t > tSnapped ? 1 - seg(t, tSnapped, tSnapped + .4) : 0); } });
// 6a · Larry shot straight up.: from the ground, up: gone
sh({ t0: C6, set: 'yard', lt: SUNNY, at: CH0, act: t => actLaunch(t),
  cam: (t, u) => hand(camAt(CH0.clone().add(V(-2.2, 1.2, 9.4)), CH0.clone().add(V(0, lerp(4.0, 5.5, u), 0)), 62, 10, 1), t, .8) });
// 6b · Three miles high, freezing, in a lawn chair.: up there, shivering; pull back on "in a lawn chair"
sh({ t0: tThree - .1, set: 'sky', lt: HIGH, at: SKYP, act: t => actFreeze(t),
  cam: (t, u) => { const k = eio(seg(t, tLawn6 - .15, C7)); return hand(camAt(SKYP.clone().add(V(lerp(.3, 2.2, k), lerp(1.25, 1.9, k), lerp(2.0, 5.4, k))), SKYP.clone().add(V(0, lerp(1.02, 1.7, k), 0)), lerp(40, 50, k), lerp(2.0, 5.4, k), 4), t, .6); } });
// 7a · He drifted into the path of planes landing at LAX.: an airliner thunders past behind him
sh({ t0: C7, set: 'sky', lt: HIGH, at: SKYP, act: t => actPlanes(t),
  cam: (t, u) => hand(camAt(SKYP.clone().add(V(lerp(1.8, 1.5, u), lerp(.9, 1.0, u), lerp(3.8, 3.4, u))), SKYP.clone().add(V(-.6, 2.4, -4)), 50, 4, 2), t, .7) });
// 7b · Two pilots radioed the tower:: the flight deck
sh({ t0: tTwo - .1, set: 'cockpit', lt: HIGH, at: CPO, act: t => actCockpit(t),
  cam: (t, u) => { const c = CPIT.localToWorld(V(lerp(-.1, -.05, u), 1.3, -.95)), l = CPIT.localToWorld(V(.42, 1.12, .1)); return hand(camAt(c, l, 62, 1.2, 4), t, .5); } });
// 7c · there's a man in a lawn chair up here.: through the windscreen
sh({ t0: tTheres - .1, set: 'cockpit', lt: HIGH, at: CPO, act: t => actCockpit(t),
  cam: (t, u) => { const c = CPIT.localToWorld(V(-.1, 1.85, .5)), l = SKYP.clone().add(V(0, 2.6, 0)); return hand(camAt(c, l, lerp(30, 24, eo(u)), c.distanceTo(l), .6), t, .4); } });
// 8a · Larry pulled out the gun. Pop. Pop. Pop.: low beside him, aiming up into the balloons
sh({ t0: C8, set: 'sky', lt: HIGH, at: SKYP, act: t => actPop(t),
  cam: (t, u) => hand(camAt(SKYP.clone().add(V(lerp(2.8, 2.6, u), .7, lerp(1.4, 1.3, u))), SKYP.clone().add(V(0, 3.0, 0)), 64, 3.2, 2), t, .6) });
// 8b · Then he dropped it.: over his shoulder, the gun tumbling away toward the clouds
sh({ t0: tThen8 - .1, set: 'sky', lt: HIGH, at: SKYP, act: t => actPop(t),
  after: 1, cam: (t, u) => { const g = GUN2.position.clone(); return hand(camAt(SKYP.clone().add(V(.45, 2.4, .9)), g.clone().lerp(SKYP.clone().add(V(0, .2, .5)), .35), 50, 3, 3, .05), t, .7); } });
// 9a · He came down…: sinking past the rooftops
sh({ t0: C9, set: 'street', lt: SUNNY, at: STO, act: t => actDescend(t),
  after: 1, cam: (t, u) => { const p = CRAFT.position.clone(); return hand(camAt(STO.clone().add(V(-4.5, lerp(14, 10.5, u), 7)), p.clone().add(V(0, 1.6, 0)), 50, 12, 1), t, .6); } });
// 9b · right into power lines,: snagged, sparks
sh({ t0: tRight9 - .1, set: 'street', lt: SUNNY, at: STO, act: t => actDescend(t),
  cam: (t, u) => shake(hand(camAt(SNAG.clone().add(V(lerp(2.4, 2.1, u), lerp(-.8, -.6, u), lerp(5.6, 5.0, u))), SNAG.clone().add(V(0, 1.0, 0)), 48, 5.5, 2), t), t, t > tPower ? .8 * (1 - seg(t, tPower, tPower + .6)) : 0) });
// 9c · and blacked out an entire neighborhood.: a living room goes dark
sh({ t0: tBlacked - .1, set: 'room', lt: 'blackout', at: RMO, act: t => actRoom(t),
  cam: (t, u) => hand(camAt(RMO.clone().add(V(lerp(1.9, 1.7, u), 1.35, lerp(-1.3, -1.1, u))), RMO.clone().add(V(-.4, 1.0, 1.0)), 54, 2.8, 3), t) });
// 10a · Police were waiting.: the squad car, lights going
sh({ t0: C10, set: 'street', lt: SUNNY, at: STO, act: t => actPolice(t),
  cam: (t, u) => hand(camAt(STO.clone().add(V(lerp(9.5, 9.0, u), 1.4, lerp(3.2, 2.8, u))), STO.clone().add(V(4.8, 1.4, -3.6)), 48, 5, 3), t) });
// 10b · Asked why he did it, Larry said:: the reporters
sh({ t0: tAsked - .1, set: 'street', lt: SUNNY, at: STO, act: t => actPress(t),
  cam: (t, u) => hand(camAt(STO.clone().add(V(lerp(7.4, 7.1, u), 1.6, lerp(-.4, -.7, u))), STO.clone().add(V(4.7, 1.4, -3.6)), 48, 3.8, 4), t) });
// 10c · "A man can't just sit around.": Larry, close, the grin
sh({ t0: tMan - .25, set: 'street', lt: SUNNY, at: STO, act: t => actPress(t),
  after: 1, cam: (t, u) => { const h = headOf(LARRY); return hand(camAt(h.clone().add(V(lerp(.25, .15, u), .02, lerp(1.25, 1.05, u))), h.clone().add(V(0, .05, 0)), 36, 1.2, 6), t, .5); } });
// 11 · Would you get in the chair?: the empty chair in the yard, balloons tugging; tilt up
sh({ t0: C11, set: 'yard', lt: SUNNY, at: CH0, act: t => actEmpty(t),
  cam: (t, u) => { const k = eio(u); return hand(camAt(CH0.clone().add(V(lerp(.9, 1.6, k), lerp(.7, .9, k), lerp(2.6, 4.2, k))), CH0.clone().add(V(0, lerp(1.0, 4.2, k), 0)), 50, 3.4, 3), t); } });
SHOTS.forEach((s, i) => { s.t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : LOOP; });
SHOTS.push({ ...SHOTS[0], t0: LOOP, t1: DUR + 1, loop: 1 });

// ---------------- acting ----------------
function actHook(t) {
  reset();
  flyer(t, SKYP, { face: t > tFeet - .3 ? 'laugh' : 'happy', look: SKYP.clone().add(V(4, -2, 6)), pose: { aL: [-60, 30, 0, 60], aR: [-150, 20, 0, 20] } });
  place(PLANE, SKYO.clone().add(V(lerp(-160, 160, seg(t, 0, 6)), -26, -60)), [0, 0, 0], 1);
}
function actDream(t) {
  reset();
  place(CHAIR2, CH0, [0, 0, 0]); put(LARRY, CH0.clone().add(V(0, .02, .06)), 0);
  const point = t > tFly2 - .4;
  apply(LARRY, { ...TP.sit, y: -.06, sp: [-10, 0, 0], aR: point ? [-150, 10, 0, 10] : [-30, 20, 0, 50] }, { t, seed: 1, face: 'happy', look: CH0.clone().add(V(0, 6, 3)) });
  place(PLANE, CH0.clone().add(V(lerp(-50, 40, seg(t, C2, C2 + 5)), 24, -14)), [0, 0, .05], .7);
}
function actOffice(t) {
  reset();
  const larryP = OFO.clone().add(V(-.6, 0, .3)); put(LARRY, larryP, Math.PI + .35);
  apply(LARRY, { ...TP.stand, sp: [14, 0, 0], hd: [10, 0, 0] }, { t, seed: 1, face: t > tRejected ? 'worried' : 'deadpan', look: OFO.clone().add(V(-1.6, 1.9, -2.88)), eyes: [0, .2] });
  const op = OFO.clone().add(V(-.1, 0, -1.9)); put(OFFICER, op, 0);
  const stamp = seg(t, tRejected - .25, tRejected) * (1 - seg(t, tRejected + .2, tRejected + .5));
  apply(OFFICER, { ...TP.sit, y: -.06, aR: [-60 - 70 * (1 - stamp), 10, 0, 40], aL: [-50, 10, 0, 60] }, { t, seed: 30, face: 'deadpan', look: headOf(LARRY) });
  if (t >= tBad - .1) LARRY.P.visible = false;
}
function actBuild(t) {
  reset();
  // the cluster growing as the balloons are filled; Larry at a tank with the one being filled
  const n = Math.round(lerp(24, 42, seg(t, C3, t42b + .2)));
  place(CRAFT, CH0, [0, 0, 0]); CL.userData.pop(42 - n);
  const lp = CH0.clone().add(V(-2.6, 0, -1.2)); put(LARRY, lp, .6);
  const filling = t < t42b - .15;
  apply(LARRY, filling ? { ...TP.stand, aR: [-70, 20, 0, 60], aL: [-90, -10, 0, 40] } : TP.cheer, { t, seed: 1, face: filling ? 'proud' : 'laugh', look: filling ? lp.clone().add(V(.2, 1.9, .4)) : CAMP });
  if (filling) { const k = .4 + .6 * ((t * .9) % 1); place(BLOON, lp.clone().add(V(.55, 1.9 + .5 * k, .55)), [0, 0, 0], k); }
  FR.forEach((p, i) => { const v = CH0.clone().add(V(2.0 + i * .9, 0, 1.2 - i * .5)); put(p, v, face(v, V(0, 4, 0))); apply(p, i ? TP.point : TP.hips, { t, seed: 4 + i, face: 'shock', look: V(0, 5, 0) }); });
}
function actPack(t) {
  reset();
  flyer(t, CH0, { face: t > tPellet ? 'proud' : 'happy', look: CAMP, pose: { aR: t > tPellet - .1 ? [-70, 10, 0, 60] : [-30, 20, 0, 50] } });
  const pop = (o, t0, v, rot, s) => { if (t < t0 - .05) return; const k = back(seg(t, t0 - .05, t0 + .2), 2.2); place(o, v, rot, s * k); };
  pop(SAND, tSand, CH0.clone().add(V(.33, .66, .05)), [0, .3, 0], 1.6);
  pop(RAD, tRadio, CH0.clone().add(V(-.33, .7, .0)), [0, -.4, 0], 1.3);
  if (t >= tPellet - .05) { const k = back(seg(t, tPellet - .05, tPellet + .2), 2.2); onHand(LARRY, GUN, 0, [0, -.02, .05], [-.3, 0, 0]); GUN.scale.setScalar(1.2 * k); }
  FR.forEach((p, i) => { const v = CH0.clone().add(V(-2.4 + i * 5, 0, 2.6)); put(p, v, face(v, CH0)); apply(p, TP.stand, { t, seed: 4 + i, face: 'happy', look: headOf(LARRY) }); });
}
function actTether(t) {
  reset();
  const snapped = t >= tSnapped;
  const v = snapped ? RISE(t) : HOVER.clone().add(V(Math.sin(t * 1.3) * .08, Math.sin(t * 2.1) * .06, 0));
  flyer(t, v, { face: snapped ? 'shock' : 'laugh', look: snapped ? HITCH() : CAMP, pose: { aL: [-150, 20, 0, 20], aR: [-30, 20, 0, 50] } });
  onHand(LARRY, GUN, 0, [0, -.02, .05], [-.3, 0, 0]); GUN.scale.setScalar(1.2);
  const a = HITCH(), b = v.clone().add(V(0, .05, 0));
  if (!snapped) { ROPE = rope(a, b, .15); scene.add(ROPE); }
  else { const k = seg(t, tSnapped, tSnapped + .5), mid = a.clone().lerp(b, .5);   // the two ends whip apart
    const r1 = rope(a, a.clone().lerp(mid, .9).add(V(0, -1.2 * k, .3 * k)), .2), r2 = rope(b, b.clone().lerp(mid, .9).add(V(0, .6 * k, -.4 * k)), .2); scene.add(r1, r2); ROPEM.push(r1, r2); }
  FR.forEach((p, i) => { const fv = CH0.clone().add(V(-1.4 - i * 1.0, 0, 2.4 + i * .6)); put(p, fv, face(fv, b)); apply(p, snapped ? (i ? TP.cheer : TP.point) : TP.stand, { t, seed: 4 + i, face: snapped ? 'shock' : 'happy', look: b }); });
}
function actLaunch(t) {
  reset();
  const v = RISE(t); flyer(t, v, { face: 'shock', look: v.clone().add(V(0, -4, 3)), pose: { aL: [-150, 30, 0, 20], aR: [-150, 30, 0, 20] } });
  FR.forEach((p, i) => { const fv = CH0.clone().add(V(-1.0 - i * .9, 0, 3.0 + i * .5)); put(p, fv, face(fv, CH0)); apply(p, i ? TP.cheer : TP.point, { t, seed: 4 + i, face: 'shock', look: v.clone().add(V(0, 2, 0)) }); });
}
function actFreeze(t) {
  reset();
  flyer(t, SKYP, { face: 'worried', look: SKYP.clone().add(V(.5, -1, 4)), shiver: 1, pose: { aL: [-40, -40, 0, 140], aR: [-40, -40, 0, 140] } });
  // breath puffs
  const h = headOf(LARRY); PUFF.forEach((p, i) => { const k = ((t * .8 + i / 4) % 1); p.visible = true; p.position.copy(h).add(V(.02, -.06 + k * .2, .18 + k * .3)); p.scale.setScalar(.6 + k * 1.6); p.material.opacity = .55 * (1 - k); });
}
function actPlanes(t) {
  reset();
  flyer(t, SKYP, { face: t > tLAX ? 'shock' : 'happy', look: PLANE.position, pose: { aR: t > tLAX ? [-20, 150, 0, 30] : [-30, 20, 0, 50] } });
  place(PLANE, SKYP.clone().add(V(lerp(-75, 55, seg(t, C7 - .2, tTwo + .3)), -4, -62)), [0, 0, .02], 1);
}
function actCockpit(t) {
  reset();
  // the two pilots; the captain points out, the first officer on the radio; Larry and his balloons out there
  CPIT.rotation.y = face(CPO, SKYP) + Math.PI; CPIT.updateMatrixWorld(true);
  const s0 = CPIT.localToWorld(V(-.55, .02, .02)), s1 = CPIT.localToWorld(V(.55, .02, .02));
  put(PIL[0], s0, CPIT.rotation.y + Math.PI); put(PIL[1], s1, CPIT.rotation.y + Math.PI);
  const look = SKYP.clone().add(V(0, 2, 0)), seen = t > tTwo + .2;
  apply(PIL[0], { ...TP.sit, y: -.04, aR: seen ? [-110, 10, 0, 10] : [-60, 10, 0, 60], aL: [-60, 10, 0, 60] }, { t, seed: 31, face: seen ? 'shock' : 'calm', look });
  apply(PIL[1], { ...TP.sit, y: -.04, aL: [-120, -30, 0, 140], aR: [-60, 10, 0, 60] }, { t, seed: 32, face: 'shock', look, talk: t > tTwo && t < tTower + .5 ? clamp(.5 + .5 * Math.sin(t * 18)) : 0 });
  flyer(t, SKYP, { face: 'happy', look: CPO, pose: { aR: [-20, 150, 0, 30] } });
}
function actPop(t) {
  reset();
  const k = tPop.filter(x => t >= x).length, dropped = t >= tDropped - .1;
  flyer(t, SKYP, { k, face: dropped ? 'shock' : k ? 'laugh' : 'proud', look: dropped ? GUN2.position : SKYP.clone().add(V(0, 5, 0)), pose: dropped ? { aL: [-90, 20, 0, 40], aR: [-90, -20, 0, 40] } : { aR: [-150, 10, 0, 10], aL: [-140, -10, 0, 30], hd: [-30, 0, 0] } });
  if (!dropped) { onHand(LARRY, GUN, 0, [0, -.02, .05], [-1.6, 0, 0]); GUN.scale.setScalar(1.2); }
  else { const f = t - (tDropped - .1); place(GUN2, SKYP.clone().add(V(.2 + f * .3, .9 - 4.9 * f * f, .5 + f * .2)), [f * 6, f * 3, f * 4], 1.2); }
  // pop flashes at the balloons as they go
  tPop.forEach((x, i) => { const a = seg(t, x, x + .25); if (a <= 0 || a >= 1) return; const b = CL.userData.balls[i]; const P2 = POPS[i]; P2.visible = true; P2.position.copy(b.getWorldPosition(V())); P2.scale.setScalar(.6 + a * 1.6); P2.material.opacity = .9 * (1 - a); P2.rotation.set(a * 3, a * 2, 0); });
}
function actDescend(t) {
  reset();
  const snag = t >= tPower - .05, v = snag ? SNAG : DESC(t);
  flyer(t, v, { k: 3, face: snag ? 'shock' : 'worried', look: snag ? v.clone().add(V(0, 2, 0)) : CAMP, pose: snag ? { aL: [-150, 30, 0, 20], aR: [-150, 30, 0, 20] } : {} });
  if (snag) { CRAFT.rotation.z = .12 + Math.sin(t * 9) * .03; SPARK.forEach((s, i) => { const k = ((t * 3 + hash(i)) % 1); s.visible = hash(i + Math.floor(t * 12)) > .3; s.position.copy(SNAG).add(V(-.3 + hash(i * 3) * .6 + (hash(i * 7) - .5) * 2 * k, 1.27 - k * k * 2.5, (hash(i * 5) - .5) * 1.5 * k)); s.scale.setScalar(1 - k * .7); }); }
}
function actRoom(t) {
  reset();
  const out = t >= tOut9 + .05;
  RM.userData.screen.visible = !out; RM.userData.bulb.visible = !out;
  lampL.position.copy(RMO.clone().add(RM.userData.lampPos));
  FAM.forEach((p, i) => { const v = RMO.clone().add(V(-.5 + i * 1.0, 0, 1.45)); put(p, v, Math.PI); apply(p, out ? { ...TP.sitShock, y: -.06 } : { ...TP.sit, y: -.06 }, { t, seed: 38 + i, face: out ? 'shock' : 'happy', look: out ? CAMP : RMO.clone().add(V(0, 1.0, -2.2)) }); });
}
function actPolice(t) {
  reset();
  place(COPCAR, STO.clone().add(V(2.2, 0, -2.4)), [0, Math.PI / 2 + .2, 0]);
  const on = Math.sin(t * 14) > 0; COPCAR.userData.lights[0].visible = on; COPCAR.userData.lights[1].visible = !on;
  place(CRAFT, SNAG, [0, 0, .12]); CL.userData.pop(3);
  const lp = STO.clone().add(V(4.6, 0, -3.6)); put(LARRY, lp, .9); apply(LARRY, { ...TP.stand, aL: [-20, 10, 0, 20], aR: [-20, 10, 0, 20] }, { t, seed: 1, face: 'worried', look: headOf(COP[0]) });
  COP.forEach((p, i) => { const v = lp.clone().add(V(1.0 + i * .2, 0, .6 - i * 1.2)); put(p, v, face(v, lp)); apply(p, i ? TP.hips : { ...TP.stand, aR: [-60, 10, 0, 40] }, { t, seed: 33 + i, face: 'deadpan', look: headOf(LARRY) }); });
}
function actPress(t) {
  reset();
  place(COPCAR, STO.clone().add(V(2.2, 0, -2.4)), [0, Math.PI / 2 + .2, 0]); const on = Math.sin(t * 14) > 0; COPCAR.userData.lights[0].visible = on; COPCAR.userData.lights[1].visible = !on;
  place(CRAFT, SNAG, [0, 0, .12]); CL.userData.pop(3);
  const lp = STO.clone().add(V(4.6, 0, -3.6)); put(LARRY, lp, face(lp, STO.clone().add(V(7.3, 0, -.5))));
  const quote = t > tMan - .1;
  apply(LARRY, quote ? TP.shrug : TP.stand, { t, seed: 1, face: quote ? 'happy' : 'calm', look: quote ? CAMP : headOf(REP[0]), talk: t > tMan - .1 && t < LOOP - .4 ? clamp(.5 + .5 * Math.sin(t * 17)) : 0 });
  REP.forEach((p, i) => { const v = lp.clone().add([V(1.23, 0, .11), V(-.04, 0, 1.24), V(1.97, 0, .27)][i]); put(p, v, face(v, lp)); apply(p, i < 2 ? { ...TP.stand, aR: [-80, 10, 0, 50] } : { ...TP.stand, aR: [-110, 10, 0, 120], aL: [-100, -10, 0, 110] }, { t, seed: 35 + i, face: 'happy', look: headOf(LARRY) }); if (i < 2) onHand(p, MICS[i], 0, [0, 0, .04], [-1.2, 0, 0]); });
  onHand(REP[2], TVC, 0, [-.08, .12, -.1], [0, 0, 0]);
  COP.forEach((p, i) => { const v = lp.clone().add([V(-.34, 0, -1.3), V(-1.24, 0, -.5)][i]); put(p, v, face(v, lp)); apply(p, TP.cross, { t, seed: 33 + i, face: 'deadpan', look: headOf(LARRY) }); });
}
function actEmpty(t) {
  reset();
  place(CRAFT, CH0.clone().add(V(0, .05 + Math.max(0, Math.sin(t * 2.2)) * .06, 0)), [Math.sin(t * 1.4) * .03, 0, Math.sin(t * 1.1) * .03]);
}

// ---------------- sound events (the score reads these) ----------------
ev(0, 'wind', { d: C2 }); ev(.05, 'boom'); ev(t42, 'pop'); ev(tFlew, 'whoosh'); ev(t16k, 'rise', { d: 1.2 });
ev(C2, 'birds', { d: tBut2 - C2 }); ev(C2 + .5, 'jetfar', { d: 3 }); ev(tRejected, 'stamp'); ev(tBad, 'blur');
ev(C3, 'birds', { d: C6 - C3 }); for (let k = 0; k < 4; k++) ev(C3 + .2 + k * .55, 'inflate'); ev(t42b, 'pop');
ev(tSand, 'pop'); ev(tRadio, 'radio'); ev(tPellet, 'click'); ev(tPlan, 'pencil', { d: C5 - tPlan });
ev(tJeep, 'creak'); ev(tSnapped, 'snap'); ev(C6 - .05, 'launch', { d: 2 });
ev(tThree, 'wind', { d: C8 - tThree + 3 }); ev(tFreezing, 'shiver');
ev(C7, 'jetby', { d: 3.2 }); ev(tTwo, 'radio'); ev(tTheres - .2, 'static', { d: .6 });
tPop.forEach(x => ev(x, 'gunpop')); ev(tDropped, 'fall', { d: 1.2 });
ev(C9, 'street', { d: C11 - C9 }); ev(tPower, 'zap'); ev(tPower + .3, 'zap'); ev(tOut9 + .05, 'powerdown');
ev(C10, 'siren', { d: tAsked - C10 + .5 }); ev(tAsked, 'flash'); ev(tAsked + .6, 'flash'); ev(tSaid, 'flash'); ev(tMan + .8, 'laugh');
ev(C11, 'birds', { d: DUR - C11 }); ev(LOOP - 1.0, 'sting');

// ---------------- the overlay: telops, the plan, the checklist, POPs, captions ----------------
const ov = document.getElementById('ov').getContext('2d');
const fmtFt = n => n.toLocaleString('en-US');
const TEL = [
  { t0: t42 - .05, t1: tFlew - .1, text: '42 BALLOONS', y: 300, size: 130, col: '#FFFFFF', rot: -4, plate: '#E8602A' },
  { t0: tFlew - .05, t1: C2, text: t => `${fmtFt(Math.round(lerp(0, 16000, eo(seg(t, tFlew, tFeet + .1))) / 100) * 100)} FT`, y: 300, size: 140, col: '#FFFFFF', rot: -3, plate: '#16131A', mono: 1 },
  { t0: tLarry2 - .05, t1: tBut2 - .1, text: 'LARRY WALTERS', y: 1500, size: 90, col: '#FFFFFF', rot: -2, plate: '#2A3A7A', sub: 'TRUCK DRIVER · LOS ANGELES' },
  { t0: tRejected - .03, t1: C3, text: 'REJECTED', y: 320, size: 150, col: '#E8423A', rot: -8, stamp: 1 },
  { t0: tAircraft - .05, t1: t42b - .15, text: 'THE AIRCRAFT', y: 300, size: 110, col: '#FFFFFF', rot: -3, plate: '#2E7FE0' },
  { t0: t42b - .05, t1: C4, text: '42 × 🎈  +  1 × 🪑', y: 300, size: 96, col: '#FFFFFF', rot: -3, plate: '#16131A' },
  { t0: tSnapped - .03, t1: C6, text: 'SNAP!', y: 640, size: 220, col: '#FFD23F', rot: -10, stamp: 1 },
  { t0: tThree - .05, t1: tLawn6 - .1, text: '3 MILES UP', y: 300, size: 130, col: '#FFFFFF', rot: -4, plate: '#16131A' },
  { t0: tFreezing - .05, t1: C7, text: '❄ FREEZING', y: 1480, size: 100, col: '#BFE8FF', rot: 3, plate: '#1E3A6E' },
  { t0: tLAX - .05, t1: tTwo - .1, text: '✈ LAX FLIGHT PATH', y: 300, size: 100, col: '#FFFFFF', rot: -3, plate: '#C8283A' },
  { t0: tTheres - .1, t1: C8, text: '📻 LAX TOWER', y: 300, size: 90, col: '#16131A', rot: -2, plate: '#F2C230' },
  { t0: tBlacked - .05, t1: C10, text: '⚡ BLACKOUT', y: 300, size: 140, col: '#FFD23F', rot: -5, plate: '#16131A' },
  { t0: tPolice + .2, t1: tAsked - .1, text: 'ARRESTED', y: 320, size: 150, col: '#E8423A', rot: -8, stamp: 1 },
  { t0: tWould - .05, t1: LOOP, text: 'WOULD YOU?', y: 300, size: 150, col: '#FFD23F', rot: -5, plate: '#16131A', yn: 1 },
];
function drawTelop(x, t) {
  const p = seg(t, x.t0, x.t0 + .25), sc = x.stamp ? lerp(2.2, 1, eo(p)) : back(p, 2.6), wob = 1 + .02 * Math.sin((t - x.t0) * 8);
  const text = typeof x.text === 'function' ? x.text(t) : x.text;
  ov.save(); ov.translate(x.x ?? 540, x.y); ov.rotate(x.rot * Math.PI / 180); ov.scale(sc * wob, sc * wob); if (x.stamp) ov.globalAlpha = clamp(p * 3);
  ov.font = `900 ${x.size}px Montserrat`; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  const tw = Math.min(1000, (x.mono ? ov.measureText('16,000 FT').width : ov.measureText(text).width) + 70), th = x.size * 1.4;
  if (x.plate) { ov.fillStyle = 'rgba(0,0,0,.85)'; ov.beginPath(); ov.roundRect(-tw / 2 + 10, -th / 2 + 12, tw, th, 28); ov.fill(); ov.fillStyle = x.plate; ov.beginPath(); ov.roundRect(-tw / 2, -th / 2, tw, th, 28); ov.fill(); }
  if (x.stamp) { ov.strokeStyle = x.col; ov.lineWidth = 16; ov.beginPath(); ov.roundRect(-tw / 2 + 5, -th / 2 + 8, tw - 10, th - 16, 20); ov.stroke(); }
  ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 20; ov.shadowOffsetY = 8; ov.lineWidth = x.size * .2; ov.strokeStyle = x.plate === '#F2C230' ? '#FFFFFF' : '#000'; if (x.plate !== '#F2C230') ov.strokeText(text, 0, 4, 960); ov.shadowColor = 'transparent'; ov.fillStyle = x.col; ov.fillText(text, 0, 4, 960);
  if (x.sub) { ov.font = '900 44px Montserrat'; const sw = ov.measureText(x.sub).width + 44; ov.fillStyle = '#FFD23F'; ov.beginPath(); ov.roundRect(-sw / 2, x.size * .7 + 4, sw, 62, 16); ov.fill(); ov.fillStyle = '#1B1213'; ov.fillText(x.sub, 0, x.size * .7 + 37); }
  ov.restore();
  if (x.yn) {   // ✓ YES / ✗ NO
    [['✓ YES', '#2E9A4A', -230], ['✗ NO', '#C8283A', 230]].forEach(([s, col, dx], i) => { const k = back(seg(t, x.t0 + .2 + i * .12, x.t0 + .45 + i * .12), 2.4); if (k <= 0) return; ov.save(); ov.translate(540 + dx, 520); ov.scale(k, k); ov.fillStyle = col; ov.beginPath(); ov.roundRect(-190, -70, 380, 140, 70); ov.fill(); ov.lineWidth = 10; ov.strokeStyle = '#FFFFFF'; ov.stroke(); ov.fillStyle = '#FFFFFF'; ov.font = '900 80px Montserrat'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.fillText(s, 0, 6); ov.restore(); });
  }
}
// the packing list: three ticks, one per word
function drawPack(t) {
  if (t < C4 || t >= tPlan - .1) return;
  [['🥪 SANDWICHES', tSand], ['📻 RADIO', tRadio], ['🔫 PELLET GUN', tPellet]].forEach(([s, x], i) => { const k = back(seg(t, x - .05, x + .2), 2.2); if (k <= 0) return;
    ov.save(); ov.translate(540, 230 + i * 130); ov.scale(k, k); ov.fillStyle = 'rgba(0,0,0,.8)'; ov.beginPath(); ov.roundRect(-330, -52, 670, 110, 26); ov.fill(); ov.fillStyle = '#FBF6E6'; ov.beginPath(); ov.roundRect(-340, -60, 670, 110, 26); ov.fill();
    ov.fillStyle = '#16131A'; ov.font = '900 64px Montserrat'; ov.textAlign = 'left'; ov.textBaseline = 'middle'; ov.fillText(s, -300, 0, 520); ov.fillStyle = '#2E9A4A'; ov.font = '900 80px Montserrat'; ov.fillText('✓', 240, 4); ov.restore(); });
}
// the plan, drawn on a notepad: the yard → float a while → pop, pop → down in the desert
function drawPlan(t) {
  if (t < tPlan - .1 || t >= C5) return;
  const a = back(seg(t, tPlan - .1, tPlan + .2), 1.8);
  ov.save(); ov.translate(540, 760); ov.scale(a, a); ov.rotate(-.03);
  ov.fillStyle = 'rgba(0,0,0,.35)'; ov.beginPath(); ov.roundRect(-430, -440, 880, 900, 30); ov.fill();
  ov.fillStyle = '#FBF8EC'; ov.beginPath(); ov.roundRect(-440, -450, 880, 900, 30); ov.fill();
  ov.strokeStyle = 'rgba(46,111,181,.28)'; ov.lineWidth = 3; for (let y = -340; y < 440; y += 56) { ov.beginPath(); ov.moveTo(-420, y); ov.lineTo(420, y); ov.stroke(); }
  ov.strokeStyle = 'rgba(200,40,58,.45)'; ov.beginPath(); ov.moveTo(-340, -450); ov.lineTo(-340, 450); ov.stroke();
  ov.fillStyle = '#16131A'; ov.font = '700 92px Fredoka'; ov.textAlign = 'center'; ov.fillText('THE PLAN', 40, -340);
  const ink = '#1E3A6E'; ov.strokeStyle = ink; ov.fillStyle = ink; ov.lineWidth = 9; ov.lineCap = 'round'; ov.lineJoin = 'round';
  const p1 = seg(t, tPlan + .1, tFloat + .3), p2 = seg(t, tFloat + .3, tShoot), p3 = seg(t, tShoot, tDown4 + .2);
  // the house + the craft
  ov.strokeRect(-330, 260, 110, 90); ov.beginPath(); ov.moveTo(-345, 262); ov.lineTo(-275, 200); ov.lineTo(-205, 262); ov.stroke();
  const bal = (x, y, k) => { for (let i = 0; i < 5; i++) { ov.beginPath(); ov.arc(x + (i - 2) * 22, y - 60 - (i % 2) * 22, 20, 0, 7); ov.stroke(); } ov.beginPath(); ov.moveTo(x - 30, y); ov.lineTo(x - 40, y - 40); ov.moveTo(x + 30, y); ov.lineTo(x + 40, y - 40); ov.stroke(); ov.strokeRect(x - 30, y - 10, 60, 30); };
  // 1 · float for a while: a dashed arc across
  const path = u => ({ x: lerp(-200, 220, u), y: 160 - Math.sin(u * Math.PI) * 240 - u * 20 });
  ov.setLineDash([22, 22]); ov.beginPath(); for (let i = 0; i <= 40 * p1; i++) { const q = path(i / 40); i ? ov.lineTo(q.x, q.y) : ov.moveTo(q.x, q.y); } ov.stroke(); ov.setLineDash([]);
  const cp = path(p1); bal(cp.x, cp.y, 1);
  if (p1 > .3) { ov.font = '700 52px Fredoka'; ov.fillText('float a while', 20, 230); }
  // 2 · pop pop
  if (p2 > 0) { ov.fillStyle = '#C8283A'; ov.font = '700 64px Fredoka'; ov.fillText('POP!', 300, -60 + (1 - back(p2, 2)) * 30); if (p2 > .5) ov.fillText('POP!', 340, 20); ov.fillStyle = ink; }
  // 3 · down: an arrow to a cactus
  if (p3 > 0) { ov.beginPath(); ov.moveTo(300, 80); ov.lineTo(300, 80 + 200 * p3); ov.stroke(); if (p3 > .9) { ov.beginPath(); ov.moveTo(270, 250); ov.lineTo(300, 285); ov.lineTo(330, 250); ov.stroke(); }
    if (p3 > .5) { ov.strokeStyle = '#2E9A4A'; ov.lineWidth = 12; ov.beginPath(); ov.moveTo(370, 360); ov.lineTo(370, 250); ov.moveTo(370, 300); ov.lineTo(340, 300); ov.lineTo(340, 270); ov.moveTo(370, 290); ov.lineTo(400, 290); ov.lineTo(400, 260); ov.stroke(); ov.fillStyle = '#16131A'; ov.font = '700 52px Fredoka'; ov.fillText('land', 230, 400); } }
  ov.restore();
}
// POP! bursts on the three pops
function drawPops(t) {
  tPop.forEach((x, i) => { const a = seg(t, x - .02, x + .45); if (a <= 0 || a >= 1) return; const [px, py, r] = [[330, 520, -8], [740, 430, 7], [520, 300, -4]][i];
    ov.save(); ov.translate(px, py); ov.rotate(r * Math.PI / 180); const s = back(seg(t, x - .02, x + .12), 3) * (1 - .2 * a); ov.scale(s, s); ov.globalAlpha = 1 - seg(a, .7, 1);
    ov.fillStyle = '#FFD23F'; ov.beginPath(); for (let k = 0; k < 16; k++) { const ang = k / 16 * Math.PI * 2, rr = k % 2 ? 110 : 170; ov.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); } ov.closePath(); ov.fill(); ov.lineWidth = 10; ov.strokeStyle = '#16131A'; ov.stroke();
    ov.fillStyle = '#E8423A'; ov.font = '900 96px Montserrat'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineWidth = 12; ov.strokeStyle = '#FFFFFF'; ov.strokeText('POP!', 0, 6); ov.fillText('POP!', 0, 6); ov.restore(); });
}
// camera flashes on the press
function drawFlash(t) { for (const x of [tAsked, tAsked + .6, tSaid]) { const a = seg(t, x, x + .18); if (a > 0 && a < 1) { ov.fillStyle = `rgba(255,255,255,${.75 * (1 - a)})`; ov.fillRect(0, 0, W, H); } } }
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
  const tt = sh.loop ? .6 : t, u = sh.loop ? 0 : seg(t, sh.t0, sh.t1);
  const lt = sh.lt === 'blackout' ? (tt >= tOut9 + .05 ? DARK : ROOM) : sh.lt;
  light(lt, sh.at);
  for (const [k, arr] of Object.entries(SETS)) arr.forEach(s => s.visible = false);
  SETS[sh.set].forEach(s => s.visible = true);
  let c = sh.after ? null : sh.cam(tt, u); if (c) CAMP.copy(c.pos);
  sh.act(tt);
  if (!c) { c = sh.cam(tt, u); CAMP.copy(c.pos); }
  camera.position.copy(c.pos); sky.position.copy(c.pos); camera.up.set(0, 1, 0); camera.lookAt(c.look); camera.rotateZ(c.roll ?? 0); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  post.dof.focus = c.focus; post.dof.aper = c.aper; post.dof.maxCoc = sh.set === 'office' && tt >= tBad - .1 ? 26 : 8;
  scene.updateMatrixWorld(true); post.composer.render();
}
const A0 = +(QS.get('a') ?? 0), B0 = +(QS.get('b') ?? DUR);
const shotAt = t => { const i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1); return SHOTS[i < 0 ? SHOTS.length - 1 : i]; };
function render(t) {
  const sh = shotAt(t);
  ov.clearRect(0, 0, W, H);
  frame(sh, t);
  if (QS.get('poster')) { ov.clearRect(0, 0, W, H); [['42 BALLOONS', 200, -4, '#FFFFFF', 130, '#E8602A'], ['16,000 FT', 380, -4, '#FFD23F', 150, '#16131A']].forEach(([text, y, rot, col, size, plate]) => drawTelop({ t0: -9, text, y, size, col, rot, plate }, t)); return; }
  if (QS.get('clean')) return;
  if (t < LOOP) { TEL.forEach(x => { if (t >= x.t0 && t < x.t1) drawTelop(x, t); }); drawPack(t); drawPlan(t); drawPops(t); drawFlash(t); drawCaption(t); }
}
function texts(t) { if (t >= LOOP) return []; return TEL.filter(x => typeof x.text === 'string' && t >= x.t0 + .3 && t < x.t1).map(x => ({ id: x.text, text: x.text, x0: 60, y0: x.y - x.size * .7, x1: 1020, y1: x.y + x.size * .7 })); }
EV.sort((a, b) => a.t - b.t);
window.SHOTLIST = SHOTS.map(s => [+s.t0.toFixed(3), +s.t1.toFixed(3), null]);
window.DUR = +(B0 - A0).toFixed(3); window.EV = EV; window.render = t => render(t + A0); window.TEXTS = t => texts(t + A0);
render(A0);
window.READY = true;
