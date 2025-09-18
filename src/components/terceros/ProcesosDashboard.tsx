import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileCheck, Send, X, Clock, CheckCircle, Loader2, UserCheck } from "lucide-react";
import { Tercero, tercerosService } from "@/services/terceros.service";
import { useToast } from "@/hooks/use-toast";
import { TerceroApprovalFlow } from "./TerceroApprovalFlow";
import { UserAssignmentModal } from "@/components/admin/UserAssignmentModal";
import { EstadoAsignacionModal } from "@/components/common/EstadoAsignacionModal";
import { HistorialModal } from "@/components/common/HistorialModal";

interface ProcesosDashboardProps {
    onRefresh?: () => void;
}

export function ProcesosDashboard({ onRefresh }: ProcesosDashboardProps) {
    const [misAsignaciones, setMisAsignaciones] = useState<Tercero[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTercero, setSelectedTercero] = useState<Tercero | null>(null);
    const [accion, setAccion] = useState<'aprobar' | 'enviar_cumplimiento' | null>(null);
    const [comentarios, setComentarios] = useState("");
    const [procesando, setProcesando] = useState(false);
    // Estados para modal de reasignación
    const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
    const [terceroToReassign, setTerceroToReassign] = useState<Tercero | null>(null);
    
    // 🆕 Estados para nuevos modales
    const [estadoModalOpen, setEstadoModalOpen] = useState(false);
    const [historialModalOpen, setHistorialModalOpen] = useState(false);
    const [terceroSeleccionado, setTerceroSeleccionado] = useState<Tercero | null>(null);
    
    const { toast } = useToast();

    useEffect(() => {
        loadMisAsignaciones();
    }, []);

    const loadMisAsignaciones = async () => {
        setLoading(true);
        try {
            const asignaciones = await tercerosService.getMisAsignacionesProcesos();
            setMisAsignaciones(asignaciones);
        } catch (error) {
            console.error('Error cargando asignaciones:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar las asignaciones",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAprobarProcesos = async () => {
        if (!selectedTercero) return;

        setProcesando(true);
        try {
            await tercerosService.aprobarProcesos(selectedTercero.id, comentarios);
            
            toast({
                title: "Aprobación exitosa",
                description: "Tercero aprobado por procesos correctamente",
                variant: "default"
            });

            await loadMisAsignaciones();
            cerrarDialog();
            onRefresh?.();
        } catch (error) {
            toast({
                title: "Error en aprobación",
                description: "No se pudo aprobar el tercero",
                variant: "destructive"
            });
        } finally {
            setProcesando(false);
        }
    };

    const handleEnviarACumplimiento = async () => {
        if (!selectedTercero) return;

        setProcesando(true);
        try {
            await tercerosService.enviarACumplimiento(selectedTercero.id, comentarios);
            
            toast({
                title: "Enviado a cumplimiento",
                description: "Tercero enviado a cumplimiento para revisión adicional",
                variant: "default"
            });

            await loadMisAsignaciones();
            cerrarDialog();
            onRefresh?.();
        } catch (error) {
            toast({
                title: "Error al enviar",
                description: "No se pudo enviar el tercero a cumplimiento",
                variant: "destructive"
            });
        } finally {
            setProcesando(false);
        }
    };

    const cerrarDialog = () => {
        setSelectedTercero(null);
        setAccion(null);
        setComentarios("");
    };

    const abrirDialogAccion = (tercero: Tercero, tipoAccion: 'aprobar' | 'enviar_cumplimiento') => {
        setSelectedTercero(tercero);
        setAccion(tipoAccion);
        setComentarios("");
    };

    const handleReassignmentModalOpen = (tercero: Tercero) => {
        setTerceroToReassign(tercero);
        setAssignmentModalOpen(true);
    };

    const handleAssignmentSuccess = () => {
        loadMisAsignaciones(); // Recargar lista después de asignación exitosa
        onRefresh?.();
    };

    // 🆕 Funciones para nuevos modales
    const abrirEstadoModal = (tercero: Tercero) => {
        setTerceroSeleccionado(tercero);
        setEstadoModalOpen(true);
    };

    const abrirHistorialModal = (tercero: Tercero) => {
        setTerceroSeleccionado(tercero);
        setHistorialModalOpen(true);
    };

    const handleEstadoSuccess = () => {
        loadMisAsignaciones();
        onRefresh?.();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getTiempoEspera = (fechaAsignacion: string) => {
        const fecha = new Date(fechaAsignacion);
        const ahora = new Date();
        const diffHoras = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60));
        
        if (diffHoras < 24) {
            return `${diffHoras}h`;
        } else {
            const diffDias = Math.floor(diffHoras / 24);
            return `${diffDias}d`;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                <span className="ml-2 text-gray-600">Cargando mis asignaciones...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header con estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Mis Asignaciones</p>
                                <p className="text-2xl font-bold text-green-600">{misAsignaciones.length}</p>
                            </div>
                            <FileCheck className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pendientes Hoy</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {misAsignaciones.filter(t => 
                                        new Date(t.fechaAsignacionProcesos!).toDateString() === new Date().toDateString()
                                    ).length}
                                </p>
                            </div>
                            <Clock className="h-8 w-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Procesados</p>
                                <p className="text-2xl font-bold text-blue-600">0</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Lista de asignaciones */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5" />
                        Mis Asignaciones - Procesos
                        <Badge variant="secondary">{misAsignaciones.length}</Badge>
                    </CardTitle>
                </CardHeader>
                
                <CardContent>
                    {misAsignaciones.length === 0 ? (
                        <div className="text-center py-8">
                            <FileCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay asignaciones pendientes</h3>
                            <p className="text-gray-600">Todas las asignaciones han sido procesadas.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tercero</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Asignado Por</TableHead>
                                    <TableHead>Fecha Asignación</TableHead>
                                    <TableHead>Tiempo</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {misAsignaciones.map((tercero) => (
                                    <TableRow key={tercero.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{tercero.nombre}</p>
                                                <p className="text-sm text-gray-600">{tercero.documentoIdentidad}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{tercero.tipo}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <p>{tercero.asignadoAdministrador}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {tercero.fechaAsignacionProcesos && formatDate(tercero.fechaAsignacionProcesos)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {tercero.fechaAsignacionProcesos && getTiempoEspera(tercero.fechaAsignacionProcesos)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="default">{tercero.estado}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => abrirDialogAccion(tercero, 'aprobar')}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Aprobar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => abrirDialogAccion(tercero, 'enviar_cumplimiento')}
                                                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                                                >
                                                    <Send className="h-4 w-4 mr-1" />
                                                    Cumplimiento
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleReassignmentModalOpen(tercero)}
                                                    className="border-purple-300 text-purple-600 hover:bg-purple-50"
                                                >
                                                    <UserCheck className="h-4 w-4 mr-1" />
                                                    Reasignar
                                                </Button>
                                                
                                                {/* 🆕 Nuevos botones */}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => abrirEstadoModal(tercero)}
                                                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                                >
                                                    <FileCheck className="h-4 w-4 mr-1" />
                                                    Estado
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => abrirHistorialModal(tercero)}
                                                    className="border-gray-300 text-gray-600 hover:bg-gray-50"
                                                >
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    Historial
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Dialog para acciones */}
            <Dialog open={!!selectedTercero && !!accion} onOpenChange={(open) => !open && cerrarDialog()}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {accion === 'aprobar' ? (
                                <>
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    Aprobar Tercero - Procesos
                                </>
                            ) : (
                                <>
                                    <Send className="h-5 w-5 text-orange-600" />
                                    Enviar a Cumplimiento
                                </>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    
                    {selectedTercero && (
                        <div className="space-y-4">
                            <div className={`p-3 rounded-lg ${accion === 'aprobar' ? 'bg-green-50' : 'bg-orange-50'}`}>
                                <p className="text-sm font-medium text-gray-900">
                                    {selectedTercero.nombre}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Asignado por: {selectedTercero.asignadoAdministrador}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Fecha: {selectedTercero.fechaAsignacionProcesos && formatDate(selectedTercero.fechaAsignacionProcesos)}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="comentarios">
                                    {accion === 'aprobar' ? 'Comentarios de aprobación' : 'Motivo para envío a cumplimiento'}
                                </Label>
                                <Textarea
                                    id="comentarios"
                                    value={comentarios}
                                    onChange={(e) => setComentarios(e.target.value)}
                                    placeholder={
                                        accion === 'aprobar' 
                                            ? "Comentarios sobre la aprobación..." 
                                            : "Explicar por qué requiere revisión de cumplimiento..."
                                    }
                                    rows={3}
                                />
                            </div>

                            {/* Mostrar flujo de aprobación */}
                            <div className="border-t pt-4">
                                <TerceroApprovalFlow tercero={selectedTercero} />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={cerrarDialog}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={accion === 'aprobar' ? handleAprobarProcesos : handleEnviarACumplimiento}
                                    disabled={procesando}
                                    className={
                                        accion === 'aprobar' 
                                            ? "bg-green-600 hover:bg-green-700" 
                                            : "bg-orange-600 hover:bg-orange-700"
                                    }
                                >
                                    {procesando ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : accion === 'aprobar' ? (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Aprobar
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Enviar
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal de reasignación */}
            {terceroToReassign && (
                <UserAssignmentModal
                    isOpen={assignmentModalOpen}
                    onClose={() => {
                        setAssignmentModalOpen(false);
                        setTerceroToReassign(null);
                    }}
                    tercero={{
                        id: terceroToReassign.id,
                        numero_documento: terceroToReassign.documentoIdentidad || terceroToReassign.id,
                        nombres: terceroToReassign.nombre.split(' ')[0],
                        apellidos: terceroToReassign.nombre.split(' ').slice(1).join(' '),
                        tipo_persona: 'natural', // Por defecto, se puede ajustar según la lógica de negocio
                        estado_aprobacion: terceroToReassign.estado === 'Asignado a Procesos' ? 'en_curso' : 'pendiente' // 🆕 Estado actualizado
                    }}
                    onAssignmentSuccess={handleAssignmentSuccess}
                    userRole="procesos" // 🆕 Agregado
                    limitToRoles={['comercial', 'oficial_cumplimiento']}
                />
            )}

            {/* 🆕 Modal de cambio de estado */}
            {terceroSeleccionado && (
                <EstadoAsignacionModal
                    isOpen={estadoModalOpen}
                    onClose={() => {
                        setEstadoModalOpen(false);
                        setTerceroSeleccionado(null);
                    }}
                    tercero={{
                        id: terceroSeleccionado.id,
                        numero_documento: terceroSeleccionado.documentoIdentidad || terceroSeleccionado.id,
                        nombres: terceroSeleccionado.nombre.split(' ')[0],
                        apellidos: terceroSeleccionado.nombre.split(' ').slice(1).join(' '),
                        tipo_persona: 'natural',
                        estado_aprobacion: terceroSeleccionado.estado === 'Asignado a Procesos' ? 'en_curso' : 'pendiente'
                    }}
                    onSuccess={handleEstadoSuccess}
                    userRole="procesos" // Rol fijo para procesos
                    userId={1} // TODO: Obtener del contexto de usuario
                />
            )}

            {/* 🆕 Modal de historial */}
            {terceroSeleccionado && (
                <HistorialModal
                    isOpen={historialModalOpen}
                    onClose={() => {
                        setHistorialModalOpen(false);
                        setTerceroSeleccionado(null);
                    }}
                    terceroId={terceroSeleccionado.id}
                    terceroNombre={terceroSeleccionado.nombre}
                />
            )}
        </div>
    );
}
