import { apiRequest } from '@/lib/api.client';

export interface User {
    id: string;
    email: string;
    nombre_completo: string;
    role: 'procesos' | 'comercial' | 'gestion_humana' | 'administrador' | 'oficial_cumplimiento';
    is_active: boolean;
    date_joined: string;
    last_login?: string;
}

export interface CreateUserRequest {
    email: string;
    nombre_completo: string;
    role: User['role'];
    password: string;
}

export interface UpdateUserRequest {
    email?: string;
    nombre_completo?: string;
    role?: User['role'];
    is_active?: boolean;
}

export interface ChangePasswordRequest {
    password: string;
}

export interface UsersByRole {
    procesos: User[];
    comercial: User[];
    gestion_humana: User[];
    administrador: User[];
    oficial_cumplimiento: User[];
}

class UserService {
    /**
     * Obtener lista de usuarios con filtros opcionales
     */
    async getUsers(filters?: { role?: string; is_active?: boolean }): Promise<User[]> {
        let url = '/accounts/user-management/';
        const params = new URLSearchParams();
        
        if (filters?.role) {
            params.append('role', filters.role);
        }
        if (filters?.is_active !== undefined) {
            params.append('is_active', filters.is_active.toString());
        }
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        const response = await apiRequest.get<any>(url);
        
        // Manejar diferentes formatos de respuesta de la API
        if (Array.isArray(response)) {
            return response;
        } else if (response && typeof response === 'object') {
            // Buscar la propiedad que contiene el array de usuarios
            const possibleKeys = ['results', 'data', 'users', 'items'];
            for (const key of possibleKeys) {
                if (response[key] && Array.isArray(response[key])) {
                    return response[key];
                }
            }
            // Si no encuentra ninguna clave conocida, verificar si toda la respuesta es directamente usuarios
            const values = Object.values(response);
            const arrayValue = values.find(val => Array.isArray(val));
            if (arrayValue) {
                return arrayValue as User[];
            }
        }
        
        // Fallback: retornar array vacío si no se puede procesar la respuesta
        console.warn('Unexpected API response format:', response);
        return [];
    }

    /**
     * Obtener usuarios agrupados por rol
     */
    async getUsersByRole(): Promise<UsersByRole> {
        const response = await apiRequest.get<UsersByRole>('/accounts/user-management/by_role/');
        return response;
    }

    /**
     * Obtener usuario por ID
     */
    async getUser(id: string): Promise<User> {
        const response = await apiRequest.get<User>(`/api/accounts/user-management/${id}/`);
        return response;
    }

    /**
     * Crear nuevo usuario
     */
    async createUser(data: CreateUserRequest): Promise<User> {
        const response = await apiRequest.post<User>('/accounts/user-management/', data);
        return response;
    }

    /**
     * Actualizar usuario existente
     */
    async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
        const response = await apiRequest.put<User>(`/api/accounts/user-management/${id}/`, data);
        return response;
    }

    /**
     * Eliminar usuario
     */
    async deleteUser(id: string): Promise<void> {
        await apiRequest.delete(`/api/accounts/user-management/${id}/`);
    }

    /**
     * Cambiar contraseña de usuario
     */
    async changePassword(id: string, password: string): Promise<void> {
        await apiRequest.post(`/api/accounts/user-management/${id}/change_password/`, {
            password: password
        });
    }

    /**
     * Activar/desactivar usuario
     */
    async toggleUserStatus(id: string): Promise<User> {
        const response = await apiRequest.put<User>(`/api/accounts/user-management/${id}/toggle_status/`, {});
        return response;
    }

    /**
     * Obtener usuarios por rol específico
     */
    async getUsersBySpecificRole(role: User['role']): Promise<User[]> {
        return this.getUsers({ role, is_active: true });
    }
}

export const userService = new UserService();
