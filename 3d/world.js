// ===== Café da Horta 3D — mundo 3D ligado à mesma lógica do jogo 2D =====
// A lógica (G, EV) e a interface HTML (UI) são as mesmas da versão 2D.
// Este arquivo só desenha o estado do jogo em 3D e troca algumas telas por etiquetas.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ---------- Renderizador atrás da área da estação ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;   // visual realista: luz e cor como numa foto
renderer.toneMappingExposure = 1.05;
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

// ---------- Materiais realistas (PBR) ----------
// Luz ambiente de "estúdio": dá reflexos suaves e sombra de contato em tudo
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const PBR = o => new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0, ...o });
const mats = {};
const M = c => mats[c] || (mats[c] = PBR({ color: c }));
const own = c => PBR({ color: c }); // material próprio (cor muda)
// Só peça com mais de ~6 cm faz sombra: olhos, botões e sementes não aparecem na sombra e
// cada uma custaria um desenho a mais por quadro no celular.
const fazSombra = o => { o.geometry.computeBoundingSphere(); return o.geometry.boundingSphere.radius > 0.06; };
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
const HEMI0 = 0.5, SUN0 = 2.6;   // o ambiente (environment) já ilumina; o sol dá a sombra
const hemi = new THREE.HemisphereLight('#ffffff', '#c9a37a', HEMI0);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff3df', SUN0);
sun.position.set(5, 10, 7);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 9, bottom: -9, near: 1, far: 30 });
sun.shadow.normalBias = 0.03;
scene.add(sun);

// ================= CENÁRIO =================
// Paredes, chão, balcão, cozinha e horta vêm do Blender (blender/cenario.py), nas mesmas posições.
// Aqui ficam só as peças que mudam durante o jogo.
new GLTFLoader().load('modelos/cenario.glb', gltf => {
  gltf.scene.traverse(o => {
    if (!o.isMesh) return;
    o.receiveShadow = true;
    o.castShadow = !o.name.startsWith('chao_') && fazSombra(o);   // chão, paredes e grama só recebem sombra
  });
  scene.add(gltf.scene);
}, undefined, e => console.error('[3D] o cenário não carregou:', e));
const sign = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.75), new THREE.MeshBasicMaterial({ map: textTexture('Café da Horta', '#2f6b3a', '#fff'), transparent: true }));
sign.position.set(-0.6, 3.7, -2.85); scene.add(sign);
const TOP = 1.22;
// pilha de louça suja (evento)
const dirty = group(-1.15, TOP, -0.25);
for (let i = 0; i < 5; i++) mesh(cyl(0.2, 0.17, 0.035), '#c9c3b5', 0, 0.02 + i * 0.04, 0, { p: dirty });
dirty.visible = false;

// cozinha: faca e tábua (o legume em cima muda)
const kx = -5.4;
const BOARD_Y = 1.13;
const knife = group(kx + 0.32, BOARD_Y + 0.02, 0.38);
knife.rotation.y = 0.4;
mesh(box(0.5, 0.02, 0.09), '#d8dde2', 0, 0, 0, { p: knife });
mesh(box(0.22, 0.05, 0.07), '#2fa37a', 0.35, 0, 0, { p: knife });
const onBoard = group(kx - 0.1, BOARD_Y, 0.1);

// horta: poça do vazamento da irrigação
const puddle = mesh(cyl(0.9, 0.9, 0.02, 24), '#6fb8ee', 7.9, 0.02, 2.4, { cast: false, s: [1.4, 1, 0.8] });
puddle.visible = false;

// ================= CONTORNO DE DESENHO (casca invertida) =================
// Uma cópia da malha, empurrada para fora pela normal e desenhada só por dentro:
// vira uma linha escura em volta do personagem, como em desenho animado.
// Visual realista (escolhido em 2026-11): sem contorno. ol() ficou para não mexer em todas as chamadas;
// quando cada personagem virar modelo do Blender, as chamadas somem junto.
const ol = m => m;
const lathe = (pts, seg = 24, ps = 0, pl = Math.PI * 2) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg, ps, pl);
const half = (r, w = 24, h = 12, f = 0.55) => new THREE.SphereGeometry(r, w, h, 0, Math.PI * 2, 0, Math.PI * f);

// ================= MARIA ALICE =================
const mariaRoot = group(-1.0, 0, -1.3);    // anda pelo cenário
mariaRoot.rotation.y = 0.35;
const maria = group(0, 0, 0, mariaRoot);    // balança/abaixa
// Modelo do Blender (blender/maria.py). As partes animadas começam vazias, para o jogo
// rodar enquanto o arquivo carrega, e viram as peças do maria.glb quando ele chega.
const nada = () => new THREE.Object3D();
let legs = [nada(), nada()], armL = nada(), armR = nada(), mCan = nada(), spout = nada(), head = nada(), smile = nada();
let mEyes = [], mBrows = [];
new GLTFLoader().load('modelos/maria.glb', gltf => {
  const q = n => gltf.scene.getObjectByName(n);
  gltf.scene.traverse(o => { if (o.isMesh) { o.castShadow = fazSombra(o); o.receiveShadow = true; } });
  legs = [q('maria_perna_L'), q('maria_perna_R')];
  armL = q('maria_braco_L'); armR = q('maria_braco_R');
  armL.rotation.z = -0.22; armR.rotation.z = 0.22;
  mCan = q('maria_regador'); spout = q('maria_bico'); mCan.visible = false;
  head = q('maria_cabeca'); smile = q('maria_sorriso');
  mEyes = [q('maria_olho_L'), q('maria_olho_R')];
  mBrows = [q('maria_sobrancelha_L'), q('maria_sobrancelha_R')];
  maria.add(gltf.scene);
}, undefined, e => console.error('[3D] a Maria Alice não carregou:', e));

