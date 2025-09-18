import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { TercerosService, CambiarEstadoRequest, tercerosDRFService } from "@/services/terceros.drf.service";
import { userService, User as UserType } from "@/services/user.service";
import { 
    FileCheck, 
    ArrowRight, 
    User, 
    Clock, 
    CheckCircle, 
    XCircle, 
    RotateCcw,
    AlertTriangle,
    Users
} from "lucide-react";

interface TerceroBasico {
    id: string;
    numero_documento: string;
    nombres?: string;
    apellidos?: string;
    razon_social?: string;
    tipo_persona: 'natural' | 'juridica';
    estado_aprobacion: string;
    usuario_asignado?: {
        id: number;
        username: string;
        full_name: string;
    };
    rol_asignado?: string;
}

interface EstadoAsignacionModalProps {
    isOpen: boolean;
    onClose: () => void;
    tercero: TerceroBasico;
    onSuccess: () => void;
    userRole: string; // Rol del usuario actual
    userId: number; // ID del usuario actual
}

// 🎯 DEFINIR TRANSICIONES PERMITIDAS POR ROL
const TRANSICIONES_POR_ROL = {
    comercial: {
        'pendiente': ['en_espera', 'pendiente'], // Info incorrecta o reasignar a admin
    },
    administrador: {
        'pendiente': ['en_curso', 'aprobado', 'finalizado'], // Puede hacer cualquier transición
        'en_espera': ['en_curso', 'aprobado', 'finalizado'],
        'en_curso': ['aprobado', 'rechazado', 'finalizado'],
        'devuelto': ['en_curso', 'finalizado'],
        'aprobado': ['finalizado'],
        'rechazado': ['finalizado']
    },
    procesos: {
        'en_curso': ['devuelto', 'en_curso', 'finalizado'] // No acepta, reasignar o enviar a contabilidad
    },
    oficial_cumplimiento: {
        'en_curso': ['aprobado', 'rechazado'] // Aprobar o rechazar
    }
};

