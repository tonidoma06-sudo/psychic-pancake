// sets_pass.js · the sets of "The Unlimited Flight Pass", in the v4 toon style. On-screen branding is generic ("SKYLINE"):
// the narration says "the airline", the film never shows a real airline's name or logo.
// counter() the ticket counter; terminal() a gate with seats, a desk, a departure board, a window wall onto the apron;
// boardroom() the airline's boardroom with a chart screen; court() a courtroom; passCard() the gold lifetime pass (it can be cut).
import * as THREE from 'three';
import { TM, toon, G } from './toon.js';
import { textCanvas, texFrom, rng } from './kit.js';

function ctex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; t.userData.canvas = c; return t; }
const std = o => new THREE.MeshStandardMaterial({ roughness: 1, ...o });
const P = (geo, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
const B3 = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const tileTex = (a, b, rep) => ctex(256, 256, (g, w, h) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? a : b; g.fillRect(x * 64, y * 64, 64, 64); } g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } }, rep);
const BRAND = 'SKYLINE';
function logoCanvas(w = 900, h = 220, bg = '#1E3A6E') { return textCanvas([{ text: '✈ ' + BRAND, size: 130, y: 140, color: '#FFFFFF' }], { w, h, bg, round: 30 }); }

// a row of connected gate seats (4)
function gateSeats(n = 4, col = '#3A5A8A') { const g = G(); for (let i = 0; i < n; i++) { TM(B3(.5, .08, .48), col, g, i * .56, .45, 0, .005); TM(B3(.5, .5, .08), col, g, i * .56, .72, -.22, .005); } TM(B3(n * .56, .06, .06), '#8A9098', g, (n - 1) * .28, .3, 0, .003); for (const x of [0, (n - 1) * .56]) TM(B3(.06, .3, .4), '#8A9098', g, x, .15, 0, .003); return g; }

