// sets_navy.js · Pepsi's navy: a Soviet naval base in winter (17 old submarines nested at a quay, a cruiser, a destroyer and a
// frigate across the basin, cranes, sheds, a scrap corner); the 1959 Moscow exhibition (a cola booth in front of a gold dome);
// a Soviet ministry office (1972 / 1989 / 1991); an American liquor store, 1970s; an office in the White House.
// On-screen branding is generic ("COLA", "VODKA"): the narration names the companies; the film never shows a real logo.
// Environment = PBR without outlines; characters and hero props = toon + ink.
import * as THREE from 'three';
import { TM, toon, G } from './toon.js';
import { textCanvas, texFrom } from './kit.js';

const rng = s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
function ctex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t; }
const std = o => new THREE.MeshStandardMaterial({ roughness: 1, ...o });
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const put = (im, i, x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) => { _q.setFromEuler(_e.set(rx, ry, rz)); _m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz)); im.setMatrixAt(i, _m); };
const M = (geo, mat, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; if (parent) parent.add(o); return o; };
const label = (lines, w, h, o = {}) => { const c = textCanvas(lines, o), t = texFrom(c); return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, transparent: !o.bg, roughness: .8 })); };

// ---------------- layout (metres) ----------------
export const SEA_Y = -1.4;           // the water in the basin; the quay top is y 0, its edge at z 0, the water beyond (+z)
export const SUBS = Array.from({ length: 17 }, (_, i) => ({ x: -50 + i * 5.6, z: 15.5 }));   // nested bow-in at the quay
export const SHIPS = { cruiser: [-24, 74], frigate: [8, 70], destroyer: [38, 72] };              // moored bow-out across the basin
export const HOOK = { ken: [62, -2.2], sub: [62, 17] };                                        // the quay spot where the hook sub surfaces
export const SCRAP = [-92, -14];                                                               // the scrap corner, west end of the quay

// ---------------- textures ----------------
const waterTex = rep => ctex(512, 512, (g, w, h) => { const R = rng(4); g.fillStyle = '#3E5E6E'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1300; i++) { const x = R() * w, y = R() * h, l = 10 + R() * 40; g.strokeStyle = R() < .55 ? 'rgba(200,225,235,.28)' : 'rgba(15,35,50,.4)'; g.lineWidth = 2 + R() * 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 4, x + l, y); g.stroke(); } }, rep);
const concreteTex = rep => ctex(512, 512, (g, w, h) => { const R = rng(6); g.fillStyle = '#9A9894'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${R() < .5 ? '60,58,56' : '210,208,200'},${.18 * R()})`; g.fillRect(R() * w, R() * h, 2 + R() * 3, 2 + R() * 3); }
  g.strokeStyle = 'rgba(40,38,36,.5)'; g.lineWidth = 3; for (let x = 0; x <= w; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(245,248,252,.85)'; g.beginPath(); g.ellipse(R() * w, R() * h, 20 + R() * 60, 10 + R() * 24, R() * 3, 0, 7); g.fill(); }   // snow patches
  for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(70,50,30,.25)'; g.beginPath(); g.ellipse(R() * w, R() * h, 10 + R() * 30, 6 + R() * 14, R() * 3, 0, 7); g.fill(); } }, rep);
const wallTex = rep => ctex(512, 256, (g, w, h) => { const R = rng(9); g.fillStyle = '#7E7C78'; g.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(${R() < .5 ? '40,40,40' : '200,200,200'},${.15 * R()})`; g.fillRect(R() * w, R() * h, 3, 3); }
  for (let i = 0; i < 40; i++) { const x = R() * w; g.strokeStyle = 'rgba(90,60,30,.35)'; g.lineWidth = 3 + R() * 6; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (R() - .5) * 8, h * (.3 + R() * .6)); g.stroke(); } }, rep);
const hullTex = (rust, seed = 3) => ctex(1024, 256, (g, w, h) => { const R = rng(seed); g.fillStyle = '#30353C'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(${R() < .5 ? '0,0,0' : '160,170,180'},${.08 * R()})`; g.fillRect(R() * w, R() * h, 3, 3); }
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; for (let x = 0; x < w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  for (let i = 0; i < 26 * rust; i++) { const x = R() * w, y = R() * h, l = 20 + R() * 70, d = R() < .5 ? 1 : -1; const grd = g.createLinearGradient(x, y, x + d * l, y); grd.addColorStop(0, 'rgba(140,66,30,.55)'); grd.addColorStop(1, 'rgba(140,66,30,0)'); g.fillStyle = grd; g.fillRect(Math.min(x, x + d * l), y, l, 2 + R() * 4); }
  for (let i = 0; i < 22 * rust; i++) { g.fillStyle = `rgba(${120 + R() * 40},${52 + R() * 24},28,${.35 + R() * .3})`; g.beginPath(); g.ellipse(R() * w, R() * h, 5 + R() * 18, 3 + R() * 8, R() * 3, 0, 7); g.fill(); } });
const greyTex = (seed, rust = 1) => ctex(1024, 256, (g, w, h) => { const R = rng(seed); g.fillStyle = '#7E868C'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(${R() < .5 ? '40,40,40' : '220,225,230'},${.08 * R()})`; g.fillRect(R() * w, R() * h, 3, 3); }
  for (let i = 0; i < 70 * rust; i++) { const x = R() * w, y = R() * h * .5, l = 20 + R() * 90; const grd = g.createLinearGradient(x, y, x, y + l); grd.addColorStop(0, 'rgba(140,70,30,.7)'); grd.addColorStop(1, 'rgba(140,70,30,0)'); g.fillStyle = grd; g.fillRect(x, y, 2 + R() * 5, l); }
  g.fillStyle = '#8E2A22'; g.fillRect(0, h - 26, w, 26); });
const corrTex = (col, rep) => ctex(256, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x, 0, 6, h); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 8, 0, 4, h); } const R = rng(21); for (let i = 0; i < 30; i++) { const x = R() * w; g.fillStyle = 'rgba(120,60,25,.35)'; g.fillRect(x, R() * h * .5, 4, 40 + R() * 80); } }, rep);
const woodTex = (col, rep, seed = 2) => ctex(256, 512, (g, w, h) => { const R = rng(seed); g.fillStyle = col; g.fillRect(0, 0, w, h); for (let i = 0; i < 120; i++) { g.strokeStyle = `rgba(${R() < .5 ? '40,20,10' : '255,220,170'},${.12 * R()})`; g.lineWidth = 1 + R() * 3; const x = R() * w; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 10, h * .3, x - 10, h * .6, x + (R() - .5) * 14, h); g.stroke(); } g.fillStyle = 'rgba(0,0,0,.3)'; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 3, h); }, rep);

