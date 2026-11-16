// sets_air.js · the sets of "The Man Who Ate an Airplane", in the v4 toon style (outlined, saturated, soft shadows).
// field() a small airfield under the Alps with a hangar; cessna() a two-seat high-wing trainer that can be eaten part by part;
// table() a dinner table; stage() a theatre stage with an audience; shop() a workbench; studio() a white cyclorama for the
// tally; clinic() an X-ray light box; hall() a records ceremony; props: bicycle, cart, tv, coffin, fork, bolt, bottle, glass,
// scale, wrench, plaque, banana, egg.
import * as THREE from 'three';
import { TM, toon, G, RAMP_SOFT } from './toon.js';
import { textCanvas, texFrom, rng } from './kit.js';

function ctex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; t.userData.canvas = c; return t; }
const std = o => new THREE.MeshStandardMaterial({ roughness: 1, ...o });
const P = (geo, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
const B3 = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const tube = (parent, a, b, r, m) => { const L = a.distanceTo(b); const o = TM(new THREE.CylinderGeometry(r, r, L, 8), m, parent, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, .004); o.quaternion.setFromUnitVectors(V3(0, 1, 0), b.clone().sub(a).normalize()); return o; };
const grassTex = rep => ctex(512, 512, (g, w, h) => { const R = rng(3); g.fillStyle = '#5BAE3C'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { g.fillStyle = R() < .5 ? 'rgba(30,90,20,.22)' : 'rgba(180,230,110,.2)'; g.fillRect(R() * w, R() * h, 2, 4 + R() * 6); } }, rep);
const concTex = rep => ctex(256, 256, (g, w, h) => { const R = rng(9); g.fillStyle = '#C9C4BA'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '80,70,60'},.08)`; g.fillRect(R() * w, R() * h, 3, 3); } g.strokeStyle = 'rgba(90,80,70,.35)'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); }, rep);

// ---------------- the plane: a Cessna-150-like trainer, nose to +x, ~7.3 m long, 10 m span; eaten part by part ----------------
export function cessna() {
  const g = G(); const white = toon('#F6F6F8', { soft: 1 }), red = toon('#D8302E'), blue = toon('#2E5AA8'), dark = toon('#2A2C34'), glass = toon('#8FC0E0'), grey = toon('#B8BCC4');
  const parts = [];   // in the order he eats them
  const part = () => { const p = G(); g.add(p); parts.push(p); return p; };
  // the propeller + spinner
  const prop = part(); prop.position.set(3.55, 1.25, 0); TM(new THREE.ConeGeometry(.16, .32, 16), red, prop, .12, 0, 0, .008).rotation.z = -Math.PI / 2;
  const blades = G(); prop.add(blades); g.userData.blades = blades; for (const s of [-1, 1]) { const b = TM(B3(.06, .9, .14), dark, blades, .05, s * .48, 0, .006); b.rotation.x = s * .25; }
  // the wheels + fairings
  const wh = part(); for (const [x, z] of [[2.9, 0], [.9, -1.05], [.9, 1.05]]) { const w = TM(new THREE.CylinderGeometry(.24, .24, .14, 18), dark, wh, x, .24, z, .008); w.rotation.x = Math.PI / 2; TM(new THREE.SphereGeometry(.28, 14, 10), red, wh, x, .32, z, .006).scale.set(1.5, .7, .55); }
  const legs = part(); tube(legs, V3(2.9, .3, 0), V3(2.9, .85, 0), .04, grey); for (const s of [-1, 1]) tube(legs, V3(.9, .3, s * 1.05), V3(.7, .95, s * .4), .045, grey);
  // the tail: fin + rudder, tailplane
  const fin = part(); { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(-1.1, 0); sh.lineTo(-1.25, 1.35); sh.lineTo(-.85, 1.35); sh.lineTo(-.2, .3); sh.closePath(); const m = TM(new THREE.ExtrudeGeometry(sh, { depth: .06, bevelEnabled: false }), white, fin, -2.55, 1.3, -.03, .01); TM(B3(.3, 1.2, .07), red, fin, -3.62, 1.95, 0, .006); }
  const tp = part(); TM(B3(.8, .05, 3.2), white, tp, -3.3, 1.3, 0, .008); TM(B3(.25, .055, 3.2), red, tp, -3.68, 1.3, 0, .006);
  // the wing struts, then the wings (high wing, red tips)
  const st = part(); for (const s of [-1, 1]) tube(st, V3(.9, .75, s * .55), V3(1.0, 2.2, s * 2.7), .04, grey);
  for (const s of [-1, 1]) { const wg = part(); TM(B3(1.5, .14, 4.6), white, wg, 1.05, 2.38, s * 2.75, .01); TM(B3(1.52, .145, .5), red, wg, 1.05, 2.38, s * 4.85, .006); TM(B3(.5, .15, 1.6), blue, wg, .55, 2.38, s * 2.2, 0).scale.set(1, .2, 1); }
  // the cabin: windows and roof
  const cab = part(); TM(B3(1.35, .75, 1.08), glass, cab, 1.15, 1.85, 0, .008); TM(B3(1.45, .12, 1.1), white, cab, 1.15, 2.28, 0, .008);
  // the rear fuselage (tapering boom) with the stripe and the registration
  const rear = part(); { const boom = TM(new THREE.CylinderGeometry(.22, .55, 3.6, 16), white, rear, -1.55, 1.3, 0, .01); boom.rotation.z = Math.PI / 2 - .06; TM(new THREE.CylinderGeometry(.225, .555, 3.0, 16, 1, true), blue, rear, -1.4, 1.3, 0, 0).rotation.z = Math.PI / 2 - .06;
    const reg = textCanvas([{ text: 'F-MANG', size: 110, y: 90, color: '#16131A' }], { w: 512, h: 160 }); for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .38), new THREE.MeshBasicMaterial({ map: texFrom(reg), transparent: true, side: THREE.DoubleSide })); r.position.set(-1.9, 1.38, s * .44); r.rotation.y = s > 0 ? 0 : Math.PI; rear.add(r); } }
  // the engine cowling + the front cabin
  const cowl = part(); TM(B3(1.1, .8, 1.0), white, cowl, 2.95, 1.25, 0, .01); TM(B3(.12, .4, .7), dark, cowl, 3.5, 1.15, 0, .004); TM(B3(1.12, .14, 1.02), red, cowl, 2.95, .98, 0, .004);
  const body = part(); TM(B3(2.1, 1.05, 1.12), white, body, 1.4, 1.25, 0, .01); TM(B3(2.12, .16, 1.14), blue, body, 1.4, 1.02, 0, .004); for (const s of [-1, 1]) TM(B3(.7, .7, .02), glass, body, 1.5, 1.55, s * .57, .004);
  g.userData.parts = parts;
  g.userData.eat = f => { const k = Math.round(clamp01(f) * parts.length); parts.forEach((p, i) => p.visible = i >= k); };
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
const clamp01 = x => Math.max(0, Math.min(1, x));

// ---------------- the airfield (near Grenoble: the Alps behind) ----------------
export function field() {
  const g = G(); g.name = 'field';
  P(new THREE.PlaneGeometry(400, 400), std({ map: grassTex([80, 80]) }), g).rotation.x = -Math.PI / 2;
  P(new THREE.PlaneGeometry(26, 18), std({ map: concTex([8, 6]) }), g, 2, .01, -2).rotation.x = -Math.PI / 2;
  P(new THREE.PlaneGeometry(220, 12), std({ color: '#5A5C62' }), g, 0, .012, 26).rotation.x = -Math.PI / 2;   // the runway
  for (let i = 0; i < 18; i++) P(new THREE.PlaneGeometry(4, .35), toon('#F4F1EA'), g, -100 + i * 12, .02, 26).rotation.x = -Math.PI / 2;
  // the hangar: a half-cylinder roof, open doors
  const hg = G(); hg.position.set(2, 0, -14); g.add(hg); const corr = ctex(256, 64, (c, w, h) => { c.fillStyle = '#A8B0BC'; c.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x, 0, 4, h); } }, [12, 1]);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 18, 32, 1, true, -Math.PI / 2, Math.PI), new THREE.MeshToonMaterial({ map: corr, side: THREE.DoubleSide })); roof.rotation.x = Math.PI / 2; roof.rotation.z = Math.PI / 2; roof.position.set(0, 0, -9); roof.castShadow = roof.receiveShadow = true; hg.add(roof);
  const back = new THREE.Mesh(new THREE.CircleGeometry(8, 32, 0, Math.PI), toon('#8A92A0')); back.position.set(0, 0, -18); hg.add(back);
  for (const s of [-1, 1]) { const d = TM(B3(4.5, 7, .2), '#C8283A', hg, s * 7.0, 3.5, .05, .01); }
  const sign = textCanvas([{ text: 'AÉROCLUB', size: 120, y: 120, color: '#FFFFFF' }], { w: 900, h: 200, bg: '#2E5AA8', round: 30 }); const sg = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.33), new THREE.MeshToonMaterial({ map: texFrom(sign) })); sg.position.set(0, 6.7, .2); hg.add(sg);
  // the windsock
  const ws = G(); ws.position.set(-9, 0, 4); g.add(ws); TM(new THREE.CylinderGeometry(.06, .06, 5, 8), '#C8CCD4', ws, 0, 2.5, 0, .004); const sock = TM(new THREE.CylinderGeometry(.35, .18, 1.6, 12, 4, true), '#FF7A2A', ws, .8, 4.7, 0, .006); sock.rotation.z = Math.PI / 2 + .25; sock.material.side = THREE.DoubleSide;
  // the Alps
  const rockM = toon('#7A8AA0', { soft: 1 }), snowM = toon('#F4F8FC', { soft: 1 });
  for (let i = 0; i < 16; i++) { const a = -2.2 + i * .3, d = 150 + (i % 3) * 30, h = 50 + ((i * 37) % 40), r = 30 + (i % 4) * 8; const m = G(); m.position.set(Math.sin(a) * d, 0, -Math.cos(a) * d); g.add(m);
    const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), rockM); c.position.y = h / 2; m.add(c); const s = new THREE.Mesh(new THREE.ConeGeometry(r * .42, h * .42, 7), snowM); s.position.y = h * .79; m.add(s); }
  for (const [x, z, sc] of [[-14, -6, 1.2], [16, -4, 1.1], [-18, 12, 1.3], [22, 10, 1.2]]) { const t = G(); t.position.set(x, 0, z); t.scale.setScalar(sc); g.add(t); TM(new THREE.CylinderGeometry(.16, .24, 2.4, 10), '#7A5A3A', t, 0, 1.2, 0, .006); for (let k = 0; k < 4; k++) TM(new THREE.IcosahedronGeometry(1.1, 2), ['#4FA236', '#5DB042', '#45922E'][k % 3], t, Math.sin(k * 1.7) * .8, 2.9 + (k % 2) * .5, Math.cos(k * 1.7) * .6, .008); }
  return g;
}
// a dinner table: white cloth, a plate, knife and fork, a glass, a candle; the chair faces +z
export function table() {
  const g = G(); const cloth = toon('#FBFAF4', { soft: 1 });
  TM(new THREE.CylinderGeometry(.62, .62, .05, 32), cloth, g, 0, .76, 0, .008); TM(new THREE.CylinderGeometry(.64, .7, .5, 32, 1, true), cloth, g, 0, .52, 0, .008).material.side = THREE.DoubleSide;
  TM(new THREE.CylinderGeometry(.05, .08, .3, 10), '#6A4A30', g, 0, .14, 0, .004);
  const plate = TM(new THREE.CylinderGeometry(.18, .14, .025, 28), '#FFFFFF', g, 0, .8, .26, .004); g.userData.plate = plate;
  TM(B3(.02, .01, .2), '#C8CCD4', g, -.24, .79, .26, .002); TM(B3(.025, .01, .22), '#C8CCD4', g, .24, .79, .26, .002);
  TM(new THREE.CylinderGeometry(.04, .03, .12, 12), '#CFEFFF', g, .2, .85, .05, .003);
  TM(new THREE.CylinderGeometry(.02, .02, .2, 8), '#F4F1EA', g, -.15, .88, -.15, .002); const fl = new THREE.Mesh(new THREE.SphereGeometry(.025, 8, 6), new THREE.MeshBasicMaterial({ color: '#FFC850', toneMapped: false })); fl.position.set(-.15, 1.0, -.15); fl.scale.y = 1.6; g.add(fl);
  const ch = G(); ch.position.set(0, 0, .85); g.add(ch); TM(B3(.45, .06, .45), '#8A5A34', ch, 0, .45, 0, .006); TM(B3(.45, .6, .06), '#8A5A34', ch, 0, .78, .22, .006); for (const s of [-1, 1]) for (const z of [-1, 1]) TM(B3(.05, .45, .05), '#6A4A30', ch, s * .19, .22, z * .19, .003);
  return g;
}
// a theatre stage: red curtains, footlights, a spotlight, rows of audience
export function stage() {
  const g = G(); g.name = 'stage';
  P(B3(14, .8, 7), std({ color: '#5A3A22' }), g, 0, .4, 0); P(new THREE.PlaneGeometry(40, 40), std({ color: '#2A1E24' }), g, 0, 0, 10).rotation.x = -Math.PI / 2;
  const curt = ctex(256, 64, (c, w, h) => { for (let x = 0; x < w; x++) { const k = .55 + .45 * Math.sin(x / w * Math.PI * 16); c.fillStyle = `rgb(${Math.round(200 * k)},${Math.round(30 * k)},${Math.round(50 * k)})`; c.fillRect(x, 0, 1, h); } }, [3, 1]);
  const cm = new THREE.MeshToonMaterial({ map: curt, side: THREE.DoubleSide });
  P(new THREE.PlaneGeometry(14, 8), cm, g, 0, 4.8, -3.4); for (const s of [-1, 1]) { const c2 = P(new THREE.PlaneGeometry(3, 8), cm, g, s * 6, 4.8, -1.0); c2.rotation.y = s * -.4; }
  P(B3(15, 1.4, .6), std({ color: '#7A1A28' }), g, 0, 8.4, -1.6);
  const foot = new THREE.MeshBasicMaterial({ color: '#FFE8B0', toneMapped: false }); for (let i = 0; i < 12; i++) P(new THREE.SphereGeometry(.08, 8, 6), foot, g, -5.5 + i, .85, 3.4);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(2.2, 9, 32, 1, true), new THREE.MeshBasicMaterial({ color: '#FFF4D0', transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide })); cone.position.set(0, 5.3, 0); g.add(cone);
  // the audience: rows of simple seated silhouettes (heads + shoulders), facing the stage (-z)
  const R = rng(5), body = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.24, .3, 4, 8), new THREE.MeshToonMaterial({ color: '#FFFFFF' }), 120), head = new THREE.InstancedMesh(new THREE.SphereGeometry(.2, 12, 8), toon('#F4EEE4'), 120);
  const m = new THREE.Matrix4(); let n = 0; const cols = ['#C8283A', '#2E7FE0', '#F2C230', '#4AC88A', '#9A6AC8', '#E89A4A'];
  for (let r = 0; r < 6; r++) for (let i = 0; i < 20; i++) { const x = -9.5 + i + (r % 2) * .5, z = 6 + r * 1.3, y = r * .35; m.makeTranslation(x, y + .55, z); body.setMatrixAt(n, m); body.setColorAt(n, new THREE.Color(cols[Math.floor(R() * cols.length)])); m.makeTranslation(x, y + 1.05, z); head.setMatrixAt(n, m); n++; }
  g.add(body, head); g.userData.crowd = { body, head };
  return g;
}
// the workbench: a vise, a hacksaw, a pile of cut metal, a bottle of oil, a glass of water, a kitchen scale
export function shop() {
  const g = G(); g.name = 'shop';
  P(new THREE.PlaneGeometry(12, 10), std({ map: concTex([4, 3]) }), g).rotation.x = -Math.PI / 2;
  const pegs = ctex(256, 256, (c, w, h) => { c.fillStyle = '#C8A878'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(60,40,20,.5)'; for (let y = 8; y < h; y += 24) for (let x = 8; x < w; x += 24) { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); } }, [4, 2]);
  P(B3(12, 4, .2), std({ map: pegs }), g, 0, 2, -1.6);
  const bench = G(); bench.position.set(0, 0, -.6); g.add(bench); TM(B3(3.2, .12, 1.0), '#9A6A3E', bench, 0, .9, 0, .01); for (const s of [-1, 1]) for (const z of [-1, 1]) TM(B3(.1, .9, .1), '#6A4A30', bench, s * 1.5, .45, z * .4, .004);
  const vise = G(); vise.position.set(-.9, .96, .1); bench.add(vise); TM(B3(.3, .2, .25), '#2E5AA8', vise, 0, .1, 0, .005); TM(B3(.3, .18, .08), '#2E5AA8', vise, 0, .19, .14, .005);
  const bar = TM(B3(.9, .05, .05), '#B8BCC4', vise, .45, .24, .1, .003); g.userData.bar = bar;
  const pieces = []; const R = rng(8); for (let i = 0; i < 40; i++) { const p = TM(B3(.05 + R() * .05, .03, .03 + R() * .04), ['#B8BCC4', '#8A9098', '#C8A04A'][i % 3], bench, .2 + (R() - .5) * .5, .98 + R() * .05, .1 + (R() - .5) * .4, .002); p.rotation.y = R() * 3; pieces.push(p); } g.userData.pieces = pieces;
  const tools = [['#C8283A', -2.6], ['#2E5AA8', -2.0], ['#F2C230', 2.2], ['#4AC88A', 2.8]]; for (const [c, x] of tools) TM(B3(.08, .5, .05), c, g, x, 2.3, -1.45, .004);
  return g;
}
// a white cyclorama for the tally (bikes, carts, TVs, a coffin)
export function studio() { const g = G(); g.name = 'studio'; P(new THREE.PlaneGeometry(80, 80), std({ color: '#EDE8DE' }), g).rotation.x = -Math.PI / 2; const bg = P(new THREE.CylinderGeometry(30, 30, 30, 48, 1, true, Math.PI * .6, Math.PI * .8), std({ color: '#F2EEE6', side: THREE.BackSide }), g, 0, 15, 8); return g; }
// the doctor's office: the X-ray light box (a stomach full of bolts), a desk
export function clinic() {
  const g = G(); g.name = 'clinic';
  P(new THREE.PlaneGeometry(10, 8), std({ color: '#C8D0D8' }), g).rotation.x = -Math.PI / 2;
  P(B3(10, 4, .2), std({ color: '#E4ECF0' }), g, 0, 2, -2.4);
  const xr = ctex(600, 800, (c, w, h) => { c.fillStyle = '#0C1420'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(200,230,255,.55)'; c.lineWidth = 14; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(w / 2, 160 + i * 60, 230 - i * 6, 40, 0, Math.PI * .05, Math.PI * .95); c.stroke(); }
    c.fillStyle = 'rgba(200,230,255,.28)'; c.beginPath(); c.ellipse(w / 2 + 30, 520, 190, 150, -.3, 0, 7); c.fill(); c.strokeStyle = 'rgba(230,245,255,.95)'; c.lineWidth = 22; c.stroke();
    const R = rng(4); for (let i = 0; i < 26; i++) { c.save(); c.translate(w / 2 - 100 + R() * 240, 430 + R() * 190); c.rotate(R() * 3); c.fillStyle = 'rgba(255,255,255,.95)'; if (i % 3) { c.fillRect(-16, -5, 32, 10); c.fillRect(-20, -9, 8, 18); } else { c.beginPath(); c.arc(0, 0, 10, 0, 7); c.fill(); } c.restore(); }
    c.fillStyle = 'rgba(200,230,255,.5)'; c.fillRect(w / 2 - 14, 120, 28, 640); });
  const lb = TM(B3(1.3, 1.7, .1), '#E8E8EC', g, -.6, 1.95, -2.28, .006); const film = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.53), new THREE.MeshBasicMaterial({ map: xr, toneMapped: false })); film.position.set(-.6, 1.95, -2.22); g.add(film); g.userData.film = film;
  const desk = G(); desk.position.set(1.4, 0, -1.2); g.add(desk); TM(B3(1.8, .08, .9), '#E8E8EC', desk, 0, .76, 0, .006); TM(B3(1.7, .7, .06), '#C8CCD4', desk, 0, .38, .4, .006);
  return g;
}
// the records ceremony: a small stage, a banner, a podium
export function hall() {
  const g = G(); g.name = 'hall';
  P(B3(10, .5, 5), std({ color: '#1E2238' }), g, 0, .25, 0); P(new THREE.PlaneGeometry(40, 40), std({ color: '#2A2C3A' }), g, 0, 0, 8).rotation.x = -Math.PI / 2;
  P(B3(12, 6, .2), std({ color: '#2A3A6A' }), g, 0, 3, -2.6);
  const ban = textCanvas([{ text: 'WORLD RECORD', size: 120, y: 130, color: '#FFD24A' }, { text: 'STRANGEST DIET', size: 80, y: 250, color: '#FFFFFF' }], { w: 1000, h: 320, bg: '#16131A', round: 30 });
  const b = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.92), new THREE.MeshToonMaterial({ map: texFrom(ban) })); b.position.set(0, 3.8, -2.45); g.add(b);
  for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshBasicMaterial({ color: ['#FFD24A', '#FF6A8A', '#6AD0FF'][i % 3], toneMapped: false })); s.position.set(-5 + i * .77, 5.6 + Math.sin(i) * .2, -2.4); g.add(s); }
  return g;
}
// ---------------- props ----------------
export function bicycle(col = '#2E7FE0') { const g = G(); const tire = toon('#1A1A1E'), fr = toon(col); for (const x of [-.55, .55]) { const w = TM(new THREE.TorusGeometry(.34, .035, 8, 28), tire, g, x, .36, 0, .004); for (let k = 0; k < 4; k++) { const sp = TM(B3(.008, .64, .008), '#C8CCD4', g, x, .36, 0, 0); sp.rotation.z = k * Math.PI / 4; } }
  tube(g, V3(-.55, .36, 0), V3(-.05, .36, 0), .025, fr); tube(g, V3(-.05, .36, 0), V3(.4, .82, 0), .025, fr); tube(g, V3(-.55, .36, 0), V3(-.15, .85, 0), .025, fr); tube(g, V3(-.15, .85, 0), V3(.4, .82, 0), .025, fr); tube(g, V3(.55, .36, 0), V3(.4, .82, 0), .025, fr); tube(g, V3(-.05, .36, 0), V3(-.15, .85, 0), .025, fr);
  TM(B3(.22, .05, .1), '#1A1A1E', g, -.15, .9, 0, .003); tube(g, V3(.4, .82, 0), V3(.42, .98, 0), .02, fr); TM(B3(.05, .04, .45), '#1A1A1E', g, .42, .98, 0, .003); return g; }
export function cart() { const g = G(), w = toon('#C8CCD4'); const bx = G(); g.add(bx); for (let i = 0; i < 6; i++) tube(bx, V3(-.45 + i * .18, .5, -.3), V3(-.45 + i * .18, .5, .3), .008, w); for (let i = 0; i < 4; i++) tube(bx, V3(-.45, .5 + i * .14, -.3), V3(.45, .5 + i * .14, -.3), .008, w), tube(bx, V3(-.45, .5 + i * .14, .3), V3(.45, .5 + i * .14, .3), .008, w);
  for (const [x, z] of [[-.45, -.3], [.45, -.3], [-.45, .3], [.45, .3]]) tube(bx, V3(x, .1, z), V3(x, .95, z), .012, w); tube(g, V3(-.55, 1.0, -.3), V3(-.55, 1.0, .3), .02, toon('#C8283A'));
  for (const [x, z] of [[-.4, -.25], [.4, -.25], [-.4, .25], [.4, .25]]) { const wh = TM(new THREE.CylinderGeometry(.06, .06, .04, 12), '#1A1A1E', g, x, .06, z, .003); wh.rotation.x = Math.PI / 2; } return g; }
export function tv() { const g = G(); TM(B3(.62, .5, .5), '#6A4A30', g, 0, .25, 0, .008); const sc = TM(B3(.44, .34, .02), '#3A5A6A', g, -.04, .27, .25, .004); TM(new THREE.SphereGeometry(.025, 8, 6), '#C8CCD4', g, .24, .32, .25, .002); for (const s of [-1, 1]) { const a = TM(new THREE.CylinderGeometry(.006, .006, .4, 6), '#C8CCD4', g, s * .1, .66, 0, 0); a.rotation.z = s * .5; } return g; }
export function coffin() { const g = G(); const sh = new THREE.Shape(); sh.moveTo(-.25, -1); sh.lineTo(.25, -1); sh.lineTo(.36, .45); sh.lineTo(.22, 1); sh.lineTo(-.22, 1); sh.lineTo(-.36, .45); sh.closePath(); const c = TM(new THREE.ExtrudeGeometry(sh, { depth: .5, bevelEnabled: false }), '#7A4A2A', g, 0, 0, 0, .01); c.rotation.x = -Math.PI / 2; c.position.y = 0;
  const handles = []; for (const s of [-1, 1]) for (const z of [-.5, .1, .7]) { const h = TM(new THREE.TorusGeometry(.06, .012, 6, 12, Math.PI), '#D8B040', g, s * .33, .25, -z, .002); h.rotation.set(Math.PI / 2, 0, s * Math.PI / 2); handles.push(h); } g.userData.handles = handles; return g; }
export function fork() { const g = G(); TM(B3(.018, .2, .008), '#D8DCE2', g, 0, -.1, 0, .002); for (let i = 0; i < 4; i++) TM(B3(.004, .06, .006), '#D8DCE2', g, -.009 + i * .006, -.23, 0, 0); return g; }
export function bolt() { const g = G(); TM(new THREE.CylinderGeometry(.012, .012, .08, 8), '#B8BCC4', g, 0, 0, 0, .002); TM(new THREE.CylinderGeometry(.024, .024, .02, 6), '#B8BCC4', g, 0, .045, 0, .002); return g; }
export function bottle(label = 'OIL', col = '#E8C040') { const g = G(); TM(new THREE.CylinderGeometry(.05, .05, .2, 14), col, g, 0, .1, 0, .003); TM(new THREE.CylinderGeometry(.02, .04, .07, 12), col, g, 0, .23, 0, .003); TM(new THREE.CylinderGeometry(.022, .022, .03, 10), '#2A2A30', g, 0, .28, 0, .002); const l = textCanvas([{ text: label, size: 80, y: 70, color: '#16131A' }], { w: 256, h: 120, bg: '#FBF6E6' }); const lm = new THREE.Mesh(new THREE.CylinderGeometry(.051, .051, .08, 14, 1, true), new THREE.MeshToonMaterial({ map: texFrom(l) })); lm.position.y = .1; g.add(lm); return g; }
export function glassW() { const g = G(); TM(new THREE.CylinderGeometry(.04, .033, .12, 14), new THREE.MeshToonMaterial({ color: '#CFEFFF', transparent: true, opacity: .7 }), g, 0, .06, 0, .002); return g; }
export function scale() { const g = G(); TM(B3(.32, .06, .26), '#F4F4F6', g, 0, .03, 0, .004); TM(new THREE.CylinderGeometry(.13, .13, .015, 24), '#C8CCD4', g, 0, .07, 0, .002); const c = document.createElement('canvas'); c.width = 256; c.height = 96; const t = texFrom(c); const d = new THREE.Mesh(new THREE.PlaneGeometry(.14, .05), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); d.position.set(0, .035, .131); g.add(d);
  let key = ''; g.userData.show = txt => { if (txt === key) return; key = txt; const x = c.getContext('2d'); x.fillStyle = '#1C2A1C'; x.fillRect(0, 0, 256, 96); x.fillStyle = '#7AF09A'; x.font = '900 64px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 128, 52); t.needsUpdate = true; }; g.userData.show('0.0 KG'); return g; }
export function wrench() { const g = G(); TM(B3(.025, .26, .01), '#C8CCD4', g, 0, -.1, 0, .002); TM(new THREE.TorusGeometry(.035, .012, 6, 12, Math.PI * 1.5), '#C8CCD4', g, 0, -.25, 0, .002); return g; }
export function plaque() { const g = G(); TM(B3(.4, .5, .03), '#6A3A1E', g, 0, 0, 0, .004); const p = textCanvas([{ text: 'WORLD RECORD', size: 52, y: 90, color: '#3A2A0A' }, { text: 'STRANGEST', size: 64, y: 200, color: '#3A2A0A' }, { text: 'DIET', size: 64, y: 280, color: '#3A2A0A' }, { text: 'M. LOTITO', size: 44, y: 380, color: '#3A2A0A' }], { w: 400, h: 460, bg: '#D8B040', round: 16 }); const m = new THREE.Mesh(new THREE.PlaneGeometry(.34, .44), new THREE.MeshToonMaterial({ map: texFrom(p) })); m.position.z = .016; g.add(m); g.userData.face = m; return g; }
export function banana() { const g = G(); const c = new THREE.QuadraticBezierCurve3(V3(-.1, 0, 0), V3(0, -.07, 0), V3(.1, 0, 0)); TM(new THREE.TubeGeometry(c, 12, .025, 8), '#F2D23A', g, 0, 0, 0, .003); TM(new THREE.CylinderGeometry(.008, .01, .03, 6), '#5A4A2A', g, .105, .01, 0, 0).rotation.z = -.6; return g; }
export function egg() { const g = G(); const e = TM(new THREE.SphereGeometry(.035, 14, 10), '#FBFAF4', g, 0, 0, 0, .002); e.scale.set(1, 1.3, 1); return g; }
