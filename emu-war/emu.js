// emu.js · the emu in the v4 toon style: a shaggy cel-shaded body, a blue-grey neck, a small head with big cartoon eyes
// painted on a canvas decal, and long legs that bend backwards (two-bone IK for the run). Plus an instanced flock for the
// wide shots (thousands of birds: one merged body per bird + two swinging legs), with ink outlines that follow instancing.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TM, toon, RAMP, RAMP_SOFT, INK, G } from './toon.js';

const rng = s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
function ctex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
let FEATH = null;
export function featherTex() {
  if (FEATH) return FEATH;
  FEATH = ctex(512, 512, (g, w, h) => {
    const R = rng(4); g.fillStyle = '#5E4A3A'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3200; i++) {
      const x = R() * w, y = R() * h, l = 12 + R() * 30, c = R();
      g.strokeStyle = c < .42 ? 'rgba(38,26,18,.55)' : c < .78 ? 'rgba(128,102,78,.5)' : 'rgba(184,172,160,.32)'; g.lineWidth = 2 + R() * 3;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (R() - .5) * 8, y + l * .5, x + (R() - .5) * 10, y + l); g.stroke();
    }
  });
  FEATH.wrapS = FEATH.wrapT = THREE.RepeatWrapping; return FEATH;
}
const featherM = () => new THREE.MeshToonMaterial({ map: featherTex(), gradientMap: RAMP });

// ---------------- the face (eyes only: the beak is 3D) ----------------
// canvas 512²; centre = straight ahead. Expressions: derp (default: pupils off in two directions), normal, angry, smug,
// shock, happy, evil.
const NECK = '#7D8FA8', HEADC = '#4A3E36';
function drawEmuFace(g, f) {
  const S = 512, cx = 256, EY = 214, EX = 112;
  g.clearRect(0, 0, S, S); g.lineCap = 'round'; g.lineJoin = 'round';
  const ex = f.ex, lx = (f.look?.[0] ?? 0) * 14, ly = (f.look?.[1] ?? 0) * 12;
  for (const s of [-1, 1]) {
    const x = cx + s * EX, y = EY, closed = f.blink > .5 || (f.wink && s > 0) || ex === 'happy';
    if (closed) { g.strokeStyle = INK; g.lineWidth = 16; g.beginPath(); g.arc(x, y + 20, 50, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); continue; }
    const rx = ex === 'shock' ? 70 : 60, ry = ex === 'shock' ? 82 : 72;
    g.fillStyle = '#FFFFFF'; g.strokeStyle = INK; g.lineWidth = 12; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); g.stroke();
    let px = lx, py = ly, pr = ex === 'shock' ? 14 : 27;
    if (ex === 'derp') { px = s < 0 ? -22 : 18; py = s < 0 ? 18 : -20; pr = s < 0 ? 24 : 30; }
    g.save(); g.beginPath(); g.ellipse(x, y, rx - 6, ry - 6, 0, 0, 7); g.clip();
    g.fillStyle = INK; g.beginPath(); g.arc(x + px, y + py + 6, pr, 0, 7); g.fill();
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(x + px - pr * .35, y + py + 6 - pr * .35, pr * .3, 0, 7); g.fill();
    if (ex === 'angry' || ex === 'evil') { g.fillStyle = HEADC; g.beginPath(); g.moveTo(x - 80, y - 90); g.lineTo(x + 80, y - 90); g.lineTo(x + 80, y - 20 + s * 26); g.lineTo(x - 80, y - 20 - s * 26); g.fill(); }
    if (ex === 'smug') { g.fillStyle = HEADC; g.fillRect(x - 80, y - 90, 160, 86); }
    g.restore();
    if (ex === 'angry' || ex === 'evil') { g.strokeStyle = INK; g.lineWidth = 14; g.beginPath(); g.moveTo(x - 62, y - 20 - s * 26); g.lineTo(x + 62, y - 20 + s * 26); g.stroke(); }
    if (ex === 'smug') { g.strokeStyle = INK; g.lineWidth = 14; g.beginPath(); g.moveTo(x - 60, y - 4); g.lineTo(x + 60, y - 4); g.stroke(); }
    // lashes (they are emus: big lashes)
    if (ex !== 'angry' && ex !== 'evil' && ex !== 'smug') { g.strokeStyle = INK; g.lineWidth = 8; for (let k = -1; k <= 1; k++) { const a = -Math.PI / 2 + k * .45 + s * .25; g.beginPath(); g.moveTo(x + Math.cos(a) * rx * .95, y + Math.sin(a) * ry * .95); g.lineTo(x + Math.cos(a) * (rx + 22), y + Math.sin(a) * (ry + 22)); g.stroke(); } }
  }
  if (ex === 'smug' || ex === 'evil') { g.strokeStyle = INK; g.lineWidth = 14; g.beginPath(); g.moveTo(cx + 70, EY - 120); g.quadraticCurveTo(cx + 120, EY - 150, cx + 170, EY - 118); g.stroke(); }
}

