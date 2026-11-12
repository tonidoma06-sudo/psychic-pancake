// "Pepsi, where's my jet?" · 3D vertical Short (1080×1920) in style v4 (toon cast, rich world, restless camera).
// Every shot, action, telop and caption is placed from timing.json (the voice). render(t) is a pure function of t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { makePost } from '/core/three/post.js';
import { makeToon, apply, TP, mix, walk } from './toon.js';
import { park } from './world.js';
import { jet, school, room, couch, tv, coffeeTable, sodaCan, catalog, magnifier, moneyBag, cashStack, bigCheck, envelope, gavel, folder, letter, desk, bench, seal, stampMark, priceTag } from './sets.js';
import { skyDome } from './sky.js';

const W = 1080, H = 1920;
await document.fonts.load('900 80px Montserrat'); await document.fonts.load('800 80px Montserrat');
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
const camera = new THREE.PerspectiveCamera(45, W / H, .03, 1200);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, ao: !QS.get('noao') && false, aoRadius: .5, aoThickness: 1, aoScale: 1.4, aoAmt: .5 });
post.bloom.strength = .2; post.bloom.threshold = .95; post.bloom.radius = .5;
const vg = post.vig.uniforms; vg.amt.value = .22; vg.sat.value = 1.2; vg.contrast.value = .12;
const zb = new ShaderPass({ uniforms: { tDiffuse: { value: null }, amt: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: 'uniform sampler2D tDiffuse; uniform float amt; varying vec2 vUv; void main(){ vec2 d = vUv - .5; vec4 s = vec4(0.); for (int i = 0; i < 14; i++) { float k = 1. - amt * float(i) / 13. * length(d) * 2.; s += texture2D(tDiffuse, .5 + d * k); } gl_FragColor = s / 14.; }' });
post.composer.insertPass(zb, 1);
const sun = new THREE.DirectionalLight('#FFF4E0', 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
scene.add(sun, sun.target); const hemi = new THREE.HemisphereLight('#BFDFFF', '#6AA040', 1); scene.add(hemi);
const sky = skyDome('#2F7FE0', '#BFE3FA', V(-.4, .5, .6), '#FFF6D8'); scene.add(sky);
const lamp = new THREE.PointLight('#FFD9A8', 0, 7, 1.6); scene.add(lamp);
const OUT = { pos: [-18, 30, 16], col: '#FFF4E0', int: 3.1, hs: '#BFDFFF', hg: '#6AA040', hemi: 1.0, fog: ['#CFE8F7', 60, 260], sky: 1, env: .35, r: 14 };
const LIVING = { pos: [3, 9, 6], col: '#FFE8C8', int: 2.2, hs: '#FFF2DC', hg: '#8A6A4A', hemi: 1.15, env: .3, r: 6, lamp: 1.2, lampAt: [-2.4, 2.2, -1.5], warm: .12 };
const OFFICE = { pos: [-4, 9, 5], col: '#F4F8FF', int: 2.2, hs: '#E8F0FF', hg: '#6A5A4A', hemi: 1.15, env: .35, r: 6, warm: 0 };
const COURT = { pos: [4, 10, 6], col: '#FFEBD0', int: 2.0, hs: '#FFF0DA', hg: '#6A4A2A', hemi: 1.1, env: .3, r: 8, warm: .12 };
let WORLD;
function light(o, at) {
  sun.color.set(o.col); sun.intensity = o.int; sun.position.set(at.x + o.pos[0], at.y + o.pos[1], at.z + o.pos[2]); sun.target.position.copy(at);
  const c = sun.shadow.camera, r = o.r ?? 10; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 1; c.far = 120; c.updateProjectionMatrix();
  hemi.color.set(o.hs); hemi.groundColor.set(o.hg); hemi.intensity = o.hemi;
  scene.fog = o.fog ? new THREE.Fog(o.fog[0], o.fog[1], o.fog[2]) : null; sky.visible = !!o.sky; scene.background = o.sky ? null : new THREE.Color('#E8E0D0');
  WORLD.visible = !!o.sky; scene.environmentIntensity = o.env ?? .35; vg.warm.value = o.warm ?? .1;
  lamp.intensity = o.lamp ?? 0; if (o.lampAt) lamp.position.set(at.x + o.lampAt[0], at.y + o.lampAt[1], at.z + o.lampAt[2]);
}

// ---------------- sets ----------------
WORLD = park({ clear: [[0, -8, 24], [-14, 10, 8]], cx: 0, cz: 19, tuftR: 9, bunting: [], fenceX: 19, pathX: 400, wheelX: -46, wheelZ: -70, tents: [[-26, -56, 1], [-16, -64, 1.3], [30, -58, 1.1]] });
scene.add(WORLD);
const SCH = school(); scene.add(SCH);
const JET = jet(); scene.add(JET);
const LR0 = V(300, 0, 0), OF0 = V(400, 0, 0), CT0 = V(500, 0, 0);
const LIV = room({ name: 'living', w: 7, d: 6.5, h: 3.0, wall: 'stripes', wallA: '#E8D8B0', wallB: '#DCC898', window: [-2.0, 1.7, 1.8, 1.3] }); LIV.position.copy(LR0); scene.add(LIV);
const sofa = couch('#C8643C'); sofa.position.set(0, 0, 1.6); sofa.rotation.y = Math.PI; LIV.add(sofa);   // facing the TV
const TV = tv(); TV.position.set(0, 0, -2.6); LIV.add(TV);
const tbl = coffeeTable(); tbl.position.set(0, 0, .45); LIV.add(tbl);
const CAT = catalog(); CAT.rotation.set(-Math.PI / 2, 0, .12); CAT.position.set(-.18, .456, .45); LIV.add(CAT);
const MAG = magnifier(); MAG.rotation.set(-Math.PI / 2 + .2, 0, 0); LIV.add(MAG);
for (const [x, z] of [[.3, .35], [.42, .55]]) { const c = sodaCan(); c.position.set(x, .45, z); LIV.add(c); }
const bowl = new THREE.Mesh(new THREE.SphereGeometry(.13, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshToonMaterial({ color: '#E84A3A' })); bowl.rotation.x = Math.PI; bowl.position.set(.32, .58, .62); LIV.add(bowl);
{ const lampG = new THREE.Group(); lampG.position.set(-2.4, 0, -1.5); LIV.add(lampG); lampG.add(new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.5, 8), new THREE.MeshStandardMaterial({ color: '#C8A04A', metalness: .5 }))).position.y = .75; const sh = new THREE.Mesh(new THREE.ConeGeometry(.3, .35, 20, 1, true), new THREE.MeshStandardMaterial({ color: '#F4E8C8', emissive: '#FFD9A0', emissiveIntensity: .5, side: THREE.DoubleSide })); sh.position.y = 1.55; lampG.add(sh); }
for (const [x, y, c] of [[1.6, 1.9, '#3A6A9A'], [2.5, 1.7, '#9A4A3A']]) { const f = new THREE.Mesh(new THREE.BoxGeometry(.6, .45, .04), new THREE.MeshStandardMaterial({ color: '#6B4A2E' })); f.position.set(x, y, -3.23); LIV.add(f); const pic = new THREE.Mesh(new THREE.PlaneGeometry(.5, .35), new THREE.MeshStandardMaterial({ color: c })); pic.position.set(x, y, -3.205); LIV.add(pic); }
const OFF = room({ name: 'office', w: 7, d: 6, h: 3.2, wall: 'panel', wallA: '#6B4A2E', floor: 'carpet', floorC: '#3A4A6A', window: [0, 1.8, 3.4, 1.8], city: 1 }); OFF.position.copy(OF0); scene.add(OFF);
const DSK = desk(); DSK.position.set(0, 0, -.6); OFF.add(DSK);
const LET = letter(); scene.add(LET); const NO = stampMark('NO'); LET.add(NO); NO.position.z = .002; NO.rotation.z = -.25;
const CRT = room({ name: 'court', w: 10, d: 9, h: 4.2, wall: 'panel', wallA: '#7A4A2A', floor: 'wood' }); CRT.position.copy(CT0); scene.add(CRT);
const BEN = bench(); BEN.position.set(0, 0, -2.6); CRT.add(BEN);
const SEAL = seal(); SEAL.position.set(0, 2.9, -4.47); CRT.add(SEAL);
for (const [x, c] of [[-2.2, '#2E5AA8'], [2.2, '#C8283A']]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 2.6, 8), new THREE.MeshStandardMaterial({ color: '#C8A04A', metalness: .6 })); pole.position.set(x, 1.3, -4.1); CRT.add(pole); const fl = new THREE.Mesh(new THREE.PlaneGeometry(.7, 1.0), new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide })); fl.position.set(x + .36, 2.1, -4.1); CRT.add(fl); }
const tables = []; for (const x of [-1.05, 1.05]) { const d = desk('#7A4A26'); d.scale.set(.8, .95, .7); d.position.set(x, 0, .8); d.rotation.y = Math.PI; CRT.add(d); tables.push(d); }
for (let r = 0; r < 2; r++) for (const x of [-2.4, 2.4]) { const b = new THREE.Mesh(new THREE.BoxGeometry(3, .5, .5), new THREE.MeshStandardMaterial({ color: '#7A4A26' })); b.position.set(x, .25, 2.6 + r * 1.2); b.castShadow = true; CRT.add(b); const bb = new THREE.Mesh(new THREE.BoxGeometry(3, .7, .08), new THREE.MeshStandardMaterial({ color: '#6B3A1E' })); bb.position.set(x, .65, 2.85 + r * 1.2); CRT.add(bb); }

