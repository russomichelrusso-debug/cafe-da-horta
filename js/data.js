'use strict';
// ===== Dados do jogo: ingredientes, receitas, horta, mercado =====
const VERSAO = '1.18'; // aparece na tela inicial (para saber qual versão está rodando)

const ING = {
  pao:       { nome: 'Pão' },
  alface:    { nome: 'Alface' },
  tomate:    { nome: 'Tomate', cutTo: 'tomate_f', cutYield: 3 },
  tomate_f:  { nome: 'Tomate fatiado' },
  cenoura:   { nome: 'Cenoura', cutTo: 'cenoura_r', cutYield: 3 },
  cenoura_r: { nome: 'Cenoura ralada' },
  queijo:    { nome: 'Queijo' },
  molho:     { nome: 'Molho de iogurte' },
  laranja:   { nome: 'Laranja' },
  morango:   { nome: 'Morango' },
  acucar:    { nome: 'Açúcar' },
  gelo:      { nome: 'Gelo', infinito: true },
};

// Cor de cada ingrediente no liquidificador (mistura do suco)
const SUCO_COR = { laranja: [247, 160, 28], morango: [227, 48, 74], cenoura: [242, 120, 20], acucar: [250, 245, 235], gelo: [200, 235, 250] };

const RECIPES = {
  sanduiche: { nome: 'Sanduíche natural', preco: 14, icon: 'pao',
               bins: ['pao', 'alface', 'tomate_f', 'cenoura_r', 'queijo', 'molho'] },
  salada:    { nome: 'Salada da horta', preco: 12, icon: 'alface',
               bins: ['alface', 'tomate_f', 'cenoura_r', 'queijo', 'molho'] },
  suco:      { nome: 'Suco natural', preco: 9, icon: 'laranja',
               bins: ['laranja', 'morango', 'cenoura', 'acucar', 'gelo'] },
};

// tempo = segundos regados para ficar pronto
const CROPS = {
  alface:  { nome: 'Alface',  tempo: 35, colheita: { alface: 4 } },
  tomate:  { nome: 'Tomate',  tempo: 50, colheita: { tomate: 2 } },
  cenoura: { nome: 'Cenoura', tempo: 45, colheita: { cenoura: 3 } },
  morango: { nome: 'Morango', tempo: 60, colheita: { morango: 4 } },
};
const WATER_DRAIN = 2.5;   // % por segundo (≈40s até secar)
const DRY_LIMIT = 12;      // segundos seca até murchar

const MARKET = [
  { tipo: 'ing', id: 'pao',     qtd: 4, preco: 5 },
  { tipo: 'ing', id: 'queijo',  qtd: 3, preco: 6 },
  { tipo: 'ing', id: 'molho',   qtd: 4, preco: 4 },
  { tipo: 'ing', id: 'laranja', qtd: 3, preco: 5 },
  { tipo: 'ing', id: 'acucar',  qtd: 6, preco: 2 },
  { tipo: 'ing', id: 'tomate',  qtd: 2, preco: 7 },
  { tipo: 'ing', id: 'cenoura', qtd: 2, preco: 6 },
  { tipo: 'semente', id: 'alface',  qtd: 2, preco: 3 },
  { tipo: 'semente', id: 'tomate',  qtd: 2, preco: 4 },
  { tipo: 'semente', id: 'cenoura', qtd: 2, preco: 3 },
  { tipo: 'semente', id: 'morango', qtd: 2, preco: 5 },
  { tipo: 'adubo',   id: 'adubo',   qtd: 3, preco: 25 },  // qtd = dias de efeito
];

// ===== Desgaste =====
const FIO_POR_CORTE = 7;     // a faca perde 7% de fio a cada legume cortado (~15 cortes)
const RIPE_LIMIT = 30;       // segundos que um legume pronto aguenta antes de passar do ponto
const PRAGA_LIMIT = 20;      // segundos até a lagarta acabar com a planta
const CONSERTO_IRRIGACAO = 21;
const LAVAR_TOQUES = 5;      // toques para lavar a louça
// Quantos eventos surpresa por dia
const EVENTOS_POR_DIA = day => day <= 1 ? 0 : day === 2 ? 1 : day < 6 ? 2 : day < 9 ? 3 : day < 12 ? 4 : 5;
const NOTA_CRITICO = day => day >= 10 ? 95 : 90;   // o crítico fica mais exigente

// ===== Delivery e Florzinha =====
const MOTO_ESPERA = 12;      // segundos que o motoboy espera se o pedido não estiver pronto
const TAXA_ENTREGA = 3;      // moedas a mais por delivery entregue
const FLOR_LATIDO = 6;       // segundos latindo quando chega o motoboy (clientes perdem paciência mais rápido)
const FLOR_PACIENCIA = 20;   // segundos pedindo comida antes de roubar um ingrediente
const FLOR_PESO_VET = 75;    // peso (0-100) que, no fim do dia, leva a Florzinha ao veterinário
const VET_PRECO = 20;
// O que a Florzinha come: cenoura é saudável; pão e queijo ela ama, mas engordam
const FLOR_FOOD = {
  cenoura: { peso: -3, fala: '🥕 Crec, crec! A Florzinha amou a cenoura.' },
  pao:     { peso: 12, fala: '🍞 Ela devorou o pão… mas engordou um pouquinho!' },
  queijo:  { peso: 10, fala: '🧀 Queijo! Ela adorou… e a barriguinha cresceu.' },
};
const INFLACAO = 0.15; // +15% por compra repetida no mesmo dia

