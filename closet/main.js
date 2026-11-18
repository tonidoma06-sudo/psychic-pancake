// "The Closet" · 3D vertical Short (1080×1920), style kit v5 (colour shadows, rim light, sleeves and skin, saturated grade).
// Japan, 2008: a man who lived alone noticed food going missing, wired a hidden camera to his phone, saw someone walking
// through his house while he was at work; the police searched, found nobody, then opened the top shelf of a closet:
// a woman had been living there, with a mattress, for about a year. Everything is placed from timing.json (the voice).
// v5 camera language: a punch-in on key words, whip-pan smears on some cuts, a white flash on the reveal; karaoke captions.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makePost } from '/core/three/post.js';
import { makeToon, apply, TP, walk, STYLE } from './toon.js';
import { kitchen, street, office, washitsu, hiddenCam, flipPhone, flashlight, bowl } from './sets_closet.js';
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
post.bloom.strength = .32; post.bloom.threshold = .9; post.bloom.radius = .55;
const vg = post.vig.uniforms; vg.amt.value = .26; vg.sat.value = 1.28; vg.contrast.value = .14;
const sun = new THREE.DirectionalLight('#FFF4E0', 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
scene.add(sun, sun.target); const hemi = new THREE.HemisphereLight('#BFDFFF', '#4A6A2A', 1); scene.add(hemi);
const sky = skyDome('#3A2A7A', '#FF9A6A', V(-.7, .12, -.6), '#FFD08A'); scene.add(sky);
const NIGHT = { pos: [1.6, 3.2, 2.6], col: '#FFD49A', int: 1.7, hs: '#7A86D8', hg: '#C88A5A', hemi: .95, env: .3, r: 4, bg: '#141428', warm: .1, sat: 1.3, rim: .3 };
const DUSK = { pos: [-26, 7, -18], col: '#FF9A5A', int: 2.4, hs: '#FFB8A8', hg: '#5A4A8A', hemi: 1.05, fog: ['#B88AB0', 28, 110], sky: ['#3A2A7A', '#FF9A6A', [-.7, .12, -.6], '#FFD08A'], env: .35, r: 14, warm: .14, sat: 1.32, rim: .35 };
const DAY = { pos: [-3, 6, 4], col: '#FFFFFF', int: 2.1, hs: '#E8F4FF', hg: '#A8B0BC', hemi: 1.15, env: .5, r: 5, bg: '#E8EEF4', warm: .04, sat: 1.22, rim: .3 };
const DARK = { pos: [-4, 3, 1], col: '#7A8AF0', int: .9, hs: '#5A6AC8', hg: '#2A2A4A', hemi: .95, env: .15, r: 5, bg: '#0A1024', warm: 0, sat: 1.25, rim: .12 };   // moonlight through the shoji
const CCTV = { pos: [1.6, 3.2, 2.6], col: '#E8ECFF', int: 1.4, hs: '#B8C0E0', hg: '#5A5A6A', hemi: 1.1, env: .2, r: 4, bg: '#0A0A10', warm: 0, sat: 0, rim: 0 };
function light(o, at) {
  sun.color.set(o.col); sun.intensity = o.int; sun.position.set(at.x + o.pos[0], at.y + o.pos[1], at.z + o.pos[2]); sun.target.position.copy(at);
  const c = sun.shadow.camera, r = o.r ?? 8; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = .5; c.far = 120; c.updateProjectionMatrix();
  hemi.color.set(o.hs); hemi.groundColor.set(o.hg); hemi.intensity = o.hemi;
  scene.fog = o.fog ? new THREE.Fog(o.fog[0], o.fog[1], o.fog[2]) : null;
  if (o.sky) { sky.visible = true; scene.background = null; const u = sky.material.uniforms; u.top.value.set(o.sky[0]); u.hor.value.set(o.sky[1]); u.sd.value.set(...o.sky[2]).normalize(); u.sc.value.set(o.sky[3]); }
  else { sky.visible = false; scene.background = new THREE.Color(o.bg ?? '#2A2A30'); }
  scene.environmentIntensity = o.env ?? .35; STYLE.rimK.value = o.rim ?? .3; vg.warm.value = o.warm ?? .1; vg.sat.value = o.sat ?? 1.28; vg.contrast.value = o.sat === 0 ? .3 : .14;
}

// ---------------- sets (far apart) ----------------
const KO = V(0, 0, 0), KIT = kitchen(); scene.add(KIT);
const SO = V(300, 0, 0), STR = street(); STR.position.copy(SO); scene.add(STR);
const OO = V(-300, 0, 0), OFF = office(); OFF.position.copy(OO); scene.add(OFF);
const WO = V(0, 0, 300), WAS = washitsu(); WAS.position.copy(WO); scene.add(WAS);
const SETS = { kitchen: [KIT], street: [STR], office: [OFF], washitsu: [WAS] };
const lampL = new THREE.PointLight('#FFC878', 1.6, 6, 1.6); lampL.position.set(.3, 1.7, -.2); KIT.add(lampL);
const FR = KIT.userData.fridge, DOOR = KIT.userData.door, ITEMS = KIT.userData.items, FLIGHT = KIT.userData.flight, FBODY = KIT.userData.fbody;
const FRW = FR.position.clone();   // the fridge (kitchen = world origin)

// ---------------- cast (v5: skin tones, sleeves, colour) ----------------
const mk = o => { const p = makeToon({ shoe: '#3A2A1E', ...o }); scene.add(p.P); return p; };
const MAN = mk({ name: 'man', outfit: 'suit', top: '#2A3A6A', pants: '#2A3A6A', tie: '#E8423A', pocketSq: '#F4F1EA', cuff: '#F4F1EA', hair: 'slick', hairC: '#3A3A44', glasses: 'round', skin: '#F2CDA8', seed: 3 });
const WOMAN = mk({ name: 'woman', H: .9, outfit: 'tee', top: '#C86A8A', sleeve: '#C86A8A', pants: '#4A4E6E', hair: 'bob', hairC: '#BEB8B2', skin: '#EFC8A2', lashes: 1, shoe: '#6A4A3A', seed: 4 });
const COP = [0, 1].map(i => mk({ name: 'cop' + i, outfit: 'suit', top: '#1E2A4A', pants: '#1E2A4A', tie: '#1E2A4A', cuff: '#9FC8E8', hair: 'peak', hatC: '#1E2A4A', bandC: '#2A3A5E', hairC: '#1A1614', skin: ['#E8BE96', '#F2CDA8'][i], shoe: '#16131A', seed: 10 + i }));
const COWORK = [mk({ name: 'cw0', outfit: 'polo', top: '#4FA236', pants: '#3A3A4A', hair: 'messy', hairC: '#2A1E18', skin: '#E8BE96', seed: 20 }), mk({ name: 'cw1', outfit: 'tee', top: '#F2B030', sleeve: '#F2B030', pants: '#2E4A6A', hair: 'bob', hairC: '#3A2418', skin: '#F4D0AE', lashes: 1, seed: 21 })];
const CAST = [MAN, WOMAN, ...COP, ...COWORK];

// ---------------- props ----------------
const HCAM = hiddenCam(); scene.add(HCAM);
const PHONE = flipPhone('#C8283A'); scene.add(PHONE);
const FLS = [flashlight(), flashlight()]; FLS.forEach(f => scene.add(f));
const SPOT = FLS.map(() => { const s = new THREE.SpotLight('#FFF2D0', 0, 9, .32, .45, 1.2); s.castShadow = false; scene.add(s, s.target); return s; });
const STOOL = new THREE.Group(); { const m = new THREE.MeshToonMaterial({ color: '#F2B030' }); const top = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .04, 20), m); top.position.y = .4; STOOL.add(top); for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .4, 6), m); const a = i * 2.1; l.position.set(Math.cos(a) * .13, .2, Math.sin(a) * .13); STOOL.add(l); } } scene.add(STOOL);
const CHOP = new THREE.Group(); for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.004, .003, .22, 6), new THREE.MeshToonMaterial({ color: '#8A5A34' })); c.position.x = s * .01; CHOP.add(c); } scene.add(CHOP);
const PROPS = [HCAM, PHONE, ...FLS, STOOL, CHOP];

