// sets5.js · 1999 suburbia for "The Pudding Guy": the house with the pudding-filled garage, a supermarket aisle and checkout,
// the food-bank hall, an airliner (outside and inside), and the props (pudding cups by the thousand, carts, a balance
// scale, a calculator, a wall clock and calendar, a tax form, a gold card, peeled labels).
import * as THREE from 'three';
import { mat, G, M, box, sph, cyl, cap, tor, textPlane, texFrom, rng } from './kit.js';

function ctex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = texFrom(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); return t; }
const plane = (w, h, m) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.receiveShadow = true; return p; };
const std = (map, o = {}) => new THREE.MeshStandardMaterial({ map, roughness: o.r ?? .8, metalness: o.m ?? 0, side: o.side ?? THREE.FrontSide, emissive: o.e ?? '#000000', emissiveMap: o.e ? map : null, emissiveIntensity: o.ei ?? 1, transparent: !!o.t });
const BROWN = '#5A3220';

// ======================= THE PUDDING CUP (instanced by the thousand) =======================
const CUP = { r0: .036, r1: .029, h: .05 };
const cupLabel = () => ctex(256, 64, (c, w, h) => {
  c.fillStyle = '#6B3A22'; c.fillRect(0, 0, w, h); c.fillStyle = '#F2E2C4'; c.fillRect(0, 14, w, 30);
  c.fillStyle = '#6B3A22'; c.font = '700 22px Fredoka'; c.textAlign = 'center'; c.fillText('CHOCO CUP', 70, 37);
  c.fillStyle = '#FFFFFF'; c.fillRect(160, 16, 80, 26); c.fillStyle = '#1C1C1E'; for (let i = 0; i < 26; i++) c.fillRect(164 + i * 2.8, 18, (i * 7 % 3) + 1, 18);
});
let CUPMATS = null;
export function cupMats() {
  if (CUPMATS) return CUPMATS;
  const lid = ctex(128, 128, (c, w, h) => { c.fillStyle = '#F2E2C4'; c.fillRect(0, 0, w, h); c.fillStyle = '#6B3A22'; c.beginPath(); c.arc(64, 64, 44, 0, 7); c.fill(); c.fillStyle = '#F2E2C4'; c.font = '700 24px Fredoka'; c.textAlign = 'center'; c.fillText('CHOCO', 64, 62); c.font = '700 20px Fredoka'; c.fillText('CUP', 64, 86); c.strokeStyle = '#C8283A'; c.lineWidth = 6; c.beginPath(); c.arc(64, 64, 56, 0, 7); c.stroke(); });
  CUPMATS = [new THREE.MeshStandardMaterial({ map: cupLabel(), roughness: .5 }), new THREE.MeshStandardMaterial({ map: lid, roughness: .4, metalness: .1 }), mat('#E9E2D2', { r: .5 })];
  return CUPMATS;
}
export const cupGeo = (s = 1) => new THREE.CylinderGeometry(CUP.r0 * s, CUP.r1 * s, CUP.h * s, 18, 1);
export function cup(s = 1) { const g = G(); M(cupGeo(s), cupMats(), g, 0, CUP.h * s / 2, 0); return g; }
export function cups(n, s = 1) { const im = new THREE.InstancedMesh(cupGeo(s), cupMats(), n); im.castShadow = im.receiveShadow = true; im.frustumCulled = false; return im; }
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);
export function setInst(im, i, x, y, z, rx = 0, ry = 0, rz = 0, sc = 1) { _q.setFromEuler(_e.set(rx, ry, rz)); _s.setScalar(sc); _m.compose(_v.set(x, y, z), _q, _s); im.setMatrixAt(i, _m); }

// a heap of cups (cone), with a hidden core so the gaps never show through
export function pile(radius = 2.2, height = 1.8, n = 2600, seed = 3, s = 1.6) {
  const g = G(), im = cups(n, s), R = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R()), r = d * radius, y = Math.max(0, height * (1 - d) + (R() - .5) * .08);
    setInst(im, i, Math.cos(a) * r, y, Math.sin(a) * r, (R() - .5) * 2.4, R() * 6, (R() - .5) * 2.4);
  }
  im.instanceMatrix.needsUpdate = true; g.add(im);
  const core = M(new THREE.ConeGeometry(radius * .93, height * .95, 32, 1, true), mat('#7A4A2A', { r: .9, side: THREE.DoubleSide }), g, 0, height * .45, 0); core.castShadow = false;
  return g;
}

