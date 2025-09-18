import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Search,
    Filter,
    Eye,
    FileText,
    Download,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    MessageSquare,
    Send,
    User,
    Building2,
    MapPin,
    Phone,
    Mail,
    Calendar,
    Shield
} from "lucide-react";

interface TerceroSolicitud {
    id: string;
    numeroSolicitud: string;
    fechaRegistro: string;
    tipoTercero: "persona-natural" | "persona-juridica";
    tipoDocumento: string;
    numeroDocumento: string;
    nombreRazonSocial: string;
    correoElectronico: string;
    telefono: string;
    direccion: string;
    ciudad: string;
    pais: string;
    categoriaProveedor: string;
    tipoServicio: string;
    estado: "pendiente" | "aprobado-comercial" | "rechazado-comercial" | "aprobado-procesos" | "rechazado-procesos" | "en-consulta" | "enviado-oficial" | "aprobado-vinculacion" | "rechazado-vinculacion";
    documentos: { [key: string]: string };
    observaciones: { fecha: string; usuario: string; area: string; comentario: string; tipo: "aprobacion" | "rechazo" | "observacion" }[];
    responsableActual: string;
    areaActual: string;
    linkActivo: boolean;
    busquedaListas?: string;
}

interface ConsolidadoTercerosProps {
    userRole: string;
}

const estadosConfig = {
    "pendiente": { label: "Pendiente", color: "bg-yellow-500", variant: "secondary" as const },
    "aprobado-comercial": { label: "Aprobado Comercial", color: "bg-blue-500", variant: "default" as const },
    "rechazado-comercial": { label: "Rechazado Comercial", color: "bg-red-500", variant: "destructive" as const },
    "aprobado-procesos": { label: "Aprobado Procesos", color: "bg-green-500", variant: "default" as const },
    "rechazado-procesos": { label: "Rechazado Procesos", color: "bg-red-500", variant: "destructive" as const },
    "en-consulta": { label: "En Consulta Listas", color: "bg-purple-500", variant: "secondary" as const },
    "enviado-oficial": { label: "Enviado a Oficial", color: "bg-indigo-500", variant: "secondary" as const },
    "aprobado-vinculacion": { label: "Aprobado para Vinculación", color: "bg-green-600", variant: "default" as const },
    "rechazado-vinculacion": { label: "Rechazado para Vinculación", color: "bg-red-600", variant: "destructive" as const }
};

// Acciones permitidas por rol
const accionesPorRol = {
    "Comercial": ["aprobar-comercial", "rechazar-comercial", "observacion"],
    "Procesos": ["aprobar-procesos", "rechazar-procesos", "consultar-listas", "observacion"],
    "Contabilidad": ["aprobar-contabilidad", "rechazar-contabilidad", "observacion"],
    "Gestión Humana": ["aprobar-rrhh", "rechazar-rrhh", "observacion"],
    "Oficial Cumplimiento": ["aprobar-vinculacion", "rechazar-vinculacion", "asignar-permisos", "supervisar", "observacion"]
};

