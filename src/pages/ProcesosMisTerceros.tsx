import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { asignacionesService, MisTercerosResponse } from "@/services/asignaciones.service";
import { logoutUser } from "@/utils/logout.util";
import { UserAssignmentModal } from "@/components/admin/UserAssignmentModal";
import {
    RefreshCw,
    AlertCircle,
    Users,
    CheckCircle,
    Clock,
    XCircle,
    Eye,
    Edit,
    BarChart3,
    FileText,
    User,
    Building2,
    UserCheck
} from "lucide-react";

export default function ProcesosMisTerceros() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [data, setData] = useState<MisTercerosResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
    const [selectedTercero, setSelectedTercero] = useState<any>(null);

    useEffect(() => {
        if (user?.role !== "procesos") {
            navigate('/dashboard');
            return;
        }
        
        loadMisTerceros();
    }, [user, navigate]);

    const loadMisTerceros = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await asignacionesService.getMisTercerosParaProcesos();
            setData(response);

        } catch (err) {
            console.error('Error loading terceros:', err);
            setError(err instanceof Error ? err.message : 'Error al cargar los terceros');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadMisTerceros();
        setRefreshing(false);
        
        toast({
            title: "✅ Actualizado",
            description: "Lista de terceros actualizada correctamente",
        });
    };

    const handleAssignmentModalOpen = (tercero: any) => {
        setSelectedTercero(tercero);
        setAssignmentModalOpen(true);
    };

    const handleAssignmentSuccess = () => {
        loadMisTerceros(); // Recargar lista después de asignación exitosa
    };

    const getDisplayName = (tercero: any) => {
        if (tercero.tipo_persona === 'natural') {
            return `${tercero.nombres || ''} ${tercero.apellidos || ''}`.trim();
        }
        return tercero.razon_social || tercero.name || 'Sin nombre';
    };

    const getEstadoBadge = (estado: string) => {
        switch (estado.toLowerCase()) {
            case 'pendiente':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
            case 'aprobado':
                return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Aprobado</Badge>;
            case 'rechazado':
                return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rechazado</Badge>;
            default:
                return <Badge variant="outline">{estado}</Badge>;
        }
    };

    if (loading) {
        return (
            <AppLayout
                userRole={user?.role || 'procesos'}
                userName={user?.email || 'Usuario'}
                currentPath="/procesos/mis-terceros"
                onNavigate={(path) => navigate(path)}
                onLogout={logoutUser}
            >
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="h-8 w-8 animate-spin text-[#0052CC]" />
                    <span className="ml-2 text-lg">Cargando terceros asignados...</span>
                </div>
            </AppLayout>
        );
    }

    if (error || !data) {
        return (
            <AppLayout
                userRole={user?.role || 'procesos'}
                userName={user?.email || 'Usuario'}
                currentPath="/procesos/mis-terceros"
                onNavigate={(path) => navigate(path)}
                onLogout={logoutUser}
            >
                <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                        {error || 'No se pudieron cargar los terceros'}
                    </AlertDescription>
                </Alert>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            userRole={user?.role || 'procesos'}
            userName={user?.email || 'Usuario'}
            currentPath="/procesos/mis-terceros"
            onNavigate={(path) => navigate(path)}
            onLogout={logoutUser}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Mis Terceros para Procesos
                        </h1>
                        <p className="text-gray-600">
                            Terceros asignados para aprobación final
                        </p>
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

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-[#0052CC] shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-[#0052CC]" />
                                <div>
                                    <p className="text-sm text-gray-600">Total Asignados</p>
                                    <p className="text-2xl font-bold text-[#0052CC]">{data.estadisticas.total_asignados}</p>
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
                                    <p className="text-2xl font-bold text-[#FFD700]">{data.estadisticas.pendientes}</p>
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
                                    <p className="text-2xl font-bold text-green-600">{data.estadisticas.aprobados}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-500 shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <XCircle className="h-5 w-5 text-red-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Rechazados</p>
                                    <p className="text-2xl font-bold text-red-600">{data.estadisticas.rechazados}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Lista de Terceros */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-[#0052CC] flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Terceros Asignados ({data.terceros.length})
                        </CardTitle>
                        <CardDescription>
                            Gestiona la aprobación final de estos terceros
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.terceros.length > 0 ? (
                            <div className="space-y-4">
                                {data.terceros.map((tercero) => (
                                    <div
                                        key={tercero.id}
                                        className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-shrink-0">
                                                    {tercero.tipo_persona === 'natural' ? (
                                                        <User className="h-8 w-8 text-[#0052CC] bg-blue-100 p-1 rounded-full" />
                                                    ) : (
                                                        <Building2 className="h-8 w-8 text-[#FFD700] bg-yellow-100 p-1 rounded-full" />
                                                    )}
                                                </div>
                                                
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                        {getDisplayName(tercero)}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                                        <span>Doc: {tercero.numero_documento}</span>
                                                        <span>Email: {tercero.email}</span>
                                                        {tercero.asignado_a_nombre && (
                                                            <span className="text-blue-600">
                                                                Comercial: {tercero.asignado_a_nombre}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {getEstadoBadge(tercero.estado_aprobacion)}
                                                
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/terceros/view/${tercero.id}`)}
                                                    className="border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white"
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Ver
                                                </Button>

                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => navigate(`/terceros/edit/${tercero.id}`)}
                                                    className="bg-[#FFD700] text-[#0052CC] hover:bg-[#F2C200]"
                                                >
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    Gestionar
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAssignmentModalOpen(tercero)}
                                                    className="border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white"
                                                >
                                                    <UserCheck className="h-4 w-4 mr-1" />
                                                    Reasignar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No hay terceros asignados
                                </h3>
                                <p className="text-gray-600">
                                    Los terceros aparecerán aquí cuando los comerciales los asignen a procesos.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal de asignación */}
            {selectedTercero && (
                <UserAssignmentModal
                    isOpen={assignmentModalOpen}
                    onClose={() => {
                        setAssignmentModalOpen(false);
                        setSelectedTercero(null);
                    }}
                    tercero={selectedTercero}
                    onAssignmentSuccess={handleAssignmentSuccess}
                    userRole="procesos" // 🆕 Agregado
                    limitToRoles={['comercial', 'oficial_cumplimiento']}
                />
            )}
        </AppLayout>
    );
}
