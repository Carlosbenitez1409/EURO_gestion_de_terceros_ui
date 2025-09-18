// Configuración de roles y permisos del sistema
export type UserRole = 'comercial' | 'procesos' | 'gestion_humana' | 'administrador' | 'oficial_cumplimiento';

// 🆕 ESTADOS EXACTOS SEGÚN BACKEND DJANGO (documentación línea 15-26)
export type TerceroEstado = 'pendiente' | 'en_espera_correccion' | 'en_curso_comercial' | 'en_curso_administrador' | 'en_curso_procesos' | 'en_curso_cumplimiento' | 'asignada_administrador' | 'asignada_procesos' | 'asignada_oficial_cumplimiento' | 'devuelto_comercial' | 'aprobado' | 'rechazado' | 'finalizado';

export interface RoleConfig {
  name: string;
  displayName: string;
  color: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
  permissions: {
    // Terceros
    viewTerceros: boolean;
    createTerceros: boolean;
    editTerceros: boolean;
    approveTerceros: boolean;
    rejectTerceros: boolean;
    assignTerceros: boolean;
    
    // Estados específicos que pueden manejar
    canManageStates: string[];
    
    // Vistas específicas
    dashboardAccess: boolean;
    consolidatedView: boolean;
    employeeRegistration: boolean;
    
    // Documentos
    viewDocuments: boolean;
    uploadDocuments: boolean;
    validateDocuments: boolean;
  };
  workflows: {
    // Estados que este rol puede ver
    visibleStates: string[];
    // Estados que puede aprobar/cambiar
    manageableStates: string[];
    // Siguiente estado al aprobar
    approvalNextState: string;
    // Estado al rechazar
    rejectionState: string;
  };
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  comercial: {
    name: 'comercial',
    displayName: 'Comercial',
    color: {
      primary: '#0052CC',     // Azul EURO
      secondary: '#E3F2FD',  // Azul claro
      accent: '#FFD700',     // Dorado EURO
      text: '#FFFFFF'
    },
    permissions: {
      viewTerceros: true,
      createTerceros: false,  // Solo ven los que les fueron asignados
      editTerceros: false,
      approveTerceros: true,  // Pueden escalar a administrador
      rejectTerceros: true,   // Pueden devolver a tercero
      assignTerceros: false,  // No asignan, solo escalan
      canManageStates: ['pendiente', 'en_curso_comercial'], // Solo puede trabajar con terceros asignados a él
      dashboardAccess: true,
      consolidatedView: true,
      employeeRegistration: false,
      viewDocuments: true,
      uploadDocuments: false,
      validateDocuments: true
    },
    workflows: {
      visibleStates: ['pendiente', 'en_curso_comercial', 'en_espera_correccion', 'asignada_administrador'], // Solo ve sus asignados
      manageableStates: ['pendiente', 'en_curso_comercial'], // Solo puede cambiar terceros asignados a él
      approvalNextState: 'asignada_administrador', // Escala al administrador
      rejectionState: 'en_espera_correccion'    // Devuelve al tercero para corrección
    }
  },

  procesos: {
    name: 'procesos',
    displayName: 'Procesos',
    color: {
      primary: '#28A745',     // Verde para procesos
      secondary: '#E8F5E8',  // Verde claro
      accent: '#FFD700',     // Dorado EURO
      text: '#FFFFFF'
    },
    permissions: {
      viewTerceros: true,
      createTerceros: true,
      editTerceros: true,
      approveTerceros: true,
      rejectTerceros: true,
      assignTerceros: false,   // No puede asignar directamente, solo cambiar estados
      canManageStates: ['en_curso_procesos'], // Solo puede trabajar con terceros asignados a él
      dashboardAccess: true,
      consolidatedView: true,
      employeeRegistration: true,
      viewDocuments: true,
      uploadDocuments: true,
      validateDocuments: true
    },
    workflows: {
      visibleStates: ['en_curso_procesos', 'asignada_oficial_cumplimiento', 'devuelto_comercial', 'finalizado'], // Ve sus asignados
      manageableStates: ['en_curso_procesos'], // Solo puede cambiar terceros asignados a él
      approvalNextState: 'asignada_oficial_cumplimiento', // Puede asignar a cumplimiento
      rejectionState: 'devuelto_comercial'     // Devuelve al comercial
    }
  },

