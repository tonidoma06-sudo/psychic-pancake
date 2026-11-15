// "The Soldier Who Kept Fighting" · 3D vertical Short (1080×1920) in the v4 toon style: Hiroo Onoda, who held out in the
// jungle of Lubang Island for 29 years after World War 2 ended. Outlined toon cast with big 2D faces, a lush island, a camera
// that never sits still, 1–3 word captions. Every shot, action, telop and caption is placed from timing.json (the voice).
// render(t) is pure in t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { makePost } from '/core/three/post.js';
import { makeToon, apply, TP, mix, walk, toon, TM, G } from './toon.js';
import { island, shop, plane, rifle, leaflets, leaflet, newspaper, letter, photo, orderPaper, backpack, boat, campfire, LAY, WIND } from './sets_onoda.js';
import { skyDome } from './sky.js';

const W = 1080, H = 1920;
await document.fonts.load('900 80px Montserrat'); await document.fonts.load('800 80px Montserrat'); await document.fonts.load('700 80px Fredoka'); await document.fonts.load('600 80px Fredoka');
const TMJ = await (await fetch('timing.json')).json();
const B = 60 / TMJ.bpm, DUR = TMJ.dur, LOOP = DUR - B;
const LN = Object.fromEntries(TMJ.lines.map(l => [l.id, l]));
const nrm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const w = (lid, word, k = 0) => { const ws = LN[lid].words.filter(x => nrm(x.w).startsWith(nrm(word))); return (ws[k] || ws[ws.length - 1] || { t0: LN[lid].t0 }).t0; };
const cut = id => LN[id].cut;
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
const bulb = new THREE.PointLight('#FFB060', 0, 9, 1.6); scene.add(bulb);
const DAY = { pos: [-20, 40, 18], col: '#FFF1DA', int: 3.2, hs: '#C8E8FF', hg: '#4A7A30', hemi: 1.05, fog: ['#BFDCCB', 60, 420], sky: ['#1E70E0', '#DDEFF0', [-.4, .5, .6], '#FFF6D8'], env: .35, r: 14, warm: .1 };
const SHADE = { ...DAY, int: 2.6, hs: '#B8E0C0', hg: '#3A5A22', hemi: 1.15, fog: ['#9CC8A8', 30, 260], warm: .08 };   // under the canopy
const DUSK = { pos: [40, 5, -14], col: '#FF8A4A', int: 1.7, hs: '#6A5AA0', hg: '#2A1E28', hemi: .5, fog: ['#8A5A6A', 20, 200], sky: ['#2A2868', '#E8885A', [.95, .07, -.3], '#FFB070'], env: .18, r: 22, warm: .42 };
const NIGHT = { pos: [-20, 30, -20], col: '#8AA6E8', int: .6, hs: '#3A4A80', hg: '#141A2A', hemi: .55, fog: ['#1A2440', 12, 90], sky: ['#070C22', '#1E2A58', [-.3, .6, -.4], '#C8D4FF'], env: .12, r: 10, warm: .05, bulb: 5 };
const SHOP = { pos: [3, 6, 5], col: '#FFE8C8', int: 1.6, hs: '#FFF2DC', hg: '#7A5A3A', hemi: .95, env: .5, r: 6, bg: '#2A2420', warm: .2, bulb: 9 };
const SEA = { pos: [-30, 50, 40], col: '#FFF4E4', int: 3.0, hs: '#C8E4FF', hg: '#3A7AA0', hemi: 1.0, fog: ['#CFE4EE', 120, 900], sky: ['#1A6AD8', '#E4F0F4', [-.4, .5, .6], '#FFF6D8'], env: .35, r: 30, warm: .08 };
function light(o, at) {
  sun.color.set(o.col); sun.intensity = o.int; sun.position.set(at.x + o.pos[0], at.y + o.pos[1], at.z + o.pos[2]); sun.target.position.copy(at);
  const c = sun.shadow.camera, r = o.r ?? 10; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 1; c.far = 200; c.updateProjectionMatrix();
  hemi.color.set(o.hs); hemi.groundColor.set(o.hg); hemi.intensity = o.hemi;
  scene.fog = o.fog ? new THREE.Fog(o.fog[0], o.fog[1], o.fog[2]) : null; sky.visible = !!o.sky; scene.background = o.sky ? null : new THREE.Color(o.bg ?? '#2A2A30');
  if (o.sky) { const u = sky.material.uniforms; u.top.value.set(o.sky[0]); u.hor.value.set(o.sky[1]); u.sd.value.set(...o.sky[2]).normalize(); u.sc.value.set(o.sky[3]); }
  scene.environmentIntensity = o.env ?? .35; vg.warm.value = o.warm ?? .1;
  bulb.intensity = o.bulb ?? 0;
}

// ---------------- sets ----------------
const SET = { isle: island(), shop: shop() };
for (const s of Object.values(SET)) { s.visible = false; scene.add(s); }
SET.shop.position.set(400, 0, 400);
const SHP = SET.shop.position;
const FIREP = SET.isle.userData.fireAt;

// ---------------- cast ----------------
const ONODA = makeToon({ name: 'onoda', outfit: 'army', top: '#8C8656', pants: '#7E784A', hair: 'fieldcap', hatC: '#867E50', shoe: '#3A3328', belt: '#4A3420' });
const OLD = makeToon({ name: 'onoda74', outfit: 'army', top: '#9A9468', pants: '#86805A', hair: 'fieldcap', hatC: '#968E64', shoe: '#3A3328', belt: '#4A3420', patches: 1, seed: 9 });
const TANI = makeToon({ name: 'taniguchi44', outfit: 'army', top: '#7E7650', pants: '#6E6846', hair: 'peak', hatC: '#7A7248', bandC: '#B8282E', hairC: '#1E1814', glasses: 'round', mustache: '#2A2020', sam: 1, shoe: '#2A1A10' });
const OLDT = makeToon({ name: 'taniguchi74', outfit: 'suit', top: '#6A5E4C', pants: '#4E463C', hair: 'slick', hairC: '#C8C4BC', glasses: 'round', mustache: '#D8D4CC', shoe: '#2A1A10' });
const SUZ = makeToon({ name: 'suzuki', outfit: 'polo', top: '#E8A030', pants: '#3C5E9A', hair: 'messy', hairC: '#1E1612', shoe: '#7A4A2A', blush: 1 });
const SOL = [0, 1].map(i => makeToon({ name: 'sol' + i, outfit: 'army', top: ['#8A8454', '#848052'][i], pants: '#7A7448', hair: 'fieldcap', hatC: '#827A4C', flaps: i, shoe: '#3A3328' }));
const CAST = [ONODA, OLD, TANI, OLDT, SUZ, ...SOL]; CAST.forEach(p => scene.add(p.P));
// props
const RIF = rifle(); scene.add(RIF);
const RIF2 = rifle(); scene.add(RIF2);   // a soldier's in the boat
const LEAF = leaflets(70); scene.add(LEAF);
const LF1 = leaflet(); scene.add(LF1);
const NEWS = newspaper(), LET = letter(), PHO = photo(); scene.add(NEWS, LET, PHO);
const ORD = orderPaper(); scene.add(ORD);
const PACK = backpack(); SUZ.spine.add(PACK); PACK.position.set(0, .3, -.24); PACK.rotation.x = .08;
const BOAT = boat(); SET.isle.add(BOAT); BOAT.position.set(LAY.boat[0], 0, LAY.boat[1]); BOAT.rotation.y = .12;
const FIRE = campfire(); SET.isle.add(FIRE); FIRE.position.copy(FIREP);
const BOMBER = plane({ mil: 1 }); scene.add(BOMBER);
const LINER = plane({ body: '#F2F0EA', stripe: '#C8283A' }); scene.add(LINER);
const KNIFE = G(); TM(new THREE.BoxGeometry(.02, .1, .012), '#5A3A1E', KNIFE, 0, 0, 0, .004); TM(new THREE.BoxGeometry(.012, .12, .004), '#C8CCD0', KNIFE, 0, .1, 0, .003); OLD.props.add(KNIFE); KNIFE.rotation.x = Math.PI / 2;
const BOOK = G(); TM(new THREE.BoxGeometry(.2, .26, .03), '#8E2A22', BOOK, 0, 0, 0, .005); TM(new THREE.BoxGeometry(.19, .25, .032), '#F4EEDC', BOOK, .005, 0, 0, 0); scene.add(BOOK);
const LOG = G(); TM(new THREE.CylinderGeometry(.14, .15, 1.2, 10), '#6A4A2E', LOG, 0, .14, 0, .008).rotation.z = Math.PI / 2; SET.isle.add(LOG); LOG.position.copy(FIREP).add(V(-.1, 0, -.95)); LOG.rotation.y = .3;
const PROPS = [RIF, RIF2, LF1, NEWS, LET, PHO, ORD, BOOK, BOMBER, LINER, KNIFE];

