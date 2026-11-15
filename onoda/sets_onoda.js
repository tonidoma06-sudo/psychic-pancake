// sets_onoda.js · Lubang Island, the Philippines, 1944–1974: thick jungle with a clearing (Onoda's hideout, a tree carved with
// tally marks), the beach and the sea, a farming village at dusk, a backpacker's camp; a used-book shop in Japan, 1974;
// a four-engine plane (leaflets, 1945) and a small airliner (1974); the hero props (rifle, leaflets, newspaper, letter, photo,
// backpack, the order, campfire). Environment = PBR without outlines; characters and hero props = toon + ink.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TM, toon, G } from './toon.js';
import { textPlane, textCanvas, texFrom } from './kit.js';

const rng = s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
function ctex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t; }
const std = o => new THREE.MeshStandardMaterial({ roughness: 1, ...o });
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const put = (im, i, x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) => { _q.setFromEuler(_e.set(rx, ry, rz)); _m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz)); im.setMatrixAt(i, _m); };
const M = (geo, mat, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; if (parent) parent.add(o); return o; };

// ---------------- layout (metres) ----------------
export const LAY = {
  camp: [0, 0],            // the hideout clearing
  tally: [1.9, -1.7],      // the tree with 29 years of tally marks
  shore: 22,               // sand from here (z) …
  sea: 31,                 // … the water from here
  boat: [2.4, 32.2],
  village: [44, -10],      // the hut and the paddy
  tent: [-16, -14],        // the backpacker's camp, 1974
};
export const WIND = { value: 0 };

// ---------------- textures ----------------
const floorTex = rep => ctex(512, 512, (g, w, h) => { const R = rng(5); g.fillStyle = '#4A5A2A'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { g.fillStyle = R() < .5 ? 'rgba(30,50,15,.3)' : 'rgba(120,150,60,.22)'; g.beginPath(); g.arc(R() * w, R() * h, 8 + R() * 36, 0, 7); g.fill(); }
  for (let i = 0; i < 2600; i++) { g.fillStyle = ['rgba(130,90,40,.55)', 'rgba(170,120,50,.5)', 'rgba(90,110,40,.5)', 'rgba(60,40,20,.5)'][i % 4]; g.save(); g.translate(R() * w, R() * h); g.rotate(R() * 6); g.beginPath(); g.ellipse(0, 0, 4 + R() * 7, 2 + R() * 3, 0, 0, 7); g.fill(); g.restore(); } }, rep);
