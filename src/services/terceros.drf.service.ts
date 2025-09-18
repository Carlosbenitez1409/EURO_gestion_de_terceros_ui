import axios from 'axios';
import { apiRequest, API_CONFIG } from '@/lib/api.client';
import { 
  TerceroDocument, 
  TerceroComment, 
  DocumentType,
  ApiResponse,
  PaginatedResponse 
} from '@/types/api.types';

// Tipo específico para DRF que coincide con la respuesta del backend
export interface TerceroDRF {
  id: string;
  tipo_documento: 'CC' | 'CE' | 'PA' | 'NIT';
  numero_documento: string;
  tipo_persona: 'natural' | 'juridica';
  nombres: string;
  apellidos?: string;
  razon_social?: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  estado_aprobacion: 'pendiente' | 'en_espera_correccion' | 'en_curso_comercial' | 'en_curso_administrador' | 'en_curso_procesos' | 'en_curso_cumplimiento' | 'asignada_administrador' | 'asignada_procesos' | 'asignada_oficial_cumplimiento' | 'devuelto_comercial' | 'aprobado' | 'rechazado' | 'finalizado'; // 🆕 NUEVOS ESTADOS ACTUALIZADOS
  tipo_formulario?: 'vinculacion' | 'actualizacion'; // 🆕 TIPO DE FORMULARIO  
  observaciones: string;
  created_at: string;
  updated_at: string;
  creado_por: number;
  aprobado_por?: number;
  
  // 🆕 NUEVO SISTEMA DE ASIGNACIÓN UNIFICADA
  usuario_asignado?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    email: string;
  };
  rol_asignado?: 'comercial' | 'procesos' | 'oficial_cumplimiento' | 'administrador';
  fecha_asignacion?: string;
  
  // 🔄 CAMPOS LEGACY (mantener compatibilidad)
  // Campos para asignación
  asignado_a?: {
    id: string;
    email: string;
    nombre_completo: string;
  };
  asignado_a_nombre?: string;
  asignado_a_procesos?: {
    id: string;
    email: string;
    nombre_completo: string;
  };
  asignado_a_procesos_nombre?: string;
  asignado_cumplimiento?: {
    id: string;
    email: string;
    nombre_completo: string;
  };
  // Campos específicos para comentarios
  observaciones_comercial?: string;
  prioridad_comercial?: 'baja' | 'media' | 'alta';
  comentarios_aprobacion?: string;
}

// Tipo para respuesta de aprobación automática del backend
export interface TerceroApprovalResponse extends TerceroDRF {
  aprobacion_ejecutada?: boolean;
  mensaje_aprobacion?: string;
  nuevo_estado?: string;
  asignado_administrador?: string;
}

// Interfaz actualizada según la documentación de endpoints
export interface TerceroCreateRequest {
    // 🆔 IDENTIFICACIÓN BÁSICA
    id?: string;
    tipo_documento: "CC" | "CE" | "PA" | "NIT";
    numero_documento: string;
    digito_verificacion?: string;
    tipo_persona: "natural" | "juridica" | "publica";
    nombres: string;
    apellidos?: string;
    razon_social?: string;
    nombreRazonSocial?: string;
    fecha_nacimiento?: string;
    
    // 📍 INFORMACIÓN DE CONTACTO
    direccion: string;
    ciudad: string;
    departamento: string;
    pais?: string;                                  // País (default: Colombia)
    telefono: string;
    celular?: string;
    email: string;
    
    // 🏢 ACTIVIDAD ECONÓMICA
    actividad_economica_principal: string;          // Descripción actividad
    codigo_ciiu: string;                            // Código CIIU (4 dígitos)
    
    // 💰 INFORMACIÓN TRIBUTARIA (camelCase para frontend)
    responsableIVA: boolean;                        // Responsable de IVA
    correoFacturacion: string;                      // Email facturación (OBLIGATORIO)
    granContribuyente: boolean;                     // Es gran contribuyente
    numeroResolucionGC?: string;                    // Número resolución GC
    fechaResolucionGC?: string;                     // Fecha resolución GC (ISO)
    autorretenedor: boolean;                        // Es autorretenedor
    numeroResolucionAutorretenedor?: string;        // Número resolución autorretenedor
    fechaResolucionAutorretenedor?: string;         // Fecha resolución (ISO)
    exentoRenta: boolean;                           // Exento de renta
    condicionesExentoRenta?: string;                // Condiciones exención
    