// ---------------- the rig ----------------
// o: { seed, scale, tint }
export function makeEmu(o = {}) {
  const P = G(); P.name = 'emu';
  const root = G(); P.add(root); root.scale.setScalar(o.scale ?? 1);
  const bodyG = G(); root.add(bodyG);
  const W = .009, fm = featherM();
  const body = TM(new THREE.SphereGeometry(1, 40, 24), fm, bodyG, 0, .98, -.04, W / .3); body.scale.set(.3, .29, .44); body.rotation.x = -.18;
  // the shaggy skirt with a zig-zag hem
  const sk = new THREE.CylinderGeometry(.27, .33, .32, 36, 1, true); { const p = sk.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) p.setY(i, p.getY(i) - (i % 2 ? .075 : 0) - Math.sin(i * 1.7) * .015); sk.computeVertexNormals(); }
  const skirt = TM(sk, new THREE.MeshToonMaterial({ map: featherTex(), gradientMap: RAMP, side: THREE.DoubleSide }), bodyG, 0, .8, -.08, W); skirt.scale.set(1, 1, 1.36); skirt.rotation.x = -.18;
  const tail = TM(new THREE.ConeGeometry(.14, .26, 12), fm, bodyG, 0, .9, -.5, W); tail.rotation.x = -2.1;
  // neck: two joints, a feather ruff at the base
  const nb = G(); nb.position.set(0, 1.1, .24); bodyG.add(nb);
  TM(new THREE.SphereGeometry(.13, 20, 14), fm, nb, 0, -.02, 0, W).scale.set(1, 1.1, 1);
  const ng1 = new THREE.CapsuleGeometry(.07, .2, 6, 14); ng1.translate(0, .16, 0); TM(ng1, fm, nb, 0, 0, 0, W);
  const nm = G(); nm.position.y = .3; nb.add(nm);
  const ng2 = new THREE.CapsuleGeometry(.047, .26, 6, 14); ng2.translate(0, .17, 0); TM(ng2, NECK, nm, 0, 0, 0, W);
  const hd = G(); hd.position.y = .36; nm.add(hd);
  const HR = .088;
  const skull = TM(new THREE.SphereGeometry(HR, 32, 24), toon(HEADC, { soft: 1 }), hd, 0, 0, .01, W * .8); skull.scale.set(.95, .92, 1.08); skull.receiveShadow = false;
  // tufty crown feathers
  for (let i = 0; i < 4; i++) { const tf = TM(new THREE.ConeGeometry(.018, .07, 6), HEADC, hd, (i - 1.5) * .022, HR * .88, -.01 - i * .012, 0); tf.rotation.set(-.5 - i * .15, 0, (i - 1.5) * .3); tf.castShadow = false; }
  // the face decal
  const fc = document.createElement('canvas'); fc.width = fc.height = 512; const fctx = fc.getContext('2d'); const ftex = new THREE.CanvasTexture(fc); ftex.colorSpace = THREE.SRGBColorSpace; ftex.anisotropy = 8;
  const A = 1.25, Bt = 1.05;
  const faceM = new THREE.MeshToonMaterial({ map: ftex, gradientMap: RAMP_SOFT, transparent: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false });
  const faceMesh = new THREE.Mesh(new THREE.SphereGeometry(HR * 1.012, 40, 30, Math.PI / 2 - A, 2 * A, Math.PI / 2 - Bt, 2 * Bt), faceM); faceMesh.scale.copy(skull.scale); faceMesh.position.copy(skull.position); hd.add(faceMesh);
  let fkey = '';
  const face = { ex: o.face ?? 'derp', blink: 0, wink: 0, look: [0, 0],
    set(p) { Object.assign(face, p); const k = JSON.stringify([face.ex, face.blink > .5, face.wink ? 1 : 0, face.look.map(v => Math.round(v * 6))]); if (k !== fkey) { fkey = k; drawEmuFace(fctx, face); ftex.needsUpdate = true; } } };
  face.set({});
  // beak (upper + a hinged lower half)
  const bg = new THREE.ConeGeometry(.036, .1, 14); bg.rotateX(Math.PI / 2);
  const beak = TM(bg, '#3A3430', hd, 0, -.03, HR * 1.0, W * .5); beak.scale.set(1.45, .5, 1);
  const jaw = G(); jaw.position.set(0, -.04, HR * .7); hd.add(jaw);
  const jg = new THREE.ConeGeometry(.03, .085, 12); jg.rotateX(Math.PI / 2); jg.translate(0, 0, .04); const lowerB = TM(jg, '#2E2A28', jaw, 0, 0, 0, W * .4); lowerB.scale.set(1.35, .38, 1);
  // legs: drumstick (feathered) → the backwards "knee" (ankle) → bare scaly shank → three toes
  const L1 = .36, L2 = .4, HIPY = .72;
  const leg = s => {
    const hip = G(); hip.position.set(s * .1, HIPY, -.02); bodyG.add(hip);
    const tg = new THREE.CapsuleGeometry(.05, .26, 6, 12); tg.translate(0, -.18, 0); TM(tg, fm, hip, 0, 0, 0, W);
    const ank = G(); ank.position.y = -L1; hip.add(ank);
    TM(new THREE.SphereGeometry(.03, 12, 8), '#8E867A', ank, 0, 0, 0, W * .5);
    const sg = new THREE.CylinderGeometry(.026, .021, L2, 10); sg.translate(0, -L2 / 2, 0); TM(sg, '#8E867A', ank, 0, 0, 0, W * .55);
    const ft = G(); ft.position.y = -L2; ank.add(ft);
    for (const a of [-.42, 0, .42]) { const toe = new THREE.CapsuleGeometry(.015, .085, 4, 8); toe.rotateX(Math.PI / 2); toe.translate(0, 0, .055); const tm = TM(toe, '#8E867A', ft, 0, -.008, 0, W * .45); tm.rotation.y = a; }
    return { hip, ank, ft, s };
  };
  const legs = [leg(1), leg(-1)];
  // the slouch hat it may steal (added by the film) sits here
  const hatPin = G(); hatPin.position.set(0, HR * .72, -.01); hd.add(hatPin);
  return { P, root, bodyG, body, nb, nm, hd, jaw, legs, face, hatPin, L1, L2, HIPY };
}

