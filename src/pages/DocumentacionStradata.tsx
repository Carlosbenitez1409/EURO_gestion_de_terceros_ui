import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Users, 
  Mail, 
  Upload, 
  Download,
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  Clock,
  Shield
} from 'lucide-react';

/**
 * Página de documentación para el nuevo sistema de consultas Stradata
 */
export const DocumentacionStradata: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Sistema de Consultas Stradata
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Nuevo sistema de consultas masivas que requiere credenciales personales 
          y permite gestión manual de documentos resultado
        </p>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          🆕 Sistema Actualizado - Septiembre 2025
        </Badge>
      </div>

      {/* Cambios principales */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Cambios Importantes del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-red-700">❌ Sistema Anterior (Deshabilitado)</h4>
              <ul className="text-sm text-red-600 space-y-1">
                <li>• Scraping automático sin credenciales</li>
                <li>• Consultas individuales por tercero</li>
                <li>• Generación automática de PDFs</li>
                <li>• Proceso completamente automático</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-green-700">✅ Sistema Nuevo (Activo)</h4>
              <ul className="text-sm text-green-600 space-y-1">
                <li>• Requiere credenciales personales de Stradata</li>
                <li>• Consultas masivas (hasta 50 terceros)</li>
                <li>• Resultados enviados por correo</li>
                <li>• Subida manual de documentos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flujo de trabajo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Flujo de Trabajo Completo
          </CardTitle>
          <CardDescription>
            Proceso paso a paso para realizar consultas Stradata
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Paso 1 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Selección de Terceros</h3>
                <p className="text-gray-600 mb-2">
                  Vaya al módulo de consultas masivas y seleccione hasta 50 terceros
                </p>
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Users className="h-4 w-4" />
                  <span>Filtros disponibles: estado, tipo de persona, búsqueda</span>
                </div>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Credenciales de Stradata</h3>
                <p className="text-gray-600 mb-2">
                  Proporcione sus credenciales personales de usuario de Stradata
                </p>
                <div className="flex items-center gap-2 text-sm text-purple-600">
                  <Shield className="h-4 w-4" />
                  <span>Las credenciales no se almacenan en el sistema</span>
                </div>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Ejecución de Consulta</h3>
                <p className="text-gray-600 mb-2">
                  El sistema ejecuta la consulta masiva en Stradata
                </p>
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <Clock className="h-4 w-4" />
                  <span>Tiempo estimado: 2-5 minutos por lote</span>
                </div>
              </div>
            </div>

            {/* Paso 4 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Recepción por Correo</h3>
                <p className="text-gray-600 mb-2">
                  Los resultados se envían a su correo electrónico registrado
                </p>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Mail className="h-4 w-4" />
                  <span>Documentos en formato ZIP o individuales</span>
                </div>
              </div>
            </div>

            {/* Paso 5 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold">
                5
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Subida de Documentos</h3>
                <p className="text-gray-600 mb-2">
                  Suba los documentos recibidos al sistema de cada tercero
                </p>
                <div className="flex items-center gap-2 text-sm text-indigo-600">
                  <Upload className="h-4 w-4" />
                  <span>Validación automática de archivos</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Consultas masivas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700">Consultas Masivas</CardTitle>
            <CardDescription>
              Procese múltiples terceros simultáneamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Hasta 50 terceros por consulta</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Filtros avanzados de selección</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Estimación de personas a consultar</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Progreso en tiempo real</span>
            </div>
          </CardContent>
        </Card>

        {/* Gestión de documentos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-purple-700">Gestión de Documentos</CardTitle>
            <CardDescription>
              Administre los resultados de forma manual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Subida individual o masiva</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Validación de tipos de archivo</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Historial de documentos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Descarga y eliminación segura</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Accesos Rápidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              className="h-auto p-4 flex flex-col items-center gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={() => window.location.href = '/stradata'}
            >
              <Users className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">Consultas Masivas</div>
                <div className="text-xs opacity-90">Seleccionar terceros</div>
              </div>
            </Button>

            <Button
              className="h-auto p-4 flex flex-col items-center gap-2 bg-purple-600 hover:bg-purple-700"
              onClick={() => window.location.href = '/terceros/lista'}
            >
              <FileText className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">Lista de Terceros</div>
                <div className="text-xs opacity-90">Ver y gestionar</div>
              </div>
            </Button>

            <Button
              className="h-auto p-4 flex flex-col items-center gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => window.location.href = '/dashboard'}
            >
              <Download className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">Dashboard</div>
                <div className="text-xs opacity-90">Ir al inicio</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Roles y permisos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Roles y Permisos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Badge className="bg-red-100 text-red-800">Administrador</Badge>
              <ul className="text-sm space-y-1">
                <li>✅ Consultas masivas</li>
                <li>✅ Gestión de documentos</li>
                <li>✅ Ver todos los terceros</li>
                <li>✅ Eliminar documentos</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Badge className="bg-blue-100 text-blue-800">Procesos</Badge>
              <ul className="text-sm space-y-1">
                <li>✅ Consultas masivas</li>
                <li>✅ Gestión de documentos</li>
                <li>✅ Ver terceros asignados</li>
                <li>✅ Subir documentos</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Badge className="bg-purple-100 text-purple-800">Oficial Cumplimiento</Badge>
              <ul className="text-sm space-y-1">
                <li>✅ Consultas masivas</li>
                <li>✅ Gestión de documentos</li>
                <li>✅ Ver terceros en cumplimiento</li>
                <li>✅ Subir documentos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Preguntas Frecuentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">
              ¿Por qué cambió el sistema de scraping automático?
            </h4>
            <p className="text-gray-600 text-sm">
              El nuevo sistema mejora la seguridad al requerir credenciales personales y 
              permite un mejor control sobre los documentos generados.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">
              ¿Se almacenan mis credenciales de Stradata?
            </h4>
            <p className="text-gray-600 text-sm">
              No, las credenciales solo se usan temporalmente para la consulta y 
              no se almacenan en el sistema.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">
              ¿Puedo hacer consultas individuales?
            </h4>
            <p className="text-gray-600 text-sm">
              Sí, puede seleccionar un solo tercero en el sistema de consultas masivas 
              o gestionar documentos individualmente desde cada tercero.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">
              ¿Qué tipos de archivo puedo subir?
            </h4>
            <p className="text-gray-600 text-sm">
              Se aceptan PDF, Word, Excel, imágenes (JPG, PNG) y archivos ZIP, 
              con un tamaño máximo de 50MB por archivo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentacionStradata;
