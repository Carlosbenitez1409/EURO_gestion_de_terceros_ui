import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
    Upload,
    Check,
    ArrowLeft,
    ArrowRight,
    FileText,
    User,
    Building2,
    MapPin,
    Phone,
    Mail,
    FileCheck,
    Star,
    ShoppingCart,
    CheckCircle,
    AlertCircle,
    X,
    Eye,
    Shield,
    CreditCard,
    Globe,
    Users,
    Plus,
    Trash2,
    Info,
    HelpCircle,
    Calendar,
    DollarSign
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import React from "react";

interface FormularioData {
    // 1. Identificación
    tipoFormulario: "vinculacion" | "actualizacion" | "";
    tipoPersona: "natural" | "juridica" | "publica" | "";
    tipoDocumento: string;
    numeroDocumento: string;
    digitoVerificacion: string;
    nombreCompleto: string;
    fechaExpedicion: string;
    actividadEconomica: string;
    codigoCIIU: string;

    // Información de contacto
    direccion: string;
    ciudad: string;
    departamento: string;
    pais: string;
    telefono: string;
    celular: string;
    correoElectronico: string;

    // 2. Información General y Representantes
    representantesLegales: RepresentanteLegal[];
    composicionAccionaria: Accionista[];

    // 3. Calidad Tributaria y Financiera
    responsableIVA: boolean;
    correoFacturacion: string;
    granContribuyente: boolean;
    autorretenedor: boolean;
    exentoRenta: boolean;
    ingresoMensual: string;
    costosGastos: string;
    otrosIngresos: string;
    totalIngresos: string;
    activos: string;
    pasivos: string;
    patrimonio: string;
    detalleOtrosIngresos: string;

    // 4. Operaciones, Observaciones y Pago
    operacionesMonedaExtranjera: boolean;
    condicionesPago: string;
    observaciones: string;

    // 5. Documentos
    documentos: { [key: string]: File | null };

    // 6. Declaraciones y Autorizaciones
    personaExpuestaPoliticamente: boolean;
    explicacionPEP: string;
    origenFondos: string;
    tiposTransaccion: string[];
    manejoAltoEfectivo: boolean;
    autorizacionDatos: boolean;
}

interface RepresentanteLegal {
    id: string;
    nombreCompleto: string;
    tipoDocumento: string;
    numeroDocumento: string;
    direccion: string;
    telefono: string;
}

interface Accionista {
    id: string;
    nombre: string;
    tipoDocumento: string;
    numeroDocumento: string;
    porcentajeParticipacion: number;
}

interface FormularioVinculacionProps {
    isOpen: boolean;
    onClose: () => void;
    onBackToLogin?: () => void;
    modo?: "registro" | "edicion";
    terceroId?: string;
}

