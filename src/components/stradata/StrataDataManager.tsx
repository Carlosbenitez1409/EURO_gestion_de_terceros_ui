import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    FileText,
    Users,
    Upload,
    Download,
    Clock,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
    HelpCircle
} from 'lucide-react';
import TercerosMasivaSelection from './TercerosMasivaSelection';
import TerceroDocumentUploader from './TerceroDocumentUploader';
// import { useTerceros } from '@/hooks/useTerceros'; // Deshabilitado temporalmente

interface TerceroBasico {
    id?: string;
    nombres?: string;
    apellidos?: string;
    razon_social?: string;
    numero_documento: string;
    tipo_persona: 'natural' | 'juridica' | 'publica';
    estado_aprobacion: string;
    email?: string;
}

interface StrataDataManagerProps {
    terceroId?: string; // Para modo individual
}

export const StrataDataManager: React.FC<StrataDataManagerProps> = ({ terceroId }) => {
    const [activeTab, setActiveTab] = useState<string>(terceroId ? 'documents' : 'massive');
    const [refreshKey, setRefreshKey] = useState(0);

    // Hook para obtener terceros (deshabilitado temporalmente por problemas de autenticación)
    const terceros: TerceroBasico[] = [];
    const loading = false;
    const error = null;
    const recargar = () => {};

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
        if (!terceroId) {
            recargar();
        }
    };

    const handleQuerySuccess = (result: any) => {
        // Mostrar mensaje de éxito
        console.log('Consulta masiva iniciada:', result);

        // Cambiar a la pestaña de documentos después de iniciar consulta
        setActiveTab('documents');
    };

    // Estadísticas rápidas para modo masivo
    const getStatsData = () => {
        if (!terceros || terceros.length === 0) return null;

        const stats = {
            total: terceros.length,
            naturales: terceros.filter(t => t.tipo_persona === 'natural').length,
            juridicas: terceros.filter(t => t.tipo_persona === 'juridica').length,
            aprobados: terceros.filter(t => t.estado_aprobacion === 'aprobado').length,
            pendientes: terceros.filter(t => t.estado_aprobacion !== 'aprobado' && t.estado_aprobacion !== 'rechazado').length
        };

        return stats;
    };

    const stats = getStatsData();

    if (loading && !terceroId) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    Cargando terceros...
                </CardContent>
            </Card>
        );
    }

    if (error && !terceroId) {
        return (
            <Card>
                <CardContent className="py-8">
                    <div className="text-center">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-red-700 mb-2">Error al cargar terceros</h3>
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button onClick={handleRefresh} variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reintentar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6" key={refreshKey}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Consultas Stradata</h1>
                    <p className="text-gray-600">
                        {terceroId
                            ? 'Gestión de documentos individuales'
                            : 'Consultas masivas y gestión de documentos'
                        }
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        onClick={() => window.open('/stradata/documentacion', '_blank')}
                        variant="outline" 
                        size="sm"
                        className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Documentación
                    </Button>
                    <Button onClick={handleRefresh} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* Estadísticas rápidas (solo en modo masivo) */}
            {!terceroId && stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <div className="text-sm text-gray-600">Total Terceros</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 text-center">
                            <Badge variant="outline" className="mb-2">Natural</Badge>
                            <div className="text-2xl font-bold">{stats.naturales}</div>
                            <div className="text-sm text-gray-600">Personas</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 text-center">
                            <Badge variant="outline" className="mb-2">Jurídica</Badge>
                            <div className="text-2xl font-bold">{stats.juridicas}</div>
                            <div className="text-sm text-gray-600">Empresas</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 text-center">
                            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold">{stats.aprobados}</div>
                            <div className="text-sm text-gray-600">Aprobados</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 text-center">
                            <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold">{stats.pendientes}</div>
                            <div className="text-sm text-gray-600">En Proceso</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabs principales */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    {!terceroId && (
                        <TabsTrigger value="massive" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Consulta Masiva
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="documents" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        {terceroId ? 'Documentos' : 'Gestión Documentos'}
                    </TabsTrigger>
                </TabsList>

                {/* Tab de consulta masiva */}
                {!terceroId && (
                    <TabsContent value="massive">
                        <TercerosMasivaSelection
                            terceros={(terceros || []).map(t => ({
                                id: t.id || '',
                                nombres: t.nombres,
                                apellidos: t.apellidos,
                                razon_social: t.razon_social,
                                numero_documento: t.numero_documento,
                                tipo_persona: t.tipo_persona,
                                estado_aprobacion: t.estado_aprobacion,
                                email: t.email
                            }))}
                            onQuerySuccess={handleQuerySuccess}
                        />
                    </TabsContent>
                )}

                {/* Tab de gestión de documentos */}
                <TabsContent value="documents">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                {terceroId ? 'Documentos del Tercero' : 'Gestión de Documentos'}
                            </CardTitle>
                            <CardDescription>
                                {terceroId
                                    ? 'Suba y gestione los documentos de Stradata para este tercero'
                                    : 'Gestione los documentos de Stradata de todos los terceros'
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TerceroDocumentUploader terceroId={terceroId} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default StrataDataManager;
