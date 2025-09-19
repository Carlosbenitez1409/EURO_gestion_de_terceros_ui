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
    
    // NUEVO: Estados para pantalla de carga
    const [mostrarPantallaCarga, setMostrarPantallaCarga] = useState(false);
    const [tiempoInicioConsulta, setTiempoInicioConsulta] = useState<Date | null>(null);
    const [consultaCompleta, setConsultaCompleta] = useState(false);

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
        setMostrarPantallaCarga(true); // Mostrar pantalla de carga
        setTiempoInicioConsulta(new Date()); // Registrar tiempo de inicio
        setConsultaCompleta(false); // Resetear estado de completado
        
        try {
            console.log(`🔍 Ejecutando consulta Stradata integrada para tercero: ${terceroId}`);
            
            const resultado = await stradataService.consultarTerceroStradata(terceroId, credenciales);
            setResultadoConsulta(resultado);
            
            // Verificar éxito basándose en la presencia de personas_consultadas
            const esExitoso = resultado.success === true || (resultado.personas_consultadas !== undefined && resultado.personas_consultadas >= 0);
            
            console.log(`🔍 Debug - Resultado consulta:`, {
                success: resultado.success,
                personas_consultadas: resultado.personas_consultadas,
                esExitoso
            });
            
            if (esExitoso) {
                console.log('✅ Mostrando toast de éxito');
                setConsultaCompleta(true); // Marcar como completada
                
                toast({
                    title: "✅ Consulta enviada exitosamente",
                    description: `Se ejecutó la consulta para ${resultado.personas_consultadas || 0} persona${resultado.personas_consultadas !== 1 ? 's' : ''}. Revise su correo electrónico para ver los resultados.`,
                    variant: "default",
                    duration: 10000 // Mostrar por más tiempo para que lean bien el mensaje
                });
                
                // Esperar un momento para mostrar progreso completo antes de cerrar
                setTimeout(() => {
                    setModalConsultaAbierto(false);
                }, 2000); // 2 segundos para ver el progreso al 100%
            } else {
                console.log('❌ Mostrando toast de error');
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
            
            // Manejar diferentes tipos de errores
            let errorMessage = "No se pudo conectar con Stradata";
            if (error instanceof Error) {
                if (error.message.includes('timeout')) {
                    errorMessage = "La consulta está tardando más de lo esperado. Se ejecutará en background y recibirás los resultados por correo.";
                } else {
                    errorMessage = error.message;
                }
            }
            
            toast({
                title: "❌ Error de conexión",
                description: errorMessage,
                variant: "destructive",
                duration: 10000
            });
            return null;
        } finally {
            setConsultandoStradata(false);
            // No ocultar pantalla de carga aquí, se hace con el timeout para mostrar progreso completo
            setTimeout(() => {
                setMostrarPantallaCarga(false);
                setTiempoInicioConsulta(null);
                setConsultaCompleta(false);
            }, 2500); // Un poco más que el timeout anterior
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
        setMostrarPantallaCarga(false);
        setTiempoInicioConsulta(null);
        setConsultaCompleta(false);
    }, []);

    return {
        // Estados
        resumenPersonas,
        loadingResumen,
        consultandoStradata,
        resultadoConsulta,
        modalConsultaAbierto,
        
        // NUEVOS: Estados para pantalla de carga
        mostrarPantallaCarga,
        tiempoInicioConsulta,
        consultaCompleta,
        
        // Acciones
        obtenerResumenPersonas,
        ejecutarConsultaIntegrada,
        iniciarConsultaCompleta,
        reiniciarEstados,
        
        // Control de modal
        abrirModalConsulta: () => setModalConsultaAbierto(true),
        cerrarModalConsulta: () => setModalConsultaAbierto(false),
        
        // NUEVO: Control de pantalla de carga
        cerrarPantallaCarga: () => {
            setMostrarPantallaCarga(false);
            setTiempoInicioConsulta(null);
            setConsultaCompleta(false);
        },
        
        // Datos computados
        totalPersonasConsultar: resumenPersonas?.resumen?.total_personas_consultar || 0,
        terceroNombre: resumenPersonas?.resumen?.tercero?.nombre_completo || '',
        
        // Estados de carga
        cargando: loadingResumen || consultandoStradata
    };
};

export default useStratadaIntegration;