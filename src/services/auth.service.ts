import { apiRequest, TokenStorage } from '@/lib/api.client';
import { 
  LoginRequest, 
  LoginResponse, 
  RefreshTokenRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  User 
} from '@/types/api.types';

class AuthService {
  
  /**
   * Iniciar sesión - Django DRF compatible
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiRequest.post<LoginResponse>('/auth/login/', credentials);
    
    // Guardar tokens automáticamente
    if (response.access && response.refresh) {
      TokenStorage.setTokens(response.access, response.refresh);
    }
    
    return response;
  }

  /**
   * Renovar token de acceso - Django DRF compatible
   */
  async refreshToken(refreshTokenRequest: RefreshTokenRequest): Promise<LoginResponse> {
    const response = await apiRequest.post<LoginResponse>('/auth/refresh/', refreshTokenRequest);
    
    // Guardar nuevos tokens automáticamente
    if (response.access && response.refresh) {
      TokenStorage.setTokens(response.access, response.refresh);
    }
    
    return response;
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    try {
      await apiRequest.post('/auth/logout/');
    } catch (error) {
      console.warn('Error during logout:', error);
    } finally {
      // Limpiar tokens siempre, incluso si hay error en el servidor
      TokenStorage.clearTokens();
    }
  }

  /**
   * Obtener información del usuario actual - Django DRF compatible
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiRequest.get<User>('/auth/me/');
    return response;
  }

  /**
   * Cambiar contraseña - Django DRF compatible
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    await apiRequest.put('/auth/change-password/', passwordData);
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async forgotPassword(forgotPasswordRequest: ForgotPasswordRequest): Promise<void> {
    await apiRequest.post('/auth/forgot-password', forgotPasswordRequest);
  }

  /**
   * Restablecer contraseña
   */
  async resetPassword(resetPasswordRequest: ResetPasswordRequest): Promise<void> {
    await apiRequest.post('/auth/reset-password', resetPasswordRequest);
  }

  /**
   * Validar token
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Habilitar autenticación de dos factores
   */
  async enable2FA(): Promise<{ qrCode: string; secret: string }> {
    const response = await apiRequest.post<{ qrCode: string; secret: string }>('/auth/2fa/enable');
    return response;
  }

  /**
   * Confirmar autenticación de dos factores
   */
  async confirm2FA(token: string): Promise<void> {
    await apiRequest.post('/auth/2fa/confirm', { token });
  }

  /**
   * Deshabilitar autenticación de dos factores
   */
  async disable2FA(token: string): Promise<void> {
    await apiRequest.post('/auth/2fa/disable', { token });
  }

  /**
   * Verificar código de autenticación de dos factores
   */
  async verify2FA(token: string): Promise<void> {
    await apiRequest.post('/auth/2fa/verify', { token });
  }
}

export const authService = new AuthService();
export default authService;
