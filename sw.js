// Service worker: guarda os arquivos para o jogo abrir offline
const CACHE = 'cafe-da-horta-v10';
const FILES = ['./', 'index.html', 'style.css', 'manifest.json', 'icon-192.png', 'icon-512.png',
  'js/data.js', 'js/art.js', 'js/audio.js', 'js/game.js', 'js/events.js', 'js/ui.js',
  '3d/', '3d/index.html', '3d/3d.css', '3d/world.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Rede primeiro, cache se estiver offline.
// O GitHub Pages pede para guardar arquivos por 10 min (max-age=600); sem o
// 'no-cache' o navegador podia entregar o código antigo mesmo com internet.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const req = url.origin === location.origin
    ? new Request(e.request.url, { cache: 'no-cache', credentials: 'same-origin' })
    : e.request;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