// ---------------- key times (from the voice) ----------------
const C2 = cut('L2'), C3 = cut('L3'), C4 = cut('L4'), C5 = cut('L5'), C6 = cut('L6'), C7 = cut('L7'), C8 = cut('L8'), C9 = cut('L9');
const tWar1 = w('L1', 'war'), tFor = w('L1', 'for'), t29a = w('L1', '29'), tEnded = w('L1', 'ended');
const t1944 = w('L2', '1944'), tLt = w('L2', 'lieutenant'), tOnoda2 = w('L2', 'onoda'), tOrders = w('L2', 'orders'), tNever = w('L2', 'never'), tSurr = w('L2', 'surrender');
const t1945 = w('L3', '1945'), tEnds = w('L3', 'ends'), tPlanes = w('L3', 'planes'), tLeafl = w('L3', 'leaflets'), tHes = w('L3', 'hes'), tFake0 = w('L3', 'fake');
const tNews = w('L4', 'newspapers'), tLetters = w('L4', 'letters'), tF1 = w('L4', 'fake', 0), tF2 = w('L4', 'fake', 1), tF3 = w('L4', 'fake', 2);
const tFights = w('L5', 'fights'), tRaids = w('L5', 'raids'), t30 = w('L5', '30');
const t1974 = w('L6', '1974'), tA6 = w('L6', 'a'), tGoes = w('L6', 'goes'), tOno6 = w('L6', 'onoda'), tPanda = w('L6', 'panda'), tAbom = w('L6', 'abominable'), tIn6 = w('L6', 'in'), tOrder6 = w('L6', 'order');
const tFinds = w('L7', 'finds'), tOno7 = w('L7', 'onoda'), t4 = w('L7', '4'), tBut = w('L7', 'but'), tWont = w('L7', 'wont');
const tJapan = w('L8', 'japan'), tCmdr = w('L8', 'commander'), tBooks = w('L8', 'bookseller'), tAnd8 = w('L8', 'and'), tFlies = w('L8', 'flies');
const tOrder9 = w('L9', 'order'), tGiven = w('L9', 'given'), t29b = w('L9', '29'), tHe9 = w('L9', 'he'), tSurr9 = w('L9', 'surrenders'), tAnd9 = w('L9', 'and'), tRifle = w('L9', 'rifle'), tWorks = w('L9', 'works');
const S1b = tFor - .06, S2b = tLt - .12, S2c = tOrders - .1, S3b = tPlanes - .06, S3c = tHes - .1, S6b = tA6 - .1, S7b = tBut - .06, S8b = tAnd8 - .05, S9b = tHe9 - .06, S9c = tAnd9 - .05;

// ---------------- helpers ----------------
const put = (p, v, ry = 0) => { p.P.visible = true; p.P.position.copy(v); p.P.rotation.set(0, ry, 0); p.P.updateMatrixWorld(true); };
const show = (...ps) => PROPS.forEach(o => o.visible = ps.includes(o));
const CAMP = new THREE.Vector3(0, 1.4, 6);
const headOf = p => { p.P.updateMatrixWorld(true); return p.head.getWorldPosition(V(0, 0, 0)); };
const handOf = (p, left = 0) => { p.P.updateMatrixWorld(true); return (left ? p.aL : p.aR).hand.getWorldPosition(V(0, 0, 0)); };
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const fwdOf = p => V(Math.sin(p.P.rotation.y), 0, Math.cos(p.P.rotation.y));
let fireK = 0;
function reset() {
  CAST.forEach(p => p.P.visible = false); show(); LEAF.visible = false; FIRE.visible = false; LOG.visible = false; BOAT.visible = true;
  for (const r of [RIF, RIF2]) { scene.add(r); r.scale.setScalar(1); r.userData.glint.material.opacity = 0; }
  for (const o of [LF1, NEWS, LET, PHO, ORD, BOOK]) { scene.add(o); o.scale.setScalar(1); }
  fireK = 0;
}
// the rifle in two hands: grip in the right hand, the barrel running through the left; its sights up, its side to the viewer
const _Y = V(0, 1, 0), _X = V(), _Z = V(), _M4 = new THREE.Matrix4();
function rifleIn(p, r = RIF, grip = .3, mode = 'port') {
  r.visible = true; scene.add(r);
  const rh = handOf(p), lh = handOf(p, 1), f = fwdOf(p);
  let d = lh.clone().sub(rh); if (d.length() < .05) d.set(0, 1, 0); d.normalize();
  if (mode === 'present') { const mid = rh.clone().add(lh).multiplyScalar(.5); r.position.copy(mid).addScaledVector(d, -.5); }
  else r.position.copy(rh).addScaledVector(d, -grip);
  _Z.copy(f).addScaledVector(d, -f.dot(d)).normalize().multiplyScalar(-1); _X.crossVectors(d, _Z).normalize(); _Z.crossVectors(_X, d);
  _M4.makeBasis(_X, d, _Z); r.quaternion.setFromRotationMatrix(_M4);
}
// slung over the right shoulder, muzzle up
function rifleSlung(p, r = RIF) { r.visible = true; p.spine.add(r); r.position.set(-.17, -.22, -.23); r.rotation.set(-.1, 0, .13); }
// a prop held up between both hands, facing a point
function between(p, o, look, dy = .02) { o.visible = true; scene.add(o); o.position.copy(handOf(p)).add(handOf(p, 1)).multiplyScalar(.5).add(V(0, dy, 0)); o.lookAt(look); }
function inHand(p, o, left = 0, look = null) { o.visible = true; scene.add(o); o.position.copy(handOf(p, left)).add(V(0, .06, 0)); if (look) o.lookAt(look); }
// a prop tossed away: arcs over the shoulder, spinning
function toss(o, from, t, t0, dir, k = 1) { const s = t - t0; o.visible = s < 1.2; scene.add(o); o.position.copy(from).addScaledVector(dir, s * 2.6 * k).add(V(0, s * 2.4 - 4.9 * s * s, 0)); o.rotation.set(s * 9, s * 6, s * 4); }