// ---------------- the boats ----------------
// an old diesel attack submarine, bow toward +z: rounded hull riding low, a deck casing, the sail with periscopes, a hull number
export function sub(o = {}) {
  const g = G(), rust = o.rust ?? 1, hm = std({ map: hullTex(rust, o.seed ?? 3), roughness: .8, metalness: .2 }), dark = std({ color: '#26292E', roughness: .8 });
  const hull = M(new THREE.CapsuleGeometry(1.5, 22, 10, 24), hm, g); hull.rotation.x = Math.PI / 2; hull.scale.set(1, 1, .92);
  M(new THREE.BoxGeometry(1.3, .5, 19), dark, g, 0, 1.38, -.5);
  const sail = M(new THREE.CapsuleGeometry(.8, 4.2, 6, 16), hm, g, 0, 2.6, 3.2); sail.rotation.x = Math.PI / 2; sail.scale.set(1, 1.9, 1); sail.scale.set(.9, 1, 1.7);
  const sailBox = M(new THREE.BoxGeometry(1.44, 2.3, 4.6), hm, g, 0, 2.7, 3.2); sailBox.scale.set(1, 1, 1);
  M(new THREE.BoxGeometry(1.5, .1, 4.7), dark, g, 0, 3.86, 3.2);
  const scopes = [[3.9, 1.4], [3.3, 1.1], [2.6, .8]].map(([z, h]) => { const sp = G(); sp.position.set(0, 3.9, z); g.add(sp); const c = M(new THREE.CylinderGeometry(.06, .07, h, 8), dark, sp, 0, h / 2, 0); M(new THREE.BoxGeometry(.1, .14, .16), dark, sp, 0, h, .04); return sp; });
  g.userData.scopes = scopes;
  const fin = M(new THREE.BoxGeometry(.18, 2.6, 2.2), dark, g, 0, .4, -12.6); fin.rotation.x = .2;
  M(new THREE.BoxGeometry(4.4, .14, 1.4), dark, g, 0, -.2, -11.8);
  for (const s of [-1, 1]) { const bp = M(new THREE.BoxGeometry(1.4, .1, .8), dark, g, s * 1.8, .3, 9.8); bp.rotation.z = s * .1; }
  const num = String(o.num ?? 400 + Math.floor(Math.random() * 99));
  for (const s of [-1, 1]) { const n = label([{ text: num, size: 150, weight: 900, font: 'Montserrat', color: '#E8E6E0', y: 128 }], 1.6, .8, { w: 512, h: 256 }); n.position.set(s * .735, 2.9, 3.6); n.rotation.y = s * Math.PI / 2; g.add(n); }
  const hatch = G(); hatch.position.set(0, 1.66, -4.2); g.add(hatch); M(new THREE.CylinderGeometry(.42, .42, .1, 20), dark, hatch); M(new THREE.TorusGeometry(.18, .03, 6, 16), std({ color: '#5A5E62' }), hatch, 0, .07, 0).rotation.x = Math.PI / 2;
  g.userData.hatch = hatch; g.userData.sail = sailBox; g.userData.top = 3.92;
  g.traverse(m => { if (m.isMesh) m.castShadow = m.receiveShadow = true; });
  return g;
}
// a grey warship along +z: a sharp hull (plan shape extruded), a superstructure, a funnel, masts and radar, gun turrets fore and aft
export function warship(kind = 'destroyer') {
  const S = { cruiser: { L: 64, B: 7.6, H: 4.2, sup: 3 }, destroyer: { L: 48, B: 5.6, H: 3.6, sup: 2 }, frigate: { L: 36, B: 4.6, H: 3.0, sup: 1 } }[kind];
  const g = G(), gm = std({ map: greyTex(kind.length * 7), roughness: .75, metalness: .15 }), gl = std({ color: '#8C949A', roughness: .7, metalness: .2 }), dk = std({ color: '#4A4E54', roughness: .8 }), deckM = std({ color: '#5E6266', roughness: .9 });
  const sh = new THREE.Shape(), L = S.L, B = S.B; sh.moveTo(-B / 2, -L / 2); sh.lineTo(B / 2, -L / 2); sh.lineTo(B / 2, L * .18); sh.quadraticCurveTo(B / 2, L * .38, 0, L / 2); sh.quadraticCurveTo(-B / 2, L * .38, -B / 2, L * .18); sh.closePath();
  const hg = new THREE.ExtrudeGeometry(sh, { depth: S.H, bevelEnabled: false }); hg.rotateX(-Math.PI / 2); hg.rotateY(Math.PI);   // plan (x, y) → (x, z), up = +y
  M(hg, gm, g, 0, -1.2, 0);
  const deck = new THREE.ShapeGeometry(sh); deck.rotateX(-Math.PI / 2); deck.rotateY(Math.PI); const dm = M(deck, deckM, g, 0, S.H - 1.19, 0); dm.scale.set(.98, 1, .98);
  // superstructure blocks stepped up amidships
  const sx = B * .7; let y = S.H - 1.2;
  for (let k = 0; k < S.sup + 1; k++) { const l = L * (.3 - k * .07), hh = 1.8; M(new THREE.BoxGeometry(sx * (1 - k * .14), hh, l), gl, g, 0, y + hh / 2, L * (.04 + k * .02)); y += hh; }
  const bridge = M(new THREE.BoxGeometry(sx * .8, .5, 1.2), std({ color: '#1E2328', roughness: .3, metalness: .5 }), g, 0, y - .8, L * (.04 + S.sup * .02) + L * (.3 - S.sup * .07) / 2 - .2);
  const funnel = M(new THREE.CylinderGeometry(B * .16, B * .2, 4.2, 16), gl, g, 0, S.H + 1.6, -L * .1); funnel.scale.z = 1.6;
  M(new THREE.CylinderGeometry(B * .165, B * .165, .5, 16), std({ color: '#1E2024' }), g, 0, S.H + 3.5, -L * .1).scale.z = 1.6;
  const mast = M(new THREE.CylinderGeometry(.12, .2, 8, 8), dk, g, 0, y + 3.6, L * .08); for (const yy of [2.5, 4.5]) M(new THREE.BoxGeometry(3, .1, .1), dk, g, 0, y + yy, L * .08);
  const radar = M(new THREE.BoxGeometry(2.6, .6, .2), dk, g, 0, y + 7.8, L * .08); g.userData.radar = radar;
  const turret = (z, r) => { const t = G(); t.position.set(0, S.H - 1.2, z); g.add(t); M(new THREE.CylinderGeometry(r, r * 1.1, .9, 20), gl, t, 0, .45, 0); M(new THREE.BoxGeometry(r * 1.4, .8, r * 1.6), gl, t, 0, .9, -.1);
    for (const s of [-1, 1]) { const b = M(new THREE.CylinderGeometry(.09, .11, r * 2.6, 8), dk, t, s * r * .3, 1.0, r * 1.6); b.rotation.x = Math.PI / 2 - .08; } return t; };
  turret(L * .3, B * .2); turret(-L * .34, B * .2); if (kind === 'cruiser') turret(L * .2, B * .18);
  if (kind !== 'frigate') for (const s of [-1, 1]) { const ln = M(new THREE.BoxGeometry(1.0, .7, 4), dk, g, s * B * .32, S.H - .7, -L * .2); ln.rotation.x = -.2; }
  const num = { cruiser: '102', destroyer: '640', frigate: '715' }[kind];
  for (const s of [-1, 1]) { const n = label([{ text: num, size: 160, weight: 900, font: 'Montserrat', color: '#F2F0EA', y: 128 }], 4.2, 2.1, { w: 512, h: 256 }); n.position.set(s * (B / 2 * .9 + .02), S.H * .55 - 1.2, L * .33); n.rotation.y = s * Math.PI / 2; g.add(n); }
  g.traverse(m => { if (m.isMesh) m.castShadow = m.receiveShadow = true; });
  g.userData.L = L; return g;
}