export function FormularioVinculacion({
    isOpen,
    onClose,
    onBackToLogin,
    modo = "registro",
    terceroId
}: FormularioVinculacionProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState<FormularioData>({
        tipoFormulario: "",
        tipoPersona: "",
        tipoDocumento: "",
        numeroDocumento: "",
        digitoVerificacion: "",
        nombreCompleto: "",
        fechaExpedicion: "",
        actividadEconomica: "",
        codigoCIIU: "",
        direccion: "",
        ciudad: "",
        departamento: "",
        pais: "Colombia",
        telefono: "",
        celular: "",
        correoElectronico: "",
        representantesLegales: [],
        composicionAccionaria: [],
        responsableIVA: false,
        correoFacturacion: "",
        granContribuyente: false,
        autorretenedor: false,
        exentoRenta: false,
        ingresoMensual: "",
        costosGastos: "",
        otrosIngresos: "",
        totalIngresos: "",
        activos: "",
        pasivos: "",
        patrimonio: "",
        detalleOtrosIngresos: "",
        operacionesMonedaExtranjera: false,
        condicionesPago: "",
        observaciones: "",
        documentos: {},
        personaExpuestaPoliticamente: false,
        explicacionPEP: "",
        origenFondos: "",
        tiposTransaccion: [],
        manejoAltoEfectivo: false,
        autorizacionDatos: false
    });

    // Configuración de pasos
    const steps = [
        {
            id: 1,
            title: "Identificación",
            subtitle: "Datos básicos y contacto",
            icon: User,
            description: "Información personal o empresarial básica y datos de contacto"
        },
        {
            id: 2,
            title: "Representantes",
            subtitle: "Información general",
            icon: Users,
            description: "Representantes legales y composición accionaria"
        },
        {
            id: 3,
            title: "Tributaria",
            subtitle: "Calidad tributaria",
            icon: CreditCard,
            description: "Información tributaria y financiera"
        },
        {
            id: 4,
            title: "Operaciones",
            subtitle: "Condiciones comerciales",
            icon: Globe,
            description: "Operaciones, condiciones de pago y observaciones"
        },
        {
            id: 5,
            title: "Documentos",
            subtitle: "Carga de archivos",
            icon: FileText,
            description: "Documentos requeridos según tipo de persona"
        },
        {
            id: 6,
            title: "Declaraciones",
            subtitle: "Autorizaciones",
            icon: Shield,
            description: "Declaraciones legales y autorizaciones"
        }
    ];

    // Documentos requeridos según tipo de persona
    const documentosRequeridos = {
        natural: [
            { key: "cedula", label: "Documento de Identidad", required: true },
            { key: "rut", label: "RUT (vigencia <30 días)", required: true },
            { key: "firma", label: "Firma autorizada", required: true },
            { key: "estadosFinancieros", label: "Estados Financieros (2 años)", required: false },
            { key: "declaracionRenta", label: "Declaración de Renta", required: true },
            { key: "certificacionComercial1", label: "Certificación Comercial 1", required: true },
            { key: "certificacionComercial2", label: "Certificación Comercial 2", required: true },
            { key: "certificacionBancaria", label: "Certificación Bancaria", required: true }
        ],
        juridica: [
            { key: "cedulaRepLegal", label: "Documento ID Rep. Legal", required: true },
            { key: "rut", label: "RUT (vigencia <30 días)", required: true },
            { key: "firma", label: "Firma autorizada", required: true },
            { key: "certificadoExistencia", label: "Certificado de Existencia y Representación", required: true },
            { key: "composicionAccionaria", label: "Composición Accionaria Certificada", required: true },
            { key: "estadosFinancieros", label: "Estados Financieros Comparativos (2 años)", required: true },
            { key: "declaracionRenta", label: "Declaración de Renta", required: true },
            { key: "certificacionComercial1", label: "Certificación Comercial 1", required: true },
            { key: "certificacionComercial2", label: "Certificación Comercial 2", required: true },
            { key: "certificacionBancaria", label: "Certificación Bancaria", required: true }
        ],
        publica: [
            { key: "actosAdministrativos", label: "Actos Administrativos de Creación", required: true },
            { key: "rut", label: "RUT (vigencia <30 días)", required: true },
            { key: "certificadoExistencia", label: "Certificado de Existencia y Representación", required: true },
            { key: "estadosFinancieros", label: "Estados Financieros (2 años)", required: true },
            { key: "certificacionBancaria", label: "Certificación Bancaria", required: true }
        ]
    };

    // Calcular progreso
    const calculateProgress = () => {
        const stepProgress = (currentStep / steps.length) * 100;
        return Math.min(stepProgress, 100);
    };

    const progress = calculateProgress();

    // Agregar representante legal
    const addRepresentanteLegal = () => {
        const newRepresentante: RepresentanteLegal = {
            id: Date.now().toString(),
            nombreCompleto: "",
            tipoDocumento: "",
            numeroDocumento: "",
            direccion: "",
            telefono: ""
        };
        setFormData(prev => ({
            ...prev,
            representantesLegales: [...prev.representantesLegales, newRepresentante]
        }));
    };

    // Remover representante legal
    const removeRepresentanteLegal = (id: string) => {
        setFormData(prev => ({
            ...prev,
            representantesLegales: prev.representantesLegales.filter(rep => rep.id !== id)
        }));
    };

    // Agregar accionista
    const addAccionista = () => {
        const newAccionista: Accionista = {
            id: Date.now().toString(),
            nombre: "",
            tipoDocumento: "",
            numeroDocumento: "",
            porcentajeParticipacion: 0
        };
        setFormData(prev => ({
            ...prev,
            composicionAccionaria: [...prev.composicionAccionaria, newAccionista]
        }));
    };

    // Remover accionista
    const removeAccionista = (id: string) => {
        setFormData(prev => ({
            ...prev,
            composicionAccionaria: prev.composicionAccionaria.filter(acc => acc.id !== id)
        }));
    };

    // Manejar carga de archivos
    const handleFileUpload = (key: string, file: File | null) => {
        setFormData(prev => ({
            ...prev,
            documentos: {
                ...prev.documentos,
                [key]: file
            }
        }));
    };

    // Validar paso actual
    const validateCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return formData.tipoFormulario && formData.tipoPersona &&
                    formData.tipoDocumento && formData.numeroDocumento &&
                    formData.nombreCompleto && formData.correoElectronico;
            case 2:
                if (formData.tipoPersona === "juridica") {
                    return formData.representantesLegales.length > 0;
                }
                return true;
            case 3:
                return formData.correoFacturacion;
            case 4:
                return formData.condicionesPago;
            case 5:
                const docsRequeridos = documentosRequeridos[formData.tipoPersona as keyof typeof documentosRequeridos] || [];
                const docsObligatorios = docsRequeridos.filter(doc => doc.required);
                return docsObligatorios.every(doc => formData.documentos[doc.key]);
            case 6:
                return formData.autorizacionDatos;
            default:
                return true;
        }
    };

    // Navegar al siguiente paso
    const handleNext = () => {
        if (validateCurrentStep()) {
            setCurrentStep(prev => Math.min(steps.length, prev + 1));
        } else {
            toast({
                title: "Campos requeridos",
                description: "Por favor complete todos los campos obligatorios antes de continuar.",
                variant: "destructive"
            });
        }
    };

    // Enviar formulario
    const handleSubmit = async () => {
        if (!validateCurrentStep()) {
            toast({
                title: "Formulario incompleto",
                description: "Por favor complete todos los campos obligatorios.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            // Aquí iría la lógica de envío
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulación

            toast({
                title: "¡Solicitud enviada!",
                description: "Su solicitud de vinculación ha sido enviada exitosamente.",
                variant: "default"
            });

            onClose();
        } catch (error) {
            toast({
                title: "Error",
                description: "Ocurrió un error al enviar la solicitud. Intente nuevamente.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Renderizar contenido del paso actual
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return renderIdentificacion();
            case 2:
                return renderRepresentantes();
            case 3:
                return renderTributaria();
            case 4:
                return renderOperaciones();
            case 5:
                return renderDocumentos();
            case 6:
                return renderDeclaraciones();
            default:
                return null;
        }
    };

    // Paso 1: Identificación
    const renderIdentificacion = () => (
        <div className="space-y-8">
            {/* Tipo de Formulario */}
            <div className="grid gap-6">
                <div className="space-y-4">
                    <Label className="text-[#0033A0] font-semibold text-lg">Tipo de Formulario</Label>
                    <RadioGroup
                        value={formData.tipoFormulario}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, tipoFormulario: value as any }))}
                        className="flex gap-6"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="vinculacion" id="vinculacion" />
                            <Label htmlFor="vinculacion" className="text-[#0033A0] cursor-pointer">Vinculación</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="actualizacion" id="actualizacion" />
                            <Label htmlFor="actualizacion" className="text-[#0033A0] cursor-pointer">Actualización</Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Tipo de Persona */}
                <div className="space-y-4">
                    <Label className="text-[#0033A0] font-semibold text-lg">Tipo de Persona</Label>
                    <RadioGroup
                        value={formData.tipoPersona}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, tipoPersona: value as any }))}
                        className="flex gap-6"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="natural" id="natural" />
                            <Label htmlFor="natural" className="text-[#0033A0] cursor-pointer">Natural</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="juridica" id="juridica" />
                            <Label htmlFor="juridica" className="text-[#0033A0] cursor-pointer">Jurídica</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="publica" id="publica" />
                            <Label htmlFor="publica" className="text-[#0033A0] cursor-pointer">Pública</Label>
                        </div>
                    </RadioGroup>
                </div>
            </div>

            <Separator className="bg-[#0033A0]/20" />

            {/* Identificación */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="tipoDocumento" className="text-[#0033A0] font-semibold">
                        Tipo de Documento *
                    </Label>
                    <Select
                        value={formData.tipoDocumento}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, tipoDocumento: value }))}
                    >
                        <SelectTrigger className="border-[#0033A0]/30 focus:border-[#0033A0]">
                            <SelectValue placeholder="Seleccione tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                            <SelectItem value="NIT">NIT</SelectItem>
                            <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                            <SelectItem value="PPN">Pasaporte</SelectItem>
                            <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="numeroDocumento" className="text-[#0033A0] font-semibold">
                        Número de Identificación *
                    </Label>
                    <Input
                        id="numeroDocumento"
                        placeholder="Número de documento"
                        value={formData.numeroDocumento}
                        onChange={(e) => setFormData(prev => ({ ...prev, numeroDocumento: e.target.value }))}
                        className="border-[#0033A0]/30 focus:border-[#0033A0]"
                    />
                </div>

                {formData.tipoPersona === "juridica" && (
                    <div className="space-y-2">
                        <Label htmlFor="digitoVerificacion" className="text-[#0033A0] font-semibold">
                            Dígito de Verificación
                        </Label>
                        <Input
                            id="digitoVerificacion"
                            placeholder="DV"
                            maxLength={1}
                            value={formData.digitoVerificacion}
                            onChange={(e) => setFormData(prev => ({ ...prev, digitoVerificacion: e.target.value }))}
                            className="border-[#0033A0]/30 focus:border-[#0033A0]"
                        />
                    </div>
                )}
            </div>

            {/* Nombre/Razón Social */}
            <div className="space-y-2">
                <Label htmlFor="nombreCompleto" className="text-[#0033A0] font-semibold">
                    {formData.tipoPersona === "natural" ? "Nombre Completo" : "Razón Social"} *
                </Label>
                <Input
                    id="nombreCompleto"
                    placeholder={formData.tipoPersona === "natural" ? "Nombres y apellidos" : "Razón social completa"}
                    value={formData.nombreCompleto}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombreCompleto: e.target.value }))}
                    className="border-[#0033A0]/30 focus:border-[#0033A0]"
                />
            </div>

            {/* Fecha de Expedición/Nacimiento */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="fechaExpedicion" className="text-[#0033A0] font-semibold">
                        {formData.tipoPersona === "natural" ? "Fecha de Nacimiento" : "Fecha de Expedición"} *
                    </Label>
                    <Input
                        id="fechaExpedicion"
                        type="date"
                        value={formData.fechaExpedicion}
                        onChange={(e) => setFormData(prev => ({ ...prev, fechaExpedicion: e.target.value }))}
                        className="border-[#0033A0]/30 focus:border-[#0033A0]"
                    />
                </div>
            </div>

            {/* Actividad Económica */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="actividadEconomica" className="text-[#0033A0] font-semibold">
                        Actividad Económica Principal *
                    </Label>
                    <Input
                        id="actividadEconomica"
                        placeholder="Descripción de la actividad"
                        value={formData.actividadEconomica}
                        onChange={(e) => setFormData(prev => ({ ...prev, actividadEconomica: e.target.value }))}
                        className="border-[#0033A0]/30 focus:border-[#0033A0]"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="codigoCIIU" className="text-[#0033A0] font-semibold flex items-center gap-2">
                        Código CIIU *
                        <HelpCircle
                            className="h-4 w-4 text-[#FFD700] cursor-help"
                            data-tooltip="Código de Clasificación Internacional Industrial Uniforme"
                        />
                    </Label>
                    <Input
                        id="codigoCIIU"
                        placeholder="Ej: 4711"
                        value={formData.codigoCIIU}
                        onChange={(e) => setFormData(prev => ({ ...prev, codigoCIIU: e.target.value }))}
                        className="border-[#0033A0]/30 focus:border-[#0033A0]"
                    />
                </div>
            </div>

            <Separator className="bg-[#0033A0]/20" />

            {/* Información de Contacto */}
            <div className="space-y-6">
                <h3 className="text-lg font-semibold text-[#0033A0] flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#FFD700]" />
                    Información de Contacto
                </h3>

                <div className="space-y-2">
                    <Label htmlFor="direccion" className="text-[#0033A0] font-semibold">
                        Dirección *
                    </Label>
                    <Input
                        id="direccion"
                        placeholder="Dirección completa"
                        value={formData.direccion}
                        onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                        className="border-[#0033A0]/30 focus:border-[#0033A0]"
                    />
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="ciudad" className="text-[#0033A0] font-semibold">
                            Ciudad *
                        </Label>
                        <Input
                            id="ciudad"
                            placeholder="Ciudad"
                            value={formData.ciudad}
                            onChange={(e) => setFormData(prev => ({ ...prev, ciudad: e.target.value }))}
                            className="border-[#0033A0]/30 focus:border-[#0033A0]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="departamento" className="text-[#0033A0] font-semibold">
                            Departamento *
                        </Label>
                        <Input
                            id="departamento"
                            placeholder="Departamento"
                            value={formData.departamento}
                            onChange={(e) => setFormData(prev => ({ ...prev, departamento: e.target.value }))}
                            className="border-[#0033A0]/30 focus:border-[#0033A0]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pais" className="text-[#0033A0] font-semibold">
                            País *
                        </Label>
                        <Select
                            value={formData.pais}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, pais: value }))}
                        >
                            <SelectTrigger className="border-[#0033A0]/30 focus:border-[#0033A0]">
                                <SelectValue placeholder="Seleccione país" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Colombia">Colombia</SelectItem>
                                <SelectItem value="Venezuela">Venezuela</SelectItem>
                                <SelectItem value="Ecuador">Ecuador</SelectItem>
                                <SelectItem value="Perú">Perú</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="telefono" className="text-[#0033A0] font-semibold">
                            Teléfono
                        </Label>
                        <Input
                            id="telefono"
                            placeholder="Teléfono fijo"
                            value={formData.telefono}
                            onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                            className="border-[#0033A0]/30 focus:border-[#0033A0]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="celular" className="text-[#0033A0] font-semibold">
                            Celular
                        </Label>
                        <Input
                            id="celular"
                            placeholder="Número celular"
                            value={formData.celular}
                            onChange={(e) => setFormData(prev => ({ ...prev, celular: e.target.value }))}
                            className="border-[#0033A0]/30 focus:border-[#0033A0]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="correoElectronico" className="text-[#0033A0] font-semibold">
                            Correo Electrónico *
                        </Label>
                        <Input
                            id="correoElectronico"
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={formData.correoElectronico}
                            onChange={(e) => setFormData(prev => ({ ...prev, correoElectronico: e.target.value }))}
                            className="border-[#0033A0]/30 focus:border-[#0033A0]"
                        />
                    </div>
                </div>
            </div>

            <Alert className="border-[#FFD700]/50 bg-[#FFD700]/10">
                <Info className="h-4 w-4 text-[#0033A0]" />
                <AlertDescription className="text-[#0033A0]">
                    Los campos marcados con (*) son obligatorios. Esta información será utilizada para
                    el proceso de vinculación y comunicaciones oficiales.
                </AlertDescription>
            </Alert>
        </div>
    );

    // Paso 2: Representantes (placeholder por ahora)
    const renderRepresentantes = () => (
        <div className="min-h-[400px] flex items-center justify-center">
            <p className="text-[#0033A0]/70 text-lg">
                Paso 2: Representantes Legales y Composición Accionaria
            </p>
        </div>
    );

    // Paso 3: Tributaria (placeholder por ahora)
    const renderTributaria = () => (
        <div className="min-h-[400px] flex items-center justify-center">
            <p className="text-[#0033A0]/70 text-lg">
                Paso 3: Calidad Tributaria y Financiera
            </p>
        </div>
    );

    // Paso 4: Operaciones (placeholder por ahora)
    const renderOperaciones = () => (
        <div className="min-h-[400px] flex items-center justify-center">
            <p className="text-[#0033A0]/70 text-lg">
                Paso 4: Operaciones, Observaciones y Pago
            </p>
        </div>
    );

    // Paso 5: Documentos (placeholder por ahora)
    const renderDocumentos = () => (
        <div className="min-h-[400px] flex items-center justify-center">
            <p className="text-[#0033A0]/70 text-lg">
                Paso 5: Carga de Documentos
            </p>
        </div>
    );

    // Paso 6: Declaraciones (placeholder por ahora)
    const renderDeclaraciones = () => (
        <div className="min-h-[400px] flex items-center justify-center">
            <p className="text-[#0033A0]/70 text-lg">
                Paso 6: Declaraciones y Autorizaciones
            </p>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0033A0] via-[#0033A0]/90 to-[#001A5C] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Elementos decorativos de fondo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 opacity-10">
                    <Star className="h-32 w-32 text-yellow-400 animate-pulse" />
                </div>
                <div className="absolute top-1/4 right-20 opacity-10">
                    <ShoppingCart className="h-28 w-28 text-yellow-400 animate-bounce" style={{ animationDuration: '4s' }} />
                </div>
                <div className="absolute bottom-20 left-1/4 opacity-10">
                    <CheckCircle className="h-24 w-24 text-yellow-400 animate-pulse" style={{ animationDelay: '2s' }} />
                </div>
            </div>

            <div className="w-full max-w-6xl space-y-8 z-10">
                {/* Header con logo y navegación */}
                <div className="text-center space-y-6">
                    <div className="flex items-center justify-between">
                        {onBackToLogin && (
                            <Button
                                onClick={onBackToLogin}
                                className="bg-[#FFD700] hover:bg-[#FFC107] text-[#0033A0] font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-white/20 flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Volver al Login
                            </Button>
                        )}

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#FFD700] to-[#FFC107] rounded-2xl flex items-center justify-center shadow-lg border-4 border-white/20">
                                    <div className="relative">
                                        <Building2 className="h-8 w-8 text-[#0033A0]" />
                                        <div className="absolute -top-1 -right-1">
                                            <Star className="h-4 w-4 text-[#0033A0] fill-current" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-left">
                                <h1 className="text-3xl font-black text-white">
                                    <span className="text-[#FFD700]">E</span>URO
                                </h1>
                                <p className="text-white/90 font-medium">
                                    Formulario de {formData.tipoFormulario === "vinculacion" ? "Vinculación" : "Actualización"}
                                </p>
                            </div>
                        </div>

                        <div className="w-24"></div> {/* Spacer for balance */}
                    </div>
                </div>

                {/* Indicadores de progreso modernos */}
                <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-2xl">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            {steps.map((step, index) => {
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;
                                const isAccessible = currentStep >= step.id;

                                return (
                                    <div key={step.id} className="flex items-center flex-1">
                                        <div className="flex flex-col items-center space-y-2">
                                            <div
                                                className={`
                                                    relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 cursor-pointer
                                                    ${isActive
                                                        ? 'border-[#0033A0] bg-[#0033A0] text-white shadow-lg scale-110'
                                                        : isCompleted
                                                            ? 'border-[#FFD700] bg-[#FFD700] text-[#0033A0] shadow-md'
                                                            : isAccessible
                                                                ? 'border-[#0033A0] bg-[#0033A0]/10 text-[#0033A0] hover:bg-[#0033A0]/20'
                                                                : 'border-gray-300 bg-gray-100 text-gray-500'
                                                    }
                                                `}
                                                onClick={() => isAccessible && setCurrentStep(step.id)}
                                            >
                                                {isCompleted ? (
                                                    <Check className="h-5 w-5" />
                                                ) : (
                                                    <step.icon className="h-5 w-5" />
                                                )}
                                                {isActive && (
                                                    <div className="absolute -inset-1 rounded-full border-2 border-[#0033A0] animate-pulse"></div>
                                                )}
                                            </div>
                                            <div className="text-center max-w-20">
                                                <p className={`text-xs font-medium transition-colors ${isActive ? 'text-[#0033A0]' :
                                                        isCompleted ? 'text-[#FFD700]' :
                                                            isAccessible ? 'text-[#0033A0]' : 'text-gray-500'
                                                    }`}>
                                                    {step.title}
                                                </p>
                                                <p className="text-xs text-[#0033A0]/70 mt-1">
                                                    {step.subtitle}
                                                </p>
                                            </div>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div className={`flex-1 h-px mx-4 transition-colors duration-300 ${currentStep > step.id ? 'bg-[#FFD700]' : 'bg-gray-300'
                                                }`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Barra de progreso */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-[#0033A0]/70">
                                <span>Progreso del formulario</span>
                                <span>{Math.round(progress)}% completado</span>
                            </div>
                            <Progress
                                value={progress}
                                className="h-2 bg-gray-200 border border-gray-300"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Contenido del paso actual */}
                <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-2xl">
                    <CardHeader className="bg-gradient-to-r from-[#0033A0]/5 to-[#FFD700]/5 border-b border-gray-200">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-[#0033A0]/10 rounded-lg">
                                {React.createElement(steps[currentStep - 1].icon, {
                                    className: "h-6 w-6 text-[#0033A0]"
                                })}
                            </div>
                            <div>
                                <CardTitle className="text-xl text-[#0033A0]">
                                    {steps[currentStep - 1].title}
                                </CardTitle>
                                <CardDescription className="text-[#0033A0]/70">
                                    {steps[currentStep - 1].description}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        {renderStepContent()}
                    </CardContent>
                </Card>

                {/* Botones de navegación */}
                <div className="flex justify-between items-center">
                    <Button
                        onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                        disabled={currentStep === 1}
                        className="flex items-center gap-2 bg-white hover:bg-[#0033A0]/5 border-[#0033A0]/30 text-[#0033A0] disabled:opacity-50 transition-all duration-200"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Anterior
                    </Button>

                    <div className="flex items-center gap-2 text-sm text-[#0033A0]/70">
                        <span>Paso {currentStep} de {steps.length}</span>
                    </div>

                    {currentStep < steps.length ? (
                        <Button
                            onClick={handleNext}
                            className="flex items-center gap-2 bg-[#0033A0] hover:bg-[#0033A0]/90 text-white shadow-lg transition-all duration-200"
                        >
                            Siguiente
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 bg-[#FFD700] hover:bg-[#FFC107] text-[#0033A0] shadow-lg transition-all duration-200 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0033A0]"></div>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4" />
                                    Enviar Solicitud
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
