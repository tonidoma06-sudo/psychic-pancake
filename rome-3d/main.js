// "SOLD! The Day Rome Was Auctioned" · 3D vertical Short (1080×1920).
// Every shot, action, telop and caption is placed from timing.json (the voice). render(t) is a pure function of t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makePost } from '/core/three/post.js';
import { C, mat, G, M, cyl, sph, laurel, textCanvas, texFrom, rng } from './kit.js';
import { makePerson, LOOK, POSE, setPose, mixPose, walkPose, blinkAt, spear, shield, paddle, gavel, faceLabels } from './person.js';
import { palace, forum, crowd, skyDome } from './sets.js';
import { camp, senate, road, troop } from './sets2.js';

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
const EV = []; const ev = (t, s, o = {}) => EV.push({ t: +t.toFixed(3), s, ...o });

// ---------------- renderer / post ----------------
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .45;
const camera = new THREE.PerspectiveCamera(40, W / H, .05, 900);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, ao: true, aoRadius: .6, aoThickness: 1, aoScale: 1.6, aoAmt: .7 });
post.bloom.strength = .35; post.bloom.threshold = .95; post.bloom.radius = .6;
const vg = post.vig.uniforms; vg.amt.value = .32; vg.sat.value = 1.15; vg.contrast.value = .15;
const sun = new THREE.DirectionalLight('#FFF1D6', 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .02;
scene.add(sun, sun.target); const hemi = new THREE.HemisphereLight('#BFD9FF', '#C9A27A', .7); scene.add(hemi);
const sky = skyDome('#3E4C8F', '#F7A26B'); scene.add(sky);
function light(o) {
  sun.color.set(o.col ?? '#FFF1D6'); sun.intensity = o.int ?? 3; sun.position.set(...o.pos); sun.target.position.set(...(o.tgt ?? [0, 0, 0]));
  const r = o.r ?? 14, c = sun.shadow.camera; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 1; c.far = o.far ?? 90; c.updateProjectionMatrix();
  hemi.color.set(o.hs ?? '#BFD9FF'); hemi.groundColor.set(o.hg ?? '#C9A27A'); hemi.intensity = o.hemi ?? .7;
  if (o.sky) { sky.visible = true; scene.background = null; const u = sky.material.uniforms; u.top.value.set(o.sky[0]); u.hor.value.set(o.sky[1]); u.sd.value.set(...(o.sunDir ?? [0, .2, -1])).normalize(); u.sc.value.set(o.sky[2] ?? '#FFE2A8'); }
  else { sky.visible = false; scene.background = new THREE.Color(o.bg ?? '#2B1A14'); }
  scene.environmentIntensity = o.env ?? .45; vg.warm.value = o.warm ?? 0; vg.fade.value = o.fade ?? 1;
}

// ---------------- the sets and the cast ----------------
const SET = { forum: forum(), palace: palace(), camp: camp(), senate: senate(), road: road() };
for (const s of Object.values(SET)) { s.visible = false; scene.add(s); }
const put = (set, look, x, y, z, ry = 0) => { const p = makePerson(look); p.P.position.set(x, y, z); p.P.rotation.y = ry; SET[set].add(p.P); return p; };
// forum
const F = SET.forum;
const auc = put('forum', LOOK.guard, -1.35, .9, .25, .45); const gv = gavel(); auc.props.add(gv);
const fCrowd = crowd(52, (i, R) => [(R() - .5) * 14, 3.4 + R() * 6], [C.terracotta, C.teal, C.blue, '#E8C547', C.pink, C.wool, C.green], 4); F.add(fCrowd);
const bid1 = put('forum', { ...LOOK.citizen, tunic: C.blue, hair: '#5A3A22' }, -1.6, 0, 4.6, Math.PI * .95), bid2 = put('forum', { ...LOOK.citizen, tunic: '#E8C547', hair: '#2A1C14', beard: '#2A1C14' }, 1.9, 0, 4.9, Math.PI * 1.05);
bid1.props.add(paddle('100')); bid2.props.add(paddle('500'));
// palace
const P = SET.palace, TH = P.userData.throne, SEATY = .75 + .55;
const emperor = put('palace', LOOK.emperor, 0, SEATY, -6.15);
const jul7 = put('palace', LOOK.julianus, 0, SEATY, -6.15); const jcrown = laurel(C.gold, .108, 24, .035); jcrown.position.y = .175; jcrown.rotation.x = -.15; jul7.head.add(jcrown);
const pg = [0, 1, 2, 3].map(i => { const g = put('palace', LOOK.guard, 0, 0, 0); const sp = spear(); g.props.add(sp); sp.rotation.x = -Math.PI / 2 + .1; const sh = shield(); g.spine.add(sh); sh.scale.setScalar(.85); sh.rotation.set(0, -Math.PI / 2 + .35, 0); sh.position.set(-.3, .18, .1); return g; });
const sev7 = put('palace', LOOK.general, 0, 0, 10); const sevSw = spear(); sev7.props.add(sevSw); sevSw.rotation.x = -Math.PI / 2 + .1;
const pTroop = troop(8, (i) => [(i % 4 - 1.5) * 1.1, 11 + Math.floor(i / 4) * 1.2, Math.PI], 'soldier', 3, { helmet: C.steel, crest: '#2A2A2A', tunic: C.redD, shield: '#7E1628' }); P.add(pTroop);
const crownFly = laurel(C.gold, .14, 24, .045); P.add(crownFly);
const dust = G(); P.add(dust); { const R = rng(4); for (let i = 0; i < 14; i++) { const b = M(sph(.5 + R() * .4, 14, 10), mat('#F2E6D2', { r: 1 }), dust, (R() - .5) * 1.6, 1 + R() * 1.6, (R() - .5) * 1.2); b.userData.ph = R() * 6; } for (let i = 0; i < 5; i++) { const s = M(new THREE.OctahedronGeometry(.18), mat(C.gold, { e: '#FFB000', ei: .6 }), dust, (R() - .5) * 2.4, 1.2 + R() * 2, (R() - .5) * 1.6 + .8); s.userData.star = 1; } }
// camp
const K = SET.camp;
const wallG1 = put('camp', LOOK.guard, -2.05, 8.2, .2, 0), wallG2 = put('camp', LOOK.guard, 2.05, 8.2, .2, 0);
const sulp = put('camp', LOOK.sulpicianus, -.4, 1.2, -11, 0); const sPad = paddle('20,000'); sulp.props.add(sPad);
const jul5 = put('camp', LOOK.julianus, 1.2, 1.0, 6.5, Math.PI); const jPad = paddle('25,000'); jul5.props.add(jPad);
const cart = G(); { cart.position.set(1.2, 0, 6.5); K.add(cart); M(new THREE.BoxGeometry(2.2, .5, 1.4), C.wood, cart, 0, .75, 0); for (const x of [-.8, .8]) for (const z of [-.75, .75]) { const wh = M(cyl(.45, .45, .1, 20), C.woodD, cart, x, .45, z); wh.rotation.x = Math.PI / 2; } }
const kIn = troop(40, (i, R) => [(i % 8 - 3.5) * 1.15 + (R() - .5) * .3, -6.4 + Math.floor(i / 8) * 1.2, Math.PI], 'soldier', 7); kIn.position.z = 0; K.add(kIn);
const kWall = troop(14, (i, R) => [(i - 6.5) * 1.5, -2.2, (R() - .5) * .4], 'soldier', 11); kWall.position.y = 6.25; K.add(kWall);
const COINS = 70, coinIM = new THREE.InstancedMesh(cyl(.06, .06, .015, 16), mat(C.gold, { m: .75, r: .25, e: '#6A3E00', ei: .25 }), COINS); coinIM.castShadow = true; K.add(coinIM);
const coinR = rng(21), coinD = Array.from({ length: COINS }, () => ({ vx: (coinR() - .5) * 5, vy: 4 + coinR() * 4, vz: 2 + coinR() * 5, sp: coinR() * 20, d: coinR() * .5 }));
// senate
const S = SET.senate;
const sTroop = troop(30, (i, R) => { const side = i < 15 ? -1 : 1, k = i % 15, tier = k % 3; return [side * (3.4 + tier * 1.6), -9 + Math.floor(k / 3) * 3.6 + (R() - .5) * .4, side * Math.PI / 2 * -1]; }, 'senator', 13);
S.add(sTroop); sTroop.userData.tierY = true;
const jul6 = put('senate', LOOK.julianus, 0, 0, 4, Math.PI);
const crowner = put('senate', LOOK.senator, -.9, 0, -5.6, .4); const scrown = laurel(C.gold, .14, 24, .045); crowner.props.add(scrown); scrown.position.y = -.1;
// road
const RD = SET.road, rx = RD.userData.roadX;
const sev = put('road', LOOK.general, 0, 0, 0); const sevSp = spear(); sev.props.add(sevSp); sevSp.rotation.x = -Math.PI / 2 + .1;
const army = troop(72, (i) => [(i % 6 - 2.5) * 1.1, 3 + Math.floor(i / 6) * 1.3, Math.PI], 'soldier', 17, { helmet: C.steel, crest: '#2A2A2A', tunic: C.redD, shield: '#7E1628' }); RD.add(army);
const vex = G(); RD.add(vex); M(cyl(.03, .03, 3.4, 8), C.woodD, vex, 0, 1.7, 0); M(new THREE.BoxGeometry(.9, .7, .03), C.red, vex, 0, 3, .05); M(new THREE.OctahedronGeometry(.25), mat(C.gold, { m: .7, r: .3 }), vex, 0, 3.6, 0);

// big camera-facing numbers (the bids), redrawn only when their text changes
function bigNumber(col = '#FFD23F') {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 360; const tex = texFrom(c);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true })); sp.scale.set(2.6, .9, 1); let last = '';
  sp.userData.set = (txt, sub) => { const k = txt + '|' + sub; if (k === last) return; last = k; const g = c.getContext('2d'); g.clearRect(0, 0, 1024, 360);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.font = '700 230px Fredoka'; g.lineWidth = 34; g.strokeStyle = '#3A1206'; g.strokeText(txt, 512, 150); g.fillStyle = col; g.fillText(txt, 512, 150);
    if (sub) { g.font = '700 64px Fredoka'; g.lineWidth = 14; g.strokeText(sub, 512, 312); g.fillStyle = '#FFFFFF'; g.fillText(sub, 512, 312); }
    tex.needsUpdate = true; };
  return sp;
}
const num20 = bigNumber(), num25 = bigNumber(); K.add(num20, num25);

