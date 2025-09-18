import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

interface NotificationFallbackProps {
  onRetry?: () => void;
}

export function NotificationFallback({ onRetry }: NotificationFallbackProps) {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="relative opacity-50 cursor-not-allowed"
      onClick={onRetry}
      title="Sistema de notificaciones temporalmente no disponible. Click para reintentar."
    >
      <Bell className="h-5 w-5" />
      <Badge 
        variant="outline" 
        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs border-gray-300 bg-gray-100 text-gray-500"
      >
        !
      </Badge>
    </Button>
  );
}
