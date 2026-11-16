// world.js · style kit v4: a rich, saturated outdoor world (the reference look: game-engine park, deep blue sky, puffy clouds,
// rolling hills in haze, dense trees, grass tufts, bunting, a fairground on the horizon). Environment is PBR (no outlines);
// only characters and hero props get ink, so they pop off the background.
import * as THREE from 'three';
import { G, TM, toon, ink } from './toon.js';

const rng = s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
function ctex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t; }
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 1, ...o });
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const put = (im, i, x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) => { _q.setFromEuler(_e.set(rx, ry, rz)); _m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz)); im.setMatrixAt(i, _m); };

// grass ground texture: deep saturated greens with mottling and blade strokes
const grassTex = (rep) => ctex(512, 512, (g, w, h) => { const R = rng(3); g.fillStyle = '#4FA236'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { g.fillStyle = R() < .5 ? 'rgba(30,90,20,.18)' : 'rgba(150,210,80,.16)'; g.beginPath(); g.arc(R() * w, R() * h, 10 + R() * 40, 0, 7); g.fill(); }
  for (let i = 0; i < 9000; i++) { g.strokeStyle = R() < .5 ? 'rgba(25,80,15,.35)' : 'rgba(170,230,90,.3)'; g.lineWidth = 1.5; const x = R() * w, y = R() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - .5) * 4, y - 5 - R() * 6); g.stroke(); } }, rep);
