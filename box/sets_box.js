// sets_box.js · the sets of "The Man in the Box" (1964: Reg Spiers mails himself from London to Perth in a crate).
// Physically lit 3D sets (no outlines) full of small props, for flat 2D characters to stand in, like the reference channel.
// crate() the wooden crate (stencils, a lid that can be nailed down / pushed off, his things inside) · bedsit() a rainy London
// room · londonStreet() wet street, red bus, phone box, a clock tower far off · field() an athletics field · warehouse() an air
// cargo shed (a forklift, sacks, crates, the apron through the door) · airliner() a 1960s jet with a cargo door · clouds() sky
// set · perth() a sunny apron with the terminal · home() the birthday living room.
import * as THREE from 'three';
import { G } from './toon.js';
import { rng } from './kit.js';
const MC = new Map();
const pbr = (c, o = {}) => { const k = c + (o.map ? o.map.uuid : '') + (o.r ?? '') + (o.m ?? '') + (o.e ?? ''); if (!MC.has(k)) MC.set(k, new THREE.MeshStandardMaterial({ color: c, map: o.map ?? null, roughness: o.r ?? .72, metalness: o.m ?? 0, emissive: o.e ?? '#000000', emissiveIntensity: o.ei ?? 1 })); return MC.get(k); };
function TM(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, typeof m === 'string' ? pbr(m) : m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; if (parent) parent.add(o); return o; }
const B3 = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const C3 = (r0, r1, h, s = 20) => new THREE.CylinderGeometry(r0, r1, h, s);
const S3 = (r, w = 20, h = 14) => new THREE.SphereGeometry(r, w, h);
function ctex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t; }
const glow = (col, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), toneMapped: false });
function plane(w, h, m, parent, x, y, z, ry = 0, rx = 0) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), typeof m === 'string' ? pbr(m) : m); o.position.set(x, y, z); o.rotation.set(rx, ry, 0); o.receiveShadow = true; parent.add(o); return o; }
const tex = (map, o = {}) => pbr('#FFFFFF', { map, ...o });

// ---------------- textures ----------------
const wood = (a = '#C8945A', b = '#B07C46', rep = [1, 1]) => ctex(256, 256, (g, w, h) => { for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(0, i * h / 6, w, h / 6); g.strokeStyle = 'rgba(70,40,15,.25)'; g.lineWidth = 2; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(0, i * h / 6 + 6 + k * 7); g.bezierCurveTo(w * .3, i * h / 6 + k * 7, w * .6, i * h / 6 + 12 + k * 7, w, i * h / 6 + 4 + k * 7); g.stroke(); } g.fillStyle = 'rgba(40,20,5,.5)'; g.fillRect(0, (i + 1) * h / 6 - 2, w, 2); } }, rep);
const wallpaper = () => ctex(256, 256, (g, w, h) => { g.fillStyle = '#C8D8A8'; g.fillRect(0, 0, w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const cx = x * 64 + (y % 2) * 32 + 16, cy = y * 64 + 32; g.fillStyle = '#E8A8A0'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(cx + Math.cos(k * 1.26) * 9, cy + Math.sin(k * 1.26) * 9, 7, 0, 7); g.fill(); } g.fillStyle = '#F2C230'; g.beginPath(); g.arc(cx, cy, 5, 0, 7); g.fill(); g.strokeStyle = '#7A9A5A'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy + 12); g.quadraticCurveTo(cx + 10, cy + 24, cx + 4, cy + 30); g.stroke(); } }, [6, 3]);
const stencil = (lines, col = '#2A2A30') => ctex(512, 512, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = col; g.textAlign = 'center'; lines.forEach(([t, y, sz, c]) => { g.font = `900 ${sz}px Montserrat`; g.fillStyle = c ?? col; g.fillText(t, w / 2, y); }); });

