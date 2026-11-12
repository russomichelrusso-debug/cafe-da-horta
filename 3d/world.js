// ===== Café da Horta 3D — mundo 3D ligado à mesma lógica do jogo 2D =====
// A lógica (G, EV) e a interface HTML (UI) são as mesmas da versão 2D.
// Este arquivo só desenha o estado do jogo em 3D e troca algumas telas por etiquetas.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// ---------- Renderizador atrás da área da estação ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.id = 'world';
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#bfe6ff');
scene.fog = new THREE.Fog('#bfe6ff', 20, 38);
const camera = new THREE.PerspectiveCamera(40, 770 / 344, 0.1, 100);

function place() {
  const st = document.getElementById('station');
  if (!st) return;
  const r = st.getBoundingClientRect();
  const c = renderer.domElement;
  c.style.left = r.left + 'px'; c.style.top = r.top + 'px';
  renderer.setSize(Math.max(1, r.width), Math.max(1, r.height));
  camera.aspect = r.width / Math.max(1, r.height);
  camera.updateProjectionMatrix();
}
const fit0 = UI.fit.bind(UI);
UI.fit = function () { fit0(); place(); };

// ---------- Materiais toon ----------
const grad = new THREE.DataTexture(new Uint8Array([120, 195, 255]), 3, 1, THREE.RedFormat);
grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
const mats = {};
const M = c => mats[c] || (mats[c] = new THREE.MeshToonMaterial({ color: c, gradientMap: grad }));
const own = c => new THREE.MeshToonMaterial({ color: c, gradientMap: grad }); // material próprio (cor muda)
const sph = (r, w = 20, h = 14) => new THREE.SphereGeometry(r, w, h);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, s = 20) => new THREE.CylinderGeometry(rt, rb, h, s);
const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 5, 14);
const cone = (r, h) => new THREE.ConeGeometry(r, h, 14);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function mesh(geo, color, x = 0, y = 0, z = 0, o = {}) {
  const m = new THREE.Mesh(geo, typeof color === 'string' ? M(color) : color);
  m.position.set(x, y, z);
  if (o.s) m.scale.set(...o.s);
  if (o.r) m.rotation.set(...o.r);
  m.castShadow = o.cast !== false;
  m.receiveShadow = !!o.recv;
  (o.p || scene).add(m);
  return m;
}
const group = (x, y, z, parent = scene) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
function clearGroup(g) { while (g.children.length) g.remove(g.children[0]); }
const tint = (hex, amt = 0.55) => '#' + new THREE.Color(hex).lerp(new THREE.Color('#8a6a3a'), amt).getHexString();

