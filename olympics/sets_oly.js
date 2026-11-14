// sets_oly.js · "The Worst Race in Olympic History": the 1904 marathon course (a dusty country road through Missouri farmland:
// fences, a farm and its gate, a cornfield, an apple orchard, a well, mile posts, telegraph poles), Francis Field (the cinder
// track, a packed wooden grandstand, flags, the finish posts and tape) with the World's Fair palaces beyond, and a New Orleans
// dice room. Props: a 1904 touring car, a dog, the trainers' bottles, eggs, apples, dice, a press camera, a medal.
import * as THREE from 'three';
import { TM, toon, G, RAMP } from './toon.js';
import { textPlane } from './kit.js';
import { ctex, std, put, M, V, planks, house, hills, rng } from './sets_base.js';

const dirt = (rep, col = '#C89A62') => ctex(512, 512, (g, w, h) => { const R = rng(5); g.fillStyle = col; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${R() < .5 ? '120,80,40' : '240,210,160'},${.18 * R()})`; g.fillRect(R() * w, R() * h, 2 + R() * 4, 2 + R() * 3); }
  for (const x of [150, 362]) { g.fillStyle = 'rgba(110,70,35,.22)'; g.fillRect(x - 22, 0, 44, h); } }, rep);
const grass = rep => ctex(512, 512, (g, w, h) => { const R = rng(3); g.fillStyle = '#7FA846'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 220; i++) { g.fillStyle = R() < .5 ? 'rgba(60,100,30,.18)' : 'rgba(190,200,90,.16)'; g.beginPath(); g.arc(R() * w, R() * h, 10 + R() * 40, 0, 7); g.fill(); }
  for (let i = 0; i < 7000; i++) { g.strokeStyle = R() < .5 ? 'rgba(50,90,25,.3)' : 'rgba(200,210,110,.28)'; g.lineWidth = 1.5; const x = R() * w, y = R() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - .5) * 3, y - 6); g.stroke(); } }, rep);
const cinder = rep => ctex(512, 512, (g, w, h) => { const R = rng(9); g.fillStyle = '#A8644A'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${R() < .5 ? '80,40,30' : '220,160,130'},${.2 * R()})`; g.fillRect(R() * w, R() * h, 2, 2); } }, rep);

