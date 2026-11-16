// "The Luckiest Fool" · 3D vertical Short (1080×1920) in the v4 toon style: Lord Timothy Dexter of Newburyport, the merchant
// whose rivals' worst advice made him rich (bed warmers to the Caribbean, mittens to the tropics, coal to Newcastle), and his
// book with no punctuation. Outlined toon cast with big 2D faces, a camera that never sits still, 1–3 word captions.
// Every shot, action, telop and caption is placed from timing.json (the voice). render(t) is pure in t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { makePost } from '/core/three/post.js';
import { makeToon, apply, TP, mix, walk, toon } from './toon.js';
import { port, isle, snow, newc, study, chart, NBP, lonlat, routeTo, updateWater, animGulls, animSteam, animSnow, animSmoke,
  warmingPan, mitten, mittenPile, crate, sack, coalSack, picket, spyglass, shaker, quill, bookClosed, bookOpen } from './sets_dex.js';
import { skyDome } from './sky.js';
import { textPlane } from './kit.js';

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
const camera = new THREE.PerspectiveCamera(45, W / H, .03, 1500);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, ao: false });
post.bloom.strength = .2; post.bloom.threshold = .95; post.bloom.radius = .5;
const vg = post.vig.uniforms; vg.amt.value = .22; vg.sat.value = 1.2; vg.contrast.value = .12;
const zb = new ShaderPass({ uniforms: { tDiffuse: { value: null }, amt: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: 'uniform sampler2D tDiffuse; uniform float amt; varying vec2 vUv; void main(){ vec2 d = vUv - .5; vec4 s = vec4(0.); for (int i = 0; i < 14; i++) { float k = 1. - amt * float(i) / 13. * length(d) * 2.; s += texture2D(tDiffuse, .5 + d * k); } gl_FragColor = s / 14.; }' });
post.composer.insertPass(zb, 1);
const sun = new THREE.DirectionalLight('#FFF4E0', 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
scene.add(sun, sun.target); const hemi = new THREE.HemisphereLight('#BFDFFF', '#B0703A', 1); scene.add(hemi);
const sky = skyDome('#2A78E0', '#E8E2D6', V(-.4, .5, .6), '#FFF6D8'); scene.add(sky);
const bulb = new THREE.PointLight('#FFC870', 0, 8, 1.5); scene.add(bulb);
const DAY = { pos: [-26, 34, 30], col: '#FFF3E0', int: 3.2, hs: '#C8E0FF', hg: '#8A7A60', hemi: 1.05, fog: ['#DCE6EE', 70, 420], sky: ['#2E7EDA', '#E6EEF2', [-.4, .5, .6], '#FFF6D8'], env: .35, r: 14, warm: .1 };
const TROP = { pos: [20, 44, 26], col: '#FFF0D0', int: 3.6, hs: '#BFE8FF', hg: '#E0B080', hemi: 1.1, fog: ['#CDEBF0', 80, 420], sky: ['#1A84E8', '#D2F0F2', [.3, .7, .5], '#FFF8E0'], env: .4, r: 14, warm: .16 };
const SNOWL = { pos: [-20, 24, 20], col: '#E6EEFF', int: 1.7, hs: '#DCE6F4', hg: '#B8C4D4', hemi: 1.35, fog: ['#DCE4EE', 18, 150], sky: ['#9AAAC2', '#E2E8F0', [-.3, .3, .6], '#F2F4FA'], env: .4, r: 10, warm: 0 };
const COAL = { pos: [-24, 28, 26], col: '#F0E2C8', int: 2.2, hs: '#B8BCC4', hg: '#5A5048', hemi: 1.1, fog: ['#A8A49C', 40, 260], sky: ['#7E8A96', '#CAC6BC', [-.4, .4, .6], '#F0E6D0'], env: .3, r: 14, warm: .08 };
const STUDY = { pos: [3, 5, -6], col: '#E8F0FF', int: 1.6, hs: '#FFE8C8', hg: '#5A3A22', hemi: .75, env: .45, r: 5, bg: '#1A1410', warm: .22, bulb: 3.2 };
const MAPL = { pos: [-2, 9, 4], col: '#FFE8C8', int: 2.4, hs: '#FFF0D8', hg: '#6A4A2A', hemi: 1.0, env: .4, r: 6, bg: '#2A1E14', warm: .2 };
function light(o, at) {
  sun.color.set(o.col); sun.intensity = o.int; sun.position.set(at.x + o.pos[0], at.y + o.pos[1], at.z + o.pos[2]); sun.target.position.copy(at);
  const c = sun.shadow.camera, r = o.r ?? 10; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 1; c.far = 160; c.updateProjectionMatrix();
  hemi.color.set(o.hs); hemi.groundColor.set(o.hg); hemi.intensity = o.hemi;
  scene.fog = o.fog ? new THREE.Fog(o.fog[0], o.fog[1], o.fog[2]) : null; sky.visible = !!o.sky; scene.background = o.sky ? null : new THREE.Color(o.bg ?? '#2A2A30');
  if (o.sky) { const u = sky.material.uniforms; u.top.value.set(o.sky[0]); u.hor.value.set(o.sky[1]); u.sd.value.set(...o.sky[2]).normalize(); u.sc.value.set(o.sky[3]); }
  scene.environmentIntensity = o.env ?? .35; vg.warm.value = o.warm ?? .1;
  bulb.intensity = o.bulb ?? 0;
}

// ---------------- sets ----------------
const SET = { port: port(), isle: isle(), snow: snow(), newc: newc(), study: study(), chart: chart() };
for (const s of Object.values(SET)) { s.visible = false; scene.add(s); }
SET.isle.position.set(600, 0, 0); SET.snow.position.set(-600, 0, 0); SET.newc.position.set(0, 0, 600); SET.study.position.set(600, 0, 600); SET.chart.position.set(-600, 0, 600);
const O = k => SET[k].position;
const at = (k, x, y, z) => O(k).clone().add(V(x, y, z));

// ---------------- cast ----------------
const DEX = makeToon({ name: 'dexter', outfit: 'colonial', top: '#6E2A6E', vest: '#E8B848', pants: '#E8DCC0', trim: '#E2B848', hair: 'tricorn', hatC: '#1E1A22', shoe: '#1A1416', blush: 1 });
const RIV1 = makeToon({ name: 'riv1', outfit: 'colonial', top: '#2E4A3A', vest: '#C8C0B0', pants: '#3A3A40', trim: '#C8C8CC', hair: 'tricorn', hatC: '#2A2A30', glasses: 'round', shoe: '#1A1416' });
const RIV2 = makeToon({ name: 'riv2', outfit: 'colonial', top: '#4A4A5E', vest: '#8A2A2A', pants: '#2A2A30', trim: '#C8C8CC', hair: 'tricorn', hatC: '#1A1A20', mustache: '#2A1E18', shoe: '#1A1416', H: 1.06 });
const WK1 = makeToon({ name: 'wk1', outfit: 'tee', top: '#F4F1EA', pants: '#C8A070', hair: 'straw', hatC: '#E2C47A', shoe: '#5A3A20', blush: 1 });
const WK2 = makeToon({ name: 'wk2', outfit: 'tee', top: '#E8566A', pants: '#4A6A8A', hair: 'kerchief', hatC: '#F2C230', shoe: '#5A3A20' });
const TR1 = makeToon({ name: 'tr1', outfit: 'fur', top: '#7A4A2A', fur: '#F0E8DA', sash: '#C8283A', hair: 'ushanka', hatC: '#6A4A30', mustache: '#3A2A1A', shoe: '#2A1A10' });
const TR2 = makeToon({ name: 'tr2', outfit: 'fur', top: '#4A5A7A', fur: '#EDE6DA', sash: '#E8B030', hair: 'ushanka', hatC: '#4A3A2A', shoe: '#2A1A10', blush: 1 });
const SIB = makeToon({ name: 'sib', outfit: 'fur', top: '#9A3A3A', fur: '#F4F0E8', sash: '#2E6A9A', hair: 'ushanka', hatC: '#5A3A2A', shoe: '#2A1A10', blush: 1, H: .8 });
const MIN1 = makeToon({ name: 'min1', outfit: 'overalls', top: '#8A7A6A', pants: '#3A4A5A', hair: 'flatcap', hatC: '#3A3A42', mustache: '#2A2420', shoe: '#2A2420' });
const MIN2 = makeToon({ name: 'min2', outfit: 'overalls', top: '#6A7A8A', pants: '#4A3A30', hair: 'flatcap', hatC: '#4A4036', shoe: '#2A2420', blush: 1 });
const MIN3 = makeToon({ name: 'min3', outfit: 'overalls', top: '#9A6A5A', pants: '#3A3A44', hair: 'flatcap', hatC: '#2E2E34', shoe: '#2A2420', H: 1.05 });
const RD1 = makeToon({ name: 'rd1', outfit: 'dress', top: '#4A6A9A', shawl: '#C8A040', hair: 'bonnet', hatC: '#F4F1EA', ribbon: '#C8283A', shoe: '#2A1A10', blush: 1 });
const RD2 = makeToon({ name: 'rd2', outfit: 'colonial', top: '#7A5A3A', vest: '#E8DCC0', pants: '#5A4A3A', trim: '#C8A050', hair: 'tricorn', hatC: '#3A2A20', hairC: '#E8E4DC', mustache: '#ECE8E0', shoe: '#1A1416' });
const CAST = [DEX, RIV1, RIV2, WK1, WK2, TR1, TR2, SIB, MIN1, MIN2, MIN3, RD1, RD2]; CAST.forEach(p => scene.add(p.P));
const HATD = DEX.head.userData.hat;

// ---------------- props ----------------
const SPY = spyglass(); scene.add(SPY);
const PAN1 = warmingPan(); scene.add(PAN1);
const PANW1 = warmingPan(), PANW2 = warmingPan(); scene.add(PANW1, PANW2);
const GOO = new THREE.Mesh(new THREE.SphereGeometry(.14, 16, 10), new THREE.MeshStandardMaterial({ color: '#5A2A0E', roughness: .15 })); GOO.scale.set(1, .45, 1); PANW1.add(GOO);
const GOO2 = GOO.clone(); PANW2.add(GOO2);
const DRIP = new THREE.Mesh(new THREE.CylinderGeometry(.018, .006, .3, 8), GOO.material); scene.add(DRIP);
const crBW = crate('BED WARMERS', 'NEWBURYPORT'), crM1 = crate('WOOL MITTENS', 'T. DEXTER'), crM2 = crate('WOOL MITTENS', 'T. DEXTER'), crM3 = crate('WOOL MITTENS', 'T. DEXTER'); scene.add(crBW, crM1, crM2, crM3);
const MITD = mitten(); DEX.props.add(MITD); MITD.scale.setScalar(1.4); MITD.position.set(0, .03, 0);
const handMits = []; for (const p of [WK1, TR1, TR2, SIB]) for (const side of [p.props, p.propsL]) { const m = mitten(); m.scale.setScalar(1.25); m.position.set(0, .02, 0); side.add(m); handMits.push(m); }
const PILE = mittenPile(260, '#D8283A', .9, 4); scene.add(PILE);
const ARM1 = mittenPile(40, '#D8283A', .22, 8), ARM2 = mittenPile(40, '#D8283A', .22, 9); TR1.props.add(ARM1); TR2.props.add(ARM2);
const BAG1 = sack('#C8A050'), BAG2 = sack('#C8A050'); DEX.props.add(BAG1); DEX.propsL.add(BAG2);
for (const b of [BAG1, BAG2]) { const t = textPlane([{ text: '$', size: 200, y: 140, color: '#2A1A10', weight: 900, font: 'Montserrat' }], .18, .18, { w: 256, h: 256 }); t.position.set(0, .22, .182); b.add(t); b.scale.setScalar(.8); }
const SACKS = Array.from({ length: 10 }, () => { const s = coalSack(); scene.add(s); return s; });
const PK1 = picket('ON STRIKE!'), PK2 = picket('NO COAL!'), PK3 = picket('STRIKE!'); scene.add(PK1, PK2, PK3);
const BKC1 = bookClosed(), BKC2 = bookClosed(); RD1.props.add(BKC1); RD2.props.add(BKC2);
const BOOK = bookOpen(); SET.study.userData.desk.add(BOOK); BOOK.position.set(.05, .84, .1);
const QUILL = quill(); DEX.props.add(QUILL); QUILL.rotation.set(.5, 0, -.4);
const SALT = shaker('salt'), PEP = shaker('pepper'); DEX.propsL.add(SALT); DEX.props.add(PEP);
const PROPS = [SPY, PAN1, PANW1, PANW2, DRIP, crBW, crM1, crM2, crM3, MITD, ...handMits, PILE, ARM1, ARM2, BAG1, BAG2, ...SACKS, PK1, PK2, PK3, BKC1, BKC2, QUILL, SALT, PEP];
// gold coins (instanced, no ink)
const NC = 220; const COINS = new THREE.InstancedMesh(new THREE.CylinderGeometry(.07, .07, .016, 16), new THREE.MeshToonMaterial({ color: '#F2C230', emissive: '#5A3A00', emissiveIntensity: .25 }), NC); COINS.castShadow = true; COINS.frustumCulled = false; scene.add(COINS);
// punctuation glyphs (billboards)
const GLY = '.,;:!?'; const gm = [...GLY].map(ch => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.font = '900 120px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 10; g.strokeStyle = '#FFFFFF'; g.strokeText(ch, 64, 58); g.fillStyle = '#16131A'; g.fillText(ch, 64, 58); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide }); });
const GLYPHS = Array.from({ length: 70 }, (_, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.13, .13), gm[i % 6]); m.renderOrder = 5; scene.add(m); return m; });

// ---------------- key times (from the voice) ----------------
const C2 = cut('L2'), C3 = cut('L3'), C4 = cut('L4'), C5 = cut('L5'), C6 = cut('L6'), C7 = cut('L7'), C8 = cut('L8'), C9 = cut('L9');
const tRich = w('L1', 'rich'), tFrom = w('L1', 'from'), tAdvice = w('L1', 'advice');
const t1790 = w('L2', '1790s'), tRival = w('L2', 'rival'), tTim = w('L2', 'timothy'), tBroke = w('L2', 'broke');
const tTold = w('L3', 'told'), tShip = w('L3', 'ship'), tBed = w('L3', 'bed'), tTo3 = w('L3', 'to', 1), tCarib = w('L3', 'caribbean');
const tDid = w('L4', 'did'), tUsed = w('L4', 'used'), tMol = w('L4', 'molasses'), tSold4 = w('L4', 'sold');
const tWool = w('L5', 'wool'), tTo5 = w('L5', 'to'), tTrop = w('L5', 'tropics'), tTraders = w('L5', 'traders'), tAll = w('L5', 'all'), tSib = w('L5', 'siberia');
const tCoal = w('L6', 'coal'), tTown = w('L6', 'town'), tMiners = w('L6', 'miners'), tStrike = w('L6', 'strike'), tSold6 = w('L6', 'sold');
const tWrote = w('L7', 'wrote'), tBook = w('L7', 'book'), tWith = w('L7', 'with'), tNoP = w('L7', 'no'), tAll7 = w('L7', 'all');
const tReaders = w('L8', 'readers'), tSo8 = w('L8', 'so'), tSecond = w('L8', 'second'), tAdded = w('L8', 'added'), tPage = w('L8', 'page'), tJust = w('L8', 'just'), tPunct = w('L8', 'punctuation');
const tSalt = w('L9', 'salt'), tPepper = w('L9', 'pepper'), tPlease = w('L9', 'please');
const S1b = tRich - .12, S2b = tRival - .12, S3b = tShip - .15, S3c = tTo3 - .1, S4b = tMol - .15, S4c = tSold4 - .1, S5b = tTo5 - .12, S5c = tTraders - .12, S5d = tSib - .15;
const S6b = tTown + .3, S6c = tSold6 - .12, S7b = tWith - .12, S8b = tSo8 - .1, S9b = tPlease + .35;

// ---------------- helpers ----------------
const put = (p, v, ry = 0) => { p.P.visible = true; p.P.position.copy(v); p.P.rotation.set(0, ry, 0); p.P.updateMatrixWorld(true); };
const show = (...ps) => PROPS.forEach(o => o.visible = ps.includes(o));
const CAMP = new THREE.Vector3(0, 1.4, 6);
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
function reset() {
  CAST.forEach(p => p.P.visible = false); show(); COINS.count = 0; GLYPHS.forEach(g => g.visible = false);
  DEX.head.add(HATD); HATD.position.set(0, DEX.HR * .62, 0); HATD.rotation.set(0, 0, 0); HATD.visible = true;
  PANW1.userData.lid.visible = PANW2.userData.lid.visible = PAN1.userData.lid.visible = true; GOO.visible = GOO2.visible = false;
  BOOK.userData.turn(0); BOOK.userData.show('text'); SET.study.userData.chair && (SET.study.userData.chair.visible = true);
}
const headOf = p => { p.P.updateMatrixWorld(true); return p.head.getWorldPosition(V(0, 0, 0)); };
const handOf = (p, left) => { p.P.updateMatrixWorld(true); return (left ? p.propsL : p.props).getWorldPosition(V(0, 0, 0)); };
// a warming pan held at its grip p, pan pointing along dir, its face turned to the camera
function orientPan(pan, p, dir) { const z = dir.clone().negate(), y = CAMP.clone().sub(p); y.addScaledVector(z, -y.dot(z)).normalize(); const x = new THREE.Vector3().crossVectors(y, z); pan.position.copy(p); pan.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); }
const _m4 = new THREE.Matrix4(), _q4 = new THREE.Quaternion(), _e4 = new THREE.Euler(), _s4 = new THREE.Vector3(1, 1, 1);
// coins: rain (from the sky over a disc) or burst (from a point); lying flat once they land
function coins(t, t0, mode, c, r, n, i0 = 0, floor = 0) {
  for (let k = 0; k < n; k++) {
    const i = i0 + k; if (i >= NC) break; const ts = t0 + hash(i + 3) * (mode === 'rain' ? .9 : .25); const dt = t - ts; if (dt < 0) continue;
    let x, y, z, a = hash(i) * 6.3;
    if (mode === 'rain') { const rr = Math.sqrt(hash(i + 5)) * r; x = c.x + Math.sin(a) * rr; z = c.z + Math.cos(a) * rr; y = c.y + 3.5 + hash(i + 7) * 2 - 9.8 * dt * dt * .5; }
    else { const v = 2.2 + hash(i + 9) * 2.5, vy = 3.5 + hash(i + 11) * 2.5; x = c.x + Math.sin(a) * v * dt; z = c.z + Math.cos(a) * v * dt; y = c.y + vy * dt - 9.8 * dt * dt * .5; }
    const landed = y < floor + .008; if (landed) y = floor + .008;
    _q4.setFromEuler(_e4.set(landed ? 0 : t * 9 + i, a, landed ? 0 : t * 7 + i * 2)); _m4.compose(V(x, y, z), _q4, _s4); COINS.setMatrixAt(COINS.count++, _m4);
  }
  COINS.instanceMatrix.needsUpdate = true;
}

