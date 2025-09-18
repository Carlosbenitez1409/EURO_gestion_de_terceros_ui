// Configuración de variables de entorno con tipos TypeScript
// Este archivo centraliza y tipifica todas las variables de entorno

interface ImportMetaEnv {
    // URLs del Backend
    readonly VITE_API_URL: string;
    readonly VITE_API_BASE_URL: string;
    readonly VITE_PROXY_TARGET: string;

    // Configuración de la Aplicación
    readonly VITE_APP_NAME: string;
    readonly VITE_APP_TITLE: string;
    readonly VITE_APP_VERSION: string;
    readonly VITE_APP_DESCRIPTION: string;
    readonly VITE_APP_URL: string;
    readonly VITE_AUTH_DOMAIN: string;
    readonly VITE_API_TIMEOUT: string;

    // Autenticación
    readonly VITE_JWT_SECRET: string;
    readonly VITE_SESSION_TIMEOUT: string;
    readonly VITE_REFRESH_TOKEN_ENDPOINT: string;
    readonly VITE_OAUTH_CLIENT_ID: string;
    readonly VITE_OAUTH_REDIRECT_URI: string;

    // Características habilitadas
    readonly VITE_ENABLE_SARLAFT: string;
    readonly VITE_ENABLE_COMERCIAL_ASSIGNMENT: string;
    readonly VITE_ENABLE_DOCUMENT_MANAGEMENT: string;
    readonly VITE_ENABLE_NOTIFICATIONS: string;
    readonly VITE_ENABLE_ANALYTICS: string;
    readonly VITE_ENABLE_PEP_VALIDATION: string;
    readonly VITE_ENABLE_AUTO_ASSIGNMENT: string;
    readonly VITE_ENABLE_BULK_OPERATIONS: string;
    readonly VITE_ENABLE_ADVANCED_SEARCH: string;

    // Desarrollo
    readonly VITE_NODE_ENV: string;
    readonly VITE_DEBUG_MODE: string;
    readonly VITE_SHOW_CONSOLE_LOGS: string;
    readonly VITE_USE_MOCK_DATA: string;
    readonly VITE_MOCK_DELAY: string;

    // Servicios externos
    readonly VITE_DOCUMENT_VALIDATION_URL: string;
    readonly VITE_DOCUMENT_VALIDATION_KEY: string;
    readonly VITE_RESTRICTIVE_LISTS_URL: string;
    readonly VITE_RESTRICTIVE_LISTS_KEY: string;
    readonly VITE_NOTIFICATION_SERVICE_URL: string;
    readonly VITE_EMAIL_SERVICE_KEY: string;

    // Archivos y uploads
    readonly VITE_MAX_FILE_SIZE: string;
    readonly VITE_ALLOWED_FILE_TYPES: string;
    readonly VITE_UPLOAD_CHUNK_SIZE: string;
    readonly VITE_STORAGE_URL: string;
    readonly VITE_STATIC_URL: string;

    // Paginación y límites
    readonly VITE_DEFAULT_PAGE_SIZE: string;
    readonly VITE_MAX_PAGE_SIZE: string;
    readonly VITE_MAX_TERCEROS_PER_COMERCIAL: string;
    readonly VITE_AUTO_BALANCE_THRESHOLD: string;

    // Localización
    readonly VITE_DEFAULT_LOCALE: string;
    readonly VITE_TIMEZONE: string;
    readonly VITE_CURRENCY: string;
    readonly VITE_DATE_FORMAT: string;
    readonly VITE_DATETIME_FORMAT: string;
    readonly VITE_NUMBER_FORMAT: string;

    // Seguridad
    readonly VITE_ENABLE_CSP: string;
    readonly VITE_ENABLE_RATE_LIMITING: string;
    readonly VITE_SESSION_SECURE: string;
    readonly VITE_ENCRYPTION_KEY: string;
    readonly VITE_HASH_SALT: string;

    // Monitoreo
    readonly VITE_ANALYTICS_ID: string;
    readonly VITE_SENTRY_DSN: string;
    readonly VITE_LOG_LEVEL: string;
    readonly VITE_ENABLE_PERFORMANCE_MONITORING: string;
    readonly VITE_PERFORMANCE_SAMPLE_RATE: string;

