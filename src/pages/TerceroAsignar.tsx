import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Users, Settings } from "lucide-react";

const TerceroAsignar: React.FC = () => {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Asignar Tercero</h1>
                    <p className="text-gray-600 mt-1">
                        Asignación individual de terceros a comerciales
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-[#0052CC]" />
                        Asignación Individual
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Asignación de Tercero a Comercial
                        </h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            Esta vista permite asignar un tercero específico a un comercial.
                            Utiliza el nuevo Dashboard de Procesos para gestión completa.
                        </p>
                        <div className="mt-6 flex items-center justify-center gap-2">
                            <Settings className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-600">
                                💡 Funcionalidad integrada en Dashboard de Procesos
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TerceroAsignar;
