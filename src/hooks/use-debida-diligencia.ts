import { useState, useCallback, useEffect } from 'react';
import { debidaDiligenciaService, DebidaDiligenciaDocumento, DebidaDiligenciaUploadRequest } from '@/services/debida-diligencia.service';
import { useToast } from '@/hooks/use-toast';

interface UseDebidaDiligenciaState {
    documentos: DebidaDiligenciaDocumento[];
    loading: boolean;
    uploading: boolean;
    error: string | null;
}

interface UseDebidaDiligenciaActions {
    cargarDocumentos: () => Promise<void>;
    subirDocumento: (data: DebidaDiligenciaUploadRequest) => Promise<DebidaDiligenciaDocumento | null>;
    descargarDocumento: (documentoId: string, nombreDocumento: string) => Promise<void>;
    eliminarDocumento: (documentoId: string) => Promise<void>;
    refrescarLista: () => Promise<void>;
}

interface UseDebidaDiligenciaReturn extends UseDebidaDiligenciaState, UseDebidaDiligenciaActions {}

export const useDebidaDiligencia = (terceroId: string): UseDebidaDiligenciaReturn => {
    const [state, setState] = useState<UseDebidaDiligenciaState>({
        documentos: [],
        loading: false,
        uploading: false,
        error: null,
    });

    const { toast } = useToast();

    // Cargar documentos desde el servidor
    const cargarDocumentos = useCallback(async () => {
        if (!terceroId) {
            console.log('⚠️ Debug - No hay terceroId, no se cargan documentos');
            return;
        }

        console.log('🔍 Debug - Cargando documentos para tercero:', terceroId);
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        try {
            const documentos = await debidaDiligenciaService.obtenerDocumentos(terceroId);
            console.log('✅ Debug - Documentos cargados:', documentos?.length || 0);
            setState(prev => ({
                ...prev,
                documentos,
                loading: false,
            }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            setState(prev => ({
                ...prev,
                loading: false,
                error: errorMessage,
            }));
            
            toast({
                title: "Error al cargar documentos",
                description: "No se pudieron cargar los documentos de debida diligencia",
                variant: "destructive",
            });
        }
    }, [terceroId, toast]);

    // Subir nuevo documento
    const subirDocumento = useCallback(async (
        data: DebidaDiligenciaUploadRequest
    ): Promise<DebidaDiligenciaDocumento | null> => {
        console.log('📤 Hook - INICIANDO SUBIDA DE DOCUMENTO');
        console.log('📤 Hook - Datos a subir:', data);
        
        setState(prev => ({ ...prev, uploading: true, error: null }));

        try {
            const respuestaSubida = await debidaDiligenciaService.subirDocumento(data);
            console.log('📤 Hook - Respuesta de subida recibida:', respuestaSubida);
            
            // Extraer el documento real de la respuesta del servidor
            const documentoReal = (respuestaSubida as any).documento || respuestaSubida;
            console.log('📤 Hook - Documento extraído:', documentoReal);
            
            // Verificar que el documento tiene los campos requeridos
            if (!documentoReal || !documentoReal.id) {
                console.error('📤 Hook - Documento inválido recibido:', documentoReal);
                throw new Error('Respuesta del servidor no contiene un documento válido');
            }
            
            // Actualizar la lista local agregando solo el documento válido
            setState(prev => {
                const nuevaLista = [...prev.documentos, documentoReal];
                console.log('📤 Hook - Nueva lista de documentos:', nuevaLista);
                console.log('📤 Hook - Documento agregado tiene ID:', documentoReal.id);
                return {
                    ...prev,
                    documentos: nuevaLista,
                    uploading: false,
                };
            });

            toast({
                title: "Documento subido exitosamente",
                description: `El documento "${documentoReal.nombre || documentoReal.nombre_documento || 'documento'}" ha sido subido`,
                variant: "default",
            });

            return documentoReal;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            console.error('📤 Hook - Error en subida:', error);
            setState(prev => ({
                ...prev,
                uploading: false,
                error: errorMessage,
            }));

            toast({
                title: "Error al subir documento",
                description: "No se pudo subir el documento. Intente nuevamente.",
                variant: "destructive",
            });

            return null;
        }
    }, [toast]);

    // Descargar documento
    const descargarDocumento = useCallback(async (
        documentoId: string, 
        nombreDocumento: string
    ): Promise<void> => {
        console.log('⬇️ Hook - INICIANDO DESCARGA');
        console.log('⬇️ Hook - Documento ID:', documentoId);
        console.log('⬇️ Hook - Tipo de ID:', typeof documentoId);
        console.log('⬇️ Hook - Nombre documento:', nombreDocumento);
        
        // Validación en el hook antes de llamar al servicio (ahora string UUID)
        if (!documentoId || documentoId === undefined || documentoId === null || documentoId === 'undefined' || documentoId === 'null' || documentoId.trim() === '') {
            const errorMsg = `❌ Hook - ID de documento no válido para descarga: ${documentoId} (tipo: ${typeof documentoId})`;
            console.error(errorMsg);
            toast({
                title: "Error de validación",
                description: "ID de documento no válido para descarga",
                variant: "destructive",
            });
            return;
        }
        
        try {
            // No pasamos tercero_id - las URLs del backend no lo requieren según documentación
            await debidaDiligenciaService.descargarDocumento(documentoId);
            console.log('⬇️ Hook - Descarga completada exitosamente');
            
            toast({
                title: "Descarga iniciada",
                description: `Descargando "${nombreDocumento}"`,
                variant: "default",
            });
        } catch (error) {
            console.error('⬇️ Hook - Error en descarga:', error);
            toast({
                title: "Error al descargar",
                description: "No se pudo descargar el documento. Intente nuevamente.",
                variant: "destructive",
            });
        }
    }, [toast]);

    // Eliminar documento
    const eliminarDocumento = useCallback(async (documentoId: string): Promise<void> => {
        console.log('🗑️ Hook - INICIANDO ELIMINACIÓN');
        console.log('🗑️ Hook - Documento ID:', documentoId);
        console.log('🗑️ Hook - Tipo de ID:', typeof documentoId);
        
        // Validación en el hook antes de llamar al servicio (ahora string UUID)
        if (!documentoId || documentoId === undefined || documentoId === null || documentoId === 'undefined' || documentoId === 'null' || documentoId.trim() === '') {
            const errorMsg = `❌ Hook - ID de documento no válido: ${documentoId} (tipo: ${typeof documentoId})`;
            console.error(errorMsg);
            toast({
                title: "Error de validación",
                description: "ID de documento no válido para eliminación",
                variant: "destructive",
            });
            return;
        }
        
        try {
            // No pasamos tercero_id - las URLs del backend no lo requieren según documentación
            await debidaDiligenciaService.eliminarDocumento(documentoId);
            console.log('🗑️ Hook - Eliminación completada exitosamente');
            
            // Actualizar la lista local removiendo el documento eliminado
            setState(prev => {
                const nuevaLista = prev.documentos.filter(doc => doc.id !== documentoId);
                console.log('🗑️ Hook - Lista después de eliminar:', nuevaLista);
                return {
                    ...prev,
                    documentos: nuevaLista,
                };
            });

            toast({
                title: "Documento eliminado",
                description: "El documento ha sido eliminado exitosamente",
                variant: "default",
            });
        } catch (error) {
            console.error('🗑️ Hook - Error en eliminación:', error);
            toast({
                title: "Error al eliminar",
                description: "No se pudo eliminar el documento. Intente nuevamente.",
                variant: "destructive",
            });
        }
    }, [toast]);

    // Refrescar lista (alias para cargarDocumentos)
    const refrescarLista = useCallback(async (): Promise<void> => {
        await cargarDocumentos();
    }, [cargarDocumentos]);

    // Cargar documentos automáticamente cuando el terceroId cambia
    // Efecto para cargar documentos cuando cambia el tercero
    useEffect(() => {
        if (terceroId) {
            console.log('📋 Debug - useEffect disparado, cargando documentos para tercero:', terceroId);
            // Limpiar documentos anteriores inmediatamente
            setState(prev => ({ ...prev, documentos: [], loading: true }));
            cargarDocumentos();
        } else {
            console.log('📋 Debug - No hay terceroId, limpiando documentos');
            setState(prev => ({ ...prev, documentos: [] }));
        }
    }, [terceroId, cargarDocumentos]);

    return {
        // Estado
        documentos: state.documentos,
        loading: state.loading,
        uploading: state.uploading,
        error: state.error,
        
        // Acciones
        cargarDocumentos,
        subirDocumento,
        descargarDocumento,
        eliminarDocumento,
        refrescarLista,
    };
};
