// sets_closet.js · the sets of "The Closet" (Japan, 2008), style kit v5: saturated, warm/cool, lots of small props.
// kitchen() at night with the fridge (its door opens, the food can vanish item by item) · street() at dusk with his house,
// utility poles, a glowing vending machine · office() by day · washitsu() the tatami room with the oshiire closet (its
// sliding doors open; the top shelf holds the mattress, a lamp, bottles) · props: flipPhone() (live screen), hiddenCam(),
// flashlight(). The sets are lit "for real" (physically based materials, soft shadows, warm practical lights, no outlines)
// while the characters stay flat outlined toons, like the reference channel.
import * as THREE from 'three';
import { G } from './toon.js';
import { rng } from './kit.js';
const MC = new Map();
const pbr = (c, o = {}) => { const k = c + (o.map ? o.map.uuid : '') + (o.r ?? '') + (o.m ?? ''); if (!MC.has(k)) MC.set(k, new THREE.MeshStandardMaterial({ color: c, map: o.map ?? null, roughness: o.r ?? .72, metalness: o.m ?? 0 })); return MC.get(k); };
const toon = (c, o = {}) => pbr(c, o);
function TM(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, typeof m === 'string' ? pbr(m) : m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; if (parent) parent.add(o); return o; }

const B3 = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const C3 = (r0, r1, h, s = 20) => new THREE.CylinderGeometry(r0, r1, h, s);
const S3 = (r, w = 20, h = 14) => new THREE.SphereGeometry(r, w, h);
function ctex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; t.userData.canvas = c; return t; }
const P = (geo, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
const tmap = (map, o = {}) => toon('#FFFFFF', { map, ...o });
const glow = (col, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), toneMapped: false });
function plane(w, h, m, parent, x, y, z, ry = 0, rx = 0) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.set(rx, ry, 0); o.receiveShadow = true; parent.add(o); return o; }

