import { appConfig, validateRequiredEnvVars } from './env.config';

// Validar variables de entorno requeridas al inicializar
try {
  validateRequiredEnvVars();
} catch (error) {
  console.warn('⚠️ Advertencia: Algunas variables de entorno faltan, usando valores por defecto.', error);
}

// Configuración principal de la aplicación
export const APP_CONFIG = {
  // Re-exportar configuración de entorno directamente
  ...appConfig,

  // Configuraciones específicas de la aplicación
  roles: {
    ADMIN: 'admin',
    PROCESOS: 'procesos',
    COMERCIAL: 'comercial',
    EMPLEADO: 'empleado',
  },

  // Estados de terceros
  terceroStates: {
    PENDIENTE: 'pendiente',
    EN_REVISION: 'en_revision',
    APROBADO: 'aprobado',
    RECHAZADO: 'rechazado',
  },

  // Tipos de terceros
  terceroTypes: {
    PROVEEDOR: 'proveedor',
    EMPLEADO: 'empleado',
    CLIENTE: 'cliente',
  },

  // Configuración de rutas
  routes: {
    HOME: '/',
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    TERCEROS: '/terceros',
    PROCESOS: '/procesos',
    COMERCIAL: '/comercial',
    PROFILE: '/profile',
  },

  // Configuración de almacenamiento local
  storage: {
    keys: {
      AUTH_TOKEN: 'auth_token',
      REFRESH_TOKEN: 'refresh_token',
      USER_DATA: 'user_data',
      PREFERENCES: 'user_preferences',
      THEME: 'app_theme',
    },
  },

  // Configuración de notificaciones
  notifications: {
    types: {
      SUCCESS: 'success',
      ERROR: 'error',
      WARNING: 'warning',
      INFO: 'info',
    },
    duration: {
      SUCCESS: 3000,
      ERROR: 5000,
      WARNING: 4000,
      INFO: 3000,
    },
  },
} as const;

// Re-exportar utilidades de configuración
export { getEnvVar, getEnvBoolean, getEnvNumber } from './env.config';

export default APP_CONFIG;