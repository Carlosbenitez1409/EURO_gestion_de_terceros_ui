import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageLoading } from "@/components/common/LoadingStates";
import { 
    Building2, 
    Shield, 
    User, 
    Lock, 
    Eye, 
    EyeOff, 
    Star, 
    CheckCircle, 
    ShoppingCart,
    ArrowRight,
    ArrowLeft,
    UserPlus,
    AlertCircle,
    UserCheck,
    FileCheck
} from "lucide-react";
import logoEuro from "@/assets/supermercadoseleuro.png";
import { LoginRequest } from "@/types/api.types";

interface LoginProps {
    onLogin?: (role: string, userName: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
    const { login, isLoading: authLoading } = useAuth();
    const [usuario, setUsuario] = useState("");
    const [password, setPassword] = useState("");
    const [rol, setRol] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(true);

    const roles = [
        { 
            value: "procesos", 
            label: "Procesos", 
            icon: Shield, 
            description: "Acceso completo - gestión de terceros, documentos, validaciones y reportes",
            dashboard: "/dashboard/procesos"
        },
        { 
            value: "comercial", 
            label: "Comercial", 
            icon: ShoppingCart, 
            description: "Vista limitada - revisión y aprobación de proveedores únicamente",
            dashboard: "/dashboard/comercial"
        },
        { 
            value: "gestion_humana", 
            label: "Gestión Humana", 
            icon: User, 
            description: "Formulario simple - registro de empleados y notificaciones básicas",
            dashboard: "/dashboard/gestion-humana"
        },
        { 
            value: "administrador", 
            label: "Administrador", 
            icon: UserCheck, 
            description: "Acceso completo - gestión total del sistema y flujo de aprobaciones",
            dashboard: "/dashboard/administrador"
        },
        { 
            value: "oficial_cumplimiento", 
            label: "Oficial de Cumplimiento", 
            icon: FileCheck, 
            description: "Evaluación especializada - aprobación final para casos de riesgo LA/FT",
            dashboard: "/terceros/flujo-aprobacion"
        }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!usuario || !password || !rol) {
            setError("Por favor completa todos los campos");
            return;
        }

        setLoading(true);

        try {
            // Pequeño delay para mostrar la página de carga
            await new Promise(resolve => setTimeout(resolve, 1500));

            const credentials: LoginRequest = {
                username: usuario,
                password: password,
                role: rol as 'procesos' | 'comercial' | 'gestion_humana' | 'administrador' | 'oficial_cumplimiento'
            };

            await login(credentials);
            
            // Redirigir al dashboard después del login exitoso
            window.location.href = '/dashboard';        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || "Error de autenticación. Verifica tus credenciales.");
        } finally {
            setLoading(false);
        }
    };

    // Mostrar página de carga durante la autenticación
    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0033A0] via-[#0033A0]/90 to-[#001A5C] flex items-center justify-center p-4 relative overflow-hidden">
                {/* Elementos decorativos de fondo */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-10 left-10 opacity-10">
                        <Star className="h-24 w-24 text-yellow-400 animate-pulse" />
                    </div>
                    <div className="absolute top-1/4 right-20 opacity-10">
                        <CheckCircle className="h-32 w-32 text-yellow-400 animate-bounce" style={{ animationDuration: '3s' }} />
                    </div>
                    <div className="absolute bottom-20 left-1/4 opacity-10">
                        <ShoppingCart className="h-28 w-28 text-yellow-400 animate-pulse" style={{ animationDelay: '1s' }} />
                    </div>
                    <div className="absolute bottom-10 right-10 opacity-10">
                        <Star className="h-20 w-20 text-yellow-400 animate-pulse" style={{ animationDelay: '2s' }} />
                    </div>
                </div>

                {/* Card con la página de carga */}
                <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm relative z-10">
                    <CardHeader className="text-center pb-4">
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <img 
                                    src={logoEuro} 
                                    alt="Supermercado Euro" 
                                    className="h-16 w-16 object-cover rounded-full shadow-lg border-2 border-[#FFD700]"
                                />
                                {/* Anillo decorativo */}
                                <div className="absolute inset-0 rounded-full border-2 border-[#0033A0]/20 animate-pulse"></div>
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-[#0033A0] flex items-center justify-center gap-2">
                            <Shield className="h-6 w-6 text-[#FFD700]" />
                            Autenticando...
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PageLoading message="Verificando credenciales y preparando su dashboard..." />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0033A0] via-[#0033A0]/90 to-[#001A5C] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Botón Registro de Proveedor en esquina superior derecha */}
            <div className="absolute top-6 right-6 z-10">
                <Button
                    onClick={() => window.location.href = '/proveedor-registro'}
                    className="justify-center whitespace-nowrap rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-accent-foreground h-10 px-4 py-2 bg-[#FFD700] hover:bg-[#FFC107] text-[#0033A0] font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-white/20 flex items-center gap-2"
                >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Registro de Proveedor
                </Button>
            </div>

            {/* Elementos decorativos de fondo */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-10 left-10 opacity-10">
                    <Star className="h-24 w-24 text-yellow-400 animate-pulse" />
                </div>
                <div className="absolute top-1/4 right-20 opacity-10">
                    <CheckCircle className="h-32 w-32 text-yellow-400 animate-bounce" style={{ animationDuration: '3s' }} />
                </div>
                <div className="absolute bottom-20 left-1/4 opacity-10">
                    <ShoppingCart className="h-28 w-28 text-yellow-400 animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
                <div className="absolute bottom-10 right-10 opacity-10">
                    <Star className="h-20 w-20 text-yellow-400 animate-pulse" style={{ animationDelay: '2s' }} />
                </div>
            </div>

            <div className="w-full max-w-lg space-y-8 z-10">
                {/* Logo y título renovado */}
                <div className="text-center space-y-6">
                    <div className="relative flex justify-center">
                        <div className="relative">
                            <img src={logoEuro} alt="Logo EURO" className="h-24 w-24 rounded-full shadow-lg" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-5xl font-black text-white tracking-tight">
                            <span className="text-[#FFD700]">E</span>URO
                        </h1>
                        <p className="text-xl text-white/90 font-medium">Sistema de Gestión de Terceros</p>
                        <p className="text-sm text-white/70">Tu aliado en el ahorro y la gestión empresarial</p>
                    </div>
                </div>

                {/* Formulario de login renovado */}
                <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
                    <CardHeader className="space-y-3 pb-6">
                        <CardTitle className="text-3xl font-bold text-center text-[#0033A0] flex items-center justify-center gap-2">
                            <Shield className="h-8 w-8 text-[#FFD700]" />
                            Iniciar Sesión
                        </CardTitle>
                        <CardDescription className="text-center text-gray-600 text-base">
                            Accede a tu panel de gestión empresarial
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="usuario" className="text-[#0033A0] font-semibold text-sm">Usuario</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#0033A0]/70" />
                                    <Input
                                        id="usuario"
                                        type="text"
                                        placeholder="Ingresa tu usuario"
                                        value={usuario}
                                        onChange={(e) => setUsuario(e.target.value)}
                                        className="h-12 pl-10 border-2 border-[#E8F4FD] focus:border-[#0033A0] focus:ring-4 focus:ring-[#0033A0]/10 bg-white text-[#0033A0] placeholder:text-[#0033A0]/60 transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg"
                                        aria-label="Campo de usuario"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[#0033A0] font-semibold text-sm">Contraseña</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#0033A0]/70" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Ingresa tu contraseña"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 pl-10 pr-10 border-2 border-[#E8F4FD] focus:border-[#0033A0] focus:ring-4 focus:ring-[#0033A0]/10 bg-white text-[#0033A0] placeholder:text-[#0033A0]/60 transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg"
                                        style={{
                                            fontFamily: 'inherit !important',
                                            letterSpacing: 'normal !important',
                                            fontVariantNumeric: 'normal !important'
                                        }}
                                        aria-label="Campo de contraseña"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-[#0033A0]/10 transition-colors duration-150"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        {showPassword ? (
                                            <Eye className="h-4 w-4 text-[#0033A0]/70" />
                                        ) : (
                                            <EyeOff className="h-4 w-4 text-[#0033A0]/70" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rol" className="text-[#0033A0] font-semibold text-sm">Rol de Usuario</Label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#0033A0]/70" />
                                    <select
                                        id="rol"
                                        value={rol}
                                        onChange={(e) => setRol(e.target.value)}
                                        className="w-full h-12 pl-10 pr-4 border-2 border-[#E8F4FD] focus:border-[#0033A0] focus:ring-4 focus:ring-[#0033A0]/10 bg-white text-[#0033A0] rounded-md appearance-none transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg"
                                        style={{
                                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%230033A0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='m6 9 6 6 6-6'/%3e%3c/svg%3e")`,
                                            backgroundPosition: 'right 0.75rem center',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundSize: '20px 20px'
                                        }}
                                    >
                                        <option value="" disabled className="text-[#0033A0]/60">
                                            Selecciona tu rol en el sistema
                                        </option>
                                        {roles.map((role) => (
                                            <option key={role.value} value={role.value} className="text-[#0033A0]">
                                                {role.label}
                                            </option>
                                        ))}
                                    </select>
                                    
                                    {/* Indicador visual del rol seleccionado cuando hay una selección */}
                                    {rol && (
                                        <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                                            {(() => {
                                                const selectedRole = roles.find(r => r.value === rol);
                                                const Icon = selectedRole?.icon || Shield;
                                                return (
                                                    <div className="p-1 bg-[#0033A0] rounded-md">
                                                        <Icon className="h-3 w-3 text-white" />
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Vista previa del rol seleccionado */}
                                {rol && (
                                    <div className="mt-3 p-3 bg-[#0033A0]/5 border border-[#0033A0]/20 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <span className="font-medium text-[#0033A0]">
                                                Accederás al {roles.find(r => r.value === rol)?.label} Dashboard
                                            </span>
                                        </div>
                                        <p className="text-xs text-[#0033A0]/70 mt-1">
                                            {roles.find(r => r.value === rol)?.description}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <Alert variant="destructive" className="border-red-200 bg-red-50">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="font-medium">{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 bg-gradient-to-r from-[#FFD700] to-[#FFC107] hover:from-[#FFC107] hover:to-[#FFB300] text-[#0033A0] font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-[#FFD700]/20"
                                disabled={loading || authLoading}
                            >
                                <Shield className="h-5 w-5 mr-2" />
                                Iniciar Sesión
                                <ArrowRight className="h-5 w-5 ml-2" />
                            </Button>
                        </form>
                        
                        {/* Espacio para futuras opciones */}
                        <div className="pt-4 border-t border-gray-200">
                        </div>
                    </CardContent>
                </Card>

                {/* Información y enlaces legales */}
                <div className="text-center space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/60">
                        <a href="#" className="hover:text-white/90 transition-colors">Términos de Servicio</a>
                        <a href="#" className="hover:text-white/90 transition-colors">Política de Privacidad</a>
                        <a href="#" className="hover:text-white/90 transition-colors">Soporte Técnico</a>
                        <a href="#" className="hover:text-white/90 transition-colors">Contacto</a>
                    </div>
                    
                    <p className="text-xs text-white/50">
                        © 2025 Supermercado Euro. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}