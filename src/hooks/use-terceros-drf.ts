import { useState, useEffect, useCallback } from 'react';
import { tercerosDRFService, TerceroCreateRequest, TerceroFilters, TerceroDRF } from '@/services/terceros.drf.service';
import { dashboardDRFService } from '@/services/dashboard.drf.service';
import { DashboardMetrics, PaginatedResponse } from '@/types/api.types';
import { toast } from '@/components/ui/use-toast';

// Hook para gestión de terceros con Django DRF
export function useTercerosDRF() {
  const [terceros, setTerceros] = useState<TerceroDRF[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });

  const fetchTerceros = useCallback(async (filters?: TerceroFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await tercerosDRFService.getTerceros(filters);
      
      setTerceros(response.results);
      setPagination({
        current: filters?.page || 1,
        pageSize: filters?.page_size || 10,
        total: response.count,
        totalPages: Math.ceil(response.count / (filters?.page_size || 10))
      });
      
    } catch (err: any) {
      setError(err.message || 'Error al cargar terceros');
      toast({
        title: "Error",
        description: err.message || 'Error al cargar terceros',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const createTercero = useCallback(async (data: TerceroCreateRequest) => {
    try {
      setLoading(true);
      const newTercero = await tercerosDRFService.createTercero(data);
      
      // Agregar al estado local
      setTerceros(prev => [newTercero, ...prev]);
      
      toast({
        title: "Éxito",
        description: `Tercero ${newTercero.id} creado correctamente`,
        variant: "default"
      });
      
      return newTercero;
    } catch (err: any) {
      setError(err.message || 'Error al crear tercero');
      toast({
        title: "Error",
        description: err.message || 'Error al crear tercero',
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveTercero = useCallback(async (id: string, comments?: string) => {
    try {
      setLoading(true);
      const updatedTercero = await tercerosDRFService.approveTercero(id, { comments });
      
      // Actualizar en el estado local
      setTerceros(prev => 
        prev.map(t => t.id === id ? updatedTercero : t)
      );
      
      toast({
        title: "Aprobado",
        description: `Tercero ${updatedTercero.id} aprobado correctamente`,
        variant: "default"
      });
      
      return updatedTercero;
    } catch (err: any) {
      setError(err.message || 'Error al aprobar tercero');
      toast({
        title: "Error",
        description: err.message || 'Error al aprobar tercero',
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectTercero = useCallback(async (id: string, reason: string, comments?: string) => {
    try {
      setLoading(true);
      const updatedTercero = await tercerosDRFService.rejectTercero(id, { reason, comments });
      
      // Actualizar en el estado local
      setTerceros(prev => 
        prev.map(t => t.id === id ? updatedTercero : t)
      );
      
      toast({
        title: "Rechazado",
        description: `Tercero ${updatedTercero.id} rechazado`,
        variant: "default"
      });
      
      return updatedTercero;
    } catch (err: any) {
      setError(err.message || 'Error al rechazar tercero');
      toast({
        title: "Error",
        description: err.message || 'Error al rechazar tercero',
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    terceros,
    loading,
    error,
    pagination,
    fetchTerceros,
    createTercero,
    approveTercero,
    rejectTercero,
    refetch: () => fetchTerceros()
  };
}

// Hook para gestión individual de tercero
export function useTerceroDRF(id?: string) {
  const [tercero, setTercero] = useState<TerceroDRF | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTercero = useCallback(async (terceroId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await tercerosDRFService.getTercero(terceroId);
      setTercero(data);
      
    } catch (err: any) {
      setError(err.message || 'Error al cargar tercero');
      toast({
        title: "Error",
        description: err.message || 'Error al cargar tercero',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchTercero(id);
    }
  }, [id, fetchTercero]);

  return {
    tercero,
    loading,
    error,
    refetch: () => id && fetchTercero(id)
  };
}

// Hook para dashboard con Django DRF
export function useDashboardDRF() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [metricsData, activityData, actionsData] = await Promise.all([
        dashboardDRFService.getDashboardMetrics(),
        dashboardDRFService.getRecentActivity(),
        dashboardDRFService.getPendingActions()
      ]);
      
      setMetrics(metricsData);
      setRecentActivity(activityData);
      setPendingActions(actionsData);
      
    } catch (err: any) {
      setError(err.message || 'Error al cargar dashboard');
      toast({
        title: "Error",
        description: err.message || 'Error al cargar datos del dashboard',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    metrics,
    recentActivity,
    pendingActions,
    loading,
    error,
    refetch: fetchDashboardData
  };
}

// Hook para documentos de tercero
export function useTerceroDocumentsDRF(terceroId?: string) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await tercerosDRFService.getTerceroDocuments(id);
      setDocuments(data);
      
    } catch (err: any) {
      setError(err.message || 'Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (id: string, file: File, documentTypeId: string) => {
    try {
      setLoading(true);
      const newDocument = await tercerosDRFService.uploadDocument(id, file, documentTypeId);
      
      setDocuments(prev => [newDocument, ...prev]);
      
      toast({
        title: "Éxito",
        description: "Documento subido correctamente",
        variant: "default"
      });
      
      return newDocument;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Error al subir documento',
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (terceroId) {
      fetchDocuments(terceroId);
    }
  }, [terceroId, fetchDocuments]);

  return {
    documents,
    loading,
    error,
    uploadDocument,
    refetch: () => terceroId && fetchDocuments(terceroId)
  };
}
