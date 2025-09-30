import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TercerosModulo from "./pages/TercerosModulo";
import PaginaPrincipal from "./pages/PaginaPrincipal";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ProveedorRegistro from "./pages/ProveedorRegistro";
import EmpleadosRegistroSimple from "./pages/EmpleadosRegistroSimple";
import EmpleadosRegistro from "./pages/EmpleadosRegistro";
import EmpleadoChangePassword from "./pages/EmpleadoChangePassword";
import EndpointDebug from "./pages/EndpointDebug";
import EmpleadosList from "./pages/EmpleadosList";
import EmpleadoView from "./pages/EmpleadoView";
import EmpleadoEdit from "./pages/EmpleadoEdit";
import TerceroView from "./pages/TerceroView";
import TerceroEdit from "./pages/TerceroEdit";
import EjemploStradata from "./pages/EjemploStradata";
import TerceroStrataDataDocumentos from "./pages/TerceroStrataDataDocumentos";
import DocumentacionStradata from "./pages/DocumentacionStradata";
import EstadisticasComercial from "./pages/EstadisticasComercial";
import ProcesosMisTerceros from "./pages/ProcesosMisTerceros";
import CumplimientoMisTerceros from "./pages/CumplimientoMisTerceros";
import Comercial from "./pages/Comercial";
import Documentos from "./pages/Documentos";
import Validaciones from "./pages/Validaciones";
import Reportes from "./pages/Reportes";
import FlujoAprobacionTerceros from "./pages/FlujoAprobacionTerceros";
import ProcesosDashboard from "./pages/ProcesosDashboard";
import CumplimientoDashboard from "./pages/CumplimientoDashboard";
import { DashboardRedirect } from "./components/DashboardRedirect";
import { TercerosListWrapper, ConsolidadoTercerosWrapper, UserProfileWrapper } from "./components/PageWrappers";
import Login from "./pages/Login";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { UserProvider } from "./hooks/useUser";
import { 
  UsuariosConsultasWrapper, 
  NuevaSolicitudWrapper, 
  DetalleSolicitudWrapper 
} from "./components/UsuariosConsultasWrappers";

const queryClient = new QueryClient();

