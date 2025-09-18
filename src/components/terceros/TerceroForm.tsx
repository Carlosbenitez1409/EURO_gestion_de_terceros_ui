import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectWithOptions } from "@/components/ui/select-loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProgressLoading } from "@/components/common/LoadingStates";
import {
    Save,
    Upload,
    X,
    FileText,
    AlertCircle,
    CheckCircle,
    User,
    Building,
    Mail,
    Phone,
    MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TerceroFormProps {
    terceroId?: string | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (tercero: any) => void;
    mode: "create" | "edit";
}

interface FormData {
    nombre: string;
    tipo: string;
    categoria: string;
    email: string;
    telefono: string;
    documentoIdentidad: string;
    direccion: string;
    ciudad: string;
    pais: string;
    responsable: string;
}

const tiposOptions = [
    { value: "Proveedor", label: "Proveedor" },
    { value: "Empleado", label: "Empleado" }
];

const categoriasProveedor = [
    { value: "obras-construccion", label: "Obras y Construcción" },
    { value: "tecnologia", label: "Tecnología" },
    { value: "comercial", label: "Comercial" },
    { value: "servicios-profesionales", label: "Servicios Profesionales" },
    { value: "transporte-logistica", label: "Transporte y Logística" },
    { value: "manufactura", label: "Manufactura" }
];

const categoriasEmpleado = [
    { value: "administrativo", label: "Administrativo" },
    { value: "operativo", label: "Operativo" },
    { value: "directivo", label: "Directivo" },
    { value: "tecnico", label: "Técnico" },
    { value: "comercial", label: "Comercial" }
];

const paisesOptions = [
    { value: "Colombia", label: "Colombia" },
    { value: "Ecuador", label: "Ecuador" },
    { value: "Peru", label: "Perú" },
    { value: "Venezuela", label: "Venezuela" },
    { value: "Panama", label: "Panamá" }
];

export function TerceroForm({ terceroId, isOpen, onClose, onSave, mode }: TerceroFormProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveProgress, setSaveProgress] = useState(0);
    const { toast } = useToast();

    const [formData, setFormData] = useState<FormData>({
        nombre: "",
        tipo: "",
        categoria: "",
        email: "",
        telefono: "",
        documentoIdentidad: "",
        direccion: "",
        ciudad: "",
        pais: "Colombia",
        responsable: ""
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (mode === "create" && isOpen) {
            resetForm();
        }
    }, [mode, isOpen]);

    const resetForm = () => {
        setFormData({
            nombre: "",
            tipo: "",
            categoria: "",
            email: "",
            telefono: "",
            documentoIdentidad: "",
            direccion: "",
            ciudad: "",
            pais: "Colombia",
            responsable: ""
        });
        setErrors({});
        setSaveProgress(0);
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido";
        if (!formData.tipo) newErrors.tipo = "El tipo es requerido";
        if (!formData.categoria) newErrors.categoria = "La categoría es requerida";
        if (!formData.email.trim()) {
            newErrors.email = "El email es requerido";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "El email no es válido";
        }
        if (!formData.telefono.trim()) newErrors.telefono = "El teléfono es requerido";
        if (!formData.documentoIdentidad.trim()) newErrors.documentoIdentidad = "El documento es requerido";
        if (!formData.responsable.trim()) newErrors.responsable = "El responsable es requerido";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
        
        // Reset categoria when tipo changes
        if (field === "tipo") {
            setFormData(prev => ({ ...prev, categoria: "" }));
        }
    };

    const getCategoriaOptions = () => {
        if (formData.tipo === "Proveedor") return categoriasProveedor;
        if (formData.tipo === "Empleado") return categoriasEmpleado;
        return [];
    };

    const simulateSave = async () => {
        setSaving(true);
        setSaveProgress(0);
        
        // Simular progreso de guardado
        const intervals = [20, 40, 60, 80, 100];
        for (const progress of intervals) {
            await new Promise(resolve => setTimeout(resolve, 300));
            setSaveProgress(progress);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        setSaving(false);
        setSaveProgress(0);
    };

    const handleSave = async () => {
        if (!validateForm()) {
            toast({
                title: "Error de validación",
                description: "Por favor corrige los errores en el formulario",
                variant: "destructive"
            });
            return;
        }

        try {
            await simulateSave();
            
            const tercero = {
                id: terceroId || Date.now().toString(),
                ...formData,
                estado: "Pendiente",
                fechaCreacion: new Date().toISOString(),
                documentosPendientes: 2
            };

            onSave(tercero);
            toast({
                title: "¡Éxito!",
                description: `Tercero ${mode === "create" ? "creado" : "actualizado"} correctamente`,
                variant: "default"
            });
            onClose();
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo guardar el tercero",
                variant: "destructive"
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20 border-2 border-border/50 shadow-2xl">
                <DialogHeader className="space-y-4 pb-6 border-b border-border/50">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                        {mode === "create" ? (
                            <>
                                <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                                    Crear Nuevo Tercero
                                </span>
                            </>
                        ) : (
                            <>
                                <div className="p-2 bg-warning/10 rounded-lg border border-warning/20">
                                    <Building className="h-6 w-6 text-warning" />
                                </div>
                                <span className="bg-gradient-to-r from-warning to-orange-600 bg-clip-text text-transparent">
                                    Editar Tercero
                                </span>
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground leading-relaxed">
                        {mode === "create"
                            ? "Completa la información para registrar un nuevo tercero en el sistema EURO. Todos los campos marcados con (*) son obligatorios."
                            : "Modifica la información del tercero seleccionado. Los cambios se aplicarán inmediatamente tras la confirmación."
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="overflow-y-auto max-h-[calc(95vh-200px)] px-1">
                    {saving && (
                        <Card className="mb-6 border-primary/30 bg-primary/5 backdrop-blur-sm">
                            <CardContent className="pt-6">
                                <ProgressLoading 
                                progress={saveProgress} 
                                label={`Guardando tercero... ${saveProgress}%`}
                            />
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Información Básica */}
                    <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-secondary/10 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-600/10 border-b border-border/50">
                            <CardTitle className="flex items-center gap-3 text-lg">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent font-bold">
                                    Información Básica
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div>
                                <Label htmlFor="nombre">Nombre o Razón Social *</Label>
                                <Input
                                    id="nombre"
                                    value={formData.nombre}
                                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                                    placeholder="Ingresa el nombre completo"
                                    className={errors.nombre ? "border-destructive" : ""}
                                />
                                {errors.nombre && (
                                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.nombre}
                                    </p>
                                )}
                            </div>

                            <SelectWithOptions
                                label="Tipo de Tercero *"
                                options={tiposOptions}
                                value={formData.tipo}
                                onValueChange={(value) => handleInputChange("tipo", value)}
                                placeholder="Selecciona el tipo"
                            />
                            {errors.tipo && (
                                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {errors.tipo}
                                </p>
                            )}

                            {formData.tipo && (
                                <>
                                    <SelectWithOptions
                                        label="Categoría *"
                                        options={getCategoriaOptions()}
                                        value={formData.categoria}
                                        onValueChange={(value) => handleInputChange("categoria", value)}
                                        placeholder="Selecciona la categoría"
                                        loading={false}
                                    />
                                    {errors.categoria && (
                                        <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                                            <AlertCircle className="h-4 w-4" />
                                            {errors.categoria}
                                        </p>
                                    )}
                                </>
                            )}

                            <div>
                                <Label htmlFor="documentoIdentidad">Documento de Identidad *</Label>
                                <Input
                                    id="documentoIdentidad"
                                    value={formData.documentoIdentidad}
                                    onChange={(e) => handleInputChange("documentoIdentidad", e.target.value)}
                                    placeholder="Número de documento"
                                    className={errors.documentoIdentidad ? "border-destructive" : ""}
                                />
                                {errors.documentoIdentidad && (
                                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.documentoIdentidad}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Información de Contacto */}
                    <Card className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200/50 dark:border-blue-800/50 hover:shadow-md transition-all duration-300">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-blue-900 dark:text-blue-100">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-xl font-semibold">Información de Contacto</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="email">Correo Electrónico *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    placeholder="correo@ejemplo.com"
                                    className={errors.email ? "border-destructive" : ""}
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="telefono">Teléfono *</Label>
                                <Input
                                    id="telefono"
                                    value={formData.telefono}
                                    onChange={(e) => handleInputChange("telefono", e.target.value)}
                                    placeholder="+57 300 123 4567"
                                    className={errors.telefono ? "border-destructive" : ""}
                                />
                                {errors.telefono && (
                                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.telefono}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="direccion">Dirección</Label>
                                <Textarea
                                    id="direccion"
                                    value={formData.direccion}
                                    onChange={(e) => handleInputChange("direccion", e.target.value)}
                                    placeholder="Dirección completa"
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="ciudad">Ciudad</Label>
                                    <Input
                                        id="ciudad"
                                        value={formData.ciudad}
                                        onChange={(e) => handleInputChange("ciudad", e.target.value)}
                                        placeholder="Ciudad"
                                    />
                                </div>
                                <SelectWithOptions
                                    label="País"
                                    options={paisesOptions}
                                    value={formData.pais}
                                    onValueChange={(value) => handleInputChange("pais", value)}
                                    placeholder="Selecciona el país"
                                />
                            </div>

                            <div>
                                <Label htmlFor="responsable">Responsable *</Label>
                                <Input
                                    id="responsable"
                                    value={formData.responsable}
                                    onChange={(e) => handleInputChange("responsable", e.target.value)}
                                    placeholder="Nombre del responsable"
                                    className={errors.responsable ? "border-destructive" : ""}
                                />
                                {errors.responsable && (
                                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.responsable}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Resumen */}
                {formData.nombre && formData.tipo && (
                    <Card className="mt-8 bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200/50 dark:border-emerald-800/50 shadow-sm hover:shadow-md transition-all duration-300">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-emerald-900 dark:text-emerald-100">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <span className="text-xl font-semibold">Resumen de Información</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white/60 dark:bg-gray-900/40 p-4 rounded-lg border border-emerald-200/30 dark:border-emerald-800/30">
                                    <span className="font-medium text-emerald-800 dark:text-emerald-200 text-sm uppercase tracking-wide">Nombre:</span>
                                    <p className="text-gray-700 dark:text-gray-300 font-medium mt-1">{formData.nombre}</p>
                                </div>
                                <div className="bg-white/60 dark:bg-gray-900/40 p-4 rounded-lg border border-emerald-200/30 dark:border-emerald-800/30">
                                    <span className="font-medium text-emerald-800 dark:text-emerald-200 text-sm uppercase tracking-wide">Tipo:</span>
                                    <Badge variant="secondary" className="mt-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700">
                                        {formData.tipo}
                                    </Badge>
                                </div>
                                <div className="bg-white/60 dark:bg-gray-900/40 p-4 rounded-lg border border-emerald-200/30 dark:border-emerald-800/30">
                                    <span className="font-medium text-emerald-800 dark:text-emerald-200 text-sm uppercase tracking-wide">Categoría:</span>
                                    <p className="text-gray-700 dark:text-gray-300 font-medium mt-1">{formData.categoria || "Sin seleccionar"}</p>
                                </div>
                                <div className="bg-white/60 dark:bg-gray-900/40 p-4 rounded-lg border border-emerald-200/30 dark:border-emerald-800/30">
                                    <span className="font-medium text-emerald-800 dark:text-emerald-200 text-sm uppercase tracking-wide">Email:</span>
                                    <p className="text-gray-700 dark:text-gray-300 font-medium mt-1 truncate">{formData.email || "Sin especificar"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
                </div>

                {/* Botones de Acción Mejorados */}
                <div className="flex justify-end gap-3 pt-6 border-t border-border/50 bg-secondary/20 -mx-6 -mb-6 px-6 pb-6 mt-6">
                    <Button 
                        variant="outline" 
                        onClick={onClose} 
                        disabled={saving}
                        className="min-w-[120px] border-2 hover:border-destructive/50 hover:bg-destructive/5"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="min-w-[150px] bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                {mode === "create" ? "Crear Tercero" : "Actualizar Tercero"}
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