// ---------------- the crate ----------------
// 1.5 long (x), 0.85 wide (z), 0.9 high; lid = userData.lid (hinge-free: just lifts); front = userData.front (hidden for inside shots)
export function crate() {
  const g = G(); g.name = 'crate'; const wm = tex(wood('#D2A066', '#BE8C52'));
  const L = 1.5, Wd = .85, Hh = .9, t = .04;
  const sides = G(); g.add(sides); g.userData.sides = sides;
  TM(B3(L, t, Wd), wm, g, 0, t / 2, 0);
  const back = TM(B3(L, Hh, t), wm, sides, 0, Hh / 2, -Wd / 2 + t / 2);
  const front = TM(B3(L, Hh, t), wm, sides, 0, Hh / 2, Wd / 2 - t / 2); g.userData.front = front;
  for (const s of [-1, 1]) TM(B3(t, Hh, Wd), wm, sides, s * (L / 2 - t / 2), Hh / 2, 0);
  // battens and corner posts (darker), nails
  const bat = pbr('#9A6A3A');
  for (const z of [-1, 1]) for (const x of [-1, 1]) TM(B3(.07, Hh, .07), bat, sides, x * (L / 2 - .02), Hh / 2, z * (Wd / 2 - .02));
  for (const y of [.12, Hh - .12]) for (const z of [-1, 1]) TM(B3(L, .07, .03), bat, sides, 0, y, z * (Wd / 2 + .005));
  // stencils on the front and the side
  const st = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2 * .6), new THREE.MeshStandardMaterial({ map: stencil([['AIR CARGO', 90, 78], ['PERTH  W.A.', 190, 70, '#C8283A'], ['C.O.D.', 300, 90, '#1E3A6E'], ['⬆ THIS WAY UP ⬆', 390, 44]]), transparent: true, roughness: .8 }));
  st.scale.set(1, .6, 1); st.position.set(0, .5, Wd / 2 + .006); front.parent.add(st); g.userData.label = st;
  const sd = new THREE.Mesh(new THREE.PlaneGeometry(.7, .7), new THREE.MeshStandardMaterial({ map: stencil([['FRAGILE', 160, 96, '#C8283A'], ['HANDLE', 300, 70], ['WITH CARE', 390, 70]]), transparent: true, roughness: .8 }));
  sd.position.set(L / 2 + .006, .48, 0); sd.rotation.y = Math.PI / 2; sides.add(sd);
  // the lid
  const lid = G(); lid.position.y = Hh; g.add(lid); g.userData.lid = lid; TM(B3(L + .04, t, Wd + .04), wm, lid, 0, t / 2, 0); for (const x of [-.5, 0, .5]) TM(B3(.08, .03, Wd + .04), bat, lid, x, t + .01, 0);
  // inside: a pillow, a blanket, a flashlight, cans, a water bottle, the "other" bottle
  const inn = G(); g.add(inn); g.userData.inside = inn;
  TM(B3(.4, .1, .3), '#F4F1EA', inn, -.5, .09, 0).scale.set(1, 1, 1);
  TM(B3(.9, .05, .7), '#C8423A', inn, .15, .065, 0);
  for (let i = 0; i < 3; i++) { TM(C3(.04, .04, .1, 16), '#C8CCD4', inn, .55 - i * .1, .1, -.28, ); TM(C3(.041, .041, .06, 16), ['#E8423A', '#2E6FB5', '#F2B030'][i], inn, .55 - i * .1, .1, -.28); }
  TM(C3(.05, .05, .2, 16), '#9FD8E8', inn, .62, .15, .25);
  const ub = TM(C3(.045, .055, .16, 16), '#D8E8B8', inn, .5, .13, .27); ub.userData.bottle = 1; g.userData.bottle = ub;
  const fl = G(); fl.position.set(-.2, .1, .22); inn.add(fl); g.userData.flash = fl; TM(C3(.02, .02, .16, 12), '#2A2A30', fl).rotation.z = Math.PI / 2; const lens = new THREE.Mesh(new THREE.CircleGeometry(.024, 14), glow('#FFF2C8', 2)); lens.position.x = .085; lens.rotation.y = Math.PI / 2; fl.add(lens);
  const bulb = new THREE.PointLight('#FFE2A8', 0, 2.2, 1.6); bulb.position.set(0, .45, .1); g.add(bulb); g.userData.bulb = bulb;
  return g;
}

