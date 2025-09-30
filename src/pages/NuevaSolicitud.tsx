import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Users, AlertCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { UsuariosConsultasService } from '../services/usuarios-consultas.service';
import { 
  TipoDocumento, 
  Persona, 
  SolicitudCreateRequest
} from '../types/usuarios-consultas';
import { useToast } from '../hooks/use-toast';

const NuevaSolicitud: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [personas, setPersonas] = useState<Omit<Persona, 'id'>[]>([
    {
      nombresApellidos: '',
      numeroDocumento: '',
      tipoDocumento: TipoDocumento.CC,
      observaciones: ''
    }
  ]);

  const [observacionesGenerales, setObservacionesGenerales] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const agregarPersona = () => {
    if (personas.length >= 10) {
      toast({
        title: "Límite alcanzado",
        description: "No se pueden agregar más de 10 personas por solicitud",
        variant: "destructive",
      });
      return;
    }

    setPersonas([...personas, {
      nombresApellidos: '',
      numeroDocumento: '',
      tipoDocumento: TipoDocumento.CC,
      observaciones: ''
    }]);
  };

  const removerPersona = (index: number) => {
    if (personas.length <= 1) {
      toast({
        title: "Error",
        description: "Debe haber al menos una persona en la solicitud",
        variant: "destructive",
      });
      return;
    }

    const nuevasPersonas = personas.filter((_, i) => i !== index);
    setPersonas(nuevasPersonas);
    
    // Limpiar errores de esta persona
    const nuevosErrors = { ...errors };
    Object.keys(nuevosErrors).forEach(key => {
      if (key.startsWith(`persona_${index}_`)) {
        delete nuevosErrors[key];
      }
    });
    setErrors(nuevosErrors);
  };

  const actualizarPersona = (index: number, campo: keyof Omit<Persona, 'id'>, valor: string) => {
    console.log(`Actualizando persona ${index}, campo ${campo}, valor:`, valor);
    const nuevasPersonas = [...personas];
    nuevasPersonas[index] = { ...nuevasPersonas[index], [campo]: valor };
    setPersonas(nuevasPersonas);
    console.log('Estado actualizado personas:', nuevasPersonas);

    // Limpiar error del campo específico
    const errorKey = `persona_${index}_${campo}`;
    if (errors[errorKey]) {
      setErrors({ ...errors, [errorKey]: '' });
    }
  };

  const validarFormulario = (): boolean => {
    console.log('Validando formulario con personas:', personas);
    const nuevosErrors: Record<string, string> = {};

    personas.forEach((persona, index) => {
      if (!persona.nombresApellidos.trim()) {
        nuevosErrors[`persona_${index}_nombresApellidos`] = 'Nombres y apellidos son obligatorios';
      }

      if (!persona.numeroDocumento.trim()) {
        nuevosErrors[`persona_${index}_numeroDocumento`] = 'Número de documento es obligatorio';
      } else {
        // Validar que no haya documentos duplicados
        const documentosDuplicados = personas.filter(p => 
          p.numeroDocumento.trim() === persona.numeroDocumento.trim()
        );
        if (documentosDuplicados.length > 1) {
          nuevosErrors[`persona_${index}_numeroDocumento`] = 'Este número de documento ya está registrado en la solicitud';
        }
      }

      if (!persona.tipoDocumento) {
        nuevosErrors[`persona_${index}_tipoDocumento`] = 'Tipo de documento es obligatorio';
      }
    });

    setErrors(nuevosErrors);
    return Object.keys(nuevosErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      toast({
        title: "Error en el formulario",
        description: "Por favor corrige los errores antes de continuar",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const solicitudData: SolicitudCreateRequest = {
        personas: personas.map((persona, index) => ({
          orden: index + 1,
          nombres_apellidos: persona.nombresApellidos.trim(),
          numero_documento: persona.numeroDocumento.trim(),
          tipo_documento: persona.tipoDocumento,
          observaciones: persona.observaciones?.trim() || ''
        })),
        observaciones_generales: observacionesGenerales.trim() || undefined
      };

      console.log('Datos enviados al backend:', solicitudData);
      const nuevaSolicitud = await UsuariosConsultasService.createSolicitud(solicitudData);

      toast({
        title: "Solicitud creada exitosamente",
        description: `Solicitud #${nuevaSolicitud.id.slice(-8).toUpperCase()} ha sido creada`,
      });

      navigate(`/usuarios-consultas/${nuevaSolicitud.id}`);
    } catch (error: any) {
      console.error('Error creando solicitud:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo crear la solicitud",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/usuarios-consultas')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Solicitud de Consulta</h1>
          <p className="text-gray-600">Crear una nueva solicitud para evaluación de antecedentes</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="observacionesGenerales">
                Observaciones Generales (Opcional)
              </Label>
              <Textarea
                id="observacionesGenerales"
                value={observacionesGenerales}
                onChange={(e) => setObservacionesGenerales(e.target.value)}
                placeholder="Observaciones o comentarios adicionales sobre la solicitud..."
                className="mt-1"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Personas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Personas a Evaluar ({personas.length}/10)
                </CardTitle>
              </div>
              <Button 
                type="button" 
                onClick={agregarPersona}
                disabled={personas.length >= 10}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Persona
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {personas.length >= 10 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Has alcanzado el límite máximo de 10 personas por solicitud.
                </AlertDescription>
              </Alert>
            )}

            {personas.map((persona, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">
                    Persona {index + 1}
                  </h4>
                  {personas.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removerPersona(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`nombres_${index}`}>
                      Nombres y Apellidos <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`nombres_${index}`}
                      value={persona.nombresApellidos}
                      onChange={(e) => actualizarPersona(index, 'nombresApellidos', e.target.value)}
                      placeholder="Nombres y apellidos completos"
                      className={`mt-1 ${errors[`persona_${index}_nombresApellidos`] ? 'border-red-500' : ''}`}
                    />
                    {errors[`persona_${index}_nombresApellidos`] && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors[`persona_${index}_nombresApellidos`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`tipoDocumento_${index}`}>
                      Tipo de Documento <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id={`tipoDocumento_${index}`}
                      value={persona.tipoDocumento}
                      onChange={(e) => actualizarPersona(index, 'tipoDocumento', e.target.value as TipoDocumento)}
                      className={`mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`persona_${index}_tipoDocumento`] ? 'border-red-500' : ''
                      }`}
                    >
                      <option value={TipoDocumento.CC}>Cédula de Ciudadanía</option>
                      <option value={TipoDocumento.CE}>Cédula de Extranjería</option>
                      <option value={TipoDocumento.PASAPORTE}>Pasaporte</option>
                      <option value={TipoDocumento.NIT}>NIT</option>
                      <option value={TipoDocumento.OTRO}>Otro</option>
                    </select>
                    {errors[`persona_${index}_tipoDocumento`] && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors[`persona_${index}_tipoDocumento`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`documento_${index}`}>
                      Número de Documento <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`documento_${index}`}
                      value={persona.numeroDocumento}
                      onChange={(e) => actualizarPersona(index, 'numeroDocumento', e.target.value)}
                      placeholder="Número de documento"
                      className={`mt-1 ${errors[`persona_${index}_numeroDocumento`] ? 'border-red-500' : ''}`}
                    />
                    {errors[`persona_${index}_numeroDocumento`] && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors[`persona_${index}_numeroDocumento`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`observaciones_${index}`}>
                      Observaciones Específicas
                    </Label>
                    <Input
                      id={`observaciones_${index}`}
                      value={persona.observaciones || ''}
                      onChange={(e) => actualizarPersona(index, 'observaciones', e.target.value)}
                      placeholder="Observaciones específicas para esta persona"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex justify-between items-center pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/usuarios-consultas')}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creando Solicitud...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Crear Solicitud
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NuevaSolicitud;