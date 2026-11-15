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

export const ST = { facade: -7.5, walk: [-7.2, -3.2], curb: -3, road: [-3, 3], cross: 14, cafe: -12, bench: 6, bus: 24, gym: 0, privacy: 15.5 };

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
    { name: 'PRIVACY+', col: '#2A2438', h: 10, seed: 7, signBg: '#16131A', signC: '#FFD24A', base: '#1E1A28', poster: ['HIDE 1 STAT', '$9,999/MO'] },
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

// ---------------- the stadium for The Ranking ----------------
// an oval track round a green infield; banked stands packed with a crowd (each with a coloured rating pill); a giant screen
// over the stage at the west end (its canvas is drawn every frame by the film); floodlights; the finish arch on the home
// straight (z ≈ 20); puzzle desks and the final's climbing wall on the infield; a sign-up desk by the stage.
export const SD = { home: 20.5, lanes: [18.6, 19.8, 21.0, 22.2, 23.4], finish: 0, desks: [[-9, -2], [-5, -2], [-1, -2], [3, -2], [7, -2]], wall: [16, -8], stage: [-34, 0], screen: [-44, 13, 0], desk: [-27, 9] };
export function stadium() {
  const g = G(); const R = rng(71);
  const field = M(new THREE.CircleGeometry(1, 64), std({ map: ctex(256, 256, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#4E9E3A' : '#58AA42'; c.fillRect(i * 32, 0, 32, h); } }, [8, 1]) }), g, 0, .01, 0); field.rotation.x = -Math.PI / 2; field.scale.set(32, 17, 1);
  const trackShape = new THREE.Shape(); trackShape.absellipse(0, 0, 44, 26, 0, Math.PI * 2, false); const hole = new THREE.Path(); hole.absellipse(0, 0, 32, 17, 0, Math.PI * 2, true); trackShape.holes.push(hole);
  const track = M(new THREE.ShapeGeometry(trackShape, 96), std({ color: '#C8583A', roughness: .9 }), g, 0, .02, 0); track.rotation.x = -Math.PI / 2;
  for (let k = 1; k < 6; k++) { const lr = M(new THREE.RingGeometry(1, 1.0025, 128), std({ color: '#F4F1EA' }), g, 0, .03, 0); lr.rotation.x = -Math.PI / 2; const f = k / 6; lr.scale.set(32 + 12 * f, 17 + 9 * f, 1); }
  // the home straight in front of the main stand: a clean straight section with lane lines and the finish line
  const straight = M(new THREE.PlaneGeometry(60, 7.2), std({ map: ctex(512, 128, (c, w, h) => { c.fillStyle = '#C8583A'; c.fillRect(0, 0, w, h); c.fillStyle = '#F4F1EA'; for (let k = 0; k <= 6; k++) c.fillRect(0, k * (h - 4) / 6, w, 4); }, [1, 1]) }), g, 0, .035, 21); straight.rotation.x = -Math.PI / 2;
  M(new THREE.PlaneGeometry(.4, 7.2), std({ color: '#F4F1EA' }), g, SD.finish, .04, 21).rotation.x = -Math.PI / 2;
  const arch = G(); arch.position.set(SD.finish, 0, 21); g.add(arch); const am = std({ color: '#1E2238', roughness: .5 });
  for (const s of [-1, 1]) M(new THREE.BoxGeometry(.4, 4.2, .4), am, arch, 0, 2.1, s * 4);
  const ban = textCanvasMesh('FINISH', 1024, 160, '#C8283A', '#FFFFFF'); ban.scale.set(8.4, 1.3, 1); ban.position.set(0, 3.9, 0); ban.rotation.y = Math.PI / 2; arch.add(ban);
  const ban2 = ban.clone(); ban2.rotation.y = -Math.PI / 2; arch.add(ban2);
  // the stands: stepped tiers round the oval, packed with a crowd
  const tierM = std({ color: '#5A6278', roughness: .9 }), seatC = ['#2E7FE0', '#C8283A', '#F2B33A'];
  const NC = 2600, body = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.22, .3, 4, 8), std({ color: '#FFFFFF', roughness: .8 }), NC), head = new THREE.InstancedMesh(new THREE.SphereGeometry(.17, 10, 8), std({ color: '#F4EEE4', roughness: .7 }), NC);
  const pill = new THREE.InstancedMesh(new THREE.PlaneGeometry(.42, .2), new THREE.MeshBasicMaterial({ color: '#FFFFFF', side: THREE.DoubleSide, toneMapped: false }), NC);
  const tops = ['#D86A4A', '#4AA8D8', '#5A5E68', '#E8C84A', '#9A6AC8', '#4AC88A', '#C84A6A', '#8AA8C8', '#E89A4A', '#F4F1EA'], pills = ['#4ADB6A', '#C8E04A', '#FF9A2A', '#FFC83A', '#E8423A', '#4ADB6A', '#C8E04A'];
  let ci = 0; const crowdPos = [];
  for (let tier = 0; tier < 9; tier++) {
    const rx = 47 + tier * 1.7, rz = 29 + tier * 1.7, y = 1 + tier * 1.05, n = Math.floor(2 * Math.PI * Math.sqrt((rx * rx + rz * rz) / 2) / 3.4);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, x = Math.cos(a) * rx, z = Math.sin(a) * rz; if (x < -40 && Math.abs(z) < 14) continue;   // the stage end is open
      const st = M(new THREE.BoxGeometry(3.5, 1.05, 1.8), tierM, g, x, y - .52, z); st.rotation.y = -Math.atan2(z / rz, x / rx) + Math.PI / 2; st.castShadow = false;
      for (let k = 0; k < 2 && ci < NC; k++) { const off = (k - .5) * 1.5, px = x + Math.cos(a + Math.PI / 2) * off, pz = z + Math.sin(a + Math.PI / 2) * off, ry = Math.atan2(-x, -z);
        put(body, ci, px, y + .35, pz, ry); put(head, ci, px, y + .82, pz); put(pill, ci, px, y + 1.25, pz, ry); body.setColorAt(ci, new THREE.Color(tops[Math.floor(R() * tops.length)])); pill.setColorAt(ci, new THREE.Color(pills[Math.floor(R() * pills.length)])); crowdPos.push([px, y, pz, ry, R()]); ci++; } } }
  body.count = head.count = pill.count = ci; [body, head, pill].forEach(m => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.castShadow = false; g.add(m); });
  g.userData.crowd = { body, head, pill, pos: crowdPos };
  g.userData.cheer = (t, k) => { for (let i = 0; i < crowdPos.length; i++) { const [px, y, pz, ry, r] = crowdPos[i], j = Math.max(0, Math.sin(t * (7 + r * 5) + r * 20)) * .25 * k; put(body, i, px, y + .35 + j, pz, ry); put(head, i, px, y + .82 + j, pz); put(pill, i, px, y + 1.25 + j, pz, ry); }
    body.instanceMatrix.needsUpdate = head.instanceMatrix.needsUpdate = pill.instanceMatrix.needsUpdate = true; };
  // the giant screen over the stage (drawn by the film) and the stage itself
  const sc = document.createElement('canvas'); sc.width = 1280; sc.height = 720; const stex = new THREE.CanvasTexture(sc); stex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(26, 14.6), new THREE.MeshBasicMaterial({ map: stex, toneMapped: false })); screen.position.set(...SD.screen); screen.rotation.y = Math.PI / 2; g.add(screen);
  M(new THREE.BoxGeometry(1, 16, 28), std({ color: '#1A1C26', roughness: .5 }), g, SD.screen[0] - .6, 13, 0);
  for (const s of [-1, 1]) M(new THREE.BoxGeometry(1, 22, 1), std({ color: '#2A2C34', metalness: .5, roughness: .4 }), g, SD.screen[0] - .2, 11, s * 14);
  g.userData.screen = { canvas: sc, ctx: sc.getContext('2d'), tex: stex, key: '' };
  const stage = M(new THREE.BoxGeometry(10, 1.2, 16), std({ color: '#1E2238', roughness: .6 }), g, SD.stage[0], .6, SD.stage[1]);
  M(new THREE.BoxGeometry(10.2, .08, 16.2), std({ color: '#FFC83A', emissive: '#FFB020', emissiveIntensity: .6 }), g, SD.stage[0], 1.22, SD.stage[1]);
  const pod = G(); pod.position.set(SD.stage[0] + 2.5, 1.2, SD.stage[1] - 2.4); g.add(pod); M(new THREE.BoxGeometry(.9, 1.15, .6), std({ color: '#F4F1EA', roughness: .5 }), pod, 0, .575, 0); M(new THREE.CylinderGeometry(.015, .015, .4, 6), std({ color: '#2A2A30' }), pod, 0, 1.3, -.1).rotation.x = -.4;
  g.userData.podium = pod;
  // the trophy: a giant gold card on a pedestal at the front of the stage
  const troph = G(); troph.position.set(SD.stage[0] + 3.6, 1.2, SD.stage[1] + 2.2); g.add(troph); g.userData.trophy = troph;
  M(new THREE.CylinderGeometry(.55, .65, .9, 24), std({ color: '#F4F1EA', roughness: .4 }), troph, 0, .45, 0);
  const gc = textCanvasMesh('★', 512, 768, '#FFC83A', '#5A4410', 'card'); gc.scale.set(1.1, 1.65, 1); gc.position.set(0, 1.8, 0); gc.rotation.y = Math.PI / 2; troph.add(gc);
  // floodlights
  for (const [x, z] of [[-40, -26], [-40, 26], [40, -26], [40, 26]]) { M(new THREE.CylinderGeometry(.35, .5, 28, 10), std({ color: '#B8BCC4', metalness: .5, roughness: .4 }), g, x * 1.25, 14, z * 1.25); M(new THREE.BoxGeometry(5, 3, .6), std({ color: '#FFFFFF', emissive: '#FFF6D8', emissiveIntensity: 1.2 }), g, x * 1.25, 28.5, z * 1.25).lookAt(0, 0, 0); }
  // the TV camera, the sign-up desk
  const cam = G(); cam.position.set(SD.stage[0] + 6, 0, 6); cam.rotation.y = -2.2; g.add(cam); g.userData.tvcam = cam; for (let k = 0; k < 3; k++) { const l = M(new THREE.CylinderGeometry(.03, .03, 1.5, 6), std({ color: '#2A2A30' }), cam, Math.sin(k * 2.1) * .3, .7, Math.cos(k * 2.1) * .3); l.rotation.set(Math.cos(k * 2.1) * .2, 0, -Math.sin(k * 2.1) * .2); }
  M(new THREE.BoxGeometry(.5, .45, .9), std({ color: '#2A2C34', metalness: .4, roughness: .4 }), cam, 0, 1.6, 0); M(new THREE.CylinderGeometry(.14, .16, .4, 16), std({ color: '#1A1A1E' }), cam, 0, 1.6, .6).rotation.x = Math.PI / 2;
  const red = M(new THREE.SphereGeometry(.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#FF2A2A' }), cam, .2, 1.86, .3); g.userData.tally = red;
  const desk = G(); desk.position.set(SD.desk[0], 0, SD.desk[1]); g.add(desk); g.userData.signDesk = desk; M(new THREE.BoxGeometry(2.4, .78, .8), std({ color: '#F4F1EA', roughness: .5 }), desk, 0, .39, 0);
  const dsign = textCanvasMesh('SIGN UP', 1024, 256, '#C8283A', '#FFFFFF'); dsign.scale.set(2.2, .55, 1); dsign.position.set(0, .45, .41); desk.add(dsign);
  M(new THREE.BoxGeometry(.3, .006, .4), std({ color: '#FBF6E6' }), desk, .3, .79, 0).rotation.y = .2;
  // the puzzle desks (blocks to stack) and the final's wall
  g.userData.desks = SD.desks.map(([x, z], i) => { const d = G(); d.position.set(x, 0, z); g.add(d); M(new THREE.BoxGeometry(1.4, .76, .8), std({ color: '#F4F1EA', roughness: .5 }), d, 0, .38, 0);
    const blocks = []; for (let k = 0; k < 6; k++) { const b = M(new THREE.BoxGeometry(.14, .14, .14), std({ color: ['#E8423A', '#2E7FE0', '#FFD23F', '#3EB24A', '#9A6AC8', '#FF8A2A'][k], roughness: .5 }), d, -.4 + (k % 3) * .18, .83, -.15 + Math.floor(k / 3) * .2); blocks.push(b); } d.userData.blocks = blocks; return d; });
  const wall = G(); wall.position.set(SD.wall[0], 0, SD.wall[1]); g.add(wall); g.userData.wall = wall;
  M(new THREE.BoxGeometry(7, 9, .6), std({ color: '#8A93A8', roughness: .9 }), wall, 0, 4.5, 0);
  const holdC = ['#E8423A', '#FFD23F', '#2E7FE0', '#3EB24A', '#FF8A2A', '#E86AB8'];
  for (let i = 0; i < 70; i++) { const h = M(new THREE.DodecahedronGeometry(.11 + R() * .08, 0), std({ color: holdC[i % 6], roughness: .7 }), wall, -3.2 + R() * 6.4, .4 + R() * 8.3, .34); h.scale.z = .5; }
  const wtop = textCanvasMesh('THE FINAL', 1024, 200, '#1E2238', '#FFD23F'); wtop.scale.set(6, 1.15, 1); wtop.position.set(0, 9.7, .32); wall.add(wtop);
  return g;
}
function textCanvasMesh(text, w, h, bg, fg, kind) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  if (kind === 'card') { const grd = g.createLinearGradient(0, 0, w, h); grd.addColorStop(0, '#FFE58A'); grd.addColorStop(.5, '#FFC83A'); grd.addColorStop(1, '#C8901A'); g.fillStyle = grd; g.beginPath(); g.roundRect(10, 10, w - 20, h - 20, 60); g.fill(); g.lineWidth = 18; g.strokeStyle = '#FFF4C8'; g.stroke();
    g.fillStyle = fg; g.font = '900 360px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 20); }
  else { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = `900 ${Math.round(h * .62)}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 4); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: t, roughness: .5, side: THREE.DoubleSide, emissive: kind === 'card' ? '#5A4410' : '#000000' })); m.castShadow = false; return m;
}
