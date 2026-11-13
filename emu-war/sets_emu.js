// sets_emu.js · Western Australia, 1932: the wheat farm and the harvested paddock, the farmhouse, a windmill, gum trees,
// red-dirt hills, the army camp; the hero props (1930s army truck, Lewis guns, ammo crates, scoreboard, binoculars, mic);
// and the army office for "the army said no". Environment = PBR without outlines; hero props = toon + ink.
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
  wheat: [-50, 0, -80, 4.4],          // x0 x1 z0 z1: the standing wheat
  fenceZ: 4.9, fenceX: .7,
  dam: [36, -18, 7],                  // x z r
  camp: [18, 22], road: 38, house: [-18, 20], windmill: [-6, 23], tank: [-11.5, 17],
};
export const WIND = { value: 0 };

const dirtTex = rep => ctex(512, 512, (g, w, h) => { const R = rng(5); g.fillStyle = '#B9663C'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${R() < .5 ? '110,48,22' : '232,160,110'},${.16 * R()})`; g.fillRect(R() * w, R() * h, 2 + R() * 4, 2 + R() * 4); }
  for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(90,40,20,.25)'; g.beginPath(); g.ellipse(R() * w, R() * h, 3 + R() * 6, 2 + R() * 4, R() * 3, 0, 7); g.fill(); } }, rep);
const stubbleTex = rep => ctex(512, 512, (g, w, h) => { const R = rng(7); g.fillStyle = '#D6B26A'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 16) { g.fillStyle = 'rgba(150,100,40,.18)'; g.fillRect(0, y, w, 5); }
  for (let i = 0; i < 9000; i++) { const x = R() * w, y = R() * h; g.strokeStyle = R() < .5 ? 'rgba(244,222,160,.6)' : 'rgba(150,104,48,.45)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - .5) * 4, y - 4 - R() * 6); g.stroke(); } }, rep);
const wheatTex = rep => ctex(512, 512, (g, w, h) => { const R = rng(9); g.fillStyle = '#D9A93E'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 12000; i++) { g.fillStyle = R() < .5 ? 'rgba(250,214,120,.5)' : 'rgba(170,110,30,.4)'; g.fillRect(R() * w, R() * h, 2, 5 + R() * 6); } }, rep);
const roadTex = rep => ctex(256, 1024, (g, w, h) => { const R = rng(13); g.fillStyle = '#C98256'; g.fillRect(0, 0, w, h);
  for (const x of [70, 186]) { g.fillStyle = 'rgba(120,60,30,.35)'; g.fillRect(x - 14, 0, 28, h); }
  for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(${R() < .5 ? '120,60,30' : '240,190,150'},${.2 * R()})`; g.fillRect(R() * w, R() * h, 2 + R() * 3, 2 + R() * 3); } }, rep);
const weatherboard = () => ctex(256, 256, (g, w, h) => { g.fillStyle = '#EFE6CF'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 22) { g.fillStyle = 'rgba(120,100,70,.35)'; g.fillRect(0, y + 18, w, 4); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, y, w, 3); } }, [3, 1]);
const corrugated = (col, rep) => ctex(256, 64, (g, w, h) => { const grd = g.createLinearGradient(0, 0, 32, 0); grd.addColorStop(0, col); grd.addColorStop(.5, '#FFFFFF'); grd.addColorStop(1, col); for (let x = 0; x < w; x += 32) { g.fillStyle = grd; g.save(); g.translate(x, 0); g.fillRect(0, 0, 32, h); g.restore(); } g.globalCompositeOperation = 'multiply'; g.fillStyle = col; g.fillRect(0, 0, w, h); }, rep);

