import { useState } from "react";
import { Header } from "./Header";
import { SidebarWrapper } from "./SidebarWrapper";
import { useUser } from "../../hooks/useUser";
import { getRoleConfig } from "../../config/roles";

interface AppLayoutProps {
    children: React.ReactNode;
    userRole: string;
    userName: string;
    currentPath: string;
    onNavigate: (path: string) => void;
    onShowProfile?: () => void;
    onLogout?: () => void;
}

export function AppLayout({
    children,
    userRole,
    userName,
    currentPath,
    onNavigate,
    onShowProfile,
    onLogout
}: AppLayoutProps) {
    const { user } = useUser();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    // Usar datos reales del usuario si están disponibles
    const realUserName = user 
        ? `${user.first_name} ${user.last_name}`.trim() || user.username 
        : userName;
    const realUserRole = user?.role || userRole;
    const roleConfig = getRoleConfig(realUserRole);

    const handleToggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Header
                userRole={roleConfig.displayName}
                userName={realUserName}
                onNavigate={onNavigate}
                onShowProfile={onShowProfile}
                onLogout={onLogout}
            />

            <div className="flex">
                <SidebarWrapper
                    onNavigate={onNavigate}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={handleToggleSidebar}
                />

                <main className={`flex-1 p-6 bg-gray-50 min-h-[calc(100vh-theme(spacing.16))] overflow-y-auto transition-all duration-300 ${
                    isSidebarCollapsed ? 'ml-0' : ''
                }`}>
                    {children}
                </main>
            </div>
        </div>
    );
}