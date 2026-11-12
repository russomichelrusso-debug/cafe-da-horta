'use strict';
// ===== Eventos surpresa no meio do turno =====
// Sorteio por "saco embaralhado": todos os eventos saem uma vez antes de qualquer
// um se repetir (o saco fica salvo entre os dias). Se um evento não pode acontecer
// agora (ex.: vazamento sem irrigação), ele volta para o saco e sai outro.

const EVENTS = {
  praga: {
    em: '🐛', nome: 'Praga na horta',
    ok: () => G.s.plots.some(p => p.crop && (p.stage === 'growing' || p.stage === 'pronto') && !p.praga),
    start() {
      if (G.lvl('joaninhas')) { UI.alert('🐞', 'As joaninhas comeram uma lagarta!', 'Sua horta está protegida'); return '🐞 Joaninhas salvaram a horta'; }
      const p = pick(G.s.plots.filter(p => p.crop && (p.stage === 'growing' || p.stage === 'pronto') && !p.praga));
      p.praga = true; p.pragaT = 0;
      UI.alert('🐛', 'Lagarta na horta!', `Está comendo ${CROPS[p.crop].nome.toLowerCase()}. Vá à Horta e tire!`);
      return `🐛 Lagarta em ${CROPS[p.crop].nome.toLowerCase()}`;
    },
  },
  critico: {
    em: '⭐', nome: 'Crítico gastronômico',
    ok: () => G.run.spawned < G.run.diff.total && !G.run.nextVip,
    start() {
      G.run.nextVip = true;
      UI.alert('⭐', 'Um crítico gastronômico vem aí!', 'Paga o triplo com nota 90+. Abaixo disso, perde 1 ❤️');
      return '⭐ Visita do crítico';
    },
  },
  alergico: {
    em: '🚫', nome: 'Cliente alérgico',
    ok: () => G.run.spawned < G.run.diff.total && !G.run.nextAlergico,
    start() {
      G.run.nextAlergico = true;
      UI.alert('🚫', 'Cliente alérgico chegando', 'Leia a comanda: um ingrediente é PROIBIDO');
      return '🚫 Cliente alérgico';
    },
  },
  mudou: {
    em: '🔄', nome: 'Mudou de ideia',
    ok: () => G.run.customers.some(c => c.state === 'esperando' && c.plate.blend === null),
    start() {
      const c = pick(G.run.customers.filter(c => c.state === 'esperando' && c.plate.blend === null));
      const txt = EV.changeOrder(c);
      c.changedAt = G.run.time;
      c.patience = Math.min(c.maxPatience, c.patience + c.maxPatience * 0.1);
      UI.alert('🔄', `${c.name} mudou de ideia!`, txt);
      return `🔄 ${c.name} mudou o pedido`;
    },
  },
  rush: {
    em: '🏃', nome: 'Hora do rush',
    ok: () => G.run.spawned < G.run.diff.total - 1,
    start() { G.run.ev.rush = 30; UI.alert('🏃', 'Hora do rush!', 'Clientes chegando em dobro por 30 segundos'); return '🏃 Hora do rush'; },
  },
  chuva: {
    em: '🌧️', nome: 'Chuva',
    ok: () => true,
    start() { G.run.ev.chuva = 40; UI.alert('🌧️', 'Começou a chover!', 'A horta se rega sozinha, mas os clientes ficam impacientes'); return '🌧️ Chuva'; },
  },
  energia: {
    em: '⚡', nome: 'Queda de energia',
    ok: () => true,
    start() {
      G.run.ev.luz = 20;
      if (G.run.blend) { G.run.blend = null; }
      UI.alert('⚡', 'Acabou a luz!', 'Liquidificador desligado por 20 segundos');
      return '⚡ Queda de energia';
    },
  },
  jadeFoge: {
    em: '🐹', nome: 'Jade escapou',
    ok: () => !G.jadeHelping() && !G.run.jadeFuga,
    start() {
      G.run.jadeFuga = 5;
      UI.showJadeRun();
      SFX.wheek(4, true, 0.45);
      UI.alert('🐹', 'A Jade escapou!', 'Toque nela antes que derrube algo!');
      return null; // o resultado entra no resumo quando terminar
    },
  },
  louca: {
    em: '🍽️', nome: 'Louça suja',
    ok: () => G.run.pratos === null,
    start() {
      if (G.lvl('lavaLoucas')) { UI.alert('🫧', 'A pia encheu…', 'A lava-louças deu conta!'); return '🫧 Lava-louças salvou o dia'; }
      G.run.pratos = 3; G.run.lavar = 0;
      UI.alert('🍽️', 'A pia encheu de louça!', 'Só 3 pratos limpos. Lave na Montagem');
      return '🍽️ Pia cheia de louça';
    },
  },
  vazamento: {
    em: '💧', nome: 'Vazamento',
    ok: () => G.lvl('irrigacao') === 1 && !G.s.irrigQuebrada,
    start() {
      G.s.irrigQuebrada = true;
      UI.alert('💧', 'Vazamento na irrigação!', `A água seca rápido. Conserte na Horta (🪙 ${CONSERTO_IRRIGACAO}) antes da noite`);
      if (G.jadeHelping()) { UI.toast('Jade: uii! Tem água vazando na horta!'); SFX.wheek(2, true, 0.5); }
      return '💧 Vazamento na irrigação';
    },
  },
};

