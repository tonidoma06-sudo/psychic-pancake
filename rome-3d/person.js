// person.js · stylised but human-proportioned people (≈7 heads tall): shaped torso, tapered limbs, hands and feet,
// a face with eyes, lids, brows, nose, mouth and hair, and Roman costumes (tunic, toga with purple border, armour, cape, helmet).
// All poses are set from t (no state carried between frames).
import * as THREE from 'three';
import { mat, C, G, M, box, sph, cyl, cap, tor, laurel, textCanvas, texFrom } from './kit.js';

const D2R = Math.PI / 180;
export const LOOK = {
  emperor: { tunic: C.white, toga: C.white, border: C.imperial, cloak: C.imperial, head: 'laurel', hair: '#CFCAC2', beard: '#CFCAC2', skin: '#EDC09A' },
  senator: { tunic: C.wool, toga: C.wool, border: C.purple, hair: C.hairD, skin: '#E8B48C' },
  julianus: { tunic: C.wool, toga: '#F4EEDF', border: C.purple, hair: '#9B948B', belly: 1.22, ring: true, skin: '#EEBF96' },
  sulpicianus: { tunic: '#E6DDF0', toga: '#E6DDF0', border: C.teal, hair: '#E9E6E1', beard: '#E9E6E1', skin: '#E9B994' },
  guard: { tunic: C.red, armor: C.gold, head: 'helmet', crest: C.red, cape: C.redD, skin: '#D9A07A', pteruges: true },
  general: { tunic: C.redD, armor: C.steel, helmetCol: C.steel, head: 'helmet', crest: '#F4F1EA', cape: C.red, beard: '#3A2A20', skin: '#C98F68', pteruges: true },
  soldier: { tunic: C.redD, armor: C.steel, helmetCol: C.steel, head: 'helmet', crest: '#2A2A2A', skin: '#D19A72', pteruges: true },
  citizen: { tunic: C.terracotta, hair: C.hairD, skin: '#E2AE86' },
};
// tapered limb segment hanging down from its joint
const limb = (r0, r1, len, m, parent) => { const o = M(new THREE.CylinderGeometry(r1, r0, len, 14), m, parent, 0, -len / 2, 0); M(sph(r1, 14, 10), m, parent, 0, -len, 0); M(sph(r0, 14, 10), m, parent, 0, 0, 0); return o; };

