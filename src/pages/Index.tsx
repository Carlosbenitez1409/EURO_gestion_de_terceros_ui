import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
    Building2, 
    Shield, 
    ArrowRight, 
    Star,
    CheckCircle,
    ShoppingCart
} from "lucide-react";
import logoEuro from "@/assets/supermercadoseleuro.png";

const Index = () => {
    // Verificar si ya hay una sesión activa y redirigir automáticamente
    useEffect(() => {
        const session = localStorage.getItem('euroSession');
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                if (sessionData.role) {
                    // Redirigir directamente al dashboard principal
                    window.location.href = '/dashboard/procesos';
                    return;
                }
            } catch (error) {
                // Si hay error en la sesión, eliminarla
                localStorage.removeItem('euroSession');
            }
        }
    }, []);

    const handleLogin = () => {
        window.location.href = '/login';
    };

    const handleProveedorRegistro = () => {
        window.location.href = '/terceros/registro';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0052CC] via-[#0052CC]/95 to-[#003A8C] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Elementos decorativos de fondo */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-10 left-10 opacity-10">
                    <Star className="h-32 w-32 text-[#FFD700] animate-pulse" />
                </div>
                <div className="absolute top-1/4 right-20 opacity-10">
                    <CheckCircle className="h-40 w-40 text-[#FFD700] animate-bounce" style={{ animationDuration: '4s' }} />
                </div>
                <div className="absolute bottom-20 left-1/4 opacity-10">
                    <ShoppingCart className="h-36 w-36 text-[#FFD700] animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
                <div className="absolute bottom-10 right-10 opacity-10">
                    <Building2 className="h-28 w-28 text-[#FFD700] animate-pulse" style={{ animationDelay: '2s' }} />
                </div>
            </div>

            <div className="max-w-4xl mx-auto text-center space-y-12 z-10">
                {/* Logo y título principal */}
                <div className="space-y-8">
                    <div className="relative flex justify-center">
                        <div className="relative">
                            <img src={logoEuro} alt="Logo EURO" className="h-32 w-32 rounded-full shadow-2xl border-4 border-[#FFD700]/30" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-6xl md:text-7xl font-black text-white tracking-tight">
                            <span className="text-[#FFD700]">E</span>URO
                        </h1>
                        <h2 className="text-2xl md:text-3xl text-white/90 font-semibold">
                            Sistema de Gestión de Terceros
                        </h2>
                        <p className="text-lg text-white/80 max-w-2xl mx-auto">
                            Plataforma empresarial moderna para la gestión integral de proveedores, empleados y documentación
                        </p>
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                            onClick={handleLogin}
                            size="lg"
                            className="bg-[#FFD700] hover:bg-[#F2C200] text-[#0052CC] font-bold text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-200 border-2 border-[#FFD700]/30"
                        >
                            <Shield className="h-6 w-6 mr-3" />
                            Acceso de Empleados
                            <ArrowRight className="h-6 w-6 ml-3" />
                        </Button>
                        
                        <Button
                            onClick={handleProveedorRegistro}
                            variant="outline"
                            size="lg"
                            className="border-2 border-white/30 text-white hover:bg-white/10 font-semibold text-lg px-8 py-6 backdrop-blur-sm"
                        >
                            <Building2 className="h-6 w-6 mr-3" />
                            Registro de Proveedores
                            <ArrowRight className="h-6 w-6 ml-3" />
                        </Button>
                    </div>
                    
                    <p className="text-sm text-white/60">
                        ¿Eres empleado de EURO? Utiliza tus credenciales para acceder. 
                        <br />
                        ¿Eres un proveedor externo? Regístrate para comenzar el proceso de aprobación.
                    </p>
                </div>

                {/* Footer informativo */}
                <div className="border-t border-white/20 pt-8 mt-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-white/50">
                        <div className="space-y-1">
                            <a href="#" className="hover:text-white/80 transition-colors block">Términos de Servicio</a>
                            <a href="#" className="hover:text-white/80 transition-colors block">Política de Privacidad</a>
                        </div>
                        <div className="space-y-1">
                            <a href="#" className="hover:text-white/80 transition-colors block">Soporte Técnico</a>
                            <a href="#" className="hover:text-white/80 transition-colors block">Contacto</a>
                        </div>
                    </div>
                    <p className="text-xs text-white/40 mt-4">
                        © 2025 Supermercado Euro. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Index;