// ---------------- textures ----------------
const planks = (a, b) => ctex(256, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(0, i * 32, w, 32); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, i * 32, w, 2); g.fillRect((i * 97) % w, i * 32, 2, 32); } }, [4, 4]);
const tiles = (a, line = 'rgba(255,255,255,.7)', n = 8) => ctex(256, 256, (g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w, h); g.strokeStyle = line; g.lineWidth = 4; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * w / n, 0); g.lineTo(i * w / n, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / n); g.lineTo(w, i * h / n); g.stroke(); } }, [3, 2]);
const tatami = () => ctex(512, 512, (g, w, h) => {
  const mat = (x, y, mw, mh) => { g.fillStyle = '#C9C86A'; g.fillRect(x, y, mw, mh); g.strokeStyle = 'rgba(90,100,30,.35)'; g.lineWidth = 2; for (let k = 4; k < (mw > mh ? mh : mw); k += 7) { g.beginPath(); if (mw > mh) { g.moveTo(x, y + k); g.lineTo(x + mw, y + k); } else { g.moveTo(x + k, y); g.lineTo(x + k, y + mh); } g.stroke(); }
    g.fillStyle = '#2E3A4A'; if (mw > mh) { g.fillRect(x, y, mw, 10); g.fillRect(x, y + mh - 10, mw, 10); } else { g.fillRect(x, y, 10, mh); g.fillRect(x + mw - 10, y, 10, mh); } };
  mat(0, 0, 512, 170); mat(0, 170, 256, 342); mat(256, 170, 256, 342);
}, [2, 2]);
const fusumaTex = () => ctex(512, 1024, (g, w, h) => {   // paper panel with a big blue wave and a red sun (one canvas = both panels side by side)
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#F6EEDA'); gr.addColorStop(1, '#EADCBC'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#D9483A'; g.beginPath(); g.arc(w * .72, h * .2, 70, 0, 7); g.fill();
  g.fillStyle = '#2E5AA8'; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(0, h * (.62 + k * .08)); for (let x = 0; x <= w; x += 32) g.quadraticCurveTo(x + 16, h * (.56 + k * .08) + Math.sin(x * .03 + k) * 20, x + 32, h * (.62 + k * .08)); g.lineTo(w, h); g.lineTo(0, h); g.fill(); g.fillStyle = k ? '#4A86D0' : '#3A6FC0'; }
  g.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 26; i++) { g.beginPath(); g.arc((i * 47) % w, h * .6 + (i % 3) * 20, 8, 0, 7); g.fill(); }
  g.strokeStyle = '#7A5A3A'; g.lineWidth = 14; g.strokeRect(0, 0, w, h);
});
const shojiTex = (lit) => ctex(256, 512, (g, w, h) => { g.fillStyle = lit ? '#FFF4D8' : '#2A3550'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6A4A2E'; g.lineWidth = 8; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * w / 4, 0); g.lineTo(i * w / 4, h); g.stroke(); } for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); } });

// ---------------- props ----------------
export function hiddenCam() {   // a small black box camera with a lens and a blinking red LED (userData.led)
  const g = G(); TM(B3(.12, .08, .1), '#1E1E24', g, 0, 0, 0, .004); TM(C3(.03, .034, .04, 20), '#2A2A30', g, 0, 0, .065, .003).rotation.x = Math.PI / 2;
  const lens = new THREE.Mesh(new THREE.CircleGeometry(.022, 20), glow('#5A8AF0', .8)); lens.position.set(0, 0, .086); g.add(lens);
  const led = new THREE.Mesh(S3(.009, 10, 8), glow('#FF2A2A', 2)); led.position.set(.04, .028, .052); g.add(led); g.userData.led = led;
  TM(C3(.004, .004, .3, 6), '#1E1E24', g, -.05, -.02, -.12, 0).rotation.x = Math.PI / 2;   // the cable
  return g;
}
export function flipPhone(col = '#C8283A') {   // an open 2008 flip phone; userData.screen(draw) repaints the screen
  const g = G(); TM(B3(.055, .1, .014), col, g, 0, -.055, 0, .003);
  const top = G(); top.position.set(0, -.005, 0); top.rotation.x = .22; g.add(top); TM(B3(.055, .1, .012), col, top, 0, .05, -.004, .003);
  const sc = document.createElement('canvas'); sc.width = 240; sc.height = 320; const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(.044, .066), new THREE.MeshBasicMaterial({ map: st, toneMapped: false })); scr.position.set(0, .052, .0025); top.add(scr);
  for (let i = 0; i < 12; i++) TM(B3(.01, .007, .003), '#F4F1EA', g, ((i % 3) - 1) * .015, -.035 - Math.floor(i / 3) * .011, .008, 0);
  let key = ''; g.userData.screen = (k, draw) => { if (k === key) return; key = k; const c = sc.getContext('2d'); draw(c, 240, 320); st.needsUpdate = true; };
  g.userData.screen('home', (c, w, h) => { c.fillStyle = '#1E3A6E'; c.fillRect(0, 0, w, h); c.fillStyle = '#FFFFFF'; c.font = '900 56px Montserrat'; c.textAlign = 'center'; c.fillText('14:03', w / 2, 140); });
  return g;
}
export function flashlight() { const g = G(); TM(C3(.022, .02, .2, 14), '#2A2A30', g, 0, 0, 0, .004).rotation.x = Math.PI / 2; TM(C3(.034, .024, .05, 16), '#C8CCD4', g, 0, 0, .12, .004).rotation.x = Math.PI / 2; const lens = new THREE.Mesh(new THREE.CircleGeometry(.03, 16), glow('#FFF4C8', 2)); lens.position.z = .146; g.add(lens); return g; }
export function bowl(col = '#E8423A') { const g = G(); TM(new THREE.SphereGeometry(.07, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), col, g, 0, .07, 0, .004).material.side = THREE.DoubleSide; TM(C3(.062, .062, .01, 20), '#F8F6F0', g, 0, .06, 0, 0); return g; }
function onigiri() { const g = G(); const tri = new THREE.CylinderGeometry(.045, .045, .03, 3); const r = TM(tri, '#FBFBF6', g, 0, .04, 0, .003); r.rotation.set(Math.PI / 2, 0, Math.PI / 6); TM(B3(.04, .03, .032), '#1E2A1E', g, 0, .015, 0, 0); return g; }
function eggs() { const g = G(); TM(B3(.18, .03, .08), '#D8C8A8', g, 0, .015, 0, .003); for (let i = 0; i < 6; i++) TM(S3(.018, 12, 10), '#FFF6E6', g, -.06 + (i % 3) * .06, .04, (i < 3 ? -.018 : .018), .002).scale.set(1, 1.25, 1); return g; }
function carton(col, label) { const g = G(); TM(B3(.07, .16, .07), '#FFFFFF', g, 0, .08, 0, .003); TM(B3(.072, .06, .072), col, g, 0, .1, 0, 0); const roof = TM(new THREE.CylinderGeometry(.0, .05, .04, 4), '#FFFFFF', g, 0, .18, 0, .003); roof.rotation.y = Math.PI / 4; return g; }
function cups(col) { const g = G(); for (let i = 0; i < 3; i++) { TM(C3(.026, .022, .05, 14), '#FFFFFF', g, -.05 + i * .05, .025, 0, .002); TM(C3(.027, .027, .006, 14), col, g, -.05 + i * .05, .052, 0, 0); } return g; }
function apple() { const g = G(); TM(S3(.035, 16, 12), '#E8323A', g, 0, .035, 0, .003); TM(C3(.003, .003, .02, 4), '#5A3A1A', g, 0, .075, 0, 0); return g; }
function bento() { const g = G(); TM(B3(.16, .045, .11), '#C8283A', g, 0, .022, 0, .003); TM(B3(.15, .01, .1), '#F6F2E6', g, 0, .046, 0, 0); TM(S3(.02, 10, 8), '#F2B030', g, -.04, .052, 0, 0); TM(S3(.018, 10, 8), '#4FA236', g, .02, .052, .02, 0); TM(S3(.016, 10, 8), '#E8566A', g, .05, .052, -.02, 0); return g; }
function bottle(col) { const g = G(); TM(C3(.03, .03, .16, 14), col, g, 0, .08, 0, .003); TM(C3(.012, .028, .04, 12), col, g, 0, .18, 0, .002); TM(C3(.013, .013, .02, 10), '#F4F1EA', g, 0, .21, 0, 0); TM(C3(.031, .031, .05, 14), '#FFFFFF', g, 0, .08, 0, 0); return g; }
function tofu() { const g = G(); TM(B3(.1, .04, .07), '#2E6FB5', g, 0, .02, 0, .003); TM(B3(.09, .032, .06), '#FBFBF6', g, 0, .042, 0, 0); return g; }

// ---------------- the kitchen (night) ----------------
// origin at the room centre on the floor; back wall at z -1.8, the fridge on the left of it, a window on the right
export function kitchen() {
  const g = G(); g.name = 'kitchen';
  plane(5, 5, tmap(planks('#C8864A', '#B8763E')), g, 0, 0, 0, 0, -Math.PI / 2);
  plane(5, 2.6, toon('#F4E8CC'), g, 0, 1.3, -1.8);                          // back wall (cream)
  plane(5, .7, tmap(tiles('#5CC6B6')), g, .6, 1.25, -1.79);                  // mint tiles over the counter
  plane(5, 2.6, toon('#F0DCB8'), g, -2.0, 1.3, 0, Math.PI / 2);              // left wall
  plane(5, 2.6, toon('#F0DCB8'), g, 2.2, 1.3, 0, -Math.PI / 2);              // right wall
  plane(5, 5, toon('#FBF4E4'), g, 0, 2.6, 0, 0, Math.PI / 2);                // ceiling
  // the window (night blue, a moon)
  const win = ctex(256, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1A2A6A'); gr.addColorStop(1, '#4A3A8A'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#FFF2C8'; c.beginPath(); c.arc(190, 60, 26, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 20; i++) c.fillRect((i * 53) % w, (i * 37) % 120, 2, 2); });
  const wv = new THREE.Mesh(new THREE.PlaneGeometry(1.0, .7), new THREE.MeshBasicMaterial({ map: win, toneMapped: false })); wv.position.set(1.4, 1.95, -1.78); g.add(wv);
  for (const [w, h, x, y] of [[1.1, .06, 1.4, 2.32], [1.1, .06, 1.4, 1.58], [.06, .8, .86, 1.95], [.06, .8, 1.94, 1.95], [.04, .7, 1.4, 1.95]]) TM(B3(w, h, .06), '#8A5A34', g, x, y, -1.76, .004);
  // counter + sink + cabinets
  TM(B3(2.4, .86, .6), '#E8F0EE', g, .6, .43, -1.5, .008); TM(B3(2.44, .05, .64), '#7A8A92', g, .6, .885, -1.5, .006);
  for (let i = 0; i < 4; i++) TM(B3(.04, .04, .02), '#C8A04A', g, -.25 + i * .6, .7, -1.19, 0);
  TM(B3(.5, .03, .4), '#5A6A72', g, .9, .9, -1.5, .003);
  TM(B3(2.4, .7, .36), '#5CC6B6', g, .6, 2.1, -1.62, .008);                 // upper cabinets (mint)
  for (let i = 0; i < 4; i++) TM(B3(.04, .1, .02), '#F4F1EA', g, -.25 + i * .6, 1.9, -1.43, 0);
  // on the counter: a rice cooker (pink), a kettle (red), a cutting board, a soy bottle
  TM(C3(.13, .14, .2, 24), '#F4A0B8', g, -.3, 1.01, -1.55, .006); TM(S3(.13, 24, 10), '#F8F4F0', g, -.3, 1.1, -1.55, .006).scale.set(1, .35, 1);
  TM(C3(.08, .11, .18, 20), '#E8423A', g, 1.5, 1.0, -1.55, .006); TM(C3(.01, .01, .1, 6), '#1E1E24', g, 1.61, 1.04, -1.55, 0).rotation.z = -.9;
  TM(B3(.36, .02, .24), '#E8C890', g, .35, .92, -1.48, .003);
  // the pendant lamp (warm), the little dining table with one chair, one bowl
  TM(C3(.004, .004, .7, 4), '#1E1E24', g, .3, 2.25, -.2, 0); TM(new THREE.ConeGeometry(.26, .2, 24, 1, true), '#F2B030', g, .3, 1.84, -.2, .006).material.side = THREE.DoubleSide;
  const bulb = new THREE.Mesh(S3(.06, 16, 12), glow('#FFE2A0', 2.2)); bulb.position.set(.3, 1.76, -.2); g.add(bulb);
  TM(B3(.9, .05, .6), '#B8763E', g, .3, .72, -.2, .006); for (const [x, z] of [[-.1, -.45], [.7, -.45], [-.1, .05], [.7, .05]]) TM(B3(.05, .7, .05), '#8A5A34', g, x, .35, z, .004);
  const chair = G(); chair.position.set(.3, 0, .4); g.add(chair); TM(B3(.42, .05, .42), '#E8423A', chair, 0, .45, 0, .006); TM(B3(.42, .5, .05), '#E8423A', chair, 0, .72, .19, .006); for (const [x, z] of [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]]) TM(B3(.04, .45, .04), '#8A5A34', chair, x, .22, z, .003);
  const bw = bowl('#2E6FB5'); bw.position.set(.3, .745, -.25); g.add(bw);
  // a wall calendar, a clock
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(.34, .46), tmap(ctex(170, 230, (c, w, h) => { c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, w, h); c.fillStyle = '#C8283A'; c.fillRect(0, 0, w, 48); c.fillStyle = '#FFFFFF'; c.font = '900 30px Montserrat'; c.textAlign = 'center'; c.fillText('2008', w / 2, 35); c.fillStyle = '#333'; c.font = '700 16px Montserrat'; for (let i = 0; i < 30; i++) c.fillText(String(i + 1), 18 + (i % 7) * 22, 75 + Math.floor(i / 7) * 32); })));
  cal.position.set(-1.98, 1.6, -.6); cal.rotation.y = Math.PI / 2; g.add(cal);
  // more life: a shelf of jars over the table, a plant, a rug, a wall clock, a noren curtain on the left wall
  TM(B3(1.0, .04, .22), '#8A5A34', g, -.6, 1.75, -1.68);
  ['#E8423A', '#F2B030', '#4FA236', '#2E6FB5', '#F4A0B8'].forEach((c, i) => { TM(C3(.05, .05, .14 + (i % 2) * .04, 16), c, g, -1.0 + i * .2, 1.85 + (i % 2) * .02, -1.66); TM(C3(.052, .052, .03, 16), '#F4F1EA', g, -1.0 + i * .2, 1.94 + (i % 2) * .04, -1.66); });
  TM(C3(.16, .12, .3, 16), '#C8643C', g, 1.95, .15, .9); for (let i = 0; i < 6; i++) { const lf = TM(new THREE.SphereGeometry(.16, 12, 8), '#3E9A3A', g, 1.95 + Math.sin(i) * .1, .45 + i * .07, .9 + Math.cos(i) * .1); lf.scale.set(1, .6, .5); lf.rotation.y = i; }
  const rug = new THREE.Mesh(new THREE.CircleGeometry(.9, 40), pbr('#2E5AA8', { r: .95 })); rug.rotation.x = -Math.PI / 2; rug.position.set(.3, .006, .1); rug.receiveShadow = true; g.add(rug);
  const rug2 = new THREE.Mesh(new THREE.RingGeometry(.62, .72, 40), pbr('#F2B030', { r: .95 })); rug2.rotation.x = -Math.PI / 2; rug2.position.set(.3, .008, .1); g.add(rug2);
  const clk = G(); clk.position.set(.3, 2.25, -1.78); g.add(clk); TM(C3(.18, .18, .04, 32), '#F4F1EA', clk).rotation.x = Math.PI / 2; TM(new THREE.TorusGeometry(.18, .02, 8, 32), '#2A2A30', clk); TM(B3(.015, .12, .01), '#2A2A30', clk, 0, .05, .03).rotation.z = .6; TM(B3(.012, .15, .01), '#C8283A', clk, 0, .06, .035).rotation.z = -1.2;
  const noren = ctex(256, 256, (c, w, h) => { c.fillStyle = '#1E3A6E'; c.fillRect(0, 0, w, h); c.fillStyle = '#F4F1EA'; c.beginPath(); c.arc(w / 2, h * .45, 50, 0, 7); c.fill(); c.fillStyle = '#1E3A6E'; c.beginPath(); c.arc(w / 2, h * .45, 34, 0, 7); c.fill(); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(w / 2 - 2, 0, 4, h); });
  for (const z of [.55, 1.05]) { const n = new THREE.Mesh(new THREE.PlaneGeometry(.5, 1.0), pbr('#FFFFFF', { map: noren, r: .9 })); n.material.side = THREE.DoubleSide; n.position.set(-1.98, 1.65, z); n.rotation.y = Math.PI / 2; g.add(n); }
  // the fridge: body, a door hinged on its left edge (opens toward the room), an interior light, shelves of food
  const F = G(); F.position.set(-1.35, 0, -1.42); g.add(F); g.userData.fridge = F;
  const body = G(); F.add(body); g.userData.fbody = body;   // the shell (hidden when the camera sits inside the fridge)
  TM(B3(.72, .09, .66), '#9FD8E8', body, 0, .045, 0, .01); TM(B3(.72, .08, .66), '#9FD8E8', body, 0, 1.74, 0, .01);
  for (const s of [-1, 1]) TM(B3(.04, 1.78, .66), '#9FD8E8', body, s * .34, .89, 0, .01);
  TM(B3(.72, 1.78, .04), '#9FD8E8', body, 0, .89, -.31, .01);
  // the lit inside: an open box (no front), glowing
  const im = new THREE.MeshBasicMaterial({ color: '#9CC4DE', side: THREE.DoubleSide, toneMapped: false });
  for (const [w, h, x, y, z, ry, rx] of [[.64, 1.62, 0, .9, -.28, 0, 0], [.58, 1.62, -.32, .9, .01, Math.PI / 2, 0], [.58, 1.62, .32, .9, .01, Math.PI / 2, 0], [.64, .58, 0, 1.7, .01, 0, Math.PI / 2], [.64, .58, 0, .1, .01, 0, Math.PI / 2]]) {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), im); pl.position.set(x, y, z); pl.rotation.set(rx, ry, 0); F.add(pl); }
  const shelves = [.45, .85, 1.25];
  for (const y of shelves) TM(B3(.62, .015, .54), '#DDEFF8', F, 0, y, .02, 0);
  const items = [];
  const putI = (o, x, y, z = .05) => { o.position.set(x, y + .008, z); F.add(o); items.push(o); };
  putI(bento(), -.13, .85); putI(eggs(), .14, .85); putI(carton('#2E6FB5'), -.18, .45); putI(cups('#F2B030'), .12, .45); putI(onigiri(), -.18, 1.25); putI(onigiri(), -.06, 1.25);
  putI(apple(), .1, 1.25); putI(apple(), .18, 1.25, -.06); putI(tofu(), .02, .45, -.12); putI(bottle('#4FA236'), .22, .45, -.1);
  g.userData.items = items;
  const hinge = G(); hinge.position.set(-.36, 0, .33); F.add(hinge); g.userData.door = hinge;
  TM(B3(.72, 1.78, .06), '#9FD8E8', hinge, .36, .89, .03, .01);
  TM(B3(.03, .4, .04), '#E8EAF0', hinge, .64, 1.1, .08, .003);
  TM(B3(.6, .05, .08), '#C8E4F0', hinge, .36, .6, -.04, .003); TM(B3(.6, .05, .08), '#C8E4F0', hinge, .36, 1.1, -.04, .003);   // door shelves
  const magnet = TM(C3(.03, .03, .01, 12), '#F2C230', hinge, .2, 1.5, .065, .002); magnet.rotation.x = Math.PI / 2;
  const fl = new THREE.PointLight('#BFE8FF', 0, 3.2, 1.6); fl.position.set(0, 1.0, .5); F.add(fl); g.userData.flight = fl;
  // where the hidden camera goes (on top of the upper cabinets, at the right end)
  g.userData.camSpot = new THREE.Vector3(1.62, 2.5, -1.55);
  return g;
}

