// sets_base.js (from the Dexter Short) · "The Luckiest Fool": Newburyport waterfront in the 1790s (wharf, Federal brick and clapboard houses, a steeple,
// a merchant brig), a Caribbean sugar port (pastel houses, palms, the molasses copper), Siberian snow, the coal town of
// Newcastle (pithead, coal heaps, brick terraces, smoke), Dexter's study, and the voyage map. Environment = PBR without
// outlines; hero props = toon + ink.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TM, toon, G, RAMP } from './toon.js';
import { textPlane } from './kit.js';

const rng = s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
function ctex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t; }
const std = o => new THREE.MeshStandardMaterial({ roughness: 1, ...o });
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const put = (im, i, x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) => { _q.setFromEuler(_e.set(rx, ry, rz)); _m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz)); im.setMatrixAt(i, _m); };
const M = (geo, mat, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; if (parent) parent.add(o); return o; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const WATER = { value: 0 };   // time, for the sea textures
const waters = [];

// ---------------- textures ----------------
const planks = (col = '#9A6A3E', rep = [1, 1]) => ctex(512, 512, (g, w, h) => { const R = rng(11); g.fillStyle = col; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 32) { g.fillStyle = `rgba(0,0,0,${.12 + R() * .1})`; g.fillRect(0, y, w, 3); for (let x = (R() * 200) | 0; x < w; x += 180 + R() * 120) g.fillRect(x, y, 3, 32);
    g.fillStyle = `rgba(255,230,190,${R() * .08})`; g.fillRect(0, y + 3, w, 29); }
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${R() < .5 ? '60,35,15' : '230,190,140'},${.1 * R()})`; g.fillRect(R() * w, R() * h, 8 + R() * 30, 1.5); } }, rep);
const cobbles = rep => ctex(512, 512, (g, w, h) => { const R = rng(4); g.fillStyle = '#7A7268'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 28) for (let x = (y / 28 % 2) * 18; x < w; x += 36) { const c = 120 + R() * 50; g.fillStyle = `rgb(${c},${c * .95},${c * .88})`; g.beginPath(); g.roundRect(x + 2, y + 2, 32, 24, 9); g.fill(); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 6, y + 5, 18, 4); } }, rep);
const sandTex = rep => ctex(512, 512, (g, w, h) => { const R = rng(8); g.fillStyle = '#F2D9A2'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${R() < .5 ? '200,160,100' : '255,245,220'},${.25 * R()})`; g.fillRect(R() * w, R() * h, 2, 2); } }, rep);
const snowTex = rep => ctex(512, 512, (g, w, h) => { const R = rng(6); g.fillStyle = '#EEF3F8'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(${R() < .5 ? '170,190,220' : '255,255,255'},${.25 * R()})`; g.beginPath(); g.ellipse(R() * w, R() * h, 20 + R() * 60, 8 + R() * 20, 0, 0, 7); g.fill(); } }, rep);
const grimeTex = rep => ctex(512, 512, (g, w, h) => { const R = rng(12); g.fillStyle = '#5E5A54'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${R() < .6 ? '20,20,22' : '150,140,125'},${.2 * R()})`; g.fillRect(R() * w, R() * h, 2 + R() * 4, 2 + R() * 3); } }, rep);
const waveTex = ctex(512, 512, (g, w, h) => { const R = rng(21); g.fillStyle = '#C8CCD2'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.ellipse(R() * w, R() * h, 40 + R() * 90, 10 + R() * 24, 0, 0, 7); g.fill(); }
  g.lineCap = 'round'; for (let i = 0; i < 120; i++) { const x = R() * w, y = R() * h, l = 14 + R() * 30; g.strokeStyle = `rgba(255,255,255,${.5 + R() * .4})`; g.lineWidth = 3 + R() * 3; g.beginPath(); g.moveTo(x - l, y); g.quadraticCurveTo(x, y - 7, x + l, y); g.stroke(); } }, [1, 1]);
function sea(parent, col, w, d, x, z, y = -.7, rep = 10) {
  const t = waveTex.clone(); t.needsUpdate = true; t.repeat.set(rep, rep * d / w);
  const m = std({ color: col, map: t, roughness: .35, metalness: .05, envMapIntensity: .6 }); waters.push(m);
  const p = M(new THREE.PlaneGeometry(w, d), m, parent, x, y, z); p.rotation.x = -Math.PI / 2; p.castShadow = false; return p;
}
export function updateWater(t) { waters.forEach((m, i) => m.map.offset.set(t * .012 + i * .3, t * .018)); }
function facade(o) {   // a Federal / Georgian front: o = { w, h, cols, rows, wall, brick, trim, door, shutters, sign }
  const W = 512, H = Math.round(512 * o.h / o.w);
  return ctex(W, H, (g) => {
    const R = rng(o.seed ?? 3); g.fillStyle = o.wall; g.fillRect(0, 0, W, H);
    if (o.brick) for (let y = 0; y < H; y += 9) for (let x = (y / 9 % 2) * 11; x < W; x += 22) { g.fillStyle = `rgba(${R() < .5 ? '0,0,0' : '255,220,200'},${.1 * R() + .03})`; g.fillRect(x, y, 20, 7); }
    else for (let y = 0; y < H; y += 14) { g.fillStyle = 'rgba(0,0,0,.13)'; g.fillRect(0, y + 11, W, 3); g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(0, y, W, 2); }
    g.fillStyle = o.trim ?? '#F4F1EA'; g.fillRect(0, 0, W, 10); g.fillRect(0, 0, 10, H); g.fillRect(W - 10, 0, 10, H);
    const cw = W / o.cols, rh = (H - 20) / o.rows;
    for (let r = 0; r < o.rows; r++) for (let c = 0; c < o.cols; c++) {
      const isDoor = r === o.rows - 1 && c === (o.door ?? Math.floor(o.cols / 2));
      const x = c * cw + cw / 2, y = 20 + r * rh;
      if (isDoor) { const dw = cw * .5, dh = rh * .82; g.fillStyle = o.doorC ?? '#2E4A3A'; g.fillRect(x - dw / 2, y + rh - dh, dw, dh); g.fillStyle = o.trim ?? '#F4F1EA'; g.fillRect(x - dw / 2 - 6, y + rh - dh - 6, dw + 12, 6);
        g.beginPath(); g.arc(x, y + rh - dh - 6, dw / 2 + 6, Math.PI, 0); g.fill(); g.fillStyle = '#F2D890'; g.beginPath(); g.arc(x, y + rh - dh - 6, dw / 2 - 4, Math.PI, 0); g.fill(); continue; }
      const ww = cw * .42, wh = rh * .58, wx = x - ww / 2, wy = y + rh * .2;
      if (o.shutters) { g.fillStyle = o.shutters; g.fillRect(wx - ww * .45, wy, ww * .42, wh); g.fillRect(wx + ww * 1.03, wy, ww * .42, wh); }
      g.fillStyle = o.trim ?? '#F4F1EA'; g.fillRect(wx - 6, wy - 6, ww + 12, wh + 12); g.fillRect(wx - 10, wy - 14, ww + 20, 8);
      const gl = g.createLinearGradient(wx, wy, wx + ww, wy + wh); gl.addColorStop(0, '#3A5470'); gl.addColorStop(.5, '#7E9CB8'); gl.addColorStop(1, '#2C4058'); g.fillStyle = gl; g.fillRect(wx, wy, ww, wh);
      g.fillStyle = o.trim ?? '#F4F1EA'; g.fillRect(wx, wy + wh / 2 - 2, ww, 4); for (const k of [1, 2]) g.fillRect(wx + ww * k / 3 - 2, wy, 4, wh); g.fillRect(wx, wy + wh / 4 - 1, ww, 2); g.fillRect(wx, wy + wh * 3 / 4 - 1, ww, 2);
    }
    if (o.sign) { g.fillStyle = '#1E2A3A'; g.fillRect(W * .12, H - rh - 8, W * .76, 46); g.fillStyle = '#E8C060'; g.font = '700 30px Fredoka'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.sign, W / 2, H - rh + 15); }
  });
}
// a house: walls + facade on both long sides + a gable (or hip) roof + chimneys
function house(parent, x, z, ry, o) {
  const g = G(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g);
  const fm = std({ map: facade(o) }), wm = std({ color: o.wall, map: o.brick ? null : null });
  const body = M(new THREE.BoxGeometry(o.w, o.h, o.d), [wm, wm, wm, wm, fm, fm], g, 0, o.h / 2, 0);
  const rh = o.roof ?? o.d * .38, rc = o.roofC ?? '#4A4A52';
  const sh = new THREE.Shape(); sh.moveTo(-o.d / 2 - .25, 0); sh.lineTo(0, rh); sh.lineTo(o.d / 2 + .25, 0); sh.closePath();
  const rg = new THREE.ExtrudeGeometry(sh, { depth: o.w + .3, bevelEnabled: false }); rg.translate(0, 0, -(o.w + .3) / 2); rg.rotateY(Math.PI / 2);
  M(rg, std({ color: rc, roughness: .8 }), g, 0, o.h, 0);
  const cc = o.chimC ?? '#8A4A3A';
  for (const s of o.chims ?? [-1, 1]) M(new THREE.BoxGeometry(.6, rh + 1.2, .9), std({ color: cc }), g, s * (o.w / 2 - .5), o.h + (rh + 1.2) / 2 - .2, 0);
  if (o.dormers) for (let k = 0; k < o.dormers; k++) { const dx = (k - (o.dormers - 1) / 2) * o.w / o.dormers; M(new THREE.BoxGeometry(.9, .9, .9), std({ color: o.trim ?? '#F4F1EA' }), g, dx, o.h + rh * .4, o.d / 2 - rh * .55); }
  g.userData.top = o.h + rh; return g;
}

