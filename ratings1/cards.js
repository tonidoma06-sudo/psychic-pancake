// cards.js · the ratings that float above everyone's head: a full stat card (Overall badge, six stat bars, a small grey
// Potential line) or a compact pill (just the Overall), and the compatibility heart that appears between two people.
// Cards are unlit billboards drawn on canvases; a card redraws only when what it shows changes.
import * as THREE from 'three';

export const STATS = [['str', 'STRENGTH'], ['ath', 'ATHLETICISM'], ['hp', 'HEALTH'], ['iq', 'IQ'], ['eq', 'EQ'], ['mh', 'MENTAL HEALTH']];
export const tier = v => v >= 90 ? '#FFC83A' : v >= 80 ? '#4ADB6A' : v >= 65 ? '#C8E04A' : v >= 45 ? '#FF9A2A' : '#E8423A';
const barCol = v => v >= 80 ? '#4ADB6A' : v >= 60 ? '#C8E04A' : v >= 45 ? '#FFB02A' : '#E8423A';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const easeBack = u => { u = clamp(u) - 1; return 1 + u * u * (2.7 * u + 1.7); };

function canvasMesh(w, h, pw, ph) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.minFilter = THREE.LinearMipmapLinearFilter;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, fog: false, toneMapped: false }));
  m.renderOrder = 10; m.frustumCulled = false; return { c, g: c.getContext('2d'), t, m };
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }

// ---------------- the full card ----------------
// state: { v: {ovr, str, ath, hp, iq, eq, mh, pot}, show: 0..1 (rows revealed, per row), hide: ['mh'], pop: [{k, d, a}] (+1/−1 bubbles,
// a = 0..1 age), hl: 'pot' | key (a glow on one row), gold: 0..1 }
export function fullCard() {
  const W = 600, H = 900, C = canvasMesh(W, H, .62, .93); let key = '';
  C.m.userData.draw = (s) => {
    const k = JSON.stringify(s); if (k === key) return; key = k; const g = C.g, v = s.v;
    g.clearRect(0, 0, W, H);
    // the panel
    const gold = s.gold ?? 0;
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, 18, 26, W - 28, H - 36, 46); g.fill();
    const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, gold > .5 ? '#5A4410' : '#1E2238'); grd.addColorStop(1, gold > .5 ? '#2A1E06' : '#12141F');
    g.fillStyle = grd; rr(g, 10, 10, W - 28, H - 36, 44); g.fill();
    g.lineWidth = 10; g.strokeStyle = gold > .5 ? '#FFD24A' : tier(v.ovr); rr(g, 15, 15, W - 38, H - 46, 40); g.stroke();
    // the Overall badge
    const cx = W / 2 - 9, by = 128;
    g.fillStyle = tier(v.ovr); g.beginPath(); g.arc(cx, by, 92, 0, 7); g.fill();
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.arc(cx, by + 8, 80, 0, Math.PI); g.fill();
    g.fillStyle = '#16131A'; g.font = '900 108px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(Math.round(v.ovr)), cx, by + 6);
    g.fillStyle = '#E8ECF8'; g.font = '900 34px Montserrat'; g.fillText('OVERALL', cx, by + 124);
    // the stat rows
    STATS.forEach(([sk, label], i) => {
      const y = 300 + i * 88, rv = s.show == null ? 1 : clamp(s.show * 7 - i);
      if (rv <= 0) return;
      g.save(); g.globalAlpha = clamp(rv * 2); const sc = easeBack(rv); g.translate(cx, y); g.scale(sc, sc); g.translate(-cx, -y);
      if (s.hl === sk) { g.fillStyle = 'rgba(255,255,255,.12)'; rr(g, 30, y - 40, W - 78, 80, 18); g.fill(); }
      g.fillStyle = '#C8CCE0'; g.font = '800 30px Montserrat'; g.textAlign = 'left'; g.fillText(label, 44, y - 16);
      const hidden = (s.hide ?? []).includes(sk);
      if (hidden) { g.fillStyle = '#2E3248'; rr(g, 44, y + 6, W - 112, 30, 15); g.fill(); g.fillStyle = '#5A5E78'; g.font = '900 30px Montserrat'; g.textAlign = 'right'; g.fillText('HIDDEN', W - 64, y - 16); g.restore(); return; }
      const val = v[sk], max = sk === 'iq' ? 150 : 100, fr = clamp(val / max);
      g.fillStyle = '#2E3248'; rr(g, 44, y + 6, W - 200, 30, 15); g.fill();
      g.fillStyle = barCol(sk === 'iq' ? val * 100 / 130 : val); rr(g, 44, y + 6, Math.max(30, (W - 200) * fr), 30, 15); g.fill();
      g.fillStyle = '#FFFFFF'; g.font = '900 52px Montserrat'; g.textAlign = 'right'; g.fillText(String(Math.round(val)), W - 50, y + 20);
      g.restore();
    });
    // the small grey number
    const py = 845, prv = s.show == null ? 1 : clamp(s.show * 7 - 6);
    if (prv > 0) { g.globalAlpha = prv; g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 3; g.beginPath(); g.moveTo(44, py - 34); g.lineTo(W - 64, py - 34); g.stroke();
      if (s.hl === 'pot') { g.fillStyle = 'rgba(255,255,255,.14)'; rr(g, 30, py - 28, W - 78, 52, 14); g.fill(); }
      g.fillStyle = s.hl === 'pot' ? '#C8CCD8' : '#7A7E90'; g.font = '800 26px Montserrat'; g.textAlign = 'left'; g.fillText('POTENTIAL', 44, py); g.textAlign = 'right'; g.font = '900 30px Montserrat'; g.fillText(String(Math.round(v.pot)), W - 64, py); g.globalAlpha = 1; }
    // +1 / −1 bubbles rising from a row
    (s.pop ?? []).forEach(p => { const i = STATS.findIndex(x => x[0] === p.k); if (i < 0 || p.a < 0 || p.a > 1) return; const y = 300 + i * 88 - p.a * 120;
      g.globalAlpha = clamp((1 - p.a) * 2.5); g.font = '900 64px Montserrat'; g.textAlign = 'right'; g.lineWidth = 12; g.strokeStyle = '#000';
      const txt = (p.d > 0 ? '+' : '−') + Math.abs(p.d); g.strokeText(txt, W - 150, y); g.fillStyle = p.d > 0 ? '#4ADB6A' : '#FF4A3A'; g.fillText(txt, W - 150, y); g.globalAlpha = 1; });
    C.t.needsUpdate = true;
  };
  return C.m;
}

