import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, AlertTriangle, CheckCircle, Loader2, Plus, X, Eye } from 'lucide-react';
import { apiRequest } from '@/lib/api.client';

interface EnviarInformacionButtonProps {
    terceroId: string;
    terceroNombre: string;
    terceroEstado: string;
    userRole: string;
}

interface ConfiguracionEmailResponse {
    destinatarios_predeterminados: string[];
    estados_permitidos: string[];
    opciones: {
        incluir_cert_bancaria: boolean;
        incluir_info_comercial: boolean;
        incluir_info_adicional: boolean;
    };
}

interface EnvioEmailResponse {
    success: boolean;
    message: string;
    destinatarios: string[];
    tercero_id: string;
    tercero_nombre: string;
    error?: string;
}

interface PreviewEmailResponse {
    html_content: string;
    subject: string;
    destinatarios: string[];
}

export function EnviarInformacionButton({ terceroId, terceroNombre, terceroEstado, userRole }: EnviarInformacionButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [destinatariosPredeterminados, setDestinatariosPredeterminados] = useState<string[]>([]);
    const [destinatariosAdicionales, setDestinatariosAdicionales] = useState<string[]>(['']);
    const [configuracion, setConfiguracion] = useState<ConfiguracionEmailResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingConfig, setLoadingConfig] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const { toast } = useToast();

    // Roles que pueden ver el botón
    const rolesPermitidos = ['administrador', 'procesos', 'oficial_cumplimiento'];
    
    // No mostrar el botón si el usuario no tiene permisos
    if (!rolesPermitidos.includes(userRole)) {
        return null;
    }

    const cargarConfiguracion = async () => {
        setLoadingConfig(true);
        try {
            const response = await apiRequest.get<ConfiguracionEmailResponse>('email/configuracion/');
            setConfiguracion(response);
            setDestinatariosPredeterminados(response.destinatarios_predeterminados || []);
        } catch (error: any) {
            console.error('Error cargando configuración:', error);
            toast({
                title: "Error",
                description: "No se pudo cargar la configuración de correo",
                variant: "destructive",
            });
        } finally {
            setLoadingConfig(false);
        }
    };

    const enviarCorreo = async () => {
        // Validar que la configuración esté cargada
        if (!configuracion) {
            toast({
                title: "Error",
                description: "La configuración de correo no está disponible",
                variant: "destructive",
            });
            return;
        }

        // Filtrar emails adicionales válidos
        const emailsAdicionales = destinatariosAdicionales
            .map(email => email.trim())
            .filter(email => email && isValidEmail(email));

        setLoading(true);
        try {
            const response = await apiRequest.post<EnvioEmailResponse>(
                `email/tercero/${terceroId}/enviar/`,
                {
                    destinatarios_adicionales: emailsAdicionales,
                    incluir_cert_bancaria: configuracion?.opciones?.incluir_cert_bancaria ?? false,
                    incluir_info_comercial: configuracion?.opciones?.incluir_info_comercial ?? true,
                    incluir_info_adicional: configuracion?.opciones?.incluir_info_adicional ?? true
                }
            );

            if (response.success) {
                toast({
                    title: "¡Correo Enviado!",
                    description: `${response.message}. Enviado a: ${response.destinatarios.join(', ')}`,
                    variant: "default",
                });

                // Resetear formulario
                setDestinatariosAdicionales(['']);
                setIsOpen(false);
            } else {
                throw new Error(response.error || 'Error desconocido');
            }
        } catch (error: any) {
            console.error('Error enviando correo:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Error al enviar el correo';
            toast({
                title: "Error al Enviar",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const verPreview = async () => {
        setLoadingPreview(true);
        try {
            const response = await apiRequest.get<PreviewEmailResponse>(`email/tercero/${terceroId}/preview/`);
            
            // Abrir una nueva ventana con el preview del email
            const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
            if (newWindow) {
                newWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Preview: ${response.subject}</title>
                        <meta charset="utf-8">
                    </head>
                    <body>
                        <div style="padding: 20px; font-family: Arial, sans-serif;">
                            <h2 style="color: #0052CC; border-bottom: 2px solid #0052CC; padding-bottom: 10px;">
                                Preview del Correo
                            </h2>
                            <p><strong>Asunto:</strong> ${response.subject}</p>
                            <p><strong>Destinatarios:</strong> ${response.destinatarios.join(', ')}</p>
                            <hr style="margin: 20px 0;">
                            ${response.html_content}
                        </div>
                    </body>
                    </html>
                `);
                newWindow.document.close();
            }
            
            toast({
                title: "Preview Generado",
                description: "Se abrió una nueva ventana con el preview del correo",
                variant: "default",
            });
        } catch (error: any) {
            console.error('Error obteniendo preview:', error);
            toast({
                title: "Error en Preview",
                description: "No se pudo generar el preview del correo",
                variant: "destructive",
            });
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleOpenDialog = () => {
        setIsOpen(true);
        cargarConfiguracion();
    };

    const agregarCampoEmail = () => {
        setDestinatariosAdicionales([...destinatariosAdicionales, '']);
    };

    const eliminarCampoEmail = (index: number) => {
        if (destinatariosAdicionales.length > 1) {
            const nuevosDestinatarios = destinatariosAdicionales.filter((_, i) => i !== index);
            setDestinatariosAdicionales(nuevosDestinatarios);
        }
    };

    const actualizarEmailAdicional = (index: number, valor: string) => {
        const nuevosDestinatarios = [...destinatariosAdicionales];
        nuevosDestinatarios[index] = valor;
        setDestinatariosAdicionales(nuevosDestinatarios);
    };

    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    return (
        <>
            <Button
                onClick={handleOpenDialog}
                variant="outline"
                className="border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC]/10"
            >
                <Mail className="h-4 w-4 mr-2" />
                Enviar Información
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-lg bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-[#0052CC]" />
                            Enviar Correo de Aprobación
                        </DialogTitle>
                        <DialogDescription>
                            Enviar por correo electrónico la información del tercero aprobado
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Información del tercero */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-gray-700">Tercero:</p>
                            <p className="text-gray-900">{terceroNombre}</p>
                            <p className="text-sm text-gray-600">Estado: {terceroEstado}</p>
                        </div>

                        {/* Loading de configuración */}
                        {loadingConfig ? (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                <span className="text-sm text-blue-700">Cargando configuración...</span>
                            </div>
                        ) : configuracion ? (
                            <>
                                {/* Destinatarios predeterminados */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Destinatarios Predeterminados</Label>
                                    <div className="space-y-2">
                                        {destinatariosPredeterminados.map((email, index) => (
                                            <div key={index} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                <span className="text-sm text-green-800 font-medium">{email}</span>
                                                <Badge variant="secondary" className="ml-auto text-xs">Predeterminado</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Destinatarios adicionales */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Destinatarios Adicionales (Opcional)</Label>
                                    <div className="space-y-2">
                                        {destinatariosAdicionales.map((email, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <Input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => actualizarEmailAdicional(index, e.target.value)}
                                                    placeholder="correo@ejemplo.com"
                                                    className="flex-1"
                                                />
                                                {destinatariosAdicionales.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => eliminarCampoEmail(index)}
                                                        className="p-2"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={agregarCampoEmail}
                                        className="w-full border-dashed"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Agregar otro email
                                    </Button>
                                </div>

                                {/* Información sobre qué se enviará */}
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-sm font-medium text-blue-800 mb-1">Se enviará:</p>
                                    <ul className="text-xs text-blue-700 space-y-1">
                                        <li>• Información completa del tercero aprobado</li>
                                        <li>• Datos de contacto y comerciales</li>
                                        <li>• Documentos de certificación bancaria</li>
                                        <li>• Estado de aprobación actual</li>
                                    </ul>
                                </div>
                            </>
                        ) : (
                            <div className="p-3 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-700">Error al cargar la configuración de correo</p>
                            </div>
                        )}

                        {/* Botones */}
                        <div className="flex justify-between items-center pt-4">
                            <div className="flex gap-2">
                                {configuracion && (
                                    <Button
                                        onClick={verPreview}
                                        disabled={loadingPreview}
                                        variant="outline"
                                        className="border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC]/10"
                                    >
                                        {loadingPreview ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Cargando...
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="h-4 w-4 mr-2" />
                                                Preview
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                            
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsOpen(false)}
                                    disabled={loading || loadingPreview}
                                >
                                    Cancelar
                                </Button>
                                
                                {configuracion && (
                                    <Button
                                        onClick={enviarCorreo}
                                        disabled={loading || loadingPreview}
                                        className="bg-[#0052CC] hover:bg-[#003A8C] text-white"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Confirmar Envío
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
