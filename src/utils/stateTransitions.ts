/**
 * Utilidades para manejar transiciones de estado de terceros (ACTUALIZADO)
 */

export type EstadoTercero = 'pendiente' | 'en_espera_correccion' | 'en_curso_comercial' | 'en_curso_administrador' | 'en_curso_procesos' | 'en_curso_cumplimiento' | 'asignada_administrador' | 'asignada_procesos' | 'asignada_oficial_cumplimiento' | 'devuelto_comercial' | 'aprobado' | 'rechazado' | 'finalizado'; // 🆕 13 ESTADOS ESPECÍFICOS

/**
 * Determina el mejor estado para reasignación basado en transiciones disponibles
 */
export const getBestReassignmentState = (
  availableTransitions: string[] | Record<string, any>, 
  currentState: string
): EstadoTercero | null => {
  
  // Convertir objeto a array si es necesario
  let transitionsArray: string[] = [];
  
  if (Array.isArray(availableTransitions)) {
    transitionsArray = availableTransitions;

  } else if (typeof availableTransitions === 'object' && availableTransitions !== null) {
    // Si el backend devuelve un objeto con las transiciones como keys
    transitionsArray = Object.keys(availableTransitions);

  }
  
  // Orden de preferencia para reasignación (13 ESTADOS ESPECÍFICOS)
  const preferenceOrder: EstadoTercero[] = [
    'pendiente',
    'en_espera_correccion',
    'en_curso_comercial',
    'en_curso_administrador',
    'en_curso_procesos',
    'en_curso_cumplimiento',
    'asignada_administrador',
    'asignada_procesos',
    'asignada_oficial_cumplimiento',
    'devuelto_comercial',
    'aprobado',
    'rechazado'
  ];
  

  
  for (const state of preferenceOrder) {

    if (transitionsArray.includes(state)) {

      return state;
    }
  }
  
  console.warn(`⚠️ No se encontró un estado válido para reasignación desde: ${currentState}`, {
    availableTransitions: transitionsArray,
    preferenceOrder
  });
  
  return null;
};

/**
 * Obtiene un mensaje descriptivo para la transición de estado (SIMPLIFICADO)
 */
export const getStateTransitionMessage = (
  fromState: string, 
  toState: EstadoTercero | null
): string => {
  if (!toState) {
    return 'Asignación completada sin cambio de estado';
  }
  
  const stateLabels: Record<EstadoTercero, string> = {
    'pendiente': 'Pendiente',
    'en_espera_correccion': 'En Espera de Corrección',
    'en_curso_comercial': 'En Curso Comercial',
    'en_curso_administrador': 'En Curso Administrador',
    'en_curso_procesos': 'En Curso Procesos',
    'en_curso_cumplimiento': 'En Curso Cumplimiento',
    'asignada_administrador': 'Asignada a Administrador',
    'asignada_procesos': 'Asignada a Procesos',
    'asignada_oficial_cumplimiento': 'Asignada a Cumplimiento',
    'devuelto_comercial': 'Devuelto a Comercial',
    'aprobado': 'Aprobado',
    'rechazado': 'Rechazado',
    'finalizado': 'Finalizado'
  };
  
  return `Estado cambiado de ${stateLabels[fromState as EstadoTercero] || fromState} a ${stateLabels[toState]}`;
};
