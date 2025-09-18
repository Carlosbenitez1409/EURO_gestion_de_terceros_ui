import { apiRequest } from '@/lib/api.client';
import { User } from '@/types/api.types';

// Interfaces para el manejo de usuarios
export interface UserCreateRequest {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'procesos' | 'comercial' | 'gestion_humana';
  password: string;
  password_confirm: string; // Cambiado de password_confirmation a password_confirm
  // Campos opcionales adicionales
  phone?: string;
  direccion?: string;
  cargo?: string;
  area?: string;
  tipo_documento?: string;
  numero_documento?: string;
  fecha_contratacion?: string;
  estado_empleado?: 'activo' | 'inactivo';
}

export interface UserUpdateRequest extends Partial<Omit<UserCreateRequest, 'password' | 'password_confirmation'>> {
  estado_empleado?: 'activo' | 'inactivo';
}

export interface UserPasswordChangeRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface PaginatedUsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

export interface UserFilters {
  role?: 'procesos' | 'comercial' | 'gestion_humana';
  estado_empleado?: 'activo' | 'inactivo' | 'licencia' | 'vacaciones' | 'suspension';
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

class UsersService {
  
  /**
   * Obtener lista de usuarios con filtros y paginación
   * Solo disponible para usuarios staff
   */
  async getUsers(filters?: UserFilters): Promise<PaginatedUsersResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiRequest.get<PaginatedUsersResponse>(
      `accounts/users/?${params.toString()}`
    );
    return response;
  }

  /**
   * Obtener perfil del usuario actual
   */
  async getCurrentUserProfile(): Promise<User> {
    const response = await apiRequest.get<User>('accounts/profile/');
    return response;
  }

  /**
   * Actualizar perfil del usuario actual
   */
  async updateCurrentUserProfile(data: Partial<User>): Promise<User> {
    const response = await apiRequest.put<User>('accounts/profile/', data);
    return response;
  }

  /**
   * Obtener usuario por ID - a través del admin o endpoints específicos si existen
   */
  async getUser(id: string): Promise<User> {
    // Este endpoint podría no estar disponible, usar con precaución
    const response = await apiRequest.get<User>(`accounts/users/${id}/`);
    return response;
  }

  /**
   * NOTA: Los siguientes métodos requieren acceso al admin de Django
   * o endpoints específicos que podrían no estar implementados
   */

  /**
   * Crear nuevo usuario - Requiere POST accounts/users/ en backend
   */
  async createUser(data: UserCreateRequest): Promise<User> {
    try {
      const response = await apiRequest.post<User>('accounts/users/', data);
      return response;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('⚠️ BACKEND: Falta implementar POST accounts/users/ - Actualmente solo existe GET');
      }
      throw error;
    }
  }

  /**
   * Actualizar usuario
   */
  async updateUser(id: string, data: UserUpdateRequest): Promise<User> {
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== '' && value !== undefined && value !== null)
    );
    
    const response = await apiRequest.patch<User>(`accounts/users/${id}/`, cleanData);
    return response;
  }

  /**
   * Actualizar parcialmente un usuario
   */
  async patchUser(id: string, data: Partial<UserUpdateRequest>): Promise<User> {
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== '' && value !== undefined && value !== null)
    );
    
    const response = await apiRequest.patch<User>(`accounts/users/${id}/`, cleanData);
    return response;
  }

  /**
   * Activar/Desactivar usuario
   */
  async toggleUserStatus(id: string, estado_empleado: 'activo' | 'inactivo'): Promise<User> {
    return await apiRequest.patch(`accounts/users/${id}/`, { estado_empleado });
  }

  /**
   * Cambiar contraseña de usuario
   */
  async changeUserPassword(id: string, data: UserPasswordChangeRequest): Promise<void> {
    throw new Error('El cambio de contraseñas debe realizarse a través del panel de administración Django en /admin/');
  }

  /**
   * Eliminar usuario (soft delete)
   */
  async deleteUser(id: string): Promise<void> {
    throw new Error('La eliminación de usuarios debe realizarse a través del panel de administración Django en /admin/');
  }

  /**
   * Obtener estadísticas de usuarios - podría no estar disponible
   */
  async getUserStats(): Promise<{
    total: number;
    activos: number;
    procesos: number;
    comercial: number;
    gestion_humana: number;
    nuevos_mes: number;
  }> {
    try {
      const response = await apiRequest.get<any>('accounts/users/stats/');
      return response;
    } catch (error) {
      // Si no hay endpoint de estadísticas, calculamos desde la lista
      const users = await this.getUsers();
      const ahora = new Date();
      
      return {
        total: users.results.length,
        activos: users.results.filter(u => u.estado_empleado === 'activo').length,
        procesos: users.results.filter(u => u.role === 'procesos').length,
        comercial: users.results.filter(u => u.role === 'comercial').length,
        gestion_humana: users.results.filter(u => u.role === 'gestion_humana').length,
        nuevos_mes: users.results.filter(u => {
          const fecha = new Date(u.created_at);
          return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
        }).length
      };
    }
  }

  /**
   * Verificar disponibilidad de username - podría no estar disponible
   */
  async checkUsername(username: string): Promise<{ available: boolean }> {
    try {
      const response = await apiRequest.get<{ available: boolean }>(`accounts/check_username/?username=${username}`);
      return response;
    } catch (error) {
      // Si no hay endpoint específico, asumir que está disponible
      return { available: true };
    }
  }

  /**
   * Verificar disponibilidad de email - podría no estar disponible
   */
  async checkEmail(email: string): Promise<{ available: boolean }> {
    try {
      const response = await apiRequest.get<{ available: boolean }>(`accounts/check_email/?email=${email}`);
      return response;
    } catch (error) {
      // Si no hay endpoint específico, asumir que está disponible
      return { available: true };
    }
  }
}

export const usersService = new UsersService();
