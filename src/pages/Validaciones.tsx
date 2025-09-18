import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { logoutUser } from '@/utils/logout.util';
import { 
    Shield, 
    CheckCircle2, 
    AlertTriangle, 
    Clock, 
    Filter,
    Eye,
    Play,
    Pause,
    Settings,
    FileText,
    Users,
    Zap,
    RefreshCw
} from 'lucide-react';

// Interfaces para Validaciones
interface ReglaValidacion {
    id: string;
    nombre: string;
    descripcion: string;
    tipo: 'automatica' | 'manual';
    activa: boolean;
    prioridad: 'alta' | 'media' | 'baja';
    criterios: string[];
    acciones: string[];
    fecha_creacion: string;
    ultima_ejecucion?: string;
    tasa_exito: number;
}

interface ProcesoValidacion {
    id: string;
    tercero_id: string;
    tercero_nombre: string;
    tercero_documento: string;
    tipo_validacion: 'automatica' | 'manual';
    regla_aplicada: string;
    estado: 'pendiente' | 'en_proceso' | 'completado' | 'fallido' | 'requiere_revision';
    resultado?: 'aprobado' | 'rechazado' | 'requiere_ajustes';
    observaciones?: string;
    fecha_inicio: string;
    fecha_fin?: string;
    asignado_a?: string;
    prioridad: 'alta' | 'media' | 'baja';
    documentos_asociados: string[];
}

interface EstadisticasValidacion {
    total_validaciones: number;
    automaticas_activas: number;
    manuales_pendientes: number;
    completadas_hoy: number;
    tasa_exito_automaticas: number;
    tiempo_promedio_manual: number;
    validaciones_por_estado: {
        pendiente: number;
        en_proceso: number;
        completado: number;
        fallido: number;
        requiere_revision: number;
    };
}

