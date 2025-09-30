import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Search, Download, Users2, ClipboardList, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { UsuariosConsultasService } from '../services/usuarios-consultas.service';
import { 
  Solicitud, 
  EstadoSolicitud, 
  RolUsuario, 
  ESTADO_LABELS, 
  ESTADO_COLORS,
  ESTADOS_POR_ROL 
} from '../types/usuarios-consultas';
import { useToast } from '../hooks/use-toast';

const UsuariosConsultas: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoSolicitud | ''>('');
  const [estadisticas, setEstadisticas] = useState<any>(null);
  
  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  const [totalSolicitudes, setTotalSolicitudes] = useState(0);

  // Obtener rol del usuario
  const userRole = user?.role?.toLowerCase() as RolUsuario;
  
  // Estados permitidos para el rol actual
  const estadosPermitidos = userRole ? ESTADOS_POR_ROL[userRole] || [] : [];

  useEffect(() => {
    cargarSolicitudes();
    cargarEstadisticas();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      let filtros: any = {};
      
      // Gestión Humana puede ver todas las solicitudes
      if (userRole === RolUsuario.GESTION_HUMANA) {
        filtros = {}; // Sin filtros - ve todas las solicitudes
      } 
      // Administrador y Procesos solo ven las solicitudes que les fueron asignadas  
      else if (userRole === 'administrador' || userRole === RolUsuario.PROCESOS) {
        filtros = { 
          asignadaA: user?.id, // Filtrar por solicitudes asignadas al usuario actual
          estado: estadosPermitidos.length > 0 ? estadosPermitidos : undefined 
        };
      }
      // Otros roles aplican filtro de estados permitidos
      else {
        filtros = { estado: estadosPermitidos.length > 0 ? estadosPermitidos : undefined };
      }
      
      const data: any = await UsuariosConsultasService.getSolicitudes(filtros);
      
      // Manejar diferentes formatos de respuesta
      let solicitudesArray = [];
      if (Array.isArray(data)) {
        solicitudesArray = data;
      } else if (data && Array.isArray(data.solicitudes)) {
        solicitudesArray = data.solicitudes;
      } else if (data && Array.isArray(data.results)) {
        solicitudesArray = data.results;
      } else {
        console.warn('Formato de respuesta inesperado:', data);
        solicitudesArray = [];
      }
      setSolicitudes(solicitudesArray);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
      setSolicitudes([]); // Asegurar que sea un array vacío en caso de error
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const data = await UsuariosConsultasService.getEstadisticas();
      setEstadisticas(data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setEstadisticas(null);
    }
  };

  // Filtrar solicitudes - asegurar que solicitudes sea un array
  const solicitudesFiltradas = React.useMemo(() => {
    if (!Array.isArray(solicitudes)) {
      return [];
    }

    const filtradas = solicitudes.filter(solicitud => {
      const coincideTexto = !filtroTexto || 
        solicitud.id.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        solicitud.creadaPor.nombre.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        solicitud.personas.some(p => 
          p.nombresApellidos.toLowerCase().includes(filtroTexto.toLowerCase()) ||
          p.numeroDocumento.includes(filtroTexto)
        );

      const coincideEstado = !filtroEstado || solicitud.estado === filtroEstado;

      return coincideTexto && coincideEstado;
    });

    // Actualizar total de solicitudes filtradas
    setTotalSolicitudes(filtradas.length);
    
    return filtradas;
  }, [solicitudes, filtroTexto, filtroEstado]);

  // Aplicar paginación a las solicitudes filtradas
  const solicitudesPaginadas = React.useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    return solicitudesFiltradas.slice(inicio, fin);
  }, [solicitudesFiltradas, paginaActual, itemsPorPagina]);

  // Calcular información de paginación
  const totalPaginas = Math.ceil(totalSolicitudes / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina + 1;
  const indiceFin = Math.min(paginaActual * itemsPorPagina, totalSolicitudes);

  // Resetear página cuando cambian los filtros
  React.useEffect(() => {
    setPaginaActual(1);
  }, [filtroTexto, filtroEstado, itemsPorPagina]);

  const handleNuevaSolicitud = () => {
    navigate('/usuarios-consultas/nueva');
  };

  const handleVerDetalle = (id: string) => {
    navigate(`/usuarios-consultas/${id}`);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalPersonas = (personas: any[]) => {
    return Array.isArray(personas) ? personas.length : 0;
  };

  const getPrioridadSolicitud = (solicitud: Solicitud) => {
    // Verificar que personas sea un array válido antes de usar .some()
    const tieneRiesgoAlto = Array.isArray(solicitud.personas) && 
                           solicitud.personas.some(p => p.riesgo === 'alto');
    const diasCreacion = Math.floor((Date.now() - new Date(solicitud.fechaCreacion).getTime()) / (1000 * 60 * 60 * 24));
    
    if (tieneRiesgoAlto) return 'alta';
    if (diasCreacion > 5) return 'media';
    return 'baja';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios y Consultas</h1>
          <p className="text-gray-600 mt-1">
            Sistema de evaluación de antecedentes y gestión de usuarios
          </p>
        </div>
        
        {userRole === RolUsuario.GESTION_HUMANA && (
          <Button onClick={handleNuevaSolicitud} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Solicitud
          </Button>
        )}
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Solicitudes</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas?.total_solicitudes || 0}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Asignadas a Mí</p>
                  <p className="text-2xl font-bold text-orange-600">{estadisticas?.solicitudes_asignadas_a_mi || 0}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Creadas por Mí</p>
                  <p className="text-2xl font-bold text-green-600">
                    {estadisticas?.solicitudes_creadas_por_mi || 0}
                  </p>
                </div>
                <Users2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(estadisticas?.promedio_tiempo_procesamiento || 0)}d
                  </p>
                </div>
                <div className="h-8 w-8 text-purple-600 flex items-center justify-center">
                  <span className="text-lg">⏱️</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por ID, nombre o documento..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="sm:w-64">
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as EstadoSolicitud | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los estados</option>
                {estadosPermitidos.map(estado => (
                  <option key={estado} value={estado}>
                    {ESTADO_LABELS[estado]}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:w-32">
              <select
                value={itemsPorPagina}
                onChange={(e) => {
                  setItemsPorPagina(Number(e.target.value));
                  setPaginaActual(1); // Resetear a la primera página
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5 por página</option>
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
              </select>
            </div>

            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Solicitudes */}
      <div className="space-y-4">
        {totalSolicitudes === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes</h3>
              <p className="text-gray-600 mb-4">
                {filtroTexto || filtroEstado 
                  ? 'No se encontraron solicitudes que coincidan con los filtros aplicados.'
                  : 'Aún no tienes solicitudes. Crea tu primera solicitud para comenzar.'}
              </p>
              {userRole === RolUsuario.GESTION_HUMANA && !filtroTexto && !filtroEstado && (
                <Button onClick={handleNuevaSolicitud} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Solicitud
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          solicitudesPaginadas.map((solicitud) => (
            <Card key={solicitud.id} className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleVerDetalle(solicitud.id)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Solicitud #{solicitud.id.slice(-8).toUpperCase()}
                      </h3>
                      <Badge className={ESTADO_COLORS[solicitud.estado]}>
                        {ESTADO_LABELS[solicitud.estado]}
                      </Badge>
                      {getPrioridadSolicitud(solicitud) === 'alta' && (
                        <Badge variant="destructive">Prioridad Alta</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Creada por:</span> {solicitud.creadaPor.nombre}
                      </div>
                      <div>
                        <span className="font-medium">Personas:</span> {getTotalPersonas(solicitud.personas)}
                      </div>
                      <div>
                        <span className="font-medium">Fecha:</span> {formatearFecha(solicitud.fechaCreacion)}
                      </div>
                    </div>

                    {solicitud.asignadaA && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Asignada a:</span> {solicitud.asignadaA.nombre}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Users2 className="h-5 w-5 text-gray-400" />
                    <span className="text-lg font-semibold text-gray-700">
                      {getTotalPersonas(solicitud.personas)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Controles de Paginación */}
        {totalSolicitudes > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {indiceInicio} - {indiceFin} de {totalSolicitudes} solicitudes
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaActual(pag => Math.max(1, pag - 1))}
                    disabled={paginaActual === 1}
                  >
                    Anterior
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                      let pagina;
                      if (totalPaginas <= 5) {
                        pagina = i + 1;
                      } else if (paginaActual <= 3) {
                        pagina = i + 1;
                      } else if (paginaActual >= totalPaginas - 2) {
                        pagina = totalPaginas - 4 + i;
                      } else {
                        pagina = paginaActual - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pagina}
                          variant={paginaActual === pagina ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPaginaActual(pagina)}
                          className="w-8 h-8 p-0"
                        >
                          {pagina}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaActual(pag => Math.min(totalPaginas, pag + 1))}
                    disabled={paginaActual === totalPaginas}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UsuariosConsultas;