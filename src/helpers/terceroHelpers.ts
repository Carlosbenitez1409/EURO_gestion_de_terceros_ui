import { TerceroCreateRequest } from '../services/terceros.drf.service';

export const formatearNombreCompleto = (tercero: TerceroCreateRequest): string => {
    if (tercero.tipo_persona === 'natural') {
        return `${tercero.nombres} ${tercero.apellidos || ''}`.trim();
    }
    return tercero.razon_social || tercero.nombres;
};

export const formatearTipoDocumento = (tipo: string): string => {
    const tipos = {
        'CC': 'Cédula de Ciudadanía',
        'CE': 'Cédula de Extranjería',
        'PA': 'Pasaporte',
        'NIT': 'NIT'
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
};

export const formatearEstadoAprobacion = (estado: string): { texto: string; color: string } => {
    const estados = {
        'pendiente': { texto: 'Pendiente', color: 'orange' },
        'en_espera': { texto: 'En Espera', color: 'blue' },
        'en_curso': { texto: 'En Curso', color: 'cyan' },
        'devuelto': { texto: 'Devuelto', color: 'yellow' },
        'aprobado': { texto: 'Aprobado', color: 'green' },
        'rechazado': { texto: 'Rechazado', color: 'red' },
        'finalizado': { texto: 'Finalizado', color: 'green' }
    };
    return estados[estado as keyof typeof estados] || { texto: estado, color: 'gray' };
};

export const validarPorcentajeAccionario = (accionistas: Array<{porcentajeParticipacion: number}>): boolean => {
    const total = accionistas.reduce((sum, acc) => sum + acc.porcentajeParticipacion, 0);
    return Math.abs(total - 100) < 0.01;
};

export const formatearFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export const formatearCurrency = (value: string | number): string => {
    if (!value) return '';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return value.toString();
    
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numValue);
};
