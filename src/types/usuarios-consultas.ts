// ======================================================================
// TIPOS TYPESCRIPT PARA SISTEMA DE USUARIOS Y CONSULTAS
// ======================================================================

export enum EstadoSolicitud {
  CREADA = 'creada',
  ASIGNADA_ADMINISTRADOR = 'asignada_administrador',
  EN_REVISION_ADMINISTRADOR = 'en_revision_administrador',
  ASIGNADA_PROCESOS = 'asignada_procesos',
  EN_REVISION_PROCESOS = 'en_revision_procesos',
  DEVUELTA_GH = 'devuelta_gh',
  FINALIZADA = 'finalizada'
}

export enum TipoDocumento {
  CC = 'CC',
  CE = 'CE',
  PASAPORTE = 'PASAPORTE',
  NIT = 'NIT',
  OTRO = 'OTRO'
}

export enum Riesgo {
  SIN_ANTECEDENTES = 'sin_antecedentes',
  BAJO = 'bajo',
  MEDIO = 'medio',
  ALTO = 'alto'
}

export enum RolUsuario {
  GESTION_HUMANA = 'gestion_humana',
  ADMINISTRADOR = 'administrador',
  PROCESOS = 'procesos'
}

export interface Persona {
  id: string;
  orden?: number;
  nombresApellidos: string;
  numeroDocumento: string;
  tipoDocumento: TipoDocumento;
  antecedentes?: string;
  observaciones?: string;
  riesgo?: Riesgo;
}

export interface CambioHistorial {
  id: string;
  usuario: string;
  rol: RolUsuario;
  accion: string;
  descripcion?: string;
  fechaCambio: string;
  estadoAnterior?: EstadoSolicitud;
  estadoNuevo?: EstadoSolicitud;
}

export interface Solicitud {
  id: string;
  estado: EstadoSolicitud;
  personas: Persona[];
  creadaPor: {
    id: string;
    nombre: string;
    email: string;
    rol: RolUsuario;
  };
  asignadaA?: {
    id: string;
    nombre: string;
    email: string;
    rol: RolUsuario;
  };
  fechaCreacion: string;
  fechaUltimaActualizacion: string;
  historialCambios: CambioHistorial[];
  observacionesGenerales?: string;
  // Campos de permisos calculados por el backend
  puedeTomarRevision?: boolean;
  puedeEditar?: boolean;
  puedeCambiarEstado?: boolean;
}

export interface SolicitudCreateRequest {
  personas: {
    orden: number;
    nombres_apellidos: string;
    numero_documento: string;
    tipo_documento: TipoDocumento;
    observaciones?: string;
  }[];
  observaciones_generales?: string;
}

export interface SolicitudUpdateRequest {
  personas?: Persona[];
  estado?: EstadoSolicitud;
  asignadaA?: string;
  observacionesGenerales?: string;
  motivoDevolucion?: string;
}

export interface FiltrosSolicitud {
  estado?: EstadoSolicitud[];
  fechaDesde?: string;
  fechaHasta?: string;
  creadaPor?: string;
  asignadaA?: string;
  riesgo?: Riesgo[];
}

// Mapeo de estados por rol para el frontend
export const ESTADOS_POR_ROL = {
  [RolUsuario.GESTION_HUMANA]: [
    EstadoSolicitud.CREADA,
    EstadoSolicitud.ASIGNADA_ADMINISTRADOR,
    EstadoSolicitud.DEVUELTA_GH,
    EstadoSolicitud.FINALIZADA
  ],
  [RolUsuario.ADMINISTRADOR]: [
    EstadoSolicitud.ASIGNADA_ADMINISTRADOR,
    EstadoSolicitud.EN_REVISION_ADMINISTRADOR,
    EstadoSolicitud.ASIGNADA_PROCESOS,
    EstadoSolicitud.DEVUELTA_GH,
    EstadoSolicitud.FINALIZADA
  ],
  [RolUsuario.PROCESOS]: [
    EstadoSolicitud.ASIGNADA_PROCESOS,
    EstadoSolicitud.EN_REVISION_PROCESOS,
    EstadoSolicitud.DEVUELTA_GH,
    EstadoSolicitud.FINALIZADA
  ]
};

// Acciones permitidas por rol y estado
export const ACCIONES_PERMITIDAS = {
  [RolUsuario.GESTION_HUMANA]: {
    [EstadoSolicitud.CREADA]: ['asignar_administrador', 'editar'],
    [EstadoSolicitud.DEVUELTA_GH]: ['asignar_administrador', 'editar']
  },
  [RolUsuario.ADMINISTRADOR]: {
    [EstadoSolicitud.ASIGNADA_ADMINISTRADOR]: ['iniciar_revision', 'devolver_gh', 'asignar_procesos'],
    [EstadoSolicitud.EN_REVISION_ADMINISTRADOR]: ['devolver_gh', 'finalizar', 'editar_antecedentes', 'asignar_riesgo', 'consultar_stradata']
  },
  [RolUsuario.PROCESOS]: {
    [EstadoSolicitud.ASIGNADA_PROCESOS]: ['iniciar_revision', 'devolver_gh'],
    [EstadoSolicitud.EN_REVISION_PROCESOS]: ['devolver_gh', 'finalizar', 'editar_antecedentes', 'asignar_riesgo', 'consultar_stradata']
  }
};

// Labels para mostrar en la UI
export const ESTADO_LABELS = {
  [EstadoSolicitud.CREADA]: 'Creada',
  [EstadoSolicitud.ASIGNADA_ADMINISTRADOR]: 'Asignada a Administrador',
  [EstadoSolicitud.EN_REVISION_ADMINISTRADOR]: 'En Revisión por Administrador',
  [EstadoSolicitud.ASIGNADA_PROCESOS]: 'Asignada a Procesos',
  [EstadoSolicitud.EN_REVISION_PROCESOS]: 'En Revisión por Procesos',
  [EstadoSolicitud.DEVUELTA_GH]: 'Devuelta a GH',
  [EstadoSolicitud.FINALIZADA]: 'Finalizada'
};

export const RIESGO_LABELS = {
  [Riesgo.SIN_ANTECEDENTES]: 'Sin Antecedentes',
  [Riesgo.BAJO]: 'Riesgo Bajo',
  [Riesgo.MEDIO]: 'Riesgo Medio',
  [Riesgo.ALTO]: 'Riesgo Alto'
};

export const RIESGO_COLORS = {
  [Riesgo.SIN_ANTECEDENTES]: 'bg-green-100 text-green-800 border-green-200',
  [Riesgo.BAJO]: 'bg-blue-100 text-blue-800 border-blue-200',
  [Riesgo.MEDIO]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [Riesgo.ALTO]: 'bg-red-100 text-red-800 border-red-200'
};

export const ESTADO_COLORS = {
  [EstadoSolicitud.CREADA]: 'bg-blue-100 text-blue-800',
  [EstadoSolicitud.ASIGNADA_ADMINISTRADOR]: 'bg-purple-100 text-purple-800',
  [EstadoSolicitud.EN_REVISION_ADMINISTRADOR]: 'bg-orange-100 text-orange-800',
  [EstadoSolicitud.ASIGNADA_PROCESOS]: 'bg-indigo-100 text-indigo-800',
  [EstadoSolicitud.EN_REVISION_PROCESOS]: 'bg-pink-100 text-pink-800',
  [EstadoSolicitud.DEVUELTA_GH]: 'bg-yellow-100 text-yellow-800',
  [EstadoSolicitud.FINALIZADA]: 'bg-green-100 text-green-800'
};