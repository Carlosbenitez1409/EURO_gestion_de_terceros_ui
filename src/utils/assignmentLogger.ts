/**
 * Utilidad para verificar cambios de estado después de asignación
 */
import { tercerosDRFService } from '@/services/terceros.drf.service';

export const verificarCambioEstado = async (terceroId: string, estadoEsperado: string) => {
    try {
        console.log('🔍 Verificando estado actual del tercero:', terceroId);
        
        // Obtener el tercero actualizado
        const terceroActualizado = await tercerosDRFService.getTercero(terceroId);
        
        console.log('📊 Estado verificado:', {
            terceroId,
            estadoActual: terceroActualizado.estado_aprobacion,
            estadoEsperado,
            cambioExitoso: terceroActualizado.estado_aprobacion === estadoEsperado,
            terceroCompleto: terceroActualizado
        });
        
        if (terceroActualizado.estado_aprobacion === estadoEsperado) {
            console.log('✅ Estado cambió correctamente a:', estadoEsperado);
            return true;
        } else {
            console.log('⚠️ Estado no cambió. Actual:', terceroActualizado.estado_aprobacion, 'Esperado:', estadoEsperado);
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
        console.log('📋 RESUMEN DE ASIGNACIÓN:', {
            timestamp: new Date().toISOString(),
            ...data
        });
        
        if (data.success) {
            console.log('🎉 ASIGNACIÓN EXITOSA');
        } else {
            console.log('❌ ASIGNACIÓN FALLÓ');
        }
    };
    
    return { logAssignment };
};