// ---------------- the street at dusk, his house ----------------
export function street() {
  const g = G(); g.name = 'street'; const R = rng(5);
  plane(80, 40, toon('#5A5E6E'), g, 0, 0, 4, 0, -Math.PI / 2);
  plane(80, 2.2, toon('#B8B0A6'), g, 0, .01, 1.6, 0, -Math.PI / 2);
  for (let i = -10; i <= 10; i++) { const d = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .14), toon('#F4F1EA')); d.rotation.x = -Math.PI / 2; d.position.set(i * 4, .012, 5.2); g.add(d); }
  const house = (x, z, w, d, wall, roof, s = 1) => {
    const h = G(); h.position.set(x, 0, z); g.add(h);
    TM(B3(w, 2.8, d), wall, h, 0, 1.4, 0, .02); TM(B3(w, 2.5, d - .3), wall, h, 0, 4.05, -.1, .02);
    const rf = new THREE.CylinderGeometry(.01, d * .62, w + .5, 4, 1); const r = TM(rf, roof, h, 0, 5.6, -.1, .02); r.rotation.set(0, 0, Math.PI / 2); r.scale.set(1, 1, .75);
    TM(B3(w + .5, .12, d + .5), roof, h, 0, 2.86, 0, .015);
    for (const wx of [-w * .25, w * .25]) { const lit = R() > .3; const wn = new THREE.Mesh(new THREE.PlaneGeometry(.8, .7), glow(lit ? '#FFD488' : '#3A4A7A', lit ? 1.25 : 1)); wn.position.set(wx, 4.0, d / 2 - .14); h.add(wn); TM(B3(.9, .06, .1), '#5A3A22', h, wx, 3.62, d / 2 - .12, .004); }
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.9), glow('#FFC878', 1.1)); door.position.set(w * .2, .95, d / 2 + .01); h.add(door);
    TM(B3(1.3, .08, .1), '#3A2A1E', h, w * .2, 1.94, d / 2 + .03, .004); for (let k = -2; k <= 2; k++) TM(B3(.03, 1.9, .03), '#3A2A1E', h, w * .2 + k * .22, .95, d / 2 + .03, 0);
    const wn2 = new THREE.Mesh(new THREE.PlaneGeometry(.9, .8), glow('#FFD488', 1.2)); wn2.position.set(-w * .22, 1.4, d / 2 + .01); h.add(wn2);
    return h;
  };
  g.userData.house = house(0, -3.5, 6, 5, '#F4EEE2', '#2E3A6A');
  house(-7.5, -4, 5.5, 5, '#E8C8A0', '#7A2E2E'); house(7.4, -4, 5.6, 5, '#CFE0E8', '#3A3A44'); house(-14.5, -4.5, 5, 5, '#F0D8D0', '#2E4A3A'); house(14.6, -4.5, 5, 5, '#E8E0B8', '#6A3A2A');
  // a low block wall, a bicycle, a vending machine (glowing), utility poles with wires, a street lamp
  for (let i = -9; i <= 9; i++) TM(B3(1.9, .9, .2), '#C8C0B4', g, i * 2, .45, .3, .006);
  const vm = G(); vm.position.set(4.6, 0, 1.0); g.add(vm); TM(B3(1.0, 1.8, .7), '#E8423A', vm, 0, .9, 0, .01);
  const vmf = ctex(256, 256, (c, w, h) => { c.fillStyle = '#F8F6F0'; c.fillRect(0, 0, w, h); const cols = ['#2E6FB5', '#F2B030', '#4FA236', '#E8423A', '#7A3AB0', '#F4A0B8']; for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) { c.fillStyle = cols[(r * 2 + k) % 6]; c.fillRect(14 + k * 40, 20 + r * 74, 26, 48); c.fillStyle = '#FFFFFF'; c.fillRect(16 + k * 40, 26 + r * 74, 22, 8); } });
  const vfm = new THREE.Mesh(new THREE.PlaneGeometry(.86, .9), new THREE.MeshBasicMaterial({ map: vmf, toneMapped: false, color: new THREE.Color(1.15, 1.15, 1.15) })); vfm.position.set(0, 1.25, .36); vm.add(vfm);
  TM(B3(.4, .12, .05), '#1E1E24', vm, -.2, .45, .36, .003);
  const vlight = new THREE.PointLight('#FFF0D8', 3, 4, 1.6); vlight.position.set(0, 1.2, 1.0); vm.add(vlight);
  for (const x of [-6, 2.6, 11]) { TM(C3(.12, .14, 8, 12), '#9A948C', g, x, 4, .9, .01); TM(B3(1.4, .1, .1), '#6A6460', g, x, 7.2, .9, .004); TM(C3(.12, .12, .3, 10), '#5A5A60', g, x + .4, 6.8, .9, .004); }
  for (const [y, sag] of [[7.25, .5], [7.1, .6], [6.8, .45]]) for (const [a, b] of [[-6, 2.6], [2.6, 11], [-14, -6], [11, 19]]) {
    const cv = new THREE.QuadraticBezierCurve3(new THREE.Vector3(a + .6, y, .9), new THREE.Vector3((a + b) / 2, y - sag, .9), new THREE.Vector3(b - .6, y, .9));
    const m = new THREE.Mesh(new THREE.TubeGeometry(cv, 20, .012, 4), toon('#1E1E24')); g.add(m); }
  const lamp = G(); lamp.position.set(-2.4, 0, 1.0); g.add(lamp); TM(C3(.05, .06, 3.6, 10), '#3A3A44', lamp, 0, 1.8, 0, .004); TM(B3(.5, .08, .14), '#3A3A44', lamp, .2, 3.6, 0, .004); const lb = new THREE.Mesh(B3(.3, .03, .1), glow('#FFF4D8', 2)); lb.position.set(.35, 3.55, 0); lamp.add(lb);
  const bike = G(); bike.position.set(-1.0, 0, 1.0); bike.rotation.y = .3; g.add(bike); for (const x of [-.45, .45]) TM(new THREE.TorusGeometry(.3, .025, 6, 24), '#1E1E24', bike, x, .32, 0, .003); TM(B3(.9, .04, .04), '#4FA236', bike, 0, .5, 0, .003); TM(B3(.04, .4, .04), '#4FA236', bike, -.15, .5, 0, .003); TM(B3(.3, .2, .25), '#C8CCD4', bike, .5, .62, 0, .003);
  // potted plants at the doors
  for (const x of [-1.6, 1.6, 9.0, -6.0]) { TM(C3(.2, .16, .35, 14), '#C8643C', g, x, .18, -.6, .005); TM(S3(.3, 14, 10), '#4FA236', g, x, .6, -.6, .006); }
  return g;
}

