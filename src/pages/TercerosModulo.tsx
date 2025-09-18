import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { TerceroForm } from "@/components/terceros/TerceroForm";
import { TerceroDetails } from "@/components/terceros/TerceroDetails";
import { useBackendPagination } from "@/hooks/use-backend-pagination";
import { tercerosDRFService } from "@/services/terceros.drf.service";
import { 
    Search, 
    Filter, 
    Plus, 
    Download, 
    Eye, 
    Edit, 
    Trash2,
    Building,
    User,
    Mail,
    Phone,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { TerceroDRF } from "@/services/terceros.drf.service";

export default function TercerosModulo() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // 🔍 LOGS DETALLADOS PARA VERIFICAR PERMISOS
    console.log('🔍 TercerosModulo - Usuario actual:', {
        user,
        role: user?.role,
        id: user?.id,
        email: user?.email,
        isAuthenticated: !!user
    });
    
    // Debug: Verificar el usuario y rol actual
    console.log("🔍 Debug TercerosModulo - user:", user);
    console.log("🔍 Debug TercerosModulo - user?.role:", user?.role);
    console.log("🔍 Debug TercerosModulo - isAuthenticated:", !!user);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [estadoFilter, setEstadoFilter] = useState("todos");
    const [tipoFilter, setTipoFilter] = useState("todos");
    
    // Función para obtener terceros con filtros y paginación
    const fetchTercerosWithFilters = async (page: number, pageSize: number) => {
        const filters = {
            page,
            page_size: pageSize,
            search: searchTerm || undefined,
            estado: estadoFilter !== "todos" ? estadoFilter : undefined,
            tipo: tipoFilter !== "todos" ? tipoFilter : undefined,
        };
        
        return await tercerosDRFService.getTerceros(filters);
    };
    
    // Hook de paginación backend
    const pagination = useBackendPagination({
        fetchFunction: fetchTercerosWithFilters,
        initialPageSize: 5,
        dependencies: [searchTerm, estadoFilter, tipoFilter]
    });
    
    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedTercero, setSelectedTercero] = useState<string | null>(null);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");

    const handleCreateTercero = () => {
        setFormMode("create");
        setSelectedTercero(null);
        setIsFormOpen(true);
    };

    const handleViewTercero = (terceroId: string) => {
        console.log('🚀 Navegando a vista de tercero:', terceroId);
        console.log('🔍 Usuario actual:', user?.role);
        navigate(`/terceros/view/${terceroId}`);
    };

    const handleEditTercero = (terceroId: string) => {
        console.log('🚀 Abriendo edición de tercero:', terceroId);
        console.log('🔍 Usuario actual:', user?.role);
        setFormMode("edit");
        setSelectedTercero(terceroId);
        setIsFormOpen(true);
    };

    const handleSaveTercero = (tercero: any) => {
        // Después de guardar, refrescar los datos
        pagination.refresh();
    };

    const getEstadoBadge = (estado: string) => {
        const variants = {
            "Pendiente": "secondary",
            "En Revisión": "default",
            "Aprobado": "default",
            "Rechazado": "destructive"
        } as const;

        const colors = {
            "Pendiente": "bg-warning text-warning-foreground",
            "En Revisión": "bg-info text-info-foreground",
            "Aprobado": "bg-success text-success-foreground",
            "Rechazado": "bg-destructive text-destructive-foreground"
        };

        return (
            <Badge variant={variants[estado as keyof typeof variants]} className={colors[estado as keyof typeof colors]}>
                {estado}
            </Badge>
        );
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Gestión de Terceros</h1>
                    <p className="text-muted-foreground">Administra proveedores y empleados del sistema EURO</p>
                </div>
                <Button onClick={handleCreateTercero} className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Tercero
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filtros de Búsqueda
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Input
                                placeholder="Buscar por nombre o email..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    // Los filtros se aplican automáticamente por las dependencies del hook
                                }}
                                className="w-full"
                            />
                        </div>
                        <Select value={estadoFilter} onValueChange={(value) => {
                            setEstadoFilter(value);
                            // Los filtros se aplican automáticamente por las dependencies del hook
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrar por estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos los estados</SelectItem>
                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                <SelectItem value="En Revisión">En Revisión</SelectItem>
                                <SelectItem value="Aprobado">Aprobado</SelectItem>
                                <SelectItem value="Rechazado">Rechazado</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={tipoFilter} onValueChange={(value) => {
                            setTipoFilter(value);
                            // Los filtros se aplican automáticamente por las dependencies del hook
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrar por tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos los tipos</SelectItem>
                                <SelectItem value="Proveedor">Proveedor</SelectItem>
                                <SelectItem value="Empleado">Empleado</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" className="w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Exportar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Building className="h-6 w-6 text-primary" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-muted-foreground">Total Terceros</p>
                                <p className="text-2xl font-bold">{pagination.totalCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-warning/10 rounded-lg">
                                <User className="h-6 w-6 text-warning" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-muted-foreground">Página Actual</p>
                                <p className="text-2xl font-bold">
                                    {pagination.data.length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-info/10 rounded-lg">
                                <Eye className="h-6 w-6 text-info" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-muted-foreground">Página</p>
                                <p className="text-2xl font-bold">
                                    {pagination.currentPage} de {pagination.totalPages}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-success/10 rounded-lg">
                                <Badge className="h-6 w-6 text-success" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                                <p className="text-2xl font-bold">
                                    {pagination.isLoading ? "..." : "OK"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Terceros Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Lista de Terceros</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {pagination.totalCount} total
                        </Badge>
                    </CardTitle>
                    <CardDescription>
                        Mostrando {pagination.data.length} de {pagination.totalCount} terceros
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {pagination.data.map((tercero) => (
                            <Card key={tercero.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                {tercero.tipo_persona === "juridica" ? (
                                                    <Building className="h-5 w-5 text-primary" />
                                                ) : (
                                                    <User className="h-5 w-5 text-primary" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground">
                                                    {tercero.tipo_persona === "juridica" ? tercero.razon_social : `${tercero.nombres} ${tercero.apellidos || ''}`}
                                                </h3>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {tercero.email}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {tercero.telefono}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <Badge variant="outline">{tercero.tipo_persona === "juridica" ? "Empresa" : "Persona"}</Badge>
                                                <p className="text-sm text-muted-foreground mt-1">{tercero.tipo_documento}</p>
                                            </div>
                                            {getEstadoBadge(tercero.estado_aprobacion)}
                                            <div className="flex gap-2">
                                                {/* Procesos y comerciales pueden ver/editar terceros */}
                                                {(() => {
                                                    const canViewEdit = (user?.role === "procesos" || user?.role === "comercial");
                                                    console.log(`🔍 Evaluando permisos para tercero ${tercero.id}:`, {
                                                        userRole: user?.role,
                                                        canViewEdit,
                                                        terceroId: tercero.id,
                                                        terceroEstado: tercero.estado_aprobacion
                                                    });
                                                    return canViewEdit;
                                                })() && (
                                                    <>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => {
                                                                console.log('👀 Ver tercero clickeado:', tercero.id);
                                                                handleViewTercero(tercero.id);
                                                            }}
                                                            title="Ver detalles del tercero"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => {
                                                                console.log('✏️ Editar tercero clickeado:', tercero.id);
                                                                handleEditTercero(tercero.id);
                                                            }}
                                                            title="Editar tercero"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {pagination.totalCount === 0 && (
                            <div className="text-center py-8">
                                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-muted-foreground">No se encontraron terceros</h3>
                                <p className="text-muted-foreground">Intenta ajustar los filtros o crear un nuevo tercero</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Paginación */}
                    {pagination.totalCount > 0 && (
                        <div className="flex items-center justify-between pt-4">
                            <div className="text-sm text-muted-foreground">
                                Página {pagination.currentPage} de {pagination.totalPages} - Mostrando {pagination.data.length} resultados de {pagination.totalCount} total
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => pagination.goToPage(pagination.currentPage - 1)}
                                    disabled={!pagination.hasPreviousPage}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => pagination.goToPage(pagination.currentPage + 1)}
                                    disabled={!pagination.hasNextPage}
                                >
                                    Siguiente
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Form Dialog */}
            <TerceroForm
                terceroId={selectedTercero}
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveTercero}
                mode={formMode}
            />
        </div>
    );
}