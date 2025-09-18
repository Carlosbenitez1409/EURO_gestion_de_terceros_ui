import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string | string[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0052CC] mx-auto"></div>
                    <p className="text-muted-foreground">Verificando sesión...</p>
                </div>
            </div>
        );
    }

    // Si no hay sesión, redirigir al login
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // Si se requiere un rol específico y no coincide, redirigir al dashboard principal
    if (requiredRole) {
        if (Array.isArray(requiredRole)) {
            if (!requiredRole.includes(user.role)) {
                return <Navigate to="/dashboard" replace />;
            }
        } else {
            if (user.role !== requiredRole) {
                return <Navigate to="/dashboard" replace />;
            }
        }
    }

    return <>{children}</>;
}
