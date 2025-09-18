import { useEffect, useState } from 'react';

/**
 * Hook para manejar la hidratación del cliente y prevenir problemas de renderizado
 * en componentes que dependen de estilos CSS externos
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Verificar que el DOM esté completamente cargado
    const checkHydration = () => {
      // Verificar que los estilos CSS estén aplicados
      const testElement = document.createElement('div');
      testElement.className = 'opacity-0';
      document.body.appendChild(testElement);
      
      const computedStyle = window.getComputedStyle(testElement);
      const isStylesLoaded = computedStyle.opacity === '0';
      
      document.body.removeChild(testElement);
      
      if (isStylesLoaded) {
        setIsHydrated(true);
      } else {
        // Retry after a small delay
        setTimeout(checkHydration, 10);
      }
    };

    // Pequeño delay inicial para asegurar que el DOM esté listo
    const timer = setTimeout(checkHydration, 20);
    
    return () => clearTimeout(timer);
  }, []);

  return isHydrated;
}

/**
 * Hook específico para componentes Select que necesitan renderizado estable
 */
export function useSelectHydration() {
  const [isSelectReady, setIsSelectReady] = useState(false);

  useEffect(() => {
    const checkSelectStyles = () => {
      // Crear un elemento de prueba para verificar que los estilos de Select estén cargados
      const testSelect = document.createElement('button');
      testSelect.setAttribute('role', 'combobox');
      testSelect.style.visibility = 'hidden';
      testSelect.style.position = 'absolute';
      testSelect.style.top = '-9999px';
      
      document.body.appendChild(testSelect);
      
      const computedStyle = window.getComputedStyle(testSelect);
      const hasExpectedStyles = computedStyle.display === 'flex';
      
      document.body.removeChild(testSelect);
      
      if (hasExpectedStyles) {
        setIsSelectReady(true);
      } else {
        setTimeout(checkSelectStyles, 15);
      }
    };

    const timer = setTimeout(checkSelectStyles, 30);
    
    return () => clearTimeout(timer);
  }, []);

  return isSelectReady;
}
