import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    User,
    Building2,
    Mail,
    Phone,
    MapPin,
    Calendar,
    FileText,
    CheckCircle,
    Clock,
    AlertTriangle,
    Eye,
    Edit,
    Download
} from "lucide-react";

interface Tercero {
    id: string;
    nombre: string;
    tipo: "Proveedor" | "Empleado";
    categoria: string;
    estado: "Pendiente" | "En Revisión" | "Aprobado" | "Rechazado";
    fechaCreacion: string;
    documentosPendientes: number;
    responsable: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    numeroDocumento?: string;
    tipoDocumento?: string;
    observaciones?: string;
}

interface TerceroViewModalProps {
    tercero: Tercero | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (tercero: Tercero) => void;
    userRole: string;
}

export function TerceroViewModal({ tercero, isOpen, onClose, onEdit, userRole }: TerceroViewModalProps) {
    if (!tercero) return null;

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case "Aprobado":
                return "bg-green-100 text-green-800 border-green-200";
            case "En Revisión":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "Pendiente":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "Rechazado":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const canEdit = userRole === "procesos" || 
                   (userRole === "comercial" && tercero.tipo === "Proveedor") ||
                   (userRole === "gestion_humana" && tercero.tipo === "Empleado");

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-[#0033A0]">
                        {tercero.tipo === "Proveedor" ? <Building2 className="h-6 w-6" /> : <User className="h-6 w-6" />}
                        Detalles del {tercero.tipo}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Header con información básica */}
                    <Card className="border-[#0033A0]/20">
                        <CardHeader className="bg-gradient-to-r from-[#0033A0]/5 to-[#FFD700]/5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl text-[#0033A0]">{tercero.nombre}</CardTitle>
                                    <CardDescription className="text-lg mt-1">
                                        {tercero.categoria} • ID: {tercero.id}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className={getEstadoColor(tercero.estado)}>
                                        {tercero.estado === "En Revisión" && <Clock className="h-3 w-3 mr-1" />}
                                        {tercero.estado === "Aprobado" && <CheckCircle className="h-3 w-3 mr-1" />}
                                        {tercero.estado === "Pendiente" && <AlertTriangle className="h-3 w-3 mr-1" />}
                                        {tercero.estado}
                                    </Badge>
                                    <Badge variant="outline" className="border-[#0033A0] text-[#0033A0]">
                                        {tercero.tipo}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Contenido en tabs */}
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="general">Información General</TabsTrigger>
                            <TabsTrigger value="documentos">Documentos</TabsTrigger>
                            <TabsTrigger value="historial">Historial</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <User className="h-5 w-5 text-[#0033A0]" />
                                            Datos Personales
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-600">Documento:</span>
                                            <span>{tercero.tipoDocumento || "CC"} {tercero.numeroDocumento || "No especificado"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-gray-500" />
                                            <span>{tercero.email || "No especificado"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-500" />
                                            <span>{tercero.telefono || "No especificado"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-gray-500" />
                                            <span>{tercero.direccion || "No especificada"}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-[#0033A0]" />
                                            Información de Proceso
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-500" />
                                            <span className="font-medium text-gray-600">Fecha de Registro:</span>
                                            <span>{new Date(tercero.fechaCreacion).toLocaleDateString('es-CO')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-500" />
                                            <span className="font-medium text-gray-600">Responsable:</span>
                                            <span>{tercero.responsable}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-gray-500" />
                                            <span className="font-medium text-gray-600">Documentos Pendientes:</span>
                                            <Badge variant={tercero.documentosPendientes > 0 ? "destructive" : "outline"}>
                                                {tercero.documentosPendientes}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {tercero.observaciones && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Observaciones</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-700">{tercero.observaciones}</p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="documentos" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Documentos Requeridos</CardTitle>
                                    <CardDescription>
                                        Estado de los documentos necesarios para el proceso de vinculación
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {[
                                            { nombre: "Cédula de Ciudadanía", estado: "Aprobado", fecha: "2024-01-15" },
                                            { nombre: "RUT", estado: "Pendiente", fecha: null },
                                            { nombre: "Certificación Bancaria", estado: "En Revisión", fecha: "2024-01-14" },
                                            { nombre: "Cámara de Comercio", estado: tercero.tipo === "Proveedor" ? "Aprobado" : "N/A", fecha: tercero.tipo === "Proveedor" ? "2024-01-13" : null }
                                        ].map((doc, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="h-4 w-4 text-gray-500" />
                                                    <span className="font-medium">{doc.nombre}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={getEstadoColor(doc.estado)}>
                                                        {doc.estado}
                                                    </Badge>
                                                    {doc.fecha && (
                                                        <span className="text-sm text-gray-500">{doc.fecha}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="historial" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Historial de Cambios</CardTitle>
                                    <CardDescription>
                                        Registro de todas las actividades y cambios realizados
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {[
                                            { fecha: "2024-01-15", usuario: "Juan Pérez", accion: "Solicitud creada", detalle: "Se registró la nueva solicitud" },
                                            { fecha: "2024-01-15", usuario: "María García", accion: "Documentos cargados", detalle: "Se cargaron los documentos básicos" },
                                            { fecha: "2024-01-14", usuario: "Carlos López", accion: "En revisión", detalle: "Asignado para revisión comercial" }
                                        ].map((item, index) => (
                                            <div key={index} className="flex gap-4 p-3 border-l-4 border-[#0033A0] bg-gray-50">
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-[#0033A0]">{item.accion}</span>
                                                        <span className="text-sm text-gray-500">{item.fecha}</span>
                                                    </div>
                                                    <p className="text-gray-700 mt-1">{item.detalle}</p>
                                                    <span className="text-sm text-gray-500">Por: {item.usuario}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Botones de acción */}
                    <div className="flex justify-between">
                        <div className="flex gap-2">
                            <Button variant="outline" className="border-[#0033A0] text-[#0033A0] hover:bg-[#0033A0]/10">
                                <Download className="h-4 w-4 mr-2" />
                                Descargar PDF
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            {canEdit && onEdit && (
                                <Button 
                                    onClick={() => onEdit(tercero)}
                                    className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0033A0] font-semibold"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                </Button>
                            )}
                            <Button variant="outline" onClick={onClose}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