const ESTADOS_INFO = {
    'pendiente': { label: 'Pendiente', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
    'en_espera': { label: 'En Espera', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800' },
    'en_curso': { label: 'En Curso', icon: FileCheck, color: 'bg-blue-100 text-blue-800' },
    'devuelto': { label: 'Devuelto', icon: RotateCcw, color: 'bg-red-100 text-red-800' },
    'aprobado': { label: 'Aprobado', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    'rechazado': { label: 'Rechazado', icon: XCircle, color: 'bg-red-100 text-red-800' },
    'finalizado': { label: 'Finalizado', icon: CheckCircle, color: 'bg-green-500 text-white' }
};

export function EstadoAsignacionModal({ isOpen, onClose, tercero, onSuccess, userRole, userId }: EstadoAsignacionModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [nuevoEstado, setNuevoEstado] = useState<string>('');
    const [comentario, setComentario] = useState<string>('');
    const [usuarios, setUsuarios] = useState<UserType[]>([]);
    const [usuarioAsignado, setUsuarioAsignado] = useState<string>('');
    const [rolAsignado, setRolAsignado] = useState<string>('');

    // Estados disponibles según el rol actual
    const estadosDisponibles = TRANSICIONES_POR_ROL[userRole as keyof typeof TRANSICIONES_POR_ROL]?.[tercero.estado_aprobacion as keyof any] || [];

    useEffect(() => {
        if (isOpen) {
            loadUsuarios();
            setComentario('');
            setNuevoEstado('');
            setUsuarioAsignado('');
            setRolAsignado('');
        }
    }, [isOpen]);

    const loadUsuarios = async () => {
        try {
            setLoading(true);
            const users = await userService.getUsers();
            setUsuarios(users);
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            // Usar datos mock si falla
            const mockUsers: UserType[] = [
                { id: '1', email: 'admin@euro.com', nombre_completo: 'Administrador Sistema', role: 'administrador', is_active: true, date_joined: '2024-01-01', last_login: '2025-09-04' },
                { id: '2', email: 'comercial@euro.com', nombre_completo: 'Juan Pérez', role: 'comercial', is_active: true, date_joined: '2024-01-01', last_login: '2025-09-04' },
                { id: '3', email: 'procesos@euro.com', nombre_completo: 'Ana Gómez', role: 'procesos', is_active: true, date_joined: '2024-01-01', last_login: '2025-09-04' },
                { id: '4', email: 'cumplimiento@euro.com', nombre_completo: 'Laura Sánchez', role: 'oficial_cumplimiento', is_active: true, date_joined: '2024-01-01', last_login: '2025-09-04' }
            ];
            setUsuarios(mockUsers);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!nuevoEstado) {
            toast({
                title: "Estado requerido",
                description: "Debes seleccionar un nuevo estado",
                variant: "destructive"
            });
            return;
        }

        if (!comentario.trim()) {
            toast({
                title: "Comentario obligatorio",
                description: "El comentario es obligatorio para todos los cambios",
                variant: "destructive"
            });
            return;
        }

        try {
            setLoading(true);

            const request: CambiarEstadoRequest = {
                estado: nuevoEstado as any,
                comentario: comentario.trim(),
                ...(usuarioAsignado && { asignar_a_id: parseInt(usuarioAsignado) }),
                ...(rolAsignado && { rol_asignado: rolAsignado as any })
            };

            // Usar el servicio DRF existente por ahora
            await tercerosDRFService.changeState(tercero.id, {
                estado: nuevoEstado as any,
                observaciones: comentario.trim(),
                rol_asignado: userRole as 'comercial' | 'administrador' | 'procesos' | 'oficial_cumplimiento'
            });

            toast({
                title: "✅ Cambio exitoso",
                description: `Estado cambiado a: ${ESTADOS_INFO[nuevoEstado as keyof typeof ESTADOS_INFO]?.label}`,
            });

            onSuccess();
            onClose();

        } catch (error: any) {
            console.error('Error cambiando estado:', error);
            toast({
                title: "Error",
                description: error.message || "Error al cambiar el estado",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const getDisplayName = (tercero: TerceroBasico) => {
        if (tercero.tipo_persona === 'natural') {
            return `${tercero.nombres || ''} ${tercero.apellidos || ''}`.trim();
        }
        return tercero.razon_social || tercero.numero_documento;
    };

    const estadoActualInfo = ESTADOS_INFO[tercero.estado_aprobacion as keyof typeof ESTADOS_INFO];
    const IconEstadoActual = estadoActualInfo?.icon || Clock;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-blue-600" />
                        Cambiar Estado y Asignación
                    </DialogTitle>
                    <DialogDescription>
                        Tercero: <strong>{getDisplayName(tercero)}</strong> - {tercero.numero_documento}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Estado Actual */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Estado Actual</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${estadoActualInfo?.color || 'bg-gray-100'}`}>
                                    <IconEstadoActual className="h-4 w-4" />
                                </div>
                                <div>
                                    <Badge variant="outline" className={estadoActualInfo?.color}>
                                        {estadoActualInfo?.label || tercero.estado_aprobacion}
                                    </Badge>
                                    {tercero.usuario_asignado && (
                                        <div className="text-xs text-gray-600 mt-1">
                                            Asignado a: <strong>{tercero.usuario_asignado.full_name}</strong> ({tercero.rol_asignado})
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Nuevo Estado */}
                    <div>
                        <Label htmlFor="nuevo-estado" className="text-sm font-medium">
                            Nuevo Estado <span className="text-red-500">*</span>
                        </Label>
                        <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Selecciona el nuevo estado" />
                            </SelectTrigger>
                            <SelectContent>
                                {estadosDisponibles.map((estado) => {
                                    const info = ESTADOS_INFO[estado as keyof typeof ESTADOS_INFO];
                                    const Icon = info?.icon || Clock;
                                    return (
                                        <SelectItem key={estado} value={estado}>
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-4 w-4" />
                                                {info?.label || estado}
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Asignación (opcional) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="usuario-asignado" className="text-sm font-medium">
                                Asignar a Usuario (opcional)
                            </Label>
                            <Select value={usuarioAsignado} onValueChange={setUsuarioAsignado}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Seleccionar usuario" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Sin cambio de usuario</SelectItem>
                                    {usuarios.map((user) => (
                                        <SelectItem key={user.id} value={user.id}>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                {user.nombre_completo} ({user.role})
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="rol-asignado" className="text-sm font-medium">
                                Rol Asignado (opcional)
                            </Label>
                            <Select value={rolAsignado} onValueChange={setRolAsignado}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Sin cambio de rol</SelectItem>
                                    <SelectItem value="comercial">Comercial</SelectItem>
                                    <SelectItem value="procesos">Procesos</SelectItem>
                                    <SelectItem value="oficial_cumplimiento">Oficial de Cumplimiento</SelectItem>
                                    <SelectItem value="administrador">Administrador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Comentario Obligatorio */}
                    <div>
                        <Label htmlFor="comentario" className="text-sm font-medium">
                            Comentario <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="comentario"
                            value={comentario}
                            onChange={(e) => setComentario(e.target.value)}
                            placeholder="Describe el motivo del cambio (obligatorio)"
                            className="mt-1"
                            rows={3}
                        />
                    </div>

                    {estadosDisponibles.length === 0 && (
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                No hay transiciones de estado disponibles para tu rol desde el estado actual.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={loading || !nuevoEstado || !comentario.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {loading ? 'Procesando...' : 'Confirmar Cambio'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