// ---------------- London: a rainy bedsit ----------------
export function bedsit() {
  const g = G(); g.name = 'bedsit';
  plane(5, 5, tex(wood('#7A4A2E', '#6A3E24', [4, 4])), g, 0, 0, 0, 0, -Math.PI / 2);
  for (const [w, x, z, ry] of [[5, 0, -1.8, 0], [5, -1.8, 0, Math.PI / 2], [5, 1.8, 0, -Math.PI / 2]]) plane(w, 2.6, tex(wallpaper()), g, x, 1.3, z, ry);
  plane(5, 5, '#E8E2D4', g, 0, 2.6, 0, 0, Math.PI / 2);
  TM(B3(3.6, .14, .04), '#F4EEE0', g, 0, .07, -1.77);   // skirting
  // the window: grey rain outside, streaks
  const rain = ctex(256, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5A6A80'); gr.addColorStop(1, '#8A98A8'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#4A5568'; for (let i = 0; i < 6; i++) c.fillRect(i * 44, 150 - (i % 3) * 30, 40, 120); c.fillStyle = '#E8D890'; for (let i = 0; i < 10; i++) c.fillRect(8 + i * 26, 170 - (i % 3) * 30, 6, 8); c.strokeStyle = 'rgba(220,235,255,.45)'; c.lineWidth = 2; for (let i = 0; i < 60; i++) { const x = (i * 37) % w, y = (i * 53) % h; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 4, y + 20); c.stroke(); } });
  const wv = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.1), new THREE.MeshBasicMaterial({ map: rain, toneMapped: false, color: new THREE.Color(.9, .9, .95) })); wv.position.set(.6, 1.55, -1.78); g.add(wv); g.userData.rainTex = rain;
  for (const [w, h, x, y] of [[1.1, .06, .6, 2.12], [1.1, .06, .6, .98], [.06, 1.2, .07, 1.55], [.06, 1.2, 1.13, 1.55], [1.1, .04, .6, 1.55], [.04, 1.2, .6, 1.55]]) TM(B3(w, h, .06), '#F4EEE0', g, x, y, -1.76);
  TM(B3(1.3, .05, .2), '#F4EEE0', g, .6, .95, -1.68);   // the sill
  for (const s of [-1, 1]) { const cu = TM(B3(.35, 1.4, .04), '#8A2E3A', g, .6 + s * .72, 1.5, -1.72); cu.scale.z = 1; }
  // the bed (iron frame), a radiator, a little table with coins and the photo, a kettle, a suitcase, a lamp
  const bed = G(); bed.position.set(-1.0, 0, -.6); g.add(bed); TM(B3(.95, .2, 1.9), '#F4F1EA', bed, 0, .48, 0); TM(B3(1.0, .08, 1.95), '#5A6A9A', bed, 0, .6, .1); TM(B3(.6, .12, .35), '#FFFFFF', bed, 0, .66, -.72);
  for (const z of [-.98, .98]) { TM(C3(.02, .02, .9, 8), '#2A2A30', bed, -.47, .45, z); TM(C3(.02, .02, .9, 8), '#2A2A30', bed, .47, .45, z); TM(C3(.02, .02, .96, 8), '#2A2A30', bed, 0, .88, z).rotation.z = Math.PI / 2; }
  const rad = G(); rad.position.set(1.4, 0, -1.7); g.add(rad); for (let i = 0; i < 8; i++) TM(B3(.06, .6, .1), '#E8E2D4', rad, -.25 + i * .07, .45, 0);
  const tb = G(); tb.position.set(.55, 0, -.85); g.add(tb); g.userData.table = tb; TM(B3(.8, .04, .55), '#8A5A34', tb, 0, .72, 0); for (const [x, z] of [[-.36, -.24], [.36, -.24], [-.36, .24], [.36, .24]]) TM(B3(.04, .7, .04), '#6A4024', tb, x, .35, z);
  for (let i = 0; i < 4; i++) TM(C3(.018, .018, .006, 14), i % 2 ? '#C8A04A' : '#A8A8B0', tb, -.2 + i * .05, .746 + (i === 3 ? .006 : 0), .1 - (i % 2) * .04);
  const ph = G(); ph.position.set(.2, .74, -.15); tb.add(ph); g.userData.photo = ph; TM(B3(.22, .28, .02), '#C8A04A', ph, 0, .14, 0).rotation.x = -.15;
  const kid = ctex(160, 200, (c, w, h) => { c.fillStyle = '#9FD8E8'; c.fillRect(0, 0, w, h); c.fillStyle = '#F2C230'; c.beginPath(); c.arc(130, 30, 18, 0, 7); c.fill(); c.fillStyle = '#4FA236'; c.fillRect(0, 150, w, 50); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(80, 95, 36, 0, 7); c.fill(); c.lineWidth = 5; c.strokeStyle = '#141016'; c.stroke(); c.fillStyle = '#5A3A22'; c.beginPath(); c.arc(80, 82, 38, Math.PI, 0); c.fill(); for (const s of [-1, 1]) { c.beginPath(); c.arc(80 + s * 36, 72, 13, 0, 7); c.fill(); } c.fillStyle = '#141016'; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(80 + s * 12, 98, 4, 6, 0, 0, 7); c.fill(); } c.lineWidth = 4; c.beginPath(); c.arc(80, 104, 12, .2, Math.PI - .2); c.stroke(); c.fillStyle = '#F2799A'; c.fillRect(56, 132, 48, 30); });
  const pm = new THREE.Mesh(new THREE.PlaneGeometry(.18, .23), tex(kid)); pm.position.set(0, .14, .012); pm.rotation.x = -.15; ph.add(pm);
  TM(C3(.07, .09, .16, 18), '#E8E2D4', tb, -.25, .82, -.15); TM(C3(.01, .01, .08, 6), '#2A2A30', tb, -.15, .85, -.15).rotation.z = -.9;
  const sc = G(); sc.position.set(1.2, 0, .5); sc.rotation.y = -.5; g.add(sc); TM(B3(.7, .45, .22), '#8A4A2A', sc, 0, .23, 0); TM(B3(.2, .04, .04), '#3A2A1E', sc, 0, .48, 0); for (const x of [-.25, .25]) TM(B3(.06, .46, .23), '#5A3018', sc, x, .23, 0);
  const lamp = G(); lamp.position.set(-.3, 0, -1.55); g.add(lamp); TM(C3(.02, .02, 1.3, 8), '#C8A04A', lamp, 0, .65, 0); TM(C3(.12, .2, .2, 18), '#F2D488', lamp, 0, 1.38, 0); const lb = new THREE.PointLight('#FFC878', 1.6, 4.5, 1.6); lb.position.set(0, 1.3, .1); lamp.add(lb);
  // a calendar: a date circled in red
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(.36, .48), tex(ctex(180, 240, (c, w, h) => { c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, w, h); c.fillStyle = '#1E3A6E'; c.fillRect(0, 0, w, 50); c.fillStyle = '#FFFFFF'; c.font = '900 30px Montserrat'; c.textAlign = 'center'; c.fillText('1964', w / 2, 36); c.fillStyle = '#333'; c.font = '700 16px Montserrat'; for (let i = 0; i < 30; i++) c.fillText(String(i + 1), 20 + (i % 7) * 23, 78 + Math.floor(i / 7) * 34); c.strokeStyle = '#E8232A'; c.lineWidth = 5; c.beginPath(); c.arc(20 + 3 * 23, 72 + 3 * 34, 15, 0, 7); c.stroke(); })));
  cal.position.set(-.5, 1.55, -1.78); g.add(cal);
  return g;
}

