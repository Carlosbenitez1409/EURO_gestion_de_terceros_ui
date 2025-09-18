import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Clock, CheckCircle, XCircle, FileText, Send, Eye, Users, RefreshCw, Wifi, WifiOff, Shield, DollarSign
} from 'lucide-react';
import { tercerosDRFService, type TerceroDRF } from '../services/terceros.drf.service';
import { toast } from '../hooks/use-toast';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { usePagination } from '../hooks/use-pagination';
import { useBackendPagination } from '../hooks/use-backend-pagination';interface CumplimientoDashboardProps {
    userRole: string;
}

export default function CumplimientoDashboard({ userRole }: CumplimientoDashboardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedTercero, setSelectedTercero] = useState<TerceroDRF | null>(null);
  const [showContabilidadDialog, setShowContabilidadDialog] = useState(false);
  const [showRechazoDialog, setShowRechazoDialog] = useState(false);
  const [actionReason, setActionReason] = useState('');

  // Estadísticas
  const [stats, setStats] = useState({
    pendientes: 0,
    revisados: 0,
    aprobados: 0,
    rechazados: 0,
    total: 0
  });

  // Función para obtener terceros con filtros de cumplimiento
  const fetchTercerosForCumplimiento = async (page: number, pageSize: number) => {
    const sessionData = JSON.parse(localStorage.getItem('euroSession') || '{}');
    const userId = sessionData.userId;
    const role = sessionData.role;

    if (!userId) {
      throw new Error('No se encontró ID del usuario');
    }

    // Lógica para diferentes roles
    if (role === 'administrador') {
      return await tercerosDRFService.getTerceros({
        page,
        page_size: pageSize
      });
    } else {
      // Para oficial de cumplimiento - solo terceros asignados
      return await tercerosDRFService.getTerceros({
        page,
        page_size: pageSize,
        assigned_to: 'me' // Usar 'me' para filtrar por usuario actual
      });
    }
  };

  // Hook de paginación backend
  const pagination = useBackendPagination({
    fetchFunction: fetchTercerosForCumplimiento,
    initialPageSize: 5,
    dependencies: [] // Solo se recarga al cambiar dependencias externas
  });

  const refresh = async () => {
    setError(null);
    pagination.refresh(); // Usar el refresh del hook de paginación
    await fetchStatsFromBackend();
    setLastUpdated(new Date());
  };

  const handleLogout = () => {
    console.log('🚪 CumplimientoDashboard handleLogout llamado');
    // Implementar logout logic si es necesario
    window.location.href = '/login';
  };

    useEffect(() => {
        // Debug inicial para verificar datos
        const sessionData = JSON.parse(localStorage.getItem('euroSession') || '{}');
        console.log('🔍 DEBUG - Datos de sesión:', sessionData);
        console.log('🔍 DEBUG - UserRole prop:', userRole);

        // Los terceros se cargan automáticamente por el hook useBackendPagination
        fetchStatsFromBackend(); // Cargar estadísticas del backend también
    }, []);

    const fetchStatsFromBackend = async () => {
        try {
            const sessionData = JSON.parse(localStorage.getItem('euroSession') || '{}');
            const userId = sessionData.userId;

            console.log('📊 Cargando estadísticas para usuario cumplimiento:', userId, sessionData);

            if (!userId) {
                console.error('❌ No se encontró ID del usuario para estadísticas');
                return;
            }

            // Cargar estadísticas específicas desde el backend para el usuario asignado
            const backendStats = await tercerosDRFService.getTercerosStats({
                assigned_to: userId
            });

            console.log('📊 Estadísticas del backend para usuario:', backendStats);

            // Actualizar estadísticas con datos del backend
            if (backendStats) {
                setStats(prevStats => ({
                    ...prevStats,
                    pendientes: backendStats.enviado_cumplimiento || 0,
                    total: backendStats.total_terceros || 0,
                    aprobados: backendStats.aprobados || 0,
                    rechazados: backendStats.rechazados || 0
                }));
            }
        } catch (error) {
            console.error('❌ Error cargando estadísticas del backend:', error);
            setError('Error cargando estadísticas');
            // Si falla, las estadísticas calculadas localmente se mantienen
        }
    };

    const handleAprobarYEnviarContabilidad = async () => {
        if (!selectedTercero || !actionReason.trim()) {
            toast({
                title: "❌ Error",
                description: "Las observaciones son obligatorias para aprobar",
                variant: "destructive"
            });
            return;
        }

        try {
            await tercerosDRFService.cambiarEstado(selectedTercero.id, {
                estado: 'aprobado',
                comentario: actionReason
            });

            toast({
                title: "✅ Tercero Aprobado",
                description: "El tercero ha sido aprobado y enviado a contabilidad exitosamente"
            });

            setShowContabilidadDialog(false);
            setSelectedTercero(null);
            setActionReason('');
            pagination.refresh(); // Recargar lista usando el hook
        } catch (error) {
            console.error('Error aprobando tercero:', error);
            toast({
                title: "❌ Error",
                description: "No se pudo aprobar el tercero",
                variant: "destructive"
            });
        }
    };

    const handleRechazarTercero = async () => {
        if (!selectedTercero || !actionReason.trim()) {
            toast({
                title: "❌ Error",
                description: "Las observaciones son obligatorias para rechazar",
                variant: "destructive"
            });
            return;
        }

        try {
            await tercerosDRFService.cambiarEstado(selectedTercero.id, {
                estado: 'rechazado',
                comentario: actionReason
            });

            toast({
                title: "✅ Tercero Rechazado",
                description: "El tercero ha sido rechazado exitosamente"
            });

            setShowRechazoDialog(false);
            setSelectedTercero(null);
            setActionReason('');
            pagination.refresh(); // Recargar lista usando el hook
        } catch (error) {
            console.error('Error rechazando tercero:', error);
            toast({
                title: "❌ Error",
                description: "No se pudo rechazar el tercero",
                variant: "destructive"
            });
        }
    };

    const getEstadoBadgeVariant = (estado: string) => {
        switch (estado) {
            case 'enviado_cumplimiento': return 'default' as const;
            case 'aprobado': return 'default' as const;
            case 'rechazado': return 'destructive' as const;
            default: return 'secondary' as const;
        }
    };

    const getEstadoLabel = (estado: string) => {
        switch (estado) {
            case 'enviado_cumplimiento': return 'Pendiente Revisión';
            case 'aprobado': return 'Aprobado';
            case 'rechazado': return 'Rechazado';
            default: return estado;
        }
    };

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'enviado_cumplimiento': return <Clock className="h-4 w-4" />;
            case 'aprobado': return <CheckCircle className="h-4 w-4" />;
            case 'rechazado': return <XCircle className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    if (loading) {
        return (
            <AppLayout
                userRole={user?.role || 'oficial_cumplimiento'}
                userName={user?.email || 'Usuario'}
                currentPath="/dashboard/cumplimiento"
                onNavigate={(path) => window.location.href = path}
                onLogout={handleLogout}
            >
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-lg">Cargando dashboard...</span>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            userRole={user?.role || 'oficial_cumplimiento'}
            userName={user?.email || 'Usuario'}
            currentPath="/dashboard/cumplimiento"
            onNavigate={(path) => window.location.href = path}
            onLogout={handleLogout}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Dashboard - Oficial de Cumplimiento
                        </h1>
                        <div className="flex items-center gap-4 mt-1">
                            <p className="text-gray-600">
                                Bienvenido, {user?.email}
                            </p>
                            {lastUpdated && (
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                    <Wifi className="h-4 w-4 text-green-500" />
                                    Actualizado: {lastUpdated.toLocaleTimeString()}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={refresh} variant="outline" className="gap-2">
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </Button>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <Alert className="border-red-200 bg-red-50">
                        <WifiOff className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <strong>Error de conexión:</strong> {error}
                                </div>
                                <Button onClick={refresh} variant="outline" size="sm">
                                    Reintentar
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-l-4 border-[#0052CC] shadow-lg bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Total Terceros</CardTitle>
                            <Users className="h-4 w-4 text-[#0052CC]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#0052CC]">{stats.total}</div>
                            <p className="text-xs text-gray-600">Asignados a ti</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-[#FFD700] shadow-lg bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Pendientes</CardTitle>
                            <Clock className="h-4 w-4 text-[#FFD700]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#F2C200]">{stats.pendientes}</div>
                            <p className="text-xs text-gray-600">Requieren revisión</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-green-600 shadow-lg bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Aprobados</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.aprobados}</div>
                            <p className="text-xs text-gray-600">Este mes</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-red-600 shadow-lg bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Rechazados</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.rechazados}</div>
                            <p className="text-xs text-gray-600">Necesitan corrección</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Terceros */}
                <Card className="shadow-lg bg-white border-[#0052CC] border">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-[#0052CC]">
                            <span>Terceros para Revisión de Cumplimiento</span>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                    {pagination.totalCount} terceros
                                </Badge>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pagination.data.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay terceros pendientes</h3>
                                <p className="text-gray-500">No tienes terceros asignados para revisión de cumplimiento.</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {pagination.data.map((tercero) => (
                                    <div key={tercero.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#0052CC] transition-colors bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            {getEstadoIcon(tercero.estado_aprobacion)}
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {tercero.tipo_persona === 'natural' 
                                                        ? `${tercero.nombres} ${tercero.apellidos || ''}`.trim()
                                                        : tercero.razon_social || tercero.numero_documento
                                                    }
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {tercero.numero_documento} • {tercero.email || 'No especificado'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Badge className={`${getEstadoBadgeVariant(tercero.estado_aprobacion)} font-medium`}>
                                                {getEstadoLabel(tercero.estado_aprobacion)}
                                            </Badge>
                                            <span className="text-xs text-gray-500">
                                                {new Date(tercero.updated_at).toLocaleDateString()}
                                            </span>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white h-8 px-3"
                                                    onClick={() => window.location.href = `/terceros/view/${tercero.id}`}
                                                >
                                                    Ver
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-[#FFD700] text-[#F2C200] hover:bg-[#FFD700] hover:text-[#0052CC] h-8 px-3"
                                                    onClick={() => window.location.href = `/terceros/edit/${tercero.id}`}
                                                >
                                                    Editar
                                                </Button>
                                                {tercero.estado_aprobacion === 'asignada_oficial_cumplimiento' && (
                                                    <>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                </div>
                                
                                {/* Paginación */}
                                {pagination.totalPages > 1 && (
                                    <div className="flex items-center justify-between pt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Página {pagination.currentPage} de {pagination.totalPages} - Mostrando {pagination.data.length} de {pagination.totalCount} resultados
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => pagination.goToPage(pagination.currentPage - 1)}
                                                disabled={!pagination.hasPreviousPage}
                                            >
                                                Anterior
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => pagination.goToPage(pagination.currentPage + 1)}
                                                disabled={!pagination.hasNextPage}
                                            >
                                                Siguiente
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>                {/* Dialog para Aprobar y Enviar a Contabilidad */}
                <Dialog open={showContabilidadDialog} onOpenChange={setShowContabilidadDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-green-600" />
                                Aprobar y Enviar a Contabilidad
                            </DialogTitle>
                            <DialogDescription>
                                El tercero será aprobado y enviado a contabilidad para finalizar el proceso.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedTercero && (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <h4 className="font-medium text-green-900">
                                        {selectedTercero.tipo_persona === 'natural'
                                            ? `${selectedTercero.nombres} ${selectedTercero.apellidos}`
                                            : selectedTercero.razon_social
                                        }
                                    </h4>
                                    <p className="text-sm text-green-700">Doc: {selectedTercero.numero_documento}</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Observaciones de Aprobación *</label>
                                    <Textarea
                                        value={actionReason}
                                        onChange={(e) => setActionReason(e.target.value)}
                                        placeholder="Indique las observaciones para la aprobación..."
                                        className="min-h-[100px]"
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowContabilidadDialog(false)}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleAprobarYEnviarContabilidad}
                                className="bg-green-600 hover:bg-green-700"
                                disabled={!actionReason.trim()}
                            >
                                <Send className="h-4 w-4 mr-2" />
                                Aprobar y Enviar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Dialog para Rechazar */}
                <Dialog open={showRechazoDialog} onOpenChange={setShowRechazoDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <XCircle className="h-5 w-5 text-red-600" />
                                Rechazar Tercero
                            </DialogTitle>
                            <DialogDescription>
                                El tercero será rechazado y devuelto para correcciones.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedTercero && (
                            <div className="space-y-4">
                                <div className="p-4 bg-red-50 rounded-lg">
                                    <h4 className="font-medium text-red-900">
                                        {selectedTercero.tipo_persona === 'natural'
                                            ? `${selectedTercero.nombres} ${selectedTercero.apellidos}`
                                            : selectedTercero.razon_social
                                        }
                                    </h4>
                                    <p className="text-sm text-red-700">Doc: {selectedTercero.numero_documento}</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Motivo del Rechazo *</label>
                                    <Textarea
                                        value={actionReason}
                                        onChange={(e) => setActionReason(e.target.value)}
                                        placeholder="Indique el motivo del rechazo y las correcciones necesarias..."
                                        className="min-h-[100px]"
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowRechazoDialog(false)}>
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleRechazarTercero}
                                disabled={!actionReason.trim()}
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Rechazar Tercero
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
