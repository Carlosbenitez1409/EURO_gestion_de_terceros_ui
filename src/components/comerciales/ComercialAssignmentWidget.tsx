import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Shuffle, Settings } from "lucide-react";
import { ComercialSelector } from './ComercialSelector';
import { useComerciales } from '@/hooks/use-comerciales';

interface ComercialAssignmentWidgetProps {
    terceroId: string;
    terceroNombre: string;
    comercialActual?: {
        id: number;
        first_name: string;
        last_name: string;
    } | null;
    onAsignacionCompleta?: () => void;
    showStats?: boolean;
    compactMode?: boolean;
}

export const ComercialAssignmentWidget: React.FC<ComercialAssignmentWidgetProps> = ({
    terceroId,
    terceroNombre,
    comercialActual,
    onAsignacionCompleta,
    showStats = true,
    compactMode = false
}) => {
    const { comerciales, getComercialMenosCargado } = useComerciales();
    const [selectorOpen, setSelectorOpen] = useState(false);

    const comercialRecomendado = getComercialMenosCargado();
    const esReasignacion = !!comercialActual;

    const handleAsignacionCompleta = () => {
        setSelectorOpen(false);
        onAsignacionCompleta?.();
    };

    if (compactMode) {
        return (
            <div className="flex items-center gap-2">
                {comercialActual ? (
                    <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">
                            <UserCheck className="h-3 w-3 mr-1" />
                            {comercialActual.first_name} {comercialActual.last_name}
                        </Badge>
                        <Button
                            onClick={() => setSelectorOpen(true)}
                            size="sm"
                            variant="outline"
                            className="border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white"
                        >
                            <Settings className="h-3 w-3 mr-1" />
                            Cambiar
                        </Button>
                    </div>
                ) : (
                    <Button
                        onClick={() => setSelectorOpen(true)}
                        size="sm"
                        className="bg-[#0052CC] hover:bg-[#003A8C]"
                    >
                        <Users className="h-3 w-3 mr-1" />
                        Asignar Comercial
                    </Button>
                )}

                <ComercialSelector
                    isOpen={selectorOpen}
                    onClose={() => setSelectorOpen(false)}
                    terceroId={terceroId}
                    terceroNombre={terceroNombre}
                    comercialActual={comercialActual}
                    onAsignacionCompleta={handleAsignacionCompleta}
                    esReasignacion={esReasignacion}
                />
            </div>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#0052CC]" />
                    Asignación Comercial
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Estado Actual */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <h4 className="font-medium text-gray-900">Estado Actual</h4>
                        <div className="flex items-center gap-2 mt-1">
                            {comercialActual ? (
                                <>
                                    <UserCheck className="h-4 w-4 text-green-600" />
                                    <span className="text-sm text-green-700 font-medium">
                                        {comercialActual.first_name} {comercialActual.last_name}
                                    </span>
                                    <Badge className="bg-green-100 text-green-800">Asignado</Badge>
                                </>
                            ) : (
                                <>
                                    <Users className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">Sin asignar</span>
                                    <Badge variant="secondary">Pendiente</Badge>
                                </>
                            )}
                        </div>
                    </div>
                    <Button
                        onClick={() => setSelectorOpen(true)}
                        variant={comercialActual ? "outline" : "default"}
                        className={comercialActual 
                            ? "border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white"
                            : "bg-[#0052CC] hover:bg-[#003A8C]"
                        }
                    >
                        {comercialActual ? (
                            <>
                                <Settings className="h-4 w-4 mr-2" />
                                Reasignar
                            </>
                        ) : (
                            <>
                                <Users className="h-4 w-4 mr-2" />
                                Asignar
                            </>
                        )}
                    </Button>
                </div>

                {/* Recomendación */}
                {!comercialActual && comercialRecomendado && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Shuffle className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Recomendación Automática</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                            Se recomienda asignar a <strong>{comercialRecomendado.first_name} {comercialRecomendado.last_name}</strong> 
                            ({comercialRecomendado.terceros_asignados} terceros asignados)
                        </p>
                    </div>
                )}

                {/* Estadísticas Rápidas */}
                {showStats && comerciales.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                        <div className="text-center">
                            <div className="text-lg font-bold text-[#0052CC]">{comerciales.length}</div>
                            <div className="text-xs text-gray-600">Comerciales</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-green-600">
                                {comerciales.reduce((sum, c) => sum + c.terceros_asignados, 0)}
                            </div>
                            <div className="text-xs text-gray-600">Total Asignados</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                                {Math.round(comerciales.reduce((sum, c) => sum + c.terceros_asignados, 0) / comerciales.length) || 0}
                            </div>
                            <div className="text-xs text-gray-600">Promedio</div>
                        </div>
                    </div>
                )}

                <ComercialSelector
                    isOpen={selectorOpen}
                    onClose={() => setSelectorOpen(false)}
                    terceroId={terceroId}
                    terceroNombre={terceroNombre}
                    comercialActual={comercialActual}
                    onAsignacionCompleta={handleAsignacionCompleta}
                    esReasignacion={esReasignacion}
                />
            </CardContent>
        </Card>
    );
};
