import { useState } from "react";
import {
    Home,
    Users,
    FileText,
    Settings,
    BarChart3,
    Shield,
    ChevronDown,
    ChevronRight,
    Menu,
    X,
    CheckCircle2,
    Clock,
    AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
    userRole: string;
    currentPath: string;
    onNavigate: (path: string) => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

interface MenuItem {
    id: string;
    label: string;
    icon: any;
    path: string;
    roles: string[];
    badge?: number;
    badgeVariant?: "default" | "destructive" | "secondary" | "outline";
    children?: MenuItem[];
    description?: string;
}

// Configuración del menú optimizada por roles
const menuItems: MenuItem[] = [
    {
        id: "dashboard",
        label: "Dashboard",
        icon: Home,
        path: "/dashboard",
        roles: ["comercial", "procesos", "gestion_humana", "administrador"],
        description: "Vista principal con métricas y gestión de terceros"
    },
    {
        id: "empleados",
        label: "Usuarios",
        icon: Users,
        path: "/empleados",
        roles: ["gestion_humana", "administrador"],
        badge: 5,
        badgeVariant: "secondary",
        description: "Gestión exclusiva de empleados",
        children: [
            {
                id: "empleados-registro",
                label: "Nuevo usuario",
                icon: Users,
                path: "/empleados/registro",
                roles: ["gestion_humana", "administrador"]
            },
            {
                id: "empleados-lista",
                label: "Lista de usuarios",
                icon: Users,
                path: "/empleados/lista",
                roles: ["gestion_humana", "administrador"],
                badge: 5,
                badgeVariant: "secondary"
            }
        ]
    },
    {
        id: "usuarios",
        label: "Empleados",
        icon: Users,
        path: "/usuarios",
        roles: ["procesos", "administrador"],
        description: "Administración de usuarios"
    },
];

export function Sidebar({ userRole, currentPath, onNavigate, isCollapsed = false, onToggleCollapse }: SidebarProps) {
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const toggleExpanded = (itemId: string) => {
        if (isCollapsed) return; // No expandir en modo colapsado
        
        setExpandedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    // Filtrar items por rol del usuario
    const visibleItems = menuItems.filter(item => item.roles.includes(userRole));

    const renderMenuItem = (item: MenuItem, level = 0) => {
        if (!item.roles.includes(userRole)) return null;

        const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
        const isExpanded = expandedItems.includes(item.id);
        const hasChildren = item.children && item.children.length > 0;

        return (
            <div key={item.id} className="relative">
                <Button
                    variant={isActive ? "default" : "ghost"}
                    size={isCollapsed ? "sm" : "default"}
                    className={cn(
                        "w-full transition-all duration-200 text-left relative group",
                        level > 0 ? "ml-4 w-[calc(100%-1rem)]" : "",
                        isCollapsed ? "justify-center px-2" : "justify-start gap-3 px-3",
                        "mb-1",
                        isActive 
                            ? "bg-[#0052CC] text-white shadow-lg hover:bg-[#003A8C]" 
                            : "text-gray-700 hover:bg-[#E3F2FD] hover:text-[#0052CC]",
                        level > 0 && !isActive && "text-gray-600 hover:bg-[#F8FAFC]"
                    )}
                    onClick={() => {
                        if (hasChildren && !isCollapsed) {
                            toggleExpanded(item.id);
                        } else {
                            onNavigate(item.path);
                        }
                    }}
                >
                    {/* Indicador activo */}
                    {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD700] rounded-r-full" />
                    )}
                    
                    <item.icon className={cn(
                        "flex-shrink-0 transition-colors",
                        isCollapsed ? "h-5 w-5" : "h-4 w-4",
                        isActive 
                            ? "text-white" 
                            : "text-gray-600 group-hover:text-[#0052CC]"
                    )} />
                    
                    {!isCollapsed && (
                        <>
                            <span className="flex-1 text-left truncate min-w-0 font-medium">
                                {item.label}
                            </span>
                            
                            {item.badge && (
                                <Badge 
                                    variant={item.badgeVariant || "outline"}
                                    className={cn(
                                        "h-5 text-xs font-medium flex-shrink-0 transition-colors",
                                        isActive && item.badgeVariant === "outline" && "bg-[#FFD700] text-[#0052CC] border-[#FFD700]"
                                    )}
                                >
                                    {item.badge}
                                </Badge>
                            )}
                            
                            {hasChildren && (
                                <div className="ml-auto flex-shrink-0">
                                    {isExpanded ? (
                                        <ChevronDown className={cn(
                                            "h-4 w-4 transition-colors",
                                            isActive ? "text-white" : "text-gray-600"
                                        )} />
                                    ) : (
                                        <ChevronRight className={cn(
                                            "h-4 w-4 transition-colors",
                                            isActive ? "text-white" : "text-gray-600"
                                        )} />
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </Button>

                {/* Tooltip para modo colapsado */}
                {isCollapsed && (
                    <div className="absolute left-full ml-2 top-0 z-50 hidden group-hover:block">
                        <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                            <div className="font-medium">{item.label}</div>
                            {item.description && (
                                <div className="text-xs text-gray-300 mt-1">{item.description}</div>
                            )}
                            {item.badge && (
                                <div className="text-xs text-gray-300 mt-1">
                                    {item.badge} pendientes
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Submenús */}
                {hasChildren && isExpanded && !isCollapsed && (
                    <div className="space-y-1 mt-1 py-2 pl-2 border-l-2 border-[#0052CC]/20 ml-6 bg-gradient-to-r from-[#F8FAFC] to-transparent rounded-r-lg">
                        {item.children?.map(child => (
                            <Button
                                key={child.id}
                                variant={currentPath === child.path ? "default" : "ghost"}
                                size={isCollapsed ? "sm" : "default"}
                                className={cn(
                                    "w-full transition-all duration-200 text-left relative group",
                                    "ml-4 w-[calc(100%-1rem)]",
                                    isCollapsed ? "justify-center px-2" : "justify-start gap-3 px-3",
                                    "mb-1",
                                    currentPath === child.path
                                        ? "bg-[#0052CC] text-white shadow-lg hover:bg-[#003A8C]"
                                        : "text-gray-600 hover:bg-[#F8FAFC]"
                                )}
                                onClick={() => onNavigate(child.path)}
                            >
                                <child.icon className={cn(
                                    "flex-shrink-0 transition-colors",
                                    isCollapsed ? "h-5 w-5" : "h-4 w-4",
                                    currentPath === child.path
                                        ? "text-white"
                                        : "text-gray-600 group-hover:text-[#0052CC]"
                                )} />
                                <span className="flex-1 text-left truncate min-w-0 font-medium">
                                    {child.label}
                                </span>
                                {child.badge && (
                                    <Badge
                                        variant={child.badgeVariant || "outline"}
                                        className={cn(
                                            "h-5 text-xs font-medium flex-shrink-0 transition-colors",
                                            currentPath === child.path && child.badgeVariant === "outline" && "bg-[#FFD700] text-[#0052CC] border-[#FFD700]"
                                        )}
                                    >
                                        {child.badge}
                                    </Badge>
                                )}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className={cn(
            "bg-white border-r border-gray-200 shadow-lg transition-all duration-300 flex flex-col",
            isCollapsed ? "w-16" : "w-64"
        )}>
            {/* Header del Sidebar */}
            <div className={cn(
                "border-b border-gray-200 bg-gradient-to-r from-[#0052CC] to-[#003A8C] flex-shrink-0",
                isCollapsed ? "p-2" : "p-4"
            )}>
                <div className="flex items-center gap-3">
                    {onToggleCollapse && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onToggleCollapse}
                            className="text-white hover:bg-white/10 p-1 h-8 w-8"
                        >
                            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </Button>
                    )}
                    
                    {!isCollapsed && (
                        <>
                            <div className="min-w-0">
                                <h2 className="text-white font-bold text-sm truncate">EURO</h2>
                                <p className="text-blue-100 text-xs truncate">Gestión de Terceros</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Indicador de rol */}
            {!isCollapsed && (
                <div className="px-4 py-2 bg-gradient-to-r from-[#FFD700]/10 to-transparent border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            userRole === "procesos" && "bg-green-500",
                            userRole === "comercial" && "bg-blue-500",
                            userRole === "gestion_humana" && "bg-purple-500"
                        )} />
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                            {userRole === "gestion_humana" ? "Gestión Humana" : 
                            userRole === "procesos" ? "Procesos" : "Comercial"}
                        </span>
                    </div>
                </div>
            )}

            {/* Navegación principal */}
            <nav className={cn(
                "flex-1 space-y-1 overflow-y-auto",
                isCollapsed ? "p-2" : "p-4"
            )}>
                {visibleItems.map(item => renderMenuItem(item))}
            </nav>

            {/* Footer con información del sistema */}
            {!isCollapsed && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">
                            {userRole === "procesos" && "Acceso completo al sistema"}
                            {userRole === "comercial" && "Dashboard y gestión comercial"}
                            {userRole === "gestion_humana" && "Gestión de empleados"}
                        </div>
                        <div className="text-xs text-gray-400">
                            EURO © 2025
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}