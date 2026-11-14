// "SOLD! The Day Rome Was Auctioned" · Game Show Flat, vertical 1080×1920.
// Every scene and hit is placed from timing.json (the voice), snapped to the 120 BPM grid; events.json drives the score.
// render(t) is a pure function of t: scenes build their SVG once and update(t) only sets attributes.

// ---------------- basics ----------------
const NS = 'http://www.w3.org/2000/svg';
const K = {
  ol: '#1B1B1B', white: '#FFFFFF', cream: '#FFF6E5', yellow: '#FFD23F', orange: '#FF8C42', red: '#FF5A5F', crimson: '#E8384F',
  pink: '#FF8FB1', purple: '#6B4FBB', teal: '#3FB8AF', navy: '#26264A', sky: '#8ED1FC', green: '#5BD68A', wood: '#C98A52',
  woodD: '#8E5530', gold: '#FFC93C', goldD: '#E0A21E', lime: '#C6F16D',
};
const F = "'Fredoka'";
const OW = 8;
const SO = { stroke: K.ol, 'stroke-width': OW, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
function el(tag, attrs = {}, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function txt(parent, str, attrs) { const e = el('text', attrs, parent); e.textContent = str; return e; }
function tf(e, x = 0, y = 0, s = 1, r = 0, sy) { e.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${r.toFixed(2)}) scale(${s.toFixed(4)} ${(sy ?? s).toFixed(4)})`); }
function op(e, o) { e.setAttribute('opacity', Math.max(0, Math.min(1, o)).toFixed(3)); }
function show(e, v) { e.style.display = v ? '' : 'none'; }
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const E = {
  out: p => 1 - Math.pow(1 - p, 3), in: p => p * p * p,
  io: p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
  back: p => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
};
const popIn = (t, t0, d = 0.3) => t < t0 ? 0 : E.back(seg(t, t0, t0 + d));
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const mctx = document.createElement('canvas').getContext('2d');
function measure(str, size, weight = 700) { mctx.font = `${weight} ${size}px Fredoka`; return mctx.measureText(str).width; }
function gtext(parent, s, x, y, size, o = {}) {
  return txt(parent, s, { x, y, 'font-size': size, 'font-family': F, 'font-weight': o.weight || 700, fill: o.fill || K.white, stroke: o.stroke || K.ol,
    'stroke-width': o.sw ?? size * 0.14, 'paint-order': 'stroke', 'stroke-linejoin': 'round', 'text-anchor': o.anchor || 'middle', 'letter-spacing': o.ls || 0 });
}

// ---------------- the timeline (from the voice) ----------------
const T = await (await fetch('timing.json')).json();
const B = 60 / T.bpm;
const DUR = T.dur;
const LN = Object.fromEntries(T.lines.map(l => [l.id, l]));
const nrm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function wordT(lid, w, k = 0) { const ws = LN[lid].words.filter(x => nrm(x.w).startsWith(nrm(w))); return (ws[k] || ws[ws.length - 1] || { t0: LN[lid].t0 }).t0; }
const q8 = t => Math.round(t / (B / 2)) * (B / 2);               // a hit sits on the nearest eighth note
const hit = (lid, w, k = 0, min = 0) => Math.max(min, q8(wordT(lid, w, k)));
const CUT = T.lines.map(l => l.cut);
const LOOP = DUR - B;                                              // the last beat replays the first frame: a seamless loop

const EV = [], PUNCH = [], CUTS = [], SNAPS = [];
function ev(t, s, o = {}) { EV.push({ t: +t.toFixed(4), s, ...o }); }
function punch(t, a = 0.02) { PUNCH.push([t, a]); }
const frac = t => ((t / B) % 1 + 1) % 1;
const hopY = (t, h = 20, off = 0) => { const f = frac(t + off * B); return -h * 4 * f * (1 - f); };
const hitSq = (t, t0, amt = .2) => (t >= t0 && t < t0 + .35) ? 1 - amt * Math.exp(-(t - t0) * 14) * Math.cos((t - t0) * 30) : 1;
const dropY = (t, t0, d = 0.32) => t < t0 - d ? -2400 : t < t0 ? -1400 * (1 - E.in(seg(t, t0 - d, t0))) : 0;   // lands exactly on t0

// ---------------- sets ----------------
function bg(p, col) { return el('rect', { x: -300, y: -600, width: 1700, height: 3400, fill: col }, p); }
function stripes(p, col, w = 56, angle = -28) {
  const g = el('g', { transform: `rotate(${angle} 540 960)` }, p); let d = '';
  for (let x = -1800; x < 2900; x += w * 2) d += `M${x} -1600 h${w} v5200 h${-w} Z`;
  el('path', { d, fill: col }, g); return g;
}
function dots(p, col, step = 72, r = 11) {
  let d = ''; for (let y = 0; y < 2000; y += step) for (let x = ((y / step) % 2) * step / 2; x < 1120; x += step) d += `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  return el('path', { d, fill: col }, p);
}
function rays(p, n, col) {
  const g = el('g', {}, p);
  for (let i = 0; i < n; i += 2) { const a = i / n * Math.PI * 2, da = Math.PI / n; el('path', { d: `M0 0 L${Math.cos(a - da) * 2600} ${Math.sin(a - da) * 2600} L${Math.cos(a + da) * 2600} ${Math.sin(a + da) * 2600} Z`, fill: col }, g); }
  return g;
}
const FLOOR = 1290;
function floor(p, col) { el('rect', { x: -300, y: FLOOR, width: 1700, height: 1400, fill: col }, p); el('rect', { x: -60, y: FLOOR + 78, width: 1200, height: 18, fill: K.ol, opacity: .22 }, p); el('line', { x1: -60, y1: FLOOR, x2: 1140, y2: FLOOR, stroke: K.ol, 'stroke-width': 8 }, p); }
function starPath(n, r1, r2) { let d = ''; for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? r2 : r1; d += `${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`; } return d + 'Z'; }

