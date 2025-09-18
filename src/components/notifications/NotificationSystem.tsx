import { useState, useEffect } from "react";
import { Bell, X, RefreshCw, Loader2, Trash2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { useNotifications } from "@/hooks/use-notifications";
import { Notification } from "@/services/notifications.service";

interface NotificationSystemProps {
  userRole?: "procesos" | "comercial" | "gestion_humana" | string;
  pollingInterval?: number; // Intervalo de polling en milisegundos
  showOnlyRelevant?: boolean; // Filtrar solo notificaciones relevantes
}

const getNotificationIcon = (tipo: Notification["tipo"]) => {
  switch (tipo) {
    case "solicitud":
      return "📋";
    case "aprobacion":
      return "✅";
    case "rechazo":
      return "❌";
    case "registro":
      return "👤";
    case "asignacion":
      return "�";
    case "actualizacion":
      return "�";
    default:
      return "🔔";
  }
};

const getPriorityColor = (prioridad: Notification["prioridad"]) => {
  switch (prioridad) {
    case "alta":
      return "bg-red-100 text-red-800 border-red-200";
    case "media":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "baja":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export function NotificationSystem({ userRole, pollingInterval = 30000, showOnlyRelevant: initialShowOnlyRelevant = true }: NotificationSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showOnlyRelevant, setShowOnlyRelevant] = useState(initialShowOnlyRelevant);
  
  const {
    notifications: rawNotifications,
    counter,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    deleteNotification,
    clearReadNotifications,
  } = useNotifications(pollingInterval);

  // Protección adicional: garantizar que notifications es siempre un array
  const allNotifications = Array.isArray(rawNotifications) ? rawNotifications : [];
  
  // Filtrar notificaciones relevantes si está habilitado
  const notifications = showOnlyRelevant 
    ? allNotifications.filter(notification => {
        // Solo mostrar notificaciones importantes:
        // 1. Asignaciones de terceros (SIEMPRE IMPORTANTES)
        // 2. Aprobaciones de terceros por comerciales (MUY IMPORTANTE)
        // 3. Registros de terceros nuevos
        // 4. Rechazos que requieren acción
        const relevantTypes = ["asignacion", "aprobacion", "registro", "rechazo"];
        const isRelevantType = relevantTypes.includes(notification.tipo);
        
        // ⭐ PRIORIDAD ESPECIAL: Notificaciones de "Nuevo tercero asignado" SIEMPRE son importantes
        const isNewTerceroAssignment = 
          notification.titulo.toLowerCase().includes("nuevo tercero asignado") ||
          (notification.tipo === "asignacion" && notification.descripcion.toLowerCase().includes("se te ha asignado"));
        
        // Filtrar SOLO notificaciones de documentos/archivos que NO sean de terceros
        const isDocumentNotification = 
          (notification.titulo.toLowerCase().includes("documento") ||
           notification.descripcion.toLowerCase().includes("documento") ||
           notification.titulo.toLowerCase().includes("archivo") ||
           notification.descripcion.toLowerCase().includes("archivo")) &&
          // PERO mantener si menciona tercero/comercial (son importantes)
          !(notification.titulo.toLowerCase().includes("tercero") ||
            notification.descripcion.toLowerCase().includes("tercero") ||
            notification.titulo.toLowerCase().includes("comercial") ||
            notification.descripcion.toLowerCase().includes("comercial") ||
            notification.titulo.toLowerCase().includes("aprobado") ||
            notification.descripcion.toLowerCase().includes("aprobado"));
        
        // Solo incluir si es tipo relevante Y no es notificación de documento irrelevante
        // O si es una asignación de nuevo tercero (siempre importante)
        return (isRelevantType && !isDocumentNotification) || isNewTerceroAssignment;
      })
    : allNotifications;

  // Calcular contador filtrado
  const filteredCounter = showOnlyRelevant 
    ? {
        no_leidas: notifications.filter(n => !n.leida).length,
        total: notifications.length
      }
    : counter;
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Efecto para manejar la animación del contenido cuando se abre el panel
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = async () => {
    if (confirm('¿Está seguro de que desea limpiar todas las notificaciones? Esta acción no se puede deshacer.')) {
      await clearAllNotifications();
    }
  };

  const handleClearRead = async () => {
    if (confirm('¿Está seguro de que desea eliminar solo las notificaciones leídas?')) {
      await clearReadNotifications();
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (confirm('¿Está seguro de que desea eliminar esta notificación?')) {
      await deleteNotification(notificationId);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleNotificationClick = () => {
    setIsAnimating(true);
    
    // Crear un efecto de vibración sutil (si está disponible en el dispositivo)
    if ('vibrate' in navigator) {
      navigator.vibrate([30]);
    }
    
    setTimeout(() => setIsAnimating(false), 800); // Duración optimizada
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`relative hover:bg-gray-100 transition-all duration-300 ${
            isAnimating ? 'scale-110 animate-pulse' : ''
          }`}
          onClick={handleNotificationClick}
          style={{ overflow: 'visible' }}
        >
          <div className={`relative transition-transform duration-300 ${isAnimating ? 'animate-bounce' : ''}`}>
            <Bell className={`h-5 w-5 transition-all duration-500 ${
              filteredCounter.no_leidas > 0 ? 'text-blue-600' : 'text-gray-600'
            } ${isAnimating ? 'transform rotate-12' : ''}`} />
            
            {/* Efecto de ondas múltiples cuando se hace clic */}
            {isAnimating && (
              <>
                <div className="absolute inset-0 h-5 w-5 rounded-full bg-blue-400/50 animate-ping"></div>
                <div className="absolute -inset-1 h-7 w-7 rounded-full bg-blue-300/30 animate-ping" style={{ animationDelay: '200ms', animationDuration: '1.5s' }}></div>
                <div className="absolute -inset-2 h-9 w-9 rounded-full bg-blue-200/20 animate-ping" style={{ animationDelay: '400ms', animationDuration: '2s' }}></div>
              </>
            )}
          </div>
          {filteredCounter.no_leidas > 0 && (
            <Badge 
              variant="destructive" 
              className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold bg-gradient-to-r from-red-500 to-red-600 border-2 border-white shadow-lg transition-all duration-300 ${
                isAnimating ? 'animate-bounce scale-125' : 'animate-pulse'
              }`}
            >
              {filteredCounter.no_leidas > 9 ? "9+" : filteredCounter.no_leidas}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        className="w-96 bg-white border-l-2 border-blue-100 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" 
        aria-describedby="notifications-description"
      >
        <SheetHeader className={`pb-4 border-b border-gray-100 transition-all duration-500 ${
          showContent ? 'translate-y-0 opacity-100' : 'translate-y-[-10px] opacity-0'
        }`}>
          {/* Título principal */}
          <SheetTitle className="flex items-center justify-between mb-3">
            <div className={`flex items-center gap-2 transition-all duration-700 ${
              showContent ? 'translate-x-0 opacity-100' : 'translate-x-[-20px] opacity-0'
            }`}>
              <span className="text-lg font-semibold text-gray-800">Notificaciones</span>
              {filteredCounter.total > 0 && (
                <Badge variant="secondary" className={`text-xs bg-blue-100 text-blue-700 border-blue-200 transition-all duration-800 ${
                  showContent ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                }`}>
                  {filteredCounter.total} {showOnlyRelevant ? 'relevantes' : 'total'}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-8 w-8 hover:bg-gray-100 transition-colors"
              title="Actualizar notificaciones"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <RefreshCw className="h-4 w-4 text-gray-600 hover:text-blue-600" />
              )}
            </Button>
          </SheetTitle>

          {/* Toggle para filtrar */}
          <div className={`flex items-center justify-between mb-3 transition-all duration-700 ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-[-10px] opacity-0'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Mostrar:</span>
              <div className="flex bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setShowOnlyRelevant(true)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                    showOnlyRelevant 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Solo importantes
                </button>
                <button
                  onClick={() => setShowOnlyRelevant(false)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                    !showOnlyRelevant 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Todas
                </button>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className={`flex items-center gap-2 flex-wrap transition-all duration-900 ${
            showContent ? 'translate-x-0 opacity-100' : 'translate-x-[20px] opacity-0'
          }`}>
            {filteredCounter.no_leidas > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleMarkAllAsRead}
                className="text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                disabled={loading}
              >
                ✓ Marcar todas leídas
              </Button>
            )}
            {/* Mostrar botón de limpiar leídas solo si hay notificaciones totales y algunas leídas */}
            {filteredCounter.total > filteredCounter.no_leidas && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearRead}
                className="text-xs hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 transition-colors"
                disabled={loading}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Limpiar leídas
              </Button>
            )}
            {filteredCounter.total > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearAll}
                className="text-xs hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                disabled={loading}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpiar todo
              </Button>
            )}
          </div>

          <SheetDescription className="text-sm text-gray-600">
            {showOnlyRelevant 
              ? `Notificaciones importantes del sistema. ${filteredCounter.total > 0 ? `${filteredCounter.total} notificaciones relevantes` : 'No hay notificaciones relevantes'}`
              : `Gestiona tus notificaciones del sistema. ${filteredCounter.total > 0 ? `${filteredCounter.total} notificaciones en total` : 'No hay notificaciones'}`
            }
          </SheetDescription>
          <p id="notifications-description" className="text-sm text-muted-foreground sr-only">
            Panel de notificaciones del sistema con {filteredCounter.total} notificaciones {showOnlyRelevant ? 'relevantes' : 'en total'}
          </p>
        </SheetHeader>
        
        <div className={`bg-gray-50/30 min-h-[calc(100vh-200px)] -mx-6 px-6 py-4 transition-all duration-600 ${
          showContent ? 'translate-y-0 opacity-100' : 'translate-y-[20px] opacity-0'
        }`}>
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-3 pr-4">
              {loading && notifications.length === 0 ? (
                <Card className={`p-8 text-center border-gray-200 bg-white shadow-sm transition-all duration-500 ${
                  showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                }`}>
                  <div className="flex flex-col items-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="text-gray-600 font-medium">Cargando notificaciones...</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </Card>
              ) : error ? (
                <Card className={`p-8 text-center border-red-200 bg-white shadow-sm transition-all duration-500 ${
                  showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                }`}>
                  <div className="text-5xl mb-3">🚨</div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Error de conexión</h3>
                  <p className="text-red-600 mb-4 text-sm leading-relaxed">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-colors"
                  >
                    🔄 Reintentar
                  </Button>
                </Card>
              ) : notifications.length === 0 ? (
                <Card className={`p-8 text-center border-gray-200 bg-white shadow-sm transition-all duration-500 ${
                  showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                }`}>
                  <div className="text-5xl mb-3">🔔</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {showOnlyRelevant ? '¡Sin notificaciones importantes!' : '¡Todo al día!'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {showOnlyRelevant 
                      ? 'No tienes notificaciones relevantes de asignaciones o aprobaciones' 
                      : 'No tienes notificaciones pendientes'
                    }
                  </p>
                </Card>
            ) : (
              notifications.map((notification, index) => (
                <Card 
                  key={notification.id}
                  className={`bg-white shadow-sm border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                    !notification.leida 
                      ? "border-l-4 border-l-blue-500 border-blue-200 bg-blue-50/20" 
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                  } ${
                    // ⭐ DESTACAR notificaciones de "Nuevo tercero asignado" como importantes
                    (notification.titulo.toLowerCase().includes("nuevo tercero asignado") || 
                     (notification.tipo === "asignacion" && notification.descripcion.toLowerCase().includes("se te ha asignado")))
                      ? "ring-2 ring-red-300 border-red-400 bg-red-50/30" 
                      : ""
                  } ${
                    showContent 
                      ? 'translate-y-0 opacity-100' 
                      : 'translate-y-[30px] opacity-0'
                  }`}
                  style={{
                    transitionDelay: showContent ? `${index * 100 + 200}ms` : '0ms',
                    transitionDuration: '500ms'
                  }}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className={`text-sm leading-tight ${
                            !notification.leida ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                          }`}>
                            {/* ⭐ Indicador especial para nuevos terceros asignados */}
                            {(notification.titulo.toLowerCase().includes("nuevo tercero asignado") || 
                              (notification.tipo === "asignacion" && notification.descripcion.toLowerCase().includes("se te ha asignado"))) && (
                              <span className="inline-flex items-center mr-2 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                🔥 IMPORTANTE
                              </span>
                            )}
                            {notification.titulo}
                          </h4>
                          <div className="flex items-center gap-2 ml-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs flex-shrink-0 ${getPriorityColor(notification.prioridad)}`}
                            >
                              {notification.prioridad}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification.id);
                              }}
                              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 transition-colors"
                              title="Eliminar notificación"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                          {notification.descripcion}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground font-medium">
                            {notification.tiempo_relativo}
                          </p>
                          {!notification.leida && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-blue-600 font-medium">Nueva</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Mostrar datos adicionales si existen */}
                        {notification.datos_adicionales && Object.keys(notification.datos_adicionales).length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {notification.datos_adicionales.numero_documento && (
                              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">
                                📄 {notification.datos_adicionales.numero_documento}
                              </span>
                            )}
                            {notification.datos_adicionales.tipo_persona && (
                              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">
                                👤 {notification.datos_adicionales.tipo_persona}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          {/* Estadísticas al final */}
          {!loading && !error && notifications.length > 0 && (
            <div className={`mt-6 pt-4 border-t border-gray-200 transition-all duration-700 ${
              showContent ? 'translate-y-0 opacity-100' : 'translate-y-[20px] opacity-0'
            }`} style={{
              transitionDelay: showContent ? `${notifications.length * 100 + 400}ms` : '0ms'
            }}>
              <div className="flex justify-between items-center text-xs bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="font-medium text-gray-700">{filteredCounter.no_leidas} sin leer</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  <span className="font-medium text-gray-700">
                    {filteredCounter.total} {showOnlyRelevant ? 'relevantes' : 'total'}
                  </span>
                </div>
              </div>
            </div>
          )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
