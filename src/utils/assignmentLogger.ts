/**
 * Utilidad para verificar cambios de estado después de asignación
 */
import { tercerosDRFService } from '@/services/terceros.drf.service';

export const verificarCambioEstado = async (terceroId: string, estadoEsperado: string) => {
    try {

        
        // Obtener el tercero actualizado
        const terceroActualizado = await tercerosDRFService.getTercero(terceroId);
        
        
        
        if (terceroActualizado.estado_aprobacion === estadoEsperado) {

            return true;
        } else {

            return false;
        }
        
    } catch (error) {
        console.error('❌ Error verificando estado:', error);
        return false;
    }
};

/**
 * Hook para logging automático de asignaciones
 */
export const useAssignmentLogger = () => {
    const logAssignment = (data: {
        terceroId: string;
        usuarioId: string;
        estadoInicial: string;
        estadoFinal?: string;
        success: boolean;
        error?: any;
    }) => {
        
        
        if (data.success) {
            console.log('🎉 ASIGNACIÓN EXITOSA');
        } else {
            console.log('❌ ASIGNACIÓN FALLÓ');
        }
    };
    
    return { logAssignment };
};
