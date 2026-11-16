// "What If Everyone Had Ratings Above Their Heads?" · the full story · 3D long-form video (1920×1080, ~5 min), v4 toon style.
// Cold open on the wall (50,000 people reading the one number he paid to hide), a rewind, then five chapters: the rules, the zero,
// the ranking, the wall, the point. Built from the three Shorts (same sets, cast and cards) with new beats for the long version.
// Every shot, action, telop and caption is placed from timing.json (the voice). render(t) is pure in t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { makePost } from '/core/three/post.js';
import { makeToon, apply, TP, mix, walk, TM, G } from './toon.js';
import { city, stadium, coffee, ST, SD } from './sets_ratings.js';
import { fullCard, miniCard, heart, tier } from './cards.js';
import { skyDome } from './sky.js';

const W = 1920, H = 1080;
await document.fonts.load('900 80px Montserrat'); await document.fonts.load('800 80px Montserrat'); await document.fonts.load('700 80px Fredoka'); await document.fonts.load('600 80px Fredoka');
const TMJ = await (await fetch('timing.json')).json();
const B = 60 / TMJ.bpm, DUR = TMJ.dur, LOOP = DUR - B;
const LN = Object.fromEntries(TMJ.lines.map(l => [l.id, l]));
const nrm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const w = (lid, word, k = 0) => { const ws = LN[lid].words.filter(x => nrm(x.w).startsWith(nrm(word))); return (ws[k] || ws[ws.length - 1] || { t0: LN[lid].t0 }).t0; };
const cut = id => { const i = TMJ.lines.findIndex(l => l.id === id), pv = TMJ.lines[i - 1], l = LN[id];   // never cut away while the last line is still being said
  return pv ? Math.max(l.cut, Math.min(pv.t1 + .06, l.t0 - .02)) : l.cut; };
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
const SUNNY = { pos: [-22, 38, 30], col: '#FFF1DA', int: 3.0, hs: '#C8E0FF', hg: '#A89A80', hemi: 1.05, fog: ['#C8DCEC', 70, 420], sky: ['#2A78E0', '#E4EEF2', [-.4, .5, .6], '#FFF6D8'], env: .35, r: 14, warm: .12 };
const GREY = { pos: [-10, 40, 22], col: '#C4CCD8', int: 1.1, hs: '#B4BFCE', hg: '#6A6A70', hemi: 1.3, fog: ['#98A2AE', 28, 220], sky: ['#727C8C', '#AEB6C0', [0, .5, .6], '#D0D4DA'], env: .3, r: 12, warm: 0 };
const _ca = new THREE.Color(), _cb = new THREE.Color();
const lc = (a, b, k) => '#' + _ca.set(a).lerp(_cb.set(b), k).getHexString();
const mixLT = (a, b, k) => ({ pos: a.pos.map((v, i) => lerp(v, b.pos[i], k)), col: lc(a.col, b.col, k), int: lerp(a.int, b.int, k), hs: lc(a.hs, b.hs, k), hg: lc(a.hg, b.hg, k), hemi: lerp(a.hemi, b.hemi, k),
  fog: [lc(a.fog[0], b.fog[0], k), lerp(a.fog[1], b.fog[1], k), lerp(a.fog[2], b.fog[2], k)], sky: [lc(a.sky[0], b.sky[0], k), lc(a.sky[1], b.sky[1], k), a.sky[2].map((v, i) => lerp(v, b.sky[2][i], k)), lc(a.sky[3], b.sky[3], k)], env: lerp(a.env, b.env, k), r: a.r, warm: lerp(a.warm, b.warm, k) });
function light(o, at) {
  sun.color.set(o.col); sun.intensity = o.int; sun.position.set(at.x + o.pos[0], at.y + o.pos[1], at.z + o.pos[2]); sun.target.position.copy(at);
  const c = sun.shadow.camera, r = o.r ?? 10; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 1; c.far = 200; c.updateProjectionMatrix();
  hemi.color.set(o.hs); hemi.groundColor.set(o.hg); hemi.intensity = o.hemi;
  scene.fog = new THREE.Fog(o.fog[0], o.fog[1], o.fog[2]); sky.visible = true;
  const u = sky.material.uniforms; u.top.value.set(o.sky[0]); u.hor.value.set(o.sky[1]); u.sd.value.set(...o.sky[2]).normalize(); u.sc.value.set(o.sky[3]);
  scene.environmentIntensity = o.env ?? .35; vg.warm.value = o.warm ?? .1;
}



// ---------------- the sets ----------------
const CITY = city(); scene.add(CITY);
const STAD = stadium(); scene.add(STAD); const SO = V(0, 0, 400); STAD.position.copy(SO);   // the stadium, far from the street
const SW = .12;
const P3 = (x, z) => V(x, SW, z), SP = (x, z, y = 0) => SO.clone().add(V(x, y, z));
const STADIUM = { pos: [-25, 45, 30], col: '#FFF4E0', int: 3.0, hs: '#CFE4FF', hg: '#8A9A70', hemi: 1.1, fog: ['#C8DCEC', 90, 520], sky: ['#2A78E0', '#E4EEF2', [-.4, .5, .6], '#FFF6D8'], env: .4, r: 16, warm: .1 };
const NIGHT = { pos: [-14, 26, 20], col: '#7A90D8', int: .45, hs: '#3A4A80', hg: '#18161E', hemi: .32, fog: ['#121A30', 18, 120], sky: ['#050A1E', '#1E2850', [-.5, .35, .6], '#FFF2C8'], env: .06, r: 12, warm: 0, lamps: 1 };
const GOLDEN = { pos: [-30, 14, 22], col: '#FFCB96', int: 2.5, hs: '#FFE8D2', hg: '#8A7460', hemi: 1.15, fog: ['#F2C9A2', 50, 360], sky: ['#4E70C4', '#FFC48A', [-.65, .14, .5], '#FFE4A8'], env: .3, r: 12, warm: .2 };
// warm street-lamp light for the night scene (the bench sits between two lamps)
const LAMPS = [V(-.5, 4.3, -2.65), V(12, 4.3, -2.65), V(4.4, 3.4, -3.6)].map(p => { const l = new THREE.PointLight('#FFC27A', 0, 0, 1.7); l.position.copy(p); scene.add(l); return l; });
function lightAll(o, at) { light(o, at); const n = o.lamps ? 1 : 0; LAMPS.forEach((l, i) => l.intensity = n * [7, 7, 3.5][i]); vg.amt.value = n ? .4 : .22; CITY.userData.bulbs.forEach(b => b.material.emissiveIntensity = n ? 4 : .5); }

// ---------------- cast (each with a card) ----------------
const mk = (o, card = 'mini', v = {}) => { const p = makeToon({ shoe: '#2A2A30', ...o }); scene.add(p.P); p.kind = card; p.H = o.H ?? 1; p.card = card === 'full' ? fullCard() : miniCard(); scene.add(p.card); p.v = v; return p; };
const THEO = mk({ name: 'theo', outfit: 'hoodie', top: '#7A9A86', pants: '#3C4A6A', hair: 'messy', hairC: '#3A2A20', shoe: '#E8E2D6' }, 'full', { ovr: 52, str: 41, ath: 47, hp: 72, iq: 104, eq: 93, mh: 61, pot: 99 });
const MIA = mk({ name: 'mia', outfit: 'tee', top: '#F2B33A', pants: '#2A3A5A', hair: 'bob', hairC: '#7A3A22', blush: 1, shoe: '#C8283A', seed: 4 }, 'full', { ovr: 88, str: 62, ath: 85, hp: 90, iq: 131, eq: 96, mh: 88, pot: 95 });
const KAI = mk({ name: 'kai', outfit: 'tee', top: '#1C1C22', pants: '#2A2A30', logo: 'K', logoCol: '#FFC83A', hair: 'slick', hairC: '#E8C870', glasses: 'shades', H: 1.1, shoe: '#F4F1EA', seed: 6 }, 'full', { ovr: 94, str: 97, ath: 98, hp: 95, iq: 118, eq: 19, mh: 12, pot: 94 });
const EXA = mk({ name: 'exa', outfit: 'tee', top: '#4A8AD8', pants: '#E8E2D6', hair: 'bob', hairC: '#2A1A14', seed: 8 }, 'full', { ovr: 67, str: 58, ath: 63, hp: 81, iq: 112, eq: 74, mh: 70, pot: 72 });
const JOG = mk({ name: 'jogger', outfit: 'tee', top: '#3EC8B0', pants: '#2A2A30', hair: 'beanie', hatC: '#E8423A', pomC: '#E8423A', seed: 9 }, 'full', { ovr: 74, str: 66, ath: 71, hp: 88, iq: 97, eq: 70, mh: 78, pot: 80 });
const TIRED = mk({ name: 'tired', outfit: 'suit', top: '#6A6E78', pants: '#4A4E58', tie: '#2E5AA8', hair: 'messy', hairC: '#5A4030', seed: 10 }, 'full', { ovr: 61, str: 50, ath: 44, hp: 64, iq: 118, eq: 60, mh: 49, pot: 66 });
const MEAN = mk({ name: 'mean', outfit: 'polo', top: '#C84A4A', pants: '#2A2A30', hair: 'slick', hairC: '#2A1A10', seed: 17 }, 'full', { ovr: 70, str: 72, ath: 66, hp: 80, iq: 101, eq: 66, mh: 69, pot: 70 });
const CP = [mk({ name: 'cp0', outfit: 'tee', top: '#E86A7A', hair: 'slick', hairC: '#2A2018', seed: 11 }, 'mini', { ovr: 71 }), mk({ name: 'cp1', outfit: 'polo', top: '#6AB8E8', hair: 'bob', hairC: '#C88A3A', seed: 12 }, 'mini', { ovr: 74 })];
const LOW = mk({ name: 'low', outfit: 'hoodie', top: '#8A6A9A', hair: 'messy', hairC: '#1E1612', seed: 13 }, 'mini', { ovr: 45 });
const HIGH = mk({ name: 'high', outfit: 'tee', top: '#F4F1EA', pants: '#1E2238', hair: 'bob', hairC: '#1A1210', seed: 14 }, 'mini', { ovr: 80 });
const LAU = [mk({ name: 'lau0', outfit: 'hoodie', top: '#E8A030', hair: 'beanie', hatC: '#2E7FE0', seed: 15 }, 'mini', { ovr: 76 }), mk({ name: 'lau1', outfit: 'tee', top: '#9ACB55', hair: 'messy', hairC: '#8A4A20', seed: 16 }, 'mini', { ovr: 73 })];
const CROWD = Array.from({ length: 12 }, (_, i) => mk({ name: 'crowd' + i, outfit: ['hoodie', 'tee', 'suit', 'polo'][i % 4], top: ['#D86A4A', '#4AA8D8', '#5A5E68', '#E8C84A', '#9A6AC8', '#4AC88A', '#C84A6A', '#8AA8C8', '#E89A4A', '#6A8A4A', '#B8B4AC', '#3A6AC8'][i],
  pants: ['#2A3A5A', '#3A3A40', '#5A4A3A'][i % 3], hair: ['messy', 'bob', 'slick', 'beanie', 'bob', 'messy', 'slick', 'bob', 'beanie', 'slick', 'bob', 'messy'][i], hairC: ['#2A2018', '#6A3A1A', '#1A1A1E', '#C88A3A'][i % 4], hatC: ['#2E9A4A', '#C8283A', '#2E7FE0'][i % 3], tie: '#C8283A', seed: 20 + i }, 'mini',
  { ovr: [58, 83, 71, 39, 66, 91, 47, 77, 62, 85, 54, 69][i] }));
const HOST = mk({ name: 'host', outfit: 'suit', top: '#7A2E8E', pants: '#2A1E38', tie: '#FFD23F', pocketSq: '#FFD23F', hair: 'slick', hairC: '#1A1210', seed: 30 }, 'mini', { ovr: 81 });
const SHAKE = mk({ name: 'shake', outfit: 'polo', top: '#6AB8E8', pants: '#3A3A40', hair: 'messy', hairC: '#8A4A20', seed: 31 }, 'mini', { ovr: 72 });
const CLERK = mk({ name: 'clerk', outfit: 'suit', top: '#2E5AA8', pants: '#2A2E3A', tie: '#C8283A', hair: 'bob', hairC: '#2A1A14', glasses: 'round', seed: 32 }, 'mini', { ovr: 77 });
const RUN = [0, 1, 2, 3].map(i => mk({ name: 'run' + i, outfit: 'tee', top: ['#E8423A', '#3EB2E8', '#F2B33A', '#9A6AC8'][i], pants: '#2A2A30', hair: ['beanie', 'messy', 'slick', 'bob'][i], hairC: ['#2A2018', '#6A3A1A', '#1A1A1E', '#C88A3A'][i], hatC: '#2E9A4A', seed: 40 + i }, 'mini', { ovr: [88, 83, 79, 86][i] }));
const FAN = [0, 1, 2].map(i => mk({ name: 'fan' + i, outfit: ['hoodie', 'tee', 'polo'][i], top: ['#E89A4A', '#4AC88A', '#C84A6A'][i], hair: ['beanie', 'bob', 'messy'][i], hatC: '#2E7FE0', hairC: ['#2A2018', '#6A3A1A', '#1A1A1E'][i], seed: 50 + i }, 'mini', { ovr: [71, 84, 66][i] }));
const JUD = [0, 1, 2].map(i => mk({ name: 'judge' + i, outfit: 'suit', top: ['#2A2C34', '#3A2A4A', '#2A3A4A'][i], pants: '#1E1E24', tie: ['#C8283A', '#FFD23F', '#2E7FE0'][i], hair: ['bob', 'slick', 'none'][i], hairC: ['#C8C4BC', '#1A1210', '#3A2A20'][i], glasses: i === 1 ? 'round' : undefined, seed: 60 + i }, 'mini', { ovr: [90, 86, 92][i] }));
// fifty years on: same hoodie, same yellow tee
const OLDT = mk({ name: 'theo_old', outfit: 'hoodie', top: '#7A9A86', pants: '#3C4A6A', hair: 'messy', hairC: '#F6F6F6', glasses: 'round', shoe: '#E8E2D6' }, 'full', { ovr: 81, str: 30, ath: 28, hp: 66, iq: 112, eq: 99, mh: 100, pot: 99 });
const OLDM = mk({ name: 'mia_old', outfit: 'tee', top: '#F2B33A', pants: '#2A3A5A', hair: 'bob', hairC: '#FAFAFA', blush: 1, shoe: '#C8283A', seed: 4 }, 'full', { ovr: 86, str: 38, ath: 41, hp: 72, iq: 129, eq: 99, mh: 100, pot: 95 });
[OLDT, OLDM].forEach(p => p.head.traverse(o => { const m = o.material; if (m && m.color && ['f6f6f6', 'fafafa'].includes(m.color.getHexString()) && m.emissive) m.emissive.set('#7A7A7A'); }));
const CAST = [THEO, MIA, KAI, EXA, JOG, TIRED, MEAN, ...CP, LOW, HIGH, ...LAU, ...CROWD, HOST, SHAKE, CLERK, ...RUN, ...FAN, ...JUD, OLDT, OLDM];

// ---------------- props ----------------
const CUP = coffee(), CUP2 = coffee(); scene.add(CUP, CUP2);
const BAG = G(); TM(new THREE.BoxGeometry(.3, .32, .12), '#16131A', BAG, 0, -.18, 0, .004); TM(new THREE.TorusGeometry(.08, .012, 6, 14, Math.PI), '#FFD24A', BAG, 0, 0, 0, .003); scene.add(BAG);
const PEN = G(); TM(new THREE.CylinderGeometry(.007, .007, .14, 8), '#1A1A1E', PEN, 0, 0, 0, .002); scene.add(PEN);
const MIC = G(); TM(new THREE.CylinderGeometry(.015, .012, .16, 8), '#2A2A30', MIC, 0, 0, 0, .002); TM(new THREE.SphereGeometry(.028, 10, 8), '#5A5E68', MIC, 0, .09, 0, .002); scene.add(MIC);
const TAPE = new THREE.Mesh(new THREE.BoxGeometry(.02, .02, 7.2), new THREE.MeshStandardMaterial({ color: '#F4F1EA' })); scene.add(TAPE);
const ENV = G(); TM(new THREE.BoxGeometry(.34, .24, .012), '#FFD23F', ENV, 0, 0, 0, .004); TM(new THREE.BoxGeometry(.26, .02, .014), '#C8283A', ENV, 0, .03, 0, .002); scene.add(ENV);   // the judges' envelope
const CANE = G(); TM(new THREE.CylinderGeometry(.018, .018, .86, 8), '#5A3A22', CANE, 0, .43, 0, .003); TM(new THREE.TorusGeometry(.06, .018, 6, 12, Math.PI), '#5A3A22', CANE, -.06, .86, 0, .003); scene.add(CANE);
const HEART = heart(); scene.add(HEART);
// a speech-bubble badge over someone's head: ✓ / ✗ + text
const LINK = [0, 1, 2].map(() => { const c = document.createElement('canvas'); c.width = 640; c.height = 160; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.75, .19), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, fog: false, toneMapped: false })); m.renderOrder = 11; m.frustumCulled = false; scene.add(m);
  let key = ''; m.userData.draw = (txt, ok, k) => { const kk = txt + ok + Math.round(k * 20); if (kk === key) return; key = kk; const g = c.getContext('2d'); g.clearRect(0, 0, 640, 160); g.save(); g.globalAlpha = clamp(k * 2); g.translate(320, 80); g.scale(back(k, 2.4), back(k, 2.4)); g.translate(-320, -80);
    g.font = '900 72px Montserrat'; const tw = Math.min(600, g.measureText((ok ? '✓ ' : '✗ ') + txt).width + 80);
    g.fillStyle = ok ? '#2E9A4A' : '#C8283A'; g.beginPath(); g.roundRect(320 - tw / 2, 20, tw, 120, 60); g.fill(); g.lineWidth = 8; g.strokeStyle = '#FFFFFF'; g.stroke();
    g.fillStyle = '#FFFFFF'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText((ok ? '✓ ' : '✗ ') + txt, 320, 84); g.restore(); t.needsUpdate = true; }; return m; });
const PROPS = [CUP, CUP2, BAG, PEN, MIC, TAPE, ENV, CANE];