  gestion_humana: {
    name: 'gestion_humana',
    displayName: 'Gestión Humana',
    color: {
      primary: '#6F42C1',     // Púrpura para RRHH
      secondary: '#F3E8FF',  // Púrpura claro
      accent: '#FFD700',     // Dorado EURO
      text: '#FFFFFF'
    },
    permissions: {
      viewTerceros: true,     // Solo empleados
      createTerceros: true,   // Solo empleados
      editTerceros: true,     // Solo empleados
      approveTerceros: false,
      rejectTerceros: false,
      assignTerceros: false,
      canManageStates: [],
      dashboardAccess: true,
      consolidatedView: false,
      employeeRegistration: true,
      viewDocuments: true,
      uploadDocuments: true,
      validateDocuments: false
    },
    workflows: {
      visibleStates: ['pendiente', 'aprobado', 'rechazado'],
      manageableStates: [],
      approvalNextState: '',
      rejectionState: ''
    }
  },

  administrador: {
    name: 'administrador',
    displayName: 'Administrador',
    color: {
      primary: '#007BFF',     // Azul para administración
      secondary: '#E3F2FD',  // Azul claro
      accent: '#FFD700',     // Dorado EURO
      text: '#FFFFFF'
    },
    permissions: {
      viewTerceros: true,     // Ve TODOS los terceros
      createTerceros: false,
      editTerceros: false,
      approveTerceros: false,
      rejectTerceros: false,
      assignTerceros: true,   // Principal función: asignar a cualquier usuario
      canManageStates: ['pendiente', 'en_espera', 'en_curso', 'devuelto', 'aprobado', 'rechazado', 'finalizado'], // 🆕 Todos los estados
      dashboardAccess: true,
      consolidatedView: true,
      employeeRegistration: false,
      viewDocuments: true,
      uploadDocuments: false,
      validateDocuments: false
    },
    workflows: {
      visibleStates: [
        'pendiente', 'en_espera_correccion', 'en_curso_comercial', 'en_curso_administrador', 
        'en_curso_procesos', 'en_curso_cumplimiento', 'asignada_administrador', 
        'asignada_procesos', 'asignada_oficial_cumplimiento', 'devuelto_comercial', 
        'aprobado', 'rechazado', 'finalizado'
      ], // Ve todos los estados
      manageableStates: [
        'pendiente', 'en_espera_correccion', 'en_curso_comercial', 'en_curso_administrador', 
        'en_curso_procesos', 'en_curso_cumplimiento', 'asignada_administrador', 
        'asignada_procesos', 'asignada_oficial_cumplimiento', 'devuelto_comercial', 
        'aprobado', 'rechazado', 'finalizado'
      ], // Puede cambiar todos los estados
      approvalNextState: 'asignada_procesos', // Flujo típico de administrador
      rejectionState: 'rechazado'
    }
  },

  oficial_cumplimiento: {
    name: 'oficial_cumplimiento',
    displayName: 'Oficial de Cumplimiento',
    color: {
      primary: '#6A0DAD',     // Púrpura para cumplimiento
      secondary: '#F3E8FF',  // Púrpura claro
      accent: '#FFD700',     // Dorado EURO
      text: '#FFFFFF'
    },
    permissions: {
      viewTerceros: true,     // Solo los que le fueron asignados
      createTerceros: false,
      editTerceros: false,
      approveTerceros: true,  // Aprobación final
      rejectTerceros: true,
      assignTerceros: false,
      canManageStates: ['en_curso_cumplimiento'], // Solo maneja terceros asignados a él
      dashboardAccess: true,
      consolidatedView: true,
      employeeRegistration: false,
      viewDocuments: true,
      uploadDocuments: false,
      validateDocuments: true
    },
    workflows: {
      visibleStates: ['en_curso_cumplimiento', 'aprobado', 'rechazado'], // Ve sus asignados y resultados finales
      manageableStates: ['en_curso_cumplimiento'], // Solo puede cambiar terceros asignados a él
      approvalNextState: 'aprobado', // Aprobación final
      rejectionState: 'rechazado'    // Rechazo definitivo
    }
  }
};

// 🚀 NUEVO SISTEMA DE ESTADOS ESPECÍFICOS (13 ESTADOS ALINEADOS CON BACKEND)
export const TERCERO_STATES = {
  PENDIENTE: 'pendiente',
  EN_ESPERA_CORRECCION: 'en_espera_correccion',
  EN_CURSO_COMERCIAL: 'en_curso_comercial',
  EN_CURSO_ADMINISTRADOR: 'en_curso_administrador',
  EN_CURSO_PROCESOS: 'en_curso_procesos',
  EN_CURSO_CUMPLIMIENTO: 'en_curso_cumplimiento',
  ASIGNADA_ADMINISTRADOR: 'asignada_administrador',
  ASIGNADA_PROCESOS: 'asignada_procesos',
  ASIGNADA_OFICIAL_CUMPLIMIENTO: 'asignada_oficial_cumplimiento',
  DEVUELTO_COMERCIAL: 'devuelto_comercial',
  APROBADO: 'aprobado',
  RECHAZADO: 'rechazado',
  FINALIZADO: 'finalizado'
} as const;

