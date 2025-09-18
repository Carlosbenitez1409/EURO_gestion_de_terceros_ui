import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { 
    Users, 
    UserCheck, 
    UserX, 
    BarChart3, 
    RefreshCw, 
    Shuffle,
    AlertTriangle,
    AlertCircle,
    CheckCircle,
    FileCheck,
    History,
    Clock,
    Settings,
    Send
} from "lucide-react";
import { ComercialSelector } from './ComercialSelector';
import { EstadoAsignacionModal } from '@/components/common/EstadoAsignacionModal';
import { HistorialModal } from '@/components/common/HistorialModal';
import { comercialesService, type Comercial } from '@/services/comerciales.service';
import { tercerosService } from '@/services/terceros.service';
import { tercerosDRFService } from '@/services/terceros.drf.service';
import { useToast } from '@/hooks/use-toast';

// 🆕 Interface actualizada para nuevos estados (13 estados específicos)
interface TerceroAsignacion {
    id: string;
    nombre_completo: string;
    numero_documento: string;
    tipo_tercero: string;
    tipo_persona: 'natural' | 'juridica'; // 🆕 Campo requerido para EstadoAsignacionModal
    fecha_registro: string;
    estado_aprobacion: 'pendiente' | 'en_espera_correccion' | 'en_curso_comercial' | 'en_curso_administrador' | 'en_curso_procesos' | 'en_curso_cumplimiento' | 'asignada_administrador' | 'asignada_procesos' | 'asignada_oficial_cumplimiento' | 'devuelto_comercial' | 'aprobado' | 'rechazado' | 'finalizado';
    usuario_asignado?: {
        id: number;
        username: string;
        full_name: string;
    } | null;
    rol_asignado?: 'comercial' | 'procesos' | 'oficial_cumplimiento' | 'administrador';
    fecha_asignacion?: string;
}