// ---------------- the marathon course ----------------
// the road runs along x at z = 0 (4 m wide); south (-z): fence, the farm, the well, the orchard; north (+z): telegraph poles, the cornfield
export const ROAD = { farmGate: V(-24, 0, -3), well: V(-8, 0, -4.2), orchard: V(38, 0, -9), corn: [12, 70, 4.5, 40], mile9: V(6, 0, -2.6), signX: -46 };
export function country() {
  const g = G();
  M(new THREE.PlaneGeometry(900, 900), std({ map: grass([160, 160]) }), g, 0, -.01, 0).rotation.x = -Math.PI / 2;
  const road = M(new THREE.PlaneGeometry(420, 4.2), std({ map: dirt([80, 1]) }), g, 0, .004, 0); road.rotation.x = -Math.PI / 2;
  for (const s of [-1, 1]) { const v = M(new THREE.PlaneGeometry(420, .8), std({ color: '#9AA25A', transparent: true, opacity: .55 }), g, 0, .006, s * 2.45); v.rotation.x = -Math.PI / 2; v.castShadow = false; }
  // fence along the south side, with the farm gate gap
  const NP = 90, post = new THREE.InstancedMesh(new THREE.BoxGeometry(.12, 1.1, .12), std({ color: '#8A6A44' }), NP), rail = new THREE.InstancedMesh(new THREE.BoxGeometry(2.0, .08, .05), std({ color: '#9A7A50' }), NP * 2);
  let pi = 0, ri = 0; for (let i = 0; i < NP; i++) { const x = -90 + i * 2; if (Math.abs(x - ROAD.farmGate.x) < 1.6) continue; put(post, pi++, x, .55, -3.0); put(rail, ri++, x + 1, .75, -3.0); put(rail, ri++, x + 1, .4, -3.0); }
  post.count = pi; rail.count = ri; post.castShadow = rail.castShadow = true; g.add(post, rail);
  // the farm: house, red barn, the gate
  house(g, -30, -15, 0, { w: 7, h: 4.6, d: 6, cols: 3, rows: 2, wall: '#EFE6CF', shutters: '#2E5A3A', roofC: '#5A4A44', chims: [1], seed: 3 });
  const barn = G(); barn.position.set(-19, 0, -19); g.add(barn);
  M(new THREE.BoxGeometry(8, 5, 7), std({ color: '#A8322A' }), barn, 0, 2.5, 0);
  const sh = new THREE.Shape(); sh.moveTo(-4.3, 0); sh.lineTo(-2.6, 2.2); sh.lineTo(0, 3.3); sh.lineTo(2.6, 2.2); sh.lineTo(4.3, 0); sh.closePath(); const rg = new THREE.ExtrudeGeometry(sh, { depth: 7.4, bevelEnabled: false }); rg.translate(0, 0, -3.7);
  M(rg, std({ color: '#5A4A44' }), barn, 0, 5, 0); M(new THREE.BoxGeometry(2.6, 3.2, .1), std({ color: '#F4F1EA' }), barn, 0, 1.6, 3.52); M(new THREE.BoxGeometry(2.4, 3.0, .12), std({ color: '#8A2A22' }), barn, 0, 1.6, 3.53);
  const gate = G(); gate.position.copy(ROAD.farmGate); g.add(gate); g.userData.gate = gate;
  for (let k = 0; k < 4; k++) M(new THREE.BoxGeometry(2.6, .1, .05), std({ color: '#B89A6A' }), gate, 1.3, .25 + k * .25, 0);
  // the well
  const wl = G(); wl.position.copy(ROAD.well); g.add(wl);
  const ring = M(new THREE.CylinderGeometry(.62, .66, .75, 18, 1, true), std({ color: '#8A8478', side: THREE.DoubleSide }), wl, 0, .38, 0);
  M(new THREE.CircleGeometry(.6, 18), std({ color: '#1A1A1E' }), wl, 0, .5, 0).rotation.x = -Math.PI / 2;
  for (const s of [-1, 1]) M(new THREE.BoxGeometry(.1, 1.7, .1), std({ color: '#6A4A2E' }), wl, s * .66, .85, 0);
  const wr = M(new THREE.BoxGeometry(1.7, .06, 1.3), std({ color: '#5A4A44' }), wl, 0, 1.75, 0); wr.rotation.z = 0;
  const bucket = M(new THREE.CylinderGeometry(.16, .13, .22, 12), std({ color: '#8A6A44' }), wl, .3, .87, .1); g.userData.bucket = bucket;
  const wsign = textPlane([{ text: 'WATER', size: 120, y: 128, color: '#2A1A10', weight: 700, font: 'Fredoka' }], .9, .3, { w: 512, h: 256, bg: '#E8DCC0', border: '#5A3A22', bw: 12, round: 10 }); wsign.position.set(0, 1.35, .7); wl.add(wsign);
  // mile posts
  const mile = (x, txt, z = -2.6) => { const mp = G(); mp.position.set(x, 0, z); g.add(mp); M(new THREE.BoxGeometry(.12, 1.4, .12), std({ color: '#6A4A2E' }), mp, 0, .7, 0);
    const t = textPlane([{ text: txt, size: 130, y: 140, color: '#1A1416', weight: 900, font: 'Montserrat' }], 1.0, .45, { w: 600, h: 270, bg: '#F2EAD6', border: '#2A1A10', bw: 14, round: 8 }); t.position.set(0, 1.35, .07); mp.add(t); return mp; };
  mile(ROAD.mile9.x, 'MILE 9'); mile(-70, 'MILE 4'); mile(80, 'MILE 19');
  const sp = G(); sp.position.set(ROAD.signX, 0, -2.7); g.add(sp); M(new THREE.BoxGeometry(.12, 2.0, .12), std({ color: '#6A4A2E' }), sp, 0, 1.0, 0);
  const st = textPlane([{ text: 'ST. LOUIS →', size: 110, y: 120, color: '#1A1416', weight: 900, font: 'Montserrat' }], 1.4, .38, { w: 800, h: 220, bg: '#E8DCC0', border: '#2A1A10', bw: 12, round: 8 }); st.position.set(0, 1.75, .07); sp.add(st);
  const st2 = textPlane([{ text: '700 MILES', size: 100, y: 110, color: '#8A2A22', weight: 900, font: 'Montserrat' }], 1.1, .3, { w: 700, h: 200, bg: '#E8DCC0', border: '#2A1A10', bw: 12, round: 8 }); st2.position.set(0, 1.35, .07); sp.add(st2);
  // telegraph poles on the north side
  const tp = new THREE.InstancedMesh(new THREE.CylinderGeometry(.09, .12, 7, 8), std({ color: '#5A4430' }), 16), cb = new THREE.InstancedMesh(new THREE.BoxGeometry(1.2, .1, .1), std({ color: '#5A4430' }), 16);
  for (let i = 0; i < 16; i++) { put(tp, i, -150 + i * 22, 3.5, 3.4); put(cb, i, -150 + i * 22, 6.6, 3.4, Math.PI / 2); } g.add(tp, cb);
  for (const dy of [6.5, 6.2]) { const w = M(new THREE.CylinderGeometry(.008, .008, 330, 4), toon('#2A2420'), g, 15, dy, 3.4); w.rotation.z = Math.PI / 2; w.castShadow = false; }
  // the cornfield
  const [cx0, cx1, cz0, cz1] = ROAD.corn, NCO = 2200, R = rng(13);
  const stalk = new THREE.ConeGeometry(.16, 2.2, 5); stalk.translate(0, 1.1, 0);
  const corn = new THREE.InstancedMesh(stalk, std({ color: '#7E9A3A', flatShading: true }), NCO);
  for (let i = 0; i < NCO; i++) { const row = i % 30, x = cx0 + R() * (cx1 - cx0), z = cz0 + row * ((cz1 - cz0) / 30) + (R() - .5) * .3; put(corn, i, x, 0, z, R() * 6, .9 + R() * .4, .8 + R() * .5, .9 + R() * .4, (R() - .5) * .15, (R() - .5) * .15); }
  corn.castShadow = true; corn.receiveShadow = true; g.add(corn);
  const cg = M(new THREE.PlaneGeometry(cx1 - cx0, cz1 - cz0), std({ color: '#6A7A32' }), g, (cx0 + cx1) / 2, .01, (cz0 + cz1) / 2); cg.rotation.x = -Math.PI / 2;
  // the apple orchard
  const NTR = 14, trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.14, .2, 1.6, 8), std({ color: '#6A4A2E' }), NTR), can = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.4, 1), std({ color: '#4E8A36', flatShading: true }), NTR);
  const apples = new THREE.InstancedMesh(new THREE.SphereGeometry(.07, 10, 8), std({ color: '#FFFFFF', roughness: .5 }), NTR * 14); let ai = 0; g.userData.trees = [];
  for (let i = 0; i < NTR; i++) { const x = ROAD.orchard.x + (i % 5) * 3.4 - 6.8 + (Math.floor(i / 5) % 2) * 1.7, z = ROAD.orchard.z - Math.floor(i / 5) * 3.6 + 2.2; put(trunks, i, x, .8, z); put(can, i, x, 2.2, z, R() * 3, 1, .85, 1); g.userData.trees.push(V(x, 0, z));
    for (let k = 0; k < 14; k++) { const a = R() * 6.3, b = R() * 1.2 - .2; put(apples, ai, x + Math.sin(a) * 1.25 * Math.cos(b), 2.2 + Math.sin(b) * 1.1, z + Math.cos(a) * 1.25 * Math.cos(b)); apples.setColorAt(ai++, new THREE.Color(R() < .55 ? '#8EC23A' : '#D8302A')); } }
  apples.instanceColor.needsUpdate = true; [trunks, can, apples].forEach(m => { m.castShadow = true; g.add(m); });
  // oaks and hedges in the fields
  const NO = 70, ot = new THREE.InstancedMesh(new THREE.CylinderGeometry(.25, .4, 3, 8), std({ color: '#5A4430' }), NO), oc = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.6, 1), std({ color: '#5E8A34', flatShading: true }), NO * 2);
  for (let i = 0; i < NO; i++) { let x, z; do { x = (R() - .5) * 400; z = (R() < .5 ? -1 : 1) * (14 + R() * 120); } while ((x > cx0 - 4 && x < cx1 + 4 && z > 0 && z < cz1 + 4) || (x > 20 && x < 55 && z < 0 && z > -25) || (x > -40 && x < -10 && z < 0 && z > -30));
    const s = .8 + R() * .8; put(ot, i, x, 1.5 * s, z, 0, s, s, s); put(oc, i * 2, x, 4.2 * s, z, R() * 3, s, s * .8, s); put(oc, i * 2 + 1, x + 1.2 * s, 3.6 * s, z + .6 * s, R() * 3, s * .7, s * .6, s * .7); }
  [ot, oc].forEach(m => { m.castShadow = true; g.add(m); });
  hills(g, ['#6E9A48', '#5E8A3E', '#80A858'], 18, 170, 300, 5, -1);
  return g;
}