// ======================= THE HOUSE, WITH THE GARAGE FULL OF PUDDING =======================
export function suburb() {
  const g = G(); g.name = 'suburb';
  const grass = ctex(256, 256, (c, w, h) => { const R = rng(4); c.fillStyle = '#6FA84A'; c.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { c.fillStyle = R() < .5 ? 'rgba(40,90,30,.25)' : 'rgba(170,210,110,.2)'; c.fillRect(R() * w, R() * h, 2, 4); } }, [30, 30]);
  const gr = plane(120, 120, std(grass, { r: .95 })); gr.rotation.x = -Math.PI / 2; g.add(gr);
  const conc = ctex(256, 256, (c, w, h) => { const R = rng(6); c.fillStyle = '#C9C4BA'; c.fillRect(0, 0, w, h); for (let i = 0; i < 2000; i++) { c.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '80,70,60'},.08)`; c.fillRect(R() * w, R() * h, 3, 3); } c.strokeStyle = 'rgba(80,70,60,.3)'; c.lineWidth = 3; c.strokeRect(0, 0, w, h); }, [2, 4]);
  const dw = plane(5.2, 9, std(conc)); dw.rotation.x = -Math.PI / 2; dw.position.set(1.6, .01, 3.5); g.add(dw);
  // the house: siding, a gable roof, a two-car garage with its door rolled up
  const siding = ctex(256, 256, (c, w, h) => { c.fillStyle = '#E8DCC2'; c.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) { c.fillStyle = 'rgba(120,100,70,.25)'; c.fillRect(0, y + 13, w, 3); } }, [6, 3]);
  const sm = std(siding), trim = mat('#FFFFFF', { r: .6 }), roofM = mat('#6E4A3A', { r: .8 });
  const H = G(); H.position.set(0, 0, -1); g.add(H);
  M(box(11, 3.2, .2), sm, H, 0, 1.6, -4); for (const x of [-5.4, 5.4]) M(box(.2, 3.2, 4), sm, H, x, 1.6, -2);
  M(box(7.5, 3.2, .2), sm, H, -1.75, 1.6, 0);   // front wall left of the garage door
  M(box(.2, 3.2, .2), sm, H, 5.4, 1.6, 0); M(box(4.4, .7, .2), sm, H, 3.1, 2.85, 0);   // garage header
  for (const s of [-1, 1]) { const r = M(box(11.6, .14, 3.2), roofM, H, 0, 3.2 + 1.0, -2 + s * 1.15); r.rotation.x = s * .62; }
  M(box(11, 1.2, .2), sm, H, 0, 3.6, -.05).scale.y = .01;
  const gable = new THREE.Shape(); gable.moveTo(-2, 0); gable.lineTo(2, 0); gable.lineTo(0, 1.3); gable.closePath(); for (const x of [-5.45, 5.45]) { const gb = M(new THREE.ShapeGeometry(gable), mat('#E8DCC2', { side: THREE.DoubleSide }), H, x, 3.2, -2); gb.rotation.y = Math.PI / 2; }
  // the front door, windows with shutters, a porch light
  M(box(1.0, 2.1, .08), mat('#2E5A8A', { r: .5 }), H, -3.2, 1.05, .12); M(sph(.04, 8, 6), mat('#D9B23A', { m: .8 }), H, -2.8, 1.05, .18);
  for (const x of [-5.0, -1.2]) { M(box(1.4, 1.1, .06), mat('#9FC4E0', { r: .1, m: .2 }), H, x + .6, 1.7, .12); M(box(1.5, .08, .1), trim, H, x + .6, 2.28, .14); M(box(1.5, .08, .1), trim, H, x + .6, 1.12, .14); for (const s of [-1, 1]) M(box(.35, 1.2, .06), mat('#2E5A8A'), H, x + .6 + s * .95, 1.7, .14); }
  // the garage: concrete floor, shelves, a workbench, the door rolled up under the header, and the pudding
  const gf = plane(4.3, 4, std(conc)); gf.rotation.x = -Math.PI / 2; gf.position.set(3.1, .02, -2); H.add(gf);
  M(box(4.3, .5, .05), mat('#D8D8D8', { m: .3, r: .5 }), H, 3.1, 3.05, -.2);   // the rolled-up door
  for (let i = 0; i < 3; i++) M(box(2.6, .04, .4), mat('#8A6A4A'), H, 2.0, .9 + i * .55, -3.7);
  M(box(1.6, .9, .6), mat('#7A5A3A'), H, 4.4, .45, -3.5);
  const clock = wallClock(); clock.position.set(4.6, 2.3, -3.88); H.add(clock); g.userData.clock = clock;
  const cal = calendar(); cal.position.set(1.4, 2.0, -3.88); H.add(cal); g.userData.calendar = cal;
  const heap = pile(2.3, 2.1, 2600, 7); heap.position.set(3.0, 0, -1.6); H.add(heap); g.userData.heap = heap;
  const spill = pile(2.6, .7, 1400, 9); spill.position.set(2.6, 0, 1.4); spill.scale.set(1, 1, 1.1); g.add(spill); g.userData.spill = spill;
  // the yard: a mailbox, a tree, a picket fence, neighbours' houses
  const mb = G(); mb.position.set(-1.2, 0, 7.6); g.add(mb); M(cyl(.04, .04, 1.1, 8), mat('#5A3E2A'), mb, 0, .55, 0); M(cap(.16, .3, 12), mat('#2A4A8A', { m: .3, r: .4 }), mb, 0, 1.2, 0).rotation.x = Math.PI / 2;
  for (const [x, z, s] of [[-6.5, 4, 1.2], [8.5, 2, 1], [-9, -6, 1.4]]) { const t = G(); t.position.set(x, 0, z); t.scale.setScalar(s); g.add(t); M(cyl(.18, .26, 2.6, 10), mat('#7A5A3A'), t, 0, 1.3, 0); for (let k = 0; k < 5; k++) M(sph(1.0 + (k % 2) * .25, 14, 10), mat(k % 2 ? '#4E8A3A' : '#5E9A44', { r: .9 }), t, Math.cos(k * 1.3) * .7, 3.0 + (k % 3) * .35, Math.sin(k * 1.3) * .7); }
  for (let i = 0; i < 18; i++) { M(box(.08, .8, .04), mat('#FFFFFF'), g, -9 + i * .55, .4, 8.4); } M(box(10, .06, .04), mat('#FFFFFF'), g, -4.3, .6, 8.38);
  for (const [x, z, col] of [[-16, -6, '#C9D8E6'], [16, -7, '#E6C9C9'], [-26, -10, '#E6E0C9'], [27, -11, '#D2E6C9']]) { const n = G(); n.position.set(x, 0, z); g.add(n); M(box(9, 3, 7), mat(col), n, 0, 1.5, 0); const rf = M(new THREE.ConeGeometry(6.6, 2.4, 4), mat('#5A4A4A'), n, 0, 4.2, 0); rf.rotation.y = Math.PI / 4; rf.scale.set(1, 1, .8); }
  return g;
}

// ======================= THE SUPERMARKET =======================
export function store() {
  const g = G(); g.name = 'store';
  const tiles = ctex(256, 256, (c, w, h) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.fillStyle = (x + y) % 2 ? '#E8E4DA' : '#D4CEC2'; c.fillRect(x * 64, y * 64, 64, 64); } }, [16, 40]);
  const fl = plane(16, 40, std(tiles, { r: .35 })); fl.rotation.x = -Math.PI / 2; fl.position.z = -8; g.add(fl);
  const ceil = plane(16, 40, mat('#F2F0EA')); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 4.2, -8); g.add(ceil);
  for (let i = 0; i < 8; i++) for (const x of [-2.6, 0, 2.6]) { const l = M(box(1.4, .05, .4), mat('#FFFFFF', { e: '#FFF8E8', ei: 1.4 }), g, x, 4.15, 6 - i * 4.5); l.castShadow = false; }
  for (const x of [-8, 8]) { const w = plane(40, 4.2, mat('#E6EEF0')); w.rotation.y = -Math.sign(x) * Math.PI / 2; w.position.set(x, 2.1, -8); g.add(w); }
  const bw = plane(16, 4.2, mat('#E6EEF0')); bw.position.set(0, 2.1, -27); g.add(bw);
  // the store front (behind the shopper at the top of aisle 7): windows onto the car park, the entrance, the big sign, displays
  const fw = plane(16, 4.2, mat('#E6EEF0')); fw.rotation.y = Math.PI; fw.position.set(0, 2.1, 11.9); g.add(fw);
  const outside = ctex(512, 320, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9CCBF0'); gr.addColorStop(.55, '#DDEFFC'); gr.addColorStop(.56, '#9A9890'); gr.addColorStop(1, '#7E7C76'); c.fillStyle = gr; c.fillRect(0, 0, w, h); const R = rng(21);
    for (let i = 0; i < 7; i++) { const x = 20 + i * 72 + R() * 10; c.fillStyle = ['#C8283A', '#2E6FB5', '#F2F0EA', '#3A3A40', '#E8B030', '#3E9A4A', '#9AA0A8'][i]; c.beginPath(); c.roundRect(x, 200, 60, 36, 10); c.fill(); c.fillRect(x - 4, 222, 68, 22); c.fillStyle = '#1C1C1E'; c.beginPath(); c.arc(x + 12, 246, 8, 0, 7); c.arc(x + 50, 246, 8, 0, 7); c.fill(); c.fillStyle = 'rgba(200,230,255,.8)'; c.fillRect(x + 10, 206, 40, 14); }
    c.fillStyle = '#5E8A4A'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(30 + i * 60, 172, 22 + R() * 8, 0, 7); c.fill(); } });
  const frameM = mat('#9AA0A8', { m: .6, r: .35 });
  for (const x of [-4.3, 4.3]) { const win = plane(5.2, 2.4, std(outside, { e: '#ffffff', ei: .55, r: .2 })); win.rotation.y = Math.PI; win.position.set(x, 1.55, 11.88); g.add(win); for (let k = -2; k <= 2; k++) M(box(.06, 2.5, .06), frameM, g, x + k * 1.3, 1.55, 11.86); M(box(5.3, .08, .08), frameM, g, x, 2.78, 11.86); M(box(5.3, .08, .08), frameM, g, x, .33, 11.86); }
  const door = plane(2.4, 2.6, std(outside, { e: '#ffffff', ei: .5, r: .15 })); door.rotation.y = Math.PI; door.position.set(0, 1.3, 11.88); g.add(door);
  M(box(.08, 2.7, .1), frameM, g, 0, 1.35, 11.84); for (const x of [-1.24, 1.24]) M(box(.1, 2.7, .1), frameM, g, x, 1.35, 11.84); M(box(2.6, .14, .12), frameM, g, 0, 2.66, 11.84);
  const ent = textPlane([{ text: 'ENTRANCE · EXIT', size: 60, y: 62, color: '#FFFFFF' }], 1.6, .22, { w: 760, h: 104, bg: '#2E8A4A', round: 14 }); ent.rotation.y = Math.PI; ent.position.set(0, 2.95, 11.84); g.add(ent);
  const big = textPlane([{ text: 'SUPER SAVE', size: 150, y: 140, color: '#C8283A' }, { text: 'LOW PRICES EVERY DAY', size: 54, y: 236, color: '#1C4E9A' }], 4.6, 1.0, { w: 1400, h: 300, bg: '#FFFFFF', round: 24 }); big.rotation.y = Math.PI; big.position.set(0, 3.62, 11.82); g.add(big);
  // produce stands and a soda pyramid by the door; a cart corral
  const fruit = new THREE.InstancedMesh(sph(.06, 10, 8), new THREE.MeshStandardMaterial({ roughness: .45 }), 360); let fi = 0;
  for (const [sx, col] of [[-3.0, ['#D8302A', '#E84A2A', '#B82020']], [3.0, ['#F29A1F', '#F2B030', '#E8861A']], [-5.2, ['#8CC63F', '#A8D44A', '#7AB830']], [5.2, ['#F2D23A', '#E8C430', '#F8DC50']]]) {
    const st = G(); st.position.set(sx, 0, 9.6); g.add(st); M(box(1.6, .7, 1.0, .03), mat('#8A5A34', { r: .8 }), st, 0, .35, 0); M(box(1.5, .06, .9), mat('#6A4426', { r: .8 }), st, 0, .72, 0);
    for (let k = 0; k < 90 && fi < 360; k++) { const i = k % 12, j = Math.floor(k / 12) % 7, lv = Math.floor(k / 84); _q.identity(); _m.compose(_v.set(sx - .66 + i * .12, .79 + lv * .1 + (j % 2) * .01, 9.6 - .38 + j * .12), _q, _s.set(1, 1, 1)); fruit.setMatrixAt(fi, _m); fruit.setColorAt(fi, new THREE.Color(col[(i + j) % 3])); fi++; }
    const tag = textPlane([{ text: ['APPLES', 'ORANGES', 'LIMES', 'LEMONS'][[-3.0, 3.0, -5.2, 5.2].indexOf(sx)], size: 60, y: 60, color: '#FFFFFF' }], .6, .2, { w: 360, h: 120, bg: '#C8283A', round: 16 }); tag.rotation.y = Math.PI; tag.position.set(0, 1.05, .45); st.add(tag);
  }
  fruit.count = fi; fruit.instanceMatrix.needsUpdate = true; fruit.instanceColor.needsUpdate = true; fruit.castShadow = true; g.add(fruit);
  const soda = new THREE.InstancedMesh(new THREE.BoxGeometry(.3, .2, .2), new THREE.MeshStandardMaterial({ roughness: .5 }), 40); let si = 0;
  for (let lv = 0; lv < 5; lv++) for (let k = 0; k < 5 - lv; k++) for (const zz of [0, .22]) { if (si >= 40) break; _q.identity(); _m.compose(_v.set(1.6 + (k - (4 - lv) / 2) * .32, .1 + lv * .21, 7.2 + zz), _q, _s.set(1, 1, 1)); soda.setMatrixAt(si, _m); soda.setColorAt(si, new THREE.Color(lv % 2 ? '#C8283A' : '#F2F0EA')); si++; }
  soda.count = si; soda.instanceMatrix.needsUpdate = true; soda.instanceColor.needsUpdate = true; soda.castShadow = true; g.add(soda);
  const sale = textPlane([{ text: 'SALE', size: 110, y: 100, color: '#FFD23F' }], .7, .4, { w: 340, h: 190, bg: '#C8283A', round: 18 }); sale.rotation.y = Math.PI; sale.position.set(1.6, 1.4, 7.1); g.add(sale);
  const wk = textPlane([{ text: 'WEEKLY DEALS', size: 86, y: 90, color: '#FFFFFF' }], 2.2, .42, { w: 900, h: 170, bg: '#1C4E9A', round: 18 });
  for (const sd of [0, Math.PI]) { const p2 = wk.clone(); p2.rotation.y = sd; p2.position.set(0, 3.55, 6.5 + (sd ? -.006 : .006)); g.add(p2); } M(box(2.2, .42, .01), mat('#1C4E9A'), g, 0, 3.55, 6.5);
  // two long shelf units facing each other across the aisle, stocked with boxes; the pudding section on the left
  const R = rng(13), cols = ['#C8283A', '#E8B030', '#2E6FB5', '#3E9A4A', '#F2F0EA', '#E07A1F', '#7A3A8A', '#2AA6A0', '#F2D79A'];
  const boxes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: .6 }), 1400); boxes.castShadow = true; let bi = 0;
  const pud = cups(900, 1.35); let pi = 0; g.add(pud);
  const shelfM = mat('#E8E8EC', { m: .3, r: .5 }), backM = mat('#C8D0D8', { r: .6 });
  const PUDZ = [-1.8, 2.2];
  for (const s of [-1, 1]) {
    const x = s * 1.45;
    M(box(.06, 2.3, 16), backM, g, x + s * .3, 1.15, -6);
    for (let lv = 0; lv < 5; lv++) {
      const y = .12 + lv * .45; M(box(.6, .04, 16), shelfM, g, x, y, -6);
      for (let z = 1.9; z > -13.9;) {
        const inPud = s < 0 && z < PUDZ[1] && z > PUDZ[0] && lv < 4;
        if (inPud) { for (let k = 0; k < 3; k++) { setInst(pud, pi++, x - s * (.05 + k * .1) - s * .05, y + .02, z, 0, R() * 6, 0); } z -= .1; continue; }
        const w = .16 + R() * .2, hgt = .18 + R() * .2, d = .22;
        _q.setFromEuler(_e.set(0, 0, 0)); _m.compose(_v.set(x - s * .05, y + .02 + hgt / 2, z - w / 2), _q, _s.set(d, hgt, w)); boxes.setMatrixAt(bi, _m); boxes.setColorAt(bi, new THREE.Color(cols[Math.floor(R() * cols.length)])); bi++; z -= w + .02;
        if (bi >= 1400) break;
      }
      M(box(.62, .06, 16), mat('#F6F6F8'), g, x - s * .29, y + .01, -6);   // the price strip
    }
  }
  boxes.count = bi; boxes.instanceMatrix.needsUpdate = true; if (boxes.instanceColor) boxes.instanceColor.needsUpdate = true; g.add(boxes); pud.count = pi; pud.instanceMatrix.needsUpdate = true;
  g.userData.pud = pud; g.userData.pudZ = PUDZ;
  // the promotion: a standee and a shelf talker
  const sign = textPlane([{ text: 'FLY FREE!', size: 120, y: 120, color: '#FFD23F' }, { text: 'AIRLINE MILES', size: 76, y: 240, color: '#FFFFFF' }, { text: 'FOR EVERY BARCODE', size: 56, y: 330, color: '#FFFFFF' }], 1.2, .8, { w: 800, h: 520, bg: '#1C4E9A', round: 30 });
  const st = G(); st.position.set(-.95, 0, .2); st.rotation.y = .5; g.add(st); M(cyl(.025, .025, 1.5, 8), mat('#C0C0C8', { m: .7 }), st, 0, .75, 0); sign.position.set(0, 1.85, .012); st.add(sign); M(box(1.22, .82, .02, .01), mat('#E8E2D4', { r: .9 }), st, 0, 1.85, 0);
  const plane_ = G(); plane_.position.set(.42, 2.15, .02); st.add(plane_); toyPlane(plane_, .35);
  g.userData.standee = st;
  // the aisle sign
  const as = textPlane([{ text: 'AISLE 7', size: 70, y: 70, color: '#FFFFFF' }, { text: 'DESSERTS', size: 56, y: 150, color: '#FFD23F' }], 1.4, .6, { w: 560, h: 220, bg: '#C8283A', round: 16 }); as.position.set(0, 3.6, -.988); g.add(as); const asB = as.clone(); asB.rotation.y = Math.PI; asB.position.z = -1.012; g.add(asB); M(box(1.4, .6, .02), mat('#C8283A'), g, 0, 3.6, -1);
  for (const s of [-1, 1]) M(cyl(.008, .008, .5, 4), mat('#888'), g, s * .5, 3.95, -1);
  // the checkout at the end of the aisle: a counter with a belt, a register, a candy rack
  const co = G(); co.position.set(-.3, 0, -15.5); g.add(co); g.userData.checkout = co;
  M(box(3.2, .9, .9, .03), mat('#3A4A5A', { r: .5 }), co, 0, .45, 0); M(box(2.4, .02, .7), mat('#1C1C1E', { r: .7 }), co, -.3, .91, 0);
  const reg = G(); reg.position.set(1.2, .9, 0); co.add(reg); M(box(.5, .25, .4, .03), mat('#D8D8D0'), reg, 0, .12, 0); M(box(.4, .22, .05), mat('#1C2A1C', { e: '#3AFF6A', ei: .4 }), reg, 0, .38, -.1).rotation.x = -.3; M(box(.45, .08, .35), mat('#B8B8B0'), reg, 0, .03, .1);
  g.userData.register = reg;
  return g;
}
export function cart() {
  const g = G(), wire = mat('#C8CCD4', { m: .8, r: .3 }), red = mat('#C8283A', { r: .4 });
  const basket = new THREE.BoxGeometry(.6, .45, .9, 4, 3, 6); const e = new THREE.EdgesGeometry(basket); const ls = new THREE.LineSegments(e, new THREE.LineBasicMaterial({ color: '#B8BCC4' })); ls.position.y = .75; g.add(ls);
  const bottom = M(box(.58, .02, .88), wire, g, 0, .53, 0);
  for (const s of [-1, 1]) for (const z of [-.38, .38]) { M(cyl(.012, .012, .5, 6), wire, g, s * .26, .3, z); const wh = M(cyl(.05, .05, .03, 12), mat('#1C1C1E'), g, s * .26, .05, z); wh.rotation.z = Math.PI / 2; }
  const h = M(cyl(.018, .018, .62, 8), red, g, 0, 1.08, -.5); h.rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) M(cyl(.012, .012, .3, 6), wire, g, s * .29, .95, -.47);
  g.userData.load = G(); g.userData.load.position.y = .55; g.add(g.userData.load);
  return g;
}
// fill a cart with a tower of cups (k = 0..1 how full)
export function loadCart(c, n = 260, seed = 2) {
  const im = cups(n, 1.5), R = rng(seed);
  for (let i = 0; i < n; i++) { const y = Math.floor(i / 22) * .072, x = ((i % 22) % 5 - 2) * .11 + (R() - .5) * .02, z = (Math.floor((i % 22) / 5) - 2) * .17 + (R() - .5) * .02; setInst(im, i, x, y, z, (R() - .5) * .3, R() * 6, (R() - .5) * .3); }
  im.instanceMatrix.needsUpdate = true; c.userData.load.add(im); c.userData.cups = im; return im;
}
// the balance scale: a pudding cup on one pan, a toy airliner on the other; .userData.tilt(a)
export function balance() {
  const g = G(), brass = mat('#D9B23A', { m: .8, r: .3 });
  M(cyl(.25, .3, .06, 24), brass, g, 0, .03, 0); M(cyl(.03, .03, 1.0, 10), brass, g, 0, .55, 0); M(sph(.05, 12, 8), brass, g, 0, 1.06, 0);
  const beam = G(); beam.position.y = 1.06; g.add(beam); M(box(1.2, .035, .035), brass, beam);
  const pans = [];
  for (const s of [-1, 1]) {
    const hang = G(); hang.position.x = s * .58; beam.add(hang);
    for (const a of [0, 2.1, 4.2]) { const ch = M(cyl(.004, .004, .4, 4), brass, hang, Math.cos(a) * .1, -.2, Math.sin(a) * .1); ch.rotation.set(Math.sin(a) * .25, 0, -Math.cos(a) * .25); }
    const pan = G(); pan.position.y = -.4; hang.add(pan); M(new THREE.SphereGeometry(.17, 24, 8, 0, Math.PI * 2, Math.PI * .65, Math.PI * .35), mat('#D9B23A', { m: .8, r: .3, side: THREE.DoubleSide }), pan, 0, .14, 0);
    pans.push({ hang, pan });
  }
  const c = cup(2.2); c.position.y = .0; pans[0].pan.add(c);
  const tp = G(); tp.position.y = .1; pans[1].pan.add(tp); toyPlane(tp, .32);
  g.userData.tilt = a => { beam.rotation.z = a; pans.forEach(p => p.hang.rotation.z = -a); };
  return g;
}
// a little airliner (a toy for the scale and the standee; scaled up it is the jet in the sky)
export function toyPlane(parent, L = 1, livery = '#C8283A') {
  const g = G(); g.scale.setScalar(L); parent.add(g);
  const white = mat('#F4F4F6', { r: .35, m: .1 }), col = mat(livery, { r: .4 }), grey = mat('#B8BCC4', { m: .6, r: .3 }), win = mat('#2A3A5A', { r: .2 });
  const body = M(new THREE.CapsuleGeometry(.12, .9, 8, 20), white, g); body.rotation.z = Math.PI / 2;
  const nose = M(sph(.12, 16, 12), white, g, .56, -.01, 0); nose.scale.set(1.2, .95, 1);
  M(box(.3, .025, 1.1, .01), white, g, .02, -.04, 0);   // wings
  M(box(.16, .02, .44, .006), white, g, -.5, .01, 0);   // tailplane
  const fin = M(box(.2, .26, .02, .006), col, g, -.5, .14, 0); fin.rotation.z = -.35;
  for (const z of [-.3, .3]) { const en = M(cyl(.045, .04, .16, 14), grey, g, .08, -.1, z); en.rotation.z = Math.PI / 2; }
  M(box(1.05, .035, .245), col, g, -.02, -.02, 0).scale.set(1, 1, 1.01);   // the stripe
  for (let i = 0; i < 9; i++) for (const z of [-.121, .121]) M(box(.035, .03, .004), win, g, .35 - i * .085, .045, z);
  M(box(.06, .045, .2), win, g, .62, .04, 0);
  return g;
}
// the jet in the sky, big
export function jet() { const g = G(); toyPlane(g, 30, '#2E6FB5'); g.traverse(o => { if (o.isMesh) o.castShadow = false; }); return g; }

// ======================= THE FOOD BANK HALL =======================
export function hall() {
  const g = G(); g.name = 'hall';
  const wood = ctex(256, 256, (c, w, h) => { const R = rng(8); for (let i = 0; i < 8; i++) { c.fillStyle = `rgb(${190 + R() * 20},${150 + R() * 15},${100 + R() * 10})`; c.fillRect(0, i * 32, w, 31); } }, [6, 6]);
  const fl = plane(20, 20, std(wood, { r: .5 })); fl.rotation.x = -Math.PI / 2; g.add(fl);
  const wm = mat('#E8E0CC'); for (const [x, z, ry] of [[0, -6, 0], [-7, 0, Math.PI / 2], [7, 0, -Math.PI / 2]]) { const w = plane(20, 5, wm); w.position.set(x, 2.5, z); w.rotation.y = ry; g.add(w); }
  for (let i = 0; i < 4; i++) { const wi = M(box(1.4, 1.8, .05), mat('#DDEEFF', { e: '#E8F2FF', ei: 1.1 }), g, -5 + i * 3.3, 2.6, -5.97); wi.castShadow = false; }
  const ban = textPlane([{ text: 'COMMUNITY FOOD BANK', size: 84, y: 76, color: '#FFFFFF' }, { text: 'THANK YOU, VOLUNTEERS!', size: 58, y: 166, color: '#FFD23F' }], 6, 1.1, { w: 1400, h: 240, bg: '#2E6B4E', round: 20 });
  ban.position.set(0, 4.0, -5.9); g.add(ban);
  // long folding tables, boxes of pudding, a bin of peeled labels
  const tables = [];
  for (const z of [-2.6, -.4]) { const t = G(); t.position.set(0, 0, z); g.add(t); tables.push(t); M(box(4.4, .05, .8), mat('#E6E2D8', { r: .5 }), t, 0, .74, 0); for (const x of [-2, 2]) for (const dz of [-.3, .3]) M(cyl(.02, .02, .72, 6), mat('#8A8A90', { m: .5 }), t, x, .36, dz); }
  g.userData.tables = tables;
  for (let i = 0; i < 6; i++) { const b = G(); b.position.set(-4.6 + (i % 2) * .9, 0, -3.8 + Math.floor(i / 2) * .9); g.add(b); M(box(.7, .5, .55, .02), mat('#C9A06A', { r: .9 }), b, 0, .25 + 0, 0); const cs = cups(20, 1.5); b.add(cs); for (let k = 0; k < 20; k++) setInst(cs, k, ((k % 5) - 2) * .12, .55, (Math.floor(k / 5) - 1.5) * .12, 0, k, 0); cs.instanceMatrix.needsUpdate = true; }
  const bin = G(); bin.position.set(3.0, 0, 1.1); g.add(bin); M(cyl(.45, .4, .8, 24, true), mat('#2E6FB5', { r: .5, side: THREE.DoubleSide }), bin, 0, .4, 0); M(cyl(.4, .4, .02, 24), mat('#2E6FB5'), bin, 0, .02, 0);
  const labTex = ctex(64, 32, (c, w, h) => { c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, w, h); c.fillStyle = '#1C1C1E'; for (let i = 0; i < 14; i++) c.fillRect(6 + i * 3.6, 6, (i % 3) + 1, 20); });
  const labels = new THREE.InstancedMesh(new THREE.PlaneGeometry(.07, .035), new THREE.MeshStandardMaterial({ map: labTex, side: THREE.DoubleSide, roughness: .7 }), 500); labels.frustumCulled = false; g.add(labels); g.userData.labels = labels;
  const pileL = new THREE.InstancedMesh(new THREE.PlaneGeometry(.07, .035), labels.material, 400); { const R = rng(5); for (let i = 0; i < 400; i++) { const a = R() * 6.28, r = Math.sqrt(R()) * .36; setInst(pileL, i, Math.cos(a) * r, .5 + R() * .3 * (1 - r), Math.sin(a) * r, R() * 6, R() * 6, R() * 6); } pileL.instanceMatrix.needsUpdate = true; } bin.add(pileL); g.userData.bin = bin;
  return g;
}

// ======================= THE AIRLINER CABIN =======================
export function cabin() {
  const g = G(); g.name = 'cabin';
  const carpet = ctex(128, 128, (c, w, h) => { c.fillStyle = '#2E3A6A'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) if ((i + j) % 4 === 0) c.fillRect(i * 8, j * 8, 4, 4); }, [4, 20]);
  const fl = plane(3.4, 20, std(carpet, { r: .95 })); fl.rotation.x = -Math.PI / 2; fl.position.z = -6; g.add(fl);
  // the curved walls with windows (bright sky outside), overhead bins, a ceiling with lights
  const wallM = mat('#EEECE6', { r: .5, side: THREE.DoubleSide });
  const shell = M(new THREE.CylinderGeometry(1.9, 1.9, 20, 40, 1, true, Math.PI * .55, Math.PI * .9), wallM, g, 0, 1.1, -6); shell.rotation.x = Math.PI / 2; shell.rotation.y = Math.PI / 2; shell.castShadow = false;
  const sky = ctex(256, 128, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7FB8F2'); gr.addColorStop(1, '#E8F4FF'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(30 + i * 40, 90 + (i % 2) * 14, 30, 10, 0, 0, 7); c.fill(); } });
  const winM = new THREE.MeshStandardMaterial({ map: sky, emissive: '#FFFFFF', emissiveMap: sky, emissiveIntensity: 1.1, roughness: .2 });
  for (const s of [-1, 1]) for (let i = 0; i < 10; i++) { const w = M(new THREE.CapsuleGeometry(.11, .14, 4, 12), winM, g, s * 1.62, 1.35, 2 - i * 1.1); w.scale.z = .2; w.rotation.y = s * Math.PI / 2; w.rotation.x = 0; w.castShadow = false; M(tor(.15, .025, 6, 18), mat('#D8D6CE'), g, s * 1.6, 1.35, 2 - i * 1.1).rotation.y = Math.PI / 2; }
  for (const s of [-1, 1]) { M(box(.6, .45, 20), mat('#E6E4DC', { r: .4 }), g, s * 1.25, 2.25, -6); }
  const ce = M(box(1.9, .05, 20), mat('#F4F2EC'), g, 0, 2.55, -6); for (let i = 0; i < 10; i++) M(box(.5, .02, .2), mat('#FFFFFF', { e: '#FFF4E0', ei: 1.2 }), g, 0, 2.52, 2 - i * 1.1).castShadow = false;
  // seats: two wide first-class seats per side in the front row, then economy
  const seatM = mat('#3E5AA8', { r: .7 }), seatL = mat('#8A5A3A', { r: .5 }), seats = [];
  const seat = (x, z, wide) => { const s = G(); s.position.set(x, 0, z); g.add(s); const w = wide ? .7 : .5; M(box(w, .14, .55, .05), wide ? seatL : seatM, s, 0, .48, 0); M(box(w, .75, .14, .05), wide ? seatL : seatM, s, 0, .9, -.26).rotation.x = -.12; M(box(w * .6, .2, .1, .04), mat('#F4F4F6'), s, 0, 1.2, -.25); for (const dx of [-1, 1]) M(box(.06, .2, .5, .02), mat('#5A5A60'), s, dx * (w / 2 + .03), .62, 0); seats.push(s); return s; };
  for (const s of [-1, 1]) { seat(s * .85, 0, true); for (let i = 1; i < 9; i++) for (const k of [0, 1]) seat(s * (.65 + k * .52), -i * 1.0 - .3, false); }
  g.userData.seats = seats;
  // a tray table in front of the window seat on the right
  const tray = G(); tray.position.set(.85, .72, .55); g.add(tray); M(box(.55, .025, .35, .01), mat('#D8D6CE'), tray); g.userData.tray = tray;
  return g;
}

// ======================= SMALL PROPS =======================
export function wallClock() { const g = G(); M(cyl(.32, .32, .06, 32), mat('#F4F4F6'), g).rotation.x = Math.PI / 2; M(tor(.32, .035, 8, 32), mat('#1C1C1E'), g); for (let i = 0; i < 12; i++) M(box(.02, .06, .01), mat('#1C1C1E'), g, Math.sin(i * Math.PI / 6) * .26, Math.cos(i * Math.PI / 6) * .26, .035).rotation.z = -i * Math.PI / 6; const hh = G(); g.add(hh); M(box(.025, .16, .01), mat('#1C1C1E'), hh, 0, .08, .045); const mh = G(); g.add(mh); M(box(.018, .24, .01), mat('#C8283A'), mh, 0, .12, .05); g.userData.hands = [hh, mh]; return g; }
export function calendar() { return textPlane([{ text: 'MAY 1999', size: 52, y: 60, color: '#FFFFFF' }, { text: 'DEADLINE', size: 64, y: 190, color: '#C8283A' }, { text: '◯ 31', size: 70, y: 290, color: '#1C1C1E' }], .7, .8, { w: 420, h: 480, bg: '#F4F1EA', round: 8 }); }
export function calculator() { const g = G(); M(box(.09, .14, .02, .006), mat('#2A2A30', { r: .4 }), g, 0, 0, 0); const d = textPlane([{ text: '0.25', size: 70, y: 60, color: '#1C2A1C' }], .07, .025, { w: 280, h: 100, bg: '#B8D8A8' }); d.position.set(0, .045, .011); g.add(d); g.userData.display = d; for (let i = 0; i < 12; i++) M(box(.016, .012, .006), mat('#D8D8D0'), g, ((i % 3) - 1) * .024, -.005 - Math.floor(i / 3) * .02, .012); return g; }
export function taxForm() { const c = document.createElement('canvas'); c.width = 600; c.height = 820; const tex = texFrom(c); const draw = (stamp = 0) => { const g = c.getContext('2d'); g.fillStyle = '#F7F4EA'; g.fillRect(0, 0, 600, 820); g.fillStyle = '#1C3A2A'; g.font = '700 46px Georgia, serif'; g.textAlign = 'center'; g.fillText('TAX RETURN 1999', 300, 80); g.font = '600 30px Georgia, serif'; g.fillText('Charitable donations', 300, 150); g.textAlign = 'left'; g.font = '600 32px Fredoka'; g.fillText('Pudding (12,150 cups) ... $815', 50, 260); g.fillStyle = 'rgba(28,58,42,.4)'; for (let i = 0; i < 10; i++) g.fillRect(50, 320 + i * 34, 500 - (i % 3) * 60, 8);
  if (stamp > 0) { g.save(); g.globalAlpha = Math.min(1, stamp) * .9; g.translate(330, 640); g.rotate(-.2); g.strokeStyle = '#2E9A4A'; g.lineWidth = 12; g.strokeRect(-210, -70, 420, 140); g.fillStyle = '#2E9A4A'; g.font = '700 70px Fredoka'; g.textAlign = 'center'; g.fillText('DEDUCTED', 0, 25); g.restore(); } tex.needsUpdate = true; };
  draw(0); const p = new THREE.Mesh(new THREE.PlaneGeometry(.21, .287), new THREE.MeshStandardMaterial({ map: tex, roughness: .9 })); p.userData.redraw = draw; return p; }
export function goldCard() { const g = G(); const t = ctex(512, 320, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#F8E08A'); gr.addColorStop(.5, '#D9A82A'); gr.addColorStop(1, '#F2D06A'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#5A3A0A'; c.font = '700 54px Fredoka'; c.fillText('LIFETIME', 40, 110); c.fillText('ELITE', 40, 175); c.font = '600 34px Fredoka'; c.fillText('FREQUENT FLYER', 40, 260); c.fillStyle = '#C8C8D0'; c.fillRect(380, 60, 80, 60); });
  M(box(.86, .54, .012, .03), new THREE.MeshStandardMaterial({ map: t, metalness: .7, roughness: .25, emissive: '#3A2A00' }), g); return g; }
export function spoon() { const g = G(); M(cyl(.004, .006, .14, 6), mat('#D8D8DC', { m: .8, r: .2 }), g, 0, -.07, 0); M(sph(.016, 10, 6), mat('#D8D8DC', { m: .8, r: .2 }), g, 0, -.15, 0).scale.set(1, .4, 1.4); return g; }
export const PUDDING_BROWN = BROWN;
