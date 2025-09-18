import { lazy, Suspense, useState } from 'react';
import { LoadingSpinner } from './common/LoadingStates';
import { useAuth } from '@/context/AuthContext';
import { UserProvider } from '../hooks/useUser';
import GestionHumanaDashboard from '../pages/GestionHumanaDashboard';
import ProcesosDashboard from '../pages/ProcesosDashboard';
import UserProfileModal from '@/components/user/UserProfileModal';

// Lazy load de páginas
const ConsolidadoTerceros = lazy(() => import('../pages/ConsolidadoTerceros'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const TercerosModulo = lazy(() => import('../pages/TercerosModulo'));

// Wrappers con Suspense para evitar conflictos de tipos
export const TercerosListWrapper = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'user';
  
  return (
    <UserProvider>
      <Suspense fallback={<div className="flex justify-center p-8"><LoadingSpinner size="lg" /></div>}>
        <TercerosModulo />
      </Suspense>
    </UserProvider>
  );
};

export const ConsolidadoTercerosWrapper = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'user';
  
  return (
    <UserProvider>
      <Suspense fallback={<div className="flex justify-center p-8"><LoadingSpinner size="lg" /></div>}>
        <ConsolidadoTerceros userRole={userRole} />
      </Suspense>
    </UserProvider>
  );
};

// Dashboard wrapper con diferentes roles y dashboards específicos
export const DashboardWrapper = ({ userRole }: { userRole: "procesos" | "comercial" | "gestion_humana" }) => {
  
  // Determinar qué dashboard mostrar según el rol
  const renderDashboard = () => {
    switch (userRole) {
      case 'comercial':
        // Usar el dashboard genérico para comercial también
        return (
          <Suspense fallback={<div className="flex justify-center p-8"><LoadingSpinner size="lg" /></div>}>
            <Dashboard userRole={userRole} />
          </Suspense>
        );
      case 'procesos':
        return <ProcesosDashboard userRole={userRole} />;
      case 'gestion_humana':
        return <GestionHumanaDashboard userRole={userRole} />;
      default:
        // Dashboard genérico para otros roles
        return (
          <Suspense fallback={<div className="flex justify-center p-8"><LoadingSpinner size="lg" /></div>}>
            <Dashboard userRole={userRole} />
          </Suspense>
        );
    }
  };
  
  return (
    <UserProvider>
      {renderDashboard()}
    </UserProvider>
  );
};

export const UserProfileWrapper = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'user';
  const userName = user?.full_name || `${user?.first_name} ${user?.last_name}`.trim() || user?.username || 'Usuario';
  const [isModalOpen, setIsModalOpen] = useState(true); // Se abre automáticamente cuando se accede a la ruta
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0052CC] to-[#1E40AF]">
      <UserProfileModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          // Redirigir al dashboard o página anterior
          window.history.back();
        }}
        userRole={userRole}
        userName={userName}
      />
    </div>
  );
};

// Wrapper adicional para futuras páginas
export const TercerosModuloWrapper = () => {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><LoadingSpinner size="lg" /></div>}>
      <TercerosModulo />
    </Suspense>
  );
};
