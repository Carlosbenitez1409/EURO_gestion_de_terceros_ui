import apiClient from '@/lib/api.client';

export interface Comercial {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    terceros_asignados: number;
    carga_actual: number;
}

export interface AsignacionRequest {
    comercial_id?: number; // Opcional - si no se envía, usa distribución automática
}

export interface AsignacionResponse {
    success: boolean;
    message: string;
    comercial_asignado: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        email: string;
    };
    terceros_asignados_total: number;
}

export const comercialesService = {
    /**
     * Obtener lista de comerciales disponibles con su carga actual
     */
    async getComerciales(): Promise<Comercial[]> {
        try {

            const response = await apiClient.get('/api/terceros/comerciales_disponibles/');
            console.log('✅ Comerciales obtenidos:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error al obtener comerciales:', error);
            throw error;
        }
    },

    /**
     * Asignar comercial a un tercero (distribución equitativa o específica)
     */
    async asignarComercial(terceroId: string, comercialId?: number): Promise<AsignacionResponse> {
        try {
            const payload: AsignacionRequest = comercialId ? { comercial_id: comercialId } : {};
            console.log(`🎯 Asignando comercial ${comercialId || 'automático'} al tercero ${terceroId}...`);
            const response = await apiClient.post(
                `/terceros/${terceroId}/asignar_comercial_equitativo/`,
                payload
            );
            console.log('✅ Comercial asignado:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error al asignar comercial:', error);
            throw error;
        }
    },

    /**
     * Reasignar comercial de un tercero (distribución equitativa o específica)
     */
    async reasignarComercial(terceroId: string, comercialId?: number): Promise<AsignacionResponse> {
        try {
            const payload: AsignacionRequest = comercialId ? { comercial_id: comercialId } : {};
            console.log(`🔄 Reasignando comercial ${comercialId || 'automático'} al tercero ${terceroId}...`);
            const response = await apiClient.post(
                `/terceros/${terceroId}/reasignar_comercial_equitativo/`,
                payload
            );
            console.log('✅ Comercial reasignado:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error al reasignar comercial:', error);
            throw error;
        }
    },

    /**
     * Asignar o reasignar comercial (método universal)
     */
    async asignarOReasignarComercial(terceroId: string, comercialId?: number): Promise<AsignacionResponse> {
        try {
            const payload: AsignacionRequest = comercialId ? { comercial_id: comercialId } : {};
            console.log(`🔀 Asignar/Reasignar comercial ${comercialId || 'automático'} al tercero ${terceroId}...`);
            const response = await apiClient.post(
                `/terceros/${terceroId}/asignar_o_reasignar_comercial/`,
                payload
            );
            console.log('✅ Comercial asignado/reasignado:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error al asignar/reasignar comercial:', error);
            throw error;
        }
    },

    /**
     * Desasignar comercial de un tercero
     */
    async desasignarComercial(terceroId: string): Promise<{ success: boolean; message: string }> {
        try {
            console.log(`🚫 Desasignando comercial del tercero ${terceroId}...`);
            const response = await apiClient.post(`/terceros/${terceroId}/desasignar_comercial/`);
            console.log('✅ Comercial desasignado:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error al desasignar comercial:', error);
            throw error;
        }
    }
};