const mudTex = rep => ctex(256, 256, (g, w, h) => { const R = rng(8); g.fillStyle = '#7A5A36'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${R() < .5 ? '60,40,20' : '160,120,80'},${.2 * R()})`; g.fillRect(R() * w, R() * h, 2 + R() * 3, 2 + R() * 3); } }, rep);
const sandTex = rep => ctex(512, 512, (g, w, h) => { const R = rng(12); g.fillStyle = '#EBD39A'; g.fillRect(0, 0, w, h); for (let i = 0; i < 16000; i++) { g.fillStyle = `rgba(${R() < .5 ? '170,140,90' : '255,245,210'},${.35 * R()})`; g.fillRect(R() * w, R() * h, 2, 2); } }, rep);
const seaTex = rep => ctex(512, 512, (g, w, h) => { const R = rng(14); const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#1E86C0'); grd.addColorStop(1, '#2A9CCC'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { const x = R() * w, y = R() * h, l = 14 + R() * 40; g.strokeStyle = R() < .6 ? 'rgba(255,255,255,.35)' : 'rgba(10,60,110,.35)'; g.lineWidth = 2 + R() * 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 5, x + l, y); g.stroke(); } }, rep);
const barkTex = (col, rep) => ctex(128, 256, (g, w, h) => { const R = rng(17); g.fillStyle = col; g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(${R() < .5 ? '0,0,0' : '255,255,255'},${.12 * R()})`; g.lineWidth = 2 + R() * 4; const x = R() * w; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (R() - .5) * 20, h); g.stroke(); } }, rep);
const palmTex = () => ctex(128, 256, (g, w, h) => { g.fillStyle = '#8E7454'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) { g.fillStyle = 'rgba(60,40,25,.45)'; g.fillRect(0, y, w, 4); g.fillStyle = 'rgba(255,240,210,.18)'; g.fillRect(0, y + 4, w, 3); } }, [1, 6]);
const thatchTex = rep => ctex(256, 256, (g, w, h) => { const R = rng(19); g.fillStyle = '#9A7A3E'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { const x = R() * w, y = R() * h; g.strokeStyle = R() < .5 ? 'rgba(70,50,20,.5)' : 'rgba(210,180,110,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - .5) * 6, y + 14 + R() * 20); g.stroke(); } for (let y = 0; y < h; y += 42) { g.fillStyle = 'rgba(40,25,10,.35)'; g.fillRect(0, y, w, 5); } }, rep);
const weaveTex = rep => ctex(256, 256, (g, w, h) => { g.fillStyle = '#C8A868'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) { g.fillStyle = ((x + y) / 16) % 2 ? 'rgba(90,60,25,.35)' : 'rgba(255,240,200,.25)'; g.fillRect(x, y, 16, 8); g.fillRect(x + ((x + y) / 16 % 2 ? 0 : 8), y + 8, 8, 8); } }, rep);
const tallyTex = () => ctex(1024, 512, (g, w, h) => { g.fillStyle = '#6A5038'; g.fillRect(0, 0, w, h); const R = rng(23);
  for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(0,0,0,${.12 * R()})`; g.lineWidth = 3; const x = R() * w; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (R() - .5) * 30, h); g.stroke(); }
  // 29 groups of four-and-a-slash, carved pale into the bark, in rows
  let n = 0; for (let row = 0; row < 5; row++) for (let col = 0; col < 7 && n < 29; col++, n++) { const x0 = 70 + col * 130 + (row % 2) * 20, y0 = 40 + row * 92;
    g.strokeStyle = '#E8D2A8'; g.lineCap = 'round'; g.lineWidth = 9; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x0 + k * 22 + (R() - .5) * 4, y0); g.lineTo(x0 + k * 22 + (R() - .5) * 6, y0 + 66); g.stroke(); }
    g.beginPath(); g.moveTo(x0 - 10, y0 + 54); g.lineTo(x0 + 80, y0 + 10); g.stroke(); } });

// ---------------- plant geometry (merged, then instanced) ----------------
function leafGeo(len, wid, droop, segs = 6) {   // a broad tropical leaf along +y, tapering, curling down at the tip, with a folded midrib
  const geo = new THREE.PlaneGeometry(wid, len, 2, segs); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i) + len / 2; const v = y / len, taper = Math.sin(Math.min(1, v * 1.08) * Math.PI) * .95 + .05;
    x *= taper; const z = Math.abs(x) * .35 - droop * v * v * len; p.setXYZ(i, x, y * (1 - droop * .25 * v), z); }
  geo.computeVertexNormals(); return geo;
}
function plantGeo(R, n, len, wid, droop, tilt) {   // a clump of leaves fanned around a centre
  const parts = []; for (let k = 0; k < n; k++) { const l = leafGeo(len * (.75 + R() * .5), wid * (.8 + R() * .4), droop); l.rotateX(-tilt - R() * .3); l.rotateY(k / n * Math.PI * 2 + R() * .4); l.translate(0, .02, 0); parts.push(l.index ? l.toNonIndexed() : l); }
  const m = mergeGeometries(parts); m.computeVertexNormals(); return m;
}
function windMat(o, amp = .08) {
  const m = std({ side: THREE.DoubleSide, roughness: .8, ...o });
  m.onBeforeCompile = sh => { sh.uniforms.uT = WIND; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n#ifdef USE_INSTANCING\n vec2 wp = instanceMatrix[3].xz; float k = max(position.y, 0.) * max(position.y, 0.); transformed.x += sin(uT * 1.7 + wp.x * .5 + wp.y * .3) * k * ${amp.toFixed(3)}; transformed.z += cos(uT * 1.3 + wp.x * .3) * k * ${(amp * .6).toFixed(3)};\n#endif`); };
  return m;
}
function palmGeo(R, h, lean) {   // a curved trunk of rings and a crown of drooping fronds + coconuts
  const trunk = [], crown = [], nuts = [];
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(lean * .2, h * .55, 0), new THREE.Vector3(lean, h, 0));
  const tube = new THREE.TubeGeometry(curve, 12, .16, 8, false); const tp = tube.attributes.position;   // taper toward the top
  for (let i = 0; i < tp.count; i++) { const y = tp.getY(i), k = 1 - y / h * .35, c = curve.getPoint(Math.min(1, y / h)); tp.setX(i, c.x + (tp.getX(i) - c.x) * k); tp.setZ(i, c.z + (tp.getZ(i) - c.z) * k); }
  tube.computeVertexNormals(); trunk.push(tube);
  const top = curve.getPoint(1);
  for (let k = 0; k < 10; k++) { const f = leafGeo(2.4 + R() * .6, .55, .9 + R() * .4, 8); f.rotateX(-1.15 + R() * .4); f.rotateY(k / 10 * Math.PI * 2 + R() * .3); f.translate(top.x, top.y, top.z); crown.push(f.index ? f.toNonIndexed() : f); }
  for (let k = 0; k < 4; k++) { const s = new THREE.SphereGeometry(.13, 10, 8); const a = k * 1.6; s.translate(top.x + Math.sin(a) * .18, top.y - .16, top.z + Math.cos(a) * .18); nuts.push(s); }
  return { trunk: mergeGeometries(trunk), crown: mergeGeometries(crown), nuts: mergeGeometries(nuts) };
}

