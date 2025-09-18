import { useState, useEffect, useCallback } from 'react';

export interface BackendPaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

export interface BackendPaginationActions {
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refresh: () => void;
  reset: () => void;
}

export interface UseBackendPaginationProps<T> {
  fetchFunction: (page: number, pageSize: number, ...args: any[]) => Promise<{
    results: T[];
    count: number;
    next: string | null;
    previous: string | null;
  }>;
  initialPageSize?: number;
  fetchArgs?: any[];
  dependencies?: any[];
}

export interface UseBackendPaginationReturn<T> extends BackendPaginationState, BackendPaginationActions {
  data: T[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function useBackendPagination<T>({
  fetchFunction,
  initialPageSize = 10,
  fetchArgs = [],
  dependencies = []
}: UseBackendPaginationProps<T>): UseBackendPaginationReturn<T> {
  const [state, setState] = useState<BackendPaginationState>({
    currentPage: 1,
    pageSize: initialPageSize,
    totalCount: 0,
    totalPages: 0,
    isLoading: false,
    error: null
  });
  
  const [data, setData] = useState<T[]>([]);

  const fetchData = useCallback(async (page: number, pageSize: number) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetchFunction(page, pageSize, ...fetchArgs);
      
      setData(response.results);
      setState(prev => ({
        ...prev,
        currentPage: page,
        pageSize,
        totalCount: response.count,
        totalPages: Math.ceil(response.count / pageSize),
        isLoading: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar datos'
      }));
      setData([]);
    }
  }, [fetchFunction, ...fetchArgs]);

  // Effect para cargar datos iniciales y cuando cambien las dependencias
  useEffect(() => {
    fetchData(state.currentPage, state.pageSize);
  }, [...dependencies, fetchFunction]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= state.totalPages && page !== state.currentPage) {
      fetchData(page, state.pageSize);
    }
  }, [state.totalPages, state.currentPage, state.pageSize, fetchData]);

  const setPageSize = useCallback((size: number) => {
    if (size > 0 && size !== state.pageSize) {
      // Al cambiar el tamaño de página, volvemos a la página 1
      fetchData(1, size);
    }
  }, [state.pageSize, fetchData]);

  const refresh = useCallback(() => {
    fetchData(state.currentPage, state.pageSize);
  }, [state.currentPage, state.pageSize, fetchData]);

  const reset = useCallback(() => {
    fetchData(1, initialPageSize);
  }, [initialPageSize, fetchData]);

  return {
    // State
    ...state,
    data,
    
    // Computed properties
    hasNextPage: state.currentPage < state.totalPages,
    hasPreviousPage: state.currentPage > 1,
    
    // Actions
    goToPage,
    setPageSize,
    refresh,
    reset
  };
}