// ---------------- poses (degrees, see toon.js) ----------------
const P = {
  port:    { sp: [6, 0, 0], hd: [-4, 0, 0], aL: [-82, -30, 0, 70], aR: [-34, 22, 0, 62], lL: [0, 5, 0], lR: [0, 5, 0] },     // rifle across the chest
  ready:   { sp: [22, 0, 0], hd: [-20, 0, 0], aL: [-88, -20, 0, 52], aR: [-40, 18, 0, 70], lL: [70, 12, 110], lR: [70, 12, 110], y: -.22 },   // crouched, rifle up
  attn:    { sp: [-3, 0, 0], hd: [-3, 0, 0], aL: [0, 6, 0, 4], aR: [0, 6, 0, 4], lL: [0, 1, 0], lR: [0, 1, 0] },
  read:    { sp: [6, 0, 0], hd: [10, 0, 0], aL: [-70, -6, 0, 70], aR: [-70, -6, 0, 70], lL: [0, 4, 0], lR: [0, 4, 0] },
  showUp:  { sp: [-4, 0, 0], hd: [-6, 0, 0], aL: [0, 14, 0, 10], aR: [-120, 26, 0, 40], lL: [0, 4, 0], lR: [0, 4, 0] },   // one prop held up beside the face
  showTwo: { sp: [-2, 0, 0], hd: [-4, 0, 0], aL: [-112, 30, 0, 40], aR: [-112, 30, 0, 40], lL: [0, 4, 0], lR: [0, 4, 0] },
  throwR:  { sp: [-10, 0, 8], hd: [-8, 0, 0], aL: [-40, 20, 0, 60], aR: [-160, 40, 0, 20], lL: [0, 6, 0], lR: [0, 6, 0] },
  carve:   { sp: [8, 0, 0], hd: [6, 0, 0], aL: [-20, 30, 0, 40], aR: [-92, 4, 0, 46], lL: [0, 5, 0], lR: [0, 5, 0] },
  sitFire: { sp: [8, 0, 0], hd: [-4, 0, 0], aL: [-40, 18, 0, 70], aR: [-40, 18, 0, 70], lL: [80, 10, 80], lR: [80, 10, 80] },
  aimPt:   { sp: [8, 0, 0], hd: [-6, 0, 0], aL: [-80, -16, 0, 34], aR: [-60, 14, 0, 70], lL: [0, 8, 0], lR: [14, 8, 0] },   // rifle levelled at someone
  bow:     { sp: [26, 0, 0], hd: [18, 0, 0], aL: [-78, 24, 0, 30], aR: [-78, 24, 0, 30], lL: [0, 4, 0], lR: [0, 4, 0] },
};

// ---------------- camera language ----------------
const camAt = (pos, look, fov = 45, focus, aper = 4, roll = 0) => ({ pos, look, fov, focus: focus ?? pos.distanceTo(look), aper, roll });
const hand = (c, t, a = 1) => { c.pos.x += noise(t, 1) * .012 * a; c.pos.y += noise(t, 2) * .01 * a; c.look.x += noise(t, 3) * .02 * a; c.look.y += noise(t, 4) * .016 * a; return c; };
const HOOKP = V(-5.4, 0, 4.2);            // crouched in the leaves at the edge of the clearing
const TALLYP = V(LAY.tally[0] - .75, 0, LAY.tally[1] + .55), TL = (x, y, z) => V(LAY.tally[0] + x, y, LAY.tally[1] + z);
const SANDP = V(2.3, 0, 27.6), TANP = V(3.5, 0, 26.6);
const PATROL = t => V(lerp(-4.5, 1.5, seg(t, C3, S3b)), 0, lerp(-6.2, -3.2, seg(t, C3, S3b)));
const READP = V(.6, 0, .9);
const HIDEP = V(-1.0, 0, -.6);
const VILP = V(LAY.village[0] - 12, 0, LAY.village[1] + 10);
const SUZW = t => { const z = lerp(15.5, 9.5, seg(t, S6b - .6, C7)); return V(1.2 - (z - 6) * .12, 0, z); };
const SUZF = FIREP.clone().add(V(-.1, 0, -.95)), ONO7 = FIREP.clone().add(V(-2.2, 0, -2.6));
const MEETO = V(.4, 0, -.15), MEETT = V(-.35, 0, .28);
const PLANEX = t => lerp(-90, 90, seg(t, S3b - .8, S3b + 2.2));