// two-bone IK for one leg in the hip's y-z plane: foot target (z forward, y up) relative to the hip pivot; the ankle bends back
function ik(e, l, zt, yt, toe = 0) {
  const { L1, L2 } = e; let d = Math.hypot(zt, yt); d = Math.min(L1 + L2 - 1e-3, Math.max(Math.abs(L1 - L2) + 1e-3, d));
  const phi = Math.atan2(zt, -yt), al = Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
  const th1 = phi - al, jz = L1 * Math.sin(th1), jy = -L1 * Math.cos(th1);
  const th2 = Math.atan2(zt - jz, -(yt - jy));
  l.hip.rotation.set(-th1, 0, 0); l.ank.rotation.set(-(th2 - th1), 0, 0); l.ft.rotation.set(th2 + toe, 0, 0);
}
const _v = new THREE.Vector3(), _q = new THREE.Quaternion();
// pose: o = { t, run (0 stand … 1 sprint), ph (stride phase), peck (0…1), look (world point), face, wink, squawk (0…1), lean, seed }
export function poseEmu(e, o = {}) {
  const t = o.t ?? 0, seed = o.seed ?? 0, run = o.run ?? 0, ph = o.ph ?? 0, peck = o.peck ?? 0;
  const S = .1 + .26 * run, LIFT = .05 + .2 * run;
  const bob = run > 0 ? .045 * run * Math.abs(Math.cos(ph)) : Math.sin(t * 2.1 + seed) * .006;
  e.bodyG.position.y = bob - .03 * run; e.bodyG.rotation.x = (o.lean ?? 0) + .12 * run + .04 * peck;
  const lean = e.bodyG.rotation.x, ca = Math.cos(lean), sa = Math.sin(lean);
  e.legs.forEach((l, k) => {
    const p = ph + k * Math.PI, lift = run > 0 ? LIFT * Math.max(0, -Math.sin(p)) : 0;
    // the hip in the root frame, the foot target on the ground, then the difference back into the body frame
    const hy = e.bodyG.position.y + l.hip.position.y * ca - l.hip.position.z * sa, hz = l.hip.position.y * sa + l.hip.position.z * ca;
    const dy = .035 + lift - hy, dz = S * Math.cos(p) + .02 - hz;
    ik(e, l, dy * -sa + dz * ca, dy * ca + dz * sa, (run > 0 ? -.5 * Math.max(0, -Math.sin(p)) : 0) - lean);
  });
  // neck: up and curious / forward when running / down when pecking
  const sway = Math.sin(t * 1.6 + seed * 2) * .06;
  const nbx = .12 + .62 * run + 1.3 * peck + Math.sin(ph * 2) * .07 * run, nmx = -.3 - .3 * run + .55 * peck;
  e.nb.rotation.set(nbx, sway, 0); e.nm.rotation.set(nmx, sway * .6, 0);
  e.hd.rotation.set(-(nbx + nmx) * .85 + .25 * peck + Math.sin(t * 9 + seed) * .03 * (1 - run), Math.sin(t * .9 + seed * 3) * .15 * (1 - run), 0);
  if (o.look) {
    e.P.updateMatrixWorld(true); e.hd.getWorldPosition(_v); const d = o.look.clone().sub(_v); e.bodyG.getWorldQuaternion(_q); d.applyQuaternion(_q.invert());
    const yaw = Math.atan2(d.x, d.z), pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
    e.nb.rotation.y += Math.max(-1.2, Math.min(1.2, yaw)) * .35; e.hd.rotation.y = Math.max(-1.3, Math.min(1.3, yaw)) * .6; e.hd.rotation.x -= Math.max(-.7, Math.min(.7, pitch)) * .6;
  }
  e.jaw.rotation.x = (o.squawk ?? 0) * .55 + (peck > .5 ? Math.max(0, Math.sin(t * 22)) * .3 : 0);
  const blink = ((t + seed * .9) % 2.7) < .1 ? 1 : 0;
  e.face.set({ ex: o.face ?? e.face.ex, blink: o.wink ? 0 : blink, wink: o.wink ? 1 : 0, look: o.eyes ?? [0, 0] });
}