const EV = {
  shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  },

  // Pega o próximo evento do saco que possa acontecer agora
  draw() {
    const s = G.s;
    for (let tries = 0; tries < 2; tries++) {
      if (!s.eventBag.length) {
        s.eventBag = this.shuffle(Object.keys(EVENTS));
        // não repetir o último do saco anterior logo no começo do novo
        if (s.eventBag[0] === s.lastEvent) s.eventBag.push(s.eventBag.shift());
      }
      const i = s.eventBag.findIndex(id => EVENTS[id].ok());
      if (i >= 0) {
        const id = s.eventBag.splice(i, 1)[0];
        s.lastEvent = id;
        return id;
      }
      if (tries === 0 && s.eventBag.length === Object.keys(EVENTS).length) break; // nada possível
      s.eventBag = []; // nenhum dos que sobraram serve: abre um saco novo
    }
    return null;
  },

  // Sorteia em que momentos do turno os eventos vão acontecer
  schedule() {
    const r = G.run;
    const n = EVENTOS_POR_DIA(G.s.day);
    const dur = Math.max(60, r.diff.total * r.diff.intervalo * 0.9);
    const times = [];
    for (let i = 0; i < n; i++) {
      // espalha em fatias iguais do turno, com variação dentro de cada fatia
      const slice = (dur - 15) / n;
      times.push(12 + slice * i + Math.random() * slice * 0.8);
    }
    r.evQueue = times;
  },

  update(dt) {
    const r = G.run;
    const t = r.time - r.openAt;
    if (r.evQueue.length && t >= r.evQueue[0]) {
      r.evQueue.shift();
      const id = this.draw();
      if (id) {
        SFX.alarm();
        const msg = EVENTS[id].start();
        if (msg) r.log.push(msg);
        UI.dirty = true;
      }
    }
    // eventos com duração
    for (const k of ['rush', 'chuva', 'luz']) {
      if (r.ev[k] > 0) {
        r.ev[k] -= dt;
        if (r.ev[k] <= 0) {
          r.ev[k] = 0;
          UI.toast({ rush: 'O rush acabou, ufa!', chuva: 'A chuva parou.', luz: 'A energia voltou!' }[k]);
          UI.dirty = true;
        }
      }
    }
    // Jade fugindo
    if (r.jadeFuga > 0) {
      r.jadeFuga -= dt;
      if (r.jadeFuga <= 0) {
        r.jadeFuga = 0;
        UI.hideJadeRun();
        const opts = Object.keys(G.s.stock).filter(id => G.s.stock[id] > 0);
        if (opts.length) {
          const id = pick(opts);
          const n = Math.min(2, G.s.stock[id]);
          G.s.stock[id] -= n;
          UI.alert('💥', 'A Jade derrubou coisas!', `Perdeu ${n} ${ING[id].nome.toLowerCase()}`);
          r.log.push(`🐹 Jade fugiu e derrubou ${n} ${ING[id].nome.toLowerCase()}`);
        }
        SFX.bad();
        UI.dirty = true;
      }
    }
  },

  catchJade() {
    const r = G.run;
    if (!r || r.jadeFuga <= 0) return;
    r.jadeFuga = 0;
    UI.hideJadeRun();
    G.s.jade.alegria = clamp(G.s.jade.alegria + 8, 0, 100);
    UI.toast('Peguei você, Jade! (ela ainda está com fome…)');
    r.log.push('🐹 Jade escapou, mas foi pega a tempo');
    SFX.wheek(3);
    UI.dirty = true;
  },

  // Cliente alérgico: escolhe um ingrediente da receita que NÃO está no pedido
  semIngrediente(order) {
    const usados = order.layers || Object.keys(order.counts);
    const opts = RECIPES[order.recipe].bins.filter(id => !usados.includes(id) && id !== 'pao' && id !== 'gelo');
    return opts.length ? pick(opts) : null;
  },

  // Cliente mudou de ideia: troca um ingrediente do pedido
  changeOrder(c) {
    const o = c.order;
    if (o.recipe === 'sanduiche') {
      const i = rnd(1, o.layers.length - 2);
      const old = o.layers[i];
      const opts = ['alface', 'tomate_f', 'cenoura_r', 'queijo', 'molho'].filter(id => id !== old && id !== o.sem);
      o.layers[i] = pick(opts);
      return `Trocou ${ING[old].nome.toLowerCase()} por ${ING[o.layers[i]].nome.toLowerCase()}`;
    }
    const keys = Object.keys(o.counts).filter(id => id !== 'gelo' && id !== 'acucar');
    const old = pick(keys.length ? keys : Object.keys(o.counts));
    const opts = RECIPES[o.recipe].bins.filter(id => !(id in o.counts) && id !== o.sem && id !== 'gelo');
    const neu = opts.length ? pick(opts) : old;
    const n = o.counts[old];
    delete o.counts[old];
    o.counts[neu] = (o.counts[neu] || 0) + n;
    return neu === old ? 'Quer o pedido do mesmo jeito… ufa!' : `Trocou ${ING[old].nome.toLowerCase()} por ${ING[neu].nome.toLowerCase()}`;
  },
};
