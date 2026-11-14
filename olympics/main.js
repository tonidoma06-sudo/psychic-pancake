// "The Worst Race in Olympic History" · 3D long-form video (1920×1080, ~3 min) in the v4 toon style: the 1904 St. Louis Olympic
// marathon. Six chapters (the start, the man in the car, the man on rat poison, the mailman, the dog, who really won), each
// opened by a 2D title card. Every shot, action, telop and caption is placed from timing.json (the voice). render(t) is pure in t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { makePost } from '/core/three/post.js';
import { makeToon, apply, TP, mix, walk, toon } from './toon.js';
import { country, stadium, saloon, ROAD, FIELD, animCrowd, car, dog, poseDog, bottle, egg, cup, apple, dice, medal, scissors, mailbag, chair } from './sets_oly.js';
import { skyDome } from './sky.js';
import { textPlane } from './kit.js';

const W = 1920, H = 1080;
await document.fonts.load('900 80px Montserrat'); await document.fonts.load('800 80px Montserrat'); await document.fonts.load('700 80px Fredoka'); await document.fonts.load('600 80px Fredoka');
const TMJ = await (await fetch('timing.json')).json();
const B = 60 / TMJ.bpm, DUR = TMJ.dur, LOOP = DUR;
const LN = Object.fromEntries(TMJ.lines.map(l => [l.id, l]));
const nrm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const w = (lid, word, k = 0) => { const ws = LN[lid].words.filter(x => nrm(x.w) === nrm(word) || (nrm(word).length > 3 && nrm(x.w).startsWith(nrm(word)))); return (ws[k] || ws[ws.length - 1] || { t0: LN[lid].t0 }).t0; };
const cut = id => LN[id].cut, end = id => LN[id].t1;
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
const camera = new THREE.PerspectiveCamera(40, W / H, .03, 1500);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, ao: false });
post.bloom.strength = .2; post.bloom.threshold = .95; post.bloom.radius = .5;
const vg = post.vig.uniforms; vg.amt.value = .22; vg.sat.value = 1.15; vg.contrast.value = .1;
const zb = new ShaderPass({ uniforms: { tDiffuse: { value: null }, amt: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: 'uniform sampler2D tDiffuse; uniform float amt; varying vec2 vUv; void main(){ vec2 d = vUv - .5; vec4 s = vec4(0.); for (int i = 0; i < 14; i++) { float k = 1. - amt * float(i) / 13. * length(d) * 2.; s += texture2D(tDiffuse, .5 + d * k); } gl_FragColor = s / 14.; }' });
post.composer.insertPass(zb, 1);
const sun = new THREE.DirectionalLight('#FFF4E0', 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
scene.add(sun, sun.target); const hemi = new THREE.HemisphereLight('#BFDFFF', '#B0703A', 1); scene.add(hemi);
const sky = skyDome('#2A78E0', '#E8E2D6', V(-.4, .5, .6), '#FFF6D8'); scene.add(sky);
const bulb = new THREE.PointLight('#FFC870', 0, 8, 1.5); scene.add(bulb);
const HOT = { pos: [24, 40, 22], col: '#FFF0D2', int: 3.4, hs: '#CFE2F4', hg: '#B0884A', hemi: 1.05, fog: ['#E8E0CC', 60, 380], sky: ['#4A8ED8', '#F2EAD8', [.4, .7, .5], '#FFF8E0'], env: .35, r: 16, warm: .18 };
const DUSK = { pos: [40, 10, 10], col: '#FFB874', int: 3.0, hs: '#A8AEDC', hg: '#A0683A', hemi: .85, fog: ['#F0C49A', 50, 320], sky: ['#4E62B0', '#F6B47A', [.9, .15, .2], '#FFD6A0'], env: .3, r: 16, warm: .3 };
const DREAM = { pos: [10, 12, 30], col: '#FFB0F0', int: 3.2, hs: '#C8A0FF', hg: '#60A050', hemi: 1.1, fog: ['#C89AE8', 20, 200], sky: ['#7A3AC8', '#7AE8A0', [.2, .3, 1], '#FFF0A0'], env: .4, r: 14, warm: .05, sat: 1.9 };
const ROOM = { pos: [2, 6, 4], col: '#FFD9A0', int: .9, hs: '#FFD9A0', hg: '#3A2216', hemi: .45, env: .2, r: 6, bg: '#140C0A', warm: .3, bulb: 6 };
function light(o, at) {
  sun.color.set(o.col); sun.intensity = o.int; sun.position.set(at.x + o.pos[0], at.y + o.pos[1], at.z + o.pos[2]); sun.target.position.copy(at);
  const c = sun.shadow.camera, r = o.r ?? 10; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 1; c.far = 160; c.updateProjectionMatrix();
  hemi.color.set(o.hs); hemi.groundColor.set(o.hg); hemi.intensity = o.hemi;
  scene.fog = o.fog ? new THREE.Fog(o.fog[0], o.fog[1], o.fog[2]) : null; sky.visible = !!o.sky; scene.background = o.sky ? null : new THREE.Color(o.bg ?? '#2A2A30');
  if (o.sky) { const u = sky.material.uniforms; u.top.value.set(o.sky[0]); u.hor.value.set(o.sky[1]); u.sd.value.set(...o.sky[2]).normalize(); u.sc.value.set(o.sky[3]); }
  scene.environmentIntensity = o.env ?? .35; vg.warm.value = o.warm ?? .1; vg.sat.value = o.sat ?? 1.15;
  bulb.intensity = o.bulb ?? 0;
}

// ---------------- sets ----------------
const SET = { road: country(), field: stadium(), room: saloon() };
for (const s of Object.values(SET)) { s.visible = false; scene.add(s); }
SET.field.position.set(0, 0, 800); SET.room.position.set(800, 0, 0);
const O = k => SET[k].position;
const F = (x, y, z) => O('field').clone().add(V(x, y, z));
const RM = (x, y, z) => O('room').clone().add(V(x, y, z));

// ---------------- cast ----------------
const LORZ = makeToon({ name: 'lorz', outfit: 'runner', top: '#F4F1EA', pants: '#2A2A30', bib: '31', hair: 'slick', hairC: '#3A2A1E', shoe: '#2A2420', blush: 1 });
const HICKS = makeToon({ name: 'hicks', outfit: 'runner', top: '#E8E0CC', pants: '#3A3A44', bib: '20', sash: '#C8202A', hair: 'messy', hairC: '#5A3A22', shoe: '#2A2420' });
const CARV = makeToon({ name: 'carvajal', outfit: 'tee', top: '#F2EEDC', pants: '#3A3A44', trousers: '#3A3A44', hair: 'messy', hairC: '#1A1416', mustache: '#1A1416', shoe: '#3A2416', blush: 1, H: .88 });
const TAUN = makeToon({ name: 'taunyane', outfit: 'runner', top: '#F4F1EA', pants: '#2A2A30', bib: '35', hair: 'messy', hairC: '#1A1416', skin: '#8A5A3A', shoe: '#2A2420' });
const MGR = makeToon({ name: 'manager', outfit: 'suit', top: '#4A4A54', tie: '#8A2A2A', hair: 'bowler', hatC: '#1E1A22', mustache: '#3A2A1E', shoe: '#1A1416' });
const TRA1 = makeToon({ name: 'trainer1', outfit: 'suit', top: '#5A4A3A', tie: '#2A3A6A', hair: 'bowler', hatC: '#3A2E26', glasses: 'round', shoe: '#1A1416' });
const TRA2 = makeToon({ name: 'trainer2', outfit: 'suit', top: '#3A4A5A', tie: '#6A2A2A', hair: 'bowler', hatC: '#1E1A22', mustache: '#5A3A22', shoe: '#1A1416', H: 1.05 });
const ORG = makeToon({ name: 'organizer', outfit: 'suit', top: '#2E2E36', tie: '#C8A040', hair: 'tophat', hatC: '#1A1418', mustache: '#6A4A2E', glasses: 'round', shoe: '#1A1416' });
const ALICE = makeToon({ name: 'alice', outfit: 'dress', top: '#F2ECE6', shawl: '#C8A8D8', hair: 'flowerhat', hatC: '#F4F1EA', ribbon: '#C8506A', shoe: '#2A1A10', blush: 1 });
const OFF = makeToon({ name: 'official', outfit: 'suit', top: '#6A6A72', tie: '#2A2A30', hair: 'bowler', hatC: '#2A2A30', mustache: '#2A2420', shoe: '#1A1416' });
const PHOTO = makeToon({ name: 'photographer', outfit: 'suit', top: '#7A6A5A', tie: '#3A3A44', hair: 'flatcap', hatC: '#5A4A3A', shoe: '#1A1416' });
const DISC = makeToon({ name: 'discus', outfit: 'runner', top: '#2A3A7A', pants: '#F4F1EA', hair: 'slick', hairC: '#2A1E16', mustache: '#2A1E16', shoe: '#2A2420', H: 1.18 });
const RUN = [['#F4F1EA', '#2A2A30', '7'], ['#C8D8E8', '#2A2A30', '12'], ['#F2E2B8', '#4A3A2A', '18'], ['#E8C8C8', '#2A2A30', '26'], ['#D8E8C8', '#3A3A44', '9']].map(([top, pants, bib], i) =>
  makeToon({ name: 'runner' + i, outfit: 'runner', top, pants, bib, hair: ['messy', 'slick', 'messy', 'slick', 'messy'][i], hairC: ['#6A4026', '#2A1E16', '#C89A52', '#3A2A1E', '#5A3A22'][i], mustache: i === 2 ? '#6A4A2E' : undefined, shoe: '#2A2420', blush: i % 2 }));
const SPEC = [makeToon({ name: 'spec0', outfit: 'overalls', top: '#C8283A', pants: '#3C5E9A', hair: 'straw', shoe: '#5A3A20', blush: 1 }), makeToon({ name: 'spec1', outfit: 'dress', top: '#5A7AAA', shawl: '#E8C060', hair: 'bonnet', hatC: '#F4F1EA', shoe: '#2A1A10', blush: 1 }), makeToon({ name: 'spec2', outfit: 'suit', top: '#6A5A3A', hair: 'flatcap', hatC: '#4A3A2A', mustache: '#C8B8A0', shoe: '#1A1416' })];
const CAST = [LORZ, HICKS, CARV, TAUN, MGR, TRA1, TRA2, ORG, ALICE, OFF, PHOTO, DISC, ...RUN, ...SPEC]; CAST.forEach(p => scene.add(p.P));

// ---------------- props ----------------
const CAR = car('#2E5A3A'), CAR2 = car('#6A2A2A'); scene.add(CAR, CAR2);
const DOG = dog(); scene.add(DOG);
const STRY = bottle('STRYCHNINE', '#3A6A5A'); TRA1.props.add(STRY);
const BRANDY = bottle('BRANDY', '#6A3A1A', true); TRA2.props.add(BRANDY);
const EGG = egg(); TRA1.propsL.add(EGG); const CUP = cup(); scene.add(CUP);
const APL = apple(); CARV.props.add(APL);
const DICE = dice(); scene.add(DICE);
const MEDAL = medal(); scene.add(MEDAL); const MEDAL2 = medal(); scene.add(MEDAL2);
const SCIS = scissors(); DISC.props.add(SCIS);
const BAG = mailbag(); CARV.spine.add(BAG); BAG.position.set(.2, .18, .06); BAG.rotation.z = .2;
const LAUREL = new THREE.Mesh(new THREE.TorusGeometry(.2, .035, 8, 24), toon('#4E8A36')); scene.add(LAUREL);
const BENCH = chair(); scene.add(BENCH);
const CLIP = textPlane([{ text: 'EXPERIMENT:', size: 90, y: 90, color: '#2A1A10', weight: 900, font: 'Montserrat' }, { text: 'NO WATER', size: 110, y: 220, color: '#C8202A', weight: 900, font: 'Montserrat' }], .32, .42, { w: 640, h: 840, bg: '#F2EAD6', border: '#5A3A22', bw: 20, round: 16 }); ORG.props.add(CLIP);
const LEMON = cup(); ORG.propsL.add(LEMON);
const DREAMSIGN = textPlane([{ text: 'FINISH', size: 150, y: 140, color: '#1A1416', weight: 900, font: 'Montserrat' }, { text: '20 MILES →', size: 130, y: 300, color: '#C8202A', weight: 900, font: 'Montserrat' }], 2.4, 1.3, { w: 900, h: 480, bg: '#F2EAD6', border: '#2A1A10', bw: 20, round: 16 }); scene.add(DREAMSIGN);
const BOSTON = textPlane([{ text: 'BOSTON MARATHON · 1905', size: 110, y: 120, color: '#FFFFFF', weight: 900, font: 'Montserrat' }], 5.6, .6, { w: 1800, h: 220, bg: '#8A2A22', border: '#F4F1EA', bw: 12, round: 10 }); scene.add(BOSTON);
const ZS = Array.from({ length: 3 }, () => { const z = textPlane([{ text: 'Z', size: 220, y: 128, color: '#FFFFFF', weight: 900, font: 'Montserrat', stroke: '#1A1416', sw: 26 }], .3, .3, { w: 256, h: 256 }); z.material.depthWrite = false; scene.add(z); return z; });
const SMOKE = Array.from({ length: 8 }, () => { const s = new THREE.Mesh(new THREE.SphereGeometry(.3, 10, 8), new THREE.MeshStandardMaterial({ color: '#5A5A60', transparent: true, opacity: .6, depthWrite: false })); scene.add(s); return s; });
const PROPS = [CAR, CAR2, DOG, STRY, BRANDY, EGG, CUP, APL, DICE, MEDAL, MEDAL2, SCIS, BAG, LAUREL, BENCH, CLIP, LEMON, DREAMSIGN, BOSTON, ...ZS, ...SMOKE];
// dust: soft billboard points with their own size and alpha
const ND = 700, dpos = new Float32Array(ND * 3), dsz = new Float32Array(ND), dal = new Float32Array(ND);
const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3)); dgeo.setAttribute('size', new THREE.BufferAttribute(dsz, 1)); dgeo.setAttribute('alpha', new THREE.BufferAttribute(dal, 1));
const DUST = new THREE.Points(dgeo, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { col: { value: new THREE.Color('#D8B888') } },
  vertexShader: 'attribute float size; attribute float alpha; varying float vA; void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = size * 900. / -mv.z; gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform vec3 col; varying float vA; void main(){ vec2 d = gl_PointCoord - .5; float r = length(d); if (r > .5) discard; float a = vA * smoothstep(.5, .0, r); gl_FragColor = vec4(col * (.9 + .2 * (1. - r)), a); }' }));
