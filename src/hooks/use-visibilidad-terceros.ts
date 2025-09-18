import { useContext } from 'react';
// import { AuthContext } from '@/context/AuthContext';

// 🎯 REGLAS DE VISIBILIDAD SEGÚN EL FLUJO DEFINIDO

export interface FiltroVisibilidad {
  rol: string;
  usuario_id?: number;
  estados_permitidos?: string[];
  solo_asignados?: boolean;
}

/**
 * Hook para obtener la configuración de visibilidad según el rol del usuario
 */
export function useVisibilidadTerceros() {
  // TODO: Obtener del contexto real cuando esté disponible
  // const { user } = useContext(AuthContext) || {};
  
  // Mock user para desarrollo
  const user = {
    id: '1',
    role: 'procesos', // Cambiar según necesidad
    email: 'user@euro.com'
  };

  const getConfiguracionVisibilidad = (): FiltroVisibilidad => {
    if (!user) {
      return {
        rol: 'guest',
        estados_permitidos: [],
        solo_asignados: true
      };
    }

    switch (user.role) {
      case 'administrador':
        // El administrador ve TODAS las solicitudes en cualquier estado/asignación
        return {
          rol: 'administrador',
          usuario_id: parseInt(user.id),
          estados_permitidos: ['pendiente', 'en_espera', 'en_curso', 'devuelto', 'aprobado', 'rechazado', 'finalizado'],
          solo_asignados: false // Ve TODOS, no solo los asignados a él
        };

      case 'comercial':
        // Los comerciales ven solo las solicitudes asignadas a ellos
        return {
          rol: 'comercial',
          usuario_id: parseInt(user.id),
          estados_permitidos: ['pendiente', 'en_espera', 'devuelto'], // Estados donde pueden actuar
          solo_asignados: true
        };

      case 'procesos':
        // Procesos ve solo las solicitudes que le fueron asignadas
        return {
          rol: 'procesos',
          usuario_id: parseInt(user.id),
          estados_permitidos: ['en_curso'], // Solo las que están en curso
          solo_asignados: true
        };

      case 'oficial_cumplimiento':
        // Oficial de cumplimiento ve solo los terceros que le fueron asignados
        return {
          rol: 'oficial_cumplimiento',
          usuario_id: parseInt(user.id),
          estados_permitidos: ['en_curso'], // Solo las que están en curso para cumplimiento
          solo_asignados: true
        };

      case 'gestion_humana':
        // Gestión humana puede tener acceso limitado o específico
        return {
          rol: 'gestion_humana',
          usuario_id: parseInt(user.id),
          estados_permitidos: ['aprobado', 'finalizado'], // Solo ve las finalizadas
          solo_asignados: false // Puede ver todas las finalizadas
        };

      default:
        return {
          rol: user.role,
          usuario_id: parseInt(user.id),
          estados_permitidos: [],
          solo_asignados: true
        };
    }
  };

  /**
   * Obtiene los parámetros de filtro para la API según el rol
   */
  const getParametrosAPI = () => {
    const config = getConfiguracionVisibilidad();
    
    const params: Record<string, any> = {
      rol_filtro: config.rol
    };

    if (config.solo_asignados && config.usuario_id) {
      params.usuario_asignado = config.usuario_id;
    }

    if (config.estados_permitidos && config.estados_permitidos.length > 0) {
      params.estados = config.estados_permitidos.join(',');
    }

    return params;
  };

  /**
   * Verifica si el usuario puede realizar una acción específica
   */
  const puedeRealizarAccion = (accion: string, estadoTercero: string): boolean => {
    if (!user) return false;

    const configuracion = getConfiguracionVisibilidad();
    
    // El administrador puede hacer cualquier cosa
    if (user.role === 'administrador') {
      return true;
    }

    // Validaciones específicas por rol y acción
    switch (user.role) {
      case 'comercial':
        return (accion === 'cambiar_estado' && ['pendiente', 'en_espera'].includes(estadoTercero)) ||
               (accion === 'ver_historial');

      case 'procesos':
        return (accion === 'cambiar_estado' && estadoTercero === 'en_curso') ||
               (accion === 'reasignar' && estadoTercero === 'en_curso') ||
               (accion === 'ver_historial');

      case 'oficial_cumplimiento':
        return (accion === 'cambiar_estado' && estadoTercero === 'en_curso') ||
               (accion === 'ver_historial');

      default:
        return accion === 'ver_historial';
    }
  };

  /**
   * Obtiene las transiciones de estado permitidas para el rol actual
   */
  const getTransicionesPermitidas = (estadoActual: string): string[] => {
    if (!user) return [];

    switch (user.role) {
      case 'administrador':
        // El admin puede hacer cualquier transición
        const todasLasTransiciones: Record<string, string[]> = {
          'pendiente': ['en_espera', 'en_curso', 'aprobado', 'finalizado'],
          'en_espera': ['pendiente', 'en_curso', 'aprobado', 'finalizado'],
          'en_curso': ['devuelto', 'aprobado', 'rechazado', 'finalizado'],
          'devuelto': ['pendiente', 'en_curso', 'finalizado'],
          'aprobado': ['finalizado'],
          'rechazado': ['finalizado']
        };
        return todasLasTransiciones[estadoActual] || [];

      case 'comercial':
        const transicionesComercial: Record<string, string[]> = {
          'pendiente': ['en_espera', 'pendiente'], // Info incorrecta o reasignar a admin
        };
        return transicionesComercial[estadoActual] || [];

      case 'procesos':
        const transicionesProcesos: Record<string, string[]> = {
          'en_curso': ['devuelto', 'en_curso', 'finalizado'] // No acepta, reasignar o enviar a contabilidad
        };
        return transicionesProcesos[estadoActual] || [];

      case 'oficial_cumplimiento':
        const transicionesCumplimiento: Record<string, string[]> = {
          'en_curso': ['aprobado', 'rechazado'] // Aprobar o rechazar
        };
        return transicionesCumplimiento[estadoActual] || [];

      default:
        return [];
    }
  };

  return {
    configuracion: getConfiguracionVisibilidad(),
    parametrosAPI: getParametrosAPI(),
    puedeRealizarAccion,
    getTransicionesPermitidas,
    usuarioActual: user
  };
}

