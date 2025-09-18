import { apiRequest } from '@/lib/api.client';
import { User } from '@/types/api.types';

// Interfaces para el nuevo sistema de gestión de usuarios
export interface UserManagementCreateRequest {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'administrador' | 'comercial' | 'procesos' | 'oficial_cumplimiento' | 'gestion_humana';
  password: string;
  telefono?: string;
  direccion?: string;
  cargo?: string;
  area?: string;
  tipo_documento?: 'cedula' | 'pasaporte' | 'cedula_extranjeria';
  numero_documento?: string;
  fecha_contratacion?: string;
  estado_empleado?: 'activo' | 'inactivo' | 'en_capacitacion' | 'suspendido' | 'retirado';
}

export interface UserManagementUpdateRequest extends Partial<Omit<UserManagementCreateRequest, 'password'>> {
  id: string;
}

export interface UserPasswordChangeRequest {
  new_password: string;
}

export interface PaginatedUsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

export interface UserFilters {
  role?: string;
  estado_empleado?: string;
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

class UserManagementService {
  /**
   * Obtener lista de usuarios/empleados
   * Usa el nuevo endpoint empleados/ con fallback
   */
  async getUsers(filters: UserFilters = {}): Promise<PaginatedUsersResponse> {
    const params = new URLSearchParams();
    
    // Agregar parámetro para incluir empleados inactivos por defecto
    params.append('include_inactive', 'true');
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    
    try {
      // Usar el endpoint específico para empleados disponible en Django
      const url = `user-management/empleados/${queryString ? `?${queryString}` : ''}`;
      const response = await apiRequest.get<{
        success: boolean;
        empleados: User[];
        total: number;
        results: User[];
      }>(url);
      
      // Adaptar la respuesta al formato esperado
      return {
        count: response.total,
        next: null,
        previous: null,
        results: response.empleados || response.results
      };
    } catch (error) {
      console.warn('Endpoint user-management/empleados/ no disponible, usando endpoint anterior:', error);
      // Fallback al endpoint anterior
      try {
        const url = `user-management/${queryString ? `?${queryString}` : ''}`;
        return await apiRequest.get<PaginatedUsersResponse>(url);
      } catch (secondError) {
        console.warn('Endpoint user-management/ tampoco disponible, usando accounts/users/:', secondError);
        const url = `accounts/users/${queryString ? `?${queryString}` : ''}`;
        return await apiRequest.get<PaginatedUsersResponse>(url);
      }
    }
  }

  /**
   * Obtener usuario por ID
   * Intenta usar el nuevo endpoint, si falla usa el anterior
   */
  async getUserById(id: string): Promise<User> {
    try {
      // Intentar con el nuevo endpoint primero
      return await apiRequest.get<User>(`user-management/${id}/`);
    } catch (error) {
      console.warn('Nuevo endpoint getUserById no disponible, usando endpoint anterior:', error);
      // Fallback al endpoint anterior
      return await apiRequest.get<User>(`accounts/users/${id}/`);
    }
  }

  /**
   * Crear nuevo usuario
   * Intenta usar el nuevo endpoint, si falla usa el anterior
   */
  async createUser(data: UserManagementCreateRequest): Promise<User> {
    try {
      // Intentar con el nuevo endpoint primero
      return await apiRequest.post<User>('user-management/', data);
    } catch (error) {
      console.warn('Nuevo endpoint createUser no disponible, usando endpoint anterior:', error);
      // Fallback al endpoint anterior - adaptar los datos al formato anterior
      const legacyData = {
        username: data.username,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
        password: data.password,
        password_confirm: data.password, // Para el endpoint anterior
        phone: data.telefono || '',
        cargo: data.cargo || '',
        area: data.area || '',
        tipo_documento: data.tipo_documento || '',
        numero_documento: data.numero_documento || '',
        direccion: data.direccion || '',
        fecha_contratacion: data.fecha_contratacion || '',
        estado_empleado: data.estado_empleado || 'activo'
      };
      return await apiRequest.post<User>('accounts/users/', legacyData);
    }
  }

  /**
   * Actualizar usuario existente
   */
  async updateUser(id: string, data: UserManagementUpdateRequest): Promise<User> {
    return await apiRequest.put<User>(`user-management/${id}/`, data);
  }

  /**
   * Actualización parcial de usuario
   */
  async patchUser(id: string, data: Partial<UserManagementUpdateRequest>): Promise<User> {
    return await apiRequest.patch<User>(`user-management/${id}/`, data);
  }

  /**
   * Habilitar/Inhabilitar usuario (toggle status)
   * Intenta usar el nuevo endpoint, si falla usa el anterior
   */
  async toggleUserStatus(id: string): Promise<User> {
    try {
      // Intentar con el nuevo endpoint primero
      return await apiRequest.post<User>(`user-management/${id}/toggle_status/`);
    } catch (error) {
      console.warn('Nuevo endpoint toggle no disponible, usando endpoint anterior:', error);
      // Fallback al endpoint anterior - necesitamos determinar el estado actual primero
      const user = await this.getUserById(id);
      const newStatus = user.estado_empleado === 'activo' ? 'inactivo' : 'activo';
      return await apiRequest.patch<User>(`accounts/users/${id}/`, { estado_empleado: newStatus });
    }
  }

  /**
   * Cambiar contraseña de usuario
   */
  async changeUserPassword(id: string, data: UserPasswordChangeRequest): Promise<void> {
    await apiRequest.post(`user-management/${id}/change_password/`, data);
  }

  /**
   * Obtener estadísticas de usuarios
   */
  async getUserStats(): Promise<{
    total: number;
    activos: number;
    administrador: number;
    comercial: number;
    procesos: number;
    oficial_cumplimiento: number;
    gestion_humana: number;
    nuevos_mes: number;
  }> {
    try {
      const users = await this.getUsers({ page_size: 1000 }); // Obtener todos para calcular stats
      const ahora = new Date();
      
      return {
        total: users.count,
        activos: users.results.filter(u => u.estado_empleado === 'activo').length,
        administrador: users.results.filter(u => u.role === 'administrador').length,
        comercial: users.results.filter(u => u.role === 'comercial').length,
        procesos: users.results.filter(u => u.role === 'procesos').length,
        oficial_cumplimiento: users.results.filter(u => u.role === 'oficial_cumplimiento').length,
        gestion_humana: users.results.filter(u => u.role === 'gestion_humana').length,
        nuevos_mes: users.results.filter(u => {
          const fecha = new Date(u.created_at);
          return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
        }).length
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de usuarios:', error);
      return {
        total: 0,
        activos: 0,
        administrador: 0,
        comercial: 0,
        procesos: 0,
        oficial_cumplimiento: 0,
        gestion_humana: 0,
        nuevos_mes: 0
      };
    }
  }

  /**
   * Verificar disponibilidad de username
   */
  async checkUsername(username: string): Promise<{ available: boolean }> {
    try {
      const users = await this.getUsers({ search: username });
      const exists = users.results.some(user => user.username === username);
      return { available: !exists };
    } catch (error) {
      console.error('Error verificando username:', error);
      return { available: true };
    }
  }

  /**
   * Verificar disponibilidad de email
   */
  async checkEmail(email: string): Promise<{ available: boolean }> {
    try {
      const users = await this.getUsers({ search: email });
      const exists = users.results.some(user => user.email === email);
      return { available: !exists };
    } catch (error) {
      console.error('Error verificando email:', error);
      return { available: true };
    }
  }
}

export const userManagementService = new UserManagementService();
