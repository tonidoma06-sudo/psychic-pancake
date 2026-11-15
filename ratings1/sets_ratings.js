// sets_ratings.js · a bright city street for "What if everyone had ratings above their heads": a row of colourful shopfronts
// (a café with a terrace, a gym, a bakery, books, flowers) with rating-world signs in the windows, a wide sidewalk, a road
// with a crosswalk, street trees, lamps, a bench under a tree, a bus stop, a hazy skyline behind.
// Layout: the shop facades stand along z = -7.5 (facing +z); the action sidewalk is z in [-7.5, -3]; the road z in [-3, 3].
// Environment = PBR without outlines; characters and hero props = toon + ink.
import * as THREE from 'three';
import { TM, toon, G } from './toon.js';
import { textCanvas, texFrom } from './kit.js';

const rng = s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
function ctex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t; }
const std = o => new THREE.MeshStandardMaterial({ roughness: 1, ...o });
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const put = (im, i, x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) => { _q.setFromEuler(_e.set(rx, ry, rz)); _m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz)); im.setMatrixAt(i, _m); };
const M = (geo, mat, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; if (parent) parent.add(o); return o; };

export const ST = { facade: -7.5, walk: [-7.2, -3.2], curb: -3, road: [-3, 3], cross: 14, cafe: -12, bench: 6, bus: 24, gym: 0 };

const paveTex = rep => ctex(256, 256, (g, w, h) => { const R = rng(4); g.fillStyle = '#D6D0C6'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${R() < .5 ? '90,85,80' : '255,250,240'},${.12 * R()})`; g.fillRect(R() * w, R() * h, 2, 2); }
  g.strokeStyle = 'rgba(120,112,104,.55)'; g.lineWidth = 3; for (let x = 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }, rep);
const roadTex = rep => ctex(512, 512, (g, w, h) => { const R = rng(6); g.fillStyle = '#4A4C52'; g.fillRect(0, 0, w, h); for (let i = 0; i < 12000; i++) { g.fillStyle = `rgba(${R() < .5 ? '20,20,24' : '140,140,150'},${.25 * R()})`; g.fillRect(R() * w, R() * h, 2, 2); } }, rep);
const winTex = (col, seed) => ctex(512, 512, (g, w, h) => { const R = rng(seed); g.fillStyle = col; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${R() < .5 ? '0,0,0' : '255,255,255'},${.05 * R()})`; g.fillRect(R() * w, R() * h, 3, 3); }
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const x = 40 + c * 120, y = 40 + r * 120; g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - 6, y - 6, 92, 92);
    const sk = g.createLinearGradient(x, y, x + 80, y + 80); sk.addColorStop(0, '#9CC8E8'); sk.addColorStop(1, '#3E6A90'); g.fillStyle = sk; g.fillRect(x, y, 80, 80); g.fillStyle = '#F4F1EA'; g.fillRect(x + 38, y, 4, 80); g.fillRect(x, y + 38, 80, 4); g.fillRect(x - 8, y + 80, 96, 8); } });

