import { apiRequest } from '@/lib/api.client';

export interface ComercialBalance {
    id: string;
    nombre_completo: string;
    email: string;
    total_asignados: number;
    pendientes: number;
    en_revision: number;
    aprobados: number;
    rechazados: number;
}

export interface ProcesosBalance {
    id: string;
    nombre_completo: string;
    email: string;
    total_asignados: number;
    pendientes: number;
    aprobados: number;
    rechazados: number;
}

export interface BalanceResponse {
    balance_comerciales: ComercialBalance[];
    total_comerciales_activos: number;
}

export interface BalanceProcesosResponse {
    balance_procesos: ProcesosBalance[];
    total_procesos_activos: number;
}

export interface MisTercerosResponse {
    terceros: any[];
    estadisticas: {
        total_asignados: number;
        pendientes: number;
        en_revision: number;
        aprobados: number;
        rechazados: number;
    };
}

export interface AsignacionProcesosRequest {
    usuario_procesos_id?: string; // opcional, si no se especifica se asigna automáticamente
}

export interface AsignacionProcesosResponse {
    mensaje: string;
    comercial: string;
    usuario_procesos: string;
    tercero_id: string;
}

export interface ReasignacionRequest {
    nuevo_comercial_id: string;
}

export interface EstadisticasComercial {
    total_asignados: number;
    pendientes: number;
    aprobados: number;
    rechazados: number;
    porcentaje_aprobacion: number;
    ultimos_30_dias: {
        nuevos_asignados: number;
        aprobados: number;
        pendientes: number;
    };
    mes_actual: {
        asignados: number;
        gestionados: number;
        pendientes: number;
    };
}

class AsignacionesService {
    
    /**
     * Obtener terceros asignados al comercial autenticado
     */
    async getMisTercerosAsignados(): Promise<MisTercerosResponse> {
        return await apiRequest.get<MisTercerosResponse>('/api/terceros/mis_terceros_asignados/');
    }

    /**
     * Asignar un tercero a procesos (solo comerciales)
     */
    async asignarAProcesos(terceroId: string, request?: AsignacionProcesosRequest): Promise<AsignacionProcesosResponse> {
        return await apiRequest.post<AsignacionProcesosResponse>(
            `/terceros/${terceroId}/asignar_a_procesos/`,
            request || {}
        );
    }

    /**
     * Obtener terceros asignados al usuario de procesos autenticado
     */
    async getMisTercerosParaProcesos(): Promise<MisTercerosResponse> {
        return await apiRequest.get<MisTercerosResponse>('/api/terceros/mis_terceros_para_procesos/');
    }

    /**
     * Obtener balance de asignaciones entre comerciales (solo procesos/admin)
     */
    async getBalanceAsignacionesComerciales(): Promise<BalanceResponse> {
        return await apiRequest.get<BalanceResponse>('/api/terceros/balance_asignaciones/');
    }

    /**
     * Obtener todos los terceros con información de asignación (para procesos)
     * Esto incluye campos como asignado_a, asignado_por, fecha_asignacion
     */
    async getTercerosConAsignaciones(): Promise<any[]> {
        try {
            // Intentar usar un endpoint específico para terceros con asignaciones
            const response = await apiRequest.get<any>('/api/terceros/con_asignaciones/');
            return Array.isArray(response) ? response : response.results || response.terceros || [];
        } catch (error) {
            console.warn('Endpoint con_asignaciones no disponible, usando endpoint general');
            // Fallback al endpoint general
            const response = await apiRequest.get<any>('/api/terceros/');
            return Array.isArray(response) ? response : response.results || [];
        }
    }

    /**
     * Alias para compatibilidad
     */
    async getBalanceComerciales(): Promise<BalanceResponse> {
        return this.getBalanceAsignacionesComerciales();
    }

    /**
     * Asignar tercero específico a comercial usando asignación equitativa (desde procesos)
     * @param terceroId - ID del tercero a asignar
     * @param comercialId - ID del comercial específico (opcional). Si no se proporciona, se asigna automáticamente al comercial con menos carga
     * @returns Respuesta con mensaje de confirmación
     */
    async asignarTerceroAComercial(terceroId: string, comercialId?: string): Promise<{ message: string; success: boolean; comercial?: any }> {
        const payload = comercialId ? { comercial_id: comercialId } : {};
        
        try {
            // Usar el endpoint más versátil que funciona tanto para asignar como reasignar
            const response = await apiRequest.post<{ message: string; success: boolean; comercial?: any }>(
                `/terceros/${terceroId}/asignar_o_reasignar_comercial/`, 
                payload
            );
            
            console.log(`✅ Tercero ${terceroId} ${comercialId ? 'asignado/reasignado manualmente' : 'asignado automáticamente'}:`, response);
            
            return response;
        } catch (error: any) {
            console.error('❌ Error al asignar tercero a comercial:', error);
            
            // Mejorar el mensaje de error
            if (error.status === 404) {
                throw new Error('El endpoint de asignación no está disponible. Verifique la configuración del backend.');
            } else if (error.status === 400) {
                throw new Error('Datos de asignación inválidos. Verifique que el tercero y comercial existan.');
            } else if (error.status === 403) {
                throw new Error('No tiene permisos para asignar terceros a comerciales.');
            }
            
            throw error;
        }
    }