    // 💼 INFORMACIÓN FINANCIERA (strings para frontend)
    ingresoMensual?: string;                        // Ingresos mensuales
    costosGastos?: string;                          // Costos y gastos
    otrosIngresos?: string;                         // Otros ingresos
    totalIngresos?: string;                         // Total ingresos
    activos?: string;                               // Activos (también hay DecimalField)
    pasivos?: string;                               // Pasivos (también hay DecimalField)
    patrimonio?: string;                            // Patrimonio (también hay DecimalField)
    detalleOtrosIngresos?: string;                  // Detalle otros ingresos
    
    // 🌍 OPERACIONES COMERCIALES
    operacionesMonedaExtranjera: boolean;           // Opera en moneda extranjera
    tiposOperacionesMonedaExtranjera: string[];     // Tipos de operaciones
    observaciones?: string;                         // Observaciones generales
    
    // 🛡️ DECLARACIONES SARLAFT/PEP
    personaExpuestaPolitica: boolean;               // Es PEP
    detallesPEP?: string;                           // Detalles si es PEP
    informacionPEP: Array<{                         // Array de personas PEP
        nombre: string;
        tipo: "CC" | "CE" | "NIT" | "PASAPORTE";
        numero_identificacion: string;
        cargo: string;
        parentesco: string;
        fecha_vinculacion: string;
        fecha_retiro: string;
        cuentas_financieras_exterior: boolean;
    }>;
    fuentesFondos: string[];                        // Array de fuentes
    origenFondos?: string;                          // Descripción origen
    tiposRecursos: string[];                        // Array tipos recursos (máx 2)
    manejoAltoEfectivo: boolean;                    // Maneja alto efectivo
    constituyePatrimoniosAutonomos: boolean;        // Declaración obligatoria
    declaracionTransparencia: boolean;              // Declaración obligatoria
    autorizacionTratamientoDatos: boolean;          // Autorización obligatoria
    cuentasFinancierasExterior: boolean;            // Cuentas financieras en el exterior
    
    // 👥 REPRESENTANTES Y ACCIONISTAS (Arrays JSON)
    representantes: Array<{                         // Representantes legales
        nombreCompleto: string;
        tipoIdentificacion: string;
        numeroIdentificacion: string;
        direccion: string;
        telefono: string;
    }>;
    accionistas_frontend: Array<{                   // Accionistas
        nombre: string;
        tipoIdentificacion: string;
        numeroIdentificacion: string;
        porcentajeParticipacion: number;
    }>;
    
    // 📋 METADATA Y FLUJO
    tipo_formulario?: "vinculacion" | "actualizacion";
    estado_aprobacion?: string;                     // Estado actual del tercero
    created_at?: string;                            // Fecha creación (ISO)
    updated_at?: string;                            // Fecha actualización (ISO)
    fecha_aprobacion?: string;                      // Fecha aprobación (ISO)
    
    // 👤 ASIGNACIONES Y RELACIONES
    comercial_asignado?: {                          // Comercial elegido por tercero
        id: string;
        nombre: string;
        email: string;
    } | string;                                     // Puede ser string (ID) o objeto
    asignado_a?: {                                  // Comercial asignado por procesos
        id: string;
        nombre: string;
        email: string;
    };
    asignado_a_procesos?: {                         // Usuario de procesos
        id: string;
        nombre: string;
        email: string;
    };
}

// Campos adicionales que ya estaban en el archivo original
interface TerceroCreateRequestExtended extends TerceroCreateRequest {
  representantes_legales?: Array<{
    tipo_documento: string;
    numero_documento: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    profesion?: string;
    cargo?: string;
  }>;
  composicion_accionaria?: Array<{
    tipo_documento: string;
    numero_documento: string;
    nombres: string;
    apellidos: string;
    porcentaje_participacion: number;
  }>;
}

export interface TerceroUpdateRequest extends Partial<TerceroCreateRequest> {
  estado_aprobacion?: 'pendiente' | 'en_espera_correccion' | 'en_curso_comercial' | 'en_curso_administrador' | 'en_curso_procesos' | 'en_curso_cumplimiento' | 'asignada_administrador' | 'asignada_procesos' | 'asignada_oficial_cumplimiento' | 'devuelto_comercial' | 'aprobado' | 'rechazado' | 'finalizado';
  // Nuevos campos específicos para comerciales (simplificados)
  observaciones_comercial?: string;
  prioridad_comercial?: 'baja' | 'media' | 'alta';
}

// Interfaz para la respuesta del registro público del backend
export interface TerceroPublicRegistrationResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    numero_documento: string;
    estado: string;
  };
  next_steps: {
    message: string;
  };
}

