'use strict';
// ===== Interface: estações, comandas, arrastar com o dedo =====

const TABS = [
  { id: 'balcao',   nome: 'Balcão',   em: '🧾' },
  { id: 'preparo',  nome: 'Preparo',  em: '🔪' },
  { id: 'montagem', nome: 'Montagem', em: '🥪' },
  { id: 'horta',    nome: 'Horta',    em: '🌱' },
  { id: 'mercado',  nome: 'Mercado',  em: '🛒' },
  { id: 'jade',     nome: 'Jade',     em: '🐹' },
];

const UI = {
  station: 'balcao', dirty: true, scale: 1, plotPick: null, bars: [], drag: null,
  screen: 'title', // 'title' | 'game'
  jadeExpr: null, jadeExprT: 0,

  init() {
    injectIcons();
    this.el = {
      wrap: document.getElementById('wrap'), stage: document.getElementById('stage'),
      hud: document.getElementById('hud'), station: document.getElementById('station'),
      rail: document.getElementById('rail'), tabs: document.getElementById('tabs'),
      fx: document.getElementById('fx'), toasts: document.getElementById('toasts'),
      overlay: document.getElementById('overlay'),
    };
    this.fit();
    window.addEventListener('resize', () => this.fit());
    window.addEventListener('orientationchange', () => setTimeout(() => this.fit(), 200));
    // Evita zoom por gesto no iOS
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('dblclick', e => e.preventDefault());

    const st = this.el.stage;
    st.addEventListener('pointerdown', e => { SFX.unlock(); this.onDown(e); });
    window.addEventListener('pointermove', e => this.onMove(e), { passive: true });
    window.addEventListener('pointerup', e => this.onUp(e));
    window.addEventListener('pointercancel', e => this.onUp(e, true));
    st.addEventListener('click', e => {
      const el = e.target.closest('[data-act]');
      if (el && !el.disabled) ACTIONS[el.dataset.act]?.(el.dataset.arg, el);
    });
    this.showTitle();
  },

  // Palco fixo 960x440 escalado para caber na tela (com áreas seguras do notch)
  fit() {
    const w = this.el.wrap.clientWidth, h = this.el.wrap.clientHeight;
    this.scale = Math.min(w / 960, h / 440);
    const x = (w - 960 * this.scale) / 2, y = (h - 440 * this.scale) / 2;
    this.el.stage.style.transform = `translate(${x}px,${y}px) scale(${this.scale})`;
  },

  go(st) { this.station = st; this.plotPick = null; this.dirty = true; SFX.tap(); },

  // ---------- Telas de abertura e noite ----------
  showTitle() {
    this.screen = 'title';
    const cont = G.hasSave();
    const s = G.load();
    this.el.overlay.className = 'title';
    this.el.overlay.innerHTML = `
      <div class="title-art">${mariaSVG('feliz')}<div class="title-jade">${jadeSVG('feliz')}</div></div>
      <div class="title-box">
        <h1>Café da Horta</h1>
        <p class="sub">com Maria Alice &amp; Jade</p>
        ${cont ? `<button class="btn big" data-act="start" data-arg="1">Continuar · Dia ${s.day}</button>` : ''}
        <button class="btn big ${cont ? 'ghost' : ''}" data-act="start" data-arg="0">${cont ? 'Novo jogo' : 'Jogar'}</button>
        <p class="hint">Plante, colha, prepare os pedidos e cuide da Jade.<br>Perca 3 clientes e o dia termina!</p>
        ${window.MODO_3D ? '<a class="proto-link" href="../">🎨 Jogar a versão 2D</a>' : '<a class="proto-link" href="3d/">🧊 Jogar em 3D (beta)</a>'}
      </div>`;
  },

  showNight() {
    const r = G.run, s = G.s;
    const stars = '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars);
    this.el.overlay.className = 'night';
    this.el.overlay.innerHTML = `
      <div class="night-box">
        <h2>${r.failed ? 'Dia difícil…' : 'Fim do expediente!'}</h2>
        <div class="stars">${stars}</div>
        <div class="night-grid">
          <div><b>${r.served}</b><span>atendidos</span></div>
          <div><b>${r.lost}</b><span>perdidos</span></div>
          <div><b>${r.avg}</b><span>nota média</span></div>
          <div><b>🪙 ${r.earned}</b><span>ganhos</span></div>
        </div>
        ${r.log.length ? `<div class="night-log">${r.log.slice(-6).map(l => `<span>${l}</span>`).join('')}</div>` : ''}
        ${r.gift ? `<p class="gift">${ic(r.gift)} A Jade achou uma semente de ${CROPS[r.gift].nome.toLowerCase()}!</p>`
                 : `<p class="gift">A Jade estava com fome e não achou nada hoje.</p>`}
        <p class="hint">${r.failed ? 'Você perdeu 3 clientes. Tente o mesmo dia de novo.' : `Amanhã é o dia ${s.day}: mais clientes e menos paciência.`}</p>
        <div class="night-btns">
          <button class="btn big ghost" data-act="shop">🛍️ Loja · 🪙 ${s.coins}</button>
          <button class="btn big" data-act="next">${r.failed ? 'Tentar de novo' : 'Dormir e abrir o café'}</button>
        </div>
      </div>
      <div class="night-art">${jadeSVG('sono')}</div>`;
  },

  // ---------- Loja de melhorias (à noite) ----------
  shopTab: 'cozinha',
  showShop() {
    const s = G.s, tab = this.shopTab;
    const tabs = [['cozinha', '🔪 Cozinha'], ['horta', '🌱 Horta'], ['jade', '🐹 Jade']];
    const cards = UPGRADES.filter(u => u.aba === tab).map(u => {
      const n = G.lvl(u.id), max = n >= u.precos.length;
      const p = max ? 0 : u.precos[n];
      const dots = u.precos.map((_, i) => i < n ? '●' : '○').join('');
      return `<div class="up-card ${max ? 'max' : ''}">
        <div class="up-em">${u.em}</div>
        <div class="up-txt"><b>${u.nome}</b><span class="up-lv">${dots}</span>
          <small>${max ? 'Nível máximo! ' + u.desc[n - 1] : u.desc[n]}</small></div>
        ${max ? '<span class="up-ok">✓</span>'
              : `<button class="btn go" data-act="upgrade" data-arg="${u.id}" ${s.coins < p ? 'disabled' : ''}>🪙 ${p}</button>`}
      </div>`;
    }).join('');
    const accs = tab !== 'jade' ? '' : `<div class="acc-row">
      <div class="acc-jade">${jadeSVG('feliz')}</div>
      ${ACESSORIOS.map(a => {
        const own = s.acessorios.includes(a.id), on = s.acessorio === a.id;
        return `<button class="acc ${on ? 'on' : ''}" data-act="acc" data-arg="${a.id}" ${!own && s.coins < a.preco ? 'disabled' : ''}>
          <span>${a.em}</span><b>${a.nome}</b><small>${own ? (on ? 'Vestindo · tirar' : 'Vestir') : '🪙 ' + a.preco}</small></button>`;
      }).join('')}</div>`;
    this.el.overlay.className = 'shop';
    this.el.overlay.innerHTML = `
      <div class="shop-box">
        <div class="shop-h"><h2>Loja de melhorias</h2><span class="pill">🪙 ${s.coins}</span>
          <button class="btn" data-act="shopback">← Voltar</button></div>
        <div class="shop-tabs">${tabs.map(([id, nome]) =>
          `<button class="tab ${tab === id ? 'on' : ''}" data-act="shoptab" data-arg="${id}">${nome}</button>`).join('')}</div>
        <div class="up-grid">${cards}</div>${accs}
      </div>`;
  },

  hideOverlay() { this.el.overlay.className = 'hidden'; this.el.overlay.innerHTML = ''; },

  // ---------- Render ----------
  render() {
    this.dirty = false;
    if (this.screen !== 'game' || !G.run) return;
    if (G.run.phase === 'night') {
      if (this.el.overlay.className !== 'night' && this.el.overlay.className !== 'shop') this.showNight();
      return;
    }
    this.renderHud();
    this.renderRail();
    this.renderTabs();
    this.el.station.className = `st-${this.station}`;
    this.el.station.innerHTML = this['st_' + this.station]();
    this.bars = [...this.el.stage.querySelectorAll('[data-bar]')];
    this.tick();
  },

  // Atualização leve (10x/s): só barras e classes, sem recriar HTML
  tick() {
    if (this.screen !== 'game' || !G.run) return;
    const r = G.run, s = G.s;
    for (const el of this.bars) {
      const [k, a] = el.dataset.bar.split(':');
      let v = 0;
      if (k === 'pat') { const c = G.cust(+a); if (!c) continue; v = c.patience / c.maxPatience;
        el.parentNode.classList.toggle('low', v < 0.33);
        const t = el.closest('.ticket');
        if (t) { t.classList.toggle('urgent', v < 0.33 && G.jadeHelping());
                 t.classList.toggle('changed', !!c.changedAt && r.time - c.changedAt < 4); } }
      else if (k === 'ripe') { const p = s.plots[+a]; v = 1 - (p.ripe || 0) / RIPE_LIMIT; }
      else if (k === 'praga') { const p = s.plots[+a]; v = 1 - (p.pragaT || 0) / PRAGA_LIMIT; }
      else if (k === 'fio') v = s.faca / 100;
      else if (k === 'water') v = (s.plots[+a].water || 0) / 100;
      else if (k === 'grow') { const p = s.plots[+a]; v = p.crop ? p.grow / CROPS[p.crop].tempo : 0; }
      else if (k === 'fome') v = s.jade.fome / 100;
      else if (k === 'alegria') v = s.jade.alegria / 100;
      else if (k === 'blend') v = r.blend ? r.blend.p : 0;
      el.style.transform = `scaleX(${clamp(v, 0, 1)})`;
    }
    const pl = document.getElementById('prepLeft');
    if (pl) pl.textContent = Math.ceil(Math.max(0, r.prepLeft));
    // contadores dos eventos e efeitos de tela
    for (const el of this.el.hud.querySelectorAll('[data-ev]')) {
      const v = r.ev[el.dataset.ev];
      el.textContent = Math.ceil(v);
    }
    this.el.stage.classList.toggle('raining', r.ev.chuva > 0);
    this.el.stage.classList.toggle('blackout', r.ev.luz > 0);
    if (this.jadeExprT > 0) { this.jadeExprT -= 0.1; if (this.jadeExprT <= 0) { this.jadeExpr = null; this.dirty = true; } }
  },

  renderHud() {
    const r = G.run, s = G.s;
    const hearts = '❤️'.repeat(Math.max(0, MAX_LOST - r.lost)) + '🖤'.repeat(Math.min(MAX_LOST, r.lost));
    this.el.hud.innerHTML = `
      <div class="hud-l"><b>Dia ${s.day}</b>
        <span class="pill">🪙 ${s.coins}</span>
        <span class="pill">👥 ${r.served + r.lost}/${r.diff.total}</span>
        <span class="pill hearts">${hearts}</span>
        ${r.ev.rush > 0 ? `<span class="pill evt">🏃 Rush <b data-ev="rush">${Math.ceil(r.ev.rush)}</b>s</span>` : ''}
        ${r.ev.chuva > 0 ? `<span class="pill evt">🌧️ <b data-ev="chuva">${Math.ceil(r.ev.chuva)}</b>s</span>` : ''}
        ${r.ev.luz > 0 ? `<span class="pill evt">⚡ Sem luz <b data-ev="luz">${Math.ceil(r.ev.luz)}</b>s</span>` : ''}
        ${s.irrigQuebrada ? '<span class="pill evt">💧 Vazando</span>' : ''}</div>
      <div class="hud-r">
        ${r.phase === 'prep' ? `<span class="prep">Abre em <b id="prepLeft">${Math.ceil(r.prepLeft)}</b>s</span>
          <button class="btn sm go" data-act="open">Abrir portas</button>` : '<span class="prep open">Café aberto</span>'}
        <button class="btn sm ghost" data-act="mute">${SFX.muted ? '🔇' : '🔊'}</button>
        <button class="btn sm ghost" data-act="quit">✕ Sair</button></div>`;
  },

  renderTabs() {
    const r = G.run, s = G.s;
    const badge = {
      balcao: r.customers.filter(c => c.state === 'chegou').length,
      horta: s.plots.filter(p => p.praga || p.stage === 'pronto' || p.stage === 'passado' || p.stage === 'murcho' || (p.stage === 'growing' && p.water < 25)).length + (s.irrigQuebrada ? 1 : 0),
      preparo: s.faca <= 0 ? 1 : 0,
      montagem: r.pratos !== null && r.pratos <= 0 ? 1 : 0,
      jade: G.jadeHelping() ? 0 : 1,
    };
    this.el.tabs.innerHTML = TABS.map(t => `
      <button class="tab ${this.station === t.id ? 'on' : ''}" data-act="tab" data-arg="${t.id}">
        <span class="em">${t.em}</span>${t.nome}${badge[t.id] ? `<i class="badge">${t.id === 'horta' || t.id === 'balcao' ? badge[t.id] : '!'}</i>` : ''}
      </button>`).join('');
  },

  renderRail() {
    const r = G.run;
    const list = r.customers.filter(c => c.state === 'esperando');
    this.el.rail.innerHTML = `<div class="rail-h">Comandas</div>` + (list.length ? list.map(c => {
      const rec = RECIPES[c.order.recipe];
      return `<button class="ticket ${r.selected === c.id ? 'sel' : ''} ${c.vip ? 'vip' : ''}" data-act="select" data-arg="${c.id}">
        <span class="t-num">${c.vip ? '⭐' : String(c.id).padStart(2, '0')}</span>
        ${ic(rec.icon, 't-ic')}
        <span class="t-txt"><b>${c.name}</b><small>${rec.nome}</small>
          ${c.order.sem ? `<em class="t-sem">🚫 sem ${ING[c.order.sem].nome.toLowerCase()}</em>` : ''}</span>
        <span class="t-paw">${ic('pata')}</span>
        <span class="bar"><i data-bar="pat:${c.id}"></i></span>
      </button>`;
    }).join('') : `<p class="rail-empty">${r.phase === 'prep' ? 'Prepare a cozinha antes de abrir!' : 'Anote pedidos no Balcão.'}</p>`);
  },

  // Lista do pedido (usada na montagem)
  orderHTML(order) {
    const sem = order.sem ? `<div class="o-sem">🚫 SEM ${ING[order.sem].nome.toUpperCase()} (alergia!)</div>` : '';
    return sem + this.orderRows(order);
  },
  orderRows(order) {
    if (order.recipe === 'sanduiche') {
      return `<div class="o-stack">${[...order.layers].reverse().map((id, i, a) =>
        `<div class="o-row"><span class="o-n">${a.length - i}</span>${ic(id)}<span>${ING[id].nome}</span></div>`).join('')}</div>
        <p class="o-tip">De baixo (1) para cima. A ordem importa!</p>`;
    }
    const rows = Object.entries(order.counts).map(([id, n]) =>
      `<div class="o-row">${ic(id)}<span>${ING[id].nome}</span><b>×${n}</b></div>`).join('');
    return rows + (order.recipe === 'suco' ? '<p class="o-tip">Segure "Bater" e solte na faixa verde.</p>' : '');
  },

  // ---------- Estações ----------
  st_balcao() {
    const r = G.run;
    const worried = r.customers.some(c => c.patience / c.maxPatience < 0.33);
    const spots = [];
    for (let i = 0; i < G.maxSpots(); i++) spots.push(r.customers[i] || r.leaving[i - r.customers.length] && { leaving: r.leaving[i - r.customers.length] });
    return `
      <div class="cafe-wall"><div class="sign">Café da Horta</div><div class="window"></div><div class="plant-shelf">${ic('alface')}${ic('morango')}${ic('cenoura')}</div></div>
      <div class="maria-spot">${mariaSVG(worried ? 'preoc' : 'feliz')}</div>
      <div class="spots">${spots.map(c => {
        if (!c) return `<div class="spot empty"></div>`;
        if (c.leaving) return `<div class="spot leaving">${customerSVG(c.leaving.look, c.leaving.mood)}<div class="float">${c.leaving.label}</div></div>`;
        const ratio = c.patience / c.maxPatience;
        const mood = ratio < 0.33 ? 'bravo' : 'ok';
        return `<div class="spot ${c.vip ? 'vip' : ''}">
          ${c.vip ? '<div class="vip-tag">⭐ Crítico</div>' : ''}
          ${c.state === 'chegou'
            ? `<button class="bubble ask" data-act="take" data-arg="${c.id}">Anotar pedido</button>`
            : `<div class="bubble wait">#${String(c.id).padStart(2, '0')} ${ic(RECIPES[c.order.recipe].icon)}</div>`}
          ${customerSVG(c.look, mood)}
          <div class="name">${c.name}</div>
          <span class="bar"><i data-bar="pat:${c.id}"></i></span></div>`;
      }).join('')}</div>
      <div class="counter"></div>
      <div class="jade-counter ${G.jadeHelping() ? '' : 'zzz'}">${jadeSVG(G.jadeHelping() ? 'feliz' : 'sono')}</div>
      ${r.phase === 'prep' ? `<div class="banner">Preparação: colha, corte e compre antes de abrir as portas!</div>` : ''}`;
  },

  st_preparo() {
    const s = G.s, b = G.run.board;
    const raw = ['tomate', 'cenoura'];
    const cega = s.faca <= 0;
    return `
      <div class="prep-col"><h3>Para cortar</h3>
        ${raw.map(id => `<button class="bin" data-act="board" data-arg="${id}" ${G.have(id) ? '' : 'disabled'}>
          ${ic(id)}<span>${ING[id].nome}</span><b>${G.have(id)}</b>${this.oldTag(id)}</button>`).join('')}
        <div class="fio ${cega ? 'cega' : s.faca < 35 ? 'gasta' : ''}"><span>🔪 Fio ${cega ? '· CEGA!' : ''}</span>
          <div class="pbar"><i data-bar="fio"></i></div></div>
        <button class="btn sm" data-act="sharpen" ${s.faca >= 100 ? 'disabled' : ''}>${G.lvl('amolador') ? '⚙️ Amolar já' : '🪨 Afiar (toques)'}</button></div>
      <button class="board ${b ? 'full' : ''}" data-act="chop">
        ${b ? `<div class="on-board c${b.chops}">${ic(b.chops >= G.chopsNeeded() / 2 ? ING[b.id].cutTo : b.id)}</div>
               <div class="chops">${'●'.repeat(b.chops)}${'○'.repeat(G.chopsNeeded() - b.chops)}</div>
               <div class="knife">🔪</div><p>Toque para cortar!</p>`
             : '<p>Toque num legume para colocar na tábua</p>'}
      </button>
      <div class="prep-col"><h3>Pronto</h3>
        ${raw.map(id => { const c = ING[id].cutTo; return `<div class="bin static">${ic(c)}<span>${ING[c].nome}</span><b>${G.have(c)}</b>${this.oldTag(c)}</div>`; }).join('')}
      </div>`;
  },

  st_montagem() {
    const c = G.selectedCust();
    if (!c) return `<div class="empty-st">${ic('pao', 'big')}<p>Toque numa comanda à direita para montar o pedido.</p></div>`;
    const rec = RECIPES[c.order.recipe], s = G.s, pl = c.plate;
    const bins = rec.bins.map(id => {
      const n = ING[id].infinito ? '∞' : G.have(id);
      const proibido = c.order.sem === id;
      return `<div class="bin drag ${n === 0 ? 'off' : ''} ${proibido ? 'proibido' : ''}" data-drag="${id}">${ic(id)}<b>${n}</b><span>${ING[id].nome}</span>${this.oldTag(id)}</div>`;
    }).join('');
    const r = G.run;
    const pratos = r.pratos === null ? '' : `<div class="pratos ${r.pratos <= 0 ? 'zero' : ''}">🍽️ ${r.pratos} limpos
      <button class="btn sm" data-act="wash">🧽 Lavar ${r.lavar}/${LAVAR_TOQUES}</button></div>`;
    let dish = '';
    if (c.order.recipe === 'sanduiche') {
      dish = `<div class="plate"><div class="stack">${pl.items.map(id => `<i class="ly ly-${id}"></i>`).join('')}</div></div>`;
    } else if (c.order.recipe === 'salada') {
      dish = `<div class="bowl"><div class="bowl-in">${pl.items.map((id, i) => `<span style="left:${8 + (i * 37) % 75}%;top:${10 + (i * 23) % 55}%">${ic(id)}</span>`).join('')}</div></div>`;
    } else {
      const col = this.juiceColor(pl.items);
      dish = `<div class="blender ${pl.blend !== null ? 'done' : ''}">
        <div class="jar">${pl.blend !== null
          ? `<i class="juice" style="height:${Math.min(100, pl.items.length * 14)}%;background:${col}"></i>`
          : pl.items.map(id => `<i class="chunk" style="background:rgb(${SUCO_COR[id]})"></i>`).join('')}</div>
        <div class="base"></div></div>`;
    }
    const juice = c.order.recipe === 'suco';
    return `
      <div class="order-card"><div class="oc-h">#${String(c.id).padStart(2, '0')} · ${c.name}</div>
        <div class="oc-r">${rec.nome}</div>${this.orderHTML(c.order)}</div>
      <div class="bins">${bins}</div>
      <div class="drop" id="drop">${pratos}${dish}<p class="drop-hint">${pl.items.length ? '' : 'Arraste ou toque nos ingredientes'}</p></div>
      <div class="actions">
        ${juice ? `<div class="meter"><i class="zone" style="left:${G.blendZone()[0] * 100}%;width:${(G.blendZone()[1] - G.blendZone()[0]) * 100}%"></i><i class="fill" data-bar="blend"></i></div>
          <button class="btn blend-btn" data-hold="blend" ${pl.blend !== null || !pl.items.length || r.ev.luz > 0 ? 'disabled' : ''}>${r.ev.luz > 0 ? '⚡ Sem energia' : 'Segurar p/ bater'}</button>` : ''}
        <button class="btn ghost" data-act="trash" ${pl.items.length ? '' : 'disabled'}>🗑️ Lixo</button>
        <button class="btn go" data-act="serve" ${pl.items.length ? '' : 'disabled'}>Servir ✓</button>
      </div>`;
  },

  // Etiqueta marrom quando há unidades passadas do ponto
  oldTag(id) {
    const v = G.s.velho[id] || 0;
    return v ? `<i class="old-tag">${v} passado${v > 1 ? 's' : ''}</i>` : '';
  },

  juiceColor(items) {
    if (!items.length) return '#fff';
    const sum = [0, 0, 0];
    for (const id of items) for (let k = 0; k < 3; k++) sum[k] += SUCO_COR[id][k];
    return `rgb(${sum.map(v => Math.round(v / items.length)).join(',')})`;
  },

  st_horta() {
    const s = G.s;
    return `<div class="garden">${s.plots.map((p, i) => {
      if (!p.crop) {
        if (this.plotPick === i) {
          return `<div class="plot pick"><h4>Plantar:</h4>${Object.keys(CROPS).map(k =>
            `<button class="seed" data-act="plant" data-arg="${i}:${k}" ${s.seeds[k] ? '' : 'disabled'}>${ic(k)}<span>${CROPS[k].nome}</span><b>${s.seeds[k] || 0}</b></button>`).join('')}
            <button class="btn sm ghost" data-act="pickcancel">Cancelar</button></div>`;
        }
        return `<button class="plot empty" data-act="pick" data-arg="${i}"><div class="soil"></div><span>＋ Plantar</span></button>`;
      }
      if (p.praga) return `<div class="plot bug"><div class="soil"></div>
        <div class="crop">${ic(p.stage === 'growing' ? 'broto' : p.crop, 'mid')}<span class="lagarta">🐛</span></div>
        <div class="pbar praga"><i data-bar="praga:${i}"></i></div>
        <button class="btn sm bug-btn" data-act="pest" data-arg="${i}">🐛 Tirar lagarta</button></div>`;
      if (p.stage === 'pronto') return `<button class="plot ready" data-act="harvest" data-arg="${i}"><div class="soil"></div>
        <div class="crop bounce">${ic(p.crop, 'big')}</div>
        <div class="pbar ripe"><i data-bar="ripe:${i}"></i></div><span>Colher!</span></button>`;
      if (p.stage === 'passado') return `<button class="plot passado" data-act="harvest" data-arg="${i}"><div class="soil"></div>
        <div class="crop">${ic(p.crop, 'big')}</div><span>Passou do ponto · colher</span></button>`;
      if (p.stage === 'murcho') return `<button class="plot dead" data-act="clear" data-arg="${i}"><div class="soil"></div>
        <div class="crop">${ic('murcho', 'big')}</div><span>Murchou · limpar</span></button>`;
      const prog = p.grow / CROPS[p.crop].tempo;
      return `<div class="plot growing ${p.water < 25 ? 'thirsty' : ''}"><div class="soil wet" style="opacity:${0.4 + p.water / 170}"></div>
        <div class="crop">${ic(prog < 0.5 ? 'broto' : p.crop, prog < 0.5 ? '' : 'mid')}</div>
        <div class="p-name">${CROPS[p.crop].nome}</div>
        <div class="pbar grow"><i data-bar="grow:${i}"></i></div>
        <div class="pbar water"><i data-bar="water:${i}"></i></div>
        <button class="btn sm water-btn" data-act="water" data-arg="${i}">${ic('regador')} Regar</button></div>`;
    }).join('')}</div>
    ${s.irrigQuebrada ? `<div class="leak">💧 Vazamento na irrigação! A água seca rápido. Se não consertar hoje, ela quebra de vez.
      <button class="btn sm go" data-act="fix" ${s.coins < CONSERTO_IRRIGACAO ? 'disabled' : ''}>🔧 Consertar · 🪙 ${CONSERTO_IRRIGACAO}</button></div>` : ''}
    <p class="garden-tip">💧 Só cresce regada. Pronta demais, passa do ponto.
      ${s.aduboDias > 0 ? `🌿 Adubo: ${s.aduboDias} dia${s.aduboDias > 1 ? 's' : ''}.` : '🌿 Sem adubo.'}
      ${G.jadeHelping() ? ' 🐹 A Jade rega as mais secas!' : ''}</p>`;
  },

  st_mercado() {
    const s = G.s;
    return `<div class="market">${MARKET.map((m, i) => {
      const p = G.price(i);
      const seed = m.tipo === 'semente', adubo = m.tipo === 'adubo';
      const have = adubo ? `${s.aduboDias} dias` : seed ? (s.seeds[m.id] || 0) : (s.stock[m.id] || 0);
      return `<button class="item ${seed ? 'seed-item' : ''} ${adubo ? 'adubo-item' : ''}" data-act="buy" data-arg="${i}" ${s.coins < p ? 'disabled' : ''}>
        <div class="it-ic">${ic(adubo ? 'broto' : m.id)}${seed ? '<i class="pack">semente</i>' : adubo ? '<i class="pack">adubo</i>' : ''}</div>
        <span class="it-n">${adubo ? `Adubo · ${m.qtd} dias (+30%)` : seed ? 'Sementes de ' + CROPS[m.id].nome.toLowerCase() : ING[m.id].nome}${adubo ? '' : ' ×' + m.qtd}</span>
        <span class="it-have">tem ${have}</span>
        <b class="it-p">🪙 ${p}</b></button>`;
    }).join('')}</div>`;
  },

  st_jade() {
    const s = G.s, help = G.jadeHelping();
    const expr = this.jadeExpr || (help ? 'feliz' : 'sono');
    const foods = Object.keys(JADE_FOOD);
    return `
      <div class="jade-home">
        <div class="hay"></div>
        <div class="jade-big ${expr}" id="jadeDrop">${jadeSVG(expr)}</div>
        <div class="say" id="jadeSay">${this.jadeLine || (help ? 'Jade está pronta para ajudar!' : 'Zzz… Jade está com fome.')}</div>
      </div>
      <div class="jade-side">
        <div class="jbar"><span>🍽️ Fome</span><div class="pbar fome"><i data-bar="fome"></i></div></div>
        <div class="jbar"><span>💛 Alegria</span><div class="pbar alegria"><i data-bar="alegria"></i></div></div>
        <p class="jstatus ${help ? 'ok' : 'no'}">${help
          ? '✅ Ajudando: rega a horta e avisa quem está com pressa.'
          : '💤 Dormindo: alimente a Jade (fome &gt; 35%) e dê carinho.'}</p>
        <div class="jfoods">${foods.map(id => `<div class="bin drag ${s.stock[id] ? '' : 'off'}" data-drag="${id}" data-target="jade">
          ${ic(id)}<b>${s.stock[id] || 0}</b><span>${ING[id].nome}</span></div>`).join('')}</div>
        <button class="btn" data-act="pet">🤚 Carinho</button>
      </div>`;
  },

  // ---------- Arrastar / segurar ----------
  onDown(e) {
    const hold = e.target.closest('[data-hold]');
    if (hold && !hold.disabled) { e.preventDefault(); G.blendStart(); this.holding = true; hold.classList.add('pressed'); return; }
    const src = e.target.closest('[data-drag]');
    if (!src || src.classList.contains('off')) return;
    e.preventDefault();
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.innerHTML = ic(src.dataset.drag);
    this.el.fx.appendChild(ghost);
    this.drag = { id: src.dataset.drag, target: src.dataset.target || 'plate', x0: e.clientX, y0: e.clientY, ghost, moved: false };
    this.moveGhost(e.clientX, e.clientY);
  },
  onMove(e) {
    if (!this.drag) return;
    if (Math.abs(e.clientX - this.drag.x0) + Math.abs(e.clientY - this.drag.y0) > 8) this.drag.moved = true;
    this.moveGhost(e.clientX, e.clientY);
  },
  moveGhost(cx, cy) {
    const r = this.el.stage.getBoundingClientRect();
    const x = (cx - r.left) / this.scale - 28, y = (cy - r.top) / this.scale - 28;
    this.drag.ghost.style.transform = `translate(${x}px,${y}px)`;
  },
  onUp(e, cancel) {
    if (this.holding) {
      this.holding = false;
      document.querySelectorAll('.pressed').forEach(b => b.classList.remove('pressed'));
      G.blendEnd();
    }
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    d.ghost.remove();
    if (cancel) return;
    const zone = document.getElementById(d.target === 'jade' ? 'jadeDrop' : 'drop');
    let hit = !d.moved; // toque simples também adiciona
    if (zone && d.moved) {
      const b = zone.getBoundingClientRect();
      hit = e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom;
    }
    if (!hit) return;
    if (d.target === 'jade') G.feedJade(d.id); else G.addToPlate(d.id);
  },

  // ---------- Feedback ----------
  toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    this.el.toasts.appendChild(t);
    while (this.el.toasts.children.length > 3) this.el.toasts.firstChild.remove();
    setTimeout(() => t.remove(), 2600);
  },
  jadeSay(msg, expr) {
    this.jadeLine = msg;
    if (expr) { this.jadeExpr = expr; this.jadeExprT = 1.2; }
    this.dirty = true;
    clearTimeout(this._sayT);
    this._sayT = setTimeout(() => { this.jadeLine = null; this.dirty = true; }, 2500);
  },
  // Cartão com a nota detalhada, aparece ao servir
  scoreCard(name, card) {
    const L = { atendimento: '🧾 Atendimento', preparo: '⏱️ Preparo', precisao: '🎯 Precisão', entrega: '🍽️ Entrega' };
    const el = document.createElement('div');
    el.className = 'score-card ' + (card.total >= 70 ? 'good' : card.total >= 40 ? 'mid' : 'bad');
    el.innerHTML = `<div class="sc-h">${name} <b>${card.total}</b></div>` +
      Object.keys(NOTA_PESOS).map(k => {
        const pts = Math.round(card.parts[k] * NOTA_PESOS[k]);
        return `<div class="sc-row"><span>${L[k]}</span><i><em style="transform:scaleX(${card.parts[k]})"></em></i><b>${pts}/${NOTA_PESOS[k]}</b></div>`;
      }).join('');
    document.querySelectorAll('.score-card').forEach(x => x.remove());
    this.el.fx.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  },

  // Aviso grande de evento surpresa
  alert(em, title, text) {
    document.querySelectorAll('.ev-alert').forEach(x => x.remove());
    const el = document.createElement('div');
    el.className = 'ev-alert';
    el.innerHTML = `<span class="ev-em">${em}</span><div><b>${title}</b><small>${text}</small></div>`;
    this.el.fx.appendChild(el);
    setTimeout(() => el.remove(), 3400);
  },

  // Jade correndo pela tela (toque para pegar)
  showJadeRun() {
    this.hideJadeRun();
    const el = document.createElement('button');
    el.className = 'jade-run';
    el.dataset.act = 'catchjade';
    el.innerHTML = `<span class="flip">${jadeSVG('feliz')}</span>`;
    this.el.fx.appendChild(el);
  },
  hideJadeRun() { document.querySelectorAll('.jade-run').forEach(x => x.remove()); },
  clearEventFx() {
    this.hideJadeRun();
    document.querySelectorAll('.ev-alert').forEach(x => x.remove());
    this.el.stage.classList.remove('raining', 'blackout');
  },

  // Confirmação dentro do jogo (pausa enquanto aberta)
  confirm(title, text, onYes) {
    this.modal = true;
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = `<div class="modal-box"><h3>${title}</h3><p>${text}</p>
      <div class="modal-btns"><button class="btn ghost" data-m="no">Continuar jogando</button>
      <button class="btn big" data-m="yes">Sair</button></div></div>`;
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-m]');
      if (!b) return;
      e.stopPropagation();
      m.remove();
      this.modal = false;
      last = performance.now();
      if (b.dataset.m === 'yes') onYes();
    });
    this.el.stage.appendChild(m);
  },

  hearts() {
    for (let i = 0; i < 5; i++) {
      const h = document.createElement('div');
      h.className = 'heart';
      h.textContent = '💗';
      h.style.left = (260 + Math.random() * 120) + 'px';
      h.style.animationDelay = (i * 0.12) + 's';
      this.el.fx.appendChild(h);
      setTimeout(() => h.remove(), 1600);
    }
  },
};