// ---------------- key times (from the voice) ----------------
const L1 = LN.L1, tYear = w('L1', '193'), tSold = w('L1', 'sold'), tAuc = w('L1', 'auction');
const C2 = cut('L2'), tGuards = w('L2', 'guards'), tKill = w('L2', 'killed'), tEmp = w('L2', 'emperor');
const C3 = cut('L3'), tOff3 = w('L3', 'offered'), tThrone = w('L3', 'throne'), tHigh = w('L3', 'highest');
const C4 = cut('L4'), tFather = w('L4', 'father'), tEvery = w('L4', 'every'), t20 = w('L4', '20,000'), tCoins = w('L4', 'coins');
const C5 = cut('L5'), tSen = w('L5', 'senator'), tDid = w('L5', 'didius'), tBid = w('L5', 'bid'), t25 = w('L5', '25,000');
const C6 = cut('L6'), tWon = w('L6', 'won'), tSenate = w('L6', 'senate'), tEmp6 = w('L6', 'emperor');
const C7 = cut('L7'), t66 = w('L7', '66'), tRival = w('L7', 'rival'), tMarch = w('L7', 'marched'), tRome = w('L7', 'rome'), tAnd = w('L7', 'and'), tExec = w('L7', 'executed');
const C8 = cut('L8'), tBought = w('L8', 'bought'), tKept = w('L8', 'kept'), t66b = w('L8', '66'), tDays = w('L8', 'days');
const snapB = t => Math.round(t / B) * B;
const S1b = Math.max(1.5, snapB(tSold - .9)), S2b = Math.max(C2 + 2 * B, snapB(tKill - .2)), S4b = Math.max(C4 + 2 * B, snapB(tEvery - .3)), S5b = Math.max(C5 + 2 * B, snapB(tBid - .45));
const S7b = Math.max(C7 + 3 * B, snapB(tRival - .3)), S7c = Math.max(S7b + 3 * B, snapB(tAnd - .25)), S8b = Math.max(C8 + 3 * B, snapB(t66b - .6));

