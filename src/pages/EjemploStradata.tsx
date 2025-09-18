import React from 'react';
import { StrataDataManager } from '@/components/stradata';

/**
 * Página de ejemplo de consultas Stradata
 * 
 * Esta página muestra el sistema completo de consultas masivas Stradata:
 * 1. Selección masiva de terceros
 * 2. Modal para credenciales de Stradata
 * 3. Gestión de documentos resultado
 * 
 * El flujo completo es:
 * - Usuario selecciona múltiples terceros
 * - Proporciona credenciales de Stradata en modal
 * - Sistema ejecuta consulta masiva
 * - Resultados se envían por correo
 * - Usuario sube documentos recibidos manualmente
 */
export const EjemploStradata: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Sistema de Consultas Stradata</h1>
        <p className="text-gray-600 mt-2">
          Consulte múltiples terceros en Stradata de forma masiva y gestione los documentos resultado
        </p>
      </div>

      {/* Componente principal que incluye toda la funcionalidad */}
      <StrataDataManager />
    </div>
  );
};

export default EjemploStradata;
