import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import {
    UserPlus, Users, Search, Mail, Phone, MapPin,
    Building2, FileText, Calendar, User, Eye, Edit, Trash2,
    UserX, UserCheck, Plus, MoreHorizontal, Key, AlertTriangle
} from 'lucide-react';
import { userManagementService } from '../services/user-management.service';
import { User as UserType } from '../types/api.types';
import { useNotification } from '../utils/notifications';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../utils/logout.util';

export default function EmpleadosList() {
    const { user } = useAuth();
    const { toast } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();
    const [empleados, setEmpleados] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estado para el diálogo de confirmación
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        empleado: UserType | null;
        isActivating: boolean;
    }>({
        isOpen: false,
        empleado: null,
        isActivating: false
    });

    // Estadísticas
    const [stats, setStats] = useState({
        total: 0,
        activos: 0,
        procesos: 0,
        comercial: 0,
        gestion_humana: 0,
        nuevos_mes: 0
    });

    useEffect(() => {
        fetchEmpleados();
    }, []);

    const fetchEmpleados = async () => {
        try {
            setLoading(true);
            const response = await userManagementService.getUsers();
            
            // La respuesta tiene estructura: { count, next, previous, results }
            const empleados = response.results || [];
            setEmpleados(empleados);

            // Calcular estadísticas
            const ahora = new Date();
            const stats = {
                total: empleados.length,
                activos: empleados.filter(e => e.estado_empleado === 'activo').length,
                procesos: empleados.filter(e => e.role === 'procesos').length,
                comercial: empleados.filter(e => e.role === 'comercial').length,
                gestion_humana: empleados.filter(e => e.role === 'gestion_humana').length,
                nuevos_mes: empleados.filter(e => {
                    const fecha = new Date(e.created_at);
                    return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
                }).length
            };
            setStats(stats);

        } catch (error) {
            console.error('Error fetching empleados:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los usuarios",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Filtrar empleados
    const filteredEmpleados = empleados.filter(empleado => {
        const searchString = `${empleado.first_name} ${empleado.last_name} ${empleado.username} ${empleado.email}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });

    const handleViewEmpleado = (id: string) => {
        navigate(`/empleados/view/${id}`);
    };

    const handleEditEmpleado = (id: string) => {
        navigate(`/empleados/edit/${id}`);
    };

    const handleChangePassword = (id: string) => {
        navigate(`/empleados/change-password/${id}`);
    };

    const handleDeleteEmpleado = (id: string) => {
        // Función placeholder - eliminación solo disponible desde Django Admin
        console.log('Delete employee:', id);
    };

    const handleToggleStatus = async (id: string) => {
        const empleado = empleados.find(e => e.id === id);
        if (!empleado) return;

        const isActivating = empleado.estado_empleado !== 'activo';
        
        // Abrir el diálogo de confirmación
        setConfirmDialog({
            isOpen: true,
            empleado,
            isActivating
        });
    };

    const confirmToggleStatus = async () => {
        if (!confirmDialog.empleado) return;

        const { empleado, isActivating } = confirmDialog;

        try {
            setLoading(true);
            setConfirmDialog({ isOpen: false, empleado: null, isActivating: false });
            
            await userManagementService.toggleUserStatus(empleado.id);
            
            // Notificación simple y elegante
            toast({
                title: isActivating ? "Empleado Habilitado" : "Empleado Inhabilitado",
                description: `${empleado.first_name} ${empleado.last_name} ha sido ${isActivating ? 'habilitado' : 'inhabilitado'} correctamente.`,
                variant: "default"
            });

            // Recargar la lista para mostrar el cambio
            await fetchEmpleados();
        } catch (error: any) {
            console.error('Error toggling employee status:', error);
            toast({
                title: "Error",
                description: `No se pudo ${isActivating ? 'habilitar' : 'inhabilitar'} al empleado. Por favor, intente nuevamente.`,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEmpleado = () => {
        navigate('/empleados/registro');
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'procesos': return 'Procesos';
            case 'comercial': return 'Comercial';
            case 'gestion_humana': return 'Gestión Humana';
            case 'administrador': return 'Administrador';
            case 'oficial_cumplimiento': return 'Oficial Cumplimiento';
            default: return role;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'procesos': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'comercial': return 'text-green-600 bg-green-50 border-green-200';
            case 'gestion_humana': return 'text-purple-600 bg-purple-50 border-purple-200';
            case 'administrador': return 'text-red-600 bg-red-50 border-red-200';
            case 'oficial_cumplimiento': return 'text-orange-600 bg-orange-50 border-orange-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    if (loading) {
        return (
            <AppLayout
                userRole={user?.role || 'gestion_humana'}
                userName={user?.full_name || 'Usuario'}
                currentPath={location.pathname}
                onNavigate={(path) => navigate(path)}
                onLogout={logoutUser}
            >
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0052CC]"></div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            userRole={user?.role || 'gestion_humana'}
            userName={user?.full_name || 'Usuario'}
            currentPath={location.pathname}
            onNavigate={(path) => navigate(path)}
            onLogout={logoutUser}
        >
            <div className="p-6 space-y-8">
                {/* Header mejorado */}
                <div className="bg-gradient-to-r from-[#0052CC] to-[#0066FF] rounded-xl p-6 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Gestión de Empleados</h1>
                            <p className="text-blue-100">Administra los usuarios y sus permisos en el sistema</p>
                        </div>
                        <Button
                            onClick={handleCreateEmpleado}
                            className="bg-white text-[#0052CC] hover:bg-gray-50 shadow-lg"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Nuevo Empleado
                        </Button>
                    </div>
                </div>

                {/* Estadísticas mejoradas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-l-4 border-l-[#0052CC] hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Total Empleados</CardTitle>
                            <Users className="h-5 w-5 text-[#0052CC]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#0052CC]">{stats.total}</div>
                            <p className="text-xs text-gray-600 mt-1">
                                {stats.activos} activos, {stats.total - stats.activos} inactivos
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Empleados Activos</CardTitle>
                            <UserCheck className="h-5 w-5 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.activos}</div>
                            <p className="text-xs text-gray-600 mt-1">
                                Con acceso al sistema
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Área Procesos</CardTitle>
                            <Building2 className="h-5 w-5 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats.procesos}</div>
                            <p className="text-xs text-gray-600 mt-1">
                                Gestión de procesos
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Comerciales</CardTitle>
                            <User className="h-5 w-5 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">{stats.comercial}</div>
                            <p className="text-xs text-gray-600 mt-1">
                                Área comercial
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Búsqueda y tabla mejorada */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-semibold text-gray-900">Lista de Empleados</CardTitle>
                                <CardDescription>
                                    {filteredEmpleados.length} empleado{filteredEmpleados.length !== 1 ? 's' : ''} encontrado{filteredEmpleados.length !== 1 ? 's' : ''}
                                </CardDescription>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Buscar empleados..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 w-full sm:w-80"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredEmpleados.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron empleados</h3>
                                <p className="text-gray-500">Intenta ajustar tu búsqueda o crear un nuevo empleado</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="font-semibold text-gray-900">Empleado</TableHead>
                                            <TableHead className="font-semibold text-gray-900">Email</TableHead>
                                            <TableHead className="font-semibold text-gray-900">Rol</TableHead>
                                            <TableHead className="font-semibold text-gray-900">Estado</TableHead>
                                            <TableHead className="font-semibold text-gray-900">Fecha Creación</TableHead>
                                            <TableHead className="font-semibold text-gray-900 text-center">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredEmpleados.map((empleado) => (
                                            <TableRow 
                                                key={empleado.id} 
                                                className={`hover:bg-gray-50 transition-colors ${
                                                    empleado.estado_empleado !== 'activo' 
                                                        ? 'bg-gray-50 opacity-75' 
                                                        : ''
                                                }`}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <div className="flex-shrink-0">
                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#0052CC] to-[#0066FF] flex items-center justify-center text-white font-semibold">
                                                                {empleado.first_name?.charAt(0)}{empleado.last_name?.charAt(0)}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">
                                                                {empleado.first_name} {empleado.last_name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">@{empleado.username}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Mail className="h-4 w-4 text-gray-400" />
                                                        <span className="text-gray-700">{empleado.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`${getRoleColor(empleado.role)} font-medium border`}>
                                                        {getRoleLabel(empleado.role)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge 
                                                        variant={empleado.estado_empleado === 'activo' ? 'default' : 'secondary'}
                                                        className={empleado.estado_empleado === 'activo' 
                                                            ? 'bg-green-100 text-green-800 border-green-200' 
                                                            : 'bg-gray-100 text-gray-800 border-gray-200'
                                                        }
                                                    >
                                                        {empleado.estado_empleado === 'activo' ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        <span className="text-gray-700">
                                                            {new Date(empleado.created_at).toLocaleDateString('es-ES')}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleViewEmpleado(empleado.id)}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEditEmpleado(empleado.id)}
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleChangePassword(empleado.id)}
                                                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                        >
                                                            <Key className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleToggleStatus(empleado.id)}
                                                            className={empleado.estado_empleado === 'activo' 
                                                                ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
                                                                : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                                            }
                                                        >
                                                            {empleado.estado_empleado === 'activo' ? 
                                                                <UserX className="h-4 w-4" /> : 
                                                                <UserCheck className="h-4 w-4" />
                                                            }
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Diálogo de Confirmación para Cambio de Estado */}
            <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => 
                setConfirmDialog(prev => ({ ...prev, isOpen: open }))
            }>
                <AlertDialogContent className="max-w-md bg-white border border-gray-200 shadow-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                            <AlertTriangle className={`h-5 w-5 ${confirmDialog.isActivating ? 'text-green-600' : 'text-orange-600'}`} />
                            {confirmDialog.isActivating ? 'Habilitar' : 'Inhabilitar'} Empleado
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-left text-gray-600">
                            ¿Está seguro de que desea {confirmDialog.isActivating ? 'habilitar' : 'inhabilitar'} a este empleado?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <div className="space-y-4">
                        {confirmDialog.empleado && (
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3 border border-gray-100">
                                <div className="text-gray-700">
                                    <span className="font-medium text-gray-900">Nombre:</span> {confirmDialog.empleado.first_name} {confirmDialog.empleado.last_name}
                                </div>
                                <div className="text-gray-700">
                                    <span className="font-medium text-gray-900">Email:</span> {confirmDialog.empleado.email}
                                </div>
                                <div className="text-gray-700">
                                    <span className="font-medium text-gray-900">Rol:</span> {getRoleLabel(confirmDialog.empleado.role)}
                                </div>
                                <div className="text-gray-700">
                                    <span className="font-medium text-gray-900">Estado actual:</span> 
                                    <Badge 
                                        variant={confirmDialog.empleado.estado_empleado === 'activo' ? 'default' : 'secondary'} 
                                        className={`ml-2 ${confirmDialog.empleado.estado_empleado === 'activo' 
                                            ? 'bg-green-100 text-green-800 border-green-200' 
                                            : 'bg-gray-100 text-gray-800 border-gray-200'
                                        }`}
                                    >
                                        {confirmDialog.empleado.estado_empleado === 'activo' ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </div>
                            </div>
                        )}
                        
                        <div className={`p-4 rounded-lg border ${confirmDialog.isActivating 
                            ? 'bg-green-50 text-green-800 border-green-200' 
                            : 'bg-orange-50 text-orange-800 border-orange-200'
                        }`}>
                            <p className="text-sm font-medium">
                                {confirmDialog.isActivating 
                                    ? '✅ El empleado podrá acceder al sistema nuevamente y realizar sus funciones normalmente.'
                                    : '⚠️ El empleado no podrá acceder al sistema hasta ser habilitado nuevamente.'
                                }
                            </p>
                        </div>
                    </div>
                    
                    <AlertDialogFooter className="bg-gray-50 -mx-6 -mb-6 px-6 py-4 mt-6 rounded-b-lg">
                        <AlertDialogCancel className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmToggleStatus}
                            className={`text-white font-medium ${confirmDialog.isActivating 
                                ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                                : 'bg-orange-600 hover:bg-orange-700 border-orange-600'
                            }`}
                        >
                            {confirmDialog.isActivating ? 'Habilitar' : 'Inhabilitar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
