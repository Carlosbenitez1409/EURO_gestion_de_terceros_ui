import { useState, useEffect, useCallback } from 'react';
import { comercialesService } from '@/services/comerciales.service';
import { useToast } from '@/hooks/use-toast';

interface ComercialInfo {
    id: number;
    first_name: string;
    last_name: string;
}

interface TerceroAsignacion {
    terceroId: string;
    comercial: ComercialInfo | null;
    loading: boolean;
    error: string | null;
}

interface UseTerceroAssignment {
    asignacion: TerceroAsignacion;
    asignar: (comercialId?: number) => Promise<boolean>;
    reasignar: (comercialId?: number) => Promise<boolean>;
    desasignar: () => Promise<boolean>;
    refetch: () => Promise<void>;
}

export const useTerceroAssignment = (terceroId: string): UseTerceroAssignment => {
    const { toast } = useToast();
    const [asignacion, setAsignacion] = useState<TerceroAsignacion>({
        terceroId,
        comercial: null,
        loading: true,
        error: null
    });

    const fetchAsignacion = useCallback(async () => {
        setAsignacion(prev => ({ ...prev, loading: true, error: null }));
        try {
            // Aquí iría la llamada para obtener la asignación actual del tercero
            // Por ahora simulamos con datos de prueba
            // const response = await terceroService.getComercialAsignado(terceroId);
            
            // Simulación temporal
            setAsignacion(prev => ({ 
                ...prev, 
                comercial: null, // Se establecería desde la respuesta del backend
                loading: false 
            }));
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Error al obtener asignación';
            setAsignacion(prev => ({ 
                ...prev, 
                error: errorMessage,
                loading: false 
            }));
        }
    }, [terceroId]);

    useEffect(() => {
        if (terceroId) {
            fetchAsignacion();
        }
    }, [terceroId, fetchAsignacion]);

    const asignar = useCallback(async (comercialId?: number): Promise<boolean> => {
        try {
            const response = await comercialesService.asignarComercial(terceroId, comercialId);
            
            toast({
                title: "Éxito",
                description: response.message,
            });

            // Actualizar estado local con la nueva asignación
            // Esto se haría con los datos reales del backend
            await fetchAsignacion();
            return true;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Error al asignar comercial';
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMessage,
            });
            return false;
        }
    }, [terceroId, toast, fetchAsignacion]);

    const reasignar = useCallback(async (comercialId?: number): Promise<boolean> => {
        try {
            const response = await comercialesService.reasignarComercial(terceroId, comercialId);
            
            toast({
                title: "Éxito",
                description: response.message,
            });

            await fetchAsignacion();
            return true;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Error al reasignar comercial';
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMessage,
            });
            return false;
        }
    }, [terceroId, toast, fetchAsignacion]);

    const desasignar = useCallback(async (): Promise<boolean> => {
        try {
            const response = await comercialesService.desasignarComercial(terceroId);
            
            toast({
                title: "Éxito",
                description: response.message,
            });

            await fetchAsignacion();
            return true;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Error al desasignar comercial';
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMessage,
            });
            return false;
        }
    }, [terceroId, toast, fetchAsignacion]);

    return {
        asignacion,
        asignar,
        reasignar,
        desasignar,
        refetch: fetchAsignacion
    };
};

// Hook para validar permisos de asignación comercial
export const useComercialAssignmentPermissions = (userRole?: string) => {
    const permissions = {
        canAssign: userRole === 'procesos' || userRole === 'admin',
        canReassign: userRole === 'procesos' || userRole === 'admin',
        canUnassign: userRole === 'procesos' || userRole === 'admin',
        canViewStats: userRole === 'procesos' || userRole === 'admin' || userRole === 'comercial',
        canBulkAssign: userRole === 'procesos' || userRole === 'admin',
        canManageComerciales: userRole === 'admin'
    };

    return permissions;
};