// Datos mock
const solicitudesMock: TerceroSolicitud[] = [
    {
        id: "1",
        numeroSolicitud: "TCR-2024-001",
        fechaRegistro: "2024-01-15T10:30:00",
        tipoTercero: "persona-juridica",
        tipoDocumento: "nit",
        numeroDocumento: "900123456-1",
        nombreRazonSocial: "Constructora ABC S.A.S",
        correoElectronico: "contacto@constructoraabc.com",
        telefono: "+57 300 123 4567",
        direccion: "Carrera 15 # 93-47",
        ciudad: "Bogotá",
        pais: "Colombia",
        categoriaProveedor: "obras-construccion",
        tipoServicio: "Construcción de infraestructura civil",
        estado: "en-consulta",
        documentos: {
            nit: "nit_constructora_abc.pdf",
            rut: "rut_constructora_abc.pdf",
            "camara-comercio": "camara_comercio_abc.pdf",
            "certificado-bancario": "certificado_bancario_abc.pdf"
        },
        observaciones: [
            {
                fecha: "2024-01-15T11:00:00",
                usuario: "María García",
                area: "Comercial",
                comentario: "Documentos completos y verificados. Aprobado para proceso siguiente.",
                tipo: "aprobacion"
            },
            {
                fecha: "2024-01-16T09:30:00",
                usuario: "Carlos Ruiz",
                area: "Procesos",
                comentario: "Documentos validados correctamente. Iniciando consulta en listas restrictivas.",
                tipo: "aprobacion"
            }
        ],
        responsableActual: "Sistema Automático",
        areaActual: "Procesos - Listas Restrictivas",
        linkActivo: true,
        busquedaListas: "consulta_listas_constructora_abc.pdf"
    },
    {
        id: "2",
        numeroSolicitud: "TCR-2024-002",
        fechaRegistro: "2024-01-14T14:20:00",
        tipoTercero: "persona-natural",
        tipoDocumento: "cedula",
        numeroDocumento: "12345678",
        nombreRazonSocial: "Juan Carlos Pérez",
        correoElectronico: "juan.perez@email.com",
        telefono: "+57 310 987 6543",
        direccion: "Calle 80 # 12-34",
        ciudad: "Medellín",
        pais: "Colombia",
        categoriaProveedor: "servicios-profesionales",
        tipoServicio: "Consultoría en sistemas de información",
        estado: "pendiente",
        documentos: {
            cedula: "cedula_juan_perez.pdf",
            rut: "rut_juan_perez.pdf"
        },
        observaciones: [],
        responsableActual: "María García",
        areaActual: "Comercial",
        linkActivo: true
    }
];

