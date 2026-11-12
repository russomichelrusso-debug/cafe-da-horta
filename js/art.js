'use strict';
// ===== Arte vetorial (SVG): ícones, Maria Alice, Jade e clientes =====

const ICONS = {
  pao: `<path d="M10 28C6 14 22 8 32 12C42 8 58 14 54 28L52 54Q52 58 48 58L16 58Q12 58 12 54Z" fill="#c98a3d"/>
        <path d="M15 29C12 18 24 14 32 17C40 14 52 18 49 29L47 52L17 52Z" fill="#f3d39a"/>`,
  alface: `<path d="M32 58C14 58 6 46 8 34C4 24 14 14 22 16C24 8 40 6 44 14C54 12 60 24 56 32C60 44 50 58 32 58Z" fill="#5fb548"/>
        <path d="M32 56L32 24M32 40L22 30M32 46L44 34M32 32L40 24" stroke="#c9eeb0" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  tomate: `<circle cx="32" cy="36" r="22" fill="#e5412f"/>
        <path d="M22 18L32 21L42 18L37 25L32 21L27 25Z" fill="#3e9a3a" stroke="#3e9a3a" stroke-width="3" stroke-linejoin="round"/>
        <path d="M32 20L34 11" stroke="#3e9a3a" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="23" cy="31" rx="5" ry="3" fill="#fff" opacity=".35"/>`,
  tomate_f: `<circle cx="32" cy="32" r="24" fill="#d8352b"/><circle cx="32" cy="32" r="19" fill="#f2665a"/>
        <path d="M32 13L32 51M13 32L51 32" stroke="#d8352b" stroke-width="3"/>
        <g fill="#ffd9a8"><ellipse cx="24" cy="24" rx="3" ry="4.5"/><ellipse cx="40" cy="24" rx="3" ry="4.5"/><ellipse cx="24" cy="40" rx="3" ry="4.5"/><ellipse cx="40" cy="40" rx="3" ry="4.5"/></g>`,
  cenoura: `<path d="M44 20C52 26 50 32 44 38L16 58Q10 60 12 54L30 22C34 16 40 16 44 20Z" fill="#f28a1c"/>
        <path d="M24 38L30 40M20 46L26 48M32 30L37 33" stroke="#c96a0e" stroke-width="2" stroke-linecap="round"/>
        <path d="M42 18C40 10 44 5 47 4C48 10 46 14 44 19M45 21C51 13 57 13 60 15C55 18 51 20 47 23" fill="#4fa83d" stroke="#4fa83d" stroke-width="3" stroke-linejoin="round"/>`,
  cenoura_r: `<g stroke-width="5" stroke-linecap="round"><path d="M12 50L30 40" stroke="#f28a1c"/><path d="M20 55L44 47" stroke="#e07812"/>
        <path d="M28 40L50 33" stroke="#f9a03c"/><path d="M14 40L36 29" stroke="#e07812"/><path d="M34 53L54 45" stroke="#f28a1c"/><path d="M24 47L46 40" stroke="#f9a03c"/></g>`,
  queijo: `<path d="M6 44L44 16L58 30L58 50L6 50Z" fill="#f6c93b"/><path d="M6 44L58 30L58 50L6 50Z" fill="#f9d95e"/>
        <g fill="#e3ae1e"><circle cx="22" cy="44" r="3"/><circle cx="40" cy="42" r="4"/><circle cx="50" cy="45" r="2.5"/><circle cx="40" cy="28" r="2.5"/></g>`,
  molho: `<rect x="22" y="18" width="20" height="40" rx="7" fill="#f4efe0" stroke="#d2c7a8" stroke-width="2"/>
        <path d="M27 18L30 6L34 6L37 18Z" fill="#7cc14e"/><rect x="22" y="30" width="20" height="12" fill="#7cc14e"/>`,
  laranja: `<circle cx="32" cy="35" r="22" fill="#f7a01c"/>
        <g fill="#e58a0e"><circle cx="24" cy="30" r="1.5"/><circle cx="38" cy="40" r="1.5"/><circle cx="30" cy="46" r="1.5"/><circle cx="42" cy="28" r="1.5"/></g>
        <path d="M32 14C36 6 44 6 48 8C44 14 38 16 32 14Z" fill="#4fa83d"/><ellipse cx="24" cy="28" rx="5" ry="3" fill="#fff" opacity=".3"/>`,
  morango: `<path d="M32 58C18 50 10 36 12 26C14 18 24 16 32 20C40 16 50 18 52 26C54 36 46 50 32 58Z" fill="#e3304a"/>
        <g fill="#ffe08a"><ellipse cx="24" cy="30" rx="1.4" ry="2"/><ellipse cx="34" cy="30" rx="1.4" ry="2"/><ellipse cx="43" cy="31" rx="1.4" ry="2"/>
        <ellipse cx="28" cy="40" rx="1.4" ry="2"/><ellipse cx="38" cy="40" rx="1.4" ry="2"/><ellipse cx="33" cy="49" rx="1.4" ry="2"/></g>
        <path d="M19 20L32 25L45 20L39 13L32 18L25 13Z" fill="#3e9a3a"/>`,
  acucar: `<rect x="12" y="20" width="40" height="7" rx="3" fill="#e35d8a"/>
        <path d="M14 27L50 27L46 56Q46 58 44 58L20 58Q18 58 18 56Z" fill="#dff1fb" stroke="#9cc7de" stroke-width="2"/>
        <g fill="#fff" stroke="#c9d8e0"><rect x="21" y="42" width="10" height="10" rx="1"/><rect x="33" y="44" width="10" height="10" rx="1"/><rect x="27" y="33" width="10" height="10" rx="1"/></g>`,
  gelo: `<rect x="8" y="28" width="24" height="24" rx="5" fill="#cdeefd" stroke="#7cc4e6" stroke-width="2" transform="rotate(-12 20 40)"/>
        <rect x="30" y="20" width="24" height="24" rx="5" fill="#cdeefd" stroke="#7cc4e6" stroke-width="2" transform="rotate(10 42 32)"/>
        <path d="M14 34L20 32M36 24L42 26" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  regador: `<path d="M14 26L42 26L40 54L16 54Z" fill="#4aa3df"/><path d="M42 32L58 18" stroke="#4aa3df" stroke-width="6" stroke-linecap="round"/>
        <path d="M20 26C20 14 36 14 36 26" stroke="#2f7fb5" stroke-width="5" fill="none"/><circle cx="58" cy="17" r="4" fill="#2f7fb5"/>`,
  broto: `<path d="M32 58L32 34" stroke="#4fa83d" stroke-width="4" stroke-linecap="round"/>
        <path d="M32 40C20 40 14 32 14 24C26 24 32 30 32 40ZM32 36C44 36 50 28 50 20C38 20 32 26 32 36Z" fill="#6cc04a"/>`,
  murcho: `<path d="M32 58C32 44 30 38 22 34" stroke="#8a7b5a" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M22 34C14 36 10 44 12 50C20 48 24 42 22 34ZM30 44C40 40 46 44 48 50C40 52 34 50 30 44Z" fill="#a39466"/>`,
  pata: `<g fill="#c2611f"><ellipse cx="32" cy="40" rx="12" ry="10"/><circle cx="18" cy="26" r="5"/><circle cx="28" cy="20" r="5"/><circle cx="38" cy="20" r="5"/><circle cx="47" cy="26" r="5"/></g>`,
};