export default function Validaciones() {
    const { user } = useAuth();
    const [estadisticas, setEstadisticas] = useState<EstadisticasValidacion>({
        total_validaciones: 0,
        automaticas_activas: 0,
        manuales_pendientes: 0,
        completadas_hoy: 0,
        tasa_exito_automaticas: 0,
        tiempo_promedio_manual: 0,
        validaciones_por_estado: {
            pendiente: 0,
            en_proceso: 0,
            completado: 0,
            fallido: 0,
            requiere_revision: 0
        }
    });
    const [validacionesAutomaticas, setValidacionesAutomaticas] = useState<ReglaValidacion[]>([]);
    const [validacionesManuales, setValidacionesManuales] = useState<ProcesoValidacion[]>([]);
    const [filtros, setFiltros] = useState({
        busqueda: "",
        estado: "all",
        tipo: "all",
        prioridad: "all"
    });
    const [loading, setLoading] = useState(true);
    const [selectedValidacion, setSelectedValidacion] = useState<ProcesoValidacion | ReglaValidacion | null>(null);

    const handleLogout = () => {
        logoutUser();
    };

    const handleNavigate = (path: string) => {
        window.location.href = path;
    };

    // Funciones para cargar datos desde la API
    const cargarEstadisticas = async () => {
        try {
            const response = await fetch('/api/validaciones/estadisticas/');
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    setEstadisticas(data);
                } else {
                    throw new Error('Respuesta no es JSON válido');
                }
            } else {
                // Datos simulados para desarrollo
                setEstadisticas({
                    total_validaciones: 1456,
                    automaticas_activas: 23,
                    manuales_pendientes: 47,
                    completadas_hoy: 156,
                    tasa_exito_automaticas: 94.2,
                    tiempo_promedio_manual: 2.5,
                    validaciones_por_estado: {
                        pendiente: 47,
                        en_proceso: 23,
                        completado: 1298,
                        fallido: 34,
                        requiere_revision: 54
                    }
                });
            }
        } catch (error) {
            console.error('Error cargando estadísticas de validaciones:', error);
            // Fallback con datos simulados
            setEstadisticas({
                total_validaciones: 1456,
                automaticas_activas: 23,
                manuales_pendientes: 47,
                completadas_hoy: 156,
                tasa_exito_automaticas: 94.2,
                tiempo_promedio_manual: 2.5,
                validaciones_por_estado: {
                    pendiente: 47,
                    en_proceso: 23,
                    completado: 1298,
                    fallido: 34,
                    requiere_revision: 54
                }
            });
        }
    };

    const cargarValidacionesAutomaticas = async () => {
        try {
            const response = await fetch('/api/validaciones/automaticas/');
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    setValidacionesAutomaticas(data.results || data || []);
                } else {
                    throw new Error('Respuesta no es JSON válido');
                }
            } else {
                // Datos simulados para desarrollo
                const mockData: ReglaValidacion[] = [
                    {
                        id: "1",
                        nombre: "Validación RUT Automática",
                        descripcion: "Verifica formato y validez del RUT en DIAN",
                        tipo: "automatica",
                        activa: true,
                        prioridad: "alta",
                        criterios: [
                            "Formato RUT válido",
                            "Estado activo en DIAN",
                            "Actividad económica registrada"
                        ],
                        acciones: [
                            "Consulta API DIAN",
                            "Validación dígito verificador",
                            "Verificación estado tributario"
                        ],
                        fecha_creacion: "2025-07-15T10:00:00Z",
                        ultima_ejecucion: "2025-08-11T08:30:00Z",
                        tasa_exito: 96.8
                    },
                    {
                        id: "2",
                        nombre: "Validación Cédula REGISTRADURÍA",
                        descripcion: "Verifica cédulas contra base de datos Registraduría",
                        tipo: "automatica",
                        activa: true,
                        prioridad: "alta",
                        criterios: [
                            "Número válido",
                            "Persona viva",
                            "Datos biográficos coincidentes"
                        ],
                        acciones: [
                            "Consulta Registraduría",
                            "Validación estado civil",
                            "Verificación datos personales"
                        ],
                        fecha_creacion: "2025-07-20T14:15:00Z",
                        ultima_ejecucion: "2025-08-11T09:15:00Z",
                        tasa_exito: 94.3
                    },
                    {
                        id: "3",
                        nombre: "Validación Referencias Comerciales",
                        descripcion: "Consulta automática en centrales de riesgo",
                        tipo: "automatica",
                        activa: true,
                        prioridad: "media",
                        criterios: [
                            "Score crediticio",
                            "Reportes negativos",
                            "Capacidad de pago"
                        ],
                        acciones: [
                            "Consulta DataCrédito",
                            "Consulta CIFIN",
                            "Análisis score crediticio"
                        ],
                        fecha_creacion: "2025-08-01T11:30:00Z",
                        ultima_ejecucion: "2025-08-11T07:45:00Z",
                        tasa_exito: 91.7
                    }
                ];
                setValidacionesAutomaticas(mockData);
            }
        } catch (error) {
            console.error('Error cargando validaciones automáticas:', error);
            setValidacionesAutomaticas([]);
        }
    };

    const cargarValidacionesManuales = async () => {
        try {
            const response = await fetch('/api/validaciones/manuales/');
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    setValidacionesManuales(data.results || data || []);
                } else {
                    throw new Error('Respuesta no es JSON válido');
                }
            } else {
                // Datos simulados para desarrollo
                const mockData: ProcesoValidacion[] = [
                    {
                        id: "1",
                        tercero_id: "uuid-1",
                        tercero_nombre: "Constructora EURO S.A.S",
                        tercero_documento: "900123456-1",
                        tipo_validacion: "manual",
                        regla_aplicada: "Validación Integral Proveedor",
                        estado: "pendiente",
                        fecha_inicio: "2025-08-11T09:00:00Z",
                        asignado_a: "María González",
                        prioridad: "alta",
                        documentos_asociados: ["RUT", "Cámara de Comercio", "Referencias Comerciales"]
                    },
                    {
                        id: "2",
                        tercero_id: "uuid-2",
                        tercero_nombre: "Juan Carlos Pérez",
                        tercero_documento: "12345678",
                        tipo_validacion: "manual",
                        regla_aplicada: "Validación Cliente Natural",
                        estado: "en_proceso",
                        fecha_inicio: "2025-08-11T08:15:00Z",
                        asignado_a: "Carlos Ramírez",
                        prioridad: "media",
                        documentos_asociados: ["Cédula", "Comprobante Ingresos"]
                    },
                    {
                        id: "3",
                        tercero_id: "uuid-3",
                        tercero_nombre: "Distribuidora ABC Ltda",
                        tercero_documento: "800987654-3",
                        tipo_validacion: "manual",
                        regla_aplicada: "Validación Proveedor Crítico",
                        estado: "requiere_revision",
                        resultado: "requiere_ajustes",
                        observaciones: "Documentos financieros incompletos. Solicitar estados financieros actualizados.",
                        fecha_inicio: "2025-08-10T14:30:00Z",
                        fecha_fin: "2025-08-11T10:45:00Z",
                        asignado_a: "Ana Martínez",
                        prioridad: "alta",
                        documentos_asociados: ["RUT", "Estados Financieros", "Certificaciones"]
                    }
                ];
                setValidacionesManuales(mockData);
            }
        } catch (error) {
            console.error('Error cargando validaciones manuales:', error);
            setValidacionesManuales([]);
        }
    };

    useEffect(() => {
        const cargarDatos = async () => {
            setLoading(true);
            await Promise.all([
                cargarEstadisticas(),
                cargarValidacionesAutomaticas(),
                cargarValidacionesManuales()
            ]);
            setLoading(false);
        };
        cargarDatos();
    }, []);

    const getEstadoBadge = (estado: string) => {
        const variants = {
            'pendiente': 'bg-[#FFD700] text-[#0052CC] border-[#FFD700]',
            'en_proceso': 'bg-blue-100 text-blue-800 border-blue-200',
            'completado': 'bg-green-100 text-green-800 border-green-200',
            'fallido': 'bg-red-100 text-red-800 border-red-200',
            'requiere_revision': 'bg-orange-100 text-orange-800 border-orange-200'
        };
        return variants[estado as keyof typeof variants] || 'bg-gray-100 text-gray-800';
    };

    const getPrioridadBadge = (prioridad: string) => {
        const variants = {
            'alta': 'bg-red-100 text-red-800 border-red-200',
            'media': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'baja': 'bg-green-100 text-green-800 border-green-200'
        };
        return variants[prioridad as keyof typeof variants] || 'bg-gray-100 text-gray-800';
    };

    // Filtrado de validaciones manuales
    const validacionesManualesFiltradas = validacionesManuales.filter(validacion => {
        const matchesBusqueda = validacion.tercero_nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
                               validacion.tercero_documento.includes(filtros.busqueda);
        const matchesEstado = filtros.estado === 'all' || validacion.estado === filtros.estado;
        const matchesPrioridad = filtros.prioridad === 'all' || validacion.prioridad === filtros.prioridad;
        
        return matchesBusqueda && matchesEstado && matchesPrioridad;
    });

    if (loading) {
        return (
            <AppLayout
                userRole={user?.role || 'procesos'}
                userName={user?.email || 'Usuario'}
                currentPath="/validaciones"
                onLogout={handleLogout}
                onNavigate={handleNavigate}
            >
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex items-center space-x-3">
                        <RefreshCw className="h-8 w-8 animate-spin text-[#0052CC]" />
                        <span className="text-lg text-gray-600">Cargando validaciones...</span>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            userRole={user?.role || 'procesos'}
            userName={user?.email || 'Usuario'}
            currentPath="/validaciones"
            onLogout={handleLogout}
            onNavigate={handleNavigate}
        >
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Shield className="h-8 w-8 text-[#0052CC]" />
                            Sistema de Validaciones
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Gestión integral de validaciones automáticas y procesos manuales
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            onClick={() => window.location.reload()}
                            variant="outline"
                            className="border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Actualizar
                        </Button>
                        <Button 
                            onClick={() => handleNavigate('/configuracion/validaciones')}
                            className="bg-[#0052CC] hover:bg-[#003A8C] text-white"
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar Reglas
                        </Button>
                    </div>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Total Validaciones"
                        value={estadisticas.total_validaciones.toLocaleString()}
                        icon={Shield}
                        trend={{ value: 12, label: "+12%" }}
                        className="border-[#E3F2FD]"
                    />
                    <MetricCard
                        title="Automáticas Activas"
                        value={estadisticas.automaticas_activas.toString()}
                        icon={Zap}
                        trend={{ value: 8, label: "+8%" }}
                        className="border-[#E8F5E8]"
                    />
                    <MetricCard
                        title="Manuales Pendientes"
                        value={estadisticas.manuales_pendientes.toString()}
                        icon={Clock}
                        trend={{ value: 15, label: "+15%" }}
                        className="border-[#FFF3CD]"
                    />
                    <MetricCard
                        title="Completadas Hoy"
                        value={estadisticas.completadas_hoy.toString()}
                        icon={CheckCircle2}
                        trend={{ value: 23, label: "+23%" }}
                        className="border-[#D1ECF1]"
                    />
                </div>

                {/* Estadísticas Adicionales */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="border-[#E3F2FD]">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-600">Tasa de Éxito Automáticas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#0052CC]">
                                {estadisticas.tasa_exito_automaticas}%
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                De validaciones automáticas exitosas
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-[#E8F5E8]">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-600">Tiempo Promedio Manual</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {estadisticas.tiempo_promedio_manual}h
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Tiempo de resolución manual
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-[#FFF3CD]">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-600">Estados Validaciones</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600">Pendientes</span>
                                    <Badge variant="outline" className="bg-[#FFD700] text-[#0052CC]">
                                        {estadisticas.validaciones_por_estado.pendiente}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600">En Proceso</span>
                                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                        {estadisticas.validaciones_por_estado.en_proceso}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600">Completadas</span>
                                    <Badge variant="outline" className="bg-green-100 text-green-800">
                                        {estadisticas.validaciones_por_estado.completado}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs para Automáticas y Manuales */}
                <Tabs defaultValue="automaticas" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                        <TabsTrigger value="automaticas" className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Automáticas ({validacionesAutomaticas.length})
                        </TabsTrigger>
                        <TabsTrigger value="manuales" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Manuales ({validacionesManuales.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="automaticas" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-[#0052CC]" />
                                    Reglas de Validación Automática
                                </CardTitle>
                                <CardDescription>
                                    Configuración y monitoreo de validaciones automáticas del sistema
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {validacionesAutomaticas.map((regla) => (
                                        <div key={regla.id} className="border rounded-lg p-4 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <h3 className="font-semibold text-gray-900">{regla.nombre}</h3>
                                                    <p className="text-sm text-gray-600">{regla.descripcion}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={getPrioridadBadge(regla.prioridad)}>
                                                        {regla.prioridad.toUpperCase()}
                                                    </Badge>
                                                    <Badge 
                                                        variant={regla.activa ? "default" : "secondary"}
                                                        className={regla.activa ? "bg-green-100 text-green-800" : ""}
                                                    >
                                                        {regla.activa ? "Activa" : "Inactiva"}
                                                    </Badge>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium text-gray-700">Tasa de Éxito:</span>
                                                    <div className="text-lg font-bold text-[#0052CC]">{regla.tasa_exito}%</div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-700">Última Ejecución:</span>
                                                    <div className="text-gray-600">
                                                        {regla.ultima_ejecucion ? 
                                                            new Date(regla.ultima_ejecucion).toLocaleString() : 
                                                            'No ejecutada'
                                                        }
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-700">Criterios:</span>
                                                    <div className="text-gray-600">{regla.criterios.length} configurados</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-2">
                                                <Button variant="outline" size="sm">
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Ver Detalles
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    <Settings className="h-4 w-4 mr-1" />
                                                    Configurar
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className={regla.activa ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}
                                                >
                                                    {regla.activa ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                                                    {regla.activa ? "Pausar" : "Activar"}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="manuales" className="space-y-6">
                        {/* Filtros para validaciones manuales */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Filter className="h-5 w-5 text-[#0052CC]" />
                                    Filtros de Búsqueda
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <Input
                                            placeholder="Buscar tercero..."
                                            value={filtros.busqueda}
                                            onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
                                            className="w-full"
                                        />
                                    </div>
                                    <Select 
                                        value={filtros.estado} 
                                        onValueChange={(value) => setFiltros({...filtros, estado: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Estado..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los estados</SelectItem>
                                            <SelectItem value="pendiente">Pendiente</SelectItem>
                                            <SelectItem value="en_proceso">En Proceso</SelectItem>
                                            <SelectItem value="completado">Completado</SelectItem>
                                            <SelectItem value="fallido">Fallido</SelectItem>
                                            <SelectItem value="requiere_revision">Requiere Revisión</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select 
                                        value={filtros.prioridad} 
                                        onValueChange={(value) => setFiltros({...filtros, prioridad: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Prioridad..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas las prioridades</SelectItem>
                                            <SelectItem value="alta">Alta</SelectItem>
                                            <SelectItem value="media">Media</SelectItem>
                                            <SelectItem value="baja">Baja</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setFiltros({ busqueda: "", estado: "all", tipo: "all", prioridad: "all" })}
                                        className="border-[#FFD700] text-[#F2C200] hover:bg-[#FFD700] hover:text-[#0052CC]"
                                    >
                                        Limpiar Filtros
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tabla de validaciones manuales */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-[#0052CC]" />
                                    Procesos de Validación Manual ({validacionesManualesFiltradas.length})
                                </CardTitle>
                                <CardDescription>
                                    Gestión de validaciones que requieren intervención manual
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tercero</TableHead>
                                            <TableHead>Regla Aplicada</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead>Prioridad</TableHead>
                                            <TableHead>Asignado</TableHead>
                                            <TableHead>Inicio</TableHead>
                                            <TableHead>Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {validacionesManualesFiltradas.map((validacion) => (
                                            <TableRow key={validacion.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{validacion.tercero_nombre}</div>
                                                        <div className="text-sm text-gray-500">{validacion.tercero_documento}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">{validacion.regla_aplicada}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getEstadoBadge(validacion.estado)}>
                                                        {validacion.estado.replace('_', ' ').toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getPrioridadBadge(validacion.prioridad)}>
                                                        {validacion.prioridad.toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">{validacion.asignado_a || 'No asignado'}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {new Date(validacion.fecha_inicio).toLocaleDateString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm"
                                                                    onClick={() => setSelectedValidacion(validacion)}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-2xl">
                                                                <DialogHeader>
                                                                    <DialogTitle>Detalles de Validación</DialogTitle>
                                                                    <DialogDescription>
                                                                        Información completa del proceso de validación
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                {selectedValidacion && 'tercero_nombre' in selectedValidacion && (
                                                                    <div className="space-y-4">
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            <div>
                                                                                <h4 className="font-semibold text-gray-700">Tercero</h4>
                                                                                <p>{selectedValidacion.tercero_nombre}</p>
                                                                                <p className="text-sm text-gray-500">{selectedValidacion.tercero_documento}</p>
                                                                            </div>
                                                                            <div>
                                                                                <h4 className="font-semibold text-gray-700">Estado</h4>
                                                                                <Badge className={getEstadoBadge(selectedValidacion.estado)}>
                                                                                    {selectedValidacion.estado.replace('_', ' ').toUpperCase()}
                                                                                </Badge>
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-semibold text-gray-700">Documentos Asociados</h4>
                                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                                {selectedValidacion.documentos_asociados.map((doc, index) => (
                                                                                    <Badge key={index} variant="outline">
                                                                                        <FileText className="h-3 w-3 mr-1" />
                                                                                        {doc}
                                                                                    </Badge>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                        {selectedValidacion.observaciones && (
                                                                            <div>
                                                                                <h4 className="font-semibold text-gray-700">Observaciones</h4>
                                                                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                                                                    {selectedValidacion.observaciones}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </DialogContent>
                                                        </Dialog>
                                                        <Button variant="outline" size="sm">
                                                            Procesar
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}