// ---------------- London: a wet street ----------------
export function londonStreet() {
  const g = G(); g.name = 'london'; const R = rng(3);
  plane(80, 40, pbr('#3A3E48', { r: .25 }), g, 0, 0, 2, 0, -Math.PI / 2);   // wet road: glossy
  plane(80, 3, pbr('#7A7A80', { r: .5 }), g, 0, .01, -1.5, 0, -Math.PI / 2);
  // terraced houses: brick, white window frames, lit windows
  const brick = ctex(256, 256, (c, w, h) => { c.fillStyle = '#9A4A36'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(230,220,200,.5)'; for (let y = 0; y < h; y += 16) { c.fillRect(0, y, w, 2); for (let x = (y / 16) % 2 * 16; x < w; x += 32) c.fillRect(x, y, 2, 16); } }, [4, 3]);
  for (let i = -5; i <= 5; i++) { const h = G(); h.position.set(i * 5, 0, -5); g.add(h); TM(B3(4.9, 8 + (i % 2), 4), tex(brick), h, 0, 4, 0); TM(B3(5.1, .3, 4.3), '#2A2A30', h, 0, 8 + (i % 2), 0);
    for (const y of [1.6, 4.0, 6.3]) for (const x of [-1.3, 1.3]) { const lit = R() > .45; const wn = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.3), lit ? glow('#FFD488', 1.1) : pbr('#2A3448', { r: .2 })); wn.position.set(x, y, 2.01); h.add(wn); TM(B3(1.0, 1.4, .05), '#F4F1EA', h, x, y, 1.99); }
    TM(B3(1.0, 2.0, .1), ['#1E3A6E', '#C8283A', '#2E6A3A', '#1E1E24'][((i % 4) + 4) % 4], h, 0, 1.0, 2.0); }
  // a red phone box, a red double-decker bus, black railings, street lamps, a clock tower far away in the mist
  const pb = G(); pb.position.set(-2.4, 0, -1.4); g.add(pb); TM(B3(.9, 2.4, .9), '#C8232A', pb, 0, 1.2, 0); TM(B3(.95, .2, .95), '#C8232A', pb, 0, 2.5, 0); for (const y of [.8, 1.25, 1.7]) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(.6, .35), glow('#FFF0C8', .9)); wn.position.set(0, y, .46); pb.add(wn); } const pbl = new THREE.Mesh(new THREE.PlaneGeometry(.6, .12), glow('#FFFFFF', 1.2)); pbl.position.set(0, 2.25, .46); pb.add(pbl);
  const bus = G(); bus.position.set(4, 0, 2.6); g.add(bus); g.userData.bus = bus;
  TM(B3(8, 1.9, 2.4), '#C8232A', bus, 0, 1.25, 0); TM(B3(8, 1.7, 2.4), '#C8232A', bus, 0, 3.1, 0); TM(B3(8.05, .12, 2.45), '#F4EEE0', bus, 0, 2.22, 0);
  for (const y of [1.55, 3.2]) for (let k = 0; k < 6; k++) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(1.0, .7), glow('#FFE8B8', .8)); wn.position.set(-3.2 + k * 1.25, y, 1.21); bus.add(wn); }
  for (const x of [-2.6, 2.6]) { const wh = TM(C3(.5, .5, .3, 20), '#1E1E24', bus, x, .5, 1.1); wh.rotation.x = Math.PI / 2; }
  for (let i = -12; i <= 12; i++) TM(B3(.03, 1.0, .03), '#1E1E24', g, i * .4, .5, -2.9); TM(B3(10, .04, .04), '#1E1E24', g, 0, .95, -2.9);
  for (const x of [-6, 1, 8]) { TM(C3(.06, .08, 4, 10), '#1E1E24', g, x, 2, -2.4); const lb = new THREE.Mesh(S3(.22, 14, 10), glow('#FFE2A8', 1.6)); lb.position.set(x, 4.1, -2.4); g.add(lb); const pl = new THREE.PointLight('#FFD488', 3, 10, 1.6); pl.position.set(x, 3.9, -2.2); g.add(pl); }
  const ct = G(); ct.position.set(-14, 0, -40); g.add(ct); TM(B3(4, 30, 4), '#7A7088', ct, 0, 15, 0); TM(B3(4.6, 5, 4.6), '#8A8098', ct, 0, 25, 0); const face = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), glow('#FFF2C8', .9)); face.position.set(0, 25, 2.32); ct.add(face); TM(new THREE.ConeGeometry(3, 8, 4), '#5A5068', ct, 0, 31.5, 0).rotation.y = Math.PI / 4;
  // puddles that reflect (glossy discs)
  for (let i = 0; i < 6; i++) { const pd = new THREE.Mesh(new THREE.CircleGeometry(.4 + R() * .5, 24), pbr('#5A6478', { r: .05, m: .4 })); pd.rotation.x = -Math.PI / 2; pd.position.set(-6 + i * 2.6, .012, .2 + R() * 2); pd.scale.y = .6; g.add(pd); }
  return g;
}

