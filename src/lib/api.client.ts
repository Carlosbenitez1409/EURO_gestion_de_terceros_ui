import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, ApiError } from '@/types/api.types';
import { APP_CONFIG } from '@/config/app.config';

// Configurar interceptores de respuesta para manejo de errores mejorado
const setupAxiosInterceptors = (instance: AxiosInstance) => {
    // Solo interceptor de request para logging
    instance.interceptors.request.use(
        (config) => {
            console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        },
        (error) => {
            console.error('📤❌ Request Error:', error);
            return Promise.reject(error);
        }
    );

    return instance;
};

// Crear instancia de Axios configurada
const createApiClient = (): AxiosInstance => {
    const instance = axios.create({
        baseURL: APP_CONFIG.apiUrl,
        timeout: 30000, // 30 segundos
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        // Permitir cookies para autenticación
        withCredentials: false,
    });

    return setupAxiosInterceptors(instance);
};

// Cliente específico para FormData (archivos)
export const formDataClient = axios.create({
    baseURL: APP_CONFIG.apiUrl,
    timeout: 60000, // 60 segundos para archivos
    headers: {
        'Accept': 'application/json',
        // No establecer Content-Type para FormData, axios lo hace automáticamente
    },
    withCredentials: false,
});

// Configurar interceptores también para formDataClient
setupAxiosInterceptors(formDataClient);

// Mock data para desarrollo (COMENTADO - usando backend real)
/*
const MOCK_USERS = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@euro.com',
    first_name: 'Administrador',
    last_name: 'Sistema',
    full_name: 'Administrador Sistema',
    role: 'procesos',
    is_active: true,
    permissions: ['view_terceros', 'edit_terceros', 'create_terceros']
  },
  {
    id: 2,
    username: 'comercial',
    email: 'comercial@euro.com',
    first_name: 'Usuario',
    last_name: 'Comercial',
    full_name: 'Usuario Comercial',
    role: 'comercial',
    is_active: true,
    permissions: ['view_terceros']
  }
];

// Función para simular respuesta de login
const mockLogin = (username: string, password: string) => {
  const user = MOCK_USERS.find(u => u.username === username);
  if (!user || password !== 'admin') {
    throw new Error('Credenciales inválidas');
  }
  
  return {
    access: 'mock-access-token-' + Date.now(),
    refresh: 'mock-refresh-token-' + Date.now(),
    user
  };
};
*/

// Configuración base de la API usando variables de entorno
export const API_CONFIG = {
  baseURL: APP_CONFIG.api.baseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

// Token storage utilities - Django DRF compatible
export const TokenStorage = {
  getAccessToken: (): string | null => {
    return localStorage.getItem('euro_access_token');
  },

  setAccessToken: (token: string): void => {
    localStorage.setItem('euro_access_token', token);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem('euro_refresh_token');
  },

  setRefreshToken: (token: string): void => {
    localStorage.setItem('euro_refresh_token', token);
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem('euro_access_token', accessToken);
    localStorage.setItem('euro_refresh_token', refreshToken);
  },

  clearTokens: (): void => {
    localStorage.removeItem('euro_access_token');
    localStorage.removeItem('euro_refresh_token');
    localStorage.removeItem('euroSession');
  },

  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  }
};

// Crear instancia de Axios mejorada (reemplaza la anterior)
const enhancedApiClient: AxiosInstance = createApiClient();

