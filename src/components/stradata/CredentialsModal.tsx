import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Key, User, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { stradataService } from "@/services/stradata.service";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CredentialsModalProps {
  terceroId?: string;
  tercerosIds?: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  modalType?: 'individual' | 'masivo';
}

export const CredentialsModal: React.FC<CredentialsModalProps> = ({
  terceroId,
  tercerosIds = [],
  isOpen,
  onClose,
  onSuccess,
  modalType = 'individual'
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    usuario_stradata: '',
    password_stradata: ''
  });

  const handleInputChange = (field: keyof typeof credentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.usuario_stradata.trim() || !credentials.password_stradata.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor ingrese usuario y contraseña de Stradata",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const consultaData = {
        terceros_ids: modalType === 'individual' ? [terceroId!] : tercerosIds,
        usuario_stradata: credentials.usuario_stradata.trim(),
        password_stradata: credentials.password_stradata.trim()
      };

      console.log('🔍 Enviando consulta Stradata:', {
        tipo: modalType,
        terceros_count: consultaData.terceros_ids.length,
        usuario: consultaData.usuario_stradata
      });

      const response = await stradataService.ejecutarConsultaMasiva(consultaData);

      if (response.success) {
        toast({
          title: "Consulta Enviada ✅",
          description: `Consulta enviada exitosamente para ${consultaData.terceros_ids.length} tercero(s). Los resultados serán enviados por correo electrónico.`,
          variant: "default"
        });

        // Limpiar credenciales
        setCredentials({
          usuario_stradata: '',
          password_stradata: ''
        });

        onSuccess?.();
        onClose();
      } else {
        throw new Error(response.error || 'Error en la consulta');
      }
    } catch (error) {
      console.error('❌ Error en consulta Stradata:', error);
      
      const mensaje = error instanceof Error ? error.message : 'Error de conexión con Stradata';
      
      toast({
        title: "Error en Consulta",
        description: mensaje,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCredentials({
        usuario_stradata: '',
        password_stradata: ''
      });
      onClose();
    }
  };

  const terceroCount = modalType === 'individual' ? 1 : tercerosIds.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-600" />
            Credenciales Stradata
          </DialogTitle>
          <DialogDescription>
            Ingrese sus credenciales para ejecutar la consulta de Stradata para {terceroCount} tercero(s).
            Los resultados serán enviados a su correo electrónico.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Nuevo Sistema:</strong> Las consultas Stradata ahora requieren credenciales y 
            los resultados se envían por correo. No se descargan documentos automáticamente.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="usuario" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Usuario Stradata
            </Label>
            <Input
              id="usuario"
              type="text"
              placeholder="Su usuario de Stradata"
              value={credentials.usuario_stradata}
              onChange={(e) => handleInputChange('usuario_stradata', e.target.value)}
              disabled={loading}
              autoComplete="username"
              className="focus-visible:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Contraseña Stradata
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Su contraseña de Stradata"
              value={credentials.password_stradata}
              onChange={(e) => handleInputChange('password_stradata', e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              className="focus-visible:ring-purple-500"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando Consulta...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Enviar Consulta
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CredentialsModal;
