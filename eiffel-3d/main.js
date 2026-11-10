// "The Man Who Sold the Eiffel Tower" · 3D vertical Short (1080×1920).
// Every shot, action, telop and caption is placed from timing.json (the voice). render(t) is a pure function of t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makePost } from '/core/three/post.js';
import { G, M, mat, cyl } from './kit.js';
import { makeCast, CAST, POSES, apply, mixPose, walkPose, cane, envelope, moneyStack } from './person2.js';
import { boulevard, salon } from './sets3.js';
import { hotelStreet, tourer, newspaper, letter, rubberStamp, inkwell, bigTag, banknotes, whistle } from './sets4.js';
import { skyDome } from './sets.js';

const W = 1080, H = 1920;
await document.fonts.load('700 80px Fredoka'); await document.fonts.load('600 40px Fredoka');
const TM = await (await fetch('timing.json')).json();
const B = 60 / TM.bpm, DUR = TM.dur, LOOP = DUR - B;
const LN = Object.fromEntries(TM.lines.map(l => [l.id, l]));
const nrm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const w = (lid, word, k = 0) => { const ws = LN[lid].words.filter(x => nrm(x.w).startsWith(nrm(word))); return (ws[k] || ws[ws.length - 1] || { t0: LN[lid].t0 }).t0; };
const cut = id => LN[id].cut;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), lerp = (a, b, u) => a + (b - a) * u;
const ss = u => u * u * (3 - 2 * u), eo = u => 1 - Math.pow(1 - u, 3), ei = u => u * u * u, eio = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
const back = (u, s = 1.7) => { u = clamp(u) - 1; return 1 + u * u * ((s + 1) * u + s); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const path = (u, a, b, c) => a.clone().multiplyScalar((1 - u) * (1 - u)).add(b.clone().multiplyScalar(2 * u * (1 - u))).add(c.clone().multiplyScalar(u * u));
const camAt = (pos, look, fov = 40, focus, aper = 5) => ({ pos, look, fov, focus: focus ?? pos.distanceTo(look), aper });
const EV = []; const ev = (t, s, o = {}) => EV.push({ t: +t.toFixed(3), s, ...o });

// ---------------- renderer / post ----------------
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .5;
const camera = new THREE.PerspectiveCamera(40, W / H, .05, 1200);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, ao: true, aoRadius: .5, aoThickness: 1, aoScale: 1.6, aoAmt: .75 });
post.bloom.strength = .3; post.bloom.threshold = .95; post.bloom.radius = .6;
const vg = post.vig.uniforms; vg.amt.value = .3; vg.sat.value = 1.1; vg.contrast.value = .15;
const sun = new THREE.DirectionalLight('#FFE9C8', 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0003; sun.shadow.normalBias = .02;
scene.add(sun, sun.target); const hemi = new THREE.HemisphereLight('#CFE0FF', '#B89A7A', .7); scene.add(hemi);
const sky = skyDome('#6FA8E8', '#F6D9B0', V(.3, .25, -1), '#FFF0C8'); scene.add(sky);
function light(o) {
  sun.color.set(o.col ?? '#FFE9C8'); sun.intensity = o.int ?? 3; sun.position.set(...o.pos); sun.target.position.set(...(o.tgt ?? [0, 0, 0]));
  const r = o.r ?? 14, c = sun.shadow.camera; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 1; c.far = o.far ?? 120; c.updateProjectionMatrix();
  hemi.color.set(o.hs ?? '#CFE0FF'); hemi.groundColor.set(o.hg ?? '#B89A7A'); hemi.intensity = o.hemi ?? .7;
  if (o.sky) { sky.visible = true; scene.background = null; const u = sky.material.uniforms; u.top.value.set(o.sky[0]); u.hor.value.set(o.sky[1]); u.sd.value.set(...(o.sunDir ?? [.3, .25, -1])).normalize(); u.sc.value.set(o.sky[2] ?? '#FFF0C8'); }
  else { sky.visible = false; scene.background = new THREE.Color(o.bg ?? '#2A1A12'); }
  scene.environmentIntensity = o.env ?? .5; vg.warm.value = o.warm ?? .2; vg.fade.value = o.fade ?? 1;
}
const DAY = { col: '#FFE9C8', int: 3, sky: ['#6FA8E8', '#F6D9B0', '#FFF0C8'], sunDir: [.3, .25, -1], hemi: .75, warm: .22 };
const SALON = { pos: [14, 9, -2], tgt: [0, 0, -2], col: '#FFE6C0', int: 2.2, bg: '#2A1A12', r: 10, warm: .35, hemi: .55, hs: '#FFE8D0', hg: '#7A4A2A' };
const DUSK = { pos: [-30, 12, -80], tgt: [0, 0, 0], col: '#FFB070', int: 2.4, sky: ['#2E3270', '#FF9A5A', '#FFD08A'], sunDir: [-.15, .12, -1], hs: '#9DB0FF', hg: '#8A5A4A', hemi: .9, warm: .35, r: 20, env: .4 };

// ---------------- sets ----------------
const SET = { bv: boulevard(), sa: salon(), ht: hotelStreet() };
for (const s of Object.values(SET)) { s.visible = false; scene.add(s); }
SET.bv.userData.car.visible = false;
const flags = SET.ht.userData.flags;
// the price tag on the tower (boulevard): hangs from a string under the first platform
const TOWER = SET.bv.userData.tower, tag = bigTag('SOLD!', 'SCAM!'); SET.bv.add(tag);
const string = M(cyl(.12, .12, 1, 6), mat('#5A3E2A'), SET.bv); string.castShadow = false;
const ANCH = V(-.5, 18, -138.5), REST = 14.5;
// a bistro chair for Lustig at the café
const stool = G(); stool.position.set(-10.0, .16, 1.28); SET.bv.add(stool); { const cm = mat('#B98A4A', { r: .6 }), im = mat('#1C1C1E', { m: .4, r: .4 });
  M(new THREE.CylinderGeometry(.21, .21, .03, 20), cm, stool, 0, .46, 0); M(new THREE.BoxGeometry(.38, .3, .025), cm, stool, 0, .78, -.2);
  for (const [x, z] of [[-.15, -.15], [.15, -.15], [-.15, .15], [.15, .15]]) M(new THREE.CylinderGeometry(.012, .012, .46, 6), im, stool, x, .23, z); for (const x of [-.16, .16]) M(new THREE.CylinderGeometry(.012, .012, .5, 6), im, stool, x, .66, -.2); }
// the tourer
const car = tourer('#7A1E28'); scene.add(car);
const notes = banknotes(46, 7, 2.2); scene.add(notes);
// salon props: the forged letter, a stamp on the table, an inkwell
const TBL = SET.sa.userData.table, CH = SET.sa.userData.chairs;
const let1 = letter(); let1.rotation.x = -Math.PI / 2; let1.rotation.z = .25; let1.position.set(1.62, .85, .1); TBL.add(let1);
const ink = inkwell(); ink.position.set(1.4, .845, .5); TBL.add(ink);
// the cast
const mk = look => { const p = makeCast(look); scene.add(p.P); return p; };
const lu = mk(CAST.lustig), po = mk(CAST.poisson), dA = mk(CAST.dealerA), dB = mk(CAST.dealerB), dC = mk(CAST.dealerC), gd = mk(CAST.gendarme);
const CASTS = [lu, po, dA, dB, dC, gd];
const luCane = cane(); lu.props.add(luCane);
const luStamp = rubberStamp(); luStamp.rotation.x = Math.PI; luStamp.position.y = -.02; lu.props.add(luStamp);
const luMoney = moneyStack(3); lu.props.add(luMoney);
const luEnv = envelope(); lu.propsL.add(luEnv);
const poMoney = moneyStack(3); po.props.add(poMoney);
const poEnv = envelope('#E9DFC2'); po.propsL.add(poEnv);
const paper = newspaper(); lu.spine.add(paper);
const gdWh = whistle(); gd.props.add(gdWh);
const dLet = [dA, po, dC].map(d => { const l = letter(); l.scale.setScalar(1.25); l.position.set(0, .3, .33); l.rotation.x = -.25; d.spine.add(l); return l; });
const PROPS = [luCane, luStamp, luMoney, luEnv, poMoney, poEnv, paper, gdWh, ...dLet];

// ---------------- key times (from the voice) ----------------
const tYear = w('L1', '1925'), tSold = w('L1', 'sold'), tTower = w('L1', 'tower'), tScrap = w('L1', 'for');
const C2 = cut('L2'), tLus = w('L2', 'lustig'), tExp = w('L2', 'expensive');
const C3 = cut('L3'), tOff = w('L3', 'official'), tHe = w('L3', 'he'), tInv = w('L3', 'invited'), tSec3 = w('L3', 'secret'), tLux = w('L3', 'luxury');
const C4 = cut('L4'), tCity = w('L4', 'city'), tSo = w('L4', 'so'), tSec4 = w('L4', 'secret');
const C5 = cut('L5'), tAndre = w('L5', 'andr'), tWant = w('L5', 'wanted'), tPaid = w('L5', 'paid'), tAnd5 = w('L5', 'and', 1), tBribe = w('L5', 'bribe');
const C6 = cut('L6'), tFled = w('L6', 'fled'), tMoney = w('L6', 'money'), tAnd6 = w('L6', 'and'), tEmb = w('L6', 'embarrassed'), tPol6 = w('L6', 'police');
const C7 = cut('L7'), tBack = w('L7', 'back'), tAnd7 = w('L7', 'and'), tAgain = w('L7', 'again');
const C8 = cut('L8'), tDeal8 = w('L8', 'dealer'), tPol8 = w('L8', 'police'), tAnd8 = w('L8', 'and'), tRun = w('L8', 'run');
const C9 = cut('L9'), tSec9 = w('L9', 'secret'), tUrg = w('L9', 'urgent'), tToo = w('L9', 'too'), tMiss = w('L9', 'miss'), tScam = w('L9', 'scam');
const snapB = t => Math.round(t / B) * B;
const S2b = Math.max(C2 + 2 * B, snapB(tExp - .4)), S3b = Math.max(C3 + 3 * B, snapB(tHe - .15)), S3c = Math.max(S3b + 2 * B, snapB(tSec3 - .1));
const S4b = Math.max(C4 + 4 * B, snapB(tSo - .1)), S5b = Math.max(C5 + 3 * B, snapB(tWant - .1)), S5c = Math.max(S5b + 2 * B, snapB(tAnd5 - .1));
const S6b = Math.max(C6 + 2 * B, snapB(tAnd6 - .1)), S7b = Math.max(C7 + 2 * B, snapB(tAnd7 - .1)), S8b = Math.max(C8 + 3 * B, snapB(tAnd8 - .1));

// ---------------- helpers for acting ----------------
const put = (p, x, y, z, ry = 0) => { p.P.visible = true; p.P.position.set(x, y, z); p.P.rotation.y = ry; p.P.updateMatrixWorld(true); };
const show = (...ps) => PROPS.forEach(o => o.visible = ps.includes(o));
function reset() { CASTS.forEach(p => { p.P.visible = false; p.hat.visible = true; p.hat.position.y = p.hat.userData.y0 ??= p.hat.position.y; p.hat.rotation.set(-.07, 0, 0); }); show(); car.visible = false; notes.visible = false; stool.visible = false; tag.visible = false; string.visible = false; }
const lookAtP = (p, dy = 1.65) => V(p.P.position.x, p.P.position.y + dy, p.P.position.z);
// walk along keys [{t, x, z}], facing the direction of travel; returns the pose for the walk
function walker(p, keys, t, base = POSES.stand, y = 0, speedOver) {
  let i = 1; while (i < keys.length - 1 && t > keys[i].t) i++;
  const a = keys[i - 1], b = keys[i], u = seg(t, a.t, b.t), x = lerp(a.x, b.x, u), z = lerp(a.z, b.z, u);
  let dist = 0; for (let k = 1; k < keys.length; k++) { const s = keys[k - 1], e = keys[k], L = Math.hypot(e.x - s.x, e.z - s.z); dist += L * seg(t, s.t, e.t); }
  const sp = Math.hypot(b.x - a.x, b.z - a.z) / Math.max(.01, b.t - a.t), moving = t > a.t && t < b.t && sp > .05;
  p.P.visible = true; p.P.position.set(x, y, z); if (sp > .05) p.P.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); p.P.updateMatrixWorld(true);
  return moving ? walkPose(base, dist, speedOver ?? sp) : base;
}
const swayTo = (t, a, d = .35) => eio(seg(t, a, a + d));
const CAMP = new THREE.Vector3();