// ---------------- camera language ----------------
const camAt = (pos, look, fov = 45, focus, aper = 4, roll = 0) => ({ pos, look, fov, focus: focus ?? pos.distanceTo(look), aper, roll });
const hand = (c, t, a = 1) => { c.pos.x += noise(t, 1) * .012 * a; c.pos.y += noise(t, 2) * .01 * a; c.look.x += noise(t, 3) * .02 * a; c.look.y += noise(t, 4) * .016 * a; return c; };
const DXP = V(1.5, 0, -2.4);                      // Dexter on the wharf (the hook)
const STR = V(0, 0, 3.6);                         // Water Street: the advice
const RVP = V(-6.55, 0, 4.4);                      // the rivals scheming
const VAT = at('isle', 4.5, 0, 3.2);              // the molasses copper
const BEACH = at('isle', -9, 0, 1.2);
const SNO = at('snow', 0, 0, 0);
const QUAY = at('newc', 0, 0, 0);
const DESK = at('study', 0, 0, -.6);
const ROUTE_L = [lonlat(-70.9, 42.8), lonlat(-66, 36), lonlat(-60, 27), lonlat(-63.5, 19.5), lonlat(-66.5, 17.3)];
const ROUTE_LC = new THREE.CatmullRomCurve3(ROUTE_L.map(p => p.clone()), false, 'centripetal', .5);
const ROUTE = new THREE.CatmullRomCurve3([lonlat(-70.9, 42.8), lonlat(-66, 36), lonlat(-60, 27), lonlat(-63.5, 19.5), lonlat(-66.5, 17.3)].map(p => p.add(O('chart'))), false, 'centripetal', .5);
// FPV over Newburyport harbour, down onto Water Street (1790s)
const FP2 = new THREE.CatmullRomCurve3([V(-26, 15, -34), V(-18, 9, -16), V(-12, 4, -4), V(-9.4, 1.4, 2.9)], false, 'centripetal', .5);
const fpv2 = (t, u) => { const k = eio(seg(t, C2, S2b + .05)), p = FP2.getPointAt(k), a = FP2.getPointAt(Math.min(1, k + .06)); const lk = p.clone().add(a.sub(p).normalize().multiplyScalar(5)); return camAt(p, lk.lerp(V(-6.2, 1.2, 4.9), eio(seg(k, .55, 1))), lerp(64, 46, k), 5, 0, Math.sin(k * Math.PI) * .12); };
// fly in over the brig to the boiling house (He did.)
const FP4 = new THREE.CatmullRomCurve3([V(11, 8, -24), V(8, 5.5, -12), V(5, 2.6, -3.5), V(3.9, 1.65, .5)].map(p => p.add(O('isle'))), false, 'centripetal', .5);
const fpv4 = (t, u) => { const k = eio(seg(t, C4, tUsed + .05)), p = FP4.getPointAt(k), a = FP4.getPointAt(Math.min(1, k + .06)); const lk = p.clone().add(a.sub(p).normalize().multiplyScalar(4)); return camAt(p, lk.lerp(VAT.clone().add(V(-.3, 1.2, .9)), eio(seg(k, .4, 1))), lerp(60, 44, k), 3, 0, Math.sin(k * Math.PI) * .1); };