// O que a Jade come (porquinho-da-índia: folhas e legumes, fruta só de petisco)
const JADE_FOOD = {
  alface:  { fome: 22, alegria: 6,  fala: 'Nhac nhac!' },
  cenoura: { fome: 28, alegria: 10, fala: 'Cenourinha!' },
  morango: { fome: 8,  alegria: 28, fala: 'Uiii! Petisco!' },
  tomate:  { recusa: true, fala: 'Jade torce o nariz…' },
};

const NOMES = ['Ana', 'Bia', 'Caio', 'Duda', 'Enzo', 'Fê', 'Gabi', 'Heitor', 'Isa', 'João',
  'Lara', 'Léo', 'Malu', 'Nina', 'Otto', 'Pedro', 'Rafa', 'Sofia', 'Théo', 'Vivi'];

// ===== Loja de melhorias (comprada à noite) =====
// Cada nível custa mais que o anterior; desc[i] = o que o nível i+1 faz
const UPGRADES = [
  { id: 'faca',       aba: 'cozinha', em: '🔪', nome: 'Faca afiada',          precos: [40, 90], desc: ['Corta com 4 toques', 'Corta com 3 toques'] },
  { id: 'liquid',     aba: 'cozinha', em: '🌀', nome: 'Liquidificador turbo', precos: [60],     desc: ['Faixa verde do suco mais larga'] },
  { id: 'balcao',     aba: 'cozinha', em: '🪑', nome: '4º lugar no balcão',   precos: [120],    desc: ['Até 4 clientes ao mesmo tempo (mais lucro e mais pressão)'] },
  { id: 'amolador',   aba: 'cozinha', em: '⚙️', nome: 'Amolador elétrico',    precos: [80],     desc: ['Afia a faca na hora, com 1 toque'] },
  { id: 'lavaLoucas', aba: 'cozinha', em: '🫧', nome: 'Lava-louças',          precos: [100],    desc: ['Lava a louça sozinha quando a pia enche'] },
  { id: 'canteiro',   aba: 'horta',   em: '🟫', nome: 'Canteiro extra',       precos: [50, 110], desc: ['Ganha o 5º canteiro', 'Ganha o 6º canteiro'] },
  { id: 'irrigacao',  aba: 'horta',   em: '💧', nome: 'Irrigação',            precos: [70, 120], desc: ['A água seca 40% mais devagar (pode vazar!)', 'Reforçada: não vaza mais'] },
  { id: 'joaninhas',  aba: 'horta',   em: '🐞', nome: 'Joaninhas',            precos: [60],     desc: ['Comem as lagartas antes de atacarem a horta'] },
  { id: 'casinha',    aba: 'jade',    em: '🏠', nome: 'Casinha de madeira',   precos: [60],     desc: ['A fome da Jade cai 40% mais devagar'] },
  { id: 'brinquedos', aba: 'jade',    em: '🧶', nome: 'Túnel e bolinha de feno', precos: [50],  desc: ['A alegria da Jade cai 50% mais devagar'] },
  { id: 'caminha',    aba: 'jade',    em: '🛏️', nome: 'Caminha no quintal',   precos: [70],     desc: ['A Florzinha late só metade das vezes que o motoboy chega'] },
  { id: 'racao',      aba: 'jade',    em: '🥣', nome: 'Pote de ração',        precos: [55, 100], desc: ['A Florzinha pede comida 40% menos vezes', 'Automático: pede 70% menos vezes'] },
  { id: 'passeio',    aba: 'jade',    em: '🦮', nome: 'Passeio no fim do dia', precos: [45],     desc: ['A Florzinha perde 10 de peso toda noite'] },
];
// Acessórios só visuais: compra uma vez, depois toca para vestir/tirar
const ACESSORIOS = [
  { id: 'lacinho',  em: '🎀', nome: 'Lacinho',        preco: 25 },
  { id: 'chapeu',   em: '👨‍🍳', nome: 'Chapéu de chef', preco: 35 },
  { id: 'cachecol', em: '🧣', nome: 'Cachecol',       preco: 30 },
];
const ACESSORIOS_FLOR = [
  { id: 'laco',    em: '🎀', nome: 'Laço no topete',  preco: 25 },
  { id: 'bandana', em: '🧣', nome: 'Bandana',         preco: 30 },
  { id: 'coroa',   em: '🌸', nome: 'Coroa de flores', preco: 35 },
];

// Dificuldade cresce a cada dia (modo desafio)
function DIFF(day) {
  return {
    total: Math.min(6 + day * 2, 22),          // clientes no dia
    paciencia: Math.max(38, 100 - day * 7),     // segundos
    intervalo: Math.max(5, 18 - day * 1.5),     // segundos entre clientes
    maxRecheio: Math.min(2 + Math.ceil(day / 2), 5),
    prep: 45,                                   // segundos de preparação antes de abrir
    entregas: day < 3 ? 0 : day < 5 ? 1 : day < 8 ? 2 : day < 11 ? 3 : 4,   // pedidos de delivery
    prazoEntrega: Math.max(40, 80 - day * 3),   // segundos até o motoboy chegar
  };
}