// ---------------- the outback ----------------
export function outback() {
  const g = G(); g.name = 'outback'; const R = rng(21);
  const ground = M(new THREE.PlaneGeometry(900, 900), std({ map: dirtTex([180, 180]) }), g); ground.rotation.x = -Math.PI / 2;
  const [wx0, wx1, wz0, wz1] = LAY.wheat;
  const pad = M(new THREE.PlaneGeometry(150, 160), std({ map: stubbleTex([60, 64]) }), g, 75 + .7, .01, -40); pad.rotation.x = -Math.PI / 2;
  const wf = M(new THREE.PlaneGeometry(wx1 - wx0, wz1 - wz0), std({ map: wheatTex([30, 50]) }), g, (wx0 + wx1) / 2, .02, (wz0 + wz1) / 2); wf.rotation.x = -Math.PI / 2;
  const road = M(new THREE.PlaneGeometry(6, 900), std({ map: roadTex([1, 60]) }), g, 0, .025, LAY.road); road.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
  // the standing wheat: clumps of five stalks, instanced, swaying in the wind (a vertex-shader sway keyed to world position)
  const stalk = (ox, oz, h, lean) => { const parts = [];
    const st = new THREE.PlaneGeometry(.012, h, 1, 3); st.translate(0, h / 2, 0); parts.push(st);
    const hd = new THREE.OctahedronGeometry(.024, 0); hd.scale(.75, 2.6, .75); hd.translate(0, h + .05, 0); parts.push(hd);
    const lf = new THREE.PlaneGeometry(.025, h * .5); lf.translate(.02, h * .3, 0); lf.rotateZ(-.4); parts.push(lf);
    const m = mergeGeometries(parts.map(p => p.index ? p.toNonIndexed() : p)); m.rotateZ(lean); m.rotateY(R() * 6); m.translate(ox, 0, oz); return m; };
  const clumpG = mergeGeometries(Array.from({ length: 5 }, (_, k) => stalk((R() - .5) * .3, (R() - .5) * .3, .82 + R() * .25, (R() - .5) * .18)));
  clumpG.computeVertexNormals();
  const wm = std({ color: '#FFFFFF', side: THREE.DoubleSide, roughness: .85 });
  wm.onBeforeCompile = sh => { sh.uniforms.uT = WIND; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\n vec2 wp = instanceMatrix[3].xz; float k = position.y * position.y; transformed.x += sin(uT * 2.2 + wp.x * .45 + wp.y * .3) * k * .08; transformed.z += cos(uT * 1.6 + wp.x * .3) * k * .05;\n#endif'); };
  const NW = 9000, wheat = new THREE.InstancedMesh(clumpG, wm, NW); wheat.castShadow = false; wheat.receiveShadow = true; wheat.frustumCulled = false;
  const wc = ['#E8B84A', '#D9A43A', '#F2C95E', '#C99632', '#EAC060']; let wi = 0;
  for (let i = 0; i < NW; i++) {
    // dense near the fence corner (where the camera works), sparser far away
    const near = i < 4500, x = near ? -.4 - Math.pow(R(), 1.3) * 26 : wx0 + R() * (wx1 - wx0 - .5), z = near ? 4.2 - Math.pow(R(), 1.2) * 30 : wz0 + R() * (wz1 - wz0 - .3);
    const s = .9 + R() * .25; put(wheat, wi, x, 0, z, R() * 6, s * 1.4, s, s * 1.4); wheat.setColorAt(wi, new THREE.Color(wc[wi % 5])); wi++;
  }
  wheat.instanceMatrix.needsUpdate = true; wheat.instanceColor.needsUpdate = true; g.add(wheat); g.userData.wheat = wheat;
  // a low "far wheat" band: a slightly raised golden volume so the field reads as tall from far away
  const farW = M(new THREE.BoxGeometry(wx1 - wx0, .8, wz1 - wz0 - 32), std({ map: wheatTex([30, 30]) }), g, (wx0 + wx1) / 2 - .5, .4, (wz0 + wz1) / 2 - 16); farW.castShadow = false;
  // stubble tufts in the paddock
  const tuftG = (() => { const pos = []; for (let k = 0; k < 4; k++) { const a = k * 1.57 + .3, ox = Math.cos(a) * .015, oz = Math.sin(a) * .015, lx = Math.cos(a + 1.57) * .008, lz = Math.sin(a + 1.57) * .008, tx = Math.cos(a) * .05, tz = Math.sin(a) * .05; pos.push(ox - lx, 0, oz - lz, ox + lx, 0, oz + lz, ox + tx, .1, oz + tz); } const b = new THREE.BufferGeometry(); b.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); b.computeVertexNormals(); return b; })();
  const NT = 14000, tufts = new THREE.InstancedMesh(tuftG, std({ color: '#FFFFFF', side: THREE.DoubleSide }), NT); const tc = ['#E8CC88', '#D2AE64', '#F0D898', '#C8A058'];
  for (let i = 0; i < NT; i++) { put(tufts, i, 1.4 + R() * 75, 0, 32 - R() * 85, R() * 6, .7 + R() * .8, .5 + R() * .9, .7 + R() * .8); tufts.setColorAt(i, new THREE.Color(tc[i % 4])); }
  tufts.instanceColor.needsUpdate = true;
  tufts.instanceMatrix.needsUpdate = true; tufts.receiveShadow = true; g.add(tufts);
  // fences: grey posts and wires round the wheat
  const fpost = new THREE.InstancedMesh(new THREE.CylinderGeometry(.055, .065, 1.2, 7), std({ color: '#A89A86' }), 120); let fi = 0;
  const wires = [];
  for (let x = wx0; x <= LAY.fenceX + .01 && fi < 120; x += 2.6) put(fpost, fi++, x, .6, LAY.fenceZ, R(), 1, 1 + (R() - .5) * .1, 1, (R() - .5) * .06, (R() - .5) * .06);
  for (let z = LAY.fenceZ - 2.6; z >= wz0 && fi < 120; z -= 2.6) put(fpost, fi++, LAY.fenceX, .6, z, R(), 1, 1, 1, (R() - .5) * .06, (R() - .5) * .06);
  fpost.count = fi; fpost.castShadow = true; fpost.instanceMatrix.needsUpdate = true; g.add(fpost);
  const wireM = std({ color: '#5A5650', metalness: .5, roughness: .5 });
  for (const y of [.45, .78, 1.08]) {
    const a = M(new THREE.CylinderGeometry(.006, .006, LAY.fenceX - wx0, 4), wireM, g, (wx0 + LAY.fenceX) / 2, y, LAY.fenceZ); a.rotation.z = Math.PI / 2; a.castShadow = false;
    const b = M(new THREE.CylinderGeometry(.006, .006, LAY.fenceZ - wz0, 4), wireM, g, LAY.fenceX, y, (LAY.fenceZ + wz0) / 2); b.rotation.x = Math.PI / 2; b.castShadow = false;
  }
  // the dam: a muddy bank round brown water
  const [dx, dz, dr] = LAY.dam;
  const bank = M(new THREE.CylinderGeometry(dr + 2.5, dr + 4, .5, 48), std({ color: '#A0583A' }), g, dx, .0, dz); bank.receiveShadow = true;
  M(new THREE.CylinderGeometry(dr, dr, .02, 48), std({ color: '#7A8A78', roughness: .15, metalness: .1 }), g, dx, .26, dz);
  // gum trees: pale twisting trunks, olive canopies
  const NTr = 46, trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.16, .3, 1, 7), std({ color: '#D9D2C2' }), NTr * 3);
  const can = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), std({ color: '#FFFFFF', roughness: .95, flatShading: true }), NTr * 5);
  const cc = ['#7E9460', '#6C8350', '#8FA270', '#788C5A']; let ti = 0;
  const spots = [[-26, 26], [-30, 14], [-9, 31], [6, 30], [26, 30], [48, 26], [64, 12], [70, -20], [86, -40], [60, -70], [20, -96], [-20, -100], [-62, -60], [-70, -10], [-58, 30], [102, 6]];
  for (let i = 0; i < NTr; i++) {
    let x, z; if (i < spots.length) [x, z] = spots[i]; else { const a = R() * Math.PI * 2, d = 110 + R() * 120; x = Math.sin(a) * d; z = Math.cos(a) * d - 20; }
    const s = 1.2 + R() * 1.1, h = 6 * s;
    put(trunk, ti * 3, x, h * .35, z, R(), s, h * .7, s, (R() - .5) * .2, (R() - .5) * .2);
    put(trunk, ti * 3 + 1, x + .8 * s, h * .72, z, 0, s * .55, h * .45, s * .55, 0, -.6);
    put(trunk, ti * 3 + 2, x - .7 * s, h * .7, z + .3, 0, s * .5, h * .4, s * .5, .2, .6);
    for (let k = 0; k < 5; k++) { const cs = (1.4 + R() * 1.2) * s; put(can, ti * 5 + k, x + (R() - .5) * 3.4 * s, h * (.82 + R() * .3), z + (R() - .5) * 3 * s, R() * 3, cs * 1.3, cs * .6, cs); can.setColorAt(ti * 5 + k, new THREE.Color(cc[(ti + k) % 4])); }
    ti++;
  }
  trunk.castShadow = can.castShadow = true; trunk.instanceMatrix.needsUpdate = can.instanceMatrix.needsUpdate = true; can.instanceColor.needsUpdate = true; g.add(trunk, can);
  // saltbush in the red dirt
  const NB = 900, bush = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), std({ color: '#FFFFFF', flatShading: true }), NB); const bc = ['#8A9A7A', '#7A8A6E', '#9AA88A'];
  for (let i = 0; i < NB; i++) { let x, z; do { const a = R() * Math.PI * 2, d = 20 + Math.pow(R(), .6) * 160; x = Math.sin(a) * d; z = Math.cos(a) * d; } while ((x > wx0 - 2 && x < 76 && z > -122 && z < 31) || (x > -40 && x < 40 && Math.abs(z - LAY.road) < 10)); const s = .3 + R() * .5; put(bush, i, x, s * .4, z, R() * 3, s * 1.3, s * .8, s * 1.2); bush.setColorAt(i, new THREE.Color(bc[i % 3])); }
  bush.instanceMatrix.needsUpdate = true; bush.instanceColor.needsUpdate = true; bush.castShadow = true; g.add(bush);
  // red flat-topped hills on the horizon
  const hm = [std({ color: '#A85A3A' }), std({ color: '#B8704A' }), std({ color: '#96503A' })];
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + R() * .2, d = 230 + R() * 90, r = 25 + R() * 40; const h = M(new THREE.CylinderGeometry(r * .7, r, 10 + R() * 16, 10), hm[i % 3], g, Math.sin(a) * d, 4, Math.cos(a) * d - 20); h.castShadow = false; h.scale.z = .6 + R() * .5; }
  // the farmhouse: weatherboard, a red corrugated hip roof, a veranda
  const hs = G(); hs.position.set(...[LAY.house[0], 0, LAY.house[1]]); hs.rotation.y = .3; g.add(hs);
  M(new THREE.BoxGeometry(9, 3, 7), std({ map: weatherboard() }), hs, 0, 1.5, 0);
  const roof = M(new THREE.ConeGeometry(7.2, 2.6, 4, 1), std({ map: corrugated('#B8423A', [8, 1]), roughness: .5, metalness: .3 }), hs, 0, 4.3, 0); roof.rotation.y = Math.PI / 4; roof.scale.set(1.0, 1, .78);
  M(new THREE.BoxGeometry(9.6, .12, 2.4), std({ map: corrugated('#9AA0A0', [8, 1]), metalness: .4, roughness: .5 }), hs, 0, 2.85, 4.6).rotation.x = .12;
  for (let k = 0; k < 5; k++) M(new THREE.CylinderGeometry(.07, .07, 2.8, 8), std({ color: '#F2EEE4' }), hs, -4.4 + k * 2.2, 1.4, 5.7);
  M(new THREE.BoxGeometry(1.1, 2.1, .1), std({ color: '#3E6A4A' }), hs, 0, 1.05, 3.52);
  for (const x of [-2.8, 2.8]) { M(new THREE.BoxGeometry(1.3, 1.1, .1), std({ color: '#2A3440', roughness: .2, metalness: .3 }), hs, x, 1.7, 3.52); M(new THREE.BoxGeometry(1.5, 1.3, .06), std({ color: '#F2EEE4' }), hs, x, 1.7, 3.5); }
  M(new THREE.BoxGeometry(.8, 2, .8), std({ color: '#A85A3A' }), hs, 2.5, 5, -1);
  // rainwater tank on a stand
  const tk = G(); tk.position.set(LAY.tank[0], 0, LAY.tank[1]); g.add(tk);
  M(new THREE.CylinderGeometry(1.4, 1.4, 2.2, 32), std({ map: corrugated('#8E9A90', [10, 4]), metalness: .4, roughness: .5 }), tk, 0, 2.3, 0);
  M(new THREE.ConeGeometry(1.5, .5, 32), std({ color: '#8E9A90', metalness: .4, roughness: .5 }), tk, 0, 3.65, 0);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) M(new THREE.BoxGeometry(.15, 1.2, .15), std({ color: '#8A6A48' }), tk, x * .9, .6, z * .9);
  // the windmill: a lattice tower, an 18-blade wheel and a tail vane
  const wmG = G(); wmG.position.set(LAY.windmill[0], 0, LAY.windmill[1]); wmG.rotation.y = -.5; g.add(wmG);
  const steel = std({ color: '#B8BCBE', metalness: .55, roughness: .4 });
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = M(new THREE.CylinderGeometry(.04, .06, 8.2, 6), steel, wmG, x * .6, 4, z * .6); l.rotation.set(-z * .07, 0, x * .07); }
  for (let k = 0; k < 6; k++) { const y = .8 + k * 1.3, w = 1.25 - k * .1; for (const s2 of [-1, 1]) { M(new THREE.BoxGeometry(w, .03, .03), steel, wmG, 0, y, s2 * w / 2); M(new THREE.BoxGeometry(.03, .03, w), steel, wmG, s2 * w / 2, y, 0); } }
  const fan = G(); fan.position.set(0, 8.5, .45); wmG.add(fan); g.userData.fan = fan;
  const bladeM = std({ color: '#D8DCDE', metalness: .5, roughness: .4, side: THREE.DoubleSide });
  for (let k = 0; k < 18; k++) { const bl = M(new THREE.PlaneGeometry(.32, 1.25), bladeM, fan, 0, 0, 0); const a = k / 18 * Math.PI * 2; bl.position.set(Math.sin(a) * .95, Math.cos(a) * .95, 0); bl.rotation.set(0, .5, -a); }
  M(new THREE.TorusGeometry(1.45, .025, 6, 40), steel, fan); M(new THREE.TorusGeometry(.5, .025, 6, 24), steel, fan);
  const vane = M(new THREE.BoxGeometry(.03, .9, 1.6), std({ color: '#D8DCDE', metalness: .4 }), wmG, 0, 8.6, -1.4); vane.castShadow = true;
  // the army camp: a ridge tent, crates, a table
  const cp = G(); cp.position.set(LAY.camp[0], 0, LAY.camp[1]); g.add(cp); g.userData.camp = cp;
  const canvas = std({ color: '#B8A878', side: THREE.DoubleSide });
  const tentG = new THREE.CylinderGeometry(1.9, 1.9, 4, 3, 1, true, 0, Math.PI * 2); const tent = M(tentG, canvas, cp, -2.0, 1.2, 3.8); tent.rotation.set(0, 0, Math.PI / 2); tent.scale.set(1, 1, .9);
  const flap = M(new THREE.CircleGeometry(1.9, 3), std({ color: '#A89868', side: THREE.DoubleSide }), cp, -.02, 1.2, 3.8); flap.rotation.set(0, Math.PI / 2, -Math.PI / 2);
  for (const x of [-4.1, .1]) M(new THREE.CylinderGeometry(.04, .04, 3.2, 6), std({ color: '#7A5A3A' }), cp, x, 1.6, 3.8);
  g.userData.tent = tent;
  return g;
}