export function makePerson(look = LOOK.citizen, o = {}) {
  const L = { ...LOOK.citizen, ...look }, P = G(), S = o.scale ?? 1, B = L.belly ?? 1;
  const skinC = L.skin ?? C.skin, skin = mat(skinC, { r: .5 }), tun = mat(L.tunic, { r: .75 }), ink = mat('#231B18', { r: .35 });
  const root = G(); root.scale.setScalar(S); P.add(root);
  const hips = G(); hips.position.y = .94; root.add(hips);
  const spine = G(); spine.position.y = .04; hips.add(spine);
  // torso: pelvis, belly, chest, shoulders (ellipsoids) in the tunic colour
  M(sph(1, 24, 16), tun, hips, 0, 0, 0).scale.set(.165 * B, .12, .12 * B);
  M(sph(1, 24, 16), tun, spine, 0, .14, .005).scale.set(.155 * B, .17, .125 * B);
  M(sph(1, 24, 16), tun, spine, 0, .33, 0).scale.set(.19, .19, .125);
  for (const s of [-1, 1]) M(sph(1, 16, 10), tun, spine, s * .17, .43, 0).scale.set(.075, .06, .07);
  M(new THREE.CylinderGeometry(.16 * B, .23, .36, 22, 1, true), mat(L.tunic, { r: .75, side: THREE.DoubleSide }), hips, 0, -.17, 0);   // tunic skirt
  if (L.toga) {
    const tg = mat(L.toga, { r: .85, side: THREE.DoubleSide }), bd = mat(L.border, { r: .7 });
    M(new THREE.CylinderGeometry(.18 * B, .29, .62, 24, 1, true), tg, hips, 0, -.33, 0);
    M(tor(.29, .012, 6, 30), bd, hips, 0, -.64, 0).rotation.x = Math.PI / 2;
    for (let k = 0; k < 3; k++) {   // the heavy fold from the left shoulder round the body; the outer fold carries the purple border
      const pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16, a = -1.2 + u * 3.6; pts.push(new THREE.Vector3(Math.sin(a) * (.2 * B + .015 * k), .48 - u * .52 + k * .03, Math.cos(a) * (.14 * B + .012 * k))); }
      M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, .035 - k * .006, 8), k === 0 ? bd : tg, spine);
    }
    const back = M(new THREE.CylinderGeometry(.2, .26, .55, 16, 1, true, Math.PI * .6, Math.PI * .8), tg, spine, 0, .18, -.01);
  }
  if (L.armor) {
    const am = mat(L.armor, { r: .28, m: .75 });
    M(sph(1, 24, 16), am, spine, 0, .3, .005).scale.set(.2, .24, .14);
    for (const s of [-1, 1]) M(sph(1, 14, 10), am, spine, s * .075, .37, .1).scale.set(.08, .055, .045);
    M(tor(.165 * B, .014, 6, 28), am, spine, 0, .07, 0).rotation.x = Math.PI / 2;
    for (const s of [-1, 1]) M(sph(1, 16, 10), am, spine, s * .19, .44, 0).scale.set(.09, .05, .08);
    if (L.pteruges) { const pm = mat('#7A2A1E', { r: .8 }); for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const st = M(box(.05, .2, .012), pm, hips, Math.sin(a) * .2, -.1, Math.cos(a) * .15); st.rotation.y = a; } }
  }
  if (L.cape) { const cp = M(new THREE.CylinderGeometry(.21, .34, 1.0, 18, 1, true, Math.PI * .58, Math.PI * .84), mat(L.cape, { r: .85, side: THREE.DoubleSide }), spine, 0, -.03, -.02); }
  if (L.cloak) { const cp = M(new THREE.CylinderGeometry(.22, .4, 1.15, 18, 1, true, Math.PI * .4, Math.PI * 1.2), mat(L.cloak, { r: .85, side: THREE.DoubleSide }), spine, 0, -.1, -.01); }
  // neck + head (≈ 1/7 of the height)
  M(cyl(.047, .056, .09, 12), skin, spine, 0, .5, 0);
  const head = G(); head.position.set(0, .55, .012); spine.add(head);
  M(sph(.106, 32, 24), skin, head, 0, .115, 0).scale.set(.95, 1.1, 1.0);
  M(sph(.07, 24, 16), skin, head, 0, .062, .018).scale.set(.95, .85, .95);
  for (const s of [-1, 1]) M(sph(.02, 10, 8), mat('#EE9E90', { r: .9 }), head, s * .058, .09, .082).scale.set(1, .55, .3);   // cheeks
  for (const s of [-1, 1]) M(sph(.025, 10, 8), skin, head, s * .1, .1, 0).scale.set(.5, 1, .8);
  const nose = M(new THREE.ConeGeometry(.02, .05, 10), skin, head, 0, .098, .106); nose.rotation.x = Math.PI / 2 + .35; M(sph(.014, 10, 8), skin, head, 0, .084, .118);
  const eyes = [], brows = [], lids = [];
  for (const s of [-1, 1]) {
    const e = G(); e.position.set(s * .038, .122, .088); head.add(e);
    M(sph(.02, 14, 10), mat('#FBF8F2', { r: .2 }), e).scale.set(1.15, .9, .6);
    M(sph(.0115, 12, 8), mat('#4A3020', { r: .3 }), e, 0, -.001, .0098);
    M(sph(.0062, 8, 6), ink, e, 0, -.001, .0145);
    M(sph(.0032, 6, 4), mat('#ffffff', { e: '#ffffff', ei: .5 }), e, .0035, .0035, .018);
    const lid = M(new THREE.SphereGeometry(.0222, 14, 8, 0, Math.PI * 2, 0, Math.PI * .5), skin, e, 0, .001, 0); lid.scale.set(1.12, 1, .72); lids.push(lid);
    eyes.push(e);
    const b = M(cap(.0075, .036, 6), mat(L.hair ?? L.beard ?? '#4A362A', { r: .9 }), head, s * .04, .153, .095); brows.push(b);
  }
  const mouth = G(); mouth.position.set(0, .058, .09); head.add(mouth);
  const lips = M(cap(.0075, .036, 6), mat('#B8574C', { r: .55 }), mouth);
  const mouthO = M(sph(.019, 12, 8), mat('#5A1E1E', { r: .5 }), mouth, 0, -.004, .002);
  if (L.hair && L.head !== 'helmet') {
    const h = M(new THREE.SphereGeometry(.11, 28, 14, 0, Math.PI * 2, 0, Math.PI * .5), mat(L.hair, { r: .95 }), head, 0, .135, -.014); h.scale.set(1, 1.15, 1.08); h.rotation.x = -.55;
    for (let i = 0; i < 9; i++) { const a = -1.2 + i * .3; M(sph(.02, 8, 6), mat(L.hair, { r: .95 }), head, Math.sin(a) * .09, .2 - Math.abs(a) * .02, Math.cos(a) * .06 - .01).scale.set(1, .55, .8); }
    for (const s of [-1, 1]) M(sph(.03, 10, 8), mat(L.hair, { r: .95 }), head, s * .095, .125, -.02).scale.set(.45, 1, 1);
  }
  if (L.beard) M(new THREE.SphereGeometry(.086, 22, 12, 0, Math.PI * 2, Math.PI * .5, Math.PI * .5), mat(L.beard, { r: .95 }), head, 0, .072, .018).scale.set(1.04, 1.05, 1.08);
  let crown = null;
  if (L.head === 'laurel') { crown = laurel(C.green, .108, 24, .035); crown.position.y = .175; crown.rotation.x = -.15; head.add(crown); }
  if (L.head === 'helmet') {
    const hm = mat(L.helmetCol ?? C.gold, { r: .28, m: .75 });
    M(new THREE.SphereGeometry(.122, 28, 14, 0, Math.PI * 2, 0, Math.PI * .52), hm, head, 0, .135, -.005).scale.set(1, 1.08, 1.08);
    M(tor(.12, .01, 6, 30), hm, head, 0, .13, -.005).rotation.x = Math.PI / 2;
    const ng = M(new THREE.CylinderGeometry(.12, .14, .05, 20, 1, true, Math.PI * .7, Math.PI * .6), mat(L.helmetCol ?? C.gold, { r: .28, m: .75, side: THREE.DoubleSide }), head, 0, .1, -.01);
    for (const s of [-1, 1]) M(box(.012, .075, .06, .006), hm, head, s * .108, .075, .03).rotation.z = s * .1;
    const crest = G(); crest.position.set(0, .27, -.005); head.add(crest);
    const cm = mat(L.crest, { r: .95 });
    for (let i = 0; i < 11; i++) { const a = -1.2 + i * .24; const q = M(box(.022, .07, .028, .008), cm, crest, 0, Math.cos(a) * .035, Math.sin(a) * .1); q.rotation.x = a; }
  }
  const arm = s => {
    const sh = G(); sh.position.set(s * .2, .43, 0); spine.add(sh);
    limb(.052, .042, .27, tun, sh);
    const el = G(); el.position.y = -.27; sh.add(el);
    limb(.04, .032, .25, skin, el);
    const hand = G(); hand.position.y = -.26; el.add(hand);
    M(box(.07, .085, .03, .012), skin, hand, 0, -.035, 0);
    M(box(.066, .055, .026, .012), skin, hand, 0, -.09, .004).rotation.x = .25;
    M(cap(.011, .03, 6), skin, hand, -s * .038, -.03, .015).rotation.z = -s * .6;
    if (L.ring && s > 0) M(tor(.014, .005, 6, 12), mat(C.gold, { m: .8, r: .25 }), hand, .02, -.07, 0).rotation.x = Math.PI / 2;
    return { sh, el, hand };
  };
  const leg = s => {
    const hp = G(); hp.position.set(s * .09, -.04, 0); hips.add(hp);
    limb(.068, .05, .42, skin, hp);
    const kn = G(); kn.position.y = -.42; hp.add(kn);
    limb(.05, .036, .42, skin, kn);
    const ft = G(); ft.position.y = -.44; kn.add(ft);
    M(box(.085, .045, .22, .02), mat('#7A4A2A', { r: .8 }), ft, 0, -.012, .05);
    for (let i = 0; i < 3; i++) M(tor(.04 - i * .002, .006, 4, 12), mat('#6B3F1F'), kn, 0, -.3 - i * .045, 0).rotation.x = Math.PI / 2;
    return { hp, kn, ft };
  };
  const aL = arm(-1), aR = arm(1), lL = leg(-1), lR = leg(1);
  const props = G(); props.position.y = -.06; aR.hand.add(props);
  const propsL = G(); propsL.position.y = -.06; aL.hand.add(propsL);
  const p = { P, root, hips, spine, head, eyes, brows, lids, lips, mouthO, aL, aR, lL, lR, props, propsL, crown, look: L };
  setPose(p, POSE.stand);
  return p;
}

