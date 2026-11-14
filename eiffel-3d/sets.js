// sets.js · the places of the story, each a Group far from the others; only the active one is visible.
import * as THREE from 'three';
import { mat, C, G, M, box, sph, cyl, cap, tor, laurel, textPlane, texFrom, rng } from './kit.js';
import { makePerson, LOOK } from './person.js';

function canvasTex(w, h, draw, rep = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = texFrom(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); return t;
}
const checker = (a, b, rep) => canvasTex(256, 256, (g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w, h); g.fillStyle = b; g.fillRect(0, 0, w / 2, h / 2); g.fillRect(w / 2, h / 2, w / 2, h / 2); g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); }, rep);
const paving = (a, rep, seed = 3) => canvasTex(512, 512, (g, w, h) => {
  const R = rng(seed); g.fillStyle = a; g.fillRect(0, 0, w, h);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 6; x++) { const off = (y % 2) * 42; g.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '0,0,0'},${(R() * .07).toFixed(3)})`; g.fillRect(x * 85 + off, y * 64, 83, 62); }
  g.strokeStyle = 'rgba(70,50,30,.22)'; g.lineWidth = 3; for (let y = 0; y <= 8; y++) { g.beginPath(); g.moveTo(0, y * 64); g.lineTo(w, y * 64); g.stroke(); }
  for (let y = 0; y < 8; y++) for (let x = 0; x <= 6; x++) { const xx = x * 85 + (y % 2) * 42; g.beginPath(); g.moveTo(xx, y * 64); g.lineTo(xx, y * 64 + 64); g.stroke(); }
}, rep);
const plane = (w, h, m) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.receiveShadow = true; return p; };

export function column(h = 5, r = .32, col = C.marble) {
  const g = G(), m = mat(col, { r: .5 });
  M(box(r * 2.6, .25, r * 2.6, .04), m, g, 0, .12, 0); M(cyl(r * 1.15, r * 1.25, .2, 24), m, g, 0, .33, 0);
  const shaft = M(cyl(r * .9, r, h - .9, 24), m, g, 0, .43 + (h - .9) / 2, 0);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; M(box(.03, h - 1, .03), mat(C.marbleD), g, Math.cos(a) * r * .93, .43 + (h - .9) / 2, Math.sin(a) * r * .93); }
  M(cyl(r * 1.25, r * .95, .22, 24), m, g, 0, h - .35, 0); M(box(r * 2.8, .22, r * 2.8, .04), m, g, 0, h - .12, 0);
  return g;
}
export function throne() {
  const g = G(), gold = mat(C.gold, { r: .28, m: .7 }), goldD = mat(C.goldD, { r: .3, m: .7 }), pur = mat(C.imperial, { r: .8 });
  M(box(1.3, .5, 1.0, .06), gold, g, 0, .25, 0);
  M(box(1.2, .14, .9, .06), pur, g, 0, .56, .02);
  const back = M(box(1.3, 1.9, .2, .08), gold, g, 0, 1.4, -.45);
  const crestTop = M(cyl(.65, .65, .2, 32, false), gold, g, 0, 2.35, -.45); crestTop.rotation.x = Math.PI / 2; crestTop.scale.set(1, 1, .6);
  M(box(.95, 1.4, .06, .05), pur, g, 0, 1.4, -.33);
  for (const s of [-1, 1]) { M(box(.16, .5, .9, .05), goldD, g, s * .66, .8, 0); M(sph(.13, 14, 10), gold, g, s * .66, 1.08, .4); }
  for (const s of [-1, 1]) for (const z of [-.4, .4]) M(box(.12, .25, .12, .03), goldD, g, s * .55, .05, z);
  const star = M(new THREE.OctahedronGeometry(.18), gold, g, 0, 2.75, -.45); star.scale.set(1, 1.3, .4);
  return g;
}
function brazier() {
  const g = G(); M(cyl(.08, .12, 1.0, 12), mat(C.goldD, { m: .6, r: .35 }), g, 0, .5, 0); M(cyl(.35, .18, .25, 20), mat(C.goldD, { m: .6, r: .35 }), g, 0, 1.1, 0);
  const fm = mat('#FF9A2E', { e: '#FF7A1A', ei: 2.2 }), fm2 = mat('#FFE07A', { e: '#FFD34A', ei: 2.5 });
  const f1 = M(new THREE.ConeGeometry(.24, .6, 10), fm, g, 0, 1.5, 0), f2 = M(new THREE.ConeGeometry(.13, .4, 10), fm2, g, 0, 1.45, .02);
  f1.castShadow = f2.castShadow = false;
  const light = new THREE.PointLight('#FF9A4A', 6, 9, 2); light.position.y = 1.7; g.add(light);
  g.userData.anim = t => { const k = 1 + .12 * Math.sin(t * 17) + .08 * Math.sin(t * 29); f1.scale.set(1, k, 1); f2.scale.set(1, 2 - k, 1); light.intensity = 5 + 2 * k; };
  return g;
}
function banner(col, emblem = true) {
  const g = G();
  const tex = canvasTex(256, 512, (c, w, h) => {
    c.fillStyle = col; c.fillRect(0, 0, w, h); c.fillStyle = C.gold; c.fillRect(0, 20, w, 14); c.fillRect(0, h - 70, w, 14);
    if (emblem) { c.beginPath(); c.arc(w / 2, h * .42, 70, 0, Math.PI * 2); c.lineWidth = 16; c.strokeStyle = C.gold; c.stroke(); c.font = '700 64px Fredoka'; c.fillStyle = C.gold; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('SPQR', w / 2, h * .42 + 4); }
    c.fillStyle = col; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(i * 64, h); c.lineTo(i * 64 + 32, h - 40); c.lineTo(i * 64 + 64, h); c.fill(); }
  });
  const p = M(new THREE.PlaneGeometry(1.4, 2.8, 1, 8), new THREE.MeshStandardMaterial({ map: tex, roughness: .9, side: THREE.DoubleSide }), g);
  const pos = p.geometry.attributes.position; for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getY(i) * 3) * .03);
  p.geometry.computeVertexNormals();
  M(cyl(.04, .04, 1.7, 8), C.goldD, g, 0, 1.45, .02).rotation.z = Math.PI / 2;
  return g;
}

// ======================= THE PALACE THRONE ROOM =======================
export function palace() {
  const g = G(); g.name = 'palace';
  const floor = plane(40, 40, new THREE.MeshStandardMaterial({ map: checker('#E9DCC6', '#C98F6E', [20, 20]), roughness: .35, metalness: .05 }));
  floor.rotation.x = -Math.PI / 2; g.add(floor);
  const fresco = canvasTex(2048, 720, (c, w, h) => {
    c.fillStyle = '#E9C48C'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#9E2B25'; c.fillRect(0, h * .2, w, h * .62);
    c.fillStyle = '#2A1A16'; c.fillRect(0, h * .82, w, h * .18);
    c.fillStyle = '#E2A93B'; c.fillRect(0, h * .2, w, 10); c.fillRect(0, h * .82 - 10, w, 10);
    for (let i = 0; i < 9; i++) { const x = 40 + i * 226; c.strokeStyle = '#E2A93B'; c.lineWidth = 8; c.strokeRect(x, h * .27, 190, h * .48);
      c.fillStyle = '#B63A2E'; c.fillRect(x + 14, h * .27 + 14, 162, h * .48 - 28);
      c.beginPath(); c.arc(x + 95, h * .5, 34, 0, Math.PI * 2); c.strokeStyle = '#F0C55A'; c.lineWidth = 6; c.stroke();
      c.fillStyle = '#F0C55A'; c.beginPath(); c.moveTo(x + 95, h * .5 - 22); c.lineTo(x + 110, h * .5); c.lineTo(x + 95, h * .5 + 22); c.lineTo(x + 80, h * .5); c.fill(); }
    c.fillStyle = '#C8B48E'; for (let x = 0; x < w; x += 64) c.fillRect(x, 10, 40, 22);
  });
  const wall = plane(40, 14, new THREE.MeshStandardMaterial({ map: fresco, roughness: .85 })); wall.position.set(0, 7, -9); g.add(wall);
  for (const s of [-1, 1]) { const sw = plane(30, 14, mat('#E2B87C', { r: .85 })); sw.rotation.y = -s * Math.PI / 2; sw.position.set(s * 9, 7, 3); g.add(sw); }
  M(box(40, .5, .6), C.marbleD, g, 0, 9.3, -8.7); M(box(40, .3, .4), C.marble, g, 0, 1.0, -8.8);
  // arched windows (emissive sky) on the back wall
  for (const x of [-5.5, 5.5]) {
    const w = M(box(1.6, 3.2, .1), mat('#BFE3FF', { e: '#BFE3FF', ei: 1.1 }), g, x, 6.2, -8.95); w.castShadow = false;
    const a = M(cyl(.8, .8, .1, 24), mat('#BFE3FF', { e: '#BFE3FF', ei: 1.1 }), g, x, 7.8, -8.95); a.rotation.x = Math.PI / 2; a.castShadow = false;
  }
  for (const x of [-7, -3.2, 3.2, 7]) for (const z of [-6.5, -2, 2.5]) { const c = column(8.6, .38); c.position.set(x, 0, z); g.add(c); }
  // dais + steps + carpet
  for (let i = 0; i < 3; i++) M(box(6 - i * 1.2, .25, 3.4 - i * .6, .03), C.marble, g, 0, .125 + i * .25, -6.2 + i * .3);
  const carpet = plane(2.2, 14, mat(C.red, { r: .95 })); carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, .012, 1.5); g.add(carpet);
  for (const s of [-1, 1]) { const tr = plane(.18, 14, mat(C.gold, { r: .5, m: .3 })); tr.rotation.x = -Math.PI / 2; tr.position.set(s * 1.05, .014, 1.5); g.add(tr); }
  const th = throne(); th.position.set(0, .75, -6.3); g.add(th); g.userData.throne = th;
  for (const x of [-2.3, 2.3]) { const b = banner(C.imperial); b.position.set(x, 4.6, -8.85); g.add(b); }
  for (const x of [-5.6, 5.6]) { const b = banner(C.red); b.position.set(x, 4.2, -8.85); g.add(b); }
  const brz = []; for (const x of [-2.6, 2.6]) { const b = brazier(); b.position.set(x, 0, -4.6); g.add(b); brz.push(b); }
  // the front wall with tall double doors (they burst open towards the room)
  const fw = new THREE.MeshStandardMaterial({ map: fresco, roughness: .85, side: THREE.DoubleSide });
  for (const s of [-1, 1]) { const p = plane(17.6, 14, fw); p.position.set(s * 11.2, 7, 9); p.rotation.y = Math.PI; g.add(p); }
  const top = plane(4.8, 7.4, fw); top.position.set(0, 10.3, 9); top.rotation.y = Math.PI; g.add(top);
  const doors = []; for (const s of [-1, 1]) { const hinge = G(); hinge.position.set(s * 2.4, 0, 8.95); g.add(hinge);
    M(box(2.4, 6.6, .18, .03), mat('#6B3A1E', { r: .7 }), hinge, -s * 1.2, 3.3, 0);
    for (let i = 0; i < 3; i++) M(box(1.9, .1, .22), mat(C.gold, { m: .6, r: .35 }), hinge, -s * 1.2, 1 + i * 2.2, 0);
    M(sph(.12, 12, 8), mat(C.gold, { m: .7, r: .3 }), hinge, -s * .25, 3.2, -.14); doors.push(hinge); }
  g.userData.doors = doors;
  const doorLight = new THREE.SpotLight('#FFE3B0', 0, 30, .55, .5, 1.2); doorLight.position.set(0, 4, 14); doorLight.target.position.set(0, 0, 0); g.add(doorLight, doorLight.target); g.userData.doorLight = doorLight;
  const outside = M(box(4.8, 6.6, .1), mat('#FFE6B8', { e: '#FFE6B8', ei: 1.6 }), g, 0, 3.3, 9.6); outside.castShadow = false; g.userData.outside = outside;
  // the day tablet beside the throne
  const tab = G(); tab.position.set(1.85, 0, -5.1); tab.rotation.y = -.3; g.add(tab); g.userData.tablet = tab;
  M(box(.12, 1.6, .12), C.woodD, tab, -.5, .8, -.2); M(box(.12, 1.6, .12), C.woodD, tab, .5, .8, -.2);
  M(box(1.4, 1.2, .12, .04), mat('#8E8173', { r: .9 }), tab, 0, 1.9, 0);
  const tp = textPlane([{ text: 'DAY', size: 120, y: 120, color: '#F4E9D2' }, { text: '1', size: 300, y: 330, color: '#FFD57A' }], 1.25, 1.05, { w: 600, h: 500 });
  tp.position.set(0, 1.9, .07); tab.add(tp); g.userData.tabletText = tp;
  g.userData.anim = t => brz.forEach(b => b.userData.anim(t));
  return g;
}

// ======================= THE FORUM AUCTION STAGE (dusk) =======================
export function forum() {
  const g = G(); g.name = 'forum';
  const ground = plane(80, 80, new THREE.MeshStandardMaterial({ map: paving('#D9C6A0', [16, 16]), roughness: .9 })); ground.rotation.x = -Math.PI / 2; g.add(ground);
  // temple at the back
  const tp = G(); tp.position.set(0, 0, -16); g.add(tp);
  M(box(14, 1.2, 6), C.marble, tp, 0, .6, 0); for (let i = 0; i < 3; i++) M(box(14.6 - i * .3, .3, 6.6 - i * .3), C.marbleD, tp, 0, .15 + i * .3, 3.2);
  for (let i = 0; i < 6; i++) { const c = column(6, .38); c.position.set(-5.5 + i * 2.2, 1.2, 2.2); tp.add(c); }
  M(box(14, .8, 5.5), C.marble, tp, 0, 7.6, .4);
  const ped = new THREE.Shape(); ped.moveTo(-7.2, 0); ped.lineTo(7.2, 0); ped.lineTo(0, 2.6); ped.lineTo(-7.2, 0);
  M(new THREE.ExtrudeGeometry(ped, { depth: 1, bevelEnabled: false }), C.marble, tp, 0, 8, 2.1);
  M(box(10, 5.5, .5), '#E3C79A', tp, 0, 4.2, -.5);
  // houses with terracotta roofs at the sides
  const R = rng(7);
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
    const h = 3 + R() * 3, w = 3 + R() * 2, d = 3 + R() * 1.5, hx = G(); hx.position.set(s * (9 + R() * 2), 0, -10 + i * 5.5); g.add(hx);
    M(box(w, h, d, .05), ['#E9C99A', '#E6B48A', '#F0D7AE', '#D9A37A'][i % 4], hx, 0, h / 2, 0);
    const roof = M(new THREE.CylinderGeometry(.01, w * .75, 1.2, 4, 1), C.terracotta, hx, 0, h + .6, 0); roof.rotation.y = Math.PI / 4; roof.scale.z = d / w;
    for (let k = 0; k < 2; k++) { const wd = M(box(.5, .7, .05), mat('#4A2E1F'), hx, -w / 4 + k * w / 2, h * .6, d / 2 + .01); wd.castShadow = false; }
  }
  // the auction stage
  const st = G(); g.add(st); g.userData.stage = st;
  M(box(7, .9, 3.6, .05), C.wood, st, 0, .45, 0);
  for (let i = 0; i < 26; i++) { const f = M(cyl(.14, .14, .9, 10), mat(C.red, { r: .9 }), st, -3.4 + i * .27, .45, 1.82); f.castShadow = false; }
  M(box(7.1, .14, .2), C.gold, st, 0, .9, 1.85);
  for (let i = 0; i < 3; i++) M(box(1.6, .3, .5), C.woodD, st, 0, .15 + i * .3, 2.4 - i * .35);
  // pedestal with the crown
  const pd = G(); pd.position.set(0, .9, -.2); st.add(pd); g.userData.pedestal = pd;
  M(cyl(.45, .55, 1.1, 24), C.marble, pd, 0, .55, 0); M(cyl(.6, .6, .12, 24), C.marbleD, pd, 0, 1.12, 0);
  const cush = M(sph(.55, 24, 12), mat(C.imperial, { r: .8 }), pd, 0, 1.3, 0); cush.scale.set(1, .32, 1);
  const crown = laurel(C.gold, .38, 26, .12); crown.position.set(0, 1.5, 0); crown.rotation.x = .15; pd.add(crown); g.userData.crown = crown;
  const tag = textPlane([{ text: 'LOT 1', size: 70, y: 70, color: C.red }, { text: 'ROME', size: 120, y: 175, color: C.ink }, { text: '???', size: 80, y: 280, color: C.ink }], .8, .7, { w: 512, h: 400, bg: '#FFF4DF', round: 40 });
  tag.position.set(.95, 1.1, .35); tag.rotation.set(0, -.25, .15); pd.add(tag); g.userData.tag = tag;
  // lantern strings
  const lm = mat('#FFC66B', { e: '#FFB347', ei: 1.8 });
  for (let i = 0; i < 18; i++) { const x = -8 + i * .95, y = 6.2 - Math.sin(i / 17 * Math.PI) * 1.4; const l = M(sph(.13, 10, 8), lm, g, x, y, -3); l.castShadow = false; }
  const strand = new THREE.CatmullRomCurve3(Array.from({ length: 18 }, (_, i) => new THREE.Vector3(-8 + i * .95, 6.32 - Math.sin(i / 17 * Math.PI) * 1.4, -3)));
  M(new THREE.TubeGeometry(strand, 60, .015, 4), C.ink, g).castShadow = false;
  for (const x of [-4.4, 4.4]) { const b = banner(C.red); b.position.set(x, 3.4, -1.5); b.scale.setScalar(.9); g.add(b); }
  return g;
}

// a cheap crowd: instanced bodies + heads + optional raised paddles, around a stage
export function crowd(n, spots, colors, seed = 1) {
  const g = G(), R = rng(seed);
  const body = new THREE.InstancedMesh(cap(.17, .95, 12), new THREE.MeshStandardMaterial({ roughness: .7 }), n);
  const head = new THREE.InstancedMesh(sph(.11, 16, 12), mat('#E2AE86'), n);
  const hair = new THREE.InstancedMesh(new THREE.SphereGeometry(.118, 16, 8, 0, Math.PI * 2, 0, Math.PI * .5), mat(C.hairD, { r: .9 }), n);
  const pad = new THREE.InstancedMesh(cyl(.15, .15, .02, 18), mat('#FFF4DF'), n);
  for (const im of [body, head, hair, pad]) { im.castShadow = true; im.receiveShadow = true; g.add(im); }
  const items = [];
  for (let i = 0; i < n; i++) { const [x, z] = spots(i, R); items.push({ x, z, ph: R(), col: new THREE.Color(colors[Math.floor(R() * colors.length)]), raise: R(), sc: .9 + R() * .2 }); body.setColorAt(i, items[i].col); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  g.userData.update = (t, o = {}) => {
    items.forEach((it, i) => {
      const hop = o.hop ? Math.abs(Math.sin((t * 2 + it.ph) * Math.PI)) * .12 * o.hop : 0, y = hop;
      sc.setScalar(it.sc); e.set(0, 0, 0); q.setFromEuler(e);
      m4.compose(v.set(it.x, (.66 + y) * it.sc, it.z), q, sc); body.setMatrixAt(i, m4);
      m4.compose(v.set(it.x, (1.42 + y) * it.sc, it.z), q, sc); head.setMatrixAt(i, m4);
      e.set(-.3, 0, 0); q.setFromEuler(e); m4.compose(v.set(it.x, (1.45 + y) * it.sc, it.z - .01), q, sc); hair.setMatrixAt(i, m4);
      const up = (o.paddles ?? 0) > it.raise; e.set(Math.PI / 2, 0, 0); q.setFromEuler(e);
      m4.compose(v.set(it.x + .22, up ? (1.95 + y) * it.sc : -5, it.z + .05), q, sc); pad.setMatrixAt(i, m4);
    });
    for (const im of [body, head, hair, pad]) im.instanceMatrix.needsUpdate = true;
  };
  g.userData.update(0);
  return g;
}

// sky dome: vertical gradient + sun glow (no lighting)
export function skyDome(top, horizon, sunDir = new THREE.Vector3(0, .2, -1), sunCol = '#FFE2A8') {
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { top: { value: new THREE.Color(top) }, hor: { value: new THREE.Color(horizon) }, sd: { value: sunDir.clone().normalize() }, sc: { value: new THREE.Color(sunCol) } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'varying vec3 vD; uniform vec3 top, hor, sc, sd; void main(){ float h = clamp(vD.y * 1.6 + .05, 0., 1.); vec3 c = mix(hor, top, pow(h, .7)); float s = max(dot(normalize(vD), sd), 0.); c += sc * (pow(s, 60.) * 1.2 + pow(s, 6.) * .25); gl_FragColor = vec4(c, 1.); }' });
  const s = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), m); s.frustumCulled = false; return s;
}