const SHOTS = [
  // 1a · the hook: crouched among giant leaves, rifle up, eyes darting; push in
  { t0: 0, t1: S1b, set: 'isle', lt: SHADE, at: HOOKP, act: t => act1(t),
    cam: (t, u) => hand(camAt(HOOKP.clone().add(V(lerp(.35, .22, eo(u)), lerp(.95, 1.0, u), lerp(2.2, 1.45, eo(u)))), HOOKP.clone().add(V(0, .98, 0)), lerp(48, 42, u), lerp(2.2, 1.45, eo(u)), 6), t, 1.3) },
  // 1b · …for 29 years: the tally tree; arc from the carved marks to him, saluting
  { t0: S1b, t1: C2, set: 'isle', lt: SHADE, at: TALLYP, act: t => act1(t),
    cam: (t, u) => { const k = eio(seg(t, S1b + .15, tEnded)); return hand(camAt(TL(lerp(.05, -.3, k), lerp(1.38, 1.3, k), lerp(1.95, 3.4, k)), TL(lerp(.02, -.42, k), lerp(1.35, 1.2, k), lerp(0, .45, k)), lerp(42, 44, k), lerp(1.4, 3.0, k), lerp(6, 4, k)), t, .8); } },
  // 2a · 1944: low over the water, the landing boat at the shore, the island's mountains behind
  { t0: C2, t1: S2b, set: 'isle', lt: DAY, at: V(2, 0, 28), act: t => act2(t),
    cam: (t, u) => hand(camAt(V(lerp(5.0, 4.4, u), lerp(1.25, 1.5, u), lerp(41, 39, u)), V(1.4, lerp(2.4, 2.1, u), 24), 50, 11, 2), t, 1.2) },
  // 2b · Lieutenant Onoda is sent to a jungle island: he jumps off the ramp onto the sand
  { t0: S2b, t1: S2c, set: 'isle', lt: DAY, at: V(2, 0, 28), act: t => act2(t),
    cam: (t, u) => hand(camAt(V(lerp(3.6, 3.3, u), lerp(1.15, 1.25, u), lerp(24.4, 25.0, eo(u))), SANDP.clone().add(V(-.2, 1.05, 0)), 44, 3.0, 5), t) },
  // 2c · Orders: never surrender: his officer jabs a finger at him
  { t0: S2c, t1: C3, set: 'isle', lt: DAY, at: V(2, 0, 28), act: t => act2(t),
    after: 1, cam: (t, u) => { const o = headOf(ONODA), ta = headOf(TANI), d = ta.clone().sub(o).setY(0).normalize(), pp = V(d.z, 0, -d.x), back_ = lerp(.95, .8, eo(u));
      return hand(camAt(o.clone().addScaledVector(d, -back_).addScaledVector(pp, .34).add(V(0, .1, 0)), ta.clone().add(V(0, -.1, 0)).addScaledVector(pp, -.1), 40, ta.distanceTo(o) + back_, 6), t); } },
  // 3a · 1945: the war ends — he is on patrol, rifle on his shoulder
  { t0: C3, t1: S3b, set: 'isle', lt: SHADE, at: V(-1, 0, -4), act: t => act3(t),
    cam: (t, u) => { const p = PATROL(t); return hand(camAt(p.clone().add(V(2.4, 1.0, 1.6)), p.clone().add(V(-.3, 1.05, 0)), 46, 2.9, 4), t, 1.1); } },
  // 3b · Planes drop leaflets: up through the gap in the canopy, a bomber roars over; paper rains down
  { t0: S3b, t1: S3c, set: 'isle', lt: DAY, at: V(0, 0, 0), act: t => act3(t), fpv: .4,
    cam: (t, u) => camAt(V(.4, 1.0, 2.4), V(lerp(-2, 3, u), 30, -6), 62, 30, 0, lerp(-.1, .1, u)) },
  // 3c · He's sure they're fake!: he catches one, reads it, smirks, flicks it away
  { t0: S3c, t1: C4, set: 'isle', lt: SHADE, at: READP, act: t => act3(t),
    after: 1, cam: (t, u) => { const h = headOf(ONODA); return hand(camAt(h.clone().add(V(lerp(.25, .16, u), -.1, lerp(1.3, 1.05, eo(u)))), h.clone().add(V(0, -.16, 0)), 42, lerp(1.32, 1.06, eo(u)), 6), t, .8); } },
  // 4 · Newspapers, letters from home… fake, fake, fake: at the lean-to, he flings them away one by one
  { t0: C4, t1: C5, set: 'isle', lt: SHADE, at: HIDEP, act: t => act4(t),
    cam: (t, u) => hand(camAt(HIDEP.clone().add(V(lerp(.45, .3, u), lerp(1.12, 1.18, u), lerp(2.5, 2.05, eio(u)))), HIDEP.clone().add(V(0, 1.12, 0)), 44, lerp(2.5, 2.05, eio(u)), 5), t, .7) },
  // 5 · He fights on… his raids kill about 30 villagers: dusk; from the treeline, a farm and its lit window; a slow push
  { t0: C5, t1: C6, set: 'isle', lt: DUSK, at: VILP, act: t => act5(t), dissolveOut: .35,
    cam: (t, u) => hand(camAt(V(lerp(29.8, 30.3, u), lerp(1.72, 1.64, u), lerp(1.2, .8, u)), V(LAY.village[0], lerp(1.0, 1.25, u), LAY.village[1] - 3.5), lerp(42, 38, u), 14, 2), t, .5) },
  // 6a · 1974: the tally tree is full; an older Onoda carves one more
  { t0: C6, t1: S6b, set: 'isle', lt: SHADE, at: TALLYP, act: t => act6(t),
    cam: (t, u) => hand(camAt(TL(lerp(.5, .35, u), lerp(1.36, 1.32, u), lerp(2.0, 1.7, eo(u))), TL(-.42, 1.26, .3), 44, 1.8, 5), t, .7) },
  // 6b · A backpacker goes looking for Onoda, a panda and the Abominable Snowman: walking the trail toward the lens
  { t0: S6b, t1: C7, set: 'isle', lt: SHADE, at: V(1, 0, 12), act: t => act6(t),
    cam: (t, u) => { const p = SUZW(t); return hand(camAt(p.clone().add(V(.35, 1.05, -2.3)), p.clone().add(V(0, 1.15, 0)), 46, 2.33, 4), t, 1.4); } },
  // 7a · He finds Onoda in 4 days!: night, the campfire; Onoda steps out of the bushes, rifle levelled; the backpacker waves
  { t0: C7, t1: S7b, set: 'isle', lt: NIGHT, at: FIREP, act: t => act7(t),
    cam: (t, u) => hand(camAt(FIREP.clone().add(V(lerp(1.6, 1.3, u), lerp(1.0, 1.08, u), lerp(1.9, 1.6, eo(u)))), FIREP.clone().add(V(-1.0, .95, -1.6)), 46, 2.7, 4), t, .8) },
  // 7b · But Onoda won't quit without orders: arms folded, firelit, shaking his head
  { t0: S7b, t1: C8, set: 'isle', lt: NIGHT, at: FIREP, act: t => act7(t),
    after: 1, cam: (t, u) => { const h = headOf(OLD); return hand(camAt(h.clone().add(V(lerp(.75, .6, u), -.12, lerp(1.25, 1.05, eo(u)))), h.clone().add(V(0, -.14, 0)), 42, 1.3, 6), t, .7); } },
  // 8a · Japan finds his old commander… now a bookseller: the shop, push in over the counter
  { t0: C8, t1: S8b, set: 'shop', lt: SHOP, at: SHP, act: t => act8(t),
    cam: (t, u) => hand(camAt(V(SHP.x + lerp(.6, .3, u), lerp(1.52, 1.45, u), SHP.z + lerp(2.6, 1.15, eio(u))), V(SHP.x + .02, 1.1, SHP.z - 1.15), lerp(46, 42, u), lerp(3.7, 2.3, eio(u)), 5), t, .6) },
  // 8b · …and flies him in: the airliner over the sea, toward the island
  { t0: S8b, t1: C9, set: 'isle', lt: SEA, at: V(0, 0, 80), act: t => act8(t), fpv: .5,
    cam: (t, u) => { const z = lerp(150, 110, u) - 6; return camAt(V(lerp(-13, -9, u), 21, z + 20), V(0, 26, z), 46, 24, 0, lerp(.12, .05, u)); } },
  // 9a · Order given. After 29 years…: the clearing; the old commander reads the order; Onoda salutes
  { t0: C9, t1: S9b, set: 'isle', lt: SHADE, at: V(0, 0, 0), act: t => act9(t),
    cam: (t, u) => hand(camAt(V(lerp(1.62, 1.45, u), lerp(1.25, 1.22, u), lerp(2.84, 2.55, eo(u))), V(.03, 1.12, .07), 46, 3.0, 4), t, .6) },
  // 9b · he surrenders…: he bows and offers up his rifle
  { t0: S9b, t1: S9c, set: 'isle', lt: SHADE, at: V(0, 0, 0), act: t => act9(t),
    after: 1, cam: (t, u) => { const h = headOf(OLD); return hand(camAt(h.clone().add(V(lerp(-.7, -.5, u), lerp(-.18, -.22, u), lerp(1.25, 1.05, eo(u)))), h.clone().add(V(0, -.25, 0)), 42, 1.3, 6), t, .5); } },
  // 9c · …and his rifle still works!: the rifle, gleaming; he grins behind it
  { t0: S9c, t1: LOOP, set: 'isle', lt: SHADE, at: V(0, 0, 0), act: t => act9(t),
    after: 1, cam: (t, u) => { const r = RIF.localToWorld(V(0, .55, 0)); return hand(camAt(r.clone().add(V(lerp(-.62, -.5, u), lerp(.12, .16, u), lerp(.95, .8, eo(u)))), r.clone().add(V(.02, .05, 0)), 40, lerp(1.13, .95, eo(u)), 7), t, .5); } },
];
SHOTS.push({ ...SHOTS[0], t0: LOOP, t1: DUR + 1, loop: 1 });

