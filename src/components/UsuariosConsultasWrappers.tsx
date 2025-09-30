import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import UsuariosConsultas from '../pages/UsuariosConsultas';
import NuevaSolicitud from '../pages/NuevaSolicitud';
import DetalleSolicitud from '../pages/DetalleSolicitud';

interface UsuariosConsultasWrapperProps {
  children?: React.ReactNode;
}

const UsuariosConsultasLayoutWrapper: React.FC<UsuariosConsultasWrapperProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleShowProfile = () => {
    navigate('/profile');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppLayout
      userRole={user?.role || 'gestion_humana'}
      userName={user ? `${user.first_name} ${user.last_name}`.trim() || user.username : 'Usuario'}
      currentPath={location.pathname}
      onNavigate={handleNavigate}
      onShowProfile={handleShowProfile}
      onLogout={handleLogout}
    >
      {children}
    </AppLayout>
  );
};

// Wrapper para la página principal de usuarios-consultas
export const UsuariosConsultasWrapper: React.FC = () => {
  return (
    <UsuariosConsultasLayoutWrapper>
      <UsuariosConsultas />
    </UsuariosConsultasLayoutWrapper>
  );
};

// Wrapper para la página de nueva solicitud
export const NuevaSolicitudWrapper: React.FC = () => {
  return (
    <UsuariosConsultasLayoutWrapper>
      <NuevaSolicitud />
    </UsuariosConsultasLayoutWrapper>
  );
};

// Wrapper para la página de detalle de solicitud
export const DetalleSolicitudWrapper: React.FC = () => {
  return (
    <UsuariosConsultasLayoutWrapper>
      <DetalleSolicitud />
    </UsuariosConsultasLayoutWrapper>
  );
};