import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { TokenStorage } from "@/lib/api.client";
import { tercerosDRFService, TerceroApprovalResponse } from "@/services/terceros.drf.service";
import { TerceroEstado } from "@/config/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserAssignmentModal } from "@/components/admin/UserAssignmentModal";
import { logoutUser } from "@/utils/logout.util";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Building,
    ArrowLeft,
    Save,
    Eye,
    RefreshCw,
    Users,
    Info,
    FileText
} from "lucide-react";

interface TerceroData {
    id: string;
    tipo_documento: 'CC' | 'CE' | 'PA' | 'NIT';
    numero_documento: string;
    nombres: string;
    apellidos?: string;
    razon_social?: string;
    email: string;
    telefono: string;
    direccion: string;
    ciudad: string;
    departamento: string;
    tipo_persona: 'natural' | 'juridica';
    estado_aprobacion: TerceroEstado;
    observaciones?: string;

    // 🆕 CAMPOS DE ASIGNACIÓN CENTRALIZADOS (según documentación)
    usuario_asignado?: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        full_name?: string;
        email: string;
    };
    rol_asignado?: 'comercial' | 'administrador' | 'procesos' | 'oficial_cumplimiento';
    fecha_asignacion?: string;

    // Campos derivados para mostrar en UI
    usuario_asignado_nombre?: string;
    rol_asignado_display?: string;
    fecha_asignacion_actual?: string;

    // Campos legacy (mantener compatibilidad temporal)
    observaciones_comercial?: string;
    comentarios_aprobacion?: string;
    notas_internas?: string;
    prioridad_comercial?: 'baja' | 'media' | 'alta';
    canal_contacto?: string;

    // 🔧 CAMPOS LEGACY DE ASIGNACIÓN (mantener compatibilidad)
    asignado_a?: {
        id: string;
        email: string;
        nombre_completo: string;
    };
    asignado_a_nombre?: string;
    asignado_a_email?: string;
    asignado_procesos?: {
        id: string;
        email: string;
        nombre_completo: string;
    };
    asignado_procesos_nombre?: string;
    asignado_a_procesos?: {
        id: string;
        email: string;
        nombre_completo: string;
    };
    asignado_a_procesos_nombre?: string;
    asignado_a_procesos_email?: string;
    asignado_cumplimiento?: {
        id: string;
        email: string;
        nombre_completo: string;
    };
    fecha_asignacion_comercial?: string;
    fecha_asignacion_procesos?: string;
}

