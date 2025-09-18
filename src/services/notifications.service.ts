import { apiClient } from '@/lib/api.client';

export interface Notification {
  id: string;
  tipo: "solicitud" | "aprobacion" | "rechazo" | "registro" | "asignacion" | "actualizacion";
  titulo: string;
  descripcion: string;
  tiempo_relativo: string;
  leida: boolean;
  prioridad: "alta" | "media" | "baja";
  fecha_creacion: string;
  datos_adicionales?: Record<string, any>;
}

export interface NotificationCounter {
  no_leidas: number;
  total: number;
}

export interface NotificationSummary {
  total: number;
  no_leidas: number;
  por_prioridad: {
    alta: number;
    media: number;
    baja: number;
  };
  por_tipo: Record<string, number>;
}

class NotificationsService {
  private baseUrl = '/notifications';

  /**
   * Obtener contador de notificaciones para el badge
   */
  async getCounter(): Promise<NotificationCounter> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/contador/`);
      
      // Estructura de respuesta segura
      const counter: NotificationCounter = {
        no_leidas: response.data?.total_no_leidas || response.data?.no_leidas || response.data?.unread || response.data?.unread_count || 0,
        total: response.data?.total_sistema || response.data?.total || response.data?.total_count || 0
      };
      
      return counter;
    } catch (error) {
      console.error('❌ Error al obtener contador de notificaciones:', error);
      return { no_leidas: 0, total: 0 };
    }
  }

  /**
   * Obtener notificaciones recientes para el dropdown
   */
  async getRecent(limit: number = 10): Promise<Notification[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/recientes/`, {
        params: { limit }
      });
      
      // Manejar diferentes estructuras de respuesta del backend
      let notifications: Notification[] = [];
      
      if (Array.isArray(response.data)) {
        // Si la respuesta es directamente un array
        notifications = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        // Si la respuesta tiene estructura paginada
        notifications = response.data.results;
      } else if (response.data?.notificaciones && Array.isArray(response.data.notificaciones)) {
        // Si la respuesta tiene campo 'notificaciones'
        notifications = response.data.notificaciones.map((notif: any) => ({
          ...notif,
          descripcion: notif.descripcion || notif.mensaje || notif.description || '',
          tiempo_relativo: notif.tiempo_relativo || notif.time_relative || 'Reciente',
          leida: notif.leida || notif.read || false
        }));
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Si la respuesta tiene campo 'data'
        notifications = response.data.data;
      } else {
        // Si el backend responde con éxito pero estructura vacía/incorrecta, usar array vacío
        if (response.status === 200) {
          notifications = [];
        } else {
          // Si hay error, usar notificaciones de fallback para demostración
          notifications = this.getFallbackNotifications();
        }
      }
      
      return notifications;
    } catch (error) {
      console.error('❌ Error al obtener notificaciones recientes:', error);
      
      // En caso de error de red, devolver notificaciones de ejemplo para no romper la UI
      return this.getFallbackNotifications();
    }
  }

  /**
   * Notificaciones de fallback para cuando el backend no está disponible
   */
  private getFallbackNotifications(): Notification[] {
    return [
      {
        id: "demo-1",
        tipo: "solicitud",
        titulo: "Demo: Nueva solicitud",
        descripcion: "Esta es una notificación de demostración",
        tiempo_relativo: "hace 5 minutos",
        leida: false,
        prioridad: "alta",
        fecha_creacion: new Date().toISOString(),
        datos_adicionales: {
          numero_documento: "12345678",
          tipo_persona: "natural"
        }
      },
      {
        id: "demo-2",
        tipo: "aprobacion",
        titulo: "Demo: Aprobación pendiente",
        descripcion: "Documento pendiente de revisión",
        tiempo_relativo: "hace 15 minutos",
        leida: true,
        prioridad: "media",
        fecha_creacion: new Date().toISOString()
      }
    ];
  }

  /**
   * Obtener notificaciones en tiempo real (para polling)
   */
  async getRealTime(): Promise<Notification[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/tiempo-real/`);
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error al obtener notificaciones en tiempo real:', error);
      return [];
    }
  }

  /**
   * Marcar notificaciones como leídas
   */
  async markAsRead(notificationIds: string[]): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/notificaciones/marcar_leidas/`, {
        notificaciones: notificationIds
      });
      return response.data;
    } catch (error) {
      console.error('Error al marcar notificaciones como leídas:', error);
      throw error;
    }
  }

  /**
   * Marcar una notificación específica como leída
   */
  async markSingleAsRead(notificationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/notificaciones/${notificationId}/marcar_leida/`);
      return response.data;
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      throw error;
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(): Promise<{ success: boolean; message: string; count: number }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/notificaciones/marcar_todas_leidas/`);
      return response.data;
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      throw error;
    }
  }

  /**
   * Limpiar todas las notificaciones del usuario
   */
  async clearAllNotifications(): Promise<{ success: boolean; message: string; count: number }> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/clear-all/`);
      return response.data;
    } catch (error) {
      console.error('Error al limpiar todas las notificaciones:', error);
      throw error;
    }
  }

  /**
   * Eliminar una notificación específica
   */
  async deleteNotification(notificationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/delete/${notificationId}/`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      throw error;
    }
  }

  /**
   * Eliminar múltiples notificaciones
   */
  async deleteMultipleNotifications(notificationIds: string[]): Promise<{ success: boolean; message: string; count: number }> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/delete-multiple/`, {
        data: { notification_ids: notificationIds }
      });
      return response.data;
    } catch (error) {
      console.error('Error al eliminar múltiples notificaciones:', error);
      throw error;
    }
  }

  /**
   * Limpiar solo notificaciones leídas
   */
  async clearReadNotifications(): Promise<{ success: boolean; message: string; count: number }> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/clear-all/?solo_leidas=true`);
      return response.data;
    } catch (error) {
      console.error('Error al limpiar notificaciones leídas:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen de notificaciones
   */
  async getSummary(): Promise<NotificationSummary> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/notificaciones/resumen/`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener resumen de notificaciones:', error);
      throw error;
    }
  }

  /**
   * Simular eventos para testing
   */
  async simulateEvents(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/simular-eventos/`);
      return response.data;
    } catch (error) {
      console.error('Error al simular eventos:', error);
      throw error;
    }
  }
}

export const notificationsService = new NotificationsService();
