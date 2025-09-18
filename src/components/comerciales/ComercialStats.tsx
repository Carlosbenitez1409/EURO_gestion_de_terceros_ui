import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Users,
    TrendingUp,
    Target,
    BarChart3,
    Award,
    AlertTriangle
} from "lucide-react";
import { type Comercial } from '@/services/comerciales.service';
import { useComercialStats } from '@/hooks/use-comerciales';

interface ComercialStatsProps {
    comerciales: Comercial[];
}

export const ComercialStats: React.FC<ComercialStatsProps> = ({ comerciales }) => {
    const stats = useComercialStats(comerciales);

    const getLoadBadgeVariant = (carga: number) => {
        if (carga <= 5) return "default";
        if (carga <= 10) return "secondary";
        return "destructive";
    };

    const getLoadBadgeText = (carga: number) => {
        if (carga <= 5) return "Bajo";
        if (carga <= 10) return "Medio";
        return "Alto";
    };

    return (
        <div className="space-y-6">
            {/* Estadísticas Generales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Comerciales</CardTitle>
                        <Users className="h-4 w-4 text-[#0052CC]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalComerciales}</div>
                        <p className="text-xs text-muted-foreground">
                            Comerciales activos
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Terceros</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalTerceros}</div>
                        <p className="text-xs text-muted-foreground">
                            Terceros asignados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Carga Promedio</CardTitle>
                        <Target className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.promedioCarga}</div>
                        <p className="text-xs text-muted-foreground">
                            Terceros por comercial
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Distribución</CardTitle>
                        <BarChart3 className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span>Bajo: {stats.distribucionCarga.bajo}</span>
                                <span>Medio: {stats.distribucionCarga.medio}</span>
                                <span>Alto: {stats.distribucionCarga.alto}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.comercialMenosCargado && (
                    <Card className="border-green-200 bg-green-50">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                                <Award className="h-4 w-4" />
                                Menor Carga de Trabajo
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="font-medium text-green-900">
                                    {stats.comercialMenosCargado.first_name} {stats.comercialMenosCargado.last_name}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="default" className="bg-green-600">
                                        {stats.comercialMenosCargado.terceros_asignados} terceros
                                    </Badge>
                                    <span className="text-xs text-green-700">
                                        Disponible para asignaciones
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {stats.comercialMasCargado && (
                    <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Mayor Carga de Trabajo
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="font-medium text-red-900">
                                    {stats.comercialMasCargado.first_name} {stats.comercialMasCargado.last_name}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="destructive">
                                        {stats.comercialMasCargado.terceros_asignados} terceros
                                    </Badge>
                                    {stats.comercialMasCargado.terceros_asignados > 10 && (
                                        <span className="text-xs text-red-700">
                                            Sobrecargado
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Lista de Comerciales con Detalles */}
            <Card>
                <CardHeader>
                    <CardTitle>Detalle de Comerciales</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {comerciales.map((comercial) => {
                            const porcentajeCarga = stats.promedioCarga > 0 
                                ? Math.round((comercial.terceros_asignados / stats.promedioCarga) * 50) // Normalize to 50% as baseline
                                : 0;

                            return (
                                <div key={comercial.id} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <div className="font-medium">
                                                    {comercial.first_name} {comercial.last_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {comercial.email}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={getLoadBadgeVariant(comercial.terceros_asignados)}>
                                                {getLoadBadgeText(comercial.terceros_asignados)}
                                            </Badge>
                                            <span className="text-sm font-medium min-w-[80px] text-right">
                                                {comercial.terceros_asignados} terceros
                                            </span>
                                        </div>
                                    </div>
                                    <Progress 
                                        value={Math.min(porcentajeCarga, 100)} 
                                        className="h-2"
                                    />
                                </div>
                            );
                        })}
                        {comerciales.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No hay comerciales disponibles
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
