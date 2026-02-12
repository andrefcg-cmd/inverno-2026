// Service Worker - ISA|PAES PWA
// VERSÃO: 3.2.0 - Deve ser igual ao APP_VERSION no index.html
const SW_VERSION = '3.2.0';
const CACHE_NAME = `isa-paes-v${SW_VERSION}`;

// Arquivos para cachear (NÃO inclui index.html para evitar problemas)
const STATIC_ASSETS = [
  // Apenas assets estáticos que não mudam frequentemente
  // O index.html SEMPRE será buscado da rede
];

// Instalação
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando versão:', SW_VERSION);
  // Pular espera e ativar imediatamente
  self.skipWaiting();
});

// Ativação - limpa caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando versão:', SW_VERSION);
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Deletando cache antigo:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      // Tomar controle de todas as páginas imediatamente
      return self.clients.claim();
    })
  );
});

// Fetch - Network First para tudo (sempre busca da rede primeiro)
self.addEventListener('fetch', (event) => {
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') return;
  
  // Ignorar requisições de API
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('workers.dev') ||
      event.request.url.includes('weatherapi.com')) {
    return;
  }
  
  // Para HTML, SEMPRE buscar da rede
  if (event.request.mode === 'navigate' || 
      event.request.url.endsWith('.html') ||
      event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Para outros recursos, network first com fallback para cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cachear resposta válida
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Mensagem para pular espera
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting recebido');
    self.skipWaiting();
  }
});