// ---------- props (attached to a hand: they hang along the forearm direction, −y) ----------
export function spear(len = 2.3) { const g = G(); M(cyl(.013, .013, len, 8), C.woodD, g, 0, len / 2 - .6, 0); M(new THREE.ConeGeometry(.03, .16, 8), mat(C.steel, { m: .75, r: .3 }), g, 0, len - .52, 0); return g; }
export function shield() {
  const g = G(); M(new THREE.CylinderGeometry(.5, .5, 1.0, 24, 1, true, -.6, 1.2), mat(C.red, { side: THREE.DoubleSide, r: .6 }), g, 0, 0, -.46);
  M(sph(.06, 12, 8), mat(C.gold, { m: .75, r: .28 }), g, 0, 0, .05);
  for (const y of [-.35, .35]) M(box(.55, .035, .02), mat(C.gold, { m: .75, r: .28 }), g, 0, y, .03);
  for (const x of [-.18, .18]) M(box(.035, .5, .02), mat(C.gold, { m: .75, r: .28 }), g, x, 0, .025).rotation.z = x > 0 ? .5 : -.5;
  return g;
}
// a bid paddle; its number is a label that always faces the camera (faceLabels)
export function paddle(text, col = '#FFF4DF') {
  const g = G(); M(cyl(.012, .012, .32, 8), C.wood, g, 0, -.16, 0);
  M(cyl(.15, .15, .02, 28), mat(col), g, 0, -.45, 0).rotation.x = Math.PI / 2;
  const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFrom(textCanvas([{ text, size: 150, y: 128, color: '#1E1A1C' }], { w: 512, h: 256 })), transparent: true }));
  lab.scale.set(.27, .135, 1); lab.position.set(0, -.45, 0); lab.userData.faceOffset = .09; lab.userData.home = lab.position.clone(); g.add(lab); g.userData.label = lab;
  return g;
}
export function gavel() { const g = G(); M(cyl(.014, .014, .3, 8), C.wood, g, 0, -.1, 0); M(cyl(.045, .045, .15, 14), C.woodD, g, 0, -.26, 0).rotation.z = Math.PI / 2; return g; }
export function scroll() { const g = G(); M(cyl(.03, .03, .32, 12), mat('#F2E6C8'), g, 0, -.06, .03).rotation.z = Math.PI / 2; return g; }
// keep camera-facing labels just in front of their paddle, towards the camera
const _w = new THREE.Vector3(), _c = new THREE.Vector3();
export function faceLabels(root, camera) {
  root.updateMatrixWorld(true);
  root.traverse(o => { if (!o.isSprite || !o.userData.faceOffset || !o.visible) return; o.position.copy(o.userData.home); o.updateMatrixWorld(); o.getWorldPosition(_w); camera.getWorldPosition(_c); _w.add(_c.sub(_w).normalize().multiplyScalar(o.userData.faceOffset)); o.parent.worldToLocal(_w); o.position.copy(_w); });
}

