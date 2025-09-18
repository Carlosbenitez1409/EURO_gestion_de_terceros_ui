import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
    User,
    Building2,
    Save,
    X,
    Mail,
    Phone,
    MapPin,
    FileText
} from "lucide-react";

interface Tercero {
    id: string;
    nombre: string;
    tipo: "Proveedor" | "Empleado";
    categoria: string;
    estado: "Pendiente" | "En Revisión" | "Aprobado" | "Rechazado" | "Requiere Ajustes";
    fechaCreacion: string;
    documentosPendientes: number;
    responsable: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    numeroDocumento?: string;
    tipoDocumento?: string;
    observaciones?: string;
}

interface TerceroEditModalProps {
    tercero: Tercero | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (tercero: Tercero) => void;
    userRole: string;
}

export function TerceroEditModal({ tercero, isOpen, onClose, onSave, userRole }: TerceroEditModalProps) {
    const { toast } = useToast();
    const [formData, setFormData] = useState<Tercero | null>(null);
    const [isLoading, setSaveLoading] = useState(false);

    useEffect(() => {
        if (tercero) {
            setFormData({ ...tercero });
        }
    }, [tercero]);

    if (!tercero || !formData) return null;

    const handleSave = async () => {
        setSaveLoading(true);
        try {
            // Validaciones básicas
            if (!formData.nombre.trim()) {
                toast({
                    title: "Error",
                    description: "El nombre es requerido",
                    variant: "destructive"
                });
                return;
            }

            if (!formData.email?.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
                toast({
                    title: "Error",
                    description: "Ingrese un email válido",
                    variant: "destructive"
                });
                return;
            }

            // Simular guardado
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            onSave(formData);
            toast({
                title: "Éxito",
                description: "Los cambios se han guardado correctamente",
                variant: "default"
            });
            onClose();
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo guardar los cambios",
                variant: "destructive"
            });
        } finally {
            setSaveLoading(false);
        }
    };

    const canEditAll = userRole === "procesos" || 
                      (userRole === "comercial" && tercero.tipo === "Proveedor") ||
                      (userRole === "gestion_humana" && tercero.tipo === "Empleado");

    const updateField = (field: keyof Tercero, value: any) => {
        setFormData(prev => prev ? { ...prev, [field]: value } : null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-[#0033A0]">
                        {tercero.tipo === "Proveedor" ? <Building2 className="h-6 w-6" /> : <User className="h-6 w-6" />}
                        Editar {tercero.tipo}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Información básica */}
                    <Card className="border-[#0033A0]/20">
                        <CardHeader className="bg-gradient-to-r from-[#0033A0]/5 to-[#FFD700]/5">
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-[#0033A0]" />
                                Información Básica
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nombre">Nombre / Razón Social *</Label>
                                    <Input
                                        id="nombre"
                                        value={formData.nombre}
                                        onChange={(e) => updateField('nombre', e.target.value)}
                                        disabled={!canEditAll}
                                        className="border-[#0033A0]/20 focus:border-[#0033A0]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="categoria">Categoría</Label>
                                    <Select
                                        value={formData.categoria}
                                        onValueChange={(value) => updateField('categoria', value)}
                                        disabled={!canEditAll}
                                    >
                                        <SelectTrigger className="border-[#0033A0]/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tercero.tipo === "Proveedor" ? (
                                                <>
                                                    <SelectItem value="Obras y Construcción">Obras y Construcción</SelectItem>
                                                    <SelectItem value="Servicios Generales">Servicios Generales</SelectItem>
                                                    <SelectItem value="Tecnología">Tecnología</SelectItem>
                                                    <SelectItem value="Suministros">Suministros</SelectItem>
                                                </>
                                            ) : (
                                                <>
                                                    <SelectItem value="Administrativo">Administrativo</SelectItem>
                                                    <SelectItem value="Operativo">Operativo</SelectItem>
                                                    <SelectItem value="Comercial">Comercial</SelectItem>
                                                    <SelectItem value="Gerencial">Gerencial</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tipoDocumento">Tipo de Documento</Label>
                                    <Select
                                        value={formData.tipoDocumento || "CC"}
                                        onValueChange={(value) => updateField('tipoDocumento', value)}
                                        disabled={!canEditAll}
                                    >
                                        <SelectTrigger className="border-[#0033A0]/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                                            <SelectItem value="NIT">NIT</SelectItem>
                                            <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                                            <SelectItem value="PAS">Pasaporte</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="numeroDocumento">Número de Documento</Label>
                                    <Input
                                        id="numeroDocumento"
                                        value={formData.numeroDocumento || ""}
                                        onChange={(e) => updateField('numeroDocumento', e.target.value)}
                                        disabled={!canEditAll}
                                        className="border-[#0033A0]/20 focus:border-[#0033A0]"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Información de contacto */}
                    <Card className="border-[#0033A0]/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-[#0033A0]" />
                                Información de Contacto
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email || ""}
                                        onChange={(e) => updateField('email', e.target.value)}
                                        disabled={!canEditAll}
                                        className="border-[#0033A0]/20 focus:border-[#0033A0]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="telefono">Teléfono</Label>
                                    <Input
                                        id="telefono"
                                        value={formData.telefono || ""}
                                        onChange={(e) => updateField('telefono', e.target.value)}
                                        disabled={!canEditAll}
                                        className="border-[#0033A0]/20 focus:border-[#0033A0]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="direccion">Dirección</Label>
                                <Input
                                    id="direccion"
                                    value={formData.direccion || ""}
                                    onChange={(e) => updateField('direccion', e.target.value)}
                                    disabled={!canEditAll}
                                    className="border-[#0033A0]/20 focus:border-[#0033A0]"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Estado y proceso */}
                    <Card className="border-[#0033A0]/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-[#0033A0]" />
                                Estado del Proceso
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="estado">Estado</Label>
                                    <Select
                                        value={formData.estado}
                                        onValueChange={(value) => updateField('estado', value as any)}
                                    >
                                        <SelectTrigger className="border-[#0033A0]/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Pendiente">Pendiente</SelectItem>
                                            <SelectItem value="En Revisión">En Revisión</SelectItem>
                                            <SelectItem value="Aprobado">Aprobado</SelectItem>
                                            <SelectItem value="Rechazado">Rechazado</SelectItem>
                                            <SelectItem value="Requiere Ajustes">Requiere Ajustes</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-blue-600">
                                        Puede cambiar el estado a cualquier valor según sea necesario
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="responsable">Responsable</Label>
                                    <Input
                                        id="responsable"
                                        value={formData.responsable}
                                        onChange={(e) => updateField('responsable', e.target.value)}
                                        disabled={!canEditAll}
                                        className="border-[#0033A0]/20 focus:border-[#0033A0]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="observaciones">Observaciones</Label>
                                <Textarea
                                    id="observaciones"
                                    value={formData.observaciones || ""}
                                    onChange={(e) => updateField('observaciones', e.target.value)}
                                    disabled={!canEditAll}
                                    placeholder="Ingrese observaciones adicionales..."
                                    className="border-[#0033A0]/20 focus:border-[#0033A0] min-h-[100px]"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Botones de acción */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={onClose}>
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleSave}
                            disabled={isLoading || !canEditAll}
                            className="bg-[#0033A0] hover:bg-[#0033A0]/90 text-white"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Guardar Cambios
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
