import { User, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationSystem } from "@/components/notifications/NotificationSystem";
import { NotificationErrorBoundary } from "@/components/notifications/NotificationErrorBoundary";
import { NotificationFallback } from "@/components/notifications/NotificationFallback";
import UserProfileModal from "../user/UserProfileModal";
import { useState } from "react";

interface HeaderProps {
    userRole: string;
    userName: string;
    onNavigate?: (path: string) => void;
    onShowProfile?: () => void;
    onLogout?: () => void;
}

export function Header({ userRole, userName, onNavigate, onShowProfile, onLogout }: HeaderProps) {
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    
    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#0052CC] rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-[#FFD700] font-bold text-sm">★</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800">EURO - Terceros</h1>
                        <p className="text-sm text-gray-600">Sistema de Gestión de Terceros</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Buscar terceros, documentos..."
                        className="pl-10 w-80 bg-white border-gray-300 focus:border-[#0052CC]"
                    />
                </div>

                {/* Sistema de Notificaciones Moderno */}
                <NotificationErrorBoundary
                    fallback={<NotificationFallback onRetry={() => window.location.reload()} />}
                >
                    <NotificationSystem 
                        userRole={userRole}
                        pollingInterval={30000} // 30 segundos
                    />
                </NotificationErrorBoundary>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2 hover:bg-[#0052CC]/5 transition-colors">
                            <div className="w-8 h-8 bg-[#0052CC] rounded-full flex items-center justify-center shadow-md">
                                <User className="h-4 w-4 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-medium text-[#0052CC]">{userName}</p>
                                <p className="text-xs text-[#0052CC]/70">{userRole}</p>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white border-[#0052CC]/20 shadow-lg">
                        <DropdownMenuLabel className="text-[#0052CC] font-semibold">Mi Cuenta</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-[#0052CC]/20" />
                        <DropdownMenuItem onClick={() => {
                            console.log('🔵 Perfil clickeado en Header - abriendo modal');
                            setIsProfileModalOpen(true);
                        }} className="hover:bg-[#0052CC]/10 text-[#0052CC] focus:bg-[#0052CC]/10 focus:text-[#0052CC] transition-colors">
                            <User className="mr-2 h-4 w-4 text-[#FFD700]" />
                            <span>Perfil</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#0052CC]/20" />
                        <DropdownMenuItem 
                            className="text-red-600 hover:bg-red-50 cursor-pointer" 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Botón de logout clickeado en Header');
                                if (onLogout) {
                                    console.log('Ejecutando función onLogout');
                                    onLogout();
                                } else {
                                    console.warn('onLogout no está definido');
                                }
                            }}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Cerrar Sesión</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            {/* Modal de Perfil */}
            <UserProfileModal 
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                userRole={userRole}
                userName={userName}
            />
        </header>
    );
}