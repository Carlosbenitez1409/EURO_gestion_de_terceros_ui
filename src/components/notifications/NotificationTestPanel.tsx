import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notificationsService } from "@/services/notifications.service";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TestTube, Zap, BarChart3 } from "lucide-react";

export function NotificationTestPanel() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const { toast } = useToast();

  const handleSimulateEvents = async () => {
    setLoading(true);
    try {
      const result = await notificationsService.simulateEvents();
      toast({
        title: "✅ Eventos Simulados",
        description: result.message,
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudieron simular los eventos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetSummary = async () => {
    setLoading(true);
    try {
      const data = await notificationsService.getSummary();
      setSummary(data);
      toast({
        title: "📊 Resumen Obtenido",
        description: `${data.total} notificaciones totales, ${data.no_leidas} sin leer`,
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudo obtener el resumen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      const result = await notificationsService.markAllAsRead();
      toast({
        title: "✅ Notificaciones Marcadas",
        description: result.message,
      });
      // Actualizar el resumen si está disponible
      if (summary) {
        setSummary({
          ...summary,
          no_leidas: 0
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudieron marcar las notificaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-blue-600" />
          Panel de Pruebas - Sistema de Notificaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Botones de Acción */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={handleSimulateEvents}
            disabled={loading}
            className="flex items-center gap-2"
            variant="outline"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Simular Eventos
          </Button>

          <Button
            onClick={handleGetSummary}
            disabled={loading}
            className="flex items-center gap-2"
            variant="outline"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4" />
            )}
            Ver Resumen
          </Button>

          <Button
            onClick={handleMarkAllRead}
            disabled={loading}
            className="flex items-center gap-2"
            variant="outline"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "✓"
            )}
            Marcar Todas Leídas
          </Button>
        </div>

        {/* Resumen de Estadísticas */}
        {summary && (
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-900">📊 Estadísticas de Notificaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Estadísticas Generales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{summary.no_leidas}</div>
                  <div className="text-sm text-gray-600">Sin Leer</div>
                </div>
              </div>

              {/* Por Prioridad */}
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Por Prioridad:</h4>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="destructive" className="bg-red-100 text-red-800">
                    Alta: {summary.por_prioridad?.alta || 0}
                  </Badge>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Media: {summary.por_prioridad?.media || 0}
                  </Badge>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    Baja: {summary.por_prioridad?.baja || 0}
                  </Badge>
                </div>
              </div>

              {/* Por Tipo */}
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Por Tipo:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(summary.por_tipo || {}).map(([tipo, count]) => (
                    <div key={tipo} className="flex justify-between">
                      <span className="capitalize">{tipo}:</span>
                      <Badge variant="outline" className="h-5">
                        {count as number}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Información de Uso */}
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-3">🔧 Cómo usar este panel:</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>1. Simular Eventos:</strong> Crea notificaciones de prueba en el sistema</p>
              <p><strong>2. Ver Resumen:</strong> Muestra estadísticas detalladas de todas las notificaciones</p>
              <p><strong>3. Marcar Todas Leídas:</strong> Marca todas las notificaciones como leídas</p>
              <p><strong>4. Polling Automático:</strong> El sistema se actualiza automáticamente cada 30 segundos</p>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints de la API */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-3 text-blue-900">🔗 Endpoints Disponibles:</h4>
            <div className="space-y-1 text-xs font-mono text-blue-800">
              <div>GET /api/notifications/contador/</div>
              <div>GET /api/notifications/recientes/?limit=5</div>
              <div>GET /api/notifications/tiempo-real/</div>
              <div>POST /api/notifications/simular-eventos/</div>
              <div>POST /api/notifications/notificaciones/marcar_todas_leidas/</div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
