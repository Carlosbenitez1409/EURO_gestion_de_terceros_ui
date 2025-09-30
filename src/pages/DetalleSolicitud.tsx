import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Clock, AlertCircle, CheckCircle, 
  UserCheck, Send, RotateCcw, X, Save, Edit2, 
  MessageSquare, Shield, FileText, Search
} from 'lucide-react';
import UsuarioAsignacionModal from '../components/user/UsuarioAsignacionModal';
import ConsultaStratadaModal from '../components/user/ConsultaStratadaModal';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import { UsuariosConsultasService } from '../services/usuarios-consultas.service';
import { 
  Solicitud, 
  EstadoSolicitud, 
  RolUsuario, 
  Riesgo,
  ESTADO_LABELS, 
  ESTADO_COLORS,
  RIESGO_LABELS,
  RIESGO_COLORS,
  ACCIONES_PERMITIDAS
} from '../types/usuarios-consultas';
import { useToast } from '../hooks/use-toast';

const DetalleSolicitud: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<number | null>(null);
  const [motivoDevolucion, setMotivoDevolucion] = useState('');
  const [observacionesFinalizacion, setObservacionesFinalizacion] = useState('');
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [showFinalizacionModal, setShowFinalizacionModal] = useState(false);
  const [showAsignacionModal, setShowAsignacionModal] = useState(false);
  const [tipoAsignacion, setTipoAsignacion] = useState<'administrador' | 'procesos'>('administrador');
  const [showStratadaModal, setShowStratadaModal] = useState(false);


  const userRole = user?.role?.toLowerCase() as RolUsuario;

  useEffect(() => {
    if (id) {
      cargarSolicitud();
    }
  }, [id]);

  const cargarSolicitud = async () => {
    try {
      setLoading(true);
      const data = await UsuariosConsultasService.getSolicitudById(id!);
      setSolicitud(data);
    } catch (error) {
      console.error('Error cargando solicitud:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la solicitud",
        variant: "destructive",
      });
      navigate('/usuarios-consultas');
    } finally {
      setLoading(false);
    }
  };



  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const puedeEjecutarAccion = (accion: string): boolean => {
    if (!solicitud || !userRole) return false;
    
    const accionesPermitidas = ACCIONES_PERMITIDAS[userRole]?.[solicitud.estado] || [];
    return accionesPermitidas.includes(accion);
  };

  const handleIniciarRevision = async () => {
    if (!solicitud) return;

    try {
      const solicitudActualizada = await UsuariosConsultasService.tomarRevision(solicitud.id);
      setSolicitud(solicitudActualizada);
      toast({
        title: "Revisión iniciada",
        description: "Has iniciado la revisión de la solicitud",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo iniciar la revisión",
        variant: "destructive",
      });
    }
  };

  const handleAsignar = async (usuarioId: string, nuevoEstado: EstadoSolicitud) => {
    if (!solicitud) return;

    try {
      const solicitudActualizada = await UsuariosConsultasService.cambiarEstado(
        solicitud.id,
        nuevoEstado,
        { asignadaA: usuarioId }
      );
      setSolicitud(solicitudActualizada);
      toast({
        title: "Solicitud asignada",
        description: "La solicitud ha sido asignada exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo asignar la solicitud",
        variant: "destructive",
      });
    }
  };

  const abrirModalAsignacion = (tipo: 'administrador' | 'procesos') => {
    setTipoAsignacion(tipo);
    setShowAsignacionModal(true);
  };

  const handleDevolver = async () => {
    if (!solicitud || !motivoDevolucion.trim()) return;

    try {
      const solicitudActualizada = await UsuariosConsultasService.devolverAGH(
        solicitud.id,
        motivoDevolucion
      );
      setSolicitud(solicitudActualizada);
      setShowDevolucionModal(false);
      setMotivoDevolucion('');
      toast({
        title: "Solicitud devuelta",
        description: "La solicitud ha sido devuelta a Gestión Humana",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo devolver la solicitud",
        variant: "destructive",
      });
    }
  };

  const handleFinalizar = async () => {
    if (!solicitud) return;

    try {
      const solicitudActualizada = await UsuariosConsultasService.finalizarSolicitud(
        solicitud.id,
        observacionesFinalizacion
      );
      setSolicitud(solicitudActualizada);
      setShowFinalizacionModal(false);
      setObservacionesFinalizacion('');
      toast({
        title: "Solicitud finalizada",
        description: "La solicitud ha sido finalizada exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo finalizar la solicitud",
        variant: "destructive",
      });
    }
  };

  const handleActualizarPersona = async (
    personaId: string, 
    campo: 'antecedentes' | 'observaciones' | 'riesgo', 
    valor: string
  ) => {
    if (!solicitud) return;

    try {
      const solicitudActualizada = await UsuariosConsultasService.updatePersona(
        solicitud.id,
        personaId,
        { [campo]: valor }
      );
      setSolicitud(solicitudActualizada);
      setEditando(null);
      toast({
        title: "Actualizado",
        description: "La información ha sido actualizada exitosamente",
      });
    } catch (error: any) {
      console.error('🔍 DEBUG - Error actualizando persona:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo actualizar la información",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando solicitud...</p>
        </div>
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No se encontró la solicitud solicitada.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/usuarios-consultas')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Solicitud #{solicitud.id.slice(-8).toUpperCase()}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge className={ESTADO_COLORS[solicitud.estado]}>
                {ESTADO_LABELS[solicitud.estado]}
              </Badge>
              <span className="text-sm text-gray-600">
                Creada: {formatearFecha(solicitud.fechaCreacion)}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones principales organizadas por rol */}
        <div className="flex gap-2 flex-wrap">
          {/* Botón para iniciar revisión */}
          {solicitud.puedeTomarRevision && (
            <Button onClick={handleIniciarRevision} className="bg-blue-600 hover:bg-blue-700">
              <Edit2 className="h-4 w-4 mr-2" />
              Iniciar Revisión
            </Button>
          )}

          {/* Botón de asignación para Gestión Humana */}
          {puedeEjecutarAccion('asignar_administrador') && (
            <Button 
              onClick={() => abrirModalAsignacion('administrador')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Asignar a Administrador
            </Button>
          )}

          {/* Botón de asignación para Administradores - Solo a Procesos */}
          {puedeEjecutarAccion('asignar_procesos') && (
            <Button 
              onClick={() => abrirModalAsignacion('procesos')}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Asignar a Procesos
            </Button>
          )}

          {/* Botón consulta Stradata - Solo para Admin y Procesos */}
          {puedeEjecutarAccion('consultar_stradata') && (
            <Button 
              onClick={() => setShowStratadaModal(true)}
              className="bg-[#0052CC] hover:bg-[#003d99]"
            >
              <Search className="h-4 w-4 mr-2" />
              Consultar Stradata
            </Button>
          )}

          {/* Botón finalizar para quién completa la revisión */}
          {puedeEjecutarAccion('finalizar') && (
            <Button 
              onClick={() => setShowFinalizacionModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalizar Solicitud
            </Button>
          )}

          {/* Botón devolver - menos prominente */}
          {puedeEjecutarAccion('devolver_gh') && (
            <Button 
              variant="outline" 
              onClick={() => setShowDevolucionModal(true)}
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Devolver a GH
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="personas" className="w-full">
        <TabsList>
          <TabsTrigger value="personas">Personas ({solicitud.personas?.length || 0})</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="informacion">Información General</TabsTrigger>
        </TabsList>

        <TabsContent value="personas" className="space-y-4">
          {solicitud.personas?.length > 0 ? (
            solicitud.personas.map((persona, index) => (
              <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {persona.nombresApellidos}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {persona.riesgo && (
                      <Badge className={RIESGO_COLORS[persona.riesgo as Riesgo]}>
                        {RIESGO_LABELS[persona.riesgo as Riesgo]}
                      </Badge>
                    )}
                    <span className="text-sm text-gray-600">
                      {persona.tipoDocumento}: {persona.numeroDocumento}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Información de la persona */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Documento:</span>
                      <p className="text-gray-900">{persona.tipoDocumento}: {persona.numeroDocumento}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Estado actual:</span>
                      <p className="text-gray-900">
                        {persona.riesgo ? RIESGO_LABELS[persona.riesgo as Riesgo] : 'Sin evaluar'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Responsable:</span>
                      <p className="text-gray-900">
                        {userRole === 'administrador' ? 'Administrador' : 'Procesos'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sección de trabajo para Administrador/Procesos */}
                <div className="space-y-6">
                  {/* Antecedentes - Campo principal de trabajo */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label className="text-base font-semibold text-gray-900 flex items-center gap-2">
                          <Shield className="h-5 w-5 text-blue-600" />
                          Registro de Antecedentes
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                          {userRole === 'administrador' 
                            ? 'Como Administrador, documenta los antecedentes encontrados en la consulta'
                            : 'Como usuario de Procesos, documenta los antecedentes encontrados en la consulta'
                          }
                        </p>
                      </div>
                      {puedeEjecutarAccion('editar_antecedentes') && (
                        <Button
                          variant={editando === index ? "default" : "outline"}
                          size="sm"
                          onClick={() => setEditando(editando === index ? null : index)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          {editando === index ? 'Editando' : 'Editar'}
                        </Button>
                      )}
                    </div>
                    
                    {editando === index ? (
                      <div className="space-y-3">
                        <Textarea
                          value={persona.antecedentes || ''}
                          onChange={(e) => {
                            const nuevasPersonas = [...solicitud.personas];
                            nuevasPersonas[index] = { ...nuevasPersonas[index], antecedentes: e.target.value };
                            setSolicitud({ ...solicitud, personas: nuevasPersonas });
                          }}
                          placeholder="Describe detalladamente los antecedentes encontrados para esta persona. Incluye fechas, tipos de registros, fuentes consultadas y cualquier información relevante para la evaluación de riesgo..."
                          className="min-h-[120px] resize-y"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleActualizarPersona(persona.id, 'antecedentes', persona.antecedentes || '')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Guardar Antecedentes
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditando(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-md min-h-[120px] border-l-4 border-blue-500">
                        {persona.antecedentes ? (
                          <div className="whitespace-pre-wrap text-gray-900">{persona.antecedentes}</div>
                        ) : (
                          <div className="text-center py-8">
                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <span className="text-gray-500 italic">
                              Aún no se han registrado antecedentes para esta persona
                            </span>
                            {puedeEjecutarAccion('editar_antecedentes') && (
                              <p className="text-sm text-blue-600 mt-2">
                                Haz clic en "Editar" para comenzar la documentación
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Observaciones adicionales */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4" />
                      Observaciones Adicionales
                    </label>
                    <div className="p-3 bg-white rounded-md min-h-[80px] border">
                      {persona.observaciones || (
                        <span className="text-gray-500 italic text-sm">
                          Las observaciones adicionales se pueden agregar durante el proceso
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Asignación de Riesgo */}
                {puedeEjecutarAccion('asignar_riesgo') && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Asignar Riesgo
                    </label>
                    <div className="flex gap-2">
                      {Object.values(Riesgo).map((riesgo) => (
                        <Button
                          key={riesgo}
                          variant={persona.riesgo === riesgo ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleActualizarPersona(persona.id, 'riesgo', riesgo)}
                          className={persona.riesgo === riesgo ? RIESGO_COLORS[riesgo] : ''}
                        >
                          {RIESGO_LABELS[riesgo]}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay personas en esta solicitud</h3>
              <p className="text-gray-600">Esta solicitud no contiene personas para consultar.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historial de Cambios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {solicitud.historialCambios?.length > 0 ? (
                  solicitud.historialCambios.map((cambio, index) => (
                    <div key={cambio.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{cambio.usuario}</span>
                          <Badge variant="outline" className="text-xs">
                            {cambio.rol}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatearFecha(cambio.fechaCambio)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{cambio.accion}</p>
                        {cambio.descripcion && (
                          <p className="text-sm text-gray-600 mt-1">{cambio.descripcion}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No hay historial de cambios disponible</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="informacion" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de Creación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Creada por</label>
                  <p className="text-gray-900">{solicitud.creadaPor?.nombre || 'Usuario desconocido'}</p>
                  <p className="text-sm text-gray-600">{solicitud.creadaPor?.email || ''}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Fecha de creación</label>
                  <p className="text-gray-900">{formatearFecha(solicitud.fechaCreacion)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Última actualización</label>
                  <p className="text-gray-900">{formatearFecha(solicitud.fechaUltimaActualizacion)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Asignación Actual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {solicitud.asignadaA ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Asignada a</label>
                      <p className="text-gray-900">{solicitud.asignadaA?.nombre || 'Usuario desconocido'}</p>
                      <p className="text-sm text-gray-600">{solicitud.asignadaA?.email || ''}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Rol</label>
                      <Badge variant="outline">{solicitud.asignadaA?.rol || 'Sin asignar'}</Badge>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 italic">No asignada actualmente</p>
                )}
              </CardContent>
            </Card>
          </div>

          {solicitud.observacionesGenerales && (
            <Card>
              <CardHeader>
                <CardTitle>Observaciones Generales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-900">{solicitud.observacionesGenerales}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Devolución */}
      {showDevolucionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Devolver a Gestión Humana</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDevolucionModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Motivo de devolución <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={motivoDevolucion}
                  onChange={(e) => setMotivoDevolucion(e.target.value)}
                  placeholder="Explica por qué devuelves la solicitud..."
                  className="mt-1"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDevolucionModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleDevolver}
                  disabled={!motivoDevolucion.trim()}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Devolver
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Finalización */}
      {showFinalizacionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Finalizar Solicitud</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFinalizacionModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Observaciones de finalización (opcional)
                </label>
                <Textarea
                  value={observacionesFinalizacion}
                  onChange={(e) => setObservacionesFinalizacion(e.target.value)}
                  placeholder="Observaciones finales sobre la solicitud..."
                  className="mt-1"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFinalizacionModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleFinalizar}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Finalizar Solicitud
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Asignación */}
      <UsuarioAsignacionModal
        isOpen={showAsignacionModal}
        onClose={() => {
          setShowAsignacionModal(false);
        }}
        solicitudId={id!}
        tipoAsignacion={tipoAsignacion as 'administrador' | 'procesos'}
        onSuccess={() => {
          cargarSolicitud();
          setShowAsignacionModal(false);
        }}
      />

      {/* Modal de Consulta Stradata */}
      {solicitud && (
        <ConsultaStratadaModal
          isOpen={showStratadaModal}
          onClose={() => setShowStratadaModal(false)}
          solicitudId={solicitud.id}
          solicitudNumero={`#${solicitud.id.slice(-8).toUpperCase()}`}
          personas={solicitud.personas}
          onSuccess={(resultado) => {
            // Recargar la solicitud para ver cambios en historial
            cargarSolicitud();
            setShowStratadaModal(false);
          }}
        />
      )}
    </div>
  );
};

export default DetalleSolicitud;