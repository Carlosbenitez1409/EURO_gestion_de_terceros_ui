import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from "@/context/AuthContext";
import { logoutUser } from "@/utils/logout.util";
import {
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Users,
    RefreshCw,
    Building2,
    UserPlus,
    TrendingUp,
    Activity,
    Wifi,
    WifiOff,
    BarChart3,
    UserCheck,
    FileCheck,
    AlertCircle,
    ArrowLeft
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDashboardData, useDataUpdateNotifications } from "@/hooks/useDashboardData";
import { usePagination } from "@/hooks/use-pagination";
import { UserAssignmentModal } from "@/components/admin/UserAssignmentModal";

interface DashboardProps {
    userRole: "procesos" | "comercial" | "gestion_humana" | "administrador" | "oficial_cumplimiento";
}

// Tipos específicos para Django API
interface DashboardMetricsReal {
    total_terceros: number;
    pendientes_aprobacion: number;
    aprobados: number;
    rechazados: number;
    por_tipo_persona: {
        natural: number;
        juridica: number;
    };
    creados_este_mes: number;
    aprobados_este_mes: number;
}

interface TerceroReal {
    id: string;
    numero_documento: string;
    nombre_completo?: string;  // 🔧 AGREGADO: Este es el campo que realmente envía el backend
    nombres?: string;
    apellidos?: string;
    razon_social?: string;
    email: string;
    estado_aprobacion: 'pendiente' | 'en_espera_correccion' | 'en_curso_comercial' | 'en_curso_administrador' | 'en_curso_procesos' | 'en_curso_cumplimiento' | 'asignada_administrador' | 'asignada_procesos' | 'asignada_oficial_cumplimiento' | 'devuelto_comercial' | 'aprobado' | 'rechazado' | 'finalizado'; // 🔧 ACTUALIZADO: 13 estados del backend
    tipo_persona: 'natural' | 'juridica';
    tipo_formulario: 'vinculacion' | 'actualizacion'; // 🆕 TIPO DE FORMULARIO (ahora requerido desde backend)
    created_at: string;
    asignado_a_nombre?: string;
    asignado_a_email?: string;
    comentarios_aprobacion?: string;
}