// ---------------- key times (from the voice) ----------------
const C2 = cut('L2'), C3 = cut('L3'), C4 = cut('L4'), C5 = cut('L5');
const tFood = w('L1', 'food'), tDisap = w('L1', 'disappearing'), tKitchen = w('L1', 'kitchen'), tSo = w('L1', 'so'), tSet = w('L1', 'set'), tHidden = w('L1', 'hidden'), tCamera1 = w('L1', 'camera');
const tJapan = w('L2', 'japan'), t2008 = w('L2', '2008'), tMan = w('L2', 'man'), tAlone = w('L2', 'alone'), tNoticed = w('L2', 'noticed'), tLittle = w('L2', 'little'), tFood2 = w('L2', 'food'), tMissing = w('L2', 'missing'), tThen2 = w('L2', 'then'), tMore = w('L2', 'more');
const tWired = w('L3', 'wired'), tPhone = w('L3', 'phone'), tOne = w('L3', 'one'), tWork = w('L3', 'work'), tBuzzed = w('L3', 'buzzed'), tSomeone = w('L3', 'someone'), tWalking = w('L3', 'walking'), tHouse = w('L3', 'house');
const tPolice = w('L4', 'police'), tSearched = w('L4', 'searched'), tRoom = w('L4', 'room'), tNobody = w('L4', 'nobody'), tThen4 = w('L4', 'then'), tOpened = w('L4', 'opened'), tTop = w('L4', 'top'), tShelf = w('L4', 'shelf'), tCloset = w('L4', 'closet');
const tWoman = w('L5', 'woman'), tLiving = w('L5', 'living'), tThere = w('L5', 'there'), tWith = w('L5', 'with'), tMattress = w('L5', 'mattress'), tFor = w('L5', 'for'), tYear = w('L5', 'year');

// ---------------- helpers ----------------
const put = (p, v, ry = 0) => { p.P.visible = true; p.P.position.copy(v); p.P.rotation.set(0, ry, 0); p.P.updateMatrixWorld(true); };
const CAMP = new THREE.Vector3(0, 1.4, 6);
const headOf = p => { p.P.updateMatrixWorld(true); return p.head.getWorldPosition(V(0, 0, 0)); };
const handOf = (p, left = 0) => { p.P.updateMatrixWorld(true); return (left ? p.aL : p.aR).hand.getWorldPosition(V(0, 0, 0)); };
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
function onHand(p, o, left = 0, pos = [0, 0, 0], rot = [0, 0, 0], s = 1) { o.visible = true; (left ? p.aL : p.aR).props.add(o); o.position.set(...pos); o.rotation.set(...rot); o.scale.setScalar(s); }
function place(o, v, rot = [0, 0, 0], s = 1) { scene.add(o); o.visible = true; o.position.copy(v); o.rotation.set(...rot); o.scale.setScalar(s); }
function reset() {
  CAST.forEach(p => { p.P.visible = false; });
  for (const o of PROPS) { scene.add(o); o.visible = false; o.rotation.set(0, 0, 0); o.scale.setScalar(1); }
  SPOT.forEach(s => s.intensity = 0); FLIGHT.intensity = 0; DOOR.rotation.y = 0; FBODY.visible = true; ITEMS.forEach(o => o.visible = true);
  WAS.userData.open(0); WAS.userData.nestLight.intensity = 0; lampL.intensity = 1.6; HCAM.userData.led.visible = true;
}
const camAt = (pos, look, fov = 45, focus, aper = 4, roll = 0) => ({ pos, look, fov, focus: focus ?? pos.distanceTo(look), aper, roll });
const hand = (c, t, a = 1) => { c.pos.x += noise(t, 1) * .012 * a; c.pos.y += noise(t, 2) * .01 * a; c.look.x += noise(t, 3) * .02 * a; c.look.y += noise(t, 4) * .016 * a; return c; };
const ledOn = t => Math.floor(t * 2.4) % 2 === 0;
// the fridge: door angle (0 shut … 1 wide), how many items are left
function fridge(open, left = ITEMS.length) { DOOR.rotation.y = -1.85 * open; FLIGHT.intensity = .9 * open; ITEMS.forEach((o, i) => o.visible = i < left); }
const FFRONT = FRW.clone().add(V(.08, 0, .95));          // where he stands at the fridge
const CAB = KIT.userData.camSpot;                        // the hidden camera's spot, on the upper cabinets
const TABLE = V(.3, 0, .32);                             // his chair at the little table
const DESKP = OO.clone().add(V(0, 0, .58));
const CL = WO.clone().add(V(0, 0, -1.8));                // the closet (front plane at z -1.78)
const NEST = CL.clone().add(V(0, .88, -.42));

