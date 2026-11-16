// sets4.js · more of 1925 Paris: the front of the Hôtel de Crillon with a police station across the street, an open
// 1920s tourer, and the hand props of the con (newspaper, forged letter, rubber stamp, the SOLD tag, banknotes, whistle).
import * as THREE from 'three';
import { mat, G, M, box, sph, cyl, tor, textPlane, texFrom, rng } from './kit.js';

function ctex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = texFrom(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); return t; }
const plane = (w, h, m) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.receiveShadow = true; return p; };
const TRI = ['#2B4FA0', '#F4F1EA', '#C8283A'];
// a French flag hanging from its top-left corner (+x along the fly); wave by rotating .userData.cloth
function flag(w, h) { const g = G(); const t = ctex(96, 64, (c) => TRI.forEach((col, k) => { c.fillStyle = col; c.fillRect(k * 32, 0, 32, 64); }));
  const geo = new THREE.PlaneGeometry(w, h, 12, 2); geo.translate(w / 2, -h / 2, 0); const cl = M(geo, new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: .85 }), g); g.userData.cloth = cl; g.userData.w = w;
  g.userData.wave = tt => { const p = geo.attributes.position, base = geo.userData.base ??= p.array.slice(); for (let i = 0; i < p.count; i++) { const x = base[i * 3]; p.array[i * 3 + 2] = Math.sin(x * 3 - tt * 5) * .08 * x / w; } p.needsUpdate = true; geo.computeVertexNormals(); };
  return g; }

// ======================= AN OPEN 1920s TOURER =======================
export function tourer(col = '#1E2A3A') {
  const g = G(), body = mat(col, { r: .22, m: .4 }), chrome = mat('#E2E2E6', { m: .95, r: .16 }), tyre = mat('#161616', { r: .85 }), leather = mat('#7A3A22', { r: .55 }), dark = mat('#0E0E10', { r: .4 });
  M(box(1.52, .5, 3.3, .1), body, g, 0, .78, -.1);                                     // tub
  M(box(1.08, .52, 1.3, .1), body, g, 0, .98, 1.45);                                   // bonnet
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) M(box(.012, .2, .05), dark, g, s * .545, .98, 1.1 + i * .12);  // louvres
  const rad = G(); rad.position.set(0, 1.0, 2.13); g.add(rad); M(box(.92, .66, .08, .04), chrome, rad); M(box(.78, .52, .09), mat('#2A2A2E', { r: .5, m: .5 }), rad, 0, 0, .01);
  M(sph(.06, 12, 8), chrome, rad, 0, .4, 0);                                            // radiator cap
  for (const s of [-1, 1]) { const l = G(); l.position.set(s * .62, 1.15, 2.1); g.add(l); M(new THREE.SphereGeometry(.16, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), chrome, l).rotation.x = Math.PI / 2; M(cyl(.14, .14, .02, 18), mat('#FFF4D0', { e: '#FFE7A0', ei: .9 }), l, 0, 0, .01).rotation.x = Math.PI / 2; M(cyl(.02, .02, .3, 6), chrome, l, 0, -.2, -.05); }
  // windscreen
  const ws = G(); ws.position.set(0, 1.03, .62); ws.rotation.x = -.18; g.add(ws);
  M(box(1.36, .05, .05), chrome, ws, 0, .5, 0); for (const s of [-1, 1]) M(box(.05, .52, .05), chrome, ws, s * .66, .25, 0);
  M(new THREE.PlaneGeometry(1.3, .46), new THREE.MeshStandardMaterial({ color: '#CFE4F2', transparent: true, opacity: .22, roughness: .05, side: THREE.DoubleSide }), ws, 0, .25, 0);
  // seats (open cockpit): front bench + rear bench, with backs
  for (const [z, w] of [[-.05, 1.3], [-1.15, 1.36]]) { M(box(w, .16, .62, .07), leather, g, 0, .92, z); M(box(w, .5, .14, .07), leather, g, 0, 1.18, z - .34); }
  M(box(1.4, .08, .08, .03), dark, g, 0, 1.06, .52);                                     // dashboard
  const wheel = G(); wheel.position.set(-.34, 1.22, .4); wheel.rotation.x = -.95; g.add(wheel); M(tor(.17, .018, 8, 26), dark, wheel); M(cyl(.02, .02, .5, 8), dark, wheel, 0, -.02, 0).rotation.x = Math.PI / 2; g.userData.wheel = wheel;
  // wheels with spokes, fenders, running boards, spare
  g.userData.wheels = [];
  for (const x of [-.82, .82]) for (const z of [-1.2, 1.45]) {
    const w = G(); w.position.set(x, .44, z); g.add(w); g.userData.wheels.push(w);
    const t = M(tor(.36, .085, 12, 28), tyre, w); t.rotation.y = Math.PI / 2;
    const rim = M(tor(.28, .02, 6, 24), mat('#C9A24A', { m: .7, r: .3 }), w); rim.rotation.y = Math.PI / 2;
    for (let k = 0; k < 10; k++) { const sp = M(cyl(.011, .011, .54, 5), mat('#C9A24A', { m: .7, r: .3 }), w); sp.rotation.x = k * Math.PI / 10; }
    M(cyl(.07, .07, .16, 12), chrome, w).rotation.z = Math.PI / 2;
    const f = M(new THREE.CylinderGeometry(.5, .5, .3, 24, 1, true, -Math.PI * .55, Math.PI * 1.1), mat(col, { r: .22, m: .4, side: THREE.DoubleSide }), g, x * 1.02, .46, z); f.rotation.z = Math.PI / 2; f.rotation.y = 0; f.rotation.order = 'ZYX';
  }
  for (const s of [-1, 1]) M(box(.3, .05, 1.6, .02), dark, g, s * .9, .5, .1);
  const sp = G(); sp.position.set(0, .9, -1.9); g.add(sp); M(tor(.32, .08, 10, 24), tyre, sp); M(cyl(.24, .24, .05, 20), body, sp).rotation.x = Math.PI / 2;
  M(box(1.5, .08, .1, .03), chrome, g, 0, .55, 2.12); M(box(1.5, .08, .1, .03), chrome, g, 0, .55, -1.78);   // bumpers
  g.userData.seat = { x: -.34, y: 1.0, z: -.05 };   // driver's seat top (car space)
  return g;
}

