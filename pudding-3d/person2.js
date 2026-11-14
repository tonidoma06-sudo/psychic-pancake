// person2.js · the improved cast rig: a sculpted (lathe) body, 1920s tailoring (jacket with lapels, shirt, tie, buttons,
// trousers, shoes), jointed fingers, and a face with coloured irises, upper lids with lashes, arched brows, two lips over
// teeth, nose, ears, hair styles, moustaches, hats and glasses. Animation layers: keyframed poses with eased blends,
// breathing, weight shift, blinking, eye and head look-at, finger curl, talking, and a walk/run cycle without foot sliding.
// Everything is a pure function of t.
import * as THREE from 'three';
import { mat, C, G, M, box, sph, cyl, cap, tor } from './kit.js';
import { makeHead, shade } from './head.js';

const D2R = Math.PI / 180, lerp = (a, b, u) => a + (b - a) * u, clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const eio = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

export const CAST = {
  lustig: { suit: '#1F2A44', shirt: '#F4F1EA', tie: '#B3242F', skin: '#EBC3A0', iris: '#3A6EA5', hair: '#2A1E18', hairStyle: 'slick', moustache: 'curl', hat: 'top', cloth: 'pin', sculpt: { w: .84, jaw: .05, nose: .19, noseW: .85, chin: .06, cheek: .03 }, lips: '#A8524A', pocket: '#F4F1EA', build: 1.0, height: 1.02 },
  poisson: { suit: '#7A5A3A', shirt: '#F1E9D8', tie: '#2E6B4E', skin: '#F0BFA0', iris: '#6B4A2A', hair: '#8C7A68', hairStyle: 'bald', moustache: 'walrus', hat: 'bowler', hatC: '#3A2A1E', cloth: 'tweed', glasses: true, age: true, sculpt: { w: .93, jaw: .15, nose: .18, noseW: 1.15, bulb: .04, chin: .01, cheek: .045, jowl: .05 }, build: 1.25, height: .95, waistcoat: '#A57A4A' },
  dealerA: { suit: '#5E6670', shirt: '#EEE9E0', tie: '#3D4F8C', skin: '#E2B08A', iris: '#4A3020', hair: '#4A3426', hairStyle: 'short', moustache: 'brush', hat: 'bowler', build: 1.08, height: 1.0 },
  dealerB: { suit: '#3F5A45', shirt: '#EDE6DA', tie: '#7A2A3A', skin: '#D9A07A', iris: '#3B2A1A', hair: '#1E1A18', hairStyle: 'short', beard: true, moustache: 'brush', hat: 'flatcap', build: 1.12, height: 1.0 },
  dealerC: { suit: '#6B4A5E', shirt: '#F2ECE2', tie: '#C29A2E', skin: '#EDC4A2', iris: '#56708A', hair: '#B8B0A6', hairStyle: 'short', moustache: 'brush', hat: 'bowler', age: true, build: 1.0, height: .98 },
  gendarme: { suit: '#22305A', shirt: '#22305A', tie: '#22305A', skin: '#E3B08C', iris: '#3B2A1A', hair: '#2A1E18', hairStyle: 'short', moustache: 'brush', hat: 'kepi', build: 1.05, height: 1.0, buttons: '#D9B23A' },
  waiter: { suit: '#1A1A1A', shirt: '#FFFFFF', tie: '#1A1A1A', skin: '#E8B996', iris: '#3B2A1A', hair: '#3A2A20', hairStyle: 'slick', build: .95, height: .98, apron: true },
};

// ---------- geometry helpers ----------
const lathe = (pts, seg = 28) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
const tube = (pts, r, seg = 24, rs = 8) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), seg, r, rs);
function limb(r0, r1, len, m, parent, seg = 14) { M(new THREE.CylinderGeometry(r1, r0, len, seg), m, parent, 0, -len / 2, 0); M(sph(r0, seg, 10), m, parent); M(sph(r1, seg, 10), m, parent, 0, -len, 0); }

