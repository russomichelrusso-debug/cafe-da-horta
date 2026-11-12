'use strict';
// ===== Lógica do jogo: estado, dia, clientes, horta, Jade, salvamento =====

const SAVE_KEY = 'cafe-da-horta-v1';
const MAX_SPOTS = 3;     // clientes no balcão ao mesmo tempo
const MAX_LOST = 3;      // clientes perdidos que encerram o dia

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function countItems(list) {
  const m = {};
  for (const id of list) m[id] = (m[id] || 0) + 1;
  return m;
}

const G = {
  s: null,    // estado salvo (persistente entre dias)
  run: null,  // estado do dia atual (não salvo)

  newState() {
    return {
      day: 1, coins: 25, best: 0,
      stock: { pao: 6, alface: 4, tomate: 2, tomate_f: 3, cenoura: 2, cenoura_r: 3,
               queijo: 4, molho: 4, laranja: 4, morango: 2, acucar: 6 },
      seeds: { alface: 2, tomate: 1, cenoura: 2, morango: 1 },
      plots: [
        { crop: 'alface', stage: 'growing', grow: 20, water: 80, dry: 0 },
        { crop: 'cenoura', stage: 'growing', grow: 10, water: 60, dry: 0 },
        { crop: null }, { crop: null },
      ],
      jade: { fome: 70, alegria: 70 },
    };
  },

  save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.s)); } catch (e) { /* modo privado */ } },
  load() {
    try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
  },
  hasSave() { return !!this.load(); },

  startGame(continuar) {
    this.s = (continuar && this.load()) || this.newState();
    this.startDay();
  },

  startDay() {
    const d = DIFF(this.s.day);
    this.run = {
      phase: 'prep', prepLeft: d.prep, diff: d,
      customers: [], nextNum: 1, spawned: 0, spawnTimer: 2,
      served: 0, lost: 0, earned: 0, scores: [],
      selected: null, board: null, bought: {},
      jadeTimer: 4, jadeHelping: null, petCooldown: 0,
      blend: null, leaving: [],
    };
    this.save();
    UI.dirty = true;
  },

  openDoors() {
    if (this.run.phase !== 'prep') return;
    this.run.phase = 'service';
    this.run.spawnTimer = 1;
    SFX.bell();
    UI.toast('Portas abertas! Os clientes estão chegando.');
    UI.dirty = true;
  },

  // ---------- Pedidos ----------
  newOrder() {
    const day = this.s.day;
    const r = pick(['sanduiche', 'salada', 'suco']);
    if (r === 'sanduiche') {
      const fill = ['alface', 'tomate_f', 'cenoura_r', 'queijo'];
      const layers = ['pao'];
      const n = rnd(2, this.run.diff.maxRecheio);
      for (let i = 0; i < n; i++) layers.push(pick(fill));
      if (Math.random() < 0.6) layers.push('molho');
      layers.push('pao');
      return { recipe: r, layers };
    }
    if (r === 'salada') {
      const opts = ['tomate_f', 'cenoura_r', 'queijo'];
      const counts = { alface: rnd(1, 2) };
      const extra = rnd(1, Math.min(3, 1 + Math.floor(day / 2)));
      for (let i = 0; i < extra; i++) { const id = pick(opts); counts[id] = Math.min(2, (counts[id] || 0) + 1); }
      if (Math.random() < 0.7) counts.molho = 1;
      return { recipe: r, counts };
    }
    const base = pick([{ laranja: 2 }, { morango: 2 }, { laranja: 2, cenoura: 1 }, { laranja: 1, morango: 1 }]);
    const counts = Object.assign({}, base);
    const a = rnd(0, 2); if (a) counts.acucar = a;
    const g = rnd(0, 2); if (g) counts.gelo = g;
    return { recipe: 'suco', counts };
  },

  spawnCustomer() {
    const r = this.run;
    const pat = r.diff.paciencia * (0.85 + Math.random() * 0.3);
    r.customers.push({
      id: r.nextNum++, name: pick(NOMES), look: randomLook(),
      state: 'chegou', order: this.newOrder(),
      patience: pat, maxPatience: pat, alerted: false,
      plate: { items: [], blend: null },
    });
    r.spawned++;
    SFX.bell();
    UI.dirty = true;
  },

  takeOrder(id) {
    const c = this.cust(id);
    if (!c || c.state !== 'chegou') return;
    c.state = 'esperando';
    c.patience = Math.min(c.maxPatience, c.patience + c.maxPatience * 0.15);
    if (!this.run.selected) this.run.selected = c.id;
    SFX.tap();
    UI.dirty = true;
  },

  cust(id) { return this.run.customers.find(c => c.id === id); },
  selectedCust() { return this.cust(this.run.selected); },

  // ---------- Montagem ----------
  addToPlate(ingId) {
    const c = this.selectedCust();
    if (!c) return false;
    if (c.plate.blend !== null) { UI.toast('O suco já foi batido!'); return false; }
    if (c.plate.items.length >= 9) { UI.toast('Não cabe mais nada!'); return false; }
    if (!ING[ingId].infinito) {
      if ((this.s.stock[ingId] || 0) <= 0) { UI.toast(`Acabou ${ING[ingId].nome.toLowerCase()}!`); SFX.bad(); return false; }
      this.s.stock[ingId]--;
    }
    c.plate.items.push(ingId);
    SFX.add();
    UI.dirty = true;
    return true;
  },

  trashPlate() {
    const c = this.selectedCust();
    if (!c || !c.plate.items.length) return;
    c.plate = { items: [], blend: null };
    SFX.bad();
    UI.dirty = true;
  },

  blendStart() {
    const c = this.selectedCust();
    if (!c || c.order.recipe !== 'suco' || c.plate.blend !== null || !c.plate.items.length) return;
    this.run.blend = { p: 0, tick: 0 };
  },
  blendEnd() {
    const b = this.run.blend;
    if (!b) return;
    this.run.blend = null;
    const c = this.selectedCust();
    if (!c) return;
    // zona verde = 62%..82%
    const lo = 0.62, hi = 0.82;
    const dist = b.p < lo ? lo - b.p : b.p > hi ? b.p - hi : 0;
    c.plate.blend = b.p >= 1 ? 0.2 : clamp(1 - dist * 4, 0, 1);
    UI.toast(c.plate.blend >= 0.95 ? 'Batido no ponto!' : b.p >= 1 ? 'Bateu demais!' : b.p < lo ? 'Ficou pedaçudo…' : 'Quase no ponto.');
    UI.dirty = true;
  },

  serve() {
    const c = this.selectedCust();
    if (!c || !c.plate.items.length) return;
    if (c.order.recipe === 'suco' && c.plate.blend === null) { UI.toast('Bata o suco antes de servir!'); return; }
    const score = clamp(Math.round(scoreDish(c.order, c.plate)), 0, 100);
    const rec = RECIPES[c.order.recipe];
    const ratio = c.patience / c.maxPatience;
    const tip = score >= 70 ? Math.round(rec.preco * 0.6 * ratio) : 0;
    const gain = Math.round(rec.preco * score / 100) + tip;
    this.s.coins += gain;
    this.run.earned += gain;
    this.run.served++;
    this.run.scores.push(score);
    this.leave(c, score >= 70 ? 'feliz' : score >= 40 ? 'ok' : 'bravo',
      `${score >= 90 ? '😍' : score >= 70 ? '🙂' : score >= 40 ? '😐' : '😠'} +${gain}`);
    UI.toast(`${c.name}: nota ${score}${tip ? ` · gorjeta ${tip}` : ''}`);
    SFX.coin();
  },

  leave(c, mood, label) {
    const r = this.run;
    r.customers = r.customers.filter(x => x !== c);
    r.leaving.push({ look: c.look, mood, label, t: 1.6 });
    if (r.selected === c.id) {
      const next = r.customers.find(x => x.state === 'esperando');
      r.selected = next ? next.id : null;
    }
    UI.dirty = true;
  },

  // ---------- Preparo ----------
  putOnBoard(id) {
    if (this.run.board) { UI.toast('A tábua está ocupada.'); return; }
    if ((this.s.stock[id] || 0) <= 0) { UI.toast(`Sem ${ING[id].nome.toLowerCase()}. Colha na horta!`); SFX.bad(); return; }
    this.s.stock[id]--;
    this.run.board = { id, chops: 0 };
    SFX.tap();
    UI.dirty = true;
  },
  chop() {
    const b = this.run.board;
    if (!b) return;
    b.chops++;
    SFX.chop();
    if (b.chops >= 5) {
      const ing = ING[b.id];
      this.s.stock[ing.cutTo] = (this.s.stock[ing.cutTo] || 0) + ing.cutYield;
      UI.toast(`+${ing.cutYield} ${ING[ing.cutTo].nome.toLowerCase()}`);
      this.run.board = null;
      SFX.add();
    }
    UI.dirty = true;
  },

  // ---------- Horta ----------
  plant(i, crop) {
    const p = this.s.plots[i];
    if (p.crop || (this.s.seeds[crop] || 0) <= 0) return;
    this.s.seeds[crop]--;
    this.s.plots[i] = { crop, stage: 'growing', grow: 0, water: 100, dry: 0 };
    UI.plotPick = null;
    SFX.add();
    UI.dirty = true;
  },
  water(i) {
    const p = this.s.plots[i];
    if (p.stage !== 'growing') return;
    p.water = 100; p.dry = 0;
    SFX.water();
    UI.dirty = true;
  },
  harvest(i) {
    const p = this.s.plots[i];
    if (p.stage !== 'pronto') return;
    const got = CROPS[p.crop].colheita;
    for (const [id, n] of Object.entries(got)) this.s.stock[id] = (this.s.stock[id] || 0) + n;
    UI.toast(`Colheu ${Object.entries(got).map(([id, n]) => `${n} ${ING[id].nome.toLowerCase()}`).join(', ')}`);
    this.s.plots[i] = { crop: null };
    SFX.harvest();
    UI.dirty = true;
  },
  clearPlot(i) { this.s.plots[i] = { crop: null }; SFX.tap(); UI.dirty = true; },

  // ---------- Mercado ----------
  price(idx) {
    const n = this.run.bought[idx] || 0;
    return Math.round(MARKET[idx].preco * (1 + INFLACAO * n));
  },
  buy(idx) {
    const item = MARKET[idx];
    const p = this.price(idx);
    if (this.s.coins < p) { UI.toast('Moedas insuficientes!'); SFX.bad(); return; }
    this.s.coins -= p;
    this.run.bought[idx] = (this.run.bought[idx] || 0) + 1;
    const bag = item.tipo === 'semente' ? this.s.seeds : this.s.stock;
    bag[item.id] = (bag[item.id] || 0) + item.qtd;
    SFX.coin();
    UI.dirty = true;
  },

  // ---------- Jade ----------
  jadeHelping() { const j = this.s.jade; return j.fome > 35 && j.alegria > 25; },
  feedJade(id) {
    const f = JADE_FOOD[id];
    if (!f) return;
    if (f.recusa) { UI.jadeSay(f.fala); SFX.bad(); return; }
    if ((this.s.stock[id] || 0) <= 0) { UI.toast(`Sem ${ING[id].nome.toLowerCase()} no estoque.`); return; }
    if (this.s.jade.fome >= 98 && f.fome > 10) { UI.jadeSay('Jade está cheinha!'); return; }
    this.s.stock[id]--;
    const j = this.s.jade;
    j.fome = clamp(j.fome + f.fome, 0, 100);
    j.alegria = clamp(j.alegria + f.alegria, 0, 100);
    UI.jadeSay(f.fala, 'comendo');
    SFX.squeak();
    UI.dirty = true;
  },
  petJade() {
    if (this.run.petCooldown > 0) { UI.jadeSay('Jade quer comer, não só carinho…'); return; }
    this.run.petCooldown = 6;
    this.s.jade.alegria = clamp(this.s.jade.alegria + 12, 0, 100);
    UI.jadeSay('Rrrrr… (ronronando)');
    UI.hearts();
    SFX.squeak();
    UI.dirty = true;
  },

  // ---------- Loop ----------
  update(dt) {
    const r = this.run;
    if (!r || r.phase === 'night') return;

    if (r.phase === 'prep') {
      r.prepLeft -= dt;
      if (r.prepLeft <= 0) this.openDoors();
    }

    // Horta (só cresce regada)
    for (const p of this.s.plots) {
      if (p.stage !== 'growing') continue;
      p.water -= WATER_DRAIN * dt;
      if (p.water <= 0) {
        p.water = 0; p.dry += dt;
        if (p.dry > DRY_LIMIT) { p.stage = 'murcho'; UI.toast(`${CROPS[p.crop].nome} murchou!`); SFX.bad(); UI.dirty = true; }
      } else {
        p.dry = 0; p.grow += dt;
        if (p.grow >= CROPS[p.crop].tempo) { p.stage = 'pronto'; UI.dirty = true; }
      }
    }

    // Jade: fome e alegria caem com o tempo
    const j = this.s.jade;
    j.fome = Math.max(0, j.fome - 0.22 * dt);
    j.alegria = Math.max(0, j.alegria - 0.12 * dt);
    r.petCooldown = Math.max(0, r.petCooldown - dt);
    const helping = this.jadeHelping();
    if (helping !== r.jadeHelping) {
      if (r.jadeHelping !== null) UI.toast(helping ? 'Jade acordou e voltou a ajudar!' : 'Jade ficou com fome e foi dormir…');
      r.jadeHelping = helping;
      UI.dirty = true;
    }
    if (helping) {
      r.jadeTimer -= dt;
      if (r.jadeTimer <= 0) {
        r.jadeTimer = 8;
        const dry = this.s.plots.filter(p => p.stage === 'growing' && p.water < 45).sort((a, b) => a.water - b.water)[0];
        if (dry) { dry.water = 100; dry.dry = 0; UI.toast(`Jade regou ${CROPS[dry.crop].nome.toLowerCase()}`); }
      }
    }

    // Liquidificador (segurar o botão)
    if (r.blend) {
      r.blend.p += dt / 2.2;
      r.blend.tick -= dt;
      if (r.blend.tick <= 0) { r.blend.tick = 0.09; SFX.blendTick(); }
      if (r.blend.p >= 1) { r.blend.p = 1; this.blendEnd(); }
    }

    // Saídas animadas no balcão
    if (r.leaving.length) {
      for (const l of r.leaving) l.t -= dt;
      const before = r.leaving.length;
      r.leaving = r.leaving.filter(l => l.t > 0);
      if (r.leaving.length !== before) UI.dirty = true;
    }

    if (r.phase !== 'service') return;

    // Chegada de clientes
    r.spawnTimer -= dt;
    if (r.spawnTimer <= 0 && r.spawned < r.diff.total && r.customers.length < MAX_SPOTS) {
      this.spawnCustomer();
      r.spawnTimer = r.diff.intervalo * (0.8 + Math.random() * 0.4);
    }

    // Paciência
    for (const c of [...r.customers]) {
      c.patience -= dt * (c.state === 'chegou' ? 0.8 : 1);
      const ratio = c.patience / c.maxPatience;
      if (ratio < 0.33 && !c.alerted) {
        c.alerted = true;
        if (helping) { SFX.squeak(); UI.toast(`Jade: uii! ${c.name} está com pressa!`); }
      }
      if (c.patience <= 0) {
        r.lost++;
        this.leave(c, 'bravo', '😡 foi embora');
        SFX.bad();
        UI.toast(`${c.name} cansou de esperar!`);
      }
    }

    // Fim do dia
    const done = r.served + r.lost >= r.diff.total && !r.customers.length;
    if (done || r.lost >= MAX_LOST) this.endDay(r.lost >= MAX_LOST);
  },

  endDay(failed) {
    const r = this.run;
    r.phase = 'night';
    r.failed = failed;
    r.board = null;
    r.blend = null;
    for (const c of r.customers) r.lost++;
    r.customers = [];
    const avg = r.scores.length ? r.scores.reduce((a, b) => a + b, 0) / r.scores.length : 0;
    r.avg = Math.round(avg);
    r.stars = failed ? 0 : avg >= 90 ? 3 : avg >= 75 ? 2 : avg >= 50 ? 1 : 0;
    // Jade feliz encontra uma semente de presente
    r.gift = null;
    if (this.jadeHelping()) {
      r.gift = pick(Object.keys(CROPS));
      this.s.seeds[r.gift] = (this.s.seeds[r.gift] || 0) + 1;
    }
    if (!failed) { this.s.day++; this.s.best = Math.max(this.s.best, this.s.day - 1); }
    this.save();
    UI.dirty = true;
  },
};

// ===== Nota do prato (0 a 100) =====
// order: { recipe:'sanduiche', layers:[ids de baixo p/ cima] }
//     ou { recipe:'salada'|'suco', counts:{ id: quantidade } }
// plate: { items:[ids na ordem em que foram colocados], blend: null | 0..1 }
function scoreDish(order, plate) {
  // TODO(human): calcular a nota do prato comparando order com plate.
  // Valor provisório para o jogo rodar: 100 se tiver algo no prato.
  return plate.items.length ? 100 : 0;
}