// ---------------- an athletics field ----------------
export function field() {
  const g = G(); g.name = 'field';
  plane(120, 120, pbr('#4FA236', { r: .9 }), g, 0, 0, -20, 0, -Math.PI / 2);
  const track = new THREE.Mesh(new THREE.RingGeometry(26, 34, 64, 1, Math.PI * .1, Math.PI * .8), pbr('#C8543A', { r: .85 })); track.rotation.x = -Math.PI / 2; track.position.set(0, .01, -2); g.add(track);
  for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.RingGeometry(26.9 + i * 1.1, 27 + i * 1.1, 64, 1, Math.PI * .1, Math.PI * .8), pbr('#F4F1EA')); l.rotation.x = -Math.PI / 2; l.position.set(0, .015, -2); g.add(l); }
  // the javelin runway (a strip), distance markers, flags, stands with a crowd, the sky
  plane(1.4, 20, pbr('#C8543A', { r: .85 }), g, 0, .012, 4, 0, -Math.PI / 2);
  for (let i = 1; i < 6; i++) { const f = G(); f.position.set(-3 - i * 4, 0, -10 - i * 6); g.add(f); TM(C3(.03, .03, 1.2, 6), '#F4F1EA', f, 0, .6, 0); TM(B3(.3, .2, .01), ['#E8423A', '#F2B030', '#2E6FB5', '#4FA236', '#F4F1EA'][i - 1], f, .15, 1.1, 0); }
  const st = G(); st.position.set(0, 0, -60); g.add(st); for (let r = 0; r < 6; r++) TM(B3(80, .6, 2), '#8A9098', st, 0, .3 + r * .6, r * -2);
  const R = rng(9); const im = new THREE.InstancedMesh(S3(.32, 8, 6), pbr('#FFFFFF'), 360); const m = new THREE.Matrix4(); const cols = ['#E8423A', '#2E6FB5', '#F2B030', '#4FA236', '#F4F1EA', '#7A3AB0'];
  for (let i = 0; i < 360; i++) { const r = i % 6; m.makeTranslation(-38 + (i / 6 | 0) * 1.3 + R() * .4, .9 + r * .6, -60 - r * 2); im.setMatrixAt(i, m); im.setColorAt(i, new THREE.Color(cols[(i * 7) % 6])); } st.add(im); im.position.z = 60; im.position.y = 0; im.instanceMatrix.needsUpdate = true;
  return g;
}