export function makeCast(look, o = {}) {
  const L = { ...CAST.dealerA, ...look }, Bd = L.build ?? 1, P = G(), root = G(); P.add(root); root.scale.setScalar((o.scale ?? 1) * (L.height ?? 1));
  const skin = mat(L.skin, { r: .48 }), shirt = mat(L.shirt, { r: .6 }), shoeM = mat('#141012', { r: .28, m: .1 }), dark = mat('#1A1212', { r: .3 });
  const hips = G(); hips.position.y = .95; root.add(hips);
  const spine = G(); spine.position.y = .02; hips.add(spine);
  const chest = G(); chest.position.y = .22; spine.add(chest);
  // fabric: pinstripe, tweed or plain cloth shared by sleeves, trousers and the jacket hem
  const fab = fabricTex(L), suit = new THREE.MeshStandardMaterial({ map: fab, roughness: .8 }), suit2 = new THREE.MeshStandardMaterial({ map: fab, roughness: .8, side: THREE.DoubleSide });
  // casual outfits (polo shirt or tee + trousers): the shirt and the trousers get their own cloth
  const casual = (L.outfit ?? 'suit') !== 'suit';
  const pf = fabricTex({ suit: L.pants ?? '#B8A27A', cloth: L.pantsCloth }), sf_ = fabricTex({ suit: L.shirt, cloth: L.shirtCloth });
  const pantsM = casual ? new THREE.MeshStandardMaterial({ map: pf, roughness: .85 }) : suit, pantsM2 = casual ? new THREE.MeshStandardMaterial({ map: pf, roughness: .85, side: THREE.DoubleSide }) : suit2;
  const shirtF = new THREE.MeshStandardMaterial({ map: sf_, roughness: .75 }), shirtF2 = new THREE.MeshStandardMaterial({ map: sf_, roughness: .75, side: THREE.DoubleSide });
  // sculpted torso (lathe), flattened front-to-back; the belly grows with build. The jacket front (shirt V, tie, lapels,
  // buttons, pocket square, waistcoat) is painted on its own canvas so it always follows the body
  const TP = casual ? [[.152 * Bd, -.1], [.162 * Bd, -.05], [.158 * Bd, .04], [.16 * Bd, .12], [.172, .2], [.18, .28], [.16, .34], [.105, .385], [.05, .4]]
    : [[.2 * Bd, -.29], [.19 * Bd, -.2], [.176 * Bd, -.11], [.165 * Bd, -.05], [.158 * Bd, .04], [.16 * Bd, .12], [.18, .2], [.19, .28], [.17, .34], [.11, .385], [.055, .4]];
  const torso = M(new THREE.LatheGeometry(TP.map(([r, y]) => new THREE.Vector2(r, y)), 40, Math.PI), new THREE.MeshStandardMaterial({ map: casual ? shirtTex(L, TP, Bd) : jacketTex(L, TP, Bd), roughness: .8, side: THREE.DoubleSide }), spine, 0, .02, 0); torso.scale.z = .76;
  if (casual) {     // the seat of the trousers and a belt
    M(sph(.168 * Bd, 26, 16), pantsM, hips, 0, -.05, 0).scale.set(1, .7, .8);
    const belt = M(tor(.158 * Bd, .012, 6, 40), mat(L.belt ?? '#3A2418', { r: .4 }), hips, 0, -.02, 0); belt.rotation.x = Math.PI / 2; belt.scale.y = .78;
  }
  // shoulders: padded jacket shoulders that bridge the chest and the sleeves
  for (const s of [-1, 1]) { const sp = M(sph(casual ? .056 : .062, 20, 14), casual ? shirtF : suit, spine, s * (casual ? .162 : .168), .305, -.004); sp.scale.set(casual ? 1.05 : 1.12, .7, .92); }
  if (L.apron) {    // a bib apron with a printed word, over the shirt
    const ap = M(box(.27, .56, .008, .004), new THREE.MeshStandardMaterial({ map: apronTex(L), roughness: .85 }), spine, 0, .07, .132 * Bd + .012); ap.rotation.x = -.04;
    for (const s of [-1, 1]) { const st = M(box(.018, .16, .006), mat(L.apronC ?? '#C8283A'), spine, s * .06, .4, .07); st.rotation.x = -.5; }
  }
  if (L.tag) { const tg = M(box(.06, .03, .006, .002), new THREE.MeshStandardMaterial({ map: tagTex(L.tag), roughness: .5 }), spine, .085, .3, .123); tg.rotation.y = .18; }
  // collar + neck
  if (casual) { M(cyl(.056, .062, .03, 20), shirtF, spine, 0, .41, .002); if (L.outfit === 'polo') for (const s of [-1, 1]) { const cf = M(box(.05, .006, .04, .003), shirtF, spine, s * .03, .422, .05); cf.rotation.set(.5, s * -.5, s * .25); } }
  else M(cyl(.064, .061, .066, 20), shirt, spine, 0, .432, .002);                // a high 1920s collar
  M(cyl(.05, .054, .1, 16), skin, spine, 0, .45, .004);
  // ---------- head: one sculpted mesh with a painted face (head.js) ----------
  const head = G(); head.position.set(0, .47, .012); spine.add(head);
  const H = makeHead(L, { tex: o.tex ?? 2048 }); H.group.position.set(0, .085, 0); head.add(H.group); head.scale.setScalar(L.headScale ?? 1.15);
  const drawFace = H.drawFace;
  // hats
  // hats sit on the head: the band rests at H.seat (just above the hairline); brims are shallow lathes that curl up at the sides
  const hat = G(); hat.position.set(0, .085 + H.seat, -.004); hat.rotation.x = -.07; head.add(hat); const hm = mat('#141418', { r: .5 });
  const brim = (r, m, curl = .012) => { const g = new THREE.LatheGeometry([[.06, .004], [r * .7, 0], [r * .92, .002], [r, curl], [r, curl + .005], [r * .9, .007], [r * .7, .005], [.06, .009]].map(([a, b]) => new THREE.Vector2(a, b)), 36); const b = M(g, m, hat); b.scale.z = 1.12; return b; };
  if (L.hat === 'top') { M(cyl(.094, .087, .17, 30), hm, hat, 0, .09, 0); M(cyl(.0885, .0885, .03, 30), mat('#3A3A44', { r: .35 }), hat, 0, .021, 0); brim(.135, hm, .016); }
  if (L.hat === 'bowler') { const bm = mat(L.hatC ?? '#1E1A18', { r: .45 }); M(new THREE.SphereGeometry(.096, 30, 16, 0, Math.PI * 2, 0, Math.PI * .5), bm, hat, 0, .012, 0).scale.set(1, .92, 1.1); M(cyl(.099, .099, .026, 28), bm, hat, 0, .013, 0).scale.z = 1.1; M(cyl(.1, .1, .02, 28), mat('#241C16', { r: .4 }), hat, 0, .014, 0).scale.z = 1.1; brim(.13, bm, .018); }
  if (L.hat === 'flatcap') { const cm = mat('#6B5A44', { r: .9 }); M(new THREE.SphereGeometry(.104, 28, 12, 0, Math.PI * 2, 0, Math.PI * .5), cm, hat, 0, .005, .006).scale.set(1.04, .5, 1.15); M(cyl(.1, .1, .02, 28), cm, hat, 0, .006, .004).scale.z = 1.12; const v = M(new THREE.SphereGeometry(.07, 20, 6, 0, Math.PI, 0, Math.PI * .5), cm, hat, 0, .002, .1); v.scale.set(1, .12, .75); v.rotation.y = -Math.PI / 2; }
  if (L.hat === 'kepi') { const km = mat('#22305A', { r: .6 }); M(cyl(.088, .096, .09, 26), km, hat, 0, .045, -.008).rotation.x = -.12; M(cyl(.097, .097, .02, 26), mat('#B3242F'), hat, 0, .012, 0); const v = M(new THREE.SphereGeometry(.07, 20, 6, 0, Math.PI, 0, Math.PI * .5), mat('#141418', { r: .3 }), hat, 0, 0, .09); v.scale.set(1, .1, .7); v.rotation.y = -Math.PI / 2; }
  // ---------- arms with fingered hands ----------
  const sleeveM = suit2;
  const arm = s => {
    const sh = G(); sh.position.set(s * .186, .305, 0); spine.add(sh);
    const el = G(); el.position.y = -.28; sh.add(el);
    if (casual) {   // short sleeve, bare arm
      M(sph(.052, 16, 12), shirtF, sh); M(cyl(.055, .053, .13, 16, true), shirtF2, sh, 0, -.06, 0);
      M(cyl(.041, .035, .28, 14), skin, sh, 0, -.14, 0); M(sph(.035, 14, 10), skin, sh, 0, -.28, 0); M(cyl(.034, .029, .23, 14), skin, el, 0, -.115, 0);
    } else {
      M(sph(.054, 16, 12), suit, sh); M(cyl(.053, .047, .28, 16), suit, sh, 0, -.14, 0); M(sph(.047, 16, 12), suit, sh, 0, -.28, 0);   // upper sleeve + elbow
      M(cyl(.046, .046, .21, 16, true), sleeveM, el, 0, -.105, 0);                                                                      // forearm sleeve, open at the cuff
      M(cyl(.037, .037, .035, 14), shirt, el, 0, -.215, 0);
    }
    const hand = G(); hand.position.y = -.25; el.add(hand);
    M(box(.07, .075, .03, .013), skin, hand, 0, -.03, 0);
    const fingers = [];
    for (let i = 0; i < 4; i++) {
      const f1 = G(); f1.position.set((i - 1.5) * .017, -.065, 0); hand.add(f1);
      M(cap(.0085, .024 - Math.abs(i - 1.3) * .003, 6), skin, f1, 0, -.015, 0);
      const f2 = G(); f2.position.y = -.032; f1.add(f2); M(cap(.0078, .018, 6), skin, f2, 0, -.012, 0);
      fingers.push([f1, f2]);
    }
    const th = G(); th.position.set(-s * .036, -.028, .012); hand.add(th); M(cap(.0095, .024, 6), skin, th, 0, -.014, 0); th.rotation.z = -s * .7; th.rotation.y = s * .4;
    return { sh, el, hand, fingers, th, s };
  };
  // ---------- legs ----------
  const tro = pantsM, troD = pantsM2;
  const leg = s => {
    const hp = G(); hp.position.set(s * .088, -.05, 0); hips.add(hp);
    M(sph(.074, 16, 12), tro, hp); M(cyl(.074, .06, .43, 16), tro, hp, 0, -.215, 0); M(sph(.06, 16, 12), tro, hp, 0, -.43, 0);       // thigh + knee
    const kn = G(); kn.position.y = -.43; hp.add(kn);
    M(cyl(.057, .063, .42, 16, true), troD, kn, 0, -.21, 0);                                                                          // shin, the hem flares a little
    const ft = G(); ft.position.y = -.44; kn.add(ft);
    const shoe = L.shoes ? mat(L.shoes, { r: .6 }) : shoeM;
    M(sph(.045, 14, 10), shoe, ft, 0, .0, 0).scale.set(1, .7, 1.2);
    const toe = M(sph(.05, 18, 12), shoe, ft, 0, -.016, .085); toe.scale.set(.88, .62, 1.55);
    M(box(.078, .014, .2, .006), mat(L.sole ?? '#1E1612', { r: .7 }), ft, 0, -.044, .05);                                                       // sole
    M(box(.07, .03, .05, .01), shoe, ft, 0, -.03, -.045);                                                                                 // heel
    return { hp, kn, ft };
  };
  const aL = arm(-1), aR = arm(1), lL = leg(-1), lR = leg(1);
  const props = G(); props.position.set(0, -.07, .02); aR.hand.add(props);
  const propsL = G(); propsL.position.set(0, -.07, .02); aL.hand.add(propsL);
  const p = { P, root, hips, spine, chest, head, drawFace, aL, aR, lL, lR, props, propsL, hat, look: L, torso };
  apply(p, POSES.stand, {});
  return p;
}