// ---------------- hero props ----------------
const OLIVE = '#6A7040', OLIVE_D = '#4E5430';
// a 1930s army truck: bonnet, round mudguards, an open cab, a wooden tray (gun mount on the tray); front = +z
export function truck() {
  const g = G(), W = .012;
  const body = G(); g.add(body); g.userData.body = body;
  TM(new THREE.BoxGeometry(1.5, .9, 1.5), OLIVE, body, 0, 1.15, 1.75, W);              // bonnet
  TM(new THREE.BoxGeometry(1.42, .86, .08), '#2A2A28', body, 0, 1.15, 2.52, W);          // radiator
  for (let k = -6; k <= 6; k++) TM(new THREE.BoxGeometry(.04, .74, .03), '#8A8E8A', body, k * .1, 1.15, 2.57, 0);
  for (const s of [-1, 1]) { TM(new THREE.CylinderGeometry(.16, .16, .12, 20), '#D8D8D0', body, s * .62, 1.72, 2.48, W).rotation.x = Math.PI / 2; TM(new THREE.CircleGeometry(.12, 20), new THREE.MeshBasicMaterial({ color: '#FFF4C8' }), body, s * .62, 1.72, 2.55, 0); }
  // cab
  TM(new THREE.BoxGeometry(1.9, 1.0, 1.3), OLIVE_D, body, 0, 1.25, .4, W);
  TM(new THREE.BoxGeometry(1.9, .08, 1.5), OLIVE, body, 0, 2.55, .4, W);
  for (const [x, z] of [[-.9, .98], [.9, .98], [-.9, -.2], [.9, -.2]]) TM(new THREE.BoxGeometry(.07, .9, .07), OLIVE_D, body, x, 2.1, z, W);
  TM(new THREE.BoxGeometry(1.7, .5, .03), new THREE.MeshStandardMaterial({ color: '#BFD8E8', roughness: .1, metalness: .2, transparent: true, opacity: .45 }), body, 0, 2.05, 1.0, 0);
  TM(new THREE.BoxGeometry(1.9, .7, .08), OLIVE_D, body, 0, 2.15, -.24, W);
  const wheel = TM(new THREE.CylinderGeometry(.2, .2, .04, 18), '#1A1A1A', body, .3, 1.95, .75, W); wheel.rotation.x = -1.0;
  // tray with low wooden sides
  TM(new THREE.BoxGeometry(2.1, .14, 2.9), '#8A6038', body, 0, .98, -1.75, W);
  for (const s of [-1, 1]) TM(new THREE.BoxGeometry(.08, .42, 2.9), '#9A7048', body, s * 1.01, 1.26, -1.75, W);
  TM(new THREE.BoxGeometry(2.1, .42, .08), '#9A7048', body, 0, 1.26, -3.17, W);
  // chassis + mudguards
  TM(new THREE.BoxGeometry(1.2, .22, 5.2), '#2A2A26', body, 0, .72, -.2, 0);
  for (const s of [-1, 1]) {
    const mg = TM(new THREE.CylinderGeometry(.62, .62, .5, 20, 1, true, -Math.PI / 2, Math.PI), OLIVE, body, s * .9, .8, 1.75, W); mg.rotation.z = Math.PI / 2; mg.material = toon(OLIVE); mg.material.side = THREE.DoubleSide;
    TM(new THREE.BoxGeometry(.5, .06, 1.2), OLIVE_D, body, s * .95, .82, .65, W);   // running board
  }
  // wheels (spoked hubs)
  const wheels = [];
  for (const [x, z] of [[-.92, 1.75], [.92, 1.75], [-.92, -2.4], [.92, -2.4]]) {
    const wg = G(); wg.position.set(x, .5, z); g.add(wg); wheels.push(wg);
    const tyre = TM(new THREE.TorusGeometry(.38, .13, 12, 28), '#1C1A1A', wg, 0, 0, 0, W); tyre.rotation.y = Math.PI / 2;
    const hub = TM(new THREE.CylinderGeometry(.27, .27, .16, 20), '#5E6438', wg, 0, 0, 0, W); hub.rotation.z = Math.PI / 2;
    for (let k = 0; k < 6; k++) { const sp = TM(new THREE.BoxGeometry(.18, .5, .05), '#3E4228', wg, Math.sign(x) * .02, 0, 0, 0); sp.rotation.x = k / 6 * Math.PI; }
  }
  g.userData.wheels = wheels;
  const mount = G(); mount.position.set(0, 1.05, -1.6); body.add(mount); g.userData.mount = mount;
  return g;
}
// the Lewis gun: a fat cooling shroud, a flat pan magazine on top, a wooden butt, a bipod; muzzle = +z
export function lewisGun() {
  const g = G(), W = .006, gm = '#3A3D40';
  const sh = TM(new THREE.CylinderGeometry(.05, .05, .66, 20), gm, g, 0, 0, .34, W); sh.rotation.x = Math.PI / 2;
  for (let k = 0; k < 7; k++) { const r = TM(new THREE.CylinderGeometry(.056, .056, .02, 20), '#2A2C2E', g, 0, 0, .1 + k * .08, 0); r.rotation.x = Math.PI / 2; }
  const mz = TM(new THREE.CylinderGeometry(.03, .036, .14, 14), gm, g, 0, 0, .74, W); mz.rotation.x = Math.PI / 2;
  TM(new THREE.BoxGeometry(.09, .12, .36), gm, g, 0, .01, -.12, W);
  const pan = TM(new THREE.CylinderGeometry(.16, .16, .05, 28), '#4A4E52', g, 0, .1, -.08, W);
  TM(new THREE.CylinderGeometry(.04, .04, .062, 14), '#2A2C2E', pan, 0, 0, 0, 0);
  for (let k = 0; k < 12; k++) { const rb = TM(new THREE.BoxGeometry(.12, .055, .012), '#2E3134', pan, 0, 0, 0, 0); rb.rotation.y = k / 12 * Math.PI; }
  const butt = TM(new THREE.BoxGeometry(.06, .12, .38), '#8A5A30', g, 0, -.03, -.46, W); butt.rotation.x = .12;
  TM(new THREE.BoxGeometry(.04, .14, .05), '#6A4424', g, 0, -.1, -.22, W).rotation.x = .3;
  const bip = G(); bip.position.set(0, -.03, .5); g.add(bip); g.userData.bipod = bip;
  for (const s of [-1, 1]) { const l = TM(new THREE.CylinderGeometry(.01, .01, .42, 6), '#2A2C2E', bip, s * .09, -.19, 0, W * .6); l.rotation.z = s * .4; }
  const flash = new THREE.Mesh(new THREE.ConeGeometry(.12, .4, 10, 1, true), new THREE.MeshBasicMaterial({ color: '#FFD86A', transparent: true, opacity: .95, side: THREE.DoubleSide })); flash.rotation.x = -Math.PI / 2; flash.position.z = .98; flash.visible = false; g.add(flash); g.userData.flash = flash;
  return g;
}
export function crate(label = '.303 AMMO') {
  const g = G(); TM(new THREE.BoxGeometry(.8, .5, .5), '#8A6A3A', g, 0, .25, 0, .008);
  for (const y of [.06, .44]) TM(new THREE.BoxGeometry(.82, .06, .52), '#6A4E28', g, 0, y, 0, 0);
  const t = textPlane([{ text: label, size: 92, y: 120, color: '#1E1A14', weight: 700, font: 'Montserrat' }, { text: '1,000 ROUNDS', size: 60, y: 200, color: '#1E1A14', weight: 700, font: 'Montserrat' }], .7, .3, { w: 700, h: 300 });
  t.position.set(0, .25, .256); g.add(t); return g;
}
// the scoreboard: a painted board on two posts; set(emus, aus) flips the numbers in
export function scoreboard() {
  const g = G();
  for (const s of [-1, 1]) TM(new THREE.BoxGeometry(.18, 3.2, .18), '#7A5A3A', g, s * 1.75, 1.6, 0, .012);
  TM(new THREE.BoxGeometry(3.9, 2.25, .14), '#6A4A2A', g, 0, 2.2, 0, .012);
  const draw = (e, a) => [{ text: 'FINAL SCORE', size: 120, y: 150, color: '#FFD23F', weight: 900, font: 'Montserrat' },
    { text: 'EMUS', size: 150, y: 380, x: 380, color: '#FFFFFF', weight: 900, font: 'Montserrat' }, { text: e, size: 210, y: 390, x: 1080, color: '#FFFFFF', weight: 900, font: 'Montserrat' },
    { text: 'AUSTRALIA', size: 124, y: 625, x: 440, color: '#FFFFFF', weight: 900, font: 'Montserrat' }, { text: a, size: 210, y: 630, x: 1080, color: '#FFFFFF', weight: 900, font: 'Montserrat' }];
  const o = { w: 1280, h: 740, bg: '#1F3A2A', border: '#E8E0C8', bw: 22, round: 26 };
  const board = textPlane(draw('–', '–'), 3.6, 2.08, o); board.position.set(0, 2.2, .075); g.add(board);
  let key = ''; g.userData.set = (e, a) => { const k = e + a; if (k !== key) { key = k; board.userData.redraw(draw(e, a), o); } };
  return g;
}
export function binoculars() { const g = G(); for (const s of [-1, 1]) { const c = TM(new THREE.CylinderGeometry(.03, .036, .13, 14), '#2A2622', g, s * .038, 0, 0, .005); c.rotation.x = Math.PI / 2; } TM(new THREE.BoxGeometry(.05, .03, .06), '#3A3430', g, 0, 0, 0, 0); return g; }
// a 1930s broadcast mic on a stand
export function microphone() {
  const g = G(), ch = new THREE.MeshStandardMaterial({ color: '#C8CCD0', metalness: .8, roughness: .25 });
  M(new THREE.CylinderGeometry(.16, .2, .04, 24), ch, g, 0, .02, 0); M(new THREE.CylinderGeometry(.012, .012, 1.4, 8), ch, g, 0, .72, 0);
  const head = M(new THREE.TorusGeometry(.09, .018, 8, 24), ch, g, 0, 1.52, 0); M(new THREE.BoxGeometry(.11, .14, .04), new THREE.MeshStandardMaterial({ color: '#2A2A2A', roughness: .6 }), g, 0, 1.52, 0);
  return g;
}
// the farmers' letter (and its DENIED stamp)
export function letter() {
  const L = [{ text: 'Dear Army,', size: 74, y: 120, x: 260, color: '#2A2A40', weight: 600 }, { text: 'The EMUS are back!!', size: 74, y: 240, x: 380, color: '#2A2A40', weight: 600 },
    { text: 'Please send help.', size: 74, y: 350, x: 330, color: '#2A2A40', weight: 600 }, { text: '— the Farmers', size: 70, y: 470, x: 560, color: '#2A2A40', weight: 600 }];
  const o = { w: 800, h: 1000, bg: '#F4EEDC' };
  const p = textPlane(L, .42, .52, o);
  let st = -1; p.userData.stamp = k => { if (k === st) return; st = k; const c = textCanvas(L, o), g = c.getContext('2d');
    for (let y = 560; y < 960; y += 56) { g.strokeStyle = 'rgba(80,90,130,.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(60, y); g.lineTo(740, y); g.stroke(); }
    if (k) { g.save(); g.translate(400, 700); g.rotate(-.18); g.strokeStyle = '#C8283A'; g.lineWidth = 22; g.beginPath(); g.roundRect(-300, -110, 600, 220, 24); g.stroke(); g.fillStyle = '#C8283A'; g.font = '900 150px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('DENIED', 0, 10); g.restore(); }
    p.material.map.image = c; p.material.map.needsUpdate = true; };
  p.userData.stamp(0); return p;
}
export function rubberStamp() { const g = G(); TM(new THREE.CylinderGeometry(.035, .045, .12, 14), '#6A3A22', g, 0, .14, 0, .005); TM(new THREE.SphereGeometry(.05, 14, 10), '#6A3A22', g, 0, .22, 0, .005); TM(new THREE.BoxGeometry(.13, .04, .09), '#2A2A2A', g, 0, .04, 0, .005); return g; }
// the army office (interior): two-tone walls, a window on the outback, a desk, a filing cabinet, a wall map
export function office() {
  const g = G(); g.name = 'office';
  const fl = M(new THREE.PlaneGeometry(10, 10), std({ map: ctex(256, 256, (c, w, h) => { c.fillStyle = '#8A5A34'; c.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) { c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(0, y, w, 3); } }, [4, 4]), roughness: .6 }), g); fl.rotation.x = -Math.PI / 2;
  const wall = ctex(256, 256, (c, w, h) => { c.fillStyle = '#EFE6CC'; c.fillRect(0, 0, w, h); c.fillStyle = '#3E5A44'; c.fillRect(0, h * .6, w, h * .4); c.fillStyle = '#2A3A2C'; c.fillRect(0, h * .6 - 6, w, 8); });
  M(new THREE.PlaneGeometry(8, 3.2), std({ map: wall }), g, 0, 1.6, -2.2);
  const lw = M(new THREE.PlaneGeometry(6, 3.2), std({ map: wall }), g, -3, 1.6, .8); lw.rotation.y = Math.PI / 2;
  // window with the outback beyond
  M(new THREE.PlaneGeometry(1.6, 1.2), new THREE.MeshBasicMaterial({ map: ctex(256, 192, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5AA0E8'); gr.addColorStop(.6, '#CFE4F2'); gr.addColorStop(.62, '#C8803E'); gr.addColorStop(1, '#B9663C'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#7E9460'; c.beginPath(); c.arc(60, 118, 26, 0, 7); c.fill(); }) }), g, 1.6, 1.9, -2.18);
  for (const [w, h, x, y] of [[1.7, .08, 1.6, 2.5], [1.7, .08, 1.6, 1.3], [.08, 1.3, .8, 1.9], [.08, 1.3, 2.4, 1.9], [1.7, .04, 1.6, 1.9]]) M(new THREE.BoxGeometry(w, h, .06), std({ color: '#F2EEE4' }), g, x, y, -2.17);
  // a wall map of Western Australia with pins
  M(new THREE.PlaneGeometry(1.3, .95), std({ map: ctex(256, 192, (c, w, h) => { c.fillStyle = '#E8DCB8'; c.fillRect(0, 0, w, h); c.fillStyle = '#C8B07A'; c.beginPath(); c.moveTo(60, 30); c.lineTo(200, 24); c.lineTo(214, 160); c.lineTo(110, 172); c.lineTo(40, 120); c.closePath(); c.fill(); c.strokeStyle = '#6A4A2A'; c.lineWidth = 3; c.stroke(); c.fillStyle = '#C8283A'; for (const [x, y] of [[90, 120], [100, 110], [84, 104]]) { c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); } c.fillStyle = '#3A2A1A'; c.font = '700 20px Montserrat'; c.fillText('W.A.', 120, 90); }) }), g, -1.4, 2.0, -2.18);
  // desk + chair + filing cabinet
  const desk = G(); desk.position.set(0, 0, -.5); g.add(desk); g.userData.desk = desk;
  M(new THREE.BoxGeometry(1.8, .08, .9), std({ color: '#6A4426', roughness: .5 }), desk, 0, .78, 0);
  for (const x of [-.7, .7]) M(new THREE.BoxGeometry(.4, .74, .84), std({ color: '#5A3A20', roughness: .6 }), desk, x, .37, 0);
  M(new THREE.BoxGeometry(.6, .45, .03), std({ color: '#2E5A3A', roughness: .9 }), desk, 0, .82, .1).rotation.x = -Math.PI / 2;   // blotter
  M(new THREE.BoxGeometry(.55, .9, .55), std({ color: '#5E6A5A', metalness: .4, roughness: .5 }), g, -2.4, .45, -1.7);
  const lamp = G(); lamp.position.set(-.6, .82, -.2); desk.add(lamp);
  M(new THREE.CylinderGeometry(.08, .1, .03, 16), std({ color: '#2E5A3A', metalness: .5 }), lamp, 0, .015, 0); M(new THREE.CylinderGeometry(.01, .01, .4, 8), std({ color: '#C8A040', metalness: .7, roughness: .3 }), lamp, 0, .2, 0);
  M(new THREE.ConeGeometry(.12, .12, 16, 1, true), std({ color: '#2E6A4A', side: THREE.DoubleSide, metalness: .3 }), lamp, .05, .42, .05);
  const chair = G(); chair.position.set(0, 0, -1.25); g.add(chair);
  M(new THREE.BoxGeometry(.6, .08, .55), std({ color: '#5A3A20' }), chair, 0, .48, 0); M(new THREE.BoxGeometry(.6, .7, .08), std({ color: '#5A3A20' }), chair, 0, .85, -.25);
  for (const [x, z] of [[-.26, -.24], [.26, -.24], [-.26, .24], [.26, .24]]) M(new THREE.BoxGeometry(.05, .48, .05), std({ color: '#4A2E18' }), chair, x, .24, z);
  return g;
}