// ================= JADE (baseada na foto PERSONAGENS.jpg) =================
// Corpo e cabeça são UMA malha lisa (formato de pãozinho, como um porquinho-da-índia),
// com as manchas brancas pintadas nos vértices: faixa no focinho que afina até a testa,
// focinho/queixo/peito brancos e a parte de trás clara, como na foto.
const JADE_POS = V(-2.0, TOP, 0.15);
const jade = group(JADE_POS.x, JADE_POS.y, JADE_POS.z);
jade.rotation.y = 0.55;
jade.scale.setScalar(1.25);
const jBody = group(0, 0, 0, jade);
// Modelo do Blender (blender/jade.py): corpo com as manchas pintadas, olhos, orelhas, bigodes,
// acessórios e regadorzinho. Até o arquivo chegar, as partes são vazias e o jogo segue normal.
const jHead = group(0, 0, 0, jBody);   // ponto de referência do rosto (comida aparece no focinho)
let jEyes = [], jCan = new THREE.Object3D();
const ACC = { lacinho: new THREE.Object3D(), chapeu: new THREE.Object3D(), cachecol: new THREE.Object3D() };
new GLTFLoader().load('modelos/jade.glb', gltf => {
  const q = n => gltf.scene.getObjectByName(n);
  gltf.scene.traverse(o => { if (o.isMesh) { o.castShadow = fazSombra(o); o.receiveShadow = true; } });
  jEyes = [q('jade_olho_L'), q('jade_olho_R')];
  ACC.lacinho = q('jade_lacinho'); ACC.chapeu = q('jade_chapeu'); ACC.cachecol = q('jade_cachecol');
  jCan = q('jade_regador'); jCan.visible = !!jadeTrip;
  jBody.add(gltf.scene);
}, undefined, e => console.error('[3D] a Jade não carregou:', e));
const zzz = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture('z z z', null, '#6b7fa6', 256, 96, 64), transparent: true }));
zzz.scale.set(0.5, 0.19, 1); zzz.position.set(0.25, 0.85, 0.2); jade.add(zzz);

// ================= FLORZINHA (modelo do Blender: blender/florzinha.py) =================
// O .glb traz as partes com nome e os materiais do Blender; aqui só ligamos a sombra e o loop anima.
const flor = group(-2.4, 0, 1.45);
flor.rotation.y = 0.45;
flor.scale.setScalar(1.15);
const FLOR = {};      // partes animadas (vazio até o modelo chegar: o jogo roda sem ele)
let florLate = 0, florAuT = 0;   // latido só de enfeite (fora do jogo) e intervalo entre os "AU!"
new GLTFLoader().load('modelos/florzinha.glb', gltf => {
  gltf.scene.traverse(o => { if (o.isMesh) { o.castShadow = fazSombra(o); o.receiveShadow = true; } });
  flor.add(gltf.scene);
  for (const n of ['flor_corpo', 'flor_cabeca', 'flor_rabo', 'flor_olho_L', 'flor_olho_R', 'flor_boca', 'flor_acc_laco', 'flor_acc_bandana', 'flor_acc_coroa']) FLOR[n] = gltf.scene.getObjectByName(n);
}, undefined, e => console.error('[3D] a Florzinha não carregou:', e));

// ================= CLIENTES =================
const SLOTS = [V(-0.7, 0, 1.3), V(0.9, 0, 1.35), V(2.5, 0, 1.3), V(4.0, 0, 1.4)];
const ENTRY = V(6.5, 0, 3.5), EXIT = V(7, 0, 5);
const custs = new Map();   // id -> { g, mouth, key }
const leavers = [];
const PANTS = ['#2f3b5c', '#4a3a2a', '#3b3b3b', '#5a6b7f', '#6b4a6b'];

// Modelo do Blender (blender/clientes.py): um corpo com os 4 penteados e o chapéu do crítico.
// Cada cliente ganha uma cópia (a malha é compartilhada) pintada com as cores sorteadas dele.
let clienteModelo = null;
const esperandoModelo = [];   // clientes que chegaram antes do arquivo carregar
new GLTFLoader().load('modelos/cliente.glb', gltf => {
  clienteModelo = gltf.scene;
  esperandoModelo.splice(0).forEach(vestir => vestir());
}, undefined, e => console.error('[3D] os clientes não carregaram:', e));