export interface TerceroFilters {
  tipo_persona?: 'natural' | 'juridica';
  estado_aprobacion?: 'pendiente' | 'en_espera_correccion' | 'en_curso_comercial' | 'en_curso_administrador' | 'en_curso_procesos' | 'en_curso_cumplimiento' | 'asignada_administrador' | 'asignada_procesos' | 'asignada_oficial_cumplimiento' | 'devuelto_comercial' | 'aprobado' | 'rechazado' | 'finalizado';
  priority?: string;
  assigned_to?: string | 'me';
  risk_level?: string;
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface ApprovalRequest {
  comments?: string;
}

export interface RejectionRequest {
  reason: string;
  comments?: string;
}

export interface AssignmentRequest {
  assigned_to: string;
}

// 🆕 NUEVA INTERFAZ PARA ASIGNACIÓN UNIFICADA
export interface AsignarRequest {
  usuario_id: number;
  rol: 'comercial' | 'procesos' | 'oficial_cumplimiento' | 'administrador';
  comentario: string; // Obligatorio
}

// 🚀 NUEVO SERVICIO SEGÚN DOCUMENTACIÓN DE ENDPOINTS
export class TercerosService {
    
    // 📋 1. OBTENER TERCERO COMPLETO
    static async obtenerTerceroCompleto(id: string): Promise<TerceroCreateRequest> {
        try {
            const response = await axios.get(`${API_CONFIG.baseURL}/api/terceros/${id}/`);
            console.log('✅ Tercero obtenido:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error obteniendo tercero:', error.response?.data || error.message);
            throw new Error(`Error al obtener tercero: ${error.response?.data?.detail || error.message}`);
        }
    }
    
    // 📊 2. LISTAR TERCEROS CON FILTROS
    static async listarTerceros(filtros?: {
        estado_aprobacion?: string;
        tipo_persona?: string;
        comercial_asignado?: string;
        asignado_a?: string;
        search?: string;
        page?: number;
        page_size?: number;
        ordering?: string;
    }): Promise<{
        results: TerceroCreateRequest[];
        count: number;
        next: string | null;
        previous: string | null;
    }> {
        try {
            const params = new URLSearchParams();
            
            // Agregar filtros si existen
            if (filtros) {
                Object.entries(filtros).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        params.append(key, value.toString());
                    }
                });
            }
            
            const url = `${API_CONFIG.baseURL}/api/terceros/?${params.toString()}`;
            console.log('🔍 Consultando:', url);
            
            const response = await axios.get(url);
            console.log(`✅ ${response.data.results?.length || 0} terceros encontrados`);
            
            return response.data;
            
        } catch (error: any) {
            console.error('❌ Error listando terceros:', error.response?.data || error.message);
            throw new Error(`Error al listar terceros: ${error.response?.data?.detail || error.message}`);
        }
    }
    
    // 🎯 3. TERCEROS ESPECÍFICOS POR ROL
    
    // Para ADMINISTRADORES: terceros aprobados
    static async obtenerTercerosAprobados(): Promise<TerceroCreateRequest[]> {
        try {
            const response = await axios.get(`${API_CONFIG.baseURL}/api/terceros/terceros_aprobados/`);
            return response.data.results || response.data;
        } catch (error: any) {
            console.error('❌ Error obteniendo terceros aprobados:', error);
            throw error;
        }
    }
    
    // Para ADMINISTRADORES: terceros pendientes de asignar
    static async obtenerPendientesAdministrador(): Promise<TerceroCreateRequest[]> {
        try {
            const response = await axios.get(`${API_CONFIG.baseURL}/api/terceros/pendientes_administrador/`);
            return response.data.results || response.data;
        } catch (error: any) {
            console.error('❌ Error obteniendo pendientes administrador:', error);
            throw error;
        }
    }
    
    // Para COMERCIALES: terceros asignados
    static async obtenerTercerosComercial(comercialId: string): Promise<TerceroCreateRequest[]> {
        try {
            const response = await axios.get(`${API_CONFIG.baseURL}/api/terceros/?comercial_asignado=${comercialId}`);
            return response.data.results || response.data;
        } catch (error: any) {
            console.error('❌ Error obteniendo terceros del comercial:', error);
            throw error;
        }
    }
    
    // 🔄 4. ACTUALIZAR TERCERO (PATCH)
    static async actualizarTercero(
        id: string, 
        datos: Partial<TerceroCreateRequest>
    ): Promise<TerceroCreateRequest> {
        try {
            console.log('🔄 Actualizando tercero:', id, datos);
            
            const response = await axios.patch(`${API_CONFIG.baseURL}/api/terceros/${id}/`, datos);
            console.log('✅ Tercero actualizado exitosamente');
            
            return response.data;
            
        } catch (error: any) {
            console.error('❌ Error actualizando tercero:', error.response?.data || error);
            throw new Error(`Error al actualizar: ${error.response?.data?.detail || error.message}`);
        }
    }
    
    // 📎 5. OBTENER DOCUMENTOS DEL TERCERO
    static async obtenerDocumentos(terceroId: string): Promise<any[]> {
        try {
            const response = await axios.get(`${API_CONFIG.baseURL}/api/terceros/${terceroId}/documentos/`);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error obteniendo documentos:', error);
            throw error;
        }
    }
    
    // 📈 6. ESTADÍSTICAS
    static async obtenerEstadisticas(): Promise<{
        total_terceros: number;
        pendientes_aprobacion: number;
        en_revision: number;
        aprobados: number;
        rechazados: number;
        por_tipo_persona: Record<string, number>;
        por_estado: Record<string, number>;
        creados_este_mes: number;
        aprobados_este_mes: number;
    }> {
        try {
            const response = await axios.get(`${API_CONFIG.baseURL}/api/terceros/estadisticas/`);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error obteniendo estadísticas:', error);
            throw error;
        }
    }
    
    // 👥 7. OBTENER COMERCIALES DISPONIBLES
    static async obtenerComercialesDisponibles(): Promise<Array<{
        id: string;
        nombre: string;
        email: string;
    }>> {
        try {
            const response = await axios.get(`${API_CONFIG.baseURL}/api/comerciales-disponibles/`);
            return response.data.comerciales || response.data;
        } catch (error: any) {
            console.error('❌ Error obteniendo comerciales:', error);
            throw error;
        }
    }
}