// ---------------- an air cargo shed ----------------
export function warehouse() {
  const g = G(); g.name = 'warehouse';
  plane(14, 14, pbr('#8A8A86', { r: .8 }), g, 0, 0, 0, 0, -Math.PI / 2);
  for (const [x, z, ry, w] of [[0, -5, 0, 14], [-6, 0, Math.PI / 2, 14], [6, 0, -Math.PI / 2, 14]]) plane(w, 6, pbr('#A8A090', { r: .9 }), g, x, 3, z, ry);
  // the big roller door in the back wall, open onto the apron (dusk light)
  const dusk = ctex(256, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3A3A7A'); gr.addColorStop(.6, '#F28A5A'); gr.addColorStop(1, '#F8C878'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#5A5E68'; c.fillRect(0, h * .8, w, h * .2); c.fillStyle = '#F4F4F6'; c.beginPath(); c.ellipse(w * .5, h * .72, 90, 14, 0, 0, 7); c.fill(); c.fillRect(w * .58, h * .6, 12, 26); c.fillStyle = '#C8283A'; c.fillRect(w * .2, h * .7, 60, 6); });
  const door = new THREE.Mesh(new THREE.PlaneGeometry(4, 3.2), new THREE.MeshBasicMaterial({ map: dusk, toneMapped: false })); door.position.set(1.5, 1.6, -4.98); g.add(door);
  TM(B3(4.2, .3, .3), '#5A5E68', g, 1.5, 3.3, -4.9);
  const sun = new THREE.PointLight('#FFB070', 6, 12, 1.4); sun.position.set(1.5, 2, -4.2); g.add(sun);
  // stacks of crates and mail sacks, a forklift, a workbench with a hammer and nails, hanging lamps
  const cr = (x, z, s, c = '#C8945A') => TM(B3(s, s * .8, s), c, g, x, s * .4, z);
  cr(-4.5, -3.8, 1.2); cr(-4.5, -3.8 + 0, 1.0).position.y = 1.4; cr(-3.2, -4.0, .9, '#B07C46'); cr(4.6, -3.6, 1.1); cr(4.6, -2.3, .8, '#A8744A'); cr(5.0, 1.5, 1.0);
  for (let i = 0; i < 8; i++) { const sk = TM(S3(.35, 14, 10), '#D8C8A0', g, -4.8 + (i % 4) * .5, .3 + Math.floor(i / 4) * .45, 2.2 + (i % 2) * .3); sk.scale.set(1.2, .8, .9); }
  const fk = G(); fk.position.set(3.4, 0, .4); fk.rotation.y = -1.2; g.add(fk); g.userData.forklift = fk;
  TM(B3(1.0, .7, 1.6), '#F2B030', fk, 0, .55, 0); TM(B3(.9, .8, .1), '#2A2A30', fk, 0, 1.3, -.2); for (const x of [-.45, .45]) TM(B3(.06, 2.2, .06), '#2A2A30', fk, x, 1.1, -.85); TM(B3(.9, .05, .1), '#2A2A30', fk, 0, 2.2, -.85);
  for (const [x, z] of [[-.5, .5], [.5, .5], [-.5, -.5], [.5, -.5]]) { const wh = TM(C3(.22, .22, .2, 18), '#1E1E24', fk, x, .22, z); wh.rotation.z = Math.PI / 2; }
  const forks = G(); forks.position.set(0, .1, -.9); fk.add(forks); g.userData.forks = forks; for (const x of [-.25, .25]) TM(B3(.1, .04, 1.0), '#5A5E68', forks, x, 0, -.45);
  const wb = G(); wb.position.set(-2.4, 0, -1.2); g.add(wb); TM(B3(1.6, .06, .7), '#8A5A34', wb, 0, .9, 0); for (const [x, z] of [[-.75, -.3], [.75, -.3], [-.75, .3], [.75, .3]]) TM(B3(.06, .9, .06), '#5A3A22', wb, x, .45, z);
  TM(B3(.3, .1, .2), '#C8283A', wb, -.4, .98, 0); TM(B3(.5, .02, .3), '#C8CCD4', wb, .3, .94, .1);
  for (const [x, z] of [[-2, -1], [2, -1], [-2, 2.5], [2, 2.5]]) { TM(C3(.005, .005, 1.6, 4), '#2A2A30', g, x, 5.2, z); const sh = TM(new THREE.ConeGeometry(.35, .3, 20, 1, true), '#2E6A3A', g, x, 4.3, z); sh.material = pbr('#2E6A3A'); sh.material.side = THREE.DoubleSide; const lb = new THREE.Mesh(S3(.1, 12, 8), glow('#FFE2A0', 2)); lb.position.set(x, 4.2, z); g.add(lb); const pl = new THREE.PointLight('#FFD8A0', 3, 7, 1.6); pl.position.set(x, 4.0, z); g.add(pl); }
  // a sign on the wall
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, .6), tex(ctex(512, 128, (c, w, h) => { c.fillStyle = '#1E3A6E'; c.fillRect(0, 0, w, h); c.fillStyle = '#F4F1EA'; c.font = '900 64px Montserrat'; c.textAlign = 'center'; c.fillText('AIR FREIGHT', w / 2, 88); })));
  sign.position.set(-2.5, 4.0, -4.97); g.add(sign);
  return g;
}

