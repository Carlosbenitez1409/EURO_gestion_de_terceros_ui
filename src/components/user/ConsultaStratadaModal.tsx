import React, { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, User, Lock, AlertCircle, Eye, EyeOff, Users, CheckCircle, Gavel, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UsuariosConsultasService } from '@/services/usuarios-consultas.service';

interface ConsultaStratadaModalProps {
    solicitudId: string;
    solicitudNumero?: string;
    personas: Array<{
        id: string;
        nombresApellidos: string;
        numeroDocumento: string;
        tipoDocumento: string;
    }>;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (result: any) => void;
}

export const ConsultaStratadaModal: React.FC<ConsultaStratadaModalProps> = ({
    solicitudId,
    solicitudNumero,
    personas,
    isOpen,
    onClose,
    onSuccess
}) => {
    const { toast } = useToast();
    const [usuario, setUsuario] = useState('');
    const [contraseña, setContraseña] = useState('');
    const [mostrarContraseña, setMostrarContraseña] = useState(false);
    const [consultando, setConsultando] = useState(false);

    const handleConsultar = async () => {
        if (!usuario.trim() || !contraseña.trim()) {
            toast({
                title: "⚠️ Datos incompletos",
                description: "Por favor ingrese usuario y contraseña de Stradata",
                variant: "destructive"
            });
            return;
        }

        if (!personas || personas.length === 0) {
            toast({
                title: "⚠️ Sin personas",
                description: "No hay personas para consultar en esta solicitud",
                variant: "destructive"
            });
            return;
        }

        try {
            setConsultando(true);

            // Mostrar toast informativo sobre el tiempo de espera
            toast({
                title: "🔍 Consultando Stradata...",
                description: `Procesando ${personas.length} persona(s). Esto puede tomar varios minutos.`,
                variant: "default"
            });

            // Usar el ID de la primera persona para la consulta
            // El backend debería manejar la consulta de todas las personas de la solicitud
            const resultado = await UsuariosConsultasService.consultarStradata(solicitudId, {
                username: usuario.trim(),
                password: contraseña.trim(),
                persona_id: personas[0].id
            });

            // Verificar si la consulta fue exitosa usando la estructura real del backend
            if (resultado.consulta_realizada && resultado.resultados?.consulta_exitosa) {
                // Log de debug para ver la respuesta completa
                console.log('🔍 DEBUG - Respuesta exitosa de Stradata:', resultado);
                
                // Extraer información detallada de la respuesta
                const resultados = resultado.resultados;
                const personasConsultadas = resultado.personas_consultadas?.length || 0;
                const codigoBusqueda = resultados.codigo_busqueda;
                const servicios = resultados.resumen_servicios;
                
                // Crear mensaje detallado del éxito
                let mensajeDetallado = `Se consultaron ${personasConsultadas} personas correctamente`;
                
                if (codigoBusqueda) {
                    mensajeDetallado += `\n📋 Código: ${codigoBusqueda}`;
                }
                
                if (servicios) {
                    mensajeDetallado += `\n🔍 Servicios: ${servicios.exitosos}/${servicios.total} exitosos`;
                }
                
                // Usar el mensaje de detalles del backend
                if (resultados.detalles) {
                    mensajeDetallado += `\n📧 ${resultados.detalles}`;
                } else {
                    mensajeDetallado += `\n📧 Resultados enviados por correo`;
                }

                toast({
                    title: "✅ Consulta Stradata exitosa",
                    description: mensajeDetallado,
                    variant: "default",
                    duration: 6000 // Más tiempo para leer toda la información
                });

                // Limpiar contraseña por seguridad
                setContraseña('');

                // Cerrar modal
                onClose();

                // Callback opcional para refrescar datos
                if (onSuccess) {
                    onSuccess(resultado);
                }
            } else {
                // Log de debug para ver la respuesta de error
                console.log('❌ DEBUG - Respuesta de error de Stradata:', resultado);
                
                // Manejar respuesta de error del backend
                const errorMessage = resultado.resultados?.detalles || "No se pudo completar la consulta en Stradata";
                const servicios = resultado.resultados?.resumen_servicios;
                
                let mensajeError = errorMessage;
                
                // Si hay información de servicios fallidos, incluirla
                if (servicios && servicios.fallidos > 0) {
                    mensajeError += `\n❌ Servicios fallidos: ${servicios.fallidos}/${servicios.total}`;
                }

                toast({
                    title: "❌ Error en consulta Stradata",
                    description: mensajeError,
                    variant: "destructive",
                    duration: 5000
                });
            }
        } catch (error: any) {
            console.error('Error consultando Stradata:', error);

            // Manejar diferentes tipos de errores
            let errorMessage = "Error al consultar Stradata";

            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                errorMessage = "La consulta está tomando más tiempo del esperado. El proceso puede estar ejecutándose en el backend.";
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
                
                // Si el backend devuelve información parcial de servicios en el error
                if (error.response.data.data?.resumen_servicios) {
                    const servicios = error.response.data.data.resumen_servicios;
                    errorMessage += `\n🔍 Servicios: ${servicios.exitosos}/${servicios.total} exitosos`;
                }
            } else if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast({
                title: "❌ Error en consulta Stradata",
                description: errorMessage,
                variant: "destructive",
                duration: 5000
            });
        } finally {
            setConsultando(false);
        }
    };

    const handleClose = () => {
        if (!consultando) {
            setUsuario('');
            setContraseña('');
            setMostrarContraseña(false);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                {/* Header con gradiente azul */}
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

                    {/* Botón cerrar personalizado */}
                    <button
                        onClick={handleClose}
                        disabled={consultando}
                        className="absolute right-4 top-4 rounded-sm opacity-70 text-white hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>

                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleConsultar(); }}>
                    {/* Información de la solicitud */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg">
                                <User className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <span className="font-semibold text-blue-900 text-sm">Solicitud a consultar:</span>
                                <p className="text-blue-800 font-medium">{solicitudNumero || `Solicitud ${solicitudId.slice(-8)}`}</p>
                            </div>
                        </div>
                    </div>

                    {/* Resumen de consulta */}
                    <Card className="border border-blue-200 max-h-60 overflow-y-auto">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 pb-3">
                            <CardTitle className="flex items-center gap-2 text-blue-800">
                                <Users className="h-5 w-5" />
                                Resumen de Consulta Stradata
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            {/* Total de personas */}
                            <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <span className="font-medium text-blue-800">Total de personas a consultar:</span>
                                <Badge className="bg-blue-500 text-white">
                                    {personas.length}
                                </Badge>
                            </div>

                            {/* Lista de personas */}
                            <div className="space-y-3">
                                {personas.map((persona, index) => (
                                    <div key={index} className="border rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Gavel className="h-4 w-4" />
                                                <span className="font-medium text-gray-800">{persona.nombresApellidos}</span>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-600 pl-6">
                                            • {persona.tipoDocumento}: {persona.numeroDocumento}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Credenciales */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="usuario" className="text-sm font-medium text-gray-900">
                                Usuario Stradata
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="usuario"
                                    type="text"
                                    placeholder="Ingrese su usuario"
                                    value={usuario}
                                    onChange={(e) => setUsuario(e.target.value)}
                                    className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                                    disabled={consultando}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contraseña" className="text-sm font-medium text-gray-900">
                                Contraseña Stradata
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="contraseña"
                                    type={mostrarContraseña ? "text" : "password"}
                                    placeholder="Ingrese su contraseña"
                                    value={contraseña}
                                    onChange={(e) => setContraseña(e.target.value)}
                                    className="pl-10 pr-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                                    disabled={consultando}
                                />
                                <button
                                    type="button"
                                    onClick={() => setMostrarContraseña(!mostrarContraseña)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                                    disabled={consultando}
                                >
                                    {mostrarContraseña ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Información importante */}
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-amber-800 font-medium">Tiempo estimado de consulta</p>
                                <p className="text-xs text-amber-700 mt-1">
                                    <strong>• {personas.length} persona(s):</strong> ~{Math.ceil(personas.length * 1.2)} minutos aproximadamente
                                    <br />
                                    • Los resultados se registrarán automáticamente en el historial
                                    <br />
                                    • Por favor mantenga esta ventana abierta durante el proceso
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
                            disabled={consultando}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={consultando || !usuario.trim() || !contraseña.trim()}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 min-w-[150px]"
                        >
                            {consultando ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Procesando... {personas.length} persona(s)</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    <span>Consultar {personas.length} persona(s)</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ConsultaStratadaModal;