// ---------- cloth and jacket-front textures ----------
const texCache = new Map();
function fabricTex(L) {
  const key = L.suit + (L.cloth ?? ''); if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = L.suit; g.fillRect(0, 0, 256, 256);
  let sd = 3; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 2500; i++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.05)'; g.fillRect(r() * 256, r() * 256, 2 + r() * 3, 1 + r() * 2); }
  if (L.cloth === 'pin') { g.fillStyle = 'rgba(235,235,245,.16)'; for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 2.2, 256); }
  if (L.cloth === 'tweed') { for (let i = 0; i < 4000; i++) { g.fillStyle = ['rgba(60,30,10,.12)', 'rgba(240,220,180,.08)', 'rgba(120,60,20,.1)'][i % 3]; g.fillRect(r() * 256, r() * 256, 3, 1.5); } g.strokeStyle = 'rgba(40,20,10,.10)'; g.lineWidth = 2; for (let x = 0; x < 256; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); g.beginPath(); g.moveTo(0, x); g.lineTo(256, x); g.stroke(); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 1.5); t.anisotropy = 4; texCache.set(key, t); return t;
}
function jacketTex(L, TP, Bd) {
  const CW = 1024, CH = 512, c = document.createElement('canvas'); c.width = CW; c.height = CH; const g = c.getContext('2d');
  const n = TP.length - 1, vOf = y => { for (let j = 1; j <= n; j++) if (y <= TP[j][1]) return (j - 1 + (y - TP[j - 1][1]) / (TP[j][1] - TP[j - 1][1])) / n; return 1; };
  const rOf = y => { for (let j = 1; j <= n; j++) if (y <= TP[j][1]) return TP[j - 1][0] + (TP[j][0] - TP[j - 1][0]) * (y - TP[j - 1][1]) / (TP[j][1] - TP[j - 1][1]); return TP[n][0]; };
  const X = (d, y) => CW * (.5 + Math.asin(Math.max(-1, Math.min(1, d / Math.max(.02, rOf(y))))) / (Math.PI * 2)), Yp = y => (1 - vOf(y)) * CH;
  const poly = (pts, fill) => { g.beginPath(); pts.forEach(([d, y], i) => i ? g.lineTo(X(d, y), Yp(y)) : g.moveTo(X(d, y), Yp(y))); g.closePath(); g.fillStyle = fill; g.fill(); };
  g.drawImage(fabricTex(L).image, 0, 0, 256, 256, 0, 0, CW / 4, CH / 2); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) g.drawImage(c, 0, 0, CW / 4, CH / 2, i * CW / 4, j * CH / 2, CW / 4, CH / 2);
  const top = .392, _u = 0, vb = L.waistcoat ? .14 : .165, dk = shade(L.suit, -.25);
  if (L.waistcoat) { poly([[-.06, top], [.06, top], [0, vb]], L.waistcoat); for (let i = 0; i < 3; i++) { g.fillStyle = '#3A2A1A'; g.beginPath(); g.arc(X(0, .27 - i * .045), Yp(.27 - i * .045), 4, 0, 7); g.fill(); }
    g.strokeStyle = '#E2B84A'; g.lineWidth = 3; g.beginPath(); g.moveTo(X(0, .225), Yp(.225)); g.quadraticCurveTo(X(.03, .2), Yp(.2), X(.045, .24), Yp(.24)); g.stroke(); }
  const sv = L.waistcoat ? .29 : vb;
  poly([[-.055, top], [.055, top], [0, sv]], L.shirt);
  // tie: knot + blade, tucked into the jacket (or waistcoat)
  poly([[-.014, .383], [.014, .383], [.01, .362], [-.01, .362]], shade(L.tie, -.1));
  poly([[-.01, .362], [.01, .362], [.02, sv + .03], [0, sv + .005], [-.02, sv + .03]], L.tie);
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2; for (let y = .35; y > sv + .04; y -= .02) { g.beginPath(); g.moveTo(X(-.012, y), Yp(y)); g.lineTo(X(.012, y - .01), Yp(y - .01)); g.stroke(); }
  // lapels with a notch, darker edge
  for (const s of [-1, 1]) {
    poly([[s * .055, top], [s * .085, .39], [s * .1, .33], [s * .085, .325], [s * .095, .305], [s * .02, vb + .02], [0, vb]], shade(L.suit, .06));
    g.strokeStyle = dk; g.lineWidth = 3; g.beginPath(); [[s * .055, top], [s * .085, .39], [s * .1, .33], [s * .085, .325], [s * .095, .305], [s * .02, vb + .02], [0, vb]].forEach(([d, y], i) => i ? g.lineTo(X(d, y), Yp(y)) : g.moveTo(X(d, y), Yp(y))); g.stroke();
  }
  for (let i = 0; i < 2; i++) { const y = vb - .03 - i * .075; g.fillStyle = L.buttons ?? '#1E1612'; g.beginPath(); g.arc(X(0, y), Yp(y), 6, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(X(0, y) - 1.5, Yp(y) - 1.5, 2, 0, 7); g.fill(); }
  for (const s of [-1, 1]) { g.strokeStyle = dk; g.lineWidth = 3; g.beginPath(); g.moveTo(X(0, vb), Yp(vb)); g.lineTo(X(0, -.1), Yp(-.1)); g.quadraticCurveTo(X(s * .01, -.22), Yp(-.22), X(s * .06, -.285), Yp(-.285)); g.stroke(); }   // the front edge and its cutaway
  // breast pocket (on the wearer's left) with a pocket square
  g.strokeStyle = dk; g.lineWidth = 4; g.beginPath(); g.moveTo(X(.075, .255), Yp(.255)); g.lineTo(X(.135, .262), Yp(.262)); g.stroke();
  if (L.pocket) poly([[.085, .258], [.1, .285], [.11, .27], [.122, .29], [.13, .26]], L.pocket);
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(X(s * .06, -.02), Yp(-.02)); g.lineTo(X(s * .14, -.025), Yp(-.025)); g.lineWidth = 4; g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

function shirtTex(L, TP, Bd) {
  const CW = 1024, CH = 512, c = document.createElement('canvas'); c.width = CW; c.height = CH; const g = c.getContext('2d');
  const n = TP.length - 1, vOf = y => { for (let j = 1; j <= n; j++) if (y <= TP[j][1]) return (j - 1 + (y - TP[j - 1][1]) / (TP[j][1] - TP[j - 1][1])) / n; return 1; };
  const rOf = y => { for (let j = 1; j <= n; j++) if (y <= TP[j][1]) return TP[j - 1][0] + (TP[j][0] - TP[j - 1][0]) * (y - TP[j - 1][1]) / (TP[j][1] - TP[j - 1][1]); return TP[n][0]; };
  const X = (d, y) => CW * (.5 + Math.asin(Math.max(-1, Math.min(1, d / Math.max(.02, rOf(y))))) / (Math.PI * 2)), Yp = y => (1 - vOf(y)) * CH;
  const src = fabricTex({ suit: L.shirt, cloth: L.shirtCloth }).image; for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) g.drawImage(src, 0, 0, 256, 256, i * CW / 4, j * CH / 2, CW / 4, CH / 2);
  const dk = shade(L.shirt, -.25);
  if (L.outfit === 'polo') {   // placket with two buttons, and the collar's shadow
    g.fillStyle = shade(L.shirt, -.08); g.fillRect(X(-.016, .3), Yp(.395), X(.016, .3) - X(-.016, .3), Yp(.29) - Yp(.395));
    g.strokeStyle = dk; g.lineWidth = 3; g.strokeRect(X(-.016, .3), Yp(.395), X(.016, .3) - X(-.016, .3), Yp(.29) - Yp(.395));
    for (const y of [.36, .32]) { g.fillStyle = '#F4F1EA'; g.beginPath(); g.arc(X(0, y), Yp(y), 6, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(X(0, .39), Yp(.39), 70, 16, 0, 0, 7); g.fill();
  } else { g.strokeStyle = dk; g.lineWidth = 8; g.beginPath(); g.arc(X(0, .39), Yp(.43), 70, .15 * Math.PI, .85 * Math.PI); g.stroke(); }
  if (L.logo) { g.fillStyle = L.logoC ?? '#FFFFFF'; g.font = '700 30px Fredoka'; g.textAlign = 'center'; g.fillText(L.logo, X(-.085, .27), Yp(.27)); }
  if (L.stripe) { g.fillStyle = L.stripe; for (const y of [.2, .1]) g.fillRect(0, Yp(y + .015), CW, Yp(y) - Yp(y + .015)); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function apronTex(L) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512; const g = c.getContext('2d'); g.fillStyle = L.apronC ?? '#C8283A'; g.fillRect(0, 0, 256, 512);
  g.fillStyle = 'rgba(255,255,255,.08)'; for (let y = 0; y < 512; y += 6) g.fillRect(0, y, 256, 2);
  if (L.apronText) { g.fillStyle = '#FFFFFF'; g.font = '700 46px Fredoka'; g.textAlign = 'center'; L.apronText.split('\n').forEach((l, i) => g.fillText(l, 128, 150 + i * 52)); }
  g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 6; g.strokeRect(30, 290, 196, 120);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function tagTex(txt) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#F4F1EA'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#C8283A'; g.fillRect(0, 0, 256, 36);
  g.fillStyle = '#FFFFFF'; g.font = '700 26px Fredoka'; g.textAlign = 'center'; g.fillText('HELLO', 128, 28); g.fillStyle = '#1C1C1E'; g.font = '700 54px Fredoka'; g.fillText(txt, 128, 100);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- props ----------
export function cane() { const g = G(); M(cyl(.011, .011, .9, 8), mat('#1A1210', { r: .3 }), g, 0, -.4, 0); M(sph(.022, 12, 8), mat('#D9B23A', { m: .8, r: .25 }), g, 0, .04, 0); return g; }
export function envelope(col = '#EDE3C8') { const g = G(); M(box(.2, .12, .01, .004), mat(col), g, 0, -.04, .03); M(box(.04, .03, .012), mat('#A0242E'), g, 0, -.04, .037); return g; }
export function moneyStack(n = 1) { const g = G(); for (let i = 0; i < n; i++) { M(box(.16, .02, .08, .004), mat('#9DB78A', { r: .7 }), g, 0, -.03 - i * .021, .03); M(box(.02, .021, .082), mat('#E9E3D0'), g, 0, -.03 - i * .021, .03); } return g; }
export function briefcase() { const g = G(); M(box(.42, .3, .1, .02), mat('#5A3820', { r: .55 }), g, 0, -.2, 0); M(tor(.04, .008, 6, 12, Math.PI), mat('#2A1A10'), g, 0, -.05, 0); for (const x of [-.12, .12]) M(box(.03, .02, .11), mat('#D9B23A', { m: .8, r: .3 }), g, x, -.07, 0); return g; }

// ---------- poses: degrees. sp [bendX, twistY, sideZ], hd [x, y, z], aL/aR [shX, shY, shZ, elbow, wristX], lL/lR [hipX, hipZ, knee], y hip drop, grip 0..1 per hand ----------
export const POSES = {
  stand: { sp: [0, 0, 0], hd: [0, 0, 0], aL: [6, 0, -7, 10, 0], aR: [6, 0, 7, 10, 0], lL: [0, -2, 2], lR: [0, 2, 2], y: 0, gL: .25, gR: .25 },
  proud: { sp: [-6, 0, 0], hd: [-8, 0, 0], aL: [10, 25, -18, 70, 0], aR: [10, -25, 18, 70, 0], lL: [0, -4, 2], lR: [0, 4, 2], y: 0, gL: .5, gR: .5, face: 'smug' },     // hands on hips
  cane: { sp: [-3, 0, 0], hd: [-4, 0, 0], aL: [6, 0, -7, 10, 0], aR: [-8, 0, 14, 22, 0], lL: [0, -3, 2], lR: [0, 3, 2], y: 0, gL: .25, gR: 1 },
  tipHat: { sp: [4, 0, 0], hd: [8, 0, 0], aL: [6, 0, -7, 10, 0], aR: [-100, 20, 30, 150, 0], lL: [0, -3, 2], lR: [0, 3, 2], y: 0, gL: .25, gR: .7, face: 'smug' },
  shh: { sp: [4, 0, 0], hd: [4, 0, 0], aL: [6, 0, -7, 10, 0], aR: [-80, 30, 30, 145, 0], lL: [0, -3, 2], lR: [0, 3, 2], y: 0, gL: .25, gR: .85, face: 'smug', pt: 1 },          // finger to lips
  present: { sp: [-2, 0, 0], hd: [-2, 0, 0], aL: [-40, 10, -35, 25, -10], aR: [-40, -10, 35, 25, -10], lL: [0, -3, 2], lR: [0, 3, 2], y: 0, gL: 0, gR: 0, face: 'talk' },  // palms open
  point: { sp: [2, 0, 0], hd: [0, 0, 0], aL: [6, 0, -7, 10, 0], aR: [-80, 0, 12, 6, 0], lL: [0, -3, 2], lR: [0, 3, 2], y: 0, gL: .25, gR: .9, face: 'talk', pt: 1 },
  read: { sp: [-2, 0, 0], hd: [6, 0, 0], aL: [-62, 25, -18, 100, 0], aR: [-62, -25, 18, 100, 0], lL: [0, -3, 2], lR: [0, 3, 2], y: 0, gL: .75, gR: .75 },
  sitRead: { sp: [-4, 0, 0], hd: [4, 0, 0], aL: [-62, 25, -18, 100, 0], aR: [-62, -25, 18, 100, 0], lL: [-85, -6, 85], lR: [-85, 6, 85], y: -.47, gL: .75, gR: .75 },
  sitLower: { sp: [-4, 0, 0], hd: [-2, 0, 0], aL: [-40, 25, -14, 75, 0], aR: [-40, -25, 14, 75, 0], lL: [-85, -6, 85], lR: [-85, 6, 85], y: -.47, gL: .75, gR: .75, face: 'greedy' },
  stampUp: { sp: [10, -8, 0], hd: [14, 0, 0], aL: [-25, 10, -8, 40, 0], aR: [-120, -10, 12, 70, 0], lL: [0, -4, 2], lR: [0, 4, 2], y: 0, gL: .4, gR: 1, face: 'smug' },
  stampDown: { sp: [22, -8, 0], hd: [10, 0, 0], aL: [-25, 10, -8, 40, 0], aR: [-62, -6, 8, 18, 0], lL: [0, -4, 2], lR: [0, 4, 2], y: 0, gL: .4, gR: 1, face: 'smug' },
  drive: { sp: [-6, 0, 0], hd: [-4, 0, 0], aL: [-52, 12, -6, 45, 0], aR: [-52, -12, 6, 45, 0], lL: [-80, -6, 60], lR: [-80, 6, 60], y: -.47, gL: .9, gR: .9, face: 'happy' },
  driveWave: { sp: [-8, 10, 0], hd: [-8, 0, 0], aL: [-52, 12, -6, 45, 0], aR: [-30, 0, 150, 30, 0], lL: [-80, -6, 60], lR: [-80, 6, 60], y: -.47, gL: .9, gR: .2, face: 'happy' },
  hatUp: { sp: [-6, 0, 0], hd: [-8, 0, 0], aL: [6, 0, -7, 10, 0], aR: [-30, 0, 160, 30, 0], lL: [0, -3, 2], lR: [0, 3, 2], y: 0, gL: .25, gR: .7, face: 'happy' },
  hideFace: { sp: [14, 0, 0], hd: [20, 0, 0], aL: [-72, 34, -24, 142, 0], aR: [-72, -34, 24, 142, 0], lL: [0, -3, 3], lR: [0, 3, 3], y: -.01, gL: .1, gR: .1, face: 'embarrassed' },
  pointBack: { sp: [0, 20, 0], hd: [0, 10, 0], aL: [6, 0, -7, 10, 0], aR: [-70, 60, 20, 8, 0], lL: [0, -3, 2], lR: [0, 3, 2], y: 0, gL: .25, gR: .9, face: 'shock', pt: 1 },
  whistle: { sp: [-4, 0, 0], hd: [-6, 0, 0], aL: [-40, 0, -60, 20, 0], aR: [-80, 30, 30, 145, 0], lL: [0, -3, 2], lR: [0, 3, 2], y: 0, gL: 0, gR: .85, face: 'angry' },
  runHat: { sp: [12, 0, 0], hd: [-8, 0, 0], aL: [-10, 0, -12, 60, 0], aR: [-130, 10, 30, 120, 0], lL: [0, -3, 2], lR: [0, 3, 2], y: 0, gL: .6, gR: .8, face: 'shock' },
  rubHands: { sp: [6, 0, 0], hd: [6, 0, 0], aL: [-45, 20, -10, 80, 0], aR: [-45, -20, 10, 80, 0], lL: [0, -3, 2], lR: [0, 3, 2], y: -.01, gL: .3, gR: .3, face: 'greedy' },
  hold: { sp: [0, 0, 0], hd: [3, 0, 0], aL: [-30, 15, -8, 70, 0], aR: [-30, -15, 8, 70, 0], lL: [0, -3, 2], lR: [0, 3, 2], y: 0, gL: .6, gR: .6 },
  offer: { sp: [8, 0, 0], hd: [4, 0, 0], aL: [6, 0, -7, 10, 0], aR: [-55, -10, 10, 30, -10], lL: [0, -3, 2], lR: [0, 3, 2], y: 0, gL: .25, gR: .55, face: 'greedy' },
  take: { sp: [4, 0, 0], hd: [6, 0, 0], aL: [6, 0, -7, 10, 0], aR: [-60, -10, 10, 40, 0], lL: [0, -3, 2], lR: [0, 3, 2], y: 0, gL: .25, gR: .6, face: 'smug' },
  shock: { sp: [-10, 0, 0], hd: [-10, 0, 0], aL: [-30, 30, -55, 75, 0], aR: [-30, -30, 55, 75, 0], lL: [0, -4, 4], lR: [0, 4, 4], y: -.02, gL: 0, gR: 0, face: 'shock' },
  facepalm: { sp: [12, 0, 0], hd: [18, 0, 0], aL: [6, 0, -7, 10, 0], aR: [-75, 30, 25, 140, 0], lL: [0, -3, 2], lR: [0, 3, 2], y: 0, gL: .25, gR: .1, face: 'sad' },
  sit: { sp: [-3, 0, 0], hd: [0, 0, 0], aL: [-40, 10, -10, 55, 0], aR: [-40, -10, 10, 55, 0], lL: [-85, -4, 85], lR: [-85, 4, 85], y: -.47, gL: .3, gR: .3 },
  sitLean: { sp: [14, 0, 0], hd: [-8, 0, 0], aL: [-55, 20, -10, 70, 0], aR: [-55, -20, 10, 70, 0], lL: [-85, -4, 85], lR: [-85, 4, 85], y: -.47, gL: .2, gR: .2, face: 'greedy' },
  sitTalk: { sp: [-2, 0, 0], hd: [-2, 0, 0], aL: [-40, 10, -10, 55, 0], aR: [-50, -20, 25, 60, -10], lL: [-85, -4, 85], lR: [-85, 4, 85], y: -.47, gL: .3, gR: 0, face: 'talk' },
  sneak: { sp: [16, 0, 0], hd: [-14, 0, 0], aL: [-10, 0, -12, 60, 0], aR: [-10, 0, 12, 60, 0], lL: [-10, -3, 20], lR: [-10, 3, 20], y: -.06, gL: .6, gR: .9, face: 'worried' },
  cheer: { sp: [-8, 0, 0], hd: [-14, 0, 0], aL: [-20, 0, -150, 20, 0], aR: [-20, 0, 150, 20, 0], lL: [0, -3, 2], lR: [0, 3, 2], y: 0, gL: .9, gR: .9, face: 'happy' },
};
const FACES = {
  calm: { brow: 0, browY: 0, inner: 0, open: 0, lid: .15, smile: 0 }, smug: { brow: -4, browY: .002, inner: -6, open: 0, lid: .32, smile: .8 },
  talk: { brow: -6, browY: .003, inner: 0, open: .35, lid: .2, smile: .3 }, greedy: { brow: 8, browY: -.002, inner: 10, open: .15, lid: .35, smile: 1 },
  shock: { brow: -18, browY: .012, inner: -10, open: 1, lid: 0, smile: 0 }, worried: { brow: -8, browY: .006, inner: -22, open: .1, lid: .1, smile: -.6 },
  happy: { brow: -10, browY: .006, inner: 0, open: .6, lid: .4, smile: 1 }, embarrassed: { brow: -6, browY: .004, inner: -22, open: 0, lid: .55, smile: -.5, blush: 1 }, sad: { brow: -6, browY: .004, inner: -25, open: 0, lid: .45, smile: -1 }, angry: { brow: 20, browY: -.006, inner: 18, open: .2, lid: .3, smile: -.8 },
};
export function mixPose(a, b, u) {
  const r = {}; for (const k of ['sp', 'hd', 'aL', 'aR', 'lL', 'lR']) r[k] = a[k].map((v, i) => lerp(v, b[k][i], u));
  r.y = lerp(a.y, b.y, u); r.gL = lerp(a.gL ?? .25, b.gL ?? .25, u); r.gR = lerp(a.gR ?? .25, b.gR ?? .25, u); r.face = u < .5 ? a.face : b.face; r.pt = u < .5 ? a.pt : b.pt; return r;
}
function mixFace(a, b, u) { const r = {}; for (const k in a) r[k] = lerp(a[k], b[k], u); return r; }

// apply a pose + live layers: o = { t, face, faceU, talk, look: Vector3 (world), blinkSeed, breathe }
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4();
export function apply(p, q, o = {}) {
  const t = o.t ?? 0, seed = o.seed ?? 0;
  const br = Math.sin(t * 1.6 + seed) * (o.breathe ?? 1);   // breathing
  p.spine.rotation.set((q.sp[0] + br * .6) * D2R, q.sp[1] * D2R, q.sp[2] * D2R);
  p.torso.scale.set(1 + br * .006, 1 + br * .004, .76 + br * .008);
  p.head.rotation.set((q.hd[0] - br * .4) * D2R, q.hd[1] * D2R, q.hd[2] * D2R);
  for (const [a, v] of [[p.aL, q.aL], [p.aR, q.aR]]) { a.sh.rotation.set(v[0] * D2R, v[1] * D2R, (v[2] + br * .5 * a.s) * D2R); a.el.rotation.set(-v[3] * D2R, 0, 0); a.hand.rotation.set((v[4] ?? 0) * D2R, 0, 0); }
  const curl = (a, g) => { a.fingers.forEach(([f1, f2], i) => { const c = clamp(g + (i === 0 && a.point ? -1 : 0)); f1.rotation.x = c * 1.35; f2.rotation.x = c * 1.5; }); a.th.rotation.x = g * .9; };
  p.aR.point = !!q.pt; curl(p.aL, q.gL ?? .25); curl(p.aR, q.gR ?? .25);
  for (const [l, v] of [[p.lL, q.lL], [p.lR, q.lR]]) { l.hp.rotation.set(v[0] * D2R, 0, v[1] * D2R); l.kn.rotation.set(v[2] * D2R, 0, 0); l.ft.rotation.set(-(v[0] + v[2]) * D2R * .85, 0, 0); }
  p.hips.position.y = .95 + q.y + br * .002;
  // face: painted, redrawn when the expression, blink or gaze changes
  let f = FACES[o.face ?? q.face ?? 'calm']; if (o.face2) f = mixFace(f, FACES[o.face2], o.faceU ?? 0);
  const ph = (t * .37 + seed * .618) % 1, blink = ph > .965 ? Math.sin((ph - .965) / .035 * Math.PI) : 0;
  const talk = o.talk ? Math.max(0, Math.sin(t * 17 + seed) * .5 + Math.sin(t * 11.3) * .4) * o.talk : 0;
  let lx = Math.sin(t * .7 + seed) * .15, ly = 0;
  if (o.look) {
    p.P.updateMatrixWorld(true); p.head.getWorldPosition(_v); const d = o.look.clone().sub(_v);
    p.P.getWorldQuaternion(_q); d.applyQuaternion(_q.clone().invert());
    const yaw = clamp(Math.atan2(d.x, d.z), -1.1, 1.1), pitch = clamp(Math.atan2(d.y, Math.hypot(d.x, d.z)), -.6, .6);
    p.head.rotation.y += yaw * .6 - p.spine.rotation.y * .3; p.head.rotation.x -= pitch * .5;
    lx = clamp(yaw * 1.3, -1, 1); ly = clamp(-pitch * 1.2, -1, 1);
  }
  if (o.lx !== undefined) lx = o.lx;
  p.drawFace({ blink: Math.round(blink * 4) / 4, wink: Math.round((o.wink ?? 0) * 4) / 4, blush: Math.round(((f.blush ?? 0) + (o.blush ?? 0)) * 4) / 4, lid: f.lid, lx: Math.round(lx * 10) / 10, ly: Math.round(ly * 10) / 10, brow: f.brow, inner: f.inner, browY: -f.browY * 900, smile: f.smile, open: Math.round(clamp(f.open + talk) * 8) / 8 });
}

// ---------- tracks: [{t, pose, d (blend s), face}] → the pose at time t, blended with eased transitions and a little overshoot ----------
export function poseAt(track, t) {
  let prev = track[0].pose, cur = track[0];
  for (let i = 1; i < track.length; i++) {
    const k = track[i]; if (t < k.t) break;
    const u = clamp((t - k.t) / (k.d ?? .35)); const from = prev === undefined ? k.pose : prev;
    prev = u >= 1 ? k.pose : mixPose(evalStatic(track, i - 1, k.t), k.pose, overshoot(u)); cur = k;
  }
  return { pose: prev, key: cur };
}
function evalStatic(track, i, t) { return poseAt(track.slice(0, i + 1), t).pose; }
const overshoot = u => { const e = eio(u); return e + Math.sin(u * Math.PI) * .06 * (1 - u); };

// ---------- walking: path keys [{t, x, z}] → position, heading, phase (stride-locked, no foot sliding) ----------
export function walkAt(keys, t, stride = .62) {
  if (t <= keys[0].t) return { x: keys[0].x, z: keys[0].z, h: keys[0].h ?? 0, moving: 0, dist: 0 };
  let dist = 0;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i], len = Math.hypot(b.x - a.x, b.z - a.z);
    if (t < b.t) { const u = (t - a.t) / (b.t - a.t), e = b.ease ? eio(u) : u; const h = Math.atan2(b.x - a.x, b.z - a.z); return { x: lerp(a.x, b.x, e), z: lerp(a.z, b.z, e), h: len > 1e-3 ? h : (b.h ?? a.h ?? 0), moving: len > 1e-3 ? 1 : 0, dist: dist + len * e, speed: len / (b.t - a.t) }; }
    dist += len;
  }
  const z = keys[keys.length - 1]; return { x: z.x, z: z.z, h: z.h ?? 0, moving: 0, dist };
}
export function walkPose(base, dist, speed = 1.3, stride = .62) {
  const run = speed > 2.2, ph = dist / (stride * (run ? 1.6 : 1)) * Math.PI, s = Math.sin(ph), c = Math.cos(ph), a = run ? 1.6 : 1;
  const q = JSON.parse(JSON.stringify(base));
  q.lL = [-24 * s * a, -2, Math.max(4, 30 * (1 + c) * .5 * a + 4)]; q.lR = [24 * s * a, 2, Math.max(4, 30 * (1 - c) * .5 * a + 4)];
  q.aL = [base.aL[0] + 22 * s * a, base.aL[1], base.aL[2], base.aL[3] + (run ? 60 : 12), base.aL[4]];
  if (base === POSES.stand || run) q.aR = [base.aR[0] - 22 * s * a, base.aR[1], base.aR[2], base.aR[3] + (run ? 60 : 12), base.aR[4]];
  q.sp = [base.sp[0] + (run ? 12 : 2), base.sp[1] + 5 * s, base.sp[2] + 2 * s]; q.y = -.018 * Math.abs(c) * a - (run ? .03 : 0); q.hd = [base.hd[0] - (run ? 8 : 0), base.hd[1] - 4 * s, base.hd[2]];
  return q;
}
