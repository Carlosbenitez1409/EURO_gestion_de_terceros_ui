import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Save, User, UserCheck, UserX, Edit3, Calendar, Mail, Phone, MapPin, Building2, FileText } from 'lucide-react';
import { userManagementService } from '../services/user-management.service';
import { User as UserType } from '../types/api.types';
import { useNotification } from '../utils/notifications';
import { AppLayout } from '../components/layout/AppLayout';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { logoutUser } from '../utils/logout.util';

interface UpdateUserRequest {
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    direccion?: string;
    cargo?: string;
    area?: string;
    fecha_contratacion?: string;
    tipo_documento?: string;
    numero_documento?: string;
    role?: 'procesos' | 'comercial' | 'gestion_humana' | 'administrador' | 'oficial_cumplimiento';
    estado_empleado?: 'activo' | 'inactivo';
}

export default function EmpleadoEdit() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const { toast } = useNotification();
    const [empleado, setEmpleado] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<UpdateUserRequest>({});

    useEffect(() => {
        if (id) {
            fetchEmpleado(id);
        }
    }, [id]);

    const fetchEmpleado = async (empleadoId: string) => {
        try {
            setLoading(true);
            const data = await userManagementService.getUserById(empleadoId);
            setEmpleado(data);
            setFormData({
                username: data.username,
                email: data.email,
                first_name: data.first_name,
                last_name: data.last_name,
                phone: data.phone || '',
                cargo: data.cargo || '',
                area: data.area || '',
                fecha_contratacion: data.fecha_contratacion || '',
                tipo_documento: data.tipo_documento,
                numero_documento: data.numero_documento,
                direccion: data.direccion || '',
                role: data.role,
                estado_empleado: data.estado_empleado || 'activo'
            });
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

    const handleInputChange = (field: keyof UpdateUserRequest, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleQuickStatusChange = async (newStatus: 'activo' | 'inactivo') => {
        if (!empleado) return;

        const statusText = newStatus === 'activo' ? 'habilitar' : 'inhabilitar';
        const confirmMessage = `¿Estás seguro de que deseas ${statusText} a ${empleado.full_name}?`;

        if (window.confirm(confirmMessage)) {
            try {
                setSubmitting(true);

                await userManagementService.toggleUserStatus(empleado.id);

                // Actualizar el estado local
                setEmpleado(prev => prev ? { ...prev, estado_empleado: newStatus } : null);
                setFormData(prev => ({ ...prev, estado_empleado: newStatus }));

                toast({
                    title: `✅ Empleado ${newStatus === 'activo' ? 'Habilitado' : 'Inhabilitado'}`,
                    description: `${empleado.full_name} (${empleado.email}) ha sido ${newStatus === 'activo' ? 'habilitado' : 'inhabilitado'} exitosamente. ${newStatus === 'activo' ? 'Ahora puede acceder al sistema.' : 'Ya no puede acceder al sistema.'}`,
                    variant: "default"
                });
            } catch (error: any) {
                console.error('Error updating status:', error);

                let errorMessage = `No se pudo ${statusText} el empleado`;
                if (error.response?.data?.detail) {
                    errorMessage = error.response.data.detail;
                }

                toast({
                    title: "❌ Error al Cambiar Estado",
                    description: `No se pudo ${statusText} a ${empleado.full_name}. ${errorMessage}. Por favor, intente nuevamente.`,
                    variant: "destructive"
                });
            } finally {
                setSubmitting(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!empleado) return;

        try {
            setSubmitting(true);

            // Preparar datos para actualización (solo enviar campos que cambiaron)
            const updateData: any = {};

            if (formData.username !== empleado.username) updateData.username = formData.username;
            if (formData.email !== empleado.email) updateData.email = formData.email;
            if (formData.first_name !== empleado.first_name) updateData.first_name = formData.first_name;
            if (formData.last_name !== empleado.last_name) updateData.last_name = formData.last_name;
            if (formData.phone !== (empleado.phone || '')) updateData.phone = formData.phone;
            if (formData.cargo !== (empleado.cargo || '')) updateData.cargo = formData.cargo;
            if (formData.area !== (empleado.area || '')) updateData.area = formData.area;
            if (formData.fecha_contratacion !== (empleado.fecha_contratacion || '')) updateData.fecha_contratacion = formData.fecha_contratacion;
            if (formData.tipo_documento !== empleado.tipo_documento) updateData.tipo_documento = formData.tipo_documento;
            if (formData.numero_documento !== empleado.numero_documento) updateData.numero_documento = formData.numero_documento;
            if (formData.direccion !== (empleado.direccion || '')) updateData.direccion = formData.direccion;
            if (formData.role !== empleado.role) updateData.role = formData.role;
            if (formData.estado_empleado !== empleado.estado_empleado) updateData.estado_empleado = formData.estado_empleado;

            if (Object.keys(updateData).length === 0) {
                toast({
                    title: "ℹ️ Sin Cambios",
                    description: `No se detectaron cambios en los datos de ${empleado.full_name}. La información permanece igual.`,
                    variant: "default"
                });
                return;
            }

            await userManagementService.patchUser(empleado.id, updateData);

            toast({
                title: "✅ Empleado Actualizado",
                description: `Los datos de ${formData.first_name} ${formData.last_name} (${formData.email}) han sido actualizados correctamente. Rol: ${formData.role || 'Sin asignar'}.`,
                variant: "default"
            });

            navigate(`/empleados/view/${empleado.id}`);
        } catch (error: any) {
            console.error('Error updating empleado:', error);

            let errorMessage = 'Error interno del servidor';

            if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast({
                title: "❌ Error al Actualizar Empleado",
                description: `No se pudo actualizar la información de ${formData.first_name} ${formData.last_name}. ${errorMessage}. Por favor, verifique los datos e intente nuevamente.`,
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
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
                <div className="p-6">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                        <div className="space-y-6">
                            <div className="h-64 bg-gray-200 rounded"></div>
                            <div className="h-32 bg-gray-200 rounded"></div>
                        </div>
                    </div>
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
                <div className="p-6">
                    <div className="text-center py-12">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Empleado no encontrado
                        </h3>
                        <p className="text-gray-500 mb-4">
                            El empleado que buscas no existe o no tienes permisos para editarlo.
                        </p>
                        <Button onClick={() => navigate('/empleados/lista')}>
                            Volver a la lista
                        </Button>
                    </div>
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
                {/* Header mejorado */}
                <div className="bg-gradient-to-r from-[#0052CC] to-[#0066FF] rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="outline"
                                onClick={() => navigate(`/empleados/view/${empleado.id}`)}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Volver
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">
                                    Editar Empleado
                                </h1>
                                <div className="flex items-center space-x-3">
                                    <p className="text-blue-100">{empleado.full_name}</p>
                                    <Badge 
                                        variant={empleado.estado_empleado === 'activo' ? 'default' : 'secondary'}
                                        className={empleado.estado_empleado === 'activo' 
                                            ? 'bg-green-100 text-green-800 border-green-200' 
                                            : 'bg-gray-100 text-gray-800 border-gray-200'
                                        }
                                    >
                                        {empleado.estado_empleado === 'activo' ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-blue-100 text-sm">ID de Usuario</div>
                            <div className="font-mono text-lg">{empleado.id}</div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Información Personal mejorada */}
                    <Card className="shadow-lg border-0">
                        <CardHeader className="bg-gray-50 border-b">
                            <CardTitle className="flex items-center text-xl text-gray-800">
                                <User className="h-6 w-6 mr-3 text-[#0052CC]" />
                                Información Personal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="flex items-center font-medium text-gray-700">
                                        <User className="h-4 w-4 mr-2 text-[#0052CC]" />
                                        Nombre de Usuario
                                    </Label>
                                    <Input
                                        id="username"
                                        type="text"
                                        value={formData.username || ''}
                                        onChange={(e) => handleInputChange('username', e.target.value)}
                                        className="border-gray-300 focus:border-[#0052CC] focus:ring-[#0052CC]"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center font-medium text-gray-700">
                                        <Mail className="h-4 w-4 mr-2 text-[#0052CC]" />
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="border-gray-300 focus:border-[#0052CC] focus:ring-[#0052CC]"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="first_name" className="flex items-center font-medium text-gray-700">
                                        <User className="h-4 w-4 mr-2 text-[#0052CC]" />
                                        Nombres
                                    </Label>
                                    <Input
                                        id="first_name"
                                        type="text"
                                        value={formData.first_name || ''}
                                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                                        className="border-gray-300 focus:border-[#0052CC] focus:ring-[#0052CC]"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="last_name" className="flex items-center font-medium text-gray-700">
                                        <User className="h-4 w-4 mr-2 text-[#0052CC]" />
                                        Apellidos
                                    </Label>
                                    <Input
                                        id="last_name"
                                        type="text"
                                        value={formData.last_name || ''}
                                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                                        className="border-gray-300 focus:border-[#0052CC] focus:ring-[#0052CC]"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tipo_documento">Tipo de Documento</Label>
                                    <Select
                                        value={formData.tipo_documento || ''}
                                        onValueChange={(value) => handleInputChange('tipo_documento', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                                            <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                                            <SelectItem value="NIT">NIT</SelectItem>
                                            <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                                            <SelectItem value="PP">Pasaporte</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="numero_documento">Número de Documento</Label>
                                    <Input
                                        id="numero_documento"
                                        type="text"
                                        value={formData.numero_documento || ''}
                                        onChange={(e) => handleInputChange('numero_documento', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Información de Contacto */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Información de Contacto</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Teléfono</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone || ''}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="direccion">Dirección</Label>
                                    <Input
                                        id="direccion"
                                        type="text"
                                        value={formData.direccion || ''}
                                        onChange={(e) => handleInputChange('direccion', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Información Laboral */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Información Laboral</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cargo">Cargo</Label>
                                    <Input
                                        id="cargo"
                                        type="text"
                                        value={formData.cargo || ''}
                                        onChange={(e) => handleInputChange('cargo', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="area">Área</Label>
                                    <Input
                                        id="area"
                                        type="text"
                                        value={formData.area || ''}
                                        onChange={(e) => handleInputChange('area', e.target.value)}
                                    />
                                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha_contratacion">Fecha de Contratación</Label>
                  <Input
                    id="fecha_contratacion"
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={formData.fecha_contratacion || ''}
                    onChange={(e) => handleInputChange('fecha_contratacion', e.target.value)}
                  />
                </div>                                <div className="space-y-2">
                                    <Label htmlFor="role">Rol del Sistema</Label>
                                    <Select
                                        value={formData.role || ''}
                                        onValueChange={(value) => handleInputChange('role', value as 'procesos' | 'comercial' | 'gestion_humana' | 'administrador' | 'oficial_cumplimiento')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar rol" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="administrador">Administrador</SelectItem>
                                            <SelectItem value="procesos">Procesos</SelectItem>
                                            <SelectItem value="comercial">Comercial</SelectItem>
                                            <SelectItem value="gestion_humana">Gestión Humana</SelectItem>
                                            <SelectItem value="oficial_cumplimiento">Oficial Cumplimiento</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Estado del Empleado - Sección destacada */}
                            <div className="border-t pt-4 mt-6">
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        {formData.estado_empleado === 'activo' ? (
                                            <UserCheck className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <UserX className="h-5 w-5 text-red-600" />
                                        )}
                                        <Label htmlFor="estado_empleado" className="text-base font-semibold">
                                            Estado del Empleado
                                        </Label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Select
                                                value={formData.estado_empleado || 'activo'}
                                                onValueChange={(value) => handleInputChange('estado_empleado', value as 'activo' | 'inactivo')}
                                            >
                                                <SelectTrigger className={`${formData.estado_empleado === 'activo' ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="activo" className="text-green-700">
                                                        <div className="flex items-center space-x-2">
                                                            <UserCheck className="h-4 w-4" />
                                                            <span>Activo - Empleado habilitado</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="inactivo" className="text-red-700">
                                                        <div className="flex items-center space-x-2">
                                                            <UserX className="h-4 w-4" />
                                                            <span>Inactivo - Empleado inhabilitado</span>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className={`p-3 rounded-lg ${formData.estado_empleado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            <p className="text-sm font-medium">
                                                {formData.estado_empleado === 'activo' ?
                                                    '✅ Empleado con acceso completo al sistema' :
                                                    '❌ Empleado sin acceso al sistema'
                                                }
                                            </p>
                                            <p className="text-xs mt-1">
                                                {formData.estado_empleado === 'activo' ?
                                                    'Puede iniciar sesión y realizar todas las operaciones' :
                                                    'No puede iniciar sesión ni acceder a funcionalidades'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Botones */}
                    <div className="flex justify-between items-center">
                        {/* Botones de acción rápida para estado */}
                        <div className="flex space-x-2">
                            {formData.estado_empleado !== 'activo' && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-green-300 text-green-700 hover:bg-green-50"
                                    onClick={() => handleQuickStatusChange('activo')}
                                    disabled={submitting}
                                >
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Habilitar Ahora
                                </Button>
                            )}
                            {formData.estado_empleado === 'activo' && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                    onClick={() => handleQuickStatusChange('inactivo')}
                                    disabled={submitting}
                                >
                                    <UserX className="h-4 w-4 mr-2" />
                                    Inhabilitar Ahora
                                </Button>
                            )}
                        </div>

                        {/* Botones principales */}
                        <div className="flex space-x-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate(`/empleados/view/${empleado.id}`)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="bg-[#0052CC] hover:bg-[#0052CC]/90"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {submitting ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