// ---------------- cast ----------------
const JOHN = { name: 'john', top: '#D9443A', pants: '#3C5E9A', outfit: 'hoodie', hair: 'messy', hairC: '#5A3A22', patch: '#F2C230', blush: 1 };
const john = makeToon(JOHN); scene.add(john.P);
const exec = makeToon({ name: 'exec', top: '#22325E', outfit: 'suit', hair: 'slick', hairC: '#1A1620', tie: '#D9302A', pocketSq: '#F4F1EA', glasses: 'round', shoe: '#1A1A1E' }); scene.add(exec.P);
const judge = makeToon({ name: 'judge', top: '#1A1820', outfit: 'robe', hair: 'messy', hairC: '#BDB8B0', glasses: 'round', H: 1.08 }); scene.add(judge.P);
const kids = [{ top: '#3EB24A', hair: 'beanie', hatC: '#2E7FE0' }, { top: '#F2C230', hair: 'messy', hairC: '#2A1A12' }, { top: '#8A5AC8', hair: 'messy', hairC: '#E8B048' }].map((k, i) => { const p = makeToon({ name: 'kid' + i, outfit: 'tee', pants: '#2E3A5A', H: .92, ...k }); scene.add(p.P); return p; });
const INV = [['#6A6A72', 'shades'], ['#7A5A3A', null], ['#2E6A4A', 'shades'], ['#7A2A3A', null]].map(([c, gl], i) => { const p = makeToon({ name: 'inv' + i, top: c, outfit: 'suit', hair: i % 2 ? 'slick' : 'messy', hairC: ['#2A1A12', '#1A1620', '#7A5A3A', '#1A1620'][i], tie: ['#F2C230', '#2E7FE0', '#E84A3A', '#F4F1EA'][i], glasses: gl }); scene.add(p.P); return p; });
const CAST = [john, exec, judge, ...kids, ...INV];
// props
const can = sodaCan(); can.scale.setScalar(1.6); john.props.add(can);
const cashL = cashStack(), cashR = cashStack(); john.propsL.add(cashL); john.props.add(cashR); for (const c of [cashL, cashR]) { c.scale.setScalar(1.6); c.rotation.set(0, 0, Math.PI / 2); }
const bag7 = moneyBag('$'); bag7.scale.setScalar(.6); john.props.add(bag7);
const BAGS = INV.map(() => { const b = moneyBag('$'); b.scale.setScalar(.85); scene.add(b); return b; });
const CHK = bigCheck(); john.props.add(CHK);
const ENV = envelope(); scene.add(ENV);
const SUIT = folder('LAWSUIT'); SUIT.scale.setScalar(1.5); john.props.add(SUIT);
const GAV = gavel(); judge.props.add(GAV);
const TAG = priceTag('$30M+'); scene.add(TAG);
const PROPS = [can, cashL, cashR, bag7, CHK, SUIT, GAV, LET, ENV, TAG, ...BAGS];
const dust = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.25, 1), new THREE.MeshStandardMaterial({ color: '#C8C0B0', roughness: 1, transparent: true, opacity: .55, depthWrite: false }), 60); scene.add(dust);

