import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Users, 
  FileText, 
  Filter, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Building,
  User
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StrataDataCredentialsModal from './StrataDataCredentialsModal';

interface TerceroBasico {
  id: string;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  numero_documento: string;
  tipo_persona: 'natural' | 'juridica' | 'publica';
  estado_aprobacion: string;
  email?: string;
}

interface TercerosMasivaSelectionProps {
  terceros: TerceroBasico[];
  onQuerySuccess?: (result: any) => void;
}

export const TercerosMasivaSelection: React.FC<TercerosMasivaSelectionProps> = ({
  terceros,
  onQuerySuccess
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filteredTerceros, setFilteredTerceros] = useState<TerceroBasico[]>(terceros);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterTipoPersona, setFilterTipoPersona] = useState<string>('all');
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);

  // Estados únicos para el filtro
  const estadosUnicos = Array.from(new Set(terceros.map(t => t.estado_aprobacion))).sort();

  // Efecto para filtrar terceros
  useEffect(() => {
    let filtered = terceros;

    // Filtro por término de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tercero => {
        const nombre = getDisplayName(tercero).toLowerCase();
        const documento = tercero.numero_documento.toLowerCase();
        const email = tercero.email?.toLowerCase() || '';
        
        return nombre.includes(term) || 
               documento.includes(term) || 
               email.includes(term);
      });
    }

    // Filtro por estado
    if (filterEstado !== 'all') {
      filtered = filtered.filter(tercero => tercero.estado_aprobacion === filterEstado);
    }

    // Filtro por tipo de persona
    if (filterTipoPersona !== 'all') {
      filtered = filtered.filter(tercero => tercero.tipo_persona === filterTipoPersona);
    }

    setFilteredTerceros(filtered);
    
    // Limpiar selecciones que ya no estén en los filtrados
    setSelectedIds(prev => prev.filter(id => filtered.some(t => t.id === id)));
  }, [terceros, searchTerm, filterEstado, filterTipoPersona]);

  const getDisplayName = (tercero: TerceroBasico) => {
    if (tercero.tipo_persona === 'natural') {
      return `${tercero.nombres || ''} ${tercero.apellidos || ''}`.trim();
    }
    return tercero.razon_social || 'Sin nombre';
  };

  const getEstadoBadgeColor = (estado: string) => {
    const colorMap: Record<string, string> = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'en_curso_comercial': 'bg-blue-100 text-blue-800',
      'en_curso_administrador': 'bg-purple-100 text-purple-800',
      'en_curso_procesos': 'bg-indigo-100 text-indigo-800',
      'en_curso_cumplimiento': 'bg-orange-100 text-orange-800',
      'aprobado': 'bg-green-100 text-green-800',
      'rechazado': 'bg-red-100 text-red-800',
      'finalizado': 'bg-gray-100 text-gray-800'
    };
    
    return colorMap[estado] || 'bg-gray-100 text-gray-800';
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredTerceros.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTerceros.map(t => t.id));
    }
  };

  const handleToggleSelect = (terceroId: string) => {
    setSelectedIds(prev => 
      prev.includes(terceroId)
        ? prev.filter(id => id !== terceroId)
        : [...prev, terceroId]
    );
  };

  const handleMassiveQuery = () => {
    if (selectedIds.length === 0) {
      return;
    }
    
    if (selectedIds.length > 50) {
      alert('No puede seleccionar más de 50 terceros a la vez');
      return;
    }

    setShowCredentialsModal(true);
  };

  const handleQuerySuccess = (result: any) => {
    // Limpiar selección
    setSelectedIds([]);
    
    // Callback opcional
    if (onQuerySuccess) {
      onQuerySuccess(result);
    }
  };

  const selectedTerceros = filteredTerceros.filter(t => selectedIds.includes(t.id));

  const estimatedPersons = selectedTerceros.reduce((total, tercero) => {
    return total + (tercero.tipo_persona === 'natural' ? 1 : 4);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Panel de control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Consulta Masiva Stradata
          </CardTitle>
          <CardDescription>
            Seleccione múltiples terceros para consultar en Stradata simultáneamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controles de filtro */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nombre, documento, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {estadosUnicos.map(estado => (
                    <SelectItem key={estado} value={estado}>
                      {estado.replace(/_/g, ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo Persona</label>
              <Select value={filterTipoPersona} onValueChange={setFilterTipoPersona}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="natural">Natural</SelectItem>
                  <SelectItem value="juridica">Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Acciones</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSelectAll}
                  className="flex-1"
                >
                  {selectedIds.length === filteredTerceros.length ? 'Deseleccionar' : 'Seleccionar Todo'}
                </Button>
              </div>
            </div>
          </div>

          {/* Resumen de selección */}
          {selectedIds.length > 0 && (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{selectedIds.length} terceros seleccionados</strong> • 
                Aproximadamente {estimatedPersons} personas serán consultadas • 
                Los resultados se enviarán por correo
              </AlertDescription>
            </Alert>
          )}

          {/* Botón principal */}
          <Button 
            onClick={handleMassiveQuery}
            disabled={selectedIds.length === 0}
            className="w-full"
            size="lg"
          >
            <FileText className="h-4 w-4 mr-2" />
            Consultar en Stradata ({selectedIds.length})
          </Button>

          {selectedIds.length > 50 && (
            <Alert variant="destructive" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No puede seleccionar más de 50 terceros a la vez. Actualmente tiene {selectedIds.length} seleccionados.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Lista de terceros */}
      <Card>
        <CardHeader>
          <CardTitle>
            Terceros Disponibles
            <Badge variant="outline" className="ml-2">
              {filteredTerceros.length} de {terceros.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTerceros.length === 0 ? (
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                No se encontraron terceros con los filtros aplicados
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredTerceros.map((tercero) => (
                <div 
                  key={tercero.id} 
                  className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedIds.includes(tercero.id) ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handleToggleSelect(tercero.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedIds.includes(tercero.id)}
                      onChange={() => {}} // Manejado por el onClick del contenedor
                    />
                    
                    <div className="flex items-center gap-2">
                      {tercero.tipo_persona === 'natural' ? (
                        <User className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Building className="h-4 w-4 text-purple-600" />
                      )}
                    </div>

                    <div>
                      <div className="font-medium">{getDisplayName(tercero)}</div>
                      <div className="text-sm text-gray-600">
                        {tercero.numero_documento}
                        {tercero.email && ` • ${tercero.email}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {tercero.tipo_persona === 'natural' ? 'Natural' : 'Jurídica'}
                    </Badge>
                    <Badge className={getEstadoBadgeColor(tercero.estado_aprobacion)}>
                      {tercero.estado_aprobacion.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de credenciales */}
      <StrataDataCredentialsModal
        terceros={selectedTerceros}
        isOpen={showCredentialsModal}
        onClose={() => setShowCredentialsModal(false)}
        onSuccess={handleQuerySuccess}
      />
    </div>
  );
};

export default TercerosMasivaSelection;