function shopFront(parent, x, w, o) {
  const f = G(); f.position.set(x, 0, ST.facade); parent.add(f);
  const h = o.h;
  M(new THREE.BoxGeometry(w, h, 1), std({ map: winTex(o.col, o.seed), roughness: .9 }), f, 0, h / 2, -.5).material.map.repeat.set(w / 5, (h - 4) / 5);
  // ground floor: a big shop window, a door, a band for the sign, an awning
  M(new THREE.BoxGeometry(w, 4, 1.04), std({ color: o.base ?? '#F4F1EA', roughness: .8 }), f, 0, 2, -.5);
  const glassM = std({ color: '#2A3A4A', roughness: .15, metalness: .4, emissive: '#1A2A38', emissiveIntensity: .5 });
  M(new THREE.BoxGeometry(w * .55, 2.3, .1), glassM, f, -w * .14, 1.55, .04);
  M(new THREE.BoxGeometry(1.1, 2.4, .1), std({ color: o.door ?? '#3A2A22' }), f, w * .3, 1.2, .04);
  const sign = textCanvas([{ text: o.name, size: 120, weight: 900, font: 'Montserrat', color: o.signC ?? '#FFFFFF', y: 128 }], { w: 1024, h: 256, bg: o.signBg ?? '#1E2238', round: 40 });
  const sg = M(new THREE.PlaneGeometry(Math.min(w * .8, 6), Math.min(w * .8, 6) / 4), new THREE.MeshStandardMaterial({ map: texFrom(sign), roughness: .6 }), f, 0, 3.45, .06); sg.castShadow = false;
  if (o.awn) { const aw = ctex(256, 64, (c, ww, hh) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#FFFFFF' : o.awn; c.fillRect(i * 32, 0, 32, hh); } }); const a = M(new THREE.BoxGeometry(w * .62, .06, 1.3), std({ map: aw, roughness: .8 }), f, -w * .14, 2.85, .65); a.rotation.x = .28; }
  if (o.poster) { const pc = textCanvas(o.poster.map((t, i) => ({ text: t, size: i ? 64 : 84, weight: 900, font: 'Montserrat', color: i ? '#1E2238' : '#C8283A', y: 110 + i * 100 })), { w: 512, h: 128 + o.poster.length * 100, bg: '#FBF6E6', round: 24 });
    const pp = M(new THREE.PlaneGeometry(1.1, 1.1 * (128 + o.poster.length * 100) / 512), new THREE.MeshStandardMaterial({ map: texFrom(pc), roughness: .7 }), f, -w * .14 + (o.posterX ?? 0), 1.6, .1); pp.castShadow = false; }
  return f;
}

export function city() {
  const g = G(); const R = rng(41);
  const walk = M(new THREE.PlaneGeometry(240, 6.5), std({ map: paveTex([60, 1.6]) }), g, 0, .12, -5.25); walk.rotation.x = -Math.PI / 2;
  const walk2 = M(new THREE.PlaneGeometry(240, 6.5), std({ map: paveTex([60, 1.6]) }), g, 0, .12, 6.25); walk2.rotation.x = -Math.PI / 2;
  for (const z of [-3, 3]) M(new THREE.BoxGeometry(240, .14, .24), std({ color: '#B8B2A8' }), g, 0, .07, z);
  const road = M(new THREE.PlaneGeometry(240, 6), std({ map: roadTex([40, 1]) }), g, 0, .01, 0); road.rotation.x = -Math.PI / 2;
  const dash = new THREE.InstancedMesh(new THREE.PlaneGeometry(2, .14), std({ color: '#F2E6B0' }), 60); for (let i = 0; i < 60; i++) put(dash, i, -120 + i * 4, .02, 0, 0, 1, 1, 1, -Math.PI / 2); g.add(dash);
  const zebra = new THREE.InstancedMesh(new THREE.PlaneGeometry(.5, 3.4), std({ color: '#F4F1EA' }), 8); for (let i = 0; i < 8; i++) put(zebra, i, ST.cross, .025, -2.4 + i * .68, Math.PI / 2, 1, 1, 1, -Math.PI / 2); g.add(zebra);
  // the shopfronts (far side) and plain facades (near side)
  const shops = [
    { name: 'BOOKS', col: '#8AB8D8', h: 11, seed: 1, awn: '#2E7FE0' },
    { name: 'CAFÉ', col: '#F2C8A0', h: 12, seed: 2, awn: '#C8283A', poster: ['NOW HIRING', 'EQ 70+'], base: '#FBF2E4' },
    { name: 'FLOWERS', col: '#E8A8B8', h: 10, seed: 3, awn: '#E86A9A' },
    { name: 'GYM', col: '#B8C8B0', h: 13, seed: 4, signBg: '#C8283A', poster: ['MEMBERS', 'STR 80+ ONLY'] },
    { name: 'BAKERY', col: '#F4D88A', h: 11, seed: 5, awn: '#E8A030' },
    { name: 'SHOES', col: '#C8B8E8', h: 12, seed: 6, poster: ['SALE', 'OVR 75+'] },
    { name: 'PIZZA', col: '#E8B898', h: 10, seed: 7, awn: '#2E9A4A' },
    { name: 'BANK', col: '#D8D4CC', h: 14, seed: 8, poster: ['LOANS', 'OVERALL 80+'] },
  ];
  let x = -44; const widths = [9, 11, 8, 10, 9, 8, 9, 11];
  for (let k = 0; k < 2; k++) for (let i = 0; i < shops.length; i++) { const wdt = widths[i]; shopFront(g, x + wdt / 2, wdt, { ...shops[(i + k * 3) % shops.length], seed: i + k * 9 }); x += wdt; }
  for (let i = 0; i < 18; i++) { const wdt = 8 + R() * 4, h = 10 + R() * 6, f = M(new THREE.BoxGeometry(wdt, h, 1), std({ map: winTex(['#C8B8A8', '#A8B8C8', '#D8C8A8', '#B8A8B8'][i % 4], 30 + i), roughness: .9 }), g, -60 + i * 8 + wdt / 2, h / 2, 9.5); f.material.map.repeat.set(wdt / 5, h / 5); }
  // the skyline beyond, in the haze
  const skyM = [std({ color: '#9AAEC8' }), std({ color: '#AEC0D6' }), std({ color: '#8EA2BE' })];
  for (let i = 0; i < 40; i++) { const wdt = 8 + R() * 12, h = 25 + R() * 50; M(new THREE.BoxGeometry(wdt, h, 10), skyM[i % 3], g, -120 + i * 7 + R() * 4, h / 2, -40 - R() * 50).castShadow = false; }
  // street trees in planters, lamps, a bench under a tree, a bus stop, a hydrant, bins
  const trunkM = std({ color: '#6B4A2E' }), leafM = std({ color: '#5FAE3E', roughness: .9 }), planterM = std({ color: '#8A847A' });
  for (let i = 0; i < 14; i++) { const tx = -42 + i * 7, tz = -3.8; if (Math.abs(tx - ST.cross) < 3 || Math.abs(tx - ST.cafe) < 4.5 || Math.abs(tx) < 1 || Math.abs(tx - 7) < 1) continue;   // kept clear for the camera M(new THREE.BoxGeometry(1.1, .5, 1.1), planterM, g, tx, .37, tz); M(new THREE.CylinderGeometry(.1, .14, 2.6, 8), trunkM, g, tx, 1.8, tz);
    for (let j = 0; j < 3; j++) { const b = M(new THREE.IcosahedronGeometry(1, 2), leafM, g, tx + (j - 1) * .5, 3.4 + (j === 1 ? .5 : 0), tz + (R() - .5) * .4); b.scale.setScalar(1.0 + R() * .3); } }
  const lampM = std({ color: '#2A2C34', metalness: .5, roughness: .4 });
  for (let i = 0; i < 8; i++) { const lx = -38 + i * 12.5; M(new THREE.CylinderGeometry(.07, .1, 4.6, 10), lampM, g, lx, 2.42, -3.45); const arm = M(new THREE.BoxGeometry(.08, .08, .9), lampM, g, lx, 4.65, -3.05); M(new THREE.SphereGeometry(.18, 12, 8), std({ color: '#FFF4D8', emissive: '#FFE8B0', emissiveIntensity: .5 }), g, lx, 4.5, -2.65); }
  const bench = G(); bench.position.set(ST.bench, .12, -6.4); g.add(bench); g.userData.bench = bench; const woodM = std({ color: '#B8824A', roughness: .7 });
  for (let k = 0; k < 3; k++) M(new THREE.BoxGeometry(2.0, .05, .12), woodM, bench, 0, .46, -.16 + k * .14); for (let k = 0; k < 2; k++) M(new THREE.BoxGeometry(2.0, .1, .04), woodM, bench, 0, .7 + k * .16, -.27);
  for (const s of [-1, 1]) { M(new THREE.BoxGeometry(.06, .46, .45), lampM, bench, s * .85, .23, -.05); M(new THREE.BoxGeometry(.06, .5, .06), lampM, bench, s * .85, .65, -.28); }
  const bt = new THREE.Group(); bt.position.set(ST.bench - 2.2, .12, -6.9); g.add(bt); M(new THREE.CylinderGeometry(.16, .22, 3.2, 10), trunkM, bt, 0, 1.6, 0); for (let j = 0; j < 5; j++) { const b = M(new THREE.IcosahedronGeometry(1.3, 2), leafM, bt, Math.sin(j * 1.3) * 1.1, 3.8 + (j % 2) * .6, Math.cos(j * 1.3) * .6); b.scale.setScalar(1 + R() * .3); }
  const bus = G(); bus.position.set(ST.bus, .12, -5.6); g.add(bus); for (const s of [-1, 1]) M(new THREE.BoxGeometry(.08, 2.6, .08), lampM, bus, s * 1.6, 1.3, .5); M(new THREE.BoxGeometry(3.4, .1, 1.4), std({ color: '#2E7FE0' }), bus, 0, 2.65, 0);
  M(new THREE.BoxGeometry(3.3, 2.2, .05), std({ color: '#BFD8E8', roughness: .1, metalness: .2, transparent: true, opacity: .4 }), bus, 0, 1.4, -.6);
  M(new THREE.CylinderGeometry(.18, .2, .6, 12), std({ color: '#D8282E', roughness: .5 }), g, ST.cross - 3, .42, -3.5);
  for (const bx of [-20, 9, 30]) M(new THREE.CylinderGeometry(.28, .24, .8, 14), std({ color: '#3A6A4A' }), g, bx, .52, -3.6);
  // the café terrace: round tables, chairs, umbrellas
  const tabM = std({ color: '#F4F1EA', roughness: .5 }), chM = std({ color: '#2A2C34', metalness: .3, roughness: .5 });
  g.userData.tables = [];
  for (let i = 0; i < 3; i++) { const t = G(); t.position.set(ST.cafe - 2.6 + i * 2.6, .12, -5.6 + (i % 2) * .5); g.add(t); g.userData.tables.push(t);
    M(new THREE.CylinderGeometry(.42, .42, .04, 24), tabM, t, 0, .74, 0); M(new THREE.CylinderGeometry(.04, .04, .72, 8), chM, t, 0, .37, 0);
    const um = M(new THREE.ConeGeometry(1.3, .5, 16), std({ map: ctex(256, 64, (c, w, h) => { for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#FFFFFF' : '#C8283A'; c.fillRect(k * 32, 0, 32, h); } }), roughness: .7 }), t, 0, 2.35, 0); M(new THREE.CylinderGeometry(.025, .025, 1.7, 6), chM, t, 0, 1.45, 0);
    M(new THREE.CylinderGeometry(.05, .045, .1, 12), std({ color: '#F4F1EA' }), t, .12, .81, .05);
    for (const s of [-1, 1]) { const ch = G(); ch.position.set(s * .62, 0, .22); ch.rotation.y = -s * Math.PI / 2; t.add(ch); M(new THREE.BoxGeometry(.42, .04, .42), chM, ch, 0, .44, 0); M(new THREE.BoxGeometry(.42, .42, .04), chM, ch, 0, .66, -.2); for (const [a, b] of [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]]) M(new THREE.CylinderGeometry(.015, .015, .44, 6), chM, ch, a, .22, b); } }
  return g;
}

// ---------------- hero props ----------------
export function coffee() { const g = G(); TM(new THREE.CylinderGeometry(.04, .033, .12, 16), toon('#F4F1EA'), g, 0, .06, 0, .004); TM(new THREE.CylinderGeometry(.042, .042, .03, 16), toon('#8A5A3A'), g, 0, .05, 0, 0); TM(new THREE.CylinderGeometry(.042, .04, .014, 16), '#2A2A30', g, 0, .125, 0, .003); return g; }
export function sweatband() { const g = G(); TM(new THREE.TorusGeometry(.215, .025, 8, 32), '#E8423A', g, 0, 0, 0, .004).rotation.x = Math.PI / 2; return g; }