// sound events (the score reads these)
ev(0, 'open'); ev(tYear, 'sting'); ev(tSold - .02, 'gavel'); ev(tAuc, 'crowd');
ev(C2, 'cut', { set: 'palace' }); for (let k = 0; tGuards + k * B < tKill; k++) ev(tGuards + k * B, 'march'); ev(tKill, 'scuffle'); ev(tEmp, 'poof'); ev(tEmp + .5, 'roll');
ev(C3, 'cut', { set: 'camp' }); ev(tOff3, 'unroll'); ev(tThrone, 'banner'); ev(tHigh, 'crowd');
ev(C4, 'cut'); ev(tFather, 'sting'); for (let k = 0, tt = tEvery; tt < t20 - .02; k++, tt += B / 4) ev(tt, 'tick', { f: 700 + k * 40 }); ev(t20, 'slam'); ev(tCoins, 'coins'); ev(tCoins + .1, 'crowd');
ev(C5, 'whip'); ev(tDid, 'sting'); for (let k = 0, tt = tBid; tt < t25 - .02; k++, tt += B / 4) ev(tt, 'tick', { f: 1100 + k * 60 }); ev(t25, 'bigslam'); ev(t25 + .1, 'crowd');
ev(C6, 'cut', { set: 'senate' }); ev(tWon, 'fanfare'); ev(tSenate, 'clap'); ev(tEmp6, 'ding');
ev(C7, 'cut', { set: 'palace' }); ev(t66, 'timelapse'); ev(S7b, 'cut', { set: 'road' }); for (let tt = S7b; tt < S7c; tt += B) ev(tt, 'step');
ev(S7c, 'cut'); ev(S7c + .05, 'doors'); ev(tExec, 'doom'); ev(tExec + .3, 'roll');
[[0, 'open'], [C2, 'palace'], [C3, 'camp'], [C5, 'bid2'], [C6, 'senate'], [C7, 'lapse'], [S7b, 'road'], [S7c, 'doors'], [C8, 'end'], [LOOP, 'loop']].forEach(([t, n]) => ev(t, 'sec', { n }));
ev(C8, 'cut'); ev(tBought, 'stamp'); ev(tKept, 'stamp'); ev(t66b, 'stamp'); ev(tDays, 'bigslam'); ev(LOOP, 'loop');