// ---------------- the shots ----------------
const SHOTS = [
  // 1 · the hook: Lustig on the boulevard; the tower gets a SOLD tag; he turns and tips his hat
  { t0: 0, t1: C2, set: 'bv', lt: { ...DAY, pos: [-30, 40, 30], tgt: [0, 0, 4], r: 12 }, act: t => act1(t),
    cam: (t, u) => camAt(V(lerp(.75, .35, eio(u)), lerp(1.05, 1.3, u), lerp(10.8, 8.6, eio(u))), V(lerp(-.1, 0, u), lerp(9.5, 8.2, u), -40), 44, lerp(5.2, 3.1, eio(u)), 4) },
  // 2a · the newspaper: the headline, Lustig's eyes peeking over the top
  { t0: C2, t1: S2b, set: 'bv', lt: { ...DAY, pos: [-30, 40, 30], tgt: [-12, 0, 2], r: 8 }, act: t => act2(t),
    cam: (t, u) => camAt(V(-10.0 + .04 * u, 1.12, lerp(2.95, 2.8, eio(u))), V(-10.0, .98, 1.3), 40, lerp(1.15, 1.0, u), 3) },
  // 2b · the paper comes down: the smug face, the café and the tower behind
  { t0: S2b, t1: C3, set: 'bv', lt: { ...DAY, pos: [-30, 40, 30], tgt: [-12, 0, 2], r: 8 }, act: t => act2(t),
    cam: (t, u) => camAt(V(lerp(-9.85, -10.3, eio(u)), lerp(1.2, 1.4, u), lerp(2.9, 4.05, eio(u))), V(-10.0, 1.12, 1.3), 40, lerp(1.6, 2.8, u), 4) },
  // 3a · the forged letter: official stationery, the stamp slams down on "official"
  { t0: C3, t1: S3b, set: 'sa', lt: SALON, act: t => act3a(t),
    cam: (t, u) => camAt(V(lerp(.8, .95, u), lerp(1.55, 1.5, u), lerp(-.5, -.65, u)), V(1.95, 1.15, -1.5), 46, 1.5, 4) },
  // 3b · three dealers read their invitations on the boulevard
  { t0: S3b, t1: S3c, set: 'bv', lt: { ...DAY, pos: [-30, 40, 30], tgt: [10, 0, -4], r: 8 }, act: t => act3b(t),
    cam: (t, u) => camAt(V(lerp(8.4, 8.7, u), 1.62, lerp(.4, -.2, eio(u))), V(11.1, 1.42, -3.7), 40, lerp(4.0, 3.4, u), 4) },
  // 3c · the Hôtel de Crillon: the dealers walk up to the door
  { t0: S3c, t1: C4, set: 'ht', lt: { ...DAY, pos: [-25, 35, 28], tgt: [0, 0, -4], r: 14 }, act: t => act3c(t),
    cam: (t, u) => camAt(V(lerp(1.2, .6, u), lerp(1.0, 1.5, u), lerp(7.5, 6.5, u)), V(0, lerp(5.6, 5.0, u), -9.5), 50, 9, 2) },
  // 4a · the secret meeting: Lustig presents the tower to the dealers
  { t0: C4, t1: S4b, set: 'sa', lt: SALON, act: t => act4(t),
    cam: (t, u) => camAt(V(lerp(-2.5, -2.1, eio(u)), lerp(2.95, 2.75, u), lerp(1.45, 1.2, eio(u))), V(1.3, 1.0, -1.6), 50, 4.6, 3) },
  // 4b · "so it had to stay secret": shh, and a wink
  { t0: S4b, t1: C5, set: 'sa', lt: SALON, act: t => act4(t),
    cam: (t, u) => camAt(V(lerp(1.2, 1.3, u), 1.62, lerp(-1.25, -1.35, u)), V(2.3, 1.56, -1.5), 34, 1.15, 5) },
  // 5a · André Poisson: greedy, rubbing his hands
  { t0: C5, t1: S5b, set: 'sa', lt: SALON, act: t => act5(t),
    cam: (t, u) => camAt(V(lerp(.72, .8, u), lerp(1.17, 1.12, u), lerp(-1.55, -1.35, eio(u))), V(1.0, .97, -.35), 36, lerp(1.2, 1.0, u), 5) },
  // 5b · he pays: the money changes hands by the window
  { t0: S5b, t1: S5c, set: 'sa', lt: SALON, act: t => act5(t),
    cam: (t, u) => camAt(V(lerp(1.5, 1.9, eio(u)), 1.45, -2.0), V(4.6, 1.3, -2.0), 40, lerp(3.1, 2.7, u), 4) },
  // 5c · the bribe, slipped under the table edge; Lustig winks
  { t0: S5c, t1: C6, set: 'sa', lt: SALON, act: t => act5(t),
    cam: (t, u) => camAt(V(lerp(2.5, 2.65, u), 1.38, -2.0), V(4.6, 1.22, -2.0), 46, 2.0, 4) },
  // 6a · the getaway: the tourer speeds down the boulevard, banknotes flying
  { t0: C6, t1: S6b, set: 'bv', after: 1, lt: { ...DAY, pos: [-30, 40, 30], tgt: [0, 0, -4], r: 16 }, act: t => act6a(t),
    cam: (t, u) => { const c = car.position; return camAt(V(2.5, 1.75, lerp(7, 5.6, u)), V(c.x * .7, 1.15, Math.min(c.z, 3) - 2), 44, Math.max(2, 6 - c.z), 3); } },
  // 6b · Poisson at the police station, too embarrassed to go in
  { t0: S6b, t1: C7, set: 'ht', lt: { ...DAY, pos: [-25, 35, 28], tgt: [0, 0, 14], r: 10 }, act: t => act6b(t),
    cam: (t, u) => camAt(V(lerp(1.6, 1.3, u), 1.4, lerp(9.8, 10.6, u)), V(-.2, 2.0, 15.5), 42, lerp(5.3, 4.5, u), 4) },
  // 7a · he came back: the car rewinds into the frame in front of the hotel
  { t0: C7, t1: S7b, set: 'ht', lt: { ...DAY, pos: [-25, 35, 28], tgt: [0, 0, -3], r: 12 }, act: t => act7a(t),
    cam: (t, u) => camAt(V(lerp(-4.3, -3.9, u), 1.7, lerp(-.5, -.9, u)), V(-1.3, 1.3, -4.5), 44, 4.6, 4) },
  // 7b · and sold it again: the same pitch to new dealers
  { t0: S7b, t1: C8, set: 'sa', lt: SALON, act: t => act7b(t),
    cam: (t, u) => camAt(V(lerp(-2.5, -2.2, eio(u)), lerp(2.95, 2.8, u), lerp(-4.45, -4.2, eio(u))), V(1.3, 1.0, -1.4), 50, 4.6, 3) },
  // 8a · a dealer runs to the gendarme and points at the hotel
  { t0: C8, t1: S8b, set: 'ht', lt: { ...DAY, pos: [-25, 35, 28], tgt: [0, 0, 10], r: 12 }, act: t => act8a(t),
    cam: (t, u) => camAt(V(lerp(2.6, 2.3, u), 1.6, lerp(17.4, 17.0, u)), V(-.2, 1.35, 13.6), 42, lerp(4.3, 3.6, u), 4) },
  // 8b · Lustig runs for it, the gendarme behind him
  { t0: S8b, t1: C9, set: 'bv', after: 1, lt: { ...DAY, pos: [-30, 40, 30], tgt: [0, 0, 0], r: 14 }, act: t => act8b(t),
    cam: (t, u) => { const z = lu.P.position.z; return camAt(V(.9, 1.35, z + 4.2), V(-.2, 1.4, z - 2), 42, 4.2, 4); } },
  // 9 · the lesson, at sunset under the tower; the tag flips to SCAM!
  { t0: C9, t1: LOOP, set: 'bv', lt: DUSK, act: t => act9(t),
    cam: (t, u) => camAt(V(lerp(.6, .3, eio(u)), lerp(1.95, 1.7, eio(u)), lerp(9.6, 12.5, eio(u))), V(.3, lerp(10, 14, eio(u)), -60), 44, 30, 1) },
  { t0: LOOP, t1: DUR + 1, set: 'bv', loop: true },
];
SHOTS[SHOTS.length - 1] = { ...SHOTS[0], t0: LOOP, t1: DUR + 1, act: () => act1(0), cam: () => SHOTS[0].cam(0, 0) };

