import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Eye,
    FileText,
    Download,
    MoreHorizontal,
    CheckCircle,
    XCircle,
    Clock
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Tercero {
    id: string;
    nombre: string;
    tipo: "Proveedor" | "Empleado";
    categoria: string;
    estado: "Pendiente" | "En Revisión" | "Aprobado" | "Rechazado";
    fechaCreacion: string;
    documentosPendientes: number;
    responsable: string;
}

interface TercerosTableProps {
    terceros: Tercero[];
    userRole: string;
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onApprove?: (id: string) => void;
    onReject?: (id: string) => void;
}

const estadoConfig = {
    "Pendiente": {
        variant: "secondary" as const,
        icon: Clock,
        color: "text-muted-foreground"
    },
    "En Revisión": {
        variant: "default" as const,
        icon: Clock,
        color: "text-primary"
    },
    "Aprobado": {
        variant: "default" as const,
        icon: CheckCircle,
        color: "text-success"
    },
    "Rechazado": {
        variant: "destructive" as const,
        icon: XCircle,
        color: "text-destructive"
    }
};

export function TercerosTable({
    terceros,
    userRole,
    onView,
    onEdit,
    onApprove,
    onReject
}: TercerosTableProps) {
    const canApprove = ["Procesos", "Contabilidad", "Gestión Humana"].includes(userRole);

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tercero</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Documentos</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {terceros.map((tercero) => {
                        const estadoInfo = estadoConfig[tercero.estado];
                        const IconComponent = estadoInfo.icon;

                        return (
                            <TableRow key={tercero.id}>
                                <TableCell className="font-medium">
                                    {tercero.nombre}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {tercero.tipo}
                                    </Badge>
                                </TableCell>
                                <TableCell>{tercero.categoria}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <IconComponent className={`h-4 w-4 ${estadoInfo.color}`} />
                                        <Badge variant={estadoInfo.variant}>
                                            {tercero.estado}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {tercero.documentosPendientes > 0 ? (
                                        <Badge variant="destructive">
                                            {tercero.documentosPendientes} pendientes
                                        </Badge>
                                    ) : (
                                        <Badge variant="default" className="bg-success text-success-foreground">
                                            Completo
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {tercero.responsable}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {tercero.fechaCreacion}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onView(tercero.id)}
                                        >
                                            <Eye className="h-4 w-4 mr-1" />
                                            Ver
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onView(tercero.id)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Ver Detalles
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onEdit(tercero.id)}>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Descargar PDF
                                                </DropdownMenuItem>
                                                {canApprove && tercero.estado === "En Revisión" && (
                                                    <>
                                                        <DropdownMenuItem
                                                            onClick={() => onApprove?.(tercero.id)}
                                                            className="text-success"
                                                        >
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                            Aprobar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => onReject?.(tercero.id)}
                                                            className="text-destructive"
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Rechazar
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}