// ---------------- UI kit ----------------
function burst(p, x, y, t0, col = K.yellow, size = 1) {
  const g = el('g', {}, p);
  const ring = el('circle', { r: 50, fill: 'none', stroke: K.white, 'stroke-width': 10 }, g);
  el('path', { d: starPath(8, 70, 28), fill: col, ...SO, 'stroke-width': 6 }, g);
  const ln = el('g', { stroke: K.ol, 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + .2; el('line', { x1: Math.cos(a) * 90, y1: Math.sin(a) * 90, x2: Math.cos(a) * 130, y2: Math.sin(a) * 130 }, ln); }
  op(g, 0);
  return t => { const pp = (t - t0) / .3; if (pp < 0 || pp > 1) { op(g, 0); return; } op(g, 1 - pp * pp); tf(g, x, y, size * (.55 + .7 * E.out(pp)), pp * 30); ring.setAttribute('r', 50 + 60 * pp); ring.setAttribute('stroke-width', 10 * (1 - pp)); };
}
function judge(p, word, x, y, t0, t1, col = K.pink, size = 170, rot = -6) {
  const g = el('g', {}, p); gtext(g, word, 0, size * .36, size, { fill: col, sw: size * .15 }); op(g, 0);
  return t => { if (t < t0 || t >= t1) { op(g, 0); return; } op(g, 1); tf(g, x, y - 16 * E.out(seg(t, t0, t1)), E.back(seg(t, t0, t0 + .25)) * (1 + .03 * Math.sin((t - t0) * 9)), rot); };
}
function stampEl(p, str, { size = 70, color = '#D7263D', pad = 30, border = 9 } = {}) {
  const g = el('g', {}, p), inner = el('g', { filter: 'url(#stampInk)' }, g);
  const w = measure(str, size) + pad * 2, h = size * 1.1 + pad * 1.2;
  el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 18, fill: 'none', stroke: color, 'stroke-width': border }, inner);
  txt(inner, str, { x: 0, y: size * .36, 'font-size': size, 'font-family': F, 'font-weight': 700, fill: color, 'text-anchor': 'middle' });
  return { g, w, h };
}
function stampAnim(s, t, t0, x, y, rot) {
  if (t < t0 - .09) { op(s.g, 0); return; }
  const pp = seg(t, t0 - .09, t0), after = Math.max(0, t - t0), bounce = 1 + .05 * Math.sin(after * 30) * Math.exp(-after * 9);
  op(s.g, pp < 1 ? .3 + .7 * pp : .95); tf(s.g, x, y, lerp(2.6, 1, E.in(pp)) * bounce, rot);
}
function coin(p, r = 26) { const g = el('g', {}, p); el('circle', { r, fill: K.gold, ...SO, 'stroke-width': 6 }, g); el('circle', { r: r * .6, fill: 'none', stroke: K.goldD, 'stroke-width': 5 }, g); return g; }
function coinRain(p, x0, x1, t0, n, seed) {
  const R = rng(seed), cs = [];
  for (let i = 0; i < n; i++) cs.push({ g: coin(p, 20 + R() * 10), x: lerp(x0, x1, R()), d: R() * .35, sp: 900 + R() * 600, rot: (R() - .5) * 900, y0: -80 - R() * 200 });
  return t => cs.forEach(c => { const tt = t - t0 - c.d; if (tt < 0) { show(c.g, false); return; } show(c.g, true); const y = c.y0 + c.sp * tt + 900 * tt * tt; tf(c.g, c.x, Math.min(y, FLOOR - 20), 1, c.rot * tt, Math.abs(Math.cos(tt * 9)) * .9 + .1); });
}
function confetti(p, t0, n, seed) {
  const R = rng(seed), cols = [K.yellow, K.teal, K.white, K.orange, K.lime, K.purple], ps = [];
  for (let i = 0; i < n; i++) { const g = el('rect', { x: -12, y: -7, width: 24, height: 14, rx: 3, fill: cols[i % cols.length], stroke: K.ol, 'stroke-width': 3 }, p); ps.push({ g, x: R() * 1080, vx: (R() - .5) * 200, d: R() * .3, sp: 300 + R() * 400, r: R() * 360 }); }
  return t => ps.forEach(c => { const tt = t - t0 - c.d; if (tt < 0) { show(c.g, false); return; } show(c.g, true); tf(c.g, c.x + c.vx * tt + Math.sin(tt * 6 + c.r) * 30, -40 + c.sp * tt + 200 * tt * tt, 1, c.r + tt * 400, Math.cos(tt * 8 + c.r)); });
}
function puffCloud(p) {
  const g = el('g', {}, p);
  for (const [x, y, r] of [[-110, -10, 80], [0, -60, 105], [110, -10, 80], [-60, 50, 75], [60, 50, 75]]) el('circle', { cx: x, cy: y, r, fill: K.white, ...SO }, g);
  for (const [x, y, s] of [[-150, -110, .5], [150, -120, .45], [0, -190, .4]]) el('path', { d: starPath(5, 60 * s, 26 * s), fill: K.yellow, ...SO, 'stroke-width': 5, transform: `translate(${x} ${y})` }, g);
  return g;
}

