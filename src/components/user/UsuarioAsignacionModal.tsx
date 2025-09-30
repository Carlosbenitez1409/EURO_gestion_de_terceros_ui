import React, { useState, useEffect } from 'react';
import { X, User, Shield, UserCheck, Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useToast } from '../../hooks/use-toast';
import { UsuariosConsultasService } from '../../services/usuarios-consultas.service';
import { EstadoSolicitud, RolUsuario } from '../../types/usuarios-consultas';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

interface UsuarioAsignacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  solicitudId: string;
  tipoAsignacion: 'administrador' | 'procesos';
  onSuccess: () => void;
}

const UsuarioAsignacionModal: React.FC<UsuarioAsignacionModalProps> = ({
  isOpen,
  onClose,
  solicitudId,
  tipoAsignacion,
  onSuccess
}) => {
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [asignando, setAsignando] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      cargarUsuarios();
    }
  }, [isOpen]);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await UsuariosConsultasService.getUsuariosDisponibles();
      setUsuarios(data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios disponibles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAsignar = async (usuarioId: string) => {
    if (!usuarioId || asignando) return;

    try {
      setAsignando(true);
      
      await UsuariosConsultasService.asignarSolicitud(solicitudId, usuarioId);
      
      toast({
        title: "Éxito",
        description: `Solicitud asignada correctamente a ${tipoAsignacion}`,
        variant: "default",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error asignando solicitud:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo asignar la solicitud",
        variant: "destructive",
      });
    } finally {
      setAsignando(false);
    }
  };

  const usuariosFiltrados = Array.isArray(usuarios) ? usuarios.filter(usuario => 
    tipoAsignacion === 'administrador' 
      ? usuario.rol === 'administrador' 
      : usuario.rol === 'procesos'
  ) : [];

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'administrador':
        return {
          label: 'Administrador',
          icon: UserCheck,
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'procesos':
        return {
          label: 'Procesos',
          icon: Shield,
          color: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      default:
        return {
          label: 'Usuario',
          icon: User,
          color: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Asignar a {tipoAsignacion === 'administrador' ? 'Administrador' : 'Procesos'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Selecciona el usuario que se encargará de revisar esta solicitud
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={asignando}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Cargando usuarios...</p>
              </div>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay usuarios disponibles
              </h3>
              <p className="text-gray-600">
                No se encontraron usuarios con rol de {tipoAsignacion}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {usuariosFiltrados.map((usuario) => {
                const roleInfo = getRoleInfo(usuario.rol);
                const IconComponent = roleInfo.icon;
                
                return (
                  <Card key={usuario.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${roleInfo.color}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {usuario.nombre}
                            </h4>
                            <p className="text-sm text-gray-600">{usuario.email}</p>
                            <Badge variant="outline" className={`text-xs mt-1 ${roleInfo.color}`}>
                              {roleInfo.label}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleAsignar(usuario.id)}
                          disabled={asignando}
                          className={
                            tipoAsignacion === 'administrador' 
                              ? "bg-blue-600 hover:bg-blue-700" 
                              : "bg-purple-600 hover:bg-purple-700"
                          }
                        >
                          {asignando ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Asignar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={asignando}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UsuarioAsignacionModal;