// Service Worker for Guardian Dashboard AI
// Handles background notifications and offline functionality

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  let data = {
    title: '🚨 Guardian AI Alert',
    body: 'New disaster detected',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
  };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    vibrate: data.vibrate || [200, 100, 200],
    tag: data.tag || 'guardian-alert',
    requireInteraction: data.requireInteraction ?? true,
    data: data.data,
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icon-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-dismiss.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes('localhost') || client.url.includes('guardian')) {
            return client.focus();
          }
        }
        // Open new window if not found
        return clients.openWindow('/');
      })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync');
  
  if (event.tag === 'sync-disasters') {
    event.waitUntil(syncDisasters());
  }
});

async function syncDisasters() {
  try {
    const response = await fetch('/api/disasters');
    const disasters = await response.json();
    
    // Send notification for new critical disasters
    disasters.forEach(disaster => {
      if (disaster.severity === 'critical') {
        self.registration.showNotification('🚨 Critical Disaster Alert', {
          body: `${disaster.type} detected at ${disaster.location.name}`,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: `disaster-${disaster.id}`,
          requireInteraction: true,
          data: disaster
        });
      }
    });
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-disasters') {
    console.log('[Service Worker] Periodic sync: checking for disasters');
    event.waitUntil(syncDisasters());
  }
});