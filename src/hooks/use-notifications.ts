import { useState, useEffect, useCallback } from 'react';
import { notificationsService, Notification, NotificationCounter } from '@/services/notifications.service';
import { useToast } from '@/hooks/use-toast';

interface UseNotificationsReturn {
  notifications: Notification[];
  counter: NotificationCounter;
  loading: boolean;
  error: string | null;
  // Actions
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markMultipleAsRead: (notificationIds: string[]) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteMultipleNotifications: (notificationIds: string[]) => Promise<void>;
  clearReadNotifications: () => Promise<void>;
}

export function useNotifications(pollingInterval: number = 30000): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counter, setCounter] = useState<NotificationCounter>({ no_leidas: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Cargar notificaciones y contador
   */
  const loadNotifications = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      // Cargar en paralelo notificaciones y contador
      const [notificationsData, counterData] = await Promise.all([
        notificationsService.getRecent(10),
        notificationsService.getCounter()
      ]);

      // Garantizar que notificationsData es un array
      const safeNotifications = Array.isArray(notificationsData) ? notificationsData : [];
      const safeCounter = counterData || { no_leidas: 0, total: 0 };

      // Si el total del contador es 0 pero tenemos notificaciones, usar el conteo real
      if (safeCounter.total === 0 && safeNotifications.length > 0) {
        safeCounter.total = safeNotifications.length;
      }

      setNotifications(safeNotifications);
      setCounter(safeCounter);
    } catch (err) {
      const errorMessage = 'Error al cargar notificaciones';
      setError(errorMessage);
      console.error('Error loading notifications:', err);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Actualizar notificaciones (sin mostrar loading)
   */
  const refreshNotifications = useCallback(async () => {
    await loadNotifications(false);
  }, [loadNotifications]);

  /**
   * Marcar una notificación como leída
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationsService.markSingleAsRead(notificationId);
      
      // Actualizar estado local inmediatamente para mejor UX
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, leida: true }
            : notification
        )
      );
      
      // Actualizar contador
      setCounter(prev => ({
        ...prev,
        no_leidas: Math.max(0, prev.no_leidas - 1)
      }));

    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "No se pudo marcar la notificación como leída",
        variant: "destructive",
      });
    }
  }, [toast]);

  /**
   * Marcar múltiples notificaciones como leídas
   */
  const markMultipleAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      await notificationsService.markAsRead(notificationIds);
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, leida: true }
            : notification
        )
      );
      
      // Actualizar contador
      const unreadCount = notificationIds.filter(id => 
        notifications.find(n => n.id === id && !n.leida)
      ).length;
      
      setCounter(prev => ({
        ...prev,
        no_leidas: Math.max(0, prev.no_leidas - unreadCount)
      }));

      toast({
        title: "Éxito",
        description: `${notificationIds.length} notificaciones marcadas como leídas`,
      });

    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: "Error",
        description: "No se pudieron marcar las notificaciones como leídas",
        variant: "destructive",
      });
    }
  }, [notifications, toast]);

  /**
   * Marcar todas las notificaciones como leídas
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const result = await notificationsService.markAllAsRead();
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, leida: true }))
      );
      
      setCounter(prev => ({ ...prev, no_leidas: 0 }));

      toast({
        title: "Éxito",
        description: result.message,
      });

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "No se pudieron marcar todas las notificaciones como leídas",
        variant: "destructive",
      });
    }
  }, [toast]);

  /**
   * Polling para actualizaciones en tiempo real
   */
  useEffect(() => {
    // Carga inicial
    loadNotifications();

    // Configurar polling si está habilitado
    if (pollingInterval > 0) {
      const interval = setInterval(() => {
        refreshNotifications();
      }, pollingInterval);

      return () => clearInterval(interval);
    }
  }, [loadNotifications, refreshNotifications, pollingInterval]);

  /**
   * Limpiar al desmontar
   */
  useEffect(() => {
    return () => {
      setNotifications([]);
      setCounter({ no_leidas: 0, total: 0 });
    };
  }, []);

  /**
   * Limpiar todas las notificaciones
   */
  const clearAllNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      // Uncomment when backend implements the endpoint
      const result = await notificationsService.clearAllNotifications();
      
      // Limpiar estado local inmediatamente
      setNotifications([]);
      setCounter({ no_leidas: 0, total: 0 });
      
      toast({
        title: "Éxito",
        description: `Se limpiaron ${result.count || 0} notificaciones`,
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      toast({
        title: "Error",
        description: "No se pudieron limpiar las notificaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Eliminar una notificación específica
   */
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      setLoading(true);
      
      // Uncomment when backend implements the endpoint
      await notificationsService.deleteNotification(notificationId);
      
      // Remover de estado local inmediatamente
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      
      // Actualizar contador
      setCounter(prev => {
        const deletedNotification = notifications.find(n => n.id === notificationId);
        const wasUnread = deletedNotification && !deletedNotification.leida;
        
        return {
          total: Math.max(0, prev.total - 1),
          no_leidas: wasUnread ? Math.max(0, prev.no_leidas - 1) : prev.no_leidas
        };
      });
      
      toast({
        title: "Éxito",
        description: "Notificación eliminada correctamente",
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la notificación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [notifications, toast]);

  /**
   * Eliminar múltiples notificaciones
   */
  const deleteMultipleNotifications = useCallback(async (notificationIds: string[]) => {
    try {
      setLoading(true);
      const result = await notificationsService.deleteMultipleNotifications(notificationIds);
      
      // Remover de estado local inmediatamente
      setNotifications(prev => prev.filter(notification => !notificationIds.includes(notification.id)));
      
      // Actualizar contador
      setCounter(prev => {
        const deletedNotifications = notifications.filter(n => notificationIds.includes(n.id));
        const unreadDeleted = deletedNotifications.filter(n => !n.leida).length;
        
        return {
          total: Math.max(0, prev.total - deletedNotifications.length),
          no_leidas: Math.max(0, prev.no_leidas - unreadDeleted)
        };
      });
      
      toast({
        title: "Éxito",
        description: `Se eliminaron ${result.count || notificationIds.length} notificaciones`,
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error deleting multiple notifications:', error);
      toast({
        title: "Error",
        description: "No se pudieron eliminar las notificaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [notifications, toast]);

  /**
   * Limpiar solo notificaciones leídas
   */
  const clearReadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const result = await notificationsService.clearReadNotifications();
      
      // Remover solo las leídas del estado local
      setNotifications(prev => prev.filter(notification => !notification.leida));
      
      // Actualizar contador (solo el total, las no_leidas se mantienen)
      setCounter(prev => ({
        ...prev,
        total: Math.max(0, prev.total - (result.count || 0))
      }));
      
      toast({
        title: "Éxito",
        description: `Se eliminaron ${result.count || 0} notificaciones leídas`,
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error clearing read notifications:', error);
      toast({
        title: "Error",
        description: "No se pudieron limpiar las notificaciones leídas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    notifications,
    counter,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    markMultipleAsRead,
    clearAllNotifications,
    deleteNotification,
    deleteMultipleNotifications,
    clearReadNotifications,
  };
}
