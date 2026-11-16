// head.js · one sculpted head per character: a single mesh carrying skull, brow ridge, eye sockets, cheekbones,
// nose (bridge, rounded tip, wings), jaw, chin, and the volume of the hair, moustache and beard. The face is painted on an
// equirectangular canvas laid on the same mesh, and the shapes that paint the hair and moustache also raise the surface
// (a height map), so paint and sculpt always line up. Eyes, lids, brows and mouth are redrawn when the expression changes.
import * as THREE from 'three';
import { mat, G, M, sph, cyl, tor } from './kit.js';

const PI = Math.PI, TAU = PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const gs = (x, s) => Math.exp(-(x * x) / (2 * s * s));
const lerp = (a, b, u) => a + (b - a) * u;
const warp = (s, c) => s * c + (1 - c) * s * s * s;            // denser sampling around 0 (the face)
const lut = (T, x) => { if (x <= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (x <= T[i][0]) { const [x0, y0] = T[i - 1], [x1, y1] = T[i]; return lerp(y0, y1, (x - x0) / (x1 - x0)); } return T[T.length - 1][1]; };
const rnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;

// landmarks in radians: a = azimuth (0 = front, + toward the head's +x), e = elevation (0 = eye line-ish, + up)
export const LM = { eyeA: .37, eyeE: .05, browE: .235, mouthE: -.47, earA: 1.5, earE: -.06 };
const HAIRLINE = [[0, .62], [.5, .59], [.92, .48], [1.18, .38], [1.42, .28], [1.62, .24], [1.85, .12], [2.15, -.12], [2.6, -.38], [PI, -.47]];
const FRINGE_T = [[1.22, .02], [1.4, .24], [1.8, .3], [2.4, .27], [PI, .25]], FRINGE_B = [[1.22, -.02], [1.6, -.16], [2.2, -.34], [PI, -.44]];

export function makeHead(L, o = {}) {
  const R = o.R ?? .1, P = { w: .87, jaw: .06, nose: .17, noseW: 1, bulb: 0, chin: .035, cheek: .025, jowl: 0, brow: .03, lift: 0, ...(L.sculpt || {}) };
  const TW = o.tex ?? 2048, TH = TW / 2, k = TW / TAU;
  const X = a => TW / 2 + a * k, Y = e => (PI / 2 - e) * k;
  const style = L.hairStyle ?? 'short', sc = k / 256;   // sc: the expression tables were tuned at 256 px per radian
  const group = G();

  // ---------- shapes shared by the paint and the height map ----------
  const hairShape = g => {
    g.beginPath();
    if (style === 'bald') {
      for (const s of [-1, 1]) {
        g.moveTo(X(s * 1.22), Y(0));
        for (let a = 1.22; a <= PI + .001; a += .02) g.lineTo(X(s * a), Y(lut(FRINGE_T, a)));
        for (let a = PI; a >= 1.22; a -= .02) g.lineTo(X(s * a), Y(lut(FRINGE_B, a)));
        g.closePath();
      }
      return;
    }
    const drop = style === 'slick' ? 0 : .02, r = rnd(7);
    g.moveTo(X(-PI), 0);
    for (let a = -PI; a <= PI + .001; a += .015) {
      const x = Math.abs(a); let e = lut(HAIRLINE, x) - drop;
      if (style === 'slick' && x < 1.0) e += .015 * gs(a + .35, .12);   // a side part dips the hairline
      g.lineTo(X(a), Y(e));
    }
    g.lineTo(X(PI), 0); g.closePath();
    for (const s of [-1, 1]) {            // sideburns
      const a0 = s * 1.1, a1 = s * 1.42, eb = L.moustache === 'curl' ? -.06 : -.02;
      g.moveTo(X(a0), Y(.4)); g.lineTo(X(a1), Y(.32)); g.lineTo(X(a1), Y(eb + .03)); g.quadraticCurveTo(X(s * 1.28), Y(eb - .02), X(s * 1.2), Y(eb + .02)); g.quadraticCurveTo(X(s * 1.12), Y(.12), X(a0), Y(.4)); g.closePath();
    }
  };
  const stacheShape = g => {
    const m = L.moustache;
    if (m === 'curl') {
      for (const s of [-1, 1]) {
        g.beginPath(); g.moveTo(X(s * .015), Y(-.322));
        g.bezierCurveTo(X(s * .1), Y(-.31), X(s * .19), Y(-.37), X(s * .25), Y(-.35));
        g.bezierCurveTo(X(s * .3), Y(-.33), X(s * .3), Y(-.27), X(s * .25), Y(-.275));
        g.lineWidth = .028 * k; g.stroke();
        g.beginPath(); g.moveTo(X(s * .015), Y(-.305)); g.bezierCurveTo(X(s * .08), Y(-.3), X(s * .14), Y(-.33), X(s * .18), Y(-.345)); g.lineTo(X(s * .14), Y(-.355)); g.bezierCurveTo(X(s * .09), Y(-.345), X(s * .05), Y(-.345), X(s * .01), Y(-.345)); g.closePath(); g.fill();
      }
    } else if (m === 'walrus') {
      g.beginPath(); g.moveTo(X(0), Y(-.29));
      g.bezierCurveTo(X(.12), Y(-.26), X(.26), Y(-.3), X(.3), Y(-.43)); g.bezierCurveTo(X(.32), Y(-.5), X(.26), Y(-.53), X(.22), Y(-.47));
      g.bezierCurveTo(X(.15), Y(-.43), X(.06), Y(-.42), X(0), Y(-.425));
      g.bezierCurveTo(X(-.06), Y(-.42), X(-.15), Y(-.43), X(-.22), Y(-.47)); g.bezierCurveTo(X(-.26), Y(-.53), X(-.32), Y(-.5), X(-.3), Y(-.43));
      g.bezierCurveTo(X(-.26), Y(-.3), X(-.12), Y(-.26), X(0), Y(-.29)); g.closePath(); g.fill();
    } else if (m === 'brush') {
      g.beginPath(); g.moveTo(X(-.25), Y(-.45)); g.bezierCurveTo(X(-.22), Y(-.33), X(-.12), Y(-.29), X(0), Y(-.3)); g.bezierCurveTo(X(.12), Y(-.29), X(.22), Y(-.33), X(.25), Y(-.45));
      g.bezierCurveTo(X(.18), Y(-.4), X(.08), Y(-.39), X(0), Y(-.395)); g.bezierCurveTo(X(-.08), Y(-.39), X(-.18), Y(-.4), X(-.25), Y(-.45)); g.closePath(); g.fill();
    }
    if (L.beard) {
      g.beginPath(); g.moveTo(X(-1.3), Y(-.05));
      g.bezierCurveTo(X(-1.1), Y(-.2), X(-.9), Y(-.3), X(-.55), Y(-.38)); g.bezierCurveTo(X(-.3), Y(-.43), X(-.28), Y(-.62), X(0), Y(-.62)); g.bezierCurveTo(X(.28), Y(-.62), X(.3), Y(-.43), X(.55), Y(-.38));
      g.bezierCurveTo(X(.9), Y(-.3), X(1.1), Y(-.2), X(1.3), Y(-.05)); g.lineTo(X(1.3), Y(-1.2)); g.lineTo(X(-1.3), Y(-1.2)); g.closePath(); g.fill();
    }
  };

  // ---------- height map: hair and moustache volume ----------
  const HW = 1024, HHt = 512, hk = HW / TW;
  const hc = document.createElement('canvas'); hc.width = HW; hc.height = HHt;
  const hg = hc.getContext('2d');
  const blurInto = (draw, px) => { const c = document.createElement('canvas'); c.width = HW; c.height = HHt; const g = c.getContext('2d'); g.fillStyle = g.strokeStyle = '#fff'; g.lineCap = 'round'; g.scale(hk, hk); draw(g); hg.filter = `blur(${px}px)`; hg.drawImage(c, 0, 0); hg.filter = 'none'; };
  const sample = (img, u, v) => { const x = clamp(u * HW - .5, 0, HW - 1.001), y = clamp(v * HHt - .5, 0, HHt - 1.001), x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, d = img.data, at = (i, j) => d[(j * HW + i) * 4] / 255;
    return lerp(lerp(at(x0, y0), at(x0 + 1, y0), fx), lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), fx), fy); };
  hg.fillStyle = '#000'; hg.fillRect(0, 0, HW, HHt); blurInto(hairShape, 3); const hairImg = hg.getImageData(0, 0, HW, HHt);
  hg.fillStyle = '#000'; hg.fillRect(0, 0, HW, HHt); blurInto(stacheShape, 2); const stImg = hg.getImageData(0, 0, HW, HHt);

  // ---------- the sculpt ----------
  const nose = (a, e) => {
    const top = .17, base = -.28, t = (top - e) / (top - base); if (t < -.3 || t > 1.3) return 0;
    const tipT = .8, h = t < tipT ? lerp(.05, 1, Math.pow(sstep(-.1, tipT, t), 1.7)) * sstep(-.3, .05, t) : 1 - sstep(tipT, 1.1, t);
    const w = lerp(.05, .078, sstep(0, tipT, t)) * P.noseW;
    let n = P.nose * h * gs(a, w);
    n += P.nose * .38 * (gs(a - .088 * P.noseW, .042) + gs(a + .088 * P.noseW, .042)) * gs(e - (base + .05), .04);   // wings
    n += P.bulb * gs(a, .07 * P.noseW) * gs(e + .19, .06);
    return n;
  };
  const shape = (a, e, u, v, out) => {
    const ce = Math.cos(e), x = Math.sin(a) * ce, y = Math.sin(e), z = Math.cos(a) * ce;
    let r = 1;
    r += P.brow * gs(e - .25, .07) * gs(a, .5);                                         // brow ridge
    r -= .028 * (gs(a - LM.eyeA, .12) + gs(a + LM.eyeA, .12)) * gs(e - .06, .085);     // eye sockets
    r += P.cheek * (gs(a - .6, .2) + gs(a + .6, .2)) * gs(e + .2, .14);               // cheekbones
    r += P.jowl * (gs(a - .7, .26) + gs(a + .7, .26)) * gs(e + .56, .17);             // jowls
    r += .022 * gs(a, .2) * gs(e + .47, .07);                                          // lips
    r += P.chin * gs(a, .22) * gs(e + .82, .1);                                         // chin
    r += nose(a, e);
    const hair = sample(hairImg, u, v), st = sample(stImg, u, v);
    r += hair * (style === 'bald' ? .035 : style === 'slick' ? .032 + .03 * sstep(.4, 1.3, e) : .045 + .035 * sstep(.4, 1.3, e));
    r += st * (L.moustache === 'walrus' ? .04 : L.beard ? .045 : .016);
    let px = x * r, py = y * r, pz = z * r;
    px *= P.w; py *= 1.07; pz *= .98;
    const low = sstep(-.05, -1, y), back = sstep(0, -.7, z);
    px *= 1 - (.24 - P.jaw) * low;                                                       // jaw taper
    pz *= 1 + .1 * back * sstep(-.5, .3, y) - .16 * back * low;                         // fuller cranium, tucked nape
    py -= .045 * low * gs(a, .9);                                                         // a longer lower face
    py += P.lift * sstep(.2, 1, y);
    out.set(px * R, py * R, pz * R); return out;
  };
  const NA = o.na ?? 168, NE = o.ne ?? 124, pos = new Float32Array((NA + 1) * (NE + 1) * 3), uvs = new Float32Array((NA + 1) * (NE + 1) * 2), idx = [];
  const tmp = new THREE.Vector3();
  for (let j = 0; j <= NE; j++) {
    const e = -warp(-1 + 2 * j / NE, .5) * PI / 2;
    for (let i = 0; i <= NA; i++) {
      const a = warp(-1 + 2 * i / NA, .36) * PI, u = .5 + a / TAU, v = .5 - e / PI, n = j * (NA + 1) + i;
      shape(a, e, u, v, tmp); pos.set([tmp.x, tmp.y, tmp.z], n * 3); uvs.set([u, 1 - v], n * 2);
    }
  }
  for (let j = 0; j < NE; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + NA + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  { const nr = geo.attributes.normal.array, v3 = new THREE.Vector3();   // weld the back seam and the poles
    for (let j = 0; j <= NE; j++) { const a = j * (NA + 1), b = a + NA; v3.set(nr[a * 3] + nr[b * 3], nr[a * 3 + 1] + nr[b * 3 + 1], nr[a * 3 + 2] + nr[b * 3 + 2]).normalize(); nr.set([v3.x, v3.y, v3.z], a * 3); nr.set([v3.x, v3.y, v3.z], b * 3); }
    for (let i = 0; i <= NA; i++) { nr.set([0, 1, 0], i * 3); nr.set([0, -1, 0], (NE * (NA + 1) + i) * 3); } }
  const surf = (a, e, lift = 0) => { const v = new THREE.Vector3(); shape(a, e, .5 + a / TAU, .5 - e / PI, v); return v.multiplyScalar(1 + lift); };

  // ---------- paint ----------
  const FC = document.createElement('canvas'); FC.width = TW; FC.height = TH;
  const under = document.createElement('canvas'); under.width = TW; under.height = TH;
  const over = document.createElement('canvas'); over.width = TW; over.height = TH;
  const skin = L.skin, hair = L.hair, hairD = shade(hair, -.35), hairL = shade(hair, .35);
  { const g = under.getContext('2d'); g.lineCap = g.lineJoin = 'round';
    g.fillStyle = skin; g.fillRect(0, 0, TW, TH);
    const rad = (x, y, r, col) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
    for (const s of [-1, 1]) rad(X(s * .58), Y(-.24), .2 * k, 'rgba(226,112,100,.26)');               // cheeks
    rad(X(0), Y(-.16), .1 * k, 'rgba(226,112,100,.14)');                                                // nose tip warmth
    for (const s of [-1, 1]) rad(X(s * LM.eyeA), Y(-.07), .11 * k, 'rgba(120,70,80,.10)');             // under-eye
    if (L.age) for (const s of [-1, 1]) { g.strokeStyle = 'rgba(140,70,60,.25)'; g.lineWidth = .012 * k; g.beginPath(); g.moveTo(X(s * .13), Y(-.27)); g.quadraticCurveTo(X(s * .24), Y(-.36), X(s * .25), Y(-.5)); g.stroke(); }
    rad(X(0), Y(-.82), .16 * k, 'rgba(255,240,230,.10)');                                               // chin highlight
    if (L.stubble) { g.fillStyle = 'rgba(60,45,40,.10)'; g.beginPath(); g.ellipse(X(0), Y(-.62), .55 * k, .3 * k, 0, 0, TAU); g.fill(); }
    // nostrils (seen on the underside of the nose)
    for (const s of [-1, 1]) { g.fillStyle = 'rgba(80,32,30,.75)'; g.beginPath(); g.ellipse(X(s * .052 * P.noseW), Y(-.262), .022 * k * P.noseW, .011 * k, s * .3, 0, TAU); g.fill(); }
    // hair
    if (style !== 'none') {
      g.save(); g.fillStyle = hair; hairShape(g); g.fill(); g.clip();
      const r = rnd(11); g.lineWidth = .008 * k;
      for (let n = 0; n < 1400; n++) {
        const a = (r() * 2 - 1) * PI, e = r() * 1.9 - .55, x = Math.abs(a), side = x > 1.0 ? Math.sign(a) : 0, len = (.05 + r() * .12);
        const da = side ? side * len : (r() - .5) * .04, de = side ? -.25 * len : len;
        g.strokeStyle = r() < .5 ? hairD + '55' : hairL + (style === 'slick' ? '66' : '33');
        g.beginPath(); g.moveTo(X(a), Y(e)); g.quadraticCurveTo(X(a + da * .5 + (r() - .5) * .02), Y(e + de * .5), X(a + da), Y(e + de)); g.stroke();
      }
      if (style === 'slick') { g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = .01 * k; g.beginPath(); g.moveTo(X(-.35), Y(.6)); g.lineTo(X(-.4), Y(1.4)); g.stroke(); }
      g.restore();
    }
  }
  { const g = over.getContext('2d'); g.lineCap = g.lineJoin = 'round';
    g.fillStyle = g.strokeStyle = hair; stacheShape(g);
    if (L.moustache || L.beard) {          // fine strands over the moustache / beard
      g.save(); g.globalCompositeOperation = 'source-atop'; const r = rnd(5); g.lineWidth = .006 * k;
      for (let n = 0; n < 700; n++) { const a = (r() * 2 - 1) * 1.3, e = -.25 - r() * .9; g.strokeStyle = r() < .5 ? hairD + '77' : hairL + '44'; g.beginPath(); g.moveTo(X(a), Y(e)); g.lineTo(X(a + Math.sign(a) * .03), Y(e - .06)); g.stroke(); }
      g.restore();
    }
  }
  const ftex = new THREE.CanvasTexture(FC); ftex.colorSpace = THREE.SRGBColorSpace; ftex.anisotropy = 8;
  // roughness: glossy slick hair, satin skin
  const rc = document.createElement('canvas'); rc.width = 512; rc.height = 256; { const g = rc.getContext('2d'); g.fillStyle = 'rgb(0,135,0)'; g.fillRect(0, 0, 512, 256); g.scale(512 / TW, 512 / TW); g.fillStyle = style === 'slick' ? 'rgb(0,80,0)' : 'rgb(0,225,0)'; hairShape(g); g.fill(); g.fillStyle = 'rgb(0,230,0)'; stacheShape(g); }
  const rtex = new THREE.CanvasTexture(rc);
  const headM = new THREE.MeshStandardMaterial({ map: ftex, roughnessMap: rtex, roughness: 1, metalness: 0 });
  const mesh = M(geo, headM, group);

  // ---------- ears ----------
  const skinM = mat(skin, { r: .5 }), skinD = mat(shade(skin, -.18), { r: .6 });
  for (const s of [-1, 1]) {
    const p = surf(s * LM.earA, LM.earE), ear = G(); ear.position.copy(p).multiplyScalar(.97); ear.rotation.set(-.12, s * .28, 0); group.add(ear);
    M(sph(R * .23, 18, 14), skinM, ear, 0, 0, 0).scale.set(.34, 1, .62);
    const rim = M(tor(R * .19, R * .045, 8, 20, PI * 1.25), skinM, ear, s * R * .03, 0, -R * .01); rim.rotation.set(0, s * PI / 2, PI * .1); rim.scale.set(1, 1.12, 1);
    M(sph(R * .085, 12, 10), skinD, ear, s * R * .05, -R * .02, R * .01).scale.set(.5, 1, .8);
  }

  // ---------- glasses ----------
  if (L.glasses) {
    const gm = mat('#2A2420', { r: .3, m: .6 }), lm = new THREE.MeshStandardMaterial({ color: '#DDEEFF', transparent: true, opacity: .14, roughness: .05 });
    const eyeP = [-1, 1].map(s => surf(s * LM.eyeA, LM.eyeE)), br = surf(0, .08);
    for (const [i, s] of [[0, -1], [1, 1]]) {
      const p = eyeP[i], ring = G(); ring.position.set(p.x, p.y, p.z + R * .2); ring.rotation.y = s * .32; group.add(ring);
      M(tor(R * .29, R * .028, 8, 32), gm, ring); M(new THREE.CircleGeometry(R * .29, 24), lm, ring);
      const t0 = new THREE.Vector3(s * (Math.abs(p.x) + R * .27), p.y + R * .02, p.z + R * .1), t1 = surf(s * 1.42, LM.earE + .12, .03);
      const len = t0.distanceTo(t1), tm = M(cyl(R * .022, R * .022, len, 6), gm, group); tm.position.copy(t0).add(t1).multiplyScalar(.5); tm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), t1.clone().sub(t0).normalize());
    }
    const bridge = M(tor(R * .07, R * .022, 6, 12, PI), gm, group, 0, eyeP[0].y + R * .04, br.z + R * .1);
  }

  // ---------- face redraw ----------
  let lastKey = '';
  const drawFace = st => {
    const key = Object.values(st).map(v => typeof v === 'number' ? v.toFixed(2) : v).join('|'); if (key === lastKey) return; lastKey = key;
    const g = FC.getContext('2d'); g.drawImage(under, 0, 0); g.lineCap = g.lineJoin = 'round';
    if (st.blush > 0) for (const s of [-1, 1]) { const x = X(s * .55), y = Y(-.2), r = .26 * k, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(230,60,70,${.55 * st.blush})`); gr.addColorStop(1, 'rgba(230,60,70,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    // eyes
    for (const s of [-1, 1]) {
      const cx = X(s * LM.eyeA), cy = Y(LM.eyeE), ew = .15 * k, eh = .1 * k, open = Math.max(.03, 1 - Math.max(st.blink, s < 0 ? st.wink ?? 0 : 0)), lid = clamp(st.lid);
      const ix0 = cx - s * ew, iy0 = cy + .012 * k, ox = cx + s * ew, oy = cy - .012 * k;          // inner / outer corners
      const topY = f => cy - eh * 1.45 * open * f;
      const lidPath = f => { g.moveTo(ix0, iy0); g.bezierCurveTo(cx - s * ew * .45, topY(f), cx + s * ew * .45, topY(f) + .004 * k, ox, oy); };
      g.save(); g.beginPath(); lidPath(1); g.bezierCurveTo(cx + s * ew * .4, cy + eh * .85, cx - s * ew * .45, cy + eh * .9, ix0, iy0); g.closePath();
      g.fillStyle = '#F7F3EA'; g.fill(); g.clip();
      const ix = cx + st.lx * .055 * k, iy = cy - .006 * k + st.ly * .03 * k, ir = .074 * k;
      const ig = g.createRadialGradient(ix, iy, ir * .2, ix, iy, ir); ig.addColorStop(0, shade(L.iris, .35)); ig.addColorStop(.75, L.iris); ig.addColorStop(1, shade(L.iris, -.45));
      g.fillStyle = ig; g.beginPath(); g.arc(ix, iy, ir, 0, TAU); g.fill();
      g.fillStyle = '#100A08'; g.beginPath(); g.arc(ix, iy, ir * .44, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.arc(ix + ir * .35, iy - ir * .38, ir * .22, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(ix - ir * .3, iy + ir * .35, ir * .1, 0, TAU); g.fill();
      // lid shadow on the eyeball, then the lid itself coming down
      const sh = g.createLinearGradient(0, topY(1), 0, topY(1) + eh * .9); sh.addColorStop(0, 'rgba(60,30,20,.35)'); sh.addColorStop(1, 'rgba(60,30,20,0)'); g.fillStyle = sh; g.fillRect(cx - ew * 1.2, topY(1) - 5, ew * 2.4, eh * 1.2);
      const lf = 1 - lid * .85; g.fillStyle = skin; g.beginPath(); g.moveTo(ix0, cy - eh * 2); g.lineTo(ox, cy - eh * 2); g.lineTo(ox, oy); g.bezierCurveTo(cx + s * ew * .45, topY(lf) + .004 * k, cx - s * ew * .45, topY(lf), ix0, iy0); g.closePath(); g.fill();
      g.restore();
      // lash line (heavier toward the outer corner), crease and lower lid
      const lf2 = 1 - lid * .85;
      g.strokeStyle = '#24160F'; g.lineWidth = .02 * k; g.beginPath(); g.moveTo(ix0, iy0); g.bezierCurveTo(cx - s * ew * .45, topY(lf2), cx + s * ew * .45, topY(lf2) + .004 * k, ox, oy); g.stroke();
      g.lineWidth = .028 * k; g.beginPath(); g.moveTo(cx + s * ew * .3, topY(lf2) + .01 * k); g.quadraticCurveTo(cx + s * ew * .8, topY(lf2) + .02 * k, ox + s * .012 * k, oy - .004 * k); g.stroke();
      if (open > .3) { g.strokeStyle = 'rgba(110,60,45,.35)'; g.lineWidth = .009 * k; g.beginPath(); g.moveTo(ix0 + s * .02 * k, iy0 - .02 * k); g.bezierCurveTo(cx - s * ew * .4, topY(1) - .035 * k, cx + s * ew * .4, topY(1) - .03 * k, ox + s * .01 * k, oy - .025 * k); g.stroke(); }
      g.strokeStyle = 'rgba(120,60,50,.4)'; g.lineWidth = .008 * k; g.beginPath(); g.moveTo(ix0 + s * .02 * k, iy0 + .004 * k); g.bezierCurveTo(cx - s * ew * .35, cy + eh * .95, cx + s * ew * .4, cy + eh * .9, ox - s * .015 * k, oy + .01 * k); g.stroke();
      // brow: a tapered shape, thick at the inner end
      const by = Y(LM.browE) + st.browY * sc, inX = cx - s * .2 * k, outX = cx + s * .2 * k;
      const inY = by + (st.inner * .55 + st.brow * .25) * sc, outY = by + .01 * k - st.brow * .15 * sc, midY = by - .035 * k + st.brow * .3 * sc;
      g.fillStyle = L.brows ?? shade(hair === '#B8B0A6' ? '#8A827A' : hair, -.1);
      g.beginPath(); g.moveTo(inX, inY - .038 * k); g.quadraticCurveTo(cx - s * .02 * k, midY - .03 * k, outX, outY - .006 * k); g.quadraticCurveTo(outX + s * .015 * k, outY + .004 * k, outX - s * .01 * k, outY + .01 * k);
      g.quadraticCurveTo(cx - s * .02 * k, midY + .014 * k, inX, inY + .016 * k); g.closePath(); g.fill();
    }
    // mouth
    const mx = X(0), my = Y(LM.mouthE), sm = st.smile, op = st.open, mw = (.17 + sm * .02) * k, cu = sm * .028 * k;
    const lipC = L.lips ?? '#B65A52';
    if (op < .1) {
      g.fillStyle = shade(lipC, .15) + 'AA'; g.beginPath(); g.moveTo(mx - mw * .7, my + .008 * k); g.quadraticCurveTo(mx, my + .06 * k + cu * .3, mx + mw * .7, my + .008 * k); g.quadraticCurveTo(mx, my + .02 * k, mx - mw * .7, my + .008 * k); g.fill();
      g.strokeStyle = '#6E2A2A'; g.lineWidth = .016 * k; g.beginPath(); g.moveTo(mx - mw, my - cu); g.bezierCurveTo(mx - mw * .4, my + cu * .6, mx + mw * .4, my + cu * .6, mx + mw, my - cu); g.stroke();
      for (const s of [-1, 1]) { g.lineWidth = .008 * k; g.beginPath(); g.moveTo(mx + s * mw * .92, my - cu - .012 * k); g.quadraticCurveTo(mx + s * (mw + .012 * k), my - cu, mx + s * mw * .95, my - cu + .012 * k); g.stroke(); }
    } else {
      const h = (.03 + op * .14) * k;
      const path = () => { g.beginPath(); g.moveTo(mx - mw, my - cu); g.bezierCurveTo(mx - mw * .5, my - .03 * k + cu * .3, mx + mw * .5, my - .03 * k + cu * .3, mx + mw, my - cu); g.bezierCurveTo(mx + mw * .6, my + h + cu * .4, mx - mw * .6, my + h + cu * .4, mx - mw, my - cu); g.closePath(); };
      g.save(); path(); g.fillStyle = '#3A0E10'; g.fill(); g.clip();
      g.fillStyle = '#F4EFE4'; g.fillRect(mx - mw, my - .05 * k, mw * 2, .045 * k + h * .12);
      g.fillStyle = '#C04A55'; g.beginPath(); g.ellipse(mx, my + h, mw * .55, .05 * k, 0, 0, TAU); g.fill(); g.restore();
      g.strokeStyle = lipC; g.lineWidth = .014 * k; path(); g.stroke();
    }
    g.drawImage(over, 0, 0);
    ftex.needsUpdate = true;
  };

  // hat seat: the height above the head origin where a hat band rests, and the crown top
  const seat = surf(0, .5).y, top = surf(0, PI / 2 - .001).y;
  return { group, mesh, drawFace, R, seat, top, surf, P };
}

// lighten (+) or darken (−) a hex colour
export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)));
  return '#' + c.map(v => clamp(v, 0, 255).toString(16).padStart(2, '0')).join('');
}
