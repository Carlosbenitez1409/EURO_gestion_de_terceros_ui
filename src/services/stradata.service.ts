import { TokenStorage, apiRequest } from "@/lib/api.client";
import { APP_CONFIG } from "@/config/app.config";
import { DocumentType, TerceroDocument } from "@/types/api.types";

// 🆕 NUEVOS TIPOS PARA INTEGRACIÓN STRADATA TERCEROS
export interface ResumenPersonasTerceroResponse {
  success: boolean;
  resumen: {
    tercero: {
      nombre_completo: string;
      numero_documento: string;
    };
    contadores: {
      representantes_legales: number;
      informacion_pep: number;
      accionistas: number;
    };
    detalles: {
      representantes_legales: string[];
      informacion_pep: string[];
      accionistas: string[];
    };
    total_personas_consultar: number;
  };
}

export interface ConsultarTerceroStradataRequest {
  username: string;
  password: string;
}

export interface ConsultarTerceroStradataResponse {
  success?: boolean; // Opcional porque el backend no siempre lo incluye
  mensaje?: string;
  personas_consultadas?: number;
  personas?: string[];
  id_busqueda?: number;
  codigo_busqueda?: string;
  id_plantilla?: number;
  servicios?: {
    [key: string]: {
      status: string;
      status_code: number;
      url: string;
    };
  };
  resumen_servicios?: {
    total: number;
    exitosos: number;
    fallidos: number;
  };
  error?: string;
}

// 🆕 NUEVOS TIPOS PARA CONSULTAS MASIVAS
export interface ConsultaStradataRequest {
  terceros_ids: string[];
  usuario_stradata: string;
  password_stradata: string;
}

export interface ConsultaStradataResponse {
  success: boolean;
  data: {
    consulta_id: string;
    total_terceros: number;
    total_personas: number;
    fecha_consulta: string;
    mensaje: string;
    terceros_consultados: Record<string, {
      nombre: string;
      documento: string;
      tipo_persona: string;
      personas_asociadas: any[];
    }>;
    respuesta_stradata: {
      codigo: string;
      status: string;
    };
  };
  error?: string;
}

export interface DocumentoStradataUpload {
  id: string;
  tercero: {
    id: string;
    nombres: string;
    apellidos?: string;
  };
  tipo_documento: string;
  tipo_documento_display: string;
  nombre_archivo: string;
  descripcion: string;
  fecha_subida: string;
  subido_por: {
    id: number;
    username: string;
  };
  es_resultado_stradata: boolean;
  tamaño_archivo_legible: string;
  url_archivo: string;
}

export interface ConsultaHistorial {
  id: string;
  fecha_consulta: string;
  usuario_consulta: {
    id: number;
    username: string;
    email: string;
  };
  usuario_stradata: string;
  estado: string;
  estado_display: string;
  total_personas: number;
  terceros_consultados: any[];
  terceros_nombres: string[];
}

// 🔄 TIPOS LEGACY (mantener compatibilidad)
export interface ScrapingResponse {
    status: 'success' | 'error';
    message: string;
    tercero_id: string;
    total_consultas?: number;
    consultas_ejecutadas?: Array<{
        nombre: string;
        identificacion: string;
        tipo: string;
        documentos_encontrados: number;
    }>;
    documentos_descargados?: number;
    tiempo_ejecucion?: string;
}

export interface DocumentoStradata {
    nombre: string;
    ruta: string;
    tamaño: string;
    fecha_descarga: string;
}

export interface GrupoDocumentosStradata {
    tipo_persona: 'tercero_principal' | 'personas_pep' | 'representantes_legales' | 'accionistas';
    archivos: DocumentoStradata[];
}

export interface DocumentosStratadaResponse {
    tercero_id: string;
    numero_documento: string;
    documentos: GrupoDocumentosStradata[];
    total_documentos: number;
}

export class StratadaService {
    private baseUrl: string;
    
    constructor() {
        this.baseUrl = '/stradata';
    }
    
    /**
     * Ejecuta consulta masiva de Stradata (NUEVO SISTEMA)
     */
    async ejecutarConsultaMasiva(data: {
        terceros_ids: string[];
        usuario_stradata: string;
        password_stradata: string;
    }): Promise<ConsultaStradataResponse> {
        try {
            console.log('� Ejecutando consulta masiva Stradata:', {
                terceros_count: data.terceros_ids.length,
                usuario: data.usuario_stradata
            });

            const response = await apiRequest.post<ConsultaStradataResponse>(`${this.baseUrl}/ejecutar/`, data);
            
            console.log('✅ Consulta masiva exitosa:', response);
            return response;
        } catch (error) {
            console.error('❌ Error en consulta masiva:', error);
            throw error;
        }
    }