function textTexture(text, bg, fg, w = 512, h = 128, size = 64) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, w, h, 28); g.fill(); }
  g.fillStyle = fg; g.font = `900 ${size}px "Trebuchet MS", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- Luzes ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#c9a37a', 1.7);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff3df', 2.4);
sun.position.set(5, 10, 7);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 9, bottom: -9, near: 1, far: 30 });
sun.shadow.normalBias = 0.03;
scene.add(sun);

// ================= CENÁRIO =================
mesh(box(13, 0.2, 10), '#e7cfa6', -1.5, -0.1, 0, { recv: true, cast: false });
for (let i = 0; i < 6; i++) mesh(box(0.04, 0.01, 10), '#d8bb8c', -7.5 + i * 2.2, 0.005, 0, { cast: false });
mesh(box(12.5, 4.6, 0.25), '#f7e6c8', -1.75, 2.3, -3, { recv: true });
mesh(box(12.5, 0.6, 0.32), '#c98a4b', -1.75, 0.3, -2.95, { recv: true });
mesh(box(0.25, 4.6, 10), '#f3dfbd', -8.1, 2.3, 2, { recv: true });
mesh(box(2.2, 1.5, 0.1), '#ffffff', 2.6, 2.6, -2.85);
mesh(box(1.9, 1.2, 0.12), '#d6f1ff', 2.6, 2.6, -2.82, { cast: false });
const sign = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.75), new THREE.MeshBasicMaterial({ map: textTexture('Café da Horta', '#2f6b3a', '#fff'), transparent: true }));
sign.position.set(-0.6, 3.7, -2.85); scene.add(sign);
mesh(box(2.2, 0.1, 0.45), '#9a6331', -3.6, 2.5, -2.72);
[['#5fb548', -4.3], ['#e3304a', -3.6], ['#f28a1c', -2.9]].forEach(([c, x]) => {
  mesh(cyl(0.16, 0.12, 0.25), '#c96a3a', x, 2.68, -2.7);
  mesh(sph(0.17), c, x, 2.92, -2.7, { s: [1, 0.8, 1] });
});
// balcão
mesh(box(5.6, 1.1, 1.1), '#c98a4b', 0.3, 0.55, 0, { recv: true });
mesh(box(5.8, 0.12, 1.3), '#8a5a30', 0.3, 1.16, 0, { recv: true });
for (let i = 0; i < 6; i++) mesh(box(0.05, 0.9, 0.02), '#b57a3f', -2.2 + i, 0.5, 0.56, { cast: false });
const TOP = 1.22;
mesh(new THREE.SphereGeometry(0.13, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2), '#f2c14e', 2.7, TOP, 0.3);
// pilha de louça suja (evento)
const dirty = group(-1.15, TOP, -0.25);
for (let i = 0; i < 5; i++) mesh(cyl(0.2, 0.17, 0.035), '#c9c3b5', 0, 0.02 + i * 0.04, 0, { p: dirty });
dirty.visible = false;

// cozinha
const kx = -5.4;
mesh(box(2.4, 1, 1.4), '#c98a4b', kx, 0.5, 0, { recv: true });
mesh(box(2.5, 0.08, 1.5), '#e9eef1', kx, 1.03, 0, { recv: true });
mesh(box(1.1, 0.06, 0.7), '#d9a66b', kx, 1.1, 0.1, { recv: true });
const BOARD_Y = 1.13;
mesh(box(1.1, 2.3, 0.8), '#eef5f8', kx - 1.8, 1.15, -2.3, { recv: true });
mesh(box(0.05, 0.6, 0.05), '#9fb3bf', kx - 1.35, 1.5, -1.88);
mesh(box(1.6, 0.9, 0.8), '#d1495b', kx + 1.2, 0.45, -2.4);
mesh(box(1.6, 0.06, 0.8), '#3b3b3b', kx + 1.2, 0.93, -2.4);
mesh(cyl(0.22, 0.2, 0.25), '#b8c3cc', kx + 0.9, 1.08, -2.4);
const knife = group(kx + 0.32, BOARD_Y + 0.02, 0.38);
knife.rotation.y = 0.4;
mesh(box(0.5, 0.02, 0.09), '#d8dde2', 0, 0, 0, { p: knife });
mesh(box(0.22, 0.05, 0.07), '#2fa37a', 0.35, 0, 0, { p: knife });
const onBoard = group(kx - 0.1, BOARD_Y, 0.1);

// horta
mesh(box(10, 0.2, 12), '#8bcf6a', 10, -0.12, 0, { recv: true, cast: false });
for (let i = 0; i < 8; i++) mesh(box(0.12, 0.8, 0.12), '#fffaf3', 5.4 + i * 1.3, 0.4, -3.2);
mesh(box(9.2, 0.08, 0.06), '#fffaf3', 9.95, 0.6, -3.2);
for (const [x, z, s] of [[12.5, -5, 1.2], [6.5, -6, 1], [14.5, -2, 0.9]]) {
  mesh(cyl(0.15, 0.2, 1.4), '#8a5a30', x, 0.7, z);
  mesh(sph(0.9 * s), '#5aa845', x, 1.9 * s, z);
}
const puddle = mesh(cyl(0.9, 0.9, 0.02, 24), '#6fb8ee', 7.9, 0.02, 2.4, { cast: false, s: [1.4, 1, 0.8] });
puddle.visible = false;

// ================= MARIA ALICE =================
const maria = group(-1.0, 0, -1.05);
maria.rotation.y = 0.35;
const P = { p: maria };
mesh(cyl(0.32, 0.6, 1.5, 24), '#8c2738', 0, 0.95, 0, P);
mesh(box(0.56, 0.75, 0.04), '#fffaf3', 0, 1.15, 0.42, { ...P, r: [-0.18, 0, 0] });
mesh(box(0.36, 0.32, 0.04), '#fffaf3', 0, 1.55, 0.35, { ...P, r: [-0.1, 0, 0] });
mesh(sph(0.05), '#e35d6a', 0, 1.56, 0.38, { ...P, s: [1, 0.9, 0.4] });
const armL = group(-0.36, 1.68, 0.02, maria), armR = group(0.36, 1.68, 0.02, maria);
mesh(cap(0.085, 0.55), '#efc3a4', 0, -0.36, 0, { p: armL });
mesh(cap(0.085, 0.55), '#efc3a4', 0, -0.36, 0, { p: armR });
armL.rotation.z = -0.25; armR.rotation.z = 0.25;
mesh(cyl(0.1, 0.12, 0.22), '#efc3a4', 0, 1.8, 0, P);
const head = group(0, 2.22, 0, maria);
const H = { p: head };
mesh(sph(0.42, 28, 20), '#f6d2b8', 0, 0, 0, H);
mesh(cap(0.4, 0.55), '#5b3a25', 0, -0.4, -0.2, { ...H, s: [1.15, 1, 0.6] });
mesh(new THREE.SphereGeometry(0.445, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.52), '#5b3a25', 0, 0.02, -0.02, { ...H, r: [-0.38, 0, 0] });
mesh(sph(0.2), '#6b4329', -0.1, 0.3, 0.28, { ...H, s: [1.7, 0.55, 0.7], r: [0.3, 0, 0.35] });
for (const sx of [-1, 1]) {
  mesh(cap(0.12, 0.75), '#5b3a25', sx * 0.4, -0.38, 0.02, { ...H, r: [0, 0, sx * 0.08] });
  mesh(sph(0.11), '#5b3a25', sx * 0.43, -0.82, 0.04, H);
}
const mEyes = [], mBrows = [];
for (const sx of [-1, 1]) {
  const e = group(sx * 0.15, 0, 0.37, head);
  mesh(sph(0.085), '#ffffff', 0, 0, 0, { p: e, s: [1, 1.15, 0.5], cast: false });
  mesh(sph(0.06), '#7a4524', 0, -0.005, 0.03, { p: e, s: [1, 1.1, 0.5], cast: false });
  mesh(sph(0.032), '#1d120b', 0, -0.005, 0.05, { p: e, cast: false });
  mesh(sph(0.017), '#ffffff', 0.022, 0.03, 0.07, { p: e, cast: false });
  mEyes.push(e);
  mBrows.push(mesh(box(0.15, 0.028, 0.03), '#3b2416', sx * 0.15, 0.16, 0.38, { ...H, r: [0, 0, -sx * 0.12], cast: false }));
  mesh(sph(0.06), '#f3a1a0', sx * 0.25, -0.12, 0.31, { ...H, s: [1.3, 0.7, 0.3], cast: false });
}
mesh(sph(0.03), '#efbf9f', 0, -0.08, 0.42, { ...H, cast: false });
const smile = mesh(new THREE.TorusGeometry(0.07, 0.014, 8, 20, Math.PI), '#b5485a', 0, -0.17, 0.385, { ...H, r: [-0.15, 0, Math.PI], cast: false });

// ================= JADE =================
const JADE_POS = V(-2.0, TOP, 0.15);
const jade = group(JADE_POS.x, JADE_POS.y, JADE_POS.z);
jade.rotation.y = 0.55;
jade.scale.setScalar(1.25);
const jBody = group(0, 0, 0, jade);
const J = { p: jBody };
mesh(sph(0.3), '#d9822b', 0, 0.25, -0.05, { ...J, s: [1, 0.82, 1.35] });
const jHead = group(0, 0, 0, jBody);
const JH = { p: jHead };
mesh(sph(0.24), '#de8a33', 0, 0.3, 0.3, { ...JH, s: [1.05, 0.95, 1] });
mesh(sph(0.1), '#fff6ea', 0, 0.37, 0.49, { ...JH, s: [0.55, 1.6, 0.6], r: [0.45, 0, 0] });
mesh(sph(0.1), '#fff6ea', 0, 0.24, 0.5, { ...JH, s: [1.3, 0.8, 0.8] });
mesh(sph(0.16), '#fff6ea', 0, 0.13, 0.36, { ...J, s: [1.2, 0.9, 0.7] });
const jEyes = [];
for (const sx of [-1, 1]) {
  mesh(sph(0.08), '#c2611f', sx * 0.17, 0.5, 0.22, { ...JH, s: [1.2, 0.6, 0.9], r: [0, 0, sx * 0.5] });
  const e = group(sx * 0.13, 0.36, 0.47, jHead);
  mesh(sph(0.045), '#1d120b', 0, 0, 0, { p: e, cast: false });
  mesh(sph(0.014), '#ffffff', 0.012, 0.02, 0.035, { p: e, cast: false });
  jEyes.push(e);
  mesh(sph(0.05), '#f1a9a0', sx * 0.15, 0.02, 0.25, { ...J, s: [1, 0.5, 1.3] });
  mesh(sph(0.05), '#f1a9a0', sx * 0.15, 0.02, -0.32, { ...J, s: [1, 0.5, 1.3] });
}
mesh(sph(0.025), '#e9888f', 0, 0.28, 0.585, { ...JH, cast: false });
const wPts = [];
for (const sx of [-1, 1]) for (const dy of [-0.02, 0.02]) wPts.push(sx * 0.06, 0.26 + dy, 0.56, sx * 0.3, 0.26 + dy * 3, 0.5);
jHead.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(wPts, 3)),
  new THREE.LineBasicMaterial({ color: '#f7ead8' })));
// acessórios da loja
const ACC = {
  lacinho: group(0, 0, 0, jHead),
  chapeu: group(0, 0, 0, jHead),
  cachecol: group(0, 0, 0, jBody),
};
for (const sx of [-1, 1]) mesh(cone(0.06, 0.12), '#ff6fa5', 0.2 + sx * 0.06, 0.56, 0.18, { p: ACC.lacinho, r: [0, 0, sx * Math.PI / 2] });
mesh(sph(0.03), '#e0457f', 0.2, 0.56, 0.18, { p: ACC.lacinho });
mesh(cyl(0.15, 0.15, 0.12), '#ffffff', 0, 0.6, 0.27, { p: ACC.chapeu });
for (const [x, z] of [[-0.08, 0.24], [0.08, 0.24], [0, 0.33]]) mesh(sph(0.11), '#ffffff', x, 0.72, z, { p: ACC.chapeu });
mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 20), '#d1495b', 0, 0.2, 0.33, { p: ACC.cachecol, r: [Math.PI / 2 - 0.3, 0, 0] });
mesh(box(0.08, 0.2, 0.04), '#d1495b', 0.12, 0.08, 0.48, { p: ACC.cachecol, r: [0.2, 0, 0.2] });
const zzz = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture('z z z', null, '#6b7fa6', 256, 96, 64), transparent: true }));
zzz.scale.set(0.5, 0.19, 1); zzz.position.set(0.25, 0.85, 0.2); jade.add(zzz);

// ================= CLIENTES =================
const SLOTS = [V(-0.7, 0, 1.3), V(0.9, 0, 1.35), V(2.5, 0, 1.3), V(4.0, 0, 1.4)];
const ENTRY = V(6.5, 0, 3.5), EXIT = V(7, 0, 5);
const custs = new Map();   // id -> { g, mouth, key }
const leavers = [];

function buildCustomer(c) {
  const L = c.look;
  const g = group(ENTRY.x, 0, ENTRY.z);
  const o = { p: g };
  mesh(cap(0.3, 0.7), L.shirt, 0, 0.75, 0, o);
  mesh(sph(0.3), L.skin, 0, 1.55, 0, o);
  const hairTop = () => mesh(new THREE.SphereGeometry(0.315, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), L.hair, 0, 1.57, -0.02, { ...o, r: [-0.3, 0, 0] });
  if (L.style === 0) hairTop();
  if (L.style === 1) { hairTop(); mesh(cap(0.26, 0.4), L.hair, 0, 1.35, -0.16, { ...o, s: [1.1, 1, 0.6] }); }
  if (L.style === 2) { hairTop(); mesh(sph(0.14), L.hair, 0, 1.92, -0.08, o); }
  if (L.style === 3) for (const [x, y, z] of [[-0.2, 1.75, 0], [0.2, 1.75, 0], [0, 1.85, -0.05], [-0.12, 1.8, -0.18], [0.12, 1.8, -0.18]]) mesh(sph(0.15), L.hair, x, y, z, o);
  for (const sx of [-1, 1]) mesh(sph(0.035), '#1d120b', sx * 0.1, 1.58, 0.27, { ...o, cast: false });
  const mouth = mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 14, Math.PI), '#7a3a2a', 0, 1.46, 0.28, { ...o, r: [0, 0, Math.PI], cast: false });
  if (c.vip) { mesh(cyl(0.2, 0.22, 0.06), '#f2b33d', 0, 1.88, 0, o); mesh(cone(0.1, 0.18), '#f2b33d', 0, 1.99, 0, o); }
  return { g, mouth };
}

function syncCustomers(dt, t) {
  const r = G.run;
  const live = new Set();
  r.customers.forEach((c, i) => {
    live.add(c.id);
    let e = custs.get(c.id);
    if (!e) { e = buildCustomer(c); custs.set(c.id, e); }
    const target = SLOTS[Math.min(i, SLOTS.length - 1)];
    const d = target.clone().sub(e.g.position);
    const dist = d.length();
    if (dist > 0.02) { e.g.position.add(d.multiplyScalar(Math.min(1, dt * 3))); e.g.position.y = Math.abs(Math.sin(t * 10)) * 0.06; }
    else e.g.position.y = 0;
    e.g.rotation.y = dist > 0.3 ? Math.atan2(target.x - e.g.position.x, target.z - e.g.position.z) : Math.PI - 0.35;
    const angry = c.patience / c.maxPatience < 0.33;
    e.mouth.rotation.z = angry ? 0 : Math.PI;
    e.mouth.position.y = angry ? 1.43 : 1.46;
  });
  for (const [id, e] of custs) {
    if (live.has(id)) continue;
    custs.delete(id);
    leavers.push({ g: e.g, t: 1.6 });
  }
  for (let i = leavers.length - 1; i >= 0; i--) {
    const l = leavers[i];
    l.t -= dt;
    const d = EXIT.clone().sub(l.g.position);
    l.g.position.add(d.multiplyScalar(Math.min(1, dt * 1.8)));
    l.g.position.y = Math.abs(Math.sin(t * 10)) * 0.06;
    l.g.rotation.y = Math.atan2(EXIT.x - l.g.position.x, EXIT.z - l.g.position.z);
    if (l.t <= 0) { scene.remove(l.g); leavers.splice(i, 1); }
  }
}

// ================= PRATO / TIGELA / LIQUIDIFICADOR =================
const DISH_POS = V(0.9, TOP, 0.05);
const dish = group(DISH_POS.x, DISH_POS.y, DISH_POS.z);
let dishKey = '';
const LAYER = {
  pao: ['#f3d39a', 0.07, 0.46], alface: ['#5fb548', 0.035, 0.52], tomate_f: ['#e5412f', 0.04, 0.42],
  cenoura_r: ['#f28a1c', 0.035, 0.4], queijo: ['#f9d95e', 0.03, 0.48], molho: ['#f4efe0', 0.025, 0.38],
};
const ITEM_COLOR = { alface: '#5fb548', tomate_f: '#e5412f', cenoura_r: '#f28a1c', queijo: '#f9d95e', molho: '#f4efe0' };
const jarMat = new THREE.MeshToonMaterial({ color: '#dff4ff', gradientMap: grad, transparent: true, opacity: 0.4 });
let jarContents = null;

function buildDish(c) {
  clearGroup(dish);
  jarContents = null;
  const recipe = c ? c.order.recipe : 'sanduiche';
  const items = c ? c.plate.items : [];
  if (recipe === 'sanduiche') {
    mesh(cyl(0.36, 0.3, 0.04, 28), '#ffffff', 0, 0.02, 0, { p: dish });
    let y = 0.045;
    for (const id of items) {
      const [col, h, w] = LAYER[id] || ['#ccc', 0.03, 0.4];
      mesh(box(w, h, w * 0.85), col, 0, y + h / 2, 0, { p: dish, r: [0, (y * 37) % 0.3 - 0.15, 0] });
      y += h;
    }
  } else if (recipe === 'salada') {
    mesh(new THREE.SphereGeometry(0.38, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), '#ffffff', 0, 0.36, 0, { p: dish });
    mesh(cyl(0.36, 0.36, 0.02, 24), '#e7f3f7', 0, 0.34, 0, { p: dish, cast: false });
    items.forEach((id, i) => {
      const a = i * 2.4, rr = 0.08 + (i % 3) * 0.08;
      mesh(sph(0.09), ITEM_COLOR[id] || '#ccc', Math.cos(a) * rr, 0.36 + (i % 2) * 0.04, Math.sin(a) * rr, { p: dish, s: [1.2, 0.6, 1] });
    });
  } else {
    mesh(box(0.36, 0.22, 0.36), '#8e5bd6', 0, 0.11, 0, { p: dish });
    mesh(cyl(0.17, 0.13, 0.6), jarMat, 0, 0.52, 0, { p: dish, cast: false });
    jarContents = group(0, 0.24, 0, dish);
    if (c && c.plate.blend !== null) {
      mesh(cyl(0.14, 0.12, Math.min(0.5, items.length * 0.07), 16), UI.juiceColor(items), 0, Math.min(0.5, items.length * 0.07) / 2, 0, { p: jarContents, cast: false });
    } else {
      items.forEach((id, i) => {
        const col = '#' + new THREE.Color(...SUCO_COR[id].map(v => v / 255)).getHexString();
        mesh(sph(0.07), col, ((i * 37) % 10 - 5) / 60, 0.06 + i * 0.07, ((i * 53) % 10 - 5) / 60, { p: jarContents, cast: false });
      });
    }
  }
}

// ================= PREPARO =================
let boardKey = '', lastChops = 0, knifeT = 0;
function buildBoard(b) {
  clearGroup(onBoard);
  if (!b) return;
  const cut = b.chops >= Math.ceil(G.chopsNeeded() / 2);
  const old = b.velho;
  if (b.id === 'tomate') {
    if (!cut) { mesh(sph(0.18), old ? tint('#e5412f') : '#e5412f', 0, 0.18, 0, { p: onBoard }); mesh(cone(0.06, 0.06), '#3e9a3a', 0, 0.37, 0, { p: onBoard }); }
    else for (let i = 0; i < 3; i++) mesh(cyl(0.15, 0.15, 0.03), old ? tint('#f2665a') : '#f2665a', -0.15 + i * 0.13, 0.03 + i * 0.01, 0, { p: onBoard, r: [0, 0, -0.35] });
  } else {
    if (!cut) { mesh(cone(0.09, 0.55), old ? tint('#f28a1c') : '#f28a1c', 0, 0.09, 0, { p: onBoard, r: [0, 0, Math.PI / 2] }); mesh(cone(0.04, 0.2), '#4fa83d', -0.35, 0.09, 0, { p: onBoard, r: [0, 0, Math.PI / 2] }); }
    else for (let i = 0; i < 9; i++) mesh(box(0.22, 0.025, 0.025), old ? tint('#f28a1c') : '#f28a1c', ((i * 31) % 9 - 4) / 30, 0.02 + (i % 3) * 0.02, ((i * 17) % 9 - 4) / 30, { p: onBoard, r: [0, i * 0.7, 0] });
  }
}

// ================= HORTA =================
const plotGroups = [];
const plotPos = i => V(6.2 + (i % 3) * 1.7, 0, -1.3 + Math.floor(i / 3) * 2.3);
function ensurePlots() {
  while (plotGroups.length < G.s.plots.length) {
    const i = plotGroups.length, p = plotPos(i);
    const g = group(p.x, 0, p.z);
    const soilMat = own('#7a4f2c');
    mesh(box(1.4, 0.25, 1.4), soilMat, 0, 0.12, 0, { p: g, recv: true });
    const plant = group(0, 0.25, 0, g);
    const bug = group(0, 0.25, 0, g);
    plotGroups.push({ g, soilMat, plant, bug, key: '' });
  }
}
function buildPlant(pg, p) {
  clearGroup(pg.plant); clearGroup(pg.bug);
  if (!p.crop) return;
  const o = { p: pg.plant };
  const c = col => p.stage === 'passado' ? tint(col) : p.stage === 'murcho' ? tint(col, 0.8) : col;
  const prog = p.stage === 'growing' ? p.grow / CROPS[p.crop].tempo : 1;
  if (p.stage === 'murcho') {
    mesh(cyl(0.02, 0.03, 0.3), '#8a7b5a', 0, 0.15, 0, { ...o, r: [0, 0, 0.6] });
    mesh(sph(0.12), '#a39466', 0.15, 0.22, 0, { ...o, s: [1.3, 0.4, 1] });
  } else if (prog < 0.35) {
    mesh(cyl(0.015, 0.02, 0.2), '#4fa83d', 0, 0.1, 0, o);
    mesh(sph(0.07), '#6cc04a', -0.06, 0.2, 0, { ...o, s: [1.4, 0.4, 0.8] });
    mesh(sph(0.07), '#6cc04a', 0.06, 0.22, 0, { ...o, s: [1.4, 0.4, 0.8] });
  } else if (p.crop === 'alface') {
    [[0, 0], [0.22, 0.15], [-0.22, 0.12], [0.1, -0.22], [-0.14, -0.18]].forEach(([x, z]) => mesh(sph(0.2), c('#5fb548'), x, 0.14, z, { ...o, s: [1, 0.7, 1] }));
  } else if (p.crop === 'cenoura') {
    [[-0.3, 0], [0, 0.2], [0.3, -0.1]].forEach(([x, z]) => {
      mesh(cone(0.08, 0.25), c('#f28a1c'), x, 0.04, z, { ...o, r: [Math.PI, 0, 0] });
      for (const a of [-0.4, 0, 0.4]) mesh(cone(0.03, 0.32), c('#4fa83d'), x + a * 0.12, 0.32, z, { ...o, r: [0, 0, a] });
    });
  } else if (p.crop === 'tomate') {
    mesh(cyl(0.03, 0.04, 0.9), c('#4f8a3a'), 0, 0.45, 0, o);
    [[0.14, 0.45], [-0.14, 0.68], [0.11, 0.86]].forEach(([x, y]) => mesh(sph(0.15), c('#4fa83d'), x, y, 0, { ...o, s: [1.3, 0.6, 1] }));
    if (prog >= 0.7) [[0.18, 0.36], [-0.17, 0.58], [0.05, 0.78]].forEach(([x, y]) => mesh(sph(0.09), c('#e5412f'), x, y, 0.1, o));
  } else if (p.crop === 'morango') {
    [[-0.28, 0], [0.28, 0.1], [0, -0.28]].forEach(([x, z]) => {
      mesh(sph(0.19), c('#4fa83d'), x, 0.1, z, { ...o, s: [1.2, 0.55, 1.2] });
      if (prog >= 0.7) mesh(cone(0.06, 0.13), c('#e3304a'), x + 0.1, 0.07, z + 0.14, { ...o, r: [Math.PI, 0, 0] });
    });
  }
  if (p.praga) { // lagarta
    for (let i = 0; i < 4; i++) mesh(sph(0.05), '#7cc14e', -0.12 + i * 0.07, 0.42, 0.15, { p: pg.bug });
    mesh(sph(0.06), '#3e7a2a', 0.17, 0.44, 0.15, { p: pg.bug });
  }
}
function syncPlots(dt, t) {
  ensurePlots();
  G.s.plots.forEach((p, i) => {
    const pg = plotGroups[i];
    const prog = p.crop && p.stage === 'growing' ? p.grow / CROPS[p.crop].tempo : 1;
    const key = [p.crop, p.stage, !!p.praga, prog < 0.35, prog >= 0.7].join('|');
    if (key !== pg.key) { pg.key = key; buildPlant(pg, p); }
    const s = p.crop && p.stage === 'growing' ? 0.55 + 0.45 * Math.min(1, prog) : 1;
    pg.plant.scale.setScalar(s);
    pg.plant.rotation.z = Math.sin(t * 1.5 + i) * 0.04;
    if (p.stage === 'pronto') pg.plant.position.y = 0.25 + Math.abs(Math.sin(t * 3 + i)) * 0.05; else pg.plant.position.y = 0.25;
    pg.bug.position.x = Math.sin(t * 2) * 0.05;
    const wet = p.stage === 'growing' ? (p.water || 0) / 100 : 0.3;
    pg.soilMat.color.set('#8a5a30').lerp(new THREE.Color('#4a2c16'), wet);
  });
}

// ================= CHUVA =================
const RAIN_N = 900;
const rainPos = new Float32Array(RAIN_N * 3);
for (let i = 0; i < RAIN_N; i++) { rainPos[i * 3] = -9 + Math.random() * 23; rainPos[i * 3 + 1] = Math.random() * 8; rainPos[i * 3 + 2] = -3 + Math.random() * 9; }
const rainGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: '#8fbfe8', size: 0.06, transparent: true, opacity: 0.8 }));
rain.visible = false;
scene.add(rain);

// ================= CÂMERAS =================
const VIEWS = {
  balcao:   { pos: V(0.7, 5.3, 6.3),  tgt: V(0.7, 1.25, 0.2),  fov: 36 },
  preparo:  { pos: V(-4.6, 2.7, 2.5), tgt: V(-5.4, 1.05, 0.0), fov: 40 },
  montagem: { pos: V(1.55, 2.45, -1.7), tgt: V(0.75, 1.25, 0.45), fov: 40 },
  horta:    { pos: V(7.9, 5.4, 6.4),  tgt: V(7.9, 0.0, 0.0),   fov: 38 },
  mercado:  { pos: V(-1.0, 3.4, 8.0), tgt: V(-1.0, 1.6, -1),   fov: 40 },
  jade:     { pos: V(-0.6, 2.5, 2.9), tgt: V(-1.25, 1.45, 0.15), fov: 40 },
};
const camTgt = VIEWS.balcao.tgt.clone(), camPos = VIEWS.balcao.pos.clone();

// ================= ETIQUETAS (HTML que acompanha os objetos 3D) =================
const labelsEl = document.getElementById('labels');
const labels = new Map(); // key -> { el, anchor(): Vector3, update() }
const tmp = new THREE.Vector3();
function setLabels(list) {
  const want = new Set(list.map(l => l.key));
  for (const [k, l] of labels) if (!want.has(k)) { l.el.remove(); labels.delete(k); }
  for (const l of list) {
    let cur = labels.get(l.key);
    if (!cur) {
      const el = document.createElement('div');
      el.className = 'lbl ' + (l.cls || '');
      el.innerHTML = l.html;
      labelsEl.appendChild(el);
      cur = { el };
      labels.set(l.key, cur);
    }
    cur.anchor = l.anchor; cur.update = l.update;
  }
}
function positionLabels() {
  const st = document.getElementById('station');
  const w = st.offsetWidth, h = st.offsetHeight, ox = st.offsetLeft, oy = st.parentNode.offsetTop + st.offsetTop;
  for (const l of labels.values()) {
    tmp.copy(l.anchor()).project(camera);
    const vis = tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1;
    l.el.style.display = vis ? '' : 'none';
    if (!vis) continue;
    const x = ox + (tmp.x + 1) / 2 * w, y = oy + (1 - tmp.y) / 2 * h;
    l.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    if (l.update) l.update(l.el);
  }
}
const bar = (el, sel, v, low) => {
  const b = el.querySelector(sel);
  if (!b) return;
  b.firstChild.style.transform = `scaleX(${Math.max(0, Math.min(1, v))})`;
  if (low !== undefined) b.classList.toggle('low', low);
};

function customerLabels() {
  const r = G.run;
  return r.customers.map((c, i) => {
    const e = custs.get(c.id);
    const key = `c${c.id}:${c.state}`;
    const recipe = RECIPES[c.order.recipe];
    const html = `<span>${c.vip ? '⭐ ' : ''}${c.name}</span>
      ${c.order.sem ? `<em class="t-sem">🚫 sem ${ING[c.order.sem].nome.toLowerCase()}</em>` : ''}
      ${c.state === 'chegou'
        ? `<button class="btn sm go" data-act="take" data-arg="${c.id}">Anotar pedido</button>`
        : `<button class="btn sm" data-act="select" data-arg="${c.id}">#${String(c.id).padStart(2, '0')} ${ic(recipe.icon)}</button>`}
      <span class="lbar pat"><i></i></span>`;
    return {
      key, html, cls: c.vip ? 'vip' : '',
      anchor: () => (e ? tmp.copy(e.g.position).add(V(0, 2.0, 0.35)) : tmp.set(0, -99, 0)).clone(),
      update: el => { const v = c.patience / c.maxPatience; bar(el, '.pat', v, v < 0.33); },
    };
  });
}
function plotLabels() {
  return G.s.plots.map((p, i) => {
    const pos = plotPos(i);
    let html = '', cls = '';
    const stage = p.crop ? (p.praga ? 'praga' : p.stage) : 'vazio';
    if (stage === 'vazio') html = `<button class="btn sm" data-act="pick" data-arg="${i}">＋ Plantar</button>`;
    else if (stage === 'praga') { cls = 'alert'; html = `<button class="btn sm" data-act="pest" data-arg="${i}">🐛 Tirar lagarta</button><span class="lbar praga"><i></i></span>`; }
    else if (stage === 'growing') html = `<span>${CROPS[p.crop].nome}</span><span class="lbar grow"><i></i></span><span class="lbar water"><i></i></span>
      <button class="btn sm" data-act="water" data-arg="${i}">${ic('regador')} Regar</button>`;
    else if (stage === 'pronto') { cls = 'ready'; html = `<button class="btn sm" data-act="harvest" data-arg="${i}">Colher!</button><span class="lbar ripe"><i></i></span>`; }
    else if (stage === 'passado') html = `<button class="btn sm" data-act="harvest" data-arg="${i}">Colher (passado)</button>`;
    else if (stage === 'murcho') html = `<button class="btn sm" data-act="clear" data-arg="${i}">Murchou · limpar</button>`;
    return {
      key: `p${i}:${stage}:${p.crop}`, html, cls,
      anchor: () => V(pos.x, 0.25, pos.z + 1.05),   // na frente do canteiro, sem cobrir a planta
      update: el => {
        if (stage === 'growing') { bar(el, '.grow', p.grow / CROPS[p.crop].tempo); bar(el, '.water', p.water / 100); el.classList.toggle('thirsty', p.water < 25); }
        if (stage === 'pronto') bar(el, '.ripe', 1 - (p.ripe || 0) / RIPE_LIMIT);
        if (stage === 'praga') bar(el, '.praga', 1 - (p.pragaT || 0) / PRAGA_LIMIT);
      },
    };
  });
}

// ================= TELAS HTML ADAPTADAS AO 3D =================
UI.st_balcao = function () {
  return G.run.phase === 'prep' ? '<div class="banner">Preparação: colha, corte e compre antes de abrir as portas!</div>' : '';
};
const stHorta2D = UI.st_horta.bind(UI);
UI.st_horta = function () {
  const s = G.s;
  const html = stHorta2D(); // reaproveita aviso de vazamento e dica
  const pick = this.plotPick !== null && this.plotPick !== undefined && !s.plots[this.plotPick]?.crop
    ? `<div class="seed-pop"><h4>Plantar no canteiro ${this.plotPick + 1}:</h4>${Object.keys(CROPS).map(k =>
        `<button class="seed" data-act="plant" data-arg="${this.plotPick}:${k}" ${s.seeds[k] ? '' : 'disabled'}>${ic(k)}<span>${CROPS[k].nome}</span><b>${s.seeds[k] || 0}</b></button>`).join('')}
        <button class="btn sm ghost" data-act="pickcancel">Cancelar</button></div>` : '';
  return html + pick;
};

// toque no mundo 3D: cliente (anotar/selecionar) ou Jade (pular)
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let jadeHop = 0;
document.getElementById('stage').addEventListener('click', e => {
  if (!G.run || UI.screen !== 'game') return;
  if (e.target.closest('button, [data-act], [data-drag], .bin, .lbl, .order-card, .jade-side, .market, .seed-pop')) return;
  const rc = renderer.domElement.getBoundingClientRect();
  ndc.set((e.clientX - rc.left) / rc.width * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const targets = [jade, ...[...custs.values()].map(c => c.g)];
  const hit = ray.intersectObjects(targets, true)[0];
  if (!hit) return;
  let o = hit.object;
  while (o.parent && !targets.includes(o)) o = o.parent;
  if (o === jade) { if (jadeHop <= 0) { jadeHop = 1; SFX.squeak(); } return; }
  for (const [id, c] of custs) if (c.g === o) {
    const cu = G.cust(id);
    if (cu && cu.state === 'chegou') G.takeOrder(id);
    else if (cu) { G.run.selected = id; UI.go('montagem'); }
  }
});

// ================= LOOP =================
let last = performance.now(), blinkT = 2;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const t = now / 1000;
  const inGame = UI.screen === 'game' && G.run && G.s;
  const station = inGame ? UI.station : 'balcao';

  // câmera
  const v = VIEWS[station] || VIEWS.balcao, k = 1 - Math.exp(-dt * 3);
  camTgt.lerp(v.tgt, k); camPos.lerp(v.pos, k);
  const sway = inGame ? 0.03 : 0.12;
  const off = camPos.clone().sub(camTgt).applyAxisAngle(V(0, 1, 0), Math.sin(t * 0.25) * sway);
  camera.position.copy(camTgt).add(off);
  camera.lookAt(camTgt);
  if (Math.abs(camera.fov - v.fov) > 0.05) { camera.fov += (v.fov - camera.fov) * k; camera.updateProjectionMatrix(); }

  // Maria Alice
  maria.rotation.z = Math.sin(t * 1.2) * 0.015;
  head.rotation.y = Math.sin(t * 0.7) * 0.12;
  blinkT -= dt;
  for (const e of mEyes) e.scale.y = blinkT < 0.12 ? 0.1 : 1;
  if (blinkT < 0) blinkT = 2.5 + Math.random() * 2.5;
  const worried = inGame && G.run.customers.some(c => c.patience / c.maxPatience < 0.33);
  mBrows.forEach((b, i) => { b.rotation.z = (i ? -1 : 1) * (worried ? -0.25 : 0.12) * -1; });
  smile.rotation.z = worried ? 0 : Math.PI;

  // Jade
  const helping = inGame ? G.jadeHelping() : true;
  const eating = UI.jadeExpr === 'comendo';
  jade.visible = !(inGame && G.run.jadeFuga > 0);
  jBody.scale.set(1, 1 + Math.sin(t * (helping ? 3 : 1.4)) * (helping ? 0.025 : 0.04), 1);
  jHead.rotation.x = eating ? Math.sin(t * 18) * 0.08 : 0;
  for (const e of jEyes) e.scale.y = helping ? (blinkT < 0.12 ? 0.15 : 1) : 0.15;
  zzz.visible = !helping;
  zzz.position.y = 0.85 + Math.sin(t * 2) * 0.05;
  if (jadeHop > 0) { jadeHop -= dt * 1.6; jade.position.y = JADE_POS.y + Math.max(0, Math.sin((1 - jadeHop) * Math.PI)) * 0.35; }
  else if (helping && Math.sin(t * 0.9) > 0.995) jadeHop = 1;   // pulinho de alegria de vez em quando
  const acc = inGame ? G.s.acessorio : null;
  for (const [k2, g] of Object.entries(ACC)) g.visible = acc === k2;

  if (inGame) {
    const r = G.run;
    syncCustomers(dt, t);
    syncPlots(dt, t);

    // prato / tigela / liquidificador do pedido selecionado
    const c = G.selectedCust();
    const dk = c ? `${c.id}|${c.order.recipe}|${c.plate.items.join(',')}|${c.plate.blend}` : 'none';
    if (dk !== dishKey) { dishKey = dk; buildDish(c); }
    if (jarContents) {
      const spinning = !!r.blend;
      jarContents.rotation.y += spinning ? dt * 25 : 0;
      dish.position.x = DISH_POS.x + (spinning ? Math.sin(t * 60) * 0.01 : 0);
    } else dish.position.x = DISH_POS.x;

    // tábua e faca
    const b = r.board;
    const bk = b ? `${b.id}|${b.chops >= Math.ceil(G.chopsNeeded() / 2)}|${b.velho}` : '';
    if (bk !== boardKey) { boardKey = bk; buildBoard(b); }
    const chops = b ? b.chops : 0;
    if (chops > lastChops) knifeT = 1;
    lastChops = chops;
    if (knifeT > 0) knifeT -= dt * 5;
    knife.position.set(b ? kx - 0.05 : kx + 0.32, BOARD_Y + 0.02 + Math.max(0, knifeT) * 0.25, b ? 0.12 : 0.38);
    knife.rotation.z = b ? -Math.max(0, knifeT) * 0.5 : 0;

    // eventos visíveis
    rain.visible = r.ev.chuva > 0;
    if (rain.visible) {
      const pa = rainGeo.attributes.position;
      for (let i = 0; i < RAIN_N; i++) { let y = pa.getY(i) - dt * 9; if (y < 0) y += 8; pa.setY(i, y); }
      pa.needsUpdate = true;
    }
    const dark = r.ev.luz > 0 ? 0.3 : r.ev.chuva > 0 ? 0.7 : 1;
    sun.intensity += (2.4 * dark - sun.intensity) * k;
    hemi.intensity += (1.7 * (dark < 1 ? 0.55 + dark * 0.45 : 1) - hemi.intensity) * k;
    scene.background.set(r.ev.chuva > 0 ? '#9fb3c6' : r.ev.luz > 0 ? '#8296b0' : '#bfe6ff');
    dirty.visible = r.pratos !== null && r.pratos <= 1;
    puddle.visible = !!G.s.irrigQuebrada;

    // etiquetas da estação atual
    const showLabels = document.getElementById('overlay').className === 'hidden' && !UI.modal && r.phase !== 'night';
    if (!showLabels) setLabels([]);
    else if (station === 'balcao') setLabels(customerLabels());
    else if (station === 'horta' && UI.plotPick === null) setLabels(plotLabels());
    else setLabels([]);
    positionLabels();
  } else {
    setLabels([]);
  }

  renderer.render(scene, camera);
}

// economiza bateria: para quando o app sai da tela
document.addEventListener('visibilitychange', () => {
  if (document.hidden) renderer.setAnimationLoop(null);
  else { last = performance.now(); renderer.setAnimationLoop(loop); }
});
window.addEventListener('DOMContentLoaded', () => { place(); renderer.setAnimationLoop(loop); });
if (document.readyState !== 'loading') { place(); renderer.setAnimationLoop(loop); }
window.__world = { scene, camera, VIEWS }; // para depuração
