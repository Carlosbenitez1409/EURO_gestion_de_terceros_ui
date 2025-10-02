import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'   // ✅ Aquí ya está incluido Tailwind v4

// Desactivar alerts y notificaciones del navegador para usar solo toast
if (typeof window !== 'undefined') {
  window.alert = () => {};
  window.confirm = () => true;

  if ('Notification' in window) {
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
