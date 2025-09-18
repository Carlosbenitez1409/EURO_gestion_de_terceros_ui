import { API_CONFIG, apiRequest, TokenStorage } from '@/lib/api.client';

// Tipos para Debida Diligencia
export interface DebidaDiligenciaDocumento {
    id: string; // UUID como string, no number
    uuid: string; // UUID del documento
    tercero?: string; // UUID del tercero (opcional para compatibilidad)
    tercero_uuid?: string; // UUID del tercero
    tercero_nombre?: string; // Nombre del tercero
    tercero_numero_documento?: string; // Número de documento del tercero
    categoria: string; // Más flexible para diferentes categorías
    categoria_display?: string; // Display name de la categoría
    estado: 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado' | 'requiere_actualizacion';
    estado_display?: string; // Display name del estado
    nombre?: string; // Nombre del archivo (campo preferido)
    nombre_documento?: string; // Compatibilidad con versión anterior
    descripcion?: string;
    tipo_documento?: string; // Tipo específico de documento
    tipo_documento_display?: string; // Display name del tipo
    tamaño_archivo?: number; // Tamaño en bytes
    subido_por_nombre?: string; // Nombre del usuario que subió
    fecha_subida: string;
    fecha_vencimiento?: string;
    dias_para_vencer?: number;
    esta_vencido?: boolean;
    observaciones?: string;
    metadata?: Record<string, any>;
}

export interface DebidaDiligenciaUploadRequest {
    tercero: string; // UUID del tercero
    categoria: string;
    nombre_documento: string;
    descripcion?: string;
    archivo: File;
    observaciones?: string;
}

export interface DebidaDiligenciaRevisionRequest {
    estado: 'en_revision' | 'aprobado' | 'rechazado' | 'requiere_actualizacion';
    observaciones?: string;
}

export interface DebidaDiligenciaResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: DebidaDiligenciaDocumento[];
}

// Nueva interfaz para la respuesta de terceros
export interface DebidaDiligenciaTercerosResponse {
    success: boolean;
    tercero_id: string;
    numero_documento: string;
    nombre_tercero: string;
    documentos: DebidaDiligenciaDocumento[];
    total_documentos: number;
}

class DebidaDiligenciaService {
    private baseUrl = `${API_CONFIG.baseURL}/terceros`;

    /**
     * Obtiene la lista de documentos de debida diligencia para un tercero
     */
    async obtenerDocumentos(terceroId: string): Promise<DebidaDiligenciaDocumento[]> {
        try {
            console.log('🔍 Debug - Obteniendo documentos para tercero:', terceroId);
            const timestamp = Date.now();
            const url = `${this.baseUrl}/${terceroId}/debida-diligencia/?_t=${timestamp}`;
            console.log('🔍 Debug - URL de request:', url);
            
            const response = await apiRequest.get<DebidaDiligenciaTercerosResponse>(url);
            
            console.log('🔍 Debug - Respuesta de documentos:', response);
            console.log('🔍 Debug - Documentos obtenidos:', response.documentos?.length || 0);
            
            // Log detallado de cada documento para verificar filtrado
            if (response.documentos && response.documentos.length > 0) {
                console.log('🔍 Debug - DETALLES DE DOCUMENTOS OBTENIDOS:');
                response.documentos.forEach((doc, index) => {
                    console.log(`🔍 Debug - Documento ${index + 1}:`, {
                        id: doc.id,
                        tercero: doc.tercero_uuid,
                        nombre: doc.nombre,
                        categoria: doc.categoria,
                        tercero_solicitado: terceroId
                    });
                });
            }
            
            return response.documentos || [];
        } catch (error) {
            console.error('❌ Error obteniendo documentos de debida diligencia:', error);
            throw error;
        }
    }

