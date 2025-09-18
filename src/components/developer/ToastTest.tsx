import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ToastTest() {
    const { toast } = useToast();

    const testToasts = [
        {
            variant: "default" as const,
            title: "Información general",
            description: "Este es un toast de información predeterminado con fondo sólido",
            label: "Default"
        },
        {
            variant: "success" as const,
            title: "¡Operación exitosa!",
            description: "La operación se completó correctamente sin problemas",
            label: "Success"
        },
        {
            variant: "destructive" as const,
            title: "Error en la operación",
            description: "Usuario o contraseña incorrectos. Verifica e intenta nuevamente.",
            label: "Error"
        },
        {
            variant: "warning" as const,
            title: "Advertencia importante",
            description: "Esta acción requiere confirmación antes de continuar",
            label: "Warning"
        },
        {
            variant: "info" as const,
            title: "Descarga iniciada",
            description: "Descargando documento_ejemplo.pdf",
            label: "Info"
        }
    ];

    const showToast = (toastConfig: any) => {
        toast({
            title: toastConfig.title,
            description: toastConfig.description,
            variant: toastConfig.variant,
        });
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Test de Alertas Mejoradas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {testToasts.map((toastConfig, index) => (
                    <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => showToast(toastConfig)}
                    >
                        {toastConfig.label}
                    </Button>
                ))}
            </CardContent>
        </Card>
    );
}

export default ToastTest;