// ---------------- shots ----------------
const SHOTS = []; const sh = o => SHOTS.push(o);
// 1a · Food kept disappearing from his kitchen.: from INSIDE the fridge: his face in the cold light, almost nothing left
sh({ t0: 0, set: 'kitchen', lt: NIGHT, at: KO, act: t => actFridge(t, 'hook'),
  cam: (t, u) => hand(camAt(FRW.clone().add(V(lerp(.06, .03, u), lerp(.96, 1.0, u), -.24)), FFRONT.clone().add(V(-.02, 1.3, 0)), lerp(72, 64, eo(u)), 1.25, 1.5), t, .5) });
// 1b · So he set up a hidden camera.: up on a stool, on top of the cabinets; the red light
sh({ t0: tSo - .1, set: 'kitchen', lt: NIGHT, at: KO, act: t => actHide(t), after: 1,
  cam: (t, u) => { const h = headOf(MAN); return hand(camAt(CAB.clone().add(V(-.06, .05, lerp(.06, .1, u))), h.clone().add(V(-.02, -.12, 0)), lerp(62, 56, u), h.distanceTo(CAB), 3), t, .6); } });
// 2a · Japan, 2008.: the street at dusk, his house; crane down
sh({ t0: C2, set: 'street', lt: DUSK, at: SO, act: t => actStreet(t), whip: 1,
  cam: (t, u) => { const k = eio(u); return hand(camAt(SO.clone().add(V(lerp(-3.2, -2.2, k), lerp(9.5, 2.0, k), lerp(14, 11.5, k))), SO.clone().add(V(lerp(-.5, .2, k), lerp(4.5, 3.2, k), -3)), 50, 14, 1), t, .5); } });
// 2b · A man who lived alone noticed it first.: dinner for one
sh({ t0: tMan - .15, set: 'kitchen', lt: NIGHT, at: KO, act: t => actDinner(t),
  cam: (t, u) => hand(camAt(V(lerp(-.2, -.05, u), lerp(1.3, 1.25, u), lerp(-1.3, -1.15, u)), V(.3, 1.05, .3), 46, 1.6, 4), t) });
// 2c · A little food missing. Then more.: back inside the fridge: things vanish, one, then a lot
sh({ t0: tLittle - .15, set: 'kitchen', lt: NIGHT, at: KO, act: t => actFridge(t, 'vanish'),
  cam: (t, u) => hand(camAt(FRW.clone().add(V(.05, lerp(.96, 1.0, u), -.24)), FFRONT.clone().add(V(-.02, 1.28, 0)), 72, 1.25, 1.5), t, .5) });
// 3a · He wired a camera to his phone.: over his shoulder, the live view on the phone
sh({ t0: C3, set: 'kitchen', lt: NIGHT, at: KO, act: t => actWire(t), after: 1,
  cam: (t, u) => { const h = headOf(MAN), ry = MAN.P.rotation.y, rt = V(-Math.cos(ry), 0, Math.sin(ry)), bk = V(-Math.sin(ry), 0, -Math.cos(ry)), p = PHONE.position.clone().add(V(0, .04, 0)); return hand(camAt(h.clone().add(rt.multiplyScalar(.34)).add(bk.multiplyScalar(lerp(.34, .26, u))).add(V(0, .1, 0)), p, 40, .55, 6), t, .25); } });
// 3b · One day at work, it buzzed:: the office; the phone jumps on the desk
sh({ t0: tOne - .1, set: 'office', lt: DAY, at: OO, act: t => actOffice(t), whip: 1,
  cam: (t, u) => hand(camAt(OO.clone().add(V(lerp(-.95, -.8, u), lerp(1.3, 1.25, u), lerp(-.25, -.1, u))), OO.clone().add(V(.12, 1.0, .4)), 46, 1.4, 4), t) });
// 3c · someone was walking through his house.: the camera feed: grey, grainy, a figure at the fridge
sh({ t0: tSomeone - .1, set: 'kitchen', lt: CCTV, at: KO, act: t => actFeed(t), cctv: 1,
  cam: (t, u) => camAt(CAB.clone().add(V(-.12, .02, .3)), V(-.55, .75, .1), 72, 3, 0) });