// ---------------- Francis Field and the World's Fair ----------------
// the home straight runs along x at z ∈ [6.5, 11.5]; the finish posts stand at x = 0; the grandstand is north (z 14..26); the fair is south
export const FIELD = { finishX: 0, trackZ: 9, standZ: 15, gateX: 34 };
export function stadium() {
  const g = G();
  M(new THREE.PlaneGeometry(900, 900), std({ map: grass([160, 160]) }), g, 0, -.01, 0).rotation.x = -Math.PI / 2;
  // the cinder oval: two straights + two bends (a ring shape)
  const sh = new THREE.Shape(), hole = new THREE.Path(); const oval = (p, r, L) => { p.moveTo(-L, -r); p.lineTo(L, -r); p.absarc(L, 0, r, -Math.PI / 2, Math.PI / 2, false); p.lineTo(-L, r); p.absarc(-L, 0, r, Math.PI / 2, Math.PI * 1.5, false); };
  oval(sh, 11.5, 30); oval(hole, 6.5, 30); sh.holes.push(hole);
  const tg = new THREE.ShapeGeometry(sh, 24); tg.rotateX(-Math.PI / 2); { const p = tg.attributes.position, uv = []; for (let i = 0; i < p.count; i++) uv.push(p.getX(i) / 6, p.getZ(i) / 6); tg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); }
  const track = M(tg, std({ map: cinder([1, 1]) }), g, 0, .006, 0); track.position.z = 0; track.scale.z = -1;
  for (const z of [7.75, 9, 10.25]) { const l = M(new THREE.PlaneGeometry(60, .05), std({ color: '#F4F1EA' }), g, 0, .012, z); l.rotation.x = -Math.PI / 2; l.castShadow = false; }
  M(new THREE.PlaneGeometry(.12, 5), std({ color: '#F4F1EA' }), g, FIELD.finishX, .013, 9).rotation.x = -Math.PI / 2;
  // finish posts + tape
  for (const z of [6.4, 11.6]) { M(new THREE.CylinderGeometry(.06, .06, 1.8, 10), std({ color: '#F4F1EA' }), g, FIELD.finishX, .9, z); M(new THREE.SphereGeometry(.09, 10, 8), std({ color: '#C8202A' }), g, FIELD.finishX, 1.82, z); }
  const tape = M(new THREE.BoxGeometry(.02, .06, 5.2), std({ color: '#F4F1EA' }), g, FIELD.finishX, 1.15, 9); g.userData.tape = tape;
  const fb = textPlane([{ text: 'FINISH', size: 150, y: 128, color: '#FFFFFF', weight: 900, font: 'Montserrat' }], 2.4, .55, { w: 900, h: 220, bg: '#2A3A7A', border: '#F4F1EA', bw: 14, round: 10 }); fb.position.set(FIELD.finishX + .04, 2.2, 9); fb.rotation.y = Math.PI / 2; g.add(fb);
  const fb2 = fb.clone(); fb2.position.x = FIELD.finishX - .04; fb2.rotation.y = -Math.PI / 2; g.add(fb2);
  M(new THREE.BoxGeometry(.075, .53, 2.37), std({ color: '#F4F1EA' }), g, FIELD.finishX, 2.2, 9);
  M(new THREE.BoxGeometry(.06, .06, 5.4), std({ color: '#2A3A7A' }), g, FIELD.finishX, 2.2, 9);
  // the wooden grandstand with its crowd, a roof on posts, bunting and flags
  const gs = G(); gs.position.set(0, 0, FIELD.standZ); g.add(gs);
  for (let k = 0; k < 7; k++) M(new THREE.BoxGeometry(56, .5, 1.6), std({ map: planks('#9A7A50', [14, 1]) }), gs, 0, .25 + k * .5, 1 + k * 1.5);
  M(new THREE.BoxGeometry(56, 4, .3), std({ color: '#7A5A3A' }), gs, 0, 2, 11.5);
  for (let k = 0; k < 9; k++) M(new THREE.CylinderGeometry(.12, .12, 6.4, 8), std({ color: '#F4F1EA' }), gs, -26 + k * 6.5, 3.2, .6);
  const roof = M(new THREE.BoxGeometry(58, .25, 13), std({ color: '#5A6A7A' }), gs, 0, 6.5, 5.5); roof.rotation.x = -.08;
  const bunt = ctex(512, 64, (c, w, h) => { for (let k = 0; k < 16; k++) { c.fillStyle = ['#C8202A', '#F4F1EA', '#2A3A7A'][k % 3]; c.beginPath(); c.moveTo(k * 32, 0); c.lineTo(k * 32 + 32, 0); c.lineTo(k * 32 + 16, h); c.fill(); } }, [8, 1]);
  const bn = M(new THREE.PlaneGeometry(56, .5), new THREE.MeshStandardMaterial({ map: bunt, transparent: true, side: THREE.DoubleSide, alphaTest: .1 }), gs, 0, 6.05, .5); bn.castShadow = false;
  // the crowd: instanced bodies + heads + hats
  const NC = 900, body = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.2, .3, 4, 8), std({ color: '#FFFFFF' }), NC), head = new THREE.InstancedMesh(new THREE.SphereGeometry(.17, 12, 8), std({ color: '#F6EEE6' }), NC), hat = new THREE.InstancedMesh(new THREE.CylinderGeometry(.24, .24, .05, 12), std({ color: '#FFFFFF' }), NC);
  const R = rng(21), cols = ['#3A3A44', '#5A4A3A', '#2E3A5A', '#7A6A5A', '#F4F1EA', '#8A3A3A', '#4A5A4A', '#C8B89A'], hcols = ['#E8D8A8', '#1E1A22', '#3A3A44', '#F4F1EA', '#C8A060'];
  g.userData.crowd = { body, head, hat, n: NC, base: [] };
  for (let i = 0; i < NC; i++) { const k = i % 7, x = -27 + R() * 54, z = FIELD.standZ + 1 + k * 1.5 + (R() - .5) * .3, y = .5 + k * .5; g.userData.crowd.base.push([x, y, z, R() * 6.3]);
    body.setColorAt(i, new THREE.Color(cols[(R() * cols.length) | 0])); hat.setColorAt(i, new THREE.Color(hcols[(R() * hcols.length) | 0])); }
  [body, head, hat].forEach(m => { m.castShadow = false; m.frustumCulled = false; g.add(m); }); body.instanceColor.needsUpdate = hat.instanceColor.needsUpdate = true;
  for (const x of [-26, -13, 0, 13, 26]) { M(new THREE.CylinderGeometry(.05, .05, 4, 6), std({ color: '#F4F1EA' }), gs, x, 8.4, 3); const fl = ctex(150, 90, (c, w, h) => { for (let k = 0; k < 13; k++) { c.fillStyle = k % 2 ? '#F4F1EA' : '#B8242E'; c.fillRect(0, k * h / 13, w, h / 13 + 1); } c.fillStyle = '#2A3A7A'; c.fillRect(0, 0, w * .42, h * 7 / 13); });
    const f = M(new THREE.PlaneGeometry(1.5, .9, 6, 2), new THREE.MeshStandardMaterial({ map: fl, side: THREE.DoubleSide }), gs, x + .78, 9.8, 3); f.castShadow = false; (g.userData.flags ??= []).push(f); }
  // the gate the marathon men enter by
  const gt = G(); gt.position.set(FIELD.gateX, 0, 9); g.add(gt);
  for (const z of [-3.2, 3.2]) M(new THREE.BoxGeometry(.8, 4.4, .8), std({ color: '#E8E0CC' }), gt, 0, 2.2, z);
  M(new THREE.BoxGeometry(.9, .9, 7.2), std({ color: '#E8E0CC' }), gt, 0, 4.6, 0);
  const gb = textPlane([{ text: 'OLYMPIC GAMES 1904', size: 96, y: 110, color: '#2A1A10', weight: 900, font: 'Montserrat' }], 6.4, .8, { w: 1400, h: 220 }); gb.position.set(-.47, 4.6, 0); gb.rotation.y = -Math.PI / 2; gt.add(gb);
  // the press camera on its tripod, an officials' table, the big thermometer
  const pc = G(); pc.position.set(FIELD.finishX - 2.6, 0, 5.2); g.add(pc); g.userData.pcam = pc;
  for (let k = 0; k < 3; k++) { const l = M(new THREE.CylinderGeometry(.015, .015, 1.35, 6), toon('#5A3A22'), pc, Math.sin(k * 2.1) * .2, .63, Math.cos(k * 2.1) * .2); l.rotation.set(Math.cos(k * 2.1) * .3, 0, -Math.sin(k * 2.1) * .3); }
  TM(new THREE.BoxGeometry(.32, .3, .36), '#2A2420', pc, 0, 1.4, 0, .006); const lens = TM(new THREE.CylinderGeometry(.07, .08, .14, 14), '#C8962E', pc, 0, 1.4, .24, .004); lens.rotation.x = Math.PI / 2;
  const flash = M(new THREE.SphereGeometry(.3, 12, 8), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .9 }), pc, .25, 1.75, .1); flash.visible = false; pc.userData.flash = flash;
  const th = G(); th.position.set(-7, 0, 13.4); th.rotation.y = Math.PI; g.add(th); g.userData.therm = th;
  M(new THREE.BoxGeometry(1.0, 3.2, .12), std({ color: '#E8DCC0' }), th, 0, 1.8, 0); M(new THREE.CylinderGeometry(.08, .08, 2.4, 10), std({ color: '#FFFFFF', transparent: true, opacity: .6 }), th, 0, 1.9, .1);
  M(new THREE.SphereGeometry(.18, 14, 10), std({ color: '#D8202A' }), th, 0, .55, .1); const merc = M(new THREE.CylinderGeometry(.05, .05, 1, 8), std({ color: '#D8202A' }), th, 0, 1.2, .1); merc.geometry.translate(0, .5, 0); merc.position.y = .62; th.userData.merc = merc;
  const tl = textPlane([{ text: '°F', size: 120, y: 90, color: '#2A1A10', weight: 900, font: 'Montserrat' }], .5, .25, { w: 300, h: 150 }); tl.position.set(0, 3.2, .08); th.add(tl);
  // the World's Fair across the way: white palaces, a domed hall, a lagoon
  const fair = G(); fair.position.set(0, 0, -70); g.add(fair); const white = std({ color: '#F4EEE0' }), gold = std({ color: '#E2B848', metalness: .5, roughness: .4 });
  M(new THREE.PlaneGeometry(120, 26), std({ color: '#3E8AB8', roughness: .2, metalness: .1 }), fair, 0, .02, 4).rotation.x = -Math.PI / 2;
  for (const [x, z, w, h, d] of [[-50, -10, 34, 9, 14], [50, -10, 34, 9, 14], [-60, 22, 26, 8, 12], [60, 22, 26, 8, 12]]) { M(new THREE.BoxGeometry(w, h, d), white, fair, x, h / 2, z); for (let k = 0; k < w / 2.4; k++) M(new THREE.CylinderGeometry(.35, .35, h - 1, 10), white, fair, x - w / 2 + 1.2 + k * 2.4, (h - 1) / 2, z + d / 2 + .5); M(new THREE.SphereGeometry(4, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), gold, fair, x, h, z); }
  M(new THREE.CylinderGeometry(14, 15, 14, 28), white, fair, 0, 7, -28); M(new THREE.SphereGeometry(13, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), gold, fair, 0, 14, -28); M(new THREE.SphereGeometry(2, 12, 8), white, fair, 0, 27.5, -28);
  for (let k = 0; k < 7; k++) M(new THREE.BoxGeometry(34 - k * 3, .6, 3), white, fair, 0, .3 + k * .9, -12 - k * 2.2);
  for (const x of [-20, 20]) { M(new THREE.CylinderGeometry(.8, 1, 18, 12), white, fair, x, 9, -6); M(new THREE.SphereGeometry(1.3, 12, 8), gold, fair, x, 18.6, -6); }
  // a Ferris wheel on the skyline
  const fw = G(); fw.position.set(-95, 0, -40); g.add(fw); M(new THREE.TorusGeometry(18, .3, 6, 40), std({ color: '#C8C8D0' }), fw, 0, 20, 0); for (let k = 0; k < 12; k++) { const sp = M(new THREE.BoxGeometry(.2, 36, .2), std({ color: '#C8C8D0' }), fw, 0, 20, 0); sp.rotation.z = k / 12 * Math.PI; }
  hills(g, ['#6E9A48', '#5E8A3E'], 10, 180, 300, 7, -1);
  return g;
}
export function animCrowd(set, t, hype = 0) { const c = set.userData.crowd; if (!c) return; const _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), s1 = new THREE.Vector3(1, 1, 1);
  c.base.forEach(([x, y, z, ph], i) => { const j = hype * Math.max(0, Math.sin(t * 9 + ph * 3)) * .22 + Math.sin(t * 1.5 + ph) * .02; _m.compose(V(x, y + .35 + j, z), _q, s1); c.body.setMatrixAt(i, _m); _m.compose(V(x, y + .78 + j, z), _q, s1); c.head.setMatrixAt(i, _m); _m.compose(V(x, y + .94 + j, z), _q, s1); c.hat.setMatrixAt(i, _m); });
  c.body.instanceMatrix.needsUpdate = c.head.instanceMatrix.needsUpdate = c.hat.instanceMatrix.needsUpdate = true;
  (set.userData.flags ?? []).forEach((f, i) => { const p = f.geometry.attributes.position; if (!f.userData.b) f.userData.b = Float32Array.from(p.array); const b = f.userData.b; for (let k = 0; k < p.count; k++) p.setZ(k, Math.sin(b[k * 3] * 4 - t * 6 + i) * .08 * (b[k * 3] + .75)); p.needsUpdate = true; }); }

