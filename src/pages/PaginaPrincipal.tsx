import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logoutUser } from "@/utils/logout.util";
import { 
    Building2, 
    Users, 
    FileText, 
    TrendingUp, 
    AlertCircle,
    CheckCircle,
    Clock,
    ArrowRight,
    BarChart3,
    PieChart,
    Activity
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PaginaPrincipal() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalTerceros: 0,
        pendientesAprobacion: 0,
        aprobados: 0,
        rechazados: 0
    });

    useEffect(() => {
        // Simular carga de stats reales - esto se conectaría a la API
        setStats({
            totalTerceros: 11,
            pendientesAprobacion: 6,
            aprobados: 2,
            rechazados: 2
        });
    }, []);

    const handleNavigate = (path: string) => {
        navigate(path);
    };

    const handleShowProfile = () => {
        console.log('🟢 PaginaPrincipal: handleShowProfile llamado');
        console.log('🟢 PaginaPrincipal: Navegando a /profile');
        navigate('/profile');
    };

    const handleLogout = () => {
        console.log('🔘 PaginaPrincipal handleLogout llamado');
        logoutUser();
    };

    const quickActions = [
        {
            title: "Nuevo Tercero",
            description: "Registrar nuevo proveedor o empleado",
            icon: Users,
            path: "/terceros/registro",
            color: "bg-[#0052CC]"
        },
        {
            title: "Lista de Terceros", 
            description: "Ver y gestionar terceros existentes",
            icon: FileText,
            path: "/terceros/lista",
            color: "bg-[#FFD700]"
        },
        {
            title: "Consolidado",
            description: "Dashboard de seguimiento completo",
            icon: BarChart3,
            path: "/consolidado-terceros",
            color: "bg-[#6F42C1]"
        },
        {
            title: "Dashboard",
            description: "Métricas y KPIs del sistema",
            icon: PieChart,
            path: "/dashboard",
            color: "bg-[#28A745]"
        }
    ];

    return (
        <AppLayout 
            userRole={user?.role || "user"}
            userName={user?.username || "Usuario"}
            currentPath="/dashboard/procesos"
            onNavigate={handleNavigate}
            onShowProfile={handleShowProfile}
            onLogout={handleLogout}
        >
            <div className="space-y-6">
                {/* Welcome Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-foreground">
                        Bienvenido, {user?.first_name || user?.username}
                    </h1>
                    <p className="text-muted-foreground">
                        Gestión integral de terceros - Panel principal
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-[#0052CC] shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Total Terceros</CardTitle>
                            <Users className="h-4 w-4 text-[#0052CC]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#0052CC]">{stats.totalTerceros}</div>
                            <p className="text-xs text-gray-600">
                                +2 desde el mes pasado
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-[#FFD700] shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Pendientes</CardTitle>
                            <Clock className="h-4 w-4 text-[#FFD700]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#F2C200]">{stats.pendientesAprobacion}</div>
                            <p className="text-xs text-gray-600">
                                Requieren revisión
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-green-600 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Aprobados</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.aprobados}</div>
                            <p className="text-xs text-gray-600">
                                Este mes
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-red-600 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Rechazados</CardTitle>
                            <AlertCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.rechazados}</div>
                            <p className="text-xs text-gray-600">
                                Requieren corrección
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Acciones Rápidas
                        </CardTitle>
                        <CardDescription>
                            Accesos directos a las funciones principales del sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {quickActions.map((action, index) => (
                                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate(action.path)}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-2 rounded-lg ${action.color}`}>
                                                <action.icon className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-sm">{action.title}</h3>
                                                <p className="text-xs text-muted-foreground">{action.description}</p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Actividad Reciente</CardTitle>
                        <CardDescription>
                            Últimas acciones en el sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Tercero aprobado</p>
                                    <p className="text-xs text-muted-foreground">Constructora ABC S.A.S - hace 2 horas</p>
                                </div>
                                <Badge variant="outline">Procesos</Badge>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Users className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Nuevo registro</p>
                                    <p className="text-xs text-muted-foreground">Juan Carlos Pérez - hace 5 horas</p>
                                </div>
                                <Badge variant="outline">Registro</Badge>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <Clock className="h-4 w-4 text-yellow-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Pendiente revisión</p>
                                    <p className="text-xs text-muted-foreground">Servicios Tech S.A.S - hace 1 día</p>
                                </div>
                                <Badge variant="outline">Comercial</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