    // Cache
    readonly VITE_CACHE_TIMEOUT: string;
    readonly VITE_ENABLE_SERVICE_WORKER: string;
    readonly VITE_DATA_CACHE_DURATION: string;
    readonly VITE_IMAGE_CACHE_DURATION: string;

    // Terceros específico
    readonly VITE_DEFAULT_TERCERO_STATE: string;
    readonly VITE_AUTO_APPROVAL_ENABLED: string;
    readonly VITE_REQUIRE_NIT_VALIDATION: string;
    readonly VITE_REQUIRE_RUT_VALIDATION: string;
    readonly VITE_REQUIRE_CAMERA_COMERCIO: string;

    // Desarrollo local
    readonly VITE_CORS_ENABLED: string;
    readonly VITE_PROXY_ENABLED: string;
    readonly VITE_HMR_PORT: string;
    readonly VITE_HMR_HOST: string;

    // Personalización
    readonly VITE_CUSTOM_THEME_COLOR: string;
    readonly VITE_COMPANY_LOGO_URL: string;
    readonly VITE_SUPPORT_EMAIL: string;
    readonly VITE_CONTACT_PHONE: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// Configuración tipificada de la aplicación  
export const appConfig = {
    // URLs y endpoints
    api: {
        baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
        url: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
        refreshTokenEndpoint: import.meta.env.VITE_REFRESH_TOKEN_ENDPOINT || '/auth/refresh',
    },

    // Información de la aplicación
    app: {
        name: import.meta.env.VITE_APP_NAME || 'EURO - Gestión de Terceros',
        title: import.meta.env.VITE_APP_TITLE || 'Sistema de Gestión de Terceros',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        description: import.meta.env.VITE_APP_DESCRIPTION || 'Sistema integral para la gestión y validación de terceros',
        url: import.meta.env.VITE_APP_URL || import.meta.env.VITE_PROXY_TARGET || 'http://localhost:5173',
    },

    // Configuración específica para compatibilidad con app.config.ts
    apiUrl: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api',
    appUrl: import.meta.env.VITE_APP_URL || import.meta.env.VITE_PROXY_TARGET || 'http://localhost:5173',
    appName: import.meta.env.VITE_APP_NAME || 'EURO - Gestión de Terceros',
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
    authDomain: (() => {
        try {
            return import.meta.env.VITE_AUTH_DOMAIN || new URL(import.meta.env.VITE_API_BASE_URL || 'http://localhost').hostname;
        } catch (error) {
            console.warn('⚠️ Error al calcular authDomain:', error);
            return 'localhost';
        }
    })(),
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
    sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '3600000', 10),

    // Características habilitadas
    features: {
        sarlaft: import.meta.env.VITE_ENABLE_SARLAFT === 'true',
        comercialAssignment: import.meta.env.VITE_ENABLE_COMERCIAL_ASSIGNMENT === 'true',
        documentManagement: import.meta.env.VITE_ENABLE_DOCUMENT_MANAGEMENT === 'true',
        notifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
        analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
        pepValidation: import.meta.env.VITE_ENABLE_PEP_VALIDATION === 'true',
        autoAssignment: import.meta.env.VITE_ENABLE_AUTO_ASSIGNMENT === 'true',
        bulkOperations: import.meta.env.VITE_ENABLE_BULK_OPERATIONS === 'true',
        advancedSearch: import.meta.env.VITE_ENABLE_ADVANCED_SEARCH === 'true',
    },

    // Configuración de desarrollo
    development: {
        nodeEnv: import.meta.env.VITE_NODE_ENV || 'development',
        debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
        showConsoleLogs: import.meta.env.VITE_SHOW_CONSOLE_LOGS === 'true',
        useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
        mockDelay: parseInt(import.meta.env.VITE_MOCK_DELAY || '1000'),
    },

