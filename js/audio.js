'use strict';
// ===== Efeitos sonoros: sintetizados (reserva) + gravados (pasta /sons, no fim do arquivo) =====
const SFX = {
  ctx: null,
  muted: false,
  // iOS só libera áudio depois de um toque do usuário
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
  },
  tone(freq, dur = 0.08, type = 'sine', vol = 0.15, slide = 0, delay = 0) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  },
  tap()    { this.tone(520, 0.05, 'triangle', 0.08); },
  add()    { this.tone(660, 0.07, 'triangle', 0.12, 200); },
  chop()   { this.tone(180, 0.06, 'square', 0.06, -80); },
  coin()   { this.tone(880, 0.08, 'square', 0.07); this.tone(1320, 0.12, 'square', 0.07, 0, 0.08); },
  bad()    { this.tone(220, 0.25, 'sawtooth', 0.08, -100); },
  bell()   { this.tone(1046, 0.3, 'sine', 0.12); this.tone(1318, 0.3, 'sine', 0.08, 0, 0.05); },
  // ===== Sons da Jade (porquinho-da-índia), todos sintetizados =====
  noiseBuf() {
    if (!this._noise) {
      const n = this.ctx.sampleRate;
      this._noise = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const d = this._noise.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    return this._noise;
  },
  // um "uíí": assobio que sobe rápido e cai, com vibrato e um sopro de ar
  wheekNote(t, f0, f1, dur, vol) {
    const c = this.ctx;
    const out = c.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(vol, t + 0.025);
    out.gain.setValueAtTime(vol, t + dur * 0.6);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    out.connect(c.destination);
    const lfo = c.createOscillator(), lfoG = c.createGain();   // vibrato ~30 Hz
    lfo.frequency.value = 26 + Math.random() * 8;
    lfoG.gain.value = f0 * 0.035;
    lfo.connect(lfoG);
    for (const [mult, type, g] of [[1, 'sine', 1], [2, 'triangle', 0.18]]) {  // fundamental + harmônico
      const o = c.createOscillator(), og = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0 * mult, t);
      o.frequency.linearRampToValueAtTime(f1 * mult, t + dur * 0.35);
      o.frequency.linearRampToValueAtTime(f1 * 0.8 * mult, t + dur);
      lfoG.connect(o.frequency);
      og.gain.value = g;
      o.connect(og).connect(out);
      o.start(t); o.stop(t + dur + 0.02);
    }
    const nz = c.createBufferSource(), bp = c.createBiquadFilter(), ng = c.createGain();  // sopro
    nz.buffer = this.noiseBuf();
    bp.type = 'bandpass'; bp.frequency.value = f1; bp.Q.value = 5;
    ng.gain.value = 0.25;
    nz.connect(bp).connect(ng).connect(out);
    nz.start(t, Math.random() * 0.5, dur);
    lfo.start(t); lfo.stop(t + dur + 0.02);
  },
  // sequência de "uíí uíí uííí!" (animada); urgent = mais aguda e rápida
  wheek(n = 3, urgent = false, delay = 0) {
    if (this.muted || !this.ctx) return;
    let t = this.ctx.currentTime + delay;
    const base = (urgent ? 1650 : 1350) + Math.random() * 120;
    for (let i = 0; i < n; i++) {
      const last = i === n - 1;
      const dur = urgent ? 0.13 : last ? 0.32 : 0.17;      // o último "uííí" é mais longo
      const f0 = base + i * 90, f1 = f0 * (last ? 1.9 : 1.7);
      this.wheekNote(t, f0, f1, dur, urgent ? 0.13 : 0.11);
      t += dur + (urgent ? 0.04 : 0.07);
    }
  },
  // ronronar de contentamento: "rrrrr" grave e pulsante
  purr(dur = 1.0, delay = 0) {
    if (this.muted || !this.ctx) return;
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(), lp = c.createBiquadFilter(), am = c.createGain(), out = c.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(115, t); o.frequency.linearRampToValueAtTime(95, t + dur);
    lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 2;
    am.gain.value = 0.5;
    const lfo = c.createOscillator(), lfoG = c.createGain();  // pulsos ~24 por segundo
    lfo.type = 'square'; lfo.frequency.value = 24; lfoG.gain.value = 0.5;
    lfo.connect(lfoG).connect(am.gain);
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.16, t + 0.08);
    out.gain.setValueAtTime(0.16, t + dur * 0.7);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp).connect(am).connect(out).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02); lfo.start(t); lfo.stop(t + dur + 0.02);
  },
  // mastigando: estalinhos curtos e rápidos
  munch(n = 5, delay = 0) {
    if (this.muted || !this.ctx) return;
    const c = this.ctx;
    for (let i = 0; i < n; i++) {
      const t = c.currentTime + delay + i * (0.09 + Math.random() * 0.04);
      const nz = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
      nz.buffer = this.noiseBuf();
      bp.type = 'bandpass'; bp.frequency.value = 1500 + Math.random() * 900; bp.Q.value = 3;
      g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      nz.connect(bp).connect(g).connect(c.destination);
      nz.start(t, Math.random() * 0.5, 0.05);
    }
  },
  // resmungo de quem não gostou: ronco curto e mais grave
  grunt() {
    this.purr(0.28);
    this.tone(260, 0.12, 'triangle', 0.06, -80, 0.05);
  },
  // compatibilidade: o "piu" antigo agora é um "uíí" de verdade
  squeak() { this.wheek(2); },
  harvest(){ this.tone(523, 0.08, 'triangle', 0.1); this.tone(784, 0.12, 'triangle', 0.1, 0, 0.07); },
  water()  { this.tone(300, 0.2, 'sine', 0.08, 300); },
  alarm()  { this.tone(880, 0.14, 'square', 0.07); this.tone(660, 0.14, 'square', 0.07, 0, 0.16); this.tone(880, 0.14, 'square', 0.07, 0, 0.32); },
  blendTick(){ this.tone(90 + Math.random() * 30, 0.05, 'sawtooth', 0.03); },
};

