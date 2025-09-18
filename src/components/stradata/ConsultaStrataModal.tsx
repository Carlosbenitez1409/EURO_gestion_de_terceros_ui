import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, User, Lock, AlertCircle, Eye, EyeOff, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { APP_CONFIG } from '@/config/app.config';
import { TokenStorage } from '@/lib/api.client';
import { useStratadaIntegration } from '@/hooks/use-stradata-integration';
import ResumenPersonasStradata from './ResumenPersonasStradata';

interface ConsultaStrataModalProps {
  terceroId: string;
  terceroNombre?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: any) => void;
}

export const ConsultaStrataModal: React.FC<ConsultaStrataModalProps> = ({
  terceroId,
  terceroNombre,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [usuario, setUsuario] = useState(''); 
  const [contraseña, setContraseña] = useState('');
  const [mostrarContraseña, setMostrarContraseña] = useState(true);

  // Usar el hook integrado de Stradata
  const {
    resumenPersonas,
    loadingResumen,
    consultandoStradata,
    ejecutarConsultaIntegrada,
    obtenerResumenPersonas
  } = useStratadaIntegration({ terceroId });

  // Cargar resumen cuando se abre el modal
  useEffect(() => {
    if (isOpen && terceroId && !resumenPersonas) {
      obtenerResumenPersonas();
    }
  }, [isOpen, terceroId, resumenPersonas, obtenerResumenPersonas]);

  const handleConsultar = async () => {
    if (!usuario.trim() || !contraseña.trim()) {
      toast({
        title: "⚠️ Datos incompletos",
        description: "Por favor ingrese usuario y contraseña de Stradata",
        variant: "warning"
      });
      return;
    }

    try {
      const resultado = await ejecutarConsultaIntegrada({
        username: usuario,
        password: contraseña
      });

      if (resultado?.success) {
        // Limpiar contraseña por seguridad
        setContraseña('');
        
        // Cerrar modal
        onClose();
        
        // Callback opcional
        if (onSuccess) {
          onSuccess({
            personas_consultadas: resultado.personas_consultadas,
            message: resultado.mensaje
          });
        }
      }
    } catch (error) {
      console.error('❌ Error en consulta:', error);
      // El hook ya maneja los errores con toast
    }
  };

  const handleClose = () => {
    if (!consultandoStradata) {
      setContraseña(''); // Limpiar contraseña al cerrar
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 -m-6 mb-6 p-6 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Search className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg font-semibold">
                Consulta Stradata
              </DialogTitle>
              <DialogDescription className="text-blue-100 text-sm mt-1">
                Ingrese sus credenciales para realizar la consulta
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleConsultar(); }} className="space-y-6">
          {/* Información del tercero */}
          {terceroNombre && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-blue-900 text-sm">Tercero a consultar:</span>
                  <p className="text-blue-800 font-medium">{terceroNombre}</p>
                </div>
              </div>
            </div>
          )}

          {/* Resumen de personas a consultar */}
          {loadingResumen && (
            <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-sm">Cargando resumen de personas...</span>
              </div>
            </div>
          )}

          {resumenPersonas?.success && (
            <ResumenPersonasStradata 
              resumen={resumenPersonas.resumen}
              className="max-h-60 overflow-y-auto"
            />
          )}

          {/* Usuario Stradata */}
          <div className="space-y-2">
            <Label htmlFor="usuario" className="text-sm font-medium text-gray-900">
              Usuario Stradata
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="usuario"
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Ingrese su usuario"
                disabled={consultandoStradata}
                className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Contraseña Stradata */}
          <div className="space-y-2">
            <Label htmlFor="contraseña" className="text-sm font-medium text-gray-900">
              Contraseña Stradata
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="contraseña"
                type={mostrarContraseña ? "text" : "password"}
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                placeholder="Ingrese su contraseña"
                disabled={consultandoStradata}
                className="pl-10 pr-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setMostrarContraseña(!mostrarContraseña)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={consultandoStradata}
              >
                {mostrarContraseña ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Información importante */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-800 font-medium">Información importante</p>
                <p className="text-xs text-amber-700 mt-1">
                  Los resultados de la consulta se enviarán por correo electrónico. 
                  El proceso puede tardar varios minutos dependiendo de la cantidad de información.
                </p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={consultandoStradata}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={consultandoStradata || !usuario.trim() || !contraseña.trim()}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 min-w-[120px]"
            >
              {consultandoStradata ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Consultando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Consultar
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ConsultaStrataModal;