// ---------------- the compact pill (the crowd) ----------------
export function miniCard() {
  const W = 256, H = 128, C = canvasMesh(W, H, .42, .21); let key = '';
  C.m.userData.draw = (s) => {
    const k = JSON.stringify(s); if (k === key) return; key = k; const g = C.g, v = s.v.ovr;
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, 10, 14, W - 14, H - 18, 44); g.fill();
    g.fillStyle = '#1E2238'; rr(g, 4, 6, W - 14, H - 18, 44); g.fill(); g.lineWidth = 7; g.strokeStyle = tier(v); rr(g, 7, 9, W - 20, H - 24, 40); g.stroke();
    g.fillStyle = tier(v); g.beginPath(); g.arc(62, H / 2 - 6, 38, 0, 7); g.fill();
    g.fillStyle = '#16131A'; g.font = '900 44px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(Math.round(v)), 62, H / 2 - 3);
    g.fillStyle = '#C8CCE0'; g.font = '900 30px Montserrat'; g.textAlign = 'left'; g.fillText('OVR', 112, H / 2 - 3);
    C.t.needsUpdate = true;
  };
  return C.m;
}

// ---------------- the compatibility heart ----------------
// state: { pct, fill: 0..1 (how full the heart has filled up to pct), crack: 0..1, glow: 0..1, show: 0..1 }
export function heart() {
  const W = 512, H = 512, C = canvasMesh(W, H, .5, .5); let key = '';
  const path = (g, s) => { g.beginPath(); g.moveTo(256, 430 * s + 256 * (1 - s)); g.bezierCurveTo(60, 300, 40, 120, 160, 95); g.bezierCurveTo(215, 85, 250, 120, 256, 160); g.bezierCurveTo(262, 120, 297, 85, 352, 95); g.bezierCurveTo(472, 120, 452, 300, 256, 430); g.closePath(); };
  C.m.userData.draw = (s) => {
    const k = JSON.stringify(s); if (k === key) return; key = k; const g = C.g;
    g.clearRect(0, 0, W, H); if (!(s.show > 0)) { C.t.needsUpdate = true; return; }
    g.save(); g.globalAlpha = clamp(s.show * 2); const sc = easeBack(s.show); g.translate(256, 260); g.scale(sc, sc); g.translate(-256, -260);
    if (s.glow > 0) { g.shadowColor = `rgba(255,90,140,${s.glow})`; g.shadowBlur = 60; }
    path(g, 1); g.fillStyle = '#2A2238'; g.fill(); g.shadowBlur = 0;
    // fill level
    const lvl = clamp((s.pct / 100) * (s.fill ?? 1)); g.save(); path(g, 1); g.clip(); g.fillStyle = s.pct >= 50 ? '#FF4A7A' : '#7A7E90'; g.fillRect(0, 430 - lvl * 345, W, 400); g.restore();
    g.lineWidth = 16; g.strokeStyle = s.pct >= 50 ? '#FF8AAE' : '#A8ACBC'; path(g, 1); g.stroke();
    if (s.crack > 0) { g.strokeStyle = '#16131A'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); const pts = [[256, 150], [230, 210], [276, 260], [236, 320], [262, 380]]; const n = Math.max(1, Math.round(clamp(s.crack) * (pts.length - 1)));
      g.moveTo(...pts[0]); for (let i = 1; i <= n; i++) g.lineTo(...pts[i]); g.stroke(); }
    g.fillStyle = '#FFFFFF'; g.font = '900 120px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 16; g.strokeStyle = '#16131A';
    const txt = Math.round(s.pct * (s.fill ?? 1)) + '%'; g.strokeText(txt, 256, 262); g.fillText(txt, 256, 262);
    g.restore(); C.t.needsUpdate = true;
  };
  return C.m;
}