// ---------------- the island ----------------
export function island() {
  const g = G(); g.name = 'island'; const R = rng(21);
  const ground = M(new THREE.PlaneGeometry(700, 700), std({ map: floorTex([160, 160]) }), g); ground.rotation.x = -Math.PI / 2;
  // the trail through the clearing, toward the beach
  const trail = M(new THREE.PlaneGeometry(2.2, 40), std({ map: mudTex([1, 16]) }), g, 1.2, .012, 6); trail.rotation.set(-Math.PI / 2, 0, -.12);
  const clr = M(new THREE.CircleGeometry(4.6, 40), std({ map: mudTex([4, 4]), color: '#B8A890' }), g, 0, .01, 0); clr.rotation.x = -Math.PI / 2;
  // beach and sea
  const sand = M(new THREE.PlaneGeometry(400, 40), std({ map: sandTex([80, 8]) }), g, 0, .02, LAY.shore + 16); sand.rotation.x = -Math.PI / 2;
  const sea = M(new THREE.PlaneGeometry(1400, 700), std({ map: seaTex([120, 60]), roughness: .25, metalness: .15 }), g, 0, .08, LAY.sea + 350); sea.rotation.x = -Math.PI / 2; sea.receiveShadow = true; g.userData.sea = sea;
  const foam = M(new THREE.PlaneGeometry(400, .7), std({ color: '#FFFFFF', transparent: true, opacity: .8, roughness: .6 }), g, 0, .1, LAY.sea + .2); foam.rotation.x = -Math.PI / 2;
  const wet = M(new THREE.PlaneGeometry(400, 3), std({ color: '#C8AC72', roughness: .4 }), g, 0, .03, LAY.sea - 1.2); wet.rotation.x = -Math.PI / 2;
  // the mountains of the interior, in haze
  const hillM = [std({ color: '#2F7A34' }), std({ color: '#3A8A3C' }), std({ color: '#2A6A30' })];
  for (let i = 0; i < 16; i++) { const a = -1.3 + i * .17 + R() * .1, d = 120 + R() * 110, r = 45 + R() * 50; const h = M(new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), hillM[i % 3], g, Math.sin(a) * d, -r * .35, -Math.cos(a) * d); h.scale.set(1.3, .75 + R() * .35, 1); h.castShadow = false; }
  const clear = [[0, 0, 5.2], [LAY.tally[0], LAY.tally[1], 1.4], [LAY.village[0], LAY.village[1], 13], [LAY.tent[0], LAY.tent[1], 4.5], [-5.5, 4.5, 1.6], [LAY.village[0] - 12, LAY.village[1] + 9.5, 3.2], [LAY.village[0] - 6, LAY.village[1] + 3.5, 4]];
  const free = (x, z, pad = 0) => !clear.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r + pad);
  const onTrail = (x, z) => z > 1.5 && z < LAY.shore + 3 && Math.abs(x - 1.2 + (z - 6) * .12) < 2.0;
  // rainforest trees: tall pale trunks under umbrella crowns
  const NT = 260, trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.16, .3, 1, 9), std({ map: barkTex('#8A7A62', [1, 3]) }), NT);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), std({ color: '#FFFFFF', roughness: .9 }), NT * 3);
  trunk.castShadow = crown.castShadow = true; trunk.receiveShadow = crown.receiveShadow = true;
  const cc = ['#2E7A34', '#3A8A3A', '#256A2E', '#4A9A40', '#327E2E']; let placed = 0, k = 0;
  while (placed < NT && k < 6000) { k++;
    const x = -70 + R() * 140, z = -80 + R() * (LAY.shore - 4 + 80); if (!free(x, z, 1.2)) continue; if (Math.abs(x - 1.2 + (z - 6) * .12) < 1.6 && z > 2 && z < 20) continue;   // keep the trail open
    const s = .8 + R() * .7, th = (7 + R() * 7) * s;
    put(trunk, placed, x, th / 2, z, R() * 6, s, th, s, (R() - .5) * .06, (R() - .5) * .06);
    for (let j = 0; j < 3; j++) { const bs = (2.2 + R() * 1.4) * s; put(crown, placed * 3 + j, x + (j - 1) * 1.3 * s, th + (j === 1 ? .7 : 0) * s, z + (R() - .5) * 1.4 * s, R() * 3, bs, bs * .55, bs); crown.setColorAt(placed * 3 + j, new THREE.Color(cc[Math.floor(R() * cc.length)])); }
    placed++; }
  trunk.count = placed; crown.count = placed * 3; trunk.instanceMatrix.needsUpdate = crown.instanceMatrix.needsUpdate = true; crown.instanceColor.needsUpdate = true; g.add(trunk, crown);
  // coconut palms: along the shore, round the village, a few in the jungle
  const PV = [0, 1, 2].map(i => palmGeo(R, 6.5 + i * 1.2, 1.2 + i * .5));
  const palmBark = std({ map: palmTex() }), frondM = windMat({ color: '#FFFFFF' }, .02), nutM = std({ color: '#6A5228', roughness: .7 });
  const spots = [];
  for (let i = 0; i < 46; i++) spots.push([-60 + i * 2.7 + R() * 1.5, LAY.shore - 2 + R() * 5]);
  for (let i = 0; i < 14; i++) { const a = R() * 6.28, d = 9 + R() * 8; spots.push([LAY.village[0] + Math.sin(a) * d * 1.3, LAY.village[1] + Math.cos(a) * d]); }
  for (let i = 0; i < 18; i++) spots.push([-40 + R() * 80, -40 + R() * 55]);
  PV.forEach((pv, vi) => {
    const mine = spots.filter((_, i) => i % 3 === vi && free(_[0], _[1], .8)), n = mine.length;
    const tr = new THREE.InstancedMesh(pv.trunk, palmBark, n), cr = new THREE.InstancedMesh(pv.crown, frondM, n), nu = new THREE.InstancedMesh(pv.nuts, nutM, n);
    const fc = ['#4E9A36', '#5AA83E', '#3E8A30', '#66B046'];
    mine.forEach(([x, z], i) => { const ry = R() * 6.28, s = .85 + R() * .35; for (const im of [tr, cr, nu]) put(im, i, x, 0, z, ry, s, s, s); cr.setColorAt(i, new THREE.Color(fc[i % 4])); });
    for (const im of [tr, cr, nu]) { im.instanceMatrix.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; g.add(im); } cr.instanceColor.needsUpdate = true;
  });
  // the understory: broad-leaf plants and ferns, dense round the clearing (where the camera works), swaying
  const PG = [plantGeo(R, 7, .9, .42, .55, .7), plantGeo(R, 9, 1.3, .55, .7, .55), plantGeo(R, 5, 1.7, .7, .6, .45)];
  const FG = plantGeo(R, 14, .75, .16, .9, .95);
  const lc = ['#3E8E34', '#4E9E3A', '#2F7A2C', '#5AAA44', '#3A8A3E', '#6AB84A'];
  const bush = (geo, n, place) => { const im = new THREE.InstancedMesh(geo, windMat({ color: '#FFFFFF' }, .06), n); let c = 0, tries = 0;
    while (c < n && tries < n * 20) { tries++; const r = place(); if (!r) continue; const [x, z, s] = r; put(im, c, x, 0, z, R() * 6.28, s, s, s); im.setColorAt(c, new THREE.Color(lc[c % lc.length])); c++; }
    im.count = c; im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; g.add(im); return im; };
  const nearRing = () => { const a = R() * 6.28, d = 4.8 + Math.pow(R(), 1.6) * 22, x = Math.sin(a) * d, z = Math.cos(a) * d; return free(x, z, .3) && z < LAY.shore - 1 && !onTrail(x, z) ? [x, z, .8 + R() * .8] : null; };
  const wide = () => { const x = -70 + R() * 140, z = -70 + R() * (LAY.shore - 2 + 70); return free(x, z, .3) && !onTrail(x, z) ? [x, z, .9 + R() * 1.2] : null; };
  PG.forEach((pg, i) => { bush(pg, 700, nearRing); bush(pg, 900, wide); });
  bush(FG, 1600, nearRing); bush(FG, 1200, wide);
  // hanging vines
  const vine = new THREE.InstancedMesh(new THREE.CylinderGeometry(.018, .018, 1, 5), std({ color: '#3A5A22' }), 140); let vi = 0;
  for (let i = 0; i < 400 && vi < 140; i++) { const x = -26 + R() * 52, z = -30 + R() * 40; if (!free(x, z, 1)) continue; const l = 3 + R() * 6; put(vine, vi++, x, 13 - l / 2, z, 0, 1, l, 1); }
  vine.count = vi; vine.instanceMatrix.needsUpdate = true; g.add(vine);
  // ---------------- the hideout: a bamboo lean-to, a raised slat bed, a fire pit, the tally tree ----------------
  const bam = std({ color: '#B8A060', roughness: .7 }), bamD = std({ color: '#8A7840' });
  const hide = G(); hide.position.set(-2.2, 0, -2.0); hide.rotation.y = .5; g.add(hide); g.userData.hide = hide;
  for (const [x, z, h] of [[-1.2, -.9, 2.1], [1.2, -.9, 2.1], [-1.2, .9, 1.3], [1.2, .9, 1.3]]) { M(new THREE.CylinderGeometry(.05, .055, h, 8), bam, hide, x, h / 2, z); for (let y = .4; y < h; y += .45) M(new THREE.CylinderGeometry(.06, .06, .03, 8), bamD, hide, x, y, z); }
  const roof = M(new THREE.BoxGeometry(2.9, .08, 2.3), std({ map: thatchTex([2, 2]) }), hide, 0, 1.75, 0); roof.rotation.x = .38;
  for (let i = 0; i < 9; i++) M(new THREE.CylinderGeometry(.035, .035, 2.2, 6), bam, hide, -1.0 + i * .25, .55, -.2).rotation.x = Math.PI / 2;
  for (const x of [-1.05, 1.05]) M(new THREE.CylinderGeometry(.045, .045, 2.3, 6), bamD, hide, x, .5, -.2).rotation.x = Math.PI / 2;
  for (const [x, z] of [[-1.05, -1.1], [1.05, -1.1], [-1.05, .7], [1.05, .7]]) M(new THREE.CylinderGeometry(.04, .04, .5, 6), bamD, hide, x, .25, z);
  const sack = M(new THREE.SphereGeometry(.2, 12, 10), std({ color: '#8A7A5A' }), hide, .8, 1.25, -.85); sack.scale.set(1, 1.3, .8);
  const pit = G(); pit.position.set(1.5, 0, 1.2); g.add(pit);
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28; M(new THREE.DodecahedronGeometry(.11, 0), std({ color: '#7A7468' }), pit, Math.sin(a) * .4, .06, Math.cos(a) * .4).rotation.set(i, i * 2, 0); }
  for (let i = 0; i < 3; i++) M(new THREE.CylinderGeometry(.04, .05, .6, 6), std({ color: '#3A2A1E' }), pit, 0, .08, 0).rotation.set(Math.PI / 2, i * 1.05, 0);
  const tree = G(); tree.position.set(LAY.tally[0], 0, LAY.tally[1]); g.add(tree); g.userData.tally = tree;
  M(new THREE.CylinderGeometry(.42, .55, 9, 18), std({ map: barkTex('#6A5038', [2, 4]) }), tree, 0, 4.5, 0);
  const band = M(new THREE.CylinderGeometry(.532, .548, 1.0, 32, 1, true, -1.05, 2.1), std({ map: tallyTex() }), tree, 0, 1.35, 0); band.material.map.wrapS = THREE.ClampToEdgeWrapping; band.material.map.repeat.set(1, 1);
  band.rotation.y = .1;   // the carved face looks toward the camp
  for (let i = 0; i < 5; i++) { const a = i * 1.3 + .65; const r = M(new THREE.CylinderGeometry(.04, .13, 1.2, 6), std({ color: '#6A5038' }), tree, Math.sin(a) * .62, .1, Math.cos(a) * .62); r.rotation.set(Math.cos(a) * 1.35, 0, -Math.sin(a) * 1.35); }
  // ---------------- the village at the jungle's edge: a nipa hut on stilts, a rice paddy ----------------
  const vil = G(); vil.position.set(LAY.village[0], 0, LAY.village[1]); g.add(vil); g.userData.village = vil;
  const hut = G(); hut.position.set(0, 0, -4); hut.rotation.y = -.3; vil.add(hut);
  for (const [x, z] of [[-1.6, -1.2], [1.6, -1.2], [-1.6, 1.2], [1.6, 1.2], [0, -1.2], [0, 1.2]]) M(new THREE.CylinderGeometry(.08, .09, 1.2, 8), std({ color: '#7A6040' }), hut, x, .6, z);
  M(new THREE.BoxGeometry(3.6, .12, 2.8), std({ color: '#9A7A4A' }), hut, 0, 1.2, 0);
  M(new THREE.BoxGeometry(3.2, 1.5, 2.4), std({ map: weaveTex([3, 2]) }), hut, 0, 2.0, 0);
  const door = M(new THREE.PlaneGeometry(.7, 1.1), std({ color: '#2A1E14' }), hut, -.6, 1.85, 1.21);
  const win = M(new THREE.PlaneGeometry(.6, .45), new THREE.MeshBasicMaterial({ color: '#FFC870' }), hut, .8, 2.1, 1.21); g.userData.hutWin = win;
  for (const s of [-1, 1]) { const r = M(new THREE.BoxGeometry(4.2, .1, 2.2), std({ map: thatchTex([3, 2]) }), hut, 0, 3.05, s * .82); r.rotation.x = s * .62; }
  for (let i = 0; i < 6; i++) M(new THREE.BoxGeometry(.5, .04, .12), std({ color: '#7A6040' }), hut, -.6, .2 + i * .2, 1.75 - i * .07);
  // the paddy: still water in banked plots, rows of young rice
  const water = M(new THREE.PlaneGeometry(22, 12), std({ color: '#7AA8B0', roughness: .15, metalness: .3 }), vil, 0, .04, 5); water.rotation.x = -Math.PI / 2;
  for (const [x, z, w, d] of [[0, -1, 22.6, .4], [0, 11, 22.6, .4], [-11, 5, .4, 12], [11, 5, .4, 12], [0, 5, 22, .3]]) M(new THREE.BoxGeometry(w, .22, d), std({ color: '#6A5A36' }), vil, x, .1, z);
  const rice = new THREE.InstancedMesh(plantGeo(R, 6, .32, .03, .3, .25), windMat({ color: '#FFFFFF' }, .1), 900); let ri = 0;
  for (let x = -10; x <= 10; x += .5) for (let z = -.3; z <= 10.5; z += .55) { if (ri >= 900) break; put(rice, ri, x + (R() - .5) * .1, .04, z + (R() - .5) * .1, R() * 6, 1, 1, 1); rice.setColorAt(ri, new THREE.Color(['#7AC050', '#6AB040', '#8ACB5A'][ri % 3])); ri++; }
  rice.count = ri; rice.instanceMatrix.needsUpdate = true; rice.instanceColor.needsUpdate = true; vil.add(rice);
  const smoke = []; for (let i = 0; i < 7; i++) { const s = M(new THREE.SphereGeometry(.3, 10, 8), new THREE.MeshStandardMaterial({ color: '#C8C0B8', transparent: true, opacity: .4, depthWrite: false }), vil, 1.2, 3.6, -4.6); s.castShadow = false; smoke.push(s); } g.userData.smoke = smoke;
  // ---------------- the backpacker's camp (1974): a dome tent and a fire ----------------
  const camp = G(); camp.position.set(LAY.tent[0], 0, LAY.tent[1]); g.add(camp); g.userData.camp = camp;
  const tent = TM(new THREE.SphereGeometry(1.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), '#E8702A', camp, -1.4, 0, -1.2, .012); tent.scale.set(1.2, .9, 1);
  TM(new THREE.CircleGeometry(.42, 16, 0, Math.PI), '#2A1E18', camp, -1.4, .02, -.05, 0).rotation.set(0, 0, 0);
  for (const a of [.7, -.7]) { const p = TM(new THREE.TorusGeometry(1.1, .015, 6, 24, Math.PI), '#3A3A3E', camp, -1.4, 0, -1.2, 0); p.rotation.y = a; p.scale.set(1.2, .9, 1); }
  g.userData.fireAt = new THREE.Vector3(LAY.tent[0] + .6, 0, LAY.tent[1] + .3);
  g.userData.water = water;
  return g;
}

