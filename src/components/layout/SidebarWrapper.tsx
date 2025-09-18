import { useAuth } from "@/context/AuthContext";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";

interface SidebarWrapperProps {
    onNavigate: (path: string) => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export function SidebarWrapper({ onNavigate, isCollapsed, onToggleCollapse }: SidebarWrapperProps) {
    const { user } = useAuth();
    const location = useLocation();
    
    return (
        <Sidebar
            userRole={user?.role || "procesos"}
            currentPath={location.pathname}
            onNavigate={onNavigate}
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
        />
    );
}