// ---------------- key times (from the voice) ----------------
const C2 = cut('L2'), C3 = cut('L3'), C4 = cut('L4'), C5 = cut('L5'), C6 = cut('L6'), C7 = cut('L7'), C8 = cut('L8'), C9 = cut('L9');
const tPepsi1 = w('L1', 'pepsi'), tFighter = w('L1', 'fighter'), tMoney = w('L2', 'money');
const tHarrier = w('L3', 'harrier'), t7m = w('L3', '7000000'), tJoke = w('L4', 'joke'), tBut = w('L4', 'but'), tBuy = w('L4', 'buy'), t10c = w('L4', '10');
const t700k = w('L5', '700000'), tFor5 = w('L5', 'for'), t30m = w('L5', '30');
const tInvest = w('L6', 'investors'), tMailed = w('L6', 'mailed'), tCheck = w('L6', 'check');
const tNo = w('L7', 'no'), tSued = w('L7', 'sued');
const tReason = w('L8', 'reasonable'), tJet8 = w('L8', 'fighter') - .02;
const tChanged = w('L9', 'changed'), t700m = w('L9', '700000000'), tKid = w('L9', 'just');
const S1b = 1.25, S3b = t7m - .12, S4b = tBut - .08, S4c = t10c + .25, S5b = tFor5 - .1, S6b = tMailed - .25, S7b = tSued - .45, S8b = 26.6, S9b = tKid + .4;

// ---------------- camera language ----------------
const CAMP = new THREE.Vector3(0, 1.5, 6);
const camAt = (pos, look, fov = 45, focus, aper = 4, roll = 0) => ({ pos, look, fov, focus: focus ?? pos.distanceTo(look), aper, roll });
const hand = (c, t, a = 1) => { c.pos.x += noise(t, 1) * .012 * a; c.pos.y += noise(t, 2) * .01 * a; c.look.x += noise(t, 3) * .02 * a; c.look.y += noise(t, 4) * .016 * a; return c; };
const L = (o, x, y, z) => V(o.x + x, o.y + y, o.z + z);
const JP = V(0, 0, -4), JRY = -.45;   // the jet's landing spot and heading
const jetY = t => 1.34 + 2.6 * (1 - eo(seg(t, -.2, 1.7)));
const jetW = (x, y, z, t = 2) => { const v = V(x, y, z).applyAxisAngle(V(0, 1, 0), JRY); return V(JP.x + v.x, jetY(t) + v.y, JP.z + v.z); };
const cockpit = t => jetW(0, .52, 2.6, t);
const MBX = V(-12.5, 0, 3.5), JOHN6 = V(-10, 0, 4.2);
// the FPV rush round the jet (1b): from the low hook angle, swinging round the nose, up to the cockpit
const fp1 = t => { const k = eio(seg(t, S1b, C2 - .15)); const a = lerp(2.4, .6, k), r = lerp(9.5, 3.0, k), cp = cockpit(t);
  const pos = V(cp.x + Math.sin(a + JRY) * r, lerp(1.6, cp.y + .55, k), cp.z + Math.cos(a + JRY) * r); return camAt(pos, cp.clone().add(V(0, lerp(-.5, .3, k), 0)), lerp(54, 46, k), r, 4, Math.sin(k * Math.PI) * -.1); };