// ---------- poses (degrees): sp [bendX, sideZ], hd [x, y, z], aL/aR [shoulderX, shoulderZ, elbow], lL/lR [hipX, knee], y = hip drop ----------
export const POSE = {
  stand: { sp: [0, 0], hd: [0, 0, 0], aL: [4, -6, 8], aR: [4, 6, 8], lL: [0, 0], lR: [0, 0], y: 0 },
  attention: { sp: [-2, 0], hd: [-3, 0, 0], aL: [0, -3, 4], aR: [0, 3, 4], lL: [0, 0], lR: [0, 0], y: 0 },
  cheer: { sp: [-6, 0], hd: [-12, 0, 0], aL: [-10, -150, 20], aR: [-10, 150, 20], lL: [0, 0], lR: [0, 0], y: 0, face: 'happy' },
  raiseR: { sp: [-4, 4], hd: [-10, 0, 4], aL: [8, -8, 12], aR: [-10, 165, 8], lL: [0, 0], lR: [0, 0], y: 0, face: 'shout' },
  point: { sp: [3, 0], hd: [0, 0, 0], aL: [5, -8, 10], aR: [-85, 12, 5], lL: [0, 0], lR: [0, 0], y: 0, face: 'shout' },
  shock: { sp: [-8, 0], hd: [-10, 0, 0], aL: [-25, -55, 70], aR: [-25, 55, 70], lL: [0, 0], lR: [0, 0], y: 0, face: 'shock' },
  sit: { sp: [0, 0], hd: [0, 0, 0], aL: [-38, -10, 50], aR: [-38, 10, 50], lL: [-88, 88], lR: [-88, 88], y: -.4 },
  sitProud: { sp: [-5, 0], hd: [-8, 0, 0], aL: [-38, -10, 50], aR: [-60, 20, 60], lL: [-88, 88], lR: [-88, 88], y: -.4, face: 'happy' },
  sitScared: { sp: [12, 0], hd: [8, 0, 0], aL: [-75, -35, 115], aR: [-75, 35, 115], lL: [-100, 115], lR: [-100, 115], y: -.4, face: 'scared' },
  hold: { sp: [0, 0], hd: [0, 0, 0], aL: [-10, -20, 70], aR: [-18, 8, 75], lL: [0, 0], lR: [0, 0], y: 0 },
  holdBoth: { sp: [-3, 0], hd: [-8, 0, 0], aL: [-160, -14, 8], aR: [-160, 14, 8], lL: [0, 0], lR: [0, 0], y: 0, face: 'shout' },
  clap: { sp: [0, 0], hd: [0, 0, 0], aL: [-55, -8, 70], aR: [-55, 8, 70], lL: [0, 0], lR: [0, 0], y: 0, face: 'happy' },
  shrug: { sp: [0, 0], hd: [0, 0, 8], aL: [0, -40, 95], aR: [0, 40, 95], lL: [0, 0], lR: [0, 0], y: 0, face: 'meh' },
  hammer: { sp: [8, 0], hd: [8, 0, 0], aL: [4, -6, 8], aR: [-75, 8, 30], lL: [0, 0], lR: [0, 0], y: 0, face: 'shout' },
  hammerUp: { sp: [-4, 0], hd: [-6, 0, 0], aL: [4, -6, 8], aR: [-165, 8, 35], lL: [0, 0], lR: [0, 0], y: 0, face: 'shout' },
  fistUp: { sp: [-4, 0], hd: [-10, 0, 0], aL: [4, -6, 8], aR: [-150, 15, 50], lL: [0, 0], lR: [0, 0], y: 0, face: 'shout' },
};
const FACE = {
  calm: { brow: 0, browY: 0, open: 0, lid: .3, smile: 0 }, happy: { brow: -10, browY: .004, open: 0, lid: .35, smile: 1 },
  shout: { brow: 14, browY: -.003, open: 1, lid: .1, smile: 0 }, shock: { brow: -18, browY: .01, open: 1.2, lid: 0, smile: 0 },
  scared: { brow: -24, browY: .008, open: .8, lid: 0, smile: -1 }, meh: { brow: 8, browY: 0, open: 0, lid: .5, smile: -.5 },
  angry: { brow: 26, browY: -.004, open: 0, lid: .3, smile: -1 }, smug: { brow: -6, browY: .002, open: 0, lid: .5, smile: 1 },
};
const lerp = (a, b, u) => a + (b - a) * u;
export function mixPose(a, b, u) {
  const r = { face: u < .5 ? a.face : b.face };
  for (const k of ['sp', 'hd', 'aL', 'aR', 'lL', 'lR']) r[k] = a[k].map((v, i) => lerp(v, b[k][i], u));
  r.y = lerp(a.y, b.y, u); return r;
}
export function setPose(p, q, faceOverride, blink = 0) {
  p.spine.rotation.set(q.sp[0] * D2R, 0, q.sp[1] * D2R);
  p.head.rotation.set(q.hd[0] * D2R, q.hd[1] * D2R, q.hd[2] * D2R);
  for (const [a, v] of [[p.aL, q.aL], [p.aR, q.aR]]) { a.sh.rotation.set(v[0] * D2R, 0, v[1] * D2R); a.el.rotation.set(-v[2] * D2R, 0, 0); }
  for (const [l, v] of [[p.lL, q.lL], [p.lR, q.lR]]) { l.hp.rotation.set(v[0] * D2R, 0, 0); l.kn.rotation.set(v[1] * D2R, 0, 0); l.ft.rotation.set(-(v[0] + v[1]) * D2R * .6, 0, 0); }
  p.hips.position.y = .94 + q.y;
  const f = FACE[faceOverride ?? q.face ?? 'calm'];
  p.brows.forEach((b, i) => { b.rotation.set(0, 0, Math.PI / 2 + (i ? -1 : 1) * f.brow * D2R); b.position.y = .153 + f.browY; });
  p.lids.forEach(l => { const c = Math.min(1, f.lid + blink); l.rotation.x = lerp(-1.65, .05, c); });
  p.mouthO.visible = f.open > .05; p.mouthO.scale.set(1.1, 1.2 * Math.max(f.open, .05), .5);
  p.lips.visible = f.open <= .05; p.lips.rotation.set(0, 0, Math.PI / 2 + f.smile * .12); p.lips.scale.set(1, 1 + .3 * Math.abs(f.smile), 1);
}
export function walkPose(base, ph, amp = 1) {
  const s = Math.sin(ph * Math.PI * 2), c = Math.cos(ph * Math.PI * 2), q = JSON.parse(JSON.stringify(base));
  q.lL = [-26 * s * amp, Math.max(0, 38 * c * amp) + 4]; q.lR = [26 * s * amp, Math.max(0, -38 * c * amp) + 4];
  q.aL[0] = base.aL[0] + 26 * s * amp; q.aR[0] = base.aR[0] - 26 * s * amp;
  q.y = -.02 * Math.abs(c) * amp; q.sp[1] = 2.5 * s; return q;
}
export const blinkAt = (t, seed = 0) => { const ph = (t * .41 + seed * .61) % 1; return ph > .965 ? 1 : 0; };