const SHOTS = [
  // 1a · The dumbest man in America: on the wharf, looking at us down the wrong end of his spyglass
  { t0: 0, t1: S1b, set: 'port', lt: DAY, at: V(0, 0, -3), act: t => act1(t),
    cam: (t, u) => hand(camAt(V(lerp(2.25, 2.0, eo(u)), lerp(.7, .85, u), lerp(.9, .1, eo(u))), V(lerp(1.62, 1.55, u), lerp(1.3, 1.25, u), DXP.z), 50, 2.9, 4), t, 1.2) },
  // 1b · …got RICH… from terrible advice: gold rains into his upturned hat; two rivals lean in at his ears
  { t0: S1b, t1: C2, set: 'port', lt: DAY, at: V(0, 0, -3), act: t => act1(t),
    cam: (t, u) => { const k = eio(seg(t, S1b, tFrom)); return hand(camAt(V(lerp(1.75, 1.6, k), lerp(.9, 1.15, k), lerp(.1, .35, k)), V(1.5, lerp(1.35, 1.15, k), DXP.z - .2), lerp(56, 52, k), lerp(2.5, 2.8, k), 5), t, 1 + k); } },
  // 2a · 1790s: FPV over Newburyport harbour, down onto Water Street
  { t0: C2, t1: S2b, set: 'port', lt: DAY, at: V(-6, 0, 2), act: t => act2(t), cam: fpv2, fpv: 1 },
  // 2b · Rival merchants wanted Timothy Dexter broke: the rivals scheme in the foreground; Dexter strolls by, oblivious
  { t0: S2b, t1: C3, set: 'port', lt: DAY, at: V(-4, 0, 3), act: t => act2(t),
    cam: (t, u) => { const k = eio(seg(t, tTim - .3, tTim + .3)); return hand(camAt(V(lerp(-5.95, -6.15, u), lerp(1.15, 1.2, u), lerp(1.35, 1.6, eo(u))), V(-6.05, 1.25, 4.8), 54, lerp(2.6, 3.7, k), 6), t, .8); } },
  // 3a · So they told him: one whispers in his ear
  { t0: C3, t1: S3b, set: 'port', lt: DAY, at: STR, act: t => act3(t),
    cam: (t, u) => hand(camAt(V(lerp(-.4, -.3, u), 1.22, lerp(1.3, 1.6, eo(u))), V(-.26, 1.25, STR.z + .1), 54, 2.2, 6), t, .8) },
  // 3b · ship bed warmers…: the warming pan, presented
  { t0: S3b, t1: S3c, set: 'port', lt: DAY, at: STR, act: t => act3(t),
    cam: (t, u) => hand(camAt(V(lerp(.48, .4, u), lerp(1.05, 1.1, u), lerp(1.1, 1.4, eo(u))), V(.42, 1.08, STR.z), 54, 2.3, 5), t, .9) },
  // 3c · …to the Caribbean!: the toy brig sails down the chart
  { t0: S3c, t1: C4, set: 'chart', lt: MAPL, at: O('chart'), act: t => act3(t),
    cam: (t, u) => { const p = ROUTE.getPointAt(eio(seg(t, S3c, C4 - .05))); return camAt(p.clone().add(V(.05, 2.3, .55)), p.clone().add(V(0, 0, -.05)), 46, 2.35, 3, 0); } },
  // 4a · He did. They used them…: fly in over the brig to the boiling house; the lid comes off
  { t0: C4, t1: S4b, set: 'isle', lt: TROP, at: VAT, act: t => act4(t), cam: fpv4, fpv: .8 },
  // 4b · …as molasses ladles: scooping molasses out of the copper
  { t0: S4b, t1: S4c, set: 'isle', lt: TROP, at: VAT, act: t => act4(t),
    cam: (t, u) => hand(camAt(VAT.clone().add(V(lerp(-.85, -.7, u), lerp(1.7, 1.65, u), lerp(-2.4, -2.1, eo(u)))), VAT.clone().add(V(-.15, 1.0, .8)), 50, 3.1, 5), t, .8) },
  // 4c · Sold out!: the workers cheer, coins fly
  { t0: S4c, t1: C5, set: 'isle', lt: TROP, at: VAT, act: t => act4(t),
    cam: (t, u) => hand(camAt(VAT.clone().add(V(lerp(-.6, -.45, u), lerp(1.5, 1.45, u), lerp(-3.5, -3.0, eo(u)))), VAT.clone().add(V(.2, 1.3, .8)), 54, 4.2, 4), t, 1.4) },
  // 5a · Next: wool mittens…: Dexter tries one on, delighted; the rivals snigger behind him
  { t0: C5, t1: S5b, set: 'port', lt: DAY, at: V(-2, 0, -2), act: t => act5(t),
    cam: (t, u) => hand(camAt(V(lerp(-1.55, -1.7, u), lerp(1.2, 1.25, u), lerp(-.2, -.6, eo(u))), V(-2.05, 1.3, -2.1), 48, 1.6, 5), t) },
  // 5b · …to the tropics: a mountain of mittens on a blazing beach
  { t0: S5b, t1: S5c, set: 'isle', lt: TROP, at: BEACH, act: t => act5(t),
    cam: (t, u) => hand(camAt(BEACH.clone().add(V(lerp(1.9, 1.6, u), lerp(.55, .75, u), lerp(-3.1, -2.6, eo(u)))), BEACH.clone().add(V(-.1, 1.0, .2)), 52, 3.2, 4), t) },
  // 5c · Traders bought them all: two fur-hatted traders scoop up armfuls
  { t0: S5c, t1: S5d, set: 'isle', lt: TROP, at: BEACH, act: t => act5(t),
    cam: (t, u) => hand(camAt(BEACH.clone().add(V(lerp(-.6, -.3, u), 1.1, lerp(-3.9, -3.5, eo(u)))), BEACH.clone().add(V(.45, 1.0, .6)), 54, 4.4, 4), t) },
  // 5d · …for Siberia!: snow; everyone waves in red mittens
  { t0: S5d, t1: C6, set: 'snow', lt: SNOWL, at: SNO, act: t => act5(t), fpv: .3,
    cam: (t, u) => hand(camAt(SNO.clone().add(V(lerp(.3, .1, u), lerp(1.0, 1.05, u), lerp(4.2, 3.1, eo(u)))), SNO.clone().add(V(0, 1.0, 0)), 50, 3.3, 4), t) },
  // 6a · Then: coal… to a coal town: off the coal brig's deck, crane up to the coal heaps and the pithead
  { t0: C6, t1: S6b, set: 'newc', lt: COAL, at: QUAY, act: t => act6(t),
    cam: (t, u) => { const k = eio(seg(t, C6 + .1, S6b)); return hand(camAt(QUAY.clone().add(V(lerp(-4.6, -5.4, k), lerp(.25, 3.6, k), lerp(-7.2, -3.4, k))), QUAY.clone().add(V(lerp(-2.4, 1.5, k), lerp(-.3, 3.8, k), lerp(-7.6, 12, k))), lerp(52, 56, k), lerp(2.5, 16, k), 3), t, .8); } },
  // 6b · The miners were on strike: the picket line marches past
  { t0: S6b, t1: S6c, set: 'newc', lt: COAL, at: QUAY.clone().add(V(0, 0, 2)), act: t => act6(t),
    cam: (t, u) => hand(camAt(QUAY.clone().add(V(lerp(-1.9, -.9, u), 1.2, -2.4)), QUAY.clone().add(V(lerp(-1.5, -.4, u), 1.45, 2.4)), 54, 4.9, 4), t) },
  // 6c · Sold out again!: back home, money bags; the rivals' jaws drop
  { t0: S6c, t1: C7, set: 'port', lt: DAY, at: STR, act: t => act6(t),
    cam: (t, u) => hand(camAt(V(lerp(.15, .05, u), lerp(1.1, 1.15, u), lerp(.75, 1.1, eo(u))), V(0, 1.15, STR.z), 54, 2.8, 4), t, 1.4) },
  // 7a · So Dexter wrote a book…: scribbling at his desk by candlelight
  { t0: C7, t1: S7b, set: 'study', lt: STUDY, at: DESK, act: t => act7(t),
    cam: (t, u) => hand(camAt(DESK.clone().add(V(lerp(.55, .38, eo(u)), lerp(1.12, 1.08, u), lerp(1.35, .95, eo(u)))), DESK.clone().add(V(0, 1.22, -.6)), 48, 1.65, 5), t, .7) },
  // 7b · …with no punctuation at all: down on the page, tracking along the run-on lines
  { t0: S7b, t1: C8, set: 'study', lt: STUDY, at: DESK, act: t => act7(t),
    cam: (t, u) => { const b = DESK.clone().add(V(.05, .88, .1)); return hand(camAt(b.clone().add(V(lerp(-.32, -.12, u), .5, .3)), b.clone().add(V(lerp(-.3, -.1, u), 0, -.02)), 44, .58, 6), t, .5); } },
  // 8a · Readers complained: one fumes, one runs out of breath
  { t0: C8, t1: S8b, set: 'port', lt: DAY, at: STR, act: t => act8(t),
    cam: (t, u) => hand(camAt(V(lerp(-.1, .05, u), 1.15, lerp(.85, 1.15, eo(u))), V(0, 1.2, STR.z), 54, 2.6, 5), t) },
  // 8b · So the second edition added a page of just punctuation…: the page turns
  { t0: S8b, t1: C9, set: 'study', lt: STUDY, at: DESK, act: t => act8(t),
    cam: (t, u) => { const b = DESK.clone().add(V(.05, .88, .1)); return hand(camAt(b.clone().add(V(lerp(.05, .2, u), lerp(1.0, .62, eo(u)), lerp(.75, .32, eo(u)))), b.clone().add(V(lerp(0, .2, eo(u)), 0, -.03)), 46, lerp(1.2, .7, eo(u)), 5), t, .5); } },
  // 9a · so they could salt and pepper it as they please: shaking punctuation onto the pages
  { t0: C9, t1: S9b, set: 'study', lt: STUDY, at: DESK, act: t => act9(t),
    cam: (t, u) => hand(camAt(DESK.clone().add(V(lerp(.62, .42, u), lerp(1.02, 1.1, u), lerp(1.55, 1.25, eo(u)))), DESK.clone().add(V(0, 1.25, -.5)), 50, 1.9, 5), t) },
  // 9b · the Lord himself: a wink
  { t0: S9b, t1: LOOP, set: 'study', lt: STUDY, at: DESK, act: t => act9(t),
    after: 1, cam: (t, u) => { const h = headOf(DEX); return hand(camAt(h.clone().add(V(lerp(.18, .12, u), lerp(-.06, -.03, u), lerp(1.5, 1.2, eo(u)))), h.clone().add(V(0, -.04, 0)), 40, lerp(1.3, 1.0, eo(u)), 6), t, .6); } },
];
SHOTS.push({ ...SHOTS[0], t0: LOOP, t1: DUR + 1, loop: 1 });