// ---------------- the naval base ----------------
export function harbor() {
  const g = G(); const R = rng(31);
  const water = M(new THREE.PlaneGeometry(1400, 1400), std({ map: waterTex([140, 140]), roughness: .35, metalness: .25, color: '#B8C8D0' }), g, 0, SEA_Y, 500); water.rotation.x = -Math.PI / 2; water.receiveShadow = true; water.castShadow = false;
  g.userData.water = water;
  // the quay: a long concrete apron, its face, bollards and rubber fenders
  const qm = std({ map: concreteTex([40, 12]) });
  const quay = M(new THREE.BoxGeometry(320, 3, 70), qm, g, -20, -1.5, -35); quay.receiveShadow = true;
  const face = M(new THREE.PlaneGeometry(320, 3), std({ map: wallTex([60, 1]) }), g, -20, -1.5, .02);
  const bol = new THREE.InstancedMesh(new THREE.CylinderGeometry(.22, .28, .55, 12), std({ color: '#2A2C30', roughness: .6 }), 60); let bi = 0;
  for (let x = -170; x < 140 && bi < 60; x += 5.6) { if (Math.abs(x + 2.8 - HOOK.ken[0]) < 6) continue; put(bol, bi++, x + 2.8, .27, -.6); } bol.count = bi; bol.castShadow = true; g.add(bol);
  const tyre = new THREE.InstancedMesh(new THREE.TorusGeometry(.42, .17, 8, 18), std({ color: '#1C1C1E', roughness: .9 }), 60); let ti = 0;
  for (let x = -170; x < 140 && ti < 60; x += 5.6) put(tyre, ti++, x, -1.1, .2, 0, 1, 1, 1, 0, 0); tyre.count = ti; g.add(tyre);
  // mooring lines from each sub to the quay
  const lineM = std({ color: '#C8B890', roughness: .9 });
  // rails along the quay
  for (const z of [-6, -7.4]) M(new THREE.BoxGeometry(300, .08, .1), std({ color: '#5A4A40', metalness: .5, roughness: .5 }), g, -20, .04, z);
  // the subs, nested bow-in
  g.userData.subs = SUBS.map((p, i) => { const s = sub({ num: 300 + ((i * 37) % 90) + 10, seed: 3 + i, rust: .8 + R() * .8 }); s.position.set(p.x, SEA_Y + .5, p.z); s.rotation.y = Math.PI + (R() - .5) * .02; g.add(s);
    const ln = M(new THREE.CylinderGeometry(.04, .04, 3.6, 5), lineM, g, p.x + .9, -.1, 1.6); ln.rotation.x = Math.PI / 2 - .3; return s; });
  // across the basin: the cruiser, the destroyer, the frigate
  g.userData.ships = {};
  for (const [k, [x, z]] of Object.entries(SHIPS)) { const s = warship(k); s.position.set(x, SEA_Y + .2, z); s.rotation.y = Math.PI + (k === 'frigate' ? .1 : k === 'destroyer' ? -.12 : .06); g.add(s); g.userData.ships[k] = s; }
  // the far shore: a low pier, sheds, snowy hills
  M(new THREE.BoxGeometry(260, 2.6, 12), qm, g, 20, -1.3, 84);
  const hillM = std({ color: '#DDE3E8', roughness: 1 }), rockM = std({ color: '#6E747A', roughness: 1 });
  for (let i = 0; i < 26; i++) { const x = -330 + i * 26 + R() * 20, z = 260 + R() * 120, r = 30 + R() * 40; const h = M(new THREE.ConeGeometry(r, r * (.5 + R() * .4), 7 + Math.floor(R() * 4)), i % 3 ? hillM : rockM, g, x, -2 + r * .2, z); h.rotation.y = R() * 3; h.castShadow = false; }
  // sheds behind the quay (corrugated, snow on the roofs) and cranes along it
  const shedM = std({ map: corrTex('#6E7A84', [8, 1]) }), shed2 = std({ map: corrTex('#8A6A52', [8, 1]) }), snowM = std({ color: '#F2F5F8', roughness: .9 });
  for (let i = 0; i < 9; i++) { const x = -150 + i * 34, w = 22 + R() * 8, h = 8 + R() * 5, d = 16; M(new THREE.BoxGeometry(w, h, d), i % 2 ? shedM : shed2, g, x, h / 2, -32 - R() * 6); const rf = M(new THREE.BoxGeometry(w + .6, .4, d + .6), snowM, g, x, h + .2, -32); rf.castShadow = false; }
  const crane = (x, z, ry) => { const c = G(); c.position.set(x, 0, z); c.rotation.y = ry; g.add(c); const cm = std({ color: '#C89A2E', roughness: .7, metalness: .2 });
    for (const [lx, lz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) { const l = M(new THREE.BoxGeometry(.5, 10, .5), cm, c, lx, 5, lz); l.rotation.z = -lx * .015; }
    M(new THREE.BoxGeometry(7, .8, 7), cm, c, 0, 10.2, 0); M(new THREE.BoxGeometry(4, 3.4, 5), cm, c, 0, 12.3, -.5); M(new THREE.BoxGeometry(3, 1.6, .2), std({ color: '#28323A', roughness: .2, metalness: .5 }), c, 0, 12.8, 2.0);
    const jib = M(new THREE.BoxGeometry(.8, .8, 26), cm, c, 0, 18, 11); jib.rotation.x = -.42;
    M(new THREE.BoxGeometry(3, 2.4, 2.4), std({ color: '#3A3A3E' }), c, 0, 13, -4.5); return c; };
  crane(-66, -6, -.2); crane(96, -6, .25); crane(-128, -6, .1);
  // the scrap corner: a heap of rusty plate, half a sub cut open, a crane with a magnet
  const scrap = G(); scrap.position.set(SCRAP[0], 0, SCRAP[1]); g.add(scrap); g.userData.scrap = scrap;
  const rustM = std({ color: '#8A4A28', roughness: .95, metalness: .1 }), rust2 = std({ color: '#5E3A26', roughness: 1 });
  const heap = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), rustM, 120);
  for (let i = 0; i < 120; i++) { const a = R() * 6.28, r = Math.pow(R(), .7) * 9; put(heap, i, Math.sin(a) * r, Math.max(.2, 3.4 - r * .38) * R(), Math.cos(a) * r * .7, R() * 6, 1.2 + R() * 3, .08 + R() * .2, .8 + R() * 2.4, (R() - .5) * 1.4, (R() - .5) * 1.4); }
  heap.castShadow = heap.receiveShadow = true; scrap.add(heap);
  // the front half of a sub, cut open (bow toward +z), on blocks
  const half = G(); half.position.set(14, 1.6, 4); half.rotation.y = -.5; scrap.add(half); g.userData.half = half; const hm = std({ map: hullTex(3, 77), roughness: .85 });
  M(new THREE.CylinderGeometry(1.5, 1.5, 10, 28, 1, true), hm, half, 0, 0, 5).rotation.x = Math.PI / 2;
  const nose = M(new THREE.SphereGeometry(1.5, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), hm, half, 0, 0, 10); nose.rotation.x = Math.PI / 2;
  M(new THREE.CircleGeometry(1.5, 28), rust2, half, 0, 0, .02).rotation.y = Math.PI;
  M(new THREE.BoxGeometry(1.4, 2.2, 3.4), hm, half, 0, 2.2, 5.2);
  for (const s of [-1, 1]) M(new THREE.BoxGeometry(.4, 1.0, .5), std({ color: '#4A4440' }), scrap, 14 + s * 1.1 - 2.5 * .5, .5, 4 + s * .6 + 5 * .5);
  const sc = crane(-6, 8, .7); g.userData.scrapCrane = sc; sc.position.set(SCRAP[0] - 6, 0, SCRAP[1] + 8);
  const magnet = G(); g.add(magnet); M(new THREE.CylinderGeometry(1.2, 1.2, .5, 24), std({ color: '#2A2C30', metalness: .4, roughness: .5 }), magnet); const cable = M(new THREE.CylinderGeometry(.04, .04, 1, 6), std({ color: '#1A1A1C' }), magnet, 0, .5, 0); cable.geometry.translate(0, .5, 0);
  g.userData.magnet = magnet; g.userData.cable = cable;
  const chunk = G(); M(new THREE.CylinderGeometry(1.4, 1.4, 3.2, 20, 1, true, 0, Math.PI * 1.2), std({ map: hullTex(3, 91), side: THREE.DoubleSide, roughness: .8 }), chunk).rotation.z = Math.PI / 2; g.add(chunk); g.userData.chunk = chunk;
  // sparks (a cutting torch on the half-sub)
  const spk = new THREE.InstancedMesh(new THREE.SphereGeometry(.05, 6, 4), new THREE.MeshBasicMaterial({ color: '#FFD070' }), 40); spk.frustumCulled = false; scrap.add(spk); g.userData.sparks = spk;
  // falling snow (instanced, animated by tick)
  const snow = new THREE.InstancedMesh(new THREE.SphereGeometry(.035, 5, 4), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }), 500); snow.frustumCulled = false; g.add(snow);
  const flakes = Array.from({ length: 500 }, () => [R(), R(), R(), R()]);
  g.userData.tick = (t, at) => { water.material.map.offset.set(t * .004, t * .009);
    for (let i = 0; i < 500; i++) { const [a, b, c, d] = flakes[i]; const y = 14 - ((t * (.9 + d * .5) + a * 14) % 14); put(snow, i, at.x - 16 + b * 32 + Math.sin(t + i) * .4, y - 1, at.z - 16 + c * 32, 0, 1, 1, 1); }
    snow.instanceMatrix.needsUpdate = true; };
  return g;
}

