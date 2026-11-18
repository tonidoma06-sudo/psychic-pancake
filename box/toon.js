// toon.js · style kit v4.5: outlined toon characters with big hand-drawn 2D faces (+ sweat drops, lashes, badges, lanyards, belts).
// Cel-shaded bean bodies (MeshToonMaterial + a 3-step ramp), black ink outlines (inverted hull), thin black stick limbs,
// a white ball head with a face painted on a canvas decal: expressions snap on story beats, the mouth flaps while talking.
import * as THREE from 'three';

// ---------------- cel ramp + ink ----------------
function rampTex(stops) {
  const d = new Uint8Array(stops.length * 4); stops.forEach((v, i) => { const b = Math.round(v * 255); d.set([b, b, b, 255], i * 4); });
  const t = new THREE.DataTexture(d, stops.length, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
}
export const RAMP = rampTex([.5, .78, 1]), RAMP_SOFT = rampTex([.74, .9, 1]);
const tcache = new Map();
// 2D characters in a 3D world: while a character is built, its materials are flat and unlit (pure fills, like a drawing),
// tinted by one shared colour per shot (CHAR_TINT) so they still sit in the scene's mood; thick ink outlines.
export const CHAR_TINT = { value: new THREE.Color(1, 1, 1) };
let FLAT = 0;
function flatMat(o) {
  const m = new THREE.MeshBasicMaterial({ color: o.color ?? '#FFFFFF', map: o.map ?? null, transparent: !!o.transparent, side: o.side ?? THREE.FrontSide,
    polygonOffset: !!o.polygonOffset, polygonOffsetFactor: o.polygonOffsetFactor ?? 0, polygonOffsetUnits: o.polygonOffsetUnits ?? 0, depthWrite: o.depthWrite ?? true });
  m.onBeforeCompile = sh => { sh.uniforms.ctint = CHAR_TINT; sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'uniform vec3 ctint;\nvoid main() {').replace('#include <opaque_fragment>', 'outgoingLight *= ctint;\n#include <opaque_fragment>'); };
  m.customProgramCacheKey = () => 'flat2d'; return m;
}
export function toon(color, o = {}) {
  if (FLAT) { const k = 'F' + color + (o.map ? o.map.uuid : '') + (o.t ? 't' : ''); if (!tcache.has(k)) tcache.set(k, flatMat({ color, map: o.map, transparent: o.t })); return tcache.get(k); }
  const k = color + (o.soft ? 's' : '') + (o.map ? o.map.uuid : '') + (o.t ? 't' : '');
  if (!tcache.has(k)) tcache.set(k, new THREE.MeshToonMaterial({ color, map: o.map ?? null, gradientMap: o.soft ? RAMP_SOFT : RAMP, transparent: !!o.t }));
  return tcache.get(k);
}
export const INK = '#141016';
const inkCache = new Map();
export function inkMat(w) {
  if (!inkCache.has(w)) inkCache.set(w, new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { w: { value: w } },
    vertexShader: 'uniform float w; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * w, 1.); }',
    fragmentShader: 'void main(){ gl_FragColor = vec4(.078, .063, .086, 1.); }' }));
  return inkCache.get(w);
}
// add an ink outline to a mesh (shares its geometry; follows its transform)
export function ink(mesh, w = .009) { const o = new THREE.Mesh(mesh.geometry, inkMat(w)); o.castShadow = false; o.receiveShadow = false; o.userData.ink = 1; mesh.add(o); return mesh; }
export function TM(geo, m, parent, x = 0, y = 0, z = 0, w = .009) {
  const o = new THREE.Mesh(geo, typeof m === 'string' ? toon(m) : m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true;
  if (w) ink(o, w); if (parent) parent.add(o); return o;
}
export const G = () => new THREE.Group();
const D2R = Math.PI / 180;

// ---------------- the face: a canvas decal on the front of the head ----------------
// Canvas 1024², centre = front of the head on the equator. ~394 px per radian across, ~427 down.
export const EXPR = {
  happy:   { eyes: 'oval', brows: null, mouth: 'grin' },
  laugh:   { eyes: 'squint', brows: null, mouth: 'laugh' },
  smile:   { eyes: 'oval', brows: null, mouth: 'smile' },
  deadpan: { eyes: 'lid', brows: 'flat', mouth: 'flat' },
  smug:    { eyes: 'lid', brows: 'raise', mouth: 'smirk' },
  evil:    { eyes: 'evil', brows: 'angry', mouth: 'evil' },
  shock:   { eyes: 'wide', brows: 'up', mouth: 'o' },
  worried: { eyes: 'oval', brows: 'up', mouth: 'frown' },
  angry:   { eyes: 'oval', brows: 'angry', mouth: 'teeth' },
  calm:    { eyes: 'oval', brows: null, mouth: 'smile' },
  proud:   { eyes: 'closed', brows: null, mouth: 'grin' },
};
function drawFace(g, f) {
  const S = 1024, cx = 512, EY = 400, EX = 168, MY = 600;
  g.clearRect(0, 0, S, S); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK; g.fillStyle = INK;
  const e = EXPR[f.ex] ?? EXPR.happy, lx = (f.look?.[0] ?? 0) * 16, ly = (f.look?.[1] ?? 0) * 12, skin = f.skin ?? '#FFFFFF';
  if (f.blush) { g.fillStyle = 'rgba(255,120,120,.28)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 280, 545, 66, 34, 0, 0, 7); g.fill(); } g.fillStyle = INK; }
  // eyes
  const blink = f.blink ?? 0;
  for (const s of [-1, 1]) {
    const x = cx + s * EX + lx, y = EY + ly;
    const kind = (blink > .5 && e.eyes !== 'squint') || (f.wink && s > 0) ? 'closed' : e.eyes;
    g.save();
    if (kind === 'oval') { g.beginPath(); g.ellipse(x, y, 40, 58, 0, 0, 7); g.fill(); }
    else if (kind === 'closed') { g.lineWidth = 22; g.beginPath(); g.arc(x, y + 12, 42, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    else if (kind === 'squint') { g.lineWidth = 24; g.beginPath(); g.moveTo(x - s * 44, y - 40); g.lineTo(x + s * 36, y); g.lineTo(x - s * 44, y + 40); g.stroke(); }
    else if (kind === 'lid') { // half-lidded: the lower half of an oval eye under a straight lid line
      g.beginPath(); g.rect(x - 70, y - 2, 140, 100); g.clip(); g.beginPath(); g.ellipse(x, y, 42, 54, 0, 0, 7); g.fill(); g.restore(); g.save();
      g.lineWidth = 22; g.beginPath(); g.moveTo(x - 62, y - 2 + s * 3); g.lineTo(x + 62, y - 2 - s * 3); g.stroke();
    }
    else if (kind === 'evil') { // narrowed, slanted down towards the nose
      g.beginPath(); g.moveTo(x - 54, y - 6 + s * 22); g.lineTo(x + 54, y - 6 - s * 22); g.lineTo(x + 40, y + 40); g.quadraticCurveTo(x, y + 60, x - 40, y + 40); g.closePath(); g.fill();
    }
    else if (kind === 'wide') { g.fillStyle = '#FFFFFF'; g.lineWidth = 18; g.beginPath(); g.ellipse(x, y, 62, 70, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x + lx * .5, y + 6 + ly * .5, 20, 0, 7); g.fill(); }
    g.restore();
  }
  if (f.lashes) { g.lineWidth = 12; for (const s of [-1, 1]) { const x = cx + s * EX + lx; for (const k of [0, 1]) { g.beginPath(); g.moveTo(x + s * (24 + k * 14), EY + ly - 50 + k * 12); g.lineTo(x + s * (46 + k * 16), EY + ly - 72 + k * 14); g.stroke(); } } }
  if (f.sweat) {   // a big blue sweat drop at the temple
    g.save(); g.translate(cx + 300, EY - 150); g.fillStyle = '#7FD0FF'; g.strokeStyle = INK; g.lineWidth = 12;
    g.beginPath(); g.moveTo(0, -70); g.bezierCurveTo(30, -20, 48, 10, 48, 34); g.arc(0, 34, 48, 0, Math.PI); g.bezierCurveTo(-48, 10, -30, -20, 0, -70); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(-16, 30, 10, 18, -.3, 0, 7); g.fill(); g.restore(); }
  if (f.glasses === 'round') { g.lineWidth = 16; for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * EX + lx * .3, EY + 4, 74, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(cx - EX + 74, EY - 6); g.quadraticCurveTo(cx, EY - 30, cx + EX - 74, EY - 6); g.stroke(); }
  if (f.glasses === 'shades') { g.fillStyle = '#16131A'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 40, EY - 44); g.lineTo(cx + s * 250, EY - 52); g.quadraticCurveTo(cx + s * 240, EY + 70, cx + s * 150, EY + 66); g.quadraticCurveTo(cx + s * 50, EY + 60, cx + s * 40, EY - 44); g.fill(); } g.fillRect(cx - 50, EY - 50, 100, 18); g.fillStyle = 'rgba(255,255,255,.35)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 190, EY - 14, 22, 9, -.4, 0, 7); g.fill(); } g.fillStyle = INK; }
  // brows
  if (e.brows) {
    g.lineWidth = 26;
    for (const s of [-1, 1]) {
      const x = cx + s * EX + lx * .5, y = EY - 104;
      let a = 0, dy = 0;
      if (e.brows === 'angry') a = -s * .42, dy = 8; else if (e.brows === 'up') a = s * .35, dy = -10; else if (e.brows === 'raise') { a = s > 0 ? -.12 : 0; dy = s > 0 ? -26 : 4; }
      g.save(); g.translate(x, y + dy); g.rotate(a); g.beginPath(); g.moveTo(-54, 0); g.lineTo(54, 0); g.stroke(); g.restore();
    }
  }
  // mouth
  const talk = f.talk ?? 0; let m = e.mouth;
  if (talk > .05 && (m === 'smile' || m === 'flat' || m === 'smirk' || m === 'frown')) m = 'talk';
  const open = m === 'talk' ? talk : (m === 'grin' || m === 'laugh' || m === 'evil' || m === 'o' || m === 'teeth') ? 1 - .35 * (1 - Math.min(1, talk * 1.6 + (talk > .05 ? 0 : 1))) : 0;
  g.lineWidth = 22;
  const grin = (w, top, h, curl, evil) => {
    const path = () => { g.beginPath(); g.moveTo(cx - w, top - curl); g.quadraticCurveTo(cx, top + 10, cx + w, top - curl);
      g.bezierCurveTo(cx + w * .95, top + h * 1.15, cx - w * .95, top + h * 1.15, cx - w, top - curl); g.closePath(); };
    path(); g.fillStyle = '#3A0E14'; g.fill();
    g.save(); g.clip();
    const tb = evil ? h * .62 : h * .34;
    g.fillStyle = '#FFFFFF'; g.fillRect(cx - w - 10, top - curl - 30, 2 * w + 20, tb + 30 + curl);
    if (!evil) { g.fillStyle = '#E8566A'; g.beginPath(); g.ellipse(cx, top + h * .98, w * .5, h * .34, 0, 0, 7); g.fill(); }
    g.strokeStyle = INK; g.lineWidth = 13;
    if (evil) { g.beginPath(); g.moveTo(cx - w, top + 4); const n = 8; for (let i = 0; i <= n; i++) { const xx = cx - w + (2 * w * i) / n; g.lineTo(xx, top + (i % 2 ? tb : 2)); } g.stroke(); }
    else { g.beginPath(); for (let i = -2; i <= 2; i++) { const xx = cx + i * w / 3.2; g.moveTo(xx, top - 12); g.lineTo(xx, top + tb); } g.moveTo(cx - w, top + tb); g.lineTo(cx + w, top + tb); g.stroke(); }
    g.restore(); path(); g.lineWidth = 22; g.strokeStyle = INK; g.stroke();
  };
  if (m === 'grin') grin(215, MY - 40, 120 + 50 * open, 20, false);
  else if (m === 'laugh') grin(230, MY - 50, 170 + 40 * open, 30, false);
  else if (m === 'evil') grin(225, MY - 30, 92 + 18 * open, 48, true);
  else if (m === 'teeth') { g.beginPath(); g.roundRect(cx - 150, MY - 42, 300, 88, 36); g.fillStyle = '#FFFFFF'; g.fill(); g.stroke(); g.lineWidth = 11; g.beginPath(); g.moveTo(cx - 144, MY + 1); g.lineTo(cx + 144, MY + 1); for (let i = -2; i <= 2; i++) { g.moveTo(cx + i * 54, MY - 40); g.lineTo(cx + i * 54, MY + 42); } g.stroke(); }
  else if (m === 'smile') { g.beginPath(); g.arc(cx, MY - 170, 210, Math.PI * .3, Math.PI * .7); g.stroke(); }
  else if (m === 'flat') { g.beginPath(); g.moveTo(cx - 84, MY); g.lineTo(cx + 84, MY); g.stroke(); }
  else if (m === 'smirk') { g.beginPath(); g.moveTo(cx - 100, MY + 10); g.quadraticCurveTo(cx + 30, MY + 26, cx + 120, MY - 28); g.stroke(); }
  else if (m === 'frown') { g.beginPath(); g.arc(cx, MY + 135, 140, Math.PI * 1.3, Math.PI * 1.7); g.stroke(); }
  else if (m === 'o') { g.beginPath(); g.ellipse(cx, MY + 8, 50, 48 + 28 * open, 0, 0, 7); g.fillStyle = '#3A0E14'; g.fill(); g.stroke(); }
  else if (m === 'talk') { const h = 14 + 84 * talk; g.beginPath(); g.ellipse(cx, MY + 4, 88 + 14 * talk, h * .5, 0, 0, 7); g.fillStyle = '#3A0E14'; g.fill(); g.stroke(); }
  if (f.mustache) {   // a big bushy moustache over the top lip
    const my = MY - 62 - (m === 'laugh' || m === 'grin' ? 18 : 0);
    g.fillStyle = f.mustache; g.strokeStyle = INK; g.lineWidth = 14;
    g.beginPath(); g.moveTo(cx, my - 26);
    g.bezierCurveTo(cx + 70, my - 64, cx + 190, my - 40, cx + 236, my + 26); g.bezierCurveTo(cx + 180, my + 6, cx + 150, my + 40, cx + 90, my + 30); g.bezierCurveTo(cx + 50, my + 26, cx + 20, my + 16, cx, my + 4);
    g.bezierCurveTo(cx - 20, my + 16, cx - 50, my + 26, cx - 90, my + 30); g.bezierCurveTo(cx - 150, my + 40, cx - 180, my + 6, cx - 236, my + 26); g.bezierCurveTo(cx - 190, my - 40, cx - 70, my - 64, cx, my - 26);
    g.closePath(); g.fill(); g.stroke();
  }
}

// ---------------- textures for the bean body (u around, front = .5; v up) ----------------
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function fabric(g, w, h, y0, y1, col, noise = .06, R = Math.random) { g.fillStyle = col; g.fillRect(0, y0, w, y1 - y0); for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '0,0,0'},${noise * R()})`; g.fillRect(R() * w, y0 + R() * (y1 - y0), 2, 2); } }
function stitch(g, path, col = 'rgba(255,240,200,.85)', lw = 3) { g.save(); g.setLineDash([10, 8]); g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); path(g); g.stroke(); g.restore(); }
const seeded = s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
export function outfitTex(L) {
  const R = seeded(L.seed ?? 7);
  return canvasTex(1024, 512, (g, w, h) => {
    const cx = w / 2, waist = h * (L.waist ?? .66);   // canvas y: 0 = top of the body; below the waist: trousers
    if (L.outfit === 'robe') {
      fabric(g, w, h, 0, h, L.top ?? '#1A1820', .05, R);
      g.fillStyle = '#F4F1EA'; g.beginPath(); g.moveTo(cx - 60, 0); g.lineTo(cx, 120); g.lineTo(cx + 60, 0); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 5; for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(cx + i * 70, 140); g.lineTo(cx + i * 80, h); g.stroke(); }
      return;
    }
    if (L.outfit === 'army') {   // a 1930s khaki service-dress tunic: patch pockets, brass buttons, a leather belt (+ a Sam Browne strap for officers)
      fabric(g, w, h, 0, waist, L.top ?? '#9A8A5A', .07, R); fabric(g, w, h, waist, h, L.pants ?? '#86764C', .08, R);
      stitch(g, c => { c.moveTo(cx - 90, waist + 30); c.lineTo(cx - 90, h); c.moveTo(cx + 90, waist + 30); c.lineTo(cx + 90, h); }, 'rgba(0,0,0,.25)');
      g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(cx - 7, 0, 14, waist);
      const btn = (x, y, r = 10) => { g.fillStyle = '#E2B848'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = 'rgba(60,40,10,.7)'; g.lineWidth = 3; g.stroke(); };
      for (const s of [-1, 1]) {
        g.fillStyle = 'rgba(0,0,0,.1)'; g.beginPath(); g.roundRect(cx + s * 118 - 58, 64, 116, 104, 10); g.fill();
        g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.roundRect(cx + s * 118 - 62, 58, 124, 34, 8); g.fill(); btn(cx + s * 118, 82, 8);
        g.fillStyle = 'rgba(0,0,0,.1)'; g.beginPath(); g.roundRect(cx + s * 130 - 70, waist - 150, 140, 118, 10); g.fill();
        g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.roundRect(cx + s * 130 - 74, waist - 156, 148, 36, 8); g.fill(); btn(cx + s * 130, waist - 136, 8);
      }
      for (const y of [40, 120, 200, 280]) if (y < waist - 40) btn(cx, y);
      if (L.sam) { g.strokeStyle = L.belt ?? '#6B4426'; g.lineWidth = 30; g.beginPath(); g.moveTo(cx + 150, -10); g.lineTo(cx - 120, waist - 10); g.stroke(); }
      g.fillStyle = L.belt ?? '#6B4426'; g.fillRect(0, waist - 26, w, 36); g.fillStyle = '#E2B848'; g.fillRect(cx - 24, waist - 30, 48, 44); g.fillStyle = L.belt ?? '#6B4426'; g.fillRect(cx - 12, waist - 18, 24, 20);
      if (L.ribbons) { const cs = ['#C8283A', '#1C4E9A', '#F2C230', '#2E7A4A']; cs.forEach((c, i) => { g.fillStyle = c; g.fillRect(cx - 180 + (i % 2) * 34, 24 + Math.floor(i / 2) * 16, 32, 14); }); }
      if (L.patches) {   // 29 years in the jungle: faded, mended with scraps, torn at the hem
        g.fillStyle = 'rgba(255,240,200,.12)'; g.fillRect(0, 0, w, h);
        for (const [x, y, pw, ph, col] of [[cx - 210, 150, 90, 80, '#6E6A44'], [cx + 160, 210, 80, 96, '#9A8A60'], [cx - 60, waist + 70, 110, 70, '#5E5A3A'], [cx + 250, waist + 120, 80, 80, '#8A7A50'], [cx - 300, waist + 150, 90, 70, '#7A6E46']]) {
          g.save(); g.translate(x, y); g.rotate((R() - .5) * .3); g.fillStyle = col; g.fillRect(-pw / 2, -ph / 2, pw, ph);
          g.setLineDash([9, 7]); g.strokeStyle = 'rgba(30,25,15,.75)'; g.lineWidth = 4; g.strokeRect(-pw / 2 + 5, -ph / 2 + 5, pw - 10, ph - 10); g.restore(); }
        g.setLineDash([]); g.strokeStyle = 'rgba(30,25,15,.6)'; g.lineWidth = 5;
        for (let i = 0; i < 7; i++) { const x = R() * w, y = 40 + R() * (h - 80); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 18, y + 10); g.lineTo(x + 30, y - 4); g.stroke(); }
      }
      return;
    }
    if (L.outfit === 'overalls') {   // a plaid work shirt under denim overalls
      fabric(g, w, h, 0, h, L.top ?? '#C8283A', .06, R);
      g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 10; for (let x = 0; x < w; x += 46) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 46) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 4; for (let x = 23; x < w; x += 46) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      const den = L.pants ?? '#3C5E9A'; fabric(g, w, h, waist - 30, h, den, .1, R); fabric(g, w, h, 150, waist, den, .1, R);
      g.clearRect(0, 150, cx - 140, waist - 180); g.clearRect(cx + 140, 150, w - cx - 140, waist - 180);
      fabric(g, w, h, 150, waist - 30, L.top ?? '#C8283A', .06, R); g.fillStyle = den; g.fillRect(cx - 140, 150, 280, waist - 120);
      g.fillStyle = den; for (const s of [-1, 1]) { g.save(); g.translate(cx + s * 120, 160); g.rotate(s * .12); g.fillRect(-18, -170, 36, 175); g.restore(); }
      g.fillStyle = '#E2B848'; for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * 118, 172, 13, 0, 7); g.fill(); }
      stitch(g, c => { c.roundRect(cx - 132, 158, 264, waist - 140, 16); }, 'rgba(255,220,150,.8)');
      g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.roundRect(cx - 70, 200, 140, 90, 10); g.fill(); stitch(g, c => c.roundRect(cx - 64, 206, 128, 78, 8), 'rgba(255,220,150,.8)');
      return;
    }
    if (L.outfit === 'suit') {
      fabric(g, w, h, 0, h, L.top, .05, R);
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, waist, w, h - waist);   // trousers a touch darker
      g.fillStyle = '#F4F1EA'; g.beginPath(); g.moveTo(cx - 70, 0); g.lineTo(cx, 220); g.lineTo(cx + 70, 0); g.fill();   // shirt
      g.fillStyle = L.tie ?? '#1C1C22'; g.beginPath(); g.moveTo(cx - 14, 20); g.lineTo(cx + 14, 20); g.lineTo(cx + 20, 170); g.lineTo(cx, 200); g.lineTo(cx - 20, 170); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx - 70, 0); g.lineTo(cx - 10, 250); g.lineTo(cx - 10, waist); g.moveTo(cx + 70, 0); g.lineTo(cx + 10, 250); g.stroke();
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.moveTo(cx - 70, 0); g.lineTo(cx - 120, 0); g.lineTo(cx - 40, 190); g.fill(); g.beginPath(); g.moveTo(cx + 70, 0); g.lineTo(cx + 120, 0); g.lineTo(cx + 40, 190); g.fill();   // lapels
      g.fillStyle = '#E8D27A'; for (const y of [250, 300]) { g.beginPath(); g.arc(cx + 22, y, 9, 0, 7); g.fill(); }
      if (L.medals) {   // ribbon bars and two medals on the left breast (and gold buttons all the way down for a uniform)
        const rc = ['#C8283A', '#E8B030', '#2A5AC8', '#2E8A4A', '#F4F1EA', '#C8283A'];
        for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) { g.fillStyle = rc[(r * 3 + k + L.medals) % rc.length]; g.fillRect(cx + 96 + k * 32, 96 + r * 22, 30, 18); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(cx + 96 + k * 32 + 13, 96 + r * 22, 4, 18); }
        for (const [x, c] of [[cx + 112, '#E8B030'], [cx + 160, '#D8DCE0']]) { g.fillStyle = '#C8283A'; g.fillRect(x - 10, 148, 20, 26); g.fillStyle = c; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 9 : 20; i ? g.lineTo(x + Math.cos(a) * rr, 192 + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, 192 + Math.sin(a) * rr); } g.fill(); }
        if (L.uniform) { g.fillStyle = '#E8C860'; for (let y = 240; y < waist - 20; y += 52) for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * 34, y, 10, 0, 7); g.fill(); } }
      } else {
        g.fillStyle = L.pocketSq ?? '#E8566A'; g.beginPath(); g.moveTo(cx + 110, 140); g.lineTo(cx + 170, 140); g.lineTo(cx + 150, 110); g.lineTo(cx + 130, 118); g.fill();
        g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 4; g.strokeRect(cx + 100, 140, 80, 6);
      }
      g.fillStyle = '#1C1C22'; g.fillRect(0, waist - 14, w, 22);
    } else {   // 'hoodie' (default) or 'tee'
      fabric(g, w, h, 0, waist, L.top, .07, R);
      fabric(g, w, h, waist, h, L.pants ?? '#3C5E9A', .1, R);
      stitch(g, c => { c.moveTo(cx - 90, waist + 20); c.lineTo(cx - 90, h); c.moveTo(cx + 90, waist + 20); c.lineTo(cx + 90, h); });
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, waist - 10, w, 20); stitch(g, c => { c.moveTo(0, waist + 16); c.lineTo(w, waist + 16); });
      if (L.outfit !== 'tee' && L.outfit !== 'polo') {
        g.fillStyle = 'rgba(0,0,0,.16)'; g.beginPath(); g.roundRect(cx - 120, waist - 150, 240, 120, 30); g.fill();   // kangaroo pocket
        stitch(g, c => { c.roundRect(cx - 112, waist - 142, 224, 104, 24); }, 'rgba(255,255,255,.55)');
        g.strokeStyle = '#F4F1EA'; g.lineWidth = 9; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 34, 6); g.lineTo(cx + s * 40, 150); g.stroke(); g.fillStyle = '#F4F1EA'; g.beginPath(); g.arc(cx + s * 40, 156, 9, 0, 7); g.fill(); }
        g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, waist - 46, w, 14);   // rib band
      }
      if (L.outfit === 'polo') { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(cx - 16, 0, 32, 150); g.fillStyle = '#F4F1EA'; for (const y of [40, 95]) { g.beginPath(); g.arc(cx, y, 9, 0, 7); g.fill(); } }
      if (L.apron) { g.fillStyle = L.apron; g.beginPath(); g.roundRect(cx - 150, 70, 300, h - 70, 24); g.fill(); stitch(g, c => c.roundRect(cx - 140, 80, 280, h - 90, 18), 'rgba(255,255,255,.6)'); g.fillStyle = L.apron; g.fillRect(cx - 170, 0, 26, 90); g.fillRect(cx + 144, 0, 26, 90);
        g.fillStyle = '#FFFFFF'; g.font = '900 54px Montserrat'; g.textAlign = 'center'; (L.apronText ?? 'FOOD BANK').split('\n').forEach((ln, i) => g.fillText(ln, cx, 190 + i * 60)); }
      if (L.tag) { g.fillStyle = '#F4F1EA'; g.fillRect(cx - 190, 120, 110, 54); g.strokeStyle = '#1C1C22'; g.lineWidth = 3; g.strokeRect(cx - 190, 120, 110, 54); g.fillStyle = '#1C1C22'; g.font = '900 36px Montserrat'; g.textAlign = 'center'; g.fillText(L.tag, cx - 135, 160); }
      if (L.logo) { g.fillStyle = L.logoCol ?? '#FFD23F'; g.font = '800 64px Montserrat'; g.textAlign = 'center'; g.fillText(L.logo, cx + 120, 150); }
      if (L.patch) { g.fillStyle = L.patch; g.fillRect(cx - 160, waist + 70, 60, 54); stitch(g, c => c.rect(cx - 156, waist + 74, 52, 46), '#FFFFFF'); }
    }
  });
}

// ---------------- the character ----------------
// L: { name, top, pants, outfit: 'hoodie'|'tee'|'suit', hair: 'messy'|'slick'|'beanie'|'none', hairC, hatC, skin, blush, shoe, H (scale) }
export function makeToon(L) {
  const P = G(); P.name = L.name ?? 'toon';
  const root = G(); P.add(root); root.scale.setScalar(L.H ?? 1);
  FLAT = L.flat ?? 1;
  const LEG = .5, BH = .58, HR = .21, W = L.ink ?? .013;
  const hips = G(); hips.position.y = LEG; root.add(hips);
  const spine = G(); hips.add(spine);
  // bean body: a lathe profile (bottom → top), front at u = .5
  const prof = [[0, -.02], [.1, -.015], [.16, .02], [.195, .08], [.205, .17], [.198, .27], [.182, .37], [.165, .45], [.14, .52], [.09, .565], [0, .58]].map(([r, y]) => new THREE.Vector2(r, y));
  const bodyG = new THREE.LatheGeometry(prof, 48, Math.PI, Math.PI * 2);
  const tex = outfitTex(L); tex.flipY = true;
  const body = TM(bodyG, FLAT ? flatMat({ map: tex }) : new THREE.MeshToonMaterial({ map: tex, gradientMap: RAMP }), spine, 0, 0, 0, W);
  // hood rolled at the back of the neck / or a collar
  if (L.outfit === 'hoodie' || !L.outfit) { const hg = new THREE.TorusGeometry(.115, .048, 10, 24, Math.PI * 1.3); hg.rotateZ(Math.PI * .85); hg.rotateX(Math.PI / 2); const hood = TM(hg, L.top, spine, 0, .53, -.01, W); hood.rotation.x = -.3; hood.castShadow = false; }
  if (L.outfit === 'suit') { const col = TM(new THREE.TorusGeometry(.085, .022, 8, 24), '#F4F1EA', spine, 0, .56, 0, W * .8); col.rotation.x = Math.PI / 2; }
  if (L.outfit === 'army') { const col = TM(new THREE.TorusGeometry(.088, .028, 8, 24), L.top, spine, 0, .555, 0, W * .8); col.rotation.x = Math.PI / 2 - .15; }
  if (L.outfit === 'polo') { const col = TM(new THREE.TorusGeometry(.09, .026, 8, 24), L.top, spine, 0, .555, 0, W * .8); col.rotation.x = Math.PI / 2 - .15; }
  // accessories: a belt round the waist, a metal badge on the chest, an ID card on a lanyard
  if (L.belt) { const b = TM(new THREE.TorusGeometry(.2, .018, 8, 40), L.belt, spine, 0, .2, 0, W * .6); b.rotation.x = Math.PI / 2; b.scale.set(1.0, 1.0, 1); if (L.buckle) TM(new THREE.BoxGeometry(.05, .04, .015), L.buckle, spine, 0, .2, .2, W * .5); }
  if (L.badge) { const bd = TM(new THREE.CylinderGeometry(.03, .03, .01, 6), L.badge, spine, .085, .42, .162, W * .5); bd.rotation.set(Math.PI / 2 - .3, 0, 0); }
  if (L.lanyard) { const ly = TM(new THREE.TorusGeometry(.1, .008, 6, 24, Math.PI), L.lanyard, spine, 0, .5, .09, 0); ly.rotation.set(Math.PI * .62, 0, Math.PI); TM(new THREE.BoxGeometry(.06, .08, .006), '#F4F1EA', spine, 0, .37, .19, W * .5).rotation.x = -.22; }
  if (L.radio) { const r = TM(new THREE.BoxGeometry(.04, .06, .03), '#1E1E24', spine, -.11, .45, .13, W * .5); r.rotation.x = -.2; }
  // head
  const neck = G(); neck.position.y = BH - .02; spine.add(neck);
  const head = G(); head.position.y = HR * .82; neck.add(head);
  const skin = L.skin ?? '#FFFFFF';
  const skull = TM(new THREE.SphereGeometry(HR, 48, 32), toon(skin, { soft: 1 }), head, 0, 0, 0, W); skull.scale.set(1.04, .98, 1); skull.receiveShadow = false;   // faces always read clean
  const fc = document.createElement('canvas'); fc.width = fc.height = 1024; const fctx = fc.getContext('2d'); const ftex = new THREE.CanvasTexture(fc); ftex.colorSpace = THREE.SRGBColorSpace; ftex.anisotropy = 8;
  const A = 1.3, Bt = 1.2;
  const faceM = FLAT ? flatMat({ map: ftex, transparent: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false }) : new THREE.MeshToonMaterial({ map: ftex, gradientMap: RAMP_SOFT, transparent: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false });
  const faceMesh = new THREE.Mesh(new THREE.SphereGeometry(HR * 1.004, 48, 40, Math.PI / 2 - A, 2 * A, Math.PI / 2 - Bt, 2 * Bt), faceM); faceMesh.scale.copy(skull.scale); head.add(faceMesh);
  let fkey = '';
  const face = { ex: L.face ?? 'happy', talk: 0, blink: 0, look: [0, 0], blush: L.blush, skin, glasses: L.glasses, mustache: L.mustache, lashes: L.lashes, sweat: 0,
    set(o) { Object.assign(face, o); const k = JSON.stringify([face.ex, Math.round(face.talk * 8), face.blink > .5, face.wink ? 1 : 0, face.look.map(v => Math.round(v * 6)), face.glasses ?? '', face.sweat ? 1 : 0]); if (k !== fkey) { fkey = k; drawFace(fctx, face); ftex.needsUpdate = true; } } };
  face.set({});
  // hair / hat
  const hc = L.hairC ?? '#4A3020';
  if (L.hair === 'messy') {
    TM(new THREE.SphereGeometry(HR * 1.035, 40, 20, 0, Math.PI * 2, 0, 1.0), hc, head, 0, 0, 0, W).scale.set(1.04, .98, 1);
    for (let i = 0; i < 9; i++) { const a = -1.2 + i * .3, tuft = TM(new THREE.ConeGeometry(.045, .12, 8), hc, head, Math.sin(a) * .12, HR * .86, Math.cos(a) * .1 - .02, W * .7); tuft.rotation.set(Math.cos(a) * .7 + .2, 0, -Math.sin(a) * .8); tuft.castShadow = false; }
  } else if (L.hair === 'slick') {
    const cap = TM(new THREE.SphereGeometry(HR * 1.045, 40, 20, 0, Math.PI * 2, 0, 1.3), hc, head, 0, .004, -.012, W); cap.scale.set(1.06, 1.02, 1.04); cap.rotation.x = -.5;
    const q = TM(new THREE.SphereGeometry(.1, 24, 14), hc, head, .02, HR * .8, HR * .42, W); q.scale.set(1.75, .62, 1.0); q.rotation.set(-.35, 0, -.12);   // the quiff
    for (const s of [-1, 1]) TM(new THREE.BoxGeometry(.03, .08, .05), hc, head, s * HR * 1.0, -.02, .01, 0);
  } else if (L.hair === 'bob') {
    TM(new THREE.SphereGeometry(HR * 1.05, 40, 20, 0, Math.PI * 2, 0, 1.05), hc, head, 0, .004, 0, W).scale.set(1.06, 1.02, 1.04);
    const sides = TM(new THREE.SphereGeometry(HR * 1.09, 40, 20, Math.PI / 2 + .95, Math.PI * 2 - 1.9, .6, 1.35), hc, head, 0, -.005, -.004, W); sides.scale.set(1.08, 1.0, 1.04); sides.material = toon(hc); sides.material.side = THREE.DoubleSide;
    const fr = TM(new THREE.SphereGeometry(.1, 20, 12), hc, head, 0, HR * .72, HR * .55, W); fr.scale.set(1.9, .45, .8); fr.rotation.x = -.5;
  } else if (L.hair === 'slouch') {
    const hat = slouchHat(L.hatC, W); head.add(hat); head.userData.hat = hat;
  } else if (L.hair === 'peak') {
    const hcol = L.hatC ?? '#7A6A44';
    TM(new THREE.SphereGeometry(HR * 1.03, 40, 20, 0, Math.PI * 2, 0, 1.05), L.hairC ?? '#CFCAC0', head, 0, 0, 0, W).scale.set(1.04, .98, 1);
    const top = TM(new THREE.CylinderGeometry(HR * 1.22, HR * 1.0, .12, 40), hcol, head, 0, HR * .78, -.01, W); top.rotation.x = -.12;
    const band = TM(new THREE.CylinderGeometry(HR * 1.02, HR * 1.0, .05, 40), L.bandC ?? '#B8282E', head, 0, HR * .58, 0, W * .7);
    const visor = TM(new THREE.CylinderGeometry(.17, .17, .012, 24, 1, false, -Math.PI / 2, Math.PI), '#16131A', head, 0, HR * .5, .06, W * .6); visor.rotation.x = .3; visor.scale.set(1, 1, .9);
    TM(new THREE.SphereGeometry(.03, 14, 10), '#E2B848', head, 0, HR * .82, HR * 1.06, W * .5).scale.set(1, 1, .4);
  } else if (L.hair === 'fieldcap') {   // the Imperial Japanese Army field cap: soft crown, short visor, a yellow star, a neck curtain at the back
    const hcol = L.hatC ?? '#857C4E';
    TM(new THREE.SphereGeometry(HR * 1.03, 40, 20, 0, Math.PI * 2, 0, 1.05), L.hairC ?? '#1E1814', head, 0, 0, 0, W).scale.set(1.04, .98, 1);
    const crown = TM(new THREE.CylinderGeometry(HR * .9, HR * 1.03, .1, 40), hcol, head, 0, HR * .8, -.008, W); crown.rotation.x = -.14;
    const top = TM(new THREE.SphereGeometry(HR * .91, 40, 12, 0, Math.PI * 2, 0, 1.0), hcol, head, 0, HR * .98, -.016, W); top.scale.set(1, .32, 1); top.rotation.x = -.14;
    const visor = TM(new THREE.CylinderGeometry(.15, .15, .012, 24, 1, false, -Math.PI / 2, Math.PI), hcol, head, 0, HR * .56, .085, W * .6); visor.rotation.x = .22; visor.scale.set(1, 1, .7);
    const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .012 : .028; i ? st.lineTo(Math.cos(a) * r, Math.sin(a) * r) : st.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const star = new THREE.Mesh(new THREE.ShapeGeometry(st), new THREE.MeshBasicMaterial({ color: '#F2C230' })); star.position.set(0, HR * .82, HR * 1.07); star.rotation.x = -.2; head.add(star);
    if (L.flaps !== 0) { const fl = TM(new THREE.CylinderGeometry(HR * 1.06, HR * 1.2, .22, 30, 1, true, 1.0, Math.PI * 2 - 2.0), hcol, head, 0, HR * .34, -.008, 0); fl.material = toon(hcol); fl.material.side = THREE.DoubleSide; fl.castShadow = false; head.userData.flaps = fl; }
    head.userData.cap = crown;
  } else if (L.hair === 'bald') {   // a shiny dome with a fringe of hair round the back and over the ears
    const fr = TM(new THREE.SphereGeometry(HR * 1.035, 40, 16, Math.PI / 2 + .75, Math.PI * 2 - 1.5, 1.05, .55), hc, head, 0, 0, 0, 0); fr.scale.set(1.05, .98, 1.02); fr.material = toon(hc); fr.material.side = THREE.DoubleSide;
    for (const s of [-1, 1]) { const tuft = TM(new THREE.SphereGeometry(.05, 14, 10), hc, head, s * HR * .98, -.01, -.01, W * .6); tuft.scale.set(.6, 1.2, 1.1); }
  } else if (L.hair === 'ushanka') {   // the Russian fur hat: a round fur crown, the front flap turned up, ear flaps tied up at the sides
    const fur = L.hatC ?? '#5A4636', top = L.topC ?? '#3A3A40';
    TM(new THREE.SphereGeometry(HR * 1.03, 40, 20, 0, Math.PI * 2, 0, 1.05), L.hairC ?? '#3A2A20', head, 0, 0, 0, W).scale.set(1.04, .98, 1);
    const crown = TM(new THREE.SphereGeometry(HR * 1.1, 40, 18, 0, Math.PI * 2, 0, 1.25), top, head, 0, HR * .2, -.01, W); crown.scale.set(1.06, .92, 1.04);
    const brim = TM(new THREE.TorusGeometry(HR * 1.02, .05, 14, 44), fur, head, 0, HR * .56, -.005, W); brim.rotation.x = Math.PI / 2 + .08; brim.scale.set(1.06, 1.02, 1);
    const flap = TM(new THREE.SphereGeometry(.13, 24, 14), fur, head, 0, HR * .82, HR * .7, W); flap.scale.set(1.5, .9, .55); flap.rotation.x = -.35;
    for (const s of [-1, 1]) { const ear = TM(new THREE.SphereGeometry(.09, 20, 12), fur, head, s * HR * 1.08, HR * .62, -.01, W); ear.scale.set(.5, .9, 1.2); }
    if (L.star) { const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .011 : .026; i ? st.lineTo(Math.cos(a) * r, Math.sin(a) * r) : st.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      const star = new THREE.Mesh(new THREE.ShapeGeometry(st), new THREE.MeshBasicMaterial({ color: '#D8282E' })); star.position.set(0, HR * .86, HR * 1.04); star.rotation.x = -.35; head.add(star); }
  } else if (L.hair === 'straw') {
    const hcol = L.hatC ?? '#E2C47A';
    TM(new THREE.CylinderGeometry(HR * .92, HR * 1.06, .16, 32), hcol, head, 0, HR * .78, 0, W);
    TM(new THREE.CylinderGeometry(HR * 1.075, HR * 1.075, .04, 32, 1, true), '#8E2A22', head, 0, HR * .52, 0, 0).material.side = THREE.DoubleSide;
    const brim = TM(new THREE.CylinderGeometry(.4, .4, .012, 48), hcol, head, 0, HR * .46, 0, W * .7); brim.rotation.x = -.06; brim.castShadow = false;
  } else if (L.hair === 'flatcap') {   // a 1960s tweed flat cap
    TM(new THREE.SphereGeometry(HR * 1.03, 40, 20, 0, Math.PI * 2, 0, 1.05), hc, head, 0, 0, 0, W).scale.set(1.04, .98, 1);
    const cc = L.hatC ?? '#7A6A5A';
    const cap = TM(new THREE.SphereGeometry(HR * 1.1, 40, 18, 0, Math.PI * 2, 0, 1.15), cc, head, 0, HR * .2, .015, W); cap.scale.set(1.06, .62, 1.12); cap.rotation.x = .12;
    const brim = TM(new THREE.CylinderGeometry(.13, .13, .014, 24, 1, false, -Math.PI / 2, Math.PI), cc, head, 0, HR * .52, HR * .72, W * .6); brim.rotation.x = .28; brim.scale.set(1, 1, .7);
  } else if (L.hair === 'buns') {   // a little girl's hair: a bob with two buns and a bow
    TM(new THREE.SphereGeometry(HR * 1.05, 40, 20, 0, Math.PI * 2, 0, 1.05), hc, head, 0, .004, 0, W).scale.set(1.06, 1.02, 1.04);
    const fr = TM(new THREE.SphereGeometry(.1, 20, 12), hc, head, 0, HR * .72, HR * .55, W); fr.scale.set(1.9, .45, .8); fr.rotation.x = -.5;
    for (const s of [-1, 1]) TM(new THREE.SphereGeometry(.07, 18, 12), hc, head, s * HR * .82, HR * .62, -.02, W);
    const bc = L.bowC ?? '#E8423A'; for (const s of [-1, 1]) { const b = TM(new THREE.ConeGeometry(.04, .08, 12), bc, head, s * .045, HR * 1.02, .02, W * .6); b.rotation.z = s * Math.PI / 2; } TM(new THREE.SphereGeometry(.02, 10, 8), bc, head, 0, HR * 1.02, .02, W * .5);
  } else if (L.hair === 'beanie') {
    const bc = L.hatC ?? '#E8B030';
    TM(new THREE.SphereGeometry(HR * 1.06, 40, 20, 0, Math.PI * 2, 0, .98), bc, head, 0, .012, 0, W).scale.set(1.04, 1.06, 1);
    const band = TM(new THREE.TorusGeometry(HR * .9, .034, 10, 40), bc, head, 0, HR * .55, 0, W); band.rotation.x = Math.PI / 2; band.scale.set(1.04, 1, 1);
    TM(new THREE.SphereGeometry(.05, 16, 12), L.pomC ?? '#F4F1EA', head, 0, HR * 1.12, 0, W);
  }
  // arms: a sleeve stub (shirt colour), thin black sticks, mitten hands
  const limb = (r, len) => { const g2 = new THREE.CylinderGeometry(r, r, len, 10); g2.translate(0, -len / 2, 0); return g2; };
  const black = toon('#1A161C');
  const arm = s => {
    const sh = G(); sh.position.set(s * .165, .43, 0); spine.add(sh);
    const sl = TM(new THREE.CylinderGeometry(.04, .052, .13, 16), L.top, sh, 0, -.045, 0, W); sl.rotation.z = 0;
    const up = new THREE.Mesh(limb(.013, .2), black); sh.add(up); up.castShadow = true;
    const el = G(); el.position.y = -.2; sh.add(el); const lo = new THREE.Mesh(limb(.012, .19), black); el.add(lo); lo.castShadow = true;
    const hand = G(); hand.position.y = -.2; el.add(hand);
    TM(new THREE.SphereGeometry(.034, 14, 10), '#1A161C', hand, 0, 0, 0, 0).scale.set(1, 1.1, .8);
    const th = TM(new THREE.CapsuleGeometry(.011, .03, 4, 8), '#1A161C', hand, -s * .028, .012, .01, 0); th.rotation.z = s * .9;
    const props = G(); props.position.set(0, -.03, .02); hand.add(props);
    return { sh, el, hand, props, s };
  };
  const aL = arm(1), aR = arm(-1);
  // legs: thin black sticks and chunky shoes
  const leg = s => {
    const hp = G(); hp.position.set(s * .075, .055, 0); hips.add(hp);
    const th = new THREE.Mesh(limb(.016, .25), black); hp.add(th); th.castShadow = true;
    const kn = G(); kn.position.y = -.25; hp.add(kn); const sh2 = new THREE.Mesh(limb(.015, .24), black); kn.add(sh2); sh2.castShadow = true;
    const ft = G(); ft.position.y = -.245; kn.add(ft);
    const shoe = TM(new THREE.SphereGeometry(.05, 16, 12), L.shoe ?? '#2A2A30', ft, 0, -.008, .03, W * .8); shoe.scale.set(1.0, .62, 1.7);
    TM(new THREE.BoxGeometry(.09, .012, .15), '#F4F1EA', ft, 0, -.035, .03, 0);
    return { hp, kn, ft, s };
  };
  const lL = leg(1), lR = leg(-1);
  P.traverse(o => { if (o.isMesh) o.receiveShadow = false; });   // drawn characters: no shading falls on them
  FLAT = 0;
  return { P, root, hips, spine, neck, head, face, aL, aR, lL, lR, props: aR.props, propsL: aL.props, L, HR };
}

// the Australian slouch hat: dented crown, dark band, wide brim with the left side pinned up and a badge (fits a toon head, HR .21)
export function slouchHat(hcol = '#8C7A4E', W = .009) {
  const g = G(), HR = .21;
  const crown = TM(new THREE.SphereGeometry(HR * 1.07, 40, 20, 0, Math.PI * 2, 0, 1.15), hcol, g, 0, .01, 0, W); crown.scale.set(1.05, 1.3, 1.02);
  const dent = TM(new THREE.SphereGeometry(.07, 16, 10), hcol, g, 0, HR * 1.28, 0, 0); dent.scale.set(1.6, .5, 2.2);
  const band = TM(new THREE.CylinderGeometry(HR * 1.03, HR * 1.04, .045, 40, 1, true), toon('#3E2E1E'), g, 0, .14, 0, 0); band.material = band.material.clone(); band.material.side = THREE.DoubleSide;
  const R0 = .36, by = .118;
  const brim = TM(new THREE.CylinderGeometry(R0, R0, .014, 48, 1, false, Math.PI * .78, Math.PI * 1.44), hcol, g, 0, by, 0, W * .7);
  const fg = new THREE.CylinderGeometry(R0, R0, .014, 24, 1, false, Math.PI * .22, Math.PI * .56); fg.translate(-.2, 0, 0); fg.rotateZ(1.32); fg.translate(.2, 0, 0);
  TM(fg, hcol, g, 0, by, 0, W * .7);
  const badge = TM(new THREE.SphereGeometry(.035, 16, 10), '#E2B848', g, .245, .27, 0, W * .5); badge.scale.set(.35, 1, 1);
  g.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return g;
}

// ---------------- poses ----------------
// sp: spine [x,y,z] deg (x forward lean) · hd: head [x,y,z] · aL/aR: [forward, outward, twist, elbow] deg · lL/lR: [forward, outward, knee] · y: hop · sq: squash
export const TP = {
  stand:   { sp: [0, 0, 0], hd: [0, 0, 0], aL: [0, 12, 0, 8], aR: [0, 12, 0, 8], lL: [0, 3, 0], lR: [0, 3, 0] },
  hips:    { sp: [-3, 0, 0], hd: [-4, 0, 4], aL: [-10, 48, 0, 105], aR: [-10, 48, 0, 105], lL: [0, 6, 0], lR: [0, 6, 0] },
  wave:    { sp: [-4, 0, -4], hd: [-6, 0, 6], aL: [0, 14, 0, 10], aR: [-20, 150, 0, 30], lL: [0, 3, 0], lR: [0, 3, 0] },
  cheer:   { sp: [-8, 0, 0], hd: [-12, 0, 0], aL: [-15, 150, 0, 15], aR: [-15, 150, 0, 15], lL: [0, 8, 0], lR: [0, 8, 0] },
  hold:    { sp: [4, 0, 0], hd: [4, 0, 0], aL: [-62, 18, 0, 55], aR: [-62, 18, 0, 55], lL: [0, 4, 0], lR: [0, 4, 0] },   // both hands forward (a prop held out to camera)
  present: { sp: [6, 0, 0], hd: [-6, 0, 0], aL: [-78, 26, 0, 30], aR: [-78, 26, 0, 30], lL: [0, 4, 0], lR: [0, 4, 0] },
  point:   { sp: [0, 0, 0], hd: [0, 0, 0], aL: [0, 12, 0, 10], aR: [-80, 40, 0, 6], lL: [0, 4, 0], lR: [0, 4, 0] },
  rub:     { sp: [8, 0, 0], hd: [-4, 0, 0], aL: [-55, 30, 0, 85], aR: [-55, 30, 0, 85], lL: [0, 5, 0], lR: [0, 5, 0] },   // evil hand-rub
  cross:   { sp: [-4, 0, 0], hd: [-6, 0, -5], aL: [-50, 20, 0, 110], aR: [-50, 20, 0, 110], lL: [0, 6, 0], lR: [0, 6, 0] },
  shrug:   { sp: [0, 0, 0], hd: [0, 0, 8], aL: [-20, 60, 0, 95], aR: [-20, 60, 0, 95], lL: [0, 4, 0], lR: [0, 4, 0] },
  swingUp: { sp: [-14, 0, 0], hd: [-10, 0, 0], aL: [-175, 8, 0, 25], aR: [-175, 8, 0, 25], lL: [10, 12, -10], lR: [-12, 12, 20] },
  swingDn: { sp: [26, 0, 0], hd: [18, 0, 0], aL: [-62, 4, 0, 10], aR: [-62, 4, 0, 10], lL: [14, 14, -22], lR: [-14, 14, 26] },
  sit:     { sp: [-6, 0, 0], hd: [0, 0, 0], aL: [-30, 20, 0, 50], aR: [-30, 20, 0, 50], lL: [80, 8, 80], lR: [80, 8, 80] },
  sitShock:{ sp: [-14, 0, 0], hd: [-8, 0, 0], aL: [-40, 70, 0, 100], aR: [-40, 70, 0, 100], lL: [95, 14, 60], lR: [95, 14, 60] },
  sitLaugh:{ sp: [10, 0, 0], hd: [-14, 0, 0], aL: [-50, 30, 0, 110], aR: [-30, 40, 0, 40], lL: [85, 10, 75], lR: [85, 10, 75] },
  push:    { sp: [14, 0, 0], hd: [-6, 0, 0], aL: [-72, -8, 0, 22], aR: [-72, -8, 0, 22], lL: [0, 4, 0], lR: [0, 4, 0] },
  peel:    { sp: [10, 0, 0], hd: [16, 0, 0], aL: [-58, -12, 0, 92], aR: [-58, -12, 0, 92], lL: [0, 4, 0], lR: [0, 4, 0] },
  sitPeel: { sp: [12, 0, 0], hd: [14, 0, 0], aL: [-40, -14, 0, 96], aR: [-40, -14, 0, 96], lL: [80, 10, 80], lR: [80, 10, 80] },
  think:   { sp: [0, 0, 0], hd: [-8, -12, 6], aL: [-25, -15, 0, 100], aR: [-62, -25, 0, 138], lL: [0, 4, 0], lR: [0, 4, 0] },
  carry:   { sp: [-6, 0, 0], hd: [-2, 0, 0], aL: [-55, -14, 0, 40], aR: [-55, -14, 0, 40], lL: [0, 4, 0], lR: [0, 4, 0] },
  sitRelax:{ sp: [-10, 0, 0], hd: [-6, 0, 0], aL: [-168, 32, 0, 125], aR: [-168, 32, 0, 125], lL: [80, 10, 80], lR: [80, 10, 80] },
  sitEat:  { sp: [-4, 0, 0], hd: [4, 0, 0], aL: [-50, -12, 0, 78], aR: [-62, -22, 0, 132], lL: [80, 8, 80], lR: [80, 8, 80] },
  offer:   { sp: [8, 0, 0], hd: [4, 0, 0], aL: [0, 12, 0, 8], aR: [-78, 10, 0, 18], lL: [0, 4, 0], lR: [0, 4, 0] },
  catchCup:{ sp: [-8, 0, 0], hd: [-12, 0, 0], aL: [-20, 60, 0, 60], aR: [-25, 165, 0, 15], lL: [0, 7, 0], lR: [0, 7, 0] },
  calc:    { sp: [6, 0, 0], hd: [16, 0, 0], aL: [-50, -16, 0, 84], aR: [-46, -22, 0, 96], lL: [0, 4, 0], lR: [0, 4, 0] },
  sneak:   { sp: [20, 0, 0], hd: [-14, 0, 0], aL: [-40, 20, 0, 70], aR: [-40, 20, 0, 70], lL: [20, 4, -40], lR: [-10, 4, 30] },
  salute:  { sp: [-4, 0, 0], hd: [-4, 0, 0], aL: [0, 8, 0, 6], aR: [-95, 62, 0, 150], lL: [0, 2, 0], lR: [0, 2, 0] },
  binoc:   { sp: [14, 0, 0], hd: [-10, 0, 0], aL: [-118, -6, 0, 132], aR: [-118, -6, 0, 132], lL: [70, 10, 110], lR: [70, 10, 110], y: -.22 },
  crouch:  { sp: [24, 0, 0], hd: [-22, 0, 0], aL: [-62, 8, 0, 38], aR: [-62, 8, 0, 38], lL: [70, 10, 110], lR: [70, 10, 110], y: -.22 },
  gunner:  { sp: [26, 0, 0], hd: [-24, 0, 0], aL: [-72, -14, 0, 44], aR: [-58, -8, 0, 78], lL: [70, 12, 110], lR: [70, 12, 110], y: -.22 },
  fist:    { sp: [-6, 0, -4], hd: [-8, 0, 4], aL: [-20, 30, 0, 60], aR: [-150, 30, 0, 70], lL: [0, 6, 0], lR: [0, 6, 0] },
  slump:   { sp: [22, 0, 0], hd: [24, 0, 0], aL: [-10, 6, 0, 10], aR: [-10, 6, 0, 10], lL: [80, 8, 80], lR: [80, 8, 80] },
  speech:  { sp: [-6, 0, 0], hd: [-6, 0, 0], aL: [-30, 30, 0, 80], aR: [-110, 40, 0, 70], lL: [0, 4, 0], lR: [0, 4, 0] },
  stampUp: { sp: [4, 0, 0], hd: [2, 0, 0], aL: [-40, 10, 0, 70], aR: [-150, 6, 0, 40], lL: [80, 8, 80], lR: [80, 8, 80] },
  stampDn: { sp: [14, 0, 0], hd: [-4, 0, 0], aL: [-40, 10, 0, 70], aR: [-70, 2, 0, 12], lL: [80, 8, 80], lR: [80, 8, 80] },
  holdUp:  { sp: [-4, 0, 0], hd: [-6, 0, 0], aL: [-20, 30, 0, 50], aR: [-128, 18, 0, 30], lL: [0, 5, 0], lR: [0, 5, 0] },
  pointFwd:{ sp: [6, 0, 0], hd: [-6, 0, 0], aL: [-20, 20, 0, 40], aR: [-100, 10, 0, 4], lL: [0, 6, 0], lR: [10, 6, 0] },
  hang:    { sp: [-8, 0, 0], hd: [-6, 0, 0], aL: [-150, 30, 0, 30], aR: [-62, -10, 0, 50], lL: [0, 8, 0], lR: [0, 8, 0] },
};
export function mix(a, b, u) { const o = {}; for (const k of Object.keys(a)) o[k] = Array.isArray(a[k]) ? a[k].map((v, i) => v + ((b[k]?.[i] ?? v) - v) * u) : (typeof a[k] === 'number' ? a[k] + ((b[k] ?? a[k]) - a[k]) * u : (u < .5 ? a[k] : b[k])); return o; }
export function walk(q, ph, amt = 1) {
  const s = Math.sin(ph), c = Math.cos(ph), o = mix(q, q, 0);
  o.lL = [q.lL[0] + s * 28 * amt, q.lL[1], Math.max(0, -c) * 40 * amt]; o.lR = [q.lR[0] - s * 28 * amt, q.lR[1], Math.max(0, c) * 40 * amt];
  o.aL = [q.aL[0] - s * 22 * amt, q.aL[1], q.aL[2], q.aL[3] + 10]; o.aR = [q.aR[0] + s * 22 * amt, q.aR[1], q.aR[2], q.aR[3] + 10];
  o.y = Math.abs(Math.sin(ph)) * .025 * amt; return o;
}
// apply a pose; o: { t, look (world point for the head), face, talk, breathe }
const _v = new THREE.Vector3(), _q = new THREE.Quaternion();
export function apply(p, q, o = {}) {
  const t = o.t ?? 0, br = Math.sin(t * 2.2 + (o.seed ?? 0)) * (o.breathe ?? 1);
  p.root.position.y = (q.y ?? 0);
  const sq = 1 + (q.sq ?? 0); p.spine.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
  p.spine.rotation.set((q.sp[0] + br * .8) * D2R, q.sp[1] * D2R, q.sp[2] * D2R);
  p.head.rotation.set((q.hd[0] + br * .6) * D2R, q.hd[1] * D2R, q.hd[2] * D2R);
  for (const a of [p.aL, p.aR]) { const v = a === p.aL ? q.aL : q.aR; a.sh.rotation.set(v[0] * D2R, v[2] * D2R * a.s, (v[1] + br * .8) * D2R * a.s, 'XZY'); a.el.rotation.set(-v[3] * D2R, 0, 0); }
  for (const l of [p.lL, p.lR]) { const v = l === p.lL ? q.lL : q.lR; l.hp.rotation.set(-v[0] * D2R, 0, v[1] * D2R * l.s); l.kn.rotation.set(v[2] * D2R, 0, 0); l.ft.rotation.set((v[0] - v[2]) * D2R, 0, -v[1] * D2R * l.s); }
  if (o.look) {   // turn the head toward a world point (limited)
    p.P.updateMatrixWorld(true); p.head.getWorldPosition(_v); const d = o.look.clone().sub(_v);
    p.P.getWorldQuaternion(_q); d.applyQuaternion(_q.invert());
    const yaw = Math.atan2(d.x, d.z), pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
    p.head.rotation.y += Math.max(-1, Math.min(1, yaw)) * .8; p.head.rotation.x -= Math.max(-.6, Math.min(.6, pitch)) * .7;
  }
  const blink = ((t + (o.seed ?? 0) * .7) % 3.1) < .12 ? 1 : 0;
  p.face.set({ ex: o.face ?? p.face.ex, talk: o.talk ?? 0, blink: o.noBlink || o.wink ? 0 : blink, wink: o.wink ? 1 : 0, look: o.eyes ?? [0, 0], sweat: o.sweat ? 1 : 0 });
}
