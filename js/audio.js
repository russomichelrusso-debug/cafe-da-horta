'use strict';
// ===== Efeitos sonoros sintetizados (sem arquivos de áudio = carrega instantâneo) =====
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
  squeak() { this.tone(1400, 0.08, 'sine', 0.1, 600); this.tone(1700, 0.1, 'sine', 0.1, 500, 0.1); },
  harvest(){ this.tone(523, 0.08, 'triangle', 0.1); this.tone(784, 0.12, 'triangle', 0.1, 0, 0.07); },
  water()  { this.tone(300, 0.2, 'sine', 0.08, 300); },
  alarm()  { this.tone(880, 0.14, 'square', 0.07); this.tone(660, 0.14, 'square', 0.07, 0, 0.16); this.tone(880, 0.14, 'square', 0.07, 0, 0.32); },
  blendTick(){ this.tone(90 + Math.random() * 30, 0.05, 'sawtooth', 0.03); },
};
