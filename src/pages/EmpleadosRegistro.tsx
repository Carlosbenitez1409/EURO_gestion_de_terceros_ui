import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import {
  ArrowLeft, UserPlus, Save, Eye, EyeOff
} from 'lucide-react';
import { userManagementService, UserManagementCreateRequest } from '../services/user-management.service';
import { useNotification } from '../utils/notifications';
import { AppLayout } from '../components/layout/AppLayout';

// Extender la interfaz para incluir confirmación de contraseña (solo para el formulario)
interface UserFormData extends UserManagementCreateRequest {
  password_confirm: string;
}
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../utils/logout.util';

export default function EmpleadosRegistro() {
  const { user } = useAuth();
  const { toast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'procesos',
    password: '',
    password_confirm: '',
    // Campos opcionales
    telefono: '',
    cargo: '',
    area: '',
    tipo_documento: 'cedula',
    numero_documento: '',
    direccion: '',
    fecha_contratacion: '',
    estado_empleado: 'activo'
  });

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.username || !formData.email || !formData.first_name ||
      !formData.last_name || !formData.password || !formData.password_confirm) {
      toast({
        title: "Error de validación",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      });
      return false;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Error de validación",
        description: "El formato del correo electrónico no es válido",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password !== formData.password_confirm) {
      toast({
        title: "Error de validación",
        description: "Las contraseñas no coinciden",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Error de validación",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive"
      });
      return false;
    }

    // Validar fecha de contratación si se proporciona
    if (formData.fecha_contratacion) {
      const fechaContratacion = new Date(formData.fecha_contratacion);
      const fechaActual = new Date();
      
      if (fechaContratacion > fechaActual) {
        toast({
          title: "Error de validación",
          description: "La fecha de contratación no puede ser futura",
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      // Preparar datos para envío - limpiar campos vacíos
      const cleanedData: UserManagementCreateRequest = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        role: formData.role,
        password: formData.password,
        // Solo incluir campos opcionales si tienen valor
        ...(formData.telefono && { telefono: formData.telefono.trim() }),
        ...(formData.cargo && { cargo: formData.cargo.trim() }),
        ...(formData.area && { area: formData.area.trim() }),
        ...(formData.tipo_documento && { tipo_documento: formData.tipo_documento }),
        ...(formData.numero_documento && { numero_documento: formData.numero_documento.trim() }),
        ...(formData.direccion && { direccion: formData.direccion.trim() }),
        ...(formData.fecha_contratacion && { fecha_contratacion: formData.fecha_contratacion }),
        estado_empleado: formData.estado_empleado || 'activo'
      };

      // Debug: Log de los datos que se van a enviar
      console.log('Datos a enviar:', cleanedData);

      await userManagementService.createUser(cleanedData);

      toast({
        title: "✅ ¡Empleado Creado Exitosamente!",
        description: `${formData.first_name} ${formData.last_name} (${formData.username}) ha sido registrado correctamente en el sistema con el rol de ${formData.role}. Ya puede acceder al sistema.`,
        variant: "default"
      });

      navigate('/empleados/lista');

    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      console.error('Error completo:', {
        message: error.message,
        response: error.response,
        request: error.request,
        config: error.config,
        code: error.code,
        details: error.details
      });

      let errorMessage = 'Error al crear el usuario';
      let errorDetails = '';

      // Verificar diferentes ubicaciones de datos de error
      const errorData = error.details || error.response?.data || error.data;
      
      if (errorData && typeof errorData === 'object') {
        console.error('Datos del error:', errorData);
        
        // Construir mensaje detallado de errores
        const fieldErrors = [];
        for (const [field, messages] of Object.entries(errorData)) {
          if (Array.isArray(messages)) {
            fieldErrors.push(`${field}: ${messages.join(', ')}`);
          } else if (typeof messages === 'string') {
            fieldErrors.push(`${field}: ${messages}`);
          }
        }
        
        if (fieldErrors.length > 0) {
          errorMessage = 'Errores de validación';
          errorDetails = fieldErrors.join(' | ');
        }
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Si aún no tenemos detalles específicos, usar el status
      if (!errorDetails && error.response?.status) {
        errorDetails = `Error ${error.response.status}: ${error.response.statusText || 'Bad Request'}`;
      }

      console.error('Error procesado:', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage,
        details: errorDetails
      });

      const finalErrorMessage = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;
      toast({
        title: "❌ Error al Crear Empleado",
        description: `No se pudo registrar al empleado ${formData.first_name} ${formData.last_name}. ${finalErrorMessage}. Por favor, verifique los datos e intente nuevamente.`,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout
      userRole={user?.role || 'gestion_humana'}
      userName={user?.full_name || 'Usuario'}
      currentPath={location.pathname}
      onNavigate={(path) => navigate(path)}
      onLogout={logoutUser}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/empleados/lista')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a la Lista
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#0052CC]">
                Registrar Nuevo Usuario
              </h1>
              <p className="text-gray-600">Complete la información del usuario del sistema</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Usuario */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="h-5 w-5 mr-2" />
                Información del Usuario
              </CardTitle>
              <CardDescription>
                Complete los campos requeridos para crear un nuevo usuario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nombre de usuario */}
              <div className="space-y-2">
                <Label htmlFor="username">
                  Nombre de usuario <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Ej: juan.perez"
                  maxLength={150}
                  required
                />
                <p className="text-xs text-gray-500">
                  Requerido. 150 caracteres como máximo. Únicamente letras, dígitos y @/./+/-/_
                </p>
              </div>

              {/* Correo electrónico */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Correo electrónico <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>

              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">
                    Nombres <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="Nombres completos"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">
                    Apellidos <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Apellidos completos"
                    required
                  />
                </div>
              </div>

              {/* Rol */}
              <div className="space-y-2">
                <Label htmlFor="role">
                  Rol <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange('role', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el rol" />
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

              {/* Contraseñas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Contraseña <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• Su contraseña no puede asemejarse tanto a su otra información personal</p>
                    <p>• Su contraseña debe contener al menos 8 caracteres</p>
                    <p>• Su contraseña no puede ser una clave utilizada comúnmente</p>
                    <p>• Su contraseña no puede ser completamente numérica</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_confirmation">
                    Contraseña (confirmación) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password_confirmation"
                      type={showPasswordConfirm ? "text" : "password"}
                      value={formData.password_confirm}
                      onChange={(e) => handleInputChange('password_confirm', e.target.value)}
                      placeholder="Repita la contraseña"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    >
                      {showPasswordConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Para verificar, introduzca la misma contraseña anterior
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Adicional */}
          <Card>
            <CardHeader>
              <CardTitle>Información Adicional</CardTitle>
              <CardDescription>
                Información opcional del empleado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono || ''}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    placeholder="Ej: +57 300 123 4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={formData.cargo || ''}
                    onChange={(e) => handleInputChange('cargo', e.target.value)}
                    placeholder="Ej: Analista, Coordinador"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="area">Área</Label>
                  <Input
                    id="area"
                    value={formData.area || ''}
                    onChange={(e) => handleInputChange('area', e.target.value)}
                    placeholder="Ej: Recursos Humanos, Contabilidad"
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
                  <p className="text-xs text-gray-500">
                    Seleccione la fecha de contratación del empleado
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    value={formData.numero_documento || ''}
                    onChange={(e) => handleInputChange('numero_documento', e.target.value)}
                    placeholder="Número de identificación"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion || ''}
                  onChange={(e) => handleInputChange('direccion', e.target.value)}
                  placeholder="Dirección completa"
                />
              </div>

              {/* Estado del Empleado */}
              <div className="space-y-2">
                <Label htmlFor="estado_empleado">Estado del Empleado</Label>
                <Select
                  value={formData.estado_empleado || 'activo'}
                  onValueChange={(value) => handleInputChange('estado_empleado', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo - Empleado habilitado</SelectItem>
                    <SelectItem value="inactivo">Inactivo - Empleado inhabilitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/empleados/lista')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#0052CC] hover:bg-[#0052CC]/90"
            >
              {submitting ? (
                <>Registrando...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Registrar Usuario
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