// ---------------- Moscow, July 1959: the cola booth at the American exhibition ----------------
export function expo() {
  const g = G(), R = rng(41);
  const ground = M(new THREE.PlaneGeometry(300, 300), std({ map: ctex(256, 256, (c, w, h) => { c.fillStyle = '#D8D2C4'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(90,80,70,.35)'; c.lineWidth = 3; for (let x = 0; x <= w; x += 64) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); c.beginPath(); c.moveTo(0, x); c.lineTo(w, x); c.stroke(); } }, [80, 80]) }), g); ground.rotation.x = -Math.PI / 2;
  // the gold geodesic dome behind
  const dome = M(new THREE.IcosahedronGeometry(26, 2), std({ color: '#D8B460', metalness: .7, roughness: .35, flatShading: true }), g, 6, -6, -62); dome.scale.y = .9;
  const ribs = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(26.05, 2)), new THREE.LineBasicMaterial({ color: '#8A6A2A' })); ribs.position.copy(dome.position); ribs.scale.copy(dome.scale); g.add(ribs);
  // trees, lamp posts, bunting
  const treeM = std({ color: '#4E8A3E' }), trunkM = std({ color: '#6A5038' });
  for (let i = 0; i < 14; i++) { const x = -40 + i * 6.5 + R() * 2, z = -26 - R() * 8; M(new THREE.CylinderGeometry(.2, .26, 3, 8), trunkM, g, x, 1.5, z); const c = M(new THREE.SphereGeometry(2.2 + R(), 14, 10), treeM, g, x, 4.4, z); c.scale.y = 1.2; }
  const flagCols = ['#C8283A', '#F4F1EA', '#2A5AC8'];
  const pen = new THREE.InstancedMesh(new THREE.ConeGeometry(.18, .5, 3), std({ color: '#FFFFFF', side: THREE.DoubleSide }), 90); let pi = 0;
  for (const [x0, z0, x1, z1] of [[-9, -6, 9, -6], [-9, -6, -9, 6], [9, -6, 9, 6]]) for (let k = 0; k < 30 && pi < 90; k++) { const u = k / 29, x = x0 + (x1 - x0) * u, z = z0 + (z1 - z0) * u, y = 4.6 - Math.sin(u * Math.PI) * .9; put(pen, pi, x, y, z, 0, 1, 1, 1, Math.PI, 0); pen.setColorAt(pi, new THREE.Color(flagCols[pi % 3])); pi++; }
  pen.instanceColor.needsUpdate = true; g.add(pen);
  for (const [x, z] of [[-9, -6], [9, -6], [-9, 6], [9, 6]]) M(new THREE.CylinderGeometry(.06, .08, 5, 8), std({ color: '#3A3A40', metalness: .6, roughness: .4 }), g, x, 2.5, z);
  // the booth: a counter, a striped awning, a big sign, a cooler of bottles, a stack of paper cups
  const booth = G(); g.add(booth); g.userData.booth = booth;
  const front = ctex(1024, 256, (c, w, h) => { c.fillStyle = '#1E4FA8'; c.fillRect(0, 0, w, h); c.fillStyle = '#F4F1EA'; c.fillRect(0, 26, w, 14); c.fillRect(0, h - 40, w, 14); c.font = '900 120px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF'; c.fillText('ICE-COLD COLA', w / 2, h / 2 + 6); });
  M(new THREE.BoxGeometry(3.6, 1.05, .8), [std({ color: '#E8E2D6' }), std({ color: '#E8E2D6' }), std({ color: '#F4F1EA' }), std({ color: '#E8E2D6' }), std({ map: front }), std({ color: '#E8E2D6' })], booth, 0, .525, 0);
  M(new THREE.BoxGeometry(3.8, .06, 1.0), std({ color: '#C8C2B4', roughness: .5 }), booth, 0, 1.08, 0);
  const stripes = ctex(512, 64, (c, w, h) => { for (let x = 0; x < w; x += 64) { c.fillStyle = (x / 64) % 2 ? '#F4F1EA' : '#1E4FA8'; c.fillRect(x, 0, 64, h); } });
  for (const x of [-1.75, 1.75]) for (const z of [-.35, .35]) M(new THREE.CylinderGeometry(.04, .04, 2.6, 8), std({ color: '#E8E2D6' }), booth, x, 1.3 + .05, z - .3);
  const aw = M(new THREE.BoxGeometry(4.0, .06, 1.6), std({ map: stripes }), booth, 0, 2.62, .05); aw.rotation.x = .22;
  const val = M(new THREE.PlaneGeometry(4.0, .28), std({ map: stripes, side: THREE.DoubleSide }), booth, 0, 2.38, .82);
  const sign = M(new THREE.BoxGeometry(2.8, .7, .1), [std({ color: '#C8283A' }), std({ color: '#C8283A' }), std({ color: '#C8283A' }), std({ color: '#C8283A' }), std({ map: ctex(1024, 256, (c, w, h) => { c.fillStyle = '#C8283A'; c.fillRect(0, 0, w, h); c.strokeStyle = '#FFFFFF'; c.lineWidth = 14; c.strokeRect(14, 14, w - 28, h - 28); c.font = '900 140px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF'; c.fillText('COLA', w / 2, h / 2 + 8); }) }), std({ color: '#C8283A' })], booth, 0, 3.15, -.1);
  // the cooler and bottles on the counter
  const cool = M(new THREE.BoxGeometry(1.0, .34, .5), std({ color: '#C8283A', roughness: .5 }), booth, -1.05, 1.28, -.05);
  const btl = bottleGeo(); const bm = new THREE.InstancedMesh(btl, std({ color: '#2A1C14', roughness: .2, metalness: .1 }), 24);
  for (let i = 0; i < 24; i++) put(bm, i, -1.48 + (i % 6) * .17, 1.46, -.22 + Math.floor(i / 6) * .12, R() * 6, .9, .9, .9);
  bm.castShadow = true; booth.add(bm);
  const cupM = std({ color: '#F4F1EA', roughness: .7 }); for (let i = 0; i < 6; i++) M(new THREE.CylinderGeometry(.045, .035, .1, 12), cupM, booth, .9 + (i % 3) * .1, 1.16, -.12 + Math.floor(i / 3) * .1);
  return g;
}
function bottleGeo() { const pts = [[0, 0], [.04, 0], [.042, .01], [.042, .12], [.03, .17], [.016, .21], [.016, .245], [.019, .25], [0, .25]].map(([r, y]) => new THREE.Vector2(r, y)); return new THREE.LatheGeometry(pts, 16); }

// ---------------- a Soviet ministry office (1972 / 1989 / 1991) ----------------
export function office() {
  const g = G(), R = rng(51);
  const floorM = std({ map: woodTex('#6A4A2E', [6, 6], 5), roughness: .6 });
  const floor = M(new THREE.PlaneGeometry(10, 10), floorM, g); floor.rotation.x = -Math.PI / 2;
  const rug = M(new THREE.PlaneGeometry(3.4, 8), std({ map: ctex(256, 512, (c, w, h) => { c.fillStyle = '#9A1E22'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2E6A3A'; c.lineWidth = 16; c.strokeRect(18, 18, w - 36, h - 36); c.strokeStyle = '#E8B030'; c.lineWidth = 4; c.strokeRect(40, 40, w - 80, h - 80); }) }), g, 0, .005, .5); rug.rotation.x = -Math.PI / 2;
  const panel = std({ map: woodTex('#7A5236', [4, 1], 7), roughness: .55 }), cream = std({ color: '#E8DCC0', roughness: .9 });
  for (const [x, z, ry, w] of [[0, -4, 0, 10], [-5, 1, Math.PI / 2, 10], [5, 1, -Math.PI / 2, 10]]) {
    const wl = G(); wl.position.set(x, 0, z); wl.rotation.y = ry; g.add(wl);
    M(new THREE.BoxGeometry(w, 1.3, .08), panel, wl, 0, .65, 0); M(new THREE.BoxGeometry(w, 2.6, .06), cream, wl, 0, 2.6, -.02); M(new THREE.BoxGeometry(w, .08, .14), std({ color: '#4A2E1A' }), wl, 0, 1.32, .02);
  }
  const ceil = M(new THREE.PlaneGeometry(10, 10), std({ color: '#F2EAD8' }), g, 0, 3.9, 0); ceil.rotation.x = Math.PI / 2;
  // the window in the back wall: heavy red curtains, outside a snowy square and a red-brick tower with a red star
  const win = G(); win.position.set(1.9, 0, -3.96); g.add(win);
  const view = ctex(512, 640, (c, w, h) => { const sk = c.createLinearGradient(0, 0, 0, h); sk.addColorStop(0, '#9CB0C8'); sk.addColorStop(1, '#DCE4EA'); c.fillStyle = sk; c.fillRect(0, 0, w, h);
    c.fillStyle = '#A8402E'; c.fillRect(170, 250, 170, 390); c.fillStyle = '#8E3424'; for (let y = 260; y < 640; y += 40) c.fillRect(170, y, 170, 4);
    c.fillStyle = '#2E6A4E'; c.beginPath(); c.moveTo(150, 260); c.lineTo(255, 70); c.lineTo(360, 260); c.fill(); c.fillStyle = '#C8283A'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 14 : 34; i ? c.lineTo(255 + Math.cos(a) * r, 52 + Math.sin(a) * r) : c.moveTo(255 + Math.cos(a) * r, 52 + Math.sin(a) * r); } c.fill();
    c.fillStyle = '#A8402E'; c.fillRect(0, 470, w, 170); c.fillStyle = '#F4F6F8'; c.fillRect(0, 600, w, 40); for (let x = 0; x < w; x += 36) c.fillRect(x, 452, 22, 22);
    const R2 = rng(5); c.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 160; i++) { c.beginPath(); c.arc(R2() * w, R2() * h, 1.5 + R2() * 2.5, 0, 7); c.fill(); } });
  M(new THREE.PlaneGeometry(1.6, 2.0), new THREE.MeshBasicMaterial({ map: view }), win, 0, 2.2, 0);
  const frameM = std({ color: '#F0EBE0' }); for (const [x, y, w, h] of [[0, 3.22, 1.76, .1], [0, 1.18, 1.76, .1], [-.84, 2.2, .1, 2.1], [.84, 2.2, .1, 2.1], [0, 2.2, .05, 2.0], [0, 2.4, 1.6, .05]]) M(new THREE.BoxGeometry(w, h, .08), frameM, win, x, y, .04);
  const curt = std({ color: '#8E1E22', roughness: .9 }); for (const s of [-1, 1]) { const cu = M(new THREE.CylinderGeometry(.3, .38, 3.2, 14, 1, true), curt, win, s * 1.15, 2.05, .2); cu.scale.z = .45; }
  // the flag on a pole in the corner (it falls in 1991)
  const flag = G(); flag.position.set(-3.2, 0, -3.2); g.add(flag); g.userData.flag = flag;
  M(new THREE.CylinderGeometry(.3, .36, .1, 20), std({ color: '#2A2A2E' }), flag, 0, .05, 0); M(new THREE.CylinderGeometry(.03, .03, 3.0, 10), std({ color: '#C8A030', metalness: .7, roughness: .3 }), flag, 0, 1.55, 0);
  const flagTex = ctex(512, 340, (c, w, h) => { c.fillStyle = '#C8202A'; c.fillRect(0, 0, w, h); c.strokeStyle = '#F2C230'; c.fillStyle = '#F2C230'; c.lineWidth = 16; c.lineCap = 'round';
    c.beginPath(); c.arc(92, 112, 40, Math.PI * .9, Math.PI * 2.05); c.stroke(); c.beginPath(); c.moveTo(70, 160); c.lineTo(126, 82); c.stroke(); c.save(); c.translate(110, 76); c.rotate(.7); c.fillRect(-26, -8, 52, 16); c.restore();
    c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 7 : 16; i ? c.lineTo(100 + Math.cos(a) * r, 40 + Math.sin(a) * r) : c.moveTo(100 + Math.cos(a) * r, 40 + Math.sin(a) * r); } c.fill(); });
  const fg = new THREE.PlaneGeometry(1.4, .93, 12, 4); const fp = fg.attributes.position; for (let i = 0; i < fp.count; i++) { const x = fp.getX(i) + .7; fp.setZ(i, Math.sin(x * 3.2) * .08 * x); fp.setY(i, fp.getY(i) - x * x * .12); } fg.computeVertexNormals();
  const fl = M(fg, std({ map: flagTex, side: THREE.DoubleSide, roughness: .9 }), flag, .72, 2.55, 0); fl.rotation.y = .5;
  // the desk: dark wood, a green leather top, two phones (one red), a green lamp, papers; a leather chair behind it
  const desk = G(); desk.position.set(0, 0, -1.6); g.add(desk); g.userData.desk = desk;
  const dw = std({ map: woodTex('#4A2E1C', [2, 1], 9), roughness: .5 });
  M(new THREE.BoxGeometry(2.6, .08, 1.2), dw, desk, 0, .78, 0); M(new THREE.BoxGeometry(2.2, .01, .9), std({ color: '#2E5A3A', roughness: .8 }), desk, 0, .825, 0);
  for (const s of [-1, 1]) M(new THREE.BoxGeometry(.7, .74, 1.1), dw, desk, s * .92, .37, 0);
  M(new THREE.BoxGeometry(1.1, .5, .04), dw, desk, 0, .5, .5);
  const phone = (x, col) => { const p = G(); p.position.set(x, .83, -.25); desk.add(p); M(new THREE.BoxGeometry(.22, .09, .2), std({ color: col, roughness: .35 }), p, 0, .045, 0); const hs = M(new THREE.CapsuleGeometry(.025, .16, 4, 8), std({ color: col, roughness: .35 }), p, 0, .12, 0); hs.rotation.z = Math.PI / 2; M(new THREE.CylinderGeometry(.06, .06, .01, 16), std({ color: '#E8E2D6' }), p, 0, .095, .06).rotation.x = -.5; return p; };
  phone(-.85, '#1A1A1E'); phone(-.55, '#B8202A');
  const lamp = G(); lamp.position.set(.9, .83, -.3); desk.add(lamp); M(new THREE.CylinderGeometry(.07, .09, .03, 16), std({ color: '#C8A030', metalness: .7, roughness: .3 }), lamp); M(new THREE.CylinderGeometry(.012, .012, .34, 8), std({ color: '#C8A030', metalness: .7, roughness: .3 }), lamp, 0, .17, 0);
  M(new THREE.CylinderGeometry(.06, .16, .14, 18, 1, true), std({ color: '#2E7A4A', side: THREE.DoubleSide, roughness: .4 }), lamp, 0, .36, .02);
  for (let i = 0; i < 3; i++) { const pp = M(new THREE.BoxGeometry(.3, .006, .4), std({ color: '#F4EEDC' }), desk, .3 + i * .03, .83 + i * .006, .05); pp.rotation.y = (R() - .5) * .3; }
  const chair = G(); chair.position.set(0, 0, -2.6); g.add(chair); const lm = std({ color: '#3A1E16', roughness: .5 }); M(new THREE.BoxGeometry(.8, .14, .7), lm, chair, 0, .5, 0); M(new THREE.BoxGeometry(.8, 1.1, .14), lm, chair, 0, 1.05, -.32); for (const s of [-1, 1]) M(new THREE.BoxGeometry(.1, .3, .7), lm, chair, s * .4, .7, 0);
  // the visitor's chair, a calendar, a clock, a bookcase
  const vch = G(); vch.position.set(.1, 0, .25); g.add(vch); g.userData.vchair = vch; M(new THREE.BoxGeometry(.6, .1, .6), lm, vch, 0, .48, 0); M(new THREE.BoxGeometry(.6, .7, .1), lm, vch, 0, .85, .28); for (const [x, z] of [[-.25, -.25], [.25, -.25], [-.25, .25], [.25, .25]]) M(new THREE.CylinderGeometry(.025, .025, .48, 6), lm, vch, x, .24, z);
  const cal = G(); cal.position.set(-1.4, 2.25, -3.95); g.add(cal);
  const calTex = y => ctex(256, 320, (c, w, h) => { c.fillStyle = '#F4F1EA'; c.fillRect(0, 0, w, h); c.fillStyle = '#C8202A'; c.fillRect(0, 0, w, 90); c.fillStyle = '#FFFFFF'; c.font = '900 64px Montserrat'; c.textAlign = 'center'; c.fillText(String(y), w / 2, 68); c.fillStyle = '#2A2A2E'; c.font = '700 22px Montserrat';
    for (let r = 0; r < 5; r++) for (let k = 0; k < 7; k++) c.fillText(String(r * 7 + k + 1 > 31 ? '' : r * 7 + k + 1), 26 + k * 34, 140 + r * 38); });
  const calM = std({ map: calTex(1972) }); M(new THREE.PlaneGeometry(.5, .62), calM, cal, 0, 0, .01);
  g.userData.setYear = y => { if (calM.userData.y === y) return; calM.userData.y = y; calM.map = calTex(y); calM.needsUpdate = true; };
  const clock = G(); clock.position.set(3.4, 2.9, -3.95); g.add(clock); M(new THREE.CylinderGeometry(.28, .28, .06, 24), std({ color: '#4A2E1C' }), clock).rotation.x = Math.PI / 2; M(new THREE.CircleGeometry(.24, 24), std({ color: '#F4F1EA' }), clock, 0, 0, .035);
  const bc = G(); bc.position.set(-4.6, 0, -1.5); bc.rotation.y = Math.PI / 2; g.add(bc); M(new THREE.BoxGeometry(2.4, 2.6, .5), dw, bc, 0, 1.3, 0);
  const bk = new THREE.InstancedMesh(new THREE.BoxGeometry(.06, .3, .22), std({ color: '#FFFFFF' }), 120); for (let i = 0; i < 120; i++) { const sh = Math.floor(i / 30), k = i % 30; put(bk, i, -1.05 + k * .072, .55 + sh * .6, .2, 0, 1, .8 + R() * .3, 1); bk.setColorAt(i, new THREE.Color(['#8E2A22', '#2A4A6A', '#3A5A2E', '#C8A030', '#5A3A2A'][Math.floor(R() * 5)])); } bk.instanceColor.needsUpdate = true; bc.add(bk);
  // a chandelier; the 1991 collapse: plaster chunks and dust (driven from main)
  const ch = G(); ch.position.set(0, 3.5, -.6); g.add(ch); g.userData.chand = ch; M(new THREE.CylinderGeometry(.01, .01, .4, 6), std({ color: '#C8A030' }), ch, 0, .2, 0); M(new THREE.SphereGeometry(.12, 12, 10), std({ color: '#C8A030', metalness: .7, roughness: .3 }), ch);
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; M(new THREE.SphereGeometry(.06, 10, 8), std({ color: '#FFF4D8', emissive: '#FFD890', emissiveIntensity: .8 }), ch, Math.sin(a) * .35, -.05, Math.cos(a) * .35); }
  const deb = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.1, 0), std({ color: '#E8DCC0', roughness: 1 }), 60); deb.frustumCulled = false; deb.castShadow = true; g.add(deb); g.userData.debris = deb;
  g.userData.deb = Array.from({ length: 60 }, () => [R() * 6 - 3, R() * 4 - 3, R(), R()]);
  const crack = M(new THREE.PlaneGeometry(4, 2.4), new THREE.MeshBasicMaterial({ map: ctex(512, 320, (c, w, h) => { c.strokeStyle = 'rgba(40,30,20,.85)'; c.lineWidth = 5; const R2 = rng(8); const br = (x, y, a, n) => { if (n <= 0) return; const x2 = x + Math.cos(a) * 40, y2 = y + Math.sin(a) * 40; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); br(x2, y2, a + (R2() - .5) * .9, n - 1); if (R2() < .3) br(x2, y2, a + (R2() < .5 ? .8 : -.8), n - 3); }; br(260, 0, Math.PI / 2 - .2, 9); br(180, 10, Math.PI / 2 + .3, 7); br(330, 6, Math.PI / 2 + .1, 6); }), transparent: true, opacity: 0, depthWrite: false }), g, -.5, 2.7, -3.9);
  g.userData.crack = crack;
  return g;
}

// ---------------- an American liquor store, 1970s ----------------
export function store() {
  const g = G(), R = rng(61);
  const fl = M(new THREE.PlaneGeometry(12, 12), std({ map: ctex(256, 256, (c, w, h) => { for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { c.fillStyle = ((x + y) / 32) % 2 ? '#2A2A2E' : '#E8E2D2'; c.fillRect(x, y, 32, 32); } }, [6, 6]), roughness: .4 }), g); fl.rotation.x = -Math.PI / 2;
  const back = M(new THREE.BoxGeometry(12, 4, .1), std({ map: woodTex('#9A6A3A', [6, 1], 3) }), g, 0, 2, -2.5);
  // shelves: three bays, four shelves each; the vodka fills them (userData.fill(k))
  const shM = std({ map: woodTex('#7A4E2A', [2, 1], 4), roughness: .6 });
  const SL = [];
  for (let b = -1; b <= 1; b++) { const x0 = b * 1.9; M(new THREE.BoxGeometry(1.8, 2.6, .05), shM, g, x0, 1.3, -2.38); for (const s of [-1, 1]) M(new THREE.BoxGeometry(.05, 2.6, .45), shM, g, x0 + s * .9, 1.3, -2.18);
    for (let k = 0; k < 4; k++) { const y = .35 + k * .62; M(new THREE.BoxGeometry(1.8, .04, .45), shM, g, x0, y, -2.18); for (let i = 0; i < 10; i++) SL.push([x0 - .76 + i * .17, y + .02, -2.15 - (i % 2) * .1]); } }
  const vb = new THREE.InstancedMesh(vodkaGeo(), std({ color: '#BFD8E2', roughness: .05, metalness: .3, transparent: true, opacity: .6 }), SL.length);
  const lb = new THREE.InstancedMesh(new THREE.CylinderGeometry(.0495, .0495, .1, 14, 1, true), std({ map: vodkaLabel(), roughness: .6 }), SL.length);
  const order = SL.map((p, i) => [i, R()]).sort((a, b) => a[1] - b[1]).map(([i]) => i);
  g.userData.fill = k => { const n = Math.round(k * SL.length); order.forEach((i, j) => { const [x, y, z] = SL[i], s = j < n ? 1 : 0; put(vb, i, x, y, z, 0, s, s, s); put(lb, i, x, y + .09 * s, z, 0, s, s, s); }); vb.instanceMatrix.needsUpdate = lb.instanceMatrix.needsUpdate = true; };
  g.userData.fill(1); vb.castShadow = true; g.add(vb, lb);
  const sg = M(new THREE.BoxGeometry(4.4, .7, .08), std({ map: ctex(1024, 160, (c, w, h) => { c.fillStyle = '#1E2A4A'; c.fillRect(0, 0, w, h); c.font = '900 92px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#F4F1EA'; c.fillText('IMPORTED VODKA', w / 2, h / 2 + 6); }) }), g, 0, 3.35, -2.3);
  // the counter + a cash register; a pennant
  const ctr = M(new THREE.BoxGeometry(2.4, 1.0, .7), std({ map: woodTex('#5A3A22', [2, 1], 6) }), g, 2.6, .5, .6);
  const reg = G(); reg.position.set(2.9, 1.0, .5); g.add(reg); M(new THREE.BoxGeometry(.5, .3, .4), std({ color: '#B8B4AA', metalness: .6, roughness: .3 }), reg, 0, .15, 0); M(new THREE.BoxGeometry(.4, .14, .06), std({ color: '#2A2A2E' }), reg, 0, .38, -.12);
  const pn = M(new THREE.PlaneGeometry(1.4, .9), std({ map: ctex(512, 340, (c, w, h) => { for (let i = 0; i < 13; i++) { c.fillStyle = i % 2 ? '#F4F1EA' : '#B8202A'; c.fillRect(0, i * h / 13, w, h / 13 + 1); } c.fillStyle = '#1E3A7A'; c.fillRect(0, 0, w * .42, h * 7 / 13); c.fillStyle = '#FFFFFF'; for (let r = 0; r < 5; r++) for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(16 + k * 34 + (r % 2) * 17, 16 + r * 32, 5, 0, 7); c.fill(); } }), side: THREE.DoubleSide }), g, -4.2, 2.9, -2.4);
  return g;
}
function vodkaGeo() { const pts = [[0, 0], [.045, 0], [.047, .01], [.047, .2], [.03, .25], [.016, .28], [.016, .32], [0, .32]].map(([r, y]) => new THREE.Vector2(r, y)); return new THREE.LatheGeometry(pts, 14); }
const vodkaLabel = () => ctex(256, 128, (c, w, h) => { c.fillStyle = '#F4F1EA'; c.fillRect(0, 0, w, h); c.fillStyle = '#C8202A'; c.fillRect(0, 0, w, 22); c.fillRect(0, h - 22, w, 22); c.fillStyle = '#C8202A'; c.font = '900 40px Montserrat'; c.textAlign = 'center'; c.fillText('VODKA', w / 4, 80); c.fillText('VODKA', w * 3 / 4, 80); });

