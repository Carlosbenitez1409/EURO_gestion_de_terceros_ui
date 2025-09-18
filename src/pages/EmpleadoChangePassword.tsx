import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, Key, Save, Eye, EyeOff } from 'lucide-react';
import { userManagementService } from '../services/user-management.service';
import { useNotification } from '../utils/notifications';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

export default function EmpleadoChangePassword() {
  const { user } = useAuth();
  const { toast } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: ''
  });

  const validateForm = (): boolean => {
    if (!formData.new_password || !formData.confirm_password) {
      toast({
        title: "⚠️ Campos Requeridos",
        description: "Por favor, complete todos los campos de contraseña antes de continuar.",
        variant: "destructive"
      });
      return false;
    }

    if (formData.new_password.length < 8) {
      toast({
        title: "🔒 Contraseña Insegura",
        description: "La contraseña debe tener al menos 8 caracteres para garantizar la seguridad del sistema. Por favor, ingrese una contraseña más segura.",
        variant: "destructive"
      });
      return false;
    }

    if (formData.new_password !== formData.confirm_password) {
      toast({
        title: "🔄 Contraseñas No Coinciden",
        description: "Las contraseñas ingresadas no son iguales. Por favor, verifique que ambos campos contengan la misma contraseña.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !id) return;

    try {
      setSubmitting(true);

      await userManagementService.changeUserPassword(id, {
        new_password: formData.new_password
      });

      // Obtener información del empleado para mostrar en el mensaje
      const empleadoInfo = await userManagementService.getUserById(id);

      toast({
        title: "🔑 Contraseña Actualizada",
        description: `La contraseña de ${empleadoInfo.first_name} ${empleadoInfo.last_name} (${empleadoInfo.email}) ha sido cambiada exitosamente. El empleado deberá usar la nueva contraseña en su próximo inicio de sesión.`,
        variant: "default"
      });

      navigate('/empleados/lista');

    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Error interno del servidor';

      toast({
        title: "❌ Error al Cambiar Contraseña",
        description: `No se pudo cambiar la contraseña del empleado. ${errorMessage}. Por favor, verifique que la contraseña cumpla con los requisitos de seguridad e intente nuevamente.`,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/empleados/lista');
  };

  if (!user) {
    return null;
  }

  return (
    <AppLayout
      userRole={user?.role || 'gestion_humana'}
      userName={user?.full_name || 'Usuario'}
      currentPath="/empleados/change-password"
      onNavigate={(path) => navigate(path)}
    >
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Lista
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cambiar Contraseña</h1>
              <p className="text-gray-600 mt-1">Actualizar contraseña de usuario</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>Nueva Contraseña</CardTitle>
                <CardDescription>
                  Ingrese la nueva contraseña para el usuario
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="new_password">Nueva Contraseña *</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showPassword ? "text" : "password"}
                      value={formData.new_password}
                      onChange={(e) => setFormData(prev => ({ ...prev, new_password: e.target.value }))}
                      placeholder="Mínimo 8 caracteres"
                      className="pr-10"
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
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirmar Contraseña *</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showPasswordConfirm ? "text" : "password"}
                      value={formData.confirm_password}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
                      placeholder="Repita la contraseña"
                      className="pr-10"
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
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Requisitos de la contraseña:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Mínimo 8 caracteres</li>
                  <li>• Se recomienda incluir mayúsculas, minúsculas y números</li>
                  <li>• Evite contraseñas comunes o información personal</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Cambiando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Cambiar Contraseña
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