// ---------------- the merchant brig ----------------
export function ship(o = {}) {
  const g = G(), L = o.L ?? 13, Wm = o.W ?? 1.75, Dm = o.D ?? 2.3, W8 = .016;
  const hullC = o.hull ?? '#1E1A1E', bandC = o.band ?? '#D8A838';
  const halfW = u => u < .72 ? Wm * (.8 + .2 * Math.sin(u / .72 * Math.PI / 2)) : Wm * Math.pow(Math.cos((u - .72) / .28 * Math.PI / 2), .75);
  const sheer = u => .55 * Math.pow(2 * u - 1, 2) + (u > .8 ? (u - .8) * 1.2 : 0);
  const depth = u => Dm * (u < .82 ? 1 : 1 - .45 * (u - .82) / .18);
  const S = 48, N = 20, pos = [], col = [], idx = [];
  const cc = c => new THREE.Color(c);
  const colAt = (y, ys) => { const d = ys - y; return d < .32 ? cc('#7A4E2E') : d < .5 ? cc(bandC) : d < Dm * .62 ? cc(hullC) : cc('#B8682E'); };
  for (let i = 0; i <= S; i++) { const u = i / S, x = (u - .5) * L, hw = Math.max(.02, halfW(u)), ys = sheer(u), D = depth(u);
    for (let j = 0; j <= N; j++) { const ph = j / N * Math.PI, z = hw * Math.cos(ph), y = ys - D * Math.pow(Math.sin(ph), .55); pos.push(x, y, z); const c = colAt(y, ys); col.push(c.r, c.g, c.b); } }
  for (let i = 0; i < S; i++) for (let j = 0; j < N; j++) { const a = i * (N + 1) + j, b = a + N + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); hg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); hg.setIndex(idx); hg.computeVertexNormals();
  const hull = TM(hg, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: RAMP, side: THREE.DoubleSide }), g, 0, 0, 0, W8 * 2);
  // transom (stern) with windows
  const tw = halfW(0) * 2, ts = sheer(0);
  const tr = TM(new THREE.BoxGeometry(.12, 1.0, tw * .98), hullC, g, -L / 2 + .02, ts - .45, 0, W8);
  for (let k = -1; k <= 1; k++) { const wn = M(new THREE.PlaneGeometry(.34, .3), new THREE.MeshBasicMaterial({ color: '#F2D890' }), g, -L / 2 - .05, ts - .38, k * .5); wn.rotation.y = -Math.PI / 2; }
  // deck: flat planks inside the outline
  const sh = new THREE.Shape(); for (let i = 0; i <= S; i++) { const u = i / S; sh[i ? 'lineTo' : 'moveTo']((u - .5) * L, halfW(u) * .97); } for (let i = S; i >= 0; i--) { const u = i / S; sh.lineTo((u - .5) * L, -halfW(u) * .97); }
  const dg = new THREE.ShapeGeometry(sh, 4); dg.rotateX(-Math.PI / 2); { const p = dg.attributes.position; for (let i = 0; i < p.count; i++) { const u = p.getX(i) / L + .5; p.setY(i, sheer(u) - .32); } dg.computeVertexNormals(); }
  const dt = planks('#B48A5A', [3, 1]); dt.repeat.set(L / 4, 1);
  { const p = dg.attributes.position, uv = []; for (let i = 0; i < p.count; i++) uv.push(p.getX(i) / 4, p.getZ(i) / 2); dg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); }
  const deck = M(dg, std({ map: planks('#B48A5A', [1, 1]) }), g); deck.receiveShadow = true;
  // rails
  for (const sgn of [-1, 1]) { const pts = []; for (let i = 2; i <= S - 1; i++) { const u = i / S; pts.push(V((u - .5) * L, sheer(u) + .05, sgn * halfW(u) * .97)); }
    TM(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .045, 6), '#6A4426', g, 0, 0, 0, 0); }
  // masts, yards, sails
  const sailM = new THREE.MeshToonMaterial({ color: o.sail ?? '#F2EAD6', gradientMap: RAMP, side: THREE.DoubleSide });
  const sail = (w, h) => { const sg = new THREE.PlaneGeometry(w, h, 8, 6); const p = sg.attributes.position; for (let i = 0; i < p.count; i++) { const xx = p.getX(i) / w, yy = p.getY(i) / h; p.setZ(i, Math.cos(xx * Math.PI) * Math.cos(yy * Math.PI * .9) * .35); } sg.computeVertexNormals(); sg.rotateY(Math.PI / 2); return sg; };
  const masts = [[.66, 9.2], [.36, 10.2]]; g.userData.sails = [];
  for (const [u, hgt] of masts) {
    const x = (u - .5) * L, y0 = sheer(u) - .3;
    TM(new THREE.CylinderGeometry(.09, .16, hgt, 12), '#7A5232', g, x, y0 + hgt / 2, 0, W8);
    TM(new THREE.CylinderGeometry(.24, .24, .12, 12), '#5A3A22', g, x, y0 + hgt * .62, 0, W8 * .6);
    const yards = [[.3, 4.6], [.55, 3.9], [.78, 3.1], [.95, 2.2]];
    yards.forEach(([f, yw], k) => { const yy = y0 + hgt * f; const yd = TM(new THREE.CylinderGeometry(.05, .05, yw, 8), '#6A4426', g, x + .1, yy, 0, W8 * .6); yd.rotation.x = Math.PI / 2;
      if (k < 3) { const nf = yards[k + 1][0], sh2 = hgt * (nf - f) * .92; const s = TM(sail(yw * .94, sh2), sailM, g, x + .22, yy + sh2 / 2 - .02, 0, W8); g.userData.sails.push(s); } });
    for (const sgn of [-1, 1]) for (let k = 0; k < 3; k++) { const a = V(x - .4 + k * .4, sheer(u) + .1, sgn * halfW(u) * .95), b = V(x, y0 + hgt * .62, sgn * .2); const d = b.clone().sub(a);
      const r = M(new THREE.CylinderGeometry(.012, .012, d.length(), 4), toon('#2A2018'), g); r.position.copy(a).add(b).multiplyScalar(.5); r.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); r.castShadow = false; }
  }
  // bowsprit + jib, stays
  const bx = L / 2 - .4, by = sheer(1) - .1; const bs = TM(new THREE.CylinderGeometry(.06, .1, 4.2, 8), '#7A5232', g, bx + 1.6, by + .65, 0, W8); bs.rotation.z = -Math.PI / 2 + .32;
  const fmx = (masts[0][0] - .5) * L, fmTop = sheer(masts[0][0]) - .3 + masts[0][1] * .9;
  { const tipX = bx + 3.5, tipY = by + 1.35, js = new THREE.Shape(); js.moveTo(tipX - .3, tipY - .05); js.lineTo(fmx + .5, fmTop - .4); js.lineTo(fmx + 1.4, sheer(.72) + .9); js.closePath();
    const jg = new THREE.ShapeGeometry(js); const jib = TM(jg, sailM, g, 0, 0, 0, W8); jib.position.z = .02; g.userData.sails.push(jib);
    const d = V(fmx, fmTop + .3, 0).sub(V(tipX, tipY, 0)); const st = M(new THREE.CylinderGeometry(.012, .012, d.length(), 4), toon('#2A2018'), g); st.position.set((fmx + tipX) / 2, (fmTop + .3 + tipY) / 2, 0); st.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); }
  // the flag (Stars and Stripes, 15 stars) at the stern
  const fl = ctex(300, 180, (c, w, h) => { for (let k = 0; k < 13; k++) { c.fillStyle = k % 2 ? '#F4F1EA' : '#B8242E'; c.fillRect(0, k * h / 13, w, h / 13 + 1); } c.fillStyle = '#2A3A7A'; c.fillRect(0, 0, w * .42, h * 7 / 13); c.fillStyle = '#FFFFFF'; for (let k = 0; k < 15; k++) { c.beginPath(); c.arc(14 + (k % 5) * 24, 14 + Math.floor(k / 5) * 28, 4.5, 0, 7); c.fill(); } });
  const fpole = TM(new THREE.CylinderGeometry(.03, .03, 2.4, 6), '#6A4426', g, -L / 2 + .2, sheer(0) + 1.0, 0, 0); fpole.rotation.z = .35;
  const fg2 = new THREE.PlaneGeometry(1.3, .78, 6, 3); { const p = fg2.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 4) * .06); fg2.computeVertexNormals(); }
  const flag = M(fg2, new THREE.MeshToonMaterial({ map: fl, gradientMap: RAMP, side: THREE.DoubleSide }), g, -L / 2 - .6, sheer(0) + 1.75, 0); flag.castShadow = false; g.userData.flag = flag;
  // cargo hold hatch + a cabin skylight
  TM(new THREE.BoxGeometry(2.2, .22, 1.4), '#6A4426', g, -.6, sheer(.45) - .2, 0, W8);
  TM(new THREE.BoxGeometry(1.4, .5, 1.6), '#8A5E36', g, -L / 2 + 1.6, sheer(.12) - .05, 0, W8);
  g.userData.deckY = u => sheer(u) - .32; g.userData.L = L;
  return g;
}