// ---------------- the shots ----------------
const camAt = (pos, look, fov, focus, aper = 10) => ({ pos, look, fov, focus, aper });
const path = (u, ...ks) => { const n = ks.length - 1, k = Math.min(n - 1, Math.floor(u * n)), f = u * n - k; return ks[k].clone().lerp(ks[k + 1], ss(f)); };
const pose = (p, q, face, t, seed = 0) => setPose(p, q, face, blinkAt(t, seed));
const SHOTS = [
  // 1a · the hook: a crane down over the Forum at dusk onto the auction stage
  { t0: 0, t1: S1b, set: 'forum', lt: { pos: [-10, 7, 10], col: '#FFB877', int: 3, sky: ['#3E4C8F', '#F7A26B', '#FFD08A'], sunDir: [.4, .12, -1], hs: '#9DB0FF', hemi: .9, r: 16 },
    act: t => forumAct(t), cam: (t, u) => camAt(path(eio(u), V(0, 9, 16), V(.6, 4.5, 11), V(1.2, 2.6, 7.6)), path(eio(u), V(0, 2, 0), V(0, 2.1, 0), V(-.3, 2.2, 0)), 42, lerp(16, 7.8, u), 8) },
  // 1b · the gavel: low angle on the auctioneer and the crown, SOLD on "sold"
  { t0: S1b, t1: C2, set: 'forum', lt: { pos: [-10, 7, 10], col: '#FFB877', int: 3, sky: ['#3E4C8F', '#F7A26B', '#FFD08A'], sunDir: [.4, .12, -1], hs: '#9DB0FF', hemi: .9, r: 16 },
    act: t => forumAct(t), cam: (t, u) => { const sh = t >= tSold && t < tSold + .15 ? Math.sin((t - tSold) * 90) * .03 * (1 - (t - tSold) / .15) : 0; return camAt(V(.6 + u * .3, 1.45 + sh, 4.4 - u * .5), V(-.45, 2.45 + sh, .1), 40, 4.4, 7); } },
  // 2a · the throne room: guards march up the carpet (camera tracks behind them)
  { t0: C2, t1: S2b, set: 'palace', lt: { pos: [-6, 12, 4], tgt: [0, 0, -4], col: '#FFE6BE', int: 2.4, bg: '#2B1A14', r: 12 },
    act: t => palaceA(t), cam: (t, u) => camAt(V(.4, 1.5, lerp(6, 3.4, u)), V(0, 2.2, -6), 44, lerp(11, 8.6, u), 9) },
  // 2b · the emperor: shock, a cartoon scuffle cloud, then the empty throne and the wreath rolling down the steps
  { t0: S2b, t1: C3, set: 'palace', lt: { pos: [-6, 12, 4], tgt: [0, 0, -4], col: '#FFE6BE', int: 2.4, bg: '#2B1A14', r: 12 },
    act: t => palaceA(t), cam: (t, u) => camAt(V(.4, 2.0, lerp(-.6, -1.2, u)), V(0, 1.9, -6.2), 42, 5.3, 6) },
  // 3 · the camp wall: crane up to the guards unrolling FOR SALE
  { t0: C3, t1: C4, set: 'camp', lt: { pos: [-20, 12, 18], col: '#FFD3A0', int: 3.2, sky: ['#5C8FD6', '#FFD9A6', '#FFE2A8'], sunDir: [-.6, .25, .6], hemi: .8, r: 20 },
    act: t => campAct(t), cam: (t, u) => camAt(path(eio(u), V(2.4, 1.6, 17), V(1.6, 4.0, 15), V(1.0, 5.8, 13.6)), path(eio(u), V(0, 2.5, 0), V(0, 6.0, 0), V(0, 7.6, 0)), 46, lerp(17, 13.6, u), 6) },
  // 4a · inside: the father-in-law on the platform, soldiers below
  { t0: C4, t1: S4b, set: 'camp', lt: { pos: [-20, 12, 18], col: '#FFD3A0', int: 3.2, sky: ['#5C8FD6', '#FFD9A6', '#FFE2A8'], sunDir: [-.6, .25, .6], hemi: .8, r: 20 },
    act: t => campAct(t), cam: (t, u) => camAt(V(lerp(2.6, 1.8, u), lerp(2.6, 2.4, u), lerp(-5.4, -6.2, u)), V(-.4, 2.5, -11), 38, lerp(6.3, 5.3, u), 8) },
  // 4b · 20,000: low angle, the number races up, coins rain on the soldiers
  { t0: S4b, t1: C5, set: 'camp', lt: { pos: [-20, 12, 18], col: '#FFD3A0', int: 3.2, sky: ['#5C8FD6', '#FFD9A6', '#FFE2A8'], sunDir: [-.6, .25, .6], hemi: .8, r: 20 },
    act: t => campAct(t), cam: (t, u) => camAt(V(-1.6 + u * .6, 1.0, -6.6), V(-.4, 3.2, -11), 44, 4.8, 6) },
  // 5a · outside the wall: whip pan down from the wall to Julianus on his cart
  { t0: C5, t1: S5b, set: 'camp', lt: { pos: [-20, 12, 18], col: '#FFD3A0', int: 3.2, sky: ['#5C8FD6', '#FFD9A6', '#FFE2A8'], sunDir: [-.6, .25, .6], hemi: .8, r: 20 },
    act: t => campAct(t), cam: (t, u) => { const wp = eio(seg(t, C5, C5 + .55)), cp = V(2.8, 2.0, 3.0); const yaw = lerp(-2.39, -.43, wp), pit = lerp(.93, .14, wp); return camAt(cp, V(cp.x + Math.sin(yaw) * Math.cos(pit), cp.y + Math.sin(pit), cp.z + Math.cos(yaw) * Math.cos(pit)), 40, lerp(6, 3.9, wp), 7); } },
  // 5b · 25,000: close on Julianus, the number slams above him, the wall cheers
  { t0: S5b, t1: C6, set: 'camp', lt: { pos: [-20, 12, 18], col: '#FFD3A0', int: 3.2, sky: ['#5C8FD6', '#FFD9A6', '#FFE2A8'], sunDir: [-.6, .25, .6], hemi: .8, r: 20 },
    act: t => campAct(t), cam: (t, u) => camAt(V(2.3 - u * .3, 1.7, 3.9 + u * .3), V(1.2, 2.7, 6.5), 40, 2.9, 4) },
  // 6 · the Senate: Julianus walks down the aisle, the crown, an orbit
  { t0: C6, t1: C7, set: 'senate', lt: { pos: [6, 14, 2], tgt: [0, 0, 0], col: '#FFE2B5', int: 2.6, bg: '#3A2616', r: 14, env: .55 },
    act: t => senateAct(t), cam: (t, u) => { const c = jul6.P.position, a = lerp(.35, -.5, eio(u)); return camAt(V(c.x + Math.sin(a) * 3.2, 1.75, c.z - Math.cos(a) * 3.2), V(c.x, 1.55, c.z), 44, 3.2, 6); } },
  // 7a · 66 days: time-lapse on the throne (the sun sweeps, the tablet counts)
  { t0: C7, t1: S7b, set: 'palace', lt: { pos: [-6, 12, 4], tgt: [0, 0, -4], col: '#FFE6BE', int: 2.4, bg: '#2B1A14', r: 12 },
    act: t => palaceB(t), cam: (t, u) => camAt(V(lerp(-.4, -.1, u), 2.05, lerp(.6, -.2, u)), V(1.0, 1.9, -5.8), 44, lerp(6.6, 5.8, u), 6) },
  // 7b · the march on Rome: a drone shot along the army
  { t0: S7b, t1: S7c, set: 'road', lt: { pos: [40, 50, 30], tgt: [0, 0, 0], col: '#FFF4DE', int: 3.2, sky: ['#4B8FE0', '#CFE6F7', '#FFF6D8'], sunDir: [.5, .6, .3], hemi: .9, r: 40, far: 160 },
    act: t => roadAct(t), cam: (t, u) => { const z = lerp(-4, -14, u); return camAt(V(rx(z) + lerp(10, 5, u), lerp(11, 4.5, u), z + lerp(26, 14, u)), V(rx(z - 8), 1.2, z - 4), 44, lerp(28, 15, u), 2); } },
  // 7c · the doors burst open: Severus in the doorway; on "executed" the crown flies off
  { t0: S7c, t1: C8, set: 'palace', lt: { pos: [-6, 12, 4], tgt: [0, 0, -4], col: '#FFB9A0', int: 1.6, bg: '#1A0E0C', r: 12, warm: .4 },
    act: t => palaceC(t), cam: (t, u) => t < tExec - .2 ? camAt(V(.2, 2.3, -4.2), V(0, 2.4, 9), 40, 13, 5) : camAt(V(1.0, 1.8, -1.9), V(0, 2.5, -6.2), 42, 4.5, 5) },
  // 8a · the crown rolls across the empty floor
  { t0: C8, t1: S8b, set: 'palace', lt: { pos: [-6, 12, 4], tgt: [0, 0, -4], col: '#FFE6BE', int: 2.0, bg: '#1A0E0C', r: 12 },
    act: t => palaceD(t), cam: (t, u) => { const c = crownFly.position; return camAt(V(c.x + 1.2, .5, c.z + 1.6), V(c.x, .25, c.z), 40, 2.0, 5); } },
  // 8b · back to the Forum: the crown on the block again (loops into the opening)
  { t0: S8b, t1: LOOP, set: 'forum', lt: { pos: [-10, 7, 10], col: '#FFB877', int: 3, sky: ['#3E4C8F', '#F7A26B', '#FFD08A'], sunDir: [.4, .12, -1], hs: '#9DB0FF', hemi: .9, r: 16 },
    act: t => forumAct(-1), cam: (t, u) => camAt(path(eio(u), V(1.2, 2.6, 7.6), V(.6, 4.5, 11), V(0, 9, 16)), V(0, 2.1, 0), 42, lerp(7.8, 16, u), 8) },
  { t0: LOOP, t1: DUR + 1, set: 'forum', loop: true },
];
SHOTS[SHOTS.length - 1] = { ...SHOTS[0], t0: LOOP, t1: DUR + 1, act: t => forumAct(0), cam: () => SHOTS[0].cam(0, 0) };