const ACTIONS = {
  start(arg) { SFX.unlock(); G.startGame(arg === '1'); UI.screen = 'game'; UI.station = 'balcao'; UI.hideOverlay(); UI.dirty = true;
    if (G.s.day === 1 && arg !== '1') setTimeout(() => UI.toast('Dica: vá à Horta e ao Preparo antes de abrir as portas!'), 600); },
  next() { G.startDay(); UI.hideOverlay(); UI.station = 'balcao'; UI.dirty = true; },
  open() { G.openDoors(); },
  shop() { UI.showShop(); SFX.tap(); },
  shoptab(id) { UI.shopTab = id; UI.showShop(); SFX.tap(); },
  shopback() { UI.showNight(); SFX.tap(); },
  upgrade(id) { G.buyUpgrade(id); UI.showShop(); },
  acc(id) { G.tapAcessorio(id); UI.showShop(); },
  mute() { SFX.muted = !SFX.muted; UI.dirty = true; },
  quit() {
    UI.confirm('Sair para o menu?',
      `O jogo fica salvo no começo do Dia ${G.s.day}. O que você fez hoje será perdido.`,
      () => { UI.drag = null; UI.clearEventFx(); G.run = null; UI.el.fx.innerHTML = ''; UI.showTitle(); });
  },
  tab(id) { UI.go(id); },
  take(id) { G.takeOrder(+id); },
  select(id) { G.run.selected = +id; UI.go('montagem'); },
  trash() { G.trashPlate(); },
  serve() { G.serve(); },
  board(id) { G.putOnBoard(id); },
  chop() { G.chop(); },
  pick(i) { UI.plotPick = +i; UI.dirty = true; SFX.tap(); },
  pickcancel() { UI.plotPick = null; UI.dirty = true; },
  plant(arg) { const [i, k] = arg.split(':'); G.plant(+i, k); },
  water(i) { G.water(+i); },
  harvest(i) { G.harvest(+i); },
  clear(i) { G.clearPlot(+i); },
  buy(i) { G.buy(+i); },
  pet() { G.petJade(); },
  sharpen() { G.sharpen(); },
  wash() { G.wash(); },
  pest(i) { G.removePest(+i); },
  fix() { G.fixIrrigation(); },
  catchjade() { EV.catchJade(); },
};

// ===== Loop principal =====
let last = performance.now(), acc = 0, paused = false;
function frame(t) {
  const dt = Math.min(0.1, (t - last) / 1000);
  last = t;
  if (!paused && !UI.modal && UI.screen === 'game' && G.run) {
    G.update(dt);
    acc += dt;
    if (acc >= 0.1) { acc = 0; UI.tick(); }
  }
  if (UI.dirty) UI.render();
  requestAnimationFrame(frame);
}
// Pausa quando o app vai para segundo plano (economiza bateria no iPhone)
document.addEventListener('visibilitychange', () => {
  paused = document.hidden;
  if (!paused) last = performance.now();
});

window.addEventListener('DOMContentLoaded', () => {
  UI.init();
  requestAnimationFrame(frame);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register((window.MODO_3D ? '../' : '') + 'sw.js').catch(() => {});
  }
});
