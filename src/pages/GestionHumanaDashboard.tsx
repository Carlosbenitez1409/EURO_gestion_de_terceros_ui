import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { 
  Users, UserPlus, Search, Filter, FileText, 
  Building2, Phone, Mail, MapPin 
} from 'lucide-react';
import { usePermissions } from '../hooks/useUser';
import { tercerosDRFService, type TerceroDRF } from '../services/terceros.drf.service';

// Tipo específico para crear empleados
interface EmpleadoCreateRequest {
  tipo_documento: "CC" | "CE" | "PA" | "NIT";
  numero_documento: string;
  tipo_persona: 'natural';
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  observaciones: string;
}
import { TERCERO_STATES, STATE_LABELS, STATE_COLORS } from '../config/roles';
import { toast } from '../hooks/use-toast';

interface GestionHumanaDashboardProps {
  userRole: string;
}

export default function GestionHumanaDashboard({ userRole }: GestionHumanaDashboardProps) {
  const permissions = usePermissions();
  const [empleados, setEmpleados] = useState<TerceroDRF[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<EmpleadoCreateRequest>({
    tipo_documento: 'CC' as const,
    numero_documento: '',
    tipo_persona: 'natural',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    departamento: '',
    observaciones: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Estadísticas
  const [stats, setStats] = useState({
    empleados: 0,
    activos: 0,
    pendientes: 0,
    total: 0
  });

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const fetchEmpleados = async () => {
    try {
      setLoading(true);
      const response = await tercerosDRFService.getTerceros();
      
      // RRHH solo ve empleados (personas naturales)
      const empleados = (response.results || []).filter(t => t.tipo_persona === 'natural');
      setEmpleados(empleados);
      
      // Calcular estadísticas
      const stats = {
        empleados: empleados.length,
        activos: empleados.filter(e => e.estado_aprobacion === TERCERO_STATES.APROBADO).length,
        pendientes: empleados.filter(e => e.estado_aprobacion === TERCERO_STATES.PENDIENTE).length,
        total: empleados.length
      };
      setStats(stats);
      
    } catch (error) {
      console.error('Error fetching empleados:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los empleados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmpleado = async () => {
    // Validaciones básicas
    if (!formData.nombres || !formData.apellidos || !formData.numero_documento || !formData.email) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Convertir EmpleadoCreateRequest a TerceroCreateRequest completo
      const terceroData = {
        ...formData,
        // Campos obligatorios para terceros que no aplican a empleados
        actividad_economica_principal: "Empleado de la organización",
        codigo_ciiu: "9000", // Código genérico para servicios
        responsableIVA: false,
        correoFacturacion: formData.email, // Usar el mismo email
        granContribuyente: false,
        autorretenedor: false,
        exentoRenta: false,
        operacionesMonedaExtranjera: false,
        tiposOperacionesMonedaExtranjera: [],
        personaExpuestaPolitica: false,
        informacionPEP: [],
        fuentesFondos: ["SALARIO"],
        tiposRecursos: ["PROPIOS"],
        manejoAltoEfectivo: false,
        constituyePatrimoniosAutonomos: false,
        declaracionTransparencia: true,
        autorizacionTratamientoDatos: true,
        patrimonioFiducia: false,
        relacionesComerciales: false,
        cuentasFinancierasExterior: false,  // Campo requerido por nueva estructura PEP
        
        // 👤 CAMPOS OBLIGATORIOS NUEVOS
        nombrePersonaContacto: `${formData.nombres} ${formData.apellidos}`,
        cargoPersonaContacto: "Empleado",
        manejoActivosVirtuales: false,
        detalleActivosVirtuales: "",
        
        representantes: [],
        accionistas_frontend: [],
        pais: "Colombia"
      };
      
      await tercerosDRFService.createTercero(terceroData);

      toast({
        title: "Éxito",
        description: "Empleado registrado correctamente",
        variant: "default"
      });

      setShowCreateDialog(false);
      resetForm();
      fetchEmpleados();
      
    } catch (error) {
      console.error('Error creating empleado:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar el empleado",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo_documento: 'CC' as const,
      numero_documento: '',
      tipo_persona: 'natural',
      nombres: '',
      apellidos: '',
      email: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      departamento: '',
      observaciones: ''
    });
  };

  // Filtrar empleados
  const filteredEmpleados = empleados.filter(empleado => {
    const searchString = `${empleado.nombres} ${empleado.apellidos} ${empleado.numero_documento} ${empleado.email}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard de gestión humana...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Gestión Humana</h1>
            <p className="text-gray-600 mt-1">Registro y gestión de empleados</p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Registrar Empleado
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <span className="text-sm font-medium text-purple-600">GESTIÓN HUMANA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-purple-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.empleados}</div>
            <p className="text-xs text-gray-600">Registrados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activos}</div>
            <p className="text-xs text-gray-600">Aprobados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <FileText className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
            <p className="text-xs text-gray-600">En proceso</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {empleados.filter(e => {
                const createdDate = new Date(e.created_at);
                const now = new Date();
                return createdDate.getMonth() === now.getMonth() && 
                       createdDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <p className="text-xs text-gray-600">Nuevos registros</p>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Búsqueda de Empleados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, apellido, documento o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Empleados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Empleados Registrados ({filteredEmpleados.length})
          </CardTitle>
          <CardDescription>
            Lista completa de empleados registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEmpleados.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No hay empleados para mostrar</p>
                {searchTerm && (
                  <p className="text-sm">Intenta con otros términos de búsqueda</p>
                )}
              </div>
            ) : (
              filteredEmpleados.map((empleado) => (
                <div key={empleado.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {empleado.nombres} {empleado.apellidos}
                        </h3>
                        <Badge className={`${STATE_COLORS[empleado.estado_aprobacion]} text-xs`}>
                          {STATE_LABELS[empleado.estado_aprobacion]}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">Documento:</span>
                            <span>{empleado.tipo_documento} {empleado.numero_documento}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">Email:</span>
                            <span>{empleado.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">Teléfono:</span>
                            <span>{empleado.telefono}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">Ubicación:</span>
                            <span>{empleado.ciudad}, {empleado.departamento}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">Dirección:</span>
                            <span>{empleado.direccion}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">Registro:</span>
                            <span>{new Date(empleado.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      {empleado.observaciones && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <span className="text-sm font-medium text-gray-700">Observaciones:</span>
                          <p className="text-sm text-gray-600 mt-1">{empleado.observaciones}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Registro */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Empleado</DialogTitle>
            <DialogDescription>
              Complete la información del empleado para registrarlo en el sistema
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Información Personal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombres">Nombres *</Label>
                <Input
                  id="nombres"
                  value={formData.nombres}
                  onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                  placeholder="Nombres completos"
                />
              </div>
              <div>
                <Label htmlFor="apellidos">Apellidos *</Label>
                <Input
                  id="apellidos"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                  placeholder="Apellidos completos"
                />
              </div>
            </div>

            {/* Documento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo_documento">Tipo de Documento *</Label>
                <Select value={formData.tipo_documento} onValueChange={(value: any) => setFormData({...formData, tipo_documento: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="PA">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="numero_documento">Número de Documento *</Label>
                <Input
                  id="numero_documento"
                  value={formData.numero_documento}
                  onChange={(e) => setFormData({...formData, numero_documento: e.target.value})}
                  placeholder="Número de documento"
                />
              </div>
            </div>

            {/* Contacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  placeholder="Número de teléfono"
                />
              </div>
            </div>

            {/* Ubicación */}
            <div>
              <Label htmlFor="direccion">Dirección *</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                placeholder="Dirección completa"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ciudad">Ciudad *</Label>
                <Input
                  id="ciudad"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                  placeholder="Ciudad"
                />
              </div>
              <div>
                <Label htmlFor="departamento">Departamento *</Label>
                <Input
                  id="departamento"
                  value={formData.departamento}
                  onChange={(e) => setFormData({...formData, departamento: e.target.value})}
                  placeholder="Departamento"
                />
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                placeholder="Observaciones adicionales (opcional)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateEmpleado}
              disabled={submitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {submitting ? 'Registrando...' : 'Registrar Empleado'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