// ---------------- an office in the White House ----------------
export function wh() {
  const g = G();
  const fl = M(new THREE.PlaneGeometry(10, 10), std({ color: '#2A3A6A', roughness: 1 }), g); fl.rotation.x = -Math.PI / 2;
  const wallM = std({ color: '#EFE6CC', roughness: .9 }), trim = std({ color: '#FBF8F0', roughness: .7 });
  for (const [x, z, ry] of [[0, -4, 0], [-4.5, 0, Math.PI / 2], [4.5, 0, -Math.PI / 2]]) { const wl = G(); wl.position.set(x, 0, z); wl.rotation.y = ry; g.add(wl); M(new THREE.BoxGeometry(10, 3.8, .08), wallM, wl, 0, 1.9, 0); M(new THREE.BoxGeometry(10, .9, .1), trim, wl, 0, .45, .02); M(new THREE.BoxGeometry(10, .12, .14), trim, wl, 0, 3.7, .02); }
  // the window: white columns and a lawn outside
  const view = ctex(512, 640, (c, w, h) => { const sk = c.createLinearGradient(0, 0, 0, h); sk.addColorStop(0, '#6AA8E8'); sk.addColorStop(1, '#CFE6F4'); c.fillStyle = sk; c.fillRect(0, 0, w, h); c.fillStyle = '#5A9A4A'; c.fillRect(0, 470, w, 170); c.fillStyle = '#F6F4EE'; for (const x of [60, 210, 360]) { c.fillRect(x, 60, 70, 440); c.fillStyle = 'rgba(0,0,0,.1)'; c.fillRect(x + 50, 60, 20, 440); c.fillStyle = '#F6F4EE'; } c.fillRect(0, 30, w, 50); });
  const win = G(); win.position.set(-1.6, 0, -3.95); g.add(win); M(new THREE.PlaneGeometry(1.5, 2.0), new THREE.MeshBasicMaterial({ map: view }), win, 0, 2.1, 0);
  for (const [x, y, w, h] of [[0, 3.15, 1.66, .1], [0, 1.05, 1.66, .1], [-.78, 2.1, .1, 2.1], [.78, 2.1, .1, 2.1], [0, 2.1, .05, 2.0]]) M(new THREE.BoxGeometry(w, h, .08), trim, win, x, y, .04);
  for (const s of [-1, 1]) { const cu = M(new THREE.CylinderGeometry(.26, .32, 3.2, 14, 1, true), std({ color: '#C8A85A', roughness: .9 }), win, s * 1.05, 1.95, .2); cu.scale.z = .45; }
  // the US flag on a pole
  const flag = G(); flag.position.set(1.8, 0, -3.3); g.add(flag); M(new THREE.CylinderGeometry(.3, .36, .1, 20), std({ color: '#2A2A2E' }), flag, 0, .05, 0); M(new THREE.CylinderGeometry(.03, .03, 3.0, 10), std({ color: '#C8A030', metalness: .7, roughness: .3 }), flag, 0, 1.55, 0);
  const ft = ctex(512, 270, (c, w, h) => { for (let i = 0; i < 13; i++) { c.fillStyle = i % 2 ? '#F4F1EA' : '#B8202A'; c.fillRect(0, i * h / 13, w, h / 13 + 1); } c.fillStyle = '#1E3A7A'; c.fillRect(0, 0, w * .4, h * 7 / 13); c.fillStyle = '#FFFFFF'; for (let r = 0; r < 5; r++) for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(16 + k * 32 + (r % 2) * 16, 14 + r * 26, 4.5, 0, 7); c.fill(); } });
  const fg = new THREE.PlaneGeometry(1.4, .74, 12, 4); const fp = fg.attributes.position; for (let i = 0; i < fp.count; i++) { const x = fp.getX(i) + .7; fp.setZ(i, Math.sin(x * 3.2) * .08 * x); fp.setY(i, fp.getY(i) - x * x * .14); } fg.computeVertexNormals();
  const fl2 = M(fg, std({ map: ft, side: THREE.DoubleSide, roughness: .9 }), flag, -.72, 2.6, 0); fl2.rotation.y = Math.PI - .5;
  // the desk, a phone, a mug, papers, a lamp; a framed painting
  const desk = G(); desk.position.set(0, 0, -1.4); g.add(desk); const dw = std({ map: woodTex('#6A3E22', [2, 1], 11), roughness: .45 });
  M(new THREE.BoxGeometry(2.2, .08, 1.0), dw, desk, 0, .78, 0); for (const s of [-1, 1]) M(new THREE.BoxGeometry(.6, .74, .9), dw, desk, s * .8, .37, 0); M(new THREE.BoxGeometry(1.0, .5, .04), dw, desk, 0, .5, .42);
  const ph = G(); ph.position.set(-.6, .82, -.15); desk.add(ph); M(new THREE.BoxGeometry(.22, .08, .2), std({ color: '#E8E2D2', roughness: .4 }), ph, 0, .04, 0); g.userData.phoneBase = ph;
  const mug = G(); mug.position.set(.55, .82, .05); desk.add(mug); M(new THREE.CylinderGeometry(.045, .042, .11, 16), std({ color: '#F4F1EA', roughness: .4 }), mug, 0, .055, 0); M(new THREE.TorusGeometry(.03, .008, 6, 12), std({ color: '#F4F1EA' }), mug, .05, .06, 0); M(new THREE.CircleGeometry(.04, 16), std({ color: '#3A2214' }), mug, 0, .1, 0).rotation.x = -Math.PI / 2;
  g.userData.mug = mug;
  for (let i = 0; i < 2; i++) M(new THREE.BoxGeometry(.3, .006, .4), std({ color: '#F4EEDC' }), desk, .1 + i * .04, .825 + i * .006, .05).rotation.y = i * .2;
  const art = G(); art.position.set(3.0, 2.2, -3.94); g.add(art); M(new THREE.BoxGeometry(1.4, 1.0, .06), std({ color: '#B8902E', metalness: .6, roughness: .3 }), art); M(new THREE.PlaneGeometry(1.2, .8), std({ map: ctex(256, 180, (c, w, h) => { const s = c.createLinearGradient(0, 0, 0, h); s.addColorStop(0, '#8AB0D8'); s.addColorStop(1, '#E8D8B0'); c.fillStyle = s; c.fillRect(0, 0, w, h); c.fillStyle = '#4A6A3A'; c.beginPath(); c.moveTo(0, 120); c.quadraticCurveTo(80, 80, 160, 110); c.quadraticCurveTo(220, 130, 256, 100); c.lineTo(256, 180); c.lineTo(0, 180); c.fill(); }) }), art, 0, 0, .035);
  const chair = G(); chair.position.set(0, 0, -2.3); g.add(chair); const lm = std({ color: '#5A2A1E', roughness: .5 }); M(new THREE.BoxGeometry(.75, .14, .7), lm, chair, 0, .5, 0); M(new THREE.BoxGeometry(.75, 1.0, .14), lm, chair, 0, 1.0, -.32);
  return g;
}

