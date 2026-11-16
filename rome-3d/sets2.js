// sets2.js · the Praetorian camp, the Senate house, the road to Rome, and instanced crowds of soldiers / senators
import * as THREE from 'three';
import { mat, C, G, M, box, sph, cyl, cap, tor, laurel, textPlane, texFrom, rng } from './kit.js';
import { column } from './sets.js';

function canvasTex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = texFrom(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); return t; }
const plane = (w, h, m) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.receiveShadow = true; return p; };
const noiseTex = (base, dots, rep, seed = 2, n = 3000) => canvasTex(512, 512, (g, w, h) => { const R = rng(seed); g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { g.fillStyle = dots[Math.floor(R() * dots.length)]; g.globalAlpha = .25 + R() * .4; const r = 1 + R() * 4; g.beginPath(); g.arc(R() * w, R() * h, r, 0, 7); g.fill(); } g.globalAlpha = 1; }, rep);
const blocks = (base, line, rep) => canvasTex(512, 512, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); const R = rng(5); for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { g.fillStyle = `rgba(0,0,0,${(R() * .08).toFixed(3)})`; g.fillRect(x * 128 + (y % 2) * 64, y * 64, 126, 62); } g.strokeStyle = line; g.lineWidth = 4; for (let y = 0; y <= 8; y++) { g.beginPath(); g.moveTo(0, y * 64); g.lineTo(w, y * 64); g.stroke(); } for (let y = 0; y < 8; y++) for (let x = 0; x <= 4; x++) { const xx = x * 128 + (y % 2) * 64; g.beginPath(); g.moveTo(xx, y * 64); g.lineTo(xx, y * 64 + 64); g.stroke(); } }, rep);