// ---------------- a New Orleans dice room ----------------
export function saloon() {
  const g = G();
  const wall = ctex(512, 512, (c, w, h) => { c.fillStyle = '#5A2E22'; c.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 64) { c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x, 0, 4, h); } c.fillStyle = '#3A1E16'; c.fillRect(0, h * .62, w, h * .38); }, [4, 1]);
  M(new THREE.PlaneGeometry(14, 10), std({ map: planks('#5A3A22', [4, 4]) }), g, 0, 0, 0).rotation.x = -Math.PI / 2;
  M(new THREE.PlaneGeometry(14, 5), std({ map: wall }), g, 0, 2.5, -3.5);
  for (const s of [-1, 1]) { const w = M(new THREE.PlaneGeometry(10, 5), std({ map: wall }), g, s * 5, 2.5, 1.5); w.rotation.y = -s * Math.PI / 2; }
  const tb = G(); tb.position.set(0, 0, -.6); g.add(tb); g.userData.table = tb;
  M(new THREE.CylinderGeometry(.85, .85, .08, 32), std({ color: '#2E6A3E', roughness: .9 }), tb, 0, .82, 0); M(new THREE.TorusGeometry(.85, .06, 8, 32), std({ color: '#5A3A22' }), tb, 0, .84, 0).rotation.x = Math.PI / 2; M(new THREE.CylinderGeometry(.12, .3, .8, 12), std({ color: '#3A2416' }), tb, 0, .4, 0);
  const lamp = G(); lamp.position.set(0, 2.6, -.6); g.add(lamp); M(new THREE.ConeGeometry(.45, .3, 18, 1, true), std({ color: '#2E5A3A', side: THREE.DoubleSide }), lamp, 0, 0, 0); M(new THREE.SphereGeometry(.1, 10, 8), new THREE.MeshBasicMaterial({ color: '#FFE6A0' }), lamp, 0, -.08, 0);
  M(new THREE.CylinderGeometry(.01, .01, 1.5, 4), toon('#1A1416'), lamp, 0, .9, 0);
  const sign = textPlane([{ text: 'NEW ORLEANS', size: 110, y: 120, color: '#F2D890', weight: 900, font: 'Montserrat' }], 2.4, .5, { w: 1000, h: 220, bg: '#2A1410', border: '#C8962E', bw: 12, round: 10 }); sign.position.set(0, 3.3, -3.45); g.add(sign);
  return g;
}

