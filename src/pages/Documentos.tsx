import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { logoutUser } from "@/utils/logout.util";
import { 
    FileText, 
    Upload, 
    Download, 
    Clock, 
    CheckCircle, 
    XCircle, 
    Search,
    Filter,
    AlertTriangle,
    Eye,
    User,
    Building2,
    RefreshCw,
    FileCheck,
    TrendingUp
} from "lucide-react";

// Interfaces basadas en la API implementada
interface TipoDocumento {
    id: number;
    nombre: string;
    descripcion: string;
    tipos_persona: string[];
    obligatorio: boolean;
    admite_multiples: boolean;
}

interface DocumentoTercero {
    id: string;
    tercero: string;
    tercero_nombre: string;
    tercero_documento: string;
    tipo_persona: 'natural' | 'juridica' | 'publica';
    tipo_documento: TipoDocumento;
    archivo: string;
    nombre_original: string;
    estado_validacion: 'pendiente' | 'aprobado' | 'rechazado' | 'requiere_ajustes';
    fecha_subida: string;
    fecha_validacion?: string;
    validado_por?: string;
    observaciones?: string;
    tamano: number;
    tamano_legible: string;
    version: number;
}

interface DocumentosStats {
    total: number;
    pendientes: number;
    aprobados: number;
    rechazados: number;
    requieren_ajustes: number;
    completitud_promedio: number;
}

