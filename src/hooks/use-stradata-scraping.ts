import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import StratadaService, { 
    DocumentosStratadaResponse, 
    GrupoDocumentosStradata,
    stradataService
} from '@/services/stradata.service';

interface UseStratadaScrapingProps {
    terceroId?: string;
    userRole?: string;
}

export const useStratadaScraping = ({ terceroId, userRole }: UseStratadaScrapingProps) => {
    const { toast } = useToast();
    
    // Estados
    const [scrapingLoading, setScrapingLoading] = useState(false);
    const [documentosStradata, setDocumentosStradata] = useState<GrupoDocumentosStradata[]>([]);
    const [loadingDocumentos, setLoadingDocumentos] = useState(false);
    const [ultimaConsulta, setUltimaConsulta] = useState<Date | null>(null);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);

    // Validaciones
    const puedeEjecutarScraping = useCallback(() => {
        return !!terceroId && StratadaService.validarPermisosScraping(userRole);
    }, [terceroId, userRole]);

    // 🔍 FUNCIÓN ACTUALIZADA - Abre modal de credenciales
    const ejecutarScraping = useCallback(async () => {
        if (!puedeEjecutarScraping()) {
            toast({
                title: "Sin permisos",
                description: "No tienes permisos para ejecutar consultas de Stradata",
                variant: "destructive"
            });
            return false;
        }

        // Abrir modal de credenciales
        setShowCredentialsModal(true);
        return true;
    }, [puedeEjecutarScraping, toast]);

    // Cargar documentos de Stradata
    const cargarDocumentos = useCallback(async () => {
        if (!terceroId) {
            console.log('🚨 No hay terceroId para cargar documentos');
            return;
        }

        setLoadingDocumentos(true);

        try {
            console.log('📂 Cargando documentos de Stradata para tercero:', terceroId);

            const respuesta = await StratadaService.obtenerDocumentosStradata(terceroId);
            
            console.log('✅ Documentos Stradata cargados:', respuesta);
            console.log('📊 Estructura de documentos:', JSON.stringify(respuesta, null, 2));
            
            // Validar estructura de la respuesta
            if (respuesta && Array.isArray(respuesta.documentos)) {
                setDocumentosStradata(respuesta.documentos);
                console.log(`📈 Se cargaron ${respuesta.documentos.length} grupos de documentos`);
                
                // Log detallado de cada grupo
                respuesta.documentos.forEach((grupo, index) => {
                    console.log(`📋 Grupo ${index + 1}: ${grupo.tipo_persona} - ${grupo.archivos?.length || 0} archivos`);
                });
            } else {
                console.log('⚠️ La respuesta no tiene la estructura esperada:', respuesta);
                setDocumentosStradata([]);
            }
            
        } catch (error) {
            console.error('🚨 Error cargando documentos Stradata:', error);
            setDocumentosStradata([]);
        } finally {
            setLoadingDocumentos(false);
        }
    }, [terceroId]);

    // Obtener estadísticas de documentos
    const estadisticasDocumentos = useCallback(() => {
        const totalDocumentos = documentosStradata.reduce(
            (total, grupo) => total + (grupo.archivos?.length || 0), 
            0
        );
        
        const tiposPersona = documentosStradata.length;
        
        return {
            totalDocumentos,
            tiposPersona,
            hayDocumentos: totalDocumentos > 0
        };
    }, [documentosStradata]);

    // Obtener información formateada de un tipo de persona
    const obtenerInfoTipoPersona = useCallback((tipo: string) => {
        return StratadaService.formatearTipoPersona(tipo);
    }, []);

    // Construir URL de descarga
    const construirUrlDescarga = useCallback((archivo: any) => {
        return StratadaService.construirUrlDescarga(archivo);
    }, []);

    // Descargar documento de forma segura
    const descargarDocumentoStradata = useCallback(async (archivo: any) => {
        try {
            await StratadaService.descargarDocumentoStradata(archivo);
            toast({
                title: "Descarga iniciada",
                description: `Descargando ${archivo.nombre}`,
                variant: "info"
            });
        } catch (error) {
            console.error('🚨 Error descargando documento Stradata:', error);
            toast({
                title: "Error en descarga",
                description: error instanceof Error ? error.message : "No se pudo descargar el documento",
                variant: "destructive"
            });
        }
    }, [toast]);

    return {
        // Estados
        scrapingLoading,
        documentosStradata,
        loadingDocumentos,
        ultimaConsulta,
        
        // Funciones
        ejecutarScraping,
        cargarDocumentos,
        
        // Utilidades
        puedeEjecutarScraping,
        estadisticasDocumentos,
        obtenerInfoTipoPersona,
        construirUrlDescarga,
        descargarDocumentoStradata,
        
        // Helpers
        hayDocumentos: estadisticasDocumentos().hayDocumentos,
        totalDocumentos: estadisticasDocumentos().totalDocumentos,
        validarPermisos: () => StratadaService.validarPermisosScraping(userRole),
        
        // 🆕 Modal de credenciales
        showCredentialsModal,
        cerrarModalCredenciales: () => setShowCredentialsModal(false)
    };
};

export default useStratadaScraping;