// ---------------- the campfire (a prop: logs, stones, flicker) ----------------
export function campfire() {
  const g = G();
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; TM(new THREE.DodecahedronGeometry(.1, 0), '#7A7468', g, Math.sin(a) * .36, .05, Math.cos(a) * .36, .006).rotation.set(i, i * 2, 0); }
  for (let i = 0; i < 3; i++) TM(new THREE.CylinderGeometry(.04, .05, .55, 6), '#5A3A22', g, 0, .07, 0, .006).rotation.set(Math.PI / 2 - .25, i * 1.05, 0);
  const fl = []; for (const [s, c, y] of [[.22, '#FF7A1A', .2], [.15, '#FFB02A', .24], [.08, '#FFF0A0', .22]]) { const f = new THREE.Mesh(new THREE.ConeGeometry(s, s * 2.6, 10), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .92 })); f.position.y = y; g.add(f); fl.push(f); }
  g.userData.flicker = t => fl.forEach((f, i) => { const k = 1 + Math.sin(t * (13 + i * 5) + i) * .12 + Math.sin(t * 29 + i * 2) * .06; f.scale.set(1, k, 1); f.rotation.z = Math.sin(t * 7 + i) * .08; });
  return g;
}

// ---------------- the used-book shop, Japan, 1974 ----------------
export function shop() {
  const g = G(); g.name = 'shop'; const R = rng(41);
  const wood = ctex(256, 256, (c, w, h) => { const Rr = rng(3); c.fillStyle = '#9A6A3E'; c.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, y, w, 2); } for (let i = 0; i < 500; i++) { c.strokeStyle = `rgba(60,30,10,${.15 * Rr()})`; c.beginPath(); const y = Rr() * h; c.moveTo(0, y); c.lineTo(w, y + (Rr() - .5) * 6); c.stroke(); } }, [4, 4]);
  M(new THREE.PlaneGeometry(10, 8), std({ map: wood }), g, 0, 0, 0).rotation.x = -Math.PI / 2;
  const wall = std({ color: '#E8DCC0' });
  M(new THREE.PlaneGeometry(10, 4), wall, g, 0, 2, -3.2);
  for (const s of [-1, 1]) M(new THREE.PlaneGeometry(8, 4), wall, g, s * 4.2, 2, 0).rotation.y = -s * Math.PI / 2;
  M(new THREE.PlaneGeometry(10, 8), std({ color: '#D8CCB0' }), g, 0, 3.4, 0).rotation.x = Math.PI / 2;
  // shelves to the ceiling, packed with books
  const shelfM = std({ color: '#6A4426' }), NB = 1400, books = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), std({ color: '#FFFFFF', roughness: .8 }), NB); let bi = 0;
  const bc = ['#8E2A22', '#2A4A7A', '#3E6A3A', '#C89A3A', '#6A3A5A', '#E8DCC0', '#3A3A3E', '#B8582A', '#5A7A8A', '#7A5A3A'];
  const bay = (x0, z0, w, ry) => { const b = G(); b.position.set(x0, 0, z0); b.rotation.y = ry; g.add(b);
    M(new THREE.BoxGeometry(w, 3.2, .05), shelfM, b, 0, 1.6, -.2); for (const s of [-1, 1]) M(new THREE.BoxGeometry(.06, 3.2, .42), shelfM, b, s * w / 2, 1.6, 0);
    for (let k = 0; k < 6; k++) { const y = .15 + k * .52; M(new THREE.BoxGeometry(w, .04, .42), shelfM, b, 0, y, 0); let x = -w / 2 + .05;
      while (x < w / 2 - .08 && bi < NB) { const bw = .035 + R() * .04, bh = .3 + R() * .14, lean = R() < .06 ? .25 : 0; _p.set(x + bw / 2, y + .02 + bh / 2, (R() - .5) * .04); b.updateMatrixWorld(true);
        const v = _p.clone().applyMatrix4(b.matrixWorld); put(books, bi, v.x, v.y, v.z, ry, bw, bh, .26 + R() * .06, 0, lean); books.setColorAt(bi, new THREE.Color(bc[Math.floor(R() * bc.length)])); bi++; x += bw + .004 + (lean ? .03 : 0); } } };
  bay(-2.6, -2.95, 2.4, 0); bay(0, -2.95, 2.4, 0); bay(2.6, -2.95, 2.4, 0); bay(-3.95, -.6, 2.4, Math.PI / 2); bay(3.95, -.6, 2.4, -Math.PI / 2);
  books.count = bi; books.instanceMatrix.needsUpdate = true; books.instanceColor.needsUpdate = true; books.castShadow = books.receiveShadow = true; g.add(books);
  // the counter: book stacks, a cash register, a desk lamp
  const counter = G(); counter.position.set(0, 0, -.6); g.add(counter); g.userData.counter = counter;
  TM(new THREE.BoxGeometry(2.2, .9, .7), '#7A4E2C', counter, 0, .45, 0, .01); TM(new THREE.BoxGeometry(2.3, .05, .8), '#5A3A20', counter, 0, .92, 0, .008);
  const reg = G(); reg.position.set(.75, .95, -.05); counter.add(reg); TM(new THREE.BoxGeometry(.36, .2, .3), '#3A3A3E', reg, 0, .1, 0, .006); TM(new THREE.BoxGeometry(.3, .12, .04), '#C8C0A8', reg, 0, .26, -.12, .005);
  for (let i = 0; i < 9; i++) TM(new THREE.CylinderGeometry(.018, .018, .02, 8), '#F4F1EA', reg, -.1 + (i % 3) * .1, .21, .02 + Math.floor(i / 3) * .06, 0);
  for (const [x, n] of [[-.75, 6], [-.45, 4]]) for (let k = 0; k < n; k++) TM(new THREE.BoxGeometry(.24, .05, .32), bc[(k * 3 + n) % bc.length], counter, x + (R() - .5) * .03, .97 + k * .05, (R() - .5) * .03, .004).rotation.y = (R() - .5) * .3;
  // a wall calendar: 1974, March
  const cal = textPlane([{ text: '1974', size: 150, y: 120, color: '#1A1416', weight: 900, font: 'Montserrat' }, { text: 'MARCH', size: 86, y: 250, color: '#C8283A', weight: 900, font: 'Montserrat' }], .55, .75, { w: 420, h: 560, bg: '#F6F1E7', border: '#2A1A10', bw: 10, round: 6 });
  cal.position.set(1.5, 2.35, -3.15); g.add(cal);
  // a hanging lamp
  const lamp = G(); lamp.position.set(0, 3.4, -.5); g.add(lamp); TM(new THREE.CylinderGeometry(.005, .005, .8, 4), '#222', lamp, 0, -.4, 0, 0);
  TM(new THREE.ConeGeometry(.28, .22, 20, 1, true), '#2E5A3A', lamp, 0, -.88, 0, .006).material.side = THREE.DoubleSide;
  M(new THREE.SphereGeometry(.07, 10, 8), new THREE.MeshBasicMaterial({ color: '#FFF0C0' }), lamp, 0, -.95, 0);
  return g;
}