export default function ConsolidadoTerceros({ userRole }: ConsolidadoTercerosProps) {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [solicitudes, setSolicitudes] = useState<TerceroSolicitud[]>(solicitudesMock);
    const [filtroEstado, setFiltroEstado] = useState("todos");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSolicitud, setSelectedSolicitud] = useState<TerceroSolicitud | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [comentario, setComentario] = useState("");

    // Función para manejar logout
    const handleLogout = () => {
        logout();
    };

    // Función para navegación
    const handleNavigate = (path: string) => {
        navigate(path);
    };

    // Función para mostrar perfil
    const handleShowProfile = () => {
        navigate('/profile');
    };

    const solicitudesFiltradas = solicitudes.filter(solicitud => {
        const matchesSearch = solicitud.nombreRazonSocial.toLowerCase().includes(searchQuery.toLowerCase()) ||
            solicitud.numeroSolicitud.toLowerCase().includes(searchQuery.toLowerCase()) ||
            solicitud.numeroDocumento.includes(searchQuery);
        const matchesEstado = filtroEstado === "todos" || solicitud.estado === filtroEstado;
        return matchesSearch && matchesEstado;
    });

    const canApprove = (solicitud: TerceroSolicitud) => {
        if (userRole === "Comercial" && solicitud.estado === "pendiente") return true;
        if (userRole === "Procesos" && solicitud.estado === "aprobado-comercial") return true;
        if (userRole === "Oficial Cumplimiento" && solicitud.estado === "enviado-oficial") return true;
        return false;
    };

    const canReject = (solicitud: TerceroSolicitud) => {
        return canApprove(solicitud);
    };

    const handleApprove = (id: string) => {
        setSolicitudes(prev => prev.map(s => {
            if (s.id === id) {
                let newEstado = s.estado;
                let newArea = s.areaActual;
                let newResponsable = s.responsableActual;

                if (userRole === "Comercial" && s.estado === "pendiente") {
                    newEstado = "aprobado-comercial";
                    newArea = "Procesos";
                    newResponsable = "Carlos Ruiz";
                } else if (userRole === "Procesos" && s.estado === "aprobado-comercial") {
                    newEstado = "en-consulta";
                    newArea = "Procesos - Listas Restrictivas";
                    newResponsable = "Sistema Automático";
                } else if (userRole === "Oficial Cumplimiento" && s.estado === "enviado-oficial") {
                    newEstado = "aprobado-vinculacion";
                    newArea = "Finalizado";
                    newResponsable = "";
                }

                const newObservacion = {
                    fecha: new Date().toISOString(),
                    usuario: "Usuario Actual", // Aquí iría el nombre del usuario logueado
                    area: userRole,
                    comentario: comentario || "Aprobado",
                    tipo: "aprobacion" as const
                };

                return {
                    ...s,
                    estado: newEstado,
                    areaActual: newArea,
                    responsableActual: newResponsable,
                    observaciones: [...s.observaciones, newObservacion]
                };
            }
            return s;
        }));
        setComentario("");
    };

    const handleReject = (id: string) => {
        setSolicitudes(prev => prev.map(s => {
            if (s.id === id) {
                let newEstado = s.estado;

                if (userRole === "Comercial") {
                    newEstado = "rechazado-comercial";
                } else if (userRole === "Procesos") {
                    newEstado = "rechazado-procesos";
                } else if (userRole === "Oficial Cumplimiento") {
                    newEstado = "rechazado-vinculacion";
                }

                const newObservacion = {
                    fecha: new Date().toISOString(),
                    usuario: "Usuario Actual",
                    area: userRole,
                    comentario: comentario || "Rechazado",
                    tipo: "rechazo" as const
                };

                return {
                    ...s,
                    estado: newEstado,
                    observaciones: [...s.observaciones, newObservacion]
                };
            }
            return s;
        }));
        setComentario("");
    };

    const stats = {
        total: solicitudes.length,
        pendientes: solicitudes.filter(s => s.estado === "pendiente").length,
        aprobados: solicitudes.filter(s => s.estado.includes("aprobado")).length,
        rechazados: solicitudes.filter(s => s.estado.includes("rechazado")).length,
        enProceso: solicitudes.filter(s => s.estado.includes("consulta") || s.estado.includes("enviado")).length
    };

    return (
        <AppLayout 
            userRole={userRole}
            userName={user?.username || "Usuario"}
            currentPath="/terceros/consolidado"
            onNavigate={handleNavigate}
            onShowProfile={handleShowProfile}
            onLogout={handleLogout}
        >
            <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-foreground">Consolidado de Terceros</h2>
                <p className="text-muted-foreground">
                    Dashboard integral para seguimiento de solicitudes de terceros
                </p>
            </div>

            {/* Estadísticas */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Solicitudes</CardDescription>
                        <CardTitle className="text-2xl">{stats.total}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Pendientes</CardDescription>
                        <CardTitle className="text-2xl text-warning">{stats.pendientes}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>En Proceso</CardDescription>
                        <CardTitle className="text-2xl text-info">{stats.enProceso}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Aprobados</CardDescription>
                        <CardTitle className="text-2xl text-success">{stats.aprobados}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Rechazados</CardDescription>
                        <CardTitle className="text-2xl text-destructive">{stats.rechazados}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Filtros */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nombre, número de solicitud o documento..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos los Estados</SelectItem>
                                {Object.entries(estadosConfig).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tabla de solicitudes */}
            <Card>
                <CardHeader>
                    <CardTitle>Solicitudes de Terceros</CardTitle>
                    <CardDescription>
                        {solicitudesFiltradas.length} de {solicitudes.length} solicitudes mostradas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left p-4 font-medium">No. Solicitud</th>
                                    <th className="text-left p-4 font-medium">Tercero</th>
                                    <th className="text-left p-4 font-medium">Tipo</th>
                                    <th className="text-left p-4 font-medium">Estado</th>
                                    <th className="text-left p-4 font-medium">Área Actual</th>
                                    <th className="text-left p-4 font-medium">Fecha</th>
                                    <th className="text-center p-4 font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {solicitudesFiltradas.map((solicitud) => {
                                    const estadoConfig = estadosConfig[solicitud.estado];
                                    return (
                                        <tr key={solicitud.id} className="border-b border-border hover:bg-muted/50">
                                            <td className="p-4">
                                                <span className="font-mono text-sm">{solicitud.numeroSolicitud}</span>
                                            </td>
                                            <td className="p-4">
                                                <div>
                                                    <p className="font-medium">{solicitud.nombreRazonSocial}</p>
                                                    <p className="text-sm text-muted-foreground">{solicitud.numeroDocumento}</p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline">
                                                    {solicitud.tipoTercero === "persona-natural" ? "P. Natural" : "P. Jurídica"}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={estadoConfig.variant}>
                                                    {estadoConfig.label}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm">{solicitud.areaActual}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-muted-foreground">
                                                    {new Date(solicitud.fechaRegistro).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-center gap-2">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setSelectedSolicitud(solicitud)}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                                            <DialogHeader>
                                                                <DialogTitle>Detalles de Solicitud - {solicitud.numeroSolicitud}</DialogTitle>
                                                            </DialogHeader>
                                                            {selectedSolicitud && (
                                                                <Tabs defaultValue="informacion" className="mt-4">
                                                                    <TabsList className="grid w-full grid-cols-4">
                                                                        <TabsTrigger value="informacion">Información</TabsTrigger>
                                                                        <TabsTrigger value="documentos">Documentos</TabsTrigger>
                                                                        <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>
                                                                        <TabsTrigger value="acciones">Acciones</TabsTrigger>
                                                                    </TabsList>

                                                                    <TabsContent value="informacion" className="space-y-4">
                                                                        <div className="grid gap-4 md:grid-cols-2">
                                                                            <div className="space-y-4">
                                                                                <div className="flex items-center gap-2">
                                                                                    <User className="h-5 w-5 text-muted-foreground" />
                                                                                    <div>
                                                                                        <p className="font-medium">{selectedSolicitud.nombreRazonSocial}</p>
                                                                                        <p className="text-sm text-muted-foreground">
                                                                                            {selectedSolicitud.tipoDocumento}: {selectedSolicitud.numeroDocumento}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex items-center gap-2">
                                                                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                                                                    <span className="text-sm">{selectedSolicitud.correoElectronico}</span>
                                                                                </div>

                                                                                <div className="flex items-center gap-2">
                                                                                    <Phone className="h-5 w-5 text-muted-foreground" />
                                                                                    <span className="text-sm">{selectedSolicitud.telefono}</span>
                                                                                </div>

                                                                                <div className="flex items-center gap-2">
                                                                                    <MapPin className="h-5 w-5 text-muted-foreground" />
                                                                                    <div>
                                                                                        <p className="text-sm">{selectedSolicitud.direccion}</p>
                                                                                        <p className="text-sm text-muted-foreground">
                                                                                            {selectedSolicitud.ciudad}, {selectedSolicitud.pais}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="space-y-4">
                                                                                <div className="flex items-center gap-2">
                                                                                    <Building2 className="h-5 w-5 text-muted-foreground" />
                                                                                    <div>
                                                                                        <p className="font-medium">Categoría</p>
                                                                                        <p className="text-sm text-muted-foreground">{selectedSolicitud.categoriaProveedor}</p>
                                                                                    </div>
                                                                                </div>

                                                                                <div>
                                                                                    <p className="font-medium mb-2">Tipo de Servicio</p>
                                                                                    <p className="text-sm text-muted-foreground">{selectedSolicitud.tipoServicio}</p>
                                                                                </div>

                                                                                <div className="flex items-center gap-2">
                                                                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                                                                    <div>
                                                                                        <p className="font-medium">Fecha de Registro</p>
                                                                                        <p className="text-sm text-muted-foreground">
                                                                                            {new Date(selectedSolicitud.fechaRegistro).toLocaleString()}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </TabsContent>

                                                                    <TabsContent value="documentos" className="space-y-4">
                                                                        <h4 className="font-medium">Documentos Adjuntos</h4>
                                                                        <div className="grid gap-3">
                                                                            {Object.entries(selectedSolicitud.documentos).map(([key, filename]) => (
                                                                                <div key={key} className="flex items-center justify-between p-3 border border-border rounded-lg">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                                                                        <div>
                                                                                            <p className="font-medium">{key.replace(/-/g, ' ').toUpperCase()}</p>
                                                                                            <p className="text-sm text-muted-foreground">{filename}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <Button variant="outline" size="sm">
                                                                                        <Download className="h-4 w-4 mr-2" />
                                                                                        Descargar
                                                                                    </Button>
                                                                                </div>
                                                                            ))}

                                                                            {selectedSolicitud.busquedaListas && (
                                                                                <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-blue-50 dark:bg-blue-950">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <Shield className="h-5 w-5 text-blue-600" />
                                                                                        <div>
                                                                                            <p className="font-medium">Resultado Listas Restrictivas</p>
                                                                                            <p className="text-sm text-muted-foreground">{selectedSolicitud.busquedaListas}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <Button variant="outline" size="sm">
                                                                                        <Download className="h-4 w-4 mr-2" />
                                                                                        Descargar
                                                                                    </Button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </TabsContent>

                                                                    <TabsContent value="seguimiento" className="space-y-4">
                                                                        <h4 className="font-medium">Historial de Seguimiento</h4>
                                                                        <div className="space-y-4">
                                                                            {selectedSolicitud.observaciones.map((obs, index) => (
                                                                                <div key={index} className="flex gap-4 p-4 border border-border rounded-lg">
                                                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${obs.tipo === "aprobacion" ? "bg-green-100 text-green-600" :
                                                                                            obs.tipo === "rechazo" ? "bg-red-100 text-red-600" :
                                                                                                "bg-blue-100 text-blue-600"
                                                                                        }`}>
                                                                                        {obs.tipo === "aprobacion" ? <CheckCircle className="h-5 w-5" /> :
                                                                                            obs.tipo === "rechazo" ? <XCircle className="h-5 w-5" /> :
                                                                                                <MessageSquare className="h-5 w-5" />}
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <div className="flex items-center gap-2 mb-1">
                                                                                            <p className="font-medium">{obs.usuario}</p>
                                                                                            <Badge variant="outline" className="text-xs">{obs.area}</Badge>
                                                                                            <span className="text-xs text-muted-foreground">
                                                                                                {new Date(obs.fecha).toLocaleString()}
                                                                                            </span>
                                                                                        </div>
                                                                                        <p className="text-sm text-muted-foreground">{obs.comentario}</p>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </TabsContent>

                                                                    <TabsContent value="acciones" className="space-y-4">
                                                                        {(canApprove(selectedSolicitud) || canReject(selectedSolicitud)) && (
                                                                            <div className="space-y-4">
                                                                                <h4 className="font-medium">Acciones Disponibles</h4>
                                                                                <div className="space-y-3">
                                                                                    <Textarea
                                                                                        placeholder="Agregar comentarios u observaciones..."
                                                                                        value={comentario}
                                                                                        onChange={(e) => setComentario(e.target.value)}
                                                                                    />
                                                                                    <div className="flex gap-3">
                                                                                        {canApprove(selectedSolicitud) && (
                                                                                            <Button
                                                                                                onClick={() => {
                                                                                                    handleApprove(selectedSolicitud.id);
                                                                                                    setShowDetails(false);
                                                                                                }}
                                                                                                className="bg-green-600 hover:bg-green-700"
                                                                                            >
                                                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                                                Aprobar
                                                                                            </Button>
                                                                                        )}
                                                                                        {canReject(selectedSolicitud) && (
                                                                                            <Button
                                                                                                variant="destructive"
                                                                                                onClick={() => {
                                                                                                    handleReject(selectedSolicitud.id);
                                                                                                    setShowDetails(false);
                                                                                                }}
                                                                                            >
                                                                                                <XCircle className="h-4 w-4 mr-2" />
                                                                                                Rechazar
                                                                                            </Button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {selectedSolicitud.linkActivo && (
                                                                            <div className="border-t border-border pt-4">
                                                                                <h4 className="font-medium mb-2">Link de Actualización</h4>
                                                                                <p className="text-sm text-muted-foreground mb-3">
                                                                                    El proveedor puede actualizar su información usando este enlace:
                                                                                </p>
                                                                                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                                                                    <Input
                                                                                        value={`https://euro-terceros.com/actualizar/${selectedSolicitud.id}`}
                                                                                        readOnly
                                                                                        className="font-mono text-sm"
                                                                                    />
                                                                                    <Button variant="outline" size="sm">
                                                                                        <Send className="h-4 w-4 mr-2" />
                                                                                        Enviar
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </TabsContent>
                                                                </Tabs>
                                                            )}
                                                        </DialogContent>
                                                    </Dialog>

                                                    {(canApprove(solicitud) || canReject(solicitud)) && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-green-600 border-green-600 hover:bg-green-50"
                                                                onClick={() => handleApprove(solicitud.id)}
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-red-600 border-red-600 hover:bg-red-50"
                                                                onClick={() => handleReject(solicitud.id)}
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            </div>
        </AppLayout>
    );
}