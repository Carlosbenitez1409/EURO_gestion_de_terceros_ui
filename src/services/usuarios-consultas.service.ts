import { apiClient } from '../lib/api.client';
import { 
  Solicitud, 
  SolicitudCreateRequest, 
  SolicitudUpdateRequest, 
  FiltrosSolicitud,
  EstadoSolicitud,
  RolUsuario,
  Riesgo
} from '../types/usuarios-consultas';

// ======================================================================
// SERVICIO API PARA USUARIOS Y CONSULTAS
// ======================================================================

export class UsuariosConsultasService {
  private static baseUrl = '/usuarios-consultas';

  // Función para normalizar el riesgo del backend al frontend
  private static normalizarRiesgo(riesgoBackend: string): string {
    const riesgoMap: { [key: string]: string } = {
      'SIN_ANTECEDENTES': 'sin_antecedentes',
      'BAJO': 'bajo', 
      'MEDIO': 'medio',
      'ALTO': 'alto',
      // También manejar si ya viene en minúsculas
      'sin_antecedentes': 'sin_antecedentes',
      'bajo': 'bajo',
      'medio': 'medio', 
      'alto': 'alto'
    };
    
    return riesgoMap[riesgoBackend] || 'sin_antecedentes';
  }

  // Función para convertir el riesgo del frontend al formato del backend
  private static riesgoToBackend(riesgoFrontend: string): string {
    const riesgoMap: { [key: string]: string } = {
      'sin_antecedentes': 'SIN_ANTECEDENTES',
      'bajo': 'BAJO',
      'medio': 'MEDIO', 
      'alto': 'ALTO'
    };
    
    return riesgoMap[riesgoFrontend] || 'SIN_ANTECEDENTES';
  }