function injectIcons() {
  const defs = Object.entries(ICONS)
    .map(([id, body]) => `<symbol id="i-${id}" viewBox="0 0 64 64">${body}</symbol>`).join('');
  const holder = document.createElement('div');
  holder.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${defs}</defs></svg>`;
  document.body.prepend(holder.firstChild);
}

function ic(id, cls = '') {
  return `<svg class="ic ${cls}"><use href="#i-${id}"/></svg>`;
}

// ----- Maria Alice: cabelo castanho ondulado, olhos castanhos, vestido vinho + avental -----
// expr: 'feliz' | 'preoc' | 'foco'
function mariaSVG(expr = 'feliz') {
  return `<svg class="maria ${expr}" viewBox="0 0 200 280">
  <path d="M40 95C30 40 70 16 104 18C146 20 174 50 165 100C174 140 172 178 158 204C148 180 150 162 146 150L56 150C50 166 52 182 42 204C28 178 32 140 40 95Z" fill="#5b3a25"/>
  <rect x="88" y="138" width="24" height="28" rx="8" fill="#efc3a4"/>
  <path d="M48 280C48 210 62 170 100 162C138 170 152 210 152 280Z" fill="#8c2738"/>
  <path d="M70 200C80 186 120 186 130 200L136 280L64 280Z" fill="#fffaf3"/>
  <path d="M82 188L86 168M118 188L114 168" stroke="#fffaf3" stroke-width="5" stroke-linecap="round"/>
  <rect x="87" y="228" width="26" height="18" rx="5" fill="#f1e4d6"/>
  <path d="M100 214C96 208 89 211 92 217L100 224L108 217C111 211 104 208 100 214Z" fill="#e35d6a"/>
  <path d="M58 186C44 212 46 244 60 264" stroke="#efc3a4" stroke-width="16" stroke-linecap="round" fill="none"/>
  <path d="M142 186C156 212 154 244 140 264" stroke="#efc3a4" stroke-width="16" stroke-linecap="round" fill="none"/>
  <ellipse cx="100" cy="92" rx="52" ry="56" fill="#f6d2b8"/>
  <path d="M46 92C44 50 74 28 104 30C136 31 160 54 156 94C148 70 132 56 112 50C98 66 76 76 50 98Z" fill="#6b4329"/>
  <path d="M112 50C126 54 142 64 150 80C146 62 132 46 116 42Z" fill="#8a5a38"/>
  <g class="brows" stroke="#3b2416" stroke-width="5" fill="none" stroke-linecap="round">
    <path class="b1" d="M64 72Q77 64 90 70"/><path class="b2" d="M110 70Q123 64 136 72"/></g>
  <g class="eyes">
    <ellipse cx="78" cy="92" rx="11" ry="13" fill="#fff"/><circle cx="79" cy="94" r="8.5" fill="#7a4524"/><circle cx="79" cy="94" r="4.5" fill="#2a160b"/><circle cx="82.5" cy="89.5" r="2.8" fill="#fff"/>
    <ellipse cx="122" cy="92" rx="11" ry="13" fill="#fff"/><circle cx="121" cy="94" r="8.5" fill="#7a4524"/><circle cx="121" cy="94" r="4.5" fill="#2a160b"/><circle cx="124.5" cy="89.5" r="2.8" fill="#fff"/>
    <path d="M65 86Q78 75 91 85M109 85Q122 75 135 86" stroke="#2a160b" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>
  <path d="M100 100Q105 108 99 112" stroke="#d9a283" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="68" cy="114" rx="10" ry="5.5" fill="#f3a1a0" opacity=".55"/><ellipse cx="132" cy="114" rx="10" ry="5.5" fill="#f3a1a0" opacity=".55"/>
  <g stroke="#b5485a" stroke-width="4" fill="none" stroke-linecap="round">
    <path class="m-feliz" d="M86 122Q100 135 114 122"/>
    <path class="m-preoc" d="M88 129Q100 120 112 129"/>
    <path class="m-foco" d="M91 125Q100 128 109 124"/></g>
  <path d="M48 96C38 132 44 164 54 190C60 168 56 136 60 106Z" fill="#5b3a25"/>
  <path d="M152 96C162 132 156 164 146 190C140 168 144 136 140 106Z" fill="#5b3a25"/>
</svg>`;
}

// ----- Jade: porquinha-da-índia laranja com faixa branca no focinho -----
// expr: 'feliz' | 'sono' | 'comendo'
function jadeSVG(expr = 'feliz') {
  return `<svg class="jade ${expr}" viewBox="0 0 220 150">
  <ellipse cx="114" cy="140" rx="82" ry="8" fill="#000" opacity=".12"/>
  <path d="M30 100C30 55 75 35 125 38C175 42 202 70 198 105C196 128 172 138 120 138C70 138 30 130 30 100Z" fill="#d9822b"/>
  <path d="M150 50C168 60 174 76 172 92" stroke="#e99a4a" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"/>
  <path d="M40 108C46 130 76 138 102 136C92 118 70 104 40 108Z" fill="#fff6ea"/>
  <g class="j-ears">
    <ellipse cx="36" cy="54" rx="15" ry="11" fill="#c2611f" transform="rotate(-25 36 54)"/>
    <ellipse cx="38" cy="56" rx="8" ry="5" fill="#f1a9a0" transform="rotate(-25 38 56)"/>
    <ellipse cx="110" cy="50" rx="15" ry="11" fill="#c2611f" transform="rotate(25 110 50)"/>
    <ellipse cx="108" cy="52" rx="8" ry="5" fill="#f1a9a0" transform="rotate(25 108 52)"/></g>
  <ellipse cx="72" cy="82" rx="47" ry="41" fill="#de8a33"/>
  <path d="M63 42C70 40 77 42 81 48C83 68 89 88 92 100C82 113 60 113 50 100C55 85 58 64 63 42Z" fill="#fff6ea"/>
  <g class="j-eyes"><circle cx="45" cy="78" r="7.5" fill="#1d120b"/><circle cx="47.5" cy="75" r="2.4" fill="#fff"/>
    <circle cx="99" cy="76" r="7.5" fill="#1d120b"/><circle cx="101.5" cy="73" r="2.4" fill="#fff"/></g>
  <g class="j-sleep" stroke="#1d120b" stroke-width="3" fill="none" stroke-linecap="round">
    <path d="M38 79Q45 84 52 79"/><path d="M92 77Q99 82 106 77"/></g>
  <ellipse cx="40" cy="94" rx="8" ry="4.5" fill="#f3a1a0" opacity=".6"/><ellipse cx="104" cy="92" rx="8" ry="4.5" fill="#f3a1a0" opacity=".6"/>
  <path d="M65 94Q71 89 77 94Q71 101 65 94Z" fill="#e9888f"/>
  <g class="j-mouth" stroke="#9b5a3c" stroke-width="2" fill="none" stroke-linecap="round">
    <path d="M71 99L71 103M71 103Q66 108 62 104M71 103Q76 108 80 104"/></g>
  <g stroke="#f7ead8" stroke-width="1.4" stroke-linecap="round">
    <path d="M58 100L30 96M58 103L32 106M84 100L112 95M84 103L110 106"/></g>
  <ellipse cx="58" cy="135" rx="11" ry="5" fill="#f1a9a0"/><ellipse cx="90" cy="136" rx="11" ry="5" fill="#f1a9a0"/>
  <ellipse cx="170" cy="134" rx="10" ry="5" fill="#f1a9a0"/>
</svg>`;
}

// ----- Clientes: avatar simples gerado -----
const SKINS = ['#f6d2b8', '#e8b48f', '#c98d62', '#8d5a3b', '#f1c9a5'];
const HAIRS = ['#2b1a10', '#5b3a25', '#a0612f', '#e2b55a', '#1b1b1b', '#7d4a8f'];
const SHIRTS = ['#3f7fd1', '#3aa76d', '#e0a12b', '#8e5bd6', '#d1495b', '#2fa3a8'];

function randomLook() {
  const r = a => a[Math.floor(Math.random() * a.length)];
  return { skin: r(SKINS), hair: r(HAIRS), shirt: r(SHIRTS), style: Math.floor(Math.random() * 4) };
}

function customerSVG(look, mood = 'ok') {
  const hair = [
    `<path d="M22 46C20 20 80 20 78 46C70 34 30 34 22 46Z" fill="${look.hair}"/>`,
    `<path d="M20 50C16 18 84 18 80 50L82 80C74 70 76 50 70 40C56 34 44 34 30 40C24 50 26 70 18 80Z" fill="${look.hair}"/>`,
    `<path d="M22 46C20 20 80 20 78 46C70 34 30 34 22 46Z" fill="${look.hair}"/><circle cx="50" cy="16" r="11" fill="${look.hair}"/>`,
    `<g fill="${look.hair}"><circle cx="28" cy="32" r="11"/><circle cx="42" cy="24" r="12"/><circle cx="58" cy="24" r="12"/><circle cx="72" cy="32" r="11"/></g>`,
  ][look.style];
  const mouth = {
    ok:    '<path d="M42 62Q50 66 58 62" stroke="#7a3a2a" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
    feliz: '<path d="M40 60Q50 72 60 60Z" fill="#7a3a2a"/>',
    bravo: '<path d="M41 66Q50 58 59 66" stroke="#7a3a2a" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  }[mood] || '';
  const brows = mood === 'bravo'
    ? '<path d="M32 40L44 44M68 40L56 44" stroke="#2b1a10" stroke-width="3" stroke-linecap="round"/>' : '';
  return `<svg class="cust" viewBox="0 0 100 130">
    <path d="M14 130C14 96 30 82 50 82C70 82 86 96 86 130Z" fill="${look.shirt}"/>
    <rect x="43" y="70" width="14" height="16" rx="5" fill="${look.skin}"/>
    <ellipse cx="50" cy="50" rx="28" ry="30" fill="${look.skin}"/>
    ${hair}${brows}
    <circle cx="40" cy="50" r="3.5" fill="#1d120b"/><circle cx="60" cy="50" r="3.5" fill="#1d120b"/>
    ${mouth}
  </svg>`;
}