DUST.frustumCulled = false; scene.add(DUST);
// emitters: [{ p: t => position, t0, t1, n, spread, rise, size }]: deterministic in t
function dust(t, emitters) {
  let i = 0;
  for (const e of emitters) for (let k = 0; k < e.n && i < ND; k++, i++) {
    const life = e.life ?? 2.6, off = k * life / e.n, b = e.t0 + off + Math.floor((t - e.t0 - off) / life) * life;
    const age = t - b; if (b < e.t0 - 1e-6 || age < 0 || age > life || b > e.t1) { dal[i] = 0; continue; }
    const p0 = e.p(b), a = hash(i * 3) * 6.28, sp = (e.spread ?? 1.2) * (.3 + age * .6);
    dpos.set([p0.x + Math.sin(a) * sp * hash(i + 1), p0.y + .2 + age * (e.rise ?? .5) * (.4 + hash(i + 2)), p0.z + Math.cos(a) * sp * hash(i + 4)], i * 3);
    dsz[i] = (e.size ?? .7) * (.5 + age * .9); dal[i] = (e.alpha ?? .55) * Math.sin(Math.PI * clamp(age / life)) * (.5 + .5 * hash(i + 6));
  }
  for (; i < ND; i++) dal[i] = 0;
  dgeo.attributes.position.needsUpdate = dgeo.attributes.size.needsUpdate = dgeo.attributes.alpha.needsUpdate = true;
}

// ---------------- key times ----------------
const C = Object.fromEntries(TMJ.lines.map(l => [l.id, l.cut]));
const tWinner = w('L2', 'winner'), tStill3 = w('L3', 'still'), tWorlds = w('L4', 'worlds'), tNinety = w('L4', 'ninety'), tTwenty5 = w('L5', 'twentyfive'), tMost = w('L6', 'most');
const tKick = w('L7', 'kicking'), tBarely = w('L8', 'theres'), tOrg = w('L8', 'organizer'), tLorz9 = w('L9', 'fred'), tSo9 = w('L9', 'so');
const tBreaks = w('L12', 'breaks'), tHops = w('L12', 'hops'), tJogs = w('L12', 'jogs'), tPoses = w('L13', 'poses'), tShes = w('L13', 'shes'), tCheat = w('L14', 'cheated');
const tJoke = w('L15', 'joke'), tBanned = w('L15', 'banned'), tHicks = w('L16', 'thomas'), tStry = w('L17', 'strychnine'), tRat = w('L17', 'rat'), tEgg = w('L17', 'mixed'), tAnother = w('L18', 'another'), tBrandy = w('L18', 'brandy');
const tThinks = w('L19', 'thinks'), tFeet = w('L20', 'feet'), tEight = w('L21', 'eight'), tSlowest = w('L21', 'slowest'), tFelix = w('L22', 'felix'), tMailman = w('L22', 'mailman');
const tGamb = w('L23', 'gambling'), tHitch = w('L23', 'hitchhiked'), tCut24 = w('L24', 'cut'), tShorts = w('L24', 'shorts'), tEats = w('L25', 'eats'), tCramps = w('L25', 'gets'), tNap = w('L26', 'nap'), tLies = w('L26', 'lies');
const tWakes = w('L27', 'wakes'), tFin27 = w('L27', 'and'), tChased = w('L28', 'gets'), tDog = w('L28', 'dog'), tOne30 = w('L30', 'one'), tLifted = w('L31', 'lifted'), tNext = w('L31', 'the', 0), tCar32 = w('L32', 'the', 2), tHe33 = w('L33', 'he');
const CARDS = [['hook', 'L3', 'L4'], ['lorz', 'L8', 'L9'], ['hicks', 'L15', 'L16'], ['mail', 'L21', 'L22'], ['dog', 'L27', 'L28'], ['end', 'L29', 'L30']].map(([ch, a, b]) => ({ ch, t0: end(a) + .25, t1: C[b] }));
const ENDCARD = end('L33') + .9;

// ---------------- helpers ----------------
const put = (p, v, ry = 0) => { p.P.visible = true; p.P.position.copy(v); p.P.rotation.set(0, ry, 0); p.P.updateMatrixWorld(true); };
const show = (...ps) => PROPS.forEach(o => o.visible = ps.includes(o));
const CAMP = new THREE.Vector3(0, 1.4, 6);
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const headOf = p => { p.P.updateMatrixWorld(true); return p.head.getWorldPosition(V(0, 0, 0)); };
const handOf = (p, left) => { p.P.updateMatrixWorld(true); return (left ? p.propsL : p.props).getWorldPosition(V(0, 0, 0)); };
function reset() {
  CAST.forEach(p => { p.P.visible = false; p.P.rotation.set(0, 0, 0); p.root.position.set(0, 0, 0); }); show(); dust(0, []);
  CARV.shins.forEach(s => s.visible = true); BAG.visible = true; CARV.face.set({ blink: 0 });
  SET.field.userData.pcam.userData.flash.visible = false; SET.field.userData.pcam.visible = false; SET.field.userData.tape.visible = true;
}
const runner = (p, x, z, t, o = {}) => { const pp = V(x, 0, z); put(p, pp, o.ry ?? Math.PI / 2); apply(p, walk(o.pose ?? TP.run, (x + (o.ph ?? 0)) * 2.1, o.amt ?? 1.7), { t, seed: o.seed ?? 1, face: o.face ?? 'calm', look: o.look ?? CAMP, talk: o.talk ?? 0, eyes: o.eyes }); return pp; };
function placeCar(cr, x, z, ry, t, k = 1, y = 0) { cr.visible = true; cr.position.set(x, y, z); cr.rotation.set(0, ry - Math.PI / 2, 0); const b = cr.userData.body; b.position.y = Math.abs(Math.sin(t * 13)) * .03 * k; b.rotation.z = Math.sin(t * 9) * .015 * k; cr.userData.wheels.forEach(wh => wh.rotation.z = -t * 9 * k); cr.updateMatrixWorld(true); }
const seat = (cr, which, dx = 0, dz = 0) => cr.localToWorld(cr.userData[which].clone().add(V(dx, 0, dz)));
function zzz(t, at) { ZS.forEach((z, i) => { const u = ((t * .5 + i / 3) % 1); z.visible = true; z.position.copy(at).add(V(.15 + u * .35, .1 + u * .6, 0)); z.scale.setScalar(.5 + u * .9); z.material.opacity = Math.sin(Math.PI * u); z.material.transparent = true; z.quaternion.copy(camera.quaternion); }); }

// ---------------- camera language ----------------
const camAt = (pos, look, fov = 40, focus, aper = 4, roll = 0) => ({ pos, look, fov, focus: focus ?? pos.distanceTo(look), aper, roll });
const hand = (c, t, a = 1) => { c.pos.x += noise(t, 1) * .012 * a; c.pos.y += noise(t, 2) * .01 * a; c.look.x += noise(t, 3) * .02 * a; c.look.y += noise(t, 4) * .016 * a; return c; };
const follow = (target, off, look = V(0, 1.1, 0), fov = 40, aper = 4) => camAt(target.clone().add(off), target.clone().add(look), fov, off.length(), aper);
const PACKX = t => -40 + 3.2 * t;   // the pack on the road (hook)
const LORZCAR = t => lerp(-6, 64, seg(t, C.L10 + .9, tBreaks));   // the manager's car, Lorz aboard

