import React from 'react';
import { 
    CheckCircle, 
    XCircle, 
    Clock, 
    RefreshCw, 
    AlertTriangle,
    ThumbsUp,
    ThumbsDown,
    Edit,
    History,
    MessageCircle,
    ArrowRight,
    Shield,
    Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StateManagementFeaturesProps {
    isVisible: boolean;
    onClose: () => void;
}

export const StateManagementFeatures: React.FC<StateManagementFeaturesProps> = ({ isVisible, onClose }) => {
    if (!isVisible) return null;

    const stateTransitions = [
        { from: 'PENDIENTE', to: ['EN_REVISION', 'APROBADO', 'RECHAZADO'], color: 'text-yellow-600' },
        { from: 'EN_REVISION', to: ['APROBADO', 'RECHAZADO', 'REQUIERE_AJUSTES'], color: 'text-blue-600' },
        { from: 'REQUIERE_AJUSTES', to: ['EN_REVISION', 'PENDIENTE'], color: 'text-orange-600' },
        { from: 'APROBADO', to: ['(Estado Final)'], color: 'text-green-600' },
        { from: 'RECHAZADO', to: ['PENDIENTE', 'EN_REVISION'], color: 'text-red-600' }
    ];

    const quickActions = [
        { action: 'Aprobar Rápido', icon: ThumbsUp, color: 'text-green-600', description: 'Aprobación inmediata para terceros pendientes' },
        { action: 'Rechazar con Motivo', icon: ThumbsDown, color: 'text-red-600', description: 'Rechazo con observaciones obligatorias' },
        { action: 'Cambio de Estado', icon: Edit, color: 'text-blue-600', description: 'Editor inline con validación de transiciones' },
        { action: 'Historial Completo', icon: History, color: 'text-gray-600', description: 'Timeline de todos los cambios de estado' }
    ];

    const endpointsAvailable = [
        { endpoint: 'POST /api/terceros/{id}/cambiar_estado/', description: 'Endpoint flexible para cualquier cambio de estado' },
        { endpoint: 'GET /api/terceros/estados_disponibles/', description: 'Lista de todos los estados del sistema' },
        { endpoint: 'POST /api/terceros/{id}/aprobar/', description: 'Aprobación específica con observaciones opcionales' },
        { endpoint: 'POST /api/terceros/{id}/rechazar/', description: 'Rechazo específico con observaciones obligatorias' }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-[#0052CC] flex items-center gap-2">
                                <Shield className="h-6 w-6" />
                                Sistema de Estados Avanzado - IMPLEMENTADO ✅
                            </h2>
                            <p className="text-gray-600 mt-1">Gestión completa de estados con validaciones y historial</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Estados y Transiciones */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <RefreshCw className="h-5 w-5" />
                                Estados y Transiciones Disponibles
                            </CardTitle>
                            <CardDescription>
                                El sistema valida automáticamente las transiciones permitidas
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4">
                                {stateTransitions.map((transition, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                                        <Badge className={`${transition.color} bg-opacity-10 border-current`}>
                                            {transition.from}
                                        </Badge>
                                        <ArrowRight className="h-4 w-4 text-gray-400" />
                                        <div className="flex gap-2 flex-wrap">
                                            {transition.to.map((target, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">
                                                    {target}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Acciones Rápidas */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5" />
                                Acciones Rápidas Implementadas
                            </CardTitle>
                            <CardDescription>
                                Funcionalidades para optimizar el flujo de trabajo
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-4">
                                {quickActions.map((action, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                                        <action.icon className={`h-5 w-5 ${action.color} mt-0.5`} />
                                        <div>
                                            <h4 className="font-medium">{action.action}</h4>
                                            <p className="text-sm text-gray-600">{action.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Endpoints Disponibles */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageCircle className="h-5 w-5" />
                                Endpoints de Backend Disponibles
                            </CardTitle>
                            <CardDescription>
                                APIs específicas para gestión de estados
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {endpointsAvailable.map((endpoint, index) => (
                                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                        <code className="text-sm font-mono text-[#0052CC] block mb-1">
                                            {endpoint.endpoint}
                                        </code>
                                        <p className="text-sm text-gray-600">{endpoint.description}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Características Clave */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                Características Implementadas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-3">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">Validación automática de transiciones</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">Observaciones obligatorias para rechazos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">Estado Aprobado como final</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">Historial completo de cambios</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">Edición inline con feedback visual</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">Acciones rápidas contextuales</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">Actualización automática de datos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">Permisos y autenticación integrados</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Próximas Mejoras */}
                    <Card className="border-[#FFD700]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-[#F2C200]">
                                <Clock className="h-5 w-5" />
                                Próximas Mejoras Sugeridas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-[#FFD700] rounded-full"></div>
                                    <span className="text-sm">Acciones en lote para múltiples terceros</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-[#FFD700] rounded-full"></div>
                                    <span className="text-sm">Filtros avanzados por estado y fecha</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-[#FFD700] rounded-full"></div>
                                    <span className="text-sm">Notificaciones automáticas de cambios</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-[#FFD700] rounded-full"></div>
                                    <span className="text-sm">Dashboard con métricas de rendimiento</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-[#FFD700] rounded-full"></div>
                                    <span className="text-sm">Exportación de reportes por estado</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