// ---------------- props ----------------
export function car(col = '#2E5A3A') {   // a 1904 open touring car (rear entrance tonneau), brass lamps, wooden spoked wheels
  const g = G(), W = .01, brass = '#D8A838'; const body = G(); g.add(body); g.userData.body = body;
  TM(new THREE.BoxGeometry(2.7, .5, 1.25), col, body, 0, .72, 0, W);
  TM(new THREE.BoxGeometry(.8, .45, 1.0), col, body, 1.2, .78, 0, W);   // bonnet
  TM(new THREE.BoxGeometry(.06, .5, 1.05), '#2A2420', body, 1.62, .78, 0, W);
  for (const [x, w] of [[.25, .7], [-.85, .9]]) { TM(new THREE.BoxGeometry(w, .2, 1.15), '#5A2A22', body, x, 1.02, 0, W * .7); TM(new THREE.BoxGeometry(.12, .5, 1.15), '#5A2A22', body, x - w / 2, 1.25, 0, W * .7); }
  const col_ = TM(new THREE.CylinderGeometry(.025, .025, .6, 8), '#2A2420', body, .72, 1.15, .28, 0); col_.rotation.z = .7;
  const sw = TM(new THREE.TorusGeometry(.17, .02, 6, 20), '#2A2420', body, .55, 1.37, .28, 0); sw.rotation.set(0, Math.PI / 2, .7);
  for (const z of [-.42, .42]) { const l = TM(new THREE.CylinderGeometry(.1, .1, .16, 14), brass, body, 1.72, 1.02, z, W * .6); l.rotation.z = Math.PI / 2; M(new THREE.CircleGeometry(.085, 14), new THREE.MeshBasicMaterial({ color: '#FFF4D0' }), body, 1.81, 1.02, z).rotation.y = Math.PI / 2; }
  TM(new THREE.CylinderGeometry(.04, .04, .3, 8), brass, body, 1.1, 1.08, .55, 0);
  const wheels = []; for (const [x, z] of [[1.0, .68], [1.0, -.68], [-.95, .68], [-.95, -.68]]) { const wh = G(); wh.position.set(x, .42, z); g.add(wh); wheels.push(wh);
    TM(new THREE.TorusGeometry(.38, .06, 8, 24), '#1A1A1A', wh, 0, 0, 0, W * .6); for (let k = 0; k < 10; k++) { const s = M(new THREE.BoxGeometry(.03, .7, .03), toon('#C8A060'), wh); s.rotation.z = k / 10 * Math.PI; } M(new THREE.CylinderGeometry(.07, .07, .1, 10), toon(brass), wh).rotation.x = Math.PI / 2; }
  for (const s of [-1, 1]) TM(new THREE.BoxGeometry(2.0, .04, .3), '#1E1A1A', body, .05, .5, s * .7, 0);
  g.userData.wheels = wheels; g.userData.seatF = V(.25, 1.12, 0); g.userData.seatB = V(-.85, 1.12, 0);
  return g;
}
export function dog() {   // a scruffy farm dog with a gallop
  const g = G(), W = .008, c1 = '#8A5A34', c2 = '#F2E6D2';
  const body = G(); body.position.y = .42; g.add(body); g.userData.body = body;
  const tr = TM(new THREE.CapsuleGeometry(.14, .42, 4, 12), c1, body, 0, 0, 0, W); tr.rotation.z = Math.PI / 2;
  const hd = G(); hd.position.set(.34, .14, 0); body.add(hd); g.userData.head = hd;
  TM(new THREE.SphereGeometry(.13, 16, 12), c1, hd, 0, 0, 0, W); const sn = TM(new THREE.CapsuleGeometry(.065, .1, 4, 10), c2, hd, .13, -.04, 0, W); sn.rotation.z = Math.PI / 2;
  TM(new THREE.SphereGeometry(.03, 8, 6), '#1A1416', hd, .24, -.02, 0, 0);
  for (const s of [-1, 1]) { const e = TM(new THREE.SphereGeometry(.026, 8, 6), '#1A1416', hd, .09, .05, s * .07, 0); const br = TM(new THREE.BoxGeometry(.06, .015, .02), '#1A1416', hd, .09, .09, s * .07, 0); br.rotation.x = s * .5; br.rotation.y = -.3 * s;
    const ear = TM(new THREE.ConeGeometry(.05, .12, 6), '#5A3A22', hd, -.02, .12, s * .08, W * .6); ear.rotation.x = s * .3; }
  const jaw = G(); jaw.position.set(.08, -.08, 0); hd.add(jaw); g.userData.jaw = jaw; TM(new THREE.BoxGeometry(.16, .03, .08), '#C8506A', jaw, .06, 0, 0, 0);
  const tail = G(); tail.position.set(-.33, .06, 0); body.add(tail); g.userData.tail = tail; const tl = TM(new THREE.CylinderGeometry(.02, .03, .22, 8), c1, tail, 0, .1, 0, W); tl.rotation.z = .4;
  const legs = []; for (const [x, z] of [[.22, .08], [.22, -.08], [-.22, .08], [-.22, -.08]]) { const l = G(); l.position.set(x, -.08, z); body.add(l); TM(new THREE.CylinderGeometry(.035, .03, .3, 8), c1, l, 0, -.15, 0, W * .7); TM(new THREE.SphereGeometry(.04, 8, 6), c2, l, .02, -.3, 0, 0); legs.push(l); }
  g.userData.legs = legs; return g;
}
export function poseDog(d, t, run = 1) { const u = d.userData, ph = t * 16; u.legs.forEach((l, i) => l.rotation.z = Math.sin(ph + (i < 2 ? 0 : Math.PI) + (i % 2) * .5) * .9 * run); u.body.position.y = .42 + Math.abs(Math.sin(ph)) * .06 * run; u.body.rotation.z = Math.sin(ph) * .08 * run; u.tail.rotation.z = Math.sin(t * 20) * .5; u.jaw.rotation.z = -Math.abs(Math.sin(t * 11)) * .5; }
export function bottle(label, col = '#3A5A3A', big = false) { const g = G(); const s = big ? 1.5 : 1; TM(new THREE.CylinderGeometry(.045 * s, .05 * s, .16 * s, 14), col, g, 0, .08 * s, 0, .004); TM(new THREE.CylinderGeometry(.018 * s, .03 * s, .07 * s, 10), col, g, 0, .19 * s, 0, .004); TM(new THREE.CylinderGeometry(.02 * s, .02 * s, .03 * s, 8), '#8A6A44', g, 0, .24 * s, 0, 0);
  const t = textPlane([{ text: label, size: 76, y: 70, color: '#1A1416', weight: 900, font: 'Montserrat' }, { text: big ? '' : '☠', size: 70, y: 150, color: '#1A1416', weight: 900 }], .085 * s, .1 * s, { w: 300, h: 220, bg: '#F2EAD6', round: 8 }); t.position.set(0, .085 * s, .052 * s); g.add(t); return g; }
