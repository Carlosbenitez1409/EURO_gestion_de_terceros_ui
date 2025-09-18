import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
    StratadaService,
    ResumenPersonasTerceroResponse,
    ConsultarTerceroStradataRequest,
    ConsultarTerceroStradataResponse
} from '@/services/stradata.service';

interface UseStratadaIntegrationProps {
    terceroId: string;
}

export const useStratadaIntegration = ({ terceroId }: UseStratadaIntegrationProps) => {
    const { toast } = useToast();
    const stradataService = new StratadaService();
    
    // Estados para resumen de personas
    const [resumenPersonas, setResumenPersonas] = useState<ResumenPersonasTerceroResponse | null>(null);
    const [loadingResumen, setLoadingResumen] = useState(false);
    
    // Estados para consulta integrada
    const [consultandoStradata, setConsultandoStradata] = useState(false);
    const [resultadoConsulta, setResultadoConsulta] = useState<ConsultarTerceroStradataResponse | null>(null);
    
    // Estados para modal
    const [modalConsultaAbierto, setModalConsultaAbierto] = useState(false);

    /**
     * 📋 Obtiene el resumen de personas asociadas al tercero
     */
    const obtenerResumenPersonas = useCallback(async (): Promise<ResumenPersonasTerceroResponse | null> => {
        if (!terceroId) {
            console.error('No hay terceroId para obtener resumen');
            return null;
        }

        setLoadingResumen(true);
        try {
            console.log(`📋 Obteniendo resumen de personas para tercero: ${terceroId}`);
            
            const resumen = await stradataService.obtenerResumenPersonasTercero(terceroId);
            setResumenPersonas(resumen);
            
            console.log('✅ Resumen obtenido:', resumen);
            return resumen;
        } catch (error) {
            console.error('❌ Error obteniendo resumen:', error);
            toast({
                title: "❌ Error obteniendo resumen",
                description: error instanceof Error ? error.message : "No se pudo obtener el resumen de personas",
                variant: "destructive"
            });
            return null;
        } finally {
            setLoadingResumen(false);
        }
    }, [terceroId, stradataService, toast]);

    /**
     * 🔍 Ejecuta consulta Stradata integrada con credenciales
     */
    const ejecutarConsultaIntegrada = useCallback(async (
        credenciales: ConsultarTerceroStradataRequest
    ): Promise<ConsultarTerceroStradataResponse | null> => {
        if (!terceroId) {
            console.error('No hay terceroId para ejecutar consulta');
            return null;
        }

        setConsultandoStradata(true);
        try {
            console.log(`🔍 Ejecutando consulta Stradata integrada para tercero: ${terceroId}`);
            
            const resultado = await stradataService.consultarTerceroStradata(terceroId, credenciales);
            setResultadoConsulta(resultado);
            
            if (resultado.success) {
                toast({
                    title: "✅ Consulta exitosa",
                    description: `Se consultaron ${resultado.personas_consultadas || 0} personas exitosamente`,
                    variant: "success"
                });
                
                // Cerrar modal después de consulta exitosa
                setModalConsultaAbierto(false);
            } else {
                toast({
                    title: "❌ Error en consulta",
                    description: resultado.error || "No se pudo realizar la consulta",
                    variant: "destructive"
                });
            }
            
            console.log('✅ Consulta completada:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ Error en consulta integrada:', error);
            toast({
                title: "❌ Error de conexión",
                description: error instanceof Error ? error.message : "No se pudo conectar con Stradata",
                variant: "destructive"
            });
            return null;
        } finally {
            setConsultandoStradata(false);
        }
    }, [terceroId, stradataService, toast]);

    /**
     * 🚀 Inicia el flujo completo de consulta (resumen + modal)
     */
    const iniciarConsultaCompleta = useCallback(async () => {
        // Primero obtener el resumen
        const resumen = await obtenerResumenPersonas();
        if (resumen && resumen.success) {
            // Abrir modal para credenciales
            setModalConsultaAbierto(true);
        }
    }, [obtenerResumenPersonas]);

    /**
     * 🔄 Reinicia todos los estados
     */
    const reiniciarEstados = useCallback(() => {
        setResumenPersonas(null);
        setResultadoConsulta(null);
        setModalConsultaAbierto(false);
    }, []);

    return {
        // Estados
        resumenPersonas,
        loadingResumen,
        consultandoStradata,
        resultadoConsulta,
        modalConsultaAbierto,
        
        // Acciones
        obtenerResumenPersonas,
        ejecutarConsultaIntegrada,
        iniciarConsultaCompleta,
        reiniciarEstados,
        
        // Control de modal
        abrirModalConsulta: () => setModalConsultaAbierto(true),
        cerrarModalConsulta: () => setModalConsultaAbierto(false),
        
        // Datos computados
        totalPersonasConsultar: resumenPersonas?.resumen?.total_personas_consultar || 0,
        terceroNombre: resumenPersonas?.resumen?.tercero?.nombre_completo || '',
        
        // Estados de carga
        cargando: loadingResumen || consultandoStradata
    };
};

export default useStratadaIntegration;