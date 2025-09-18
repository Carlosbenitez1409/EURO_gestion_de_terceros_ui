import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TercerosService, HistorialEntry } from "@/services/terceros.drf.service";
import { 
    History, 
    Clock, 
    User, 
    FileText, 
    ArrowRight,
    CheckCircle,
    XCircle,
    AlertTriangle,
    RotateCcw,
    FileCheck
} from "lucide-react";

interface HistorialModalProps {
    isOpen: boolean;
    onClose: () => void;
    terceroId: string;
    terceroNombre: string;
}

const ESTADOS_ICONS = {
    'pendiente': { icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
    'en_espera': { icon: AlertTriangle, color: 'bg-orange-100 text-orange-800' },
    'en_curso': { icon: FileCheck, color: 'bg-blue-100 text-blue-800' },
    'devuelto': { icon: RotateCcw, color: 'bg-red-100 text-red-800' },
    'aprobado': { icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    'rechazado': { icon: XCircle, color: 'bg-red-100 text-red-800' },
    'finalizado': { icon: CheckCircle, color: 'bg-green-500 text-white' }
};

export function HistorialModal({ isOpen, onClose, terceroId, terceroNombre }: HistorialModalProps) {
    const [historial, setHistorial] = useState<HistorialEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && terceroId) {
            loadHistorial();
        }
    }, [isOpen, terceroId]);

    const loadHistorial = async () => {
        try {
            setLoading(true);
            // TODO: Implementar cuando el backend esté listo
            // const data = await TercerosService.obtenerHistorial(terceroId);
            // setHistorial(data);
            
            // Usar datos mock para demostración
            const mockHistorial: HistorialEntry[] = [
                {
                    id: 1,
                    fecha: '2025-09-01T10:30:00Z',
                    usuario: {
                        id: 2,
                        username: 'jperez',
                        first_name: 'Juan',
                        last_name: 'Pérez',
                        full_name: 'Juan Pérez'
                    },
                    rol_usuario: 'comercial',
                    estado_anterior: 'pendiente',
                    estado_nuevo: 'en_espera',
                    usuario_asignado_anterior: {
                        id: 2,
                        username: 'jperez',
                        full_name: 'Juan Pérez'
                    },
                    usuario_asignado_nuevo: {
                        id: 2,
                        username: 'jperez',
                        full_name: 'Juan Pérez'
                    },
                    rol_asignado_anterior: 'comercial',
                    rol_asignado_nuevo: 'comercial',
                    comentario: 'Se devuelve al tercero por error en NIT.'
                },
                {
                    id: 2,
                    fecha: '2025-09-03T14:15:00Z',
                    usuario: {
                        id: 1,
                        username: 'mlopez',
                        first_name: 'María',
                        last_name: 'López',
                        full_name: 'María López'
                    },
                    rol_usuario: 'administrador',
                    estado_anterior: 'en_espera',
                    estado_nuevo: 'en_curso',
                    usuario_asignado_anterior: {
                        id: 2,
                        username: 'jperez',
                        full_name: 'Juan Pérez'
                    },
                    usuario_asignado_nuevo: {
                        id: 3,
                        username: 'agomez',
                        full_name: 'Ana Gómez'
                    },
                    rol_asignado_anterior: 'comercial',
                    rol_asignado_nuevo: 'procesos',
                    comentario: 'Validado por admin y asignado a procesos.'
                },
                {
                    id: 3,
                    fecha: '2025-09-05T16:45:00Z',
                    usuario: {
                        id: 3,
                        username: 'agomez',
                        first_name: 'Ana',
                        last_name: 'Gómez',
                        full_name: 'Ana Gómez'
                    },
                    rol_usuario: 'procesos',
                    estado_anterior: 'en_curso',
                    estado_nuevo: 'devuelto',
                    usuario_asignado_anterior: {
                        id: 3,
                        username: 'agomez',
                        full_name: 'Ana Gómez'
                    },
                    usuario_asignado_nuevo: {
                        id: 2,
                        username: 'jperez',
                        full_name: 'Juan Pérez'
                    },
                    rol_asignado_anterior: 'procesos',
                    rol_asignado_nuevo: 'comercial',
                    comentario: 'Falta certificación bancaria.'
                }
            ];
            setHistorial(mockHistorial);
        } finally {
            setLoading(false);
        }
    };

    const formatFecha = (fecha: string) => {
        return new Date(fecha).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getEstadoIcon = (estado: string) => {
        const info = ESTADOS_ICONS[estado as keyof typeof ESTADOS_ICONS];
        if (!info) return { icon: Clock, color: 'bg-gray-100 text-gray-800' };
        return info;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-blue-600" />
                        Historial de Cambios
                    </DialogTitle>
                    <DialogDescription>
                        Tercero: <strong>{terceroNombre}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                <p className="text-sm text-gray-600">Cargando historial...</p>
                            </div>
                        </div>
                    ) : historial.length === 0 ? (
                        <div className="text-center py-8">
                            <History className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600">No hay historial disponible</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {historial.map((entry, index) => {
                                const estadoAnteriorInfo = getEstadoIcon(entry.estado_anterior);
                                const estadoNuevoInfo = getEstadoIcon(entry.estado_nuevo);
                                const IconAnterior = estadoAnteriorInfo.icon;
                                const IconNuevo = estadoNuevoInfo.icon;

                                return (
                                    <Card key={entry.id} className="border-l-4 border-l-blue-500">
                                        <CardContent className="pt-4">
                                            <div className="flex items-start gap-4">
                                                {/* Timeline */}
                                                <div className="flex flex-col items-center">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span className="text-xs font-bold text-blue-600">
                                                            {historial.length - index}
                                                        </span>
                                                    </div>
                                                    {index < historial.length - 1 && (
                                                        <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                                                    )}
                                                </div>

                                                {/* Contenido */}
                                                <div className="flex-1 min-w-0">
                                                    {/* Header con fecha y usuario */}
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-gray-500" />
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {formatFecha(entry.fecha)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-gray-500" />
                                                            <span className="text-sm text-gray-600">
                                                                {entry.usuario.full_name}
                                                            </span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {entry.rol_usuario}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    {/* Cambio de estado */}
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-1.5 rounded ${estadoAnteriorInfo.color}`}>
                                                                <IconAnterior className="h-3 w-3" />
                                                            </div>
                                                            <span className="text-sm capitalize">{entry.estado_anterior}</span>
                                                        </div>
                                                        
                                                        <ArrowRight className="h-4 w-4 text-gray-400" />
                                                        
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-1.5 rounded ${estadoNuevoInfo.color}`}>
                                                                <IconNuevo className="h-3 w-3" />
                                                            </div>
                                                            <span className="text-sm capitalize font-medium">{entry.estado_nuevo}</span>
                                                        </div>
                                                    </div>

                                                    {/* Cambio de asignación */}
                                                    {(entry.usuario_asignado_anterior || entry.usuario_asignado_nuevo) && (
                                                        <div className="flex items-center gap-3 mb-3 text-sm">
                                                            <span className="text-gray-600">Asignado:</span>
                                                            {entry.usuario_asignado_anterior && (
                                                                <span className="text-gray-700">
                                                                    {entry.usuario_asignado_anterior.full_name} ({entry.rol_asignado_anterior})
                                                                </span>
                                                            )}
                                                            {entry.usuario_asignado_anterior && entry.usuario_asignado_nuevo && (
                                                                <ArrowRight className="h-3 w-3 text-gray-400" />
                                                            )}
                                                            {entry.usuario_asignado_nuevo && (
                                                                <span className="text-gray-900 font-medium">
                                                                    {entry.usuario_asignado_nuevo.full_name} ({entry.rol_asignado_nuevo})
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Comentario */}
                                                    <div className="flex items-start gap-2 bg-gray-50 rounded p-3">
                                                        <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                                                        <p className="text-sm text-gray-700 leading-relaxed">
                                                            {entry.comentario}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
