import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    BarChart3,
    Settings,
    Bell,
    RefreshCw,
    TrendingUp,
    AlertCircle
} from "lucide-react";
import { ComercialDashboard } from '@/components/comerciales/ComercialDashboard';
import { ComercialStats } from '@/components/comerciales/ComercialStats';
import { useComerciales } from '@/hooks/use-comerciales';
import { useToast } from '@/hooks/use-toast';

export const ComercialAsignacionDashboard: React.FC = () => {
    const { toast } = useToast();
    const { comerciales, loading, error, refetch } = useComerciales();
    const [activeTab, setActiveTab] = useState("dashboard");

    const handleRefresh = async () => {
        toast({
            title: "Actualizando datos...",
            description: "Refrescando información de comerciales y asignaciones",
        });
        await refetch();
    };

    // Estadísticas rápidas
    const totalComerciales = comerciales.length;
    const totalTerceros = comerciales.reduce((sum, c) => sum + c.terceros_asignados, 0);
    const promedioCarga = totalComerciales > 0 ? Math.round(totalTerceros / totalComerciales) : 0;
    const comercialesActivos = comerciales.filter(c => c.terceros_asignados > 0).length;

    if (error) {
        return (
            <div className="p-6">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <div>
                                <h3 className="font-medium text-red-800">Error al cargar datos</h3>
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                            <Button 
                                onClick={handleRefresh}
                                variant="outline"
                                size="sm"
                                className="ml-auto"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reintentar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard de Procesos</h1>
                    <p className="text-gray-600 mt-1">
                        Gestión de asignación comercial y seguimiento de cargas de trabajo
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleRefresh}
                        variant="outline"
                        disabled={loading}
                        className="border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                    <Button
                        onClick={() => window.location.href = '/mis-terceros'}
                        variant="default"
                        className="bg-[#0052CC] text-white hover:bg-[#003d99] ml-2"
                    >
                        Mis Terceros
                    </Button>
                </div>
            </div>

            {/* Resumen Rápido */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Comerciales</CardTitle>
                        <Users className="h-4 w-4 text-[#0052CC]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalComerciales}</div>
                        <p className="text-xs text-muted-foreground">
                            {comercialesActivos} activos
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Terceros Asignados</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalTerceros}</div>
                        <p className="text-xs text-muted-foreground">
                            Total asignados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Carga Promedio</CardTitle>
                        <BarChart3 className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{promedioCarga}</div>
                        <p className="text-xs text-muted-foreground">
                            Terceros por comercial
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estado Sistema</CardTitle>
                        <Bell className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800">
                                Operativo
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Sistema funcionando
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Alertas y Notificaciones */}
            {comerciales.some(c => c.terceros_asignados > 15) && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                            <div>
                                <h3 className="font-medium text-yellow-800">Atención: Sobrecarga detectada</h3>
                                <p className="text-sm text-yellow-700">
                                    Algunos comerciales tienen más de 15 terceros asignados. 
                                    Considera redistribuir la carga de trabajo.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pestañas Principales */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Asignación de Terceros
                    </TabsTrigger>
                    <TabsTrigger value="estadisticas" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Estadísticas
                    </TabsTrigger>
                    <TabsTrigger value="configuracion" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Configuración
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-4">
                    <ComercialDashboard />
                </TabsContent>

                <TabsContent value="estadisticas" className="space-y-4">
                    <ComercialStats comerciales={comerciales} />
                </TabsContent>

                <TabsContent value="configuracion" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración del Sistema</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="text-sm text-gray-600">
                                    <p>Aquí podrás configurar:</p>
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>Límites máximos de asignación por comercial</li>
                                        <li>Reglas de distribución automática</li>
                                        <li>Notificaciones de sobrecarga</li>
                                        <li>Períodos de balanceamiento</li>
                                        <li>Criterios de asignación especializada</li>
                                    </ul>
                                </div>
                                <div className="pt-4 border-t">
                                    <p className="text-sm text-gray-500">
                                        Funcionalidad de configuración en desarrollo
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ComercialAsignacionDashboard;