// ---------------- acting ----------------
function act1(t) {
  reset();
  if (t < S1b) {   // crouched in the leaves, rifle up, scanning
    put(ONODA, HOOKP, .15 + Math.sin(t * 1.6) * .05);
    apply(ONODA, P.ready, { t, seed: 1, face: 'angry', look: CAMP, eyes: [Math.sin(t * 3.2) > .2 ? .8 : Math.sin(t * 3.2) < -.6 ? -.8 : 0, 0], noBlink: 1 });
    rifleIn(ONODA);
  } else {   // standing at the tally tree, saluting at "ended"
    put(OLD, TALLYP, face(TALLYP, TL(-.3, 0, 3.4)));
    const sal = seg(t, tEnded - .35, tEnded - .05);
    apply(OLD, mix(P.attn, TP.salute, eo(sal)), { t, seed: 2, face: t > tEnded - .2 ? 'proud' : 'deadpan', look: CAMP });
    rifleSlung(OLD);
  }
}
function act2(t) {
  reset();
  // the boat at the shoreline, two soldiers aboard
  BOAT.updateMatrixWorld(true);
  put(SOL[0], BOAT.localToWorld(V(-.45, .62, .6)), BOAT.rotation.y + Math.PI); apply(SOL[0], P.port, { t, seed: 5, face: 'calm', look: SANDP.clone().add(V(0, 1.2, 0)) }); rifleIn(SOL[0], RIF2);
  put(SOL[1], BOAT.localToWorld(V(.5, .62, 1.6)), BOAT.rotation.y + Math.PI); apply(SOL[1], P.attn, { t, seed: 6, face: 'deadpan' });
  // Onoda: down the ramp, a hop onto the sand, then to attention in front of his officer
  const k = seg(t, S2b - .25, S2b + .5), p = V(lerp(2.25, SANDP.x, k), Math.sin(k * Math.PI) * .45, lerp(29.6, SANDP.z, eo(k)));
  const ry = t < S2c ? lerp(Math.PI, face(SANDP, V(3.3, 0, 25.0)), eo(seg(t, S2b + .3, S2b + .7))) : face(SANDP, TANP);
  put(ONODA, p, ry);
  const salute = t > tNever - .2;
  apply(ONODA, salute ? mix(P.attn, TP.salute, eo(seg(t, tNever - .2, tNever + .1))) : k < 1 && k > 0 ? walk(P.attn, t * 9, 1) : P.attn, { t, seed: 1, face: t > S2c ? (t > tSurr ? 'proud' : 'shock') : 'happy', look: t > S2c ? TANP.clone().add(V(0, 1.25, 0)) : CAMP });
  rifleSlung(ONODA);
  put(TANI, TANP, face(TANP, SANDP));
  const jab = t > S2c ? Math.max(0, Math.sin((t - S2c) * 16)) * .5 * (t < tSurr + .3 ? 1 : 0) : 0;
  apply(TANI, t > S2c - .1 ? { ...TP.pointFwd, aR: [-100 + jab * 18, 10, 0, 4 + jab * 20] } : TP.hips, { t, seed: 3, face: t > S2c ? 'angry' : 'smug', look: headOf(ONODA), talk: t > S2c && t < tSurr + .5 ? .5 + .5 * Math.sin(t * 24) : 0 });
}
// the leaflet rain: each sheet drops from the plane's pass and flutters down round the clearing
const NL = 70;
function leafRain(t) {
  LEAF.visible = true; const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = V(), s = V(1, 1, 1);
  for (let i = 0; i < NL; i++) {
    const t0 = tPlanes - .5 + hash(i) * .9, a = hash(i + 7) * 6.28, r = .6 + Math.sqrt(hash(i + 3)) * 6.5, fall = Math.max(0, t - t0);
    const y = Math.max(.03, 9 + hash(i + 9) * 3 - fall * (3.1 + hash(i + 2) * .8)), landed = y <= .03;
    p.set(Math.sin(a) * r + Math.sin(fall * 2.3 + i) * .5 * (landed ? 0 : 1), y, Math.cos(a) * r * .8 + .6 + Math.cos(fall * 1.9 + i) * .4 * (landed ? 0 : 1));
    e.set(landed ? -Math.PI / 2 : fall * (3 + hash(i + 5) * 4), fall * 2 + i, landed ? hash(i) * 6 : Math.sin(fall * 4 + i) * 1.2); q.setFromEuler(e);
    m.compose(p, q, t < t0 ? s.set(0, 0, 0) : s.set(1, 1, 1)); LEAF.setMatrixAt(i, m);
  }
  LEAF.instanceMatrix.needsUpdate = true;
}
function act3(t) {
  reset();
  if (t < S3b) {   // on patrol under the trees
    const p = PATROL(t); put(ONODA, p, face(V(-4.5, 0, -6.2), V(1.5, 0, -3.2)));
    apply(ONODA, walk(P.attn, t * 7.5, 1.1), { t, seed: 1, face: 'angry', look: CAMP }); rifleSlung(ONODA);
    return;
  }
  // the bomber overhead
  show(BOMBER); BOMBER.position.set(PLANEX(t), 34, -6); BOMBER.rotation.set(0, Math.PI / 2, Math.sin(t * .8) * .04); BOMBER.userData.spin(t); BOMBER.scale.setScalar(1);
  leafRain(t);
  put(ONODA, READP, t < S3c ? Math.PI : .2);
  if (t < S3c) { apply(ONODA, mix(P.attn, TP.cheer, .3), { t, seed: 1, face: 'shock', look: V(0, 30, -6) }); rifleSlung(ONODA); return; }
  // he plucks a sheet out of the air, reads it (deadpan → smug), and flicks it away on "fake"
  const tf = tFake0 - .08;
  if (t < tf) { apply(ONODA, P.read, { t, seed: 1, face: t < tHes + .25 ? 'deadpan' : 'smug', look: READP.clone().add(V(.05, .95, .45)), eyes: [0, -.6] }); between(ONODA, LF1, CAMP, .06); }
  else { apply(ONODA, mix(P.read, P.throwR, eo(seg(t, tf, tf + .15))), { t, seed: 1, face: 'smug', look: READP.clone().add(V(.3, 1.2, 2.2)) }); const from = headOf(ONODA).add(V(0, -.2, .1)); toss(LF1, from, t, tf, V(-.8, .2, -.6)); }
  rifleSlung(ONODA);
}
function act4(t) {
  reset();
  put(ONODA, HIDEP, .3);
  const f = [tF1, tF2, tF3].map(x => x - .1);
  let q = P.showTwo;
  if (t > f[0] - .1) q = mix(P.showTwo, P.throwR, eo(Math.max(0, 1 - Math.abs(t - (f.find(x => t < x + .35) ?? 99)) / .18)));
  const angry = t > f[0] - .15;
  apply(ONODA, q, { t, seed: 1, face: angry ? 'angry' : t < tLetters ? 'deadpan' : 'smug', look: CAMP, talk: angry ? Math.max(0, Math.sin((t - f[0]) * 20)) * .6 : 0 });
  const R = handOf(ONODA), L = handOf(ONODA, 1), dir = V(-.9, .3, -.7);
  // newspaper in the right hand, letter in the left, the family photo appears after the paper is gone
  if (t < f[0]) inHand(ONODA, NEWS, 0, CAMP); else toss(NEWS, R.clone().add(V(0, .1, 0)), t, f[0], dir);
  if (t > tLetters - .15 && t < f[1]) inHand(ONODA, LET, 1, CAMP); else if (t >= f[1]) toss(LET, L.clone().add(V(0, .1, 0)), t, f[1], dir.clone().set(.9, .3, -.7));
  if (t > f[0] + .15 && t < f[2]) inHand(ONODA, PHO, 0, CAMP); else if (t >= f[2]) toss(PHO, R.clone().add(V(0, .1, 0)), t, f[2], dir);
  RIF.visible = true; SET.isle.updateMatrixWorld(true); RIF.position.copy(HIDEP).add(V(-.75, 0, -.45)); RIF.rotation.set(-.22, 0, .05);   // leaning on the lean-to
}
function act5(t) {
  reset();
  // from the treeline at dusk: his back to us, watching the farm
  const p = VILP.clone().add(V(-.1, 0, -1.6)); put(ONODA, p, face(p, V(LAY.village[0], 0, LAY.village[1] - 4)));
  apply(ONODA, P.attn, { t, seed: 1, face: 'deadpan' }); rifleSlung(ONODA);
  const sm = SET.isle.userData.smoke; sm.forEach((s, i) => { const u = (t * .25 + i / sm.length) % 1; s.position.set(1.2 + u * .8, 3.6 + u * 3.4, -4.6 + u * .4); s.scale.setScalar(.6 + u * 1.8); s.material.opacity = .45 * (1 - u); });
}
function act6(t) {
  reset();
  if (t < S6b) {   // 1974: carving the 29th mark, the knife scratching
    put(OLD, TL(-.66, 0, .32), face(TL(-.66, 0, .32), TL(-.1, 0, .2)));
    const sc = Math.sin(t * 22) * 6;
    apply(OLD, { ...P.carve, aR: [P.carve.aR[0] + sc, 4, 0, 46 + sc] }, { t, seed: 2, face: 'deadpan', look: TL(-.1, 1.3, .4) });
    show(KNIFE); rifleSlung(OLD);
    return;
  }
  // the backpacker strides up the trail, beaming, looking around
  const p = SUZW(t); put(SUZ, p, Math.PI + Math.sin(t * 1.3) * .08);
  const look = [tOno6, tPanda, tAbom].reduce((a, x, i) => t > x - .1 ? i : a, -1);
  apply(SUZ, walk(look >= 0 ? TP.wave : TP.stand, t * 7, 1), { t, seed: 4, face: look >= 1 ? 'laugh' : 'happy', look: CAMP.clone().add(V(Math.sin(t * 2) * .8, 0, 0)) });
}
function act7(t) {
  reset(); FIRE.visible = true; LOG.visible = true; FIRE.userData.flicker(t);
  fireK = .85 + Math.sin(t * 17) * .1 + Math.sin(t * 31) * .05; bulb.position.copy(FIREP).add(V(0, .6, 0)); bulb.intensity = 5.5 * fireK; bulb.color.set('#FFA050');
  put(SUZ, SUZF, face(SUZF, FIREP) + (t > tFinds + .1 ? -1.0 : 0));
  const turned = t > tFinds + .1;
  apply(SUZ, turned ? (t > t4 - .1 ? TP.wave : P.sitFire) : P.sitFire, { t, seed: 4, face: turned ? (t > t4 - .1 ? 'laugh' : 'shock') : 'happy', look: turned ? ONO7.clone().add(V(0, 1.25, 0)) : FIREP.clone().add(V(0, .4, 0)) });
  SUZ.root.position.y = -.28;
  // Onoda steps out of the dark, rifle levelled; then lowers it and folds his arms
  const k = seg(t, C7 - .1, tOno7 + .3), p = ONO7.clone().add(V(lerp(-.9, 0, eo(k)), 0, lerp(-.6, 0, eo(k))));
  put(OLD, p, face(p, SUZF));
  if (t < S7b) { apply(OLD, k < 1 ? walk(P.aimPt, t * 8, .7) : P.aimPt, { t, seed: 2, face: 'angry', look: headOf(SUZ) }); rifleIn(OLD); }
  else { const shake = Math.sin((t - S7b) * 9) * 14 * (t < tWont + .6 ? 1 : .3); OLD.P.rotation.y = .68; OLD.P.updateMatrixWorld(true); apply(OLD, { ...TP.cross, hd: [-6, shake, 0] }, { t, seed: 2, face: 'angry', look: p.clone().add(V(.75, 1.25, 1.25)) }); rifleSlung(OLD); }
}
function act8(t) {
  reset();
  if (t < S8b) {   // the old Major, now a bookseller, reading behind his counter
    const p = V(SHP.x, 0, SHP.z - 1.15); put(OLDT, p, 0);
    const up = t > tBooks - .25;
    apply(OLDT, P.read, { t, seed: 3, face: up ? 'shock' : 'calm', look: up ? CAMP : V(SHP.x, 1.05, SHP.z - .75), eyes: up ? [0, 0] : [0, -.7] });
    between(OLDT, BOOK, headOf(OLDT), .02); if (up) { BOOK.position.y -= .12 * seg(t, tBooks - .25, tBooks); }
    return;
  }
  show(LINER); const z = lerp(150, 110, seg(t, S8b, C9)); LINER.position.set(0, 26, z - 6); LINER.rotation.set(.04, Math.PI, Math.sin(t * 1.2) * .06 - .12); LINER.userData.spin(t);
}
function act9(t) {
  reset();
  put(OLDT, MEETT, face(MEETT, MEETO)); put(OLD, MEETO, face(MEETO, MEETT));
  // the commander reads the order aloud
  const reading = t < S9b + .4;
  apply(OLDT, reading ? P.read : TP.offer, { t, seed: 3, face: reading ? 'calm' : 'smile', look: reading ? V(-.18, 1.0, .16) : MEETO.clone().add(V(0, 1.2, 0)), talk: t > tOrder9 - .05 && t < S9b ? .4 + .4 * Math.sin(t * 22) : 0, eyes: reading ? [0, -.6] : [0, 0] });
  if (reading) between(OLDT, ORD, t < S9b ? CAMP : headOf(OLDT), .06); else { ORD.visible = false; }
  if (t < S9b) {   // at the salute
    apply(OLD, TP.salute, { t, seed: 2, face: t > t29b ? 'worried' : 'deadpan', look: headOf(OLDT) }); rifleSlung(OLD);
  } else if (t < S9c) {   // the bow, rifle offered on both palms
    const k = eo(seg(t, S9b, S9b + .4)); apply(OLD, mix(P.attn, P.bow, k), { t, seed: 2, face: 'worried', look: headOf(OLDT), eyes: [0, -.4] });
    if (k > .3) rifleIn(OLD, RIF, .5, 'present'); else rifleSlung(OLD);
  } else {   // straightening, presenting it to us: it still works
    apply(OLD, { ...P.bow, sp: [6, 0, 0], hd: [-4, 0, 0] }, { t, seed: 2, face: t > tRifle ? 'proud' : 'smile', look: MEETO.clone().add(V(-.55, 1.15, .9)) });
    rifleIn(OLD, RIF, .5, 'present');
    const gl = Math.exp(-Math.pow((t - tWorks - .1) / .12, 2)); RIF.userData.glint.material.opacity = gl; RIF.userData.glint.scale.setScalar(1 + gl * 3);
  }
}