// ---------------- acting ----------------
function act1(t) {
  reset();
  put(DEX, DXP, face(DXP, V(2.1, 0, .4)));
  if (t < S1b) { apply(DEX, TP.spyglass, { t, seed: 1, face: 'happy', look: CAMP, noBlink: 1, eyes: [-.3, 0] }); show(SPY);
    const hq = DEX.head.getWorldQuaternion(new THREE.Quaternion()), hd = headOf(DEX), fw = V(0, 0, 1).applyQuaternion(hq), rt = V(1, 0, 0).applyQuaternion(hq);
    SPY.position.copy(hd).addScaledVector(fw, DEX.HR * .98).addScaledVector(rt, -.075).add(V(0, .005, 0)); SPY.scale.setScalar(1.6); SPY.lookAt(CAMP.clone().add(V(-1.1, -.2, 0))); }
  else {
    const k = seg(t, S1b, S1b + .2);
    apply(DEX, mix(TP.spyglass, TP.hatCatch, eo(k)), { t, seed: 1, face: 'laugh', look: CAMP });
    // the hat comes off into his hands, crown down: the coins land in it
    const hp = handOf(DEX).add(handOf(DEX, true)).multiplyScalar(.5).add(V(0, .1, .05)); scene.add(HATD); HATD.position.copy(hp); HATD.rotation.set(Math.PI - .25, DEX.P.rotation.y, 0); HATD.scale.setScalar(.9);
    coins(t, S1b, 'rain', hp, .28, 60, 0, hp.y - .02); coins(t, S1b + .1, 'rain', V(DXP.x, 0, DXP.z), 1.3, 70, 60, 0);
    // the rivals lean in at his ears
    const kr = eo(seg(t, tFrom - .25, tFrom + .15));
    put(RIV1, V(lerp(.0, .95, kr), 0, DXP.z - .35), face(V(.95, 0, DXP.z - .35), headOf(DEX))); apply(RIV1, TP.whisper, { t, seed: 2, face: 'evil', look: headOf(DEX), talk: t > tFrom ? .4 + .4 * Math.sin(t * 24) : 0 });
    put(RIV2, V(lerp(3.0, 2.1, kr), 0, DXP.z - .4), face(V(2.1, 0, DXP.z - .4), headOf(DEX))); apply(RIV2, TP.whisper, { t, seed: 3, face: 'evil', look: headOf(DEX) });
    if (kr <= 0) { RIV1.P.visible = RIV2.P.visible = false; }
  }
}
function act2(t) {
  reset();
  // the rivals, rubbing their hands
  const r1 = RVP.clone(), r2 = RVP.clone().add(V(1.0, 0, .05));
  put(RIV1, r1, Math.PI - .25); apply(RIV1, TP.rub, { t, seed: 2, face: 'evil', look: CAMP, eyes: t > tTim - .3 ? [.8, .2] : [0, 0] });
  put(RIV2, r2, Math.PI + .3); apply(RIV2, TP.rub, { t: t + .3, seed: 3, face: t > tBroke - .1 ? 'laugh' : 'evil', look: CAMP, eyes: t > tTim - .3 ? [-.8, .2] : [0, 0] });
  RIV1.aL.sh.rotation.z += Math.sin(t * 14) * .08; RIV2.aR.sh.rotation.z += Math.sin(t * 14 + 1) * .08;
  // Dexter strolls up Water Street toward us, waving to everyone
  const x = -6.05 + (tTim - t) * 1.25, dp = V(x, 0, 5.5);
  put(DEX, dp, -Math.PI / 2 - .35); apply(DEX, walk(TP.wave, x * 2.4, .9), { t, seed: 1, face: 'happy', look: CAMP });
}
function act3(t) {
  reset();
  if (t < S3b) {
    put(DEX, STR, Math.PI + .05); apply(DEX, TP.stand, { t, seed: 1, face: t > tTold + .2 ? 'shock' : 'calm', look: CAMP, eyes: [.6, 0] });
    put(RIV1, STR.clone().add(V(-.5, 0, .25)), 2.1); apply(RIV1, TP.whisper, { t, seed: 2, face: 'evil', look: headOf(DEX).add(V(.05, .02, .05)), talk: .35 + .35 * Math.sin(t * 22) });
  } else if (t < S3c) {
    put(DEX, STR, Math.PI / 2 + .35); apply(DEX, TP.cheer, { t, seed: 1, face: 'laugh', look: headOf(RIV1) });
    put(RIV1, STR.clone().add(V(.88, 0, 0)), -Math.PI / 2 - .55); apply(RIV1, TP.offer, { t, seed: 2, face: 'smug', look: CAMP, talk: t > tBed - .05 && t < tTo3 ? .4 + .4 * Math.sin(t * 24) : 0 });
    show(PAN1); const hp = handOf(RIV1), dir = headOf(DEX).sub(hp).setY(0).normalize().multiplyScalar(.45).add(V(0, 1, 0)).normalize(); orientPan(PAN1, hp, dir);
  } else {
    const k = eio(seg(t, S3c, C4 - .05)), p = ROUTE.getPointAt(k), q = ROUTE.getPointAt(Math.min(1, k + .01));
    const toy = SET.chart.userData.toy; toy.position.copy(p).sub(O('chart')).add(V(0, .03 + Math.abs(Math.sin(t * 9)) * .01, 0)); toy.rotation.set(0, Math.atan2(-(q.z - p.z), q.x - p.x), Math.sin(t * 7) * .1);
    routeTo(SET.chart, ROUTE_LC, k);
  }
}
function act4(t) {
  reset();
  const v = VAT;
  const w1 = v.clone().add(V(-.4, 0, 1.05)), w2 = v.clone().add(V(1.05, 0, .45));
  put(WK1, w1, face(w1, v)); put(WK2, w2, face(w2, v));
  show(PANW1, PANW2, crBW); crBW.position.copy(v).add(V(-2.2, 0, -1.8)); crBW.rotation.set(0, .4, 0);
  const top = v.clone().add(V(0, .88, 0));
  if (t < tUsed) {
    apply(WK1, TP.hold, { t, seed: 4, face: 'worried', look: CAMP, eyes: [.4, .3] }); orientPan(PANW1, handOf(WK1), V(0, 1, 0).add(CAMP.clone().sub(handOf(WK1)).setY(0).normalize().multiplyScalar(.5)).normalize());
    apply(WK2, TP.shrug, { t, seed: 5, face: 'worried', look: headOf(WK1) }); PANW2.visible = false;
  } else if (t < S4c) {
    // scoop: down into the copper, up dripping with molasses
    const ph1 = (t - tUsed) * 3.2, ph2 = ph1 + 1.6;
    const s1 = .5 + .5 * Math.sin(ph1), s2 = .5 + .5 * Math.sin(ph2);
    apply(WK1, mix(TP.ladleUp, TP.ladleDn, s1), { t, seed: 4, face: 'happy', look: s1 > .5 ? top : CAMP });
    apply(WK2, mix(TP.ladleUp, TP.ladleDn, s2), { t, seed: 5, face: 'happy', look: top });
    for (const [pan, g, s, wk] of [[PANW1, GOO, s1, WK1], [PANW2, GOO2, s2, WK2]]) {
      const hp = handOf(wk), down = top.clone().sub(hp).normalize(), up = top.clone().sub(hp).setY(0).normalize().multiplyScalar(.7).add(V(0, 1, 0)).normalize();
      orientPan(pan, hp, up.lerp(down, s).normalize()); pan.userData.lid.visible = false; g.visible = s < .6; g.position.set(0, .035, -.9);
    }
    if (s1 < .6) { DRIP.visible = true; DRIP.position.copy(PANW1.localToWorld(V(0, -.2, -.9))); DRIP.scale.y = .6 + Math.sin(t * 9) * .3; }
  } else {
    apply(WK1, TP.cheer, { t, seed: 4, face: 'laugh', look: CAMP }); apply(WK2, TP.cheer, { t: t + .2, seed: 5, face: 'laugh', look: CAMP });
    for (const [pan, wk] of [[PANW1, WK1], [PANW2, WK2]]) { orientPan(pan, handOf(wk), V(0, 1, 0)); pan.userData.lid.visible = false; }
    coins(t, S4c, 'burst', v.clone().add(V(0, 1.0, 0)), 0, 120, 0, 0);
  }
}
function act5(t) {
  reset();
  if (t < S5b) {   // Newburyport: crates of mittens; Dexter shows one off
    const dp = V(-2.05, 0, -2.2); put(DEX, dp, face(dp, V(-1.6, 0, 0))); apply(DEX, mix(TP.wave, TP.thumbs, 0), { t, seed: 1, face: 'happy', look: CAMP }); show(MITD);
    DEX.aR.sh.rotation.z += Math.sin(t * 12) * .12;
    show(MITD, crM1, crM2, crM3); crM1.position.set(-3.1, 0, -2.6); crM2.position.set(-3.0, .6, -2.55); crM3.position.set(-.9, 0, -2.9); crM1.rotation.y = .3; crM2.rotation.y = .1; crM3.rotation.y = -.4;
    put(RIV1, V(-3.6, 0, -3.5), .5); apply(RIV1, TP.rub, { t, seed: 2, face: 'laugh', look: headOf(DEX) });
    put(RIV2, V(-.6, 0, -3.6), -.4); apply(RIV2, TP.cross, { t, seed: 3, face: 'smug', look: headOf(DEX) });
  } else if (t < S5d) {   // the tropics: the mitten mountain, a sweating worker in mittens, then the traders
    const b = BEACH; show(PILE, ...handMits.slice(0, 2)); PILE.position.copy(b).add(V(.4, 0, .9));
    const wp = b.clone().add(V(-.7, 0, -.1)); put(WK1, wp, face(wp, CAMP));
    apply(WK1, t < S5c ? TP.shrug : TP.present, { t, seed: 4, face: t < S5c ? 'worried' : 'happy', look: t < S5c ? CAMP : headOf(TR1) });
    WK1.aL.sh.rotation.z += Math.sin(t * 10) * .15;
    if (t >= S5c) {
      const k = eo(seg(t, S5c - .1, S5c + .5)), tp1 = b.clone().add(V(lerp(2.6, 1.15, k), 0, lerp(-.6, .1, k))), tp2 = b.clone().add(V(lerp(3.2, 1.7, k), 0, lerp(.6, 1.05, k)));
      put(TR1, tp1, face(tp1, PILE.position)); put(TR2, tp2, face(tp2, PILE.position));
      const grab = t > tAll - .2;
      apply(TR1, grab ? TP.carry : walk(TP.stand, t * 9, k < 1 ? 1 : 0), { t, seed: 6, face: 'happy', look: CAMP }); apply(TR2, grab ? TP.carry : walk(TP.stand, t * 9 + 1, k < 1 ? 1 : 0), { t, seed: 7, face: 'laugh', look: CAMP });
      if (grab) { show(PILE, ...handMits.slice(0, 2), ARM1, ARM2); ARM1.position.set(.1, .12, .1); ARM2.position.set(.1, .12, .1); PILE.scale.setScalar(lerp(1, .55, seg(t, tAll - .2, tSib))); }
    }
  } else {   // Siberia
    show(...handMits.slice(2));
    const ps = [[TR1, V(-.75, 0, -.2), .25, 6], [TR2, V(.8, 0, -.35), -.2, 7], [SIB, V(.05, 0, .35), 0, 8]];
    ps.forEach(([p, d, ry, sd], i) => { const pp = SNO.clone().add(d); put(p, pp, ry); apply(p, i === 2 ? TP.cheer : TP.wave, { t: t + i * .3, seed: sd, face: ['laugh', 'happy', 'laugh'][i], look: CAMP }); p.aR.sh.rotation.z += Math.sin(t * 11 + i) * .2; });
  }
}
function act6(t) {
  reset();
  if (t < S6b) {   // the coal brig and its sacks
    const sh = SET.newc.userData.ship, base = QUAY.clone().add(V(-2, -.35, -7.6));
    SACKS.forEach((s, i) => { s.visible = true; const u = .3 + (i % 5) * .1, x = (u - .5) * 13, z = (Math.floor(i / 5) - .5) * .9; s.position.copy(base).add(V(x, sh.userData.deckY(u), z)); s.rotation.set(0, i * 1.3, (hash(i) - .5) * .3); s.scale.setScalar(1.3); });
  } else if (t < S6c) {   // the picket line
    const ms = [[MIN1, 0, PK1], [MIN2, 1.2, PK2], [MIN3, 2.4, PK3]];
    ms.forEach(([p, dx, pk], i) => { const x = lerp(-3.4, -1.4, seg(t, S6b, S6c)) + dx, pp = QUAY.clone().add(V(x, 0, 2.2 + (i % 2) * .4)); put(p, pp, Math.PI / 2 - .35); apply(p, walk(TP.sign, x * 2.4 + i, 1), { t: t + i, seed: 9 + i, face: 'angry', look: CAMP, talk: .3 + .3 * Math.sin(t * 15 + i) }); show(PK1, PK2, PK3); const hp = handOf(p).add(handOf(p, true)).multiplyScalar(.5); pk.position.copy(hp).add(V(0, -.55, 0)); pk.rotation.set(0, face(hp, CAMP) + Math.sin(t * 6 + i) * .15, Math.sin(t * 5 + i) * .06); });
    SET.newc.userData.pithead.userData.wheel.rotation.z = 0;
  } else {   // back home: money bags; the rivals gape
    put(DEX, STR.clone().add(V(0, 0, -.3)), Math.PI + .05); apply(DEX, TP.cheer, { t, seed: 1, face: 'laugh', look: CAMP }); show(BAG1, BAG2); BAG1.position.set(0, -.1, 0); BAG2.position.set(0, -.1, 0);
    DEX.root.position.y = Math.abs(Math.sin(t * 8)) * .12;
    put(RIV1, STR.clone().add(V(-.62, 0, .45)), Math.PI - .5); apply(RIV1, TP.shrug, { t, seed: 2, face: 'shock', look: headOf(DEX) });
    put(RIV2, STR.clone().add(V(.66, 0, .4)), Math.PI + .5); apply(RIV2, TP.gasp, { t, seed: 3, face: 'shock', look: headOf(DEX) });
    coins(t, S6c, 'rain', V(STR.x, 0, STR.z), 1.6, 120, 0, 0);
  }
}
function act7(t) {
  reset();
  const dp = DESK.clone().add(V(0, 0, -.62)); put(DEX, dp, 0);
  apply(DEX, mix(TP.write, { ...TP.write, hd: [-6, 0, 0] }, 1), { t, seed: 1, face: t > tBook ? 'laugh' : 'happy', look: CAMP, talk: 0 });
  DEX.aR.sh.rotation.y += Math.sin(t * 16) * .15; DEX.aR.el.rotation.x += Math.sin(t * 23) * .1;
  show(QUILL); QUILL.position.set(0, .02, .05);
  const fl = SET.study.userData.flame; fl.scale.set(1 + Math.sin(t * 13) * .1, 1.8 + Math.sin(t * 17) * .3, 1); bulb.position.copy(fl.getWorldPosition(V(0, 0, 0)));
}
function act8(t) {
  reset();
  if (t < S8b) {
    const p1 = STR.clone().add(V(-.45, 0, 0)), p2 = STR.clone().add(V(.5, 0, .1));
    put(RD1, p1, Math.PI - .25); apply(RD1, TP.hold, { t, seed: 11, face: 'angry', look: CAMP, talk: .3 + .3 * Math.sin(t * 20) }); show(BKC1); BKC1.position.set(.12, .08, .06); BKC1.rotation.set(-.3, 0, 0);
    const k = seg(t, tReaders, tSo8);
    put(RD2, p2, Math.PI + .25); apply(RD2, k > .3 ? TP.gasp : TP.hold, { t, seed: 12, face: k > .3 ? 'shock' : 'worried', look: CAMP });
    if (k <= .3) { show(BKC1, BKC2); BKC2.position.set(.12, .08, .06); BKC2.rotation.set(-.3, 0, 0); }
    RD2.P.rotation.z = Math.sin(t * 18) * .03 * k; RD2.head.scale.setScalar(1 + .06 * k * Math.abs(Math.sin(t * 9)));
  } else {
    const dp = DESK.clone().add(V(0, 0, -.62)); put(DEX, dp, 0); apply(DEX, TP.write, { t, seed: 1, face: 'smug', look: DESK.clone().add(V(.1, .8, .1)) });
    const k = eio(seg(t, tAdded - .15, tPage + .1)); BOOK.userData.turn(k);
    if (k > 0) BOOK.userData.show('punct');
  }
  const fl = SET.study.userData.flame; fl.scale.set(1 + Math.sin(t * 13) * .1, 1.8 + Math.sin(t * 17) * .3, 1); bulb.position.copy(fl.getWorldPosition(V(0, 0, 0)));
}
function act9(t) {
  reset();
  BOOK.userData.show('punct');
  const dp = DESK.clone().add(V(0, 0, -.55)); put(DEX, dp, 0);
  const sh = Math.sin(t * 22);
  apply(DEX, TP.shake, { t, seed: 1, face: t > S9b + .4 && t < S9b + .9 ? 'smug' : 'laugh', look: CAMP, wink: t > S9b + .4 && t < S9b + .9 });
  DEX.aL.el.rotation.x += sh * .25; DEX.aR.el.rotation.x -= sh * .25;
  show(SALT, PEP); SALT.rotation.set(Math.PI - .4, 0, 0); PEP.rotation.set(Math.PI - .4, 0, 0); SALT.position.set(0, -.04, .02); PEP.position.set(0, -.04, .02);
  // punctuation pours out of the shakers and settles on the pages
  const hs = [handOf(DEX, true), handOf(DEX, false)], bookY = DESK.y + .9;
  GLYPHS.forEach((g, i) => { const src = hs[i % 2], cyc = 1.1, ph = ((t - C9) / cyc + hash(i)) % 1; if (t < C9 + .05) return;
    const fall = ph * cyc, y = src.y - .12 - 4.9 * fall * fall; g.visible = true;
    if (y < bookY) { g.position.set(src.x + (hash(i + 2) - .5) * .25, bookY + .002, src.z + .1 + (hash(i + 4) - .5) * .2); g.rotation.set(-Math.PI / 2, 0, hash(i) * 6); }
    else { g.position.set(src.x + (hash(i + 2) - .5) * .25 * fall * 2, y, src.z + .1 + (hash(i + 4) - .5) * .2 * fall * 2); g.quaternion.copy(camera.quaternion); } });
  const fl = SET.study.userData.flame; fl.scale.set(1 + Math.sin(t * 13) * .1, 1.8 + Math.sin(t * 17) * .3, 1); bulb.position.copy(fl.getWorldPosition(V(0, 0, 0)));
}

