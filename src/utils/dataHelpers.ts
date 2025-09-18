/**
 * 🛠️ DATA HELPERS - Compatibilidad Dual camelCase/snake_case
 * Utilidades para manejar datos del backend con ambos formatos
 */

/**
 * Obtiene un valor usando formato snake_case primero, luego camelCase como fallback
 */
export const getFieldValue = (
  obj: any, 
  snakeCase: string, 
  camelCase: string, 
  defaultValue: any = null
) => {
  return obj?.[snakeCase] ?? obj?.[camelCase] ?? defaultValue;
};

/**
 * Obtiene arrays usando formato snake_case primero, luego camelCase como fallback
 */
export const getArrayField = (
  obj: any, 
  snakeCase: string, 
  camelCase: string, 
  defaultValue: any[] = []
) => {
  const snakeValue = obj?.[snakeCase];
  const camelValue = obj?.[camelCase];
  
  // Priorizar arrays no vacíos
  if (Array.isArray(snakeValue) && snakeValue.length > 0) return snakeValue;
  if (Array.isArray(camelValue) && camelValue.length > 0) return camelValue;
  if (Array.isArray(snakeValue)) return snakeValue;
  if (Array.isArray(camelValue)) return camelValue;
  
  return defaultValue;
};

/**
 * Interface para información PEP procesada - Estructura 2025
 */
export interface InformacionPEPProcesada {
  id: number;
  nombre: string;
  tipo: string;
  numeroIdentificacion: string;
  // Nuevos campos estructura 2025
  cargo: string;
  parentesco: string;
  fechaVinculacion: string;
  fechaRetiro: string;
  cuentasFinancierasExterior: boolean;
  // Campos legacy (compatibilidad)
  patrimonioFiducia: boolean;
  relacionesComerciales: boolean;
}

/**
 * Procesa información PEP con compatibilidad dual - Estructura 2025
 */
export const procesarInformacionPEP = (tercero: any): InformacionPEPProcesada[] => {
  const informacionPEP = getArrayField(tercero, 'informacion_pep', 'informacionPEP', []);
  
  return informacionPEP.map((pep: any, index: number) => ({
    id: index,
    nombre: pep.nombre || 'No especificado',
    tipo: pep.tipo || 'No especificado',
    numeroIdentificacion: getFieldValue(pep, 'numero_identificacion', 'numeroIdentificacion', 'No especificado'),
    // Nuevos campos estructura 2025
    cargo: pep.cargo || 'No especificado',
    parentesco: pep.parentesco || 'No especificado',
    fechaVinculacion: getFieldValue(pep, 'fecha_vinculacion', 'fechaVinculacion', ''),
    fechaRetiro: getFieldValue(pep, 'fecha_retiro', 'fechaRetiro', ''),
    cuentasFinancierasExterior: getFieldValue(pep, 'cuentas_financieras_exterior', 'cuentasFinancierasExterior', false),
    // Campos legacy (compatibilidad)
    patrimonioFiducia: getFieldValue(pep, 'patrimonio_fiducia', 'patrimonioFiducia', false),
    relacionesComerciales: getFieldValue(pep, 'relaciones_comerciales', 'relacionesComerciales', false)
  }));
};

/**
 * Interface para información financiera procesada
 */
export interface InformacionFinancieraProcesada {
  ingresoMensual: string;
  costosGastos: string;
  otrosIngresos: string;
  totalIngresos: string;
  activos: string;
  pasivos: string;
  patrimonio: string;
}

/**
 * Obtiene información financiera con compatibilidad dual
 */
export const getInformacionFinanciera = (tercero: any): InformacionFinancieraProcesada => ({
  ingresoMensual: getFieldValue(tercero, 'ingreso_mensual', 'ingresoMensual', ''),
  costosGastos: getFieldValue(tercero, 'costos_gastos_mensuales', 'costosGastos', ''),
  otrosIngresos: getFieldValue(tercero, 'otros_ingresos', 'otrosIngresos', ''),
  totalIngresos: getFieldValue(tercero, 'total_ingresos', 'totalIngresos', ''),
  activos: getFieldValue(tercero, 'activos', 'activos', ''),
  pasivos: getFieldValue(tercero, 'pasivos', 'pasivos', ''),
  patrimonio: getFieldValue(tercero, 'patrimonio', 'patrimonio', '')
});

/**
 * Interface para fuentes y recursos procesados
 */
export interface FuentesYRecursosProcesados {
  fuentesFondos: string[];
  tiposRecursos: string[];
  tiposOperaciones: string[];
}

/**
 * Obtiene arrays de fondos y recursos con compatibilidad dual
 */
export const getFuentesYRecursos = (tercero: any): FuentesYRecursosProcesados => ({
  fuentesFondos: getArrayField(tercero, 'fuentes_fondos', 'fuentesFondos', []),
  tiposRecursos: getArrayField(tercero, 'tipos_recursos', 'tiposRecursos', []),
  tiposOperaciones: getArrayField(tercero, 'tipos_operaciones_extranjera', 'tiposOperacionesMonedaExtranjera', [])
});

/**
 * Obtiene información SARLAFT con compatibilidad dual
 */
export const getInformacionSARLAFT = (tercero: any) => ({
  personaExpuestaPolitica: getFieldValue(tercero, 'persona_expuesta_politica', 'personaExpuestaPolitica', false),
  manejoAltoEfectivo: getFieldValue(tercero, 'manejo_alto_efectivo', 'manejoAltoEfectivo', false),
  operacionesMonedaExtranjera: getFieldValue(tercero, 'operaciones_moneda_extranjera', 'operacionesMonedaExtranjera', false)
});

/**
 * Formatea valores monetarios para visualización
 */
export const formatearMoneda = (valor: string | number): string => {
  if (!valor || valor === '' || valor === '0') return 'No especificado';
  
  const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
  if (isNaN(numero)) return valor.toString();
  
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numero);
};

/**
 * Obtiene el nombre completo de un tercero
 */
export const getNombreCompleto = (tercero: any): string => {
  const nombres = getFieldValue(tercero, 'nombres', 'nombres', '');
  const apellidos = getFieldValue(tercero, 'apellidos', 'apellidos', '');
  
  if (nombres && apellidos) {
    return `${nombres} ${apellidos}`;
  } else if (nombres) {
    return nombres;
  } else if (apellidos) {
    return apellidos;
  }
  
  return 'No especificado';
};

/**
 * Obtiene información de contacto con compatibilidad dual
 */
export const getInformacionContacto = (tercero: any) => ({
  email: getFieldValue(tercero, 'email', 'email', ''),
  telefono: getFieldValue(tercero, 'telefono', 'telefono', ''),
  celular: getFieldValue(tercero, 'celular', 'celular', ''),
  direccion: getFieldValue(tercero, 'direccion', 'direccion', ''),
  ciudad: getFieldValue(tercero, 'ciudad', 'ciudad', ''),
  departamento: getFieldValue(tercero, 'departamento', 'departamento', '')
});