// ======================= HÔTEL DE CRILLON + THE POLICE STATION =======================
function stoneTex(w, h, rows, col = '#E7DDC8') { return ctex(512, 512, (c, W, H) => { const R = rng(5); c.fillStyle = col; c.fillRect(0, 0, W, H); for (let y = 0; y < rows; y++) { c.fillStyle = 'rgba(90,70,40,.22)'; c.fillRect(0, y * H / rows, W, 3); for (let k = 0; k < 60; k++) { c.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '80,60,30'},.05)`; c.fillRect(R() * W, y * H / rows + R() * H / rows, 6 + R() * 20, 2); } } }, [w, h]); }
export function hotelStreet() {
  const g = G(); g.name = 'hotel';
  const cob = ctex(512, 512, (c, w, h) => { const R = rng(9); c.fillStyle = '#6E6A66'; c.fillRect(0, 0, w, h); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const v = 88 + R() * 42; c.fillStyle = `rgb(${v},${v - 4},${v - 9})`; c.beginPath(); c.roundRect(x * 32 + 2 + (y % 2) * 16, y * 32 + 2, 28, 28, 7); c.fill(); } }, [14, 10]);
  const road = plane(120, 60, new THREE.MeshStandardMaterial({ map: cob, roughness: .85 })); road.rotation.x = -Math.PI / 2; road.position.z = 4; g.add(road);
  const pav = ctex(256, 256, (c, w, h) => { c.fillStyle = '#BDB5A8'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(60,50,40,.25)'; c.lineWidth = 3; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(0, i * 64); c.lineTo(w, i * 64); c.stroke(); c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, h); c.stroke(); } }, [30, 2]);
  for (const [z, d] of [[-7.5, 4], [16.5, 4]]) { const sw = plane(120, d, new THREE.MeshStandardMaterial({ map: pav, roughness: .8 })); sw.rotation.x = -Math.PI / 2; sw.position.set(0, .16, z); g.add(sw); M(box(120, .16, .3), '#A8A096', g, 0, .08, z + (z < 0 ? d / 2 : -d / 2)); }
  // ---- the hotel: rusticated arcade, a colonnade over two floors, balustrade, flags, canopy and sign ----
  const H = G(); H.position.z = -9.5; g.add(H);
  const base = new THREE.MeshStandardMaterial({ map: stoneTex(6, 1, 6), roughness: .85 }), wall = new THREE.MeshStandardMaterial({ map: stoneTex(6, 2, 10, '#ECE3D0'), roughness: .85 }), stone = mat('#EFE6D2', { r: .8 }), stoneD = mat('#D9CDB4', { r: .85 });
  M(box(40, 5.6, 1.2), base, H, 0, 2.8, 0);
  M(box(40, 9.4, 1), wall, H, 0, 10.3, -.3);
  const arch = ctex(256, 384, (c, w, h) => { c.fillStyle = '#2A2A30'; c.beginPath(); c.moveTo(0, h); c.lineTo(0, w / 2); c.arc(w / 2, w / 2, w / 2, Math.PI, 0); c.lineTo(w, h); c.fill(); const gr = c.createLinearGradient(0, h, 0, w / 2); gr.addColorStop(0, 'rgba(255,200,120,.75)'); gr.addColorStop(1, 'rgba(255,200,120,.15)'); c.fillStyle = gr; c.fillRect(20, w / 2 + 10, w - 40, h - w / 2 - 10); c.strokeStyle = '#1A1A1E'; c.lineWidth = 8; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(i * w / 4, w / 2 - 40); c.lineTo(i * w / 4, h); c.stroke(); } for (let j = 0; j < 5; j++) { c.beginPath(); c.moveTo(0, w / 2 + j * 50); c.lineTo(w, w / 2 + j * 50); c.stroke(); } });
  const am = new THREE.MeshStandardMaterial({ map: arch, transparent: true, emissive: '#FFB866', emissiveMap: arch, emissiveIntensity: .35, roughness: .3 });
  for (let i = -6; i <= 6; i++) { if (i === 0) continue; const a = plane(2.1, 3.6, am); a.position.set(i * 3, 2.25, .61); H.add(a); M(box(2.5, .3, .15), stoneD, H, i * 3, 4.25, .66); }
  const win = ctex(256, 512, (c, w, h) => { c.fillStyle = '#ECE3D0'; c.fillRect(0, 0, w, h); c.fillStyle = '#D9CDB4'; c.fillRect(30, 40, w - 60, h - 80); c.fillStyle = '#34405A'; c.fillRect(46, 70, w - 92, h - 130); c.strokeStyle = '#ECE3D0'; c.lineWidth = 8; c.beginPath(); c.moveTo(w / 2, 70); c.lineTo(w / 2, h - 60); for (let j = 1; j < 4; j++) { c.moveTo(46, 70 + j * (h - 130) / 4); c.lineTo(w - 46, 70 + j * (h - 130) / 4); } c.stroke(); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(50, 74, 60, h - 140); });
  const wm = new THREE.MeshStandardMaterial({ map: win, roughness: .5 });
  for (let i = -6; i <= 6; i++) for (const y of [8.2, 12.1]) { const p = plane(1.6, 3.0, wm); p.position.set(i * 3, y, .21); H.add(p); }
  for (let i = -6; i <= 6; i++) M(box(1.9, .9, .4), mat('#1C1C1E', { m: .4, r: .5 }), H, i * 3, 6.6, .45);          // iron balconies
  // the colonnade: twelve columns standing proud of the wall
  for (let i = -6; i <= 5; i++) { const x = i * 3 + 1.5; M(cyl(.36, .42, 8.2, 18), stone, H, x, 9.9, 1.0); M(box(1.0, .5, 1.0), stoneD, H, x, 14.1, 1.0); M(box(1.0, .4, 1.0), stoneD, H, x, 5.95, 1.0); }
  M(box(40, 1.2, 2.0), stone, H, 0, 14.9, .55); M(box(40.6, .35, 2.4), stoneD, H, 0, 15.6, .55);
  for (let i = 0; i < 80; i++) M(cyl(.09, .13, .8, 8), stone, H, -19.5 + i * .5, 16.2, .9);          // roof balustrade
  M(box(40, .2, .5), stoneD, H, 0, 16.65, .9);
  for (let i = -6; i <= 6; i += 3) { M(sph(.35, 14, 10), stone, H, i * 3, 17.05, .9); }
  // mansard roof
  const roof = M(box(40, 3, 6), mat('#6E7A86', { r: .5, m: .3 }), H, 0, 17.5, -3); roof.rotation.x = .25;
  // entrance: glass canopy (marquise), sign, flags, carpet, potted bay trees, lamps
  const door = plane(2.6, 4.0, new THREE.MeshStandardMaterial({ map: arch, emissive: '#FFB866', emissiveMap: arch, emissiveIntensity: .7, transparent: true })); door.position.set(0, 2.4, .62); H.add(door);
  const can = G(); can.position.set(0, 4.6, 2.2); H.add(can); M(box(5.2, .12, 3.0, .04), mat('#1C1C1E', { m: .5, r: .4 }), can); M(box(5.0, .04, 2.8), mat('#F6E7B8', { e: '#FFE2A0', ei: .4, t: true, op: .8 }), can, 0, -.07, 0);
  for (const s of [-1, 1]) { const ch = M(cyl(.03, .03, 2.0, 6), mat('#1C1C1E', { m: .5 }), can, s * 2.4, .9, 1.3); ch.rotation.x = -.6; }
  const sign = textPlane([{ text: 'HÔTEL DE CRILLON', size: 120, y: 90, color: '#F2D79A' }], 9, 1.2, { w: 1600, h: 200, bg: '#1A1A1E', round: 16 }); sign.position.set(0, 5.35, .68); H.add(sign);
  const carpet = plane(2.2, 4.2, mat('#A3202C', { r: .9 })); carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, .17, 2.6); H.add(carpet);
  for (const s of [-1, 1]) {
    const fp = G(); fp.position.set(s * 4.5, 7.4, .9); fp.rotation.z = -s * .9; H.add(fp); M(cyl(.04, .04, 3.4, 6), mat('#D9B23A', { m: .7, r: .3 }), fp, 0, 1.7, 0);
    const fl = flag(1.3, .9); fl.position.set(0, 3.3, 0); fl.rotation.z = s * .9; fp.add(fl); (g.userData.flags ??= []).push(fl);
    const pot = G(); pot.position.set(s * 2.0, .16, 1.0); H.add(pot); M(cyl(.35, .28, .6, 16), mat('#2A2A30', { m: .3 }), pot, 0, .3, 0); M(cyl(.05, .05, .9, 6), mat('#5A4030'), pot, 0, 1.0, 0); M(sph(.55, 16, 12), mat('#3E6E3A', { r: .9 }), pot, 0, 1.75, 0);
    const lp = G(); lp.position.set(s * 1.7, 2.6, .8); H.add(lp); M(box(.3, .45, .3, .05), mat('#FFE7B0', { e: '#FFD78A', ei: 1.2 }), lp); M(box(.36, .06, .36), mat('#1C1C1E'), lp, 0, .26, 0);
  }
  g.userData.hotelDoor = new THREE.Vector3(0, 0, -7.6);
  // ---- across the street: the police station between two plain buildings ----
  const Pz = 19.5, PS = G(); PS.position.z = Pz; PS.rotation.y = Math.PI; g.add(PS);
  const pw = new THREE.MeshStandardMaterial({ map: stoneTex(4, 2, 8, '#E2D6BE'), roughness: .85 });
  M(box(14, 11, 1), pw, PS, 0, 5.5, 0);
  for (let i = -2; i <= 2; i++) for (const y of [6.2, 9.0]) { const p = plane(1.4, 2.4, wm); p.position.set(i * 2.6, y, .51); PS.add(p); }
  const pd = plane(2.0, 3.2, new THREE.MeshStandardMaterial({ map: ctex(128, 256, (c, w, h) => { c.fillStyle = '#2E3E5E'; c.fillRect(0, 0, w, h); c.strokeStyle = '#1A2238'; c.lineWidth = 6; c.strokeRect(10, 10, w / 2 - 14, h - 20); c.strokeRect(w / 2 + 4, 10, w / 2 - 14, h - 20); c.fillStyle = '#D9B23A'; c.fillRect(w / 2 - 14, h / 2, 6, 20); c.fillRect(w / 2 + 8, h / 2, 6, 20); }), roughness: .5 }));
  pd.position.set(0, 1.76, .51); PS.add(pd);
  const psign = textPlane([{ text: 'COMMISSARIAT DE POLICE', size: 74, y: 70, color: '#F4F1EA' }], 7.2, .8, { w: 1500, h: 160, bg: '#22305A', round: 10 }); psign.position.set(0, 4.1, .53); PS.add(psign);
  const lant = G(); lant.position.set(0, 5.3, .9); PS.add(lant); M(box(.7, .5, .7, .06), mat('#4A7AE0', { e: '#3A6AFF', ei: 1.4 }), lant); const lt = textPlane([{ text: 'POLICE', size: 70, y: 60, color: '#FFFFFF' }], .62, .22, { w: 300, h: 110, bg: 'rgba(0,0,0,0)' }); lt.position.z = .36; lant.add(lt);
  M(box(2.6, .16, 1.2), mat('#D9CDB4'), PS, 0, .24, .9); M(box(2.6, .16, .8), mat('#D9CDB4'), PS, 0, .4, .7);
  const pfp = G(); pfp.position.set(2.2, 6.0, .7); pfp.rotation.z = -.8; PS.add(pfp); M(cyl(.04, .04, 2.6, 6), mat('#D9B23A', { m: .7 }), pfp, 0, 1.3, 0); const pfl = flag(1.1, .75); pfl.position.y = 2.5; pfl.rotation.z = .8; pfp.add(pfl); g.userData.flags.push(pfl);
  for (const s of [-1, 1]) { const b = M(box(14, 14, 1), new THREE.MeshStandardMaterial({ map: stoneTex(4, 3, 12, s > 0 ? '#E8D9BC' : '#DCCFB8'), roughness: .85 }), PS, s * 14.2, 7, .2); for (let i = -2; i <= 2; i++) for (const y of [2.6, 6.2, 9.4, 12.4]) { const p = plane(1.3, 2.2, wm); p.position.set(s * 14.2 + i * 2.6, y, .71); PS.add(p); } }
  g.userData.policeDoor = new THREE.Vector3(0, 0, Pz - 1.4);
  // the flanking buildings of the hotel side
  for (const s of [-1, 1]) { const b = M(box(16, 17, 1), new THREE.MeshStandardMaterial({ map: stoneTex(5, 3, 12, '#E4D8C0'), roughness: .85 }), g, s * 28, 8.5, -10.2); }
  // street lamps and trees along both kerbs
  for (const z of [-5.8, 14.8]) for (let i = -3; i <= 3; i++) { if (i === 0) continue; const l = G(); l.position.set(i * 6, .16, z); g.add(l); M(cyl(.07, .11, 4.2, 10), mat('#1C1C1E', { m: .5, r: .4 }), l, 0, 2.1, 0); M(cyl(.18, .14, .5, 8), mat('#FFE7B0', { e: '#FFD78A', ei: 1.2 }), l, 0, 4.35, 0); M(sph(.12, 8, 6), mat('#1C1C1E'), l, 0, 4.66, 0); }
  // a Morris column and a newspaper kiosk on the police side
  const mc = G(); mc.position.set(-8, .16, 16.2); g.add(mc); M(cyl(.65, .7, 3.6, 24), mat('#2E5A42'), mc, 0, 1.8, 0); M(new THREE.SphereGeometry(.72, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#2E5A42'), mc, 0, 3.6, 0);
  const post = textPlane([{ text: 'BAL', size: 80, y: 70, color: '#B3242F' }, { text: 'MUSETTE', size: 52, y: 150, color: '#1C1C1E' }], 1.15, .9, { w: 360, h: 280, bg: '#F2D79A', round: 6 }); post.position.set(0, 2.1, -.69); post.rotation.y = Math.PI; mc.add(post);
  return g;
}

// ======================= HAND PROPS =======================
// the newspaper, held open: two pages on a gentle fold; the front page carries the story
export function newspaper() {
  const g = G();
  const front = ctex(768, 1024, (c, w, h) => {
    c.fillStyle = '#F1EAD8'; c.fillRect(0, 0, w, h); c.fillStyle = '#1C1A18'; c.textAlign = 'center';
    c.font = '700 96px Georgia, serif'; c.fillText('LE QUOTIDIEN', w / 2, 110); c.fillRect(40, 130, w - 80, 6); c.font = '600 26px Georgia, serif'; c.fillText('PARIS  ·  1925  ·  25 CENTIMES', w / 2, 170); c.fillRect(40, 186, w - 80, 3);
    c.font = '700 70px Fredoka'; c.fillText('EIFFEL TOWER', w / 2, 270); c.fillText('TOO COSTLY', w / 2, 345); c.fillText('TO KEEP UP?', w / 2, 420);
    c.font = '600 28px Georgia, serif'; c.fillText('Repairs and repainting cost the city a fortune', w / 2, 470);
    // a sketch of the tower with a price sticker
    c.save(); c.translate(230, 760); c.strokeStyle = '#1C1A18'; c.lineWidth = 5; c.beginPath(); c.moveTo(-110, 220); c.quadraticCurveTo(-40, 60, -12, -230); c.lineTo(12, -230); c.quadraticCurveTo(40, 60, 110, 220); c.stroke();
    for (let y = 180; y > -220; y -= 34) { const hw = 12 + 98 * Math.pow((y + 230) / 450, 2.2); c.beginPath(); c.moveTo(-hw, y); c.lineTo(hw, y - 34); c.moveTo(hw, y); c.lineTo(-hw, y - 34); c.lineWidth = 2; c.stroke(); }
    c.lineWidth = 5; c.beginPath(); c.arc(0, 230, 70, Math.PI, 0); c.stroke(); c.restore();
    c.fillStyle = '#B3242F'; c.beginPath(); c.arc(330, 640, 58, 0, 7); c.fill(); c.fillStyle = '#FFF'; c.font = '700 54px Fredoka'; c.fillText('₣₣₣', 330, 658);
    c.fillStyle = 'rgba(28,26,24,.55)'; for (let col = 0; col < 2; col++) for (let i = 0; i < 18; i++) c.fillRect(420 + col * 170, 520 + i * 26, 150 - (i % 4) * 14, 9);
    for (let i = 0; i < 6; i++) c.fillRect(40, 980 - i * 0, 0, 0);
  });
  const back = ctex(768, 1024, (c, w, h) => { c.fillStyle = '#EFE7D4'; c.fillRect(0, 0, w, h); c.fillStyle = '#1C1A18'; c.font = '700 54px Georgia, serif'; c.textAlign = 'center'; c.fillText('PETITES ANNONCES', w / 2, 90); c.fillStyle = 'rgba(28,26,24,.5)'; for (let col = 0; col < 3; col++) for (let i = 0; i < 34; i++) c.fillRect(40 + col * 240, 140 + i * 25, 210 - (i % 5) * 18, 9); });
  const fm = new THREE.MeshStandardMaterial({ map: front, roughness: .9, side: THREE.FrontSide }), bm = new THREE.MeshStandardMaterial({ map: back, roughness: .9 });
  const f = plane(.5, .66, fm); g.add(f); const b2 = plane(.5, .66, bm); b2.rotation.y = Math.PI; g.add(b2);
  return g;
}
// the forged letter on official stationery; redraw(stamped) adds the red OFFICIEL stamp
export function letter() {
  const c = document.createElement('canvas'); c.width = 600; c.height = 820; const tex = texFrom(c);
  const draw = (stamp = 0) => { const g = c.getContext('2d'), w = 600, h = 820;
    g.fillStyle = '#F7F1E2'; g.fillRect(0, 0, w, h); g.fillStyle = '#1C2A50'; g.textAlign = 'center';
    g.font = '700 30px Georgia, serif'; g.fillText('RÉPUBLIQUE FRANÇAISE', w / 2, 70); g.font = '700 36px Georgia, serif'; g.fillText('MINISTÈRE DES POSTES', w / 2, 120); g.fillText('ET TÉLÉGRAPHES', w / 2, 162);
    g.fillRect(80, 182, w - 160, 3); g.font = 'italic 600 26px Georgia, serif'; g.fillStyle = '#B3242F'; g.fillText('— CONFIDENTIEL —', w / 2, 225);
    g.fillStyle = 'rgba(28,30,60,.6)'; for (let i = 0; i < 14; i++) g.fillRect(70, 280 + i * 30, (i % 4 === 3 ? 260 : 460) - (i * 37 % 60), 8);
    g.strokeStyle = '#1C2A50'; g.lineWidth = 4; g.beginPath(); g.moveTo(330, 760); g.bezierCurveTo(360, 700, 400, 790, 430, 740); g.bezierCurveTo(450, 710, 480, 770, 520, 735); g.stroke();
    if (stamp > 0) { g.save(); g.globalAlpha = Math.min(1, stamp) * .85; g.translate(170, 690); g.rotate(-.25); g.strokeStyle = '#C8283A'; g.lineWidth = 9; g.beginPath(); g.arc(0, 0, 95, 0, 7); g.stroke(); g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 78, 0, 7); g.stroke(); g.fillStyle = '#C8283A'; g.font = '700 38px Fredoka'; g.fillText('OFFICIEL', 0, 14); g.restore(); }
    tex.needsUpdate = true; };
  draw(0);
  const p = plane(.21, .287, new THREE.MeshStandardMaterial({ map: tex, roughness: .9 })); p.userData.redraw = draw; return p;
}
export function rubberStamp() { const g = G(); M(cyl(.03, .036, .09, 12), mat('#7A4A2A', { r: .5 }), g, 0, .1, 0); M(sph(.04, 12, 8), mat('#7A4A2A', { r: .5 }), g, 0, .16, 0); M(box(.1, .025, .07, .005), mat('#3A2A20'), g, 0, .045, 0); M(box(.096, .012, .066), mat('#B3242F'), g, 0, .028, 0); return g; }
export function inkwell() { const g = G(); M(cyl(.04, .05, .06, 12), mat('#1C2A40', { r: .1, m: .2 }), g, 0, .03, 0); const q = M(cyl(.003, .006, .26, 6), mat('#F2EADA'), g, .02, .15, 0); q.rotation.z = -.3; return g; }
// a giant price tag: the card hangs from its hole (the group's origin); .userData.flip turns it over to the back text
export function bigTag(front = 'SOLD!', backTxt = 'SCAM!') {
  const g = G();
  const card = (text, col) => ctex(1024, 512, (c, w, h) => { c.fillStyle = '#F4E3B8'; c.beginPath(); c.moveTo(150, 20); c.lineTo(w - 20, 20); c.lineTo(w - 20, h - 20); c.lineTo(150, h - 20); c.lineTo(20, h / 2); c.closePath(); c.fill(); c.lineWidth = 14; c.strokeStyle = '#8A5E3C'; c.stroke(); c.fillStyle = '#5A3E2A'; c.beginPath(); c.arc(110, h / 2, 34, 0, 7); c.fill(); c.fillStyle = col; c.font = '700 250px Fredoka'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 590, h / 2 + 20); });
  const flip = G(); flip.position.x = 7.2; g.add(flip); g.userData.flip = flip;
  for (const [txt, col, ry] of [[front, '#C8283A', 0], [backTxt, '#1C3A8A', Math.PI]]) { const t = card(txt, col); const m = new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: .8, emissive: '#FFFFFF', emissiveMap: t, emissiveIntensity: .3 }); const p = plane(16, 8, m); p.position.x = ry ? -.8 : .8; p.rotation.y = ry; p.position.z = ry ? -.02 : .02; flip.add(p); }
  return g;
}
// banknotes: an instanced cloud of fluttering notes driven by update(t, origin, t0)
export function banknotes(n = 40, seed = 3, size = 1) {
  const t = ctex(256, 128, (c, w, h) => { c.fillStyle = '#B9CFA0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#4A6A3A'; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16); c.fillStyle = '#4A6A3A'; c.font = '700 64px Fredoka'; c.textAlign = 'center'; c.fillText('1000 F', w / 2, 86); });
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(.16 * size, .08 * size), new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: .8 }), n); im.castShadow = true; im.frustumCulled = false;
  const R = rng(seed), D = Array.from({ length: n }, () => ({ vx: (R() - .5) * 2.4, vy: 1.2 + R() * 2.2, vz: (R() - .5) * 2.4, s: R() * 20, d: R() * .8, ph: R() * 6 }));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1);
  im.userData.update = (tt, o, drift = new THREE.Vector3()) => { D.forEach((d, i) => { const k = Math.max(0, tt - d.d), oo = typeof o === 'function' ? o(d.d) : o; v.set(oo.x + d.vx * k + drift.x * k + Math.sin(k * 3 + d.ph) * .2, Math.max(.02, oo.y + d.vy * k - 1.6 * k * k), oo.z + d.vz * k + drift.z * k); q.setFromEuler(e.set(d.s * k * .6 + d.ph, d.s * k * .3, Math.sin(k * 5 + d.ph))); sc.setScalar(tt > d.d ? 1 : 0); m4.compose(v, q, sc); im.setMatrixAt(i, m4); }); im.instanceMatrix.needsUpdate = true; };
  return im;
}
export function whistle() { const g = G(); M(cyl(.012, .012, .06, 8), mat('#D8D8DC', { m: .9, r: .2 }), g, 0, -.03, .02).rotation.x = Math.PI / 2; M(sph(.018, 10, 8), mat('#D8D8DC', { m: .9, r: .2 }), g, 0, -.03, -.01); return g; }