// Wrapper simple para Dashboard
const DashboardWithProvider = ({ userRole }: { userRole: "procesos" | "comercial" | "gestion_humana" | "administrador" | "oficial_cumplimiento" }) => (
  <UserProvider>
    <Dashboard userRole={userRole} />
  </UserProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <UserProvider>
          <Toaster />
          {/* <Sonner /> */}
          <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/administrador" element={
            <ProtectedRoute requiredRole="administrador">
              <DashboardWithProvider userRole="administrador" />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/procesos" element={
            <ProtectedRoute requiredRole="procesos">
              <DashboardWithProvider userRole="procesos" />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/comercial" element={
            <ProtectedRoute requiredRole="comercial">
              <DashboardWithProvider userRole="comercial" />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/gestion-humana" element={
            <ProtectedRoute requiredRole="gestion_humana">
              <DashboardWithProvider userRole="gestion_humana" />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/cumplimiento" element={
            <ProtectedRoute requiredRole="oficial_cumplimiento">
              <CumplimientoDashboard userRole="oficial_cumplimiento" />
            </ProtectedRoute>
          } />
          
          <Route path="/terceros/lista" element={
            <ProtectedRoute requiredRole={["comercial", "administrador", "procesos"]}>
              <TercerosListWrapper />
            </ProtectedRoute>
          } />
          <Route path="/terceros/view/:id" element={
            <ProtectedRoute requiredRole={["comercial", "administrador", "procesos", "oficial_cumplimiento"]}>
              <TerceroView />
            </ProtectedRoute>
          } />
          <Route path="/terceros/edit/:id" element={
            <ProtectedRoute requiredRole={["comercial", "administrador", "procesos", "oficial_cumplimiento"]}>
              <TerceroEdit />
            </ProtectedRoute>
          } />
          
          {/* Rutas de Stradata */}
          <Route path="/stradata" element={
            <ProtectedRoute requiredRole={["administrador", "procesos", "oficial_cumplimiento"]}>
              <EjemploStradata />
            </ProtectedRoute>
          } />
          <Route path="/terceros/:terceroId/stradata-documentos" element={
            <ProtectedRoute requiredRole={["administrador", "procesos", "oficial_cumplimiento"]}>
              <TerceroStrataDataDocumentos />
            </ProtectedRoute>
          } />
          <Route path="/stradata/documentacion" element={
            <ProtectedRoute requiredRole={["administrador", "procesos", "oficial_cumplimiento"]}>
              <DocumentacionStradata />
            </ProtectedRoute>
          } />
          
          <Route path="/estadisticas-comercial" element={
            <ProtectedRoute requiredRole="comercial">
              <EstadisticasComercial />
            </ProtectedRoute>
          } />
          <Route path="/procesos/mis-terceros" element={
            <ProtectedRoute requiredRole="procesos">
              <ProcesosMisTerceros />
            </ProtectedRoute>
          } />
          <Route path="/cumplimiento/mis-terceros" element={
            <ProtectedRoute requiredRole="oficial_cumplimiento">
              <CumplimientoMisTerceros />
            </ProtectedRoute>
          } />
          <Route path="/terceros-modulo" element={
            <ProtectedRoute requiredRole={["comercial", "administrador", "procesos"]}>
              <TercerosModulo />
            </ProtectedRoute>
          } />
          <Route path="/proveedor-registro" element={<ProveedorRegistro onComplete={() => {}} onBackToHome={() => window.location.href = '/'} />} />
          <Route path="/terceros/registro" element={<ProveedorRegistro onComplete={() => {}} onBackToHome={() => window.location.href = '/'} />} />
          <Route path="/consolidado-terceros" element={
            <ProtectedRoute requiredRole={["comercial", "administrador", "procesos"]}>
              <ConsolidadoTercerosWrapper />
            </ProtectedRoute>
          } />
          <Route path="/terceros/consolidado" element={
            <ProtectedRoute requiredRole={["comercial", "administrador", "procesos"]}>
              <ConsolidadoTercerosWrapper />
            </ProtectedRoute>
          } />
          <Route path="/terceros/flujo-aprobacion" element={
            <ProtectedRoute requiredRole={["administrador", "procesos", "oficial_cumplimiento"]}>
              <FlujoAprobacionTerceros />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <UserProfileWrapper />
            </ProtectedRoute>
          } />
          <Route path="/validaciones" element={
            <ProtectedRoute>
              <Validaciones />
            </ProtectedRoute>
          } />
          <Route path="/documentos" element={
            <ProtectedRoute>
              <Documentos />
            </ProtectedRoute>
          } />
          <Route path="/reportes" element={
            <ProtectedRoute>
              <Reportes />
            </ProtectedRoute>
          } />
          <Route path="/comercial" element={
            <ProtectedRoute>
              <Comercial />
            </ProtectedRoute>
          } />
          <Route path="/empleados" element={
            <ProtectedRoute requiredRole={["gestion_humana", "procesos", "administrador"]}>
              <EmpleadosList />
            </ProtectedRoute>
          } />
          <Route path="/empleados/lista" element={
            <ProtectedRoute requiredRole={["gestion_humana", "procesos", "administrador"]}>
              <EmpleadosList />
            </ProtectedRoute>
          } />
          <Route path="/empleados/registro" element={
            <ProtectedRoute requiredRole={["gestion_humana", "procesos", "administrador"]}>
              <EmpleadosRegistro />
            </ProtectedRoute>
          } />
          <Route path="/empleados/view/:id" element={
            <ProtectedRoute requiredRole={["procesos", "administrador"]}>
              <EmpleadoView />
            </ProtectedRoute>
          } />
          <Route path="/empleados/edit/:id" element={
            <ProtectedRoute requiredRole={["procesos", "administrador"]}>
              <EmpleadoEdit />
            </ProtectedRoute>
          } />
          <Route path="/empleados/change-password/:id" element={
            <ProtectedRoute requiredRole={["gestion_humana", "procesos", "administrador"]}>
              <EmpleadoChangePassword />
            </ProtectedRoute>
          } />
          <Route path="/debug/endpoints" element={
            <ProtectedRoute requiredRole={["administrador"]}>
              <EndpointDebug />
            </ProtectedRoute>
          } />
          <Route path="/configuracion" element={
            <ProtectedRoute>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Configuración</h1>
                <p className="text-gray-600">Esta funcionalidad estará disponible próximamente.</p>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/configuracion/documentos" element={
            <ProtectedRoute>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Tipos de Documentos</h1>
                <p className="text-gray-600">Esta funcionalidad estará disponible próximamente.</p>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/configuracion/terceros" element={
            <ProtectedRoute>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Tipos de Terceros</h1>
                <p className="text-gray-600">Esta funcionalidad estará disponible próximamente.</p>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/configuracion/validaciones" element={
            <ProtectedRoute>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Configuración de Validaciones</h1>
                <p className="text-gray-600">Esta funcionalidad estará disponible próximamente.</p>
              </div>
            </ProtectedRoute>
          } />
          
          {/* Rutas de Usuarios GH */}
          <Route path="/usuarios-consultas" element={
            <ProtectedRoute requiredRole={["gestion_humana", "administrador", "procesos"]}>
              <UsuariosConsultasWrapper />
            </ProtectedRoute>
          } />
          <Route path="/usuarios-consultas/nueva" element={
            <ProtectedRoute requiredRole={["gestion_humana"]}>
              <NuevaSolicitudWrapper />
            </ProtectedRoute>
          } />
          <Route path="/usuarios-consultas/:id" element={
            <ProtectedRoute requiredRole={["gestion_humana", "administrador", "procesos"]}>
              <DetalleSolicitudWrapper />
            </ProtectedRoute>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
        </UserProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;