// sets3.js · 1925 Paris: the Eiffel Tower (lattice), a Haussmann boulevard with a café, and a grand hotel salon.
import * as THREE from 'three';
import { mat, C, G, M, box, sph, cyl, cap, tor, textPlane, texFrom, rng } from './kit.js';

function ctex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = texFrom(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); return t; }
const plane = (w, h, m) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.receiveShadow = true; return p; };
export const EIFFEL = '#8A5E3C';

// ======================= THE EIFFEL TOWER =======================
// half-width of the tower at height y (0..60): four curved legs meeting at the top
const halfW = y => 10 * Math.pow(1 - y / 62, 1.85) + .55;
export function eiffel() {
  const g = G(); g.name = 'eiffel';
  // lattice alpha texture: X bracing in a frame
  const lat = ctex(256, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = '#fff'; c.lineWidth = 16; c.strokeRect(8, 8, w - 16, h - 16); c.lineWidth = 9; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, h); c.moveTo(w, 0); c.lineTo(0, h); c.stroke(); c.lineWidth = 6; c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.stroke(); });
  const lm = (rx, ry) => { const t = lat.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return new THREE.MeshStandardMaterial({ color: EIFFEL, alphaMap: t, alphaTest: .5, side: THREE.DoubleSide, roughness: .7, metalness: .25 }); };
  const solid = mat(EIFFEL, { r: .65, m: .25 });
  // the four legs: square open frustums from the ground to the first platform (lattice), slanting inward
  const legFrom = (sx, sz) => {
    const a = new THREE.Vector3(sx * 9.4, 0, sz * 9.4), b = new THREE.Vector3(sx * halfW(13) * .82, 13, sz * halfW(13) * .82);
    const len = a.distanceTo(b), geo = new THREE.CylinderGeometry(.95, 1.7, len, 4, 6, true); geo.rotateY(Math.PI / 4);
    const leg = new THREE.Mesh(geo, lm(2, 6)); leg.castShadow = true; leg.receiveShadow = true;
    leg.position.copy(a.clone().add(b).multiplyScalar(.5)); leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); g.add(leg);
    for (const k of [0, .5, 1]) { const p = a.clone().lerp(b, k); }
  };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) legFrom(sx, sz);
  // the arches between the legs
  for (let k = 0; k < 4; k++) { const a = M(tor(6.3, .32, 8, 40, Math.PI), solid, g); a.position.y = 5.2; a.scale.set(1, .95, 1); const ang = k * Math.PI / 2; a.rotation.y = ang; a.position.x = Math.sin(ang) * 7.6; a.position.z = Math.cos(ang) * 7.6; }
  // the shaft above the first platform: four lattice faces following the curved profile
  const face = (rot) => {
    const geo = new THREE.BufferGeometry(), pos = [], uv = [], idx = [], N = 40, y0 = 12.5, y1 = 58;
    for (let i = 0; i <= N; i++) { const y = lerp(y0, y1, i / N), w = halfW(y); pos.push(-w, y, w, w, y, w); uv.push(0, (y - y0) / 2.2, Math.max(1, w * 2 / 2.2), (y - y0) / 2.2); if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const t = lat.clone(); t.needsUpdate = true; t.repeat.set(1, 1);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: EIFFEL, alphaMap: t, alphaTest: .5, side: THREE.DoubleSide, roughness: .7, metalness: .25 })); m.rotation.y = rot; m.castShadow = true; g.add(m);
  };
  for (let k = 0; k < 4; k++) face(k * Math.PI / 2);
  // corner rails up the shaft
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const pts = []; for (let i = 0; i <= 24; i++) { const y = lerp(12.5, 58, i / 24), w = halfW(y); pts.push(new THREE.Vector3(sx * w, y, sz * w)); } M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, .18, 6), solid, g); }
  // platforms with railings
  const platform = (y, hw, h) => { M(box(hw * 2 + 1.2, h, hw * 2 + 1.2), lm(hw, 1), g, 0, y, 0); M(box(hw * 2 + 1.4, .18, hw * 2 + 1.4), solid, g, 0, y + h / 2, 0); for (const s of [-1, 1]) { M(box(hw * 2 + 1.4, .7, .06), lm(hw * 2, 1), g, 0, y + h / 2 + .4, s * (hw + .7)); M(box(.06, .7, hw * 2 + 1.4), lm(hw * 2, 1), g, s * (hw + .7), y + h / 2 + .4, 0); } };
  platform(13, halfW(13), 1.6); platform(27, halfW(27), 1.1); platform(54, halfW(54) + .3, .8);
  M(box(1.4, 2.2, 1.4), solid, g, 0, 56.6, 0); M(cyl(.08, .14, 5, 8), solid, g, 0, 60, 0);
  return g;
}
const lerp = (a, b, u) => a + (b - a) * u;