// ---------------- the office (day) ----------------
export function office() {
  const g = G(); g.name = 'office';
  plane(10, 10, tmap(tiles('#8A9AB0', 'rgba(0,0,0,.08)', 6)), g, 0, 0, 0, 0, -Math.PI / 2);
  plane(10, 3, toon('#E8EEF4'), g, 0, 1.5, -2.6);
  const city = ctex(512, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5AB0F0'); gr.addColorStop(1, '#BFE4FF'); c.fillStyle = gr; c.fillRect(0, 0, w, h); const cols = ['#8A9AB8', '#A8B4CC', '#7A8AA8', '#C8D0DC']; for (let i = 0; i < 22; i++) { const bw = 20 + (i * 13) % 30, bh = 60 + (i * 37) % 150, x = i * 24; c.fillStyle = cols[i % 4]; c.fillRect(x, h - bh, bw, bh); c.fillStyle = 'rgba(255,255,255,.5)'; for (let y = h - bh + 8; y < h - 6; y += 14) for (let k = 4; k < bw - 6; k += 9) c.fillRect(x + k, y, 4, 6); } });
  const cv = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.6), new THREE.MeshBasicMaterial({ map: city, toneMapped: false })); cv.position.set(0, 1.7, -2.55); g.add(cv);
  for (let i = 0; i <= 6; i++) TM(B3(.08, 1.7, .08), '#C8D0DC', g, -3 + i, 1.7, -2.5, .004);
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(B3(1.2, .03, .3), glow('#FFFFFF', 1.1)); l.position.set(-2 + (i % 3) * 2, 2.95, -1 + Math.floor(i / 3) * 2); g.add(l); }
  const desk = (x, z, ry = 0) => { const d = G(); d.position.set(x, 0, z); d.rotation.y = ry; g.add(d); TM(B3(1.3, .04, .7), '#D8DCE2', d, 0, .74, 0, .006); TM(B3(1.3, .7, .03), '#9AA4B0', d, 0, .37, -.33, .004); for (const s of [-1, 1]) TM(B3(.04, .72, .68), '#9AA4B0', d, s * .63, .36, 0, .004);
    TM(B3(.5, .34, .03), '#2A2A30', d, 0, 1.0, -.2, .004); const sc = new THREE.Mesh(new THREE.PlaneGeometry(.46, .3), glow('#7AC8F0', .9)); sc.position.set(0, 1.0, -.184); d.add(sc); TM(B3(.06, .14, .06), '#2A2A30', d, 0, .82, -.22, .003);
    TM(B3(.42, .02, .14), '#E8EAF0', d, 0, .77, .05, .003); TM(B3(.24, .06, .3), ['#F2B030', '#E8423A', '#4FA236'][Math.abs(Math.round(x)) % 3], d, .45, .79, -.1, .004); return d; };
  plane(10, 3, toon('#DCE6F0'), g, 0, 1.5, 3.2, Math.PI);   // the wall behind him: a whiteboard, a clock, a door, posters
  TM(B3(1.6, .9, .04), '#F8F8F6', g, -1.0, 1.55, 3.17); TM(B3(1.66, .05, .06), '#9AA4B0', g, -1.0, 1.08, 3.15);
  for (const [x0, y0, w0, c0] of [[-1.5, 1.75, .5, '#2E6FB5'], [-1.2, 1.55, .7, '#E8423A'], [-.7, 1.35, .4, '#4FA236']]) TM(B3(w0, .03, .01), c0, g, x0 + w0 / 2, y0, 3.14);
  const ck = G(); ck.position.set(.6, 2.3, 3.15); ck.rotation.y = Math.PI; g.add(ck); TM(C3(.16, .16, .04, 28), '#F4F1EA', ck).rotation.x = Math.PI / 2; TM(new THREE.TorusGeometry(.16, .018, 8, 28), '#2A2A30', ck);
  TM(B3(.9, 2.1, .06), '#8A9AB0', g, 1.8, 1.05, 3.15); TM(B3(.06, .2, .06), '#C8CCD4', g, 1.45, 1.05, 3.1);
  for (const [x0, c0] of [[.3, '#F2B030'], [.8, '#E8423A']]) TM(B3(.4, .55, .01), c0, g, x0, 1.55, 3.16);
  TM(B3(.6, 1.6, .5), '#9AA4B0', g, -2.6, .8, 2.9); for (let i = 0; i < 4; i++) TM(B3(.5, .04, .42), '#C8D0DC', g, -2.6, .3 + i * .4, 2.88);   // a filing cabinet
  g.userData.desk = desk(0, 0); desk(-1.6, -.2); desk(1.6, -.2); desk(-1.6, 1.6, Math.PI); desk(1.6, 1.6, Math.PI);
  for (const x of [-3.2, 3.2]) { TM(C3(.2, .16, .4, 12), '#F4F1EA', g, x, .2, -2.1, .005); TM(S3(.38, 14, 10), '#4FA236', g, x, .75, -2.1, .006); }
  const chair = G(); chair.position.set(0, 0, .55); g.add(chair); TM(B3(.48, .08, .46), '#2E6FB5', chair, 0, .48, 0, .006); TM(B3(.46, .6, .08), '#2E6FB5', chair, 0, .85, .22, .006); TM(C3(.03, .03, .4, 8), '#3A3A44', chair, 0, .24, 0, .003);
  return g;
}

