import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export interface StratadaLoadingOverlayProps {
    isOpen: boolean;
    terceroNombre?: string;
    totalPersonas?: number;
    onClose?: () => void;
    // Props para mostrar progreso estimado
    timeElapsed?: number;
    estimatedTimeMinutes?: number;
    consultaCompleta?: boolean;
}

export const StratadaLoadingOverlay: React.FC<StratadaLoadingOverlayProps> = ({
    isOpen,
    terceroNombre = '',
    totalPersonas = 0,
    onClose,
    timeElapsed = 0,
    estimatedTimeMinutes = 3,
    consultaCompleta = false
}) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [progress, setProgress] = useState(0);

    // Actualizar tiempo transcurrido cada segundo
    useEffect(() => {
        if (!isOpen) {
            setCurrentTime(0);
            setProgress(0);
            return;
        }

        const interval = setInterval(() => {
            setCurrentTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen]);

    // Calcular progreso estimado basado en el tiempo y número de personas
    useEffect(() => {
        if (!isOpen) return;

        // Tiempo estimado base por persona (en segundos)
        const tiempoBasePorPersona = 30; // 30 segundos por persona
        const tiempoAdicionalInicializacion = 15; // 15 segundos de inicialización
        
        // Calcular tiempo total estimado
        const tiempoTotalEstimado = tiempoAdicionalInicializacion + (totalPersonas * tiempoBasePorPersona);
        
        // Calcular progreso de forma más realista
        let calculatedProgress = 0;
        
        if (consultaCompleta) {
            // Si la consulta está completa, mostrar 100%
            calculatedProgress = 100;
        } else if (currentTime <= 15) {
            // Fase inicial: 0-20% en los primeros 15 segundos
            calculatedProgress = (currentTime / 15) * 20;
        } else {
            // Fase principal: 20-90% según el progreso real
            const tiempoEnFasePrincipal = currentTime - 15;
            const tiempoFasePrincipal = tiempoTotalEstimado - 15;
            const progressFasePrincipal = Math.min((tiempoEnFasePrincipal / tiempoFasePrincipal) * 70, 70);
            calculatedProgress = 20 + progressFasePrincipal;
        }
        
        // Limitar el progreso máximo a 90% hasta que la consulta termine realmente (excepto si está completa)
        if (!consultaCompleta) {
            calculatedProgress = Math.min(calculatedProgress, 90);
        }
        
        setProgress(calculatedProgress);
    }, [currentTime, totalPersonas, isOpen, consultaCompleta]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getProgressColor = (): string => {
        if (progress < 30) return 'bg-blue-500';
        if (progress < 70) return 'bg-yellow-500';
        return 'bg-orange-500';
    };

    const getStatusText = (): string => {
        if (consultaCompleta) return '¡Consulta completada exitosamente!';
        
        const progressPercent = Math.round(progress);
        
        if (progressPercent < 20) return 'Estableciendo conexión con Stradata...';
        if (progressPercent < 40) return 'Iniciando búsquedas en bases de datos...';
        if (progressPercent < 60) return 'Consultando información de personas...';
        if (progressPercent < 80) return 'Procesando resultados encontrados...';
        return 'Preparando envío de resultados por correo...';
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => {}} modal>
            <DialogContent 
                className="sm:max-w-md w-full max-w-lg mx-auto p-0 gap-0 bg-white"
                onInteractOutside={(e) => e.preventDefault()} // Prevenir cerrar al hacer clic fuera
                onEscapeKeyDown={(e) => e.preventDefault()} // Prevenir cerrar con ESC
            >
                {/* Header accesible oculto para screen readers */}
                <DialogHeader className="sr-only">
                    <DialogTitle>Procesando consulta Stradata</DialogTitle>
                    <DialogDescription>
                        La consulta de debida diligencia está siendo procesada. Por favor espere mientras se completa el proceso.
                    </DialogDescription>
                </DialogHeader>
                
                <Card className="border-0 shadow-lg bg-white">
                    <CardHeader className="text-center pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex justify-center mb-3">
                            <div className="relative">
                                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-6 h-6 bg-blue-600 rounded-full opacity-20 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        <CardTitle className="text-xl font-bold text-gray-800 mb-2">
                            🔍 Consultando Stradata
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                            Ejecutando consulta de debida diligencia
                        </p>
                    </CardHeader>

                    <CardContent className="p-6 space-y-6">
                        {/* Información del tercero */}
                        {terceroNombre && (
                            <div className="text-center">
                                <Badge variant="secondary" className="text-sm px-3 py-1">
                                    <Users className="w-4 h-4 mr-1" />
                                    {terceroNombre}
                                </Badge>
                                {totalPersonas > 0 && (
                                    <p className="text-sm text-gray-600 mt-2">
                                        Consultando {totalPersonas} persona{totalPersonas > 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Barra de progreso */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Progreso estimado</span>
                                <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-3" />
                        </div>

                        {/* Estado actual */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>Tiempo transcurrido: {formatTime(currentTime)}</span>
                            </div>
                            
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                    {getStatusText()}
                                </p>
                            </div>
                        </div>

                        {/* Indicadores de proceso dinámicos */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="flex items-center space-x-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span className="text-gray-600">Conexión establecida</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                {progress < 40 ? (
                                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                )}
                                <span className="text-gray-600">Ejecutando consultas</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                {progress < 60 ? (
                                    <Clock className="w-4 h-4 text-yellow-500" />
                                ) : progress < 80 ? (
                                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                )}
                                <span className="text-gray-600">Procesando información</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                {progress < 80 ? (
                                    <AlertCircle className="w-4 h-4 text-gray-400" />
                                ) : (
                                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                )}
                                <span className="text-gray-600">Preparando envío</span>
                            </div>
                        </div>

                        {/* Mensaje informativo simplificado */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-medium mb-1">Consulta en proceso</p>
                                    <p>
                                        La consulta de debida diligencia se está ejecutando correctamente. 
                                        Una vez completada, podrá revisar los resultados en su correo electrónico.
                                    </p>
                                    <p className="mt-2 text-xs text-blue-600">
                                        Este proceso puede tardar varios minutos. No es necesario mantener esta ventana abierta.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Tiempo estimado dinámico */}
                        <div className="text-center text-xs text-gray-500">
                            Tiempo estimado: {Math.max(1, Math.ceil((totalPersonas * 0.5) + 0.5))} minuto{Math.ceil((totalPersonas * 0.5) + 0.5) !== 1 ? 's' : ''} aproximadamente
                        </div>
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    );
};

export default StratadaLoadingOverlay;