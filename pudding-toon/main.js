// "The Pudding Guy" (v4 remake) · 3D vertical Short (1080×1920) in the toon style: outlined toon cast with big 2D faces,
// rich saturated world, a camera that never sits still (FPV rushes, push-ins, follow moves, dissolves), 1–3 word captions.
// Every shot, action, telop and caption is placed from timing.json (the voice). render(t) is a pure function of t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { makePost } from '/core/three/post.js';
import { makeToon, apply, TP, mix, walk } from './toon.js';
import { park } from './world.js';
import { textPlane } from './kit.js';
import { suburb, store, hall, cabin, cart, loadCart, balance, jet, cups, cup, setInst, calculator, taxForm, goldCard, spoon } from './sets5.js';
import { skyDome } from './sky.js';

const W = 1080, H = 1920;
await document.fonts.load('900 80px Montserrat'); await document.fonts.load('800 80px Montserrat'); await document.fonts.load('700 80px Fredoka');
const TM = await (await fetch('timing.json')).json();
const B = 60 / TM.bpm, DUR = TM.dur, LOOP = DUR - B;
const LN = Object.fromEntries(TM.lines.map(l => [l.id, l]));
const nrm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const w = (lid, word, k = 0) => { const ws = LN[lid].words.filter(x => nrm(x.w).startsWith(nrm(word))); return (ws[k] || ws[ws.length - 1] || { t0: LN[lid].t0 }).t0; };
const cut = id => LN[id].cut;
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
const camera = new THREE.PerspectiveCamera(45, W / H, .03, 1500);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, ao: false });
post.bloom.strength = .2; post.bloom.threshold = .95; post.bloom.radius = .5;
const vg = post.vig.uniforms; vg.amt.value = .22; vg.sat.value = 1.2; vg.contrast.value = .12;
const zb = new ShaderPass({ uniforms: { tDiffuse: { value: null }, amt: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: 'uniform sampler2D tDiffuse; uniform float amt; varying vec2 vUv; void main(){ vec2 d = vUv - .5; vec4 s = vec4(0.); for (int i = 0; i < 14; i++) { float k = 1. - amt * float(i) / 13. * length(d) * 2.; s += texture2D(tDiffuse, .5 + d * k); } gl_FragColor = s / 14.; }' });
post.composer.insertPass(zb, 1);
const sun = new THREE.DirectionalLight('#FFF4E0', 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
scene.add(sun, sun.target); const hemi = new THREE.HemisphereLight('#BFDFFF', '#6AA040', 1); scene.add(hemi);
const sky = skyDome('#2F7FE0', '#BFE3FA', V(.3, .45, -1), '#FFF6D8'); scene.add(sky);
const bulb = new THREE.PointLight('#FFE2B0', 0, 8, 1.5); scene.add(bulb);
const OUT = { pos: [-14, 22, 18], col: '#FFF4E0', int: 3.1, hs: '#BFDFFF', hg: '#6AA040', hemi: 1.0, fog: ['#CFE8F7', 70, 280], sky: 1, env: .35, r: 14, warm: .12, world: 1 };
const STORE = { pos: [3, 12, 4], col: '#F4F8FF', int: 1.7, hs: '#F4F8FF', hg: '#C8C0B0', hemi: 1.2, env: .5, r: 14, bg: '#E6EEF0', warm: .02 };
const GARAGE = { pos: [-4, 6, 14], col: '#FFD9A0', int: 2.3, hs: '#C8D8F0', hg: '#7A6A5A', hemi: .7, sky: 1, env: .3, r: 8, warm: .25, bulb: 5, bulbPos: [3, 2.7, -3.2], world: 1 };
const HALL = { pos: [-6, 9, 8], col: '#FFF4E0', int: 2.1, hs: '#FFF8EC', hg: '#B89A7A', hemi: 1.0, env: .45, r: 9, bg: '#E8E0CC', warm: .12 };
const CABIN = { pos: [6, 4, 6], col: '#FFFFFF', int: 2.4, hs: '#E8F4FF', hg: '#9AA0B0', hemi: 1.05, env: .5, r: 6, bg: '#E8F0F8', warm: .06 };
let WORLD;
function light(o, at) {
  sun.color.set(o.col); sun.intensity = o.int; sun.position.set(at.x + o.pos[0], at.y + o.pos[1], at.z + o.pos[2]); sun.target.position.copy(at);
  const c = sun.shadow.camera, r = o.r ?? 10; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 1; c.far = 140; c.updateProjectionMatrix();
  hemi.color.set(o.hs); hemi.groundColor.set(o.hg); hemi.intensity = o.hemi;
  scene.fog = o.fog ? new THREE.Fog(o.fog[0], o.fog[1], o.fog[2]) : null; sky.visible = !!o.sky; scene.background = o.sky ? null : new THREE.Color(o.bg ?? '#2A2A30');
  WORLD.visible = !!o.world; scene.environmentIntensity = o.env ?? .35; vg.warm.value = o.warm ?? .1;
  bulb.intensity = o.bulb ?? 0; if (o.bulbPos) bulb.position.set(...o.bulbPos);
}

// ---------------- sets ----------------
const SET = { sub: suburb(), store: store(), hall: hall(), cabin: cabin() };
for (const s of Object.values(SET)) { s.visible = false; scene.add(s); }
// the v4 world round the suburb: dense trees, hills in haze, a cloud band, a fairground far off (no ground: the suburb has its own)
WORLD = park({ noGround: 1, clear: [[0, 1, 15]], cx: -6, cz: 5, tuftR: 3.5, tufts: 1500, bunting: [], fenceX: 300, pathX: 400, wheelX: -60, wheelZ: -95, tents: [[-34, -80, 1.2], [36, -84, 1.3]], trees: 110 });
scene.add(WORLD);

// ---------------- cast ----------------
const DAVID = { name: 'david', top: '#3E7CC0', pants: '#C2A878', outfit: 'polo', hair: 'messy', hairC: '#5A3E2A', glasses: 'round', blush: 1, shoe: '#4A3020' };
const dv = makeToon(DAVID); scene.add(dv.P);
const cash = makeToon({ name: 'cashier', top: '#C8283A', pants: '#2E3A5A', outfit: 'polo', hair: 'bob', hairC: '#3A2418', tag: 'PAT', logo: 'SUPER SAVE', logoCol: '#FFFFFF', blush: 1 }); scene.add(cash.P);
const v1 = makeToon({ name: 'vol1', top: '#F2C230', pants: '#2E3A5A', outfit: 'tee', hair: 'bob', hairC: '#E8B048', apron: '#2E7A4A', apronText: 'FOOD\nBANK', blush: 1 });
const v2 = makeToon({ name: 'vol2', top: '#8A5AC8', pants: '#3C5E9A', outfit: 'tee', hair: 'beanie', hatC: '#E8423A', apron: '#2E7A4A', apronText: 'FOOD\nBANK' });
const v3 = makeToon({ name: 'vol3', top: '#F27AA0', pants: '#2E3A5A', outfit: 'tee', hair: 'bob', hairC: '#9A958E', glasses: 'round', apron: '#2E7A4A', apronText: 'FOOD\nBANK', blush: 1 });
const att = makeToon({ name: 'attendant', top: '#22325E', outfit: 'suit', hair: 'bob', hairC: '#2A1A12', tie: '#C8283A', pocketSq: '#F2C230', blush: 1 });
for (const p of [v1, v2, v3, att]) scene.add(p.P);
const CAST = [dv, cash, v1, v2, v3, att];
// props
const heroCup = cup(1.9); dv.props.add(heroCup); heroCup.rotation.x = Math.PI; heroCup.position.set(0, -.01, .02);
const calc = calculator(); calc.scale.setScalar(1.6); dv.propsL.add(calc); calc.rotation.set(-1.0, 0, 0); calc.position.set(.02, -.01, .03);
const spn = spoon(); spn.scale.setScalar(1.4); dv.props.add(spn); spn.rotation.x = Math.PI;
const eatCup = cup(2.0); dv.propsL.add(eatCup); eatCup.position.set(0, -.01, .03);
{ const top = new THREE.Mesh(new THREE.CylinderGeometry(.066, .066, .004, 24), new THREE.MeshToonMaterial({ color: '#5A3220' })); top.position.y = .05 * 2.0 + .002; eatCup.add(top); }
const card = goldCard(); card.scale.setScalar(.22); att.props.add(card); card.rotation.set(-Math.PI / 2 - .3, 0, 0); card.position.set(0, -.04, .05);
const boxP = new THREE.Group(); { const bx = new THREE.Mesh(new THREE.BoxGeometry(.36, .24, .28), new THREE.MeshToonMaterial({ color: '#C9A06A' })); bx.castShadow = true; boxP.add(bx); const cs = cups(12, 1.3); boxP.add(cs); for (let k = 0; k < 12; k++) setInst(cs, k, ((k % 4) - 1.5) * .08, .12, (Math.floor(k / 4) - 1) * .08, 0, k, 0); cs.instanceMatrix.needsUpdate = true; }
dv.spine.add(boxP); boxP.position.set(0, .3, .27);
const PROPS = [heroCup, calc, spn, eatCup, card, boxP];
const jetM = jet(); scene.add(jetM);
const fall = cups(240, 1.6); scene.add(fall);
const carts = [0, 1, 2, 3].map(i => { const c = cart(); loadCart(c, 230 + i * 10, 3 + i); SET.store.add(c); return c; });
const scale = balance(); const scTable = new THREE.Group(); SET.store.add(scTable);
{ const top = new THREE.Mesh(new THREE.BoxGeometry(.9, .05, .6), new THREE.MeshStandardMaterial({ color: '#C8283A', roughness: .5 })); top.position.y = .75; scTable.add(top); const leg = new THREE.Mesh(new THREE.BoxGeometry(.85, .7, .55), new THREE.MeshStandardMaterial({ color: '#E8E8EC' })); leg.position.y = .37; scTable.add(leg); }
scTable.add(scale); scale.position.y = .78; scale.scale.setScalar(.75); scTable.position.set(.62, 0, -3.3); scTable.rotation.y = -.35;
const tagL = textPlane([{ text: '25¢', size: 150, y: 110, color: '#FFFFFF' }], .26, .16, { w: 360, h: 220, bg: '#C8283A', round: 30 });
const tagR = textPlane([{ text: 'MILES', size: 110, y: 110, color: '#FFFFFF' }], .3, .16, { w: 420, h: 220, bg: '#1C4E9A', round: 30 });
scale.add(tagL, tagR);
const form = taxForm(); SET.cabin.userData.tray.add(form); form.rotation.set(-Math.PI / 2, 0, .15); form.position.set(-.08, .015, 0); form.scale.setScalar(1.1);
const trayCup = cup(1.6); SET.cabin.userData.tray.add(trayCup); trayCup.position.set(.17, .012, .05);
const binLid = new THREE.Mesh(new THREE.BoxGeometry(.6, .05, .9), new THREE.MeshStandardMaterial({ color: '#E6E4DC' })); SET.cabin.add(binLid); binLid.position.set(1.25, 2.47, .3);
const flyLab = SET.hall.userData.labels, HB = SET.hall.userData.bin; HB.position.set(1.55, 0, .7);
SET.hall.userData.tables.forEach((tb, j) => { const cs = cups(60, 1.5); tb.add(cs); for (let k = 0; k < 60; k++) setInst(cs, k, -1.9 + (k % 20) * .2 + (j ? .1 : 0), .79, -.15 + Math.floor(k / 20) * .12, 0, k, 0); cs.instanceMatrix.needsUpdate = true; });

// ---------------- key times (from the voice) ----------------
const C2 = cut('L2'), C3 = cut('L3'), C4 = cut('L4'), C5 = cut('L5'), C6 = cut('L6'), C7 = cut('L7'), C8 = cut('L8'), C9 = cut('L9');
const tMillion = w('L2', 'million'), tTurned = w('L2', 'turned');
const t1999 = w('L3', '1999'), tBarcode = w('L3', 'barcode'), tPudding3 = w('L3', 'pudding');
const tDavid = w('L4', 'david'), tMath = w('L4', 'math'), tMiles4 = w('L4', 'miles'), tWay = w('L4', 'way');
const tBought = w('L5', 'bought'), tFind = w('L5', 'find'), t12150 = w('L5', '12150');
const tProblem = w('L6', 'problem'), tPeel = w('L6', 'peel'), tDeadline = w('L6', 'deadline');
const tGenius = w('L7', 'genius'), tGave = w('L7', 'gave'), tVol = w('L7', 'volunteers'), tPeeled = w('L7', 'peeled');
const t125 = w('L8', '125'), tLifetime = w('L8', 'lifetime');
const tTax = w('L9', 'tax'), tWrite = w('L9', 'write'), tPud9 = w('L9', 'pudding');
const snapB = t => Math.round(t / B) * B;
const S1b = 1.3, S3b = C3 + 1.6, S4b = Math.max(C4 + 2.5, snapB(tMiles4 - .3)), S5b = t12150 - .45, S6b = tDeadline - .35, S7b = Math.max(C7 + 1.6, tGave - .25);
const RAIN = LOOP - .45;

// ---------------- helpers ----------------
const put = (p, v, ry = 0) => { p.P.visible = true; p.P.position.copy(v); p.P.rotation.y = ry; p.P.updateMatrixWorld(true); };
const show = (...ps) => PROPS.forEach(o => o.visible = ps.includes(o));
const CAMP = new THREE.Vector3(0, 1.4, 6);
function reset() { CAST.forEach(p => p.P.visible = false); show(); jetM.visible = false; fall.visible = false; carts.forEach(c => c.visible = false); scTable.visible = false; }
const GH = (x, z) => { const d = Math.hypot(x - 2.6, (z - 1.4) / 1.1); return d < 2.6 ? .7 * (1 - d / 2.6) : 0; };       // the spill outside the garage
const HH = (x, z) => { const d = Math.hypot(x - 3.0, z + 2.6); return d < 2.3 ? 2.1 * (1 - d / 2.3) : 0; };           // the heap inside
function avalanche(t, src = 'garage') {
  fall.visible = true;
  for (let i = 0; i < 240; i++) {
    const t0 = -1.2 + i * .016, k = t - t0;
    if (k < 0) { setInst(fall, i, 0, -50, 0); continue; }
    let x, y, z, vx, vy, vz;
    if (src === 'garage') { x = 2.3 + hash(i) * 2.5; y = 1.15 + hash(i + 7) * .85; z = -1.45; vx = (hash(i + 3) - .5) * 1.4; vy = .3 + hash(i + 5) * 1.5; vz = 1.6 + hash(i + 9) * 2.4; }
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
const twitch = (p, t, a = .12) => { p.aL.el.rotation.x += Math.sin(t * 31) * a; p.aR.el.rotation.x -= Math.sin(t * 27 + 1) * a; };
const headOf = p => { p.P.updateMatrixWorld(true); return p.head.getWorldPosition(V(0, 0, 0)); };

// ---------------- camera language ----------------
const camAt = (pos, look, fov = 45, focus, aper = 4, roll = 0) => ({ pos, look, fov, focus: focus ?? pos.distanceTo(look), aper, roll });
const hand = (c, t, a = 1) => { c.pos.x += noise(t, 1) * .012 * a; c.pos.y += noise(t, 2) * .01 * a; c.look.x += noise(t, 3) * .02 * a; c.look.y += noise(t, 4) * .016 * a; return c; };
const DV1 = V(1.9, 0, 3.0); DV1.y = GH(DV1.x, DV1.z);
const DV2 = V(2.5, 0, .9); DV2.y = GH(DV2.x, DV2.z) + .02;
const jetAt = t => { const u = seg(t, C2 - .2, C3 + .2), A = V(-3, 30, -62), Bp = V(9, 12, 14); return A.clone().lerp(Bp, u); };
// FPV rush into the store: from the doors, low down aisle 7, up to the FLY FREE banner
const FP3 = new THREE.CatmullRomCurve3([V(.6, 1.9, 10.5), V(.4, 1.4, 7.0), V(-.1, 1.15, 4.4), V(-.25, 1.45, 2.6)], false, 'centripetal', .5);
const fpv3 = t => { const u = eio(seg(t, C3, S3b)), p = FP3.getPointAt(u), a = FP3.getPointAt(Math.min(1, u + .05)); const lk = p.clone().add(a.sub(p).normalize().multiplyScalar(3)); const end = V(-.3, 2.3, .4); return camAt(p, lk.lerp(end, eio(seg(u, .55, 1))), lerp(56, 46, u), 3, 0, Math.sin(u * Math.PI) * .08); };
const SHOTS = [
  // 1a · the hook: cups pour out of the garage straight at the lens; David in the avalanche
  { t0: 0, t1: S1b, set: 'sub', lt: OUT, at: V(2, 0, 0), act: t => act1(t),
    cam: (t, u) => hand(camAt(V(lerp(.7, 1.0, eo(u)), lerp(.75, .85, u), lerp(6.6, 6.0, eo(u))), V(lerp(2.4, 2.1, u), lerp(1.7, 1.5, u), -1), 58, 3.6, 3), t, 1.3) },
  // 1b · he catches one, laughing: push in and round
  { t0: S1b, t1: C2, set: 'sub', lt: OUT, at: V(2, 0, 0), act: t => act1(t),
    cam: (t, u) => { const a = lerp(-.55, -.25, eio(u)), r = lerp(2.4, 1.7, eo(u)), h = DV1.clone().add(V(0, 1.15, 0)); return hand(camAt(V(h.x + Math.sin(a) * r, h.y + lerp(-.15, .05, u), h.z + Math.cos(a) * r), h.clone().add(V(0, .1, 0)), 48, r, 4), t); } },
  // 2 · a MILLION airline miles: a jet roars over the house; the camera follows it up from David on the pile
  { t0: C2, t1: C3, set: 'sub', lt: OUT, at: V(2, 0, 0), act: t => act2(t), dissolveOut: .3,
    cam: (t, u) => { const k = eio(seg(t, C2 + .3, tMillion + .2)), h = DV2.clone().add(V(0, 1.2, 0)); return hand(camAt(V(lerp(1.4, 1.2, u), lerp(.75, .6, u), lerp(3.6, 4.0, u)), h.clone().lerp(jetAt(t), k * .85), lerp(50, 62, k), lerp(2.8, 30, k), 3), t, 1.2 + k); } },
  // 3a · 1999: FPV rush into the supermarket, down aisle 7 to the FLY FREE banner
  { t0: C3, t1: S3b, set: 'store', lt: STORE, at: V(0, 0, 0), act: t => act3(t), cam: fpv3, fpv: 1 },
  // 3b · …for every barcode: down from the banner to the pudding shelf
  { t0: S3b, t1: C4, set: 'store', lt: STORE, at: V(0, 0, 0), act: t => act3(t),
    cam: (t, u) => { const k = eio(seg(t, S3b, tBarcode)); return hand(camAt(V(lerp(-.25, -.55, k), lerp(1.45, 1.05, k), lerp(2.6, 1.3, k)), V(lerp(-.3, -1.25, k), lerp(2.3, .8, k), lerp(.4, .9, k)), 46, lerp(2.4, .8, k), 5), t, .7); } },
  // 4a · the engineer does the math: push in, low and wide
  { t0: C4, t1: S4b, set: 'store', lt: STORE, at: V(0, 0, -3), act: t => act4(t),
    cam: (t, u) => hand(camAt(V(lerp(.75, .35, eio(u)), lerp(.95, 1.12, u), lerp(-1.3, -2.15, eio(u))), V(-.08, lerp(1.0, 1.15, u), -3.15), lerp(50, 44, u), lerp(2.0, 1.1, eio(u)), 5), t) },
  // 4b · the scale: miles outweigh pudding
  { t0: S4b, t1: C5, set: 'store', lt: STORE, at: V(0, 0, -3), act: t => act4(t),
    cam: (t, u) => hand(camAt(V(lerp(.42, .32, u), 1.35, lerp(-.2, -.5, eio(u))), V(.38, 1.1, -3.25), 46, 2.9, 4), t) },
  // 5a · every cup he could find: the cart train, the camera racing backwards ahead of it
  { t0: C5, t1: S5b, set: 'store', lt: STORE, at: V(0, 0, -6), act: t => act5(t), after: 1, fpv: .35,
    cam: (t, u) => { const z = carts[0].position.z; return hand(camAt(V(.5, lerp(1.5, 1.3, u), z - 3.2), V(-.05, .9, z + 1.4), 50, 4.0, 4), t); } },
  // 5b · 12,150!: the cashier's face
  { t0: S5b, t1: C6, set: 'store', lt: STORE, at: V(0, 0, -14), act: t => act5(t),
    cam: (t, u) => hand(camAt(V(lerp(.7, .1, eio(u)), lerp(1.35, 1.25, u), lerp(-13.6, -15.0, eio(u))), V(-.4, 1.22, -16.3), lerp(46, 40, u), lerp(2.9, 1.35, eio(u)), 5), t) },
  // 6a · the problem: 12,000 labels; he peels in the garage
  { t0: C6, t1: S6b, set: 'sub', lt: GARAGE, at: V(3, 0, -3), act: t => act6(t),
    cam: (t, u) => hand(camAt(V(lerp(2.0, 2.3, u), lerp(1.75, 1.8, u), lerp(.95, .05, eio(u))), V(2.62, lerp(1.6, 1.72, u), -1.5), 46, lerp(2.5, 1.6, u), 4), t) },
  // 6b · …before the deadline: whip to the clock, then back to his face
  { t0: S6b, t1: C7, set: 'sub', lt: GARAGE, at: V(3, 0, -3), act: t => act6(t), fpv: .4,
    cam: (t, u) => { const k = eio(seg(t, S6b, S6b + .35)), b = eio(seg(t, C7 - .55, C7 - .1)), ck = V(4.6, 2.3, -4.86), face = headOf(dv);
      const clockCam = camAt(V(lerp(2.6, 4.0, k), lerp(1.2, 2.1, k), lerp(.7, -3.2, k)), V(lerp(2.75, 4.6, k), lerp(1.0, 2.3, k), lerp(-1.7, -4.86, k)), 44, 1.7, 5);
      return b > 0 ? camAt(clockCam.pos.clone().lerp(face.clone().add(V(-.1, .05, .62)), b), clockCam.look.clone().lerp(face, b), 44, lerp(1.7, .62, b), 5) : hand(clockCam, t, .6); } },
  // 7a · his genius move: smug, a wink
  { t0: C7, t1: S7b, set: 'hall', lt: HALL, at: V(-2, 0, 0), act: t => act7(t),
    cam: (t, u) => hand(camAt(V(lerp(-2.15, -2.3, u), 1.24, lerp(2.15, 1.8, eo(u))), V(-2.6, 1.22, 1.0), 40, lerp(1.25, .95, u), 6), t, .8) },
  // 7b · the volunteers peel them for him: a wide orbit
  { t0: S7b, t1: C8, set: 'hall', lt: HALL, at: V(0, 0, -1), act: t => act7(t), dissolveOut: .3,
    cam: (t, u) => { const a = lerp(-.4, .35, eio(u)); return hand(camAt(V(.25 + Math.sin(a) * 3.8, lerp(2.3, 2.05, u), -1.2 + Math.cos(a) * 3.8 + .6), V(.25, .9, -1.4), 50, 4.2, 3), t); } },
  // 8 · 1,250,000 miles, lifetime elite: first class
  { t0: C8, t1: C9, set: 'cabin', lt: CABIN, at: V(.5, 0, 0), act: t => act8(t),
    cam: (t, u) => hand(camAt(V(lerp(.25, .45, u), lerp(1.3, 1.25, u), lerp(2.2, 1.7, eio(u))), V(.78, lerp(1.0, 1.08, u), -.05), 44, lerp(2.4, 1.85, u), 4), t) },
  // 9 · a tax write-off… for the pudding (tilt down to the stamp, back up to him eating; the bin pops: the loop)
  { t0: C9, t1: LOOP, set: 'cabin', lt: CABIN, at: V(.5, 0, 0), act: t => act9(t),
    cam: (t, u) => { const k = eio(seg(t, tTax - .2, tWrite - .02)) - eio(seg(t, tPud9 - .45, tPud9 - .1));
      return hand(camAt(V(lerp(lerp(.3, .38, u), .6, k), lerp(lerp(1.32, 1.28, u), 1.2, k), lerp(lerp(1.38, 1.18, eio(u)), 1.12, k)), V(lerp(.84, .78, k), lerp(1.12, .74, k), lerp(.12, .52, k)), 40, lerp(1.2, .72, k), 5), t, .6); } },
];
SHOTS.push({ ...SHOTS[0], t0: LOOP, t1: DUR + 1, loop: 1 });

// ---------------- acting ----------------
function act1(t) {
  reset(); avalanche(t); show(heroCup);
  put(dv, DV1, -.25);
  const caught = t > 1.55;
  apply(dv, t < .55 ? TP.cheer : caught ? TP.catchCup : mix(TP.cheer, TP.catchCup, seg(t, 1.1, 1.55)), { t, seed: 1, face: t < 1.25 ? 'shock' : 'laugh', look: CAMP });
  heroCup.visible = caught;
}
function act2(t) {
  reset(); avalanche(t + 2.0); jetM.visible = true;
  const p = jetAt(t), d = V(9, 12, 14).sub(V(-3, 30, -62)).normalize();
  jetM.position.copy(p); jetM.lookAt(p.clone().add(d)); jetM.rotateY(-Math.PI / 2); jetM.rotateX(-.05);
  put(dv, DV2, .3);
  apply(dv, t < tMillion - .3 ? TP.catchCup : TP.cheer, { t, seed: 1, face: t > tMillion - .3 ? 'laugh' : 'happy', look: t < tMillion - .45 ? CAMP : jetM.position });
  show(heroCup);
}
function act3(t) {
  reset(); SET.store.userData.pud.visible = true;
  const st = SET.store.userData.standee; st.rotation.z = Math.sin(t * 2.4) * .015;
  put(cash, V(-.4, 0, -16.3), 0); apply(cash, TP.stand, { t, seed: 5, face: 'calm' });
}
function act4(t) {
  reset(); SET.store.userData.pud.visible = true; scTable.visible = true; show(calc);
  put(dv, V(-.1, 0, -3.15), .25);
  const tip = eo(seg(t, tWay - .12, tWay + .18)), tilt = t < tMiles4 ? Math.sin(t * 3) * .05 : lerp(.12, -.42, tip) + .04 * Math.sin((t - tWay) * 12) * Math.exp(-Math.max(0, t - tWay) * 4) * (t > tWay ? 1 : 0);
  scale.userData.tilt(tilt);
  tagL.position.set(-.62, 1.22 - tilt * .62, .12); tagR.position.set(.62, 1.22 + tilt * .62, .12); tagL.lookAt(CAMP); tagR.lookAt(CAMP);
  const lookScale = t > tMiles4 - .2;
  apply(dv, lookScale ? mix(TP.calc, TP.stand, .4) : TP.calc, { t, seed: 1, face: t > tWay ? 'laugh' : lookScale ? 'shock' : t > tMath ? 'smug' : 'calm', look: lookScale ? V(.62, 1.1, -3.3) : CAMP, eyes: lookScale ? [.5, 0] : [0, -.4] });
  if (!lookScale) twitch(dv, t, .05);
  calc.userData.display.userData.redraw([{ text: t < tDavid ? '0.25' : t < tMath ? '500÷10' : '= 50 MI', size: 62, y: 60, color: '#1C2A1C' }], { w: 280, h: 100, bg: '#B8D8A8' });
  put(cash, V(-.4, 0, -16.3), 0); apply(cash, TP.stand, { t, seed: 5 });
}
const CZ0 = 3.2, CZ1 = -13.7;
function act5(t) {
  reset(); SET.store.userData.pud.visible = false;
  if (t < S5b) {
    const u = seg(t, C5 - .2, S5b + .4), z = lerp(CZ0, CZ1 + 1.8, eio(u) * .95 + u * .05);
    carts.forEach((c, i) => { c.visible = true; c.position.set(-.05 + Math.sin(i * 1.7 + t * 3) * .03, 0, z - .2 - i * 1.0); c.rotation.y = Math.PI + Math.sin(i + t * 2) * .02; });
    put(dv, V(-.05, 0, z + .78), Math.PI); apply(dv, walk(TP.push, (CZ0 - z) * 1.6, 1), { t, seed: 1, face: 'laugh', look: CAMP });
  } else {
    carts.forEach((c, i) => { c.visible = true; c.position.set(i ? 9 : -1.25, 0, -14.4); c.rotation.y = Math.PI * .9; });
  }
  put(cash, V(-.4, 0, -16.3), 0);
  const shock = t >= t12150 - .08;
  apply(cash, shock ? mix(TP.stand, TP.shrug, .8) : TP.stand, { t, seed: 5, face: shock ? 'shock' : 'calm', look: t >= S5b ? CAMP : V(0, 1.2, -10) });
}
function act6(t) {
  reset(); show(heroCup);
  const clock = SET.sub.userData.clock; clock.userData.hands[0].rotation.z = -t * 1.2; clock.userData.hands[1].rotation.z = -t * 14;
  const p = V(2.6, 0, -1.5); p.y = HH(p.x, p.z) - .44;
  put(dv, p, .1);
  apply(dv, TP.sitPeel, { t, seed: 1, face: t > tDeadline - .1 ? 'shock' : t > tProblem - .1 ? 'worried' : 'calm', look: CAMP, eyes: [0, -.5] });
  twitch(dv, t, .05);
}
function act7(t) {
  reset();
  [[v1, -1.2, -3.2], [v2, .6, -3.2], [v3, -.4, -1.0]].forEach(([v, x, z], i) => { put(v, V(x, 0, z), 0); apply(v, TP.peel, { t, seed: 20 + i, face: i === 1 ? 'laugh' : 'happy' }); twitch(v, t + i, .2); });
  flyLab.visible = t >= S7b;
  if (flyLab.visible) {
    const src = [V(-1.2, .95, -2.85), V(.6, .95, -2.85), V(-.4, .95, -.65)], dst = V(1.55, .85, .7);
    for (let i = 0; i < 500; i++) {
      const s = src[i % 3], t0 = S7b + (i / 500) * (C8 - S7b) * .95, k = (t - t0) / .7;
      if (k < 0 || k > 1) { setInst(flyLab, i, 0, -20, 0); continue; }
      setInst(flyLab, i, lerp(s.x, dst.x, k), lerp(s.y, dst.y, k) + Math.sin(k * Math.PI) * 1.1, lerp(s.z, dst.z, k), k * 9 + i, k * 6, k * 7 + i);
    }
    flyLab.instanceMatrix.needsUpdate = true;
  }
  if (t < S7b) { put(dv, V(-2.6, 0, 1.0), .45); apply(dv, TP.think, { t, seed: 1, face: t > tGenius ? 'smug' : 'calm', look: CAMP, noBlink: 1, wink: t > tGenius + .25 && t < tGenius + .75 }); }
  else { show(boxP); put(dv, V(.95, 0, .35), -.7); apply(dv, walk(TP.carry, t * 7, .4), { t, seed: 1, face: 'laugh', look: V(0, 1.1, -2) }); }
}
function act8(t) {
  reset(); show(card);
  put(dv, V(.85, .06, -.02), 0); apply(dv, t < tLifetime ? TP.sitRelax : mix(TP.sit, TP.sitRelax, .2), { t, seed: 1, face: t < tLifetime ? 'smug' : 'proud', look: t < tLifetime ? CAMP : headOf(att) });
  binLid.rotation.x = 0;
  const giving = t > tLifetime - .3;
  put(att, V(.08, 0, .55), 2.05); apply(att, giving ? TP.offer : TP.stand, { t, seed: 9, face: 'happy', look: headOf(dv) });
  card.visible = giving;
}
const _qa = new THREE.Quaternion();
function act9(t) {
  reset(); show(spn, eatCup);
  const stamp = t >= tWrite - .05 ? 1 : 0; if (stamp !== form.userData.st) { form.userData.redraw(stamp); form.userData.st = stamp; }
  const eat = t > tPud9 - .5;
  put(dv, V(.85, .06, -.02), 0); apply(dv, eat ? TP.sitEat : TP.sitRelax, { t, seed: 1, face: eat ? 'happy' : 'smug', wink: t > tPud9 && t < tPud9 + .5, look: t > tWrite - .2 && !eat ? V(.85, .74, .55) : CAMP });
  spn.visible = eat; eatCup.visible = eat; trayCup.visible = !eat;
  if (eat) {   // the cup upright in his left hand, the spoon between the cup and his mouth
    const sp = .5 + .5 * Math.sin((t - tPud9) * 7 - 1.2);
    dv.aR.el.rotation.x -= sp * .25; dv.P.updateMatrixWorld(true);
    dv.propsL.getWorldQuaternion(_qa); eatCup.quaternion.copy(_qa.invert());
    eatCup.position.copy(dv.propsL.worldToLocal(dv.propsL.getWorldPosition(V(0, 0, 0)).add(V(0, -.055, .015))));
    const Hh = dv.props.getWorldPosition(V(0, 0, 0)), mouth = dv.head.localToWorld(V(0, -.07, .19)), cupTop = eatCup.getWorldPosition(V(0, 0, 0)).add(V(0, .1, 0));
    const d = cupTop.lerp(mouth, sp).sub(Hh).normalize(); dv.props.getWorldQuaternion(_qa); d.applyQuaternion(_qa.invert()); spn.quaternion.setFromUnitVectors(V(0, -1, 0), d);
  }
  binLid.rotation.x = -1.6 * eo(seg(t, RAIN - .15, RAIN + .1));
  if (t > RAIN - .15) avalanche(t - RAIN + .1, 'bin');
}

// ---------------- sound events (the score reads these) ----------------
ev(0, 'avalanche'); ev(.12, 'pop'); ev(1.55, 'catch');
ev(C2 + .05, 'jet'); ev(tMillion, 'sting');
ev(C3 - .05, 'whoosh'); ev(t1999, 'pop'); ev(tBarcode, 'beep');
ev(C4, 'cut'); for (let tt = tDavid - .3; tt < tMath; tt += .16) ev(tt, 'key'); ev(tDavid, 'pop'); ev(S4b, 'cut'); ev(tWay - .05, 'clang');
ev(C5 - .05, 'whoosh'); for (let tt = C5 + .1; tt < S5b; tt += B / 2) ev(tt, 'rattle'); ev(S5b, 'cut'); ev(t12150 - .05, 'register');
ev(C6, 'cut'); for (let tt = C6; tt < C7 - .05; tt += B / 2) ev(tt, 'tick'); ev(tPeel - .1, 'peel'); ev(S6b, 'whoosh'); ev(tDeadline, 'stamp'); ev(C7 - .5, 'whoosh');
ev(C7, 'cut'); ev(tGenius + .25, 'ding'); ev(S7b, 'whoosh'); for (let tt = S7b + .1; tt < C8 - .1; tt += .11) ev(tt, 'peelfast');
ev(C8, 'whoosh'); ev(t125, 'sting'); ev(tLifetime, 'sparkle');
ev(C9, 'cut'); ev(tWrite - .05, 'stamp'); ev(tPud9 + .1, 'slurp'); ev(RAIN - .12, 'binpop'); ev(RAIN, 'avalanche');

// ---------------- the overlay: telops + counters + 1–3 word captions ----------------
const ov = document.getElementById('ov').getContext('2d');
const snap = document.createElement('canvas'); snap.width = W; snap.height = H; const sctx = snap.getContext('2d');
const num = n => Math.round(n).toLocaleString('en-US');
const TEL = [
  { t0: -1, t1: C2, text: '12,000 PUDDING CUPS', y: 300, size: 92, col: '#FFD23F', rot: -4, plate: '#6B3A22' },
  { t0: tTurned, t1: C3, text: t => num(1000000 * eo(seg(t, tTurned, tMillion))) + '+ MILES', y: 300, size: 100, col: '#FFFFFF', rot: 3, plate: '#1C4E9A' },
  { t0: t1999, t1: tBarcode + .3, text: '1999', y: 300, size: 170, col: '#FFD23F', rot: -5 },
  { t0: tDavid - .05, t1: S4b + .3, text: 'DAVID PHILLIPS', y: 1440, size: 80, col: '#FFFFFF', rot: -3, plate: '#3E7CC0', sub: 'ENGINEER' },
  { t0: tWay - .05, t1: C5, text: 'WORTH WAY MORE!', y: 250, size: 100, col: '#7BE07B', rot: -5 },
  { t0: tBought, t1: C6, text: t => num(t < t12150 ? 12150 * eo(seg(t, tBought, t12150)) : 12150), y: 300, size: 170, col: '#FFD23F', rot: -4, sub: 'PUDDING CUPS' },
  { t0: tProblem - .05, t1: C7, text: '12,000 LABELS TO PEEL', y: 300, size: 80, col: '#FFFFFF', rot: 3, plate: '#C8283A' },
  { t0: tDeadline - .05, t1: C7, text: 'DEADLINE!', y: 470, size: 120, col: '#FFD23F', rot: -6, stamp: 1 },
  { t0: tGenius - .05, t1: S7b + .6, text: 'GENIUS MOVE', y: 300, size: 120, col: '#FFD23F', rot: -5 },
  { t0: t125 - .05, t1: C9, text: t => num(t < tLifetime - .2 ? 1250000 * eo(seg(t, t125 - .05, t125 + .9)) : 1250000) + ' MILES', y: 300, size: 92, col: '#FFFFFF', rot: -3, plate: '#1C4E9A' },
  { t0: tLifetime - .05, t1: C9, text: 'LIFETIME ELITE', y: 1470, size: 92, col: '#FFFFFF', rot: 4, plate: '#C9971E' },
  { t0: tTax - .05, t1: LOOP, text: '+ TAX WRITE-OFF', y: 300, size: 96, col: '#7BE07B', rot: -4, plate: '#1C3A2A' },
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
TM.lines.forEach((l, li) => { let cur = []; const flush = () => { if (cur.length) chunks.push({ li, words: cur }); cur = []; };
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
  WORLD.userData.wheel.rotation.z = -t * .12; WORLD.userData.wheel.children.forEach(o => { if (o.userData.a !== undefined) o.rotation.z = t * .12; });
  let c = sh.after ? null : sh.cam(tt, u); if (c) CAMP.copy(c.pos);
  sh.act(tt);
  if (!c) { c = sh.cam(tt, u); CAMP.copy(c.pos); }
  if (sh === SHOTS[2]) { const k = Math.exp(-Math.pow((tt - tMillion) / .5, 2)) * .012; c.pos.x += Math.sin(tt * 61) * k; c.pos.y += Math.sin(tt * 47) * k; }
  camera.position.copy(c.pos); camera.up.set(0, 1, 0); camera.lookAt(c.look); camera.rotateZ(c.roll ?? 0); camera.fov = c.fov; camera.updateProjectionMatrix();
  WORLD.userData.clouds.position.x = camera.position.x; WORLD.userData.clouds.position.z = camera.position.z;
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
  if (QS.get('poster')) { ov.clearRect(0, 0, W, H); [['HE BOUGHT 12,000', 170, -4, '#FFFFFF'], ['PUDDING CUPS…', 320, -4, '#FFD23F']].forEach(([text, y, rot, col]) => drawTelop({ t0: -9, text, y, size: 124, col, rot }, t)); return; }
  if (QS.get('clean')) return;
  if (t < LOOP) { TEL.forEach(x => { if (t >= x.t0 && t < x.t1) drawTelop(x, t); }); drawCaption(t); }
}
function texts(t) { if (t >= LOOP) return []; return TEL.filter(x => typeof x.text === 'string' && t >= x.t0 + .3 && t < x.t1).map(x => ({ id: x.text, text: x.text, x0: 60, y0: x.y - x.size * .7, x1: 1020, y1: x.y + x.size * .7 })); }
EV.sort((a, b) => a.t - b.t);
window.DUR = +(B0 - A0).toFixed(3); window.EV = EV; window.render = t => render(t + A0); window.TEXTS = t => texts(t + A0);
render(A0);
window.READY = true;