// ---------------- key times (all from the voice) ----------------
const C = Object.fromEntries(TMJ.lines.map(l => [l.id, cut(l.id)]));
const CHS = TMJ.chapters, END = DUR;
// cold open
const tPeople1 = w('L1', 'people'), tHighest1 = w('L1', 'highest'), tFall1 = w('L1', 'fall');
const tSee2 = w('L2', 'see'), tOne2 = w('L2', 'one'), tHide2 = w('L2', 'hide');
// 1 · the rules
const tRatings4 = w('L4', 'ratings'), tHeads4 = w('L4', 'heads');
const T5 = ['strength', 'athleticism', 'health', 'iq', 'eq', 'mental'].map(x => w('L5', x));
const tLive6 = w('L6', 'live'), tRun6 = w('L6', 'go'), tUp6 = w('L6', 'up'), tSkip6 = w('L6', 'skip'), tDown6 = w('L6', 'down');
const tCruel7 = w('L7', 'cruel'), tEveryone7 = w('L7', 'everyone'), tDrop7 = w('L7', 'drop');
const tCafe8 = w('L8', 'café'), tHiring8 = w('L8', 'hiring'), t70_8 = w('L8', '70');
const tGym9 = w('L9', 'gym'), tStr9 = w('L9', 'strength'), tBank9 = w('L9', 'bank'), t80_9 = w('L9', '80', 1);
const tRule10 = w('L10', 'rule'), tNever10 = w('L10', 'never'), tTen10 = w('L10', 'ten'), tAway10 = w('L10', 'away');
// 2 · the zero
const tTheo11 = w('L11', 'theo'), T11 = [['ovr', w('L11', 'overall')], ['str', w('L11', 'strength')], ['ath', w('L11', 'athleticism')], ['iq', w('L11', 'iq')], ['eq', w('L11', 'eq')]];
const tPainfully12 = w('L12', 'painfully');
const tBottom13 = w('L13', 'bottom'), tGrey13 = w('L13', 'grey'), t99_13 = w('L13', '99');
const tNobody14 = w('L14', 'nobody'), tNot14 = w('L14', 'not');
const tLove15 = w('L15', 'love'), tMia15 = w('L15', 'mia'), T15 = [['ovr', w('L15', 'overall')], ['iq', w('L15', 'iq')], ['eq', w('L15', 'eq')]];
const t36_16 = w('L16', '36'), tCity16 = w('L16', 'in'), tCrush16 = w('L16', 'crush'), tJoke16 = w('L16', 'joke');
const tSinking17 = w('L17', 'sinking'), t61_17 = w('L17', '61'), t52_17 = w('L17', '52'), t44_17 = w('L17', '44');
const tThousands18 = w('L18', 'thousands'), tThey18 = w('L18', 'they'), tNobody18 = w('L18', 'nobody');
const tStopped19 = w('L19', 'stopped'), tSat19 = w('L19', 'sat'), tOkay19 = w('L19', 'okay'), tStayed19 = w('L19', 'stayed');
const L20L = [w('L20', 'laughed'), w('L20', 'terrible'), w('L20', 'up'), w('L20', 'one', 1)];
const tLook21 = w('L21', 'look'), tAppears21 = w('L21', 'appears'), tCompat21 = w('L21', 'compatibility');
const tZero22 = w('L22', 'zero'), tPercent22 = w('L22', 'percent'), tStanding22 = w('L22', 'standing'), t97_22 = w('L22', '97');
const tKai23 = w('L23', 'kai'), tStr23 = w('L23', 'strength'), tAth23 = w('L23', 'athleticism'), tTwo23 = w('L23', 'two');
const tShake24 = w('L24', 'shake'), t80_24 = w('L24', '80'), tEQ24 = w('L24', 'eq'), tLine24 = w('L24', 'line'), tBlank24 = w('L24', 'blank');
const tRich25 = w('L25', 'rich'), tHide25 = w('L25', 'hide'), tPays25 = w('L25', 'pays'), t9999 = w('L25', '9');
// 3 · the ranking
const tRanking26 = w('L26', 'ranking'), tThree26 = w('L26', 'three'), tLive26 = w('L26', 'live');
const tGold27 = w('L27', 'gold'), tOutranks27 = w('L27', 'outranks');
const tSigns28 = w('L28', 'signs'), tClerk28 = w('L28', 'clerk'), t52_28 = w('L28', '52'), tWhole28 = w('L28', 'whole'), tLaughs28 = w('L28', 'laughs');
const tRace29 = w('L29', 'race'), tKai29 = w('L29', 'kai'), tSweat29 = w('L29', 'sweat'), tTheo29 = w('L29', 'theo'), tLast29 = w('L29', 'last'), tLot29 = w('L29', 'by');
const tPuzzle30 = w('L30', 'puzzle'), tStrange30 = w('L30', 'strange'), tClimbing30 = w('L30', 'climbing'), tGiant30 = w('L30', 'giant'), t104 = w('L30', '104'), t105 = w('L30', '105'), t106 = w('L30', '106');
const tSecond31 = w('L31', 'second'), tFor31 = w('L31', 'for'), tNobody31 = w('L31', 'nobodys');
const tFinal32 = w('L32', 'final'), tPartners32 = w('L32', 'partners'), tEvery32 = w('L32', 'every'), tSwitched32 = w('L32', 'switched');
const tSpins33 = w('L33', 'spins'), tPartner33 = w('L33', 'partner'), tKai33 = w('L33', 'kai');
const tFilters34 = w('L34', 'filters'), tDrop34 = w('L34', 'drop'), tEvery34 = w('L34', 'every'), tBlank34 = w('L34', 'blank'), tLights34 = w('L34', 'lights');
const t12_35 = w('L35', '12'), tIts35 = w('L35', 'its'), tYears35 = w('L35', 'years'), tThats35 = w('L35', 'thats'), tHide35 = w('L35', 'hide');
// 4 · the wall
const tWall36 = w('L36', 'wall'), tHalfway36 = w('L36', 'halfway'), tLooks36 = w('L36', 'looks'), t50k36 = w('L36', '50');
const t9 = w('L37', '9'), t6 = w('L37', '6'), t4 = w('L37', '4'), tFreezes = w('L37', 'freezes'), tCantUp = w('L37', 'cant'), tCantDown = w('L37', 'cant', 1);
const tRight38 = w('L38', 'right'), tWin38 = w('L38', 'win'), tInstead38 = w('L38', 'instead'), tBack38 = w('L38', 'back');
const tPull39 = w('L39', 'pull'), tPush39 = w('L39', 'push'), tJust39 = w('L39', 'just'), tTalks39 = w('L39', 'talks');
const tDont40 = w('L40', 'dont'), tLook40 = w('L40', 'look', 1), tHold40 = w('L40', 'hold'), tIm40 = w('L40', 'im');
const tStadium41 = w('L41', 'stadium'), t10 = w('L41', '10'), t25 = w('L41', '25'), t40 = w('L41', '40');
const tHold42 = w('L42', 'hold'), tTogether42 = w('L42', 'together'), tThey42 = w('L42', 'they', 1), tCross42 = w('L42', 'cross'), tLast42 = w('L42', 'last');
const tJudges43 = w('L43', 'judges'), tReveal43 = w('L43', 'reveal'), tNot43 = w('L43', 'not'), tBy43 = w('L43', 'by', 1), tChanged43 = w('L43', 'changed');
const t40_44 = w('L44', '40'), tAfternoon44 = w('L44', 'afternoon'), tTheos44 = w('L44', 'theos'), tEvery44 = w('L44', 'every'), tUp44 = w('L44', 'up');
const tGold45 = w('L45', 'gold'), tAnd45 = w('L45', 'and'), tSmall45 = w('L45', 'small'), t99_45 = w('L45', '99');
// 5 · the point
const tNight46 = w('L46', 'night'), t97_46 = w('L46', '97'), tStands46 = w('L46', 'stands'), tZero46 = w('L46', 'zero');
const tCompat47 = w('L47', 'compatibility'), tThey47 = w('L47', 'they'), tNothing47 = w('L47', 'nothing'), tPoint47 = w('L47', 'point');
const tKai48 = w('L48', 'kai'), tCancelled48 = w('L48', 'cancelled'), tMental48 = w('L48', 'mental'), tEveryone48 = w('L48', 'everyone'), t71 = w('L48', '71');
const tHolding49 = w('L49', 'holding');
const tZero50 = w('L50', 'zero'), tMental50 = w('L50', 'mental'), t100 = w('L50', '100');
const tLaughs51 = w('L51', 'laughs'), tUp51 = w('L51', 'up');
const tIf52 = w('L52', 'if'), tWhich52 = w('L52', 'which'), tTell52 = w('L52', 'tell');

