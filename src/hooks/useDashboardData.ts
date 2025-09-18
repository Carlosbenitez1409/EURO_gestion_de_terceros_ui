import { useState, useEffect, useCallback } from 'react';
import { dashboardDRFService } from '@/services/dashboard.drf.service';
import { tercerosDRFService } from '@/services/terceros.drf.service';
import { useAuth } from '@/context/AuthContext';

interface DashboardData {
  metrics: any;
  recentTerceros: any[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useDashboardData(autoRefresh: boolean = true, refreshInterval: number = 30000) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    metrics: null,
    recentTerceros: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  const loadData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Determinar filtros según el rol del usuario
      let queryParams: any = { page: 1, page_size: 5 };
      
      if (user?.role === 'comercial') {
        // Comerciales ven solo sus terceros asignados
        queryParams.assigned_to = user.id;
      } else if (user?.role === 'procesos') {
        // 🔧 CORREGIDO: Para procesos, usar el estado correcto del sistema de 13 estados
        queryParams.estado_aprobacion = 'asignada_procesos';
      } else if (user?.role === 'administrador') {
        // � ADMINISTRADOR: Ver TODOS los terceros del sistema sin filtros restrictivos
        console.log('👑 ADMINISTRADOR - Cargando TODOS los terceros del sistema');
        queryParams.page_size = 50; // Aumentar tamaño de página para ver más terceros
        // NO aplicar filtros de estado o asignación - el admin ve todo
      } else if (user?.role === 'oficial_cumplimiento') {
        // 🔧 CORREGIDO: Para oficiales de cumplimiento, usar el estado correcto del sistema de 13 estados
        queryParams.estado_aprobacion = 'asignada_oficial_cumplimiento';
      }
      // Para otros roles no se aplica filtro específico

      // Cargar métricas y terceros en paralelo
      const [metricsResponse, tercerosResponse, statsResponse] = await Promise.all([
        dashboardDRFService.getDashboardMetrics().catch(err => {
          console.warn('Error loading dashboard metrics:', err);
          return null;
        }),
        tercerosDRFService.getTerceros(queryParams).catch(err => {
          console.warn('Error loading terceros:', err);
          return { results: [] };
        }),
        tercerosDRFService.getTercerosStats(
          user?.id ? { assigned_to: user.id } : undefined
        ).catch(err => {
          console.warn('Error loading terceros stats:', err);
          return null;
        })
      ]);

      // Usar stats de terceros como fallback si no hay métricas de dashboard
      const finalMetrics = metricsResponse || statsResponse;

      // � FILTRO HABILITADO ESPECÍFICAMENTE PARA ADMINISTRADORES
      // Filtrar terceros que realmente pertenecen al usuario actual basándose en su estado
      const filteredTerceros = (tercerosResponse.results || []).filter((tercero: any) => {
        if (!user) return true;
        
        const estado = tercero.estado_aprobacion;
        const userRole = user.role;
        const userId = user.id;
        
        console.log(`🔍 Evaluando tercero ${tercero.id} - Estado: ${estado}`);
        console.log(`📋 Campos de asignación disponibles:`, {
          asignado_administrador: tercero.asignado_administrador,
          asignado_a_nombre: tercero.asignado_a_nombre,
          asignado_comercial: tercero.asignado_comercial,
          asignado_procesos: tercero.asignado_procesos,
          asignado_a_procesos_nombre: tercero.asignado_a_procesos_nombre
        });
        
        // Lógica de filtrado basada en estado y rol
        switch (userRole) {
          case 'administrador':
            // 👑 ADMINISTRADOR: Ver TODOS los terceros del sistema sin restricciones
            console.log(`� Admin check: tercero=${tercero.id}, estado=${estado} - ADMINISTRADOR VE TODO`);
            return true; // El administrador puede ver absolutamente todos los terceros
            
          case 'comercial':
            // 🔧 COMERCIAL: Solo ve terceros que puede modificar activamente (estados donde puede tomar acción)
            const esAsignadoAComercial = tercero.asignado_comercial === userId;
            const esEstadoAccionable = ['pendiente', 'devuelto_comercial', 'en_curso_comercial', 'en_espera_correccion', 'asignado_comercial'].includes(estado);
            const esParaComercial = esAsignadoAComercial && esEstadoAccionable;
            
            console.log(`💼 Comercial check: tercero=${tercero.id}, estado=${estado}, asignado_comercial=${tercero.asignado_comercial}, userId=${userId}, esAsignado=${esAsignadoAComercial}, esEstadoAccionable=${esEstadoAccionable}, resultado=${esParaComercial}`);
            return esParaComercial;
            
          case 'procesos':
            // 🔧 CORREGIDO: Un usuario de procesos ve los terceros asignados a él
            const esAsignadoAProcesos = tercero.asignado_procesos === userId;
            const esEstadoValidoProcesos = ['asignada_procesos', 'en_curso_procesos', 'devuelto_comercial', 'aprobado'].includes(estado);
            const esParaProcesos = esAsignadoAProcesos && esEstadoValidoProcesos;
            
            console.log(`🔧 Procesos check: tercero=${tercero.id}, estado=${estado}, asignado_procesos=${tercero.asignado_procesos}, userId=${userId}, esAsignado=${esAsignadoAProcesos}, esEstadoValido=${esEstadoValidoProcesos}, resultado=${esParaProcesos}`);
            return esParaProcesos;
            
          case 'oficial_cumplimiento':
            // 🔧 CORREGIDO: Un oficial de cumplimiento ve los terceros asignados a él
            const esAsignadoACumplimiento = tercero.asignado_cumplimiento === userId;
            const esEstadoValidoCumplimiento = ['asignada_oficial_cumplimiento', 'en_curso_cumplimiento', 'devuelto_comercial', 'aprobado', 'rechazado'].includes(estado);
            const esParaCumplimiento = esAsignadoACumplimiento && esEstadoValidoCumplimiento;
            
            console.log(`📊 Cumplimiento check: tercero=${tercero.id}, estado=${estado}, asignado_cumplimiento=${tercero.asignado_cumplimiento}, userId=${userId}, esAsignado=${esAsignadoACumplimiento}, esEstadoValido=${esEstadoValidoCumplimiento}, resultado=${esParaCumplimiento}`);
            return esParaCumplimiento;
            
          case 'gestion_humana':
            // � GESTIÓN HUMANA: Ve terceros asignados a ellos o con estados relacionados con empleados
            const esAsignadoAGestionHumana = tercero.asignado_administrador === userId;
            const esEstadoValidoGestionHumana = ['asignada_administrador', 'en_curso_administrador', 'aprobado', 'rechazado'].includes(estado);
            const esParaGestionHumana = esAsignadoAGestionHumana && esEstadoValidoGestionHumana;
            
            console.log(`� Gestión Humana check: tercero=${tercero.id}, estado=${estado}, asignado_administrador=${tercero.asignado_administrador}, userId=${userId}, esAsignado=${esAsignadoAGestionHumana}, esEstadoValido=${esEstadoValidoGestionHumana}, resultado=${esParaGestionHumana}`);
            return esParaGestionHumana;
            
          default:
            // Para roles no definidos, no mostrar nada por seguridad
            console.log(`❓ Rol desconocido: ${userRole} - No se muestran terceros por seguridad`);
            return false;
        }
      });
      
      console.log(`🔍 Datos recibidos del backend para ${user?.role} (ID: ${user?.id}):`);
      console.log(`📊 Total terceros del backend: ${(tercerosResponse.results || []).length}`);
      console.log(`📋 Terceros:`, tercerosResponse.results);
      console.log(`🔍 Filtrado de terceros para ${user?.role}: ${(tercerosResponse.results || []).length} → ${filteredTerceros.length}`);

      setData({
        metrics: finalMetrics,
        recentTerceros: filteredTerceros,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al cargar datos del dashboard'
      }));
    }
  }, [user]);

  // Carga inicial
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadData]);

  // Listener para refrescar cuando se asigne un tercero
  useEffect(() => {
    const handleTerceroAssigned = (event: CustomEvent) => {
      console.log('🔄 Tercero asignado, refrescando dashboard...');
      
      if (event.detail) {
        const { terceroId, newUserId, previousState, newState } = event.detail;
        console.log(`📋 Tercero ${terceroId} reasignado de usuario actual al usuario ${newUserId} (${previousState} → ${newState})`);
        
        // Si el tercero fue reasignado a otro usuario, actualizar inmediatamente
        if (user && newUserId !== user.id) {
          console.log('🔄 Tercero ya no pertenece al usuario actual, actualizando vista...');
          setData(prevData => ({
            ...prevData,
            recentTerceros: prevData.recentTerceros.filter(t => t.id !== terceroId)
          }));
        }
      }
      
      // Siempre refrescar los datos para obtener la información más actualizada
      setTimeout(() => {
        loadData();
      }, 500); // Pequeño delay para que el backend procese la asignación
    };

    window.addEventListener('terceroAssigned', handleTerceroAssigned as EventListener);
    return () => window.removeEventListener('terceroAssigned', handleTerceroAssigned as EventListener);
  }, [loadData, user]);

  // Función manual de refresh
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    ...data,
    refresh
  };
}

// Hook para notificaciones de actualización
export function useDataUpdateNotifications() {
  const [updateCount, setUpdateCount] = useState(0);
  const [lastUpdateType, setLastUpdateType] = useState<string | null>(null);

  const notifyUpdate = useCallback((type: string) => {
    setUpdateCount(prev => prev + 1);
    setLastUpdateType(type);
    
    // Auto-clear notification after 5 seconds
    setTimeout(() => {
      setLastUpdateType(null);
    }, 5000);
  }, []);

  return {
    updateCount,
    lastUpdateType,
    notifyUpdate
  };
}