// ---------------- a 1960s jet (nose to +x), cargo door on the right side ----------------
export function airliner(livery = '#C8283A') {
  const g = G(), L = 32, white = pbr('#F4F4F6', { r: .35, m: .1 }), col = pbr(livery, { r: .4 }), grey = pbr('#B8BCC4', { r: .4, m: .3 }), win = pbr('#2A3A5A', { r: .2 });
  const body = TM(new THREE.CapsuleGeometry(.12 * L, .9 * L, 8, 24), white, g); body.rotation.z = Math.PI / 2;
  const wing = TM(B3(.3 * L, .025 * L, 1.15 * L), white, g, .02 * L, -.04 * L, 0); wing.rotation.y = -.35;
  TM(B3(.16 * L, .02 * L, .46 * L), white, g, -.5 * L, .01 * L, 0);
  const fin = TM(B3(.22 * L, .27 * L, .02 * L), col, g, -.5 * L, .15 * L, 0); fin.rotation.z = -.35;
  for (const z of [-.42, -.22, .22, .42]) { const en = TM(C3(.035 * L, .03 * L, .15 * L, 14), grey, g, .1 * L, -.1 * L, z * L); en.rotation.z = Math.PI / 2; }
  TM(B3(1.05 * L, .035 * L, .246 * L), col, g, -.02 * L, -.02 * L, 0);
  for (let i = 0; i < 14; i++) for (const z of [-.122, .122]) TM(B3(.025 * L, .025 * L, .004 * L), win, g, (.4 - i * .06) * L, .045 * L, z * L);
  TM(B3(.06 * L, .045 * L, .2 * L), win, g, .62 * L, .04 * L, 0);
  const cd = TM(B3(.08 * L, .07 * L, .01 * L), '#E8E8EC', g, .22 * L, -.06 * L, .121 * L); g.userData.cargoDoor = cd;
  g.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return g;
}
// a sea of clouds (for the flight)
export function clouds() {
  const g = G(); g.name = 'clouds'; const R = rng(21); const cm = pbr('#FFFFFF', { r: .95 }); const cs = S3(1, 16, 10);
  const N = 700, im = new THREE.InstancedMesh(cs, cm, N); const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i < N; i++) { const a = R() * Math.PI * 2, d = 12 + Math.pow(R(), .6) * 380; p.set(Math.cos(a) * d, -42 - R() * 6, Math.sin(a) * d); const sc = 6 + R() * 12; s.set(sc * 1.6, sc * (.45 + R() * .35), sc * 1.3); m.compose(p, q, s); im.setMatrixAt(i, m); }
  im.receiveShadow = true; g.add(im); return g;
}

// ---------------- Perth: a sunny apron, the terminal ----------------
export function perth() {
  const g = G(); g.name = 'perth';
  plane(200, 120, pbr('#9A9890', { r: .85 }), g, 0, 0, -20, 0, -Math.PI / 2);
  for (let i = -6; i <= 6; i++) { const d = new THREE.Mesh(new THREE.PlaneGeometry(3, .2), pbr('#F2C230')); d.rotation.x = -Math.PI / 2; d.position.set(i * 6, .01, 6); g.add(d); }
  const term = G(); term.position.set(0, 0, -22); g.add(term); TM(B3(40, 6, 8), '#F4EEE0', term, 0, 3, 0); TM(B3(40, 2.4, .1), '#5AA8D0', term, 0, 3.2, 4.05);
  TM(B3(10, 3, 3), '#F4EEE0', term, 8, 7.5, 0); TM(B3(6, 2.2, 6), '#5AA8D0', term, 8, 10, 0);   // control tower
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(14, 2.4), tex(ctex(1024, 176, (c, w, h) => { c.fillStyle = '#1E3A6E'; c.fillRect(0, 0, w, h); c.fillStyle = '#F2C230'; c.font = '900 120px Montserrat'; c.textAlign = 'center'; c.fillText('PERTH  AIRPORT', w / 2, 128); })));
  sign.position.set(-6, 6.9, 4.1); term.add(sign);
  // palm trees, a baggage tractor with carts, the hills far away
  const palm = (x, z, h = 7) => { const p = G(); p.position.set(x, 0, z); g.add(p); TM(C3(.18, .26, h, 10), '#8A6A44', p, 0, h / 2, 0).rotation.z = .06; for (let i = 0; i < 7; i++) { const lf = TM(B3(.5, .05, 2.4), '#3E8A3A', p, Math.cos(i) * .9, h, Math.sin(i) * .9); lf.rotation.set(Math.sin(i) * .5, i * .9, .35); } };
  palm(-18, -14); palm(-12, -15); palm(18, -14); palm(24, -16, 8);
  const tug = G(); tug.position.set(-4, 0, 4); g.add(tug); g.userData.tug = tug; TM(B3(1.6, .9, 1.1), '#F2B030', tug, 0, .6, 0); TM(B3(.8, .6, 1.0), '#2A2A30', tug, -.2, 1.35, 0);
  for (let i = 0; i < 2; i++) { const cart = G(); cart.position.set(2.2 + i * 2.4, 0, 0); tug.add(cart); TM(B3(2.0, .12, 1.3), '#5A6A7A', cart, 0, .45, 0); for (const [x, z] of [[-.8, -.5], [.8, -.5], [-.8, .5], [.8, .5]]) { const wh = TM(C3(.18, .18, .12, 14), '#1E1E24', cart, x, .18, z); wh.rotation.x = Math.PI / 2; } }
  g.userData.cart = tug.children[tug.children.length - 2];
  for (let i = 0; i < 4; i++) TM(new THREE.ConeGeometry(14, 6, 6), '#8AA0B8', g, -60 + i * 40, 2, -90);
  return g;
}