// ---------------- acting ----------------
function tagAt(t, dropT, flipT = 1e9) {
  tag.visible = t >= dropT - .4; if (!tag.visible) return;
  const u = seg(t, dropT - .4, dropT), y = u < 1 ? lerp(60, REST, ei(u)) : REST + Math.abs(Math.sin((t - dropT) * 9)) * 2.2 * Math.exp(-(t - dropT) * 4);
  tag.position.set(ANCH.x, y, ANCH.z); tag.rotation.set(0, 0, -.32 + .22 * Math.sin((t - dropT) * 3.2) * Math.exp(-Math.max(0, t - dropT) * .9));
  string.visible = t >= dropT; const len = ANCH.y - y; string.scale.set(1, Math.max(.01, len), 1); string.position.set(ANCH.x, y + len / 2, ANCH.z);
  tag.userData.flip.rotation.y = Math.PI * eio(seg(t, flipT, flipT + .45));
}
function act1(t) {
  reset(); show(luCane); tagAt(t, tSold - .05);
  put(lu, -.12, 0, 5.6, lerp(Math.PI, .2, swayTo(t, tTower - .3, .55)));
  const q = t < tTower - .1 ? POSES.cane : POSES.tipHat;
  apply(lu, q, { t, seed: 1, face: t < tTower ? 'calm' : 'smug', wink: t > tScrap && t < tScrap + .35 ? 1 : 0, look: t < tTower - .2 ? V(0, 12, -100) : CAMP });
  if (t >= tTower - .1) { lu.hat.position.y = lu.hat.userData.y0 + .06 * Math.sin(seg(t, tTower, tTower + .5) * Math.PI); }
}
function act2(t) {
  reset(); show(paper);
  // Lustig at a café table, reading; the paper comes down on "expensive"
  put(lu, -10.0, .115, 1.3, 0); stool.visible = true;
  const down = swayTo(t, tExp - .1, .6);
  apply(lu, mixPose(POSES.sitRead, POSES.sitLower, down), { t, seed: 2, face: down > .5 ? 'greedy' : 'calm', lx: down > .5 ? 0 : Math.sin(t * 5) * .8, look: down > .5 ? camera.position : undefined });
  paper.position.set(0, lerp(.19, -.02, down), lerp(.4, .44, down)); paper.rotation.set(lerp(-.08, -.5, down), 0, 0);
}
function act3a(t) {
  reset(); show(luStamp); CH[5].visible = false;
  put(lu, 2.25, 0, -1.5, -Math.PI / 2);
  // stamp up, then slam on "official"
  const slam = tOff - .05, up = t < slam - .12 ? swayTo(t, C3, .5) : 1 - ei(seg(t, slam - .12, slam));
  apply(lu, mixPose(POSES.stampDown, POSES.stampUp, up), { t, seed: 3, face: t > slam ? 'smug' : 'calm', look: V(1.62, .85, -1.4) });
  let1.userData.redraw(t >= slam ? 1 : 0);
}
function act3b(t) {
  reset(); show(...dLet);
  [[dA, 11.1, -2.4], [po, 11.0, -3.7], [dC, 11.2, -5.0]].forEach(([d, x, z], i) => {
    put(d, x, .16, z, -Math.PI / 2 + (i - 1) * .15);
    const k = seg(t, S3b + i * .25, S3b + i * .25 + .4);
    apply(d, POSES.read, { t, seed: 4 + i, face: k > .5 ? (i === 1 ? 'greedy' : 'shock') : 'calm', look: k > .5 ? camera.position : undefined, lx: k > .5 ? 0 : Math.sin(t * 6 + i) * .7 });
  });
}
function act3c(t) {
  reset();
  [[dA, -1.0, 0], [po, .1, .35], [dC, 1.1, .1]].forEach(([d, x, dz], i) => {
    const q = walker(d, [{ t: S3c - 1, x, z: 3.2 + dz + i * .4 }, { t: C4 + .5, x: x * .55, z: -5.6 + dz }], t, POSES.stand, 0);
    apply(d, q, { t, seed: 7 + i, face: 'calm' });
  });
  flags.forEach(f => f.userData.wave(t));
}
function meeting(t, list, talk = .6) {
  CH[5].visible = false;
  list.forEach(([d, ci], i) => { const c = CH[ci], wp = new THREE.Vector3(); c.getWorldPosition(wp); put(d, wp.x, -.04, wp.z + (c.rotation.y === 0 ? .06 : -.06), c.rotation.y === 0 ? 0 : Math.PI);
    apply(d, i === 0 ? POSES.sitLean : POSES.sit, { t, seed: 10 + i, face: i === 0 ? 'greedy' : ['calm', 'worried', 'calm'][i % 3], look: lookAtP(lu, 1.7) }); });
}
function act4(t) {
  reset();
  put(lu, 2.35, 0, -1.5, -Math.PI / 2);
  meeting(t, [[po, 2], [dA, 0], [dB, 4], [dC, 1]]);
  const shh = t >= S4b;
  apply(lu, shh ? POSES.shh : t < tCity ? POSES.present : mixPose(POSES.present, POSES.point, .6), { t, seed: 1, talk: shh ? 0 : .7, face: shh ? 'smug' : 'talk', wink: shh && t > tSec4 - .1 && t < tSec4 + .5 ? 1 : 0, look: shh ? camera.position : V(0, 1.3, -1.5 + Math.sin(t * 1.3) * 1.2) });
}
function act5(t) {
  reset();
  if (t < S5b) {
    put(lu, 2.35, 0, -1.5, -Math.PI / 2); apply(lu, POSES.present, { t, seed: 1, talk: .3, look: lookAtP(po, 1.3) });
    meeting(t, [[po, 2], [dA, 0], [dB, 4], [dC, 1]]);
    apply(po, POSES.sitLean, { t, seed: 11, face: 'greedy', look: CAMP });
    // the rubbing hands
    po.aL.el.rotation.x += Math.sin(t * 14) * .12; po.aR.el.rotation.x -= Math.sin(t * 14) * .12;
    return;
  }
  // by the window: Poisson pays, then slips the bribe
  put(lu, 4.6, 0, -2.45, 0); put(po, 4.6, 0, -1.55, Math.PI);
  const give = swayTo(t, tPaid - .5, .45), taken = t >= tPaid + .15;
  show(...(taken ? [luMoney] : [poMoney]), ...(t >= S5c ? (t < tBribe + .1 ? [poEnv] : [luEnv]) : []));
  if (t < S5c) {
    apply(po, give > 0 ? POSES.offer : POSES.hold, { t, seed: 12, face: 'greedy', look: lookAtP(lu, 1.65) });
    apply(lu, t > tPaid - .3 ? POSES.take : POSES.stand, { t, seed: 13, face: 'smug', look: lookAtP(po, 1.5) });
  } else {
    const sneak = swayTo(t, S5c, .4);
    apply(po, mixPose(POSES.stand, POSES.sneak, sneak * .7), { t, seed: 12, face: 'worried', look: t < tBribe - .4 ? V(3, 1.6, 2) : lookAtP(lu, 1.6) });
    po.aL.sh.rotation.set(-.9, .3, -.1); po.aL.el.rotation.x = -.6;
    apply(lu, POSES.take, { t, seed: 13, face: 'smug', wink: t > tBribe && t < tBribe + .45 ? 1 : 0, look: CAMP });
    lu.aL.sh.rotation.set(-.6, -.2, .1); lu.aL.el.rotation.x = -.7;
  }
}
const CARZ0 = -24, CARZ1 = 9;
function act6a(t) {
  reset(); car.visible = true; notes.visible = true;
  const u = seg(t, C6, S6b + .2), z = lerp(CARZ0, CARZ1, Math.pow(u, 1.15));
  car.position.set(-1.5, 0, z); car.rotation.set(0, 0, Math.sin(t * 30) * .006); car.userData.wheels.forEach(wh => wh.rotation.x = z / .45);
  const s = car.userData.seat; put(lu, car.position.x + s.x, s.y - .52, z + s.z, 0);
  apply(lu, t > tMoney - .2 ? POSES.driveWave : POSES.drive, { t, seed: 1, face: 'happy' });
  lu.hat.visible = true;
  notes.userData.update(Math.max(0, t - C6 - .2), d => V(-1.5, 1.4, lerp(CARZ0, CARZ1, Math.pow(seg(C6 + .2 + d, C6, S6b + .2), 1.15)) - 1.2), V(0, 0, 0));
}
function act6b(t) {
  reset(); show(poEnv);
  // Poisson walks to the door of the police station, stops, blushes, turns away and hides his face
  const stop = tEmb - .25, turn = tEmb + .35;
  if (t < stop) { const q = walker(po, [{ t: S6b - .3, x: -.4, z: 10.6 }, { t: stop, x: -.2, z: 14.2 }], t); apply(po, q, { t, seed: 20, face: 'worried' }); }
  else { put(po, -.2, .16, 14.2, lerp(0, Math.PI - .5, swayTo(t, turn, .45))); apply(po, t < turn ? POSES.stand : POSES.hideFace, { t, seed: 20, face: 'embarrassed', blush: clamp((t - stop) * 2), look: t < turn ? V(0, 2.5, 19) : undefined }); }
}
function act7a(t) {
  reset(); car.visible = true; flags.forEach(f => f.userData.wave(t));
  // "rewind": the car reverses fast into its spot by the door
  const u = eo(seg(t, C7, tBack + .05)), z = lerp(-4.3, -4.3, u), x = lerp(-14, -1.2, u);
  car.position.set(x, 0, z); car.rotation.set(0, -Math.PI / 2, 0); car.userData.wheels.forEach(wh => wh.rotation.x = -x / .45);
  car.updateMatrixWorld(true); const s = car.userData.seat, sp = car.localToWorld(V(s.x, s.y, s.z));
  const up = t > tBack - .15;
  if (!up) { put(lu, sp.x, sp.y - .52, sp.z, -Math.PI / 2); apply(lu, POSES.drive, { t, seed: 1, face: 'smug' }); }
  else { put(lu, sp.x, sp.y - .38, sp.z, lerp(-Math.PI / 2, -.64, swayTo(t, tBack - .15, .3))); apply(lu, POSES.hatUp, { t, seed: 1, face: 'happy', look: CAMP }); lu.hat.position.y = lu.hat.userData.y0 + .08; }
}
function act7b(t) {
  reset();
  put(lu, 2.35, 0, -1.5, -Math.PI / 2);
  meeting(t, [[dB, 4], [dA, 3], [dC, 0]]);
  apply(lu, POSES.present, { t, seed: 2, talk: .7, face: 'talk', look: V(0, 1.3, -1.5 + Math.sin(t * 1.3) * 1.2) });
}
function act8a(t) {
  reset(); show(gdWh); flags.forEach(f => f.userData.wave(t));
  put(gd, .3, .16, 14.9, Math.PI);
  const q = walker(dC, [{ t: C8 - .2, x: -1.4, z: 4.5 }, { t: tPol8 - .25, x: -.7, z: 12.6 }], t, POSES.stand, 0);
  if (t < tPol8 - .25) apply(dC, q, { t, seed: 30, face: 'worried' });
  else { dC.P.rotation.y = .3; apply(dC, POSES.pointBack, { t, seed: 30, face: 'shock', look: lookAtP(gd) }); }
  const wh = t > tPol8 + .15;
  apply(gd, wh ? POSES.whistle : POSES.stand, { t, seed: 31, face: wh ? 'angry' : 'calm', look: wh ? V(0, 2, -9) : lookAtP(dC) });
  gdWh.visible = wh;
}
function act8b(t) {
  reset(); show(luCane, gdWh);
  const z = lerp(-6, 6.5, seg(t, S8b, C9 + .3));
  put(lu, -.3, 0, z, 0); apply(lu, walkPose(POSES.runHat, (z + 6) * 1.0, 3.2), { t, seed: 1, face: 'shock' });
  put(gd, .5, 0, z - 3.6, 0); apply(gd, walkPose(POSES.whistle, (z + 6) * 1.0, 3.2), { t, seed: 31, face: 'angry' });
  gdWh.visible = true;
}
function act9(t) {
  reset(); tagAt(t, -10, tScam - .1);
  put(lu, 1.3, 0, 5.2, Math.PI + .3); apply(lu, t < tScam ? POSES.cane : POSES.tipHat, { t, seed: 1, face: 'smug', look: V(0, 20, -140) });
  show(luCane);
}

