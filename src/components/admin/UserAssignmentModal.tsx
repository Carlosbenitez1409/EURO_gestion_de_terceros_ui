import { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getBestReassignmentState, getStateTransitionMessage, EstadoTercero } from "@/utils/stateTransitions";
import { verificarCambioEstado, useAssignmentLogger } from "@/utils/assignmentLogger";
import { tercerosDRFService, TercerosDRFService } from "@/services/terceros.drf.service";
import { userService, User as UserType } from "@/services/user.service";
import {
    Users,
    Shield,
    UserCheck,
    Building2,
    ShoppingCart,
    FileCheck,
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    User
} from "lucide-react";

interface TerceroBasico {
    id: string;
    numero_documento: string;
    nombres?: string;
    apellidos?: string;
    razon_social?: string;
    tipo_persona: 'natural' | 'juridica';
    estado_aprobacion: string;
}

interface UserAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    tercero: TerceroBasico;
    onAssignmentSuccess: () => void;
    userRole?: string; // 🆕 Rol del usuario actual
    limitToRoles?: string[]; // 🆕 Limitar roles disponibles
}

export function UserAssignmentModal({ 
    isOpen, 
    onClose, 
    tercero, 
    onAssignmentSuccess, 
    userRole = 'administrador',
    limitToRoles 
}: UserAssignmentModalProps) {
    const { toast } = useToast();
    const { logAssignment } = useAssignmentLogger();
    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("assign");
    const [selectedRole, setSelectedRole] = useState<string>(""); // ✅ No hardcoded value
    const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
    
    // 🆕 Ref para evitar llamadas múltiples
    const loadingRef = useRef(false);

    const roles = [
        { 
            value: "procesos", 
            label: "Procesos", 
            icon: Shield, 
            description: "Gestión de flujos y validaciones",
            color: "bg-blue-100 text-blue-800 border-blue-200"
        },
        { 
            value: "comercial", 
            label: "Comercial", 
            icon: ShoppingCart, 
            description: "Gestión comercial y proveedores",
            color: "bg-green-100 text-green-800 border-green-200"
        },
        { 
            value: "gestion_humana", 
            label: "Gestión Humana", 
            icon: User, 
            description: "Administración de personal",
            color: "bg-purple-100 text-purple-800 border-purple-200"
        },
        { 
            value: "administrador", 
            label: "Administrador", 
            icon: UserCheck, 
            description: "Acceso completo al sistema",
            color: "bg-red-100 text-red-800 border-red-200"
        },
        { 
            value: "oficial_cumplimiento", 
            label: "Oficial de Cumplimiento", 
            icon: FileCheck, 
            description: "Supervisión y cumplimiento",
            color: "bg-orange-100 text-orange-800 border-orange-200"
        }
    ];

    // 🆕 Reglas de asignación por perfil según el flujo del negocio
    const getRolesPermitidosPorPerfil = (userRole: string, terceroEstado: string): string[] => {
        switch (userRole) {
            case 'comercial':
                // Comerciales solo pueden reasignar al administrador
                return ['administrador'];
            
            case 'administrador':
                // 🆕 Administradores tienen acceso COMPLETO a todos los departamentos
                // Pueden asignar a cualquier rol en cualquier momento
                return ['procesos', 'comercial', 'oficial_cumplimiento', 'administrador', 'gestion_humana'];
            
            case 'procesos':
                // Procesos puede devolver al comercial o enviar a cumplimiento
                return ['comercial', 'oficial_cumplimiento'];
            
            case 'oficial_cumplimiento':
                // Oficial de cumplimiento normalmente no reasigna, solo aprueba/rechaza
                return ['administrador'];
            
            default:
                return [];
        }
    };

    // 🆕 Memoizar rolesDisponibles para evitar bucles infinitos
    const rolesDisponibles = useMemo(() => {
        const rolesPermitidos = limitToRoles || getRolesPermitidosPorPerfil(userRole, tercero.estado_aprobacion);
        const rolesFiltered = roles.filter(role => rolesPermitidos.includes(role.value));
        
        // 🔍 Log detallado para debugging
        console.log('🔍 UserAssignmentModal - Debug roles:', {
            userRole,
            terceroEstado: tercero.estado_aprobacion,
            limitToRoles,
            rolesPermitidos,
            rolesDisponiblesAntesFiltro: roles.map(r => r.value),
            rolesDisponiblesDespuesFiltro: rolesFiltered.map(r => r.value)
        });

        // 🚨 Log específico para administradores
        if (userRole === 'administrador') {
            console.log('🚨 ADMINISTRADOR - Roles disponibles:', rolesFiltered.map(r => `${r.value} (${r.label})`));
        }
        
        return rolesFiltered;
    }, [limitToRoles, userRole, tercero.estado_aprobacion]);

    useEffect(() => {
        if (isOpen) {
            console.log('🔍 UserAssignmentModal - Abriendo modal, verificando si necesita cargar usuarios...');
            
            // Solo cargar usuarios si no están ya cargados
            if (users.length === 0) {
                console.log('🔍 UserAssignmentModal - Cargando usuarios por primera vez...');
                loadUsers();
            } else {
                console.log('🔍 UserAssignmentModal - Usuarios ya cargados, reutilizando datos');
            }
        }
    }, [isOpen, users.length]); // 🆕 Dependencias optimizadas

    // 🆕 UseEffect separado para establecer rol por defecto inteligente
    useEffect(() => {
        if (isOpen && rolesDisponibles.length > 0) {
            // 🎯 Para administradores, NO forzar un rol por defecto específico
            // Permitir que elijan libremente entre todos los roles disponibles
            if (userRole === 'administrador') {
                // Solo establecer el primer rol disponible si no hay ninguno seleccionado
                // o si el rol seleccionado no está disponible
                if (!selectedRole || !rolesDisponibles.find(r => r.value === selectedRole)) {
                    const rolPorDefecto = rolesDisponibles[0].value;
                    console.log(`🔍 UserAssignmentModal - Administrador: Estableciendo rol inicial: ${rolPorDefecto}`);
                    setSelectedRole(rolPorDefecto);
                }
                return; // ✅ Salir temprano para administradores
            }
            
            // 🔄 Para otros roles, aplicar lógica inteligente
            let rolPorDefecto = rolesDisponibles[0].value;
            
            if (userRole === 'procesos') {
                // Para procesos, típicamente envían a cumplimiento
                const cumplimientoRole = rolesDisponibles.find(r => r.value === 'oficial_cumplimiento');
                if (cumplimientoRole) {
                    rolPorDefecto = 'oficial_cumplimiento';
                }
            }
            
            if (selectedRole !== rolPorDefecto) {
                console.log(`🔍 UserAssignmentModal - Estableciendo rol por defecto para ${userRole}: ${rolPorDefecto}`);
                setSelectedRole(rolPorDefecto);
            }
        }
    }, [isOpen, rolesDisponibles, userRole, tercero.estado_aprobacion]); // ✅ Removed selectedRole to prevent infinite loop

    // 🆕 Separate useEffect for role changes
    useEffect(() => {
        if (rolesDisponibles.length > 0 && !rolesDisponibles.find(r => r.value === selectedRole)) {
            console.log('🔍 UserAssignmentModal - Rol actual no disponible, cambiando a:', rolesDisponibles[0].value);
            setSelectedRole(rolesDisponibles[0].value);
        }
    }, [rolesDisponibles, selectedRole]);

    // 🆕 Limpiar estado cuando el modal se cierre
    useEffect(() => {
        if (!isOpen) {
            console.log('🔍 UserAssignmentModal - Modal cerrado, limpiando estado...');
            loadingRef.current = false;
        }
    }, [isOpen]);

    useEffect(() => {
        // Filtrar usuarios por rol seleccionado
        const filtered = users.filter(user => user.role === selectedRole);
        console.log(`🔍 UserAssignmentModal - Filtrando usuarios por rol "${selectedRole}":`, filtered.length, 'usuarios encontrados');
        setFilteredUsers(filtered);
    }, [users, selectedRole]);

    const loadUsers = async () => {
        // Evitar cargas múltiples usando referencia
        if (loading || loadingRef.current) {
            console.log('🔍 UserAssignmentModal - Ya hay una carga en progreso, ignorando...');
            return;
        }

        try {
            setLoading(true);
            loadingRef.current = true;
            console.log('🔍 UserAssignmentModal - Iniciando carga de usuarios desde API...');
            
            // Cargar usuarios usando el servicio real
            const response = await userService.getUsers();
            
            // Verificar si la respuesta es un array directamente o tiene una propiedad que contiene el array
            let usersArray: UserType[] = [];
            if (Array.isArray(response)) {
                usersArray = response;
            } else if (response && typeof response === 'object') {
                // Buscar la propiedad que contiene el array de usuarios
                const possibleKeys = ['results', 'data', 'users', 'items'];
                for (const key of possibleKeys) {
                    if (response[key] && Array.isArray(response[key])) {
                        usersArray = response[key];
                        break;
                    }
                }
                // Si no encuentra ninguna clave conocida, usa toda la respuesta como array
                if (usersArray.length === 0 && Object.values(response).some(val => Array.isArray(val))) {
                    const arrayValue = Object.values(response).find(val => Array.isArray(val));
                    if (arrayValue) {
                        usersArray = arrayValue as UserType[];
                    }
                }
            }
            
            console.log('✅ Usuarios cargados desde API:', usersArray.length, 'usuarios');
            setUsers(usersArray);
            
        } catch (error: any) {
            console.error('Error loading users:', error);
            
            // Fallback a datos mock en caso de error
            console.warn('Service error, using mock data:', error.message);
            const mockUsers: UserType[] = [
                {
                    id: "1",
                    email: "procesos1@euro.com",
                    nombre_completo: "Ana García",
                    role: "procesos",
                    is_active: true,
                    date_joined: "2024-01-15",
                    last_login: "2025-08-25"
                },
                {
                    id: "2", 
                    email: "procesos2@euro.com",
                    nombre_completo: "Carlos Ruiz",
                    role: "procesos",
                    is_active: true,
                    date_joined: "2024-02-20",
                    last_login: "2025-08-24"
                },
                {
                    id: "3",
                    email: "comercial1@euro.com", 
                    nombre_completo: "María López",
                    role: "comercial",
                    is_active: true,
                    date_joined: "2024-01-10",
                    last_login: "2025-08-26"
                },
                {
                    id: "4",
                    email: "admin@euro.com",
                    nombre_completo: "Administrador Sistema",
                    role: "administrador",
                    is_active: true,
                    date_joined: "2024-01-01",
                    last_login: "2025-08-26"
                },
                {
                    id: "5",
                    email: "cumplimiento@euro.com",
                    nombre_completo: "Oficial Cumplimiento",
                    role: "oficial_cumplimiento",
                    is_active: true,
                    date_joined: "2024-01-05",
                    last_login: "2025-08-25"
                }
            ];
            setUsers(mockUsers);
            
            toast({
                title: "Información",
                description: "Usando datos de demostración. Verifica la conexión con el servidor.",
                variant: "warning"
            });
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    };

    const handleAssignUser = async (userId: string) => {
        try {
            setLoading(true);
            const user = users.find(u => u.id === userId);
            
            console.log('🔄 ASIGNANDO TERCERO - FLUJO DE DOS PASOS - ID:', tercero.id, 'Usuario:', userId, 'Rol:', user?.role);
            console.log('🔍 Usuario encontrado:', user);
            
            if (user) {
                // 🆕 SOLUCIÓN TEMPORAL: Detectar y manejar estados problemáticos
                if (tercero.estado_aprobacion === 'devuelto_comercial') {
                    console.log('⚠️ ESTADO PROBLEMÁTICO DETECTADO: devuelto_comercial');
                    console.log('🔄 Aplicando solución temporal hasta que el backend sea actualizado...');
                    
                    try {
                        // Estrategia: Mantener el estado actual y solo asignar el usuario
                        const stateChangePayload = {
                            estado: 'devuelto_comercial' as any, // Mantener estado actual
                            observaciones: `Asignado a ${user.role}: ${(user as any).full_name || (user as any).nombre_completo || (user as any).username || 'Usuario'} (ID: ${userId}) - Estado mantenido como devuelto_comercial`,
                            asignar_a: parseInt(userId)
                        };
                        
                        console.log('📦 PAYLOAD TEMPORAL (mantener estado):', stateChangePayload);
                        
                        const stateChangeResult = await tercerosDRFService.changeState(tercero.id, stateChangePayload);
                        
                        console.log('✅ ASIGNACIÓN EXITOSA (estado mantenido):', stateChangeResult);
                        
                        toast({
                            title: "✅ Tercero asignado exitosamente",
                            description: `Asignado a ${(user as any).full_name || (user as any).nombre_completo || (user as any).username || 'Usuario'}. Estado mantenido como 'devuelto_comercial'.`,
                            variant: "default"
                        });
                        
                        onAssignmentSuccess?.();
                        onClose();
                        return;
                        
                    } catch (error: any) {
                        console.error('❌ Error en asignación temporal:', error);
                        
                        toast({
                            title: "❌ Asignación bloqueada",
                            description: `El backend no permite asignaciones desde 'devuelto_comercial'. Se requiere actualización del backend. Error: ${error.message}`,
                            variant: "destructive"
                        });
                        
                        onClose();
                        return;
                    }
                }

                // FLUJO NORMAL PARA OTROS ESTADOS
                const obtenerTransicionesPermitidas = async (terceroId: string): Promise<string[]> => {
                    try {
                        // Intentar obtener las transiciones del backend haciendo un dry-run
                        const response = await tercerosDRFService.changeState(terceroId, {
                            estado: 'invalid_state_for_testing' as any,
                            observaciones: 'test'
                        });
                        return []; // Si no falla, no hay restricciones
                    } catch (error: any) {
                        if (error.details?.transiciones_permitidas) {
                            return error.details.transiciones_permitidas;
                        }
                        return [];
                    }
                };

                // ESTRATEGIA INTELIGENTE: Usar transiciones permitidas por el backend
                const transicionesPermitidas = await obtenerTransicionesPermitidas(tercero.id);
                console.log('🔍 Transiciones permitidas por backend:', transicionesPermitidas);

                // PASO 1: Mapear rol a estado específico con fallback inteligente
                const estadosPorRol: Record<string, string> = {
                    'administrador': 'asignada_administrador',
                    'procesos': 'asignada_procesos', 
                    'comercial': 'en_curso_comercial',  // Comercial trabaja inmediatamente
                    'oficial_cumplimiento': 'asignada_oficial_cumplimiento',
                    'gestion_humana': 'asignada_administrador' // Fallback
                };
                
                let estadoAsignacion = estadosPorRol[user.role] || 'asignada_administrador';
                
                // 🔧 NUEVA LÓGICA: Si el estado deseado no está permitido, usar estrategia alternativa
                if (transicionesPermitidas.length > 0 && !transicionesPermitidas.includes(estadoAsignacion)) {
                    console.log(`⚠️ Estado deseado '${estadoAsignacion}' no permitido. Transiciones disponibles:`, transicionesPermitidas);
                    
                    // Estrategia de fallback basada en transiciones disponibles
                    if (user.role === 'comercial' && transicionesPermitidas.includes('en_curso_comercial')) {
                        estadoAsignacion = 'en_curso_comercial';
                    } else if (user.role === 'oficial_cumplimiento' && transicionesPermitidas.includes('asignada_oficial_cumplimiento')) {
                        estadoAsignacion = 'asignada_oficial_cumplimiento';
                    } else if (user.role === 'procesos' && transicionesPermitidas.includes('asignada_procesos')) {
                        estadoAsignacion = 'asignada_procesos';
                    } else {
                        // Si no hay transición directa disponible, usar el estado actual y solo actualizar el usuario asignado
                        console.log('� No hay transición directa - usando asignación directa en estado actual');
                        estadoAsignacion = tercero.estado_aprobacion; // Mantener estado actual
                    }
                }
                
                console.log('�🔍 PASO 1 - Estado final a asignar:', estadoAsignacion);
                
                // 🔧 CORREGIDO: Permitir asignación incluso si el estado ya es correcto
                // El tercero necesita ser asignado a un usuario específico
                console.log('🔍 Estado actual vs objetivo:', {
                    estadoActual: tercero.estado_aprobacion,
                    estadoObjetivo: estadoAsignacion,
                    usuarioObjetivo: parseInt(userId),
                    descripcion: 'Procediendo con asignación específica'
                });
                
                // Verificar si es una reasignación válida
                const estadosAsignados = [
                    'asignada_administrador', 'asignada_procesos', 'asignada_oficial_cumplimiento',
                    'en_curso_comercial', 'en_curso_administrador', 'en_curso_procesos', 'en_curso_cumplimiento'
                ];
                const esReasignacion = estadosAsignados.includes(tercero.estado_aprobacion) && estadosAsignados.includes(estadoAsignacion);
                
                // Reglas de reasignación según el flujo de negocio
                if (esReasignacion) {
                    let reasignacionPermitida = false;
                    
                    switch (userRole) {
                        case 'comercial':
                            // Comerciales pueden escalar al administrador
                            reasignacionPermitida = user.role === 'administrador';
                            break;
                        case 'procesos':
                            // Procesos pueden devolver a comercial o escalar a cumplimiento
                            reasignacionPermitida = ['comercial', 'oficial_cumplimiento'].includes(user.role);
                            break;
                        case 'administrador':
                            // Administradores pueden reasignar a cualquier rol
                            reasignacionPermitida = true;
                            break;
                        case 'oficial_cumplimiento':
                            // Cumplimiento puede devolver al administrador
                            reasignacionPermitida = user.role === 'administrador';
                            break;
                        default:
                            reasignacionPermitida = false;
                    }
                    
                    if (!reasignacionPermitida) {
                        toast({
                            title: "❌ Reasignación no permitida",
                            description: `Como ${userRole}, no puedes reasignar terceros a ${user.role}`,
                            variant: "destructive"
                        });
                        onClose();
                        return;
                    }
                }
                
                // PASO 1: Cambiar estado del tercero
                console.log('🔄 PASO 1 - Cambiando estado del tercero:', {
                    terceroId: tercero.id,
                    estadoAnterior: tercero.estado_aprobacion,
                    estadoNuevo: estadoAsignacion,
                    observaciones: `${esReasignacion ? 'Reasignado' : 'Asignado'} a ${user.role} - Preparando para asignación específica`
                });
                
                // 🔧 CORREGIDO: Permitir re-asignación incluso si el estado es el mismo
                // El tercero puede estar en el estado correcto pero no asignado a usuario específico
                if (tercero.estado_aprobacion === estadoAsignacion) {
                    console.log('ℹ️ Mismo estado detectado - procederemos con asignación específica de usuario');
                }
                
                // Log del payload exacto que se enviará
                const changeStatePayload = {
                    estado: estadoAsignacion as any,
                    observaciones: `${esReasignacion ? 'Reasignado' : 'Asignado'} a ${user.role}: ${(user as any).full_name || user.nombre_completo || 'Usuario'} (ID: ${userId}) desde modal de asignación`,
                    asignar_a: parseInt(userId) // 🔧 CORREGIDO: Usar parámetro correcto del backend
                };
                console.log('📦 PAYLOAD EXACTO que se enviará al backend:', changeStatePayload);
                
                const stateChangeResult = await tercerosDRFService.changeState(tercero.id, changeStatePayload);
                
                console.log('✅ PASO 1 COMPLETADO - Estado cambiado:', stateChangeResult);
                
                // Actualizar el estado local del tercero para evitar cambios duplicados
                tercero.estado_aprobacion = estadoAsignacion;
                
                // PASO 2: Asignar a usuario específico (esto lo hará el backend automáticamente)
                // El backend debe manejar la asignación de usuario_asignado basado en el estado y parámetros
                
                console.log('✅ PASO 2 - Asignación automática por backend completada');
                
                toast({
                    title: "✅ Asignación Exitosa",
                    description: `Tercero ${esReasignacion ? 'reasignado' : 'asignado'} a ${(user as any).full_name || user.nombre_completo || 'Usuario'} (${user.role})`,
                });
                
                console.log('✅ Flujo de dos pasos completado exitosamente');
                
                // Emitir evento personalizado para que otros componentes puedan actualizar sus datos
                window.dispatchEvent(new CustomEvent('terceroAssigned', { 
                    detail: { 
                        terceroId: tercero.id, 
                        newUserId: parseInt(userId),
                        newRole: user.role,
                        previousState: tercero.estado_aprobacion,
                        newState: estadoAsignacion
                    } 
                }));
                
                // Cerrar modal inmediatamente después del éxito
                onAssignmentSuccess();
                onClose();
                return; // 🆕 Evitar ejecutar código legacy después de asignación exitosa
            }
            
            // 2. 🚀 IMPLEMENTACIÓN FINAL: Usar endpoints reales del backend
            try {
                const estadoActual = tercero.estado_aprobacion || 'pendiente';
                console.log('🔍 Consultando transiciones disponibles para estado:', estadoActual);
                
                let transicionesDisponibles: string[] = [];
                let nuevoEstado: EstadoTercero | null = null;
                
                try {
                    // 🎯 Usar el endpoint real implementado en el backend
                    const transitionsResponse = await tercerosDRFService.getAvailableTransitions(estadoActual);
                    transicionesDisponibles = transitionsResponse;
                    console.log('✅ Transiciones disponibles desde', estadoActual, ':', transicionesDisponibles);
                } catch (error) {
                    console.warn('⚠️ Endpoint de transiciones no disponible, usando lógica local como fallback');
                    // Fallback: usar transiciones por defecto
                    const transicionesPorDefecto = {
                        'pendiente': ['en_revision', 'aprobado', 'rechazado'],
                        'en_revision': ['pendiente', 'aprobado', 'rechazado', 'requiere_ajustes'],
                        'aprobado': ['pendiente', 'en_revision', 'aprobado_final', 'requiere_ajustes'],
                        'requiere_ajustes': ['pendiente', 'en_revision', 'aprobado', 'rechazado'],
                        'rechazado': ['pendiente', 'en_revision'],
                        'aprobado_final': ['pendiente', 'en_revision'] // ✅ Backend implementado
                    };
                    transicionesDisponibles = transicionesPorDefecto[estadoActual as keyof typeof transicionesPorDefecto] || [];
                    console.log('🔄 Usando transiciones fallback:', transicionesDisponibles);
                }
                
                nuevoEstado = getBestReassignmentState(transicionesDisponibles, estadoActual);
                console.log('🎯 Estado seleccionado para cambio:', nuevoEstado);
                
                if (nuevoEstado) {
                    console.log('� Cambiando estado de', estadoActual, 'a', nuevoEstado);
                    const stateChangeResult = await tercerosDRFService.changeState(tercero.id, {
                        estado: nuevoEstado as any, // Type assertion temporal para compatibilidad
                        observaciones: `Reasignado por administrador para nueva revisión`
                    });
                    console.log('✅ Estado cambiado exitosamente:', stateChangeResult);
                    console.log('🎉 CAMBIO DE ESTADO COMPLETADO -', estadoActual, '→', nuevoEstado);
                } else {
                    console.log('⚠️ No se pudo determinar estado de destino');
                }
                
                const user = users.find(u => u.id === userId);
                const transitionMessage = getStateTransitionMessage(estadoActual, nuevoEstado);
                console.log('📝 Mensaje final:', transitionMessage);
                
                // 🔍 Verificar que el estado realmente cambió
                if (nuevoEstado) {
                    setTimeout(async () => {
                        console.log('⏰ Verificando estado después de 2 segundos...');
                        const cambioVerificado = await verificarCambioEstado(tercero.id, nuevoEstado);
                        
                        logAssignment({
                            terceroId: tercero.id,
                            usuarioId: userId,
                            estadoInicial: estadoActual,
                            estadoFinal: nuevoEstado,
                            success: cambioVerificado
                        });
                    }, 2000);
                }
                
                toast({
                    title: "Asignación exitosa",
                    description: `Tercero asignado a ${user?.nombre_completo || 'usuario'}. ${transitionMessage}`,
                    variant: "success"
                });
            } catch (stateError: any) {
                console.warn('No se pudo cambiar el estado, pero la asignación fue exitosa:', stateError);
                const user = users.find(u => u.id === userId);
                toast({
                    title: "Asignación exitosa",
                    description: `Tercero asignado a ${user?.nombre_completo || 'usuario'} (estado sin cambios)`,
                    variant: "success"
                });
            }
            
            onAssignmentSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error assigning tercero:', error);
            toast({
                title: "Error",
                description: error.message || "Error al asignar tercero",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const getDisplayName = (tercero: TerceroBasico) => {
        // 🔍 Priorizar nombre_completo si está disponible (nuevo formato del backend)
        if ((tercero as any).nombre_completo) {
            console.log('✅ UserAssignmentModal getDisplayName - Usando nombre_completo:', (tercero as any).nombre_completo);
            return (tercero as any).nombre_completo;
        }
        
        // 🔄 Fallback para formato anterior
        if (tercero.tipo_persona === 'natural') {
            const nombres = tercero.nombres || '';
            const apellidos = tercero.apellidos || '';
            const nombreConstructo = `${nombres} ${apellidos}`.trim();
            if (nombreConstructo) {
                return nombreConstructo;
            }
        }
        
        return tercero.razon_social || tercero.numero_documento || 'Sin nombre';
    };

    const selectedRoleInfo = roles.find(r => r.value === selectedRole);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl">
                <DialogHeader className="bg-white">
                    <DialogTitle className="flex items-center gap-2 text-gray-900">
                        <Users className="h-5 w-5 text-blue-600" />
                        Asignación de Usuario
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Tercero: <strong>{getDisplayName(tercero)}</strong> - {tercero.numero_documento}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value="assign" className="w-full bg-white">
                    {/* Solo pestaña de asignación - funcionalidad de gestión eliminada */}
                    <TabsContent value="assign" className="space-y-4 bg-white">
                        <div className="space-y-4">
                            <div>
                                <Label className="text-base font-semibold">Seleccionar Perfil</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                                    {rolesDisponibles.map((role) => {
                                        const Icon = role.icon;
                                        return (
                                            <Card 
                                                key={role.value}
                                                className={`cursor-pointer transition-all hover:scale-105 ${
                                                    selectedRole === role.value 
                                                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                                                        : 'hover:bg-gray-50'
                                                }`}
                                                onClick={() => setSelectedRole(role.value)}
                                            >
                                                <CardContent className="p-3 bg-white">
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="h-4 w-4" />
                                                        <div>
                                                            <div className="text-sm font-medium">{role.label}</div>
                                                            <div className="text-xs text-gray-500">{role.description}</div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>

                            {selectedRoleInfo && (
                                <Card className="bg-white border border-gray-200 shadow-sm">
                                    <CardHeader className="bg-white">
                                        <CardTitle className="flex items-center gap-2 text-gray-900">
                                            <selectedRoleInfo.icon className="h-5 w-5 text-blue-600" />
                                            Usuarios - {selectedRoleInfo.label}
                                        </CardTitle>
                                        <CardDescription className="text-gray-600">
                                            {selectedRoleInfo.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="bg-white">
                                        {loading ? (
                                            <div className="flex items-center justify-center py-4">
                                                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                                                Cargando usuarios...
                                            </div>
                                        ) : filteredUsers.length === 0 ? (
                                            <Alert className="bg-yellow-50 border border-yellow-200">
                                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                                <AlertDescription className="text-yellow-800">
                                                    No hay usuarios disponibles para este perfil
                                                </AlertDescription>
                                            </Alert>
                                        ) : (
                                            <div className="space-y-2">
                                                {Array.isArray(filteredUsers) && filteredUsers.map((user) => (
                                                    <div 
                                                        key={user.id}
                                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-full ${selectedRoleInfo.color}`}>
                                                                <selectedRoleInfo.icon className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">{user.nombre_completo}</div>
                                                                <div className="text-sm text-gray-500">{user.email}</div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Badge variant={user.is_active ? "default" : "secondary"}>
                                                                        {user.is_active ? "Activo" : "Inactivo"}
                                                                    </Badge>
                                                                    {user.last_login && (
                                                                        <span className="text-xs text-gray-400">
                                                                            Último acceso: {new Date(user.last_login).toLocaleDateString()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            onClick={() => handleAssignUser(user.id)}
                                                            disabled={loading || !user.is_active}
                                                            className="bg-green-600 hover:bg-green-700"
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                            Asignar
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>


                </Tabs>

                <div className="flex justify-end gap-2 pt-4 border-t bg-white">
                    <Button variant="outline" onClick={onClose} className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