// 4a · Police searched every room.: two officers, flashlights, the dark tatami room
sh({ t0: C4, set: 'washitsu', lt: DARK, at: WO, act: t => actSearch(t, 0), whip: 1,
  cam: (t, u) => hand(camAt(WO.clone().add(V(lerp(-1.4, -1.2, u), lerp(.75, .8, u), lerp(-1.2, -1.0, u))), WO.clone().add(V(.4, 1.3, 1.4)), 56, 2.6, 3), t, .8) });
// 4b · Nobody.: a beam crossing the empty room
sh({ t0: tNobody - .1, set: 'washitsu', lt: DARK, at: WO, act: t => actSearch(t, 1),
  cam: (t, u) => hand(camAt(WO.clone().add(V(.9, 1.55, 1.9)), WO.clone().add(V(lerp(-1.2, 1.0, u), .9, -.6)), 52, 2.6, 2), t, .7) });
// 4c · Then they opened the top shelf of a closet.: the closet doors; a hand; push in (dolly zoom)
sh({ t0: tThen4 - .1, set: 'washitsu', lt: DARK, at: WO, act: t => actSearch(t, 2),
  cam: (t, u) => { const k = eio(u); return hand(camAt(CL.clone().add(V(.55, lerp(1.4, 1.35, k), lerp(2.4, 1.15, k))), CL.clone().add(V(.15, 1.25, 0)), lerp(30, 54, k), 1.6, 4), t, .5); } });
// 5a · A woman was living in there.: the reveal, in the flashlight
sh({ t0: C5, set: 'washitsu', lt: DARK, at: WO, act: t => actReveal(t, 0), flash: 1,
  cam: (t, u) => hand(camAt(NEST.clone().add(V(lerp(.48, .4, u), lerp(.62, .58, u), lerp(1.55, 1.25, eo(u)))), NEST.clone().add(V(.32, .5, -.05)), 44, 1.5, 2), t, .6) });
// 5b · With a mattress.: wide: her little room, the officers, him in the doorway
sh({ t0: tWith - .1, set: 'washitsu', lt: DARK, at: WO, act: t => actReveal(t, 1),
  cam: (t, u) => hand(camAt(WO.clone().add(V(lerp(-1.25, -1.1, u), lerp(1.4, 1.35, u), lerp(1.1, .9, u))), CL.clone().add(V(.3, 1.0, .1)), 52, 2.4, 3), t) });
// 5c · For about a year.: his face (it cuts back to him at the fridge)
sh({ t0: tFor - .1, set: 'washitsu', lt: DARK, at: WO, act: t => actReveal(t, 2), after: 1,
  cam: (t, u) => { const h = headOf(MAN); return hand(camAt(h.clone().add(V(lerp(-.45, -.38, u), .02, lerp(-.95, -.8, u))), h.clone().add(V(0, -.04, 0)), 40, .95, 6), t, .4); } });
SHOTS.forEach((s, i) => { s.t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : LOOP + 1; });