// ---------------- sound events (the score reads these) ----------------
ev(0, 'open'); ev(tYear, 'sting'); ev(tSold - .05, 'tag'); ev(tTower - .1, 'tip'); ev(tScrap, 'stamp');
ev(C2, 'cut'); ev(C2 + .1, 'paper'); ev(tLus, 'pop'); ev(tExp - .1, 'paper'); ev(tExp + .3, 'ding');
ev(C3, 'cut'); ev(tOff - .05, 'stamp'); ev(S3b, 'cut'); ev(S3b + .1, 'paper'); ev(S3b + .35, 'paper'); ev(S3b + .6, 'paper'); ev(S3c, 'cut'); ev(tLux, 'pop');
ev(C4, 'cut'); ev(tCity, 'pop'); ev(S4b, 'cut'); ev(tSec4 - .1, 'shh'); ev(tSec4, 'stamp');
ev(C5, 'cut'); ev(tAndre, 'pop'); ev(S5b, 'cut'); ev(tPaid - .1, 'cash'); ev(S5c, 'cut'); ev(tBribe, 'sting');
ev(C6, 'car'); ev(tMoney - .2, 'honk'); ev(S6b, 'cut'); ev(tEmb, 'sad');
ev(C7, 'rewind'); ev(tBack - .15, 'tip'); ev(S7b, 'cut'); ev(tAgain, 'stamp');
ev(C8, 'cut'); ev(tPol8 + .15, 'whistle'); ev(S8b, 'cut'); for (let k = 0, tt = S8b; tt < C9; k++, tt += B / 2) ev(tt, 'step'); ev(tRun, 'whistle');
ev(C9, 'sweep'); ev(tSec9, 'stamp'); ev(tUrg, 'stamp'); ev(tToo, 'stamp'); ev(tScam - .1, 'flip'); ev(tScam, 'scam');