function buildCustomer(c) {
  const L = c.look;
  const e = { g: group(ENTRY.x, 0, ENTRY.z), mouth: new THREE.Object3D() };
  const vestir = () => {
    const cores = { pele: own(L.skin), camisa: own(L.shirt), calca: own(PANTS[c.id % PANTS.length]), cabelo: own(L.hair) };
    const m = clienteModelo.clone(true);
    m.traverse(o => {
      if (o.name.startsWith('cliente_cabelo_estilo')) o.visible = o.name === 'cliente_cabelo_estilo' + L.style;
      if (o.name === 'cliente_coroa') o.visible = !!c.vip;
      if (!o.isMesh) return;
      o.castShadow = fazSombra(o);
      for (const k in cores) if (o.name.includes('_' + k)) o.material = cores[k];
    });
    e.mouth = m.getObjectByName('cliente_boca');
    e.g.add(m);
  };
  if (clienteModelo) vestir(); else esperandoModelo.push(vestir);
  return e;
}

function syncCustomers(dt, t) {
  const r = G.run;
  const live = new Set();
  r.customers.filter(c => !c.delivery).forEach((c, i) => {   // delivery não vai para a fila
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
    e.mouth.rotation.z = angry ? Math.PI : 0;   // o modelo vem sorrindo (∪); bravo vira ∩
    e.mouth.position.y = angry ? 1.47 : 1.5;
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
const jarMat = PBR({ color: '#dff4ff', roughness: 0.05, transparent: true, opacity: 0.35 }); // vidro
let jarContents = null;

// Moldes do Blender (blender/comidas.py): louça, camadas, itens da tábua e plantas.
// copia('nome') devolve uma cópia pronta; escurecer > 0 = ingrediente passado (cor amarronzada).
let comidas = null;
new GLTFLoader().load('modelos/comidas.glb', gltf => {
  comidas = gltf.scene;
  dishKey = ''; boardKey = ''; plotGroups.forEach(pg => { pg.key = ''; });   // refaz o que já estava na tela
}, undefined, e => console.error('[3D] as comidas não carregaram:', e));
function copia(nome, escurecer = 0) {
  const molde = comidas && comidas.getObjectByName(nome);
  if (!molde) return new THREE.Group();
  const c = molde.clone(true);
  c.position.set(0, 0, 0);
  c.traverse(m => {
    if (!m.isMesh) return;
    m.castShadow = fazSombra(m);
    if (escurecer) { m.material = m.material.clone(); m.material.color.set(tint('#' + m.material.color.getHexString(), escurecer)); }
  });
  return c;
}

function buildDish(c) {
  clearGroup(dish);
  jarContents = null;
  const recipe = c ? c.order.recipe : 'sanduiche';
  const items = c ? c.plate.items : [];
  if (recipe === 'sanduiche') {
    dish.add(copia('prato'));
    let y = 0.016;
    for (const id of items) {
      const camada = copia(id);
      camada.position.y = y;
      camada.rotation.y = (y * 37) % 0.3 - 0.15;
      dish.add(camada);
      y += (LAYER[id] || [0, 0.03])[1];
    }
  } else if (recipe === 'salada') {
    dish.add(copia('tigela'));
    items.forEach((id, i) => {
      const a = i * 2.4, rr = 0.06 + (i % 3) * 0.07;
      const it = copia(id);
      it.scale.setScalar(0.38);
      it.position.set(Math.cos(a) * rr, 0.22 + (i % 2) * 0.03 + i * 0.006, Math.sin(a) * rr);
      it.rotation.y = a;
      dish.add(it);
    });
  } else {
    dish.add(copia('liquidificador'));
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
  const nome = b.id === 'tomate' ? (cut ? 'tabua_tomate_fatiado' : 'tabua_tomate') : (cut ? 'tabua_cenoura_ralada' : 'tabua_cenoura');
  onBoard.add(copia(nome, b.velho ? 0.55 : 0));
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
  const prog = p.stage === 'growing' ? p.grow / CROPS[p.crop].tempo : 1;
  const nome = p.stage === 'murcho' ? 'planta_murcha' : prog < 0.35 ? 'planta_broto' : 'planta_' + p.crop;
  const planta = copia(nome, p.stage === 'passado' ? 0.55 : 0);
  planta.traverse(o => { if (o.name.endsWith('_frutos')) o.visible = prog >= 0.7; });   // fruto só quando amadurece
  pg.plant.add(planta);
  if (p.praga) {
    const lagarta = copia('lagarta');
    lagarta.position.set(0, 0.17, 0.15);
    pg.bug.add(lagarta);
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

// ================= DELIVERY: motoboy e sacolas no balcão =================
const moto = group(ENTRY.x, 0, ENTRY.z);
moto.visible = false;
new GLTFLoader().load('modelos/motoboy.glb', gltf => {
  gltf.scene.traverse(o => { if (o.isMesh) { o.castShadow = fazSombra(o); o.receiveShadow = true; } });
  moto.add(gltf.scene);
}, undefined, e => console.error('[3D] o motoboy não carregou:', e));
const MOTO_SPOT = V(3.55, 0, 0.95);        // ponta direita do balcão (fora da coluna de comandas)
const sacolas = group(1.95, TOP, -0.3);    // sacolas prontas esperando o motoboy
let nSacolas = -1;
function sacola() {
  const g = new THREE.Group();
  mesh(box(0.22, 0.26, 0.14), '#c9a06a', 0, 0.13, 0, { p: g });
  mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 12, Math.PI), '#8a6a3a', 0, 0.26, 0, { p: g });
  return g;
}
function syncMotoboy(dt, t) {
  const ds = G.run.customers.filter(c => c.delivery);
  const n = ds.filter(c => c.state === 'embalado').length;
  if (n !== nSacolas) {
    nSacolas = n; clearGroup(sacolas);
    for (let i = 0; i < n; i++) { const s = sacola(); s.position.x = i * 0.28; sacolas.add(s); }
  }
  const aqui = ds.some(c => c.moto);   // um motoboy busca todos os pedidos que estiverem esperando por ele
  if (aqui && !moto.visible) { moto.visible = true; moto.position.copy(ENTRY); }
  if (!moto.visible) return;
  const alvo = aqui ? MOTO_SPOT : EXIT;
  const d = alvo.clone().sub(moto.position); d.y = 0;
  if (d.length() > 0.05) {
    moto.position.add(d.multiplyScalar(Math.min(1, dt * 2.2)));
    moto.position.y = Math.abs(Math.sin(t * 10)) * 0.06;
    moto.rotation.y = Math.atan2(alvo.x - moto.position.x, alvo.z - moto.position.z);
  } else if (aqui) { moto.position.y = 0; moto.rotation.y = lerpAngle(moto.rotation.y, Math.PI + 0.5, Math.min(1, dt * 6)); }
  else moto.visible = false;   // saiu pela porta
}

// ================= CÂMERAS =================
const VIEWS = {
  balcao:   { pos: V(0.7, 5.3, 6.3),  tgt: V(0.7, 1.25, 0.2),  fov: 36 },
  preparo:  { pos: V(-4.6, 2.7, 2.5), tgt: V(-5.4, 1.05, 0.0), fov: 40 },
  montagem: { pos: V(1.55, 2.45, -1.7), tgt: V(0.75, 1.25, 0.45), fov: 40 },
  horta:    { pos: V(7.9, 5.4, 6.4),  tgt: V(7.9, 0.0, 0.0),   fov: 38 },
  mercado:  { pos: V(-1.0, 3.4, 8.0), tgt: V(-1.0, 1.6, -1),   fov: 40 },
  jade:     { pos: V(-1.2, 2.25, 2.6), tgt: V(-1.85, 1.55, 0.15), fov: 28 },
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
  return r.customers.filter(c => !c.delivery).map((c, i) => {
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
  const targets = [jade, flor, ...[...custs.values()].map(c => c.g)];
  const hit = ray.intersectObjects(targets, true)[0];
  if (!hit) return;
  let o = hit.object;
  while (o.parent && !targets.includes(o)) o = o.parent;
  if (o === jade) { if (jadeHop <= 0) { jadeHop = 1; SFX.wheek(3); } return; }
  if (o === flor) { G.calmFlor(); return; }   // carinho: acalma o latido (a lógica fica no game.js)
  for (const [id, c] of custs) if (c.g === o) {
    const cu = G.cust(id);
    if (cu && cu.state === 'chegou') G.takeOrder(id);
    else if (cu) { G.run.selected = id; UI.go('montagem'); }
  }
});

// ================= MOVIMENTO =================
const lerpAngle = (a, b, k) => { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * k; };
function stepMover(obj, mv, dt) {
  if (!mv.path.length) { mv.walking = false; return; }
  const tgt = mv.path[0];
  const d = tgt.clone().sub(obj.position);
  const dist = d.length(), step = mv.speed * dt;
  if (Math.hypot(d.x, d.z) > 0.05) obj.rotation.y = lerpAngle(obj.rotation.y, Math.atan2(d.x, d.z), Math.min(1, dt * 10));
  if (dist <= step) { obj.position.copy(tgt); mv.path.shift(); }
  else obj.position.add(d.multiplyScalar(step / dist));
  mv.walking = mv.path.length > 0;
}
const inHorta = p => p.x > 4.5;
// Dentro do café todos andam por um corredor atrás do balcão (z = -1.75),
// longe da bancada e da Jade; para a horta, saem pela porta da direita.
const CORR_Z = -1.75;
const DOOR_IN = V(4.3, 0, CORR_Z), DOOR_OUT = V(4.8, 0, 2.5);
function pathTo(from, to) {
  const pts = [];
  const fh = inHorta(from), th = inHorta(to);
  if (!fh && from.y < 0.5) pts.push(V(from.x, 0, CORR_Z));         // entra no corredor
  if (!fh && th) pts.push(DOOR_IN.clone(), DOOR_OUT.clone());
  else if (fh && !th) pts.push(DOOR_OUT.clone(), DOOR_IN.clone());
  if (!th && to.y < 0.5) pts.push(V(to.x, 0, CORR_Z));             // sai do corredor
  pts.push(to.clone());
  return pts;
}

// Maria Alice: um lugar para cada estação
const MARIA_AT = {
  balcao: [V(-1.0, 0, -1.3), 0.35], mercado: [V(-1.0, 0, -1.3), 0.35], preparo: [V(-5.4, 0, -1.3), 0],
  montagem: [V(0.2, 0, -1.25), 0.7], jade: [V(-1.7, 0, -1.3), 0.15], horta: [V(10.4, 0, 1.6), -2.2],
};
const mariaMove = { path: [], speed: 3.4, walking: false, face: 0.35 };
let mariaStation = 'balcao', mariaAct = null; // { type, t, dur, i }
function mariaGo(pos, face) { mariaMove.path = pathTo(mariaRoot.position, pos); mariaMove.face = face; }
function mariaDo(type, dur, extra = {}) { mariaAct = { type, t: 0, dur, ...extra }; }
const plotFront = i => { const p = plotPos(i); return V(p.x + 0.75, 0, p.z + 0.95); }; // ao lado, sem tapar a planta
const PLOT_FACE = Math.PI + 0.6;

// Jade: viagem até a horta para regar
const jadeMove = { path: [], speed: 3.2, walking: false };
let jadeTrip = null; // { phase: 'ida'|'rega'|'volta', i, t }
const JADE_EDGE = V(-2.35, TOP, -0.55), JADE_FLOOR = V(-2.35, 0, -0.85); // desce pela parte de trás do balcão

// ================= PARTÍCULAS E TEXTOS FLUTUANTES =================
const parts = [], floats = [], flights = [];
const partGeo = sph(1, 8, 6);
function spawn(pos, vel, color, life = 1, size = 0.05, grav = -9) {
  const m = new THREE.Mesh(partGeo, M(color));
  m.scale.setScalar(size); m.position.copy(pos); m.castShadow = false;
  scene.add(m);
  parts.push({ m, vel: vel.clone(), life, max: life, grav, size });
}
const rnd3 = (a = 1) => V((Math.random() - 0.5) * a, (Math.random() - 0.5) * a, (Math.random() - 0.5) * a);
const texCache = {};
function floatText(text, pos, fg = '#3b2a1e', bg = '#ffffff', delay = 0) {
  const key = text + fg + bg;
  const tex = texCache[key] || (texCache[key] = textTexture(text, bg, fg, 256, 96, 58));
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  s.scale.set(0.75, 0.28, 1); s.position.copy(pos); s.renderOrder = 10;
  s.visible = delay <= 0;
  scene.add(s);
  floats.push({ s, life: 1.6, delay });
}
function updateFx(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt; p.vel.y += p.grav * dt;
    p.m.position.addScaledVector(p.vel, dt);
    if (p.m.position.y < 0.02 && p.grav < 0) { p.m.position.y = 0.02; p.vel.set(0, 0, 0); }
    p.m.scale.setScalar(p.size * Math.min(1, p.life / (p.max * 0.4)));
    if (p.life <= 0) { scene.remove(p.m); parts.splice(i, 1); }
  }
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i];
    if (f.delay > 0) { f.delay -= dt; f.s.visible = f.delay <= 0; continue; }
    f.life -= dt; f.s.position.y += dt * 0.7;
    f.s.material.opacity = Math.min(1, f.life / 0.5);
    if (f.life <= 0) { scene.remove(f.s); f.s.material.dispose(); floats.splice(i, 1); }
  }
  for (let i = flights.length - 1; i >= 0; i--) {
    const f = flights[i];
    f.t += dt * 1.8;
    const k = Math.min(1, f.t);
    f.o.position.lerpVectors(f.from, f.to, k);
    f.o.position.y += Math.sin(k * Math.PI) * 0.6;
    f.o.scale.setScalar(1 - k * 0.6);
    if (f.t >= 1) { scene.remove(f.o); flights.splice(i, 1); }
  }
}
const CROP_COLOR = { alface: '#5fb548', tomate: '#e5412f', cenoura: '#f28a1c', morango: '#e3304a' };
const FOOD_COLOR = { alface: '#5fb548', cenoura: '#f28a1c', morango: '#e3304a', tomate: '#e5412f' };
let dropMesh = null, dropBase = 0, dropT = 0, lastDish = { id: null, n: 0 };

// ================= REAÇÕES ÀS AÇÕES DO JOGO =================
window.onGameEvent = (name, d) => {
  const t0 = performance.now();
  switch (name) {
    case 'take': mariaDo('aceno', 0.7); break;
    case 'add': mariaDo('pegar', 0.35); break;
    case 'chop': knifeT = 1; break;
    case 'serve': {
      mariaDo('pegar', 0.4);
      const e = custs.get(d.id);
      if (!e) break;
      const top = e.g.position.clone().add(V(0, 2.25, 0));
      const ghost = dish.clone(true);
      ghost.position.copy(dish.position);
      scene.add(ghost);
      flights.push({ o: ghost, from: dish.position.clone(), to: e.g.position.clone().add(V(0, 1.2, 0.1)), t: 0 });
      floatText(d.score >= 90 ? '😍' : d.score >= 70 ? '🙂' : d.score >= 40 ? '😐' : '😠', top.clone().add(V(0, 0.35, 0)), '#000', null);
      floatText(`+${d.gain}`, top, '#7a5200', '#ffe066', 0.25);
      for (let i = 0; i < 10; i++) spawn(top, V((Math.random() - 0.5) * 2, 2 + Math.random() * 2, (Math.random() - 0.5) * 2), '#f2c14e', 0.9, 0.05);
      break;
    }
    case 'water': mariaGo(plotFront(d.i), PLOT_FACE); mariaAct = { type: 'regar', t: 0, dur: 1.4, i: d.i, wait: true }; break;
    case 'harvest': {
      mariaGo(plotFront(d.i), PLOT_FACE);
      const p = plotPos(d.i);
      const col = d.ruim ? tint(CROP_COLOR[d.crop]) : CROP_COLOR[d.crop];
      for (let i = 0; i < 7; i++) spawn(V(p.x, 0.5, p.z), V((Math.random() - 0.5) * 1.5, 3 + Math.random() * 1.5, 1.2 + Math.random()), col, 1.1, 0.09);
      mariaAct = { type: 'abaixar', t: 0, dur: 0.6, wait: true };
      break;
    }
    case 'plant': {
      mariaGo(plotFront(d.i), PLOT_FACE);
      const p = plotPos(d.i);
      for (let i = 0; i < 10; i++) spawn(V(p.x, 0.3, p.z), V((Math.random() - 0.5) * 2, 1.5 + Math.random(), (Math.random() - 0.5) * 2), '#7a4f2c', 0.7, 0.05);
      mariaAct = { type: 'abaixar', t: 0, dur: 0.6, wait: true };
      break;
    }
    case 'pest': {
      const p = plotPos(d.i);
      for (let i = 0; i < 8; i++) spawn(V(p.x, 0.7, p.z + 0.15), V((Math.random() - 0.5) * 3, 2 + Math.random() * 2, (Math.random() - 0.5) * 3), '#7cc14e', 1, 0.05);
      mariaGo(plotFront(d.i), PLOT_FACE);
      mariaAct = { type: 'abaixar', t: 0, dur: 0.5, wait: true };
      break;
    }
    case 'feed': {
      const h = jHead.localToWorld(V(0, 0.3, 0.62));
      for (let i = 0; i < 4; i++) spawn(h.clone().add(rnd3(0.12)), V(0, 0, 0), FOOD_COLOR[d.id] || '#5fb548', 0.6 + i * 0.12, 0.06, 0);
      break;
    }
    case 'florCome': {
      const h = flor.position.clone().add(V(0.1, 0.75, 0.25));
      for (let i = 0; i < 6; i++) spawn(h.clone().add(rnd3(0.1)), V((Math.random() - 0.5), 1 + Math.random(), 0.5), '#f28a1c', 0.8, 0.04);
      floatText('💕', flor.position.clone().add(V(0, 1.3, 0)), '#000', null);
      break;
    }
    case 'florPede': floatText('🥕?', flor.position.clone().add(V(0, 1.35, 0)), '#3b2a1e', '#ffffff'); break;
    case 'delivery': floatText('🛵 Delivery!', V(2.4, 2.2, 0), '#ffffff', '#e5412f'); break;
    case 'pet': {
      const top = jade.position.clone().add(V(0, 1.0, 0));
      for (let i = 0; i < 3; i++) floatText('💗', top.clone().add(V((i - 1) * 0.3, 0, 0)), '#000', null, i * 0.2);
      mariaDo('pegar', 0.5);
      break;
    }
    case 'jadeRegou': {
      if (jadeTrip || jadeMove.walking) break;
      const f = plotFront(d.i);
      jadeTrip = { phase: 'ida', i: d.i, t: 0 };
      jadeMove.path = [JADE_EDGE.clone(), JADE_FLOOR.clone(), ...pathTo(JADE_FLOOR, V(f.x + 0.5, 0, f.z - 0.35))];
      jCan.visible = true;
      break;
    }
  }
};

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
  // sobrancelhas: levemente arqueadas; preocupada, sobem no meio
  mBrows.forEach((b, i) => { const sx = i ? 1 : -1; b.rotation.z = worried ? sx * 0.3 : 0; });
  smile.rotation.z = worried ? Math.PI : 0;   // o modelo vem sorrindo (∪); preocupada vira ∩

  // Maria anda até a estação escolhida
  if (station !== mariaStation) {
    mariaStation = station;
    const [pos, face] = MARIA_AT[station] || MARIA_AT.balcao;
    mariaGo(pos, face);
  }
  stepMover(mariaRoot, mariaMove, dt);
  const walking = mariaMove.walking;
  if (!walking) mariaRoot.rotation.y = lerpAngle(mariaRoot.rotation.y, mariaMove.face, Math.min(1, dt * 6));
  const stepPh = Math.sin(t * 11);
  maria.position.y = walking ? Math.abs(stepPh) * 0.06 : 0;
  legs[0].rotation.x += ((walking ? stepPh * 0.55 : 0) - legs[0].rotation.x) * Math.min(1, dt * 14);
  legs[1].rotation.x += ((walking ? -stepPh * 0.55 : 0) - legs[1].rotation.x) * Math.min(1, dt * 14);
  mCan.visible = inHorta(mariaRoot.position);

  // braços: andar, acenar, pegar, cortar, regar
  let arX = walking ? -stepPh * 0.45 : 0, alX = walking ? stepPh * 0.45 : 0, arZ = 0.25, bend = 0, canTilt = 0;
  if (inGame && station === 'preparo' && !walking && G.run.board) arX = -0.7 - Math.max(0, knifeT) * 0.7;
  if (mariaAct && !(mariaAct.wait && walking)) {
    mariaAct.t += dt;
    const ph = Math.min(1, mariaAct.t / mariaAct.dur), s = Math.sin(ph * Math.PI);
    if (mariaAct.type === 'aceno') { arZ = 0.25 + s * 2.4; arX = -Math.sin(ph * Math.PI * 6) * 0.25; }
    if (mariaAct.type === 'pegar') arX = -s * 1.1;
    if (mariaAct.type === 'abaixar') { bend = s * 0.35; arX = -s * 0.9; alX = -s * 0.9; }
    if (mariaAct.type === 'regar') {
      arX = -1.1 * Math.min(1, ph * 4); canTilt = 0.7 * s;
      if (Math.random() < 0.6) {
        const sp = spout.getWorldPosition(V(0, 0, 0));
        spawn(sp, V((Math.random() - 0.5) * 0.4, -0.5, 0.6 + Math.random() * 0.4).applyAxisAngle(V(0, 1, 0), mariaRoot.rotation.y), '#6fb8ee', 0.7, 0.035);
      }
    }
    if (ph >= 1) mariaAct = null;
  }
  armR.rotation.x += (arX - armR.rotation.x) * Math.min(1, dt * 14);
  armL.rotation.x += (alX - armL.rotation.x) * Math.min(1, dt * 14);
  armR.rotation.z += (arZ - armR.rotation.z) * Math.min(1, dt * 14);
  maria.rotation.x += (bend - maria.rotation.x) * Math.min(1, dt * 10);
  mCan.rotation.x += (canTilt - mCan.rotation.x) * Math.min(1, dt * 10);

  // Jade
  const helping = inGame ? G.jadeHelping() : true;
  const eating = UI.jadeExpr === 'comendo';
  jade.visible = !(inGame && G.run.jadeFuga > 0);
  jBody.scale.set(1, 1 + Math.sin(t * (helping ? 3 : 1.4)) * (helping ? 0.025 : 0.04), 1);
  jBody.rotation.x = eating ? Math.sin(t * 18) * 0.04 : 0;
  for (const e of jEyes) e.scale.y = helping ? (blinkT < 0.12 ? 0.15 : 1) : 0.15;
  zzz.visible = !helping;
  zzz.position.y = 0.85 + Math.sin(t * 2) * 0.05;
  // Jade vai à horta regar e volta para o balcão
  if (jadeTrip) {
    stepMover(jade, jadeMove, dt);
    jBody.position.y = jadeMove.walking ? Math.abs(Math.sin(t * 16)) * 0.08 : 0;
    if (!jadeMove.walking) {
      if (jadeTrip.phase === 'ida') { jadeTrip.phase = 'rega'; jadeTrip.t = 0; }
      else if (jadeTrip.phase === 'rega') {
        jadeTrip.t += dt;
        const p = plotPos(jadeTrip.i);
        jade.rotation.y = lerpAngle(jade.rotation.y, Math.atan2(p.x - jade.position.x, p.z - jade.position.z), Math.min(1, dt * 8));
        jCan.rotation.x = 0.8;
        if (Math.random() < 0.5) spawn(V(p.x + (Math.random() - 0.5) * 0.8, 1.0, p.z + (Math.random() - 0.5) * 0.8), V(0, -1, 0), '#6fb8ee', 0.6, 0.035);
        if (jadeTrip.t > 1.2) {
          jadeTrip.phase = 'volta'; jCan.rotation.x = 0;
          jadeMove.path = [...pathTo(jade.position, JADE_FLOOR), JADE_EDGE.clone(), JADE_POS.clone()];
        }
      } else { jadeTrip = null; jCan.visible = false; }
    }
  } else {
    jade.rotation.y = lerpAngle(jade.rotation.y, 0.55, Math.min(1, dt * 5));
    if (jadeHop > 0) { jadeHop -= dt * 1.6; jBody.position.y = Math.max(0, Math.sin((1 - jadeHop) * Math.PI)) * 0.28; }
    else { jBody.position.y = 0; if (helping && Math.sin(t * 0.9) > 0.995) jadeHop = 1; } // pulinho de alegria de vez em quando
  }
  // Florzinha: respira, abana o rabo, inclina a cabeça, pisca; ao tocar, late
  if (FLOR.flor_cabeca) {
    const fl = inGame ? G.run.flor : null;
    florLate = Math.max(0, florLate - dt);
    const latindo = (fl && fl.late > 0) || florLate > 0, pede = !!(fl && fl.pede > 0);
    if (latindo && (florAuT -= dt) <= 0) { florAuT = 1.1; floatText('AU! AU!', flor.position.clone().add(V(0, 1.35, 0))); }
    const au = latindo ? Math.abs(Math.sin(t * 12)) : 0;
    FLOR.flor_corpo.scale.y = 1 + Math.sin(t * 2.2) * 0.015;
    FLOR.flor_rabo.rotation.z = Math.sin(t * (latindo || pede ? 18 : 7)) * 0.35;
    FLOR.flor_cabeca.rotation.z = latindo ? 0 : pede ? Math.sin(t * 3) * 0.15 : Math.sin(t * 0.6) * 0.12;
    FLOR.flor_cabeca.rotation.x = -au * 0.25 - (pede ? 0.2 : 0);   // ergue a cabeça a cada "au" e quando pede
    FLOR.flor_boca.scale.y = 1 + au * 2.5 + (pede ? 0.8 : 0);
    for (const e of [FLOR.flor_olho_L, FLOR.flor_olho_R]) e.scale.y = blinkT < 0.12 ? 0.15 : 1;
    for (const a of ['laco', 'bandana', 'coroa']) FLOR['flor_acc_' + a].visible = !!G.s && G.s.florAcessorio === a;   // acessório da loja
  }

  const acc = inGame ? G.s.acessorio : null;
  for (const [k2, g] of Object.entries(ACC)) g.visible = acc === k2;

  if (inGame) {
    const r = G.run;
    syncCustomers(dt, t);
    syncMotoboy(dt, t);
    syncPlots(dt, t);

    // prato / tigela / liquidificador do pedido selecionado
    const c = G.selectedCust();
    const dk = c ? `${c.id}|${c.order.recipe}|${c.plate.items.join(',')}|${c.plate.blend}` : 'none';
    if (dk !== dishKey) {
      dishKey = dk;
      const prevN = c && lastDish.id === c.id ? lastDish.n : -1;
      buildDish(c);
      lastDish = { id: c ? c.id : null, n: c ? c.plate.items.length : 0 };
      // o ingrediente novo cai do alto no prato
      // (só quando é o MESMO pedido e ganhou 1 item; antes, trocar para um suco vazio
      //  procurava um pedaço que não existia e travava o 3D)
      dropMesh = null;
      if (c && prevN >= 0 && c.plate.blend === null && c.plate.items.length === prevN + 1) {
        const holder = jarContents || dish;
        dropMesh = holder.children[holder.children.length - 1] || null;
        if (dropMesh) { dropBase = dropMesh.position.y; dropT = 0.3; }
      }
    }
    if (dropMesh && dropT > 0) { dropT -= dt; dropMesh.position.y = dropBase + Math.pow(Math.max(0, dropT) / 0.3, 2) * 0.55; }
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
    sun.intensity += (SUN0 * dark - sun.intensity) * k;
    hemi.intensity += (HEMI0 * (dark < 1 ? 0.55 + dark * 0.45 : 1) - hemi.intensity) * k;
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

  updateFx(dt);
}

// Rede de segurança: um erro num quadro não pode congelar o 3D para sempre
// (o Three.js para de agendar quadros se o loop lançar uma exceção).
let loopErrors = 0;
function safeLoop(now) {
  if (now - last < 1000 / 62) return;        // trava em ~60 fps
  try { loop(now); }
  catch (e) {
    loopErrors++;
    last = now;                               // evita um salto de tempo no próximo quadro
    if (loopErrors <= 3) {
      console.error('[3D] erro no quadro (o jogo continua):', e);
      // mostra na tela para dar para tirar print e reportar
      UI.toast('Erro 3D: ' + String(e && e.message || e).slice(0, 80));
    }
  }
  // desenha SEMPRE, mesmo se a lógica do quadro falhou (senão a tela congela)
  try { renderer.render(scene, camera); } catch (e) { /* ignora */ }
}

// economiza bateria: para quando o app sai da tela
document.addEventListener('visibilitychange', () => {
  if (document.hidden) renderer.setAnimationLoop(null);
  else { last = performance.now(); renderer.setAnimationLoop(safeLoop); }
});
window.addEventListener('DOMContentLoaded', () => { place(); renderer.setAnimationLoop(safeLoop); });
if (document.readyState !== 'loading') { place(); renderer.setAnimationLoop(safeLoop); }
window.__world = { scene, camera, renderer, VIEWS, jade, mariaRoot, get jadeTrip() { return jadeTrip; }, get parts() { return parts.length; }, get loopErrors() { return loopErrors; } }; // para depuração