    /**
     * Reasignar tercero a otro comercial (solo si ya tiene comercial asignado)
     */
    async reasignarTerceroAComercial(terceroId: string, nuevoComercialId: string): Promise<{ message: string; success: boolean; comercial?: any }> {
        const payload = { comercial_id: nuevoComercialId };
        
        try {
            const response = await apiRequest.post<{ message: string; success: boolean; comercial?: any }>(
                `/terceros/${terceroId}/reasignar_comercial_equitativo/`, 
                payload
            );
            
            console.log(`✅ Tercero ${terceroId} reasignado a nuevo comercial:`, response);
            
            return response;
        } catch (error: any) {
            console.error('❌ Error al reasignar tercero:', error);
            
            if (error.status === 400) {
                throw new Error('El tercero no tiene comercial asignado o el comercial destino no existe.');
            } else if (error.status === 404) {
                throw new Error('Endpoint de reasignación no disponible.');
            } else if (error.status === 403) {
                throw new Error('No tiene permisos para reasignar terceros.');
            }
            
            throw error;
        }
    }

    /**
     * Desasignar comercial de un tercero
     */
    async desasignarComercialDeTercero(terceroId: string): Promise<{ message: string; success: boolean }> {
        try {
            const response = await apiRequest.post<{ message: string; success: boolean }>(
                `/terceros/${terceroId}/desasignar_comercial/`, 
                {}
            );
            
            console.log(`✅ Comercial desasignado del tercero ${terceroId}:`, response);
            
            return response;
        } catch (error: any) {
            console.error('❌ Error al desasignar comercial:', error);
            
            if (error.status === 400) {
                throw new Error('El tercero no tiene comercial asignado.');
            } else if (error.status === 404) {
                throw new Error('Endpoint de desasignación no disponible.');
            } else if (error.status === 403) {
                throw new Error('No tiene permisos para desasignar comerciales.');
            }
            
            throw error;
        }
    }

    /**
     * Obtener balance de asignaciones entre procesos (solo procesos/admin)
     */
    async getBalanceAsignacionesProcesos(): Promise<BalanceProcesosResponse> {
        return await apiRequest.get<BalanceProcesosResponse>('/api/terceros/balance_asignaciones_procesos/');
    }

    /**
     * Obtener lista de usuarios de procesos activos para asignación
     */
    async getProcesosActivos(): Promise<ProcesosBalance[]> {
        try {
            const balance = await this.getBalanceAsignacionesProcesos();
            return balance.balance_procesos;
        } catch (error) {
            // Si el usuario no tiene permisos (comercial), usar endpoint alternativo
            console.warn('No se pudo obtener balance completo, usando lista simple de procesos');
            return await this.getProcesosSimple();
        }
    }

    /**
     * Obtener lista simple de procesos (para comerciales)
     */
    async getProcesosSimple(): Promise<ProcesosBalance[]> {
        // Como solución temporal, crear una lista mock o usar endpoint de usuarios
        // En producción esto debería ser un endpoint real del backend
        return [
            {
                id: '1',
                nombre_completo: 'Usuario Procesos 1',
                email: 'procesos1@euro.com',
                total_asignados: 0,
                pendientes: 0,
                aprobados: 0,
                rechazados: 0
            },
            {
                id: '2',
                nombre_completo: 'Usuario Procesos 2',
                email: 'procesos2@euro.com',
                total_asignados: 0,
                pendientes: 0,
                aprobados: 0,
                rechazados: 0
            }
        ];
    }

    /**
     * Obtener lista de comerciales activos
     */
    async getComercialesActivos(): Promise<ComercialBalance[]> {
        const balance = await this.getBalanceAsignacionesComerciales();
        return balance.balance_comerciales;
    }

    /**
     * Obtener estadísticas del comercial autenticado
     */
    async getEstadisticasComercial(): Promise<EstadisticasComercial> {
        return await apiRequest.get<EstadisticasComercial>('/api/terceros/estadisticas_comercial/');
    }
}

export const asignacionesService = new AsignacionesService();