// ---------------- hero props (toon + ink) ----------------
export function colaBottle() { const g = G(); const b = TM(bottleGeo(), '#3A2418', g, 0, 0, 0, .004); const lab = TM(new THREE.CylinderGeometry(.0425, .0425, .05, 16, 1, true), toon('#1E4FA8'), g, 0, .075, 0, 0); TM(new THREE.CylinderGeometry(.021, .021, .012, 12), '#D8D8DC', g, 0, .252, 0, .003); return g; }
export function cup() { const g = G(); TM(new THREE.CylinderGeometry(.05, .038, .11, 16, 1, true), toon('#F4F1EA'), g, 0, .055, 0, .004).material.side = THREE.DoubleSide; TM(new THREE.CylinderGeometry(.047, .047, .004, 16), '#2A140C', g, 0, .095, 0, 0); TM(new THREE.CylinderGeometry(.051, .051, .02, 16, 1, true), toon('#1E4FA8'), g, 0, .085, 0, 0).material.side = THREE.DoubleSide; return g; }
export function camera() { const g = G(); TM(new THREE.BoxGeometry(.16, .14, .12), '#2A2A2E', g, 0, 0, 0, .004); TM(new THREE.CylinderGeometry(.04, .045, .08, 16), '#1A1A1C', g, 0, 0, .09, .004).rotation.x = Math.PI / 2;
  const refl = TM(new THREE.CylinderGeometry(.11, .03, .07, 20, 1, true), toon('#D8DCE0'), g, .1, .1, .04, .003); refl.rotation.x = Math.PI / 2; refl.material.side = THREE.DoubleSide;
  const bulbM = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0 }); const fb = new THREE.Mesh(new THREE.SphereGeometry(.05, 12, 8), bulbM); fb.position.set(.1, .1, .06); g.add(fb);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(.45, 16, 12), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0, depthWrite: false })); glow.position.copy(fb.position); g.add(glow);
  g.userData.flash = k => { bulbM.opacity = k; glow.material.opacity = k * .5; glow.scale.setScalar(.5 + k); }; return g; }