// ---------------- the flock (instanced) ----------------
const inkI = new Map();
export function inkMatI(w) {
  if (!inkI.has(w)) inkI.set(w, new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { w: { value: w } },
    vertexShader: 'uniform float w; void main(){ vec4 p = vec4(position + normal * w, 1.); \n#ifdef USE_INSTANCING\n p = instanceMatrix * p; \n#endif\n gl_Position = projectionMatrix * modelViewMatrix * p; }',
    fragmentShader: 'void main(){ gl_FragColor = vec4(.078, .063, .086, 1.); }' }));
  return inkI.get(w);
}
function colored(geo, hex) { const c = new THREE.Color(hex), n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); geo.deleteAttribute('uv'); return geo; }
function flockGeo(pose) {
  const parts = [], M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const add = (g, hex, pos, rot = [0, 0, 0], sc = [1, 1, 1]) => { g = g.toNonIndexed ? g : g; g.applyMatrix4(M4.compose(new THREE.Vector3(...pos), q.setFromEuler(e.set(...rot)), new THREE.Vector3(...sc))); parts.push(colored(g.index ? g.toNonIndexed() : g, hex)); };
  add(new THREE.SphereGeometry(1, 18, 12), '#5E4A3A', [0, .98, -.04], [-.18, 0, 0], [.3, .29, .44]);
  add(new THREE.ConeGeometry(.33, .32, 14, 1, true), '#4E3C2E', [0, .8, -.08], [-.18, 0, 0], [1, 1, 1.36]);
  // neck + head in the two poses
  const up = pose === 'up';
  const n0 = new THREE.Vector3(0, 1.1, .24), n1 = up ? new THREE.Vector3(0, 1.42, .34) : new THREE.Vector3(0, .95, .62), n2 = up ? new THREE.Vector3(0, 1.74, .36) : new THREE.Vector3(0, .58, .72);
  const seg = (a, b, r, hex) => { const d = b.clone().sub(a), L = d.length(); const g = new THREE.CapsuleGeometry(r, L, 4, 10); const qq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); g.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(.5), qq, new THREE.Vector3(1, 1, 1))); parts.push(colored(g.toNonIndexed(), hex)); };
  seg(n0, n1, .07, '#5E4A3A'); seg(n1, n2, .047, NECK);
  const hp = n2.clone().add(new THREE.Vector3(0, up ? .06 : -.02, up ? .02 : .06)), fw = up ? 0 : .9;
  add(new THREE.SphereGeometry(.088, 14, 10), HEADC, [hp.x, hp.y, hp.z], [fw, 0, 0], [.95, .92, 1.08]);
  add(new THREE.ConeGeometry(.036, .1, 10), '#3A3430', [hp.x, hp.y - .03 * Math.cos(fw) - .09 * Math.sin(fw), hp.z + .09 * Math.cos(fw) - .03 * Math.sin(fw)], [Math.PI / 2 + fw, 0, 0], [1.45, 1, .5]);
  for (const s of [-1, 1]) {   // big googly eyes
    const ep = [hp.x + s * .045, hp.y + .025 * Math.cos(fw) - .06 * Math.sin(fw), hp.z + .06 * Math.cos(fw) + .02 * Math.sin(fw)];
    add(new THREE.SphereGeometry(.034, 10, 8), '#FFFFFF', ep, [0, 0, 0], [1, 1.15, .7]);
    add(new THREE.SphereGeometry(.015, 8, 6), '#141016', [ep[0] + s * .004, ep[1] - .002, ep[2] + .022], [0, 0, 0], [1, 1, .6]);
  }
  return mergeGeometries(parts.map(g => { for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k); return g; }));
}
// n birds; f.set(i, {x, z, yaw, ph, run, peck, s, y}) then f.commit()
export function emuFlock(n) {
  const g = G(); g.name = 'flock';
  const mat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: RAMP });
  const mk = pose => { const geo = flockGeo(pose), im = new THREE.InstancedMesh(geo, mat, n), ik_ = new THREE.InstancedMesh(geo, inkMatI(.012), n); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = ik_.frustumCulled = false; ik_.castShadow = false; g.add(im, ik_); return [im, ik_]; };
  const [upM, upI] = mk('up'), [pkM, pkI] = mk('peck');
  const lg = new THREE.CylinderGeometry(.026, .02, .74, 6); lg.translate(0, -.37, 0);
  const legM = new THREE.InstancedMesh(lg, toon('#8E867A'), n * 2); legM.castShadow = true; legM.frustumCulled = false; g.add(legM);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), Vp = new THREE.Vector3(), Vs = new THREE.Vector3(), Z = new THREE.Matrix4().makeScale(0, 0, 0);
  const base = new THREE.Matrix4(), leg = new THREE.Matrix4(), off = new THREE.Matrix4();
  let cR = rng(71); const col = new THREE.Color();
  for (let i = 0; i < n; i++) { const k = .82 + cR() * .3; col.setRGB(k, k * (.96 + cR() * .06), k * (.92 + cR() * .1)); upM.setColorAt(i, col); pkM.setColorAt(i, col); }
  const f = {
    g, n,
    set(i, o) {
      const s = o.s ?? 1, run = o.run ?? 0, ph = o.ph ?? 0, bob = run ? .05 * run * Math.abs(Math.cos(ph)) : 0;
      base.compose(Vp.set(o.x, (o.y ?? 0) + bob, o.z), Q.setFromEuler(E.set(.14 * run, o.yaw ?? 0, 0)), Vs.set(s, s, s));
      const pk = (o.peck ?? 0) > .5;
      (pk ? pkM : upM).setMatrixAt(i, base); (pk ? pkI : upI).setMatrixAt(i, base); (pk ? upM : pkM).setMatrixAt(i, Z); (pk ? upI : pkI).setMatrixAt(i, Z);
      for (const k of [0, 1]) {
        const p = ph + k * Math.PI, sw = run ? Math.cos(p) * .55 * run : 0;
        off.compose(Vp.set((k ? -.1 : .1), .76, -.02), Q.setFromEuler(E.set(-sw - .05, 0, 0)), Vs.set(1, 1 - (run ? .12 * Math.max(0, -Math.sin(p)) : 0), 1));
        leg.multiplyMatrices(base, off); legM.setMatrixAt(i * 2 + k, leg);
      }
    },
    hide(i) { for (const m of [upM, upI, pkM, pkI]) m.setMatrixAt(i, Z); legM.setMatrixAt(i * 2, Z); legM.setMatrixAt(i * 2 + 1, Z); },
    commit() { for (const m of [upM, upI, pkM, pkI, legM]) m.instanceMatrix.needsUpdate = true; upM.instanceColor.needsUpdate = pkM.instanceColor.needsUpdate = true; },
  };
  for (let i = 0; i < n; i++) f.hide(i); f.commit();
  return f;
}
