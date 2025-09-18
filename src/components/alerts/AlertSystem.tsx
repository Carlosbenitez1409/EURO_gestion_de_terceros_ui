import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    AlertTriangle,
    CheckCircle,
    XCircle,
    Info,
    MessageSquare,
    FileX,
    Trash2
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingStates";

// Confirmation Dialog
interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
    loading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "default",
    loading = false
}: ConfirmDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        {variant === "destructive" ? (
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        ) : (
                            <Info className="h-5 w-5 text-info" />
                        )}
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={loading}
                        className={variant === "destructive" ? "bg-destructive hover:bg-destructive/90" : ""}
                    >
                        {loading ? (
                            <LoadingSpinner size="sm" className="mr-2" />
                        ) : null}
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// Approval Dialog with Comments
interface ApprovalDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onApprove: (comments?: string) => void;
    onReject: (comments: string) => void;
    terceroNombre: string;
    loading?: boolean;
}

export function ApprovalDialog({
    isOpen,
    onClose,
    onApprove,
    onReject,
    terceroNombre,
    loading = false
}: ApprovalDialogProps) {
    const [comments, setComments] = useState("");
    const [action, setAction] = useState<"approve" | "reject" | null>(null);

    const handleAction = () => {
        if (action === "approve") {
            onApprove(comments || undefined);
        } else if (action === "reject") {
            if (!comments.trim()) {
                return; // Require comments for rejection
            }
            onReject(comments);
        }
        setComments("");
        setAction(null);
    };

    const isRejectDisabled = action === "reject" && !comments.trim();

    return (
        <AlertDialog open={isOpen} onOpenChange={() => {
            if (!loading) {
                onClose();
                setComments("");
                setAction(null);
            }
        }}>
            <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Revisar Tercero
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Estás revisando: <strong>{terceroNombre}</strong>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4">
                    {/* Action Selection */}
                    <div className="flex gap-2">
                        <Button
                            variant={action === "approve" ? "default" : "outline"}
                            onClick={() => setAction("approve")}
                            className="flex-1 gap-2"
                            disabled={loading}
                        >
                            <CheckCircle className="h-4 w-4" />
                            Aprobar
                        </Button>
                        <Button
                            variant={action === "reject" ? "destructive" : "outline"}
                            onClick={() => setAction("reject")}
                            className="flex-1 gap-2"
                            disabled={loading}
                        >
                            <XCircle className="h-4 w-4" />
                            Rechazar
                        </Button>
                    </div>

                    {/* Comments Section */}
                    <div className="space-y-2">
                        <Label htmlFor="comments">
                            Observaciones {action === "reject" && <span className="text-destructive">*</span>}
                        </Label>
                        <Textarea
                            id="comments"
                            placeholder={
                                action === "approve"
                                    ? "Comentarios adicionales (opcional)..."
                                    : action === "reject"
                                        ? "Explica los motivos del rechazo (requerido)..."
                                        : "Selecciona una acción arriba para continuar..."
                            }
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            disabled={loading || !action}
                            rows={4}
                        />
                        {action === "reject" && !comments.trim() && (
                            <p className="text-sm text-destructive">
                                Las observaciones son obligatorias para rechazar un tercero
                            </p>
                        )}
                    </div>

                    {/* Action Preview */}
                    {action && (
                        <Alert className={action === "approve" ? "border-success" : "border-destructive"}>
                            <div className="flex items-center gap-2">
                                {action === "approve" ? (
                                    <CheckCircle className="h-4 w-4 text-success" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-destructive" />
                                )}
                                <AlertTitle>
                                    {action === "approve" ? "Aprobar Tercero" : "Rechazar Tercero"}
                                </AlertTitle>
                            </div>
                            <AlertDescription className="mt-2">
                                {action === "approve"
                                    ? "El tercero será marcado como aprobado y podrá continuar con el proceso."
                                    : "El tercero será rechazado y se notificará al responsable sobre los motivos."
                                }
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleAction}
                        disabled={loading || !action || isRejectDisabled}
                        className={action === "reject" ? "bg-destructive hover:bg-destructive/90" : ""}
                    >
                        {loading ? (
                            <LoadingSpinner size="sm" className="mr-2" />
                        ) : null}
                        {action === "approve" ? "Aprobar" : action === "reject" ? "Rechazar" : "Continuar"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// Delete Confirmation Dialog
interface DeleteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onDelete: () => void;
    itemName: string;
    itemType?: string;
    loading?: boolean;
}

export function DeleteDialog({
    isOpen,
    onClose,
    onDelete,
    itemName,
    itemType = "elemento",
    loading = false
}: DeleteDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-5 w-5" />
                        Eliminar {itemType}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        ¿Estás seguro de que deseas eliminar <strong>{itemName}</strong>?
                        <br /><br />
                        Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onDelete}
                        disabled={loading}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {loading ? (
                            <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// Document Missing Alert
interface DocumentMissingAlertProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: () => void;
    missingDocuments: string[];
    terceroNombre: string;
}

export function DocumentMissingAlert({
    isOpen,
    onClose,
    onUpload,
    missingDocuments,
    terceroNombre
}: DocumentMissingAlertProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-warning">
                        <FileX className="h-5 w-5" />
                        Documentos Faltantes
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        El tercero <strong>{terceroNombre}</strong> tiene documentos pendientes por cargar.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-3">
                    <p className="text-sm font-medium">Documentos faltantes:</p>
                    <div className="space-y-1">
                        {missingDocuments.map((doc, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                                <Badge variant="destructive" className="text-xs">
                                    Faltante
                                </Badge>
                                <span>{doc}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel>
                        Más tarde
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={onUpload}>
                        Cargar documentos
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// Generic Notification Alert
interface NotificationAlertProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    type: "success" | "error" | "warning" | "info";
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function NotificationAlert({
    isOpen,
    onClose,
    title,
    description,
    type,
    action
}: NotificationAlertProps) {
    const iconMap = {
        success: CheckCircle,
        error: XCircle,
        warning: AlertTriangle,
        info: Info
    };

    const colorMap = {
        success: "text-success",
        error: "text-destructive",
        warning: "text-warning",
        info: "text-info"
    };

    const Icon = iconMap[type];

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className={`flex items-center gap-2 ${colorMap[type]}`}>
                        <Icon className="h-5 w-5" />
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        Cerrar
                    </AlertDialogCancel>
                    {action && (
                        <AlertDialogAction onClick={action.onClick}>
                            {action.label}
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}