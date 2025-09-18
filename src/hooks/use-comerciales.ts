import { useState, useEffect, useCallback } from 'react';
import { comercialesService, type Comercial } from '@/services/comerciales.service';
import { useToast } from '@/hooks/use-toast';

interface UseComerciales {
    comerciales: Comercial[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    asignarComercial: (terceroId: string, comercialId?: number) => Promise<boolean>;
    reasignarComercial: (terceroId: string, comercialId?: number) => Promise<boolean>;
    desasignarComercial: (terceroId: string) => Promise<boolean>;
    getComercialMenosCargado: () => Comercial | null;
    getComercialRecomendado: (terceroId?: string) => Comercial | null;
}

export const useComerciales = (): UseComerciales => {
    const { toast } = useToast();
    const [comerciales, setComerciales] = useState<Comercial[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchComerciales = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await comercialesService.getComerciales();
            setComerciales(data);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Error al cargar comerciales';
            setError(errorMessage);
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchComerciales();
    }, [fetchComerciales]);

    const asignarComercial = useCallback(async (terceroId: string, comercialId?: number): Promise<boolean> => {
        try {
            const response = await comercialesService.asignarComercial(terceroId, comercialId);
            
            toast({
                title: "Éxito",
                description: response.message,
            });

            // Refrescar lista de comerciales para actualizar cargas
            await fetchComerciales();
            return true;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Error al asignar comercial';
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMessage,
            });
            return false;
        }
    }, [toast, fetchComerciales]);

    const reasignarComercial = useCallback(async (terceroId: string, comercialId?: number): Promise<boolean> => {
        try {
            const response = await comercialesService.reasignarComercial(terceroId, comercialId);
            
            toast({
                title: "Éxito",
                description: response.message,
            });

            // Refrescar lista de comerciales para actualizar cargas
            await fetchComerciales();
            return true;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Error al reasignar comercial';
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMessage,
            });
            return false;
        }
    }, [toast, fetchComerciales]);

    const desasignarComercial = useCallback(async (terceroId: string): Promise<boolean> => {
        try {
            const response = await comercialesService.desasignarComercial(terceroId);
            
            toast({
                title: "Éxito",
                description: response.message,
            });

            // Refrescar lista de comerciales para actualizar cargas
            await fetchComerciales();
            return true;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Error al desasignar comercial';
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMessage,
            });
            return false;
        }
    }, [toast, fetchComerciales]);

    const getComercialMenosCargado = useCallback((): Comercial | null => {
        if (comerciales.length === 0) return null;
        
        return comerciales.reduce((prev, current) => 
            prev.terceros_asignados < current.terceros_asignados ? prev : current
        );
    }, [comerciales]);

    const getComercialRecomendado = useCallback((terceroId?: string): Comercial | null => {
        // Por ahora, simplemente retorna el comercial con menor carga
        // En el futuro se puede agregar lógica más compleja basada en:
        // - Especialización del comercial
        // - Región del tercero
        // - Tipo de tercero
        // - Historial de asignaciones
        return getComercialMenosCargado();
    }, [getComercialMenosCargado]);

    return {
        comerciales,
        loading,
        error,
        refetch: fetchComerciales,
        asignarComercial,
        reasignarComercial,
        desasignarComercial,
        getComercialMenosCargado,
        getComercialRecomendado,
    };
};

// Hook para estadísticas de comerciales
export const useComercialStats = (comerciales: Comercial[]) => {
    const stats = {
        totalComerciales: comerciales.length,
        totalTerceros: comerciales.reduce((sum, comercial) => sum + comercial.terceros_asignados, 0),
        promedioCarga: comerciales.length > 0 
            ? Math.round(comerciales.reduce((sum, comercial) => sum + comercial.terceros_asignados, 0) / comerciales.length)
            : 0,
        comercialMasCargado: comerciales.length > 0 
            ? comerciales.reduce((prev, current) => prev.terceros_asignados > current.terceros_asignados ? prev : current)
            : null,
        comercialMenosCargado: comerciales.length > 0 
            ? comerciales.reduce((prev, current) => prev.terceros_asignados < current.terceros_asignados ? prev : current)
            : null,
        distribucionCarga: {
            bajo: comerciales.filter(c => c.terceros_asignados <= 5).length,
            medio: comerciales.filter(c => c.terceros_asignados > 5 && c.terceros_asignados <= 10).length,
            alto: comerciales.filter(c => c.terceros_asignados > 10).length,
        }
    };

    return stats;
};