// ---------------- the plane: a four-engine bomber (1945) or a white airliner (1974); toon + ink ----------------
export function plane(o = {}) {
  const g = G(), body = o.body ?? '#AEB4B8', W = .03;
  const fus = TM(new THREE.CapsuleGeometry(1.0, 14, 8, 20), body, g, 0, 0, 0, W); fus.rotation.x = Math.PI / 2; fus.scale.set(1, 1, .95);
  TM(new THREE.SphereGeometry(.9, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), o.mil ? '#BFE0F0' : body, g, 0, .2, 7.2, W).rotation.x = Math.PI / 2;   // nose glass
  if (!o.mil) for (let i = 0; i < 12; i++) TM(new THREE.CircleGeometry(.13, 12), '#2A3A4A', g, .99, .25, 4.6 - i * .75, 0).rotation.y = Math.PI / 2;
  const wing = new THREE.BoxGeometry(30, .3, 3.4); const wp = wing.attributes.position; for (let i = 0; i < wp.count; i++) { const x = wp.getX(i), k = 1 - Math.abs(x) / 15 * .5; wp.setZ(i, wp.getZ(i) * k - Math.abs(x) * .08); } wing.computeVertexNormals();
  TM(wing, body, g, 0, -.1, 1.2, W);
  const tail = new THREE.BoxGeometry(10, .22, 2.2); TM(tail, body, g, 0, .3, -7.2, W);
  const fin = TM(new THREE.BoxGeometry(.24, 3.6, 3.2), body, g, 0, 2.0, -7.3, W); fin.rotation.x = -.35;
  if (o.stripe) { TM(new THREE.BoxGeometry(.26, .9, 2.4), o.stripe, g, 0, 2.6, -7.5, 0).rotation.x = -.35; const st = TM(new THREE.CylinderGeometry(1.012, 1.012, 12, 20, 1, true), o.stripe, g, 0, 0, 0, 0); st.rotation.x = Math.PI / 2; st.scale.set(1, .15, 1); st.position.y = .05; }
  const props = [];
  for (const x of o.mil ? [-9, -4.6, 4.6, 9] : [-6, 6]) {
    TM(new THREE.CylinderGeometry(.6, .5, 3.2, 14), o.mil ? '#8A9094' : '#D8D8DC', g, x, -.1, 2.6, W).rotation.x = Math.PI / 2;
    const hub = G(); hub.position.set(x, -.1, 4.3); g.add(hub); TM(new THREE.ConeGeometry(.3, .6, 12), '#3A3A3E', hub, 0, 0, .2, .02).rotation.x = Math.PI / 2;
    for (let b = 0; b < 3; b++) { const bl = TM(new THREE.BoxGeometry(.22, 2.6, .06), '#2A2A2E', hub, 0, 0, 0, 0); bl.geometry.translate(0, 1.3, 0); bl.rotation.z = b * 2.094; }
    props.push(hub);
  }
  if (o.mil) {   // white stars in blue roundels
    const rt = texFrom(textCanvas([], { w: 256, h: 256 })); const cv = rt.image, c = cv.getContext('2d');
    c.fillStyle = '#1E3A7A'; c.beginPath(); c.arc(128, 128, 120, 0, 7); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 44 : 112; i ? c.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r) : c.moveTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } c.fill(); rt.needsUpdate = true;
    const rm = new THREE.MeshBasicMaterial({ map: rt, transparent: true });
    for (const x of [-11, 11]) { const d = new THREE.Mesh(new THREE.CircleGeometry(1.2, 24), rm); d.rotation.x = Math.PI / 2; d.position.set(x, -.27, .9); g.add(d); }
    for (const s of [-1, 1]) { const d = new THREE.Mesh(new THREE.CircleGeometry(.75, 24), rm); d.rotation.y = s * Math.PI / 2; d.position.set(s * .99, .1, -3.5); g.add(d); }
    const hatch = G(); hatch.position.set(0, -1.0, 0); g.add(hatch); g.userData.hatch = hatch;
  }
  g.userData.spin = t => props.forEach((p, i) => p.rotation.z = t * 40 + i);
  g.traverse(m => { if (m.isMesh) m.castShadow = true; });
  return g;
}