// ======================= A HAUSSMANN BOULEVARD =======================
function facadeTex(seed, shop) {
  return ctex(512, 1024, (c, w, h) => {
    const R = rng(seed); c.fillStyle = '#E9DDC4'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 22) { c.fillStyle = `rgba(150,120,80,${(.05 + R() * .04).toFixed(3)})`; c.fillRect(0, y, w, 2); }   // ashlar joints
    const floors = 5, fh = (h - 200) / floors;
    for (let f = 0; f < floors; f++) for (let k = 0; k < 4; k++) {
      const x = 34 + k * 122, y = 30 + f * fh, ww = 70, wh = fh * .62;
      c.fillStyle = '#D8C8A8'; c.fillRect(x - 10, y - 10, ww + 20, wh + 22);                 // surround
      c.fillStyle = R() < .25 ? '#F6D58A' : '#2E3440'; c.fillRect(x, y, ww, wh);              // glass (a few lit)
      c.fillStyle = '#E9DDC4'; c.fillRect(x + ww / 2 - 2, y, 4, wh); c.fillRect(x, y + wh * .45, ww, 4);
      c.fillStyle = R() < .5 ? '#5E7A6A' : '#6E6A60'; c.fillRect(x - 22, y, 14, wh); c.fillRect(x + ww + 8, y, 14, wh);   // shutters
      if (f === 1 || f === 4) { c.fillStyle = '#1C1C1E'; c.fillRect(x - 14, y + wh - 6, ww + 28, 6); for (let b = 0; b < 9; b++) c.fillRect(x - 12 + b * 11, y + wh - 30, 3, 26); c.fillRect(x - 14, y + wh - 32, ww + 28, 4); }
    }
    c.fillStyle = '#CDBB98'; c.fillRect(0, h - 210, w, 16);
    if (shop) { c.fillStyle = shop; c.fillRect(0, h - 190, w, 190); c.fillStyle = '#F2D79A'; for (let k = 0; k < 3; k++) c.fillRect(30 + k * 165, h - 160, 130, 150); c.fillStyle = '#2B2420'; c.fillRect(0, h - 192, w, 8); }
  });
}
export function boulevard() {
  const g = G(); g.name = 'boulevard';
  const cob = ctex(512, 512, (c, w, h) => { const R = rng(3); c.fillStyle = '#6E6A66'; c.fillRect(0, 0, w, h); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const v = 90 + R() * 40; c.fillStyle = `rgb(${v},${v - 4},${v - 8})`; c.beginPath(); c.roundRect(x * 32 + (y % 2) * 16 + 2, y * 32 + 2, 28, 28, 7); c.fill(); } }, [30, 60]);
  const road = plane(16, 240, new THREE.MeshStandardMaterial({ map: cob, roughness: .85 })); road.rotation.x = -Math.PI / 2; road.position.z = -80; g.add(road);
  const pav = ctex(256, 256, (c, w, h) => { c.fillStyle = '#B9B2A6'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(60,50,40,.25)'; c.lineWidth = 3; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(0, i * 64); c.lineTo(w, i * 64); c.stroke(); c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, h); c.stroke(); } }, [3, 60]);
  for (const s of [-1, 1]) { const sw = plane(6, 240, new THREE.MeshStandardMaterial({ map: pav, roughness: .8 })); sw.rotation.x = -Math.PI / 2; sw.position.set(s * 11, .16, -80); g.add(sw); M(box(.3, .16, 240), '#A8A096', g, s * 8.1, .08, -80); }
  // buildings on both sides
  const R = rng(11), shops = ['#3E5C4A', '#6E2A2A', '#2E3E5E', '#5A3E2A', null, '#3E3E3E'];
  for (const s of [-1, 1]) for (let i = 0; i < 12; i++) {
    const z = 18 - i * 15, wdt = 14.6, hgt = 20 + (i % 3), b = G(); b.position.set(s * 21, 0, z); g.add(b);
    const fm = new THREE.MeshStandardMaterial({ map: facadeTex(i * 7 + (s > 0 ? 3 : 0), shops[(i + (s > 0 ? 2 : 0)) % shops.length]), roughness: .85 });
    const body = M(box(14, hgt, wdt), [fm, fm, mat('#E2D4B8'), mat('#E2D4B8'), fm, fm], b, 0, hgt / 2, 0);
    // mansard roof + dormers + chimneys
    const roof = M(new THREE.CylinderGeometry(4.5, 7.6, 4, 4, 1), mat('#6E7A86', { r: .5, m: .3 }), b, 0, hgt + 2, 0); roof.rotation.y = Math.PI / 4; roof.scale.set(1.3, 1, 1.35);
    for (let d = 0; d < 4; d++) { const dm = M(box(1.1, 1.4, .9, .05), '#E9DDC4', b, -s * 6.4, hgt + 1.3, -5.2 + d * 3.5); M(box(.7, .8, .1), mat('#2E3440'), b, -s * 6.88, hgt + 1.2, -5.2 + d * 3.5); }
    for (let d = 0; d < 3; d++) { M(box(.9, 2.2, 1.6), '#C9B48C', b, (R() - .5) * 6, hgt + 4.6, -5 + d * 5); for (let k = 0; k < 3; k++) M(cyl(.12, .14, .5, 8), C.terracotta, b, (R() - .5) * 6, hgt + 5.9, -5 + d * 5 + (k - 1) * .4); }
    // ground-floor awnings
    if (i % 2 === 0) { const aw = M(box(1.6, .08, 9, .02), ctexMat(['#B3242F', '#F2E9D8']), b, -s * 7.8, 3.6, 0); aw.rotation.z = -s * .35; }
    // iron balcony rails (3D) on the second floor
    M(box(.08, .9, wdt - 1), mat('#1C1C1E', { m: .4, r: .4 }), b, -s * 7.15, 7.4, 0);
  }
  // the café on the left corner: tables, chairs, awning, sign
  const cafe = G(); cafe.position.set(-11.5, .16, 2); g.add(cafe); g.userData.cafe = cafe;
  for (let k = 0; k < 4; k++) { const tb = G(); tb.position.set((k % 2) * 1.6 - .8, 0, -Math.floor(k / 2) * 2.2); cafe.add(tb);
    M(cyl(.36, .36, .03, 20), mat('#D9D2C2', { r: .3 }), tb, 0, .74, 0); M(cyl(.025, .025, .72, 8), mat('#1C1C1E'), tb, 0, .37, 0); M(cyl(.2, .2, .02, 12), mat('#1C1C1E'), tb, 0, .01, 0);
    for (const a of [0, Math.PI]) { const ch = G(); ch.position.set(Math.sin(a) * .55, 0, Math.cos(a) * .55); ch.rotation.y = a + Math.PI; tb.add(ch); M(box(.38, .03, .38, .01), mat('#B98A4A'), ch, 0, .46, 0); M(box(.38, .42, .03, .01), mat('#B98A4A'), ch, 0, .68, -.18); for (const x of [-.16, .16]) for (const z of [-.16, .16]) M(cyl(.012, .012, .46, 6), mat('#1C1C1E'), ch, x, .23, z); }
    M(cyl(.03, .03, .1, 8), mat('#F2E9D8'), tb, .1, .8, 0); }
  const sign = textPlane([{ text: 'CAFÉ DE LA TOUR', size: 92, y: 80, color: '#F2D79A' }], 5.2, .62, { w: 1400, h: 160, bg: '#1F3A2E', round: 12 }); sign.position.set(-13.95, 4.6, 2); sign.rotation.y = Math.PI / 2; g.add(sign);
  // street lamps
  for (const s of [-1, 1]) for (let i = 0; i < 9; i++) { const l = G(); l.position.set(s * 8.6, .16, 10 - i * 14); g.add(l); M(cyl(.07, .11, 4.2, 10), mat('#1C1C1E', { m: .5, r: .4 }), l, 0, 2.1, 0); M(cyl(.18, .14, .5, 8), mat('#FFE7B0', { e: '#FFD78A', ei: 1.2 }), l, 0, 4.45, 0); M(new THREE.ConeGeometry(.26, .25, 8), mat('#1C1C1E'), l, 0, 4.82, 0); M(cyl(.22, .22, .06, 8), mat('#1C1C1E'), l, 0, 4.18, 0); }
  // plane trees
  for (const s of [-1, 1]) for (let i = 0; i < 8; i++) { const t = G(); t.position.set(s * 9.3, .16, 4 - i * 14.5); g.add(t); M(cyl(.16, .24, 4.4, 10), mat('#8C7A62', { r: .9 }), t, 0, 2.2, 0); for (let k = 0; k < 6; k++) { const a = k * 1.05; M(sph(1.1 + (k % 2) * .3, 12, 10), mat(['#5E8A44', '#6E9A4E', '#4E7A3A'][k % 3], { r: .9 }), t, Math.cos(a) * 1, 5 + (k % 3) * .5, Math.sin(a) * 1); } }
  // Morris advertising column
  const mc = G(); mc.position.set(9.5, .16, -9); g.add(mc); M(cyl(.65, .7, 3.6, 24), mat('#2E5A42'), mc, 0, 1.8, 0);
  const post = textPlane([{ text: 'CIRQUE', size: 60, y: 70, color: '#B3242F' }, { text: 'D\'HIVER', size: 46, y: 140, color: '#1C1C1E' }], 1.15, .9, { w: 360, h: 280, bg: '#F2D79A', round: 6 }); post.position.set(0, 2.1, .69); mc.add(post);
  M(new THREE.SphereGeometry(.72, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#2E5A42'), mc, 0, 3.6, 0);
  // a 1920s car parked on the right
  const car = vintageCar('#1C1C24'); car.position.set(6, 0, -6); car.rotation.y = Math.PI; g.add(car); g.userData.car = car;
  // the tower at the end of the boulevard
  const tw = eiffel(); tw.position.set(0, 0, -150); tw.scale.setScalar(1.4); g.add(tw); g.userData.tower = tw;
  return g;
}
function ctexMat(cols) { return new THREE.MeshStandardMaterial({ map: ctex(128, 128, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = cols[i % 2]; c.fillRect(0, i * 16, w, 16); } }), roughness: .85 }); }
export function vintageCar(col = '#1C1C24') {
  const g = G(), body = mat(col, { r: .25, m: .35 }), chrome = mat('#D8D8DC', { m: .9, r: .2 }), tyre = mat('#141414', { r: .8 });
  M(box(1.5, .55, 3.4, .08), body, g, 0, .75, 0);                 // chassis
  M(box(1.4, .62, 1.7, .12), body, g, 0, 1.33, -.45);             // cabin
  M(box(1.3, .5, 1.5, .1), mat('#9AB0C0', { r: .1, m: .2, t: true, op: .55 }), g, 0, 1.38, -.45);
  M(box(1.1, .5, 1.2, .1), body, g, 0, 1.0, 1.15);                // bonnet
  M(box(.9, .55, .08, .03), chrome, g, 0, 1.0, 1.78);             // radiator
  for (const x of [-.55, .55]) { M(cyl(.14, .14, .12, 16), chrome, g, x, 1.15, 1.8).rotation.x = Math.PI / 2; M(cyl(.11, .11, .02, 16), mat('#FFF2C8', { e: '#FFE7A0', ei: .8 }), g, x, 1.15, 1.87).rotation.x = Math.PI / 2; }
  for (const x of [-.82, .82]) for (const z of [-1.1, 1.15]) { const w = M(cyl(.42, .42, .2, 24), tyre, g, x, .42, z); w.rotation.z = Math.PI / 2; const hub = M(cyl(.2, .2, .22, 16), chrome, g, x, .42, z); hub.rotation.z = Math.PI / 2; for (let k = 0; k < 6; k++) { const sp = M(box(.03, .36, .03), chrome, g, x, .42, z); sp.rotation.x = k * Math.PI / 6; } M(new THREE.CylinderGeometry(.5, .5, .32, 20, 1, true, 0, Math.PI), body, g, x, .5, z).rotation.z = Math.PI / 2; }
  for (const s of [-1, 1]) M(box(.25, .06, 2.0), body, g, s * .85, .55, 0);   // running boards
  M(cyl(.18, .18, .03, 16), mat('#141414'), g, -.35, 1.6, .12).rotation.x = 1.1;   // steering wheel
  return g;
}

// ======================= THE GRAND HOTEL SALON =======================
export function salon() {
  const g = G(); g.name = 'salon';
  const parquet = ctex(512, 512, (c, w, h) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) { const v = 120 + ((x + y) % 3) * 18; c.fillStyle = `rgb(${v + 40},${v},${v - 40})`; c.save(); c.translate(x * 64 + 32, y * 32 + 16); c.rotate((x + y) % 2 ? .78 : -.78); c.fillRect(-30, -8, 60, 16); c.restore(); } }, [8, 8]);
  const fl = plane(24, 24, new THREE.MeshStandardMaterial({ map: parquet, roughness: .35, metalness: .05 })); fl.rotation.x = -Math.PI / 2; g.add(fl);
  const rug = plane(9, 6, new THREE.MeshStandardMaterial({ map: ctex(512, 340, (c, w, h) => { c.fillStyle = '#7A1E2A'; c.fillRect(0, 0, w, h); c.strokeStyle = '#D9B23A'; c.lineWidth = 10; c.strokeRect(20, 20, w - 40, h - 40); c.lineWidth = 4; c.strokeRect(44, 44, w - 88, h - 88); c.fillStyle = '#1F3A5A'; c.beginPath(); c.ellipse(w / 2, h / 2, 110, 70, 0, 0, 7); c.fill(); c.strokeStyle = '#D9B23A'; c.beginPath(); c.ellipse(w / 2, h / 2, 110, 70, 0, 0, 7); c.stroke(); }), roughness: .95 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(0, .01, -1.5); g.add(rug);
  // panelled walls (boiserie): cream with gold mouldings
  const pan = ctex(1024, 512, (c, w, h) => { c.fillStyle = '#EFE6D2'; c.fillRect(0, 0, w, h); c.strokeStyle = '#C9A24A'; for (let i = 0; i < 4; i++) { const x = 30 + i * 250; c.lineWidth = 8; c.strokeRect(x, 60, 210, 250); c.lineWidth = 4; c.strokeRect(x + 16, 76, 178, 218); c.lineWidth = 6; c.strokeRect(x, 340, 210, 140); } c.fillStyle = '#C9A24A'; c.fillRect(0, 320, w, 8); c.fillRect(0, 20, w, 10); }, [2, 1]);
  const wm = new THREE.MeshStandardMaterial({ map: pan, roughness: .6 });
  const back = plane(24, 7, wm); back.position.set(0, 3.5, -7); g.add(back);
  for (const s of [-1, 1]) { const sw = plane(24, 7, wm); sw.rotation.y = -s * Math.PI / 2; sw.position.set(s * 7, 3.5, 0); g.add(sw); }
  const ceil = plane(24, 24, mat('#F2EADA', { r: .7 })); ceil.rotation.x = Math.PI / 2; ceil.position.y = 7; g.add(ceil);
  M(box(14.2, .3, .4), mat('#D9B23A', { m: .6, r: .35 }), g, 0, 6.85, -6.85);
  // tall windows with drapes on the right wall (light comes in here)
  for (let i = 0; i < 2; i++) { const z = -4 + i * 4.2; const w = M(box(.1, 4.2, 1.9), mat('#DDEEFF', { e: '#E8F2FF', ei: 1.3 }), g, 6.97, 3.2, z); w.castShadow = false; M(box(.12, .08, 1.9), mat('#F2EADA'), g, 6.95, 3.2, z); M(box(.12, 4.2, .08), mat('#F2EADA'), g, 6.95, 3.2, z);
    for (const s of [-1, 1]) { const dr = M(new THREE.CylinderGeometry(.35, .5, 5.4, 12, 1, false, 0, Math.PI), mat('#8E1B2A', { r: .9 }), g, 6.6, 3.3, z + s * 1.25); dr.rotation.y = -Math.PI / 2; dr.scale.z = .5; }
    M(cyl(.06, .06, 3.4, 8), mat('#D9B23A', { m: .7, r: .3 }), g, 6.7, 6.05, z).rotation.x = Math.PI / 2; }
  // the gilded mirror over the fireplace on the back wall
  const fp = G(); fp.position.set(0, 0, -6.8); g.add(fp);
  M(box(2.6, 1.3, .5, .05), mat(C.marble, { r: .3 }), fp, 0, .65, 0); M(box(1.4, .8, .1), mat('#1A1212'), fp, 0, .5, .21); M(box(2.9, .12, .65, .03), mat(C.marble, { r: .3 }), fp, 0, 1.34, 0);
  const fire = M(new THREE.ConeGeometry(.22, .45, 10), mat('#FF9A2E', { e: '#FF7A1A', ei: 2.4 }), fp, 0, .35, .15); fire.castShadow = false; g.userData.fire = fire;
  const fl2 = new THREE.PointLight('#FF9A4A', 3, 6, 2); fl2.position.set(0, .7, -6.3); g.add(fl2); g.userData.fireLight = fl2;
  M(box(2.0, 2.4, .08, .03), mat('#D9B23A', { m: .7, r: .3 }), fp, 0, 2.75, .02); M(box(1.7, 2.1, .02), mat('#C9D8E4', { m: .95, r: .05 }), fp, 0, 2.75, .07);
  const clock = G(); clock.position.set(0, 1.62, 0); fp.add(clock); M(box(.5, .5, .2, .05), mat('#D9B23A', { m: .7, r: .3 }), clock); M(cyl(.14, .14, .02, 20), mat('#F6F1E7'), clock, 0, .02, .1).rotation.x = Math.PI / 2;
  // portraits on the side walls
  for (const s of [-1, 1]) { const pf = G(); pf.position.set(s * 6.95, 3.6, -3); pf.rotation.y = -s * Math.PI / 2; g.add(pf); M(box(1.3, 1.6, .06), mat('#D9B23A', { m: .7, r: .3 }), pf); M(box(1.1, 1.4, .02), mat(s < 0 ? '#3A4A3A' : '#4A3A2E'), pf, 0, 0, .04); M(sph(.22, 14, 10), mat('#D9B08A'), pf, 0, .2, .06).scale.set(1, 1.2, .2); M(sph(.4, 14, 10), mat(s < 0 ? '#1E2A3A' : '#5A2A2A'), pf, 0, -.35, .06).scale.set(1, .7, .2); }
  // the crystal chandelier
  const ch = G(); ch.position.set(0, 5.3, -1.5); g.add(ch); g.userData.chandelier = ch;
  M(cyl(.012, .012, 1.6, 6), mat('#D9B23A', { m: .8, r: .3 }), ch, 0, .9, 0);
  for (let r = 0; r < 2; r++) { const R0 = .8 - r * .35; M(tor(R0, .03, 6, 32), mat('#D9B23A', { m: .8, r: .3 }), ch, 0, -r * .35, 0).rotation.x = Math.PI / 2;
    for (let k = 0; k < 10 - r * 4; k++) { const a = k / (10 - r * 4) * Math.PI * 2; const b = M(sph(.06, 10, 8), mat('#FFF1C8', { e: '#FFE3A0', ei: 2.2 }), ch, Math.cos(a) * R0, .08 - r * .35, Math.sin(a) * R0); b.castShadow = false; const d = M(new THREE.OctahedronGeometry(.045), mat('#F4FAFF', { m: .2, r: .05, t: true, op: .7 }), ch, Math.cos(a) * R0, -.12 - r * .35, Math.sin(a) * R0); d.castShadow = false; d.scale.y = 1.8; } }
  const cl = new THREE.PointLight('#FFE3B0', 8, 12, 1.6); cl.position.set(0, 4.9, -1.5); g.add(cl);
  // the meeting table and chairs
  const tbl = G(); tbl.position.set(0, 0, -1.5); g.add(tbl); g.userData.table = tbl;
  M(box(3.8, .1, 1.7, .03), mat('#4A2A18', { r: .3 }), tbl, 0, .78, 0); M(box(3.4, .015, 1.3), mat('#2E5A3E', { r: .9 }), tbl, 0, .835, 0);
  for (const x of [-1.7, 1.7]) for (const z of [-.7, .7]) M(cyl(.05, .04, .75, 10), mat('#3A1E10', { r: .4 }), tbl, x, .38, z);
  const chairAt = (x, z, ry) => { const c = G(); c.position.set(x, 0, z); c.rotation.y = ry; tbl.add(c); M(box(.5, .08, .5, .03), mat('#8E1B2A', { r: .85 }), c, 0, .48, 0); M(box(.5, .7, .07, .03), mat('#8E1B2A', { r: .85 }), c, 0, .86, -.24); M(box(.56, .06, .1, .02), mat('#D9B23A', { m: .7, r: .3 }), c, 0, 1.22, -.24); for (const xx of [-.21, .21]) for (const zz of [-.21, .21]) M(cyl(.025, .02, .46, 8), mat('#3A1E10'), c, xx, .23, zz); return c; };
  g.userData.chairs = [chairAt(-1.0, 1.25, Math.PI), chairAt(0, 1.25, Math.PI), chairAt(1.0, 1.25, Math.PI), chairAt(-1.0, -1.25, 0), chairAt(1.0, -1.25, 0), chairAt(2.4, 0, -Math.PI / 2)];
  // papers, a blueprint of the tower, glasses, a bottle on the table
  const bp = textPlane([{ text: 'TOUR EIFFEL', size: 64, y: 60, color: '#E8F0FF' }, { text: '7,300 TONNES', size: 44, y: 200, color: '#BFD3FF' }], .9, .6, { w: 512, h: 340, bg: '#2A4A8A', round: 6 });
  bp.rotation.x = -Math.PI / 2; bp.position.set(.2, .845, .1); tbl.add(bp);
  for (let k = 0; k < 4; k++) { const gl = M(cyl(.035, .03, .12, 12), mat('#E8F4FF', { t: true, op: .45, r: .05 }), tbl, -1.3 + k * .85, .9, .45 - (k % 2) * .9); gl.castShadow = false; }
  M(cyl(.05, .06, .3, 12), mat('#2E4A2E', { r: .1 }), tbl, 1.45, .99, -.2); M(cyl(.02, .02, .1, 8), mat('#2E4A2E'), tbl, 1.45, 1.19, -.2);
  // potted palms
  for (const s of [-1, 1]) { const pl = G(); pl.position.set(s * 5.8, 0, -5.6); g.add(pl); M(cyl(.35, .28, .6, 16), mat('#D9B23A', { m: .5, r: .4 }), pl, 0, .3, 0); for (let k = 0; k < 9; k++) { const a = k * .7; const lf = M(box(.12, .02, 1.1, .01), mat('#3E6A3A'), pl, Math.cos(a) * .3, 1.1, Math.sin(a) * .3); lf.rotation.set(-.6, -a + Math.PI / 2, 0); } }
  return g;
}
