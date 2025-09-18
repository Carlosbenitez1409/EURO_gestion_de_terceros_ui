// Sistema de notificaciones usando toast en lugar de alerts del navegador
import { toast } from "@/hooks/use-toast";

export const showNotification = {
  success: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
      className: "bg-green-50 border-green-200 text-green-800",
    });
  },
  
  error: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    });
  },
  
  warning: (title: string, description?: string) => {
    toast({
      title,
      description,
      className: "bg-yellow-50 border-yellow-200 text-yellow-800",
    });
  },
  
  info: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
    });
  }
};

// Hook compatible con la interfaz anterior para facilitar la migración
export const useNotification = () => {
  return {
    toast: ({ title, description, variant }: { 
      title: string; 
      description?: string; 
      variant?: 'default' | 'destructive' | 'success' | 'warning' 
    }) => {
      switch (variant) {
        case 'destructive':
          showNotification.error(title, description);
          break;
        case 'success':
          showNotification.success(title, description);
          break;
        case 'warning':
          showNotification.warning(title, description);
          break;
        default:
          showNotification.info(title, description);
      }
    }
  };
};