const SHOTS = [
  // 1a · the hook: a fighter jet drops into the school car park
  { t0: 0, t1: S1b, lt: OUT, at: JP, act: t => act1(t),
    cam: (t, u) => hand(camAt(V(-2.5 + u * .4, .7, 4.6 - u * .4), V(-.2, lerp(3.6, 2.6, eo(u)), -4), 60, 9, 3), t, 1.4) },
  // 1b · FPV round the jet to the cockpit: he pops the canopy, can in hand
  { t0: S1b, t1: C2, lt: OUT, at: JP, act: t => act1(t), cam: fp1, fpv: 1 },
  // 2 · he actually had the money: on the wing, fanning cash
  { t0: C2, t1: C3, lt: OUT, at: JP, act: t => act2(t), dissolveOut: .3,
    cam: (t, u) => { const p = jetW(2.0, .62, -.3), a = lerp(-.7, -.15, eio(u)) + JRY, r = lerp(2.4, 1.7, eo(u)); return hand(camAt(V(p.x + Math.sin(a) * r, p.y + lerp(.35, .8, u), p.z + Math.cos(a) * r), V(p.x, p.y + 1.0, p.z), 48, r, 4), t); } },
  // 3a · the ad on TV: over his shoulder, pushing into the screen
  { t0: C3, t1: S3b, lt: LIVING, at: LR0, act: t => act3(t),
    cam: (t, u) => hand(camAt(L(LR0, lerp(.55, .12, eio(u)), lerp(1.35, 1.05, eio(u)), lerp(2.6, -.05, eio(u))), L(LR0, -.04, .96, -2.6), lerp(46, 40, u), lerp(5.2, 2.2, eio(u)), 4), t, .7) },
  // 3b · reverse: his face on "seven MILLION"
  { t0: S3b, t1: C4, lt: LIVING, at: LR0, act: t => act3(t),
    cam: (t, u) => hand(camAt(L(LR0, lerp(.15, .05, u), lerp(1.12, 1.05, u), lerp(-.25, .45, eo(u))), L(LR0, 0, 1.27, 1.55), lerp(44, 40, u), lerp(1.85, 1.15, eo(u)), 5), t, .8) },
  // 4a · "it was a joke": he laughs at the TV (low, arcing)
  { t0: C4, t1: S4b, lt: LIVING, at: LR0, act: t => act4(t),
    cam: (t, u) => { const a = lerp(.6, .1, eio(u)); return hand(camAt(L(LR0, Math.sin(a) * 1.5, lerp(1.3, 1.22, u), 1.5 - Math.cos(a) * 1.5), L(LR0, 0, 1.12, 1.5), 48, 1.5, 4), t); } },
  // 4b · the small print: top-down over the catalogue, the highlighter sweeps "10¢ each"
  { t0: S4b, t1: S4c, lt: LIVING, at: LR0, act: t => act4(t),
    cam: (t, u) => { const k = eio(u); return hand(camAt(L(LR0, lerp(-.14, -.15, k), lerp(1.05, .7, k), lerp(1.15, .9, k)), L(LR0, lerp(-.18, -.13, k), .455, lerp(.5, .69, k)), 44, lerp(.85, .32, k), 6), t, .4); } },
  // 4c · his scheming grin
  { t0: S4c, t1: C5, lt: LIVING, at: LR0, act: t => act4(t),
    cam: (t, u) => hand(camAt(L(LR0, .05, 1.3, lerp(.75, .55, eo(u))), L(LR0, 0, 1.28, 1.55), 42, lerp(.82, 1.0, u), 5), t, .8) },
  // 5a · $700,000…: his little bag in front of the jet
  { t0: C5, t1: S5b, lt: OUT, at: JP, act: t => act5(t),
    cam: (t, u) => { const p = V(-1.9, 0, 3.2); return hand(camAt(V(p.x + lerp(.85, .6, u), lerp(1.05, 1.15, u), p.z + lerp(1.5, 1.15, u)), V(p.x, lerp(1.0, 1.1, u), p.z), 46, 1.5, 5), t); } },
  // 5b · …for a jet worth over $30 million: crane up the jet to the price tag
  { t0: S5b, t1: C6, lt: OUT, at: JP, act: t => act5(t),
    cam: (t, u) => { const k = eio(seg(t, S5b, t30m + .1)); return hand(camAt(V(lerp(-1.2, -3.6, k), lerp(1.0, 2.6, k), lerp(4.8, 7.6, k)), V(lerp(-1.6, -.5, k), lerp(1.1, 2.0, k), lerp(3.0, -2.0, k)), lerp(48, 52, k), lerp(1.7, 9, k), 3), t); } },
  // 6a · the investors: money bags fly into his arms
  { t0: C6, t1: S6b, lt: OUT, at: JOHN6, act: t => act6(t),
    cam: (t, u) => { const a = lerp(-.35, .25, eio(u)), r = lerp(4.3, 3.5, u); return hand(camAt(V(JOHN6.x + Math.sin(a) * r, lerp(1.3, 1.45, u), JOHN6.z + Math.cos(a) * r), V(JOHN6.x, 1.0, JOHN6.z - .4), 52, r, 4), t); } },
  // 6b · the giant check goes in the mailbox… and the envelope rockets off
  { t0: S6b, t1: C7, lt: OUT, at: MBX, act: t => act6(t), fpv: .5, after: 1,
    cam: (t, u) => { const k = eio(seg(t, tCheck - .2, C7)); const base = V(MBX.x + 1.6, 1.35, MBX.z - .02), jf = V(MBX.x + .2, 1.12, MBX.z + .36), up = ENV.position.clone(); return hand(camAt(base.clone().lerp(V(MBX.x + 1.7, 1.2, MBX.z + .3), k), jf.clone().lerp(up, k), lerp(50, 56, k), 1.5, 4), t, 1.2); } },
  // 7a · Pepsi said no: the exec laughs… and stamps it NO
  { t0: C7, t1: S7b, lt: OFFICE, at: OF0, act: t => act7(t),
    cam: (t, u) => hand(camAt(L(OF0, lerp(.6, .25, eio(u)), lerp(1.3, 1.25, u), lerp(1.4, .6, eio(u))), L(OF0, .02, 1.12, -1.2), 44, lerp(2.7, 1.9, u), 4), t) },
  // 7b · so he SUED them: the lawsuit slams toward camera
  { t0: S7b, t1: C8, lt: COURT, at: CT0, act: t => act8(t),
    cam: (t, u) => hand(camAt(L(CT0, -1.05 + lerp(.35, .2, u), lerp(.95, 1.0, u), lerp(-.6, -.25, eo(u))), L(CT0, -1.05, 1.15, 1.45), 50, 1.4, 4), t, 1.3) },
  // 8a · the judge: low push up to the bench
  { t0: C8, t1: S8b, lt: COURT, at: CT0, act: t => act8(t),
    cam: (t, u) => hand(camAt(L(CT0, lerp(.6, .25, eio(u)), lerp(.9, 1.35, eio(u)), lerp(1.6, -.4, eio(u))), L(CT0, 0, lerp(1.7, 1.85, u), -3.0), lerp(48, 42, u), lerp(4.3, 2.6, u), 4), t) },
  // 8b · wide: John shocked, the exec smug, the gavel falls
  { t0: S8b, t1: C9, lt: COURT, at: CT0, act: t => act8(t), dissolveOut: .3,
    cam: (t, u) => hand(camAt(L(CT0, lerp(-.9, .7, eio(u)), lerp(2.45, 2.3, u), lerp(-3.9, -3.6, u)), L(CT0, lerp(-.25, .1, u), 1.05, 1.4), 58, 5.2, 3), t) },
  // 9a · the new ad: the points roll up to 700,000,000… (JUST KIDDING)
  { t0: C9, t1: S9b, lt: LIVING, at: LR0, act: t => act9(t),
    cam: (t, u) => hand(camAt(L(LR0, -.04 + lerp(.25, .04, u), lerp(1.12, 1.0, eo(u)), lerp(.6, .05, eo(u))), L(LR0, -.04, .8, -2.6), 40, lerp(3.1, 2.4, u), 5), t, .5) },
  // 9b · his face: deadpan
  { t0: S9b, t1: LOOP, lt: LIVING, at: LR0, act: t => act9(t),
    cam: (t, u) => hand(camAt(L(LR0, .04, 1.3, lerp(.62, .42, eo(u))), L(LR0, 0, 1.28, 1.55), 42, lerp(.93, 1.13, eo(u)), 6), t, .5) },
];
SHOTS.push({ ...SHOTS[0], t0: LOOP, t1: DUR + 1, loop: 1 });

