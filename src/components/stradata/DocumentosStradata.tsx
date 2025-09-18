import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Search, 
    RefreshCw, 
    FileText, 
    Download, 
    Building, 
    Shield, 
    User, 
    Users 
} from "lucide-react";
import { GrupoDocumentosStradata } from '@/services/stradata.service';

interface DocumentosStratadaProps {
    documentos: GrupoDocumentosStradata[];
    loading: boolean;
    onEjecutarScraping: () => void;
    scrapingLoading: boolean;
    construirUrlDescarga: (archivo: any) => string;
    descargarDocumentoStradata: (archivo: any) => Promise<void>;
    mostrarBotonScraping?: boolean;
}

const DocumentosStradata: React.FC<DocumentosStratadaProps> = ({
    documentos,
    loading,
    onEjecutarScraping,
    scrapingLoading,
    construirUrlDescarga,
    descargarDocumentoStradata,
    mostrarBotonScraping = true
}) => {

    // Log para debugging
    React.useEffect(() => {
        console.log('📊 DocumentosStradata - Props recibidas:', {
            documentos: documentos?.length || 0,
            loading,
            scrapingLoading,
            mostrarBotonScraping
        });
        console.log('📋 Documentos completos:', documentos);
    }, [documentos, loading, scrapingLoading]);

    const obtenerIconoTipoPersona = (tipo: string) => {
        switch (tipo) {
            case 'tercero_principal':
                return <Building className="h-4 w-4" />;
            case 'personas_pep':
                return <Shield className="h-4 w-4" />;
            case 'representantes_legales':
                return <User className="h-4 w-4" />;
            case 'accionistas':
                return <Users className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const obtenerTituloTipoPersona = (tipo: string) => {
        const titulos = {
            'tercero_principal': 'Tercero Principal',
            'personas_pep': 'Personas PEP',
            'representantes_legales': 'Representantes Legales',
            'accionistas': 'Accionistas'
        };
        return titulos[tipo as keyof typeof titulos] || tipo;
    };

    return (
        <Card className="shadow-lg border-green-200 border">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-green-700" />
                        <CardTitle className="text-green-700">Consultas Stradata</CardTitle>
                    </div>
                    {mostrarBotonScraping && (
                        <Button
                            onClick={onEjecutarScraping}
                            disabled={scrapingLoading}
                            size="sm"
                            className="bg-green-600 text-white hover:bg-green-700"
                        >
                            {scrapingLoading ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Consultando...
                                </>
                            ) : (
                                <>
                                    <Search className="h-4 w-4 mr-2" />
                                    Consultar Ahora
                                </>
                            )}
                        </Button>
                    )}
                </div>
                <CardDescription>
                    Documentos descargados automáticamente desde Stradata
                </CardDescription>
            </CardHeader>
            
            <CardContent>
                {loading ? (
                    <div className="text-gray-500 flex items-center gap-2 justify-center py-8">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span>Cargando documentos de Stradata...</span>
                    </div>
                ) : documentos.length === 0 ? (
                    <div className="text-center py-12">
                        <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-500 mb-2">
                            No hay consultas de Stradata
                        </h3>
                        <p className="text-gray-400 text-sm max-w-md mx-auto">
                            Usa el botón "Consultar Stradata" para descargar documentos automáticamente 
                            del tercero principal, personas PEP, representantes legales y accionistas.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {documentos.map((grupo, index) => (
                            <div key={index} className="border border-green-100 rounded-lg p-4 bg-green-50">
                                <div className="flex items-center gap-2 mb-4">
                                    {obtenerIconoTipoPersona(grupo.tipo_persona)}
                                    <h6 className="font-semibold text-green-800">
                                        {obtenerTituloTipoPersona(grupo.tipo_persona)}
                                    </h6>
                                    <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                                        {grupo.archivos?.length || 0} documentos
                                    </span>
                                </div>
                                
                                {grupo.archivos && grupo.archivos.length > 0 ? (
                                    <div className="space-y-3">
                                        {grupo.archivos.map((archivo: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200 hover:border-green-300 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-green-100 rounded-lg">
                                                        <FileText className="h-4 w-4 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 text-sm">
                                                            {archivo.nombre}
                                                        </p>
                                                        <p className="text-xs text-gray-500 flex items-center gap-2">
                                                            <span>{archivo.tamaño}</span>
                                                            <span>•</span>
                                                            <span>{new Date(archivo.fecha_descarga).toLocaleDateString('es-ES', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <Button
                                                    onClick={() => descargarDocumentoStradata(archivo)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-green-300 text-green-700 hover:bg-green-50 flex items-center gap-1"
                                                >
                                                    <Download className="h-3 w-3" />
                                                    Descargar
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-gray-500">
                                        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm">No hay documentos disponibles para esta categoría</p>
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {/* Resumen al final */}
                        <div className="border-t border-green-200 pt-4 mt-6">
                            <div className="flex items-center justify-between text-sm text-green-700">
                                <span>
                                    Total de documentos: {documentos.reduce((total, grupo) => total + (grupo.archivos?.length || 0), 0)}
                                </span>
                                <span>
                                    Categorías: {documentos.length}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default DocumentosStradata;