// ---------------- sound events (the score reads these) ----------------
ev(0, 'jungle', { d: S1b + .2 }); ev(.05, 'boom'); ev(tWar1 - .05, 'hit'); ev(S1b - .05, 'whoosh'); ev(t29a, 'counter', { d: .7 }); ev(tEnded, 'stamp');
ev(C2 - .05, 'whoosh'); ev(C2, 'waves', { d: C3 - C2 }); ev(t1944, 'pop'); ev(S2b + .1, 'splash'); ev(tOnoda2, 'pop'); ev(tNever - .02, 'stamp');
ev(C3 - .05, 'whoosh'); ev(t1945, 'pop'); ev(tEnds, 'ding'); ev(S3b - .5, 'plane', { d: 2.6 }); ev(tLeafl, 'flutter', { d: 1.4 }); ev(tFake0 - .02, 'stamp');
ev(C4, 'cut'); ev(tNews, 'paper'); ev(tLetters, 'paper'); for (const x of [tF1, tF2, tF3]) { ev(x - .1, 'swish'); ev(x, 'stamp'); }
ev(C5 - .1, 'whoosh'); ev(C5, 'somber', { d: C6 - C5 });
ev(C6 - .05, 'whoosh'); ev(t1974, 'pop'); ev(C6 + .1, 'scratch', { d: S6b - C6 - .1 }); for (const x of [tOno6, tPanda, tAbom]) ev(x, 'tick'); ev(tOrder6, 'ding');
ev(C7, 'fire', { d: C8 - C7 }); ev(tFinds, 'rustle'); ev(tOno7, 'cock'); ev(t4, 'pop'); ev(tWont, 'buzz');
ev(C8, 'bell'); ev(tCmdr, 'pop'); ev(tBooks, 'pop'); ev(S8b - .1, 'whoosh'); ev(S8b, 'jet', { d: C9 - S8b + .3 });
ev(C9, 'cut'); ev(tGiven, 'hit'); ev(t29b, 'counter', { d: .5 }); ev(tSurr9, 'swell'); ev(tWorks - .05, 'sting'); ev(tWorks + .05, 'shine');