const SHOTS = [
  // ===== hook =====
  { t0: 0, t1: C.L2, set: 'road', lt: HOT, at: V(-30, 0, 0), act: t => actHook(t),
    cam: (t, u) => hand(camAt(V(PACKX(t) + lerp(6.5, 4.6, u), lerp(.55, .8, u), lerp(1.3, 1.6, u)), V(PACKX(t) - 1, 1.1, -.1), 42, 5, 4), t, 1.2) },
  { t0: C.L2, t1: tWinner - .12, set: 'road', lt: HOT, at: V(10, 0, 0), act: t => actHook(t),
    cam: (t, u) => { const x = 4 + 6.5 * (t - C.L2); return hand(camAt(V(x + .4, 1.25, -2.5), V(x - .3, 1.25, 0), 40, 2.7, 5), t, 1.3); } },
  { t0: tWinner - .12, t1: C.L3, set: 'road', lt: HOT, at: V(30, 0, 0), act: t => actHook(t),
    cam: (t, u) => { const x = 30 + .7 * (t - tWinner); return hand(camAt(V(x + 2.4, 1.2, -1.9), V(x - .2, 1.15, .2), 42, 3.3, 5), t, 1.4); } },
  { t0: C.L3, t1: CARDS[0].t0, set: 'road', lt: HOT, at: ROAD.orchard, act: t => actHook(t),
    after: 1, cam: (t, u) => { const h = headOf(CARV); return hand(camAt(h.clone().add(V(lerp(1.25, 1.0, eo(u)), lerp(.42, .32, u), lerp(1.9, 1.5, eo(u)))), h.clone().add(V(.42, -.12, .1)), 40, lerp(2.2, 1.8, eo(u)), 6), t, .5); } },
  { card: 0, t0: CARDS[0].t0, t1: CARDS[0].t1 },
  // ===== the start =====
  { t0: C.L4, t1: tNinety - .12, set: 'field', lt: HOT, at: F(0, 0, 8), act: t => actSetup(t), fpv: .5,
    cam: (t, u) => { const k = eio(u); return camAt(F(lerp(-34, -2, k), lerp(38, 6.5, k), lerp(-150, -6, k)), F(lerp(0, 2, k), lerp(4, 2.5, k), lerp(-60, 14, k)), lerp(50, 44, k), lerp(80, 14, k), 2, Math.sin(k * Math.PI) * .05); } },
  { t0: tNinety - .12, t1: C.L5, set: 'field', lt: HOT, at: F(-7, 0, 13), act: t => actSetup(t),
    cam: (t, u) => hand(camAt(F(-7.2, lerp(1.6, 2.4, eo(u)), lerp(9.6, 10.6, u)), F(-7, lerp(1.6, 2.6, eo(u)), 13.4), 40, 3.4, 5), t) },
  { t0: C.L5, t1: C.L6, set: 'road', lt: HOT, at: V(0, 0, 0), act: t => actSetup(t),
    cam: (t, u) => camAt(V(lerp(-70, -30, u), lerp(24, 18, u), -34), V(lerp(-30, 10, u), 0, 6), 46, 40, 1, 0) },
  { t0: C.L6, t1: C.L7, set: 'field', lt: HOT, at: F(0, 0, 9), act: t => actSetup(t),
    cam: (t, u) => hand(camAt(F(lerp(-6.5, -2.0, eio(u)), 1.1, lerp(5.2, 5.6, u)), F(lerp(-5.6, -1.2, eio(u)), 1.1, 9.0), 40, 3.6, 5), t, .8) },
  { t0: C.L7, t1: C.L8, set: 'road', lt: HOT, at: V(-20, 0, 0), act: t => actSetup(t),
    cam: (t, u) => { const x = -26 + 2.8 * (t - C.L7); return hand(camAt(V(x - 4.5, lerp(1.1, 1.6, u), -1.1), V(x + 4, 1.2, .2), 44, 6, 4), t, 1.2); } },
  { t0: C.L8, t1: tOrg - .12, set: 'road', lt: HOT, at: ROAD.well, act: t => actSetup(t),
    cam: (t, u) => hand(camAt(ROAD.well.clone().add(V(lerp(-2.2, -1.8, u), 1.2, lerp(2.6, 2.3, eo(u)))), ROAD.well.clone().add(V(.1, .95, .2)), 40, 3.1, 5), t) },
  { t0: tOrg - .12, t1: CARDS[1].t0, set: 'road', lt: HOT, at: V(-12, 0, -6), act: t => actSetup(t),
    cam: (t, u) => hand(camAt(V(lerp(-10.6, -11.0, u), 1.15, lerp(-3.6, -4.2, eo(u))), V(-12, 1.15, -6.4), 38, 2.6, 6), t) },
  { card: 1, t0: CARDS[1].t0, t1: CARDS[1].t1 },
  // ===== the man in the car =====
  { t0: C.L9, t1: tSo9 - .12, set: 'road', lt: HOT, at: ROAD.mile9, act: t => actLorz(t),
    cam: (t, u) => hand(camAt(V(lerp(9.5, 8.6, u), lerp(1.0, 1.15, u), 1.2), V(5.2, 1.0, -.4), 40, 4.5, 5), t) },
  { t0: tSo9 - .12, t1: C.L10, set: 'road', lt: HOT, at: ROAD.mile9, act: t => actLorz(t),
    cam: (t, u) => hand(camAt(V(5.8, 1.2, lerp(2.0, 1.4, eo(u))), V(5.6, 1.25, -.2), 38, 1.9, 6), t, .7) },
  { t0: C.L10, t1: C.L11, set: 'road', lt: HOT, at: ROAD.mile9, act: t => actLorz(t),
    cam: (t, u) => hand(camAt(V(lerp(9.6, 9.0, u), 1.3, 2.6), V(4.6, 1.0, -.2), 42, 5, 4), t) },
  { t0: C.L11, t1: C.L12, set: 'road', lt: HOT, at: V(30, 0, 0), act: t => actLorz(t),
    cam: (t, u) => { const x = LORZCAR(t); return hand(camAt(V(x + .4, 1.45, -3.1), V(x - .4, 1.25, 0), 40, 3.2, 5), t, 1.3); } },
  { t0: C.L12, t1: tJogs - .1, set: 'road', lt: HOT, at: V(64, 0, 0), act: t => actLorz(t),
    cam: (t, u) => hand(camAt(V(lerp(69, 68.4, u), 1.2, lerp(-3.4, -3.0, u)), V(64, 1.0, 0), 40, 6, 4), t) },
  { t0: tJogs - .1, t1: C.L13, set: 'field', lt: HOT, at: F(FIELD.gateX, 0, 9), act: t => actLorz(t),
    cam: (t, u) => hand(camAt(F(lerp(24, 26, u), 1.3, lerp(4.4, 5.0, u)), F(FIELD.gateX - 2, 1.4, 9), 42, 8, 3), t) },
  { t0: C.L13, t1: tPoses - .12, set: 'field', lt: HOT, at: F(0, 0, 9), act: t => actLorz(t),
    cam: (t, u) => hand(camAt(F(lerp(-3.2, -2.6, u), lerp(.9, 1.0, u), lerp(5.2, 5.6, u)), F(.3, 1.4, 9.4), 46, 4.6, 4), t, 1.3) },
  { t0: tPoses - .12, t1: tShes - .12, set: 'field', lt: HOT, at: F(0, 0, 9), act: t => actLorz(t),
    cam: (t, u) => hand(camAt(F(lerp(-2.4, -2.2, u), 1.4, lerp(5.3, 5.6, u)), F(.1, 1.3, 9.2), 40, 4.2, 5), t, .6) },
  { t0: tShes - .12, t1: C.L14, set: 'field', lt: HOT, at: F(0, 0, 9), act: t => actLorz(t), after: 1,
    cam: (t, u) => { const m = MEDAL.getWorldPosition(V(0, 0, 0)); return hand(camAt(m.clone().add(V(lerp(-.9, -.6, eo(u)), lerp(.15, .1, u), lerp(-1.3, -.9, eo(u)))), m.clone().add(V(0, .05, 0)), 40, lerp(1.6, 1.1, eo(u)), 6), t, .5); } },
  { t0: C.L14, t1: C.L15, set: 'field', lt: HOT, at: F(0, 0, 9), act: t => actLorz(t),
    cam: (t, u) => { const k = eo(seg(t, tCheat - .15, tCheat + .2)); return hand(camAt(F(lerp(-2.8, -1.2, k), lerp(1.3, 1.5, k), lerp(6.0, 7.4, k)), F(lerp(-.4, .35, k), lerp(1.3, 1.55, k), lerp(9.4, 9.2, k)), lerp(42, 36, k), lerp(3.6, 1.8, k), 5), t, 1 + k * 2); } },
  { t0: C.L15, t1: CARDS[2].t0, set: 'field', lt: HOT, at: F(0, 0, 9), act: t => actLorz(t),
    cam: (t, u) => hand(camAt(F(lerp(.2, .45, u), 1.45, lerp(7.0, 7.4, eo(u))), F(.35, 1.45, 9.2), 38, 2.0, 6), t, .6) },
  { card: 2, t0: CARDS[2].t0, t1: CARDS[2].t1 },
  // ===== the man on rat poison =====
  { t0: C.L16, t1: C.L17, set: 'road', lt: HOT, at: V(-50, 0, 0), act: t => actHicks(t),
    cam: (t, u) => { const x = -54 + 1.6 * (t - C.L16); return hand(camAt(V(x + 4.2, lerp(.9, 1.1, u), lerp(1.6, 1.3, u)), V(x, 1.2, -.1), 40, 4.4, 4), t, 1.2); } },
  { t0: C.L17, t1: tRat - .12, set: 'road', lt: HOT, at: V(-40, 0, 0), act: t => actHicks(t),
    cam: (t, u) => { const x = -40 + 1.6 * (t - C.L17); return hand(camAt(V(x + 1.6, 1.4, lerp(-2.6, -2.2, eo(u))), V(x - .6, 1.3, .3), 40, 2.9, 5), t); } },
  { t0: tRat - .12, t1: C.L18, set: 'road', lt: HOT, at: V(-40, 0, 0), act: t => actHicks(t), after: 1,
    cam: (t, u) => { const x = -40 + 1.6 * (t - C.L17), c = CUP.getWorldPosition(V(0, 0, 0)); return hand(camAt(c.clone().add(V(lerp(.55, .42, eo(u)), .18, lerp(-.6, -.45, eo(u)))), c.clone().add(V(0, .04, 0)), 40, .75, 7), t, .5); } },
  { t0: C.L18, t1: C.L19, set: 'road', lt: HOT, at: V(-30, 0, 0), act: t => actHicks(t),
    cam: (t, u) => { const x = -30 + 1.4 * (t - C.L18); return hand(camAt(V(x + 1.7, 1.45, lerp(-1.9, -1.6, eo(u))), V(x - .4, 1.35, .2), 40, 2.4, 6), t); } },
  { t0: C.L19, t1: C.L20, set: 'road', lt: DREAM, at: V(-10, 0, 0), act: t => actHicks(t), fpv: .9,
    cam: (t, u) => { const x = -12 + 1.2 * (t - C.L19), c = camAt(V(x, lerp(1.35, 1.25, u), .1), V(x + 8, 1.3 + Math.sin(t * 2) * .3, Math.sin(t * 1.3) * 1.2), lerp(48, 64, u), 8, 2, Math.sin(t * 1.7) * .14); return hand(c, t, 2); } },
  { t0: C.L20, t1: C.L21, set: 'field', lt: HOT, at: F(0, 0, 9), act: t => actHicks(t),
    cam: (t, u) => { const x = lerp(-6, 1.2, seg(t, C.L20, end('L20'))); return hand(camAt(F(x + lerp(1.6, 1.2, u), 1.7, 3.2), F(x - .2, 1.1, 9.1), 42, 6.0, 4), t, 1.1); } },
  { t0: C.L21, t1: CARDS[3].t0, set: 'field', lt: HOT, at: F(6, 0, 12.5), act: t => actHicks(t),
    cam: (t, u) => hand(camAt(F(lerp(6.6, 6.5, u), lerp(1.0, .95, u), lerp(10.0, 10.6, eo(u))), F(6, .9, 13.1), 40, 2.6, 6), t, .6) },
  { card: 3, t0: CARDS[3].t0, t1: CARDS[3].t1 },
  // ===== the mailman =====
  { t0: C.L22, t1: C.L23, set: 'road', lt: HOT, at: V(ROAD.signX, 0, 0), act: t => actMail(t),
    cam: (t, u) => hand(camAt(V(ROAD.signX + lerp(.9, .6, u), 1.0, lerp(1.4, 1.0, eo(u))), V(ROAD.signX + .4, 1.05, -1.6), 40, 2.8, 6), t) },
  { t0: C.L23, t1: tHitch - .12, set: 'room', lt: ROOM, at: RM(0, 0, -.6), act: t => actMail(t),
    cam: (t, u) => hand(camAt(RM(lerp(1.5, 1.25, u), lerp(1.4, 1.3, u), lerp(-1.5, -1.3, eo(u))), RM(0, 1.0, .1), 42, 2.0, 6), t, .7) },
  { t0: tHitch - .12, t1: C.L24, set: 'road', lt: HOT, at: V(ROAD.signX, 0, 0), act: t => actMail(t),
    cam: (t, u) => hand(camAt(V(ROAD.signX + lerp(3.4, 2.8, u), 1.1, lerp(2.0, 1.8, u)), V(ROAD.signX + .2, 1.25, -1.6), 42, 4.4, 5), t) },
  { t0: C.L24, t1: C.L25, set: 'field', lt: HOT, at: F(-12, 0, 9), act: t => actMail(t),
    cam: (t, u) => hand(camAt(F(lerp(-12.4, -12.2, u), lerp(1.0, .85, u), lerp(6.3, 6.6, eo(u))), F(-12, .75, 9.0), 40, 2.6, 5), t) },
  { t0: C.L25, t1: tEats - .12, set: 'road', lt: HOT, at: V(-20, 0, -2), act: t => actMail(t),
    cam: (t, u) => hand(camAt(V(lerp(-18.6, -18.9, u), 1.15, 1.6), V(-20, 1.15, -2.6), 40, 4.5, 5), t) },
  { t0: tEats - .12, t1: C.L26, set: 'road', lt: HOT, at: ROAD.orchard, act: t => actMail(t),
    cam: (t, u) => { const tr = SET.road.userData.trees[0]; return hand(camAt(tr.clone().add(V(lerp(.4, .25, u), 1.1, lerp(2.6, 2.2, eo(u)))), tr.clone().add(V(-.05, 1.0, .7)), 40, 2.0, 6), t, .7); } },
  { t0: C.L26, t1: C.L27, set: 'road', lt: HOT, at: ROAD.orchard, act: t => actMail(t),
    after: 1, cam: (t, u) => { const h = headOf(CARV); return hand(camAt(h.clone().add(V(lerp(1.25, 1.0, eo(u)), lerp(.42, .32, u), lerp(1.9, 1.5, eo(u)))), h.clone().add(V(.42, -.12, .1)), 40, lerp(2.2, 1.8, eo(u)), 6), t, .5); } },
  { t0: C.L27, t1: tFin27 - .12, set: 'road', lt: HOT, at: ROAD.orchard, act: t => actMail(t), after: 1,
    cam: (t, u) => { const tr = SET.road.userData.trees[0], h = headOf(CARV); return hand(camAt(tr.clone().add(V(3.0, 1.3, 2.3)), h.clone().add(V(0, -.3, 0)), 42, 3.2, 5), t, 1.2); } },
  { t0: tFin27 - .12, t1: CARDS[4].t0, set: 'field', lt: HOT, at: F(0, 0, 9), act: t => actMail(t),
    cam: (t, u) => hand(camAt(F(lerp(-2.6, -2.2, u), .95, 5.4), F(-.5, 1.0, 9.0), 42, 4.0, 5), t, 1.1) },
  { card: 4, t0: CARDS[4].t0, t1: CARDS[4].t1 },
  // ===== the dog =====
  { t0: C.L28, t1: tChased - .12, set: 'road', lt: HOT, at: V(-30, 0, 0), act: t => actDog(t),
    cam: (t, u) => { const x = -34 + 3.4 * (t - C.L28); return hand(camAt(V(x + 3.6, 1.0, 1.7), V(x, 1.15, -.1), 40, 4, 5), t, 1.1); } },
  { t0: tChased - .12, t1: C.L29, set: 'road', lt: HOT, at: V(-20, 0, 4), act: t => actDog(t), after: 1,
    cam: (t, u) => { const h = headOf(TAUN); return hand(camAt(h.clone().add(V(lerp(-4.5, -3.5, u), 1.1, -4.2)), h.clone().add(V(-.6, -.6, -.4)), 44, 6, 3), t, 1.3); } },
  { t0: C.L29, t1: CARDS[5].t0, set: 'field', lt: HOT, at: F(0, 0, 9), act: t => actDog(t),
    cam: (t, u) => hand(camAt(F(lerp(2.8, 2.4, u), 1.0, 5.6), F(.4, 1.2, 9.0), 40, 4.1, 5), t) },
  { card: 5, t0: CARDS[5].t0, t1: CARDS[5].t1 },
  // ===== who really won =====
  { t0: C.L30, t1: tOne30 - .12, set: 'road', lt: DUSK, at: V(14, 0, -2), act: t => actEnd(t),
    cam: (t, u) => hand(camAt(V(lerp(17.5, 16.5, u), 1.4, lerp(2.4, 2.0, u)), V(13, .8, -2.4), 40, 5.5, 4), t) },
  { t0: tOne30 - .12, t1: C.L31, set: 'road', lt: DUSK, at: V(14, 0, -2), act: t => actEnd(t),
    cam: (t, u) => hand(camAt(V(lerp(11.9, 11.6, u), .9, lerp(.1, -.2, eo(u))), V(11.2, .4, -2.2), 40, 2.3, 6), t, .6) },
  { t0: C.L31, t1: tNext - .12, set: 'field', lt: HOT, at: F(0, 0, 9), act: t => actEnd(t),
    cam: (t, u) => hand(camAt(F(.35, 1.45, lerp(7.2, 7.6, u)), F(.35, 1.45, 9.2), 38, 1.9, 6), t, .6) },
  { t0: tNext - .12, t1: C.L32, set: 'field', lt: HOT, at: F(0, 0, 9), act: t => actEnd(t), boston: 1,
    cam: (t, u) => hand(camAt(F(lerp(-3.4, -2.8, u), 1.6, lerp(3.2, 3.8, u)), F(.2, 1.5, 9.4), 44, 6, 4), t, 1.2) },
  { t0: C.L32, t1: C.L33, set: 'field', lt: HOT, at: F(0, 0, 9), act: t => actEnd(t),
    cam: (t, u) => { const k = eio(seg(t, tCar32 - .3, tCar32 + .3)); return hand(camAt(F(lerp(-.7, .9, k), 1.35, 7.0), F(lerp(-.7, .9, k), 1.35, 9.4), 40, 2.4, 6), t, .7); } },
  { t0: C.L33, t1: ENDCARD, set: 'road', lt: DUSK, at: ROAD.orchard, act: t => actEnd(t),
    after: 1, cam: (t, u) => { const h = headOf(CARV); return hand(camAt(h.clone().add(V(lerp(1.25, 1.0, eo(u)), lerp(.42, .32, u), lerp(1.9, 1.5, eo(u)))), h.clone().add(V(.42, -.12, .1)), 40, lerp(2.2, 1.8, eo(u)), 6), t, .5); } },
  { card: 6, t0: ENDCARD, t1: DUR + 1 },
];