export function egg() { const g = G(); const e = TM(new THREE.SphereGeometry(.04, 14, 10), '#F7F1E4', g, 0, 0, 0, .003); e.scale.y = 1.3; return g; }
export function cup() { const g = G(); const pr = [[0, 0], [.04, 0], [.05, .09], [.048, .1]].map(([r, y]) => new THREE.Vector2(r, y)); const c = TM(new THREE.LatheGeometry(pr, 16), '#E8E0CC', g, 0, 0, 0, .003); c.material = c.material.clone(); c.material.side = THREE.DoubleSide; M(new THREE.CircleGeometry(.044, 14), std({ color: '#F2E8C0' }), g, 0, .085, 0).rotation.x = -Math.PI / 2; return g; }
export function apple(col = '#8EC23A') { const g = G(); TM(new THREE.SphereGeometry(.05, 12, 10), col, g, 0, 0, 0, .003); TM(new THREE.CylinderGeometry(.004, .004, .03, 4), '#5A3A22', g, 0, .05, 0, 0); return g; }
export function dice() { const g = G(); for (const x of [-.06, .06]) { const d = TM(new THREE.BoxGeometry(.07, .07, .07), '#F4F1EA', g, x, .035, 0, .003); for (let k = 0; k < 1; k++) M(new THREE.SphereGeometry(.012, 8, 6), toon('#C8202A'), d, 0, .036, 0); } return g; }
export function medal(loop = false) { const g = G(); TM(new THREE.CylinderGeometry(.07, .07, .012, 24), '#E8B830', g, 0, 0, 0, .004).rotation.x = Math.PI / 2;
  if (loop) { const r = M(new THREE.TorusGeometry(.1, .014, 6, 28), toon('#2A3A9A'), g, 0, .2, 0); r.scale.y = 1.3; return g; }   // a ribbon loop from the disc up to the hand that holds it (top at y .33)
  const r = M(new THREE.TorusGeometry(.13, .012, 6, 20, Math.PI), toon('#2A3A9A'), g, 0, .11, 0); r.rotation.z = 0; return g; }
export function scissors() { const g = G(); for (const s of [-1, 1]) { const b = TM(new THREE.BoxGeometry(.32, .02, .035), '#C8CCD0', g, .16, 0, s * .01, .003); b.rotation.y = s * .18; TM(new THREE.TorusGeometry(.04, .012, 6, 14), '#C8202A', g, -.05, 0, s * .05, 0).rotation.x = Math.PI / 2; } return g; }
export function mailbag() { const g = G(); const b = TM(new THREE.BoxGeometry(.3, .26, .1), '#8A6A3A', g, 0, 0, 0, .005); TM(new THREE.BoxGeometry(.31, .12, .11), '#7A5A2E', g, 0, .08, .005, 0); return g; }
export function chair() { const g = G(); TM(new THREE.BoxGeometry(.5, .06, .5), '#6A4426', g, 0, .48, 0, .006); TM(new THREE.BoxGeometry(.5, .6, .06), '#6A4426', g, 0, .8, -.22, .006); for (const [x, z] of [[-.2, -.2], [.2, -.2], [-.2, .2], [.2, .2]]) TM(new THREE.BoxGeometry(.05, .48, .05), '#5A3A22', g, x, .24, z, 0); return g; }