// ---------------- sound events (the score reads these) ----------------
ev(0, 'harbour', { d: S1b }); ev(.1, 'pop'); ev(S1b, 'coins', { d: C2 - S1b }); ev(tRich, 'ding'); ev(tFrom - .2, 'evil');
ev(C2 - .05, 'whoosh'); ev(t1790, 'pop'); ev(S2b, 'cut'); ev(tTim, 'pop'); ev(tBroke, 'evil');
ev(C3, 'cut'); ev(tTold, 'whisper', { d: S3b - tTold }); ev(S3b, 'pop'); ev(tBed, 'clang'); ev(S3c - .05, 'whoosh'); ev(S3c + .1, 'sail', { d: C4 - S3c });
ev(C4 - .05, 'whoosh'); ev(tUsed, 'pop'); ev(S4b, 'cut'); ev(S4b + .1, 'glug'); ev(S4b + .5, 'glug'); ev(tSold4 - .05, 'stamp'); ev(tSold4, 'coins', { d: .8 }); ev(tSold4 + .05, 'cheer');
ev(C5, 'cut'); ev(tWool, 'pop'); ev(S5b - .05, 'whoosh'); ev(tTrop, 'boing'); ev(S5c, 'cut'); ev(tAll - .2, 'pop'); ev(S5d - .05, 'whoosh'); ev(S5d, 'wind', { d: C6 - S5d + .2 }); ev(tSib + .1, 'cheer');
ev(C6 - .05, 'whoosh'); ev(tTown, 'sting'); ev(S6b, 'cut'); ev(S6b + .05, 'chant', { d: S6c - S6b }); ev(tSold6 - .05, 'stamp'); ev(S6c, 'coins', { d: C7 - S6c + .3 }); ev(S6c + .1, 'cheer');
ev(C7 - .05, 'whoosh'); ev(C7 + .1, 'scribble', { d: S7b - C7 }); ev(S7b, 'cut'); ev(tNoP, 'pop');
ev(C8, 'cut'); ev(tReaders + .3, 'gasp'); ev(S8b, 'cut'); ev(tSecond, 'pop'); ev(tAdded, 'page'); ev(tPunct, 'ding');
ev(C9, 'whoosh'); ev(C9 + .05, 'shake', { d: S9b - C9 }); ev(tSalt, 'pop'); ev(tPepper, 'pop'); ev(S9b + .4, 'ding');

