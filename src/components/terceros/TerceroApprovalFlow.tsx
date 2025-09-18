import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, User, Calendar, FileText } from "lucide-react";
import { Tercero } from "@/services/terceros.service";

interface TerceroApprovalFlowProps {
    tercero: Tercero;
}

export function TerceroApprovalFlow({ tercero }: TerceroApprovalFlowProps) {
    // Función para formatear fecha
    const formatDate = (dateString?: string) => {
        if (!dateString) return "Pendiente";
        return new Date(dateString).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // Función para obtener el estado de cada etapa
    const getStageStatus = (stage: string) => {
        switch (stage) {
            case "comercial":
                return tercero.aprobadoPorComercial ? "completed" : 
                       tercero.estado === "Pendiente" ? "current" : "pending";
            case "administrador":
                return tercero.asignadoAdministrador ? "completed" :
                       tercero.estado === "Pendiente Administrador" ? "current" : "pending";
            case "procesos":
                return tercero.aprobadoPorProcesos ? "completed" :
                       tercero.estado === "Asignado a Procesos" ? "current" : "pending";
            case "cumplimiento":
                return tercero.estado === "Aprobado Final" && tercero.asignadoCumplimiento ? "completed" :
                       tercero.estado === "Enviado a Cumplimiento" ? "current" : 
                       tercero.asignadoCumplimiento ? "skipped" : "pending";
            default:
                return "pending";
        }
    };

    const stages = [
        {
            id: "comercial",
            title: "Revisión Comercial",
            description: "Aprobación inicial por el comercial",
            user: tercero.aprobadoPorComercial,
            date: tercero.fechaAprobacionComercial,
            status: getStageStatus("comercial")
        },
        {
            id: "administrador",
            title: "Asignación Administrativa",
            description: "Administrador asigna a usuario de procesos",
            user: tercero.asignadoAdministrador,
            date: tercero.fechaAsignacionAdministrador,
            status: getStageStatus("administrador")
        },
        {
            id: "procesos",
            title: "Revisión de Procesos",
            description: "Revisión y decisión final de procesos",
            user: tercero.aprobadoPorProcesos,
            date: tercero.fechaAprobacionProcesos,
            status: getStageStatus("procesos")
        },
        {
            id: "cumplimiento",
            title: "Oficial de Cumplimiento",
            description: "Revisión adicional si es requerida",
            user: tercero.asignadoCumplimiento,
            date: tercero.fechaAprobacionFinal,
            status: getStageStatus("cumplimiento")
        }
    ];

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case "current":
                return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />;
            case "skipped":
                return <div className="h-5 w-5 rounded-full bg-gray-300" />;
            default:
                return <div className="h-5 w-5 rounded-full bg-gray-200" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "border-green-500 bg-green-50";
            case "current": return "border-blue-500 bg-blue-50";
            case "skipped": return "border-gray-300 bg-gray-50";
            default: return "border-gray-200 bg-gray-50";
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Flujo de Aprobación
                    <Badge 
                        variant={tercero.estado === "Aprobado Final" ? "default" : "secondary"}
                        className={tercero.estado === "Aprobado Final" ? "bg-green-100 text-green-800" : ""}
                    >
                        {tercero.estado}
                    </Badge>
                </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
                {stages.map((stage, index) => (
                    <div key={stage.id}>
                        <div className={`flex items-center gap-4 p-3 rounded-lg border-l-4 ${getStatusColor(stage.status)}`}>
                            <div className="flex-shrink-0">
                                {getStatusIcon(stage.status)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h4 className={`font-medium ${
                                        stage.status === "completed" ? "text-green-700" :
                                        stage.status === "current" ? "text-blue-700" :
                                        "text-gray-600"
                                    }`}>
                                        {stage.title}
                                    </h4>
                                    
                                    {stage.status === "completed" && (
                                        <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                                            Completado
                                        </Badge>
                                    )}
                                    
                                    {stage.status === "current" && (
                                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                                            En proceso
                                        </Badge>
                                    )}
                                    
                                    {stage.status === "skipped" && (
                                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
                                            Omitido
                                        </Badge>
                                    )}
                                </div>
                                
                                <p className="text-sm text-gray-600 mt-1">
                                    {stage.description}
                                </p>
                                
                                {stage.user && (
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            <span>{stage.user}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>{formatDate(stage.date)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {index < stages.length - 1 && (
                            <div className="flex justify-center py-2">
                                <div className={`w-px h-6 ${
                                    stage.status === "completed" ? "bg-green-300" :
                                    stage.status === "current" ? "bg-blue-300" :
                                    "bg-gray-200"
                                }`} />
                            </div>
                        )}
                    </div>
                ))}
                
                {/* Resumen final */}
                {tercero.estado === "Aprobado Final" && (
                    <>
                        <Separator className="my-4" />
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="font-medium text-green-800">Proceso Completado</span>
                            </div>
                            <p className="text-sm text-green-700 mt-1">
                                El tercero ha sido aprobado definitivamente y está listo para operar.
                            </p>
                            {tercero.fechaAprobacionFinal && (
                                <p className="text-xs text-green-600 mt-2">
                                    Aprobado el {formatDate(tercero.fechaAprobacionFinal)}
                                </p>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
