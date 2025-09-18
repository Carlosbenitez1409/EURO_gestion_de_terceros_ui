import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getRoleConfig, type UserRole, type RoleConfig } from '../config/roles';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_staff: boolean;
  grupos: string[];
}

interface UserContextType {
  user: User | null;
  roleConfig: RoleConfig | null;
  setUser: (user: User | null) => void;
  hasPermission: (permission: keyof RoleConfig['permissions']) => boolean;
  canManageState: (state: string) => boolean;
  getVisibleStates: () => string[];
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar usuario del localStorage al iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Guardar usuario en localStorage cuando cambie
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const roleConfig = user ? getRoleConfig(user.role) : null;

  const hasPermission = (permission: keyof RoleConfig['permissions']): boolean => {
    if (!user || !roleConfig) return false;
    const permissionValue = roleConfig.permissions[permission];
    return typeof permissionValue === 'boolean' ? permissionValue : false;
  };

  const canManageState = (state: string): boolean => {
    if (!user || !roleConfig) return false;
    return roleConfig.workflows.manageableStates.includes(state);
  };

  const getVisibleStates = (): string[] => {
    if (!user || !roleConfig) return [];
    return roleConfig.workflows.visibleStates;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Redirigir al login si es necesario
    window.location.href = '/login';
  };

  const value: UserContextType = {
    user,
    roleConfig,
    setUser,
    hasPermission,
    canManageState,
    getVisibleStates,
    logout,
    isLoading
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Hook específico para obtener el rol del usuario
export function useUserRole(): UserRole | null {
  const { user } = useUser();
  return user?.role || null;
}

// Hook para verificar permisos específicos
export function usePermissions() {
  const { hasPermission, canManageState, getVisibleStates, roleConfig } = useUser();
  
  return {
    hasPermission,
    canManageState,
    getVisibleStates,
    roleConfig,
    
    // Shortcuts para permisos comunes
    canCreateTerceros: hasPermission('createTerceros'),
    canEditTerceros: hasPermission('editTerceros'),
    canApproveTerceros: hasPermission('approveTerceros'),
    canViewDashboard: hasPermission('dashboardAccess'),
    canRegisterEmployees: hasPermission('employeeRegistration'),
    canViewConsolidated: hasPermission('consolidatedView'),
    canUploadDocuments: hasPermission('uploadDocuments'),
    canValidateDocuments: hasPermission('validateDocuments')
  };
}
