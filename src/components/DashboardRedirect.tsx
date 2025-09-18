import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

// Componente que redirige al dashboard específico según el rol
export function DashboardRedirect() {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0052CC] mx-auto"></div>
                    <p className="text-muted-foreground">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // Por defecto redirigir a página principal, a menos que se especifique dashboard
    const currentUrl = window.location.pathname;
    if (currentUrl === '/dashboard') {
        // Redirigir al dashboard específico según el rol
        const dashboardUrls = {
            'procesos': '/dashboard/procesos',
            'comercial': '/dashboard/comercial',
            'gestion_humana': '/dashboard/gestion-humana',
            'administrador': '/dashboard/administrador',
            'oficial_cumplimiento': '/dashboard/cumplimiento'
        };

        const dashboardUrl = dashboardUrls[user.role as keyof typeof dashboardUrls] || '/dashboard/procesos';
        return <Navigate to={dashboardUrl} replace />;
    }

    // Si llega aquí desde otra ruta, redirigir al dashboard específico del usuario
    const dashboardUrls = {
        'procesos': '/dashboard/procesos',
        'comercial': '/dashboard/comercial',
        'gestion_humana': '/dashboard/gestion-humana',
        'administrador': '/dashboard/administrador',
        'oficial_cumplimiento': '/dashboard/cumplimiento'
    };
    
    const userDashboard = dashboardUrls[user.role as keyof typeof dashboardUrls] || '/dashboard/procesos';
    return <Navigate to={userDashboard} replace />;
}