// ---------------- props ----------------
export function warmingPan() {   // the bed warmer: a lidded brass pan on a long turned handle (grip at the origin, pan out along -z)
  const g0 = G(), g = G(), W = .006; g0.add(g); g.position.z = -.9; g0.userData = g.userData;
  const pan = TM(new THREE.CylinderGeometry(.16, .15, .06, 28), '#C8782E', g, 0, 0, 0, W);
  const lid = TM(new THREE.SphereGeometry(.165, 28, 10, 0, Math.PI * 2, 0, .55), '#E0A048', g, 0, -.04, 0, W); lid.scale.y = .55; g.userData.lid = lid;
  for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; TM(new THREE.SphereGeometry(.012, 6, 4), '#7A4418', g, Math.sin(a) * .09, .045, Math.cos(a) * .09, 0); }
  const h = TM(new THREE.CylinderGeometry(.018, .024, .75, 10), '#6A3A1E', g, 0, 0, .52, W); h.rotation.x = Math.PI / 2;
  TM(new THREE.SphereGeometry(.03, 10, 8), '#6A3A1E', g, 0, 0, .9, W);
  return g0;
}
export function mittenGeo() {
  const a = new THREE.CapsuleGeometry(.05, .07, 4, 10); a.scale(1, 1, .55);
  const th = new THREE.CapsuleGeometry(.018, .035, 4, 8); th.rotateZ(.7); th.translate(-.05, -.005, 0);
  const cuff = new THREE.CylinderGeometry(.052, .052, .04, 14); cuff.translate(0, -.07, 0); cuff.scale(1, 1, .6);
  return [mergeGeometries([a, th]), cuff];
}
export function mitten(col = '#D8283A') { const g = G(); const [m, c] = mittenGeo(); TM(m, col, g, 0, 0, 0, .004); TM(c, '#F4F1EA', g, 0, 0, 0, .004); return g; }
export function mittenPile(n, col = '#D8283A', R0 = .5, seed = 3) {   // instanced heap of mittens (red with white cuffs)
  const [m, c] = mittenGeo(), R = rng(seed);
  const a = new THREE.InstancedMesh(m, toon(col), n), b = new THREE.InstancedMesh(c, toon('#F4F1EA'), n);
  for (let i = 0; i < n; i++) { const r = Math.sqrt(R()) * R0, an = R() * 6.28, y = .04 + (1 - r / R0) * R0 * .55 * R(); const args = [Math.sin(an) * r, y, Math.cos(an) * r, R() * 6.3, 1, 1, 1, R() * 3, R() * 3]; put(a, i, ...args); put(b, i, ...args); }
  a.castShadow = b.castShadow = true; const g = G(); g.add(a, b); return g;
}
export function crate(label, sub = '') {
  const g = G(); TM(new THREE.BoxGeometry(.9, .6, .6), '#9A7442', g, 0, .3, 0, .008);
  for (const y of [.06, .54]) TM(new THREE.BoxGeometry(.92, .06, .62), '#6A4E28', g, y === .06 ? 0 : 0, y, 0, 0);
  const t = textPlane([{ text: label, size: 92, y: 120, color: '#2A1A10', weight: 700, font: 'Montserrat' }, { text: sub, size: 56, y: 205, color: '#2A1A10', weight: 700, font: 'Montserrat' }], .8, .34, { w: 800, h: 300 });
  t.position.set(0, .3, .306); g.add(t); return g;
}
export function barrel(label = '') {
  const g = G(); const pr = []; for (let k = 0; k <= 10; k++) { const y = k / 10; pr.push(new THREE.Vector2(.26 + Math.sin(y * Math.PI) * .06, y * .8)); }
  TM(new THREE.LatheGeometry(pr, 20), '#9A6A3A', g, 0, 0, 0, .008);
  for (const y of [.1, .7]) { const b = TM(new THREE.TorusGeometry(.29, .012, 6, 24), '#3A3230', g, 0, y, 0, 0); b.rotation.x = Math.PI / 2; }
  TM(new THREE.CircleGeometry(.26, 20), '#7A5230', g, 0, .8, 0, 0).rotation.x = -Math.PI / 2;
  if (label) { const t = textPlane([{ text: label, size: 110, y: 128, color: '#2A1A10', weight: 700, font: 'Fredoka' }], .44, .2, { w: 560, h: 256 }); t.position.set(0, .42, .325); g.add(t); }
  return g;
}
export function sack(col = '#A8885A') { const g = G(); const s = TM(new THREE.SphereGeometry(.22, 16, 12), col, g, 0, .2, 0, .007); s.scale.set(1, 1.15, .8); TM(new THREE.CylinderGeometry(.05, .08, .1, 10), col, g, 0, .47, 0, .006); return g; }
export function coalSack() { const g = sack('#7A6A50'); const t = textPlane([{ text: 'COAL', size: 120, y: 128, color: '#1A1414', weight: 900, font: 'Montserrat' }], .3, .15, { w: 512, h: 256 }); t.position.set(0, .24, .185); g.add(t); return g; }
export function picket(text) { const g = G(); TM(new THREE.BoxGeometry(.05, 1.1, .05), '#8A6A3A', g, 0, .2, 0, .006);
  const s = textPlane([{ text, size: 118, y: 150, color: '#C8202A', weight: 900, font: 'Montserrat' }], .78, .46, { w: 760, h: 300, bg: '#F4ECD8', border: '#1A1414', bw: 16, round: 10 });
  s.position.set(0, .82, .03); g.add(s); TM(new THREE.BoxGeometry(.8, .48, .02), '#E8DCC0', g, 0, .82, 0, .006); return g; }
export function spyglass() { const g = G(); const a = TM(new THREE.CylinderGeometry(.03, .036, .26, 14), '#C8962E', g, 0, 0, 0, .005); a.rotation.x = Math.PI / 2; const b = TM(new THREE.CylinderGeometry(.024, .026, .2, 14), '#6A3A1E', g, 0, 0, .2, .005); b.rotation.x = Math.PI / 2; const c = TM(new THREE.CylinderGeometry(.018, .02, .14, 14), '#C8962E', g, 0, 0, .35, .005); c.rotation.x = Math.PI / 2; return g; }
export function shaker(kind) { const g = G(); const pr = [[0, 0], [.035, 0], [.04, .02], [.038, .1], [.03, .13], [.022, .15], [0, .155]].map(([r, y]) => new THREE.Vector2(r, y));
  TM(new THREE.LatheGeometry(pr, 20), kind === 'salt' ? '#F4F1EA' : '#2A2626', g, 0, 0, 0, .004); TM(new THREE.CylinderGeometry(.024, .022, .03, 16), '#C8C8CC', g, 0, .155, 0, .003); return g; }