// ---------------- the overlay: telops + captions ----------------
const ov = document.getElementById('ov').getContext('2d');
const snap = document.createElement('canvas'); snap.width = W; snap.height = H; const sctx = snap.getContext('2d');
const TEL = [
  { t0: -1, t1: S1b, text: 'DUMBEST MAN IN AMERICA?', y: 300, size: 84, col: '#FFFFFF', rot: -3, plate: '#6E2A6E' },
  { t0: tRich - .03, t1: C2, text: 'RICH!', y: 300, size: 170, col: '#FFD23F', rot: -6, stamp: 1 },
  { t0: t1790 - .05, t1: S2b + .2, text: '1790s', y: 300, size: 170, col: '#FFD23F', rot: -5, sub: 'NEWBURYPORT, MASSACHUSETTS' },
  { t0: tTim - .1, t1: C3, text: 'TIMOTHY DEXTER', y: 1440, size: 84, col: '#FFFFFF', rot: -3, plate: '#6E2A6E', sub: 'SELF-PROCLAIMED "LORD"' },
  { t0: tTold - .05, t1: S3b, text: 'THE ADVICE:', y: 300, size: 100, col: '#FFFFFF', rot: 3, plate: '#2E4A3A' },
  { t0: tBed - .05, t1: S3c, text: 'BED WARMERS', y: 300, size: 110, col: '#FFD23F', rot: -4, plate: '#1B1213', sub: 'FOR COLD BEDS' },
  { t0: tCarib - .1, t1: C4, text: 'TO THE CARIBBEAN?!', y: 300, size: 92, col: '#FFFFFF', rot: 3, plate: '#2E9AA8' },
  { t0: tMol - .05, t1: S4c, text: 'MOLASSES LADLES', y: 300, size: 96, col: '#FFFFFF', rot: -3, plate: '#7A3A12' },
  { t0: tSold4 - .03, t1: C5, text: 'SOLD OUT!', y: 300, size: 150, col: '#E8423A', rot: -7, stamp: 1 },
  { t0: tWool - .05, t1: S5b, text: 'WOOL MITTENS', y: 300, size: 110, col: '#FFFFFF', rot: 3, plate: '#C8283A' },
  { t0: tTrop - .1, t1: S5c, text: 'IN THE TROPICS?!', y: 300, size: 100, col: '#FFFFFF', rot: -3, plate: '#E8862A' },
  { t0: tSib - .05, t1: C6, text: 'SIBERIA', y: 300, size: 160, col: '#FFFFFF', rot: -4, plate: '#3A6AAA', sub: 'NEEDS MITTENS' },
  { t0: tCoal - .05, t1: tTown - .1, text: 'COAL', y: 300, size: 160, col: '#FFFFFF', rot: 3, plate: '#26262A' },
  { t0: tTown - .1, t1: S6b, text: 'TO NEWCASTLE?!', y: 300, size: 100, col: '#FFFFFF', rot: -3, plate: '#26262A', sub: "ENGLAND'S COAL CAPITAL" },
  { t0: tSold6 - .03, t1: C7, text: 'SOLD OUT AGAIN!', y: 300, size: 110, col: '#E8423A', rot: -7, stamp: 1 },
  { t0: tWrote - .05, t1: S7b, text: 'A PICKLE FOR THE KNOWING ONES', y: 300, size: 62, col: '#FFD23F', rot: -2, plate: '#2A1A10', sub: 'BY T. DEXTER · 1802' },
  { t0: tNoP - .05, t1: C8, text: 'PERIODS: 0', y: 300, size: 110, col: '#FFFFFF', rot: 4, plate: '#1B1213' },
  { t0: tAll7 - .05, t1: C8, text: 'COMMAS: 0', y: 470, size: 110, col: '#FFFFFF', rot: -3, plate: '#1B1213' },
  { t0: tReaders + .3, t1: S8b, text: 'WHERE DO I BREATHE?!', y: 300, size: 84, col: '#FFFFFF', rot: 3, plate: '#2E5A9A' },
  { t0: tSecond - .05, t1: C9, text: '2ND EDITION', y: 300, size: 120, col: '#FFD23F', rot: -4, plate: '#2A1A10' },
  { t0: tSalt - .1, t1: LOOP, text: '"PEPER AND SOLT IT AS THEY PLESE"', y: 300, size: 54, col: '#FFFFFF', rot: -2, plate: '#2A1A10', sub: '— T. DEXTER, 1802' },
];
function drawTelop(x, t) {
  const p = seg(t, x.t0, x.t0 + .25), sc = x.stamp ? lerp(2.2, 1, eo(p)) : back(p, 2.6), wob = 1 + .02 * Math.sin((t - x.t0) * 8);
  const text = typeof x.text === 'function' ? x.text(t) : x.text;
  ov.save(); ov.translate(540, x.y); ov.rotate(x.rot * Math.PI / 180); ov.scale(sc * wob, sc * wob); if (x.stamp) ov.globalAlpha = clamp(p * 3);
  ov.font = `900 ${x.size}px Montserrat`; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  const tw = Math.min(1000, ov.measureText(text).width + 70), th = x.size * 1.4;
  if (x.plate) { ov.fillStyle = 'rgba(0,0,0,.85)'; ov.beginPath(); ov.roundRect(-tw / 2 + 10, -th / 2 + 12, tw, th, 28); ov.fill(); ov.fillStyle = x.plate; ov.beginPath(); ov.roundRect(-tw / 2, -th / 2, tw, th, 28); ov.fill(); }
  if (x.stamp) { ov.strokeStyle = x.col; ov.lineWidth = 14; ov.beginPath(); ov.roundRect(-tw / 2 + 5, -th / 2 + 8, tw - 10, th - 16, 18); ov.stroke(); }
  ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 20; ov.shadowOffsetY = 8; ov.lineWidth = x.size * .2; ov.strokeStyle = '#000'; ov.strokeText(text, 0, 4, 940); ov.shadowColor = 'transparent'; ov.fillStyle = x.col; ov.fillText(text, 0, 4, 940);
  if (x.sub) { ov.font = '900 46px Montserrat'; const sw = ov.measureText(x.sub).width + 44; ov.fillStyle = '#FFD23F'; ov.beginPath(); ov.roundRect(-sw / 2, x.size * .7 + 4, sw, 66, 18); ov.fill(); ov.fillStyle = '#1B1213'; ov.fillText(x.sub, 0, x.size * .7 + 39); }
  ov.restore();
}
const chunks = [];
TMJ.lines.forEach((l, li) => { let cur = []; const flush = () => { if (cur.length) chunks.push({ li, words: cur }); cur = []; };
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
  updateWater(tt); animGulls(SET.port, tt); animSteam(SET.isle, tt); animSmoke(SET.newc, tt);
  for (const k of ['port', 'isle', 'newc']) { const f = SET[k].userData.ship?.userData.flag; if (f) f.rotation.y = Math.PI / 2 + Math.sin(tt * 3) * .15; }
  let c = sh.after ? null : sh.cam(tt, u); if (c) CAMP.copy(c.pos);
  sh.act(tt);
  if (!c) { c = sh.cam(tt, u); CAMP.copy(c.pos); }
  camera.position.copy(c.pos); sky.position.copy(c.pos); camera.up.set(0, 1, 0); camera.lookAt(c.look); camera.rotateZ(c.roll ?? 0); camera.fov = c.fov; camera.updateProjectionMatrix();
  if (sh.set === 'snow') animSnow(SET.snow, tt, c.pos.clone().sub(O('snow')));
  post.dof.focus = c.focus; post.dof.aper = c.aper; post.dof.maxCoc = 8;
  const f = sh.fpv ? Math.sin(seg(tt, sh.t0, sh.t1) * Math.PI) * sh.fpv : 0; zb.uniforms.amt.value = f * .09; zb.enabled = f > .02;
  scene.updateMatrixWorld(true);
  GLYPHS.forEach(g => { if (g.visible && g.rotation.x !== -Math.PI / 2) g.quaternion.copy(camera.quaternion); });
  post.composer.render();
}
const A0 = +(QS.get('a') ?? 0), B0 = +(QS.get('b') ?? DUR);
function render(t) {
  const i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1), sh = SHOTS[i < 0 ? SHOTS.length - 1 : i];
  const prev = SHOTS[i - 1], dis = prev?.dissolveOut && !sh.loop && t < sh.t0 + prev.dissolveOut ? 1 - (t - sh.t0) / prev.dissolveOut : 0;
  ov.clearRect(0, 0, W, H);
  if (dis > 0) { frame(prev, t); sctx.clearRect(0, 0, W, H); sctx.drawImage(renderer.domElement, 0, 0); }
  frame(sh, t);
  if (dis > 0) { ov.globalAlpha = eio(dis) * .85; ov.drawImage(snap, 0, 0); ov.globalAlpha = 1; }
  if (QS.get('poster')) { ov.clearRect(0, 0, W, H); [['HE GOT RICH FROM', 170, -4, '#FFFFFF', 104], ['TERRIBLE ADVICE', 320, -4, '#FFD23F', 120]].forEach(([text, y, rot, col, size]) => drawTelop({ t0: -9, text, y, size, col, rot }, t)); return; }
  if (QS.get('clean')) return;
  if (t < LOOP) { TEL.forEach(x => { if (t >= x.t0 && t < x.t1) drawTelop(x, t); }); drawCaption(t); }
}
function texts(t) { if (t >= LOOP) return []; return TEL.filter(x => typeof x.text === 'string' && t >= x.t0 + .3 && t < x.t1).map(x => ({ id: x.text, text: x.text, x0: 60, y0: x.y - x.size * .7, x1: 1020, y1: x.y + x.size * .7 })); }
EV.sort((a, b) => a.t - b.t);
window.DUR = +(B0 - A0).toFixed(3); window.EV = EV; window.render = t => render(t + A0); window.TEXTS = t => texts(t + A0);
render(A0);
window.READY = true;
