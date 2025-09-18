import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Building, Gavel } from "lucide-react";
import { ResumenPersonasTerceroResponse } from "@/services/stradata.service";

interface ResumenPersonasStratadaProps {
    resumen: ResumenPersonasTerceroResponse['resumen'];
    className?: string;
}

export const ResumenPersonasStradata: React.FC<ResumenPersonasStratadaProps> = ({
    resumen,
    className = ""
}) => {
    const { tercero, contadores, detalles, total_personas_consultar } = resumen;

    const secciones = [
        {
            titulo: "Representantes Legales",
            icono: <UserCheck className="h-4 w-4" />,
            cantidad: contadores.representantes_legales,
            personas: detalles.representantes_legales,
            color: "bg-blue-50 text-blue-700 border-blue-200"
        },
        {
            titulo: "Personas PEP",
            icono: <Gavel className="h-4 w-4" />,
            cantidad: contadores.informacion_pep,
            personas: detalles.informacion_pep,
            color: "bg-yellow-50 text-yellow-700 border-yellow-200"
        },
        {
            titulo: "Accionistas",
            icono: <Building className="h-4 w-4" />,
            cantidad: contadores.accionistas,
            personas: detalles.accionistas,
            color: "bg-green-50 text-green-700 border-green-200"
        }
    ];

    return (
        <Card className={`border border-blue-200 ${className}`}>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Users className="h-5 w-5" />
                    Resumen de Consulta Stradata
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                {/* Información del tercero principal */}
                <div className="bg-gray-50 rounded-lg p-3 border">
                    <h4 className="font-medium text-gray-800 mb-1">Tercero Principal</h4>
                    <p className="text-sm text-gray-600">
                        <strong>{tercero.nombre_completo}</strong> - {tercero.numero_documento}
                    </p>
                </div>

                {/* Total de personas */}
                <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <span className="font-medium text-blue-800">Total de personas a consultar:</span>
                    <Badge className="bg-blue-500 text-white">
                        {total_personas_consultar}
                    </Badge>
                </div>

                {/* Desglose por categorías */}
                <div className="space-y-3">
                    {secciones.map((seccion, index) => (
                        seccion.cantidad > 0 && (
                            <div key={index} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {seccion.icono}
                                        <span className="font-medium text-gray-800">{seccion.titulo}</span>
                                    </div>
                                    <Badge className={seccion.color}>
                                        {seccion.cantidad}
                                    </Badge>
                                </div>
                                
                                {seccion.personas.length > 0 && (
                                    <div className="space-y-1">
                                        {seccion.personas.slice(0, 3).map((persona, idx) => (
                                            <p key={idx} className="text-sm text-gray-600 pl-6">
                                                • {persona}
                                            </p>
                                        ))}
                                        {seccion.personas.length > 3 && (
                                            <p className="text-sm text-gray-500 pl-6 italic">
                                                ... y {seccion.personas.length - 3} más
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    ))}
                </div>

                {total_personas_consultar === 1 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-700">
                            ℹ️ Solo se consultará el tercero principal. No se encontraron personas asociadas.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ResumenPersonasStradata;