// ---------------- acting ----------------
function pack(t, x0, n = 5, o = {}) {   // the extras jogging in a loose bunch along the road
  RUN.slice(0, n).forEach((p, i) => { const x = x0 - (i % 3) * 1.4 - Math.floor(i / 3) * 2.2 + Math.sin(t * .7 + i) * .25, z = ((i % 2) ? .9 : -.7) + (i % 3) * .25;
    runner(p, x, z, t, { seed: 10 + i, ph: i * 1.7, face: o.face?.(i) ?? ['worried', 'calm', 'worried', 'deadpan', 'calm'][i], pose: o.pose?.(i), amt: o.amt ?? 1.6, look: o.look }); });
}
function actHook(t) {
  reset();
  if (t < C.L2) {   // the pack eats the dust of an officials' car
    const x = PACKX(t); pack(t, x, 5, { face: i => t > 2.2 ? 'shock' : 'worried', pose: i => t > 2.4 && i % 2 ? TP.cough : null });
    const cx = x - 9 + 8.5 * (t - .2); placeCar(CAR2, cx, -.4, Math.PI / 2, t); put(OFF, seat(CAR2, 'seatF'), Math.PI / 2); apply(OFF, TP.sit, { t, seed: 4, face: 'happy', look: CAMP }); OFF.P.position.y -= .48;
    dust(t, [{ p: tt => V(x - 9 + 8.5 * (tt - .2) - 1.4, 0, -.4), t0: 0, t1: C.L2, n: 260, spread: 1.6, size: 1.0, alpha: .5 }]);
  } else if (t < tWinner - .12) {   // Lorz rides by, waving
    const x = 4 + 6.5 * (t - C.L2); placeCar(CAR, x, .2, Math.PI / 2, t);
    put(LORZ, seat(CAR, 'seatB'), Math.PI / 2 + .9); apply(LORZ, TP.wave, { t, seed: 1, face: 'happy', look: CAMP }); LORZ.P.position.y -= .48; LORZ.aR.sh.rotation.z += Math.sin(t * 12) * .3;
    put(MGR, seat(CAR, 'seatF', 0, .3), Math.PI / 2); apply(MGR, TP.sit, { t, seed: 2, face: 'calm' }); MGR.P.position.y -= .48; MGR.aL.sh.rotation.x = MGR.aR.sh.rotation.x = -1.2;
    dust(t, [{ p: tt => V(4 + 6.5 * (tt - C.L2) - 1.6, 0, .2), t0: C.L2 - 1, t1: tWinner, n: 160, spread: 1.0, size: .8, alpha: .45 }]);
  } else if (t < C.L3) {   // Hicks staggers; the trainer holds out the bottle
    const x = 30 + .7 * (t - tWinner); runner(HICKS, x, .1, t, { pose: TP.stagger, amt: .8, seed: 2, face: 'worried', eyes: [Math.sin(t * 3) * .6, .2] });
    placeCar(CAR2, x - 2.6, -.3, Math.PI / 2, t, .3); put(TRA1, seat(CAR2, 'seatF', .2, -.2), Math.PI / 2 - .6); apply(TRA1, TP.offer, { t, seed: 5, face: 'happy', look: headOf(HICKS) }); TRA1.P.position.y -= .48; show(CAR2, STRY); STRY.position.set(0, -.02, .03); STRY.rotation.set(-.4, 0, 0); STRY.scale.setScalar(1.6);
  } else {   // the mailman, asleep under an apple tree
    const tr = SET.road.userData.trees[0], p = tr.clone().add(V(.3, .12, .75)); put(CARV, p, -Math.PI / 2); CARV.P.rotation.set(0, .55, Math.PI / 2 - .08); BAG.visible = false; CARV.P.position.y = .16;
    apply(CARV, TP.sleep, { t, seed: 3, face: t > tStill3 - .1 ? 'proud' : 'deadpan', noBlink: 1 }); CARV.face.set({ blink: 1 }); CARV.shins.forEach(s => s.visible = false);
    zzz(t, headOf(CARV));
  }
}
function actSetup(t) {
  reset();
  if (t < tNinety - .12) { animCrowd(SET.field, t, .3); const line = [LORZ, HICKS, CARV, TAUN, ...RUN]; line.forEach((p, i) => { const pp = F(-6 + i * 1.05, 0, 9.0 + (i % 2) * .25); put(p, pp, Math.PI); apply(p, TP.stand, { t, seed: i, face: 'calm', look: F(0, 1.4, 0) }); }); }
  else if (t < C.L5) { animCrowd(SET.field, t, 0); const th = SET.field.userData.therm; th.userData.merc.scale.y = lerp(.6, 2.1, eo(seg(t, tNinety - .2, tNinety + .8))); }
  else if (t < C.L6) { pack(t, -45 + 3.0 * (t - C.L5), 5); dust(t, [{ p: tt => V(-35 + 7 * (tt - C.L5), 0, 0), t0: C.L5 - 1, t1: C.L6, n: 120, spread: 2, size: 2.2, alpha: .35 }]); placeCar(CAR2, -35 + 7 * (t - C.L5), 0, Math.PI / 2, t); }
  else if (t < C.L7) {   // the start line: 32 men, most never ran a marathon
    animCrowd(SET.field, t, .4);
    const line = [RUN[0], LORZ, RUN[1], HICKS, RUN[2], CARV, RUN[3], TAUN, RUN[4]];
    line.forEach((p, i) => { const pp = F(-7 + i * .95, 0, 9.2 + (i % 2) * .3); put(p, pp, Math.PI + .1); let q = TP.stand, fc = 'calm';
      if (p === RUN[2] && t > tMost) { q = TP.shrug; fc = 'worried'; } if (p === RUN[4]) { q = TP.cramp; fc = 'worried'; } if (p === CARV) q = TP.hips;
      apply(p, q, { t, seed: i, face: fc, look: CAMP }); });
  } else if (t < C.L8) {   // officials' cars ahead; dust in the runners' faces
    const x = -26 + 2.8 * (t - C.L7); pack(t, x, 5, { face: i => t > tKick ? 'shock' : 'worried', pose: i => t > tKick + .3 && i % 2 === 0 ? TP.cough : null, amt: 1.3 });
    runner(HICKS, x - 1, .1, t, { seed: 2, face: t > tKick ? 'worried' : 'calm', ph: 3 });
    const cx = x + 7 + 2.4 * (t - C.L7); placeCar(CAR2, cx, 0, Math.PI / 2, t); put(OFF, seat(CAR2, 'seatB'), Math.PI / 2); apply(OFF, TP.sit, { t, seed: 4, face: 'smug' }); OFF.P.position.y -= .48;
    dust(t, [{ p: tt => V(-26 + 2.8 * (tt - C.L7) + 7 + 2.4 * (tt - C.L7) - 1.5, 0, 0), t0: C.L7 - 2, t1: C.L8, n: 360, spread: 2.0, size: 1.2, alpha: .32, life: 3.0, rise: .4 }]);
  } else if (t < tOrg - .12) {   // the well: barely a drop
    const p = ROAD.well.clone().add(V(-.9, 0, .55)); put(RUN[1], p, t < tBarely ? face(p, ROAD.well) + .3 : face(p, CAMP)); apply(RUN[1], t < tBarely ? TP.hold : TP.shrug, { t, seed: 11, face: t < tBarely ? 'happy' : 'worried', look: CAMP });
    const bk = SET.road.userData.bucket; bk.position.set(.3, lerp(.87, 1.25, seg(t, C.L8, tBarely)), .1);
  } else {   // the organizer in the shade: lemonade and a clipboard
    const p = V(-12, 0, -6.4); put(ORG, p, face(p, CAMP)); apply(ORG, TP.hold, { t, seed: 7, face: 'smug', look: CAMP, talk: 0 }); show(CLIP, LEMON); CLIP.position.set(.06, .1, .05); CLIP.rotation.set(-.2, 0, 0); LEMON.position.set(0, .02, .02);
    const b = BENCH; b.visible = true; b.position.set(-12.5, 0, -7.1);
  }
}
function actLorz(t) {
  reset();
  if (t < C.L10) {   // mile 9: cramp; a look to camera
    const x = t < tLorz9 + .6 ? lerp(2, 5.2, seg(t, C.L9, tLorz9 + .6)) : 5.4, p = V(x, 0, -.3);
    if (t < tLorz9 + .6) runner(LORZ, x, -.3, t, { seed: 1, face: 'calm' }); else { put(LORZ, p, t < tSo9 ? Math.PI / 2 : .3); apply(LORZ, t < tSo9 ? TP.cramp : TP.think, { t, seed: 1, face: t < tSo9 ? 'worried' : 'smug', look: CAMP }); LORZ.P.position.y = t < tSo9 ? Math.abs(Math.sin(t * 9)) * .08 : 0; }
    if (t > tSo9 + .8) { placeCar(CAR, lerp(-6, 3.4, eo(seg(t, tSo9 + .8, C.L10))), 1.0, Math.PI / 2, t, .6); put(MGR, seat(CAR, 'seatF', 0, .3), Math.PI / 2); apply(MGR, TP.sit, { t, seed: 2, face: 'happy' }); MGR.P.position.y -= .48; }
  } else if (t < C.L11) {   // he climbs in
    placeCar(CAR, 3.4, 1.0, Math.PI / 2, t, .2); put(MGR, seat(CAR, 'seatF', 0, .3), Math.PI / 2 + .6); apply(MGR, TP.wave, { t, seed: 2, face: 'happy', look: headOf(LORZ) }); MGR.P.position.y -= .48;
    const k = eio(seg(t, C.L10, C.L10 + 1.3)), s = seat(CAR, 'seatB'), p = V(5.4, 0, -.3).lerp(s.clone().add(V(0, -.48, 0)), k); p.y += Math.sin(k * Math.PI) * .5;
    put(LORZ, p, lerp(.3, Math.PI / 2, k)); apply(LORZ, k < 1 ? TP.cheer : TP.sit, { t, seed: 1, face: 'happy', look: CAMP });
  } else if (t < C.L12) {   // ten miles in the back seat, waving at the runners
    const x = LORZCAR(t); placeCar(CAR, x, .8, Math.PI / 2, t);
    put(LORZ, seat(CAR, 'seatB'), Math.PI / 2 + 1.0); apply(LORZ, TP.wave, { t, seed: 1, face: 'happy', look: CAMP }); LORZ.P.position.y -= .48; LORZ.aR.sh.rotation.z += Math.sin(t * 12) * .3;
    put(MGR, seat(CAR, 'seatF', 0, .3), Math.PI / 2); apply(MGR, TP.sit, { t, seed: 2, face: 'calm' }); MGR.P.position.y -= .48; MGR.aL.sh.rotation.x = MGR.aR.sh.rotation.x = -1.2;
    pack(t, x + 6 - 2.2 * (t - C.L11), 4, { face: i => 'shock', amt: 1.3, look: headOf(LORZ) });
    dust(t, [{ p: tt => V(LORZCAR(tt) - 1.6, 0, .8), t0: C.L11 - 1, t1: C.L12, n: 200, spread: 1.0, size: .8, alpha: .45 }]);
  } else if (t < tJogs - .1) {   // the car breaks down; he hops out
    placeCar(CAR, 64, .8, Math.PI / 2, t, t < tBreaks ? 1 : 0); put(MGR, seat(CAR, 'seatF', 0, .3), Math.PI / 2 + .3); apply(MGR, t > tBreaks ? TP.shrug : TP.sit, { t, seed: 2, face: t > tBreaks ? 'worried' : 'calm' }); MGR.P.position.y -= .48;
    SMOKE.forEach((s, i) => { const u = ((t * .7 + i / 8) % 1); s.visible = t > tBreaks; s.position.set(65.3 + u * .4, 1.0 + u * 2.2, .8 + Math.sin(i) * .3); s.scale.setScalar(.6 + u * 1.6); s.material.opacity = .65 * (1 - u); });
    const k = seg(t, tHops - .1, tHops + .6), s = seat(CAR, 'seatB'); const p = s.clone().add(V(0, -.48, 0)).lerp(V(64.2, 0, -1.2), eo(k)); p.y += Math.sin(k * Math.PI) * .5;
    if (t < tHops + .6) { put(LORZ, p, Math.PI / 2 - k); apply(LORZ, k > 0 ? TP.cheer : TP.sit, { t, seed: 1, face: k > 0 ? 'happy' : 'worried', look: CAMP }); }
    else { const x = 64.2 + 2.2 * (t - tHops - .6); runner(LORZ, x, -1.2, t, { seed: 1, face: 'happy', amt: 1.0, pose: TP.run }); }
  } else if (t < C.L13) {   // into the stadium
    animCrowd(SET.field, t, .6); const x = lerp(FIELD.gateX + 2, 18, seg(t, tJogs - .1, C.L13)); runner(LORZ, x, O('field').z + 9, t, { ry: -Math.PI / 2, seed: 1, face: 'happy', amt: 1.4 });
  } else if (t < tPoses - .12) {   // breaks the tape, arms up
    animCrowd(SET.field, t, 1); const x = lerp(4, -1.8, seg(t, C.L13, tPoses - .3)); put(LORZ, F(x, 0, 9.2), -Math.PI / 2 + (x < 0 ? .6 : 0)); apply(LORZ, x < 0 ? TP.cheer : walk(TP.run, x * 2.1, 1.4), { t, seed: 1, face: 'laugh', look: CAMP });
    SET.field.userData.tape.visible = x > 0;
  } else if (t < C.L14) {   // the photo, the President's daughter, the medal
    animCrowd(SET.field, t, .5); SET.field.userData.tape.visible = false;
    put(LORZ, F(-.2, 0, 9.4), Math.PI + .3); apply(LORZ, TP.hips, { t, seed: 1, face: 'proud', look: CAMP });
    put(ALICE, F(.65, 0, 9.5), Math.PI - .4); apply(ALICE, t > tShes - .2 ? TP.offer : TP.stand, { t, seed: 8, face: 'smile', look: t > tShes ? headOf(LORZ) : CAMP });
    put(PHOTO, F(-2.6, 0, 4.7), face(V(-2.6, 0, 4.7), V(0, 0, 9.4))); apply(PHOTO, TP.hold, { t, seed: 9, face: 'calm' });
    const pc = SET.field.userData.pcam; pc.visible = true; pc.userData.flash.visible = Math.abs(t - (tPoses + .25)) < .07 || Math.abs(t - (tPoses + .9)) < .07;
    const hp = handOf(ALICE); MEDAL.visible = t > tShes - .3; const k = eo(seg(t, tShes, C.L14)); MEDAL.position.copy(hp.clone().lerp(headOf(LORZ).add(V(0, -.25, 0)), k * .6)); MEDAL.rotation.set(0, face(hp, CAMP), Math.sin(t * 3) * .1);
  } else if (t < C.L15) {   // "he cheated!"
    animCrowd(SET.field, t, t > tCheat ? 0 : .5); SET.field.userData.tape.visible = false;
    put(LORZ, F(-.2, 0, 9.4), Math.PI + .3); apply(LORZ, TP.hips, { t, seed: 1, face: t > tCheat ? 'shock' : 'proud', look: CAMP });
    put(ALICE, F(.65, 0, 9.5), Math.PI - .4); apply(ALICE, TP.offer, { t, seed: 8, face: t > tCheat ? 'shock' : 'smile', look: headOf(LORZ) });
    const ox = lerp(-4.5, -1.6, eo(seg(t, C.L14, tCheat))); put(OFF, F(ox, 0, 8.6), face(V(ox, 0, 8.6), V(-.2, 0, 9.4))); apply(OFF, t > tCheat - .2 ? TP.point : walk(TP.run, ox * 2, 1.2), { t, seed: 4, face: 'angry', look: headOf(LORZ), talk: t > tCheat - .3 ? .6 : 0 });
    MEDAL.visible = true; MEDAL.position.copy(handOf(ALICE)); MEDAL.rotation.set(0, Math.PI, 0);
  } else {   // "just a joke" … banned for life
    animCrowd(SET.field, t, 0); SET.field.userData.tape.visible = false;
    put(LORZ, F(.35, 0, 9.4), Math.PI); apply(LORZ, t > tBanned ? TP.stand : TP.shrug, { t, seed: 1, face: t > tBanned ? 'deadpan' : 'happy', look: CAMP, talk: t < tJoke + .3 ? .4 + .4 * Math.sin(t * 24) : 0 });
  }
}
function actHicks(t) {
  reset();
  const trainersCar = (x, z = -.5, k = .3) => { placeCar(CAR2, x, z, Math.PI / 2, t, k); put(TRA2, seat(CAR2, 'seatF', 0, .3), Math.PI / 2); apply(TRA2, TP.sit, { t, seed: 6, face: 'calm' }); TRA2.P.position.y -= .48; TRA2.aL.sh.rotation.x = TRA2.aR.sh.rotation.x = -1.2; };
  if (t < C.L17) { const x = -54 + 1.6 * (t - C.L16); runner(HICKS, x, .1, t, { pose: TP.stagger, amt: .9, seed: 2, face: 'worried', eyes: [Math.sin(t * 2) * .5, .3] }); HICKS.P.rotation.z = Math.sin(t * 2.3) * .08; trainersCar(x - 3.2); }
  else if (t < C.L18) {   // strychnine in egg white
    const x = -40 + 1.6 * (t - C.L17); runner(HICKS, x, .35, t, { pose: TP.stagger, amt: .8, seed: 2, face: 'worried', look: headOf(TRA1) }); trainersCar(x - 1.3, -.7, .2);
    put(TRA1, seat(CAR2, 'seatB', .1, -.25), Math.PI / 2 - .9); apply(TRA1, TP.offer, { t, seed: 5, face: 'happy', look: headOf(HICKS) }); TRA1.P.position.y -= .48;
    show(CAR2, STRY, EGG, CUP); STRY.position.set(0, -.02, .03); STRY.rotation.set(-.4, 0, 0); STRY.scale.setScalar(1.5); EGG.position.set(0, .02, .02);
    const hp = handOf(TRA1, true); CUP.position.copy(hp).add(V(.04, .02, .04)); CUP.visible = t > tRat - .2; EGG.visible = t < tEgg + .4;
  } else if (t < C.L19) {   // dose two, with brandy
    const x = -30 + 1.4 * (t - C.L18); runner(HICKS, x, .35, t, { pose: TP.stagger, amt: .7, seed: 2, face: t > tBrandy ? 'happy' : 'worried', eyes: [Math.sin(t * 6) * .8, Math.cos(t * 6) * .5] }); trainersCar(x - 1.3, -.7, .2);
    put(TRA1, seat(CAR2, 'seatB', .1, -.25), Math.PI / 2 - .9); apply(TRA1, TP.offer, { t, seed: 5, face: 'happy', look: headOf(HICKS) }); TRA1.P.position.y -= .48;
    TRA1.props.add(BRANDY); show(CAR2, STRY, BRANDY); STRY.visible = t < tAnother + .6; BRANDY.visible = t > tAnother + .4; BRANDY.position.set(0, -.02, .03); BRANDY.rotation.set(-.6, 0, 0);
  } else if (t < C.L20) {   // hallucination: the finish is still 20 miles away
    const x = -12 + 1.2 * (t - C.L19); show(DREAMSIGN); DREAMSIGN.position.set(x + 7 + Math.sin(t) * .6, 2.0 + Math.sin(t * 1.7) * .4, Math.sin(t * .9) * 1.2); DREAMSIGN.rotation.set(0, -Math.PI / 2 + Math.sin(t * 1.3) * .3, Math.sin(t * 2.1) * .2);
    pack(t, x + 10 + Math.sin(t) * 2, 3, { face: i => 'laugh', amt: 2.2 });
  } else if (t < C.L21) {   // carried across the line, feet still going
    animCrowd(SET.field, t, .8); SET.field.userData.tape.visible = false;
    const x = lerp(-6, 1.2, seg(t, C.L20, end('L20'))), p = F(x, .25, 9.1); put(HICKS, p, -Math.PI / 2); apply(HICKS, walk(TP.run, t * 9, 1.8), { t, seed: 2, face: 'happy', eyes: [Math.sin(t * 5) * .8, Math.cos(t * 5) * .5] });
    for (const [p2, dz, sd] of [[TRA1, .55, 5], [TRA2, -.55, 6]]) { const pp = F(x, 0, 9.1 + dz); put(p2, pp, -Math.PI / 2); apply(p2, walk({ ...TP.lift }, x * 2.2, 1.0), { t, seed: sd, face: 'worried', look: headOf(HICKS) }); }
  } else {   // gold, eight pounds lighter, the slowest time ever
    animCrowd(SET.field, t, .2); BENCH.visible = true; BENCH.position.copy(F(6, 0, 13.4)); BENCH.rotation.set(0, Math.PI, 0);
    put(HICKS, F(6, 0, 13.25), Math.PI); apply(HICKS, TP.slump, { t, seed: 2, face: 'deadpan', look: CAMP, eyes: [Math.sin(t * 3) * .4, 0] }); HICKS.P.position.y = .02; HICKS.spine.scale.x *= lerp(1, .82, seg(t, tEight - .2, tEight + .5));
    MEDAL2.visible = true; MEDAL2.position.copy(headOf(HICKS).add(V(0, -.42, -.2))); MEDAL2.rotation.set(-.2, 0, Math.sin(t * 2) * .1);
  }
}
function actMail(t) {
  reset();
  if (t < C.L23) {   // the mailman from Cuba
    const p = V(ROAD.signX + .4, 0, -1.7); put(CARV, p, face(p, CAMP)); apply(CARV, TP.wave, { t, seed: 3, face: 'happy', look: CAMP }); CARV.aR.sh.rotation.z += Math.sin(t * 10) * .25;
  } else if (t < tHitch - .12) {   // dice in New Orleans
    put(CARV, RM(.05, 0, .25), Math.PI); apply(CARV, t < tGamb ? TP.cheer : TP.slump, { t, seed: 3, face: t < tGamb + .3 ? 'happy' : 'worried', look: RM(0, .9, -.6) }); CARV.P.position.y = t < tGamb ? 0 : -.05; BAG.visible = false;
    put(MGR, RM(-.1, 0, -1.6), 0); apply(MGR, TP.rub, { t, seed: 2, face: 'evil', look: headOf(CARV) });
    DICE.visible = true; const k = seg(t, C.L23 + .1, tGamb); DICE.position.copy(RM(lerp(.2, -.1, k), .86 + Math.abs(Math.sin(k * 9)) * .15 * (1 - k), lerp(-.2, -.6, k))); DICE.rotation.set(k * 12, k * 9, 0);
    bulb.position.copy(RM(0, 2.4, -.6));
  } else if (t < C.L24) {   // thumb out toward St. Louis
    const p = V(ROAD.signX + .6, 0, -1.6); put(CARV, p, face(p, V(ROAD.signX - 6, 0, 0))); apply(CARV, TP.thumb, { t, seed: 3, face: 'happy', look: CAMP }); CARV.aR.sh.rotation.z += Math.sin(t * 6) * .08;
  } else if (t < C.L25) {   // the discus man cuts his trousers into shorts
    animCrowd(SET.field, t, .2); const cp = F(-12, 0, 9.4); put(CARV, cp, Math.PI); apply(CARV, t > tShorts ? TP.cheer : TP.hips, { t, seed: 3, face: t > tShorts ? 'laugh' : 'worried', look: CAMP });
    put(DISC, F(-12.55, 0, 9.0), face(F(-12.55, 0, 9.0), cp)); apply(DISC, TP.snip, { t, seed: 9, face: 'happy', look: cp.clone().add(V(0, .3, 0)) }); show(SCIS); SCIS.rotation.set(0, Math.sin(t * 18) * .2, -1.2);
    CARV.shins.forEach(s => s.visible = t < tCut24 + .4);
  } else if (t < tEats - .12) {   // chatting with the crowd at the fence
    const p = V(-20, 0, -1.9); put(CARV, p, Math.PI); apply(CARV, TP.speech, { t, seed: 3, face: 'laugh', look: headOf(SPEC[1]), talk: .4 + .4 * Math.sin(t * 22) }); CARV.shins.forEach(s => s.visible = false);
    SPEC.forEach((s, i) => { const sp = V(-20.9 + i * .9, 0, -3.6); put(s, sp, face(sp, p)); apply(s, i === 1 ? TP.hold : TP.stand, { t, seed: 12 + i, face: ['laugh', 'happy', 'smile'][i], look: headOf(CARV) }); });
  } else if (t < C.L26) {   // green apples … cramps
    const tr = SET.road.userData.trees[0], p = tr.clone().add(V(-.05, 0, .7)); put(CARV, p, face(p, CAMP) + .2); CARV.shins.forEach(s => s.visible = false);
    const cr = t > tCramps - .1; apply(CARV, cr ? TP.tummy : TP.eat, { t, seed: 3, face: cr ? 'worried' : 'happy', look: CAMP, talk: cr ? 0 : Math.abs(Math.sin(t * 9)) * .5 });
    show(APL); APL.visible = !cr; APL.position.set(0, .02, .04); APL.scale.setScalar(1.3);
  } else if (t < C.L27) {   // lies down … a nap
    const tr = SET.road.userData.trees[0], p = tr.clone().add(V(.3, .12, .75)); CARV.shins.forEach(s => s.visible = false);
    const k = eio(seg(t, C.L26, tLies + .4)); put(CARV, p, -Math.PI / 2); CARV.P.rotation.set(0, .55 * k, k * (Math.PI / 2 - .08)); BAG.visible = k < .3; CARV.P.position.y = .16 * k;
    apply(CARV, mix(TP.tummy, TP.sleep, k), { t, seed: 3, face: t > tNap - .3 ? 'proud' : 'worried', noBlink: 1 }); if (t > tLies) CARV.face.set({ blink: 1 });
    if (t > tNap - .4) zzz(t, headOf(CARV));
  } else if (t < tFin27 - .12) {   // wakes, runs on
    const tr = SET.road.userData.trees[0]; CARV.shins.forEach(s => s.visible = false);
    if (t < tWakes + .2) { const p = tr.clone().add(V(.3, .12, .75)); put(CARV, p, -Math.PI / 2); CARV.P.rotation.set(0, .55, Math.PI / 2 - .08); BAG.visible = false; CARV.P.position.y = .16; apply(CARV, TP.sleep, { t, seed: 3, face: 'proud', noBlink: 1 }); CARV.face.set({ blink: 1 }); zzz(t, headOf(CARV)); }
    else { const k = seg(t, tWakes + .2, tFin27); const p = tr.clone().add(V(.3 + k * 4, 0, .75 + k * 2.6)); put(CARV, p, .9); apply(CARV, walk(TP.run, k * 20, 1.7), { t, seed: 3, face: 'laugh', look: CAMP }); CARV.root.position.y = k < .1 ? Math.sin(k * 31) * .3 : 0; }
  } else {   // fourth
    animCrowd(SET.field, t, .7); SET.field.userData.tape.visible = false; CARV.shins.forEach(s => s.visible = false);
    const x = lerp(3, -1.8, seg(t, tFin27 - .12, CARDS[4].t0)); put(CARV, F(x, 0, 9.1), -Math.PI / 2 + .4); apply(CARV, walk(TP.cheer, x * 2, 1.0), { t, seed: 3, face: 'laugh', look: CAMP });
  }
}
function actDog(t) {
  reset();
  if (t < tChased - .12) { const x = -34 + 3.4 * (t - C.L28); runner(TAUN, x, -.1, t, { seed: 4, face: 'calm', amt: 1.8 }); }
  else if (t < C.L29) {   // out of the farm gate: the dog gives chase; off course into the corn
    const k = seg(t, tChased - .12, C.L29), tx = lerp(-24, -12, k), tz = lerp(-.1, 9 * k, k), tp = V(tx, 0, tz);
    const ahead = V(lerp(-24, -12, Math.min(1, k + .05)), 0, lerp(-.1, 9 * Math.min(1, k + .05), Math.min(1, k + .05)));
    put(TAUN, tp, face(tp, ahead)); apply(TAUN, walk(TP.run, k * 40, 2.0), { t, seed: 4, face: 'shock', look: CAMP }); TAUN.P.rotation.x = .1;
    const dk = Math.max(0, k - .07), dx = lerp(-24.5, -12, dk), dz = lerp(-3.4, 9 * dk, Math.min(1, dk * 1.3)); DOG.visible = true; DOG.position.set(dx, 0, dz); DOG.rotation.y = Math.atan2(tz - dz, tx - dx) * -1; DOG.rotation.y = -Math.atan2(tz - dz, tx - dx); poseDog(DOG, t, 1);
    SET.road.userData.gate.rotation.y = -1.4 * eo(seg(t, tChased - .2, tChased + .2));
  } else {   // ninth
    animCrowd(SET.field, t, .5); SET.field.userData.tape.visible = false;
    const x = lerp(2.5, -.5, seg(t, C.L29, CARDS[5].t0)); put(TAUN, F(x, 0, 9.1), face(F(x, 0, 9.1), CAMP)); apply(TAUN, walk(TP.cheer, x * 2, 1.0), { t, seed: 4, face: 'laugh', look: CAMP });
  }
}
function actEnd(t) {
  reset();
  if (t < C.L31) {   // dusk on the road: the dropouts; one nearly died
    const sits = [[RUN[0], 11.6, -2.3, TP.sit, 'deadpan'], [RUN[2], 13.3, -2.4, TP.slump, 'worried'], [RUN[3], 15.0, -2.2, TP.sit, 'deadpan'], [RUN[4], 16.6, -2.4, TP.slump, 'worried']];
    sits.forEach(([p, x, z, q, f], i) => { put(p, V(x, 0, z), .1 * (i - 1)); apply(p, q, { t, seed: 20 + i, face: f, look: CAMP }); p.P.position.y = -.48 + .02; });
    put(RUN[1], V(11.2, .1, -1.5), 0); RUN[1].P.rotation.set(-Math.PI / 2 + .05, 0, 0); RUN[1].P.position.y = .12; apply(RUN[1], TP.stand, { t, seed: 22, face: 'worried', noBlink: 1 }); RUN[1].face.set({ blink: 1 });
    put(TRA2, V(10.5, 0, -1.1), 1.2); apply(TRA2, TP.wave, { t, seed: 6, face: 'worried', look: headOf(RUN[1]) }); TRA2.aR.sh.rotation.z += Math.sin(t * 14) * .4;
  } else if (t < tNext - .12) {   // the ban gets lifted
    animCrowd(SET.field, t, 0); put(LORZ, F(.35, 0, 9.4), Math.PI); apply(LORZ, t > tLifted ? TP.cheer : TP.stand, { t, seed: 1, face: t > tLifted ? 'laugh' : 'deadpan', look: CAMP });
  } else if (t < C.L32) {   // Boston, 1905: a fair win
    animCrowd(SET.field, t, 1); BOSTON.visible = true; BOSTON.position.copy(F(0, 3.0, 9)); BOSTON.rotation.y = Math.PI;
    const x = lerp(5, -1.6, seg(t, tNext - .12, C.L32 - .3)); put(LORZ, F(x, 0, 9.2), -Math.PI / 2 + (x < 0 ? .6 : 0)); apply(LORZ, x < 0 ? TP.cheer : walk(TP.run, x * 2.1, 1.5), { t, seed: 1, face: 'laugh', look: CAMP });
    SET.field.userData.tape.visible = x > 0;
  } else if (t < C.L33) {   // the gold … and Boston
    animCrowd(SET.field, t, .3); SET.field.userData.tape.visible = false;
    put(HICKS, F(-.7, 0, 9.4), Math.PI); apply(HICKS, TP.slump, { t, seed: 2, face: 'happy', look: CAMP, eyes: [Math.sin(t * 4) * .6, Math.cos(t * 4) * .4] }); HICKS.P.position.y = -.0; HICKS.spine.scale.x *= .85;
    MEDAL2.visible = true; MEDAL2.position.copy(headOf(HICKS).add(V(0, -.42, -.2))); MEDAL2.rotation.set(-.2, 0, 0);
    put(LORZ, F(.9, 0, 9.4), Math.PI); apply(LORZ, TP.cheer, { t, seed: 1, face: 'laugh', look: CAMP });
    LAUREL.visible = true; LAUREL.position.copy(headOf(LORZ).add(V(0, .16, 0))); LAUREL.rotation.set(Math.PI / 2, 0, 0);
  } else {   // and the mailman got a really good nap
    const tr = SET.road.userData.trees[0], p = tr.clone().add(V(.3, .12, .75)); put(CARV, p, -Math.PI / 2); CARV.P.rotation.set(0, .55, Math.PI / 2 - .08); BAG.visible = false; CARV.P.position.y = .16; CARV.shins.forEach(s => s.visible = false);
    apply(CARV, TP.sleep, { t, seed: 3, face: 'proud', noBlink: 1 }); CARV.face.set({ blink: 1 }); zzz(t, headOf(CARV));
  }
}