// ---------------- acting ----------------
function forumAct(t) {
  const end = t < 0; if (end) t = 0;
  // the auctioneer raises the gavel, slams on "sold"
  const pre = seg(t, tSold - .35, tSold), aft = t - tSold;
  let q = POSE.hammerUp; if (t >= tSold - .35 && t < tSold) q = mixPose(POSE.hammerUp, POSE.hammer, ei(pre)); else if (t >= tSold) q = POSE.hammer;
  pose(auc, q, t >= tSold ? 'shout' : 'smug', t, 1);
  auc.P.position.y = .9; auc.P.rotation.y = .45;
  const up = t >= tAuc ? 1 : seg(t, 0, 1) * .3;
  fCrowd.userData.update(t, { paddles: t >= tAuc ? .8 : .35, hop: t >= tSold ? .8 : .25 });
  pose(bid1, t >= tAuc ? POSE.raiseR : mixPose(POSE.stand, POSE.raiseR, .25), t >= tAuc ? 'shout' : 'calm', t, 2);
  pose(bid2, t >= tAuc + B / 2 ? POSE.raiseR : POSE.stand, t >= tAuc + B / 2 ? 'shout' : 'calm', t, 3);
  const cr = F.userData.crown; cr.rotation.y = t * .6; cr.position.y = 1.5 + Math.sin(t * 2.5) * .03;
  const tag = F.userData.tag; tag.rotation.z = .15 + Math.sin(t * 2) * .05;
}
function guardWalk(g, i, t, x, z0, z1, ta, tb, ry = Math.PI) {
  const u = seg(t, ta, tb), z = lerp(z0, z1, u); g.P.position.set(x, 0, z); g.P.rotation.y = ry;
  const walking = t > ta && t < tb; pose(g, walking ? walkPose(POSE.hold, (t - ta) * 1.0 + i * .5, 1.2) : POSE.hold, 'angry', t, 10 + i);
}
function palaceA(t) {
  P.userData.anim(t); jul7.P.visible = false; sev7.P.visible = false; pTroop.visible = false; crownFly.visible = false; P.userData.tablet.visible = false; P.userData.doors.forEach((d, i) => d.rotation.y = 0); P.userData.doorLight.intensity = 0; P.userData.outside.visible = false;
  const gone = t >= tKill + .25;
  emperor.P.visible = !gone; emperor.P.position.set(0, SEATY, -6.15);
  pose(emperor, t < tGuards ? POSE.sitProud : POSE.sitScared, t < tGuards ? 'happy' : t < tKill ? 'shock' : 'scared', t, 5);
  // four guards march in pairs from the doors up the carpet and stop at the dais
  pg.forEach((g, i) => { const x = (i % 2 ? 1 : -1) * (.7 + Math.floor(i / 2) * .6); guardWalk(g, i, t, x, 6 + Math.floor(i / 2) * 1.2, -3.4 + Math.floor(i / 2) * 1.1, C2 + i * .1, tKill - .1); if (t >= tKill - .1) { g.P.position.z -= ss(seg(t, tKill - .1, tKill + .2)) * 1.2; pose(g, POSE.point, 'angry', t, i); } });
  // the cartoon scuffle cloud
  dust.visible = t >= tKill && t < tEmp + .15; dust.position.set(0, .9, -5.9); dust.scale.setScalar(.75);
  dust.children.forEach((b, i) => { const k = 1 + .15 * Math.sin(t * 30 + (b.userData.ph ?? i)); if (b.userData.star) b.rotation.set(t * 8, t * 6, 0); else b.scale.setScalar(k * (1 - .6 * seg(t, tEmp, tEmp + .15))); });
  // the emperor's wreath drops onto the steps and rolls
  const wr = emperor.crown;
  if (t >= tEmp) { crownFly.visible = true; const tt = t - tEmp; crownFly.position.set(Math.min(tt, 1) * .8, Math.max(.95 - tt * .5, .1 + Math.abs(Math.sin(tt * 9)) * .2 * Math.exp(-tt * 3)), -5.6 + Math.min(tt, 1.2) * 1.8); crownFly.rotation.set(Math.PI / 2 - .2, 0, tt * 6); crownFly.children.forEach(c => c.material = mat(C.green)); }
}
function palaceB(t) {
  P.userData.anim(t); emperor.P.visible = false; pg.forEach(g => g.P.visible = false); dust.visible = false; sev7.P.visible = false; pTroop.visible = false; crownFly.visible = false; P.userData.doors.forEach(d => d.rotation.y = 0); P.userData.doorLight.intensity = 0; P.userData.outside.visible = false;
  jul7.P.visible = true; jcrown.visible = true; P.userData.tablet.visible = true;
  const u = seg(t, t66, tMarch); const day = t < t66 ? 1 : Math.max(1, Math.min(66, Math.round(1 + 65 * Math.pow(u, 1.5))));
  P.userData.tabletText.userData.redraw([{ text: 'DAY', size: 120, y: 120, color: '#F4E9D2' }, { text: String(day), size: 300, y: 330, color: day === 66 ? '#FF8A5B' : '#FFD57A' }], { w: 600, h: 500 });
  // time-lapse: the sun swings across the room
  const a = (t - C7) * 2.4; sun.position.set(Math.cos(a) * 14, 12, Math.sin(a) * 8 + 2); sun.color.setHSL(.09, .7, .62 + .1 * Math.sin(a));
  pose(jul7, t < tRival ? POSE.sitProud : POSE.sit, t < tRival ? 'smug' : 'meh', t, 7);
}
function palaceC(t) {
  P.userData.anim(t); emperor.P.visible = false; pg.forEach(g => g.P.visible = false); dust.visible = false; P.userData.tablet.visible = true;
  jul7.P.visible = t < tExec + .3; jcrown.visible = t < tExec;
  pose(jul7, POSE.sitScared, t >= tExec - .1 ? 'shock' : 'scared', t, 7);
  const op = eo(seg(t, S7c, S7c + .35)); P.userData.doors.forEach((d, i) => d.rotation.y = (i ? -1 : 1) * op * 1.6); P.userData.doorLight.intensity = 60 * op; P.userData.outside.visible = true;
  sev7.P.visible = true; sev7.P.position.set(0, 0, lerp(10.5, 7, eo(seg(t, S7c + .2, tExec)))); sev7.P.rotation.y = Math.PI; pose(sev7, t >= tExec - .2 ? POSE.point : walkPose(POSE.hold, t * 1.1, 1.3), 'angry', t, 9);
  pTroop.visible = true; pTroop.position.z = lerp(0, -3, eo(seg(t, S7c + .2, tExec))); pTroop.userData.update(t, { march: 2 });
  crownFly.visible = t >= tExec; if (t >= tExec) { const tt = t - tExec; crownFly.position.set(tt * 1.4, Math.max(.12, 2.55 + tt * 3 - 9 * tt * tt), -6.1 + tt * 1.5); crownFly.rotation.set(tt * 9, tt * 4, 0); crownFly.children.forEach(c => c.material = mat(C.gold, { r: .35, m: .6 })); }
  dust.visible = t >= tExec + .25 && t < tExec + .55; dust.position.set(0, 1.0, -6); dust.scale.setScalar(.7); dust.children.forEach(b => b.scale.setScalar(1 - seg(t, tExec + .25, tExec + .55) * .7));
}
function palaceD(t) {
  P.userData.anim(t); emperor.P.visible = false; jul7.P.visible = false; pg.forEach(g => g.P.visible = false); dust.visible = false; sev7.P.visible = false; pTroop.visible = false; P.userData.tablet.visible = false;
  P.userData.doors.forEach(d => d.rotation.y = 0); P.userData.doorLight.intensity = 0; P.userData.outside.visible = false;
  crownFly.visible = true; const u = eo(seg(t, C8, S8b)); crownFly.position.set(lerp(.3, .9, u), .14, lerp(-3.6, 3.2, u)); crownFly.rotation.set(Math.PI / 2, 0, -u * 14 * (1 - u * .3)); crownFly.children.forEach(c => c.material = mat(C.gold, { r: .35, m: .6 }));
}
function campAct(t) {
  // the banner unrolls from "offered" to "throne"
  const un = t < C3 ? 1 : seg(t, tOff3, tThrone + .2), cl = K.userData.cloth;
  cl.scale.y = Math.max(.02, eo(un)); cl.position.y = -2.1 * cl.scale.y;
  pose(wallG1, t >= tHigh && t < C4 ? POSE.cheer : POSE.holdBoth, t >= tHigh ? 'happy' : 'shout', t, 11); pose(wallG2, t >= tHigh + B / 2 && t < C4 ? POSE.cheer : POSE.holdBoth, 'shout', t, 12);
  kWall.userData.update(t, { hop: t >= t25 || (t >= tHigh && t < C4) ? 1 : 0 });
  kIn.userData.update(t, { hop: t >= tCoins ? 1 : t >= t20 ? .5 : 0 });
  // Sulpicianus raises 20,000; the number races up from "every"
  pose(sulp, t >= t20 - .1 ? POSE.raiseR : t >= tFather ? POSE.point : POSE.stand, t >= t20 - .1 ? 'shout' : 'smug', t, 13);
  const v20 = t < tEvery ? 0 : Math.round(20000 * eo(seg(t, tEvery, t20)) / 100) * 100;
  num20.visible = t >= tEvery && t < C5; num20.position.set(-.4, 4.1, -11); num20.userData.set(v20.toLocaleString('en-US'), 'PER SOLDIER');
  const sl = t >= t20 ? back(seg(t, t20, t20 + .25), 3) : 1; num20.scale.set(2.6 * sl, .9 * sl, 1);
  const lid = K.userData.chestLid; lid.rotation.x = -1.9 * eo(seg(t, tCoins - .3, tCoins));
  coinIM.visible = t >= tCoins && t < C5;
  if (coinIM.visible) { const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s3 = new THREE.Vector3(1, 1, 1); coinD.forEach((c, i) => { const tt = Math.max(0, t - tCoins - c.d * .3); v.set(1.6 + c.vx * tt, 1.7 + c.vy * tt - 4.9 * tt * tt, -10.4 + c.vz * tt); if (v.y < .05) v.y = .05; q.setFromEuler(e.set(c.sp * tt, c.sp * tt * .7, 0)); coinIM.setMatrixAt(i, new THREE.Matrix4().compose(v, q, s3)); }); coinIM.instanceMatrix.needsUpdate = true; }
  // Julianus outside on his cart (only once his line begins): raises 25,000 on "bid"
  jul5.P.visible = cart.visible = t >= C5 - .01;
  pose(jul5, t >= tBid - .15 ? POSE.raiseR : t >= tSen ? POSE.fistUp : POSE.stand, t >= tBid ? 'shout' : t >= tSen ? 'smug' : 'calm', t, 14);
  const v25 = t < tBid ? 20000 : Math.round(lerp(20000, 25000, eo(seg(t, tBid, t25))) / 100) * 100;
  num25.visible = t >= S5b && t < C6; num25.position.set(.75, 3.5, 6.5); num25.userData.set(v25.toLocaleString('en-US'), 'PER SOLDIER');
  const s25 = t >= t25 ? back(seg(t, t25, t25 + .25), 3.2) : .8; num25.scale.set(1.3 * s25, .45 * s25, 1);
  jPad.visible = t >= tBid - .15; sPad.visible = t >= t20 - .1;
}
function senateAct(t) {
  sTroop.children.forEach(() => {}); sTroop.userData.update(t, { hop: t >= tWon ? .35 : 0 });
  // raise the senators onto their tiers
  const u = eo(seg(t, C6, tSenate)); jul6.P.position.set(0, 0, lerp(-1.2, -4.4, u)); jul6.P.rotation.y = Math.PI * 0 + 0;
  jul6.P.rotation.y = 0; pose(jul6, t < tSenate ? walkPose(POSE.stand, (t - C6) * 1.1, 1) : t >= tEmp6 ? POSE.cheer : POSE.stand, t >= tEmp6 ? 'happy' : 'smug', t, 15);
  jul6.P.rotation.y = Math.PI;
  crowner.P.position.set(-.75, 0, -5.4); crowner.P.rotation.y = .9;
  const crownOn = t >= tEmp6 - .15; scrown.visible = !crownOn;
  pose(crowner, t >= tSenate ? mixPose(POSE.stand, POSE.holdBoth, ss(seg(t, tSenate, tEmp6 - .15))) : POSE.stand, 'meh', t, 16);
  if (!jul6.head.userData.crown) { const c = laurel(C.gold, .108, 24, .035); c.position.y = .175; c.rotation.x = -.15; jul6.head.add(c); jul6.head.userData.crown = c; }
  jul6.head.userData.crown.visible = crownOn; jul6.head.userData.crown.position.y = .175 + .25 * (1 - eo(seg(t, tEmp6 - .15, tEmp6 + .1)));
}
function roadAct(t) {
  const z = lerp(-4, -14, seg(t, S7b, S7c));
  sev.P.position.set(rx(z), 0, z); sev.P.rotation.y = Math.PI; pose(sev, walkPose(POSE.hold, t * 1.1, 1.3), 'angry', t, 17);
  army.position.set(rx(z), 0, z); army.userData.update(t, { march: 2.2 });
  vex.position.set(rx(z) + 1.6, 0, z + 2.2);
}
// the senators sit on their tiers: lift each by its tier height once
{ const tierY = i => { const k = i % 15, tier = k % 3; return .5 + tier * .5; }; const up = sTroop.userData.update; sTroop.userData.update = (t, u) => { up(t, u); sTroop.children.forEach(im => { const m = new THREE.Matrix4(); for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m); m.elements[13] += tierY(i); im.setMatrixAt(i, m); } im.instanceMatrix.needsUpdate = true; }); }; }

