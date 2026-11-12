'use strict';
// ===== Dados do jogo: ingredientes, receitas, horta, mercado =====

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
];
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
  { id: 'canteiro',   aba: 'horta',   em: '🟫', nome: 'Canteiro extra',       precos: [50, 110], desc: ['Ganha o 5º canteiro', 'Ganha o 6º canteiro'] },
  { id: 'irrigacao',  aba: 'horta',   em: '💧', nome: 'Irrigação',            precos: [70],     desc: ['A água seca 40% mais devagar'] },
  { id: 'adubo',      aba: 'horta',   em: '🌿', nome: 'Adubo',                precos: [80],     desc: ['As plantas crescem 30% mais rápido'] },
  { id: 'casinha',    aba: 'jade',    em: '🏠', nome: 'Casinha de madeira',   precos: [60],     desc: ['A fome da Jade cai 40% mais devagar'] },
  { id: 'brinquedos', aba: 'jade',    em: '🧶', nome: 'Túnel e bolinha de feno', precos: [50],  desc: ['A alegria da Jade cai 50% mais devagar'] },
];
// Acessórios só visuais: compra uma vez, depois toca para vestir/tirar
const ACESSORIOS = [
  { id: 'lacinho',  em: '🎀', nome: 'Lacinho',        preco: 25 },
  { id: 'chapeu',   em: '👨‍🍳', nome: 'Chapéu de chef', preco: 35 },
  { id: 'cachecol', em: '🧣', nome: 'Cachecol',       preco: 30 },
];

// Dificuldade cresce a cada dia (modo desafio)
function DIFF(day) {
  return {
    total: Math.min(6 + day * 2, 16),          // clientes no dia
    paciencia: Math.max(50, 100 - day * 7),     // segundos
    intervalo: Math.max(7, 18 - day * 1.5),     // segundos entre clientes
    maxRecheio: Math.min(2 + Math.ceil(day / 2), 5),
    prep: 45,                                   // segundos de preparação antes de abrir
  };
}