// ---------------- the ticket counter ----------------
export function counter() {
  const g = G(); g.name = 'counter';
  P(new THREE.PlaneGeometry(20, 14), std({ map: tileTex('#E8E4DA', '#D8D2C4', [6, 4]) }), g).rotation.x = -Math.PI / 2;
  P(B3(20, 6, .2), std({ color: '#E4E8EE' }), g, 0, 3, -3.2);
  const lg = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.03), new THREE.MeshToonMaterial({ map: texFrom(logoCanvas()) })); lg.position.set(0, 3.4, -3.08); g.add(lg);
  const tk = textCanvas([{ text: 'TICKETS', size: 110, y: 110, color: '#1E3A6E' }], { w: 700, h: 200, bg: '#F2C230', round: 20 }); const tm = new THREE.Mesh(new THREE.PlaneGeometry(2.1, .6), new THREE.MeshToonMaterial({ map: texFrom(tk) })); tm.position.set(-3.6, 2.6, -3.08); g.add(tm);
  const desk = G(); desk.position.set(0, 0, -1.4); g.add(desk); TM(B3(5.5, 1.1, .7), '#2E5AA8', desk, 0, .55, 0, .012); TM(B3(5.7, .08, .9), '#F4F1EA', desk, 0, 1.14, 0, .008);
  for (const x of [-1.6, 1.6]) { TM(B3(.5, .35, .04), '#2A2A30', desk, x, 1.38, -.15, .004).rotation.x = -.2; }
  // the queue rope posts
  for (let i = 0; i < 4; i++) { TM(new THREE.CylinderGeometry(.04, .04, .9, 10), '#C8A04A', g, -3 + i * 2, .45, 1.6, .003); TM(new THREE.CylinderGeometry(.14, .16, .04, 16), '#C8A04A', g, -3 + i * 2, .02, 1.6, .003); }
  return g;
}
// ---------------- the gate ----------------
export function terminal() {
  const g = G(); g.name = 'terminal';
  P(new THREE.PlaneGeometry(30, 22), std({ map: tileTex('#D8DCE0', '#C8CDD2', [10, 8]) }), g).rotation.x = -Math.PI / 2;
  P(new THREE.PlaneGeometry(8, 22), std({ color: '#3A5A8A' }), g, 0, .005, 0).rotation.x = -Math.PI / 2;   // the carpet down the middle
  // the window wall (-z): mullions over the apron and the sky (the outside is the field behind)
  const mull = toon('#5A6270');
  for (let i = 0; i <= 10; i++) TM(B3(.12, 6, .12), mull, g, -15 + i * 3, 3, -6, .004);
  for (const y of [.4, 3.2, 6]) TM(B3(30, .12, .12), mull, g, 0, y, -6, .004);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(30, 6), new THREE.MeshBasicMaterial({ color: '#BFE0F8', transparent: true, opacity: .14, depthWrite: false })); glass.position.set(0, 3, -6); g.add(glass);
  P(B3(30, .3, 22), std({ color: '#ECEEF2' }), g, 0, 6.3, 5);
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(B3(2, .05, .3), new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false })); l.position.set(-10 + i * 4, 6.12, 2); g.add(l); }
  // outside: the apron and an airliner at the gate
  P(new THREE.PlaneGeometry(200, 120), std({ color: '#8A8E96' }), g, 0, -.02, -66).rotation.x = -Math.PI / 2;
  // seats, the gate desk, the departure board on a pillar
  for (const [x, z, ry] of [[-6, 1, 0], [-6, 3, Math.PI], [3, 1, 0], [3, 3, Math.PI], [7, 1, 0]]) { const s = gateSeats(); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s); }
  const gd = G(); gd.position.set(-1.5, 0, -3.6); g.add(gd); TM(B3(2.4, 1.1, .7), '#2E5AA8', gd, 0, .55, 0, .01); TM(B3(2.5, .06, .8), '#F4F1EA', gd, 0, 1.13, 0, .006);
  const gs = textCanvas([{ text: 'GATE 12', size: 110, y: 100, color: '#FFFFFF' }], { w: 600, h: 170, bg: '#1E3A6E', round: 16 }); const gsm = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .45), new THREE.MeshToonMaterial({ map: texFrom(gs) })); gsm.position.set(0, 2.4, .1); gd.add(gsm); TM(B3(.06, 1.2, .06), '#5A6270', gd, 0, 1.75, 0, .003);
  // the departure board
  const bc = document.createElement('canvas'); bc.width = 768; bc.height = 768; const bt = texFrom(bc);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: bt, toneMapped: false })); board.position.set(2.4, 3.2, -5.7); g.add(board);
  TM(B3(2.6, 2.6, .12), '#2A2C34', g, 2.4, 3.2, -5.78, .006); TM(B3(.3, 2, .3), '#5A6270', g, 2.4, 1.0, -5.78, .004);
  let key = ''; g.userData.board = (rows, hi = -1) => { const k = JSON.stringify([rows, hi]); if (k === key) return; key = k; const c = bc.getContext('2d'); c.fillStyle = '#10141C'; c.fillRect(0, 0, 768, 768);
    c.fillStyle = '#F2C230'; c.font = '900 64px Montserrat'; c.textAlign = 'left'; c.fillText('DEPARTURES', 40, 90); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(30, 112, 708, 4);
    rows.forEach(([city, time, st], i) => { const y = 180 + i * 96; if (i === hi) { c.fillStyle = 'rgba(242,194,48,.22)'; c.fillRect(24, y - 58, 720, 86); }
      c.fillStyle = '#FFFFFF'; c.font = '800 52px Montserrat'; c.fillText(city, 40, y); c.fillStyle = '#C8CCD4'; c.font = '700 44px Montserrat'; c.fillText(time, 420, y); c.fillStyle = st === 'CANCELLED' ? '#FF4A4A' : st === 'BOARDING' ? '#4ADB6A' : '#F2C230'; c.font = '800 34px Montserrat'; c.fillText(st, 560, y); });
    bt.needsUpdate = true; };
  g.userData.board([['LONDON', '18:05', 'ON TIME']]);
  return g;
}
// ---------------- the boardroom ----------------
export function boardroom() {
  const g = G(); g.name = 'boardroom';
  P(new THREE.PlaneGeometry(14, 12), std({ color: '#3A3E4A' }), g).rotation.x = -Math.PI / 2;
  P(B3(14, 4, .2), std({ color: '#D8DCE4' }), g, 0, 2, -3.4);
  for (const s of [-1, 1]) P(B3(.2, 4, 10), std({ color: '#CDD2DA' }), g, s * 5, 2, 1.6);
  const tb = G(); tb.position.set(0, 0, -.4); g.add(tb); TM(B3(1.6, .08, 4.2), '#5A3A22', tb, 0, .78, 0, .01); TM(B3(.3, .74, 3.4), '#3A2616', tb, 0, .37, 0, .006);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const ch = G(); ch.position.set(s * 1.15, 0, -1.3 + i * 1.3); ch.rotation.y = s * -Math.PI / 2; g.add(ch); TM(B3(.5, .1, .5), '#1E1E26', ch, 0, .48, 0, .005); TM(B3(.5, .6, .08), '#1E1E26', ch, 0, .82, -.23, .005); }
  // the chart screen on the back wall: a cost line that climbs and climbs
  const sc = document.createElement('canvas'); sc.width = 1024; sc.height = 576; const st = texFrom(sc);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.03), new THREE.MeshBasicMaterial({ map: st, toneMapped: false })); scr.position.set(0, 2.3, -3.28); g.add(scr); TM(B3(3.8, 2.2, .1), '#16131A', g, 0, 2.3, -3.34, .006);
  let key = ''; g.userData.chart = (k, label = 'COST OF ONE PASSENGER') => { const kk = Math.round(k * 60) + label; if (kk === key) return; key = kk; const c = sc.getContext('2d'); c.fillStyle = '#F4F6FA'; c.fillRect(0, 0, 1024, 576);
    c.fillStyle = '#1E3A6E'; c.font = '900 52px Montserrat'; c.fillText(label, 40, 80); c.strokeStyle = '#C8CCD4'; c.lineWidth = 3; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(60, 160 + i * 90); c.lineTo(980, 160 + i * 90); c.stroke(); }
    c.strokeStyle = '#E8423A'; c.lineWidth = 14; c.lineJoin = 'round'; c.beginPath(); const N = 40; for (let i = 0; i <= N * k; i++) { const u = i / N, x = 70 + u * 900, y = 520 - Math.pow(u, 1.8) * 380 - Math.sin(u * 20) * 10; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    if (k > .9) { c.fillStyle = '#E8423A'; c.font = '900 90px Montserrat'; c.fillText('$$$', 760, 150); } st.needsUpdate = true; };
  g.userData.chart(0);
  return g;
}
// ---------------- the courtroom ----------------
export function court() {
  const g = G(); g.name = 'court';
  P(new THREE.PlaneGeometry(14, 12), std({ color: '#6A4A30' }), g).rotation.x = -Math.PI / 2;
  const panel = ctex(256, 256, (c, w, h) => { c.fillStyle = '#7A4A2A'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(40,20,8,.5)'; c.lineWidth = 6; for (let x = 0; x < w; x += 64) c.strokeRect(x + 6, 6, 52, h - 12); }, [6, 1]);
  P(B3(14, 4.5, .2), std({ map: panel }), g, 0, 2.25, -3.4);
  for (const s of [-1, 1]) { const f = G(); f.position.set(s * 3.4, 0, -2.8); g.add(f); TM(new THREE.CylinderGeometry(.03, .03, 2.6, 8), '#C8A04A', f, 0, 1.3, 0, .003); }
  const tbl = G(); tbl.position.set(0, 0, 1.2); g.add(tbl); TM(B3(2.4, .08, .9), '#8A5A34', tbl, 0, .78, 0, .008); TM(B3(2.3, .7, .06), '#6A4024', tbl, 0, .4, .4, .006);
  return g;
}
// ---------------- the pass card (gold), the companion card (silver); the gold one can be cut in two ----------------
export function passCard(o = {}) {
  const g = G(); const W = .34, Hh = .155, gold = o.silver ? ['#E8EAF0', '#B8BCC8', '#DCDFE8'] : ['#F8E08A', '#D9A82A', '#F2D06A'];
  const draw = (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, gold[0]); gr.addColorStop(.5, gold[1]); gr.addColorStop(1, gold[2]); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 6; i++) c.fillRect(-100 + i * 140, 0, 30, h);
    c.fillStyle = '#3A2A0A'; c.font = '900 50px Montserrat'; c.fillText(o.silver ? 'COMPANION' : 'LIFETIME', 40, 90); c.font = '900 64px Montserrat'; c.fillText(o.silver ? '+1 SEAT' : 'UNLIMITED', 40, 165);
    c.font = '800 34px Montserrat'; c.fillText(o.silver ? 'ANY FRIEND · EVERY FLIGHT' : 'FIRST CLASS · FOREVER', 40, 225); c.font = '700 30px Montserrat'; c.fillText('S. ROTHSTEIN', 40, 290); c.fillText('✈ ' + BRAND, 520, 290);
    c.fillStyle = '#C8C8D0'; c.fillRect(560, 50, 90, 66); c.strokeStyle = '#8A8A90'; c.lineWidth = 3; c.strokeRect(560, 50, 90, 66); };
  const halves = [];
  for (const s of [-1, 1]) {   // two halves (left/right) of one card
    const h = G(); g.add(h); const t = ctex(350, 320, (c, w, hh) => { c.save(); c.translate(s < 0 ? 0 : -350, 0); draw(c, 700, 320); c.restore(); });
    const m = new THREE.Mesh(B3(W / 2, Hh, .006), [toon(gold[1]), toon(gold[1]), toon(gold[1]), toon(gold[1]), new THREE.MeshToonMaterial({ map: t }), toon(gold[1])]); m.position.x = s * W / 4; h.add(m); halves.push(h);
  }
  g.userData.halves = halves;
  g.userData.split = k => { halves.forEach((h, i) => { const s = i ? 1 : -1; h.position.set(s * .06 * k, -.08 * k * k, 0); h.rotation.z = s * -.35 * k; }); };
  return g;
}