// ---------------- the 2D overlay: telops + word-by-word captions ----------------
const ov = document.getElementById('ov').getContext('2d');
const TEL = [
  { t0: tYear, t1: S1b + .6 > C2 ? C2 : Math.max(tYear + 2, S1b), text: '193 AD', y: 300, size: 120, col: '#FFD23F', rot: -4 },
  { t0: tSold, t1: C2, text: 'SOLD!', y: 640, size: 240, col: '#FF5A6E', rot: -7 },
  { t0: tFather - .05, t1: C5, text: 'FATHER-IN-LAW', y: 1300, size: 84, col: '#FFFFFF', rot: -3, plate: '#2FA39A' },
  { t0: tSen, t1: C6, text: 'DIDIUS JULIANUS', y: 1300, size: 84, col: '#FFFFFF', rot: 3, plate: '#6C2E8C' },
  { t0: tWon, t1: C7, text: 'SOLD!', y: 420, size: 240, col: '#FFD23F', rot: -6 },
  { t0: tRival, t1: tExec, text: 'RIVAL GENERAL', y: 1300, size: 84, col: '#FFFFFF', rot: -3, plate: '#B3243A' },
  { t0: tExec, t1: C8, text: "TIME'S UP!", y: 380, size: 190, col: '#FFD23F', rot: -6 },
  { t0: tBought, t1: LOOP, text: 'PRICE: 25,000 / SOLDIER', y: 300, size: 76, col: '#FFFFFF', rot: -2, plate: '#6C2E8C' },
  { t0: t66b, t1: LOOP, text: 'KEPT: 66 DAYS', y: 430, size: 110, col: '#FFD23F', rot: 3, plate: '#B3243A' },
];
TEL.forEach(x => { x.pop = 1; });
function drawTelop(x, t) {
  const p = seg(t, x.t0, x.t0 + .28), sc = back(p, 2.6), wob = 1 + .02 * Math.sin((t - x.t0) * 8);
  ov.save(); ov.translate(540, x.y); ov.rotate(x.rot * Math.PI / 180); ov.scale(sc * wob, sc * wob);
  ov.font = `700 ${x.size}px Fredoka`; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
  if (x.plate) { const tw = ov.measureText(x.text).width + 70, th = x.size * 1.45; ov.fillStyle = 'rgba(20,10,10,.9)'; ov.beginPath(); ov.roundRect(-tw / 2 + 10, -th / 2 + 12, tw, th, 30); ov.fill(); ov.fillStyle = x.plate; ov.beginPath(); ov.roundRect(-tw / 2, -th / 2, tw, th, 30); ov.fill(); }
  ov.lineWidth = x.size * .17; ov.strokeStyle = '#1B1213'; ov.strokeText(x.text, 0, 4); ov.fillStyle = x.col; ov.fillText(x.text, 0, 4); ov.restore();
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

// ---------------- render ----------------
let curSet = null;
function render(t) {
  const sh = SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
  for (const [k, s] of Object.entries(SET)) s.visible = k === sh.set;
  light(sh.lt); const tt = sh.loop ? 0 : t;
  sh.act(tt);
  const u = sh.loop ? 0 : seg(t, sh.t0, sh.t1), c = sh.cam(tt, u);
  camera.position.copy(c.pos); camera.lookAt(c.look); camera.fov = c.fov; camera.updateProjectionMatrix();
  post.dof.focus = c.focus; post.dof.aper = c.aper; post.dof.maxCoc = 8;
  // a quick white flash on every cut
  const cuts = SHOTS.map(s => s.t0).filter(x => x > 0); let fl = 0; for (const x of cuts) if (t >= x && t < x + .08) fl = Math.max(fl, .35 * (1 - (t - x) / .08));
  faceLabels(scene, camera);
  post.composer.render();
  ov.clearRect(0, 0, W, H);
  if (fl > 0) { ov.fillStyle = `rgba(255,255,255,${fl})`; ov.fillRect(0, 0, W, H); }
  if (t < LOOP) { TEL.forEach(x => { if (t >= x.t0 && t < x.t1) drawTelop(x, t); }); drawCaptions(t); }
}
function texts(t) {
  if (t >= LOOP) return [];
  return TEL.filter(x => t >= x.t0 + .3 && t < x.t1).map(x => ({ id: x.text, text: x.text, x0: 60, y0: x.y - x.size * .7, x1: 1020, y1: x.y + x.size * .7, ...(x.text.endsWith('!') ? { pass: true } : {}) }));
}
EV.sort((a, b) => a.t - b.t);
const QS = new URLSearchParams(location.search), A0 = +(QS.get('a') ?? 0), B0 = +(QS.get('b') ?? DUR);   // render a stretch [a, b) of the film clock
window.DUR = +(B0 - A0).toFixed(3); window.EV = EV; window.render = t => render(t + A0); window.TEXTS = t => texts(t + A0);
render(A0);
window.READY = true;
