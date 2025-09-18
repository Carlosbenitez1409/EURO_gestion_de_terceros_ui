import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logoutUser } from "@/utils/logout.util";
import { 
    BarChart3, 
    TrendingUp, 
    Download, 
    Calendar, 
    FileText, 
    PieChart,
    Activity,
    Users,
    Clock,
    Target,
    Filter,
    RefreshCw
} from "lucide-react";

const Reportes = () => {
    const { user } = useAuth();
    const [reportesData, setReportesData] = useState({
        total_reportes: 0,
        reportes_mes: 0,
        reportes_automaticos: 0,
        reportes_manuales: 0
    });

    const handleLogout = () => {
        console.log('🔘 Reportes handleLogout llamado');
        logoutUser();
    };

    const handleNavigate = (path: string) => {
        window.location.href = path;
    };

    useEffect(() => {
        // Simular carga de datos de reportes
        setReportesData({
            total_reportes: 248,
            reportes_mes: 42,
            reportes_automaticos: 186,
            reportes_manuales: 62
        });
    }, []);

    const reportesDisponibles = [
        {
            id: '1',
            nombre: 'Terceros por Estado',
            descripcion: 'Estado de aprobación de terceros registrados',
            tipo: 'Operacional',
            frecuencia: 'Diario',
            icono: Users,
            color: 'text-[#0052CC]'
        },
        {
            id: '2',
            nombre: 'Métricas de Validación',
            descripcion: 'Resultados y eficiencia de validaciones',
            tipo: 'Técnico',
            frecuencia: 'Semanal',
            icono: BarChart3,
            color: 'text-[#FFD700]'
        },
        {
            id: '3',
            nombre: 'Actividad por Usuario',
            descripcion: 'Acciones realizadas por cada usuario del sistema',
            tipo: 'Auditoria',
            frecuencia: 'Mensual',
            icono: Activity,
            color: 'text-green-600'
        },
        {
            id: '4',
            nombre: 'Tiempos de Proceso',
            descripcion: 'Análisis de tiempos de aprobación y rechazo',
            tipo: 'Performance',
            frecuencia: 'Semanal',
            icono: Clock,
            color: 'text-purple-600'
        },
        {
            id: '5',
            nombre: 'Cumplimiento de Metas',
            descripcion: 'Progreso hacia objetivos mensuales y anuales',
            tipo: 'Gerencial',
            frecuencia: 'Mensual',
            icono: Target,
            color: 'text-red-600'
        },
        {
            id: '6',
            nombre: 'Documentos por Tipo',
            descripcion: 'Distribución y estado de documentos cargados',
            tipo: 'Operacional',
            frecuencia: 'Diario',
            icono: FileText,
            color: 'text-orange-600'
        }
    ];

    const getTipoColor = (tipo: string) => {
        const colores = {
            'Operacional': 'bg-[#0052CC] text-white',
            'Técnico': 'bg-[#FFD700] text-[#0052CC]',
            'Auditoria': 'bg-green-600 text-white',
            'Performance': 'bg-purple-600 text-white',
            'Gerencial': 'bg-red-600 text-white'
        };
        return colores[tipo as keyof typeof colores] || 'bg-gray-600 text-white';
    };

    return (
        <AppLayout
            userRole={user?.role || 'procesos'}
            userName={user?.email || 'Usuario'}
            currentPath="/reportes"
            onNavigate={handleNavigate}
            onLogout={handleLogout}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Centro de Reportes
                        </h1>
                        <p className="text-gray-600">
                            Análisis, métricas y reportes del sistema
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white">
                            <Filter className="h-4 w-4 mr-2" />
                            Filtros
                        </Button>
                        <Button className="bg-[#0052CC] hover:bg-[#003A8C] text-white">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Actualizar
                        </Button>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-l-4 border-[#0052CC] shadow-lg bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Total Reportes</CardTitle>
                            <FileText className="h-4 w-4 text-[#0052CC]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#0052CC]">{reportesData.total_reportes}</div>
                            <p className="text-xs text-gray-600">
                                Generados en total
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-[#FFD700] shadow-lg bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Este Mes</CardTitle>
                            <Calendar className="h-4 w-4 text-[#FFD700]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#F2C200]">{reportesData.reportes_mes}</div>
                            <p className="text-xs text-gray-600">
                                Reportes generados
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-green-600 shadow-lg bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Automáticos</CardTitle>
                            <BarChart3 className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{reportesData.reportes_automaticos}</div>
                            <p className="text-xs text-gray-600">
                                Generación automática
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-purple-600 shadow-lg bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Manuales</CardTitle>
                            <Users className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">{reportesData.reportes_manuales}</div>
                            <p className="text-xs text-gray-600">
                                Solicitados por usuarios
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card className="shadow-lg bg-white border-[#0052CC] border">
                    <CardHeader>
                        <CardTitle className="text-[#0052CC]">Acciones Rápidas</CardTitle>
                        <CardDescription>
                            Generar reportes frecuentes de forma inmediata
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button
                                className="h-auto p-4 justify-start border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white transition-colors"
                                variant="outline"
                            >
                                <TrendingUp className="h-5 w-5 mr-3" />
                                <div className="text-left">
                                    <div className="font-medium">Dashboard Ejecutivo</div>
                                    <div className="text-sm opacity-70">Métricas principales</div>
                                </div>
                            </Button>

                            <Button
                                className="h-auto p-4 justify-start border-[#FFD700] text-[#F2C200] hover:bg-[#FFD700] hover:text-[#0052CC] transition-colors"
                                variant="outline"
                            >
                                <Users className="h-5 w-5 mr-3" />
                                <div className="text-left">
                                    <div className="font-medium">Estado de Terceros</div>
                                    <div className="text-sm opacity-70">Reporte actual</div>
                                </div>
                            </Button>

                            <Button
                                className="h-auto p-4 justify-start border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-colors"
                                variant="outline"
                            >
                                <Download className="h-5 w-5 mr-3" />
                                <div className="text-left">
                                    <div className="font-medium">Exportar Datos</div>
                                    <div className="text-sm opacity-70">Excel/CSV/PDF</div>
                                </div>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Available Reports */}
                <Card className="shadow-lg bg-white border-[#FFD700] border">
                    <CardHeader>
                        <CardTitle className="text-[#0052CC]">Reportes Disponibles</CardTitle>
                        <CardDescription>
                            Catálogo completo de reportes del sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {reportesDisponibles.map((reporte) => (
                                <Card key={reporte.id} className="hover:shadow-md transition-shadow cursor-pointer border border-gray-200 hover:border-[#0052CC]">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <reporte.icono className={`h-6 w-6 ${reporte.color}`} />
                                            <Badge className={getTipoColor(reporte.tipo)}>
                                                {reporte.tipo}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-base">{reporte.nombre}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-600 mb-3">
                                            {reporte.descripcion}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">
                                                Frecuencia: {reporte.frecuencia}
                                            </span>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white h-8 px-3"
                                                >
                                                    Ver
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-[#FFD700] text-[#F2C200] hover:bg-[#FFD700] hover:text-[#0052CC] h-8 px-3"
                                                >
                                                    <Download className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
};

export default Reportes;