// ---------------- the overlay: telops + the checklist + 1–3 word captions ----------------
const ov = document.getElementById('ov').getContext('2d');
const snap = document.createElement('canvas'); snap.width = W; snap.height = H; const sctx = snap.getContext('2d');
const TEL = [
  { t0: tWar1 - .1, t1: S1b + .2, text: 'WORLD WAR 2', y: 300, size: 120, col: '#FFFFFF', rot: -4, plate: '#4A5A2E' },
  { t0: t29a - .05, t1: C2, text: t => `${Math.round(1 + 28 * eo(seg(t, t29a - .05, t29a + .65)))} YEARS`, y: 300, size: 170, col: '#FFD23F', rot: -4, sub: 'AFTER IT ENDED' },
  { t0: t1944 - .05, t1: S2b + .3, text: '1944', y: 300, size: 170, col: '#FFD23F', rot: -5 },
  { t0: tLt - .05, t1: S2c + .1, text: 'LT. HIROO ONODA', y: 1440, size: 84, col: '#FFFFFF', rot: -3, plate: '#5A6A34', sub: 'LUBANG ISLAND, PHILIPPINES' },
  { t0: tNever - .05, t1: C3, text: 'NEVER SURRENDER', y: 520, size: 112, col: '#E8423A', rot: -7, stamp: 1 },
  { t0: t1945 - .05, t1: S3b + .1, text: '1945', y: 300, size: 170, col: '#FFD23F', rot: -5 },
  { t0: tEnds - .05, t1: S3b + .1, text: 'WAR OVER', y: 500, size: 110, col: '#FFFFFF', rot: 4, plate: '#2E7A4A' },
  { t0: tFake0 - .05, t1: C4, text: 'FAKE!', y: 1480, size: 170, col: '#E8423A', rot: -9, stamp: 1 },
  { t0: tF1 - .05, t1: C5, text: 'FAKE', y: 1010, size: 120, col: '#E8423A', rot: -10, stamp: 1, x: 270 },
  { t0: tF2 - .05, t1: C5, text: 'FAKE', y: 1010, size: 120, col: '#E8423A', rot: 8, stamp: 1, x: 810 },
  { t0: tF3 - .05, t1: C5, text: 'FAKE', y: 1470, size: 160, col: '#E8423A', rot: -5, stamp: 1 },
  { t0: t30 - .05, t1: C6, text: '~30 VILLAGERS KILLED', y: 330, size: 74, col: '#FFFFFF', rot: 0, plate: '#2A2A30', calm: 1 },
  { t0: t1974 - .05, t1: S6b + .2, text: '1974', y: 300, size: 170, col: '#FFD23F', rot: -5, sub: 'STILL FIGHTING' },
  { t0: t4 - .05, t1: S7b + .1, text: '4 DAYS', y: 620, size: 140, col: '#FFFFFF', rot: 4, plate: '#C8642A' },
  { t0: S7b + .1, t1: C8, text: 'NO ORDERS = NO SURRENDER', y: 300, size: 70, col: '#FFFFFF', rot: -3, plate: '#8A2A22' },
  { t0: tCmdr - .1, t1: S8b, text: 'MAJ. TANIGUCHI', y: 1440, size: 86, col: '#FFFFFF', rot: -3, plate: '#5A6A34', sub: 'HIS OLD COMMANDER' },
  { t0: tBooks - .05, t1: S8b, text: 'NOW: BOOKSELLER', y: 300, size: 100, col: '#FFD23F', rot: 4, plate: '#1B1213' },
  { t0: tOrder9 - .05, t1: S9b + .1, text: 'MARCH 9, 1974', y: 300, size: 110, col: '#FFFFFF', rot: -3, plate: '#2E5A7A' },
  { t0: tSurr9 - .05, t1: S9c + .1, text: 'SURRENDERED', y: 1480, size: 120, col: '#FFFFFF', rot: -6, stamp: 1 },
  { t0: tWorks - .05, t1: LOOP, text: 'STILL WORKS', y: 1460, size: 130, col: '#4ADB6A', rot: -6, stamp: 1, sub: '+ 500 ROUNDS' },
];
function drawTelop(x, t) {
  const p = seg(t, x.t0, x.t0 + .25), sc = x.calm ? lerp(.92, 1, eo(p)) : x.stamp ? lerp(2.2, 1, eo(p)) : back(p, 2.6), wob = x.calm ? 1 : 1 + .02 * Math.sin((t - x.t0) * 8);
  const text = typeof x.text === 'function' ? x.text(t) : x.text;
  ov.save(); ov.translate(x.x ?? 540, x.y); ov.rotate(x.rot * Math.PI / 180); ov.scale(sc * wob, sc * wob); if (x.stamp || x.calm) ov.globalAlpha = clamp(p * 3);
  ov.font = `900 ${x.size}px Montserrat`; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  const tw = Math.min(1000, ov.measureText(text).width + 70), th = x.size * 1.4;
  if (x.plate) { ov.fillStyle = 'rgba(0,0,0,.85)'; ov.beginPath(); ov.roundRect(-tw / 2 + 10, -th / 2 + 12, tw, th, 28); ov.fill(); ov.fillStyle = x.plate; ov.beginPath(); ov.roundRect(-tw / 2, -th / 2, tw, th, 28); ov.fill(); }
  if (x.stamp) { ov.strokeStyle = x.col; ov.lineWidth = 14; ov.beginPath(); ov.roundRect(-tw / 2 + 5, -th / 2 + 8, tw - 10, th - 16, 18); ov.stroke(); }
  ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 20; ov.shadowOffsetY = 8; ov.lineWidth = x.size * .2; ov.strokeStyle = '#000'; ov.strokeText(text, 0, 4, 960); ov.shadowColor = 'transparent'; ov.fillStyle = x.col; ov.fillText(text, 0, 4, 960);
  if (x.sub) { ov.font = '900 46px Montserrat'; const sw = ov.measureText(x.sub).width + 44; ov.fillStyle = '#FFD23F'; ov.beginPath(); ov.roundRect(-sw / 2, x.size * .7 + 4, sw, 66, 18); ov.fill(); ov.fillStyle = '#1B1213'; ov.fillText(x.sub, 0, x.size * .7 + 39); }
  ov.restore();
}
// the backpacker's list: a notebook page; items pop on their words, numbers on "in that order", Onoda gets ticked off
const LIST = [['LT. ONODA', tOno6], ['A PANDA', tPanda], ['ABOMINABLE SNOWMAN', tAbom]];
function drawList(t) {
  const on = (t >= tGoes - .1 && t < C7) || (t >= C7 && t < S7b), small = t >= C7, p = seg(t, tGoes - .1, tGoes + .2);
  if (!on) return;
  ov.save(); ov.translate(540, small ? 300 : 430); const s = (small ? .78 : 1) * (small ? 1 : back(p, 2.2)); ov.scale(s, s); ov.rotate(-.03);
  const wd = 900, ht = 420; ov.fillStyle = 'rgba(0,0,0,.5)'; ov.beginPath(); ov.roundRect(-wd / 2 + 12, -ht / 2 + 16, wd, ht, 22); ov.fill();
  ov.fillStyle = '#FBF6E6'; ov.beginPath(); ov.roundRect(-wd / 2, -ht / 2, wd, ht, 22); ov.fill(); ov.strokeStyle = '#1B1213'; ov.lineWidth = 8; ov.stroke();
  ov.strokeStyle = 'rgba(80,120,200,.35)'; ov.lineWidth = 3; for (let y = -ht / 2 + 110; y < ht / 2; y += 96) { ov.beginPath(); ov.moveTo(-wd / 2 + 20, y + 52); ov.lineTo(wd / 2 - 20, y + 52); ov.stroke(); }
  ov.fillStyle = '#C8283A'; ov.font = '900 54px Montserrat'; ov.textAlign = 'left'; ov.textBaseline = 'middle'; ov.fillText('TO FIND:', -wd / 2 + 40, -ht / 2 + 56);
  LIST.forEach(([txt, t0], i) => { if (t < t0 - .08) return; const y = -ht / 2 + 150 + i * 96, k = back(seg(t, t0 - .08, t0 + .15), 2.4);
    ov.save(); ov.translate(-wd / 2 + 70, y); ov.scale(k, k);
    ov.strokeStyle = '#1B1213'; ov.lineWidth = 6; ov.strokeRect(-26, -26, 52, 52);
    const ticked = i === 0 && t > tOno7 - .05; if (ticked) { const kk = seg(t, tOno7 - .05, tOno7 + .15); ov.strokeStyle = '#2E9A3A'; ov.lineWidth = 14; ov.lineCap = 'round'; ov.beginPath(); ov.moveTo(-20, 0); ov.lineTo(-20 + 16 * Math.min(1, kk * 2), 18 * Math.min(1, kk * 2)); if (kk > .5) ov.lineTo(-4 + 40 * (kk - .5) * 2, 18 - 52 * (kk - .5) * 2); ov.stroke(); }
    ov.fillStyle = '#1B1213'; ov.font = `700 ${i === 2 ? 50 : 64}px Fredoka`; ov.fillText(txt, 54, 4);
    if (t > tIn6 - .05) { const n = back(seg(t, tIn6 - .05 + i * .12, tIn6 + .15 + i * .12), 3); if (n > 0) { ov.save(); ov.translate(wd - 125, 0); ov.scale(n, n); ov.fillStyle = '#C8283A'; ov.beginPath(); ov.arc(0, 0, 34, 0, 7); ov.fill(); ov.fillStyle = '#FFFFFF'; ov.font = '900 44px Montserrat'; ov.textAlign = 'center'; ov.fillText(String(i + 1), 0, 3); ov.restore(); } }
    ov.restore(); });
  ov.restore();
}
const chunks = [];
TMJ.lines.forEach((l, li) => { let cur = []; const flush = () => { if (cur.length) chunks.push({ li, words: cur }); cur = []; };
  l.words.forEach(x => { const len = cur.reduce((a, y) => a + y.w.length + 1, 0) + x.w.length; if (cur.length && (len > 14 || cur.length >= 3)) flush(); cur.push(x); if (/[,.…!?:]$/.test(x.w)) flush(); }); flush(); });