    // Límites y paginación
    limits: {
        defaultPageSize: parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE || '20'),
        maxPageSize: parseInt(import.meta.env.VITE_MAX_PAGE_SIZE || '100'),
        maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'),
        maxTercerosPorComercial: parseInt(import.meta.env.VITE_MAX_TERCEROS_PER_COMERCIAL || '15'),
        autoBalanceThreshold: parseInt(import.meta.env.VITE_AUTO_BALANCE_THRESHOLD || '5'),
    },

    // Archivos y uploads
    files: {
        allowedTypes: (import.meta.env.VITE_ALLOWED_FILE_TYPES || 'pdf,jpg,jpeg,png,doc,docx,xls,xlsx').split(','),
        uploadChunkSize: parseInt(import.meta.env.VITE_UPLOAD_CHUNK_SIZE || '1048576'),
        storageUrl: import.meta.env.VITE_STORAGE_URL || 'http://localhost:8000/media',
        staticUrl: import.meta.env.VITE_STATIC_URL || 'http://localhost:8000/static',
    },

    // Localización
    locale: {
        default: import.meta.env.VITE_DEFAULT_LOCALE || 'es-CO',
        timezone: import.meta.env.VITE_TIMEZONE || 'America/Bogota',
        currency: import.meta.env.VITE_CURRENCY || 'COP',
        dateFormat: import.meta.env.VITE_DATE_FORMAT || 'DD/MM/YYYY',
        datetimeFormat: import.meta.env.VITE_DATETIME_FORMAT || 'DD/MM/YYYY HH:mm',
        numberFormat: import.meta.env.VITE_NUMBER_FORMAT || 'es-CO',
    },

    // Seguridad
    security: {
        enableCSP: import.meta.env.VITE_ENABLE_CSP === 'true',
        enableRateLimiting: import.meta.env.VITE_ENABLE_RATE_LIMITING === 'true',
        sessionSecure: import.meta.env.VITE_SESSION_SECURE === 'true',
        sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '3600000'),
    },

    // Cache
    cache: {
        timeout: parseInt(import.meta.env.VITE_CACHE_TIMEOUT || '300000'),
        dataCacheDuration: parseInt(import.meta.env.VITE_DATA_CACHE_DURATION || '600000'),
        imageCacheDuration: parseInt(import.meta.env.VITE_IMAGE_CACHE_DURATION || '86400000'),
        enableServiceWorker: import.meta.env.VITE_ENABLE_SERVICE_WORKER === 'true',
    },

    // Terceros específico
    terceros: {
        defaultState: import.meta.env.VITE_DEFAULT_TERCERO_STATE || 'pendiente',
        autoApprovalEnabled: import.meta.env.VITE_AUTO_APPROVAL_ENABLED === 'true',
        requireNitValidation: import.meta.env.VITE_REQUIRE_NIT_VALIDATION === 'true',
        requireRutValidation: import.meta.env.VITE_REQUIRE_RUT_VALIDATION === 'true',
        requireCamaraComercio: import.meta.env.VITE_REQUIRE_CAMERA_COMERCIO === 'true',
    },

    // Personalización
    theme: {
        primaryColor: import.meta.env.VITE_CUSTOM_THEME_COLOR || '#0052CC',
        companyLogo: import.meta.env.VITE_COMPANY_LOGO_URL || '/assets/supermercadoseleuro.png',
    },

    // Contacto
    contact: {
        supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'soporte@supermercadoseleuro.com',
        phone: import.meta.env.VITE_CONTACT_PHONE || '+57-1-234-5678',
    },

    // Monitoreo
    monitoring: {
        analyticsId: import.meta.env.VITE_ANALYTICS_ID,
        sentryDsn: import.meta.env.VITE_SENTRY_DSN,
        logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
        enablePerformanceMonitoring: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
        performanceSampleRate: parseFloat(import.meta.env.VITE_PERFORMANCE_SAMPLE_RATE || '0.1'),
    },
} as const;

// Funciones de utilidad para variables de entorno
export const getEnvVar = (key: keyof ImportMetaEnv, defaultValue?: string): string => {
    return import.meta.env[key] || defaultValue || '';
};

export const getEnvBoolean = (key: keyof ImportMetaEnv, defaultValue = false): boolean => {
    const value = import.meta.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
};

export const getEnvNumber = (key: keyof ImportMetaEnv, defaultValue = 0): number => {
    const value = import.meta.env[key];
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
};

// Validación de variables de entorno requeridas
export const validateRequiredEnvVars = (): void => {
    const requiredVars: (keyof ImportMetaEnv)[] = [
        // VITE_API_BASE_URL no es requerida cuando usamos proxy
        // 'VITE_API_BASE_URL',
    ];

    const missing = requiredVars.filter(varName => !import.meta.env[varName]);

    if (missing.length > 0) {
        console.warn('⚠️ Missing optional environment variables:', missing);
        console.warn('Using default values for missing variables');
    }
};

export default appConfig;