// ---------- an instanced crowd of simple people (soldiers or senators) ----------
// kind 'soldier': red tunic, gold or steel helmet with crest, shield; 'senator': white toga with a purple stripe
export function troop(n, place, kind = 'soldier', seed = 1, o = {}) {
  const g = G(), R = rng(seed);
  const tunic = kind === 'soldier' ? (o.tunic ?? C.red) : C.wool;
  const parts = [
    { geo: cap(.17, .62, 10), m: mat(tunic, { r: .75 }), y: .98 },                      // torso
    { geo: cyl(.16, .25, .5, 14, true), m: mat(tunic, { r: .75, side: THREE.DoubleSide }), y: .62 },   // skirt
    { geo: cap(.05, .5, 8), m: mat(o.skin ?? '#D9A07A'), y: .3, x: -.08 }, { geo: cap(.05, .5, 8), m: mat(o.skin ?? '#D9A07A'), y: .3, x: .08 },   // legs
    { geo: sph(.11, 16, 12), m: mat(o.skin ?? '#D9A07A'), y: 1.52 },                     // head
  ];
  if (kind === 'soldier') {
    parts.push({ geo: new THREE.SphereGeometry(.125, 16, 8, 0, Math.PI * 2, 0, Math.PI * .52), m: mat(o.helmet ?? C.gold, { r: .3, m: .7 }), y: 1.55 });
    parts.push({ geo: box(.03, .1, .26, .01), m: mat(o.crest ?? C.red, { r: .9 }), y: 1.72 });
    parts.push({ geo: box(.5, .78, .06, .03), m: mat(o.shield ?? C.red, { r: .6 }), y: .95, z: .24, x: -.16 });
    parts.push({ geo: cyl(.012, .012, 2.1, 6), m: mat(C.woodD), y: 1.15, x: .26 });
    parts.push({ geo: new THREE.ConeGeometry(.03, .15, 6), m: mat(C.steel, { m: .7, r: .3 }), y: 2.25, x: .26 });
  } else {
    parts.push({ geo: new THREE.SphereGeometry(.118, 16, 8, 0, Math.PI * 2, 0, Math.PI * .45), m: mat(C.hairD, { r: .9 }), y: 1.55, tilt: -.4 });
    parts.push({ geo: tor(.2, .03, 6, 20, Math.PI * 1.2), m: mat(C.purple), y: 1.1, rz: .9, z: .02 });
  }
  const ims = parts.map(p => { const im = new THREE.InstancedMesh(p.geo, p.m, n); im.castShadow = true; im.receiveShadow = true; g.add(im); return im; });
  const items = []; for (let i = 0; i < n; i++) { const [x, z, ry] = place(i, R); items.push({ x, z, ry: ry ?? 0, ph: R(), sc: .94 + R() * .12 }); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s3 = new THREE.Vector3(), m2 = new THREE.Matrix4();
  // o.march: steps per second; o.hop: cheer bounce; o.clap
  g.userData.update = (t, u = {}) => {
    items.forEach((it, i) => {
      const step = u.march ? (t * u.march + it.ph * .2) : 0;
      const bob = u.march ? Math.abs(Math.sin(step * Math.PI)) * .05 : 0, hop = u.hop ? Math.max(0, Math.sin((t * 2.2 + it.ph) * Math.PI)) * .16 * u.hop : 0;
      const dz = u.march ? (u.adv ?? 0) : 0;
      const base = new THREE.Matrix4().compose(v.set(it.x, bob + hop, it.z + dz), q.setFromEuler(e.set(0, it.ry, 0)), s3.setScalar(it.sc));
      parts.forEach((p, k) => {
        let lx = p.x ?? 0, ly = p.y, lz = p.z ?? 0, rx = p.tilt ?? 0, rz = p.rz ?? 0;
        if (u.march && k >= 2 && k <= 3) { rx = Math.sin(step * Math.PI + (k === 2 ? 0 : Math.PI)) * .45; }
        m2.compose(v.set(lx, ly, lz), q.setFromEuler(e.set(rx, 0, rz)), s3.set(1, 1, 1));
        m4.multiplyMatrices(base, m2); ims[k].setMatrixAt(i, m4);
      });
    });
    ims.forEach(im => im.instanceMatrix.needsUpdate = true);
  };
  g.userData.update(0);
  return g;
}

// ======================= THE PRAETORIAN CAMP (golden hour) =======================
export function camp() {
  const g = G(); g.name = 'camp';
  const ground = plane(160, 160, new THREE.MeshStandardMaterial({ map: noiseTex('#B9A06E', ['#8FA05A', '#A08A58', '#C7B080', '#7E9450'], [24, 24], 2, 5000), roughness: .95 })); ground.rotation.x = -Math.PI / 2; g.add(ground);
  const wm = new THREE.MeshStandardMaterial({ map: blocks('#D8B98C', 'rgba(110,80,50,.35)', [6, 2]), roughness: .9 });
  // the wall runs along x at z = 0 (the camp is at z < 0, outside at z > 0); a gate in the middle
  const wall = G(); g.add(wall); g.userData.wall = wall;
  for (const s of [-1, 1]) {
    const seg = M(box(24, 6, 2.4), wm, wall, s * 15, 3, 0);
    for (let i = 0; i < 18; i++) M(box(.8, .8, 2.4), wm, wall, s * (3.6 + i * 1.3), 6.4, 0);
    const tw = M(box(4, 9, 4), wm, wall, s * 4.6, 4.5, 0); for (let i = 0; i < 4; i++) for (const z of [-1.6, 1.6]) M(box(.7, .8, .7), wm, wall, s * 4.6 - 1.5 + i, 9.4, z);
  }
  M(box(5.6, 2.2, 2.6), wm, wall, 0, 7.1, 0);
  M(box(6.4, .7, 2.8, .05), mat('#CDB083', { r: .85 }), wall, 0, 6.25, 0);   // stone lintel over the gate
  const plaque = textPlane([{ text: 'CASTRA PRAETORIA', size: 92, y: 80, color: '#5A3A12' }], 4.2, .42, { w: 1400, h: 140, bg: '#E9C46A', round: 18 });
  plaque.position.set(0, 6.25, 1.42); wall.add(plaque);
  const gate = M(box(5.2, 5.9, .2), mat(C.woodD, { r: .8 }), wall, 0, 2.95, .2);
  for (let i = 0; i < 6; i++) M(box(.08, 5.9, .25), mat('#4A2C15'), wall, -2.3 + i * .92, 2.95, .25);
  // walkway on top (for the guards) on the inside
  M(box(48, .3, 2), wm, wall, 0, 6.1, -2.2);
  // banner FOR SALE that unrolls down the gate tower
  const ban = G(); ban.position.set(0, 7.9, 1.6); wall.add(ban); g.userData.banner = ban;
  const cloth = textPlane([{ text: 'FOR SALE', size: 210, y: 300, color: '#FFE9A8', stroke: '#5A0E16', sw: 22 }, { text: 'THE EMPIRE', size: 120, y: 520, color: '#FFFFFF', stroke: '#5A0E16', sw: 16 }, { text: 'HIGHEST BID WINS', size: 82, y: 720, color: '#FFE9A8' }],
    4.6, 4.2, { w: 1100, h: 1000, bg: '#B11E2E', round: 0 });
  cloth.position.y = -2.1; cloth.castShadow = true; ban.add(cloth); g.userData.cloth = cloth;
  M(cyl(.08, .08, 4.9, 10), C.gold, ban, 0, 0, .02).rotation.z = Math.PI / 2;
  // inside: the parade ground with a wooden platform and tents
  const plat = G(); plat.position.set(0, 0, -11); g.add(plat); g.userData.platform = plat;
  M(box(4, 1.2, 3, .04), C.wood, plat, 0, .6, 0); for (let i = 0; i < 3; i++) M(box(1.4, .4, .5), C.woodD, plat, 0, .2 + i * .4, 1.75 - i * .45);
  const stripe = canvasTex(256, 256, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#B9302F' : '#F1E6CF'; c.fillRect(i * 32, 0, 32, h); } });
  for (let i = 0; i < 10; i++) { const tent = G(); tent.position.set(-16 + (i % 5) * 8, 0, -21 - Math.floor(i / 5) * 7); tent.rotation.y = (i % 2) * .2; g.add(tent);
    const sh = new THREE.Shape(); sh.moveTo(-1.6, 0); sh.lineTo(1.6, 0); sh.lineTo(0, 2.2); sh.lineTo(-1.6, 0);
    const t = M(new THREE.ExtrudeGeometry(sh, { depth: 3.4, bevelEnabled: false }), new THREE.MeshStandardMaterial({ map: stripe, roughness: .9 }), tent, 0, 0, -1.7);
    M(cyl(.04, .04, 2.6, 6), C.woodD, tent, 0, 1.3, 1.75); }
  for (const x of [-6, 6]) { const st = G(); st.position.set(x, 0, -9); g.add(st); M(cyl(.06, .06, 4, 8), C.woodD, st, 0, 2, 0); const eagle = M(new THREE.OctahedronGeometry(.35), mat(C.gold, { m: .7, r: .3 }), st, 0, 4.2, 0); eagle.scale.set(1.4, .7, .4); const fl = M(box(1, .7, .03), C.red, st, .55, 3.4, 0); fl.castShadow = true; }
  // the treasure chest by the platform
  const chest = G(); chest.position.set(1.6, 1.2, -10.4); g.add(chest); g.userData.chest = chest;
  M(box(.8, .45, .5, .04), C.woodD, chest, 0, .22, 0); const lid = G(); lid.position.set(0, .45, -.25); chest.add(lid);
  M(box(.82, .12, .52, .04), C.wood, lid, 0, .06, .25); g.userData.chestLid = lid;
  const coinsIn = M(box(.74, .08, .44), mat(C.gold, { m: .7, r: .3, e: '#7A4A00', ei: .3 }), chest, 0, .42, 0);
  // distant hills
  for (let i = 0; i < 7; i++) { const h = M(sph(18, 20, 10), mat(['#8DAA5E', '#7E9C55', '#9AB56A'][i % 3], { r: 1 }), g, -60 + i * 20, -10, -80 - (i % 2) * 15); h.scale.set(1.4, .7, 1); h.castShadow = false; }
  for (let i = 0; i < 7; i++) { const h = M(sph(18, 20, 10), mat(['#8DAA5E', '#7E9C55', '#9AB56A'][i % 3], { r: 1 }), g, -60 + i * 20, -10, 70 + (i % 2) * 15); h.scale.set(1.4, .7, 1); h.castShadow = false; }
  for (let i = 0; i < 14; i++) { const cy = M(new THREE.ConeGeometry(.6, 4.5, 10), mat('#3F6B3A', { r: .9 }), g, -40 + i * 6.3, 2.25, 22 + (i % 3) * 4); }
  return g;
}

// ======================= THE SENATE HOUSE (interior) =======================
export function senate() {
  const g = G(); g.name = 'senate';
  const floor = plane(40, 40, new THREE.MeshStandardMaterial({ map: canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#E3D6BF'; c.fillRect(0, 0, w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const cx = x * 128 + 64, cy = y * 128 + 64; c.fillStyle = (x + y) % 2 ? '#7A3B5E' : '#3F6B5A'; c.beginPath(); c.moveTo(cx, cy - 46); c.lineTo(cx + 46, cy); c.lineTo(cx, cy + 46); c.lineTo(cx - 46, cy); c.fill(); c.fillStyle = '#E9C46A'; c.beginPath(); c.arc(cx, cy, 14, 0, 7); c.fill(); } }, [10, 10]), roughness: .4 }));
  floor.rotation.x = -Math.PI / 2; g.add(floor);
  const wallM = mat('#E7D3B0', { r: .85 });
  const back = plane(30, 16, wallM); back.position.set(0, 8, -12); g.add(back);
  for (const s of [-1, 1]) { const sw = plane(40, 16, wallM); sw.rotation.y = -s * Math.PI / 2; sw.position.set(s * 8.5, 8, 0); g.add(sw); }
  for (let i = 0; i < 5; i++) { const n = M(box(1.4, 3.2, .3), mat('#C9A97A'), g, -6 + i * 3, 5, -11.85); n.castShadow = false; }
  const statue = G(); statue.position.set(0, 0, -10.5); g.add(statue);   // a winged Victory on a column
  M(box(1.2, 2, 1.2, .04), C.marble, statue, 0, 1, 0); M(cap(.25, .8, 10), mat('#F2E9D8'), statue, 0, 2.9, 0); M(sph(.18, 14, 10), mat('#F2E9D8'), statue, 0, 3.6, 0);
  for (const s of [-1, 1]) { const w = M(box(.06, 1.1, .5, .03), mat('#F2E9D8'), statue, s * .45, 3.3, -.1); w.rotation.z = s * .5; }
  // tiered benches on both sides (three steps)
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) M(box(2.2, .5 + i * .5, 18, .04), C.marbleD, g, s * (3.4 + i * 1.6), (.5 + i * .5) / 2, -1);
  // red carpet aisle
  const carpet = plane(2, 20, mat('#A0263A', { r: .95 })); carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, .012, 0); g.add(carpet);
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const c = column(10, .34, C.marble); c.position.set(s * 7.6, 0, -9 + i * 6); g.add(c); }
  const ceil = plane(20, 30, mat('#C99A5E', { r: .9 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 13, -1); g.add(ceil);
  // high windows as light sources
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const w = M(box(.1, 2.2, 1.4), mat('#FFF2CF', { e: '#FFE7B0', ei: 1.4 }), g, s * 8.44, 10.5, -7 + i * 6); w.castShadow = false; }
  return g;
}

// ======================= THE ROAD TO ROME (day, landscape) =======================
export function road() {
  const g = G(); g.name = 'road';
  const geo = new THREE.PlaneGeometry(400, 400, 120, 120); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, col = [];
  const rd = x => Math.sin(x * .02) * 8;   // the road's centre line x(z)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), d = Math.abs(x - rd(z));
    let h = (Math.sin(x * .03) * Math.cos(z * .025) * 6 + Math.sin(x * .011 + 1) * 9 + Math.cos(z * .013) * 5) * Math.min(1, Math.max(0, (d - 8) / 30));
    pos.setY(i, h);
    const c = new THREE.Color(h > 6 ? '#8FB25E' : h > 1 ? '#7FA653' : '#93B864'); if (d < 4.5) c.set('#C8A777'); col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  const land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })); land.receiveShadow = true; g.add(land);
  // cypress and umbrella pines along the road
  const R = rng(9);
  for (let i = 0; i < 60; i++) {
    const z = -180 + i * 6, s = i % 2 ? 1 : -1, x = rd(z) + s * (7 + R() * 4);
    if (R() < .6) { const c = M(new THREE.ConeGeometry(.7, 6 + R() * 2, 10), mat('#3C6B39', { r: .9 }), g, x, 3.2, z); }
    else { M(cyl(.15, .2, 3, 8), C.woodD, g, x, 1.5, z); const top = M(sph(2, 14, 8), mat('#4E7D3F', { r: .9 }), g, x, 3.6, z); top.scale.set(1.4, .55, 1.4); }
  }
  // the walls and gate of Rome at the far end (z = -150)
  const wm = new THREE.MeshStandardMaterial({ map: blocks('#E2C9A0', 'rgba(110,80,50,.3)', [10, 2]), roughness: .9 });
  const rome = G(); rome.position.set(rd(-150), 0, -150); g.add(rome); g.userData.rome = rome;
  for (const s of [-1, 1]) { M(box(60, 10, 4), wm, rome, s * 34, 5, 0); M(box(6, 15, 6), wm, rome, s * 5, 7.5, 0); for (let i = 0; i < 20; i++) M(box(1.2, 1.2, 4), wm, rome, s * (8 + i * 2.6), 10.6, 0); }
  M(box(4, 5, 4), wm, rome, 0, 12.5, 0); M(box(4, 8, .3), mat('#4A2C15'), rome, 0, 4, 2.1);
  for (let i = 0; i < 9; i++) { const h = 6 + (i % 3) * 4; const b = M(box(6, h, 6), ['#EED9B4', '#E6C79C', '#F2E2C2'][i % 3], rome, -24 + i * 6, h / 2, -12 - (i % 2) * 6); const roof = M(new THREE.CylinderGeometry(.01, 4.4, 2.2, 4), C.terracotta, rome, -24 + i * 6, h + 1.1, -12 - (i % 2) * 6); roof.rotation.y = Math.PI / 4; }
  const dome = M(new THREE.SphereGeometry(7, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), C.marble, rome, 10, 14, -26); M(cyl(7, 7, 6, 24), C.marble, rome, 10, 11, -26);
  g.userData.roadX = rd;
  return g;
}
