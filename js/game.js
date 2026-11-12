'use strict';
// ===== Lógica do jogo: estado, dia, clientes, horta, Jade, desgaste, salvamento =====

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
      velho: {},  // ingredientes que passaram do ponto (tiram pontos)
      seeds: { alface: 2, tomate: 1, cenoura: 2, morango: 1 },
      plots: [
        { crop: 'alface', stage: 'growing', grow: 20, water: 80, dry: 0 },
        { crop: 'cenoura', stage: 'growing', grow: 10, water: 60, dry: 0 },
        { crop: null }, { crop: null },
      ],
      jade: { fome: 70, alegria: 70 },
      up: {}, acessorios: [], acessorio: null,
      faca: 100, aduboDias: 0, irrigQuebrada: false,
      eventBag: [], lastEvent: null,
    };
  },

  // ---------- Melhorias ----------
  lvl(id) { return (this.s && this.s.up[id]) || 0; },
  maxSpots() { return MAX_SPOTS + this.lvl('balcao'); },
  // faca cega precisa de mais toques
  chopsNeeded() {
    const f = this.s ? this.s.faca : 100;
    return 5 - this.lvl('faca') + (f <= 0 ? 3 : f < 35 ? 1 : 0);
  },
  blendZone() { return this.lvl('liquid') ? [0.55, 0.87] : [0.62, 0.82]; },

  buyUpgrade(id) {
    const u = UPGRADES.find(x => x.id === id);
    const n = this.lvl(id);
    if (!u || n >= u.precos.length) return;
    const p = u.precos[n];
    if (this.s.coins < p) { UI.toast('Moedas insuficientes!'); SFX.bad(); return; }
    this.s.coins -= p;
    this.s.up[id] = n + 1;
    if (id === 'canteiro') this.s.plots.push({ crop: null });
    if (id === 'irrigacao') this.s.irrigQuebrada = false;
    UI.toast(`${u.nome}: ${u.desc[n]}`);
    SFX.coin();
    this.save();
  },

  // Comprar ou vestir/tirar um acessório da Jade
  tapAcessorio(id) {
    const a = ACESSORIOS.find(x => x.id === id);
    if (!a) return;
    if (!this.s.acessorios.includes(id)) {
      if (this.s.coins < a.preco) { UI.toast('Moedas insuficientes!'); SFX.bad(); return; }
      this.s.coins -= a.preco;
      this.s.acessorios.push(id);
      this.s.acessorio = id;
      SFX.coin();
    } else {
      this.s.acessorio = this.s.acessorio === id ? null : id;
      SFX.squeak();
    }
    this.save();
  },

  save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.s)); } catch (e) { /* modo privado */ } },
  load() {
    try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
  },
  hasSave() { return !!this.load(); },

  startGame(continuar) {
    this.s = (continuar && this.load()) || this.newState();
    // saves de versões antigas não têm estes campos
    const def = this.newState();
    for (const k of ['up', 'acessorios', 'acessorio', 'velho', 'faca', 'aduboDias', 'irrigQuebrada', 'eventBag', 'lastEvent']) {
      if (this.s[k] === undefined) this.s[k] = def[k];
    }
    if (this.s.up.adubo) { delete this.s.up.adubo; this.s.aduboDias = 3; } // adubo virou item do mercado
    this.startDay();
  },

  startDay() {
    const d = DIFF(this.s.day);
    this.run = {
      phase: 'prep', prepLeft: d.prep, diff: d, time: 0, openAt: 0,
      customers: [], nextNum: 1, spawned: 0, spawnTimer: 2,
      served: 0, lost: 0, earned: 0, scores: [],
      selected: null, board: null, bought: {},
      jadeTimer: 4, jadeHelping: null, petCooldown: 0,
      blend: null, leaving: [],
      // eventos surpresa
      evQueue: [], ev: { rush: 0, chuva: 0, luz: 0 }, jadeFuga: 0,
      nextVip: false, nextAlergico: false, pratos: null, lavar: 0, log: [],
    };
    this.save();
    UI.dirty = true;
  },

  openDoors() {
    if (this.run.phase !== 'prep') return;
    this.run.phase = 'service';
    this.run.openAt = this.run.time;
    this.run.spawnTimer = 1;
    EV.schedule();
    SFX.bell();
    UI.toast('Portas abertas! Os clientes estão chegando.');
    UI.dirty = true;
  },

  // ---------- Estoque (fresco primeiro, depois o passado) ----------
  have(id) { return (this.s.stock[id] || 0) + (this.s.velho[id] || 0); },
  take(id) {
    if ((this.s.stock[id] || 0) > 0) { this.s.stock[id]--; return 'fresco'; }
    if ((this.s.velho[id] || 0) > 0) { this.s.velho[id]--; return 'velho'; }
    return null;
  },
  give(id, n, velho) {
    const bag = velho ? this.s.velho : this.s.stock;
    bag[id] = (bag[id] || 0) + n;
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
    let pat = r.diff.paciencia * (0.85 + Math.random() * 0.3);
    const c = {
      id: r.nextNum++, name: pick(NOMES), look: randomLook(),
      state: 'chegou', order: this.newOrder(),
      patience: pat, maxPatience: pat, alerted: false,
      plate: { items: [], blend: null, bad: 0 },
      // tempos (segundos de jogo) usados na nota
      arrivedAt: r.time, takenAt: null, prepStartAt: null,
    };
    if (r.nextVip) { r.nextVip = false; c.vip = true; c.name = 'Crítico ' + c.name; c.patience = c.maxPatience = pat * 0.7; }
    if (r.nextAlergico) { r.nextAlergico = false; c.order.sem = EV.semIngrediente(c.order); }
    r.customers.push(c);
    r.spawned++;
    SFX.bell();
    UI.dirty = true;
  },

  takeOrder(id) {
    const c = this.cust(id);
    if (!c || c.state !== 'chegou') return;
    c.state = 'esperando';
    c.takenAt = this.run.time;
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
      const kind = this.take(ingId);
      if (!kind) { UI.toast(`Acabou ${ING[ingId].nome.toLowerCase()}!`); SFX.bad(); return false; }
      if (kind === 'velho') { c.plate.bad++; UI.toast(`${ING[ingId].nome} passado… vai tirar pontos!`); }
    }
    if (c.prepStartAt === null) c.prepStartAt = this.run.time; // começou a preparar
    c.plate.items.push(ingId);
    SFX.add();
    UI.dirty = true;
    return true;
  },

  trashPlate() {
    const c = this.selectedCust();
    if (!c || !c.plate.items.length) return;
    c.plate = { items: [], blend: null, bad: 0 };
    SFX.bad();
    UI.dirty = true;
  },

  blendStart() {
    const c = this.selectedCust();
    if (!c || c.order.recipe !== 'suco' || c.plate.blend !== null || !c.plate.items.length) return;
    if (this.run.ev.luz > 0) { UI.toast('Sem energia! O liquidificador não liga.'); SFX.bad(); return; }
    this.run.blend = { p: 0, tick: 0 };
  },
  blendEnd() {
    const b = this.run.blend;
    if (!b) return;
    this.run.blend = null;
    const c = this.selectedCust();
    if (!c) return;
    const [lo, hi] = this.blendZone(); // faixa verde
    const dist = b.p < lo ? lo - b.p : b.p > hi ? b.p - hi : 0;
    c.plate.blend = b.p >= 1 ? 0.2 : clamp(1 - dist * 4, 0, 1);
    UI.toast(c.plate.blend >= 0.95 ? 'Batido no ponto!' : b.p >= 1 ? 'Bateu demais!' : b.p < lo ? 'Ficou pedaçudo…' : 'Quase no ponto.');
    UI.dirty = true;
  },

  serve() {
    const r = this.run, c = this.selectedCust();
    if (!c || !c.plate.items.length) return;
    if (c.order.recipe === 'suco' && c.plate.blend === null) { UI.toast('Bata o suco antes de servir!'); return; }
    if (r.pratos !== null && r.pratos <= 0) { UI.toast('Sem louça limpa! Lave antes de servir.'); SFX.bad(); return; }
    if (r.pratos !== null) r.pratos--;
    const card = scoreDish(c, r.time);
    const score = card.total;
    const rec = RECIPES[c.order.recipe];
    const ratio = c.patience / c.maxPatience;
    UI.scoreCard(c.name, card);
    const tip = score >= 70 ? Math.round(rec.preco * 0.6 * ratio) : 0;
    let gain = Math.round(rec.preco * score / 100) + tip;
    if (c.vip) {
      if (score >= 90) { gain *= 3; UI.alert('⭐', 'O crítico adorou!', `Pagou o triplo: +${gain}`); r.log.push(`⭐ Crítico adorou (nota ${score})`); }
      else { r.lost++; UI.alert('📝', 'O crítico não gostou…', 'Nota abaixo de 90: você perdeu 1 ❤️'); r.log.push(`📝 Crítico reprovou (nota ${score})`); SFX.bad(); }
    }
    if (c.order.sem && card.alergia) r.log.push(`🚫 ${c.name} recebeu ${ING[c.order.sem].nome.toLowerCase()}!`);
    this.s.coins += gain;
    r.earned += gain;
    r.served++;
    r.scores.push(score);
    this.leave(c, score >= 70 ? 'feliz' : score >= 40 ? 'ok' : 'bravo',
      `${score >= 90 ? '😍' : score >= 70 ? '🙂' : score >= 40 ? '😐' : '😠'} +${gain}`);
    if (tip && !c.vip) UI.toast(`Gorjeta de ${c.name}: +${tip}`);
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

  // Louça suja (evento): lavar com toques
  wash() {
    const r = this.run;
    if (r.pratos === null) return;
    r.lavar++;
    SFX.water();
    if (r.lavar >= LAVAR_TOQUES) { r.lavar = 0; r.pratos += 3; UI.toast('+3 pratos limpos'); SFX.add(); }
    UI.dirty = true;
  },

  // ---------- Preparo ----------
  putOnBoard(id) {
    if (this.run.board) { UI.toast('A tábua está ocupada.'); return; }
    const kind = this.take(id);
    if (!kind) { UI.toast(`Sem ${ING[id].nome.toLowerCase()}. Colha na horta!`); SFX.bad(); return; }
    this.run.board = { id, chops: 0, velho: kind === 'velho' };
    SFX.tap();
    UI.dirty = true;
  },
  chop() {
    const b = this.run.board;
    if (!b) return;
    b.chops++;
    SFX.chop();
    if (b.chops >= this.chopsNeeded()) {
      const ing = ING[b.id];
      this.give(ing.cutTo, ing.cutYield, b.velho);
      UI.toast(`+${ing.cutYield} ${ING[ing.cutTo].nome.toLowerCase()}${b.velho ? ' (passado)' : ''}`);
      this.run.board = null;
      // a faca perde o fio a cada corte
      const antes = this.s.faca;
      this.s.faca = Math.max(0, this.s.faca - FIO_POR_CORTE);
      if (antes >= 35 && this.s.faca < 35) UI.toast('A faca está perdendo o fio…');
      if (antes > 0 && this.s.faca <= 0) { UI.alert('🔪', 'A faca ficou cega!', 'Afie no Preparo ou cortar vai demorar'); this.run.log.push('🔪 A faca ficou cega'); }
      SFX.add();
    }
    UI.dirty = true;
  },
  sharpen() {
    if (this.s.faca >= 100) { UI.toast('A faca já está afiada.'); return; }
    this.s.faca = this.lvl('amolador') ? 100 : Math.min(100, this.s.faca + 15);
    SFX.chop();
    if (this.s.faca >= 100) { UI.toast('Faca afiada!'); SFX.add(); }
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
    if ((p.stage !== 'pronto' && p.stage !== 'passado') || p.praga) return;
    const ruim = p.stage === 'passado';
    const got = CROPS[p.crop].colheita;
    const txt = [];
    for (const [id, n0] of Object.entries(got)) {
      const n = ruim ? Math.ceil(n0 / 2) : n0;
      this.give(id, n, ruim);
      txt.push(`${n} ${ING[id].nome.toLowerCase()}`);
    }
    UI.toast(ruim ? `Colheu ${txt.join(', ')} passados (tiram pontos)` : `Colheu ${txt.join(', ')}`);
    this.s.plots[i] = { crop: null };
    SFX.harvest();
    UI.dirty = true;
  },
  clearPlot(i) { this.s.plots[i] = { crop: null }; SFX.tap(); UI.dirty = true; },
  removePest(i) {
    const p = this.s.plots[i];
    if (!p.praga) return;
    p.praga = false; p.pragaT = 0;
    UI.toast('Lagarta removida!');
    SFX.harvest();
    UI.dirty = true;
  },
  fixIrrigation() {
    if (!this.s.irrigQuebrada) return;
    if (this.s.coins < CONSERTO_IRRIGACAO) { UI.toast('Moedas insuficientes para o conserto!'); SFX.bad(); return; }
    this.s.coins -= CONSERTO_IRRIGACAO;
    this.s.irrigQuebrada = false;
    UI.toast('Irrigação consertada!');
    this.run.log.push(`🔧 Conserto da irrigação (−${CONSERTO_IRRIGACAO})`);
    SFX.coin();
    UI.dirty = true;
  },

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
    if (item.tipo === 'adubo') { this.s.aduboDias += item.qtd; UI.toast(`Adubo por mais ${item.qtd} dias`); }
    else {
      const bag = item.tipo === 'semente' ? this.s.seeds : this.s.stock;
      bag[item.id] = (bag[item.id] || 0) + item.qtd;
    }
    SFX.coin();
    UI.dirty = true;
  },

  // ---------- Jade ----------
  jadeHelping() { const j = this.s.jade; return j.fome > 35 && j.alegria > 25; },
  feedJade(id) {
    const f = JADE_FOOD[id];
    if (!f) return;
    if (f.recusa) { UI.jadeSay(f.fala); SFX.bad(); return; }
    if ((this.s.stock[id] || 0) <= 0) {
      UI.jadeSay((this.s.velho[id] || 0) > 0 ? 'Jade não come legume passado!' : `Sem ${ING[id].nome.toLowerCase()} fresco.`);
      return;
    }
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
    r.time += dt;

    if (r.phase === 'prep') {
      r.prepLeft -= dt;
      if (r.prepLeft <= 0) this.openDoors();
    }

    // Horta: só cresce regada; irrigação quebrada vaza água; pronto demais passa do ponto
    const irr = this.lvl('irrigacao');
    const drain = WATER_DRAIN * (this.s.irrigQuebrada ? 1.6 : irr ? 0.6 : 1);
    const growRate = this.s.aduboDias > 0 ? 1.3 : 1;
    const raining = r.ev.chuva > 0;
    for (const p of this.s.plots) {
      if (!p.crop) continue;
      if (p.praga) {
        p.pragaT = (p.pragaT || 0) + dt;
        if (p.pragaT > PRAGA_LIMIT) {
          p.praga = false; p.stage = 'murcho';
          UI.toast(`A lagarta comeu ${CROPS[p.crop].nome.toLowerCase()}!`);
          r.log.push(`🐛 Lagarta destruiu ${CROPS[p.crop].nome.toLowerCase()}`);
          SFX.bad(); UI.dirty = true;
        }
        continue; // planta atacada não cresce
      }
      if (p.stage === 'pronto') {
        p.ripe = (p.ripe || 0) + dt;
        if (p.ripe > RIPE_LIMIT) { p.stage = 'passado'; UI.toast(`${CROPS[p.crop].nome} passou do ponto!`); UI.dirty = true; }
        continue;
      }
      if (p.stage !== 'growing') continue;
      if (raining) p.water = 100;
      p.water -= drain * dt;
      if (p.water <= 0) {
        p.water = 0; p.dry += dt;
        if (p.dry > DRY_LIMIT) { p.stage = 'murcho'; UI.toast(`${CROPS[p.crop].nome} murchou!`); SFX.bad(); UI.dirty = true; }
      } else {
        p.dry = 0; p.grow += dt * growRate;
        if (p.grow >= CROPS[p.crop].tempo) { p.stage = 'pronto'; p.ripe = 0; UI.dirty = true; }
      }
    }

    // Jade: fome e alegria caem com o tempo
    const j = this.s.jade;
    j.fome = Math.max(0, j.fome - 0.22 * (this.lvl('casinha') ? 0.6 : 1) * dt);
    j.alegria = Math.max(0, j.alegria - 0.12 * (this.lvl('brinquedos') ? 0.5 : 1) * dt);
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
        const dry = this.s.plots.filter(p => p.stage === 'growing' && !p.praga && p.water < 45).sort((a, b) => a.water - b.water)[0];
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

    EV.update(dt);

    // Chegada de clientes (mais rápido na hora do rush)
    r.spawnTimer -= dt * (r.ev.rush > 0 ? 2.5 : 1);
    if (r.spawnTimer <= 0 && r.spawned < r.diff.total && r.customers.length < this.maxSpots()) {
      this.spawnCustomer();
      r.spawnTimer = r.diff.intervalo * (0.8 + Math.random() * 0.4);
    }

    // Paciência (chuva deixa todo mundo mais impaciente)
    const patRate = raining ? 1.25 : 1;
    for (const c of [...r.customers]) {
      c.patience -= dt * patRate * (c.state === 'chegou' ? 0.8 : 1);
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
    r.ev = { rush: 0, chuva: 0, luz: 0 };
    r.jadeFuga = 0;
    UI.clearEventFx();
    for (const c of r.customers) r.lost++;
    r.customers = [];
    const avg = r.scores.length ? r.scores.reduce((a, b) => a + b, 0) / r.scores.length : 0;
    r.avg = Math.round(avg);
    r.stars = failed ? 0 : avg >= 90 ? 3 : avg >= 75 ? 2 : avg >= 50 ? 1 : 0;
    // Desgaste do dia
    if (this.s.aduboDias > 0) {
      this.s.aduboDias--;
      if (!this.s.aduboDias) r.log.push('🌿 O adubo acabou (compre no Mercado)');
    }
    if (this.s.irrigQuebrada) {
      this.s.irrigQuebrada = false;
      this.s.up.irrigacao = 0;
      r.log.push('💧 A irrigação quebrou de vez! Compre outra na loja');
    }
    if (this.s.faca < 35) r.log.push(`🔪 Faca com ${this.s.faca}% de fio`);
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

// ===== Nota do atendimento (0 a 100) =====
// Quatro critérios, cada um de 0 a 1, com pesos:
//   Atendimento  15  rapidez para anotar o pedido depois que o cliente chegou
//   Preparo      20  tempo do 1º ingrediente até servir, comparado ao esperado
//   Precisão     50  ingredientes certos (e na ordem, no sanduíche; ponto do suco)
//   Entrega      15  paciência que o cliente ainda tinha ao receber
const NOTA_PESOS = { atendimento: 15, preparo: 20, precisao: 50, entrega: 15 };

// 1 até `ok` segundos, cai linearmente até 0 em `zero` segundos
const timeScore = (t, ok, zero) => clamp(1 - (t - ok) / (zero - ok), 0, 1);

function precisionScore(order, plate) {
  if (order.recipe === 'sanduiche') {
    // camada por camada: cada posição só vale se for o ingrediente certo
    const want = order.layers, got = plate.items;
    let hits = 0;
    for (let i = 0; i < want.length; i++) if (got[i] === want[i]) hits++;
    return hits / Math.max(want.length, got.length);
  }
  // salada e suco: o que faltou e o que sobrou contam como erro
  const got = countItems(plate.items);
  const ids = new Set([...Object.keys(order.counts), ...Object.keys(got)]);
  let wrong = 0, total = 0;
  for (const id of ids) {
    const w = order.counts[id] || 0;
    wrong += Math.abs(w - (got[id] || 0));
    total += w;
  }
  const p = clamp(1 - wrong / total, 0, 1);
  return order.recipe === 'suco' ? p * 0.7 + (plate.blend || 0) * 0.3 : p;
}

function scoreDish(c, now) {
  const n = c.plate.items.length;
  const esperado = 3 + n * 1.5 + (c.order.recipe === 'suco' ? 3 : 0); // segundos de preparo
  const parts = {
    atendimento: timeScore(c.takenAt - c.arrivedAt, 3, 15),
    preparo: timeScore(now - (c.prepStartAt ?? now), esperado, esperado * 2.5),
    // cada ingrediente passado tira 15% da precisão
    precisao: precisionScore(c.order, c.plate) * Math.max(0, 1 - 0.15 * (c.plate.bad || 0)),
    entrega: clamp((c.patience / c.maxPatience) / 0.6, 0, 1),
  };
  // Cliente alérgico recebeu o ingrediente proibido: nota zero
  const alergia = !!(c.order.sem && c.plate.items.includes(c.order.sem));
  if (alergia) parts.precisao = 0;
  let total = 0;
  for (const k in NOTA_PESOS) total += parts[k] * NOTA_PESOS[k];
  // Prato errado não pode tirar nota alta só por ser rápido
  if (parts.precisao < 0.5) total = Math.min(total, 49);
  if (alergia) total = 0;
  return { total: Math.round(total), parts, alergia };
}
