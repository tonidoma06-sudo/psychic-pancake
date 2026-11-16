// film.js · "Dobrodošli": one harbour poster re-inked per guest language, then the offer prints.
// Art space: a full-bleed 1920×1080 u print. The camera maps art → screen.
import { makeTextures, paperSheet, ink, wipeRegion, wipeFront, squeegee, inkFinish, polyPath, circlePath, ringPath,
  rectPath, unionPath, ridgeLine, bandSteps, clamp, lerp, hex2rgb, mix } from './engine/silk.js';

export const DUR = 31.0;
const W = 1920, H = 1080, PAPER = '#F2E8D2';
const ss = x => x * x * (3 - 2 * x), seg = (t, a, b) => clamp((t - a) / (b - a));

// ---------- palettes: sky1, sky2, far, mid, near, accent, lit ----------
const PAL = [
  { sky1: '#F6CD98', sky2: '#EE9A73', far: '#9A7FA8', mid: '#3E7079', near: '#1E3B3F', acc: '#F3B23A', lit: '#7FA39A' },   // dawn
  { sky1: '#E8F0F2', sky2: '#7FB3C8', far: '#B9B095', mid: '#2F6E8E', near: '#173247', acc: '#E8553D', lit: '#6E9DB5' },   // noon
  { sky1: '#F3E3B5', sky2: '#E9B65C', far: '#C9875A', mid: '#7A4B3A', near: '#2E2420', acc: '#F05A28', lit: '#A9745A' },   // golden hour
  { sky1: '#EEF3F6', sky2: '#9FC3D6', far: '#6E8FA8', mid: '#2F5F80', near: '#0E3B5C', acc: '#FFC93C', lit: '#5C88A6' },   // Almissa blue + taxi yellow
];
const HEAD = ['DOBRODOŠLI', 'WILLKOMMEN', 'WITAMY', 'BENVENUTI'];

// ---------- the place (generic Dalmatian river-mouth town: a ridge, two canyon cliffs, an old tower, a boat) ----------
const geo = (() => {
  const ridge = ridgeLine([-20, 520], [1940, 470], 150, 6, 3);
  const far = polyPath([...ridge, [1940, 700], [-20, 700]]);
  const cliffL = polyPath([[-20, 420], [140, 392], [330, 404], [470, 520], [560, 640], [610, 820], [-20, 820]]);
  const tower = unionPath([rectPath(170, 270, 84, 128), rectPath(166, 250, 18, 24), rectPath(199, 250, 18, 24), rectPath(232, 250, 22, 24)]);
  const cliffR = polyPath([[1940, 440], [1720, 462], [1540, 556], [1418, 690], [1350, 820], [1940, 820]]);
  const midP = unionPath([cliffL, tower, cliffR]);
  const litP = unionPath([polyPath([[330, 404], [470, 520], [560, 640], [520, 650], [430, 540], [320, 430]]),
    polyPath([[1540, 556], [1418, 690], [1462, 692], [1572, 580]]), rectPath(236, 274, 18, 124)]);
  const water = rectPath(-20, 700, 1960, 400);
  const sun = circlePath(1330, 470, 108), sunRing = ringPath(1330, 470, 138, 150);
  const glint = unionPath([[700, 728, 160], [900, 752, 110], [1080, 734, 190], [820, 780, 90], [1180, 770, 120]].map(([x, y, w]) => rectPath(x, y, w, 7)));
  const boat = unionPath([polyPath([[930, 742], [1080, 742], [1060, 768], [952, 768]]), rectPath(1000, 640, 6, 104), polyPath([[1010, 652], [1010, 734], [1066, 734]])]);
  const pine = (x, y, s) => { const p = []; for (let k = 0; k < 5; k++) { const yy = y - k * 70 * s, w = (120 - k * 20) * s; p.push(polyPath([[x - w, yy], [x, yy - 110 * s], [x + w, yy]])); } p.push(rectPath(x - 8 * s, y - 10, 16 * s, 90)); return unionPath(p); };
  const near = unionPath([pine(110, 860, 1.15), pine(300, 900, .85), pine(1820, 880, 1.0), boat, rectPath(-20, 1000, 1960, 100)]);
  return { far, midP, litP, water, sun, sunRing, glint, near, sky: rectPath(-20, -20, 1960, 1120),
    skyTop: rectPath(-20, -20, 1960, 280), bands: bandSteps(-20, 1960, 260, 600, 6) };
})();