export const STATE_LABELS = {
  [TERCERO_STATES.PENDIENTE]: 'Pendiente',
  [TERCERO_STATES.EN_ESPERA_CORRECCION]: 'En Espera (Corrección)',
  [TERCERO_STATES.EN_CURSO_COMERCIAL]: 'En Curso (Comercial)',
  [TERCERO_STATES.EN_CURSO_ADMINISTRADOR]: 'En Curso (Administrador)',
  [TERCERO_STATES.EN_CURSO_PROCESOS]: 'En Curso (Procesos)',
  [TERCERO_STATES.EN_CURSO_CUMPLIMIENTO]: 'En Curso (Cumplimiento)',
  [TERCERO_STATES.ASIGNADA_ADMINISTRADOR]: 'Asignada a Administrador',
  [TERCERO_STATES.ASIGNADA_PROCESOS]: 'Asignada a Procesos',
  [TERCERO_STATES.ASIGNADA_OFICIAL_CUMPLIMIENTO]: 'Asignada a Oficial de Cumplimiento',
  [TERCERO_STATES.DEVUELTO_COMERCIAL]: 'Devuelto a Comercial',
  [TERCERO_STATES.APROBADO]: 'Aprobado',
  [TERCERO_STATES.RECHAZADO]: 'Rechazado',
  [TERCERO_STATES.FINALIZADO]: 'Finalizado'
};

export const STATE_COLORS = {
  [TERCERO_STATES.PENDIENTE]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [TERCERO_STATES.EN_ESPERA_CORRECCION]: 'bg-orange-100 text-orange-800 border-orange-200',
  [TERCERO_STATES.EN_CURSO_COMERCIAL]: 'bg-blue-100 text-blue-800 border-blue-200',
  [TERCERO_STATES.EN_CURSO_ADMINISTRADOR]: 'bg-purple-100 text-purple-800 border-purple-200',
  [TERCERO_STATES.EN_CURSO_PROCESOS]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  [TERCERO_STATES.EN_CURSO_CUMPLIMIENTO]: 'bg-violet-100 text-violet-800 border-violet-200',
  [TERCERO_STATES.ASIGNADA_ADMINISTRADOR]: 'bg-purple-50 text-purple-700 border-purple-100',
  [TERCERO_STATES.ASIGNADA_PROCESOS]: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  [TERCERO_STATES.ASIGNADA_OFICIAL_CUMPLIMIENTO]: 'bg-violet-50 text-violet-700 border-violet-100',
  [TERCERO_STATES.DEVUELTO_COMERCIAL]: 'bg-red-100 text-red-800 border-red-200',
  [TERCERO_STATES.APROBADO]: 'bg-green-100 text-green-800 border-green-200',
  [TERCERO_STATES.RECHAZADO]: 'bg-red-100 text-red-800 border-red-200',
  [TERCERO_STATES.FINALIZADO]: 'bg-gray-500 text-white border-gray-500'
};

// Utilidades
export function getRoleConfig(role: string): RoleConfig {
  return ROLE_CONFIGS[role as UserRole] || ROLE_CONFIGS.comercial;
}

export function canUserManageState(userRole: string, state: string): boolean {
  const config = getRoleConfig(userRole);
  return config.workflows.manageableStates.includes(state);
}

export function getNextStateAfterApproval(userRole: string): string {
  const config = getRoleConfig(userRole);
  return config.workflows.approvalNextState;
}

export function getStateAfterRejection(userRole: string): string {
  const config = getRoleConfig(userRole);
  return config.workflows.rejectionState;
}

export function filterTercerosByRole(terceros: any[], userRole: string): any[] {
  const config = getRoleConfig(userRole);
  
  if (userRole === 'gestion_humana') {
    // RRHH solo ve empleados (tipo_persona: 'natural')
    return terceros.filter(t => t.tipo_persona === 'natural');
  }
  
  if (userRole === 'comercial') {
    // Comercial ve solo los que están en estados que puede manejar
    return terceros.filter(t => config.workflows.visibleStates.includes(t.estado_aprobacion));
  }
  
  // Procesos ve todo
  return terceros;
}