  // Obtener todas las solicitudes con filtros
  static async getSolicitudes(filtros?: FiltrosSolicitud): Promise<Solicitud[]> {
    const params = new URLSearchParams();
    
    if (filtros?.estado?.length) {
      filtros.estado.forEach(estado => params.append('estado', estado));
    }
    if (filtros?.fechaDesde) params.append('fecha_desde', filtros.fechaDesde);
    if (filtros?.fechaHasta) params.append('fecha_hasta', filtros.fechaHasta);
    if (filtros?.creadaPor) params.append('creada_por', filtros.creadaPor);
    if (filtros?.asignadaA) params.append('asignada_a', filtros.asignadaA);
    if (filtros?.riesgo?.length) {
      filtros.riesgo.forEach(riesgo => params.append('riesgo', riesgo));
    }

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}/?${queryString}` : `${this.baseUrl}/`;
    
    const response = await apiClient.get(url);
    
    // Para listas paginadas, mapear cada solicitud
    if (response.data.results && Array.isArray(response.data.results)) {
      return {
        ...response.data,
        results: response.data.results.map((solicitud: any) => this.mapSolicitudResponse(solicitud))
      };
    }
    
    // Para arrays directos
    if (Array.isArray(response.data)) {
      return response.data.map((solicitud: any) => this.mapSolicitudResponse(solicitud));
    }
    
    return response.data;
  }

  // Mapear respuesta del backend al formato frontend
  private static mapSolicitudResponse(backendData: any): Solicitud {
    return {
      ...backendData,
      // Mapear campos snake_case a camelCase
      historialCambios: backendData.historial_cambios?.map((cambio: any) => ({
        ...cambio,
        fechaCambio: cambio.fecha_cambio,
        usuario: cambio.usuario?.nombre_completo || cambio.usuario?.username || 'Usuario desconocido',
        rol: cambio.usuario?.role || 'Sin rol'
      })) || [],
      observacionesGenerales: backendData.observaciones_generales,
      fechaCreacion: backendData.fecha_creacion,
      fechaUltimaActualizacion: backendData.fecha_ultima_actualizacion,
      creadaPor: {
        id: backendData.creada_por?.id?.toString() || '',
        nombre: backendData.creada_por?.nombre_completo || 
                `${backendData.creada_por?.first_name} ${backendData.creada_por?.last_name}`.trim() ||
                backendData.creada_por?.username || 'Usuario desconocido',
        email: backendData.creada_por?.email || '',
        rol: backendData.creada_por?.role as RolUsuario || RolUsuario.GESTION_HUMANA
      },
      asignadaA: backendData.asignada_a ? {
        id: backendData.asignada_a.id?.toString() || '',
        nombre: backendData.asignada_a.nombre_completo || 
                `${backendData.asignada_a.first_name} ${backendData.asignada_a.last_name}`.trim() ||
                backendData.asignada_a.username || 'Usuario desconocido',
        email: backendData.asignada_a.email || '',
        rol: backendData.asignada_a.role as RolUsuario || RolUsuario.ADMINISTRADOR
      } : undefined,
      // Mapear array de personas - asegurar que sea un array válido
      personas: Array.isArray(backendData.personas) ? backendData.personas.map((persona: any, index: number) => ({
        id: persona.id?.toString() || `temp-${index}`, // ID temporal si no existe 
        orden: persona.orden ?? index, // Usar orden del backend o el índice
        nombresApellidos: persona.nombres_apellidos || persona.nombresApellidos || '',
        numeroDocumento: persona.numero_documento || persona.numeroDocumento || '',
        tipoDocumento: persona.tipo_documento || persona.tipoDocumento || 'CC',
        antecedentes: persona.antecedentes || '',
        observaciones: persona.observaciones || '',
        riesgo: this.normalizarRiesgo(persona.riesgo || 'sin_antecedentes')
      })) : [],
      // Mapear campos de permisos del backend
      puedeTomarRevision: backendData.puede_tomar_revision,
      puedeEditar: backendData.puede_editar,
      puedeCambiarEstado: backendData.puede_cambiar_estado
    };
  }

  // Obtener solicitud por ID
  static async getSolicitudById(id: string): Promise<Solicitud> {
    const response = await apiClient.get(`${this.baseUrl}/${id}/`);
    console.log('Respuesta cruda del backend:', response.data);
    const mappedData = this.mapSolicitudResponse(response.data);
    console.log('Datos mapeados para frontend:', mappedData);
    return mappedData;
  }

  // Crear nueva solicitud (solo GH)
  static async createSolicitud(data: SolicitudCreateRequest): Promise<Solicitud> {
    const response = await apiClient.post(`${this.baseUrl}/`, data);
    return this.mapSolicitudResponse(response.data);
  }

  // Actualizar solicitud
  static async updateSolicitud(id: string, data: SolicitudUpdateRequest): Promise<Solicitud> {
    const response = await apiClient.patch(`${this.baseUrl}/${id}/`, data);
    return this.mapSolicitudResponse(response.data);
  }

  // Cambiar estado de solicitud
  static async cambiarEstado(
    id: string, 
    nuevoEstado: EstadoSolicitud, 
    data?: { asignadaA?: string; motivoDevolucion?: string; observaciones?: string }
  ): Promise<Solicitud> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/cambiar-estado/`, {
      estado: nuevoEstado,
      ...data
    });
    return this.mapSolicitudResponse(response.data);
  }

  // Asignar solicitud a usuario
  static async asignarSolicitud(id: string, usuarioId: string): Promise<Solicitud> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/asignar/`, {
      asignada_a: usuarioId
    });
    return this.mapSolicitudResponse(response.data);
  }

  // Tomar solicitud en revisión
  static async tomarRevision(id: string): Promise<Solicitud> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/tomar-revision/`);
    return this.mapSolicitudResponse(response.data);
  }

  // Devolver solicitud a GH
  static async devolverAGH(id: string, motivo: string): Promise<Solicitud> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/devolver-gh/`, {
      motivo_devolucion: motivo
    });
    return this.mapSolicitudResponse(response.data);
  }

  // Finalizar solicitud
  static async finalizarSolicitud(id: string, observaciones?: string): Promise<Solicitud> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/finalizar/`, {
      observaciones_finalizacion: observaciones
    });
    return this.mapSolicitudResponse(response.data);
  }

  // Actualizar persona específica en la solicitud
  static async updatePersona(
    solicitudId: string, 
    personaId: string, 
    data: Partial<{
      antecedentes: string;
      observaciones: string;
      riesgo: string;
    }>
  ): Promise<Solicitud> {
    // Convertir el riesgo al formato del backend si está presente
    const dataToSend = { ...data };
    if (dataToSend.riesgo) {
      dataToSend.riesgo = this.riesgoToBackend(dataToSend.riesgo);
    }
    
    // Actualizar la persona
    await apiClient.patch(`${this.baseUrl}/${solicitudId}/persona/${personaId}/`, dataToSend);
    
    // Obtener la solicitud completa actualizada
    return this.getSolicitudById(solicitudId);
  }

  // Obtener usuarios disponibles para asignación
  static async getUsuariosDisponibles(rol?: string): Promise<Array<{
    id: string;
    nombre: string;
    email: string;
    rol: string;
  }>> {
    const params = rol ? `?rol=${rol}` : '';
    const response = await apiClient.get(`/accounts/usuarios-disponibles/${params}`);
    


    
    // Manejar diferentes formatos de respuesta
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    } else if (response.data && Array.isArray(response.data.usuarios)) {
      return response.data.usuarios;
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data && response.data.usuarios_por_departamento) {
      // Manejar estructura por departamentos
      const usuarios = [];
      const departamentos = response.data.usuarios_por_departamento;
      
      for (const departamento in departamentos) {
        if (Array.isArray(departamentos[departamento])) {
          departamentos[departamento].forEach((usuario: any) => {
            // Mapear departamentos a roles del sistema
            let rol;
            // Usar el departamento para determinar el rol, ignorando usuario.role del backend
            switch (departamento) {
              case 'Comercial':
                rol = 'comercial';
                break;
              case 'Gestión Humana':
                rol = 'gestion_humana';
                break;
              case 'Oficial de Cumplimiento':
                rol = 'administrador'; // Los oficiales de cumplimiento actúan como administradores
                break;
              case 'Procesos':
                rol = 'procesos';
                break;
              default:
                rol = usuario.role || departamento.toLowerCase().replace(' ', '_');
            }
            
            const usuarioProcessed = {
              id: usuario.id.toString(),
              nombre: usuario.nombre_completo || `${usuario.first_name} ${usuario.last_name}`.trim() || usuario.username,
              email: usuario.email,
              rol: rol
            };
            
            usuarios.push(usuarioProcessed);
          });
        }
      }
      
      return usuarios;
    } else {
      console.warn('Formato de respuesta de usuarios inesperado:', response.data);
      return [];
    }
  }

  // Consultar Stradata para una solicitud específica
  static async consultarStradata(id: string, credenciales: {
    username: string;
    password: string;
    persona_id?: string; // Opcional, si no se proporciona consulta todas las personas
  }): Promise<{
    solicitud_id: string;
    personas_consultadas: Array<{
      nombres_apellidos: string;
      numero_documento: string;
      tipo_documento: string;
    }>;
    consulta_realizada: boolean;
    fecha_consulta: string;
    usuario_consulta: string;
    resultados: {
      codigo_busqueda: string;
      consulta_exitosa: boolean;
      datos_stradata: {
        personas_consultadas: number;
        personas: string[];
        id_busqueda: number;
        codigo_busqueda: string;
        id_plantilla: number;
        resumen_servicios: {
          exitosos: number;
          fallidos: number;
          total: number;
        };
        servicios: {
          [key: string]: {
            status: string;
            status_code: number;
            url: string;
          };
        };
      };
      detalles: string;
      id_busqueda: number;
      personas_consultadas_count: number;
      resumen_servicios: {
        total: number;
        exitosos: number;
        fallidos: number;
      };
      servicios_consultados: {
        [key: string]: {
          status: string;
          status_code: number;
          url: string;
        };
      };
      total_personas: number;
    };
  }> {
    // Timeout extendido para consultas de Stradata (8 minutos para manejar múltiples personas)
    // Cada persona puede tomar ~1-2 minutos, así que 8 minutos debería cubrir hasta 5-6 personas
    const response = await apiClient.post(
      `${this.baseUrl}/${id}/consultar-stradata/`, 
      credenciales,
      { timeout: 480000 } // 8 minutos (480,000 ms)
    );
    return response.data;
  }

  // Obtener estadísticas del dashboard
  static async getEstadisticas(): Promise<{
    total_solicitudes: number;
    por_estado: Record<EstadoSolicitud, number>;
    por_riesgo: Record<string, number>;
    solicitudes_pendientes: number;
    tiempo_promedio_resolucion: number;
  }> {
    const response = await apiClient.get(`${this.baseUrl}/estadisticas/`);
    return response.data;
  }
}