    /**
     * Ejecuta consulta individual (usando sistema masivo)
     */
    async ejecutarConsultaIndividual(
        terceroId: string,
        usuario_stradata: string,
        password_stradata: string
    ): Promise<ConsultaStradataResponse> {
        return this.ejecutarConsultaMasiva({
            terceros_ids: [terceroId],
            usuario_stradata,
            password_stradata
        });
    }

    /**
     * 🆕 Obtiene resumen de personas asociadas al tercero para consultar en Stradata
     */
    async obtenerResumenPersonasTercero(terceroId: string): Promise<ResumenPersonasTerceroResponse> {
        try {
            console.log(`📋 Obteniendo resumen de personas para tercero: ${terceroId}`);

            const response = await apiRequest.get<ResumenPersonasTerceroResponse>(
                `/stradata/terceros/${terceroId}/resumen-personas/`
            );
            
            console.log('✅ Resumen obtenido exitosamente:', response);
            return response;
        } catch (error) {
            console.error('❌ Error obteniendo resumen de personas:', error);
            throw error;
        }
    }

    /**
     * 🆕 Ejecuta consulta Stradata integrada para tercero y personas asociadas
     */
    async consultarTerceroStradata(
        terceroId: string, 
        credenciales: ConsultarTerceroStradataRequest
    ): Promise<ConsultarTerceroStradataResponse> {
        try {
            console.log(`🔍 Ejecutando consulta Stradata integrada para tercero: ${terceroId}`);

            const response = await apiRequest.postStradata<ConsultarTerceroStradataResponse>(
                `/stradata/terceros/${terceroId}/consultar-stradata/`,
                credenciales
            );
            
            console.log('✅ Consulta Stradata integrada exitosa:', response);
            return response;
        } catch (error) {
            console.error('❌ Error en consulta Stradata integrada:', error);
            throw error;
        }
    }

    /**
     * @deprecated - Usar el nuevo sistema de consultas masivas con credenciales
     */
    static async ejecutarScrapingTercero(terceroId: string): Promise<ScrapingResponse> {
        console.warn('⚠️ ejecutarScrapingTercero está deprecated. Use ejecutarConsultaIndividual.');
        throw new Error(
            'Función deprecated. Use stradataConsultasMasivas.ejecutarConsultaIndividual() ' +
            'con credenciales del usuario.'
        );
    }

    /**
     * @deprecated - Usar el nuevo sistema de consultas masivas
     */
    static async ejecutarScrapingMasivo(tercerosIds: string[]): Promise<any> {
        const token = TokenStorage.getAccessToken();
        
        const response = await fetch(`/terceros/scraping-masivo/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                terceros_ids: tercerosIds
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Error HTTP ${response.status}`);
        }

