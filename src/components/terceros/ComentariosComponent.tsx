import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Clock, User } from 'lucide-react';
import { tercerosDRFService } from '@/services/terceros.drf.service';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/useUser';

interface Comentario {
  rol: string;
  usuario: string;
  fecha: string;
  texto: string;
}

interface ComentariosData {
  comments: {
    observaciones: Comentario[];
    notas_internas: Comentario[];
    comentarios_comercial: string;
    comentarios_aprobacion: string;
    observaciones_raw: string;
    notas_internas_raw: string;
  };
  metadata: {
    total_observaciones: number;
    total_notas_internas: number;
    tiene_comentarios_comercial: boolean;
    tiene_comentarios_aprobacion: boolean;
  };
}

interface ComentariosComponentProps {
  terceroId: string;
}

export const ComentariosComponent: React.FC<ComentariosComponentProps> = ({ terceroId }) => {
  const [comentarios, setComentarios] = useState<ComentariosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [agregarComentario, setAgregarComentario] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [tipoComentario, setTipoComentario] = useState<'observacion' | 'proceso' | 'nota_interna'>('observacion');
  const [guardando, setGuardando] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const cargarComentarios = async () => {
    try {
      setLoading(true);
      const data = await tercerosDRFService.obtenerComentarios(terceroId);
      setComentarios(data);
    } catch (error) {
      console.error('Error cargando comentarios:', error);
      toast({
        title: "❌ Error",
        description: "No se pudieron cargar los comentarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarComentario = async () => {
    if (!nuevoComentario.trim()) {
      toast({
        title: "⚠️ Validación",
        description: "El comentario no puede estar vacío",
        variant: "destructive"
      });
      return;
    }

    try {
      setGuardando(true);
      await tercerosDRFService.agregarComentario(terceroId, nuevoComentario, tipoComentario);
      
      toast({
        title: "✅ Comentario agregado",
        description: "El comentario se ha guardado correctamente",
        variant: "success"
      });

      setNuevoComentario('');
      setAgregarComentario(false);
      await cargarComentarios(); // Recargar comentarios
    } catch (error) {
      console.error('Error agregando comentario:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo agregar el comentario",
        variant: "destructive"
      });
    } finally {
      setGuardando(false);
    }
  };

  const getRolColor = (rol: string) => {
    switch (rol.toLowerCase()) {
      case 'procesos': return 'bg-blue-100 text-blue-800';
      case 'comercial': return 'bg-green-100 text-green-800';
      case 'administrador': return 'bg-purple-100 text-purple-800';
      case 'oficial_cumplimiento': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatearFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  };

  useEffect(() => {
    cargarComentarios();
  }, [terceroId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]"></div>
            <span className="ml-2">Cargando comentarios...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!comentarios) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">No se pudieron cargar los comentarios</p>
        </CardContent>
      </Card>
    );
  }

  const todosLosComentarios = [
    ...comentarios.comments.observaciones,
    ...comentarios.comments.notas_internas
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <Card className="shadow-lg border-blue-200 border">
      <CardHeader>
        <CardTitle className="text-[#0052CC] flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Historial de Comentarios
          <Badge variant="outline" className="ml-auto">
            {comentarios.metadata.total_observaciones + comentarios.metadata.total_notas_internas} comentarios
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botón para agregar comentario */}
        {user && (
          <div className="border-b pb-4">
            {!agregarComentario ? (
              <Button 
                onClick={() => setAgregarComentario(true)}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Comentario
              </Button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Tipo de comentario:</label>
                  <select 
                    value={tipoComentario} 
                    onChange={(e) => setTipoComentario(e.target.value as any)}
                    className="ml-2 border rounded px-2 py-1"
                  >
                    <option value="observacion">Observación</option>
                    {user.role === 'procesos' && <option value="proceso">Proceso</option>}
                    <option value="nota_interna">Nota Interna</option>
                  </select>
                </div>
                <Textarea
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  placeholder="Escriba su comentario aquí..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAgregarComentario}
                    disabled={guardando}
                    size="sm"
                  >
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </Button>
                  <Button 
                    onClick={() => {
                      setAgregarComentario(false);
                      setNuevoComentario('');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lista de comentarios */}
        {todosLosComentarios.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay comentarios disponibles</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todosLosComentarios.map((comentario, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getRolColor(comentario.rol)}>
                      {comentario.rol}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <User className="h-3 w-3" />
                      {comentario.usuario}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    {formatearFecha(comentario.fecha)}
                  </div>
                </div>
                <div className="text-gray-900">
                  {comentario.texto}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comentarios legacy si existen */}
        {(comentarios.comments.comentarios_comercial || comentarios.comments.comentarios_aprobacion) && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-700 mb-2">Comentarios Adicionales:</h4>
            {comentarios.comments.comentarios_comercial && (
              <div className="bg-green-50 rounded p-3 mb-2">
                <Badge className="bg-green-100 text-green-800 mb-1">Comercial</Badge>
                <p className="text-sm">{comentarios.comments.comentarios_comercial}</p>
              </div>
            )}
            {comentarios.comments.comentarios_aprobacion && (
              <div className="bg-blue-50 rounded p-3">
                <Badge className="bg-blue-100 text-blue-800 mb-1">Aprobación</Badge>
                <p className="text-sm">{comentarios.comments.comentarios_aprobacion}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};