export default function TerceroEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    // 🔍 LOGS DETALLADOS PARA VERIFICAR PERMISOS EN EDICIÓN
    console.log('🔍 TerceroEdit - Usuario actual:', {
        user,
        role: user?.role,
        id: user?.id,
        email: user?.email,
        terceroId: id,
        isAuthenticated: !!user
    });

    const [formData, setFormData] = useState<TerceroData>({
        id: '',
        tipo_documento: 'CC',
        numero_documento: '',
        nombres: '',
        apellidos: '',
        razon_social: '',
        email: '',
        telefono: '',
        direccion: '',
        ciudad: '',
        departamento: '',
        tipo_persona: 'natural',
        estado_aprobacion: 'asignada_administrador', // 🔧 ACTUALIZADO: Los terceros de actualización van directamente aquí
        observaciones: '',
        // Solo campos necesarios para comerciales
        observaciones_comercial: '',
        prioridad_comercial: 'media'
    });

    const [originalData, setOriginalData] = useState<TerceroData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 🆕 Estado para modal de asignación
    const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);

    // 🆕 Estado para datos de auditoría completa
    const [datosAuditoria, setDatosAuditoria] = useState<any>(null);
    const [loadingAuditoria, setLoadingAuditoria] = useState(false);

    // 🆕 FUNCIONES DE MAPEO DE ESTADOS LEGACY
    const mapearEstadoLegacy = (estado: string): TerceroData['estado_aprobacion'] => {
        const mapeoEstados: Record<string, TerceroData['estado_aprobacion']> = {
            // Estados legacy con nomenclatura incorrecta
            'asignado_comercial': 'en_curso_comercial', // 🔧 Mapeo principal que faltaba
            'asignado_administrador': 'asignada_administrador',
            'asignado_procesos': 'asignada_procesos',
            'asignado_cumplimiento': 'asignada_oficial_cumplimiento',
            'enviado_cumplimiento': 'asignada_oficial_cumplimiento'
        };

        console.log('🔧 mapearEstadoLegacy:', estado, '→', mapeoEstados[estado] || estado);
        return mapeoEstados[estado] || estado as TerceroData['estado_aprobacion'];
    };

    // Función inversa para enviar al backend (mantener legacy si es necesario)
    const mapearEstadoParaBackend = (estado: TerceroData['estado_aprobacion']): string => {
        // El backend podría seguir esperando algunos estados legacy
        const mapeoInverso: Record<string, string> = {
            'en_curso_comercial': 'en_curso_comercial', // Mantener este
            'asignada_administrador': 'asignada_administrador', // Backend ya acepta estos
            'asignada_procesos': 'asignada_procesos',
            'asignada_oficial_cumplimiento': 'asignada_oficial_cumplimiento',
            'devuelto_comercial': 'devuelto_comercial'
        };

        return mapeoInverso[estado] || estado;
    };

    useEffect(() => {
        const fetchTercero = async () => {
            try {
                setLoading(true);
                const data = await tercerosDRFService.getTercero(id!);

                console.log('🔍 TerceroEdit - Datos del tercero cargados:', data);

                // 🆕 MAPEAR ESTADOS LEGACY Y CAMPOS DE ASIGNACIÓN CENTRALIZADOS
                const estadoMapeado = mapearEstadoLegacy(data.estado_aprobacion);
                console.log('🔧 Mapeo de estado:', data.estado_aprobacion, '→', estadoMapeado);

                const mappedData: TerceroData = {
                    ...data,
                    estado_aprobacion: estadoMapeado, // 🔧 Aplicar mapeo de estado
                    // Campos derivados para mostrar en UI
                    usuario_asignado_nombre: data.usuario_asignado?.full_name ||
                        `${data.usuario_asignado?.first_name} ${data.usuario_asignado?.last_name}`.trim() ||
                        undefined,
                    rol_asignado_display: data.rol_asignado ? getRolDisplayName(data.rol_asignado) : undefined,
                    fecha_asignacion_actual: data.fecha_asignacion
                };

                console.log('📥 Datos mapeados:', mappedData);

                setFormData(mappedData);
                setOriginalData({ ...data, estado_aprobacion: estadoMapeado }); // Guardar también con estado mapeado
            } catch (err) {
                console.error('Error al cargar tercero:', err);
                setError(err instanceof Error ? err.message : 'Error al cargar el tercero');
            } finally {
                setLoading(false);
            }
        };

        // 🆕 Función para cargar datos de comentarios completos
        const fetchComentariosCompletos = async () => {
            try {
                setLoadingAuditoria(true);
                console.log('🔍 Cargando comentarios completos para ID:', id);
                
                const comentarios = await tercerosDRFService.obtenerComentarios(id!);
                console.log('✅ Comentarios completos cargados en TerceroEdit:', comentarios);
                
                setDatosAuditoria(comentarios);
                
            } catch (err) {
                console.error('🚨 Error al cargar comentarios completos:', err);
                // No mostramos error al usuario porque los comentarios son opcionales
            } finally {
                setLoadingAuditoria(false);
            }
        };

        if (id) {
            fetchTercero();
            fetchComentariosCompletos(); // 🆕 Cargar comentarios completos en paralelo
        }
    }, [id]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 🆕 Función para manejar el éxito de la asignación
    const handleAssignmentSuccess = () => {
        console.log('🎉 handleAssignmentSuccess ejecutado - cerrando modal y recargando datos');

        // Cerrar el modal inmediatamente
        setAssignmentModalOpen(false);

        // Recargar los datos del tercero para ver la nueva asignación
        if (id) {
            const fetchTercero = async () => {
                try {
                    console.log('🔄 Recargando datos del tercero después de asignación exitosa');
                    const data = await tercerosDRFService.getTercero(id);
                    console.log('✅ Datos recargados después de asignación:', data);

                    // 🔧 CORREGIDO: Sincronizar ambos estados completamente para evitar "cambios fantasma"
                    console.log('� Sincronizando formData y originalData para evitar envíos innecesarios');
                    setFormData({ ...data });
                    setOriginalData({ ...data });

                    // Mostrar confirmación de éxito
                    toast({
                        title: "✅ Datos actualizados",
                        description: `Tercero asignado correctamente. Estado: ${data.estado_aprobacion}`,
                        variant: "default"
                    });
                } catch (error) {
                    console.error('❌ Error al recargar tercero:', error);
                    toast({
                        title: "⚠️ Error al actualizar",
                        description: "La asignación fue exitosa pero hubo un error al actualizar la vista",
                        variant: "destructive"
                    });
                }
            };
            fetchTercero();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 🔧 CORREGIDO: Verificar si realmente hay cambios antes de procesar
        const stateChanged = originalData && formData.estado_aprobacion !== originalData.estado_aprobacion;
        const observationsChanged = originalData && formData.observaciones !== originalData.observaciones;
        const hasDataChanges = hasOtherChanges();

        // Si no hay cambios reales, evitar el envío
        if (!stateChanged && !observationsChanged && !hasDataChanges) {
            console.log('ℹ️ No hay cambios para guardar - evitando envío innecesario');
            toast({
                title: "ℹ️ Sin cambios",
                description: "No hay cambios para guardar",
                variant: "default"
            });
            setSaving(false);
            return;
        }

        // 🆕 VALIDACIÓN MEJORADA CON NUEVAS FUNCIONES
        const cambioDeEstado = stateChanged;
        if (cambioDeEstado) {
            const errorValidacion = validarCambioEstado(formData.estado_aprobacion, formData.observaciones || '');
            if (errorValidacion) {
                toast({
                    title: "❌ Validación fallida",
                    description: errorValidacion,
                    variant: "destructive"
                });
                setSaving(false);
                return;
            }
        }

        setSaving(true);

        try {
            console.log('🔍 DEBUG ESTADO:');
            console.log('- formData.estado_aprobacion:', formData.estado_aprobacion);
            console.log('- originalData.estado_aprobacion:', originalData?.estado_aprobacion);
            console.log('- stateChanged:', stateChanged);
            console.log('- observationsChanged:', observationsChanged);
            console.log('- hasOtherChanges():', hasDataChanges);

            // 🚫 EVITAR PROCESAMIENTO CUANDO ESTADO ESTÁ VACÍO DESPUÉS DE RECARGA DE MODAL
            // Solo para oficial_cumplimiento que puede tener este problema específico
            if (!formData.estado_aprobacion && stateChanged && user?.role === 'oficial_cumplimiento') {
                console.log('⚠️ Estado vacío detectado para oficial_cumplimiento después de recarga de modal - evitando procesamiento');
                toast({
                    title: "ℹ️ No hay cambios para guardar",
                    description: "El tercero fue actualizado correctamente por la asignación",
                    variant: "default"
                });
                setSaving(false);
                return;
            }

            // Lógica específica para comerciales  
            if (user?.role === 'comercial') {
                if (isApprovedState(formData.estado_aprobacion)) {
                    // Para comerciales que aprueban: usar campos específicos
                    // El backend ahora ejecuta automáticamente aprobar_por_comercial()
                    const result = await tercerosDRFService.commercialApprovalUpdate(
                        id!,
                        formData.observaciones_comercial || 'Aprobado por comercial - Listo para revisión del administrador'
                    );

                    // Verificar si el backend ejecutó la aprobación automática
                    if (result.aprobacion_ejecutada) {
                        toast({
                            title: "🎉 Tercero aprobado automáticamente",
                            description: `${result.mensaje_aprobacion}. Estado: ${result.nuevo_estado}. Asignado a: ${result.asignado_administrador}`,
                        });
                    } else {
                        toast({
                            title: "✅ Aprobación registrada",
                            description: "Su aprobación ha sido registrada. El tercero llegará al administrador como APROBADO FINAL.",
                        });
                    }

                    // Redirigir después de un breve delay para mostrar el mensaje
                    setTimeout(() => {
                        navigate('/dashboard/comercial');
                    }, 2500);

                } else {
                    // Para otros casos, usar el mismo método pero sin marcar como aprobado
                    await tercerosDRFService.patchTercero(id!, {
                        observaciones_comercial: formData.observaciones_comercial,
                        prioridad_comercial: formData.prioridad_comercial
                        // NO enviar estado_aprobacion para comerciales
                    });

                    toast({
                        title: "✅ Comentarios actualizados",
                        description: "Sus comentarios comerciales han sido guardados",
                        variant: "success"
                    });
                }
            }
            // Lógica específica para oficial de cumplimiento
            else if (user?.role === 'oficial_cumplimiento') {
                console.log('🔍 Usuario oficial_cumplimiento detectado, gestionando asignación automática');

                // Si cambió el estado, usar endpoint específico
                // ✅ Validaciones adicionales para evitar cambios innecesarios
                if (stateChanged &&
                    !hasOtherChanges() &&
                    formData.estado_aprobacion &&
                    formData.estado_aprobacion.trim() !== '' &&
                    formData.estado_aprobacion !== originalData?.estado_aprobacion) {

                    console.log('🔄 Ejecutando cambio de estado para oficial_cumplimiento:', formData.estado_aprobacion);

                    const estadoParaBackend = mapearEstadoParaBackend(formData.estado_aprobacion);
                    console.log('🔧 Enviando estado al backend (cumplimiento):', formData.estado_aprobacion, '→', estadoParaBackend);

                    await tercerosDRFService.changeState(id!, {
                        estado: estadoParaBackend as any, // 🔧 Estado mapeado para backend
                        observaciones: formData.observaciones || 'Cambio de estado por oficial cumplimiento'
                        // 🔧 REMOVIDO: rol_asignado ya no es necesario, el backend maneja asignación automática
                    });

                    toast({
                        title: "✅ Estado actualizado",
                        description: `El tercero ha sido marcado como: ${getStateLabel(formData.estado_aprobacion)}`,
                        variant: "success"
                    });
                } else {
                    // Para otros cambios, actualizar observaciones solamente
                    await tercerosDRFService.patchTercero(id!, {
                        observaciones: formData.observaciones
                    });

                    toast({
                        title: "✅ Observaciones actualizadas",
                        description: "Sus comentarios han sido guardados",
                        variant: "success"
                    });
                }

                // 🚫 DESHABILITADO: Asignación automática - ahora se maneja por modal
                // La asignación se realiza a través del UserAssignmentModal, no automáticamente
                console.log('ℹ️ Asignación automática deshabilitada - se usa UserAssignmentModal');
            }
            // Lógica para administradores, procesos y comerciales (con permisos completos)
            else if (['administrador', 'procesos', 'comercial'].includes(user?.role || '')) {
                console.log('🔍 Usuario con permisos completos detectado:', user?.role);
                console.log('🔍 Datos a guardar:', formData);
                console.log('🔍 Estado cambió:', stateChanged);
                console.log('🔍 Otros cambios:', hasOtherChanges());
                console.log('🔍 Estado actual:', formData.estado_aprobacion);

                // Si solo cambió el estado, usar el endpoint específico
                // ✅ Validaciones adicionales para evitar cambios innecesarios
                if (stateChanged &&
                    !hasOtherChanges() &&
                    formData.estado_aprobacion &&
                    formData.estado_aprobacion.trim() !== '' &&
                    formData.estado_aprobacion !== originalData?.estado_aprobacion) {

                    console.log('🔄 Ejecutando cambio de estado para rol privilegiado:', user?.role, formData.estado_aprobacion);

                    // 🆕 LÓGICA ESPECIAL PARA PROCESOS - Usar endpoints específicos de aprobar/rechazar
                    if (user?.role === 'procesos' && (formData.estado_aprobacion === 'aprobado' || formData.estado_aprobacion === 'rechazado')) {
                        if (formData.estado_aprobacion === 'aprobado') {
                            console.log('✅ Procesos - Usando endpoint /aprobar/');
                            await tercerosDRFService.aprobarTercero(id!, 
                                formData.observaciones || 'Aprobado por departamento de procesos'
                            );

                            toast({
                                title: "✅ Tercero aprobado",
                                description: "El tercero ha sido aprobado por el departamento de procesos",
                                variant: "success"
                            });
                        } else if (formData.estado_aprobacion === 'rechazado') {
                            // 🚨 VALIDACIÓN CRÍTICA: Observaciones obligatorias para rechazar
                            if (!formData.observaciones || !formData.observaciones.trim()) {
                                toast({
                                    title: "❌ Error de validación",
                                    description: "Las observaciones son obligatorias para rechazar un tercero",
                                    variant: "destructive"
                                });
                                setSaving(false);
                                return;
                            }

                            console.log('❌ Procesos - Usando endpoint /rechazar/');
                            await tercerosDRFService.rechazarTercero(id!, formData.observaciones);

                            toast({
                                title: "❌ Tercero rechazado",
                                description: "El tercero ha sido rechazado por el departamento de procesos",
                                variant: "destructive"
                            });
                        }
                    } else {
                        // Lógica original para otros casos
                        // 🔧 CORRECCIÓN: Mapear estados legacy a estados válidos
                        const estadosLegacy: Record<string, string> = {
                            'en_curso': 'en_curso_administrador', // Default para estados legacy
                            'asignado': 'asignada_administrador',
                            'asignado_procesos': 'asignada_procesos',
                            'asignado_cumplimiento': 'asignada_oficial_cumplimiento',
                            'asignado_comercial': 'en_curso_comercial'
                        };

                        const estadoOriginalMapeado = estadosLegacy[originalData?.estado_aprobacion || ''] || originalData?.estado_aprobacion;

                        console.log('🗺️ Estado original:', originalData?.estado_aprobacion);
                        console.log('🗺️ Estado original mapeado:', estadoOriginalMapeado);
                        console.log('🗺️ Estado destino:', formData.estado_aprobacion);

                        // Validar que no sea el mismo estado después del mapeo
                        if (formData.estado_aprobacion === estadoOriginalMapeado) {
                            console.log('⚠️ Estados son equivalentes después del mapeo, saltando cambio');
                            toast({
                                title: "ℹ️ Sin cambios",
                                description: "El tercero ya está en el estado seleccionado",
                                variant: "default"
                            });
                            return;
                        }

                        const estadoParaBackend = mapearEstadoParaBackend(formData.estado_aprobacion);
                        console.log('🔧 Enviando estado al backend (cambio general):', formData.estado_aprobacion, '→', estadoParaBackend);

                        await tercerosDRFService.changeState(id!, {
                            estado: estadoParaBackend as any, // 🔧 Estado mapeado para backend
                            observaciones: formData.observaciones || 'Migración de estado legacy a sistema de 13 estados'
                            // 🔧 REMOVIDO: rol_asignado ya no es necesario, el backend maneja asignación automática
                        });

                        toast({
                            title: "✅ Estado actualizado",
                            description: `El tercero ha sido marcado como: ${getStateLabel(formData.estado_aprobacion)}`,
                            variant: "success"
                        });
                    }
                } else {
                    // Actualización completa para admins y procesos
                    const estadoParaBackend = mapearEstadoParaBackend(formData.estado_aprobacion);
                    console.log('🔧 Enviando estado al backend:', formData.estado_aprobacion, '→', estadoParaBackend);

                    await tercerosDRFService.updateTercero(id!, {
                        tipo_documento: formData.tipo_documento,
                        numero_documento: formData.numero_documento,
                        nombres: formData.nombres,
                        apellidos: formData.apellidos,
                        razon_social: formData.razon_social,
                        email: formData.email,
                        telefono: formData.telefono,
                        direccion: formData.direccion,
                        ciudad: formData.ciudad,
                        departamento: formData.departamento,
                        tipo_persona: formData.tipo_persona,
                        estado_aprobacion: estadoParaBackend as any, // 🔧 Estado mapeado para backend
                        observaciones: formData.observaciones
                    });

                    toast({
                        title: "✅ Tercero actualizado",
                        description: "Los cambios se han guardado correctamente",
                        variant: "success"
                    });
                }
            }
            // Para otros roles
            else {
                await tercerosDRFService.patchTercero(id!, {
                    observaciones: formData.observaciones
                });

                toast({
                    title: "✅ Observaciones actualizadas",
                    description: "Sus comentarios han sido guardados",
                    variant: "success"
                });
            }

            navigate(`/terceros/view/${id}`);
        } catch (err) {
            console.error('Error al actualizar tercero:', err);
            toast({
                title: "❌ Error",
                description: err instanceof Error ? err.message : 'Error al guardar los cambios',
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    // Función auxiliar para verificar si hay cambios además del estado
    const hasOtherChanges = () => {
        if (!originalData) return false;

        return (
            formData.tipo_documento !== originalData.tipo_documento ||
            formData.numero_documento !== originalData.numero_documento ||
            formData.nombres !== originalData.nombres ||
            formData.apellidos !== originalData.apellidos ||
            formData.razon_social !== originalData.razon_social ||
            formData.email !== originalData.email ||
            formData.telefono !== originalData.telefono ||
            formData.direccion !== originalData.direccion ||
            formData.ciudad !== originalData.ciudad ||
            formData.departamento !== originalData.departamento ||
            formData.tipo_persona !== originalData.tipo_persona
        );
    };

    // Función auxiliar para verificar si un estado es "aprobado"
    const isApprovedState = (estado: string): boolean => {
        return ['aprobado', 'finalizado'].includes(estado); // 🆕 Nuevos estados aprobados
    };

    // Función auxiliar para verificar si un estado requiere observaciones
    const requiresObservations = (estado: string): boolean => {
        // Usar la misma lógica que esObservacionObligatoria para consistencia
        return esObservacionObligatoria(estado as TerceroData['estado_aprobacion']);
    };

    // 🚀 FUNCIÓN ACTUALIZADA: Labels para 13 estados específicos
    const getStateLabel = (state: string) => {
        switch (state) {
            case 'pendiente': return 'Pendiente';
            case 'en_espera_correccion': return 'En Espera (Corrección)';
            case 'en_curso_comercial': return 'En Curso (Comercial)';
            case 'en_curso_administrador': return 'En Curso (Administrador)';
            case 'en_curso_procesos': return 'En Curso (Procesos)';
            case 'en_curso_cumplimiento': return 'En Curso (Cumplimiento)';
            case 'asignada_administrador': return 'Asignada a Administrador';
            case 'asignada_procesos': return 'Asignada a Procesos';
            case 'asignada_oficial_cumplimiento': return 'Asignada a Oficial de Cumplimiento';
            case 'devuelto_comercial': return 'Devuelto a Comercial';
            case 'aprobado': return 'Aprobado';
            case 'rechazado': return 'Rechazado';
            case 'finalizado': return 'Finalizado';
            // Estados legacy para compatibilidad con datos antiguos
            case 'en_curso': return 'En Curso (Legacy)';
            case 'asignado': return 'Asignado (Legacy)';
            case 'asignado_comercial': return 'Asignado a Comercial (Legacy)';
            case 'asignado_administrador': return 'Asignado a Administrador (Legacy)';
            case 'asignado_procesos': return 'Asignado a Procesos (Legacy)';
            case 'enviado_cumplimiento': return 'Enviado a Cumplimiento (Legacy)';
            default: return `${state} (Sin mapear)`;
        }
    };

    // � FUNCIÓN CORREGIDA: Transiciones exactas según documentación del backend
    // 🆕 HELPER PARA NOMBRES DE ROLES
    const getRolDisplayName = (rol: string): string => {
        const rolesDisplay: Record<string, string> = {
            'comercial': 'Comercial',
            'administrador': 'Administrador',
            'procesos': 'Procesos',
            'oficial_cumplimiento': 'Oficial de Cumplimiento',
            'admin': 'Administrador General',
            'superadmin': 'Super Administrador'
        };

        return rolesDisplay[rol] || rol;
    };

    const getTransicionesPermitidas = (): TerceroData['estado_aprobacion'][] => {
        const estadoActual = formData.estado_aprobacion;
        const rol = user?.role;

        // 🔧 MAPEAR ESTADO ANTES DE PROCESAR (por si viene del backend sin mapear)
        const estadoMapeado = mapearEstadoLegacy(estadoActual);

        console.log('🔍 getTransicionesPermitidas DEBUG - ENTRADA:', {
            estadoActual,
            estadoMapeado,
            rol,
            formDataEstado: formData.estado_aprobacion,
            userCompleto: user
        });

        if (!rol) {
            console.log('❌ No hay rol de usuario, devolviendo array vacío');
            return [];
        }

        // 🆕 SISTEMA DE TRANSICIONES SEGÚN DOCUMENTACIÓN - usar estado mapeado
        switch (rol) {
            case 'comercial':
                console.log('👤 Procesando transiciones para COMERCIAL');
                switch (estadoMapeado) {
                    case 'pendiente':
                        console.log('✅ Estado pendiente → permitir en_curso_comercial');
                        return ['en_curso_comercial'];
                    case 'en_curso_comercial':
                        console.log('✅ Estado en_curso_comercial → permitir asignada_administrador, devuelto_comercial');
                        return ['asignada_administrador', 'devuelto_comercial'];
                    case 'devuelto_comercial':
                        console.log('✅ Estado devuelto_comercial → permitir en_curso_comercial, asignada_administrador');
                        return ['en_curso_comercial', 'asignada_administrador'];
                    // 🆕 Estados legacy que pueden aparecer
                    case 'en_espera_correccion':
                        console.log('✅ Estado legacy en_espera_correccion → permitir en_curso_comercial');
                        return ['en_curso_comercial', 'asignada_administrador'];
                    default:
                        console.log(`❌ Estado '${estadoMapeado}' no tiene transiciones para comercial - devolviendo opciones básicas`);
                        return ['en_curso_comercial', 'asignada_administrador'];
                }

            case 'administrador':
                console.log('👑 Procesando transiciones para ADMINISTRADOR');
                switch (estadoMapeado) {
                    case 'asignada_administrador':
                        console.log('✅ Estado asignada_administrador → permitir en_curso_administrador, asignada_procesos, devuelto_comercial');
                        return ['en_curso_administrador', 'asignada_procesos', 'devuelto_comercial'];
                    case 'en_curso_administrador':
                        console.log('✅ Estado en_curso_administrador → permitir asignada_procesos, devuelto_comercial');
                        return ['asignada_procesos', 'devuelto_comercial'];
                    case 'devuelto_comercial':
                        console.log('✅ Estado devuelto_comercial → administrador puede asignar a cualquier estado');
                        return ['en_curso_administrador', 'asignada_procesos', 'asignada_administrador'];
                    // 🆕 Estados adicionales para administradores
                    case 'pendiente':
                        console.log('✅ Admin puede tomar pendiente → asignada_administrador');
                        return ['asignada_administrador', 'en_curso_administrador'];
                    default:
                        console.log(`❌ Estado '${estadoMapeado}' no tiene transiciones para administrador - devolviendo opciones básicas`);
                        return ['en_curso_administrador', 'asignada_procesos', 'devuelto_comercial'];
                }

            case 'procesos':
                console.log('⚙️ Procesando transiciones para PROCESOS');
                switch (estadoMapeado) {
                    case 'asignada_procesos':
                        console.log('✅ Estado asignada_procesos → permitir en_curso_procesos, asignada_oficial_cumplimiento, devuelto_comercial, aprobado, rechazado');
                        return ['en_curso_procesos', 'asignada_oficial_cumplimiento', 'devuelto_comercial', 'aprobado', 'rechazado'];
                    case 'en_curso_procesos':
                        console.log('✅ Estado en_curso_procesos → permitir asignada_oficial_cumplimiento, devuelto_comercial, aprobado, rechazado');
                        return ['asignada_oficial_cumplimiento', 'devuelto_comercial', 'aprobado', 'rechazado'];
                    default:
                        console.log(`❌ Estado '${estadoMapeado}' no tiene transiciones para procesos - devolviendo opciones básicas incluyendo aprobado/rechazado`);
                        return ['en_curso_procesos', 'asignada_oficial_cumplimiento', 'devuelto_comercial', 'aprobado', 'rechazado'];
                }

            case 'oficial_cumplimiento':
                console.log('📊 Procesando transiciones para OFICIAL_CUMPLIMIENTO');
                switch (estadoMapeado) {
                    case 'asignada_oficial_cumplimiento':
                        console.log('✅ Estado asignada_oficial_cumplimiento → permitir en_curso_cumplimiento, aprobado, rechazado');
                        return ['en_curso_cumplimiento', 'aprobado', 'rechazado'];
                    case 'en_curso_cumplimiento':
                        console.log('✅ Estado en_curso_cumplimiento → permitir aprobado, rechazado');
                        return ['aprobado', 'rechazado'];
                    default:
                        console.log(`❌ Estado '${estadoActual}' no tiene transiciones para oficial_cumplimiento - devolviendo opciones básicas`);
                        return ['en_curso_cumplimiento', 'aprobado', 'rechazado'];
                }

            default:
                console.log(`❌ Rol '${rol}' no reconocido`);
                // 🚧 TEMPORAL: Para debugging, mostrar todos los estados posibles
                console.log('🔧 TEMPORAL: Mostrando todos los estados para debugging');
                const todosLosEstados: TerceroData['estado_aprobacion'][] = [
                    'pendiente', 'en_curso_comercial', 'en_curso_administrador', 'en_curso_procesos',
                    'en_curso_cumplimiento', 'asignada_administrador', 'asignada_procesos',
                    'asignada_oficial_cumplimiento', 'devuelto_comercial', 'aprobado', 'rechazado', 'finalizado'
                ];
                return todosLosEstados.filter(e => e !== estadoMapeado);
        }
    };

    const getDisplayName = (tercero: TerceroData) => {
        if (tercero.tipo_persona === 'natural') {
            return `${tercero.nombres || ''} ${tercero.apellidos || ''}`.trim();
        }
        return tercero.razon_social || 'Sin nombre';
    };

    // 🆕 VALIDACIONES SEGÚN DOCUMENTACIÓN
    const esObservacionObligatoria = (nuevoEstado: TerceroData['estado_aprobacion']): boolean => {
        // Observaciones obligatorias para estos estados según documentación
        const estadosConObservacionObligatoria: TerceroData['estado_aprobacion'][] = [
            'devuelto_comercial',
            'rechazado'
        ];

        return estadosConObservacionObligatoria.includes(nuevoEstado);
    };

    const validarCambioEstado = (nuevoEstado: TerceroData['estado_aprobacion'], observaciones: string): string | null => {
        // Validar observaciones obligatorias para rechazos y devoluciones
        if (esObservacionObligatoria(nuevoEstado)) {
            if (!observaciones || observaciones.trim().length === 0) {
                if (nuevoEstado === 'rechazado') {
                    return `❌ RECHAZO BLOQUEADO: Las observaciones son obligatorias al rechazar un tercero. Por favor, explique el motivo del rechazo.`;
                } else if (nuevoEstado === 'devuelto_comercial') {
                    return `❌ DEVOLUCIÓN BLOQUEADA: Las observaciones son obligatorias al devolver a comercial. Por favor, explique los ajustes necesarios.`;
                }
                return `❌ Las observaciones son obligatorias para el estado "${getStateLabel(nuevoEstado)}".`;
            }
            
            if (observaciones.trim().length < 10) {
                if (nuevoEstado === 'rechazado') {
                    return `❌ RECHAZO BLOQUEADO: Las observaciones deben tener al menos 10 caracteres. Proporcione una explicación detallada del motivo del rechazo.`;
                } else if (nuevoEstado === 'devuelto_comercial') {
                    return `❌ DEVOLUCIÓN BLOQUEADA: Las observaciones deben tener al menos 10 caracteres. Proporcione detalles específicos sobre los ajustes requeridos.`;
                }
                return `❌ Las observaciones deben tener al menos 10 caracteres para "${getStateLabel(nuevoEstado)}".`;
            }
        }

        return null; // Sin errores
    };

    const esEstadoDeAsignacion = (estado: TerceroData['estado_aprobacion']): boolean => {
        const estadosDeAsignacion: TerceroData['estado_aprobacion'][] = [
            'asignada_administrador',
            'asignada_procesos',
            'asignada_oficial_cumplimiento'
        ];

        return estadosDeAsignacion.includes(estado);
    };

    // Funciones auxiliares para verificar estados de asignación
    const tieneComercialAsignado = () => {
        return !!(formData.asignado_a?.nombre_completo || formData.asignado_a_nombre);
    };

    const tieneProcesosAsignado = () => {
        return !!(formData.asignado_a_procesos_nombre || formData.asignado_procesos?.nombre_completo || formData.asignado_procesos_nombre);
    };

    // 🚀 NUEVA FUNCIÓN: Verificar si el tercero ha llegado a la etapa de procesos
    const haLlegadoAProcesos = () => {
        // Solo mostrar información de procesos si está en curso asignado a procesos
        const estadosConProcesos = ['en_curso']; // 🆕 Solo en_curso indica asignación activa
        return estadosConProcesos.includes(formData.estado_aprobacion) && tieneAsignacionRealDeProcesos();
    };

    // 🚀 NUEVA FUNCIÓN: Verificar si realmente hay alguien asignado a procesos
    const tieneAsignacionRealDeProcesos = () => {
        return !!(
            (formData.asignado_a_procesos_nombre && formData.asignado_a_procesos_nombre.trim() !== '') ||
            (formData.asignado_procesos?.nombre_completo && formData.asignado_procesos.nombre_completo.trim() !== '') ||
            (formData.asignado_procesos_nombre && formData.asignado_procesos_nombre.trim() !== '')
        );
    };

    // 🚀 NUEVA FUNCIÓN: Verificar si el tercero ha llegado a la etapa de cumplimiento
    const haLlegadoACumplimiento = () => {
        // Solo mostrar cumplimiento si está específicamente asignado a cumplimiento
        return formData.estado_aprobacion === 'en_curso_cumplimiento' && formData.asignado_cumplimiento;
    };

    // 🚀 NUEVA FUNCIÓN: Verificar si se puede asignar el tercero
    const puedeAsignar = () => {
        const estadosQuePermiteAsignacion = [
            'asignada_administrador',
            'asignada_procesos',
            'asignada_oficial_cumplimiento',
            'devuelto_comercial', // Agregado para permitir asignación desde devuelto_comercial
            'pendiente' // Solo para administradores
        ];

        // Administradores pueden asignar desde cualquier estado válido
        if (user?.role === 'administrador') {
            return estadosQuePermiteAsignacion.includes(formData.estado_aprobacion) ||
                formData.estado_aprobacion === 'pendiente';
        }

        // Otros roles solo pueden asignar si el tercero está en estado de asignación
        return estadosQuePermiteAsignacion.includes(formData.estado_aprobacion);
    };

    // 🚀 NUEVA FUNCIÓN: Mensaje explicativo para botón asignar
    const getMensajeAsignacion = () => {
        if (puedeAsignar()) {
            return "Asignar tercero a usuario específico";
        }

        const estadoActual = formData.estado_aprobacion;

        if (user?.role === 'comercial') {
            if (estadoActual === 'en_curso_comercial') {
                return "Primero cambie el estado a 'Asignada a Administrador' para habilitar asignación";
            }
        }

        return `El tercero debe estar en estado de asignación. Estado actual: ${getStateLabel(estadoActual)}`;
    };

    if (loading) {
        return (
            <AppLayout
                userRole={user?.role || 'procesos'}
                userName={user?.email || 'Usuario'}
                currentPath="/terceros/edit"
                onNavigate={(path) => navigate(path)}
                onLogout={logoutUser}
            >
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="h-8 w-8 animate-spin text-[#0052CC]" />
                    <span className="ml-2 text-lg">Cargando información del tercero...</span>
                </div>
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout
                userRole={user?.role || 'procesos'}
                userName={user?.email || 'Usuario'}
                currentPath="/terceros/edit"
                onNavigate={(path) => navigate(path)}
                onLogout={logoutUser}
            >
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-900">Error al cargar el tercero</h2>
                    <p className="text-gray-600">{error}</p>
                    <Button onClick={() => navigate('/dashboard/comercial')} className="bg-[#0052CC] hover:bg-[#003A8C]">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver al dashboard
                    </Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            userRole={user?.role || 'procesos'}
            userName={user?.email || 'Usuario'}
            currentPath="/terceros/edit"
            onNavigate={(path) => navigate(path)}
            onLogout={logoutUser}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/terceros/view/${id}`)}
                            className="border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Editar Tercero
                            </h1>
                            <p className="text-gray-600">
                                Modificando información de {getDisplayName(formData)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="border-[#FFD700] text-[#F2C200]">
                            {formData.tipo_persona === 'natural' ? 'Persona Natural' : 'Persona Jurídica'}
                        </Badge>
                        <Button
                            onClick={() => setAssignmentModalOpen(true)}
                            variant="outline"
                            className={
                                puedeAsignar()
                                    ? "border-green-500 text-green-600 hover:bg-green-50"
                                    : "border-gray-300 text-gray-400 cursor-not-allowed"
                            }
                            disabled={!puedeAsignar()}
                            title={getMensajeAsignacion()}
                        >
                            <Users className="h-4 w-4 mr-2" />
                            {puedeAsignar() ? 'Asignar' : '🔒 Asignar'}
                        </Button>
                        <Button
                            onClick={() => navigate(`/terceros/view/${id}`)}
                            variant="outline"
                            className="border-[#0052CC] text-[#0052CC] hover:bg-[#0052CC] hover:text-white"
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Información Personal/Empresa */}
                        <Card className="shadow-lg border-[#0052CC] border">
                            <CardHeader>
                                <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                    {formData.tipo_persona === 'natural' ? <User className="h-5 w-5" /> : <Building className="h-5 w-5" />}
                                    Información {formData.tipo_persona === 'natural' ? 'Personal' : 'de la Empresa'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="tipo_documento">Tipo de Documento *</Label>
                                        <Select
                                            value={formData.tipo_documento}
                                            onValueChange={(value) => handleInputChange('tipo_documento', value)}
                                        >
                                            <SelectTrigger className="focus:border-[#0052CC]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                                                <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                                                <SelectItem value="PA">Pasaporte</SelectItem>
                                                <SelectItem value="NIT">NIT</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="numero_documento">Número de Documento *</Label>
                                        <Input
                                            id="numero_documento"
                                            value={formData.numero_documento}
                                            onChange={(e) => handleInputChange('numero_documento', e.target.value)}
                                            className="focus:border-[#0052CC]"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="tipo_persona">Tipo de Persona</Label>
                                        <Select
                                            value={formData.tipo_persona}
                                            onValueChange={(value) => handleInputChange('tipo_persona', value)}
                                        >
                                            <SelectTrigger className="focus:border-[#0052CC]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="natural">Persona Natural</SelectItem>
                                                <SelectItem value="juridica">Persona Jurídica</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div></div> {/* Espacio vacío para mantener el grid */}
                                </div>

                                {formData.tipo_persona === 'natural' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="nombres">Nombres *</Label>
                                            <Input
                                                id="nombres"
                                                value={formData.nombres || ''}
                                                onChange={(e) => handleInputChange('nombres', e.target.value)}
                                                className="focus:border-[#0052CC]"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="apellidos">Apellidos *</Label>
                                            <Input
                                                id="apellidos"
                                                value={formData.apellidos || ''}
                                                onChange={(e) => handleInputChange('apellidos', e.target.value)}
                                                className="focus:border-[#0052CC]"
                                                required
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <Label htmlFor="razon_social">Razón Social *</Label>
                                        <Input
                                            id="razon_social"
                                            value={formData.razon_social || ''}
                                            onChange={(e) => handleInputChange('razon_social', e.target.value)}
                                            className="focus:border-[#0052CC]"
                                            required
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Información de Contacto */}
                        <Card className="shadow-lg border-[#FFD700] border">
                            <CardHeader>
                                <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    Información de Contacto
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="focus:border-[#0052CC]"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="telefono">Teléfono</Label>
                                    <Input
                                        id="telefono"
                                        value={formData.telefono || ''}
                                        onChange={(e) => handleInputChange('telefono', e.target.value)}
                                        className="focus:border-[#0052CC]"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="direccion">Dirección</Label>
                                    <Input
                                        id="direccion"
                                        value={formData.direccion || ''}
                                        onChange={(e) => handleInputChange('direccion', e.target.value)}
                                        className="focus:border-[#0052CC]"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="ciudad">Ciudad</Label>
                                        <Input
                                            id="ciudad"
                                            value={formData.ciudad || ''}
                                            onChange={(e) => handleInputChange('ciudad', e.target.value)}
                                            className="focus:border-[#0052CC]"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="departamento">Departamento</Label>
                                        <Input
                                            id="departamento"
                                            value={formData.departamento || ''}
                                            onChange={(e) => handleInputChange('departamento', e.target.value)}
                                            className="focus:border-[#0052CC]"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 🆕 INFORMACIÓN DE ASIGNACIÓN CENTRALIZADA */}
                    {esEstadoDeAsignacion(formData.estado_aprobacion) && formData.usuario_asignado && (
                        <Card className="shadow-lg border-green-500 border bg-green-50">
                            <CardHeader>
                                <CardTitle className="text-green-700 flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    📋 Asignación Actual
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium text-green-800">Usuario Asignado</Label>
                                        <div className="p-3 bg-white border border-green-200 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span className="font-medium text-green-800">
                                                    {formData.usuario_asignado_nombre || 'Sin nombre'}
                                                </span>
                                            </div>
                                            {formData.usuario_asignado?.email && (
                                                <div className="text-sm text-green-600 mt-1">
                                                    📧 {formData.usuario_asignado.email}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium text-green-800">Rol Asignado</Label>
                                        <div className="p-3 bg-white border border-green-200 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span className="font-medium text-green-800">
                                                    {formData.rol_asignado_display || getRolDisplayName(formData.rol_asignado || '')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {formData.fecha_asignacion_actual && (
                                    <div>
                                        <Label className="text-sm font-medium text-green-800">Fecha de Asignación</Label>
                                        <div className="p-3 bg-white border border-green-200 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span className="text-green-700">
                                                    📅 {new Date(formData.fecha_asignacion_actual).toLocaleDateString('es-ES', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Gestión de Asignaciones */}
                    {(user?.role === 'administrador' || user?.role === 'procesos') && (
                        <Card className="shadow-lg border-[#FF6B35] border">
                            <CardHeader>
                                <CardTitle className="text-[#FF6B35] flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Gestión de Asignaciones
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Alertas de asignación eliminadas - las asignaciones se manejan automáticamente */}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Información del Comercial Asignado - Siempre visible */}
                                    <div>
                                        <Label>Comercial Asignado</Label>
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            {formData.asignado_a?.nombre_completo || formData.asignado_a_nombre ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <span className="font-medium text-blue-800">
                                                        {formData.asignado_a?.nombre_completo || formData.asignado_a_nombre}
                                                    </span>
                                                    {formData.asignado_a?.email && (
                                                        <span className="text-sm text-blue-600">
                                                            ({formData.asignado_a.email})
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                                    <span className="text-gray-600">Sin comercial asignado</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Información del Usuario de Procesos - Solo si está realmente asignado */}
                                    {haLlegadoAProcesos() && tieneAsignacionRealDeProcesos() && (
                                        <div>
                                            <Label>Usuario de Procesos Asignado</Label>
                                            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                    <span className="font-medium text-purple-800">
                                                        {formData.asignado_a_procesos_nombre || formData.asignado_procesos?.nombre_completo || formData.asignado_procesos_nombre}
                                                    </span>
                                                    {(formData.asignado_a_procesos_email || formData.asignado_procesos?.email) && (
                                                        <span className="text-sm text-purple-600">
                                                            ({formData.asignado_a_procesos_email || formData.asignado_procesos?.email})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Historial de Asignaciones - Solo mostrar fechas relevantes según el flujo */}
                                {(formData.fecha_asignacion_comercial || (haLlegadoAProcesos() && formData.fecha_asignacion_procesos)) && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">📅 Historial de Asignaciones</h4>
                                        {formData.fecha_asignacion_comercial && (
                                            <div className="text-sm text-gray-600 mb-1">
                                                <span className="font-medium">Comercial:</span> {
                                                    typeof formData.fecha_asignacion_comercial === 'string'
                                                        ? new Date(formData.fecha_asignacion_comercial).toLocaleDateString('es-ES')
                                                        : 'Fecha no disponible'
                                                }
                                            </div>
                                        )}
                                        {haLlegadoAProcesos() && formData.fecha_asignacion_procesos && (
                                            <div className="text-sm text-gray-600">
                                                <span className="font-medium">Procesos:</span> {
                                                    typeof formData.fecha_asignacion_procesos === 'string'
                                                        ? new Date(formData.fecha_asignacion_procesos).toLocaleDateString('es-ES')
                                                        : 'Fecha no disponible'
                                                }
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Estado del Proceso */}
                    <Card className="shadow-lg border-[#0052CC] border">
                        <CardHeader>
                            <CardTitle className="text-[#0052CC] flex items-center gap-2">
                                <RefreshCw className="h-5 w-5" />
                                Estado del Proceso
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="estado_aprobacion">Estado de Aprobación</Label>
                                    <Select
                                        value={formData.estado_aprobacion}
                                        onValueChange={(value) => handleInputChange('estado_aprobacion', value)}
                                        disabled={
                                            user?.role === 'comercial'
                                                ? !['pendiente', 'asignado_comercial', 'en_espera', 'devuelto_comercial', 'en_curso_comercial', 'en_espera_correccion'].includes(formData.estado_aprobacion)
                                                : false
                                        }
                                    >
                                        <SelectTrigger className="focus:border-[#0052CC]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(() => {
                                                const transiciones = getTransicionesPermitidas();
                                                console.log('🔍 DEBUG DROPDOWN - Transiciones disponibles:', {
                                                    transiciones,
                                                    cantidad: transiciones.length,
                                                    estadoActual: formData.estado_aprobacion,
                                                    rolUsuario: user?.role
                                                });

                                                // Si no hay transiciones, mostrar al menos el estado actual
                                                if (transiciones.length === 0) {
                                                    console.log('⚠️ No hay transiciones disponibles, mostrando estado actual');
                                                    return (
                                                        <SelectItem key={formData.estado_aprobacion} value={formData.estado_aprobacion}>
                                                            {getStateLabel(formData.estado_aprobacion)} (Estado actual)
                                                        </SelectItem>
                                                    );
                                                }

                                                return transiciones.map((estado) => (
                                                    <SelectItem key={estado} value={estado}>
                                                        {getStateLabel(estado)}
                                                    </SelectItem>
                                                ));
                                            })()}
                                        </SelectContent>
                                    </Select>
                                    {user?.role === 'administrador' && (
                                        <p className="text-sm text-purple-600 mt-1">
                                            👑 Flujo: Asignada → En Curso → Enviar a otros departamentos
                                        </p>
                                    )}
                                    {(user?.role === 'procesos' || user?.role === 'comercial') && (
                                        <p className="text-sm text-blue-600 mt-1">
                                            ⚙️ Puede aprobar, rechazar o dejar pendiente
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center">
                                    <Badge
                                        className={
                                            formData.estado_aprobacion === 'pendiente' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                isApprovedState(formData.estado_aprobacion) ? 'bg-green-100 text-green-800 border-green-200' :
                                                    formData.estado_aprobacion === 'rechazado' ? 'bg-red-100 text-red-800 border-red-200' :
                                                        'bg-gray-100 text-gray-800 border-gray-200'
                                        }
                                    >
                                        Estado Actual: {getStateLabel(formData.estado_aprobacion)}
                                    </Badge>
                                </div>
                            </div>

                            {/* Campo de observaciones - obligatorio para rechazar o aprobar */}
                            <div className="mt-4">
                                <Label htmlFor="observaciones" className="flex items-center gap-2">
                                    <span>Observaciones</span>
                                    {requiresObservations(formData.estado_aprobacion) && (
                                        <span className="text-red-500 font-bold">*</span>
                                    )}
                                    {formData.estado_aprobacion === 'rechazado' && (
                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">OBLIGATORIO</span>
                                    )}
                                    {formData.estado_aprobacion === 'devuelto_comercial' && (
                                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">OBLIGATORIO</span>
                                    )}
                                </Label>
                                <Textarea
                                    id="observaciones"
                                    value={formData.observaciones || ''}
                                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                                    placeholder={
                                        formData.estado_aprobacion === 'rechazado'
                                            ? "Especifique los motivos del rechazo (obligatorio)"
                                            : formData.estado_aprobacion === 'aprobado'
                                                ? "Comentarios de aprobación (obligatorio)"
                                                : ['en_curso_comercial', 'en_curso_administrador', 'en_curso_procesos', 'en_curso_cumplimiento'].includes(formData.estado_aprobacion)
                                                    ? "Instrucciones para el equipo asignado"
                                                    : formData.estado_aprobacion === 'devuelto_comercial'
                                                        ? "Observaciones sobre devolución (obligatorio)"
                                                        : formData.estado_aprobacion === 'finalizado'
                                                            ? "Comentarios de finalización (obligatorio)"
                                                            : isApprovedState(formData.estado_aprobacion)
                                                                ? "Comentarios de aprobación (obligatorio)"
                                                                : "Comentarios adicionales sobre el tercero"
                                    }
                                    className={`h-20 focus:border-[#0052CC] ${
                                        requiresObservations(formData.estado_aprobacion) && 
                                        (!formData.observaciones || formData.observaciones.trim() === '')
                                            ? 'border-red-500 bg-red-50'
                                            : requiresObservations(formData.estado_aprobacion) && 
                                              formData.observaciones && 
                                              formData.observaciones.trim().length > 0 && 
                                              formData.observaciones.trim().length < 10
                                                ? 'border-yellow-500 bg-yellow-50'
                                                : requiresObservations(formData.estado_aprobacion) && 
                                                  formData.observaciones && 
                                                  formData.observaciones.trim().length >= 10
                                                    ? 'border-green-500 bg-green-50'
                                                    : ''
                                    }`}
                                />
                                {requiresObservations(formData.estado_aprobacion) &&
                                    (!formData.observaciones || formData.observaciones.trim() === '') && (
                                        <p className="text-sm text-red-600 mt-1 font-medium">
                                            {formData.estado_aprobacion === 'rechazado'
                                                ? "❌ OBLIGATORIO: Explique el motivo del rechazo"
                                                : formData.estado_aprobacion === 'devuelto_comercial'
                                                    ? "❌ OBLIGATORIO: Especifique los ajustes necesarios"
                                                    : "❌ OBLIGATORIO: Las observaciones son requeridas para este estado"
                                            }
                                        </p>
                                    )}
                                {requiresObservations(formData.estado_aprobacion) &&
                                    formData.observaciones && formData.observaciones.trim().length > 0 && formData.observaciones.trim().length < 10 && (
                                        <p className="text-sm text-yellow-600 mt-1 font-medium">
                                            ⚠️ Las observaciones deben tener al menos 10 caracteres ({formData.observaciones.trim().length}/10)
                                        </p>
                                    )}
                                {requiresObservations(formData.estado_aprobacion) &&
                                    formData.observaciones && formData.observaciones.trim().length >= 10 && (
                                        <p className="text-sm text-green-600 mt-1 font-medium">
                                            ✅ Observaciones válidas - Listo para procesar
                                        </p>
                                    )}

                                {/* Mostrar historial completo de observaciones y comentarios */}
                                {(datosAuditoria?.observaciones?.length > 0 || 
                                  datosAuditoria?.notas_internas?.length > 0 ||
                                  formData.observaciones_comercial || 
                                  originalData?.observaciones) && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">📝 Historial Completo de Comentarios</h4>
                                        
                                        {/* Observaciones públicas del endpoint get_comments */}
                                        {datosAuditoria?.observaciones?.length > 0 && (
                                            <div className="space-y-2 mb-3">
                                                <h5 className="text-xs font-medium text-gray-600">💬 Observaciones:</h5>
                                                {datosAuditoria.observaciones
                                                    .sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                                                    .map((obs: any, index: number) => (
                                                    <div key={index} className="p-2 bg-white rounded border-l-2 border-blue-400">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <p className="text-xs text-blue-600 font-medium">
                                                                {obs.rol} - {obs.usuario}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(obs.fecha).toLocaleDateString('es-ES', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>
                                                        </div>
                                                        <p className="text-sm text-gray-700">{obs.texto}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Notas internas (si el usuario tiene permisos) */}
                                        {datosAuditoria?.notas_internas?.length > 0 && (
                                            <div className="space-y-2 mb-3">
                                                <h5 className="text-xs font-medium text-gray-600">🔒 Notas Internas:</h5>
                                                {datosAuditoria.notas_internas
                                                    .sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                                                    .map((nota: any, index: number) => (
                                                    <div key={index} className="p-2 bg-yellow-50 rounded border-l-2 border-yellow-400">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <p className="text-xs text-yellow-600 font-medium">
                                                                🔒 {nota.rol} - {nota.usuario}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(nota.fecha).toLocaleDateString('es-ES', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>
                                                        </div>
                                                        <p className="text-sm text-gray-700">{nota.texto}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Comentarios legacy del formulario actual (fallback) */}
                                        {!datosAuditoria?.observaciones?.length && formData.observaciones_comercial && (
                                            <div className="mb-2 p-2 bg-blue-50 rounded border-l-2 border-blue-400">
                                                <p className="text-xs text-blue-600 font-medium">💼 Comercial (Legacy):</p>
                                                <p className="text-sm text-gray-700">{formData.observaciones_comercial}</p>
                                            </div>
                                        )}
                                        
                                        {!datosAuditoria?.observaciones?.length && originalData?.observaciones && originalData.observaciones !== formData.observaciones && (
                                            <div className="p-2 bg-purple-50 rounded border-l-2 border-purple-400">
                                                <p className="text-xs text-purple-600 font-medium">👑 Administración (Legacy):</p>
                                                <p className="text-sm text-gray-700">{originalData.observaciones}</p>
                                            </div>
                                        )}

                                        {/* Resumen de comentarios */}
                                        {datosAuditoria?.total_comentarios && (
                                            <div className="mt-3 pt-2 border-t text-center">
                                                <p className="text-xs text-gray-500">
                                                    Total: {datosAuditoria.total_comentarios} comentarios
                                                </p>
                                            </div>
                                        )}

                                        {/* Mensaje de carga */}
                                        {loadingAuditoria && (
                                            <div className="text-center py-2">
                                                <p className="text-sm text-gray-500">⏳ Cargando historial completo...</p>
                                            </div>
                                        )}

                                        {/* Mensaje cuando no hay datos */}
                                        {!loadingAuditoria && !datosAuditoria?.observaciones?.length && !datosAuditoria?.notas_internas?.length && (
                                            <p className="text-xs text-gray-500 italic">
                                                💡 No hay comentarios en el historial completo
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 🆕 Sección informativa sobre el flujo de asignación */}
                    {user?.role && ['comercial', 'procesos', 'oficial_cumplimiento'].includes(user.role) && (
                        <Card className="shadow-lg border-l-4 border-l-blue-500 bg-blue-50">
                            <CardHeader>
                                <CardTitle className="text-blue-700 flex items-center gap-2 text-sm">
                                    <Info className="h-4 w-4" />
                                    💡 Flujo de Asignación (Dos Pasos)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 text-sm">
                                    {user?.role === 'comercial' && (
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                                            <div>
                                                <p className="font-medium text-blue-800">Cambiar Estado Primero</p>
                                                <p className="text-blue-600">Para asignar al administrador, primero cambie el estado a "Asignada a Administrador"</p>
                                            </div>
                                        </div>
                                    )}
                                    {user?.role === 'procesos' && (
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                                            <div>
                                                <p className="font-medium text-blue-800">Cambiar Estado Primero</p>
                                                <p className="text-blue-600">Para asignar, primero cambie el estado a "Asignada a Cumplimiento" o "Devuelto a Comercial"</p>
                                            </div>
                                        </div>
                                    )}
                                    {user?.role === 'oficial_cumplimiento' && (
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                                            <div>
                                                <p className="font-medium text-blue-800">Cambiar Estado Primero</p>
                                                <p className="text-blue-600">Para reasignar, primero cambie el estado a "Asignada a Administrador"</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                                        <div>
                                            <p className="font-medium text-green-800">Usar Botón Asignar</p>
                                            <p className="text-green-600">Después del cambio de estado, use el botón "Asignar" para seleccionar el usuario específico</p>
                                        </div>
                                    </div>

                                    <div className="mt-3 p-2 bg-white rounded border-l-4 border-l-yellow-400">
                                        <p className="text-xs text-gray-600">
                                            <strong>Estado actual:</strong> {getStateLabel(formData.estado_aprobacion)}
                                            {puedeAsignar() ?
                                                " ✅ (Listo para asignación)" :
                                                " ⏳ (Requiere cambio de estado primero)"
                                            }
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Botones de acción */}
                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(`/terceros/view/${id}`)}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="submit"
                            disabled={saving}
                            className="bg-[#0052CC] hover:bg-[#003A8C] text-white"
                        >
                            {saving ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {user?.role === 'comercial' && isApprovedState(formData.estado_aprobacion)
                                        ? '✅ Tercero Aprobado'
                                        : 'Guardar Cambios'
                                    }
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>

            {/* 🆕 Modal de Asignación */}
            {assignmentModalOpen && (
                <UserAssignmentModal
                    isOpen={assignmentModalOpen}
                    onClose={() => setAssignmentModalOpen(false)}
                    tercero={{
                        id: formData.id,
                        numero_documento: formData.numero_documento,
                        nombres: formData.nombres,
                        apellidos: formData.apellidos,
                        razon_social: formData.razon_social,
                        tipo_persona: formData.tipo_persona,
                        estado_aprobacion: formData.estado_aprobacion
                    }}
                    onAssignmentSuccess={handleAssignmentSuccess}
                    userRole={user?.role || 'procesos'}
                    limitToRoles={
                        user?.role === 'comercial' ? ['administrador'] :
                            user?.role === 'procesos' ? ['comercial', 'oficial_cumplimiento'] :
                                user?.role === 'oficial_cumplimiento' ? ['administrador'] :
                                    undefined // Administrador puede ver todos los roles
                    }
                />
            )}
        </AppLayout>
    );
}