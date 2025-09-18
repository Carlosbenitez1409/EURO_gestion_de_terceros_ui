import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Download, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  File,
  Eye
} from 'lucide-react';
import { stradataConsultasMasivas, DocumentoStradataUpload } from '@/services/stradata.service';

interface TerceroDocumentUploaderProps {
  terceroId?: string;
  terceroNombre?: string;
  onDocumentUploaded?: (documento: DocumentoStradataUpload) => void;
  onDocumentDeleted?: (documentoId: string) => void;
}

// Tipos de documento disponibles
const TIPOS_DOCUMENTO = {
  'stradata_resultado': 'Resultado Consulta Stradata',
  'camara_comercio': 'Cámara de Comercio',
  'rut': 'RUT',
  'cedula': 'Cédula de Ciudadanía',
  'estados_financieros': 'Estados Financieros',
  'certificado_bancario': 'Certificado Bancario',
  'otro': 'Otro'
};

export const TerceroDocumentUploader: React.FC<TerceroDocumentUploaderProps> = ({
  terceroId,
  terceroNombre,
  onDocumentUploaded,
  onDocumentDeleted
}) => {
  const [documentos, setDocumentos] = useState<DocumentoStradataUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState<string>('stradata_resultado');
  const [descripcion, setDescripcion] = useState('');
  const [selectedTerceroId, setSelectedTerceroId] = useState<string>(terceroId || '');
  const { toast } = useToast();

  // Cargar documentos existentes
  const loadDocuments = useCallback(async () => {
    const targetTerceroId = terceroId || selectedTerceroId;
    if (!targetTerceroId) return;
    
    try {
      setLoading(true);
      const response = await stradataConsultasMasivas.listarDocumentosTercero(targetTerceroId);
      
      if (response.success) {
        setDocumentos(response.data.documentos);
      }
    } catch (error) {
      console.error('Error cargando documentos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los documentos existentes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [terceroId, selectedTerceroId, toast]);

  // Cargar documentos al montar el componente
  React.useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Validar archivo
  const validateFile = (file: File): string | null => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.zip', '.rar'];
    
    if (file.size > maxSize) {
      return 'El archivo no puede ser mayor a 50MB';
    }
    
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedTypes.includes(extension)) {
      return `Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}`;
    }

    return null;
  };

  // Manejar selección de archivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "Archivo inválido",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    // Auto-generar descripción si está vacía
    if (!descripcion.trim()) {
      const tipoLabel = TIPOS_DOCUMENTO[tipoDocumento as keyof typeof TIPOS_DOCUMENTO];
      setDescripcion(`${tipoLabel} - ${file.name}`);
    }
  };

  // Subir archivo
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Seleccione un archivo primero",
        variant: "destructive"
      });
      return;
    }

    const targetTerceroId = terceroId || selectedTerceroId;
    if (!targetTerceroId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un tercero",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const targetTerceroId = terceroId || selectedTerceroId;
      const response = await stradataConsultasMasivas.subirDocumentoStradata(
        targetTerceroId,
        selectedFile,
        descripcion.trim()
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        toast({
          title: "✅ Documento subido exitosamente",
          description: `${response.data.nombre_archivo} ha sido guardado`,
          variant: "default"
        });

        // Limpiar formulario
        setSelectedFile(null);
        setDescripcion('');
        setUploadProgress(0);
        
        // Recargar documentos
        await loadDocuments();
        
        // Callback opcional
        if (onDocumentUploaded) {
          onDocumentUploaded(response.data);
        }

        // Limpiar input file
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error: any) {
      console.error('Error subiendo documento:', error);
      
      let errorMessage = 'Error interno del servidor';
      if (error.response?.status === 404) {
        errorMessage = 'Tercero no encontrado';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.error || 'Datos inválidos';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "❌ Error subiendo documento",
        description: errorMessage,
        variant: "destructive"
      });
      
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  // Eliminar documento
  const handleDelete = async (documentoId: string, nombreArchivo: string) => {
    if (!confirm(`¿Está seguro de eliminar "${nombreArchivo}"?`)) return;

    try {
      const response = await stradataConsultasMasivas.eliminarDocumento(documentoId);
      
      if (response.success) {
        toast({
          title: "✅ Documento eliminado",
          description: `${nombreArchivo} ha sido eliminado`,
          variant: "default"
        });

        // Recargar documentos
        await loadDocuments();
        
        // Callback opcional
        if (onDocumentDeleted) {
          onDocumentDeleted(documentoId);
        }
      }
    } catch (error: any) {
      console.error('Error eliminando documento:', error);
      toast({
        title: "❌ Error eliminando documento",
        description: error.message || 'Error interno del servidor',
        variant: "destructive"
      });
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Formulario de subida */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Documento de Stradata
          </CardTitle>
          <CardDescription>
            {terceroId && terceroNombre 
              ? `Suba los documentos de resultado recibidos por correo para el tercero: ${terceroNombre}`
              : 'Suba y gestione los documentos de resultado de Stradata'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selector de tercero (solo si no hay terceroId fijo) */}
          {!terceroId && (
            <div className="space-y-2">
              <Label htmlFor="tercero-select">Seleccionar Tercero</Label>
              <Input
                id="tercero-select"
                placeholder="Ingrese el ID del tercero"
                value={selectedTerceroId}
                onChange={(e) => setSelectedTerceroId(e.target.value)}
              />
              <p className="text-sm text-gray-600">
                Ingrese el ID del tercero para cargar y gestionar sus documentos
              </p>
            </div>
          )}

          {/* Selector de tipo de documento */}
          <div className="space-y-2">
            <Label htmlFor="tipo-documento">Tipo de Documento</Label>
            <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPOS_DOCUMENTO).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de archivo */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Archivo</Label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.rar"
              disabled={uploading}
            />
            {selectedFile && (
              <div className="text-sm text-gray-600">
                Archivo seleccionado: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción del documento..."
              disabled={uploading}
              rows={2}
            />
          </div>

          {/* Progreso de subida */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <div className="text-sm text-center text-gray-600">
                Subiendo archivo... {uploadProgress}%
              </div>
            </div>
          )}

          {/* Botón de subida */}
          <Button 
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Subir Documento
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de documentos existentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos Existentes
            <Badge variant="outline">{documentos.length}</Badge>
          </CardTitle>
          <CardDescription>
            Documentos previamente subidos para este tercero
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Cargando documentos...
            </div>
          ) : documentos.length === 0 ? (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                No hay documentos subidos para este tercero. Suba los documentos recibidos por correo después de la consulta Stradata.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {documentos.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <File className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium">{doc.nombre_archivo}</div>
                      <div className="text-sm text-gray-600">{doc.tipo_documento_display}</div>
                      <div className="text-xs text-gray-500">
                        {doc.tamaño_archivo_legible} • {formatDate(doc.fecha_subida)} • por {doc.subido_por.username}
                      </div>
                      {doc.descripcion && (
                        <div className="text-xs text-gray-600 mt-1">{doc.descripcion}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {doc.es_resultado_stradata && (
                      <Badge variant="secondary" className="text-xs">
                        Stradata
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.url_archivo, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.url_archivo, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.id, doc.nombre_archivo)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TerceroDocumentUploader;
