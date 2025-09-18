import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Clock, CheckCircle, XCircle, Users, FileText, Search, Filter, 
  Plus, Edit, Eye, Settings, Archive, UserPlus, ArrowLeft, Send, DollarSign 
} from 'lucide-react';
import { usePermissions } from '../hooks/useUser';
import { tercerosDRFService, type TerceroDRF } from '../services/terceros.drf.service';
import { tercerosService } from '../services/terceros.service';
import { comercialesService, type Comercial } from '../services/comerciales.service';
import { TERCERO_STATES, STATE_LABELS, STATE_COLORS } from '../config/roles';
import { toast } from '../hooks/use-toast';
import { ComercialSelector } from '../components/comerciales/ComercialSelector';

interface ProcesosDashboardProps {
  userRole: string;
}

export default function ProcesosDashboard({ userRole }: ProcesosDashboardProps) {
  const permissions = usePermissions();
  const [terceros, setTerceros] = useState<TerceroDRF[]>([]);
  const [comerciales, setComerciales] = useState<Comercial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [selectedTercero, setSelectedTercero] = useState<TerceroDRF | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showCumplimientoDialog, setShowCumplimientoDialog] = useState(false);
  const [showContabilidadDialog, setShowContabilidadDialog] = useState(false);
  const [showDevolverComercialDialog, setShowDevolverComercialDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'edit' | 'assign' | 'cumplimiento' | 'contabilidad' | 'devolver_comercial'>('approve');
  const [actionReason, setActionReason] = useState('');
  const [activeTab, setActiveTab] = useState('todos');

  // Estadísticas
  const [stats, setStats] = useState({
    pendientes: 0,
    enRevision: 0,
    aprobados: 0,
    rechazados: 0,
    total: 0,
    sinComercial: 0,
    conComercial: 0
  });

  useEffect(() => {
    fetchTerceros();
    fetchComerciales();
  }, []);

  const fetchTerceros = async () => {
    try {
      setLoading(true);
      const response = await tercerosDRFService.getTerceros();
      
      // Procesos ve todos los terceros
      const allTerceros = response.results || [];
      setTerceros(allTerceros);
      
      // Calcular estadísticas básicas
      const stats = {
        pendientes: allTerceros.filter(t => t.estado_aprobacion === TERCERO_STATES.PENDIENTE).length,
        enRevision: allTerceros.filter(t => t.estado_aprobacion === TERCERO_STATES.PENDIENTE).length,
        aprobados: allTerceros.filter(t => t.estado_aprobacion === TERCERO_STATES.APROBADO).length,
        rechazados: allTerceros.filter(t => t.estado_aprobacion === TERCERO_STATES.RECHAZADO).length,
        total: allTerceros.length,
        sinComercial: 0, // Se calculará después al obtener datos de asignación
        conComercial: 0  // Se calculará después al obtener datos de asignación
      };
      setStats(stats);
      
    } catch (error) {
      console.error('Error fetching terceros:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los terceros",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComerciales = async () => {
    try {
      const comercialesList = await comercialesService.getComerciales();
      setComerciales(comercialesList);
    } catch (error) {
      console.error('Error fetching comerciales:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los comerciales",
        variant: "destructive"
      });
    }
  };

  const handleAction = async () => {
    if (!selectedTercero) return;

    try {
      let newState: 'aprobado' | 'rechazado'; // 🆕 Tipos actualizados
      if (actionType === 'approve') {
        newState = 'aprobado'; // 🆕 Nuevo estado de aprobación
      } else if (actionType === 'reject') {
        newState = 'rechazado'; // 🆕 Estado de rechazo
      } else {
        return; // Para otros tipos de acción
      }

      await tercerosDRFService.updateTercero(selectedTercero.id, {
        estado_aprobacion: newState,
        observaciones: actionReason
      });

      toast({
        title: "Éxito",
        description: `Tercero ${actionType === 'approve' ? 'aprobado' : 'rechazado'} correctamente`,
        variant: "default"
      });

      setShowActionDialog(false);
      setSelectedTercero(null);
      setActionReason('');
      fetchTerceros();
      
    } catch (error) {
      console.error('Error updating tercero:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el tercero",
        variant: "destructive"
      });
    }
  };

  const handleAssignComercial = async (terceroId: string, comercialId?: number) => {
    try {
      const response = await comercialesService.asignarComercial(terceroId, comercialId);
      
      toast({
        title: "Éxito",
        description: response.message || "Comercial asignado correctamente",
        variant: "default"
      });

      setShowAssignDialog(false);
      setSelectedTercero(null);
      fetchTerceros(); // Refrescar la lista
      
    } catch (error) {
      console.error('Error assigning comercial:', error);
      toast({
        title: "Error",
        description: "No se pudo asignar el comercial",
        variant: "destructive"
      });
    }
  };

  const handleEnviarACumplimiento = async () => {
    if (!selectedTercero) return;

    try {
      // 🆕 NUEVO FLUJO: En lugar de "enviar a cumplimiento", procesos marca como 'aprobado'
      // Cumplimiento verá terceros asignados a cumplimiento
      await tercerosDRFService.changeState(selectedTercero.id, {
        estado: 'asignada_oficial_cumplimiento', // 🆕 Nuevo estado: asignada a cumplimiento
        observaciones: actionReason || 'Aprobado por procesos - Listo para finalización por cumplimiento',
        rol_asignado: 'procesos'
      });
      
      toast({
        title: "Éxito",
        description: "Tercero aprobado - Disponible para cumplimiento",
        variant: "default"
      });

      setShowCumplimientoDialog(false);
      setSelectedTercero(null);
      setActionReason('');
      fetchTerceros(); // Refrescar la lista
      
    } catch (error) {
      console.error('Error enviando a cumplimiento:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el tercero a cumplimiento",
        variant: "destructive"
      });
    }
  };

  const handleEnviarAContabilidad = async () => {
    if (!selectedTercero) return;

    try {
      // 🆕 NUEVO FLUJO: Procesos finaliza directamente (solo si cumplimiento no está habilitado)
      await tercerosDRFService.changeState(selectedTercero.id, {
        estado: 'finalizado', // 🆕 Estado final
        observaciones: actionReason || 'Finalizado por procesos - Enviado a contabilidad',
        rol_asignado: (userRole || 'procesos') as 'comercial' | 'administrador' | 'procesos' | 'oficial_cumplimiento'
      });
      
      toast({
        title: "Éxito",
        description: "Tercero finalizado y enviado a contabilidad correctamente",
        variant: "default"
      });

      setShowContabilidadDialog(false);
      setSelectedTercero(null);
      setActionReason('');
      fetchTerceros();
      
    } catch (error) {
      console.error('Error enviando a contabilidad:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el tercero a contabilidad",
        variant: "destructive"
      });
    }
  };

  const handleDevolverAComercial = async () => {
    if (!selectedTercero || !actionReason.trim()) {
      toast({
        title: "❌ Error",
        description: "Las observaciones son obligatorias para devolver al comercial",
        variant: "destructive"
      });
      return;
    }

    try {
      // Cambiar estado a devuelto para que vuelva al comercial asignado
      await tercerosDRFService.changeState(selectedTercero.id, {
        estado: 'devuelto_comercial', // 🆕 Estado de devolución específico
        observaciones: `Devuelto al comercial por procesos: ${actionReason}`,
        rol_asignado: 'procesos'
      });
      
      toast({
        title: "🔄 Devuelto al Comercial",
        description: `${selectedTercero.nombres || selectedTercero.razon_social} ha sido devuelto al comercial asignado. Se enviará un email automáticamente.`, // 🔧 Corregido campo nombre
        className: "bg-yellow-50 border-yellow-200"
      });

      setShowDevolverComercialDialog(false);
      setSelectedTercero(null);
      setActionReason('');
      fetchTerceros();
      
    } catch (error) {
      console.error('Error devolviendo al comercial:', error);
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo devolver el tercero al comercial",
        variant: "destructive"
      });
    }
  };

  // Filtrar terceros por tab
  const getFilteredTerceros = (tabFilter: string) => {
    let filtered = terceros;
    
    // Filtro por tab
    if (tabFilter === 'pendientes') {
      filtered = filtered.filter(t => t.estado_aprobacion === TERCERO_STATES.PENDIENTE);
    } else if (tabFilter === 'revision') {
      filtered = filtered.filter(t => t.estado_aprobacion === TERCERO_STATES.PENDIENTE);
    } else if (tabFilter === 'aprobados') {
      filtered = filtered.filter(t => t.estado_aprobacion === TERCERO_STATES.APROBADO);
    } else if (tabFilter === 'rechazados') {
      filtered = filtered.filter(t => t.estado_aprobacion === TERCERO_STATES.RECHAZADO);
    }
    
    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(tercero => 
        tercero.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tercero.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tercero.numero_documento.includes(searchTerm)
      );
    }
    
    // Filtro por estado
    if (filterState !== 'all') {
      filtered = filtered.filter(t => t.estado_aprobacion === filterState);
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard de procesos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Procesos</h1>
            <p className="text-gray-600 mt-1">Gestión completa de terceros y flujos de trabajo</p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Tercero
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span className="text-sm font-medium text-green-600">PROCESOS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-yellow-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
            <p className="text-xs text-gray-600">Nuevos registros</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Revisión</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.enRevision}</div>
            <p className="text-xs text-gray-600">En proceso</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.aprobados}</div>
            <p className="text-xs text-gray-600">Finalizados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rechazados}</div>
            <p className="text-xs text-gray-600">No aprobados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.total}</div>
            <p className="text-xs text-gray-600">Registros totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por razón social, nombres o documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value={TERCERO_STATES.PENDIENTE}>Pendientes</SelectItem>
                <SelectItem value={TERCERO_STATES.PENDIENTE}>Pendientes</SelectItem>
                <SelectItem value={TERCERO_STATES.APROBADO}>Aprobados</SelectItem>
                <SelectItem value={TERCERO_STATES.RECHAZADO}>Rechazados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Terceros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gestión de Terceros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="todos">Todos ({terceros.length})</TabsTrigger>
              <TabsTrigger value="pendientes">Pendientes ({stats.pendientes})</TabsTrigger>
              <TabsTrigger value="revision">En Revisión ({stats.enRevision})</TabsTrigger>
              <TabsTrigger value="aprobados">Aprobados ({stats.aprobados})</TabsTrigger>
              <TabsTrigger value="rechazados">Rechazados ({stats.rechazados})</TabsTrigger>
              <TabsTrigger value="asignacion" className="bg-blue-50 text-blue-700">
                <UserPlus className="h-4 w-4 mr-1" />
                Asignar Comercial
              </TabsTrigger>
            </TabsList>

            {['todos', 'pendientes', 'revision', 'aprobados', 'rechazados'].map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-6">
                <div className="space-y-4">
                  {getFilteredTerceros(tab).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <p>No hay terceros para mostrar en esta categoría</p>
                    </div>
                  ) : (
                    getFilteredTerceros(tab).map((tercero) => (
                      <div key={tercero.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">
                                {tercero.razon_social || `${tercero.nombres} ${tercero.apellidos || ''}`}
                              </h3>
                              <Badge className={`${STATE_COLORS[tercero.estado_aprobacion]} text-xs`}>
                                {STATE_LABELS[tercero.estado_aprobacion]}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {tercero.tipo_persona === 'natural' ? 'Persona Natural' : 'Empresa'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Documento:</span> {tercero.numero_documento}
                              </div>
                              <div>
                                <span className="font-medium">Email:</span> {tercero.email}
                              </div>
                              <div>
                                <span className="font-medium">Teléfono:</span> {tercero.telefono}
                              </div>
                              <div>
                                <span className="font-medium">Fecha:</span> {new Date(tercero.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          {/* Acciones */}
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Acción de ver/editar
                                console.log('Ver detalles:', tercero);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            
                            {tercero.estado_aprobacion === TERCERO_STATES.PENDIENTE && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => {
                                    setSelectedTercero(tercero);
                                    setActionType('approve');
                                    setShowActionDialog(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Aprobar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => {
                                    setSelectedTercero(tercero);
                                    setShowDevolverComercialDialog(true);
                                  }}
                                >
                                  <ArrowLeft className="h-4 w-4 mr-1" />
                                  Devolver a Comercial
                                </Button>
                              </>
                            )}
                            
                            {/* Opciones para terceros asignados a procesos */}
                            {(tercero.estado_aprobacion === 'aprobado' || // 🆕 Estado aprobado
                              tercero.estado_aprobacion === 'asignada_procesos' || tercero.estado_aprobacion === 'en_curso_procesos') && ( // 🆕 Estados específicos de procesos
                              <>
                                <Button
                                  size="sm"
                                  className="bg-orange-600 hover:bg-orange-700 text-white"
                                  onClick={() => {
                                    setSelectedTercero(tercero);
                                    setShowCumplimientoDialog(true);
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Enviar a Cumplimiento
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={() => {
                                    setSelectedTercero(tercero);
                                    setShowContabilidadDialog(true);
                                  }}
                                >
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Enviar a Contabilidad
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            ))}

            {/* Nueva pestaña de Asignación Comercial */}
            <TabsContent value="asignacion" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-blue-600" />
                    Asignación de Terceros a Comerciales
                  </CardTitle>
                  <CardDescription>
                    Selecciona terceros para asignar a comerciales disponibles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {terceros.filter(t => t.estado_aprobacion === TERCERO_STATES.APROBADO).length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <UserPlus className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <p>No hay terceros aprobados disponibles para asignar</p>
                        <p className="text-sm mt-2">Los terceros deben estar aprobados antes de poder asignar un comercial</p>
                      </div>
                    ) : (
                      terceros
                        .filter(t => t.estado_aprobacion === TERCERO_STATES.APROBADO)
                        .map((tercero) => (
                          <div key={tercero.id} className="border rounded-lg p-4 hover:bg-blue-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-gray-900">
                                    {tercero.razon_social || `${tercero.nombres} ${tercero.apellidos || ''}`}
                                  </h3>
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    Aprobado
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {tercero.tipo_persona === 'natural' ? 'Persona Natural' : 'Empresa'}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                  <div>
                                    <span className="font-medium">Documento:</span> {tercero.numero_documento}
                                  </div>
                                  <div>
                                    <span className="font-medium">Email:</span> {tercero.email}
                                  </div>
                                  <div>
                                    <span className="font-medium">Teléfono:</span> {tercero.telefono}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Botón de asignación */}
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={() => {
                                    setSelectedTercero(tercero);
                                    setShowAssignDialog(true);
                                  }}
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Asignar Comercial
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog de Acción */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Aprobar' : 'Rechazar'} Tercero
            </DialogTitle>
            <DialogDescription>
              {selectedTercero?.razon_social || selectedTercero?.nombres} - {selectedTercero?.numero_documento}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {actionType === 'approve' ? 'Comentarios de aprobación' : 'Motivo del rechazo'}
              </label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={
                  actionType === 'approve' 
                    ? 'Comentarios opcionales sobre la aprobación...'
                    : 'Especifica el motivo del rechazo...'
                }
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAction}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {actionType === 'approve' ? 'Aprobar' : 'Rechazar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Asignación Comercial usando ComercialSelector */}
      {selectedTercero && (
        <ComercialSelector
          isOpen={showAssignDialog}
          onClose={() => setShowAssignDialog(false)}
          terceroId={selectedTercero.id}
          terceroNombre={selectedTercero.razon_social || selectedTercero.nombres}
          onAsignacionCompleta={() => {
            setShowAssignDialog(false);
            setSelectedTercero(null);
            fetchTerceros(); // Refrescar la lista
          }}
          esReasignacion={false}
        />
      )}

      {/* Dialog para Enviar a Cumplimiento */}
      <Dialog open={showCumplimientoDialog} onOpenChange={setShowCumplimientoDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              Enviar a Cumplimiento
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea enviar el tercero <strong>{selectedTercero?.razon_social || selectedTercero?.nombres}</strong> al departamento de cumplimiento?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Observaciones para cumplimiento (opcional)
              </label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Agregue cualquier observación relevante para el departamento de cumplimiento..."
                className="min-h-[100px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Estas observaciones serán visibles para el oficial de cumplimiento
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800">Información importante:</p>
                  <p className="text-orange-700 mt-1">
                    El tercero será asignado al oficial de cumplimiento para revisión de documentación SARLAFT y verificación final antes de la aprobación definitiva.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCumplimientoDialog(false);
              setActionReason('');
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleEnviarACumplimiento}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Enviar a Cumplimiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Enviar a Contabilidad */}
      <Dialog open={showContabilidadDialog} onOpenChange={setShowContabilidadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Enviar a Contabilidad
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea aprobar definitivamente y enviar el tercero <strong>{selectedTercero?.razon_social || selectedTercero?.nombres}</strong> a contabilidad?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Observaciones finales (opcional)
              </label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Agregue cualquier observación final para contabilidad..."
                className="min-h-[100px]"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Aprobación Final:</p>
                  <p className="text-blue-700 mt-1">
                    El tercero será marcado como <strong>APROBADO FINAL</strong> y se enviará un correo automático a contabilidad con toda la información del tercero para su registro en el sistema.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowContabilidadDialog(false);
              setActionReason('');
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleEnviarAContabilidad}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Aprobar y Enviar a Contabilidad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Devolver a Comercial */}
      <Dialog open={showDevolverComercialDialog} onOpenChange={setShowDevolverComercialDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5 text-red-600" />
              Devolver a Comercial
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea devolver el tercero <strong>{selectedTercero?.razon_social || selectedTercero?.nombres}</strong> al comercial asignado para ajustes?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Motivo de la devolución (requerido)
              </label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Especifique claramente qué ajustes debe realizar el comercial..."
                className="min-h-[100px]"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Este motivo será enviado por correo al comercial asignado
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <ArrowLeft className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-800">Proceso de Devolución:</p>
                  <p className="text-red-700 mt-1">
                    El tercero regresará al comercial con el estado "Requiere Ajustes" y se enviará un correo automático con las observaciones indicadas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDevolverComercialDialog(false);
              setActionReason('');
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleDevolverAComercial}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!actionReason.trim()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Devolver a Comercial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