        return data;
    }

    /**
     * Obtiene documentos de Stradata para un tercero
     */
    static async obtenerDocumentosStradata(terceroId: string): Promise<DocumentosStratadaResponse> {
        const token = TokenStorage.getAccessToken();
        const url = `/terceros/${terceroId}/documentos-stradata/`;
        
        console.log(`� Obteniendo documentos Stradata para tercero: ${terceroId}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`📡 Response status: ${response.status}`);

        if (!response.ok) {
            if (response.status === 404) {
                console.log('📂 No hay documentos de Stradata para este tercero');
                // No hay documentos, devolver estructura vacía
                return {
                    tercero_id: terceroId,
                    numero_documento: '',
                    documentos: [],
                    total_documentos: 0
                };
            }
            
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Documentos Stradata obtenidos:', data);
        
        // Validar estructura de respuesta
        if (!data || !Array.isArray(data.documentos)) {
            console.warn('⚠️ Estructura de respuesta inesperada:', data);
            return {
                tercero_id: terceroId,
                numero_documento: data?.numero_documento || '',
                documentos: [],
                total_documentos: 0
            };
        }
        
        return data;
    }

    /**
     * Verifica si un usuario puede ejecutar scraping
     */
    static validarPermisosScraping(userRole?: string): boolean {
        return userRole === 'procesos';
    }

    /**
     * Obtiene el tipo de persona formateado para mostrar
     */
    static formatearTipoPersona(tipo: string): { label: string; icon: string } {
        const tipos = {
            'tercero_principal': { label: 'Tercero Principal', icon: '🏢' },
            'personas_pep': { label: 'Personas PEP', icon: '👑' },
            'representantes_legales': { label: 'Representantes Legales', icon: '📄' },
            'accionistas': { label: 'Accionistas', icon: '💼' }
        };

        return tipos[tipo as keyof typeof tipos] || { label: tipo, icon: '📁' };
    }

    /**
     * Construye la URL del endpoint de descarga segura para un documento
     */
    static construirUrlDescarga(archivo: DocumentoStradata): string {
        // Construir la ruta relativa del archivo desde 'media/'
        let rutaCompleta = '';
        
        // Si la ruta ya incluye 'media/', extraerla
        if (archivo.ruta.includes('/media/')) {
            const mediaIndex = archivo.ruta.indexOf('/media/');
            rutaCompleta = archivo.ruta.substring(mediaIndex + 7); // +7 para saltar '/media/'
        } else if (archivo.ruta.startsWith('media/')) {
            rutaCompleta = archivo.ruta.substring(6); // +6 para saltar 'media/'
        } else {
            // Asumir que la ruta está relativa desde documentos/
            rutaCompleta = archivo.ruta.startsWith('/') ? archivo.ruta.substring(1) : archivo.ruta;
        }
        
        // Agregar el nombre del archivo
        const rutaArchivoCompleta = `${rutaCompleta}${archivo.nombre}`;
        
        // Construir URL del endpoint de descarga segura
        return `${APP_CONFIG.api.baseUrl}/api/documentos/descargar/${encodeURIComponent(rutaArchivoCompleta)}/`;
    }

    /**
     * Descarga un documento de Stradata de forma segura
     */
    static async descargarDocumentoStradata(archivo: DocumentoStradata): Promise<void> {
        try {
            const token = TokenStorage.getAccessToken();
            const url = this.construirUrlDescarga(archivo);
            
            console.log('📥 Descargando documento Stradata usando endpoint seguro:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            if (!response.ok) {
                throw new Error(`Error al descargar: ${response.status} ${response.statusText}`);
            }

            // Obtener el blob del archivo
            const blob = await response.blob();
            
            // Crear un enlace temporal para la descarga
            const urlBlob = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = urlBlob;
            link.download = archivo.nombre;
            document.body.appendChild(link);
            link.click();
            
            // Limpiar
            document.body.removeChild(link);
            window.URL.revokeObjectURL(urlBlob);
            
        } catch (error) {
            console.error('🚨 Error descargando documento Stradata:', error);
            throw error;
        }
    }

    /**
     * Debug: Verificar configuración de URLs
     */
    static debugUrls(): void {
        console.log('🔧 DEBUG URLs de Stradata:');
        console.log('📍 APP_CONFIG.api.url:', APP_CONFIG.api.url);
        console.log('📍 APP_CONFIG.api.baseUrl:', APP_CONFIG.api.baseUrl);
        console.log('📍 URL scraping ejemplo:', `${APP_CONFIG.api.url}/terceros/123/scraping/`);
        console.log('📍 URL documentos ejemplo:', `${APP_CONFIG.api.url}/terceros/123/documentos-stradata/`);
    }
}

// 🆕 NUEVA CLASE PARA CONSULTAS MASIVAS
export class StradataConsultasMasivas {
  private baseUrl = '/stradata';

  /**
   * Ejecuta una consulta masiva en Stradata
   */
  async ejecutarConsultaMasiva(request: ConsultaStradataRequest): Promise<ConsultaStradataResponse> {
    try {
      console.log('🔍 Ejecutando consulta Stradata masiva:', {
        terceros_count: request.terceros_ids.length,
        usuario: request.usuario_stradata
      });

      const response = await apiRequest.post<ConsultaStradataResponse>(`${this.baseUrl}/ejecutar/`, request);
      
      console.log('✅ Consulta Stradata exitosa:', response);
      return response;
    } catch (error) {
      console.error('❌ Error en consulta Stradata:', error);
      throw error;
    }
  }

  /**
   * Lista las consultas realizadas
   */
  async listarConsultas(params?: {
    tercero_id?: string;
    usuario_id?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      const response = await apiRequest.get<{
        success: boolean;
        data: {
          consultas: ConsultaHistorial[];
          total: number;
          limit: number;
          offset: number;
        };
      }>(`${this.baseUrl}/consultas/`, { params });
      
      return response;
    } catch (error) {
      console.error('❌ Error listando consultas:', error);
      throw error;
    }
  }

  /**
   * Obtiene los tipos de documentos disponibles
   */
  async obtenerTiposDocumento(): Promise<DocumentType[]> {
    try {
      const response = await apiRequest.get<DocumentType[]>('/document-types/');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo tipos de documento:', error);
      return [];
    }
  }

  /**
   * Sube un documento de resultado de Stradata
   */
  async subirDocumentoStradata(
    terceroId: string, 
    archivo: File, 
    descripcion?: string
  ): Promise<{ success: boolean; data: DocumentoStradataUpload; message: string }> {
    try {
      // Primero obtener los tipos de documento disponibles
      const tiposDocumento = await this.obtenerTiposDocumento();
      console.log('📋 Tipos de documento disponibles:', tiposDocumento);
      
      // Buscar un tipo específico para Stradata o usar un genérico
      let tipoDocumentoId = tiposDocumento.find(tipo => 
        tipo.name?.toLowerCase().includes('stradata')
      )?.id;
      
      // Si no hay tipo específico de Stradata, buscar uno genérico
      if (!tipoDocumentoId) {
        tipoDocumentoId = tiposDocumento.find(tipo => 
          tipo.name?.toLowerCase().includes('otro') ||
          tipo.name?.toLowerCase().includes('adicional')
        )?.id;
      }
      
      // Como último recurso, usar el primer tipo disponible
      if (!tipoDocumentoId && tiposDocumento.length > 0) {
        tipoDocumentoId = tiposDocumento[0].id;
      }

      if (!tipoDocumentoId) {
        throw new Error('No se encontraron tipos de documento disponibles');
      }

      console.log('📤 Subiendo documento Stradata con tipo:', tipoDocumentoId);

      const formData = new FormData();
      formData.append('file', archivo);  
      formData.append('document_type', tipoDocumentoId);  
      
      // Solo agregar descripción si el endpoint la soporta
      if (descripcion) {
        formData.append('descripcion', descripcion);
      }

      console.log('📤 Subiendo documento Stradata:', {
        terceroId,
        archivo: archivo.name,
        size: archivo.size,
        type: archivo.type,
        documentTypeId: tipoDocumentoId,
        description: descripcion,
        endpoint: `/terceros/${terceroId}/upload_document/`
      });

      const response = await apiRequest.post<TerceroDocument>(
        `/terceros/${terceroId}/upload_document/`, 
        formData
      );

      console.log('✅ Documento subido exitosamente:', response);
      
      // Adaptar la respuesta al formato esperado
      return {
        success: true,
        data: {
          id: response.id,
          nombre_archivo: response.fileName || archivo.name,
          tipo_documento: 'stradata_resultado',
          tipo_documento_display: 'Documento Stradata',
          fecha_subida: new Date().toISOString(),
          descripcion: descripcion || `Resultado Stradata - ${archivo.name}`,
          tercero: {
            id: terceroId,
            nombres: 'Tercero', // TODO: obtener del contexto
            apellidos: ''
          },
          subido_por: {
            id: 1,  // TODO: obtener del contexto de usuario
            username: 'usuario_actual'
          },
          es_resultado_stradata: true,
          tamaño_archivo_legible: `${Math.round(response.fileSizeBytes / 1024)} KB`,
          url_archivo: response.filePath || ''
        },
        message: 'Documento subido exitosamente'
      };
    } catch (error) {
      console.error('❌ Error subiendo documento:', error);
      throw error;
    }
  }

  /**
   * Lista los documentos de un tercero
   */
  async listarDocumentosTercero(
    terceroId: string,
    params?: {
      tipo_documento?: string;
      solo_stradata?: boolean;
    }
  ) {
    try {
      const response = await apiRequest.get<{
        success: boolean;
        data: {
          documentos: DocumentoStradataUpload[];
          total: number;
        };
      }>(`${this.baseUrl}/terceros/${terceroId}/documentos/`, { params });

      return response;
    } catch (error) {
      console.error('❌ Error listando documentos:', error);
      throw error;
    }
  }

  /**
   * Elimina un documento
   */
  async eliminarDocumento(documentoId: string) {
    try {
      const response = await apiRequest.delete<{ success: boolean; message: string }>(
        `${this.baseUrl}/documentos/${documentoId}/eliminar/`
      );

      console.log('✅ Documento eliminado:', response);
      return response;
    } catch (error) {
      console.error('❌ Error eliminando documento:', error);
      throw error;
    }
  }

  /**
   * 📋 Lista los documentos Stradata subidos para un tercero
   */
  async listarDocumentosStradata(terceroId: string): Promise<DocumentoStradataUpload[]> {
    console.log(`📋 Listando documentos Stradata para tercero: ${terceroId}`);
    
    try {
      const response = await apiRequest.get<DocumentoStradataUpload[]>(
        `${this.baseUrl}/terceros/${terceroId}/documentos/`
      );

      console.log('✅ Documentos Stradata listados:', response);
      return response;
    } catch (error) {
      console.error('❌ Error listando documentos Stradata:', error);
      throw error;
    }
  }
}

// 🆕 INSTANCIAS EXPORTADAS
export const stradataService = new StratadaService();
export const stradataConsultasMasivas = new StradataConsultasMasivas();

export default StratadaService;