// ---------------- helpers ----------------
const put = (p, v, ry = 0) => { p.P.visible = true; p.P.position.copy(v); p.P.rotation.set(0, ry, 0); p.P.updateMatrixWorld(true); };
const show = (...ps) => PROPS.forEach(o => o.visible = ps.includes(o));
const CAMP = new THREE.Vector3(0, 1.4, 6);
const headOf = p => { p.P.updateMatrixWorld(true); return p.head.getWorldPosition(V(0, 0, 0)); };
const cardOf = (p, s = 1) => headOf(p).add(V(0, .21 * p.H + .07 + .93 * s / 2, 0));
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
function onHand(p, o, left = 0, pos = [0, 0, 0], rot = [0, 0, 0]) { o.visible = true; (left ? p.aL : p.aR).props.add(o); o.position.set(...pos); o.rotation.set(...rot); }
function card(p, o = {}) { p.cs = { v: { ...p.v }, ...o }; }
let GLITCH = 0;
function reset() {
  CAST.forEach(p => { p.P.visible = false; p.cs = null; p.card.visible = false; });
  show(); for (const o of PROPS) { scene.add(o); o.rotation.set(0, 0, 0); o.scale.setScalar(1); }
  HEART.visible = false; HEART.userData.cs = null; LINK.forEach(l => { l.visible = false; l.userData.cs = null; }); GLITCH = 0;
  KAI.face.glasses = 'shades'; STAD.userData.tally.scale.setScalar(1);
}
function stepper(t, base, steps) { let v = base; const pop = []; for (const [t0, nv] of steps) { if (t >= t0) { const d = nv - v; v = nv; if (t - t0 < 1) pop.push({ d, a: (t - t0) / .9 }); } } return { v, pop }; }
const camAt = (pos, look, fov = 45, focus, aper = 4, roll = 0) => ({ pos, look, fov, focus: focus ?? pos.distanceTo(look), aper, roll });
const hand = (c, t, a = 1) => { c.pos.x += noise(t, 1) * .012 * a; c.pos.y += noise(t, 2) * .01 * a; c.look.x += noise(t, 3) * .02 * a; c.look.y += noise(t, 4) * .016 * a; return c; };
const shake = (c, t, a) => { if (a > 0) { c.pos.x += Math.sin(t * 61) * .012 * a; c.pos.y += Math.sin(t * 53 + 1) * .01 * a; } return c; };
const linkAt = (i, a, b, txt, ok, k) => { if (k <= 0) return; const L = LINK[i]; L.visible = true; L.userData.cs = { txt, ok, k, at: headOf(a).lerp(headOf(b), .5).add(V(0, .62, 0)) }; };
const badge = (i, p, txt, ok, k, up = 1.05) => { if (k <= 0) return; const L = LINK[i]; L.visible = true; L.userData.cs = { txt, ok, k, at: headOf(p).add(V(0, up, 0)) }; };
// the walking crowd: lanes along the sidewalk, each person looping at their own pace
function crowd(t, n = 12, speed = 1, x0 = 0, glance = null, pillS = 1.3) {
  CROWD.slice(0, n).forEach((p, i) => { const dir = i % 2 ? 1 : -1, lane = [-6.7, -5.9, -4.6][i % 3], sp = (1.1 + hash(i) * .5) * speed, span = 34;
    const x = x0 - span / 2 + (((hash(i + 3) * span + dir * t * sp) % span) + span) % span; put(p, P3(x, lane), dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    const lk = glance && Math.abs(x - glance.x) < 2.2 ? glance.clone().add(V(0, 1.2, 0)) : CAMP;
    apply(p, walk(TP.stand, t * 7 * sp + i, .9), { t, seed: 20 + i, face: ['happy', 'calm', 'smile', 'deadpan'][i % 4], look: lk }); card(p, { s: pillS }); });
}
const clearAround = (v, rx = 1.2, rz = 1.4, n = 12) => CROWD.slice(0, n).forEach(p => { if (Math.abs(p.P.position.x - v.x) < rx && Math.abs(p.P.position.z - v.z) < rz) p.P.position.y = -9; });

// Kai, live: mental health 12 → 9 → 6 → 4 on the wall, then 10 → 25 → 40 as Theo talks to him; EQ 19 → 59
const MH = t => stepper(t, 12, [[t9, 9], [t6, 6], [t4, 4], [t10, 10], [t25, 25], [t40, 40]]);
const KEQ = t => stepper(t, 19, [[t40_44, 59]]);
const kaiV = t => ({ ...KAI.v, mh: MH(t).v, eq: KEQ(t).v });
const kaiCard = (o = {}) => card(KAI, { hide: ['mh'], gold: 1, ...o });
// Theo after the final: every stat up, one after another; then gold
const TUP = [['str', 46], ['ath', 55], ['hp', 78], ['iq', 109], ['eq', 98], ['mh', 86]];
function theoV(t) {
  const v = { ...THEO.v, iq: 106 }, pop = [];
  TUP.forEach(([k, nv], i) => { const t0 = tEvery44 + i * Math.max(.12, (tUp44 - tEvery44) / 5); if (t >= t0) { const d = nv - v[k]; v[k] = nv; if (t - t0 < 1) pop.push({ k, d, a: (t - t0) / .9 }); } });
  if (t >= tUp44) v.ovr = 71;
  return { v, pop, gold: t >= tGold45 ? 1 : 0 };
}

// ---------------- places ----------------
const EXP = P3(-2, -5.1), TIP = P3(9.2, -5.4);
const JX = t => P3(lerp(-9, 3, seg(t, tRun6 - .4, tSkip6 + .2)), -5.7);
const MEANP = P3(-20.4, -5.5), MLOW = P3(-19.2, -5.2);
const CAFEF = P3(-31.0, -7.4), GYMF = P3(-12.4, -7.4), BANKF = P3(24.0, -7.4);
const CAFE = ST.cafe;
const THX = P3(ST.cross - 1.3, -3.6), MIAX = t => P3(lerp(13.2, 11.0, seg(t, C.L15 - .3, C.L16 + 1)), 5.0);
const BEN = V(ST.bench, SW, -6.4), THB = BEN.clone().add(V(.36, 0, 0)), MIB = BEN.clone().add(V(-.36, 0, 0));
const KAIX = BEN.clone().add(V(-1.55, 0, .75)), MIAS = BEN.clone().add(V(-.75, 0, .62));
const KW = t => P3(lerp(-6, -2.2, seg(t, C.L23 - .2, C.L25 - .2)), -5.3);              // Kai's slow-motion strut down the sidewalk
const PRV = P3(ST.privacy + .9, -6.4);                                                  // the privacy boutique's door
const KN = P3(3.0, -5.05), TN = P3(5.75, -5.65), MN = P3(5.0, -5.5);                    // that night, on the sidewalk by the bench
const MW = t => P3(lerp(-1.2, MN.x, seg(t, C.L46 + .1, tStands46 + .15)), lerp(-5.45, MN.z, seg(t, C.L46 + .1, tStands46 + .15)));
const KWALK = t => P3(lerp(14.6, 6.5, seg(t, tMental48 - .6, C.L49)), -5.3);              // Kai, card on show, down the sidewalk
const TVC = () => STAD.userData.tvcam.getWorldPosition(V());
const STG = SP(SD.stage[0], SD.stage[1], 1.2), DESK = SP(SD.desk[0], SD.desk[1]), JT = () => STAD.userData.judges.getWorldPosition(V());
const SCR = SP(-44, 0, 12);
const RX = t => lerp(-26, 6, seg(t, C.L29 - .4, tTheo29 + .4));                         // the leaders down the home straight
const THX29 = t => t < tTheo29 - .1 ? -40 : t < tLot29 - .1 ? lerp(-21.5, -20.4, seg(t, tTheo29 - .1, tLot29 - .1)) : lerp(-20.4, -19.6, seg(t, tLot29 - .1, C.L30));   // Theo, way back

// the wall: climbers face it (ry = π); WP(x, y) = feet at height y, x along the wall
const WALLX = SD.wall[0], WALLZ = SD.wall[1];
const WP = (x, y) => SP(WALLX + x, WALLZ + .3 + .34, y);
const KX = -.6, TX = .6, RXS = [-2.6, -1.9, 1.9, 2.6];
// heights (feet) over time: Kai stalls halfway; Theo climbs past, comes back down, and they go up together
const KY = t => t < C.L37 ? lerp(.5, 3.9, eio(seg(t, C.L36 + .3, tLooks36))) : t < C.L42 ? lerp(3.9, 4.3, eio(seg(t, t10 - .2, t40 + .3))) : lerp(4.3, 7.9, eio(seg(t, C.L42 + .1, tCross42 - .2)));
const TY = t => t < C.L38 ? lerp(.4, 2.6, eio(seg(t, C.L36 + .5, tLooks36 + .5))) : t < tInstead38 - .05 ? lerp(2.6, 4.9, eio(seg(t, C.L38, tWin38 + .1)))
  : t < C.L42 ? lerp(4.9, 3.95, eio(seg(t, tInstead38 + .2, tBack38 + .4))) + (KY(t) - 3.9) : lerp(4.35, 7.95, eio(seg(t, C.L42 + .1, tCross42 - .2)));
const RY = (i, t) => lerp(.4 + i * .3, 8.5, eio(seg(t, C.L36 + .2 + i * .25, tLooks36 + .8 + i * .45)));   // the other pairs: straight up and over
const HOOK = { ky: 3.9, ty: 2.6, mh: 4 };   // the cold open: the moment he freezes

// ---------------- shots (camera + who's where), all from the voice ----------------
const S = [];
const sh = o => S.push(o);
// ===== cold open =====
// 50,000 people are watching: over the stands to the giant screen
sh({ t0: 0, set: 'stadium', lt: STADIUM, at: SO, act: t => actHook(t), fpv: .2,
  cam: (t, u) => { const k = eio(u); return camAt(SP(lerp(30, 20, k), lerp(-14, -7, k), lerp(24, 13, k)), SP(lerp(-20, -38, k), 0, lerp(10, 12, k)), 46, 40, .5, lerp(.04, 0, k)); } });
// the highest-rated guy in the city: the wall, Kai frozen halfway up
sh({ t0: tHighest1 - .1, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => actHook(t),
  cam: (t, u) => hand(camAt(SP(WALLX + lerp(1.6, 1.2, u), WALLZ + lerp(6.4, 5.6, u), lerp(3.2, 3.6, u)), SP(WALLX - .1, WALLZ + .3, lerp(5.0, 5.2, u)), 40, 6, 2), t) });
// fall apart: his face, shaking
sh({ t0: tFall1 - .1, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => actHook(t, 1), after: 1,
  cam: (t, u) => { const h = headOf(KAI); return shake(hand(camAt(h.clone().add(V(lerp(-1.35, -1.2, u), .1, lerp(.05, .02, u))), h.clone().add(V(-.04, .12, 0)), 40, 1.4, 5), t, .6), t, 1); } });
// And for the first time in his life,: over his shoulder, down at the stands
sh({ t0: C.L2, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => actHook(t), after: 1,
  cam: (t, u) => { const h = headOf(KAI); return hand(camAt(h.clone().add(V(lerp(.75, .6, u), lerp(.75, .85, u), lerp(.85, 1.0, u))), SP(lerp(10, 8, u), 15, lerp(1.5, 1.0, u)), 50, 14, 2), t, .8); } });
// they can see the one number he's been paying to hide.: into his card
sh({ t0: tSee2 - .1, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => actHook(t, 2), after: 1,
  cam: (t, u) => { const c0 = cardOf(KAI, .9), k = eio(seg(t, tSee2, tHide2)); return hand(camAt(c0.clone().add(V(lerp(.7, .12, k), lerp(-.3, -.22, k), lerp(3.0, 1.45, k))), c0.clone().add(V(0, lerp(-.1, -.27, k), 0)), lerp(40, 30, k), lerp(3.0, 1.45, k), 6), t, .5); } });
// Let me back up.: the tape rewinds
sh({ t0: C.L3, rewind: 1 });
// ===== 1 · the rules =====
// everyone has ratings floating above their heads: rise out of a busy sidewalk into a sea of ratings
sh({ t0: C.L4, set: 'city', lt: SUNNY, at: V(0, 0, -5), act: t => actCrowd(t),
  cam: (t, u) => { const k = eio(seg(t, C.L4 + .1, C.L5)); return hand(camAt(V(lerp(-7, -6, k), lerp(1.05, 3.4, k), lerp(-5.4, -4.6, k)), V(lerp(3, 4, k), lerp(1.75, 1.3, k), lerp(-5.4, -5.8, k)), lerp(48, 46, k), 8, 1.5), t); } });
// Strength. Athleticism. …: one stranger's card fills in, row by row
sh({ t0: C.L5, set: 'city', lt: SUNNY, at: EXP, act: t => actExa(t),
  cam: (t, u) => hand(camAt(EXP.clone().add(V(lerp(.45, .3, u), lerp(1.66, 1.74, u), lerp(3.2, 2.8, eo(u)))), EXP.clone().add(V(.25, 1.72, 0)), 40, 2.9, 5), t) });
// They update live.
sh({ t0: C.L6, set: 'city', lt: SUNNY, at: EXP, act: t => actExa(t),
  cam: (t, u) => hand(camAt(EXP.clone().add(V(lerp(.3, .25, u), lerp(1.74, 1.78, u), lerp(2.8, 2.6, u))), EXP.clone().add(V(.25, 1.76, 0)), 40, 2.7, 5), t) });
// Go for a run, your athleticism goes up.: a jogger runs at us, +1
sh({ t0: tRun6 - .1, set: 'city', lt: SUNNY, at: V(0, 0, -4.6), act: t => actJog(t), after: 1,
  cam: (t, u) => { const p = JX(t); return hand(camAt(p.clone().add(V(3.6, 1.6, .9)), p.clone().add(V(0, 1.55, 0)), 42, 3.7, 5), t, 1.3); } });
// Skip a night of sleep, your health goes down.: a yawning office worker, −1
sh({ t0: tSkip6 - .1, set: 'city', lt: SUNNY, at: TIP, act: t => actTired(t),
  cam: (t, u) => hand(camAt(TIP.clone().add(V(lerp(.5, .35, u), lerp(1.7, 1.74, u), lerp(2.9, 2.6, eo(u)))), TIP.clone().add(V(0, 1.72, 0)), 40, 2.7, 5), t) });
// Say something cruel,: one guy laughs at another
sh({ t0: C.L7, set: 'city', lt: SUNNY, at: MEANP, act: t => actMean(t),
  cam: (t, u) => hand(camAt(MEANP.clone().lerp(MLOW, .5).add(V(lerp(.4, .2, u), 1.55, lerp(3.6, 3.2, eo(u)))), MEANP.clone().lerp(MLOW, .5).add(V(0, 1.45, 0)), 42, 3.4, 4), t) });
// and everyone watches your EQ drop.: his card, the street turning to look
sh({ t0: tEveryone7 - .1, set: 'city', lt: SUNNY, at: MEANP, act: t => actMean(t), after: 1,
  cam: (t, u) => { const c0 = cardOf(MEAN); return hand(camAt(c0.clone().add(V(lerp(-.9, -.7, u), lerp(-.35, -.3, u), lerp(2.6, 2.2, eo(u)))), c0.clone().add(V(-.35, -.25, 0)), 40, 2.4, 5), t, .6); } });
// And everything runs on them.: high over the street, every head a number
sh({ t0: C.L8, set: 'city', lt: SUNNY, at: P3(-14, -5), act: t => actStreet(t),
  cam: (t, u) => hand(camAt(P3(lerp(-16.5, -13.5, u), -.6).add(V(0, lerp(4.4, 3.8, u), 0)), P3(lerp(-15, -12, u), -5.6).add(V(0, .9, 0)), 48, 6.5, 1.5), t, .6) });
// The café is hiring: EQ 70 and up.: the café; an EQ 60 is turned away
sh({ t0: tCafe8 - .1, set: 'city', lt: SUNNY, at: CAFEF, act: t => actCafe(t),
  cam: (t, u) => hand(camAt(CAFEF.clone().add(V(lerp(1.6, 1.3, u), lerp(1.75, 1.7, u), lerp(5.0, 4.4, eo(u)))), CAFEF.clone().add(V(.9, 1.55, 0)), 40, 4.6, 3), t) });
// The gym is members only: strength 80 plus.
sh({ t0: C.L9, set: 'city', lt: SUNNY, at: GYMF, act: t => actGym(t),
  cam: (t, u) => hand(camAt(GYMF.clone().add(V(lerp(1.8, 1.5, u), lerp(1.75, 1.7, u), lerp(5.0, 4.4, eo(u)))), GYMF.clone().add(V(.9, 1.55, 0)), 40, 4.6, 3), t) });
// The bank only lends to an 80 overall.
sh({ t0: tBank9 - .1, set: 'city', lt: SUNNY, at: BANKF, act: t => actBank(t),
  cam: (t, u) => hand(camAt(BANKF.clone().add(V(lerp(1.8, 1.5, u), lerp(1.75, 1.7, u), lerp(5.0, 4.4, eo(u)))), BANKF.clone().add(V(1.2, 1.55, 0)), 40, 4.6, 3), t) });
// you never date anyone more than ten points away from your own number: the café terrace, a ✓ and a ✗
sh({ t0: C.L10, set: 'city', lt: SUNNY, at: P3(CAFE, -5.4), act: t => actTerrace(t),
  cam: (t, u) => { const k = eio(seg(t, tTen10 - .5, tTen10 + .15)); return hand(camAt(P3(CAFE + lerp(-2.4, .05, k), -2.3).add(V(0, 1.7, 0)), P3(CAFE + lerp(-2.6, -.05, k), -5.0).add(V(0, 1.38, 0)), 46, 2.8, 4), t); } });
// ===== 2 · the zero =====
// This is Theo. Overall 52. …: at the crosswalk, his card fills in
sh({ t0: C.L11, set: 'city', lt: SUNNY, at: THX, act: t => actTheo(t),
  cam: (t, u) => hand(camAt(THX.clone().add(V(lerp(.7, .5, u), lerp(1.5, 1.7, u), lerp(3.6, 2.9, eo(u)))), THX.clone().add(V(.3, lerp(1.45, 1.75, u), 0)), 40, 3.2, 5), t) });
// In this city, that's painfully average.
sh({ t0: C.L12, set: 'city', lt: SUNNY, at: THX, act: t => actTheo(t),
  cam: (t, u) => hand(camAt(THX.clone().add(V(lerp(.5, .6, u), lerp(1.7, 1.6, u), lerp(2.9, 3.4, u))), THX.clone().add(V(.25, 1.6, 0)), 40, 3.2, 5), t) });
// …a small grey number. Potential: 99.: push into the bottom of his card
sh({ t0: C.L13, set: 'city', lt: SUNNY, at: THX, act: t => actTheo(t), after: 1,
  cam: (t, u) => { const k = eio(seg(t, C.L13, t99_13)); const c0 = headOf(THEO).add(V(0, .28 + .465, 0));
    return hand(camAt(c0.clone().add(V(lerp(.25, .04, k), lerp(.1, -.3, k), lerp(3.4, 1.7, k))), c0.clone().add(V(0, lerp(.05, -.34, k), 0)), lerp(40, 28, k), lerp(3.4, 1.7, k), lerp(4, 6, k)), t, .7); } });
// Nobody reads the small grey number. Not even Theo.: pull back; the crowd walks past, eyes on the big numbers
sh({ t0: C.L14, set: 'city', lt: SUNNY, at: THX, act: t => actTheo(t), after: 1,
  cam: (t, u) => { const k = eio(seg(t, C.L14, C.L14 + 1.4)); const c0 = headOf(THEO).add(V(0, .28 + .465, 0));
    return hand(camAt(c0.clone().add(V(lerp(.04, .6, k), lerp(-.3, -.75, k), lerp(1.7, 4.4, k))), c0.clone().add(V(0, lerp(-.34, -.6, k), 0)), lerp(28, 42, k), lerp(1.7, 4.4, k), 4), t, .7); } });
// Theo is in love with Mia.: over his shoulder, across the road
sh({ t0: C.L15, set: 'city', lt: SUNNY, at: THX, act: t => actLove(t),
  cam: (t, u) => hand(camAt(THX.clone().add(V(lerp(-.55, -.45, u), lerp(1.35, 1.38, u), lerp(1.35, 1.1, eo(u)))), THX.clone().add(V(.3, 1.42, 0)), 38, 1.3, 6), t) });
// Overall 88. IQ 131. EQ 96.: Mia, her card
sh({ t0: tMia15 + .25, set: 'city', lt: SUNNY, at: V(ST.cross, 0, 3), act: t => actLove(t), after: 1,
  cam: (t, u) => { const m = MIAX(t); return hand(camAt(m.clone().add(V(lerp(.9, .7, u), lerp(1.65, 1.7, u), lerp(-3.4, -3.0, eo(u)))), m.clone().add(V(.15, 1.75, 0)), 40, 3.3, 4), t); } });
// That's a 36-point gap.: both of them, the road between
sh({ t0: C.L16, set: 'city', lt: SUNNY, at: V(ST.cross, 0, 0), act: t => actLove(t), after: 1,
  cam: (t, u) => { const a = headOf(THEO), b = headOf(MIA); return hand(camAt(a.clone().add(V(lerp(-.75, -.6, u), lerp(.45, .4, u), lerp(-3.8, -3.5, u))), a.clone().lerp(b, .7).add(V(0, .25, 0)), 22, 11, 1.5), t); } });
// that's not a crush. That's a joke.: two passers-by crack up
sh({ t0: tCity16 - .1, set: 'city', lt: SUNNY, at: P3(ST.cross - 4, -5), act: t => actLove(t),
  cam: (t, u) => hand(camAt(P3(ST.cross - 3.6 + lerp(.3, 0, u), -2.0).add(V(0, 1.7, 0)), P3(ST.cross - 4.2, -5.4).add(V(0, 1.45, 0)), 42, 3.4, 4), t) });
// the day they met, Theo wasn't okay. 61. 52. 44.: overcast; Theo alone on the bench
sh({ t0: C.L17, set: 'city', lt: GREY, at: BEN, act: t => actSink(t),
  cam: (t, u) => hand(camAt(BEN.clone().add(V(lerp(.9, .6, u), lerp(1.25, 1.3, u), lerp(3.4, 2.6, eo(u)))), BEN.clone().add(V(.4, 1.5, 0)), 42, 2.9, 5), t, .6) });
// Thousands of people walked past that number.: the street streams past him
sh({ t0: C.L18, set: 'city', lt: GREY, at: BEN, act: t => actSink(t),
  cam: (t, u) => hand(camAt(BEN.clone().add(V(lerp(-1.0, 1.0, u), 2.0, 4.8)), BEN.clone().add(V(.2, 1.05, 0)), 42, 5, 3), t, .6) });
// Nobody said a word.: close on him
sh({ t0: tNobody18 - .1, set: 'city', lt: GREY, at: BEN, act: t => actSink(t), after: 1,
  cam: (t, u) => { const h = headOf(THEO); return hand(camAt(h.clone().add(V(lerp(-.5, -.4, u), lerp(-.05, 0, u), lerp(1.6, 1.4, u))), h.clone().add(V(0, .06, 0)), 36, 1.6, 5), t, .5); } });
// Mia was the first one who stopped.
sh({ t0: C.L19, set: 'city', lt: GREY, at: BEN, act: t => actMeet(t),
  cam: (t, u) => hand(camAt(BEN.clone().add(V(lerp(1.7, 1.5, u), lerp(1.4, 1.38, u), lerp(2.4, 2.0, eo(u)))), BEN.clone().add(V(-.15, 1.35, .3)), 40, 2.4, 5), t) });
// She sat down next to him and asked, "Are you okay?" And then she stayed.
sh({ t0: tSat19 - .1, set: 'city', lt: GREY, at: BEN, act: t => actMeet(t),
  cam: (t, u) => hand(camAt(BEN.clone().add(V(lerp(.3, .2, u), lerp(1.45, 1.5, u), lerp(3.0, 2.6, eo(u)))), BEN.clone().add(V(.05, 1.42, 0)), 40, 2.8, 5), t) });
// Every time she laughed at one of his terrible jokes, his mental health went up by one.: the sun comes back out
sh({ t0: C.L20, set: 'city', lt: 'warm', at: BEN, act: t => actMeet(t),
  cam: (t, u) => hand(camAt(BEN.clone().add(V(lerp(.35, .2, u), lerp(1.5, 1.52, u), lerp(3.0, 2.6, eo(u)))), BEN.clone().add(V(.1, 1.55, 0)), 40, 2.7, 5), t) });
// When two people look at each other… Compatibility.: the heart rises between them
sh({ t0: C.L21, set: 'city', lt: SUNNY, at: BEN, act: t => actHeart(t),
  cam: (t, u) => hand(camAt(BEN.clone().add(V(0, lerp(1.3, 1.36, u), lerp(2.6, 2.1, eo(u)))), BEN.clone().add(V(0, 1.5, 0)), 38, 2.2, 6), t, .6) });
// Theo and Mia: zero percent.
sh({ t0: C.L22, set: 'city', lt: SUNNY, at: BEN, act: t => actHeart(t),
  cam: (t, u) => hand(camAt(BEN.clone().add(V(0, 1.36, lerp(2.1, 1.85, u))), BEN.clone().add(V(0, 1.55, 0)), 38, 1.9, 6), t, .6) });
// And standing right behind her is the guy she's 97% compatible with.
sh({ t0: tStanding22 - .1, set: 'city', lt: SUNNY, at: BEN, act: t => actKaiIn(t),
  cam: (t, u) => hand(camAt(V(lerp(3.4, 3.7, u), lerp(1.75, 1.8, u), lerp(-2.0, -2.4, eo(u))), V(5.0, 1.8, -6.0), 42, 3.9, 4), t) });
// Kai. Overall 94. Strength 97. Athleticism 98. Two-time champion.: the slow-motion strut
sh({ t0: C.L23, set: 'city', lt: SUNNY, at: P3(-4, -5.3), act: t => actStrut(t), after: 1,
  cam: (t, u) => { const p = KW(t); return hand(camAt(p.clone().add(V(lerp(3.1, 2.6, u), lerp(1.1, 1.2, u), lerp(.6, .4, u))), p.clone().add(V(-.3, 1.62, 0)), 42, 3.0, 5), t, .6); } });
// He won't shake hands with anyone under 80.: a 72 offers his hand… left hanging
sh({ t0: C.L24, set: 'city', lt: SUNNY, at: P3(-2, -5.3), act: t => actStrut(t), after: 1,
  cam: (t, u) => { const p = KW(t), s0 = P3(-1.3, -6.2), m = p.clone().lerp(s0, .5); return hand(camAt(m.clone().add(V(.5, 1.6, 3.6)), m.clone().add(V(0, 1.45, 0)), 44, 3.6, 4), t); } });
// His EQ is 19. And one line on his card is completely blank.: close on his card
sh({ t0: tEQ24 - .1, set: 'city', lt: SUNNY, at: P3(-2, -5.3), act: t => actKaiCard(t), after: 1,
  cam: (t, u) => { const c0 = cardOf(KAI), k = eio(seg(t, tEQ24, tBlank24)); return hand(camAt(c0.clone().add(V(.35, lerp(.08, -.08, k), 1.75)), c0.clone().add(V(.25, lerp(.05, -.22, k), 0)), 30, 1.75, 6), t, .5); } });
// Because if you're rich enough, you can pay to hide one number.: the PRIVACY+ boutique
sh({ t0: C.L25, set: 'city', lt: SUNNY, at: PRV, act: t => actPrivacy(t),
  cam: (t, u) => hand(camAt(PRV.clone().add(V(lerp(-1.2, -.9, u), lerp(1.75, 1.8, u), lerp(4.6, 4.0, eo(u)))), PRV.clone().add(V(-.5, 2.1, -.4)), 44, 4.3, 3), t) });
// ===== 3 · the ranking =====
// Every year the city holds The Ranking.: over the stands to the giant screen
sh({ t0: C.L26, set: 'stadium', lt: STADIUM, at: SO, act: t => actRank(t), fpv: .25,
  cam: (t, u) => { const k = eio(u); return camAt(SP(lerp(30, 18, k), lerp(-14, -6, k), lerp(26, 12, k)), SP(lerp(-20, -38, k), 0, lerp(10, 12, k)), 46, 40, .5, lerp(.04, 0, k)); } });
// Three rounds, live on TV.: the TV camera, its red light on
sh({ t0: tThree26 - .1, set: 'stadium', lt: STADIUM, at: STG, act: t => actRank(t),
  cam: (t, u) => hand(camAt(SP(lerp(-11, -12.5, u), lerp(-1.5, -.5, u), 5.5), SP(-44, 0, 12.5), 42, 32, .5), t, .5) });
// The winner's card turns gold, and gold outranks every number.: the gold card trophy
sh({ t0: C.L27, set: 'stadium', lt: STADIUM, at: STG, act: t => actRank(t),
  cam: (t, u) => { const c = STAD.userData.trophy.getWorldPosition(V()).add(V(0, 1.8, 0)); return hand(camAt(c.clone().add(V(lerp(4.0, 2.8, eo(u)), lerp(-.6, -.3, u), lerp(1.4, .9, u))), c, 38, 3.4, 5), t, .6); } });
// So Theo signs up.
sh({ t0: C.L28, set: 'stadium', lt: STADIUM, at: DESK, act: t => actSign(t),
  cam: (t, u) => hand(camAt(DESK.clone().add(V(lerp(2.6, 2.3, u), lerp(1.5, 1.52, u), lerp(1.6, 1.4, eo(u)))), DESK.clone().add(V(0, 1.4, .3)), 40, 2.6, 5), t) });
// The clerk reads his 52 out loud,
sh({ t0: tClerk28 - .1, set: 'stadium', lt: STADIUM, at: DESK, act: t => actSign(t), after: 1,
  cam: (t, u) => { const h = headOf(CLERK); return hand(camAt(h.clone().add(V(lerp(1.6, 1.4, u), .1, lerp(1.4, 1.2, u))), h.clone().add(V(.35, .2, .3)), 38, 2.0, 5), t); } });
// and the whole stadium laughs.: the stands crack up; the screen shows THEO · 52
sh({ t0: tWhole28 - .1, set: 'stadium', lt: STADIUM, at: SP(-16, 6), act: t => actSign(t),
  cam: (t, u) => hand(camAt(SP(lerp(-13.6, -14.2, u), 6.6, lerp(1.6, 1.7, u)), SP(-44, 0, 8), 46, 3, 1.0), t, 1.0) });
// Round one, the race. Kai wins without breaking a sweat.: tracking alongside the leaders
sh({ t0: C.L29, set: 'stadium', lt: STADIUM, at: SP(0, 21), act: t => actRace(t),
  cam: (t, u) => { const x = Math.min(RX(t), 3); return hand(camAt(SP(x + 2.6, 15.6, 1.5), SP(x - .3, 20.8, 1.3), 42, 5.5, 3), t, 1.4); } });
// Theo comes in dead last.
sh({ t0: tTheo29 - .1, set: 'stadium', lt: STADIUM, at: SP(0, 21), act: t => actRace(t), after: 1,
  cam: (t, u) => { const x = THX29(t); return hand(camAt(SP(x + 2.4, 20.0, 1.45), SP(x - .2, 23.6, 1.3), 40, 4.3, 4), t, 1.1); } });
// By a lot.: from the finish line, a long lens back up the straight
sh({ t0: tLot29 - .1, set: 'stadium', lt: STADIUM, at: SP(-10, 21), act: t => actRace(t),
  cam: (t, u) => hand(camAt(SP(4.5, 22.4, 1.5), SP(-20, 23.5, 1.0), 11, 24.5, .4), t, .3) });
// Round two, the puzzle. And something strange happens.: the desks on the infield
sh({ t0: C.L30, set: 'stadium', lt: STADIUM, at: SP(-1, -2), act: t => actPuzzle(t),
  cam: (t, u) => hand(camAt(SP(lerp(-11, -8.5, u), 5.5, lerp(3.4, 3.0, u)), SP(-1, -2, .9), 42, 11, 1.5), t) });
// Theo's IQ starts climbing,: Theo at his desk
sh({ t0: tClimbing30 - .5, set: 'stadium', lt: STADIUM, at: SP(-1, -2), act: t => actPuzzle(t),
  cam: (t, u) => hand(camAt(SP(SD.desks[2][0] + lerp(.5, .35, u), SD.desks[2][1] + lerp(2.4, 2.0, eo(u)), 1.78), SP(SD.desks[2][0] + .3, SD.desks[2][1] - .5, 1.75), 40, 2.4, 5), t) });
// live on the giant screen. 104. 105. 106.
sh({ t0: tGiant30 - .1, set: 'stadium', lt: STADIUM, at: STG, act: t => actPuzzle(t),
  cam: (t, u) => hand(camAt(SP(-17 + u * 1.5, 0, 5.5), SP(-44, 0, 12.5), 42, 28, .5), t, .5) });
// Second place.
sh({ t0: C.L31, set: 'stadium', lt: STADIUM, at: STG, act: t => actPuzzle(t),
  cam: (t, u) => hand(camAt(SP(-16 + u * 1.2, 0, 5.5), SP(-44, 0, 12.5), 42, 28, .5), t, .5) });
// For the first time all day, nobody's laughing.: the front row, quiet (Mia among them)
sh({ t0: tFor31 - .1, set: 'stadium', lt: STADIUM, at: SP(-16, 6), act: t => actQuiet(t),
  cam: (t, u) => hand(camAt(SP(lerp(-19.9, -19.6, u), lerp(4.3, 4.5, u), 1.6), SP(-16.9, 5.6, 1.5), 40, 3, 4), t, .6) });
// Then the final is announced.: the host at the podium
sh({ t0: C.L32, set: 'stadium', lt: STADIUM, at: STG, act: t => actHost(t),
  cam: (t, u) => { const p = STAD.userData.podium.getWorldPosition(V()); return hand(camAt(p.clone().add(V(lerp(3.2, 2.7, u), 1.4, lerp(1.2, 1.0, u))), p.clone().add(V(-.1, 1.7, .5)), 40, 3.1, 4), t); } });
// Partners are random, and every hidden number gets switched off.: the wall, the screen
sh({ t0: tPartners32 - .1, set: 'stadium', lt: STADIUM, at: SO, act: t => actHost(t),
  cam: (t, u) => hand(camAt(SP(lerp(-2, -6, eo(u)), lerp(14, 16, u), lerp(2.5, 3.5, u)), SP(lerp(12, -40, eio(seg(t, tEvery32 - .6, tSwitched32))), lerp(-6, 0, u), lerp(5, 11, u)), 48, 20, .5), t) });
// The screen spins. Theo's partner?
sh({ t0: C.L33, set: 'stadium', lt: STADIUM, at: SO, act: t => actPair(t),
  cam: (t, u) => hand(camAt(SP(-18, 0, 5.0), SP(-44, 0, 12.5), 38, 26, .5), t, .5) });
// Kai. The filters drop.: the two of them on the infield; every card in the place glitches
sh({ t0: tKai33 - .05, set: 'stadium', lt: STADIUM, at: SO, act: t => actPair(t),
  cam: (t, u) => hand(camAt(SP(lerp(1.0, 1.2, u), lerp(3.7, 4.1, u), lerp(1.5, 1.65, u)), SP(.1, 0, lerp(1.7, 1.9, u)), lerp(42, 46, u), 3.8, 4), t) });
// Every card in the stadium flickers.: the stands, every pill flickering
sh({ t0: tEvery34 - .1, set: 'stadium', lt: STADIUM, at: SO, act: t => actPair(t),
  cam: (t, u) => hand(camAt(SP(lerp(-6, -2, u), 10, 4), SP(lerp(-10, -6, u), 40, 6), 40, 30, .6), t, .8) });
// And Kai's blank line lights up.: push into his card
sh({ t0: tBlank34 - .1, set: 'stadium', lt: STADIUM, at: SO, act: t => actPair(t), after: 1,
  cam: (t, u) => { const c0 = cardOf(KAI), k = eio(seg(t, tBlank34 - .1, tLights34 + .3)); return hand(camAt(c0.clone().add(V(lerp(.5, .04, k), lerp(-.5, -.18, k), lerp(3.0, 1.5, k))), c0.clone().add(V(0, lerp(-.35, -.27, k), 0)), lerp(40, 30, k), lerp(3.0, 1.5, k), 6), t, .5); } });
// Mental health: 12. It's been 12 for years.: his card, then his face
sh({ t0: C.L35, set: 'stadium', lt: STADIUM, at: SO, act: t => actExposed(t), after: 1,
  cam: (t, u) => { const h = headOf(KAI), c0 = cardOf(KAI), k = eio(seg(t, tIts35 - .2, tYears35 - .2));
    return hand(camAt(h.clone().add(V(lerp(-1.75, -1.3, k), lerp(.78, .08, k), lerp(.06, .1, k))), c0.clone().add(V(0, -.22, 0)).lerp(h.clone().add(V(0, .05, 0)), k), lerp(30, 32, k), lerp(1.75, 1.3, k), 6), t, .5); } });
// That's what he was paying to hide.: behind the two of them, the giant screen
sh({ t0: tThats35 - .1, set: 'stadium', lt: STADIUM, at: SO, act: t => actExposed(t),
  cam: (t, u) => hand(camAt(SP(lerp(3.9, 3.2, eo(u)), lerp(-.02, -.12, u), 2.0), SP(-44, -.6, 9.6), 34, 40, .5), t, .5) });
// ===== 4 · the wall =====
// The final is a wall.: everyone starts up it
sh({ t0: C.L36, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => actWall(t),
  cam: (t, u) => hand(camAt(SP(WALLX + lerp(1.8, 1.2, u), WALLZ + lerp(17, 15.5, u), lerp(2.4, 2.8, u)), SP(WALLX, WALLZ, 4.4), 44, 16, .8), t) });
// Halfway up,
sh({ t0: tHalfway36 - .1, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => actWall(t),
  cam: (t, u) => hand(camAt(SP(WALLX + lerp(2.6, 2.1, u), WALLZ + lerp(10.8, 10.2, u), lerp(1.8, 2.1, u)), SP(WALLX + .2, WALLZ + .3, lerp(5.0, 5.3, u)), 46, 10.5, 1), t) });
// Kai looks down at 50,000 people reading his number.: over his shoulder
sh({ t0: tLooks36 - .1, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => actWall(t), after: 1,
  cam: (t, u) => { const h = headOf(KAI); return hand(camAt(h.clone().add(V(lerp(.75, .6, u), lerp(.75, .85, u), lerp(.85, 1.0, u))), SP(lerp(10, 8, u), 15, lerp(1.5, 1.0, u)), 50, 14, 2), t, .8); } });
// 9. 6. 4. He freezes.: close on him, clinging; his number falls
sh({ t0: C.L37, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => actWall(t), after: 1,
  cam: (t, u) => { const h = headOf(KAI); return shake(hand(camAt(h.clone().add(V(lerp(-1.4, -1.25, u), .1, lerp(.05, .02, u))), h.clone().add(V(-.04, .14, 0)), 40, 1.4, 5), t, .6), t, t > tFreezes ? 1 : 0); } });
// He can't go up.: his eyes up the wall, the others already sitting on top
sh({ t0: tCantUp - .1, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => actWall(t), after: 1,
  cam: (t, u) => { const h = headOf(KAI); return hand(camAt(h.clone().add(V(1.1, lerp(-.9, -.8, u), 4.6)), WP(KX + .2, 6.9), 46, 5, 3, .03), t, .8); } });
// He can't go down.: and down, the long drop
sh({ t0: tCantDown - .1, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => actWall(t), after: 1,
  cam: (t, u) => { const h = headOf(KAI); return hand(camAt(h.clone().add(V(.55, lerp(1.2, 1.3, u), 1.25)), h.clone().add(V(.15, -2.6, .7)), 54, 2, 2, -.05), t, 1.2); } });
// Theo could climb right past him and win.: from the side, the top of the wall above them
sh({ t0: C.L38, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => actWall(t),
  cam: (t, u) => hand(camAt(SP(WALLX + lerp(4.6, 4.3, u), WALLZ + 3.6, lerp(5.0, 5.4, u)), SP(WALLX + .2, WALLZ + .4, lerp(6.0, 6.4, u)), 46, 6, 2), t) });
// Instead, he climbs back down.: from the top, looking down at them
sh({ t0: tInstead38 - .1, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => actWall(t),
  cam: (t, u) => hand(camAt(SP(WALLX + lerp(1.2, 1.0, u), WALLZ + 2.0, 8.9), SP(WALLX + .1, WALLZ + .5, lerp(5.1, 4.8, u)), 44, 4.4, 4), t) });
// He doesn't pull him. He doesn't push him.: side by side on the wall
sh({ t0: C.L39, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => actWall(t), after: 1,
  cam: (t, u) => { const k = headOf(KAI), th = headOf(THEO), m = k.clone().lerp(th, .5); return hand(camAt(m.clone().add(V(lerp(-.6, -.4, u), .3, lerp(2.6, 2.3, u))), m.clone().add(V(0, .1, 0)), 40, 2.6, 4), t, .6); } });
// He just talks to him.
sh({ t0: tJust39 - .1, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => actWall(t), after: 1,
  cam: (t, u) => { const k = headOf(KAI), th = headOf(THEO), m = k.clone().lerp(th, .5); return hand(camAt(k.clone().add(V(lerp(-1.25, -1.1, u), .25, lerp(1.35, 1.25, u))), m.clone().add(V(.15, .12, 0)), 40, 1.9, 5), t, .6); } });
// "Don't look at them.": Theo, close
sh({ t0: C.L40, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => actWall(t), after: 1,
  cam: (t, u) => { const h = headOf(THEO); return hand(camAt(h.clone().add(V(lerp(-.8, -.72, u), .06, lerp(.62, .55, u))), h.clone().add(V(0, .08, 0)), 34, 1.0, 6), t, .5); } });
// "Look at the next hold.": the hold above Kai's hand
sh({ t0: tLook40 - .1, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => actWall(t), after: 1,
  cam: (t, u) => { const hp = KAI.aL.hand.getWorldPosition(V()); return hand(camAt(hp.clone().add(V(lerp(-.62, -.52, u), lerp(-.05, 0, u), .5)), hp.clone().add(V(.05, .14, -.2)), 36, .8, 7), t, .5); } });
// "I'm not going anywhere.": Kai listening; the number starting to move
sh({ t0: tIm40 - .1, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => actWall(t), after: 1,
  cam: (t, u) => { const h = headOf(KAI); return hand(camAt(h.clone().add(V(lerp(.82, .74, u), .08, lerp(.6, .55, u))), h.clone().add(V(0, .12, 0)), 36, 1.0, 6), t, .5); } });
// And the whole stadium watches the number come back.: the front row, the giant screen
sh({ t0: C.L41, set: 'stadium', lt: STADIUM, at: SP(-16, 6), act: t => actWatch(t),
  cam: (t, u) => hand(camAt(SP(lerp(-13.6, -14.2, u), 6.6, lerp(1.6, 1.7, u)), SP(-44, 0, 8), 46, 3, 1.0), t, 1.0) });
// 10. 25. 40.: Kai, close; the number climbing
sh({ t0: t10 - .1, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => actWall(t), after: 1,
  cam: (t, u) => { const h = headOf(KAI); return hand(camAt(h.clone().add(V(lerp(-1.4, -1.25, u), .12, lerp(.05, .02, u))), h.clone().add(V(-.04, .16, 0)), 40, 1.4, 5), t, .6); } });
// Hold by hold, they climb together.: rising with them
sh({ t0: C.L42, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => actWall(t),
  cam: (t, u) => { const y = (KY(t) + TY(t)) / 2; return hand(camAt(WP(0, y + 1.2).add(V(3.2, .4, 3.4)), WP(0, y + 1.25), 42, 4.7, 3), t, .7); } });
// They cross the line dead last.: the top of the wall, everyone else already up
sh({ t0: tThey42 - .1, set: 'stadium', lt: STADIUM, at: SP(WALLX, WALLZ), act: t => actWall(t),
  cam: (t, u) => hand(camAt(SP(WALLX + lerp(1.0, .8, u), WALLZ + lerp(6.2, 5.8, u), lerp(10.6, 10.8, u)), SP(WALLX, WALLZ + .3, lerp(8.6, 8.9, u)), 46, 6.2, 2), t) });
// Then the judges reveal how the final was scored.: the judges' table on the stage
sh({ t0: C.L43, set: 'stadium', lt: STADIUM, at: STG, act: t => actJudges(t),
  cam: (t, u) => { const j = JT(); return hand(camAt(j.clone().add(V(lerp(4.6, 4.1, eo(u)), lerp(1.15, 1.25, u), lerp(-1.4, -1.2, u))), j.clone().add(V(-.7, 1.05, 0)), 42, 4.4, 3), t); } });
// Not by time. By how much your ratings changed.: the giant screen
sh({ t0: tNot43 - .1, set: 'stadium', lt: STADIUM, at: STG, act: t => actJudges(t),
  cam: (t, u) => hand(camAt(SP(-17 + u * 1.5, 0, 5.5), SP(-44, 0, 12.5), 42, 28, .5), t, .5) });
// Kai's EQ jumped 40 points in one afternoon.: his card, then the shades come off
sh({ t0: C.L44, set: 'stadium', lt: STADIUM, at: STG, act: t => actResult(t), after: 1,
  cam: (t, u) => { const h = headOf(KAI), c0 = cardOf(KAI), k = eio(seg(t, tAfternoon44 - .45, tAfternoon44 + .25));
    return hand(camAt(h.clone().add(V(lerp(1.75, 1.3, k), lerp(.78, .1, k), lerp(-.05, -.1, k))), c0.clone().add(V(0, -.2, 0)).lerp(h.clone().add(V(0, .06, 0)), k), lerp(30, 32, k), lerp(1.75, 1.3, k), 6), t, .5); } });
// Theo's? Every single stat went up.: his card, every row climbing
sh({ t0: tTheos44 - .1, set: 'stadium', lt: STADIUM, at: STG, act: t => actResult(t), after: 1,
  cam: (t, u) => { const c0 = cardOf(THEO); return hand(camAt(c0.clone().add(V(lerp(1.7, 1.55, u), -.12, .04)), c0.clone().add(V(0, -.05, 0)), 32, 1.6, 6), t, .5); } });
// His card turns gold.: pull back to his face as it turns
sh({ t0: C.L45, set: 'stadium', lt: STADIUM, at: STG, act: t => actResult(t), after: 1,
  cam: (t, u) => { const h = headOf(THEO), c0 = cardOf(THEO, .8), k = eio(u); return hand(camAt(h.clone().add(V(lerp(1.8, 2.4, k), lerp(.7, .5, k), lerp(.05, .35, k))), c0.clone().add(V(0, -.2, 0)).lerp(h.clone().add(V(0, .45, 0)), k), 34, 2.0, 5), t, .5); } });
// And for the first time, 50,000 people read the small grey number.: the front row, the screen: POTENTIAL 99
sh({ t0: tAnd45 - .1, set: 'stadium', lt: STADIUM, at: SP(-16, 6), act: t => actResult(t),
  cam: (t, u) => hand(camAt(SP(lerp(-13.6, -14.4, u), 6.6, lerp(1.6, 1.75, u)), SP(-44, 0, 8.5), 46, 3, 1.0), t, 1.0) });
// ===== 5 · the point =====
// That night, Mia walks right past the 97 and stands next to the zero.
sh({ t0: C.L46, set: 'city', lt: NIGHT, at: P3(4, -5.4), act: t => actNight(t),
  cam: (t, u) => { const mx = Math.min(MW(t).x + .45, 5.38), lx = lerp(mx, 5.38, seg(t, tStands46 - .3, tZero46)); return hand(camAt(P3(lx - .15, -1.3).add(V(0, 1.7, 0)), P3(lx, -5.4).add(V(0, 1.5, 0)), 42, 4.2, 3), t); } });
// Because compatibility only measures how alike two people are.
sh({ t0: C.L47, set: 'city', lt: NIGHT, at: P3(5.4, -5.6), act: t => actNight(t),
  cam: (t, u) => hand(camAt(P3(lerp(5.25, 5.45, u), lerp(-2.0, -2.2, u)).add(V(0, 1.6, 0)), P3(5.38, -5.58).add(V(0, 1.72, 0)), 38, 3.6, 4), t) });
// They were nothing alike. That was the point.
sh({ t0: tThey47 - .1, set: 'city', lt: NIGHT, at: P3(5.4, -5.6), act: t => actNight(t),
  cam: (t, u) => hand(camAt(P3(lerp(5.0, 5.15, u), lerp(-2.55, -2.75, u)).add(V(0, 1.35, 0)), P3(5.38, -5.58).add(V(0, 1.78, 0)), 40, 3.0, 5), t) });
// Oh, and Kai? He cancelled his privacy plan.: out of the PRIVACY+ door, without the bag
sh({ t0: C.L48, set: 'city', lt: SUNNY, at: PRV, act: t => actKaiAfter(t),
  cam: (t, u) => hand(camAt(PRV.clone().add(V(lerp(-1.4, -1.1, u), lerp(1.7, 1.75, u), lerp(4.6, 4.1, eo(u)))), PRV.clone().add(V(-.4, 1.95, -.4)), 44, 4.3, 3), t) });
// His mental health is right there on his card for everyone to see.: down the street, card on show
sh({ t0: tMental48 - .1, set: 'city', lt: SUNNY, at: P3(10, -5.3), act: t => actKaiAfter(t), after: 1,
  cam: (t, u) => { const p = KWALK(t); return hand(camAt(p.clone().add(V(-2.8, 1.6, 2.7)), p.clone().add(V(-.3, 1.65, -.3)), 42, 3.9, 4), t, .7); } });
// It's 71 now.: his card, close
sh({ t0: t71 - .25, set: 'city', lt: SUNNY, at: P3(8, -5.3), act: t => actKaiAfter(t), after: 1,
  cam: (t, u) => { const c0 = cardOf(KAI); return hand(camAt(c0.clone().add(V(lerp(-.5, -.3, u), lerp(-.3, -.27, u), lerp(1.8, 1.55, u))), c0.clone().add(V(-.1, -.27, 0)), 30, 1.6, 6), t, .5); } });
// 50 years later, Theo and Mia are still on the same bench, still holding hands.
sh({ t0: C.L49, set: 'city', lt: GOLDEN, at: BEN, act: t => actOld(t),
  cam: (t, u) => hand(camAt(BEN.clone().add(V(lerp(.6, .3, u), 1.2, lerp(3.6, 3.0, eo(u)))), BEN.clone().add(V(0, 1.1, 0)), 42, 3.2, 4), t) });
// Compatibility: still zero percent.
sh({ t0: C.L50, set: 'city', lt: GOLDEN, at: BEN, act: t => actOld(t),
  cam: (t, u) => hand(camAt(BEN.clone().add(V(0, 1.45, lerp(2.5, 2.3, u))), BEN.clone().add(V(0, 1.6, 0)), 38, 2.4, 5), t) });
// Mental health: both 100.: their two cards
sh({ t0: tMental50 - .1, set: 'city', lt: GOLDEN, at: BEN, act: t => actOld(t),
  cam: (t, u) => hand(camAt(BEN.clone().add(V(0, 1.9, lerp(3.2, 3.0, u))), BEN.clone().add(V(0, 1.95, 0)), 42, 3.2, 4), t) });
// And every time she laughs, it still tries to go up by one.
sh({ t0: C.L51, set: 'city', lt: GOLDEN, at: BEN, act: t => actOld(t), after: 1,
  cam: (t, u) => { const c0 = cardOf(OLDT, .55), h = headOf(OLDT); return hand(camAt(c0.clone().add(V(lerp(-.2, -.1, u), lerp(-.5, -.45, u), lerp(2.6, 2.3, u))), c0.clone().lerp(h, .45), 36, 2.4, 5), t, .5); } });
// So, if you could hide one rating, which one would it be?: up and away from the bench
sh({ t0: C.L52, set: 'city', lt: GOLDEN, at: BEN, act: t => actOld(t),
  cam: (t, u) => { const k = eio(seg(t, C.L52, END - .5)); return camAt(BEN.clone().add(V(lerp(.2, 2.2, k), lerp(1.6, 5.2, k), lerp(3.4, 9.5, k))), BEN.clone().add(V(lerp(0, 1.6, k), lerp(1.4, 1.2, k), 0)), 42, 6, 2); } });
S.forEach((s, i) => { s.t1 = i + 1 < S.length ? S[i + 1].t0 : END + 1; });
// the chapter cards cover the gaps between chapters (checked first)
const CARDS = CHS.map((c, i) => ({ t0: c.t0, t1: c.t1, card: i }));
const SHOTS = [...CARDS, ...S];
const REW = { a: C.L3, b: CHS[0].t0 };

// ---------------- acting ----------------
// --- the wall (cold open + chapter 4) ---
function climbPose(ph, moving, o = {}) {
  const s = Math.sin(ph), c = Math.cos(ph), m = moving ? 1 : 0;
  return { sp: [10, 0, 0], hd: [-18, 0, 0], aL: [-150 - 18 * s * m, 26, 0, 40 + 25 * c * m], aR: [-150 + 18 * s * m, 26, 0, 40 - 25 * c * m], lL: [38 + 22 * s * m, 14, 62 + 30 * Math.max(0, s) * m], lR: [38 - 22 * s * m, 14, 62 + 30 * Math.max(0, -s) * m], ...o };
}
function climber(p, x, y, ry, ph, moving, o) { const v = WP(x, y); if (o.tremble) { v.x += Math.sin(o.t * 47) * .012 * o.tremble; v.y += Math.sin(o.t * 39) * .008 * o.tremble; } put(p, v, ry); apply(p, climbPose(ph, moving), o); }
function sitters(t, mood, only = [0, 1, 2, 3]) {
  only.forEach(i => { const p = RUN[i]; put(p, SP(WALLX + RXS[i], WALLZ + .05, 8.55), 0);
    const q = mood === 'cheer' ? { ...TP.sit, y: -.06, aL: [-15, 140, 0, 20], aR: [-15, 140, 0, 20] } : { ...TP.sit, y: -.06, sp: [14, 0, 0], hd: [20, 0, 0] };
    apply(p, mood === 'cheer' ? mix(q, { ...q, aL: [-30, 120, 0, 50], aR: [-30, 120, 0, 50] }, .5 + .5 * Math.sin(t * 9 + i)) : q, { t, seed: 40 + i, face: mood === 'cheer' ? 'laugh' : 'worried', look: mood === 'cheer' ? CAMP : headOf(KAI) }); card(p, { s: .8 }); });
}
function actHook(t, mode = 0) {
  reset(); STAD.userData.cheer(t, .1);
  const close = mode === 1;
  climber(KAI, KX, HOOK.ky, close ? Math.PI + .55 : Math.PI, t * 7, false, { t, seed: 6, face: 'shock', tremble: 1, look: close ? WP(KX, HOOK.ky).add(V(-1.3, 2.2, .05)) : SP(8, 16, 1), eyes: close ? [.2, -.5] : [0, -.5] });
  climber(THEO, TX, HOOK.ty, Math.PI, t * 7 + 1.3, false, { t, seed: 1, face: 'worried', look: headOf(KAI) });
  sitters(t, 'still');
  card(KAI, { v: { ...KAI.v, mh: 4 }, hl: 'mh', flash: Math.sin(t * 12) > 0 ? 1 : 0, s: mode === 2 ? .9 : .7 });
  card(THEO, { s: .8, mini: 1 });
}
function actWall(t) {
  reset(); STAD.userData.cheer(t, t > tCross42 ? 1 : t > t40 ? .5 : t < C.L37 ? .4 : .08);
  const ky = KY(t), ty = TY(t), kMov = Math.abs(KY(t + .05) - ky) > .004, tMov = Math.abs(TY(t + .05) - ty) > .004;
  // the other pairs: up and over, then sitting on top watching
  RUN.forEach((p, i) => { const y = RY(i, t); if (y < 8.45) { climber(p, RXS[i], y, Math.PI, t * 7 + i, Math.abs(RY(i, t + .05) - y) > .004, { t, seed: 40 + i, face: 'angry', look: WP(RXS[i], 10) }); card(p, { s: .8 }); }
    else sitters(t, t > tCross42 - .2 ? 'cheer' : 'still', [i]); });
  // Kai: which way he faces depends on where the camera is
  const freezeClose = t >= C.L37 && t < tCantUp - .1, listen = t >= tIm40 - .1 && t < C.L41, numClose = t >= t10 - .1 && t < C.L42;
  const kRy = freezeClose || numClose ? Math.PI + .55 : listen ? Math.PI - 1.3 : Math.PI;
  const kFace = t < tLooks36 ? 'deadpan' : t < t9 ? 'worried' : t < tTalks39 ? (t > tFreezes ? 'shock' : 'worried') : t < tIm40 + .3 ? 'calm' : t < t40 ? 'smile' : t < tCross42 ? 'happy' : 'laugh';
  const kLook = freezeClose || numClose ? WP(KX, ky).add(V(-1.3, 2.2, .05)) : listen ? headOf(THEO) : t >= tLooks36 && t < C.L37 ? SP(8, 16, 1) : t >= tTalks39 && t < C.L42 ? headOf(THEO) : WP(KX, 10);
  const trem = t >= tFreezes && t < tTalks39 ? 1 : t >= C.L37 && t < tFreezes ? .4 : 0;
  climber(KAI, KX, ky, kRy, t * 7, kMov, { t, seed: 6, face: kFace, look: kLook, tremble: trem, eyes: t >= C.L37 && t < tTalks39 && !freezeClose ? [0, -.5] : freezeClose ? [.2, -.5] : undefined });
  // Theo
  const talking = (t > tTalks39 - .1 && t < C.L41) || (t >= C.L41 && t < t25);
  const tClose = t >= C.L40 && t < tLook40 - .1;
  const tFace = t < tLooks36 ? 'deadpan' : t < C.L38 ? 'worried' : t < tInstead38 ? 'proud' : t < C.L39 ? 'worried' : t < C.L42 ? 'happy' : t < tCross42 ? 'smile' : 'laugh';
  climber(THEO, TX, ty, tClose ? Math.PI + 1.3 : Math.PI, t * 7 + 1.3, tMov, { t, seed: 1, face: tFace, look: t < tWin38 && t >= C.L38 ? WP(TX, 10) : headOf(KAI), talk: talking ? clamp(.5 + .5 * Math.sin(t * 19)) : 0 });
  // the cards
  const m = MH(t), pov = (t >= tLooks36 - .1 && t < C.L37) || (t >= tCantUp - .1 && t < C.L38);
  if (pov) card(KAI, { show: 0 });
  else if (freezeClose || numClose) card(KAI, { v: kaiV(t), hl: 'mh', flash: t < tTalks39 && Math.sin(t * 12) > 0 ? 1 : 0, pop: m.pop.map(x => ({ k: 'mh', ...x })), s: .7 });
  else card(KAI, { v: kaiV(t), s: listen ? .5 : .8, mini: 1 });
  card(THEO, { s: tClose ? .45 : .8, mini: 1, show: pov ? 0 : 1 });
}
// --- 1 · the rules ---
function actCrowd(t) {
  reset(); crowd(t, 12, 1, 0);
  put(EXA, EXP.clone().add(V(-.6, 0, .4)), .3); apply(EXA, walk(TP.stand, t * 7, .9), { t, seed: 8, face: 'happy', look: CAMP }); card(EXA, { s: .5 });
}
function actExa(t) {
  reset(); crowd(t, 8, 1, -2); clearAround(EXP, 1.6, 1.0, 8);
  put(EXA, EXP, 0); apply(EXA, t > tLive6 ? TP.hips : TP.stand, { t, seed: 8, face: t > tLive6 + .1 ? 'smile' : 'happy', look: CAMP });
  const done = T5.filter(x => t >= x - .05).length, last = T5[Math.max(0, done - 1)];
  const sh = t >= T5[5] + .4 ? 1 : (Math.max(0, done - 1) + seg(t, last - .05, last + .15)) / 7;
  const eq = stepper(t, 74, [[tLive6 + .05, 75]]);
  card(EXA, { show: sh, v: { ...EXA.v, eq: eq.v }, pop: eq.pop.map(p => ({ k: 'eq', ...p })) });
  onHand(EXA, CUP, 1, [0, -.02, .05]);
}
function actJog(t) {
  reset();
  const p = JX(t); put(JOG, p, Math.PI / 2 - .35); apply(JOG, walk({ ...TP.stand, sp: [10, 0, 0], aL: [-30, 12, 0, 90], aR: [-30, 12, 0, 90] }, t * 13, 1.5), { t, seed: 9, face: t > tUp6 ? 'proud' : 'happy', look: CAMP });
  JOG.P.position.y = SW + Math.abs(Math.sin(t * 13)) * .06;
  const a = stepper(t, 71, [[tUp6, 72]]); card(JOG, { v: { ...JOG.v, ath: a.v }, pop: a.pop.map(x => ({ k: 'ath', ...x })), hl: 'ath' });
  crowd(t, 6, 1, -3);
}
function actTired(t) {
  reset();
  put(TIRED, TIP, -.15); const yawn = Math.max(0, Math.sin(seg(t, tSkip6, tDown6) * Math.PI));
  apply(TIRED, { ...TP.stand, hd: [-14 * yawn, 0, 6], aR: [-60, 12, 0, 110], aL: [-40 * yawn - 5, 30 * yawn, 0, 120 * yawn] }, { t, seed: 10, face: yawn > .3 ? 'shock' : 'deadpan', eyes: [0, -.5], look: CAMP });
  onHand(TIRED, CUP2, 0, [0, -.02, .05]);
  const h = stepper(t, 64, [[tDown6, 63]]); card(TIRED, { v: { ...TIRED.v, hp: h.v }, pop: h.pop.map(x => ({ k: 'hp', ...x })), hl: 'hp' });
}
function actMean(t) {
  reset(); crowd(t, 6, .8, -22, MEANP); clearAround(MEANP, 2.4, 1.6, 6);
  const mocking = t > tCruel7 - .35, stares = t > tEveryone7 - .2;
  put(MEAN, MEANP, face(MEANP, MLOW) - .5); apply(MEAN, mocking ? (stares ? TP.shrug : TP.point) : TP.stand, { t, seed: 17, face: mocking ? (stares ? 'worried' : 'laugh') : 'smug', look: stares ? CAMP : headOf(LOW) });
  put(LOW, MLOW, face(MLOW, MEANP) + .3); apply(LOW, { ...TP.stand, sp: [12, 0, 0], hd: [14, 0, 0] }, { t, seed: 13, face: 'worried', eyes: [0, -.6], look: MEANP.clone().add(V(0, .4, 0)) });
  // three bystanders turn to read his card
  [[LAU[0], P3(-22.0, -4.5)], [LAU[1], P3(-18.0, -4.3)], [HIGH, P3(-21.6, -6.6)]].forEach(([p, v], i) => { put(p, v, stares ? face(v, MEANP) : face(v, MEANP) + 1.4); apply(p, stares ? (i === 1 ? TP.cross : TP.stand) : walk(TP.stand, t * 6 + i, .5), { t, seed: 15 + i, face: stares ? (i === 1 ? 'deadpan' : 'shock') : 'happy', look: stares ? cardOf(MEAN) : CAMP }); card(p); });
  const eq = stepper(t, 66, [[tCruel7 + .2, 63], [tDrop7, 58]]);
  card(MEAN, { v: { ...MEAN.v, eq: eq.v }, hl: 'eq', pop: eq.pop.map(x => ({ k: 'eq', ...x })), s: stares ? 1 : .7 }); card(LOW);
}
function actStreet(t) {
  reset(); crowd(t, 12, 1, -14);
  [[CP[0], P3(-16.9, -6.7)], [CP[1], P3(-16.2, -6.6)], [LOW, P3(-10.6, -6.9)], [HIGH, P3(-13.2, -4.2)]].forEach(([p, v], i) => { put(p, v, i < 2 ? (i ? -1.2 : 1.2) : .3); apply(p, TP.stand, { t, seed: 11 + i, face: ['laugh', 'smile', 'deadpan', 'calm'][i], look: i < 2 ? headOf(i ? CP[0] : CP[1]) : CAMP }); card(p, { s: 1.3 }); });
}
function actCafe(t) {
  reset(); crowd(t, 6, 1, -30); clearAround(CAFEF, 2.6, 2.2, 6);
  const v = CAFEF.clone().add(V(1.4, 0, 1.2)), turned = t > t70_8 + .2; put(TIRED, v, turned ? .5 : Math.PI);
  apply(TIRED, turned ? TP.shrug : TP.stand, { t, seed: 10, face: turned ? 'worried' : 'happy', look: turned ? CAMP : CAFEF.clone().add(V(0, 1.6, 0)) });
  card(TIRED, { mini: 1, s: .9 }); badge(0, TIRED, 'EQ 60', 0, seg(t, t70_8 - .05, t70_8 + .25), .55);
}
function actGym(t) {
  reset(); crowd(t, 6, 1, -10); clearAround(GYMF, 2.8, 2.4, 6);
  const v = GYMF.clone().add(V(1.6, 0, .9)), turned = t > tStr9 + .35; put(LOW, v, turned ? .4 : Math.PI);
  apply(LOW, turned ? TP.shrug : { ...TP.stand, aR: [-80, 10, 0, 30] }, { t, seed: 13, face: turned ? 'worried' : 'happy', look: turned ? CAMP : GYMF.clone().add(V(0, 1.6, 0)) });
  card(LOW, { s: .9 }); badge(0, LOW, 'STR 38', 0, seg(t, tStr9 + .05, tStr9 + .35), .55);
}
function actBank(t) {
  reset(); crowd(t, 6, 1, 26); clearAround(BANKF, 3.2, 2.4, 6);
  const k = seg(t, tBank9 - .3, C.L10 + .2), v = BANKF.clone().add(V(lerp(.6, 3.2, k), 0, lerp(1.3, .8, k)));
  put(HIGH, v, lerp(Math.PI / 2, 2.6, k)); apply(HIGH, walk(TP.stand, t * 6.5, .9), { t, seed: 14, face: 'smug', look: CAMP }); card(HIGH, { s: .9 });
  const lo = BANKF.clone().add(V(-.6, 0, 1.4)); put(CP[0], lo, 2.6); apply(CP[0], t > t80_9 + .2 ? TP.shrug : TP.stand, { t, seed: 11, face: t > t80_9 + .2 ? 'worried' : 'calm', look: headOf(HIGH) }); card(CP[0], { s: .9 });
  badge(0, HIGH, 'OVR 80', 1, seg(t, t80_9 - .05, t80_9 + .25), .55); badge(1, CP[0], 'OVR 71', 0, seg(t, t80_9 + .15, t80_9 + .45), .55);
}
function actTerrace(t) {
  reset();
  const T0 = CITY.userData.tables[0].position, T1 = CITY.userData.tables[1].position;
  const a = T0.clone().add(V(-.62, 0, .22)), b = T0.clone().add(V(.62, 0, .22));
  put(CP[0], a, face(a, b)); put(CP[1], b, face(b, a));
  for (const [p, s] of [[CP[0], 11], [CP[1], 12]]) { apply(p, { ...TP.sit, y: -.05 }, { t, seed: s, face: 'laugh', look: headOf(p === CP[0] ? CP[1] : CP[0]) }); card(p); }
  const hp = T1.clone().add(V(.62, 0, .22)); put(HIGH, hp, -Math.PI / 2);
  const lowIn = eo(seg(t, tTen10 - .9, tTen10 - .2)), lp = T1.clone().add(V(lerp(-1.3, -.62, lowIn), 0, lerp(-1.5, .3, lowIn)));
  put(LOW, lp, face(lp, hp)); apply(LOW, lowIn < 1 ? walk(TP.stand, t * 7, .9) : (t > tAway10 - .1 ? TP.shrug : TP.wave), { t, seed: 13, face: t > tAway10 ? 'worried' : 'happy', look: headOf(HIGH) });
  const turned = t > tAway10 - .15; HIGH.P.rotation.y = turned ? .4 : -Math.PI / 2 - .4; HIGH.P.updateMatrixWorld(true);
  apply(HIGH, { ...TP.sit, y: -.05, aR: turned ? [-80, 30, 0, 20] : TP.sit.aR }, { t, seed: 14, face: turned ? 'deadpan' : 'calm', look: turned ? CAMP : headOf(LOW) });
  card(HIGH); card(LOW);
  linkAt(0, CP[0], CP[1], '3', 1, seg(t, tRule10 - .1, tRule10 + .2)); linkAt(1, LOW, HIGH, '35', 0, seg(t, tTen10 - .05, tTen10 + .25));
}
// --- 2 · the zero ---
function actTheo(t) {
  reset(); crowd(t, 8, 1, ST.cross - 4, THX); clearAround(THX, 1.3, 1.5, 8);
  put(THEO, THX, 0);
  const shrug = seg(t, tPainfully12 - .15, tPainfully12 + .2) * (1 - seg(t, tPainfully12 + .9, tPainfully12 + 1.2));
  const notEven = t > tNot14 - .1;
  apply(THEO, mix(TP.stand, TP.shrug, eo(shrug)), { t, seed: 1, face: shrug > .3 ? 'deadpan' : notEven ? 'happy' : t > T11[0][1] ? 'smile' : 'happy', look: notEven ? CROWD[0].P.position.clone().add(V(0, 1.9, 0)) : CAMP });
  const said = T11.filter(([k, x]) => t >= x - .05).map(([k]) => k), hl = t < C.L12 && said.length ? said[said.length - 1] : t >= tGrey13 - .3 && t < C.L14 + .6 ? 'pot' : null;
  card(THEO, { hl: hl === 'ovr' ? null : hl, show: t < T11[0][1] - .1 ? 0 : 1 });
}
function actLove(t) {
  reset();
  put(THEO, THX, 0); apply(THEO, TP.stand, { t, seed: 1, face: t > tCity16 ? 'worried' : 'happy', look: MIAX(t).add(V(0, 1.3, 0)), noBlink: 1 }); card(THEO, { s: t < C.L16 ? .8 : 1.1, mini: t >= C.L16 });
  const m = MIAX(t); put(MIA, m, 3.4); apply(MIA, walk(TP.stand, t * 6.5, .8), { t, seed: 4, face: 'smile', look: CAMP.clone().add(V(-.9, 0, 0)) }); onHand(MIA, CUP, 1, [0, -.02, .05]);
  const said = T15.filter(([k, x]) => t >= x - .05).map(([k]) => k);
  card(MIA, { s: t < C.L16 ? .8 : 1.1, mini: t >= C.L16, hl: said.length && said[said.length - 1] !== 'ovr' ? said[said.length - 1] : null });
  if (t >= tCity16 - .1) {   // two passers-by read the numbers and crack up
    LAU.forEach((p, i) => { const v = P3(ST.cross - 4.4 + i * .7, -5.5 + i * .2); put(p, v, face(v, THX) - (i ? .3 : -.3)); apply(p, t > tCrush16 ? (i ? TP.cheer : TP.point) : TP.stand, { t, seed: 15 + i, face: t > tJoke16 - .25 ? 'laugh' : 'smug', look: THX.clone().add(V(0, 1.3, 0)) }); card(p); });
  }
}
function actSink(t) {
  reset();
  put(THEO, THB, 0); apply(THEO, { ...TP.slump, sp: [12, 0, 0], y: -.06, hd: [-2, 0, 0] }, { t, seed: 1, face: 'worried', eyes: [0, -.7], look: BEN.clone().add(V(.4, .3, 1.2)) });
  const m = stepper(t, 61, [[t61_17, 61], [t52_17, 52], [t44_17, 44]]);
  card(THEO, { v: { ...THEO.v, mh: m.v, ovr: t >= t44_17 ? 49 : t >= t52_17 ? 50 : 52 }, hl: 'mh', pop: m.pop.filter(p => p.d).map(x => ({ k: 'mh', ...x })), s: t >= tNobody18 - .1 ? .6 : 1 });
  // thousands walked past: the crowd streams by fast, glancing at his number
  crowd(t * (t > tThousands18 - .2 ? 2.6 : 1), 12, 1, ST.bench, THB);
}
function actMeet(t) {
  reset();
  const sitK = eo(seg(t, tSat19 - .05, tSat19 + .45)), sitting = sitK >= 1;
  const laughs = L20L, laughing = laughs.some(x => t > x - .1 && t < x + .45);
  put(THEO, THB, 0);
  const sat = t > tOkay19 + .2;
  apply(THEO, sat ? { ...TP.sit, y: -.06 } : { ...TP.slump, sp: [12, 0, 0], y: -.06, hd: [-2 - 14 * seg(t, tOkay19 - .3, tOkay19), 0, 0] }, { t, seed: 1, face: sat ? (laughing ? 'laugh' : 'happy') : t > tOkay19 - .2 ? 'shock' : 'worried', look: headOf(MIA), talk: t >= C.L20 && !laughing ? .3 + .3 * Math.sin(t * 17) : 0 });
  if (sitK <= 0) { const k = eo(seg(t, C.L19 - .3, tStopped19)), p = BEN.clone().add(V(lerp(-2.6, -.25, k), 0, lerp(.9, .72, k))); put(MIA, p, face(p, THB)); apply(MIA, k < 1 ? walk(TP.stand, t * 6.5, .8) : { ...TP.stand, sp: [18, 0, 0], hd: [12, 0, 0], aL: [-30, 10, 0, 20] }, { t, seed: 4, face: 'worried', look: headOf(THEO) }); }
  else { const p0 = BEN.clone().add(V(-.25, 0, .72)); put(MIA, p0.lerp(MIB, sitK), lerp(face(p0, THB), .25, sitK)); apply(MIA, sitting ? (laughing ? { ...TP.sitLaugh, y: -.06 } : { ...TP.sit, y: -.06 }) : mix(TP.stand, { ...TP.sit, y: -.06 }, sitK), { t, seed: 4, face: laughing ? 'laugh' : t < C.L20 ? 'worried' : 'smile', look: headOf(THEO), talk: t > tOkay19 - .45 && t < tOkay19 + .3 ? .5 : 0 }); }
  const m = stepper(t, 44, laughs.map((x, i) => [x + .05, 45 + i]));
  card(THEO, { v: { ...THEO.v, mh: m.v, ovr: 49 }, hl: 'mh', pop: m.pop.map(x => ({ k: 'mh', ...x })), s: .78 }); card(MIA, { s: .5, mini: 1 });
}
function actHeart(t) {
  reset();
  put(THEO, THB, -.35); put(MIA, MIB, .35);
  const lookin = t > tLook21 - .2, burst = t > tPercent22 + .25;
  apply(THEO, burst ? { ...TP.sitLaugh, y: -.06 } : { ...TP.sit, y: -.06 }, { t, seed: 1, face: burst ? 'laugh' : t > tZero22 ? 'shock' : 'smile', look: lookin ? headOf(MIA) : CAMP });
  apply(MIA, burst ? { ...TP.sitLaugh, y: -.06 } : { ...TP.sit, y: -.06 }, { t, seed: 4, face: burst ? 'laugh' : t > tZero22 ? 'shock' : 'smile', look: lookin ? headOf(THEO) : CAMP });
  const hs = seg(t, tAppears21 - .1, tAppears21 + .3);
  const spin = t < tZero22 - .02 ? (Math.floor(hash(Math.floor(t * 14)) * 99) + 1) + '%' : '0%';
  if (hs > 0) { HEART.visible = true; HEART.userData.cs = { st: { pct: t < tZero22 ? 60 : 0, fill: t < tZero22 ? .5 + .5 * Math.sin(t * 9) ** 2 : 1, crack: seg(t, tZero22 + .05, tZero22 + .35), show: hs, txt: spin }, at: headOf(THEO).lerp(headOf(MIA), .5).add(V(0, .42, .1)), s: 1 }; }
  card(THEO, { s: .45, mini: 1 }); card(MIA, { s: .45, mini: 1 });
}
function actKaiIn(t) {
  reset();
  const k = eo(seg(t, tStanding22 - .5, t97_22 - .6)), kp = KAIX.clone().add(V(lerp(-2.2, 0, k), 0, 0));
  put(KAI, kp, face(kp, MIAS)); apply(KAI, k < 1 ? walk(TP.stand, t * 6, .8) : TP.hips, { t, seed: 6, face: 'smug', look: t > t97_22 + .3 ? CAMP : headOf(MIA) });
  const up = eo(seg(t, tStanding22, tStanding22 + .45)); put(MIA, MIB.clone().lerp(MIAS, up), lerp(.35, face(MIAS, KAIX), up));
  apply(MIA, up < 1 ? mix({ ...TP.sit, y: -.06 }, TP.stand, up) : TP.stand, { t, seed: 4, face: 'calm', look: headOf(KAI) });
  put(THEO, THB, -.2); apply(THEO, { ...TP.slump, y: -.06 }, { t, seed: 1, face: 'worried', look: headOf(MIA), eyes: [-.3, -.4] });
  const hs = seg(t, t97_22 - .7, t97_22 - .45), fill = seg(t, t97_22 - .45, t97_22 + .05);
  if (hs > 0) { HEART.visible = true; HEART.userData.cs = { st: { pct: 97, fill, glow: fill, show: hs }, at: headOf(KAI).lerp(headOf(MIA), .5).add(V(0, .5, .2)), s: 1.1 }; }
  kaiCard({ s: .7 }); card(MIA, { s: .45, mini: 1 }); card(THEO, { s: .45, mini: 1 });
}
function actStrut(t) {
  reset();
  const p = KW(t); put(KAI, p, Math.PI / 2 + .25); apply(KAI, walk({ ...TP.stand, sp: [-6, 0, 0], hd: [-6, 0, 0] }, t * 3.2, .9), { t, seed: 6, face: 'smug', look: CAMP });
  const hl = t > tTwo23 - .1 ? null : t > tAth23 - .1 ? 'ath' : t > tStr23 - .1 ? 'str' : null;
  kaiCard({ hl, s: t < C.L24 ? .9 : .75 });
  if (t >= C.L24) {   // a 72 holds out his hand; Kai sails past it
    const sp = P3(-1.3, -6.2); put(SHAKE, sp, face(sp, p)); const offered = t > tShake24 - .4;
    apply(SHAKE, offered ? { ...TP.offer, aR: [-82, 6, 0, 12] } : TP.stand, { t, seed: 31, face: t > t80_24 ? 'worried' : 'happy', look: headOf(KAI) }); card(SHAKE, { s: 1.2 });
    KAI.P.rotation.y = Math.PI / 2 + .1; apply(KAI, walk({ ...TP.stand, sp: [-6, 0, 0], hd: [-6, -25, 0], aL: [-40, 50, 0, 60] }, t * 3.2, .9), { t, seed: 6, face: 'smug', look: CAMP });
  }
}
function actKaiCard(t) {
  reset();
  const p = KW(tEQ24); put(KAI, p, .2); apply(KAI, TP.hips, { t, seed: 6, face: 'smug', look: CAMP });
  kaiCard({ hl: t > tLine24 - .2 ? 'mh' : 'eq', s: 1 });
}
function actPrivacy(t) {
  reset(); crowd(t, 6, 1, ST.privacy); clearAround(PRV, 2.2, 2.2, 6);
  const k = eo(seg(t, C.L25, C.L25 + 1.6)), p = PRV.clone().add(V(lerp(0, -.9, k), 0, lerp(-.3, 1.0, k)));
  put(KAI, p, lerp(.3, -.4, k)); apply(KAI, walk(TP.stand, t * 6, .8), { t, seed: 6, face: 'smug', look: CAMP }); onHand(KAI, BAG, 0, [0, -.05, .04]);
  kaiCard({ s: .62, hl: 'mh' });
}
// --- 3 · the ranking ---
function actRank(t) {
  reset(); STAD.userData.cheer(t, .4);
  const red = STAD.userData.tally; red.scale.setScalar(1.8); red.material.color.set(Math.sin(t * 6) > 0 ? '#FF2A2A' : '#5A1010');
  const gc = STAD.userData.trophy.children[1]; if (gc) gc.rotation.y = Math.PI / 2 + Math.sin(t * .8) * .25;
}
function actSign(t) {
  reset(); STAD.userData.cheer(t, t >= tWhole28 - .1 ? 1 : .5);
  if (t < tWhole28 - .1) {   // Theo signs; the clerk reads his 52 out loud
    const reading = t > tClerk28 && t < t52_28 + .5;
    put(THEO, DESK.clone().add(V(0, 0, .75)), Math.PI); apply(THEO, t < tClerk28 - .1 ? { ...TP.stand, sp: [18, 0, 0], hd: [14, 0, 0], aR: [-60, 6, 0, 56] } : TP.stand, { t, seed: 1, face: t > t52_28 + .2 ? 'worried' : 'proud', look: t < tClerk28 - .1 ? DESK.clone().add(V(.3, .8, 0)) : headOf(CLERK), eyes: t < tClerk28 - .1 ? [0, -.6] : undefined });
    if (t < tClerk28 - .1) onHand(THEO, PEN, 0, [0, -.04, .05], [.5, 0, 0]);
    put(CLERK, DESK.clone().add(V(-.4, 0, -.55)), .15); apply(CLERK, reading ? { ...TP.stand, aR: [-150, 10, 0, 30] } : TP.stand, { t, seed: 32, face: t > tSigns28 + .2 ? 'smug' : 'calm', look: reading ? CAMP : headOf(THEO).add(V(0, .6, 0)), talk: reading ? clamp(.5 + .5 * Math.sin(t * 18)) : 0 });
    card(THEO, { s: .7, hl: t > t52_28 - .1 ? null : null }); card(CLERK); return;
  }
  FAN.forEach((p, i) => { const v = SP(-16.4 - i * .55, 5.55 + (i - 1) * .75); put(p, v, face(v, SP(-44, 0, 0)) + (i - 1) * .35); apply(p, i === 1 ? TP.point : TP.cheer, { t, seed: 50 + i, face: 'laugh', look: SP(-44, 0, 12) }); card(p); });
}
function actRace(t) {
  reset(); STAD.userData.cheer(t, 1);
  const x = RX(t), lanes = SD.lanes;
  const gone = t >= tLot29 - .1;   // the leaders are long past the line
  put(KAI, SP(gone ? 40 : x, lanes[2]), Math.PI / 2); apply(KAI, walk({ ...TP.stand, sp: [12, 0, 0], aL: [-30, 12, 0, 90], aR: [-30, 12, 0, 90] }, t * 14, 1.6), { t, seed: 6, face: t > tSweat29 - .3 ? 'smug' : 'calm', look: CAMP }); KAI.P.position.y = SO.y + Math.abs(Math.sin(t * 14)) * .07;
  kaiCard({ s: .6 });
  RUN.forEach((p, i) => { const rx = gone ? 40 : x - 1.4 - i * .9 - Math.sin(t * 3 + i) * .2; put(p, SP(rx, lanes[[0, 1, 3, 4][i]]), Math.PI / 2); apply(p, walk({ ...TP.stand, sp: [12, 0, 0], aL: [-30, 12, 0, 90], aR: [-30, 12, 0, 90] }, t * 14 + i, 1.5), { t, seed: 40 + i, face: 'angry', look: CAMP }); card(p, { s: .9 }); });
  const tp = SP(THX29(t), lanes[4] + .2);
  put(THEO, tp, Math.PI / 2 - .1); apply(THEO, walk({ ...TP.stand, sp: [24, 0, 0], hd: [8, 0, 0], aL: [-10, 18, 0, 30], aR: [-10, 18, 0, 30] }, t * 9, 1.0), { t, seed: 1, face: 'worried', look: CAMP }); card(THEO, { s: .7, mini: 1 });
  TAPE.visible = true; TAPE.position.copy(SP(SD.finish, 21, 1.15)); TAPE.rotation.set(0, 0, 0);
  if (x > SD.finish - .3) { TAPE.position.x = SO.x + SD.finish + Math.min(.8, (x - SD.finish) * .3); TAPE.scale.z = .4; } else TAPE.scale.z = 1;
}
function actPuzzle(t) {
  reset(); STAD.userData.cheer(t, t > tSecond31 ? .9 : .5);
  const order = [RUN[0], RUN[1], THEO, KAI, RUN[2]];
  order.forEach((p, i) => { const [dx, dz] = SD.desks[i], v = SP(dx, dz + .65); put(p, v, Math.PI); const k = Math.sin(t * (5 + i)) * .5 + .5;
    apply(p, { ...TP.stand, sp: [16, 0, 0], hd: [18, 0, 0], aL: [-62 - 10 * k, 12, 0, 70], aR: [-62 - 10 * (1 - k), 12, 0, 70] }, { t, seed: 40 + i, face: p === THEO ? (t > t106 ? 'proud' : 'deadpan') : 'angry', look: SP(dx, dz, .9), eyes: [0, -.6] });
    STAD.userData.desks[i].userData.blocks.forEach((b, j) => { const up = seg(t, C.L30 + .2 + j * .6 + i * .13, C.L30 + .5 + j * .6 + i * .13); b.position.set(-.4 + (j % 3) * .18 + up * (.4 - (j % 3) * .18), .83 + up * (j * .14), -.15 + Math.floor(j / 3) * .2 - up * (Math.floor(j / 3) * .2 - .15)); });
    if (p !== THEO && p !== KAI) card(p, { s: .8 }); });
  const iq = stepper(t, 104, [[t104, 104], [t105, 105], [t106, 106]]);
  card(THEO, { v: { ...THEO.v, iq: iq.v }, hl: t > tClimbing30 - .2 ? 'iq' : null, pop: iq.pop.filter(p => p.d).map(x => ({ k: 'iq', ...x })), s: .7 });
  kaiCard({ s: .6 });
}
function actQuiet(t) {
  reset(); STAD.userData.cheer(t, .05);
  [FAN[0], MIA, FAN[2]].forEach((p, i) => { const v = SP(-16.4 - i * .55, 5.55 + (i - 1) * .75); put(p, v, face(v, SP(-44, 0, 0)) + (i - 1) * .35);
    apply(p, i === 1 ? { ...TP.stand, aL: [-60, -10, 0, 120], aR: [-60, -10, 0, 120] } : (i ? TP.cross : TP.stand), { t, seed: 50 + i, face: i === 1 ? 'smile' : i ? 'deadpan' : 'shock', look: SP(-44, 0, 12) }); card(p, { mini: 1 }); });
}
function actHost(t) {
  reset(); STAD.userData.cheer(t, .6);
  const p = STAD.userData.podium.getWorldPosition(V()); put(HOST, p.clone().add(V(-.15, 0, .55)), Math.PI / 2 + .3);
  apply(HOST, TP.speech ?? TP.wave, { t, seed: 30, face: 'happy', look: CAMP, talk: .5 + .5 * Math.sin(t * 20) }); onHand(HOST, MIC, 0, [0, .02, .06], [-.4, 0, 0]); card(HOST);
}
function actPair(t) {
  reset(); STAD.userData.cheer(t, t < tDrop34 ? .8 : .2);
  const tp = SP(.65, 0), kp = SP(-.45, -.2); put(THEO, tp, -Math.PI / 2 - .4); put(KAI, kp, -Math.PI / 2 + .3);
  const look2 = t > tKai33 + .3;
  apply(THEO, TP.stand, { t, seed: 1, face: t > tKai33 ? 'shock' : 'worried', look: look2 ? headOf(KAI) : SP(-44, 0, 13) });
  apply(KAI, t > tLights34 ? TP.stand : TP.cross, { t, seed: 6, face: t > tLights34 + .2 ? 'shock' : t > tKai33 ? 'angry' : 'smug', look: look2 ? (t > tLights34 ? CAMP : headOf(THEO)) : SP(-44, 0, 13) });
  GLITCH = t >= tDrop34 - .05 && t < tDrop34 + .5 ? 1 - (t - tDrop34 + .05) / .55 : 0;
  const rev = t >= tLights34 - .05;
  card(THEO, { s: t < tBlank34 - .1 ? .6 : .45 });
  kaiCard({ hide: rev ? [] : ['mh'], hl: rev ? 'mh' : null, v: { ...KAI.v, mh: 12 }, s: t < tBlank34 - .1 ? .6 : 1, flash: rev ? (Math.sin(t * 14) > 0 ? 1 : 0) : 0 });
  // every pill in the stands flickers
  const pill = STAD.userData.crowd.pill; pill.visible = !(t > tDrop34 - .05 && t < tBlank34 && hash(Math.floor(t * 18)) < .45);
}
function actExposed(t) {
  reset(); STAD.userData.cheer(t, .15);
  const red = STAD.userData.tally; red.scale.setScalar(2.4); red.material.color.set(Math.sin(t * 6) > 0 ? '#FF2A2A' : '#5A1010');
  const tp = SP(.65, 0), kp = SP(-.45, -.2), back_ = t >= tThats35 - .1;
  put(THEO, tp, -Math.PI / 2 - .4); put(KAI, kp, back_ ? -Math.PI / 2 + .3 : -Math.PI / 2);
  apply(THEO, TP.stand, { t, seed: 1, face: 'worried', look: back_ ? SCR : headOf(KAI) });
  apply(KAI, TP.stand, { t, seed: 6, face: t > tIts35 ? 'worried' : 'shock', look: back_ ? SCR : t > tIts35 ? SP(-3, -.3, .6) : CAMP, eyes: t > tIts35 && !back_ ? [0, -.5] : undefined });
  card(THEO, { s: back_ ? .7 : .45, mini: !back_ ? 1 : 1 });
  card(KAI, { v: { ...KAI.v, mh: 12 }, hl: 'mh', flash: Math.sin(t * 12) > 0 ? 1 : 0, s: back_ ? .7 : 1 });
}
// --- 4 · the wall (on the ground) ---
function actWatch(t) {
  reset(); STAD.userData.cheer(t, .05);
  [FAN[0], MIA, FAN[2]].forEach((p, i) => { const v = SP(-16.4 - i * .55, 5.55 + (i - 1) * .75); put(p, v, face(v, SP(-44, 0, 0)) + (i - 1) * .35);
    apply(p, i === 1 ? { ...TP.stand, aL: [-60, -10, 0, 120], aR: [-60, -10, 0, 120] } : TP.stand, { t, seed: 50 + i, face: 'worried', look: SP(-44, 0, 12) }); card(p, { mini: 1 }); });
}
function actJudges(t) {
  reset(); STAD.userData.cheer(t, .3);
  const j = JT();
  JUD.forEach((p, i) => { put(p, j.clone().add(V(-.85, .04, i - 1)), Math.PI / 2); const lift = i === 1 && t > tReveal43 - .3;
    apply(p, lift ? { ...TP.sit, y: -.06, aR: [-150, 10, 0, 30] } : { ...TP.sit, y: -.06, aL: [-62, 8, 0, 70], aR: [-62, 8, 0, 70] }, { t, seed: 60 + i, face: lift ? 'smile' : 'deadpan', look: CAMP });
    if (lift) onHand(p, ENV, 0, [0, -.12, .06], [0, Math.PI / 2, 0]); card(p, { s: .9 }); });
  const p = STAD.userData.podium.getWorldPosition(V()); put(HOST, p.clone().add(V(-.15, 0, .55)), Math.PI / 2 + .3);
  apply(HOST, TP.speech ?? TP.wave, { t, seed: 30, face: 'happy', look: CAMP }); card(HOST);
}
function actResult(t) {
  reset(); STAD.userData.cheer(t, 1);
  if (t >= tAnd45 - .1) {   // the front row reads the small grey number
    [FAN[0], MIA, FAN[2]].forEach((p, i) => { const v = SP(-16.4 - i * .55, 5.55 + (i - 1) * .75); put(p, v, face(v, SP(-44, 0, 0)) + (i - 1) * .35);
      apply(p, i === 0 ? TP.point : TP.cheer, { t, seed: 50 + i, face: i === 1 ? 'laugh' : 'shock', look: SP(-44, 0, 12) }); card(p, { mini: 1 }); });
    return;
  }
  const kp = STG.clone().add(V(1.7, 0, -1.0)), tp = STG.clone().add(V(1.7, 0, .9));
  put(KAI, kp, Math.PI / 2); put(THEO, tp, Math.PI / 2);
  const off = t > tAfternoon44 - .05; KAI.face.glasses = off ? null : 'shades';
  apply(KAI, off ? TP.stand : TP.cross, { t, seed: 6, face: t > tAfternoon44 ? 'smile' : 'calm', look: CAMP });
  const k = KEQ(t); card(KAI, { v: kaiV(t), hl: t < tTheos44 - .1 ? 'eq' : null, pop: k.pop.map(x => ({ k: 'eq', ...x })), s: t < tTheos44 - .1 ? 1 : .5, mini: t >= tTheos44 - .1 });
  const th = theoV(t);
  apply(THEO, t > tGold45 ? TP.cheer : TP.stand, { t, seed: 1, face: t > tGold45 + .2 ? 'laugh' : t > tGold45 - .1 ? 'shock' : 'happy', look: CAMP });
  card(THEO, { v: th.v, pop: th.pop, gold: th.gold, s: t < C.L45 ? 1 : .8, show: 1 });
}
// --- 5 · the point ---
function actNight(t) {
  reset(); KAI.face.glasses = null;
  const mp = MW(t), arrived = t > tStands46;
  put(KAI, KN, face(KN, mp)); apply(KAI, TP.stand, { t, seed: 6, face: t > t97_46 + .5 ? 'smile' : 'calm', look: headOf(MIA) });
  put(THEO, TN, face(TN, mp) + (arrived ? .9 : 0)); apply(THEO, t > tPoint47 - .1 ? { ...TP.stand, aR: [-35, 10, 0, 20] } : TP.stand, { t, seed: 1, face: t > tNothing47 ? 'laugh' : arrived ? 'happy' : 'worried', look: headOf(MIA) });
  put(MIA, mp, !arrived ? face(mp, TN) : face(mp, TN) - .9);
  apply(MIA, !arrived ? walk(TP.stand, t * 7.5, .9) : t > tPoint47 - .1 ? { ...TP.stand, aL: [-35, 10, 0, 20] } : TP.stand, { t, seed: 4, face: t > tNothing47 ? 'laugh' : arrived ? 'smile' : 'calm', look: arrived ? headOf(THEO) : t > t97_46 - .6 && t < t97_46 + .2 ? headOf(KAI) : headOf(THEO) });
  const hs = seg(t, t97_46 - .45, t97_46 - .25) * (1 - seg(t, t97_46 + .35, t97_46 + .6));
  if (hs > 0 && t < tStands46) { HEART.visible = true; HEART.userData.cs = { st: { pct: 97, fill: seg(t, t97_46 - .3, t97_46 + .05), glow: .6, show: hs }, at: headOf(KAI).lerp(headOf(MIA), .5).add(V(0, .55, .1)), s: .9 }; }
  if (t > tZero46 - .2) { const glow = seg(t, tThey47, tPoint47); HEART.visible = true; HEART.userData.cs = { st: { pct: 0, fill: 1, glow, show: seg(t, tZero46 - .2, tZero46 + .05) }, at: headOf(THEO).lerp(headOf(MIA), .5).add(V(0, .5, .05)), s: t >= C.L47 ? .5 : .75 }; }
  const tv = theoV(1e9); const mhp = t > tNothing47 && t < tNothing47 + 1 ? [{ k: 'mh', d: 1, a: (t - tNothing47) / .9 }] : [];
  card(THEO, { v: { ...tv.v, mh: t > tNothing47 ? 87 : 86 }, gold: 1, pop: mhp, s: t < C.L47 ? .7 : .42, mini: t < C.L47 });
  card(MIA, { s: t < C.L47 ? .7 : .42, mini: t < C.L47 });
  card(KAI, { v: kaiV(1e9), s: .7, mini: 1 });
}
function actKaiAfter(t) {
  reset(); KAI.face.glasses = null;
  const v = { ...KAI.v, eq: 59, mh: 71, ovr: 94 };
  if (t < tMental48 - .1) {   // out of the PRIVACY+ door, empty-handed
    crowd(t, 6, 1, ST.privacy); clearAround(PRV, 2.2, 2.2, 6);
    const k = eo(seg(t, C.L48, C.L48 + 1.6)), p = PRV.clone().add(V(lerp(0, -.9, k), 0, lerp(-.3, 1.0, k)));
    put(KAI, p, lerp(.3, -.2, k)); apply(KAI, k < 1 ? walk(TP.stand, t * 6, .8) : TP.hips, { t, seed: 6, face: 'smile', look: CAMP });
    card(KAI, { v, s: .62, hl: t > tCancelled48 ? 'mh' : null }); badge(0, KAI, 'PRIVACY+', 0, seg(t, tCancelled48 - .05, tCancelled48 + .25), 1.35);
    return;
  }
  const p = KWALK(t); crowd(t, 10, 1, p.x - 2, p); clearAround(p, 1.4, 1.2, 10);
  put(KAI, p, -Math.PI / 2 + .25); apply(KAI, t > t71 - .25 ? TP.stand : walk(TP.stand, t * 6.5, .85), { t, seed: 6, face: 'smile', look: CAMP });
  // two passers-by notice his number, and smile
  [[LAU[0], P3(p.x - 1.5, -6.7)], [HIGH, P3(p.x - 2.3, -7.0)]].forEach(([q, w0], i) => { put(q, w0, face(w0, p)); apply(q, i ? TP.wave : TP.stand, { t, seed: 15 + i * 3, face: 'smile', look: cardOf(KAI) }); card(q); });
  card(KAI, { v, s: t > t71 - .25 ? 1 : .7, hl: 'mh', pop: t > t71 - .05 && t < t71 + .9 ? [{ k: 'mh', d: 59, a: (t - t71 + .05) / .9 }] : [] });
}
function actOld(t) {
  reset();
  put(OLDT, THB, -.3); put(OLDM, MIB, .3); show(CANE); CANE.position.copy(THB).add(V(.62, 0, .18)); CANE.rotation.set(0, 0, .22);
  const lean = { sp: [-2, 0, 0] }, laugh = t > tLaughs51 - .1 && t < tLaughs51 + 1.6;
  apply(OLDT, { ...TP.sit, ...lean, y: -.06, aR: [-28, 38, 0, 16], aL: [-30, 20, 0, 60] }, { t, seed: 1, face: t > tZero50 || laugh ? 'laugh' : 'smile', look: headOf(OLDM) });
  apply(OLDM, laugh ? { ...TP.sitLaugh, ...lean, y: -.06 } : { ...TP.sit, ...lean, y: -.06, aL: [-28, 38, 0, 16], aR: [-30, 20, 0, 60] }, { t, seed: 4, face: t > tZero50 - .2 || laugh ? 'laugh' : 'smile', look: headOf(OLDT) });
  const full = (t >= tMental50 - .1 && t < C.L52 + .5);
  // every time she laughs, his number tries for 101… and stays 100
  const tries = t > tUp51 - .1 && t < tUp51 + .9 ? [{ k: 'mh', d: 1, a: (t - tUp51 + .1) / .9 }] : [];
  card(OLDT, { gold: 1, hl: full ? 'mh' : null, s: full ? .55 : .5, mini: !full, pop: tries });
  card(OLDM, { hl: full ? 'mh' : null, s: full ? .55 : .5, mini: !full });
  if (t >= C.L50 && t < tMental50 - .1) { HEART.visible = true; HEART.userData.cs = { st: { pct: 0, fill: 1, glow: 1, show: seg(t, C.L50, C.L50 + .25) }, at: headOf(OLDT).lerp(headOf(OLDM), .5).add(V(0, .42, .1)), s: .55 }; }
}

// ---------------- the giant screen ----------------
function screenState(t) {
  if (t < C.L4) return { mode: 'mh', v: HOOK.mh };
  if (t < C.L27) return t > tLive26 - .2 ? { mode: 'rounds' } : { mode: 'logo' };
  if (t < C.L28) return { mode: 'rounds' };
  if (t < C.L29) return t > tClerk28 ? { mode: 'laugh' } : { mode: 'rounds' };
  if (t < C.L30) return { mode: 'race', k: seg(t, tSweat29 - .6, tLast29 + .3) };
  if (t < C.L32) return { mode: 'puzzle', iq: t >= t106 ? 106 : t >= t105 ? 105 : 104, second: t >= tSecond31 - .1 };
  if (t < C.L33) return { mode: 'final', a: t > tPartners32 - .2, b: t > tSwitched32 - .2 };
  if (t < C.L35) return { mode: 'slot', land: t >= tKai33 - .05, n: Math.floor(t * 12), off: t >= tDrop34 - .05 };
  if (t < C.L36) return { mode: 'exposed', f: Math.sin(t * 12) > 0 ? 1 : 0 };
  if (t < C.L43) return { mode: 'mh', v: MH(t).v };
  if (t < C.L44) return { mode: 'scoring', a: t > tNot43 - .1, b: t > tBy43 - .1 };
  if (t < tTheos44 - .1) return { mode: 'kaieq', v: KEQ(t).v };
  return { mode: 'potential' };
}
function drawScreen(st) {
  const S = STAD.userData.screen, key = JSON.stringify(st); if (key === S.key) return; S.key = key; const g = S.ctx, w = 1280, h = 720;
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#1E2238'); bg.addColorStop(1, '#0E1018'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const T = (txt, y, size, col = '#FFFFFF', x = w / 2) => { g.font = `900 ${size}px Montserrat`; g.fillStyle = col; g.fillText(txt, x, y); };
  const pill = (x, y, n, r = 80, col) => { g.fillStyle = col ?? tier(n); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = '#16131A'; g.font = `900 ${r}px Montserrat`; g.fillText(String(n), x, y + 6); };
  const live = () => { g.fillStyle = '#E8423A'; g.beginPath(); g.arc(548, 66, 22, 0, 7); g.fill(); T('LIVE', 70, 58, '#E8423A', 664); };
  const mhCol = v => v >= 65 ? '#C8E04A' : v >= 45 ? '#FF9A2A' : '#E8423A';
  if (!st || st.mode === 'logo') { g.fillStyle = '#FFC83A'; g.beginPath(); g.roundRect(240, 160, 800, 400, 60); g.fill(); g.fillStyle = '#16131A'; g.beginPath(); g.roundRect(260, 180, 760, 360, 50); g.fill(); T('THE', 280, 90, '#FFC83A'); T('RANKING', 420, 170, '#FFFFFF'); }
  else if (st.mode === 'rounds') { live(); T('3 ROUNDS', 185, 100, '#FFC83A'); ['RACE', 'PUZZLE', 'FINAL'].forEach((r, i) => { const x = 420 + i * 220; g.fillStyle = '#2E3248'; g.beginPath(); g.roundRect(x - 100, 280, 200, 200, 26); g.fill(); T(String(i + 1), 350, 84, '#FFC83A', x); T(r, 440, 40, '#FFFFFF', x); }); }
  else if (st.mode === 'laugh') { pill(640, 200, 52, 120); T('THEO', 390, 120, '#FFFFFF'); T('JOINED', 505, 70, '#FF9A2A'); T('HA HA HA', 625, 56, '#C8CCE0'); }
  else if (st.mode === 'race') { T('ROUND 1 · RACE', 90, 58, '#FFC83A'); [['KAI', 94], ['RUNNER', 88], ['RUNNER', 86], ['RUNNER', 83], ['RUNNER', 79], ['THEO', 52]].forEach(([n, v], i) => { const y = 190 + i * 88, a = st.k * 6 - i; if (a <= 0) return; g.globalAlpha = Math.min(1, a); T(`${i + 1}.`, y, 60, '#C8CCE0', 440); g.textAlign = 'left'; g.font = '900 60px Montserrat'; g.fillStyle = n === 'THEO' ? '#FF9A2A' : n === 'KAI' ? '#FFC83A' : '#FFFFFF'; g.fillText(n, 500, y); g.textAlign = 'center'; g.globalAlpha = 1; }); }
  else if (st.mode === 'puzzle') { T('ROUND 2 · PUZZLE', 90, 54, '#FFC83A'); T('THEO · IQ', 260, 80, '#FFFFFF'); T(String(st.iq), 430, 220, '#4ADB6A'); if (st.second) { g.fillStyle = '#C8CCE0'; g.beginPath(); g.roundRect(390, 560, 500, 110, 30); g.fill(); T('2ND PLACE', 617, 70, '#16131A'); } }
  else if (st.mode === 'final') { T('THE FINAL', 150, 112, '#FFC83A'); if (st.a) { T('PARTNERS:', 300, 70, '#FFFFFF'); T('RANDOM', 385, 70, '#FFFFFF'); } if (st.b) { g.fillStyle = '#E8423A'; g.beginPath(); g.roundRect(330, 470, 620, 120, 30); g.fill(); T('ALL FILTERS: OFF', 532, 58, '#FFFFFF'); } }
  else if (st.mode === 'slot') { T('PARTNERS', 90, 64, '#FFC83A'); const names = ['MIA', 'RUNNER', 'KAI', 'THEO', 'HOST', 'ZOE', 'MAX'];
    const a = st.land ? 'THEO' : names[st.n % names.length], b = st.land ? 'KAI' : names[(st.n * 3 + 2) % names.length];
    T(a, 235, 116, '#FFFFFF'); T('+', 345, 84, '#FFC83A'); T(b, 455, 116, '#FFFFFF'); if (st.land) { g.strokeStyle = '#FFC83A'; g.lineWidth = 12; g.beginPath(); g.roundRect(330, 160, 620, 370, 40); g.stroke(); }
    if (st.off) { g.fillStyle = '#E8423A'; g.beginPath(); g.roundRect(340, 565, 600, 110, 30); g.fill(); T('FILTERS OFF', 622, 66, '#FFFFFF'); } }
  else if (st.mode === 'exposed') { live(); pill(640, 225, 94, 100); T('KAI', 395, 100, '#FFC83A'); g.fillStyle = st.f ? '#E8423A' : '#8A1E1E'; g.beginPath(); g.roundRect(330, 480, 620, 150, 30); g.fill(); T('MENTAL HEALTH', 525, 46, '#FFFFFF'); T('12', 590, 70, '#FFFFFF'); }
  else if (st.mode === 'mh') { live(); T('KAI · MENTAL HEALTH', 170, 56, '#C8CCE0'); T(String(st.v), 400, 300, mhCol(st.v)); }
  else if (st.mode === 'scoring') { T('THE FINAL WAS SCORED', 80, 50, '#FFC83A');
    if (st.a) { T('NOT BY TIME', 175, 70, '#C8CCE0'); g.strokeStyle = '#E8423A'; g.lineWidth = 14; g.beginPath(); g.moveTo(420, 175); g.lineTo(860, 175); g.stroke(); }
    if (st.b) { g.fillStyle = '#3EB24A'; g.beginPath(); g.roundRect(340, 245, 600, 250, 36); g.fill(); T('BY HOW MUCH', 310, 58, '#FFFFFF'); T('YOUR RATINGS', 375, 58, '#FFFFFF'); T('CHANGED', 440, 58, '#FFFFFF'); } }
  else if (st.mode === 'kaieq') { T('KAI · EQ', 150, 70, '#C8CCE0'); T(String(st.v), 380, 260, st.v > 40 ? '#4ADB6A' : '#E8423A'); if (st.v > 40) T('+40', 600, 90, '#4ADB6A'); }
  else if (st.mode === 'potential') { pill(640, 150, 71, 95, '#FFC83A'); T('THEO', 320, 92, '#FFFFFF'); T('POTENTIAL', 425, 64, '#C8CCE0'); T('99', 585, 230, '#FFC83A'); }
  S.tex.needsUpdate = true;
}

// ---------------- sound events (the score reads these) ----------------
ev(0, 'stadium', { d: C.L3 + .2 }); ev(.02, 'alarm'); ev(tFall1, 'heart', { d: 2.2 }); ev(tHide2, 'hit2');
ev(C.L3, 'rewind', { d: REW.b - REW.a });
CHS.forEach(c => { ev(c.t0, 'card'); });
ev(C.L4, 'street', { d: CHS[1].t0 - C.L4 }); ev(tRatings4, 'pop'); ev(tHeads4, 'blip');
T5.forEach((x, i) => ev(x, 'tick', { n: i })); ev(tLive6 + .05, 'up');
ev(tRun6 - .1, 'steps', { d: tSkip6 - tRun6 }); ev(tUp6, 'up'); ev(tSkip6, 'yawn'); ev(tDown6, 'down');
ev(tCruel7, 'laugh'); ev(tCruel7 + .2, 'down'); ev(tEveryone7, 'whoosh'); ev(tDrop7, 'down');
ev(tCafe8, 'whoosh'); ev(t70_8, 'error'); ev(C.L9, 'whoosh'); ev(tStr9 + .05, 'error'); ev(tBank9, 'whoosh'); ev(t80_9, 'ok'); ev(t80_9 + .15, 'error');
ev(tRule10, 'ok'); ev(tTen10, 'error');
ev(T11[0][1], 'pop'); T11.slice(1).forEach(([k, x], i) => ev(x, 'tick', { n: i })); ev(tPainfully12, 'shrug');
ev(C.L13, 'whoosh'); ev(t99_13, 'shine');
ev(C.L15 - .05, 'whoosh'); ev(T15[0][1], 'pop'); ev(t36_16, 'ruler'); ev(tJoke16, 'laugh');
ev(C.L17, 'rain', { d: C.L20 - C.L17 + .5 }); ev(t61_17, 'down'); ev(t52_17, 'down'); ev(t44_17, 'down'); ev(tThousands18, 'rush', { d: 1.6 });
ev(tStopped19 - .4, 'steps1', { d: .6 }); L20L.forEach(x => ev(x + .05, 'up'));
ev(C.L21, 'heart', { d: C.L22 - C.L21 + 1 }); ev(tAppears21, 'pop'); ev(tAppears21 + .15, 'spin', { d: Math.max(.3, tZero22 - tAppears21 - .15) });
ev(tZero22, 'crack'); ev(tPercent22 + .25, 'laugh'); ev(tStanding22 - .1, 'whoosh'); ev(t97_22, 'sparkle');
ev(C.L23, 'whoosh'); ev(tKai23, 'pop'); ev(tStr23, 'tick', { n: 0 }); ev(tAth23, 'tick', { n: 2 }); ev(tTwo23, 'sparkle'); ev(t80_24, 'error');
ev(tEQ24, 'down'); ev(tBlank24, 'blip'); ev(C.L25, 'whoosh'); ev(tHide25, 'ok'); ev(t9999, 'register');
ev(C.L26, 'stadium', { d: CHS[3].t0 - C.L26 + 1 }); ev(tRanking26, 'hit'); ev(tGold27, 'sparkle');
ev(tSigns28, 'scribble'); ev(t52_28, 'pop'); ev(tLaughs28 - .1, 'laughter', { d: 1.8 });
ev(tRace29 - .1, 'gun'); ev(C.L29, 'steps', { d: tTheo29 - C.L29 }); ev(tSweat29, 'cheer'); ev(tLast29, 'shrug'); ev(tLot29, 'wind', { d: 1.4 });
ev(C.L30, 'whoosh'); ev(tStrange30, 'blip'); [t104, t105, t106].forEach(x => ev(x, 'up')); ev(tSecond31, 'ok');
ev(C.L32, 'hit'); ev(tPartners32, 'pop'); ev(tSwitched32, 'error');
ev(C.L33, 'spin', { d: tKai33 - C.L33 }); ev(tKai33, 'hit'); ev(tDrop34 - .05, 'glitch'); ev(tEvery34, 'glitch'); ev(tLights34, 'alarm'); ev(t12_35, 'hit2');
ev(C.L36, 'stadium', { d: CHS[4].t0 - C.L36 + 1 }); ev(tLooks36, 'whoosh');
[t9, t6, t4].forEach(x => ev(x, 'down')); ev(tFreezes, 'heart', { d: 2.6 });
ev(tWin38, 'sparkle'); ev(tInstead38, 'whoosh');
[t10, t25, t40].forEach((x, i) => ev(x, 'up', { n: i })); ev(tCross42, 'cheer'); ev(tLast42, 'shrug');
ev(C.L43, 'hit'); ev(tReveal43, 'pop'); ev(tNot43, 'error'); ev(tBy43, 'ok');
ev(t40_44, 'up', { n: 3 }); ev(tAfternoon44, 'shine');
TUP.forEach((_, i) => ev(tEvery44 + i * Math.max(.12, (tUp44 - tEvery44) / 5), 'tick', { n: i })); ev(tGold45, 'sparkle'); ev(tGold45 + .05, 'cheer'); ev(tSmall45, 'hit');
ev(C.L46, 'night', { d: C.L48 - C.L46 + .3 }); ev(C.L46 + .1, 'steps1', { d: tStands46 - C.L46 }); ev(t97_46, 'sparkle'); ev(tZero46, 'pop'); ev(tNothing47, 'laugh');
ev(C.L48, 'street', { d: C.L49 - C.L48 }); ev(tCancelled48, 'error'); ev(t71, 'up', { n: 4 });
ev(C.L49, 'birds', { d: END - C.L49 }); ev(t100, 'sparkle'); ev(tLaughs51, 'laugh'); ev(tUp51, 'up', { n: 1 }); ev(tUp51 + .45, 'blip');
ev(tWhich52, 'tick', { n: 5 }); ev(END - 1.6, 'sting');

// ---------------- the overlay: telops, chapter cards, captions, the end card ----------------
const ov = document.getElementById('ov').getContext('2d');
const TEL = [
  { t0: .02, t1: C.L3, text: '● LIVE', x: 150, y: 80, size: 54, col: '#FFFFFF', rot: 0, plate: '#C8283A' },
  { t0: tPeople1 - .05, t1: tHighest1 - .1, text: '50,000 WATCHING', y: 130, size: 92, col: '#FFFFFF', rot: -3, plate: '#16131A' },
  { t0: tHide2 - .1, t1: C.L3, text: 'HIS HIDDEN STAT', y: 130, size: 92, col: '#FFFFFF', rot: -3, plate: '#C8283A' },
  { t0: tCafe8 - .05, t1: C.L9, text: 'CAFÉ JOBS: EQ 70+', y: 130, size: 88, col: '#FFFFFF', rot: -3, plate: '#C8283A' },
  { t0: tGym9 - .05, t1: tBank9 - .1, text: 'GYM: STRENGTH 80+', y: 130, size: 88, col: '#FFFFFF', rot: 3, plate: '#2E7FE0' },
  { t0: tBank9 - .05, t1: C.L10, text: 'BANK LOANS: OVERALL 80+', y: 130, size: 84, col: '#FFFFFF', rot: -3, plate: '#2E9A4A' },
  { t0: tTen10 - .05, t1: CHS[1].t0, text: '±10 RULE', y: 130, size: 130, col: '#FFFFFF', rot: -4, plate: '#C8283A' },
  { t0: tTheo11 - .05, t1: C.L12, text: 'THEO', x: 420, y: 800, size: 80, col: '#FFFFFF', rot: -2, plate: '#2A3A7A', sub: 'OVERALL 52' },
  { t0: tPainfully12 - .05, t1: C.L13, text: 'PAINFULLY AVERAGE', y: 130, size: 92, col: '#FFFFFF', rot: -3, plate: '#5A5E68' },
  { t0: t99_13 - .05, t1: tNot14 + .4, text: 'POTENTIAL: 99', y: 130, size: 100, col: '#C8CCD8', rot: -3, plate: '#2A2E40' },
  { t0: tMia15 + .25, t1: C.L16, text: 'MIA', x: 1500, y: 800, size: 80, col: '#FFFFFF', rot: 2, plate: '#C84A7A', sub: 'OVERALL 88' },
  { t0: t36_16 - .05, t1: tCity16 + .1, text: '36-POINT GAP', y: 130, size: 100, col: '#FFFFFF', rot: -4, plate: '#C8283A', vs: 1 },
  { t0: C.L17 + .1, t1: tSinking17 - .1, text: 'THE DAY THEY MET', y: 130, size: 88, col: '#FFFFFF', rot: -2, plate: '#5A5E68' },
  { t0: tCompat21 - .05, t1: C.L22 + .2, text: 'COMPATIBILITY', y: 130, size: 100, col: '#FFFFFF', rot: -3, plate: '#C83A6A' },
  { t0: tKai23 - .05, t1: C.L24, text: 'KAI', x: 420, y: 800, size: 80, col: '#FFC83A', rot: -2, plate: '#16131A', sub: 'OVERALL 94 · 2× CHAMPION' },
  { t0: t80_24 - .05, t1: tEQ24 - .1, text: 'HANDSHAKES: 80+ ONLY', y: 130, size: 84, col: '#FFFFFF', rot: -4, plate: '#C8283A' },
  { t0: tHide25 - .3, t1: CHS[2].t0, text: 'HIDE 1 STAT: $9,999/MO', y: 130, size: 84, col: '#FFD24A', rot: -3, plate: '#16131A' },
  { t0: tOutranks27 - .05, t1: C.L28, text: 'GOLD > EVERY NUMBER', y: 130, size: 100, col: '#FFC83A', rot: -4, plate: '#16131A' },
  { t0: tRace29 - .1, t1: tTheo29 - .1, text: 'ROUND 1: THE RACE', y: 130, size: 90, col: '#FFFFFF', rot: -3, plate: '#2E7FE0' },
  { t0: tLast29 - .05, t1: C.L30, text: 'DEAD LAST', y: 140, size: 130, col: '#E8423A', rot: -6, stamp: 1 },
  { t0: tPuzzle30 - .1, t1: tClimbing30 - .5, text: 'ROUND 2: THE PUZZLE', y: 130, size: 88, col: '#FFFFFF', rot: -3, plate: '#9A6AC8' },
  { t0: tSecond31 - .05, t1: tFor31 - .1, text: '2ND PLACE', y: 140, size: 130, col: '#FFC83A', rot: -5, stamp: 1 },
  { t0: tSwitched32 - .05, t1: C.L33, text: 'ALL FILTERS: OFF', y: 130, size: 92, col: '#FFFFFF', rot: -3, plate: '#C8283A' },
  { t0: tKai33 - .05, t1: C.L34, text: 'THEO + KAI', y: 130, size: 120, col: '#FFD23F', rot: -5, plate: '#16131A' },
  { t0: C.L36 + .05, t1: tHalfway36 - .1, text: 'ROUND 3: THE WALL', y: 130, size: 92, col: '#FFFFFF', rot: -3, plate: '#C8283A' },
  { t0: t50k36 - .05, t1: C.L37, text: '50,000 WATCHING', y: 130, size: 96, col: '#FFFFFF', rot: -4, plate: '#16131A' },
  { t0: tLast42 - .05, t1: C.L43, text: 'DEAD LAST', y: 140, size: 130, col: '#E8423A', rot: -6, stamp: 1 },
  { t0: t40_44 - .05, t1: tTheos44 - .1, text: 'EQ +40', x: 1570, y: 300, size: 110, col: '#4ADB6A', rot: -5, plate: '#16131A' },
  { t0: tSmall45 - .05, t1: CHS[4].t0, text: 'POTENTIAL: 99', y: 130, size: 110, col: '#FFC83A', rot: -5, plate: '#16131A' },
  { t0: C.L46 + .05, t1: t97_46 - .3, text: 'THAT NIGHT', y: 130, size: 88, col: '#FFFFFF', rot: -2, plate: '#2A3A7A' },
  { t0: tCompat47 - .05, t1: tThey47 - .1, text: 'COMPATIBILITY = HOW ALIKE', y: 130, size: 80, col: '#FFFFFF', rot: -3, plate: '#C84A7A' },
  { t0: tCancelled48 - .05, t1: tMental48 - .1, text: 'PRIVACY PLAN: CANCELLED', y: 140, size: 96, col: '#E8423A', rot: -5, stamp: 1 },
  { t0: C.L49 + .05, t1: C.L50, text: '50 YEARS LATER', y: 130, size: 100, col: '#FFFFFF', rot: -3, plate: '#16131A' },
  { t0: t100 - .05, t1: C.L51, text: 'BOTH: 100', y: 130, size: 120, col: '#4ADB6A', rot: -5, plate: '#16131A' },
  { t0: tTell52 - .05, t1: END + 1, text: 'TELL ME IN THE COMMENTS ↓', x: 1440, y: 900, size: 54, col: '#16131A', rot: -2, plate: '#FFC83A' },
];
function drawTelop(x, t) {
  const p = seg(t, x.t0, x.t0 + .25), sc = x.stamp ? lerp(2.2, 1, eo(p)) : back(p, 2.6), wob = 1 + .02 * Math.sin((t - x.t0) * 8);
  const text = typeof x.text === 'function' ? x.text(t) : x.text;
  ov.save(); ov.translate(x.x ?? W / 2, x.y); ov.rotate(x.rot * Math.PI / 180); ov.scale(sc * wob, sc * wob); if (x.stamp) ov.globalAlpha = clamp(p * 3);
  ov.font = `900 ${x.size}px Montserrat`; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  const tw = Math.min(1700, ov.measureText(text).width + 70), th = x.size * 1.4;
  if (x.plate) { ov.fillStyle = 'rgba(0,0,0,.85)'; ov.beginPath(); ov.roundRect(-tw / 2 + 10, -th / 2 + 12, tw, th, 26); ov.fill(); ov.fillStyle = x.plate; ov.beginPath(); ov.roundRect(-tw / 2, -th / 2, tw, th, 26); ov.fill(); }
  if (x.stamp) { ov.strokeStyle = x.col; ov.lineWidth = 14; ov.beginPath(); ov.roundRect(-tw / 2 + 5, -th / 2 + 8, tw - 10, th - 16, 18); ov.stroke(); }
  ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 20; ov.shadowOffsetY = 8; ov.lineWidth = x.size * .2; ov.strokeStyle = x.plate === '#FFC83A' ? '#FFFFFF' : '#000'; if (x.plate !== '#FFC83A') ov.strokeText(text, 0, 4, 1640); ov.shadowColor = 'transparent'; ov.fillStyle = x.col; ov.fillText(text, 0, 4, 1640);
  if (x.sub) { ov.font = '900 40px Montserrat'; const sw = ov.measureText(x.sub).width + 44; ov.fillStyle = '#FFD23F'; ov.beginPath(); ov.roundRect(-sw / 2, x.size * .7 + 4, sw, 58, 16); ov.fill(); ov.fillStyle = '#1B1213'; ov.fillText(x.sub, 0, x.size * .7 + 35); }
  ov.restore();
  if (x.vs) {   // 52 ⟷ 88 under the plate
    const k = back(seg(t, x.t0 + .1, x.t0 + .4), 2.4); ov.save(); ov.translate(W / 2, x.y + 170); ov.scale(k, k);
    [[-240, 52], [240, 88]].forEach(([dx, n]) => { ov.fillStyle = tier(n); ov.beginPath(); ov.arc(dx, 0, 80, 0, 7); ov.fill(); ov.lineWidth = 10; ov.strokeStyle = '#16131A'; ov.stroke(); ov.fillStyle = '#16131A'; ov.font = '900 86px Montserrat'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.fillText(String(n), dx, 6); });
    ov.strokeStyle = '#FFFFFF'; ov.lineWidth = 12; ov.lineCap = 'round'; ov.beginPath(); ov.moveTo(-130, 0); ov.lineTo(130, 0); ov.stroke(); for (const s of [-1, 1]) { ov.beginPath(); ov.moveTo(s * 130, 0); ov.lineTo(s * 95, -26); ov.moveTo(s * 130, 0); ov.lineTo(s * 95, 26); ov.stroke(); }
    ov.restore(); }
}
// chapter cards: a giant rating card on a field of floating pills
const CHT = { rules: ['CHAPTER 1', 'THE RULES', 41], zero: ['CHAPTER 2', 'THE ZERO', 52], rank: ['CHAPTER 3', 'THE RANKING', 88], wall: ['CHAPTER 4', 'THE WALL', 12], point: ['CHAPTER 5', 'THE POINT', 99] };
function drawChapter(i, t) {
  const c = CHS[i], [a, b, n] = CHT[c.ch], k = seg(t, c.t0, c.t0 + .4), out = seg(t, c.t1 - .25, c.t1), lt = t - c.t0;
  const gr = ov.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * .65); gr.addColorStop(0, '#262B48'); gr.addColorStop(1, '#0A0C16'); ov.fillStyle = gr; ov.fillRect(0, 0, W, H);
  // drifting pills
  for (let j = 0; j < 46; j++) { const x = (hash(j) * W + lt * (20 + hash(j + 9) * 40)) % (W + 200) - 100, y = hash(j + 3) * H - lt * (10 + hash(j + 5) * 25), v = Math.floor(30 + hash(j + 7) * 69), r = 16 + hash(j + 11) * 20;
    ov.globalAlpha = .18 + hash(j + 13) * .2; ov.fillStyle = tier(v); ov.beginPath(); ov.roundRect(x - r * 1.6, y - r * .8, r * 3.2, r * 1.6, r * .8); ov.fill(); ov.fillStyle = '#16131A'; ov.font = `900 ${Math.round(r * 1.1)}px Montserrat`; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.fillText(String(v), x, y + 2); }
  ov.globalAlpha = 1;
  const first = i === 0, s = back(k, 1.8) * (1 - out * .15);
  ov.save(); ov.globalAlpha = 1 - out; ov.translate(W / 2, H / 2 + (first ? 40 : 0)); ov.scale(s, s);
  if (first) { ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
    [['WHAT IF EVERYONE HAD', -330, 70, '#FFFFFF'], ['RATINGS ABOVE THEIR HEADS?', -240, 92, '#FFC83A']].forEach(([txt, y, sz, col]) => { ov.font = `900 ${sz}px Montserrat`; ov.lineWidth = sz * .18; ov.strokeStyle = '#000'; ov.strokeText(txt, 0, y, 1700); ov.fillStyle = col; ov.fillText(txt, 0, y, 1700); }); }
  ov.fillStyle = 'rgba(0,0,0,.45)'; ov.beginPath(); ov.roundRect(-430, -150, 880, 330, 44); ov.fill();
  const cg = ov.createLinearGradient(0, -170, 0, 170); cg.addColorStop(0, '#1E2238'); cg.addColorStop(1, '#12141F'); ov.fillStyle = cg; ov.beginPath(); ov.roundRect(-440, -165, 880, 330, 44); ov.fill();
  ov.lineWidth = 10; ov.strokeStyle = '#FFC83A'; ov.beginPath(); ov.roundRect(-435, -160, 870, 320, 40); ov.stroke();
  ov.fillStyle = tier(n); ov.beginPath(); ov.arc(-300, 0, 95, 0, 7); ov.fill(); ov.lineWidth = 8; ov.strokeStyle = '#16131A'; ov.stroke();
  ov.fillStyle = '#16131A'; ov.font = '900 96px Montserrat'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.fillText(String(i + 1), -300, 6);
  ov.textAlign = 'left'; ov.font = '800 46px Montserrat'; ov.fillStyle = '#FFC83A'; ov.fillText(a, -170, -62);
  ov.font = '900 100px Montserrat'; ov.fillStyle = '#FFFFFF'; ov.fillText(b, -175, 30, 580);
  const bar = seg(t, c.t0 + .3, c.t1 - .3); ov.fillStyle = '#2E3248'; ov.beginPath(); ov.roundRect(-170, 100, 560, 18, 9); ov.fill(); ov.fillStyle = tier(n); ov.beginPath(); ov.roundRect(-170, 100, 560 * eo(bar), 18, 9); ov.fill();
  ov.restore();
}
// the rewind: tape lines, a tint, a ◀◀
function drawRewind(t) {
  const k = seg(t, REW.a, REW.b);
  ov.fillStyle = 'rgba(30,40,90,.18)'; ov.fillRect(0, 0, W, H);
  for (let i = 0; i < 9; i++) { const y = (hash(i + Math.floor(t * 24)) * H + t * 900 * (1 + i % 3)) % H; ov.fillStyle = `rgba(255,255,255,${.08 + hash(i * 3 + Math.floor(t * 30)) * .14})`; ov.fillRect(0, y, W, 3 + hash(i * 7) * 14); }
  ov.save(); ov.translate(140, 110); ov.globalAlpha = .9; ov.fillStyle = '#FFFFFF'; for (const dx of [0, 46]) { ov.beginPath(); ov.moveTo(dx + 44, -32); ov.lineTo(dx, 0); ov.lineTo(dx + 44, 32); ov.closePath(); ov.fill(); }
  ov.font = '900 54px Montserrat'; ov.textAlign = 'left'; ov.textBaseline = 'middle'; ov.fillText('REWIND', 110, 4); ov.restore();
  ov.save(); ov.font = '800 40px Montserrat'; ov.fillStyle = '#FFFFFF'; ov.textAlign = 'right'; ov.globalAlpha = .85; const tc = Math.max(0, lerp(REW.a, 0, eio(k))); ov.fillText(`◀◀ 00:${String(Math.floor(tc)).padStart(2, '0')}:${String(Math.floor((tc % 1) * 24)).padStart(2, '0')}`, W - 80, 110); ov.restore();
}
// the end card: which one would you hide?
const ROWS = ['STRENGTH', 'ATHLETICISM', 'HEALTH', 'IQ', 'EQ', 'MENTAL HEALTH', 'POTENTIAL'];
function drawEnd(t) {
  const a = back(seg(t, tIf52 - .05, tIf52 + .3), 2.0); if (a <= 0) return;
  ov.save(); ov.translate(1440, 470); ov.scale(a * .78, a * .78); ov.globalAlpha = clamp(a * 1.5);
  ov.fillStyle = 'rgba(0,0,0,.4)'; ov.beginPath(); ov.roundRect(-392, -428, 800, 870, 50); ov.fill();
  const grd = ov.createLinearGradient(0, -440, 0, 440); grd.addColorStop(0, '#1E2238'); grd.addColorStop(1, '#12141F'); ov.fillStyle = grd; ov.beginPath(); ov.roundRect(-400, -440, 800, 870, 50); ov.fill();
  ov.lineWidth = 10; ov.strokeStyle = '#FFC83A'; ov.beginPath(); ov.roundRect(-395, -435, 790, 860, 46); ov.stroke();
  ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.font = '900 64px Montserrat'; ov.fillStyle = '#FFC83A'; ov.fillText('HIDE ONE:', 0, -360);
  const sel = Math.floor(Math.max(0, t - tWhich52 + .2) * 6) % ROWS.length, scanning = t > tWhich52 - .2;
  ROWS.forEach((r, i) => { const y = -250 + i * 100, on = scanning && i === sel;
    if (on) { ov.fillStyle = 'rgba(255,200,58,.22)'; ov.beginPath(); ov.roundRect(-360, y - 42, 720, 84, 20); ov.fill(); }
    ov.textAlign = 'left'; ov.font = '800 46px Montserrat'; ov.fillStyle = on ? '#FFFFFF' : '#C8CCE0'; ov.fillText(r, -320, y + 2);
    ov.lineWidth = 6; ov.strokeStyle = on ? '#FFC83A' : '#5A5E78'; ov.beginPath(); ov.roundRect(250, y - 26, 52, 52, 12); ov.stroke();
    if (on) { ov.strokeStyle = '#FFC83A'; ov.lineWidth = 9; ov.lineCap = 'round'; ov.beginPath(); ov.moveTo(262, y); ov.lineTo(274, y + 13); ov.lineTo(292, y - 14); ov.stroke(); } });
  ov.restore();
}
const chunks = [];
TMJ.lines.forEach((l, li) => { let cur = []; const flush = () => { if (cur.length) chunks.push({ li, q: l.id === 'L40', words: cur }); cur = []; };
  l.words.forEach(x => { const len = cur.reduce((a, y) => a + y.w.length + 1, 0) + x.w.length; if (cur.length && (len > 22 || cur.length >= 4)) flush(); cur.push(x); if (/[,.…!?:]"?$/.test(x.w)) flush(); }); flush(); });
chunks.forEach((c, i) => { const n = chunks[i + 1]; c.text = c.words.map(x => x.w).join(' ').replace(/"/g, ''); c.a = c.words[0].t0 - .04; c.b = n ? Math.min(n.words[0].t0 - .04, c.words[c.words.length - 1].t1 + .6) : c.words[c.words.length - 1].t1 + .6; });
const CAPY = 975;
function drawCaption(t, x = W / 2) {
  const c = chunks.find(c => t >= c.a && t < c.b); if (!c) return;
  const pop = back(seg(t, c.a, c.a + .12), 2.2), s = lerp(.7, 1, pop);
  ov.save(); ov.translate(x, CAPY); ov.scale(s, s); ov.font = '900 80px Montserrat'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 18; ov.shadowOffsetY = 6; ov.lineWidth = 20; ov.strokeStyle = '#000'; ov.strokeText(c.text, 0, 0, 1700);
  ov.shadowColor = 'transparent'; ov.fillStyle = c.q ? '#FFD23F' : '#FFFFFF'; ov.fillText(c.text, 0, 0, 1700); ov.restore();
}

// ---------------- render ----------------
const _q = new THREE.Quaternion();
const SPARE = [miniCard(), miniCard(), miniCard(), miniCard()]; SPARE.forEach(m => { m.visible = false; scene.add(m); });
function placeCards() {
  _q.copy(camera.quaternion); let si = 0;
  for (const p of CAST) {
    if (!p.P.visible || !p.cs || p.cs.show === 0) continue;
    const pill = p.kind === 'mini' || p.cs.mini, mesh = p.kind === 'full' && p.cs.mini ? SPARE[si++] : p.card; if (!mesh) continue;
    mesh.userData.draw(pill ? { v: p.cs.v } : { v: p.cs.v, show: p.cs.show, hide: p.cs.hide, pop: p.cs.pop, hl: p.cs.hl, gold: p.cs.gold, flash: p.cs.flash });
    const s = p.cs.s ?? 1, hh = (pill ? .21 : .93) * s;
    mesh.visible = true; mesh.scale.setScalar(s); mesh.quaternion.copy(_q);
    mesh.position.copy(headOf(p)).add(V(0, .21 * p.H + .07 + hh / 2, 0));
    if (GLITCH > 0) { const j = GLITCH * .06; mesh.position.x += (hash(p.P.id + Math.floor(GLITCH * 40)) - .5) * j; mesh.position.y += (hash(p.P.id * 3 + Math.floor(GLITCH * 40)) - .5) * j; mesh.visible = hash(p.P.id + Math.floor(GLITCH * 30)) > GLITCH * .5; }
  }
  if (HEART.visible && HEART.userData.cs) { const c = HEART.userData.cs; HEART.userData.draw(c.st); HEART.position.copy(c.at); HEART.quaternion.copy(_q); HEART.scale.setScalar(c.s ?? 1); }
  LINK.forEach(L => { if (!L.visible || !L.userData.cs) return; const c = L.userData.cs; L.userData.draw(c.txt, c.ok, c.k); L.position.copy(c.at); L.quaternion.copy(_q); });
}
function frame(sh, t) {
  const u = seg(t, sh.t0, sh.t1);
  const lt = sh.lt === 'warm' ? mixLT(GREY, SUNNY, eo(seg(t, L20L[0] - .2, L20L[3] + .3))) : sh.lt;
  lightAll(lt, sh.at); CITY.visible = sh.set === 'city'; STAD.visible = sh.set === 'stadium';
  STAD.userData.crowd.pill.visible = true;
  if (sh.set === 'stadium') drawScreen(screenState(t));
  SPARE.forEach(m => m.visible = false);
  let c = sh.after ? null : sh.cam(t, u); if (c) CAMP.copy(c.pos);
  sh.act(t);
  if (!c) { c = sh.cam(t, u); CAMP.copy(c.pos); }
  camera.position.copy(c.pos); sky.position.copy(c.pos); camera.up.set(0, 1, 0); camera.lookAt(c.look); camera.rotateZ(c.roll ?? 0); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  placeCards();
  post.dof.focus = c.focus; post.dof.aper = c.aper; post.dof.maxCoc = 8;
  const f = sh.fpv ? Math.sin(u * Math.PI) * sh.fpv : 0; zb.uniforms.amt.value = f * .09; zb.enabled = f > .02;
  scene.updateMatrixWorld(true); post.composer.render();
}
const A0 = +(QS.get('a') ?? 0), B0 = +(QS.get('b') ?? DUR);
const shotAt = t => { const i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1); return SHOTS[i < 0 ? SHOTS.length - 1 : i]; };
const hookShot = t => { const i = S.findIndex(s => t >= s.t0 && t < s.t1); return S[Math.max(0, i)]; };
function render(t) {
  const sh = shotAt(t);
  ov.clearRect(0, 0, W, H);
  if (sh.card !== undefined) { drawChapter(sh.card, t); return; }
  if (sh.rewind) { const t2 = lerp(REW.a - .05, .3, eio(seg(t, REW.a, REW.b))); frame(hookShot(t2), t2); }
  else frame(sh, t);
  if (QS.get('poster')) { ov.clearRect(0, 0, W, H); return; }
  if (QS.get('clean')) return;
  if (sh.rewind) drawRewind(t);
  TEL.forEach(x => { if (t >= x.t0 && t < x.t1) drawTelop(x, t); });
  if (GLITCH > 0) { ov.fillStyle = 'rgba(255,255,255,' + (GLITCH * .5) + ')'; ov.fillRect(0, 0, W, H); for (let i = 0; i < 14; i++) { ov.fillStyle = i % 2 ? 'rgba(255,40,80,.35)' : 'rgba(40,220,255,.35)'; ov.fillRect(0, hash(i + Math.floor(t * 30)) * H, W, 6 + hash(i * 7) * 30 * GLITCH); } }
  if (t >= C.L52) { drawEnd(t); drawCaption(t, 700); } else drawCaption(t);
}
function texts(t) { return TEL.filter(x => typeof x.text === 'string' && t >= x.t0 + .3 && t < x.t1).map(x => ({ id: x.text, text: x.text, x0: (x.x ?? W / 2) - 820, y0: x.y - x.size * .7, x1: (x.x ?? W / 2) + 820, y1: x.y + x.size * .7 })); }
EV.sort((a, b) => a.t - b.t);
window.SHOTLIST = SHOTS.map(s => [+s.t0.toFixed(3), +s.t1.toFixed(3), s.card ?? null]);
window.DUR = +(B0 - A0).toFixed(3); window.EV = EV; window.render = t => render(t + A0); window.TEXTS = t => texts(t + A0);
render(A0);
window.READY = true;