// ---------------- sound events (the score reads these) ----------------
ev(0, 'gun'); ev(.4, 'crowd', { d: 1.2 }); ev(.6, 'car', { d: C.L2 - .6 }); ev(2.2, 'cough'); ev(C.L2, 'car', { d: tWinner - C.L2 }); ev(C.L2 + .3, 'horn'); ev(tWinner - .12, 'cut'); ev(tWinner + .2, 'pop');
ev(C.L3, 'whoosh'); ev(C.L3 + .4, 'snore', { d: CARDS[0].t0 - C.L3 }); ev(tStill3, 'ding');
CARDS.forEach((c, i) => { ev(c.t0 - .05, 'card'); });
ev(C.L4, 'crowd', { d: tNinety - C.L4 }); ev(tNinety, 'slide'); ev(C.L5, 'whoosh'); ev(C.L6, 'crowd', { d: 3 }); ev(C.L7, 'car', { d: C.L8 - C.L7 }); ev(tKick + .3, 'cough'); ev(tKick + .9, 'cough');
ev(C.L8, 'cut'); ev(tBarely - .3, 'creak'); ev(tBarely + .1, 'drip'); ev(tOrg - .12, 'cut'); ev(tOrg + .3, 'sip');
ev(C.L9, 'whoosh'); ev(tLorz9 + .6, 'boing'); ev(tSo9 + .6, 'horn'); ev(C.L10, 'car', { d: 1.6 }); ev(C.L10 + .5, 'boing'); ev(C.L11, 'car', { d: C.L12 - C.L11 }); ev(C.L11 + .4, 'horn');
ev(tBreaks - .1, 'sputter'); ev(tHops, 'pop'); ev(tJogs, 'crowd', { d: 2.5 }); ev(C.L13, 'crowd', { d: tPoses - C.L13 + .5 }); ev(tPoses + .25, 'flash'); ev(tPoses + .9, 'flash'); ev(tShes, 'shimmer');
ev(tCheat - .1, 'scratch'); ev(tCheat, 'stamp'); ev(tBanned, 'stamp');
ev(C.L16, 'car', { d: 4 }); ev(tStry, 'pop'); ev(tRat, 'sting'); ev(tEgg + .1, 'crack'); ev(tAnother + .2, 'glug'); ev(tBrandy, 'pop');
ev(C.L19, 'warp', { d: C.L20 - C.L19 }); ev(C.L20, 'crowd', { d: 4 }); ev(tEight, 'deflate'); ev(tSlowest, 'trombone');
ev(C.L22, 'whoosh'); ev(C.L23, 'dice'); ev(tGamb + .1, 'trombone_s'); ev(tHitch - .12, 'cut'); ev(C.L24, 'cut'); ev(tCut24, 'snip'); ev(tCut24 + .25, 'snip'); ev(tShorts, 'pop');
ev(C.L25, 'chatter', { d: tEats - C.L25 }); ev(tEats, 'crunch'); ev(tEats + .4, 'crunch'); ev(tCramps, 'gurgle'); ev(tNap - .4, 'snore', { d: C.L27 - tNap + .4 }); ev(tWakes, 'boing'); ev(tFin27, 'crowd', { d: 2 });
ev(C.L28, 'whoosh'); ev(tChased - .1, 'bark'); ev(tChased + .5, 'bark'); ev(tChased + 1.1, 'bark'); ev(tDog, 'bark'); ev(C.L29, 'crowd', { d: 1.8 });
ev(C.L30, 'wind', { d: C.L31 - C.L30 }); ev(tLifted, 'ding'); ev(tNext, 'crowd', { d: 2.5 }); ev(C.L32, 'fanfare'); ev(C.L33 + .3, 'snore', { d: ENDCARD - C.L33 }); ev(ENDCARD, 'card');