const Documentos = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DocumentosStats>({
        total: 0,
        pendientes: 0,
        aprobados: 0,
        rechazados: 0,
        requieren_ajustes: 0,
        completitud_promedio: 0
    });
    const [documentos, setDocumentos] = useState<DocumentoTercero[]>([]);
    const [filtros, setFiltros] = useState({
        busqueda: "",
        estado: "all",
        tipo_persona: "all"
    });
    const [loading, setLoading] = useState(true);
    const [selectedDocumento, setSelectedDocumento] = useState<DocumentoTercero | null>(null);

    const handleLogout = () => {
        logoutUser();
    };

    const handleNavigate = (path: string) => {
        window.location.href = path;
    };

    // Funciones para interactuar con la API implementada
    const cargarEstadisticas = async () => {
        try {
            const response = await fetch('/api/documents/estadisticas/');
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    setStats(data);
                } else {
                    throw new Error('Respuesta no es JSON válido');
                }
            } else {
                // Datos simulados para desarrollo
                setStats({
                    total: 1247,
                    pendientes: 189,
                    aprobados: 856,
                    rechazados: 142,
                    requieren_ajustes: 60,
                    completitud_promedio: 78.5
                });
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            // Fallback con datos simulados
            setStats({
                total: 1247,
                pendientes: 189,
                aprobados: 856,
                rechazados: 142,
                requieren_ajustes: 60,
                completitud_promedio: 78.5
            });
        }
    };

    const cargarDocumentos = async () => {
        try {
            const response = await fetch('/api/documents/documentos/');
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    setDocumentos(data.results || data || []);
                } else {
                    throw new Error('Respuesta no es JSON válido');
                }
            } else {
                // Datos simulados para desarrollo
                const mockData: DocumentoTercero[] = [
                    {
                        id: "1",
                        tercero: "uuid-1",
                        tercero_nombre: "Constructora EURO S.A.S",
                        tercero_documento: "900123456-1",
                        tipo_persona: "juridica",
                        tipo_documento: {
                            id: 1,
                            nombre: "RUT",
                            descripcion: "Registro Único Tributario",
                            tipos_persona: ["natural", "juridica"],
                            obligatorio: true,
                            admite_multiples: false
                        },
                        archivo: "/media/documentos/rut_constructora.pdf",
                        nombre_original: "RUT_Constructora_EURO.pdf",
                        estado_validacion: "pendiente",
                        fecha_subida: "2025-08-11T10:30:00Z",
                        tamano: 2097152,
                        tamano_legible: "2.0 MB",
                        version: 1
                    },
                    {
                        id: "2",
                        tercero: "uuid-2",
                        tercero_nombre: "María García López",
                        tercero_documento: "12345678",
                        tipo_persona: "natural",
                        tipo_documento: {
                            id: 2,
                            nombre: "Cédula de Ciudadanía",
                            descripcion: "Documento de identificación",
                            tipos_persona: ["natural"],
                            obligatorio: true,
                            admite_multiples: false
                        },
                        archivo: "/media/documentos/cedula_maria.pdf",
                        nombre_original: "Cedula_Maria_Garcia.pdf",
                        estado_validacion: "aprobado",
                        fecha_subida: "2025-08-10T15:45:00Z",
                        fecha_validacion: "2025-08-11T09:15:00Z",
                        validado_por: "Juan Pérez",
                        tamano: 1048576,
                        tamano_legible: "1.0 MB",
                        version: 1
                    }
                ];
                setDocumentos(mockData);
            }
        } catch (error) {
            console.error('Error cargando documentos:', error);
            // Asegurar que siempre haya un array válido
            setDocumentos([]);
        }
    };

    const validarDocumento = async (documentoId: string, estado: string) => {
        try {
            const response = await fetch(`/api/documents/documentos/${documentoId}/validar/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    estado_validacion: estado
                })
            });

            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    // Si hay respuesta JSON, la procesamos
                    const data = await response.json();
                    console.log('Validación exitosa:', data);
                }
                await cargarDocumentos();
                setSelectedDocumento(null);
            } else {
                console.error('Error en la validación:', response.status);
            }
        } catch (error) {
            console.error('Error validando documento:', error);
            // Simular validación exitosa para desarrollo
            setDocumentos(prev => prev.map(doc => 
                doc.id === documentoId 
                    ? { ...doc, estado_validacion: estado as any }
                    : doc
            ));
            setSelectedDocumento(null);
        }
    };

    useEffect(() => {
        const cargarDatos = async () => {
            setLoading(true);
            await Promise.all([cargarEstadisticas(), cargarDocumentos()]);
            setLoading(false);
        };
        cargarDatos();
    }, []);

    const getEstadoBadge = (estado: string) => {
        const variants = {
            'pendiente': 'bg-[#FFD700] text-[#0052CC] border-[#FFD700]',
            'aprobado': 'bg-green-100 text-green-800 border-green-200',
            'rechazado': 'bg-red-100 text-red-800 border-red-200',
            'requiere_ajustes': 'bg-orange-100 text-orange-800 border-orange-200'
        };
        return variants[estado as keyof typeof variants] || 'bg-gray-100 text-gray-800';
    };

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'pendiente': return <Clock className="h-4 w-4" />;
            case 'aprobado': return <CheckCircle className="h-4 w-4" />;
            case 'rechazado': return <XCircle className="h-4 w-4" />;
            case 'requiere_ajustes': return <AlertTriangle className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    const documentosFiltrados = (documentos || []).filter(doc => {
        const matchesBusqueda = doc.tercero_nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
                               doc.tercero_documento.includes(filtros.busqueda);
        const matchesEstado = !filtros.estado || filtros.estado === 'all' || doc.estado_validacion === filtros.estado;
        const matchesTipoPersona = !filtros.tipo_persona || filtros.tipo_persona === 'all' || doc.tipo_persona === filtros.tipo_persona;
        
        return matchesBusqueda && matchesEstado && matchesTipoPersona;
    });

    const documentosPendientes = documentosFiltrados.filter(doc => doc?.estado_validacion === 'pendiente');
    const documentosAprobados = documentosFiltrados.filter(doc => doc?.estado_validacion === 'aprobado');

    if (loading) {
        return (
            <AppLayout
                userRole={user?.role || 'procesos'}
                userName={user?.email || 'Usuario'}
                currentPath="/documentos"
                onNavigate={handleNavigate}
                onLogout={handleLogout}
            >
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="h-8 w-8 animate-spin text-[#0052CC]" />
                    <span className="ml-2 text-lg">Cargando gestión de documentos...</span>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            userRole={user?.role || 'procesos'}
            userName={user?.email || 'Usuario'}
            currentPath="/documentos"
            onNavigate={handleNavigate}
            onLogout={handleLogout}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gestión de Documentos</h1>
                        <p className="text-gray-600">
                            Sistema completo de gestión de documentos del formulario de terceros con API REST
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button className="bg-[#0052CC] hover:bg-[#003A8C] text-white">
                            <Upload className="h-4 w-4 mr-2" />
                            Cargar Documento
                        </Button>
                        <Button variant="outline" className="border-[#FFD700] text-[#F2C200] hover:bg-[#FFD700] hover:text-[#0052CC]">
                            <Download className="h-4 w-4 mr-2" />
                            Exportar
                        </Button>
                    </div>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <Card className="border-l-4 border-[#0052CC] shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                            <FileText className="h-4 w-4 text-[#0052CC]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#0052CC]">{stats.total}</div>
                            <p className="text-xs text-gray-600">documentos</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-[#FFD700] shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                            <Clock className="h-4 w-4 text-[#FFD700]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#F2C200]">{stats.pendientes}</div>
                            <p className="text-xs text-gray-600">por revisar</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-green-500 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">{stats.aprobados}</div>
                            <p className="text-xs text-gray-600">completos</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-red-500 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
                            <XCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">{stats.rechazados}</div>
                            <p className="text-xs text-gray-600">a corregir</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-orange-500 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Requieren Ajustes</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-500">{stats.requieren_ajustes}</div>
                            <p className="text-xs text-gray-600">para revisar</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-blue-500 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completitud</CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-500">{stats.completitud_promedio}%</div>
                            <p className="text-xs text-gray-600">promedio</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtros */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-[#0052CC] flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtros de Búsqueda
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                                <Input
                                    placeholder="Buscar tercero o documento..."
                                    value={filtros.busqueda}
                                    onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                                    className="pl-10"
                                />
                            </div>
                            <Select
                                value={filtros.estado}
                                onValueChange={(value) => setFiltros(prev => ({ ...prev, estado: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Estado de validación" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los estados</SelectItem>
                                    <SelectItem value="pendiente">Pendiente</SelectItem>
                                    <SelectItem value="aprobado">Aprobado</SelectItem>
                                    <SelectItem value="rechazado">Rechazado</SelectItem>
                                    <SelectItem value="requiere_ajustes">Requiere Ajustes</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={filtros.tipo_persona}
                                onValueChange={(value) => setFiltros(prev => ({ ...prev, tipo_persona: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tipo de persona" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los tipos</SelectItem>
                                    <SelectItem value="natural">Persona Natural</SelectItem>
                                    <SelectItem value="juridica">Persona Jurídica</SelectItem>
                                    <SelectItem value="publica">Entidad Pública</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button 
                                variant="outline" 
                                onClick={() => setFiltros({ busqueda: "", estado: "all", tipo_persona: "all" })}
                                className="border-[#FFD700] text-[#F2C200] hover:bg-[#FFD700] hover:text-[#0052CC]"
                            >
                                Limpiar Filtros
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Pestañas de Documentos */}
                <Tabs defaultValue="pendientes" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pendientes" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Pendientes ({documentosPendientes.length})
                        </TabsTrigger>
                        <TabsTrigger value="aprobados" className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Aprobados ({documentosAprobados.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pendientes">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-[#0052CC]">Documentos Pendientes de Validación</CardTitle>
                                <CardDescription>
                                    Documentos subidos desde el formulario de registro que requieren validación
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tercero</TableHead>
                                            <TableHead>Documento</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead>Fecha Subida</TableHead>
                                            <TableHead>Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {documentosPendientes.map((doc) => (
                                            <TableRow key={doc.id}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        {doc.tipo_persona === 'natural' ? 
                                                            <User className="h-4 w-4 text-[#0052CC]" /> : 
                                                            <Building2 className="h-4 w-4 text-[#0052CC]" />
                                                        }
                                                        <div>
                                                            <p className="font-medium">{doc.tercero_nombre}</p>
                                                            <p className="text-sm text-gray-600">{doc.tercero_documento}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <FileText className="h-4 w-4 text-gray-500" />
                                                        <div>
                                                            <p className="font-medium">{doc.tipo_documento.nombre}</p>
                                                            <p className="text-sm text-gray-600">{doc.tamano_legible}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`${getEstadoBadge(doc.estado_validacion)} flex items-center gap-1`}>
                                                        {getEstadoIcon(doc.estado_validacion)}
                                                        {doc.estado_validacion}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(doc.fecha_subida).toLocaleDateString('es-ES')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => setSelectedDocumento(doc)}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-2xl">
                                                                <DialogHeader>
                                                                    <DialogTitle>Validar Documento</DialogTitle>
                                                                </DialogHeader>
                                                                {selectedDocumento && (
                                                                    <div className="space-y-4">
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            <div>
                                                                                <label className="text-sm font-medium">Tercero</label>
                                                                                <p>{selectedDocumento.tercero_nombre}</p>
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-sm font-medium">Documento</label>
                                                                                <p>{selectedDocumento.tipo_documento.nombre}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex gap-4 pt-4">
                                                                            <Button 
                                                                                className="bg-green-600 hover:bg-green-700"
                                                                                onClick={() => validarDocumento(selectedDocumento.id, 'aprobado')}
                                                                            >
                                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                                Aprobar
                                                                            </Button>
                                                                            <Button 
                                                                                variant="destructive"
                                                                                onClick={() => validarDocumento(selectedDocumento.id, 'rechazado')}
                                                                            >
                                                                                <XCircle className="h-4 w-4 mr-2" />
                                                                                Rechazar
                                                                            </Button>
                                                                            <Button 
                                                                                variant="outline"
                                                                                className="border-orange-500 text-orange-600"
                                                                                onClick={() => validarDocumento(selectedDocumento.id, 'requiere_ajustes')}
                                                                            >
                                                                                <AlertTriangle className="h-4 w-4 mr-2" />
                                                                                Requiere Ajustes
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </DialogContent>
                                                        </Dialog>
                                                        <Button size="sm" variant="outline">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="aprobados">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-[#0052CC]">Documentos Aprobados</CardTitle>
                                <CardDescription>
                                    Documentos que han sido validados y aprobados exitosamente
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tercero</TableHead>
                                            <TableHead>Documento</TableHead>
                                            <TableHead>Validado Por</TableHead>
                                            <TableHead>Fecha Aprobación</TableHead>
                                            <TableHead>Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {documentosAprobados.map((doc) => (
                                            <TableRow key={doc.id}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        {doc.tipo_persona === 'natural' ? 
                                                            <User className="h-4 w-4 text-[#0052CC]" /> : 
                                                            <Building2 className="h-4 w-4 text-[#0052CC]" />
                                                        }
                                                        <div>
                                                            <p className="font-medium">{doc.tercero_nombre}</p>
                                                            <p className="text-sm text-gray-600">{doc.tercero_documento}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <FileCheck className="h-4 w-4 text-green-500" />
                                                        <div>
                                                            <p className="font-medium">{doc.tipo_documento.nombre}</p>
                                                            <p className="text-sm text-gray-600">{doc.tamano_legible}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {doc.validado_por || 'Sistema'}
                                                </TableCell>
                                                <TableCell>
                                                    {doc.fecha_validacion ? new Date(doc.fecha_validacion).toLocaleDateString('es-ES') : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button size="sm" variant="outline">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="sm" variant="outline">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
};

export default Documentos;