// ---------------- acting ----------------
function actFridge(t, mode) {
  reset(); FBODY.visible = false;     // the camera is inside: no shell in the way
  put(MAN, FFRONT, Math.PI);
  if (mode === 'hook') {
    fridge(1, 3);
    apply(MAN, { ...TP.stand, aL: [-60, 10, 0, 40], aR: [-20, 30, 0, 60], hd: [10, 0, 0] }, { t, seed: 3, face: t > tKitchen ? 'shock' : 'worried', look: FRW.clone().add(V(0, .9, 0)) });
  } else {
    const open = eo(seg(t, tLittle - .15, tLittle + .25));
    const gone = (t > tFood2 ? 1 : 0) + (t > tMissing ? 1 : 0) + Math.round(lerp(0, 6, seg(t, tThen2, tMore + .3)));
    fridge(open, ITEMS.length - gone);
    const mad = t > tMore;
    apply(MAN, { ...TP.stand, aL: [-62, 10, 0, 40], aR: mad ? [-40, 60, 0, 100] : [-20, 30, 0, 60], hd: [10, 0, 0] }, { t, seed: 3, face: mad ? 'angry' : t > tFood2 ? 'worried' : 'deadpan', look: FRW.clone().add(V(0, .9, 0)) });
  }
}
function actHide(t) {
  reset(); place(STOOL, V(1.5, 0, -1.05)); put(MAN, V(1.5, .42, -1.05), Math.PI);
  const k = seg(t, tSo, tHidden);
  apply(MAN, { ...TP.stand, sp: [-6, 0, 0], hd: [-14, 0, 0], aR: [-165 + 15 * k, 8, 0, 30], aL: [-40, 30, 0, 50] }, { t, seed: 3, face: t > tHidden ? 'smug' : 'deadpan', look: CAB.clone().add(V(0, .06, .1)), eyes: t > tHidden + .3 ? [.5, .3] : [0, .4] });
  HCAM.visible = false;   // we are the camera
}
function actStreet(t) { reset(); }
function actDinner(t) {
  reset(); fridge(0);
  put(MAN, TABLE, Math.PI);
  const bite = Math.max(0, Math.sin(t * 3.2)) ;
  apply(MAN, { ...TP.sitEat, y: -.06 }, { t, seed: 3, face: t > tNoticed ? 'worried' : 'calm', look: t > tNoticed ? FRW.clone().add(V(0, 1.0, 0)) : V(.3, .9, -.3) });
  onHand(MAN, CHOP, 0, [0, -.02, .05], [-1.2 + bite * .3, 0, 0], 1);
}
function actWire(t) {
  reset(); fridge(0);
  const mp = V(.6, 0, .55); put(MAN, mp, face(mp, CAB) * 0 + Math.PI - .5);
  apply(MAN, { ...TP.stand, aR: [-95, 10, 0, 70], aL: [-20, 20, 0, 40], hd: [12, 0, 0] }, { t, seed: 3, face: t > tPhone ? 'smug' : 'happy', look: handOf(MAN).add(V(0, .05, 0)) });
  const hp = handOf(MAN); place(PHONE, hp.add(V(0, .05, .02)), [0, 0, 0], 1); PHONE.lookAt(headOf(MAN)); PHONE.rotateX(-.25);
  place(HCAM, CAB.clone(), [0, -.4, 0], 1.2); HCAM.userData.led.visible = ledOn(t);
  PHONE.userData.screen('live' + Math.floor(t * 3), (c, w, h) => feedScreen(c, w, h, t, 0));
}
function feedScreen(c, w, h, t, alert) {   // the little live view on the phone: a grey kitchen, REC, and (alert) a figure
  c.fillStyle = '#2A2E34'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#4A4E56'; c.fillRect(0, h * .62, w, h * .38); c.fillStyle = '#6A6E76'; c.fillRect(20, 90, 70, 150); c.fillStyle = '#585C64'; c.fillRect(110, 140, 120, 60);
  if (alert) { c.fillStyle = '#16181C'; c.beginPath(); c.arc(150, 120, 16, 0, 7); c.fill(); c.fillRect(136, 136, 28, 70); }
  c.fillStyle = Math.floor(t * 2.4) % 2 ? '#FF2A2A' : '#7A1A1A'; c.beginPath(); c.arc(24, 24, 9, 0, 7); c.fill(); c.fillStyle = '#FFFFFF'; c.font = '700 22px Montserrat'; c.textAlign = 'left'; c.fillText('CAM 1 · LIVE', 40, 32);
  if (alert) { c.fillStyle = '#E8423A'; c.fillRect(0, h - 70, w, 70); c.fillStyle = '#FFFFFF'; c.font = '900 30px Montserrat'; c.textAlign = 'center'; c.fillText('⚠ MOTION', w / 2, h - 24); }
}
function actOffice(t) {
  reset();
  put(MAN, DESKP, Math.PI);
  const buzz = t > tBuzzed - .05, grab = t > tBuzzed + .45;
  apply(MAN, grab ? { ...TP.sit, y: -.04, aR: [-100, 10, 0, 60], aL: [-50, 10, 0, 70] } : { ...TP.sit, y: -.04, aL: [-50, 10, 0, 75], aR: [-50, 10, 0, 75] }, { t, seed: 3, face: grab ? 'shock' : buzz ? 'worried' : 'deadpan', look: buzz ? OO.clone().add(V(.28, .78, .05)) : OO.clone().add(V(0, 1.0, -.2)) });
  const shake = buzz && !grab ? Math.sin(t * 90) * .006 : 0;
  if (grab) { const hp = handOf(MAN); place(PHONE, hp.add(V(0, .05, .02)), [0, 0, 0], 1.1); PHONE.lookAt(headOf(MAN)); PHONE.rotateX(-.2); }
  else place(PHONE, OO.clone().add(V(.28 + shake, .78, .1)), [-Math.PI / 2 + .3, 0, .6], 1.3);
  PHONE.userData.screen(buzz ? 'alert' + (Math.floor(t * 4) % 2) : 'home', (c, w, h) => buzz ? feedScreen(c, w, h, t, 1) : (c.fillStyle = '#1E3A6E', c.fillRect(0, 0, w, h)));
  COWORK.forEach((p, i) => { const v = OO.clone().add([V(-1.6, 0, .35), V(1.6, 0, .35)][i]); put(p, v, Math.PI); apply(p, { ...TP.sit, y: -.04, aL: [-50, 10, 0, 75], aR: [-50, 10, 0, 75] }, { t, seed: 20 + i, face: 'calm', look: v.clone().add(V(0, 1.0, -.6)) }); });
}
function actFeed(t) {
  reset(); fridge(eo(seg(t, tWalking - .2, tHouse)), 2); lampL.intensity = 0;
  const k = seg(t, tSomeone - .1, tWalking + .2), v = V(lerp(1.4, -.9, k), 0, lerp(.5, -.5, k));
  put(WOMAN, v, face(v, FFRONT) );
  apply(WOMAN, k < 1 ? walk(TP.stand, t * 5.5, .6) : { ...TP.stand, aR: [-60, 10, 0, 30] }, { t, seed: 4, face: 'deadpan', look: FRW.clone().add(V(0, 1, 0)) });
  HCAM.visible = false;
}
const COPP = [WO.clone().add(V(-.3, 0, .9)), WO.clone().add(V(.7, 0, 1.5))];
function cops(t, aim) {   // two officers sweeping their flashlights; aim(i) → the point each beam looks at
  COP.forEach((p, i) => { put(p, COPP[i], face(COPP[i], aim(i))); apply(p, { ...TP.stand, aR: [-80, 8, 0, 20], aL: [-20, 20, 0, 40] }, { t, seed: 10 + i, face: 'deadpan', look: aim(i) });
    const hp = handOf(p); place(FLS[i], hp.clone().add(V(0, .03, 0)), [0, 0, 0], 1); FLS[i].lookAt(aim(i));
    SPOT[i].position.copy(FLS[i].position); SPOT[i].target.position.copy(aim(i)); SPOT[i].intensity = 9; });
}
function actSearch(t, phase) {
  reset();
  if (phase === 0) { cops(t, i => WO.clone().add(V(Math.sin(t * 1.3 + i * 2) * 1.6, .7 + Math.sin(t * 2 + i) * .3, -1.2))); put(MAN, WO.clone().add(V(1.6, 0, 2.3)), Math.PI + .5); apply(MAN, TP.stand, { t, seed: 3, face: 'worried', look: WO.clone().add(V(0, 1, -1)) }); }
  else if (phase === 1) { const a = WO.clone().add(V(lerp(-1.6, 1.4, seg(t, tNobody - .1, tThen4)), .6, -1.0)); SPOT[0].position.copy(WO.clone().add(V(.9, 1.4, 1.7))); SPOT[0].target.position.copy(a); SPOT[0].intensity = 10; }
  else {
    const p = COP[0], v = CL.clone().add(V(.75, 0, .62)); put(p, v, Math.PI + .25); WAS.userData.nestLight.intensity = 0;
    const reach = seg(t, tThen4, tOpened);
    apply(p, { ...TP.stand, aR: [-80, 8, 0, 20], aL: [-60 - 30 * reach, -20, 0, 30], sp: [6, 0, 0] }, { t, seed: 10, face: 'worried', look: CL.clone().add(V(.2, 1.3, 0)) });
    const hp = handOf(p); place(FLS[0], hp.clone().add(V(0, .03, 0))); FLS[0].lookAt(CL.clone().add(V(0, 1.3, 0)));
    SPOT[0].position.copy(FLS[0].position); SPOT[0].target.position.copy(CL.clone().add(V(0, 1.3, 0))); SPOT[0].intensity = 1.6;
    WAS.userData.open(.08 * eo(seg(t, tCloset - .25, tCloset + .05)));
  }
}
function actReveal(t, phase) {
  reset(); WAS.userData.open(1); WAS.userData.nestLight.intensity = 1.3;
  // her: sitting up on the mattress, knees drawn, blinking into the light
  const wv = NEST.clone().add(V(.34, -.02, -.12)); put(WOMAN, wv, -.12);
  apply(WOMAN, { ...TP.sit, y: -.33, sp: [-16, 0, 0], hd: [10, 0, 0], aL: [-35, 18, 0, 70], aR: [-35, 18, 0, 70], lL: [86, 8, 6], lR: [86, 8, 6] }, { t, seed: 4, face: phase === 0 && t < tLiving ? 'shock' : 'worried', look: COPP[0].clone().add(V(0, 1.5, 0)) });
  // the officers at the open closet, beams on her
  const aim = i => NEST.clone().add(V(.3 + i * .08, .45, -.05));
  COP.forEach((p, i) => { const v = CL.clone().add([V(1.0, 0, .95), V(-.85, 0, 1.15)][i]); put(p, v, face(v, aim(i))); apply(p, { ...TP.stand, aR: [-85, 8, 0, 20], aL: [-20, 30, 0, 60] }, { t, seed: 10 + i, face: 'shock', look: aim(i) });
    const hp = handOf(p); place(FLS[i], hp.clone().add(V(0, .03, 0))); FLS[i].lookAt(aim(i)); SPOT[i].position.copy(FLS[i].position); SPOT[i].target.position.copy(aim(i)); SPOT[i].intensity = phase === 0 ? 1.1 : 1.8; });
  const mv = CL.clone().add(V(.2, 0, 2.0)); put(MAN, mv, Math.PI); apply(MAN, { ...TP.stand, aL: [-30, 30, 0, 110], aR: [-30, 30, 0, 110], hd: [-6, 0, 0] }, { t, seed: 3, face: 'shock', look: NEST.clone().add(V(0, .3, 0)) });
}

