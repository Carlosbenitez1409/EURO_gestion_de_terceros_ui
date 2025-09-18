import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Desactivar alerts y notificaciones del navegador para usar solo toast
if (typeof window !== 'undefined') {
  // Sobrescribir alert para evitar notificaciones del navegador
  window.alert = () => {};
  window.confirm = () => true;
  
  // Sobrescribir la función de notificaciones del navegador
  if ('Notification' in window) {
    // Prevenir cualquier intento de mostrar notificaciones del navegador
    (window as any).Notification = class {
      static permission = 'denied';
      static requestPermission = () => Promise.resolve('denied');
      constructor() {
        return null;
      }
    };
  }
}

createRoot(document.getElementById("root")!).render(<App />);
