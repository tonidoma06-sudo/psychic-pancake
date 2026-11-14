// sets.js · "Pepsi, where's my jet?" sets and props in the v4 toon style. Characters and hero props: toon + ink. Rooms: PBR.
// On-screen branding is generic (blue soda, "POINTS"): the narration names the company; the film never shows its logo.
import * as THREE from 'three';
import { G, TM, toon, ink } from './toon.js';

const rng = s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
export function ctex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; t.userData.canvas = c; return t; }
const std = o => new THREE.MeshStandardMaterial({ roughness: .85, ...o });
const P = (geo, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const BLUE = '#1E5BC6', RED = '#D9302A';

// ---------------- the jet: a stylised Harrier (toon + ink), nose +z, ~9 m ----------------
export function jet() {
  const g = G(); const body = G(); g.add(body); const W = .035;
  const grey = '#8E9BA8', dark = '#5E6A76';
  const camo = ctex(512, 256, (c, w, h) => { const R = rng(12); c.fillStyle = grey; c.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { c.fillStyle = R() < .5 ? '#7A8794' : '#A3AFBA'; c.beginPath(); c.ellipse(R() * w, R() * h, 30 + R() * 50, 16 + R() * 30, R() * 3, 0, 7); c.fill(); } c.fillStyle = '#F4F1EA'; c.beginPath(); c.arc(w * .3, h * .55, 26, 0, 7); c.fill(); c.fillStyle = BLUE; c.beginPath(); c.arc(w * .3, h * .55, 18, 0, 7); c.fill(); });
  const fm = new THREE.MeshToonMaterial({ map: camo, gradientMap: toon('#fff').gradientMap });
  const prof = [[0, 0], [.22, .4], [.45, 1.2], [.62, 2.2], [.72, 3.4], [.74, 4.8], [.68, 6.2], [.5, 7.6], [.32, 8.6], [.2, 9.0], [0, 9.05]].map(([r, y]) => new THREE.Vector2(r, y));
  const fus = TM(new THREE.LatheGeometry(prof, 32), fm, body, 0, 0, 0, W); fus.rotation.x = -Math.PI / 2; fus.position.z = 4.5; fus.scale.set(1, 1, .9);
  TM(new THREE.ConeGeometry(.22, .6, 16), '#3A3F46', body, 0, 0, 4.85, W).rotation.x = Math.PI / 2;   // the nose tip
  const canopy = TM(new THREE.SphereGeometry(.42, 24, 16), toon('#9ED8F2'), body, 0, .52, 2.6, W); canopy.scale.set(.95, .8, 1.9); g.userData.canopy = canopy;
  TM(new THREE.BoxGeometry(.08, .14, 1.2), dark, body, 0, .82, 2.5, 0);   // canopy frame
  for (const s of [-1, 1]) {   // intakes
    const ik = TM(new THREE.CylinderGeometry(.42, .5, 1.6, 20, 1, true), grey, body, s * .78, .05, 1.4, W); ik.rotation.x = Math.PI / 2; ik.material = toon(grey); ik.material.side = THREE.DoubleSide;
    TM(new THREE.CircleGeometry(.4, 20), '#262A30', body, s * .78, .05, 2.18, 0);
  }
  const wingS = new THREE.Shape(); wingS.moveTo(0, 1.4); wingS.lineTo(4.2, -.6); wingS.lineTo(4.2, -1.3); wingS.lineTo(0, -1.6); wingS.closePath();
  for (const s of [-1, 1]) {
    const wg = new THREE.ExtrudeGeometry(wingS, { depth: .12, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 1 });
    const w = TM(wg, fm, body, 0, .48, .2, W); w.rotation.set(-Math.PI / 2, 0, 0); w.scale.set(s, 1, 1); w.rotation.y = s * -.12;   // slight anhedral
    TM(new THREE.CylinderGeometry(.06, .06, .9, 8), dark, body, s * 3.9, .22, -.8, W);   // outrigger
  }
  const finS = new THREE.Shape(); finS.moveTo(0, 0); finS.lineTo(1.6, 0); finS.lineTo(.9, 1.7); finS.lineTo(.4, 1.7); finS.closePath();
  const fin = TM(new THREE.ExtrudeGeometry(finS, { depth: .1, bevelEnabled: false }), fm, body, -.05, .5, -3.3, W); fin.rotation.y = Math.PI / 2;
  const tpS = new THREE.Shape(); tpS.moveTo(0, .5); tpS.lineTo(1.7, -.2); tpS.lineTo(1.7, -.6); tpS.lineTo(0, -.7); tpS.closePath();
  for (const s of [-1, 1]) { const tp = TM(new THREE.ExtrudeGeometry(tpS, { depth: .06, bevelEnabled: false }), fm, body, 0, .35, -3.4, W); tp.rotation.set(-Math.PI / 2, 0, 0); tp.scale.set(s, 1, 1); }
  // four swivelling nozzles (they point down to hover)
  const noz = []; for (const s of [-1, 1]) for (const z of [.9, -.4]) { const n = G(); n.position.set(s * .82, -.25, z); body.add(n); TM(new THREE.CylinderGeometry(.24, .2, .55, 16), dark, n, 0, -.25, 0, W); noz.push(n); }
  g.userData.nozzles = noz; g.userData.body = body;
  // gear
  const gear = G(); body.add(gear); g.userData.gear = gear;
  TM(new THREE.CylinderGeometry(.04, .04, .9, 8), dark, gear, 0, -.7, 3.0, 0); TM(new THREE.CylinderGeometry(.22, .22, .16, 16), '#202226', gear, 0, -1.12, 3.0, W).rotation.z = Math.PI / 2;
  TM(new THREE.CylinderGeometry(.05, .05, .9, 8), dark, gear, 0, -.7, -1.0, 0); TM(new THREE.CylinderGeometry(.28, .28, .2, 16), '#202226', gear, 0, -1.12, -1.0, W).rotation.z = Math.PI / 2;
  return g;
}

// ---------------- a toon car ----------------
export function car(col) {
  const g = G(); const W = .02;
  TM(new THREE.BoxGeometry(1.8, .55, 4.0), col, g, 0, .55, 0, W);
  const cab = TM(new THREE.BoxGeometry(1.6, .5, 2.0), col, g, 0, 1.05, -.2, W);
  for (const z of [.82, -1.22]) TM(new THREE.BoxGeometry(1.5, .4, .04), toon('#9ED8F2'), g, 0, 1.05, z, 0);
  for (const s of [-1, 1]) TM(new THREE.BoxGeometry(.04, .38, 1.7), toon('#9ED8F2'), g, s * .81, 1.05, -.2, 0);
  for (const s of [-1, 1]) for (const z of [1.3, -1.3]) TM(new THREE.CylinderGeometry(.36, .36, .26, 18), '#1E1E22', g, s * .86, .36, z, W).rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) TM(new THREE.SphereGeometry(.12, 10, 8), '#FFF4C8', g, s * .62, .62, 2.0, 0);
  return g;
}

