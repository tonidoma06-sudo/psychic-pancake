// "Pepsi's Navy" · 3D vertical Short (1080×1920) in the v4 toon style: how the Soviet Union paid PepsiCo for cola in vodka
// (1972) and then in warships (1989): 17 old submarines, a cruiser, a frigate and a destroyer, sold straight off for scrap.
// Outlined toon cast with big 2D faces, a camera that never sits still, 1–3 word captions. Every shot, action, telop and
// caption is placed from timing.json (the voice). render(t) is pure in t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { makePost } from '/core/three/post.js';
import { makeToon, apply, TP, mix, walk, TM, G } from './toon.js';
import { harbor, expo, office, store, wh, sub, warship, colaBottle, cup, camera as flashCam, rubles, note, vodka, crate, contract, brick, handset, bigKey, priceTag, SEA_Y, SUBS, SHIPS, HOOK, SCRAP } from './sets_navy.js';
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
const camera = new THREE.PerspectiveCamera(45, W / H, .03, 3000);
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
const bulb = new THREE.PointLight('#FFD8A0', 0, 9, 1.6); scene.add(bulb);
const WINTER = { pos: [-40, 30, 30], col: '#FFE6CC', int: 2.4, hs: '#CFDCE8', hg: '#6A6C72', hemi: 1.25, fog: ['#B4C0CC', 70, 520], sky: ['#6E86A2', '#D6DCE2', [-.5, .25, .6], '#FFE8D0'], env: .35, r: 26, warm: .02 };
const SUMMER = { pos: [-20, 40, 24], col: '#FFF1DA', int: 3.1, hs: '#C8E8FF', hg: '#8A8060', hemi: 1.05, fog: ['#CFE0EC', 80, 500], sky: ['#2A78E0', '#E4EEF2', [-.4, .5, .6], '#FFF6D8'], env: .35, r: 10, warm: .12 };
const OFFICE = { pos: [2.5, 6, 4], col: '#FFE6C4', int: 1.7, hs: '#FFF0DA', hg: '#6A4A36', hemi: .95, env: .5, r: 7, bg: '#2A2420', warm: .22, bulb: 4 };
const STORE = { pos: [2, 6, 5], col: '#FFF6E6', int: 2.0, hs: '#F6F2EA', hg: '#6A5A4A', hemi: 1.0, env: .5, r: 7, bg: '#2A2622', warm: .14, bulb: 2 };
const WH = { pos: [-3, 6, 5], col: '#FFF4E0', int: 2.2, hs: '#E8F0FF', hg: '#7A6A50', hemi: 1.0, env: .5, r: 7, bg: '#2A2A30', warm: .08 };
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
const SET = { harbor: harbor(), expo: expo(), office: office(), store: store(), wh: wh() };
for (const s of Object.values(SET)) { s.visible = false; scene.add(s); }
const EXO = V(3000, 0, 0), OFO = V(3000, 0, 1000), STO = V(4000, 0, 0), WHO = V(4000, 0, 1000);
SET.expo.position.copy(EXO); SET.office.position.copy(OFO); SET.store.position.copy(STO); SET.wh.position.copy(WHO);
const HB = SET.harbor.userData, OF = SET.office.userData;
const E = (x, y, z) => EXO.clone().add(V(x, y, z)), O = (x, y, z) => OFO.clone().add(V(x, y, z)), S = (x, y, z) => STO.clone().add(V(x, y, z)), WP = (x, y, z) => WHO.clone().add(V(x, y, z));

