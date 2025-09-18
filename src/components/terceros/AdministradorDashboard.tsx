import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    UserCheck, 
    Users, 
    Clock, 
    AlertCircle, 
    CheckCircle, 
    XCircle, 
    RefreshCw, 
    Settings, 
    History, 
    Eye,
    BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EstadoAsignacionModal } from "@/components/common/EstadoAsignacionModal";
import { HistorialModal } from "@/components/common/HistorialModal";
import { tercerosDRFService } from "@/services/terceros.drf.service";

// 🆕 Interface actualizada para el nuevo sistema (13 estados específicos)
interface TerceroAdmin {
    id: string;
    nombre_completo: string;
    numero_documento: string;
    tipo_tercero: string;
    tipo_persona: 'natural' | 'juridica';
    fecha_registro: string;
    estado_aprobacion: 'pendiente' | 'en_espera_correccion' | 'en_curso_comercial' | 'en_curso_administrador' | 'en_curso_procesos' | 'en_curso_cumplimiento' | 'asignada_administrador' | 'asignada_procesos' | 'asignada_oficial_cumplimiento' | 'devuelto_comercial' | 'aprobado' | 'rechazado' | 'finalizado';
    usuario_asignado?: {
        id: number;
        username: string;
        full_name: string;
    } | null;
    rol_asignado?: 'comercial' | 'procesos' | 'oficial_cumplimiento' | 'administrador';
    fecha_asignacion?: string;
}