// ===== Sons GRAVADOS (pasta /sons) =====
// Jade: gravações reais de porquinho-da-índia (Wikimedia Commons, domínio público).
// Interface, faca, moedas, sino: pacotes da Kenney (CC0). Veja sons/CREDITOS.txt.
// Se um arquivo ainda não carregou, usa o som sintetizado acima como reserva.
Object.assign(SFX, {
  base: (window.MODO_3D ? '../' : '') + 'sons/',
  buffers: {},
  loading: false,
  FILES: ['jade-uii-1', 'jade-uii-2', 'jade-uii-3', 'jade-ronrona', 'jade-resmunga', 'jade-gorjeio',
    'toque', 'soltar', 'erro', 'colher', 'alerta', 'confirma', 'faca-1', 'faca-2', 'faca-3', 'sino', 'moedas-1', 'moedas-2'],
  load() {
    if (this.loading || !this.ctx) return;
    this.loading = true;
    for (const n of this.FILES) {
      fetch(this.base + n + '.mp3')
        .then(r => r.arrayBuffer())
        .then(b => new Promise((ok, err) => this.ctx.decodeAudioData(b, ok, err)))  // forma com callback: funciona em iOS antigo
        .then(buf => { this.buffers[n] = buf; })
        .catch(() => { /* fica com o sintetizado */ });
    }
  },
  // toca um arquivo; devolve false se ainda não está carregado (para usar a reserva)
  play(name, vol = 1, rate = 1, delay = 0) {
    if (this.muted || !this.ctx) return true;
    const b = this.buffers[name];
    if (!b) return false;
    const s = this.ctx.createBufferSource(), g = this.ctx.createGain();
    s.buffer = b; s.playbackRate.value = rate; g.gain.value = vol;
    s.connect(g).connect(this.ctx.destination);
    s.start(this.ctx.currentTime + delay);
    return true;
  },
  pick(list) { return list[Math.floor(Math.random() * list.length)]; },
  vary() { return 0.94 + Math.random() * 0.12; },   // pequena variação para não soar repetido
});
{
  const synth = {};
  for (const k of ['unlock', 'tap', 'add', 'chop', 'coin', 'bad', 'bell', 'harvest', 'alarm', 'wheek', 'purr', 'grunt']) synth[k] = SFX[k];
  SFX.unlock  = function () { synth.unlock.call(this); this.load(); };
  SFX.tap     = function () { this.play('toque', 0.6) || synth.tap.call(this); };
  SFX.add     = function () { this.play('soltar', 0.8, this.vary()) || synth.add.call(this); };
  SFX.chop    = function () { this.play(this.pick(['faca-1', 'faca-2', 'faca-3']), 0.9, this.vary()) || synth.chop.call(this); };
  SFX.coin    = function () { this.play(this.pick(['moedas-1', 'moedas-2']), 0.9, this.vary()) || synth.coin.call(this); };
  SFX.bad     = function () { this.play('erro', 0.7) || synth.bad.call(this); };
  SFX.bell    = function () { this.play('sino', 0.5, this.vary()) || synth.bell.call(this); };
  SFX.harvest = function () { this.play('colher', 0.9, this.vary()) || synth.harvest.call(this); };
  SFX.alarm   = function () { this.play('alerta', 0.9) || synth.alarm.call(this); };
  // Jade: 1 = "uíí" curto, 2 = dupla, 3+ = sequência "uíí uíí uííí" (4 = sequência + mais um)
  SFX.wheek = function (n = 3, urgent = false, delay = 0) {
    const rate = (urgent ? 1.15 : 1) * this.vary();
    const clip = n <= 1 ? 'jade-uii-1' : n === 2 ? 'jade-uii-2' : 'jade-uii-3';
    if (!this.play(clip, 1, rate, delay)) return synth.wheek.call(this, n, urgent, delay);
    if (n >= 4) this.play('jade-uii-1', 0.9, rate * 1.05, delay + 1.3);
  };
  SFX.purr  = function (dur = 1, delay = 0) { this.play('jade-ronrona', 0.9, this.vary(), delay) || synth.purr.call(this, dur, delay); };
  SFX.grunt = function () { this.play('jade-resmunga', 1, this.vary()) || synth.grunt.call(this); };
  SFX.chirp = function (delay = 0) { this.play('jade-gorjeio', 0.8, 1, delay) || this.wheek(2, false, delay); };
}
