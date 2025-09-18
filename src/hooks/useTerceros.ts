import { useState, useEffect } from 'react';
import { TercerosService, TerceroCreateRequest } from '../services/terceros.drf.service';

interface UseTercerosOptions {
    filtros?: {
        estado_aprobacion?: string;
        tipo_persona?: string;
        comercial_asignado?: string;
        search?: string;
    };
    autoLoad?: boolean;
    pageSize?: number;
}

export const useTerceros = (options: UseTercerosOptions = {}) => {
    const [terceros, setTerceros] = useState<TerceroCreateRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);

    const { filtros = {}, autoLoad = true, pageSize = 10 } = options;

    const cargarTerceros = async (page = 1) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await TercerosService.listarTerceros({
                ...filtros,
                page,
                page_size: pageSize
            });
            
            setTerceros(response.results);
            setTotalCount(response.count);
            setCurrentPage(page);
            setHasNext(!!response.next);
            setHasPrevious(!!response.previous);
            
        } catch (err: any) {
            setError(err.message);
            setTerceros([]);
        } finally {
            setLoading(false);
        }
    };

    const recargar = () => cargarTerceros(currentPage);
    const irAPagina = (page: number) => cargarTerceros(page);
    const buscar = (nuevosFiltros: typeof filtros) => {
        cargarTerceros(1);
    };

    useEffect(() => {
        if (autoLoad) {
            cargarTerceros(1);
        }
    }, [autoLoad, JSON.stringify(filtros)]);

    return {
        terceros,
        loading,
        error,
        totalCount,
        currentPage,
        hasNext,
        hasPrevious,
        cargarTerceros,
        recargar,
        irAPagina,
        buscar
    };
};

// Hook para obtener un tercero específico
export const useTercero = (id: string) => {
    const [tercero, setTercero] = useState<TerceroCreateRequest | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarTercero = async () => {
        if (!id) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const data = await TercerosService.obtenerTerceroCompleto(id);
            setTercero(data);
        } catch (err: any) {
            setError(err.message);
            setTercero(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarTercero();
    }, [id]);

    return {
        tercero,
        loading,
        error,
        recargar: cargarTercero
    };
};

// Hook para paginación infinita
export const useTercerosInfinite = (filtros = {}) => {
    const [terceros, setTerceros] = useState<TerceroCreateRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    const cargarMas = async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const response = await TercerosService.listarTerceros({
                ...filtros,
                page,
                page_size: 20
            });

            if (page === 1) {
                setTerceros(response.results);
            } else {
                setTerceros(prev => [...prev, ...response.results]);
            }

            setHasMore(!!response.next);
            setPage(prev => prev + 1);
        } catch (error) {
            console.error('Error cargando más terceros:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
        setTerceros([]);
        setHasMore(true);
        cargarMas();
    }, [JSON.stringify(filtros)]);

    return { terceros, loading, hasMore, cargarMas };
};
