// "The Pudding Guy" · 3D vertical Short (1080×1920).
// Every shot, action, telop and caption is placed from timing.json (the voice). render(t) is a pure function of t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makePost } from '/core/three/post.js';
import { G, M, mat, textPlane } from './kit.js';
import { makeCast, POSES, apply, mixPose, walkPose } from './person2.js';
import { LOOKS } from './looks.js';
import { suburb, store, hall, cabin, cart, loadCart, balance, jet, cups, cup, setInst, calculator, taxForm, goldCard, spoon, wallClock } from './sets5.js';
import { skyDome } from './sky.js';

const W = 1080, H = 1920;
await document.fonts.load('700 80px Fredoka'); await document.fonts.load('600 40px Fredoka');
const TM = await (await fetch('timing.json')).json();
const B = 60 / TM.bpm, DUR = TM.dur, LOOP = DUR - B;
const LN = Object.fromEntries(TM.lines.map(l => [l.id, l]));
const nrm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const w = (lid, word, k = 0) => { const ws = LN[lid].words.filter(x => nrm(x.w).startsWith(nrm(word))); return (ws[k] || ws[ws.length - 1] || { t0: LN[lid].t0 }).t0; };
const cut = id => LN[id].cut;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), lerp = (a, b, u) => a + (b - a) * u;
const eo = u => 1 - Math.pow(1 - u, 3), ei = u => u * u * u, eio = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
const back = (u, s = 1.7) => { u = clamp(u) - 1; return 1 + u * u * ((s + 1) * u + s); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const camAt = (pos, look, fov = 40, focus, aper = 5) => ({ pos, look, fov, focus: focus ?? pos.distanceTo(look), aper });
const EV = []; const ev = (t, s, o = {}) => EV.push({ t: +t.toFixed(3), s, ...o });
const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

// ---------------- renderer / post ----------------
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .5;
const camera = new THREE.PerspectiveCamera(40, W / H, .05, 1500);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, ao: true, aoRadius: .5, aoThickness: 1, aoScale: 1.6, aoAmt: .7 });
post.bloom.strength = .25; post.bloom.threshold = .96; post.bloom.radius = .5;
const vg = post.vig.uniforms; vg.amt.value = .28; vg.sat.value = 1.15; vg.contrast.value = .14;
const sun = new THREE.DirectionalLight('#FFF1D6', 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0003; sun.shadow.normalBias = .02;
scene.add(sun, sun.target); const hemi = new THREE.HemisphereLight('#CFE0FF', '#B89A7A', .7); scene.add(hemi);
const sky = skyDome('#4F9BE8', '#D8ECFA', V(.3, .4, -1), '#FFF6D8'); scene.add(sky);
const bulb = new THREE.PointLight('#FFE2B0', 0, 8, 1.5); scene.add(bulb);
function light(o) {
  sun.color.set(o.col ?? '#FFF1D6'); sun.intensity = o.int ?? 3; sun.position.set(...o.pos); sun.target.position.set(...(o.tgt ?? [0, 0, 0]));
  const r = o.r ?? 12, c = sun.shadow.camera; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 1; c.far = o.far ?? 120; c.updateProjectionMatrix();
  hemi.color.set(o.hs ?? '#CFE0FF'); hemi.groundColor.set(o.hg ?? '#B89A7A'); hemi.intensity = o.hemi ?? .7;
  if (o.sky) { sky.visible = true; scene.background = null; } else { sky.visible = false; scene.background = new THREE.Color(o.bg ?? '#2A2A30'); }
  scene.environmentIntensity = o.env ?? .5; vg.warm.value = o.warm ?? .12; vg.fade.value = 1;
  bulb.intensity = o.bulb ?? 0; if (o.bulbPos) bulb.position.set(...o.bulbPos);
}
const OUT = { pos: [-14, 22, 18], tgt: [2, 0, 0], col: '#FFF1D6', int: 3.1, sky: 1, hemi: .8, r: 14, warm: .14 };
const STORE = { pos: [3, 12, 2], tgt: [0, 0, -4], col: '#F4F8FF', int: 1.6, bg: '#E6EEF0', hemi: 1.15, hs: '#F4F8FF', hg: '#C8C0B0', r: 14, env: .7, warm: .02 };
const GARAGE = { pos: [-4, 6, 14], tgt: [3, 0, -3], col: '#FFD9A0', int: 2.2, sky: 1, hemi: .45, hs: '#C8D8F0', hg: '#7A6A5A', r: 8, warm: .3, bulb: 6, bulbPos: [3, 2.7, -3.2] };
const HALL = { pos: [-6, 9, -10], tgt: [0, 0, -1], col: '#FFF4E0', int: 2.0, bg: '#E8E0CC', hemi: .95, hs: '#FFF8EC', hg: '#B89A7A', r: 9, env: .6, warm: .14 };
const CABIN = { pos: [8, 3, 1], tgt: [0, 1, 0], col: '#FFFFFF', int: 2.6, bg: '#E8F0F8', hemi: 1.0, hs: '#E8F4FF', hg: '#9AA0B0', r: 6, env: .7, warm: .06 };

// ---------------- sets, cast, props ----------------
const SET = { sub: suburb(), store: store(), hall: hall(), cabin: cabin() };
for (const s of Object.values(SET)) { s.visible = false; scene.add(s); }
const mk = look => { const p = makeCast(look); scene.add(p.P); return p; };
const dv = mk(LOOKS.david), cash = mk(LOOKS.cashier), v1 = mk(LOOKS.vol1), v2 = mk(LOOKS.vol2), v3 = mk(LOOKS.vol3), att = mk(LOOKS.attendant);
const CASTS = [dv, cash, v1, v2, v3, att];
const heroCup = cup(1.6); dv.props.add(heroCup); heroCup.rotation.x = Math.PI; heroCup.position.set(0, .0, .02);
const calc = calculator(); dv.propsL.add(calc); calc.rotation.set(-1.3, 0, 0); calc.position.set(0, -.02, .03);
const spn = spoon(); dv.props.add(spn); spn.rotation.x = Math.PI;
const card = goldCard(); card.scale.setScalar(.25); att.props.add(card); card.rotation.set(-Math.PI / 2 - .3, 0, 0); card.position.set(0, -.05, .06);
const boxP = G(); M(new THREE.BoxGeometry(.42, .28, .32), mat('#C9A06A', { r: .9 }), boxP, 0, -.02, 0); { const cs = cups(12, 1.4); boxP.add(cs); for (let k = 0; k < 12; k++) setInst(cs, k, ((k % 4) - 1.5) * .09, .13, (Math.floor(k / 4) - 1) * .09, 0, k, 0); cs.instanceMatrix.needsUpdate = true; }
dv.spine.add(boxP); boxP.position.set(0, .12, .3);
const PROPS = [heroCup, calc, spn, card, boxP];
const jetM = jet(); scene.add(jetM);
const fall = cups(240, 1.6); scene.add(fall);
const carts = [0, 1, 2, 3].map(i => { const c = cart(); loadCart(c, 230 + i * 10, 3 + i); SET.store.add(c); return c; });
const scale = balance(); const scTable = G(); SET.store.add(scTable); M(new THREE.BoxGeometry(.9, .05, .6), mat('#C8283A', { r: .5 }), scTable, 0, .75, 0); M(new THREE.BoxGeometry(.85, .7, .55), mat('#E8E8EC'), scTable, 0, .37, 0);
scTable.add(scale); scale.position.y = .78; scale.scale.setScalar(.75); scTable.position.set(.62, 0, -3.3); scTable.rotation.y = -.35;
const tagL = textPlane([{ text: '25¢', size: 150, y: 110, color: '#FFFFFF' }], .26, .16, { w: 360, h: 220, bg: '#C8283A', round: 30 });
const tagR = textPlane([{ text: 'MILES', size: 110, y: 110, color: '#FFFFFF' }], .3, .16, { w: 420, h: 220, bg: '#1C4E9A', round: 30 });
scale.add(tagL, tagR);
const form = taxForm(); SET.cabin.userData.tray.add(form); form.rotation.set(-Math.PI / 2, 0, .15); form.position.set(-.08, .015, 0); form.scale.setScalar(1.1);
const trayCup = cup(1.6); SET.cabin.userData.tray.add(trayCup); trayCup.position.set(.17, .012, .05);
const binLid = G(); SET.cabin.add(binLid); binLid.position.set(1.25, 2.47, .3); M(new THREE.BoxGeometry(.6, .05, .9), mat('#E6E4DC'), binLid, 0, 0, 0).position.y = -.02;
const flyLab = SET.hall.userData.labels, HB = SET.hall.userData.bin; HB.position.set(1.55, 0, .7);
SET.hall.userData.tables.forEach((tb, j) => { const cs = cups(60, 1.5); tb.add(cs); for (let k = 0; k < 60; k++) setInst(cs, k, -1.9 + (k % 20) * .2 + (j ? .1 : 0), .79, -.15 + Math.floor(k / 20) * .12, 0, k, 0); cs.instanceMatrix.needsUpdate = true; });

// ---------------- key times (from the voice) ----------------
const C2 = cut('L2'), C3 = cut('L3'), C4 = cut('L4'), C5 = cut('L5'), C6 = cut('L6'), C7 = cut('L7'), C8 = cut('L8'), C9 = cut('L9');
const tMillion = w('L2', 'million'), tTurned = w('L2', 'turned');
const t1999 = w('L3', '1999'), tBarcode = w('L3', 'barcode');
const tDavid = w('L4', 'david'), tMath = w('L4', 'math'), tMiles4 = w('L4', 'miles'), tWay = w('L4', 'way');
const tBought = w('L5', 'bought'), tFind = w('L5', 'find'), t12150 = w('L5', '12150');
const tProblem = w('L6', 'problem'), tPeel = w('L6', 'peel'), tDeadline = w('L6', 'deadline');
const tGenius = w('L7', 'genius'), tGave = w('L7', 'gave'), tVol = w('L7', 'volunteers'), tPeeled = w('L7', 'peeled');
const t125 = w('L8', '125'), tLifetime = w('L8', 'lifetime');
const tTax = w('L9', 'tax'), tWrite = w('L9', 'write'), tPud9 = w('L9', 'pudding');
const snapB = t => Math.round(t / B) * B;
const S4b = Math.max(C4 + 4 * B, snapB(tMiles4 - .3)), S5b = Math.max(C5 + 4 * B, snapB(t12150 - .35)), S7b = Math.max(C7 + 2 * B, snapB(tGave - .25));
const RAIN = LOOP - .45;     // the overhead bin pops and the cups rain down: the loop back into the avalanche

// ---------------- helpers ----------------
const put = (p, x, y, z, ry = 0) => { p.P.visible = true; p.P.position.set(x, y, z); p.P.rotation.y = ry; p.P.updateMatrixWorld(true); };
const show = (...ps) => PROPS.forEach(o => o.visible = ps.includes(o));
const CAMP = new THREE.Vector3();
function reset() { CASTS.forEach(p => p.P.visible = false); show(); jetM.visible = false; fall.visible = false; carts.forEach(c => c.visible = false); scTable.visible = false; }
const P2 = Object.assign(POSES, {
  calc: { sp: [4, 0, 0], hd: [14, 0, 0], aL: [-55, 28, -12, 95, 20], aR: [-50, -30, 14, 98, 0], lL: [0, -3, 2], lR: [0, 3, 2], y: 0, gL: .55, gR: .2, face: 'calm', pt: 1 },
  push: { sp: [14, 0, 0], hd: [-8, 0, 0], aL: [-58, 10, -6, 22, 0], aR: [-58, -10, 6, 22, 0], lL: [0, -3, 2], lR: [0, 3, 2], y: -.01, gL: .95, gR: .95, face: 'happy' },
  peel: { sp: [12, 0, 0], hd: [16, 0, 0], aL: [-48, 30, -10, 100, 0], aR: [-48, -30, 10, 100, 0], lL: [0, -3, 2], lR: [0, 3, 2], y: 0, gL: .45, gR: .55, face: 'calm' },
  sitPeel: { sp: [10, 0, 0], hd: [16, 0, 0], aL: [-48, 30, -10, 100, 0], aR: [-48, -30, 10, 100, 0], lL: [-85, -6, 85], lR: [-85, 6, 85], y: -.47, gL: .45, gR: .55, face: 'worried' },
  think: { sp: [-2, 0, 0], hd: [-6, -10, 6], aL: [6, 0, -7, 10, 0], aR: [-62, 58, 58, 160, -10], lL: [0, -3, 2], lR: [0, 3, 2], y: 0, gL: .25, gR: .85, face: 'smug', pt: 1 },
  carry: { sp: [-6, 0, 0], hd: [-2, 0, 0], aL: [-40, 25, -18, 70, 0], aR: [-40, -25, 18, 70, 0], lL: [0, -3, 2], lR: [0, 3, 2], y: 0, gL: .7, gR: .7, face: 'happy' },
  sitRelax: { sp: [-12, 0, 0], hd: [-8, 0, 0], aL: [-150, 30, -40, 125, 0], aR: [-150, -30, 40, 125, 0], lL: [-80, -6, 75], lR: [-80, 6, 75], y: -.47, gL: .3, gR: .3, face: 'happy' },
  sitEat: { sp: [-4, 0, 0], hd: [2, 0, 0], aL: [-45, 15, -8, 80, 0], aR: [-62, -24, 22, 142, 0], lL: [-80, -6, 75], lR: [-80, 6, 75], y: -.47, gL: .6, gR: .8, face: 'happy' },
  catchCup: { sp: [-8, 0, 0], hd: [-10, 0, 0], aL: [-30, 30, -55, 60, 0], aR: [-130, -10, 20, 40, 0], lL: [0, -4, 4], lR: [0, 4, 4], y: -.01, gL: .1, gR: .7, face: 'happy' },
});
// the avalanche: cups pour out of the garage over the spill, tumbling (simulated from their release; pure in t)
const GH = (x, z) => { const d = Math.hypot(x - 2.6, (z - 1.4) / 1.1); return d < 2.6 ? .7 * (1 - d / 2.6) : 0; };
function avalanche(t, src = 'garage') {
  fall.visible = true;
  for (let i = 0; i < 240; i++) {
    const t0 = -1.2 + i * .016, k = t - t0;
    if (k < 0) { setInst(fall, i, 0, -50, 0); continue; }
    let x, y, z, vx, vy, vz;
    if (src === 'garage') { x = 2.0 + hash(i) * 2.4; y = 2.6 + hash(i + 7) * .4; z = -1.1; vx = (hash(i + 3) - .5) * 1.6; vy = .5 + hash(i + 5) * 1.5; vz = 1.4 + hash(i + 9) * 2.6; }
    else { x = .95 + (hash(i) - .5) * .5; y = 2.35; z = .3 + (hash(i + 7) - .5) * .6; vx = (hash(i + 3) - .5) * 1.2; vy = -.2; vz = (hash(i + 9) - .5) * 1.2; }
    const dt = .02; let s = 0, rest = false;
    for (; s < k && s < 4; s += dt) {
      if (rest) break; vy -= 9.8 * dt; x += vx * dt; y += vy * dt; z += vz * dt;
      const g = src === 'garage' ? GH(x, z) : (Math.abs(x - .85) < .3 && Math.abs(z - .5) < .25 ? .74 : 0);
      if (y < g) { y = g; if (vy < -1.5) { vy = -vy * .32; vx *= .7; vz *= .7; } else { vy = 0; vx *= .9; vz *= .9; if (Math.hypot(vx, vz) < .05) rest = true; } }
    }
    const sp = 6 + hash(i + 11) * 10, rr = rest ? s : k;
    setInst(fall, i, x, y + .04, z, rr * sp * (hash(i + 2) - .5), rr * sp * .5, rr * sp * (hash(i + 4) - .5));
  }
  fall.instanceMatrix.needsUpdate = true;
}
const twitch = (p, t, a = .12) => { p.aL.el.rotation.x += Math.sin(t * 31) * a; p.aR.el.rotation.x -= Math.sin(t * 27 + 1) * a; p.aL.hand.rotation.z = Math.sin(t * 23) * .3; p.aR.hand.rotation.z = Math.sin(t * 29) * .3; };

// ---------------- the shots ----------------
const SHOTS = [
  // 1 · the hook: cups pour out of the garage, David in the avalanche
  { t0: 0, t1: C2, set: 'sub', lt: OUT, act: t => act1(t),
    cam: (t, u) => camAt(V(lerp(2.4, 1.85, eo(u)), lerp(1.1, 1.45, u), lerp(8.6, 6.2, eo(u))), V(lerp(2.2, 1.7, u), lerp(1.55, 1.45, u), 1.5), 44, lerp(5.0, 2.6, eo(u)), 4) },
  // 2 · a million miles: a jumbo jet roars low over the house, David cheers on the pile
  { t0: C2, t1: C3, set: 'sub', lt: OUT, act: t => act2(t),
    cam: (t, u) => camAt(V(lerp(3.9, 4.1, u), lerp(.75, .6, u), lerp(7.2, 7.6, u)), V(lerp(2.4, 2.0, eio(u)), lerp(2.0, 5.2, eio(u)), -2), 50, 6.2, 2) },
  // 3 · 1999, aisle 7: the promotion
  { t0: C3, t1: C4, set: 'store', lt: STORE, act: t => act3(t),
    cam: (t, u) => camAt(V(lerp(.35, .1, eio(u)), lerp(1.6, 1.55, u), lerp(6.4, 3.4, eio(u))), V(lerp(-.55, -.78, u), lerp(1.5, 1.75, u), lerp(-1, .2, u)), 42, lerp(6, 3.1, u), 4) },
  // 4a · the engineer does the math
  { t0: C4, t1: S4b, set: 'store', lt: STORE, act: t => act4(t),
    cam: (t, u) => camAt(V(lerp(.45, .3, u), 1.58, lerp(-1.05, -1.35, eio(u))), V(-.05, 1.5, -3.1), 38, lerp(2.0, 1.75, u), 5) },
  // 4b · the scale: miles outweigh pudding
  { t0: S4b, t1: C5, set: 'store', lt: STORE, act: t => act4(t),
    cam: (t, u) => camAt(V(lerp(.82, .72, u), 1.38, lerp(-.8, -.95, u)), V(.56, 1.2, -3.3), 46, 2.45, 4) },
  // 5a · every cup he could find: the cart train down the aisle
  { t0: C5, t1: S5b, set: 'store', lt: STORE, act: t => act5(t), after: 1,
    cam: (t, u) => { const z = carts[0].position.z; return camAt(V(.55, 1.75, z - 3.6), V(-.05, .95, z + 1.4), 44, 4.2, 4); } },
  // 5b · the checkout: 12,150 cups
  { t0: S5b, t1: C6, set: 'store', lt: STORE, act: t => act5(t),
    cam: (t, u) => camAt(V(lerp(1.05, .95, u), 1.5, lerp(-13.3, -13.5, u)), V(-.35, 1.32, -16.2), 40, 2.95, 4) },
  // 6 · the problem: 12,000 labels, one deadline
  { t0: C6, t1: C7, set: 'sub', lt: GARAGE, act: t => act6(t),
    cam: (t, u) => camAt(V(lerp(2.65, 2.55, u), lerp(1.3, 1.25, u), lerp(1.9, 1.1, eio(u))), V(2.75, 1.45, -3.2), 42, lerp(2.6, 1.9, u), 4) },
  // 7a · his genius move
  { t0: C7, t1: S7b, set: 'hall', lt: HALL, act: t => act7(t),
    cam: (t, u) => camAt(V(lerp(-2.05, -2.15, u), 1.62, lerp(2.45, 2.25, u)), V(-2.6, 1.55, 1.0), 36, 1.5, 5) },
  // 7b · the volunteers peel them for him
  { t0: S7b, t1: C8, set: 'hall', lt: HALL, act: t => act7(t),
    cam: (t, u) => camAt(V(lerp(-.5, .5, eio(u)), lerp(2.7, 2.4, u), lerp(3.6, 3.1, u)), V(.25, .95, -1.7), 44, 4.6, 3) },
  // 8 · 1,250,000 miles, lifetime elite
  { t0: C8, t1: C9, set: 'cabin', lt: CABIN, act: t => act8(t),
    cam: (t, u) => camAt(V(lerp(.15, .3, u), lerp(1.35, 1.3, u), lerp(2.2, 1.85, eio(u))), V(.8, 1.08, -.05), 40, 2.0, 4) },
  // 9 · a tax write-off… for the pudding (and the bin pops: the loop)
  { t0: C9, t1: LOOP, set: 'cabin', lt: CABIN, act: t => act9(t),
    cam: (t, u) => camAt(V(lerp(.3, .38, u), lerp(1.42, 1.38, u), lerp(1.38, 1.2, eio(u))), V(.84, .98, .12), 38, 1.15, 5) },
  { t0: LOOP, t1: DUR + 1, set: 'sub', loop: true },
];
SHOTS[SHOTS.length - 1] = { ...SHOTS[0], t0: LOOP, t1: DUR + 1, act: () => act1(0), cam: () => SHOTS[0].cam(0, 0) };

// ---------------- acting ----------------
function act1(t) {
  reset(); avalanche(t); show(heroCup);
  put(dv, 1.75, 0, 3.4, -.15);
  const caught = t > 1.6;
  apply(dv, t < .6 ? POSES.shock : caught ? POSES.catchCup : mixPose(POSES.shock, POSES.catchCup, seg(t, 1.1, 1.6)), { t, seed: 1, face: t < 1.2 ? 'shock' : 'happy', look: CAMP });
  heroCup.visible = caught;
}
function act2(t) {
  reset(); avalanche(t + 2.0); jetM.visible = true;
  const u = seg(t, C2 - .2, C3 + .1), A = V(-3, 30, -62), Bp = V(9, 12, 14), p = A.clone().lerp(Bp, u), d = Bp.clone().sub(A).normalize();
  jetM.position.copy(p); jetM.lookAt(p.clone().add(d)); jetM.rotateY(-Math.PI / 2); jetM.rotateX(-.05);
  put(dv, 2.3, .55, 1.6, .3);
  apply(dv, t < tMillion - .3 ? POSES.catchCup : POSES.cheer, { t, seed: 1, face: 'happy', look: jetM.position });
  show(heroCup);
}
function act3(t) {
  reset(); SET.store.userData.pud.visible = true;
  const st = SET.store.userData.standee; st.rotation.z = Math.sin(t * 2.4) * .015;
  put(cash, -.4, 0, -16.3, 0); apply(cash, POSES.stand, { t, seed: 5, face: 'calm' });
}
function act4(t) {
  reset(); SET.store.userData.pud.visible = true; scTable.visible = true; show(calc);
  put(dv, -.1, 0, -3.15, .2);
  const tip = eo(seg(t, tWay - .12, tWay + .18)), tilt = t < tMiles4 ? Math.sin(t * 3) * .05 : lerp(.12, -.42, tip) + .04 * Math.sin((t - tWay) * 12) * Math.exp(-Math.max(0, t - tWay) * 4) * (t > tWay ? 1 : 0);
  scale.userData.tilt(tilt);
  tagL.position.set(-.62, 1.22 - tilt * .62, .12); tagR.position.set(.62, 1.22 + tilt * .62, .12); tagL.lookAt(CAMP); tagR.lookAt(CAMP);
  const lookScale = t > tMiles4 - .2;
  apply(dv, lookScale ? mixPose(POSES.calc, POSES.stand, .3) : POSES.calc, { t, seed: 1, face: t > tWay ? 'happy' : lookScale ? 'shock' : t > tMath ? 'smug' : 'calm', look: lookScale ? V(.62, 1.1, -3.3) : V(-.1, .9, -2.7) });
  if (!lookScale) twitch(dv, t, .05);
  calc.userData.display.userData.redraw([{ text: t < tDavid ? '0.25' : t < tMath ? '500÷10' : '= 50 MI', size: 62, y: 60, color: '#1C2A1C' }], { w: 280, h: 100, bg: '#B8D8A8' });
  put(cash, -.4, 0, -16.3, 0); apply(cash, POSES.stand, { t, seed: 5 });
}
const CZ0 = 3.2, CZ1 = -13.7;
function act5(t) {
  reset(); SET.store.userData.pud.visible = false;
  if (t < S5b) {
    const u = seg(t, C5 - .2, S5b + .4), z = lerp(CZ0, CZ1 + 1.8, eio(u) * .95 + u * .05);
    carts.forEach((c, i) => { c.visible = true; c.position.set(-.05 + Math.sin(i * 1.7 + t * 3) * .03, 0, z - .2 - i * 1.0); c.rotation.y = Math.PI + Math.sin(i + t * 2) * .02; });
    put(dv, -.05, 0, z + .75, Math.PI); apply(dv, walkPose(POSES.push, (CZ0 - z) * 1.0, 1.3), { t, seed: 1, face: 'happy' });
  } else {
    carts.forEach((c, i) => { c.visible = true; c.position.set(-.05 + (i % 2) * .05, 0, CZ1 + 1.8 - .2 - i * .1 + 3 - i * 1.0 + 0); c.rotation.y = Math.PI; });
    carts.forEach((c, i) => { c.position.set(i ? 9 : .6, 0, -14.6); c.rotation.y = Math.PI * .9; });
    put(dv, .05, 0, -9.4, Math.PI); apply(dv, POSES.push, { t, seed: 1, face: 'happy', look: lookAtP(cash) });
  }
  put(cash, -.4, 0, -16.3, 0);
  apply(cash, t >= t12150 - .1 ? POSES.shock : POSES.stand, { t, seed: 5, face: t >= t12150 - .1 ? 'shock' : 'calm', look: t >= S5b ? CAMP : V(0, 1.4, -10) });
}
const lookAtP = (p, dy = 1.6) => V(p.P.position.x, p.P.position.y + dy, p.P.position.z);
function act6(t) {
  reset(); show(heroCup);
  const clock = SET.sub.userData.clock; clock.userData.hands[0].rotation.z = -t * 1.2; clock.userData.hands[1].rotation.z = -t * 14;
  put(dv, 2.6, .12, -.75, .1);
  apply(dv, POSES.sitPeel, { t, seed: 1, face: t > tPeel ? 'worried' : 'calm', look: t > tProblem && t < tPeel + .4 ? V(3.6, 2.4, -4.9) : V(2.6, .9, -.4) });
  twitch(dv, t, .04);
  heroCup.position.set(0, .0, .02);
  if (dv.aR) { const wr = Math.sin(t * 2) * .2; dv.aR.hand.rotation.x = wr; }
}
function act7(t) {
  reset();
  const hb = SET.hall.userData;
  // the volunteers behind the tables, peeling fast; labels arc into the bin
  [[v1, -1.2, -3.2], [v2, .6, -3.2], [v3, -.4, -1.0]].forEach(([v, x, z], i) => { put(v, x, 0, z, 0); apply(v, POSES.peel, { t, seed: 20 + i, face: 'happy' }); twitch(v, t + i, .18); });
  flyLab.visible = t >= S7b;
  if (flyLab.visible) {
    const src = [V(-1.2, 1.05, -2.85), V(.6, 1.05, -2.85), V(-.4, 1.05, -.65)], dst = V(1.55, .9, .7);
    for (let i = 0; i < 500; i++) {
      const s = src[i % 3], t0 = S7b + (i / 500) * (C8 - S7b) * .95, k = (t - t0) / .7;
      if (k < 0 || k > 1) { setInst(flyLab, i, 0, -20, 0); continue; }
      const x = lerp(s.x, dst.x, k), z = lerp(s.z, dst.z, k), y = lerp(s.y, dst.y, k) + Math.sin(k * Math.PI) * 1.2;
      setInst(flyLab, i, x, y, z, k * 9 + i, k * 6, k * 7 + i);
    }
    flyLab.instanceMatrix.needsUpdate = true;
  }
  if (t < S7b) { put(dv, -2.6, 0, 1.0, .45); apply(dv, POSES.think, { t, seed: 1, face: t > tGenius ? 'smug' : 'calm', wink: t > tGenius + .3 && t < tGenius + .75 ? 1 : 0, look: CAMP }); }
  else { show(boxP); put(dv, .95, 0, .35, -.7); apply(dv, POSES.carry, { t, seed: 1, face: 'happy', look: V(0, 1.2, -2) }); }
}
function act8(t) {
  reset(); show(card);
  put(dv, .85, .03, -.02, 0); apply(dv, t < tLifetime ? POSES.sitRelax : POSES.sitTalk, { t, seed: 1, face: 'happy', look: t < tLifetime ? CAMP : lookAtP(att, 1.6) });
  binLid.rotation.x = 0;
  const giving = t > tLifetime - .3;
  put(att, .2, 0, .5, 2.05); apply(att, giving ? POSES.offer : POSES.stand, { t, seed: 9, face: 'happy', look: lookAtP(dv, 1.05) });
  card.visible = giving;
}
function act9(t) {
  reset(); show(spn);
  form.userData.redraw(t >= tWrite - .05 ? 1 : 0);
  const eat = t > tPud9 - .5;
  put(dv, .85, .03, -.02, 0); apply(dv, eat ? POSES.sitEat : POSES.sitRelax, { t, seed: 1, face: eat ? 'happy' : 'smug', wink: t > tPud9 && t < tPud9 + .5 ? 1 : 0, look: t > tWrite - .2 && !eat ? V(.85, .74, .55) : CAMP });
  spn.visible = eat; trayCup.visible = true;
  // the overhead bin pops open and the cups rain down: back to the avalanche
  binLid.rotation.x = -1.6 * eo(seg(t, RAIN - .15, RAIN + .1));
  if (t > RAIN - .15) avalanche(t - RAIN + .1, 'bin');
}

// ---------------- sound events (the score reads these) ----------------
ev(0, 'avalanche'); ev(.12, 'pop'); ev(1.55, 'catch');
ev(C2 + .05, 'jet'); ev(tMillion, 'sting');
ev(C3, 'cut'); ev(t1999, 'pop'); ev(tBarcode, 'beep');
ev(C4, 'cut'); for (let k = 0, tt = tDavid - .3; tt < tMath; k++, tt += .16) ev(tt, 'key'); ev(tDavid, 'pop'); ev(S4b, 'cut'); ev(tWay - .05, 'clang');
ev(C5, 'cut'); for (let tt = C5 + .1; tt < S5b; tt += B / 2) ev(tt, 'rattle'); ev(S5b, 'cut'); ev(t12150 - .05, 'register');
ev(C6, 'cut'); for (let tt = C6; tt < C7 - .05; tt += B / 2) ev(tt, 'tick'); ev(tPeel - .1, 'peel'); ev(tDeadline, 'stamp');
ev(C7, 'cut'); ev(tGenius + .25, 'ding'); ev(S7b, 'cut'); for (let tt = S7b + .1; tt < C8 - .1; tt += .11) ev(tt, 'peelfast');
ev(C8, 'whoosh'); ev(t125, 'sting'); ev(tLifetime, 'sparkle');
ev(C9, 'cut'); ev(tWrite - .05, 'stamp'); ev(tPud9 + .1, 'slurp'); ev(RAIN - .12, 'binpop'); ev(RAIN, 'avalanche');

// ---------------- the 2D overlay: telops + counters + word-by-word captions ----------------
const ov = document.getElementById('ov').getContext('2d');
const num = n => Math.round(n).toLocaleString('en-US');
const TEL = [
  { t0: -1, t1: C2, text: '12,000 PUDDING CUPS', y: 300, size: 96, col: '#FFD23F', rot: -4, plate: '#6B3A22' },
  { t0: tTurned, t1: C3, text: t => num(1000000 * eo(seg(t, tTurned, tMillion))) + '+ MILES', y: 300, size: 104, col: '#FFFFFF', rot: 3, plate: '#1C4E9A', grow: 1 },
  { t0: t1999, t1: tBarcode + .3, text: '1999', y: 300, size: 170, col: '#FFD23F', rot: -5 },
  { t0: tDavid - .05, t1: S4b + .4, text: 'DAVID PHILLIPS', y: 1270, size: 84, col: '#FFFFFF', rot: -3, plate: '#3E7CC0', sub: 'ENGINEER' },
  { t0: tWay - .05, t1: C5, text: 'WORTH WAY MORE!', y: 330, size: 104, col: '#7BE07B', rot: -5 },
  { t0: tBought, t1: C6, text: t => num(t < t12150 ? 12150 * eo(seg(t, tBought, t12150)) : 12150), y: 300, size: 170, col: '#FFD23F', rot: -4, sub: 'PUDDING CUPS', grow: 1 },
  { t0: tProblem - .05, t1: C7, text: '12,000 LABELS TO PEEL', y: 300, size: 84, col: '#FFFFFF', rot: 3, plate: '#C8283A' },
  { t0: tDeadline - .05, t1: C7, text: 'DEADLINE!', y: 470, size: 120, col: '#FFD23F', rot: -6, stamp: 1 },
  { t0: tGenius - .05, t1: S7b + .6, text: 'GENIUS MOVE', y: 330, size: 120, col: '#FFD23F', rot: -5 },
  { t0: t125 - .05, t1: C9, text: t => num(t < tLifetime - .2 ? 1250000 * eo(seg(t, t125 - .05, t125 + .9)) : 1250000) + ' MILES', y: 300, size: 96, col: '#FFFFFF', rot: -3, plate: '#1C4E9A', grow: 1 },
  { t0: tLifetime - .05, t1: C9, text: 'LIFETIME ELITE', y: 450, size: 92, col: '#3A2A00', rot: 4, plate: '#E8C04A' },
  { t0: tTax - .05, t1: LOOP, text: '+ TAX WRITE-OFF', y: 300, size: 100, col: '#7BE07B', rot: -4, plate: '#1C3A2A' },
];
function drawTelop(x, t) {
  const p = seg(t, x.t0, x.t0 + .28), sc = x.stamp ? lerp(2.2, 1, eo(p)) : back(p, 2.6), wob = 1 + .02 * Math.sin((t - x.t0) * 8);
  const text = typeof x.text === 'function' ? x.text(t) : x.text;
  ov.save(); ov.translate(540, x.y); ov.rotate(x.rot * Math.PI / 180); ov.scale(sc * wob, sc * wob); if (x.stamp) ov.globalAlpha = clamp(p * 3);
  ov.font = `700 ${x.size}px Fredoka`; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  const tw = Math.min(980, ov.measureText(text).width + 70), th = x.size * 1.45;
  if (x.plate) { ov.fillStyle = 'rgba(20,10,10,.9)'; ov.beginPath(); ov.roundRect(-tw / 2 + 10, -th / 2 + 12, tw, th, 30); ov.fill(); ov.fillStyle = x.plate; ov.beginPath(); ov.roundRect(-tw / 2, -th / 2, tw, th, 30); ov.fill(); }
  if (x.stamp) { ov.strokeStyle = x.col; ov.lineWidth = 12; ov.beginPath(); ov.roundRect(-tw / 2 + 5, -th / 2 + 8, tw - 10, th - 16, 18); ov.stroke(); }
  ov.lineWidth = x.size * .17; ov.strokeStyle = '#1B1213'; ov.strokeText(text, 0, 4, 940); ov.fillStyle = x.col; ov.fillText(text, 0, 4, 940);
  if (x.sub) { ov.font = '700 46px Fredoka'; const sw = ov.measureText(x.sub).width + 40; ov.fillStyle = '#FFD23F'; ov.beginPath(); ov.roundRect(-sw / 2, x.size * .72 + 6, sw, 66, 18); ov.fill(); ov.fillStyle = '#1B1213'; ov.fillText(x.sub, 0, x.size * .72 + 41); }
  ov.restore();
}
const CAPY = 1480, CAPS = 78;
const chunks = [];
TM.lines.forEach((l, li) => { let cur = []; const flush = () => { if (cur.length) chunks.push({ li, words: cur }); cur = []; };
  l.words.forEach(x => { const d = x.w.replace(/[,.…!?:]+$/, '').toUpperCase(); const len = cur.reduce((a, y) => a + y.d.length + 1, 0) + d.length; if (cur.length && len > 16) flush(); cur.push({ d, t0: x.t0, t1: x.t1 }); if (/[,.…!?:]$/.test(x.w)) flush(); }); flush(); });
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

// ---------------- render ----------------
const QS = new URLSearchParams(location.search), A0 = +(QS.get('a') ?? 0), B0 = +(QS.get('b') ?? DUR);
function render(t) {
  const sh = SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
  for (const [k, s] of Object.entries(SET)) s.visible = k === sh.set;
  light(sh.lt); const tt = sh.loop ? 0 : t, u = sh.loop ? 0 : seg(t, sh.t0, sh.t1);
  let c = sh.after ? null : sh.cam(tt, u); if (c) CAMP.copy(c.pos);
  sh.act(tt);
  if (!c) { c = sh.cam(tt, u); CAMP.copy(c.pos); }
  camera.position.copy(c.pos); camera.lookAt(c.look); camera.fov = c.fov; camera.updateProjectionMatrix();
  // a shake when the jet passes overhead
  if (sh === SHOTS[1]) { const k = Math.exp(-Math.pow((t - (C2 + C3) / 2) / .5, 2)) * .012; camera.rotation.z += Math.sin(t * 61) * k; camera.rotation.x += Math.sin(t * 47) * k; }
  post.dof.focus = c.focus; post.dof.aper = c.aper; post.dof.maxCoc = 8;
  const cuts = SHOTS.map(s => s.t0).filter(x => x > 0); let fl = 0; for (const x of cuts) if (t >= x && t < x + .08) fl = Math.max(fl, .3 * (1 - (t - x) / .08));
  scene.updateMatrixWorld(true);
  post.composer.render();
  ov.clearRect(0, 0, W, H);
  if (fl > 0) { ov.fillStyle = `rgba(255,255,255,${fl})`; ov.fillRect(0, 0, W, H); }
  if (QS.get('poster')) { ov.clearRect(0, 0, W, H); [['HE BOUGHT 12,000', 210, -4, '#FFFFFF'], ['PUDDING CUPS…', 360, -4, '#FFD23F']].forEach(([text, y, rot, col]) => drawTelop({ t0: -9, text, y, size: 120, col, rot }, t)); return; }
  if (t < LOOP) { TEL.forEach(x => { if (t >= x.t0 && t < x.t1) drawTelop(x, t); }); drawCaptions(t); }
}
function texts(t) {
  if (t >= LOOP) return [];
  return TEL.filter(x => typeof x.text === 'string' && t >= x.t0 + .3 && t < x.t1).map(x => ({ id: x.text, text: x.text, x0: 60, y0: x.y - x.size * .7, x1: 1020, y1: x.y + x.size * .7, ...(x.text.endsWith('!') ? { pass: true } : {}) }));
}
EV.sort((a, b) => a.t - b.t);
window.DUR = +(B0 - A0).toFixed(3); window.EV = EV; window.render = t => render(t + A0); window.TEXTS = t => texts(t + A0);
render(A0);
window.READY = true;