/**
 * Utilidad para formatear el nombre completo de un tercero
 */
export function formatearNombreTercero(tercero: any): string {
  if (tercero.tipo_persona === 'natural') {
    return `${tercero.nombres || ''} ${tercero.apellidos || ''}`.trim();
  }
  return tercero.razon_social || tercero.numero_documento;
}

/**
 * Utilidad para obtener la configuración de estado
 */
export function getConfiguracionEstado(estado: string) {
  const configuraciones = {
    'pendiente': { 
      label: 'Pendiente', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      descripcion: 'En revisión inicial'
    },
    'en_espera': { 
      label: 'En Espera', 
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      descripcion: 'Devuelta al tercero para corrección'
    },
    'en_curso': { 
      label: 'En Curso', 
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      descripcion: 'En gestión activa'
    },
    'devuelto': { 
      label: 'Devuelto', 
      color: 'bg-red-100 text-red-800 border-red-200',
      descripcion: 'Regresada al comercial'
    },
    'aprobado': { 
      label: 'Aprobado', 
      color: 'bg-green-100 text-green-800 border-green-200',
      descripcion: 'Validada definitivamente'
    },
    'rechazado': { 
      label: 'Rechazado', 
      color: 'bg-red-100 text-red-800 border-red-200',
      descripcion: 'Rechazada definitivamente'
    },
    'finalizado': { 
      label: 'Finalizado', 
      color: 'bg-green-500 text-white border-green-500',
      descripcion: 'Cerrada o enviada a contabilidad'
    }
  };

  return configuraciones[estado as keyof typeof configuraciones] || {
    label: estado,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    descripcion: 'Estado desconocido'
  };
}
