import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import {
    ArrowLeft, Mail, Phone, MapPin, User, Calendar,
    FileText, Edit, CheckCircle, XCircle, Shield, Key, Building2, CreditCard, UserCheck
} from 'lucide-react';
import { usersService } from '../services/users.service';
import { User as UserType } from '../types/api.types';
import { toast } from '../hooks/use-toast';
import { AppLayout } from '../components/layout/AppLayout';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { logoutUser } from '../utils/logout.util';

const ROLE_LABELS = {
    'procesos': 'Procesos',
    'comercial': 'Comercial',
    'gestion_humana': 'Gestión Humana',
    'administrador': 'Administrador',
    'oficial_cumplimiento': 'Oficial Cumplimiento'
};

const ROLE_COLORS = {
    'procesos': 'bg-blue-100 text-blue-800 border-blue-200',
    'comercial': 'bg-green-100 text-green-800 border-green-200',
    'gestion_humana': 'bg-purple-100 text-purple-800 border-purple-200',
    'administrador': 'bg-red-100 text-red-800 border-red-200',
    'oficial_cumplimiento': 'bg-orange-100 text-orange-800 border-orange-200'
};

export default function EmpleadoView() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const [empleado, setEmpleado] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchEmpleado(id);
        }
    }, [id]);

    const fetchEmpleado = async (empleadoId: string) => {
        try {
            setLoading(true);
            const data = await usersService.getUser(empleadoId);
            setEmpleado(data);
        } catch (error) {
            console.error('Error fetching empleado:', error);
            toast({
                title: "Error",
                description: "No se pudo cargar la información del empleado",
                variant: "destructive"
            });
            navigate('/empleados/lista');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        navigate(`/empleados/edit/${id}`);
    };

    if (loading) {
        return (
            <AppLayout
                userRole="gestion_humana"
                userName="Usuario"
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

    if (!empleado) {
        return (
            <AppLayout
                userRole="gestion_humana"
                userName="Usuario"
                currentPath={location.pathname}
                onNavigate={(path) => navigate(path)}
                onLogout={logoutUser}
            >
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900">Empleado no encontrado</h3>
                    <p className="text-gray-500">El empleado solicitado no existe o no tienes permisos para verlo.</p>
                    <Button 
                        className="mt-4" 
                        onClick={() => navigate('/empleados/lista')}
                    >
                        Volver a la lista
                    </Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            userRole="gestion_humana"
            userName="Usuario"
            currentPath={location.pathname}
            onNavigate={(path) => navigate(path)}
            onLogout={logoutUser}
        >
            <div className="p-6 space-y-8">
                {/* Header mejorado con información principal */}
                <div className="bg-gradient-to-r from-[#0052CC] to-[#0066FF] rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="outline"
                                onClick={() => navigate('/empleados/lista')}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Volver
                            </Button>
                            <div className="flex items-center space-x-4">
                                <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                                    {empleado.first_name?.charAt(0)}{empleado.last_name?.charAt(0)}
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold mb-1">
                                        {empleado.full_name}
                                    </h1>
                                    <div className="flex items-center space-x-3">
                                        <Badge 
                                            variant={empleado.estado_empleado === 'activo' ? 'default' : 'secondary'}
                                            className={empleado.estado_empleado === 'activo' 
                                                ? 'bg-green-100 text-green-800 border-green-200' 
                                                : 'bg-gray-100 text-gray-800 border-gray-200'
                                            }
                                        >
                                            {empleado.estado_empleado === 'activo' ? (
                                                <><UserCheck className="h-3 w-3 mr-1" /> Activo</>
                                            ) : (
                                                <><XCircle className="h-3 w-3 mr-1" /> Inactivo</>
                                            )}
                                        </Badge>
                                        <Badge className={ROLE_COLORS[empleado.role as keyof typeof ROLE_COLORS] || 'bg-gray-100 text-gray-800'}>
                                            <Shield className="h-3 w-3 mr-1" />
                                            {ROLE_LABELS[empleado.role as keyof typeof ROLE_LABELS] || empleado.role}
                                        </Badge>
                                    </div>
                                    <p className="text-blue-100 text-sm mt-1">@{empleado.username}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col space-y-3">
                            <Button
                                variant="outline"
                                onClick={handleEdit}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar Empleado
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate(`/empleados/change-password/${empleado.id}`)}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                            >
                                <Key className="h-4 w-4 mr-2" />
                                Cambiar Contraseña
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Información en cards mejoradas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Información Personal */}
                    <Card className="shadow-lg border-0">
                        <CardHeader className="bg-gray-50 border-b">
                            <CardTitle className="flex items-center text-xl text-gray-800">
                                <User className="h-6 w-6 mr-3 text-[#0052CC]" />
                                Información Personal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Nombres</label>
                                    <p className="text-lg font-medium text-gray-900">{empleado.first_name || 'No especificado'}</p>
                                </div>
                                <Separator />
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Apellidos</label>
                                    <p className="text-lg font-medium text-gray-900">{empleado.last_name || 'No especificado'}</p>
                                </div>
                                <Separator />
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Usuario</label>
                                    <p className="text-lg font-medium text-gray-900">@{empleado.username}</p>
                                </div>
                                <Separator />
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Tipo de Documento</label>
                                    <p className="text-lg font-medium text-gray-900">{empleado.tipo_documento || 'No especificado'}</p>
                                </div>
                                <Separator />
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Número de Documento</label>
                                    <p className="text-lg font-medium text-gray-900">{empleado.numero_documento || 'No especificado'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Información de Contacto */}
                    <Card className="shadow-lg border-0">
                        <CardHeader className="bg-gray-50 border-b">
                            <CardTitle className="flex items-center text-xl text-gray-800">
                                <Mail className="h-6 w-6 mr-3 text-[#0052CC]" />
                                Información de Contacto
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Email</label>
                                    <div className="flex items-center space-x-2">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <p className="text-lg font-medium text-gray-900">{empleado.email}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Teléfono</label>
                                    <div className="flex items-center space-x-2">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <p className="text-lg font-medium text-gray-900">{empleado.phone || 'No especificado'}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Dirección</label>
                                    <div className="flex items-center space-x-2">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <p className="text-lg font-medium text-gray-900">{empleado.direccion || 'No especificada'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Información Laboral */}
                    <Card className="shadow-lg border-0">
                        <CardHeader className="bg-gray-50 border-b">
                            <CardTitle className="flex items-center text-xl text-gray-800">
                                <Building2 className="h-6 w-6 mr-3 text-[#0052CC]" />
                                Información Laboral
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Cargo</label>
                                    <p className="text-lg font-medium text-gray-900">{empleado.cargo || 'No especificado'}</p>
                                </div>
                                <Separator />
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Área</label>
                                    <p className="text-lg font-medium text-gray-900">{empleado.area || 'No especificada'}</p>
                                </div>
                                <Separator />
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Fecha de Contratación</label>
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <p className="text-lg font-medium text-gray-900">
                                            {empleado.fecha_contratacion ? 
                                                new Date(empleado.fecha_contratacion).toLocaleDateString('es-ES') : 
                                                'No especificada'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Información del Sistema */}
                    <Card className="shadow-lg border-0">
                        <CardHeader className="bg-gray-50 border-b">
                            <CardTitle className="flex items-center text-xl text-gray-800">
                                <Shield className="h-6 w-6 mr-3 text-[#0052CC]" />
                                Información del Sistema
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">ID de Usuario</label>
                                    <p className="text-lg font-mono text-gray-900">{empleado.id}</p>
                                </div>
                                <Separator />
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Rol</label>
                                    <Badge className={ROLE_COLORS[empleado.role as keyof typeof ROLE_COLORS] || 'bg-gray-100 text-gray-800'}>
                                        <Shield className="h-3 w-3 mr-1" />
                                        {ROLE_LABELS[empleado.role as keyof typeof ROLE_LABELS] || empleado.role}
                                    </Badge>
                                </div>
                                <Separator />
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Estado</label>
                                    <Badge 
                                        variant={empleado.estado_empleado === 'activo' ? 'default' : 'secondary'}
                                        className={empleado.estado_empleado === 'activo' 
                                            ? 'bg-green-100 text-green-800 border-green-200' 
                                            : 'bg-gray-100 text-gray-800 border-gray-200'
                                        }
                                    >
                                        {empleado.estado_empleado === 'activo' ? (
                                            <><CheckCircle className="h-3 w-3 mr-1" /> Activo</>
                                        ) : (
                                            <><XCircle className="h-3 w-3 mr-1" /> Inactivo</>
                                        )}
                                    </Badge>
                                </div>
                                <Separator />
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Fecha de Creación</label>
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <p className="text-lg font-medium text-gray-900">
                                            {new Date(empleado.created_at).toLocaleDateString('es-ES')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