// 🎯 Helper para badges de estado
const getEstadoBadge = (estado: string) => {
    const badgeConfig = {
        'pendiente': { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-700', icon: Clock },
        'en_espera': { variant: 'outline' as const, className: 'border-yellow-300 text-yellow-700', icon: Clock },
        'en_curso': { variant: 'default' as const, className: 'bg-blue-500 text-white', icon: RefreshCw },
        'devuelto': { variant: 'destructive' as const, className: 'bg-orange-500 text-white', icon: AlertCircle },
        'aprobado': { variant: 'default' as const, className: 'bg-green-500 text-white', icon: CheckCircle },
        'rechazado': { variant: 'destructive' as const, className: '', icon: XCircle },
        'finalizado': { variant: 'outline' as const, className: 'border-green-300 text-green-700', icon: CheckCircle }
    };

    const config = badgeConfig[estado as keyof typeof badgeConfig] || badgeConfig.pendiente;
    const IconComponent = config.icon;

    return (
        <Badge variant={config.variant} className={`${config.className} flex items-center gap-1`}>
            <IconComponent className="h-3 w-3" />
            {estado.charAt(0).toUpperCase() + estado.slice(1).replace('_', ' ')}
        </Badge>
    );
};

interface AdministradorDashboardProps {
    onRefresh?: () => void;
}

export function AdministradorDashboard({ onRefresh }: AdministradorDashboardProps) {
    const [terceros, setTerceros] = useState<TerceroAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'en_espera' | 'en_curso' | 'devuelto' | 'aprobado' | 'rechazado' | 'finalizado'>('todos');
    
    // 🆕 Estados para modales nuevos
    const [terceroSeleccionado, setTerceroSeleccionado] = useState<TerceroAdmin | null>(null);
    const [estadoModalOpen, setEstadoModalOpen] = useState(false);
    const [historialModalOpen, setHistorialModalOpen] = useState(false);
    
    const { toast } = useToast();

    // 🆕 Funciones para cargar datos con la nueva API
    const cargarDatos = async () => {
        setLoading(true);
        try {
            // TODO: Implementar llamada a API real cuando esté disponible
            // Por ahora usar datos mock similares al ComercialDashboard
            const tercerosData = await tercerosDRFService.getTerceros({
                page: 1,
                page_size: 100
            });

            // Transformar datos para match con interface
            const tercerosTransformados: TerceroAdmin[] = tercerosData.results?.map(tercero => ({
                id: tercero.id.toString(),
                nombre_completo: tercero.nombres + (tercero.apellidos ? ` ${tercero.apellidos}` : '') || tercero.razon_social || 'Sin nombre',
                numero_documento: tercero.numero_documento || 'N/A',
                tipo_tercero: tercero.tipo_persona === 'natural' ? 'Empleado' : 'Proveedor',
                tipo_persona: tercero.tipo_persona || 'natural',
                fecha_registro: tercero.created_at || new Date().toISOString(),
                estado_aprobacion: tercero.estado_aprobacion || 'pendiente',
                usuario_asignado: tercero.usuario_asignado ? {
                    ...tercero.usuario_asignado,
                    full_name: tercero.usuario_asignado.full_name || 
                             `${tercero.usuario_asignado.first_name} ${tercero.usuario_asignado.last_name}`
                } : null,
                rol_asignado: tercero.rol_asignado || undefined,
                fecha_asignacion: tercero.fecha_asignacion || undefined
            })) || [];

            setTerceros(tercerosTransformados);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron cargar los terceros",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    // 🆕 Funciones para nuevos modales
    const abrirEstadoModal = (tercero: TerceroAdmin) => {
        setTerceroSeleccionado(tercero);
        setEstadoModalOpen(true);
    };

    const abrirHistorialModal = (tercero: TerceroAdmin) => {
        setTerceroSeleccionado(tercero);
        setHistorialModalOpen(true);
    };

    const handleEstadoSuccess = () => {
        cargarDatos();
    };

    // 🆕 Estadísticas para el nuevo sistema (13 estados específicos)
    const stats = {
        total: terceros.length,
        pendientes: terceros.filter(t => t.estado_aprobacion === 'pendiente').length,
        enEspera: terceros.filter(t => t.estado_aprobacion === 'en_espera_correccion').length,
        enCurso: terceros.filter(t => ['en_curso_administrador', 'asignada_administrador'].includes(t.estado_aprobacion)).length,
        devueltos: terceros.filter(t => t.estado_aprobacion === 'devuelto_comercial').length,
        aprobados: terceros.filter(t => t.estado_aprobacion === 'aprobado').length,
        finalizados: terceros.filter(t => t.estado_aprobacion === 'finalizado').length
    };

    // 🆕 Filtrar terceros
    const tercerosFiltrados = terceros.filter(tercero => {
        if (filtroEstado === 'todos') return true;
        return tercero.estado_aprobacion === filtroEstado;
    });

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Cargando...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard Administrador</h2>
                    <p className="text-gray-600">Vista completa de todos los terceros del sistema</p>
                </div>
                <Button onClick={cargarDatos} className="bg-[#0052CC] hover:bg-[#003A8C]">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                </Button>
            </div>

            {/* 🆕 Estadísticas de Estados */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                        <Clock className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-600">{stats.pendientes}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">En Curso</CardTitle>
                        <RefreshCw className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.enCurso}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.finalizados}</div>
                    </CardContent>
                </Card>
            </div>

            {/* 🆕 Filtros por Estado */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={filtroEstado === 'todos' ? 'default' : 'outline'}
                            onClick={() => setFiltroEstado('todos')}
                            size="sm"
                        >
                            Todos ({stats.total})
                        </Button>
                        <Button
                            variant={filtroEstado === 'pendiente' ? 'default' : 'outline'}
                            onClick={() => setFiltroEstado('pendiente')}
                            size="sm"
                        >
                            Pendientes ({stats.pendientes})
                        </Button>
                        <Button
                            variant={filtroEstado === 'en_espera' ? 'default' : 'outline'}
                            onClick={() => setFiltroEstado('en_espera')}
                            size="sm"
                        >
                            En Espera ({stats.enEspera})
                        </Button>
                        <Button
                            variant={filtroEstado === 'en_curso' ? 'default' : 'outline'}
                            onClick={() => setFiltroEstado('en_curso')}
                            size="sm"
                        >
                            En Curso ({stats.enCurso})
                        </Button>
                        <Button
                            variant={filtroEstado === 'devuelto' ? 'default' : 'outline'}
                            onClick={() => setFiltroEstado('devuelto')}
                            size="sm"
                        >
                            Devueltos ({stats.devueltos})
                        </Button>
                        <Button
                            variant={filtroEstado === 'aprobado' ? 'default' : 'outline'}
                            onClick={() => setFiltroEstado('aprobado')}
                            size="sm"
                        >
                            Aprobados ({stats.aprobados})
                        </Button>
                        <Button
                            variant={filtroEstado === 'finalizado' ? 'default' : 'outline'}
                            onClick={() => setFiltroEstado('finalizado')}
                            size="sm"
                        >
                            Finalizados ({stats.finalizados})
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 🆕 Tabla de Terceros */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-[#0052CC]" />
                        Terceros ({tercerosFiltrados.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tercero</TableHead>
                                <TableHead>Documento</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Usuario Asignado</TableHead>
                                <TableHead>Rol Asignado</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Fecha Registro</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tercerosFiltrados.map((tercero) => (
                                <TableRow key={tercero.id}>
                                    <TableCell className="font-medium">
                                        {tercero.nombre_completo}
                                    </TableCell>
                                    <TableCell>{tercero.numero_documento}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{tercero.tipo_tercero}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {tercero.usuario_asignado ? (
                                            <span className="text-green-700 font-medium">
                                                {tercero.usuario_asignado.full_name}
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">No asignado</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {tercero.rol_asignado ? (
                                            <Badge variant="secondary">{tercero.rol_asignado}</Badge>
                                        ) : (
                                            <span className="text-gray-500">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {getEstadoBadge(tercero.estado_aprobacion)}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(tercero.fecha_registro).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => abrirEstadoModal(tercero)}
                                                size="sm"
                                                variant="outline"
                                                className="border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white"
                                            >
                                                <Settings className="h-4 w-4 mr-1" />
                                                Estado
                                            </Button>
                                            <Button
                                                onClick={() => abrirHistorialModal(tercero)}
                                                size="sm"
                                                variant="outline"
                                                className="border-gray-400 text-gray-600 hover:bg-gray-100"
                                            >
                                                <History className="h-4 w-4 mr-1" />
                                                Historial
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* 🆕 Modal de Estado */}
            {terceroSeleccionado && (
                <EstadoAsignacionModal
                    isOpen={estadoModalOpen}
                    onClose={() => {
                        setEstadoModalOpen(false);
                        setTerceroSeleccionado(null);
                    }}
                    tercero={terceroSeleccionado}
                    userRole="administrador"
                    userId={1} // TODO: Obtener del contexto de usuario
                    onSuccess={handleEstadoSuccess}
                />
            )}

            {/* 🆕 Modal de Historial */}
            {terceroSeleccionado && (
                <HistorialModal
                    isOpen={historialModalOpen}
                    onClose={() => {
                        setHistorialModalOpen(false);
                        setTerceroSeleccionado(null);
                    }}
                    terceroId={terceroSeleccionado.id}
                    terceroNombre={terceroSeleccionado.nombre_completo}
                />
            )}
        </div>
    );
}
