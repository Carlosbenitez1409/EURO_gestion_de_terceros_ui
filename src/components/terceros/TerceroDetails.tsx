import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    User,
    Building,
    Mail,
    Phone,
    MapPin,
    Calendar,
    FileText,
    Shield,
    CheckCircle,
    XCircle,
    Clock,
    Download,
    Eye
} from "lucide-react";
import { tercerosService, Tercero } from "@/services/terceros.service";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface TerceroDetailsProps {
    terceroId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (id: string) => void;
    userRole: string;
}

export function TerceroDetails({ terceroId, isOpen, onClose, onEdit, userRole }: TerceroDetailsProps) {
    const [tercero, setTercero] = useState<Tercero | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (terceroId && isOpen) {
            loadTercero();
        }
    }, [terceroId, isOpen]);

    const loadTercero = async () => {
        if (!terceroId) return;

        setLoading(true);
        try {
            const data = await tercerosService.getTercero(terceroId);
            setTercero(data);
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo cargar la información del tercero",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const estadoConfig = {
        "Pendiente": { color: "text-warning", bg: "bg-warning/10", icon: Clock },
        "En Revisión": { color: "text-info", bg: "bg-info/10", icon: Clock },
        "Aprobado": { color: "text-success", bg: "bg-success/10", icon: CheckCircle },
        "Rechazado": { color: "text-destructive", bg: "bg-destructive/10", icon: XCircle }
    };

    const riesgoConfig = {
        "Bajo": { variant: "default" as const, color: "text-success" },
        "Medio": { variant: "secondary" as const, color: "text-warning" },
        "Alto": { variant: "destructive" as const, color: "text-destructive" }
    };

    if (loading) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-white/20 shadow-2xl">
                    <DialogHeader>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </DialogHeader>
                    <div className="space-y-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (!tercero) return null;

    const estadoInfo = estadoConfig[tercero.estado];
    const IconEstado = estadoInfo.icon;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-white/20 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-[#0033A0]">
                        {tercero.tipo === "Proveedor" ? <Building className="h-6 w-6" /> : <User className="h-6 w-6" />}
                        {tercero.nombre}
                    </DialogTitle>
                    <DialogDescription className="text-[#0033A0]/70">
                        {tercero.tipo} • {tercero.categoria} • Creado el {tercero.fechaCreacion}
                    </DialogDescription>
                </DialogHeader>

                {/* Estado y acciones rápidas */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-[#0033A0]/20 bg-[#0033A0]/5">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${estadoInfo.bg}`}>
                            <IconEstado className={`h-5 w-5 ${estadoInfo.color}`} />
                        </div>
                        <div>
                            <p className="font-semibold text-[#0033A0]">Estado: {tercero.estado}</p>
                            <p className="text-sm text-[#0033A0]/70">
                                Responsable: {tercero.responsable}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {onEdit && (
                            <Button onClick={() => onEdit(tercero.id)} variant="outline" size="sm">
                                Editar
                            </Button>
                        )}
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="documentos">Documentos</TabsTrigger>
                        <TabsTrigger value="riesgo">Riesgo</TabsTrigger>
                        <TabsTrigger value="historial">Historial</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <Card className="bg-white border-[#0033A0]/20">
                                <CardHeader>
                                    <CardTitle className="text-lg text-[#0033A0]">Información Básica</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-[#FFD700]" />
                                        <span className="font-medium">Nombre:</span>
                                        <span>{tercero.nombre}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{tercero.tipo}</Badge>
                                        <Badge variant="secondary">{tercero.categoria}</Badge>
                                    </div>
                                    <Separator />
                                    {tercero.documentoIdentidad && (
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-[#FFD700]" />
                                            <span className="font-medium">Documento:</span>
                                            <span>{tercero.documentoIdentidad}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-[#0033A0]/20">
                                <CardHeader>
                                    <CardTitle className="text-lg text-[#0033A0]">Información de Contacto</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {tercero.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-[#FFD700]" />
                                            <a href={`mailto:${tercero.email}`} className="text-primary hover:underline">
                                                {tercero.email}
                                            </a>
                                        </div>
                                    )}
                                    {tercero.telefono && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-[#FFD700]" />
                                            <a href={`tel:${tercero.telefono}`} className="text-primary hover:underline">
                                                {tercero.telefono}
                                            </a>
                                        </div>
                                    )}
                                    {tercero.direccion && (
                                        <div className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-[#FFD700] mt-0.5" />
                                            <div>
                                                <p className="text-[#0033A0]">{tercero.direccion}</p>
                                                <p className="text-sm text-[#0033A0]/70">
                                                    {tercero.ciudad}, {tercero.pais}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="documentos" className="space-y-4">
                        <Card className="bg-white border-[#0033A0]/20">
                            <CardHeader>
                                <CardTitle className="text-[#0033A0]">Documentos</CardTitle>
                                <CardDescription className="text-[#0033A0]/70">
                                    {tercero.documentos?.length || 0} documentos cargados
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {tercero.documentos?.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-8 w-8 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">{doc.nombre}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {doc.tipo} • Subido el {doc.fechaSubida}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={
                                                        doc.estado === "Aprobado" ? "default" :
                                                            doc.estado === "Rechazado" ? "destructive" :
                                                                "secondary"
                                                    }
                                                >
                                                    {doc.estado}
                                                </Badge>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )) || (
                                            <p className="text-center text-muted-foreground py-8">
                                                No hay documentos cargados
                                            </p>
                                        )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="riesgo" className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                                        <Shield className="h-5 w-5" />
                                        Evaluación de Riesgo
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium mb-2">Riesgo de Lavado de Activos</p>
                                        <Badge
                                            variant={riesgoConfig[tercero.riesgoLavado || "Bajo"].variant}
                                            className="text-lg px-3 py-1"
                                        >
                                            {tercero.riesgoLavado || "No evaluado"}
                                        </Badge>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-sm font-medium mb-2">Validación en Listas Restrictivas</p>
                                        <div className="flex items-center gap-2">
                                            {tercero.validacionListas ? (
                                                <>
                                                    <CheckCircle className="h-5 w-5 text-success" />
                                                    <span className="text-success">Validado</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Clock className="h-5 w-5 text-warning" />
                                                    <span className="text-warning">Pendiente</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <CardHeader>
                                    <CardTitle className="text-gray-800 dark:text-gray-200">Observaciones</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {tercero.observaciones?.length ? (
                                        <div className="space-y-2">
                                            {tercero.observaciones.map((obs, index) => (
                                                <div key={index} className="p-2 bg-muted rounded">
                                                    <p className="text-sm">{obs}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">No hay observaciones</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="historial" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Historial de Cambios</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 border-l-4 border-primary bg-muted/50">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">Tercero creado</p>
                                            <p className="text-sm text-muted-foreground">
                                                {tercero.fechaCreacion} • {tercero.responsable}
                                            </p>
                                        </div>
                                    </div>
                                    {tercero.fechaActualizacion && (
                                        <div className="flex items-center gap-3 p-3 border-l-4 border-secondary bg-muted/50">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">Última actualización</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {tercero.fechaActualizacion}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}