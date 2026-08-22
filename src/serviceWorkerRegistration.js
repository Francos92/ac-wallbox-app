// Registrazione del service worker per il funzionamento offline.
// Basata sul pattern standard di Create React App, semplificata.

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]'
);

export function register() {
  if (process.env.NODE_ENV !== 'production' && !isLocalhost) return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Neue Version verfügbar — beim nächsten Öffnen aktiv.');
            }
          };
        };
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error);
      });
  });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}
