import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users, UserCheck, Shuffle, AlertCircle } from "lucide-react";
import { comercialesService, type Comercial } from '@/services/comerciales.service';
import { useToast } from '@/hooks/use-toast';

interface ComercialSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    terceroId: string;
    terceroNombre: string;
    comercialActual?: {
        id: number;
        first_name: string;
        last_name: string;
    } | null;
    onAsignacionCompleta: () => void;
    esReasignacion?: boolean;
}

export const ComercialSelector: React.FC<ComercialSelectorProps> = ({
    isOpen,
    onClose,
    terceroId,
    terceroNombre,
    comercialActual,
    onAsignacionCompleta,
    esReasignacion = false
}) => {
    const { toast } = useToast();
    const [comerciales, setComerciales] = useState<Comercial[]>([]);
    const [comercialSeleccionado, setComercialSeleccionado] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [asignando, setAsignando] = useState(false);

    // Cargar comerciales disponibles
    useEffect(() => {
        if (isOpen) {
            cargarComerciales();
        }
    }, [isOpen]);

    const cargarComerciales = async () => {
        setLoading(true);
        try {
            const data = await comercialesService.getComerciales();
            setComerciales(data);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron cargar los comerciales disponibles",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAsignar = async () => {
        setAsignando(true);
        try {
            const comercialId = comercialSeleccionado === 'auto' ? undefined : parseInt(comercialSeleccionado);
            
            let response;
            if (esReasignacion) {
                response = await comercialesService.reasignarComercial(terceroId, comercialId);
            } else {
                response = await comercialesService.asignarComercial(terceroId, comercialId);
            }

            toast({
                title: "Éxito",
                description: response.message,
            });

            onAsignacionCompleta();
            onClose();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Error al asignar comercial",
            });
        } finally {
            setAsignando(false);
        }
    };

    const handleDesasignar = async () => {
        setAsignando(true);
        try {
            const response = await comercialesService.desasignarComercial(terceroId);
            
            toast({
                title: "Éxito",
                description: response.message,
            });

            onAsignacionCompleta();
            onClose();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Error al desasignar comercial",
            });
        } finally {
            setAsignando(false);
        }
    };

    const getComercialMenosCargado = () => {
        if (comerciales.length === 0) return null;
        return comerciales.reduce((prev, current) => 
            prev.terceros_asignados < current.terceros_asignados ? prev : current
        );
    };

    const comercialRecomendado = getComercialMenosCargado();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-[#0052CC]" />
                        {esReasignacion ? 'Reasignar Comercial' : 'Asignar Comercial'}
                    </DialogTitle>
                    <DialogDescription>
                        {esReasignacion 
                            ? `Cambiar el comercial asignado para: ${terceroNombre}`
                            : `Seleccionar comercial para: ${terceroNombre}`
                        }
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#0052CC]" />
                        <span className="ml-2">Cargando comerciales...</span>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Comercial Actual */}
                        {comercialActual && esReasignacion && (
                            <Card className="bg-blue-50 border-blue-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <UserCheck className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-800">
                                            Comercial Actual: {comercialActual.first_name} {comercialActual.last_name}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Opción de Distribución Automática */}
                        <Card className="border-green-200 bg-green-50">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Shuffle className="h-5 w-5 text-green-600" />
                                        <div>
                                            <span className="font-medium text-green-800">Distribución Automática</span>
                                            <p className="text-sm text-green-700">
                                                Asignar al comercial con menor carga de trabajo
                                            </p>
                                            {comercialRecomendado && (
                                                <p className="text-xs text-green-600 mt-1">
                                                    Recomendado: {comercialRecomendado.first_name} {comercialRecomendado.last_name} 
                                                    ({comercialRecomendado.terceros_asignados} terceros)
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant={comercialSeleccionado === 'auto' ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setComercialSeleccionado('auto')}
                                        className={comercialSeleccionado === 'auto' ? "bg-green-600 hover:bg-green-700" : ""}
                                    >
                                        {comercialSeleccionado === 'auto' ? 'Seleccionado' : 'Seleccionar'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Selector Manual */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700">
                                O seleccionar comercial específico:
                            </label>
                            <Select 
                                value={comercialSeleccionado === 'auto' ? '' : comercialSeleccionado} 
                                onValueChange={setComercialSeleccionado}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar comercial..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {comerciales.map((comercial) => (
                                        <SelectItem key={comercial.id} value={comercial.id.toString()}>
                                            <div className="flex items-center justify-between w-full">
                                                <span>
                                                    {comercial.first_name} {comercial.last_name}
                                                </span>
                                                <Badge 
                                                    variant={comercial.terceros_asignados <= 5 ? "default" : 
                                                            comercial.terceros_asignados <= 10 ? "secondary" : "destructive"}
                                                    className="ml-2"
                                                >
                                                    {comercial.terceros_asignados} terceros
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Lista de Comerciales con Carga */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Carga actual de comerciales:
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                                {comerciales.map((comercial) => (
                                    <div 
                                        key={comercial.id} 
                                        className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                                    >
                                        <span className="truncate">
                                            {comercial.first_name} {comercial.last_name}
                                        </span>
                                        <Badge 
                                            variant={comercial.terceros_asignados <= 5 ? "default" : 
                                                    comercial.terceros_asignados <= 10 ? "secondary" : "destructive"}
                                        >
                                            {comercial.terceros_asignados}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2">
                    {/* Botón Desasignar (solo en reasignación) */}
                    {esReasignacion && comercialActual && (
                        <Button
                            variant="destructive"
                            onClick={handleDesasignar}
                            disabled={asignando}
                            className="mr-auto"
                        >
                            {asignando ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Desasignando...
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Quitar Comercial
                                </>
                            )}
                        </Button>
                    )}

                    <Button variant="outline" onClick={onClose} disabled={asignando}>
                        Cancelar
                    </Button>
                    
                    <Button
                        onClick={handleAsignar}
                        disabled={!comercialSeleccionado || asignando}
                        className="bg-[#0052CC] hover:bg-[#003A8C]"
                    >
                        {asignando ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                {esReasignacion ? 'Reasignando...' : 'Asignando...'}
                            </>
                        ) : (
                            <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                {esReasignacion ? 'Reasignar' : 'Asignar'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