// ---------------- the tatami room and the closet ----------------
// back wall at z -1.8 holds the oshiire (closet) centred at x 0: 1.8 wide, 1.8 high, the middle shelf at y .85
export function washitsu() {
  const g = G(); g.name = 'washitsu';
  plane(6, 6, tmap(tatami()), g, 0, 0, 0, 0, -Math.PI / 2);
  plane(2.1, 2.5, toon('#E8D8B4'), g, -1.95, 1.25, -1.82); plane(2.1, 2.5, toon('#E8D8B4'), g, 1.95, 1.25, -1.82); plane(1.8, .7, toon('#E8D8B4'), g, 0, 2.15, -1.82);   // the back wall, with the closet opening
  plane(6, 2.5, toon('#E8D8B4'), g, -2.3, 1.25, 0, Math.PI / 2); plane(6, 2.5, toon('#E8D8B4'), g, 2.3, 1.25, 0, -Math.PI / 2);
  plane(6, 6, toon('#C8A06A'), g, 0, 2.5, 0, 0, Math.PI / 2);
  for (const x of [-2.25, -1.05, 1.05, 2.25]) TM(B3(.1, 2.5, .1), '#8A5A34', g, x, 1.25, -1.76, .004);
  TM(B3(4.6, .1, .1), '#8A5A34', g, 0, 2.0, -1.76, .004);
  // shoji on the left wall (night: dark blue paper)
  const sj = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.8), new THREE.MeshBasicMaterial({ map: shojiTex(false), toneMapped: false })); sj.position.set(-2.28, 1.1, -.2); sj.rotation.y = Math.PI / 2; g.add(sj);
  // the oshiire: dark interior box, the middle shelf, the futons below, her things above
  const O = G(); O.position.set(0, 0, -1.8); g.add(O); g.userData.closet = O;
  const inside = new THREE.Mesh(B3(1.78, 1.8, .82), toon('#B8946A')); inside.material = inside.material.clone(); inside.material.side = THREE.BackSide; inside.position.set(0, .9, -.41); O.add(inside);
  TM(B3(1.78, .06, .8), '#A8845A', O, 0, .85, -.41, .004);
  for (let i = 0; i < 3; i++) TM(B3(1.0, .16, .6), ['#E8EAF0', '#F4A0B8', '#9FD8E8'][i], O, -.3, .09 + i * .17, -.42, .006);   // stored futons below
  TM(B3(.5, .4, .4), '#C8A06A', O, .55, .2, -.4, .006);
  // up top: the thin mattress, a pink blanket, a pillow, a little battery lamp, water bottles, a bag
  const top = G(); top.position.set(0, .88, -.42); O.add(top); g.userData.nest = top;
  TM(B3(1.55, .07, .66), '#F4F1EA', top, 0, .035, 0, .006);
  const sheet = ctex(256, 128, (c, w, h) => { c.fillStyle = '#9FD8E8'; c.fillRect(0, 0, w, h); c.fillStyle = '#FFFFFF'; for (let i = 0; i < 40; i++) { c.beginPath(); c.arc((i * 37) % w, (i * 23) % h, 6, 0, 7); c.fill(); } });
  const mt = new THREE.Mesh(B3(1.5, .02, .62), tmap(sheet)); mt.position.set(0, .075, 0); top.add(mt);
  const bl = TM(B3(.7, .08, .6), '#F2799A', top, .35, .11, 0, .006); bl.rotation.z = .03;
  TM(B3(.3, .09, .22), '#FFFFFF', top, -.58, .12, 0, .005);
  const lampG = G(); lampG.position.set(.66, .07, -.22); top.add(lampG); TM(C3(.05, .06, .1, 14), '#F2B030', lampG, 0, .05, 0, .004); const lb = new THREE.Mesh(S3(.045, 14, 10), glow('#FFE2A0', 1.8)); lb.position.y = .13; lampG.add(lb);
  const nl = new THREE.PointLight('#FFD488', 0, 1.6, 1.4); nl.position.set(.66, .3, -.1); top.add(nl); g.userData.nestLight = nl;
  for (let i = 0; i < 3; i++) { const b = bottle(['#9FD8E8', '#BFE8FF', '#9FD8E8'][i]); b.scale.setScalar(.8); b.position.set(-.7 + i * .09, .07, -.22); top.add(b); }
  TM(B3(.24, .18, .14), '#7A3AB0', top, .1, .16, -.22, .005);
  // the sliding doors (fusuma): two panels in front, each 0.9 wide; open(k) slides the right one behind the left
  const ft = fusumaTex(), fm = tmap(ft);
  const panel = (x, flip) => { const p = G(); p.position.set(x, 0, .02); O.add(p); const m = new THREE.Mesh(B3(.9, 1.8, .03), fm); m.position.y = .9; m.castShadow = m.receiveShadow = true; if (flip) m.scale.x = -1; p.add(m);
    TM(B3(.92, .04, .04), '#5A3A22', p, 0, 1.8, .0, .003); TM(B3(.92, .04, .04), '#5A3A22', p, 0, 0, 0, .003); for (const s of [-1, 1]) TM(B3(.04, 1.8, .04), '#5A3A22', p, s * .45, .9, 0, .003);
    const pull = TM(C3(.03, .03, .01, 16), '#3A2A1E', p, flip ? .34 : -.34, .95, .02, 0); pull.rotation.x = Math.PI / 2; return p; };
  const L = panel(-.45, 0), Rr = panel(.45, 1); Rr.position.z = .05;
  g.userData.open = k => { Rr.position.x = .45 - .9 * k; };
  TM(B3(1.9, .2, .12), '#8A5A34', O, 0, 1.9, .02, .004);   // the lintel over the closet
  // more life: a hanging scroll, a tall paper floor lamp (off), a chest of drawers, a vase of flowers, a calendar
  const scroll = ctex(128, 384, (c, w, h) => { c.fillStyle = '#F4EEDC'; c.fillRect(0, 0, w, h); c.fillStyle = '#2A2A30'; c.font = '700 70px serif'; c.textAlign = 'center'; c.fillText('和', w / 2, 150); c.fillText('心', w / 2, 250); c.fillStyle = '#C8283A'; c.fillRect(w / 2 - 12, 300, 24, 24); });
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(.4, 1.2), pbr('#FFFFFF', { map: scroll, r: .9 })); sc.position.set(-1.6, 1.35, -1.8); g.add(sc); TM(C3(.015, .015, .5, 8), '#5A3A22', g, -1.6, 1.97, -1.79).rotation.z = Math.PI / 2;
  const chest = G(); chest.position.set(1.65, 0, -1.45); g.add(chest); TM(B3(.8, .9, .45), '#7A4A26', chest, 0, .45, 0); for (let i = 0; i < 3; i++) { TM(B3(.74, .25, .02), '#8A5A34', chest, 0, .17 + i * .28, .23); TM(B3(.12, .03, .03), '#C8A04A', chest, 0, .17 + i * .28, .25); }
  TM(C3(.07, .1, .25, 14), '#2E6FB5', chest, -.2, 1.02, 0); for (let i = 0; i < 4; i++) TM(new THREE.SphereGeometry(.05, 10, 8), ['#F2799A', '#F2B030', '#F4F1EA', '#E8423A'][i], chest, -.2 + Math.sin(i * 1.6) * .06, 1.24 + (i % 2) * .05, Math.cos(i * 1.6) * .05);
  const fl = G(); fl.position.set(-1.9, 0, .9); g.add(fl); TM(C3(.03, .03, 1.1, 8), '#3A2A1E', fl, 0, .55, 0); TM(C3(.16, .2, .45, 16, ), '#F4EEDC', fl, 0, 1.2, 0);
  // a low table, red cushions, a small TV on a stand, a lamp
  TM(new THREE.CylinderGeometry(.55, .55, .05, 32), '#8A5A34', g, .2, .34, .6, .006); for (const a of [0, 1, 2, 3]) TM(B3(.05, .32, .05), '#6A4024', g, .2 + Math.cos(a * Math.PI / 2 + .78) * .4, .16, .6 + Math.sin(a * Math.PI / 2 + .78) * .4, .003);
  for (const [x, z] of [[-.6, .7], [.9, 1.1]]) TM(B3(.5, .08, .5), '#D9483A', g, x, .04, z, .006);
  const tvs = G(); tvs.position.set(1.7, 0, -1.2); tvs.rotation.y = -.6; g.add(tvs); TM(B3(.8, .4, .4), '#5A3A22', tvs, 0, .2, 0, .006); TM(B3(.62, .42, .06), '#1E1E24', tvs, 0, .64, 0, .004); const tsc = new THREE.Mesh(new THREE.PlaneGeometry(.56, .36), glow('#1A2A4A', 1)); tsc.position.set(0, .64, .032); tvs.add(tsc);
  return g;
}