// ---------- print order (pull = when the squeegee crosses; dir; depth for drift) ----------
const PULLS = [
  { id: 'sun', t0: 0.15, t1: 0.95, dir: 'right', depth: 0.2, box: [1170, 310, 320, 320] },
  { id: 'sky', t0: 1.0, t1: 2.2, dir: 'down', depth: 0 },
  { id: 'far', t0: 2.3, t1: 3.2, dir: 'right', depth: 0.3 },
  { id: 'mid', t0: 3.3, t1: 4.3, dir: 'right', depth: 0.6 },
  { id: 'glint', t0: 4.4, t1: 5.0, dir: 'right', depth: 0.7 },
  { id: 'near', t0: 5.1, t1: 6.1, dir: 'right', depth: 1.0 },
  { id: 'head', t0: 6.4, t1: 7.0, dir: 'right', depth: 0.1 },
];
const SWEEPS = [{ t0: 9.6, t1: 9.95, to: 1 }, { t0: 12.3, t1: 12.65, to: 2 }, { t0: 14.7, t1: 15.05, to: 3 }];
const DRIFT = [17.4, 18.2];            // loose layers, then the snap
const BAND = { t0: 18.5, t1: 19.0 };
const ITEMS = [
  { id: 'l1', t: 19.1, text: 'YOUR WEBSITE IN 6 LANGUAGES' },
  { id: 'wa', t: 19.7, text: 'BOOK ON WHATSAPP' },
  { id: 'p1', t: 20.3, text: '€600 ONCE' },
  { id: 'p2', t: 20.7, text: '€15 A MONTH' },
  { id: 'own', t: 21.1, text: 'YOUR DOMAIN, YOUR SITE' },
];
const STUB = { t0: 25.5, t1: 26.0 };

// ---------- camera ----------
function cam(t) {
  const K = [[0, 2.4, 1330, 470], [1.0, 2.4, 1330, 470], [4.2, 1, 960, 540], [18.2, 1, 960, 540], [19.0, 1.35, 751, 680], [24.6, 1.35, 751, 680], [25.5, 1, 960, 540], [DUR, 1, 960, 540]];
  for (let i = 0; i < K.length - 1; i++) {
    const [a, za, xa, ya] = K[i], [b, zb, xb, yb] = K[i + 1];
    if (t <= b) { const u = ss(seg(t, a, b)), z = Math.exp(lerp(Math.log(za), Math.log(zb), u)); return { z, x: lerp(xa, xb, u), y: lerp(ya, yb, u) }; }
  }
  return { z: 1, x: 960, y: 540 };
}
const toScreen = (c, x, y) => [(x - c.x) * c.z + 960, (y - c.y) * c.z + 540];

