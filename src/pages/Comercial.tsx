import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logoutUser } from "@/utils/logout.util";
import { 
    Users, 
    FileText, 
    Clock, 
    CheckCircle, 
    XCircle, 
    TrendingUp,
    AlertTriangle,
    Building2,
    DollarSign,
    Target
} from "lucide-react";

const Comercial = () => {
    const { user } = useAuth();
    const [comercialData, setComercialData] = useState({
        pendientes: 0,
        aprobados: 0,
        rechazados: 0,
        en_proceso: 0,
        meta_mensual: 50,
        avance_mes: 28
    });

    const handleLogout = () => {
        console.log('🔘 Comercial handleLogout llamado');
        logoutUser();
    };

    const handleNavigate = (path: string) => {
        window.location.href = path;
    };

    useEffect(() => {
        // Simular carga de datos comerciales
        // En producción esto vendría de la API
        setComercialData({
            pendientes: 12,
            aprobados: 28,
            rechazados: 3,
            en_proceso: 8,
            meta_mensual: 50,
            avance_mes: 28
        });
    }, []);

    return (
        <AppLayout
            userRole={user?.role || 'comercial'}
            userName={user?.email || 'Usuario'}
            currentPath="/comercial"
            onNavigate={handleNavigate}
            onLogout={handleLogout}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Área Comercial
                        </h1>
                        <p className="text-gray-600">
                            Gestión y seguimiento de procesos comerciales
                        </p>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-l-4 border-[#FFD700] shadow-lg bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Pendientes</CardTitle>
                            <Clock className="h-4 w-4 text-[#FFD700]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#F2C200]">{comercialData.pendientes}</div>
                            <p className="text-xs text-gray-600">
                                Requieren atención
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-green-600 shadow-lg bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Aprobados</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{comercialData.aprobados}</div>
                            <p className="text-xs text-gray-600">
                                Este mes
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-red-600 shadow-lg bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Rechazados</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{comercialData.rechazados}</div>
                            <p className="text-xs text-gray-600">
                                Necesitan corrección
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-[#0052CC] shadow-lg bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">En Proceso</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-[#0052CC]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#0052CC]">{comercialData.en_proceso}</div>
                            <p className="text-xs text-gray-600">
                                En revisión
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Progress Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-lg bg-white border-[#0052CC] border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-[#0052CC]">
                                <Target className="h-5 w-5" />
                                Meta Mensual
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Progreso</span>
                                    <span className="text-2xl font-bold text-[#0052CC]">
                                        {comercialData.avance_mes}/{comercialData.meta_mensual}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-[#0052CC] h-3 rounded-full transition-all duration-300"
                                        style={{
                                            width: `${(comercialData.avance_mes / comercialData.meta_mensual) * 100}%`
                                        }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">
                                        {Math.round((comercialData.avance_mes / comercialData.meta_mensual) * 100)}% completado
                                    </span>
                                    <span className="text-[#FFD700] font-medium">
                                        {comercialData.meta_mensual - comercialData.avance_mes} restantes
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg bg-white border-[#FFD700] border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-[#0052CC]">
                                <TrendingUp className="h-5 w-5" />
                                Rendimiento
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Tasa de Aprobación</span>
                                    <span className="text-2xl font-bold text-green-600">
                                        {Math.round((comercialData.aprobados / (comercialData.aprobados + comercialData.rechazados)) * 100)}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Eficiencia</span>
                                    <span className="text-lg font-semibold text-[#FFD700]">
                                        Alta
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button
                        className="h-auto p-4 justify-start border-[#FFD700] text-[#F2C200] hover:bg-[#FFD700] hover:text-[#0052CC] transition-colors"
                        variant="outline"
                        onClick={() => handleNavigate('/comercial/pendientes')}
                    >
                        <Clock className="h-5 w-5 mr-3" />
                        <div className="text-left">
                            <div className="font-medium">Ver Pendientes</div>
                            <div className="text-sm opacity-70">{comercialData.pendientes} elementos</div>
                        </div>
                    </Button>

                    <Button
                        className="h-auto p-4 justify-start border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-colors"
                        variant="outline"
                        onClick={() => handleNavigate('/comercial/aprobados')}
                    >
                        <CheckCircle className="h-5 w-5 mr-3" />
                        <div className="text-left">
                            <div className="font-medium">Ver Aprobados</div>
                            <div className="text-sm opacity-70">{comercialData.aprobados} elementos</div>
                        </div>
                    </Button>

                    <Button
                        className="h-auto p-4 justify-start border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white transition-colors"
                        variant="outline"
                        onClick={() => handleNavigate('/terceros/registro')}
                    >
                        <Building2 className="h-5 w-5 mr-3" />
                        <div className="text-left">
                            <div className="font-medium">Nuevo Tercero</div>
                            <div className="text-sm opacity-70">Registrar proveedor</div>
                        </div>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
};

export default Comercial;
