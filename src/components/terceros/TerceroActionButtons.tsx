import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, UserCheck, FileText, Clock, AlertTriangle } from "lucide-react";
import { Tercero } from "@/services/terceros.service";
import { useToast } from "@/hooks/use-toast";

interface TerceroActionButtonsProps {
    tercero: Tercero;
    userRole: string;
    onAction: (action: string, terceroId: string, data?: any) => Promise<void>;
    loading?: boolean;
}

export function TerceroActionButtons({ tercero, userRole, onAction, loading = false }: TerceroActionButtonsProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [observaciones, setObservaciones] = useState("");
    const [selectedAction, setSelectedAction] = useState<string>("");
    const { toast } = useToast();

    // Función para obtener el color del badge según el estado
    const getEstadoBadgeVariant = (estado: string) => {
        switch (estado) {
            case "Pendiente": return "secondary";
            case "Aprobado Comercial": return "outline";
            case "Pendiente Administrador": return "default";
            case "Asignado a Procesos": return "secondary";
            case "Enviado a Cumplimiento": return "outline";
            case "Aprobado Final": return "default";
            default: return "secondary";
        }
    };

    // Función para obtener las acciones disponibles según el rol y estado
    const getAvailableActions = () => {
        const actions = [];

        if (userRole === "comercial" && tercero.estado === "Pendiente") {
            actions.push({
                key: "aprobar_comercial",
                label: "Aprobar",
                icon: CheckCircle,
                variant: "default" as const,
                color: "bg-green-600 hover:bg-green-700"
            });
        }

        if (userRole === "administrador" && tercero.estado === "Pendiente Administrador") {
            actions.push({
                key: "asignar_procesos",
                label: "Asignar a Procesos",
                icon: UserCheck,
                variant: "default" as const,
                color: "bg-blue-600 hover:bg-blue-700"
            });
        }

        if (userRole === "procesos" && tercero.estado === "Asignado a Procesos") {
            actions.push({
                key: "aprobar_procesos",
                label: "Aprobar Final",
                icon: CheckCircle,
                variant: "default" as const,
                color: "bg-green-600 hover:bg-green-700"
            });
            actions.push({
                key: "enviar_cumplimiento",
                label: "Enviar a Cumplimiento",
                icon: AlertTriangle,
                variant: "outline" as const,
                color: "bg-yellow-600 hover:bg-yellow-700"
            });
        }

        if (userRole === "oficial_cumplimiento" && tercero.estado === "Enviado a Cumplimiento") {
            actions.push({
                key: "aprobar_cumplimiento",
                label: "Aprobar Final",
                icon: CheckCircle,
                variant: "default" as const,
                color: "bg-green-600 hover:bg-green-700"
            });
        }

        return actions;
    };

    const handleActionClick = (actionKey: string) => {
        setSelectedAction(actionKey);
        if (actionKey === "asignar_procesos") {
            // Para asignación a procesos, no necesitamos observaciones por ahora
            handleExecuteAction(actionKey);
        } else {
            setIsDialogOpen(true);
        }
    };

    const handleExecuteAction = async (actionKey: string = selectedAction) => {
        try {
            const actionData = observaciones ? { observaciones } : undefined;
            await onAction(actionKey, tercero.id, actionData);
            
            toast({
                title: "Acción ejecutada",
                description: "La acción se ha realizado correctamente",
                variant: "default"
            });

            setIsDialogOpen(false);
            setObservaciones("");
            setSelectedAction("");
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo ejecutar la acción",
                variant: "destructive"
            });
        }
    };

    const availableActions = getAvailableActions();

    if (availableActions.length === 0) {
        return (
            <div className="flex items-center gap-2">
                <Badge variant={getEstadoBadgeVariant(tercero.estado)}>
                    {tercero.estado}
                </Badge>
                {tercero.estado === "Aprobado Final" && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                        ✅ Completado
                    </Badge>
                )}
            </div>
        );
    }

    const getActionTitle = (actionKey: string) => {
        switch (actionKey) {
            case "aprobar_comercial": return "Aprobar Tercero";
            case "asignar_procesos": return "Asignar a Procesos";
            case "aprobar_procesos": return "Aprobación Final";
            case "enviar_cumplimiento": return "Enviar a Cumplimiento";
            case "aprobar_cumplimiento": return "Aprobación Final";
            default: return "Acción";
        }
    };

    const getActionDescription = (actionKey: string) => {
        switch (actionKey) {
            case "aprobar_comercial": 
                return "Esta acción aprobará el tercero y lo enviará automáticamente al administrador para su asignación.";
            case "aprobar_procesos": 
                return "Esta acción completará el proceso de aprobación. El tercero quedará aprobado definitivamente.";
            case "enviar_cumplimiento": 
                return "Esta acción enviará el tercero al oficial de cumplimiento para una revisión adicional.";
            case "aprobar_cumplimiento": 
                return "Esta acción completará el proceso de aprobación. El tercero quedará aprobado definitivamente.";
            default: return "";
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Badge variant={getEstadoBadgeVariant(tercero.estado)}>
                {tercero.estado}
            </Badge>
            
            <div className="flex gap-2">
                {availableActions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <Dialog key={action.key} open={isDialogOpen && selectedAction === action.key} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    size="sm"
                                    variant={action.variant}
                                    className={action.color}
                                    onClick={() => handleActionClick(action.key)}
                                    disabled={loading}
                                >
                                    <Icon className="h-4 w-4 mr-1" />
                                    {action.label}
                                </Button>
                            </DialogTrigger>
                            
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Icon className="h-5 w-5" />
                                        {getActionTitle(action.key)}
                                    </DialogTitle>
                                </DialogHeader>
                                
                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="text-sm text-gray-700">
                                            <strong>Tercero:</strong> {tercero.nombre}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {getActionDescription(action.key)}
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="observaciones">Observaciones (opcional)</Label>
                                        <Textarea
                                            id="observaciones"
                                            placeholder="Ingrese observaciones adicionales..."
                                            value={observaciones}
                                            onChange={(e) => setObservaciones(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                    
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsDialogOpen(false)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={() => handleExecuteAction()}
                                            disabled={loading}
                                            className={action.color}
                                        >
                                            {loading ? "Procesando..." : "Confirmar"}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    );
                })}
            </div>
        </div>
    );
}