// ---------- contrast pick ----------
const lum = h => { const c = hex2rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const pick = (bg, list) => list.reduce((best, c) => contrast(c, bg) > contrast(best, bg) ? c : best, list[0]);

let ctx, T;
export function setup(canvas) {
  ctx = canvas.getContext('2d');
  T = makeTextures(PAPER, 5);
  const ev = [];
  for (const p of PULLS) ev.push({ t: p.t0, type: 'pull', d: +(p.t1 - p.t0).toFixed(3), id: p.id });
  for (const s of SWEEPS) ev.push({ t: s.t0, type: 'sweep', d: +(s.t1 - s.t0).toFixed(3) });
  ev.push({ t: DRIFT[0], type: 'drift', d: DRIFT[1] - DRIFT[0] }, { t: DRIFT[1], type: 'snap' });
  ev.push({ t: BAND.t0, type: 'pull', d: BAND.t1 - BAND.t0, id: 'band' });
  for (const it of ITEMS) ev.push({ t: it.t, type: 'stamp', id: it.id });
  ev.push({ t: STUB.t0, type: 'pull', d: STUB.t1 - STUB.t0, id: 'stub' }, { t: STUB.t1, type: 'stamp', id: 'stub' });
  return { ev };
}

// palette in effect at a point (x,y) of the sheet, given the sweeps so far
function sweepState(t) {
  let base = 0, cur = null;
  for (const s of SWEEPS) { if (t >= s.t1) base = s.to; else if (t >= s.t0) cur = s; }
  return { base, cur };
}
const SW_DIR = [1, 0.62];                // sweep front: x + 0.62 y = f
function sweepClip(p) {                  // area already re-inked (behind the diagonal blade)
  const span = W + H * SW_DIR[1] + 200, f = -100 + p * span, path = new Path2D();
  path.moveTo(-4000, -4000); path.lineTo(f + 4000 * SW_DIR[1], -4000); path.lineTo(f - 4000 * SW_DIR[1], 4000); path.lineTo(-4000, 4000); path.closePath();
  return { path, f };
}

function printArt(t, P, hIdx, clipAll) {
  const prog = id => { const p = PULLS.find(q => q.id === id); return seg(t, p.t0, p.t1); };
  const drift = id => {                                             // loose layers before the snap
    if (t < DRIFT[0] || t >= DRIFT[1]) return [0, 0];
    const d = PULLS.find(q => q.id === id)?.depth ?? 0, u = Math.sin(Math.PI * seg(t, DRIFT[0], DRIFT[1]));
    return [d * 26 * u, -d * 18 * u];
  };
  const layer = (id, part, o) => {
    const p = prog(id); if (p <= 0) return;
    const pq = PULLS.find(q => q.id === id), box = pq.box || [0, 0, W, H], dir = pq.dir;
    const [dx, dy] = drift(id), reg = o.reg || [0, 0];
    ink(ctx, part, { ...o, reg: [reg[0] + dx, reg[1] + dy], clip: p < 1 ? wipeRegion(box, dir, p, id.length * 7) : undefined, sheen: p < 1 ? 1 : 0.6 * (1 - seg(t, PULLS.find(q => q.id === id).t1, PULLS.find(q => q.id === id).t1 + 1)) + .2 });
  };
  ctx.save(); if (clipAll) ctx.clip(clipAll);
  paperSheet(ctx, T, -20, -20, W + 40, H + 40);
  // sky: light ink knocked out by the water (paper is the brightest thing: the sea)
  layer('sky', { path: geo.sky, knock: geo.water }, { color: P.sky1, reg: [1, -1] });
  layer('sky', { path: unionPath([geo.skyTop, geo.bands]) }, { color: P.sky2, reg: [-2, 1] });
  layer('sun', { path: geo.sun }, { color: P.acc, reg: [2, 1], trap: 1 });
  layer('sun', { path: geo.sunRing }, { color: P.acc, reg: [2, 1] });
  layer('far', { path: geo.far }, { color: P.far, reg: [-1, 2], trap: 1 });
  layer('mid', { path: geo.midP }, { color: P.mid, reg: [2, -1], trap: 1 });
  layer('mid', { path: geo.litP }, { color: P.lit, reg: [3, 0] });
  layer('glint', { path: geo.glint }, { color: P.sky2, reg: [0, 1] });
  layer('near', { path: geo.near }, { color: P.near, reg: [-2, 1], trap: 1 });
  // header in the sky, ink chosen by contrast against sky2
  const hc = pick(P.sky2, [P.near, PAPER, P.sky1]);
  layer('head', { paint: (c, col) => { c.font = '900 168px BigShoulders'; c.letterSpacing = '18px'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = col; c.fillText(HEAD[hIdx], 969, 214); } }, { color: hc });
  ctx.restore();
}

function band(t, P) {
  const p = seg(t, BAND.t0, BAND.t1); if (p <= 0) return;
  const box = [0, 780, W, 300];
  ink(ctx, { path: rectPath(-20, 780, W + 40, 320) }, { color: P.near, reg: [1, -1], clip: p < 1 ? wipeRegion(box, 'right', p, 9) : undefined, sheen: p < 1 ? 1 : .3, trap: 1 });
  const show = id => t >= ITEMS.find(i => i.id === id).t;
  const txt = (s, x, y, font, col, ls = '0px', align = 'left') => { ctx.save(); ctx.font = font; ctx.letterSpacing = ls; ctx.textAlign = align; ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.restore(); };
  const light = pick(P.near, [PAPER, P.sky1]);
  if (show('l1')) txt('YOUR WEBSITE IN 6 LANGUAGES', 70, 872, '900 78px BigShoulders', light, '4px');
  if (show('wa')) {
    ink(ctx, { path: (() => { const q = new Path2D(); q.roundRect(70, 900, 430, 66, 33); return q; })() }, { color: '#2FB463', reg: [2, 1] });
    txt('BOOK ON WHATSAPP', 285, 945, '600 30px Outfit', '#0B2A17', '3px', 'center');
  }
  const price = (big, small, x) => { ctx.save(); ctx.font = '900 76px BigShoulders'; const w = ctx.measureText(big).width; ctx.restore(); txt(big, x, 962, '900 76px BigShoulders', P.acc); txt(small, x + w + 14, 958, '600 26px Outfit', light, '4px'); };
  if (show('p1')) price('€600', 'ONCE', 560);
  if (show('p2')) price('€15', 'A MONTH', 850);
  if (show('own')) {
    ink(ctx, { path: rectPath(70, 994, 1320, 4) }, { color: P.acc, reg: [1, 0] });
    txt('YOUR DOMAIN, YOUR SITE', 70, 1048, '600 34px Outfit', light, '6px');
  }
}

function stub(t, P) {
  const p = seg(t, STUB.t0, STUB.t1); if (p <= 0) return;
  const box = [1460, 560, 420, 470], clip = p < 1 ? wipeRegion(box, 'down', p, 4) : undefined;
  const sh = new Path2D(); sh.roundRect(1460, 560, 420, 470, 14);
  ink(ctx, { path: sh }, { color: P.acc, reg: [2, 2], clip, sheen: p < 1 ? 1 : .3, trap: 1 });
  const tc = pick(P.acc, [P.near, '#111']);
  ink(ctx, { paint: (c, col) => {
    c.textAlign = 'center'; c.fillStyle = col;
    c.font = '900 92px BigShoulders'; c.letterSpacing = '6px'; c.fillText('ALMISSA', 1670, 700);
    c.font = '800 64px BigShoulders'; c.letterSpacing = '22px'; c.fillText('DIGITAL', 1680, 772);
    c.fillRect(1520, 812, 300, 5);
    c.font = '600 26px Outfit'; c.letterSpacing = '5px'; c.fillText('WEBSITES FOR TOURISM', 1670, 870);
    c.fillText('OMIŠ · CROATIA', 1670, 920);
    c.setLineDash([10, 9]); c.lineWidth = 3; c.strokeStyle = col; c.beginPath(); c.moveTo(1490, 960); c.lineTo(1850, 960); c.stroke();
  } }, { color: tc, clip });
}

export function render(t) {
  const c = cam(t);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#3A2F27'; ctx.fillRect(0, 0, 1920, 1080); ctx.restore();
  ctx.save(); ctx.setTransform(c.z, 0, 0, c.z, 960 - c.x * c.z, 540 - c.y * c.z);
  const { base, cur } = sweepState(t);
  printArt(t, PAL[base], base, null);
  let sw = null;
  if (cur) { const p = seg(t, cur.t0, cur.t1); sw = sweepClip(p); printArt(t, PAL[cur.to], cur.to, sw.path); }
  const Pnow = PAL[cur ? cur.to : base];
  band(t, Pnow); stub(t, Pnow);
  inkFinish(ctx, T, -20, -20, W + 40, H + 40);
  // squeegee on the active pull
  const act = [...PULLS.map(p => ({ ...p })), { id: 'band', ...BAND, dir: 'right' }, { id: 'stub', ...STUB, dir: 'down' }].find(p => t >= p.t0 && t < p.t1);
  if (act) {
    const box = act.id === 'band' ? [0, 780, W, 300] : act.id === 'stub' ? [1460, 560, 420, 470] : (act.box || [0, 0, W, H]);
    const pp = seg(t, act.t0, act.t1), f = wipeFront(box, act.dir, pp);
    const col = act.id === 'sky' ? Pnow.sky2 : act.id === 'sun' ? Pnow.acc : act.id === 'band' ? Pnow.near : act.id === 'stub' ? Pnow.acc : act.id === 'far' ? Pnow.far : act.id === 'mid' ? Pnow.mid : act.id === 'glint' ? Pnow.sky2 : Pnow.near;
    if (act.dir === 'down') squeegee(ctx, [box[0] - 30, f + 8], [box[0] + box[2] + 30, f + 8], [0, 1], { color: col, roll: f / 30, handle: .5, seed: 3 });
    else squeegee(ctx, [f + 8, box[1] - 40], [f + 8, box[1] + box[3] + 40], [1, 0], { color: col, roll: f / 30, handle: .5, seed: 5 });
  }
  if (sw) {                                                          // the diagonal re-ink blade
    const f = sw.f, a = [f + 1400 * SW_DIR[1], -1400], b = [f - 1400 * SW_DIR[1], 1400], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const lead = [SW_DIR[0] / Math.hypot(1, SW_DIR[1]), SW_DIR[1] / Math.hypot(1, SW_DIR[1])];
    squeegee(ctx, [a[0] + lead[0] * 10, a[1] + lead[1] * 10], [b[0] + lead[0] * 10, b[1] + lead[1] * 10], lead,
      { beads: [{ t0: 0, t1: .3, color: PAL[cur.to].sky2 }, { t0: .3, t1: .55, color: PAL[cur.to].mid }, { t0: .55, t1: 1, color: PAL[cur.to].near }], roll: f / 30, handle: .25, seed: 9 });
  }
  ctx.restore();
}

// every on-screen text, with its screen box, for readcheck
export function texts(t) {
  const c = cam(t), out = [];
  const box = (id, text, x0, y0, x1, y1) => { const a = toScreen(c, x0, y0), b = toScreen(c, x1, y1); out.push({ id, text, x0: a[0], y0: a[1], x1: b[0], y1: b[1] }); };
  const { base, cur } = sweepState(t);
  if (t >= PULLS.find(p => p.id === 'head').t1 && !(cur)) box('head', HEAD[base], 330, 90, 1610, 230);
  for (const it of ITEMS) if (t >= it.t) {
    const b = { l1: [70, 800, 1000, 885], wa: [70, 900, 500, 966], p1: [560, 900, 800, 965], p2: [850, 900, 1100, 965], own: [70, 1010, 700, 1055] }[it.id];
    box(it.id, it.text, ...b);
  }
  if (t >= STUB.t1) box('stub', 'ALMISSA DIGITAL · WEBSITES FOR TOURISM · OMIŠ · CROATIA', 1460, 560, 1880, 1030);
  return out;
}
