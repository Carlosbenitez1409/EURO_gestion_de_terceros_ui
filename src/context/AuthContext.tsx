import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/services/auth.service';
import { TokenStorage } from '@/lib/api.client';
import { User, LoginRequest } from '@/types/api.types';
import { toast } from '@/components/ui/use-toast';

interface AuthContextType {
    user: User | null;
    login: (credentials: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
    hasPermission: (permission: string) => boolean;
    hasRole: (role: string) => boolean;
    updateUserProfile: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Verificar sesión al inicializar
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            const accessToken = TokenStorage.getAccessToken();
            
            if (accessToken && !TokenStorage.isTokenExpired(accessToken)) {
                // Token válido, obtener información del usuario
                const userData = await authService.getCurrentUser();
                setUser(userData);
            } else {
                // Token expirado o no existe, intentar refrescar
                const refreshToken = TokenStorage.getRefreshToken();
                
                if (refreshToken) {
                    await refreshTokens();
                } else {
                    // No hay tokens, limpiar estado
                    TokenStorage.clearTokens();
                }
            }
        } catch (error) {
            console.error('Error initializing auth:', error);
            TokenStorage.clearTokens();
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (credentials: LoginRequest): Promise<void> => {
        try {
            setIsLoading(true);
            
            const response = await authService.login(credentials);
            
            // Guardar tokens de Django DRF
            TokenStorage.setTokens(response.access, response.refresh);
            
            // Actualizar estado del usuario
            setUser(response.user);
            
            // Mantener compatibilidad con el localStorage existente
            localStorage.setItem('euroSession', JSON.stringify({
                user: response.user.username,
                role: response.user.role,
                loginTime: new Date().toISOString(),
                userId: response.user.id
            }));
            
            // No mostrar toast de éxito - redirigir directamente
            
        } catch (error: any) {
            console.error('Login error:', error);
            
            // Mostrar el mensaje de error tal como viene del API client
            // que ya tiene el procesamiento específico según el status code
            toast({
                title: "Error de inicio de sesión",
                description: error.message || "Error al iniciar sesión",
                variant: "destructive"
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        try {
            setIsLoading(true);
            
            // Notificar al servidor
            await authService.logout();
            
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Limpiar estado local
            setUser(null);
            TokenStorage.clearTokens();
            setIsLoading(false);
            
            // Redirigir al login
            window.location.href = '/login';
        }
    };

    const refreshTokens = async (): Promise<void> => {
        try {
            const refreshToken = TokenStorage.getRefreshToken();
            
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }
            
            const response = await authService.refreshToken({ refresh: refreshToken });
            
            // Actualizar tokens de Django DRF
            TokenStorage.setTokens(response.access, response.refresh);
            
            // Actualizar usuario
            setUser(response.user);
            
        } catch (error) {
            console.error('Token refresh error:', error);
            TokenStorage.clearTokens();
            setUser(null);
            throw error;
        }
    };

    const hasPermission = (permission: string): boolean => {
        return user?.permissions?.includes(permission) || false;
    };

    const hasRole = (role: string): boolean => {
        return user?.role === role;
    };

    const updateUserProfile = (userData: Partial<User>): void => {
        if (user) {
            setUser({ ...user, ...userData });
        }
    };

    const value: AuthContextType = {
        user,
        login,
        logout,
        refreshToken: refreshTokens,
        isAuthenticated: !!user,
        isLoading,
        hasPermission,
        hasRole,
        updateUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