// ---------------- the 2D overlay: telops + word-by-word captions ----------------
const ov = document.getElementById('ov').getContext('2d');
const TEL = [
  { t0: tYear, t1: C2, text: '1925', y: 300, size: 150, col: '#FFD23F', rot: -4 },
  { t0: tScrap, t1: C2, text: 'FOR SCRAP!', y: 520, size: 130, col: '#FF5A6E', rot: -6 },
  { t0: tLus - .05, t1: C3, text: 'VICTOR LUSTIG', y: 1290, size: 84, col: '#FFFFFF', rot: -3, plate: '#1F2A44', sub: 'CON MAN' },
  { t0: w('L3', 'posing') - .05, t1: S3b, text: 'FAKE OFFICIAL', y: 330, size: 104, col: '#FFFFFF', rot: -4, plate: '#B3242F' },
  { t0: tInv, t1: C4, text: 'SECRET MEETING', y: 330, size: 88, col: '#FFD23F', rot: 3 },
  { t0: tSec4, t1: C5, text: 'TOP SECRET', y: 380, size: 130, col: '#FF5A6E', rot: -6, stamp: 1 },
  { t0: tAndre - .05, t1: S5c, text: 'ANDRÉ POISSON', y: 1290, size: 84, col: '#FFFFFF', rot: 3, plate: '#7A5A3A', sub: 'SCRAP DEALER' },
  { t0: tPaid, t1: C6, text: 'PAID!', y: 330, size: 150, col: '#7BE07B', rot: -5 },
  { t0: w('L5', 'slipped'), t1: C6 + .25, text: '+ A BRIBE', y: 500, size: 100, col: '#FFD23F', rot: 4 },
  { t0: w('L6', 'poisson') - .05, t1: C7, text: 'TOO EMBARRASSED', y: 600, size: 92, col: '#FFFFFF', rot: -3, plate: '#C2557A' },
  { t0: C7 + .05, t1: tBack + .1, text: '◀◀', y: 320, size: 150, col: '#FFFFFF', rot: 0 },
  { t0: tAgain, t1: C8, text: 'AGAIN?!', y: 340, size: 160, col: '#FFD23F', rot: -6 },
  { t0: tPol8 - .05, t1: S8b, text: 'POLICE!', y: 330, size: 140, col: '#FFFFFF', rot: 4, plate: '#22305A' },
  { t0: tRun, t1: C9, text: 'RUN!', y: 360, size: 180, col: '#FF5A6E', rot: -7 },
  { t0: tSec9 - .05, t1: LOOP, text: 'SECRET', y: 250, size: 100, col: '#FFFFFF', rot: -4, plate: '#B3242F' },
  { t0: tUrg - .05, t1: LOOP, text: 'URGENT', y: 400, size: 100, col: '#FFFFFF', rot: 3, plate: '#E07A1F' },
  { t0: tToo - .05, t1: LOOP, text: 'TOO GOOD TO MISS', y: 550, size: 84, col: '#FFFFFF', rot: -3, plate: '#2E6B4E' },
  { t0: tScam - .05, t1: LOOP, text: '= SCAM!', y: 740, size: 170, col: '#FFD23F', rot: -6 },
];
function drawTelop(x, t) {
  const p = seg(t, x.t0, x.t0 + .28), sc = x.stamp ? lerp(2.2, 1, eo(p)) : back(p, 2.6), wob = 1 + .02 * Math.sin((t - x.t0) * 8);
  ov.save(); ov.translate(540, x.y); ov.rotate(x.rot * Math.PI / 180); ov.scale(sc * wob, sc * wob); if (x.stamp) ov.globalAlpha = clamp(p * 3);
  ov.font = `700 ${x.size}px Fredoka`; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  if (x.plate) { const tw = ov.measureText(x.text).width + 70, th = x.size * 1.45; ov.fillStyle = 'rgba(20,10,10,.9)'; ov.beginPath(); ov.roundRect(-tw / 2 + 10, -th / 2 + 12, tw, th, 30); ov.fill(); ov.fillStyle = x.plate; ov.beginPath(); ov.roundRect(-tw / 2, -th / 2, tw, th, 30); ov.fill(); }
  if (x.stamp) { const tw = ov.measureText(x.text).width + 60, th = x.size * 1.3; ov.strokeStyle = x.col; ov.lineWidth = 12; ov.beginPath(); ov.roundRect(-tw / 2, -th / 2, tw, th, 18); ov.stroke(); }
  ov.lineWidth = x.size * .17; ov.strokeStyle = '#1B1213'; ov.strokeText(x.text, 0, 4); ov.fillStyle = x.col; ov.fillText(x.text, 0, 4);
  if (x.sub) { ov.font = '700 44px Fredoka'; const tw = ov.measureText(x.sub).width + 40; ov.fillStyle = '#FFD23F'; ov.beginPath(); ov.roundRect(-tw / 2, x.size * .72 + 6, tw, 64, 18); ov.fill(); ov.fillStyle = '#1B1213'; ov.fillText(x.sub, 0, x.size * .72 + 40); }
  ov.restore();
}
const CAPY = 1480, CAPS = 78;
const chunks = [];
TM.lines.forEach((l, li) => { let cur = []; const flush = () => { if (cur.length) chunks.push({ li, words: cur }); cur = []; };
  l.words.forEach(x => { const d = x.w.replace(/[,.…]+$/, '').toUpperCase(); const len = cur.reduce((a, y) => a + y.d.length + 1, 0) + d.length; if (cur.length && len > 16) flush(); cur.push({ d, t0: x.t0, t1: x.t1 }); if (/[,.…]$/.test(x.w)) flush(); }); flush(); });
