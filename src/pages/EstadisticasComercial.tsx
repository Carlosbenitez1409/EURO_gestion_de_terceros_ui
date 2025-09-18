import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { asignacionesService } from "@/services/asignaciones.service";
import { logoutUser } from "@/utils/logout.util";
import {
    RefreshCw,
    AlertCircle,
    BarChart3,
    TrendingUp,
    Clock,
    CheckCircle,
    User,
    FileText,
    ArrowLeft,
    Calendar,
    Users
} from "lucide-react";

interface EstadisticasComercial {
    total_asignados: number;
    pendientes: number;
    aprobados: number;
    rechazados: number;
    porcentaje_aprobacion: number;
    ultimos_30_dias: {
        nuevos_asignados: number;
        aprobados: number;
        pendientes: number;
    };
    mes_actual: {
        asignados: number;
        gestionados: number;
        pendientes: number;
    };
}

export default function EstadisticasComercial() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [estadisticas, setEstadisticas] = useState<EstadisticasComercial | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (user?.role !== "comercial") {
            navigate('/dashboard');
            return;
        }
        
        loadEstadisticas();
    }, [user, navigate]);

    const loadEstadisticas = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const data = await asignacionesService.getEstadisticasComercial();
            setEstadisticas(data);

        } catch (err) {
            console.error('Error loading statistics:', err);
            setError(err instanceof Error ? err.message : 'Error al cargar las estadísticas');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadEstadisticas();
        setRefreshing(false);
        
        toast({
            title: "✅ Actualizado",
            description: "Estadísticas actualizadas correctamente",
        });
    };

    if (loading) {
        return (
            <AppLayout
                userRole={user?.role || 'comercial'}
                userName={user?.email || 'Usuario'}
                currentPath="/estadisticas-comercial"
                onNavigate={(path) => navigate(path)}
                onLogout={logoutUser}
            >
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="h-8 w-8 animate-spin text-[#0052CC]" />
                    <span className="ml-2 text-lg">Cargando estadísticas...</span>
                </div>
            </AppLayout>
        );
    }

    if (error || !estadisticas) {
        return (
            <AppLayout
                userRole={user?.role || 'comercial'}
                userName={user?.email || 'Usuario'}
                currentPath="/estadisticas-comercial"
                onNavigate={(path) => navigate(path)}
                onLogout={logoutUser}
            >
                <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                        {error || 'No se pudieron cargar las estadísticas'}
                    </AlertDescription>
                </Alert>
                <Button 
                    onClick={() => navigate('/dashboard')} 
                    className="mt-4 bg-[#0052CC] hover:bg-[#003A8C]"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al Dashboard
                </Button>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            userRole={user?.role || 'comercial'}
            userName={user?.email || 'Usuario'}
            currentPath="/estadisticas-comercial"
            onNavigate={(path) => navigate(path)}
            onLogout={logoutUser}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/dashboard')}
                            className="border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver al Dashboard
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Mis Estadísticas
                            </h1>
                            <p className="text-gray-600">
                                Resumen de tu gestión comercial
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="bg-[#0052CC] hover:bg-[#003A8C] text-white"
                    >
                        {refreshing ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Actualizar
                    </Button>
                </div>

                {/* Estadísticas Generales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-[#0052CC] shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-[#0052CC]" />
                                <div>
                                    <p className="text-sm text-gray-600">Total Asignados</p>
                                    <p className="text-2xl font-bold text-[#0052CC]">{estadisticas.total_asignados}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[#FFD700] shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-[#FFD700]" />
                                <div>
                                    <p className="text-sm text-gray-600">Pendientes</p>
                                    <p className="text-2xl font-bold text-[#FFD700]">{estadisticas.pendientes}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-green-500 shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Aprobados</p>
                                    <p className="text-2xl font-bold text-green-600">{estadisticas.aprobados}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-500 shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="text-sm text-gray-600">% Aprobación</p>
                                    <p className="text-2xl font-bold text-blue-600">{estadisticas.porcentaje_aprobacion.toFixed(1)}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Estadísticas Detalladas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Últimos 30 días */}
                    <Card className="shadow-lg border-[#0052CC] border">
                        <CardHeader>
                            <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Últimos 30 Días
                            </CardTitle>
                            <CardDescription>
                                Resumen de actividad reciente
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium">Nuevos Asignados</span>
                                </div>
                                <Badge variant="default" className="bg-blue-600">
                                    {estadisticas.ultimos_30_dias.nuevos_asignados}
                                </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="font-medium">Aprobados</span>
                                </div>
                                <Badge variant="default" className="bg-green-600">
                                    {estadisticas.ultimos_30_dias.aprobados}
                                </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-yellow-600" />
                                    <span className="font-medium">Pendientes</span>
                                </div>
                                <Badge variant="default" className="bg-yellow-600">
                                    {estadisticas.ultimos_30_dias.pendientes}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Mes Actual */}
                    <Card className="shadow-lg border-[#FFD700] border">
                        <CardHeader>
                            <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Mes Actual
                            </CardTitle>
                            <CardDescription>
                                Progreso del mes en curso
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-indigo-600" />
                                    <span className="font-medium">Asignados</span>
                                </div>
                                <Badge variant="default" className="bg-indigo-600">
                                    {estadisticas.mes_actual.asignados}
                                </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-purple-600" />
                                    <span className="font-medium">Gestionados</span>
                                </div>
                                <Badge variant="default" className="bg-purple-600">
                                    {estadisticas.mes_actual.gestionados}
                                </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-orange-600" />
                                    <span className="font-medium">Por Gestionar</span>
                                </div>
                                <Badge variant="default" className="bg-orange-600">
                                    {estadisticas.mes_actual.pendientes}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Indicadores de Rendimiento */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-[#0052CC] flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Indicadores de Rendimiento
                        </CardTitle>
                        <CardDescription>
                            Métricas clave de tu gestión comercial
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Eficiencia */}
                            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                <div className="text-3xl font-bold text-blue-600">
                                    {estadisticas.total_asignados > 0 
                                        ? ((estadisticas.aprobados / estadisticas.total_asignados) * 100).toFixed(1)
                                        : 0
                                    }%
                                </div>
                                <p className="text-sm text-blue-700 font-medium">Tasa de Conversión</p>
                                <p className="text-xs text-gray-600 mt-1">Aprobados / Total Asignados</p>
                            </div>

                            {/* Productividad */}
                            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                <div className="text-3xl font-bold text-green-600">
                                    {estadisticas.ultimos_30_dias.aprobados}
                                </div>
                                <p className="text-sm text-green-700 font-medium">Aprobados (30d)</p>
                                <p className="text-xs text-gray-600 mt-1">Promedio mensual</p>
                            </div>

                            {/* Carga de Trabajo */}
                            <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                                <div className="text-3xl font-bold text-yellow-600">
                                    {estadisticas.pendientes}
                                </div>
                                <p className="text-sm text-yellow-700 font-medium">Pendientes</p>
                                <p className="text-xs text-gray-600 mt-1">Requieren atención</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