export function rubles() { const g = G(); const t = ctex(256, 128, (c, w, h) => { c.fillStyle = '#C8B88A'; c.fillRect(0, 0, w, h); c.strokeStyle = '#6A5A3A'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#5A4A2A'; c.font = '900 34px Montserrat'; c.textAlign = 'center'; c.fillText('RUBLES', w / 2, 58); c.font = '900 40px Montserrat'; c.fillText('100', w / 2, 102); c.fillStyle = 'rgba(160,60,40,.6)'; c.beginPath(); c.arc(40, 64, 22, 0, 7); c.fill(); });
  const mm = new THREE.MeshToonMaterial({ map: t, gradientMap: toon('#fff').gradientMap }); for (let i = 0; i < 6; i++) { const n = TM(new THREE.BoxGeometry(.16, .004, .08), [toon('#B8A87A'), toon('#B8A87A'), mm, toon('#B8A87A'), toon('#B8A87A'), toon('#B8A87A')], g, (i % 2) * .006, i * .0045, 0, .002); n.rotation.y = (i - 3) * .04; } return g; }
export function note() { const g = G(); const t = ctex(256, 128, (c, w, h) => { c.fillStyle = '#C8B88A'; c.fillRect(0, 0, w, h); c.strokeStyle = '#6A5A3A'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#5A4A2A'; c.font = '900 34px Montserrat'; c.textAlign = 'center'; c.fillText('RUBLES', w / 2, 58); c.font = '900 40px Montserrat'; c.fillText('100', w / 2, 102); });
  const geo = new THREE.PlaneGeometry(.16, .08, 8, 2); const m = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ map: t, gradientMap: toon('#fff').gradientMap, side: THREE.DoubleSide })); g.add(m); const base = geo.attributes.position.array.slice();
  g.userData.droop = k => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = base[i * 3]; p.setZ(i, -Math.pow(Math.abs(x) / .08, 2) * .05 * k); } p.needsUpdate = true; geo.computeVertexNormals(); }; return g; }