// ---------------- the overlay: telops, chapter cards, captions ----------------
const ov = document.getElementById('ov').getContext('2d');
const snap = document.createElement('canvas'); snap.width = W; snap.height = H; const sctx = snap.getContext('2d');
const TEL = [
  { t0: .3, t1: C.L2, text: 'ST. LOUIS · 1904', y: 120, size: 84, col: '#FFFFFF', rot: -2, plate: '#2A3A7A' },
  { t0: w('L2', 'ridden') - .05, t1: tWinner - .12, text: 'RODE IN A CAR', y: 120, size: 92, col: '#FFD23F', rot: 3, plate: '#1B1213' },
  { t0: w('L2', 'rat') - .05, t1: C.L3, text: 'RAT POISON', y: 120, size: 110, col: '#FFFFFF', rot: -3, plate: '#C8202A' },
  { t0: tStill3 - .05, t1: CARDS[0].t0, text: '4TH PLACE', y: 130, size: 120, col: '#FFD23F', rot: -6, stamp: 1 },
  { t0: w('L4', 'august') - .05, t1: tWorlds - .1, text: 'AUGUST 30, 1904', y: 120, size: 96, col: '#FFFFFF', rot: -2, plate: '#2A3A7A' },
  { t0: tWorlds - .1, t1: tNinety - .12, text: "THE WORLD'S FAIR", y: 120, size: 96, col: '#FFD23F', rot: 2, plate: '#1B1213' },
  { t0: tNinety + .1, t1: C.L5, text: '90°F (32°C)', y: 120, size: 110, col: '#FFFFFF', rot: -4, plate: '#E8602A' },
  { t0: tTwenty5 - .05, t1: C.L6, text: '~25 MILES OF DIRT ROAD', y: 120, size: 84, col: '#FFFFFF', rot: 2, plate: '#8A5A2A' },
  { t0: C.L6 + .1, t1: C.L7, text: '32 RUNNERS', y: 120, size: 100, col: '#FFFFFF', rot: -3, plate: '#2A3A7A' },
  { t0: tBarely - .05, t1: tOrg - .12, text: 'WATER: BARELY ANY', y: 120, size: 92, col: '#FFFFFF', rot: 3, plate: '#2E7AA8' },
  { t0: tOrg - .05, t1: CARDS[1].t0, text: 'THE ORGANIZER', y: 790, x: 520, size: 70, col: '#FFFFFF', rot: -2, plate: '#2E2E36', sub: 'STUDYING DEHYDRATION' },
  { t0: tLorz9 - .1, t1: C.L10, text: 'FRED LORZ', y: 790, x: 460, size: 76, col: '#FFFFFF', rot: -2, plate: '#2A3A7A', sub: 'USA' },
  { t0: w('L11', 'ten') - .05, t1: C.L12, text: '10 MILES BY CAR', y: 120, size: 96, col: '#FFD23F', rot: -3, plate: '#2E5A3A' },
  { t0: tCheat - .03, t1: C.L15, text: 'HE CHEATED!', y: 140, size: 140, col: '#E8423A', rot: -6, stamp: 1 },
  { t0: tJoke - .1, t1: tBanned - .05, text: '"JUST A JOKE!"', y: 120, size: 96, col: '#FFFFFF', rot: 3, plate: '#1B1213' },
  { t0: tBanned - .03, t1: CARDS[2].t0, text: 'BANNED FOR LIFE', y: 140, size: 120, col: '#E8423A', rot: -5, stamp: 1 },
  { t0: tHicks - .1, t1: C.L17, text: 'THOMAS HICKS', y: 790, x: 480, size: 76, col: '#FFFFFF', rot: -2, plate: '#2A3A7A', sub: 'USA' },
  { t0: tStry - .05, t1: tRat - .12, text: 'STRYCHNINE', y: 120, size: 110, col: '#FFFFFF', rot: -3, plate: '#3A6A5A' },
  { t0: tRat - .05, t1: C.L18, text: '= RAT POISON ☠', y: 140, size: 120, col: '#E8423A', rot: -5, stamp: 1 },
  { t0: tAnother - .05, t1: C.L19, text: 'DOSE #2 + BRANDY', y: 120, size: 96, col: '#FFD23F', rot: 3, plate: '#6A3A1A' },
  { t0: tEight - .05, t1: tSlowest - .1, text: '−8 POUNDS', y: 120, size: 110, col: '#FFFFFF', rot: -3, plate: '#2A3A7A' },
  { t0: tSlowest - .1, t1: CARDS[3].t0, text: '3:28:53', y: 120, size: 120, col: '#FFD23F', rot: 3, plate: '#1B1213', sub: 'THE SLOWEST OLYMPIC MARATHON EVER' },
  { t0: tFelix - .1, t1: C.L23, text: 'FÉLIX CARVAJAL', y: 790, x: 500, size: 76, col: '#FFFFFF', rot: -2, plate: '#2A3A7A', sub: 'CUBA · MAILMAN' },
  { t0: tGamb - .05, t1: tHitch - .12, text: 'TRAVEL MONEY: $0', y: 120, size: 96, col: '#FFFFFF', rot: -3, plate: '#C8202A' },
  { t0: tHitch - .05, t1: C.L24, text: 'HITCHHIKED', y: 120, size: 100, col: '#FFD23F', rot: 3, plate: '#1B1213' },
  { t0: tShorts - .05, t1: C.L25, text: 'INSTANT SHORTS', y: 120, size: 100, col: '#FFFFFF', rot: -3, plate: '#2A3A7A' },
  { t0: tEats - .05, t1: C.L26, text: 'GREEN APPLES', y: 120, size: 100, col: '#FFFFFF', rot: 3, plate: '#4E8A36' },
  { t0: tNap - .1, t1: C.L27, text: 'NAP TIME', y: 120, size: 110, col: '#FFD23F', rot: -4, plate: '#1B1213' },
  { t0: w('L27', 'fourth') - .05, t1: CARDS[4].t0, text: '4TH PLACE', y: 140, size: 130, col: '#FFD23F', rot: -6, stamp: 1 },
  { t0: w('L28', 'len') - .1, t1: tChased - .12, text: 'LEN TAUNYANE', y: 790, x: 480, size: 76, col: '#FFFFFF', rot: -2, plate: '#2A3A7A', sub: 'SOUTH AFRICA' },
  { t0: w('L28', 'mile') - .05, t1: C.L29, text: '1 MILE OFF COURSE', y: 120, size: 96, col: '#FFFFFF', rot: 3, plate: '#C8202A' },
  { t0: w('L29', 'ninth') - .05, t1: CARDS[5].t0, text: '9TH PLACE', y: 140, size: 130, col: '#FFD23F', rot: -6, stamp: 1 },
  { t0: w('L30', 'never') - .05, t1: C.L31, text: 'MORE THAN HALF: DID NOT FINISH', y: 120, size: 80, col: '#FFFFFF', rot: -2, plate: '#5A3A6A' },
  { t0: tLifted - .05, t1: tNext - .12, text: 'BAN LIFTED', y: 140, size: 120, col: '#4EC84E', rot: -5, stamp: 1 },
  { t0: w('L31', 'boston') - .05, t1: C.L32, text: 'BOSTON MARATHON 1905: WINNER', y: 120, size: 80, col: '#FFD23F', rot: 2, plate: '#8A2A22' },
  { t0: w('L32', 'gold') - .1, t1: tCar32 - .1, text: 'GOLD 🥇', y: 120, size: 110, col: '#FFD23F', rot: -3, plate: '#1B1213' },
  { t0: w('L32', 'boston') - .1, t1: C.L33, text: 'BOSTON 🏆', y: 120, size: 110, col: '#FFFFFF', rot: 3, plate: '#8A2A22' },
  { t0: w('L33', 'nap') - .05, t1: ENDCARD, text: 'A REALLY GOOD NAP', y: 120, size: 100, col: '#FFD23F', rot: -3, plate: '#1B1213' },
];
function drawTelop(x, t) {
  const p = seg(t, x.t0, x.t0 + .25), sc = x.stamp ? lerp(2.2, 1, eo(p)) : back(p, 2.6), wob = 1 + .02 * Math.sin((t - x.t0) * 8);
  const text = typeof x.text === 'function' ? x.text(t) : x.text;
  ov.save(); ov.translate(x.x ?? W / 2, x.y); ov.rotate(x.rot * Math.PI / 180); ov.scale(sc * wob, sc * wob); if (x.stamp) ov.globalAlpha = clamp(p * 3);
  ov.font = `900 ${x.size}px Montserrat`; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  const tw = Math.min(1700, ov.measureText(text).width + 70), th = x.size * 1.4;
  if (x.plate) { ov.fillStyle = 'rgba(0,0,0,.85)'; ov.beginPath(); ov.roundRect(-tw / 2 + 10, -th / 2 + 12, tw, th, 26); ov.fill(); ov.fillStyle = x.plate; ov.beginPath(); ov.roundRect(-tw / 2, -th / 2, tw, th, 26); ov.fill(); }
  if (x.stamp) { ov.strokeStyle = x.col; ov.lineWidth = 14; ov.beginPath(); ov.roundRect(-tw / 2 + 5, -th / 2 + 8, tw - 10, th - 16, 18); ov.stroke(); }
  ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 20; ov.shadowOffsetY = 8; ov.lineWidth = x.size * .2; ov.strokeStyle = '#000'; ov.strokeText(text, 0, 4, 1640); ov.shadowColor = 'transparent'; ov.fillStyle = x.col; ov.fillText(text, 0, 4, 1640);
  if (x.sub) { ov.font = '900 40px Montserrat'; const sw = ov.measureText(x.sub).width + 44; ov.fillStyle = '#FFD23F'; ov.beginPath(); ov.roundRect(-sw / 2, x.size * .7 + 4, sw, 58, 16); ov.fill(); ov.fillStyle = '#1B1213'; ov.fillText(x.sub, 0, x.size * .7 + 35); }
  ov.restore();
}
// chapter cards: an aged 1904 programme page
const paper = document.createElement('canvas'); paper.width = W; paper.height = H; { const g = paper.getContext('2d'), gr = g.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, W * .7); gr.addColorStop(0, '#F4E8C8'); gr.addColorStop(1, '#C8A870'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  let s = 7; const R = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; for (let i = 0; i < 30000; i++) { g.fillStyle = `rgba(${R() < .5 ? '90,60,20' : '255,250,230'},${.06 * R()})`; g.fillRect(R() * W, R() * H, 2, 2); }
  g.strokeStyle = 'rgba(90,50,20,.75)'; g.lineWidth = 8; g.strokeRect(60, 60, W - 120, H - 120); g.lineWidth = 3; g.strokeRect(80, 80, W - 160, H - 160); }
