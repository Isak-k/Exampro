import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          setInterval(() => {
            registration.update();
          }, 60000);
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                }
              });
            }
          });
        })
        .catch(() => {});
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => {});
  } else {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
  }
}

// Handle online/offline events
window.addEventListener('online', () => {
  console.log('✓ Back online');
  document.body.classList.remove('offline');
  document.body.classList.add('online');
});

window.addEventListener('offline', () => {
  console.log('⚠ Offline mode');
  document.body.classList.remove('online');
  document.body.classList.add('offline');
});

// Set initial state
if (navigator.onLine) {
  document.body.classList.add('online');
} else {
  document.body.classList.add('offline');
}
