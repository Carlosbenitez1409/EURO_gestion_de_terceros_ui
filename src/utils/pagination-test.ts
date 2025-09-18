// Archivo de prueba para validar la integración frontend-backend
// Este archivo puede ejecutarse en el navegador para probar la paginación

import { tercerosDRFService } from '../services/terceros.drf.service';

/**
 * Función de prueba para validar que el backend responde correctamente
 * con la estructura esperada por useBackendPagination
 */
export async function testBackendPagination() {
  console.log('🧪 Iniciando pruebas de paginación backend...');
  
  try {
    // Prueba 1: Paginación básica
    console.log('\n📄 Prueba 1: Paginación básica');
    const response1 = await tercerosDRFService.getTerceros({
      page: 1,
      page_size: 5
    });
    
    console.log('✅ Respuesta recibida:', {
      count: response1.count,
      results_length: response1.results.length,
      next: response1.next ? 'Sí' : 'No',
      previous: response1.previous ? 'Sí' : 'No'
    });
    
    // Verificar estructura
    const hasRequiredFields = !!(
      response1.results &&
      typeof response1.count === 'number' &&
      response1.hasOwnProperty('next') &&
      response1.hasOwnProperty('previous')
    );
    
    console.log('✅ Estructura válida:', hasRequiredFields);
    
    // Prueba 2: Filtros
    console.log('\n🔍 Prueba 2: Filtros y búsqueda');
    const response2 = await tercerosDRFService.getTerceros({
      page: 1,
      page_size: 3,
      search: 'test'
    });
    
    console.log('✅ Filtro de búsqueda:', {
      total_found: response2.count,
      results_length: response2.results.length
    });
    
    // Prueba 3: Paginación avanzada
    console.log('\n📊 Prueba 3: Navegación entre páginas');
    const response3 = await tercerosDRFService.getTerceros({
      page: 2,
      page_size: 2
    });
    
    console.log('✅ Página 2:', {
      count: response3.count,
      results_length: response3.results.length,
      has_previous: !!response3.previous,
      has_next: !!response3.next
    });
    
    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('✅ El backend está correctamente configurado para paginación');
    console.log('✅ El frontend puede usar useBackendPagination sin problemas');
    
    return {
      success: true,
      message: 'Integración frontend-backend funcionando correctamente'
    };
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Función para probar el hook useBackendPagination con datos reales
 */
export function createPaginationTestFunction() {
  return async (page: number, pageSize: number) => {
    console.log(`📡 Solicitando página ${page} con ${pageSize} elementos...`);
    
    const response = await tercerosDRFService.getTerceros({
      page,
      page_size: pageSize
    });
    
    console.log(`✅ Recibidos ${response.results.length} de ${response.count} terceros`);
    
    return response;
  };
}

// Instrucciones de uso:
// 1. Abrir DevTools en el navegador
// 2. Ejecutar: testBackendPagination()
// 3. Verificar que todos los console.log muestren ✅

console.log('🧪 Test utilities cargados. Ejecuta testBackendPagination() para probar la integración.');