// ---------------- sound events ----------------
ev(0, 'hum', { d: C2 }); ev(.04, 'boom'); ev(tDisap, 'pop'); ev(tSo, 'whoosh'); ev(tSet, 'click'); ev(tHidden, 'beep');
ev(C2 - .1, 'whoosh'); ev(C2, 'dusk', { d: tMan - C2 }); ev(t2008, 'hit');
ev(tMan - .15, 'tv', { d: tLittle - tMan }); ev(tLittle - .15, 'fridge'); ev(tFood2, 'pop'); ev(tMissing, 'pop'); for (let k = 0; k < 6; k++) ev(tThen2 + k * .08, 'pop'); ev(tMore, 'hit');
ev(tWired, 'beep'); ev(tPhone, 'beep'); ev(tOne - .15, 'whoosh'); ev(tOne, 'office', { d: tSomeone - tOne }); ev(tBuzzed - .05, 'vibrate'); ev(tBuzzed + .35, 'vibrate');
ev(tSomeone - .1, 'static', { d: C4 - tSomeone }); ev(tWalking, 'steps', { d: 1.0 });
ev(C4 - .1, 'whoosh'); ev(C4 + .1, 'flashclick'); ev(C4 + .35, 'flashclick'); ev(tSearched, 'steps', { d: 1.4 });
ev(tNobody, 'creak'); ev(tThen4, 'heart', { d: C5 - tThen4 }); ev(tCloset - .25, 'slide');
ev(C5, 'hit2'); ev(C5 + .02, 'gasp'); ev(tMattress, 'pop'); ev(tYear, 'sting');

