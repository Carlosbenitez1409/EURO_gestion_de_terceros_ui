import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, EyeOff, Users, FileText, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { stradataConsultasMasivas, ConsultaStradataRequest } from '@/services/stradata.service';

interface TerceroBasico {
  id: string;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  numero_documento: string;
  tipo_persona: 'natural' | 'juridica' | 'publica';
}

interface StrataDataCredentialsModalProps {
  terceros: TerceroBasico[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

export const StrataDataCredentialsModal: React.FC<StrataDataCredentialsModalProps> = ({
  terceros,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [credentials, setCredentials] = useState({
    usuario_stradata: '',
    password_stradata: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.usuario_stradata.trim() || !credentials.password_stradata.trim()) {
      toast({
        title: "❌ Credenciales incompletas",
        description: "Por favor ingrese usuario y contraseña de Stradata",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const request: ConsultaStradataRequest = {
        terceros_ids: terceros.map(t => t.id),
        usuario_stradata: credentials.usuario_stradata.trim(),
        password_stradata: credentials.password_stradata.trim()
      };

      console.log('🔍 Enviando consulta Stradata masiva:', {
        terceros_count: request.terceros_ids.length,
        usuario: request.usuario_stradata
      });

      const response = await stradataConsultasMasivas.ejecutarConsultaMasiva(request);

      if (response.success) {
        toast({
          title: "✅ Consulta enviada exitosamente",
          description: `Se consultaron ${response.data.total_terceros} terceros. Los resultados se enviarán por correo.`,
          variant: "default"
        });

        // Limpiar formulario
        setCredentials({
          usuario_stradata: '',
          password_stradata: ''
        });

        onSuccess(response.data);
        onClose();
      } else {
        throw new Error(response.error || 'Error desconocido en la consulta');
      }
    } catch (error: any) {
      console.error('❌ Error en consulta Stradata:', error);
      
      let errorMessage = 'Error interno del servidor';
      
      if (error.response?.status === 401) {
        errorMessage = 'Credenciales de Stradata incorrectas. Verifique usuario y contraseña.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.error || 'Error en los datos enviados';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "❌ Error en consulta Stradata",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (tercero: TerceroBasico) => {
    if (tercero.tipo_persona === 'natural') {
      return `${tercero.nombres || ''} ${tercero.apellidos || ''}`.trim();
    }
    return tercero.razon_social || 'Sin nombre';
  };

  const totalPersonas = terceros.reduce((total, tercero) => {
    // Estimación: persona natural = 1 persona, jurídica = 3-5 personas (representantes, accionistas, etc.)
    return total + (tercero.tipo_persona === 'natural' ? 1 : 4);
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Consulta Masiva en Stradata
          </DialogTitle>
          <DialogDescription>
            Ingrese sus credenciales de Stradata para procesar múltiples terceros simultáneamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumen de la consulta */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Resumen de la Consulta
              </CardTitle>
              <CardDescription>
                Detalles de los terceros que serán consultados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{terceros.length}</div>
                  <div className="text-sm text-gray-600">Terceros</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{totalPersonas}</div>
                  <div className="text-sm text-gray-600">Personas estimadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">📧</div>
                  <div className="text-sm text-gray-600">Resultados por correo</div>
                </div>
              </div>

              {/* Lista de terceros */}
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {terceros.map((tercero, index) => (
                  <div key={tercero.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-gray-500">#{index + 1}</span>
                      <div>
                        <div className="font-medium">{getDisplayName(tercero)}</div>
                        <div className="text-sm text-gray-600">{tercero.numero_documento}</div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {tercero.tipo_persona === 'natural' ? 'Natural' : 'Jurídica'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alerta informativa */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Los resultados de la consulta se enviarán a su correo electrónico registrado. 
              Una vez reciba los documentos, podrá subirlos usando la opción "Subir Documentos" en cada tercero.
            </AlertDescription>
          </Alert>

          {/* Formulario de credenciales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Credenciales de Stradata</CardTitle>
              <CardDescription>
                Ingrese sus credenciales para autenticarse en el sistema Stradata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="usuario_stradata">Usuario Stradata</Label>
                  <Input
                    id="usuario_stradata"
                    type="text"
                    value={credentials.usuario_stradata}
                    onChange={(e) => setCredentials({
                      ...credentials,
                      usuario_stradata: e.target.value
                    })}
                    placeholder="ej: inv_euro2"
                    required
                    disabled={loading}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_stradata">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password_stradata"
                      type={showPassword ? 'text' : 'password'}
                      value={credentials.password_stradata}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        password_stradata: e.target.value
                      })}
                      placeholder="Ingrese su contraseña de Stradata"
                      required
                      disabled={loading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !credentials.usuario_stradata.trim() || !credentials.password_stradata.trim()}
                    className="min-w-[140px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      'Ejecutar Consulta'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StrataDataCredentialsModal;
