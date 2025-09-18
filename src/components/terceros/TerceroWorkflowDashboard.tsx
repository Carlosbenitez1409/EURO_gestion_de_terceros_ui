import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Users, 
    UserCheck, 
    FileCheck, 
    Shield, 
    RefreshCw, 
    BarChart3,
    Clock,
    CheckCircle,
    AlertTriangle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AdministradorDashboard } from "./AdministradorDashboard";
import { ProcesosDashboard } from "./ProcesosDashboard";
import { CumplimientoDashboard } from "./CumplimientoDashboard";

interface TerceroWorkflowDashboardProps {
    defaultTab?: string;
}

export function TerceroWorkflowDashboard({ defaultTab }: TerceroWorkflowDashboardProps) {
    const { user } = useAuth();
    const [refreshKey, setRefreshKey] = useState(0);

    // Determinar tabs disponibles según el rol del usuario
    const getAvailableTabs = () => {
        const tabs = [];
        
        if (user?.role === 'administrador') {
            tabs.push({
                id: 'administrador',
                label: 'Administrador',
                icon: UserCheck,
                color: 'text-blue-600',
                bgColor: 'bg-blue-50'
            });
        }
        
        if (user?.role === 'procesos') {
            tabs.push({
                id: 'procesos',
                label: 'Procesos',
                icon: FileCheck,
                color: 'text-green-600',
                bgColor: 'bg-green-50'
            });
        }
        
        if (user?.role === 'oficial_cumplimiento') {
            tabs.push({
                id: 'cumplimiento',
                label: 'Cumplimiento',
                icon: Shield,
                color: 'text-purple-600',
                bgColor: 'bg-purple-50'
            });
        }
        
        // Tab de resumen siempre disponible para roles con acceso al workflow
        if (tabs.length > 0) {
            tabs.unshift({
                id: 'resumen',
                label: 'Resumen',
                icon: BarChart3,
                color: 'text-gray-600',
                bgColor: 'bg-gray-50'
            });
        }
        
        return tabs;
    };

    const availableTabs = getAvailableTabs();
    const activeTab = defaultTab || (availableTabs.length > 0 ? availableTabs[0].id : 'resumen');

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    // Si el usuario no tiene acceso a ningún dashboard del workflow
    if (availableTabs.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
                    <p className="text-gray-600">
                        No tienes permisos para acceder al flujo de aprobación de terceros.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Flujo de Aprobación de Terceros</h1>
                    <p className="text-gray-600">Gestión del proceso de aprobación multi-etapa</p>
                </div>
                <Button onClick={handleRefresh} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                </Button>
            </div>

            {/* Tabs principales */}
            <Tabs value={activeTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                    {availableTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <TabsTrigger 
                                key={tab.id} 
                                value={tab.id}
                                className="flex items-center gap-2"
                            >
                                <Icon className={`h-4 w-4 ${tab.color}`} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                {/* Tab Content - Resumen */}
                <TabsContent value="resumen" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Pendientes</p>
                                        <p className="text-2xl font-bold text-orange-600">--</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-orange-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">En Proceso</p>
                                        <p className="text-2xl font-bold text-blue-600">--</p>
                                    </div>
                                    <Users className="h-8 w-8 text-blue-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Aprobados Hoy</p>
                                        <p className="text-2xl font-bold text-green-600">--</p>
                                    </div>
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Riesgo Alto</p>
                                        <p className="text-2xl font-bold text-red-600">--</p>
                                    </div>
                                    <AlertTriangle className="h-8 w-8 text-red-600" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Información del flujo */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Información del Flujo de Aprobación</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium mb-3">Flujo Estándar</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">1</Badge>
                                            <span>Comercial → Aprobación inicial</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">2</Badge>
                                            <span>Administrador → Asignación a procesos</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">3</Badge>
                                            <span>Procesos → Aprobación final</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-3">Flujo con Cumplimiento</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">1-2</Badge>
                                            <span>Comercial + Administrador</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">3</Badge>
                                            <span>Procesos → Envía a cumplimiento</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">4</Badge>
                                            <span>Cumplimiento → Aprobación final</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab Content - Administrador */}
                {availableTabs.some(tab => tab.id === 'administrador') && (
                    <TabsContent value="administrador">
                        <AdministradorDashboard 
                            key={`admin-${refreshKey}`}
                            onRefresh={handleRefresh} 
                        />
                    </TabsContent>
                )}

                {/* Tab Content - Procesos */}
                {availableTabs.some(tab => tab.id === 'procesos') && (
                    <TabsContent value="procesos">
                        <ProcesosDashboard 
                            key={`procesos-${refreshKey}`}
                            onRefresh={handleRefresh} 
                        />
                    </TabsContent>
                )}

                {/* Tab Content - Cumplimiento */}
                {availableTabs.some(tab => tab.id === 'cumplimiento') && (
                    <TabsContent value="cumplimiento">
                        <CumplimientoDashboard 
                            key={`cumplimiento-${refreshKey}`}
                            onRefresh={handleRefresh} 
                        />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