// ---------------- acting ----------------
const put = (p, v, ry = 0) => { p.P.visible = true; p.P.position.copy(v); p.P.rotation.y = ry; p.P.updateMatrixWorld(true); };
const show = (...ps) => PROPS.forEach(o => o.visible = ps.includes(o));
function reset() { CAST.forEach(p => p.P.visible = false); show(); JET.visible = false; dust.visible = false; LET.visible = false; NO.visible = false; }
const talk = (t, a = 1) => (.5 + .5 * Math.sin(t * 15)) * (.6 + .4 * Math.sin(t * 4.3)) * a;
function placeJet(t, open) {
  JET.visible = true; JET.position.set(JP.x, jetY(t), JP.z); JET.rotation.set(0, JRY, 0);
  const land = eo(seg(t, -.2, 1.7)); JET.userData.body.rotation.set(Math.sin(t * 2.1) * .02 * (1 - land) - .04 * (1 - land), 0, Math.sin(t * 1.6) * .03 * (1 - land));
  JET.userData.nozzles.forEach(n => n.rotation.x = -Math.PI / 2 * (1 - land * .0));
  const cp = JET.userData.canopy; const o = clamp(open); cp.position.set(0, .52 + .5 * o, 2.6 - 1.7 * o); cp.rotation.x = -.45 * o;
  JET.updateMatrixWorld(true);
}
function dustRing(t, k) {
  dust.visible = k > .01; if (!dust.visible) return; const _m = new THREE.Matrix4(), _q = new THREE.Quaternion();
  for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2 + hash(i) * .3, ph = (t * .9 + hash(i + 3)) % 1, r = 2.2 + ph * 5.5, s = (1 - ph) * (1.1 + hash(i + 5)) * k; _m.compose(V(JP.x + Math.cos(a) * r, .25 + ph * .6, JP.z + Math.sin(a) * r), _q.identity(), V(s, s * .7, s)); dust.setMatrixAt(i, _m); }
  dust.instanceMatrix.needsUpdate = true;
}
function act1(t) {
  reset(); placeJet(t, seg(t, 1.55, 2.0)); dustRing(t, 1 - seg(t, 1.6, 2.6) * .7);
  // kids in the foreground, shocked
  [[-1.1, 1.3, .4], [1.9, 1.7, -.5], [-3.9, .3, .9]].forEach(([x, z, ry], i) => { put(kids[i], V(x, 0, z), ry); apply(kids[i], mix(TP.stand, TP.cheer, i === 1 ? .35 : .15), { t, seed: 20 + i, face: 'shock', look: JET.position }); });
  // John in the cockpit (body hidden in the fuselage), popping up with a can on "Pepsi!"
  const cp = cockpit(t), up = eo(seg(t, 1.7, 2.1));
  put(john, V(cp.x, cp.y - 1.05 + up * .62, cp.z), JRY + .35); show(can);
  apply(john, t > tPepsi1 - .15 ? mix(TP.stand, TP.cheer, .6) : TP.wave, { t, seed: 1, face: t > 1.8 ? 'laugh' : 'happy', look: CAMP });
}
function act2(t) {
  reset(); placeJet(t + 10, 1); show(cashL, cashR);
  put(john, jetW(2.0, .62, -.3, 9), JRY + .5);
  const fan = Math.sin(t * 9) * 12 * seg(t, C2 + .2, C2 + .4);
  apply(john, { ...TP.cheer, aL: [-40, 70, 0, 60 + fan], aR: [-40, 70, 0, 60 - fan] }, { t, seed: 1, face: t > tMoney - .2 ? 'smug' : 'happy', look: CAMP });
}
function tvDraw(t, mode) {
  const s = TV.userData.screen, g = s.ctx; const W2 = 640, H2 = 480;
  const gr = g.createLinearGradient(0, 0, 0, H2); gr.addColorStop(0, '#2F7FE0'); gr.addColorStop(.7, '#BFE3FA'); gr.addColorStop(.7, '#6A6C72'); gr.addColorStop(1, '#4A4C52'); g.fillStyle = gr; g.fillRect(0, 0, W2, H2);
  // a little jet landing in the ad (drawn), a teen with a can
  const k = (t * .35) % 1, jx = 320 + Math.sin(t * .8) * 30, jy = mode === 'ad2' ? 250 : lerp(130, 250, eo(clamp(k * 1.6)));
  g.save(); g.translate(jx, jy); g.fillStyle = '#8E9BA8'; g.strokeStyle = '#141016'; g.lineWidth = 5; g.beginPath(); g.moveTo(-120, 0); g.lineTo(110, -6); g.lineTo(140, 6); g.lineTo(110, 16); g.lineTo(-120, 14); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-30, 2); g.lineTo(-90, 60); g.lineTo(-40, 60); g.lineTo(30, 4); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-110, 0); g.lineTo(-140, -50); g.lineTo(-115, -50); g.lineTo(-80, 0); g.fill(); g.stroke();
  g.fillStyle = '#9ED8F2'; g.beginPath(); g.ellipse(70, -6, 32, 13, 0, 0, 7); g.fill(); g.stroke(); g.restore();
  g.textAlign = 'center'; g.lineJoin = 'round';
  const text = (str, y, size, col) => { g.font = `900 ${size}px Montserrat`; g.lineWidth = size * .22; g.strokeStyle = '#141016'; g.strokeText(str, 320, y); g.fillStyle = col; g.fillText(str, 320, y); };
  text('HARRIER FIGHTER', 70, 54, '#FFFFFF');
  if (mode === 'ad1') { const a = t >= t7m - .1; if (a) text('7,000,000 POINTS', 410, 58, '#F2C230'); }
  if (mode === 'ad2') { const k2 = seg(t, t700m - .1, t700m + .5); const n = Math.round(lerp(7e6, 7e8, eo(k2) * eo(k2))); text(n.toLocaleString('en-US') + ' POINTS', 410, 52, '#F2C230'); if (t > tKid - .05) { g.save(); g.translate(320, 340); g.rotate(-.08); const p = back(seg(t, tKid - .05, tKid + .2), 2.4); g.scale(p, p); g.font = '900 50px Montserrat'; g.lineWidth = 11; g.strokeStyle = '#141016'; g.strokeText('(JUST KIDDING)', 0, 0); g.fillStyle = '#E8423A'; g.fillText('(JUST KIDDING)', 0, 0); g.restore(); } }
  g.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < H2; y += 4) g.fillRect(0, y, W2, 2);   // scanlines
  const v = g.createRadialGradient(320, 240, 160, 320, 240, 420); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = v; g.fillRect(0, 0, W2, H2);
  s.t.needsUpdate = true;
}
const SOFA = () => L(LR0, 0, .1, 1.5);
function act3(t) {
  reset(); tvDraw(t, 'ad1');
  const shock = t >= t7m - .05;
  put(john, SOFA(), Math.PI); apply(john, shock ? TP.sitShock : TP.sit, { t, seed: 1, face: shock ? 'shock' : 'calm', look: L(LR0, 0, .96, -2.6) });
}
function act4(t) {
  reset(); tvDraw(t, 'ad1');
  put(john, SOFA(), Math.PI);
  if (t < S4b) apply(john, TP.sitLaugh, { t, seed: 1, face: 'laugh', look: L(LR0, 0, .96, -2.6) });
  else apply(john, mix(TP.sit, TP.rub, .7), { t, seed: 1, face: t >= S4c ? 'evil' : 'smug', look: t >= S4c ? CAMP : L(LR0, -.2, .45, .4) });
  john.P.visible = !(t >= S4b && t < S4c);
  const hl = seg(t, tBuy - .1, t10c + .1); CAT.userData.draw(hl);
  MAG.visible = t >= S4b && t < S4c; MAG.position.set(lerp(-.34, -.04, eio(seg(t, S4b + .1, t10c))), .5, .69);
}
function act5(t) {
  reset(); placeJet(t + 10, 1); show(bag7, TAG);
  put(john, V(-1.9, 0, 3.2), .35); apply(john, mix(TP.hold, TP.stand, .3), { t, seed: 1, face: t > t30m ? 'laugh' : 'smug', look: t > t30m ? jetW(0, 1, 2) : CAMP });
  bag7.position.set(.1, -.06, .04);
  const tg = jetW(0, 1.6, 5.4, 10); TAG.position.set(tg.x, tg.y + Math.sin(t * 2) * .05, tg.z); TAG.rotation.set(0, JRY + .3, Math.sin(t * 1.7) * .06); TAG.scale.setScalar(lerp(.2, 1, back(seg(t, t30m - .1, t30m + .25), 2)));
  TAG.visible = t >= t30m - .1;
}
function act6(t) {
  reset(); show(...(t < S6b ? BAGS : [CHK]), ...(t >= S6b ? [ENV] : []));
  if (t < S6b) {
    put(john, JOHN6, .2);
    const n = BAGS.filter((b, i) => t > tInvest - .3 + i * .22 + .45).length;
    apply(john, mix(TP.hold, TP.cheer, Math.min(1, n * .25) * .4), { t, seed: 1, face: n >= 3 ? 'laugh' : 'happy', look: CAMP, sq: 0 });
    INV.forEach((p, i) => { const a = [-1.6, -1.0, 1.0, 1.6][i], off = [[-1.15, -.25], [-.7, -.95], [.7, -.95], [1.15, -.25]][i], home = V(JOHN6.x + off[0], 0, JOHN6.z + off[1]); const tt = tInvest - .3 + i * .22;
      const run = seg(t, C6, tt), pos = V(lerp(home.x + Math.sin(a) * 3, home.x, eo(run)), 0, lerp(home.z + 2, home.z, eo(run)));
      put(p, pos, Math.atan2(JOHN6.x - pos.x, JOHN6.z - pos.z)); apply(p, t < tt ? walk(TP.stand, t * 9 + i, run < 1 ? 1 : 0) : mix(TP.present, TP.cheer, seg(t, tt, tt + .3)), { t, seed: 30 + i, face: i % 2 ? 'happy' : 'smug', look: john.P.position.clone().add(V(0, 1.2, 0)) });
      const b = BAGS[i], k = seg(t, tt, tt + .45), from = pos.clone().add(V(0, 1.1, 0)), to = JOHN6.clone().add(V((i - 1.5) * .14, 1.0 + (i % 2) * .22 + Math.floor(i / 2) * .16, .32));
      b.position.copy(from.lerp(to, eo(k))).add(V(0, Math.sin(k * Math.PI) * .7, 0)); b.rotation.set(k * 4 * (i % 2 ? 1 : -1), k * 3, 0); if (k <= 0) b.position.copy(pos.clone().add(V(.25, .8, .2)));
    });
  } else {
    const front = V(Math.sin(.5), 0, Math.cos(.5)), at = MBX.clone().add(front.clone().multiplyScalar(.75));
    put(john, at, .5 + Math.PI); const push = seg(t, S6b + .3, tCheck - .1);
    apply(john, mix(TP.present, TP.hold, push), { t, seed: 1, face: t > tCheck - .25 ? 'laugh' : 'happy', look: MBX.clone().add(V(0, 1.2, 0)) });
    CHK.position.set(0, -.2, .14 + push * .12); CHK.rotation.set(.35, 0, Math.PI); CHK.scale.set(lerp(.85, .25, ei(push)), lerp(.85, .4, push), 1); CHK.visible = push < .98;
    const k = seg(t, tCheck - .15, C7 + .1); ENV.visible = k > 0; ENV.position.copy(MBX).add(V(0, 1.45 + ei(k) * 9, 0)).add(front.clone().multiplyScalar(-k * 2)); ENV.rotation.set(k * 6, k * 9, k * 2);
    SCH.userData.mailbox.rotation.z = Math.sin(t * 40) * .03 * seg(t, S6b + .3, tCheck);
  }
}
function act7(t) {
  reset(); LET.visible = true;
  put(exec, L(OF0, 0, 0, -1.25), 0);
  const stamped = t >= tNo - .03;
  apply(exec, mix(TP.hold, TP.present, .3), { t, seed: 3, face: stamped ? 'smug' : 'laugh', look: CAMP });
  exec.P.updateMatrixWorld(true); const hp = exec.props.getWorldPosition(V(0, 0, 0)), hl = exec.propsL.getWorldPosition(V(0, 0, 0));
  LET.position.copy(hp.lerp(hl, .5)).add(V(0, -.06, .1)); LET.rotation.set(-.25, 0, 0); LET.scale.setScalar(1.45);
  NO.visible = stamped; NO.scale.setScalar(lerp(2.2, 1, eo(seg(t, tNo - .03, tNo + .1))));
}
function act8(t) {
  reset(); show(GAV, ...(t < C8 ? [SUIT] : []));
  put(john, L(CT0, -1.05, 0, 1.55), Math.PI); put(exec, L(CT0, 1.05, 0, 1.55), Math.PI);
  if (t < C8) { const sl = eo(seg(t, tSued - .2, tSued + .02)); apply(john, mix(TP.hold, { ...TP.hold, aL: [-95, -10, 0, 20], aR: [-95, -10, 0, 20], sp: [16, 0, 0] }, sl), { t, seed: 1, face: 'angry', look: CAMP }); SUIT.position.set(.16, .02, .05); SUIT.rotation.set(-1.0 + sl * .8, 0, 0); }
  else apply(john, t > tReason ? mix(TP.stand, TP.shrug, .4) : TP.stand, { t, seed: 1, face: t > tReason + .3 ? 'shock' : 'worried', look: L(CT0, 0, 1.8, -2.6) });
  apply(exec, t > S8b ? TP.cross : TP.stand, { t, seed: 3, face: t > S8b ? 'smug' : 'calm', look: t > S8b ? L(CT0, -1.05, 1.4, 1.55) : L(CT0, 0, 1.8, -2.6) });
  put(judge, L(CT0, 0, .78, -3.25), 0);
  const bang = [tJet8 + .05, tJet8 + .32].some(b => t > b - .14 && t < b + .06), lift = [tJet8 + .05, tJet8 + .32].some(b => t > b - .3 && t < b - .14);
  apply(judge, { ...TP.stand, aR: lift ? [-150, 10, 0, 30] : bang ? [-70, 10, 0, 20] : [-60, 14, 0, 60], aL: [-40, 20, 0, 70] }, { t, seed: 9, face: t > tJet8 ? 'angry' : 'calm', talk: t < tJet8 ? talk(t, .9) : 0, look: CAMP });
  GAV.rotation.set(0, 0, Math.PI / 2); GAV.position.set(0, -.02, .04);
}
function act9(t) {
  reset(); tvDraw(t, 'ad2');
  put(john, SOFA(), Math.PI); apply(john, TP.sit, { t, seed: 1, face: t >= S9b ? 'deadpan' : 'calm', look: t >= S9b ? CAMP : L(LR0, 0, .96, -2.6), noBlink: t >= S9b });
}