// SERVICIO ORIGINAL (MANTENER PARA COMPATIBILIDAD)
class TercerosDRFService {
  
  /**
   * Obtener estadísticas de terceros, opcionalmente filtradas
   */
  async getTercerosStats(filters?: { assigned_to?: string }): Promise<any> {
    let url = '/terceros/stats/';
    if (filters && filters.assigned_to) {
      url += `?assigned_to=${encodeURIComponent(filters.assigned_to)}`;
    }
    const response = await apiRequest.get<any>(url);
    return response;
  }

  /**
   * Obtener lista de terceros con filtros y paginación
   */
  async getTerceros(filters?: TerceroFilters): Promise<PaginatedResponse<TerceroDRF>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiRequest.get<PaginatedResponse<TerceroDRF>>(
      `/terceros/?${params.toString()}`
    );
    return response;
  }

  /**
   * Obtener tercero por ID
   */
  async getTercero(id: string): Promise<TerceroDRF> {
    const response = await apiRequest.get<TerceroDRF>(`/terceros/${id}/`);
    return response;
  }  /**
   * Crear nuevo tercero
   */
  async createTercero(data: TerceroCreateRequest): Promise<TerceroDRF> {
    const response = await apiRequest.post<TerceroDRF>('/terceros/', data);
    return response;
  }

  /**
   * Obtener información de campos requeridos del backend usando OPTIONS
   */
  async getTercerosOptions(): Promise<any> {
    try {
      const response = await axios.options(
        `${API_CONFIG.baseURL}/api/terceros/`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener opciones del backend:', error);
      return null;
    }
  }

  /**
   * Crear nuevo tercero para registro público (sin autenticación)
   */
  async createTerceroPublic(data: TerceroCreateRequest): Promise<TerceroPublicRegistrationResponse> {
    // Crear una petición directa sin pasar por el interceptor de autenticación
    const response = await axios.post<TerceroPublicRegistrationResponse>(
      `${API_CONFIG.baseURL}/api/terceros/`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: API_CONFIG.timeout
      }
    );
    
    console.log(`✅ Public API Response: POST /api/terceros/`, {
      status: response.status,
      data: response.data
    });
    
    return response.data;
  }

  /**
   * Actualizar tercero
   */
  async updateTercero(id: string, data: TerceroUpdateRequest): Promise<TerceroDRF> {
    const response = await apiRequest.put<TerceroDRF>(`/terceros/${id}/`, data);
    return response;
  }

  /**
   * Actualizar parcialmente un tercero
   */
  async patchTercero(id: string, data: Partial<TerceroUpdateRequest>): Promise<TerceroDRF> {
    const response = await apiRequest.patch<TerceroDRF>(`/terceros/${id}/`, data);
    return response;
  }

  /**
   * Eliminar tercero
   */
  async deleteTercero(id: string): Promise<void> {
    await apiRequest.delete(`/terceros/${id}/`);
  }

  /**
   * Aprobar tercero
   */
  async approveTercero(id: string, data: ApprovalRequest): Promise<TerceroDRF> {
    const response = await apiRequest.post<TerceroDRF>(`/terceros/${id}/approve/`, data);
    return response;
  }

  /**
   * Rechazar tercero
   */
  async rejectTercero(id: string, data: RejectionRequest): Promise<TerceroDRF> {
    const response = await apiRequest.post<TerceroDRF>(`/terceros/${id}/reject/`, data);
    return response;
  }

  /**
   * Aprobar tercero (nuevo endpoint específico para procesos)
   */
  async aprobarTercero(id: string, observaciones?: string): Promise<TerceroDRF> {
    const response = await apiRequest.post<TerceroDRF>(`/terceros/${id}/aprobar/`, {
      observaciones: observaciones || ''
    });
    return response;
  }

  /**
   * Rechazar tercero (nuevo endpoint específico para procesos)
   */
  async rechazarTercero(id: string, observaciones: string): Promise<TerceroDRF> {
    if (!observaciones.trim()) {
      throw new Error('Las observaciones son obligatorias para rechazar');
    }
    const response = await apiRequest.post<TerceroDRF>(`/terceros/${id}/rechazar/`, {
      observaciones: observaciones.trim()
    });
    return response;
  }

  /**
   * Agregar comentario al tercero
   */
  async agregarComentario(id: string, comentario: string, tipo: 'observacion' | 'proceso' | 'nota_interna' | 'aprobacion' = 'observacion'): Promise<any> {
    const response = await apiRequest.post<any>(`/terceros/${id}/add_comment/`, {
      comment: comentario,
      comment_type: tipo
    });
    return response;
  }

  /**
   * Obtener comentarios estructurados del tercero
   */
  async obtenerComentarios(id: string): Promise<any> {
    const response = await apiRequest.get<any>(`/terceros/${id}/get_comments/`);
    return response;
  }

  /**
   * Obtener historial completo del tercero
   */
  async obtenerHistorialCompleto(id: string): Promise<any> {
    const response = await apiRequest.get<any>(`/terceros/${id}/historial_completo/`);
    return response;
  }

  /**
   * Obtener auditoría completa v2 del tercero (endpoint específico)
   */
  async obtenerAuditoriaCompletaV2(id: string): Promise<any> {
    const response = await apiRequest.get<any>(`/terceros/${id}/auditoria_completa_v2/`);
    return response;
  }

  /**
   * Asignar tercero a usuario (método anterior)
   */
  async assignTercero(id: string, data: AssignmentRequest): Promise<TerceroDRF> {
    const response = await apiRequest.post<TerceroDRF>(`/terceros/${id}/assign/`, data);
    return response;
  }

  /**
   * Asignar tercero a usuario (nuevo endpoint específico)
   */
  async asignarTerceroAUsuario(id: string, data: { usuario_id: string }): Promise<TerceroDRF> {
    const response = await apiRequest.post<TerceroDRF>(`/terceros/${id}/asignar_a_usuario/`, data);
    return response;
  }

  /**
   * Obtener terceros aprobados finales para administradores
   */
  async getTercerosAprobados(): Promise<TerceroDRF[]> {
    const response = await apiRequest.get<TerceroDRF[]>('/terceros/terceros_aprobados/');
    return response;
  }

  /**
   * Obtener terceros pendientes para administrador (asignados y aprobados)
   */
  async getTercerosPendientesAdministrador(): Promise<TerceroDRF[]> {
    const response = await apiRequest.get<TerceroDRF[]>('/terceros/pendientes_administrador/');
    return response;
  }

  /**
   * Obtener documentos de un tercero
   */
  async getTerceroDocuments(id: string): Promise<TerceroDocument[]> {
    const response = await apiRequest.get<TerceroDocument[]>(`/terceros/${id}/documents/`);
    return response;
  }

  /**
   * Subir documento para un tercero
   */
  async uploadDocument(id: string, file: File, documentTypeId: string): Promise<TerceroDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentTypeId);
    
    const response = await apiRequest.post<TerceroDocument>(
      `/terceros/${id}/upload_document/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response;
  }

  /**
   * Obtener comentarios de un tercero
   */
  async getTerceroComments(id: string): Promise<TerceroComment[]> {
    const response = await apiRequest.get<TerceroComment[]>(`/terceros/${id}/comments/`);
    return response;
  }

  /**
   * Agregar comentario a un tercero
   */
  async addComment(id: string, data: {
    comment: string;
    comment_type?: 'observacion' | 'aprobacion' | 'rechazo' | 'consulta' | 'respuesta';
    is_internal?: boolean;
  }): Promise<TerceroComment> {
    const response = await apiRequest.post<TerceroComment>(`/terceros/${id}/add_comment/`, data);
    return response;
  }

  /**
   * Obtener tipos de documentos
   */
  async getDocumentTypes(): Promise<DocumentType[]> {
    const response = await apiRequest.get<DocumentType[]>('/document-types/');
    return response;
  }

  /**
   * Validar tercero contra listas restrictivas
   */
  async validateTercero(id: string): Promise<any> {
    const response = await apiRequest.post(`/terceros/${id}/validate/`);
    return response;
  }

  /**
   * Obtener historial de cambios de un tercero
   */
  async getTerceroHistory(id: string): Promise<any[]> {
    const response = await apiRequest.get<any[]>(`/terceros/${id}/history/`);
    return response;
  }

  /**
   * Descargar archivo de documento
   */
  async downloadDocument(documentId: string): Promise<Blob> {
    const response = await apiRequest.get(`/documents/${documentId}/download/`, {
      responseType: 'blob'
    });
    return response;
  }

  /**
   * Exportar terceros a Excel/CSV
   */
  async exportTerceros(filters?: TerceroFilters, format: 'excel' | 'csv' = 'excel'): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    params.append('format', format);
    
    const response = await apiRequest.get(`/terceros/export/?${params.toString()}`, {
      responseType: 'blob'
    });
    return response;
  }

  /**
   * Obtener estados disponibles del sistema
   */
  async getAvailableStates(): Promise<string[]> {
    const response = await apiRequest.get<{estados: string[]}>('/terceros/estados_disponibles/');
    return response.estados;
  }

  /**
   * Cambiar estado de un tercero (endpoint actualizado) - 13 ESTADOS ESPECÍFICOS
   * 🔧 CORREGIDO: Usa parámetros correctos del backend
   */
  async changeState(id: string, data: {
    estado: 'pendiente' | 'en_espera_correccion' | 'en_curso_comercial' | 'en_curso_administrador' | 'en_curso_procesos' | 'en_curso_cumplimiento' | 'asignada_administrador' | 'asignada_procesos' | 'asignada_oficial_cumplimiento' | 'devuelto_comercial' | 'aprobado' | 'rechazado' | 'finalizado';
    observaciones?: string; // OPCIONAL según documentación del backend
    asignar_a?: number; // Usuario específico para asignación manual (parámetro correcto del backend)
    rol_asignado?: 'comercial' | 'administrador' | 'procesos' | 'oficial_cumplimiento'; // Mantenido por compatibilidad
  }): Promise<{
    success: boolean;
    message: string;
    tercero: TerceroDRF;
    estado_anterior: string;
    estado_nuevo: string;
    historial_id: string;
  }> {
    
    // � CORRECCIÓN: Mapear parámetros frontend → backend
    const backendPayload = {
      estado: data.estado, // ✅ Backend espera "estado" según documentación
      observaciones: data.observaciones || '', // ✅ Opcional con valor por defecto
      ...(data.asignar_a && { asignar_a: data.asignar_a }) // ✅ Solo incluir si se proporciona
    };
    
    console.log('📤 Cambiando estado de tercero:', { 
      id, 
      frontend_params: data,
      backend_payload: backendPayload 
    });
    
    try {
      const response = await apiRequest.post<{
        success: boolean;
        message: string;
        tercero: TerceroDRF;
        estado_anterior: string;
        estado_nuevo: string;
        historial_id: string;
      }>(`/terceros/${id}/cambiar_estado/`, backendPayload);
      console.log('✅ Estado cambiado exitosamente:', response);
      return response;
    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      throw error;
    }
  }

  /**
   * Aprobar tercero usando endpoint específico
   */
  async approveTerceroSpecific(id: string, observaciones?: string): Promise<TerceroDRF> {
    const response = await apiRequest.post<TerceroDRF>(`/terceros/${id}/aprobar/`, { observaciones });
    return response;
  }

  /**
   * Rechazar tercero usando endpoint específico (observaciones obligatorias)
   */
  async rejectTerceroSpecific(id: string, observaciones: string): Promise<TerceroDRF> {
    const response = await apiRequest.post<TerceroDRF>(`/terceros/${id}/rechazar/`, { observaciones });
    return response;
  }

  /**
   * Método específico para comerciales - usar campos permitidos simplificados
   */
  async commercialApprovalUpdate(id: string, observaciones?: string): Promise<TerceroApprovalResponse> {
    const payload = {
      comentarios_aprobacion: observaciones || 'Solicitud marcada como aprobada por el comercial. Pendiente de revisión por el administrador.',
      observaciones_comercial: observaciones || 'Solicitud marcada como aprobada por el comercial. Pendiente de revisión por el administrador.',
      prioridad_comercial: 'alta'
    };
    
    console.log('� Comercial approval payload:', payload);
    
    const response = await apiRequest.patch<TerceroApprovalResponse>(`/terceros/${id}/`, payload);
    return response;
  }

  /**
   * Obtener transiciones disponibles para un estado específico
   */
  async getAvailableTransitions(currentState: string): Promise<string[]> {
    console.log('📤 Consultando transiciones para estado:', currentState);
    try {
      // 🚀 ACTUALIZADO: Usar endpoint real implementado en el backend
      const response = await apiRequest.get<{
        success?: boolean;
        transiciones?: string[] | Record<string, any>;
        estados_disponibles?: string[];
        estados_labels?: Record<string, string>;
      } | Record<string, any>>(`/api/transiciones-disponibles/?estado=${currentState}`);
      console.log('📥 Respuesta del backend:', response);
      
      // 🔍 ARREGLADO: Manejar el formato real del backend
      if (response.success && response.transiciones) {
        console.log('✅ Formato con success detectado, transiciones:', response.transiciones);
        
        // Si transiciones es un objeto, extraer las keys
        if (typeof response.transiciones === 'object' && !Array.isArray(response.transiciones)) {
          const transitionKeys = Object.keys(response.transiciones);
          console.log('🔄 Transiciones extraídas del objeto:', transitionKeys);
          return transitionKeys;
        }
        
        // Si transiciones es un array, devolverlo directamente
        if (Array.isArray(response.transiciones)) {
          console.log('✅ Transiciones como array:', response.transiciones);
          return response.transiciones;
        }
      }
      
      // Fallback: buscar campo transiciones directamente
      if (response.transiciones && Array.isArray(response.transiciones)) {
        console.log('✅ Formato estándar detectado:', response.transiciones);
        return response.transiciones;
      } 
      
      // Último fallback: usar estados_disponibles si existe
      if (response.estados_disponibles && Array.isArray(response.estados_disponibles)) {
        console.log('🔄 Usando estados_disponibles como fallback:', response.estados_disponibles);
        return response.estados_disponibles;
      }
      
      console.log('⚠️ Formato no reconocido, devolviendo array vacío');
      return [];
    } catch (error) {
      console.error('❌ Error consultando transiciones:', error);
      throw error;
    }
  }

  // 🆕 NUEVOS MÉTODOS PARA EL FLUJO ACTUALIZADO

  /**
   * Cambiar estado de un tercero con comentario obligatorio
   * Endpoint: POST /api/terceros/{tercero_id}/cambiar_estado/
   */
  async cambiarEstado(terceroId: string, data: {
    estado: string;
    comentario: string;
    asignar_a_id?: number;
  }): Promise<TerceroDRF> {
    console.log('🔄 Cambiando estado del tercero:', terceroId, data);
    
    try {
      const response = await apiRequest.post<TerceroDRF>(`/terceros/${terceroId}/cambiar_estado/`, data);

      console.log('✅ Estado cambiado exitosamente:', response);
      return response;
    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      throw error;
    }
  }

  /**
   * Obtener historial detallado de un tercero
   * Endpoint: GET /api/terceros/{tercero_id}/historial/
   */
  async getHistorial(terceroId: string): Promise<any[]> {
    console.log('📊 Obteniendo historial del tercero:', terceroId);
    
    try {
      const response = await apiRequest.get<any[]>(`/terceros/${terceroId}/historial/`);

      console.log('✅ Historial obtenido:', response);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas detalladas de un tercero
   * Endpoint: GET /api/terceros/{tercero_id}/estadisticas/
   */
  async getEstadisticas(terceroId: string): Promise<any> {
    console.log('📈 Obteniendo estadísticas del tercero:', terceroId);
    
    try {
      const response = await apiRequest.get<any>(`/terceros/${terceroId}/estadisticas/`);

      console.log('✅ Estadísticas obtenidas:', response);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Obtener terceros asignados al usuario autenticado
   * El backend automáticamente filtra según el rol:
   * - Comercial: Ve solo terceros donde asignado_a = usuario
   * - Procesos: Ve solo terceros donde asignado_a_procesos = usuario  
   * - Oficial cumplimiento: Ve solo terceros donde asignado_cumplimiento = usuario
   * - Administrador: Ve todos los terceros
   */
  async getTercerosAsignados(): Promise<TerceroDRF[]> {
    console.log('👥 Obteniendo terceros asignados al usuario actual');
    
    try {
      const response = await apiRequest.get<TerceroDRF[]>('/terceros/');

      console.log('✅ Terceros asignados obtenidos:', response.length);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo terceros asignados:', error);
      throw error;
    }
  }

  /**
   * Obtener terceros asignados a un oficial de cumplimiento específico
   * Endpoint: GET /api/terceros/?asignado_cumplimiento={user_id}
   */
  async getTercerosPorCumplimiento(usuarioId: number): Promise<TerceroDRF[]> {
    console.log('👥 Obteniendo terceros asignados a cumplimiento:', usuarioId);
    
    try {
      const response = await apiRequest.get<TerceroDRF[]>(`/terceros/?asignado_cumplimiento=${usuarioId}`);

      console.log('✅ Terceros de cumplimiento obtenidos:', response.length);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo terceros de cumplimiento:', error);
      throw error;
    }
  }

  // 🆕 ASIGNAR TERCERO (NUEVO SISTEMA UNIFICADO)
  static async asignar(id: string, data: AsignarRequest): Promise<TerceroDRF> {
    try {
      const response = await axios.post(`${API_CONFIG.baseURL}/api/terceros/${id}/asignar/`, data);
      console.log('✅ Tercero asignado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error asignando tercero:', error);
      throw error;
    }
  }

  // 🆕 CAMBIAR ESTADO Y ASIGNACIÓN EN UNA SOLA OPERACIÓN
  static async cambiarEstadoYAsignacion(id: string, data: CambiarEstadoRequest): Promise<TerceroDRF> {
    try {
      const response = await axios.post(`${API_CONFIG.baseURL}/api/terceros/${id}/cambiar_estado/`, data);
      console.log('✅ Estado y asignación cambiados:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error cambiando estado y asignación:', error);
      throw error;
    }
  }

  // 🆕 OBTENER HISTORIAL COMPLETO
  static async obtenerHistorial(id: string): Promise<HistorialEntry[]> {
    try {
      const response = await axios.get(`${API_CONFIG.baseURL}/api/terceros/${id}/historial/`);
      console.log('✅ Historial obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      throw error;
    }
  }

  // 🆕 OBTENER TERCEROS POR ROL (VISIBILIDAD ESPECÍFICA)
  static async obtenerTercerosPorRol(rol: string, usuario_id?: number): Promise<TerceroDRF[]> {
    try {
      const params = new URLSearchParams();
      params.append('rol_filtro', rol);
      if (usuario_id) {
        params.append('usuario_id', usuario_id.toString());
      }
      
      const response = await axios.get(`${API_CONFIG.baseURL}/api/terceros/por_rol/?${params}`);
      console.log('✅ Terceros por rol obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo terceros por rol:', error);
      throw error;
    }
  }

}

// 🆕 TIPOS PARA EL NUEVO FLUJO CON ESTADOS Y ASIGNACIÓN SEPARADOS

export interface CambiarEstadoRequest {
  estado: 'pendiente' | 'en_espera_correccion' | 'en_curso_comercial' | 'en_curso_administrador' | 'en_curso_procesos' | 'en_curso_cumplimiento' | 'asignada_administrador' | 'asignada_procesos' | 'asignada_oficial_cumplimiento' | 'devuelto_comercial' | 'aprobado' | 'rechazado' | 'finalizado';
  comentario: string; // OBLIGATORIO
  usuario_asignado_id?: number; // Usuario específico (opcional) 
  rol_asignado?: 'comercial' | 'administrador' | 'procesos' | 'oficial_cumplimiento'; // Rol (opcional)
}

export interface HistorialEntry {
  id: number;
  fecha: string;
  usuario: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    full_name: string;
  };
  rol_usuario: string; // Rol del usuario que hizo la acción
  estado_anterior: string;
  estado_nuevo: string;
  usuario_asignado_anterior?: {
    id: number;
    username: string;
    full_name: string;
  };
  usuario_asignado_nuevo?: {
    id: number;
    username: string;
    full_name: string;
  };
  rol_asignado_anterior?: string;
  rol_asignado_nuevo?: string;
  comentario: string;
}

export interface EstadisticasTercero {
  total_acciones: number;
  aprobaciones: number;
  rechazos: number;
  pendientes: number;
  responsables_actuales: {
    comercial?: { email: string; nombre: string };
    procesos?: { email: string; nombre: string };
    cumplimiento?: { email: string; nombre: string };
  };
}

export const tercerosDRFService = new TercerosDRFService();
export { TercerosDRFService };
export default tercerosDRFService;