const CARDTXT = [['THE WORST RACE', 'IN OLYMPIC HISTORY', 'ST. LOUIS · 1904'], ['CHAPTER 1', 'THE MAN IN THE CAR', ''], ['CHAPTER 2', 'THE MAN ON RAT POISON', ''], ['CHAPTER 3', 'THE MAILMAN', ''], ['CHAPTER 4', 'THE DOG', ''], ['CHAPTER 5', 'WHO REALLY WON?', ''], ['THE WORST RACE', 'IN OLYMPIC HISTORY', 'SOURCES IN THE DESCRIPTION']];
function drawCard(i, t, t0) {
  const [a, b, c] = CARDTXT[i], k = seg(t, t0, t0 + .35), zoom = 1 + (t - t0) * .02;
  ov.save(); ov.translate(W / 2, H / 2); ov.scale(zoom, zoom); ov.translate(-W / 2, -H / 2); ov.drawImage(paper, 0, 0); ov.restore();
  ov.save(); ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  const sc = back(k, 2.2); ov.translate(W / 2, H / 2); ov.scale(sc, sc);
  ov.font = '900 72px Montserrat'; ov.fillStyle = '#8A2A22'; ov.fillText(a, 0, -150);
  ov.font = '900 128px Montserrat'; ov.lineWidth = 16; ov.strokeStyle = '#2A1A10'; ov.strokeText(b, 0, 0, 1640); ov.fillStyle = '#F2C230'; ov.fillText(b, 0, 0, 1640);
  ov.fillStyle = '#2A1A10'; ov.fillRect(-300, 92, 600, 6); if (c) { ov.font = '800 54px Montserrat'; ov.fillText(c, 0, 160); }
  ov.restore();
}
const chunks = [];
TMJ.lines.forEach((l, li) => { let cur = []; const flush = () => { if (cur.length) chunks.push({ li, words: cur }); cur = []; };
  l.words.forEach(x => { const len = cur.reduce((a, y) => a + y.w.length + 1, 0) + x.w.length; if (cur.length && (len > 20 || cur.length >= 4)) flush(); cur.push(x); if (/[,.…!?:]$/.test(x.w) && x.w !== 'St.') flush(); }); flush(); });