// ---------------- sound events (the score reads these) ----------------
ev(0, 'jet'); ev(0, 'stab'); ev(S1b - .05, 'whoosh'); ev(1.55, 'hiss'); ev(tPepsi1, 'pop');
ev(C2, 'cut'); ev(tMoney - .1, 'cash');
ev(C3, 'swish'); ev(C3 + .05, 'tv'); ev(t7m - .05, 'sting'); ev(S3b, 'cut');
ev(C4, 'cut'); ev(tJoke - .1, 'boing'); ev(S4b, 'whoosh'); ev(tBuy - .05, 'marker'); ev(t10c, 'ding'); ev(S4c, 'snap');
ev(C5, 'cut'); ev(t700k, 'register'); ev(S5b, 'whoosh'); ev(t30m - .05, 'sting');
ev(C6, 'cut'); INV.forEach((_, i) => { ev(tInvest - .3 + i * .22, 'toss'); ev(tInvest - .3 + i * .22 + .45, 'thump'); }); ev(S6b, 'cut'); ev(tCheck - .4, 'stuff'); ev(tCheck - .15, 'whooshUp');
ev(C7, 'cut'); ev(tNo - .03, 'stamp'); ev(S7b - .05, 'whoosh'); ev(tSued - .02, 'slam');
ev(C8, 'cut'); ev(tJet8 + .05, 'gavel'); ev(tJet8 + .32, 'gavel'); ev(S8b, 'cut');
ev(C9, 'swish'); ev(C9 + .05, 'tv'); ev(t700m, 'roll'); ev(tKid - .05, 'trombone'); ev(S9b, 'snap'); ev(LOOP - .12, 'whoosh');

