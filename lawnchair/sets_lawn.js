// sets_lawn.js · the sets of "Lawn Chair Larry", in the v4 toon style (outlined, saturated, soft shadows).
// backyard() Larry's yard in Los Angeles (stucco house, palms, fence, the Jeep, helium tanks); craft() the lawn chair under 42
// weather balloons; sky() the cloud sea three miles up; airliner(); cockpit(); office() the Air Force eye test; street() a
// neighbourhood with power lines; room() a living room for the blackout; policeCar(); small props.
import * as THREE from 'three';
import { TM, toon, G, RAMP_SOFT } from './toon.js';
import { textCanvas, texFrom, rng } from './kit.js';

function ctex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; t.userData.canvas = c; return t; }
const std = o => new THREE.MeshStandardMaterial({ roughness: 1, ...o });
const P = (geo, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
const B3 = (w, h, d) => new THREE.BoxGeometry(w, h, d);

const grassTex = rep => ctex(512, 512, (g, w, h) => { const R = rng(3); g.fillStyle = '#5BAE3C'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { g.fillStyle = R() < .5 ? 'rgba(30,90,20,.22)' : 'rgba(180,230,110,.2)'; g.fillRect(R() * w, R() * h, 2, 4 + R() * 6); } }, rep);
const stuccoTex = (col, rep) => ctex(256, 256, (g, w, h) => { const R = rng(8); g.fillStyle = col; g.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '120,90,60'},${.06 * R()})`; g.fillRect(R() * w, R() * h, 3, 3); } }, rep);
const tileTex = rep => ctex(256, 256, (g, w, h) => { g.fillStyle = '#C8643C'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(80,30,10,.25)'; g.fillRect(x + (y / 32 % 2) * 16, y + 26, 30, 6); g.fillStyle = 'rgba(255,200,150,.18)'; g.fillRect(x + (y / 32 % 2) * 16 + 4, y + 4, 22, 6); } }, rep);
const asphaltTex = rep => ctex(256, 256, (g, w, h) => { const R = rng(6); g.fillStyle = '#4A4C52'; g.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(${R() < .5 ? '20,20,24' : '150,150,160'},${.22 * R()})`; g.fillRect(R() * w, R() * h, 2, 2); } }, rep);
const concTex = rep => ctex(256, 256, (g, w, h) => { const R = rng(9); g.fillStyle = '#CFC9BE'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '80,70,60'},.08)`; g.fillRect(R() * w, R() * h, 3, 3); } g.strokeStyle = 'rgba(90,80,70,.35)'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); }, rep);

// ---------------- pieces ----------------
export function palm(h = 7, lean = .12, seed = 1) {
  const g = G(), R = rng(seed), trunk = toon('#9A7A56');
  let x = 0, y = 0;
  for (let i = 0; i < 9; i++) { const s = TM(new THREE.CylinderGeometry(.17 - i * .008, .2 - i * .008, h / 9 + .02, 10), trunk, g, x, y + h / 18, 0, .006); s.rotation.z = -lean * (1 + i * .1); x += Math.sin(lean * (1 + i * .1)) * h / 9; y += h / 9; }
  const crown = G(); crown.position.set(x, y, 0); g.add(crown);
  const leaf = toon('#3E9A3A');
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + R() * .3, fr = G(); fr.rotation.y = a; crown.add(fr);
    const f = TM(new THREE.ConeGeometry(.28, 2.6, 4, 1), leaf, fr, 0, 0, 1.25, .006); f.rotation.x = Math.PI / 2 + .35 + R() * .3; f.scale.set(1, 1, .22); }
  TM(new THREE.SphereGeometry(.3, 12, 8), '#6A5A3A', crown, 0, -.1, 0, .006);
  return g;
}
export function tree(s = 1, seed = 2) { const g = G(), R = rng(seed); TM(new THREE.CylinderGeometry(.16, .24, 2.4, 10), '#7A5A3A', g, 0, 1.2, 0, .006); for (let k = 0; k < 5; k++) { const b = TM(new THREE.IcosahedronGeometry(1.1, 2), ['#4FA236', '#5DB042', '#45922E'][k % 3], g, Math.sin(k * 1.3) * .9, 2.9 + (k % 2) * .5, Math.cos(k * 1.3) * .6, .008); b.scale.setScalar(.85 + R() * .35); } g.scale.setScalar(s); return g; }
export function house(o = {}) {
  const g = G(), w = o.w ?? 10, d = o.d ?? 7, h = o.h ?? 3.1;
  P(B3(w, h, d), std({ map: stuccoTex(o.col ?? '#F2D7B6', [w / 3, h / 3]) }), g, 0, h / 2, 0);
  const roof = TM(new THREE.ConeGeometry(Math.hypot(w, d) / 2 * 1.06, 1.7, 4, 1), std({ map: tileTex([4, 2]) }), g, 0, h + .85, 0, .01); roof.rotation.y = Math.PI / 4; roof.scale.set(w / Math.hypot(w, d) * 1.414, 1, d / Math.hypot(w, d) * 1.414);
  const glass = toon('#8FC0E0'), trim = toon('#FFFFFF');
  for (const [x, z, ry] of o.windows ?? [[-2.6, d / 2 + .01, 0], [2.6, d / 2 + .01, 0]]) { const wg = G(); wg.position.set(x, 1.6, z); wg.rotation.y = ry; g.add(wg); TM(B3(1.5, 1.1, .06), glass, wg, 0, 0, 0, .006); TM(B3(1.66, .1, .1), trim, wg, 0, -.6, .04, .005); TM(B3(.06, 1.1, .08), trim, wg, 0, 0, .03, 0); }
  if (o.door) { TM(B3(1.0, 2.1, .08), o.doorCol ?? '#7A4A2A', g, o.door[0], 1.05, o.door[1], .006); }
  return g;
}
export function fence(len, h = 1.7, col = '#B8865A') { const g = G(), m = toon(col); for (let i = 0; i <= len / 2; i++) TM(B3(.12, h + .1, .12), '#8A6040', g, -len / 2 + i * 2, (h + .1) / 2, 0, .005); for (let k = 0; k < 5; k++) P(B3(len, h / 5 - .04, .05), m, g, 0, .12 + k * h / 5 + h / 10, .07); return g; }
export function jeep(col = '#C8402A') {
  const g = G(), body = toon(col), dark = toon('#2A2A30'), chrome = toon('#D8DCE2');
  TM(B3(1.55, .55, 3.2), body, g, 0, .85, 0, .01);                         // the tub
  TM(B3(1.5, .35, 1.2), body, g, 0, 1.25, 1.0, .01);                         // the hood
  TM(B3(1.5, .55, .1), dark, g, 0, 1.0, 1.66, .006);                          // the grille
  for (let i = 0; i < 7; i++) TM(B3(.06, .4, .03), '#4A4A52', g, -.42 + i * .14, 1.02, 1.72, 0);
  for (const s of [-1, 1]) { TM(new THREE.CylinderGeometry(.1, .1, .06, 16), '#FFF6D0', g, s * .58, 1.12, 1.72, .005).rotation.x = Math.PI / 2; }
  for (const s of [-1, 1]) for (const z of [-1.05, 1.05]) { const wh = TM(new THREE.CylinderGeometry(.38, .38, .3, 20), dark, g, s * .8, .38, z, .01); wh.rotation.z = Math.PI / 2; TM(new THREE.CylinderGeometry(.18, .18, .32, 14), chrome, g, s * .8, .38, z, 0).rotation.z = Math.PI / 2; }
  for (const s of [-1, 1]) { const fn = TM(B3(.22, .08, 1.0), body, g, s * .86, .82, 1.05, .006); fn.rotation.x = .05; }
  const bar = toon('#2A2A30'); for (const s of [-1, 1]) TM(new THREE.CylinderGeometry(.04, .04, 1.0, 8), bar, g, s * .7, 1.6, -.4, .004); TM(new THREE.CylinderGeometry(.04, .04, 1.4, 8), bar, g, 0, 2.1, -.4, .004).rotation.z = Math.PI / 2;
  TM(B3(1.5, .04, .5), '#2A2A30', g, 0, 1.75, .55, .004).rotation.x = -.6;   // the windscreen frame
  const sp = TM(new THREE.CylinderGeometry(.36, .36, .26, 20), dark, g, 0, 1.0, -1.75, .01); sp.rotation.x = Math.PI / 2;
  TM(B3(1.4, .12, .14), chrome, g, 0, .52, -1.66, .005);                     // the rear bumper (the rope ties here)
  for (const s of [-1, 1]) TM(B3(.5, .45, .55), '#3A3A40', g, s * .35, 1.05, -.6, .006);   // seats
  g.userData.hitch = V3(0, .55, -1.75);
  return g;
}
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export function tank(col = '#2E7A4A') { const g = G(); TM(new THREE.CylinderGeometry(.16, .16, 1.4, 16), col, g, 0, .7, 0, .006); TM(new THREE.SphereGeometry(.16, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), col, g, 0, 1.4, 0, .006); TM(new THREE.CylinderGeometry(.05, .05, .14, 10), '#C8CCD4', g, 0, 1.6, 0, .004); TM(new THREE.CylinderGeometry(.04, .04, .05, 12), '#E8E8EC', g, .07, 1.62, 0, .003).rotation.z = Math.PI / 2; return g; }

// the lawn chair: an aluminium tube frame, green-and-white woven webbing; seat 0.42 up; faces +z
export function lawnChair() {
  const g = G(), alu = toon('#C8CCD4', { soft: 1 });
  const web = ctex(256, 256, (c, w, h) => { c.fillStyle = '#F4F1EA'; c.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#2E9A5A' : '#F2C230'; c.fillRect(i * 32 + 4, 0, 22, h); c.fillStyle = 'rgba(46,154,90,.55)'; c.fillRect(0, i * 32 + 4, w, 20); } });
  const webM = new THREE.MeshToonMaterial({ map: web, side: THREE.DoubleSide });
  const tube = (x1, y1, z1, x2, y2, z2) => { const a = V3(x1, y1, z1), b = V3(x2, y2, z2), L = a.distanceTo(b); const m = TM(new THREE.CylinderGeometry(.022, .022, L, 8), alu, g, (x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2, .004); m.quaternion.setFromUnitVectors(V3(0, 1, 0), b.clone().sub(a).normalize()); return m; };
  for (const s of [-1, 1]) { tube(s * .28, 0, .28, s * .28, .42, .2); tube(s * .28, 0, -.28, s * .28, .42, -.2); tube(s * .28, .42, .24, s * .28, .42, -.24); tube(s * .28, .42, -.24, s * .28, 1.0, -.38); tube(s * .3, .62, .24, s * .3, .62, -.28); tube(s * .3, .62, .24, s * .28, .42, .24); tube(s * .28, 0, .28, s * .28, 0, -.28); }
  tube(-.28, .42, .24, .28, .42, .24); tube(-.28, .42, -.24, .28, .42, -.24); tube(-.28, 1.0, -.38, .28, 1.0, -.38);
  const seat = new THREE.Mesh(new THREE.PlaneGeometry(.54, .46), webM); seat.rotation.x = -Math.PI / 2; seat.position.set(0, .43, 0); g.add(seat);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(.54, .6), webM); back.position.set(0, .71, -.31); back.rotation.x = -.23; g.add(back);
  g.userData.armL = V3(.3, .62, 0); g.userData.armR = V3(-.3, .62, 0);
  return g;
}
// 42 weather balloons over the chair: pale latex, in a loose column; each one can be hidden (popped)
export function cluster(n = 42, seed = 7) {
  const g = G(), R = rng(seed), cols = ['#FFF8EC', '#F6EAD2', '#FFFDF8', '#F2E2C4', '#FBF0DC'];
  const bm = cols.map(c => new THREE.MeshToonMaterial({ color: c, gradientMap: RAMP_SOFT, emissive: new THREE.Color(c).multiplyScalar(.42) }));
  const balls = [], tops = [];
  for (let i = 0; i < n; i++) {
    const tier = Math.floor(i / 9), a = i * 2.39996 + R() * .4, r = (tier < 1 ? 1.0 : 1.9) + R() * .9 - tier * .12;
    const p = V3(Math.cos(a) * r, 4.2 + tier * 1.55 + R() * .9, Math.sin(a) * r);
    const b = TM(new THREE.SphereGeometry(.82, 22, 16), bm[i % cols.length], g, p.x, p.y, p.z, .01); b.scale.set(1, 1.12, 1); b.castShadow = true;
    TM(new THREE.ConeGeometry(.1, .2, 8), bm[i % cols.length], b, 0, -.86, 0, .004).rotation.x = Math.PI;
    balls.push(b); tops.push(p);
  }
  // the strings: from each balloon's neck down to the chair's arms
  const pts = [];
  balls.forEach((b, i) => { const s = i % 2 ? 1 : -1; pts.push(b.position.clone().add(V3(0, -.95, 0)), V3(s * .3, .66, i % 3 ? .05 : -.05)); });
  const lg = new THREE.BufferGeometry().setFromPoints(pts); const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#3A3A40' })); g.add(lines);
  g.userData.balls = balls; g.userData.lines = lines;
  g.userData.pop = k => { balls.forEach((b, i) => { b.visible = i >= k; }); const arr = lines.geometry.attributes.position; lines.geometry.setDrawRange(k * 2, (n - k) * 2); };
  return g;
}
export function craft() {
  const g = G(); const ch = lawnChair(); g.add(ch); const cl = cluster(); g.add(cl);
  // ballast: plastic water jugs hanging off the sides
  for (const s of [-1, 1]) { const j = G(); j.position.set(s * .36, .25, .15); g.add(j); TM(B3(.16, .24, .16), '#DCEAF4', j, 0, 0, 0, .004); TM(new THREE.CylinderGeometry(.03, .03, .06, 8), '#2E6FB5', j, 0, .15, 0, .003); }
  g.userData.chair = ch; g.userData.cluster = cl;
  return g;
}
export function sandwich() { const g = G(); TM(B3(.16, .03, .12), '#E8C890', g, 0, 0, 0, .003); TM(B3(.17, .015, .13), '#4FA236', g, 0, .02, 0, .002); TM(B3(.16, .03, .12), '#E8C890', g, 0, .04, 0, .003); return g; }
export function radio() { const g = G(); TM(B3(.2, .1, .14), '#2A2A30', g, 0, 0, 0, .004); TM(B3(.06, .04, .01), '#7ACB8A', g, -.05, .01, .072, 0); TM(new THREE.CylinderGeometry(.005, .005, .32, 6), '#C8CCD4', g, .07, .2, 0, 0); return g; }
export function pelletGun() { const g = G(); TM(new THREE.CylinderGeometry(.012, .012, .55, 8), '#2A2A30', g, 0, 0, .28, .003).rotation.x = Math.PI / 2; TM(B3(.05, .1, .32), '#8A5A34', g, 0, -.03, -.1, .004); TM(B3(.04, .08, .08), '#2A2A30', g, 0, -.05, .06, .003); return g; }
export function rope(from, to, sag = .3, col = '#C8B07A') { const curve = new THREE.QuadraticBezierCurve3(from, from.clone().lerp(to, .5).add(V3(0, -sag, 0)), to); const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .018, 6), toon(col)); m.castShadow = true; return m; }

// ---------------- the backyard (Los Angeles, a sunny Saturday) ----------------
export function backyard() {
  const g = G(); g.name = 'backyard';
  const lawn = P(new THREE.PlaneGeometry(300, 300), std({ map: grassTex([60, 60]) }), g); lawn.rotation.x = -Math.PI / 2;
  const patio = P(new THREE.PlaneGeometry(9, 3.2), std({ map: concTex([3, 1]) }), g, 0, .01, -5.4); patio.rotation.x = -Math.PI / 2;
  const H = house({ w: 13, d: 7, col: '#F2D7B6', windows: [[-4, 3.51, 0], [4, 3.51, 0]], door: [0, 3.52] }); H.position.set(0, 0, -10.5); g.add(H);
  TM(B3(2.4, 2.2, .06), '#9FC8E4', H, 0, 1.1, 3.54, .006);   // the sliding door
  const fL = fence(20); fL.rotation.y = Math.PI / 2; fL.position.set(-10, 0, 0); g.add(fL); const fR = fence(20); fR.rotation.y = Math.PI / 2; fR.position.set(10, 0, 0); g.add(fR);
  const fB = fence(20); fB.position.set(0, 0, 10); g.add(fB);
  for (const [x, z, h, s] of [[-8, -6, 8.5, 1], [7.6, -7.4, 7.2, 3], [-9, 8, 6.4, 5], [15, 4, 9, 7], [-16, -2, 9.5, 9], [3, 22, 10, 11], [-22, 18, 8, 13]]) { const p = palm(h, .1, s); p.position.set(x, 0, z); g.add(p); }
  for (const [x, z, s] of [[-14, 14, 1.2], [14, 15, 1.1], [24, -6, 1.3], [-26, -8, 1.4], [0, 30, 1.5]]) { const t = tree(s, x * 7 + z); t.position.set(x, 0, z); g.add(t); }
  for (const [x, z, col, ry] of [[-17, -12, '#E8E0C8', 0], [17, -12, '#DCE8F0', 0], [-18, 20, '#F0D8D0', Math.PI], [18, 21, '#E8F0D8', Math.PI], [0, 26, '#F4E4C0', Math.PI]]) { const n = house({ w: 10, d: 7, col }); n.position.set(x, 0, z); n.rotation.y = ry; g.add(n); }
  const J = jeep('#C8402A'); J.position.set(4.6, 0, 2.4); J.rotation.y = Math.PI / 2 - .35; g.add(J); g.userData.jeep = J;
  const tanks = []; for (let i = 0; i < 5; i++) { const t = tank(); t.position.set(-3.4 + (i % 3) * .42, 0, -2.6 + Math.floor(i / 3) * .45); g.add(t); tanks.push(t); } g.userData.tanks = tanks;
  // a picnic table, a barbecue, a cooler
  const pt = G(); pt.position.set(-5.8, 0, -4.6); g.add(pt); TM(B3(1.8, .08, .8), '#B8865A', pt, 0, .75, 0, .006); for (const s of [-1, 1]) { TM(B3(1.8, .06, .3), '#B8865A', pt, 0, .45, s * .62, .005); TM(B3(.08, .75, .7), '#8A6040', pt, s * .75, .37, 0, .004); }
  const bbq = G(); bbq.position.set(5.6, 0, -5.4); g.add(bbq); TM(new THREE.SphereGeometry(.32, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), '#2A2A30', bbq, 0, .9, 0, .006).rotation.x = Math.PI; for (let k = 0; k < 3; k++) TM(new THREE.CylinderGeometry(.02, .02, .9, 6), '#2A2A30', bbq, Math.sin(k * 2.1) * .2, .45, Math.cos(k * 2.1) * .2, .003);
  TM(B3(.6, .4, .4), '#2E7FE0', g, -1.6, .2, -4.6, .006);
  // far hills in the haze
  const hillM = [std({ color: '#7FB062' }), std({ color: '#6AA050' }), std({ color: '#8CB870' })];
  for (let i = 0; i < 12; i++) { const a = -Math.PI + i * .55, d = 120 + (i % 3) * 30, r = 40 + (i % 4) * 12; const h = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), hillM[i % 3]); h.position.set(Math.sin(a) * d, -r * .55, Math.cos(a) * d); h.scale.set(1.5, .5, 1); g.add(h); }
  return g;
}

// ---------------- three miles up: a cloud sea below, a few cloud towers ----------------
export function sky() {
  const g = G(); g.name = 'sky'; const R = rng(21);
  const cm = toon('#FFFFFF', { soft: 1 }), cs = new THREE.SphereGeometry(1, 16, 10);
  const N = 900, im = new THREE.InstancedMesh(cs, cm, N); const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i < N; i++) { const a = R() * Math.PI * 2, d = 12 + Math.pow(R(), .6) * 380, sc = 6 + R() * 12; p.set(Math.cos(a) * d, -42 - R() * 6 + (d > 200 ? 4 : 0), Math.sin(a) * d); s.set(sc * 1.6, sc * (.45 + R() * .35), sc * 1.3); m.compose(p, q, s); im.setMatrixAt(i, m); }
  im.castShadow = false; im.receiveShadow = true; g.add(im);
  for (let i = 0; i < 7; i++) { const t = G(); const a = i * .9 + 1, d = 90 + i * 25; t.position.set(Math.cos(a) * d, -40, Math.sin(a) * d); g.add(t); for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(cs, cm); b.position.set(Math.sin(k * 2) * 6, k * 5, Math.cos(k * 2) * 5); b.scale.setScalar(9 - k * .6); t.add(b); } }
  return g;
}
// an airliner (a chunky toon jet, ~32 m long), nose to +x; no airline name
export function airliner(livery = '#C8283A') {
  const g = G(), L = 32, white = toon('#F4F4F6', { soft: 1 }), col = toon(livery), grey = toon('#B8BCC4'), win = toon('#2A3A5A');
  const body = TM(new THREE.CapsuleGeometry(.12 * L, .9 * L, 8, 20), white, g, 0, 0, 0, .05); body.rotation.z = Math.PI / 2;
  const wing = TM(B3(.3 * L, .025 * L, 1.15 * L), white, g, .02 * L, -.04 * L, 0, .04); wing.rotation.y = -.25 * 0;
  TM(B3(.16 * L, .02 * L, .46 * L), white, g, -.5 * L, .01 * L, 0, .03);
  const fin = TM(B3(.22 * L, .27 * L, .02 * L), col, g, -.5 * L, .15 * L, 0, .03); fin.rotation.z = -.35;
  for (const z of [-.3, .3]) { const en = TM(new THREE.CylinderGeometry(.045 * L, .04 * L, .17 * L, 14), grey, g, .08 * L, -.1 * L, z * L, .03); en.rotation.z = Math.PI / 2; }
  TM(B3(1.05 * L, .035 * L, .246 * L), col, g, -.02 * L, -.02 * L, 0, 0);
  for (let i = 0; i < 12; i++) for (const z of [-.122, .122]) TM(B3(.03 * L, .028 * L, .004 * L), win, g, (.38 - i * .066) * L, .045 * L, z * L, 0);
  TM(B3(.06 * L, .045 * L, .2 * L), win, g, .62 * L, .04 * L, 0, 0);
  g.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return g;
}
// the flight deck: the camera sits behind the two seats and looks out through the windscreen (the sky set is outside)
export function cockpit() {
  const g = G(); g.name = 'cockpit'; const wall = toon('#C8CCD4'), dark = toon('#2A2C34');
  const dash = ctex(1024, 256, (c, w, h) => { c.fillStyle = '#22252C'; c.fillRect(0, 0, w, h); for (let i = 0; i < 12; i++) { const x = 60 + i * 82, y = 90 + (i % 2) * 70; c.fillStyle = '#0E1014'; c.beginPath(); c.arc(x, y, 30, 0, 7); c.fill(); c.strokeStyle = '#D8DCE2'; c.lineWidth = 4; c.stroke(); c.strokeStyle = i % 3 ? '#F2C230' : '#4ADB6A'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 20 * Math.cos(i), y - 20 * Math.sin(i)); c.stroke(); } for (let i = 0; i < 30; i++) { c.fillStyle = ['#E8423A', '#4ADB6A', '#F2C230'][i % 3]; c.fillRect(40 + i * 32, 225, 14, 10); } });
  P(B3(3.2, .7, .9), new THREE.MeshToonMaterial({ color: '#2A2C34' }), g, 0, .85, -1.45);
  const dp = new THREE.Mesh(new THREE.PlaneGeometry(3.0, .7), new THREE.MeshBasicMaterial({ map: dash, toneMapped: false })); dp.position.set(0, 1.2, -1.0); dp.rotation.x = -.35; g.add(dp);
  // the windscreen frame: posts and sills around four big panes
  for (const x of [-1.55, -.55, .55, 1.55]) { const p = TM(B3(.12, 1.0, .12), wall, g, x, 1.85, -1.75, .006); p.rotation.x = .25; }
  TM(B3(3.4, .25, .3), wall, g, 0, 2.4, -1.65, .006); TM(B3(3.4, .2, .3), wall, g, 0, 1.32, -1.85, .006);
  for (const s of [-1, 1]) { TM(B3(.2, 2.2, 3.0), wall, g, s * 1.7, 1.3, 0, .006); TM(B3(.06, .5, .9), '#5A7A9A', g, s * 1.6, 1.8, -.6, .004); }
  TM(B3(3.4, .2, 3.2), wall, g, 0, 2.6, .2, .006); P(B3(3.4, .1, 3.2), dark, g, 0, 0, .2);
  for (const s of [-1, 1]) { const st = G(); st.position.set(s * .55, 0, .1); g.add(st); TM(B3(.6, .44, .6), '#3A3E48', st, 0, .22, 0, .006); TM(B3(.6, .9, .14), '#3A3E48', st, 0, .9, .32, .006); }
  TM(B3(.4, .5, 1.0), dark, g, 0, .55, -.4, .006);   // the centre pedestal (throttles)
  for (const s of [-1, 1]) TM(B3(.05, .22, .05), '#D8DCE2', g, s * .06, .9, -.6, 0).rotation.x = -.4;
  return g;
}
// the Air Force recruiting office: a desk, a flag, an eye chart on the wall
export function office() {
  const g = G(); g.name = 'office';
  P(new THREE.PlaneGeometry(10, 8), std({ map: concTex([4, 3]), color: '#C8C0B0' }), g, 0, 0, 0).rotation.x = -Math.PI / 2;
  P(B3(10, 4, .2), std({ color: '#D8DCE4' }), g, 0, 2, -3); P(B3(.2, 4, 8), std({ color: '#CFD4DC' }), g, -4, 2, 1); P(B3(.2, 4, 8), std({ color: '#CFD4DC' }), g, 4, 2, 1);
  const chart = textCanvas([{ text: 'E', size: 220, y: 200, color: '#141016' }, { text: 'F  P', size: 130, y: 380, color: '#141016' }, { text: 'T  O  Z', size: 96, y: 520, color: '#141016' }, { text: 'L  P  E  D', size: 70, y: 630, color: '#141016' }, { text: 'P  E  C  F  D', size: 50, y: 720, color: '#141016' }, { text: 'E  D  F  C  Z  P', size: 34, y: 790, color: '#141016' }], { w: 600, h: 860, bg: '#FBFAF4', round: 8 });
  const ch = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.29), new THREE.MeshBasicMaterial({ map: texFrom(chart), toneMapped: false })); ch.position.set(-1.6, 1.9, -2.88); g.add(ch); g.userData.chart = ch;
  const poster = textCanvas([{ text: 'U.S. AIR FORCE', size: 70, y: 110, color: '#FFFFFF' }, { text: 'PILOTS', size: 120, y: 260, color: '#F2C230' }, { text: 'WANTED', size: 90, y: 380, color: '#FFFFFF' }], { w: 600, h: 460, bg: '#1E3A6E', round: 20 });
  const ps = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.0), new THREE.MeshToonMaterial({ map: texFrom(poster) })); ps.position.set(1.4, 2.1, -2.88); g.add(ps);
  const desk = G(); desk.position.set(-.1, 0, -1.2); g.add(desk); TM(B3(2.2, .08, 1.0), '#6A4A30', desk, 0, .78, 0, .008); TM(B3(2.1, .7, .06), '#5A3E28', desk, 0, .4, .45, .006); for (const s of [-1, 1]) TM(B3(.08, .74, .9), '#5A3E28', desk, s * 1.04, .37, 0, .004);
  const fl = G(); fl.position.set(3.2, 0, -2.4); g.add(fl); TM(new THREE.CylinderGeometry(.03, .03, 2.6, 8), '#C8A04A', fl, 0, 1.3, 0, .004);
  const flag = ctex(300, 200, (c, w, h) => { for (let i = 0; i < 13; i++) { c.fillStyle = i % 2 ? '#FFFFFF' : '#C8283A'; c.fillRect(0, i * h / 13, w, h / 13 + 1); } c.fillStyle = '#1E3A6E'; c.fillRect(0, 0, w * .42, h * .54); c.fillStyle = '#FFFFFF'; for (let r = 0; r < 5; r++) for (let k = 0; k < 6; k++) c.fillRect(8 + k * 20, 8 + r * 20, 5, 5); });
  const fm = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .72, 8, 1), new THREE.MeshToonMaterial({ map: flag, side: THREE.DoubleSide })); fm.position.set(.56, 2.1, 0); fl.add(fm); const pa = fm.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 4) * .06); fm.geometry.computeVertexNormals();
  return g;
}
// a neighbourhood street with wooden power poles and sagging lines; houses either side
export function street() {
  const g = G(); g.name = 'street'; const R = rng(33);
  P(new THREE.PlaneGeometry(300, 300), std({ map: grassTex([60, 60]) }), g, 0, -.01, 0).rotation.x = -Math.PI / 2;
  P(new THREE.PlaneGeometry(200, 7), std({ map: asphaltTex([40, 2]) }), g, 0, .01, 0).rotation.x = -Math.PI / 2;
  for (const z of [-5, 5]) P(new THREE.PlaneGeometry(200, 2.4), std({ map: concTex([60, 1]) }), g, 0, .02, z).rotation.x = -Math.PI / 2;
  const dash = toon('#F2E6B0'); for (let i = 0; i < 30; i++) P(new THREE.PlaneGeometry(2, .14), dash, g, -60 + i * 4, .02, 0).rotation.x = -Math.PI / 2;
  const cols = ['#F2D7B6', '#DCE8F0', '#F0D8D0', '#E8F0D8', '#F4E4C0', '#E0D8F0'];
  for (let i = 0; i < 12; i++) for (const s of [-1, 1]) { const h = house({ w: 9, d: 7, col: cols[(i + (s > 0 ? 2 : 0)) % 6], windows: [[-2.4, 3.51, 0], [2.4, 3.51, 0]], door: [0, 3.52] }); h.position.set(-48 + i * 11 + (s > 0 ? 3 : 0), 0, s * 13); h.rotation.y = s > 0 ? Math.PI : 0; g.add(h); if (i % 2) { const p = palm(7 + R() * 2, .08, i * 3 + (s > 0 ? 1 : 0)); p.position.set(-44 + i * 11, 0, s * 7.2); g.add(p); } }
  // the poles: every 14 m along the north sidewalk, three wires sagging between them
  const poles = []; const wood = toon('#7A5A3A');
  for (let i = 0; i < 9; i++) { const x = -56 + i * 14, p = G(); p.position.set(x, 0, -6.2); g.add(p); TM(new THREE.CylinderGeometry(.13, .17, 9, 10), wood, p, 0, 4.5, 0, .006); TM(B3(.14, .14, 2.6), wood, p, 0, 8.4, 0, .005); for (const z of [-1.1, 0, 1.1]) TM(new THREE.CylinderGeometry(.05, .06, .14, 8), '#E8E8EC', p, 0, 8.56, z, .003);
    if (i % 3 === 1) { TM(new THREE.CylinderGeometry(.3, .3, .8, 14), '#8A9098', p, .3, 7.4, 0, .005); }
    poles.push(p); }
  const wireM = new THREE.MeshBasicMaterial({ color: '#16131A' });
  for (let i = 0; i < poles.length - 1; i++) for (const z of [-1.1, 0, 1.1]) { const a = V3(poles[i].position.x, 8.62, -6.2 + z), b = V3(poles[i + 1].position.x, 8.62, -6.2 + z); const c = new THREE.QuadraticBezierCurve3(a, a.clone().lerp(b, .5).add(V3(0, -.7, 0)), b); g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 20, .02, 5), wireM)); }
  g.userData.poles = poles;
  for (const [x, z, s] of [[-30, 20, 1.2], [20, -20, 1.3], [40, 22, 1.1]]) { const t = tree(s, x + z); t.position.set(x, 0, z); g.add(t); }
  return g;
}
export function policeCar() {
  const g = G(), wh = toon('#F4F4F6'), bk = toon('#16131A'), glass = toon('#5A7A9A');
  TM(B3(1.8, .6, 4.4), bk, g, 0, .7, 0, .01); TM(B3(1.82, .32, 1.6), wh, g, 0, .8, 0, .008);
  TM(B3(1.6, .55, 2.2), wh, g, 0, 1.28, -.2, .01); for (const s of [-1, 1]) TM(B3(.02, .4, 1.9), glass, g, s * .81, 1.3, -.2, 0);
  TM(B3(1.5, .42, .04), glass, g, 0, 1.3, .92, 0).rotation.x = .5; TM(B3(1.5, .42, .04), glass, g, 0, 1.3, -1.32, 0).rotation.x = -.5;
  for (const s of [-1, 1]) for (const z of [-1.4, 1.4]) { const w2 = TM(new THREE.CylinderGeometry(.36, .36, .26, 18), bk, g, s * .86, .36, z, .008); w2.rotation.z = Math.PI / 2; }
  const red = new THREE.Mesh(B3(.55, .14, .26), new THREE.MeshBasicMaterial({ color: '#FF2A2A', toneMapped: false })); red.position.set(-.32, 1.62, -.2); g.add(red);
  const blue = new THREE.Mesh(B3(.55, .14, .26), new THREE.MeshBasicMaterial({ color: '#2A6AFF', toneMapped: false })); blue.position.set(.32, 1.62, -.2); g.add(blue);
  const lab = textCanvas([{ text: 'POLICE', size: 120, y: 100, color: '#16131A' }], { w: 600, h: 180, bg: '#F4F4F6' }); for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .33), new THREE.MeshToonMaterial({ map: texFrom(lab), transparent: true })); l.position.set(s * .915, .82, 0); l.rotation.y = s * Math.PI / 2; g.add(l); }
  g.userData.lights = [red, blue];
  return g;
}
// a living room: a couch facing an old TV, a floor lamp, a window (the blackout)
export function room() {
  const g = G(); g.name = 'room';
  const wp = ctex(256, 256, (c, w, h) => { c.fillStyle = '#E8D8B8'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(200,120,80,.25)'; for (let x = 0; x < w; x += 32) c.fillRect(x, 0, 10, h); }, [6, 2]);
  P(new THREE.PlaneGeometry(10, 8), std({ color: '#8A5A3A' }), g, 0, 0, 0).rotation.x = -Math.PI / 2;
  P(B3(10, 3.2, .2), std({ map: wp }), g, 0, 1.6, -3); P(B3(.2, 3.2, 8), std({ map: wp }), g, -4, 1.6, 1); P(B3(.2, 3.2, 8), std({ map: wp }), g, 4, 1.6, 1);
  P(new THREE.PlaneGeometry(3.4, 2.4), std({ color: '#C8643C' }), g, 0, .01, 0).rotation.x = -Math.PI / 2;
  const couch = G(); couch.position.set(0, 0, 1.4); g.add(couch); const cc = toon('#5A8A6A'); TM(B3(2.4, .45, .9), cc, couch, 0, .32, 0, .01); TM(B3(2.4, .7, .25), cc, couch, 0, .7, .4, .01); for (const s of [-1, 1]) TM(B3(.25, .6, .9), cc, couch, s * 1.2, .45, 0, .01);
  const tvg = G(); tvg.position.set(0, 0, -2.2); g.add(tvg); TM(B3(1.3, .6, .6), '#6A4A30', tvg, 0, .3, 0, .008); TM(B3(1.1, .85, .7), '#4A3A2E', tvg, 0, 1.05, 0, .01);
  const scr = ctex(512, 384, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5AA8E8'); gr.addColorStop(1, '#2A6AB0'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#F2C230'; c.font = '900 64px Montserrat'; c.textAlign = 'center'; c.fillText('GAME SHOW', w / 2, 120); c.fillStyle = '#FFFFFF'; c.font = '900 120px Montserrat'; c.fillText('$100', w / 2, 270); });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(.86, .64), new THREE.MeshBasicMaterial({ map: scr, toneMapped: false })); screen.position.set(0, 1.07, .36); tvg.add(screen);
  const lamp = G(); lamp.position.set(-2.6, 0, -1.6); g.add(lamp); TM(new THREE.CylinderGeometry(.03, .03, 1.6, 8), '#C8A04A', lamp, 0, .8, 0, .004); const shade = TM(new THREE.CylinderGeometry(.2, .32, .35, 16, 1, true), '#F4E4C0', lamp, 0, 1.7, 0, .006); shade.material.side = THREE.DoubleSide;
  const bulbM = new THREE.MeshBasicMaterial({ color: '#FFE8B0', toneMapped: false }); const bulb = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 8), bulbM); bulb.position.set(0, 1.62, 0); lamp.add(bulb);
  const win = TM(B3(1.6, 1.2, .06), '#9FC8E4', g, 2.2, 1.8, -2.88, .006);
  g.userData.screen = screen; g.userData.bulb = bulb; g.userData.lampPos = V3(-2.6, 1.7, -1.6);
  return g;
}
export function mic(col = '#2A2A30') { const g = G(); TM(new THREE.CylinderGeometry(.016, .012, .2, 8), col, g, 0, 0, 0, .002); TM(new THREE.SphereGeometry(.035, 12, 8), '#5A5E68', g, 0, .12, 0, .002); TM(B3(.06, .05, .02), '#C8283A', g, 0, .06, 0, 0); return g; }
export function tvCam() { const g = G(); TM(B3(.18, .22, .5), '#2A2A30', g, 0, 0, 0, .004); TM(new THREE.CylinderGeometry(.07, .08, .2, 14), '#1A1A1E', g, 0, .02, .32, .003).rotation.x = Math.PI / 2; TM(B3(.06, .05, .08), '#C8283A', g, .06, .14, -.1, 0); return g; }