// ---------------- characters (one bean construction for the cast) ----------------
function laurel(p, col, cy = -150, rx = 86, ry = 30) {
  const g = el('g', {}, p);
  for (let i = 0; i <= 12; i++) { const a = Math.PI + i / 12 * Math.PI, x = Math.cos(a) * rx, y = cy + Math.sin(a) * ry; el('ellipse', { cx: x, cy: y, rx: 15, ry: 9, fill: col, stroke: K.ol, 'stroke-width': 4, transform: `rotate(${(a * 180 / Math.PI + 90 + (i < 6 ? -30 : 30)).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})` }, g); }
  return g;
}
function bean(p, o) {
  const { color, belly = null, name = null, acc = null, sash = null, tagCol = K.ol, paddle = null, spear = false, crest = K.crimson } = o;
  const g = el('g', {}, p), body = el('g', {}, g);
  const mkArm = () => { const a = el('g', {}, body); el('rect', { x: -14, y: -4, width: 28, height: 70, rx: 14, fill: color, ...SO }, a); el('circle', { cx: 0, cy: 70, r: 17, fill: K.white, ...SO, 'stroke-width': 6 }, a); return a; };
  const armL = mkArm(), armR = mkArm();
  if (spear) { const s = el('g', {}, armR); el('line', { x1: 0, y1: 160, x2: 0, y2: -150, stroke: K.ol, 'stroke-width': 9, 'stroke-linecap': 'round' }, s); el('path', { d: 'M -16 -140 L 0 -190 L 16 -140 Z', fill: '#C3CAD9', ...SO, 'stroke-width': 5 }, s); s.setAttribute('transform', 'translate(0 70)'); }
  let paddleText = null, paddleG = null;
  if (paddle) { const s = el('g', { transform: 'translate(0 70)' }, armR); paddleG = s; el('rect', { x: -9, y: -10, width: 18, height: 110, rx: 9, fill: K.wood, ...SO, 'stroke-width': 5 }, s); el('circle', { cx: 0, cy: 150, r: 62, fill: paddle, ...SO }, s); paddleText = txt(s, '', { x: 0, y: 162, 'font-size': 34, 'font-family': F, 'font-weight': 700, fill: K.ol, 'text-anchor': 'middle', transform: 'rotate(180 0 150)' }); }
  for (const x of [-34, 34]) el('ellipse', { cx: x, cy: -8, rx: 30, ry: 15, fill: color, ...SO }, body);
  el('path', { d: 'M -80 -20 C -88 -112 -52 -172 0 -172 C 52 -172 88 -112 80 -20 C 72 -2 -72 -2 -80 -20 Z', fill: color, ...SO }, body);
  if (belly) el('ellipse', { cx: 0, cy: -48, rx: 44, ry: 32, fill: belly }, body);
  if (sash) el('path', { d: 'M -64 -132 L -40 -152 L 80 -36 L 62 -10 Z', fill: sash, ...SO, 'stroke-width': 6 }, body);
  const eyes = el('g', {}, body);
  for (const x of [-28, 28]) { el('ellipse', { cx: x, cy: -112, rx: 11, ry: 16, fill: K.ol }, eyes); el('circle', { cx: x + 4, cy: -118, r: 4, fill: K.white }, eyes); }
  const eyesX = el('path', { d: 'M -40 -124 L -16 -100 M -16 -124 L -40 -100 M 16 -124 L 40 -100 M 40 -124 L 16 -100', stroke: K.ol, 'stroke-width': 7, 'stroke-linecap': 'round' }, body);
  const eyesUp = el('path', { d: 'M -40 -108 Q -28 -124 -16 -108 M 16 -108 Q 28 -124 40 -108', stroke: K.ol, 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, body);
  for (const x of [-54, 54]) el('ellipse', { cx: x, cy: -86, rx: 14, ry: 8, fill: K.pink, opacity: .85 }, body);
  const mC = el('path', { d: 'M -14 -82 Q 0 -70 14 -82', fill: 'none', stroke: K.ol, 'stroke-width': 6, 'stroke-linecap': 'round' }, body);
  const mO = el('g', {}, body); el('ellipse', { cx: 0, cy: -76, rx: 17, ry: 19, fill: K.ol }, mO); el('ellipse', { cx: 0, cy: -66, rx: 10, ry: 7, fill: K.red }, mO);
  const sweat = el('path', { d: 'M 86 -150 C 70 -124 72 -104 88 -102 C 104 -104 104 -124 86 -150 Z', fill: K.sky, ...SO, 'stroke-width': 5 }, body);
  if (acc === 'helmet' || acc === 'general') {
    const big = acc === 'general';
    el('path', { d: `M -62 -196 C -46 ${big ? -300 : -268} 46 ${big ? -300 : -268} 62 -196 C 36 -232 -36 -232 -62 -196 Z`, fill: big ? K.white : crest, ...SO, 'stroke-width': 6 }, body);
    el('path', { d: 'M -84 -138 C -84 -215 84 -215 84 -138 Z', fill: big ? '#C3CAD9' : K.gold, ...SO }, body);
    el('rect', { x: -94, y: -150, width: 188, height: 18, rx: 9, fill: big ? '#9AA3B5' : K.goldD, ...SO, 'stroke-width': 6 }, body);
  }
  const crown = el('g', {}, g);                                // the laurel wreath lives outside the body so it can fly off
  if (acc === 'laurel') laurel(crown, K.green);
  let tag = null;
  if (name) {
    tag = el('g', {}, g); const w = measure(name, 34) + 36;
    el('rect', { x: -w / 2, y: 16, width: w, height: 50, rx: 25, fill: tagCol, stroke: K.white, 'stroke-width': 4 }, tag);
    txt(tag, name, { x: 0, y: 52, 'font-size': 34, 'font-family': F, 'font-weight': 700, fill: K.white, 'text-anchor': 'middle' });
  }
  const c = { g, body, armL, armR, eyes, eyesX, eyesUp, mC, mO, sweat, tag, crown, paddleText, paddleG };
  pose(c, {}); return c;
}
function pose(c, { hey = 0, heyR = null, open = false, sq = 1, lean = 0, face = null, sweat = false, crown = null }) {
  const aL = lerp(18, 158, hey), aR = lerp(18, 158, heyR ?? hey);
  c.armL.setAttribute('transform', `translate(-72 -98) rotate(${aL})`);
  c.armR.setAttribute('transform', `translate(72 -98) rotate(${-aR})`);
  const bt = `rotate(${lean}) scale(${(1 / Math.sqrt(sq)).toFixed(3)} ${sq.toFixed(3)})`;
  c.body.setAttribute('transform', bt);
  if (crown) c.crown.setAttribute('transform', crown); else c.crown.setAttribute('transform', bt);
  show(c.mO, open); show(c.mC, !open); show(c.sweat, sweat); if (c.paddleG) show(c.paddleG, aR > 90);
  show(c.eyes, !face); show(c.eyesX, face === 'x'); show(c.eyesUp, face === 'up');
}
const CAST = {
  emperor: p => bean(p, { color: K.cream, belly: '#F2E3C6', acc: 'laurel', sash: K.purple, name: 'EMPEROR' }),
  guard: (p, n) => bean(p, { color: K.red, belly: '#FFB3B5', acc: 'helmet', spear: true, name: n }),
  sulp: p => bean(p, { color: K.pink, belly: '#FFD1E0', sash: K.white, name: 'FATHER-IN-LAW', paddle: K.cream }),
  jul: (p, o = {}) => bean(p, { color: K.yellow, belly: '#FFF0B3', sash: K.purple, name: o.name ?? 'SENATOR', paddle: o.paddle ? K.cream : null }),
  general: p => bean(p, { color: K.orange, belly: '#FFD0AD', acc: 'general', name: 'RIVAL GENERAL', tagCol: '#7E1628' }),
  soldier: p => bean(p, { color: K.orange, belly: '#FFD0AD', acc: 'helmet', crest: K.white, spear: true }),
};

// ---------------- props ----------------
function podium(p) {
  const g = el('g', {}, p);
  el('path', { d: 'M -200 0 L -172 -330 L 172 -330 L 200 0 Z', fill: K.wood, ...SO }, g);
  el('rect', { x: -128, y: -280, width: 256, height: 200, rx: 20, fill: K.woodD, ...SO, 'stroke-width': 6 }, g);
  gtext(g, 'LOT 1', 0, -160, 60, { fill: K.yellow, sw: 9 });
  el('rect', { x: -226, y: -362, width: 452, height: 40, rx: 14, fill: K.woodD, ...SO }, g);
  return g;
}
function cushion(p) {
  const g = el('g', {}, p);
  el('path', { d: 'M -150 0 C -160 -50 -120 -78 0 -78 C 120 -78 160 -50 150 0 C 100 14 -100 14 -150 0 Z', fill: K.purple, ...SO }, g);
  for (const x of [-150, 150]) el('path', { d: `M ${x} -6 l ${x < 0 ? -20 : 20} 40 l ${x < 0 ? 26 : -26} 0 Z`, fill: K.gold, ...SO, 'stroke-width': 5 }, g);
  laurel(g, K.gold, -86, 96, 34);
  return g;
}
function priceTag(p, l1, l2, s2 = 42) {
  const g = el('g', {}, p);
  el('line', { x1: 0, y1: -70, x2: -60, y2: -150, stroke: K.ol, 'stroke-width': 5 }, g);
  el('path', { d: 'M -80 -70 L 80 -70 L 110 0 L 80 70 L -80 70 Z', fill: K.cream, ...SO }, g);
  el('circle', { cx: 0, cy: -46, r: 9, fill: K.ol }, g);
  gtext(g, l1, 0, 12, 50, { fill: K.crimson, sw: 0 });
  gtext(g, l2, 0, 56, Math.min(s2, 160 / measure(l2, 1)), { fill: K.ol, sw: 0 });
  return g;
}
function gavel(p) {
  const g = el('g', {}, p);
  el('rect', { x: -250, y: -13, width: 250, height: 26, rx: 13, fill: K.wood, ...SO, 'stroke-width': 6 }, g);
  el('rect', { x: -330, y: -46, width: 160, height: 92, rx: 26, fill: K.woodD, ...SO }, g);
  for (const x of [-300, -200]) el('rect', { x, y: -46, width: 16, height: 92, fill: K.gold, stroke: K.ol, 'stroke-width': 4 }, g);
  return g;
}
function throne(p) {
  const g = el('g', {}, p);
  el('path', { d: 'M -150 -150 L -150 -430 C -150 -540 150 -540 150 -430 L 150 -150 Z', fill: K.gold, ...SO }, g);
  el('path', { d: 'M -100 -170 L -100 -410 C -100 -480 100 -480 100 -410 L 100 -170 Z', fill: K.purple, ...SO, 'stroke-width': 6 }, g);
  el('path', { d: starPath(5, 30, 13), fill: K.gold, ...SO, 'stroke-width': 4, transform: 'translate(0 -505)' }, g);
  el('rect', { x: -180, y: -175, width: 360, height: 175, rx: 18, fill: K.goldD, ...SO }, g);
  el('rect', { x: -200, y: -200, width: 400, height: 46, rx: 20, fill: K.gold, ...SO }, g);
  for (const sx of [-1, 1]) el('rect', { x: sx * 190 - 22, y: -300, width: 44, height: 120, rx: 18, fill: K.gold, ...SO, 'stroke-width': 6 }, g);
  return g;
}
const SEAT = -196;   // a seated bean's origin, in throne units
function sign(p) {
  const g = el('g', {}, p);
  el('rect', { x: -14, y: 120, width: 28, height: 420, rx: 12, fill: K.wood, ...SO }, g);
  el('rect', { x: -270 + 14, y: -150 + 14, width: 540, height: 300, rx: 30, fill: K.ol }, g);
  el('rect', { x: -270, y: -150, width: 540, height: 300, rx: 30, fill: K.cream, ...SO, 'stroke-width': 10 }, g);
  gtext(g, 'FOR SALE', 0, 18, 118, { fill: K.crimson, sw: 14 });
  gtext(g, 'HIGHEST BID WINS', 0, 100, 46, { fill: K.ol, sw: 0 });
  return g;
}
function counter(p, label) {
  const g = el('g', {}, p);
  el('rect', { x: -220 + 12, y: -100 + 12, width: 440, height: 170, rx: 30, fill: K.ol }, g);
  el('rect', { x: -220, y: -100, width: 440, height: 170, rx: 30, fill: K.navy, ...SO }, g);
  const num = gtext(g, '0', 0, 18, 112, { fill: K.white, sw: 0 });
  el('rect', { x: -170, y: 66, width: 340, height: 54, rx: 27, fill: K.cream, ...SO, 'stroke-width': 6 }, g);
  txt(g, label, { x: 0, y: 104, 'font-size': 28, 'font-family': F, 'font-weight': 700, fill: K.ol, 'text-anchor': 'middle' });
  return { g, num };
}
function calendar(p) {
  const g = el('g', {}, p);
  el('rect', { x: -190 + 14, y: -200 + 14, width: 380, height: 400, rx: 30, fill: K.ol }, g);
  el('rect', { x: -190, y: -200, width: 380, height: 400, rx: 30, fill: K.white, ...SO }, g);
  el('path', { d: 'M -190 -90 L -190 -170 Q -190 -200 -160 -200 L 160 -200 Q 190 -200 190 -170 L 190 -90 Z', fill: K.crimson, ...SO }, g);
  gtext(g, 'DAY', 0, -122, 62, { fill: K.white, sw: 9 });
  for (const x of [-110, 0, 110]) el('rect', { x: x - 10, y: -228, width: 20, height: 56, rx: 10, fill: '#C3CAD9', ...SO, 'stroke-width': 5 }, g);
  const num = txt(g, '1', { x: 0, y: 140, 'font-size': 200, 'font-family': F, 'font-weight': 700, fill: K.ol, 'text-anchor': 'middle' });
  const flyer = el('g', {}, g);
  el('rect', { x: -190, y: -90, width: 380, height: 290, rx: 20, fill: K.white, ...SO, 'stroke-width': 6 }, flyer);
  const fnum = txt(flyer, '', { x: 0, y: 140, 'font-size': 200, 'font-family': F, 'font-weight': 700, fill: '#B9BFCC', 'text-anchor': 'middle' });
  return { g, num, flyer, fnum };
}
function senateHand(p) {
  const g = el('g', {}, p);
  el('rect', { x: -26, y: -330, width: 52, height: 220, rx: 22, fill: K.wood, ...SO }, g);
  el('circle', { cx: 0, cy: -300, r: 64, fill: K.cream, ...SO }, g);
  el('rect', { x: -150, y: -120, width: 300, height: 90, rx: 18, fill: K.woodD, ...SO }, g);
  txt(g, 'SENATE', { x: 0, y: -62, 'font-size': 40, 'font-family': F, 'font-weight': 700, fill: K.yellow, 'text-anchor': 'middle' });
  el('rect', { x: -160, y: -34, width: 320, height: 34, rx: 10, fill: '#D7263D', ...SO, 'stroke-width': 6 }, g);
  return g;
}

// ---------------- scenes ----------------
const world = document.getElementById('world'), hud = document.getElementById('hud'), cam = document.getElementById('cam'), flash = document.getElementById('flash');
const scenes = [];
function scene(t0, t1, build) { const g = el('g', {}, world); const s = { g, t0, t1, fx: [], texts: [] }; s.update = build(g, s); scenes.push(s); if (t0 > 0) CUTS.push(t0); return s; }
// a text the viewer must read: box in stage units (screen space, punch ignored), visible window
const TXT = [];
function reading(id, text, box, a, b, pass = false) { TXT.push({ id, text, box, a, b, pass }); }

const S2 = CUT[1], S3 = CUT[2], S4 = CUT[3], S5 = CUT[4], S7 = CUT[6], S8 = CUT[7];
const S6 = Math.max(CUT[5], Math.round(wordT('L6', 'won') / B) * B);   // SOLD! lands on the cut itself
const S7b = Math.max(S7 + 4 * B, Math.floor((wordT('L7', 'and') - .05) / B) * B);   // the red set: on the beat before "and Julianus"

function buildAll() {
  // ===== 1 · COLD OPEN: an empire on the auction block (navy, sunburst) =====
  const s1 = scene(0, S2, (g, s) => {
    bg(g, K.navy); const r = rays(g, 28, '#32326A'); floor(g, '#1A1A38');
    el('ellipse', { cx: 540, cy: FLOOR + 6, rx: 330, ry: 46, fill: '#3B3B78' }, g);
    const t1 = el('g', {}, g); gtext(t1, 'WHO WANTS', 0, 0, 104, { fill: K.white, sw: 16 });
    const t2 = el('g', {}, g); gtext(t2, 'AN EMPIRE?', 0, 0, 136, { fill: K.yellow, sw: 19 });
    const pod = el('g', {}, g); podium(pod);
    const cu = el('g', {}, g); cushion(cu);
    const tag = el('g', {}, g); priceTag(tag, 'ROME', '???');
    const bidL = el('g', {}, g), bidR = el('g', {}, g);
    const bl = bean(bidL, { color: K.teal, belly: '#9FE3DD', paddle: K.cream }), br = bean(bidR, { color: K.pink, belly: '#FFD1E0', paddle: K.cream });
    const gv = el('g', {}, g); gavel(gv);
    const yr = el('g', {}, g);
    el('rect', { x: -150 + 10, y: -58 + 10, width: 300, height: 116, rx: 26, fill: K.ol }, yr);
    el('rect', { x: -150, y: -58, width: 300, height: 116, rx: 26, fill: K.crimson, ...SO, 'stroke-width': 7 }, yr);
    gtext(yr, '193 AD', 0, 24, 70, { fill: K.white, sw: 11 });
    const tYear = hit('L1', '193', 0, 0.25), tSold = hit('L1', 'sold'), tAuc = hit('L1', 'auction');
    ev(tYear, 'sticker'); ev(tSold, 'slam'); punch(tSold, .055); ev(tAuc, 'pop', { f: 1000 }); ev(tAuc + B / 2, 'pop', { f: 1300 }); ev(tAuc, 'cheer');
    s.fx.push(burst(g, 640, 856, tSold, K.yellow, 1.4), judge(g, 'SOLD!', 540, 735, tSold, S2, K.pink, 210, -7));
    reading('title', 'WHO WANTS AN EMPIRE?', [150, 220, 930, 500], 0, S2);
    reading('tag', 'ROME ???', [740, 880, 990, 1080], 0, S2);
    reading('year', '193 AD', [390, 530, 690, 650], tYear, S2);
    return t => {
      r.setAttribute('transform', `translate(540 880) rotate(${(t * 8).toFixed(2)})`);
      tf(t1, 540, 300 + Math.sin(t * 5) * 4, 1, -2); tf(t2, 540, 448 + Math.sin(t * 5 + 1) * 5, 1 + .015 * Math.exp(-frac(t) * 6), 2);
      const sq = hitSq(t, tSold, .12);
      tf(pod, 540, FLOOR, 1.2, 0, 1.2 * sq); tf(cu, 540, FLOOR - 434 * sq + hopY(t, 6), 1.2);
      tf(tag, 850, 980 + Math.sin(t * 3) * 4, 1.1, 8 + Math.sin(t * 2.4) * 4);
      // gavel: raised, then slams exactly on "sold", then rests
      const a = t < tSold - .14 ? 35 + Math.sin(t * 6) * 3 : t < tSold ? lerp(35, 0, E.in(seg(t, tSold - .14, tSold))) : 6 * Math.exp(-(t - tSold) * 8) * Math.cos((t - tSold) * 30);
      tf(gv, 1000, 830, 1.15, a);
      const heyA = t >= tAuc && t < tAuc + .6;
      tf(bidL, 130, FLOOR + 40 + hopY(t, 18), 1.0); pose(bl, { hey: heyA ? 1 : 0, heyR: heyA ? 1 : .2, open: heyA, sq: hitSq(t, tSold) });
      tf(bidR, 950, FLOOR + 40 + hopY(t, 18, .5), 1.0); pose(br, { hey: t >= tAuc + B / 2 && t < tAuc + B / 2 + .6 ? 1 : 0, open: t >= tAuc + B / 2 && t < tAuc + 1.1, sq: hitSq(t, tSold) });
      const py = popIn(t, tYear); op(yr, t >= tYear ? 1 : 0); tf(yr, 540, 588, py, -5);
      s.fx.forEach(f => f(t));
    };
  });
  window.__s1 = s1;

  // ===== 2 · ROUND 1: the throne (crimson stripes) =====
  scene(S2, S3, (g, s) => {
    bg(g, K.crimson); stripes(g, '#F0566A'); floor(g, '#B82A3E');
    const th = el('g', {}, g); throne(th);
    const emW = el('g', {}, g); const em = CAST.emperor(emW);
    const gL = el('g', {}, g), gR = el('g', {}, g); const gl = CAST.guard(gL, 'GUARD'), gr = CAST.guard(gR, 'GUARD');
    const cloud = el('g', {}, g); puffCloud(cloud);
    const wr = el('g', {}, g); laurel(wr, K.green, 0, 70, 24);
    const tG = hit('L2', 'guards', 0, S2 + B), tG2 = tG + B / 2, tK = hit('L2', 'killed', 0, tG2 + B / 2), tE = Math.max(tK + B, hit('L2', 'emperor'));
    ev(tG, 'land'); ev(tG2, 'land'); ev(tK, 'fight'); ev(tE, 'poof'); ev(tE + .02, 'boing');
    for (let k = 0; tK + k * B / 4 < tE - .05; k++) { ev(tK + k * B / 4, 'pop', { f: 500 + 200 * (k % 3) }); punch(tK + k * B / 4, .012); }
    s.fx.push(judge(g, 'UH-OH!', 540, 420, tE, S3, K.yellow, 160, 6));
    reading('emperorTag', 'EMPEROR', [420, 1010, 660, 1110], S2, tK, true);
    return t => {
      const thx = 540, sc = 1.45;
      tf(th, thx, FLOOR, sc, 0, hitSq(t, tE, .1) * sc);
      const gone = t >= tK + .15;
      show(emW, !gone); tf(emW, thx, FLOOR + SEAT * sc + hopY(t, 8), 1.4);
      pose(em, { open: t >= tG && t < tK, face: t >= tK - .05 ? 'up' : null, sweat: t >= tG });
      const lean = t >= tK - B / 2 && t < tE ? 1 : 0;
      tf(gL, lerp(150, 330, lean), FLOOR + 30 + dropY(t, tG) + hopY(t, 16), 1.3); pose(gl, { hey: lean, open: lean > 0, sq: hitSq(t, tG), lean: 14 * lean });
      tf(gR, lerp(930, 750, lean), FLOOR + 30 + dropY(t, tG2) + hopY(t, 16, .5), 1.3, 0); pose(gr, { hey: lean, open: lean > 0, sq: hitSq(t, tG2), lean: -14 * lean });
      const cOn = t >= tK && t < tE;
      show(cloud, cOn); tf(cloud, thx + Math.sin(t * 40) * 12, 960 + Math.cos(t * 33) * 10, 2.0 * (1 + .06 * Math.sin(t * 50)), Math.sin(t * 20) * 6);
      // the wreath drops onto the empty seat
      const wy = t < tE ? -400 : lerp(700, FLOOR + SEAT * sc - 30, E.out(seg(t, tE, tE + .35)));
      show(wr, t >= tE); tf(wr, thx + 30 * Math.exp(-(t - tE) * 4) * Math.sin((t - tE) * 14), wy, 1.5, -10 + 20 * Math.exp(-(t - tE) * 3) * Math.sin((t - tE) * 12));
      s.fx.forEach(f => f(t));
    };
  });

  // ===== 3 · FOR SALE (tangerine dots) =====
  scene(S3, S4, (g, s) => {
    bg(g, '#FFB870'); dots(g, '#FFCB94'); floor(g, '#E08A4A');
    const th = el('g', {}, g); throne(th);
    const wr = el('g', {}, g); laurel(wr, K.green, 0, 70, 24);
    const tagT = el('g', {}, g); priceTag(tagT, '???', 'BIDS');
    const gW = el('g', {}, g); const gd = CAST.guard(gW, 'GUARD');
    const sg = el('g', {}, g); sign(sg);
    const gW2 = el('g', {}, g); const g2 = CAST.guard(gW2, 'GUARD');
    const tS = S3, tTh = hit('L3', 'throne', 0, S3 + B), tHi = hit('L3', 'highest', 0, tTh + B / 2);
    ev(tS + .02, 'sticker'); ev(tTh, 'ding'); punch(tTh, .03); ev(tHi, 'coins'); punch(tHi, .04);
    s.fx.push(coinRain(g, 520, 1020, tHi, 14, 3), burst(g, 820, 1000, tTh, K.yellow, 1));
    reading('sign', 'FOR SALE', [50, 360, 610, 560], tS, S4); reading('sign2', 'HIGHEST BID WINS', [120, 560, 540, 640], tS, S4);
    return t => {
      tf(th, 820, FLOOR, 1.25, 0, 1.25 * hitSq(t, tTh, .12)); tf(wr, 820, FLOOR + (SEAT - 30) * 1.25 + hopY(t, 10), 1.35, -10);
      tf(tagT, 960, 760, .9, 10 + Math.sin(t * 3) * 6);
      tf(gW, 250, FLOOR + 40 + hopY(t, 14), 1.35); pose(gd, { hey: .8, heyR: .2, open: frac(t) < .4 });
      const sp = popIn(t, tS, .3); tf(sg, 330, 520 + hopY(t, 6), sp * (1 + .03 * Math.exp(-frac(t) * 6)), -4 + Math.sin(t * 4) * 2);
      tf(gW2, 640, FLOOR + 60 + hopY(t, 22, .5), 1.15); pose(g2, { hey: t >= tHi ? 1 : 0, open: t >= tHi, sq: hitSq(t, tHi) });
      s.fx.forEach(f => f(t));
    };
  });

  // ===== 4–5 · ROUND 2: the bidding war (split stage) =====
  scene(S4, S6, (g, s) => {
    const L = el('g', { 'clip-path': 'url(#leftHalf)' }, g), R = el('g', { 'clip-path': 'url(#rightHalf)' }, g);
    bg(L, K.teal); stripes(L, '#55C8BF', 56, -28); floor(L, '#2B8F88');
    const rDark = el('g', {}, R); bg(rDark, '#3D2B80'); dots(rDark, '#4A3792'); floor(rDark, '#2E2066');
    const rLit = el('g', {}, R); bg(rLit, K.purple); dots(rLit, '#7D63CC'); floor(rLit, '#4E3799');
    el('path', { d: 'M 540 -40 L 570 300 L 510 600 L 575 900 L 505 1200 L 560 1500 L 520 1960', fill: 'none', stroke: K.ol, 'stroke-width': 14, 'stroke-linejoin': 'round' }, g);
    const vs = el('g', {}, g); el('circle', { r: 74, fill: K.yellow, ...SO }, vs); gtext(vs, 'VS', 0, 22, 66, { fill: K.crimson, sw: 10 });
    const cL = counter(g, 'SESTERCES / SOLDIER'), cR = counter(g, 'SESTERCES / SOLDIER');
    const sW = el('g', {}, g); const su = CAST.sulp(sW);
    const jW = el('g', {}, g); const ju = CAST.jul(jW, { paddle: true });
    const np = el('g', {}, g);
    el('rect', { x: -230 + 10, y: -46 + 10, width: 460, height: 92, rx: 46, fill: K.ol }, np);
    el('rect', { x: -230, y: -46, width: 460, height: 92, rx: 46, fill: K.cream, ...SO, 'stroke-width': 7 }, np);
    txt(np, 'DIDIUS JULIANUS', { x: 0, y: 16, 'font-size': 46, 'font-family': F, 'font-weight': 700, fill: K.purple, 'text-anchor': 'middle' });
    su.paddleText.textContent = '20,000'; ju.paddleText.textContent = '25,000';
    const tF = hit('L4', 'father', 0, S4 + B / 2), tEv = hit('L4', 'every'), t20 = Math.max(tEv + 2 * B, hit('L4', '20,000')), tCo = Math.max(t20 + B / 2, hit('L4', 'coins'));
    const tSen = Math.max(S5 + B / 2, hit('L5', 'senator')), tBid = hit('L5', 'julianus', 0, tSen + B), t25 = Math.max(tBid + B, hit('L5', 'bid'));
    ev(tF, 'sticker'); ev(t20, 'slam'); punch(t20, .045); ev(tCo, 'coins'); ev(S5, 'lights'); ev(tSen, 'land'); ev(tSen + .02, 'sticker');
    ev(t25, 'bigslam'); punch(t25, .06); SNAPS.push([t25, t25 + B, 1.55, 732, 600]); ev(t25 + .05, 'gasp'); ev(t25 + .1, 'coins');
    for (let k = 0, tt = tEv; tt < t20 - .01; k++, tt += B / 4) ev(tt, 'tick', { f: 900 + k * 60 });
    for (let k = 0, tt = tBid; tt < t25 - .01; k++, tt += B / 4) ev(tt, 'tick', { f: 1300 + k * 90 });
    s.fx.push(burst(g, 270, 520, t20, K.yellow, 1.2), coinRain(L, 0, 540, tCo, 16, 7), burst(g, 810, 520, t25, K.yellow, 1.5), coinRain(R, 540, 1080, t25 + .1, 22, 9),
      judge(g, 'OUTBID!', 270, 740, t25 + B / 2, S6, K.yellow, 100, -8));
    reading('cL', '20,000 SESTERCES / SOLDIER', [50, 420, 490, 640], t20, S6);
    reading('p25', '25,000', [590, 420, 1030, 590], t25, S6);
    reading('tagS', 'FATHER-IN-LAW', [100, 1310, 440, 1390], tF, S6);
    reading('name', 'DIDIUS JULIANUS', [575, 690, 1045, 790], tSen, S6);
    return t => {
      const lit = t >= S5; show(rDark, !lit); show(rLit, lit);
      tf(vs, 540, 900 + Math.sin(t * 6) * 6, 1 + .08 * Math.exp(-frac(t) * 7), Math.sin(t * 3) * 8);
      const vL = t < tEv ? 0 : t < t20 ? Math.round(20000 * E.out(seg(t, tEv, t20)) / 100) * 100 : 20000;
      cL.num.textContent = vL.toLocaleString('en-US'); tf(cL.g, 270, 520, popIn(t, S4 + .02) * hitSq(t, t20, .25), -3);
      const vR = t < tBid ? 20000 : t < t25 ? Math.round(lerp(20000, 25000, E.out(seg(t, tBid, t25))) / 100) * 100 : 25000;
      cR.num.textContent = t < tSen ? '–' : vR.toLocaleString('en-US'); show(cR.g, t >= S5); tf(cR.g, 810, 520, popIn(t, S5 + .02) * hitSq(t, t25, .3), 3);
      // Sulpicianus: tag at "father-in-law", paddle up on 20,000, shocked on 25,000
      show(su.tag, t >= tF); tf(sW, 270, FLOOR + hopY(t, 14), 1.4);
      pose(su, { heyR: t >= t20 && t < t25 ? 1 : .15, hey: 0, open: (t >= t20 && t < t20 + .5) || t >= t25, face: t >= t25 ? 'x' : null, sweat: t >= t25, sq: hitSq(t, t20) * hitSq(t, t25, .15), lean: t >= t25 ? -8 : 0 });
      // Julianus drops in at "senator", raises 25,000
      tf(jW, 810, FLOOR + dropY(t, tSen) + hopY(t, 14, .5), 1.4); show(jW, t >= tSen - .4);
      pose(ju, { heyR: t >= t25 ? 1 : .15, open: t >= t25 && t < t25 + .7, sq: hitSq(t, tSen) * hitSq(t, t25), lean: t >= t25 ? 6 : 0 });
      op(np, t >= tSen ? 1 : 0); tf(np, 810, 740 + Math.sin(t * 4) * 3, popIn(t, tSen) * .98, 2);
      // the guards watch from the front row and gasp
      s.fx.forEach(f => f(t));
    };
  });

  // ===== 6 · SOLD! (pink sunburst) =====
  const TH = 360, TS = 1.35;
  scene(S6, S7, (g, s) => {
    bg(g, K.pink); const r = rays(g, 30, '#FFA6C2'); floor(g, '#E5678F');
    const th = el('g', {}, g); throne(th);
    const jW = el('g', {}, g); const ju = CAST.jul(jW, { name: '' });
    const st = stampEl(g, 'EMPEROR', { size: 64 });
    const ptag = el('g', {}, g); priceTag(ptag, '25,000', 'PER SOLDIER', 30);
    const hand = el('g', {}, g); senateHand(hand);
    const crown = el('g', {}, g); laurel(crown, K.gold, 0, 92, 32);
    const tW = S6, tSe = Math.max(tW + B, hit('L6', 'senate')), tEm = Math.max(tSe + B / 2, hit('L6', 'emperor'));
    ev(tW, 'bigslam'); ev(tW, 'cheer'); punch(tW, .05); ev(tSe - .3, 'whoosh'); ev(tSe, 'stamp'); punch(tSe, .035); ev(tEm, 'ding'); punch(tEm, .03);
    s.fx.push(judge(g, 'SOLD!', 640, 470, tW, S7, K.yellow, 220, -6), burst(g, 640, 470, tW, K.white, 1.7), confetti(g, tW, 46, 5));
    reading('stamp', 'EMPEROR', [TH - 210, 1130, TH + 210, 1240], tSe, S7b + .01);
    return t => {
      r.setAttribute('transform', `translate(${TH} 900) rotate(${(t * 10).toFixed(2)})`);
      tf(th, TH, FLOOR, TS, 0, TS * hitSq(t, tSe, .08));
      tf(jW, TH, FLOOR + SEAT * TS + hopY(t, 10), TS);
      const cr = t < tEm ? -300 : lerp(-300, -205, E.out(seg(t, tEm - .25, tEm)));
      pose(ju, { hey: t >= tW && t < tSe ? 1 : 0, open: t >= tW, sq: hitSq(t, tW) * hitSq(t, tEm, .15), face: t >= tEm ? 'up' : null });
      tf(crown, TH, FLOOR + SEAT * TS + (t < tEm - .25 ? -2000 : cr * TS), TS, -4);
      stampAnim(st, t, tSe, TH, 1185, -7); tf(ptag, 700, 980 + Math.sin(t * 3) * 4, 1.1, 10 + Math.sin(t * 2.4) * 5);
      const hd = t < tSe - .3 ? 1800 : t < tSe ? lerp(1800, 0, E.in(seg(t, tSe - .3, tSe))) : t < tSe + .12 ? 0 : 1800 * E.in(seg(t, tSe + .12, tSe + .42));
      tf(hand, TH + 10 + hd * .42, 1150 - hd * .9, 1, 25);
      s.fx.forEach(f => f(t));
    };
  });

  // ===== 7 · ROUND 3: 66 days (sky → deep red) =====
  const c0 = hit('L7', '66', 0, S7 + B / 2), c1 = Math.max(c0 + 3, hit('L7', 'marched'));
  const tGen = hit('L7', 'general', 0, c0 + B), tEx = Math.max(S7b + B, hit('L7', 'executed'));
  const ticks = []; { let tt = c0, k = 0; while (tt < c1 - .01) { ticks.push(tt); tt += (tt - c0) < (c1 - c0) / 2 ? B / 2 : B / 4; k++; } ticks.push(c1); }
  const dayAt = t => t < c0 ? 1 : t >= c1 ? 66 : Math.max(1, Math.min(65, Math.round(1 + 65 * Math.pow(seg(t, c0, c1), 1.6))));
  ticks.forEach((tt, i) => ev(tt, i === ticks.length - 1 ? 'ding' : 'flip', { f: 700 + i * 40 }));
  punch(c1, .04);
  const marchSteps = []; for (let tt = q8(tGen) + B; tt < tEx - .01; tt += B) marchSteps.push(tt);
  marchSteps.forEach(tt => ev(tt, 'step'));
  ev(tGen, 'land'); ev(tEx, 'buzz'); punch(tEx, .06); ev(tEx + .3, 'poof');
  function sevenSet(g, s, red) {
    if (red) { bg(g, '#B3243A'); stripes(g, '#C23349', 56, 28); floor(g, '#7E1628'); }
    else { bg(g, K.sky); stripes(g, '#A6DCFD', 56, 28); floor(g, '#5FA8D8'); }
    const th = el('g', {}, g); throne(th);
    const jW = el('g', {}, g); const ju = CAST.jul(jW, { name: '' });
    const crown = el('g', {}, g); laurel(crown, K.gold, 0, 92, 32);
    const st = stampEl(g, 'EMPEROR', { size: 64 });
    const ptag = el('g', {}, g); priceTag(ptag, '25,000', 'PER SOLDIER', 30);
    const xs = el('path', { d: 'M -200 -50 L 200 50 M -200 50 L 200 -50', stroke: K.ol, 'stroke-width': 22, 'stroke-linecap': 'round' }, g);
    const cal = calendar(g);
    const army = el('g', {}, g); const sol = [];
    for (let i = 0; i < 3; i++) { const w = el('g', {}, army); sol.push({ w, c: CAST.soldier(w) }); }
    const gW = el('g', {}, g); const gen = CAST.general(gW);
    const cloud = el('g', {}, g); puffCloud(cloud);
    return { th, jW, ju, crown, st, ptag, xs, cal, army, sol, gW, gen, cloud };
  }
  function sevenUpdate(o, t, s) {
    tf(o.th, TH, FLOOR, TS);
    const out = t >= tEx + .3;
    show(o.jW, !out); tf(o.jW, TH + (t >= tGen && t < tEx ? Math.sin(t * 40) * 3 : 0), FLOOR + SEAT * TS + hopY(t, 8), TS);
    pose(o.ju, { sweat: t >= tGen, face: t >= tEx ? 'x' : t >= c1 ? 'up' : null, open: t >= tGen, sq: hitSq(t, tEx, .25), lean: t >= tGen ? -6 : 0 });
    // the crown pops off at "executed" and lands on the floor
    const ct = t - tEx;
    if (t < tEx) tf(o.crown, TH, FLOOR + (SEAT - 205) * TS + hopY(t, 8), TS, -4);
    else tf(o.crown, TH + 260 * Math.min(ct, .8), Math.min(FLOOR - 30, FLOOR + (SEAT - 205) * TS - 900 * ct + 2200 * ct * ct), TS, -4 + 540 * Math.min(ct, .7));
    tf(o.st.g, TH, 1185, 1, -7); op(o.st.g, .95); tf(o.ptag, 700, 980 + Math.sin(t * 3) * 4, 1.1, 10 + Math.sin(t * 2.4) * 5);
    show(o.xs, t >= tEx + .35); tf(o.xs, TH, 1185, popIn(t, tEx + .35, .2), -7);
    // calendar: 1 → 66, ticking faster and faster
    const d = dayAt(t); o.cal.num.textContent = String(d);
    const lastTick = [...ticks].reverse().find(tt => tt <= t) ?? -9, fp = seg(t, lastTick, lastTick + .22);
    show(o.cal.flyer, t >= c0 && t < c1 + .22 && fp < 1); o.cal.fnum.textContent = String(Math.max(1, d - 1));
    tf(o.cal.flyer, 0 + 120 * fp, -260 * E.out(fp) + 600 * fp * fp, 1, 50 * fp);
    tf(o.cal.g, 790, 560 + Math.sin(t * 5) * 4, popIn(t, S7 + .02) * hitSq(t, c1, .2), 5 + (t >= c0 && t < c1 ? Math.sin(t * 50) * 2 : 0));
    // the rival general and his soldiers march in, one step per beat
    const marched = marchSteps.filter(tt => tt <= t).length, prog = marched / Math.max(1, marchSteps.length);
    const stepPh = marchSteps.length && t < tEx ? hopY(t, 26) : 0;
    tf(o.gW, lerp(1300, 860, E.out(prog)), FLOOR + 30 + dropY(t, tGen) + stepPh, 1.3); show(o.gW, t >= tGen - .4);
    show(o.gen.tag, t >= tGen);
    pose(o.gen, { hey: t >= tEx ? 1 : 0, open: t >= tEx || (t >= tGen && t < tGen + .4), lean: -6 });
    o.sol.forEach((sv, i) => { tf(sv.w, lerp(1500 + i * 140, 700 + i * 140, E.out(prog)), FLOOR - 30 + (marchSteps.length ? hopY(t, 22, .5) : 0), .72); show(sv.w, t >= tGen); pose(sv.c, { open: t >= tEx, hey: t >= tEx ? 1 : 0 }); });
    show(o.cloud, t >= tEx + .3 && t < tEx + .65); tf(o.cloud, TH, 950, 1.3 * (1 + .3 * seg(t, tEx + .3, tEx + .65)), 0);
    s.fx.forEach(f => f(t));
  }
  scene(S7, S7b, (g, s) => { const o = sevenSet(g, s, false); return t => sevenUpdate(o, t, s); });
  scene(S7b, S8, (g, s) => { const o = sevenSet(g, s, true); s.fx.push(judge(g, "TIME'S UP!", 540, 880, tEx, S8, K.yellow, 160, -6), burst(g, TH, 820, tEx, K.white, 1.5)); return t => sevenUpdate(o, t, s); });
  reading('p25', '25,000', [610, 880, 830, 1060], S6, S8);
  reading('cal', 'DAY 66', [600, 340, 980, 780], c1, S8);
  reading('genTag', 'RIVAL GENERAL', [690, 1330, 1040, 1410], tGen + .4, S8);

  [[0, 'open'], [S2, 'r1'], [S4, 'r2'], [S5, 'r2b'], [S6, 'sold'], [S7, 'r3'], [S7b, 'r3b'], [tEx, 'ex'], [S8, 'end'], [LOOP, 'loop']].forEach(([t, n]) => ev(t, 'sec', { n }));
  // ===== 8 · The report card (navy + gold sunburst), then the loop =====
  scene(S8, LOOP, (g, s) => {
    bg(g, K.navy); const r = rays(g, 28, '#3A3A7E'); floor(g, '#1A1A38');
    const card = el('g', {}, g);
    el('rect', { x: -440 + 16, y: -400 + 16, width: 880, height: 800, rx: 44, fill: K.ol }, card);
    el('rect', { x: -440, y: -400, width: 880, height: 800, rx: 44, fill: K.cream, ...SO, 'stroke-width': 10 }, card);
    el('path', { d: 'M -440 -260 L -440 -356 Q -440 -400 -396 -400 L 396 -400 Q 440 -400 440 -356 L 440 -260 Z', fill: K.yellow, ...SO, 'stroke-width': 10 }, card);
    gtext(card, 'REPORT CARD', 0, -306, 76, { fill: K.white, sw: 12 });
    const rows = [['BOUGHT', 'THE ROMAN EMPIRE', K.navy, 'bought'], ['PRICE', '25,000 / SOLDIER', K.purple, 'empire'], ['KEPT FOR', '66 DAYS', K.crimson, '66']];
    const rr = rows.map(([lab, val, col, w], i) => {
      const y = -150 + i * 170, gg = el('g', {}, card);
      txt(gg, lab, { x: -380, y: y - 40, 'font-size': 38, 'font-family': F, 'font-weight': 700, fill: '#8A8270' });
      const v = txt(gg, '', { x: -380, y: y + 40, 'font-size': i === 2 ? 96 : 70, 'font-family': F, 'font-weight': 700, fill: col });
      el('line', { x1: -380, y1: y + 70, x2: 380, y2: y + 70, stroke: '#E2D6BC', 'stroke-width': 4, 'stroke-dasharray': '14 12' }, gg);
      const t0 = hit('L8', w, 0, S8 + B / 2);
      for (let k = 0; k < val.length; k += 2) ev(t0 + k * B / 8, 'type');
      return { v, val, t0 };
    });
    const st = stampEl(g, 'WORST DEAL EVER?', { size: 66 });
    const tSt = Math.max(rr[2].t0 + B, hit('L8', 'days'));
    ev(tSt, 'stamp'); punch(tSt, .045); ev(rr[2].t0, 'ding');
    const c1g = el('g', {}, g), c2g = el('g', {}, g); coin(c1g, 40); coin(c2g, 34);
    rr.forEach((x, i) => reading('row' + i, x.val, [100, 400 + i * 170, 980, 520 + i * 170], x.t0 + x.val.length * B / 16, LOOP));
    reading('stampEnd', 'WORST DEAL EVER?', [150, 1100, 960, 1260], tSt, LOOP);
    return t => {
      r.setAttribute('transform', `translate(540 860) rotate(${(t * 8).toFixed(2)})`);
      tf(card, 540, 800 + Math.sin(t * 4) * 4, popIn(t, S8 + .02, .35), -1.5);
      rr.forEach(x => { const n = Math.floor(clamp((t - x.t0) / (B / 8), 0, x.val.length)); x.v.textContent = x.val.slice(0, n); });
      stampAnim(st, t, tSt, 560, 1180, -9);
      tf(c1g, 140, FLOOR - 40 + hopY(t, 40), 1, t * 90, Math.abs(Math.cos(t * 4)) * .9 + .1); tf(c2g, 950, FLOOR - 36 + hopY(t, 40, .5), 1, -t * 90, Math.abs(Math.cos(t * 4 + 1)) * .9 + .1);
      s.fx.forEach(f => f(t));
    };
  });
}

// ---------------- HUD: round banners + word-by-word captions ----------------
const bulbs = el('g', {}, hud); const BL = [];
for (let i = 0; i < 12; i++) { const x = 45 + i * 90, b = el('g', {}, bulbs); el('circle', { cx: x, cy: 1690, r: 22, fill: K.cream, ...SO, 'stroke-width': 6 }, b); const lit = el('circle', { cx: x, cy: 1690, r: 14, fill: K.yellow }, b); el('circle', { cx: x - 6, cy: 1684, r: 5, fill: K.white }, b); BL.push(lit); }
const ROUNDS = [[S2, S4, 'ROUND 1', 'THE THRONE', K.crimson], [S4, S6, 'ROUND 2', 'BIDDING WAR', K.teal], [S7, S8, 'ROUND 3', '66 DAYS', K.orange]];
const banners = ROUNDS.map(([a, b, r, sub, col]) => {
  const g = el('g', {}, hud);
  const w = Math.max(measure(r, 64), measure(sub, 44)) + 64;
  el('rect', { x: 10, y: 10, width: w, height: 150, rx: 26, fill: K.ol }, g);
  el('rect', { x: 0, y: 0, width: w, height: 150, rx: 26, fill: col, ...SO, 'stroke-width': 7 }, g);
  gtext(g, r, 32, 70, 64, { anchor: 'start', fill: K.yellow, sw: 11 });
  txt(g, sub, { x: 34, y: 126, 'font-size': 44, 'font-family': F, 'font-weight': 700, fill: K.white, stroke: K.ol, 'stroke-width': 7, 'paint-order': 'stroke' });
  ev(a, 'whoosh');
  reading('banner' + r, r + ' ' + sub, [50, 130, 50 + w, 290], a + .35, b);
  return { g, a, b };
});
const CAPY = 1515, CAPS = 74;
const chunks = [];
T.lines.forEach((l, li) => {
  let cur = [];
  const flush = () => { if (cur.length) chunks.push({ li, words: cur }); cur = []; };
  l.words.forEach(w => {
    const disp = w.w.replace(/[,.…]+$/, '').toUpperCase();
    const len = cur.reduce((a, x) => a + x.d.length + 1, 0) + disp.length;
    if (cur.length && len > 15) flush();
    cur.push({ d: disp, t0: w.t0, t1: w.t1 });
    if (/[,.…]$/.test(w.w)) flush();
  });
  flush();
});
chunks.forEach((c, i) => {
  const next = chunks[i + 1];
  c.a = c.words[0].t0 - .05;
  const lineEnd = T.lines[c.li].t1 + .45;
  c.b = next ? Math.min(next.words[0].t0 - .05, next.li === c.li ? 1e9 : lineEnd) : lineEnd;
  c.g = el('g', {}, hud);
  const ws = c.words.map(w => measure(w.d, CAPS)), sp = 22, total = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  const padX = 40, hgt = CAPS * 1.55;
  el('rect', { x: -total / 2 - padX + 10, y: -hgt / 2 + 10, width: total + padX * 2, height: hgt, rx: 30, fill: K.pink }, c.g);
  el('rect', { x: -total / 2 - padX, y: -hgt / 2, width: total + padX * 2, height: hgt, rx: 30, fill: K.ol }, c.g);
  let x = -total / 2;
  c.w = c.words.map((w, j) => { const e = gtext(c.g, w.d, x + ws[j] / 2, CAPS * .36, CAPS, { fill: K.white, sw: CAPS * .12 }); const o = { e, x: x + ws[j] / 2, ...w }; x += ws[j] + sp; return o; });
});

// ---------------- render ----------------
function render(t) {
  const loop = t >= LOOP;
  for (const s of scenes) { const on = loop ? s === window.__s1 : (t >= s.t0 && t < s.t1); show(s.g, on); if (on) s.update(loop ? 0 : t); }
  let z = 1;
  if (!loop) for (const [t0, a] of PUNCH) if (t >= t0 && t < t0 + .18) z += a * Math.pow(1 - (t - t0) / .18, 2);
  let cx = 540, cy = 960, sy = 0;
  if (!loop) { const sn = SNAPS.find(([a, b]) => t >= a && t < b); if (sn) { z *= sn[2]; cx = sn[3]; cy = sn[4]; } }
  if (!loop && t >= S7 && t < S7 + B) sy = -420 * (1 - E.out(seg(t, S7, S7 + B)));      // round 3 drops in from above
  cam.setAttribute('transform', `translate(${(540 - cx * z).toFixed(2)} ${(960 - cy * z + sy).toFixed(2)}) scale(${z.toFixed(4)})`);
  let fl = 0; for (const c of [...CUTS, LOOP]) if (t >= c && t < c + .1) fl = Math.max(fl, .55 * (1 - (t - c) / .1));
  op(flash, fl);
  BL.forEach((b, i) => op(b, (Math.floor(t / B) + i) % 2 ? 1 : .15));
  banners.forEach(b => { if (loop || t < b.a || t >= b.b) { op(b.g, 0); return; } op(b.g, 1); const pin = E.back(seg(t, b.a, b.a + .35)); tf(b.g, lerp(-700, 50, pin), 130, 1, lerp(-8, -2, pin)); });
  chunks.forEach(c => {
    const on = !loop && t >= c.a && t < c.b; show(c.g, on); if (!on) return;
    const p = seg(t, c.a, c.a + .16); tf(c.g, 540, CAPY + 24 * (1 - E.out(p)), lerp(.85, 1, E.back(p)), -1.5);
    c.w.forEach(w => {
      const said = t >= w.t0 - .04, now = said && t < w.t1 + .02;
      op(w.e, said ? 1 : 0); w.e.setAttribute('fill', now ? K.yellow : K.white);
      const s = now ? 1 + .12 * Math.exp(-(t - w.t0) * 10) : 1; w.e.setAttribute('transform', `translate(${w.x} 0) scale(${s.toFixed(3)}) translate(${-w.x} 0)`);
    });
  });
}

// readcheck: every text the film needs read, with its box (stage px = screen px for this 1080×1920 page)
function texts(t) {
  if (t >= LOOP) return [];
  return TXT.filter(x => t >= x.a && t < x.b).map(x => ({ id: x.id, text: x.text, x0: x.box[0], y0: x.box[1], x1: x.box[2], y1: x.box[3], ...(x.pass ? { pass: true } : {}) }));
}

await document.fonts.load('700 50px Fredoka', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789?!,/–'); await document.fonts.load('600 50px Fredoka', 'A');
await document.fonts.ready;
buildAll();
EV.sort((a, b) => a.t - b.t);
window.DUR = DUR;
window.EV = EV;
window.render = render;
window.TEXTS = texts;
render(0);
window.READY = true;