chunks.forEach((c, i) => { const n = chunks[i + 1]; c.text = c.words.map(x => x.w).join(' '); c.a = c.words[0].t0 - .04; c.b = n ? Math.min(n.words[0].t0 - .04, c.words[c.words.length - 1].t1 + .6) : c.words[c.words.length - 1].t1 + .6; });
const CAPY = 965;
function drawCaption(t) {
  const c = chunks.find(c => t >= c.a && t < c.b); if (!c) return;
  const pop = back(seg(t, c.a, c.a + .12), 2.2), s = lerp(.7, 1, pop);
  ov.save(); ov.translate(W / 2, CAPY); ov.scale(s, s); ov.font = '900 82px Montserrat'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  ov.shadowColor = 'rgba(0,0,0,.45)'; ov.shadowBlur = 18; ov.shadowOffsetY = 6; ov.lineWidth = 20; ov.strokeStyle = '#000'; ov.strokeText(c.text, 0, 0, 1700);
  ov.shadowColor = 'transparent'; ov.fillStyle = '#FFFFFF'; ov.fillText(c.text, 0, 0, 1700); ov.restore();
}

// ---------------- render ----------------
function frame(sh, t) {
  const tt = t, u = seg(t, sh.t0, sh.t1);
  for (const [k, s] of Object.entries(SET)) s.visible = k === sh.set;
  light(sh.lt, sh.at);
  let c = sh.after ? null : sh.cam(tt, u); if (c) CAMP.copy(c.pos);
  sh.act(tt);
  if (!c) { c = sh.cam(tt, u); CAMP.copy(c.pos); }
  camera.position.copy(c.pos); sky.position.copy(c.pos); camera.up.set(0, 1, 0); camera.lookAt(c.look); camera.rotateZ(c.roll ?? 0); camera.fov = c.fov; camera.updateProjectionMatrix();
  ZS.forEach(z => { if (z.visible) z.quaternion.copy(camera.quaternion); });
  post.dof.focus = c.focus; post.dof.aper = c.aper; post.dof.maxCoc = 8;
  const f = sh.fpv ? Math.sin(seg(tt, sh.t0, sh.t1) * Math.PI) * sh.fpv : 0; zb.uniforms.amt.value = f * .09; zb.enabled = f > .02;
  scene.updateMatrixWorld(true); post.composer.render();
}
const A0 = +(QS.get('a') ?? 0), B0 = +(QS.get('b') ?? DUR);
function render(t) {
  const i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1), sh = SHOTS[i < 0 ? SHOTS.length - 1 : i];
  ov.clearRect(0, 0, W, H);
  if (sh.card !== undefined && !QS.get('poster')) { drawCard(sh.card, t, sh.t0); return; }
  frame(sh, t);
  if (QS.get('poster')) { ov.clearRect(0, 0, W, H); [['THE WORST RACE', 150, -3, '#FFFFFF', 130], ['IN OLYMPIC HISTORY', 300, -3, '#FFD23F', 120]].forEach(([text, y, rot, col, size]) => drawTelop({ t0: -9, text, y, size, col, rot }, t)); return; }
  if (QS.get('clean')) return;
  TEL.forEach(x => { if (t >= x.t0 && t < x.t1) drawTelop(x, t); }); drawCaption(t);
}
function texts(t) { return TEL.filter(x => typeof x.text === 'string' && t >= x.t0 + .3 && t < x.t1).map(x => ({ id: x.text, text: x.text, x0: 60, y0: x.y - x.size * .7, x1: W - 60, y1: x.y + x.size * .7 })); }
EV.sort((a, b) => a.t - b.t);
window.DUR = +(B0 - A0).toFixed(3); window.EV = EV; window.render = t => render(t + A0); window.TEXTS = t => texts(t + A0);
render(A0);
window.READY = true;