    /**
     * Subir un nuevo documento de debida diligencia
     */
    async subirDocumento(data: DebidaDiligenciaUploadRequest): Promise<DebidaDiligenciaDocumento> {
        try {
            console.log('📤 Debug - SUBIENDO DOCUMENTO');
            console.log('📤 Debug - Tercero UUID:', data.tercero);
            console.log('📤 Debug - Categoría:', data.categoria);
            console.log('📤 Debug - Nombre archivo:', data.nombre_documento);
            console.log('📤 Debug - Archivo objeto:', data.archivo);
            
            console.log('📤 Debug - Preparando FormData...');
            const formData = new FormData();
            
            // Campo OBLIGATORIO - usar solo 'archivo' según documentación
            formData.append('archivo', data.archivo);
            console.log('📤 Debug - Archivo agregado:', data.archivo.name, 'Tamaño:', data.archivo.size, 'Tipo:', data.archivo.type);
            
            // Campo OPCIONAL - nombre del documento
            if (data.nombre_documento) {
                formData.append('nombre', data.nombre_documento);
                console.log('📤 Debug - Nombre agregado:', data.nombre_documento);
            }
            
            // Campo OPCIONAL - tipo específico DD
            if (data.categoria === 'debida_diligencia') {
                formData.append('tipo_documento', 'debida_diligencia_otro');
                console.log('📤 Debug - Tipo documento agregado: debida_diligencia_otro');
            }
            
            const uploadUrl = `${this.baseUrl}/${data.tercero}/debida-diligencia/upload/`;
            console.log('📤 Debug - URL de subida:', uploadUrl);

            // Obtener token para autenticación usando el método oficial del sistema
            const token = TokenStorage.getAccessToken();
            console.log('📤 Debug - Token presente:', !!token);
            console.log('📤 Debug - Token length:', token?.length || 0);
            
            if (!token) {
                console.error('📤 Debug - No se encontró token. Verificando almacenamiento...');
                console.log('📤 Debug - Keys en localStorage:', Object.keys(localStorage));
                throw new Error('No hay token de autenticación disponible');
            }

            console.log('📤 Debug - Usando fetch() directo para evitar interceptor axios...');
            
            // Usar fetch() directo para evitar el interceptor que fuerza application/json
            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // NO incluir Content-Type - fetch maneja automáticamente multipart/form-data
                },
                body: formData
            });

            console.log('📤 Debug - Respuesta del servidor - Status:', response.status);
            console.log('📤 Debug - Headers de respuesta:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorData = await response.json();
                console.error('📤 Debug - Error del servidor:', errorData);
                throw new Error(errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ Documento de debida diligencia subido exitosamente:', result);
            return result;
        } catch (error) {
            console.error('❌ Error subiendo documento de debida diligencia:', error);
            throw error;
        }
    }

    /**
     * Descargar un documento de debida diligencia
     */
    async descargarDocumento(documentoId: string, terceroId?: string): Promise<void> {
        try {
            console.log('⬇️ Debug - DESCARGANDO DOCUMENTO');
            console.log('⬇️ Debug - Documento ID:', documentoId);
            console.log('⬇️ Debug - Tercero ID:', terceroId);
            
            // Validación robusta del ID (ahora string UUID)
            if (!documentoId || documentoId === undefined || documentoId === null || documentoId === 'undefined' || documentoId === 'null' || documentoId.trim() === '') {
                const errorMsg = `❌ ID de documento no válido para descarga: ${documentoId} (tipo: ${typeof documentoId})`;
                console.error(errorMsg);
                throw new Error(`ID de documento no válido: ${documentoId}`);
            }
            
            // URL exacta según documentación del backend: /api/terceros/debida-diligencia/{documento_id}/download/
            const downloadUrl = `${this.baseUrl}/debida-diligencia/${documentoId}/download/`;
            console.log('⬇️ Debug - URL de descarga (backend exacta):', downloadUrl);
            
            // Usar apiRequest que maneja automáticamente la autenticación JWT
            console.log('⬇️ Debug - Realizando petición con autenticación automática...');
            const response = await apiRequest.get(downloadUrl, {
                responseType: 'blob'  // Para manejar archivos binarios
            });

            console.log('⬇️ Debug - Respuesta exitosa del servidor');
            console.log('⬇️ Debug - Tipo de respuesta:', typeof response.data);
            console.log('⬇️ Debug - Tamaño de datos:', response.data?.size || 'desconocido');
            
            // Crear blob y descargar archivo
            const downloadBlob = new Blob([response.data]);
            const blobUrl = window.URL.createObjectURL(downloadBlob);
            const downloadLink = document.createElement('a');
            
            downloadLink.style.display = 'none';
            downloadLink.href = blobUrl;
            downloadLink.download = `documento_${documentoId}.pdf`;
            
            // Trigger download
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            window.URL.revokeObjectURL(blobUrl);
            
            console.log('✅ Documento descargado exitosamente');
        } catch (error) {
            console.error('❌ Error descargando documento:', error);
            throw error;
        }
    }

    /**
     * Eliminar un documento de debida diligencia
     */
    async eliminarDocumento(documentoId: string, terceroId?: string): Promise<void> {
        try {
            console.log('🗑️ Debug - ELIMINANDO DOCUMENTO');
            console.log('🗑️ Debug - Documento ID:', documentoId);
            console.log('🗑️ Debug - Tercero ID:', terceroId);
            
            // Validación robusta del ID (ahora string UUID)
            if (!documentoId || documentoId === undefined || documentoId === null || documentoId === 'undefined' || documentoId === 'null' || documentoId.trim() === '') {
                const errorMsg = `❌ ID de documento no válido: ${documentoId} (tipo: ${typeof documentoId})`;
                console.error(errorMsg);
                throw new Error(`ID de documento no válido: ${documentoId}`);
            }
            
            // URL exacta según documentación del backend: /api/terceros/debida-diligencia/{documento_id}/
            const deleteUrl = `${this.baseUrl}/debida-diligencia/${documentoId}/`;
            console.log('🗑️ Debug - URL de eliminación (backend exacta):', deleteUrl);
            
            const response = await apiRequest.delete(deleteUrl);
            console.log('🗑️ Debug - Respuesta de eliminación:', response);
            console.log('✅ Documento de debida diligencia eliminado exitosamente');
        } catch (error) {
            console.error('❌ Error eliminando documento de debida diligencia:', error);
            console.error('❌ Debug - Error completo:', error);
            throw error;
        }
    }

    /**
     * Actualizar el estado de revisión de un documento
     */
    async actualizarRevision(
        documentoId: string, 
        data: DebidaDiligenciaRevisionRequest
    ): Promise<DebidaDiligenciaDocumento> {
        try {
            const response = await apiRequest.post<DebidaDiligenciaDocumento>(
                `${this.baseUrl}/debida-diligencia/${documentoId}/revision/`,
                data
            );
            console.log('✅ Estado de revisión actualizado exitosamente');
            return response;
        } catch (error) {
            console.error('❌ Error actualizando estado de revisión:', error);
            throw error;
        }
    }

    /**
     * Obtener opciones disponibles de debida diligencia
     */
    async obtenerOpciones(): Promise<any> {
        try {
            const response = await apiRequest.get(`${this.baseUrl}/debida-diligencia/opciones/`);
            console.log('✅ Opciones de debida diligencia obtenidas:', response);
            return response;
        } catch (error) {
            console.error('❌ Error obteniendo opciones de debida diligencia:', error);
            throw error;
        }
    }

    /**
     * Obtener categorías disponibles
     */
    getCategorias(): Array<{value: string, label: string}> {
        return [
            { value: 'debida_diligencia_formulario', label: 'Formulario de Debida Diligencia' },
            { value: 'debida_diligencia_verificacion', label: 'Verificación de Identidad' },
            { value: 'debida_diligencia_bienes', label: 'Declaración de Bienes' },
            { value: 'debida_diligencia_vinculacion', label: 'Formulario de Vinculación' },
            { value: 'perfil_riesgo_matriz', label: 'Matriz de Riesgo' },
            { value: 'perfil_riesgo_evaluacion', label: 'Evaluación de Riesgo' },
            { value: 'perfil_riesgo_actualizacion', label: 'Actualización de Perfil' },
            { value: 'perfil_riesgo_calificacion', label: 'Calificación de Riesgo' },
            { value: 'documentos_soporte_referencias', label: 'Referencias Comerciales' },
            { value: 'documentos_soporte_financieros', label: 'Estados Financieros' },
            { value: 'documentos_soporte_certificaciones', label: 'Certificaciones' },
            { value: 'documentos_soporte_licencias', label: 'Licencias y Permisos' },
            { value: 'evaluacion_informes', label: 'Informes de Evaluación' },
            { value: 'evaluacion_recomendaciones', label: 'Recomendaciones' },
            { value: 'evaluacion_mitigacion', label: 'Plan de Mitigación' },
            { value: 'seguimiento_revision', label: 'Revisión Periódica' },
            { value: 'seguimiento_actualizacion', label: 'Actualización de Datos' },
            { value: 'seguimiento_monitoreo', label: 'Monitoreo Continuo' },
        ];
    }

    /**
     * Obtener estados disponibles
     */
    getEstados(): Array<{value: string, label: string, color: string}> {
        return [
            { value: 'pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
            { value: 'en_revision', label: 'En Revisión', color: 'bg-blue-100 text-blue-800' },
            { value: 'aprobado', label: 'Aprobado', color: 'bg-green-100 text-green-800' },
            { value: 'rechazado', label: 'Rechazado', color: 'bg-red-100 text-red-800' },
            { value: 'requiere_actualizacion', label: 'Requiere Actualización', color: 'bg-orange-100 text-orange-800' },
        ];
    }

    /**
     * Obtener el color del badge para un estado específico
     */
    getEstadoColor(estado: string): string {
        const estadoInfo = this.getEstados().find(e => e.value === estado);
        return estadoInfo?.color || 'bg-gray-100 text-gray-800';
    }

    /**
     * Obtener el label de una categoría
     */
    getCategoriaLabel(categoria: string): string {
        const categoriaInfo = this.getCategorias().find(c => c.value === categoria);
        return categoriaInfo?.label || categoria;
    }
}

export const debidaDiligenciaService = new DebidaDiligenciaService();
export default DebidaDiligenciaService;