// ---------------- the school car park ----------------
export function school() {
  const g = G(); g.name = 'school';
  const asph = ctex(1024, 1024, (c, w, h) => { const R = rng(3); c.fillStyle = '#4A4C52'; c.fillRect(0, 0, w, h); for (let i = 0; i < 30000; i++) { c.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '0,0,0'},${.08 * R()})`; c.fillRect(R() * w, R() * h, 2, 2); }
    c.strokeStyle = '#F2F0E6'; c.lineWidth = 10; for (let i = 0; i <= 10; i++) { c.beginPath(); c.moveTo(i * 102, 0); c.lineTo(i * 102, 240); c.stroke(); c.beginPath(); c.moveTo(i * 102, 1024); c.lineTo(i * 102, 784); c.stroke(); }
    c.strokeStyle = '#F2C230'; c.lineWidth = 12; c.setLineDash([60, 40]); c.beginPath(); c.moveTo(0, 512); c.lineTo(w, 512); c.stroke(); });
  const lot = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), std({ map: asph, roughness: .95 })); lot.rotation.x = -Math.PI / 2; lot.position.set(0, .02, -5); lot.receiveShadow = true; g.add(lot);
  // the big painted "H" landing spot (the ad's school landing)
  const hm = ctex(512, 512, (c, w, h) => { c.strokeStyle = '#F2F0E6'; c.lineWidth = 26; c.beginPath(); c.arc(256, 256, 220, 0, 7); c.stroke(); c.fillStyle = '#F2F0E6'; c.font = '900 300px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('H', 256, 270); });
  const hp = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshStandardMaterial({ map: hm, transparent: true, roughness: .9 })); hp.rotation.x = -Math.PI / 2; hp.position.set(0, .03, -4); g.add(hp);
  // the school: brick front, a grid of windows, entrance, sign
  const brick = ctex(512, 512, (c, w, h) => { c.fillStyle = '#E8DCC8'; c.fillRect(0, 0, w, h); const R = rng(8); for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? -32 : 0; x < w; x += 64) { c.fillStyle = ['#B4523A', '#A84832', '#C05E44', '#9E4430'][Math.floor(R() * 4)]; c.fillRect(x + 3, y + 3, 58, 26); } }, [10, 3]);
  const bld = new THREE.Mesh(box(34, 8, 12), [std({ map: brick }), std({ map: brick }), std({ color: '#7A6A5A' }), std({ color: '#7A6A5A' }), std({ map: brick }), std({ map: brick })]); bld.position.set(0, 4, -24); bld.castShadow = bld.receiveShadow = true; g.add(bld);
  P(box(34.6, .5, 12.6), std({ color: '#D8D2C4' }), g, 0, 8.2, -24);
  const winT = ctex(256, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#BFE6FA'); gr.addColorStop(.5, '#6FA8D8'); gr.addColorStop(1, '#A8D4F0'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(30, 0); c.lineTo(90, 0); c.lineTo(20, 256); c.lineTo(-40, 256); c.fill(); c.strokeStyle = '#F4F1EA'; c.lineWidth = 18; c.strokeRect(0, 0, w, h); c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.stroke(); });
  const winM = std({ map: winT, roughness: .2, metalness: .1 });
  for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) { if (r === 0 && (i === 5 || i === 6)) continue; P(new THREE.PlaneGeometry(1.8, 1.6), winM, g, -14.85 + i * 2.7, 2.4 + r * 3.2, -17.98); }
  const door = ctex(256, 256, (c, w, h) => { c.fillStyle = '#2E5A8A'; c.fillRect(0, 0, w, h); c.fillStyle = '#BFE6FA'; c.fillRect(20, 20, 100, 150); c.fillRect(136, 20, 100, 150); c.fillStyle = '#E8C04A'; c.fillRect(110, 140, 10, 40); c.fillRect(136, 140, 10, 40); });
  P(new THREE.PlaneGeometry(4.2, 3.2), std({ map: door }), g, 0, 1.6, -17.97);
  P(box(6, .3, 1.6), std({ color: '#D8D2C4' }), g, 0, 3.4, -17.4);   // entrance canopy
  const sg = ctex(1024, 200, (c, w, h) => { c.fillStyle = '#1E3F7A'; c.fillRect(0, 0, w, h); c.strokeStyle = '#F2C230'; c.lineWidth = 12; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#FFFFFF'; c.font = '900 110px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('LAKEVIEW HIGH', w / 2, h / 2 + 6); });
  P(new THREE.PlaneGeometry(10, 1.95), std({ map: sg, roughness: .6 }), g, 0, 6.5, -17.95);
  // cars, a flagpole with a school pennant, a basketball hoop, a mailbox on the kerb
  const cols = ['#E8423A', '#F2C230', '#2E7FE0', '#F4F1EA', '#3EB24A', '#8A5AC8'];
  [[-9, -9, 0], [-6, -9, 0], [6, -9, 0], [9, -9, 0], [-9, 2, Math.PI], [9, 2, Math.PI]].forEach(([x, z, r], i) => { const c = car(cols[i]); c.position.set(x, 0, z); c.rotation.y = r + (i % 2 ? .05 : -.04); g.add(c); });
  P(new THREE.CylinderGeometry(.08, .1, 11, 10), std({ color: '#D8D8DC', metalness: .6, roughness: .3 }), g, 12, 5.5, -16);
  const pen = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), std({ map: ctex(256, 150, (c, w, h) => { c.fillStyle = '#1E3F7A'; c.fillRect(0, 0, w, h); c.fillStyle = '#F2C230'; c.font = '900 90px Montserrat'; c.textAlign = 'center'; c.fillText('LH', w / 2, 110); }), side: THREE.DoubleSide })); pen.position.set(13.25, 9.8, -16); g.add(pen); g.userData.pennant = pen;
  const mb = mailbox(); mb.position.set(-12.5, 0, 3.5); mb.rotation.y = .5; g.add(mb); g.userData.mailbox = mb;
  return g;
}
export function mailbox() {
  const g = G(); const W = .015;
  TM(new THREE.BoxGeometry(.7, .9, .6), BLUE, g, 0, .85, 0, W);
  const top = TM(new THREE.CylinderGeometry(.35, .35, .6, 20, 1, false, 0, Math.PI), BLUE, g, 0, 1.3, 0, W); top.rotation.set(0, 0, Math.PI / 2); top.rotation.order = 'ZYX'; top.rotation.y = Math.PI / 2;
  for (const s of [-1, 1]) for (const z of [-1, 1]) TM(new THREE.BoxGeometry(.06, .45, .06), '#1A2A5A', g, s * .3, .2, z * .24, 0);
  TM(new THREE.BoxGeometry(.4, .06, .02), '#14224A', g, 0, 1.15, .31, 0);   // the slot
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(.5, .2), new THREE.MeshBasicMaterial({ map: ctex(256, 100, (c, w, h) => { c.fillStyle = BLUE; c.fillRect(0, 0, w, h); c.fillStyle = '#FFFFFF'; c.font = '900 56px Montserrat'; c.textAlign = 'center'; c.fillText('MAIL', w / 2, 72); }) })); lab.position.set(0, .75, .305); g.add(lab);
  return g;
}

// ---------------- interiors: one room builder ----------------
export function room(o) {
  const g = G(); g.name = o.name ?? 'room'; const w = o.w ?? 8, d = o.d ?? 7, h = o.h ?? 3.2;
  const floorT = o.floor === 'carpet' ? ctex(256, 256, (c, W2, H2) => { const R = rng(4); c.fillStyle = o.floorC ?? '#7A3A3A'; c.fillRect(0, 0, W2, H2); for (let i = 0; i < 6000; i++) { c.fillStyle = `rgba(0,0,0,${.12 * R()})`; c.fillRect(R() * W2, R() * H2, 2, 2); } }, [6, 6])
    : ctex(512, 512, (c, W2, H2) => { const R = rng(5); for (let i = 0; i < 8; i++) { c.fillStyle = ['#B07A48', '#A36E40', '#BC8652', '#9A6638'][i % 4]; c.fillRect(0, i * 64, W2, 64); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, i * 64, W2, 3); c.fillRect(((i * 197) % 400) + 40, i * 64, 3, 64); for (let k = 0; k < 40; k++) { c.fillStyle = 'rgba(80,40,10,.15)'; c.fillRect(R() * W2, i * 64 + R() * 64, 30 + R() * 60, 2); } } }, [3, 3]);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), std({ map: floorT })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; g.add(fl);
  const wallT = o.wall === 'stripes' ? ctex(256, 256, (c, W2, H2) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? (o.wallA ?? '#E8D8B0') : (o.wallB ?? '#DCC898'); c.fillRect(i * 32, 0, 32, H2); } }, [w / 1.2, 1])
    : o.wall === 'panel' ? ctex(512, 512, (c, W2, H2) => { c.fillStyle = o.wallA ?? '#7A4A2A'; c.fillRect(0, 0, W2, H2); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 8; for (let i = 0; i < 4; i++) c.strokeRect(i * 128 + 14, 40, 100, 200), c.strokeRect(i * 128 + 14, 280, 100, 200); c.fillStyle = 'rgba(255,220,160,.08)'; c.fillRect(0, 0, W2, H2 / 2); }, [w / 2, 1])
    : ctex(64, 64, (c, W2, H2) => { c.fillStyle = o.wallA ?? '#E8E4DA'; c.fillRect(0, 0, W2, H2); });
  const wm = std({ map: wallT });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wm); back.position.set(0, h / 2, -d / 2); back.receiveShadow = true; g.add(back);
  for (const s of [-1, 1]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(d, h), wm); sw.rotation.y = -s * Math.PI / 2; sw.position.set(s * w / 2, h / 2, 0); sw.receiveShadow = true; g.add(sw); }
  const fw = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wm); fw.rotation.y = Math.PI; fw.position.set(0, h / 2, d / 2); g.add(fw);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), std({ color: o.ceil ?? '#F2EEE4' })); ceil.rotation.x = Math.PI / 2; ceil.position.y = h; g.add(ceil);
  P(box(w, .14, .04), std({ color: o.trim ?? '#F4F1EA' }), g, 0, .07, -d / 2 + .02);
  if (o.window) { const [x, y, ww, wh] = o.window; const out = ctex(512, 384, (c, W2, H2) => { const gr = c.createLinearGradient(0, 0, 0, H2); gr.addColorStop(0, o.night ? '#0B1630' : '#5FA8F0'); gr.addColorStop(1, o.night ? '#2A3F7A' : '#CFEAFA'); c.fillStyle = gr; c.fillRect(0, 0, W2, H2); const R = rng(9);
      if (o.city) { for (let i = 0; i < 14; i++) { const bw = 30 + R() * 40, bh = 80 + R() * 220, x2 = i * 38; c.fillStyle = ['#7A8AA0', '#8E9CB0', '#6A7A92'][i % 3]; c.fillRect(x2, H2 - bh, bw, bh); c.fillStyle = 'rgba(255,240,180,.7)'; for (let yy = H2 - bh + 10; yy < H2 - 8; yy += 18) for (let xx = x2 + 6; xx < x2 + bw - 6; xx += 12) if (R() < .5) c.fillRect(xx, yy, 6, 9); } }
      else { c.fillStyle = '#5E9A44'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(30 + i * 60, H2 - 60 + R() * 20, 50 + R() * 20, 0, 7); c.fill(); } c.fillStyle = '#6CB848'; c.fillRect(0, H2 - 40, W2, 40); } });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshBasicMaterial({ map: out })); win.position.set(x, y, -d / 2 + .02); g.add(win);
    const fr = std({ color: '#F4F1EA' }); P(box(ww + .2, .1, .1), fr, g, x, y - wh / 2, -d / 2 + .05); P(box(ww + .2, .1, .1), fr, g, x, y + wh / 2, -d / 2 + .05); P(box(.1, wh, .1), fr, g, x - ww / 2, y, -d / 2 + .05); P(box(.1, wh, .1), fr, g, x + ww / 2, y, -d / 2 + .05); P(box(.06, wh, .08), fr, g, x, y, -d / 2 + .05);
  }
  return g;
}

// ---------------- living-room props ----------------
export function couch(col = '#C8643C') {
  const g = G(); const W = .015;
  TM(new THREE.BoxGeometry(2.2, .42, .9), col, g, 0, .3, 0, W); TM(new THREE.BoxGeometry(2.2, .7, .25), col, g, 0, .7, -.38, W);
  for (const s of [-1, 1]) TM(new THREE.BoxGeometry(.25, .62, .9), col, g, s * 1.08, .45, 0, W);
  for (const s of [-1, 1]) TM(new THREE.BoxGeometry(.98, .14, .78), col, g, s * .5, .56, .04, W);
  return g;
}
// a 90s CRT TV; the screen is a canvas the film redraws (the ad)
export function tv() {
  const g = G(); const W = .012;
  TM(new THREE.BoxGeometry(1.5, .55, .6), '#6B4A2E', g, 0, .275, 0, W);   // cabinet
  TM(new THREE.BoxGeometry(1.05, .8, .75), '#2E2E34', g, 0, .95, 0, W);
  const c = document.createElement('canvas'); c.width = 640; c.height = 480; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(.84, .63), new THREE.MeshBasicMaterial({ map: t })); scr.position.set(-.04, .96, .378); g.add(scr);
  for (let i = 0; i < 2; i++) TM(new THREE.CylinderGeometry(.03, .03, .02, 12), '#9AA0A8', g, .45, .8 + i * .12, .38, 0).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) { const a = TM(new THREE.CylinderGeometry(.008, .008, .6, 6), '#9AA0A8', g, s * .12, 1.6, 0, 0); a.rotation.z = s * .5; }
  g.userData.screen = { c, ctx: c.getContext('2d'), t, mesh: scr };
  return g;
}
export function coffeeTable() { const g = G(); TM(new THREE.BoxGeometry(1.2, .06, .6), '#8A5A34', g, 0, .42, 0, .01); for (const s of [-1, 1]) for (const z of [-1, 1]) TM(new THREE.BoxGeometry(.06, .4, .06), '#6B4422', g, s * .54, .2, z * .24, 0); return g; }
export function sodaCan() { const g = G(); const lab = ctex(256, 128, (c, w, h) => { c.fillStyle = BLUE; c.fillRect(0, 0, w, h); c.fillStyle = '#FFFFFF'; c.fillRect(0, 50, w, 26); c.fillStyle = RED; c.fillRect(0, 76, w, 16); c.fillStyle = '#FFFFFF'; c.font = '900 30px Montserrat'; c.fillText('COLA', 70, 40); });
  TM(new THREE.CylinderGeometry(.033, .033, .12, 20), new THREE.MeshToonMaterial({ map: lab, gradientMap: toon('#fff').gradientMap }), g, 0, .06, 0, .004); TM(new THREE.CylinderGeometry(.03, .033, .01, 20), '#C8CCD4', g, 0, .125, 0, 0); return g; }
// the points catalogue page: the film highlights the small print
export function catalog() {
  const c = document.createElement('canvas'); c.width = 900; c.height = 1200; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const draw = (hl = 0) => { const g = c.getContext('2d'); g.fillStyle = '#FBF8EF'; g.fillRect(0, 0, 900, 1200); g.fillStyle = BLUE; g.fillRect(0, 0, 900, 170); g.fillStyle = '#FFFFFF'; g.font = '900 84px Montserrat'; g.textAlign = 'center'; g.fillText('POINTS CATALOG', 450, 112);
    g.textAlign = 'left'; g.font = '800 46px Montserrat'; const items = [['T-SHIRT', '75'], ['SUNGLASSES', '175'], ['JACKET', '1,450'], ['HARRIER JET', '7,000,000']];
    items.forEach(([n, p], i) => { const y = 280 + i * 150; g.fillStyle = i === 3 ? RED : '#1C1C22'; g.fillText(n, 70, y); g.textAlign = 'right'; g.fillText(p + ' PTS', 830, y); g.textAlign = 'left'; g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(70, y + 34, 760, 4); });
    g.fillStyle = 'rgba(0,0,0,.45)'; g.font = '600 22px Montserrat'; for (let i = 0; i < 4; i++) g.fillText('Offer void where prohibited. Allow 6–8 weeks for delivery. See official rules.', 70, 900 + i * 34);
    if (hl > 0) { g.fillStyle = `rgba(255,226,60,${.85 * Math.min(1, hl)})`; g.fillRect(60, 1052, 790 * Math.min(1, hl * 1.4), 50); }
    g.fillStyle = '#1C1C22'; g.font = '700 30px Montserrat'; g.fillText('Points may also be purchased for 10¢ each.', 70, 1088); t.needsUpdate = true; };
  draw(0); const m = new THREE.Mesh(new THREE.PlaneGeometry(.45, .6), new THREE.MeshStandardMaterial({ map: t, roughness: .9 })); m.userData.draw = draw; m.receiveShadow = true; return m;
}
export function magnifier() { const g = G(); TM(new THREE.TorusGeometry(.1, .014, 10, 32), '#2A2A30', g, 0, 0, 0, .004); const gl = new THREE.Mesh(new THREE.CircleGeometry(.1, 32), new THREE.MeshStandardMaterial({ color: '#CFEFFF', transparent: true, opacity: .25, roughness: .05 })); g.add(gl); TM(new THREE.CylinderGeometry(.016, .02, .16, 10), '#6B4A2E', g, 0, -.18, 0, .004); return g; }

// ---------------- money, the check, the mail, the law ----------------
export function moneyBag(label = '$') { const g = G(); const W = .01; const b = TM(new THREE.SphereGeometry(.2, 20, 14), '#C8B07A', g, 0, .19, 0, W); b.scale.set(1, 1.05, 1); TM(new THREE.CylinderGeometry(.06, .1, .1, 12), '#B89A62', g, 0, .4, 0, W); TM(new THREE.TorusGeometry(.065, .015, 8, 16), '#6B4A2E', g, 0, .37, 0, 0).rotation.x = Math.PI / 2;
  const s = new THREE.Mesh(new THREE.PlaneGeometry(.2, .2), new THREE.MeshBasicMaterial({ map: ctex(128, 128, (c) => { c.fillStyle = '#2E7A3A'; c.font = '900 110px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, 64, 70); }), transparent: true })); s.position.set(0, .2, .205); g.add(s); return g; }
export function cashStack() { const g = G(); const bill = ctex(256, 110, (c, w, h) => { c.fillStyle = '#9CC88A'; c.fillRect(0, 0, w, h); c.strokeStyle = '#3E6A34'; c.lineWidth = 6; c.strokeRect(8, 8, w - 16, h - 16); c.fillStyle = '#3E6A34'; c.beginPath(); c.ellipse(w / 2, h / 2, 30, 36, 0, 0, 7); c.fill(); c.font = '900 40px Montserrat'; c.fillText('100', 20, 50); c.fillText('100', w - 90, h - 20); });
  TM(new THREE.BoxGeometry(.17, .07, .075), new THREE.MeshToonMaterial({ map: bill, gradientMap: toon('#fff').gradientMap }), g, 0, 0, 0, .004); TM(new THREE.BoxGeometry(.03, .072, .077), '#F4F1EA', g, 0, 0, 0, 0); return g; }
export function bigCheck() {
  const t = ctex(1024, 440, (c, w, h) => { c.fillStyle = '#EAF4EA'; c.fillRect(0, 0, w, h); c.strokeStyle = '#3E7A4A'; c.lineWidth = 14; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = '#2A4A30'; c.font = '700 40px Montserrat'; c.fillText('PAY TO THE ORDER OF:   PEPSICO', 50, 110); c.font = '900 92px Montserrat'; c.fillText('$700,008.50', 330, 250); c.font = '600 34px Montserrat'; c.fillText('FOR:  ONE (1) HARRIER JET', 50, 360); c.strokeStyle = '#2A4A30'; c.lineWidth = 3; c.beginPath(); c.moveTo(640, 380); c.lineTo(960, 380); c.stroke(); c.font = 'italic 600 44px Georgia'; c.fillText('J. Leonard', 680, 370); });
  const g = G(); TM(new THREE.BoxGeometry(1.0, .43, .01), new THREE.MeshToonMaterial({ map: t, gradientMap: toon('#fff').gradientMap }), g, 0, 0, 0, .006); return g; }
export function envelope() { const g = G(); TM(new THREE.BoxGeometry(.5, .28, .015), '#F4EEDC', g, 0, 0, 0, .005); const f = new THREE.Mesh(new THREE.PlaneGeometry(.36, .2), new THREE.MeshBasicMaterial({ map: ctex(256, 140, (c, w, h) => { c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(w / 2, h * .6); c.lineTo(w, 0); c.stroke(); c.fillStyle = '#C8283A'; c.fillRect(w - 60, 10, 46, 52); c.fillStyle = '#1C1C22'; c.font = '700 20px Montserrat'; c.fillText('PEPSICO HQ', 20, 110); }), transparent: true })); f.position.z = .009; g.add(f); return g; }
export function gavel() { const g = G(); TM(new THREE.CylinderGeometry(.014, .016, .34, 10), '#7A4A26', g, 0, -.15, 0, .004); const h = TM(new THREE.CylinderGeometry(.05, .05, .16, 16), '#6B3A1E', g, 0, -.32, 0, .006); h.rotation.z = Math.PI / 2; return g; }
export function folder(text = 'LAWSUIT') { const g = G(); const t = ctex(512, 360, (c, w, h) => { c.fillStyle = '#E8C890'; c.fillRect(0, 0, w, h); c.fillStyle = '#C8283A'; c.font = '900 84px Montserrat'; c.textAlign = 'center'; c.fillText(text, w / 2, 200); c.strokeStyle = '#C8283A'; c.lineWidth = 8; c.strokeRect(40, 110, w - 80, 120); });
  TM(new THREE.BoxGeometry(.4, .28, .02), new THREE.MeshToonMaterial({ map: t, gradientMap: toon('#fff').gradientMap }), g, 0, 0, 0, .005); return g; }
export function letter() { const t = ctex(400, 520, (c, w, h) => { c.fillStyle = '#FBF8EF'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(0,0,0,.45)'; for (let i = 0; i < 14; i++) c.fillRect(30, 60 + i * 30, 340 - (i % 4) * 40, 8); c.fillStyle = '#1C1C22'; c.font = '700 26px Montserrat'; c.fillText('Dear Sir, I would like', 30, 40); });
  return new THREE.Mesh(new THREE.PlaneGeometry(.21, .28), new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: .9 })); }
export function desk(col = '#5A3A22') { const g = G(); TM(new THREE.BoxGeometry(2.0, .08, .9), col, g, 0, .76, 0, .01); TM(new THREE.BoxGeometry(1.9, .7, .06), col, g, 0, .38, .4, .01); for (const s of [-1, 1]) TM(new THREE.BoxGeometry(.08, .72, .86), col, g, s * .95, .36, 0, .01); return g; }
export function bench() {   // the judge's bench
  const g = G(); const wood = '#6B3A1E';
  TM(new THREE.BoxGeometry(3.2, 1.35, .9), wood, g, 0, .675, 0, .015); TM(new THREE.BoxGeometry(3.4, .1, 1.1), '#7A4626', g, 0, 1.4, 0, .015);
  const pl = ctex(512, 120, (c, w, h) => { c.fillStyle = '#C8A04A'; c.fillRect(0, 0, w, h); c.fillStyle = '#3A2410'; c.font = '900 64px Montserrat'; c.textAlign = 'center'; c.fillText('THE COURT', w / 2, 82); });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .28), new THREE.MeshStandardMaterial({ map: pl, metalness: .5, roughness: .3 })); p.position.set(0, 1.05, .456); g.add(p); return g;
}
export function seal() { const t = ctex(512, 512, (c, w, h) => { c.fillStyle = '#C8A04A'; c.beginPath(); c.arc(256, 256, 250, 0, 7); c.fill(); c.fillStyle = '#7A1E22'; c.beginPath(); c.arc(256, 256, 210, 0, 7); c.fill(); c.strokeStyle = '#E8C870'; c.lineWidth = 14;
    c.beginPath(); c.moveTo(256, 120); c.lineTo(256, 380); c.moveTo(130, 170); c.lineTo(382, 170); c.moveTo(190, 400); c.lineTo(322, 400); c.stroke(); for (const x of [150, 362]) { c.beginPath(); c.moveTo(x, 170); c.lineTo(x - 50, 270); c.moveTo(x, 170); c.lineTo(x + 50, 270); c.stroke(); c.beginPath(); c.arc(x, 270, 50, 0, Math.PI); c.stroke(); } });
  return new THREE.Mesh(new THREE.CircleGeometry(.6, 48), new THREE.MeshStandardMaterial({ map: t, metalness: .4, roughness: .4 })); }
export function stampMark(text, col = '#D9302A') { const t = ctex(700, 260, (c, w, h) => { c.strokeStyle = col; c.lineWidth = 22; c.strokeRect(14, 14, w - 28, h - 28); c.fillStyle = col; c.font = '900 170px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, w / 2, h / 2 + 10); });
  return new THREE.Mesh(new THREE.PlaneGeometry(.22, .082), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); }
export function priceTag(text, col = '#F2C230') { const g = G(); const t = ctex(700, 300, (c, w, h) => { c.fillStyle = col; c.beginPath(); c.moveTo(90, 0); c.lineTo(w, 0); c.lineTo(w, h); c.lineTo(90, h); c.lineTo(0, h / 2); c.closePath(); c.fill(); c.fillStyle = '#1C1C22'; c.beginPath(); c.arc(70, h / 2, 22, 0, 7); c.fill(); c.font = '900 150px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, w / 2 + 40, h / 2 + 8); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.2), new THREE.MeshToonMaterial({ map: t, transparent: true, gradientMap: toon('#fff').gradientMap, side: THREE.DoubleSide })); g.add(m); return g; }