// ---------------- hero props ----------------
export function rifle() {   // the Type 99 rifle: wooden stock and handguard, blued barrel, bolt, sling; length ~.95 along +y (butt at 0)
  const g = G(), W = .006;
  const stock = new THREE.Shape(); stock.moveTo(-.035, 0); stock.lineTo(.04, 0); stock.lineTo(.03, .2); stock.lineTo(.018, .3); stock.lineTo(.018, .66); stock.lineTo(-.012, .66); stock.lineTo(-.014, .34); stock.lineTo(-.03, .26); stock.lineTo(-.035, 0);
  const sg = new THREE.ExtrudeGeometry(stock, { depth: .032, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 2 }); sg.translate(0, 0, -.016);
  TM(sg, '#8A5A30', g, 0, 0, 0, W);
  TM(new THREE.CylinderGeometry(.009, .011, .45, 10), '#3A3D42', g, .004, .86, 0, W);
  TM(new THREE.CylinderGeometry(.016, .016, .2, 10), '#3A3D42', g, .004, .5, 0, W);   // the receiver
  const bolt = TM(new THREE.CylinderGeometry(.006, .006, .06, 8), '#3A3D42', g, .03, .44, -.02, 0); bolt.rotation.z = Math.PI / 2; TM(new THREE.SphereGeometry(.012, 8, 6), '#3A3D42', g, .062, .44, -.02, 0);
  TM(new THREE.BoxGeometry(.012, .04, .012), '#3A3D42', g, -.016, .38, 0, 0);
  const sling = TM(new THREE.TorusGeometry(.3, .006, 4, 24, Math.PI * .7), '#5A3A1E', g, -.03, .36, 0, 0); sling.rotation.set(0, Math.PI / 2, Math.PI / 2 + .9);
  const glint = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0 })); glint.position.set(.004, .95, .02); g.add(glint); g.userData.glint = glint;
  return g;
}
const paperTex = (draw, w = 512, h = 384) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const leafletTex = () => paperTex((g, w, h) => { g.fillStyle = '#F2EAD2'; g.fillRect(0, 0, w, h); g.fillStyle = '#C8283A'; g.font = '900 64px Montserrat'; g.textAlign = 'center'; g.fillText('THE WAR', w / 2, 92); g.fillText('IS OVER', w / 2, 164);
  g.fillStyle = 'rgba(30,25,20,.75)'; for (let y = 200; y < h - 30; y += 22) for (let x = 40; x < w - 40; x += 26 + (y * x % 7)) g.fillRect(x, y, 18, 12); g.strokeStyle = '#1A1416'; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20); });