chunks.forEach((c, i) => { const n = chunks[i + 1]; c.text = c.words.map(x => x.w).join(' '); c.a = c.words[0].t0 - .04; c.b = n ? Math.min(n.words[0].t0 - .04, c.words[c.words.length - 1].t1 + .6) : c.words[c.words.length - 1].t1 + .6; });
const CAPY = 1180;
function drawCaption(t) {
  const c = chunks.find(c => t >= c.a && t < c.b); if (!c) return;
  const pop = back(seg(t, c.a, c.a + .12), 2.2), s = lerp(.6, 1, pop), y = (t >= tGoes - .1 && t < C7) ? 1300 : CAPY;
  ov.save(); ov.translate(W / 2, y); ov.scale(s, s); ov.font = '900 104px Montserrat'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 22; ov.shadowOffsetY = 8; ov.lineWidth = 26; ov.strokeStyle = '#000'; ov.strokeText(c.text, 0, 0, 1000);
  ov.shadowColor = 'transparent'; ov.fillStyle = '#FFFFFF'; ov.fillText(c.text, 0, 0, 1000); ov.restore();
}

// ---------------- render ----------------
function frame(sh, t) {
  const tt = sh.loop ? 0 : t, u = sh.loop ? 0 : seg(t, sh.t0, sh.t1);
  for (const [k, s] of Object.entries(SET)) s.visible = k === sh.set;
  light(sh.lt, sh.at);
  WIND.value = tt; SET.isle.userData.hutWin.material.color.set(sh.lt === DUSK ? '#FFD890' : '#3A2A1A');
  let c = sh.after ? null : sh.cam(tt, u); if (c) CAMP.copy(c.pos);
  sh.act(tt);
  if (!c) { c = sh.cam(tt, u); CAMP.copy(c.pos); }
  camera.position.copy(c.pos); sky.position.copy(c.pos); camera.up.set(0, 1, 0); camera.lookAt(c.look); camera.rotateZ(c.roll ?? 0); camera.fov = c.fov; camera.updateProjectionMatrix();
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
  if (QS.get('poster')) { ov.clearRect(0, 0, W, H); [['HE KEPT FIGHTING WW2', 170, -4, '#FFFFFF', 96], ['FOR 29 MORE YEARS', 310, -4, '#FFD23F', 112]].forEach(([text, y, rot, col, size]) => drawTelop({ t0: -9, text, y, size, col, rot }, t)); return; }
  if (QS.get('clean')) return;
  if (t < LOOP) { TEL.forEach(x => { if (t >= x.t0 && t < x.t1) drawTelop(x, t); }); drawList(t); drawCaption(t); }
}
function texts(t) { if (t >= LOOP) return []; return TEL.filter(x => typeof x.text === 'string' && t >= x.t0 + .3 && t < x.t1).map(x => ({ id: x.text, text: x.text, x0: 60, y0: x.y - x.size * .7, x1: 1020, y1: x.y + x.size * .7 })); }
EV.sort((a, b) => a.t - b.t);
window.DUR = +(B0 - A0).toFixed(3); window.EV = EV; window.render = t => render(t + A0); window.TEXTS = t => texts(t + A0);
render(A0);
window.READY = true;