export const ComercialDashboard: React.FC = () => {
    const { toast } = useToast();
    const [terceros, setTerceros] = useState<TerceroAsignacion[]>([]);
    const [comerciales, setComerciales] = useState<Comercial[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [terceroSeleccionado, setTerceroSeleccionado] = useState<TerceroAsignacion | null>(null);
    const [asignandoMasivo, setAsignandoMasivo] = useState(false);

    // 🆕 Estados para nuevos modales
    const [estadoModalOpen, setEstadoModalOpen] = useState(false);
    const [historialModalOpen, setHistorialModalOpen] = useState(false);

    // Filtros actualizados para nuevos estados
    const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'en_espera_correccion' | 'devuelto_comercial'>('todos');

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            // Usar el servicio de terceros DRF que ya tiene la información completa
            const [tercerosResponse, comercialesData] = await Promise.all([
                tercerosDRFService.getTerceros(), // Cambiar a DRF service que tiene más información
                comercialesService.getComerciales()
            ]);

            // Extraer los terceros de la respuesta paginada
            const tercerosData = tercerosResponse.results || [];

            // Transformar datos de terceros para usar nuevos estados
            const tercerosConEstado: TerceroAsignacion[] = tercerosData.map(tercero => {
                return {
                    id: tercero.id.toString(),
                    nombre_completo: (tercero.nombres || '') + (tercero.apellidos ? ` ${tercero.apellidos}` : '') || tercero.razon_social || 'Sin nombre',
                    numero_documento: tercero.numero_documento || 'N/A',
                    tipo_tercero: tercero.tipo_persona === 'natural' ? 'Empleado' : 'Proveedor',
                    tipo_persona: tercero.tipo_persona || 'natural',
                    fecha_registro: tercero.created_at || new Date().toISOString(),
                    estado_aprobacion: tercero.estado_aprobacion || 'pendiente',
                    usuario_asignado: tercero.usuario_asignado ? {
                        ...tercero.usuario_asignado,
                        full_name: tercero.usuario_asignado.full_name || 
                                 `${tercero.usuario_asignado.first_name} ${tercero.usuario_asignado.last_name}`
                    } : null,
                    rol_asignado: tercero.rol_asignado || undefined,
                    fecha_asignacion: tercero.fecha_asignacion || undefined
                };
            });

            setTerceros(tercerosConEstado);
            setComerciales(comercialesData);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron cargar los datos",
            });
        } finally {
            setLoading(false);
        }
    };

    const abrirSelector = (tercero: TerceroAsignacion) => {
        setTerceroSeleccionado(tercero);
        setSelectorOpen(true);
    };

    const handleAsignacionCompleta = () => {
        cargarDatos(); // Recargar datos después de asignación
    };

    // 🆕 Funciones para nuevos modales
    const abrirEstadoModal = (tercero: TerceroAsignacion) => {
        setTerceroSeleccionado(tercero);
        setEstadoModalOpen(true);
    };

    const abrirHistorialModal = (tercero: TerceroAsignacion) => {
        setTerceroSeleccionado(tercero);
        setHistorialModalOpen(true);
    };

    const handleEstadoSuccess = () => {
        cargarDatos();
    };

    // 🆕 FUNCIÓN ACTUALIZADA: Envío para corrección del tercero
    const enviarParaCorreccion = async (tercero: TerceroAsignacion) => {
        try {
            console.log('🚀 Enviando tercero para corrección...', tercero.id);
            
            // Verificar que el tercero esté en estado correcto (pendiente o en_curso_comercial)
            if (!['pendiente', 'en_curso_comercial'].includes(tercero.estado_aprobacion)) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: `Solo se pueden enviar terceros en estado 'pendiente' o 'en_curso_comercial'. Estado actual: ${tercero.estado_aprobacion}`,
                });
                return;
            }

            console.log('🔄 Cambiando estado a en_espera_correccion...');
            
            // Cambiar estado a en_espera_correccion (información incorrecta, debe corregir el tercero)
            await tercerosDRFService.changeState(tercero.id, {
                estado: "en_espera_correccion",
                observaciones: "Información incorrecta - se devuelve al tercero para corrección",
                rol_asignado: "comercial"
            });

            // Enviar correo al tercero (si está implementado en el backend)
            // TODO: Implementar endpoint para envío de correo automático

            toast({
                title: "📧 Enviado para corrección",
                description: `Tercero "${tercero.nombre_completo}" enviado para corrección de información`,
                variant: "default"
            });

            // Recargar datos para mostrar el cambio
            cargarDatos();

        } catch (error: any) {
            console.error('❌ Error en envío directo a cumplimiento:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "No se pudo enviar el tercero a cumplimiento",
            });
        }
    };

    // 🆕 NUEVA FUNCIÓN: Aprobar información y enviar al administrador  
    const aprobarYEnviarAAdmin = async (tercero: TerceroAsignacion) => {
        try {
            console.log('✅ Aprobando información y enviando al administrador...', tercero.id);
            
            // Verificar que el tercero esté en estado correcto (pendiente)
            if (tercero.estado_aprobacion !== 'pendiente') {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: `Solo se pueden aprobar terceros en estado 'pendiente'. Estado actual: ${tercero.estado_aprobacion}`,
                });
                return;
            }

            // Cambiar estado a asignada_a_administrador
            await tercerosDRFService.changeState(tercero.id, {
                estado: "asignada_administrador",
                observaciones: "Información correcta - aprobado por comercial para asignación administrativa",
                rol_asignado: "comercial"
            });

            toast({
                title: "✅ Aprobado y enviado",
                description: `Tercero "${tercero.nombre_completo}" aprobado y enviado al administrador`,
                variant: "default"
            });

            // Recargar datos
            cargarDatos();

        } catch (error: any) {
            console.error('❌ Error aprobando tercero:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "No se pudo aprobar el tercero",
            });
        }
    };

    // 🚀 NUEVA FUNCIÓN: Envío masivo a cumplimiento
    const enviarMasivoACumplimiento = async () => {
        setAsignandoMasivo(true);
        try {
            // Filtrar terceros que pueden ser enviados a cumplimiento
            const tercerosParaCumplimiento = terceros.filter(t => 
                (t.estado_aprobacion === 'pendiente' || t.estado_aprobacion === 'en_curso_comercial') && 
                t.rol_asignado === 'comercial'
            );
            
            if (tercerosParaCumplimiento.length === 0) {
                toast({
                    title: "Sin terceros disponibles",
                    description: "No hay terceros pendientes o asignados comercial para enviar a cumplimiento",
                });
                return;
            }

            let exitosos = 0;
            let errores = 0;

            // Procesar cada tercero individualmente
            for (const tercero of tercerosParaCumplimiento) {
                try {
                    await enviarParaCorreccion(tercero);
                    exitosos++;
                } catch (error) {
                    console.error(`Error procesando tercero ${tercero.id}:`, error);
                    errores++;
                }
            }

            toast({
                title: "Procesamiento masivo completado",
                description: `✅ ${exitosos} terceros enviados a cumplimiento${errores > 0 ? `, ${errores} errores` : ''}`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Error en el procesamiento masivo",
            });
        } finally {
            setAsignandoMasivo(false);
        }
    };

    const asignarTodosPendientes = async () => {
        setAsignandoMasivo(true);
        try {
            // Filtrar terceros pendientes asignados al comercial
            const tercerosPendientes = terceros.filter(t => 
                t.estado_aprobacion === 'pendiente' && 
                t.rol_asignado === 'comercial'
            );
            
            if (tercerosPendientes.length === 0) {
                toast({
                    title: "Sin terceros pendientes",
                    description: "No hay terceros pendientes para procesar",
                });
                return;
            }

            // TODO: Implementar procesamiento masivo cuando el backend esté listo
            cargarDatos();
            
            toast({
                title: "Éxito",
                description: `Se procesaron ${tercerosPendientes.length} terceros automáticamente`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Error en el procesamiento masivo",
            });
        } finally {
            setAsignandoMasivo(false);
        }
    };

    // 🆕 Estadísticas actualizadas para comerciales
    const stats = {
        total: terceros.filter(t => t.rol_asignado === 'comercial').length,
        pendientes: terceros.filter(t => t.estado_aprobacion === 'pendiente' && t.rol_asignado === 'comercial').length,
        enEspera: terceros.filter(t => t.estado_aprobacion === 'en_espera_correccion' && t.rol_asignado === 'comercial').length,
        devueltos: terceros.filter(t => t.estado_aprobacion === 'devuelto_comercial' && t.rol_asignado === 'comercial').length,
        completados: terceros.filter(t => ['aprobado', 'finalizado'].includes(t.estado_aprobacion) && t.rol_asignado === 'comercial').length
    };

    // 🆕 Filtrar terceros por estado y rol comercial
    const tercerosFiltrados = terceros.filter(tercero => {
        // Solo mostrar terceros asignados al comercial
        if (tercero.rol_asignado !== 'comercial') return false;
        
        if (filtroEstado === 'todos') return true;
        return tercero.estado_aprobacion === filtroEstado;
    });

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'asignado':
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Asignado</Badge>;
            case 'sin_asignar':
                return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Sin Asignar</Badge>;
            default:
                return <Badge variant="secondary">Pendiente</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-[#0052CC]" />
                <span className="ml-2 text-lg">Cargando dashboard...</span>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard de Asignación Comercial</h1>
                    <p className="text-gray-600 mt-1">Gestiona la asignación de terceros a comerciales</p>
                </div>
                <Button 
                    onClick={cargarDatos}
                    variant="outline"
                    className="border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                </Button>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Terceros</CardTitle>
                        <Users className="h-4 w-4 text-[#0052CC]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                        <UserX className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.pendientes}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">En Espera</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.enEspera}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Devueltos</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{stats.devueltos}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completados</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.completados}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Acciones Masivas */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shuffle className="h-5 w-5 text-[#0052CC]" />
                        Acciones Masivas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <Button
                            onClick={asignarTodosPendientes}
                            disabled={stats.pendientes === 0 || asignandoMasivo}
                            className="bg-[#0052CC] hover:bg-[#003A8C]"
                        >
                            {asignandoMasivo ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Procesar Pendientes ({stats.pendientes} terceros)
                                </>
                            )}
                        </Button>
                        
                        {/* 🆕 BOTÓN ACTUALIZADO: Envío masivo para corrección */}
                        <Button
                            onClick={enviarMasivoACumplimiento}
                            disabled={terceros.filter(t => t.estado_aprobacion === 'pendiente' && t.rol_asignado === 'comercial').length === 0 || asignandoMasivo}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            {asignandoMasivo ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Enviar para Corrección ({terceros.filter(t => t.estado_aprobacion === 'pendiente' && t.rol_asignado === 'comercial').length} terceros)
                                </>
                            )}
                        </Button>

                        {/* 🆕 BOTÓN NUEVO: Aprobar masivamente y enviar al administrador */}
                        <Button
                            onClick={async () => {
                                setAsignandoMasivo(true);
                                try {
                                    const tercerosParaAprobar = terceros.filter(t => 
                                        t.estado_aprobacion === 'pendiente' && t.rol_asignado === 'comercial'
                                    );
                                    
                                    let exitosos = 0;
                                    for (const tercero of tercerosParaAprobar) {
                                        try {
                                            await aprobarYEnviarAAdmin(tercero);
                                            exitosos++;
                                        } catch (error) {
                                            console.error(`Error aprobando tercero ${tercero.id}:`, error);
                                        }
                                    }
                                    
                                    toast({
                                        title: "Aprobación masiva completada",
                                        description: `✅ ${exitosos} terceros aprobados y enviados al administrador`,
                                    });
                                } finally {
                                    setAsignandoMasivo(false);
                                }
                            }}
                            disabled={terceros.filter(t => t.estado_aprobacion === 'pendiente' && t.rol_asignado === 'comercial').length === 0 || asignandoMasivo}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {asignandoMasivo ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                    Aprobando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Aprobar para Administrador ({terceros.filter(t => t.estado_aprobacion === 'pendiente' && t.rol_asignado === 'comercial').length} terceros)
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Filtros */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-2">
                        <Button
                            variant={filtroEstado === 'todos' ? 'default' : 'outline'}
                            onClick={() => setFiltroEstado('todos')}
                            size="sm"
                        >
                            Todos ({stats.total})
                        </Button>
                        <Button
                            variant={filtroEstado === 'pendiente' ? 'default' : 'outline'}
                            onClick={() => setFiltroEstado('pendiente')}
                            size="sm"
                        >
                            Pendientes ({stats.pendientes})
                        </Button>
                        <Button
                            variant={filtroEstado === 'en_espera_correccion' ? 'default' : 'outline'}
                            onClick={() => setFiltroEstado('en_espera_correccion')}
                            size="sm"
                        >
                            En Espera ({stats.enEspera})
                        </Button>
                        <Button
                            variant={filtroEstado === 'devuelto_comercial' ? 'default' : 'outline'}
                            onClick={() => setFiltroEstado('devuelto_comercial')}
                            size="sm"
                        >
                            Devueltos ({stats.devueltos})
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Tabla de Terceros */}
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Terceros</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tercero</TableHead>
                                <TableHead>Documento</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Usuario Asignado</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Fecha Registro</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tercerosFiltrados.map((tercero) => (
                                <TableRow key={tercero.id}>
                                    <TableCell className="font-medium">
                                        {tercero.nombre_completo}
                                    </TableCell>
                                    <TableCell>{tercero.numero_documento}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{tercero.tipo_tercero}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {tercero.usuario_asignado ? (
                                            <span className="text-green-700 font-medium">
                                                {tercero.usuario_asignado.full_name}
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">No asignado</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {getEstadoBadge(tercero.estado_aprobacion)}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(tercero.fecha_registro).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => abrirEstadoModal(tercero)}
                                                size="sm"
                                                variant="outline"
                                                className="border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white"
                                            >
                                                <Settings className="h-4 w-4 mr-1" />
                                                Estado
                                            </Button>
                                            <Button
                                                onClick={() => abrirHistorialModal(tercero)}
                                                size="sm"
                                                variant="outline"
                                                className="border-gray-400 text-gray-600 hover:bg-gray-100"
                                            >
                                                <History className="h-4 w-4 mr-1" />
                                                Historial
                                            </Button>
                                            
                                            {/* 🆕 Acciones específicas según el estado */}
                                            {tercero.estado_aprobacion === 'pendiente' && (
                                                <>
                                                    <Button
                                                        onClick={() => enviarParaCorreccion(tercero)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-orange-400 text-orange-600 hover:bg-orange-50"
                                                    >
                                                        <AlertTriangle className="h-4 w-4 mr-1" />
                                                        Corregir
                                                    </Button>
                                                    <Button
                                                        onClick={() => aprobarYEnviarAAdmin(tercero)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-green-400 text-green-600 hover:bg-green-50"
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Aprobar
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {tercerosFiltrados.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        No hay terceros para mostrar con el filtro actual
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* 🆕 Modal de Estado */}
            {terceroSeleccionado && (
                <EstadoAsignacionModal
                    isOpen={estadoModalOpen}
                    onClose={() => {
                        setEstadoModalOpen(false);
                        setTerceroSeleccionado(null);
                    }}
                    tercero={terceroSeleccionado}
                    userRole="comercial"
                    userId={1} // TODO: Obtener del contexto de usuario
                    onSuccess={handleEstadoSuccess}
                />
            )}

            {/* 🆕 Modal de Historial */}
            {terceroSeleccionado && (
                <HistorialModal
                    isOpen={historialModalOpen}
                    onClose={() => {
                        setHistorialModalOpen(false);
                        setTerceroSeleccionado(null);
                    }}
                    terceroId={terceroSeleccionado.id}
                    terceroNombre={terceroSeleccionado.nombre_completo}
                />
            )}
        </div>
    );
};