export function leaflets(n = 60) {   // instanced fluttering sheets
  const m = new THREE.MeshStandardMaterial({ map: leafletTex(), side: THREE.DoubleSide, roughness: .8 });
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(.2, .15), m, n); im.castShadow = true; im.frustumCulled = false; return im;
}
export function leaflet() { const g = G(); TM(new THREE.BoxGeometry(.2, .15, .002), new THREE.MeshToonMaterial({ map: leafletTex(), gradientMap: toon('#fff').gradientMap }), g, 0, 0, 0, .002); return g; }
export function newspaper() { const t = paperTex((g, w, h) => { g.fillStyle = '#EAE4D4'; g.fillRect(0, 0, w, h); g.fillStyle = '#1A1416'; g.font = '900 54px Montserrat'; g.textAlign = 'center'; g.fillText('THE NEWS', w / 2, 60); g.fillRect(20, 76, w - 40, 6);
    g.font = '900 46px Montserrat'; g.fillText('JAPAN AT PEACE', w / 2, 140); g.fillStyle = '#8A8478'; g.fillRect(30, 166, 200, 150); g.fillStyle = 'rgba(30,25,20,.7)'; for (let y = 172; y < h - 20; y += 16) { g.fillRect(250, y, w - 280, 7); } for (let y = 330; y < h - 16; y += 16) g.fillRect(30, y, 200, 7); }, 512, 420);
  const g = G(); TM(new THREE.BoxGeometry(.34, .28, .004), new THREE.MeshToonMaterial({ map: t, gradientMap: toon('#fff').gradientMap }), g, 0, 0, 0, .003); return g; }
