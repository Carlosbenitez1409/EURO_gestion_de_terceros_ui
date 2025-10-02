// Función utilitaria paramanejarel logout del sistema
export const logoutUser = () => {
  try {

    
    // Lista de todos los elementos de localStorage a limpiar
    const localStorageKeys = [
      'euroSession',
      'euro_access_token', 
      'euro_refresh_token',
      'token',
      'user',
      'authToken'
    ];
    
    // Lista de todos los elementos de sessionStorage a limpiar
    const sessionStorageKeys = [
      'auto_redirect_done',
      'userSession',
      'tempData'
    ];
    
    // Limpiar localStorage
    localStorageKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);

      }
    });
    
    // Limpiar sessionStorage
    sessionStorageKeys.forEach(key => {
      if (sessionStorage.getItem(key)) {
        sessionStorage.removeItem(key);

      }
    });
    
    // Limpiar completamente sessionStorage para estar seguros
    sessionStorage.clear();
    

    
    // Usar setTimeout para asegurar que el localStorage se limpie antes de la redirección
    setTimeout(() => {

      window.location.replace('/');
    }, 100);
    
  } catch (error) {
    console.error('❌ Error durante el logout:', error);
    
    // Fallback: intentar limpiar por fuerza bruta
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (clearError) {
      console.error('❌ Error crítico limpiando storage:', clearError);
    }
    
    // Redirigir de todas formas
    window.location.replace('/');
  }
};

// Función para verificar si hay sesión activa
export const hasActiveSession = () => {
  try {
    const session = localStorage.getItem('euroSession');
    const accessToken = localStorage.getItem('euro_access_token');
    
    if (session && accessToken) {
      const sessionData = JSON.parse(session);
      return sessionData.role && sessionData.role.trim() !== '';
    }
    
    return false;
  } catch (error) {
    console.error('Error verificando sesión:', error);
    return false;
  }
};