export default function Dashboard({ userRole }: DashboardProps) {
    const { user } = useAuth();
    // Cargar datos según el rol del usuario
    const { metrics, recentTerceros, loading, error, lastUpdated, refresh } = useDashboardData(true, 500000);

    // Estados para el modal de asignación
    const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
    const [selectedTercero, setSelectedTercero] = useState<TerceroReal | null>(null);

    // 🆕 Estado para filtro por estado
    const [filtroEstado, setFiltroEstado] = useState<string>('todos');
    
    // 🆕 Estado para filtro por tipo de formulario
    const [filtroTipoFormulario, setFiltroTipoFormulario] = useState<string>('todos');

    // 🔧 Helper function: Deducir tipo de formulario desde estado_aprobacion
    const deducirTipoFormulario = (tercero: TerceroReal): 'vinculacion' | 'actualizacion' => {
        // 1. Si el API ya proporciona el tipo_formulario, usarlo directamente
        if (tercero.tipo_formulario) {
            return tercero.tipo_formulario;
        }
        
                // 2. Inferir por estado: terceros que llegan directamente al administrador sin pasar por comercial
        if (['asignada_administrador', 'en_curso_administrador'].includes(tercero.estado_aprobacion)) {
            return 'actualizacion';
        }
        
        // Los terceros que pasan por el flujo comercial normal suelen ser vinculaciones
        if (['en_curso_comercial', 'devuelto_comercial'].includes(tercero.estado_aprobacion)) { // 🔧 ACTUALIZADO: quitar pendiente y asignado_comercial
            return 'vinculacion';
        }
        
        // 3. Fallback: asumir vinculación por defecto para nuevos terceros
        return 'vinculacion';
    };

    // Usar directamente los terceros filtrados por el backend según el usuario
    const getTercerosParaUsuario = () => {
        // El backend ya filtró por assigned_to para todos los roles
        // Solo aplicamos ordenamiento específico según el rol
        if (user?.role === "administrador") {
            // Administradores priorizan terceros finalizados para su revisión
            const terceros = recentTerceros;
            const finalizados = terceros.filter(tercero => 
                tercero.estado_aprobacion === 'finalizado'
            );
            const otros = terceros.filter(tercero => 
                tercero.estado_aprobacion !== 'finalizado'
            );
            const tercerosOrdenados = [...finalizados, ...otros];
            
            // 🆕 Aplicar filtros si están seleccionados
            let tercerosFiltrados = tercerosOrdenados;
            
            // Filtro por estado
            if (filtroEstado !== 'todos') {
                tercerosFiltrados = tercerosFiltrados.filter(tercero => tercero.estado_aprobacion === filtroEstado);
            }
            
            // Filtro por tipo de formulario
            if (filtroTipoFormulario !== 'todos') {
                tercerosFiltrados = tercerosFiltrados.filter(tercero => {
                    const tipoFormulario = tercero.tipo_formulario || deducirTipoFormulario(tercero);
                    return tipoFormulario === filtroTipoFormulario;
                });
            }
            
            return tercerosFiltrados;
        } else {
            // Para otros roles, mostrar todos los terceros asignados sin filtrado adicional
            // 🆕 Aplicar filtros si están seleccionados
            let tercerosFiltrados = recentTerceros;
            
            // Filtro por estado
            if (filtroEstado !== 'todos') {
                tercerosFiltrados = tercerosFiltrados.filter(tercero => tercero.estado_aprobacion === filtroEstado);
            }
            
            // Filtro por tipo de formulario
            if (filtroTipoFormulario !== 'todos') {
                tercerosFiltrados = tercerosFiltrados.filter(tercero => {
                    const tipoFormulario = tercero.tipo_formulario || deducirTipoFormulario(tercero);
                    return tipoFormulario === filtroTipoFormulario;
                });
            }
            
            return tercerosFiltrados;
        }
    };

    const tercerosFiltrados = getTercerosParaUsuario();
    
    // Calcular métricas individuales basadas en los terceros del usuario
    const getMetricasPersonalizadas = () => {
        const todos = tercerosFiltrados;
        
        // Métricas base para todos los roles
        const metricasBase = {
            total_terceros: todos.length,
            // Métricas por tipo de formulario
            vinculacion_count: todos.filter(t => {
                const tipo = t.tipo_formulario || deducirTipoFormulario(t);
                return tipo === 'vinculacion';
            }).length,
            actualizacion_count: todos.filter(t => {
                const tipo = t.tipo_formulario || deducirTipoFormulario(t);
                return tipo === 'actualizacion';
            }).length
        };
        
        // Para comerciales, calcular basándose en sus terceros asignados
        if (user?.role === "comercial") {
            return {
                ...metricasBase,
                pendientes_aprobacion: todos.filter(t => ['en_curso_comercial'].includes(t.estado_aprobacion)).length, // 🔧 ACTUALIZADO: Solo en_curso_comercial
                aprobados: todos.filter(t => ['aprobado', 'asignada_administrador', 'asignada_procesos', 'asignada_oficial_cumplimiento'].includes(t.estado_aprobacion)).length,
                rechazados: todos.filter(t => ['rechazado', 'devuelto_comercial'].includes(t.estado_aprobacion)).length // 🔧 ACTUALIZADO: incluir devuelto_comercial
            };
        } 
        // Para procesos, calcular basándose en sus terceros asignados
        else if (user?.role === "procesos") {
            return {
                ...metricasBase,
                pendientes_aprobacion: todos.filter(t => ['asignada_procesos'].includes(t.estado_aprobacion)).length, // 🔧 ACTUALIZADO: asignada_procesos
                aprobados: todos.filter(t => ['aprobado', 'asignada_oficial_cumplimiento'].includes(t.estado_aprobacion)).length,
                rechazados: todos.filter(t => t.estado_aprobacion === 'rechazado').length
            };
        }
        // Para administradores, usar métricas globales pero también calcular basándose en todos los terceros disponibles
        else {
            return {
                ...metricasBase,
                pendientes_aprobacion: todos.filter(t => ['asignada_administrador', 'asignada_procesos'].includes(t.estado_aprobacion)).length, // 🔧 ACTUALIZADO: Para administradores, principalmente asignada_administrador (actualizaciones)
                aprobados: todos.filter(t => t.estado_aprobacion === 'finalizado').length, // 🆕 Estado actualizado
                rechazados: todos.filter(t => t.estado_aprobacion === 'rechazado' || t.estado_aprobacion === 'devuelto_comercial').length // 🔧 ACTUALIZADO: devuelto_comercial
            };
        }
    };

    const metricasPersonalizadas = getMetricasPersonalizadas();
    
    // Hook de paginación para los terceros del dashboard
    const pagination = usePagination({
        data: tercerosFiltrados,
        initialItemsPerPage: 5, // 🆕 Aumentar de 5 a 10 elementos por página
        initialPage: 1
    });
    
    const { updateCount, notifyUpdate } = useDataUpdateNotifications();

    const getStatusBadge = (status: string) => {
        const variants = {
            // 🔧 ESTADOS BACKEND ACTUALIZADOS (13 estados)
            'pendiente': 'bg-[#FFD700] text-[#0052CC] border-[#FFD700]',
            'en_espera_correccion': 'bg-orange-100 text-orange-800 border-orange-200',
            'en_curso_comercial': 'bg-blue-100 text-blue-800 border-blue-200',
            'en_curso_administrador': 'bg-purple-100 text-purple-800 border-purple-200',
            'en_curso_procesos': 'bg-[#0052CC] text-white border-[#0052CC]',
            'en_curso_cumplimiento': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'asignada_administrador': 'bg-purple-100 text-purple-800 border-purple-200',
            'asignada_procesos': 'bg-[#0052CC] text-white border-[#0052CC]',
            'asignada_oficial_cumplimiento': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'devuelto_comercial': 'bg-orange-100 text-orange-800 border-orange-200',
            'aprobado': 'bg-green-100 text-green-800 border-green-200',
            'rechazado': 'bg-red-100 text-red-800 border-red-200',
            'finalizado': 'bg-green-500 text-white border-green-500',
            
            // 🔄 ESTADOS LEGACY (para compatibilidad con datos existentes)
            'asignado_comercial': 'bg-blue-100 text-blue-800 border-blue-200',
            'asignado_administrador': 'bg-purple-100 text-purple-800 border-purple-200',
            'asignado_procesos': 'bg-[#0052CC] text-white border-[#0052CC]',
            'enviado_cumplimiento': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'en_espera': 'bg-blue-100 text-blue-800 border-blue-200',
            'en_curso': 'bg-[#0052CC] text-white border-[#0052CC]',
            'devuelto': 'bg-orange-100 text-orange-800 border-orange-200',
            'aprobado_comercial': 'bg-green-100 text-green-800 border-green-200',
            'aprobado_final': 'bg-green-500 text-white border-green-500',
            'en_revision': 'bg-[#0052CC] text-white border-[#0052CC]'
        };
        return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // 🆕 Función para obtener el badge del tipo de formulario
    const getTipoFormularioBadge = (tipo: string) => {
        const variants = {
            'vinculacion': 'bg-blue-50 text-blue-700 border-blue-200',
            'actualizacion': 'bg-purple-50 text-purple-700 border-purple-200'
        };
        return variants[tipo as keyof typeof variants] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    // 🆕 Función para obtener el emoji del tipo de formulario
    const getTipoFormularioIcon = (tipo: string) => {
        switch (tipo) {
            case 'vinculacion': return '➕'; // Nuevo/Agregar
            case 'actualizacion': return '🔄'; // Actualizar/Renovar
            default: return '📄';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            // 🔧 ESTADOS BACKEND ACTUALIZADOS (13 estados)
            case 'pendiente': return <Clock className="h-4 w-4" />;
            case 'en_espera_correccion': return <AlertCircle className="h-4 w-4" />;
            case 'en_curso_comercial': return <Users className="h-4 w-4" />;
            case 'en_curso_administrador': return <UserCheck className="h-4 w-4" />;
            case 'en_curso_procesos': return <RefreshCw className="h-4 w-4" />;
            case 'en_curso_cumplimiento': return <FileCheck className="h-4 w-4" />;
            case 'asignada_administrador': return <UserCheck className="h-4 w-4" />;
            case 'asignada_procesos': return <RefreshCw className="h-4 w-4" />;
            case 'asignada_oficial_cumplimiento': return <FileCheck className="h-4 w-4" />;
            case 'devuelto_comercial': return <ArrowLeft className="h-4 w-4" />;
            case 'aprobado': return <CheckCircle className="h-4 w-4" />;
            case 'rechazado': return <XCircle className="h-4 w-4" />;
            case 'finalizado': return <CheckCircle className="h-4 w-4" />;
            
            // 🔄 Estados legacy (para compatibilidad)
            case 'asignado_comercial': return <Users className="h-4 w-4" />;
            case 'asignado_administrador': return <UserCheck className="h-4 w-4" />;
            case 'asignado_procesos': return <RefreshCw className="h-4 w-4" />;
            case 'enviado_cumplimiento': return <FileCheck className="h-4 w-4" />;
            case 'en_espera': return <Clock className="h-4 w-4" />;
            case 'en_curso': return <RefreshCw className="h-4 w-4" />;
            case 'devuelto': return <ArrowLeft className="h-4 w-4" />;
            case 'en_revision': return <RefreshCw className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    const getDisplayName = (tercero: any) => {
        // Debug: vamos a ver qué datos tenemos


        // Primero intentar con nombre_completo (que es lo que envía el backend)
        if (tercero.nombre_completo && tercero.nombre_completo.trim()) {
            return tercero.nombre_completo;
        }

        // Fallback: intentar con nombres y apellidos separados
        const nombreCompleto = `${tercero.nombres || ''} ${tercero.apellidos || ''}`.trim();
        if (nombreCompleto) {
            return nombreCompleto;
        }
        
        // Si no hay nombres/apellidos, intentar con razón social
        if (tercero.razon_social && tercero.razon_social.trim()) {
            return tercero.razon_social;
        }
        
        // Como último recurso, mostrar solo el número de documento
        return tercero.numero_documento;
    };

    // 🆕 Función para formatear los nombres de los estados de manera más legible
    const formatEstadoDisplay = (estado: string) => {
        const estadosFormateados = {
            'pendiente': 'Pendiente',
            'en_curso_comercial': 'En Curso Comercial',
            'en_curso_administrador': 'En Curso Admin',
            'en_curso_procesos': 'En Curso Procesos',
            'en_curso_cumplimiento': 'En Curso Cumplimiento',
            'asignada_administrador': 'Asignada Admin',
            'asignada_procesos': 'Asignada Procesos',
            'asignada_oficial_cumplimiento': 'Asignada Cumplimiento',
            'devuelto_comercial': 'Devuelto Comercial',
            'aprobado': 'Aprobado',
            'rechazado': 'Rechazado',
            'finalizado': 'Finalizado',
            // Estados legacy para compatibilidad
            'en_espera_correccion': 'En Espera Corrección',
            'asignado_comercial': 'Asignado Comercial',
            'asignado_administrador': 'Asignado Admin',
            'asignado_procesos': 'Asignado Procesos',
            'enviado_cumplimiento': 'Enviado Cumplimiento',
            'en_espera': 'En Espera',
            'en_curso': 'En Curso',
            'devuelto': 'Devuelto',
            'en_revision': 'En Revisión'
        };
        return estadosFormateados[estado as keyof typeof estadosFormateados] || estado;
    };

    const handleOpenAssignment = (tercero: TerceroReal) => {
        setSelectedTercero(tercero);
        setAssignmentModalOpen(true);
    };

    const handleAssignmentSuccess = () => {
        // Recargar datos después de una asignación exitosa
        refresh();
    };

    const handleLogout = () => {
        console.log('� Dashboard handleLogout llamado');
        logoutUser();
    };

    if (loading) {
        return (
            <AppLayout
                userRole={user?.role || 'procesos'}
                userName={user?.email || 'Usuario'}
                currentPath="/dashboard"
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
            userRole={user?.role || 'procesos'}
            userName={user?.email || 'Usuario'}
            currentPath="/dashboard"
            onNavigate={(path) => window.location.href = path}
            onLogout={handleLogout}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Dashboard - {
                                user?.role === 'procesos' ? 'Procesos' : 
                                user?.role === 'comercial' ? 'Comercial' : 
                                user?.role === 'administrador' ? 'Administrador' : 
                                user?.role === 'oficial_cumplimiento' ? 'Oficial de Cumplimiento' :
                                'Gestión Humana'
                            }
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
                            {updateCount > 0 && (
                                <Badge variant="outline" className="text-xs">
                                    {updateCount} actualizaciones
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={refresh} 
                            disabled={loading}
                            variant="outline"
                            className="gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </Button>
                        {loading && (
                            <div className="flex items-center text-sm text-gray-500">
                                <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                                Cargando...
                            </div>
                        )}
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
                            <CardTitle className="text-sm font-medium text-gray-700">
                                {user?.role === "comercial" ? "Terceros Asignados" : "Total Terceros"}
                            </CardTitle>
                            <Users className="h-4 w-4 text-[#0052CC]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#0052CC]">{metricasPersonalizadas?.total_terceros || 0}</div>
                            <p className="text-xs text-gray-600">
                                {user?.role === "comercial" 
                                    ? "Bajo tu gestión"
                                    : user?.role === "procesos"
                                    ? "Asignados a ti"
                                    : `${metrics?.creados_este_mes || 0} creados este mes`
                                }
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-[#FFD700] shadow-lg bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">
                                {user?.role === "comercial" ? "Por Revisar" : "Pendientes"}
                            </CardTitle>
                            <Clock className="h-4 w-4 text-[#FFD700]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#F2C200]">{metricasPersonalizadas?.pendientes_aprobacion || 0}</div>
                            <p className="text-xs text-gray-600">
                                {user?.role === "comercial" 
                                    ? "Requieren tu atención"
                                    : user?.role === "procesos"
                                    ? "En tu cola de trabajo"
                                    : "Requieren revisión"
                                }
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-green-600 shadow-lg bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">
                                {user?.role === "comercial" ? "Completados" : "Aprobados"}
                            </CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{metricasPersonalizadas?.aprobados || 0}</div>
                            <p className="text-xs text-gray-600">
                                {user?.role === "comercial" 
                                    ? "Procesados exitosamente"
                                    : user?.role === "procesos"
                                    ? "Completados por ti"
                                    : `${metrics?.aprobados_este_mes || 0} este mes`
                                }
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-red-600 shadow-lg bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">
                                {user?.role === "comercial" ? "Con Observaciones" : "Rechazados"}
                            </CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{metricasPersonalizadas?.rechazados || 0}</div>
                            <p className="text-xs text-gray-600">
                                {user?.role === "comercial" 
                                    ? "Requieren corrección"
                                    : user?.role === "procesos"
                                    ? "Rechazados por ti"
                                    : "Necesitan corrección"
                                }
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* 🆕 Métricas por Tipo de Formulario */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-l-4 border-blue-600 shadow-lg bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">
                                ➕ Terceros de Vinculación
                            </CardTitle>
                            <UserPlus className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {(metricasPersonalizadas as any)?.vinculacion_count || 0}
                            </div>
                            <p className="text-xs text-gray-600">
                                Nuevos terceros en proceso de vinculación
                            </p>
                            {filtroTipoFormulario === 'vinculacion' && (
                                <p className="text-xs text-blue-600 mt-1">📌 Filtro activo</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-purple-600 shadow-lg bg-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">
                                🔄 Terceros de Actualización
                            </CardTitle>
                            <RefreshCw className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                {(metricasPersonalizadas as any)?.actualizacion_count || 0}
                            </div>
                            <p className="text-xs text-gray-600">
                                Terceros existentes en actualización
                            </p>
                            {filtroTipoFormulario === 'actualizacion' && (
                                <p className="text-xs text-purple-600 mt-1">📌 Filtro activo</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Terceros */}
                <Card className="shadow-lg bg-white border-[#0052CC] border">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-[#0052CC]">
                            <span>
                                {user?.role === "comercial" ? "Terceros Pendientes de Revisión" :
                                    user?.role === "procesos" ? "Mis Terceros Asignados" :
                                    user?.role === "administrador" ? "Todos los Terceros (Priorizando Aprobados por Comerciales)" :
                                        "Terceros Recientes"}
                            </span>
                            <div className="flex items-center gap-2">
                                {user?.role === "comercial" && (
                                    <Badge variant="outline" className="text-xs">
                                        {pagination.totalItems} pendientes
                                    </Badge>
                                )}
                                {user?.role === "administrador" && (
                                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                                        {pagination.totalItems} terceros
                                    </Badge>
                                )}
                                {user?.role === "procesos" && (
                                    // Botón 'Asignar a Comercial' eliminado: ahora la asignación es directa desde el formulario
                                    null
                                )}
                            </div>
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            {user?.role === "comercial"
                                ? `${pagination.totalItems} terceros pendientes de revisión - Mostrando ${pagination.currentData.length} en esta página`
                                : user?.role === "procesos"
                                    ? `${pagination.totalItems} terceros en el sistema`
                                    : user?.role === "administrador"
                                        ? `${pagination.totalItems} terceros en el sistema (aprobados por comerciales aparecen primero) - Mostrando ${pagination.currentData.length} en esta página`
                                        : `${pagination.totalItems} terceros registrados en el sistema`
                            }
                        </CardDescription>
                    </CardHeader>
                    
                    {/* Filtros - Esquina derecha compacto */}
                    <div className="px-6 pb-2">
                        <div className="flex items-center justify-end gap-3">
                            {/* Filtro por Estado */}
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Estado:</span>
                                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                                    <SelectTrigger className="w-24 h-6 text-xs border-gray-200 min-w-0">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos</SelectItem>
                                        <SelectItem value="pendiente">Pendiente</SelectItem>
                                        <SelectItem value="en_curso_comercial">En Curso Comercial</SelectItem>
                                        <SelectItem value="en_curso_administrador">En Curso Admin</SelectItem>
                                        <SelectItem value="en_curso_procesos">En Curso Procesos</SelectItem>
                                        <SelectItem value="asignada_administrador">Asignada Admin</SelectItem>
                                        <SelectItem value="asignada_procesos">Asignada Procesos</SelectItem>
                                        <SelectItem value="asignada_oficial_cumplimiento">Asignada Cumplimiento</SelectItem>
                                        <SelectItem value="devuelto_comercial">Devuelto Comercial</SelectItem>
                                        <SelectItem value="aprobado">Aprobado</SelectItem>
                                        <SelectItem value="rechazado">Rechazado</SelectItem>
                                        <SelectItem value="finalizado">Finalizado</SelectItem>
                                    </SelectContent>
                                </Select>
                                {filtroEstado !== 'todos' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setFiltroEstado('todos')}
                                        className="h-5 w-5 p-0 text-xs text-muted-foreground hover:text-foreground hover:bg-gray-100"
                                    >
                                        ✕
                                    </Button>
                                )}
                            </div>
                            
                            {/* Filtro por Tipo de Formulario */}
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Tipo:</span>
                                <Select value={filtroTipoFormulario} onValueChange={setFiltroTipoFormulario}>
                                    <SelectTrigger className="w-28 h-6 text-xs border-gray-200 min-w-0">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos</SelectItem>
                                        <SelectItem value="vinculacion"> Vinculación</SelectItem>
                                        <SelectItem value="actualizacion"> Actualización</SelectItem>
                                    </SelectContent>
                                </Select>
                                {filtroTipoFormulario !== 'todos' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setFiltroTipoFormulario('todos')}
                                        className="h-5 w-5 p-0 text-xs text-muted-foreground hover:text-foreground hover:bg-gray-100"
                                    >
                                        ✕
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <CardContent>
                        {pagination.totalItems > 0 ? (
                            <>
                                <div className="space-y-3">
                                    {pagination.currentData.map((tercero) => (
                                    <div key={tercero.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#0052CC] transition-colors bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            {getStatusIcon(tercero.estado_aprobacion)}
                                            <div>
                                                <p className="font-medium text-gray-900">{getDisplayName(tercero)}</p>
                                                <p className="text-sm text-gray-600">
                                                    {tercero.email}
                                                </p>
                                                {/* Mostrar comercial asignado solo para procesos */}
                                                {user?.role === "procesos" && tercero.asignado_a_nombre && (
                                                    <p className="text-xs text-blue-600">
                                                        Asignado a: {tercero.asignado_a_nombre}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="flex gap-2">
                                                <Badge className={`${getStatusBadge(tercero.estado_aprobacion)} font-medium`}>
                                                    {formatEstadoDisplay(tercero.estado_aprobacion)}
                                                </Badge>
                                                {/* 🆕 Badge del tipo de formulario */}
                                                {(() => {
                                                    const tipoFormulario = tercero.tipo_formulario || deducirTipoFormulario(tercero);
                                                    return (
                                                        <Badge className={`${getTipoFormularioBadge(tipoFormulario)} font-medium text-xs`}>
                                                            {getTipoFormularioIcon(tipoFormulario)} {tipoFormulario === 'actualizacion' ? 'Actualización' : 'Vinculación'}
                                                        </Badge>
                                                    );
                                                })()}
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {new Date(tercero.created_at).toLocaleDateString()}
                                            </span>
                                            <div className="flex gap-2">
                                                {(user?.role === "comercial" || user?.role === "administrador" || user?.role === "procesos") && (
                                                    <>
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
                                                    </>
                                                )}
                                                {/* Botón especial para asignación de administradores */}
                                                {user?.role === "administrador" && tercero.estado_aprobacion === "aprobado_final" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white h-8 px-3"
                                                        onClick={() => handleOpenAssignment(tercero)}
                                                    >
                                                        Asignar
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                </div>
                                
                                {/* 🆕 Paginación Mejorada */}
                                {pagination.totalItems > 0 && (
                                    <div className="flex flex-col sm:flex-row items-center justify-between pt-6 gap-4">
                                        {/* Información de página */}
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>
                                                Página {pagination.currentPage} de {pagination.totalPages} 
                                            </span>
                                            <span>•</span>
                                            <span>
                                                Mostrando {pagination.startIndex} a {pagination.endIndex} de {pagination.totalItems} resultados
                                            </span>
                                        </div>
                                        
                                        {/* Controles de paginación */}
                                        <div className="flex items-center gap-4">
                                            {/* Selector de elementos por página */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">Mostrar:</span>
                                                <Select 
                                                    value={pagination.itemsPerPage.toString()} 
                                                    onValueChange={(value) => pagination.setItemsPerPage(Number(value))}
                                                >
                                                    <SelectTrigger className="w-20">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="5">5</SelectItem>
                                                        <SelectItem value="10">10</SelectItem>
                                                        <SelectItem value="20">20</SelectItem>
                                                        <SelectItem value="50">50</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            
                                            {/* Navegación de páginas */}
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={pagination.prevPage}
                                                    disabled={!pagination.hasPrevPage}
                                                >
                                                    Anterior
                                                </Button>
                                                
                                                {/* Páginas numeradas */}
                                                {pagination.totalPages <= 7 ? (
                                                    // Mostrar todas las páginas si son pocas
                                                    Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                                                        <Button
                                                            key={page}
                                                            variant={page === pagination.currentPage ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => pagination.goToPage(page)}
                                                            className="w-8 h-8 p-0"
                                                        >
                                                            {page}
                                                        </Button>
                                                    ))
                                                ) : (
                                                    // Para muchas páginas, mostrar con puntos suspensivos
                                                    <>
                                                        {pagination.currentPage > 3 && (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => pagination.goToPage(1)}
                                                                    className="w-8 h-8 p-0"
                                                                >
                                                                    1
                                                                </Button>
                                                                {pagination.currentPage > 4 && <span className="text-muted-foreground">...</span>}
                                                            </>
                                                        )}
                                                        
                                                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                                            const page = Math.max(1, Math.min(pagination.totalPages - 4, pagination.currentPage - 2)) + i;
                                                            if (page <= pagination.totalPages) {
                                                                return (
                                                                    <Button
                                                                        key={page}
                                                                        variant={page === pagination.currentPage ? "default" : "outline"}
                                                                        size="sm"
                                                                        onClick={() => pagination.goToPage(page)}
                                                                        className="w-8 h-8 p-0"
                                                                    >
                                                                        {page}
                                                                    </Button>
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                        
                                                        {pagination.currentPage < pagination.totalPages - 2 && (
                                                            <>
                                                                {pagination.currentPage < pagination.totalPages - 3 && <span className="text-muted-foreground">...</span>}
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => pagination.goToPage(pagination.totalPages)}
                                                                    className="w-8 h-8 p-0"
                                                                >
                                                                    {pagination.totalPages}
                                                                </Button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                                
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={pagination.nextPage}
                                                    disabled={!pagination.hasNextPage}
                                                >
                                                    Siguiente
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                {user?.role === "comercial" && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            ✅ ¡Excelente trabajo!
                                        </h3>
                                        <p className="text-gray-600">
                                            No tienes terceros pendientes de revisión. Los nuevos terceros aparecerán aquí cuando sean asignados automáticamente.
                                        </p>
                                    </div>
                                )}
                                {user?.role === "procesos" && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            No hay terceros en el sistema
                                        </h3>
                                        <p className="text-gray-600">
                                            Ahora los terceros se asignan automáticamente al comercial desde el formulario de registro.
                                        </p>
                                    </div>
                                )}
                                {user?.role === "gestion_humana" && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            No hay terceros registrados
                                        </h3>
                                        <p className="text-gray-600">
                                            Tu área se enfoca en la gestión de empleados.
                                        </p>
                                    </div>
                                )}
                                {user?.role === "administrador" && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            ✅ Todo al día
                                        </h3>
                                        <p className="text-gray-600">
                                            No hay terceros en el sistema. Los terceros aparecerán aquí cuando sean registrados.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal de asignación para administradores y procesos */}
            {assignmentModalOpen && selectedTercero && (
                <UserAssignmentModal
                    isOpen={assignmentModalOpen}
                    onClose={() => {
                        setAssignmentModalOpen(false);
                        setSelectedTercero(null);
                    }}
                    tercero={selectedTercero}
                    onAssignmentSuccess={handleAssignmentSuccess}
                    userRole={user?.role || 'administrador'} // 🆕 Agregado
                    limitToRoles={
                        user?.role === 'comercial' ? ['administrador'] :
                        user?.role === 'procesos' ? ['comercial', 'oficial_cumplimiento'] :
                        user?.role === 'oficial_cumplimiento' ? ['administrador'] :
                        undefined // Administrador puede ver todos los roles
                    }
                />
            )}
        </AppLayout>
    );
}