export function quill() { const g = G(); const f = TM(new THREE.ConeGeometry(.03, .28, 8), '#F7F4EC', g, 0, .12, 0, .004); f.scale.z = .2; TM(new THREE.CylinderGeometry(.004, .002, .1, 6), '#E8DCC0', g, 0, -.05, 0, 0); return g; }
export function bookClosed(title = 'A PICKLE FOR THE KNOWING ONES') {
  const g = G(); TM(new THREE.BoxGeometry(.2, .28, .045), '#6A2A1E', g, 0, 0, 0, .005);
  TM(new THREE.BoxGeometry(.19, .27, .04), '#F2EAD0', g, .006, 0, 0, 0);
  const t = textPlane([{ text: 'A PICKLE', size: 64, y: 110, color: '#E8C060', weight: 700, font: 'Fredoka' }, { text: 'FOR THE', size: 44, y: 180, color: '#E8C060', weight: 700, font: 'Fredoka' }, { text: 'KNOWING', size: 64, y: 250, color: '#E8C060', weight: 700, font: 'Fredoka' }, { text: 'ONES', size: 64, y: 320, color: '#E8C060', weight: 700, font: 'Fredoka' }, { text: 'T. DEXTER', size: 36, y: 420, color: '#E8C060', weight: 700, font: 'Fredoka' }], .18, .26, { w: 360, h: 520 });
  t.position.set(0, 0, .024); g.add(t); return g;
}
// the open book: two pages and a turning leaf; setPage('text' | 'punct')
const DEX_TEXT = ['ime the first Lord in the younited', 'States of A mercary Now of Newbury', 'port it is the voise of the peopel', 'and I cant Help it and so Let it goue', 'it is the Best to be Lucky and to Be', 'Rich and to sell the warming pans to', 'the west inges and the mittens and the', 'Coles to Newcastel and the Nowing ones', 'they Laft at me and I Laft at them', 'all the way to the Bank and so I goue', 'on and on and on with no stops at all', 'becaus stops are for the Weak and the', 'pore and I am Lord and wise'];
const PUNCT = '.,;:!?';
function pageCanvas(kind, side) {
  const c = document.createElement('canvas'); c.width = 768; c.height = 1024; const g = c.getContext('2d');
  const gr = g.createLinearGradient(side < 0 ? 768 : 0, 0, side < 0 ? 0 : 768, 0); gr.addColorStop(0, '#D8C8A0'); gr.addColorStop(.12, '#F4EAD0'); gr.addColorStop(1, '#F8F0DA'); g.fillStyle = gr; g.fillRect(0, 0, 768, 1024);
  const R = rng(side < 0 ? 5 : 9); for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(150,110,60,${.06 * R()})`; g.fillRect(R() * 768, R() * 1024, 3, 3); }
  g.fillStyle = '#2A1E16'; g.textBaseline = 'alphabetic';
  if (kind === 'text') { g.font = '600 36px serif'; DEX_TEXT.concat(DEX_TEXT).slice(side < 0 ? 0 : 6, side < 0 ? 19 : 25).forEach((l, i) => g.fillText(l, 60, 110 + i * 46)); g.font = '600 30px serif'; g.fillText(side < 0 ? '12' : '13', 360, 990); }
  else if (kind === 'punct') {
    g.font = '600 26px serif'; ['fouder mister printer the Nowing ones complane of', 'my book the fust edition had no stops I put in A', 'Nuf here and thay may peper and solt it as they plese'].forEach((l, i) => g.fillText(l, 44, 90 + i * 36));
    g.font = '700 64px serif'; for (let r = 0; r < 11; r++) { let s = ''; for (let k = 0; k < 14; k++) s += PUNCT[(r * 5 + k * 7) % 6] + ' '; g.fillText(s, 50, 260 + r * 66); }
  }
  return c;
}
export function bookOpen() {
  const g = G(), W = .9, H = .62;
  TM(new THREE.BoxGeometry(W + .04, .03, H + .04), '#6A2A1E', g, 0, .015, 0, .006);
  const mk = (kind, side) => { const t = new THREE.CanvasTexture(pageCanvas(kind, side)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const pg = side => { const geo = new THREE.PlaneGeometry(W / 2 - .01, H, 12, 1); geo.translate(side * W / 4, 0, 0); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const d = Math.abs(p.getX(i)) / (W / 2); p.setZ(i, Math.sin(d * Math.PI) * .025 + (1 - d) * .015); } geo.rotateX(-Math.PI / 2); geo.computeVertexNormals(); return geo; };
  const texL = mk('text', -1), texR = mk('text', 1), texP = mk('punct', 1);
  const mL = new THREE.MeshStandardMaterial({ map: texL, roughness: .9 }), mR = new THREE.MeshStandardMaterial({ map: texR, roughness: .9 });
  const L = M(pg(-1), mL, g, 0, .035, 0), Rr = M(pg(1), mR, g, 0, .035, 0);
  // the turning leaf: hinged at the spine, front = right-page text, back = punctuation page
  const leaf = G(); leaf.position.set(0, .04, 0); g.add(leaf);
  const lg = new THREE.PlaneGeometry(W / 2 - .01, H, 12, 1); lg.translate(W / 4, 0, 0); lg.rotateX(-Math.PI / 2);
  const front = M(lg, new THREE.MeshStandardMaterial({ map: texR, roughness: .9, side: THREE.FrontSide }), leaf); const back = M(lg.clone(), new THREE.MeshStandardMaterial({ map: texL, roughness: .9, side: THREE.BackSide }), leaf);
  { const uv = back.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i)); }
  leaf.visible = false;
  g.userData = { leaf, turn(k) { leaf.visible = k > 0; leaf.rotation.z = k * Math.PI; const bend = Math.sin(k * Math.PI) * .25; leaf.scale.set(1 - bend * .2, 1, 1); }, show(kind) { const m = kind === 'punct' ? texP : texR; if (mR.map !== m) { mR.map = m; mR.needsUpdate = true; } }, texL, texR, texP, mL, mR };
  return g;
}

// ---------------- vegetation ----------------
function palm(parent, x, z, h, lean, seed) {
  const R = rng(seed), g = G(); g.position.set(x, 0, z); g.rotation.y = R() * 6.3; parent.add(g);
  const pts = []; for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push(V(Math.sin(u * 1.4) * lean, u * h, 0)); }
  const cur = new THREE.CatmullRomCurve3(pts); const tr = M(new THREE.TubeGeometry(cur, 16, .16, 8), std({ color: '#8A6A48' }), g);
  for (let k = 1; k < 8; k++) { const p = cur.getPointAt(k / 8); const r = M(new THREE.TorusGeometry(.17, .03, 4, 10), std({ color: '#6A4E34' }), g, p.x, p.y, p.z); r.rotation.x = Math.PI / 2; }
  const top = cur.getPointAt(1);
  const fm = std({ color: R() < .5 ? '#4E9A3A' : '#5AA844', side: THREE.DoubleSide });
  for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, len = 2.2 + R() * .6, fg = new THREE.PlaneGeometry(len, .5, 8, 1); const p = fg.attributes.position;
    for (let i = 0; i < p.count; i++) { const xx = p.getX(i) / len + .5; p.setY(i, p.getY(i) * (1 - xx * .85)); p.setZ(i, -xx * xx * 1.1); } fg.translate(len / 2, 0, 0); fg.rotateX(Math.PI / 2); fg.computeVertexNormals();
    const f = M(fg, fm, g, top.x, top.y, top.z); f.rotation.y = a; f.rotation.z = .25; }
  for (let k = 0; k < 3; k++) M(new THREE.SphereGeometry(.12, 10, 8), std({ color: '#5A3E22' }), g, top.x + Math.sin(k * 2.1) * .18, top.y - .15, top.z + Math.cos(k * 2.1) * .18);
}
function pines(parent, n, area, seed, snow = true) {
  const R = rng(seed), c1 = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1.6, 9), std({ color: '#2E5A3E' }), n * 3), c2 = new THREE.InstancedMesh(new THREE.ConeGeometry(1, .7, 9), std({ color: '#F4F8FC' }), n * 3), tr = new THREE.InstancedMesh(new THREE.CylinderGeometry(.12, .16, 1, 6), std({ color: '#5A3E2A' }), n);
  let i = 0; for (let k = 0; k < n; k++) { const [x, z] = area(R), s = .8 + R() * 1.4; put(tr, k, x, .5 * s, z, 0, s, s, s);
    for (let l = 0; l < 3; l++) { const r = (1.3 - l * .35) * s, y = (1.2 + l * 1.05) * s; put(c1, i, x, y, z, R() * 3, r, s, r); put(c2, i, x, y + .5 * s, z, R() * 3, r * .7, s, r * .7); i++; } }
  [c1, c2, tr].forEach(m => { m.castShadow = true; m.receiveShadow = true; parent.add(m); }); if (!snow) c2.visible = false;
}
function hills(parent, cols, n, R0, R1, seed, y0 = 0) {
  const R = rng(seed); for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, d = R0 + R() * (R1 - R0), r = 20 + R() * 40;
    const h = M(new THREE.SphereGeometry(r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: cols[i % cols.length] }), parent, Math.sin(a) * d, y0 - r * .25, Math.cos(a) * d); h.scale.y = .35 + R() * .3; h.castShadow = false; }
}

// ---------------- Newburyport, Massachusetts ----------------
// wharf along x at z ∈ [-4, 0] (deck y = 0), the brig moored at z = -7.6, Water Street z 0..7, the houses beyond
export const NBP = { shipZ: -7.6, shipX: 0 };
export function port() {
  const g = G();
  sea(g, '#2E6E9A', 500, 300, 0, -154, -.7, 60);
  const deck = M(new THREE.BoxGeometry(46, .3, 4.2), std({ map: planks('#9A6E44', [12, 1]) }), g, 0, -.15, -2.1);
  const pil = new THREE.InstancedMesh(new THREE.CylinderGeometry(.16, .18, 2.4, 8), std({ color: '#5A4430' }), 24); for (let i = 0; i < 24; i++) put(pil, i, -23 + i * 2, -1.0, -4.15); pil.castShadow = true; g.add(pil);
  for (let i = 0; i < 6; i++) { M(new THREE.CylinderGeometry(.12, .14, .45, 10), std({ color: '#2A2626' }), g, -15 + i * 6, .22, -3.75); }
  M(new THREE.PlaneGeometry(60, 9), std({ map: cobbles([20, 3]) }), g, 0, .005, 4.5).rotation.x = -Math.PI / 2;
  M(new THREE.PlaneGeometry(200, 120), std({ color: '#7A8A5A' }), g, 0, -.02, 69).rotation.x = -Math.PI / 2;
  // the Federal brick + clapboard row on Water Street (facing the sea, -z)
  const row = [
    { w: 6, h: 7.5, d: 6, cols: 3, rows: 3, wall: '#A8503A', brick: 1, trim: '#F4F1EA', roofC: '#3E3E46', chimC: '#8A4232', sign: 'T. DEXTER · MERCHANT', doorC: '#2E4A3A' },
    { w: 5, h: 6.2, d: 6, cols: 3, rows: 2, wall: '#E8E0CC', shutters: '#2E4A3A', trim: '#FFFFFF', roofC: '#4A4A52', dormers: 2 },
    { w: 5.5, h: 7, d: 6, cols: 3, rows: 3, wall: '#B85C44', brick: 1, roofC: '#3A3A40', chimC: '#7A3A2A' },
    { w: 4.6, h: 5.8, d: 5.5, cols: 2, rows: 2, wall: '#D8B868', shutters: '#3A4A6A', roofC: '#5A4A44', door: 0 },
    { w: 6.4, h: 8, d: 6.5, cols: 4, rows: 3, wall: '#9A4A36', brick: 1, roofC: '#38383E', sign: 'CUSTOM HOUSE' },
    { w: 5, h: 6, d: 6, cols: 3, rows: 2, wall: '#8EA0B0', shutters: '#F4F1EA', roofC: '#4A4A52' },
    { w: 5.6, h: 6.8, d: 6, cols: 3, rows: 3, wall: '#B4583E', brick: 1, roofC: '#3E3E46' },
    { w: 4.8, h: 5.6, d: 5.6, cols: 2, rows: 2, wall: '#EFE6CF', shutters: '#7A2A2A', roofC: '#4A4A52', door: 1 },
  ];
  let x = -23; row.forEach((o, i) => { house(g, x + o.w / 2, 9 + o.d / 2 - 3, Math.PI, { ...o, seed: i + 2 }); x += o.w + .15; });
  // a second row and the white steeple behind
  for (let i = 0; i < 9; i++) house(g, -24 + i * 6, 20, Math.PI, { w: 5.4, h: 6 + (i % 3), d: 6, cols: 3, rows: 2, wall: ['#A8503A', '#E8E0CC', '#C8A050', '#8EA0B0'][i % 4], brick: i % 4 === 0, shutters: '#2E4A3A', roofC: '#45454C', seed: 20 + i });
  const st = G(); st.position.set(6, 0, 30); g.add(st);
  M(new THREE.BoxGeometry(5, 9, 8), std({ color: '#F4F1EA' }), st, 0, 4.5, 0); M(new THREE.BoxGeometry(2.6, 4, 2.6), std({ color: '#F4F1EA' }), st, 0, 11, -2.5);
  M(new THREE.BoxGeometry(2, 3, 2), std({ color: '#F4F1EA' }), st, 0, 14.5, -2.5); M(new THREE.ConeGeometry(1.2, 6, 8), std({ color: '#3A3A42' }), st, 0, 19, -2.5);
  M(new THREE.CircleGeometry(.5, 20), std({ color: '#E8C060' }), st, 0, 11.4, -3.82).rotation.y = Math.PI;
  // far shore across the river mouth
  M(new THREE.BoxGeometry(400, 3, 20), std({ color: '#5E7A4A' }), g, 0, -.5, -150); hills(g, ['#6A8A56', '#5A7A4A', '#7A946A'], 14, 150, 230, 7, -1);
  // wharf clutter: barrels, crates, sacks, a rope coil, lamp posts
  g.userData.ship = ship({ hull: '#1E1A22', band: '#D8A838' }); g.userData.ship.position.set(NBP.shipX, -.35, NBP.shipZ); g.add(g.userData.ship);
  const ship2 = ship({ hull: '#2A3A2A', band: '#E8E0CC', L: 11 }); ship2.position.set(-30, -.4, -13); ship2.rotation.y = .4; g.add(ship2);
  const ship3 = ship({ hull: '#3A2420', band: '#C8A050', L: 12 }); ship3.position.set(36, -.4, -16); ship3.rotation.y = -.5; g.add(ship3);
  for (const [bx, bz] of [[-6, -1.2], [-5.4, -.6], [8.5, -1], [9.1, -1.6], [12, -.8]]) { const b = barrel(); b.position.set(bx, 0, bz); g.add(b); }
  for (const [bx, bz, r] of [[-9, -1, .2], [-8.6, -1.9, -.1], [14, -1.5, .3]]) { const c = crate('', ''); c.position.set(bx, 0, bz); c.rotation.y = r; g.add(c); }
  const coil = M(new THREE.TorusGeometry(.28, .07, 8, 20), std({ color: '#C8A878' }), g, 3.2, .07, -3.2); coil.rotation.x = Math.PI / 2;
  for (const lx of [-15, 6.5, 15]) { M(new THREE.CylinderGeometry(.05, .07, 3, 8), std({ color: '#1E1E22' }), g, lx, 1.5, 1.2); M(new THREE.BoxGeometry(.3, .4, .3), std({ color: '#F2D890', emissive: '#806020', emissiveIntensity: .3 }), g, lx, 3.1, 1.2); }
  // gulls
  const gulls = []; for (let i = 0; i < 7; i++) { const gl = G(); const wm = toon('#F4F1EA'); for (const s of [-1, 1]) { const w = TM(new THREE.BoxGeometry(.5, .02, .14), wm, gl, s * .25, 0, 0, .004); w.rotation.z = s * .3; } TM(new THREE.SphereGeometry(.08, 8, 6), wm, gl, 0, 0, 0, .004).scale.z = 2; g.add(gl); gulls.push(gl); }
  g.userData.gulls = gulls;
  return g;
}
export function animGulls(set, t, c = V(0, 9, -6)) { (set.userData.gulls ?? []).forEach((gl, i) => { const a = t * (.35 + i * .04) + i * 1.3, r = 6 + i * 1.6; gl.position.set(c.x + Math.sin(a) * r, c.y + Math.sin(t * 1.3 + i) * .6 + i * .3, c.z + Math.cos(a) * r * .5); gl.rotation.y = a + Math.PI / 2; gl.children.slice(0, 2).forEach((w, k) => w.rotation.z = (k ? -1 : 1) * (.2 + Math.sin(t * 8 + i) * .35)); }); }

// ---------------- the Caribbean sugar port ----------------
export function isle() {
  const g = G();
  sea(g, '#2CB8C8', 500, 300, 0, -152, -.55, 60);
  M(new THREE.PlaneGeometry(300, 160), std({ map: sandTex([60, 30]) }), g, 0, -.02, 78).rotation.x = -Math.PI / 2;
  const beach = M(new THREE.PlaneGeometry(300, 10, 1, 1), std({ map: sandTex([60, 2]) }), g, 0, -.3, -2.5); beach.rotation.x = -Math.PI / 2 - .06;
  // the pier
  M(new THREE.BoxGeometry(3.4, .3, 16), std({ map: planks('#A87E52', [2, 8]) }), g, -6, -.05, -9);
  const pil = new THREE.InstancedMesh(new THREE.CylinderGeometry(.14, .16, 2, 8), std({ color: '#6A5038' }), 18); for (let i = 0; i < 9; i++) for (const s of [-1, 1]) put(pil, i * 2 + (s > 0), -6 + s * 1.6, -.9, -2 - i * 2); g.add(pil);
  g.userData.ship = ship({ hull: '#1E1A22', band: '#D8A838' }); g.userData.ship.position.set(-.5, -.35, -12); g.userData.ship.rotation.y = Math.PI / 2; g.add(g.userData.ship);
  // pastel houses with red tile roofs
  const cols = ['#F2A0B0', '#F6D266', '#8ED8C0', '#7EC8E8', '#F4B880', '#C8A8E8', '#F2F0E6'];
  for (let i = 0; i < 9; i++) house(g, -22 + i * 5.6, 11 + (i % 2) * .8, Math.PI, { w: 5, h: 4.4 + (i % 3) * .8, d: 5, cols: 2, rows: 2, wall: cols[i % cols.length], shutters: ['#2E7A8A', '#E8566A', '#3A9A5A'][i % 3], trim: '#FFFFFF', roofC: '#C8583A', chimC: '#C8583A', chims: [], seed: 40 + i });
  // the boiling house with the molasses copper outside, under an awning
  const bh = G(); bh.position.set(4.5, 0, 3.2); g.add(bh); g.userData.vat = bh;
  M(new THREE.CylinderGeometry(.82, .9, .5, 24), std({ color: '#A8503A' }), bh, 0, .25, 0);
  const vg = new THREE.SphereGeometry(.74, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); const vat = TM(vg, '#C8783A', bh, 0, .95, 0, .012); vat.material = toon('#C8783A').clone(); vat.material.side = THREE.DoubleSide;
  const rim = TM(new THREE.TorusGeometry(.74, .05, 8, 32), '#9A5A2A', bh, 0, .95, 0, .01); rim.rotation.x = Math.PI / 2;
  const mol = M(new THREE.CircleGeometry(.7, 32), new THREE.MeshStandardMaterial({ color: '#5A2A0E', roughness: .15, metalness: .1 }), bh, 0, .88, 0); mol.rotation.x = -Math.PI / 2; mol.castShadow = false;
  const steam = []; for (let k = 0; k < 6; k++) { const s = M(new THREE.SphereGeometry(.3, 10, 8), new THREE.MeshStandardMaterial({ color: '#FFFFFF', transparent: true, opacity: .2, roughness: 1, depthWrite: false }), bh); s.castShadow = false; steam.push(s); } bh.userData.steam = steam;
  for (const [ax, az] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) M(new THREE.CylinderGeometry(.06, .06, 3, 8), std({ color: '#6A4E34' }), bh, ax, 1.5, az);
  const aw = ctex(256, 64, (c, w, h) => { for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#F4F1EA' : '#2EA0A8'; c.fillRect(k * 32, 0, 32, h); } });
  M(new THREE.BoxGeometry(3.6, .08, 3.6), std({ map: aw }), bh, 0, 3.0, 0);
  for (const [bx, bz] of [[-2.2, .6], [-2.3, -.2], [-2.9, .2], [2.4, .9]]) { const b = barrel('MOLASSES'); b.position.set(bx, 0, bz); b.rotation.y = .4; bh.add(b); }
  // palms along the beach and between the houses
  const P = [[-14, 2.5, 7.5, 1.4], [-10, 6, 8.5, 1.8], [-3, 5.5, 7, 1.1], [11, 2, 8, 1.7], [14, 6.5, 9, 2.1], [-18, 6.8, 9, 1.5], [18, 3.5, 7.4, 1.2], [8, 7.5, 7.8, 1.6], [-22, 3.2, 8.2, 1.9], [22, 7.2, 8.6, 1.6]];
  P.forEach(([px, pz, h, l], i) => palm(g, px, pz, h, l, i + 3));
  hills(g, ['#3E8A44', '#4A9A4E', '#367A3E'], 10, 90, 160, 9, -2);
  return g;
}
export function animSteam(set, t) { const bh = set.userData.vat; if (!bh) return; bh.userData.steam.forEach((s, k) => { const u = ((t * .35 + k / 6) % 1); s.position.set(Math.sin(k * 2.3 + t * .5) * .4 * u, 1.0 + u * 2.2, Math.cos(k * 1.7) * .4 * u); s.scale.setScalar(.5 + u * 1.2); s.material.opacity = .18 * (1 - u) * Math.min(1, u * 5); }); }

// ---------------- Siberia ----------------
export function snow() {
  const g = G();
  M(new THREE.PlaneGeometry(400, 400), std({ map: snowTex([40, 40]) }), g, 0, 0, 0).rotation.x = -Math.PI / 2;
  pines(g, 140, R => { let x, z; do { x = (R() - .5) * 120; z = -8 - R() * 90; } while (Math.abs(x) < 4 && z > -16); return [x, z]; }, 5);
  pines(g, 30, R => [(R() < .5 ? -1 : 1) * (7 + R() * 30), 4 + R() * 30], 6);
  // a log cabin with a smoking chimney
  const cb = G(); cb.position.set(-6, 0, -12); cb.rotation.y = .5; g.add(cb);
  for (let k = 0; k < 7; k++) { for (const s of [-1, 1]) { const l = M(new THREE.CylinderGeometry(.22, .22, 6, 10), std({ color: '#7A5234' }), cb, 0, .22 + k * .42, s * 2); l.rotation.z = Math.PI / 2; const l2 = M(new THREE.CylinderGeometry(.22, .22, 4.4, 10), std({ color: '#6A4628' }), cb, s * 2.8, .22 + k * .42, 0); l2.rotation.x = Math.PI / 2; } }
  const sh = new THREE.Shape(); sh.moveTo(-2.6, 0); sh.lineTo(0, 1.8); sh.lineTo(2.6, 0); sh.closePath(); const rg = new THREE.ExtrudeGeometry(sh, { depth: 6.6, bevelEnabled: false }); rg.translate(0, 0, -3.3); rg.rotateY(Math.PI / 2);
  M(rg, std({ color: '#F4F8FC' }), cb, 0, 3.0, 0); M(new THREE.BoxGeometry(.6, 1.6, .6), std({ color: '#6A6A70' }), cb, 1.8, 4.2, .8);
  M(new THREE.PlaneGeometry(.8, .6), new THREE.MeshBasicMaterial({ color: '#F2C870' }), cb, 0, 1.4, 2.25);
  hills(g, ['#DCE6F0', '#C8D6E6', '#E6EEF6'], 12, 110, 200, 4, -1);
  // falling snow
  const n = 2500, R = rng(31), pos = new Float32Array(n * 3), base = new Float32Array(n * 3); for (let i = 0; i < n; i++) { base.set([(R() - .5) * 40, R() * 14, (R() - .5) * 40], i * 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const flake = ctex(64, 64, (c, w, h) => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.5, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: .09, map: flake, transparent: true, depthWrite: false })); pts.frustumCulled = false; g.add(pts);
  g.userData.snow = { pts, base, n };
  return g;
}
export function animSnow(set, t, c) { const s = set.userData.snow; if (!s) return; const p = s.pts.geometry.attributes.position;
  for (let i = 0; i < s.n; i++) { const bx = s.base[i * 3], by = s.base[i * 3 + 1], bz = s.base[i * 3 + 2]; const y = ((by - t * 1.1) % 14 + 14) % 14; p.setXYZ(i, c.x + bx + Math.sin(t + i) * .3, y, c.z + bz + Math.cos(t * .8 + i) * .3); }
  p.needsUpdate = true; }

// ---------------- Newcastle upon Tyne: the coal quay ----------------
export function newc() {
  const g = G();
  sea(g, '#4A6A6A', 500, 300, 0, -154, -.7, 60);
  M(new THREE.BoxGeometry(60, .3, 4.2), std({ map: grimeTex([12, 1]) }), g, 0, -.15, -2.1);
  M(new THREE.PlaneGeometry(200, 140), std({ map: grimeTex([40, 28]) }), g, 0, .002, 70).rotation.x = -Math.PI / 2;
  const pil = new THREE.InstancedMesh(new THREE.CylinderGeometry(.16, .18, 2.4, 8), std({ color: '#3A3430' }), 30); for (let i = 0; i < 30; i++) put(pil, i, -29 + i * 2, -1.0, -4.15); g.add(pil);
  g.userData.ship = ship({ hull: '#1E1A22', band: '#D8A838' }); g.userData.ship.position.set(-2, -.35, -7.6); g.add(g.userData.ship);
  // coal heaps
  const heap = (x, z, r, h, seed) => { const geo = new THREE.ConeGeometry(r, h, 18, 6); const R = rng(seed), p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > -h / 2 + .01 && y < h / 2 - .01) { p.setX(i, p.getX(i) * (1 + (R() - .5) * .18)); p.setZ(i, p.getZ(i) * (1 + (R() - .5) * .18)); } } geo.computeVertexNormals();
    M(geo, std({ color: '#26262A', roughness: .55, metalness: .2, flatShading: true }), g, x, h / 2 - .05, z); };
  heap(-12, 5, 3.4, 3.2, 1); heap(-17, 8, 4.2, 4.4, 2); heap(13, 6, 3.8, 3.6, 3); heap(19, 9, 4.6, 4.8, 4); heap(-7, 9.5, 2.6, 2.4, 5); heap(-1.5, 10.5, 3.6, 4.2, 6); heap(7.5, 10, 3.2, 3.6, 7);
  // the pithead: a timber headframe with its winding wheel, the engine house and its chimney
  const ph = G(); ph.position.set(3, 0, 16); g.add(ph); const wood = std({ color: '#5A4630' });
  for (const [x, z] of [[-1.6, -1.2], [1.6, -1.2], [-1.2, 1.2], [1.2, 1.2]]) { const l = M(new THREE.BoxGeometry(.35, 11, .35), wood, ph, x * .8, 5.4, z * .8); l.rotation.z = -x * .04; l.rotation.x = z * .04; }
  for (let k = 1; k < 5; k++) { M(new THREE.BoxGeometry(2.8, .22, .22), wood, ph, 0, k * 2.2, -1); M(new THREE.BoxGeometry(2.8, .22, .22), wood, ph, 0, k * 2.2, 1); }
  const wheel = G(); wheel.position.set(0, 11.2, 0); ph.add(wheel); ph.userData.wheel = wheel;
  const rimG = new THREE.TorusGeometry(1.6, .12, 8, 36); M(rimG, std({ color: '#2A2A2E', metalness: .6, roughness: .4 }), wheel); for (let k = 0; k < 8; k++) { const sp = M(new THREE.BoxGeometry(.08, 3.1, .08), std({ color: '#2A2A2E', metalness: .6 }), wheel); sp.rotation.z = k / 8 * Math.PI; }
  wheel.rotation.y = Math.PI / 2;
  house(g, 10, 17, Math.PI, { w: 7, h: 7, d: 6, cols: 3, rows: 2, wall: '#8A4A3A', brick: 1, roofC: '#2E2E34', chims: [], seed: 60 });
  const chim = M(new THREE.CylinderGeometry(.7, 1.0, 16, 12), std({ color: '#7A3E30' }), g, 14.5, 8, 19);
  // brick terraces climbing the bank
  for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) house(g, -30 + i * 6.5 + r * 2, 26 + r * 9, Math.PI, { w: 6.2, h: 5.5 + (i % 2) * .6, d: 5.5, cols: 3, rows: 2, wall: ['#7A3E30', '#8A4A3A', '#6E3A2C'][(i + r) % 3], brick: 1, roofC: '#2A2A30', chimC: '#5A2E24', seed: 70 + r * 9 + i });
  // smoke from the chimneys
  const smoke = []; const sm = new THREE.MeshStandardMaterial({ color: '#6A6A70', transparent: true, opacity: .5, roughness: 1 });
  for (const [x, y, z] of [[14.5, 16.2, 19], [-20, 9, 26], [2, 9.5, 35], [20, 10, 44]]) for (let k = 0; k < 7; k++) { const s = M(new THREE.SphereGeometry(.9, 10, 8), sm.clone(), g); s.castShadow = false; s.userData.o = [x, y, z, k]; smoke.push(s); }
  g.userData.smoke = smoke; g.userData.pithead = ph;
  hills(g, ['#5A6A4A', '#4E5E42', '#66745A'], 12, 110, 200, 3, -1);
  return g;
}
export function animSmoke(set, t) { (set.userData.smoke ?? []).forEach(s => { const [x, y, z, k] = s.userData.o, u = (t * .18 + k / 7) % 1; s.position.set(x + u * 5 + Math.sin(t + k) * .3, y + u * 6, z - u * 2); s.scale.setScalar(.6 + u * 2.4); s.material.opacity = .55 * (1 - u); }); }

// ---------------- Dexter's study ----------------
export function study() {
  const g = G();
  const panel = ctex(512, 512, (c, w, h) => { c.fillStyle = '#6A4428'; c.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 128) { c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x, 0, 6, h); c.strokeStyle = 'rgba(255,220,170,.18)'; c.lineWidth = 6; c.strokeRect(x + 24, 40, 80, 180); c.strokeRect(x + 24, 280, 80, 190); } }, [4, 1]);
  const wallM = std({ map: panel }), floorM = std({ map: planks('#7A4E2E', [4, 4]) });
  M(new THREE.PlaneGeometry(10, 8), floorM, g, 0, 0, 0).rotation.x = -Math.PI / 2;
  M(new THREE.PlaneGeometry(10, 4), wallM, g, 0, 2, -3);
  const lw = M(new THREE.PlaneGeometry(8, 4), wallM, g, -4, 2, 1); lw.rotation.y = Math.PI / 2;
  const rw = M(new THREE.PlaneGeometry(8, 4), wallM, g, 4, 2, 1); rw.rotation.y = -Math.PI / 2;
  M(new THREE.PlaneGeometry(10, 8), std({ color: '#3A2618' }), g, 0, 4, 0).rotation.x = Math.PI / 2;
  // the window (daylight) with curtains
  M(new THREE.PlaneGeometry(1.4, 1.8), new THREE.MeshBasicMaterial({ color: '#D8ECFF' }), g, 1.9, 2.1, -2.98);
  for (const k of [-1, 0, 1]) M(new THREE.BoxGeometry(.06, 1.8, .06), std({ color: '#F4F1EA' }), g, 1.9 + k * .45, 2.1, -2.95); M(new THREE.BoxGeometry(1.4, .06, .06), std({ color: '#F4F1EA' }), g, 1.9, 2.1, -2.95);
  for (const s of [-1, 1]) M(new THREE.BoxGeometry(.5, 2.3, .1), std({ color: '#8A2A3A' }), g, 1.9 + s * .95, 2.05, -2.9);
  // a bookcase
  const bc = G(); bc.position.set(-2.2, 0, -2.75); g.add(bc); M(new THREE.BoxGeometry(2.4, 3.2, .45), std({ color: '#4A2E1A' }), bc, 0, 1.6, 0);
  const R = rng(17), bk = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), std({ color: '#FFFFFF' }), 120); let i = 0;
  for (let sh = 0; sh < 5; sh++) { let x = -1.1; while (x < 1.05 && i < 120) { const w = .05 + R() * .05, h = .38 + R() * .14; put(bk, i, x + w / 2, .28 + sh * .6 + h / 2, .08, 0, w, h, .3); bk.setColorAt(i, new THREE.Color(['#8A2A2A', '#2A4A6A', '#3A5A3A', '#6A4A2A', '#C8A050'][(R() * 5) | 0])); x += w + .006; i++; }
    M(new THREE.BoxGeometry(2.3, .04, .4), std({ color: '#3A2414' }), bc, 0, .26 + sh * .6, .02); }
  bk.count = i; bk.instanceColor.needsUpdate = true; bc.add(bk);
  // a framed portrait of the Lord himself
  const pt = ctex(256, 320, (c, w, h) => { c.fillStyle = '#2A2018'; c.fillRect(0, 0, w, h); c.fillStyle = '#C8B89A'; c.beginPath(); c.arc(w / 2, h * .42, 70, 0, 7); c.fill(); c.fillStyle = '#1E1A22'; c.beginPath(); c.moveTo(40, 110); c.lineTo(w / 2, 40); c.lineTo(w - 40, 110); c.closePath(); c.fill(); c.fillStyle = '#6A2A5A'; c.fillRect(50, 220, w - 100, 100); c.fillStyle = '#E8C060'; c.font = '700 24px Fredoka'; c.textAlign = 'center'; c.fillText('LORD DEXTER', w / 2, 300); });
  M(new THREE.BoxGeometry(1.0, 1.25, .06), std({ color: '#C8962E', metalness: .6, roughness: .35 }), g, -.1, 2.6, -2.96); M(new THREE.PlaneGeometry(.86, 1.1), std({ map: pt }), g, -.1, 2.6, -2.92);
  // the desk
  const desk = G(); desk.position.set(0, 0, -.6); g.add(desk); g.userData.desk = desk;
  M(new THREE.BoxGeometry(2.0, .08, 1.0), std({ color: '#7A4A26', roughness: .45 }), desk, 0, .8, 0);
  for (const x of [-.8, .8]) M(new THREE.BoxGeometry(.36, .76, .9), std({ color: '#5E381C', roughness: .6 }), desk, x, .38, 0);
  const cand = G(); cand.position.set(-.7, .84, -.25); desk.add(cand); M(new THREE.CylinderGeometry(.09, .11, .03, 14), std({ color: '#C8962E', metalness: .6, roughness: .3 }), cand, 0, 0, 0); M(new THREE.CylinderGeometry(.035, .035, .26, 12), std({ color: '#F4ECD8' }), cand, 0, .14, 0);
  const flame = M(new THREE.SphereGeometry(.03, 10, 8), new THREE.MeshBasicMaterial({ color: '#FFD070' }), cand, 0, .3, 0); flame.scale.y = 1.8; g.userData.flame = flame;
  M(new THREE.CylinderGeometry(.06, .07, .08, 14), std({ color: '#1A1A22', roughness: .2 }), desk, .7, .88, -.25);
  const chair = G(); chair.position.set(0, 0, -1.25); g.add(chair); g.userData.chair = chair; M(new THREE.BoxGeometry(.7, .08, .6), std({ color: '#5A2A2A' }), chair, 0, .48, 0); M(new THREE.BoxGeometry(.7, 1.0, .08), std({ color: '#5A2A2A' }), chair, 0, 1.0, -.28);
  return g;
}

// ---------------- the voyage map ----------------
// lon -100..12, lat 0..64 → a 7 x 4 m chart on a table (x east, -z north)
export const MAPW = 7, MAPH = 4;
export const lonlat = (lon, lat) => V((lon + 100) / 112 * MAPW - MAPW / 2, 0, -((lat / 64) * MAPH - MAPH / 2));
export function chart() {
  const g = G(), Wc = 4096, Hc = Math.round(4096 * MAPH / MAPW);
  const X = lon => (lon + 100) / 112 * Wc, Y = lat => Hc - lat / 64 * Hc;
  const tex = ctex(Wc, Hc, (c) => {
    const R = rng(3); const gr = c.createRadialGradient(Wc / 2, Hc / 2, 200, Wc / 2, Hc / 2, Wc * .62); gr.addColorStop(0, '#9CC8D0'); gr.addColorStop(1, '#6E9CA8'); c.fillStyle = gr; c.fillRect(0, 0, Wc, Hc);
    for (let i = 0; i < 4000; i++) { c.fillStyle = `rgba(255,255,255,${.04 * R()})`; c.fillRect(R() * Wc, R() * Hc, 6, 2); }
    c.strokeStyle = 'rgba(40,70,90,.25)'; c.lineWidth = 3; for (let lon = -100; lon <= 10; lon += 10) { c.beginPath(); c.moveTo(X(lon), 0); c.lineTo(X(lon), Hc); c.stroke(); } for (let lat = 0; lat <= 60; lat += 10) { c.beginPath(); c.moveTo(0, Y(lat)); c.lineTo(Wc, Y(lat)); c.stroke(); }
    const land = pts => { c.beginPath(); pts.forEach(([lo, la], i) => c[i ? 'lineTo' : 'moveTo'](X(lo), Y(la))); c.closePath(); c.fillStyle = '#E6CF98'; c.fill(); c.lineWidth = 10; c.strokeStyle = '#7A5A30'; c.stroke(); c.lineWidth = 26; c.strokeStyle = 'rgba(255,255,255,.18)'; c.stroke(); };
    land([[-100, 64], [-78, 64], [-65, 60], [-60, 55], [-56, 52], [-60, 47], [-66, 45], [-70, 43.5], [-70.8, 42.8], [-70.2, 41.7], [-74, 40.5], [-75.5, 38], [-76, 35], [-78, 33.8], [-81, 31.5], [-80, 27], [-80.3, 25.2], [-81.5, 25.5], [-82.7, 28], [-84, 30], [-88, 30.3], [-90, 29], [-94, 29.5], [-97, 27], [-97.5, 22], [-95, 18.5], [-91, 19], [-87, 21.5], [-87.5, 16], [-84, 15], [-83.5, 11], [-80, 9], [-77, 8], [-75, 10.5], [-72, 11.8], [-68, 10.5], [-64, 10.5], [-61.5, 10.5], [-60, 8], [-55, 5], [-50, 3], [-48, 0], [-100, 0]]);
    land([[-85, 21.8], [-82, 23], [-77, 22.5], [-74.2, 20.2], [-77.5, 19.9], [-80, 21.5], [-84, 21.9]]);
    land([[-74.4, 19.8], [-71, 19.9], [-68.4, 18.6], [-71.5, 17.8], [-74.4, 18.4]]);
    land([[-78.3, 18.4], [-76.2, 18], [-77, 17.6], [-78.3, 18.1]]);
    land([[-67.2, 18.5], [-65.6, 18.4], [-65.7, 17.9], [-67.2, 18]]);
    for (const [lo, la] of [[-61.6, 16.2], [-61.3, 15.4], [-61, 14.6], [-61, 13.9], [-61.2, 13.2], [-61.7, 12.1], [-59.6, 13.1], [-62.8, 17.3], [-63, 18.1], [-77.5, 24.5], [-76, 23.8], [-74.3, 22.8], [-72.8, 21.8]]) { c.beginPath(); c.arc(X(lo), Y(la), 16, 0, 7); c.fillStyle = '#E6CF98'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#7A5A30'; c.stroke(); }
    land([[-5.7, 50], [1.4, 51.2], [1.7, 52.7], [.2, 53.5], [-1.5, 55], [-2, 56], [-3, 58.6], [-5, 58.6], [-6.2, 56.5], [-4.8, 55], [-3, 54], [-4.6, 53.3], [-4.7, 51.7]]);
    land([[-10, 51.5], [-6, 52], [-6, 54], [-8, 55.2], [-10, 54.2]]);
    land([[12, 64], [8, 58], [8.3, 56.8], [8.6, 53.9], [5, 53.4], [4, 51.5], [1.5, 50.9], [-1.6, 49.6], [-4.5, 48.4], [-1, 46], [-1.8, 43.4], [-9, 43], [-9, 37], [-6, 36], [-2, 36.7], [.5, 38.8], [3, 42], [12, 44]]);
    land([[-17, 21], [-16, 15], [-12, 10], [-8, 5], [5, 5], [10, 4], [12, 0], [12, 34], [-10, 34], [-14, 27]]);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const lab = (t, lo, la, s, col = '#4A3418', rot = 0) => { c.save(); c.translate(X(lo), Y(la)); c.rotate(rot); c.font = `700 ${s}px Fredoka`; c.fillStyle = col; c.fillText(t, 0, 0); c.restore(); };
    lab('ATLANTIC OCEAN', -42, 33, 110, 'rgba(30,60,80,.55)', -.12); lab('NEW ENGLAND', -80, 46, 70); lab('THE CARIBBEAN', -72, 14.6, 64, '#1E4A5A'); lab('ENGLAND', -3, 57.4, 56); lab('AMERICA', -88, 38, 120, 'rgba(74,52,24,.7)');
    for (const [lo, la, t, dx] of [[-70.9, 42.8, 'NEWBURYPORT', 1], [-1.6, 55, 'NEWCASTLE', -1]]) { c.beginPath(); c.arc(X(lo), Y(la), 22, 0, 7); c.fillStyle = '#C8202A'; c.fill(); c.lineWidth = 8; c.strokeStyle = '#FFFFFF'; c.stroke(); c.font = '700 54px Fredoka'; c.fillStyle = '#2A1A10'; c.textAlign = dx > 0 ? 'left' : 'right'; c.fillText(t, X(lo) + dx * 40, Y(la) - 6); c.textAlign = 'center'; }
    // compass rose + a sea monster for flavour
    c.save(); c.translate(X(-30), Y(12)); c.strokeStyle = '#7A5A30'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 150, 0, 7); c.stroke(); for (let k = 0; k < 8; k++) { c.rotate(Math.PI / 4); c.fillStyle = k % 2 ? '#E6CF98' : '#C8202A'; c.beginPath(); c.moveTo(0, -150); c.lineTo(22, 0); c.lineTo(-22, 0); c.closePath(); c.fill(); } c.restore();
    c.save(); c.translate(X(-50), Y(48)); c.fillStyle = '#4A8A6A'; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(k * 70, 0, 34, Math.PI, 0); c.fill(); } c.restore();
  });
  const t = new THREE.CanvasTexture(tex.image); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  M(new THREE.BoxGeometry(MAPW + 1.2, .3, MAPH + 1.2), std({ map: planks('#6A3E20', [3, 1]) }), g, 0, -.16, 0);
  const pl = M(new THREE.PlaneGeometry(MAPW, MAPH), std({ map: t, roughness: .9 }), g, 0, .002, 0); pl.rotation.x = -Math.PI / 2;
  // dashes for the route (shown one by one) + a toy ship
  const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(.05, .01, .016), std({ color: '#C8202A' }), 200); dash.count = 0; dash.frustumCulled = false; g.add(dash); g.userData.dash = dash;
  const toy = ship({}); toy.scale.setScalar(.022); g.add(toy); g.userData.toy = toy;
  // the brass dividers and a candle at the edge for scale
  return g;
}
// lay the route along a curve up to fraction k
export function routeTo(set, curve, k) { const d = set.userData.dash; const n = Math.floor(k * 60); for (let i = 0; i < n; i++) { const u = i / 60, p = curve.getPointAt(u), q = curve.getPointAt(Math.min(1, u + .005)); put(d, i, p.x, .006, p.z, Math.atan2(-(q.z - p.z), q.x - p.x)); } d.count = n; d.instanceMatrix.needsUpdate = true; }
export { ctex, std, put, M, V, planks, cobbles, grimeTex, house, hills, pines, rng };