chunks.forEach((c, i) => { const n = chunks[i + 1]; c.a = c.words[0].t0 - .05; c.b = n ? Math.min(n.words[0].t0 - .05, n.li === c.li ? 1e9 : TM.lines[c.li].t1 + .45) : TM.lines[c.li].t1 + .45; });
function drawCaptions(t) {
  const c = chunks.find(c => t >= c.a && t < c.b); if (!c) return;
  ov.save(); ov.font = `700 ${CAPS}px Fredoka`; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  const sp = 22, ws = c.words.map(x => ov.measureText(x.d).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  let x = 540 - tot / 2; const pin = back(seg(t, c.a, c.a + .14), 2);
  c.words.forEach((wd, j) => {
    const said = t >= wd.t0 - .04, now = said && t < wd.t1 + .02; if (!said) { x += ws[j] + sp; return; }
    const s = (now ? 1 + .14 * Math.exp(-(t - wd.t0) * 10) : 1) * pin, cx = x + ws[j] / 2;
    ov.save(); ov.translate(cx, CAPY); ov.scale(s, s); ov.textAlign = 'center';
    ov.shadowColor = 'rgba(0,0,0,.5)'; ov.shadowBlur = 18; ov.shadowOffsetY = 6; ov.lineWidth = 15; ov.strokeStyle = '#111'; ov.strokeText(wd.d, 0, 0);
    ov.shadowColor = 'transparent'; ov.fillStyle = now ? '#FFD23F' : '#FFFFFF'; ov.fillText(wd.d, 0, 0); ov.restore();
    x += ws[j] + sp;
  });
  ov.restore();
}
// the "rewind" look for 7a: scanlines and a cool tint while the car reverses
function rewindFX(t) {
  const k = t >= C7 && t < tBack + .1 ? 1 - seg(t, tBack - .1, tBack + .1) : 0; if (k <= 0) return;
  ov.save(); ov.globalAlpha = .18 * k; ov.fillStyle = '#9FD0FF'; ov.fillRect(0, 0, W, H); ov.globalAlpha = .22 * k; ov.fillStyle = '#000';
  for (let y = (t * 900) % 24; y < H; y += 24) ov.fillRect(0, y, W, 6);
  ov.globalAlpha = .5 * k; ov.fillStyle = '#FFF'; const yy = (t * 1400) % H; ov.fillRect(0, yy, W, 14); ov.restore();
}

// ---------------- render ----------------
function render(t) {
  const sh = SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
  for (const [k, s] of Object.entries(SET)) s.visible = k === sh.set;
  light({ ...sh.lt }); const tt = sh.loop ? 0 : t, u = sh.loop ? 0 : seg(t, sh.t0, sh.t1);
  let c = sh.after ? null : sh.cam(tt, u); if (c) CAMP.copy(c.pos);
  sh.act(tt);
  if (!c) { c = sh.cam(tt, u); CAMP.copy(c.pos); }
  camera.position.copy(c.pos); camera.lookAt(c.look); camera.fov = c.fov; camera.updateProjectionMatrix();
  post.dof.focus = c.focus; post.dof.aper = c.aper; post.dof.maxCoc = 8;
  // the fire and the chandelier flicker a little in the salon
  if (sh.set === 'sa') { const f = SET.sa.userData.fire; f.scale.set(1 + .1 * Math.sin(t * 13), 1 + .15 * Math.sin(t * 9.3), 1); SET.sa.userData.fireLight.intensity = 3 + .6 * Math.sin(t * 11); }
  const cuts = SHOTS.map(s => s.t0).filter(x => x > 0); let fl = 0; for (const x of cuts) if (t >= x && t < x + .08) fl = Math.max(fl, .3 * (1 - (t - x) / .08));
  scene.updateMatrixWorld(true);
  post.composer.render();
  ov.clearRect(0, 0, W, H);
  if (fl > 0) { ov.fillStyle = `rgba(255,255,255,${fl})`; ov.fillRect(0, 0, W, H); }
  rewindFX(t);
  if (t < LOOP) { TEL.forEach(x => { if (t >= x.t0 && t < x.t1) drawTelop(x, t); }); drawCaptions(t); }
}
function texts(t) {
  if (t >= LOOP) return [];
  return TEL.filter(x => t >= x.t0 + .3 && t < x.t1).map(x => ({ id: x.text, text: x.text, x0: 60, y0: x.y - x.size * .7, x1: 1020, y1: x.y + x.size * .7, ...(x.text.endsWith('!') ? { pass: true } : {}) }));
}
EV.sort((a, b) => a.t - b.t);
const QS = new URLSearchParams(location.search), A0 = +(QS.get('a') ?? 0), B0 = +(QS.get('b') ?? DUR);
window.DUR = +(B0 - A0).toFixed(3); window.EV = EV; window.render = t => render(t + A0); window.TEXTS = t => texts(t + A0);
window.SHOTS = SHOTS.map(s => s.t0);
render(A0);
window.READY = true;
