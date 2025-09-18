// types/terceros.types.ts

// 🎯 ENUMS DE ESTADOS Y ROLES (basados en tu backend Django real)

export enum EstadoTercero {
  // Estados según documentación del backend - 13 estados limpios
  PENDIENTE = 'pendiente',
  EN_ESPERA_CORRECCION = 'en_espera_correccion',
  EN_CURSO_COMERCIAL = 'en_curso_comercial',
  EN_CURSO_ADMINISTRADOR = 'en_curso_administrador',
  EN_CURSO_PROCESOS = 'en_curso_procesos',
  EN_CURSO_CUMPLIMIENTO = 'en_curso_cumplimiento',
  ASIGNADA_ADMINISTRADOR = 'asignada_administrador',
  ASIGNADA_PROCESOS = 'asignada_procesos',
  ASIGNADA_OFICIAL_CUMPLIMIENTO = 'asignada_oficial_cumplimiento',
  DEVUELTO_COMERCIAL = 'devuelto_comercial',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
  FINALIZADO = 'finalizado'
}

export enum RolUsuario {
  COMERCIAL = 'comercial',
  ADMINISTRADOR = 'administrador',
  PROCESOS = 'procesos',
  OFICIAL_CUMPLIMIENTO = 'oficial_cumplimiento'
}

// 📄 INTERFACES DE RESPUESTA

export interface TerceroResponse {
  id: string;
  
  // Información básica (coincide con TerceroDRF del servicio)
  nit: string;
  razon_social: string;
  tipo_tercero: string;
  
  // Información de contacto
  email: string;
  telefono: string;
  ciudad: string;
  direccion?: string;
  departamento?: string;
  pais?: string;
  
  // Estado del workflow
  estado_aprobacion: EstadoTercero | string;
  
  // 🆕 CAMPOS CENTRALIZADOS DE ASIGNACIÓN (del backend actualizado)
  usuario_asignado?: string;
  usuario_asignado_nombre?: string;
  rol_asignado?: RolUsuario | string;
  rol_asignado_display?: string;
  fecha_asignacion_actual?: string;
  
  // Fechas
  fecha_creacion: string;
  fecha_actualizacion?: string;
  
  // Información adicional
  documentos_pendientes?: number;
  ultima_observacion?: string;
  
  // Campos legacy de asignación (para compatibilidad con frontend existente)
  asignado_comercial?: string;
  asignado_comercial_nombre?: string;
  asignado_procesos?: string;
  asignado_procesos_nombre?: string;
  asignado_administrador?: string;
  asignado_administrador_nombre?: string;
  asignado_oficial_cumplimiento?: string;
  asignado_oficial_cumplimiento_nombre?: string;
  
  // Información adicional
  nombre_comercial?: string;
  numero_documento?: string;
  tiene_observaciones?: boolean;
  usuario_creador?: string;
  usuario_creador_nombre?: string;
}

// 📋 INTERFACES PARA CAMBIO DE ESTADO

export interface CambiarEstadoRequest {
  estado: EstadoTercero | string;
  observaciones: string;
  asignar_a?: string; // ID del usuario a asignar
}

export interface CambiarEstadoResponse {
  success: boolean;
  message: string;
  tercero: TerceroResponse;
  estado_anterior: string;
  estado_nuevo: string;
  historial_id?: string;
}

// 📊 INTERFACES PARA ESTADÍSTICAS

export interface EstadisticasWorkflow {
  por_estado: Record<string, number>;
  por_rol: Record<string, number>;
  total_terceros: number;
  terceros_pendientes: number;
}

export interface TransicionesPermitidas {
  transiciones_permitidas: string[];
  rol_usuario: string;
  estado_actual: string;
}

// 📜 INTERFACES PARA HISTORIAL

export interface HistorialCambio {
  id: string;
  estado_anterior: string;
  estado_nuevo: string;
  usuario: string;
  usuario_nombre: string;
  fecha: string;
  observaciones: string;
  asignado_a?: string;
  asignado_a_nombre?: string;
}

// 🔍 INTERFACES PARA FILTROS Y PAGINACIÓN

export interface FiltrosTerceros {
  estado?: EstadoTercero | string;
  usuario_asignado?: string;
  rol_asignado?: RolUsuario | string;
  search?: string;
  tipo_tercero?: string;
  ciudad?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

// 👤 INTERFACES PARA USUARIOS

export interface Usuario {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: RolUsuario;
  is_active: boolean;
  departamento?: string;
}

// 📁 INTERFACES PARA DOCUMENTOS

export interface DocumentoTercero {
  id: string;
  tipo_documento: string;
  archivo: string;
  archivo_url: string;
  fecha_subida: string;
  es_requerido: boolean;
  estado_revision?: string;
}

// 🔔 INTERFACES PARA NOTIFICACIONES

export interface NotificacionTercero {
  id: string;
  tipo: 'estado_cambiado' | 'asignacion' | 'documento_subido' | 'comentario';
  titulo: string;
  mensaje: string;
  tercero: string;
  tercero_razon_social: string;
  usuario_destinatario: string;
  leida: boolean;
  fecha_creacion: string;
}

// 🏷️ TIPOS AUXILIARES

export type EstadoTerceroKey = keyof typeof EstadoTercero;
export type RolUsuarioKey = keyof typeof RolUsuario;

// 🎨 INTERFACES PARA CONFIGURACIÓN UI

export interface EstadoConfig {
  label: string;
  descripcion: string;
  color: string;
  bgColor: string;
  textColor: string;
  buttonColor?: string;
  icon: string;
  es_final: boolean;
  requiere_asignacion?: boolean;
  rol_asignado?: RolUsuario;
  rol_asignado_display?: string;
  actionLabel?: string;
}

export interface WorkflowConfig {
  [key: string]: EstadoConfig;
}
