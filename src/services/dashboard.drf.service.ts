import { apiRequest } from '@/lib/api.client';
import { DashboardMetrics } from '@/types/api.types';

export interface RecentActivity {
  id: string;
  external_id: string;
  name: string;
  type: 'Proveedor' | 'Empleado';
  status: string;
  updated_at: string;
  assigned_to?: string;
}

export interface PendingAction {
  id: string;
  external_id: string;
  name: string;
  type: 'Proveedor' | 'Empleado';
  status: string;
  priority: string;
  action_required: string;
  created_at: string;
  days_pending: number;
}

export interface ChartData {
  statusDistribution: Array<{
    status: string;
    label: string;
    count: number;
  }>;
  temporalTrend: Array<{
    date: string;
    count: number;
  }>;
  categoryDistribution: Array<{
    category: string;
    count: number;
  }>;
}

class DashboardDRFService {
  
  /**
   * Obtener métricas del dashboard según el rol del usuario
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await apiRequest.get<DashboardMetrics>('/dashboard/metricas/');
    return response;
  }

  /**
   * Obtener dashboard principal
   */
  async getDashboardMain(): Promise<any> {
    const response = await apiRequest.get<any>('/api/dashboard/main/');
    return response;
  }

  /**
   * Obtener actividad reciente
   */
  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    const response = await apiRequest.get<RecentActivity[]>(
      `/api/dashboard/recent-activity/?limit=${limit}`
    );
    return response;
  }

  /**
   * Obtener acciones pendientes para el usuario actual
   */
  async getPendingActions(): Promise<PendingAction[]> {
    const response = await apiRequest.get<PendingAction[]>('/api/dashboard/pending-actions/');
    return response;
  }

  /**
   * Obtener datos para gráficos del dashboard
   */
  async getChartsData(): Promise<ChartData> {
    const response = await apiRequest.get<ChartData>('/api/dashboard/charts-data/');
    return response;
  }

  /**
   * Obtener resumen de notificaciones
   */
  async getNotificationsSummary(): Promise<{
    unread: number;
    urgent: number;
    types: Record<string, number>;
  }> {
    const response = await apiRequest.get('/api/dashboard/notifications-summary/');
    return response;
  }

  /**
   * Obtener datos del usuario actual para el dashboard
   */
  async getUserDashboardData(): Promise<{
    user: any;
    metrics: DashboardMetrics;
    recentActivity: RecentActivity[];
    pendingActions: PendingAction[];
  }> {
    const response = await apiRequest.get('/api/dashboard/user-data/');
    return response;
  }

  /**
   * Marcar notificación como leída
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    await apiRequest.post(`/api/dashboard/notifications/${notificationId}/read/`);
  }

  /**
   * Obtener alertas del sistema
   */
  async getSystemAlerts(): Promise<Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    created_at: string;
    is_dismissible: boolean;
  }>> {
    const response = await apiRequest.get('/api/dashboard/alerts/');
    return response;
  }

  /**
   * Descartar alerta del sistema
   */
  async dismissAlert(alertId: string): Promise<void> {
    await apiRequest.post(`/api/dashboard/alerts/${alertId}/dismiss/`);
  }
}

export const dashboardDRFService = new DashboardDRFService();
export default dashboardDRFService;