export function vodka() { const g = G(); TM(vodkaGeo(), toon('#DDEBF0', { t: 1 }), g, 0, 0, 0, .004); const l = TM(new THREE.CylinderGeometry(.0475, .0475, .1, 16, 1, true), new THREE.MeshToonMaterial({ map: vodkaLabel(), gradientMap: toon('#fff').gradientMap }), g, 0, .1, 0, 0); TM(new THREE.CylinderGeometry(.018, .018, .02, 12), '#C8202A', g, 0, .325, 0, .003); return g; }
export function crate() { const g = G(); const w = toon('#B88A52'); for (const [x, y, z, sx, sy, sz] of [[0, .02, 0, .5, .04, .36], [0, .14, .18, .5, .2, .02], [0, .14, -.18, .5, .2, .02], [.25, .14, 0, .02, .2, .36], [-.25, .14, 0, .02, .2, .36]]) TM(new THREE.BoxGeometry(sx, sy, sz), w, g, x, y, z, .004);
  const t = ctex(256, 64, (c, w2, h) => { c.fillStyle = '#B88A52'; c.fillRect(0, 0, w2, h); c.fillStyle = '#5A2A1A'; c.font = '900 40px Montserrat'; c.textAlign = 'center'; c.fillText('VODKA', w2 / 2, 46); }); const l = new THREE.Mesh(new THREE.PlaneGeometry(.3, .08), new THREE.MeshBasicMaterial({ map: t })); l.position.set(0, .15, .192); g.add(l);
  for (let i = 0; i < 6; i++) { const b = vodka(); b.position.set(-.16 + (i % 3) * .16, .04, -.08 + Math.floor(i / 3) * .16); b.scale.setScalar(.95); g.add(b); } return g; }
export function contract() { const g = G(); const t = ctex(512, 680, (c, w, h) => { c.fillStyle = '#F6F1E2'; c.fillRect(0, 0, w, h); c.fillStyle = '#1A1416'; c.font = '900 50px Montserrat'; c.textAlign = 'center'; c.fillText('AGREEMENT', w / 2, 80); c.fillRect(60, 100, w - 120, 5);
    c.font = '900 64px Montserrat'; c.fillStyle = '#2E7A3A'; c.fillText('$3,000,000,000', w / 2, 220); c.strokeStyle = 'rgba(40,40,60,.55)'; c.lineWidth = 6; for (let y = 290; y < 540; y += 38) { c.beginPath(); c.moveTo(60, y); c.lineTo(w - 60 - (y % 3) * 30, y); c.stroke(); }
    c.strokeStyle = '#1A1416'; c.lineWidth = 3; c.beginPath(); c.moveTo(60, 620); c.lineTo(230, 620); c.moveTo(290, 620); c.lineTo(460, 620); c.stroke(); c.fillStyle = '#C8202A'; c.beginPath(); c.arc(400, 560, 34, 0, 7); c.fill(); });
  const m = new THREE.MeshToonMaterial({ map: t, gradientMap: toon('#fff').gradientMap, side: THREE.DoubleSide }); const p = new THREE.Mesh(new THREE.PlaneGeometry(.3, .4), m); g.add(p); g.userData.mat = m;
  const sig = new THREE.Mesh(new THREE.PlaneGeometry(.12, .03), new THREE.MeshBasicMaterial({ map: ctex(256, 64, (c, w, h) => { c.strokeStyle = '#1A2A6A'; c.lineWidth = 6; c.beginPath(); c.moveTo(10, 40); for (let x = 10; x < 240; x += 12) c.lineTo(x, 32 + Math.sin(x * .2) * 14 - (x > 160 ? 10 : 0)); c.stroke(); }), transparent: true })); sig.position.set(-.07, -.155, .002); g.add(sig); g.userData.sig = sig; return g; }
export function brick() { const g = G(); TM(new THREE.BoxGeometry(.06, .2, .04), '#2A2A2E', g, 0, 0, 0, .003); TM(new THREE.CylinderGeometry(.006, .006, .12, 6), '#1A1A1C', g, .02, .16, 0, .002); TM(new THREE.BoxGeometry(.045, .03, .005), '#7A9A6A', g, 0, .06, .021, 0); return g; }
export function handset() { const g = G(); const h = TM(new THREE.CapsuleGeometry(.022, .15, 4, 8), '#E8E2D2', g, 0, 0, 0, .003); for (const s of [-1, 1]) TM(new THREE.SphereGeometry(.035, 12, 8), '#E8E2D2', g, 0, s * .09, .02, .003).scale.set(1, .8, .7); return g; }
export function bigKey() { const g = G(); const gm = toon('#E8B848'); TM(new THREE.TorusGeometry(.06, .016, 8, 20), gm, g, 0, .12, 0, .004); TM(new THREE.CylinderGeometry(.012, .012, .2, 8), gm, g, 0, 0, 0, .004); for (const y of [-.08, -.05]) TM(new THREE.BoxGeometry(.04, .016, .012), gm, g, .022, y, 0, .003);
  const tg = new THREE.Mesh(new THREE.PlaneGeometry(.12, .07), new THREE.MeshBasicMaterial({ map: ctex(256, 150, (c, w, h) => { c.fillStyle = '#F4EEDC'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8E2A22'; c.lineWidth = 6; c.strokeRect(4, 4, w - 8, h - 8); c.fillStyle = '#1A1416'; c.font = '900 52px Montserrat'; c.textAlign = 'center'; c.fillText('SUB', w / 2, 92); }), side: THREE.DoubleSide })); tg.position.set(.08, .2, 0); tg.rotation.z = -.4; g.add(tg); return g; }
export function priceTag() { const g = G(); const t = ctex(512, 256, (c, w, h) => { c.fillStyle = '#F2D23A'; c.beginPath(); c.moveTo(60, 0); c.lineTo(w, 0); c.lineTo(w, h); c.lineTo(60, h); c.lineTo(0, h / 2); c.fill(); c.fillStyle = '#1A1416'; c.beginPath(); c.arc(56, h / 2, 16, 0, 7); c.fill(); c.font = '900 92px Montserrat'; c.textAlign = 'center'; c.fillText('SCRAP', 290, 120); c.font = '900 56px Montserrat'; c.fillText('$ CHEAP', 290, 196); });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshToonMaterial({ map: t, gradientMap: toon('#fff').gradientMap, side: THREE.DoubleSide, transparent: true })); g.add(p); return g; }