const dirtTex = (rep) => ctex(256, 256, (g, w, h) => { const R = rng(5); g.fillStyle = '#B07A4A'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${R() < .5 ? '80,45,20' : '220,170,120'},${.15 * R()})`; g.fillRect(R() * w, R() * h, 2 + R() * 3, 2 + R() * 3); } }, rep);
const leafTex = () => ctex(256, 256, (g, w, h) => { const R = rng(9); g.fillStyle = '#5FA83E'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1400; i++) { g.fillStyle = R() < .5 ? 'rgba(25,80,20,.35)' : 'rgba(170,225,100,.32)'; g.beginPath(); g.ellipse(R() * w, R() * h, 4 + R() * 6, 2 + R() * 3, R() * 3, 0, 7); g.fill(); } }, [2, 2]);
const cloudTex = (seed) => ctex(512, 256, (g, w, h) => { const R = rng(seed); const blobs = []; for (let i = 0; i < 9; i++) blobs.push([90 + R() * 330, 150 - Math.sin((i / 8) * Math.PI) * 50 - R() * 20, 40 + R() * 45]);
  g.fillStyle = 'rgba(176,196,226,1)'; blobs.forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y + 14, r, 0, 7); g.fill(); });
  g.fillStyle = '#FFFFFF'; blobs.forEach(([x, y, r]) => { g.beginPath(); g.arc(x - 4, y, r * .94, 0, 7); g.fill(); });
  g.globalCompositeOperation = 'destination-in'; g.fillRect(0, 0, w, 196); });

export function park(o = {}) {
  const g = G(); g.name = 'park'; const R = rng(o.seed ?? 11);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), std({ map: grassTex([120, 120]), color: '#FFFFFF' })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
  // a dirt path winding through
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 60), std({ map: dirtTex([1, 20]) })); path.rotation.set(-Math.PI / 2, 0, o.pathRot ?? .35); path.position.set(o.pathX ?? -2.5, .01, o.pathZ ?? -10); path.receiveShadow = true; g.add(path);
  // rolling hills in the haze
  const hillM = [std({ color: '#5DAA3C' }), std({ color: '#4E9A36' }), std({ color: '#6CB848' })];
  for (let i = 0; i < 14; i++) { const a = -2.4 + i * .36 + R() * .2, d = 110 + R() * 90, r = 40 + R() * 45; const h = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), hillM[i % 3]); h.position.set(Math.sin(a) * d, -r * .55, -Math.cos(a) * d); h.scale.set(1.4, .55, 1); h.receiveShadow = true; g.add(h); }
  // trees: instanced trunks + three leafy blobs each
  const NT = o.trees ?? 140, trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.14, .22, 1, 8), std({ color: '#6B4A2E' }), NT);
  const blob = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), std({ map: leafTex(), color: '#FFFFFF', roughness: .9 }), NT * 3);
  trunk.castShadow = blob.castShadow = true; trunk.receiveShadow = blob.receiveShadow = true;
  const clear = o.clear ?? [[0, 0, 7]];   // keep these circles [x, z, r] free of trees
  const leafCols = ['#7CC04E', '#5FAE3E', '#4E9836', '#8ACB55', '#6DB646'];
  let k = 0, placed = 0;
  while (placed < NT && k < 4000) {
    k++; const a = R() * Math.PI * 2, d = 6 + Math.pow(R(), .7) * 70, x = Math.sin(a) * d, z = -Math.cos(a) * d - 8;
    if (clear.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r)) continue;
    const s = .8 + R() * .9, th = 1.6 * s;
    put(trunk, placed, x, th / 2, z, 0, s, th, s);
    for (let j = 0; j < 3; j++) { const bs = (1.05 + R() * .45) * s; put(blob, placed * 3 + j, x + (j - 1) * .55 * s, th + .5 * s + (j === 1 ? .7 * s : 0) + R() * .2, z + (R() - .5) * .5 * s, R() * 3, bs, bs * .9, bs); blob.setColorAt(placed * 3 + j, new THREE.Color(leafCols[Math.floor(R() * leafCols.length)])); }
    placed++;
  }
  trunk.count = placed; blob.count = placed * 3; trunk.instanceMatrix.needsUpdate = blob.instanceMatrix.needsUpdate = true; blob.instanceColor.needsUpdate = true; g.add(trunk, blob);
  // grass tufts and flowers near the action
  const tuftG = (() => { const pos = []; for (let k = 0; k < 3; k++) { const a = k * 2.1, ox = Math.cos(a) * .02, oz = Math.sin(a) * .02, lx = Math.cos(a + 1.57) * .012, lz = Math.sin(a + 1.57) * .012, tx = Math.cos(a) * .05, tz = Math.sin(a) * .05; pos.push(ox - lx, 0, oz - lz, ox + lx, 0, oz + lz, ox + tx, .16, oz + tz); } const b = new THREE.BufferGeometry(); b.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); b.computeVertexNormals(); return b; })();
  const NG = o.tufts ?? 9000, tufts = new THREE.InstancedMesh(tuftG, std({ color: '#FFFFFF', side: THREE.DoubleSide }), NG);
  const gc = ['#5DB03C', '#4A9A30', '#78C450', '#3E8A2A'];
  for (let i = 0; i < NG; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * (o.tuftR ?? 16), s = .5 + R() * 1.1; put(tufts, i, Math.sin(a) * d + (o.cx ?? 0), 0, -Math.cos(a) * d + (o.cz ?? 0), R() * 3, s, s * (.7 + R() * .8), s, (R() - .5) * .5, (R() - .5) * .5); tufts.setColorAt(i, new THREE.Color(gc[i % 4])); }
  tufts.instanceMatrix.needsUpdate = true; tufts.instanceColor.needsUpdate = true; tufts.receiveShadow = true; g.add(tufts);
  const NF = 500, fl = new THREE.InstancedMesh(new THREE.SphereGeometry(.035, 6, 4), std({ color: '#FFFFFF', roughness: .6 }), NF); const fc = ['#FFFFFF', '#FFD23F', '#F27AA0', '#E84A3A', '#B488F0'];
  for (let i = 0; i < NF; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * (o.tuftR ?? 18); put(fl, i, Math.sin(a) * d + (o.cx ?? 0), .14 + R() * .08, -Math.cos(a) * d + (o.cz ?? 0)); fl.setColorAt(i, new THREE.Color(fc[i % 5])); }
  fl.instanceMatrix.needsUpdate = true; fl.instanceColor.needsUpdate = true; g.add(fl);
  // bunting: strings of triangle flags on poles
  const flagG = new THREE.BufferGeometry(); flagG.setAttribute('position', new THREE.Float32BufferAttribute([-.14, 0, 0, .14, 0, 0, 0, -.3, 0], 3)); flagG.computeVertexNormals();
  const NB = 400, flags = new THREE.InstancedMesh(flagG, std({ color: '#FFFFFF', side: THREE.DoubleSide, roughness: .7 }), NB); let fi = 0;
  const bc = ['#E8423A', '#FFD23F', '#2E7FE0', '#FFFFFF', '#3EB24A'];
  const poleM = std({ color: '#8A6A4A' }), lineM = new THREE.LineBasicMaterial({ color: '#3A3030' });
  for (const [a, b] of o.bunting ?? [[[-6, -9], [6, -12]], [[6, -12], [14, -4]], [[-14, -2], [-6, -9]]]) {
    for (const [x, z] of [a, b]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 4.2, 8), poleM); p.position.set(x, 2.1, z); p.castShadow = true; g.add(p); }
    const pts = []; const n = 24; for (let i = 0; i <= n; i++) { const u = i / n, x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u, y = 4.1 - Math.sin(u * Math.PI) * .9; pts.push(new THREE.Vector3(x, y, z)); if (i > 0 && i < n && fi < NB) { put(flags, fi, x, y, z, Math.atan2(b[0] - a[0], b[1] - a[1]) + Math.PI / 2); flags.setColorAt(fi, new THREE.Color(bc[fi % 5])); fi++; } }
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineM));
  }
  flags.count = fi; flags.instanceMatrix.needsUpdate = true; if (flags.instanceColor) flags.instanceColor.needsUpdate = true; flags.castShadow = true; g.add(flags);
  // a fairground on the horizon: a Ferris wheel and striped tents
  const fw = G(); fw.position.set(o.wheelX ?? -38, 0, o.wheelZ ?? -62); g.add(fw);
  const wm = std({ color: '#F4F1EA', roughness: .5, metalness: .2 });
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.25, .35, 14, 8), wm); leg.position.set(s * 4, 6.5, 0); leg.rotation.z = -s * .28; fw.add(leg); }
  const wheel = G(); wheel.position.y = 12.5; fw.add(wheel); g.userData.wheel = wheel;
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(10, .22, 8, 64), wm)); wheel.add(new THREE.Mesh(new THREE.TorusGeometry(9.2, .12, 8, 64), wm));
  const cabC = ['#E8423A', '#FFD23F', '#2E7FE0', '#3EB24A', '#F27AA0', '#FF8A2A'];
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const sp = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 10, 6), wm); sp.rotation.z = a; sp.position.set(Math.sin(-a) * 5, Math.cos(a) * 5, 0); wheel.add(sp);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, .9), std({ color: cabC[i % 6], roughness: .5 })); cab.position.set(Math.cos(a) * 10, Math.sin(a) * 10 - .7, 0); cab.userData.a = a; wheel.add(cab); }
  const tentT = ctex(256, 64, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#FFFFFF' : '#E8423A'; c.fillRect(i * 32, 0, 32, h); } });
  for (const [x, z, s] of o.tents ?? [[-22, -48, 1], [-14, -56, 1.3], [26, -50, 1.1], [34, -40, .9]]) { const t = new THREE.Mesh(new THREE.ConeGeometry(3 * s, 3.4 * s, 16), std({ map: tentT, roughness: .7 })); t.position.set(x, 3.4 * s, z); g.add(t); const b = new THREE.Mesh(new THREE.CylinderGeometry(3 * s, 3 * s, 1.8 * s, 16), std({ map: tentT, roughness: .7 })); b.position.set(x, .9 * s, z); g.add(b); }
  // a wooden fence along the path
  const post = new THREE.InstancedMesh(new THREE.BoxGeometry(.1, .9, .1), std({ color: '#9A7048' }), 40), rail = new THREE.InstancedMesh(new THREE.BoxGeometry(.06, .08, 1.6), std({ color: '#A87A50' }), 80);
  for (let i = 0; i < 40; i++) { const z = 2 - i * 1.6, x = (o.fenceX ?? 6.5) + Math.sin(i * .2) * .4; put(post, i, x, .45, z); put(rail, i * 2, x, .7, z - .8); put(rail, i * 2 + 1, x, .35, z - .8); }
  post.castShadow = rail.castShadow = true; post.instanceMatrix.needsUpdate = rail.instanceMatrix.needsUpdate = true; g.add(post, rail);
  // clouds: painted on a far cylinder band inside the sky dome (one smooth far surface, so AO/DOF leave it alone)
  const ct = ctex(4096, 512, (c, w, h) => { const Rc = rng(31); for (let i = 0; i < 26; i++) { const x0 = Rc() * w, y0 = 150 + Rc() * 230, sc = .5 + Rc() * .9, blobs = [];
      for (let k = 0; k < 8; k++) blobs.push([x0 + (k - 3.5) * 34 * sc + Rc() * 14, y0 - Math.sin((k / 7) * Math.PI) * 46 * sc - Rc() * 18 * sc, (30 + Rc() * 30) * sc]);
      c.fillStyle = 'rgba(178,198,228,1)'; blobs.forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y + 12 * sc, r, 0, 7); c.fill(); });
      c.fillStyle = '#FFFFFF'; blobs.forEach(([x, y, r]) => { c.beginPath(); c.arc(x - 3, y, r * .93, 0, 7); c.fill(); });
      c.fillStyle = 'rgba(178,198,228,1)'; c.fillRect(x0 - 140 * sc, y0 + 8 * sc, 280 * sc, 1); } });
  ct.wrapT = THREE.ClampToEdgeWrapping;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(330, 330, 150, 64, 1, true), new THREE.MeshBasicMaterial({ map: ct, transparent: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  band.position.y = 85; band.renderOrder = -1; g.add(band); g.userData.clouds = band;
  // night: string lights (emissive bulbs), hidden by day
  const NBL = 120, bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshBasicMaterial({ color: '#FFD68A' }), NBL); let bi = 0;
  for (const [a, b] of o.bunting ?? [[[-6, -9], [6, -12]], [[6, -12], [14, -4]], [[-14, -2], [-6, -9]]]) for (let i = 1; i < 40 && bi < NBL; i++) { const u = i / 40; put(bulbs, bi++, a[0] + (b[0] - a[0]) * u, 4.05 - Math.sin(u * Math.PI) * .9 - .08, a[1] + (b[1] - a[1]) * u); }
  bulbs.count = bi; bulbs.instanceMatrix.needsUpdate = true; bulbs.visible = false; g.add(bulbs); g.userData.bulbs = bulbs;
  return g;
}

// ---------------- hero props (toon + ink, like the characters) ----------------
export function mallet() { const g = G(); TM(new THREE.CylinderGeometry(.018, .022, .72, 10), '#B9894F', g, 0, -.3, 0, .006); const h = TM(new THREE.CylinderGeometry(.075, .075, .24, 18), '#7A5232', g, 0, -.66, 0, .008); h.rotation.z = Math.PI / 2; return g; }
export function stake() { const g = G(); TM(new THREE.BoxGeometry(.16, .7, .16), '#C8955A', g, 0, .35, 0, .008); const sg = TM(new THREE.BoxGeometry(.9, .45, .05), '#E8C890', g, 0, .82, 0, .008); g.userData.sign = sg; return g; }
export function wallet() {
  const g = G(); const lea = ctex(256, 128, (c, w, h) => { const R = rng(4); c.fillStyle = '#7A4A26'; c.fillRect(0, 0, w, h); for (let i = 0; i < 2000; i++) { c.fillStyle = `rgba(0,0,0,${.12 * R()})`; c.fillRect(R() * w, R() * h, 2, 2); } c.setLineDash([6, 5]); c.strokeStyle = '#F2D79A'; c.lineWidth = 3; c.strokeRect(8, 8, w - 16, h - 16); });
  const m = new THREE.MeshToonMaterial({ map: lea, gradientMap: undefined }); m.gradientMap = toon('#fff').gradientMap;
  const L2 = G(); g.add(L2); const R2 = G(); g.add(R2);
  TM(new THREE.BoxGeometry(.2, .14, .012), m, L2, -.1, 0, 0, .005); TM(new THREE.BoxGeometry(.2, .14, .012), m, R2, .1, 0, 0, .005);
  TM(new THREE.BoxGeometry(.16, .1, .004), '#5A3418', L2, -.1, .005, .008, 0); TM(new THREE.BoxGeometry(.16, .1, .004), '#5A3418', R2, .1, .005, .008, 0);
  g.userData.open = a => { L2.rotation.y = -a / 2; R2.rotation.y = a / 2; };
  g.userData.open(2.4); return g;
}
export function moth() { const g = G(); TM(new THREE.CapsuleGeometry(.008, .025, 4, 8), '#6A5A4A', g, 0, 0, 0, .002).rotation.x = Math.PI / 2; const wm = toon('#C8BBA6'); const wl = TM(new THREE.CircleGeometry(.03, 10), wm, g, .022, 0, 0, 0), wr = TM(new THREE.CircleGeometry(.03, 10), wm, g, -.022, 0, 0, 0); wl.material.side = THREE.DoubleSide; g.userData.flap = a => { wl.rotation.set(-Math.PI / 2, a, 0); wr.rotation.set(-Math.PI / 2, -a, 0); wl.position.x = .022 * Math.cos(a); wr.position.x = -.022 * Math.cos(a); }; return g; }
export function easel(drawing) {
  const g = G(); const wood = '#C8955A';
  for (const s of [-1, 1]) { const l = TM(new THREE.BoxGeometry(.05, 1.7, .05), wood, g, s * .45, .85, 0, .006); l.rotation.z = s * .08; }
  const bl = TM(new THREE.BoxGeometry(.05, 1.6, .05), wood, g, 0, .8, -.35, .006); bl.rotation.x = -.25;
  const bp = ctex(1024, 768, drawing ?? ((c, w, h) => { c.fillStyle = '#1D4F8F'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 2; for (let x = 0; x < w; x += 48) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y < h; y += 48) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.strokeStyle = '#EAF4FF'; c.lineWidth = 7; c.beginPath(); c.arc(560, 380, 220, 0, 7); c.stroke(); c.beginPath(); c.moveTo(80, 650); c.lineTo(560, 650); c.lineTo(900, 650); c.stroke(); c.setLineDash([16, 12]); c.lineWidth = 4; c.beginPath(); c.moveTo(560, 160); c.lineTo(560, 650); c.moveTo(340, 380); c.lineTo(780, 380); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#FFD23F'; c.font = '900 64px Montserrat'; c.fillText('TOP SECRET', 60, 100); c.fillStyle = '#EAF4FF'; c.font = '800 34px Montserrat'; c.fillText('R = 4.2 m', 700, 300); c.fillText('v = 60 km/h', 620, 720); }));
  const board = TM(new THREE.BoxGeometry(1.1, .82, .04), '#3A2A1E', g, 0, 1.25, .04, .008);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.02, .74), new THREE.MeshStandardMaterial({ map: bp, roughness: .8 })); face.position.set(0, 1.25, .062); g.add(face);
  TM(new THREE.BoxGeometry(1.15, .05, .1), wood, g, 0, .82, .08, .006);
  return g;
}
