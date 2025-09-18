import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
    User,
    Mail,
    Phone,
    Building,
    MapPin,
    Calendar,
    Shield,
    Save,
    Edit3,
    Camera,
    CheckCircle2,
    IdCard
} from "lucide-react";

interface UserProfileModalProps {
    userRole: string;
    userName?: string;
    isOpen: boolean;
    onClose: () => void;
}

const roleDisplayNames: Record<string, string> = {
    "procesos": "Procesos",
    "comercial": "Comercial", 
    "gestion_humana": "Gestión Humana",
    "admin": "Administrador",
    "analista": "Analista",
    "supervisor": "Supervisor",
    "usuario": "Usuario"
};

export default function UserProfileModal({ userRole, userName, isOpen, onClose }: UserProfileModalProps) {
    const { toast } = useToast();
    const { user, updateUserProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "", 
        email: "",
        phone: "",
        cargo: "",
        area: "",
        direccion: "",
        fecha_contratacion: "",
        tipo_documento: "",
        numero_documento: ""
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                email: user.email || "",
                phone: user.phone || "",
                cargo: user.cargo || "",
                area: user.area || "",
                direccion: user.direccion || "",
                fecha_contratacion: user.fecha_contratacion || "",
                tipo_documento: user.tipo_documento || "",
                numero_documento: user.numero_documento || ""
            });
        }
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        try {
            // Actualizar el perfil del usuario
            updateUserProfile(formData);
            setIsEditing(false);
            toast({
                title: "Perfil actualizado",
                description: "Los cambios se han guardado correctamente",
                variant: "default",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron guardar los cambios",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const roleDisplayName = roleDisplayNames[user?.role || userRole] || (user?.role || userRole);

    if (!user) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="w-full max-w-2xl">
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]"></div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-2 border-[#0052CC]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#0052CC] to-[#1E40AF] bg-clip-text text-transparent">
                        Mi Perfil
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center space-y-4 bg-gradient-to-r from-[#0052CC] to-[#1E40AF] p-6 rounded-xl text-white">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#FFD700] to-[#F59E0B] rounded-full opacity-100 group-hover:opacity-90 transition duration-300 animate-pulse"></div>
                            <Avatar className="relative h-24 w-24 border-4 border-white shadow-2xl">
                                <AvatarImage src="/placeholder-avatar.jpg" alt={user.full_name || "Usuario"} />
                                <AvatarFallback className="bg-gradient-to-br from-[#FFD700] to-[#F59E0B] text-[#0052CC] text-2xl font-bold">
                                    {user.first_name && user.last_name ? 
                                        `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase() : 
                                        (user.username ? user.username.slice(0, 2).toUpperCase() : "US")
                                    }
                                </AvatarFallback>
                            </Avatar>
                            <Button
                                size="sm"
                                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-[#FFD700] hover:bg-[#F59E0B] text-[#0052CC] shadow-lg border-2 border-white transition-all duration-300 hover:scale-110"
                                disabled={!isEditing}
                            >
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-white">
                                {user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.username}
                            </h2>
                            <div className="flex items-center justify-center gap-2">
                                <Badge 
                                    variant="outline" 
                                    className="bg-white text-[#0052CC] border-white font-medium hover:bg-gray-100"
                                >
                                    <Shield className="w-3 h-3 mr-1" />
                                    {roleDisplayName}
                                </Badge>
                                <Badge 
                                    variant="outline" 
                                    className="bg-emerald-500 text-white border-emerald-500 font-medium hover:bg-emerald-600"
                                >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Activo
                                </Badge>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setIsEditing(!isEditing)}
                                className="bg-white text-[#0052CC] hover:bg-gray-100 shadow-xl transition-all duration-300 hover:scale-105 font-semibold"
                            >
                                <Edit3 className="w-4 h-4 mr-2" />
                                {isEditing ? "Cancelar" : "Editar"}
                            </Button>
                            {isEditing && (
                                <Button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl transition-all duration-300 hover:scale-105 font-semibold"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {loading ? "Guardando..." : "Guardar"}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Personal Information */}
                    <Card className="shadow-xl border-2 border-[#0052CC] bg-white">
                        <CardHeader className="bg-[#0052CC] text-white rounded-t-lg">
                            <CardTitle className="flex items-center gap-2 text-white text-lg">
                                <User className="h-5 w-5" />
                                Información Personal
                            </CardTitle>
                            <CardDescription className="text-blue-100">
                                Datos personales y de contacto
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name" className="text-sm font-semibold text-gray-800">
                                        Nombre
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0052CC] h-4 w-4" />
                                        <Input
                                            id="first_name"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                                            disabled={!isEditing}
                                            className="pl-10 border-2 border-gray-300 focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC] transition-all duration-300 hover:border-[#0052CC] disabled:bg-gray-200 bg-white"
                                            placeholder="Ingrese su nombre"
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="last_name" className="text-sm font-semibold text-gray-800">
                                        Apellido
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0052CC] h-4 w-4" />
                                        <Input
                                            id="last_name"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                                            disabled={!isEditing}
                                            className="pl-10 border-2 border-gray-300 focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC] transition-all duration-300 hover:border-[#0052CC] disabled:bg-gray-200 bg-white"
                                            placeholder="Ingrese su apellido"
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-semibold text-gray-800">
                                        Correo Electrónico
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0052CC] h-4 w-4" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            disabled={!isEditing}
                                            className="pl-10 border-2 border-gray-300 focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC] transition-all duration-300 hover:border-[#0052CC] disabled:bg-gray-200 bg-white"
                                            placeholder="correo@ejemplo.com"
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-sm font-semibold text-gray-800">
                                        Teléfono
                                    </Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0052CC] h-4 w-4" />
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            disabled={!isEditing}
                                            className="pl-10 border-2 border-gray-300 focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC] transition-all duration-300 hover:border-[#0052CC] disabled:bg-gray-200 bg-white"
                                            placeholder="+57 300 123 4567"
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="cargo" className="text-sm font-semibold text-gray-800">
                                        Cargo
                                    </Label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0052CC] h-4 w-4" />
                                        <Input
                                            id="cargo"
                                            value={formData.cargo}
                                            onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                                            disabled={!isEditing}
                                            className="pl-10 border-2 border-gray-300 focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC] transition-all duration-300 hover:border-[#0052CC] disabled:bg-gray-200 bg-white"
                                            placeholder="Cargo"
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="area" className="text-sm font-semibold text-gray-800">
                                        Área
                                    </Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0052CC] h-4 w-4" />
                                        <Input
                                            id="area"
                                            value={formData.area}
                                            onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                                            disabled={!isEditing}
                                            className="pl-10 border-2 border-gray-300 focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC] transition-all duration-300 hover:border-[#0052CC] disabled:bg-gray-200 bg-white"
                                            placeholder="Área de trabajo"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <Separator className="bg-[#0052CC] h-0.5" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="tipo_documento" className="text-sm font-semibold text-gray-800">
                                        Tipo de Documento
                                    </Label>
                                    <div className="relative">
                                        <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0052CC] h-4 w-4" />
                                        <Input
                                            id="tipo_documento"
                                            value={formData.tipo_documento}
                                            onChange={(e) => setFormData(prev => ({ ...prev, tipo_documento: e.target.value }))}
                                            disabled={!isEditing}
                                            className="pl-10 border-2 border-gray-300 focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC] transition-all duration-300 hover:border-[#0052CC] disabled:bg-gray-200 bg-white"
                                            placeholder="CC, CE, PP, etc."
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="numero_documento" className="text-sm font-semibold text-gray-800">
                                        Número de Documento
                                    </Label>
                                    <div className="relative">
                                        <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0052CC] h-4 w-4" />
                                        <Input
                                            id="numero_documento"
                                            value={formData.numero_documento}
                                            onChange={(e) => setFormData(prev => ({ ...prev, numero_documento: e.target.value }))}
                                            disabled={!isEditing}
                                            className="pl-10 border-2 border-gray-300 focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC] transition-all duration-300 hover:border-[#0052CC] disabled:bg-gray-200 bg-white"
                                            placeholder="Número de identificación"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <Separator className="bg-[#0052CC] h-0.5" />
                            
                            <div className="space-y-2">
                                <Label htmlFor="direccion" className="text-sm font-semibold text-gray-800">
                                    Dirección
                                </Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0052CC] h-4 w-4" />
                                    <Input
                                        id="direccion"
                                        value={formData.direccion}
                                        onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                                        disabled={!isEditing}
                                        className="pl-10 border-2 border-gray-300 focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC] transition-all duration-300 hover:border-[#0052CC] disabled:bg-gray-200 bg-white"
                                        placeholder="Dirección completa"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="fecha_contratacion" className="text-sm font-semibold text-gray-800">
                                    Fecha de Contratación
                                </Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0052CC] h-4 w-4" />
                                    <Input
                                        id="fecha_contratacion"
                                        type="date"
                                        value={formData.fecha_contratacion}
                                        onChange={(e) => setFormData(prev => ({ ...prev, fecha_contratacion: e.target.value }))}
                                        disabled={!isEditing}
                                        className="pl-10 border-2 border-gray-300 focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC] transition-all duration-300 hover:border-[#0052CC] disabled:bg-gray-200 bg-white"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}
