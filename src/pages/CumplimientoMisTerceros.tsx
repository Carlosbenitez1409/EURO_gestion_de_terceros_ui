import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { CumplimientoDashboard } from "@/components/terceros/CumplimientoDashboard";
import { logoutUser } from "@/utils/logout.util";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, AlertCircle } from "lucide-react";

export default function CumplimientoMisTerceros() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Verificar que el usuario sea oficial de cumplimiento
    if (!user || user.role !== 'oficial_cumplimiento') {
        return (
            <AppLayout
                userRole={user?.role || 'procesos'}
                userName={user?.email || 'Usuario'}
                currentPath="/cumplimiento/mis-terceros"
                onNavigate={(path) => navigate(path)}
                onLogout={logoutUser}
            >
                <div className="flex items-center justify-center min-h-96">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="h-5 w-5" />
                                Acceso Denegado
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">
                                Esta página está disponible únicamente para oficiales de cumplimiento.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            userRole={user.role}
            userName={user.email}
            currentPath="/cumplimiento/mis-terceros"
            onNavigate={(path) => navigate(path)}
            onLogout={logoutUser}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Shield className="h-7 w-7 text-purple-600" />
                            Mis Terceros - Cumplimiento
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Terceros asignados a {user.first_name} {user.last_name} para revisión de cumplimiento
                        </p>
                    </div>
                    <Button 
                        onClick={() => navigate('/dashboard')}
                        variant="outline"
                        className="gap-2"
                    >
                        <Shield className="h-4 w-4" />
                        Volver al Dashboard
                    </Button>
                </div>

                {/* Dashboard de cumplimiento */}
                <CumplimientoDashboard />
            </div>
        </AppLayout>
    );
}