export function letter() { const t = paperTex((g, w, h) => { g.fillStyle = '#F6EFE0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2A3A6A'; g.lineWidth = 4; for (let y = 60; y < h - 30; y += 34) { g.beginPath(); g.moveTo(40, y); for (let x = 40; x < w - 50; x += 14) g.lineTo(x, y + Math.sin(x * .3 + y) * 5); g.stroke(); }
    g.fillStyle = '#C8283A'; g.beginPath(); g.arc(w - 70, h - 60, 26, 0, 7); g.fill(); }, 384, 480);
  const g = G(); TM(new THREE.BoxGeometry(.18, .23, .003), new THREE.MeshToonMaterial({ map: t, gradientMap: toon('#fff').gradientMap }), g, 0, 0, 0, .003); return g; }
export function photo() { const t = paperTex((g, w, h) => { g.fillStyle = '#F4F1EA'; g.fillRect(0, 0, w, h); g.fillStyle = '#8A8478'; g.fillRect(24, 24, w - 48, h - 90); g.fillStyle = '#5A564E';
    for (const [x, s] of [[120, 1], [200, 1.15], [290, .8], [360, .7]]) { g.beginPath(); g.arc(x, 150 - s * 40, 26 * s, 0, 7); g.fill(); g.fillRect(x - 30 * s, 150 - s * 10, 60 * s, 120 * s); } g.fillStyle = '#3A3630'; g.font = '700 30px Fredoka'; g.textAlign = 'center'; g.fillText('home', w / 2, h - 28); }, 480, 400);
  const g = G(); TM(new THREE.BoxGeometry(.2, .16, .003), new THREE.MeshToonMaterial({ map: t, gradientMap: toon('#fff').gradientMap }), g, 0, 0, 0, .003); return g; }
export function orderPaper() { const t = paperTex((g, w, h) => { g.fillStyle = '#F6F1E2'; g.fillRect(0, 0, w, h); g.fillStyle = '#1A1416'; g.font = '900 44px Montserrat'; g.textAlign = 'center'; g.fillText('ORDER', w / 2, 70);
    g.fillStyle = 'rgba(30,25,20,.75)'; for (let y = 110; y < h - 120; y += 24) for (let x = 40; x < w - 40; x += 24 + (y * x % 5)) g.fillRect(x, y, 16, 10); g.fillStyle = '#C8283A'; g.beginPath(); g.arc(w - 90, h - 70, 40, 0, 7); g.fill(); g.strokeStyle = '#F6F1E2'; g.lineWidth = 6; g.beginPath(); g.arc(w - 90, h - 70, 28, 0, 7); g.stroke(); }, 400, 540);
  const g = G(); TM(new THREE.BoxGeometry(.24, .32, .003), new THREE.MeshToonMaterial({ map: t, gradientMap: toon('#fff').gradientMap }), g, 0, 0, 0, .003); return g; }
export function backpack() {   // a 1970s frame pack: red pack, rolled blue sleeping bag on top, aluminium frame
  const g = G(), W = .006;
  TM(new THREE.BoxGeometry(.32, .42, .18), '#C8402A', g, 0, 0, 0, W);
  TM(new THREE.BoxGeometry(.24, .14, .05), '#A8301E', g, 0, -.08, .11, W);
  const bag = TM(new THREE.CylinderGeometry(.09, .09, .4, 14), '#2A5AA8', g, 0, .3, 0, W); bag.rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) TM(new THREE.CylinderGeometry(.012, .012, .7, 6), '#C8CCD0', g, s * .17, .06, -.1, 0);
  TM(new THREE.CylinderGeometry(.012, .012, .36, 6), '#C8CCD0', g, 0, .4, -.1, 0).rotation.z = Math.PI / 2;
  return g;
}
export function boat() {   // a wooden landing boat at the waterline
  const g = G(), W = .012;
  const hull = new THREE.BoxGeometry(2.2, .9, 6.4, 1, 1, 6); const hp = hull.attributes.position;
  for (let i = 0; i < hp.count; i++) { const z = hp.getZ(i), y = hp.getY(i), k = z > 2 ? 1 - (z - 2) / 1.2 * .55 : 1; hp.setX(i, hp.getX(i) * (y < 0 ? .78 : 1) * Math.max(.4, k)); }
  hull.computeVertexNormals(); TM(hull, '#6A5A44', g, 0, .35, 0, W);
  TM(new THREE.BoxGeometry(2.0, .08, 5.6), '#8A7458', g, 0, .62, -.2, 0);
  const ramp = TM(new THREE.BoxGeometry(2.0, .9, .1), '#5A4A38', g, 0, .3, -3.25, W); ramp.rotation.x = 1.15; ramp.position.set(0, .05, -3.6);
  return g;
}