// Request interceptor para agregar token de autenticación
enhancedApiClient.interceptors.request.use(
  (config) => {
    const token = TokenStorage.getAccessToken();

    if (token && !TokenStorage.isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Agregar timestamp para evitar cache
    if (config.method?.toLowerCase() === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor para manejar respuestas y errores (con soporte para mock)
enhancedApiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data
    });

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Verificar si estamos en modo mock (COMENTADO - usando backend real)
    /*
    if (APP_CONFIG.development.useMockData) {
      console.log('🎭 Mock mode activated, handling request:', originalRequest.url);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Manejar diferentes endpoints en modo mock
      if (originalRequest.url?.includes('/auth/login/')) {
        try {
          const { username, password } = JSON.parse(originalRequest.data);
          const mockResponse = mockLogin(username, password);
          
          return Promise.resolve({
            data: mockResponse,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: originalRequest
          });
        } catch (mockError) {
          return Promise.reject({
            response: {
              status: 401,
              data: { detail: 'Credenciales inválidas' }
            }
          });
        }
      }
      
      if (originalRequest.url?.includes('/auth/refresh/')) {
        return Promise.resolve({
          data: {
            access: 'mock-new-access-token-' + Date.now()
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: originalRequest
        });
      }
      
      // Para otros endpoints, devolver respuesta mock genérica
      return Promise.resolve({
        data: { results: [], count: 0 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: originalRequest
      });
    }
    */

    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    // Si es error 401 y tenemos refresh token, intentar renovar
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = TokenStorage.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_CONFIG.baseURL}/api/auth/refresh/`, {
            refresh: refreshToken
          });

          const { access, refresh: newRefreshToken } = response.data;

          TokenStorage.setTokens(access, newRefreshToken);

          // Reintentar la petición original
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return enhancedApiClient(originalRequest);

        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          TokenStorage.clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        TokenStorage.clearTokens();
        window.location.href = '/login';
      }
    }

    // Transformar error para consistencia
    const errorResponse = error.response?.data;
    let errorMessage = 'Error desconocido';
    
    // Debug: Log completo del error para debugging
    console.log('🔍 Debug - Error completo:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        hasResponse: !!error.response
    });
    
    // Manejar diferentes tipos de respuesta de error del backend
    if (errorResponse) {
        console.log('🔍 Debug - Error response data:', errorResponse);
        
        // Log transiciones permitidas si están disponibles
        if (errorResponse.transiciones_permitidas) {
            console.log('🔍 Transiciones permitidas por el backend:', errorResponse.transiciones_permitidas);
        }
        
        if (typeof errorResponse === 'string') {
            errorMessage = errorResponse;
        } else if (errorResponse.detail) {
            errorMessage = errorResponse.detail;
        } else if (errorResponse.message) {
            errorMessage = errorResponse.message;
        } else if (errorResponse.error) {
            errorMessage = errorResponse.error;
        } else if (errorResponse.non_field_errors) {
            errorMessage = Array.isArray(errorResponse.non_field_errors) 
                ? errorResponse.non_field_errors.join(', ')
                : errorResponse.non_field_errors;
        } else if (errorResponse.error) {
            errorMessage = errorResponse.error;
        }
    }

    // Mensajes específicos según el status code y contenido
    console.log('🔍 Debug - Status code:', error.response?.status, 'Message extracted:', errorMessage);
    
    if (error.response?.status === 400) {
        console.log('🔍 Debug - Processing 400 error with message:', errorMessage);
        // Error 400 - Bad Request (usualmente credenciales incorrectas)
        if (errorMessage.includes('Credenciales') || errorMessage.includes('credenciales') || 
            errorMessage.includes('inválidas') || errorMessage.includes('incorrectas') ||
            errorMessage.includes('datos incorrectos')) {
            errorMessage = 'Usuario o contraseña incorrectos';
            console.log('🔍 Debug - 400 matched credentials pattern, new message:', errorMessage);
        } else {
            errorMessage = errorMessage || 'Datos inválidos en la solicitud';
            console.log('🔍 Debug - 400 no pattern match, using:', errorMessage);
        }
    } else if (error.response?.status === 401) {
        errorMessage = errorMessage.includes('token') 
            ? 'Sesión expirada, por favor inicia sesión nuevamente'
            : 'Usuario o contraseña incorrectos';
    } else if (error.response?.status === 403) {
        errorMessage = 'No tienes permisos para realizar esta acción';
    } else if (error.response?.status === 404) {
        errorMessage = 'Recurso no encontrado';
    } else if (error.response?.status === 500) {
        errorMessage = 'Error interno del servidor. Contacta al administrador.';
    } else if (error.response?.status >= 500) {
        errorMessage = 'Error del servidor. Intenta nuevamente más tarde.';
    } else if (!error.response) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        console.log('🔍 Debug - No response object, using connection error');
    }

    const apiError: ApiError = {
      message: errorMessage,
      code: error.response?.data?.code || error.code,
      details: error.response?.data
    };

    console.log('🔍 Debug - Final API Error object:', apiError);
    return Promise.reject(apiError);
  }
);

// Funciones helper para hacer peticiones
export const apiRequest = {
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await enhancedApiClient.get<ApiResponse<T>>(url, config);
    // Para endpoints de Django DRF que devuelven datos directamente
    return response.data.data !== undefined ? response.data.data! : response.data as T;
  },

  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await enhancedApiClient.post<ApiResponse<T>>(url, data, config);
    // Para endpoints de Django DRF que devuelven datos directamente
    return response.data.data !== undefined ? response.data.data! : response.data as T;
  },

  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await enhancedApiClient.put<ApiResponse<T>>(url, data, config);
    // Para endpoints de Django DRF que devuelven datos directamente
    return response.data.data !== undefined ? response.data.data! : response.data as T;
  },

  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await enhancedApiClient.patch<ApiResponse<T>>(url, data, config);
    // Para endpoints de Django DRF que devuelven datos directamente
    return response.data.data !== undefined ? response.data.data! : response.data as T;
  },

  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await enhancedApiClient.delete<ApiResponse<T>>(url, config);
    // Para endpoints de Django DRF que devuelven datos directamente
    return response.data.data !== undefined ? response.data.data! : response.data as T;
  }
};

// Función especial para upload de archivos
export const uploadFile = async (
  url: string,
  file: File,
  additionalData?: Record<string, any>,
  onProgress?: (progress: number) => void
): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);

  if (additionalData) {
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });
  }

  const config: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    }
  };

  const response = await enhancedApiClient.post<ApiResponse>(url, formData, config);
  return response.data.data;
};

// Función para descargar archivos
export const downloadFile = async (url: string, filename?: string): Promise<void> => {
  const response = await enhancedApiClient.get(url, {
    responseType: 'blob'
  });

  const blob = new Blob([response.data]);
  const downloadUrl = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(downloadUrl);
};

// Función para construir URLs con parámetros
export const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
  if (!params) return endpoint;

  const searchParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      searchParams.append(key, params[key].toString());
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
};

// Función para manejar errores de validación
export const handleValidationErrors = (error: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (error.details?.errors) {
    error.details.errors.forEach((err: any) => {
      if (err.field) {
        errors[err.field] = err.message;
      }
    });
  }

  return errors;
};

// Función para retry de peticiones
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      if (i === maxRetries) {
        throw error;
      }

      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }

  throw lastError;
};

export default enhancedApiClient;

// Exportaciones adicionales para compatibilidad
export { enhancedApiClient as apiClient };
