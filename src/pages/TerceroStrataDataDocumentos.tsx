import React from 'react';
import { useParams } from 'react-router-dom';
import { StrataDataManager } from '@/components/stradata';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';

/**
 * Página de gestión de documentos Stradata para un tercero específico
 * 
 * Esta página permite:
 * - Ver documentos existentes del tercero
 * - Subir nuevos documentos de resultado Stradata
 * - Eliminar documentos existentes
 * - Descargar documentos
 */
export const TerceroStrataDataDocumentos: React.FC = () => {
  const { terceroId } = useParams<{ terceroId: string }>();

  if (!terceroId) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">ID de tercero requerido</h3>
            <p className="text-red-600 mb-4">
              Esta página requiere un ID de tercero válido en la URL
            </p>
            <Button onClick={() => window.history.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentos Stradata</h1>
          <p className="text-gray-600 mt-2">
            Gestión de documentos de consulta Stradata para el tercero: {terceroId}
          </p>
        </div>
        
        <Button onClick={() => window.history.back()} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Tercero
        </Button>
      </div>

      {/* Componente de gestión de documentos para tercero específico */}
      <StrataDataManager terceroId={terceroId} />
    </div>
  );
};

export default TerceroStrataDataDocumentos;
