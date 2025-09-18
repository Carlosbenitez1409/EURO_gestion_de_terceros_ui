import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { tercerosDRFService } from "@/services/terceros.drf.service";
import { userService, User as UserType } from "@/services/user.service";
import {
    ArrowLeft,
    Shield,
    ShoppingCart,
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    User
} from "lucide-react";

interface TerceroBasico {
    id: string;
    numero_documento: string;
    nombres?: string;
    apellidos?: string;
    razon_social?: string;
    tipo_persona: 'natural' | 'juridica';
    estado_aprobacion: string;
}

interface ProcesosAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    tercero: TerceroBasico;
    onAssignmentSuccess: () => void;
}

export function ProcesosAssignmentModal({ isOpen, onClose, tercero, onAssignmentSuccess }: ProcesosAssignmentModalProps) {
    const { toast } = useToast();
    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAction, setSelectedAction] = useState<'devolver' | 'enviar_cumplimiento' | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    const [observaciones, setObservaciones] = useState("");
    const [comerciales, setComerciales] = useState<UserType[]>([]);
    const [oficialesCumplimiento, setOficialesCumplimiento] = useState<UserType[]>([]);

    useEffect(() => {
        if (isOpen) {
            loadUsuarios();
        }
    }, [isOpen]);

    const loadUsuarios = async () => {
        setLoading(true);
        try {
            // Cargar usuarios agrupados por rol
            const usuariosPorRol = await userService.getUsersByRole();
            
            // Extraer comerciales y oficiales de cumplimiento
            setComerciales(usuariosPorRol.comercial || []);
            setOficialesCumplimiento(usuariosPorRol.oficial_cumplimiento || []);

        } catch (error) {
            console.error('Error cargando usuarios:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los usuarios disponibles",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAsignar = async () => {
        if (!selectedUser || !selectedAction) {
            toast({
                title: "Información faltante",
                description: "Selecciona una acción y un usuario",
                variant: "destructive"
            });
            return;
        }

        if (!observaciones.trim()) {
            toast({
                title: "Observaciones requeridas",
                description: "Las observaciones son obligatorias para reasignaciones",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            if (selectedAction === 'devolver') {
                // Devolver a comercial - cambiar estado a pendiente
                await tercerosDRFService.changeState(tercero.id, {
                    estado: 'devuelto_comercial',
                    observaciones: `Devuelto por procesos a comercial: ${observaciones}`,
                    rol_asignado: 'procesos'
                });

                toast({
                    title: "✅ Tercero devuelto",
                    description: `Tercero devuelto a ${selectedUser.nombre_completo} (Comercial)`,
                    className: "bg-blue-50 border-blue-200"
                });

            } else if (selectedAction === 'enviar_cumplimiento') {
                // Enviar a cumplimiento - En el nuevo flujo, esto es 'aprobado'
                await tercerosDRFService.changeState(tercero.id, {
                    estado: 'asignada_oficial_cumplimiento', // 🆕 Nuevo estado para cumplimiento
                    observaciones: `Aprobado por procesos - Listo para cumplimiento: ${observaciones}`,
                    rol_asignado: 'procesos'
                });

                toast({
                    title: "✅ Enviado a cumplimiento",
                    description: `Tercero aprobado - Disponible para ${selectedUser.nombre_completo} (Oficial de Cumplimiento)`,
                    className: "bg-purple-50 border-purple-200"
                });
            }

            onAssignmentSuccess();
            handleClose();

        } catch (error) {
            console.error('Error en reasignación:', error);
            toast({
                title: "Error en reasignación",
                description: "No se pudo completar la reasignación",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedAction(null);
        setSelectedUser(null);
        setObservaciones("");
        onClose();
    };

    const getNombreCompleto = (tercero: TerceroBasico) => {
        if (tercero.tipo_persona === 'natural') {
            return `${tercero.nombres || ''} ${tercero.apellidos || ''}`.trim();
        }
        return tercero.razon_social || 'Sin nombre';
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        Reasignación de Tercero - Procesos
                    </DialogTitle>
                    <DialogDescription>
                        Selecciona una acción para el tercero: {getNombreCompleto(tercero)}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Información del tercero */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Información del Tercero</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Documento</Label>
                                    <p className="text-sm">{tercero.numero_documento}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Estado Actual</Label>
                                    <Badge variant="outline">{tercero.estado_aprobacion}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Selección de acción */}
                    <div className="space-y-4">
                        <Label className="text-base font-medium">¿Qué acción deseas realizar?</Label>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Devolver a comercial */}
                            <Card 
                                className={`cursor-pointer transition-all border-2 ${selectedAction === 'devolver' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                                onClick={() => setSelectedAction('devolver')}
                            >
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <ArrowLeft className="h-5 w-5 text-blue-600" />
                                        Devolver a Comercial
                                    </CardTitle>
                                    <CardDescription>
                                        El tercero requiere correcciones o información adicional
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            {/* Enviar a cumplimiento */}
                            <Card 
                                className={`cursor-pointer transition-all border-2 ${selectedAction === 'enviar_cumplimiento' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}
                                onClick={() => setSelectedAction('enviar_cumplimiento')}
                            >
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Shield className="h-5 w-5 text-purple-600" />
                                        Enviar a Cumplimiento
                                    </CardTitle>
                                    <CardDescription>
                                        El tercero está listo para revisión de cumplimiento
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                    </div>

                    {/* Selección de usuario */}
                    {selectedAction && (
                        <div className="space-y-4">
                            <Label className="text-base font-medium">
                                {selectedAction === 'devolver' ? 'Seleccionar Comercial' : 'Seleccionar Oficial de Cumplimiento'}
                            </Label>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                                {(selectedAction === 'devolver' ? comerciales : oficialesCumplimiento).map((user) => (
                                    <Card 
                                        key={user.id}
                                        className={`cursor-pointer transition-all border ${selectedUser?.id === user.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                                        onClick={() => setSelectedUser(user)}
                                    >
                                        <CardContent className="p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                    {selectedAction === 'devolver' ? (
                                                        <ShoppingCart className="h-4 w-4" />
                                                    ) : (
                                                        <Shield className="h-4 w-4" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">
                                                        {user.nombre_completo}
                                                    </p>
                                                    <p className="text-xs text-gray-600">{user.email}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {loading && (
                                <div className="flex items-center justify-center py-4">
                                    <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                                    <span className="ml-2">Cargando usuarios...</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Observaciones */}
                    {selectedAction && (
                        <div className="space-y-2">
                            <Label className="text-base font-medium">
                                Observaciones *
                            </Label>
                            <Textarea
                                placeholder={
                                    selectedAction === 'devolver' 
                                        ? "Explicar qué necesita corregirse o completarse..."
                                        : "Motivo del envío a cumplimiento..."
                                }
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                className="min-h-20"
                            />
                        </div>
                    )}

                    {/* Alert informativo */}
                    {selectedAction && selectedUser && (
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                {selectedAction === 'devolver' 
                                    ? `El tercero será devuelto a ${selectedUser.nombre_completo} para correcciones.`
                                    : `El tercero será enviado a ${selectedUser.nombre_completo} para revisión de cumplimiento.`
                                }
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Botones */}
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={handleClose}>
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleAsignar}
                            disabled={!selectedAction || !selectedUser || !observaciones.trim() || loading}
                            className="gap-2"
                        >
                            {loading ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle className="h-4 w-4" />
                            )}
                            {selectedAction === 'devolver' ? 'Devolver a Comercial' : 'Enviar a Cumplimiento'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
