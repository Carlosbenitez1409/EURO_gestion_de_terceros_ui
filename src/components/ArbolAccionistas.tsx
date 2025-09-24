import React, { useState } from "react";
import { ChevronDown, ChevronRight, Building2, User, CreditCard, Percent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Accionista {
    empresaPadre: string;
    nombre: string;
    identificacion: string;
    tipo: string;
    porcentaje: number;
    subAccionistas: Accionista[];
}

interface Props {
    data: Accionista[];
    nivel: number;
}

const ArbolAccionistas: React.FC<Props> = ({ data, nivel }) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const toggleExpanded = (identificacion: string) => {
        setExpanded(prev => ({
            ...prev,
            [identificacion]: !prev[identificacion]
        }));
    };

    const getIndentClass = (nivel: number) => {
        // Tailwind no soporta clases dinámicas, por eso usamos style
        return {
            marginLeft: `${nivel * 24}px`
        };
    };

    const getTipoIcon = (tipo: string) => {
        switch (tipo.toUpperCase()) {
            case 'NIT':
                return <Building2 className="h-4 w-4 text-blue-600" />;
            case 'CC':
            case 'CE':
            case 'PA':
                return <User className="h-4 w-4 text-green-600" />;
            default:
                return <CreditCard className="h-4 w-4 text-gray-600" />;
        }
    };

    const getTipoBadgeColor = (tipo: string) => {
        switch (tipo.toUpperCase()) {
            case 'NIT':
                return "bg-blue-100 text-blue-800 border-blue-200";
            case 'CC':
                return "bg-green-100 text-green-800 border-green-200";
            case 'CE':
                return "bg-orange-100 text-orange-800 border-orange-200";
            case 'PA':
                return "bg-purple-100 text-purple-800 border-purple-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const formatPorcentaje = (porcentaje: number) => {
        return porcentaje % 1 === 0 ? porcentaje.toString() : porcentaje.toFixed(2);
    };

    if (!data || data.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            {data.map((accionista, index) => {
                const hasSubAccionistas = accionista.subAccionistas.length > 0;
                const isExpanded = expanded[accionista.identificacion];
                const tieneNIT = accionista.tipo.toUpperCase() === 'NIT';

                return (
                    <div key={`${accionista.identificacion}-${index}-${nivel}`} style={getIndentClass(nivel)}>
                        <Card className={`border transition-all duration-200 ${nivel === 0
                                ? 'border-[#0033A0]/20 bg-gradient-to-r from-[#0033A0]/5 to-[#FFD700]/5'
                                : nivel === 1
                                    ? 'border-blue-200 bg-blue-50/50'
                                    : 'border-gray-200 bg-gray-50/50'
                            }`}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    {/* Información principal del accionista */}
                                    <div className="flex items-center gap-3 flex-1">
                                        {/* Botón expandir/contraer para accionistas con sub-accionistas */}
                                        {hasSubAccionistas ? (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleExpanded(accionista.identificacion)}
                                                className="p-1 h-6 w-6 hover:bg-white/50"
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </Button>
                                        ) : (
                                            <div className="w-6 h-6 flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                            </div>
                                        )}

                                        {/* Icono del tipo */}
                                        {getTipoIcon(accionista.tipo)}

                                        {/* Información del accionista */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className={`font-medium truncate ${nivel === 0 ? 'text-[#0033A0] text-base' : 'text-gray-800 text-sm'
                                                    }`}>
                                                    {accionista.nombre}
                                                </h4>

                                                <Badge className={`text-xs ${getTipoBadgeColor(accionista.tipo)}`}>
                                                    {accionista.tipo}
                                                </Badge>

                                                {tieneNIT && hasSubAccionistas && (
                                                    <Badge variant="outline" className="text-xs border-[#FFD700] text-[#0033A0]">
                                                        {accionista.subAccionistas.length} sub-accionista{accionista.subAccionistas.length !== 1 ? 's' : ''}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                                <CreditCard className="h-3 w-3" />
                                                <span>{accionista.identificacion}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Porcentaje de participación */}
                                    <div className="flex items-center gap-2 ml-4">
                                        <Percent className="h-4 w-4 text-[#FFD700]" />
                                        <span className={`font-bold ${nivel === 0 ? 'text-[#0033A0] text-lg' : 'text-gray-700 text-base'
                                            }`}>
                                            {formatPorcentaje(accionista.porcentaje)}%
                                        </span>
                                    </div>
                                </div>

                                {/* Mostrar información adicional para empresas */}
                                {tieneNIT && hasSubAccionistas && isExpanded && (
                                    <div className="mt-3 pt-3 border-t border-white/50">
                                        <div className="text-xs text-gray-600 mb-2">
                                            <span className="font-medium">Composición interna de {accionista.nombre}:</span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                            <div className="bg-white/50 rounded p-2">
                                                <div className="text-gray-500">Sub-accionistas</div>
                                                <div className="font-semibold text-[#0033A0]">{accionista.subAccionistas.length}</div>
                                            </div>
                                            <div className="bg-white/50 rounded p-2">
                                                <div className="text-gray-500">Total interno</div>
                                                <div className="font-semibold text-[#0033A0]">
                                                    {formatPorcentaje(accionista.subAccionistas.reduce((sum, sub) => sum + sub.porcentaje, 0))}%
                                                </div>
                                            </div>
                                            <div className="bg-white/50 rounded p-2">
                                                <div className="text-gray-500">Personas naturales</div>
                                                <div className="font-semibold text-green-600">
                                                    {accionista.subAccionistas.filter(sub => ['CC', 'CE', 'PA'].includes(sub.tipo.toUpperCase())).length}
                                                </div>
                                            </div>
                                            <div className="bg-white/50 rounded p-2">
                                                <div className="text-gray-500">Empresas</div>
                                                <div className="font-semibold text-blue-600">
                                                    {accionista.subAccionistas.filter(sub => sub.tipo.toUpperCase() === 'NIT').length}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Renderizar sub-accionistas recursivamente */}
                        {hasSubAccionistas && isExpanded && (
                            <div className="mt-2 space-y-2">
                                <ArbolAccionistas
                                    data={accionista.subAccionistas}
                                    nivel={nivel + 1}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ArbolAccionistas;