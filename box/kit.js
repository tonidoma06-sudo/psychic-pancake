// kit.js · shared materials, primitive helpers and canvas-text textures for the Roman 3D Short
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const matCache = new Map();
export function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: o.r ?? .62, metalness: o.m ?? 0, emissive: o.e ?? '#000000', emissiveIntensity: o.ei ?? 1, side: o.side ?? THREE.FrontSide, transparent: !!o.t, opacity: o.op ?? 1, flatShading: !!o.flat }));
  return matCache.get(key);
}
export const C = {
  skin: '#F2C29A', skinD: '#D9A27A', ink: '#1E1A1C', white: '#F6F1E7', wool: '#EEE6D6', purple: '#6C2E8C', imperial: '#7A2A8E',
  red: '#C8283A', redD: '#8E1B2A', gold: '#F2B636', goldD: '#C98A1A', steel: '#B9C2CC', wood: '#9A6234', woodD: '#6B3F1F',
  marble: '#EFE7DA', marbleD: '#D9CDBB', stone: '#D8C7A5', stoneD: '#B9A27E', terracotta: '#C8643C', green: '#4E9A4A', leaf: '#7BB661',
  sky: '#8FC6F0', dusk: '#F59A6B', night: '#25305A', hairD: '#3B2A22', grey: '#B7B2AC', pink: '#F08FA6', teal: '#2FA39A', blue: '#3D6FD1',
};
export const G = () => new THREE.Group();
export function M(geo, m, parent, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true;
  if (parent) parent.add(o); return o;
}
export const box = (w, h, d, r = 0) => r > 0 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d);
export const sph = (r, ws = 24, hs = 16) => new THREE.SphereGeometry(r, ws, hs);
export const cyl = (rt, rb, h, s = 20, open = false) => new THREE.CylinderGeometry(rt, rb, h, s, 1, open);
export const cap = (r, len, s = 12) => new THREE.CapsuleGeometry(r, len, 6, s);
export const tor = (R, r, rs = 8, ts = 32, arc = Math.PI * 2) => new THREE.TorusGeometry(R, r, rs, ts, arc);

// text on a canvas → texture (deterministic; fonts must be loaded first)
export function textCanvas(lines, o = {}) {
  const w = o.w ?? 1024, h = o.h ?? 512, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (o.bg) { g.fillStyle = o.bg; if (o.round) { g.beginPath(); g.roundRect(0, 0, w, h, o.round); g.fill(); } else g.fillRect(0, 0, w, h); }
  if (o.border) { g.strokeStyle = o.border; g.lineWidth = o.bw ?? 18; g.beginPath(); g.roundRect(o.bw / 2 || 9, o.bw / 2 || 9, w - (o.bw || 18), h - (o.bw || 18), o.round ?? 30); g.stroke(); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const L of lines) {
    g.font = `${L.weight ?? 700} ${L.size}px ${L.font ?? 'Fredoka'}`;
    if (L.ls) g.letterSpacing = L.ls + 'px';
    if (L.stroke) { g.lineJoin = 'round'; g.strokeStyle = L.stroke; g.lineWidth = L.sw ?? L.size * .16; g.strokeText(L.text, L.x ?? w / 2, L.y); }
    g.fillStyle = L.color ?? '#222'; g.fillText(L.text, L.x ?? w / 2, L.y);
    g.letterSpacing = '0px';
  }
  return c;
}
export function texFrom(canvas) { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
export function textPlane(lines, w, h, o = {}) {
  const c = textCanvas(lines, o), t = texFrom(c);
  const m = new THREE.MeshStandardMaterial({ map: t, transparent: !o.bg, roughness: .7, side: THREE.DoubleSide, emissive: o.glow ? '#ffffff' : '#000000', emissiveMap: o.glow ? t : null, emissiveIntensity: o.glow ?? 0 });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.castShadow = !!o.bg; p.receiveShadow = true;
  p.userData.redraw = (lines2, o2 = o) => { const c2 = textCanvas(lines2, o2); const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); g.drawImage(c2, 0, 0); t.needsUpdate = true; };
  return p;
}
// a laurel wreath (gold or green) of leaves around a ring
export function laurel(color, R = .25, n = 22, leaf = .07) {
  const g = G(), lm = mat(color, { r: .35, m: color === C.gold ? .6 : 0 }), lg = sph(1, 10, 8);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2; if (Math.abs(Math.sin(a / 2)) < .12) continue;   // gap at the front
    for (const s of [-1, 1]) {
      const l = M(lg, lm, g, Math.sin(a) * R, s * .03, Math.cos(a) * R);
      l.scale.set(leaf * .45, leaf * .18, leaf); l.rotation.y = a + s * .5; l.rotation.z = s * .35;
    }
  }
  return g;
}
// a simple deterministic RNG
export function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