// ---------------- cast ----------------
const suit = (o) => ({ outfit: 'suit', shoe: '#1A1416', ...o });
const KEN = makeToon(suit({ name: 'kendall', top: '#2E3A58', pants: '#2A3450', tie: '#C8283A', pocketSq: '#F4F1EA', hair: 'slick', hairC: '#2A2018' }));
const KEN89 = makeToon(suit({ name: 'kendall89', top: '#2E3A58', pants: '#2A3450', tie: '#C8283A', pocketSq: '#F4F1EA', hair: 'slick', hairC: '#CFCBC2', seed: 3 }));
const KCAP = makeToon(suit({ name: 'kendallCap', top: '#2E3A58', pants: '#2A3450', tie: '#C8283A', pocketSq: '#F4F1EA', hair: 'peak', hatC: '#F4F4F2', bandC: '#1A1E2C', hairC: '#CFCBC2', seed: 3 }));
const LEAD = makeToon(suit({ name: 'leader', top: '#8C8C82', pants: '#7A7A70', tie: '#3A3A3E', pocketSq: '#F4F1EA', hair: 'bald', hairC: '#C8C2B4', blush: 1 }));
const OFF = makeToon(suit({ name: 'official', top: '#4E5246', pants: '#40443A', tie: '#7A2A22', hair: 'ushanka', hatC: '#5A4636', topC: '#3A3A40', star: 1, mustache: '#3A2E26', medals: 1 }));
const ADM = makeToon(suit({ name: 'admiral', top: '#1E2436', pants: '#1A1F2E', tie: '#141018', hair: 'peak', hatC: '#1C2030', bandC: '#141018', hairC: '#B8B4AC', mustache: '#D0CCC4', medals: 2, uniform: 1 }));
const ADV = makeToon(suit({ name: 'adviser', top: '#2A2E38', pants: '#262A32', tie: '#1E3A7A', hair: 'slick', hairC: '#E0DCD4', glasses: 'round' }));
const PHO = [0, 1].map(i => makeToon(suit({ name: 'photo' + i, top: ['#5A5048', '#4A5058'][i], pants: '#3A3634', tie: '#2A2A2E', hair: 'slouch', hatC: ['#4A4440', '#3A3A3E'][i], seed: 11 + i })));
const EXT = [0, 1].map(i => makeToon(suit({ name: 'extra' + i, top: ['#6A6A62', '#7A6450'][i], pants: '#4A4A44', tie: '#3A2A2A', hair: i ? 'bob' : 'messy', hairC: ['#3A2A20', '#8A5A30'][i], seed: 21 + i })));
const CAST = [KEN, KEN89, KCAP, LEAD, OFF, ADM, ADV, ...PHO, ...EXT]; CAST.forEach(p => scene.add(p.P));
// props
const CUP = cup(), BOT = colaBottle(), BOT2 = colaBottle(), RUBS = rubles(), NOTE = note(), CRATE = crate(), VOD = vodka(), CON = contract(), BRICK = brick(), HSET = handset(), KEY = bigKey(), TAG = priceTag();
const MODEL = warship('destroyer'); MODEL.scale.setScalar(.012);
const CAMS = [flashCam(), flashCam()];
const PEN = G(); TM(new THREE.CylinderGeometry(.007, .007, .14, 8), '#1A1A1E', PEN, 0, 0, 0, .002); TM(new THREE.ConeGeometry(.007, .02, 8), '#E8B848', PEN, 0, -.08, 0, 0).rotation.x = Math.PI;
const HOOKSUB = sub({ num: 412, seed: 40, rust: 1.2 }); SET.harbor.add(HOOKSUB);
const PROPS = [CUP, BOT, BOT2, RUBS, NOTE, CRATE, VOD, CON, BRICK, HSET, KEY, TAG, MODEL, PEN, ...CAMS];
PROPS.forEach(o => scene.add(o));
// spray (the hook sub surfacing) and bubbles (the deal sinking)
const SPRAY = new THREE.InstancedMesh(new THREE.SphereGeometry(.18, 8, 6), new THREE.MeshStandardMaterial({ color: '#F4F8FA', roughness: .6 }), 160); SPRAY.frustumCulled = false; SET.harbor.add(SPRAY);
const FOAM = new THREE.Mesh(new THREE.RingGeometry(1, 1.6, 48), new THREE.MeshBasicMaterial({ color: '#E8F2F6', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); FOAM.rotation.x = -Math.PI / 2; SET.harbor.add(FOAM);
const BUBS = new THREE.InstancedMesh(new THREE.SphereGeometry(.05, 8, 6), new THREE.MeshStandardMaterial({ color: '#E8F4F8', roughness: .2, transparent: true, opacity: .8 }), 40); BUBS.frustumCulled = false; SET.harbor.add(BUBS);

// ---------------- key times (from the voice) ----------------
const C2 = cut('L2'), C3 = cut('L3'), C4 = cut('L4'), C5 = cut('L5'), C6 = cut('L6'), C7 = cut('L7'), C8 = cut('L8'), C9 = cut('L9');
const tPaid = w('L1', 'paid'), tWith = w('L1', 'with'), t17a = w('L1', '17'), tSubs1 = w('L1', 'submarines');
const t1959 = w('L2', '1959'), tBoss2 = w('L2', 'pepsis'), tLeader = w('L2', 'leader'), tTry = w('L2', 'try'), tPepsi2 = w('L2', 'pepsi', 1), tOnCam = w('L2', 'on'), tCamera = w('L2', 'camera');
const t1972 = w('L3', '1972'), tWant3 = w('L3', 'want'), tBut3 = w('L3', 'but'), tMoney = w('L3', 'money'), tUseless = w('L3', 'useless'), tUSSR = w('L3', 'ussr');
const tPay4 = w('L4', 'pay'), tVodka = w('L4', 'vodka'), tPepsi4 = w('L4', 'pepsi'), tStoli = w('L4', 'stolichnaya'), tAll = w('L4', 'all'), tAmerica = w('L4', 'america');
const t1989 = w('L5', '1989'), tWant5 = w('L5', 'want'), tMore = w('L5', 'more'), tThis = w('L5', 'this'), tPay5 = w('L5', 'pay'), tWarships = w('L5', 'warships');
const t17b = w('L6', '17'), tSubs6 = w('L6', 'submarines'), tCruiser = w('L6', 'cruiser'), tFrigate = w('L6', 'frigate'), tDestroyer = w('L6', 'destroyer');
const tJokes = w('L7', 'jokes'), tWhite = w('L7', 'white'), tWere = w('L7', 'were'), tDisarm = w('L7', 'disarming'), tFaster = w('L7', 'faster'), tYou = w('L7', 'you');
const tSixth = w('L8', 'sixth'), tNavy = w('L8', 'navy'), tNot = w('L8', 'not'), tClose = w('L8', 'close'), tShips = w('L8', 'ships'), tRusty = w('L8', 'rusty'), tJunk = w('L8', 'junk'), tSold = w('L8', 'sold'), tScrap = w('L8', 'scrap');
const tSigns = w('L9', 'signs'), t3 = w('L9', '3'), tBillion = w('L9', 'billion'), tDeal9 = w('L9', 'deal'), tAnd9 = w('L9', 'and'), tColl = w('L9', 'collapses'), tThe9 = w('L9', 'the', 2), tSinks = w('L9', 'sinks');
const C3x = Math.max(C3, Math.min(t1972 - .08, tCamera + .6)), C7x = C7 + .3;   // the press photo and the receipt hold a beat into the next line
const S1b = tWith - .06, S2b = tBoss2 - .08, S3b = tMoney - .08, S4b = tPepsi4 - .08, S5b = tThis - .08, S6b = tCruiser - .1, S7b = tWhite - .1, S7c = tFaster - .06, S8b = tShips - .08, S8c = tSold - .08, S9b = tAnd9 - .05, S9c = tThe9 - .08;

// ---------------- helpers ----------------
const put = (p, v, ry = 0) => { p.P.visible = true; p.P.position.copy(v); p.P.rotation.set(0, ry, 0); p.P.updateMatrixWorld(true); };
const show = (...ps) => PROPS.forEach(o => o.visible = ps.includes(o));
const CAMP = new THREE.Vector3(0, 1.4, 6);
const headOf = p => { p.P.updateMatrixWorld(true); return p.head.getWorldPosition(V(0, 0, 0)); };
const handOf = (p, left = 0) => { p.P.updateMatrixWorld(true); return (left ? p.aL : p.aR).hand.getWorldPosition(V(0, 0, 0)); };
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
function reset() {
  CAST.forEach(p => p.P.visible = false); show(); HOOKSUB.visible = false; SPRAY.visible = false; FOAM.visible = false; BUBS.visible = false;
  for (const o of PROPS) { scene.add(o); o.rotation.set(0, 0, 0); o.scale.setScalar(o === MODEL ? .012 : 1); }
  NOTE.userData.droop(0); CAMS.forEach(c => c.userData.flash(0)); CON.userData.sig.scale.x = 1;
  HB.subs.forEach(s => { s.userData.scopes.forEach(sp => sp.rotation.set(0, 0, 0)); s.userData.hatch.position.set(0, 1.66, -4.2); s.userData.hatch.rotation.set(0, 0, 0); });
  OF.flag.rotation.set(0, 0, 0); OF.crack.material.opacity = 0; OF.debris.visible = false; OF.chand.rotation.set(0, 0, 0); OF.setYear(1972);
  HB.magnet.visible = false; HB.chunk.visible = false; HB.sparks.visible = false;
}
// a prop in a hand (offset in the hand's frame), or placed in the world
function inHand(p, o, left = 0, look = null, dy = .04) { o.visible = true; scene.add(o); o.position.copy(handOf(p, left)).add(V(0, dy, 0)); if (look) o.lookAt(look); }
function onHand(p, o, left = 0, pos = [0, 0, 0], rot = [0, 0, 0]) { o.visible = true; (left ? p.aL : p.aR).props.add(o); o.position.set(...pos); o.rotation.set(...rot); }
const at = (o, v, rot = [0, 0, 0], s) => { o.visible = true; scene.add(o); o.position.copy(v); o.rotation.set(...rot); if (s) o.scale.setScalar(s); };

// ---------------- poses (degrees, see toon.js) ----------------
const P = {
  attn:   { sp: [-3, 0, 0], hd: [-3, 0, 0], aL: [0, 6, 0, 4], aR: [0, 6, 0, 4], lL: [0, 1, 0], lR: [0, 1, 0] },
  phone:  { sp: [-4, 0, 0], hd: [-4, 0, 10], aL: [-20, 18, 0, 70], aR: [-150, 46, 0, 150], lL: [0, 4, 0], lR: [6, 4, 0] },
  drink:  { sp: [-10, 0, 0], hd: [-22, 0, 0], aL: [-10, 14, 0, 30], aR: [-128, 14, 0, 118], lL: [0, 4, 0], lR: [0, 4, 0] },
  hold:   { sp: [2, 0, 0], hd: [6, 0, 0], aL: [0, 8, 0, 6], aR: [-62, 10, 0, 64], lL: [0, 4, 0], lR: [0, 4, 0] },          // a thing held up in front, looked at
  give:   { sp: [8, 0, 0], hd: [0, 0, 0], aL: [0, 8, 0, 6], aR: [-78, 4, 0, 16], lL: [0, 4, 0], lR: [0, 4, 0] },          // right arm out, offering
  sign:   { sp: [26, 0, 0], hd: [16, 0, 0], aL: [-58, 10, 0, 40], aR: [-62, 4, 0, 58], lL: [0, 4, 0], lR: [0, 4, 0] },
  slam:   { sp: [18, 0, 0], hd: [-4, 0, 0], aL: [-62, 20, 0, 30], aR: [-62, 20, 0, 30], lL: [0, 6, 0], lR: [0, 6, 0] },
  snap:   { sp: [-6, 0, 0], hd: [-8, 0, 6], aL: [0, 10, 0, 6], aR: [-110, 30, 0, 90], lL: [0, 4, 0], lR: [0, 4, 0] },
  shoot:  { sp: [10, 0, 0], hd: [6, 0, 0], aL: [-80, -16, 0, 96], aR: [-80, 16, 0, 96], lL: [10, 6, 0], lR: [-6, 6, 0] },      // a camera at the face
  lean:   { sp: [-8, 0, 6], hd: [-8, 0, 0], aL: [0, 10, 0, 10], aR: [-40, 40, 0, 50], lL: [0, 4, 0], lR: [12, 10, 0] },
};

// ---------------- camera language ----------------
const camAt = (pos, look, fov = 45, focus, aper = 4, roll = 0) => ({ pos, look, fov, focus: focus ?? pos.distanceTo(look), aper, roll });
const hand = (c, t, a = 1) => { c.pos.x += noise(t, 1) * .012 * a; c.pos.y += noise(t, 2) * .01 * a; c.look.x += noise(t, 3) * .02 * a; c.look.y += noise(t, 4) * .016 * a; return c; };
const shake = (c, t, k) => { c.pos.x += Math.sin(t * 61) * .03 * k; c.pos.y += Math.sin(t * 47 + 1) * .03 * k; c.look.x += Math.sin(t * 53 + 2) * .05 * k; return c; };
const HK = V(HOOK.ken[0], 0, HOOK.ken[1]), HA = V(HOOK.ken[0] + .85, 0, HOOK.ken[1] - .3);   // the quay spot: Kendall, the admiral
const SUB8 = SUBS[8], SAIL8 = V(SUB8.x, SEA_Y + .5 + 3.92, SUB8.z - 1.6);                      // the sub he stands on (aft end of its sail top)
const SAILCAM = V(-1.5, -.35, 2.7), SAILRY = Math.atan2(SAILCAM.x, SAILCAM.z);                 // the sun side, facing him
const KD = O(.15, 0, -.1), OD = O(-.05, 0, -2.2);                                               // office: visitor (Kendall), the official behind the desk
const BOOTHK = E(.25, 0, -.55), BOOTHL = E(-.1, 0, .9);                                         // the booth: Kendall behind the counter, the leader in front

const SHOTS = [
  // 1a · the Soviet Union once paid Pepsi…: on a snowy quay the admiral hands Kendall a big brass key tagged SUB
  { t0: 0, t1: S1b, set: 'harbor', lt: WINTER, at: HK, act: t => act1(t),
    cam: (t, u) => hand(camAt(HK.clone().add(V(lerp(.5, .42, u), lerp(1.45, 1.4, u), lerp(-4.4, -3.8, eo(u)))), HK.clone().add(V(.42, 1.1, -.1)), 40, 4.0, 5), t) },
  // 1b · …with 17 submarines!: a sub bursts up behind them; pull back and up to the whole row
  { t0: S1b, t1: C2, set: 'harbor', lt: WINTER, at: V(30, 0, 8), act: t => act1(t),
    cam: (t, u) => { const k = eio(seg(t, tSubs1 - .1, C2)); return hand(camAt(V(lerp(62.9, 80, k), lerp(1.9, 14, k), lerp(-6.4, -12, k)), V(lerp(62.6, 30, k), lerp(2.2, -1, k), lerp(8, 16, k)), lerp(54, 48, k), lerp(9, 40, k), lerp(2.5, .5, k)), t, 1.2 - k); } },
  // 2a · 1959: the cola booth at the exhibition in Moscow, the gold dome behind
  { t0: C2, t1: S2b, set: 'expo', lt: SUMMER, at: EXO, act: t => act2(t),
    cam: (t, u) => hand(camAt(E(lerp(-1.5, -1.1, u), lerp(1.2, 1.4, u), lerp(9.6, 8.4, eo(u))), E(.1, lerp(2.6, 2.3, u), 0), 46, 8.6, 2), t) },
  // 2b · Pepsi's boss gets the Soviet leader to try a Pepsi, on camera
  { t0: S2b, t1: C3x, set: 'expo', lt: SUMMER, at: EXO, act: t => act2(t),
    cam: (t, u) => hand(camAt(E(lerp(1.22, 1.12, u), lerp(1.62, 1.58, u), lerp(-1.6, -1.4, eo(u))), E(-.3, 1.08, .95), 40, 2.85, 5), t) },
  // 3a · 1972: the official in his office, a bottle of cola hugged to his chest
  { t0: C3x, t1: S3b, set: 'office', lt: OFFICE, at: OFO, act: t => act3(t),
    cam: (t, u) => hand(camAt(O(lerp(.9, .8, u), lerp(1.62, 1.58, u), lerp(1.25, 1.0, eo(u))), O(-.18, 1.06, -2.2), 40, 3.5, 5), t) },
  // 3b · …but their money is useless outside the USSR: a rouble note wilts in Kendall's hand
  { t0: S3b, t1: C4, set: 'office', lt: OFFICE, at: OFO, act: t => act3(t),
    cam: (t, u) => hand(camAt(O(lerp(-.08, -.02, u), lerp(1.3, 1.28, u), lerp(-1.55, -1.4, eo(u))), O(.12, 1.02, -.1), 40, 1.4, 6), t, .6) },
  // 4a · So they pay… in vodka!: a crate slides across the desk
  { t0: C4, t1: S4b, set: 'office', lt: OFFICE, at: OFO, act: t => act4(t),
    cam: (t, u) => hand(camAt(O(lerp(-1.0, -.85, u), lerp(1.4, 1.36, u), lerp(1.3, 1.1, eo(u))), O(-.05, 1.02, -1.6), 44, 2.9, 5), t) },
  // 4b · Pepsi starts selling Stolichnaya all over America: the store shelves fill up
  { t0: S4b, t1: C5, set: 'store', lt: STORE, at: STO, act: t => act4(t),
    cam: (t, u) => hand(camAt(S(lerp(-.4, .3, u), lerp(1.3, 1.4, u), lerp(4.8, 4.2, eo(u))), S(lerp(-.1, .2, u), .98, -1.4), 46, 4.8, 3), t) },
  // 5a · 1989: the official, older, downs a whole bottle; Kendall, grey now, watches
  { t0: C5, t1: S5b, set: 'office', lt: OFFICE, at: OFO, act: t => act5(t),
    cam: (t, u) => hand(camAt(O(lerp(.9, .8, u), lerp(1.62, 1.58, u), lerp(1.25, 1.0, eo(u))), O(-.18, 1.08, -2.2), 40, 3.5, 5), t) },
  // 5b · This time, they pay… in warships!: a model warship lands on the desk in front of him
  { t0: S5b, t1: C6, set: 'office', lt: OFFICE, at: OFO, act: t => act5(t),
    cam: (t, u) => hand(camAt(O(lerp(-.42, -.36, u), lerp(1.0, .98, u), lerp(-1.95, -1.85, eo(u))), O(.1, 1.02, -.5), 42, .62, 7), t, .6) },
  // 6a · 17 old submarines: glide along the row from above the quay
  { t0: C6, t1: S6b, set: 'harbor', lt: WINTER, at: V(0, 0, 14), act: t => act6(t), fpv: .3,
    cam: (t, u) => { const x = lerp(52, -6, eio(u)); return camAt(V(x, lerp(9, 7, u), -6), V(x - 22, -1, 18), 50, 30, .5, -.04); } },
  // 6b · a cruiser, a frigate and a destroyer: whip-pan across the basin to each one
  { t0: S6b, t1: C7x, set: 'harbor', lt: WINTER, at: V(8, 0, 60), act: t => act6(t),
    cam: (t, u) => { const tg = [[tCruiser, SHIPS.cruiser], [tFrigate, SHIPS.frigate], [tDestroyer, SHIPS.destroyer]]; let x = tg[0][1][0];
      for (let i = 1; i < 3; i++) x = lerp(x, tg[i][1][0], eio(seg(t, tg[i][0] - .2, tg[i][0] + .1)));
      return hand(camAt(V(x + 9, 9, 34), V(x, 6, 66), 46, 34, .5), t, .8); } },
  // 7a · Pepsi's boss jokes to the White House: Kendall in a captain's cap on top of a sub's sail, on a brick phone
  { t0: C7x, t1: S7b, set: 'harbor', lt: WINTER, at: SAIL8, act: t => act7(t),
    cam: (t, u) => hand(camAt(SAIL8.clone().add(SAILCAM.clone().multiplyScalar(lerp(1.15, 1.0, eo(u)))), SAIL8.clone().add(V(0, .95, 0)), 42, 3.1, 4), t) },
  // 7b · "We're disarming the Soviet Union…": in the White House the adviser listens, then chokes on his coffee
  { t0: S7b, t1: S7c, set: 'wh', lt: WH, at: WHO, act: t => act7(t),
    cam: (t, u) => hand(camAt(WP(lerp(.42, .32, u), lerp(1.38, 1.36, u), lerp(-.25, -.5, eo(u))), WP(0, 1.3, -2.05), 40, 1.6, 6), t) },
  // 7c · "…faster than you are!": back to Kendall, roaring with laughter; orbit
  { t0: S7c, t1: C8, set: 'harbor', lt: WINTER, at: SAIL8, act: t => act7(t),
    cam: (t, u) => { const a = SAILRY + lerp(.35, -.25, eo(u)); return hand(camAt(SAIL8.clone().add(V(Math.sin(a) * 2.4, .1, Math.cos(a) * 2.4)), SAIL8.clone().add(V(0, 1.0, 0)), 40, 2.4, 5), t); } },
  // 8a · The world's sixth biggest navy? Not even close.: heroic low angle down the row from the water
  { t0: C8, t1: S8b, set: 'harbor', lt: WINTER, at: V(0, 0, 10), act: t => act8(t),
    cam: (t, u) => hand(camAt(V(lerp(30, 27, u), SEA_Y + lerp(1.2, 1.5, u), lerp(1.4, 1.8, u)), V(-10, 3.4, 13), 44, 30, .5), t, .8) },
  // 8b · The ships are rusty junk: he leans on a periscope; it snaps off, the hatch pops
  { t0: S8b, t1: S8c, set: 'harbor', lt: WINTER, at: SAIL8, act: t => act8(t),
    cam: (t, u) => hand(camAt(SAIL8.clone().add(V(lerp(-1.9, -1.7, u), lerp(-.2, -.1, u), lerp(1.6, 1.3, eo(u)))), SAIL8.clone().add(V(.1, .9, -.6)), 42, 2.6, 5), t) },
  // 8c · …sold straight off for scrap: the scrap corner, a magnet crane hauling a hull section, sparks
  { t0: S8c, t1: C9, set: 'harbor', lt: WINTER, at: V(SCRAP[0], 0, SCRAP[1]), act: t => act8(t),
    cam: (t, u) => hand(camAt(V(SCRAP[0] + lerp(26, 22, u), lerp(5, 6, u), SCRAP[1] + lerp(22, 18, eo(u))), V(SCRAP[0] + 6, 3.2, SCRAP[1] + 4), 46, 24, 1), t) },
  // 9a · Then Pepsi signs a 3 billion dollar deal…: he signs at the official's desk
  { t0: C9, t1: S9b, set: 'office', lt: OFFICE, at: OFO, act: t => act9(t),
    cam: (t, u) => hand(camAt(O(lerp(.85, .7, u), lerp(1.5, 1.45, u), lerp(.9, .6, eo(u))), O(.05, 1.0, -1.25), 42, 2.0, 5), t) },
  // 9b · …and the Soviet Union collapses: the room shakes, plaster falls, the flag topples
  { t0: S9b, t1: S9c, set: 'office', lt: OFFICE, at: OFO, act: t => act9(t),
    cam: (t, u) => shake(hand(camAt(O(lerp(.85, .75, u), lerp(1.5, 1.56, u), lerp(1.5, 1.8, eo(u))), O(-.32, 1.42, -1.7), 50, 2.0, 4), t), t, 1 - u * .5) },
  // 9c · The deal sinks with it: the contract on the water goes down in a stream of bubbles
  { t0: S9c, t1: LOOP, set: 'harbor', lt: WINTER, at: HK, act: t => act9(t),
    cam: (t, u) => hand(camAt(V(HOOK.ken[0] + .3, lerp(1.6, 1.0, eo(u)), HOOK.ken[1] + lerp(2.2, 2.6, u)), V(HOOK.ken[0] - .05, SEA_Y, HOOK.ken[1] + 4.6), 40, 3.0, 6), t, .6) },
];
SHOTS.push({ ...SHOTS[0], t0: LOOP, t1: DUR + 1, loop: 1 });

// ---------------- acting ----------------
function act1(t) {
  reset();
  // the admiral hands over the key; Kendall holds it up, puzzled → the sub surfaces behind them → both spin round, jaws dropped
  const turn = eo(seg(t, t17a + .1, t17a + .5));
  put(KEN89, HK, lerp(Math.PI + .25, .2, turn)); put(ADM, HA, lerp(Math.PI - .35, .1, turn));
  const given = t > tPaid + .1;
  apply(ADM, given ? P.attn : P.give, { t, seed: 5, face: given ? 'smug' : 'calm', look: given ? CAMP : headOf(KEN89) });
  apply(KEN89, given ? (turn > .5 ? TP.cheer : P.hold) : P.attn, { t, seed: 1, face: turn > .5 ? 'shock' : given ? 'worried' : 'happy', look: turn > .5 ? V(HOOK.sub[0], 3, HOOK.sub[1]) : given ? handOf(KEN89).add(V(0, .1, 0)) : headOf(ADM) });
  if (given && turn < .5) onHand(KEN89, KEY, 0, [0, .05, .04], [0, 0, .3]); else if (!given) onHand(ADM, KEY, 0, [0, .05, .05], [0, 0, -.2]);
  // the hook sub: under the water, then bursting up at "submarines"
  const k = seg(t, tSubs1 - .6, tSubs1 + .3), rise = eo(k);
  HOOKSUB.visible = k > 0; HOOKSUB.position.set(HOOK.sub[0], lerp(SEA_Y - 5, SEA_Y + .5, rise) + Math.sin(k * Math.PI) * .7, HOOK.sub[1]); HOOKSUB.rotation.set(lerp(-.25, 0, rise), Math.PI / 2, 0);
  spray(t, tSubs1 - .3, V(HOOK.sub[0], SEA_Y, HOOK.sub[1]), 9);
}
function spray(t, t0, c, sz) {
  const s = t - t0; if (s < 0 || s > 2.2) return; SPRAY.visible = true; FOAM.visible = true;
  FOAM.position.set(c.x, SEA_Y + .03, c.z); FOAM.scale.setScalar(sz * (.6 + s * .7)); FOAM.material.opacity = .9 * Math.max(0, 1 - s / 2.2);
  const m = new THREE.Matrix4(), p = V(), q = new THREE.Quaternion(), sc = V();
  for (let i = 0; i < 160; i++) { const a = hash(i) * 6.28, r = (hash(i + 3) * .8 + .3) * sz, vy = 4 + hash(i + 5) * 6, tt = Math.max(0, s - hash(i + 9) * .3);
    const y = SEA_Y + vy * tt - 4.9 * tt * tt; const k = y > SEA_Y - .2 && tt > 0 ? 1 : 0;
    p.set(c.x + Math.cos(a) * r * (.5 + tt * .5) * 1.6, y, c.z + Math.sin(a) * r * .5 * (.5 + tt * .5)); m.compose(p, q, sc.setScalar(k * (.6 + hash(i + 2) * 1.4))); SPRAY.setMatrixAt(i, m); }
  SPRAY.instanceMatrix.needsUpdate = true;
}
function act2(t) {
  reset();
  // Kendall behind the counter pours, hands the cup over; the leader sips — and loves it; two press photographers flash
  put(KEN, BOOTHK, .2); put(LEAD, BOOTHL, Math.PI - .35);
  const handed = t > tTry - .1, sip = t > tPepsi2 - .05;
  apply(KEN, t < tLeader ? P.hold : handed ? TP.hips : P.give, { t, seed: 1, face: handed ? 'smug' : 'happy', look: headOf(LEAD), talk: t > tBoss2 && t < tTry ? .4 + .4 * Math.sin(t * 20) : 0 });
  if (!handed) onHand(KEN, CUP, 0, [0, -.02, .05]);
  const sipK = seg(t, tPepsi2 - .1, tPepsi2 + .3);
  apply(LEAD, sip ? (t > tOnCam - .1 ? TP.cheer : mix(P.give, P.drink, eo(sipK))) : handed ? P.give : P.attn, { t, seed: 2, face: t > tOnCam - .1 ? 'laugh' : sip ? 'shock' : 'calm', look: t > tOnCam - .1 ? CAMP : headOf(KEN) });
  if (handed && t < tOnCam - .1) onHand(LEAD, CUP, 0, [0, -.02, .05]);
  // the photographers in the foreground, cameras up; the flash fires at "camera"
  PHO.forEach((p, i) => { const v = E([1.3, -1.25][i], 0, [2.3, 2.6][i]); put(p, v, face(v, E(0, 0, .4)) + (i ? .1 : -.1)); apply(p, P.shoot, { t, seed: 11 + i, face: 'happy', look: E(0, 1.3, .3) });
    onHand(p, CAMS[i], 0, [.05, .06, .1], [0, -.2, 0]); CAMS[i].userData.flash(Math.max(0, 1 - Math.abs(t - tCamera - i * .14) / .1)); });
  EXT.forEach((p, i) => { const v = E([-3.2, 3.6][i], 0, [-2.2, -3.0][i]); put(p, v, face(v, E(0, 0, 0))); apply(p, TP.stand, { t, seed: 21 + i, face: 'happy', look: E(0, 1.3, 0) }); });
}
function act3(t) {
  reset(); OF.setYear(1972);
  put(OFF, OD, 0); put(KEN, KD, Math.PI);
  // he hugs a bottle on "want Pepsi", then slaps a stack of roubles on the desk; Kendall lifts one note: it wilts
  const hug = t > tWant3 - .1 && t < tBut3;
  apply(OFF, hug ? P.hold : t < tMoney + .2 ? mix(P.attn, P.slam, eo(seg(t, tMoney - .2, tMoney))) : P.attn, { t, seed: 3, face: hug ? 'laugh' : t > tMoney ? 'proud' : 'happy', look: headOf(KEN), talk: t > tWant3 - .1 && t < tMoney ? .4 + .4 * Math.sin(t * 19) : 0 });
  if (hug) onHand(OFF, BOT, 0, [0, -.04, .05], [.4, 0, 0]);
  at(RUBS, O(-.08, .83, -1.25), [0, .3, 0]); RUBS.visible = t > tMoney - .02;
  const lift = t > tUseless - .35;
  apply(KEN, lift ? P.hold : P.attn, { t, seed: 1, face: t > tUseless + .1 ? 'deadpan' : 'happy', look: lift ? handOf(KEN).add(V(0, .05, 0)) : headOf(OFF) });
  if (lift) { onHand(KEN, NOTE, 0, [0, .06, .03], [0, 0, 0]); NOTE.userData.droop(eo(seg(t, tUseless, tUseless + .5))); }
}
function act4(t) {
  reset();
  if (t < S4b) {   // the official snaps his fingers; a crate of vodka slides across the desk; Kendall lifts out a bottle, delighted
    OF.setYear(1972); put(OFF, OD, 0); put(KEN, KD, Math.PI);
    const snapped = t > tPay4 - .1;
    apply(OFF, snapped && t < tVodka + .3 ? P.snap : TP.hips, { t, seed: 3, face: 'smug', look: headOf(KEN) });
    const k = eo(seg(t, tVodka - .45, tVodka - .05)); at(CRATE, O(lerp(-1.1, -.1, k), .83, -1.3), [0, .1 + (1 - k) * .4, 0]);
    const up = t > tVodka + .1;
    apply(KEN, up ? TP.cheer : P.attn, { t, seed: 1, face: up ? 'laugh' : 'shock', look: up ? CAMP : O(-.1, .95, -1.3) });
    if (up) onHand(KEN, VOD, 0, [0, .02, .03]);
    return;
  }
  // 1970s America: the store shelves fill with vodka; Kendall presents them
  SET.store.userData.fill(lerp(.15, 1, eo(seg(t, S4b, tAmerica + .2))));
  const p = S(.35, 0, -.55); put(KEN, p, -.15);
  apply(KEN, t > tAll - .1 ? TP.present : TP.hips, { t, seed: 1, face: t > tAll - .1 ? 'laugh' : 'smug', look: CAMP });
}
function act5(t) {
  reset(); OF.setYear(1989);
  put(OFF, OD, 0); put(KEN89, KD, Math.PI);
  if (t < S5b) {   // he downs a whole bottle and slams it on the desk
    const glug = seg(t, tWant5 - .2, tMore + .1);
    apply(OFF, glug > 0 && glug < 1 ? P.drink : P.slam, { t, seed: 3, face: glug > 0 && glug < 1 ? 'happy' : 'laugh', look: headOf(KEN89) });
    if (glug < 1) onHand(OFF, BOT, 0, [0, -.04, .05], [glug > 0 ? 2.4 : 0, 0, 0]); else at(BOT, O(.25, .83, -1.5));
    apply(KEN89, P.attn, { t, seed: 1, face: 'smile', look: headOf(OFF) });
    return;
  }
  // …this time they pay in warships: the official sets a model warship on the desk; Kendall's eyes go wide
  const k = seg(t, tPay5 - .1, tWarships - .05);
  at(MODEL, O(lerp(-.4, -.05, eo(k)), .83 + Math.sin(k * Math.PI) * .25, -1.35), [0, .5 + k * .4, 0]); MODEL.visible = k > 0;
  apply(OFF, k < 1 ? P.give : TP.hips, { t, seed: 3, face: 'smug', look: headOf(KEN89) });
  apply(KEN89, t > tWarships - .1 ? TP.cheer : P.attn, { t, seed: 1, face: t > tWarships - .1 ? 'shock' : 'happy', look: O(-.05, .95, -1.35) });
}
function act6(t) {
  reset();
}
function act7(t) {
  reset();
  if (t < S7b || t >= S7c) {   // on the sail of a sub, captain's cap on, brick phone at his ear
    put(KCAP, SAIL8, SAILRY);
    const laugh = t >= S7c;
    apply(KCAP, laugh ? { ...P.phone, sp: [-14, 0, 0], hd: [-20, 0, 10] } : P.phone, { t, seed: 1, face: laugh ? 'laugh' : 'smug', look: CAMP, talk: !laugh ? .4 + .4 * Math.sin(t * 18) : 0 });
    onHand(KCAP, BRICK, 0, [0, .02, .03], [0, 0, 0]);
    return;
  }
  // the White House: the adviser, handset to his ear, coffee mug in the other hand → he chokes on it at "disarming"
  put(ADV, WP(0, 0, -2.05), 0);
  const choke = t > tDisarm + .1;
  apply(ADV, choke ? { ...P.phone, sp: [12, 0, 0], hd: [10, 0, 0], aL: [-70, 10, 0, 100] } : { ...P.phone, aL: [-70, 10, 0, 110] }, { t, seed: 6, face: choke ? 'shock' : 'calm', look: CAMP });
  onHand(ADV, HSET, 0, [0, .02, .03], [0, 0, .2]);
}
function act8(t) {
  reset();
  if (t < S8b) return;   // the fleet, from the water
  if (t < S8c) {   // he leans on a periscope; it snaps; the hatch flies off
    const sb = HB.subs[8], snapT = tRusty - .05, hatchT = tJunk - .05;
    put(KCAP, SAIL8.clone().add(V(.32, 0, -1.0)), SAILRY - .3);
    const k = eo(seg(t, snapT, snapT + .35)); sb.userData.scopes[2].rotation.set(0, 0, -k * 1.45);
    apply(KCAP, t > snapT ? { ...P.lean, sp: [-8 - k * 18, 0, 6 + k * 14] } : P.lean, { t, seed: 1, face: t > snapT ? 'shock' : 'smug', look: CAMP });
    const hs = Math.max(0, t - hatchT); if (hs > 0) { sb.userData.hatch.position.set(hs * .8, 1.66 + hs * 4.2 - 4.9 * hs * hs, -4.2 - hs * .6); sb.userData.hatch.rotation.set(hs * 9, 0, hs * 5); }
    return;
  }
  // the scrap corner: the magnet swings a hull section over the heap; a torch throws sparks on the half sub
  const k = seg(t, S8c, C9); HB.magnet.visible = true; HB.chunk.visible = true;
  const mp = V(SCRAP[0] + lerp(10, 2, eio(k)), lerp(9, 7.5, k), SCRAP[1] + lerp(7, 3, eio(k))); HB.magnet.position.copy(mp); HB.cable.scale.y = 14;
  HB.chunk.position.copy(mp).add(V(0, -1.9, 0)); HB.chunk.rotation.set(0, k * .6, Math.sin(t * 3) * .05);
  const spk = HB.sparks; spk.visible = true; const m = new THREE.Matrix4(), p = V(), q = new THREE.Quaternion(), sc = V();
  const src = V(14 - 1.2, 2.4, 4 + 1.0);
  for (let i = 0; i < 40; i++) { const life = (t * 2.2 + hash(i)) % 1, a = hash(i + 1) * 6.28; p.set(src.x + Math.cos(a) * life * 1.4, src.y + life * 1.2 - life * life * 2.6, src.z + Math.sin(a) * life * 1.4); m.compose(p, q, sc.setScalar(1 - life)); spk.setMatrixAt(i, m); }
  spk.instanceMatrix.needsUpdate = true;
}
function act9(t) {
  reset();
  if (t < S9c) {   // signing in the office (1990), then the collapse
    OF.setYear(1990); put(OFF, OD, 0); put(KEN89, KD.clone().add(V(-.05, 0, -.3)), lerp(Math.PI, .55, eo(seg(t, S9b + .05, S9b + .35))));
    at(CON, O(.05, .835, -1.22), [-Math.PI / 2, 0, .1]); CON.userData.sig.scale.x = Math.max(.01, seg(t, tSigns, tDeal9));
    const coll = t >= S9b, sh = coll ? Math.sin(t * 40) * .4 : 0;
    apply(KEN89, coll ? TP.cheer : P.sign, { t, seed: 1, face: coll ? 'shock' : 'smug', look: coll ? O(0, 3.8, -1) : O(.05, .84, -1.22), eyes: coll ? [0, .4] : [0, -.6] });
    if (!coll) { onHand(KEN89, PEN, 0, [0, -.04, .05], [.5, 0, 0]); }
    apply(OFF, coll ? TP.cheer : TP.hips, { t, seed: 3, face: coll ? 'shock' : 'proud', look: coll ? O(0, 3.8, -1) : headOf(KEN89) });
    if (coll) {
      const s = t - S9b; OF.crack.material.opacity = clamp(s * 4); OF.chand.rotation.set(Math.sin(s * 9) * .25 * Math.exp(-s), 0, Math.sin(s * 7) * .25);
      OF.flag.rotation.set(0, 0, -eo(seg(s, .15, .7)) * 1.35); OF.flag.position.set(-3.2, 0, -3.2);
      const deb = OF.debris; deb.visible = true; const m = new THREE.Matrix4(), p = V(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = V();
      OF.deb.forEach(([x, z, a, b], i) => { const tt = Math.max(0, s - a * .6); const y = Math.max(.05, 3.85 - 4.9 * tt * tt); p.set(x, tt > 0 ? y : 3.85, z); q.setFromEuler(e.set(tt * 6 + i, i, tt * 4)); m.compose(p, q, sc.setScalar((tt > 0 ? 1 : 0) * (.5 + b))); deb.setMatrixAt(i, m); });
      deb.instanceMatrix.needsUpdate = true;
    }
    return;
  }
  // the contract floating off the quay goes down in a stream of bubbles
  const s = t - S9c, sinkK = seg(t, tSinks - .1, tSinks + .9), c = V(HOOK.ken[0], SEA_Y + .02 - sinkK * .9, HOOK.ken[1] + 4.6);
  at(CON, c, [-Math.PI / 2 + Math.sin(t * 2) * .05 + sinkK * .5, 0, Math.PI + s * .2]); CON.scale.setScalar(1.6);
  BUBS.visible = sinkK > 0; const m = new THREE.Matrix4(), p = V(), q = new THREE.Quaternion(), sc = V();
  for (let i = 0; i < 40; i++) { const life = ((t - tSinks) * 1.4 + hash(i)) % 1; p.set(c.x + (hash(i + 1) - .5) * .5, SEA_Y - .5 + life * .55, c.z + (hash(i + 2) - .5) * .4); m.compose(p, q, sc.setScalar(sinkK > 0 && t > tSinks ? (.6 + hash(i + 3)) * (life < .9 ? 1 : 0) : 0)); BUBS.setMatrixAt(i, m); }
  BUBS.instanceMatrix.needsUpdate = true;
  // the sub behind slips under too, periscope last
  HOOKSUB.visible = true; HOOKSUB.position.set(HOOK.sub[0], SEA_Y + .5 - eio(seg(t, tSinks - .3, tSinks + 1.4)) * 5.5, HOOK.sub[1]); HOOKSUB.rotation.set(eio(seg(t, tSinks - .3, tSinks + 1.4)) * .12, Math.PI / 2, 0);
}

// ---------------- sound events (the score reads these) ----------------
ev(0, 'harbor', { d: C2 }); ev(.05, 'boom'); ev(tPaid, 'clink'); ev(tSubs1 - .55, 'surface'); ev(tSubs1 - .3, 'splash'); ev(t17a, 'counter', { d: .7 });
ev(C2 - .05, 'whoosh'); ev(C2, 'crowd', { d: C3 - C2 }); ev(t1959, 'pop'); ev(tTry, 'pour'); ev(tPepsi2, 'slurp'); ev(tCamera, 'flash'); ev(tCamera + .14, 'flash'); ev(tCamera + .05, 'shutter');
ev(C3x - .05, 'whoosh'); ev(C3x, 'clock', { d: C4 - C3x }); ev(t1972, 'pop'); ev(tMoney, 'slap'); ev(tUseless + .05, 'deflate'); ev(tUseless, 'stamp');
ev(tPay4 - .05, 'snap'); ev(tVodka - .4, 'slide'); ev(tVodka, 'clink'); ev(S4b - .05, 'whoosh'); ev(S4b + .1, 'register'); for (let i = 0; i < 6; i++) ev(lerp(S4b + .2, tAmerica, i / 5), 'tick');
ev(C5 - .05, 'whoosh'); ev(t1989, 'pop'); ev(tWant5 - .1, 'glug', { d: tMore - tWant5 + .3 }); ev(tMore + .15, 'slam'); ev(tWarships - .05, 'thunk'); ev(tWarships, 'stamp');
ev(C6 - .05, 'whoosh'); ev(C6, 'harbor', { d: C7 - C6 }); [t17b, tCruiser, tFrigate, tDestroyer].forEach(x => ev(x, 'register')); ev(tCruiser - .2, 'whip'); ev(tFrigate - .2, 'whip'); ev(tDestroyer - .2, 'whip'); ev(tDestroyer + .22, 'ding');
ev(C7x, 'harbor', { d: S7b - C7x }); ev(C7x + .05, 'dial'); ev(S7b, 'cut'); ev(tDisarm + .12, 'spit'); ev(S7c, 'cut'); ev(S7c + .05, 'laugh');
ev(C8 - .05, 'whoosh'); ev(C8, 'harbor', { d: C9 - C8 }); ev(tSixth, 'pop'); ev(tNot, 'buzz'); ev(tRusty - .05, 'creak'); ev(tRusty + .2, 'clang'); ev(tJunk, 'boing'); ev(tJunk + .7, 'splash'); ev(S8c, 'sizzle', { d: C9 - S8c }); ev(tScrap, 'stamp');
ev(C9 - .05, 'whoosh'); ev(C9, 'clock', { d: S9b - C9 }); ev(tSigns + .1, 'scribble'); ev(t3, 'counter', { d: .6 }); ev(tBillion + .1, 'ding'); ev(S9b, 'rumble', { d: S9c - S9b + .3 }); ev(tColl + .1, 'crash');
ev(S9c, 'harbor', { d: LOOP - S9c }); ev(tSinks, 'bubbles', { d: 1.6 }); ev(tSinks + .3, 'sting');

// ---------------- the overlay: telops + the receipt + 1–3 word captions ----------------
const ov = document.getElementById('ov').getContext('2d');
const snap = document.createElement('canvas'); snap.width = W; snap.height = H; const sctx = snap.getContext('2d');
const TEL = [
  { t0: t17a - .05, t1: C2, text: t => `${Math.round(1 + 16 * eo(seg(t, t17a - .05, t17a + .65)))} SUBMARINES`, y: 300, size: 120, col: '#FFD23F', rot: -4 },
  { t0: t1959 - .05, t1: S2b + .3, text: '1959', y: 300, size: 170, col: '#FFD23F', rot: -5, sub: 'MOSCOW' },
  { t0: t1972 - .05, t1: S3b + .1, text: '1972', y: 300, size: 170, col: '#FFD23F', rot: -5 },
  { t0: tUseless - .05, t1: C4, text: 'WORTHLESS ABROAD', y: 1480, size: 96, col: '#E8423A', rot: -7, stamp: 1 },
  { t0: tVodka - .05, t1: S4b + .1, text: 'PAID IN VODKA', y: 300, size: 110, col: '#FFFFFF', rot: 4, plate: '#B8202A' },
  { t0: tAll - .1, t1: C5, text: 'SOLD ALL OVER THE USA', y: 1460, size: 78, col: '#FFFFFF', rot: -3, plate: '#1E3A7A' },
  { t0: t1989 - .05, t1: S5b + .1, text: '1989', y: 300, size: 170, col: '#FFD23F', rot: -5 },
  { t0: tWarships - .05, t1: C6, text: 'WARSHIPS?!', y: 300, size: 150, col: '#E8423A', rot: -6, stamp: 1 },
  { t0: tWhite - .05, t1: S7c + .1, text: 'THE WHITE HOUSE', y: 1440, size: 86, col: '#FFFFFF', rot: -3, plate: '#1E3A7A' },
  { t0: tSixth - .05, t1: S8b + .1, text: "WORLD'S #6 NAVY?", y: 300, size: 110, col: '#FFFFFF', rot: -4, plate: '#2A2A30' },
  { t0: tNot - .05, t1: S8b + .1, text: 'MYTH', y: 520, size: 170, col: '#E8423A', rot: 8, stamp: 1 },
  { t0: tScrap - .05, t1: C9, text: 'SOLD FOR SCRAP', y: 1480, size: 104, col: '#E8423A', rot: -6, stamp: 1 },
  { t0: t3 - .05, t1: S9b + .1, text: t => '$' + (Math.round(3000 * eo(seg(t, t3 - .05, tBillion + .2))) * 1e6).toLocaleString('en-US'), y: 300, size: 100, col: '#4ADB6A', rot: -4, plate: '#1B1213' },
  { t0: tColl - .05, t1: S9c + .1, text: '1991: USSR COLLAPSES', y: 300, size: 68, col: '#FFFFFF', rot: 3, plate: '#8A2A22' },
  { t0: tSinks - .05, t1: LOOP, text: 'DEAL SUNK', y: 1480, size: 140, col: '#E8423A', rot: -6, stamp: 1 },
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
// the receipt: a till slip that prints the payment line by line as the narrator lists it
const RC = [['SUBMARINE', '×17', t17b], ['CRUISER', '×1', tCruiser], ['FRIGATE', '×1', tFrigate], ['DESTROYER', '×1', tDestroyer]];
function drawReceipt(t) {
  if (t < C6 - .05 || t >= C7x) return;
  const p = seg(t, C6 - .05, C6 + .25), wd = 760, rows = RC.filter(r => t >= r[2] - .08).length, tot = t >= tDestroyer + .22, ht = 250 + rows * 92 + (tot ? 110 : 0);
  ov.save(); ov.translate(540, 200 + (1 - eo(p)) * -500); ov.rotate(-.025);
  ov.fillStyle = 'rgba(0,0,0,.35)'; ov.fillRect(-wd / 2 + 14, 14, wd, ht);
  ov.fillStyle = '#FBF8EE'; ov.beginPath(); ov.moveTo(-wd / 2, 0); ov.lineTo(wd / 2, 0); ov.lineTo(wd / 2, ht); for (let x = wd / 2; x > -wd / 2; x -= 38) { ov.lineTo(x - 19, ht + 18); ov.lineTo(x - 38, ht); } ov.closePath(); ov.fill();
  ov.fillStyle = '#1B1213'; ov.textBaseline = 'middle'; ov.textAlign = 'center'; ov.font = '900 58px Montserrat'; ov.fillText('RECEIPT', 0, 62);
  ov.font = '800 34px Montserrat'; ov.fillStyle = '#5A5450'; ov.fillText('USSR → PEPSICO · FOR: COLA', 0, 116);
  ov.setLineDash([14, 10]); ov.strokeStyle = '#8A8480'; ov.lineWidth = 4; ov.beginPath(); ov.moveTo(-wd / 2 + 40, 160); ov.lineTo(wd / 2 - 40, 160); ov.stroke(); ov.setLineDash([]);
  RC.forEach(([name, n, t0], i) => { if (t < t0 - .08) return; const k = back(seg(t, t0 - .08, t0 + .12), 2.4), y = 220 + i * 92;
    ov.save(); ov.translate(0, y); ov.scale(k, k); ov.fillStyle = '#1B1213'; ov.font = '900 64px Montserrat'; ov.textAlign = 'left'; ov.fillText(name, -wd / 2 + 50, 0); ov.textAlign = 'right'; ov.fillStyle = '#C8283A'; ov.fillText(n, wd / 2 - 50, 0); ov.restore(); });
  if (tot) { const y = 220 + rows * 92 + 10, k = back(seg(t, tDestroyer + .22, tDestroyer + .42), 2.4); ov.strokeStyle = '#1B1213'; ov.lineWidth = 5; ov.beginPath(); ov.moveTo(-wd / 2 + 40, y - 40); ov.lineTo(wd / 2 - 40, y - 40); ov.stroke();
    ov.save(); ov.translate(0, y + 20); ov.scale(k, k); ov.font = '900 64px Montserrat'; ov.textAlign = 'left'; ov.fillStyle = '#1B1213'; ov.fillText('TOTAL', -wd / 2 + 50, 0); ov.textAlign = 'right'; ov.fillStyle = '#2E7A3A'; ov.fillText('20 SHIPS', wd / 2 - 50, 0); ov.restore(); }
  ov.restore();
}
// the press photo: at "camera" the frame freezes into a black-and-white print that drops onto the screen
function drawPhoto(t) {
  if (t < tCamera + .04 || t >= C3x) return;
  const k = eo(seg(t, tCamera + .04, tCamera + .4)), s = lerp(1.0, .8, k), rot = lerp(0, -5, k) * Math.PI / 180;
  ov.save(); ov.globalAlpha = .5 * k; ov.fillStyle = '#000'; ov.fillRect(0, 0, W, H); ov.restore();
  ov.save(); ov.translate(W / 2, H / 2 - 120 * k); ov.rotate(rot); ov.scale(s, s);
  ov.fillStyle = 'rgba(0,0,0,.4)'; ov.fillRect(-W / 2 - 30 + 20, -H * .36 - 30 + 24, W + 60, H * .72 + 170);
  ov.fillStyle = '#F6F2E8'; ov.fillRect(-W / 2 - 30, -H * .36 - 30, W + 60, H * .72 + 170);
  ov.drawImage(snap, 0, H * .14, W, H * .72, -W / 2, -H * .36, W, H * .72);
  ov.fillStyle = '#1B1213'; ov.font = '700 64px Fredoka'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.fillText('Moscow, 1959', 0, H * .36 + 72);
  ov.restore();
}
const chunks = [];
TMJ.lines.forEach((l, li) => { let cur = []; const flush = () => { if (cur.length) chunks.push({ li, words: cur }); cur = []; };
  l.words.forEach(x => { const len = cur.reduce((a, y) => a + y.w.length + 1, 0) + x.w.length; if (cur.length && (len > 14 || cur.length >= 3)) flush(); cur.push(x); if (/[,.…!?:"]$/.test(x.w)) flush(); }); flush(); });
chunks.forEach((c, i) => { const n = chunks[i + 1]; c.text = c.words.map(x => x.w).join(' ').replace(/"/g, ''); c.a = c.words[0].t0 - .04; c.b = n ? Math.min(n.words[0].t0 - .04, c.words[c.words.length - 1].t1 + .6) : c.words[c.words.length - 1].t1 + .6; });
const CAPY = 1180;
function drawCaption(t) {
  const c = chunks.find(c => t >= c.a && t < c.b); if (!c) return;
  const pop = back(seg(t, c.a, c.a + .12), 2.2), s = lerp(.6, 1, pop), y = (t >= C6 - .05 && t < C7x) ? 1320 : (t >= tCamera + .04 && t < C3x) ? 1720 : CAPY;
  ov.save(); ov.translate(W / 2, y); ov.scale(s, s); ov.font = '900 104px Montserrat'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 22; ov.shadowOffsetY = 8; ov.lineWidth = 26; ov.strokeStyle = '#000'; ov.strokeText(c.text, 0, 0, 1000);
  ov.shadowColor = 'transparent'; ov.fillStyle = '#FFFFFF'; ov.fillText(c.text, 0, 0, 1000); ov.restore();
}

// ---------------- render ----------------
function frame(sh, t) {
  const tt = sh.loop ? 0 : t, u = sh.loop ? 0 : seg(t, sh.t0, sh.t1);
  for (const [k, s] of Object.entries(SET)) s.visible = k === sh.set;
  light(sh.lt, sh.at);
  if (sh.set === 'office') { bulb.position.copy(OFO).add(V(0, 3.2, -.6)); bulb.color.set('#FFD8A0'); }
  if (sh.set === 'store') { bulb.position.copy(STO).add(V(0, 3.2, 1)); bulb.color.set('#FFF4E0'); }
  let c = sh.after ? null : sh.cam(tt, u); if (c) CAMP.copy(c.pos);
  sh.act(tt);
  if (!c) { c = sh.cam(tt, u); CAMP.copy(c.pos); }
  if (sh.set === 'harbor') HB.tick(tt, c.pos);
  camera.position.copy(c.pos); sky.position.copy(c.pos); camera.up.set(0, 1, 0); camera.lookAt(c.look); camera.rotateZ(c.roll ?? 0); camera.fov = c.fov; camera.updateProjectionMatrix();
  post.dof.focus = c.focus; post.dof.aper = c.aper; post.dof.maxCoc = 8;
  const f = sh.fpv ? Math.sin(seg(tt, sh.t0, sh.t1) * Math.PI) * sh.fpv : 0; zb.uniforms.amt.value = f * .09; zb.enabled = f > .02;
  scene.updateMatrixWorld(true); post.composer.render();
}
const A0 = +(QS.get('a') ?? 0), B0 = +(QS.get('b') ?? DUR);
const shotAt = t => { const i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1); return SHOTS[i < 0 ? SHOTS.length - 1 : i]; };
function render(t) {
  const sh = shotAt(t);
  ov.clearRect(0, 0, W, H);
  // the press photo: render the flash frame first and keep it
  if (t >= tCamera + .04 && t < C3x) { frame(shotAt(tCamera + .03), tCamera + .03); sctx.filter = 'grayscale(1) contrast(1.15) brightness(1.05)'; sctx.clearRect(0, 0, W, H); sctx.drawImage(renderer.domElement, 0, 0); sctx.filter = 'none'; }
  frame(sh, t);
  if (QS.get('poster')) { ov.clearRect(0, 0, W, H); [['THE USSR PAID PEPSI', 170, -4, '#FFFFFF', 96], ['IN SUBMARINES', 310, -4, '#FFD23F', 130]].forEach(([text, y, rot, col, size]) => drawTelop({ t0: -9, text, y, size, col, rot }, t)); return; }
  if (QS.get('clean')) return;
  if (t < LOOP) {
    const fl = Math.max(0, 1 - Math.abs(t - tCamera) / .12); if (fl > 0) { ov.fillStyle = `rgba(255,255,255,${fl * .85})`; ov.fillRect(0, 0, W, H); }
    drawPhoto(t); TEL.forEach(x => { if (t >= x.t0 && t < x.t1) drawTelop(x, t); }); drawReceipt(t); drawCaption(t);
  }
}
function texts(t) { if (t >= LOOP) return []; return TEL.filter(x => typeof x.text === 'string' && t >= x.t0 + .3 && t < x.t1).map(x => ({ id: x.text, text: x.text, x0: 60, y0: x.y - x.size * .7, x1: 1020, y1: x.y + x.size * .7 })); }
EV.sort((a, b) => a.t - b.t);
window.DUR = +(B0 - A0).toFixed(3); window.EV = EV; window.render = t => render(t + A0); window.TEXTS = t => texts(t + A0);
render(A0);
window.READY = true;