// ---------------- overlay: telops, CCTV, captions (karaoke) ----------------
const ov = document.getElementById('ov').getContext('2d');
const TEL = [
  { t0: -9, t1: tSo - .1, text: "WHO'S EATING", y: 250, size: 116, col: '#FFFFFF', rot: -4, plate: '#16131A', hook: 1 },
  { t0: -9, t1: tSo - .1, text: 'HIS FOOD? 🤔', y: 420, size: 124, col: '#FFD23F', rot: -4, plate: '#C8283A', hook: 1 },
  { t0: tHidden - .05, t1: C2, text: '📹 HIDDEN CAMERA', y: 300, size: 96, col: '#FFFFFF', rot: -3, plate: '#C8283A' },
  { t0: tJapan - .05, t1: tMan - .15, text: 'JAPAN · 2008', y: 300, size: 130, col: '#FFFFFF', rot: -4, plate: '#16131A' },
  { t0: tAlone - .05, t1: tLittle - .15, text: 'LIVES ALONE', y: 300, size: 110, col: '#16131A', rot: 3, plate: '#F2C230' },
  { t0: tFood2 - .05, t1: C3, text: t => `FOOD MISSING: ${(t > tFood2 ? 1 : 0) + (t > tMissing ? 1 : 0) + Math.round(lerp(0, 6, seg(t, tThen2, tMore + .3)))}`, y: 300, size: 100, col: '#FFFFFF', rot: -3, plate: '#C8283A', mono: 'FOOD MISSING: 8' },
  { t0: tPhone - .05, t1: tOne - .1, text: '📱 LIVE ON HIS PHONE', y: 300, size: 84, col: '#FFFFFF', rot: -3, plate: '#2E6FB5' },
  { t0: tBuzzed - .03, t1: tSomeone - .1, text: 'BZZZ!', y: 330, size: 170, col: '#FFD23F', rot: -8, stamp: 1 },
  { t0: tSomeone, t1: C4, text: '⚠ MOTION DETECTED', y: 300, size: 84, col: '#FFFFFF', rot: 0, plate: '#E8423A' },
  { t0: tNobody - .03, t1: tThen4 - .1, text: 'NOBODY.', y: 330, size: 170, col: '#FFFFFF', rot: -6, stamp: 1 },
  { t0: tMattress - .05, t1: tFor - .1, text: 'HER BED 🛏️', y: 300, size: 120, col: '#16131A', rot: 3, plate: '#F2C230' },
  { t0: tYear - .05, t1: LOOP, text: '≈ 1 YEAR', y: 320, size: 190, col: '#FFD23F', rot: -6, stamp: 1 },
];
function drawTelop(x, t) {
  const p = seg(t, x.t0, x.t0 + .25), sc = x.stamp ? lerp(2.2, 1, eo(p)) : back(p, 2.6), wob = 1 + .02 * Math.sin((x.hook ? t : t - x.t0) * 8);
  const text = typeof x.text === 'function' ? x.text(t) : x.text;
  ov.save(); ov.translate(x.x ?? 540, x.y); ov.rotate(x.rot * Math.PI / 180); ov.scale(sc * wob, sc * wob); if (x.stamp) ov.globalAlpha = clamp(p * 3);
  ov.font = `900 ${x.size}px Montserrat`; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  const tw = Math.min(1000, ov.measureText(x.mono ?? text).width + 70), th = x.size * 1.4;
  if (x.plate) { ov.fillStyle = 'rgba(0,0,0,.85)'; ov.beginPath(); ov.roundRect(-tw / 2 + 10, -th / 2 + 12, tw, th, 28); ov.fill(); ov.fillStyle = x.plate; ov.beginPath(); ov.roundRect(-tw / 2, -th / 2, tw, th, 28); ov.fill(); }
  if (x.stamp) { ov.strokeStyle = x.col; ov.lineWidth = 16; ov.beginPath(); ov.roundRect(-tw / 2 + 5, -th / 2 + 8, tw - 10, th - 16, 20); ov.stroke(); }
  const light = ['#F2C230', '#7AF09A'].includes(x.plate);
  ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 20; ov.shadowOffsetY = 8; ov.lineWidth = x.size * .2; ov.strokeStyle = '#000'; if (!light) ov.strokeText(text, 0, 4, 960); ov.shadowColor = 'transparent'; ov.fillStyle = x.col; ov.fillText(text, 0, 4, 960);
  ov.restore();
}
// captions: three words at a time; the word being spoken lights up yellow and pops
const chunks = [];
TMJ.lines.forEach((l, li) => { let cur = []; const flush = () => { if (cur.length) chunks.push({ li, words: cur }); cur = []; };
  l.words.forEach(x => { const len = cur.reduce((a, y) => a + y.w.length + 1, 0) + x.w.length; if (cur.length && (len > 14 || cur.length >= 3)) flush(); cur.push(x); if (/[,.…!?:"]$/.test(x.w)) flush(); }); flush(); });
chunks.forEach((c, i) => { const n = chunks[i + 1]; c.a = c.words[0].t0 - .04; c.b = n ? Math.min(n.words[0].t0 - .04, c.words[c.words.length - 1].t1 + .6) : c.words[c.words.length - 1].t1 + .6; });
const CAPY = 1260;
function drawCaption(t, y = CAPY) {
  const c = chunks.find(c => t >= c.a && t < c.b); if (!c) return;
  const pop = back(seg(t, c.a, c.a + .12), 2.2), s = lerp(.6, 1, pop);
  ov.save(); ov.translate(W / 2, y); ov.scale(s, s); ov.font = '900 104px Montserrat'; ov.textBaseline = 'middle'; ov.lineJoin = 'round'; ov.textAlign = 'left';
  const words = c.words.map(x => x.w.replace(/"/g, '')), sp = ov.measureText(' ').width, ws = words.map(x => ov.measureText(x).width);
  let tot = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1); const k = Math.min(1, 1000 / tot); ov.scale(k, k);
  let x = -tot / 2;
  words.forEach((wd, i) => { const on = t >= c.words[i].t0 - .03 && (i === words.length - 1 || t < c.words[i + 1].t0 - .03);
    ov.save(); ov.translate(x + ws[i] / 2, 0); if (on) ov.scale(1.1, 1.1);
    ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 22; ov.shadowOffsetY = 8; ov.lineWidth = 26; ov.strokeStyle = '#000'; ov.strokeText(wd, -ws[i] / 2, 0);
    ov.shadowColor = 'transparent'; ov.fillStyle = on ? '#FFD23F' : '#FFFFFF'; ov.fillText(wd, -ws[i] / 2, 0); ov.restore(); x += ws[i] + sp; });
  ov.restore();
}
// the security-camera look: grain, scanlines, REC, a running timestamp
function drawCCTV(t) {
  const n = Math.floor(t * 24);
  ov.save(); ov.globalAlpha = .16; for (let i = 0; i < 1400; i++) { const r = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453, rr = r - Math.floor(r); ov.fillStyle = rr > .5 ? '#FFFFFF' : '#000000'; ov.fillRect((i * 97 + n * 31) % W, ((rr * 9973) | 0) % H, 3, 3); } ov.restore();
  ov.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += 6) ov.fillRect(0, y, W, 2);
  ov.strokeStyle = 'rgba(255,255,255,.8)'; ov.lineWidth = 8; const m = 70, L = 90; for (const [x, y, sx, sy] of [[m, m + 420, 1, 1], [W - m, m + 420, -1, 1], [m, H - m - 260, 1, -1], [W - m, H - m - 260, -1, -1]]) { ov.beginPath(); ov.moveTo(x, y + sy * L); ov.lineTo(x, y); ov.lineTo(x + sx * L, y); ov.stroke(); }
  if (n % 20 < 12) { ov.fillStyle = '#FF2A2A'; ov.beginPath(); ov.arc(130, 570, 18, 0, 7); ov.fill(); }
  ov.fillStyle = '#FFFFFF'; ov.font = '800 46px Montserrat'; ov.textAlign = 'left'; ov.textBaseline = 'middle'; ov.fillText('REC   CAM 1', 165, 572);
  const s = 3 + Math.floor(t - tSomeone); ov.font = '700 40px Montserrat'; ov.textAlign = 'right'; ov.fillText(`2008/05/12  14:03:${String(Math.max(0, s)).padStart(2, '0')}`, W - 110, H - 360);
}
// whip-pan smear across selected cuts (the frame dragged sideways), a white flash on the reveal
const WHIPS = SHOTS.filter(s => s.whip).map(s => s.t0), FLASHES = SHOTS.filter(s => s.flash).map(s => s.t0);
function drawWhip(t) {
  for (const tc of WHIPS) { const d = t - tc; if (Math.abs(d) > .13) continue; const a = 1 - Math.abs(d) / .13, dx = (d < 0 ? -1 : 1) * 70 * a;
    const src = renderer.domElement; ov.save(); for (let k = 1; k <= 7; k++) { ov.globalAlpha = .16 * a; ov.drawImage(src, dx * k / 3.5, 0); } ov.restore(); }
}
function drawFlash(t) { for (const tc of FLASHES) { const d = t - tc; if (d >= 0 && d < .3) { ov.fillStyle = `rgba(255,255,255,${.85 * (1 - d / .3)})`; ov.fillRect(0, 0, W, H); } } }
// the punch-in: a quick zoom on the words that land
const PUNCH = [tDisap, tHidden, t2008, tAlone, tMore, tBuzzed, tNobody, tCloset, tWoman, tYear];
const punch = t => PUNCH.reduce((a, tk) => { const d = t - tk; return a + (d < 0 ? 0 : d < .07 ? d / .07 : Math.exp(-(d - .07) * 6)) * .07; }, 0);

// ---------------- render ----------------
function frame(sh, t) {
  const u = seg(t, sh.t0, sh.t1);
  light(sh.lt, sh.at);
  for (const arr of Object.values(SETS)) arr.forEach(s => s.visible = false); SETS[sh.set].forEach(s => s.visible = true);
  let c = sh.after ? null : sh.cam(t, u); if (c) CAMP.copy(c.pos);
  sh.act(t);
  if (!c) { c = sh.cam(t, u); CAMP.copy(c.pos); }
  if (QS.get('dbg')) { const d = QS.get('dbg').split(',').map(Number); c = camAt(V(d[0], d[1], d[2]), V(d[3], d[4], d[5]), d[6] ?? 50, 3, 0); }
  camera.position.copy(c.pos); sky.position.copy(c.pos); camera.up.set(0, 1, 0); camera.lookAt(c.look); camera.rotateZ(c.roll ?? 0);
  camera.fov = c.fov * (1 - (sh.cctv ? 0 : punch(t))); camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  post.dof.focus = c.focus; post.dof.aper = c.aper; post.dof.maxCoc = 8;
  scene.updateMatrixWorld(true); post.composer.render();
}
const A0 = +(QS.get('a') ?? 0), B0 = +(QS.get('b') ?? DUR);
const shotAt = t => { const i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1); return SHOTS[i < 0 ? SHOTS.length - 1 : i]; };
function render(t) {
  const sh = shotAt(t);
  ov.clearRect(0, 0, W, H);
  frame(sh, t);
  if (QS.get('poster')) { ov.clearRect(0, 0, W, H); [["WHO'S EATING", 230, -4, '#FFFFFF', 120, '#16131A'], ['HIS FOOD? 🤔', 400, -4, '#FFD23F', 128, '#C8283A']].forEach(([text, y, rot, col, size, plate]) => drawTelop({ t0: -9, text, y, size, col, rot, plate }, t)); return; }
  if (QS.get('clean')) return;
  drawWhip(t);
  if (sh.cctv) drawCCTV(t);
  drawFlash(t);
  TEL.forEach(x => { if (t >= x.t0 && t < x.t1) drawTelop(x, t); }); drawCaption(t);
}
function texts(t) { return TEL.filter(x => typeof x.text === 'string' && t >= x.t0 + .3 && t < x.t1).map(x => ({ id: x.text, text: x.text, x0: 60, y0: x.y - x.size * .7, x1: 1020, y1: x.y + x.size * .7 })); }
EV.sort((a, b) => a.t - b.t);
window.SHOTLIST = SHOTS.map(s => [+s.t0.toFixed(3), +s.t1.toFixed(3), null]);
window.DUR = +(B0 - A0).toFixed(3); window.EV = EV; window.render = t => render(t + A0); window.TEXTS = t => texts(t + A0);
render(A0);
window.READY = true;