// ---------------- home: the birthday living room ----------------
export function home() {
  const g = G(); g.name = 'home';
  plane(6, 6, pbr('#C8A06A', { r: .8 }), g, 0, 0, 0, 0, -Math.PI / 2);
  const wp = ctex(256, 256, (c, w, h) => { c.fillStyle = '#F4E4B8'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(232,130,90,.35)'; for (let x = 0; x < w; x += 32) c.fillRect(x, 0, 12, h); }, [5, 2]);
  for (const [x, z, ry] of [[0, -2, 0], [-2.4, 0, Math.PI / 2], [2.4, 0, -Math.PI / 2]]) plane(6, 2.7, tex(wp), g, x, 1.35, z, ry);
  plane(6, 6, '#FBF4E4', g, 0, 2.7, 0, 0, Math.PI / 2);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.0), new THREE.MeshBasicMaterial({ map: ctex(256, 200, (c, w, h) => { c.fillStyle = '#7FC8F2'; c.fillRect(0, 0, w, h); c.fillStyle = '#4FA236'; c.fillRect(0, 140, w, 60); c.fillStyle = '#F2D040'; c.beginPath(); c.arc(200, 40, 22, 0, 7); c.fill(); }), toneMapped: false })); win.position.set(-1.2, 1.55, -1.98); g.add(win);
  for (const [w, h, x, y] of [[1.4, .06, -1.2, 2.08], [1.4, .06, -1.2, 1.02], [.06, 1.1, -1.88, 1.55], [.06, 1.1, -.52, 1.55]]) TM(B3(w, h, .06), '#F4F1EA', g, x, y, -1.96);
  const sun = new THREE.PointLight('#FFE8B8', 4, 6, 1.4); sun.position.set(-1.2, 1.7, -1.2); g.add(sun);
  // the banner, balloons, a table with the cake (candles lit), presents, a sofa
  const ban = new THREE.Mesh(new THREE.PlaneGeometry(2.4, .45), new THREE.MeshStandardMaterial({ map: ctex(768, 144, (c, w, h) => { const cols = ['#E8423A', '#F2B030', '#4FA236', '#2E6FB5', '#7A3AB0']; 'HAPPY BIRTHDAY'.split('').forEach((ch, i) => { const x = 20 + i * 52; c.fillStyle = cols[i % 5]; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 48, 0); c.lineTo(x + 24, h - 10); c.closePath(); c.fill(); c.fillStyle = '#FFFFFF'; c.font = '900 34px Montserrat'; c.textAlign = 'center'; c.fillText(ch, x + 24, 52); }); }), transparent: true }));
  ban.position.set(.9, 2.2, -1.97); g.add(ban);
  const bcols = ['#E8423A', '#F2B030', '#2E6FB5', '#F2799A', '#4FA236', '#7A3AB0'];
  for (let i = 0; i < 9; i++) { const b = TM(S3(.17, 18, 14), pbr(bcols[i % 6], { r: .25 }), g, -2.1 + (i % 3) * .25 + (i > 5 ? 4 : 0), 2.1 + (i % 2) * .2, -1.6 + Math.floor(i / 3) * .2); b.scale.set(1, 1.18, 1); TM(C3(.004, .004, .6, 4), '#F4F1EA', g, b.position.x, b.position.y - .5, b.position.z); }
  const tb = G(); tb.position.set(.8, 0, -.9); g.add(tb); TM(C3(.55, .55, .05, 32), '#F4F1EA', tb, 0, .74, 0); TM(C3(.08, .1, .72, 14), '#8A5A34', tb, 0, .36, 0);
  const cake = G(); cake.position.set(0, .77, 0); tb.add(cake); g.userData.cake = cake; TM(C3(.22, .22, .16, 28), '#F2799A', cake, 0, .08, 0); TM(C3(.23, .23, .03, 28), '#FFFFFF', cake, 0, .17, 0); TM(C3(.16, .16, .1, 24), '#F8E8F0', cake, 0, .23, 0);
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; TM(C3(.008, .008, .07, 6), ['#2E6FB5', '#F2B030', '#4FA236'][i % 3], cake, Math.cos(a) * .09, .31, Math.sin(a) * .09); const fl = new THREE.Mesh(new THREE.SphereGeometry(.012, 8, 6), glow('#FFC850', 2.5)); fl.position.set(Math.cos(a) * .09, .36, Math.sin(a) * .09); fl.scale.y = 1.6; cake.add(fl); }
  const cl = new THREE.PointLight('#FFC870', 1.4, 2.2, 1.6); cl.position.set(0, .5, 0); cake.add(cl);
  for (let i = 0; i < 3; i++) { const p = G(); p.position.set(1.6 + i * .3, 0, -1.4 + (i % 2) * .3); g.add(p); TM(B3(.3, .25 + i * .05, .3), bcols[(i + 2) % 6], p, 0, .14 + i * .025, 0); TM(B3(.06, .27 + i * .05, .31), '#F4F1EA', p, 0, .14 + i * .025, 0); }
  const so = G(); so.position.set(-1.4, 0, .6); so.rotation.y = Math.PI / 2; g.add(so); TM(B3(1.8, .45, .8), '#2E8A8A', so, 0, .3, 0); TM(B3(1.8, .5, .2), '#2E8A8A', so, 0, .7, -.32); for (const s of [-1, 1]) TM(B3(.2, .55, .8), '#257070', so, s * .9, .35, 0);
  return g;
}