// ---------------- the overlay: telops (big numbers) + 1–3 word captions ----------------
const ov = document.getElementById('ov').getContext('2d');
const snap = document.createElement('canvas'); snap.width = W; snap.height = H; const sctx = snap.getContext('2d');
const num = n => Math.round(n).toLocaleString('en-US');
const TEL = [
  { t0: -1, t1: C2, text: '7,000,000 POINTS', y: 300, size: 98, col: '#F2C230', rot: -4, plate: '#1E3F7A' },
  { t0: tMoney - .15, t1: C3, text: '$700,000', y: 300, size: 150, col: '#7BE07B', rot: 3 },
  { t0: t10c - .05, t1: C5, text: '10¢ EACH', y: 330, size: 150, col: '#F2C230', rot: -5 },
  { t0: t700k - .05, t1: C6, text: t => '$' + num(t < tFor5 ? 700000 * eo(seg(t, t700k - .05, t700k + .7)) : 700000), y: 300, size: 140, col: '#7BE07B', rot: -3, grow: 1, sub: t => t > t30m ? 'FOR A $30,000,000+ JET' : null },
  { t0: tNo - .03, t1: S7b, text: 'NO.', y: 330, size: 200, col: '#E8423A', rot: -8, stamp: 1 },
  { t0: tReason - .05, t1: C9, text: '"NO REASONABLE PERSON…"', y: 300, size: 76, col: '#FFFFFF', rot: -3, plate: '#7A1E22' },
  { t0: tJet8 + .05, t1: C9, text: 'PEPSI WINS', y: 570, size: 110, col: '#F2C230', rot: 4, stamp: 1 },
];
function drawTelop(x, t) {
  const p = seg(t, x.t0, x.t0 + .25), sc = x.stamp ? lerp(2.2, 1, eo(p)) : back(p, 2.6), wob = 1 + .02 * Math.sin((t - x.t0) * 8);
  const text = typeof x.text === 'function' ? x.text(t) : x.text, sub = typeof x.sub === 'function' ? x.sub(t) : x.sub;
  ov.save(); ov.translate(540, x.y); ov.rotate(x.rot * Math.PI / 180); ov.scale(sc * wob, sc * wob); if (x.stamp) ov.globalAlpha = clamp(p * 3);
  ov.font = `900 ${x.size}px Montserrat`; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  const tw = Math.min(1000, ov.measureText(text).width + 70), th = x.size * 1.4;
  if (x.plate) { ov.fillStyle = 'rgba(0,0,0,.85)'; ov.beginPath(); ov.roundRect(-tw / 2 + 10, -th / 2 + 12, tw, th, 28); ov.fill(); ov.fillStyle = x.plate; ov.beginPath(); ov.roundRect(-tw / 2, -th / 2, tw, th, 28); ov.fill(); }
  if (x.stamp) { ov.strokeStyle = x.col; ov.lineWidth = 14; ov.beginPath(); ov.roundRect(-tw / 2 + 5, -th / 2 + 8, tw - 10, th - 16, 18); ov.stroke(); }
  ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 20; ov.shadowOffsetY = 8; ov.lineWidth = x.size * .2; ov.strokeStyle = '#000'; ov.strokeText(text, 0, 4, 960); ov.shadowColor = 'transparent'; ov.fillStyle = x.col; ov.fillText(text, 0, 4, 960);
  if (sub) { ov.font = '900 52px Montserrat'; const sw = ov.measureText(sub).width + 50; ov.fillStyle = '#E8423A'; ov.beginPath(); ov.roundRect(-sw / 2, x.size * .7 + 4, sw, 74, 18); ov.fill(); ov.fillStyle = '#FFFFFF'; ov.fillText(sub, 0, x.size * .7 + 43); }
  ov.restore();
}
// captions: 1–3 words per chunk (break at punctuation or ~14 characters), shown as spoken, centre of frame
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
  light(sh.lt, sh.at);
  WORLD.userData.wheel.rotation.z = -t * .12; WORLD.userData.wheel.children.forEach(o => { if (o.userData.a !== undefined) o.rotation.z = t * .12; });
  SCH.userData.pennant.rotation.y = Math.sin(t * 3) * .25;
  LIV.visible = sh.lt === LIVING; OFF.visible = sh.lt === OFFICE; CRT.visible = sh.lt === COURT; SCH.visible = WORLD.visible;
  let c = sh.after ? null : sh.cam(tt, u); if (c) CAMP.copy(c.pos);
  sh.act(tt);
  if (!c) { c = sh.cam(tt, u); CAMP.copy(c.pos); }
  // the jet's rumble shakes the camera while it's hovering
  if (sh === SHOTS[0] || sh === SHOTS[1] || sh.loop) { const k = (1 - seg(tt, 1.2, 2.4)) * .01; c.pos.x += Math.sin(tt * 53) * k; c.pos.y += Math.sin(tt * 61) * k; }
  camera.position.copy(c.pos); camera.up.set(0, 1, 0); camera.lookAt(c.look); camera.rotateZ(c.roll ?? 0); camera.fov = c.fov; camera.updateProjectionMatrix();
  WORLD.userData.clouds.position.x = camera.position.x; WORLD.userData.clouds.position.z = camera.position.z;
  post.dof.focus = c.focus; post.dof.aper = QS.get('nodof') ? 0 : c.aper; post.dof.maxCoc = 8; renderer.shadowMap.enabled = !QS.get('noshadow');
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
  if (QS.get('poster')) { ov.clearRect(0, 0, W, H); [['HE TRIED TO BUY', 230, -4, '#FFFFFF'], ['A FIGHTER JET', 380, -4, '#F2C230'], ['WITH PEPSI', 530, 3, '#FFFFFF']].forEach(([text, y, rot, col]) => drawTelop({ t0: -9, text, y, size: 128, col, rot }, t)); return; }
  if (QS.get('clean')) return;
  if (t < LOOP) { TEL.forEach(x => { if (t >= x.t0 && t < x.t1) drawTelop(x, t); }); drawCaption(t); }
}
function texts(t) { if (t >= LOOP) return []; return TEL.filter(x => typeof x.text === 'string' && t >= x.t0 + .3 && t < x.t1).map(x => ({ id: x.text, text: x.text, x0: 60, y0: x.y - x.size * .7, x1: 1020, y1: x.y + x.size * .7 })); }
EV.sort((a, b) => a.t - b.t);
window.DUR = +(B0 - A0).toFixed(3); window.EV = EV; window.render = t => render(t + A0); window.TEXTS = t => texts(t + A0);
render(A0);
window.READY = true;
