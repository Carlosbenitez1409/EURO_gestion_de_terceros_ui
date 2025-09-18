import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Scale, TrendingUp } from "lucide-react";

const BalanceAsignaciones: React.FC = () => {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Balance de Asignaciones</h1>
                    <p className="text-gray-600 mt-1">
                        Análisis y balance de cargas de trabajo comercial
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Scale className="h-5 w-5 text-[#0052CC]" />
                        Balance de Cargas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Balance de Asignaciones Comerciales
                        </h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            Esta vista permite analizar y balancear las cargas de trabajo entre comerciales.
                            Funcionalidad en desarrollo.
                        </p>
                        <div className="mt-6 flex items-center justify-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">
                                Análisis de distribución equitativa
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default BalanceAsignaciones;
